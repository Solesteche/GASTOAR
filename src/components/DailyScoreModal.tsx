import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame, ChevronDown, Lightbulb, X, CheckCircle2,
  TrendingUp, Target, Calendar, Zap, Bell, PiggyBank
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  DailyFinancialScore,
  ScoreDimension,
  TIER_CONFIG,
  ScoreHistory,
} from '../utils/scoreEngine';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DailyScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score?: DailyFinancialScore;
  dailyScore?: DailyFinancialScore;
  history?: ScoreHistory;
  scoreHistory?: ScoreHistory;
  onFinalize?: () => void;
  onFinalizeDay?: () => void;
  isFinalized?: boolean;
  isUnlocked?: boolean;
}

type Tab = 'dimensions' | 'history';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  budget:      <Target className="w-4 h-4" />,
  consistency: <Calendar className="w-4 h-4" />,
  savings:     <PiggyBank className="w-4 h-4" />,
  speed:       <Zap className="w-4 h-4" />,
  bills:       <Bell className="w-4 h-4" />,
  trend:       <TrendingUp className="w-4 h-4" />,
};

const DIM_COLORS: Record<string, string> = {
  budget:      '#7C3AED',
  consistency: '#2563EB',
  savings:     '#059669',
  speed:       '#D97706',
  bills:       '#059669',
  trend:       '#7C3AED',
};

const TIER_STYLES: Record<string, { ring: string; badge: string; text: string }> = {
  excelente: { ring: '#059669', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-700' },
  muy_bien:  { ring: '#7C3AED', badge: 'bg-purple-100 text-purple-800',   text: 'text-purple-700' },
  bien:      { ring: '#2563EB', badge: 'bg-blue-100 text-blue-800',       text: 'text-blue-700'   },
  regular:   { ring: '#D97706', badge: 'bg-amber-100 text-amber-800',     text: 'text-amber-700'  },
  critico:   { ring: '#DC2626', badge: 'bg-red-100 text-red-800',         text: 'text-red-700'    },
};

function getBarColor(pct: number) {
  if (pct >= 80) return '#059669';
  if (pct >= 55) return '#D97706';
  return '#DC2626';
}

function getHistoryBarColor(score: number) {
  if (score >= 75) return '#7C3AED';
  if (score >= 60) return '#2563EB';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

function nDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (x: number) => x.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatShortDate(dateKey: string): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const d = new Date(dateKey + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return days[d.getDay()];
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/** Anillo SVG animado */
const ScoreRing: React.FC<{ score: number; ringColor: string }> = ({ score, ringColor }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let cur = 0;
    const step = () => {
      cur = Math.min(cur + 2, score);
      setDisplayed(cur);
      if (cur < score) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), 150);
    return () => clearTimeout(t);
  }, [score]);

  const filled = (displayed / 100) * circ;

  return (
    <div className="relative w-[72px] h-[72px] flex-shrink-0">
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke="#F3F4F6" strokeWidth={8} />
        <circle
          cx={36} cy={36} r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={8}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dasharray 0.05s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-900 leading-none">{displayed}</span>
        <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  );
};

