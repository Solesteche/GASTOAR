import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  X,
  User,
  CreditCard,
  Target,
  Heart,
  Scale,
  Clock,
  ShoppingCart,
  Fuel,
  Utensils,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  BellRing,
  Plus,
  PieChart as LucidePieChart,
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
  Vencimiento
} from '../types';
import { computeDailyFinancialScore, getTodayDateString } from '../utils/scoreEngine';
import { DailyScoreModal } from './DailyScoreModal';
import { CurrencyModal } from './CurrencyModal';
import { CashFlowModal } from './CashFlowModal';
import { RecentMovementsModal } from './RecentMovementsModal';
import { BudgetAlertsModal, CriticalBudgetItem, CriticalSubcategoryItem } from './BudgetAlertsModal';
import { GoalsMovementsModal } from './GoalsMovementsModal';
import { InstallmentsMovementsModal } from './InstallmentsMovementsModal';
import { ExpenseDistributionModal } from './ExpenseDistributionModal';
import { getInstallmentPlanDetails } from '../utils/installmentCalculations';
import { DEFAULT_BUDGETS, DEFAULT_GOALS } from '../data/initialData';
import { CashFlowEngine, CashFlowProjection } from '../CashFlowEngine';

export type { Vencimiento };

interface DashboardOverviewProps {
  transactions: Transaction[];
  profile: CoupleProfile;
  categoryColors: CategoryColors;
  categoryMap: CategoryMap;
  budgets: Budgets;
  goals?: Goal[];
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
  onOpenProfileModal?: () => void;
  onOpenSettlementModal?: () => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  'Alimentación & Bebidas': '#2563EB',
  'Alimentación': '#2563EB',
  'Supermercado': '#2563EB',
  'Alquiler': '#9333EA',
  'Vivienda': '#9333EA',
  'Expensas': '#7E22CE',
  'Servicios': '#F95420',
  'Internet': '#F95420',
  'Transporte & Movilidad': '#10B981',
  'Transporte': '#10B981',
  'Salud': '#EF4444',
  'Farmacia': '#EF4444',
  'Cuidado Personal': '#EC4899',
  'Educación & Formación': '#3B82F6',
  'Educación': '#3B82F6',
  'Entretenimiento': '#D946EF',
  'Entretenimiento & Ocio': '#D946EF',
  'Entretenimiento, Ocio & Salidas': '#D946EF',
  'Entretenimiento, Ocio & Suscripciones': '#D946EF',
  'Ocio': '#D946EF',
  'Indumentaria & Calzado': '#06B6D4',
  'Indumentaria': '#06B6D4',
  'Mascotas': '#F59E0B',
  'Tecnología, Electrónica & Bazar': '#6366F1',
  'Tecnología, Electro & Bazar': '#6366F1',
  'Tecnología': '#6366F1',
  'Suscripciones & Plataformas': '#A855F7',
  'Suscripciones y Plataformas': '#A855F7',
  'Suscripciones': '#A855F7',
  'Salud & Cuidado Personal': '#EF4444',
  'Otros': '#64748B',
};

