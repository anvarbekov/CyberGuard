'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function DashboardLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.replace('/auth/kirish');
    }
  }, [isAuthenticated, loading, router, mounted]);

  // Before client mounts — render nothing to avoid hydration mismatch
  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex">
        <div className="w-72 hidden lg:block bg-[#0a0f1e] border-r border-white/5" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-[#0a0f1e] border-b border-white/5" />
          <div className="flex-1 p-6 space-y-4">
            <div className="h-7 bg-white/5 rounded-lg w-56 animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0,1,2,3].map(i => <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-56 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-56 bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-cyber-black flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
