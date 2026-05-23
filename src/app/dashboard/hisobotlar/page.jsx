'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, X, Upload, AlertTriangle, Clock,
  CheckCircle, XCircle, Loader2, Eye, Trash2, Image as ImageIcon,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { reportOps } from '@/firebase/collections';
import { formatDate, timeAgo } from '@/utils';
import toast from 'react-hot-toast';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';

const SEVERITY = [
  { value: 'past',  label: 'Past',   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
  { value: 'orta',  label: "O'rta",  color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { value: 'yuqori',label: 'Yuqori', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { value: 'kritik',label: 'Kritik', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'    },
];

const TYPES = [
  'Fishing hujumi', 'Zararli dastur', 'DDoS hujumi', 'Ma\'lumot sizib chiqishi',
  'Ruxsatsiz kirish', 'Ijtimoiy muhandislik', 'Ransomware', 'Boshqa',
];

const STATUS_CONFIG = {
  yangi:            { label: 'Yangi',            icon: Clock,         color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
  korib_chiqilmoqda:{ label: "Ko'rib chiqilmoqda",icon: Eye,           color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  tasdiqlangan:     { label: 'Tasdiqlangan',     icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30'  },
  bekor_qilingan:   { label: "Bekor qilingan",   icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'    },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.yangi;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const sev = SEVERITY.find(s => s.value === severity) || SEVERITY[0];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${sev.color} ${sev.bg} ${sev.border}`}>
      {sev.label}
    </span>
  );
}

export default function HisobotlarPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: '', description: '', severity: 'orta', type: '', attachments: [],
  });
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  const loadReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await reportOps.getUserReports(user.uid, 100);
      setReports(data);
    } catch { setReports([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, [user]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name}: 10MB dan oshmasligi kerak`); return false; }
      return true;
    });
    setAttachmentFiles(prev => [...prev, ...valid].slice(0, 5));
  };

  const removeAttachment = (i) => setAttachmentFiles(prev => prev.filter((_, idx) => idx !== i));

  const uploadFile = (file, index) => new Promise((resolve, reject) => {
    const path = `reports/${user.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const sRef = storageRef(storage, path);
    const task = uploadBytesResumable(sRef, file, { contentType: file.type });

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      task.cancel();
      reject(new Error('Upload timeout'));
    }, 30000);

    task.on(
      'state_changed',
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setUploadProgress(p => ({ ...p, [index]: pct }));
      },
      (err) => { clearTimeout(timeout); reject(err); },
      async () => {
        clearTimeout(timeout);
        try { resolve(await getDownloadURL(task.snapshot.ref)); }
        catch (e) { reject(e); }
      }
    );
  });

  // Upload with Cloudinary fallback
  const uploadWithFallback = async (file, index) => {
    try {
      return await uploadFile(file, index);
    } catch (storageErr) {
      console.warn('Firebase Storage failed, trying Cloudinary:', storageErr.message);
      try {
        const { uploadToCloudinary } = await import('@/services/cloudinaryService');
        const result = await uploadToCloudinary(file, { folder: 'cyberguard/reports' });
        setUploadProgress(p => ({ ...p, [index]: 100 }));
        return result.url;
      } catch {
        console.warn('Both uploads failed for file:', file.name);
        return null;
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Sarlavha kiritilmagan'); return; }
    if (!form.description.trim()) { toast.error('Tavsif kiritilmagan'); return; }
    if (!form.type) { toast.error('Hodisa turi tanlanmagan'); return; }
    setSubmitting(true);
    try {
      // Upload attachments with fallback
      const urls = await Promise.all(
        attachmentFiles.map((f, i) => uploadWithFallback(f, i))
      );
      const attachments = urls.filter(Boolean).map((url, i) => ({
        url, name: attachmentFiles[i]?.name, type: attachmentFiles[i]?.type,
      }));

      await reportOps.create(user.uid, {
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        type: form.type,
        attachments,
      });

      toast.success("Hisobot muvaffaqiyatli yuborildi! ✅");
      setForm({ title: '', description: '', severity: 'orta', type: '', attachments: [] });
      setAttachmentFiles([]);
      setUploadProgress({});
      setShowForm(false);
      await loadReports();
    } catch (err) {
      toast.error('Hisobot yuborishda xato');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // Note: deleteDoc from firebase
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('@/firebase/config');
      await deleteDoc(doc(db, 'reports', deleteTarget));
      setReports(prev => prev.filter(r => r.id !== deleteTarget));
      toast.success("Hisobot o'chirildi");
    } catch { toast.error("O'chirishda xato"); }
    finally { setDeleteTarget(null); }
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader icon={FileText} title="Hodisa hisobotlari" subtitle="Kiberxavfsizlik hodisalarini xabar qiling" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="btn-cyber-solid px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" />Yangi hisobot
        </motion.button>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card rounded-2xl border border-white/10 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-1">Hali hisobot yo'q</p>
          <p className="text-gray-500 text-sm mb-4">Kiberxavfsizlik hodisasi kuzatgan bo'lsangiz, hisobot yozing</p>
          <button onClick={() => setShowForm(true)} className="btn-cyber-solid px-5 py-2 rounded-xl text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />Birinchi hisobotni yaratish
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report, i) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl border border-white/10 p-5 hover:border-cyan-500/20 transition-all cursor-pointer group"
              onClick={() => setSelectedReport(report)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <SeverityBadge severity={report.severity} />
                    <StatusBadge status={report.status} />
                    {report.type && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">{report.type}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors truncate">{report.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{report.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">{timeAgo(report.createdAt)}</span>
                    {report.attachments?.length > 0 && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />{report.attachments.length} fayl
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); setDeleteTarget(report.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New report modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && !submitting && setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="glass-card rounded-2xl w-full max-w-lg border border-cyan-500/20 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-cyber-dark/90 backdrop-blur-sm z-10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />Yangi hisobot
                </h3>
                <button onClick={() => !submitting && setShowForm(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Sarlavha */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Sarlavha <span className="text-red-400">*</span></label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="input-cyber w-full" style={{ paddingLeft: '16px' }}
                    placeholder="Hodisa qisqacha sarlavhasi" maxLength={100} />
                </div>

                {/* Severity + Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Jiddiylik darajasi</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SEVERITY.map(s => (
                        <button key={s.value} type="button" onClick={() => setForm(p => ({ ...p, severity: s.value }))}
                          className={`py-1.5 rounded-lg text-xs border transition-all ${
                            form.severity === s.value ? `${s.border} ${s.bg} ${s.color}` : 'border-white/10 text-gray-400 hover:border-white/20'
                          }`}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Hodisa turi <span className="text-red-400">*</span></label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="input-cyber w-full text-sm"
                      style={{ paddingLeft: '12px', background: 'rgba(13,27,46,0.8)' }}>
                      <option value="">Tanlang...</option>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Tavsif <span className="text-red-400">*</span></label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={4} className="input-cyber w-full resize-none"
                    style={{ paddingLeft: '16px' }}
                    placeholder="Hodisa haqida batafsil ma'lumot kiriting..." maxLength={2000} />
                  <p className="text-xs text-gray-500 mt-1 text-right">{form.description.length}/2000</p>
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Qo'shimcha fayllar (ixtiyoriy, max 5ta)
                  </label>
                  <input ref={fileRef} type="file" multiple accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
                  {attachmentFiles.length < 5 && (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="w-full py-3 rounded-xl border border-dashed border-white/20 hover:border-cyan-500/40 text-gray-400 hover:text-cyan-400 text-sm flex items-center justify-center gap-2 transition-all">
                      <Upload className="w-4 h-4" />Fayl tanlash (rasm yoki PDF)
                    </button>
                  )}
                  {attachmentFiles.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {attachmentFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                          <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-300 truncate flex-1">{file.name}</span>
                          {uploadProgress[i] !== undefined && (
                            <span className="text-xs text-cyan-400">{uploadProgress[i]}%</span>
                          )}
                          <button type="button" onClick={() => removeAttachment(i)}
                            className="text-gray-500 hover:text-red-400 flex-shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => !submitting && setShowForm(false)} disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 text-sm transition-all">
                    Bekor qilish
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 btn-cyber-solid py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Yuborilmoqda...</>
                      : <><CheckCircle className="w-4 h-4" />Yuborish</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report detail modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setSelectedReport(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="glass-card rounded-2xl w-full max-w-lg border border-white/20 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-cyber-dark/90 backdrop-blur-sm">
                <h3 className="font-semibold text-white">Hisobot tafsilotlari</h3>
                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <SeverityBadge severity={selectedReport.severity} />
                  <StatusBadge status={selectedReport.status} />
                  {selectedReport.type && (
                    <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">{selectedReport.type}</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{selectedReport.title}</h2>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                <div className="pt-3 border-t border-white/10 text-xs text-gray-500 space-y-1">
                  <p>Yaratildi: {formatDate(selectedReport.createdAt)}</p>
                  {selectedReport.adminNote && (
                    <div className="mt-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                      <p className="text-cyan-400 text-xs font-medium mb-1">Admin izohi:</p>
                      <p className="text-gray-300 text-sm">{selectedReport.adminNote}</p>
                    </div>
                  )}
                </div>
                {selectedReport.attachments?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Qo'shimcha fayllar:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReport.attachments.map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 text-xs text-gray-300 hover:text-white transition-all">
                          <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{att.name || `Fayl ${i+1}`}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Hisobotni o'chirish"
        message="Bu hisobotni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
