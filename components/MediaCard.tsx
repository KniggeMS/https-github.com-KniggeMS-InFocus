
import React, { useState, useRef, useEffect } from 'react';
import { MediaItem, WatchStatus, MediaType, CustomList } from '../types';
import { Trash2, Check, Clock, PlayCircle, Film, Tv, Layers, ListVideo, Heart, Bookmark, Star, ListPlus, FolderPlus, ChevronRight } from 'lucide-react';
import { IMAGE_BASE_URL, LOGO_BASE_URL } from '../services/tmdb';
import { useTranslation } from '../contexts/LanguageContext';

interface MediaCardProps {
  item: MediaItem;
  onStatusChange: (id: string, status: WatchStatus) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  onClick: (item: MediaItem) => void;
  customLists?: CustomList[];
  onAddToList?: (listId: string, itemId: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onStatusChange, onDelete, onToggleFavorite, onRate, onClick, customLists = [], onAddToList }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHoveringRating, setIsHoveringRating] = useState(false);
  const [isHoveringLists, setIsHoveringLists] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsHoveringRating(false);
        setIsHoveringLists(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const statusColors = {
    [WatchStatus.TO_WATCH]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    [WatchStatus.WATCHING]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    [WatchStatus.WATCHED]: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const statusLabels = {
    [WatchStatus.TO_WATCH]: t('planned'),
    [WatchStatus.WATCHING]: t('watching'),
    [WatchStatus.WATCHED]: t('seen'),
  };

  const posterUrl = item.posterPath ? `${IMAGE_BASE_URL}${item.posterPath}` : null;

  // Determine Badge Type (RT vs IMDb)
  const isRT = item.rtScore && item.rtScore.includes('%');
  const badgeLabel = isRT ? 'RT' : 'IMDb';
  const badgeColor = isRT ? 'bg-[#FA320A]/90 text-white' : 'bg-[#F5C518]/90 text-black';

  return (
    <div 
        onClick={() => onClick(item)}
        className="group relative flex flex-col bg-slate-800 rounded-xl border border-slate-700 shadow-lg hover:border-slate-500 transition-all duration-300 hover:shadow-cyan-500/10 cursor-pointer h-full"
    >
      {/* Image Container - Responsive Height */}
      <div 
        className="aspect-[2/3] w-full relative overflow-hidden bg-slate-900 rounded-t-xl"
      >
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: item.posterColor || '#334155' }}
          >
            <Film className="text-white/20" size={64} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent sm:via-slate-900/60"></div>

        {/* Content Overlay on Image for Mobile */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
           <h3 className="text-sm sm:text-xl font-bold text-white leading-tight drop-shadow-md line-clamp-2" title={item.title}>
            {item.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-slate-200 text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium">
             {item.type === MediaType.MOVIE ? <Film size={12} className="text-cyan-400" /> : <Tv size={12} className="text-purple-400" />}
             <span>{item.year}</span>
             <span className="hidden sm:inline">•</span>
             <span className="truncate max-w-[150px] hidden sm:block">{item.genre.slice(0, 2).join(', ')}</span>
          </div>
        </div>
      </div>

      {/* OVERLAY ELEMENTS (Menu & Badges) */}
      <div className="absolute top-2 right-2 z-30" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-colors shadow-sm ${isMenuOpen ? 'bg-cyan-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white'}`}
            >
                <ListPlus size={16} className="sm:w-5 sm:h-5" />
            </button>
            {/* Menu Dropdown Code */}
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-40">
                    <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-700 rounded-t-lg">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                             <ListVideo size={14} className="text-cyan-400"/> {t('to_list')}
                        </span>
                    </div>
                    
                    <div className="py-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors group/item"
                        >
                            <Heart 
                                size={18} 
                                className={`transition-colors ${item.isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-200'}`} 
                            />
                            <span className={`text-sm font-medium ${item.isFavorite ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t('favorite')}</span>
                        </button>

                        <button 
                            onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.TO_WATCH); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors group/item"
                        >
                            <Bookmark 
                                size={18} 
                                className={`transition-colors ${item.status === WatchStatus.TO_WATCH ? 'fill-cyan-500 text-cyan-500' : 'text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-200'}`}
                            />
                            <span className={`text-sm font-medium ${item.status === WatchStatus.TO_WATCH ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t('watchlist')}</span>
                        </button>

                         {/* Custom Lists Submenu */}
                         {customLists.length > 0 && onAddToList && (
                             <div 
                                className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors group/item relative cursor-pointer"
                                onMouseEnter={() => setIsHoveringLists(true)}
                                onMouseLeave={() => setIsHoveringLists(false)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsHoveringLists(!isHoveringLists);
                                }}
                             >
                                <FolderPlus 
                                    size={18} 
                                    className="text-slate-400 group-hover/item:text-slate-200"
                                />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex-grow">{t('add_to_custom')}</span>
                                <ChevronRight size={14} className="text-slate-500" />
                                
                                {isHoveringLists && (
                                    <div className="absolute right-full top-0 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200 z-50 -mr-1">
                                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                            {customLists.map(list => {
                                                const isInList = list.items.includes(item.id);
                                                return (
                                                    <button
                                                        key={list.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAddToList(list.id, item.id);
                                                            setIsMenuOpen(false);
                                                        }}
                                                        className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white truncate flex items-center justify-between"
                                                    >
                                                        <span className="truncate">{list.name}</span>
                                                        {isInList && <Check size={12} className="text-cyan-400 flex-shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                             </div>
                         )}

                         <div 
                            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex flex-col justify-center gap-1 transition-colors group/item relative"
                            onMouseEnter={() => setIsHoveringRating(true)}
                            onMouseLeave={() => setIsHoveringRating(false)}
                            onClick={(e) => e.stopPropagation()}
                         >
                            <div className="flex items-center gap-3">
                                <Star 
                                    size={18} 
                                    className={`transition-colors ${item.userRating && item.userRating > 0 ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-200'}`}
                                />
                                <span className={`text-sm font-medium ${item.userRating && item.userRating > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {isHoveringRating ? `${t('rate')}:` : t('your_rating')}
                                </span>
                            </div>

                            {isHoveringRating && (
                                <div className="flex gap-1 pl-8 animate-in fade-in slide-in-from-left-2 duration-200 pt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRate(item.id, star);
                                            }}
                                            className="text-slate-400 hover:text-yellow-400 hover:scale-110 transition-transform"
                                        >
                                            <Star 
                                                size={16} 
                                                className={(item.userRating || 0) >= star ? 'fill-yellow-500 text-yellow-500' : ''}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            )}
      </div>
      
      {/* Badges Container */}
      <div className="absolute top-2 left-2 z-30 flex flex-col gap-1">
          {(item.userRating || 0) > 0 && (
                <div className="bg-yellow-500/90 text-slate-900 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold shadow-sm flex items-center gap-1 w-fit">
                <Star size={10} className="fill-slate-900 sm:w-3 sm:h-3" />
                {item.userRating}
                </div>
          )}
          {item.rtScore && item.rtScore !== "N/A" && (
              <div className={`${badgeColor} px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold shadow-sm flex items-center gap-1 w-fit`}>
                 <span className="text-[8px] sm:text-[10px] font-black">{badgeLabel}</span> {item.rtScore}
              </div>
          )}
      </div>

      {/* Content Body */}
      <div className="p-3 sm:p-4 flex-grow flex flex-col rounded-b-xl justify-between">
        
        {/* Hidden on mobile, visible on desktop */}
        <div className="hidden sm:block">
            <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-400">
               {item.type === MediaType.SERIES && ((item.seasons || 0) > 0 || (item.episodes || 0) > 0) && (
                  <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                     <Layers size={12} className="text-purple-400" />
                     <span>{item.seasons} {t('seasons')}</span>
                  </div>
               )}
            </div>

            <p className="text-slate-400 text-sm line-clamp-3 mb-4">
              {item.plot}
            </p>
        </div>

        {/* Compact Footer for Mobile */}
        <div className="flex items-center justify-between border-t border-slate-700 pt-2 sm:pt-3 mt-auto">
           <div className="flex gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.TO_WATCH); }}
                className={`p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 transition-colors ${item.status === WatchStatus.TO_WATCH ? 'text-yellow-400' : 'text-slate-500'}`}
                title={t('planned')}
              >
                <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.WATCHING); }}
                className={`p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 transition-colors ${item.status === WatchStatus.WATCHING ? 'text-blue-400' : 'text-slate-500'}`}
                title={t('watching')}
              >
                <PlayCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.WATCHED); }}
                className={`p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 transition-colors ${item.status === WatchStatus.WATCHED ? 'text-green-400' : 'text-slate-500'}`}
                title={t('seen')}
              >
                <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
           </div>
           
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
             className="p-1.5 sm:p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
             title={t('remove')}
           >
             <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
           </button>
        </div>
      </div>
    </div>
  );
};
