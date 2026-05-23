'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!loading) {
      router.replace(isAuthenticated ? '/dashboard' : '/auth/kirish');
    }
  }, [isAuthenticated, loading, router, mounted]);

  // Minimal loading indicator — no complex components to avoid hydration issues
  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl border-2 border-t-cyan-400 border-cyan-400/20 animate-spin" />
        <p className="text-gray-400 text-sm font-sans">CyberGuard UZ...</p>
      </div>
    </div>
  );
}
