import React from 'react';
import { X, Palette, Moon, Sun, Monitor, Check, Sparkles } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

interface DesignLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesignLabModal: React.FC<DesignLabModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const themes: { id: Theme; name: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { id: 'dark', name: 'Cinematic Dark', icon: <Moon size={20} />, color: 'bg-slate-900', desc: 'Der Standard. Perfekt für dunkle Räume.' },
    { id: 'light', name: 'Daylight', icon: <Sun size={20} className="text-yellow-500" />, color: 'bg-slate-100', desc: 'Hell und klar. (Experimentell)' },
    { id: 'glass', name: 'Glassmorphism', icon: <Sparkles size={20} className="text-cyan-400" />, color: 'bg-slate-800', desc: 'Moderne Transparenz und Blur-Effekte.' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B0E14] border border-white/10 w-full max-w-md rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors z-50">
            <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-[#D499FF] border border-purple-500/20 shadow-lg shadow-purple-900/20">
                <Palette size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Design Lab</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Interface Customization</p>
            </div>
        </div>

        <div className="space-y-4 relative z-10">
            {themes.map((t) => (
                <button 
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`w-full group flex items-center justify-between p-4 rounded-2xl border transition-all ${theme === t.id ? 'border-[#D499FF] bg-[#D499FF]/10' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 shadow-inner ${t.color}`}>
                            {t.icon}
                        </div>
                        <div className="text-left">
                            <h3 className={`font-bold text-sm ${theme === t.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{t.name}</h3>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{t.desc}</p>
                        </div>
                    </div>
                    {theme === t.id && (
                        <div className="w-6 h-6 bg-[#D499FF] rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Check size={14} className="text-black font-bold" />
                        </div>
                    )}
                </button>
            ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
            <p className="text-[10px] text-slate-600 font-medium">
                Weitere Anpassungsmöglichkeiten folgen in zukünftigen Updates.
            </p>
        </div>

      </div>
    </div>
  );
};