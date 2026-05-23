/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#030712',
          dark: '#0a0f1e',
          navy: '#0d1b2e',
          blue: '#0f2744',
          accent: '#00d4ff',
          green: '#00ff88',
          purple: '#7c3aed',
          red: '#ff2d55',
          orange: '#ff6b35',
          yellow: '#ffd700',
          gray: '#1e293b',
          'gray-light': '#334155',
          'text-primary': '#e2e8f0',
          'text-secondary': '#94a3b8',
          'text-muted': '#64748b',
          border: '#1e3a5f',
          glass: 'rgba(13, 27, 46, 0.8)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'matrix-rain': 'matrixRain 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'blink': 'blink 1s step-end infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'border-spin': 'borderSpin 4s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px #00d4ff, 0 0 20px #00d4ff33' },
          '50%': { boxShadow: '0 0 20px #00d4ff, 0 0 60px #00d4ff66' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 10px #00d4ff' },
          '50%': { textShadow: '0 0 30px #00d4ff, 0 0 60px #00d4ff' },
        },
        borderSpin: {
          '0%': { '--border-angle': '0deg' },
          '100%': { '--border-angle': '360deg' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'cyber-grid': `
          linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)
        `,
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-gradient': 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2e 50%, #0f2744 100%)',
        'glow-gradient': 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,255,136,0.05) 100%)',
      },
      boxShadow: {
        'cyber': '0 0 15px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(0, 212, 255, 0.1)',
        'cyber-hover': '0 0 30px rgba(0, 212, 255, 0.5), inset 0 1px 0 rgba(0, 212, 255, 0.2)',
        'glow-green': '0 0 15px rgba(0, 255, 136, 0.3)',
        'glow-red': '0 0 15px rgba(255, 45, 85, 0.3)',
        'glow-orange': '0 0 15px rgba(255, 107, 53, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255,255,255,0.05)',
      },
      borderRadius: {
        'cyber': '4px',
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        cyberDark: {
          'primary': '#00d4ff',
          'secondary': '#00ff88',
          'accent': '#7c3aed',
          'neutral': '#1e293b',
          'base-100': '#030712',
          'base-200': '#0a0f1e',
          'base-300': '#0d1b2e',
          'info': '#00d4ff',
          'success': '#00ff88',
          'warning': '#ffd700',
          'error': '#ff2d55',
        },
      },
    ],
  },
};
