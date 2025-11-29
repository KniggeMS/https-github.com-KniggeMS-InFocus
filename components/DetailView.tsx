
import React, { useState, useEffect } from 'react';
import { X, Film, Clock, MonitorPlay, Heart, Bookmark, Play, ChevronLeft, Layers, Check, PlayCircle, User, ExternalLink, Clapperboard, ImageOff, StickyNote, BrainCircuit, Loader2 } from 'lucide-react';
import { MediaItem, SearchResult, MediaType, WatchStatus } from '../types';
import { getMediaDetails, IMAGE_BASE_URL, BACKDROP_BASE_URL, LOGO_BASE_URL } from '../services/tmdb';
import { analyzeMovieContext } from '../services/gemini';
import { useTranslation } from '../contexts/LanguageContext';

interface DetailViewProps {
  item: MediaItem | SearchResult;
  onClose: () => void;
  // Actions
  onAdd?: (item: SearchResult, initialStatus?: WatchStatus, isFav?: boolean) => void;
  onUpdateStatus?: (id: string, status: WatchStatus) => void;
  onToggleFavorite?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void; // New prop
  // Context
  isExisting: boolean;
  apiKey: string;
}

export const DetailView: React.FC<DetailViewProps> = ({ 
  item: initialItem, 
  onClose, 
  onAdd, 
  onUpdateStatus, 
  onToggleFavorite, 
  onUpdateNotes,
  isExisting, 
  apiKey 
}) => {
  const { t } = useTranslation();
  const [details, setDetails] = useState<Partial<MediaItem> | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [playingTrailer, setPlayingTrailer] = useState(false);
  const [backgroundVideoReady, setBackgroundVideoReady] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Notes & AI Analysis State
  const [notes, setNotes] = useState((initialItem as MediaItem).userNotes || '');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const existingItem = isExisting ? (initialItem as MediaItem) : null;

  useEffect(() => {
    const loadDetails = async () => {
      setLoadingDetails(true);
      try {
        const fetchedDetails = await getMediaDetails(initialItem, apiKey);
        setDetails(fetchedDetails);
      } catch (e) {
        console.error("Failed to load details", e);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetails();
  }, [initialItem, apiKey]);

  useEffect(() => {
    setPlayingTrailer(false);
    setBackgroundVideoReady(false);
    setImgError(false);
    setAiInsight(null);
    if(existingItem) {
        setNotes(existingItem.userNotes || '');
    }
  }, [initialItem.tmdbId]);

  // Deep Content Analysis Trigger
  useEffect(() => {
     if (isExisting && existingItem && !aiInsight && !analyzing) {
        setAnalyzing(true);
        // Combine details for better context
        const fullItem: MediaItem = { ...(initialItem as MediaItem), ...details };
        
        analyzeMovieContext(fullItem, notes)
            .then(insight => setAiInsight(insight))
            .finally(() => setAnalyzing(false));
     }
  }, [isExisting, existingItem, details, notes]); // Re-analyze if notes change significantly? Or maybe manual trigger? Keeping it auto for now on open.

  // Auto-save notes logic
  useEffect(() => {
      if(isExisting && existingItem && onUpdateNotes) {
          const timeoutId = setTimeout(() => {
              if (notes !== existingItem.userNotes) {
                  onUpdateNotes(existingItem.id, notes);
              }
          }, 1000); // Save after 1 second of inactivity
          return () => clearTimeout(timeoutId);
      }
  }, [notes, isExisting, existingItem, onUpdateNotes]);

  const displayItem = { ...initialItem, ...details };

  const backdropUrl = displayItem.backdropPath 
      ? `${BACKDROP_BASE_URL}${displayItem.backdropPath}` 
      : null;
  
  const posterUrl = !imgError && displayItem.posterPath 
      ? `${IMAGE_BASE_URL}${displayItem.posterPath}` 
      : null;

  const percentage = Math.round(displayItem.rating * 10);
  const strokeDasharray = `${percentage}, 100`;

  const handleAdd = (status: WatchStatus = WatchStatus.TO_WATCH, isFav: boolean = false) => {
    if (onAdd && !isExisting) {
       onAdd(initialItem, status, isFav);
       onClose();
    }
  };

  const handleFavoriteClick = () => {
    if (isExisting && existingItem && onToggleFavorite) {
      onToggleFavorite(existingItem.id);
    } else {
      handleAdd(WatchStatus.TO_WATCH, true);
    }
  };

  const handleWatchlistClick = () => {
    if (isExisting && existingItem && onUpdateStatus) {
      onUpdateStatus(existingItem.id, WatchStatus.TO_WATCH);
    } else {
      handleAdd(WatchStatus.TO_WATCH, false);
    }
  };

  const currentStatus = existingItem?.status;
  const isFav = existingItem?.isFavorite;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  
  const backgroundTrailerUrl = displayItem?.trailerKey 
    ? `https://www.youtube.com/embed/${displayItem.trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${displayItem.trailerKey}&playsinline=1&enablejsapi=1&origin=${origin}&widgetid=1&iv_load_policy=3&modestbranding=1&fs=0`
    : null;

  const mainTrailerUrl = displayItem?.trailerKey
    ? `https://www.youtube.com/embed/${displayItem.trailerKey}?autoplay=1&rel=0&playsinline=1&origin=${origin}`
    : null;

  const externalYoutubeUrl = displayItem?.trailerKey
    ? `https://www.youtube.com/watch?v=${displayItem.trailerKey}`
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-5xl md:rounded-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[95vh] overflow-hidden relative border border-slate-800">
          
          <div className="absolute top-4 right-4 z-50 flex gap-2">
              <button onClick={onClose} className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors">
                <X size={24} />
              </button>
          </div>

          <div className="relative w-full h-[40vh] md:h-[500px] flex-shrink-0 bg-slate-950 overflow-hidden group">
              {/* Background Trailer */}
              {!playingTrailer && backgroundTrailerUrl && (
                 <div className="absolute inset-0 z-0 opacity-40 scale-[1.35]">
                    <iframe
                        width="100%"
                        height="100%"
                        src={backgroundTrailerUrl}
                        title="Background Trailer"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        className={`w-full h-full object-cover transition-opacity duration-1000 ${backgroundVideoReady ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setBackgroundVideoReady(true)}
                        tabIndex={-1}
                    ></iframe>
                 </div>
              )}

              {/* Static Backdrop Image */}
              {backdropUrl ? (
                  <img 
                    src={backdropUrl} 
                    alt="Backdrop" 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-0 pointer-events-none ${backgroundVideoReady && !playingTrailer ? 'opacity-0' : 'opacity-60'}`} 
                  />
              ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 z-0"></div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent z-10 pointer-events-none"></div>

              {/* Fullscreen Trailer Modal (Overlay) */}
              {playingTrailer && mainTrailerUrl && (
                  <div className="absolute inset-0 z-50 bg-black animate-in fade-in duration-300 flex flex-col">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={mainTrailerUrl} 
                        title="Trailer"
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="flex-grow"
                    ></iframe>
                    
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                        <button 
                            onClick={() => setPlayingTrailer(false)} 
                            className="pointer-events-auto bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-full shadow-lg uppercase font-bold tracking-wide flex items-center gap-2 transition-colors"
                        >
                            <X size={14} /> {t('close_trailer') || 'Schließen'}
                        </button>

                        {externalYoutubeUrl && (
                            <a 
                                href={externalYoutubeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="pointer-events-auto flex items-center gap-2 text-white/80 hover:text-white text-xs bg-black/50 hover:bg-black/70 px-3 py-2 rounded-full backdrop-blur-md transition-colors border border-white/20"
                            >
                                <ExternalLink size={14} />
                                YouTube
                            </a>
                        )}
                    </div>
                  </div>
              )}

              <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col md:flex-row gap-8 md:items-end z-20">
                  <div className="hidden md:block w-56 rounded-lg overflow-hidden shadow-2xl border-2 border-slate-700/50 flex-shrink-0 relative transform transition-transform group-hover:scale-[1.02] bg-slate-800 aspect-[2/3]">
                    {posterUrl ? (
                        <img 
                            src={posterUrl} 
                            alt={displayItem.title} 
                            className="w-full h-full object-cover" 
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-600 gap-2">
                            {backdropUrl ? (
                                // If poster fails but backdrop works, show cropped backdrop
                                <div 
                                    className="absolute inset-0 bg-cover bg-center opacity-50"
                                    style={{ backgroundImage: `url(${backdropUrl})` }}
                                ></div>
                            ) : null}
                            <div className="relative z-10 flex flex-col items-center">
                                <ImageOff size={48} className="opacity-40 mb-2" />
                                <span className="text-xs font-medium uppercase tracking-wider opacity-60">No Poster</span>
                            </div>
                        </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0 pb-2">
                      <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg text-balance">
                          {displayItem.title} <span className="text-slate-400 font-light text-2xl">({displayItem.year})</span>
                      </h1>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-300 mb-6">
                          {displayItem?.certification && (
                              <span className="px-2 py-0.5 border border-slate-500 rounded text-slate-300 text-xs font-bold bg-slate-900/40 backdrop-blur-sm">
                                  {displayItem.certification}
                              </span>
                          )}
                          <span>{displayItem.genre.join(', ')}</span>
                          {displayItem?.runtime && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                                <Clock size={14} /> 
                                <span>{displayItem.runtime} Min</span>
                              </div>
                          )}
                          {displayItem?.seasons && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                                <Layers size={14} />
                                <span>{displayItem.seasons} {t('seasons')}</span>
                              </div>
                          )}
                      </div>

                      {/* Rating & Vibe Section */}
                      <div className="flex flex-wrap items-center gap-y-4 gap-x-6 mb-8">
                          <div className="flex items-center gap-3">
                              <div className="relative w-14 h-14 flex items-center justify-center bg-slate-900/80 rounded-full border-2 border-slate-800 shadow-lg flex-shrink-0">
                                <svg viewBox="0 0 36 36" className="w-12 h-12 transform -rotate-90">
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={percentage > 70 ? '#22c55e' : percentage > 40 ? '#eab308' : '#ef4444'} strokeWidth="3" strokeDasharray={strokeDasharray} />
                                </svg>
                                <span className="absolute text-xs font-bold text-white">{percentage}<span className="text-[9px]">%</span></span>
                              </div>
                              <span className="font-bold text-white leading-tight text-sm drop-shadow-md whitespace-nowrap">{t('user_rating')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/10 shadow-lg">
                              <span className="text-xl hover:scale-125 transition-transform cursor-default">😍</span>
                              <span className="text-xl hover:scale-125 transition-transform cursor-default">🤯</span>
                              <span className="text-xl hover:scale-125 transition-transform cursor-default">😢</span>
                              <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
                              <span className="text-xs text-white font-medium whitespace-nowrap">{t('your_vibe')}</span>
                          </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3">
                          {displayItem?.trailerKey && (
                              <button 
                                onClick={() => setPlayingTrailer(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-200 text-slate-900 rounded-full font-bold transition-all shadow-lg hover:scale-105 mr-2"
                              >
                                <Play size={20} className="fill-slate-900" />
                                {t('play_trailer')}
                              </button>
                          )}

                          {!isExisting ? (
                            <button 
                              onClick={() => handleAdd(WatchStatus.TO_WATCH)}
                              className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full transition-all shadow-lg hover:scale-105 border border-cyan-500" 
                              title={t('to_list')}
                            >
                              <MonitorPlay size={20} />
                            </button>
                          ) : (
                            <div className="flex bg-slate-800/80 rounded-full p-1 border border-slate-700 backdrop-blur-md">
                               <button 
                                 onClick={() => onUpdateStatus?.(existingItem!.id, WatchStatus.TO_WATCH)}
                                 className={`p-2.5 rounded-full transition-all ${currentStatus === WatchStatus.TO_WATCH ? 'bg-yellow-500 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                 title={t('planned')}
                               >
                                 <Clock size={18} />
                               </button>
                               <button 
                                 onClick={() => onUpdateStatus?.(existingItem!.id, WatchStatus.WATCHING)}
                                 className={`p-2.5 rounded-full transition-all ${currentStatus === WatchStatus.WATCHING ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                 title={t('watching')}
                               >
                                 <PlayCircle size={18} />
                               </button>
                               <button 
                                 onClick={() => onUpdateStatus?.(existingItem!.id, WatchStatus.WATCHED)}
                                 className={`p-2.5 rounded-full transition-all ${currentStatus === WatchStatus.WATCHED ? 'bg-green-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                 title={t('seen')}
                               >
                                 <Check size={18} />
                               </button>
                            </div>
                          )}

                          <button 
                            onClick={handleFavoriteClick}
                            className={`p-3 rounded-full transition-all border shadow-lg hover:scale-105 ${isFav ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800/80 hover:bg-pink-600 border-slate-700 hover:border-pink-500 text-slate-300 hover:text-white'}`} 
                            title={t('favorite')}
                          >
                             <Heart size={20} className={isFav ? 'fill-white' : ''} />
                          </button>

                          <button 
                            onClick={handleWatchlistClick}
                            className={`p-3 rounded-full transition-all border shadow-lg hover:scale-105 ${currentStatus === WatchStatus.TO_WATCH ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800/80 hover:bg-cyan-600 border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white'}`} 
                            title={t('watchlist')}
                          >
                             <Bookmark size={20} className={currentStatus === WatchStatus.TO_WATCH ? 'fill-white' : ''} />
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex-grow bg-slate-900 p-6 md:p-10 overflow-y-auto custom-scrollbar z-20">
              <div className="grid md:grid-cols-3 gap-10">
                  <div className="md:col-span-2 space-y-8">
                    
                    {/* Deep Content Analysis (AI Insight) */}
                    {isExisting && (
                        <div className="bg-gradient-to-br from-purple-900/20 to-slate-800 p-6 rounded-xl border border-purple-500/20 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                                <BrainCircuit size={16} /> {t('ai_insight')}
                            </h4>
                            
                            <div className="text-slate-200 text-sm leading-relaxed italic">
                                {analyzing ? (
                                    <span className="flex items-center gap-2 opacity-70">
                                        <Loader2 size={14} className="animate-spin" /> {t('analyzing_content')}
                                    </span>
                                ) : (
                                    aiInsight || "Analyse wird gestartet..."
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 italic text-opacity-90">Jedes Ende hat einen Anfang</h3>
                        <h4 className="text-lg font-bold text-white mb-3">{t('plot')}</h4>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            {displayItem.plot}
                        </p>
                    </div>
                    
                    {/* Private Notes Section */}
                    {isExisting && (
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <StickyNote size={16} className="text-yellow-400" /> {t('private_notes')}
                            </h4>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm focus:border-cyan-500 focus:outline-none min-h-[100px] resize-y"
                                placeholder={t('notes_placeholder')}
                            />
                            <div className="flex justify-end mt-2">
                                <span className="text-[10px] text-slate-500">
                                    {notes === existingItem?.userNotes ? 'Gespeichert' : 'Änderungen werden gespeichert...'}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {displayItem?.credits && displayItem.credits.length > 0 && (
                         <div>
                            <h4 className="text-lg font-bold text-white mb-4">{t('cast')}</h4>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                {displayItem.credits.map((actor) => (
                                    <div key={actor.id} className="snap-start flex-shrink-0 w-24 text-center group">
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 mb-2 shadow-md relative group-hover:border-cyan-500 transition-colors">
                                            {actor.profilePath ? (
                                                <img 
                                                    src={`${IMAGE_BASE_URL}${actor.profilePath}`} 
                                                    alt={actor.name} 
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                                                    <User size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs font-bold text-slate-200 truncate px-1">{actor.name}</div>
                                        <div className="text-[10px] text-slate-500 truncate px-1">{actor.character}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(!displayItem.credits || displayItem.credits.length === 0) && displayItem?.creators && displayItem.creators.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
                            {displayItem.creators.map(creator => (
                                <div key={creator}>
                                    <div className="font-bold text-white text-base">{creator}</div>
                                    <div className="text-slate-500 text-xs uppercase tracking-wide">{t('creators')}</div>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                  
                  <div className="space-y-8">
                      {displayItem?.providers && displayItem.providers.length > 0 ? (
                          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-5 rounded-xl border border-slate-700 shadow-xl">
                              <div className="flex items-center gap-4 mb-4">
                                  {displayItem.providers[0].logoPath && (
                                      <img src={`${LOGO_BASE_URL}${displayItem.providers[0].logoPath}`} className="w-12 h-12 rounded-lg shadow-md" alt="" />
                                  )}
                                  <div>
                                      <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">{t('stream_available')}</div>
                                      <div className="text-white font-bold text-base">{t('watch_now')}</div>
                                  </div>
                              </div>
                              {displayItem.providers.length > 1 && (
                                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/50">
                                      {displayItem.providers.slice(1).map(p => (
                                          <img key={p.providerId} src={`${LOGO_BASE_URL}${p.logoPath}`} className="w-8 h-8 rounded-md opacity-70 hover:opacity-100 transition-opacity" title={p.providerName} alt={p.providerName} />
                                      ))}
                                  </div>
                              )}
                          </div>
                      ) : (
                          <div className="p-5 rounded-xl border border-dashed border-slate-700 text-slate-500 text-sm text-center">
                              {t('no_stream')}
                          </div>
                      )}

                      <div className="space-y-4 text-sm bg-slate-800/30 p-5 rounded-xl border border-slate-800">
                          <div className="flex justify-between border-b border-slate-800 pb-3">
                              <span className="text-slate-500 font-medium">{t('original_title')}</span>
                              <span className="text-slate-300 text-right font-semibold">{displayItem.originalTitle || displayItem.title}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-3">
                              <span className="text-slate-500 font-medium">{t('status')}</span>
                              <span className="text-slate-300 font-semibold">{displayItem.type === MediaType.MOVIE ? 'Veröffentlicht' : 'Laufend'}</span>
                          </div>
                          <div className="flex justify-between pb-1">
                              <span className="text-slate-500 font-medium">{t('language')}</span>
                              <span className="text-slate-300 font-semibold">Deutsch / Englisch</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
