// src/app/dashboard/tahdidlar/page.jsx
'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Globe, Wifi, FileText, Upload, AlertTriangle,
  CheckCircle, XCircle, Clock, Info, Copy, ExternalLink,
  Search, Loader2, ChevronDown, Activity,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { threatOps, notificationOps } from '@/firebase/collections';
import { getRiskColor, getRiskBgColor, getRiskLabel, cn } from '@/utils';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'url', label: 'URL', icon: Globe, placeholder: 'https://example.com', desc: "URL manzilni kiriting" },
  { id: 'ip', label: 'IP Manzil', icon: Wifi, placeholder: '192.168.1.1', desc: "IP manzilni kiriting" },
  { id: 'text', label: 'Matn', icon: FileText, placeholder: "Shubhali matn yoki email tarkibini kiriting...", desc: "Shubhali matnni kiriting" },
];

export default function TahdidlarPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('url');
  const [input, setInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleScan = useCallback(async () => {
    if (!input.trim()) {
      toast.error("Iltimos, tekshiriladigan ma'lumotni kiriting");
      return;
    }

    setIsScanning(true);
    setResult(null);

    try {
      // Call our API route with auth token
      const token = await user?.getIdToken?.().catch(() => null);
      const response = await fetch('/api/threats/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: activeTab, input: input.trim() }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Tahlil qilishda xato');
      }

      const data = await response.json();
      setResult(data);

      // Save to Firestore via client SDK (backup if API didn't save)
      if (user && !token) {
        await threatOps.create(user.uid, {
          type: activeTab,
          target: data.target || input.trim(),
          input: input.trim(),
          riskScore: data.riskScore || 0,
          threatType: data.threatTypes?.[0] || activeTab,
          threatTypes: data.threatTypes || [],
        });
      }

      // Create notification for high risk
      if (user && (data.riskScore || 0) > 60) {
        await notificationOps.create(user.uid, {
          type: 'threat',
          title: '⚠️ Yuqori xavf aniqlandi!',
          message: `Risk: ${data.riskScore}/100 — ${input.trim().substring(0, 40)}`,
        });
      }

      // Update history
      setHistory(prev => [{ id: Date.now(), input: input.trim(), riskScore: data.riskScore, type: activeTab }, ...prev.slice(0, 9)]);

    } catch (err) {
      toast.error(err.message || 'Tahlil qilishda xato yuz berdi');
    } finally {
      setIsScanning(false);
    }
  }, [input, activeTab, user]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && activeTab !== 'text') {
      e.preventDefault();
      handleScan();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyber-accent" />
          Tahdidlarni aniqlash tizimi
        </h1>
        <p className="text-cyber-text-muted text-sm mt-1">
          URL, IP manzil yoki matnni tekshiring — bir nechta xavfsizlik API'lari orqali
        </p>
      </div>

      {/* Input Card */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-cyber-border/20">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setInput(''); setResult(null); }}
              className={cn(
                'flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all relative',
                activeTab === tab.id
                  ? 'text-cyber-accent'
                  : 'text-cyber-text-muted hover:text-white'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-accent"
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-cyber-text-secondary mb-2">
            {TABS.find(t => t.id === activeTab)?.desc}
          </label>

          {activeTab === 'text' ? (
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              className="input-cyber resize-none"
              rows={4}
              placeholder={TABS.find(t => t.id === activeTab)?.placeholder}
            />
          ) : (
            <div className="relative">
              {activeTab === 'url' && <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-muted" />}
              {activeTab === 'ip' && <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-muted" />}
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input-cyber pl-10"
                placeholder={TABS.find(t => t.id === activeTab)?.placeholder}
                type="text"
              />
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <motion.button
              onClick={handleScan}
              disabled={isScanning || !input.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyber-accent text-cyber-black rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-cyber"
            >
              {isScanning ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Tekshirilmoqda...</>
              ) : (
                <><Search className="w-4 h-4" />Tekshirish</>
              )}
            </motion.button>

            {input && (
              <button
                onClick={() => { setInput(''); setResult(null); }}
                className="text-sm text-cyber-text-muted hover:text-white transition-colors"
              >
                Tozalash
              </button>
            )}

            <p className="text-xs text-cyber-text-muted ml-auto">
              VirusTotal, AbuseIPDB, Google Safe Browsing API'lari ishlatiladi
            </p>
          </div>
        </div>
      </div>

      {/* Scanning Animation */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card rounded-xl p-8 text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-cyber-accent/20 animate-spin-slow" />
              <div className="absolute inset-3 rounded-full border border-cyber-accent/40" style={{ animationDirection: 'reverse' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-6 h-6 text-cyber-accent animate-pulse" />
              </div>
            </div>
            <p className="text-white font-medium">Tahlil qilinmoqda...</p>
            <p className="text-cyber-text-muted text-sm mt-1">
              {activeTab === 'url' ? "URL ko'p API'lar orqali tekshirilmoqda" :
               activeTab === 'ip' ? "IP manzil ma'lumotlari so'ralmoqda" :
               "Matn tahlil qilinmoqda"}
            </p>
            <div className="flex items-center justify-center gap-1 mt-3">
              {['VirusTotal', 'Google Safe Browsing', 'AbuseIPDB'].map((api, i) => (
                <motion.span
                  key={api}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                  className="text-xs text-cyber-accent px-2 py-0.5 bg-cyber-accent/10 rounded"
                >
                  {api}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && !isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Main Result Card */}
            <div className={cn(
              "glass-card rounded-xl p-6 border",
              getRiskBgColor(result.riskScore)
            )}>
              <div className="flex items-start gap-4 flex-wrap">
                {/* Score Circle */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(30,58,95,0.4)" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={result.riskScore > 70 ? '#ff2d55' : result.riskScore > 40 ? '#ffd700' : '#00ff88'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - result.riskScore / 100) }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-2xl font-bold font-mono", getRiskColor(result.riskScore))}>
                      {result.riskScore}
                    </span>
                    <span className="text-xs text-cyber-text-muted">/ 100</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {result.riskScore <= 10 ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : result.riskScore <= 60 ? (
                      <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                    <h3 className={cn("text-xl font-bold", getRiskColor(result.riskScore))}>
                      {result.riskLabel}
                    </h3>
                    <span className="text-xs text-cyber-text-muted">Risk darajasi</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm text-white font-mono truncate max-w-md">{result.target}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(result.target); toast.success('Nusxalandi'); }}
                      className="text-cyber-text-muted hover:text-cyber-accent flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Threat types */}
                  {result.threatTypes?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.threatTypes.map((t, i) => (
                        <span key={i} className="px-2.5 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-cyber-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(result.timestamp).toLocaleTimeString('uz-UZ')}
                    </span>
                    <span>{result.checks?.length || 0} ta tekshiruv bajarildi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Check Results */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyber-accent" />
                Tekshiruv natijalari
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.checks?.map((check, i) => (
                  <CheckResult key={i} check={check} />
                ))}
              </div>
            </div>

            {/* Details */}
            {result.details && Object.keys(result.details).length > 0 && (
              <ResultDetails details={result.details} type={activeTab} />
            )}

            {/* Recommendations */}
            <Recommendations riskScore={result.riskScore} threatTypes={result.threatTypes} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyber-text-muted" />
            Joriy sessiya tarixi
          </h3>
          <div className="space-y-2">
            {history.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => { setInput(item.input); setActiveTab(item.type); setResult(null); }}
              >
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", item.riskScore > 70 ? 'bg-red-400' : item.riskScore > 40 ? 'bg-yellow-400' : 'bg-green-400')} />
                <span className="text-sm text-white flex-1 truncate font-mono">{item.input}</span>
                <span className={cn("text-xs font-mono font-bold", getRiskColor(item.riskScore))}>{item.riskScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckResult({ check }) {
  const isFailed = check.status === 'failed' || check.error;
  const isMalicious = check.malicious > 0 || check.unsafe || (check.indicators?.length > 0);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-cyber-border/20">
      <div className="mt-0.5">
        {isFailed ? (
          <div className="w-5 h-5 rounded-full bg-cyber-gray/50 flex items-center justify-center">
            <span className="text-xs text-cyber-text-muted">?</span>
          </div>
        ) : isMalicious ? (
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{check.name}</p>
        {isFailed ? (
          <p className="text-xs text-cyber-text-muted mt-0.5">API ma'lumotlari mavjud emas</p>
        ) : isMalicious ? (
          <p className="text-xs text-red-400 mt-0.5">
            {check.malicious ? `${check.malicious} ta zararli aniqlandi` :
             check.indicators?.length ? `${check.indicators.length} ta ko'rsatkich` :
             'Xavfli deb belgilandi'}
          </p>
        ) : (
          <p className="text-xs text-green-400 mt-0.5">Xavfsiz</p>
        )}
      </div>
    </div>
  );
}

function ResultDetails({ details, type }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/3 transition-colors"
      >
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-cyber-text-muted" />
          Batafsil ma'lumotlar
        </h3>
        <ChevronDown className={cn("w-4 h-4 text-cyber-text-muted transition-transform", expanded ? 'rotate-180' : '')} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className="code-block text-xs overflow-auto max-h-64">
                <pre>{JSON.stringify(details, null, 2)}</pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Recommendations({ riskScore, threatTypes }) {
  const recs = [];

  if (riskScore > 70) {
    recs.push({
      icon: XCircle,
      text: "Bu manzilga KIRMANG yoki yuklamani bajarmang",
      color: "text-red-400",
      bg: "bg-red-500/10",
    });
    recs.push({
      icon: Shield,
      text: "Antivirus dasturingizni yangilang va to'liq skan bajaring",
      color: "text-red-400",
      bg: "bg-red-500/10",
    });
  } else if (riskScore > 40) {
    recs.push({
      icon: AlertTriangle,
      text: "Ehtiyotkor bo'ling. Shaxsiy ma'lumotlaringizni kiritmang",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    });
  } else {
    recs.push({
      icon: CheckCircle,
      text: "Manzil xavfsiz ko'rinadi, lekin doim ehtiyotkor bo'ling",
      color: "text-green-400",
      bg: "bg-green-500/10",
    });
  }

  if (threatTypes?.includes('Fishing')) {
    recs.push({
      icon: AlertTriangle,
      text: "Fishing xavfi aniqlandi. Login ma'lumotlarni kiritmang",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    });
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Info className="w-4 h-4 text-cyber-accent" />
        Tavsiyalar
      </h3>
      <div className="space-y-2">
        {recs.map((rec, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${rec.bg}`}>
            <rec.icon className={`w-4 h-4 ${rec.color} flex-shrink-0 mt-0.5`} />
            <p className="text-sm text-white">{rec.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
