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
  CreditCard,
  Target,
  Users,
  ArrowRightLeft,
  X,
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
  Goal,
  Transaction,
  UserAccount,
  Vencimiento
} from '../types';
import { auth } from '../lib/firebase';
import { computeDailyFinancialScore, getTodayDateString } from '../utils/scoreEngine';
import { DailyScoreModal } from './DailyScoreModal';
import { CurrencyModal } from './CurrencyModal';
import { CashFlowModal } from './CashFlowModal';
import { BudgetCriticalAlertsModal } from './BudgetCriticalAlertsModal';
import { CashFlowEngine, CashFlowProjection } from '../CashFlowEngine';

export type { Vencimiento };

interface DashboardOverviewProps {
  transactions: Transaction[];
  profile: CoupleProfile;
  userAccount?: UserAccount | null;
  categoryColors: CategoryColors;
  categoryMap: CategoryMap;
  budgets: Budgets;
  goals?: Goal[];
  isDemoMode?: boolean;
  activeMode?: ExpenseMode;
  onModeChange?: (mode: ExpenseMode) => void;
  onOpenTransactionModal: (initialType?: 'gasto' | 'ingreso') => void;
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
  onOpenProfileModal?: () => void;
  onOpenSettlementModal?: () => void;
  onRestartTour?: () => void;
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

const getCategoryEmoji = (cat: string): string => {
  const c = (cat || '').toLowerCase();
  if (c.includes('aliment') || c.includes('comida') || c.includes('super')) return '🛒';
  if (c.includes('vivien') || c.includes('alquiler') || c.includes('casa')) return '🏠';
  if (c.includes('transp') || c.includes('auto') || c.includes('uber') || c.includes('nafta') || c.includes('sube')) return '🚗';
  if (c.includes('salud') || c.includes('farm') || c.includes('medic')) return '💊';
  if (c.includes('ocio') || c.includes('entre') || c.includes('salida') || c.includes('cine')) return '🎬';
  if (c.includes('servici') || c.includes('luz') || c.includes('gas') || c.includes('agua') || c.includes('inter')) return '💡';
  if (c.includes('educ') || c.includes('estudio') || c.includes('curso')) return '📚';
  if (c.includes('ropa') || c.includes('indum')) return '👕';
  if (c.includes('caf') || c.includes('resto') || c.includes('gastro')) return '☕';
  if (c.includes('tarjet')) return '💳';
  return '🏷️';
};

const formatDuePill = (dueDateStr?: string, daysLeft?: number) => {
  if (!dueDateStr) return `${daysLeft ?? 0} días`;
  try {
    const parts = dueDateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const shortMonths = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
      return `${day} ${shortMonths[monthIdx] || ''}`;
    }
  } catch {}
  return dueDateStr;
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions = [],
  profile,
  userAccount,
  categoryColors = {},
  categoryMap,
  budgets,
  goals = [],
  isDemoMode = false,
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
  onOpenProfileModal,
  onOpenSettlementModal,
  onRestartTour,
}) => {
  const isUser1 = profile?.currentUser === 'user1';
  const profileName = profile ? (isUser1 ? profile.user1Name : profile.user2Name) : '';

  const displayName = useMemo(() => {
    if (isDemoMode) {
      return (profileName && profileName !== 'Mi Usuario') ? profileName : 'Sol Esteche';
    }

    // 1. From authenticated userAccount
    if (userAccount?.name && userAccount.name.trim() && userAccount.name !== 'Mi Usuario') {
      return userAccount.name.trim();
    }
    // 2. From Firebase auth
    if (auth.currentUser?.displayName && auth.currentUser.displayName.trim() && auth.currentUser.displayName !== 'Mi Usuario') {
      return auth.currentUser.displayName.trim();
    }
    // 3. From profile if customized
    if (profileName && profileName.trim() && profileName !== 'Mi Usuario' && profileName !== 'Sol') {
      return profileName.trim();
    }
    // 4. From email prefix
    const email = userAccount?.email || auth.currentUser?.email;
    if (email) {
      const prefix = email.split('@')[0].replace(/[._-]/g, ' ').trim();
      if (prefix) {
        return prefix
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    }

    return profileName || 'Usuario';
  }, [isDemoMode, userAccount, profileName]);

  // Modal de Cotizaciones
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Modal de Flujo de Caja
  const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);

  // Modal de Alertas de Presupuesto
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

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
      return sumCategories > 0
        ? Math.round(sumCategories * 0.5)
        : (totalIncome > 0 ? Math.round(totalIncome * 0.8) : (isDemoMode ? 770000 : 0));
    }
    if (sumCategories > 0) return sumCategories;
    if (totalIncome > 0) return totalIncome;
    return isDemoMode ? 770000 : 0;
  }, [budgets, totalIncome, activeMode, isDemoMode]);

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
    : (isDemoMode ? 81 : 0);

  // Límite diario & Promedio 7 días
  const now = new Date();
  const daysInMonth = new Date(yearNumber, monthNumber + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
  const remainingBudget = Math.max(0, generalBudget - totalExpenses);
  const dailyBudgetRemaining = generalBudget > 0
    ? Math.max(0, Math.round(remainingBudget / daysRemaining))
    : (isDemoMode ? 26552 : 0);
  const dailyLimit = useMemo(() => {
    return generalBudget > 0 ? Math.round(generalBudget / 30) : (isDemoMode ? 26000 : 0);
  }, [generalBudget, isDemoMode]);

  const dailyAvailablePercent = useMemo(() => {
    if (dailyLimit <= 0) return isDemoMode ? 100 : 0;
    return Math.min(100, Math.max(0, Math.round((dailyBudgetRemaining / dailyLimit) * 100)));
  }, [dailyBudgetRemaining, dailyLimit, isDemoMode]);

  const last7DaysStats = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const d7Ago  = new Date(now); d7Ago.setDate(now.getDate() - 6);
    const s7    = `${d7Ago.getFullYear()}-${pad(d7Ago.getMonth() + 1)}-${pad(d7Ago.getDate())}`;
    const sToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const txsThisWeek = (transactions || []).filter(t => t.tipoTransaccion !== 'ingreso' && t.fecha >= s7 && t.fecha <= sToday);
    const spentThisWeek = txsThisWeek.reduce((acc, t) => acc + (t.monto || 0), 0);
    const avg7Days = spentThisWeek > 0
      ? Math.round(spentThisWeek / 7)
      : (isDemoMode ? 3650 : 0);
    return { avg7Days, diffPct: spentThisWeek > 0 ? 12 : (isDemoMode ? 78 : 0) };
  }, [transactions, now, isDemoMode]);

  // Umbral de alerta de presupuesto configurado (por defecto 80%)
  const alertThreshold = budgets?.alertThresholdPercent || 80;

  // Categorías que están en alerta de presupuesto (excedidas >= 100% o alcanzando el umbral >= alertThreshold%)
  const budgetAlertCategories = useMemo(() => {
    const userBudgetCats = budgets?.categories || {};
    const catSpent: Record<string, number> = {};

    (monthExpensesList || []).forEach(t => {
      if (!t || t.tipoTransaccion === 'ingreso') return;
      const cat = t.categoria || 'Otros';
      catSpent[cat] = (catSpent[cat] || 0) + (t.monto || 0);
    });

    const hasConfiguredBudgets = Object.keys(userBudgetCats).length > 0;

    if (hasConfiguredBudgets) {
      const list: Array<{
        name: string;
        spent: number;
        budget: number;
        pct: number;
        status: 'exceeded' | 'warning';
        overspent: number;
        color: string;
        emoji: string;
      }> = [];

      Object.entries(userBudgetCats).forEach(([cat, budgetVal]) => {
        const budget = Number(budgetVal) || 0;
        if (budget <= 0) return;
        const spent = catSpent[cat] || 0;
        const pct = Math.round((spent / budget) * 100);

        if (pct >= alertThreshold) {
          list.push({
            name: cat,
            spent,
            budget,
            pct,
            status: pct >= 100 ? 'exceeded' : 'warning',
            overspent: Math.max(0, spent - budget),
            color: categoryColors[cat] || DEFAULT_CATEGORY_COLORS[cat] || '#F95420',
            emoji: getCategoryEmoji(cat),
          });
        }
      });

      // Ordenar: primero las de mayor porcentaje consumido
      list.sort((a, b) => b.pct - a.pct);
      return list;
    }

    if (isDemoMode) {
      return [
        {
          name: 'Alimentación',
          spent: 198720,
          budget: 200000,
          pct: 99,
          status: 'warning' as const,
          overspent: 0,
          color: '#3B82F6',
          emoji: '🛒',
        },
        {
          name: 'Ocio',
          spent: 52000,
          budget: 45000,
          pct: 115,
          status: 'exceeded' as const,
          overspent: 7000,
          color: '#F59E0B',
          emoji: '🎬',
        }
      ];
    }

    return [];
  }, [budgets, monthExpensesList, alertThreshold, categoryColors, isDemoMode]);

  // Vencimientos dinámicos (con fallback idéntico al diseño de referencia)
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const realBills = (vencimientos || [])
      .filter(v => !v.isPaid)
      .map(v => {
        const due = new Date(v.dueDate + 'T00:00:00');
        const diffMs = due.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const duePill = formatDuePill(v.dueDate, daysLeft);
        return {
          id: v.id,
          icon: v.icon || '💳',
          title: v.title || 'Servicio',
          cat: v.cat || 'Servicios',
          dueText: daysLeft === 0 ? 'Vence hoy' : daysLeft === 1 ? 'Vence mañana' : (daysLeft < 0 ? `Vencido hace ${Math.abs(daysLeft)} días` : `Vence en ${daysLeft} días`),
          duePill,
          amount: v.amount || 0,
          daysLeft,
          color: daysLeft <= 3 ? 'text-rose-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-blue-500',
          bg: daysLeft <= 3 ? 'bg-amber-100 text-amber-700' : daysLeft <= 7 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    if (realBills.length > 0) {
      return realBills.slice(0, 5);
    }

    return [
      { id: '1', icon: '💳', title: 'Tarjeta Visa', cat: 'Tarjeta de crédito', dueText: 'Vence en 3 días', duePill: '28 sept', amount: 85000, daysLeft: 3, color: 'text-rose-500', bg: 'bg-amber-100 text-amber-700' },
      { id: '2', icon: '🏢', title: 'Expensas', cat: 'Hogar', dueText: 'Vence en 5 días', duePill: '30 sept', amount: 135000, daysLeft: 5, color: 'text-amber-500', bg: 'bg-blue-100 text-blue-700' },
      { id: '3', icon: '💧', title: 'AySA', cat: 'Servicios', dueText: 'Vence en 8 días', duePill: '2 oct', amount: 28500, daysLeft: 8, color: 'text-cyan-500', bg: 'bg-cyan-100 text-cyan-700' },
      { id: '4', icon: '🌐', title: 'Internet', cat: 'Servicios', dueText: 'Vence en 11 días', duePill: '4 oct', amount: 12000, daysLeft: 11, color: 'text-purple-500', bg: 'bg-purple-100 text-purple-700' },
      { id: '5', icon: '🏠', title: 'Alquiler', cat: 'Vivienda', dueText: 'Vence en 14 días', duePill: '9 oct', amount: 650000, daysLeft: 14, color: 'text-emerald-500', bg: 'bg-emerald-100 text-emerald-700' }
    ];
  }, [vencimientos, isDemoMode]);

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

    return [
      { name: 'Alimentación & Bebidas', value: 117000, pct: 100, color: '#3B82F6' },
    ];
  }, [monthExpensesList, categoryColors, isDemoMode]);

  // Últimos movimientos (con fallback idéntico al diseño de referencia)
  const recentMovements = useMemo(() => {
    const list = (transactions || [])
      .filter(t => t.tipoTransaccion !== 'ingreso')
      .slice(0, 4)
      .map(t => ({
        id: t.id,
        title: t.descripcion || t.concepto || t.categoria || 'Gasto',
        subtitle: `${t.fecha || 'Hoy'} · ${t.categoria || 'Varios'}`,
        amount: t.monto || 0,
        emoji: t.emoji || (t.categoria === 'Alimentación' ? '🛒' : t.categoria === 'Transporte' ? '🚗' : t.categoria === 'Salud' ? '💊' : '☕')
      }));

    if (list.length > 0) {
      return list;
    }

    return [
      { id: 'm1', title: 'División por mov. "gasté 117,000 en coto"', subtitle: '2026_09_18 · Alimentación & Bebidas', amount: 117000, emoji: '🛒' },
      { id: 'm2', title: 'Alimentación & Bebidas', subtitle: '2026_09_06 · Alimentación & Bebidas', amount: 20000, emoji: '🍔' },
      { id: 'm3', title: 'Farmacia & Salud', subtitle: '2026_09_02 · Salud', amount: 12300, emoji: '💊' },
    ];
  }, [transactions, isDemoMode]);

  // Math para el Ring del Hero Card (Diámetro ~110px)
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference - (budgetUsedPercent / 100) * ringCircumference;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-20 font-sans transition-colors duration-300">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* GREETING & RESUMEN ROW                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="pt-1">
        <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
          Hola, {displayName}
        </p>
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <h1 className="text-2xl sm:text-4xl font-black text-[#F95420] tracking-tight">
            Resumen
          </h1>

          {/* Month selector pill in the top margin on the same line as Resumen at the other end */}
          <div className="relative shrink-0" ref={dateRangeRef}>
            <button
              type="button"
              onClick={() => setIsDateRangeOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-100/70 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#5B21B6] dark:text-purple-200 border border-purple-200/80 dark:border-purple-800/60 text-xs font-bold shadow-2xs cursor-pointer transition-all active:scale-95"
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
      <div className="bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white rounded-3xl p-4.5 sm:p-6 shadow-xl border border-purple-400/20 relative overflow-hidden">
        {/* Ambient glow in background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3 sm:space-y-4">
          {/* Fila superior: Saldo a la izquierda & Círculo de porcentaje a la derecha (en la misma línea en mobile y desktop) */}
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Sección Saldo */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-purple-200/90 tracking-wide">Saldo disponible</p>

              <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 flex-wrap sm:flex-nowrap">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black font-outfit tracking-tight leading-none text-white break-words">
                  {isBalanceHidden ? "$ ••••••" : `$ ${availableBalance.toLocaleString('es-AR')}`}
                </h2>
                <button
                  type="button"
                  onClick={toggleHideBalance}
                  className="text-purple-300/80 hover:text-white transition-colors cursor-pointer p-1 shrink-0"
                  title={isBalanceHidden ? "Mostrar saldo" : "Ocultar saldo"}
                >
                  {isBalanceHidden ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Círculo de porcentaje afinado (en la misma línea que el saldo para versión móvil y desktop) */}
            <div className="relative flex-shrink-0 w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.14)"
                  strokeWidth="4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#F95420"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1 text-center">
                <span className="text-base xs:text-lg sm:text-2xl lg:text-3xl font-black text-white leading-none tracking-tight">
                  {budgetUsedPercent}%
                </span>
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-purple-200/90 font-medium leading-tight mt-0.5 sm:mt-1">
                  del presupuesto<br className="hidden xs:inline" /> utilizado
                </span>
              </div>
            </div>
          </div>

          {/* Barra de progreso afinada (delicada, moderna, h-1 para todas las versiones) */}
          <div>
            <div className="h-1 rounded-full bg-white/20 overflow-hidden mb-2.5 w-full max-w-sm sm:max-w-md shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-orange-400 to-[#F95420]"
                style={{ width: `${budgetUsedPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-purple-200/90 font-medium flex-wrap">
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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. 2 CARDS ROW (LÍMITE DIARIO RESTANTE & PROMEDIO DIARIO)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: Límite de gasto diario restante */}
        <div className="bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-purple-400/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-sm sm:text-base flex-shrink-0 shadow-2xs">
                💳
              </div>
              <span className="text-xs font-semibold text-purple-200 leading-tight">
                Límite de gasto diario<br />restante
              </span>
            </div>

            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-1.5 tabular-nums">
              {isBalanceHidden ? "$ •••••" : `$ ${dailyBudgetRemaining.toLocaleString('es-AR')}`}
            </p>
            <p className="text-xs text-purple-200/80 font-medium mt-0.5">
              {dailyLimit > 0
                ? `de ${isBalanceHidden ? '$ •••••' : `$ ${dailyLimit.toLocaleString('es-AR')}`}`
                : (isDemoMode ? 'de $ 26.000' : 'Sin límite establecido')}
            </p>
          </div>

          <div>
            {/* Barra afinada (delicada, moderna, h-1 para todas las versiones) */}
            <div className="h-1 rounded-full bg-white/20 overflow-hidden my-2.5 w-full shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-[#F95420] transition-all duration-700"
                style={{ width: `${dailyAvailablePercent}%` }}
              />
            </div>
            <p className="text-xs font-bold text-emerald-400">
              {dailyAvailablePercent}% disponible
            </p>
          </div>
        </div>

        {/* Card 2: Alerta de Categorías de Presupuesto (Exclusivo para Alertas) */}
        <div className="bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-purple-400/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-sm sm:text-base flex-shrink-0 shadow-2xs border ${
                  budgetAlertCategories.length > 0
                    ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                    : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                }`}>
                  {budgetAlertCategories.length > 0 ? '⚠️' : '🎯'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-purple-200 leading-tight block truncate">
                    Alerta de categorías
                  </span>
                  <span className="text-[10px] text-purple-300/70 block leading-tight">
                    Presupuesto por categoría
                  </span>
                </div>
              </div>

              {/* Badge interactivo / botón modal */}
              {budgetAlertCategories.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsAlertsModalOpen(true)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
                    budgetAlertCategories.some(c => c.status === 'exceeded')
                      ? 'bg-rose-500/25 text-rose-200 border-rose-400/40 hover:bg-rose-500/35'
                      : 'bg-amber-500/25 text-amber-200 border-amber-400/40 hover:bg-amber-500/35'
                  }`}
                  title="Ver detalle completo de alertas"
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>{budgetAlertCategories.length} en alerta</span>
                  <ChevronRight className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0 shadow-xs">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Al día</span>
                </span>
              )}
            </div>

            <div className="mt-1">
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight tabular-nums flex items-baseline gap-2">
                <span>
                  {budgetAlertCategories.length > 0
                    ? `${budgetAlertCategories.length} en alerta`
                    : '0 en alerta'}
                </span>
              </p>
              <p className="text-xs text-purple-200/80 font-medium mt-0.5">
                {budgetAlertCategories.length > 0
                  ? (budgetAlertCategories.filter(c => c.status === 'exceeded').length > 0
                      ? `${budgetAlertCategories.filter(c => c.status === 'exceeded').length} superó el 100% presupuestado`
                      : `Cerca del límite (umbral ${alertThreshold}%)`)
                  : `Todas las categorías bajo control (<${alertThreshold}%)`}
              </p>
            </div>
          </div>

          {/* Contenido de alertas con barras de progreso afinadas */}
          <div className="mt-3 pt-2.5 border-t border-purple-400/20">
            {budgetAlertCategories.length > 0 ? (
              <div className="space-y-2">
                {budgetAlertCategories.slice(0, 2).map((cat) => {
                  const isExceeded = cat.status === 'exceeded';
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate flex items-center gap-1.5 min-w-0">
                          <span className="text-xs">{cat.emoji}</span>
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                            isExceeded
                              ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                              : 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                          }`}>
                            {cat.pct}%
                          </span>
                          <span className="text-[11px] text-purple-200/80 font-medium">
                            {isBalanceHidden ? '$ •••' : `$ ${cat.spent.toLocaleString('es-AR')}`}
                          </span>
                        </div>
                      </div>

                      {/* Barra afinada individual de categoría en alerta (h-1 / 4px) */}
                      <div className="h-1 rounded-full bg-white/20 overflow-hidden w-full shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isExceeded
                              ? 'bg-gradient-to-r from-rose-500 to-red-600'
                              : 'bg-gradient-to-r from-amber-400 to-[#F95420]'
                          }`}
                          style={{ width: `${Math.min(100, cat.pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-1">
                  {budgetAlertCategories.length > 2 ? (
                    <span className="text-[10px] text-purple-300/80 font-medium">
                      +{budgetAlertCategories.length - 2} categoría{budgetAlertCategories.length - 2 > 1 ? 's' : ''} más
                    </span>
                  ) : <span />}
                  <button
                    type="button"
                    onClick={() => setIsAlertsModalOpen(true)}
                    className="text-[10px] font-bold text-purple-300 hover:text-white transition-colors cursor-pointer flex items-center gap-0.5 ml-auto"
                  >
                    Ver detalle completo
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Barra afinada de estado óptimo (h-1 / 4px) */}
                <div className="h-1 rounded-full bg-white/20 overflow-hidden my-2.5 w-full shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 w-full" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <p className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Presupuestos al día</span>
                  </p>
                  {onOpenBudgetModal && (
                    <button
                      type="button"
                      onClick={onOpenBudgetModal}
                      className="text-[10px] text-purple-300 hover:text-white font-medium cursor-pointer"
                    >
                      Ajustar límites
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. ACCIONES RÁPIDAS                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#181332] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-purple-900/40 shadow-xs transition-all">
        <h4 className="text-[11px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-3">
          Acciones rápidas
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Cuotas */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('installments')}
            className="bg-[#F8F5FF] hover:bg-[#F0EBFF] dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-100/80 dark:border-purple-900/50 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between h-20 sm:h-22 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-200/60 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
              Cuotas
            </span>
          </button>

          {/* Card 2: Metas */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('goals')}
            className="bg-[#FFFDF5] hover:bg-[#FFF8E6] dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border border-amber-100/80 dark:border-amber-900/50 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between h-20 sm:h-22 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-200/60 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
              Metas
            </span>
          </button>

          {/* Card 3: Balance Dúo */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('balance')}
            className="bg-[#FFF5F7] hover:bg-[#FFEBEF] dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border border-rose-100/80 dark:border-rose-900/50 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between h-20 sm:h-22 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-200/60 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
              Balance Dúo
            </span>
          </button>

          {/* Card 4: Liquidar */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('balance')}
            className="bg-[#F5F9FF] hover:bg-[#EBF3FF] dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border border-blue-100/80 dark:border-blue-900/50 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between h-20 sm:h-22 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-200/60 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
              Liquidar
            </span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. PRÓXIMOS VENCIMIENTOS                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#181332] rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-purple-900/40 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs">
              📅
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white tracking-tight">
              Próximos vencimientos
            </h3>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('card_alerts')}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>Ver todos</span>
              <span>→</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-purple-900/30">
          {upcomingBills.map(bill => (
            <div
              key={bill.id}
              onClick={() => onNavigateTab ? onNavigateTab('card_alerts') : {}}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-purple-950/20 rounded-xl px-1.5 transition-colors cursor-pointer"
            >
              {/* Left: Icon, Title & Category */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl ${bill.bg} flex items-center justify-center text-sm flex-shrink-0 shadow-2xs`}>
                  {bill.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {bill.title}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {bill.cat}
                  </p>
                </div>
              </div>

              {/* Right: Amount & Date Pill */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tabular-nums">
                  {isBalanceHidden ? "$ •••••" : `$ ${bill.amount.toLocaleString('es-AR')}`}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#7928CA] dark:text-purple-300 border border-purple-100/80 dark:border-purple-800/40 text-[11px] font-bold tracking-tight">
                  {bill.duePill}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 7. HERRAMIENTAS PRO                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#181332] rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-purple-900/40 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
            <span>Herramientas</span>
            <span className="text-[#7928CA] dark:text-purple-400">PRO</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('subscriptions') : setIsScoreModalOpen(true)}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>Ver más</span>
            <span>→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Card 1: Score Financiero */}
          <div
            onClick={() => setIsScoreModalOpen(true)}
            className="bg-[#FAF7FE] hover:bg-[#F4EEFD] dark:bg-purple-950/30 dark:hover:bg-purple-900/40 border border-purple-100/90 dark:border-purple-900/50 rounded-2xl p-4 transition-all cursor-pointer group flex items-center justify-between gap-3.5"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Ring icon */}
              <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(121, 40, 202, 0.15)" strokeWidth="3" />
                  <circle
                    cx="20"
                    cy="20"
                    r="15"
                    fill="none"
                    stroke="#7928CA"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 15}
                    strokeDashoffset={2 * Math.PI * 15 * (1 - (dailyScore?.total ?? 82) / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-[#7928CA] dark:text-purple-300">
                  {dailyScore?.total ?? 82}
                </div>
              </div>

              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  Score financiero
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 mt-0.5">
                  Conocé tu salud financiera, hábitos de gasto y recomendaciones.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-[#7928CA] text-white text-[9px] font-black tracking-wider uppercase shadow-2xs">
                PRO
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Flujo de caja */}
          <div
            onClick={() => setIsCashFlowModalOpen(true)}
            className="bg-[#FFFDF7] hover:bg-[#FFF9EA] dark:bg-amber-950/20 dark:hover:bg-amber-900/30 border border-amber-100/90 dark:border-amber-900/50 rounded-2xl p-4 transition-all cursor-pointer group flex items-center justify-between gap-3.5"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-lg shadow-2xs">
                📊
              </div>

              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  Flujo de caja
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 mt-0.5">
                  Proyectá tus ingresos y gastos, anticipá tu saldo futuro y evitá sorpresas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-[#7928CA] text-white text-[9px] font-black tracking-wider uppercase shadow-2xs">
                PRO
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 8. DISTRIBUCIÓN DE GASTOS & ÚLTIMOS MOVIMIENTOS                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Distribución de gastos */}
        <div className="bg-white dark:bg-[#181332] rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-purple-900/40 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>📊</span>
              <span>Distribución de gastos</span>
            </h3>
            {onOpenBudgetModal && (
              <button
                type="button"
                onClick={onOpenBudgetModal}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Ver detalle</span>
                <span>→</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 my-auto">
            {/* Donut chart */}
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
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
                  {isBalanceHidden ? '$ •••' : `$ ${totalExpenses.toLocaleString('es-AR')}`}
                </span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Total gastos</span>
              </div>
            </div>

            {/* Legend with percentages */}
            <div className="flex-1 space-y-2 text-xs w-full">
              {categoryPieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
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

        {/* Right Card: Últimos movimientos */}
        <div className="bg-white dark:bg-[#181332] rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-purple-900/40 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>🕒</span>
              <span>Últimos movimientos</span>
            </h3>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Ver todos</span>
                <span>→</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-purple-900/30">
            {recentMovements.slice(0, 3).map((tx) => (
              <div
                key={tx.id}
                onClick={() => onNavigateTab ? onNavigateTab('transactions') : {}}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-purple-950/20 rounded-xl px-1.5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm flex-shrink-0">
                    {tx.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{tx.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{tx.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-black text-rose-500 tabular-nums">
                    - ${tx.amount.toLocaleString('es-AR')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
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

      {/* Modal de Alertas Críticas de Presupuesto */}
      <BudgetCriticalAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        budgets={budgets}
        monthExpensesList={monthExpensesList}
        categoryColors={categoryColors}
        categoryMap={categoryMap}
        isBalanceHidden={isBalanceHidden}
        onOpenBudgetModal={onOpenBudgetModal}
        onNavigateTab={onNavigateTab}
      />

    </div>
  );
};

export default DashboardOverview;
