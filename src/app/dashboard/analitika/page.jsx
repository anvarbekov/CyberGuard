'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, TrendingDown, Activity, Calendar,
  Shield, AlertTriangle, FileText, Target
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { threatOps, reportOps } from '@/firebase/collections';

const COLORS = ['#00d4ff', '#00ff88', '#ff2d55', '#ff9f1a', '#7c3aed', '#06b6d4'];

const generateMonthlyData = () => {
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  const currentMonth = new Date().getMonth();
  return months.slice(0, currentMonth + 1).map((month, i) => ({
    month,
    tahdidlar: Math.floor(Math.random() * 40) + 10,
    skanlar: Math.floor(Math.random() * 60) + 20,
    hisobotlar: Math.floor(Math.random() * 15) + 2,
    xavfsizBaho: Math.floor(Math.random() * 30) + 60,
  }));
};

const generateThreatTypes = () => [
  { name: 'Fishing', value: 35, color: '#ff2d55' },
  { name: 'Zararli dastur', value: 22, color: '#ff9f1a' },
  { name: 'Spam', value: 18, color: '#7c3aed' },
  { name: 'Shubhali IP', value: 15, color: '#00d4ff' },
  { name: 'Boshqa', value: 10, color: '#00ff88' },
];

const generateRiskTrend = () =>
  Array.from({ length: 30 }, (_, i) => ({
    kun: i + 1,
    risk: Math.floor(Math.random() * 50) + 20,
    xavfsiz: Math.floor(Math.random() * 30) + 50,
  }));

const generateRadarData = () => [
  { subject: 'Tarmoq', A: Math.floor(Math.random() * 40) + 60 },
  { subject: 'Veb', A: Math.floor(Math.random() * 40) + 50 },
  { subject: 'Email', A: Math.floor(Math.random() * 40) + 55 },
  { subject: 'Parol', A: Math.floor(Math.random() * 30) + 65 },
  { subject: 'Fizik', A: Math.floor(Math.random() * 20) + 75 },
  { subject: 'Malware', A: Math.floor(Math.random() * 40) + 45 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 border border-cyan-500/30 rounded-xl p-3 text-xs shadow-xl">
      {label && <p className="text-gray-400 mb-2">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="font-bold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalitikaPage() {
  const { user } = useAuth();
  const [monthlyData] = useState(generateMonthlyData);
  const [threatTypes] = useState(generateThreatTypes);
  const [riskTrend] = useState(generateRiskTrend);
  const [radarData] = useState(generateRadarData);
  const [period, setPeriod] = useState('oy');

  const totalScans = monthlyData.reduce((s, d) => s + d.skanlar, 0);
  const totalThreats = monthlyData.reduce((s, d) => s + d.tahdidlar, 0);
  const avgSecurity = Math.round(monthlyData.reduce((s, d) => s + d.xavfsizBaho, 0) / monthlyData.length);
  const lastMonthThreats = monthlyData[monthlyData.length - 1]?.tahdidlar || 0;
  const prevMonthThreats = monthlyData[monthlyData.length - 2]?.tahdidlar || 0;
  const threatChange = prevMonthThreats > 0 ? Math.round(((lastMonthThreats - prevMonthThreats) / prevMonthThreats) * 100) : 0;

  const stats = [
    { label: "Jami skanlar", value: totalScans, icon: Activity, color: 'cyan', change: '+12%' },
    { label: "Aniqlangan tahdidlar", value: totalThreats, icon: AlertTriangle, color: 'red', change: `${threatChange > 0 ? '+' : ''}${threatChange}%` },
    { label: "Xavfsizlik bahosi", value: `${avgSecurity}%`, icon: Shield, color: 'green', change: '+5%' },
    { label: "Hisobotlar", value: monthlyData.reduce((s, d) => s + d.hisobotlar, 0), icon: FileText, color: 'violet', change: '-3%' },
  ];

  const colorMap = {
    cyan: { icon: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    red: { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    green: { icon: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    violet: { icon: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart2} title="Analitika" subtitle="Risk tendensiyalari va xavfsizlik statistikalari">
        <div className="flex rounded-xl border border-white/10 overflow-hidden">
          {[['hafta', 'Hafta'], ['oy', 'Oy'], ['yil', 'Yil']].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)}
              className={`px-3 py-1.5 text-xs transition-all ${period === val ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const conf = colorMap[stat.color];
          const isPositive = stat.change.startsWith('+');
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass-card rounded-2xl p-5 border ${conf.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${conf.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${conf.icon}`} />
                </div>
                <span className={`text-xs flex items-center gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly trend */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 lg:col-span-2">
          <h3 className="font-semibold text-white mb-4">Oylik tahdid va skan tendensiyasi</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorTahdid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2d55" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff2d55" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSkan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="tahdidlar" name="Tahdidlar" stroke="#ff2d55" fill="url(#colorTahdid)" strokeWidth={2} />
              <Area type="monotone" dataKey="skanlar" name="Skanlar" stroke="#00d4ff" fill="url(#colorSkan)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="font-semibold text-white mb-4">Tahdid turlari</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={threatTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                paddingAngle={3} dataKey="value">
                {threatTypes.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {threatTypes.map(t => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  <span className="text-gray-400">{t.name}</span>
                </div>
                <span className="font-medium text-white">{t.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk trend + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="font-semibold text-white mb-4">30 kunlik risk tendensiyasi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={riskTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="kun" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickFormatter={v => v % 5 === 0 ? v : ''} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="risk" name="Risk" stroke="#ff2d55" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="xavfsiz" name="Xavfsiz" stroke="#00ff88" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="font-semibold text-white mb-4">Xavfsizlik matritsasi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Radar name="Xavfsizlik" dataKey="A" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart */}
      <div className="glass-card rounded-2xl p-5 border border-white/10">
        <h3 className="font-semibold text-white mb-4">Oylik xavfsizlik bahosi</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="xavfsizBaho" name="Xavfsizlik bahosi" fill="#00d4ff" radius={[4, 4, 0, 0]}
              background={{ fill: 'rgba(255,255,255,0.02)', radius: [4, 4, 0, 0] }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
