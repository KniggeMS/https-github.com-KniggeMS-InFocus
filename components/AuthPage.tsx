
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { generateAvatar } from '../services/gemini';
import { GuidePage } from './GuidePage';
import { Clapperboard, Loader2, Upload, Sparkles, Languages, UserCheck, KeyRound, ArrowLeft, Info, Check, X as XIcon, BookOpen } from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot';

export const AuthPage: React.FC = () => {
  const { login, register, resetPassword, getAllUsers } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGuide, setShowGuide] = useState(false); // NEW STATE for Guide Overlay

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  
  // Image Gen State
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // Dev Help
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
      setAvailableUsers(getAllUsers());
  }, []);

  // PASSWORD STRENGTH LOGIC
  const getPasswordStrength = (pass: string) => {
      let score = 0;
      if (!pass) return 0;
      if (pass.length >= 8) score += 1;
      if (pass.length >= 12) score += 1;
      if (/[A-Z]/.test(pass)) score += 1;
      if (/[0-9]/.test(pass)) score += 1;
      if (/[^A-Za-z0-9]/.test(pass)) score += 1;
      return score; // Max 5
  };

  const pwdScore = getPasswordStrength(password);
  
  const getStrengthColor = () => {
      if (password.length === 0) return 'bg-slate-700';
      if (password.length < 8) return 'bg-red-500';
      if (pwdScore < 3) return 'bg-yellow-500';
      return 'bg-green-500';
  };

  const getStrengthLabel = () => {
      if (password.length === 0) return '';
      if (password.length < 8) return 'Zu kurz (min. 8)';
      if (pwdScore < 3) return 'Okay';
      return 'Stark';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (view === 'login') {
        await login(username, password); 
      } else if (view === 'register') {
        // Register Validation
        if (!username || !email || !password) throw new Error("Missing required fields");
        if (password !== confirmPassword) throw new Error("Passwörter stimmen nicht überein");
        
        // Security Policy Check
        if (password.length < 8) throw new Error("Passwort muss mindestens 8 Zeichen lang sein.");

        await register({
          id: crypto.randomUUID(),
          username,
          email,
          firstName,
          lastName,
          avatar,
          createdAt: Date.now()
        }, password);

        setSuccess(t('registration_success'));
        setView('login');
        setPassword('');
        setConfirmPassword('');
      } else if (view === 'forgot') {
          if (!email) throw new Error("Missing required fields");
          
          await resetPassword(email);
          setSuccess(t('reset_link_sent'));
          setTimeout(() => {
              setView('login');
              setSuccess('');
          }, 6000);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!username) {
        setError("Please enter a username first.");
        return;
    }
    setIsGeneratingImg(true);
    const imgData = await generateAvatar(username);
    if (imgData) {
        setAvatar(imgData);
    } else {
        setError("Could not generate avatar.");
    }
    setIsGeneratingImg(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleDemoLogin = async () => {
      setIsLoading(true);
      try {
          await login('BigDaddy', 'password123');
      } catch (e) {
          setError("Demo Login Failed (User might not exist yet)");
      } finally {
          setIsLoading(false);
      }
  };

  // IF GUIDE IS ACTIVE, RENDER IT OVERLAYING EVERYTHING
  if (showGuide) {
      return (
          <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
              <GuidePage onBack={() => setShowGuide(false)} />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop" 
                alt="Cinema" 
                className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/50"></div>
        </div>

        {/* Top Header: Language & Guide */}
        <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
             {/* Guide Button - Subtle but accessible */}
             <button 
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full text-slate-400 hover:text-white text-xs font-medium transition-colors border border-white/5"
            >
                <BookOpen size={14} />
                Handbuch
            </button>
        </div>

        <div className="absolute top-6 right-6 z-50">
            <button 
                onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-slate-300 text-xs font-medium transition-colors border border-white/10"
            >
                <Languages size={14} />
                {language === 'de' ? 'English' : 'Deutsch'}
            </button>
        </div>

        <div className="relative z-10 w-full max-w-md p-6">
            <div className="flex flex-col items-center mb-8">
                <div className="bg-cyan-600 p-3 rounded-2xl shadow-xl shadow-cyan-900/40 mb-4">
                    <Clapperboard size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    <span className="text-cyan-400">InFocus</span> CineLog
                </h1>
                <p className="text-slate-400 mt-2 text-center">
                    {view === 'login' && t('login_subtitle')}
                    {view === 'register' && t('register_subtitle')}
                    {view === 'forgot' && t('reset_subtitle')}
                </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Status Msgs */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                            {success}
                        </div>
                    )}

                    {/* Login View */}
                    {view === 'login' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('username')} / {t('email')}</label>
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors"
                                    placeholder={t('username')}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('password')}</label>
                                    <button 
                                        type="button" 
                                        onClick={() => { setView('forgot'); setError(''); }}
                                        className="text-xs text-cyan-400 hover:text-cyan-300"
                                    >
                                        {t('forgot_password')}
                                    </button>
                                </div>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Forgot Password View */}
                    {view === 'forgot' && (
                        <>
                            <div className="bg-slate-800/80 p-3 rounded-lg text-xs text-slate-300 border border-slate-700 mb-2 flex gap-2">
                                <Info size={16} className="text-cyan-400 flex-shrink-0" />
                                <span>{t('reset_subtitle')}</span>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('email')}</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Register View */}
                    {view === 'register' && (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
                             {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-4 py-2">
                                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center relative group">
                                    {avatar ? (
                                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-500 text-xs text-center px-2">No Avatar</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        type="button" 
                                        onClick={handleGenerateAvatar}
                                        disabled={isGeneratingImg || !username}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingImg ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                                        {isGeneratingImg ? t('generating') : t('generate_avatar')}
                                    </button>
                                    <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg cursor-pointer transition-colors">
                                        <Upload size={12} />
                                        {t('or_upload')}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none"
                                    placeholder={`${t('username')} *`}
                                    required
                                />
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none"
                                    placeholder={`${t('email')} *`}
                                    required
                                />
                                
                                {/* PASSWORD SECTION WITH METER */}
                                <div className="space-y-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                    <input 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors"
                                        placeholder={`${t('password')} *`}
                                        required
                                    />
                                    
                                    {/* Strength Meter */}
                                    {password && (
                                        <div className="px-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] uppercase font-bold text-slate-500">Sicherheit</span>
                                                <span className={`text-[10px] font-bold ${password.length < 8 ? 'text-red-400' : pwdScore < 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                    {getStrengthLabel()}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                                                    style={{ width: `${Math.min(100, Math.max(10, (password.length / 12) * 100))}%` }}
                                                ></div>
                                            </div>
                                            {password.length < 8 && <p className="text-[10px] text-red-400 mt-1">Min. 8 Zeichen benötigt.</p>}
                                        </div>
                                    )}

                                    <input 
                                        type="password" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full bg-slate-800 border text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : 'border-slate-700'}`}
                                        placeholder={`${t('confirm_password')} *`}
                                        required
                                    />
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-[10px] text-red-400 px-1">Stimmt nicht überein</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        type="text" 
                                        value={firstName} 
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none"
                                        placeholder={t('firstname')}
                                    />
                                    <input 
                                        type="text" 
                                        value={lastName} 
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none"
                                        placeholder={t('lastname')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading || (view === 'register' && (password.length < 8 || password !== confirmPassword))}
                        className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:grayscale ${view === 'forgot' ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20'}`}
                    >
                        {isLoading && <Loader2 size={18} className="animate-spin" />}
                        {view === 'login' && t('login_button')}
                        {view === 'register' && t('register_button')}
                        {view === 'forgot' && t('send_reset_link')}
                    </button>

                    {view === 'login' && (
                        <button 
                            type="button"
                            onClick={handleDemoLogin}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-2 text-xs uppercase tracking-wide border border-slate-600"
                        >
                            <UserCheck size={14} /> Demo Login (BigDaddy)
                        </button>
                    )}
                </form>

                <div className="mt-6 pt-6 border-t border-slate-700 text-center space-y-2">
                    {view === 'forgot' && (
                        <button 
                            onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                            className="text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft size={14} /> {t('back_to_login')}
                        </button>
                    )}
                    {view !== 'forgot' && (
                         <button 
                            onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
                            className="text-slate-400 hover:text-white text-sm transition-colors"
                        >
                            {view === 'login' ? t('switch_to_register') : t('switch_to_login')}
                        </button>
                    )}
                </div>

                {/* DEBUG / DEMO HELP */}
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Lokale Demo-Benutzer</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {availableUsers.map((u, i) => (
                            <span key={i} className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-400">
                                {u.username}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
