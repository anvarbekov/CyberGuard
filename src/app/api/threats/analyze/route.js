import { NextResponse } from 'next/server';
import { analyzeURL, analyzeIP, analyzeText } from '@/services/threatService';
import { sanitizeInput } from '@/utils';

const rateLimit = new Map();

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const key = `threat_${ip}`;
  const now = Date.now();
  const recent = (rateLimit.get(key) || []).filter(t => now - t < 60000);
  if (recent.length >= 20) {
    return NextResponse.json({ error: 'Tezlik limiti oshib ketdi' }, { status: 429 });
  }
  rateLimit.set(key, [...recent, now]);

  // Auth (optional — saves to Firestore if authenticated)
  let userId = null;
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const { adminAuth } = await import('@/firebase/admin');
      if (adminAuth) {
        const decoded = await adminAuth.verifyIdToken(authHeader.split(' ')[1]);
        userId = decoded.uid;
      }
    }
  } catch { /* anonymous */ }

  try {
    const body = await request.json();
    const { type } = body;
    // Accept both 'value' and 'input' field names
    const rawValue = body.value || body.input;

    if (!type || !rawValue?.trim()) {
      return NextResponse.json({ error: "Tur va qiymat majburiy" }, { status: 400 });
    }

    const sanitized = sanitizeInput(String(rawValue).trim()).slice(0, 2000);

    let result;
    switch (type) {
      case 'url':  result = await analyzeURL(sanitized); break;
      case 'ip':   result = await analyzeIP(sanitized); break;
      case 'text': result = await analyzeText(sanitized); break;
      default:
        return NextResponse.json({ error: "Noto'g'ri tahlil turi" }, { status: 400 });
    }

    // Save to Firestore if authenticated
    if (userId) {
      try {
        const { adminDb } = await import('@/firebase/admin');
        if (adminDb) {
          await adminDb.collection('threats').add({
            userId, type, target: sanitized,
            riskScore: result.riskScore || 0,
            threatType: result.threatType || type,
            details: result,
            createdAt: new Date(),
          });
          if ((result.riskScore || 0) > 60) {
            await adminDb.collection('notifications').add({
              userId,
              title: '⚠️ Yuqori xavf aniqlandi!',
              message: `${type.toUpperCase()}: risk darajasi ${result.riskScore}%`,
              type: 'threat', read: false,
              createdAt: new Date(),
            });
          }
        }
      } catch (e) { console.warn('Firestore save error:', e.message); }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Threat analyze error:', err);
    return NextResponse.json({ error: 'Tahlilda xato yuz berdi' }, { status: 500 });
  }
}
