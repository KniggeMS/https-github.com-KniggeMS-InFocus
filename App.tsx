import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTranslation } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { AuthPage } from './components/AuthPage';
import { MobileNav } from './components/MobileNav';
import { MediaCard } from './components/MediaCard';
import { SearchModal } from './components/SearchModal';
import { DetailView } from './components/DetailView';
import { Stats } from './components/Stats';
import { ProfilePage } from './components/ProfilePage';
import { UserManagementPage } from './components/UserManagementPage';
import { ChatBot } from './components/ChatBot';
import { AiRecommendationButton } from './components/AiRecommendationButton';
import { ShareModal } from './components/ShareModal';
import { CreateListModal } from './components/CreateListModal';
import { ImportModal } from './components/ImportModal';
import { RecoveryPage } from './components/RecoveryPage';
import { PublicProfileModal } from './components/PublicProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { GuidePage } from './components/GuidePage';
import { InstallPwaModal } from './components/InstallPwaModal';
import { LogoShowcase } from './components/LogoShowcase';
import { 
  fetchMediaItems, addMediaItem, updateMediaItemStatus, deleteMediaItem,
  toggleMediaItemFavorite, updateMediaItemRating, updateMediaItemNotes, updateMediaItemRtScore, updateMediaItemDetails,
  fetchCustomLists, createCustomList, updateCustomListItems, deleteCustomList, shareCustomList
} from './services/db';
import { getMediaDetails } from './services/tmdb';
import { getOmdbRatings } from './services/omdb';
import { MediaItem, WatchStatus, SearchResult, CustomList, User, UserRole, MediaType } from './types';
import { LogOut, Search, Settings, User as UserIcon, List, Heart, Clapperboard, LayoutDashboard, Download, Plus, X, ChevronDown, Palette, ShieldAlert, BookOpen } from 'lucide-react';

const FALLBACK_KEYS = {
    TMDB: "4115939bdc412c5f7b0c4598fcf29b77", 
    OMDB: "33df5dc9"
};

const ListRoute = ({ customLists, renderGrid }: { customLists: CustomList[], renderGrid: (s?: WatchStatus, l?: string) => React.ReactNode }) => {
    const { id } = useParams();
    const list = customLists.find(l => l.id === id);
    if (!list) return <div className="p-8 text-center text-slate-500">Liste nicht gefunden</div>;
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <List size={24} className="text-purple-400" /> {list.name}
                </h2>
                {list.description && <p className="text-slate-400">{list.description}</p>}
            </div>
            {renderGrid(undefined, id)}
        </div>
    );
};

