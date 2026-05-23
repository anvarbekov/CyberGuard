'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Award, ChevronRight, CheckCircle, XCircle,
  Star, Trophy, Target, RotateCcw, Loader2, Lock, Zap,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LEARNING_MODULES, QUIZ_QUESTIONS } from '@/constants';
import toast from 'react-hot-toast';

const BADGES = [
  { id: 'beginner',  label: 'Yangi boshlovchi', icon: '🌱', xp: 0,    color: 'from-green-500/20 to-emerald-500/20',  border: 'border-green-500/30',  text: 'text-green-400' },
  { id: 'learner',   label: "O'rganuvchi",       icon: '📚', xp: 100,  color: 'from-blue-500/20 to-cyan-500/20',      border: 'border-cyan-500/30',   text: 'text-cyan-400'  },
  { id: 'defender',  label: 'Himoyachi',          icon: '🛡️', xp: 250,  color: 'from-violet-500/20 to-purple-500/20',  border: 'border-violet-500/30', text: 'text-violet-400'},
  { id: 'expert',    label: 'Mutaxassis',         icon: '⚡', xp: 500,  color: 'from-yellow-500/20 to-orange-500/20',  border: 'border-yellow-500/30', text: 'text-yellow-400'},
  { id: 'master',    label: 'Master',             icon: '🏆', xp: 1000, color: 'from-red-500/20 to-pink-500/20',       border: 'border-red-500/30',    text: 'text-red-400'   },
];

function getCurrentBadge(xp) {
  return [...BADGES].reverse().find(b => xp >= b.xp) || BADGES[0];
}

function getNextBadge(xp) {
  return BADGES.find(b => xp < b.xp) || null;
}

