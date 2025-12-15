import React, { useState, useRef, useEffect } from 'react';
import { MediaItem, WatchStatus, MediaType, CustomList } from '../types';
import { Trash2, Check, Clock, PlayCircle, Film, Tv, MoreHorizontal, Heart, Star, ListPlus, FolderPlus } from 'lucide-react';
import { IMAGE_BASE_URL } from '../services/tmdb';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const posterUrl = item.posterPath ? `${IMAGE_BASE_URL}${item.posterPath}` : null;
  
  return (
    <div className="group relative flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
        {/* Card Image Container */}
        <div 
            onClick={() => onClick(item)}
            className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#1c212c] border border-white/5 shadow-lg cursor-pointer hover:shadow-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02]"
        >
            {posterUrl ? (
                <img 
                    src={posterUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 bg-[#151a23]">
                    <Film size={40} />
                </div>
            )}

            {/* Gradient Overlay for Text Visibility (Bottom) */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none opacity-60" />

            {/* Top Right: Context Menu Button (Stitch Style) */}
            <div className="absolute top-2 right-2 z-20" ref={menuRef}>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/10 transition-colors"
                >
                    <MoreHorizontal size={16} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass-panel rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Heart size={14} className={item.isFavorite ? "fill-red-500 text-red-500" : ""} /> Favorit
                        </button>
                        <div className="h-px bg-white/5 my-1"></div>
                        <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.TO_WATCH); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Clock size={14} /> Planen
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.WATCHING); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <PlayCircle size={14} /> Schaue gerade
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.WATCHED); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Check size={14} /> Gesehen
                        </button>
                        
                        {customLists.length > 0 && (
                            <>
                                <div className="h-px bg-white/5 my-1"></div>
                                <div className="px-3 py-1 text-[10px] text-slate-500 font-bold uppercase">Listen</div>
                                {customLists.map(l => (
                                    <button 
                                        key={l.id}
                                        onClick={(e) => { e.stopPropagation(); onAddToList && onAddToList(l.id, item.id); setIsMenuOpen(false); }} 
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <span className="truncate">{l.name}</span>
                                        {l.items.includes(item.id) && <Check size={12} className="text-blue-400"/>}
                                    </button>
                                ))}
                            </>
                        )}
                        
                        <div className="h-px bg-white/5 my-1"></div>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={14} /> Entfernen
                        </button>
                    </div>
                )}
            </div>

            {/* Type Badge (Top Left) */}
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                {item.type === MediaType.MOVIE ? <Film size={10} className="text-blue-400"/> : <Tv size={10} className="text-purple-400"/>}
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {item.type === MediaType.MOVIE ? 'Film' : 'TV'}
                </span>
            </div>

            {/* Status Indicator (Bottom Right) */}
            {item.status !== WatchStatus.TO_WATCH && (
                <div className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg ${item.status === WatchStatus.WATCHED ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {item.status === WatchStatus.WATCHED ? <Check size={12} /> : <PlayCircle size={12} />}
                </div>
            )}
            
            {/* Rating Badge (Bottom Left - On Image) */}
            {item.rating > 0 && (
                 <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
                    <Star size={10} className="fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-white text-[10px]">{item.rating.toFixed(1)}</span>
                </div>
            )}
        </div>

        {/* Info Section (Clean Text Below) */}
        <div>
            <h3 onClick={() => onClick(item)} className="font-bold text-white text-sm leading-tight line-clamp-1 hover:text-blue-400 transition-colors cursor-pointer mb-1" title={item.title}>
                {item.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>{item.year}</span>
                <span>•</span>
                <span className="truncate max-w-[120px]">{item.genre[0] || 'Unknown'}</span>
                {item.userRating && item.userRating > 0 && (
                     <>
                        <span>•</span>
                        <span className="text-yellow-500 font-bold">★ {item.userRating}</span>
                     </>
                )}
            </div>
        </div>
    </div>
  );
};