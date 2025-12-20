
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
import { GuidePage } from './components/GuidePage';
import { SettingsModal } from './components/SettingsModal';
import { ChatBot } from './components/ChatBot';
import { AiRecommendationButton } from './components/AiRecommendationButton';
import { ShareModal } from './components/ShareModal';
import { CreateListModal } from './components/CreateListModal';
import { 
  fetchMediaItems, addMediaItem, updateMediaItemStatus, deleteMediaItem,
  toggleMediaItemFavorite, updateMediaItemRating, updateMediaItemNotes, updateMediaItemRtScore, updateMediaItemDetails,
  fetchCustomLists, createCustomList, updateCustomListItems, deleteCustomList, shareCustomList
} from './services/db';
import { getMediaDetails } from './services/tmdb';
import { getOmdbRatings } from './services/omdb';
import { MediaItem, WatchStatus, SearchResult, CustomList, User, UserRole, MediaType } from './types';
import { LogOut, Search, Settings, User as UserIcon, List, Heart, Clapperboard, Plus, X, ChevronDown, BookOpen, Shield, Share2 } from 'lucide-react';

const ListRoute = ({ customLists, renderGrid, onShare }: { customLists: CustomList[], renderGrid: (s?: WatchStatus, l?: string) => React.ReactNode, onShare: (list: CustomList) => void }) => {
    const { id } = useParams();
    const { user } = useAuth();
    const list = customLists.find(l => l.id === id);
    if (!list) return <div className="p-8 text-center text-slate-500">Liste nicht gefunden</div>;
    
    const isOwner = user?.id === list.ownerId;

    return (
        <div>
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <List size={24} className="text-purple-400" /> {list.name}
                    </h2>
                    {list.description && <p className="text-slate-400">{list.description}</p>}
                </div>
                {isOwner && (
                    <button 
                        onClick={() => onShare(list)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-lg border border-white/10 transition-colors flex items-center gap-2 text-sm font-bold"
                    >
                        <Share2 size={18} /> Gliedern/Teilen
                    </button>
                )}
            </div>
            {renderGrid(undefined, id)}
        </div>
    );
};

export default function App() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileListsOpen, setIsMobileListsOpen] = useState(false);
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

  const handleRefreshMetadata = useCallback(async (item: MediaItem) => {
      if (!tmdbKey) return alert("Kein TMDB Key gefunden.");
      try {
          const details = await getMediaDetails(item as any, tmdbKey);
          await updateMediaItemDetails(item.id, details);
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...details } : i));
      } catch (e) {}
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

  const handleCreateList = async (name: string) => {
      if (!user) return;
      const newList: CustomList = {
          id: crypto.randomUUID(),
          name,
          ownerId: user.id,
          createdAt: Date.now(),
          items: [],
          sharedWith: []
      };
      const saved = await createCustomList(newList, user.id);
      if (saved) setCustomLists(prev => [...prev, saved]);
  };

  const handleShareList = async (listId: string, userIds: string[]) => {
      await shareCustomList(listId, userIds);
      setCustomLists(prev => prev.map(l => l.id === listId ? { ...l, sharedWith: userIds } : l));
  };

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

  const handleSaveSettings = (keys: { tmdb: string, omdb: string }) => {
      localStorage.setItem('tmdb_api_key', keys.tmdb);
      localStorage.setItem('omdb_api_key', keys.omdb);
      setTmdbKey(keys.tmdb);
      setOmdbKey(keys.omdb);
  };

  if (!user) return <AuthPage />;

  const displayedItems = items.filter(i => i.userId === user.id);

  const renderGrid = (statusFilter?: WatchStatus, listId?: string) => {
      let filtered = displayedItems;
      if (listId) { const list = customLists.find(l => l.id === listId); filtered = list ? items.filter(i => list.items.includes(i.id)) : []; }
      else if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
      else if (location.pathname === '/favorites') filtered = filtered.filter(i => i.isFavorite);
      filtered.sort((a, b) => b.addedAt - a.addedAt);
      if (filtered.length === 0) return <div className="flex flex-col items-center justify-center py-20 text-slate-500"><Clapperboard size={48} className="mb-4 opacity-20" /><p>{t('empty_state')}</p></div>;
      return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 relative z-10">{filtered.map(item => <MediaCard key={item.id} item={item} onStatusChange={handleUpdateStatus} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onRate={() => {}} onClick={setSelectedItem} onRefreshMetadata={handleRefreshMetadata} customLists={myLists} onAddToList={handleAddToList} />)}</div>;
  };

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 pb-20 md:pb-0 font-sans relative overflow-x-hidden">
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
             <div className="absolute top-[-10%] right-[-10%] w-[1300px] h-[1300px] bg-blue-600/20 rounded-full blur-[160px]"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[1200px] h-[1200px] bg-purple-600/15 rounded-full blur-[160px]"></div>
        </div>

        <header className="sticky top-0 z-[100] bg-[#0B0E14] border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-6">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg"><Clapperboard size={18} className="text-white" /></div>
                    <span className="font-bold text-xl tracking-tight text-white block">InFocus <span className="text-cyan-400">CineLog</span></span>
                </div>
                <nav className="hidden md:flex items-center gap-1">
                    <button onClick={() => navigate('/')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${location.pathname === '/' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t('overview')}</button>
                    <button onClick={() => navigate('/watchlist')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${location.pathname === '/watchlist' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t('watchlist')}</button>
                    <button onClick={() => navigate('/favorites')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${location.pathname === '/favorites' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t('favorites')}</button>
                </nav>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSearchOpen(true)} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><Search size={20} /></button>
                <div className="relative" ref={profileMenuRef}>
                    <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 border border-transparent">
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="text-slate-400 m-auto mt-2"/>}</div>
                        <ChevronDown size={14} className="text-slate-500" />
                    </button>
                    {isProfileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-[#151a23] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] py-2 z-[110] animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-white/5 mb-1"><p className="text-sm font-bold text-white truncate">{user.username}</p><p className="text-[10px] text-slate-500 uppercase tracking-widest">{user.role}</p></div>
                            <button onClick={() => { navigate('/profile'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"><UserIcon size={16} className="text-slate-500" /> {t('profile')}</button>
                            <button onClick={() => { navigate('/guide'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"><BookOpen size={16} className="text-slate-500" /> {t('handbuch')}</button>
                            {isAdmin && (
                                <>
                                    <button onClick={() => { navigate('/users'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"><Shield size={16} className="text-cyan-500" /> {t('user_management')}</button>
                                    <button onClick={() => { setIsSettingsOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"><Settings size={16} className="text-slate-500" /> {t('settings')}</button>
                                </>
                            )}
                            <div className="h-px bg-white/5 my-1"></div>
                            <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"><LogOut size={16} /> {t('logout')}</button>
                        </div>
                    )}
                </div>
            </div>
        </header>

        <div className="max-w-[1600px] mx-auto flex relative z-10">
            <aside className="hidden md:flex w-64 flex-col sticky top-16 h-[calc(100vh-64px)] border-r border-white/5 bg-[#0B0E14]/40 backdrop-blur-md overflow-y-auto shrink-0">
                <div className="p-4">
                    <button onClick={() => setIsSearchOpen(true)} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-3 rounded-xl font-bold transition-all mb-6 shadow-lg shadow-cyan-900/20"><Plus size={20} /> {t('add_button')}</button>
                    <div className="mb-6">
                        <h3 className="px-3 text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">{t('my_lists')}</h3>
                        <div className="space-y-1">
                            {myLists.map(l => (
                                <button key={l.id} onClick={() => navigate(`/list/${l.id}`)} className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/5 transition-colors truncate ${location.pathname === `/list/${l.id}` ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white'}`}>{l.name}</button>
                            ))}
                            <button onClick={() => setIsCreateListOpen(true)} className="w-full text-left px-3 py-2 text-sm text-cyan-500 hover:text-cyan-400 font-medium flex items-center gap-2 mt-2 transition-colors"><Plus size={14} /> {t('create_list')}</button>
                        </div>
                    </div>
                    {sharedLists.length > 0 && (
                        <div className="mb-6">
                            <h3 className="px-3 text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Geteilte Listen</h3>
                            <div className="space-y-1">
                                {sharedLists.map(l => (
                                    <button key={l.id} onClick={() => navigate(`/list/${l.id}`)} className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/5 transition-colors truncate ${location.pathname === `/list/${l.id}` ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white'}`}>{l.name}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-auto">
                    <AiRecommendationButton items={items.filter(i => i.userId === user.id)} onAdd={handleAdd} apiKey={tmdbKey} />
                </div>
            </aside>

            <main className="flex-grow p-4 md:p-8 min-h-[calc(100vh-64px)] relative">
                {location.pathname === '/' && <Stats items={displayedItems} />}
                <Routes>
                    <Route path="/" element={<div><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('collection')}</h2><p className="text-slate-400">{t('collection_sub')}</p></div>{renderGrid()}</div>} />
                    <Route path="/watchlist" element={<div><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('watchlist')}</h2></div>{renderGrid(WatchStatus.TO_WATCH)}</div>} />
                    <Route path="/favorites" element={<div><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('favorites')}</h2></div>{renderGrid()}</div>} />
                    <Route path="/list/:id" element={<ListRoute customLists={customLists} renderGrid={renderGrid} onShare={setSharingList} />} />
                    <Route path="/profile" element={<ProfilePage items={items.filter(i => i.userId === user.id)} />} />
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/guide" element={<GuidePage />} />
                </Routes>
            </main>
        </div>

        {/* FAB AI Button for Mobile (Fixed bottom left) */}
        <AiRecommendationButton items={items.filter(i => i.userId === user.id)} onAdd={handleAdd} apiKey={tmdbKey} />
        
        <ChatBot items={items.filter(i => i.userId === user.id)} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onAdd={handleAdd} apiKey={tmdbKey} onUpdateApiKey={(key) => { localStorage.setItem('tmdb_api_key', key); setTmdbKey(key); }} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} tmdbKey={tmdbKey} omdbKey={omdbKey} onSave={handleSaveSettings} />
        <CreateListModal isOpen={isCreateListOpen} onClose={() => setIsCreateListOpen(false)} onCreate={handleCreateList} />
        
        {sharingList && (
            <ShareModal isOpen={true} onClose={() => setSharingList(null)} list={sharingList} onShare={handleShareList} />
        )}

        {isMobileListsOpen && (
            <div className="fixed inset-0 z-[110] bg-[#0B0E14] p-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Meine Listen</h2>
                    <button onClick={() => setIsMobileListsOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                    <button onClick={() => { navigate('/'); setIsMobileListsOpen(false); }} className="w-full text-left p-4 bg-white/5 rounded-xl text-white font-bold border border-white/10">Alle Filme</button>
                    {myLists.map(l => (
                        <button key={l.id} onClick={() => { navigate(`/list/${l.id}`); setIsMobileListsOpen(false); }} className="w-full text-left p-4 bg-white/5 rounded-xl text-white font-bold border border-white/10">{l.name}</button>
                    ))}
                    {sharedLists.map(l => (
                        <button key={l.id} onClick={() => { navigate(`/list/${l.id}`); setIsMobileListsOpen(false); }} className="w-full text-left p-4 bg-white/5 rounded-xl text-purple-300 font-bold border border-purple-500/20">{l.name} (Geteilt)</button>
                    ))}
                    <button onClick={() => { setIsCreateListOpen(true); setIsMobileListsOpen(false); }} className="w-full p-4 bg-cyan-600/20 text-cyan-400 rounded-xl font-bold border border-cyan-500/30 flex items-center justify-center gap-2"><Plus size={18}/> Neue Liste erstellen</button>
                </div>
            </div>
        )}
        
        {selectedItem && (
            <DetailView 
                item={selectedItem} 
                isExisting={true} 
                onClose={() => setSelectedItem(null)} 
                apiKey={tmdbKey} 
                onUpdateStatus={handleUpdateStatus} 
                onToggleFavorite={handleToggleFavorite} 
                onUpdateNotes={handleUpdateNotes} 
            />
        )}
        
        <MobileNav onSearchClick={() => setIsSearchOpen(true)} onListsClick={() => setIsMobileListsOpen(true)} />
    </div>
  );
}