// ─── Quiz Modal ───────────────────────────────────────────────────────────────
function QuizModal({ moduleId, onClose, onComplete }) {
  const questions = QUIZ_QUESTIONS[moduleId] || [];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);

  if (!questions.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/20 text-center">
          <p className="text-white">Bu modul uchun savollar yo'q</p>
          <button onClick={onClose} className="mt-4 btn-cyber px-4 py-2 rounded-xl text-sm">Yopish</button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const totalCorrect = answers.filter(a => a.correct).length;
  const finalScore = Math.round((totalCorrect / questions.length) * 100);

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === q.correct;
    setTimeout(() => {
      setAnswers(prev => [...prev, { correct: isCorrect }]);
      if (current + 1 < questions.length) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 900);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 w-full max-w-lg border border-cyan-500/20 shadow-2xl">
        {!finished ? (
          <>
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Savol {current + 1}/{questions.length}</span>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                    i < current ? 'bg-green-400' : i === current ? 'bg-cyan-400 animate-pulse' : 'bg-white/15'
                  }`} />
                ))}
              </div>
            </div>
            <div className="h-1 bg-black/30 rounded-full mb-5">
              <motion.div animate={{ width: `${(current / questions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
            </div>

            <h3 className="text-base font-semibold text-white mb-4 leading-relaxed">{q.question}</h3>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === q.correct;
                const showResult = selected !== null;
                return (
                  <motion.button key={i} onClick={() => handleAnswer(i)} whileHover={!selected ? { x: 4 } : {}}
                    disabled={selected !== null}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-sm flex items-center gap-3 ${
                      showResult && isCorrect
                        ? 'border-green-500/60 bg-green-500/15 text-green-300'
                        : showResult && isSelected && !isCorrect
                        ? 'border-red-500/60 bg-red-500/15 text-red-300'
                        : isSelected
                        ? 'border-cyan-500/50 bg-cyan-500/10 text-white'
                        : 'border-white/10 hover:border-cyan-500/30 hover:bg-white/5 text-gray-300'
                    }`}>
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">
                      {showResult && isCorrect ? <CheckCircle className="w-3.5 h-3.5" />
                        : showResult && isSelected ? <XCircle className="w-3.5 h-3.5" />
                        : String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </motion.button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
              className="text-6xl mb-4">{finalScore >= 80 ? '🏆' : finalScore >= 60 ? '👍' : '📚'}</motion.div>
            <h3 className="text-2xl font-bold text-white mb-1">{finalScore}%</h3>
            <p className="text-gray-400 text-sm mb-1">{totalCorrect}/{questions.length} to'g'ri javob</p>
            <p className={`text-sm font-medium mb-6 ${finalScore >= 80 ? 'text-green-400' : finalScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {finalScore >= 80 ? 'Ajoyib natija! 🎉' : finalScore >= 60 ? "Yaxshi! Davom eting 💪" : "Ko'proq o'rganing 📖"}
            </p>
            <p className="text-xs text-cyan-400 mb-6">+{Math.round((finalScore / 100) * 50)} XP qo'shildi</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setCurrent(0); setSelected(null); setAnswers([]); setFinished(false); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm transition-all">
                <RotateCcw className="w-4 h-4" />Qayta topshirish
              </button>
              <button onClick={() => onComplete(finalScore)}
                className="btn-cyber-solid px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />Tugatish
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TalimPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState({});
  const [totalXP, setTotalXP] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load progress from Firestore — single doc per user
  const loadProgress = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const ref = doc(db, 'learning_progress', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setProgress(data.modules || {});
        setTotalXP(data.totalXP || 0);
      }
    } catch (err) {
      console.warn('Progress yuklashda xato:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProgress(); }, [user]);

  const handleQuizComplete = async (moduleId, score) => {
    const xpEarned = Math.round((score / 100) * 50);
    const oldProgress = progress[moduleId];
    const isFirstCompletion = !oldProgress?.completed;

    const newModuleProgress = {
      completed: score >= 60,
      score,
      bestScore: Math.max(score, oldProgress?.bestScore || 0),
      completedAt: new Date().toISOString(),
      attempts: (oldProgress?.attempts || 0) + 1,
    };

    const newProgress = { ...progress, [moduleId]: newModuleProgress };
    // Only add XP on first completion OR improvement
    const xpToAdd = isFirstCompletion ? xpEarned : 0;
    const newXP = totalXP + xpToAdd;

    setProgress(newProgress);
    setTotalXP(newXP);
    setActiveQuiz(null);

    if (xpToAdd > 0) {
      toast.success(`+${xpToAdd} XP qo'shildi! 🎉`);
    } else {
      toast.success(score >= 60 ? "Yaxshi natija! 👍" : "Ko'proq mashq qiling 💪");
    }

    if (!user) return;
    try {
      await setDoc(doc(db, 'learning_progress', user.uid), {
        userId: user.uid,
        modules: newProgress,
        totalXP: newXP,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Progress saqlashda xato:', err.message);
    }
  };

  const currentBadge = getCurrentBadge(totalXP);
  const nextBadge = getNextBadge(totalXP);
  const completedCount = Object.values(progress).filter(p => p?.completed).length;
  const xpProgress = nextBadge ? ((totalXP - currentBadge.xp) / (nextBadge.xp - currentBadge.xp)) * 100 : 100;

  return (
    <div className="space-y-6 p-6">
      <PageHeader icon={BookOpen} title="Ta'lim markazi" subtitle="Kiberxavfsizlik bo'yicha bilimlaringizni oshiring" />

      {/* XP + Badge Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentBadge.color} border ${currentBadge.border} flex items-center justify-center text-3xl`}>
              {currentBadge.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Joriy daraja</p>
              <h3 className={`text-xl font-bold ${currentBadge.text}`}>{currentBadge.label}</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                <span className="text-cyan-400 font-semibold">{totalXP}</span> XP • {completedCount}/{LEARNING_MODULES.length} modul
              </p>
            </div>
          </div>
          <div className="w-full sm:w-48">
            {nextBadge ? (
              <>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>{currentBadge.label}</span>
                  <span>{nextBadge.label}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(xpProgress, 3)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-right">{nextBadge.xp - totalXP} XP qoldi</p>
              </>
            ) : (
              <div className="text-sm text-yellow-400 font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4" />Eng yuqori daraja!
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Badges row */}
      <div className="grid grid-cols-5 gap-3">
        {BADGES.map((badge, i) => {
          const earned = totalXP >= badge.xp;
          return (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-xl p-3 text-center border transition-all ${
                earned ? `${badge.border} ${badge.color}` : 'border-white/5 opacity-40'
              }`}>
              <div className="text-2xl mb-1">{badge.icon}</div>
              <p className={`text-xs font-medium ${earned ? badge.text : 'text-gray-500'}`}>{badge.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{badge.xp} XP</p>
              {!earned && <Lock className="w-3 h-3 text-gray-600 mx-auto mt-1" />}
            </motion.div>
          );
        })}
      </div>

      {/* Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 border border-white/5 animate-pulse">
              <div className="h-4 bg-white/5 rounded mb-3 w-3/4" />
              <div className="h-3 bg-white/5 rounded mb-2 w-full" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))
        ) : LEARNING_MODULES.map((module, i) => {
          const prog = progress[module.id];
          const done = prog?.completed;
          const attempted = !!prog;
          const bestScore = prog?.bestScore || prog?.score || 0;

          return (
            <motion.div key={module.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }}
              className={`glass-card rounded-xl p-5 border transition-all cursor-pointer group ${
                done ? 'border-green-500/20 bg-green-500/5' : 'border-white/10 hover:border-cyan-500/30'
              }`}
              onClick={() => setActiveQuiz(module.id)}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{module.icon}</div>
                <div className="flex items-center gap-2">
                  {done && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Bajarildi</span>}
                  {attempted && !done && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">Urinildi</span>}
                  {!attempted && <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">Yangi</span>}
                </div>
              </div>

              <h3 className="font-semibold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">{module.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">{module.description}</p>

              {/* Stats row */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{module.duration || '15 daqiqa'}</span>
                <span className="flex items-center gap-1"><Target className="w-3 h-3" />{(QUIZ_QUESTIONS[module.id] || []).length} savol</span>
                {attempted && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{bestScore}%</span>}
              </div>

              {/* XP bar if attempted */}
              {attempted && (
                <div className="h-1 bg-black/30 rounded-full mb-3">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                    style={{ width: `${bestScore}%` }} />
                </div>
              )}

              <button className={`w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                done
                  ? 'border border-green-500/30 text-green-400 hover:bg-green-500/10'
                  : 'btn-cyber-solid'
              }`}>
                {done ? <><RotateCcw className="w-3.5 h-3.5" />Qayta topshirish</> : <><Zap className="w-3.5 h-3.5" />Boshlash</>}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {activeQuiz && (
          <QuizModal
            moduleId={activeQuiz}
            onClose={() => setActiveQuiz(null)}
            onComplete={(score) => handleQuizComplete(activeQuiz, score)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
