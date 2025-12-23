import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Sparkles, Film, AlertCircle, Camera, Key, ClipboardPaste, ShieldCheck } from 'lucide-react';
import { searchTMDB, IMAGE_BASE_URL, getEffectiveApiKey } from '../services/tmdb';
import { identifyMovieFromImage } from '../services/gemini';
import { SearchResult, MediaType, WatchStatus } from '../types';
import { DetailView } from './DetailView';
import { useTranslation } from '../contexts/LanguageContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: SearchResult, status?: WatchStatus, isFav?: boolean) => void;
  apiKey: string;
  onUpdateApiKey?: (key: string) => void;
  onSelectItem?: (item: SearchResult) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onAdd, apiKey, onUpdateApiKey, onSelectItem }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [tempKey, setTempKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // KORREKTUR: Nutzt die hybride Logik (Vercel oder Lokal)
  const effectiveApiKey = getEffectiveApiKey(apiKey);
  const isSystemKeyActive = !!import.meta.env.VITE_TMDB_API_KEY && !apiKey;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (effectiveApiKey && effectiveApiKey.length > 0) {
        setShowKeyInput(false);
      } else {
        setShowKeyInput(true);
      }
    }
  }, [isOpen, effectiveApiKey]);

  if (!isOpen) return null;

  const performSearch = async (searchQuery: string) => {
    if (!effectiveApiKey) {
      setError(t('api_key_req'));
      setShowKeyInput(true);
      return;
    }
    setIsLoading(true);
    setError('');
    
    try {
      const data = await searchTMDB(searchQuery, effectiveApiKey);
      setResults(data);
    } catch (err) {
      setError("Fehler bei der Suche.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (item: SearchResult) => {
      if (onSelectItem) {
          onSelectItem(item);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="text-cyan-400" size={20} />
            {t('add_title')} (TMDB)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {showKeyInput ? (
          <div className="p-6 flex flex-col items-center justify-center bg-slate-900/50 flex-grow">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <Key size={32} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('api_key_missing')}</h3>
            <p className="text-sm text-slate-400 text-center mb-6 max-w-xs">
              Um Filme zu suchen, benötigst du einen TMDB API Key.
            </p>
            
            <form onSubmit={handleSaveKey} className="w-full max-w-md space-y-3">
              <div className="relative">
                <input 
                  id="apiKeyInput"
                  type="text" 
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="TMDB API Key einfügen..."
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-4 pr-12 py-3 rounded-xl focus:border-cyan-500 focus:outline-none"
                  autoFocus
                />
                <button type="button" onClick={handlePaste} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white bg-slate-700/50 rounded-lg">
                  <ClipboardPaste size={18} />
                </button>
              </div>

              <div className="flex gap-2">
                {effectiveApiKey && (
                  <button type="button" onClick={() => setShowKeyInput(false)} className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium text-sm">
                    {t('cancel')}
                  </button>
                )}
                <button type="submit" disabled={!tempKey.trim()} className="flex-1 py-3 rounded-xl bg-cyan-600 text-white font-bold shadow-lg disabled:opacity-50">
                  Speichern
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
              <form onSubmit={handleSearch} className="relative flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    value={query}
                    data-testid="search-input"
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-all"
                    autoFocus
                  />
                  
                  <label className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg cursor-pointer ${isVisionLoading ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-400'}`}>
                    {isVisionLoading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleVisionSearch} disabled={isVisionLoading} />
                  </label>
                </div>

                <button type="submit" disabled={isLoading || !query.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-1.5 rounded-xl font-medium transition-colors shadow-lg shadow-cyan-900/20">
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : t('search_button')}
                </button>
              </form>
              
              {isSystemKeyActive && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-400 font-bold uppercase tracking-wider bg-green-950/20 w-fit px-2 py-0.5 rounded border border-green-900/30">
                  <ShieldCheck size={10} /> System Key Active (Vercel)
                </div>
              )}

              {error && (
                <div className="mt-3 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            <div className="overflow-y-auto p-4 flex-grow custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Loader2 size={40} className="animate-spin mb-4 text-cyan-500" />
                  <p>Durchsuche TMDB...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((result, idx) => (
                    <div key={idx} onClick={() => handleSelectItem(result)} className="flex gap-4 p-3 rounded-xl hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-600 group cursor-pointer">
                      <div className="w-16 h-24 bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden relative shadow-md">
                        {result.posterPath ? (
                          <img src={result.posterPath} alt={result.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-slate-500">
                            {result.type === MediaType.MOVIE ? <Film size={20} /> : 'TV'}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-white text-lg leading-none group-hover:text-cyan-400 transition-colors">{result.title}</h3>
                            <p className="text-slate-400 text-sm mt-1">{result.year}</p>
                          </div>
                          <span className={`font-mono text-sm px-2 py-1 rounded border ${result.rating > 7 ? 'text-green-400 bg-green-950/30 border-green-900' : 'text-cyan-400 bg-cyan-950/30 border-cyan-900'}`}>
                            {result.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-2 line-clamp-2">{result.plot}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Camera size={48} className="mx-auto mb-4 opacity-20" />
                  <p>{t('vision_search')}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};