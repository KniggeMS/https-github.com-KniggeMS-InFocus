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
  toggleMediaItemFavorite, updateMediaItemNotes,
  fetchCustomLists, updateCustomListItems, createCustomList
} from './services/db';
import { getMediaDetails, getEffectiveApiKey as getTmdbKey } from './services/tmdb';
import { getOmdbRatings, getEffectiveOmdbKey } from './services/omdb';
import { MediaItem, WatchStatus, SearchResult, CustomList } from './types';
import { Search, List, Clapperboard, Plus, Share2, LogOut } from 'lucide-react';

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
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const tmdbKey = getTmdbKey(localStorage.getItem('tmdb_api_key') || '');
  const omdbKey = getEffectiveOmdbKey(localStorage.getItem('omdb_api_key') || '');

  const loadData = useCallback(async () => {
    if (!user) return;
    const [fi, fl] = await Promise.all([fetchMediaItems(), fetchCustomLists()]);
    setItems(fi || []);
    setCustomLists(fl || []);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateList = async (name: string) => {
    if (!user || !name.trim()) return;
    const saved = await createCustomList(name, user.id);
    if (saved) { setCustomLists(prev => [...prev, saved]); setIsCreateModalOpen(false); navigate(`/list/${saved.id}`); }
  };

  const handleUpdateStatus = useCallback(async (id: string, status: WatchStatus) => {
    await updateMediaItemStatus(id, status);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      await toggleMediaItemFavorite(id, !item.isFavorite);
      setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !item.isFavorite } : i));
    }
  }, [items]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Wirklich löschen?")) { await deleteMediaItem(id); setItems(prev => prev.filter(i => i.id !== id)); }
  }, []);

  const handleAdd = async (result: SearchResult, status: WatchStatus = WatchStatus.TO_WATCH) => {
    if (!user) return;
    let details: any = {};
    if (tmdbKey) details = await getMediaDetails(result, tmdbKey);
    let rtScore = undefined;
    if (omdbKey && (result.imdbId || details.imdbId)) rtScore = await getOmdbRatings(result.imdbId || details.imdbId, omdbKey);

    const newItem: any = {
      tmdbId: result.tmdbId, imdbId: result.imdbId || details.imdbId, title: result.title,
      originalTitle: result.originalTitle || result.title, year: result.year, type: result.type,
      genre: details.genre || [], plot: result.plot || details.plot, rating: result.rating,
      rtScore: rtScore || undefined, posterPath: result.posterPath, backdropPath: details.backdropPath || result.backdropPath,
      status, addedAt: Date.now(), isFavorite: false, userRating: 0, userNotes: '',
      runtime: details.runtime, seasons: details.seasons, episodes: details.episodes,
      certification: details.certification, trailerKey: details.trailerKey,
      creators: details.creators || [], credits: details.credits || [], providers: details.providers || []
    };
    const saved = await addMediaItem(newItem, user.id);
    if (saved) setItems(prev => [saved, ...prev]);
  };

  if (!user) return <AuthPage />;
  const displayedItems = items.filter(i => i.userId === user.id);

  const renderGrid = (statusFilter?: WatchStatus, listId?: string) => {
      let filtered = [...displayedItems];
      if (listId) {
          const list = customLists.find(l => l.id === listId);
          filtered = list ? items.filter(i => list.items.includes(i.id)) : [];
      } else if (statusFilter) {
          filtered = filtered.filter(i => i.status === statusFilter);
      }
      filtered.sort((a, b) => b.addedAt - a.addedAt);

      if (filtered.length === 0) return <div className="py-20 text-center text-slate-500"><Clapperboard size={48} className="mx-auto mb-4 opacity-20" />{t('empty_state')}</div>;

      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filtered.map(item => (
                <MediaCard
                    key={item.id} item={item} onStatusChange={handleUpdateStatus} onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite} onRate={() => {}} onClick={setSelectedItem}
                    onAddToList={async (lid, iid) => {
                        const list = customLists.find(cl => cl.id === lid);
                        if (list) {
                            const newItems = [...list.items, iid];
                            await updateCustomListItems(lid, newItems);
                            loadData();
                        }
                    }}
                />
            ))}
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 pb-20 md:pb-0 font-sans">
        <header className="sticky top-0 z-[100] bg-[#0B0E14] border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <Clapperboard size={24} className="text-cyan-400" />
                <span className="font-bold text-xl tracking-tight text-white">InFocus <span className="text-cyan-400">CineLog</span></span>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSearchOpen(true)} className="p-2 rounded-full hover:bg-white/5"><Search size={20} /></button>
                <button onClick={() => logout()} className="p-2 rounded-full hover:bg-white/5 text-slate-400"><LogOut size={20} /></button>
            </div>
        </header>

        <div className="max-w-[1600px] mx-auto flex relative">
            <aside className="hidden md:flex w-64 flex-col p-6 border-r border-white/5 h-[calc(100vh-64px)] sticky top-16">
                <button onClick={() => setIsSearchOpen(true)} className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-bold mb-8 flex items-center justify-center gap-2 transition-colors"><Plus size={20} />{t('add_button')}</button>
                <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('my_lists')}</div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 text-cyan-400 text-sm mb-4 hover:text-cyan-300 transition-colors"><Plus size={16} />{t('create_list')}</button>
                <div className="space-y-1 mb-8">
                    {customLists.filter(l => l.ownerId === user.id).map(l => (
                        <button key={l.id} onClick={() => navigate(`/list/${l.id}`)} className={`w-full text-left py-2 px-3 rounded-lg text-sm truncate transition-colors ${location.pathname === `/list/${l.id}` ? 'bg-cyan-500/10 text-cyan-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{l.name}</button>
                    ))}
                </div>
                <div className="mt-auto"><AiRecommendationButton items={displayedItems} onAdd={handleAdd} apiKey={tmdbKey} /></div>
            </aside>

            <main className="flex-grow p-4 md:p-8">
                <Routes>
                    <Route path="/" element={<div><Stats items={displayedItems} /><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('collection')}</h2></div>{renderGrid()}</div>} />
                    <Route path="/watchlist" element={<div><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('watchlist')}</h2></div>{renderGrid(WatchStatus.TO_WATCH)}</div>} />
                    <Route path="/favorites" element={<div><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('favorites')}</h2></div>{renderGrid()}</div>} />
                    <Route path="/list/:id" element={<ListRoute customLists={customLists} renderGrid={renderGrid} />} />
                    <Route path="/profile" element={<ProfilePage items={displayedItems} />} />
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/guide" element={<GuidePage />} />
                </Routes>
            </main>
        </div>

        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onAdd={handleAdd} apiKey={tmdbKey} />
        <CreateListModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateList} />
        <MobileNav onSearchClick={() => setIsSearchOpen(true)} onListsClick={() => {}} />
        <ChatBot items={displayedItems} />
        
        {selectedItem && (
            <DetailView
                item={selectedItem} isExisting={true} onClose={() => setSelectedItem(null)}
                apiKey={tmdbKey} onUpdateStatus={handleUpdateStatus} onToggleFavorite={handleToggleFavorite}
                onUpdateNotes={async (id, notes) => {
                    await updateMediaItemNotes(id, notes);
                    setItems(prev => prev.map(i => i.id === id ? { ...i, userNotes: notes } : i));
                }}
            />
        )}
    </div>
  );
}