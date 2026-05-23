// src/services/scanService.js
// Real HTTP-based security scanner — fetches actual headers from target URL

const SECURITY_HEADERS = [
  { name: 'strict-transport-security',   label: 'HSTS',                 weight: 15, desc: 'HTTPS majburiy ulanish' },
  { name: 'content-security-policy',     label: 'CSP',                  weight: 20, desc: 'Kontent xavfsizlik siyosati' },
  { name: 'x-frame-options',             label: 'Clickjacking himoyasi', weight: 10, desc: 'Iframe hujumlardan himoya' },
  { name: 'x-content-type-options',      label: 'MIME sniffing himoyasi',weight: 10, desc: 'MIME turi hujumlaridan himoya' },
  { name: 'referrer-policy',             label: 'Referrer siyosat',      weight:  5, desc: "Referrer ma'lumotlarini nazorat" },
  { name: 'permissions-policy',          label: 'Ruxsatlar siyosati',    weight: 10, desc: 'Brauzer API ruxsatlarini cheklash' },
  { name: 'x-xss-protection',            label: 'XSS himoyasi',          weight: 10, desc: 'Saytlararo skript himoyasi' },
  { name: 'cache-control',               label: 'Kesh nazorati',         weight:  5, desc: 'Kesh xavfsizligi' },
];

function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return 'https://' + url;
  return url;
}
function getDomain(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

// ─── Real HTTP fetch ──────────────────────────────────────────────────────────
async function fetchHeaders(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    // Try HEAD first (faster, no body download)
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CyberGuard-Scanner/1.0)',
        'Accept': '*/*',
      },
    });
    clearTimeout(timeout);
    return { ok: true, status: res.status, headers: res.headers, isHttps: url.startsWith('https://'), finalUrl: res.url };
  } catch {
    clearTimeout(timeout);
    // If HEAD fails, try GET with range to avoid downloading whole page
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 12000);
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: ctrl2.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CyberGuard-Scanner/1.0)',
          'Range': 'bytes=0-2048',
        },
      });
      clearTimeout(t2);
      return { ok: true, status: res.status, headers: res.headers, isHttps: url.startsWith('https://'), finalUrl: res.url };
    } catch (e) {
      clearTimeout(t2);
      return { ok: false, error: e.message };
    }
  }
}

// ─── Real header analysis ─────────────────────────────────────────────────────
function analyzeHeaders(headers) {
  let score = 0;
  const results = {};

  for (const h of SECURITY_HEADERS) {
    const val = headers.get(h.name);
    const present = !!val;
    results[h.name] = {
      present,
      label: h.label,
      description: h.desc,
      weight: h.weight,
      value: val || null,
    };
    if (present) score += h.weight;
  }
  return { headers: results, score };
}

