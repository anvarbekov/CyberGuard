// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';

const DEMO_STATS = {
  stats: { totalUsers: 42, totalThreats: 187, totalReports: 23, totalScans: 95, activeUsers: 18, pendingReports: 5 },
  usersByRole: { admin: 2, oqituvchi: 8, talaba: 28, mutaxassis: 4 },
  reportsByStatus: { yangi: 5, korib_chiqilmoqda: 7, tasdiqlangan: 9, bekor_qilingan: 2 },
  threatsByRisk: { xavfsiz: 89, orta: 64, xavfli: 34 },
  monthlyTrend: [
    { month: 'Yan', tahdidlar: 12, foydalanuvchilar: 5 },
    { month: 'Fev', tahdidlar: 19, foydalanuvchilar: 8 },
    { month: 'Mar', tahdidlar: 27, foydalanuvchilar: 12 },
    { month: 'Apr', tahdidlar: 34, foydalanuvchilar: 7 },
    { month: 'May', tahdidlar: 41, foydalanuvchilar: 6 },
    { month: 'Iyn', tahdidlar: 54, foydalanuvchilar: 4 },
  ],
  recentActivity: [
    { id: '1', description: 'Fishing URL aniqlandi', risk: 87, createdAt: new Date().toISOString(), type: 'threat' },
    { id: '2', description: 'Shubhali IP manzil tekshirildi', risk: 72, createdAt: new Date(Date.now() - 3600000).toISOString(), type: 'threat' },
    { id: '3', description: 'Yangi hisobot yaratildi', risk: 30, createdAt: new Date(Date.now() - 7200000).toISOString(), type: 'report' },
    { id: '4', description: "Yangi foydalanuvchi ro'yxatdan o'tdi", risk: 0, createdAt: new Date(Date.now() - 10800000).toISOString(), type: 'user' },
    { id: '5', description: 'Zararli matn aniqlandi', risk: 94, createdAt: new Date(Date.now() - 14400000).toISOString(), type: 'threat' },
  ],
};

export async function GET(request) {
  // Verify token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 });
  }

  try {
    const { adminAuth, adminDb } = await import('@/firebase/admin');

    if (!adminAuth || !adminDb) {
      // Not configured — return demo data
      return NextResponse.json(DEMO_STATS);
    }

    const token = authHeader.split(' ')[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin ruxsati yo\'q' }, { status: 403 });
    }

    const [usersSnap, threatsSnap, reportsSnap, scansSnap] = await Promise.allSettled([
      adminDb.collection('users').get(),
      adminDb.collection('threats').orderBy('createdAt', 'desc').limit(200).get(),
      adminDb.collection('reports').get(),
      adminDb.collection('scans').get(),
    ]);

    const users = usersSnap.status === 'fulfilled' ? usersSnap.value.docs : [];
    const threats = threatsSnap.status === 'fulfilled' ? threatsSnap.value.docs : [];
    const reports = reportsSnap.status === 'fulfilled' ? reportsSnap.value.docs : [];
    const scans = scansSnap.status === 'fulfilled' ? scansSnap.value.docs : [];

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const activeUsers = users.filter(d => {
      const la = d.data().lastActive;
      return la && new Date(la.seconds ? la.toDate() : la) > sevenDaysAgo;
    }).length;

    const usersByRole = { admin: 0, oqituvchi: 0, talaba: 0, mutaxassis: 0 };
    users.forEach(d => { const r = d.data().role || 'talaba'; if (r in usersByRole) usersByRole[r]++; });

    const reportsByStatus = { yangi: 0, korib_chiqilmoqda: 0, tasdiqlangan: 0, bekor_qilingan: 0 };
    reports.forEach(d => { const s = d.data().status || 'yangi'; if (s in reportsByStatus) reportsByStatus[s]++; });

    const threatsByRisk = { xavfsiz: 0, orta: 0, xavfli: 0 };
    threats.forEach(d => {
      const r = d.data().riskScore || 0;
      if (r < 40) threatsByRisk.xavfsiz++;
      else if (r < 70) threatsByRisk.orta++;
      else threatsByRisk.xavfli++;
    });

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const inRange = (docData) => {
        const created = docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date(docData.createdAt);
        return created >= start && created <= end;
      };
      monthlyTrend.push({
        month: d.toLocaleDateString('uz-UZ', { month: 'short' }),
        tahdidlar: threats.filter(doc => inRange(doc.data())).length,
        foydalanuvchilar: users.filter(doc => inRange(doc.data())).length,
      });
    }

    const recentActivity = threats.slice(0, 10).map(d => ({
      id: d.id,
      description: `Tahdid aniqlandi: ${d.data().threatType || 'URL'}`,
      risk: d.data().riskScore || 0,
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      type: 'threat',
    }));

    return NextResponse.json({
      stats: {
        totalUsers: users.length,
        totalThreats: threats.length,
        totalReports: reports.length,
        totalScans: scans.length,
        activeUsers,
        pendingReports: reportsByStatus.yangi,
      },
      usersByRole,
      reportsByStatus,
      threatsByRisk,
      monthlyTrend,
      recentActivity,
    });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    return NextResponse.json(DEMO_STATS);
  }
}
