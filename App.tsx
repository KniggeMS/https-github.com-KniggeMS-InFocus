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
import { fetchMediaItems, addMediaItem, updateMediaItemStatus, deleteMediaItem, toggleMediaItemFavorite, fetchCustomLists, updateCustomListItems, createCustomList } from './services/db';
import { getMediaDetails, getEffectiveApiKey as getTmdbKey } from './services/tmdb';
import { getOmdbRatings, getEffectiveOmdbKey } from './services/omdb';
import { MediaItem, WatchStatus, SearchResult, CustomList } from './types';
import { Search, List, Clapperboard, Plus, Share2 } from 'lucide-react';

const ListRoute = ({ customLists, renderGrid }: { customLists: CustomList[], renderGrid: (s?: WatchStatus, l?: string) => React.ReactNode }) => {
    const { id } = useParams();
    const list = (customLists || []).find(l => l.id === id);
    if (!list) return <div className="p-8 text-center text-slate-500">Liste nicht gefunden</div>;
    return (<div><div className="mb-6"><h2 className="text-2xl font-bold text-white flex items-center gap-2"><List size={24} className="text-purple-400" /> {list.name}</h2></div>{renderGrid(undefined, id)}</div>);
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
  const tmdbKey = getTmdbKey(localStorage.getItem('tmdb_api_key') || '');
  const omdbKey = getEffectiveOmdbKey(localStorage.getItem('omdb_api_key') || '');

  useEffect(() => { if (user) loadData(); }, [user]);
  const loadData = async () => { const [fi, fl] = await Promise.all([fetchMediaItems(), fetchCustomLists()]); setItems(fi || []); setCustomLists(fl || []); };

  const handleCreateList = async (name: string) => {
    if (!user || !name.trim()) return;
    const saved = await createCustomList(name, user.id);
    if (saved) { setCustomLists(prev => [...prev, saved]); setIsCreateModalOpen(false); navigate(`/list/${saved.id}`); }
  };

  const handleUpdateStatus = useCallback(async (id: string, status: WatchStatus) => { await updateMediaItemStatus(id, status); setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i)); }, []);
  const handleToggleFavorite = useCallback(async (id: string) => { const item = items.find(i => i.id === id); if (item) { await toggleMediaItemFavorite(id, !item.isFavorite); setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !item.isFavorite } : i)); } }, [items]);
  const handleDelete = useCallback(async (id: string) => { if (confirm("Löschen?")) { await deleteMediaItem(id); setItems(prev => prev.filter(i => i.id !== id)); } }, []);

  const handleAdd = async (result: SearchResult, status: WatchStatus = WatchStatus.TO_WATCH) => {
    if (!user || items.find(i => i.tmdbId === result.tmdbId && i.userId === user.id)) return;
    let details: any = {}; if (tmdbKey) details = await getMediaDetails(result, tmdbKey);
    let rtScore = undefined; if (omdbKey && (result.imdbId || details.imdbId)) rtScore = await getOmdbRatings(result.imdbId || details.imdbId, omdbKey);
    const newItem: any = { id: crypto.randomUUID(), userId: user.id, tmdbId: result.tmdbId, title: result.title, year: result.year, type: result.type, posterPath: result.posterPath, status, addedAt: Date.now(), isFavorite: false, userRating: 0, rtScore };
    const saved = await addMediaItem(newItem, user.id);
    if (saved) setItems(prev => [saved, ...prev]);
  };

  if (!user) return <AuthPage />;
  const displayedItems = items.filter(i => i.userId === user.id);

  const renderGrid = (statusFilter?: WatchStatus, listId?: string) => {
      let filtered = displayedItems;
      if (listId) { const list = customLists.find(l => l.id === listId); filtered = list ? items.filter(i => list.items.includes(i.id)) : []; }
      else if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
      if (filtered.length === 0) return <div className="py-20 text-center text-slate-500"><Clapperboard size={48} className="mx-auto mb-4 opacity-20" />{t('empty_state')}</div>;
      return <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">{filtered.map(item => <MediaCard key={item.id} item={item} onStatusChange={handleUpdateStatus} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onRate={() => {}} onClick={setSelectedItem} onAddToList={async (lid, iid) => { const list = customLists.find(cl => cl.id === lid); if (list) { const newItems = [...list.items, iid]; await updateCustomListItems(lid, newItems); loadData(); } }} />)}</div>;
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 pb-20 md:pb-0">
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-[#0B0E14] z-50">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><Clapperboard size={24} className="text-cyan-400" /><span className="font-bold text-xl">InFocus CineLog</span></div>
            <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-white/5 rounded-full"><Search size={20} /></button>
        </header>
        <div className="max-w-[1600px] mx-auto flex">
            <aside className="hidden md:flex w-64 flex-col p-6 border-r border-white/5 h-[calc(100vh-64px)] sticky top-16">
                <button onClick={() => setIsSearchOpen(true)} className="w-full bg-cyan-600 py-3 rounded-xl font-bold mb-8 flex items-center justify-center gap-2"><Plus size={20} />{t('add_button')}</button>
                <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('my_lists')}</div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 text-cyan-400 text-sm mb-4"><Plus size={16} />{t('create_list')}</button>
                {customLists.filter(l => l.ownerId === user.id).map(l => <button key={l.id} onClick={() => navigate(`/list/${l.id}`)} className="text-left py-2 text-sm text-slate-400 hover:text-white truncate">{l.name}</button>)}
                <div className="mt-auto"><AiRecommendationButton items={displayedItems} onAdd={handleAdd} apiKey={tmdbKey} /></div>
            </aside>
            <main className="flex-grow p-8">
                <Routes>
                    <Route path="/" element={<div><Stats items={displayedItems} /><div className="mb-6"><h2 className="text-2xl font-bold text-white">{t('collection')}</h2></div>{renderGrid()}</div>} />
                    <Route path="/watchlist" element={renderGrid(WatchStatus.TO_WATCH)} />
                    <Route path="/list/:id" element={<ListRoute customLists={customLists} renderGrid={renderGrid} />} />
                    <Route path="/profile" element={<ProfilePage items={displayedItems} />} />
                    <Route path="/users" element={<UserManagementPage />} />
                </Routes>
            </main>
        </div>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onAdd={handleAdd} apiKey={tmdbKey} />
        <CreateListModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateList} />
        {selectedItem && <DetailView item={selectedItem} isExisting={true} onClose={() => setSelectedItem(null)} apiKey={tmdbKey} onUpdateStatus={handleUpdateStatus} onToggleFavorite={handleToggleFavorite} />}
    </div>
  );
}