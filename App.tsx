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
import { ChatBot } from './components/ChatBot';
import { CreateListModal } from './components/CreateListModal';
import { AiRecommendationButton } from './components/AiRecommendationButton';
import { 
  fetchMediaItems, addMediaItem, updateMediaItemStatus, deleteMediaItem,
  toggleMediaItemFavorite, updateMediaItemRating, updateMediaItemNotes,
  fetchCustomLists, updateCustomListItems, createCustomList 
} from './services/db';
import { getMediaDetails, getEffectiveApiKey as getTmdbKey } from './services/tmdb';
import { getOmdbRatings, getEffectiveOmdbKey } from './services/omdb';
import { MediaItem, WatchStatus, SearchResult, CustomList, UserRole, MediaType } from './types';
import { Search, User as UserIcon, List, Clapperboard, Plus, Share2, LogOut } from 'lucide-react';

const ListRoute = ({ customLists, renderGrid, onShare }: { customLists: CustomList[], renderGrid: (s?: WatchStatus, l?: string) => React.ReactNode, onShare: (list: CustomList) => void }) => {
    const { id } = useParams();
    const { user } = useAuth();
    const { t } = useTranslation();
    const list = (customLists || []).find(l => l.id === id);
    if (!list) return <div className="p-8 text-center text-slate-500">Liste nicht gefunden</div>;
    const isOwner = user?.id === list.ownerId;
    
    return (
        <div>
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <List size={24} className="text-purple-400" /> {list.name}
                    </h2>
                </div>
                {isOwner && (
                    <button onClick={() => onShare(list)} className="p-2 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-lg border border-white/10 transition-colors flex items-center gap-2 text-sm font-bold">
                        <Share2 size={18} /> {t('share')}
                    </button>
                )}
            </div>
            {renderGrid(undefined, id)}
        </div>
    );
};

