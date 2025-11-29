
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { generateAvatar } from '../services/gemini';
import { User, Lock, Upload, Sparkles, Loader2, Save, CheckCircle, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
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

  // Password Form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');

  // Avatar Gen
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

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
          avatar
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

  const handleGenerateAvatar = async () => {
    if (!username) return;
    setIsGeneratingImg(true);
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

  return (
    <div className="max-w-4xl mx-auto pb-20">
       <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
           <User size={32} className="text-cyan-400" /> {t('profile')}
       </h2>

       {(successMsg || errorMsg) && (
           <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${successMsg ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
               {successMsg ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
               <span>{successMsg || errorMsg}</span>
           </div>
       )}

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
                                   {isGeneratingImg ? t('generating') : t('generate_avatar')}
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
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('new_password')}</label>
                           <input 
                               type="password" 
                               value={newPw}
                               onChange={e => setNewPw(e.target.value)}
                               className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                               required
                               minLength={6}
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
                               minLength={6}
                           />
                       </div>

                       <button 
                           type="submit"
                           disabled={isLoading || !currentPw || !newPw}
                           className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-900/20 transition-all mt-2"
                       >
                           {t('change_password')}
                       </button>
                   </form>
               </div>
           </div>
       </div>
    </div>
  );
};
