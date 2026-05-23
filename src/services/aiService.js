// src/services/aiService.js
// AI providers: Gemini (1-ustuvor) → Groq (2-ustuvor) → OpenRouter (3-ustuvor) → Demo (fallback)

const SYSTEM_PROMPT = `Sen CyberGuard UZ kiberxavfsizlik yordamchisisisan. O'zbek tilida javob berasan.
Faqat kiberxavfsizlik, axborot xavfsizligi, tarmoq xavfsizligi, raqamli xavfsizlik mavzularida yordam berasan.
Javoblaringni qisqa, tushunarli va amaliy qil. Texnik atamalarni o'zbek tilida tushuntir.
Agar savol kiberxavfsizlikdan tashqarida bo'lsa, "Bu savol kiberxavfsizlik sohasidan tashqarida" deb javob ber.

Yordam berish mumkin bo'lgan mavzular:
- Phishing (fishing) hujumlaridan himoya
- Parol xavfsizligi va boshqaruvi
- Zararli dasturlardan himoya
- VPN va tarmoq xavfsizligi
- Ijtimoiy muhandislik hujumlari
- Ma'lumotlarni shifrlash
- Veb-sayt xavfsizligi (XSS, SQL injection, CSRF)
- Kibergigiena va xavfsiz internet foydalanish
- Ikki faktorli autentifikatsiya (2FA)
- Zaifliklarni aniqlash va bartaraf etish`;

// ─── 1. GEMINI (Google) ──────────────────────────────────────────────────────
async function callGemini(messages, apiKey) {
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 0.9 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Javob olinmadi.";
}

// ─── 2. GROQ (llama-3 — bepul va tez) ─────────────────────────────────────
async function callGroq(messages, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',  // eng tez bepul model
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.filter(m => m.role !== 'system'),
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Javob olinmadi.";
}

// ─── 3. OPENROUTER (bepul modellar) ──────────────────────────────────────────
async function callOpenRouter(messages, apiKey) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://cyberguard.uz',
      'X-Title': 'CyberGuard UZ',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.filter(m => m.role !== 'system'),
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Javob olinmadi.";
}

