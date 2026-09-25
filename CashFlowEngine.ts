// CashFlowEngine.ts
// Motor de Proyección de Flujo de Caja — Feature exclusivo Plan Pro GastoAR
// Calcula cuánto dinero va a tener el usuario en los próximos N días

import { Transaction } from './types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RecurringPattern {
  category: string;
  averageMonthly: number;   // gasto mensual promedio en esta categoría
  frequency: 'daily' | 'weekly' | 'monthly';
  confidence: number;       // 0–1, qué tan seguro es el patrón
}

export interface ScheduledPayment {
  id: string;
  label: string;
  amount: number;
  dueDate: string;         // YYYY-MM-DD
  type: 'expense' | 'income';
  category: string;
  isRecurring: boolean;
  emoji: string;
}

export interface DayProjection {
  date: string;            // YYYY-MM-DD
  dayLabel: string;        // "Lun 15 Sep"
  balance: number;         // saldo proyectado al final del día
  dailyExpense: number;    // gasto estimado del día
  dailyIncome: number;     // ingreso esperado ese día
  scheduledPayments: ScheduledPayment[];
  isCritical: boolean;     // saldo peligrosamente bajo
  isPayday: boolean;       // día de cobro
  netFlow: number;         // ingresos - gastos del día
}

export interface CashFlowProjection {
  days: DayProjection[];
  currentBalance: number;
  projectedBalanceIn7Days: number;
  projectedBalanceIn15Days: number;
  projectedBalanceIn30Days: number;
  criticalDays: DayProjection[];
  nextPayday?: string;
  averageDailyExpense: number;
  daysUntilZero: number | null;   // null si nunca llega a 0 en el rango
  alerts: CashFlowAlert[];
  generatedAt: number;
}

export interface CashFlowAlert {
  type: 'critical_balance' | 'large_expense_ahead' | 'income_expected' | 'burn_rate_high';
  message: string;
  date?: string;
  amount?: number;
  severity: 'high' | 'medium' | 'low';
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const LOW_BALANCE_THRESHOLD = 0.15;    // 15% del ingreso mensual
const CRITICAL_BALANCE_THRESHOLD = 0.05; // 5% del ingreso mensual

// ─── Motor ────────────────────────────────────────────────────────────────────

export class CashFlowEngine {

  /**
   * Calcula la proyección de flujo de caja para los próximos N días
   */
  static calculate(
    transactions: Transaction[],
    currentBalance: number,
    scheduledPayments: ScheduledPayment[],
    daysAhead = 30,
  ): CashFlowProjection {

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // 1. Analizar patrones de gasto de los últimos 60 días
    const patterns = CashFlowEngine.analyzePatterns(transactions);
    const avgDailyExpense = patterns.reduce((s, p) => s + p.averageMonthly / 30, 0);

    // 2. Estimar ingreso mensual
    const monthlyIncome = CashFlowEngine.estimateMonthlyIncome(transactions);
    const lowBalanceThreshold = monthlyIncome * LOW_BALANCE_THRESHOLD;
    const criticalThreshold = monthlyIncome * CRITICAL_BALANCE_THRESHOLD;

    // 3. Detectar día de pago habitual
    const paydays = CashFlowEngine.detectPaydays(transactions);

    // 4. Generar días proyectados
    const days: DayProjection[] = [];
    let runningBalance = currentBalance;

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      const dayName = DAY_NAMES[date.getDay()];
      const dayLabel = `${dayName} ${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]}`;

      // Pagos programados para este día
      const dayScheduled = scheduledPayments.filter(p => p.dueDate === dateStr);
      const scheduledExpense = dayScheduled
        .filter(p => p.type === 'expense')
        .reduce((s, p) => s + p.amount, 0);
      const scheduledIncome = dayScheduled
        .filter(p => p.type === 'income')
        .reduce((s, p) => s + p.amount, 0);

      // ¿Es día de cobro?
      const isPayday = paydays.includes(date.getDate());

      // Ingreso esperado
      const estimatedDailyIncome = isPayday ? (monthlyIncome / paydays.length) : 0;
      const totalIncome = scheduledIncome + estimatedDailyIncome;

      // Gasto estimado del día
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const weekendMultiplier = isWeekend ? 1.2 : 1.0;
      const estimatedDailyExpense = avgDailyExpense * weekendMultiplier;
      const totalExpense = scheduledExpense + estimatedDailyExpense;

      runningBalance = runningBalance + totalIncome - totalExpense;

      days.push({
        date: dateStr,
        dayLabel,
        balance: Math.round(runningBalance),
        dailyExpense: Math.round(totalExpense),
        dailyIncome: Math.round(totalIncome),
        scheduledPayments: dayScheduled,
        isCritical: runningBalance < criticalThreshold,
        isPayday: isPayday || scheduledIncome > 0,
        netFlow: Math.round(totalIncome - totalExpense),
      });
    }

    // 5. Calcular métricas
    const criticalDays = days.filter(d => d.isCritical);
    const daysUntilZero = days.findIndex(d => d.balance <= 0);

    // 6. Próximo día de cobro
    const nextPayday = days.find(d => d.isPayday)?.date;

    // 7. Generar alertas
    const alerts = CashFlowEngine.generateAlerts(
      days, currentBalance, monthlyIncome, avgDailyExpense,
    );

    return {
      days,
      currentBalance,
      projectedBalanceIn7Days:  days[6]?.balance  ?? currentBalance,
      projectedBalanceIn15Days: days[14]?.balance ?? currentBalance,
      projectedBalanceIn30Days: days[29]?.balance ?? currentBalance,
      criticalDays,
      nextPayday,
      averageDailyExpense: Math.round(avgDailyExpense),
      daysUntilZero: daysUntilZero === -1 ? null : daysUntilZero,
      alerts,
      generatedAt: Date.now(),
    };
  }

