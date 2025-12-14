import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MediaItem, WatchStatus, MediaType, SearchResult, SortOption, CustomList, UserRole, User } from './types';
import { MediaCard } from './components/MediaCard';
import { SearchModal } from './components/SearchModal';
import { DetailView } from './components/DetailView';
import { Stats } from './components/Stats';
import { AuthPage } from './components/AuthPage';
import { RecoveryPage } from './components/RecoveryPage';
import { ProfilePage } from './components/ProfilePage';
import { GuidePage } from './components/GuidePage';
import { UserManagementPage } from './components/UserManagementPage'; // Import new component
import { MobileNav } from './components/MobileNav';
import { CreateListModal } from './components/CreateListModal';
import { ShareModal } from './components/ShareModal';
import { ImportModal } from './components/ImportModal';
import { ChatBot } from './components/ChatBot';
import { AiRecommendationButton } from './components/AiRecommendationButton';
import { PublicProfileModal } from './components/PublicProfileModal';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { getMediaDetails } from './services/tmdb';
import { getOmdbRatings } from './services/omdb';
import { testGeminiConnection } from './services/gemini';
import * as db from './services/db';
import { LayoutDashboard, Film, CheckCircle, Plus, Sparkles, Tv, Clapperboard, MonitorPlay, Settings, Key, Loader2, Heart, ArrowUpDown, ChevronDown, LogOut, Languages, List, PlusCircle, Share2, Trash2, ListPlus, X, User as UserIcon, Download, Upload, Save, FileText, Database, ShieldAlert, CloudUpload, Moon, Sun, Smartphone, BellRing, BookOpen, Shield, Zap, ExternalLink } from 'lucide-react';

const API_KEY_STORAGE_KEY = 'cinelog_tmdb_key';
const OMDB_KEY_STORAGE_KEY = 'cinelog_omdb_key';
const GEMINI_KEY_STORAGE_KEY = 'cinelog_gemini_key';
const SEEN_LISTS_STORAGE_KEY = 'cinelog_seen_lists'; // New: Store IDs of seen lists
const DEFAULT_TMDB_KEY = '4115939bdc412c5f7b0c4598fcf29b77';
const DEFAULT_OMDB_KEY = '33df5dc9';

// Legacy keys for migration
const LEGACY_LOCAL_STORAGE_KEY = 'cinelog_items';

const getRandomColor = () => {
  const hues = [200, 220, 260, 280, 320, 180];
  const hue = hues[Math.floor(Math.random() * hues.length)];
  return `hsl(${hue}, 40%, 30%)`;
};

const NavItem: React.FC<{ to: string; icon: any; label: string; isNew?: boolean }> = ({ to, icon: Icon, label, isNew }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-cyan-500/10 text-cyan-400 font-medium' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`
    }
  >
    <div className="flex items-center gap-3">
        <Icon size={20} className={isNew ? 'text-cyan-400 animate-pulse' : ''} />
        <span>{label}</span>
    </div>
    {isNew && (
        <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
        </span>
    )}
  </NavLink>
);

