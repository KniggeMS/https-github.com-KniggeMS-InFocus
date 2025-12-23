import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface RenameListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  currentName: string;
}

export const RenameListModal: React.FC<RenameListModalProps> = ({ isOpen, onClose, onRename, currentName }) => {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === currentName) {
      onClose();
      return;
    }
    setIsLoading(true);
    await onRename(name.trim());
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-white">Liste umbenennen</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Neuer Name der Liste
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="p-4 bg-slate-900/50 flex justify-end gap-2 border-t border-slate-700 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium rounded-lg">
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim() || name === currentName}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
