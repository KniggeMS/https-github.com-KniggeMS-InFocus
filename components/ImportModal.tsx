
import React, { useState } from 'react';
import { X, FileText, ArrowRight, Check, AlertCircle, Loader2, Download, Database } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { searchTMDB, findByExternalId } from '../services/tmdb';
import { searchOMDB } from '../services/omdb';
import { SearchResult, MediaType } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (results: SearchResult[]) => void;
  apiKey: string;
  omdbApiKey?: string;
}

interface ImportMatch {
  originalLine: string;
  result: SearchResult | null;
  selected: boolean;
  source: 'TMDB' | 'OMDb' | 'None';
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, apiKey, omdbApiKey }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [matches, setMatches] = useState<ImportMatch[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [omdbLimitReached, setOmdbLimitReached] = useState(false);

  if (!isOpen) return null;

  const parseLine = (line: string) => {
      // Split by semicolon, remove quotes and whitespace
      // Example: "Blackout";Film;;"Proximity Film"
      const parts = line.split(';').map(p => p.trim().replace(/^"|"$/g, ''));
      return {
          title: parts[0] || '',
          type: parts[1] || '',
          platform: parts[2] || '',
          notes: parts[3] || ''
      };
  };

  const detectType = (typeStr: string): MediaType | undefined => {
      const lower = typeStr.toLowerCase();
      if (lower.includes('film') || lower.includes('movie')) return MediaType.MOVIE;
      if (lower.includes('serie') || lower.includes('anime')) return MediaType.SERIES;
      return undefined;
  };

  const handleAnalyze = async () => {
    if (!text.trim() || !apiKey) return;
    
    setIsAnalyzing(true);
    setOmdbLimitReached(false); // Reset limit flag
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    setMatches([]);
    setProgress({ current: 0, total: lines.length });
    
    const newMatches: ImportMatch[] = [];

    // Process sequentially
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = parseLine(line);
      
      if (!parsed.title) {
          setProgress(p => ({ ...p, current: i + 1 }));
          continue;
      }

      // 1. Prepare Notes & Year
      let combinedNotes = parsed.notes;
      if (parsed.platform) {
          combinedNotes = parsed.platform + (combinedNotes ? ` - ${combinedNotes}` : '');
      }

      // Extract Year from notes (e.g. "2016", "2011")
      const yearMatch = parsed.notes.match(/\b(19|20)\d{2}\b/);
      const extractedYear = yearMatch ? yearMatch[0] : undefined;

      // 2. Determine Filter Type
      const filterType = detectType(parsed.type);

      let foundResult: SearchResult | null = null;
      let source: 'TMDB' | 'OMDb' | 'None' = 'None';

      try {
        // STRATEGY A: TMDB Search (with Year if available)
        let tmdbResults = await searchTMDB(parsed.title, apiKey, extractedYear);
        
        // Filter by Type if specified
        if (filterType) {
            tmdbResults = tmdbResults.filter(r => r.type === filterType);
        }

        if (tmdbResults.length > 0) {
            foundResult = tmdbResults[0];
            source = 'TMDB';
        } 
        // STRATEGY B: TMDB Search (Without Year - Fallback)
        else if (extractedYear) {
             let retryResults = await searchTMDB(parsed.title, apiKey);
             if (filterType) retryResults = retryResults.filter(r => r.type === filterType);
             if (retryResults.length > 0) {
                 foundResult = retryResults[0];
                 source = 'TMDB';
             }
        }

        // STRATEGY C: OMDb Fallback (if enabled, no result yet, and limit not reached)
        if (!foundResult && omdbApiKey && !omdbLimitReached) {
            try {
                const omdbResult = await searchOMDB(parsed.title, extractedYear || null, filterType, omdbApiKey);
                
                if (omdbResult && omdbResult.imdbID) {
                    // Convert IMDb ID to TMDB Object
                    const tmdbFromImdb = await findByExternalId(omdbResult.imdbID, apiKey);
                    if (tmdbFromImdb) {
                        foundResult = tmdbFromImdb;
                        source = 'OMDb';
                    }
                }
            } catch (err: any) {
                if (err.message === "LIMIT_REACHED") {
                    setOmdbLimitReached(true);
                    console.warn("OMDb Request Limit Reached. Disabling fallback for remaining items.");
                }
            }
        }

        // Add Notes to result if found
        if (foundResult) {
            foundResult.customNotes = combinedNotes;
        }

        newMatches.push({
          originalLine: line.trim(),
          result: foundResult,
          selected: !!foundResult,
          source
        });
        
        // Rate limit kindness
        await new Promise(r => setTimeout(r, 100));

      } catch (e) {
        newMatches.push({ originalLine: line.trim(), result: null, selected: false, source: 'None' });
      }
      
      setProgress(p => ({ ...p, current: i + 1 }));
    }

    setMatches(newMatches);
    setStep('preview');
    setIsAnalyzing(false);
  };

  const handleFinalImport = () => {
    const toImport = matches.filter(m => m.selected && m.result).map(m => m.result!);
    onImport(toImport);
    onClose();
    // Reset
    setText('');
    setMatches([]);
    setStep('input');
  };

  const toggleSelection = (index: number) => {
    const newMatches = [...matches];
    newMatches[index].selected = !newMatches[index].selected;
    setMatches(newMatches);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-xl">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FileText size={18} className="text-cyan-400"/> {t('smart_import')}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-grow p-6 overflow-hidden flex flex-col">
          {step === 'input' ? (
            <div className="flex flex-col h-full">
               <p className="text-slate-400 text-sm mb-3">{t('import_desc')}</p>
               <textarea 
                  className="flex-grow w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none resize-none custom-scrollbar whitespace-pre"
                  placeholder={t('import_placeholder')}
                  value={text}
                  onChange={e => setText(e.target.value)}
               />
               <div className="mt-3 flex gap-4 text-xs">
                   {!apiKey ? (
                       <div className="text-red-400 flex items-center gap-1"><AlertCircle size={14}/> {t('api_key_missing')} (TMDB)</div>
                   ) : <div className="text-green-400 flex items-center gap-1"><Check size={14}/> TMDB Ready</div>}
                   
                   {!omdbApiKey ? (
                       <div className="text-slate-500 flex items-center gap-1"><Database size={14}/> OMDb Fallback inaktiv (Key fehlt)</div>
                   ) : (
                       <div className={`${omdbLimitReached ? 'text-red-400' : 'text-green-400'} flex items-center gap-1`}>
                           {omdbLimitReached ? <AlertCircle size={14} /> : <Check size={14} />} 
                           {omdbLimitReached ? 'OMDb Limit erreicht!' : 'OMDb Fallback aktiv'}
                       </div>
                   )}
               </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-medium">{t('import_preview')}</h4>
                  <span className="text-xs text-slate-500">
                    {matches.filter(m => m.selected).length} ausgewählt
                  </span>
               </div>
               
               <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 pr-2">
                  {matches.map((match, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${match.selected ? 'bg-slate-700/50 border-cyan-500/30' : 'bg-slate-900/30 border-transparent opacity-60'}`}
                    >
                        <button 
                          onClick={() => match.result && toggleSelection(idx)}
                          disabled={!match.result}
                          className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${match.selected ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-600 hover:border-slate-400'}`}
                        >
                           {match.selected && <Check size={12} />}
                        </button>
                        
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                           <div className="text-xs font-mono text-slate-400 truncate" title={match.originalLine}>
                             {match.originalLine}
                           </div>
                           
                           <div className="flex items-center gap-2 min-w-0">
                              <ArrowRight size={14} className="text-slate-600 flex-shrink-0" />
                              {match.result ? (
                                <div className="flex items-center gap-2 min-w-0 flex-grow">
                                   <div className="text-sm font-medium text-white truncate" title={match.result.title}>
                                     {match.result.title}
                                   </div>
                                   <span className="text-xs text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded flex-shrink-0">
                                     {match.result.year}
                                   </span>
                                   <span className={`text-[10px] px-1.5 py-0.5 rounded border ${match.source === 'OMDb' ? 'border-yellow-900 bg-yellow-900/20 text-yellow-500' : 'border-cyan-900 bg-cyan-900/20 text-cyan-500'}`}>
                                       {match.source}
                                   </span>
                                </div>
                              ) : (
                                <span className="text-sm text-red-400 italic">{t('no_match')}</span>
                              )}
                           </div>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/50 flex justify-end gap-2 border-t border-slate-700 rounded-b-xl items-center">
            {step === 'input' ? (
              <div className="flex w-full justify-between items-center">
                  {isAnalyzing && (
                      <div className="text-xs text-cyan-400 flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" /> 
                          Verarbeite Eintrag {progress.current} von {progress.total}...
                      </div>
                  )}
                  <div className="ml-auto">
                    <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !text.trim() || !apiKey}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isAnalyzing ? t('analyzing') : t('analyze')}
                    </button>
                  </div>
              </div>
            ) : (
              <>
                 <button 
                   onClick={() => setStep('input')}
                   className="px-3 py-2 text-slate-400 hover:text-white text-sm"
                 >
                   Zurück
                 </button>
                 <button 
                  onClick={handleFinalImport}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  {t('import_confirm')}
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  );
};
