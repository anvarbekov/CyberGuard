# 🛡️ CyberGuard UZ

**Kiberxavfsizlikda tahdidlarni aniqlash va risklarni kamaytirish usullari**

> Production-ready kiberxavfsizlik platformasi — BMI loyihasi

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

---

## 📋 Loyiha haqida

CyberGuard UZ — bu kiberxavfsizlik sohasida real vaqtli tahdidlarni aniqlash, risklarni baholash va foydalanuvchilarni o'qitish uchun mo'ljallangan to'liq funksional web ilovasi.

### 🎯 Asosiy imkoniyatlar

| Modul | Tavsif |
|-------|--------|
| 🔐 Autentifikatsiya | Email/parol + Google, 4 ta rol tizimi |
| 🎯 Tahdid aniqlash | URL, IP, matn tahlili (VirusTotal, AbuseIPDB) |
| 🤖 AI Yordamchi | Gemini + OpenRouter chatbot (o'zbek tilida) |
| 🔍 Zaiflik skaneri | HTTPS, security headers, texnologiya aniqlash |
| 📊 Analitika | Real-time grafiklar, trend tahlili |
| 📚 Ta'lim markazi | 6 modul, quiz, badge, XP tizimi |
| 📰 Yangiliklar | Kiberxavfsizlik yangiliklari (NewsAPI) |
| 🔔 Bildirishnomalar | Firebase real-time push notifications |
| 👮 Admin panel | Foydalanuvchi va hisobot boshqaruvi |

---

## 🚀 O'rnatish

### Talablar

- Node.js 18.x yoki undan yuqori
- npm 9.x yoki yarn
- Firebase loyihasi (bepul)
- (Ixtiyoriy) Vercel akkaunt

### 1. Repositoryni klonlash

```bash
git clone https://github.com/your-username/cyberguard-uz.git
cd cyberguard-uz
```

### 2. Paketlarni o'rnatish

```bash
npm install
```

### 3. Muhit o'zgaruvchilarini sozlash

`.env.local.example` faylini nusxalab `.env.local` nomini bering:

```bash
cp .env.local.example .env.local
```

Keyin quyidagi yo'riqnoma bo'yicha barcha API kalitlarini kiriting.

---

## 🔑 API Kalitlari — Batafsil Yo'riqnoma

### Firebase (MAJBURIY)

1. [Firebase Console](https://console.firebase.google.com) ga kiring
2. "Add project" tugmasini bosing
3. Loyiha nomini kiriting: `cyberguard-uz`
4. **Authentication** → Sign-in method → Email/Password va Google ni yoqing
5. **Firestore Database** → Create database → Production mode
6. **Storage** → Get started
7. Project Settings → Your apps → Web app qo'shing
8. Olingan config ma'lumotlarini `.env.local` ga kiriting

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cyberguard-uz.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cyberguard-uz
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cyberguard-uz.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Firebase Admin SDK** (server tomoni uchun):
1. Project Settings → Service accounts → Generate new private key
2. JSON fayldan quyidagi ma'lumotlarni oling:

```env
FIREBASE_PROJECT_ID=cyberguard-uz
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@cyberguard-uz.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Cloudinary (MAJBURIY — rasm yuklash uchun)

1. [cloudinary.com](https://cloudinary.com) da bepul akkaunt oching
2. Dashboard dan quyidagilarni oling:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret
```

### Google Gemini AI (TAVSIYA ETILADI)

1. [Google AI Studio](https://aistudio.google.com) ga kiring
2. "Get API key" → "Create API key"

```env
GEMINI_API_KEY=AIzaSy...
```

### OpenRouter (IXTIYORIY — AI backup)

1. [openrouter.ai](https://openrouter.ai) da akkaunt oching
2. Keys → Create Key

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

### VirusTotal (TAVSIYA ETILADI — URL tahlili)

1. [virustotal.com](https://virustotal.com) da akkaunt oching
2. Profile → API Key

```env
VIRUSTOTAL_API_KEY=your-64-char-key
```

### AbuseIPDB (IXTIYORIY — IP tahlili)

1. [abuseipdb.com](https://abuseipdb.com) da akkaunt oching
2. API → Create Key (bepul: 1000 so'rov/kun)

```env
ABUSEIPDB_API_KEY=your-api-key
```

### NewsAPI (IXTIYORIY — yangiliklar)

1. [newsapi.org](https://newsapi.org) da bepul akkaunt oching
2. API key ni oling

```env
NEWS_API_KEY=your-news-api-key
```

---

## 🔥 Firebase sozlamalari

### Firestore Rules yuklash

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### Firestore Indexes yuklash

```bash
firebase deploy --only firestore:indexes
```

### Storage Rules yuklash

```bash
firebase deploy --only storage
```

### Birinchi Admin foydalanuvchisini yaratish

Ilovaga ro'yxatdan o'tgach, Firebase Console → Firestore → `users` kolleksiyasida o'z hujjatingizni toping va `role` maydonini `admin` ga o'zgartiring.

---

## 🏃 Ishga tushirish

### Development rejimi

```bash
npm run dev
```

Brauzerda `http://localhost:3000` ni oching.

### Production build

```bash
npm run build
npm start
```

---

## 📁 Loyiha strukturasi

```
cyberguard/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Server-side API routes
│   │   │   ├── admin/stats/          # Admin statistika
│   │   │   ├── chat/                 # AI chat endpoint
│   │   │   ├── news/                 # Yangiliklar proxy
│   │   │   ├── reports/              # Hisobotlar CRUD
│   │   │   ├── scan/                 # Zaiflik skaneri
│   │   │   └── threats/analyze/      # Tahdid tahlili
│   │   ├── auth/                     # Autentifikatsiya sahifalari
│   │   │   ├── kirish/               # Login
│   │   │   ├── royxat/               # Register
│   │   │   └── parol-tiklash/        # Parol tiklash
│   │   ├── dashboard/                # Asosiy panel
│   │   │   ├── admin/                # Admin panel
│   │   │   │   ├── foydalanuvchilar/ # Foydalanuvchi boshqaruvi
│   │   │   │   └── hisobotlar/       # Hisobot boshqaruvi
│   │   │   ├── analitika/            # Analitika
│   │   │   ├── chat/                 # AI chatbot
│   │   │   ├── hisobotlar/           # Hodisa hisobotlari
│   │   │   ├── profil/               # Profil
│   │   │   ├── sozlamalar/           # Sozlamalar
│   │   │   ├── tahdidlar/            # Tahdid aniqlash
│   │   │   ├── talim/                # Ta'lim markazi
│   │   │   ├── yangiliklar/          # Yangiliklar
│   │   │   └── zaiflik/              # Zaiflik skaneri
│   │   ├── globals.css               # Global stillar + cyber tema
│   │   ├── layout.jsx                # Root layout + SEO
│   │   ├── page.jsx                  # Yo'naltiruvchi sahifa
│   │   ├── robots.js                 # SEO robots
│   │   └── sitemap.js                # SEO sitemap
│   ├── components/
│   │   ├── common/
│   │   │   ├── ConfirmDialog.jsx     # Tasdiqlash modali
│   │   │   ├── LoadingScreen.jsx     # Yuklanish ekrani
│   │   │   └── PageHeader.jsx        # Sahifa sarlavhasi
│   │   └── layout/
│   │       ├── Sidebar.jsx           # Yon panel navigatsiya
│   │       └── TopBar.jsx            # Yuqori panel
│   ├── constants/
│   │   └── index.js                  # Konstantalar, labellar
│   ├── context/
│   │   └── AuthContext.jsx           # Auth holati va funksiyalar
│   ├── firebase/
│   │   ├── admin.js                  # Firebase Admin SDK
│   │   ├── collections.js            # Firestore CRUD yordamchilari
│   │   └── config.js                 # Firebase client config
│   ├── middleware.js                 # Route himoyasi
│   ├── services/
│   │   ├── aiService.js              # Gemini + OpenRouter AI
│   │   ├── cloudinaryService.js      # Rasm yuklash
│   │   ├── newsService.js            # Yangiliklar API
│   │   ├── scanService.js            # Zaiflik skaneri
│   │   └── threatService.js          # Tahdid tahlili APIs
│   └── utils/
│       └── index.js                  # Yordamchi funksiyalar
├── .env.local.example                # Muhit o'zgaruvchilari namunasi
├── .gitignore
├── firebase.json                     # Firebase config
├── firestore.indexes.json            # Firestore indekslari
├── firestore.rules                   # Firestore xavfsizlik qoidalari
├── jsconfig.json                     # JS path aliases
├── next.config.js                    # Next.js config
├── package.json
├── postcss.config.js
├── storage.rules                     # Storage xavfsizlik qoidalari
└── tailwind.config.js                # Tailwind + cyber tema
```

---

## 🚀 Vercel ga Deploy qilish

### 1. GitHub ga yuklash

```bash
git init
git add .
git commit -m "feat: CyberGuard UZ - initial commit"
git branch -M main
git remote add origin https://github.com/your-username/cyberguard-uz.git
git push -u origin main
```

### 2. Vercel bilan ulash

1. [vercel.com](https://vercel.com) ga kiring
2. "New Project" → GitHub repo ni tanlang
3. Framework: **Next.js** (avtomatik aniqlanadi)
4. **Environment Variables** bo'limiga barcha `.env.local` o'zgaruvchilarini qo'shing
5. "Deploy" tugmasini bosing

### 3. Domain sozlash (ixtiyoriy)

Vercel dashboard → Domains → `cyberguard.uz` ni qo'shing

---

## 🔒 Xavfsizlik

- Barcha API kalitlari server-side (faqat `NEXT_PUBLIC_` bilan boshlanuvchilar client-side)
- Firebase Auth token har so'rovda tekshiriladi
- Rate limiting: tahdid tahlili (20/min), skanerlash (10/min), chat (20/min)
- XSS himoyasi: input sanitizatsiya
- CSRF: Next.js built-in himoya
- Security headers: CSP, HSTS, X-Frame-Options
- Firestore Rules: rol asosida kirish nazorati

---

## 🎨 Dizayn tizimi

| Token | Qiymat | Maqsad |
|-------|--------|--------|
| `cyber-black` | `#0a0e1a` | Asosiy fon |
| `cyber-dark` | `#0d1117` | Ikkinchi fon |
| `cyber-card` | `#111827` | Karta fonlari |
| `cyber-accent` | `#00d4ff` | Neon ko'k |
| `cyber-green` | `#00ff88` | Neon yashil |
| `cyber-red` | `#ff2d55` | Xavf rangi |
| `cyber-yellow` | `#ffd60a` | Ogohlantirish |

**Shriftlar:**
- `Orbitron` — Sarlavhalar va brandlar
- `Space Grotesk` — Asosiy matn
- `JetBrains Mono` — Kod va texnik ma'lumotlar

---

## 📊 Demo ma'lumotlari

Firebase ulashilmagan holda barcha sahifalar demo ma'lumotlar bilan ishlaydi. Haqiqiy integratsiya uchun `.env.local` faylidagi barcha kalitlarni to'ldiring.

---

## 🤝 Muallif

**CyberGuard UZ** — BMI (Bitiruv Malakaviy Ishi) loyihasi

> *"Kiberxavfsizlik — bu texnologiya emas, bu madaniyat."*

---

## 📜 Litsenziya

Bu loyiha ta'lim maqsadlarida yaratilgan. Barcha huquqlar himoyalangan.
# CyberGuard
