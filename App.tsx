import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { SettingsModal } from './components/SettingsModal'; // IMPORT SETTINGS MODAL
import { 
  fetchMediaItems, addMediaItem, updateMediaItemStatus, deleteMediaItem,
  toggleMediaItemFavorite, updateMediaItemRating, updateMediaItemNotes, updateMediaItemRtScore,
  fetchCustomLists, createCustomList, updateCustomListItems, deleteCustomList, shareCustomList
} from './services/db';
import { MediaItem, WatchStatus, SearchResult, CustomList, User, UserRole } from './types';
import { LogOut, Search, Settings, User as UserIcon, List, Heart, Clapperboard, LayoutDashboard, Sun, Moon, Ghost, Download, Plus, X, ChevronDown, Menu } from 'lucide-react';

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
  const { user, logout, isRecoveryMode } = useAuth();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  
  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // NEW STATE FOR SETTINGS
  const [sharingList, setSharingList] = useState<CustomList | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  
  // Desktop Header Menu
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // KEY MANAGEMENT: 
  // Priority: 1. LocalStorage (User Override), 2. Environment (Vercel Default)
  // We read from LS for state, but pass fallback to components
  const [tmdbKey, setTmdbKey] = useState(localStorage.getItem('tmdb_api_key') || process.env.VITE_TMDB_API_KEY || '');
  const [omdbKey, setOmdbKey] = useState(localStorage.getItem('omdb_api_key') || process.env.VITE_OMDB_API_KEY || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('cinelog_gemini_key') || process.env.API_KEY || '');

  // SAFE DERIVED STATE (Moved to top level)
  const myLists = user ? customLists.filter(l => l.ownerId === user.id) : [];
  const sharedLists = user ? customLists.filter(l => l.sharedWith.includes(user.id)) : [];

  // Effects
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Close profile menu on click outside
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
  
  const handleAdd = async (result: SearchResult, status: WatchStatus = WatchStatus.TO_WATCH, isFav: boolean = false) => {
    if (!user) return;

    const existing = items.find(i => i.tmdbId === result.tmdbId && i.userId === user.id);
    if (existing) {
        alert("Bereits in deiner Sammlung!");
        return;
    }

    const newItem: MediaItem = {
        id: crypto.randomUUID(),
        userId: user.id,
        tmdbId: result.tmdbId,
        imdbId: result.imdbId,
        title: result.title,
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
    };

    const saved = await addMediaItem(newItem, user.id);
    if (saved) {
        setItems(prev => [saved, ...prev]);
    }
  };

  const handleUpdateStatus = async (id: string, status: WatchStatus) => {
      await updateMediaItemStatus(id, status);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const handleRate = async (id: string, rating: number) => {
      await updateMediaItemRating(id, rating);
      setItems(prev => prev.map(i => i.id === id ? { ...i, userRating: rating } : i));
  };

  const handleToggleFavorite = async (id: string) => {
      const item = items.find(i => i.id === id);
      if (item) {
          await toggleMediaItemFavorite(id, !item.isFavorite);
          setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Wirklich löschen?")) return;
      await deleteMediaItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setCustomLists(prev => prev.map(l => ({
          ...l,
          items: l.items.filter(itemId => itemId !== id)
      })));
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
      await updateMediaItemNotes(id, notes);
      setItems(prev => prev.map(i => i.id === id ? { ...i, userNotes: notes } : i));
  };
  
  const handleUpdateRtScore = async (id: string, score: string) => {
      await updateMediaItemRtScore(id, score);
      setItems(prev => prev.map(i => i.id === id ? { ...i, rtScore: score } : i));
  };

  const handleCreateList = async (name: string) => {
      if (!user) return;
      const newList: CustomList = {
          id: '',
          ownerId: user.id,
          name,
          createdAt: Date.now(),
          items: [],
          sharedWith: []
      };
      const created = await createCustomList(newList, user.id);
      if (created) setCustomLists(prev => [...prev, created]);
  };

  const handleDeleteList = async (id: string) => {
      if (!confirm(t('delete_list_confirm'))) return;
      await deleteCustomList(id);
      setCustomLists(prev => prev.filter(l => l.id !== id));
  };

  const handleAddToList = async (listId: string, itemId: string) => {
      const list = customLists.find(l => l.id === listId);
      if (!list) return;
      
      let newItems = list.items || [];
      if (newItems.includes(itemId)) {
          newItems = newItems.filter(i => i !== itemId);
      } else {
          newItems = [...newItems, itemId];
      }
      
      await updateCustomListItems(listId, newItems);
      setCustomLists(prev => prev.map(l => l.id === listId ? { ...l, items: newItems } : l));
  };

  const handleShareList = async (listId: string, userIds: string[]) => {
      await shareCustomList(listId, userIds);
      setCustomLists(prev => prev.map(l => l.id === listId ? { ...l, sharedWith: userIds } : l));
  };
  
  // NEW: Centralized Key Save Handler
  const handleSaveKeys = (keys: { tmdb: string, omdb: string, gemini: string }) => {
      // Save to localStorage (empty string means delete/reset to env)
      if (keys.tmdb) localStorage.setItem('tmdb_api_key', keys.tmdb);
      else localStorage.removeItem('tmdb_api_key');

      if (keys.omdb) localStorage.setItem('omdb_api_key', keys.omdb);
      else localStorage.removeItem('omdb_api_key');

      if (keys.gemini) localStorage.setItem('cinelog_gemini_key', keys.gemini);
      else localStorage.removeItem('cinelog_gemini_key');

      // Update State (Fallback to Env if local is empty)
      setTmdbKey(keys.tmdb || process.env.VITE_TMDB_API_KEY || '');
      setOmdbKey(keys.omdb || process.env.VITE_OMDB_API_KEY || '');
      setGeminiKey(keys.gemini || process.env.API_KEY || '');
  };

  const updateSingleKey = (keyName: 'tmdb_api_key', value: string) => {
      // Compatibility for SearchModal
      localStorage.setItem(keyName, value);
      if (keyName === 'tmdb_api_key') setTmdbKey(value);
  };

  const renderGrid = (filterStatus?: WatchStatus, filterListId?: string) => {
      let filtered = items.filter(i => i.userId === user?.id);
      
      if (filterStatus) {
          filtered = filtered.filter(i => i.status === filterStatus);
      }
      if (filterListId) {
          const list = customLists.find(l => l.id === filterListId);
          if (list) {
              filtered = items.filter(i => list.items.includes(i.id));
          }
      }
      if (location.pathname === '/favorites') {
          filtered = filtered.filter(i => i.isFavorite);
      }

      filtered.sort((a, b) => b.addedAt - a.addedAt);

      if (filtered.length === 0) {
          return (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-60">
                  <Ghost size={64} className="mb-4"/>
                  <p>{t('empty_state')}</p>
                  <button onClick={() => setIsSearchOpen(true)} className="mt-4 text-cyan-400 hover:text-cyan-300 font-bold">
                      {t('empty_action')}
                  </button>
              </div>
          );
      }

      return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-20 md:pb-0">
              {filtered.map(item => (
                  <MediaCard 
                      key={item.id} 
                      item={item} 
                      onStatusChange={handleUpdateStatus}
                      onDelete={handleDelete}
                      onToggleFavorite={handleToggleFavorite}
                      onRate={handleRate}
                      onClick={setSelectedItem}
                      customLists={customLists.filter(l => l.ownerId === user?.id)}
                      onAddToList={handleAddToList}
                  />
              ))}
          </div>
      );
  };

  if (isRecoveryMode) return <RecoveryPage />;
  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col z-30">
        <div className="p-6">
           <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
              <Clapperboard className="text-cyan-400" /> InFocus CineLog
           </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            <div onClick={() => navigate('/')} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${location.pathname === '/' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <LayoutDashboard size={20} />
                <span className="font-medium">{t('collection')}</span>
            </div>
            <div onClick={() => navigate('/watchlist')} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${location.pathname === '/watchlist' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <List size={20} />
                <span className="font-medium">{t('watchlist')}</span>
            </div>
            <div onClick={() => navigate('/favorites')} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${location.pathname === '/favorites' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <Heart size={20} />
                <span className="font-medium">{t('favorites')}</span>
            </div>

            <div className="pt-6 pb-2 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>{t('my_lists')}</span>
                <button onClick={() => setIsCreateListOpen(true)} className="hover:text-white"><Plus size={14}/></button>
            </div>
            {myLists.map(list => (
                <div key={list.id} className="group flex items-center justify-between px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800/50 cursor-pointer">
                    <span onClick={() => navigate(`/list/${list.id}`)} className="truncate flex-grow">{list.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Settings size={14} onClick={() => setSharingList(list)} className="hover:text-cyan-400" />
                        <X size={14} onClick={() => handleDeleteList(list.id)} className="hover:text-red-400" />
                    </div>
                </div>
            ))}
            {sharedLists.length > 0 && (
                <>
                    <div className="pt-6 pb-2 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('shared_with')}</div>
                    {sharedLists.map(list => (
                         <div key={list.id} onClick={() => navigate(`/list/${list.id}`)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800/50 cursor-pointer flex items-center gap-2">
                             <UserIcon size={14}/> <span className="truncate">{list.name}</span>
                         </div>
                    ))}
                </>
            )}

            {(user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && (
                 <div onClick={() => navigate('/users')} className={`mt-6 flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${location.pathname === '/users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                    <UserIcon size={20} />
                    <span className="font-medium">{t('manage_users')}</span>
                </div>
            )}
        </nav>

        <AiRecommendationButton 
            items={items.filter(i => i.userId === user.id)}
            onAdd={handleAdd}
            apiKey={tmdbKey}
        />

        {/* SIDEBAR FOOTER (Small) */}
        <div className="p-4 border-t border-slate-800">
            <button onClick={() => navigate('/profile')} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer w-full text-left">
                <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-1 text-slate-400"/>}
                </div>
                <div className="flex-grow overflow-hidden">
                    <div className="text-sm font-bold text-white truncate">{user.username}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                </div>
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="md:ml-64 p-4 md:p-8 min-h-screen">
        
        {/* MOBILE HEADER */}
        <div className="md:hidden flex justify-between items-center mb-6">
             <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
                <Clapperboard className="text-cyan-400" size={24} /> InFocus CineLog
             </h1>
             <div className="flex gap-4">
                <button onClick={() => setIsSearchOpen(true)} className="text-white"><Search size={24}/></button>
                <div onClick={() => setIsMobileMenuOpen(true)} className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-1 text-slate-400" />}
                </div>
             </div>
        </div>

        {/* DESKTOP HEADER WITH PROFILE MENU */}
        <div className="hidden md:flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-900/20 transition-all hover:scale-105 font-medium"
                 >
                    <Plus size={18} /> {t('add_button')}
                 </button>
                 <button 
                    onClick={() => setIsImportOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all font-medium"
                 >
                    <Download size={18} /> Import
                 </button>
            </div>

            {/* Top Right Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
                <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-full pl-4 pr-2 py-1.5 border border-slate-700 transition-colors"
                >
                    <span className="text-sm font-bold text-white">{user.username}</span>
                    <div className="w-8 h-8 rounded-full bg-slate-600 overflow-hidden">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-1 text-slate-400" />}
                    </div>
                    <ChevronDown size={16} className="text-slate-400" />
                </button>

                {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 z-50">
                        <div className="p-3 border-b border-slate-700">
                            <p className="text-xs text-slate-500 uppercase font-bold">Account</p>
                            <p className="text-sm text-white truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                            <button onClick={() => { navigate('/profile'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg">
                                <UserIcon size={16} /> {t('profile')}
                            </button>
                            {/* FIXED: Open Modal instead of prompt */}
                            <button onClick={() => { 
                                 setIsSettingsOpen(true);
                                 setIsProfileMenuOpen(false);
                            }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg">
                                <Settings size={16} /> API Keys
                            </button>
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg">
                                {theme === 'dark' ? <Moon size={16}/> : <Sun size={16}/>} Theme: {theme}
                            </button>
                        </div>
                        <div className="p-2 border-t border-slate-700">
                            <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">
                                <LogOut size={16} /> {t('logout')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* STATS COMPONENT */}
        {location.pathname === '/' && <Stats items={items.filter(i => i.userId === user?.id)} />}

        <Routes>
          <Route path="/" element={renderGrid()} />
          <Route path="/watchlist" element={renderGrid(WatchStatus.TO_WATCH)} />
          <Route path="/favorites" element={renderGrid()} />
          <Route path="/profile" element={<ProfilePage items={items.filter(i => i.userId === user?.id)} />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/list/:id" element={<ListRoute customLists={customLists} renderGrid={renderGrid} />} />
        </Routes>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <MobileNav 
        onSearchClick={() => setIsSearchOpen(true)} 
        onListsClick={() => setIsMobileMenuOpen(true)}
      />
      
      {/* MOBILE MENU OVERLAY (INLINED) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end md:hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            
            {/* Sheet */}
            <div className="relative bg-slate-900 border-t border-slate-700 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto custom-scrollbar pb-safe">
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6"></div>
                
                <div className="space-y-6">
                    {/* User Profile Section */}
                    <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50" onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}>
                        <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-2 text-slate-400 w-full h-full"/>}
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-white font-bold text-lg">{user?.username}</h3>
                            <p className="text-slate-400 text-sm">{user?.email}</p>
                        </div>
                        <Settings size={20} className="text-slate-500" />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { setIsImportOpen(true); setIsMobileMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors">
                            <Download size={24} className="text-cyan-400" />
                            <span className="text-xs font-bold">Import</span>
                        </button>
                        {/* FIXED: Open Modal here too */}
                        <button onClick={() => { 
                             setIsSettingsOpen(true);
                             setIsMobileMenuOpen(false);
                        }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors">
                             <Settings size={24} className="text-purple-400" />
                             <span className="text-xs font-bold">API Keys</span>
                        </button>
                    </div>

                    {/* Lists Section */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('my_lists')}</h4>
                            <button onClick={() => { setIsCreateListOpen(true); setIsMobileMenuOpen(false); }} className="bg-slate-800 p-1.5 rounded-lg text-slate-400 hover:text-white"><Plus size={16}/></button>
                        </div>
                        <div className="space-y-2">
                            {myLists.length === 0 ? (
                                <div className="text-center py-4 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded-xl">Keine Listen vorhanden</div>
                            ) : (
                                myLists.map(list => (
                                    <div key={list.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700" onClick={() => { navigate(`/list/${list.id}`); setIsMobileMenuOpen(false); }}>
                                        <span className="text-slate-200 font-medium">{list.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">{list.items.length}</span>
                                            <Settings size={16} className="text-slate-500" onClick={(e) => { e.stopPropagation(); setSharingList(list); setIsMobileMenuOpen(false); }} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    {/* Shared Lists */}
                    {sharedLists.length > 0 && (
                        <div>
                             <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('shared_with')}</h4>
                             <div className="space-y-2">
                                {sharedLists.map(list => (
                                    <div key={list.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50" onClick={() => { navigate(`/list/${list.id}`); setIsMobileMenuOpen(false); }}>
                                        <div className="flex items-center gap-2">
                                            <UserIcon size={14} className="text-cyan-400"/>
                                            <span className="text-slate-300 font-medium">{list.name}</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {/* Admin Links */}
                    {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
                         <button 
                            onClick={() => { navigate('/users'); setIsMobileMenuOpen(false); }}
                            className="w-full flex items-center gap-3 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl text-indigo-300"
                        >
                            <UserIcon size={20} />
                            <span className="font-bold">{t('manage_users')}</span>
                         </button>
                    )}

                    {/* Theme & Logout */}
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex-1 py-3 bg-slate-800 rounded-xl text-slate-300 flex items-center justify-center gap-2">
                            {theme === 'dark' ? <Moon size={18}/> : <Sun size={18}/>}
                            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                        </button>
                        <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex-1 py-3 bg-red-900/20 text-red-400 rounded-xl flex items-center justify-center gap-2 border border-red-900/30">
                            <LogOut size={18}/>
                            <span>{t('logout')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* OTHER COMPONENTS */}
      <ChatBot items={items.filter(i => i.userId === user.id)} />
      
      <AiRecommendationButton 
        items={items.filter(i => i.userId === user.id)}
        onAdd={handleAdd}
        apiKey={tmdbKey}
        mobileFabOnly={true}
      />

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)}
        onAdd={handleAdd}
        apiKey={tmdbKey}
        onUpdateApiKey={(key) => updateSingleKey('tmdb_api_key', key)} 
      />
      
      {/* SETTINGS MODAL: Passed both local value and save handler */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tmdbKey={localStorage.getItem('tmdb_api_key') || ''}
        omdbKey={localStorage.getItem('omdb_api_key') || ''}
        geminiKey={localStorage.getItem('cinelog_gemini_key') || ''}
        onSave={handleSaveKeys}
      />
      
      <ImportModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={(results) => {
            results.forEach(r => handleAdd(r, WatchStatus.TO_WATCH));
        }}
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
            onClose={() => setViewingProfile(null)}
            allLists={customLists}
            allItems={items}
          />
      )}
    </div>
  );
}