// ─── Real technology detection from response headers ──────────────────────────
function detectTechFromHeaders(headers, url) {
  const techs = new Set();
  const server      = (headers.get('server') || '').toLowerCase();
  const powered     = (headers.get('x-powered-by') || '').toLowerCase();
  const via         = (headers.get('via') || '').toLowerCase();
  const xGenerator  = (headers.get('x-generator') || '').toLowerCase();
  const xCms        = (headers.get('x-cms') || '').toLowerCase();
  const setCookie   = (headers.get('set-cookie') || '').toLowerCase();
  const contentType = (headers.get('content-type') || '').toLowerCase();
  const cf          = headers.get('cf-ray');

  // Server software
  if (server.includes('nginx'))          techs.add('Nginx');
  if (server.includes('apache'))         techs.add('Apache');
  if (server.includes('iis'))            techs.add('Microsoft IIS');
  if (server.includes('litespeed'))      techs.add('LiteSpeed');
  if (server.includes('cloudflare'))     techs.add('Cloudflare');
  if (server.includes('vercel'))         techs.add('Vercel');
  if (server.includes('openresty'))      techs.add('OpenResty/Nginx');
  if (server.includes('gunicorn'))       techs.add('Gunicorn (Python)');
  if (server.includes('express'))        techs.add('Express.js');

  // CDN / Proxy
  if (cf)                                techs.add('Cloudflare');
  if (headers.get('x-vercel-id'))        techs.add('Vercel');
  if (headers.get('x-amz-cf-id'))        techs.add('Amazon CloudFront');
  if (headers.get('x-fastly-request-id'))techs.add('Fastly CDN');
  if (via.includes('1.1 varnish'))       techs.add('Varnish Cache');

  // Backend/CMS
  if (powered.includes('php'))           techs.add('PHP');
  if (powered.includes('asp.net'))       techs.add('ASP.NET');
  if (powered.includes('next.js'))       techs.add('Next.js');
  if (powered.includes('express'))       techs.add('Express.js');
  if (xGenerator.includes('wordpress')) { techs.add('WordPress'); techs.add('PHP'); }
  if (xGenerator.includes('joomla'))    { techs.add('Joomla'); techs.add('PHP'); }
  if (xGenerator.includes('drupal'))    { techs.add('Drupal'); techs.add('PHP'); }
  if (xCms.includes('wordpress'))       { techs.add('WordPress'); techs.add('PHP'); }

  // Cookie-based detection
  if (setCookie.includes('wordpress'))  { techs.add('WordPress'); techs.add('PHP'); }
  if (setCookie.includes('joomla'))       techs.add('Joomla');
  if (setCookie.includes('shopify'))      techs.add('Shopify');
  if (setCookie.includes('laravel'))    { techs.add('Laravel'); techs.add('PHP'); }
  if (setCookie.includes('csrftoken'))    techs.add('Django (Python)');
  if (setCookie.includes('next-auth'))    techs.add('Next.js');
  if (setCookie.includes('_rails_'))      techs.add('Ruby on Rails');

  // URL hints
  if (url.includes('.php'))           { techs.add('PHP'); }
  if (url.includes('.aspx'))          { techs.add('ASP.NET'); }
  if (url.includes('wp-content'))     { techs.add('WordPress'); techs.add('PHP'); }
  if (url.includes('drupal'))           techs.add('Drupal');

  // Security headers that hint at platform
  const csp = headers.get('content-security-policy') || '';
  if (csp.includes('shopify.com'))      techs.add('Shopify');
  if (csp.includes('squarespace.com'))  techs.add('Squarespace');
  if (csp.includes('wixstatic.com'))    techs.add('Wix');

  return [...techs].slice(0, 8);
}

// ─── Recommendations ──────────────────────────────────────────────────────────
function buildRecommendations(hasSSL, headerResults, techs) {
  const recs = [];

  if (!hasSSL) {
    recs.push({ level: 'kritik', priority: 1,
      title: "HTTPS ni yoqing",
      description: "Saytingiz HTTPS protokolidan foydalanmayapti. Bepul SSL sertifikat olish uchun Let's Encrypt dan foydalaning." });
  }

  for (const [name, info] of Object.entries(headerResults)) {
    if (!info.present) {
      const lvl = info.weight >= 15 ? 'yuqori' : info.weight >= 10 ? 'orta' : 'past';
      recs.push({ level: lvl, priority: info.weight >= 15 ? 2 : 3,
        title: `${info.label} headerini qo'shing`,
        description: `${info.description} — ${name} HTTP headerini server konfiguratsiyasiga qo'shing.` });
    }
  }

  if (techs.includes('WordPress'))
    recs.push({ level: 'orta', priority: 3, title: 'WordPress ni yangilang',
      description: "WordPress va barcha plaginlarni so'nggi versiyaga yangilang." });
  if (techs.includes('PHP'))
    recs.push({ level: 'past', priority: 4, title: "PHP versiyasini tekshiring",
      description: "PHP ning eng so'nggi LTS versiyasini ishlating. Eski PHP versiyalari ko'plab zaifliklarni o'z ichiga oladi." });

  return recs.sort((a, b) => a.priority - b.priority);
}

