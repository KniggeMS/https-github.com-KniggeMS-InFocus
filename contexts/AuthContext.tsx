
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, email: string) => void;
  register: (user: User, password: string) => void; // Password simulation
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  changePassword: (oldPw: string, newPw: string) => void;
  resetPassword: (username: string, email: string, newPw: string) => void;
  getAllUsers: () => User[]; // For Social Features
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'cinelog_users_db';
const CURRENT_USER_KEY = 'cinelog_current_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load session and Seed Test User
  useEffect(() => {
    // 1. Load current session
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }

    // 2. Seed BigDaddy User if missing (For Testing)
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    let users: any[] = usersJson ? JSON.parse(usersJson) : [];
    
    const bigDaddyExists = users.some((u: any) => u.username === 'BigDaddy');
    
    if (!bigDaddyExists) {
        const bigDaddy = {
            id: 'big-daddy-test-id',
            username: 'BigDaddy',
            email: 'big@daddy.com',
            firstName: 'Big',
            lastName: 'Daddy',
            createdAt: Date.now(),
            avatar: null, // User can generate one later
            password: 'password123' // Default password for testing
        };
        users.push(bigDaddy);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        console.log("Test User 'BigDaddy' created. Password: password123");
    }

  }, []);

  const login = (usernameOrEmail: string, passwordAttempt: string) => {
    // In a real app, we would verify password hash. Here we act as a mock DB.
    // Check if user exists in local storage DB
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    const users: any[] = usersJson ? JSON.parse(usersJson) : [];
    
    const foundUser = users.find((u: any) => 
        (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === passwordAttempt
    );

    if (foundUser) {
        const { password, ...safeUser } = foundUser;
        setUser(safeUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    } else {
        throw new Error("Ungültige Zugangsdaten");
    }
  };

  const register = (newUser: User, password: string) => {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    const users: any[] = usersJson ? JSON.parse(usersJson) : [];

    // Check existing
    if (users.some((u: any) => u.username === newUser.username)) {
        throw new Error("Benutzername bereits vergeben");
    }
    if (users.some((u: any) => u.email === newUser.email)) {
        throw new Error("E-Mail bereits verwendet");
    }

    const fullUser = { ...newUser, password }; // Storing password in plain text only because this is a client-side demo!
    users.push(fullUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Auto login
    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    // Update in DB
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    let users: any[] = usersJson ? JSON.parse(usersJson) : [];
    
    users = users.map((u: any) => {
        if (u.id === user.id) {
            return { ...u, ...data };
        }
        return u;
    });
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const changePassword = (oldPw: string, newPw: string) => {
     if (!user) return;
     const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
     let users: any[] = usersJson ? JSON.parse(usersJson) : [];
     
     const dbUser = users.find((u: any) => u.id === user.id);
     if (!dbUser) throw new Error("Benutzer nicht gefunden");
     
     if (dbUser.password !== oldPw) {
         throw new Error("Aktuelles Passwort ist falsch");
     }

     dbUser.password = newPw;
     localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const resetPassword = (username: string, email: string, newPw: string) => {
     const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
     let users: any[] = usersJson ? JSON.parse(usersJson) : [];
     
     const index = users.findIndex((u: any) => u.username === username && u.email === email);
     
     if (index === -1) {
         throw new Error("Benutzer mit dieser E-Mail nicht gefunden");
     }

     users[index].password = newPw;
     localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const getAllUsers = () => {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    const users: any[] = usersJson ? JSON.parse(usersJson) : [];
    return users.map(({ password, ...u }) => u);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, changePassword, resetPassword, isAuthenticated: !!user, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
