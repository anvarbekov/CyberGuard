'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, User, Briefcase, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  displayName: z.string().min(2, 'Ism kamida 2 ta belgi').max(50, 'Ism juda uzun'),
  email: z.string().email("Noto'g'ri email format"),
  role: z.enum(['talaba', 'oqituvchi', 'mutaxassis']),
  password: z.string().min(6, 'Parol kamida 6 ta belgi').max(100),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Parollar mos kelmadi",
  path: ['confirmPassword'],
});

const ROLES = [
  { value: 'talaba', label: 'Talaba', desc: 'O\'rganuvchi foydalanuvchi' },
  { value: 'oqituvchi', label: 'O\'qituvchi', desc: 'Ta\'lim beruvchi' },
  { value: 'mutaxassis', label: 'Mutaxassis', desc: 'Kiberxavfsizlik ekspеrti' },
];

function getStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export default function RoyxatPage() {
  const { royxatdanOtish, googleOrqaliKirish, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [password, setPassword] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'talaba' },
  });

  const watchedPass = watch('password', '');

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, loading, router]);

  const strength = getStrength(watchedPass);
  const strengthLabels = ['', 'Juda zaif', 'Zaif', "O'rta", 'Kuchli', 'Juda kuchli'];
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-cyan-500'];

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await royxatdanOtish(data.email, data.password, data.displayName, data.role);
      router.push('/dashboard');
    } catch {
      // handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await googleOrqaliKirish();
      router.push('/dashboard');
    } catch {} finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid bg-[length:40px_40px] opacity-30" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">CyberGuard UZ</h1>
          <p className="text-gray-400 text-sm mt-1">Yangi hisob yaratish</p>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">To'liq ism</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('displayName')} className="input-cyber w-full pl-10" placeholder="Ism Familiya" />
              </div>
              {errors.displayName && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.displayName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('email')} type="email" className="input-cyber w-full pl-10" placeholder="email@example.com" autoComplete="email" />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rol tanlang</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <label key={r.value} className="cursor-pointer">
                    <input {...register('role')} type="radio" value={r.value} className="sr-only" />
                    <div className={`p-2.5 rounded-xl border text-center transition-all ${watch('role') === r.value ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                      <p className="text-xs font-semibold">{r.label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Parol</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('password')} type={showPass ? 'text' : 'password'} className="input-cyber w-full pl-10 pr-10" placeholder="••••••••" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {watchedPass && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{strengthLabels[strength]}</p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Parolni tasdiqlang</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} className="input-cyber w-full pl-10 pr-10" placeholder="••••••••" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-cyber-solid w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isLoading ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">yoki</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button onClick={handleGoogle} disabled={googleLoading} className="w-full py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm text-gray-300 disabled:opacity-60">
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google orqali ro'yxatdan o'tish
          </button>

          <p className="text-center text-sm text-gray-400 mt-5">
            Hisobingiz bormi?{' '}
            <Link href="/auth/kirish" className="text-cyan-400 hover:text-cyan-300 font-medium">Kirish</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