  /**
   * Analiza patrones de gasto de los últimos 60 días
   */
  private static analyzePatterns(transactions: Transaction[]): RecurringPattern[] {
    const now = new Date();
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const cutoffStr = `${sixtyDaysAgo.getFullYear()}-${pad(sixtyDaysAgo.getMonth() + 1)}-${pad(sixtyDaysAgo.getDate())}`;

    const recent = transactions.filter(
      t => t.tipoTransaccion !== 'ingreso' && t.fecha >= cutoffStr
    );

    const byCat: Record<string, number> = {};
    recent.forEach(t => {
      byCat[t.categoria] = (byCat[t.categoria] || 0) + t.monto;
    });

    return Object.entries(byCat).map(([category, total60Days]) => ({
      category,
      averageMonthly: (total60Days / 60) * 30,
      frequency: 'monthly' as const,
      confidence: Math.min(1, recent.filter(t => t.categoria === category).length / 10),
    }));
  }

  /**
   * Estima el ingreso mensual de los últimos 2 meses
   */
  private static estimateMonthlyIncome(transactions: Transaction[]): number {
    const now = new Date();
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const cutoffStr = `${sixtyDaysAgo.getFullYear()}-${pad(sixtyDaysAgo.getMonth() + 1)}-${pad(sixtyDaysAgo.getDate())}`;

    const totalIncome = transactions
      .filter(t => t.tipoTransaccion === 'ingreso' && t.fecha >= cutoffStr)
      .reduce((s, t) => s + t.monto, 0);

    return totalIncome / 2; // promedio mensual de 2 meses
  }

  /**
   * Detecta el/los días de cobro habituales
   */
  private static detectPaydays(transactions: Transaction[]): number[] {
    const incomeDays = transactions
      .filter(t => t.tipoTransaccion === 'ingreso' && t.monto > 10000)
      .map(t => new Date(t.fecha + 'T00:00:00').getDate());

    if (incomeDays.length === 0) return [1, 15]; // fallback

    // Agrupar por día del mes y encontrar los más frecuentes
    const freq: Record<number, number> = {};
    incomeDays.forEach(d => { freq[d] = (freq[d] || 0) + 1; });

    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([day]) => parseInt(day));

    return sorted.length > 0 ? sorted : [1];
  }

  /**
   * Genera alertas inteligentes sobre el flujo de caja
   */
  private static generateAlerts(
    days: DayProjection[],
    currentBalance: number,
    monthlyIncome: number,
    avgDailyExpense: number,
  ): CashFlowAlert[] {
    const alerts: CashFlowAlert[] = [];
    const ars = (n: number) => '$\u00A0' + Math.round(n).toLocaleString('es-AR');

    // Tasa de quema alta
    if (monthlyIncome > 0) {
      const burnRate = (avgDailyExpense * 30) / monthlyIncome;
      if (burnRate > 0.9) {
        alerts.push({
          type: 'burn_rate_high',
          message: `Estás gastando el ${Math.round(burnRate * 100)}% de tu ingreso mensual. Quedan pocos márgenes de ahorro.`,
          severity: 'high',
        });
      }
    }

    // Saldo crítico en los próximos 15 días
    const criticalIn15 = days.slice(0, 15).find(d => d.isCritical);
    if (criticalIn15) {
      alerts.push({
        type: 'critical_balance',
        message: `Tu saldo podría bajar a ${ars(criticalIn15.balance)} el ${criticalIn15.dayLabel}. Considerá reducir gastos variables.`,
        date: criticalIn15.date,
        amount: criticalIn15.balance,
        severity: 'high',
      });
    }

    // Gasto grande programado
    const bigPayment = days
      .slice(0, 30)
      .flatMap(d => d.scheduledPayments)
      .filter(p => p.type === 'expense' && p.amount > (avgDailyExpense * 5))
      .sort((a, b) => b.amount - a.amount)[0];

    if (bigPayment) {
      alerts.push({
        type: 'large_expense_ahead',
        message: `${bigPayment.label} de ${ars(bigPayment.amount)} vence el ${bigPayment.dueDate}. Reservá los fondos.`,
        date: bigPayment.dueDate,
        amount: bigPayment.amount,
        severity: 'medium',
      });
    }

    // Ingreso esperado
    const nextIncome = days.slice(0, 30).find(d => d.isPayday && d.dailyIncome > 0);
    if (nextIncome) {
      alerts.push({
        type: 'income_expected',
        message: `Ingreso estimado de ${ars(nextIncome.dailyIncome)} el ${nextIncome.dayLabel}.`,
        date: nextIncome.date,
        amount: nextIncome.dailyIncome,
        severity: 'low',
      });
    }

    return alerts;
  }

  /**
   * Convierte pagos de vencimientos al formato ScheduledPayment
   */
  static vencimientosToScheduled(
    vencimientos: Array<{
      id: string; icon: string; title: string; cat: string;
      amount: number; dueDate: string; isPaid?: boolean;
    }>,
  ): ScheduledPayment[] {
    return vencimientos
      .filter(v => !v.isPaid)
      .map(v => ({
        id: v.id,
        label: v.title,
        amount: v.amount,
        dueDate: v.dueDate,
        type: 'expense' as const,
        category: v.cat,
        isRecurring: true,
        emoji: v.icon,
      }));
  }
}
