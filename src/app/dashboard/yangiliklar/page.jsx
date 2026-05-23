'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Clock, RefreshCw, Tag, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  'Ransomware': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Fishing hujumi': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Zaiflik': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Kiberxavfsizlik': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Ijtimoiy muhandislik': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Xavfsizlik': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Maxfiylik': 'bg-green-500/20 text-green-400 border-green-500/30',
  "Ma'lumot sizib chiqishi": 'bg-red-500/20 text-red-400 border-red-500/30',
};

function NewsCard({ article, featured = false }) {
  const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['Kiberxavfsizlik'];

  if (featured) {
    return (
      <motion.a href={article.url} target="_blank" rel="noopener noreferrer"
        whileHover={{ y: -2 }}
        className="glass-card rounded-2xl p-6 border border-cyan-500/20 col-span-2 flex gap-6 hover:border-cyan-500/40 transition-all">
        <div className="flex-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${catColor} inline-block mb-3`}>
            {article.category}
          </span>
          <h2 className="text-xl font-bold text-white mb-2 line-clamp-2 hover:text-cyan-400 transition-colors">
            {article.title}
          </h2>
          <p className="text-gray-400 text-sm line-clamp-3 mb-4">{article.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="font-medium text-gray-400">{article.source}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} daqiqa</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-cyan-400">
              O'qish <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </motion.a>
    );
  }

  return (
    <motion.a href={article.url} target="_blank" rel="noopener noreferrer"
      whileHover={{ y: -2 }}
      className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/20 transition-all flex flex-col">
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${catColor} self-start mb-3`}>
        {article.category}
      </span>
      <h3 className="font-semibold text-white mb-2 line-clamp-2 flex-1 hover:text-cyan-400 transition-colors">
        {article.title}
      </h3>
      <p className="text-gray-400 text-xs line-clamp-2 mb-3">{article.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
        <span className="font-medium text-gray-400 truncate">{article.source}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} daq</span>
          <ExternalLink className="w-3 h-3 text-cyan-400" />
        </div>
      </div>
    </motion.a>
  );
}

export default function YangilikPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 8;

  const fetchNews = useCallback(async (p = 1, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch(`/api/news?page=${p}&pageSize=${PAGE_SIZE}${refresh ? '&bust=' + Date.now() : ''}`);
      const data = await res.json();
      if (p === 1) setArticles(data.articles || []);
      else setArticles(prev => [...prev, ...(data.articles || [])]);
      setTotal(data.total || 0);
    } catch {
      toast.error("Yangiliklar yuklanmadi");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNews(1); }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage);
  };

  const allCategories = ['Hammasi', ...new Set(articles.map(a => a.category))];
  const [activeFilter, setActiveFilter] = useState('Hammasi');
  const filtered = activeFilter === 'Hammasi' ? articles : articles.filter(a => a.category === activeFilter);

  return (
    <div className="space-y-6">
      <PageHeader icon={Newspaper} title="Kiberxavfsizlik yangiliklari"
        subtitle="Eng so'nggi xavfsizlik xabarlari va tahdidlar">
        <button onClick={() => fetchNews(1, true)} disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg border border-white/10 hover:border-cyan-500/30">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </PageHeader>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {allCategories.slice(0, 8).map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
              ${activeFilter === cat
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
              }`}>
            <Tag className="w-3 h-3" />{cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-white/5 animate-pulse">
              <div className="h-4 w-20 bg-white/10 rounded mb-3" />
              <div className="h-4 bg-white/10 rounded mb-2" />
              <div className="h-4 w-3/4 bg-white/10 rounded mb-4" />
              <div className="h-3 w-1/2 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.slice(0, 2).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className={i === 0 ? 'md:col-span-2 lg:col-span-2' : ''}>
                <NewsCard article={a} featured={i === 0} />
              </motion.div>
            ))}
            {filtered.slice(2).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + 2) * 0.05 }}>
                <NewsCard article={a} />
              </motion.div>
            ))}
          </div>

          {articles.length < total && (
            <div className="text-center">
              <button onClick={handleLoadMore}
                className="btn-cyber px-6 py-2.5 rounded-xl text-sm">
                Ko'proq yuklash ({total - articles.length} ta qoldi)
              </button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Bu kategoriyada yangiliklar topilmadi</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
