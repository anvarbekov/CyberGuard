// src/services/newsService.js
// Cybersecurity news fetching

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

let cache = { data: null, timestamp: 0 };

// Uzbek translations for common cybersecurity terms
const CATEGORY_LABELS = {
  malware: 'Zararli dastur',
  phishing: 'Fishing hujumi',
  ransomware: 'Ransomware',
  vulnerability: 'Zaiflik',
  breach: 'Ma\'lumot sizib chiqishi',
  hack: 'Hacking',
  security: 'Xavfsizlik',
  privacy: 'Maxfiylik',
  cyber: 'Kiberxavfsizlik',
  threat: 'Tahdid',
};

function categorizeArticle(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    if (text.includes(key)) return label;
  }
  return 'Kiberxavfsizlik';
}

function estimateReadTime(content) {
  const words = (content || '').split(' ').length;
  return Math.max(1, Math.round(words / 200));
}

// Demo news for when API key is not available
const DEMO_NEWS = [
  {
    id: '1',
    title: "Yangi ransomware tahdidi global tarmoqlarni nishonga olmoqda",
    description: "Kiberxavfsizlik tadqiqotchilari yangi turdagi ransomware zararli dasturini aniqladilar. Bu dastur AES-256 shifrlashdan foydalanib, korporativ tarmoqlarni nishonga olmoqda.",
    source: 'CyberNews UZ',
    url: '#',
    imageUrl: null,
    category: 'Ransomware',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    readTime: 3,
  },
  {
    id: '2',
    title: "Microsoft muhim xavfsizlik yamog'ini chiqardi",
    description: "Microsoft Windows operatsion tizimida kritik zaiflik aniqlandi va tezkor yamog' chiqarildi. Foydalanuvchilarga tizimlarini zudlik bilan yangilash tavsiya etiladi.",
    source: 'TechSecurity',
    url: '#',
    imageUrl: null,
    category: 'Zaiflik',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    readTime: 2,
  },
  {
    id: '3',
    title: "Phishing hujumlari 2024 yilda 65% ga oshdi",
    description: "Xalqaro kiberxavfsizlik instituti ma'lumotlariga ko'ra, fishing hujumlarining soni o'tgan yilga nisbatan keskin oshdi. Sun'iy intellekt yordamida yaratilgan soxta emaillar asosiy xavf manbaiga aylandi.",
    source: 'SecurityWeek',
    url: '#',
    imageUrl: null,
    category: 'Fishing hujumi',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    readTime: 4,
  },
  {
    id: '4',
    title: "ChatGPT orqali yangi ijtimoiy muhandislik metodlari paydo bo'ldi",
    description: "Sun'iy intellekt texnologiyalaridan noto'g'ri foydalanish kiberxavfsizlik sohasida yangi xavflarni keltirib chiqarmoqda. Mutaxassislar AI-yordamida yaratilgan soxta kontentdan ehtiyot bo'lishga chaqirmoqda.",
    source: 'AI Security Today',
    url: '#',
    imageUrl: null,
    category: 'Ijtimoiy muhandislik',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    readTime: 5,
  },
  {
    id: '5',
    title: "Zero-day zaiflik Chrome brauzerida aniqlandi",
    description: "Google Chrome brauzerida kritik zero-day zaiflik topildi. Tajovuzkorlar bu zaiflikdan foydalanib foydalanuvchilarning qurilmalariga to'liq kirish imkoniga ega bo'lishi mumkin.",
    source: 'Google Security Blog',
    url: '#',
    imageUrl: null,
    category: 'Zaiflik',
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    readTime: 3,
  },
  {
    id: '6',
    title: "O'zbekistonda kiberxavfsizlik bo'yicha yangi qonun qabul qilindi",
    description: "O'zbekiston parlamenti axborot xavfsizligini kuchaytirish maqsadida yangi qonunchilik hujjatlarini qabul qildi. Qonun tashkilotlarning kiberxavfsizlik talablarini belgilab beradi.",
    source: 'UzTech News',
    url: '#',
    imageUrl: null,
    category: 'Kiberxavfsizlik',
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    readTime: 4,
  },
  {
    id: '7',
    title: "DDoS hujumlar yangi rekordni yangiladi: 3.8 Tbps",
    description: "Cloudflare o'tgan oyda sodir bo'lgan eng katta DDoS hujumini qaytarib yubordi. 3.8 terabit/sekundlik bu hujum tarixdagi eng kuchli kiberhujum sifatida qayd etildi.",
    source: 'Cloudflare Blog',
    url: '#',
    imageUrl: null,
    category: 'Kiberxavfsizlik',
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
    readTime: 6,
  },
  {
    id: '8',
    title: "Passkey texnologiyasi parollarni almashtirishga tayyor",
    description: "Yirik texnologiya kompaniyalari passkey texnologiyasini keng joriy etmoqda. Bu yangi usul an'anaviy parollardan ko'ra ancha xavfsiz va qulay hisoblanadi.",
    source: 'FIDO Alliance',
    url: '#',
    imageUrl: null,
    category: 'Xavfsizlik',
    publishedAt: new Date(Date.now() - 518400000).toISOString(),
    readTime: 3,
  },
];

export async function fetchCyberNews(page = 1, pageSize = 8) {
  // Check cache
  if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
    const start = (page - 1) * pageSize;
    return {
      articles: cache.data.slice(start, start + pageSize),
      total: cache.data.length,
      fromCache: true,
    };
  }

  if (!NEWS_API_KEY || NEWS_API_KEY === 'demo') {
    cache = { data: DEMO_NEWS, timestamp: Date.now() };
    const start = (page - 1) * pageSize;
    return {
      articles: DEMO_NEWS.slice(start, start + pageSize),
      total: DEMO_NEWS.length,
      fromCache: false,
    };
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=cybersecurity+hacking+malware+phishing&sortBy=publishedAt&pageSize=40&language=en&apiKey=${NEWS_API_KEY}`,
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) throw new Error('News API xatosi');

    const data = await res.json();
    const articles = (data.articles || [])
      .filter(a => a.title && a.description && !a.title.includes('[Removed]'))
      .map((a, idx) => ({
        id: String(idx + 1),
        title: a.title,
        description: a.description,
        source: a.source?.name || 'Xabar manbai',
        url: a.url,
        imageUrl: a.urlToImage,
        category: categorizeArticle(a.title, a.description),
        publishedAt: a.publishedAt,
        readTime: estimateReadTime(a.content),
      }));

    cache = { data: articles, timestamp: Date.now() };
    const start = (page - 1) * pageSize;
    return {
      articles: articles.slice(start, start + pageSize),
      total: articles.length,
      fromCache: false,
    };
  } catch {
    cache = { data: DEMO_NEWS, timestamp: Date.now() };
    const start = (page - 1) * pageSize;
    return {
      articles: DEMO_NEWS.slice(start, start + pageSize),
      total: DEMO_NEWS.length,
      fromCache: false,
    };
  }
}
