// src/firebase/collections.js
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, increment, Timestamp,
} from 'firebase/firestore';
import { db } from './config';

export const COLLECTIONS = {
  USERS: 'users',
  THREATS: 'threats',
  SCANS: 'scans',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  LEARNING_PROGRESS: 'learning_progress',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
  CHAT_HISTORY: 'chat_history',
};

// Promise.race timeout helper
function withTimeout(promise, ms = 10000, msg = 'Firestore timeout') {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms)),
  ]);
}

// Safe onSnapshot — handles index errors gracefully
function safeOnSnapshot(q, callback) {
  try {
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('onSnapshot error:', err.message);
      callback([]);
    });
  } catch {
    callback([]);
    return () => {};
  }
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export const userOps = {
  async create(uid, data) {
    await withTimeout(
      setDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: data.role || 'talaba',
        status: 'active',
        threatCount: 0,
        scanCount: 0,
        xp: 0,
      })
    );
  },

  async get(uid) {
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.USERS, uid)));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch { return null; }
  },

  // FIXED: setDoc with merge instead of updateDoc
  // Works whether document exists or not
  async update(uid, data) {
    // Remove undefined values to avoid Firestore errors
    const clean = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    await withTimeout(
      setDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...clean,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    );
  },

  onUserChange(uid, callback) {
    try {
      return onSnapshot(
        doc(db, COLLECTIONS.USERS, uid),
        (snap) => { callback(snap.exists() ? { id: snap.id, ...snap.data() } : null); },
        () => { callback(null); }
      );
    } catch {
      return () => {};
    }
  },
};

// ─── THREATS ──────────────────────────────────────────────────────────────────
export const threatOps = {
  async create(userId, data) {
    const ref = await addDoc(collection(db, COLLECTIONS.THREATS), {
      userId, ...data,
      createdAt: serverTimestamp(),
    });
    // Increment user counter in background
    setDoc(doc(db, COLLECTIONS.USERS, userId), {
      threatCount: increment(1), updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {});
    return ref.id;
  },

  async getUserThreats(userId, limitNum = 50) {
    try {
      const snap = await withTimeout(
        getDocs(query(
          collection(db, COLLECTIONS.THREATS),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitNum)
        ))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  },
};

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export const reportOps = {
  async create(userId, data) {
    const ref = await addDoc(collection(db, COLLECTIONS.REPORTS), {
      userId, ...data,
      status: 'yangi',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async getUserReports(userId, limitNum = 50) {
    try {
      const snap = await withTimeout(
        getDocs(query(
          collection(db, COLLECTIONS.REPORTS),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitNum)
        ))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  },

  async getAll(limitNum = 50) {
    try {
      const snap = await withTimeout(
        getDocs(query(
          collection(db, COLLECTIONS.REPORTS),
          orderBy('createdAt', 'desc'),
          limit(limitNum)
        ))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  },

  async updateStatus(id, status, adminNote = '') {
    await withTimeout(
      setDoc(doc(db, COLLECTIONS.REPORTS, id), {
        status, adminNote,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    );
  },
};

// ─── SCANS ────────────────────────────────────────────────────────────────────
export const scanOps = {
  async create(userId, data) {
    const ref = await addDoc(collection(db, COLLECTIONS.SCANS), {
      userId, ...data,
      createdAt: serverTimestamp(),
    });
    setDoc(doc(db, COLLECTIONS.USERS, userId), {
      scanCount: increment(1), updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {});
    return ref.id;
  },

  async save(userId, data) {
    return this.create(userId, data);
  },

  async getUserScans(userId, limitNum = 20) {
    try {
      const snap = await withTimeout(
        getDocs(query(
          collection(db, COLLECTIONS.SCANS),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitNum)
        ))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  },
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notificationOps = {
  async create(userId, data) {
    try {
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        userId, ...data,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {}
  },

  onUserNotifications(uid, callback) {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      return safeOnSnapshot(q, callback);
    } catch {
      callback([]);
      return () => {};
    }
  },

  async markRead(id) {
    try {
      await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { read: true }, { merge: true });
    } catch {}
  },

  async markAllRead(uid) {
    try {
      const snap = await getDocs(query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', uid),
        where('read', '==', false)
      ));
      await Promise.all(snap.docs.map(d =>
        setDoc(d.ref, { read: true }, { merge: true })
      ));
    } catch {}
  },
};

// ─── LEARNING ─────────────────────────────────────────────────────────────────
export const learningOps = {
  async getProgress(userId) {
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.LEARNING_PROGRESS, userId)));
      return snap.exists() ? snap.data() : null;
    } catch { return null; }
  },

  async saveProgress(userId, data) {
    await withTimeout(
      setDoc(doc(db, COLLECTIONS.LEARNING_PROGRESS, userId), {
        userId, ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    );
  },

  async addXP(userId, xp) {
    await setDoc(doc(db, COLLECTIONS.USERS, userId), {
      xp: increment(xp), updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {});
  },
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export const chatOps = {
  async save(userId, message) {
    try {
      await addDoc(collection(db, COLLECTIONS.CHAT_HISTORY), {
        userId, ...message,
        createdAt: serverTimestamp(),
      });
    } catch {}
  },

  async saveMessage(userId, message) {
    return this.save(userId, message);
  },

  async getUserHistory(userId, limitNum = 50) {
    try {
      const snap = await getDocs(query(
        collection(db, COLLECTIONS.CHAT_HISTORY),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitNum)
      ));
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    } catch { return []; }
  },

  async clearHistory(userId) {
    try {
      const snap = await getDocs(query(
        collection(db, COLLECTIONS.CHAT_HISTORY),
        where('userId', '==', userId)
      ));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    } catch {}
  },
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export const settingsOps = {
  async get(userId) {
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.SETTINGS, userId)));
      return snap.exists() ? snap.data() : null;
    } catch { return null; }
  },

  async save(userId, settings) {
    await withTimeout(
      setDoc(doc(db, COLLECTIONS.SETTINGS, userId), {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    );
  },
};
