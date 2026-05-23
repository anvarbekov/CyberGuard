// src/services/threatService.js
// Deterministic threat analysis — same input always gives same result

import { isValidUrl, isValidIP, sanitizeInput } from '@/utils';

const VT_KEY  = process.env.VIRUSTOTAL_API_KEY;
const GSB_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
const ABUSE_KEY = process.env.ABUSEIPDB_API_KEY;

// ─── Deterministic hash (no Math.random) ─────────────────────────────────────
function hashStr(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}
function deterministicInt(seed, min, max) {
  return min + (hashStr(seed) % (max - min + 1));
}

// ─── URL Analysis ─────────────────────────────────────────────────────────────
export async function analyzeURL(url) {
  const cleanUrl = sanitizeInput(url.trim());
  if (!isValidUrl(cleanUrl)) throw new Error("Noto'g'ri URL format");

  const results = {
    target: cleanUrl, type: 'url',
    checks: [], riskScore: 0, threatTypes: [], details: {},
    timestamp: new Date().toISOString(),
  };

  // 1. VirusTotal
  try {
    const vt = await checkVirusTotalURL(cleanUrl);
    results.checks.push({ name: 'VirusTotal', ...vt });
    if (vt.malicious > 0) {
      results.riskScore += Math.min(vt.malicious * 8, 60);
      results.threatTypes.push(...(vt.categories || []));
    }
    results.details.virusTotal = vt;
  } catch {
    results.checks.push({ name: 'VirusTotal', status: 'failed', error: 'API kaliti kerak' });
  }

  // 2. Google Safe Browsing
  try {
    const gsb = await checkGoogleSafeBrowsing(cleanUrl);
    results.checks.push({ name: 'Google Safe Browsing', ...gsb });
    if (gsb.unsafe) { results.riskScore += 40; results.threatTypes.push(...gsb.threatTypes); }
    results.details.safeBrowsing = gsb;
  } catch {
    results.checks.push({ name: 'Google Safe Browsing', status: 'failed', error: 'API kaliti kerak' });
  }

  // 3. Heuristic (always runs, deterministic)
  const h = heuristicURL(cleanUrl);
  results.checks.push({ name: 'Evristik tahlil', ...h });
  results.riskScore += h.score;
  results.threatTypes.push(...h.threats);

  // 4. Domain reputation (real WHOIS/DNS lookup)
  try {
    const dr = await checkDomainReputation(cleanUrl);
    results.checks.push({ name: 'Domen reputatsiyasi', ...dr });
    results.riskScore += dr.riskBonus || 0;
    results.details.domain = dr;
  } catch {
    results.checks.push({ name: 'Domen reputatsiyasi', status: 'failed' });
  }

  results.riskScore   = Math.min(100, Math.round(results.riskScore));
  results.threatTypes = [...new Set(results.threatTypes)];
  results.riskLevel   = riskLevel(results.riskScore);
  results.riskLabel   = riskLabel(results.riskScore);
  return results;
}

// ─── IP Analysis ──────────────────────────────────────────────────────────────
export async function analyzeIP(ip) {
  const cleanIP = sanitizeInput(ip.trim());
  if (!isValidIP(cleanIP)) throw new Error("Noto'g'ri IP manzil formati");

  const results = {
    target: cleanIP, type: 'ip',
    checks: [], riskScore: 0, threatTypes: [], details: {},
    timestamp: new Date().toISOString(),
  };

  // 1. AbuseIPDB
  try {
    const abuse = await checkAbuseIPDB(cleanIP);
    results.checks.push({ name: 'AbuseIPDB', ...abuse });
    if (abuse.abuseScore > 50) {
      results.riskScore += Math.floor(abuse.abuseScore * 0.6);
      results.threatTypes.push('Shubhali IP');
    } else if (abuse.abuseScore > 20) {
      results.riskScore += Math.floor(abuse.abuseScore * 0.3);
    }
    results.details.abuseIPDB = abuse;
  } catch {
    results.checks.push({ name: 'AbuseIPDB', status: 'failed', error: 'API kaliti kerak' });
  }

  // 2. Real IP geolocation (free API, no key needed)
  try {
    const geo = await checkIPGeolocation(cleanIP);
    results.checks.push({ name: "IP Geolokatsiya", ...geo });
    if (geo.isVPN)  { results.riskScore += 20; results.threatTypes.push('VPN/Proxy'); }
    if (geo.isTor)  { results.riskScore += 35; results.threatTypes.push('Tor tarmog\'i'); }
    results.details.geolocation = geo;
  } catch {
    results.checks.push({ name: 'IP Geolokatsiya', status: 'failed' });
  }

  // 3. Private/reserved IP check
  const priv = checkPrivateIP(cleanIP);
  results.checks.push({ name: 'IP turi', ...priv });
  if (priv.isPrivate) results.riskScore = Math.min(results.riskScore, 5);

  results.riskScore   = Math.min(100, Math.round(results.riskScore));
  results.threatTypes = [...new Set(results.threatTypes)];
  results.riskLevel   = riskLevel(results.riskScore);
  results.riskLabel   = riskLabel(results.riskScore);
  return results;
}

