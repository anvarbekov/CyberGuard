// src/app/api/reports/route.js
import { NextResponse } from 'next/server';

async function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const { adminAuth } = await import('@/firebase/admin');
    if (!adminAuth) return { uid: 'demo-user', role: 'talaba' };
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

// GET /api/reports
export async function GET(request) {
  const decoded = await verifyToken(request);
  if (!decoded) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const limitNum = parseInt(searchParams.get('limit') || '20');

  try {
    const { adminDb } = await import('@/firebase/admin');
    if (!adminDb) throw new Error('Not configured');

    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';

    let q = adminDb.collection('reports').orderBy('createdAt', 'desc').limit(limitNum);
    if (!isAdmin) q = q.where('userId', '==', decoded.uid);
    if (statusFilter) q = q.where('status', '==', statusFilter);

    const snap = await q.get();
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt }));
    return NextResponse.json({ reports });
  } catch {
    // Demo data
    const demo = [
      { id: '1', title: 'Phishing email aniqlandi', description: 'Shubhali email xabar keldi, havola zararli saytga yo\'naltiryapti.', severity: 'yuqori', status: 'yangi', userId: decoded.uid, userEmail: 'demo@example.com', createdAt: new Date().toISOString() },
      { id: '2', title: 'Zararli fayl yuklab olindi', description: 'Noma\'lum manbadan .exe fayl yuklab olindi.', severity: 'kritik', status: 'korib_chiqilmoqda', userId: decoded.uid, userEmail: 'demo@example.com', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: '3', title: 'Shubhali ulanish urinishi', description: 'Tashqi IP dan SSH ulanish urinishi aniqlandi.', severity: 'orta', status: 'tasdiqlangan', userId: decoded.uid, userEmail: 'demo@example.com', createdAt: new Date(Date.now() - 172800000).toISOString() },
    ];
    const filtered = statusFilter ? demo.filter(r => r.status === statusFilter) : demo;
    return NextResponse.json({ reports: filtered });
  }
}

// POST /api/reports
export async function POST(request) {
  const decoded = await verifyToken(request);
  if (!decoded) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, severity, type, imageUrl } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Sarlavha va tavsif majburiy' }, { status: 400 });
    }

    const reportData = {
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 2000),
      severity: severity || 'orta',
      type: type || 'boshqa',
      imageUrl: imageUrl || null,
      userId: decoded.uid,
      userEmail: decoded.email || '',
      status: 'yangi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const { adminDb } = await import('@/firebase/admin');
      if (adminDb) {
        const ref = await adminDb.collection('reports').add({
          ...reportData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // Notify admins
        const adminsSnap = await adminDb.collection('users').where('role', '==', 'admin').get();
        const batch = adminDb.batch();
        adminsSnap.docs.forEach(adminDoc => {
          const notifRef = adminDb.collection('notifications').doc();
          batch.set(notifRef, {
            userId: adminDoc.id,
            title: 'Yangi hisobot',
            message: `"${title}" — ${decoded.email}`,
            type: 'report',
            read: false,
            createdAt: new Date(),
          });
        });
        await batch.commit();
        return NextResponse.json({ id: ref.id, ...reportData }, { status: 201 });
      }
    } catch { /* fall through to demo */ }

    return NextResponse.json({ id: 'demo-' + Date.now(), ...reportData }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Hisobot yaratishda xato' }, { status: 500 });
  }
}

// PATCH /api/reports (admin only)
export async function PATCH(request) {
  const decoded = await verifyToken(request);
  if (!decoded) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 });

  try {
    const { id, status, adminNote } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'ID va status majburiy' }, { status: 400 });

    const validStatuses = ['yangi', 'korib_chiqilmoqda', 'tasdiqlangan', 'bekor_qilingan'];
    if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Noto\'g\'ri status' }, { status: 400 });

    try {
      const { adminDb, adminAuth } = await import('@/firebase/admin');
      if (adminDb && adminAuth) {
        const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
        if (!userDoc.exists || !['admin', 'mutaxassis', 'oqituvchi'].includes(userDoc.data()?.role)) {
          return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
        }
        await adminDb.collection('reports').doc(id).update({
          status,
          adminNote: adminNote || null,
          updatedAt: new Date(),
          reviewedBy: decoded.uid,
        });
      }
    } catch { /* demo mode */ }

    return NextResponse.json({ success: true, id, status });
  } catch {
    return NextResponse.json({ error: 'Yangilashda xato' }, { status: 500 });
  }
}
