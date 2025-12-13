
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (user: Partial<User>, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPw: string, newPw: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getAllUsers: () => User[]; // For Social Features
  isAuthenticated: boolean;
  isLoading: boolean;
  isRecoveryMode: boolean; // NEW: Detects if user clicked email link
  completeRecovery: () => void; // NEW: Clears recovery mode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Initialize Auth Listener
  useEffect(() => {
    let mounted = true;

    // MANUAL CHECK: Check URL hash immediately for recovery flow markers.
    // This is crucial because HashRouter might consume the hash or the event listener might attach too late.
    // Supabase reset links look like: .../#access_token=...&type=recovery...
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
        console.log("Recovery mode detected via Hash");
        setIsRecoveryMode(true);
    }

    const fetchProfile = async (sessionUser: any) => {
        if (!sessionUser) {
            if (mounted) {
                setUser(null);
                setLoading(false);
            }
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            if (mounted) {
                if (data && !error) {
                    setUser({
                        id: data.id,
                        email: data.email,
                        username: data.username,
                        avatar: data.avatar,
                        firstName: data.first_name,
                        lastName: data.last_name,
                        role: data.role as UserRole,
                        isStatsPublic: data.is_stats_public,
                        createdAt: new Date(data.created_at).getTime()
                    });
                } else {
                    console.error("Profile fetch error", error);
                }
                setLoading(false);
            }
        } catch (e) {
            console.error("Profile fetch exception", e);
            if (mounted) setLoading(false);
        }
    };

    supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            console.error("Session init error:", error);
            if (mounted) setLoading(false);
        } else {
            fetchProfile(data.session?.user);
        }
    }).catch(err => {
        console.error("Supabase client connection error:", err);
        if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (mounted) {
            // Event driven check
            if (event === 'PASSWORD_RECOVERY') {
                console.log("Recovery mode detected via Event");
                setIsRecoveryMode(true);
            }
            fetchProfile(session?.user);
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  // Fetch all users for social features (Only if authenticated)
  useEffect(() => {
      if (user) {
          const loadUsers = async () => {
              const { data } = await supabase.from('profiles').select('*');
              if (data) {
                  setAllUsers(data.map((u: any) => ({
                      id: u.id,
                      email: u.email,
                      username: u.username,
                      avatar: u.avatar,
                      role: u.role as UserRole,
                      isStatsPublic: u.is_stats_public,
                      createdAt: new Date(u.created_at).getTime()
                  })));
              }
          };
          loadUsers();
      }
  }, [user]);

  const login = async (emailOrUsername: string, passwordAttempt: string) => {
    let finalEmail = emailOrUsername;
    
    // Check if input looks like an email
    if (!emailOrUsername.includes('@')) {
        // Assume it's a username and try to find the email
        // Note: This requires the 'profiles' table to be readable (which it is per our policy)
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', emailOrUsername)
            .single();
            
        if (error || !data || !data.email) {
            throw new Error("Benutzername nicht gefunden. Bitte E-Mail verwenden.");
        }
        finalEmail = data.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: passwordAttempt
    });

    if (error) throw new Error(error.message);
  };

  const register = async (newUser: Partial<User>, password: string) => {
    // Check if username is taken
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', newUser.username)
        .single();
        
    if (existingUser) {
        throw new Error("Dieser Benutzername ist bereits vergeben.");
    }

    const { error } = await supabase.auth.signUp({
        email: newUser.email!,
        password: password,
        options: {
            data: {
                username: newUser.username,
                role: 'USER'
            }
        }
    });

    if (error) throw new Error(error.message);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    const updates: any = {};
    if (data.username) updates.username = data.username;
    if (data.avatar) updates.avatar = data.avatar;
    if (data.firstName) updates.first_name = data.firstName;
    if (data.lastName) updates.last_name = data.lastName;
    if (data.isStatsPublic !== undefined) updates.is_stats_public = data.isStatsPublic;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) throw new Error(error.message);
    
    // Local update
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const changePassword = async (oldPw: string, newPw: string) => {
     // For password change within app (verified session)
     const { error } = await supabase.auth.updateUser({ password: newPw });
     if (error) throw new Error(error.message);
  };

  const resetPassword = async (email: string) => {
     // redirectTo ensures the user comes back to the app root.
     // We use window.location.origin to point to the currently running domain/port.
     // IMPORTANT: This origin (e.g. http://localhost:3000) must be whitelisted in Supabase Dashboard -> Auth -> URL Configuration.
     const { error } = await supabase.auth.resetPasswordForEmail(email, {
         redirectTo: window.location.origin, 
     });
     if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsRecoveryMode(false);
  };

  const completeRecovery = () => {
      setIsRecoveryMode(false);
      // Clean URL hash so we don't trigger recovery again on refresh
      window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        login, 
        register, 
        logout, 
        updateProfile, 
        changePassword, 
        resetPassword, 
        isAuthenticated: !!user, 
        isLoading: loading, 
        getAllUsers: () => allUsers,
        isRecoveryMode,
        completeRecovery 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
