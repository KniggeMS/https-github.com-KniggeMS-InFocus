
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

// Cache TTL in Milliseconds (10 Minutes)
const PROFILE_CACHE_TTL = 10 * 60 * 1000;

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
        setIsRecoveryMode(true);
    }

    const fetchProfile = async (sessionUser: any, forceRefresh = false) => {
        if (!sessionUser) {
            if (mounted) {
                setUser(null);
                setLoading(false);
            }
            return;
        }

        const cacheKey = `cinelog_profile_${sessionUser.id}`;
        if (!forceRefresh) {
            try {
                const cachedRaw = localStorage.getItem(cacheKey);
                if (cachedRaw) {
                    const cached = JSON.parse(cachedRaw);
                    if (Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
                        if (mounted) {
                            setUser(cached.data);
                            setLoading(false);
                        }
                        return; 
                    }
                }
            } catch (e) {}
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            if (mounted) {
                if (data && !error) {
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
                    localStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        data: userProfile
                    }));
                }
                setLoading(false);
            }
        } catch (e) {
            if (mounted) setLoading(false);
        }
    };

    const initSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error) {
                await fetchProfile(data.session?.user);
            } else if (mounted) setLoading(false);
        } catch (err) {
             if (mounted) setLoading(false);
        }
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

  // Admin Surveillance Listener
  useEffect(() => {
      if (user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) {
          const channel = supabase.channel('system_monitor')
              .on('broadcast', { event: 'user_activity' }, (payload) => {
                  if (payload.payload.type === 'LOGIN') {
                      setAdminNotification(`Login: ${payload.payload.username} ist jetzt online.`);
                  } else if (payload.payload.type === 'REGISTER') {
                      setAdminNotification(`Neuankömmling: ${payload.payload.username} hat sich registriert! 🎉`);
                  }
                  setTimeout(() => setAdminNotification(null), 6000);
              })
              .subscribe();

          return () => {
              supabase.removeChannel(channel);
          };
      }
  }, [user]);

  // Fetch all users for management
  useEffect(() => {
      if (user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) {
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
                      createdAt: new Date(u.created_at).getTime(),
                      loginCount: u.login_count || 0,
                      lastLoginAt: u.last_login_at ? new Date(u.last_login_at).getTime() : undefined
                  })));
              }
          };
          loadUsers();
      }
  }, [user]);

  const login = async (emailInput: string, passwordAttempt: string) => {
    const cleanEmail = emailInput.trim();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordAttempt
    });

    if (error) throw new Error(error.message === "Invalid login credentials" ? "E-Mail oder Passwort falsch." : error.message);

    if (authData.user) {
         // Update Login Stats in DB
         const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
         
         if (profile) {
            const newCount = (profile.login_count || 0) + 1;
            const now = new Date().toISOString();
            
            await supabase.from('profiles').update({
                login_count: newCount,
                last_login_at: now
            }).eq('id', authData.user.id);

            const userProfile: User = {
                id: profile.id,
                email: profile.email,
                username: profile.username,
                avatar: profile.avatar,
                firstName: profile.first_name,
                lastName: profile.last_name,
                role: profile.role as UserRole,
                isStatsPublic: profile.is_stats_public,
                createdAt: new Date(profile.created_at).getTime(),
                loginCount: newCount,
                lastLoginAt: new Date(now).getTime()
            };
            setUser(userProfile);
            localStorage.setItem(`cinelog_profile_${profile.id}`, JSON.stringify({
                timestamp: Date.now(),
                data: userProfile
            }));

            // Broadcast Login
            supabase.channel('system_monitor').send({
                type: 'broadcast',
                event: 'user_activity',
                payload: { type: 'LOGIN', username: profile.username }
            });
         }
    }
  };

  const register = async (newUser: Partial<User>, password: string) => {
    const { error } = await supabase.auth.signUp({
        email: newUser.email!.trim(),
        password: password,
        options: {
            data: {
                username: newUser.username,
                role: 'USER'
            }
        }
    });

    if (error) throw new Error(error.message);

    // Broadcast New Registration
    supabase.channel('system_monitor').send({
        type: 'broadcast',
        event: 'user_activity',
        payload: { type: 'REGISTER', username: newUser.username }
    });
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

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) throw new Error(error.message);
    
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const changePassword = async (oldPw: string, newPw: string) => {
     const { error } = await supabase.auth.updateUser({ password: newPw });
     if (error) throw new Error(error.message);
  };

  const resetPassword = async (email: string) => {
     const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
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
