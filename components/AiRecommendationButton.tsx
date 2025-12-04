
import React, { useState } from 'react';
import { AlertCircle, Loader2, Sparkles, Plus, X, Quote, Film } from 'lucide-react';
import { getRecommendations } from '../services/gemini';
import { searchTMDB, getMediaDetails, IMAGE_BASE_URL, LOGO_BASE_URL } from '../services/tmdb';
import { MediaItem, SearchResult, WatchStatus } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface AiRecommendationButtonProps {
  items: MediaItem[];
  onAdd: (item: SearchResult, status: WatchStatus) => void;
  apiKey: string;
}

export const AiRecommendationButton: React.FC<AiRecommendationButtonProps> = ({ items, onAdd, apiKey }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<SearchResult | null>(null);

  const getAiTip = async () => {
    setLoading(true);
    setRecommendation(null);

    try {
      // 1. Get Text Recommendation from Gemini
      const results = await getRecommendations(items);
      
      if (results && results.length > 0) {
        let bestPick = results[0];
        
        // 2. Hydrate with TMDB Data (Poster, Providers, Real Metadata)
        if (apiKey) {
            try {
                // Search by title and year to find the real TMDB ID
                const tmdbResults = await searchTMDB(bestPick.title, apiKey, bestPick.year.toString());
                const match = tmdbResults.find(r => r.type === bestPick.type) || tmdbResults[0];

                if (match) {
                   // Fetch providers and details
                   const details = await getMediaDetails(match, apiKey);
                   
                   // Merge Real Data with Gemini's "Why" explanation
                   bestPick = {
                       ...match,
                       plot: bestPick.plot, // Keep the Gemini explanation!
                       providers: details.providers, // Add providers
                   };
                }
            } catch (e) {
                console.error("TMDB hydration failed, using Gemini raw data", e);
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

  const handleClose = () => {
    setRecommendation(null);
  };

  const handleAdd = () => {
    if (recommendation) {
        onAdd(recommendation, WatchStatus.TO_WATCH);
        setRecommendation(null);
    }
  };

  return (
    <>
        {/* Trigger Button in Sidebar */}
        <div className="mt-auto px-4 pb-4 pt-2 border-t border-slate-800 hidden md:block">
        <div className="bg-gradient-to-br from-purple-900/40 to-slate-800 rounded-xl p-1 border border-purple-500/20 backdrop-blur-sm shadow-lg relative overflow-hidden group">
            
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-purple-600/20 transition-colors"></div>

            <button 
                onClick={getAiTip}
                disabled={loading}
                className="w-full flex items-center gap-3 text-left relative z-10 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
                <div className={`p-2.5 rounded-lg shadow-inner transition-all duration-500 ${loading ? 'bg-slate-800' : 'bg-purple-600 shadow-purple-900/30'}`}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> : <Sparkles className="w-5 h-5 text-white" />}
                </div>
                <div>
                <p className="text-sm font-bold text-slate-100 group-hover:text-purple-200 transition-colors">
                    {loading ? t('analyzing') : t('ai_tip')}
                </p>
                <p className="text-[10px] text-purple-300/80 uppercase tracking-wide font-medium">
                    {loading ? "Gemini 2.5 Flash" : t('new_rec')}
                </p>
                </div>
            </button>
        </div>
        </div>

        {/* Mobile FAB Trigger (Floating Action Button for AI) */}
        <button 
            onClick={getAiTip}
            disabled={loading}
            className="md:hidden fixed bottom-20 left-4 z-40 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-900/40 border-2 border-slate-900 active:scale-95 transition-transform"
        >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
        </button>

        {/* Large Result Modal */}
        {recommendation && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-slate-900 border border-purple-500/30 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 max-h-[90vh] flex flex-col">
                    
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                    {/* Close Button */}
                    <button 
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-slate-400 hover:text-white rounded-full transition-colors z-20"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-6 md:p-8 relative z-10 text-center overflow-y-auto custom-scrollbar">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-purple-900/40 rotate-3 overflow-hidden relative border-2 border-purple-400/50 flex-shrink-0">
                             {recommendation.posterPath ? (
                                <img 
                                    src={`${IMAGE_BASE_URL}${recommendation.posterPath}`} 
                                    className="w-full h-full object-cover" 
                                    alt={recommendation.title}
                                />
                             ) : (
                                <Sparkles size={32} className="text-white" />
                             )}
                        </div>

                        <h2 className="text-xs md:text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">Gemini Empfehlung</h2>
                        
                        <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight">
                            {recommendation.title}
                        </h3>
                        <p className="text-slate-400 text-base md:text-lg mb-4 md:mb-6">({recommendation.year})</p>

                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {recommendation.genre.map(g => (
                                <span key={g} className="px-2 py-1 md:px-3 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-200 text-xs md:text-sm font-medium">
                                    {g}
                                </span>
                            ))}
                        </div>

                        {/* Streaming Providers */}
                        {recommendation.providers && recommendation.providers.length > 0 && (
                             <div className="flex justify-center gap-3 mb-6">
                                {recommendation.providers.map(p => (
                                    <img 
                                        key={p.providerId} 
                                        src={`${LOGO_BASE_URL}${p.logoPath}`} 
                                        className="w-6 h-6 md:w-8 md:h-8 rounded-md shadow-md"
                                        title={p.providerName}
                                        alt={p.providerName}
                                    />
                                ))}
                             </div>
                        )}

                        <div className="bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-700/50 mb-6 md:mb-8 text-left relative">
                            <Quote className="absolute top-4 left-4 text-purple-500/20 transform -scale-x-100" size={32} />
                            <p className="text-slate-200 italic leading-relaxed relative z-10 pl-4 text-sm md:text-base">
                                "{recommendation.plot}"
                            </p>
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <button 
                                onClick={handleClose}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-sm md:text-base"
                            >
                                {t('close_trailer')}
                            </button>
                            <button 
                                onClick={handleAdd}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm md:text-base"
                            >
                                <Plus size={18} /> {t('to_list')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
