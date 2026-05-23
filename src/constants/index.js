// src/constants/index.js

export const ROLES = {
  ADMIN: 'admin',
  OQITUVCHI: 'oqituvchi',
  TALABA: 'talaba',
  MUTAXASSIS: 'mutaxassis',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  oqituvchi: "O'qituvchi",
  talaba: 'Talaba',
  mutaxassis: 'Xavfsizlik mutaxassisi',
};

export const THREAT_TYPES = {
  FISHING: 'fishing',
  MALWARE: 'zararli_dastur',
  SPAM: 'spam',
  RANSOMWARE: 'ransomware',
  SUSPICIOUS: 'shubhali_faoliyat',
  DDOS: 'ddos',
  PHISHING: 'fishing',
  CLEAN: 'xavfsiz',
};

export const THREAT_LABELS = {
  fishing: 'Fishing',
  zararli_dastur: 'Zararli dastur',
  spam: 'Spam',
  ransomware: 'Ransomware',
  shubhali_faoliyat: 'Shubhali faoliyat',
  ddos: 'DDoS hujumi',
  xavfsiz: 'Xavfsiz',
};

export const RISK_LEVELS = {
  SAFE: 'xavfsiz',
  LOW: 'past_xavf',
  MEDIUM: 'orta_xavf',
  HIGH: 'yuqori_xavf',
  CRITICAL: 'kritik',
};

export const RISK_COLORS = {
  xavfsiz: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', glow: 'shadow-glow-green' },
  past_xavf: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-cyber' },
  orta_xavf: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', glow: '' },
  yuqori_xavf: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-glow-orange' },
  kritik: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-glow-red' },
};

export const RISK_SCORE_LEVELS = {
  getRisk(score) {
    if (score <= 10) return 'xavfsiz';
    if (score <= 30) return 'past_xavf';
    if (score <= 60) return 'orta_xavf';
    if (score <= 80) return 'yuqori_xavf';
    return 'kritik';
  },
  getLabel(score) {
    if (score <= 10) return 'Xavfsiz';
    if (score <= 30) return 'Past xavf';
    if (score <= 60) return "O'rta xavf";
    if (score <= 80) return 'Yuqori xavf';
    return 'Kritik';
  },
};

export const REPORT_STATUS = {
  PENDING: 'kutilmoqda',
  REVIEWING: "ko'rib_chiqilmoqda",
  APPROVED: 'tasdiqlangan',
  REJECTED: 'rad_etilgan',
};

export const REPORT_STATUS_LABELS = {
  kutilmoqda: 'Kutilmoqda',
  "ko'rib_chiqilmoqda": "Ko'rib chiqilmoqda",
  tasdiqlangan: 'Tasdiqlangan',
  rad_etilgan: 'Rad etilgan',
};

export const SEVERITY_LEVELS = ['past', 'orta', 'yuqori', 'kritik'];
export const SEVERITY_LABELS = {
  past: 'Past',
  orta: "O'rta",
  yuqori: 'Yuqori',
  kritik: 'Kritik',
};

export const LEARNING_MODULES = [
  {
    id: 'fishing',
    title: 'Fishing hujumlari',
    icon: '🎣',
    description: "Fishing hujumlarini aniqlash va o'zingizni himoya qilish usullari",
    duration: '45 daqiqa',
    lessons: 8,
    difficulty: 'Boshlang\'ich',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'parol',
    title: 'Parol xavfsizligi',
    icon: '🔐',
    description: "Kuchli parollar yaratish va parol menejeri ishlatish",
    duration: '30 daqiqa',
    lessons: 6,
    difficulty: 'Boshlang\'ich',
    color: 'from-green-600 to-emerald-600',
  },
  {
    id: 'ijtimoiy',
    title: 'Ijtimoiy muhandislik',
    icon: '🎭',
    description: "Manipulyatsiya texnikalarini tushunish va ularga qarshi kurash",
    duration: '60 daqiqa',
    lessons: 10,
    difficulty: "O'rta",
    color: 'from-purple-600 to-violet-600',
  },
  {
    id: 'malware',
    title: 'Zararli dasturlar',
    icon: '🦠',
    description: "Virus, troyan va boshqa zararli dasturlar haqida",
    duration: '50 daqiqa',
    lessons: 9,
    difficulty: "O'rta",
    color: 'from-red-600 to-rose-600',
  },
  {
    id: 'tarmoq',
    title: 'Tarmoq hujumlari',
    icon: '🌐',
    description: "DDoS, MITM va boshqa tarmoq hujumlarini tushunish",
    duration: '70 daqiqa',
    lessons: 12,
    difficulty: 'Murakkab',
    color: 'from-orange-600 to-amber-600',
  },
  {
    id: 'kriptografiya',
    title: 'Kriptografiya asoslari',
    icon: '🔑',
    description: "Shifrlash, kalitlar va xavfsiz aloqa asoslari",
    duration: '80 daqiqa',
    lessons: 14,
    difficulty: 'Murakkab',
    color: 'from-yellow-600 to-lime-600',
  },
];

