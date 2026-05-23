// src/components/layout/TopBar.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, X, Shield, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { notificationOps } from '@/firebase/collections';
import { timeAgo } from '@/utils';

const PAGE_TITLES = {
  '/dashboard': 'Boshqaruv paneli',
  '/dashboard/tahdidlar': 'Tahdidlarni aniqlash',
  '/dashboard/zaiflik': 'Zaiflik skaneri',
  '/dashboard/hisobotlar': 'Hodisa hisobotlari',
  '/dashboard/chat': 'AI Xavfsizlik Yordamchisi',
  '/dashboard/talim': "Ta'lim markazi",
  '/dashboard/yangiliklar': 'Kiberxavfsizlik yangiliklari',
  '/dashboard/analitika': 'Analitika va statistika',
  '/dashboard/profil': 'Profil',
  '/dashboard/sozlamalar': 'Sozlamalar',
  '/dashboard/admin': 'Administrator paneli',
  '/dashboard/admin/foydalanuvchilar': 'Foydalanuvchilarni boshqarish',
  '/dashboard/admin/hisobotlar': 'Hisobotlarni boshqarish',
};

export default function TopBar({ onMenuClick }) {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef(null);

  const pageTitle = PAGE_TITLES[pathname] || 'CyberGuard UZ';
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const unsub = notificationOps.onUserNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationOps.markAllRead(user.uid);
  };

  return (
    <header className="sticky top-0 z-10 glass-dark border-b border-cyber-border/20 px-4 lg:px-6 h-16 flex items-center gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-cyber-text-muted hover:text-white hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
        <div className="flex items-center gap-1.5 text-xs text-cyber-text-muted">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
          <span>Tizim aktiv</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 rounded-lg text-cyber-text-muted hover:text-white hover:bg-white/5 transition-colors"
          title="Qidirish"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg text-cyber-text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-glow-red" />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl border border-cyber-border/30 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-cyber-border/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyber-accent" />
                    <span className="text-sm font-semibold text-white">Bildirishnomalar</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-cyber-accent/20 text-cyber-accent rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-cyber-accent hover:text-cyber-accent/80"
                    >
                      Barchasini o'qi
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-cyber-text-muted mx-auto mb-2" />
                      <p className="text-sm text-cyber-text-muted">Bildirishnoma yo'q</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <NotifItem
                        key={notif.id}
                        notif={notif}
                        onRead={() => notificationOps.markRead(notif.id)}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <Link href="/dashboard/profil" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/40 flex-shrink-0">
            {(userProfile?.photoURL || user?.photoURL) ? (
              <img
                src={userProfile?.photoURL || user?.photoURL}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                {userProfile?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 p-4 glass-dark border-b border-cyber-border/20"
          >
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-muted" />
              <input
                autoFocus
                type="text"
                placeholder="Qidirish — tahdid, IP, URL..."
                className="input-cyber pl-10 pr-10"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NotifItem({ notif, onRead }) {
  const icons = {
    threat: <Shield className="w-4 h-4 text-red-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    info: <Info className="w-4 h-4 text-cyber-accent" />,
    success: <CheckCircle className="w-4 h-4 text-green-400" />,
  };

  return (
    <button
      onClick={onRead}
      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-cyber-border/10 last:border-0 flex gap-3 ${!notif.read ? 'bg-cyber-accent/3' : ''}`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {icons[notif.type] || icons.info}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${!notif.read ? 'text-white' : 'text-cyber-text-secondary'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-cyber-text-muted mt-0.5 line-clamp-1">{notif.message}</p>
        <p className="text-xs text-cyber-text-muted/70 mt-1">{timeAgo(notif.createdAt)}</p>
      </div>
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-cyber-accent mt-1.5 flex-shrink-0" />
      )}
    </button>
  );
}
