'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, Shield, TrendingUp,
  Activity, AlertTriangle, CheckCircle, Clock, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';

const RISK_COLORS = {
  kritik: 'text-red-400 bg-red-500/10 border-red-500/20',
  yuqori: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  info: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  past: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0, totalReports: 0, totalThreats: 0, pendingReports: 0,
    activeUsers: 0, totalScans: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { router.replace('/dashboard'); return; }
    fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
        setRecentActivity(data.recentActivity || []);
        setMonthlyTrend(data.monthlyTrend || []);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Demo data fallback
      setStats({ totalUsers: 42, totalReports: 23, totalThreats: 187, pendingReports: 5, activeUsers: 18, totalScans: 95 });
      setRecentActivity([
        { id: 1, description: "Yangi hisobot: Phishing email aniqlandi", createdAt: new Date(Date.now() - 300000).toISOString(), risk: 75, type: 'threat' },
        { id: 2, description: "Yangi foydalanuvchi ro'yxatdan o'tdi", createdAt: new Date(Date.now() - 1380000).toISOString(), risk: 0, type: 'user' },
        { id: 3, description: "Kritik tahdid aniqlandi: 185.220.x.x", createdAt: new Date(Date.now() - 3600000).toISOString(), risk: 94, type: 'threat' },
        { id: 4, description: "Hisobot tasdiqlandi: Zararli fayl", createdAt: new Date(Date.now() - 7200000).toISOString(), risk: 20, type: 'report' },
        { id: 5, description: "Foydalanuvchi roli o'zgartirildi", createdAt: new Date(Date.now() - 10800000).toISOString(), risk: 0, type: 'admin' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} daqiqa oldin`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} soat oldin`;
    return `${Math.floor(hrs / 24)} kun oldin`;
  };

  const STAT_CARDS = [
    { label: 'Jami foydalanuvchilar', value: stats.totalUsers, icon: Users, color: 'cyan', href: '/dashboard/admin/foydalanuvchilar' },
    { label: 'Faol foydalanuvchilar', value: stats.activeUsers, icon: Activity, color: 'green', href: '/dashboard/admin/foydalanuvchilar' },
    { label: 'Jami tahdidlar', value: stats.totalThreats, icon: Shield, color: 'red', href: '/dashboard/tahdidlar' },
    { label: 'Kutayotgan hisobotlar', value: stats.pendingReports, icon: Clock, color: 'yellow', href: '/dashboard/admin/hisobotlar' },
    { label: 'Jami hisobotlar', value: stats.totalReports, icon: FileText, color: 'violet', href: '/dashboard/admin/hisobotlar' },
    { label: 'Skanerlashlar', value: stats.totalScans, icon: TrendingUp, color: 'blue', href: '/dashboard/zaiflik' },
  ];

  const colorMap = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Admin Panel"
        subtitle="Tizim statistikasi va boshqaruvchi paneli"
        badge="Admin"
      />

      {/* Pending reports alert */}
      {stats.pendingReports > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-300">
              {stats.pendingReports} ta yangi hisobot ko'rib chiqilishini kutmoqda
            </p>
          </div>
          <Link href="/dashboard/admin/hisobotlar"
            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors whitespace-nowrap">
            Ko'rish
          </Link>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon;
          const colors = colorMap[card.color];
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}>
              <Link href={card.href}
                className={`block p-5 rounded-2xl bg-gradient-to-br border glass-card hover:scale-[1.02] transition-transform ${colors}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-current/10`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-2xl font-bold text-white mb-0.5">
                  {loading ? <span className="animate-pulse">—</span> : card.value.toLocaleString()}
                </p>
                <p className="text-xs opacity-70">{card.label}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="glass-card rounded-2xl border border-white/10 p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Tezkor harakatlar
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: '/dashboard/admin/foydalanuvchilar', label: 'Foydalanuvchilarni boshqarish', icon: Users },
            { href: '/dashboard/admin/hisobotlar', label: 'Hisobotlarni ko\'rib chiqish', icon: FileText },
            { href: '/dashboard/analitika', label: 'Analitika ko\'rish', icon: TrendingUp },
          ].map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}
                className="flex items-center gap-2 p-3 rounded-xl border border-white/10 hover:bg-white/5 hover:border-cyan-500/30 transition-all group">
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                <span className="text-xs text-gray-300 group-hover:text-white transition-colors">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            So'nggi faollik
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-white/5 rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Faollik topilmadi</div>
          ) : (
            recentActivity.map((activity, i) => {
              const riskLevel = activity.risk >= 80 ? 'kritik' : activity.risk >= 50 ? 'yuqori' : activity.risk > 0 ? 'past' : 'info';
              const colors = RISK_COLORS[riskLevel];
              return (
                <motion.div key={activity.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${colors}`}>
                    {activity.risk >= 80 ? <AlertTriangle className="w-3.5 h-3.5" /> :
                      activity.risk >= 50 ? <Shield className="w-3.5 h-3.5" /> :
                      activity.risk > 0 ? <CheckCircle className="w-3.5 h-3.5" /> :
                      <Activity className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{timeAgo(activity.createdAt)}</p>
                  </div>
                  {activity.risk > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${colors}`}>
                      {activity.risk}%
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