function calcGrade(score) {
  if (score >= 85) return { grade: 'A+', label: "A'lo darajali", color: 'green' };
  if (score >= 70) return { grade: 'A',  label: 'Yaxshi',        color: 'green' };
  if (score >= 55) return { grade: 'B',  label: 'Qoniqarli',     color: 'yellow' };
  if (score >= 40) return { grade: 'C',  label: "O'rtacha",      color: 'orange' };
  if (score >= 25) return { grade: 'D',  label: 'Yomon',         color: 'red' };
  return                   { grade: 'F',  label: 'Juda yomon',    color: 'red' };
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function scanWebsite(url) {
  const t0       = Date.now();
  const normalized = normalizeUrl(url);
  const domain   = getDomain(normalized);

  // 1. Fetch real headers
  const fetched = await fetchHeaders(normalized);

  if (!fetched.ok) {
    // Try HTTP fallback if HTTPS failed
    let httpFetched = { ok: false };
    if (normalized.startsWith('https://')) {
      httpFetched = await fetchHeaders(normalized.replace('https://', 'http://'));
    }
    if (!httpFetched.ok) {
      return {
        success: false,
        url: normalized, domain,
        error: `Saytga ulanib bo'lmadi: ${fetched.error || 'Timeout'}. URL to'g'riligini tekshiring.`,
        scannedAt: new Date().toISOString(),
      };
    }
    // HTTP worked — means no SSL
    const ha  = analyzeHeaders(httpFetched.headers);
    const techs = detectTechFromHeaders(httpFetched.headers, normalized);
    const totalScore = ha.score; // no SSL bonus
    const gradeInfo  = calcGrade(totalScore);
    const recs  = buildRecommendations(false, ha.headers, techs);
    return buildResult({ normalized, domain, t0, isHttps: false, status: httpFetched.status, ha, techs, recs, totalScore, gradeInfo });
  }

  // 2. Analyze headers
  const isHttps = fetched.isHttps || fetched.finalUrl?.startsWith('https://');
  const ha      = analyzeHeaders(fetched.headers);
  const techs   = detectTechFromHeaders(fetched.headers, normalized);

  // SSL bonus
  const sslScore = isHttps ? 25 : 0;
  const totalScore = Math.min(100, sslScore + ha.score);
  const gradeInfo  = calcGrade(totalScore);
  const recs       = buildRecommendations(isHttps, ha.headers, techs);

  return buildResult({ normalized, domain, t0, isHttps, status: fetched.status, ha, techs, recs, totalScore, gradeInfo });
}

function buildResult({ normalized, domain, t0, isHttps, status, ha, techs, recs, totalScore, gradeInfo }) {
  const passed = (isHttps ? 1 : 0) + Object.values(ha.headers).filter(h => h.present).length;
  const failed = (!isHttps ? 1 : 0) + Object.values(ha.headers).filter(h => !h.present).length;

  return {
    success: true,
    url: normalized, domain,
    score: totalScore,
    grade: gradeInfo.grade,
    gradeLabel: gradeInfo.label,
    gradeColor: gradeInfo.color,
    scanTime: Date.now() - t0,
    httpStatus: status,
    ssl: {
      hasSSL: isHttps,
      score: isHttps ? 25 : 0,
      details: { protocol: isHttps ? 'HTTPS/TLS' : 'HTTP (shifrlanmagan)', encryption: isHttps },
      issues: isHttps ? [] : ["HTTPS protokoli ishlatilmayapti"],
    },
    headers: ha.headers,
    headerScore: ha.score,
    technologies: techs,
    recommendations: recs,
    summary: {
      totalChecks: SECURITY_HEADERS.length + 1,
      passed, failed,
      criticalIssues: recs.filter(r => r.level === 'kritik').length,
      highIssues:     recs.filter(r => r.level === 'yuqori').length,
      mediumIssues:   recs.filter(r => r.level === 'orta').length,
      lowIssues:      recs.filter(r => r.level === 'past').length,
    },
    scannedAt: new Date().toISOString(),
  };
}
