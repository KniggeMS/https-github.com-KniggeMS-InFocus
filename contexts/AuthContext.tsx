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
        console.log("Recovery mode detected via Hash");
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

        // 1. CACHE CHECK
        // Prevents database hammering on refresh (F5), avoiding Rate Limits/Blocking
        const cacheKey = `cinelog_profile_${sessionUser.id}`;
        if (!forceRefresh) {
            try {
                const cachedRaw = localStorage.getItem(cacheKey);
                if (cachedRaw) {
                    const cached = JSON.parse(cachedRaw);
                    if (Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
                        console.log("Serving Profile from Cache (Fast Load)");
                        if (mounted) {
                            setUser(cached.data);
                            setLoading(false);
                        }
                        return; // Skip DB Call
                    }
                }
            } catch (e) {
                console.warn("Cache read failed", e);
            }
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
                        createdAt: new Date(data.created_at).getTime()
                    };
                    
                    setUser(userProfile);

                    // 2. WRITE CACHE
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({
                            timestamp: Date.now(),
                            data: userProfile
                        }));
                    } catch (e) {
                         console.warn("Cache write failed (Storage blocked?)", e);
                    }

                } else {
                    console.error("Profile fetch error (Listener)", error);
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
            // For explicit events like SIGN_IN, we might want to force refresh, 
            // but standard checks can use cache.
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
    // Clean input to avoid copy-paste whitespace issues
    const cleanEmail = emailInput.trim();

    // 1. Direct Auth Call
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordAttempt
    });

    if (error) {
        // Translate common Supabase errors
        if (error.message === "Invalid login credentials") {
            throw new Error("E-Mail oder Passwort falsch.");
        }
        if (error.message.includes("Email not confirmed")) {
             throw new Error("Bitte bestätige erst deine E-Mail Adresse.");
        }
        if (error.message.includes("rate limit")) {
            throw new Error("Zu viele Versuche. Bitte warte einen Moment.");
        }
        throw new Error(error.message);
    }

    // 2. Explicit Profile Check
    if (authData.user) {
         const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
         
         if (profileError || !profile) {
             console.error("Login Profile Error:", profileError);
             await supabase.auth.signOut(); 
             throw new Error("Benutzerprofil konnte nicht geladen werden. Datenbankfehler oder Profil fehlt.");
         }

        // 3. VIVALDI/STRICT FIX + CACHE WARMUP
        // Manually set state immediately to bypass potentially blocked listeners
        const userProfile: User = {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            avatar: profile.avatar,
            firstName: profile.first_name,
            lastName: profile.last_name,
            role: profile.role as UserRole,
            isStatsPublic: profile.is_stats_public,
            createdAt: new Date(profile.created_at).getTime()
        };
        setUser(userProfile);

        // Populate Cache so next F5 is instant
        // Try/Catch for Strict Mode browsers blocking Storage
        try {
            localStorage.setItem(`cinelog_profile_${profile.id}`, JSON.stringify({
                timestamp: Date.now(),
                data: userProfile
            }));
        } catch (e) {
            console.warn("LocalStorage write failed (Privacy Settings?)", e);
        }

        // Post-Login: Broadcast
        (async () => {
             try {
                 if (profile.username) {
                     await supabase.channel('system_monitor').send({
                        type: 'broadcast',
                        event: 'user_activity',
                        payload: { type: 'LOGIN', username: profile.username }
                    });
                 }
             } catch (e) { /* Silent fail */ }
        })();
    }
  };

  const register = async (newUser: Partial<User>, password: string) => {
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
        if (e.message === "Dieser Benutzername ist bereits vergeben.") throw e;
    }

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
    
    // Update State AND Cache
    setUser(prev => {
        const newUser = prev ? { ...prev, ...data } : null;
        if (newUser) {
             const cacheKey = `cinelog_profile_${newUser.id}`;
             try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    timestamp: Date.now(),
                    data: newUser
                }));
             } catch (e) {
                 console.warn("LocalStorage write failed (Privacy Settings?)", e);
             }
        }
        return newUser;
    });
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