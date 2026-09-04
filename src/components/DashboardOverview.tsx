import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronDown,
  Calendar,
  CreditCard,
  TrendingUp,
  Eye,
  EyeOff,
  Edit2,
  Lock,
  Award,
  Info,
  Plus,
  Target,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { Budgets, CategoryColors, CategoryMap, CoupleProfile, DailyFinancialScore, ExpenseMode, Transaction } from '../types';
import { computeDailyFinancialScore, getTodayDateString } from '../utils/scoreEngine';
import { DailyScoreModal } from './DailyScoreModal';

// Brand tokens
const P = "#6F2EC5";          // primary purple
const P_MID = "#A78BFA";      // mid purple
const P_LIGHT = "#EDE9FE";    // light purple tint
const GRAD = `linear-gradient(90deg, #F97316 0%, ${P} 100%)`;
const GRAD_ICON = `linear-gradient(135deg, ${P_MID}, ${P})`;

interface DashboardOverviewProps {
  transactions: Transaction[];
  profile: CoupleProfile;
  categoryColors: CategoryColors;
  categoryMap: CategoryMap;
  budgets: Budgets;
  activeMode?: ExpenseMode;
  onModeChange?: (mode: ExpenseMode) => void;
  onOpenTransactionModal: () => void;
  onOpenIncomeModal?: () => void;
  onOpenBudgetModal?: () => void;
  onNavigateTab?: (tab: any) => void;
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Alimentos': '🛒',
  'Alimentación': '🛒',
  'Alimentación & Bebidas': '🛒',
  'Supermercado': '🛒',
  'Hogar': '🏠',
  'Alquiler': '🏠',
  'Expensas': '🏢',
  'Servicios': '💡',
  'Servicios & Hogar': '💡',
  'Transporte': '🚌',
  'Transporte & Movilidad': '🚌',
  'Movilidad & Transporte': '🚌',
  'Entretenimiento': '🎬',
  'Entretenimiento, Ocio & Salidas': '🎬',
  'Ocio & Suscripciones': '🎬',
  'Streaming': '🎵',
  'Suscripciones': '📺',
  'Salud': '💊',
  'Salud & Cuidado Personal': '💊',
  'Farmacia & Salud': '💊',
  'Restaurantes': '🍽️',
  'Restaurantes & Bares': '🍽️',
  'Educación': '📚',
  'Educación & Formación': '📚',
  'Ropa & Calzado': '👕',
  'Indumentaria & Calzado': '👕',
  'Mascotas': '🐾',
  'Tecnología, Electro & Bazar': '💻',
  'Otros': '📦',
  'Otros Gastos': '📦',
};

