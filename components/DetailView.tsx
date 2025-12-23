import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Play, Clock, Share2, Film, User, Calendar, Zap, Sparkles, Plus
} from 'lucide-react';
import { MediaItem, SearchResult, WatchStatus, MediaType } from '../types';
import { getMediaDetails, IMAGE_BASE_URL, LOGO_BASE_URL } from '../services/tmdb';
// Import aus unserem stabilen Baseline-Service
import { analyzeMovieContext as geminiAnalyze } from '../services/gemini';
import { analyzeMovieWithGroq } from '../services/groq';
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
    
    const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'facts' | 'analysis'>('overview');
    const [notes, setNotes] = useState(isExisting ? (initialItem as MediaItem).userNotes || '' : '');
    const [showTrailer, setShowTrailer] = useState(false);
    const [copied, setCopied] = useState(false);
    const [localIsFav, setLocalIsFav] = useState(isExisting ? (initialItem as MediaItem).isFavorite || false : false);
    const [showFullPlot, setShowFullPlot] = useState(false);

    // Sync local state with prop changes
    useEffect(() => {
        if (isExisting) {
            setLocalIsFav((initialItem as MediaItem).isFavorite || false);
        }
    }, [initialItem, isExisting]);

    const handleToggleFav = () => {
        if (isExisting && onToggleFavorite) {
            onToggleFavorite((initialItem as MediaItem).id);
        }
        setLocalIsFav(prev => !prev);
    };

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const extended = await getMediaDetails(initialItem as SearchResult, apiKey);
                setDetails(extended);
                
                const finalTrailerKey = (initialItem as any).trailerKey || extended.trailerKey;
                if (finalTrailerKey) {
                    const origin = window.location.origin;
                    setTrailerUrl(`https://www.youtube-nocookie.com/embed/${finalTrailerKey}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`);
                    const bgParams = new URLSearchParams({
                        autoplay: '1', mute: '1', controls: '0', loop: '1', playlist: finalTrailerKey,
                        rel: '0', showinfo: '0', enablejsapi: '1', origin: origin, playsinline: '1'
                    }).toString();
                    setBackgroundTrailerUrl(`https://www.youtube.com/embed/${finalTrailerKey}?${bgParams}`);
                }

                // KORREKTUR: Aufruf an Baseline-Service angepasst (Titel und Plot getrennt)
                if (isExisting || (initialItem as SearchResult).tmdbId) {
                    setLoadingAi(true);
                    
                    const performAnalysis = async () => {
                        try {
                            // Versuch 1: Groq (Schnell)
                            const res = await analyzeMovieWithGroq(initialItem.title, initialItem.plot || '');
                            setAiAnalysis(res);
                        } catch (err) {
                            console.warn("Groq analysis failed, trying Gemini:", err);
                            // Versuch 2: Gemini (Fallback)
                            const res = await geminiAnalyze(initialItem.title, initialItem.plot || '');
                            setAiAnalysis(res);
                        } finally {
                            setLoadingAi(false);
                        }
                    };
                    
                    performAnalysis();
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
    const posterUrl = displayItem.posterPath ? (displayItem.posterPath.startsWith('http') ? displayItem.posterPath : `${IMAGE_BASE_URL}${displayItem.posterPath}`) : null;
    const rtState = displayItem.rtScore ? (parseInt(displayItem.rtScore) >= 60 ? 'fresh' : 'rotten') : null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B0E14]/95 backdrop-blur-md animate-in fade-in duration-300 p-4 md:p-8">
            <button 
                onClick={onClose} 
                data-testid="close-detail"
                style={{ zIndex: 99999 }}
                className="fixed top-6 right-6 p-4 bg-slate-900/90 hover:bg-slate-800 text-white rounded-full border-2 border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all active:scale-90 backdrop-blur-2xl"
            >
                <X size={28} />
            </button>

            <div className="bg-[#0B0E14] w-full max-w-5xl h-full md:h-auto md:max-h-[85vh] rounded-[2rem] shadow-2xl border border-white/5 flex flex-col md:flex-row overflow-hidden relative group">
                
                {/* CINEMATIC BACKGROUND TRAILER */}

                <div className="w-full md:w-[340px] shrink-0 bg-transparent relative flex items-center justify-center overflow-hidden z-10">
                    {!showTrailer && (
                        <div className="relative z-10 p-10 w-full">
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900 group-hover:scale-105 transition-transform duration-700 ease-out">
                                {posterUrl ? <img src={posterUrl} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center"><Film size={48} className="text-slate-700"/></div>}
                                {trailerUrl && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={() => setShowTrailer(true)}>
                                        <div className="w-16 h-16 bg-red-600/90 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform border border-white/20">
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
                            <button onClick={() => setShowTrailer(false)} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/10">
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-grow flex flex-col overflow-hidden bg-transparent z-10 relative text-slate-200">
                    <div className="p-8 md:p-10 pb-0">
                        <div className="flex flex-wrap gap-2 mb-4 items-center">
                            <span className="px-2.5 py-1 rounded bg-[#00A3C4]/20 text-[#00A3C4] text-[10px] font-black uppercase tracking-widest border border-[#00A3C4]/20">{displayItem.type}</span>
                            {displayItem.productionStatus && (
                                <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${displayItem.productionStatus === 'Released' ? 'bg-[#FF9F1C]/20 text-[#FF9F1C] border-[#FF9F1C]/20' : 'bg-orange-500/20 text-orange-400 border-orange-500/20'}`}>
                                    {displayItem.productionStatus === 'Released' ? 'GEPLANT' : displayItem.productionStatus}
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 tracking-tight">{displayItem.title}</h1>
                        
                        <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold text-xs mb-8">
                            <span className="flex items-center gap-2"><Calendar size={16} /> {displayItem.year}</span>
                            {displayItem.runtime && <span className="flex items-center gap-2"><Clock size={16} /> {displayItem.runtime} min</span>}
                            <div className="bg-[#0d253f] px-2.5 py-1 rounded border border-[#01b4e4]/30 flex items-center gap-2">
                                <span className="text-[9px] font-black text-[#01b4e4] uppercase">TMDB</span>
                                <span className="text-white font-black">{displayItem.rating?.toFixed(1)}</span>
                            </div>
                            {displayItem.rtScore && (
                                <div className="bg-[#fa320a]/10 px-2.5 py-1 rounded border border-[#fa320a]/30 flex items-center gap-2">
                                    <Zap size={12} className="text-red-500 fill-red-500" />
                                    <span className="text-white font-black">{displayItem.rtScore}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 mb-10">
                            {isExisting ? (
                                <button 
                                    onClick={handleToggleFav}
                                    className={`px-8 py-3 rounded-2xl border transition-all flex items-center gap-3 font-black text-sm uppercase tracking-widest ${localIsFav ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                                >
                                    <Heart size={20} className={localIsFav ? "fill-current" : ""} /> Favorit
                                </button>
                            ) : (
                                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                                    <button 
                                        onClick={() => onAdd && onAdd(initialItem as SearchResult, WatchStatus.TO_WATCH, localIsFav)}
                                        className="flex-grow md:flex-none px-10 py-4 bg-[#00A3C4] hover:bg-[#00B4D8] text-white rounded-2xl shadow-xl shadow-cyan-900/20 transition-all flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest active:scale-[0.98]"
                                    >
                                        <Plus size={20} /> Zur Sammlung hinzufügen
                                    </button>
                                    <button 
                                        onClick={handleToggleFav}
                                        className={`px-6 py-4 rounded-2xl border transition-all flex items-center gap-3 font-black text-sm uppercase tracking-widest ${localIsFav ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                                    >
                                        <Heart size={20} className={localIsFav ? "fill-current" : ""} />
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={handleShare} 
                                data-testid="detail-share-button"
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center gap-3 font-black text-sm uppercase tracking-widest"
                            >
                                <Share2 size={20} /> {copied ? 'KOPIERT' : 'TEILEN'}
                            </button>
                        </div>

                        <div className="flex gap-8 border-b border-white/5">
                            {['overview', 'cast', 'facts', 'analysis'].map((tab) => (
                                <button 
                                    key={tab} 
                                    data-testid={`tab-${tab}`}
                                    onClick={() => setActiveTab(tab as any)} 
                                    className={`pb-4 text-[11px] font-black uppercase tracking-[0.25em] transition-all border-b-2 ${activeTab === tab ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                                >
                                    {t(tab === 'cast' ? 'besetzung' : (tab === 'facts' ? 'facts' : (tab === 'analysis' ? 'analyse' : 'überblick')))}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar p-8 md:p-10 pt-8">
                        <div className="max-w-3xl space-y-10">
                            {activeTab === 'overview' && (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">HANDLUNG</h3>
                                        <p className="text-lg text-slate-200 leading-relaxed font-medium">
                                            {displayItem.plot && displayItem.plot.length > 300 && !showFullPlot
                                                ? `${displayItem.plot.substring(0, 300)}...`
                                                : displayItem.plot}
                                        </p>
                                        {displayItem.plot && displayItem.plot.length > 300 && (
                                            <button onClick={() => setShowFullPlot(!showFullPlot)} className="text-sm font-bold text-cyan-400 hover:text-cyan-500 transition-colors mt-2">
                                                {showFullPlot ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                                            </button>
                                        )}
                                    </div>

                                    {isExisting && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DEINE REZENSION</h3>
                                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Öffentlich sichtbar
                                                </span>
                                            </div>
                                            <textarea 
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                onBlur={handleSaveNotes}
                                                placeholder="Teile deine Meinung mit der Community! Was hat dir gefallen? Was nicht? Deine Rezension hilft auch der AI."
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl p-6 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all h-40 resize-none font-medium leading-relaxed"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                            {activeTab === 'cast' && (
                                <div className="grid grid-cols-2 gap-4">
                                    {displayItem.credits?.slice(0, 6).map((actor: any) => (
                                        <div key={actor.id} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                                                {actor.profilePath ? <img src={`${IMAGE_BASE_URL}${actor.profilePath}`} className="w-full h-full object-cover" alt=""/> : <User size={16} className="m-auto mt-2 text-slate-600"/>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-white truncate">{actor.name}</div>
                                                <div className="text-[9px] text-slate-500 uppercase truncate">{actor.character}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'facts' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {displayItem.tagline && (
                                        <div className="space-y-2 md:col-span-2">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TAGLINE</h3>
                                            <p className="text-lg font-medium text-white italic">"{displayItem.tagline}"</p>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ORIGINAL TITEL</h3>
                                        <p className="text-sm font-bold text-white tracking-wide">{displayItem.originalTitle}</p>
                                    </div>
                                    {displayItem.collectionName && (
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SAMMLUNG</h3>
                                            <p className="text-sm font-bold text-white tracking-wide">{displayItem.collectionName}</p>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">BUDGET</h3>
                                        <p className="text-sm font-mono text-slate-300">
                                            {displayItem.budget && displayItem.budget > 0 ? `$ ${(displayItem.budget / 1000000).toFixed(1)} Mio.` : '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">BOX OFFICE</h3>
                                        <p className={`text-sm font-mono font-bold ${displayItem.revenue && displayItem.budget && displayItem.revenue > displayItem.budget * 2.5 ? 'text-green-400' : 'text-orange-400'}`}>
                                            {displayItem.revenue && displayItem.revenue > 0 ? `$ ${(displayItem.revenue / 1000000).toFixed(1)} Mio.` : '-'}
                                        </p>
                                    </div>
                                    {displayItem.productionStatus && (
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">PRODUKTION STATUS</h3>
                                            <p className="text-sm font-bold text-white tracking-wide">{displayItem.productionStatus}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                             {activeTab === 'analysis' && (
                                <div className="bg-[#2D1B4E]/40 p-8 rounded-[2rem] border border-purple-500/20 backdrop-blur-xl relative overflow-hidden group/ai shadow-2xl shadow-purple-900/20">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover/ai:bg-purple-500/20 transition-colors"></div>
                                     <h3 className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <Sparkles size={14} /> DEEP CONTENT ANALYSIS
                                     </h3>
                                     <p className="text-purple-100 italic text-base leading-relaxed font-medium">
                                        {loadingAi ? "Die AI analysiert den Filmkontext..." : (aiAnalysis && aiAnalysis.includes("Quotaregelung") ? aiAnalysis : (aiAnalysis || "Keine Analyse verfügbar."))}
                                     </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};