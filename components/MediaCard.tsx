import React, { useState, useRef, useEffect, memo } from 'react';
import { MediaItem, WatchStatus, MediaType, CustomList } from '../types';
import { Trash2, Check, Clock, PlayCircle, Film, Tv, MoreHorizontal, Heart, Star, Users, Zap, RefreshCw } from 'lucide-react';
import { IMAGE_BASE_URL, LOGO_BASE_URL } from '../services/tmdb';
import { BottomSheet } from './BottomSheet';

interface MediaCardProps {
  item: MediaItem;
  onStatusChange: (id: string, status: WatchStatus) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  onClick: (item: MediaItem) => void;
  onRefreshMetadata?: (item: MediaItem) => void;
  customLists?: CustomList[];
  onAddToList?: (listId: string, itemId: string) => void;
}

export const MediaCard = memo<MediaCardProps>(({ 
    item, onStatusChange, onDelete, onToggleFavorite, onRate, onClick, onRefreshMetadata, customLists = [], onAddToList 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Self-healing for missing RT score
  useEffect(() => {
    if (!item.rtScore && item.imdbId && onRefreshMetadata) {
      onRefreshMetadata(item);
    }
  }, [item.rtScore, item.imdbId, onRefreshMetadata]);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (!isMobile) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  // Enhanced Spotlight Effect Logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    // Set custom properties for CSS
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  };

  const posterUrl = item.posterPath ? `${IMAGE_BASE_URL}${item.posterPath}` : null;
  
  const formatRuntime = (mins?: number) => {
      if (!mins) return null;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
  };

  const getRtState = (scoreStr?: string) => {
      if (!scoreStr) return null;
      // Robust parsing: remove non-digits (like '%')
      const cleanScore = scoreStr.toString().replace(/[^0-9]/g, '');
      const score = parseInt(cleanScore);
      if (isNaN(score)) return null;
      return score >= 60 ? 'fresh' : 'rotten';
  };

  const rtState = getRtState(item.rtScore);

  // Define actions for BottomSheet
  const mobileActions = [
    { label: 'Favorit', icon: <Heart size={20} className={item.isFavorite ? "fill-red-500 text-red-500" : ""} />, onClick: () => onToggleFavorite(item.id), active: item.isFavorite },
    { label: 'Planen', icon: <Clock size={20} />, onClick: () => onStatusChange(item.id, WatchStatus.TO_WATCH), active: item.status === WatchStatus.TO_WATCH },
    { label: 'Schaue gerade', icon: <PlayCircle size={20} />, onClick: () => onStatusChange(item.id, WatchStatus.WATCHING), active: item.status === WatchStatus.WATCHING },
    { label: 'Gesehen', icon: <Check size={20} />, onClick: () => onStatusChange(item.id, WatchStatus.WATCHED), active: item.status === WatchStatus.WATCHED },
  ];

  const adminActions = [
    ...(onRefreshMetadata ? [{ label: 'Daten aktualisieren', icon: <RefreshCw size={20} />, onClick: () => onRefreshMetadata(item), variant: 'accent' as const }] : []),
    { label: 'Entfernen', icon: <Trash2 size={20} />, onClick: () => onDelete(item.id), variant: 'danger' as const },
  ];

  const listActions = customLists.map(l => ({
    label: l.name,
    icon: <Film size={18} className="text-slate-500" />,
    onClick: () => onAddToList && onAddToList(l.id, item.id),
    active: l.items.includes(item.id)
  }));

  return (
    <div className="group relative flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
        <div 
            onClick={() => onClick(item)}
            onMouseMove={handleMouseMove}
            className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-input border border-border-main shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-accent/60"
        >
            {/* SENTIENT GLASS: Interactive Border & Spotlight - BOOSTED (v1.9.32) */}
            <div 
                className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: `
                        radial-gradient(450px circle at var(--x) var(--y), rgba(34, 211, 238, 0.25), transparent 45%),
                        radial-gradient(120px circle at var(--x) var(--y), rgba(34, 211, 238, 0.6), transparent 85%)
                    `
                }}
            ></div>

            {/* Content Layers */}
            {posterUrl ? (
                <img 
                    src={posterUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-0"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted bg-card">
                    <Film size={40} />
                </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none opacity-90 z-10" />

            {/* Badges */}
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-border-light flex items-center gap-1.5 shadow-sm z-30">
                {item.type === MediaType.MOVIE ? <Film size={12} className="text-blue-400"/> : <Tv size={12} className="text-purple-400"/>}
            </div>

            {item.status !== WatchStatus.TO_WATCH && (
                <div className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md border border-border-light shadow-lg z-30 ${item.status === WatchStatus.WATCHED ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {item.status === WatchStatus.WATCHED ? <Check size={14} /> : <PlayCircle size={14} />}
                </div>
            )}
            
            {item.userRating && item.userRating > 0 && (
                 <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-yellow-500 text-black px-2 py-0.5 rounded font-bold text-xs shadow-lg shadow-yellow-900/50 z-30">
                    <Star size={10} fill="currentColor" /> {item.userRating}
                </div>
            )}
        </div>

        {/* Menu Button Overlay */}
        <div className="absolute top-2 right-2 z-30" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-text-main border border-border-light transition-colors shadow-sm"
            >
                <MoreHorizontal size={16} />
            </button>

            {/* Desktop Dropdown */}
            {!isMobile && isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-muted hover:text-text-main hover:bg-white/5 rounded-lg transition-colors">
                        <Heart size={16} className={item.isFavorite ? "fill-red-500 text-red-500" : ""} /> Favorit
                    </button>
                    <div className="h-px bg-border-main my-1"></div>
                    <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.TO_WATCH); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-muted hover:text-text-main hover:bg-white/5 rounded-lg transition-colors">
                        <Clock size={16} /> Planen
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.WATCHING); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-muted hover:text-text-main hover:bg-white/5 rounded-lg transition-colors">
                        <PlayCircle size={16} /> Schaue gerade
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, WatchStatus.WATCHED); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-muted hover:text-text-main hover:bg-white/5 rounded-lg transition-colors">
                        <Check size={16} /> Gesehen
                    </button>
                    
                    {customLists.length > 0 && (
                        <>
                            <div className="h-px bg-border-main my-1"></div>
                            <div className="px-3 py-1 text-[10px] text-text-muted font-bold uppercase">Listen</div>
                            {customLists.map(l => (
                                <button 
                                    key={l.id}
                                    onClick={(e) => { e.stopPropagation(); onAddToList && onAddToList(l.id, item.id); setIsMenuOpen(false); }} 
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-text-muted hover:text-text-main hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <span className="truncate">{l.name}</span>
                                    {l.items.includes(item.id) && <Check size={14} className="text-accent"/>}
                                </button>
                            ))}
                        </>
                    )}

                    {onRefreshMetadata && (
                        <>
                            <div className="h-px bg-border-main my-1"></div>
                            <button onClick={(e) => { e.stopPropagation(); onRefreshMetadata(item); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors">
                                <RefreshCw size={16} /> Daten aktualisieren
                            </button>
                        </>
                    )}
                    
                    <div className="h-px bg-border-main my-1"></div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} /> Entfernen
                    </button>
                </div>
            )}
        </div>

        {/* Mobile BottomSheet */}
        {isMobile && (
            <BottomSheet 
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                title={item.title}
                actions={mobileActions}
                sections={[
                    ...(listActions.length > 0 ? [{ title: 'Zu Listen hinzufügen', actions: listActions }] : []),
                    { title: 'Verwaltung', actions: adminActions }
                ]}
            />
        )}

        {/* Text Details Area */}
        <div className="px-1 pt-1 flex flex-col justify-between min-h-[10rem] flex-grow">
            <div>
                <h3 onClick={() => onClick(item)} className="font-bold text-text-main text-lg leading-tight line-clamp-2 hover:text-accent transition-colors cursor-pointer mb-1.5" title={item.title}>
                    {item.title}
                </h3>
                
                <div className="flex items-center flex-wrap gap-2 text-[11px] text-text-muted font-bold uppercase tracking-wider mb-3">
                    <span className="text-text-main">{item.year}</span>
                    {item.runtime && (
                        <>
                            <span className="text-border-light font-black">•</span>
                            <span>{formatRuntime(item.runtime)}</span>
                        </>
                    )}
                    {item.certification && (
                        <>
                            <span className="text-border-light font-black">•</span>
                            <span className="bg-input text-text-muted px-1.5 py-0.5 rounded text-[9px] border border-border-main">{item.certification}</span>
                        </>
                    )}
                    <span className="text-border-light font-black">•</span>
                    <span className="truncate max-w-[80px] text-text-muted">{item.genre[0]}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#0d253f] px-2 py-0.5 rounded border border-[#01b4e4]/30">
                        <span className="font-black text-[8px] text-[#01b4e4] tracking-tighter uppercase">TMDB</span>
                        <span className="text-[10px] font-black text-white">{item.rating.toFixed(1)}</span>
                    </div>

                    {rtState && (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${rtState === 'fresh' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                            <Zap size={10} className={rtState === 'fresh' ? 'text-red-500 fill-red-500' : 'text-green-500 fill-green-500'} />
                            <span className={`text-[10px] font-black ${rtState === 'fresh' ? 'text-red-200' : 'text-green-200'}`}>{item.rtScore}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2 mt-auto pt-3">
                {item.providers && item.providers.length > 0 && (
                    <div className="flex items-center gap-1.5 h-5">
                        {item.providers.slice(0, 4).map(p => (
                            <img 
                                key={p.providerId}
                                src={`${LOGO_BASE_URL}${p.logoPath}`}
                                alt={p.providerName}
                                className="w-5 h-5 rounded-md shadow-lg border border-border-light object-cover bg-card"
                            />
                        ))}
                    </div>
                )}

                {item.credits && item.credits.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] bg-card/5 py-1.5 px-2 rounded-xl border border-border-main group-hover:border-border-light transition-colors">
                        <Users size={12} className="text-text-muted flex-shrink-0"/>
                        <span className="truncate text-text-muted font-bold" title={item.credits.map(c => c.name).join(', ')}>
                            {item.credits[0].name}
                            {item.credits.length > 1 && `, ${item.credits[1].name}`}
                        </span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
});
