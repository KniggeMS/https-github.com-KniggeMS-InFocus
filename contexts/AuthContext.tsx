
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';

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
  // Admin Notification State
  adminNotification: string | null;
  dismissAdminNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  // Initialize Auth Listener
  useEffect(() => {
    let mounted = true;

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

    // Use async IIFE inside useEffect
    const initSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Session init error:", error);
                if (mounted) setLoading(false);
            } else {
                await fetchProfile(data.session?.user);
            }
        } catch (err) {
             console.error("Supabase client connection error:", err);
             if (mounted) setLoading(false);
        }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (mounted) {
            if (event === 'PASSWORD_RECOVERY') {
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

  // Admin Surveillance Listener
  useEffect(() => {
      if (user && user.role === UserRole.ADMIN) {
          const channel = supabase.channel('system_monitor')
              .on('broadcast', { event: 'user_activity' }, (payload) => {
                  if (payload.payload.type === 'LOGIN') {
                      setAdminNotification(`Login erkannt: ${payload.payload.username}`);
                      setTimeout(() => setAdminNotification(null), 5000);
                  }
              })
              .subscribe();

          return () => {
              supabase.removeChannel(channel);
          };
      }
  }, [user]);

  // Fetch all users for social features
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

  const login = async (emailInput: string, passwordAttempt: string) => {
    // Direct Auth Call - No DB Lookup beforehand to avoid RLS/Rate Limits
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordAttempt
    });

    if (error) {
        // Translate common Supabase errors
        if (error.message === "Invalid login credentials") {
            throw new Error("E-Mail oder Passwort falsch.");
        }
        if (error.message.includes("rate limit")) {
            throw new Error("Zu viele Versuche. Bitte warte einen Moment.");
        }
        throw new Error(error.message);
    }

    // Post-Login: Broadcast (Only happens IF login was successful)
    if (authData.user) {
        (async () => {
             try {
                 const { data } = await supabase.from('profiles').select('username').eq('id', authData.user!.id).single();
                 if (data && data.username) {
                     await supabase.channel('system_monitor').send({
                        type: 'broadcast',
                        event: 'user_activity',
                        payload: { type: 'LOGIN', username: data.username }
                    });
                 }
             } catch (e) {
                 // Silent fail for broadcast is acceptable
             }
        })();
    }
  };

  const register = async (newUser: Partial<User>, password: string) => {
    // Check if username exists (Public read might be allowed on username, or this might fail if RLS is strict)
    // We attempt it, but catch errors gracefully.
    try {
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', newUser.username)
            .single();
            
        if (existingUser) {
            throw new Error("Dieser Benutzername ist bereits vergeben.");
        }
    } catch (e: any) {
        // If error is "already taken", rethrow. If it's RLS/Permission (PGRST116 or 406), ignore and proceed to Auth try.
        if (e.message === "Dieser Benutzername ist bereits vergeben.") throw e;
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
    if (data.role) updates.role = data.role;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) throw new Error(error.message);
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const changePassword = async (oldPw: string, newPw: string) => {
     const { error } = await supabase.auth.updateUser({ password: newPw });
     if (error) throw new Error(error.message);
  };

  const resetPassword = async (email: string) => {
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
      window.history.replaceState(null, '', window.location.pathname);
  };

  const dismissAdminNotification = () => setAdminNotification(null);

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
        completeRecovery,
        adminNotification,
        dismissAdminNotification
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