// ─── 4. DEMO (offline fallback) ───────────────────────────────────────────────
function getFallbackResponse(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.includes('fishing') || msg.includes('phishing')) {
    return `**Fishing (Phishing) hujumlari haqida:**

Fishing — bu aldamchi usul bo'lib, tajovuzkorlar siz ishonchli sayt yoki shaxs deb o'ylaganingizda shaxsiy ma'lumotlaringizni o'g'irlashga harakat qiladi.

**Qanday tanish mumkin:**
• URL manzilni diqqat bilan tekshiring (harf o'zgarishlari: g00gle.com)
• Shoshilinch va qo'rqinchli xabarlardan ehtiyot bo'ling
• Norasmiy emaillardan havolalarga bosmang
• SSL sertifikatini (🔒) tekshiring

**Himoya usullari:**
• Ikki faktorli autentifikatsiya (2FA) yoqing
• Parol menejeri ishlating
• Email filtrlarini sozlang`;
  }

  if (msg.includes('parol') || msg.includes('password')) {
    return `**Kuchli parol yaratish bo'yicha maslahat:**

**Qoidalar:**
• Kamida 12 ta belgi ishlating
• Katta va kichik harflar qo'shing (A-Z, a-z)
• Raqamlar va maxsus belgilar (@#$%^&*)
• Har xil saytlarda turli parollardan foydalaning

**Maslahat:**
✅ Parol menejeri ishlating (Bitwarden — bepul)
✅ Ikki faktorli autentifikatsiya yoqing
❌ 123456, qwerty, ismingiz kabi parollardan saqlaning`;
  }

  if (msg.includes('virus') || msg.includes('zararli') || msg.includes('malware')) {
    return `**Zararli dasturlardan himoya:**

**Turlari:** Virus, Troyan, Ransomware, Spyware

**Himoya choralari:**
✅ Antivirus dasturini yangilab turing
✅ OS va ilovalarni yangilang
✅ Noma'lum manbalardan fayl yuklamang
✅ Muhim ma'lumotlarni zaxiralang (backup)`;
  }

  if (msg.includes('vpn') || msg.includes('tarmoq') || msg.includes('wifi')) {
    return `**Tarmoq xavfsizligi maslahatlari:**

**Ommaviy Wi-Fi da:**
• VPN ishlating (Proton VPN — bepul)
• HTTPS saytlardan foydalaning
• Muhim ma'lumotlarni kirmang

**Uy tarmog'i:**
• Router parolini o'zgartiring
• WPA3 shifrlashni yoqing
• Router dasturini yangilab turing`;
  }

  if (msg.includes('2fa') || msg.includes('ikki faktor') || msg.includes('autentifikatsiya')) {
    return `**Ikki faktorli autentifikatsiya (2FA):**

2FA — bu kirish uchun paroldan tashqari ikkinchi tasdiqlash talab qiluvchi xavfsizlik usuli.

**Turlari:**
• SMS kod (kam xavfsiz)
• Autentifikator ilova (Google/Microsoft Authenticator — tavsiya)
• Apparat kalit (YubiKey — eng ishonchli)

**Qanday yoqish:**
1. Hisobingiz sozlamalariga kiring
2. Xavfsizlik bo'limini toping
3. 2FA yoki ikki bosqichli tasdiqlashni yoqing
4. QR kodni Authenticator ilovasi bilan skanerlang`;
  }

  return `**CyberGuard AI Yordamchi**

Kiberxavfsizlik bo'yicha quyidagi mavzularda yordam bera olaman:

• 🎣 **Fishing hujumlari** — qanday tanish va himoyalanish
• 🔐 **Parol xavfsizligi** — kuchli parol yaratish
• 🦠 **Zararli dasturlar** — viruslar va himoya
• 🌐 **Tarmoq xavfsizligi** — VPN, Wi-Fi himoyasi
• 🔒 **2FA** — ikki faktorli autentifikatsiya
• 🛡️ **Umumiy kibergigiena**

Savolingizni aniqroq yozing!`;
}

// ─── ASOSIY FUNKSIYA ──────────────────────────────────────────────────────────
export async function sendChatMessage(messages) {
  const geminiKey  = process.env.GEMINI_API_KEY;
  const groqKey    = process.env.GROQ_API_KEY;
  const openrKey   = process.env.OPENROUTER_API_KEY;

  const lastMessage = messages[messages.length - 1]?.content || '';

  // 1️⃣ Gemini
  if (geminiKey && !geminiKey.includes('your_')) {
    try {
      const text = await callGemini(messages, geminiKey);
      return { text, provider: 'gemini' };
    } catch (e) { console.warn('Gemini:', e.message); }
  }

  // 2️⃣ Groq
  if (groqKey && !groqKey.includes('your_')) {
    try {
      const text = await callGroq(messages, groqKey);
      return { text, provider: 'groq' };
    } catch (e) { console.warn('Groq:', e.message); }
  }

  // 3️⃣ OpenRouter
  if (openrKey && !openrKey.includes('your_')) {
    try {
      const text = await callOpenRouter(messages, openrKey);
      return { text, provider: 'openrouter' };
    } catch (e) { console.warn('OpenRouter:', e.message); }
  }

  // 4️⃣ Demo fallback
  const text = getFallbackResponse(lastMessage);
  return { text, provider: 'demo' };
}

export async function analyzeThreatWithAI(threatData) {
  const prompt = `Quyidagi tahdid ma'lumotlarini tahlil qil va O'zbek tilida qisqa (3-5 jumla) tushuntirma ber:

Tahdid turi: ${threatData.type}
Risk darajasi: ${threatData.riskScore}/100
Aniqlangan muammolar: ${threatData.issues?.join(', ') || "yo'q"}

Tavsiya va himoya choralarini ham ayt.`;

  return sendChatMessage([{ role: 'user', content: prompt }]);
}