export default function App() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [items, setItems] = useState<MediaItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  const tmdbKey = getTmdbKey(localStorage.getItem('tmdb_api_key') || '');
  const omdbKey = getEffectiveOmdbKey(localStorage.getItem('omdb_api_key') || '');

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    try {
      const [fetchedItems, fetchedLists] = await Promise.all([ fetchMediaItems(), fetchCustomLists() ]);
      setItems(fetchedItems || []);
      setCustomLists(fetchedLists || []);
    } catch (error) {
      console.error("Ladefehler:", error);
    }
  };

  const handleCreateList = async (name: string) => {
    if (!user || !name.trim()) return;
    
    try {
      // Nutzt die neue createCustomList Funktion aus db.ts
      const savedList = await createCustomList(name, user.id);
      if (savedList) {
        setCustomLists(prev => [...prev, savedList]);
        setIsCreateModalOpen(false);
        // Navigiere optional direkt zur neuen Liste
        navigate(`/list/${savedList.id}`);
      }
    } catch (e) {
      console.error("Fehler beim Erstellen der Liste:", e);
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

  const handleAdd = async (result: SearchResult, status: WatchStatus = WatchStatus.TO_WATCH, isFav: boolean = false) => {
    if (!user) return;
    const existing = items.find(i => i.tmdbId === result.tmdbId && i.userId === user.id);
    if (existing) return;
    let details: Partial<MediaItem> = {};
    if (tmdbKey) try { details = await getMediaDetails(result, tmdbKey); } catch(e) {}
    let rtScore = undefined;
    if (omdbKey && (result.imdbId || details.imdbId)) try { rtScore = await getOmdbRatings(result.imdbId || details.imdbId!, omdbKey) || undefined; } catch(e) {}
    const newItem: MediaItem = { id: crypto.randomUUID(), userId: user.id, tmdbId: result.tmdbId, imdbId: result.imdbId || details.imdbId, title: result.title, originalTitle: result.originalTitle, year: result.year, type: result.type, genre: details.genre || [], plot: result.plot, rating: result.rating, posterPath: result.posterPath, backdropPath: result.backdropPath, status: status, addedAt: Date.now(), isFavorite: isFav, userRating: 0, userNotes: result.customNotes || '', runtime: details.runtime, seasons: details.seasons, episodes: details.episodes, certification: details.certification, trailerKey: details.trailerKey, credits: details.credits || [], providers: details.providers || [], rtScore: rtScore };
    const saved = await addMediaItem(newItem, user.id);
    if (saved) setItems(prev => [saved, ...prev]);
  };

  if (!user) return <AuthPage />;

  const displayedItems = items.filter(i => i.userId === user.id);

  const renderGrid = (statusFilter?: WatchStatus, listId?: string) => {
      let filtered = displayedItems;
      if (listId) { 
          const list = (customLists || []).find(l => l.id === listId); 
          filtered = list ? items.filter(i => list.items.includes(i.id)) : []; 
      }
      else if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
      else if (location.pathname === '/favorites') filtered = filtered.filter(i => i.isFavorite);
      filtered.sort((a, b) => b.addedAt - a.addedAt);
      if (filtered.length === 0) return <div className="flex flex-col items-center justify-center py-20 text-slate-500"><Clapperboard size={48} className="mb-4 opacity-20" /><p>{t('empty_state')}</p></div>;
      return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 relative z-10">{filtered.map(item => <MediaCard key={item.id} item={item} onStatusChange={handleUpdateStatus} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onRate={() => {}} onClick={setSelectedItem} customLists={(customLists || []).filter(l => l.ownerId === user.id)} onAddToList={async (lid, iid) => { const list = (customLists || []).find(cl => cl.id === lid); if (list) { const newItems = [...list.items, iid]; await updateCustomListItems(lid, newItems); loadData(); } }} />)}</div>;
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 pb-20 md:pb-0 font-sans relative overflow-x-hidden">
        <header className="sticky top-0 z-[100] bg-[#0B0E14] border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-6">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
                    <Clapperboard size={24} className="text-cyan-400" />
                    <span className="font-bold text-xl tracking-tight text-white block">InFocus <span className="text-cyan-400">CineLog</span></span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSearchOpen(true)} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><Search size={20} /></button>
            </div>
        </header>

        <div className="max-w-[1600px] mx-auto flex relative z-10">
            <aside className="hidden md:flex w-64 flex-col sticky top-16 h-[calc(100vh-64px)] border-r border-white/5 bg-[#0B0E14]/40 backdrop-blur-md overflow-y-auto shrink-0">
                <div className="pl-6 pr-4 py-8">
                    <button onClick={() => setIsSearchOpen(true)} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-3 rounded-xl font-bold transition-all mb-8 shadow-lg shadow-cyan-900/20">
                        <Plus size={20} /> {t('add_button')}
                    </button>
                    <div className="mb-6">
                        <h3 className="px-3 text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">{t('my_lists')}</h3>
                        <button onClick={() => setIsCreateModalOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all text-sm mb-4 font-bold"><Plus size={16} /> {t('create_list')}</button>
                        <div className="space-y-1">
                            {(customLists || []).filter(l => l.ownerId === user.id).map(l => (
                                <button key={l.id} onClick={() => navigate(`/list/${l.id}`)} className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/5 transition-colors truncate ${location.pathname === `/list/${l.id}` ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white'}`}>{l.name}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <AiRecommendationButton items={displayedItems} onAdd={handleAdd} apiKey={tmdbKey} />
            </aside>

            <main className="flex-grow p-4 md:p-8 min-h-[calc(100vh-64px)] relative">
                <Routes>
                    <Route path="/" element={<div><Stats items={displayedItems} /><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('collection')}</h2></div>{renderGrid()}</div>} />
                    <Route path="/watchlist" element={<div><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('watchlist')}</h2></div>{renderGrid(WatchStatus.TO_WATCH)}</div>} />
                    <Route path="/list/:id" element={<ListRoute customLists={customLists} renderGrid={renderGrid} onShare={() => {}} />} />
                </Routes>
            </main>
        </div>

        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onAdd={handleAdd} apiKey={tmdbKey} />
        <CreateListModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateList} />
    </div>
  );
}
