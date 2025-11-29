
import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { CustomList } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: CustomList;
  onShare: (listId: string, userIds: string[]) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, list, onShare }) => {
  const { t } = useTranslation();
  const { getAllUsers, user: currentUser } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<string[]>(list.sharedWith || []);

  if (!isOpen) return null;

  const allUsers = getAllUsers().filter(u => u.id !== currentUser?.id);

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSave = () => {
    onShare(list.id, selectedUsers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <UserPlus size={18} className="text-cyan-400"/> {t('share_with_friends')}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
           {allUsers.length === 0 ? (
               <div className="text-slate-500 text-center py-4 text-sm">Keine anderen Benutzer gefunden.</div>
           ) : (
               <div className="space-y-2">
                   {allUsers.map(u => {
                       const isSelected = selectedUsers.includes(u.id);
                       return (
                           <button 
                                key={u.id}
                                onClick={() => toggleUser(u.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected ? 'bg-cyan-900/30 border-cyan-500/50' : 'bg-slate-700/30 border-transparent hover:bg-slate-700'}`}
                           >
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-slate-600 overflow-hidden">
                                       {u.avatar ? <img src={u.avatar} alt={u.username} className="w-full h-full object-cover"/> : null}
                                   </div>
                                   <span className={`text-sm font-medium ${isSelected ? 'text-cyan-100' : 'text-slate-300'}`}>{u.username}</span>
                               </div>
                               {isSelected && <Check size={16} className="text-cyan-400" />}
                           </button>
                       );
                   })}
               </div>
           )}
        </div>

        <div className="p-4 bg-slate-900/50 flex justify-end gap-2 border-t border-slate-700">
            <button onClick={onClose} className="px-3 py-2 text-slate-400 hover:text-white text-sm">{t('cancel')}</button>
            <button 
                onClick={handleSave}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
                {t('share')} ({selectedUsers.length})
            </button>
        </div>
      </div>
    </div>
  );
};