export default function App() {
  const { user, logout, isRecoveryMode, adminNotification, dismissAdminNotification } = useAuth();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  
  // Filter State for "Pills"
  const [typeFilter, setTypeFilter] = useState<'ALL' | MediaType>('ALL');
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [sharingList, setSharingList] = useState<CustomList | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  
  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [tmdbKey, setTmdbKey] = useState(() => localStorage.getItem('tmdb_api_key') || process.env.VITE_TMDB_API_KEY || FALLBACK_KEYS.TMDB || '');
  const [omdbKey, setOmdbKey] = useState(() => localStorage.getItem('omdb_api_key') || process.env.VITE_OMDB_API_KEY || FALLBACK_KEYS.OMDB || '');

  const myLists = user ? customLists.filter(l => l.ownerId === user.id) : [];
  const sharedLists = user ? customLists.filter(l => l.sharedWith.includes(user.id)) : [];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // PWA Prompt Listener
  useEffect(() => {
    const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        console.log("Install Prompt intercepted");
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
              setIsProfileMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    const [fetchedItems, fetchedLists] = await Promise.all([
      fetchMediaItems(),
      fetchCustomLists()
    ]);
    setItems(fetchedItems);
    setCustomLists(fetchedLists);
  };
  
  // Handlers wrapped in useCallback for Performance (Vivaldi Fix)
  const handleUpdateStatus = useCallback(async (id: string, status: WatchStatus) => {
      await updateMediaItemStatus(id, status);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }, []);

  const handleRate = useCallback(async (id: string, rating: number) => {
      await updateMediaItemRating(id, rating);
      setItems(prev => prev.map(i => i.id === id ? { ...i, userRating: rating } : i));
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
      setItems(prev => {
          const item = prev.find(i => i.id === id);
          if (item) {
              toggleMediaItemFavorite(id, !item.isFavorite);
              return prev.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i);
          }
          return prev;
      });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
      if (!confirm("Wirklich löschen?")) return;
      await deleteMediaItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setCustomLists(prev => prev.map(l => ({...l, items: l.items.filter(itemId => itemId !== id)})));
  }, []);

  const handleUpdateNotes = useCallback(async (id: string, notes: string) => {
      await updateMediaItemNotes(id, notes);
      setItems(prev => prev.map(i => i.id === id ? { ...i, userNotes: notes } : i));
  }, []);

  const handleUpdateRtScore = useCallback(async (id: string, score: string) => {
      await updateMediaItemRtScore(id, score);
      setItems(prev => prev.map(i => i.id === id ? { ...i, rtScore: score } : i));
  }, []);

  // NEW: Refresh Metadata Handler
  const handleRefreshMetadata = useCallback(async (item: MediaItem) => {
      if (!tmdbKey) {
          alert("Kein TMDB Key gefunden. Bitte in Einstellungen prüfen.");
          return;
      }
      
      const searchRes: SearchResult = {
          tmdbId: item.tmdbId,
          title: item.title,
          type: item.type,
          year: item.year,
          genre: item.genre,
          plot: item.plot,
          rating: item.rating
      };
      
      try {
          const details = await getMediaDetails(searchRes, tmdbKey);
          await updateMediaItemDetails(item.id, details);
          
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...details } : i));
          alert("Metadaten erfolgreich aktualisiert!");
      } catch (e) {
          console.error("Refresh failed", e);
          alert("Fehler beim Aktualisieren.");
      }
  }, [tmdbKey]);

  const handleAddToList = useCallback(async (listId: string, itemId: string) => {
      setCustomLists(prev => {
          const list = prev.find(l => l.id === listId);
          if (!list) return prev;
          
          let newItems = list.items || [];
          if (newItems.includes(itemId)) newItems = newItems.filter(i => i !== itemId);
          else newItems = [...newItems, itemId];
          
          updateCustomListItems(listId, newItems);
          
          return prev.map(l => l.id === listId ? { ...l, items: newItems } : l);
      });
  }, []);

  const handleAdd = async (result: SearchResult, status: WatchStatus = WatchStatus.TO_WATCH, isFav: boolean = false) => {
    if (!user) return;
    const existing = items.find(i => i.tmdbId === result.tmdbId && i.userId === user.id);
    if (existing) {
        alert("Bereits in deiner Sammlung!");
        return;
    }

    // ENRICHMENT STEP: Fetch full details (Cast, Runtime, Providers) before saving
    let details: Partial<MediaItem> = {};
    if (tmdbKey) {
        try {
            details = await getMediaDetails(result, tmdbKey);
        } catch(e) { console.error("Details fetch failed", e); }
    }

    // ENRICHMENT STEP: Fetch OMDb Rating (RT Score)
    let rtScore = undefined;
    const imdbId = result.imdbId || details.imdbId;
    if (omdbKey && imdbId) {
        try {
            const score = await getOmdbRatings(imdbId, omdbKey);
            if (score) rtScore = score;
        } catch(e) { console.error("OMDb fetch failed", e); }
    }

    const newItem: MediaItem = {
        id: crypto.randomUUID(),
        userId: user.id,
        tmdbId: result.tmdbId,
        imdbId: result.imdbId || details.imdbId,
        title: result.title,
        originalTitle: result.originalTitle,
        year: result.year,
        type: result.type,
        genre: result.genre,
        plot: result.plot,
        rating: result.rating,
        posterPath: result.posterPath,
        backdropPath: result.backdropPath,
        status: status,
        addedAt: Date.now(),
        isFavorite: isFav,
        userRating: 0,
        userNotes: result.customNotes || '',
        // Merged Details
        runtime: details.runtime,
        seasons: details.seasons,
        episodes: details.episodes,
        certification: details.certification,
        trailerKey: details.trailerKey,
        credits: details.credits || [],
        providers: details.providers || [],
        rtScore: rtScore
    };

    const saved = await addMediaItem(newItem, user.id);
    if (saved) {
        setItems(prev => [saved, ...prev]);
    }
  };

  const handleCreateList = async (name: string) => {
      if (!user) return;
      const created = await createCustomList({id: '', ownerId: user.id, name, createdAt: Date.now(), items: [], sharedWith: []}, user.id);
      if (created) setCustomLists(prev => [...prev, created]);
  };
  const handleDeleteList = async (id: string) => {
      if (!confirm(t('delete_list_confirm'))) return;
      await deleteCustomList(id);
      setCustomLists(prev => prev.filter(l => l.id !== id));
  };
  
  const handleShareList = async (listId: string, userIds: string[]) => {
      await shareCustomList(listId, userIds);
      setCustomLists(prev => prev.map(l => l.id === listId ? { ...l, sharedWith: userIds } : l));
  };

  const handleImport = async (results: SearchResult[]) => {
      for (const res of results) {
          await handleAdd(res, WatchStatus.TO_WATCH, false);
      }
      setIsImportOpen(false);
  };

  // Fixed: Removed Gemini API Key from settings save logic
  const handleSettingsSave = (keys: { tmdb: string, omdb: string }) => {
      if (keys.tmdb) { localStorage.setItem('tmdb_api_key', keys.tmdb); setTmdbKey(keys.tmdb); }
      if (keys.omdb) { localStorage.setItem('omdb_api_key', keys.omdb); setOmdbKey(keys.omdb); }
      setIsSettingsOpen(false);
  };

  if (isRecoveryMode) return <RecoveryPage />;
  if (!user) return <AuthPage />;

  const displayedItems = items.filter(i => {
      if (i.userId !== user.id) return false;
      if (typeFilter !== 'ALL' && i.type !== typeFilter) return false;
      return true;
  });

  const renderGrid = (statusFilter?: WatchStatus, listId?: string) => {
      let filtered = displayedItems;
      
      if (listId) {
          const list = customLists.find(l => l.id === listId);
          if (list) {
             filtered = items.filter(i => list.items.includes(i.id));
          } else {
             filtered = [];
          }
      } else if (statusFilter) {
          filtered = filtered.filter(i => i.status === statusFilter);
      } else if (location.pathname === '/favorites') {
          filtered = filtered.filter(i => i.isFavorite);
      }

      filtered.sort((a, b) => b.addedAt - a.addedAt);

      if (filtered.length === 0) {
          return (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Clapperboard size={48} className="mb-4 opacity-20" />
                  <p>{t('empty_state')}</p>
                  <button onClick={() => setIsSearchOpen(true)} className="mt-4 text-cyan-500 hover:underline">{t('empty_action')}</button>
              </div>
          );
      }

      return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 relative z-10">
              {filtered.map(item => (
                  <MediaCard 
                      key={item.id} 
                      item={item} 
                      onStatusChange={handleUpdateStatus}
                      onDelete={handleDelete}
                      onToggleFavorite={handleToggleFavorite}
                      onRate={handleRate}
                      onClick={setSelectedItem}
                      onRefreshMetadata={handleRefreshMetadata}
                      customLists={myLists}
                      onAddToList={handleAddToList}
                  />
              ))}
          </div>
      );
  };

  return (
    <div className={`min-h-screen bg-[#0B0E14] text-slate-200 pb-20 md:pb-0 font-sans selection:bg-cyan-500/30 relative overflow-hidden`}>
        {/* REINFORCED Ambient Background Glow */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
             <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600/15 rounded-full blur-[140px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[140px]"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan-900/5 rounded-full blur-[160px]"></div>
        </div>

        {/* ADMIN NOTIFICATION TOAST */}
        {adminNotification && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 duration-300">
                <div className="bg-slate-900/90 backdrop-blur-md border border-red-500/30 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                    <ShieldAlert size={20} className="text-red-500 animate-pulse" />
                    <span className="font-mono text-sm font-bold tracking-tight">{adminNotification}</span>
                    <button onClick={dismissAdminNotification} className="ml-2 text-slate-500 hover:text-white"><X size={14}/></button>
                </div>
            </div>
        )}

        {/* HEADER */}
        {location.pathname !== '/design-lab' && (
        <header className="sticky top-0 z-30 bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/40 group-hover:scale-105 transition-transform">
                        <Clapperboard size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white block">
                        InFocus <span className="text-cyan-400">CineLog</span>
                    </span>
                </div>

                <nav className="hidden md:flex items-center gap-1">
                    <button onClick={() => navigate('/')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${location.pathname === '/' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t('overview')}</button>
                    <button onClick={() => navigate('/watchlist')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${location.pathname === '/watchlist' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t('watchlist')}</button>
                    <button onClick={() => navigate('/favorites')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${location.pathname === '/favorites' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t('favorites')}</button>
                </nav>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={() => setIsSearchOpen(true)} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                    <Search size={20} />
                </button>

                <div className="relative" ref={profileMenuRef}>
                    <button 
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                             {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="text-slate-400 m-auto mt-2"/>}
                        </div>
                        <ChevronDown size={14} className="text-slate-500 mr-1" />
                    </button>

                    {isProfileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-white/5 mb-1">
                                <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                            
                            {/* PWA INSTALL ENTRY */}
                            <button onClick={() => { setIsInstallModalOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-cyan-400 hover:bg-white/5 flex items-center gap-2 font-bold">
                                <Download size={16} /> App installieren
                            </button>
                            <div className="h-px bg-white/5 my-1"></div>

                            <button onClick={() => { navigate('/profile'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                <UserIcon size={16} /> {t('profile')}
                            </button>

                            {/* DESIGN LAB - ADMIN ONLY */}
                            {user.role === UserRole.ADMIN && (
                                <button onClick={() => { navigate('/design-lab'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-purple-400 hover:bg-purple-500/10 flex items-center gap-2">
                                    <Palette size={16} /> 🎨 Design Lab
                                </button>
                            )}
                            
                            {(user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && (
                                <button onClick={() => { navigate('/users'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                    <List size={16} /> {t('user_management')}
                                </button>
                            )}

                            <button onClick={() => { setIsSettingsOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                <Settings size={16} /> {t('settings')}
                            </button>
                             <button onClick={() => { setIsImportOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                <Download size={16} /> {t('smart_import')}
                            </button>
                            
                            <button onClick={() => { setIsGuideOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                <BookOpen size={16} /> Handbuch
                            </button>

                            <div className="h-px bg-white/5 my-1"></div>
                            
                             <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                <LogOut size={16} /> {t('logout')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
        )}

        {/* MAIN LAYOUT */}
        <div className="flex max-w-[1600px] mx-auto relative z-10">
            {/* Sidebar */}
            {location.pathname !== '/design-lab' && (
            <aside className="hidden md:flex w-64 flex-col fixed left-0 top-16 bottom-0 border-r border-white/5 bg-[#0B0E14]/50 backdrop-blur-sm overflow-y-auto custom-scrollbar">
                <div className="p-4">
                    <button onClick={() => setIsSearchOpen(true)} className="w-full flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20 mb-6">
                        <Plus size={20} /> {t('add_button')}
                    </button>
                    
                    <div className="mb-6">
                        <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('my_lists')}</h3>
                        <div className="space-y-1">
                            {myLists.length === 0 && <p className="px-3 text-sm text-slate-600 italic">Keine Listen</p>}
                            {myLists.map(l => (
                                <div key={l.id} className="group flex items-center justify-between pr-2 rounded-lg hover:bg-white/5 transition-colors">
                                    <button 
                                        onClick={() => navigate(`/list/${l.id}`)}
                                        className={`flex-grow text-left px-3 py-2 text-sm font-medium truncate ${location.pathname === `/list/${l.id}` ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                                    >
                                        {l.name}
                                    </button>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); setSharingList(l); }} className="p-1 text-slate-500 hover:text-cyan-400"><LayoutDashboard size={12}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteList(l.id); }} className="p-1 text-slate-500 hover:text-red-400"><X size={12}/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setIsCreateListOpen(true)} className="w-full text-left px-3 py-2 text-sm text-cyan-500 hover:text-cyan-400 font-medium flex items-center gap-2 mt-2">
                                <Plus size={14} /> {t('create_list')}
                            </button>
                        </div>
                    </div>

                    {/* DESIGN LAB - ADMIN ONLY */}
                    {user.role === UserRole.ADMIN && (
                        <div className="mb-6">
                            <button onClick={() => navigate('/design-lab')} className="w-full text-left px-3 py-2 text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2 rounded-lg hover:bg-purple-500/10 transition-colors">
                                <Palette size={16} /> 🎨 Design Lab
                            </button>
                        </div>
                    )}

                    {sharedLists.length > 0 && (
                         <div className="mb-6">
                            <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('shared_with')}</h3>
                            <div className="space-y-1">
                                {sharedLists.map(l => (
                                    <button 
                                        key={l.id}
                                        onClick={() => navigate(`/list/${l.id}`)}
                                        className={`w-full text-left px-3 py-2 text-sm font-medium truncate rounded-lg transition-colors ${location.pathname === `/list/${l.id}` ? 'bg-white/5 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                    >
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <AiRecommendationButton items={items} onAdd={handleAdd} apiKey={tmdbKey} />
            </aside>
            )}

            {/* Content Area */}
            <main className={`flex-grow p-4 md:p-8 min-h-[calc(100vh-64px)] ${location.pathname !== '/design-lab' ? 'md:pl-64' : ''}`}>
                {location.pathname === '/' && <Stats items={displayedItems} />}

                {(location.pathname === '/' || location.pathname === '/watchlist' || location.pathname === '/favorites' || location.pathname.startsWith('/list/')) && (
                     <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                        <button 
                            onClick={() => setTypeFilter('ALL')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${typeFilter === 'ALL' ? 'bg-white text-black border-white' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'}`}
                        >
                            ALL
                        </button>
                        <button 
                            onClick={() => setTypeFilter(MediaType.MOVIE)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-2 ${typeFilter === MediaType.MOVIE ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${typeFilter === MediaType.MOVIE ? 'bg-cyan-400' : 'bg-slate-500'}`}></span> MOVIES
                        </button>
                        <button 
                            onClick={() => setTypeFilter(MediaType.SERIES)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-2 ${typeFilter === MediaType.SERIES ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${typeFilter === MediaType.SERIES ? 'bg-purple-400' : 'bg-slate-500'}`}></span> SERIES
                        </button>
                    </div>
                )}

                <Routes>
                    <Route path="/" element={
                        <div>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white">{t('collection')}</h2>
                                <p className="text-slate-400">{t('collection_sub')}</p>
                            </div>
                            {renderGrid()}
                        </div>
                    } />
                    <Route path="/watchlist" element={
                        <div>
                             <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white">{t('watchlist')}</h2>
                            </div>
                            {renderGrid(WatchStatus.TO_WATCH)}
                        </div>
                    } />
                    <Route path="/favorites" element={
                        <div>
                             <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white">{t('favorites')}</h2>
                            </div>
                            {renderGrid()}
                        </div>
                    } />
                    <Route path="/list/:id" element={<ListRoute customLists={customLists} renderGrid={renderGrid} />} />
                    <Route path="/profile" element={<ProfilePage items={items.filter(i => i.userId === user.id)} />} />
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/design-lab" element={user.role === UserRole.ADMIN ? <LogoShowcase /> : <Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>

        {/* Modals & Helpers */}
        {location.pathname !== '/design-lab' && (
            <>
                <ChatBot items={items.filter(i => i.userId === user.id)} />
                <AiRecommendationButton items={items} onAdd={handleAdd} apiKey={tmdbKey} mobileFabOnly={true} />
                <MobileNav onSearchClick={() => setIsSearchOpen(true)} onListsClick={() => setIsCreateListOpen(true)} />
            </>
        )}

        <SearchModal 
            isOpen={isSearchOpen} 
            onClose={() => setIsSearchOpen(false)} 
            onAdd={handleAdd} 
            apiKey={tmdbKey}
            onUpdateApiKey={(key) => {
                localStorage.setItem('tmdb_api_key', key);
                setTmdbKey(key);
            }} 
        />
        
        <ImportModal 
            isOpen={isImportOpen} 
            onClose={() => setIsImportOpen(false)} 
            onImport={handleImport}
            apiKey={tmdbKey}
            omdbApiKey={omdbKey}
        />

        <CreateListModal 
            isOpen={isCreateListOpen} 
            onClose={() => setIsCreateListOpen(false)} 
            onCreate={handleCreateList} 
        />
        
        {sharingList && (
            <ShareModal 
                isOpen={!!sharingList} 
                onClose={() => setSharingList(null)} 
                list={sharingList}
                onShare={handleShareList}
            />
        )}

        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            tmdbKey={tmdbKey}
            omdbKey={omdbKey}
            onSave={handleSettingsSave}
        />

        <InstallPwaModal 
            isOpen={isInstallModalOpen} 
            onClose={() => setIsInstallModalOpen(false)}
            installPrompt={deferredPrompt}
        />
        
        {isGuideOpen && (
             <div className="fixed inset-0 z-[100] bg-[#0B0E14] overflow-y-auto animate-in slide-in-from-right-10 duration-200">
                <GuidePage onBack={() => setIsGuideOpen(false)} />
             </div>
        )}

        {selectedItem && (
            <DetailView 
                item={selectedItem}
                isExisting={true}
                onClose={() => setSelectedItem(null)}
                apiKey={tmdbKey}
                omdbApiKey={omdbKey}
                onUpdateStatus={handleUpdateStatus}
                onToggleFavorite={handleToggleFavorite}
                onUpdateNotes={handleUpdateNotes}
                onUpdateRtScore={handleUpdateRtScore}
            />
        )}

        {viewingProfile && (
            <PublicProfileModal 
                user={viewingProfile}
                allLists={customLists}
                allItems={items}
                onClose={() => setViewingProfile(null)}
            />
        )}
    </div>
  );
}
