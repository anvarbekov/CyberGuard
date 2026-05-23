'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Camera, Save, Shield, Mail, Phone, MapPin,
  Key, Eye, EyeOff, CheckCircle, Loader2, Building2, FileText,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/constants';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/firebase/config';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin:      'bg-red-500/10 border-red-500/30 text-red-400',
  oqituvchi:  'bg-blue-500/10 border-blue-500/30 text-blue-400',
  mutaxassis: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
  talaba:     'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
};

// Resize & compress to 256x256 JPEG (~25KB) — no external service needed
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const SIZE = 256;
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Fayl o\'qishda xato'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Rasm yuklanmadi'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio  = Math.min(SIZE / img.width, SIZE / img.height, 1);
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilPage() {
  const { user, userProfile, profilniYangilash } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    displayName: '', phone: '', city: '', bio: '', organization: '',
  });
  const [avatarSrc, setAvatarSrc]     = useState(null); // shown in UI
  const [avatarData, setAvatarData]   = useState(null); // pending base64 to save
  const [processing, setProcessing]   = useState(false);
  const [saving, setSaving]           = useState(false);

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({});
  const [changingPw, setChangingPw] = useState(false);

  // Load profile data into form
  useEffect(() => {
    const profile = userProfile || {};
    const fbUser  = user       || {};
    setForm({
      displayName:  profile.displayName  || fbUser.displayName  || '',
      phone:        profile.phone        || '',
      city:         profile.city         || '',
      bio:          profile.bio          || '',
      organization: profile.organization || '',
    });
    // Show saved photo (Firestore first, then Firebase Auth)
    setAvatarSrc(profile.photoURL || fbUser.photoURL || null);
  }, [user, userProfile]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm fayllar (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Rasm 8 MB dan kichik bo\'lishi kerak');
      return;
    }

    setProcessing(true);
    try {
      const base64 = await resizeImage(file);
      const kb = Math.round((base64.length * 3) / 4 / 1024);
      setAvatarData(base64);
      setAvatarSrc(base64);
      toast.success(`Rasm tayyor (${kb} KB) — Saqlash tugmasini bosing`);
    } catch (err) {
      toast.error('Rasmni qayta ishlashda xato: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      toast.error('Ism familiya kiritilmagan');
      return;
    }

    setSaving(true);

    // Failsafe — always unlock UI after 15 seconds
    const failsafe = setTimeout(() => {
      setSaving(false);
      toast.error('Ulanish sekin. Internet aloqangizni tekshiring.');
    }, 15000);

    try {
      const updates = {
        displayName:  form.displayName.trim(),
        phone:        form.phone.trim(),
        city:         form.city.trim(),
        bio:          form.bio.trim(),
        organization: form.organization.trim(),
      };

      // Add photo only if a new one was selected
      if (avatarData) {
        updates.photoURL = avatarData;
      }

      await profilniYangilash(updates);
      setAvatarData(null); // clear pending
    } catch (err) {
      // profilniYangilash already showed toast
      console.error('Save failed:', err.message);
    } finally {
      clearTimeout(failsafe);
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      toast.error('Barcha maydonlarni to\'ldiring'); return;
    }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Parollar mos kelmaydi'); return; }
    if (pwForm.newPw.length < 8)         { toast.error('Kamida 8 ta belgi'); return; }

    setChangingPw(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, pwForm.newPw);
      toast.success("Parol muvaffaqiyatli o'zgartirildi ✅");
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error({
        'auth/wrong-password':        "Joriy parol noto'g'ri",
        'auth/invalid-credential':    "Joriy parol noto'g'ri",
        'auth/requires-recent-login': 'Xavfsizlik uchun sahifani yangilab qayta kiring',
      }[err.code] || "Parol o'zgartirilmadi");
    } finally {
      setChangingPw(false);
    }
  };

  const strength = (() => {
    const pw = pwForm.newPw;
    let s = 0;
    if (pw.length >= 8)  s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  })();
  const strColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#00d4ff'][strength];
  const strLabel = ['', 'Juda zaif', 'Zaif', "O'rta", 'Kuchli', 'Juda kuchli'][strength];
  const role = userProfile?.role || 'talaba';

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <PageHeader icon={User} title="Profilim" subtitle="Shaxsiy ma'lumotlaringizni boshqaring" />

      {/* ── Avatar + info card ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-white/10">

        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row items-start gap-5 mb-6 pb-6 border-b border-white/10">
          <div className="relative flex-shrink-0">
            {/* Avatar circle */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-500/30 bg-gray-800 flex items-center justify-center">
              {processing ? (
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              ) : avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-cyan-400">
                  {(form.displayName || user?.email || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            {/* Camera button */}
            <button
              type="button"
              onClick={() => !saving && !processing && fileRef.current?.click()}
              disabled={saving || processing}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-cyan-500 hover:bg-cyan-400 transition-colors shadow-lg flex items-center justify-center disabled:opacity-50">
              <Camera className="w-3.5 h-3.5 text-black" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-white truncate">
              {form.displayName || 'Foydalanuvchi'}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS?.[role] || 'Talaba'}
              </span>
              {user?.emailVerified && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />Email tasdiqlangan
                </span>
              )}
            </div>
            {avatarData && (
              <p className="text-xs text-cyan-400 mt-1.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Yangi rasm tayyor — Saqlash tugmasini bosing
              </p>
            )}
          </div>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'displayName', label: 'Ism familiya', Icon: User,      placeholder: "To'liq ismingiz", req: true },
            { key: 'phone',       label: 'Telefon',       Icon: Phone,     placeholder: '+998 90 123 45 67' },
            { key: 'city',        label: 'Shahar',        Icon: MapPin,    placeholder: 'Toshkent' },
            { key: 'organization',label: 'Tashkilot',     Icon: Building2, placeholder: 'Kompaniya nomi' },
          ].map(({ key, label, Icon, placeholder, req }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {label}{req && <span className="text-red-400 ml-1">*</span>}
              </label>
              <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="input-cyber w-full pl-10"
                  placeholder={placeholder}
                />
              </div>
            </div>
          ))}

          {/* Email readonly */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input value={user?.email || ''} disabled
                className="input-cyber w-full pl-10 opacity-50 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-400" />Bio
          </label>
          <textarea
            value={form.bio}
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            rows={3}
            maxLength={300}
            placeholder="O'zingiz haqida qisqacha..."
            className="input-cyber w-full resize-none"
            style={{ paddingLeft: '16px' }}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{form.bio.length}/300</p>
        </div>

        {/* Save button */}
        <motion.button
          onClick={handleSave}
          disabled={saving || processing}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="btn-cyber-solid mt-5 px-6 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm font-medium disabled:opacity-60">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />Saqlanmoqda...</>
            : <><Save className="w-4 h-4" />Saqlash</>}
        </motion.button>
      </motion.div>

      {/* ── Password change (email users only) ── */}
      {!user?.providerData?.some(p => p.providerId === 'google.com') && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Key className="w-4 h-4 text-yellow-400" />Parolni o'zgartirish
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { key: 'current', label: 'Joriy parol',              ac: 'current-password', ph: 'Joriy parolingiz' },
              { key: 'newPw',   label: 'Yangi parol',              ac: 'new-password',     ph: 'Kamida 8 ta belgi' },
              { key: 'confirm', label: 'Yangi parolni tasdiqlang', ac: 'new-password',     ph: 'Takrorlang' },
            ].map(({ key, label, ac, ph }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    value={pwForm[key]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    autoComplete={ac}
                    className="input-cyber w-full pl-10 pr-10"
                    placeholder={ph}
                  />
                  <button type="button"
                    onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                    {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {key === 'newPw' && pwForm.newPw && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full"
                          style={{ background: i <= strength ? strColor : 'rgba(255,255,255,0.1)', transition: 'background .2s' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strColor }}>{strLabel}</p>
                  </div>
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={changingPw}
              className="btn-cyber px-6 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm disabled:opacity-60">
              {changingPw
                ? <><Loader2 className="w-4 h-4 animate-spin" />O'zgartirilmoqda...</>
                : <><Shield className="w-4 h-4" />Parolni o'zgartirish</>}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
