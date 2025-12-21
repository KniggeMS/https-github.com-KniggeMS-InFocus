
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';
import { addAdminNotification } from '../services/db';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (user: Partial<User>, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPw: string, newPw: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getAllUsers: () => User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isRecoveryMode: boolean;
  completeRecovery: () => void;
  adminNotification: { message: string, type: 'login' | 'register' } | null;
  dismissAdminNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [adminNotification, setAdminNotification] = useState<{ message: string, type: 'login' | 'register' } | null>(null);

  // Initialer Session Check & Profil Laden
  useEffect(() => {
    let mounted = true;

    if (window.location.hash && window.location.hash.includes('type=recovery')) {
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

            if (mounted && data && !error) {
                const userProfile: User = {
                    id: data.id,
                    email: data.email,
                    username: data.username,
                    avatar: data.avatar,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    role: data.role as UserRole,
                    isStatsPublic: data.is_stats_public,
                    createdAt: new Date(data.created_at).getTime(),
                    loginCount: data.login_count || 0,
                    lastLoginAt: data.last_login_at ? new Date(data.last_login_at).getTime() : undefined
                };
                setUser(userProfile);
            }
            if (mounted) setLoading(false);
        } catch (e) {
            if (mounted) setLoading(false);
        }
    };

    const initSession = async () => {
        const { data } = await supabase.auth.getSession();
        await fetchProfile(data.session?.user);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (mounted) {
            if (event === 'PASSWORD_RECOVERY') setIsRecoveryMode(true);
            fetchProfile(session?.user);
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  // System-Überwachung für Admins (Realtime Broadcasts)
  useEffect(() => {
      if (user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) {
          const channel = supabase.channel('admin_surveillance')
              .on('broadcast', { event: 'user_action' }, (payload) => {
                  const { type, username } = payload.payload;
                  if (type === 'REGISTER') {
                      setAdminNotification({ message: `Neu registriert: ${username} 🎉`, type: 'register' });
                  } else if (type === 'LOGIN') {
                      setAdminNotification({ message: `Login: ${username} ist online 🟢`, type: 'login' });
                  }
                  // Auto-Dismiss nach 8 Sekunden
                  setTimeout(() => setAdminNotification(null), 8000);
              })
              .subscribe();

          return () => { supabase.removeChannel(channel); };
      }
  }, [user]);

  // Userliste für Management laden (Admin/Manager only)
  useEffect(() => {
      if (user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) {
          const loadUsers = async () => {
              const { data } = await supabase.from('profiles').select('*').order('last_login_at', { ascending: false });
              if (data) {
                  setAllUsers(data.map((u: any) => ({
                      id: u.id,
                      email: u.email,
                      username: u.username,
                      avatar: u.avatar,
                      role: u.role as UserRole,
                      isStatsPublic: u.is_stats_public,
                      createdAt: new Date(u.created_at).getTime(),
                      loginCount: u.login_count || 0,
                      lastLoginAt: u.last_login_at ? new Date(u.last_login_at).getTime() : undefined
                  })));
              }
          };
          loadUsers();
          
          // Abonnement für Profiländerungen (Realtime)
          const sub = supabase.channel('profiles_changed').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadUsers).subscribe();
          return () => { supabase.removeChannel(sub); };
      }
  }, [user]);

  const login = async (emailInput: string, passwordAttempt: string) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordAttempt
    });

    if (error) throw error;

    if (authData.user) {
        // Login-Statistiken aktualisieren
        const { data: profile } = await supabase.from('profiles').select('login_count, username').eq('id', authData.user.id).single();
        if (profile) {
            const newCount = (profile.login_count || 0) + 1;
            const now = new Date().toISOString();
            await supabase.from('profiles').update({ login_count: newCount, last_login_at: now }).eq('id', authData.user.id);
            
            // Persistente Admin-Benachrichtigung erstellen
            await addAdminNotification('login', `Login: ${profile.username}`, authData.user.id);
        }
    }
  };

  const register = async (newUser: Partial<User>, password: string) => {
    const { data: authData, error } = await supabase.auth.signUp({
        email: newUser.email!.trim(),
        password: password,
        options: { data: { username: newUser.username, role: 'USER' } }
    });

    if (error) throw error;

    if (authData.user) {
      await addAdminNotification('register', `Neuer User: ${newUser.username}`, authData.user.id);
    }
  };

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };
  const dismissAdminNotification = () => setAdminNotification(null);

  return (
    <AuthContext.Provider value={{ 
        user, login, register, logout, 
        updateProfile: async (d) => { await supabase.from('profiles').update(d).eq('id', user?.id); setUser(prev => prev ? {...prev, ...d} : null); }, 
        changePassword: async (o, n) => { await supabase.auth.updateUser({ password: n }); },
        resetPassword: async (e) => { await supabase.auth.resetPasswordForEmail(e); },
        isAuthenticated: !!user, isLoading: loading, getAllUsers: () => allUsers, 
        isRecoveryMode, completeRecovery: () => setIsRecoveryMode(false),
        adminNotification, dismissAdminNotification
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
