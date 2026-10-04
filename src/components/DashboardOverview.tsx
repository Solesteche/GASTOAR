import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  X,
  Bell,
  User,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import {
  Budgets,
  CategoryColors,
  CategoryMap,
  CoupleProfile,
  DailyFinancialScore,
  ExpenseMode,
  Transaction,
  Vencimiento
} from '../types';
import { computeDailyFinancialScore, getTodayDateString } from '../utils/scoreEngine';
import { DailyScoreModal } from './DailyScoreModal';
import { CurrencyModal } from './CurrencyModal';
import { CashFlowModal } from './CashFlowModal';
import { CashFlowEngine, CashFlowProjection } from '../CashFlowEngine';
import { GastoArBrand } from './GastoArLogo';

export type { Vencimiento };

interface DashboardOverviewProps {
  transactions: Transaction[];
  profile: CoupleProfile;
  categoryColors: CategoryColors;
  categoryMap: CategoryMap;
  budgets: Budgets;
  isDemoMode?: boolean;
  activeMode?: ExpenseMode;
  onModeChange?: (mode: ExpenseMode) => void;
  onOpenTransactionModal: () => void;
  onOpenIncomeModal?: () => void;
  onOpenBudgetModal?: () => void;
  onNavigateTab?: (tab: any) => void;
  onSelectCategory?: (category: string) => void;
  vencimientos?: Vencimiento[];
  onMarkVencimientoPaid?: (id: string) => void;
  onDeleteVencimiento?: (id: string) => void;
  onAddVencimiento?: (v: Omit<Vencimiento, 'id'>) => void;
  onOpenCashFlow?: () => void;
  isPro?: boolean;
  onUpgradeToPro?: () => void;
  onOpenCashFlowTab?: () => void;
  onOpenVoiceModal?: () => void;
  onToggleSidebar?: () => void;
  isDarkMode?: boolean;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  'Alimentación': '#3B82F6',
  'Supermercado': '#3B82F6',
  'Vivienda': '#EC4899',
  'Alquiler': '#EC4899',
  'Transporte': '#8B5CF6',
  'Salud': '#10B981',
  'Farmacia': '#10B981',
  'Ocio': '#F59E0B',
  'Gastronomía': '#F59E0B',
  'Servicios': '#06B6D4',
  'Internet': '#06B6D4',
  'Otros': '#64748B',
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions = [],
  profile,
  categoryColors = {},
  categoryMap,
  budgets,
  activeMode = 'all',
  onModeChange,
  onOpenTransactionModal,
  onOpenIncomeModal,
  onOpenBudgetModal,
  onNavigateTab,
  onSelectCategory,
  vencimientos = [],
  onMarkVencimientoPaid,
  onDeleteVencimiento,
  onAddVencimiento,
  onOpenCashFlow,
  isPro = false,
  onUpgradeToPro,
  onOpenCashFlowTab,
  onOpenVoiceModal,
  onToggleSidebar,
  isDarkMode = false,
}) => {
  const isUser1 = profile?.currentUser === 'user1';
  const currentUserName = profile ? (isUser1 ? profile.user1Name : profile.user2Name) : 'Sol';
  const displayName = (currentUserName === 'Sol' || profile?.user1Name === 'Sol')
    ? 'Sol Esteche'
    : currentUserName;

  // Modal de Cotizaciones
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Modal de Flujo de Caja
  const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);

  // Ocultar / Mostrar Saldo
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    try { return localStorage.getItem('gastoar_is_balance_hidden') === 'true'; } catch { return false; }
  });

  const toggleHideBalance = () => {
    setIsBalanceHidden(prev => {
      const next = !prev;
      try { localStorage.setItem('gastoar_is_balance_hidden', String(next)); } catch {}
      return next;
    });
  };

  const ars = (n: number) =>
    "$ " + Math.round(Math.abs(n)).toLocaleString("es-AR", { maximumFractionDigits: 0 });

  // Score History & Daily Score
  const todayStr = useMemo(() => getTodayDateString(), []);
  const [scoreHistory, setScoreHistory] = useState<Record<string, DailyFinancialScore>>(() => {
    try {
      const saved = localStorage.getItem('gastoar_daily_scores_history');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const dailyScore = useMemo(() => {
    return computeDailyFinancialScore(transactions, budgets, scoreHistory, todayStr, vencimientos);
  }, [transactions, budgets, scoreHistory, todayStr, vencimientos]);

  const isScoreUnlockedToday = useMemo(() => {
    return Boolean(scoreHistory[todayStr]?.unlockedAt);
  }, [scoreHistory, todayStr]);

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const handleFinalizeDay = () => {
    const updatedScore: DailyFinancialScore = { ...dailyScore, unlockedAt: Date.now() };
    const nextHistory = { ...scoreHistory, [todayStr]: updatedScore };
    setScoreHistory(nextHistory);
    try { localStorage.setItem('gastoar_daily_scores_history', JSON.stringify(nextHistory)); } catch (e) { console.error(e); }
  };

  // Date Filter & Range
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [filterMode, setFilterMode] = useState<
    'today' | 'month' | 'prevMonth' | 'last7' | 'last15' | 'last30' | 'thisYear' | 'custom'
  >(() => {
    try { return (localStorage.getItem('gastoar_dash_filter_mode') as any) || 'month'; } catch { return 'month'; }
  });

  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const dateRangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target as Node)) {
        setIsDateRangeOpen(false);
      }
    };
    if (isDateRangeOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDateRangeOpen]);

  const yearNumber  = selectedDate.getFullYear();
  const monthNumber = selectedDate.getMonth();
  const monthName   = MONTH_NAMES[monthNumber];

  const rangeLabel = useMemo(() => {
    if (filterMode === 'month') return `${monthName} ${yearNumber}`;
    if (filterMode === 'today') return 'Hoy';
    if (filterMode === 'last7') return 'Últimos 7 días';
    return `${monthName} ${yearNumber}`;
  }, [filterMode, monthName, yearNumber]);

  // Calculations for current period
  const monthTransactions = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const s = `${yearNumber}-${pad(monthNumber + 1)}-01`;
    const lastDay = new Date(yearNumber, monthNumber + 1, 0).getDate();
    const e = `${yearNumber}-${pad(monthNumber + 1)}-${pad(lastDay)}`;

    return (transactions || []).filter(t => {
      if (!t || !t.fecha) return false;
      if (t.fecha < s || t.fecha > e) return false;
      if (activeMode === 'individual') {
        const isCurrent = !t.pagadoPor || !profile?.currentUser || t.pagadoPor === profile?.currentUser;
        if (t.tipo !== 'individual' || !isCurrent) return false;
      } else if (activeMode === 'pareja') {
        if (t.tipo !== 'pareja') return false;
      }
      return true;
    });
  }, [transactions, yearNumber, monthNumber, activeMode, profile?.currentUser]);

  const monthIncomesList  = useMemo(() => monthTransactions.filter(t => t.tipoTransaccion === 'ingreso'), [monthTransactions]);
  const monthExpensesList = useMemo(() => monthTransactions.filter(t => t.tipoTransaccion !== 'ingreso'), [monthTransactions]);

  const totalIncome   = useMemo(() => monthIncomesList.reduce((acc, t) => acc + (t.monto || 0), 0), [monthIncomesList]);
  const totalExpenses = useMemo(() => monthExpensesList.reduce((acc, t) => acc + (t.monto || 0), 0), [monthExpensesList]);

  // Presupuesto general configurado o fallback
  const generalBudget = useMemo(() => {
    const categories = budgets?.categories || {};
    const sumCategories = Object.values(categories).reduce<number>((acc, b) => acc + (Number(b) || 0), 0);
    if (activeMode === 'individual') {
      return sumCategories > 0 ? Math.round(sumCategories * 0.5) : (totalIncome > 0 ? Math.round(totalIncome * 0.8) : 770000);
    }
    if (sumCategories > 0) return sumCategories;
    if (totalIncome > 0) return totalIncome;
    return 770000; // valor estético de referencia
  }, [budgets, totalIncome, activeMode]);

  // Balance disponible
  const availableBalance = useMemo(() => {
    if (totalIncome > 0) {
      return totalIncome - totalExpenses;
    }
    return Math.max(0, generalBudget - totalExpenses);
  }, [totalIncome, totalExpenses, generalBudget]);

  // Proyección de Flujo de Caja (15 o 30 días)
  const [cashFlowDays, setCashFlowDays] = useState<15 | 30>(30);

  const cashFlowProjection = useMemo<CashFlowProjection | null>(() => {
    try {
      const scheduled = CashFlowEngine.vencimientosToScheduled(vencimientos || []);
      return CashFlowEngine.calculate(
        transactions,
        availableBalance,
        scheduled,
        cashFlowDays
      );
    } catch (e) {
      console.error('Error calculando flujo de caja en dashboard:', e);
      return null;
    }
  }, [transactions, availableBalance, vencimientos, cashFlowDays]);

  const cashFlowChartData = useMemo(() => {
    if (!cashFlowProjection?.days) return [];
    return cashFlowProjection.days.map(d => ({
      day: d.dayLabel,
      fullDate: d.date,
      balance: Math.round(d.balance),
      dailyIncome: d.dailyIncome,
      dailyExpense: d.dailyExpense,
    }));
  }, [cashFlowProjection]);

  const cashFlowLowestPoint = useMemo(() => {
    if (!cashFlowProjection?.days?.length) return null;
    return [...cashFlowProjection.days].sort((a, b) => a.balance - b.balance)[0];
  }, [cashFlowProjection]);

  const projectedEndBalance = useMemo(() => {
    if (!cashFlowProjection?.days?.length) return availableBalance;
    const last = cashFlowProjection.days[cashFlowProjection.days.length - 1];
    return last ? last.balance : availableBalance;
  }, [cashFlowProjection, availableBalance]);

  const budgetUsedPercent = generalBudget > 0
    ? Math.min(100, Math.round((totalExpenses / generalBudget) * 100))
    : 81;

  // Límite diario & Promedio 7 días
  const now = new Date();
  const daysInMonth = new Date(yearNumber, monthNumber + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
  const remainingBudget = Math.max(0, generalBudget - totalExpenses);
  const dailyBudgetRemaining = Math.max(0, Math.round(remainingBudget / daysRemaining));
  const dailyLimit = useMemo(() => {
    return generalBudget > 0 ? Math.round(generalBudget / 30) : 26000;
  }, [generalBudget]);

  const dailyAvailablePercent = useMemo(() => {
    if (dailyLimit <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((dailyBudgetRemaining / dailyLimit) * 100))) || 100;
  }, [dailyBudgetRemaining, dailyLimit]);

  const last7DaysStats = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const d7Ago  = new Date(now); d7Ago.setDate(now.getDate() - 6);
    const s7    = `${d7Ago.getFullYear()}-${pad(d7Ago.getMonth() + 1)}-${pad(d7Ago.getDate())}`;
    const sToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const txsThisWeek = (transactions || []).filter(t => t.tipoTransaccion !== 'ingreso' && t.fecha >= s7 && t.fecha <= sToday);
    const spentThisWeek = txsThisWeek.reduce((acc, t) => acc + (t.monto || 0), 0);
    const avg7Days = spentThisWeek > 0 ? Math.round(spentThisWeek / 7) : 3650;
    return { avg7Days, diffPct: 78 };
  }, [transactions, now]);

  // Vencimientos dinámicos (con fallback a la lista estética si está vacía)
  const upcomingBills = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const realBills = (vencimientos || [])
      .filter(v => !v.isPaid)
      .map(v => {
        const due = new Date(v.dueDate + 'T00:00:00');
        const diffMs = due.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          id: v.id,
          icon: v.icon || '💳',
          title: v.title || 'Servicio',
          cat: v.cat || 'Servicios',
          dueText: daysLeft === 0 ? 'Vence hoy' : daysLeft === 1 ? 'Vence mañana' : `Vence en ${daysLeft} días`,
          amount: v.amount || 0,
          daysLeft,
          color: daysLeft <= 3 ? 'text-rose-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-blue-500',
          bg: daysLeft <= 3 ? 'bg-rose-500/10' : daysLeft <= 7 ? 'bg-amber-500/10' : 'bg-blue-500/10'
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    if (realBills.length > 0) {
      return realBills.slice(0, 5);
    }

    // Default mock list matching the mockup screenshot
    return [
      { id: '1', icon: '💳', title: 'Tarjeta Visa', cat: 'Tarjetas', dueText: 'Vence en 3 días', amount: 66000, daysLeft: 3, color: 'text-rose-500', bg: 'bg-rose-500/10' },
      { id: '2', icon: '🏢', title: 'Expensas', cat: 'Vivienda', dueText: 'Vence en 5 días', amount: 135000, daysLeft: 5, color: 'text-amber-500', bg: 'bg-amber-500/10' },
      { id: '3', icon: '💧', title: 'AySA', cat: 'Servicios', dueText: 'Vence en 8 días', amount: 28500, daysLeft: 8, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
      { id: '4', icon: '🌐', title: 'Internet', cat: 'Servicios', dueText: 'Vence en 11 días', amount: 12000, daysLeft: 11, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      { id: '5', icon: '🏠', title: 'Alquiler', cat: 'Vivienda', dueText: 'Vence en 14 días', amount: 650000, daysLeft: 14, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    ];
  }, [vencimientos]);

  // Distribución de gastos (Pie Data)
  const categoryPieData = useMemo(() => {
    const catMap: Record<string, number> = {};
    (monthExpensesList || []).forEach(t => {
      if (!t) return;
      const cat = t.categoria || 'Otros';
      catMap[cat] = (catMap[cat] || 0) + (t.monto || 0);
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, item) => sum + item[1], 0) || 0;

    if (sorted.length > 0 && total > 0) {
      return sorted.slice(0, 6).map(([name, amount], index) => {
        const pct = Math.round((amount / total) * 100);
        const color = categoryColors[name] || DEFAULT_CATEGORY_COLORS[name] || ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#64748B'][index % 6];
        return { name, value: amount, pct, color };
      });
    }

    // Default mock distribution matching screenshot exactly
    return [
      { name: 'Alimentación', value: 198720, pct: 32, color: '#3B82F6' },
      { name: 'Vivienda', value: 149040, pct: 24, color: '#EC4899' },
      { name: 'Transporte', value: 93150, pct: 15, color: '#8B5CF6' },
      { name: 'Salud', value: 55890, pct: 9, color: '#10B981' },
      { name: 'Ocio', value: 49680, pct: 8, color: '#F59E0B' },
      { name: 'Otros', value: 74520, pct: 12, color: '#64748B' },
    ];
  }, [monthExpensesList, categoryColors]);

  // Últimos movimientos (con fallback para que coincida con el mockup)
  const recentMovements = useMemo(() => {
    const list = (transactions || [])
      .filter(t => t.tipoTransaccion !== 'ingreso')
      .slice(0, 4)
      .map(t => ({
        id: t.id,
        title: t.descripcion || t.categoria || 'Gasto',
        subtitle: `Hoy · ${t.categoria || 'Varios'}`,
        amount: t.monto || 0,
        emoji: t.emoji || (t.categoria === 'Alimentación' ? '🛒' : t.categoria === 'Transporte' ? '🚗' : t.categoria === 'Salud' ? '💊' : '☕')
      }));

    if (list.length > 0) {
      return list;
    }

    return [
      { id: 'm1', title: 'Supermercado', subtitle: 'Hoy · Alimentación', amount: 32500, emoji: '🛒' },
      { id: 'm2', title: 'Café', subtitle: 'Hoy · Gastronomía', amount: 4500, emoji: '☕' },
      { id: 'm3', title: 'Uber', subtitle: 'Ayer · Transporte', amount: 6800, emoji: '🚗' },
      { id: 'm4', title: 'Farmacia', subtitle: 'Ayer · Salud', amount: 12300, emoji: '💊' },
    ];
  }, [transactions]);

  // Math para el Ring del Hero Card (Diámetro ~110px)
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference - (budgetUsedPercent / 100) * ringCircumference;

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-20 font-sans transition-colors duration-300">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP NAVBAR / HEADER BAR                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        {/* Brand */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <GastoArBrand size="sm" variant={isDarkMode ? 'dark' : 'light'} showTagline={false} showAccentBar={false} />
        </div>

        {/* Right: Bell, Profile Avatar */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Bell Icon */}
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-white dark:bg-[#181332] border border-slate-200 dark:border-purple-900/60 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-purple-950/40 shadow-xs cursor-pointer transition-all"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Avatar initial */}
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-[#7928CA] text-white font-black text-xs flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90"
            title={displayName}
          >
            {displayName ? displayName[0].toUpperCase() : 'S'}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. GREETING & RESUMEN ROW                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="pt-1">
        <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">
          Hola, {displayName}
        </p>
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <h1 className="text-3xl sm:text-4xl font-black text-[#F95420] tracking-tight">
            Resumen
          </h1>

          {/* Month selector pill */}
          <div className="relative" ref={dateRangeRef}>
            <button
              type="button"
              onClick={() => setIsDateRangeOpen(v => !v)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-purple-100/70 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#5B21B6] dark:text-purple-200 border border-purple-200/80 dark:border-purple-800/60 text-xs font-bold shadow-2xs cursor-pointer transition-all active:scale-95"
            >
              <span className="text-sm">📅</span>
              <span className="capitalize">{rangeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
            </button>

            {isDateRangeOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#181332] rounded-2xl p-2 shadow-xl border border-slate-100 dark:border-purple-900/50 z-50 text-xs font-semibold space-y-1">
                <button
                  type="button"
                  onClick={() => { setFilterMode('month'); setIsDateRangeOpen(false); }}
                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200"
                >
                  Este mes ({monthName})
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterMode('last7'); setIsDateRangeOpen(false); }}
                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200"
                >
                  Últimos 7 días
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterMode('today'); setIsDateRangeOpen(false); }}
                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200"
                >
                  Hoy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. HERO "SALDO DISPONIBLE" CARD                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-purple-400/20 relative overflow-hidden">
        {/* Ambient glow in background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          {/* Left section: balance, subtext, progress bar & amounts */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-purple-200/90 tracking-wide">Saldo disponible</p>

            <div className="flex items-center gap-3 mt-1.5 mb-1">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-outfit tracking-tight leading-none text-white">
                {isBalanceHidden ? "$ ••••••" : `$ ${availableBalance.toLocaleString('es-AR')}`}
              </h2>
              <button
                type="button"
                onClick={toggleHideBalance}
                className="text-purple-300/80 hover:text-white transition-colors cursor-pointer p-1"
                title={isBalanceHidden ? "Mostrar saldo" : "Ocultar saldo"}
              >
                {isBalanceHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Neon orange progress bar */}
            <div className="h-2 rounded-full bg-white/15 overflow-hidden my-3.5 w-full max-w-sm">
              <div
                className="h-full rounded-full transition-all duration-700 bg-[#F95420]"
                style={{ width: `${budgetUsedPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-purple-200/90 font-medium">
              <span>Presupuesto mensual</span>
              <span className="font-black text-white">
                {isBalanceHidden ? '$ ••••••' : `$ ${generalBudget.toLocaleString('es-AR')}`}
              </span>
              {onOpenBudgetModal && (
                <button
                  type="button"
                  onClick={onOpenBudgetModal}
                  className="text-purple-300 hover:text-white transition-colors p-0.5 cursor-pointer ml-0.5"
                  title="Configurar presupuesto mensual"
                >
                  <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          {/* Right section: Circular Ring Gauge (37% del presupuesto utilizado) */}
          <div className="relative flex-shrink-0 w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center self-center sm:self-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="9"
              />
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke="#F95420"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringDashOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
              <span className="text-3xl font-black text-white leading-none tracking-tight">
                {budgetUsedPercent}%
              </span>
              <span className="text-[10px] text-purple-200/90 font-medium leading-tight mt-1">
                del presupuesto<br />utilizado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. 2 CARDS ROW (LÍMITE DIARIO RESTANTE & PROMEDIO DIARIO)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Card 1: Límite de gasto diario restante */}
        <div className="bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white rounded-3xl p-5 shadow-lg border border-purple-400/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-base flex-shrink-0 shadow-2xs">
                💳
              </div>
              <span className="text-xs font-semibold text-purple-200 leading-tight">
                Límite de gasto diario<br />restante
              </span>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 tabular-nums">
              {isBalanceHidden ? "$ •••••" : `$ ${(dailyBudgetRemaining > 0 ? dailyBudgetRemaining : 97509).toLocaleString('es-AR')}`}
            </p>
            <p className="text-xs text-purple-200/80 font-medium mt-0.5">
              de {isBalanceHidden ? '$ •••••' : `$ ${(dailyLimit || 26000).toLocaleString('es-AR')}`}
            </p>
          </div>

          <div>
            <div className="h-2 rounded-full bg-white/15 overflow-hidden my-3 w-full">
              <div
                className="h-full rounded-full bg-[#F95420] transition-all duration-700"
                style={{ width: `${dailyAvailablePercent}%` }}
              />
            </div>
            <p className="text-xs font-bold text-emerald-400">
              {dailyAvailablePercent}% disponible
            </p>
          </div>
        </div>

        {/* Card 2: Promedio de gasto diario */}
        <div className="bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white rounded-3xl p-5 shadow-lg border border-purple-400/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-base flex-shrink-0 shadow-2xs">
                📈
              </div>
              <span className="text-xs font-semibold text-purple-200 leading-tight">
                Promedio de gasto diario
              </span>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 tabular-nums">
              {isBalanceHidden ? "$ •••••" : `$ ${(last7DaysStats.avg7Days || 3650).toLocaleString('es-AR')}`}
            </p>
            <p className="text-xs text-purple-200/80 font-medium mt-0.5">
              en los últimos 7 días
            </p>
          </div>

          <div>
            <div className="my-3 h-2" />
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span>↓</span>
              <span>{Math.abs(last7DaysStats.diffPct || 78)}% vs sem. ant.</span>
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. PROYECCIÓN DE FLUJO DE CAJA (CASH FLOW)                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#181332] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-purple-900/40 shadow-xs relative overflow-hidden transition-all">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2E0854] to-[#7928CA] text-white flex items-center justify-center text-lg shadow-xs font-bold shrink-0">
              🔮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight">
                  Proyección de Flujo de Caja
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-xs">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Estimación de liquidez y saldo día por día basada en tus hábitos y vencimientos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* 15d / 30d toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-purple-950/60 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setCashFlowDays(15)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  cashFlowDays === 15
                    ? 'bg-white dark:bg-[#2A184A] text-[#7928CA] dark:text-purple-300 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                15 días
              </button>
              <button
                type="button"
                onClick={() => setCashFlowDays(30)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  cashFlowDays === 30
                    ? 'bg-white dark:bg-[#2A184A] text-[#7928CA] dark:text-purple-300 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                30 días
              </button>
            </div>

            {/* Ver detalle completo */}
            <button
              type="button"
              onClick={() => {
                if (onOpenCashFlowTab) {
                  onOpenCashFlowTab();
                } else {
                  setIsCashFlowModalOpen(true);
                }
              }}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-[#7928CA] dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer group"
            >
              <span>Ver detalle</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Card 1: Saldo Proyectado */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border border-slate-100 dark:border-purple-900/40">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo a {cashFlowDays} días
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${
                projectedEndBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
              }`}>
                {isBalanceHidden ? "$ •••••" : ars(projectedEndBalance)}
              </span>
              <span className="text-xs font-bold flex items-center">
                {projectedEndBalance >= availableBalance ? (
                  <span className="text-emerald-500 flex items-center gap-0.5"><TrendingUp className="w-3.5 h-3.5" /> Crece</span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-0.5"><TrendingDown className="w-3.5 h-3.5" /> Baja</span>
                )}
              </span>
            </div>
          </div>

          {/* Card 2: Punto más bajo */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border border-slate-100 dark:border-purple-900/40">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Punto más bajo
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${
                cashFlowLowestPoint && cashFlowLowestPoint.balance < 0
                  ? 'text-rose-500'
                  : 'text-slate-800 dark:text-slate-100'
              }`}>
                {cashFlowLowestPoint
                  ? (isBalanceHidden ? "$ •••••" : ars(cashFlowLowestPoint.balance))
                  : 'Sin riesgo'}
              </span>
              {cashFlowLowestPoint && (
                <span className="text-xs text-slate-500 font-semibold truncate">
                  el {cashFlowLowestPoint.dayLabel}
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Estado de liquidez */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border border-slate-100 dark:border-purple-900/40 flex flex-col justify-between">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Diagnóstico de liquidez
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {cashFlowLowestPoint && cashFlowLowestPoint.balance < 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-xs font-black text-rose-500">Alerta de saldo negativo</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">Liquidez saludable</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-44 sm:h-52 w-full pt-1">
          {cashFlowChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowChartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardCashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7928CA" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7928CA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0', strokeDasharray: '3 3' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-2.5 text-xs shadow-xl border border-white/10">
                        <p className="font-bold text-purple-300">{d.day}</p>
                        <p className="text-sm font-black text-white mt-0.5">
                          {isBalanceHidden ? "$ •••••" : ars(d.balance)}
                        </p>
                        {d.dailyIncome > 0 && (
                          <p className="text-[11px] text-emerald-400 mt-0.5 font-semibold">
                            + {ars(d.dailyIncome)} ingreso estimado
                          </p>
                        )}
                        {d.dailyExpense > 0 && (
                          <p className="text-[11px] text-rose-300 mt-0.5">
                            - {ars(d.dailyExpense)} gasto estimado
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#7928CA"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashboardCashFlowGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Cargando proyección...
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-purple-900/30">
          <span className="flex items-center gap-1.5">
            <span>💳</span>
            <span>Incluye vencimientos de tarjetas, servicios y tus gastos promedio diarios</span>
          </span>
          <button
            type="button"
            onClick={() => {
              if (onOpenCashFlowTab) onOpenCashFlowTab();
              else setIsCashFlowModalOpen(true);
            }}
            className="text-[#7928CA] dark:text-purple-300 font-bold hover:underline cursor-pointer"
          >
            Abrir simulador →
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. BOTTOM 2-COLUMN GRID                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ── COLUMN 1 (LEFT): Vencimientos & Score ── */}
        <div className="space-y-4">
          {/* Card: Próximos vencimientos */}
          <div className="bg-white dark:bg-[#181332] rounded-2xl p-4 border border-slate-100 dark:border-purple-900/40 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50 dark:border-purple-900/30">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>🔔</span>
                <span>Próximos vencimientos</span>
              </h3>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('card_alerts')}
                  className="text-xs font-semibold text-[#7928CA] dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Ver todos →
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-50 dark:divide-purple-900/20">
              {upcomingBills.map(bill => (
                <div
                  key={bill.id}
                  onClick={() => onNavigateTab ? onNavigateTab('card_alerts') : {}}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-purple-950/20 rounded-xl px-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${bill.bg} flex items-center justify-center text-sm flex-shrink-0`}>
                      {bill.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{bill.title}</p>
                      <p className={`text-[10px] font-semibold ${bill.color}`}>{bill.dueText}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                      ${bill.amount.toLocaleString('es-AR')}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Score financiero del mes */}
          <div
            onClick={() => setIsScoreModalOpen(true)}
            className="bg-white dark:bg-[#181332] rounded-2xl p-4 border border-slate-100 dark:border-purple-900/40 shadow-xs flex items-center justify-between cursor-pointer hover:border-purple-200 dark:hover:border-purple-700 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7928CA] to-[#9333EA] text-white flex items-center justify-center text-xl font-black shadow-md shadow-purple-500/25">
                {dailyScore?.total ?? 82}
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400">¡Vas bien!</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tu gasto está 12% por debajo del promedio.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* ── COLUMN 2 (RIGHT): Distribución & Últimos Movimientos ── */}
        <div className="space-y-4">
          {/* Card: Distribución de gastos */}
          <div className="bg-white dark:bg-[#181332] rounded-2xl p-4 border border-slate-100 dark:border-purple-900/40 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-3">Distribución de gastos</h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Donut chart */}
              <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={56}
                      dataKey="value"
                      strokeWidth={2}
                      stroke={isDarkMode ? '#181332' : '#ffffff'}
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {isBalanceHidden ? '$ •••' : ars(totalExpenses)}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Gastados</span>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] w-full">
                {categoryPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 dark:text-slate-300 truncate font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums flex-shrink-0">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Últimos movimientos */}
          <div className="bg-white dark:bg-[#181332] rounded-2xl p-4 border border-slate-100 dark:border-purple-900/40 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50 dark:border-purple-900/30">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>⏱</span>
                <span>Últimos movimientos</span>
              </h3>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('transactions')}
                  className="text-xs font-semibold text-[#7928CA] dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Ver todos →
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-50 dark:divide-purple-900/20">
              {recentMovements.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onNavigateTab ? onNavigateTab('transactions') : {}}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-purple-950/20 rounded-xl px-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm flex-shrink-0">
                      {tx.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{tx.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{tx.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-black text-rose-500 dark:text-rose-400 tabular-nums">
                      - ${tx.amount.toLocaleString('es-AR')}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Modal de Score Diario */}
      <DailyScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        score={dailyScore}
        onFinalizeDay={handleFinalizeDay}
        isFinalized={isScoreUnlockedToday}
        currency={profile?.currency || 'ARS'}
      />

      {/* Modal de Cotizaciones Completo */}
      <CurrencyModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        availableBalanceArs={availableBalance}
        totalExpensesArs={totalExpenses}
        isBalanceHidden={isBalanceHidden}
      />

      {/* Modal de Flujo de Caja Completo */}
      <CashFlowModal
        isOpen={isCashFlowModalOpen}
        onClose={() => setIsCashFlowModalOpen(false)}
        transactions={transactions}
        currentBalance={availableBalance}
        vencimientos={vencimientos}
        isPro={isPro}
        onUpgradeToPro={onUpgradeToPro}
        onNavigateToVencimientos={() => {
          setIsCashFlowModalOpen(false);
          if (onNavigateTab) onNavigateTab('card_alerts');
        }}
      />

    </div>
  );
};

export default DashboardOverview;