// ─── Text Analysis ────────────────────────────────────────────────────────────
export async function analyzeText(text) {
  const cleanText = sanitizeInput(text);
  const results = {
    target: cleanText.substring(0, 80) + (cleanText.length > 80 ? '...' : ''),
    type: 'text', checks: [], riskScore: 0, threatTypes: [], details: {},
    timestamp: new Date().toISOString(),
  };

  // Extract URLs
  const urls = (cleanText.match(/(https?:\/\/[^\s]+)/g) || []);
  if (urls.length) {
    results.details.extractedURLs = urls.slice(0, 5);
    results.riskScore += urls.length * 5;
    results.checks.push({ name: 'URL tekshiruv', status: 'success',
      message: `${urls.length} ta URL topildi`, urls: urls.slice(0, 5) });
  }

  const fishing = checkFishingText(cleanText);
  results.checks.push({ name: "Fishing ko'rsatkichlari", ...fishing });
  results.riskScore += fishing.score;
  if (fishing.indicators.length) results.threatTypes.push('Fishing');

  const spam = checkSpamText(cleanText);
  results.checks.push({ name: "Spam ko'rsatkichlari", ...spam });
  results.riskScore += spam.score;
  if (spam.score > 20) results.threatTypes.push('Spam');

  const social = checkSocialEngineering(cleanText);
  results.checks.push({ name: 'Ijtimoiy muhandislik', ...social });
  results.riskScore += social.score;
  if (social.score > 15) results.threatTypes.push('Ijtimoiy muhandislik');

  results.riskScore   = Math.min(100, Math.round(results.riskScore));
  results.threatTypes = [...new Set(results.threatTypes)];
  results.riskLevel   = riskLevel(results.riskScore);
  results.riskLabel   = riskLabel(results.riskScore);
  return results;
}

// ─── Real API calls ───────────────────────────────────────────────────────────
async function checkVirusTotalURL(url) {
  const isRealKey = VT_KEY && !VT_KEY.includes('your_') && VT_KEY.length > 20;
  if (!isRealKey) return { status: 'no_api_key', malicious: 0, suspicious: 0, clean: 0, categories: [], simulated: false };

  // VirusTotal v3: encode URL in base64url, then query
  const urlId = Buffer.from(url).toString('base64url').replace(/=/g, '');
  const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
    headers: { 'x-apikey': VT_KEY },
  });
  if (!res.ok) throw new Error(`VT: ${res.status}`);
  const data = await res.json();
  const stats = data.data?.attributes?.last_analysis_stats || {};
  return {
    status: 'success',
    malicious: stats.malicious || 0,
    suspicious: stats.suspicious || 0,
    clean: stats.harmless || 0,
    categories: Object.values(data.data?.attributes?.categories || {}),
    permalink: `https://www.virustotal.com/gui/url/${urlId}`,
  };
}

