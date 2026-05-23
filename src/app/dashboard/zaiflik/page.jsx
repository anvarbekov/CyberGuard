'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Globe, Search, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Cpu, Lock, Unlock, Star, RefreshCw
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { scanOps } from '@/firebase/collections';

const GRADE_CONFIG = {
  'A+': { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' },
  'A':  { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' },
  'B':  { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' },
  'C':  { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' },
  'D':  { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' },
  'F':  { color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/40' },
};

const LEVEL_CONFIG = {
  kritik: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Kritik' },
  yuqori: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Yuqori' },
  orta:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: "O'rta" },
  past:   { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Past' },
};

export default function ZaiflikPage() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expandedHeader, setExpandedHeader] = useState(null);
  const [history, setHistory] = useState([]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) { setError("URL kiriting"); return; }
    setScanning(true);
    setError('');
    setResult(null);

    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
      setScanning(false); // Stop loading IMMEDIATELY before any async saves
      setHistory(prev => [data, ...prev.slice(0, 4)]);

      // Save to Firestore in background (fire and forget)
      if (user) {
        scanOps.save(user.uid, {
          type: 'website', url: data.url || url.trim(),
          score: data.score, grade: data.grade,
          headersChecked: data.headers?.length || 0,
        }).catch(() => {});
      }
    } catch (err) {
      setError(err.message || "Skan xatosi yuz berdi");
    } finally {
      setScanning(false); // Always stop loading even on error
    }
  };

  const gradeConf = result ? (GRADE_CONFIG[result.grade] || GRADE_CONFIG['F']) : null;

  return (
    <div className="space-y-6">
      <PageHeader icon={Shield} title="Zaiflik skaneri"
        subtitle="Veb-saytlarning xavfsizlik holatini tekshiring"
        badge="Bepul" />

      {/* Scanner input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-cyan-500/20">
        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input value={url} onChange={e => { setUrl(e.target.value); setError(''); }}
              className="input-cyber w-full pl-11 pr-4"
              placeholder="https://misol.com yoki misol.com"
              disabled={scanning}
            />
          </div>
          <motion.button type="submit" disabled={scanning}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn-cyber px-6 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap">
            {scanning
              ? <><span className="loading loading-spinner loading-sm" />Skan qilinmoqda...</>
              : <><Search className="w-4 h-4" />Skan boshlash</>
            }
          </motion.button>
        </form>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-3 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4" />{error}
          </motion.p>
        )}
      </motion.div>

      {/* Scanning animation */}
      <AnimatePresence>
        {scanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-card rounded-2xl p-10 border border-cyan-500/20 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-t-cyan-400 border-cyan-400/20 mb-4">
              <Shield className="w-7 h-7 text-cyan-400" />
            </motion.div>
            <p className="text-white font-semibold text-lg">Skan amalga oshirilmoqda...</p>
            <p className="text-gray-400 text-sm mt-1">{url} tekshirilmoqda</p>
            {['SSL sertifikat', 'Xavfsizlik headerlar', 'Texnologiyalar'].map((step, i) => (
              <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 }}
                className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-400">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {step} tekshirilmoqda...
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && result.success && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            {/* Score card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className={`glass-card rounded-2xl p-6 border ${gradeConf.border} flex flex-col items-center justify-center`}>
                <div className={`text-6xl font-display font-black ${gradeConf.color}`}>{result.grade}</div>
                <div className={`text-sm font-medium mt-1 ${gradeConf.color}`}>{result.gradeLabel}</div>
                <div className="text-gray-400 text-xs mt-2">Xavfsizlik bahosi</div>
                <div className="mt-3 w-full bg-black/30 rounded-full h-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.score}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className={`h-2 rounded-full ${result.score >= 70 ? 'bg-green-400' : result.score >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                </div>
                <div className="text-white font-bold mt-1">{result.score}/100</div>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-white/10 lg:col-span-2">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />Skan natijalari
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Tekshirildi", value: result.summary.totalChecks, color: "text-gray-300" },
                    { label: "O'tdi", value: result.summary.passed, color: "text-green-400" },
                    { label: "Muvaffaqiyatsiz", value: result.summary.failed, color: "text-red-400" },
                    { label: "Kritik", value: result.summary.criticalIssues, color: "text-red-500" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-black/20 rounded-xl p-3 text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.technologies.map(tech => (
                    <span key={tech} className="px-2 py-1 text-xs rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* SSL */}
            <div className={`glass-card rounded-2xl p-5 border ${result.ssl.hasSSL ? 'border-green-500/20' : 'border-red-500/20'}`}>
              <div className="flex items-center gap-3">
                {result.ssl.hasSSL
                  ? <Lock className="w-5 h-5 text-green-400" />
                  : <Unlock className="w-5 h-5 text-red-400" />
                }
                <div>
                  <p className={`font-semibold ${result.ssl.hasSSL ? 'text-green-400' : 'text-red-400'}`}>
                    SSL/TLS: {result.ssl.hasSSL ? 'Faol' : 'Faol emas'}
                  </p>
                  {result.ssl.details?.protocol && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Protokol: {result.ssl.details.protocol} •
                      Sertifikat: {result.ssl.details.certificate?.issuer} •
                      Amal qilish: {result.ssl.details.certificate?.validUntil}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Headers */}
            <div className="glass-card rounded-2xl p-5 border border-white/10">
              <h3 className="font-semibold text-white mb-4">Xavfsizlik headerlari</h3>
              <div className="space-y-2">
                {Object.entries(result.headers).map(([name, info]) => (
                  <div key={name}>
                    <button onClick={() => setExpandedHeader(expandedHeader === name ? null : name)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        {info.present
                          ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        }
                        <span className={`text-sm font-medium ${info.present ? 'text-green-300' : 'text-red-300'}`}>
                          {info.label}
                        </span>
                        <code className="text-xs text-gray-500 hidden sm:block">{name}</code>
                      </div>
                      {expandedHeader === name ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    <AnimatePresence>
                      {expandedHeader === name && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-3 text-sm text-gray-400">{info.description}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="glass-card rounded-2xl p-5 border border-white/10">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />Tavsiyalar
                </h3>
                <div className="space-y-3">
                  {result.recommendations.map((rec, idx) => {
                    const conf = LEVEL_CONFIG[rec.level] || LEVEL_CONFIG.past;
                    return (
                      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 rounded-xl ${conf.bg} border ${conf.border}`}>
                        <div className="flex items-start gap-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${conf.bg} ${conf.color} border ${conf.border} flex-shrink-0 mt-0.5`}>
                            {conf.label}
                          </span>
                          <div>
                            <p className="font-medium text-white text-sm">{rec.title}</p>
                            <p className="text-gray-400 text-xs mt-1">{rec.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && !result && (
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="font-semibold text-white mb-4">Oxirgi skanlar</h3>
          <div className="space-y-2">
            {history.map((h, i) => {
              const gc = GRADE_CONFIG[h.grade] || GRADE_CONFIG['F'];
              return (
                <button key={i} onClick={() => setUrl(h.url)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300 truncate">{h.domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${gc.color}`}>{h.grade}</span>
                    <RefreshCw className="w-3 h-3 text-gray-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