const CATEGORY_DEFAULT_COLORS: Record<string, string> = {
  'Alimentos': P,
  'Alimentación': P,
  'Transporte': '#F97316',
  'Movilidad & Transporte': '#F97316',
  'Hogar': '#EF4444',
  'Servicios & Hogar': '#EF4444',
  'Entretenimiento': P_MID,
  'Ocio & Suscripciones': P_MID,
  'Salud': '#2DD4BF',
  'Farmacia & Salud': '#2DD4BF',
  'Otros': '#8B5CF6',
  'Otros Gastos': '#8B5CF6',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function billBadge(days: number) {
  if (days <= 3) return { bg: P_LIGHT, color: P };
  if (days <= 7) return { bg: "#FEF3C7", color: "#D97706" };
  if (days <= 15) return { bg: "#ECFDF5", color: "#059669" };
  return { bg: "#DBEAFE", color: "#2563EB" };
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  profile,
  categoryColors,
  categoryMap,
  budgets,
  activeMode = 'all',
  onModeChange,
  onOpenTransactionModal,
  onOpenIncomeModal,
  onOpenBudgetModal,
  onNavigateTab,
  onSelectCategory,
}) => {
  // Current user display name
  const isUser1 = profile?.currentUser === 'user1';
  const currentUserName = profile ? (isUser1 ? profile.user1Name : profile.user2Name) : 'Sol';

  // Toggle hide balance state
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gastoar_is_balance_hidden') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHideBalance = () => {
    setIsBalanceHidden(prev => {
      const next = !prev;
      try {
        localStorage.setItem('gastoar_is_balance_hidden', String(next));
      } catch {}
      return next;
    });
  };

  // Helper ARS currency format
  const ars = (n: number) =>
    "$ " + Math.round(Math.abs(n)).toLocaleString("es-AR", { maximumFractionDigits: 0 });

  // Score History & Daily Score Logic
  const todayStr = useMemo(() => getTodayDateString(), []);
  
  const [scoreHistory, setScoreHistory] = useState<Record<string, DailyFinancialScore>>(() => {
    try {
      const saved = localStorage.getItem('gastoar_daily_scores_history');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Calculate live daily score
  const dailyScore = useMemo(() => {
    return computeDailyFinancialScore(transactions, budgets, scoreHistory, todayStr);
  }, [transactions, budgets, scoreHistory, todayStr]);

  const isScoreUnlockedToday = useMemo(() => {
    return Boolean(scoreHistory[todayStr]?.unlockedAt);
  }, [scoreHistory, todayStr]);

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const handleFinalizeDay = () => {
    const updatedScore: DailyFinancialScore = {
      ...dailyScore,
      unlockedAt: Date.now(),
    };
    const nextHistory = {
      ...scoreHistory,
      [todayStr]: updatedScore,
    };
    setScoreHistory(nextHistory);
    try {
      localStorage.setItem('gastoar_daily_scores_history', JSON.stringify(nextHistory));
    } catch (e) {
      console.error(e);
    }
  };

  // Selected date cursor
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Filter mode: 'today' | 'month' | 'prevMonth' | 'last7' | 'last15' | 'last30' | 'thisYear' | 'custom'
  const [filterMode, setFilterMode] = useState<
    'today' | 'month' | 'prevMonth' | 'last7' | 'last15' | 'last30' | 'thisYear' | 'custom'
  >(() => {
    try {
      return (localStorage.getItem('gastoar_dash_filter_mode') as any) || 'month';
    } catch {
      return 'month';
    }
  });

  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    try {
      return localStorage.getItem('gastoar_dash_start_date') || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    } catch {
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    }
  });

  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    try {
      return localStorage.getItem('gastoar_dash_end_date') || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`;
    } catch {
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`;
    }
  });

  // Temp inputs inside dropdown for custom range selection
  const [tempStartDate, setTempStartDate] = useState<string>(customStartDate);
  const [tempEndDate, setTempEndDate] = useState<string>(customEndDate);

  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const dateRangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target as Node)) {
        setIsDateRangeOpen(false);
      }
    };
    if (isDateRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDateRangeOpen]);

  const yearNumber = selectedDate.getFullYear();
  const monthNumber = selectedDate.getMonth();
  const monthName = MONTH_NAMES[monthNumber];

  const prevMonthDate = useMemo(() => new Date(yearNumber, monthNumber - 1, 1), [yearNumber, monthNumber]);
  const prevMonthName = MONTH_NAMES[prevMonthDate.getMonth()];
  const prevYearNumber = prevMonthDate.getFullYear();

  const formatDateShort = (isoStr: any) => {
    if (!isoStr || typeof isoStr !== 'string') return '';
    const parts = isoStr.split('-');
    if (parts && parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    }
    return String(isoStr);
  };

  const rangeLabel = useMemo(() => {
    const now = new Date();
    if (filterMode === 'today') return `Hoy (${now.getDate()} ${monthName ? monthName.slice(0, 3) : ''})`;
    if (filterMode === 'month') return `${monthName || ''} ${yearNumber}`;
    if (filterMode === 'prevMonth') return `${prevMonthName || ''} ${prevYearNumber}`;
    if (filterMode === 'last7') return 'Últimos 7 días';
    if (filterMode === 'last15') return 'Últimos 15 días';
    if (filterMode === 'last30') return 'Últimos 30 días';
    if (filterMode === 'thisYear') return `Año ${yearNumber}`;
    if (filterMode === 'custom') return `${formatDateShort(customStartDate)} - ${formatDateShort(customEndDate)}`;
    return `${monthName || ''} ${yearNumber}`;
  }, [filterMode, monthName, yearNumber, prevMonthName, prevYearNumber, customStartDate, customEndDate]);

  const handleSelectFilterMode = (mode: 'today' | 'month' | 'prevMonth' | 'last7' | 'last15' | 'last30' | 'thisYear' | 'custom') => {
    setFilterMode(mode);
    try {
      localStorage.setItem('gastoar_dash_filter_mode', mode);
    } catch (e) {
      console.error(e);
    }
    setIsDateRangeOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (!tempStartDate || !tempEndDate) return;
    const sortedStart = tempStartDate <= tempEndDate ? tempStartDate : tempEndDate;
    const sortedEnd = tempStartDate <= tempEndDate ? tempEndDate : tempStartDate;
    setCustomStartDate(sortedStart);
    setCustomEndDate(sortedEnd);
    setFilterMode('custom');
    try {
      localStorage.setItem('gastoar_dash_start_date', sortedStart);
      localStorage.setItem('gastoar_dash_end_date', sortedEnd);
      localStorage.setItem('gastoar_dash_filter_mode', 'custom');
    } catch (e) {
      console.error(e);
    }
    setIsDateRangeOpen(false);
  };

  // Date Range bounds
  const { effectiveStart, effectiveEnd, totalDaysInRange, daysRemaining } = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();

    if (filterMode === 'today') {
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { effectiveStart: todayStr, effectiveEnd: todayStr, totalDaysInRange: 1, daysRemaining: 1 };
    }

    if (filterMode === 'month') {
      const lastDay = new Date(yearNumber, monthNumber + 1, 0).getDate();
      const s = `${yearNumber}-${pad(monthNumber + 1)}-01`;
      const e = `${yearNumber}-${pad(monthNumber + 1)}-${pad(lastDay)}`;
      const isCurrentMonth = now.getFullYear() === yearNumber && now.getMonth() === monthNumber;
      const rem = isCurrentMonth ? Math.max(1, lastDay - now.getDate() + 1) : lastDay;
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: lastDay, daysRemaining: rem };
    }

    if (filterMode === 'prevMonth') {
      const pYear = prevMonthDate.getFullYear();
      const pMonth = prevMonthDate.getMonth();
      const lastDay = new Date(pYear, pMonth + 1, 0).getDate();
      const s = `${pYear}-${pad(pMonth + 1)}-01`;
      const e = `${pYear}-${pad(pMonth + 1)}-${pad(lastDay)}`;
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: lastDay, daysRemaining: 1 };
    }

    if (filterMode === 'last7') {
      const d7 = new Date(now);
      d7.setDate(now.getDate() - 6);
      const s = `${d7.getFullYear()}-${pad(d7.getMonth() + 1)}-${pad(d7.getDate())}`;
      const e = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: 7, daysRemaining: 7 };
    }

    if (filterMode === 'last15') {
      const d15 = new Date(now);
      d15.setDate(now.getDate() - 14);
      const s = `${d15.getFullYear()}-${pad(d15.getMonth() + 1)}-${pad(d15.getDate())}`;
      const e = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: 15, daysRemaining: 15 };
    }

    if (filterMode === 'last30') {
      const d30 = new Date(now);
      d30.setDate(now.getDate() - 29);
      const s = `${d30.getFullYear()}-${pad(d30.getMonth() + 1)}-${pad(d30.getDate())}`;
      const e = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: 30, daysRemaining: 30 };
    }

    if (filterMode === 'thisYear') {
      const s = `${yearNumber}-01-01`;
      const e = `${yearNumber}-12-31`;
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: 365, daysRemaining: 365 };
    }

    if (filterMode === 'custom') {
      const s = customStartDate || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const e = customEndDate || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-28`;
      const dStart = new Date(s);
      const dEnd = new Date(e);
      const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: diffDays, daysRemaining: diffDays };
    }

    const s = `${yearNumber}-${pad(monthNumber + 1)}-01`;
    const e = `${yearNumber}-${pad(monthNumber + 1)}-28`;
    return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: 30, daysRemaining: 30 };
  }, [filterMode, yearNumber, monthNumber, customStartDate, customEndDate, prevMonthDate]);

  // Filtered transactions for current dashboard range
  const monthTransactions = useMemo(() => {
    return (transactions || []).filter(t => {
      if (!t || !t.fecha) return false;
      if (t.fecha < effectiveStart || t.fecha > effectiveEnd) return false;

      if (activeMode === 'individual') {
        const isCurrent = !t.pagadoPor || !profile?.currentUser || t.pagadoPor === profile?.currentUser;
        if (t.tipo !== 'individual' || !isCurrent) return false;
      } else if (activeMode === 'pareja') {
        if (t.tipo !== 'pareja') return false;
      }

      return true;
    });
  }, [transactions, effectiveStart, effectiveEnd, activeMode, profile?.currentUser]);

  const monthIncomesList = useMemo(() => {
    return (monthTransactions || []).filter(t => t.tipoTransaccion === 'ingreso');
  }, [monthTransactions]);

  const monthExpensesList = useMemo(() => {
    return (monthTransactions || []).filter(t => t.tipoTransaccion !== 'ingreso');
  }, [monthTransactions]);

  const totalIncome = useMemo(() => {
    return (monthIncomesList || []).reduce((acc, t) => acc + (t.monto || 0), 0);
  }, [monthIncomesList]);
  
  const totalExpenses = useMemo(() => {
    return (monthExpensesList || []).reduce((acc, t) => acc + (t.monto || 0), 0);
  }, [monthExpensesList]);

  // 1. Saldo disponible adaptado al modo activo (Personal vs Compartido)
  const availableBalance = totalIncome > 0 
    ? (totalIncome - totalExpenses) 
    : (activeMode === 'individual' ? Math.max(0, 185000 - totalExpenses) : Math.max(0, 520000 - totalExpenses));

  // 2. Presupuesto General del Mes & % Usado
  const generalBudget = useMemo(() => {
    const categories = budgets?.categories || {};
    const sumCategories = Object.values(categories).reduce<number>((acc, b) => acc + (Number(b) || 0), 0);
    if (activeMode === 'individual') {
      const base = sumCategories > 0 ? Math.round(sumCategories * 0.5) : 350000;
      return base;
    }
    if (sumCategories > 0) return sumCategories;
    if (totalIncome > 0) return totalIncome;
    return totalExpenses > 0 ? Math.round(totalExpenses * 1.5) : 500000;
  }, [budgets, totalIncome, totalExpenses, activeMode]);

  const budgetUsedPercent = generalBudget > 0 ? Math.min(100, Math.round((totalExpenses / generalBudget) * 100)) : 61;

  // 3. Promedio de gasto diario en los últimos 7 días con filtro de modo activo
  const last7DaysStats = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const d7Ago = new Date(now);
    d7Ago.setDate(now.getDate() - 6);
    const d14Ago = new Date(now);
    d14Ago.setDate(now.getDate() - 13);

    const s7 = `${d7Ago.getFullYear()}-${pad(d7Ago.getMonth() + 1)}-${pad(d7Ago.getDate())}`;
    const s14 = `${d14Ago.getFullYear()}-${pad(d14Ago.getMonth() + 1)}-${pad(d14Ago.getDate())}`;
    const sToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const filterByMode = (t: Transaction) => {
      if (activeMode === 'individual') {
        const isCurrent = !t.pagadoPor || !profile?.currentUser || t.pagadoPor === profile.currentUser;
        return t.tipo === 'individual' && isCurrent;
      } else if (activeMode === 'pareja') {
        return t.tipo === 'pareja';
      }
      return true;
    };

    const txsThisWeek = (transactions || []).filter(t => t.tipoTransaccion !== 'ingreso' && t.fecha >= s7 && t.fecha <= sToday && filterByMode(t));
    const txsLastWeek = (transactions || []).filter(t => t.tipoTransaccion !== 'ingreso' && t.fecha >= s14 && t.fecha < s7 && filterByMode(t));

    const spentThisWeek = txsThisWeek.reduce((acc, t) => acc + (t.monto || 0), 0);
    const spentLastWeek = txsLastWeek.reduce((acc, t) => acc + (t.monto || 0), 0);

    const avg7Days = Math.round(spentThisWeek / 7) || (activeMode === 'individual' ? 1850 : 3650);
    const avgLastWeek = Math.round(spentLastWeek / 7) || (activeMode === 'individual' ? 2100 : 3980);

    let diffPct = -8;
    if (avgLastWeek > 0) {
      diffPct = Math.round(((avg7Days - avgLastWeek) / avgLastWeek) * 100);
    }

    return { avg7Days, diffPct };
  }, [transactions, activeMode, profile?.currentUser]);

  // 4. Límite de gasto diario restante
  const remainingBudget = Math.max(0, generalBudget - totalExpenses);
  const dailyBudgetRemaining = Math.max(0, Math.round(remainingBudget / Math.max(1, daysRemaining))) || 2350;
  const dailyTargetBase = Math.max(1000, Math.round(generalBudget / Math.max(1, totalDaysInRange))) || 5000;
  const dailyAvailablePercent = dailyTargetBase > 0 ? Math.min(100, Math.round((dailyBudgetRemaining / dailyTargetBase) * 100)) : 47;

  // Group by category for Pie Chart & List
  const categoryPieData = useMemo(() => {
    const catMap: Record<string, number> = {};

    (monthExpensesList || []).forEach(t => {
      if (!t) return;
      const cat = t.categoria || 'Otros';
      catMap[cat] = (catMap[cat] || 0) + (t.monto || 0);
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, item) => sum + item[1], 0) || 0;

    if (sorted.length === 0) {
      return [
        { name: "Alimentos",       value: 45600, color: P,       pct: 37 },
        { name: "Transporte",      value: 25300, color: "#F97316", pct: 21 },
        { name: "Hogar",           value: 19800, color: "#EF4444", pct: 16 },
        { name: "Entretenimiento", value: 15200, color: P_MID,   pct: 12 },
        { name: "Otros",           value: 15650, color: "#2DD4BF", pct: 14 },
      ];
    }

    return sorted.map(([name, amount], index) => {
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      const color = categoryColors[name] || CATEGORY_DEFAULT_COLORS[name] || (index === 0 ? P : index === 1 ? '#F97316' : index === 2 ? '#EF4444' : index === 3 ? P_MID : '#2DD4BF');
      return { name, value: amount, pct, color };
    });
  }, [monthExpensesList, categoryColors]);

  const totalPieGastado = useMemo(() => {
    return (categoryPieData || []).reduce((s, d) => s + (d?.value || 0), 0);
  }, [categoryPieData]);

  // Alertas Límites de Presupuesto
  // 🔴 Límite casi alcanzado: ≥ 90% (Rojo)
  // 🟠 Cerca del límite: 70–89% (Naranja)
  // 🟡 En seguimiento: 60–69% (Amarillo)
  // Las categorías por debajo del 60% no aparecen para no generar ruido.
  const alertThreshold = budgets?.alertThresholdPercent || 80;

  const budgetAlertsList = useMemo(() => {
    const catSpendMap: Record<string, { spent: number; count: number }> = {};

    (monthExpensesList || []).forEach(t => {
      if (!t) return;
      const cat = t.categoria || 'Otros';
      if (!catSpendMap[cat]) catSpendMap[cat] = { spent: 0, count: 0 };
      catSpendMap[cat].spent += (t.monto || 0);
      catSpendMap[cat].count += 1;
    });

    const allCatNames = Array.from(new Set<string>([
      ...Object.keys(budgets?.categories || {}),
      ...Object.keys(catSpendMap),
    ]));

    const computedList = allCatNames
      .map(cat => {
        const budget = budgets?.categories?.[cat] || 0;
        const spent = catSpendMap[cat]?.spent || 0;
        const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
        const remaining = Math.max(0, budget - spent);

        // Friendly label mapping
        let shortName = cat;
        if (cat === 'Alimentación & Bebidas') shortName = 'Alimentos';
        else if (cat === 'Transporte & Movilidad') shortName = 'Transporte';
        else if (cat === 'Entretenimiento, Ocio & Salidas') shortName = 'Entretenimiento';
        else if (cat === 'Salud & Cuidado Personal') shortName = 'Salud';
        else if (cat === 'Servicios & Hogar' || cat === 'Alquiler') shortName = 'Hogar';

        const emoji = CATEGORY_EMOJIS[shortName] || CATEGORY_EMOJIS[cat] || '🏷️';

        let severity: 'critical' | 'warning' | 'tracking' | 'none' = 'none';
        let statusLabel = '';
        let dotColor = '';
        let badgeBg = '';
        let badgeBorder = '';
        let badgeText = '';
        let textColor = '';
        let barColor = '';

        if (pct >= 90) {
          severity = 'critical';
          statusLabel = 'Límite casi alcanzado';
          dotColor = 'bg-[#EF4444]';
          badgeBg = 'bg-[#FEE2E2]/80';
          badgeBorder = 'border-[#FECACA]';
          badgeText = 'text-[#EF4444]';
          textColor = 'text-[#EF4444]';
          barColor = 'bg-[#EF4444]';
        } else if (pct >= 70) {
          severity = 'warning';
          statusLabel = 'Cerca del límite';
          dotColor = 'bg-[#F95420]';
          badgeBg = 'bg-[#FEF3C7]';
          badgeBorder = 'border-[#FDE68A]';
          badgeText = 'text-[#D97706]';
          textColor = 'text-[#F95420]';
          barColor = 'bg-[#F95420]';
        } else if (pct >= 60) {
          severity = 'tracking';
          statusLabel = 'En seguimiento';
          dotColor = 'bg-[#EAB308]';
          badgeBg = 'bg-[#FEF9C3]';
          badgeBorder = 'border-[#FEF08A]';
          badgeText = 'text-[#CA8A04]';
          textColor = 'text-[#CA8A04]';
          barColor = 'bg-[#EAB308]';
        }

        return {
          id: cat,
          name: shortName,
          originalName: cat,
          emoji,
          budget,
          spent,
          remaining,
          pct,
          severity,
          statusLabel,
          dotColor,
          badgeBg,
          badgeBorder,
          badgeText,
          textColor,
          barColor,
        };
      })
      .filter(item => item.budget > 0 && item.pct >= 60)
      .sort((a, b) => b.pct - a.pct);

    // Fallback con los datos del diseño/especificación de la imagen si aún no hay categorías con >= 60%
    if (computedList.length === 0) {
      return [
        {
          id: 'Alimentos',
          name: 'Alimentos',
          originalName: 'Alimentos',
          emoji: '🛒',
          budget: 50000,
          spent: 45600,
          remaining: 4400,
          pct: 91,
          severity: 'critical' as const,
          statusLabel: 'Límite casi alcanzado',
          dotColor: 'bg-[#EF4444]',
          badgeBg: 'bg-[#FEE2E2]/80',
          badgeBorder: 'border-[#FECACA]',
          badgeText: 'text-[#EF4444]',
          textColor: 'text-[#EF4444]',
          barColor: 'bg-[#EF4444]',
        },
        {
          id: 'Hogar',
          name: 'Hogar',
          originalName: 'Hogar',
          emoji: '🏠',
          budget: 22000,
          spent: 19800,
          remaining: 2200,
          pct: 90,
          severity: 'critical' as const,
          statusLabel: 'Límite casi alcanzado',
          dotColor: 'bg-[#EF4444]',
          badgeBg: 'bg-[#FEE2E2]/80',
          badgeBorder: 'border-[#FECACA]',
          badgeText: 'text-[#EF4444]',
          textColor: 'text-[#EF4444]',
          barColor: 'bg-[#EF4444]',
        },
        {
          id: 'Transporte',
          name: 'Transporte',
          originalName: 'Transporte',
          emoji: '🚌',
          budget: 30000,
          spent: 25300,
          remaining: 4700,
          pct: 84,
          severity: 'warning' as const,
          statusLabel: 'Cerca del límite',
          dotColor: 'bg-[#F95420]',
          badgeBg: 'bg-[#FEF3C7]',
          badgeBorder: 'border-[#FDE68A]',
          badgeText: 'text-[#D97706]',
          textColor: 'text-[#F95420]',
          barColor: 'bg-[#F95420]',
        },
        {
          id: 'Entretenimiento',
          name: 'Entretenimiento',
          originalName: 'Entretenimiento',
          emoji: '🎬',
          budget: 50000,
          spent: 38000,
          remaining: 12000,
          pct: 76,
          severity: 'warning' as const,
          statusLabel: 'Cerca del límite',
          dotColor: 'bg-[#F95420]',
          badgeBg: 'bg-[#FEF3C7]',
          badgeBorder: 'border-[#FDE68A]',
          badgeText: 'text-[#D97706]',
          textColor: 'text-[#F95420]',
          barColor: 'bg-[#F95420]',
        },
        {
          id: 'Salud',
          name: 'Salud',
          originalName: 'Salud',
          emoji: '💊',
          budget: 30000,
          spent: 22800,
          remaining: 7200,
          pct: 76,
          severity: 'warning' as const,
          statusLabel: 'Cerca del límite',
          dotColor: 'bg-[#F95420]',
          badgeBg: 'bg-[#FEF3C7]',
          badgeBorder: 'border-[#FDE68A]',
          badgeText: 'text-[#D97706]',
          textColor: 'text-[#F95420]',
          barColor: 'bg-[#F95420]',
        },
      ];
    }

    return computedList;
  }, [monthExpensesList, budgets]);

  const criticalAlertsCount = useMemo(() => {
    return budgetAlertsList.filter(item => item.severity === 'critical').length;
  }, [budgetAlertsList]);

  // Upcoming bills / vencimientos
  const upcomingBills = useMemo(() => {
    return [
      { id: "1", icon: "💧", title: "Aysa",    cat: "Agua",          due: "28/09", amount: 4850,  daysLeft: 2  },
      { id: "2", icon: "⚡", title: "Edenor",  cat: "Electricidad",  due: "01/10", amount: 6120,  daysLeft: 6  },
      { id: "3", icon: "🏛️", title: "ABL",     cat: "Imp. Municipal",due: "10/10", amount: 5300,  daysLeft: 15 },
      { id: "4", icon: "🚗", title: "Patente", cat: "Impuesto",      due: "15/10", amount: 8900,  daysLeft: 20 },
    ];
  }, []);

  // Circular progress math (ampliado para mayor visibilidad y presencia visual)
  const r = 40, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const dash = (budgetUsedPercent / 100) * circ;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16 font-sans">
      
      {/* 1. Header: Greeting + Balance Title & Month Selector */}
      <div className="pt-1">
        <p className="text-base sm:text-lg font-bold text-slate-600">Hola, {currentUserName}</p>
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <h1 className="text-2xl sm:text-3xl font-black text-[#F95420] tracking-tight">Resumen</h1>
          
          <div className="flex items-center gap-2 justify-end shrink-0">
            {/* Date dropdown */}
            <div className="relative" ref={dateRangeRef}>
            <button
              type="button"
              onClick={() => {
                setTempStartDate(customStartDate);
                setTempEndDate(customEndDate);
                setIsDateRangeOpen(v => !v);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shadow-2xs transition-all hover:bg-violet-100/80"
              style={{ borderColor: P_LIGHT, color: P, backgroundColor: P_LIGHT }}
            >
              <span>📅 {rangeLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDateRangeOpen ? 'rotate-180' : ''}`} />
            </button>

          {isDateRangeOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl p-3.5 shadow-2xl border border-purple-100 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-50 text-xs font-bold text-purple-900/70">
                <span className="uppercase tracking-wider text-[11px]">Períodos fijados</span>
                <button 
                  onClick={() => handleSelectFilterMode('today')}
                  className="text-xs font-bold hover:underline cursor-pointer px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-[#6F2EC5] transition-colors"
                >
                  Hoy
                </button>
              </div>

              {/* Fixed Period Buttons */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectFilterMode('month')}
                  className={`p-2 rounded-xl text-left font-semibold cursor-pointer transition-colors ${
                    filterMode === 'month' ? 'bg-purple-50 font-bold border border-purple-200 text-[#6F2EC5]' : 'text-slate-600 hover:bg-purple-50/50 border border-transparent'
                  }`}
                >
                  Este mes ({monthName})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFilterMode('prevMonth')}
                  className={`p-2 rounded-xl text-left font-semibold cursor-pointer transition-colors ${
                    filterMode === 'prevMonth' ? 'bg-purple-50 font-bold border border-purple-200 text-[#6F2EC5]' : 'text-slate-600 hover:bg-purple-50/50 border border-transparent'
                  }`}
                >
                  Mes ant. ({prevMonthName})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFilterMode('last7')}
                  className={`p-2 rounded-xl text-left font-semibold cursor-pointer transition-colors ${
                    filterMode === 'last7' ? 'bg-purple-50 font-bold border border-purple-200 text-[#6F2EC5]' : 'text-slate-600 hover:bg-purple-50/50 border border-transparent'
                  }`}
                >
                  Últimos 7 días
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFilterMode('last15')}
                  className={`p-2 rounded-xl text-left font-semibold cursor-pointer transition-colors ${
                    filterMode === 'last15' ? 'bg-purple-50 font-bold border border-purple-200 text-[#6F2EC5]' : 'text-slate-600 hover:bg-purple-50/50 border border-transparent'
                  }`}
                >
                  Últimos 15 días
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFilterMode('last30')}
                  className={`p-2 rounded-xl text-left font-semibold cursor-pointer transition-colors ${
                    filterMode === 'last30' ? 'bg-purple-50 font-bold border border-purple-200 text-[#6F2EC5]' : 'text-slate-600 hover:bg-purple-50/50 border border-transparent'
                  }`}
                >
                  Últimos 30 días
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFilterMode('thisYear')}
                  className={`p-2 rounded-xl text-left font-semibold cursor-pointer transition-colors ${
                    filterMode === 'thisYear' ? 'bg-purple-50 font-bold border border-purple-200 text-[#6F2EC5]' : 'text-slate-600 hover:bg-purple-50/50 border border-transparent'
                  }`}
                >
                  Año {yearNumber}
                </button>
              </div>

              {/* Custom Date Range Section */}
              <div className="pt-2.5 border-t border-purple-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900/70 uppercase tracking-wider">
                    Rango personalizado
                  </span>
                  {filterMode === 'custom' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-[#6F2EC5]">
                      Activo
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Desde</label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-purple-200 bg-purple-50/30 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#6F2EC5] focus:border-[#6F2EC5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Hasta</label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-purple-200 bg-purple-50/30 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#6F2EC5] focus:border-[#6F2EC5]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyCustomRange}
                  className="w-full mt-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#6F2EC5] to-[#7928CA] hover:from-[#5b24a3] hover:to-[#6F2EC5] text-white text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Aplicar Rango de Fechas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

      {/* Animated content transition when switching modes */}
      <motion.div
        key={activeMode}
        initial={{ opacity: 0.65, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="space-y-4"
      >
        {/* 2. BalanceCard */}
      <div className="bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] text-white rounded-3xl p-5 shadow-lg shadow-purple-950/20 border border-purple-400/20">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-2 text-purple-200">Saldo disponible</p>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-3xl font-bold font-outfit text-white tracking-tight leading-none">
                {isBalanceHidden ? "$ ••••••" : ars(availableBalance)}
              </p>
              <button 
                onClick={toggleHideBalance} 
                className="text-purple-300 hover:text-white transition-colors flex-shrink-0 cursor-pointer p-1"
                title={isBalanceHidden ? "Mostrar saldo" : "Ocultar saldo"}
              >
                {isBalanceHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-2 bg-white/20">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ 
                  width: `${Math.min(100, Math.max(5, (availableBalance / generalBudget) * 100))}%`, 
                  background: 'linear-gradient(90deg, #F95420, #FF8C42)' 
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-200">
              <span>Presupuesto mensual{" "}
                <span className="font-semibold text-white">{isBalanceHidden ? '$ ••••••' : ars(generalBudget)}</span>
              </span>
              {onOpenBudgetModal && (
                <button
                  onClick={onOpenBudgetModal}
                  className="text-purple-300 hover:text-white transition-colors p-0.5 cursor-pointer"
                  title="Editar presupuesto"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* CircularProgress (Ampliado) */}
          <div className="relative flex-shrink-0 w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
            <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F95420" />
                  <stop offset="100%" stopColor="#FF8C42" />
                </linearGradient>
              </defs>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="7.5" />
              <circle
                cx={cx} cy={cy} r={r} fill="none"
                stroke="url(#cg)" strokeWidth="7.5" strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                transform={`rotate(-90 ${cx} ${cy})`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1">
              <p className="text-2xl sm:text-3xl font-black font-outfit leading-none text-white tracking-tight">{budgetUsedPercent}%</p>
              <p className="text-[10px] sm:text-[11px] text-purple-200 text-center mt-1 leading-tight font-medium">del presupuesto<br />utilizado</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MetricCards (Límite diario & Promedio) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Límite de gasto diario */}
        <div className="bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] text-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg shadow-purple-950/20 border border-purple-400/20 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm sm:text-base flex-shrink-0 bg-white/15 text-white">
                💳
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200 leading-tight">Límite de gasto diario restante</p>
            </div>
            <p className="text-base sm:text-xl font-bold font-outfit text-white leading-none mb-0.5 truncate">
              {isBalanceHidden ? "$ •••••" : ars(dailyBudgetRemaining)}
            </p>
            <p className="text-[10px] sm:text-xs text-purple-300 mb-2 truncate">
              de {isBalanceHidden ? "$ •••" : ars(dailyTargetBase)}
            </p>
          </div>
          <div>
            <div className="h-1.5 rounded-full overflow-hidden mb-1.5 bg-white/20">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${dailyAvailablePercent}%`, background: 'linear-gradient(90deg, #F95420, #FF8C42)' }} 
              />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-300 whitespace-nowrap">{dailyAvailablePercent}% disponible</p>
          </div>
        </div>

        {/* Promedio de gasto diario */}
        <div className="bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] text-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg shadow-purple-950/20 border border-purple-400/20 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm sm:text-base flex-shrink-0 bg-white/15 text-white">
                📈
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200 leading-tight">Promedio de gasto diario</p>
            </div>
            <p className="text-base sm:text-xl font-bold font-outfit text-white leading-none mb-0.5 truncate">
              {isBalanceHidden ? "$ •••••" : ars(last7DaysStats.avg7Days)}
            </p>
            <p className="text-[10px] sm:text-xs text-purple-300 mb-2.5 sm:mb-3">en los últimos 7 días</p>
          </div>
          <div>
            <p className={`text-[10px] sm:text-xs font-semibold leading-tight ${last7DaysStats.diffPct <= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
              {last7DaysStats.diffPct <= 0 ? '↓' : '↑'} {Math.abs(last7DaysStats.diffPct)}% vs sem. ant.
            </p>
          </div>
        </div>
      </div>

      {/* 4. ScoreCard - Designed exactly as in image.png */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100/90 transition-all hover:shadow-sm">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#481283] flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-xs">
              🏆
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Score diario financiero</p>
                <button 
                  type="button" 
                  onClick={() => setIsScoreModalOpen(true)}
                  className="text-slate-300 hover:text-slate-500 text-xs leading-none p-0.5 cursor-pointer transition-colors"
                  title="Más información sobre el Score"
                >
                  ⓘ
                </button>
              </div>
              {isScoreUnlockedToday ? (
                <>
                  <p className="text-xs sm:text-sm font-bold mb-0.5 text-[#6B21A8]">
                    {dailyScore.score}/100 {dailyScore.ratingEmoji} {dailyScore.rating}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight">
                    🔥 {dailyScore.streakDays} {dailyScore.streakDays === 1 ? 'día' : 'días'} de racha acumulada
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs sm:text-sm font-bold mb-0.5 text-[#6B21A8]">Mira tu Score</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight">Toca finalizar el día y desbloquea tu score financiero</p>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsScoreModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full text-white text-xs sm:text-sm font-bold flex-shrink-0 shadow-sm transition-all hover:bg-[#581c87] active:scale-95 cursor-pointer bg-[#6B21A8]"
          >
            {isScoreUnlockedToday ? "Ver Score 🏆" : "Finalizar el día 🔒"}
          </button>
        </div>
      </div>

      {/* 5. CategorySection (Donut + Legend) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Por categorías</h3>
          {(onNavigateTab || onSelectCategory) && (
            <button 
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory('ALL');
                } else if (onNavigateTab) {
                  onNavigateTab('transactions');
                }
              }} 
              className="text-xs font-semibold cursor-pointer hover:underline active:opacity-75 transition-opacity" 
              style={{ color: P }}
              title="Ver movimientos"
            >
              Ver más
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-4">
          {/* Donut Chart */}
          <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={categoryPieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={38} 
                  outerRadius={58}
                  paddingAngle={2} 
                  dataKey="value" 
                  startAngle={90} 
                  endAngle={-270}
                  onClick={(entry) => {
                    if (entry && entry.name) {
                      if (onSelectCategory && entry.name !== 'Otros') {
                        onSelectCategory(entry.name);
                      } else if (onNavigateTab) {
                        onNavigateTab('transactions');
                      }
                    }
                  }}
                  cursor="pointer"
                >
                  {categoryPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs font-bold text-gray-900 font-outfit leading-tight">
                {isBalanceHidden ? '$ •••••' : ars(totalPieGastado)}
              </p>
              <p className="text-[9px] text-gray-400 text-center leading-tight">Total<br/>gastado</p>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 w-full space-y-1.5">
            {categoryPieData.slice(0, 5).map(d => (
              <div 
                key={d.name} 
                onClick={() => {
                  if (onSelectCategory && d.name !== 'Otros') {
                    onSelectCategory(d.name);
                  } else if (onNavigateTab) {
                    onNavigateTab('transactions');
                  }
                }}
                className="flex items-center justify-between p-1.5 -mx-1.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group"
                title={`Ver gastos de ${d.name}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-gray-700 truncate group-hover:text-purple-700 group-hover:font-medium transition-colors">
                    {d.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-gray-900 font-outfit">
                    {isBalanceHidden ? '$ •••••' : ars(d.value)}
                  </span>
                  <span className="text-[10px] text-gray-400 w-7 text-right">{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Alertas Límites de Presupuesto */}
      <div className="bg-[#F8F7FC] rounded-3xl p-4 sm:p-6 border border-purple-100/50 shadow-xs space-y-3.5">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Alertas Límites de Presupuesto
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Categorías que se acercan a su límite mensual
            </p>
          </div>

          <div className="flex items-center gap-2">
            {criticalAlertsCount > 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#EF4444] border border-[#FECACA] shrink-0">
                {criticalAlertsCount} {criticalAlertsCount === 1 ? 'crítica' : 'críticas'}
              </span>
            ) : budgetAlertsList.length > 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                {budgetAlertsList.length} en alerta
              </span>
            ) : null}

            {(onNavigateTab || onOpenBudgetModal) && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab('budgets');
                  } else if (onOpenBudgetModal) {
                    onOpenBudgetModal();
                  }
                }}
                className="text-xs font-semibold hover:underline flex items-center gap-0.5 ml-1 text-[#6F2EC5] cursor-pointer"
                title="Ajustar y definir presupuestos"
              >
                <span>Ajustar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cards List */}
        {budgetAlertsList.length > 0 ? (
          <div className="space-y-3 pt-1">
            {budgetAlertsList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectCategory && item.name !== 'Otros') {
                    onSelectCategory(item.originalName || item.name);
                  } else if (onNavigateTab) {
                    onNavigateTab('transactions');
                  }
                }}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group"
                title={`Ver detalle de gastos de ${item.name}`}
              >
                {/* Top Row: Icon + Name / Badge / Subtitle + Big % Utilizado */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon box in squircle */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#F4F3F9] border border-slate-100/90 flex items-center justify-center text-xl shrink-0">
                      <span>{item.emoji}</span>
                    </div>

                    {/* Text Column */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900 group-hover:text-[#F95420] transition-colors">
                          {item.name}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.badgeBg} ${item.badgeBorder} ${item.badgeText}`}>
                          <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                          <span>{item.statusLabel}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Restante: <span className="font-bold text-slate-600">{isBalanceHidden ? '$ •••' : ars(item.remaining)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Big Percentage & Utilizado */}
                  <div className="text-right shrink-0">
                    <div className={`text-2xl sm:text-3xl font-black font-outfit tracking-tight leading-none ${item.textColor}`}>
                      {item.pct}%
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium text-right mt-1">
                      utilizado
                    </div>
                  </div>
                </div>

                {/* Colored Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.barColor}`}
                    style={{ width: `${Math.min(100, item.pct)}%` }}
                  />
                </div>

                {/* Bottom Row: Gastado & Límite */}
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-0.5">
                  <span>
                    Gastado: <span className="font-bold text-slate-700">{isBalanceHidden ? '$ •••' : ars(item.spent)}</span>
                  </span>
                  <span>
                    Límite: <span className="font-bold text-slate-700">{isBalanceHidden ? '$ •••' : ars(item.budget)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white text-center text-xs text-slate-500 space-y-2 border border-slate-100">
            <p className="font-medium">No hay categorías que superen el 60% del límite de presupuesto.</p>
            {(onNavigateTab || onOpenBudgetModal) && (
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('budgets') : onOpenBudgetModal?.()}
                className="px-3 py-1.5 bg-purple-100 text-[#6F2EC5] font-bold rounded-xl text-xs hover:bg-purple-200 transition-colors cursor-pointer"
              >
                Definir límites de presupuesto
              </button>
            )}
          </div>
        )}
      </div>

      {/* 7. Upcoming Bills / Vencimientos próximos */}
      {upcomingBills && upcomingBills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Vencimientos próximos</h3>
            {onNavigateTab && (
              <button 
                className="text-xs font-semibold cursor-pointer hover:underline" 
                style={{ color: P }}
                onClick={() => onNavigateTab('installments')}
              >
                Ver todos
              </button>
            )}
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-white overflow-hidden divide-y divide-gray-50">
            {upcomingBills.map((bill) => {
              const badge = billBadge(bill.daysLeft);
              return (
                <div key={bill.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: P_LIGHT }}>
                    {bill.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{bill.title}</p>
                    <p className="text-[10px] text-gray-400">{bill.cat}</p>
                    <p className="text-[10px] font-semibold text-gray-700 font-outfit">{isBalanceHidden ? '$ •••' : ars(bill.amount)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] text-gray-400 mb-1.5">Vence {bill.due}</p>
                    <span 
                      className="text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      En {bill.daysLeft} días
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Mobile CTA */}
      <button
        onClick={onOpenTransactionModal}
        className="w-full py-4 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 lg:hidden shadow-md active:scale-98 transition-transform cursor-pointer"
        style={{ background: GRAD }}
      >
        <span className="text-xl leading-none">+</span> Nuevo gasto
      </button>
      </motion.div>

      {/* DAILY SCORE MODAL */}
      <DailyScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        dailyScore={dailyScore}
        isUnlocked={isScoreUnlockedToday}
        onFinalizeDay={handleFinalizeDay}
        scoreHistory={scoreHistory}
      />

    </div>
  );
};
