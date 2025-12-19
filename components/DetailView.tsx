
import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Play, Clock, Share2, Film, User, Calendar, Zap, Sparkles
} from 'lucide-react';
import { MediaItem, SearchResult, WatchStatus, MediaType } from '../types';
import { getMediaDetails, IMAGE_BASE_URL, LOGO_BASE_URL } from '../services/tmdb';
import { analyzeMovieContext } from '../services/gemini';
import { useTranslation } from '../contexts/LanguageContext';

interface DetailViewProps {
  item: MediaItem | SearchResult;
  isExisting: boolean;
  onClose: () => void;
  apiKey: string;
  onUpdateStatus?: (id: string, status: WatchStatus) => void;
  onToggleFavorite?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onAdd?: (item: SearchResult, status: WatchStatus, isFav: boolean) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ 
    item: initialItem, isExisting, onClose, apiKey, 
    onUpdateStatus, onToggleFavorite, onUpdateNotes, onAdd 
}) => {
    const { t } = useTranslation();
    const [details, setDetails] = useState<Partial<MediaItem>>({});
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [backgroundTrailerUrl, setBackgroundTrailerUrl] = useState<string | null>(null);
    
    const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'watch'>('overview');
    const [notes, setNotes] = useState(isExisting ? (initialItem as MediaItem).userNotes || '' : '');
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

                if (isExisting || (initialItem as SearchResult).tmdbId) {
                    setLoadingAi(true);
                    analyzeMovieContext(initialItem as MediaItem, notes)
                        .then(text => setAiAnalysis(text))
                        .finally(() => setLoadingAi(false));
                }
            } catch (e) { console.error(e); }
        };
        loadDetails();
    }, [initialItem, apiKey]);
    
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
        }
    };

    const displayItem = { ...initialItem, ...details };
    const posterUrl = displayItem.posterPath ? `${IMAGE_BASE_URL}${displayItem.posterPath}` : null;
    const rtState = displayItem.rtScore ? (parseInt(displayItem.rtScore) >= 60 ? 'fresh' : 'rotten') : null;
    const isFav = isExisting ? (initialItem as MediaItem).isFavorite : false;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B0E14]/95 backdrop-blur-md animate-in fade-in duration-300 p-4 md:p-8">
            <div className="bg-[#0B0E14] w-full max-w-5xl h-full md:h-auto md:max-h-[85vh] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] border border-white/5 flex flex-col md:flex-row overflow-hidden relative">
                
                <button onClick={onClose} className="absolute top-6 right-6 z-[100] p-2 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-90">
                    <X size={20} />
                </button>

                {/* LINKE SPALTE: POSTER & TRAILER */}
                <div className="w-full md:w-[340px] shrink-0 bg-black relative flex items-center justify-center overflow-hidden">
                    {!showTrailer && backgroundTrailerUrl && (
                        <div className="absolute inset-0 opacity-30 grayscale-[0.4]">
                             <iframe src={backgroundTrailerUrl} className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 pointer-events-none" allow="autoplay; encrypted-media" />
                        </div>
                    )}
                    {!showTrailer && (
                        <div className="relative z-10 p-10 w-full">
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                                {posterUrl ? <img src={posterUrl} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film size={48}/></div>}
                                {trailerUrl && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer" onClick={() => setShowTrailer(true)}>
                                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform">
                                            <Play size={32} fill="currentColor" className="ml-1" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {showTrailer && trailerUrl && (
                        <div className="absolute inset-0 z-30 bg-black">
                            <iframe src={trailerUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                            <button onClick={() => setShowTrailer(false)} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl border border-white/10">
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* RECHTE SPALTE */}
                <div className="flex-grow flex flex-col overflow-hidden bg-gradient-to-br from-[#0B0E14] to-[#121620]">
                    <div className="p-8 md:p-10 pb-0">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest border border-cyan-500/20">{displayItem.type}</span>
                            {displayItem.status && <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest border border-orange-500/20">{t(displayItem.status.toLowerCase())}</span>}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-5 tracking-tight">{displayItem.title}</h1>
                        <div className="flex flex-wrap items-center gap-5 text-slate-400 font-bold text-xs mb-6">
                            <span className="flex items-center gap-2"><Calendar size={14} /> {displayItem.year}</span>
                            {displayItem.runtime && <span className="flex items-center gap-2"><Clock size={14} /> {Math.floor(displayItem.runtime/60)}h {displayItem.runtime%60}m</span>}
                            <div className="flex items-center gap-3">
                                <div className="bg-[#0d253f] px-2 py-0.5 rounded border border-[#01b4e4]/30 flex items-center gap-1.5">
                                    <span className="text-[8px] font-black text-[#01b4e4]">TMDB</span>
                                    <span className="text-white font-bold">{displayItem.rating?.toFixed(1)}</span>
                                </div>
                                {rtState && (
                                    <div className={`px-2 py-0.5 rounded border flex items-center gap-1.5 ${rtState === 'fresh' ? 'bg-[#fa320a]/20 border-[#fa320a]/30' : 'bg-green-600/20 border-green-600/30'}`}>
                                        <Zap size={10} fill="currentColor" className={rtState === 'fresh' ? 'text-[#fa320a]' : 'text-green-500'} />
                                        <span className="text-white font-bold">{displayItem.rtScore}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mb-6">
                            {isExisting ? (
                                <button onClick={() => onToggleFavorite && (initialItem as MediaItem).id && onToggleFavorite((initialItem as MediaItem).id)} className={`px-5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 border text-sm ${isFav ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'}`}>
                                    <Heart size={16} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-red-500" : ""} /> {isFav ? 'Favorit' : 'Merken'}
                                </button>
                            ) : (
                                <button onClick={() => onAdd && onAdd(initialItem as SearchResult, WatchStatus.TO_WATCH, false)} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm">
                                    <Clock size={16} /> {t('watchlist')}
                                </button>
                            )}
                            <button onClick={handleShare} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 font-bold text-sm">
                                <Share2 size={16} /> {copied ? 'KOPIERT' : 'TEILEN'}
                            </button>
                        </div>
                        <div className="flex gap-8 border-b border-white/5">
                            {['overview', 'cast', 'watch'].map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === tab ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                                    {t(tab === 'watch' ? 'stream' : tab === 'cast' ? 'besetzung' : 'überblick')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-8 md:p-10 pt-6">
                        <div className="max-w-2xl space-y-8">
                            {activeTab === 'overview' && (
                                <>
                                    <div className="space-y-2.5">
                                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">HANDLUNG</h3>
                                        <p className="text-base text-slate-200 leading-relaxed font-medium">{displayItem.plot}</p>
                                    </div>
                                    <div className="bg-[#1a1525]/70 backdrop-blur-md p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden">
                                         <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full" />
                                         <h3 className="text-purple-400 text-[9px] font-black uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                                            <Sparkles size={12} /> DEEP CONTENT ANALYSIS
                                         </h3>
                                         <p className="text-purple-100 italic text-base leading-relaxed">{loadingAi ? "KI analysiert..." : (aiAnalysis || "Analyse bereit.")}</p>
                                    </div>
                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">DEINE REZENSION</h3>
                                            <span className="text-[8px] bg-green-950/30 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 font-black uppercase">Öffentlich</span>
                                        </div>
                                        <textarea 
                                            value={notes} onChange={e => setNotes(e.target.value)} onBlur={handleSaveNotes}
                                            placeholder="Teile deine Meinung..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-5 text-slate-200 text-sm focus:border-cyan-500 transition-all min-h-[120px] resize-none"
                                        />
                                    </div>
                                </>
                            )}
                            {activeTab === 'cast' && (
                                <div className="grid grid-cols-2 gap-4">
                                    {displayItem.credits?.slice(0, 8).map(actor => (
                                        <div key={actor.id} className="flex items-center gap-3 group">
                                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                                                {actor.profilePath ? <img src={`${IMAGE_BASE_URL}${actor.profilePath}`} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={16} className="text-slate-600"/></div>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-white truncate">{actor.name}</div>
                                                <div className="text-[9px] text-slate-500 uppercase tracking-widest truncate">{actor.character}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'watch' && (
                                <div className="flex flex-wrap gap-6 py-2">
                                    {displayItem.providers?.length ? displayItem.providers.map(p => (
                                        <div key={p.providerId} className="flex flex-col items-center gap-2 group">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-xl border border-white/10 transition-transform bg-slate-800">
                                                <img src={`${LOGO_BASE_URL}${p.logoPath}`} className="w-full h-full object-cover" alt=""/>
                                            </div>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{p.providerName}</span>
                                        </div>
                                    )) : <div className="text-slate-500 italic text-sm">Keine Infos verfügbar.</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
