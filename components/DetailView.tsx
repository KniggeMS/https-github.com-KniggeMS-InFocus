
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
    
    const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'watch'>('overview');
    const [notes, setNotes] = useState(isExisting ? (initialItem as MediaItem).userNotes || '' : '');
    const [isFav, setIsFav] = useState(isExisting ? (initialItem as MediaItem).isFavorite || false : false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const extended = await getMediaDetails(initialItem, apiKey);
                setDetails(extended);
                
                const finalTrailerKey = (initialItem as any).trailerKey || extended.trailerKey;
                if (finalTrailerKey) {
                    const origin = window.location.origin;
                    setTrailerUrl(`https://www.youtube-nocookie.com/embed/${finalTrailerKey}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`);
                    
                    const bgParams = new URLSearchParams({
                        autoplay: '1', mute: '1', controls: '0', loop: '1', playlist: finalTrailerKey,
                        rel: '0', showinfo: '0', enablejsapi: '1', origin: origin,
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
                        .finally(() => setLoadingAi(false));
                }

                if (initialItem.tmdbId) {
                    fetchPublicReviews(initialItem.tmdbId).then(reviews => {
                        setPublicReviews(reviews.filter(r => r.userId !== user?.id));
                    });
                }
            } catch (e) { console.error(e); }
        };
        loadDetails();
    }, [initialItem, apiKey, omdbApiKey, user?.id]);
    
    const handleShare = async () => {
        const url = `https://www.themoviedb.org/${initialItem.type === MediaType.MOVIE ? 'movie' : 'tv'}/${initialItem.tmdbId}`;
        try {
            if (navigator.share) await navigator.share({ title: initialItem.title, url });
            else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
        } catch (err) {}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B0E14] animate-in fade-in duration-300">
            
            {/* FULLSCREEN BACKGROUND */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {backgroundTrailerUrl ? (
                    <div className="absolute inset-0 w-full h-full scale-[1.35]">
                         <iframe 
                            src={backgroundTrailerUrl} 
                            className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 opacity-[0.3] grayscale-[0.5]" 
                            allow="autoplay; encrypted-media"
                        />
                    </div>
                ) : backdropUrl && (
                    <img src={backdropUrl} className="w-full h-full object-cover opacity-20 blur-sm" alt="" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/70 to-[#0B0E14]/90" />
            </div>

            {/* MODAL CONTAINER */}
            <div className="relative z-10 w-full max-w-6xl h-full md:h-[90vh] mx-auto flex flex-col md:flex-row gap-12 p-6 md:p-12 overflow-y-auto custom-scrollbar">
                
                {/* Close Button */}
                <button onClick={onClose} className="fixed top-8 right-8 z-[70] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-90">
                    <X size={24} />
                </button>

                {/* LEFT COLUMN: POSTER */}
                <div className="w-full md:w-[350px] shrink-0">
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] border border-white/10 sticky top-0 group">
                         {posterUrl ? <img src={posterUrl} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film size={64}/></div>}
                         {trailerUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setShowTrailer(true)}>
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl scale-110">
                                    <Play size={28} fill="currentColor" className="ml-1" />
                                </div>
                            </div>
                         )}
                    </div>
                </div>

                {/* RIGHT COLUMN: INFO & CONTENT */}
                <div className="flex-grow space-y-8 pb-12">
                    
                    {/* Header Info */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-0.5 rounded bg-cyan-900/40 text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-500/20">{displayItem.type}</span>
                            {displayItem.status && <span className="px-2.5 py-0.5 rounded bg-orange-900/40 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">{t(displayItem.status.toLowerCase())}</span>}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl">{displayItem.title}</h1>

                        <div className="flex flex-wrap items-center gap-6 text-slate-300 font-bold text-sm">
                            <span className="flex items-center gap-2"><Calendar size={16} className="text-slate-500"/> {displayItem.year}</span>
                            {displayItem.runtime && <span className="flex items-center gap-2"><Clock size={16} className="text-slate-500"/> {Math.floor(displayItem.runtime/60)}h {displayItem.runtime%60}m</span>}
                            
                            <div className="flex items-center gap-2">
                                <div className="bg-[#0d253f] px-2 py-0.5 rounded border border-[#01b4e4]/30 flex items-center gap-1.5">
                                    <span className="text-[9px] font-black text-[#01b4e4] tracking-tighter">TMDB</span>
                                    <span className="text-white text-xs">{displayItem.rating?.toFixed(1)}</span>
                                </div>
                                {rtState && (
                                    <div className={`px-2 py-0.5 rounded border flex items-center gap-1.5 ${rtState === 'fresh' ? 'bg-[#fa320a]/10 border-[#fa320a]/30' : 'bg-green-600/10 border-green-600/30'}`}>
                                        <Zap size={12} fill="currentColor" className={rtState === 'fresh' ? 'text-[#fa320a]' : 'text-green-500'} />
                                        <span className="text-white text-xs font-black">{displayItem.rtScore}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {isExisting ? (
                            <button onClick={() => onToggleFavorite && (initialItem as MediaItem).id && onToggleFavorite((initialItem as MediaItem).id)} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border ${isFav ? 'bg-red-600 text-white border-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                                <Heart size={18} fill={isFav ? "currentColor" : "none"} /> {isFav ? 'Favorisiert' : 'Favorisieren'}
                            </button>
                        ) : (
                            <button onClick={() => onAdd && onAdd(initialItem as SearchResult, WatchStatus.TO_WATCH, isFav)} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
                                <Clock size={18} /> {t('watchlist')}
                            </button>
                        )}
                        <button onClick={handleShare} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 font-bold">
                            <Share2 size={18} /> {copied ? 'Link kopiert' : 'TEILEN'}
                        </button>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-8 border-b border-white/5">
                        {['overview', 'cast', 'watch'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === tab ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                                {t(tab === 'watch' ? 'stream' : tab === 'cast' ? 'besetzung' : 'überblick')}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Content Panels */}
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {activeTab === 'overview' && (
                            <>
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('handlung')}</h3>
                                    <p className="text-lg text-slate-200 leading-relaxed font-medium">{displayItem.plot}</p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-900/30 to-slate-900/60 p-6 rounded-2xl border border-purple-500/20">
                                     <h3 className="text-purple-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Sparkles size={12} /> DEEP CONTENT ANALYSIS
                                     </h3>
                                     <p className="text-purple-100 italic text-md leading-relaxed">
                                        {loadingAi ? "Analysiere Inhalt..." : (aiAnalysis || "Keine Analyse verfügbar.")}
                                     </p>
                                </div>

                                {isExisting && (
                                    <div className="space-y-4 pt-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('deine_rezension')}</h3>
                                            <span className="text-[9px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-500/20 font-bold uppercase">Öffentlich sichtbar</span>
                                        </div>
                                        <textarea 
                                            value={notes} onChange={e => setNotes(e.target.value)} onBlur={handleSaveNotes}
                                            placeholder="Teile deine Meinung mit der Community! Was hat dir gefallen? Was nicht? Deine Rezension hilft auch der AI."
                                            className="w-full bg-black/30 border border-white/5 rounded-xl p-4 text-slate-300 text-sm focus:border-cyan-500 transition-colors min-h-[120px] resize-none"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'cast' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {displayItem.credits?.slice(0, 10).map(actor => (
                                    <div key={actor.id} className="text-center bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="aspect-square rounded-lg overflow-hidden mb-2">
                                            {actor.profilePath ? <img src={`${IMAGE_BASE_URL}${actor.profilePath}`} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={24} className="text-slate-600"/></div>}
                                        </div>
                                        <div className="text-xs font-bold text-white truncate">{actor.name}</div>
                                        <div className="text-[9px] text-slate-500 uppercase truncate">{actor.character}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'watch' && (
                            <div className="flex flex-wrap gap-6 justify-start">
                                {displayItem.providers?.length ? displayItem.providers.map(p => (
                                    <div key={p.providerId} className="flex flex-col items-center gap-2">
                                        <img src={`${LOGO_BASE_URL}${p.logoPath}`} className="w-16 h-16 rounded-xl shadow-xl border border-white/10" alt=""/>
                                        <span className="text-[9px] font-black text-slate-500 uppercase">{p.providerName}</span>
                                    </div>
                                )) : <div className="text-slate-500 italic text-sm">Keine Streaming-Infos gefunden.</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FULLSCREEN TRAILER OVERLAY */}
            {showTrailer && trailerUrl && (
                <div className="fixed inset-0 z-[100] bg-black animate-in fade-in zoom-in-95 duration-500">
                    <iframe src={trailerUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Trailer" />
                    <button onClick={() => setShowTrailer(false)} className="absolute top-8 left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-3xl border border-white/20">
                        <X size={32} />
                    </button>
                </div>
            )}
        </div>
    );
};
