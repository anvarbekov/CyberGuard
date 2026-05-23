// src/firebase/admin.js
// Server-side only — never import this in client components!

let adminAuth = null;
let adminDb = null;
let adminStorage = null;

try {
  const admin = require('firebase-admin');

  const getAdminApp = () => {
    if (admin.apps.length > 0) return admin.apps[0];

    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('Firebase Admin env vars not configured');
    }

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  };

  const adminApp = getAdminApp();
  adminAuth = admin.auth(adminApp);
  adminDb = admin.firestore(adminApp);
  adminStorage = admin.storage(adminApp);
} catch (err) {
  // Firebase Admin not configured — API routes will return demo data
  console.warn('[Firebase Admin] Not configured:', err.message);
}

export { adminAuth, adminDb, adminStorage };
export default null;
