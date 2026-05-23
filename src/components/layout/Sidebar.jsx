// src/components/layout/Sidebar.jsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Shield, Search, FileText, BookOpen, Newspaper,
  BarChart3, Bot, Settings, User, LogOut, X, ChevronRight,
  Settings2, Users, ClipboardList, Edit, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard, group: 'main' },
  { href: '/dashboard/tahdidlar', label: 'Tahdidlarni aniqlash', icon: Shield, group: 'main', badge: 'YANGI' },
  { href: '/dashboard/zaiflik', label: 'Zaiflik skaneri', icon: Search, group: 'main' },
  { href: '/dashboard/hisobotlar', label: 'Hodisa hisobotlari', icon: FileText, group: 'main' },
  { href: '/dashboard/chat', label: 'AI Yordamchi', icon: Bot, group: 'main', badge: 'AI' },
  { href: '/dashboard/talim', label: "Ta'lim markazi", icon: BookOpen, group: 'learning' },
  { href: '/dashboard/yangiliklar', label: 'Yangiliklar', icon: Newspaper, group: 'learning' },
  { href: '/dashboard/analitika', label: 'Analitika', icon: BarChart3, group: 'analytics' },
];

const ADMIN_ITEMS = [
  { href: '/dashboard/admin', label: 'Admin paneli', icon: Settings2 },
  { href: '/dashboard/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: Users },
  { href: '/dashboard/admin/hisobotlar', label: 'Hisobotlarni boshqarish', icon: ClipboardList },
];

const GROUPS = {
  main: 'Asosiy',
  learning: "Ta'lim",
  analytics: 'Tahlil',
};

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, userProfile, chiqish, isAdmin } = useAuth();

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const groupedItems = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 z-30 hidden lg:flex flex-col">
        <div className="h-full glass-dark border-r border-cyber-border/30 flex flex-col">
          <SidebarContent
            groupedItems={groupedItems}
            isActive={isActive}
            adminItems={ADMIN_ITEMS}
            isAdmin={isAdmin}
            user={user}
            userProfile={userProfile}
            chiqish={chiqish}
            pathname={pathname}
          />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-72 z-30 lg:hidden"
          >
            <div className="h-full glass-dark border-r border-cyber-border/30 flex flex-col">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-cyber-gray/50 text-cyber-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent
                groupedItems={groupedItems}
                isActive={isActive}
                adminItems={ADMIN_ITEMS}
                isAdmin={isAdmin}
                user={user}
                userProfile={userProfile}
                chiqish={chiqish}
                pathname={pathname}
                onLinkClick={onClose}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({ groupedItems, isActive, adminItems, isAdmin, user, userProfile, chiqish, pathname, onLinkClick }) {
  return (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-cyber-border/20">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onLinkClick}>
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-cyber-accent/30" />
            <Shield className="w-5 h-5 text-cyber-accent" style={{ filter: 'drop-shadow(0 0 6px #00d4ff)' }} />
          </div>
          <div>
            <span className="font-display text-sm font-bold neon-text tracking-widest block">CYBERGUARD</span>
            <span className="text-cyber-text-muted text-xs">Kiberxavfsizlik tizimi</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group}>
            <p className="text-xs font-semibold text-cyber-text-muted uppercase tracking-wider mb-2 px-2">
              {GROUPS[group]}
            </p>
            <ul className="space-y-1">
              {items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  onClick={onLinkClick}
                />
              ))}
            </ul>
          </div>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <div>
            <p className="text-xs font-semibold text-cyber-text-muted uppercase tracking-wider mb-2 px-2">
              Administrator
            </p>
            <ul className="space-y-1">
              {adminItems.map((item) => (
                <NavItem key={item.href} item={item} active={isActive(item.href)} onClick={onLinkClick} />
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-cyber-border/20">
        <Link
          href="/dashboard/profil"
          onClick={onLinkClick}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group mb-2"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/40 flex-shrink-0">
            {(userProfile?.photoURL || user?.photoURL) ? (
              <img
                src={userProfile?.photoURL || user?.photoURL}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
                {userProfile?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userProfile?.displayName || 'Foydalanuvchi'}</p>
            <p className="text-xs text-cyber-text-muted truncate">{userProfile?.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-cyber-text-muted group-hover:text-cyber-accent transition-colors" />
        </Link>

        <div className="flex gap-2">
          <Link
            href="/dashboard/sozlamalar"
            onClick={onLinkClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-cyber-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <Settings className="w-3.5 h-3.5" />
            Sozlamalar
          </Link>
          <button
            onClick={() => { chiqish(); onLinkClick?.(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-red-400/70 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Chiqish
          </button>
        </div>
      </div>
    </>
  );
}

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative',
          active
            ? 'bg-cyber-accent/10 text-cyber-accent border-l-2 border-cyber-accent pl-[10px]'
            : 'text-cyber-text-secondary hover:text-white hover:bg-white/5'
        )}
      >
        <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-cyber-accent' : 'group-hover:text-cyber-accent transition-colors')} />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded font-bold',
            item.badge === 'AI' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyber-accent/20 text-cyber-accent'
          )}>
            {item.badge}
          </span>
        )}
        {active && (
          <motion.div
            layoutId="activeNavBg"
            className="absolute inset-0 rounded-lg bg-cyber-accent/5 -z-10"
          />
        )}
      </Link>
    </li>
  );
}
