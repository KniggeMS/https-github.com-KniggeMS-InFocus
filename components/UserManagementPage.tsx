import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { fetchAllProfiles, updateUserRole, deleteUserProfile } from '../services/db';
import { User, UserRole } from '../types';
import { Shield, Search, Trash2, Check, User as UserIcon, Loader2, AlertCircle, Clock, Hash, Calendar } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const canManage = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;

    useEffect(() => {
        if (canManage) {
            loadUsers();
        }
    }, [currentUser]);

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

    /**
     * @Sicherheitshinweis: Diese Funktion ist jetzt "defensiv" programmiert.
     * Selbst wenn 'createdAt' kein gültiger Timestamp ist, stürzt die App nicht ab.
     */
    const formatDate = (timestamp?: any, includeTime = true) => {
        if (!timestamp) return 'Unbekannt';
        
        try {
            const date = new Date(timestamp);
            // Check ob das Datum valide ist
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

    if (!canManage) return <div className="p-10 text-center text-red-500">{t('access_denied')}</div>;

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-cyan-400" /> {t('user_management')}
                    </h1>
                    <p className="text-slate-400 mt-1">{users.length} registrierte Benutzer</p>
                </div>

                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('search_user')}
                        className="w-full md:w-64 bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
                    <AlertCircle size={20} /> {error}
                </div>
            )}
            
            {success && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-2">
                    <Check size={20} /> {success}
                </div>
            )}

            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-10 flex justify-center"><Loader2 size={32} className="animate-spin text-cyan-500"/></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-4 pl-6">Benutzer</th>
                                    <th className="p-4">Rolle</th>
                                    <th className="p-4">
                                        <div className="flex items-center gap-1 text-emerald-400">
                                            <Calendar size={12}/> Registriert
                                        </div>
                                    </th>
                                    <th className="p-4">
                                        <div className="flex items-center gap-1 text-cyan-400">
                                            <Hash size={12}/> Logins
                                        </div>
                                    </th>
                                    <th className="p-4">
                                        <div className="flex items-center gap-1 text-cyan-400">
                                            <Clock size={12}/> Letzter Login
                                        </div>
                                    </th>
                                    <th className="p-4 text-right pr-6">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-slate-500"/>}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white flex items-center gap-2">
                                                        {u.username}
                                                        {u.id === currentUser.id && <span className="text-[10px] bg-cyan-900 text-cyan-400 px-1.5 py-0.5 rounded">DU</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {u.id === currentUser.id || (currentUser.role === UserRole.MANAGER && u.role === UserRole.ADMIN) ? (
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${u.role === UserRole.ADMIN ? 'border-red-500/30 text-red-400 bg-red-500/10' : u.role === UserRole.MANAGER ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' : 'border-slate-600 text-slate-400'}`}>
                                                    {u.role}
                                                </span>
                                            ) : (
                                                <select 
                                                    value={u.role} 
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                                    disabled={actionLoading === u.id}
                                                    className={`bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:border-cyan-500 ${u.role === UserRole.ADMIN ? 'text-red-400' : u.role === UserRole.MANAGER ? 'text-orange-400' : 'text-slate-300'}`}
                                                >
                                                    <option value={UserRole.USER}>USER</option>
                                                    <option value={UserRole.MANAGER}>MANAGER</option>
                                                    {currentUser.role === UserRole.ADMIN && <option value={UserRole.ADMIN}>ADMIN</option>}
                                                </select>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-slate-400 font-medium">
                                                {/* CRITICAL: u.createdAt muss ein Timestamp (Number) sein */}
                                                {formatDate(u.createdAt, false)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-mono text-slate-300 bg-slate-900/50 inline-block px-2.5 py-1 rounded-lg border border-white/5">
                                                {u.loginCount || 0}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-slate-400 font-medium">
                                                {formatDate(u.lastLoginAt)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            {u.id !== currentUser.id && !(currentUser.role === UserRole.MANAGER && u.role === UserRole.ADMIN) && (
                                                <button 
                                                    onClick={() => handleDelete(u.id)}
                                                    disabled={actionLoading === u.id}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    {actionLoading === u.id ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />}
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
