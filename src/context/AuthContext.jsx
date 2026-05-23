'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, signInWithPopup, sendPasswordResetEmail,
  updateProfile, onAuthStateChanged, setPersistence, browserLocalPersistence,
} from 'firebase/auth';
import { auth, googleProvider } from '@/firebase/config';
import { userOps } from '@/firebase/collections';
import toast from 'react-hot-toast';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const CACHE_KEY = 'cg_auth_v2';
function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
}
function writeCache(u) {
  try {
    if (u) localStorage.setItem(CACHE_KEY, JSON.stringify({
      uid: u.uid, email: u.email,
      displayName: u.displayName, photoURL: u.photoURL,
    }));
    else localStorage.removeItem(CACHE_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [userProfile, setProfile] = useState(null);
  const [loading, setLoading]     = useState(true);

  const loadProfile = useCallback(async (uid) => {
    try {
      const p = await userOps.get(uid);
      if (p) setProfile(p);
      return p;
    } catch { return null; }
  }, []);

  useEffect(() => {
    // Instant render if cached
    if (readCache()) setLoading(false);

    try { setPersistence(auth, browserLocalPersistence); } catch {}

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        writeCache(fbUser);
        loadProfile(fbUser.uid);
      } else {
        setUser(null);
        setProfile(null);
        writeCache(null);
      }
      setLoading(false);
    }, () => {
      setUser(null); setProfile(null); writeCache(null); setLoading(false);
    });
    return () => unsub();
  }, [loadProfile]);

  // Real-time profile listener
  useEffect(() => {
    if (!user) return;
    const unsub = userOps.onUserChange(user.uid, (p) => {
      if (p) setProfile(p);
    });
    return () => unsub();
  }, [user]);

  const kirish = async (email, password) => {
    try {
      const r = await signInWithEmailAndPassword(auth, email, password);
      await loadProfile(r.user.uid);
      toast.success('Muvaffaqiyatli kirildi!');
      return r.user;
    } catch (e) { toast.error(getMsg(e.code)); throw e; }
  };

  const royxatdanOtish = async (email, password, displayName, role = 'talaba') => {
    try {
      const r = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(r.user, { displayName });
      await userOps.create(r.user.uid, {
        uid: r.user.uid, email, displayName, role,
        photoURL: null, phone: '', bio: '', city: '', organization: '',
      });
      await loadProfile(r.user.uid);
      toast.success("Muvaffaqiyatli ro'yxatdan o'tildi!");
      return r.user;
    } catch (e) { toast.error(getMsg(e.code)); throw e; }
  };

  const googleOrqaliKirish = async () => {
    try {
      const r = await signInWithPopup(auth, googleProvider);
      const existing = await userOps.get(r.user.uid);
      if (!existing) {
        await userOps.create(r.user.uid, {
          uid: r.user.uid, email: r.user.email,
          displayName: r.user.displayName, role: 'talaba',
          photoURL: r.user.photoURL,
          phone: '', bio: '', city: '', organization: '',
        });
      }
      await loadProfile(r.user.uid);
      toast.success('Google orqali muvaffaqiyatli kirildi!');
      return r.user;
    } catch (e) { toast.error(getMsg(e.code)); throw e; }
  };

  const parolniTiklash = async (email) => {
    try { await sendPasswordResetEmail(auth, email); toast.success('Havola yuborildi!'); }
    catch (e) { toast.error(getMsg(e.code)); throw e; }
  };

  const chiqish = async () => {
    try { await signOut(auth); setUser(null); setProfile(null); writeCache(null); toast.success('Tizimdan chiqildi'); }
    catch { toast.error('Chiqishda xato'); }
  };

  const profilniYangilash = async (data) => {
    if (!user) throw new Error('User not logged in');

    // Remove undefined values
    const clean = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null)
    );

    // Save to Firestore (setDoc with merge — works even if doc doesn't exist)
    await userOps.update(user.uid, clean);

    // Update Firebase Auth profile (only string values, not base64)
    const authUpdates = {};
    if (clean.displayName) authUpdates.displayName = clean.displayName;
    // Only pass photoURL to Auth if it's a real URL (Cloudinary etc), not base64
    if (clean.photoURL && clean.photoURL.startsWith('http')) {
      authUpdates.photoURL = clean.photoURL;
    }
    if (Object.keys(authUpdates).length > 0) {
      try { await updateProfile(user, authUpdates); } catch (e) {
        console.warn('Auth profile update:', e.message);
      }
    }

    // Update local state immediately
    setProfile(prev => ({ ...(prev || {}), uid: user.uid, ...clean }));
    toast.success('Profil yangilandi! ✅');
  };

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading,
      isAdmin:        userProfile?.role === 'admin',
      isOqituvchi:    userProfile?.role === 'oqituvchi',
      isMutaxassis:   userProfile?.role === 'mutaxassis',
      isAuthenticated: !!user,
      kirish, royxatdanOtish, googleOrqaliKirish,
      parolniTiklash, chiqish, profilniYangilash, loadProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function getMsg(code) {
  return ({
    'auth/user-not-found':        'Foydalanuvchi topilmadi',
    'auth/wrong-password':        "Parol noto'g'ri",
    'auth/invalid-credential':    "Email yoki parol noto'g'ri",
    'auth/email-already-in-use':  'Bu email allaqachon ishlatilmoqda',
    'auth/weak-password':         "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    'auth/invalid-email':         "Email format noto'g'ri",
    'auth/too-many-requests':     "Ko'p urinish. Biroz kuting",
    'auth/network-request-failed':'Tarmoq xatosi. Internetni tekshiring',
    'auth/popup-closed-by-user':  'Kirish bekor qilindi',
  })[code] || "Xato yuz berdi. Qayta urinib ko'ring";
}
