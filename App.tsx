
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MediaItem, WatchStatus, MediaType, SearchResult, SortOption, CustomList } from './types';
import { MediaCard } from './components/MediaCard';
import { SearchModal } from './components/SearchModal';
import { DetailView } from './components/DetailView';
import { Stats } from './components/Stats';
import { AuthPage } from './components/AuthPage';
import { ProfilePage } from './components/ProfilePage';
import { MobileNav } from './components/MobileNav';
import { CreateListModal } from './components/CreateListModal';
import { ShareModal } from './components/ShareModal';
import { ImportModal } from './components/ImportModal';
import { ChatBot } from './components/ChatBot';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getRecommendations } from './services/gemini';
import { getTMDBTrending, getMediaDetails } from './services/tmdb';
import { LayoutDashboard, Film, CheckCircle, Plus, Sparkles, Tv, Clapperboard, MonitorPlay, Settings, Key, Loader2, Heart, ArrowUpDown, ChevronDown, LogOut, Languages, List, PlusCircle, Share2, Trash2, ListPlus, X, User as UserIcon, Download, Upload, Save, FileText, Database } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'cinelog_items';
const CUSTOM_LISTS_KEY = 'cinelog_custom_lists';
const API_KEY_STORAGE_KEY = 'cinelog_tmdb_key';
const OMDB_KEY_STORAGE_KEY = 'cinelog_omdb_key';
const USERS_STORAGE_KEY = 'cinelog_users_db'; // Defined in AuthContext but needed here for backup
const DEFAULT_TMDB_KEY = '4115939bdc412c5f7b0c4598fcf29b77';
const DEFAULT_OMDB_KEY = '33df5dc9';

// Helper to generate a random dark pastel color
const getRandomColor = () => {
  const hues = [200, 220, 260, 280, 320, 180];
  const hue = hues[Math.floor(Math.random() * hues.length)];
  return `hsl(${hue}, 40%, 30%)`;
};

