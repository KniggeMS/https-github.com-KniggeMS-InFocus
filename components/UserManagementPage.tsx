import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { fetchAllProfiles, updateUserRole, deleteUserProfile } from '../services/db';
import { User, UserRole } from '../types';
import { 
  Shield, Search, Trash2, Check, User as UserIcon, 
  Loader2, AlertCircle, Clock, Hash, Calendar 
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Berechtigungsprüfung basierend auf UserRole enum
    const canManage = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;

    useEffect(() => {
        if (canManage) {
            loadUsers();
        }
    }, [currentUser, canManage]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchAllProfiles();
            setUsers(data);
        } catch (e) {
            setError("Fehler beim Laden der Benutzer.");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
        if (!currentUser) return;
        if (targetUserId === currentUser.id) {
            setError(t('cant_edit_self'));
            return;
        }
        
        const targetUser = users.find(u => u.id === targetUserId);
        
        // Sicherheits-Checks für Hierarchie
        if (currentUser.role === UserRole.MANAGER && targetUser?.role === UserRole.ADMIN) {
            setError(t('cant_edit_admin'));
            return;
        }
        if (currentUser.role === UserRole.MANAGER && newRole === UserRole.ADMIN) {
             setError(t('access_denied'));
             return;
        }

        setActionLoading(targetUserId);
        setError('');
        setSuccess('');

        try {
            await updateUserRole(targetUserId, newRole);
            setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
            setSuccess(t('role_updated'));
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError("Update fehlgeschlagen.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (targetUserId: string) => {
        if (!currentUser) return;
        if (targetUserId === currentUser.id) return;
        
        const targetUser = users.find(u => u.id === targetUserId);
        if (currentUser.role === UserRole.MANAGER && targetUser?.role === UserRole.ADMIN) {
             setError(t('cant_edit_admin'));
             return;
        }
        
        if (!window.confirm(t('delete_user_confirm'))) return;
        
        setActionLoading(targetUserId);
        setError('');
        try {
            await deleteUserProfile(targetUserId);
            setUsers(prev => prev.filter(u => u.id !== targetUserId));
            setSuccess(t('user_deleted'));
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError("Löschen fehlgeschlagen.");
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (timestamp?: any, includeTime = true) => {
        if (!timestamp) return 'Unbekannt';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'Ungültiges Datum';
            return new Intl.DateTimeFormat('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
            }).format(date);
        } catch (e) {
            return 'Format Fehler';
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (!canManage || !currentUser) return <div className="p-10 text-center text-red-500 font-bold">{t('access_denied')}</div>;

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Shield className="text-cyan-400" size={32} /> {t('user_management')}
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">{users.length} registrierte Profile</p>
                </div>

                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('search_user')}
                        className="w-full md:w-72 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                    />
                </div>
            </div>

            {(error || success) && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border animate-in slide-in-from-top-2 ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                    {error ? <AlertCircle size={20} /> : <Check size={20} />} {error || success}
                </div>
            )}
            
            <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-xl">
                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <Loader2 size={40} className="animate-spin text-cyan-500"/>
                        <p className="text-slate-500 font-bold animate-pulse">Lade Datenbank...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="bg-white/5 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
                                <tr>
                                    <th className="p-6">Benutzer</th>
                                    <th className="p-6">Rolle</th>
                                    <th className="p-6"><div className="flex items-center gap-2"><Calendar size={12}/> Registriert</div></th>
                                    <th className="p-6"><div className="flex items-center gap-2"><Hash size={12}/> Logins</div></th>
                                    <th className="p-6"><div className="flex items-center gap-2"><Clock size={12}/> Letzter Login</div></th>
                                    <th className="p-6 text-right">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                                                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover"/> : <UserIcon size={24} className="text-slate-600"/>}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-white flex items-center gap-2 truncate">
                                                        {u.username}
                                                        {u.id === currentUser.id && <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">YOU</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {u.id === currentUser.id || (currentUser.role === UserRole.MANAGER && u.role === UserRole.ADMIN) ? (
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${u.role === UserRole.ADMIN ? 'border-red-500/30 text-red-400 bg-red-500/10' : u.role === UserRole.MANAGER ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' : 'border-slate-700 text-slate-500'}`}>
                                                    {u.role}
                                                </span>
                                            ) : (
                                                <select 
                                                    value={u.role} 
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                                    disabled={actionLoading === u.id}
                                                    className={`bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-cyan-500 transition-all ${u.role === UserRole.ADMIN ? 'text-red-400' : u.role === UserRole.MANAGER ? 'text-orange-400' : 'text-slate-300'}`}
                                                >
                                                    <option value={UserRole.USER}>USER</option>
                                                    <option value={UserRole.MANAGER}>MANAGER</option>
                                                    {currentUser.role === UserRole.ADMIN && <option value={UserRole.ADMIN}>ADMIN</option>}
                                                </select>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <div className="text-xs text-slate-400 font-medium">
                                                {formatDate(u.createdAt, false)}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-xs font-bold text-slate-300 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                                {u.loginCount || 0}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-xs text-slate-400 font-medium">
                                                {formatDate(u.lastLoginAt)}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            {u.id !== currentUser.id && !(currentUser.role === UserRole.MANAGER && u.role === UserRole.ADMIN) && (
                                                <button 
                                                    onClick={() => handleDelete(u.id)}
                                                    disabled={actionLoading === u.id}
                                                    className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"
                                                >
                                                    {actionLoading === u.id ? <Loader2 size={20} className="animate-spin"/> : <Trash2 size={20} />}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
