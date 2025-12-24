import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTranslation } from './contexts/LanguageContext';
import { AuthPage } from './components/AuthPage';
import { MobileNav } from './components/MobileNav';
import { MediaCard } from './components/MediaCard';
import { SearchModal } from './components/SearchModal';
import { DetailView } from './components/DetailView';
import { Stats } from './components/Stats';
import { ProfilePage } from './components/ProfilePage';
import { UserManagementPage } from './components/UserManagementPage';
import { GuidePage } from './components/GuidePage';
import { DesignLabModal } from './components/DesignLabModal';
import { SettingsModal } from './components/SettingsModal';
import { ImportModal } from './components/ImportModal';
import { ShareModal } from './components/ShareModal';
import { CreateListModal } from './components/CreateListModal';
import { RenameListModal } from './components/RenameListModal';
import { BottomSheet } from './components/BottomSheet';
import { usePwaInstall } from './hooks/usePwaInstall';
import { ChatBot } from './components/ChatBot';
import { AiRecommendationButton } from './components/AiRecommendationButton';
import {
  fetchMediaItems, addMediaItem, updateMediaItemStatus, deleteMediaItem,
  toggleMediaItemFavorite, updateMediaItemRating, updateMediaItemNotes,
  fetchCustomLists, updateCustomListItems, updateCustomList, deleteCustomList, createCustomList,
  fetchAdminNotifications, markAdminNotificationsAsRead, updateMediaItemDetails
} from './services/db';
import { hydrateMissingData } from './services/hydration';
import { getMediaDetails, getEffectiveApiKey as getTmdbKey } from './services/tmdb';
import { getOmdbRatings, getEffectiveOmdbKey } from './services/omdb';
import { MediaItem, WatchStatus, SearchResult, CustomList, UserRole, MediaType } from './types';
// KORREKTUR: Import von lucide-react statt lucide-center
import { Search, User as UserIcon, List, Clapperboard, Plus, Share2, LogOut, BookOpen, Languages, Download, Palette, Settings, Database, Pencil, Trash2, MoreVertical } from 'lucide-react';

