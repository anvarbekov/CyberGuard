'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ParolTiklashPage() {
  const { parolniTiklash } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Email kiriting"); return; }
    setError('');
    setIsLoading(true);
    try {
      await parolniTiklash(email);
      setSent(true);
    } catch {
      setError("Email manzil topilmadi yoki xato yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid bg-[length:40px_40px] opacity-30" />
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Parolni tiklash</h1>
          <p className="text-gray-400 text-sm mt-1">Email manzilingizga havola yuboramiz</p>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-8">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Havola yuborildi!</h3>
              <p className="text-sm text-gray-400 mb-6">
                <span className="text-cyan-400">{email}</span> manziliga parolni tiklash havolasi yuborildi.
                Email qutingizni tekshiring.
              </p>
              <Link href="/auth/kirish" className="btn-cyber-solid px-6 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />Kirish sahifasiga
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email manzil</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    className="input-cyber w-full pl-10"
                    placeholder="email@example.com"
                    autoComplete="email"
                  />
                </div>
                {error && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{error}
                  </p>
                )}
              </div>

              <button type="submit" disabled={isLoading} className="btn-cyber-solid w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {isLoading ? 'Yuborilmoqda...' : 'Havola yuborish'}
              </button>

              <Link href="/auth/kirish" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />Kirish sahifasiga qaytish
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
