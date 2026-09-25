// scoreEngine.ts — Sistema de score financiero multidimensional GastoAR
// Reemplazar el archivo completo

import { Transaction, Budgets, DailyFinancialScore, ScoreDimension, ScoreTier } from '../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type { ScoreDimension, ScoreTier, DailyFinancialScore };

export interface ScoreHistory {
  [dateKey: string]: DailyFinancialScore;
}

// ─── Helper: fecha de hoy ─────────────────────────────────────────────────────

export const getTodayDateString = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ─── Tier según puntaje ───────────────────────────────────────────────────────

export const getTier = (score: number): ScoreTier => {
  if (score >= 90) return 'excelente';
  if (score >= 75) return 'muy_bien';
  if (score >= 60) return 'bien';
  if (score >= 40) return 'regular';
  return 'critico';
};

export const TIER_CONFIG: Record<ScoreTier, {
  label: string; emoji: string; color: string; bg: string; message: string;
}> = {
  excelente: {
    label: 'Excelente', emoji: '🏆',
    color: '#059669', bg: '#D1FAE5',
    message: '¡Sos un ejemplo de finanzas sanas!',
  },
  muy_bien: {
    label: 'Muy bien', emoji: '🥇',
    color: '#7C3AED', bg: '#EDE9FE',
    message: 'Estás en el buen camino, seguí así.',
  },
  bien: {
    label: 'Bien', emoji: '💪',
    color: '#2563EB', bg: '#DBEAFE',
    message: 'Controlás bien tus gastos.',
  },
  regular: {
    label: 'Regular', emoji: '⚠️',
    color: '#D97706', bg: '#FEF3C7',
    message: 'Hay algunas categorías que merecen atención.',
  },
  critico: {
    label: 'Crítico', emoji: '🚨',
    color: '#DC2626', bg: '#FEE2E2',
    message: 'Tus gastos superan los límites. Revisá el presupuesto.',
  },
};

// ─── Motor principal ──────────────────────────────────────────────────────────

