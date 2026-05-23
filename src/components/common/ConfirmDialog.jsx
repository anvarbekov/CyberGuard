'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen, title, message, confirmText = 'Tasdiqlash', cancelText = 'Bekor qilish',
  onConfirm, onCancel, danger = false,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
            className="glass-card rounded-2xl p-6 w-full max-w-sm border border-white/20 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-xl flex-shrink-0 ${danger ? 'bg-red-500/10 border border-red-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-yellow-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                {message && <p className="text-sm text-gray-400 mt-1 leading-relaxed">{message}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 text-sm transition-all">
                {cancelText}
              </button>
              <button onClick={onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  danger
                    ? 'bg-red-500 hover:bg-red-400 text-white'
                    : 'btn-cyber-solid'
                }`}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
