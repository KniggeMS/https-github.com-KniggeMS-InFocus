
import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Star, Play, Clock, Check, Share2, AlertCircle, 
  Loader2, Film, User, Calendar, Tv, Zap, Users, MonitorPlay, MessageSquare, Sparkles
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
                    // Der eigentliche Video-Player (innerhalb der linken Spalte)
                    setTrailerUrl(`https://www.youtube-nocookie.com/embed/${finalTrailerKey}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`);
                    
                    // Hintergrund-Ambient-Version (stumm)
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B0E14]/95 backdrop-blur-md animate-in fade-in duration-300 p-4 md:p-8">
            <div className="bg-[#11141d] w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] border border-white/5 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 z-[100] p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all active:scale-90">
                    <X size={24} />
                </button>

                {/* LINKE SPALTE: VISUALS & TRAILER (LOCALIZED) */}
                <div className="w-full md:w-[400px] shrink-0 bg-black relative flex flex-col items-center justify-center group overflow-hidden">
                    
                    {/* Der Ambient Hintergrund Trailer - Nur hier links! */}
                    {!showTrailer && backgroundTrailerUrl && (
                        <div className="absolute inset-0 pointer-events-none opacity-40 grayscale-[0.2]">
                             <iframe 
                                src={backgroundTrailerUrl} 
                                className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2" 
                                allow="autoplay; encrypted-media"
                                title="Local Background"
                            />
                        </div>
                    )}

                    {/* Poster Layer */}
                    {!showTrailer && (
                        <div className="relative z-10 p-12 w-full">
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-105 transition-transform duration-500">
                                {posterUrl ? <img src={posterUrl} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film size={48}/></div>}
                                
                                {trailerUrl && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer group/btn" onClick={() => setShowTrailer(true)}>
                                        <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform group-hover/btn:scale-110">
                                            <Play size={36} fill="currentColor" className="ml-1" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AKTIVER TRAILER PLAYER - Ersetzt das Poster nur in der linken Spalte */}
                    {showTrailer && trailerUrl && (
                        <div className="absolute inset-0 z-30 bg-black animate-in fade-in duration-500">
                            <iframe src={trailerUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Trailer Player" />
                            <button onClick={() => setShowTrailer(false)} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                    )}
                    
                    {/* Verläufe für Übergang zum Inhalt */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#11141d] opacity-40 pointer-events-none" />
                </div>

                {/* RECHTE SPALTE: DETAILS & SCROLL CONTENT */}
                <div className="flex-grow flex flex-col overflow-hidden">
                    
                    <div className="p-8 md:p-12 pb-0">
                        <div className="flex flex-wrap gap-2.5 mb-4">
                            <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-500/30">{displayItem.type}</span>
                            {displayItem.status && <span className="px-2.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/30">{t(displayItem.status.toLowerCase())}</span>}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                            {displayItem.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold text-sm mb-8">
                            <span className="flex items-center gap-2"><Calendar size={16} className="text-slate-500"/> {displayItem.year}</span>
                            {displayItem.runtime && <span className="flex items-center gap-2"><Clock size={16} className="text-slate-500"/> {Math.floor(displayItem.runtime/60)}h {displayItem.runtime%60}m</span>}
                            
                            <div className="flex items-center gap-3">
                                <div className="bg-[#0d253f] px-2 py-0.5 rounded border border-[#01b4e4]/30 flex items-center gap-1.5">
                                    <span className="text-[9px] font-black text-[#01b4e4] tracking-tighter">TMDB</span>
                                    <span className="text-white font-bold text-xs">{displayItem.rating?.toFixed(1)}</span>
                                </div>
                                {rtState && (
                                    <div className={`px-2 py-0.5 rounded border flex items-center gap-1.5 ${rtState === 'fresh' ? 'bg-[#fa320a]/20 border-[#fa320a]/30' : 'bg-green-600/20 border-green-600/30'}`}>
                                        <Zap size={12} fill="currentColor" className={rtState === 'fresh' ? 'text-[#fa320a]' : 'text-green-500'} />
                                        <span className="text-white font-bold text-xs">{displayItem.rtScore}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-4 mb-8">
                            {isExisting ? (
                                <button onClick={() => onToggleFavorite && (initialItem as MediaItem).id && onToggleFavorite((initialItem as MediaItem).id)} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border ${isFav ? 'bg-red-600 text-white border-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                                    <Heart size={18} fill={isFav ? "currentColor" : "none"} /> {isFav ? 'Favorit' : 'Merken'}
                                </button>
                            ) : (
                                <button onClick={() => onAdd && onAdd(initialItem as SearchResult, WatchStatus.TO_WATCH, isFav)} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
                                    <Clock size={18} /> {t('watchlist')}
                                </button>
                            )}
                            <button onClick={handleShare} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 font-bold">
                                <Share2 size={18} /> {copied ? 'KOPIERT' : 'TEILEN'}
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-8 border-b border-white/5">
                            {['overview', 'cast', 'watch'].map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === tab ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                                    {t(tab === 'watch' ? 'stream' : tab === 'cast' ? 'besetzung' : 'überblick')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar p-8 md:p-12 pt-8">
                        <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {activeTab === 'overview' && (
                                <>
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HANDLUNG</h3>
                                        <p className="text-lg text-slate-200 leading-relaxed font-medium">{displayItem.plot}</p>
                                    </div>

                                    {/* Deep Content Analysis Box - Exaktes Design */}
                                    <div className="bg-[#1a1525]/80 backdrop-blur-md p-8 rounded-3xl border border-purple-500/20 relative overflow-hidden group">
                                         <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
                                         <h3 className="text-purple-400 text-[10px] font-black uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                                            <Sparkles size={14} /> DEEP CONTENT ANALYSIS
                                         </h3>
                                         <p className="text-purple-100 italic text-lg leading-relaxed">
                                            {loadingAi ? "KI analysiert..." : (aiAnalysis || "Wird geladen...")}
                                         </p>
                                    </div>

                                    {isExisting && (
                                        <div className="space-y-6 pt-6 border-t border-white/5">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DEINE REZENSION</h3>
                                                <span className="text-[9px] bg-green-900/30 text-green-400 px-3 py-1 rounded-full border border-green-500/20 font-black uppercase tracking-widest">Öffentlich</span>
                                            </div>
                                            <textarea 
                                                value={notes} onChange={e => setNotes(e.target.value)} onBlur={handleSaveNotes}
                                                placeholder="Teile deine Meinung..."
                                                className="w-full bg-black/30 border border-white/5 rounded-2xl p-6 text-slate-200 text-lg focus:border-cyan-500 transition-all min-h-[140px] resize-none"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'cast' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {displayItem.credits?.slice(0, 12).map(actor => (
                                        <div key={actor.id} className="flex items-center gap-4 group">
                                            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-transparent group-hover:border-cyan-500/50 transition-all shadow-lg">
                                                {actor.profilePath ? <img src={`${IMAGE_BASE_URL}${actor.profilePath}`} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={20} className="text-slate-600"/></div>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-white truncate">{actor.name}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{actor.character}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'watch' && (
                                <div className="flex flex-wrap gap-8 py-4">
                                    {displayItem.providers?.length ? displayItem.providers.map(p => (
                                        <div key={p.providerId} className="flex flex-col items-center gap-3 group">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl border border-white/10 group-hover:scale-110 transition-transform bg-slate-800">
                                                <img src={`${LOGO_BASE_URL}${p.logoPath}`} className="w-full h-full object-cover" alt=""/>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{p.providerName}</span>
                                        </div>
                                    )) : <div className="text-slate-500 italic">Keine Infos verfügbar.</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