const DEFAULT_CATEGORY_BG_COLORS: Record<string, string> = {
  'Alimentación & Bebidas': '#EFF6FF',
  'Alimentación': '#EFF6FF',
  'Supermercado': '#EFF6FF',
  'Alquiler': '#FAF5FF',
  'Vivienda': '#FAF5FF',
  'Expensas': '#F5F3FF',
  'Servicios': '#FFF4EF',
  'Internet': '#FFF4EF',
  'Transporte & Movilidad': '#ECFDF5',
  'Transporte': '#ECFDF5',
  'Salud': '#FEF2F2',
  'Farmacia': '#FEF2F2',
  'Cuidado Personal': '#FDF2F8',
  'Educación & Formación': '#EFF6FF',
  'Educación': '#EFF6FF',
  'Entretenimiento': '#FDF4FF',
  'Entretenimiento & Ocio': '#FDF4FF',
  'Entretenimiento, Ocio & Salidas': '#FDF4FF',
  'Entretenimiento, Ocio & Suscripciones': '#FDF4FF',
  'Ocio': '#FDF4FF',
  'Indumentaria & Calzado': '#ECFEFF',
  'Indumentaria': '#ECFEFF',
  'Mascotas': '#FFFBEB',
  'Tecnología, Electrónica & Bazar': '#EEF2FF',
  'Tecnología, Electro & Bazar': '#EEF2FF',
  'Tecnología': '#EEF2FF',
  'Suscripciones & Plataformas': '#FAF5FF',
  'Suscripciones y Plataformas': '#FAF5FF',
  'Suscripciones': '#FAF5FF',
  'Salud & Cuidado Personal': '#FEF2F2',
  'Otros': '#F1F5F9',
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions = [],
  profile,
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
}) => {
  const isUser1 = profile?.currentUser === 'user1';
  const currentUserName = profile ? (isUser1 ? profile.user1Name : profile.user2Name) : (isDemoMode ? 'Sol' : 'Mi Usuario');
  const displayName = isDemoMode
    ? ((currentUserName === 'Sol' || profile?.user1Name === 'Sol') ? 'Sol Esteche' : currentUserName)
    : currentUserName;

  // Modal de Cotizaciones
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Modal de Flujo de Caja
  const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
  const [isCashFlowExpanded, setIsCashFlowExpanded] = useState(false);

  // Modales de Metas de Ahorro y Gastos en Cuotas
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);

  // Modal de Distribución de Gastos (al hacer click en el porcentaje del presupuesto)
  const [isExpenseDistributionModalOpen, setIsExpenseDistributionModalOpen] = useState(false);

  // Modal de Últimos Movimientos (al hacer click en el porcentaje)
  const [isRecentMovementsModalOpen, setIsRecentMovementsModalOpen] = useState(false);

  // Modal de Alertas de Límites de Presupuesto (Estado Crítico)
  const [isBudgetAlertsModalOpen, setIsBudgetAlertsModalOpen] = useState(false);

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
  const [isProToolsModalOpen, setIsProToolsModalOpen] = useState(false);

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

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setFilterMode('month');
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setFilterMode('month');
  };

  const rangeLabel = useMemo(() => {
    if (filterMode === 'month') return `${monthName} ${yearNumber}`;
    if (filterMode === 'today') return 'Hoy';
    if (filterMode === 'last7') return 'Últimos 7 días';
    if (filterMode === 'last30') return 'Últimos 30 días';
    return `${monthName} ${yearNumber}`;
  }, [filterMode, monthName, yearNumber]);

  // Calculations for current period filtered by selected date & filterMode
  const monthTransactions = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    let startStr = '';
    let endStr = '';

    if (filterMode === 'today') {
      startStr = todayIso;
      endStr = todayIso;
    } else if (filterMode === 'last7') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 6);
      startStr = `${d7.getFullYear()}-${pad(d7.getMonth() + 1)}-${pad(d7.getDate())}`;
      endStr = todayIso;
    } else if (filterMode === 'last30') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 29);
      startStr = `${d30.getFullYear()}-${pad(d30.getMonth() + 1)}-${pad(d30.getDate())}`;
      endStr = todayIso;
    } else {
      // Month mode
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth();
      const lastDay = new Date(y, m + 1, 0).getDate();
      startStr = `${y}-${pad(m + 1)}-01`;
      endStr = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
    }

    return (transactions || []).filter(t => {
      if (!t || !t.fecha) return false;
      if (t.fecha < startStr || t.fecha > endStr) return false;
      if (activeMode === 'individual') {
        const isCurrent = !t.pagadoPor || !profile?.currentUser || t.pagadoPor === profile?.currentUser;
        if (t.tipo !== 'individual' || !isCurrent) return false;
      } else if (activeMode === 'pareja') {
        if (t.tipo !== 'pareja') return false;
      }
      return true;
    });
  }, [transactions, selectedDate, filterMode, activeMode, profile?.currentUser]);

  const monthIncomesList  = useMemo(() => monthTransactions.filter(t => t.tipoTransaccion === 'ingreso'), [monthTransactions]);
  const monthExpensesList = useMemo(() => monthTransactions.filter(t => t.tipoTransaccion !== 'ingreso'), [monthTransactions]);

  const totalIncome   = useMemo(() => monthIncomesList.reduce((acc, t) => acc + (t.monto || 0), 0), [monthIncomesList]);
  const totalExpenses = useMemo(() => monthExpensesList.reduce((acc, t) => acc + (t.monto || 0), 0), [monthExpensesList]);

  // Information summary for the active period
  const periodInfo = useMemo(() => {
    const today = new Date();
    let startDateFormatted = '';
    let endDateFormatted = '';

    if (filterMode === 'today') {
      startDateFormatted = `${today.getDate()} de ${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;
      endDateFormatted = startDateFormatted;
    } else if (filterMode === 'last7') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 6);
      startDateFormatted = `${d7.getDate()} de ${MONTH_NAMES[d7.getMonth()]}`;
      endDateFormatted = `${today.getDate()} de ${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;
    } else if (filterMode === 'last30') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 29);
      startDateFormatted = `${d30.getDate()} de ${MONTH_NAMES[d30.getMonth()]}`;
      endDateFormatted = `${today.getDate()} de ${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;
    } else {
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth();
      const lastDay = new Date(y, m + 1, 0).getDate();
      startDateFormatted = `1 de ${MONTH_NAMES[m]} ${y}`;
      endDateFormatted = `${lastDay} de ${MONTH_NAMES[m]} ${y}`;
    }

    return {
      rangeText: startDateFormatted === endDateFormatted ? startDateFormatted : `${startDateFormatted} al ${endDateFormatted}`,
      txCount: monthTransactions.length,
      expensesCount: monthExpensesList.length,
      incomesCount: monthIncomesList.length,
      totalExpenses,
      totalIncome,
      netBalance: totalIncome - totalExpenses,
    };
  }, [filterMode, selectedDate, monthTransactions, monthExpensesList, monthIncomesList, totalExpenses, totalIncome]);

  // Presupuesto general configurado o fallback
  const generalBudget = useMemo(() => {
    const categories = budgets?.categories || {};
    const sumCategories = Object.values(categories).reduce<number>((acc, b) => acc + (Number(b) || 0), 0);
    if (activeMode === 'individual') {
      return sumCategories > 0 ? Math.round(sumCategories * 0.5) : (totalIncome > 0 ? Math.round(totalIncome * 0.8) : (isDemoMode ? 770000 : 0));
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

  // ─── Metas de Ahorro y Gastos en Cuotas ──────────────────────────────────
  const effectiveGoals = useMemo(() => {
    if (goals && goals.length > 0) return goals;
    if (isDemoMode) {
      try {
        const saved = localStorage.getItem('control_gastos_goals_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
      return DEFAULT_GOALS;
    }
    return [];
  }, [goals, isDemoMode]);

  const goalsMetrics = useMemo(() => {
    let totalTarget = 0;
    let totalSaved = 0;
    let completedCount = 0;
    let activeCount = 0;
    let totalMovements = 0;

    effectiveGoals.forEach(g => {
      totalTarget += g.montoObjetivo || 0;
      totalSaved += g.montoActual || 0;
      if (g.completada || (g.montoActual >= g.montoObjetivo && g.montoObjetivo > 0)) {
        completedCount++;
      } else {
        activeCount++;
      }
      totalMovements += (g.historial || []).length;
    });

    const percent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

    return {
      totalTarget,
      totalSaved,
      completedCount,
      activeCount,
      percent,
      totalMovements,
    };
  }, [effectiveGoals]);

  const cuotasMetrics = useMemo(() => {
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const installmentTxs = transactions.filter(tx => 
      Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1))
    );

    let totalCommitted = 0;
    let monthlyThisMonth = 0;
    let totalPending = 0;
    let activePlansCount = 0;
    let completedPlansCount = 0;
    let endingThisMonthCount = 0;
    let endingMonthlyLiberated = 0;

    installmentTxs.forEach(tx => {
      const details = getInstallmentPlanDetails(tx);
      const totalCuotas = Math.max(1, tx.cuotasTotal || 1);
      const cuotaActual = Math.max(0, Math.min(totalCuotas, tx.cuotaActual || 1));
      const cuotaMonto = tx.montoCuota || (tx.monto / totalCuotas);
      const isCompleted = cuotaActual >= totalCuotas || details.isCompleted;

      totalCommitted += tx.monto || 0;

      if (!isCompleted) {
        activePlansCount++;
        monthlyThisMonth += cuotaMonto;
        totalPending += details.remainingAmount;
      } else {
        completedPlansCount++;
      }

      // Check if ending this month
      let isEndingThisMonth = false;
      if (details.schedule && details.schedule.length > 0) {
        const lastItem = details.schedule[details.schedule.length - 1];
        if (lastItem.monthKey === currentMonthKey) {
          isEndingThisMonth = true;
        }
      }
      if (!isEndingThisMonth && cuotaActual === totalCuotas && details.finalDueDate?.startsWith(currentMonthKey)) {
        isEndingThisMonth = true;
      }

      if (isEndingThisMonth) {
        endingThisMonthCount++;
        endingMonthlyLiberated += cuotaMonto;
      }
    });

    return {
      totalCommitted,
      monthlyThisMonth,
      totalPending,
      activePlansCount,
      completedPlansCount,
      endingThisMonthCount,
      endingMonthlyLiberated,
      totalInstallments: installmentTxs.length,
    };
  }, [transactions]);

  // ─── Alertas de Límites de Presupuesto (Parámetros del Usuario) ───────────
  // 1. Umbral de alerta definido por el usuario (default 80%)
  const alertThreshold = budgets?.alertThresholdPercent ?? 80;

  // 2. Diccionarios de presupuestos configurados por el usuario
  const userCatBudgets = useMemo(() => {
    if (budgets?.categories && Object.keys(budgets.categories).length > 0) {
      return budgets.categories;
    }
    return isDemoMode ? (DEFAULT_BUDGETS.categories || {}) : {};
  }, [budgets?.categories, isDemoMode]);

  const userSubBudgets = useMemo(() => {
    if (budgets?.subcategories && Object.keys(budgets.subcategories).length > 0) {
      return budgets.subcategories;
    }
    return isDemoMode ? (DEFAULT_BUDGETS.subcategories || {}) : {};
  }, [budgets?.subcategories, isDemoMode]);

  const modeMultiplier = activeMode === 'individual' ? 0.5 : 1.0;

  // 3. Gastos por categoría y por subcategoría en el período actual
  const { catSpentMap, subSpentMap } = useMemo<{
    catSpentMap: Record<string, number>;
    subSpentMap: Record<string, { total: number; parentCat: string }>;
  }>(() => {
    const cMap: Record<string, number> = {};
    const sMap: Record<string, { total: number; parentCat: string }> = {};

    const list = monthExpensesList.length > 0 ? monthExpensesList : (transactions || []).filter(t => t.tipoTransaccion !== 'ingreso');

    list.forEach(t => {
      if (!t) return;
      const cat = t.categoria || 'Otros';
      const amt = Number(t.monto) || 0;
      cMap[cat] = (cMap[cat] || 0) + amt;

      const sub = t.subcategoria || t.concepto;
      if (sub) {
        if (!sMap[sub]) {
          sMap[sub] = { total: 0, parentCat: cat };
        }
        sMap[sub].total += amt;
      }
    });

    return { catSpentMap: cMap, subSpentMap: sMap };
  }, [monthExpensesList, transactions]);

  // Helper de búsqueda con normalización de nombres
  const getBudgetForName = (name: string, budgetDict: Record<string, number>): number => {
    if (budgetDict[name] !== undefined) return Number(budgetDict[name]) || 0;
    const lower = name.toLowerCase().trim();
    for (const [k, v] of Object.entries(budgetDict)) {
      const kLower = k.toLowerCase().trim();
      if (kLower === lower || kLower.includes(lower) || lower.includes(kLower)) {
        return Number(v) || 0;
      }
    }
    return 0;
  };

  const getSpentForName = (name: string, spentDict: Record<string, number>): number => {
    if (spentDict[name] !== undefined) return spentDict[name];
    const lower = name.toLowerCase().trim();
    for (const [k, v] of Object.entries(spentDict)) {
      const kLower = k.toLowerCase().trim();
      if (kLower === lower || kLower.includes(lower) || lower.includes(kLower)) {
        return v;
      }
    }
    return 0;
  };

  // 4. Evaluar todas las categorías presupuestadas
  const allBudgetCategoryItems = useMemo<CriticalBudgetItem[]>(() => {
    const allCatNames = Array.from(new Set([
      ...Object.keys(userCatBudgets),
      ...Object.keys(catSpentMap),
    ]));

    const list: CriticalBudgetItem[] = [];

    allCatNames.forEach((catName) => {
      const rawBudget = getBudgetForName(catName, userCatBudgets);
      const budget = Math.round(rawBudget * modeMultiplier);
      const spent = getSpentForName(catName, catSpentMap);

      if (budget <= 0 && spent <= 0) return;

      const effectiveBudget = budget > 0 ? budget : 50000;
      const pct = effectiveBudget > 0 ? Math.round((spent / effectiveBudget) * 100) : 0;
      const isExceeded = pct >= 100;
      const isCritical = pct >= alertThreshold;
      const remaining = effectiveBudget - spent;

      const relevantSubs: CriticalSubcategoryItem[] = [];
      Object.keys(subSpentMap).forEach((subName) => {
        const data = subSpentMap[subName];
        if (!data) return;
        if (data.parentCat === catName || catName.includes(data.parentCat) || data.parentCat.includes(catName)) {
          const rawSubBudget = getBudgetForName(subName, userSubBudgets);
          const subBudget = rawSubBudget > 0 ? Math.round(rawSubBudget * modeMultiplier) : undefined;
          const subPct = subBudget ? Math.round((data.total / subBudget) * 100) : undefined;
          relevantSubs.push({
            name: subName,
            parentCategory: catName,
            spent: data.total,
            budget: subBudget,
            pct: subPct,
            remaining: subBudget ? subBudget - data.total : undefined,
            isCritical: subPct !== undefined ? subPct >= alertThreshold : false,
            isExceeded: subPct !== undefined ? subPct >= 100 : false,
          });
        }
      });

      list.push({
        id: `cat-${catName}`,
        name: catName,
        type: 'category',
        spent,
        budget: effectiveBudget,
        pct,
        remaining,
        color: categoryColors[catName] || DEFAULT_CATEGORY_COLORS[catName] || '#7928CA',
        isExceeded,
        isCritical,
        subcategories: relevantSubs,
      });
    });

    return list.sort((a, b) => b.pct - a.pct);
  }, [userCatBudgets, catSpentMap, subSpentMap, modeMultiplier, alertThreshold, categoryColors]);

  // 5. Evaluar subcategorías críticas independientes
  const criticalSubcategoriesList = useMemo<CriticalSubcategoryItem[]>(() => {
    const list: CriticalSubcategoryItem[] = [];
    Object.keys(subSpentMap).forEach((subName) => {
      const data = subSpentMap[subName];
      if (!data) return;
      const rawSubBudget = getBudgetForName(subName, userSubBudgets);
      if (rawSubBudget > 0) {
        const subBudget = Math.round(rawSubBudget * modeMultiplier);
        const pct = Math.round((data.total / subBudget) * 100);
        if (pct >= alertThreshold) {
          list.push({
            name: subName,
            parentCategory: data.parentCat,
            spent: data.total,
            budget: subBudget,
            pct,
            remaining: subBudget - data.total,
            isCritical: pct >= alertThreshold,
            isExceeded: pct >= 100,
          });
        }
      }
    });
    return list.sort((a, b) => (b.pct || 0) - (a.pct || 0));
  }, [subSpentMap, userSubBudgets, modeMultiplier, alertThreshold]);

  // Categorías críticas (>= alertThreshold definido por el usuario)
  const criticalCategoryItems = useMemo(() => {
    return allBudgetCategoryItems.filter(c => c.isCritical);
  }, [allBudgetCategoryItems]);

  const criticalCategoriesCount = criticalCategoryItems.length;
  const totalCriticalAlertsCount = criticalCategoriesCount + criticalSubcategoriesList.length;
  const hasCriticalBudgetAlert = totalCriticalAlertsCount > 0;

  const maxCriticalAlertPct = useMemo(() => {
    let max = 0;
    criticalCategoryItems.forEach(c => { if (c.pct > max) max = c.pct; });
    criticalSubcategoriesList.forEach(s => { if (s.pct > max) max = s.pct; });
    if (max > 0) return max;
    if (criticalCategoryItems.length > 0) return criticalCategoryItems[0].pct;
    return 0;
  }, [criticalCategoryItems, criticalSubcategoriesList]);

  const maxCriticalPct = maxCriticalAlertPct;

  // Vencimientos dinámicos (con diseño y datos exactos según captura de pantalla)
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nowMs = Date.now();

    const formatDueDateShort = (dateStr: string) => {
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
          const day = parseInt(parts[2], 10);
          const mIdx = parseInt(parts[1], 10) - 1;
          return `${day} ${months[mIdx] || ''}`;
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    };

    const getBillVisuals = (title: string, cat: string, customIcon?: string) => {
      const t = (title + ' ' + cat).toLowerCase();
      if (t.includes('luz') || t.includes('edenor') || t.includes('edesur') || t.includes('electricidad') || t.includes('energ')) {
        return {
          icon: '💡',
          iconBg: 'bg-[#FEF9E7] dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40',
          iconColor: 'text-[#F59E0B]'
        };
      }
      if (t.includes('expen') || t.includes('consorcio') || t.includes('alquiler') || t.includes('edificio') || t.includes('vivienda')) {
        return {
          icon: '🏢',
          iconBg: 'bg-[#EFF6FF] dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40',
          iconColor: 'text-[#3B82F6]'
        };
      }
      if (t.includes('internet') || t.includes('flow') || t.includes('fibertel') || t.includes('telecom') || t.includes('claro') || t.includes('movistar') || t.includes('wifi')) {
        return {
          icon: '🌐',
          iconBg: 'bg-[#F5F3FF] dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40',
          iconColor: 'text-[#8B5CF6]'
        };
      }
      if (t.includes('tarjeta') || t.includes('visa') || t.includes('master') || t.includes('amex') || t.includes('santander') || t.includes('bbva') || t.includes('galicia')) {
        return {
          icon: '💳',
          iconBg: 'bg-[#FEF2F2] dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40',
          iconColor: 'text-[#EF4444]'
        };
      }
      if (t.includes('agua') || t.includes('aysa')) {
        return {
          icon: '💧',
          iconBg: 'bg-[#EFF6FF] dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40',
          iconColor: 'text-[#06B6D4]'
        };
      }
      if (t.includes('gas') || t.includes('metrogas') || t.includes('naturgy')) {
        return {
          icon: '🔥',
          iconBg: 'bg-[#FFF7ED] dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/40',
          iconColor: 'text-[#EA580C]'
        };
      }
      return {
        icon: customIcon || '💳',
        iconBg: 'bg-[#F5F3FF] dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40',
        iconColor: 'text-[#7C3AED]'
      };
    };

    const getSemanticPill = (title: string, daysLeft: number) => {
      const t = title.toLowerCase();
      // Rojo para Tarjeta Visa (2 días) / <= 2 días
      if (t.includes('visa') || t.includes('tarjeta') || daysLeft <= 2) {
        return {
          urgency: 'danger' as const,
          semanticBadgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/90 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
          dotClass: 'bg-rose-500 animate-pulse',
          relativeDaysLabel: daysLeft <= 0 ? 'Hoy' : daysLeft === 1 ? '1 día' : `${daysLeft} días`,
          urgencyName: 'Urgente'
        };
      }
      // Naranja para Expensas (7 días) / 3 a 7 días
      if (t.includes('expen') || (daysLeft > 2 && daysLeft <= 7)) {
        return {
          urgency: 'warning' as const,
          semanticBadgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
          dotClass: 'bg-amber-500',
          relativeDaysLabel: `${daysLeft} días`,
          urgencyName: 'Próximo'
        };
      }
      // Verde para Internet (15 días) / > 7 días
      return {
        urgency: 'normal' as const,
        semanticBadgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
        dotClass: 'bg-emerald-500',
        relativeDaysLabel: `${daysLeft} días`,
        urgencyName: 'A tiempo'
      };
    };

    const realBills = (vencimientos || [])
      .filter(v => !v.isPaid)
      .map(v => {
        const dueEnd = new Date(v.dueDate + 'T23:59:59');
        const diffMs = dueEnd.getTime() - nowMs;
        const hoursLeft = diffMs / (1000 * 60 * 60);
        const daysLeft = Math.ceil((new Date(v.dueDate + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isUnder48Hours = hoursLeft <= 48 && hoursLeft >= -24;
        const visuals = getBillVisuals(v.title, v.cat, v.icon);
        const semantic = getSemanticPill(v.title || '', daysLeft);

        return {
          id: v.id,
          icon: visuals.icon,
          iconBg: visuals.iconBg,
          iconColor: visuals.iconColor,
          title: v.title || 'Servicio',
          subtitle: v.notes || v.cat || 'Servicio',
          dueDateLabel: formatDueDateShort(v.dueDate),
          amount: v.amount || 0,
          daysLeft,
          hoursLeft,
          isUnder48Hours,
          semanticBadgeClass: semantic.semanticBadgeClass,
          dotClass: semantic.dotClass,
          relativeDaysLabel: semantic.relativeDaysLabel,
          urgencyName: semantic.urgencyName,
          urgency: semantic.urgency
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    if (realBills.length > 0) {
      return realBills.slice(0, 5);
    }

    if (!isDemoMode) {
      return [];
    }

    // Default mock list with explicit semantic urgency:
    // 1. Tarjeta Visa (2 días) - Rojo
    // 2. Expensas (7 días) - Naranja
    // 3. Internet (15 días) - Verde
    // 4. Alquiler (22 días) - Verde
    const fallbackList = [
      {
        id: '1',
        icon: '💳',
        title: 'Tarjeta Visa',
        subtitle: 'Santander Río',
        cat: 'Tarjetas',
        dueDateLabel: '2 días',
        amount: 85000,
        daysLeft: 2,
        hoursLeft: 48,
        isUnder48Hours: true,
        iconBg: 'bg-[#FEF2F2] dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40',
        iconColor: 'text-[#EF4444]'
      },
      {
        id: '2',
        icon: '🏢',
        title: 'Expensas',
        subtitle: 'Consorcio',
        cat: 'Vivienda',
        dueDateLabel: '7 días',
        amount: 135000,
        daysLeft: 7,
        hoursLeft: 168,
        isUnder48Hours: false,
        iconBg: 'bg-[#EFF6FF] dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40',
        iconColor: 'text-[#3B82F6]'
      },
      {
        id: '3',
        icon: '🌐',
        title: 'Internet',
        subtitle: 'Personal Flow Fibra',
        cat: 'Servicios',
        dueDateLabel: '15 días',
        amount: 12000,
        daysLeft: 15,
        hoursLeft: 360,
        isUnder48Hours: false,
        iconBg: 'bg-[#F5F3FF] dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40',
        iconColor: 'text-[#8B5CF6]'
      },
      {
        id: '4',
        icon: '🏠',
        title: 'Alquiler',
        subtitle: 'Inmobiliaria',
        cat: 'Vivienda',
        dueDateLabel: '22 días',
        amount: 650000,
        daysLeft: 22,
        hoursLeft: 528,
        isUnder48Hours: false,
        iconBg: 'bg-[#F5EEFF] dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40',
        iconColor: 'text-[#7C3AED]'
      }
    ];

    return fallbackList.map(item => {
      const semantic = getSemanticPill(item.title, item.daysLeft);
      return {
        ...item,
        semanticBadgeClass: semantic.semanticBadgeClass,
        dotClass: semantic.dotClass,
        relativeDaysLabel: semantic.relativeDaysLabel,
        urgencyName: semantic.urgencyName,
        urgency: semantic.urgency
      };
    });
  }, [vencimientos, isDemoMode]);

  // Distribución de gastos (Pie Data) con paleta y proporciones de la imagen
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
      const palette = ['#7C3AED', '#F97316', '#60A5FA', '#818CF8', '#BAE6FD'];
      return sorted.slice(0, 5).map(([name, amount], index) => {
        const pct = Math.round((amount / total) * 100);
        const color = categoryColors[name] || DEFAULT_CATEGORY_COLORS[name] || palette[index % palette.length];
        return { name, value: amount, pct, color };
      });
    }

    if (!isDemoMode) {
      return [];
    }

    // Default mock distribution matching screenshot exactly for demo mode:
    return [
      { name: 'Vivienda', value: 64000, pct: 34, color: '#7C3AED' },
      { name: 'Alimentación', value: 52000, pct: 28, color: '#F97316' },
      { name: 'Transporte', value: 28000, pct: 15, color: '#60A5FA' },
      { name: 'Servicios', value: 22000, pct: 12, color: '#818CF8' },
      { name: 'Otros', value: 21000, pct: 11, color: '#BAE6FD' },
    ];
  }, [monthExpensesList, categoryColors, isDemoMode]);

  const displayTotalExpenses = useMemo(() => {
    if (monthExpensesList && monthExpensesList.length > 0 && totalExpenses > 0) {
      return totalExpenses;
    }
    return isDemoMode ? 187000 : 0;
  }, [monthExpensesList, totalExpenses, isDemoMode]);

  // Visuales para últimos movimientos
  const getMovementVisuals = (categoria?: string, title?: string) => {
    const text = `${categoria || ''} ${title || ''}`.toLowerCase();
    if (
      text.includes('combustible') ||
      text.includes('nafta') ||
      text.includes('ypf') ||
      text.includes('shell') ||
      text.includes('axion') ||
      text.includes('estacion') ||
      text.includes('estación')
    ) {
      return {
        icon: <Fuel className="w-5 h-5 text-[#EA580C]" />,
        iconBg: 'bg-[#FFF7ED] dark:bg-amber-950/40',
        defaultTitle: 'Combustible',
      };
    }
    if (
      text.includes('restaurante') ||
      text.includes('cafe') ||
      text.includes('café') ||
      text.includes('bar') ||
      text.includes('gastronom') ||
      text.includes('cena') ||
      text.includes('almuerzo') ||
      text.includes('pizza') ||
      text.includes('hamburguesa')
    ) {
      return {
        icon: <Utensils className="w-5 h-5 text-[#E11D48]" />,
        iconBg: 'bg-[#FFF1F2] dark:bg-rose-950/40',
        defaultTitle: 'Restaurante',
      };
    }
    if (
      text.includes('transferencia') ||
      text.includes('transfer') ||
      text.includes('envio') ||
      text.includes('envío') ||
      text.includes('servicio') ||
      text.includes('expensas')
    ) {
      return {
        icon: <ArrowLeftRight className="w-5 h-5 text-[#7C3AED]" />,
        iconBg: 'bg-[#F5F3FF] dark:bg-purple-950/40',
        defaultTitle: 'Transferencia',
      };
    }
    // Default Supermercado / Shopping
    return {
      icon: <ShoppingCart className="w-5 h-5 text-[#4F46E5]" />,
      iconBg: 'bg-[#F0F2FE] dark:bg-indigo-950/40',
      defaultTitle: 'Supermercado',
    };
  };

  // Últimos movimientos (con fallback exacto al diseño de la imagen)
  const recentMovements = useMemo(() => {
    const list = (monthExpensesList.length > 0 ? monthExpensesList : (transactions || []).filter(t => t.tipoTransaccion !== 'ingreso'))
      .slice(0, 4)
      .map(t => {
        const visuals = getMovementVisuals(t.categoria, t.descripcion);
        let timeLabel = 'Hoy, 12:34';
        const todayStr = getTodayDateString();
        if (t.fecha === todayStr) {
          timeLabel = `Hoy, ${(t as any).hora || '12:34'}`;
        } else if (t.fecha) {
          const d = new Date(t.fecha + 'T00:00:00');
          const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
          timeLabel = `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
        }

        return {
          id: t.id,
          title: t.descripcion || visuals.defaultTitle,
          subtitle: timeLabel,
          amount: Math.abs(t.monto || 0),
          isPositive: t.tipoTransaccion === 'ingreso',
          icon: visuals.icon,
          iconBg: visuals.iconBg,
        };
      });

    if (list.length > 0) {
      return list;
    }

    if (!isDemoMode) {
      return [];
    }

    // Default mock matching image screenshot exactly for demo mode:
    return [
      {
        id: 'm1',
        title: 'Supermercado',
        subtitle: 'Hoy, 12:34',
        amount: 27500,
        isPositive: false,
        icon: <ShoppingCart className="w-5 h-5 text-[#4F46E5]" />,
        iconBg: 'bg-[#F0F2FE] dark:bg-indigo-950/40',
      },
      {
        id: 'm2',
        title: 'Combustible',
        subtitle: 'Ayer, 18:20',
        amount: 42000,
        isPositive: false,
        icon: <Fuel className="w-5 h-5 text-[#EA580C]" />,
        iconBg: 'bg-[#FFF7ED] dark:bg-amber-950/40',
      },
      {
        id: 'm3',
        title: 'Restaurante',
        subtitle: 'Ayer, 13:15',
        amount: 18200,
        isPositive: false,
        icon: <Utensils className="w-5 h-5 text-[#E11D48]" />,
        iconBg: 'bg-[#FFF1F2] dark:bg-rose-950/40',
      },
      {
        id: 'm4',
        title: 'Transferencia',
        subtitle: '25 sep, 2026',
        amount: 65000,
        isPositive: false,
        icon: <ArrowLeftRight className="w-5 h-5 text-[#7C3AED]" />,
        iconBg: 'bg-[#F5F3FF] dark:bg-purple-950/40',
      },
    ];
  }, [monthExpensesList, transactions, isDemoMode]);

  // Math para el Ring del Hero Card (Diámetro 72px)
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference - (budgetUsedPercent / 100) * ringCircumference;

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-20 font-sans transition-colors duration-300">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* GREETING & RESUMEN ROW WITH EXPANDABLE DATE INFO                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="pt-2">
        <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">
          Hola,{' '}
          <button
            type="button"
            onClick={() => {
              if (onOpenProfileModal) {
                onOpenProfileModal();
              } else if (onNavigateTab) {
                onNavigateTab('profile');
              }
            }}
            className="hover:underline hover:text-[#7928CA] dark:hover:text-purple-300 transition-colors cursor-pointer font-bold inline-flex items-center gap-1 group text-left"
            title="Ver mi perfil"
          >
            <span>{displayName}</span>
          </button>
        </p>
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <h1 className="text-3xl sm:text-4xl font-black text-[#F95420] tracking-tight">
            Resumen
          </h1>

          {/* Month selector pill & expandable date details */}
          <div className="relative" ref={dateRangeRef}>
            <button
              type="button"
              onClick={() => setIsDateRangeOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-purple-100/80 hover:bg-purple-200/80 dark:bg-purple-950/70 dark:hover:bg-purple-900/70 text-[#5B21B6] dark:text-purple-200 border border-purple-200 dark:border-purple-800/80 text-xs font-bold shadow-2xs cursor-pointer transition-all active:scale-95"
              aria-expanded={isDateRangeOpen}
              title="Desplegar para cambiar fecha y ver información del período"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
              <span className="capitalize">{rangeLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-purple-600 dark:text-purple-300 transition-transform duration-200 ${isDateRangeOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel when deployed */}
            {isDateRangeOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white dark:bg-[#150d2a] rounded-3xl p-4 shadow-2xl border border-purple-100 dark:border-purple-900/60 z-50 text-xs space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header: Month Navigator */}
                <div className="flex items-center justify-between bg-purple-50/70 dark:bg-purple-950/40 p-2 rounded-2xl border border-purple-100/80 dark:border-purple-900/50">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl hover:bg-purple-200/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="text-center font-black text-slate-800 dark:text-white capitalize text-sm">
                    {monthName} {yearNumber}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl hover:bg-purple-200/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets Pills */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Períodos rápidos
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setSelectedDate(new Date(now.getFullYear(), now.getMonth(), 1));
                        setFilterMode('month');
                      }}
                      className={`px-2 py-1.5 rounded-xl font-bold text-center transition-all cursor-pointer ${
                        filterMode === 'month' && selectedDate.getMonth() === (new Date()).getMonth() && selectedDate.getFullYear() === (new Date()).getFullYear()
                          ? 'bg-[#7928CA] text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-purple-950/30 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/60'
                      }`}
                    >
                      Este mes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setSelectedDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
                        setFilterMode('month');
                      }}
                      className="px-2 py-1.5 rounded-xl font-bold text-center bg-slate-50 dark:bg-purple-950/30 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-all cursor-pointer"
                    >
                      Mes anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('today')}
                      className={`px-2 py-1.5 rounded-xl font-bold text-center transition-all cursor-pointer ${
                        filterMode === 'today'
                          ? 'bg-[#7928CA] text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-purple-950/30 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/60'
                      }`}
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('last7')}
                      className={`px-2 py-1.5 rounded-xl font-bold text-center transition-all cursor-pointer ${
                        filterMode === 'last7'
                          ? 'bg-[#7928CA] text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-purple-950/30 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/60'
                      }`}
                    >
                      7 días
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('last30')}
                      className={`px-2 py-1.5 rounded-xl font-bold text-center transition-all cursor-pointer ${
                        filterMode === 'last30'
                          ? 'bg-[#7928CA] text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-purple-950/30 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/60'
                      }`}
                    >
                      30 días
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setSelectedDate(new Date(now.getFullYear(), now.getMonth(), 1));
                        setFilterMode('month');
                        setIsDateRangeOpen(false);
                      }}
                      className="px-2 py-1.5 rounded-xl font-bold text-center bg-purple-50 dark:bg-purple-900/30 text-[#7928CA] dark:text-purple-300 hover:bg-purple-100 transition-all cursor-pointer"
                    >
                      Restablecer
                    </button>
                  </div>
                </div>

                {/* Period Detailed Information Card ("ver esa información") */}
                <div className="bg-gradient-to-br from-purple-50/80 via-slate-50 to-orange-50/40 dark:from-purple-950/50 dark:via-[#191033] dark:to-orange-950/20 p-3 rounded-2xl border border-purple-100/90 dark:border-purple-900/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <span>📊</span> Información del período
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {periodInfo.txCount} {periodInfo.txCount === 1 ? 'movimiento' : 'movimientos'}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                    {periodInfo.rangeText}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-100/60 dark:border-purple-900/40">
                    <div className="bg-white/80 dark:bg-purple-950/60 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Gastos</div>
                      <div className="text-xs font-black text-rose-600 dark:text-rose-400">
                        {ars(periodInfo.totalExpenses)}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {periodInfo.expensesCount} operaciones
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-purple-950/60 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Ingresos</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {ars(periodInfo.totalIncome)}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {periodInfo.incomesCount} operaciones
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2 py-1.5 bg-white/90 dark:bg-purple-950/80 rounded-xl border border-purple-100 dark:border-purple-900/40">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Balance neto</span>
                    <span className={`text-xs font-black ${periodInfo.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {periodInfo.netBalance >= 0 ? '+' : '-'}{ars(Math.abs(periodInfo.netBalance))}
                    </span>
                  </div>
                </div>

                {/* Footer close button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDateRangeOpen(false)}
                    className="px-4 py-1.5 rounded-xl bg-[#7928CA] hover:bg-[#6821ad] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Ver en pantalla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. HERO "SALDO DISPONIBLE" CARD CON CÍRCULO DE PORCENTAJE           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D3FEA 55%, #7C3AED 100%)' }}
        className="text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-purple-300/30 relative overflow-hidden"
      >
        {/* Ambient glow in background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 sm:gap-6">
          {/* Top Row: Saldo on left & Porcentaje de Presupuesto circular ring on right */}
          <div className="flex flex-row items-center justify-between gap-4 sm:gap-6">
            {/* Left section: balance (32px dominando el espacio) */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs sm:text-sm font-medium text-white/80 tracking-wide">Saldo disponible</span>
                <button
                  type="button"
                  onClick={toggleHideBalance}
                  className="text-white/70 hover:text-white transition-colors cursor-pointer p-0.5 shrink-0"
                  title={isBalanceHidden ? "Mostrar saldo" : "Ocultar saldo"}
                >
                  {isBalanceHidden ? <EyeOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <h2 className="text-[32px] font-black font-outfit tracking-tight leading-none text-white truncate">
                  {isBalanceHidden ? "$ ••••••" : `$ ${availableBalance.toLocaleString('es-AR')}`}
                </h2>
              </div>
            </div>

            {/* Right section: Circular Ring Gauge reducido a 72px con solo el porcentaje adentro - CLICKABLE -> DISTRIBUCIÓN */}
            <button
              type="button"
              onClick={() => setIsExpenseDistributionModalOpen(true)}
              className="relative shrink-0 w-[72px] h-[72px] flex items-center justify-center cursor-pointer group transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none rounded-full"
              title="Toca para ver la distribución de gastos"
              aria-label="Ver distribución de gastos del presupuesto"
            >
              <svg className="w-full h-full -rotate-90 filter drop-shadow-xs" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#F95420"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  className="transition-all duration-1000 ease-out group-hover:stroke-[#ff6938]"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-base sm:text-[17px] font-black text-white leading-none tracking-tight tabular-nums group-hover:text-orange-200 transition-colors">
                  {budgetUsedPercent}%
                </span>
              </div>
            </button>
          </div>

          {/* Bottom section: Barra de progreso más fina y elegante & Presupuesto mensual */}
          <div className="space-y-2">
            <div className="h-1 rounded-full bg-white/20 overflow-hidden w-full">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#FFA234] via-[#F97316] to-[#F95420]"
                style={{ width: `${Math.min(100, Math.max(5, budgetUsedPercent))}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/85 font-medium pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-normal text-white/80">Presupuesto mensual</span>
                <span className="font-bold text-white">
                  {isBalanceHidden ? '$ ••••••' : `$ ${generalBudget.toLocaleString('es-AR')}`}
                </span>
                {onOpenBudgetModal && (
                  <button
                    type="button"
                    onClick={onOpenBudgetModal}
                    className="text-white/70 hover:text-white transition-colors p-0.5 cursor-pointer ml-0.5 inline-flex"
                    title="Configurar presupuesto mensual"
                  >
                    <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
              <span className="text-[11px] text-white/75 font-semibold">
                {budgetUsedPercent}% consumido
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. 2 CARDS ROW (LÍMITE DIARIO RESTANTE & ALERTA DE PRESUPUESTO)     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
        {/* Card 1: Límite diario restante */}
        <div
          style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D3FEA 55%, #7C3AED 100%)' }}
          className="text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg border border-purple-300/30 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Top section with squircle icon & label */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-sm font-medium text-white/80 leading-tight">
                Límite diario restante
              </span>
            </div>

            {/* Metric & Total limit */}
            <div className="flex items-baseline gap-2 mt-2 mb-2.5">
              <p className="text-2xl sm:text-3xl font-extrabold font-outfit text-white tracking-tight leading-tight tabular-nums">
                {isBalanceHidden ? "$ •••••" : `$ ${(dailyBudgetRemaining > 0 ? dailyBudgetRemaining : 207000).toLocaleString('es-AR')}`}
              </p>
              <span className="text-xs text-white/70 font-normal">
                de {isBalanceHidden ? '$ •••••' : `$ ${(dailyLimit || 25687).toLocaleString('es-AR')}`}
              </span>
            </div>
          </div>

          {/* Bottom section: Progress bar & % disponible */}
          <div>
            <div className="h-1 rounded-full bg-white/20 overflow-hidden mb-2 w-full">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#00E676] to-[#10B981]"
                style={{ width: `${Math.min(100, Math.max(5, dailyAvailablePercent))}%` }}
              />
            </div>
            <p className="text-xs font-medium text-white/80">
              {dailyAvailablePercent}% disponible
            </p>
          </div>
        </div>

        {/* Card 2: Alertas de límites de presupuesto (Naranja/Rojo SOLO si existe alerta real) */}
        {hasCriticalBudgetAlert ? (
          <div
            onClick={() => setIsBudgetAlertsModalOpen(true)}
            className="bg-[#FFF5F5] dark:bg-[#2A131E] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg border border-rose-200/90 dark:border-rose-900/60 flex flex-col justify-between cursor-pointer group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden text-slate-900 dark:text-white"
            title="Hacé click para revisar alertas de presupuesto"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsBudgetAlertsModalOpen(true); }}
          >
            {/* Top section: Red circle icon + "Alerta de presupuesto" + "Revisar" button */}
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#EF4444] border border-rose-300/40 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 leading-tight truncate">
                    Alerta de presupuesto
                  </span>
                </div>

                <span className="px-3.5 py-1 rounded-full text-xs font-bold text-white bg-[#F95420] hover:bg-[#ea4413] shadow-xs shrink-0 transition-colors">
                  Revisar
                </span>
              </div>

              {/* Sub-row: Category count */}
              <div className="flex items-center justify-between gap-1 mt-1.5 mb-2">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {totalCriticalAlertsCount} {totalCriticalAlertsCount === 1 ? 'categoría crítica' : 'categorías críticas'}
                </span>
              </div>
            </div>

            {/* Bottom section: Orange progress bar & detail */}
            <div>
              <div className="h-1 rounded-full bg-rose-100 dark:bg-rose-950/60 overflow-hidden mb-2 w-full">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#FF7A00] to-[#F95420]"
                  style={{
                    width: `${Math.min(100, Math.max(15, maxCriticalAlertPct))}%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {maxCriticalAlertPct}% del límite en esta categoría
                </span>
                <span className="font-bold text-[#6D3FEA] hover:text-[#5B2FD1] transition-colors flex items-center gap-1">
                  <span>Ver detalle</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsBudgetAlertsModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D3FEA 55%, #7C3AED 100%)' }}
            className="text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg border border-purple-300/30 flex flex-col justify-between cursor-pointer group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
            title="Hacé click para ver tus presupuestos"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsBudgetAlertsModalOpen(true); }}
          >
            {/* Top section with emerald icon & label & status pill */}
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-[13px] sm:text-sm font-medium text-white/80 leading-tight truncate">
                    Alerta de presupuesto
                  </span>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide text-white bg-emerald-500/80 shadow-xs shrink-0">
                  Bajo control
                </span>
              </div>

              {/* Sub-row: Category count & Umbral */}
              <div className="flex items-center justify-between gap-1 mt-2 mb-2.5">
                <span className="text-sm sm:text-base font-bold text-white truncate">
                  Sin categorías críticas
                </span>
                <span className="text-xs text-white/70 font-normal shrink-0">
                  Umbral: ≥{alertThreshold}%
                </span>
              </div>
            </div>

            {/* Bottom section: Progress bar, % máx. consumido & Ver límites */}
            <div>
              <div className="h-1 rounded-full bg-white/20 overflow-hidden mb-2 w-full">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#00E676] to-[#10B981]"
                  style={{
                    width: `${Math.min(100, Math.max(10, budgetUsedPercent))}%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80 font-normal">
                  Gastos dentro de los límites
                </span>
                <span className="font-bold text-white group-hover:text-white/90 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
                  <span>Ver límites</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4.5 BOTONES DE ACCIONES RÁPIDAS (SEGÚN DISEÑO)                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100/80 shadow-xs transition-all">
        {/* Cabecera: ACCIONES RÁPIDAS con línea divisoria */}
        <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#6D3FEA] select-none">
            ACCIONES RÁPIDAS
          </span>
          <div className="flex-1 h-px bg-purple-100" />
        </div>

        {/* 4 Cajas de Acciones Rápidas (según diseño exacto de imagen) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          
          {/* 1. Cuotas */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('installments');
              else setIsInstallmentsModalOpen(true);
            }}
            className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-[#F6F2FF] hover:bg-[#F0EAFF] border border-[#ECE4FD] shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group text-left select-none"
            title="Ver compras y gastos en cuotas"
          >
            {/* Top row: Squircle icon on left, Chevron circle on right */}
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#EAE0FE] flex items-center justify-center text-[#6D3FEA] shadow-2xs group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#EAE0FE]/70 flex items-center justify-center text-[#6D3FEA] shadow-2xs group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Bottom: Label */}
            <span className="text-xs sm:text-sm font-bold text-slate-900 mt-3 sm:mt-4 leading-tight">
              Cuotas
            </span>
          </button>

          {/* 2. Metas */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('goals');
              else setIsGoalsModalOpen(true);
            }}
            className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-[#FFF9ED] hover:bg-[#FFF3DF] border border-[#FEEFD0] shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group text-left select-none"
            title="Ver cajas y metas de ahorro"
          >
            {/* Top row: Squircle icon on left, Chevron circle on right */}
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FEEFD0] flex items-center justify-center text-[#F97316] shadow-2xs group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FEEFD0]/70 flex items-center justify-center text-[#F97316] shadow-2xs group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Bottom: Label */}
            <span className="text-xs sm:text-sm font-bold text-slate-900 mt-3 sm:mt-4 leading-tight">
              Metas
            </span>
          </button>

          {/* 3. Balance Duo */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('couple_balance');
            }}
            className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-[#FEF2F5] hover:bg-[#FDE8ED] border border-[#FCE0E7] shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group text-left select-none"
            title="Ver balance y quién le debe a quién en pareja (Dúo)"
          >
            {/* Top row: Squircle icon on left, Chevron circle on right */}
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FCE0E7] flex items-center justify-center text-[#E11D48] shadow-2xs group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FCE0E7]/70 flex items-center justify-center text-[#E11D48] shadow-2xs group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Bottom: Label */}
            <span className="text-xs sm:text-sm font-bold text-slate-900 mt-3 sm:mt-4 leading-tight">
              Balance Duo
            </span>
          </button>

          {/* 4. Liquidar */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSettlementModal) onOpenSettlementModal();
            }}
            className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-[#EDF5FE] hover:bg-[#E3EFFD] border border-[#DAEBFC] shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group text-left select-none"
            title="Liquidar deudas y saldar cuentas en un toque"
          >
            {/* Top row: Squircle icon on left, Chevron circle on right */}
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-2xs group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#DBEAFE]/70 flex items-center justify-center text-[#2563EB] shadow-2xs group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Bottom: Label */}
            <span className="text-xs sm:text-sm font-bold text-slate-900 mt-3 sm:mt-4 leading-tight">
              Liquidar
            </span>
          </button>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4.8 PRÓXIMOS VENCIMIENTOS (DISEÑO EXACTO SEGÚN IMAGEN)             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100/80 shadow-xs transition-all">
        {/* Cabecera: Ícono Calendario violeta + Título + Ver todos → */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2.5 border-b border-purple-50/70">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#6D3FEA] stroke-[2.2]" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
              Próximos vencimientos
            </h3>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('card_alerts')}
              className="text-xs sm:text-sm font-semibold text-[#6D3FEA] hover:text-[#5A2FD1] flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Lista de vencimientos con color semántico según urgencia */}
        {upcomingBills.length === 0 ? (
          <div className="py-7 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#7928CA] dark:text-purple-300 flex items-center justify-center mx-auto">
              <BellRing className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No tenés vencimientos próximos</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">Agregá tus facturas, cuotas o servicios para recibir alertas y mantener tus pagos al día.</p>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('card_alerts')}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar vencimiento</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {upcomingBills.map(bill => (
              <div
                key={bill.id}
                onClick={() => onNavigateTab ? onNavigateTab('card_alerts') : {}}
                className="py-3 px-1.5 sm:px-2 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-2xl transition-colors cursor-pointer group"
              >
                {/* Left: Ícono circular pastel + Título y Subtítulo con fecha */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${bill.iconBg} flex items-center justify-center text-lg shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                    <span>{bill.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate leading-snug">
                      {bill.title}
                    </p>
                    <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                      {bill.subtitle} • {bill.dueDateLabel}
                    </p>
                  </div>
                </div>

                {/* Right: Monto + Píldora de color semántico (Rojo Tarjeta Visa, Naranja Expensas, Verde Internet) */}
                <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                  <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
                    $ {bill.amount.toLocaleString('es-AR')}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 min-w-[76px] flex items-center justify-center gap-1.5 shadow-2xs transition-transform group-hover:scale-105 ${bill.semanticBadgeClass}`}
                    title={`${bill.title}: ${bill.relativeDaysLabel} (${bill.urgencyName})`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bill.dotClass}`} />
                    <span>{bill.relativeDaysLabel}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. HERRAMIENTAS PRO: SCORE Y FLUJO DE CAJA (SEGÚN DISEÑO)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-200/80 shadow-xs transition-all">
        {/* Cabecera del contenedor: Herramientas PRO               Ver más → */}
        <div className="flex items-center justify-between mb-3.5 sm:mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              <span className="text-slate-900">Herramientas </span>
              <span className="text-[#6D3FEA]">PRO</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsProToolsModalOpen(true)}
            className="text-[#6D3FEA] hover:text-[#5A2FD1] text-xs sm:text-sm font-bold flex items-center gap-1 transition-colors cursor-pointer group"
            title="Ver todas las herramientas PRO disponibles"
          >
            <span>Ver más</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Fila: Score financiero, Flujo de caja y Modo Inflación IPC (3 cajas con mismo diseño) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 transition-all">
          
          {/* Card 1: Score Financiero */}
          <div
            onClick={() => setIsScoreModalOpen(true)}
            className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#F8F6FF] hover:bg-[#F2EEFF] border border-purple-100/80 cursor-pointer transition-all duration-200 group shadow-2xs hover:shadow-md relative select-none"
            title="Ver detalle del score financiero"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsScoreModalOpen(true); }}
          >
            {/* Pill PRO en esquina superior derecha */}
            <span className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 px-2 py-0.5 rounded-full bg-[#6D3FEA] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
              PRO
            </span>

            {/* Ícono Donut Score */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="16" fill="none" stroke="#E2D9FC" strokeWidth="5" />
                <circle
                  cx="22" cy="22" r="16" fill="none" stroke="#6D3FEA" strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="100"
                  strokeDashoffset="30"
                />
              </svg>
            </div>

            {/* Contenido central: descripción recortada */}
            <div className="flex-1 min-w-0 pr-8">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#6D3FEA] transition-colors leading-tight">
                Score financiero
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-tight">
                Conocé tu salud
              </p>
            </div>

            {/* Chevron Right */}
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>

          {/* Card 2: Flujo de caja */}
          <div
            onClick={() => setIsCashFlowExpanded(prev => !prev)}
            className={`flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-md relative select-none ${
              isCashFlowExpanded
                ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                : 'bg-[#F8F6FF] hover:bg-[#F2EEFF] border-purple-100/80'
            }`}
            title={isCashFlowExpanded ? "Cerrar flujo de caja" : "Ver flujo de caja"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsCashFlowExpanded(prev => !prev); }}
          >
            {/* Pill PRO en esquina superior derecha */}
            <span className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 px-2 py-0.5 rounded-full bg-[#6D3FEA] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
              PRO
            </span>

            {/* Ícono 3 barras en círculo durazno/ámbar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FFEED4] flex items-center justify-center shrink-0">
              <div className="flex items-end gap-1 h-5">
                <span className="w-1.5 h-2.5 rounded-full bg-[#FF9500]" />
                <span className="w-1.5 h-3.5 rounded-full bg-[#FF9500]" />
                <span className="w-1.5 h-5 rounded-full bg-[#FF9500]" />
              </div>
            </div>

            {/* Contenido central: descripción recortada */}
            <div className="flex-1 min-w-0 pr-8">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#6D3FEA] transition-colors leading-tight">
                Flujo de caja
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-tight">
                Proyectá 30 días
              </p>
            </div>

            {/* Chevron Right */}
            <ChevronRight className={`w-4 h-4 text-purple-400 transition-transform duration-200 shrink-0 ${isCashFlowExpanded ? 'rotate-90 text-[#FF9500]' : 'group-hover:translate-x-0.5'}`} />
          </div>

          {/* Card 3: Modo Inflación IPC */}
          <div
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab('budgets');
              }
            }}
            className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#F8F6FF] hover:bg-[#F2EEFF] border border-purple-100/80 cursor-pointer transition-all duration-200 group shadow-2xs hover:shadow-md relative select-none"
            title="Ajustar presupuestos por Modo Inflación IPC"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateTab ? onNavigateTab('budgets') : {}; }}
          >
            {/* Pill PRO en esquina superior derecha */}
            <span className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 px-2 py-0.5 rounded-full bg-[#6D3FEA] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
              PRO
            </span>

            {/* Ícono Modo Inflación IPC */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0">
              <span className="text-xl sm:text-2xl">📈</span>
            </div>

            {/* Contenido central: descripción recortada */}
            <div className="flex-1 min-w-0 pr-8">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#6D3FEA] transition-colors leading-tight">
                Modo Inflación IPC
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-tight">
                Ajustá por IPC
              </p>
            </div>

            {/* Chevron Right */}
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>

        </div>

        {/* Información desplegada del flujo de caja al hacer click */}
        {isCashFlowExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-purple-900/30 animate-in fade-in slide-in-from-top-3 duration-200">
            {/* Cabecera con Título, Tag PRO, Selector de días y CRUZ para cerrar y volver */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#7928CA] dark:text-purple-300 flex items-center justify-center text-base font-bold shrink-0">
                  🔮
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
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

              {/* Controles: 15d / 30d y Cruz (X) para cerrar y volver */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
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

                {/* Cruz para cerrar y volver */}
                <button
                  type="button"
                  onClick={() => setIsCashFlowExpanded(false)}
                  className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-purple-950 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                  title="Cerrar y volver"
                  aria-label="Cerrar y volver"
                >
                  <X className="w-4 h-4 sm:w-5 h-5 stroke-[2.5]" />
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

            {/* Footer info strip + close button */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-purple-900/30">
              <span className="flex items-center gap-1.5">
                <span>💳</span>
                <span>Incluye vencimientos de tarjetas, servicios y gastos promedio diarios</span>
              </span>
              <div className="flex items-center gap-3">
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
                <button
                  type="button"
                  onClick={() => setIsCashFlowExpanded(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cerrar y volver</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. BOTTOM 2-COLUMN GRID (DISTRIBUCIÓN DE GASTOS Y ÚLTIMOS MOVIMIENTOS) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        
        {/* ── CARD 1: Distribución de gastos ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <div className="flex items-end gap-[3px] h-5 justify-center">
                  <span className="w-1.5 h-3 bg-[#7C3AED] rounded-full inline-block" />
                  <span className="w-1.5 h-5 bg-[#7C3AED] rounded-full inline-block" />
                  <span className="w-1.5 h-3.5 bg-[#7C3AED] rounded-full inline-block" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  Distribución de gastos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseDistributionModalOpen(true)}
                className="text-xs font-semibold text-[#6D3FEA] hover:text-[#5B2FD1] transition-colors flex items-center gap-1 cursor-pointer"
                title="Ampliar distribución"
              >
                <span>Ver detalle</span>
                <span>→</span>
              </button>
            </div>

            {/* Content: Donut + Legend */}
            {categoryPieData.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#7928CA] dark:text-purple-300 flex items-center justify-center mx-auto">
                  <LucidePieChart className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Sin gastos en este período</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">El gráfico de distribución por categorías se generará automáticamente con tus primeros gastos.</p>
                {onOpenTransactionModal && (
                  <button
                    type="button"
                    onClick={onOpenTransactionModal}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cargar primer gasto</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 py-1">
                {/* Donut chart */}
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex-shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={68}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#ffffff"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                      {isBalanceHidden ? '$ •••••' : `$ ${displayTotalExpenses.toLocaleString('es-AR')}`}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-normal">
                      gasto total
                    </span>
                  </div>
                </div>

                {/* Legend with percentages and amounts */}
                <div className="flex-1 w-full space-y-3 sm:space-y-3.5">
                  {categoryPieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
                        <span className="text-slate-400 dark:text-slate-400 font-medium tabular-nums w-8 text-right">
                          {item.pct}%
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums w-20 text-right">
                          {isBalanceHidden ? '$ •••' : `$ ${item.value.toLocaleString('es-AR')}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CARD 2: Últimos movimientos ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#6D3FEA] stroke-[2.2]" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  Últimos movimientos
                </h3>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('transactions')}
                  className="text-xs font-semibold text-[#6D3FEA] hover:text-[#5B2FD1] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver todos</span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* List of movements */}
            {recentMovements.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#6D3FEA] flex items-center justify-center mx-auto">
                  <CreditCard className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No hay movimientos registrados</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Tus gastos e ingresos se listarán aquí en tiempo real cuando comiences a registrar transacciones.</p>
                {onOpenTransactionModal && (
                  <button
                    type="button"
                    onClick={onOpenTransactionModal}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cargar gasto</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentMovements.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onNavigateTab ? onNavigateTab('transactions') : {}}
                    className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-2xl px-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${tx.iconBg}`}>
                        {tx.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {tx.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium">
                          {tx.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <span className={`text-xs sm:text-sm font-bold tabular-nums ${
                        tx.isPositive ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {tx.isPositive ? '+ ' : '- '}
                        {isBalanceHidden ? '$ •••••' : `$ ${tx.amount.toLocaleString('es-AR')}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Modal de Distribución de Gastos al hacer click en el porcentaje del presupuesto */}
      <ExpenseDistributionModal
        isOpen={isExpenseDistributionModalOpen}
        onClose={() => setIsExpenseDistributionModalOpen(false)}
        categoryPieData={categoryPieData}
        totalExpenses={totalExpenses}
        generalBudget={generalBudget}
        budgetUsedPercent={budgetUsedPercent}
        transactions={transactions}
        monthExpensesList={monthExpensesList}
        isBalanceHidden={isBalanceHidden}
        currency={profile?.currency || 'ARS'}
        onSelectCategory={(category) => {
          setIsExpenseDistributionModalOpen(false);
          if (onSelectCategory) {
            onSelectCategory(category);
          } else if (onNavigateTab) {
            onNavigateTab('transactions');
          }
        }}
        onNavigateTab={(tab) => {
          setIsExpenseDistributionModalOpen(false);
          if (onNavigateTab) onNavigateTab(tab);
        }}
        onOpenTransactionModal={() => {
          setIsExpenseDistributionModalOpen(false);
          if (onOpenTransactionModal) onOpenTransactionModal();
        }}
      />

      {/* Modal de Últimos Movimientos al hacer click en el porcentaje */}
      <RecentMovementsModal
        isOpen={isRecentMovementsModalOpen}
        onClose={() => setIsRecentMovementsModalOpen(false)}
        transactions={transactions}
        monthExpensesList={monthExpensesList}
        generalBudget={generalBudget}
        totalExpenses={totalExpenses}
        budgetUsedPercent={budgetUsedPercent}
        isBalanceHidden={isBalanceHidden}
        onNavigateTab={onNavigateTab}
        onOpenTransactionModal={onOpenTransactionModal}
      />

      {/* Modal de Alertas de Presupuesto (Categorías y Subcategorías Críticas según parámetros de usuario) */}
      <BudgetAlertsModal
        isOpen={isBudgetAlertsModalOpen}
        onClose={() => setIsBudgetAlertsModalOpen(false)}
        alertThreshold={alertThreshold}
        criticalCategories={criticalCategoryItems}
        criticalSubcategories={criticalSubcategoriesList}
        allBudgetItems={allBudgetCategoryItems}
        onOpenBudgetModal={onOpenBudgetModal}
        onSelectCategory={onSelectCategory}
        onNavigateTab={onNavigateTab}
        isBalanceHidden={isBalanceHidden}
      />

      {/* Modal de Movimientos y Ahorro en Metas */}
      <GoalsMovementsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        goals={effectiveGoals}
        currency={profile?.currency || 'ARS'}
        onNavigateTab={onNavigateTab}
      />

      {/* Modal de Movimientos y Gastos en Cuotas */}
      <InstallmentsMovementsModal
        isOpen={isInstallmentsModalOpen}
        onClose={() => setIsInstallmentsModalOpen(false)}
        transactions={transactions}
        profile={profile}
        currency={profile?.currency || 'ARS'}
        onNavigateTab={onNavigateTab}
      />

      {/* Modal Completo de Herramientas PRO al hacer click en 'Ver más' */}
      {isProToolsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsProToolsModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-100 p-5 sm:p-7 relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pro-tools-modal-title"
          >
            {/* Botón cerrar X */}
            <button
              type="button"
              onClick={() => setIsProToolsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6D3FEA] to-[#A855F7] flex items-center justify-center text-white shadow-md shrink-0">
                <Sparkles className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 id="pro-tools-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Herramientas <span className="text-[#6D3FEA]">PRO</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#6D3FEA] text-white text-[10px] font-black uppercase tracking-wider">
                    Activas
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Módulos avanzados para maximizar tu salud financiera y proyecciones
                </p>
              </div>
            </div>

            {/* Lista de herramientas PRO con diseño unificado */}
            <div className="space-y-3">

              {/* Tool 1: Score Financiero */}
              <div 
                onClick={() => {
                  setIsProToolsModalOpen(false);
                  setIsScoreModalOpen(true);
                }}
                className="p-4 rounded-2xl bg-[#F8F6FF] hover:bg-[#F2EEFF] border border-purple-100/90 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-purple-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                    <svg className="w-7 h-7 -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="16" fill="none" stroke="#E2D9FC" strokeWidth="5" />
                      <circle cx="22" cy="22" r="16" fill="none" stroke="#6D3FEA" strokeWidth="5" strokeLinecap="round" strokeDasharray="100" strokeDashoffset="30" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#6D3FEA] transition-colors truncate">
                        Score financiero
                      </h4>
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#6D3FEA] text-[9px] font-bold">Salud 360°</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      Conocé tu salud financiera, solvencia y hábitos diarios con puntaje inteligente.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* Tool 2: Flujo de caja */}
              <div 
                onClick={() => {
                  setIsProToolsModalOpen(false);
                  setIsCashFlowExpanded(true);
                }}
                className="p-4 rounded-2xl bg-[#FFF9F2] hover:bg-[#FFF3E5] border border-amber-200/70 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#FFEED4] flex items-center justify-center shrink-0 shadow-2xs">
                    <div className="flex items-end gap-1 h-5">
                      <span className="w-1.5 h-2.5 rounded-full bg-[#FF9500]" />
                      <span className="w-1.5 h-3.5 rounded-full bg-[#FF9500]" />
                      <span className="w-1.5 h-5 rounded-full bg-[#FF9500]" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#FF9500] transition-colors truncate">
                        Flujo de caja
                      </h4>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">15 - 30 días</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      Proyectá 30 días de liquidez día por día anticipando cobros y vencimientos.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* Tool 3: Modo Inflación IPC */}
              <div 
                onClick={() => {
                  setIsProToolsModalOpen(false);
                  if (onNavigateTab) onNavigateTab('budgets');
                }}
                className="p-4 rounded-2xl bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-sky-200/70 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                    📈
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        Modo Inflación IPC
                      </h4>
                      <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[9px] font-bold">INDEC</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      Ajustá por IPC tus presupuestos para mantener constante tu poder adquisitivo real.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* Tool 4: Alertas de Tarjetas y Vencimientos */}
              <div 
                onClick={() => {
                  setIsProToolsModalOpen(false);
                  if (onNavigateTab) onNavigateTab('card_alerts');
                }}
                className="p-4 rounded-2xl bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-purple-200/70 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] flex items-center justify-center text-[#9333EA] shrink-0 shadow-2xs">
                    <CreditCard className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#9333EA] transition-colors truncate">
                        Alertas y Cierres de Tarjetas
                      </h4>
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9px] font-bold">Vencimientos</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      Calendario de cierres bancarios y pagos para optimizar días de gracia.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Incluido con tu plan GastoAR PRO
              </span>
              <button
                type="button"
                onClick={() => setIsProToolsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardOverview;
