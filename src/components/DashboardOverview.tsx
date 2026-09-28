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
  ArrowLeftRight,
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
  goals = [],
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
  const currentUserName = profile ? (isUser1 ? profile.user1Name : profile.user2Name) : 'Sol';
  const displayName = (currentUserName === 'Sol' || profile?.user1Name === 'Sol')
    ? 'Sol Esteche'
    : currentUserName;

  // Modal de Cotizaciones
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Modal de Flujo de Caja
  const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
  const [isCashFlowExpanded, setIsCashFlowExpanded] = useState(false);

  // Modales de Metas de Ahorro y Gastos en Cuotas
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);

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

  // ─── Metas de Ahorro y Gastos en Cuotas ──────────────────────────────────
  const effectiveGoals = useMemo(() => {
    if (goals && goals.length > 0) return goals;
    try {
      const saved = localStorage.getItem('control_gastos_goals_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_GOALS;
  }, [goals]);

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
    return DEFAULT_BUDGETS.categories || {};
  }, [budgets?.categories]);

  const userSubBudgets = useMemo(() => {
    if (budgets?.subcategories && Object.keys(budgets.subcategories).length > 0) {
      return budgets.subcategories;
    }
    return DEFAULT_BUDGETS.subcategories || {};
  }, [budgets?.subcategories]);

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
  const maxCriticalPct = useMemo(() => {
    if (criticalCategoryItems.length > 0) {
      return criticalCategoryItems[0].pct;
    }
    if (allBudgetCategoryItems.length > 0) {
      return allBudgetCategoryItems[0].pct;
    }
    return 0;
  }, [criticalCategoryItems, allBudgetCategoryItems]);

  // Vencimientos dinámicos (con fallback a la lista estética si está vacía)
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nowMs = Date.now();

    const realBills = (vencimientos || [])
      .filter(v => !v.isPaid)
      .map(v => {
        const dueEnd = new Date(v.dueDate + 'T23:59:59');
        const diffMs = dueEnd.getTime() - nowMs;
        const hoursLeft = diffMs / (1000 * 60 * 60);
        const daysLeft = Math.ceil((new Date(v.dueDate + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isUnder48Hours = hoursLeft <= 48 && hoursLeft >= -24;

        let dueText = `Vence en ${daysLeft} días`;
        if (hoursLeft < 0 && hoursLeft >= -24) {
          dueText = '¡Vence hoy!';
        } else if (daysLeft === 0 || hoursLeft <= 24) {
          dueText = `¡Vence hoy o mañana! (~${Math.max(1, Math.round(hoursLeft))}h)`;
        } else if (isUnder48Hours) {
          dueText = `Vence en ~${Math.round(hoursLeft)}h (< 48h)`;
        } else if (daysLeft === 1) {
          dueText = 'Vence mañana';
        }

        return {
          id: v.id,
          icon: v.icon || '💳',
          title: v.title || 'Servicio',
          cat: v.cat || 'Servicios',
          dueText,
          amount: v.amount || 0,
          daysLeft,
          hoursLeft,
          isUnder48Hours,
          color: isUnder48Hours ? 'text-rose-600 dark:text-rose-400 font-bold' : daysLeft <= 7 ? 'text-amber-500' : 'text-blue-500',
          bg: isUnder48Hours ? 'bg-rose-500/15' : daysLeft <= 7 ? 'bg-amber-500/10' : 'bg-blue-500/10'
        };
      })
      .sort((a, b) => a.hoursLeft - b.hoursLeft);

    if (realBills.length > 0) {
      return realBills.slice(0, 5);
    }

    // Default mock list matching the mockup screenshot
    return [
      { id: '1', icon: '💳', title: 'Tarjeta Visa', cat: 'Tarjetas', dueText: 'Vence en 3 días', amount: 66000, daysLeft: 3, hoursLeft: 72, isUnder48Hours: false, color: 'text-rose-500', bg: 'bg-rose-500/10' },
      { id: '2', icon: '🏢', title: 'Expensas', cat: 'Vivienda', dueText: 'Vence en 5 días', amount: 135000, daysLeft: 5, hoursLeft: 120, isUnder48Hours: false, color: 'text-amber-500', bg: 'bg-amber-500/10' },
      { id: '3', icon: '💧', title: 'AySA', cat: 'Servicios', dueText: 'Vence en 8 días', amount: 28500, daysLeft: 8, hoursLeft: 192, isUnder48Hours: false, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
      { id: '4', icon: '🌐', title: 'Internet', cat: 'Servicios', dueText: 'Vence en 11 días', amount: 12000, daysLeft: 11, hoursLeft: 264, isUnder48Hours: false, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      { id: '5', icon: '🏠', title: 'Alquiler', cat: 'Vivienda', dueText: 'Vence en 14 días', amount: 650000, daysLeft: 14, hoursLeft: 336, isUnder48Hours: false, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
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
    const list = (monthExpensesList.length > 0 ? monthExpensesList : (transactions || []).filter(t => t.tipoTransaccion !== 'ingreso'))
      .slice(0, 4)
      .map(t => ({
        id: t.id,
        title: t.descripcion || t.categoria || 'Gasto',
        subtitle: `${t.fecha || 'Hoy'} · ${t.categoria || 'Varios'}`,
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
  }, [monthExpensesList, transactions]);

  // Math para el Ring del Hero Card (Diámetro ~110px)
  const ringRadius = 42;
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
      {/* 3. HERO "SALDO DISPONIBLE" CARD                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-[#6D3FEA] via-[#5A2FD1] to-[#451BA8] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-purple-300/30 relative overflow-hidden">
        {/* Ambient glow in background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Row: Saldo on left & Porcentaje de Presupuesto ring on right (in the same line) */}
          <div className="flex flex-row items-center justify-between gap-3 sm:gap-6">
            {/* Left section: balance */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-purple-200/90 tracking-wide">Saldo disponible</p>

              <div className="flex items-center gap-2.5 sm:gap-3 mt-1 sm:mt-1.5 mb-1">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-outfit tracking-tight leading-none text-white truncate">
                  {isBalanceHidden ? "$ ••••••" : `$ ${availableBalance.toLocaleString('es-AR')}`}
                </h2>
                <button
                  type="button"
                  onClick={toggleHideBalance}
                  className="text-purple-300/80 hover:text-white transition-colors cursor-pointer p-1 shrink-0"
                  title={isBalanceHidden ? "Mostrar saldo" : "Ocultar saldo"}
                >
                  {isBalanceHidden ? <EyeOff className="w-4 h-4 sm:w-5 h-5" /> : <Eye className="w-4 h-4 sm:w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Right section: Circular Ring Gauge (Porcentaje del presupuesto utilizado on the same line) - CLICKABLE */}
            <button
              type="button"
              onClick={() => setIsRecentMovementsModalOpen(true)}
              className="relative shrink-0 w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center cursor-pointer group transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none rounded-full"
              title="Toca para ver los últimos movimientos"
              aria-label="Ver últimos movimientos que consumen el presupuesto"
            >
              <svg className="w-full h-full -rotate-90 filter drop-shadow-xs" viewBox="0 0 100 100">
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
                  className="transition-all duration-1000 ease-out group-hover:stroke-[#ff6938]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center pointer-events-none">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-none tracking-tight group-hover:text-orange-200 transition-colors">
                  {budgetUsedPercent}%
                </span>
                <span className="text-[9px] sm:text-[10px] text-purple-200/90 font-medium leading-tight mt-0.5 group-hover:text-white transition-colors">
                  del presupuesto<br />utilizado
                </span>
                <span className="text-[8px] font-extrabold text-orange-300 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 leading-none">
                  Ver movimientos ↗
                </span>
              </div>
            </button>
          </div>

          {/* Bottom section: Progress bar & Presupuesto mensual */}
          <div className="pt-0.5">
            <div className="h-2 rounded-full bg-white/15 overflow-hidden mb-2.5 w-full">
              <div
                className="h-full rounded-full transition-all duration-700 bg-[#F95420]"
                style={{ width: `${budgetUsedPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-purple-200/90 font-medium">
              <div className="flex items-center gap-1.5">
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
              <span className="text-[11px] sm:text-xs text-purple-200/70 font-semibold">
                {budgetUsedPercent}% consumido
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. 2 CARDS ROW (LÍMITE DIARIO RESTANTE & PROMEDIO DIARIO)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {/* Card 1: Límite de gasto diario restante */}
        <div className="bg-gradient-to-br from-[#6D3FEA] via-[#5A2FD1] to-[#451BA8] text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg border border-purple-300/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-2xs">
                💳
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-purple-200 leading-tight">
                Límite diario<br />restante
              </span>
            </div>

            <p className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-1.5 sm:mt-2 tabular-nums">
              {isBalanceHidden ? "$ •••••" : `$ ${(dailyBudgetRemaining > 0 ? dailyBudgetRemaining : 97509).toLocaleString('es-AR')}`}
            </p>
            <p className="text-[10px] sm:text-xs text-purple-200/80 font-medium mt-0.5">
              de {isBalanceHidden ? '$ •••••' : `$ ${(dailyLimit || 26000).toLocaleString('es-AR')}`}
            </p>
          </div>

          <div>
            <div className="h-1.5 sm:h-2 rounded-full bg-white/15 overflow-hidden my-2.5 sm:my-3 w-full">
              <div
                className="h-full rounded-full bg-[#F95420] transition-all duration-700"
                style={{ width: `${dailyAvailablePercent}%` }}
              />
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-400">
              {dailyAvailablePercent}% disponible
            </p>
          </div>
        </div>

        {/* Card 2: Alertas de límites de presupuesto (Reemplaza Promedio de gasto diario) */}
        <div
          onClick={() => setIsBudgetAlertsModalOpen(true)}
          className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg border flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group ${
            criticalCategoriesCount > 0
              ? 'bg-gradient-to-br from-[#6D3FEA] via-[#8B2375] to-[#731B4D] text-white border-rose-500/40 hover:border-rose-400/80 shadow-rose-950/30'
              : 'bg-gradient-to-br from-[#6D3FEA] via-[#5A2FD1] to-[#451BA8] text-white border-purple-300/30 hover:border-purple-200/50'
          }`}
          title="Hacé click para ver el estado de las categorías y subcategorías críticas según tus parámetros"
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsBudgetAlertsModalOpen(true); }}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center text-sm sm:text-base shrink-0 shadow-2xs ${
                  criticalCategoriesCount > 0
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-400/40 animate-pulse'
                    : 'bg-white/10 text-purple-200 border border-white/10'
                }`}>
                  {criticalCategoriesCount > 0 ? '⚠️' : '🎯'}
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-purple-200 leading-tight">
                  Límites de presupuesto<br />
                  <span className={criticalCategoriesCount > 0 ? 'text-rose-300 font-bold' : 'text-purple-300 font-medium'}>
                    {criticalCategoriesCount > 0 ? 'Estado crítico' : 'Bajo control'}
                  </span>
                </span>
              </div>

              {criticalCategoriesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs shrink-0 animate-bounce">
                  Alerta
                </span>
              )}
            </div>

            <div className="mt-1.5 sm:mt-2">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className={`text-xl sm:text-3xl font-black tracking-tight tabular-nums ${
                  criticalCategoriesCount > 0 ? 'text-rose-300' : 'text-emerald-300'
                }`}>
                  {criticalCategoriesCount}
                </span>
                <span className="text-xs sm:text-sm font-bold text-purple-100">
                  {criticalCategoriesCount === 1 ? 'categoría crítica' : 'categorías críticas'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-purple-200/80 font-medium mt-0.5">
                {criticalCategoriesCount > 0
                  ? `Umbral: ≥${alertThreshold}% ${criticalSubcategoriesList.length > 0 ? `· ${criticalSubcategoriesList.length} subcat.` : ''}`
                  : `Todas bajo tu umbral del ${alertThreshold}%`}
              </p>
            </div>
          </div>

          <div>
            <div className="h-1.5 sm:h-2 rounded-full bg-white/15 overflow-hidden my-2.5 sm:my-3 w-full">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  criticalCategoriesCount > 0
                    ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                    : 'bg-emerald-400'
                }`}
                style={{
                  width: `${criticalCategoriesCount > 0 ? Math.min(100, Math.max(20, maxCriticalPct)) : 100}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
              <span className={criticalCategoriesCount > 0 ? 'text-rose-300' : 'text-emerald-400'}>
                {criticalCategoriesCount > 0
                  ? `${maxCriticalPct}% máx. consumido`
                  : '100% saludable'}
              </span>
              <span className="text-purple-200 group-hover:text-white group-hover:translate-x-0.5 transition-all flex items-center gap-0.5 font-semibold">
                Ver estado →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4.5 BOTONES DE ACCIONES RÁPIDAS (SEGÚN DISEÑO)                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#181332] rounded-3xl p-4 sm:p-5 border border-purple-100/80 dark:border-purple-900/40 shadow-xs transition-all">
        {/* Cabecera: ACCIONES RÁPIDAS con línea divisoria */}
        <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#6D3FEA] dark:text-purple-400 select-none">
            ACCIONES RÁPIDAS
          </span>
          <div className="flex-1 h-px bg-purple-100 dark:bg-purple-900/40" />
        </div>

        {/* 4 Botones de Acciones Rápidas */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          
          {/* 1. Cuotas */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('installments');
              else setIsInstallmentsModalOpen(true);
            }}
            className="flex flex-col items-center gap-2 p-1 sm:p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-purple-950/30 transition-all cursor-pointer group active:scale-95 text-center select-none"
            title="Ver compras y gastos en cuotas"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-[#F4EEFF] dark:bg-purple-950/60 border border-purple-200/70 dark:border-purple-800/60 flex items-center justify-center text-[#6D3FEA] dark:text-purple-300 shadow-2xs group-hover:scale-105 group-hover:shadow-md transition-all">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-[#6D3FEA] transition-colors leading-tight">
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
            className="flex flex-col items-center gap-2 p-1 sm:p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-purple-950/30 transition-all cursor-pointer group active:scale-95 text-center select-none"
            title="Ver cajas y metas de ahorro"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-[#FEF9E7] dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-center text-[#D97706] dark:text-amber-400 shadow-2xs group-hover:scale-105 group-hover:shadow-md transition-all">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-amber-600 transition-colors leading-tight">
              Metas
            </span>
          </button>

          {/* 3. Balance pareja */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('couple_balance');
            }}
            className="flex flex-col items-center gap-2 p-1 sm:p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-purple-950/30 transition-all cursor-pointer group active:scale-95 text-center select-none"
            title="Ver balance y quién le debe a quién en pareja (Dúo)"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-[#FDF2F4] dark:bg-pink-950/50 border border-pink-200/70 dark:border-pink-800/60 flex items-center justify-center text-[#EC4899] dark:text-pink-400 shadow-2xs group-hover:scale-105 group-hover:shadow-md transition-all">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-pink-600 transition-colors leading-tight">
              Balance pareja
            </span>
          </button>

          {/* 4. Liquidar */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSettlementModal) onOpenSettlementModal();
            }}
            className="flex flex-col items-center gap-2 p-1 sm:p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-purple-950/30 transition-all cursor-pointer group active:scale-95 text-center select-none"
            title="Liquidar deudas y saldar cuentas en un toque"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-[#EFF6FF] dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 flex items-center justify-center text-[#2563EB] dark:text-blue-400 shadow-2xs group-hover:scale-105 group-hover:shadow-md transition-all">
              <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors leading-tight">
              Liquidar
            </span>
          </button>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. HERRAMIENTAS PRO: SCORE Y FLUJO DE CAJA (SEGÚN DISEÑO)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#181332] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-purple-900/40 shadow-xs transition-all">
        {/* Cabecera del contenedor: ✨ Herramientas PRO */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">✨</span>
            <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white tracking-wide">
              Herramientas PRO
            </h3>
          </div>
        </div>

        {/* Fila superior: Score y Flujo de caja uno al lado del otro */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          
          {/* Card 1: Score Financiero */}
          <div
            onClick={() => setIsScoreModalOpen(true)}
            className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-50/60 hover:bg-purple-50/50 dark:bg-[#1f153d] dark:hover:bg-purple-950/40 border border-slate-200/80 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-all group shadow-2xs select-none min-h-[110px] sm:min-h-[120px]"
            title="Ver detalle del score financiero"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsScoreModalOpen(true); }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#6D3FEA] shrink-0 shadow-xs ring-2 ring-purple-300/40 dark:ring-purple-700/60" />
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Score
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight mt-0.5 pl-0.5">
                Financiero
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-auto">
              <span className="text-[11px] sm:text-xs font-black text-slate-500 dark:text-slate-400 group-hover:text-[#6D3FEA] dark:group-hover:text-purple-300 transition-colors uppercase tracking-wider">
                PRO
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#6D3FEA] dark:group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Card 2: Flujo de caja */}
          <div
            onClick={() => setIsCashFlowExpanded(prev => !prev)}
            className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer group shadow-2xs select-none min-h-[110px] sm:min-h-[120px] ${
              isCashFlowExpanded
                ? 'bg-orange-50/70 dark:bg-purple-950/70 border-orange-400 dark:border-orange-500 shadow-xs'
                : 'bg-slate-50/60 hover:bg-orange-50/40 dark:bg-[#1f153d] dark:hover:bg-purple-950/40 border-slate-200/80 dark:border-purple-900/50 hover:border-orange-300 dark:hover:border-orange-600'
            }`}
            title={isCashFlowExpanded ? "Cerrar flujo de caja" : "Ver flujo de caja"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsCashFlowExpanded(prev => !prev); }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#F95420] shrink-0 shadow-xs ring-2 ring-orange-300/40 dark:ring-orange-700/60" />
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Flujo
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight mt-0.5 pl-0.5">
                de caja
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-auto">
              <span className="text-[11px] sm:text-xs font-black text-slate-500 dark:text-slate-400 group-hover:text-[#F95420] dark:group-hover:text-orange-300 transition-colors uppercase tracking-wider">
                PRO
              </span>
              <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-[#F95420] dark:group-hover:text-orange-300 transition-transform duration-200 ${isCashFlowExpanded ? 'rotate-90 text-[#F95420]' : 'group-hover:translate-x-0.5'}`} />
            </div>
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
      {/* 6. BOTTOM 2-COLUMN GRID                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ── COLUMN 1 (LEFT): Próximos Vencimientos ── */}
        <div className="space-y-4">
          {/* Card: Próximos vencimientos */}
          <div className="bg-white dark:bg-[#181332] rounded-2xl p-4 border border-slate-100 dark:border-purple-900/40 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50 dark:border-purple-900/30">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span>🔔</span>
                  <span>Próximos vencimientos</span>
                </h3>
                {upcomingBills.some(b => b.isUnder48Hours) && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-black animate-pulse flex items-center gap-0.5">
                    <span>⚡</span>
                    <span>&lt;48h</span>
                  </span>
                )}
              </div>
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
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{bill.title}</p>
                        {bill.isUnder48Hours && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[9px] font-black uppercase shrink-0">
                            ⚡ &lt;48h
                          </span>
                        )}
                      </div>
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

    </div>
  );
};

export default DashboardOverview;
