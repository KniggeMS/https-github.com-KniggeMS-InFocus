import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Sparkles, Film, AlertCircle, Settings, ChevronLeft, Camera, Key } from 'lucide-react';
import { searchTMDB, IMAGE_BASE_URL } from '../services/tmdb';
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
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onAdd, apiKey, onUpdateApiKey }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  
  // API Key Input State
  const [tempKey, setTempKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

  // 1. Reset State ONLY when opening/closing
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setHasSearched(false);
      setError('');
      setSelectedItem(null);
    }
  }, [isOpen]);

  // 2. Separate Effect for Key Check - Reacts to changes in apiKey prop
  useEffect(() => {
      if (isOpen) {
          // If we have a key, ensure input is hidden. 
          // If not, show it.
          if (apiKey && apiKey.length > 0) {
              setShowKeyInput(false);
          } else {
              setShowKeyInput(true);
          }
      }
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  const performSearch = async (searchQuery: string) => {
      if (!apiKey) {
        setError(t('api_key_req'));
        setShowKeyInput(true);
        return;
      }
      setIsLoading(true);
      setHasSearched(true);
      setError('');
      setSelectedItem(null); 
      
      try {
        const data = await searchTMDB(searchQuery, apiKey);
        setResults(data);
      } catch (err) {
        setError("Fehler bei der Suche.");
      } finally {
        setIsLoading(false);
      }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    performSearch(query);
  };

  const handleVisionSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsVisionLoading(true);
      setError('');

      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const identifiedTitle = await identifyMovieFromImage(base64Data);
          
          if (identifiedTitle) {
              setQuery(identifiedTitle);
              performSearch(identifiedTitle);
          } else {
              setError("Konnte kein Bild erkennen.");
          }
          setIsVisionLoading(false);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
  };

  const handleSaveKey = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedKey = tempKey.trim();
      if (trimmedKey && onUpdateApiKey) {
          // 1. Update Parent
          onUpdateApiKey(trimmedKey);
          // 2. Optimistic Update Local State
          setShowKeyInput(false);
          setTempKey('');
          setError(''); 
      }
  };

  if (selectedItem) {
      return (
          <DetailView 
              item={selectedItem}
              isExisting={false}
              apiKey={apiKey}
              onClose={() => setSelectedItem(null)}
              onAdd={(item, status, isFav) => {
                  onAdd(item, status, isFav);
                  onClose();
              }}
          />
      );
  }

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

        {/* --- API KEY INPUT MODE --- */}
        {showKeyInput ? (
            <div className="p-6 flex flex-col items-center justify-center bg-slate-900/50 flex-grow">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                    <Key size={32} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t('api_key_missing')}</h3>
                <p className="text-sm text-slate-400 text-center mb-6 max-w-xs">
                    Um Filme zu suchen, benötigst du einen kostenlosen TMDB API Key. 
                    <br/><br/>
                    <span className="text-xs bg-slate-800 p-1 rounded border border-slate-700">Hinweis: Keys werden lokal auf diesem Gerät gespeichert.</span>
                </p>
                
                <form onSubmit={handleSaveKey} className="w-full max-w-md space-y-3">
                    <input 
                        type="text" 
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        placeholder="TMDB API Key einfügen..."
                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors"
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                    />
                    <div className="flex gap-2">
                        {apiKey && (
                            <button 
                                type="button" 
                                onClick={() => setShowKeyInput(false)}
                                className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors font-medium text-sm"
                            >
                                Abbrechen
                            </button>
                        )}
                        <button 
                            type="submit"
                            disabled={!tempKey.trim()}
                            className="flex-1 py-3 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-colors font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Speichern
                        </button>
                    </div>
                </form>
                <div className="mt-4">
                    <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline">
                        Wo finde ich meinen Key?
                    </a>
                </div>
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
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('search_placeholder')}
                        className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-500"
                        autoFocus
                        />
                        
                        {/* Vision Search Trigger */}
                        <label className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg cursor-pointer transition-colors ${isVisionLoading ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-cyan-400'}`}>
                            {isVisionLoading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleVisionSearch} 
                                disabled={isVisionLoading}
                            />
                        </label>
                    </div>

                    <button 
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-1.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/20"
                    >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : t('search_button')}
                    </button>
                </form>
                
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
                        <div key={idx} 
                            onClick={() => setSelectedItem(result)}
                            className="flex gap-4 p-3 rounded-xl hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-600 group cursor-pointer"
                        >
                        <div className="w-16 h-24 bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden relative shadow-md">
                            {result.posterPath ? (
                            <img src={`${IMAGE_BASE_URL}${result.posterPath}`} alt={result.title} className="w-full h-full object-cover" />
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
                                <p className="text-slate-400 text-sm mt-1">{result.year} • {result.genre.join(', ')}</p>
                            </div>
                            <span className={`font-mono text-sm px-2 py-1 rounded border ${result.rating > 7 ? 'text-green-400 bg-green-950/30 border-green-900' : 'text-cyan-400 bg-cyan-950/30 border-cyan-900'}`}>
                                {result.rating.toFixed(1)}
                            </span>
                            </div>
                            <p className="text-slate-400 text-sm mt-2 line-clamp-2">{result.plot}</p>
                        </div>
                        <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronLeft className="rotate-180 text-slate-400" />
                        </div>
                        </div>
                    ))}
                    </div>
                ) : hasSearched && !error ? (
                    <div className="text-center py-12 text-slate-500">
                    <Film size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t('no_results')}</p>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500">
                    <Camera size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t('vision_search')}</p>
                    <p className="text-xs opacity-60 mt-2">{t('search_placeholder')}</p>
                    </div>
                )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};