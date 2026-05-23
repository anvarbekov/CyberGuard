'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users, Search, MoreVertical, Shield, UserCheck, UserX,
  ChevronDown, Mail, Calendar, Activity
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config';
import { collection, getDocs, doc, updateDoc, orderBy, query, limit } from 'firebase/firestore';
import { ROLE_LABELS, ROLES } from '@/constants';
import { formatDate, maskEmail } from '@/utils';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  active: { label: 'Faol', color: 'text-green-400', bg: 'bg-green-500/10' },
  suspended: { label: 'Bloklangan', color: 'text-red-400', bg: 'bg-red-500/10' },
  pending: { label: 'Kutmoqda', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

export default function FoydalanuvchilarPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (!isAdmin) { router.replace('/dashboard'); return; }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(data);
    } catch {
      // Demo data
      setUsers([
        { id: '1', displayName: 'Admin Foydalanuvchi', email: 'admin@cyberguard.uz', role: 'admin', status: 'active', createdAt: new Date().toISOString(), lastActive: new Date().toISOString() },
        { id: '2', displayName: 'Alibek Karimov', email: 'alibek@gmail.com', role: 'talaba', status: 'active', createdAt: new Date(Date.now() - 86400000).toISOString(), lastActive: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', displayName: "Malika O'rinova", email: 'malika@gmail.com', role: 'oqituvchi', status: 'active', createdAt: new Date(Date.now() - 172800000).toISOString(), lastActive: new Date(Date.now() - 7200000).toISOString() },
        { id: '4', displayName: 'Jasur Nazarov', email: 'jasur@gmail.com', role: 'mutaxassis', status: 'active', createdAt: new Date(Date.now() - 259200000).toISOString(), lastActive: new Date(Date.now() - 86400000).toISOString() },
        { id: '5', displayName: 'Nodira Yusupova', email: 'nodira@gmail.com', role: 'talaba', status: 'suspended', createdAt: new Date(Date.now() - 345600000).toISOString(), lastActive: new Date(Date.now() - 259200000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole, updatedAt: new Date() });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success("Rol yangilandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus, updatedAt: new Date() });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success(newStatus === 'active' ? "Foydalanuvchi faollashtirildi" : "Foydalanuvchi bloklandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Foydalanuvchilar" subtitle="Tizim foydalanuvchilarini boshqarish"
        badge={`${users.length} ta`} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-cyber w-full pl-10" placeholder="Ism yoki email bo'yicha qidirish..." />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="input-cyber sm:w-48">
          <option value="">Barcha rollar</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="glass-card rounded-xl p-3 border border-white/10 text-center">
              <p className="text-xl font-bold text-white">{count}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Users table/list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl border border-white/10">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Foydalanuvchi topilmadi</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Foydalanuvchi', 'Rol', 'Holat', "Ro'yxatdan o'tgan", 'Amallar'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((u, i) => {
                  const statusConf = STATUS_CONFIG[u.status || 'active'];
                  return (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-sm font-bold text-cyan-400 flex-shrink-0">
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.displayName || 'Noma\'lum'}</p>
                            <p className="text-xs text-gray-400">{maskEmail(u.email)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select value={u.role || 'talaba'}
                          onChange={e => updateUserRole(u.id, e.target.value)}
                          disabled={u.id === user?.uid}
                          className="text-xs bg-transparent border border-white/10 rounded-lg px-2 py-1 text-gray-300 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k} className="bg-gray-900">{v}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConf.bg} ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-400">{formatDate(u.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={u.id === user?.uid}
                          onClick={() => setConfirmAction({ userId: u.id, currentStatus: u.status || 'active', name: u.displayName })}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                            ${(u.status || 'active') === 'active'
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}>
                          {(u.status || 'active') === 'active' ? 'Bloklash' : 'Faollashtirish'}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => toggleUserStatus(confirmAction.userId, confirmAction.currentStatus)}
        title={confirmAction?.currentStatus === 'active' ? 'Foydalanuvchini bloklash' : 'Faollashtirish'}
        message={`${confirmAction?.name || 'Foydalanuvchi'} ${confirmAction?.currentStatus === 'active' ? 'bloklansinmi?' : 'faollashtirilsinmi?'}`}
        confirmText={confirmAction?.currentStatus === 'active' ? 'Bloklash' : 'Faollashtirish'}
        danger={confirmAction?.currentStatus === 'active'}
      />
    </div>
  );
}