export const NAVIGATION_ITEMS = [
  { href: '/dashboard', label: 'Boshqaruv paneli', icon: 'LayoutDashboard' },
  { href: '/tahdidlar', label: 'Tahdidlarni aniqlash', icon: 'Shield' },
  { href: '/zaiflik', label: 'Zaiflik skaneri', icon: 'Search' },
  { href: '/hisobotlar', label: 'Hodisa hisobotlari', icon: 'FileText' },
  { href: '/talim', label: "Ta'lim markazi", icon: 'BookOpen' },
  { href: '/yangiliklar', label: 'Kiberxavfsizlik yangiliklari', icon: 'Newspaper' },
  { href: '/analitika', label: 'Analitika', icon: 'BarChart3' },
  { href: '/chat', label: 'AI Yordamchi', icon: 'Bot' },
];

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Admin paneli', icon: 'Settings2' },
  { href: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: 'Users' },
  { href: '/admin/hisobotlar', label: 'Hisobotlar', icon: 'ClipboardList' },
  { href: '/admin/kontent', label: 'Kontent boshqaruvi', icon: 'Edit' },
];

export const QUIZ_QUESTIONS = {
  fishing: [
    {
      id: 1,
      question: "Fishing hujumining asosiy maqsadi nima?",
      options: [
        "Tizimni sekinlashtirish",
        "Maxfiy ma'lumotlarni o'g'irlash",
        "Faylllarni shifrlash",
        "Tarmoqni bloklash"
      ],
      correct: 1,
      explanation: "Fishing hujumlari asosan login, parol va bank ma'lumotlarini o'g'irlash uchun qo'llaniladi."
    },
    {
      id: 2,
      question: "Qaysi belgi fishing emailini ko'rsatishi mumkin?",
      options: [
        "Rasmiy domendan kelgan email",
        "Shoshilishga undovchi so'rovlar",
        "Personallashtirilgan murojaat",
        "To'g'ri grammatika"
      ],
      correct: 1,
      explanation: "Fishing emaillar ko'pincha shoshilishga undash, qo'rqitish yoki jozibali taklif bilan keladi."
    },
    {
      id: 3,
      question: "URL tekshirishda nimaga e'tibor berish kerak?",
      options: [
        "Domenning uzunligiga",
        "SSL sertifikatiga",
        "HTTPS va to'g'ri domen nomiga",
        "Rangiga"
      ],
      correct: 2,
      explanation: "HTTPS va domen nomining to'g'riligini tekshirish fishing saytlardan himoya qiladi."
    },
  ],
  parol: [
    {
      id: 1,
      question: "Kuchli parol qanday bo'lishi kerak?",
      options: [
        "8 ta raqam",
        "Tug'ilgan sana",
        "Katta-kichik harf, raqam va belgilar aralashmasi",
        "Ism va familiya"
      ],
      correct: 2,
      explanation: "Kuchli parol kamida 12 ta belgi, katta-kichik harflar, raqamlar va maxsus belgilardan iborat bo'lishi kerak."
    },
    {
      id: 2,
      question: "Parollarni qaerda saqlash eng xavfsiz?",
      options: [
        "Notepad faylida",
        "Browser parol menejerida",
        "Maxsus shifrlangan parol menejerida",
        "Qog'ozda"
      ],
      correct: 2,
      explanation: "BitWarden, 1Password kabi shifrlangan parol menejerlari eng xavfsiz variant hisoblanadi."
    },
  ],
  malware: [
    {
      id: 1,
      question: "Ransomware nima qiladi?",
      options: [
        "Spam yuboradi",
        "Fayllarni shifrlaydi va to'lov talab qiladi",
        "Tizimni sekinlashtiradi",
        "Parollarni o'g'irlaydi"
      ],
      correct: 1,
      explanation: "Ransomware qurbonning fayllarini shifrlaydi va ularni qaytarish uchun to'lov (fidya) talab qiladi."
    },
  ],
};

export const APP_META = {
  title: 'CyberGuard UZ - Kiberxavfsizlik tizimi',
  description: 'Kiberxavfsizlikda tahdidlarni aniqlash va risklarni kamaytirish usullari',
  keywords: 'kiberxavfsizlik, tahdid aniqlash, xavfsizlik, o\'zbek, cybersecurity',
  author: 'CyberGuard UZ',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://cyberguard-uz.vercel.app',
};