const AppContent: React.FC = () => {
  const { user, logout, isAuthenticated, getAllUsers, isLoading: isAuthLoading, isRecoveryMode } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileListsOpen, setIsMobileListsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Notification State
  const [seenListIds, setSeenListIds] = useState<string[]>([]);
  const [notificationMsg, setNotificationMsg] = useState<{title: string, subtitle: string} | null>(null);
  
  // Modals
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [shareList, setShareList] = useState<CustomList | null>(null);
  
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.DATE_ADDED);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<MediaItem | null>(null);

  // Settings
  const [tmdbApiKey, setTmdbApiKey] = useState(DEFAULT_TMDB_KEY);
  const [tempApiKey, setTempApiKey] = useState(DEFAULT_TMDB_KEY);
  const [omdbApiKey, setOmdbApiKey] = useState(DEFAULT_OMDB_KEY);
  const [tempOmdbKey, setTempOmdbKey] = useState(DEFAULT_OMDB_KEY);
  
  // Gemini AI Key State
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [tempGeminiKey, setTempGeminiKey] = useState('');
  
  // API Test Status
  const [keyTestStatus, setKeyTestStatus] = useState<{loading: boolean, success?: boolean, msg?: string}>({ loading: false });
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === UserRole.ADMIN;
  const isManager = user?.role === UserRole.MANAGER;
  const canManageUsers = isAdmin || isManager;
  
  const canEditKeys = isAdmin; 
  const canSmartImport = isAdmin; 

  // --- MIGRATION LOGIC (Local -> Cloud) ---
  const checkAndMigrateData = async () => {
      if (!user) return;
      
      const localData = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
      if (localData && items.length === 0) {
          setIsMigrating(true);
          try {
              const parsed: MediaItem[] = JSON.parse(localData);
              console.log(`Migrating ${parsed.length} items to Supabase...`);
              
              for (const item of parsed) {
                  // Re-save to DB
                  await db.addMediaItem(item, user.id);
              }
              
              // Clear local after successful migration
              localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
              // Refresh
              loadData();
              alert("Deine lokalen Daten wurden erfolgreich in die Cloud übertragen!");
          } catch (e) {
              console.error("Migration failed", e);
          } finally {
              setIsMigrating(false);
          }
      }
  };

  const loadData = async () => {
      setIsDataLoading(true);
      try {
          const dbItems = await db.fetchMediaItems();
          setItems(dbItems);
          
          const dbLists = await db.fetchCustomLists();
          setCustomLists(dbLists);
          return dbLists; // Return for notification check
      } catch (e) {
          console.error(e);
          return [];
      } finally {
          setIsDataLoading(false);
      }
  };

  // Initial Load & Notifications
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading && !isRecoveryMode) {
        // Load seen lists from local storage
        const storedSeen = JSON.parse(localStorage.getItem(SEEN_LISTS_STORAGE_KEY) || '[]');
        setSeenListIds(storedSeen);

        loadData().then((fetchedLists) => {
            checkAndMigrateData();
            
            // Check for new shared lists
            if (fetchedLists && user) {
                const sharedWithMe = fetchedLists.filter(l => l.sharedWith.includes(user.id) && l.ownerId !== user.id);
                const newLists = sharedWithMe.filter(l => !storedSeen.includes(l.id));
                
                if (newLists.length > 0) {
                    // Trigger Notification
                    const listNames = newLists.map(l => l.name).join(', ');
                    setNotificationMsg({
                        title: "Neue geteilte Liste!",
                        subtitle: `${newLists.length} neue Liste(n): ${listNames}`
                    });
                    
                    // Auto-hide notification
                    setTimeout(() => setNotificationMsg(null), 8000);
                }
            }
        });
        
        // Load API Keys from Local (Non-sync settings)
        const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (savedKey) { setTmdbApiKey(savedKey); setTempApiKey(savedKey); }
        
        const savedOmdbKey = localStorage.getItem(OMDB_KEY_STORAGE_KEY);
        if (savedOmdbKey) { setOmdbApiKey(savedOmdbKey); setTempOmdbKey(savedOmdbKey); }

        const savedGeminiKey = localStorage.getItem(GEMINI_KEY_STORAGE_KEY);
        if (savedGeminiKey) { setGeminiApiKey(savedGeminiKey); setTempGeminiKey(savedGeminiKey); }
    }
  }, [isAuthenticated, isAuthLoading, isRecoveryMode]);

  // Mark list as seen when visiting
  useEffect(() => {
      if (location.pathname.startsWith('/lists/')) {
          const listId = location.pathname.split('/')[2];
          if (listId && !seenListIds.includes(listId)) {
              const newSeen = [...seenListIds, listId];
              setSeenListIds(newSeen);
              localStorage.setItem(SEEN_LISTS_STORAGE_KEY, JSON.stringify(newSeen));
          }
      }
  }, [location.pathname, seenListIds]);

  // PWA Install
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleTestKey = async () => {
      // Auto-sanitize locally before sending
      let keyToTest = tempGeminiKey.trim();
      if (keyToTest.startsWith('API_KEY=')) keyToTest = keyToTest.replace('API_KEY=', '');
      if ((keyToTest.startsWith('"') && keyToTest.endsWith('"')) || (keyToTest.startsWith("'") && keyToTest.endsWith("'"))) {
          keyToTest = keyToTest.substring(1, keyToTest.length - 1);
      }
      
      if (!keyToTest) return;
      
      setKeyTestStatus({ loading: true });
      const result = await testGeminiConnection(keyToTest);
      
      if (result.success) {
          // AUTO-SAVE on success to ensure the working key is used immediately
          localStorage.setItem(GEMINI_KEY_STORAGE_KEY, keyToTest);
          setGeminiApiKey(keyToTest);
          setTempGeminiKey(keyToTest);
          setKeyTestStatus({ loading: false, success: true, msg: "Gespeichert & Verbunden!" });
      } else {
          setKeyTestStatus({ loading: false, success: false, msg: result.message });
      }
  };

  const saveSettings = () => {
    // Gemini Key is always editable by user to solve their Quota/Demo issues
    // TRIM THE KEYS to avoid whitespace errors
    
    // Logic duplicated for safety
    let cleanedGeminiKey = tempGeminiKey.trim();
    if (cleanedGeminiKey.startsWith('API_KEY=')) cleanedGeminiKey = cleanedGeminiKey.replace('API_KEY=', '');
    if ((cleanedGeminiKey.startsWith('"') && cleanedGeminiKey.endsWith('"')) || (cleanedGeminiKey.startsWith("'") && cleanedGeminiKey.endsWith("'"))) {
        cleanedGeminiKey = cleanedGeminiKey.substring(1, cleanedGeminiKey.length - 1);
    }

    localStorage.setItem(GEMINI_KEY_STORAGE_KEY, cleanedGeminiKey);
    setGeminiApiKey(cleanedGeminiKey);
    setTempGeminiKey(cleanedGeminiKey); // Update input field too to show trimmed

    if (canEditKeys) {
        const cleanedTmdb = tempApiKey.trim();
        const cleanedOmdb = tempOmdbKey.trim();
        
        localStorage.setItem(API_KEY_STORAGE_KEY, cleanedTmdb);
        setTmdbApiKey(cleanedTmdb);
        setTempApiKey(cleanedTmdb);
        
        localStorage.setItem(OMDB_KEY_STORAGE_KEY, cleanedOmdb);
        setOmdbApiKey(cleanedOmdb);
        setTempOmdbKey(cleanedOmdb);
    }
    setIsSettingsOpen(false);
    setKeyTestStatus({ loading: false }); // Reset test status on close
  };

  // Add item
  const addItem = async (result: SearchResult, status: WatchStatus = WatchStatus.TO_WATCH, isFav: boolean = false) => {
    if (!user) return;
    setIsAdding(true);
    
    try {
        const details = await getMediaDetails(result, tmdbApiKey);
        
        // Fetch RT Rating via OMDb if IMDb ID is available
        let rtScore: string | undefined = undefined;
        if (details.imdbId && omdbApiKey) {
            rtScore = await getOmdbRatings(details.imdbId, omdbApiKey);
        }

        const newItem: MediaItem = {
          ...result,
          ...details,
          id: '', // DB assigns ID
          rtScore: rtScore, // Add the fetched RT score
          status: status,
          addedAt: Date.now(),
          posterColor: getRandomColor(),
          isFavorite: isFav,
          userRating: 0,
          userNotes: result.customNotes
        };
        
        const savedItem = await db.addMediaItem(newItem, user.id);
        if (savedItem) {
            setItems(prev => [savedItem, ...prev]);
        }
    } catch (e) {
        console.error("Failed to add item", e);
    } finally {
        setIsAdding(false);
    }
  };
  
  const handleBatchImport = async (results: SearchResult[]) => {
      for (const result of results) {
          await addItem(result);
      }
  };

  // Custom Lists
  const createList = async (name: string) => {
      if (!user) return;
      const newList: CustomList = {
          id: '',
          name,
          ownerId: user.id,
          createdAt: Date.now(),
          items: [],
          sharedWith: []
      };
      const created = await db.createCustomList(newList, user.id);
      if (created) {
          setCustomLists(prev => [...prev, created]);
          // Auto mark own lists as seen
          const newSeen = [...seenListIds, created.id];
          setSeenListIds(newSeen);
          localStorage.setItem(SEEN_LISTS_STORAGE_KEY, JSON.stringify(newSeen));
          navigate(`/lists/${created.id}`);
          setIsMobileListsOpen(false);
      }
  };

  const deleteList = async (listId: string) => {
      if (window.confirm(t('delete_list_confirm'))) {
          await db.deleteCustomList(listId);
          setCustomLists(prev => prev.filter(l => l.id !== listId));
          navigate('/');
      }
  };

  const addToList = async (listId: string, itemId: string) => {
      const list = customLists.find(l => l.id === listId);
      if (list && !list.items.includes(itemId)) {
          const newItems = [...list.items, itemId];
          await db.updateCustomListItems(listId, newItems);
          setCustomLists(prev => prev.map(l => l.id === listId ? { ...l, items: newItems } : l));
      }
  };

  const removeFromList = async (listId: string, itemId: string) => {
      const list = customLists.find(l => l.id === listId);
      if (list) {
          const newItems = list.items.filter(i => i !== itemId);
          await db.updateCustomListItems(listId, newItems);
          setCustomLists(prev => prev.map(l => l.id === listId ? { ...l, items: newItems } : l));
      }
  };

  const shareListWithUsers = async (listId: string, userIds: string[]) => {
      await db.shareCustomList(listId, userIds);
      setCustomLists(prev => prev.map(list => {
          if (list.id === listId) return { ...list, sharedWith: userIds };
          return list;
      }));
  };

  // Item Updates
  const updateStatus = async (id: string, status: WatchStatus) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    await db.updateMediaItemStatus(id, status);
  };

  const toggleFavorite = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
        const newVal = !item.isFavorite;
        setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: newVal } : i));
        await db.toggleMediaItemFavorite(id, newVal);
    }
  };

  const rateItem = async (id: string, rating: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, userRating: rating } : item));
    await db.updateMediaItemRating(id, rating);
  };
  
  const updateNotes = async (id: string, notes: string) => {
      setItems(prev => prev.map(item => item.id === id ? { ...item, userNotes: notes } : item));
      await db.updateMediaItemNotes(id, notes);
  };

  const updateRtScore = async (id: string, score: string) => {
      setItems(prev => prev.map(item => item.id === id ? { ...item, rtScore: score } : item));
      await db.updateMediaItemRtScore(id, score);
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    await db.deleteMediaItem(id);
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

  // Custom List View
  const CustomListView = () => {
      const { id } = useParams();
      const list = customLists.find(l => l.id === id);
      const allUsers = getAllUsers();

      if (!list) return <div className="p-8 text-slate-400">Liste nicht gefunden.</div>;
      
      const listItems = items.filter(item => list.items.includes(item.id));
      const owner = allUsers.find(u => u.id === list.ownerId);

      return (
          <div className="pb-24 md:pb-0">
             <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
                 <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        {list.name}
                        {list.ownerId !== user?.id && <span className="text-xs bg-slate-700 px-2 py-1 rounded-full font-normal text-slate-300">{t('shared_by')} {owner?.username || 'Unknown'}</span>}
                    </h2>
                    <p className="text-slate-400">{listItems.length} {t('items_count')}</p>
                 </div>
                 
                 <div className="flex gap-2 w-full md:w-auto">
                    {list.ownerId === user?.id && (
                        <>
                            <button onClick={() => setShareList(list)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition-colors text-sm"><Share2 size={16} /> {t('share')}</button>
                            <button onClick={() => deleteList(list.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors text-sm"><Trash2 size={16} /> {t('delete_list')}</button>
                        </>
                    )}
                 </div>
             </header>

             {listItems.length === 0 ? (
                <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl"><List size={48} className="mx-auto mb-4 opacity-20" /><p>{t('empty_state')}</p></div>
             ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                    {listItems.map(item => (
                        <MediaCard 
                            key={item.id} 
                            item={item} 
                            onStatusChange={updateStatus}
                            onDelete={(itemId) => { if(list.ownerId === user?.id) removeFromList(list.id, itemId); }}
                            onToggleFavorite={toggleFavorite}
                            onRate={rateItem}
                            onClick={(i) => setViewingItem(i)}
                            customLists={customLists.filter(l => l.ownerId === user?.id)}
                            onAddToList={addToList}
                        />
                    ))}
                </div>
             )}
          </div>
      );
  };

  const renderGrid = (status?: WatchStatus) => {
    const filteredAndSorted = getFilteredItems(status);
    
    if (isDataLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-cyan-400">
                <Loader2 size={40} className="animate-spin" />
            </div>
        );
    }

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
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pb-24 md:pb-0">
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

  if (isAuthLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 size={40} className="text-cyan-500 animate-spin" /></div>;
  
  if (isRecoveryMode) return <RecoveryPage />;
  if (!isAuthenticated) return <AuthPage />;

  const myCustomLists = customLists.filter(l => l.ownerId === user?.id);
  const sharedLists = customLists.filter(l => l.sharedWith.includes(user?.id || ''));
  const hasNewSharedLists = sharedLists.some(l => !seenListIds.includes(l.id));

  // --- SETTINGS UI COMPONENT (Reused for Mobile/Desktop) ---
  const SettingsContent = () => (
      <>
        <button onClick={() => { setIsSettingsOpen(false); navigate('/guide'); }} className="w-full mb-4 py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-xs font-bold transition-all shadow-lg">
            <BookOpen size={14} /> Handbuch öffnen
        </button>

        {/* THEME SWITCHER */}
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">{t('appearance')}</h4>
        <div className="flex gap-1 mb-4 bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title={t('theme_dark')}>
                <Moon size={14} />
            </button>
            <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-slate-100 text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title={t('theme_light')}>
                <Sun size={14} />
            </button>
            <button onClick={() => setTheme('glass')} className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${theme === 'glass' ? 'bg-white/10 text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title={t('theme_glass')}>
                <Smartphone size={14} />
            </button>
        </div>

        {/* Gemini Key Input (Always available) */}
        <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 text-purple-400"><Sparkles size={12} /> Google Gemini Key</h4>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-white flex items-center gap-1 transition-colors">
                Key erstellen <ExternalLink size={8}/>
            </a>
        </div>
        <div className="flex gap-2 mb-2">
            <input 
                type="password" 
                value={tempGeminiKey} 
                onChange={(e) => setTempGeminiKey(e.target.value)} 
                placeholder="Gemini API Key..." 
                className="flex-grow bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:border-purple-500 focus:outline-none" 
            />
            <button 
                onClick={handleTestKey}
                disabled={keyTestStatus.loading || !tempGeminiKey}
                className={`px-3 rounded text-xs font-bold transition-colors ${keyTestStatus.success ? 'bg-green-600 text-white' : keyTestStatus.success === false ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                title="Verbindung testen"
            >
                {keyTestStatus.loading ? <Loader2 size={12} className="animate-spin"/> : keyTestStatus.success ? <CheckCircle size={14}/> : <Zap size={14}/>}
            </button>
        </div>
        {/* Test Result Message */}
        {keyTestStatus.msg && (
            <div className={`text-[10px] mb-2 px-2 py-1 rounded border ${keyTestStatus.success ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
                {keyTestStatus.msg}
            </div>
        )}

        {canEditKeys ? (
        <>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2 mt-2"><Key size={12} /> TMDB API Key</h4>
            <input type="password" value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} placeholder="TMDB Key..." className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white mb-2 focus:border-cyan-500 focus:outline-none" />
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2 mt-3"><Database size={12} /> OMDb API Key</h4>
            <input type="password" value={tempOmdbKey} onChange={(e) => setTempOmdbKey(e.target.value)} placeholder="OMDb Key..." className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white mb-2 focus:border-cyan-500 focus:outline-none" />
        </>
        ) : (
        <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex items-center gap-2"><ShieldAlert size={14} /><span>TMDB Keys verwaltet.</span></div>
        )}
        <button onClick={saveSettings} className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded font-medium transition-colors mb-4 mt-2">{t('remember')}</button>

        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Languages size={12} /> {t('language')}</h4>
        <div className="flex gap-2 mb-4">
                <button onClick={() => setLanguage('de')} className={`flex-1 py-1 text-xs rounded border ${language === 'de' ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-700 text-slate-400'}`}>DE</button>
                <button onClick={() => setLanguage('en')} className={`flex-1 py-1 text-xs rounded border ${language === 'en' ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-700 text-slate-400'}`}>EN</button>
        </div>
        {canSmartImport && <button onClick={() => { setIsSettingsOpen(false); setIsImportOpen(true); }} className="w-full mt-2 py-1.5 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-cyan-400 rounded text-xs transition-colors border border-slate-600"><FileText size={12} /> {t('smart_import')}</button>}
        {canManageUsers && (
            <button onClick={() => { setIsSettingsOpen(false); navigate('/admin'); }} className="w-full mt-2 py-1.5 flex items-center justify-center gap-2 bg-slate-700/50 text-cyan-400 border border-slate-600 rounded text-xs font-bold">
                <Shield size={12} /> {t('user_management')}
            </button>
        )}
        <button onClick={logout} className="w-full mt-4 py-1.5 flex items-center justify-center gap-2 text-red-400 hover:bg-red-400/10 rounded text-xs transition-colors"><LogOut size={12} /> {t('logout')}</button>
      </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col md:flex-row relative">
      
      {isMigrating && (
          <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white">
              <CloudUpload size={64} className="text-cyan-400 animate-bounce mb-4" />
              <h2 className="text-2xl font-bold mb-2">Cloud Synchronisierung</h2>
              <p className="text-slate-400">Deine lokalen Daten werden in die Cloud übertragen...</p>
          </div>
      )}

      {notificationMsg && (
          <div className="fixed top-4 right-4 z-[90] bg-slate-800 border-l-4 border-cyan-500 shadow-2xl rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-right-10 duration-500 max-w-sm">
               <div className="p-2 bg-cyan-500/10 rounded-full">
                   <BellRing size={20} className="text-cyan-400" />
               </div>
               <div className="flex-grow">
                   <h4 className="text-sm font-bold text-white">{notificationMsg.title}</h4>
                   <p className="text-xs text-slate-400 mt-1 leading-snug">{notificationMsg.subtitle}</p>
               </div>
               <button onClick={() => setNotificationMsg(null)} className="text-slate-500 hover:text-white"><X size={16}/></button>
          </div>
      )}

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col sticky top-0 h-screen z-20">
        <div className="p-6 flex items-center justify-between text-cyan-400">
           <div className="flex items-center gap-2">
             <Clapperboard size={28} />
             <h1 className="text-2xl font-bold tracking-tight text-white">
                 <span className="text-cyan-400">InFocus</span> CineLog
             </h1>
           </div>
           <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-slate-500 hover:text-white transition-colors" title={t('settings')}>
              <Settings size={20} />
           </button>
        </div>

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

        {/* Desktop Settings Panel */}
        {isSettingsOpen && (
            <div className="mx-4 mb-4 p-4 bg-slate-800 rounded-xl border border-slate-700 animate-in slide-in-from-top-2">
                 <SettingsContent />
            </div>
        )}

        <nav className="flex-grow px-4 space-y-1 overflow-y-auto pb-4 custom-scrollbar">
          <NavItem to="/" icon={LayoutDashboard} label={t('overview')} />
          {/* Admin / Manager Link with Section Header */}
          {canManageUsers && (
              <>
                 <div className="pt-4 pb-2 px-4 text-xs font-semibold text-cyan-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={10} /> Administration
                 </div>
                 <NavItem to="/admin" icon={Shield} label={t('user_management')} />
              </>
          )}

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('my_lists')}</div>
          <NavItem to="/watchlist" icon={MonitorPlay} label={t('planned')} />
          <NavItem to="/watching" icon={Tv} label={t('watching')} />
          <NavItem to="/watched" icon={CheckCircle} label={t('seen')} />
          <NavItem to="/favorites" icon={Heart} label={t('favorites')} />
          
          <div className="pt-4 pb-2 px-4 flex items-center justify-between group cursor-pointer">
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('custom_lists')}</span>
             <button onClick={() => setIsCreateListOpen(true)} className="text-slate-500 hover:text-cyan-400 transition-colors"><PlusCircle size={14} /></button>
          </div>
          {myCustomLists.map(list => <NavItem key={list.id} to={`/lists/${list.id}`} icon={List} label={list.name} />)}
          {sharedLists.length > 0 && (
             <>
                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('shared_with')}</div>
                {sharedLists.map(list => {
                    const isNew = !seenListIds.includes(list.id);
                    return <NavItem key={list.id} to={`/lists/${list.id}`} icon={Share2} label={list.name} isNew={isNew} />;
                })}
             </>
          )}

          <div className="pt-6">
            <button onClick={() => setIsSearchOpen(true)} disabled={isAdding} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-wait">
              {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              <span>{isAdding ? t('generating') : t('add_button')}</span>
            </button>
          </div>
        </nav>
        {/* DESKTOP AI BUTTON - Only renders in sidebar due to CSS hidden md:flex of parent */}
        <AiRecommendationButton items={items} onAdd={addItem} apiKey={tmdbApiKey} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto h-screen scroll-smooth pb-24 md:pb-8">
        {!location.pathname.startsWith('/guide') && (
            <div className="md:hidden flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Clapperboard size={24} />
                    <h1 className="text-xl font-bold text-white">
                        <span className="text-cyan-400">InFocus</span>
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/profile')} className="text-slate-400 hover:text-white"><UserIcon size={24} /></button>
                    <button onClick={() => setIsMobileListsOpen(true)} className="text-slate-400 hover:text-white relative">
                        <ListPlus size={24} />
                        {hasNewSharedLists && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full border border-slate-900"></span>}
                    </button>
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-slate-400 hover:text-white"><Settings size={24} /></button>
                </div>
            </div>
        )}
        
        {/* MOBILE LISTS DRAWER (Upgraded Visuals) */}
        {isMobileListsOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
                 <div className="flex-grow" onClick={() => setIsMobileListsOpen(false)}></div>
                 <div className="bg-slate-900 rounded-t-[2rem] border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-bottom-10 max-h-[85vh] overflow-hidden flex flex-col">
                      {/* Handle Bar */}
                      <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsMobileListsOpen(false)}>
                          <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
                      </div>

                      <div className="px-6 pb-4 pt-2 flex items-center justify-between border-b border-slate-800">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><List size={20} className="text-cyan-400"/> {t('custom_lists')}</h3>
                        <button onClick={() => setIsMobileListsOpen(false)} className="text-slate-400 bg-slate-800 p-1.5 rounded-full"><X size={18} /></button>
                      </div>
                      
                      <div className="overflow-y-auto p-6 space-y-6 pb-safe">
                           {/* My Lists Section */}
                           <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <List size={12}/> {t('my_lists')}
                                </h4>
                                {myCustomLists.length === 0 ? (
                                    <div className="p-4 bg-slate-800/50 rounded-xl text-slate-500 text-sm italic text-center border border-slate-800 border-dashed">{t('no_custom_lists')}</div>
                                ) : (
                                    <div className="space-y-2">
                                        {myCustomLists.map(list => (
                                            <div 
                                                key={list.id} 
                                                onClick={() => { navigate(`/lists/${list.id}`); setIsMobileListsOpen(false); }}
                                                className="p-4 bg-slate-800 rounded-xl flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform border border-slate-800 hover:border-slate-600"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                                    <List size={16} />
                                                </div>
                                                <span className="text-white font-medium">{list.name}</span>
                                                <span className="ml-auto text-xs text-slate-500">{list.items.length}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                           </div>

                           {/* Shared Lists Section */}
                           {sharedLists.length > 0 && (
                               <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-2 flex items-center gap-2">
                                        <Share2 size={12}/> {t('shared_with')}
                                    </h4>
                                    <div className="space-y-2">
                                        {sharedLists.map(list => {
                                            const isNew = !seenListIds.includes(list.id);
                                            return (
                                                <div 
                                                    key={list.id} 
                                                    onClick={() => { navigate(`/lists/${list.id}`); setIsMobileListsOpen(false); }}
                                                    className={`p-4 rounded-xl flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform border ${isNew ? 'bg-cyan-900/10 border-cyan-500/30' : 'bg-slate-800 border-slate-800'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isNew ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}>
                                                        <Share2 size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-medium leading-none mb-1">{list.name}</span>
                                                        <span className="text-[10px] text-slate-400">Von {getAllUsers().find(u => u.id === list.ownerId)?.username}</span>
                                                    </div>
                                                    {isNew && <span className="ml-auto text-[10px] font-bold bg-cyan-500 text-slate-900 px-2 py-0.5 rounded-full">NEU</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                           )}

                           <button 
                               onClick={() => setIsCreateListOpen(true)}
                               className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-transform mt-4"
                           >
                               <PlusCircle size={18} /> {t('create_list')}
                           </button>
                      </div>
                 </div>
            </div>
        )}

        {isSettingsOpen && (
             <div className="md:hidden fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
                  <div className="flex-grow" onClick={() => setIsSettingsOpen(false)}></div>
                  <div className="bg-slate-800 p-6 rounded-t-2xl border-t border-slate-700 shadow-2xl relative animate-in slide-in-from-bottom-10 max-h-[85vh] overflow-y-auto pb-safe">
                      <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6"></div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={20} className="text-cyan-400"/> {t('settings')}</h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 bg-slate-900/50 p-2 rounded-full"><X size={20} /></button>
                      </div>
                      <div className="space-y-6">
                            <SettingsContent />
                      </div>
                  </div>
             </div>
        )}

        {!location.pathname.startsWith('/lists/') && location.pathname !== '/profile' && location.pathname !== '/admin' && !location.pathname.startsWith('/guide') && (
            <header className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">{location.pathname === '/' ? t('collection') : location.pathname === '/watchlist' ? t('planned') : location.pathname === '/watching' ? t('watching') : location.pathname === '/favorites' ? t('favorites') : t('seen')}</h2>
                <p className="text-slate-400 text-sm hidden md:block">{location.pathname === '/' ? t('collection_sub') : location.pathname === '/favorites' ? t('fav_sub') : `${getFilteredItems(location.pathname === '/watchlist' ? WatchStatus.TO_WATCH : location.pathname === '/watching' ? WatchStatus.WATCHING : location.pathname === '/watched' ? WatchStatus.WATCHED : undefined).length} ${t('list_count')}`}</p>
            </div>
            <div className="relative self-end sm:self-auto w-full sm:w-auto">
                <button onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm font-medium"><div className="flex items-center gap-2"><ArrowUpDown size={16} /><span className="inline">{sortBy === SortOption.DATE_ADDED && t('sort_latest')}{sortBy === SortOption.RATING && t('sort_rating')}{sortBy === SortOption.YEAR && t('sort_year')}{sortBy === SortOption.TITLE && t('sort_title')}</span></div><ChevronDown size={14} className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} /></button>
                {isSortMenuOpen && (
                    <div className="absolute right-0 mt-2 w-full sm:w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-150">
                        {[{ label: t('sort_latest'), value: SortOption.DATE_ADDED }, { label: t('sort_rating'), value: SortOption.RATING }, { label: t('sort_year'), value: SortOption.YEAR }, { label: t('sort_title'), value: SortOption.TITLE }].map((opt) => (
                            <button key={opt.value} onClick={() => { setSortBy(opt.value); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${sortBy === opt.value ? 'text-cyan-400 bg-slate-700/50' : 'text-slate-300'}`}>{opt.label}</button>
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
          <Route path="/profile" element={<ProfilePage items={items} />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/admin" element={<UserManagementPage />} />
        </Routes>
      </main>
      
      {!location.pathname.startsWith('/guide') && (
          <MobileNav 
            onSearchClick={() => setIsSearchOpen(true)} 
            onListsClick={() => setIsMobileListsOpen(true)}
            hasNotification={hasNewSharedLists}
          />
      )}
      
      <ChatBot items={items} />
      {/* MOBILE AI BUTTON - Force Render for Mobile */}
      <AiRecommendationButton items={items} onAdd={addItem} apiKey={tmdbApiKey} mobileFabOnly={true} />
      
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onAdd={addItem} apiKey={tmdbApiKey} />
      <CreateListModal isOpen={isCreateListOpen} onClose={() => setIsCreateListOpen(false)} onCreate={createList} />
      {canSmartImport && <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={handleBatchImport} apiKey={tmdbApiKey} omdbApiKey={omdbApiKey} />}
      {shareList && <ShareModal isOpen={!!shareList} onClose={() => setShareList(null)} list={shareList} onShare={shareListWithUsers} />}
      {viewingUserProfile && <PublicProfileModal user={viewingUserProfile} allLists={customLists} allItems={items} onClose={() => setViewingUserProfile(null)} />}
      {viewingItem && <DetailView item={viewingItem} isExisting={true} apiKey={tmdbApiKey} omdbApiKey={omdbApiKey} onClose={() => setViewingItem(null)} onUpdateStatus={updateStatus} onToggleFavorite={toggleFavorite} onUpdateNotes={updateNotes} onUpdateRtScore={updateRtScore} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;