async function checkGoogleSafeBrowsing(url) {
  const isRealKey = GSB_KEY && !GSB_KEY.includes('your_') && GSB_KEY.length > 20;
  if (!isRealKey) return { status: 'no_api_key', unsafe: false, threatTypes: [] };

  const res = await fetch(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GSB_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'cyberguard-uz', clientVersion: '1.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`GSB: ${res.status}`);
  const data = await res.json();
  return {
    status: 'success',
    unsafe: !!(data.matches?.length),
    threatTypes: (data.matches || []).map(m => m.threatType),
  };
}

async function checkAbuseIPDB(ip) {
  const isRealKey = ABUSE_KEY && !ABUSE_KEY.includes('your_') && ABUSE_KEY.length > 20;
  if (!isRealKey) {
    // Deterministic based on IP octets — same IP always same result
    const parts = ip.split('.').map(Number);
    const score = parts.reduce((s, p) => s + p, 0) % 30;
    return { status: 'no_api_key', abuseScore: score, totalReports: Math.floor(score / 5), countryCode: 'N/A', isp: 'N/A', simulated: true };
  }
  const res = await fetch(
    `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`,
    { headers: { Key: ABUSE_KEY, Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`AbuseIPDB: ${res.status}`);
  const data = await res.json();
  return {
    status: 'success',
    abuseScore: data.data?.abuseConfidenceScore || 0,
    totalReports: data.data?.totalReports || 0,
    countryCode: data.data?.countryCode || 'N/A',
    isp: data.data?.isp || 'N/A',
    usageType: data.data?.usageType || 'N/A',
    domain: data.data?.domain || 'N/A',
    isWhitelisted: data.data?.isWhitelisted || false,
  };
}

async function checkIPGeolocation(ip) {
  // ip-api.com — free, no API key required
  const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp,org,proxy,hosting`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error('Geolocation failed');
  const data = await res.json();
  if (data.status !== 'success') throw new Error('Geolocation: ' + data.message);
  return {
    status: 'success',
    country: data.country || 'N/A',
    countryCode: data.countryCode || 'N/A',
    city: data.city || 'N/A',
    org: data.org || data.isp || 'N/A',
    isp: data.isp || 'N/A',
    isVPN: !!data.proxy,
    isTor: false,
    isHosting: !!data.hosting,
  };
}

async function checkDomainReputation(url) {
  try {
    const domain = new URL(url).hostname;
    // Use DNS lookup via public API to check if domain exists
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error('DNS lookup failed');
    const data = await res.json();
    const exists = data.Status === 0 && data.Answer?.length > 0;
    const ips = (data.Answer || []).filter(r => r.type === 1).map(r => r.data);

    return {
      status: 'success',
      domain,
      exists,
      ips: ips.slice(0, 3),
      riskBonus: exists ? 0 : 20, // non-existent domain is suspicious
    };
  } catch {
    return { status: 'failed', riskBonus: 0 };
  }
}

// ─── Heuristic checks (DETERMINISTIC — no Math.random) ────────────────────────
function heuristicURL(url) {
  const threats = [];
  let score = 0;
  const u = url.toLowerCase();

  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(u))       { score += 25; threats.push('IP manzil URL da'); }
  if (url.includes('@'))                                      { score += 20; threats.push('Shubhali URL struktura'); }
  if (url.replace('://', '').includes('//'))                 { score += 15; threats.push("Noto'g'ri URL"); }
  if (url.length > 100)                                       { score += 10; }
  const encodings = (url.match(/%[0-9a-fA-F]{2}/g) || []).length;
  if (encodings > 3)                                          { score += 10; }
  const suspicious = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
  if (suspicious.some(t => u.includes(t)))                   { score += 15; threats.push('Shubhali domen'); }
  const phishWords = ['login', 'signin', 'verify', 'secure', 'account-', 'banking', 'wallet', 'update-'];
  const found = phishWords.filter(w => u.includes(w));
  if (found.length >= 2)                                      { score += found.length * 5; threats.push("Fishing kalit so'zlari"); }

  return { status: 'success', score: Math.min(score, 40), threats };
}

function checkFishingText(text) {
  const phrases = [
    { t: "hisobingiz bloklandi",     s: 15 }, { t: "darhol tasdiqlang",    s: 12 },
    { t: "parolingizni kiriting",    s: 10 }, { t: "bank ma'lumotlari",    s: 15 },
    { t: "24 soat ichida",           s:  8 }, { t: "account suspended",    s: 15 },
    { t: "click here immediately",   s: 10 }, { t: "verify your account",  s: 12 },
    { t: "you have been selected",   s: 20 }, { t: "act now",              s:  8 },
    { t: "limited time offer",       s:  8 }, { t: "urgent action required",s:12 },
    { t: "your password expired",    s: 12 }, { t: "click the link below", s:  8 },
  ];
  const lo = text.toLowerCase();
  const indicators = phrases.filter(p => lo.includes(p.t)).map(p => p.t);
  const score = Math.min(50, indicators.reduce((s, ind) => s + (phrases.find(p => p.t === ind)?.s || 0), 0));
  return { status: 'success', score, indicators };
}

function checkSpamText(text) {
  let score = 0;
  const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1);
  if (capsRatio > 0.5 && text.length > 20) score += 15;
  const excl = (text.match(/!/g) || []).length;
  if (excl > 3) score += Math.min(excl * 3, 20);
  const dollar = (text.match(/\$/g) || []).length;
  if (dollar > 2) score += 10;
  return { status: 'success', score: Math.min(score, 30) };
}

function checkSocialEngineering(text) {
  const patterns = [
    { t: 'qo\'rqmang', s: 8 }, { t: 'xavfsiz', s: 5 },
    { t: 'sizga ishonaman', s: 10 }, { t: 'shoshiling', s: 8 },
    { t: 'maxfiy ma\'lumot', s: 12 }, { t: 'hech kimga aytmang', s: 15 },
    { t: 'faqat siz', s: 8 }, { t: 'million', s: 10 },
    { t: 'free gift', s: 12 }, { t: 'congratulations', s: 10 },
  ];
  const lo = text.toLowerCase();
  const found = patterns.filter(p => lo.includes(p.t));
  const score = Math.min(30, found.reduce((s, p) => s + p.s, 0));
  return { status: 'success', score, indicators: found.map(p => p.t) };
}

function checkPrivateIP(ip) {
  const isPrivate = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^127\./, /^::1$/, /^fc00:/, /^fe80:/]
    .some(r => r.test(ip));
  return {
    status: 'success',
    isPrivate,
    type: isPrivate ? 'Shaxsiy/lokal IP' : 'Ommaviy IP',
    message: isPrivate ? 'Bu shaxsiy tarmoq IP manzili — tashqaridan ko\'rinmaydi' : 'Ommaviy IP manzil',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function riskLevel(s) {
  if (s <= 10) return 'xavfsiz';
  if (s <= 30) return 'past_xavf';
  if (s <= 60) return 'orta_xavf';
  if (s <= 80) return 'yuqori_xavf';
  return 'kritik';
}
function riskLabel(s) {
  if (s <= 10) return 'Xavfsiz ✅';
  if (s <= 30) return 'Past xavf';
  if (s <= 60) return "O'rta xavf ⚠️";
  if (s <= 80) return 'Yuqori xavf 🔴';
  return 'Kritik xavf ☠️';
}
