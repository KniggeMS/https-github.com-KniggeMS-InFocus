import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { generateAvatar } from '../services/gemini';
import { calculateUserStats, calculateLevel, getAchievements } from '../services/gamification';
import { MediaItem, UserRole } from '../types';
import { User, Lock, Upload, Sparkles, Loader2, Save, CheckCircle, AlertCircle, Trophy, Star, Tv, Film, Timer, BrainCircuit, Hourglass, Library, Popcorn, Crown, Eye, Shield, EyeOff, Calendar, Key, List } from 'lucide-react';

interface ProfilePageProps {
    items: MediaItem[];
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ items }) => {
  const { user, updateProfile, changePassword } = useAuth();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Form
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);
  const [isStatsPublic, setIsStatsPublic] = useState(user?.isStatsPublic || false);

  // Password Form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');

  // Admin Promotion
  const [adminCode, setAdminCode] = useState('');

  // Avatar Gen
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // Gamification Data
  const stats = useMemo(() => calculateUserStats(items), [items]);
  const levelData = useMemo(() => calculateLevel(stats), [stats]);
  const achievements = useMemo(() => getAchievements(items, stats), [items, stats]);

  // Icon Mapping for dynamic rendering
  const IconMap: Record<string, any> = {
      Popcorn, Library, Tv, Star, BrainCircuit, Hourglass, Timer
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      updateProfile({
          username,
          email,
          firstName,
          lastName,
          avatar,
          isStatsPublic
      });
      setSuccessMsg(t('profile_updated'));
    } catch (err: any) {
      setErrorMsg(err.message || "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (newPw.length < 8) {
        setErrorMsg("Neues Passwort muss mindestens 8 Zeichen lang sein.");
        setIsLoading(false);
        return;
    }

    if (newPw !== confirmNewPw) {
        setErrorMsg("Passwörter stimmen nicht überein");
        setIsLoading(false);
        return;
    }

    try {
        changePassword(currentPw, newPw);
        setSuccessMsg(t('password_updated'));
        setCurrentPw('');
        setNewPw('');
        setConfirmNewPw('');
    } catch (err: any) {
        setErrorMsg(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (adminCode === 'DirectorCut') {
        try {
            await updateProfile({ role: UserRole.ADMIN });
            setSuccessMsg("Glückwunsch! Du bist jetzt Administrator.");
            setAdminCode('');
        } catch (err: any) {
            setErrorMsg("Fehler beim Upgrade: " + err.message);
        }
    } else {
        setErrorMsg("Ungültiger Studio-Code.");
    }
    setIsLoading(false);
  };

  const handleGenerateAvatar = async () => {
    if (!username) return;
    setIsGeneratingImg(true);
    // Updated: Only username needed for DiceBear
    const imgData = await generateAvatar(username);
    if (imgData) {
        setAvatar(imgData);
    }
    setIsGeneratingImg(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  const getRoleLabel = (role: UserRole) => {
      switch(role) {
          case UserRole.ADMIN: return t('role_admin');
          case UserRole.MANAGER: return t('role_manager');
          default: return t('role_user');
      }
  };

  const getRoleColor = (role: UserRole) => {
      switch(role) {
          case UserRole.ADMIN: return 'bg-red-500 text-white';
          case UserRole.MANAGER: return 'bg-orange-500 text-white';
          default: return 'bg-slate-700 text-slate-300';
      }
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString();

  return (
    <div className="max-w-6xl mx-auto pb-20">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
           <h2 className="text-3xl font-bold text-white flex items-center gap-3">
               <User size={32} className="text-cyan-400" /> {t('profile')}
           </h2>
           <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                    <Calendar size={12} />
                    <span>{t('member_since')}: {memberSince}</span>
               </div>
               <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-lg ${getRoleColor(user.role)}`}>
                   <Shield size={12} /> {getRoleLabel(user.role)}
               </span>
           </div>
       </div>

       {(successMsg || errorMsg) && (
           <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${successMsg ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
               {successMsg ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
               <span>{successMsg || errorMsg}</span>
           </div>
       )}
       
       {/* GAMIFICATION DASHBOARD */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* Level Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-cyan-600/20 transition-colors"></div>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-cyan-500 flex items-center justify-center shadow-xl shadow-cyan-900/30">
                            <Crown size={40} className="text-cyan-400" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-cyan-600 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-slate-800">
                            Lvl {levelData.currentLevel}
                        </div>
                    </div>
                    
                    <div className="flex-grow w-full text-center sm:text-left">
                        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-1">{t('level')} {levelData.currentLevel}</h3>
                        <h2 className="text-3xl font-extrabold text-white mb-3">{levelData.title}</h2>
                        
                        <div className="w-full bg-slate-700/50 rounded-full h-4 mb-2 overflow-hidden border border-slate-700">
                            <div 
                                className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${levelData.progress}%` }}
                            ></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-slate-400 font-mono">
                            <span>{Math.floor(levelData.xp).toLocaleString()} XP</span>
                            <span>{t('next_level')}: {Math.floor(levelData.nextLevelXp).toLocaleString()} XP</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col justify-center">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">{t('stats')}</h4>
                 <div className="space-y-4">
                     {/* Collection Size (Always populated if user has items) */}
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-slate-300">
                             <div className="p-2 bg-slate-700 rounded-lg"><List size={16} className="text-emerald-400"/></div>
                             <span className="text-sm">In Sammlung</span>
                         </div>
                         <span className="text-white font-bold font-mono">{stats.collectionSize}</span>
                     </div>

                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-slate-300">
                             <div className="p-2 bg-slate-700 rounded-lg"><Timer size={16} className="text-orange-400"/></div>
                             <span className="text-sm">{t('total_time')}</span>
                         </div>
                         <span className="text-white font-bold font-mono">{(stats.totalRuntimeMinutes / 60).toFixed(1)} {t('hours')}</span>
                     </div>
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-slate-300">
                             <div className="p-2 bg-slate-700 rounded-lg"><Film size={16} className="text-blue-400"/></div>
                             <span className="text-sm">{t('movies_watched')}</span>
                         </div>
                         <span className="text-white font-bold font-mono">{stats.moviesWatched}</span>
                     </div>
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-slate-300">
                             <div className="p-2 bg-slate-700 rounded-lg"><Tv size={16} className="text-purple-400"/></div>
                             <span className="text-sm">{t('series_watched')}</span>
                         </div>
                         <span className="text-white font-bold font-mono">{stats.seriesWatched}</span>
                     </div>
                 </div>
            </div>

            {/* Achievements Grid */}
            <div className="md:col-span-3 bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} /> {t('achievements')}
                    <span className="text-xs font-normal text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full ml-2">
                        {achievements.filter(a => a.unlocked).length} / {achievements.length}
                    </span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {achievements.map(ach => {
                        const Icon = IconMap[ach.icon] || Trophy;
                        return (
                            <div 
                                key={ach.id} 
                                className={`relative p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                                    ach.unlocked 
                                        ? 'bg-gradient-to-b from-slate-700/50 to-slate-800 border-yellow-500/30 shadow-lg shadow-black/20 group hover:scale-105 hover:border-yellow-500/50' 
                                        : 'bg-slate-900/50 border-slate-800 opacity-60 grayscale'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${ach.unlocked ? 'bg-yellow-500/20 text-yellow-500 shadow-inner' : 'bg-slate-800 text-slate-600'}`}>
                                    <Icon size={24} />
                                </div>
                                <h4 className={`text-xs font-bold mb-1 ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>
                                    {t(`ach_${ach.id}_title`)}
                                </h4>
                                <p className="text-[10px] text-slate-400 leading-tight mb-2 h-8 overflow-hidden">
                                    {t(`ach_${ach.id}_desc`)}
                                </p>
                                
                                {/* Progress Bar for Locked Items */}
                                {!ach.unlocked && (
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-auto overflow-hidden">
                                        <div className="bg-slate-600 h-full rounded-full" style={{ width: `${ach.progress}%` }}></div>
                                    </div>
                                )}
                                {ach.unlocked && <CheckCircle size={14} className="text-green-500 mt-auto" />}
                            </div>
                        );
                    })}
                </div>
            </div>
       </div>

       {/* SETTINGS GRID */}
       <div className="grid md:grid-cols-3 gap-8">
           
           {/* Left Column: Avatar & Basic Info */}
           <div className="md:col-span-2 space-y-6">
               <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                   <h3 className="text-lg font-semibold text-white mb-6 border-b border-slate-700 pb-2">{t('edit_profile')}</h3>
                   
                   <div className="flex flex-col sm:flex-row gap-8 items-start">
                       {/* Avatar Editor */}
                       <div className="flex flex-col items-center gap-4">
                           <div className="w-32 h-32 rounded-full bg-slate-700 overflow-hidden border-4 border-slate-600 relative group shadow-xl">
                               {avatar ? (
                                   <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                               ) : (
                                   <div className="w-full h-full flex items-center justify-center text-slate-500">
                                       <User size={48} />
                                   </div>
                               )}
                           </div>
                           
                           <div className="flex flex-col gap-2 w-full">
                               <button 
                                   type="button" 
                                   onClick={handleGenerateAvatar}
                                   disabled={isGeneratingImg}
                                   className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors w-full disabled:opacity-50"
                               >
                                   {isGeneratingImg ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                                   {isGeneratingImg ? t('generating') : "Auto Avatar (AI)"}
                               </button>
                               <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg cursor-pointer transition-colors w-full">
                                   <Upload size={12} />
                                   {t('or_upload')}
                                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                               </label>
                           </div>
                       </div>

                       {/* Form Fields */}
                       <form onSubmit={handleUpdateProfile} className="flex-grow space-y-4 w-full">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('firstname')}</label>
                                   <input 
                                       type="text" 
                                       value={firstName}
                                       onChange={e => setFirstName(e.target.value)}
                                       className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('lastname')}</label>
                                   <input 
                                       type="text" 
                                       value={lastName}
                                       onChange={e => setLastName(e.target.value)}
                                       className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                   />
                               </div>
                           </div>

                           <div>
                               <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('username')}</label>
                               <input 
                                   type="text" 
                                   value={username}
                                   onChange={e => setUsername(e.target.value)}
                                   className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                               />
                           </div>

                           <div>
                               <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('email')}</label>
                               <input 
                                   type="email" 
                                   value={email}
                                   onChange={e => setEmail(e.target.value)}
                                   className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                               />
                           </div>
                           
                           {/* Privacy Setting Toggle */}
                           <div className="pt-2 border-t border-slate-700/50 mt-2">
                               <label className="flex items-center gap-3 cursor-pointer group">
                                   <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isStatsPublic ? 'bg-cyan-600' : 'bg-slate-700'}`} onClick={() => setIsStatsPublic(!isStatsPublic)}>
                                       <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${isStatsPublic ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                   </div>
                                   <div className="flex flex-col">
                                       <span className="text-sm font-bold text-white flex items-center gap-2">
                                           {isStatsPublic ? <Eye size={14} className="text-cyan-400"/> : <EyeOff size={14} className="text-slate-400"/>}
                                           {t('public_stats')}
                                       </span>
                                       <span className="text-[10px] text-slate-500">{t('public_stats_desc')}</span>
                                   </div>
                               </label>
                           </div>

                           <div className="pt-4">
                               <button 
                                   type="submit"
                                   disabled={isLoading}
                                   className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
                               >
                                   {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                                   {t('save_changes')}
                               </button>
                           </div>
                       </form>
                   </div>
               </div>
           </div>

           {/* Right Column: Security */}
           <div className="space-y-6">
               <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                   <h3 className="text-lg font-semibold text-white mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
                       <Lock size={20} className="text-orange-400"/> {t('security')}
                   </h3>
                   
                   <form onSubmit={handleChangePassword} className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('current_password')}</label>
                           <input 
                               type="password" 
                               value={currentPw}
                               onChange={e => setCurrentPw(e.target.value)}
                               className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                               required
                           />
                       </div>
                       
                       <hr className="border-slate-700 my-4 opacity-50"/>

                       <div>
                           <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-slate-400 uppercase">{t('new_password')}</label>
                                {newPw.length > 0 && newPw.length < 8 && <span className="text-[10px] text-red-400">Min. 8 Zeichen</span>}
                           </div>
                           <input 
                               type="password" 
                               value={newPw}
                               onChange={e => setNewPw(e.target.value)}
                               className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none transition-colors ${newPw && newPw.length < 8 ? 'border-red-500/50' : 'border-slate-600'}`}
                               required
                               minLength={8}
                           />
                       </div>

                       <div>
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('confirm_password')}</label>
                           <input 
                               type="password" 
                               value={confirmNewPw}
                               onChange={e => setConfirmNewPw(e.target.value)}
                               className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                               required
                               minLength={8}
                           />
                       </div>

                       <button 
                           type="submit"
                           disabled={isLoading || !currentPw || !newPw || newPw.length < 8}
                           className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-900/20 transition-all mt-2 disabled:opacity-50 disabled:grayscale"
                       >
                           {t('change_password')}
                       </button>
                   </form>

                   {/* ADMIN PROMOTION CHEAT CODE SECTION */}
                   {user.role !== UserRole.ADMIN && (
                       <div className="mt-8 border-t border-slate-700 pt-6">
                           <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                               <Key size={12} /> Studio Zugang
                           </h3>
                           <form onSubmit={handleClaimAdmin} className="flex gap-2">
                               <input 
                                   type="text" 
                                   value={adminCode}
                                   onChange={e => setAdminCode(e.target.value)}
                                   placeholder="Studio Pass..."
                                   className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                               />
                               <button 
                                   type="submit"
                                   disabled={isLoading || !adminCode}
                                   className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
                               >
                                   Claim
                               </button>
                           </form>
                       </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};