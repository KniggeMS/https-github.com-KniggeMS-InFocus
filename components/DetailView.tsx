
import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Star, Play, Clock, Check, Share2, AlertCircle, 
  Loader2, Film, User
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
  
  // For existing items
  onUpdateStatus?: (id: string, status: WatchStatus) => void;
  onToggleFavorite?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateRtScore?: (id: string, score: string) => void;
  
  // For new items
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
    const [activeTab, setActiveTab] = useState<'info' | 'providers' | 'cast'>('info');
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    
    // User Interaction States
    const [notes, setNotes] = useState(isExisting ? (initialItem as MediaItem).userNotes || '' : '');
    const [isFav, setIsFav] = useState(isExisting ? (initialItem as MediaItem).isFavorite || false : false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [copied, setCopied] = useState(false);

    // Load extra details on mount
    useEffect(() => {
        const loadDetails = async () => {
            try {
                // 1. TMDB Details
                const extended = await getMediaDetails(initialItem, apiKey);
                setDetails(extended);
                
                if (extended.trailerKey) {
                    setTrailerUrl(`https://www.youtube.com/embed/${extended.trailerKey}?autoplay=1`);
                }

                // 2. OMDb Ratings (if IMDb ID available)
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

                // 3. AI Analysis
                if (isExisting) {
                    setLoadingAi(true);
                    analyzeMovieContext(initialItem as MediaItem, (initialItem as MediaItem).userNotes)
                        .then(text => setAiAnalysis(text))
                        .catch(() => setAiAnalysis(null))
                        .finally(() => setLoadingAi(false));
                }

                // 4. Public Reviews (Community)
                if (initialItem.tmdbId) {
                    fetchPublicReviews(initialItem.tmdbId).then(reviews => {
                        // Filter out own review to avoid duplication with input field
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
                await navigator.share({
                    title: initialItem.title,
                    text: text,
                    url: url
                });
            } else {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const handleSaveNotes = () => {
        if (isExisting && onUpdateNotes && (initialItem as MediaItem).id) {
            onUpdateNotes((initialItem as MediaItem).id, notes);
            // Also re-trigger AI analysis as context changed
            setLoadingAi(true);
            analyzeMovieContext({ ...initialItem, userNotes: notes } as MediaItem, notes)
                .then(text => setAiAnalysis(text))
                .catch(() => {})
                .finally(() => setLoadingAi(false));
        }
    };

    const handleAddClick = (status: WatchStatus) => {
        if (onAdd) {
            onAdd(initialItem as SearchResult, status, isFav);
        }
    };

    const displayItem = { ...initialItem, ...details };
    const posterUrl = displayItem.posterPath ? `${IMAGE_BASE_URL}${displayItem.posterPath}` : null;
    const backdropUrl = displayItem.backdropPath ? `${BACKDROP_BASE_URL}${displayItem.backdropPath}` : null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
             <div className="bg-slate-900 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative group">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <X size={24} />
                </button>

                {/* LEFT: VISUALS (Backdrop/Trailer) */}
                <div className="w-full md:w-2/5 relative bg-black flex-shrink-0 min-h-[300px] md:min-h-full">
                    {showTrailer && trailerUrl ? (
                         <div className="absolute inset-0 z-20 bg-black">
                            <iframe 
                                src={trailerUrl} 
                                title="Trailer" 
                                className="w-full h-full" 
                                allow="autoplay; encrypted-media" 
                                allowFullScreen 
                            />
                            <button 
                                onClick={() => setShowTrailer(false)}
                                className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20 backdrop-blur-md"
                            >
                                {t('close_trailer')}
                            </button>
                         </div>
                    ) : (
                        <>
                            {backdropUrl ? (
                                <div className="absolute inset-0">
                                    <img src={backdropUrl} className="w-full h-full object-cover opacity-60" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-900" />
                                </div>
                            ) : null}
                            
                            {/* Poster Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center p-8 z-10">
                                <div className="relative w-48 shadow-2xl rounded-lg overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-500">
                                    {posterUrl ? (
                                        <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-64 bg-slate-800 flex items-center justify-center text-slate-500">
                                            <Film size={48} />
                                        </div>
                                    )}
                                    {trailerUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setShowTrailer(true)}
                                                className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-500 hover:scale-110 transition-all"
                                            >
                                                <Play size={20} fill="currentColor" className="ml-1" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT: DETAILS */}
                <div className="flex-grow flex flex-col bg-slate-900 overflow-y-auto custom-scrollbar relative z-10">
                    
                    {/* Header Info */}
                    <div className="p-6 md:p-8 border-b border-slate-800">
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

                        <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2">
                            {displayItem.title}
                        </h2>
                        
                        <div className="flex items-center gap-4 text-slate-400 text-sm font-medium mb-4">
                            <span>{displayItem.year}</span>
                            {displayItem.runtime && (
                                <span className="flex items-center gap-1">
                                    <Clock size={14} /> 
                                    {displayItem.runtime} min
                                </span>
                            )}
                            {displayItem.rating > 0 && (
                                <span className="flex items-center gap-1 text-yellow-500">
                                    <Star size={14} fill="currentColor" />
                                    {displayItem.rating.toFixed(1)}
                                </span>
                            )}
                        </div>

                        {/* Actions Row - WRAPPED */}
                        <div className="flex flex-wrap items-center gap-3">
                            {isExisting ? (
                                <>
                                    <button 
                                        onClick={() => {
                                            if (onToggleFavorite && (initialItem as MediaItem).id) {
                                                onToggleFavorite((initialItem as MediaItem).id);
                                                setIsFav(!isFav);
                                            }
                                        }}
                                        className={`p-2 rounded-full border transition-all ${isFav ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                                    >
                                        <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => handleAddClick(WatchStatus.TO_WATCH)}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
                                    >
                                        <Clock size={16} /> {t('watchlist')}
                                    </button>
                                    <button 
                                        onClick={() => handleAddClick(WatchStatus.WATCHED)}
                                        className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                                    >
                                        <Check size={16} /> {t('seen')}
                                    </button>
                                </>
                            )}
                            
                            <button
                              onClick={handleShare}
                              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-full px-3 py-2 sm:px-4 backdrop-blur-sm border border-white/5 shadow-lg transition-colors text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wide cursor-pointer flex-shrink-0"
                            >
                              {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} className="text-cyan-400" />}
                              {copied ? 'Kopiert' : t('share')}
                            </button>
                        </div>
                    </div>

                    {/* Tabs / Navigation */}
                    <div className="flex border-b border-slate-800 px-6 overflow-x-auto custom-scrollbar">
                        {(['info', 'providers', 'cast'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                            >
                                {tab === 'info' ? t('overview') : tab === 'providers' ? "Stream" : t('cast')}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 md:p-8 space-y-8 flex-grow">
                        {activeTab === 'info' && (
                            <>
                                {/* Plot */}
                                <div>
                                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">{t('plot')}</h3>
                                    <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                                        {displayItem.plot}
                                    </p>
                                </div>

                                {/* AI Insight */}
                                <div className="bg-gradient-to-br from-purple-900/20 to-slate-800 rounded-xl p-4 border border-purple-500/20 relative overflow-hidden">
                                     <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
                                     <h3 className="text-purple-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                         <Loader2 size={12} className={loadingAi ? "animate-spin" : "hidden"} />
                                         {t('ai_insight')}
                                     </h3>
                                     <p className="text-purple-100/80 text-sm italic relative z-10">
                                         {aiAnalysis || "Analysiere Filminhalt und Rezensionen..."}
                                     </p>
                                </div>

                                {/* User Notes (Only for Existing) */}
                                {isExisting && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                             <label className="text-slate-500 text-xs font-bold uppercase">{t('public_review')}</label>
                                             <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">{t('review_public_badge')}</span>
                                        </div>
                                        <textarea 
                                            value={notes} 
                                            onChange={(e) => setNotes(e.target.value)}
                                            onBlur={handleSaveNotes}
                                            placeholder={t('review_placeholder')}
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 focus:outline-none min-h-[100px] resize-none"
                                        />
                                    </div>
                                )}

                                {/* PUBLIC REVIEWS */}
                                <div className="space-y-4 pt-6 border-t border-slate-800">
                                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">{t('community_reviews')}</h3>
                                    {publicReviews.length > 0 ? (
                                        <div className="grid gap-4">
                                            {publicReviews.map((rev, idx) => (
                                                <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex gap-4">
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
                                                        <p className="text-sm text-slate-300 leading-relaxed break-words">
                                                            "{rev.content}"
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-sm italic">Noch keine Bewertungen aus der Community.</p>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'providers' && (
                            <div className="space-y-4">
                                <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">{t('stream_available')}</h3>
                                {displayItem.providers && displayItem.providers.length > 0 ? (
                                    <div className="flex flex-wrap gap-4">
                                        {displayItem.providers.map(p => (
                                            <div key={p.providerId} className="flex flex-col items-center gap-2 w-20">
                                                <img 
                                                    src={`${LOGO_BASE_URL}${p.logoPath}`} 
                                                    alt={p.providerName}
                                                    className="w-12 h-12 rounded-lg shadow-md" 
                                                />
                                                <span className="text-[10px] text-slate-400 text-center leading-tight">{p.providerName}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-500 text-sm italic flex items-center gap-2">
                                        <AlertCircle size={16} /> {t('no_stream')}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'cast' && (
                            <div className="space-y-4">
                                <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">{t('cast')}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {displayItem.credits?.slice(0, 9).map(actor => (
                                        <div key={actor.id} className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                {actor.profilePath ? (
                                                    <img src={`${IMAGE_BASE_URL}${actor.profilePath}`} className="w-full h-full object-cover" alt={actor.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">?</div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-white truncate" title={actor.name}>{actor.name}</div>
                                                <div className="text-xs text-slate-500 truncate" title={actor.character}>{actor.character}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
};
