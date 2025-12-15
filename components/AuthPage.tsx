
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { generateAvatar } from '../services/gemini';
import { GuidePage } from './GuidePage';
import { Clapperboard, Loader2, Sparkles, Languages, Eye, EyeOff, BookOpen, User, Mail, Lock } from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot';

export const AuthPage: React.FC = () => {
  const { login, register, resetPassword, getAllUsers } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  
  // Dev Help
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
      setAvailableUsers(getAllUsers());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (view === 'login') {
        await login(username, password); 
      } else if (view === 'register') {
        if (!username || !email || !password) throw new Error("Fehlende Pflichtfelder");
        if (password !== confirmPassword) throw new Error("Passwörter stimmen nicht überein");
        if (password.length < 8) throw new Error("Passwort muss mind. 8 Zeichen lang sein.");

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
      } else if (view === 'forgot') {
          if (!email) throw new Error("Email benötigt");
          await resetPassword(email);
          setSuccess(t('reset_link_sent'));
      }
    } catch (err: any) {
      setError(err.message || "Fehler aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!username) return;
    setIsGeneratingImg(true);
    const imgData = await generateAvatar(username);
    if (imgData) setAvatar(imgData);
    setIsGeneratingImg(false);
  };

  const handleDemoLogin = async () => {
      setIsLoading(true);
      try { await login('BigDaddy', 'password123'); } 
      catch (e) { setError("Demo User nicht gefunden"); } 
      finally { setIsLoading(false); }
  };

  if (showGuide) return <div className="fixed inset-0 z-50 bg-[#0B0E14] overflow-y-auto"><GuidePage onBack={() => setShowGuide(false)} /></div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* Abstract Background Blurs (Stitch Style) */}
        <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Bar */}
        <div className="absolute top-6 left-6 right-6 flex justify-between z-50">
             <button onClick={() => setShowGuide(true)} className="glass-button flex items-center gap-2 px-4 py-2 rounded-full text-slate-400 hover:text-white text-xs font-medium">
                <BookOpen size={14} /> Handbuch
            </button>
            <button onClick={() => setLanguage(language === 'de' ? 'en' : 'de')} className="glass-button flex items-center gap-2 px-4 py-2 rounded-full text-slate-400 hover:text-white text-xs font-medium">
                <Languages size={14} /> {language.toUpperCase()}
            </button>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 border border-white/10">
            
            <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-900/50 rotate-3">
                    <Clapperboard size={32} className="text-white" />
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                    {view === 'login' ? t('welcome_back') : view === 'register' ? t('create_account') : t('reset_password')}
                </h1>
                <p className="text-slate-400 text-sm">
                    {view === 'login' ? t('login_subtitle') : view === 'register' ? t('register_subtitle') : t('reset_subtitle')}
                </p>
            </div>

            {(error || success) && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center justify-center text-center ${error ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                    {error || success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* LOGIN VIEW */}
                {view === 'login' && (
                    <>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-Mail oder Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#1c212c] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-cyan-500 transition-colors"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                             <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">{t('password')}</label>
                                <button type="button" onClick={() => setView('forgot')} className="text-xs text-cyan-400 hover:text-cyan-300">{t('forgot_password')}</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#1c212c] border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white focus:border-cyan-500 transition-colors"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* REGISTER VIEW */}
                {view === 'register' && (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                         <div className="flex justify-center mb-4">
                            <div className="relative w-24 h-24 group cursor-pointer">
                                <div className="w-full h-full rounded-full bg-slate-800 border-2 border-slate-600 overflow-hidden relative">
                                    {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                </div>
                                <button type="button" onClick={handleGenerateAvatar} disabled={!username || isGeneratingImg} className="absolute bottom-0 right-0 bg-cyan-600 p-2 rounded-full text-white shadow-lg hover:scale-110 transition-transform disabled:opacity-50">
                                    {isGeneratingImg ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                type="text" 
                                placeholder={t('firstname')}
                                value={firstName} 
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-[#1c212c] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 text-sm"
                            />
                            <input 
                                type="text" 
                                placeholder={t('lastname')}
                                value={lastName} 
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-[#1c212c] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 text-sm"
                            />
                        </div>

                        <input 
                            type="text" 
                            placeholder={t('username')}
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#1c212c] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500"
                        />
                         <input 
                            type="email" 
                            placeholder={t('email')}
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1c212c] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500"
                        />
                        <input 
                            type="password" 
                            placeholder={t('password')}
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1c212c] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500"
                        />
                         <input 
                            type="password" 
                            placeholder={t('confirm_password')}
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#1c212c] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500"
                        />
                    </div>
                )}

                {/* FORGOT PASSWORD VIEW */}
                {view === 'forgot' && (
                    <div className="space-y-3">
                         <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#1c212c] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-cyan-500 transition-colors"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-4"
                >
                    {isLoading && <Loader2 size={20} className="animate-spin" />}
                    {view === 'login' ? t('login_button') : view === 'register' ? t('register_button') : t('send_reset_link')}
                </button>
            </form>

            <div className="mt-6 text-center">
                {view === 'login' && (
                    <button onClick={() => setView('register')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        {t('switch_to_register')}
                    </button>
                )}
                {(view === 'register' || view === 'forgot') && (
                     <button onClick={() => setView('login')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        {t('back_to_login')}
                    </button>
                )}
            </div>
            
            {/* Quick Demo Login Helper for Devs */}
            {view === 'login' && (
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <button onClick={handleDemoLogin} className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-cyan-500 font-bold transition-colors">
                        Demo Zugang
                    </button>
                </div>
            )}
        </div>

        <div className="absolute bottom-4 text-[10px] text-slate-600 font-mono">
            InFocus CineLog v1.9.22 • Stitch Design
        </div>
    </div>
  );
};
