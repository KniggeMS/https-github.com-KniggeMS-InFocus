import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles, Plus, X, Quote } from 'lucide-react';
import { getRecommendations } from '../services/gemini';
import { searchTMDB, getMediaDetails, IMAGE_BASE_URL, LOGO_BASE_URL } from '../services/tmdb';
import { MediaItem, SearchResult, WatchStatus } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface AiRecommendationButtonProps {
  items: MediaItem[];
  onAdd: (item: SearchResult, status: WatchStatus) => void;
  apiKey: string;
  mobileFabOnly?: boolean;
}

export const AiRecommendationButton: React.FC<AiRecommendationButtonProps> = ({ items, onAdd, apiKey, mobileFabOnly = false }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any | null>(null);

  const getAiTip = async () => {
    setLoading(true);
    setRecommendation(null);

    try {
      // 1. Hole Empfehlung von Gemini
      const results = await getRecommendations(items);
      
      if (results && results.length > 0) {
        let bestPick = results[0] as any;
        
        // 2. Hydrierung mit TMDB Daten für Poster und Details
        if (apiKey && bestPick.title) {
            try {
                const tmdbResults = await searchTMDB(bestPick.title, apiKey);
                const match = tmdbResults.find((r: any) => r.type === bestPick.type) || tmdbResults[0];

                if (match) {
                   const details = await getMediaDetails(match, apiKey);
                   bestPick = {
                       ...match,
                       plot: bestPick.plot || match.plot,
                       genre: details.genre 
                   };
                }
            } catch (e) {
                console.error("Hydration failed", e);
            }
        }
        setRecommendation(bestPick);
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setRecommendation(null);

  const handleAdd = () => {
    if (recommendation) {
        onAdd(recommendation as SearchResult, WatchStatus.TO_WATCH);
        setRecommendation(null);
    }
  };

  return (
    <>
        {!mobileFabOnly && (
            <div className="w-full hidden md:block group cursor-pointer">
                <button 
                    onClick={getAiTip} 
                    disabled={loading} 
                    className="w-full bg-[#1A1425] hover:bg-[#251C35] border border-purple-500/20 rounded-2xl p-4 transition-all duration-300 shadow-xl relative overflow-hidden text-left"
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${loading ? 'bg-slate-800' : 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20'}`}>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> : <Sparkles className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-white uppercase tracking-tight">
                                    {loading ? t('analyzing') : t('ai_tip')}
                                </p>
                                {!loading && <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest">NEU</span>}
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                {loading ? "Gemini 1.5 Flash" : "Entdecke Filme"}
                            </p>
                        </div>
                    </div>
                    {/* Subtle Glow Effect */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/20 transition-colors"></div>
                </button>
            </div>
        )}

        {/* Mobiler Floating Action Button */}
        <button onClick={getAiTip} disabled={loading} className={`md:hidden fixed bottom-24 left-4 z-50 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-900/40 border-2 border-slate-900 active:scale-95 transition-transform ${!mobileFabOnly ? 'md:hidden' : ''}`}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
        </button>

        {/* Empfehlungs-Modal */}
        {recommendation && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-slate-900 border border-purple-500/30 w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
                    <button onClick={handleClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-slate-400 hover:text-white rounded-full z-20">
                      <X size={20} />
                    </button>
                    <div className="p-6 text-center overflow-y-auto custom-scrollbar">
                        <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden border-2 border-purple-400/50">
                             {recommendation.posterPath ? (
                               <img src={recommendation.posterPath} className="w-full h-full object-cover" alt="" />
                             ) : (
                               <Sparkles size={32} className="text-white" />
                             )}
                        </div>
                        <h3 className="text-2xl font-extrabold text-white mb-1">{recommendation.title}</h3>
                        <p className="text-slate-400 text-sm mb-4">({recommendation.year})</p>
                        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 mb-8 text-left relative">
                            <Quote className="absolute top-4 left-4 text-purple-500/30 transform -scale-x-100" size={24} />
                            <p className="text-slate-200 italic leading-relaxed pl-6 text-sm">{recommendation.plot}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleClose} className="flex-1 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl">
                              {t('cancel')}
                            </button>
                            <button onClick={handleAdd} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2">
                              <Plus size={18} /> {t('add_button')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}
    </>
  );
};
