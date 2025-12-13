
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Lock, CheckCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../services/supabase';

export const RecoveryPage: React.FC = () => {
  const { completeRecovery } = useAuth();
  const { t } = useTranslation();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }
    if (password.length < 6) {
        setError("Passwort muss mindestens 6 Zeichen lang sein");
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        // We use updateUser because the user is technically logged in via the token link
        const { error } = await supabase.auth.updateUser({ password: password });
        if (error) throw error;
        
        setSuccess(true);
        setTimeout(() => {
            completeRecovery(); // Close modal and enter app
        }, 2000);
    } catch (err: any) {
        setError(err.message || "Fehler beim Speichern des Passworts.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden p-4">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"></div>
        </div>

        <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8">
            <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mb-4 border border-cyan-500/30">
                    <KeyRound size={32} className="text-cyan-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{t('set_new_password')}</h1>
                <p className="text-slate-400 text-sm">
                    Bitte vergib ein neues Passwort für deinen Account.
                </p>
            </div>

            {success ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center animate-in fade-in zoom-in">
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                    <h3 className="text-green-400 font-bold text-lg mb-2">Erfolgreich!</h3>
                    <p className="text-slate-300 text-sm">Dein Passwort wurde geändert. Du wirst angemeldet...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('new_password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('confirm_password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : t('set_password_btn')}
                    </button>
                </form>
            )}
        </div>
    </div>
  );
};
