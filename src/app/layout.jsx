import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
  title: {
    default: 'CyberGuard UZ — Kiberxavfsizlik tizimi',
    template: '%s | CyberGuard UZ',
  },
  description: "Kiberxavfsizlikda tahdidlarni aniqlash va risklarni kamaytirish usullari. O'zbekistondagi eng ilg'or kiberxavfsizlik platformasi.",
  keywords: ['kiberxavfsizlik', 'tahdid aniqlash', 'xavfsizlik', "o'zbek", 'cybersecurity'],
  authors: [{ name: 'CyberGuard UZ' }],
  creator: 'CyberGuard UZ',
  robots: { index: true, follow: true },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#00d4ff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz" className="dark" data-theme="cyberDark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cyber-black font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(13, 27, 46, 0.95)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                color: '#e2e8f0',
                backdropFilter: 'blur(20px)',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '14px',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
              success: { iconTheme: { primary: '#00ff88', secondary: '#0a0f1e' } },
              error: { iconTheme: { primary: '#ff2d55', secondary: '#0a0f1e' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
