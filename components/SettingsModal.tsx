import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Check, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Current values (from LocalStorage or Env)
  tmdbKey: string;
  omdbKey: string;
  geminiKey: string;
  // Updaters
  onSave: (keys: { tmdb: string, omdb: string, gemini: string }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, tmdbKey, omdbKey, geminiKey, onSave }) => {
  const { t } = useTranslation();
  
  const [localTmdb, setLocalTmdb] = useState(tmdbKey);
  const [localOmdb, setLocalOmdb] = useState(omdbKey);
  const [localGemini, setLocalGemini] = useState(geminiKey);
  
  const [showSecrets, setShowSecrets] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
        setLocalTmdb(localStorage.getItem('tmdb_api_key') || '');
        setLocalOmdb(localStorage.getItem('omdb_api_key') || '');
        setLocalGemini(localStorage.getItem('cinelog_gemini_key') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
          tmdb: localTmdb,
          omdb: localOmdb,
          gemini: localGemini
      });
      onClose();
  };

  // Helper to check if using System/Env defaults AND if they are actually set
  const isEnvActive = (keyName: string, envValue: string | undefined) => {
      return !localStorage.getItem(keyName) && envValue && envValue.length > 0;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield size={20} className="text-cyan-400"/> {t('settings')} & API Keys
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
            <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                Hier kannst du eigene API Keys hinterlegen. Wenn die Felder leer sind, werden (falls vorhanden) die vom Server bereitgestellten Keys genutzt.
            </p>

            {/* TMDB Key */}
            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                        <Key size={12}/> TMDB API Key
                    </label>
                    {isEnvActive('tmdb_api_key', process.env.VITE_TMDB_API_KEY) && !localTmdb && (
                        <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30 flex items-center gap-1">
                            <Check size={10}/> System Default aktiv
                        </span>
                    )}
                </div>
                <input 
                    type={showSecrets ? "text" : "password"}
                    value={localTmdb}
                    onChange={e => setLocalTmdb(e.target.value)}
                    placeholder={process.env.VITE_TMDB_API_KEY ? "Verwende System Key..." : "Key eingeben..."}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
            </div>

            {/* OMDb Key */}
            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                        <Key size={12}/> OMDb API Key
                    </label>
                    {isEnvActive('omdb_api_key', process.env.VITE_OMDB_API_KEY) && !localOmdb && (
                        <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30 flex items-center gap-1">
                            <Check size={10}/> System Default aktiv
                        </span>
                    )}
                </div>
                <input 
                    type={showSecrets ? "text" : "password"}
                    value={localOmdb}
                    onChange={e => setLocalOmdb(e.target.value)}
                    placeholder={process.env.VITE_OMDB_API_KEY ? "Verwende System Key..." : "Key eingeben..."}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
            </div>

            {/* Gemini Key */}
            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                        <Key size={12}/> Google Gemini API Key
                    </label>
                    {isEnvActive('cinelog_gemini_key', process.env.API_KEY) && !localGemini && (
                        <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30 flex items-center gap-1">
                            <Check size={10}/> System Default aktiv
                        </span>
                    )}
                </div>
                <input 
                    type={showSecrets ? "text" : "password"}
                    value={localGemini}
                    onChange={e => setLocalGemini(e.target.value)}
                    placeholder={process.env.API_KEY ? "Verwende System Key..." : "Key eingeben..."}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button 
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
                    title={showSecrets ? "Verstecken" : "Anzeigen"}
                >
                    {showSecrets ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
                
                <div className="flex-grow"></div>

                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-5 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                    Abbrechen
                </button>
                <button 
                    type="submit"
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all hover:scale-105"
                >
                    Speichern
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};