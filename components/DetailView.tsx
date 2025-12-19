
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
    }, [initialItem, apiKey, user?.id]);
    
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B0E14] animate-in fade-in duration-500 overflow-hidden">
            
            {/* 1. ECHTER FULLSCREEN HINTERGRUND TRAILER */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden w-full h-full">
                {backgroundTrailerUrl ? (
                    <div className="absolute inset-0 w-full h-full scale-[1.5]">
                         <iframe 
                            src={backgroundTrailerUrl} 
                            className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 opacity-[0.25] grayscale-[0.2]" 
                            allow="autoplay; encrypted-media"
                            title="Background Ambient"
                        />
                    </div>
                ) : backdropUrl && (
                    <img src={backdropUrl} className="w-full h-full object-cover opacity-20 blur-sm" alt="" />
                )}
                {/* Verlauf-Layer für besseren Kontrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/60 to-[#0B0E14]/90" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-transparent to-transparent opacity-80" />
            </div>

            {/* 2. DER CONTENT CONTAINER */}
            <div className="relative z-10 w-full h-full flex flex-col md:flex-row gap-12 px-6 py-12 md:px-24 md:py-20 overflow-y-auto custom-scrollbar">
                
                {/* Close Button oben rechts */}
                <button onClick={onClose} className="fixed top-8 right-8 z-[100] p-3 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-90">
                    <X size={28} />
                </button>

                {/* LINKE SPALTE: POSTER (FIXIERT AUF DESKTOP) */}
                <div className="w-full md:w-[400px] shrink-0">
                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] border border-white/10 group">
                         {posterUrl ? <img src={posterUrl} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film size={64}/></div>}
                         
                         {/* Play Button permanent sichtbar wie im Screenshot */}
                         {trailerUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer group" onClick={() => setShowTrailer(true)}>
                                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110">
                                    <Play size={36} fill="currentColor" className="ml-1" />
                                </div>
                            </div>
                         )}
                    </div>
                </div>

                {/* RECHTE SPALTE: DETAILS & TEXT */}
                <div className="flex-grow space-y-10 max-w-4xl">
                    
                    {/* Meta Header */}
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-500/30">{displayItem.type}</span>
                            {displayItem.status && <span className="px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/30">{t(displayItem.status.toLowerCase())}</span>}
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tight drop-shadow-2xl">
                            {displayItem.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-slate-300 font-bold text-sm">
                            <span className="flex items-center gap-2.5"><Calendar size={18} className="text-slate-500"/> {displayItem.year}</span>
                            {displayItem.runtime && <span className="flex items-center gap-2.5"><Clock size={18} className="text-slate-500"/> {Math.floor(displayItem.runtime/60)}h {displayItem.runtime%60}m</span>}
                            
                            <div className="flex items-center gap-3">
                                <div className="bg-[#0d253f] px-2.5 py-1 rounded border border-[#01b4e4]/40 flex items-center gap-2">
                                    <span className="text-[10px] font-black text-[#01b4e4] tracking-tighter">TMDB</span>
                                    <span className="text-white font-black">{displayItem.rating?.toFixed(1)}</span>
                                </div>
                                {rtState && (
                                    <div className={`px-2.5 py-1 rounded border flex items-center gap-2 ${rtState === 'fresh' ? 'bg-[#fa320a]/20 border-[#fa320a]/40' : 'bg-green-600/20 border-green-600/40'}`}>
                                        <Zap size={14} fill="currentColor" className={rtState === 'fresh' ? 'text-[#fa320a]' : 'text-green-500'} />
                                        <span className="text-white font-black">{displayItem.rtScore}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                        {isExisting ? (
                            <button onClick={() => onToggleFavorite && (initialItem as MediaItem).id && onToggleFavorite((initialItem as MediaItem).id)} className={`px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 border shadow-xl ${isFav ? 'bg-red-600 text-white border-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                                <Heart size={20} fill={isFav ? "currentColor" : "none"} /> {isFav ? 'Favorisiert' : 'Favorisieren'}
                            </button>
                        ) : (
                            <button onClick={() => onAdd && onAdd(initialItem as SearchResult, WatchStatus.TO_WATCH, isFav)} className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-2xl transition-all flex items-center gap-3">
                                <Clock size={20} /> {t('watchlist')}
                            </button>
                        )}
                        <button onClick={handleShare} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center gap-3 font-black">
                            <Share2 size={20} /> {copied ? 'LINK KOPIERT' : 'TEILEN'}
                        </button>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-10 border-b border-white/5 pt-4">
                        {['overview', 'cast', 'watch'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 text-xs font-black uppercase tracking-[0.25em] transition-all border-b-2 ${activeTab === tab ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                                {t(tab === 'watch' ? 'stream' : tab === 'cast' ? 'besetzung' : 'überblick').toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content Areas */}
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === 'overview' && (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">HANDLUNG</h3>
                                    <p className="text-xl text-slate-200 leading-relaxed font-medium">{displayItem.plot}</p>
                                </div>

                                {/* Deep Content Analysis Box */}
                                <div className="bg-[#1a1525]/80 backdrop-blur-md p-8 rounded-[2rem] border border-purple-500/20 relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full"></div>
                                     <h3 className="text-purple-400 text-[10px] font-black uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                                        <Sparkles size={14} /> DEEP CONTENT ANALYSIS
                                     </h3>
                                     <p className="text-purple-100 italic text-lg leading-relaxed">
                                        {loadingAi ? "KI analysiert Handlung..." : (aiAnalysis || "Analyse nicht verfügbar.")}
                                     </p>
                                </div>

                                {isExisting && (
                                    <div className="space-y-6 pt-6 border-t border-white/5">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">DEINE REZENSION</h3>
                                            <span className="text-[10px] bg-green-900/30 text-green-400 px-3 py-1 rounded-full border border-green-500/20 font-black uppercase tracking-widest">Öffentlich sichtbar</span>
                                        </div>
                                        <textarea 
                                            value={notes} onChange={e => setNotes(e.target.value)} onBlur={handleSaveNotes}
                                            placeholder="Teile deine Meinung mit der Community! Was hat dir gefallen? Was nicht? Deine Rezension hilft auch der AI."
                                            className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-6 text-slate-200 text-lg focus:border-cyan-500 transition-all min-h-[160px] resize-none"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'cast' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                                {displayItem.credits?.slice(0, 10).map(actor => (
                                    <div key={actor.id} className="text-center group">
                                        <div className="aspect-square rounded-2xl overflow-hidden mb-3 border-2 border-transparent group-hover:border-cyan-500/50 transition-all shadow-2xl">
                                            {actor.profilePath ? <img src={`${IMAGE_BASE_URL}${actor.profilePath}`} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={32} className="text-slate-600"/></div>}
                                        </div>
                                        <div className="text-sm font-bold text-white truncate">{actor.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{actor.character}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'watch' && (
                            <div className="flex flex-wrap gap-8 justify-start py-4">
                                {displayItem.providers?.length ? displayItem.providers.map(p => (
                                    <div key={p.providerId} className="flex flex-col items-center gap-3 group">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                                            <img src={`${LOGO_BASE_URL}${p.logoPath}`} className="w-full h-full object-cover" alt=""/>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.providerName}</span>
                                    </div>
                                )) : <div className="text-slate-500 italic text-lg">Keine Streaming-Infos gefunden.</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. FULLSCREEN VIDEO MODAL OVERLAY */}
            {showTrailer && trailerUrl && (
                <div className="fixed inset-0 z-[200] bg-black animate-in fade-in zoom-in-95 duration-500">
                    <iframe src={trailerUrl} className="w-full h-full border-0" allow="autoplay; encrypted-media" allowFullScreen title="Trailer Player" />
                    <button onClick={() => setShowTrailer(false)} className="absolute top-8 left-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-3xl border border-white/20 shadow-2xl">
                        <X size={32} />
                    </button>
                </div>
            )}
        </div>
    );
};
