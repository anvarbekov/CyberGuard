// src/app/api/scan/route.js
import { NextResponse } from 'next/server';
import { scanWebsite } from '@/services/scanService';

const rateLimit = new Map();

export async function POST(request) {
  // Rate limiting (10 req/min per IP)
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const key = `scan_${ip}`;
  const now = Date.now();
  const recent = (rateLimit.get(key) || []).filter(t => now - t < 60000);
  if (recent.length >= 10) {
    return NextResponse.json({ error: 'Tezlik limiti oshib ketdi. 1 daqiqadan so\'ng qayta urinib ko\'ring.' }, { status: 429 });
  }
  rateLimit.set(key, [...recent, now]);

  // Optional auth
  let userId = 'anonymous';
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const { adminAuth } = await import('@/firebase/admin');
      if (adminAuth) {
        const decoded = await adminAuth.verifyIdToken(authHeader.split(' ')[1]);
        userId = decoded.uid;
      }
    }
  } catch { /* continue as anonymous */ }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url) return NextResponse.json({ error: 'URL majburiy' }, { status: 400 });

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      const parsed = new URL(normalizedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json({ error: 'Faqat HTTP/HTTPS URL lar qabul qilinadi' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'URL formati noto\'g\'ri' }, { status: 400 });
    }

    const result = await scanWebsite(normalizedUrl);

    // Save to Firestore if authenticated
    if (userId !== 'anonymous') {
      try {
        const { adminDb } = await import('@/firebase/admin');
        if (adminDb) {
          await adminDb.collection('scans').add({
            userId,
            url: normalizedUrl,
            grade: result.grade,
            score: result.score,
            createdAt: new Date(),
          });
        }
      } catch { /* ignore */ }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Skanerlashda xato yuz berdi' }, { status: 500 });
  }
}