/** Card de dimensión expandible */
const DimCard: React.FC<{ dim: ScoreDimension; darkMode?: boolean }> = ({ dim, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const color = DIM_COLORS[dim.key] || '#7C3AED';
  const barColor = getBarColor(dim.pct);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(dim.pct), 100);
    return () => clearTimeout(t);
  }, [dim.pct]);

  return (
    <div
      className={`rounded-xl border p-3 mb-2 transition-all duration-200 cursor-pointer
        ${darkMode
          ? 'bg-slate-800/60 border-slate-700/50'
          : 'bg-slate-50 border-slate-200/80'
        }`}
      onClick={() => setExpanded(v => !v)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: color + '18', color }}
        >
          {DIMENSION_ICONS[dim.key] || dim.emoji}
        </span>
        <span className={`text-[13px] font-medium flex-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          {dim.label}
        </span>
        <span className="text-[12px] font-semibold tabular-nums" style={{ color }}>
          {dim.points}/{dim.maxPoints}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Barra de progreso */}
      <div className={`h-1.5 rounded-full overflow-hidden mb-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${barWidth}%`,
            background: barColor,
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      {/* Feedback */}
      <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {dim.feedback}
      </p>

      {/* Tip expandible */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={`mt-2.5 p-2.5 rounded-lg flex items-start gap-2
                ${darkMode ? 'bg-slate-700/60' : 'bg-white'}`}
              style={{ borderLeft: `2px solid ${color}` }}
            >
              <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color }} />
              <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {dim.tip}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Gráfico de barras de historial */
const HistoryChart: React.FC<{ history: ScoreHistory; darkMode?: boolean }> = ({ history, darkMode }) => {
  const today = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const days = Array.from({ length: 7 }, (_, i) => {
    const key = nDaysAgo(6 - i);
    const entry = history[key];
    const val = entry?.total ?? entry?.score ?? null;
    return {
      key,
      label: key === todayKey ? 'Hoy' : formatShortDate(key),
      score: val,
      isToday: key === todayKey,
    };
  });

  return (
    <div className="px-4 pt-3 pb-1">
      <p className={`text-[11px] mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        Últimos 7 días — scores diarios
      </p>
      <div className="flex items-end gap-2 h-20">
        {days.map(d => {
          const heightPct = d.score !== null ? Math.round((d.score / 100) * 100) : 0;
          const color = d.score !== null ? getHistoryBarColor(d.score) : '#E5E7EB';
          return (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
              <span
                className="text-[10px] font-medium tabular-nums"
                style={{ color: d.score !== null ? color : '#9CA3AF' }}
              >
                {d.score !== null ? d.score : '—'}
              </span>
              <div
                className="w-full rounded-t-[4px] min-h-[4px] transition-all duration-500"
                style={{
                  height: `${heightPct}%`,
                  background: color,
                  opacity: d.isToday ? 1 : 0.5,
                }}
              />
              <span
                className="text-[9px]"
                style={{
                  color: d.isToday
                    ? (darkMode ? '#F3F4F6' : '#111827')
                    : '#9CA3AF',
                  fontWeight: d.isToday ? 600 : 400,
                }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Promedio semanal */}
      {(() => {
        const validScores = days.filter(d => d.score !== null).map(d => d.score as number);
        if (validScores.length === 0) return null;
        const avg = Math.round(validScores.reduce((s, n) => s + n, 0) / validScores.length);
        return (
          <div className={`mt-3 pt-3 border-t flex items-center justify-between
            ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Promedio semanal
            </span>
            <span
              className="text-[13px] font-semibold"
              style={{ color: getHistoryBarColor(avg) }}
            >
              {avg} pts
            </span>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Modal principal ──────────────────────────────────────────────────────────

export const DailyScoreModal: React.FC<DailyScoreModalProps> = ({
  isOpen,
  onClose,
  score,
  dailyScore,
  history = {},
  scoreHistory = {},
  onFinalize,
  onFinalizeDay,
  isFinalized = false,
  isUnlocked = false,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('dimensions');
  const actualScore = score || dailyScore;
  const actualHistory = Object.keys(history).length > 0 ? history : scoreHistory;
  const actualFinalize = onFinalize || onFinalizeDay || (() => {});
  const actualFinalized = isFinalized || isUnlocked;
  const [finalized, setFinalized] = useState(actualFinalized);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFinalized(actualFinalized);
    setActiveTab('dimensions');
  }, [isOpen, actualFinalized]);

  // Cerrar al presionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const handleFinalize = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7C3AED', '#9333EA', '#059669', '#F59E0B']
      });
    } catch {}
    setFinalized(true);
    actualFinalize();
  };

  if (!isOpen || !actualScore) return null;

  const currentScoreVal = actualScore.total ?? actualScore.score ?? 0;
  const tierKey = actualScore.tier || 'bien';
  const tier = TIER_CONFIG[tierKey] || TIER_CONFIG.bien;
  const styles = TIER_STYLES[tierKey] || TIER_STYLES.bien;
  const streakDays = actualScore.streak ?? actualScore.streakDays ?? 0;

  // Detectar dark mode
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        ref={sheetRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-sm rounded-t-2xl overflow-hidden shadow-2xl
          ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
        style={{ maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-8 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        </div>

        {/* Header */}
        <div className={`px-4 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-start gap-3 mb-3">
            <ScoreRing score={currentScoreVal} ringColor={styles.ring} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${styles.badge}`}>
                  <span>{tier.emoji}</span>
                  <span>{tier.label}</span>
                </span>
                <button onClick={onClose} className="ml-auto p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {tier.message}
              </p>
              {streakDays > 0 && (
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  <Flame className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">
                    {streakDays} {streakDays === 1 ? 'día' : 'días'} de racha
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex rounded-xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {(['dimensions', 'history'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer
                  ${activeTab === tab
                    ? isDark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-900 shadow-sm'
                    : isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
              >
                {tab === 'dimensions' ? 'Dimensiones' : 'Historial'}
              </button>
            ))}
          </div>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto" style={{ maxHeight: '44vh', scrollbarWidth: 'none' }}>
          {activeTab === 'dimensions' && (
            <div className="px-4 pt-3 pb-2">
              {(actualScore.dimensions || []).map(dim => (
                <DimCard key={dim.key} dim={dim} darkMode={isDark} />
              ))}
            </div>
          )}
          {activeTab === 'history' && (
            <HistoryChart history={actualHistory} darkMode={isDark} />
          )}
        </div>

        {/* CTA */}
        <div className={`px-4 pb-8 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          {finalized ? (
            <div className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Día finalizado — score guardado</span>
            </div>
          ) : (
            <button
              onClick={handleFinalize}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] shadow-md shadow-purple-500/20 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #9333EA)' }}
            >
              Finalizar día y guardar score
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DailyScoreModal;
