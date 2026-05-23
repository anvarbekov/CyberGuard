'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Trash2, Shield, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { chatOps } from '@/firebase/collections';
import toast from 'react-hot-toast';

const QUICK_QUESTIONS = [
  "Fishing hujumlaridan qanday himoyalanaman?",
  "Kuchli parol qanday yaratiladi?",
  "VPN nima va kerakmi?",
  "Ikki faktorli autentifikatsiya nima?",
  "Zararli dasturlardan qanday himoyalanaman?",
  "Zero-day zaiflik nima?",
];

function MessageBubble({ msg, onCopy }) {
  const [copied, setCopied] = useState(false);
  const isBot = msg.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown-like formatting
  const formatContent = (text) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-bold text-white">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('• ') || line.startsWith('✅ ') || line.startsWith('❌ ')) {
          return <p key={i} className="ml-2">{line}</p>;
        }
        if (line === '') return <br key={i} />;
        return <p key={i}>{line}</p>;
      });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isBot ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-violet-500/20 border border-violet-500/30'}`}>
        {isBot ? <Bot className="w-4 h-4 text-cyan-400" /> : <Shield className="w-4 h-4 text-violet-400" />}
      </div>
      <div className={`max-w-[80%] ${isBot ? '' : ''}`}>
        <div className={`relative group rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isBot
            ? 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
            : 'bg-cyan-500/20 border border-cyan-500/30 text-white rounded-tr-none'
          }`}>
          {isBot ? (
            <div className="space-y-0.5">{formatContent(msg.content)}</div>
          ) : (
            <p>{msg.content}</p>
          )}
          {isBot && (
            <button onClick={handleCopy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-gray-200">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
        {msg.provider && isBot && (
          <p className="text-xs text-gray-600 mt-1 px-1">
            {msg.provider === 'demo' ? '🤖 Demo rejim' : msg.provider === 'gemini' ? '✨ Gemini AI' : '🔮 OpenRouter AI'}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: '0', role: 'assistant',
      content: `Salom! Men CyberGuard AI yordamchisiman 🛡️\n\nKiberxavfsizlik bo'yicha har qanday savolingizga javob beraman:\n• Fishing va ijtimoiy muhandislik hujumlar\n• Parol va hisobni himoya qilish\n• Tarmoq va internet xavfsizligi\n• Zararli dasturlar va antiviruslar\n• Umumiy kibergigiena maslahatlari\n\nSavolingizni yozing yoki quyidagi mavzulardan birini tanlang.`,
      provider: 'system',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');
    setError('');
    const userMsg = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = [...messages.filter(m => m.role !== 'system' || m.id !== '0'), userMsg]
      .slice(-16)
      .map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, userId: user?.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const botMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text, provider: data.provider };
      setMessages(prev => [...prev, botMsg]);

      if (user) {
        chatOps.save(user.uid, { userMessage: content, botResponse: data.text, provider: data.provider }).catch(() => {});
      }
    } catch (err) {
      setError(err.message || "Javob olinmadi. Qayta urinib ko'ring.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([messages[0]]);
    setError('');
    toast.success("Suhbat tozalandi");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <PageHeader icon={Bot} title="AI Xavfsizlik Yordamchisi"
        subtitle="Kiberxavfsizlik bo'yicha savollaringizga javob oling" badge="AI">
        <button onClick={clearChat} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg border border-white/10 hover:border-red-500/30">
          <Trash2 className="w-4 h-4" />Tozalash
        </button>
      </PageHeader>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto glass-card rounded-2xl border border-white/10 p-4 space-y-4 mb-4">
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500/20 border border-cyan-500/30">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-cyan-400" />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 1 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />Tez savollar
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map(q => (
              <button key={q} onClick={() => sendMessage(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          className="input-cyber flex-1"
          placeholder="Kiberxavfsizlik haqida savol bering..."
          disabled={loading}
          maxLength={1000}
        />
        <motion.button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="btn-cyber px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