export const computeDailyFinancialScore = (
  transactions: Transaction[] = [],
  budgets: Budgets,
  history: ScoreHistory = {},
  today: string = getTodayDateString(),
  vencimientos: Array<{ dueDate: string; isPaid?: boolean }> = [],
): DailyFinancialScore => {

  const dimensions: ScoreDimension[] = [];

  // ── 1. Control de presupuesto (30 pts) ──────────────────────────────────────
  const monthStart = today.substring(0, 7) + '-01';
  const monthTxs = (transactions || []).filter(
    t => t.tipoTransaccion !== 'ingreso' && t.fecha >= monthStart && t.fecha <= today
  );
  const catSpend: Record<string, number> = {};
  monthTxs.forEach(t => {
    catSpend[t.categoria] = (catSpend[t.categoria] || 0) + t.monto;
  });

  const cats = Object.entries(budgets?.categories || {});
  let budgetPts = 30;
  let worstCat = '';
  let worstPct = 0;

  if (cats.length > 0) {
    cats.forEach(([cat, limit]) => {
      const spent = catSpend[cat] || 0;
      const pct = limit > 0 ? spent / limit : 0;
      if (pct > worstPct) { worstPct = pct; worstCat = cat; }
      if (pct > 1.0) budgetPts -= 10;       // superó el límite
      else if (pct > 0.9) budgetPts -= 5;   // cerca del límite
      else if (pct > 0.75) budgetPts -= 2;  // en seguimiento
    });
    budgetPts = Math.max(0, budgetPts);
  }

  dimensions.push({
    key: 'budget',
    label: 'Control de presupuesto',
    emoji: '🎯',
    points: budgetPts,
    maxPoints: 30,
    pct: Math.round((budgetPts / 30) * 100),
    feedback: budgetPts >= 25
      ? 'Tus categorías están bajo control'
      : worstCat
        ? `"${worstCat}" superó el ${Math.round(worstPct * 100)}% del presupuesto`
        : 'Revisá tus límites por categoría',
    tip: budgetPts < 20
      ? `Ajustá el presupuesto de "${worstCat}" o reducí gastos ahí`
      : 'Seguí así con tus límites actuales',
  });

  // ── 2. Consistencia de registro (20 pts) ────────────────────────────────────
  // Cuántos de los últimos 7 días tuvo al menos 1 movimiento registrado
  const daysWithActivity = new Set(
    (transactions || [])
      .filter(t => t.fecha >= nDaysAgo(7, today) && t.fecha <= today)
      .map(t => t.fecha)
  ).size;

  const consistencyPts = Math.round((daysWithActivity / 7) * 20);

  // Racha actual
  const streak = computeStreak(history, today);

  dimensions.push({
    key: 'consistency',
    label: 'Consistencia',
    emoji: '📅',
    points: consistencyPts,
    maxPoints: 20,
    pct: Math.round((consistencyPts / 20) * 100),
    feedback: daysWithActivity >= 6
      ? `Registraste gastos ${daysWithActivity} de los últimos 7 días 🔥`
      : `Solo ${daysWithActivity}/7 días con movimientos registrados`,
    tip: daysWithActivity < 5
      ? 'Intentá registrar cada gasto el mismo día que ocurre'
      : 'Mantené el hábito — ¡ya tenés una racha de ' + streak + ' días!',
  });

  // ── 3. Ahorro neto del mes (20 pts) ─────────────────────────────────────────
  const totalIncome = (transactions || [])
    .filter(t => t.tipoTransaccion === 'ingreso' && t.fecha >= monthStart)
    .reduce((s, t) => s + t.monto, 0);

  const totalExpenses = monthTxs.reduce((s, t) => s + t.monto, 0);

  let savingsPts = 0;
  let savingsRate = 0;
  if (totalIncome > 0) {
    savingsRate = (totalIncome - totalExpenses) / totalIncome;
    if (savingsRate >= 0.3)      savingsPts = 20;  // ahorra 30%+
    else if (savingsRate >= 0.2) savingsPts = 16;
    else if (savingsRate >= 0.1) savingsPts = 12;
    else if (savingsRate >= 0)   savingsPts = 8;   // no ahorra pero no se endeuda
    else                          savingsPts = 0;  // gastó más de lo que ingresó
  } else {
    // Sin ingresos cargados → puntos neutros para no penalizar
    savingsPts = 10;
  }

  dimensions.push({
    key: 'savings',
    label: 'Ahorro neto',
    emoji: '💰',
    points: savingsPts,
    maxPoints: 20,
    pct: Math.round((savingsPts / 20) * 100),
    feedback: totalIncome === 0
      ? 'Cargá tus ingresos para calcular tu tasa de ahorro'
      : savingsRate >= 0.2
        ? `¡Ahorrás el ${Math.round(savingsRate * 100)}% de tus ingresos!`
        : savingsRate >= 0
          ? `Ahorrás el ${Math.round(savingsRate * 100)}% — la meta es 20%`
          : 'Gastaste más de lo que ingresaste este mes',
    tip: savingsRate < 0.1 && totalIncome > 0
      ? 'Intentá recortar en la categoría de mayor gasto para llegar al 10% de ahorro'
      : 'Meta sugerida: destinar el 20% del sueldo al ahorro',
  });

  // ── 4. Velocidad de registro (10 pts) ───────────────────────────────────────
  // ¿Cuántos gastos se registraron el mismo día o al día siguiente?
  const recentTxs = (transactions || []).filter(
    t => t.tipoTransaccion !== 'ingreso' && t.fecha >= nDaysAgo(7, today)
  );
  const sameOrNextDay = recentTxs.filter(t => {
    if (!t.createdAt) return true; // sin timestamp → beneficio de la duda
    const created = new Date(t.createdAt).toISOString().split('T')[0];
    const diff = daysBetween(t.fecha, created);
    return diff <= 1;
  }).length;

  const speedPts = recentTxs.length === 0
    ? 5  // neutro si no hay txs recientes
    : Math.round((sameOrNextDay / recentTxs.length) * 10);

  dimensions.push({
    key: 'speed',
    label: 'Registro en tiempo real',
    emoji: '⚡',
    points: speedPts,
    maxPoints: 10,
    pct: Math.round((speedPts / 10) * 100),
    feedback: speedPts >= 8
      ? 'Registrás los gastos al instante — excelente hábito'
      : 'Algunos gastos se registraron días después',
    tip: 'Registrá cada gasto con GastoAR justo después de pagarlo',
  });

  // ── 5. Vencimientos al día (10 pts) ─────────────────────────────────────────
  const overdueCount = (vencimientos || []).filter(v => {
    if (v.isPaid) return false;
    return v.dueDate < today;
  }).length;

  const vencPts = overdueCount === 0 ? 10 : Math.max(0, 10 - overdueCount * 4);

  dimensions.push({
    key: 'bills',
    label: 'Vencimientos al día',
    emoji: '🔔',
    points: vencPts,
    maxPoints: 10,
    pct: Math.round((vencPts / 10) * 100),
    feedback: overdueCount === 0
      ? 'No tenés pagos vencidos — ¡todo al día!'
      : `Tenés ${overdueCount} pago${overdueCount > 1 ? 's' : ''} vencido${overdueCount > 1 ? 's' : ''}`,
    tip: overdueCount > 0
      ? 'Marcá los pagos como realizados en la sección Vencimientos'
      : 'Configurá alertas para no olvidar los próximos vencimientos',
  });

  // ── 6. Tendencia vs semana anterior (10 pts) ────────────────────────────────
  const thisWeekSpend = (transactions || [])
    .filter(t => t.tipoTransaccion !== 'ingreso'
      && t.fecha >= nDaysAgo(7, today) && t.fecha <= today)
    .reduce((s, t) => s + t.monto, 0);

  const lastWeekStart = nDaysAgo(14, today);
  const lastWeekEnd = nDaysAgo(8, today);
  const lastWeekSpend = (transactions || [])
    .filter(t => t.tipoTransaccion !== 'ingreso'
      && t.fecha >= lastWeekStart && t.fecha <= lastWeekEnd)
    .reduce((s, t) => s + t.monto, 0);

  let trendPts = 5; // neutro por defecto
  let trendPct = 0;
  if (lastWeekSpend > 0) {
    trendPct = ((thisWeekSpend - lastWeekSpend) / lastWeekSpend) * 100;
    if (trendPct <= -20)      trendPts = 10;  // gastó 20%+ menos
    else if (trendPct <= -10) trendPts = 8;
    else if (trendPct <= 0)   trendPts = 6;
    else if (trendPct <= 10)  trendPts = 4;
    else                       trendPts = 0;  // gastó 10%+ más
  }

  dimensions.push({
    key: 'trend',
    label: 'Tendencia semanal',
    emoji: '📈',
    points: trendPts,
    maxPoints: 10,
    pct: Math.round((trendPts / 10) * 100),
    feedback: lastWeekSpend === 0
      ? 'Sin datos de semana anterior para comparar'
      : trendPct <= 0
        ? `Gastaste ${Math.abs(Math.round(trendPct))}% menos que la semana pasada 💚`
        : `Gastaste ${Math.round(trendPct)}% más que la semana pasada`,
    tip: trendPts < 6
      ? 'Intentá reducir gastos en categorías variables (salidas, compras)'
      : 'Mantené esta tendencia y tu score seguirá subiendo',
  });

  // ── Total ────────────────────────────────────────────────────────────────────
  const total = Math.round(
    dimensions.reduce((s, d) => s + d.points, 0)
  );

  const tier = getTier(total);
  const cfg = TIER_CONFIG[tier];
  const catBudgets = Object.values(budgets?.categories || {}).reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
  const generalBudget = catBudgets > 0 ? catBudgets : (totalIncome > 0 ? totalIncome : 200000);

  return {
    date: today,
    total: Math.min(100, Math.max(0, total)),
    score: Math.min(100, Math.max(0, total)), // compatibility alias
    tier,
    rating: cfg.label,                       // compatibility alias
    ratingEmoji: cfg.emoji,                   // compatibility alias
    color: cfg.color,                         // compatibility alias
    dimensions,
    streak,
    streakDays: streak,                       // compatibility alias
    unlockedAt: history[today]?.unlockedAt,
    tip: dimensions.find(d => d.points < d.maxPoints)?.tip || dimensions[0]?.tip || '¡Excelente trabajo financiero!',
    dailySpent: totalExpenses,
    dailyLimit: Math.round(generalBudget / 30),
    isWithinLimit: totalExpenses <= Math.round(generalBudget / 30),
    breakdown: {
      limit: {
        score: dimensions[0]?.points || 0,
        maxScore: dimensions[0]?.maxPoints || 30,
        label: dimensions[0]?.label || 'Presupuesto',
        description: dimensions[0]?.feedback || '',
        status: (dimensions[0]?.pct >= 80 ? 'perfect' : dimensions[0]?.pct >= 50 ? 'good' : 'warning'),
      },
      logging: {
        score: dimensions[1]?.points || 0,
        maxScore: dimensions[1]?.maxPoints || 20,
        label: dimensions[1]?.label || 'Consistencia',
        description: dimensions[1]?.feedback || '',
        status: (dimensions[1]?.pct >= 80 ? 'perfect' : dimensions[1]?.pct >= 50 ? 'good' : 'warning'),
      },
      budgetPacing: {
        score: dimensions[2]?.points || 0,
        maxScore: dimensions[2]?.maxPoints || 20,
        label: dimensions[2]?.label || 'Ahorro neto',
        description: dimensions[2]?.feedback || '',
        status: (dimensions[2]?.pct >= 80 ? 'perfect' : dimensions[2]?.pct >= 50 ? 'good' : 'warning'),
      },
      streak: {
        score: Math.min(10, streak * 2),
        maxScore: 10,
        label: 'Racha',
        description: `${streak} días consecutivos`,
        status: streak >= 3 ? 'perfect' : 'good',
      }
    }
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nDaysAgo(n: number, from: string): string {
  const d = new Date(from + 'T00:00:00');
  d.setDate(d.getDate() - n);
  const pad = (x: number) => x.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function computeStreak(history: ScoreHistory, today: string): number {
  let streak = 0;
  let date = today;
  while (true) {
    const entry = history[date];
    if (!entry || (entry.total ?? entry.score ?? 0) < 60) break;
    streak++;
    date = nDaysAgo(1, date);
    if (streak > 365) break; // seguro
  }
  return streak;
}
