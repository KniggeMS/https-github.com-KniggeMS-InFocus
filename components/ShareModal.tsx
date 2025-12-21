import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Share2, User as UserIcon } from 'lucide-react';
import { fetchAllProfiles, shareCustomList } from '../services/db';
import { User, CustomList } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: CustomList | null;
  onShared: () => void; // Callback to refresh data in parent
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, list, onShared }) => {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && list) {
      setIsLoading(true);
      fetchAllProfiles()
        .then(profiles => {
          // Filter out the current user
          setAllUsers(profiles.filter(p => p.id !== currentUser?.id));
          // Pre-select users the list is already shared with
          setSelectedUserIds(list.sharedWith || []);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, list, currentUser]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (!list) return;
    setIsLoading(true);
    try {
      await shareCustomList(list.id, selectedUserIds);
      onShared(); // Notify parent to refresh
      onClose();
    } catch (error) {
      console.error("Failed to share list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !list) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#0B0E14] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
        
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <Share2 size={24} className="text-cyan-400" />
            <h2 className="text-2xl font-black text-white">Liste teilen</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6">Teile "<span className="font-bold text-white">{list.name}</span>" mit anderen Nutzern.</p>

          {isLoading ? (
            <div className="text-center p-8 text-slate-400">Lade Benutzer...</div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {allUsers.length > 0 ? allUsers.map(u => (
                <div key={u.id} onClick={() => handleToggleUser(u.id)} className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-slate-400 m-auto mt-2"/>}
                    </div>
                    <span className="font-bold text-sm text-white">{u.username}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.id)}
                    readOnly
                    className="w-5 h-5 rounded-md bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                </div>
              )) : <p className="text-slate-500 text-sm text-center">Keine anderen Nutzer gefunden.</p>}
            </div>
          )}
        </div>

        <div className="bg-black/20 px-8 py-4 border-t border-white/5 flex justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose} disabled={isLoading} className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50">Abbrechen</button>
          <button onClick={handleShare} disabled={isLoading} className="px-5 py-2.5 text-sm font-bold bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50">
            {isLoading ? 'Speichern...' : 'Änderungen speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};