const AppContent: React.FC = () => {
  const { user, logout, isAuthenticated, getAllUsers } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Modals
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [shareList, setShareList] = useState<CustomList | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.DATE_ADDED);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  
  // Viewing Detail State
  const [viewingItem, setViewingItem] = useState<MediaItem | null>(null);

  // Settings
  const [tmdbApiKey, setTmdbApiKey] = useState(DEFAULT_TMDB_KEY);
  const [tempApiKey, setTempApiKey] = useState(DEFAULT_TMDB_KEY);
  const [omdbApiKey, setOmdbApiKey] = useState(DEFAULT_OMDB_KEY);
  const [tempOmdbKey, setTempOmdbKey] = useState(DEFAULT_OMDB_KEY);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Load Data
  useEffect(() => {
    if (!isAuthenticated) return;

    const savedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedItems) {
      try { setItems(JSON.parse(savedItems)); } catch (e) { console.error(e); }
    }

    const savedLists = localStorage.getItem(CUSTOM_LISTS_KEY);
    if (savedLists) {
        try { setCustomLists(JSON.parse(savedLists)); } catch (e) { console.error(e); }
    }

    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setTmdbApiKey(savedKey);
      setTempApiKey(savedKey);
    }
    
    const savedOmdbKey = localStorage.getItem(OMDB_KEY_STORAGE_KEY);
    if (savedOmdbKey) {
        setOmdbApiKey(savedOmdbKey);
        setTempOmdbKey(savedOmdbKey);
    }
  }, [isAuthenticated]);

  // PWA Install Event Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Save Data
  useEffect(() => {
    if (isAuthenticated) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
        localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(customLists));
    }
  }, [customLists, isAuthenticated]);

  const saveSettings = () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, tempApiKey);
    setTmdbApiKey(tempApiKey);
    
    localStorage.setItem(OMDB_KEY_STORAGE_KEY, tempOmdbKey);
    setOmdbApiKey(tempOmdbKey);
    
    setIsSettingsOpen(false);
  };

  // --- BACKUP & RESTORE ---
  const handleExportData = () => {
    const data = {
        items: localStorage.getItem(LOCAL_STORAGE_KEY),
        customLists: localStorage.getItem(CUSTOM_LISTS_KEY),
        users: localStorage.getItem(USERS_STORAGE_KEY),
        apiKey: localStorage.getItem(API_KEY_STORAGE_KEY),
        omdbKey: localStorage.getItem(OMDB_KEY_STORAGE_KEY),
        timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinelog_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            
            if (data.items) localStorage.setItem(LOCAL_STORAGE_KEY, data.items);
            if (data.customLists) localStorage.setItem(CUSTOM_LISTS_KEY, data.customLists);
            if (data.users) localStorage.setItem(USERS_STORAGE_KEY, data.users);
            if (data.apiKey) localStorage.setItem(API_KEY_STORAGE_KEY, data.apiKey);
            if (data.omdbKey) localStorage.setItem(OMDB_KEY_STORAGE_KEY, data.omdbKey);
            
            alert("Daten erfolgreich importiert! Die Seite wird neu geladen.");
            window.location.reload();
        } catch (error) {
            alert("Fehler beim Importieren der Datei. Ungültiges Format.");
            console.error(error);
        }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Add item (Single or Batch)
  const addItem = async (result: SearchResult, status: WatchStatus = WatchStatus.TO_WATCH, isFav: boolean = false) => {
    setIsAdding(true);
    
    try {
        const details = await getMediaDetails(result, tmdbApiKey);
        const newItem: MediaItem = {
          ...result,
          ...details,
          id: crypto.randomUUID(),
          status: status,
          addedAt: Date.now(),
          posterColor: getRandomColor(),
          isFavorite: isFav,
          userRating: 0,
          userNotes: result.customNotes // Use notes from import if available
        };
        setItems(prev => [newItem, ...prev]);
    } catch (e) {
        console.error("Failed to add item", e);
        const newItem: MediaItem = {
          ...result,
          id: crypto.randomUUID(),
          status: status,
          addedAt: Date.now(),
          posterColor: getRandomColor(),
          isFavorite: isFav,
          userRating: 0,
          userNotes: result.customNotes
        };
        setItems(prev => [newItem, ...prev]);
    } finally {
        setIsAdding(false);
    }
  };
  
  // Smart Batch Import
  const handleBatchImport = async (results: SearchResult[]) => {
      // Add all items sequentially
      for (const result of results) {
          await addItem(result);
      }
  };

  // --- CUSTOM LISTS LOGIC ---
  const createList = (name: string) => {
      if (!user) return;
      const newList: CustomList = {
          id: crypto.randomUUID(),
          name,
          ownerId: user.id,
          createdAt: Date.now(),
          items: [],
          sharedWith: []
      };
      setCustomLists(prev => [...prev, newList]);
      navigate(`/lists/${newList.id}`);
  };

  const deleteList = (listId: string) => {
      if (window.confirm(t('delete_list_confirm'))) {
          setCustomLists(prev => prev.filter(l => l.id !== listId));
          navigate('/');
      }
  };

  const addToList = (listId: string, itemId: string) => {
      setCustomLists(prev => prev.map(list => {
          if (list.id === listId && !list.items.includes(itemId)) {
              return { ...list, items: [...list.items, itemId] };
          }
          return list;
      }));
  };

  const removeFromList = (listId: string, itemId: string) => {
      setCustomLists(prev => prev.map(list => {
          if (list.id === listId) {
              return { ...list, items: list.items.filter(i => i !== itemId) };
          }
          return list;
      }));
  };

  const shareListWithUsers = (listId: string, userIds: string[]) => {
      setCustomLists(prev => prev.map(list => {
          if (list.id === listId) {
              return { ...list, sharedWith: userIds };
          }
          return list;
      }));
  };

  // --- EXISTING LOGIC ---
  const updateStatus = (id: string, status: WatchStatus) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  const toggleFavorite = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
  };

  const rateItem = (id: string, rating: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, userRating: rating } : item));
  };
  
  const updateNotes = (id: string, notes: string) => {
      setItems(prev => prev.map(item => item.id === id ? { ...item, userNotes: notes } : item));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    // Also remove from custom lists
    setCustomLists(prev => prev.map(list => ({
        ...list,
        items: list.items.filter(itemId => itemId !== id)
    })));
  };

  const handleRecommendation = async () => {
    setLoadingRecs(true);
    
    // Pass full items array for Hybrid Filtering analysis
    if (items.length === 0 && tmdbApiKey) {
        const trending = await getTMDBTrending(tmdbApiKey);
        setRecommendations(trending);
    } else {
        const recs = await getRecommendations(items);
        setRecommendations(recs);
    }
    setLoadingRecs(false);
  };

  const getFilteredItems = (status?: WatchStatus) => {
    let filtered = items;
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    } else if (location.pathname === '/favorites') {
        filtered = filtered.filter(item => item.isFavorite);
    }

    return filtered.sort((a, b) => {
        switch (sortBy) {
            case SortOption.DATE_ADDED: return b.addedAt - a.addedAt;
            case SortOption.RATING: return b.rating - a.rating;
            case SortOption.YEAR: return b.year - a.year;
            case SortOption.TITLE: return a.title.localeCompare(b.title);
            default: return 0;
        }
    });
  };

  // Render Component for Custom Lists
  const CustomListView = () => {
      const { id } = useParams();
      const list = customLists.find(l => l.id === id);
      const allUsers = getAllUsers();

      if (!list) return <div className="p-8 text-slate-400">Liste nicht gefunden.</div>;
      
      const listItems = items.filter(item => list.items.includes(item.id));
      const owner = allUsers.find(u => u.id === list.ownerId);

      return (
          <div className="pb-20 md:pb-0">
             <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
                 <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        {list.name}
                        {list.ownerId !== user?.id && <span className="text-xs bg-slate-700 px-2 py-1 rounded-full font-normal text-slate-300">{t('shared_by')} {owner?.username}</span>}
                    </h2>
                    <p className="text-slate-400">
                        {listItems.length} {t('items_count')}
                    </p>
                    {list.sharedWith.length > 0 && list.ownerId === user?.id && (
                        <div className="flex -space-x-2 mt-2">
                             {list.sharedWith.map(uid => {
                                 const u = allUsers.find(au => au.id === uid);
                                 return u ? (
                                    <div key={uid} className="w-6 h-6 rounded-full border border-slate-900 bg-slate-700 overflow-hidden" title={u.username}>
                                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : <span className="text-[8px] flex items-center justify-center h-full">{u.username[0]}</span>}
                                    </div>
                                 ) : null;
                             })}
                        </div>
                    )}
                 </div>
                 
                 <div className="flex gap-2 w-full md:w-auto">
                    {list.ownerId === user?.id && (
                        <>
                            <button 
                                onClick={() => setShareList(list)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition-colors"
                            >
                                <Share2 size={18} /> {t('share')}
                            </button>
                            <button 
                                onClick={() => deleteList(list.id)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                            >
                                <Trash2 size={18} /> {t('delete_list')}
                            </button>
                        </>
                    )}
                 </div>
             </header>

             {listItems.length === 0 ? (
                <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                    <List size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t('empty_state')}</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listItems.map(item => (
                        <div key={item.id} className="relative group">
                             <MediaCard 
                                item={item} 
                                onStatusChange={updateStatus}
                                onDelete={(itemId) => {
                                    if(list.ownerId === user?.id) {
                                        removeFromList(list.id, itemId);
                                    }
                                }}
                                onToggleFavorite={toggleFavorite}
                                onRate={rateItem}
                                onClick={(i) => setViewingItem(i)}
                                customLists={customLists.filter(l => l.ownerId === user?.id)}
                                onAddToList={addToList}
                            />
                        </div>
                    ))}
                </div>
             )}
          </div>
      );
  };

  const renderGrid = (status?: WatchStatus) => {
    const filteredAndSorted = getFilteredItems(status);
    
    if (filteredAndSorted.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl mx-4 md:mx-0">
           <Film size={48} className="mb-4 opacity-20" />
           <p className="text-lg">{t('empty_state')}</p>
           {!status && location.pathname !== '/favorites' && <button onClick={() => setIsSearchOpen(true)} className="mt-4 text-cyan-400 hover:underline">{t('empty_action')}</button>}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 md:pb-0">
        {filteredAndSorted.map(item => (
          <MediaCard 
            key={item.id} 
            item={item} 
            onStatusChange={updateStatus}
            onDelete={deleteItem}
            onToggleFavorite={toggleFavorite}
            onRate={rateItem}
            onClick={(i) => setViewingItem(i)}
            customLists={customLists.filter(l => l.ownerId === user?.id)}
            onAddToList={addToList}
          />
        ))}
      </div>
    );
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-cyan-500/10 text-cyan-400 font-medium' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );

  // --- AUTH CHECK ---
  if (!isAuthenticated) {
      return <AuthPage />;
  }

  // --- UI ---
  const myCustomLists = customLists.filter(l => l.ownerId === user?.id);
  const sharedLists = customLists.filter(l => l.sharedWith.includes(user?.id || ''));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col sticky top-0 h-screen z-20">
        <div className="p-6 flex items-center justify-between text-cyan-400">
           <div className="flex items-center gap-2">
             <Clapperboard size={28} />
             <h1 className="text-2xl font-bold tracking-tight text-white">CineLog</h1>
           </div>
           <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-slate-500 hover:text-white transition-colors" title={t('settings')}>
              <Settings size={20} />
           </button>
        </div>

        {/* User Profile Mini Snippet */}
        {user && (
            <div 
                className="mx-6 mb-6 flex items-center gap-3 pb-6 border-b border-slate-800 cursor-pointer group"
                onClick={() => navigate('/profile')}
            >
                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600 group-hover:border-cyan-500 transition-colors">
                    {user.avatar ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover"/> : null}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{user.username}</div>
                    <div className="text-xs text-slate-500 truncate">{t('edit_profile')}</div>
                </div>
            </div>
        )}

        {/* Settings Panel */}
        {isSettingsOpen && (
            <div className="mx-4 mb-4 p-4 bg-slate-800 rounded-xl border border-slate-700 animate-in slide-in-from-top-2">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <Key size={12} /> TMDB API Key
                </h4>
                <input 
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="TMDB Key..."
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white mb-2 focus:border-cyan-500 focus:outline-none"
                />

                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2 mt-3">
                    <Database size={12} /> OMDb API Key
                </h4>
                <input 
                    type="password"
                    value={tempOmdbKey}
                    onChange={(e) => setTempOmdbKey(e.target.value)}
                    placeholder="OMDb Key..."
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white mb-2 focus:border-cyan-500 focus:outline-none"
                />
                
                <button 
                    onClick={saveSettings}
                    className="w-full py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded font-medium transition-colors mb-4"
                >
                    {t('remember')}
                </button>

                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <Languages size={12} /> {t('language')}
                </h4>
                <div className="flex gap-2 mb-4">
                     <button 
                        onClick={() => setLanguage('de')}
                        className={`flex-1 py-1 text-xs rounded border ${language === 'de' ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-700 text-slate-400'}`}
                     >DE</button>
                     <button 
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-1 text-xs rounded border ${language === 'en' ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-700 text-slate-400'}`}
                     >EN</button>
                </div>
                
                {/* Backup / Restore Controls */}
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <Save size={12} /> Backup
                </h4>
                <div className="space-y-2">
                    <button 
                        onClick={handleExportData}
                        className="w-full py-1.5 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs transition-colors border border-slate-600"
                    >
                        <Download size={12} /> Daten sichern
                    </button>
                    <button 
                        onClick={handleImportClick}
                        className="w-full py-1.5 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs transition-colors border border-slate-600"
                    >
                        <Upload size={12} /> Daten wiederherstellen
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".json" />
                </div>
                
                {/* Import Text Button */}
                <button 
                    onClick={() => { setIsSettingsOpen(false); setIsImportOpen(true); }}
                    className="w-full mt-2 py-1.5 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-cyan-400 rounded text-xs transition-colors border border-slate-600"
                >
                    <FileText size={12} /> {t('smart_import')}
                </button>

                {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick}
                    className="w-full mt-4 py-1.5 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs transition-colors"
                  >
                    <Download size={12} /> App installieren
                  </button>
                )}

                <button 
                    onClick={logout}
                    className="w-full mt-4 py-1.5 flex items-center justify-center gap-2 text-red-400 hover:bg-red-400/10 rounded text-xs transition-colors"
                >
                    <LogOut size={12} /> {t('logout')}
                </button>
            </div>
        )}

        <nav className="flex-grow px-4 space-y-1 overflow-y-auto pb-4 custom-scrollbar">
          <NavItem to="/" icon={LayoutDashboard} label={t('overview')} />
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('my_lists')}</div>
          <NavItem to="/watchlist" icon={MonitorPlay} label={t('planned')} />
          <NavItem to="/watching" icon={Tv} label={t('watching')} />
          <NavItem to="/watched" icon={CheckCircle} label={t('seen')} />
          <NavItem to="/favorites" icon={Heart} label={t('favorites')} />
          
          {/* Custom Lists Section */}
          <div className="pt-4 pb-2 px-4 flex items-center justify-between group cursor-pointer">
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('custom_lists')}</span>
             <button onClick={() => setIsCreateListOpen(true)} className="text-slate-500 hover:text-cyan-400 transition-colors">
                <PlusCircle size={14} />
             </button>
          </div>
          {myCustomLists.map(list => (
              <NavItem key={list.id} to={`/lists/${list.id}`} icon={List} label={list.name} />
          ))}

          {sharedLists.length > 0 && (
             <>
                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('shared_with')}</div>
                {sharedLists.map(list => (
                    <NavItem key={list.id} to={`/lists/${list.id}`} icon={Share2} label={list.name} />
                ))}
             </>
          )}

          <div className="pt-6">
            <button 
              onClick={() => setIsSearchOpen(true)}
              disabled={isAdding}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-wait"
            >
              {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              <span>{isAdding ? t('generating') : t('add_button')}</span>
            </button>
          </div>
        </nav>

        {/* Mini Recommendation Widget */}
        <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
               <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    {t('ai_tip')}
                  </h4>
                  <button onClick={handleRecommendation} disabled={loadingRecs} className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50">
                    {loadingRecs ? '...' : t('new_rec')}
                  </button>
               </div>
               {recommendations.length > 0 ? (
                 <div className="space-y-3">
                    {recommendations.slice(0, 1).map((rec, i) => (
                      <div key={i} className="text-xs">
                        <div className="font-medium text-slate-200">{rec.title}</div>
                        <div className="text-slate-500 mt-1 line-clamp-2">{rec.plot}</div>
                        <button 
                          onClick={() => { addItem(rec); setRecommendations([]); }}
                          className="mt-2 w-full py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                        >
                          + {t('remember')}
                        </button>
                      </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-xs text-slate-500">
                   {t('empty_action')}
                 </p>
               )}
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto h-screen scroll-smooth">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
             <div className="flex items-center gap-2 text-cyan-400">
                 <Clapperboard size={24} />
                 <h1 className="text-xl font-bold text-white">CineLog</h1>
             </div>
             
             <div className="flex gap-4">
                 <button onClick={() => navigate('/profile')} className="text-slate-400 hover:text-white">
                    <UserIcon size={24} />
                 </button>
                 <button onClick={() => setIsCreateListOpen(true)} className="text-slate-400 hover:text-white">
                    <ListPlus size={24} />
                 </button>
                 <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-slate-400 hover:text-white">
                    <Settings size={24} />
                 </button>
             </div>
        </div>

        {/* Hidden Trigger for Mobile Menu (List view shortcut) */}
        <button id="mobile-menu-trigger" className="hidden" onClick={() => setIsCreateListOpen(true)}></button>

        {/* Mobile Settings Modal Overlay */}
        {isSettingsOpen && (
             <div className="md:hidden fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm p-6 flex flex-col justify-center animate-in fade-in">
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
                      <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-slate-400"><LogOut className="opacity-0" size={0} /><X size={24} /></button>
                      <h3 className="text-lg font-bold text-white mb-4">{t('settings')}</h3>
                      
                      {/* Mobile Settings Content Copy */}
                      <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">API Key (TMDB)</h4>
                                <input 
                                    type="password"
                                    value={tempApiKey}
                                    onChange={(e) => setTempApiKey(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">API Key (OMDb)</h4>
                                <input 
                                    type="password"
                                    value={tempOmdbKey}
                                    onChange={(e) => setTempOmdbKey(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{t('language')}</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => setLanguage('de')} className={`flex-1 py-2 rounded ${language === 'de' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}>DE</button>
                                    <button onClick={() => setLanguage('en')} className={`flex-1 py-2 rounded ${language === 'en' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}>EN</button>
                                </div>
                            </div>
                            
                            {/* Mobile Backup & Import */}
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handleExportData}
                                    className="w-full py-2 bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600"
                                >
                                    <Download size={14} /> Sichern
                                </button>
                                <button 
                                    onClick={handleImportClick}
                                    className="w-full py-2 bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600"
                                >
                                    <Upload size={14} /> Import
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => { setIsSettingsOpen(false); setIsImportOpen(true); }}
                                className="w-full py-2 bg-slate-700 text-cyan-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600"
                            >
                                <FileText size={14} /> {t('smart_import')}
                            </button>

                            {deferredPrompt && (
                              <button onClick={handleInstallClick} className="w-full py-3 bg-green-600 rounded-xl text-white font-bold flex items-center justify-center gap-2">
                                <Download size={18} /> App installieren
                              </button>
                            )}

                            <button onClick={saveSettings} className="w-full py-3 bg-cyan-600 rounded-xl text-white font-bold">{t('remember')}</button>
                            <button onClick={logout} className="w-full py-3 text-red-400 border border-red-900/50 bg-red-500/10 rounded-xl font-bold">{t('logout')}</button>
                      </div>
                  </div>
             </div>
        )}

        {/* Breadcrumb/Header logic for non-custom lists */}
        {!location.pathname.startsWith('/lists/') && location.pathname !== '/profile' && (
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                {location.pathname === '/' ? t('collection') : 
                    location.pathname === '/watchlist' ? t('planned') :
                    location.pathname === '/watching' ? t('watching') : 
                    location.pathname === '/favorites' ? t('favorites') : t('seen')}
                </h2>
                <p className="text-slate-400 text-sm md:text-base">
                {location.pathname === '/' ? t('collection_sub') : 
                    location.pathname === '/favorites' ? t('fav_sub') :
                    `${getFilteredItems(
                    location.pathname === '/watchlist' ? WatchStatus.TO_WATCH :
                    location.pathname === '/watching' ? WatchStatus.WATCHING : 
                    location.pathname === '/watched' ? WatchStatus.WATCHED : undefined
                    ).length} ${t('list_count')}`}
                </p>
            </div>

            {/* SORT DROPDOWN */}
            <div className="relative self-end sm:self-auto">
                <button 
                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
                >
                    <ArrowUpDown size={16} />
                    <span className="hidden sm:inline">
                        {sortBy === SortOption.DATE_ADDED && t('sort_latest')}
                        {sortBy === SortOption.RATING && t('sort_rating')}
                        {sortBy === SortOption.YEAR && t('sort_year')}
                        {sortBy === SortOption.TITLE && t('sort_title')}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-150">
                        {[
                            { label: t('sort_latest'), value: SortOption.DATE_ADDED },
                            { label: t('sort_rating'), value: SortOption.RATING },
                            { label: t('sort_year'), value: SortOption.YEAR },
                            { label: t('sort_title'), value: SortOption.TITLE },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { setSortBy(opt.value); setIsSortMenuOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${sortBy === opt.value ? 'text-cyan-400 bg-slate-700/50' : 'text-slate-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            </header>
        )}

        {location.pathname === '/' && <Stats items={items} />}

        <Routes>
          <Route path="/" element={renderGrid()} />
          <Route path="/watchlist" element={renderGrid(WatchStatus.TO_WATCH)} />
          <Route path="/watching" element={renderGrid(WatchStatus.WATCHING)} />
          <Route path="/watched" element={renderGrid(WatchStatus.WATCHED)} />
          <Route path="/favorites" element={renderGrid()} />
          <Route path="/lists/:id" element={<CustomListView />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
      
      {/* Mobile Navigation Bar */}
      <MobileNav onSearchClick={() => setIsSearchOpen(true)} />

      {/* CHATBOT */}
      <ChatBot items={items} />

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onAdd={addItem} 
        apiKey={tmdbApiKey}
      />
      
      <CreateListModal 
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreate={createList}
      />
      
      <ImportModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBatchImport}
        apiKey={tmdbApiKey}
        omdbApiKey={omdbApiKey}
      />

      {shareList && (
        <ShareModal 
            isOpen={!!shareList}
            onClose={() => setShareList(null)}
            list={shareList}
            onShare={shareListWithUsers}
        />
      )}

      {viewingItem && (
          <DetailView 
            item={viewingItem}
            isExisting={true}
            apiKey={tmdbApiKey}
            onClose={() => setViewingItem(null)}
            onUpdateStatus={updateStatus}
            onToggleFavorite={toggleFavorite}
            onUpdateNotes={updateNotes}
          />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
