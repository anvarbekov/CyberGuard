'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FileText, Search, Filter, CheckCircle, XCircle, Clock,
  Eye, ChevronDown, ChevronUp, Image as ImageIcon, MessageSquare, Loader2
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: "Barchasi" },
  { value: 'yangi', label: 'Yangi' },
  { value: 'korib_chiqilmoqda', label: "Ko'rib chiqilmoqda" },
  { value: 'tasdiqlangan', label: 'Tasdiqlangan' },
  { value: 'bekor_qilingan', label: 'Bekor qilingan' },
];

const SEVERITY_CONFIG = {
  past: { label: 'Past', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  orta: { label: "O'rta", color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  yuqori: { label: 'Yuqori', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  kritik: { label: 'Kritik', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const STATUS_CONFIG = {
  yangi: { label: 'Yangi', color: 'text-blue-400', bg: 'bg-blue-500/10', Icon: Clock },
  korib_chiqilmoqda: { label: "Ko'rib chiqilmoqda", color: 'text-yellow-400', bg: 'bg-yellow-500/10', Icon: Eye },
  tasdiqlangan: { label: 'Tasdiqlangan', color: 'text-green-400', bg: 'bg-green-500/10', Icon: CheckCircle },
  bekor_qilingan: { label: 'Bekor qilingan', color: 'text-red-400', bg: 'bg-red-500/10', Icon: XCircle },
};

export default function AdminHisobotlarPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [noteValues, setNoteValues] = useState({});

  useEffect(() => {
    if (!isAdmin) { router.replace('/dashboard'); return; }
    fetchReports();
  }, [isAdmin, statusFilter]);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/reports?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      toast.error("Hisobotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reportId, status) => {
    setUpdatingId(reportId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: reportId, status, adminNote: noteValues[reportId] || null }),
      });
      if (!res.ok) throw new Error();
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status, adminNote: noteValues[reportId] } : r));
      toast.success("Holat yangilandi");
    } catch {
      toast.error("Yangilanmadi");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = reports.filter(r =>
    !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const statsCounts = {
    yangi: reports.filter(r => r.status === 'yangi').length,
    korib_chiqilmoqda: reports.filter(r => r.status === 'korib_chiqilmoqda').length,
    tasdiqlangan: reports.filter(r => r.status === 'tasdiqlangan').length,
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Hisobotlarni boshqarish"
        subtitle="Foydalanuvchi hodisa hisobotlarini ko'rib chiqing" badge={`${reports.length} ta`} />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Yangi', value: statsCounts.yangi, color: 'cyan' },
          { label: "Ko'rib chiqilmoqda", value: statsCounts.korib_chiqilmoqda, color: 'yellow' },
          { label: 'Tasdiqlangan', value: statsCounts.tasdiqlangan, color: 'green' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 border border-white/10 text-center">
            <p className="text-2xl font-bold text-white">{loading ? '—' : s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-cyber w-full pl-10" placeholder="Sarlavha yoki email bo'yicha..." />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {STATUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs border transition-all ${statusFilter === opt.value ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl border border-white/10">
          <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Hisobotlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report, i) => {
            const sevConf = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.orta;
            const statConf = STATUS_CONFIG[report.status] || STATUS_CONFIG.yangi;
            const StatIcon = statConf.Icon;
            const isExpanded = expandedId === report.id;

            return (
              <motion.div key={report.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="w-full text-left p-5 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sevConf.bg} ${sevConf.color}`}>{sevConf.label}</span>
                        <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${statConf.bg} ${statConf.color}`}>
                          <StatIcon className="w-3 h-3" />{statConf.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white truncate">{report.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{report.userEmail} • {formatDate(report.createdAt)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10">
                      <div className="p-5 space-y-4">
                        <p className="text-sm text-gray-300">{report.description}</p>
                        {report.imageUrl && (
                          <img src={report.imageUrl} alt="Hisobot rasmi" className="rounded-xl max-h-48 object-cover border border-white/10" />
                        )}

                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />Admin izohi
                          </label>
                          <textarea value={noteValues[report.id] || report.adminNote || ''}
                            onChange={e => setNoteValues(p => ({ ...p, [report.id]: e.target.value }))}
                            className="input-cyber w-full h-20 resize-none text-sm"
                            placeholder="Izoह yozing..." />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {['korib_chiqilmoqda', 'tasdiqlangan', 'bekor_qilingan'].map(status => {
                            const conf = STATUS_CONFIG[status];
                            return (
                              <button key={status}
                                disabled={report.status === status || updatingId === report.id}
                                onClick={() => updateStatus(report.id, status)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-all disabled:opacity-50
                                  ${report.status === status ? `${conf.bg} ${conf.color} border-current` : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                                {updatingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <conf.Icon className="w-3 h-3" />}
                                {conf.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
