
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
import { LogoShowcase } from './components/LogoShowcase';
import { BottomSheet } from './components/BottomSheet';
import { 
  fetchMediaItems, addMediaItem, updateMediaItemStatus, deleteMediaItem,
  toggleMediaItemFavorite, updateMediaItemRating, updateMediaItemNotes, updateMediaItemRtScore, updateMediaItemDetails,
  fetchCustomLists, createCustomList, updateCustomListItems, deleteCustomList, shareCustomList
} from './services/db';
import { getMediaDetails } from './services/tmdb';
import { getOmdbRatings } from './services/omdb';
import { MediaItem, WatchStatus, SearchResult, CustomList, User, UserRole, MediaType } from './types';
import { LogOut, Search, Settings, User as UserIcon, List, Heart, Clapperboard, LayoutDashboard, Download, Plus, X, ChevronDown, Palette, ShieldAlert, BookOpen, FolderOpen, UserPlus } from 'lucide-react';

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
  const location = useLocation();
  const navigate = useNavigate();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [typeFilter, setTypeFilter] = useState<'ALL' | MediaType>('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isListsMenuOpen, setIsListsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [sharingList, setSharingList] = useState<CustomList | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [tmdbKey, setTmdbKey] = useState(() => localStorage.getItem('tmdb_api_key') || '');
  const [omdbKey, setOmdbKey] = useState(() => localStorage.getItem('omdb_api_key') || '');

  const myLists = user ? customLists.filter(l => l.ownerId === user.id) : [];
  const sharedLists = user ? customLists.filter(l => l.sharedWith.includes(user.id)) : [];

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setIsProfileMenuOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    const [fetchedItems, fetchedLists] = await Promise.all([ fetchMediaItems(), fetchCustomLists() ]);
    setItems(fetchedItems);
    setCustomLists(fetchedLists);
  };
  
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

  const handleUpdateNotes = useCallback(async (id: string, notes: string) => {
      await updateMediaItemNotes(id, notes);
      setItems(prev => prev.map(i => i.id === id ? { ...i, userNotes: notes } : i));
  }, []);

  const handleUpdateRtScore = useCallback(async (id: string, score: string) => {
      await updateMediaItemRtScore(id, score);
      setItems(prev => prev.map(i => i.id === id ? { ...i, rtScore: score } : i));
  }, []);

  const handleRefreshMetadata = useCallback(async (item: MediaItem) => {
      if (!tmdbKey) return alert("Kein TMDB Key gefunden.");
      try {
          const details = await getMediaDetails({ tmdbId: item.tmdbId, title: item.title, type: item.type, year: item.year, genre: item.genre, plot: item.plot, rating: item.rating }, tmdbKey);
          await updateMediaItemDetails(item.id, details);
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...details } : i));
          alert("Daten aktualisiert!");
      } catch (e) { alert("Fehler!"); }
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
    if (existing) return alert("Bereits vorhanden!");
    let details: Partial<MediaItem> = {};
    if (tmdbKey) try { details = await getMediaDetails(result, tmdbKey); } catch(e) {}
    let rtScore = undefined;
    const imdbId = result.imdbId || details.imdbId;
    if (omdbKey && imdbId) try { rtScore = await getOmdbRatings(imdbId, omdbKey) || undefined; } catch(e) {}
    const newItem: MediaItem = { id: crypto.randomUUID(), userId: user.id, tmdbId: result.tmdbId, imdbId: result.imdbId || details.imdbId, title: result.title, originalTitle: result.originalTitle, year: result.year, type: result.type, genre: result.genre, plot: result.plot, rating: result.rating, posterPath: result.posterPath, backdropPath: result.backdropPath, status: status, addedAt: Date.now(), isFavorite: isFav, userRating: 0, userNotes: result.customNotes || '', runtime: details.runtime, seasons: details.seasons, episodes: details.episodes, certification: details.certification, trailerKey: details.trailerKey, credits: details.credits || [], providers: details.providers || [], rtScore: rtScore };
    const saved = await addMediaItem(newItem, user.id);
    if (saved) setItems(prev => [saved, ...prev]);
  };

  const handleImport = async (results: SearchResult[]) => {
    for (const res of results) { await handleAdd(res); }
  };

  const handleCreateList = useCallback(async (name: string) => {
      if (!user) return;
      const newList: CustomList = { id: crypto.randomUUID(), name, ownerId: user.id, createdAt: Date.now(), items: [], sharedWith: [] };
      const saved = await createCustomList(newList, user.id);
      if (saved) setCustomLists(prev => [...prev, saved]);
  }, [user]);

  if (isRecoveryMode) return <RecoveryPage />;
  if (!user) return <AuthPage />;

  const displayedItems = items.filter(i => i.userId === user.id && (typeFilter === 'ALL' || i.type === typeFilter));

  const renderGrid = (statusFilter?: WatchStatus, listId?: string) => {
      let filtered = displayedItems;
      if (listId) { const list = customLists.find(l => l.id === listId); filtered = list ? items.filter(i => list.items.includes(i.id)) : []; }
      else if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
      else if (location.pathname === '/favorites') filtered = filtered.filter(i => i.isFavorite);
      filtered.sort((a, b) => b.addedAt - a.addedAt);
      if (filtered.length === 0) return <div className="flex flex-col items-center justify-center py-20 text-slate-500"><Clapperboard size={48} className="mb-4 opacity-20" /><p>{t('empty_state')}</p><button onClick={() => setIsSearchOpen(true)} className="mt-4 text-cyan-500 hover:underline">{t('empty_action')}</button></div>;
      return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 relative z-10">{filtered.map(item => <MediaCard key={item.id} item={item} onStatusChange={handleUpdateStatus} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onRate={handleRate} onClick={setSelectedItem} onRefreshMetadata={handleRefreshMetadata} customLists={myLists} onAddToList={handleAddToList} />)}</div>;
  };

  return (
    <div className={`min-h-screen bg-[#0B0E14] text-slate-200 pb-20 md:pb-0 font-sans selection:bg-cyan-500/30 relative overflow-hidden`}>
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
             <div className="absolute top-[-10%] right-[-10%] w-[1300px] h-[1300px] bg-blue-600/40 rounded-full blur-[160px]"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[1200px] h-[1200px] bg-purple-600/35 rounded-full blur-[160px]"></div>
        </div>

        {adminNotification && (
            <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right-10 duration-300">
                <div onClick={dismissAdminNotification} className={`cursor-pointer px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border ${adminNotification.type === 'register' ? 'bg-purple-600/20 border-purple-500/40' : 'bg-cyan-600/20 border-cyan-500/40'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${adminNotification.type === 'register' ? 'bg-purple-500 text-white' : 'bg-cyan-500 text-white'}`}><UserPlus size={20}/></div>
                    <div><p className="text-white font-bold text-sm">{adminNotification.message}</p><p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">System-Monitor</p></div>
                    <X size={14} className="text-slate-500 ml-4"/>
                </div>
            </div>
        )}

        {location.pathname !== '/design-lab' && (
        <header className="sticky top-0 z-30 bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg"><Clapperboard size={18} className="text-white" /></div>
                    <span className="font-bold text-xl tracking-tight text-white block">InFocus <span className="text-cyan-400">CineLog</span></span>
                </div>
                <nav className="hidden md:flex items-center gap-1">
                    <button onClick={() => navigate('/')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${location.pathname === '/' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t('overview')}</button>
                    <button onClick={() => navigate('/watchlist')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${location.pathname === '/watchlist' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t('watchlist')}</button>
                    <button onClick={() => navigate('/favorites')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${location.pathname === '/favorites' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t('favorites')}</button>
                </nav>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSearchOpen(true)} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><Search size={20} /></button>
                <div className="relative" ref={profileMenuRef}>
                    <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="text-slate-400 m-auto mt-2"/>}</div>
                        <ChevronDown size={14} className="text-slate-500 mr-1" />
                    </button>
                    {isProfileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-white/5 mb-1"><p className="text-sm font-bold text-white truncate">{user.username}</p><p className="text-xs text-slate-500 truncate">{user.email}</p></div>
                            <button onClick={() => { navigate('/profile'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2"><UserIcon size={16} /> {t('profile')}</button>
                            {(user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && <button onClick={() => { navigate('/users'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2"><List size={16} /> {t('user_management')}</button>}
                            <button onClick={() => { setIsSettingsOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2"><Settings size={16} /> {t('settings')}</button>
                            <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"><LogOut size={16} /> {t('logout')}</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
        )}

        <div className="flex max-w-[1600px] mx-auto relative z-10">
            {location.pathname !== '/design-lab' && (
            <aside className="hidden md:flex w-64 flex-col fixed left-0 top-16 bottom-0 border-r border-white/5 bg-[#0B0E14]/50 backdrop-blur-sm overflow-y-auto">
                <div className="p-4">
                    <button onClick={() => setIsSearchOpen(true)} className="w-full flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20 mb-6"><Plus size={20} /> {t('add_button')}</button>
                    <div className="mb-6">
                        <h3 className="px-3 text-xs font-bold text-slate-500 uppercase mb-2">{t('my_lists')}</h3>
                        <div className="space-y-1">
                            {myLists.map(l => (
                                <div key={l.id} className="group flex items-center justify-between pr-2 rounded-lg hover:bg-white/5 transition-colors">
                                    <button onClick={() => navigate(`/list/${l.id}`)} className={`flex-grow text-left px-3 py-2 text-sm font-medium truncate ${location.pathname === `/list/${l.id}` ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{l.name}</button>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                        <button onClick={() => deleteCustomList(l.id).then(() => setCustomLists(prev => prev.filter(x => x.id !== l.id)))} className="p-1 text-slate-500 hover:text-red-400"><X size={12}/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setIsCreateListOpen(true)} className="w-full text-left px-3 py-2 text-sm text-cyan-500 hover:text-cyan-400 font-medium flex items-center gap-2 mt-2"><Plus size={14} /> {t('create_list')}</button>
                        </div>
                    </div>
                    {sharedLists.length > 0 && (
                        <div className="mb-6">
                            <h3 className="px-3 text-xs font-bold text-slate-500 uppercase mb-2">Geteilte Listen</h3>
                            <div className="space-y-1">
                                {sharedLists.map(l => (
                                    <button key={l.id} onClick={() => navigate(`/list/${l.id}`)} className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/5 truncate ${location.pathname === `/list/${l.id}` ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white'}`}>{l.name}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <AiRecommendationButton items={items} onAdd={handleAdd} apiKey={tmdbKey} />
            </aside>
            )}
            <main className={`flex-grow p-4 md:p-8 min-h-[calc(100vh-64px)] ${location.pathname !== '/design-lab' ? 'md:pl-64' : ''}`}>
                {location.pathname === '/' && <Stats items={displayedItems} />}
                <Routes>
                    <Route path="/" element={<div><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('collection')}</h2><p className="text-slate-400">{t('collection_sub')}</p></div>{renderGrid()}</div>} />
                    <Route path="/watchlist" element={<div><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('watchlist')}</h2></div>{renderGrid(WatchStatus.TO_WATCH)}</div>} />
                    <Route path="/favorites" element={<div><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('favorites')}</h2></div>{renderGrid()}</div>} />
                    <Route path="/list/:id" element={<ListRoute customLists={customLists} renderGrid={renderGrid} />} />
                    <Route path="/profile" element={<ProfilePage items={items.filter(i => i.userId === user.id)} />} />
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/design-lab" element={user.role === UserRole.ADMIN ? <LogoShowcase /> : <Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
        <ChatBot items={items.filter(i => i.userId === user.id)} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onAdd={handleAdd} apiKey={tmdbKey} onUpdateApiKey={(key) => { localStorage.setItem('tmdb_api_key', key); setTmdbKey(key); }} />
        <DetailView item={selectedItem!} isExisting={true} onClose={() => setSelectedItem(null)} apiKey={tmdbKey} omdbApiKey={omdbKey} onUpdateStatus={handleUpdateStatus} onToggleFavorite={handleToggleFavorite} onUpdateNotes={handleUpdateNotes} onUpdateRtScore={handleUpdateRtScore} />
        {sharingList && <ShareModal isOpen={!!sharingList} onClose={() => setSharingList(null)} list={sharingList} onShare={async (id, users) => { await shareCustomList(id, users); setCustomLists(prev => prev.map(l => l.id === id ? {...l, sharedWith: users} : l)); }} />}
        <MobileNav onSearchClick={() => setIsSearchOpen(true)} onListsClick={() => setIsListsMenuOpen(true)} />
    </div>
  );
}
