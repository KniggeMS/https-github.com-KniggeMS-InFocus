import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Star, Play, Clock, Check, Share2, AlertCircle, 
  Loader2, Film, User, Calendar, Tv, Zap, Users, MonitorPlay, MessageSquare
} from 'lucide-react';
import { MediaItem, SearchResult, WatchStatus, MediaType, PublicReview } from '../types';
import { getMediaDetails, IMAGE_BASE_URL, BACKDROP_BASE_URL, LOGO_BASE_URL } from '../services/tmdb';
import { analyzeMovieContext } from '../services/gemini';
import { fetchPublicReviews } from '../services/db';
import { getOmdbRatings } from '../services/omdb';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface DetailViewProps {
  item: MediaItem | SearchResult;
  isExisting: boolean;
  onClose: () => void;
  apiKey: string;
  omdbApiKey?: string;
  
  onUpdateStatus?: (id: string, status: WatchStatus) => void;
  onToggleFavorite?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateRtScore?: (id: string, score: string) => void;
  
  onAdd?: (item: SearchResult, status: WatchStatus, isFav: boolean) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ 
    item: initialItem, isExisting, onClose, apiKey, omdbApiKey, 
    onUpdateStatus, onToggleFavorite, onUpdateNotes, onUpdateRtScore, onAdd 
}) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [details, setDetails] = useState<Partial<MediaItem>>({});
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [publicReviews, setPublicReviews] = useState<PublicReview[]>([]);
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [backgroundTrailerUrl, setBackgroundTrailerUrl] = useState<string | null>(null);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'watch' | 'reviews'>('overview');
    const [notes, setNotes] = useState(isExisting ? (initialItem as MediaItem).userNotes || '' : '');
    const [isFav, setIsFav] = useState(isExisting ? (initialItem as MediaItem).isFavorite || false : false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const extended = await getMediaDetails(initialItem, apiKey);
                setDetails(extended);
                
                if (extended.trailerKey) {
                    const origin = window.location.origin;
                    // Standard Trailer URL
                    setTrailerUrl(`https://www.youtube-nocookie.com/embed/${extended.trailerKey}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`);
                    
                    // FIX: Ambient Trailer with extra params to prevent "Bot detection" on web
                    // origin and widget_referrer are critical for YouTube's security handshake
                    const bgParams = new URLSearchParams({
                        autoplay: '1',
                        mute: '1',
                        controls: '0',
                        loop: '1',
                        playlist: extended.trailerKey,
                        showinfo: '0',
                        modestbranding: '1',
                        iv_load_policy: '3',
                        disablekb: '1',
                        fs: '0',
                        rel: '0',
                        playsinline: '1',
                        enablejsapi: '1',
                        origin: origin,
                        widget_referrer: origin
                    }).toString();
                    
                    setBackgroundTrailerUrl(`https://www.youtube-nocookie.com/embed/${extended.trailerKey}?${bgParams}`);
                }

                const imdbId = initialItem.imdbId || extended.imdbId;
                if (omdbApiKey && imdbId && isExisting && onUpdateRtScore) {
                     getOmdbRatings(imdbId, omdbApiKey).then(score => {
                         if (score && isExisting && onUpdateRtScore) {
                             if ((initialItem as MediaItem).rtScore !== score) {
                                 onUpdateRtScore((initialItem as MediaItem).id, score);
                             }
                         }
                     });
                }

                if (isExisting) {
                    setLoadingAi(true);
                    analyzeMovieContext(initialItem as MediaItem, (initialItem as MediaItem).userNotes)
                        .then(text => setAiAnalysis(text))
                        .catch(() => setAiAnalysis(null))
                        .finally(() => setLoadingAi(false));
                }

                if (initialItem.tmdbId) {
                    fetchPublicReviews(initialItem.tmdbId).then(reviews => {
                        const othersReviews = reviews.filter(r => r.userId !== user?.id);
                        setPublicReviews(othersReviews);
                    });
                }

            } catch (e) {
                console.error("Detail load error", e);
            }
        };
        loadDetails();
    }, [initialItem, apiKey, omdbApiKey]);
    
    const handleShare = async () => {
        const url = `https://www.themoviedb.org/${initialItem.type === MediaType.MOVIE ? 'movie' : 'tv'}/${initialItem.tmdbId}`;
        const text = `Check out "${initialItem.title}" (${initialItem.year})! ${url}`;
        
        try {
            if (navigator.share) {
                await navigator.share({ title: initialItem.title, text: text, url: url });
            } else {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) { console.error(err); }
    };

    const handleSaveNotes = () => {
        if (isExisting && onUpdateNotes && (initialItem as MediaItem).id) {
            onUpdateNotes((initialItem as MediaItem).id, notes);
            setLoadingAi(true);
            analyzeMovieContext({ ...initialItem, userNotes: notes } as MediaItem, notes)
                .then(text => setAiAnalysis(text))
                .catch(() => {})
                .finally(() => setLoadingAi(false));
        }
    };

    const handleAddClick = (status: WatchStatus) => {
        if (onAdd) onAdd(initialItem as SearchResult, status, isFav);
    };

    // Helpers
    const formatRuntime = (mins?: number) => {
        if (!mins) return null;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const getRtState = (scoreStr?: string) => {
        if (!scoreStr) return null;
        const score = parseInt(scoreStr);
        if (isNaN(score)) return null;
        return score >= 60 ? 'fresh' : 'rotten';
    };

    const displayItem = { ...initialItem, ...details };
    const posterUrl = displayItem.posterPath ? `${IMAGE_BASE_URL}${displayItem.posterPath}` : null;
    const backdropUrl = displayItem.backdropPath ? `${BACKDROP_BASE_URL}${displayItem.backdropPath}` : null;
    const rtState = getRtState(displayItem.rtScore);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
             <div className="bg-slate-900 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative group">
                
                <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors">
                    <X size={24} />
                </button>

                {/* LEFT: VISUALS */}
                <div className="w-full md:w-2/5 relative bg-black flex-shrink-0 min-h-[250px] md:min-h-full overflow-hidden">
                    {/* Active Trailer Overlay */}
                    {showTrailer && trailerUrl ? (
                         <div className="absolute inset-0 z-30 bg-black animate-in fade-in duration-500">
                            <iframe 
                                src={trailerUrl} 
                                title="Trailer Player" 
                                className="w-full h-full" 
                                allow="autoplay; encrypted-media" 
                                allowFullScreen 
                            />
                            <button onClick={() => setShowTrailer(false)} className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20 backdrop-blur-md">
                                {t('close_trailer')}
                            </button>
                         </div>
                    ) : (
                        <>
                            {/* Cinematic Background Layer */}
                            <div className="absolute inset-0 z-0">
                                {backgroundTrailerUrl ? (
                                    <div className="w-full h-full relative overflow-hidden">
                                        <iframe 
                                            src={backgroundTrailerUrl} 
                                            className="w-full h-[140%] -mt-[20%] object-cover scale-150 opacity-40 pointer-events-none" 
                                            title="Ambient Trailer Background"
                                            allow="autoplay; encrypted-media"
                                            tabIndex={-1}
                                            referrerPolicy="strict-origin-when-cross-origin"
                                        />
                                        {/* Overlay to ensure text readability and cinematic feel */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/60 md:bg-gradient-to-r md:from-transparent md:to-slate-900" />
                                    </div>
                                ) : (
                                    backdropUrl && (
                                        <>
                                            <img src={backdropUrl} className="w-full h-full object-cover opacity-60" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-900" />
                                        </>
                                    )
                                )}
                            </div>
                            
                            {/* Poster Floating Layer */}
                            <div className="absolute inset-0 flex items-center justify-center p-8 z-10 pointer-events-auto">
                                <div className="relative w-40 md:w-48 shadow-2xl rounded-lg overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-500">
                                    {posterUrl ? (
                                        <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-64 bg-slate-800 flex items-center justify-center text-slate-500"><Film size={48} /></div>
                                    )}
                                    {trailerUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors cursor-pointer" onClick={() => setShowTrailer(true)}>
                                            <div className="w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-500 hover:scale-110 transition-all backdrop-blur-sm">
                                                <Play size={28} fill="currentColor" className="ml-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT: DETAILS */}
                <div className="flex-grow flex flex-col bg-slate-900 overflow-hidden relative z-10">
                    
                    {/* Header Area */}
                    <div className="p-6 md:p-8 pb-0">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {displayItem.type === MediaType.MOVIE ? (
                                <span className="px-2 py-0.5 rounded-md bg-cyan-900/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-900/50">Movie</span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-md bg-purple-900/30 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-900/50">Series</span>
                            )}
                            {displayItem.status && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                    displayItem.status === WatchStatus.WATCHED ? 'bg-green-900/30 text-green-400 border-green-900/50' : 
                                    displayItem.status === WatchStatus.WATCHING ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 
                                    'bg-yellow-900/30 text-yellow-400 border-yellow-900/50'
                                }`}>
                                    {t(displayItem.status === WatchStatus.TO_WATCH ? 'planned' : displayItem.status === WatchStatus.WATCHING ? 'watching' : 'seen')}
                                </span>
                            )}
                        </div>

                        <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3">
                            {displayItem.title}
                        </h2>
                        
                        {/* METADATA ROW WITH ICONS */}
                        <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm font-medium mb-6">
                            <span className="flex items-center gap-1"><Calendar size={14}/> {displayItem.year}</span>
                            
                            {displayItem.runtime && (
                                <span className="flex items-center gap-1 text-slate-300">
                                    <Clock size={14} /> {formatRuntime(displayItem.runtime)}
                                </span>
                            )}

                            {/* TMDB Badge */}
                            <div className="flex items-center gap-1.5 bg-[#0d253f] px-2 py-0.5 rounded border border-[#01b4e4]/30" title="TMDB Score">
                                <span className="font-black text-[9px] text-[#01b4e4] tracking-tighter">TMDB</span>
                                <span className="text-[10px] font-bold text-white">{displayItem.rating.toFixed(1)}</span>
                            </div>

                            {/* Rotten Tomatoes Badge */}
                            {rtState && (
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${rtState === 'fresh' ? 'bg-[#fa320a]/10 border-[#fa320a]/30' : 'bg-green-600/10 border-green-600/30'}`} title="Rotten Tomatoes">
                                    <Zap size={10} className={rtState === 'fresh' ? 'text-[#fa320a] fill-[#fa320a]' : 'text-green-500 fill-green-500'} />
                                    <span className={`text-[10px] font-bold ${rtState === 'fresh' ? 'text-red-200' : 'text-green-200'}`}>{displayItem.rtScore}</span>
                                </div>
                            )}
                        </div>

                        {/* ACTIONS ROW */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            {isExisting ? (
                                <button 
                                    onClick={() => {
                                        if (onToggleFavorite && (initialItem as MediaItem).id) {
                                            onToggleFavorite((initialItem as MediaItem).id);
                                            setIsFav(!isFav);
                                        }
                                    }}
                                    className={`p-3 rounded-xl border transition-all flex items-center gap-2 font-bold text-sm ${isFav ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                >
                                    <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                                    {isFav ? 'Favorit' : 'Favorisieren'}
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => handleAddClick(WatchStatus.TO_WATCH)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2">
                                        <Clock size={18} /> {t('watchlist')}
                                    </button>
                                    <button onClick={() => handleAddClick(WatchStatus.WATCHED)} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                                        <Check size={18} /> {t('seen')}
                                    </button>
                                </>
                            )}
                            <button onClick={handleShare} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 border border-slate-700 shadow-sm transition-colors text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wide cursor-pointer ml-auto sm:ml-0">
                                {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} className="text-cyan-400" />}
                                {copied ? 'Kopiert' : t('share')}
                            </button>
                        </div>

                        {/* TABS NAVIGATION */}
                        <div className="flex gap-6 border-b border-slate-800 mb-0">
                            <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === 'overview' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                                Überblick
                            </button>
                            {displayItem.credits && displayItem.credits.length > 0 && (
                                <button onClick={() => setActiveTab('cast')} className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === 'cast' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                                    Besetzung
                                </button>
                            )}
                            <button onClick={() => setActiveTab('watch')} className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === 'watch' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                                Stream
                            </button>
                            {publicReviews.length > 0 && (
                                <button onClick={() => setActiveTab('reviews')} className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === 'reviews' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                                    Community
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SCROLLABLE CONTENT AREA */}
                    <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar flex-grow">
                        
                        {/* TAB: OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">{t('plot')}</h3>
                                    <p className="text-slate-300 leading-relaxed text-base">{displayItem.plot}</p>
                                </div>

                                {/* AI Insight */}
                                <div className="bg-gradient-to-br from-purple-900/20 to-slate-800 rounded-xl p-5 border border-purple-500/20 relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
                                    <h3 className="text-purple-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                        <Loader2 size={12} className={loadingAi ? "animate-spin" : "hidden"} />
                                        {t('ai_insight')}
                                    </h3>
                                    <p className="text-purple-100/90 text-sm italic relative z-10 leading-relaxed">
                                        {aiAnalysis || "Analysiere Filminhalt und Rezensionen..."}
                                    </p>
                                </div>

                                {isExisting && (
                                    <div className="space-y-3 pt-4 border-t border-slate-800">
                                        <div className="flex justify-between items-end">
                                            <label className="text-slate-500 text-xs font-bold uppercase">{t('public_review')}</label>
                                            <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">{t('review_public_badge')}</span>
                                        </div>
                                        <textarea 
                                            value={notes} 
                                            onChange={(e) => setNotes(e.target.value)}
                                            onBlur={handleSaveNotes}
                                            placeholder={t('review_placeholder')}
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-white focus:border-cyan-500 focus:outline-none min-h-[100px] resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: CAST */}
                        {activeTab === 'cast' && displayItem.credits && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
                                {displayItem.credits.map(actor => (
                                    <div key={actor.id} className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                            {actor.profilePath ? (
                                                <img src={`${IMAGE_BASE_URL}${actor.profilePath}`} className="w-full h-full object-cover" alt={actor.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={16}/></div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-white truncate">{actor.name}</div>
                                            <div className="text-[10px] text-slate-400 truncate">{actor.character}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TAB: STREAM */}
                        {activeTab === 'watch' && (
                            <div className="animate-in fade-in duration-300">
                                {displayItem.providers && displayItem.providers.length > 0 ? (
                                    <div className="space-y-4">
                                        <h3 className="text-slate-500 text-xs font-bold uppercase">Streaming Flatrate</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {displayItem.providers.map(p => (
                                                <div key={p.providerId} className="flex flex-col items-center gap-2">
                                                    <img 
                                                        src={`${LOGO_BASE_URL}${p.logoPath}`} 
                                                        alt={p.providerName}
                                                        className="w-12 h-12 rounded-xl shadow-lg border border-white/10" 
                                                    />
                                                    <span className="text-[10px] text-slate-400 max-w-[60px] text-center leading-tight">{p.providerName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800">
                                        <MonitorPlay size={32} className="mb-2 opacity-50"/>
                                        <p className="text-sm">Keine Streaming-Informationen verfügbar.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: REVIEWS */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                {publicReviews.map((rev, idx) => (
                                    <div key={idx} className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                                                {rev.avatar ? <img src={rev.avatar} alt={rev.username} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-slate-500"/></div>}
                                            </div>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <span className="text-sm font-bold text-white block leading-tight">{rev.username}</span>
                                                    <span className="text-[10px] text-slate-500">{new Date(rev.date).toLocaleDateString()}</span>
                                                </div>
                                                {rev.rating > 0 && (
                                                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full">
                                                        <Star size={10} fill="currentColor"/> {rev.rating}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed break-words">"{rev.content}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
};
