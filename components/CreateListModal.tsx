
import React, { useState } from 'react';
import { X, ListPlus } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreateListModal: React.FC<CreateListModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
        onCreate(name);
        setName('');
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <ListPlus size={18} className="text-cyan-400"/> {t('create_list')}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
            <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('list_name')}
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-cyan-500 focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-3 py-2 text-slate-400 hover:text-white text-sm">{t('cancel')}</button>
                <button 
                    type="submit"
                    disabled={!name.trim()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {t('create')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
