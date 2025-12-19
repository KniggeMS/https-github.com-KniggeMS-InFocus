
import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Star, Play, Clock, Check, Share2, AlertCircle, 
  Loader2, Film, User, Calendar, Tv, Zap, Users, MonitorPlay, MessageSquare, ChevronDown, Sparkles
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
                
                // Trailer Logic - FIX: Use initialItem key if already exists
                const finalTrailerKey = (initialItem as any).trailerKey || extended.trailerKey;

                if (finalTrailerKey) {
                    const origin = window.location.origin;
                    setTrailerUrl(`https://www.youtube-nocookie.com/embed/${finalTrailerKey}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`);
                    
                    // FIXED: Playlist param is REQUIRED for loop=1 to work
                    const bgParams = new URLSearchParams({
                        autoplay: '1',
                        mute: '1',
                        controls: '0',
                        loop: '1',
                        playlist: finalTrailerKey,
                        rel: '0',
                        showinfo: '0',
                        enablejsapi: '1',
                        origin: origin,
                        widgetid: '1'
                    }).toString();
                    
                    setBackgroundTrailerUrl(`https://www.youtube.com/embed/${finalTrailerKey}?${bgParams}`);
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
            } catch (e) { console.error("Detail load error", e); }
        };
        loadDetails();
    }, [initialItem, apiKey, omdbApiKey]);
    
    const handleShare = async () => {
        const url = `https://www.themoviedb.org/${initialItem.type === MediaType.MOVIE ? 'movie' : 'tv'}/${initialItem.tmdbId}`;
        const text = `Check out "${initialItem.title}" (${initialItem.year})! ${url}`;
        try {
            if (navigator.share) await navigator.share({ title: initialItem.title, text: text, url: url });
            else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
        } catch (err) { console.error(err); }
    };

    const handleSaveNotes = () => {
        if (isExisting && onUpdateNotes && (initialItem as MediaItem).id) {
            onUpdateNotes((initialItem as MediaItem).id, notes);
            setLoadingAi(true);
            analyzeMovieContext({ ...initialItem, userNotes: notes } as MediaItem, notes).then(text => setAiAnalysis(text)).finally(() => setLoadingAi(false));
        }
    };

    const displayItem = { ...initialItem, ...details };
    const posterUrl = displayItem.posterPath ? `${IMAGE_BASE_URL}${displayItem.posterPath}` : null;
    const backdropUrl = displayItem.backdropPath ? `${BACKDROP_BASE_URL}${displayItem.backdropPath}` : null;
    const rtState = displayItem.rtScore ? (parseInt(displayItem.rtScore) >= 60 ? 'fresh' : 'rotten') : null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95 animate-in fade-in duration-300 overflow-y-auto">
            
            {/* FULLSCREEN BACKGROUND LAYER */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {backgroundTrailerUrl ? (
                    <div className="absolute inset-0 w-full h-full scale-125">
                         {/* Massive Oversize to force cover behavior */}
                         <iframe 
                            src={backgroundTrailerUrl} 
                            className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 opacity-[0.4] pointer-events-none" 
                            title="Ambient Background"
                            allow="autoplay; encrypted-media"
                        />
                    </div>
                ) : backdropUrl && (
                    <img src={backdropUrl} className="w-full h-full object-cover opacity-30 blur-sm" alt="" />
                )}
                {/* Vignette & Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-[#0B0E14]/80" />
                <div className="absolute inset-0 bg-radial-vignette opacity-60" />
            </div>

            {/* FLOATING UI CONTAINER */}
            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col items-center">
                
                {/* Close Button */}
                <button onClick={onClose} className="fixed top-6 right-6 z-[70] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl transition-all active:scale-90 border border-white/10">
                    <X size={28} />
                </button>

                {/* POSTER & MAIN INFO BOX */}
                <div className="w-full flex flex-col md:flex-row gap-10 items-center md:items-start mb-12">
                    
                    {/* Poster with Play Trigger */}
                    <div className="relative group w-64 md:w-80 shrink-0 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="absolute -inset-4 bg-cyan-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/10">
                             {posterUrl ? <img src={posterUrl} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film size={64}/></div>}
                             
                             {trailerUrl && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20" onClick={() => setShowTrailer(true)}>
                                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform">
                                        <Play size={32} fill="currentColor" className="ml-1" />
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* TEXT CONTENT */}
                    <div className="flex-grow text-center md:text-left pt-4 animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-500/30">{displayItem.type}</span>
                            {displayItem.status && <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10">{t(displayItem.status.toLowerCase())}</span>}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-2xl">
                            {displayItem.title}
                        </h1>

                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-slate-300 font-bold mb-8">
                            <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5"><Calendar size={16} className="text-cyan-400"/> {displayItem.year}</span>
                            {displayItem.runtime && <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5"><Clock size={16} className="text-purple-400"/> {Math.floor(displayItem.runtime/60)}h {displayItem.runtime%60}m</span>}
                            
                            <div className="flex items-center gap-3">
                                <div className="bg-[#0d253f] px-3 py-1.5 rounded-xl border border-[#01b4e4]/30 flex items-center gap-2">
                                    <span className="text-[10px] font-black text-[#01b4e4] tracking-tighter">TMDB</span>
                                    <span className="text-white font-black">{displayItem.rating?.toFixed(1)}</span>
                                </div>
                                {rtState && (
                                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${rtState === 'fresh' ? 'bg-[#fa320a]/20 border-[#fa320a]/30' : 'bg-green-600/20 border-green-600/30'} text-white`}>
                                        <Zap size={14} fill="currentColor" className={rtState === 'fresh' ? 'text-[#fa320a]' : 'text-green-500'} />
                                        <span className="font-black">{displayItem.rtScore}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-10">
                            {isExisting ? (
                                <button 
                                    onClick={() => onToggleFavorite && (initialItem as MediaItem).id && onToggleFavorite((initialItem as MediaItem).id)}
                                    className={`px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 border shadow-xl ${isFav ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
                                >
                                    <Heart size={20} fill={isFav ? "currentColor" : "none"} /> {isFav ? 'Favorit' : 'Favorisieren'}
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => onAdd && onAdd(initialItem as SearchResult, WatchStatus.TO_WATCH, isFav)} className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-2xl shadow-cyan-900/50 transition-all hover:scale-105 flex items-center gap-3">
                                        <Clock size={20} /> {t('watchlist')}
                                    </button>
                                    <button onClick={() => onAdd && onAdd(initialItem as SearchResult, WatchStatus.WATCHED, isFav)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                                        <Check size={20} /> {t('seen')}
                                    </button>
                                </>
                            )}
                            <button onClick={handleShare} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all">
                                {copied ? <Check className="text-green-400" /> : <Share2 />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* TABS & DETAILS PANELS */}
                <div className="w-full glass-panel rounded-[2rem] p-8 md:p-12 mb-20 animate-in slide-in-from-bottom-12 duration-700 delay-300">
                    <div className="flex gap-8 border-b border-white/5 mb-8">
                        {['overview', 'cast', 'watch', 'reviews'].map((tab) => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === tab ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                            >
                                {t(tab)}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[250px]">
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <p className="text-xl text-slate-200 leading-relaxed font-medium">{displayItem.plot}</p>
                                <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 p-6 rounded-3xl border border-purple-500/20 relative overflow-hidden">
                                     <h3 className="text-purple-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                        {/* Added missing Sparkles import below */}
                                        {loadingAi ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {t('ai_insight')}
                                     </h3>
                                     <p className="text-purple-100 italic text-lg leading-relaxed">{aiAnalysis || "Analysiere Inhalt..."}</p>
                                </div>
                                {isExisting && (
                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('public_review')}</label>
                                        <textarea 
                                            value={notes} 
                                            onChange={e => setNotes(e.target.value)} 
                                            onBlur={handleSaveNotes}
                                            placeholder={t('review_placeholder')}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-white text-lg focus:border-cyan-500 transition-colors min-h-[150px] resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'cast' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 animate-in fade-in duration-500">
                                {displayItem.credits?.slice(0, 10).map(actor => (
                                    <div key={actor.id} className="text-center group">
                                        <div className="aspect-square rounded-2xl overflow-hidden mb-3 border-2 border-transparent group-hover:border-cyan-500 transition-all duration-300">
                                            {actor.profilePath ? <img src={`${IMAGE_BASE_URL}${actor.profilePath}`} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={32} className="text-slate-600"/></div>}
                                        </div>
                                        <div className="text-sm font-bold text-white truncate">{actor.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{actor.character}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'watch' && (
                            <div className="flex flex-wrap gap-8 justify-center py-10 animate-in fade-in duration-500">
                                {displayItem.providers?.length ? displayItem.providers.map(p => (
                                    <div key={p.providerId} className="flex flex-col items-center gap-3">
                                        <img src={`${LOGO_BASE_URL}${p.logoPath}`} className="w-20 h-20 rounded-2xl shadow-2xl border border-white/10" alt=""/>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.providerName}</span>
                                    </div>
                                )) : <div className="text-slate-500 italic">Keine Streaming-Infos gefunden.</div>}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {publicReviews.length ? publicReviews.map((rev, i) => (
                                    <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex gap-6">
                                        <div className="w-12 h-12 rounded-full bg-slate-700 shrink-0 overflow-hidden">{rev.avatar ? <img src={rev.avatar} className="w-full h-full object-cover"/> : <User className="m-auto mt-3 text-slate-500"/>}</div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className="font-black text-white">{rev.username}</span>
                                                <div className="flex text-yellow-500"><Star size={12} fill="currentColor"/> <span className="text-xs font-bold ml-1">{rev.rating}</span></div>
                                            </div>
                                            <p className="text-slate-300 italic">"{rev.content}"</p>
                                        </div>
                                    </div>
                                )) : <div className="text-slate-500 italic">Noch keine Community-Stimmen. Sei der Erste!</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FULLSCREEN TRAILER OVERLAY (YOUTUBE LAYER) */}
            {showTrailer && trailerUrl && (
                <div className="fixed inset-0 z-[100] bg-black animate-in fade-in zoom-in-95 duration-500">
                    <iframe src={trailerUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Trailer" />
                    <button onClick={() => setShowTrailer(false)} className="absolute top-8 left-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-3xl border border-white/20">
                        <X size={32} />
                    </button>
                </div>
            )}
        </div>
    );
};