const ListRoute = ({ customLists, renderGrid, onShare }: { customLists: CustomList[], renderGrid: (s?: WatchStatus, l?: string) => React.ReactNode, onShare: (list: CustomList) => void }) => {
    const { id } = useParams();
    const { user } = useAuth();
    const list = customLists.find(l => l.id === id);
    if (!list) return <div className="p-8 text-center text-slate-500">Liste nicht gefunden</div>;
    const isOwner = user?.id === list.ownerId;
    return (
        <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-3xl font-black text-white flex items-center gap-3">
                            <List size={28} className="text-purple-400" /> {list.name}
                        </h2>
                        {isOwner && (
                            <button onClick={() => onShare(list)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-xl border border-white/10 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                <Share2 size={14} /> Teilen
                            </button>
                        )}
                    </div>
                    {list.description && <p className="text-slate-400 text-sm font-medium mt-1">{list.description}</p>}
                </div>
            </div>
            {renderGrid(undefined, id)}
        </div>
    );
};



export default function App() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { isInstallable, installApp } = usePwaInstall();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [items, setItems] = useState<MediaItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesignLabOpen, setIsDesignLabOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | SearchResult | null>(null);
  const [isSelectedItemExisting, setIsSelectedItemExisting] = useState(false);

  const handleSelectItem = (item: MediaItem | SearchResult, isExisting: boolean) => {
      setSelectedItem(item);
      setIsSelectedItemExisting(isExisting);
      if (!isExisting) setIsSearchOpen(false); // Close search when opening detail for new item
  };
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'MOVIE' | 'SERIES'>('ALL');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isRenameListOpen, setIsRenameListOpen] = useState(false);
  const [isListsSheetOpen, setIsListsSheetOpen] = useState(false);
  const [listToShare, setListToShare] = useState<CustomList | null>(null);
  const [listToRename, setListToRename] = useState<CustomList | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const handleRenameList = (list: CustomList) => {
      setListToRename(list);
      setIsRenameListOpen(true);
  };

  const executeRenameList = async (newName: string) => {
    if (listToRename && newName && newName !== listToRename.name) {
        await updateCustomList(listToRename.id, newName);
        setCustomLists(prev => prev.map(l => l.id === listToRename.id ? { ...l, name: newName } : l));
    }
  };

  const handleDeleteList = async (listId: string) => {
      if (confirm("Liste wirklich löschen?")) {
          await deleteCustomList(listId);
          setCustomLists(prev => prev.filter(p => p.id !== listId));
          navigate('/');
      }
  };

  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // RFC-027: Hybrides Key-System
  const tmdbKey = getTmdbKey(localStorage.getItem('tmdb_api_key') || '');
  const omdbKey = getEffectiveOmdbKey(localStorage.getItem('omdb_api_key') || '');

  useEffect(() => { 
    if (user?.id) {
        loadData(); 
    } else {
        setItems([]);
        setCustomLists([]);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Removed dangerous useEffect for hydration to prevent loops.
  // Hydration is now called explicitly in loadData and handleAdd.

  const openShareModal = (list: CustomList) => {
    setListToShare(list);
    setIsShareModalOpen(true);
  };

  const loadData = async () => {
    try {
        const [fetchedItems, fetchedLists, fetchedNotifs] = await Promise.all([
            fetchMediaItems(), 
            fetchCustomLists(),
            user?.role === UserRole.ADMIN ? fetchAdminNotifications() : Promise.resolve([])
        ]);
        setItems(fetchedItems);
        setCustomLists(fetchedLists);
        if (fetchedNotifs) {
            setUnreadNotifications(fetchedNotifs.length);
        }

        // Safe Hydration after load
        if (fetchedItems.length > 0 && tmdbKey) {
            const updates = await hydrateMissingData(fetchedItems, tmdbKey, omdbKey);
            if (updates.length > 0) {
                setItems(current => current.map(i => {
                    const update = updates.find(u => u.id === i.id);
                    return update ? update : i;
                }));
            }
        }

    } catch (e) {
        console.error("Failed to load data", e);
    }
  };
  
  const handleUpdateStatus = useCallback(async (id: string, status: WatchStatus) => {
      await updateMediaItemStatus(id, status);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
      setItems(prev => {
          const item = prev.find(i => i.id === id);
          if (item) {
              toggleMediaItemFavorite(id, !item.isFavorite);
              return prev.map(i => i.id === id ? { ...i, isFavorite: !item.isFavorite } : i);
          }
          return prev;
      });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
      if (!confirm("Wirklich löschen?")) return;
      await deleteMediaItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleRefreshItem = useCallback(async (item: MediaItem) => {
    if (!omdbKey || !item.imdbId) return;

    try {
      const rtScore = await getOmdbRatings(item.imdbId, omdbKey);
      if (rtScore && rtScore !== item.rtScore) {
        const updatedItem = { ...item, rtScore };
        setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
        // Update in DB silently
        await updateMediaItemDetails(item.id, { rtScore });
      }
    } catch (e) {
      console.error("Failed to refresh item metadata:", e);
    }
  }, [omdbKey]);

  const handleAdd = async (result: SearchResult, status: WatchStatus = WatchStatus.TO_WATCH, isFav: boolean = false) => {
    if (!user) return;

    // More robust duplicate check - Restricted to current user
    const existing = items.find(i => 
        i.userId === user.id && (
            (i.tmdbId && i.tmdbId === result.tmdbId) || 
            (i.title === result.title && i.year === result.year)
        )
    );
    if (existing) {
        alert("Bereits in deiner Sammlung!");
        return;
    }

    let details: Partial<MediaItem> = {};

    if (tmdbKey) {
        try {
            details = await getMediaDetails(result, tmdbKey);
        } catch (e) {
            console.error("Failed to get TMDB details on add:", e);
        }
    }

    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      userId: user.id,
      tmdbId: result.tmdbId,
      imdbId: details.imdbId || result.imdbId, // Use fetched or provided IMDb ID
      title: result.title,
      originalTitle: result.originalTitle,
      year: result.year,
      type: result.type,
      genre: details.genre || [],
      plot: result.plot || '',
      rating: result.rating || 0,
      posterPath: result.posterPath,
      backdropPath: result.backdropPath,
      status: status,
      addedAt: Date.now(),
      isFavorite: isFav,
      userRating: 0,
      userNotes: result.customNotes || '',
      runtime: details.runtime,
      certification: details.certification,
      trailerKey: details.trailerKey,
      credits: details.credits,
      providers: details.providers,
    };

    const savedItem = await addMediaItem(newItem, user.id);
    if (savedItem) {
        setItems(prev => [savedItem, ...prev]);
        // Trigger self-healing for the new item immediately.
        handleRefreshItem(savedItem);
    }
  };

  if (!user) return <AuthPage />;

  const displayedItems = items.filter(i => i.userId === user.id);

  const renderGrid = (statusFilter?: WatchStatus, listId?: string) => {
      let filtered = displayedItems;
      
      // 1. Filter by List or Status
      if (listId) { 
          const list = customLists.find(l => l.id === listId); 
          filtered = list ? items.filter(i => list.items.includes(i.id)) : []; 
      }
      else if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
      else if (location.pathname === '/favorites') filtered = filtered.filter(i => i.isFavorite);

      // 2. Filter by Media Type (ALL, MOVIE, SERIES)
      if (mediaTypeFilter !== 'ALL') {
          filtered = filtered.filter(i => i.type === (mediaTypeFilter === 'MOVIE' ? MediaType.MOVIE : MediaType.SERIES));
      }

      filtered.sort((a, b) => b.addedAt - a.addedAt);
      if (filtered.length === 0) return <div className="flex flex-col items-center justify-center py-20 text-slate-500"><Clapperboard size={48} className="mb-4 opacity-20" /><p>{t('empty_state')}</p></div>;
      return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 relative z-10">{filtered.map(item => <MediaCard key={item.id} item={item} onStatusChange={handleUpdateStatus} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onRate={() => {}} onClick={(i) => handleSelectItem(i, true)} onRefreshMetadata={handleRefreshItem} customLists={customLists.filter(l => l.ownerId === user.id)} onAddToList={(lid, iid) => { updateCustomListItems(lid, [...(customLists.find(cl => cl.id === lid)?.items || []), iid]); loadData(); }} />)}</div>;
  };

  return (
    <div className="min-h-screen bg-main text-text-main pb-20 md:pb-0 font-sans relative overflow-x-hidden transition-colors duration-300">
        <header className="sticky top-0 z-[100] bg-sidebar/80 backdrop-blur-xl border-b border-border-main px-4 md:px-8 h-16 flex items-center justify-between shadow-xl transition-colors duration-300">
            <div className="flex items-center gap-8">
                <div onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/20 group-hover:scale-110 transition-transform">
                        <Clapperboard size={18} className="text-white" />
                    </div>
                    <span className="font-black text-lg tracking-tight text-text-main block">InFocus <span className="text-cyan-500">CineLog</span></span>
                </div>
                <nav className="hidden md:flex items-center gap-1">
                    <button onClick={() => navigate('/')} className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/' ? 'bg-white/10 text-text-main' : 'text-text-muted hover:text-text-main hover:bg-white/5'}`}>{t('overview')}</button>
                    <button onClick={() => navigate('/watchlist')} className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/watchlist' ? 'bg-white/10 text-text-main' : 'text-text-muted hover:text-text-main hover:bg-white/5'}`}>{t('watchlist')}</button>
                    <button onClick={() => navigate('/favorites')} className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/favorites' ? 'bg-white/10 text-text-main' : 'text-text-muted hover:text-text-main hover:bg-white/5'}`}>{t('favorites')}</button>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSearchOpen(true)} className="p-2 rounded-full hover:bg-white/5 text-text-muted hover:text-text-main transition-colors"><Search size={20} /></button>
                
                <div className="relative" ref={profileMenuRef}>
                    <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 group outline-none">
                        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border-2 border-border-light group-hover:border-cyan-500/50 transition-all shadow-lg shadow-black/40">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-slate-400 m-auto mt-2.5"/>}
                        </div>
                        <div className="flex flex-col items-start mr-1">
                            <Download size={14} className="text-text-muted group-hover:text-text-main transition-colors" />
                        </div>
                    </button>

                    {isProfileMenuOpen && (
                        <div className="absolute right-0 mt-4 w-72 bg-sidebar border border-border-main rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] p-2.5 z-[110] animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-3xl">
                            <div className="px-5 py-5 border-b border-border-main mb-2">
                                <p className="text-base font-black text-text-main truncate leading-none mb-1.5">{user.username}</p>
                                <p className="text-xs font-medium text-text-muted truncate">{user.email}</p>
                            </div>
                            
                            <div className="space-y-1">
                                <button onClick={() => { navigate('/profile'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-colors">
                                    <UserIcon size={18} className="text-slate-500" /> Profil
                                </button>
                                <button onClick={() => { setIsDesignLabOpen(true); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-colors">
                                    <Palette size={18} className="text-slate-500" /> Design Lab
                                </button>
                                <button onClick={() => { navigate('/guide'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-colors">
                                    <BookOpen size={18} className="text-slate-500" /> Handbuch
                                </button>
                                {isInstallable && (
                                    <button onClick={installApp} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-black text-cyan-400 hover:bg-cyan-500/10 rounded-2xl transition-all group">
                                        <Download size={18} /> App installieren
                                    </button>
                                )}
                            </div>

                            {(user.role === UserRole.ADMIN || user.role === UserRole.OWNER) && (
                                <>
                                    <div className="h-px bg-white/5 my-2 mx-2"></div>
                                    <div className="px-4 pt-1 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Tools</div>
                                    <div className="space-y-1">
                                        <button onClick={() => { navigate('/users'); setIsProfileMenuOpen(false); if (unreadNotifications > 0) { markAdminNotificationsAsRead(); setUnreadNotifications(0); } }} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-3"><List size={18} className="text-slate-500" /> Benutzer</div>
                                            {unreadNotifications > 0 && <span className="w-5 h-5 bg-cyan-500 text-black text-[10px] font-black rounded-full flex items-center justify-center">{unreadNotifications}</span>}
                                        </button>
                                        <button onClick={() => { setIsSettingsOpen(true); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-colors">
                                            <Settings size={18} className="text-slate-500" /> Einstellungen
                                        </button>
                                        <button onClick={() => { setIsImportOpen(true); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-colors">
                                            <Database size={18} className="text-slate-500" /> Smart Import
                                        </button>
                                    </div>
                                </>
                            )}

                            <div className="h-px bg-white/5 my-2 mx-2"></div>
                            
                            <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-black text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors">
                                <LogOut size={18} /> Abmelden
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>

        <div className="max-w-[1600px] mx-auto flex relative z-10">
            <aside className="hidden md:flex w-72 flex-col sticky top-16 h-[calc(100vh-64px)] border-r border-border-main bg-sidebar overflow-hidden shrink-0 transition-colors duration-300">
                <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
                    <button onClick={() => setIsSearchOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#00A3C4] hover:bg-[#00B4D8] text-white px-4 py-3 rounded-xl font-bold transition-all mb-8 shadow-lg shadow-[#00A3C4]/10 active:scale-95"><Plus size={20} /> {t('add_button')}</button>
                    
                    <div className="mb-8">
                        <h3 className="px-3 text-[10px] font-black text-text-muted uppercase mb-4 tracking-[0.2em]">{t('my_lists')}</h3>
                        <div className="space-y-1">
                            {customLists.filter(l => l.ownerId === user.id).map(l => (
                                <div key={l.id} className="group relative flex items-center">
                                    <button onClick={() => navigate(`/list/${l.id}`)} className={`w-full text-left px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-white/5 transition-colors truncate pr-16 ${location.pathname === `/list/${l.id}` ? 'text-white bg-white/5 border border-white/10' : 'text-slate-400 hover:text-white'}`}>
                                        {l.name}
                                    </button>
                                    <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); handleRenameList(l); }} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <Pencil size={12} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteList(l.id); }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setIsCreateListOpen(true)} className="w-full text-left px-3 py-2.5 text-sm font-bold text-cyan-500 flex items-center gap-2 hover:text-cyan-400 transition-colors">
                                <Plus size={16} /> {t('create_list')}
                            </button>
                        </div>
                    </div>



                    <div className="mb-8">
                        <h3 className="px-3 text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">GETEILT MIT</h3>
                        <p className="px-3 text-xs text-slate-600 font-medium italic">Keine geteilten Listen.</p>
                    </div>
                </div>

                {/* AI TIP BOX - Fixed at bottom */}
                <div className="p-4 border-t border-border-main bg-sidebar">
                    <AiRecommendationButton items={displayedItems} onAdd={handleAdd} apiKey={tmdbKey} />
                </div>
            </aside>

            <main className="flex-grow p-6 md:p-10 min-h-[calc(100vh-64px)] relative">
                {!['/profile', '/users', '/guide'].includes(location.pathname) && (
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-text-main tracking-tight mb-4">
                                {location.pathname === '/watchlist' ? t('watchlist') : (location.pathname === '/favorites' ? t('favorites') : (location.pathname.includes('/list/') ? customLists.find(l => `/list/${l.id}` === location.pathname)?.name : t('collection')))}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => setMediaTypeFilter('ALL')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mediaTypeFilter === 'ALL' ? 'bg-text-main text-main shadow-lg shadow-white/10' : 'bg-white/5 text-text-muted hover:text-text-main hover:bg-white/10'}`}>ALL</button>
                                <button onClick={() => setMediaTypeFilter('MOVIE')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mediaTypeFilter === 'MOVIE' ? 'bg-text-main text-main shadow-lg shadow-white/10' : 'bg-white/5 text-text-muted hover:text-text-main hover:bg-white/10'}`}>MOVIES</button>
                                <button onClick={() => setMediaTypeFilter('SERIES')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mediaTypeFilter === 'SERIES' ? 'bg-text-main text-main shadow-lg shadow-white/10' : 'bg-white/5 text-text-muted hover:text-text-main hover:bg-white/10'}`}>SERIES</button>
                            </div>
                        </div>
                        {location.pathname === '/' && !isProfileMenuOpen && <Stats items={displayedItems} />}
                    </div>
                )}

                <Routes>
                    <Route path="/" element={renderGrid()} />
                    <Route path="/watchlist" element={renderGrid(WatchStatus.TO_WATCH)} />
                    <Route path="/favorites" element={renderGrid()} />
                    <Route path="/list/:id" element={<ListRoute customLists={customLists} renderGrid={renderGrid} onShare={openShareModal} />} />
                    <Route path="/profile" element={<ProfilePage items={displayedItems} />} />
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/guide" element={<GuidePage />} />
                </Routes>
            </main>
        </div>
        <ChatBot items={displayedItems} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onAdd={handleAdd} apiKey={tmdbKey} onUpdateApiKey={(key) => { localStorage.setItem('tmdb_api_key', key); }} onSelectItem={(i) => handleSelectItem(i, false)} />
        <DesignLabModal isOpen={isDesignLabOpen} onClose={() => setIsDesignLabOpen(false)} />
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            userRole={user.role}
            tmdbKey={localStorage.getItem('tmdb_api_key') || ''} 
            omdbKey={localStorage.getItem('omdb_api_key') || ''}
            onSave={(keys) => {
                if (keys.tmdb) localStorage.setItem('tmdb_api_key', keys.tmdb);
                if (keys.omdb) localStorage.setItem('omdb_api_key', keys.omdb);
                if (keys.groq) localStorage.setItem('groq_api_key', keys.groq);
                setIsSettingsOpen(false);
                window.location.reload();
            }}
        />
        <ImportModal 
            isOpen={isImportOpen} 
            onClose={() => setIsImportOpen(false)}
            onImport={async (results) => {
                for (const res of results) {
                    await handleAdd(res);
                }
            }}
            apiKey={tmdbKey}
            omdbApiKey={omdbKey}
        />
        <CreateListModal 
            isOpen={isCreateListOpen} 
            onClose={() => setIsCreateListOpen(false)}
            onCreate={async (name) => {
                const tempNewList: CustomList = {
                    id: '',
                    name: name,
                    ownerId: user.id,
                    createdAt: Date.now(),
                    items: [],
                    sharedWith: []
                };
                const created = await createCustomList(tempNewList, user.id);
                if (created) {
                    setCustomLists(prev => [...prev, created]);
                    navigate(`/list/${created.id}`);
                    setIsCreateListOpen(false);
                }
            }}
        />
        <BottomSheet 
            isOpen={isListsSheetOpen}
            onClose={() => setIsListsSheetOpen(false)}
            title={t('my_lists')}
            actions={[
                {
                    label: t('create_list'),
                    icon: <Plus size={20} className="text-cyan-400" />,
                    onClick: () => setIsCreateListOpen(true),
                    variant: 'accent'
                }
            ]}
            sections={[
                {
                    title: "DEINE SAMMLUNGEN",
                    actions: customLists.filter(l => l.ownerId === user.id).map(l => ({
                        label: l.name,
                        icon: <List size={20} />,
                        onClick: () => navigate(`/list/${l.id}`),
                        active: location.pathname === `/list/${l.id}`
                    }))
                }
            ]}
        />
        <MobileNav onSearchClick={() => setIsSearchOpen(true)} onListsClick={() => setIsListsSheetOpen(true)} />
        <AiRecommendationButton items={displayedItems} onAdd={handleAdd} apiKey={tmdbKey} mobileFabOnly={true} />
        {selectedItem && <DetailView item={selectedItem} isExisting={isSelectedItemExisting} onClose={() => setSelectedItem(null)} apiKey={tmdbKey} onUpdateStatus={handleUpdateStatus} onToggleFavorite={handleToggleFavorite} onAdd={(item, status, isFav) => { handleAdd(item, status, isFav); setSelectedItem(null); }} />}
        <ShareModal 
            isOpen={isShareModalOpen} 
            onClose={() => setIsShareModalOpen(false)}
            list={listToShare}
            onShared={() => {
                setIsShareModalOpen(false);
                loadData();
            }}
        />
        {listToRename && (
            <RenameListModal
                isOpen={isRenameListOpen}
                onClose={() => setIsRenameListOpen(false)}
                currentName={listToRename.name}
                onRename={executeRenameList}
            />
        )}
    </div>
  );
}