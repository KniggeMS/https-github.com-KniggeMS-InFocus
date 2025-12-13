
import React, { useMemo } from 'react';
import { X, Crown, Trophy, Lock, CheckCircle, Timer, Film, Tv, Star, BrainCircuit, Hourglass, Library, Popcorn } from 'lucide-react';
import { User, MediaItem, CustomList } from '../types';
import { calculateUserStats, calculateLevel, getAchievements } from '../services/gamification';
import { useTranslation } from '../contexts/LanguageContext';

interface PublicProfileModalProps {
  user: User;
  allLists: CustomList[];
  allItems: MediaItem[];
  onClose: () => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ user, allLists, allItems, onClose }) => {
  const { t } = useTranslation();

  // Calculate Stats based on Lists Shared by this User
  // Note: In this local-first demo, we approximate the user's collection by looking at lists they own.
  // In a real backend, we would fetch the user's specific collection.
  const userStatsData = useMemo(() => {
    if (!user.isStatsPublic) return null;

    // Find all lists owned by this user
    const userLists = allLists.filter(l => l.ownerId === user.id);
    const itemIds = new Set<string>();
    userLists.forEach(l => l.items.forEach(id => itemIds.add(id)));

    // Get the actual items from the global store
    const userCollection = allItems.filter(i => itemIds.has(i.id));

    const stats = calculateUserStats(userCollection);
    const levelData = calculateLevel(stats);
    const achievements = getAchievements(userCollection, stats);

    return { stats, levelData, achievements };
  }, [user, allLists, allItems]);

  const IconMap: Record<string, any> = {
      Popcorn, Library, Tv, Star, BrainCircuit, Hourglass, Timer
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with Avatar */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center border-b border-slate-700">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
            
            <div className="w-24 h-24 rounded-full border-4 border-slate-700 bg-slate-800 mx-auto mb-4 overflow-hidden shadow-xl">
                {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-2xl">
                        {user.username[0]}
                    </div>
                )}
            </div>
            
            <h2 className="text-2xl font-bold text-white">{user.username}</h2>
            {userStatsData && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-900/50 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-bold mt-2">
                    <Crown size={12} /> {userStatsData.levelData.title}
                </div>
            )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
            {!user.isStatsPublic ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Lock size={48} className="mb-4 opacity-50" />
                    <p>{t('private_profile')}</p>
                </div>
            ) : userStatsData ? (
                <div className="space-y-8">
                     {/* Level Progress */}
                     <div className="text-center">
                        <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase tracking-widest font-bold">
                            <span>Lvl {userStatsData.levelData.currentLevel}</span>
                            <span>{Math.floor(userStatsData.levelData.xp)} XP</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full rounded-full" style={{ width: `${userStatsData.levelData.progress}%` }}></div>
                        </div>
                     </div>

                     {/* Stats Grid */}
                     <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center">
                            <div className="text-2xl font-bold text-white mb-1">{userStatsData.stats.moviesWatched}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">{t('movies_watched')}</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center">
                            <div className="text-2xl font-bold text-white mb-1">{userStatsData.stats.seriesWatched}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">{t('series_watched')}</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center">
                            <div className="text-2xl font-bold text-white mb-1">{Math.floor(userStatsData.stats.totalRuntimeMinutes / 60)}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">{t('hours')}</div>
                        </div>
                     </div>

                     {/* Trophies */}
                     <div>
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy size={16} className="text-yellow-500" /> {t('achievements')}
                        </h3>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            {userStatsData.achievements.map(ach => {
                                const Icon = IconMap[ach.icon] || Trophy;
                                return (
                                    <div 
                                        key={ach.id} 
                                        className={`aspect-square rounded-xl flex items-center justify-center relative group ${ach.unlocked ? 'bg-slate-700 text-yellow-500' : 'bg-slate-900 text-slate-700'}`}
                                        title={t(`ach_${ach.id}_title`)}
                                    >
                                        <Icon size={20} />
                                        {ach.unlocked && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>}
                                    </div>
                                );
                            })}
                        </div>
                     </div>
                </div>
            ) : null}
        </div>

      </div>
    </div>
  );
};
