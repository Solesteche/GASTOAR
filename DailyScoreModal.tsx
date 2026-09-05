import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  Award, 
  Sparkles, 
  Camera, 
  Clock, 
  Star, 
  Lock, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  ArrowRight,
  RefreshCw,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyFinancialScore } from '../types';

interface DailyScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyScore: DailyFinancialScore;
  isUnlocked: boolean;
  onFinalizeDay: () => void;
  scoreHistory?: Record<string, DailyFinancialScore>;
}

export const DailyScoreModal: React.FC<DailyScoreModalProps> = ({
  isOpen,
  onClose,
  dailyScore,
  isUnlocked,
  onFinalizeDay,
  scoreHistory = {},
}) => {
  const [isRevealing, setIsRevealing] = useState(false);
  const [activeTab, setActiveTab] = useState<'score' | 'history'>('score');

  useEffect(() => {
    if (isOpen && isUnlocked) {
      // Fire subtle celebratory confetti if opened already unlocked
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f95420', '#c084fc', '#38bdf8', '#fbbf24']
        });
      } catch {}
    }
  }, [isOpen, isUnlocked]);

  if (!isOpen) return null;

  const handleUnlockClick = () => {
    setIsRevealing(true);
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#f95420', '#a855f7', '#38bdf8', '#fbbf24', '#34d399']
      });
    } catch {}

    setTimeout(() => {
      onFinalizeDay();
      setIsRevealing(false);
    }, 600);
  };

  // Recent 7 days history array
  const last7DaysScores = (Object.values(scoreHistory) as DailyFinancialScore[])
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 7)
    .reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-gradient-to-b from-[#1c0733] via-[#240a44] to-[#120324] border border-purple-500/30 rounded-[32px] text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header matching Screenshot 2 */}
        <div className="px-5 py-4 border-b border-purple-900/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-purple-200 transition-colors cursor-pointer"
            title="Volver"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center flex-1 pr-9">
            <h2 className="text-base font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>Tu Score diario</span>
            </h2>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

          {/* STATE 1: LOCKED / PRE-FINALIZATION (Matching Image Screen 2) */}
          {!isUnlocked ? (
            <div className="text-center space-y-6">
              
              {/* Glowing Golden Trophy */}
              <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                {/* Multi-layered glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 via-orange-500/20 to-purple-600/30 rounded-full blur-2xl animate-pulse" />
                <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#3b1266] to-[#20073b] border-2 border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center justify-center relative">
                  <div className="text-5xl animate-bounce duration-1000">
                    🏆
                  </div>
                  <Sparkles className="w-6 h-6 text-amber-300 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </div>

              {/* Headings */}
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                  ¡Finaliza tu día y desbloquea<br />tu Score financiero!
                </h3>
                <p className="text-xs sm:text-sm text-purple-200/75 max-w-xs mx-auto">
                  El score se calcula en base a tus hábitos financieros diarios.
                </p>
              </div>

              {/* Checklist Cards (Matching Screenshot 2) */}
              <div className="space-y-2.5 text-left">
                
                <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-purple-500/20 flex items-center gap-3.5 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">Revisa que tus gastos estén cargados</p>
                    <p className="text-[11px] text-purple-300/70">Asegurate de incluir todas tus compras y pagos de hoy.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-purple-500/20 flex items-center gap-3.5 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">El score se calcula una vez por día</p>
                    <p className="text-[11px] text-purple-300/70">Refleja tu disciplina y respeto del límite diario.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-purple-500/20 flex items-center gap-3.5 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-300 shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">Volvé mañana para mejorar tu score</p>
                    <p className="text-[11px] text-purple-300/70">Construí una racha de ahorro y control de finanzas.</p>
                  </div>
                </div>

              </div>

              {/* Action Button: Finalizar el día 🔒 (Matching Image) */}
              <button
                type="button"
                onClick={handleUnlockClick}
                disabled={isRevealing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#F95420] hover:from-[#E04412] hover:to-[#F95420] text-white font-black text-sm sm:text-base shadow-xl shadow-orange-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/15"
              >
                {isRevealing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Finalizar el día</span>
                    <Lock className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>

            </div>
          ) : (
            /* STATE 2: UNLOCKED / SCORE REVEALED */
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Big Score Visual Circle */}
              <div className="text-center relative">
                <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/25 via-purple-600/30 to-emerald-500/25 rounded-full blur-2xl" />
                  
                  {/* Circular Score Gauge */}
                  <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90 transform">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={dailyScore.color}
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={`${251.2 - (dailyScore.score / 100) * 251.2}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                      {dailyScore.score}
                    </span>
                    <span className="text-[11px] font-bold text-purple-200 mt-0.5">de 100</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border" style={{
                    backgroundColor: `${dailyScore.color}20`,
                    borderColor: `${dailyScore.color}50`,
                    color: dailyScore.color
                  }}>
                    <span>{dailyScore.ratingEmoji}</span>
                    <span>{dailyScore.rating}</span>
                  </div>
                  <p className="text-xs text-purple-200/80">
                    {dailyScore.dailySpent === 0 
                      ? '¡Día impecable sin gastos! Presupuesto preservado al 100%.' 
                      : dailyScore.isWithinLimit
                      ? `Gastaste $${dailyScore.dailySpent.toLocaleString('es-AR')} dentro de tu límite de $${dailyScore.dailyLimit.toLocaleString('es-AR')}.`
                      : `Gastaste $${dailyScore.dailySpent.toLocaleString('es-AR')} (superó el límite sugerido de $${dailyScore.dailyLimit.toLocaleString('es-AR')}).`
                    }
                  </p>
                </div>
              </div>

              {/* Racha Badge */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/20 via-purple-600/20 to-orange-500/20 border border-orange-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/30 flex items-center justify-center text-orange-300 text-lg">
                    🔥
                  </div>
                  <div>
                    <p className="font-extrabold text-white">Racha Financiera</p>
                    <p className="text-[11px] text-orange-200/80">{dailyScore.streakDays} días consecutivos finalizados</p>
                  </div>
                </div>
                <span className="font-black text-sm text-orange-300 bg-orange-500/20 px-2.5 py-1 rounded-xl border border-orange-400/30">
                  +{dailyScore.breakdown.streak.score} pts
                </span>
              </div>

              {/* Breakdown List */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300/60 px-1">
                  Desglose de Puntos
                </p>

                {/* 1. Límite */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {dailyScore.breakdown.limit.label}
                    </span>
                    <span className="font-extrabold text-purple-200">
                      {dailyScore.breakdown.limit.score} / {dailyScore.breakdown.limit.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(dailyScore.breakdown.limit.score / dailyScore.breakdown.limit.maxScore) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10.5px] text-purple-300/70">{dailyScore.breakdown.limit.description}</p>
                </div>

                {/* 2. Registro */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      {dailyScore.breakdown.logging.label}
                    </span>
                    <span className="font-extrabold text-purple-200">
                      {dailyScore.breakdown.logging.score} / {dailyScore.breakdown.logging.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-sky-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(dailyScore.breakdown.logging.score / dailyScore.breakdown.logging.maxScore) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10.5px] text-purple-300/70">{dailyScore.breakdown.logging.description}</p>
                </div>

                {/* 3. Ritmo de Presupuesto */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                      {dailyScore.breakdown.budgetPacing.label}
                    </span>
                    <span className="font-extrabold text-purple-200">
                      {dailyScore.breakdown.budgetPacing.score} / {dailyScore.breakdown.budgetPacing.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(dailyScore.breakdown.budgetPacing.score / dailyScore.breakdown.budgetPacing.maxScore) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10.5px] text-purple-300/70">{dailyScore.breakdown.budgetPacing.description}</p>
                </div>

              </div>

              {/* Smart Tip for Tomorrow */}
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-xs">
                <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-200">Consejo para mañana</p>
                  <p className="text-[11px] text-amber-100/80 leading-relaxed mt-0.5">{dailyScore.tip}</p>
                </div>
              </div>

              {/* Close & Recalculate Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white font-bold text-xs shadow-lg shadow-orange-500/25 active:scale-95 transition-all text-center cursor-pointer"
                >
                  ¡Genial, gracias!
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
