'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Shield, Moon, Globe, Clock, Save, Loader2,
  Volume2, Mail, Smartphone, Eye, Lock, RefreshCw,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { settingsOps } from '@/firebase/collections';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  // Bildirishnomalar
  emailNotifications: true,
  pushNotifications: true,
  soundNotifications: false,
  threatAlerts: true,
  reportUpdates: true,
  weeklyReport: false,
  // Xavfsizlik
  twoFactor: false,
  sessionTimeout: 60,
  loginAlerts: true,
  ipWhitelist: false,
  // Ko'rinish
  darkMode: true,
  compactMode: false,
  animationsEnabled: true,
  // Til / Mintaqa
  language: 'uz',
  region: 'UZ',
  timezone: 'Asia/Tashkent',
  dateFormat: 'DD.MM.YYYY',
  timeFormat: '24h',
};

const LANGUAGES = [
  { code: 'uz', label: "O'zbek tili", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский',     flag: '🇷🇺' },
  { code: 'en', label: 'English',     flag: '🇬🇧' },
];

const REGIONS = [
  { code: 'UZ', label: "O'zbekiston" },
  { code: 'RU', label: 'Rossiya'     },
  { code: 'KZ', label: 'Qozogʻiston' },
  { code: 'TR', label: 'Turkiya'     },
  { code: 'US', label: 'AQSh'        },
];

const TIMEZONES = [
  { value: 'Asia/Tashkent',   label: 'Toshkent (UTC+5)'        },
  { value: 'Europe/Moscow',   label: 'Moskva (UTC+3)'           },
  { value: 'Asia/Almaty',     label: 'Olmaota (UTC+6)'          },
  { value: 'Europe/Istanbul', label: 'Istanbul (UTC+3)'         },
  { value: 'UTC',             label: 'UTC (0)'                  },
  { value: 'America/New_York',label: 'Nyu-York (UTC-5)'         },
];

const TIMEOUTS = [
  { value: 15,  label: '15 daqiqa' },
  { value: 30,  label: '30 daqiqa' },
  { value: 60,  label: '1 soat'    },
  { value: 120, label: '2 soat'    },
  { value: 0,   label: 'Hech qachon' },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-cyan-500' : 'bg-white/10'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
        checked ? 'translate-x-5.5' : 'translate-x-0.5'
      }`} style={{ transform: checked ? 'translateX(1.35rem)' : 'translateX(0.125rem)' }} />
    </button>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <Icon className="w-4 h-4 text-cyan-400" />
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </motion.div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-white">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="input-cyber text-sm py-2 pr-8 appearance-none cursor-pointer min-w-[140px]"
      style={{ paddingLeft: '12px', background: 'rgba(13,27,46,0.8)' }}>
      {options.map(o => <option key={o.value || o.code} value={o.value || o.code}>{o.label}</option>)}
    </select>
  );
}

export default function SozlamalarPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    settingsOps.get(user.uid).then(data => {
      if (data) setSettings({ ...DEFAULT_SETTINGS, ...data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const set = (key) => (val) => setSettings(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await settingsOps.save(user.uid, settings);
      toast.success('Sozlamalar saqlandi ✅');
    } catch {
      toast.error('Saqlashda xato yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.success('Sozlamalar asl holatga qaytarildi');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-white/5 rounded-xl w-48 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6 max-w-2xl">
      <PageHeader icon={Lock} title="Sozlamalar" subtitle="Shaxsiy sozlamalaringizni boshqaring" />

      {/* Notifications */}
      <Section title="Bildirishnomalar" icon={Bell}>
        <SettingRow label="Email bildirishnomalar" description="Muhim hodisalar haqida email oling">
          <Toggle checked={settings.emailNotifications} onChange={set('emailNotifications')} />
        </SettingRow>
        <SettingRow label="Push bildirishnomalar" description="Brauzer orqali tez xabarnomalar">
          <Toggle checked={settings.pushNotifications} onChange={set('pushNotifications')} />
        </SettingRow>
        <SettingRow label="Ovozli signal" description="Bildirishnoma ovozi">
          <Toggle checked={settings.soundNotifications} onChange={set('soundNotifications')} />
        </SettingRow>
        <SettingRow label="Tahdid ogohlantirishlari" description="Yuqori xavf aniqlanganida">
          <Toggle checked={settings.threatAlerts} onChange={set('threatAlerts')} />
        </SettingRow>
        <SettingRow label="Hisobot yangilanishlari" description="Hisobot statusi o'zgarganda">
          <Toggle checked={settings.reportUpdates} onChange={set('reportUpdates')} />
        </SettingRow>
        <SettingRow label="Haftalik hisobot" description="Har dushanba email orqali">
          <Toggle checked={settings.weeklyReport} onChange={set('weeklyReport')} />
        </SettingRow>
      </Section>

      {/* Security */}
      <Section title="Xavfsizlik" icon={Shield}>
        <SettingRow label="Ikki faktorli autentifikatsiya" description="SMS yoki Authenticator orqali">
          <Toggle checked={settings.twoFactor} onChange={set('twoFactor')} />
        </SettingRow>
        <SettingRow label="Kirish ogohlantirishlari" description="Yangi qurilmadan kirilganda xabar">
          <Toggle checked={settings.loginAlerts} onChange={set('loginAlerts')} />
        </SettingRow>
        <SettingRow label="Sessiya muddati" description="Faolsizlikdan keyin avtomatik chiqish">
          <SelectField value={settings.sessionTimeout} onChange={set('sessionTimeout')}
            options={TIMEOUTS.map(t => ({ value: t.value, label: t.label }))} />
        </SettingRow>
      </Section>

      {/* Appearance */}
      <Section title="Ko'rinish" icon={Eye}>
        <SettingRow label="Qoʻngʻir rejim" description="Koʻzni kamroq toliqtiradi">
          <Toggle checked={settings.darkMode} onChange={set('darkMode')} />
        </SettingRow>
        <SettingRow label="Ixcham rejim" description="Kichikroq elementlar">
          <Toggle checked={settings.compactMode} onChange={set('compactMode')} />
        </SettingRow>
        <SettingRow label="Animatsiyalar" description="Harakatli effektlar">
          <Toggle checked={settings.animationsEnabled} onChange={set('animationsEnabled')} />
        </SettingRow>
      </Section>

      {/* Language & Region */}
      <Section title="Til va mintaqa" icon={Globe}>
        <SettingRow label="Interfeys tili">
          <div className="flex gap-2">
            {LANGUAGES.map(lang => (
              <button key={lang.code}
                onClick={() => set('language')(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  settings.language === lang.code
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}>
                {lang.flag} {lang.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Mintaqa">
          <SelectField value={settings.region} onChange={set('region')}
            options={REGIONS.map(r => ({ value: r.code, label: r.label }))} />
        </SettingRow>
        <SettingRow label="Vaqt mintaqasi">
          <SelectField value={settings.timezone} onChange={set('timezone')}
            options={TIMEZONES.map(t => ({ value: t.value, label: t.label }))} />
        </SettingRow>
        <SettingRow label="Sana formati">
          <SelectField value={settings.dateFormat} onChange={set('dateFormat')}
            options={[
              { value: 'DD.MM.YYYY', label: 'KK.OO.YYYY' },
              { value: 'MM/DD/YYYY', label: 'OO/KK/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-OO-KK' },
            ]} />
        </SettingRow>
        <SettingRow label="Vaqt formati">
          <SelectField value={settings.timeFormat} onChange={set('timeFormat')}
            options={[
              { value: '24h', label: '24 soatlik' },
              { value: '12h', label: '12 soatlik (AM/PM)' },
            ]} />
        </SettingRow>
      </Section>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <motion.button onClick={handleSave} disabled={saving}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="btn-cyber-solid px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-60">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saqlanmoqda...</>
            : <><Save className="w-4 h-4" />Saqlash</>}
        </motion.button>
        <button onClick={handleReset}
          className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm flex items-center gap-2 transition-all">
          <RefreshCw className="w-4 h-4" />Asl holatga qaytarish
        </button>
      </div>
    </div>
  );
}
