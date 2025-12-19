import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Check, Eye, EyeOff, Globe } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Current values (from LocalStorage or Env)
  tmdbKey: string;
  omdbKey: string;
  // Updaters
  onSave: (keys: { tmdb: string, omdb: string }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, tmdbKey, omdbKey, onSave }) => {
  const { t } = useTranslation();
  
  const [localTmdb, setLocalTmdb] = useState(tmdbKey);
  const [localOmdb, setLocalOmdb] = useState(omdbKey);
  
  const [showSecrets, setShowSecrets] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
        setLocalTmdb(localStorage.getItem('tmdb_api_key') || '');
        setLocalOmdb(localStorage.getItem('omdb_api_key') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
          tmdb: localTmdb,
          omdb: localOmdb
      });
      onClose();
  };

  const isTmdbEnvSet = !!process.env.VITE_TMDB_API_KEY;
  const isOmdbEnvSet = !!process.env.VITE_OMDB_API_KEY;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield size={20} className="text-cyan-400"/> System-Konfiguration
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/20 flex gap-3">
                <Globe className="text-cyan-400 shrink-0" size={20} />
                <p className="text-xs text-cyan-100 leading-relaxed">
                    Die App ist für den <strong>vorkonfigurierten Modus (Vercel)</strong> optimiert. Manuelle API-Keys sind nur nötig, wenn du die Standard-Keys überschreiben möchtest.
                </p>
            </div>

            {/* TMDB Key */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                        <Key size={12}/> TMDB API Key
                    </label>
                    {isTmdbEnvSet && !localTmdb && (
                        <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30 flex items-center gap-1 font-bold">
                            <Check size={10}/> VERCEL MANAGED
                        </span>
                    )}
                </div>
                <input 
                    type={showSecrets ? "text" : "password"}
                    value={localTmdb}
                    onChange={e => setLocalTmdb(e.target.value)}
                    placeholder={isTmdbEnvSet ? "System-Key ist aktiv..." : "Key eingeben..."}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
            </div>

            {/* OMDb Key */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                        <Key size={12}/> OMDb API Key
                    </label>
                    {isOmdbEnvSet && !localOmdb && (
                        <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30 flex items-center gap-1 font-bold">
                            <Check size={10}/> VERCEL MANAGED
                        </span>
                    )}
                </div>
                <input 
                    type={showSecrets ? "text" : "password"}
                    value={localOmdb}
                    onChange={e => setLocalOmdb(e.target.value)}
                    placeholder={isOmdbEnvSet ? "System-Key ist aktiv..." : "Key eingeben..."}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button 
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
                >
                    {showSecrets ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
                
                <div className="flex-grow"></div>

                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-5 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                    {t('cancel')}
                </button>
                <button 
                    type="submit"
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all hover:scale-105"
                >
                    {t('save_changes')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};