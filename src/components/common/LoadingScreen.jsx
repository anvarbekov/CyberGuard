// src/components/common/LoadingScreen.jsx
'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function LoadingScreen({ message = 'Yuklanmoqda...' }) {
  return (
    <div className="fixed inset-0 bg-cyber-black flex flex-col items-center justify-center z-50">
      {/* Grid background */}
      <div className="absolute inset-0 cyber-grid opacity-30" />

      {/* Radial glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyber-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyber-accent/30 animate-spin-slow" />
            <div className="absolute inset-2 rounded-full border border-cyber-accent/20 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '4s' }} />
            <Shield className="w-8 h-8 text-cyber-accent" style={{ filter: 'drop-shadow(0 0 10px #00d4ff)' }} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="font-display text-2xl font-bold neon-text tracking-widest">
            CYBERGUARD UZ
          </h1>
          <p className="text-cyber-text-muted text-sm mt-1 font-mono">
            {message}
          </p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-64"
        >
          <div className="h-1 bg-cyber-gray rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyber-accent to-cyber-green rounded-full"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>

        {/* Status dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-cyber-accent"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyber-accent/20 to-transparent"
          animate={{ y: ['0vh', '100vh'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
