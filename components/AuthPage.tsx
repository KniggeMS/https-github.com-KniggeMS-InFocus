import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
// Import aus unserem stabilen Baseline-Service
import { generateAvatar } from '../services/gemini';
import { GuidePage } from './GuidePage';
import { Clapperboard, Loader2, Sparkles, Languages, Eye, EyeOff, BookOpen, User, Mail, Lock } from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot';

export const AuthPage: React.FC = () => {
  const { login, register, resetPassword } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (view === 'login') {
        if (!email) throw new Error("Bitte E-Mail eingeben.");
        await login(email, password); 
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
      setError(err.message || "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!username) return;
    setIsGeneratingImg(true);
    // Nutzt unseren Baseline-Dummy (gibt aktuell leeren String zurück)
    // Dies verhindert den Absturz des Compilers
    const imgData = await generateAvatar(username);
    if (imgData) setAvatar(imgData);
    setIsGeneratingImg(false);
  };

  if (showGuide) return <div className="fixed inset-0 z-50 bg-[#0B0E14] overflow-y-auto"><GuidePage onBack={() => setShowGuide(false)} /></div>;

  return (
    <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* BACKGROUND GLOWS */}
        <div className="fixed top-[-10%] right-[-5%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="fixed bottom-[-5%] left-[-5%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none"></div>

        {/* TOP BAR NAVIGATION */}
        <div className="absolute top-8 left-8 right-8 flex justify-between z-50 items-center">
             <button onClick={() => setShowGuide(true)} className="px-5 py-2 rounded-full text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest border border-white/5 bg-[#121620]/80 backdrop-blur-xl flex items-center gap-2.5 transition-all hover:bg-[#1A202E]">
                <BookOpen size={14} className="text-cyan-400" /> Handbuch
            </button>
            <button onClick={() => setLanguage(language === 'de' ? 'en' : 'de')} className="px-5 py-2 rounded-full text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest border border-white/5 bg-[#121620]/80 backdrop-blur-xl flex items-center gap-2.5 transition-all hover:bg-[#1A202E]">
                <Languages size={14} className="text-cyan-400" /> {language.toUpperCase()}
            </button>
        </div>

        {/* AUTH CARD */}
        <div className="w-full max-w-[440px] bg-[#0B0E14] p-10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative z-10 animate-in zoom-in-95 duration-500 border border-white/5">
            
            {/* LOGO WITH GLOW */}
            <div className="flex justify-center mb-10 relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full scale-150"></div>
                <div className="w-20 h-20 bg-gradient-to-br from-[#00A3C4] to-[#005F73] rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-900/40 relative z-10">
                    <Clapperboard size={40} className="text-white" />
                </div>
            </div>

            <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-white tracking-tight mb-3">
                    {view === 'login' ? t('welcome_back') : view === 'register' ? t('create_account') : t('reset_password')}
                </h1>
                <p className="text-slate-500 text-sm font-medium tracking-tight">
                    {view === 'login' ? t('login_subtitle') : view === 'register' ? t('register_subtitle') : t('reset_subtitle')}
                </p>
            </div>

            {(error || success) && (
                <div className={`mb-8 p-4 rounded-2xl text-xs font-bold flex items-center justify-center text-center tracking-wide uppercase ${error ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                    {error || success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {view === 'login' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('email_address')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors" size={18} />
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="w-full bg-[#121620] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 transition-all font-medium" 
                                    placeholder="name@example.com" 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('password')}</label>
                                <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-black text-cyan-500 hover:text-cyan-400 uppercase tracking-widest transition-colors">{t('forgot_password')}</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="w-full bg-[#121620] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 transition-all font-medium" 
                                    placeholder="••••••••" 
                                    required 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {view === 'register' && (
                    <div className="space-y-5 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                         <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-[#121620] border-2 border-white/5 overflow-hidden relative shadow-2xl">
                                    {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                </div>
                                <button type="button" onClick={handleGenerateAvatar} disabled={!username || isGeneratingImg} className="absolute bottom-0 right-0 bg-cyan-600 p-2 rounded-full text-white shadow-xl hover:scale-110 transition-all border-4 border-[#0B0E14] disabled:opacity-50">
                                    {isGeneratingImg ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder={`${t('firstname')} (${t('optional')})`} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-[#121620] border border-white/5 rounded-2xl py-4 px-5 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 text-sm font-medium" />
                            <input type="text" placeholder={`${t('lastname')} (${t('optional')})`} value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-[#121620] border border-white/5 rounded-2xl py-4 px-5 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 text-sm font-medium" />
                        </div>
                        <input type="text" placeholder={t('username_placeholder')} value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#121620] border border-white/5 rounded-2xl py-4 px-5 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 font-medium" />
                         <input type="email" placeholder={t('email_address')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#121620] border border-white/5 rounded-2xl py-4 px-5 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 font-medium" />
                        <input type="password" placeholder={t('password_placeholder')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#121620] border border-white/5 rounded-2xl py-4 px-5 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 font-medium" />
                    </div>
                )}

                <button type="submit" disabled={isLoading} className="w-full bg-[#00A3C4] hover:bg-[#00B4D8] text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : (view === 'login' ? t('login_button') : t('register_button'))}
                </button>
            </form>

            <div className="mt-8 text-center">
                {view === 'login' ? (
                    <button onClick={() => setView('register')} className="text-xs font-bold text-slate-500 hover:text-white transition-colors tracking-wide">{t('no_account')} <span className="text-cyan-500 underline ml-1">{t('register_here')}</span></button>
                ) : (
                     <button onClick={() => setView('login')} className="text-xs font-bold text-slate-500 hover:text-white transition-colors tracking-wide">{t('already_member')} <span className="text-cyan-500 underline ml-1">{t('login_here')}</span></button>
                )}
            </div>
        </div>

        {/* FOOTER CREDITS */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-center pointer-events-none">
            <p className="text-[9px] text-slate-700 font-black tracking-[0.4em] uppercase">
                InFocus CineLog v2.3.1 • Stitch Design
            </p>
        </div>
    </div>
  );
};