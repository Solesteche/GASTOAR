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
const P = "#6F2EC5";
const P_MID = "#A78BFA";
const P_LIGHT = "#EDE9FE";
const GRAD = `linear-gradient(90deg, #F97316 0%, ${P} 100%)`;
const GRAD_ICON = `linear-gradient(135deg, ${P_MID}, ${P})`;

// ─── Tipo Vencimiento ─────────────────────────────────────────────────────────
// Si ya tenés este tipo en types.ts, eliminá esta definición local
export interface Vencimiento {
  id: string;
  icon: string;
  title: string;
  cat: string;
  amount: number;
  dueDate: string;      // ISO "YYYY-MM-DD"
  isPaid?: boolean;
  isRecurring?: boolean;
  notes?: string;
}

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
  // ─── FIX 2: props de vencimientos reales ──────────────────────────────────
  vencimientos?: Vencimiento[];
  onMarkVencimientoPaid?: (id: string) => void;
  onDeleteVencimiento?: (id: string) => void;
  onAddVencimiento?: (v: Omit<Vencimiento, 'id'>) => void;
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
  if (days < 0)   return { bg: "#FEE2E2", color: "#DC2626" }; // vencido
  if (days <= 3)  return { bg: P_LIGHT, color: P };
  if (days <= 7)  return { bg: "#FEF3C7", color: "#D97706" };
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
  // ─── FIX 2: nuevas props ──────────────────────────────────────────────────
  vencimientos = [],
  onMarkVencimientoPaid,
  onDeleteVencimiento,
  onAddVencimiento,
}) => {

  const isUser1 = profile?.currentUser === 'user1';
  const currentUserName = profile ? (isUser1 ? profile.user1Name : profile.user2Name) : 'Sol';

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

  // ─── FIX 2: pasar vencimientos al scoreEngine ─────────────────────────────
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

  // Date filter state (sin cambios)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [filterMode, setFilterMode] = useState<
    'today' | 'month' | 'prevMonth' | 'last7' | 'last15' | 'last30' | 'thisYear' | 'custom'
  >(() => {
    try { return (localStorage.getItem('gastoar_dash_filter_mode') as any) || 'month'; } catch { return 'month'; }
  });

  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    try { return localStorage.getItem('gastoar_dash_start_date') || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`; }
    catch { return `${now.getFullYear()}-01-01`; }
  });

  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    try { return localStorage.getItem('gastoar_dash_end_date') || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`; }
    catch { return `${now.getFullYear()}-12-31`; }
  });

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
    if (isDateRangeOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDateRangeOpen]);

  const yearNumber  = selectedDate.getFullYear();
  const monthNumber = selectedDate.getMonth();
  const monthName   = MONTH_NAMES[monthNumber];
  const prevMonthDate = useMemo(() => new Date(yearNumber, monthNumber - 1, 1), [yearNumber, monthNumber]);
  const prevMonthName = MONTH_NAMES[prevMonthDate.getMonth()];
  const prevYearNumber = prevMonthDate.getFullYear();

  const formatDateShort = (isoStr: any) => {
    if (!isoStr || typeof isoStr !== 'string') return '';
    const parts = isoStr.split('-');
    if (parts && parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    return String(isoStr);
  };

  const rangeLabel = useMemo(() => {
    const now = new Date();
    if (filterMode === 'today')     return `Hoy (${now.getDate()} ${monthName?.slice(0, 3) ?? ''})`;
    if (filterMode === 'month')     return `${monthName || ''} ${yearNumber}`;
    if (filterMode === 'prevMonth') return `${prevMonthName || ''} ${prevYearNumber}`;
    if (filterMode === 'last7')     return 'Últimos 7 días';
    if (filterMode === 'last15')    return 'Últimos 15 días';
    if (filterMode === 'last30')    return 'Últimos 30 días';
    if (filterMode === 'thisYear')  return `Año ${yearNumber}`;
    if (filterMode === 'custom')    return `${formatDateShort(customStartDate)} - ${formatDateShort(customEndDate)}`;
    return `${monthName || ''} ${yearNumber}`;
  }, [filterMode, monthName, yearNumber, prevMonthName, prevYearNumber, customStartDate, customEndDate]);

  const handleSelectFilterMode = (mode: typeof filterMode) => {
    setFilterMode(mode);
    try { localStorage.setItem('gastoar_dash_filter_mode', mode); } catch (e) { console.error(e); }
    setIsDateRangeOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (!tempStartDate || !tempEndDate) return;
    const sortedStart = tempStartDate <= tempEndDate ? tempStartDate : tempEndDate;
    const sortedEnd   = tempStartDate <= tempEndDate ? tempEndDate   : tempStartDate;
    setCustomStartDate(sortedStart);
    setCustomEndDate(sortedEnd);
    setFilterMode('custom');
    try {
      localStorage.setItem('gastoar_dash_start_date', sortedStart);
      localStorage.setItem('gastoar_dash_end_date', sortedEnd);
      localStorage.setItem('gastoar_dash_filter_mode', 'custom');
    } catch (e) { console.error(e); }
    setIsDateRangeOpen(false);
  };

  const { effectiveStart, effectiveEnd, totalDaysInRange, daysRemaining } = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    if (filterMode === 'today') {
      const t = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { effectiveStart: t, effectiveEnd: t, totalDaysInRange: 1, daysRemaining: 1 };
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
      const d = new Date(now); d.setDate(now.getDate() - 6);
      const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const e = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: 7, daysRemaining: 7 };
    }
    if (filterMode === 'last15') {
      const d = new Date(now); d.setDate(now.getDate() - 14);
      const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const e = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: 15, daysRemaining: 15 };
    }
    if (filterMode === 'last30') {
      const d = new Date(now); d.setDate(now.getDate() - 29);
      const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const e = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: 30, daysRemaining: 30 };
    }
    if (filterMode === 'thisYear') {
      return { effectiveStart: `${yearNumber}-01-01`, effectiveEnd: `${yearNumber}-12-31`, totalDaysInRange: 365, daysRemaining: 365 };
    }
    if (filterMode === 'custom') {
      const s = customStartDate || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const e = customEndDate   || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-28`;
      const diffTime = Math.abs(new Date(e).getTime() - new Date(s).getTime());
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: diffDays, daysRemaining: diffDays };
    }
    const s = `${yearNumber}-${pad(monthNumber + 1)}-01`;
    const e = `${yearNumber}-${pad(monthNumber + 1)}-28`;
    return { effectiveStart: s, effectiveEnd: e, totalDaysInRange: 30, daysRemaining: 30 };
  }, [filterMode, yearNumber, monthNumber, customStartDate, customEndDate, prevMonthDate]);

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

  const monthIncomesList  = useMemo(() => monthTransactions.filter(t => t.tipoTransaccion === 'ingreso'),   [monthTransactions]);
  const monthExpensesList = useMemo(() => monthTransactions.filter(t => t.tipoTransaccion !== 'ingreso'),   [monthTransactions]);
  const totalIncome   = useMemo(() => monthIncomesList.reduce((acc, t)  => acc + (t.monto || 0), 0), [monthIncomesList]);
  const totalExpenses = useMemo(() => monthExpensesList.reduce((acc, t) => acc + (t.monto || 0), 0), [monthExpensesList]);

  // ─── FIX 1: balance real sin valores hardcodeados ─────────────────────────
  const availableBalance = totalIncome - totalExpenses;
  const hasNoIncomeData  = totalIncome === 0;

  const generalBudget = useMemo(() => {
    const categories = budgets?.categories || {};
    const sumCategories = Object.values(categories).reduce<number>((acc, b) => acc + (Number(b) || 0), 0);
    if (activeMode === 'individual') {
      return sumCategories > 0 ? Math.round(sumCategories * 0.5) : 0;
    }
    if (sumCategories > 0) return sumCategories;
    if (totalIncome > 0) return totalIncome;
    return 0; // sin inventar número
  }, [budgets, totalIncome, activeMode]);

  const budgetUsedPercent = generalBudget > 0
    ? Math.min(100, Math.round((totalExpenses / generalBudget) * 100))
    : 0;

  const last7DaysStats = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const d7Ago  = new Date(now); d7Ago.setDate(now.getDate() - 6);
    const d14Ago = new Date(now); d14Ago.setDate(now.getDate() - 13);
    const s7    = `${d7Ago.getFullYear()}-${pad(d7Ago.getMonth() + 1)}-${pad(d7Ago.getDate())}`;
    const s14   = `${d14Ago.getFullYear()}-${pad(d14Ago.getMonth() + 1)}-${pad(d14Ago.getDate())}`;
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

    const txsThisWeek = (transactions || []).filter(t => t.tipoTransaccion !== 'ingreso' && t.fecha >= s7  && t.fecha <= sToday && filterByMode(t));
    const txsLastWeek = (transactions || []).filter(t => t.tipoTransaccion !== 'ingreso' && t.fecha >= s14 && t.fecha < s7   && filterByMode(t));

    const spentThisWeek = txsThisWeek.reduce((acc, t) => acc + (t.monto || 0), 0);
    const spentLastWeek = txsLastWeek.reduce((acc, t) => acc + (t.monto || 0), 0);
    const avg7Days   = Math.round(spentThisWeek / 7);
    const avgLastWeek = Math.round(spentLastWeek / 7);
    const diffPct = avgLastWeek > 0 ? Math.round(((avg7Days - avgLastWeek) / avgLastWeek) * 100) : 0;
    return { avg7Days, diffPct };
  }, [transactions, activeMode, profile?.currentUser]);

  const remainingBudget = Math.max(0, generalBudget - totalExpenses);
  const dailyBudgetRemaining = generalBudget > 0 ? Math.max(0, Math.round(remainingBudget / Math.max(1, daysRemaining))) : 0;
  const dailyTargetBase = generalBudget > 0 ? Math.max(1, Math.round(generalBudget / Math.max(1, totalDaysInRange))) : 0;
  const dailyAvailablePercent = dailyTargetBase > 0 ? Math.min(100, Math.round((dailyBudgetRemaining / dailyTargetBase) * 100)) : 0;

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
      // Sin datos reales → devolver array vacío, no inventar
      return [];
    }
    return sorted.map(([name, amount], index) => {
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      const color = categoryColors[name] || CATEGORY_DEFAULT_COLORS[name] || (index === 0 ? P : index === 1 ? '#F97316' : index === 2 ? '#EF4444' : index === 3 ? P_MID : '#2DD4BF');
      return { name, value: amount, pct, color };
    });
  }, [monthExpensesList, categoryColors]);

  const totalPieGastado = useMemo(() => categoryPieData.reduce((s, d) => s + (d?.value || 0), 0), [categoryPieData]);

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

    return allCatNames
      .map(cat => {
        const budget  = budgets?.categories?.[cat] || 0;
        const spent   = catSpendMap[cat]?.spent || 0;
        const pct     = budget > 0 ? Math.round((spent / budget) * 100) : 0;
        const remaining = Math.max(0, budget - spent);

        let shortName = cat;
        if (cat === 'Alimentación & Bebidas')           shortName = 'Alimentos';
        else if (cat === 'Transporte & Movilidad')      shortName = 'Transporte';
        else if (cat === 'Entretenimiento, Ocio & Salidas') shortName = 'Entretenimiento';
        else if (cat === 'Salud & Cuidado Personal')    shortName = 'Salud';
        else if (cat === 'Servicios & Hogar' || cat === 'Alquiler') shortName = 'Hogar';

        const emoji = CATEGORY_EMOJIS[shortName] || CATEGORY_EMOJIS[cat] || '🏷️';

        let severity: 'critical' | 'warning' | 'tracking' | 'none' = 'none';
        let statusLabel = '', dotColor = '', badgeBg = '', badgeBorder = '', badgeText = '', textColor = '', barColor = '';

        if (pct >= 90) {
          severity = 'critical'; statusLabel = 'Límite casi alcanzado';
          dotColor = 'bg-[#EF4444]'; badgeBg = 'bg-[#FEE2E2]/80'; badgeBorder = 'border-[#FECACA]';
          badgeText = 'text-[#EF4444]'; textColor = 'text-[#EF4444]'; barColor = 'bg-[#EF4444]';
        } else if (pct >= 70) {
          severity = 'warning'; statusLabel = 'Cerca del límite';
          dotColor = 'bg-[#F95420]'; badgeBg = 'bg-[#FEF3C7]'; badgeBorder = 'border-[#FDE68A]';
          badgeText = 'text-[#D97706]'; textColor = 'text-[#F95420]'; barColor = 'bg-[#F95420]';
        } else if (pct >= 60) {
          severity = 'tracking'; statusLabel = 'En seguimiento';
          dotColor = 'bg-[#EAB308]'; badgeBg = 'bg-[#FEF9C3]'; badgeBorder = 'border-[#FEF08A]';
          badgeText = 'text-[#CA8A04]'; textColor = 'text-[#CA8A04]'; barColor = 'bg-[#EAB308]';
        }

        return { id: cat, name: shortName, originalName: cat, emoji, budget, spent, remaining, pct, severity, statusLabel, dotColor, badgeBg, badgeBorder, badgeText, textColor, barColor };
      })
      .filter(item => item.budget > 0 && item.pct >= 60)
      .sort((a, b) => b.pct - a.pct);
  }, [monthExpensesList, budgets]);

  const criticalAlertsCount = useMemo(() => budgetAlertsList.filter(item => item.severity === 'critical').length, [budgetAlertsList]);

  // ─── FIX 2: vencimientos dinámicos ───────────────────────────────────────
  const upcomingBills = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const todayKey = `${todayDate.getFullYear()}-${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}`;

    return vencimientos
      .filter(v => !v.isPaid)
      .map(v => {
        const due = new Date(v.dueDate + 'T00:00:00');
        const diffMs = due.getTime() - todayDate.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          id: v.id,
          icon: v.icon,
          title: v.title,
          cat: v.cat,
          due: `${pad(due.getDate())}/${pad(due.getMonth() + 1)}`,
          amount: v.amount,
          daysLeft,
          isOverdue: daysLeft < 0,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
  }, [vencimientos]);

  // Circular progress math
  const r = 40, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const dash  = (budgetUsedPercent / 100) * circ;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16 font-sans">

      {/* Header: Greeting + Month Selector */}
      <div className="pt-1">
        <p className="text-base sm:text-lg font-bold text-slate-600">Hola, {currentUserName}</p>
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <h1 className="text-2xl sm:text-3xl font-black text-[#F95420] tracking-tight">Resumen</h1>
          <div className="flex items-center gap-2 justify-end shrink-0">
            <div className="relative" ref={dateRangeRef}>
              <button
                type="button"
                onClick={() => { setTempStartDate(customStartDate); setTempEndDate(customEndDate); setIsDateRangeOpen(v => !v); }}
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
                    <button onClick={() => handleSelectFilterMode('today')} className="text-xs font-bold hover:underline cursor-pointer px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-[#6F2EC5] transition-colors">Hoy</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {([
                      ['month',     `Este mes (${monthName})`],
                      ['prevMonth', `Mes ant. (${prevMonthName})`],
                      ['last7',     'Últimos 7 días'],
                      ['last15',    'Últimos 15 días'],
                      ['last30',    'Últimos 30 días'],
                      ['thisYear',  `Año ${yearNumber}`],
                    ] as const).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleSelectFilterMode(mode)}
                        className={`p-2 rounded-xl text-left font-semibold cursor-pointer transition-colors ${filterMode === mode ? 'bg-purple-50 font-bold border border-purple-200 text-[#6F2EC5]' : 'text-slate-600 hover:bg-purple-50/50 border border-transparent'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2.5 border-t border-purple-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900/70 uppercase tracking-wider">Rango personalizado</span>
                      {filterMode === 'custom' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-[#6F2EC5]">Activo</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Desde</label>
                        <input type="date" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded-lg border border-purple-200 bg-purple-50/30 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#6F2EC5]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Hasta</label>
                        <input type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded-lg border border-purple-200 bg-purple-50/30 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#6F2EC5]" />
                      </div>
                    </div>
                    <button type="button" onClick={handleApplyCustomRange} className="w-full mt-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#6F2EC5] to-[#7928CA] hover:from-[#5b24a3] hover:to-[#6F2EC5] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5">
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

      <motion.div
        key={activeMode}
        initial={{ opacity: 0.65, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="space-y-4"
      >
        {/* BalanceCard */}
        <div className="bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] text-white rounded-3xl p-5 shadow-lg shadow-purple-950/20 border border-purple-400/20">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-2 text-purple-200">Saldo disponible</p>
              <div className="flex items-center gap-2 mb-2">
                {/* ─── FIX 1: color rojo si negativo ─────────────────────── */}
                <p className={`text-3xl font-bold font-outfit tracking-tight leading-none ${availableBalance < 0 ? 'text-red-300' : 'text-white'}`}>
                  {isBalanceHidden
                    ? "$ ••••••"
                    : availableBalance < 0
                      ? `−${ars(Math.abs(availableBalance))}`
                      : ars(availableBalance)
                  }
                </p>
                <button onClick={toggleHideBalance} className="text-purple-300 hover:text-white transition-colors flex-shrink-0 cursor-pointer p-1" title={isBalanceHidden ? "Mostrar saldo" : "Ocultar saldo"}>
                  {isBalanceHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* ─── FIX 1: aviso si no hay ingresos cargados ────────────── */}
              {hasNoIncomeData && !isBalanceHidden && (
                <p className="text-[11px] text-amber-300 mb-2 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Cargá tu sueldo o ingreso para ver el saldo real</span>
                </p>
              )}

              {/* ─── FIX 1: barra solo si hay presupuesto ────────────────── */}
              {generalBudget > 0 && (
                <div className="h-1.5 rounded-full overflow-hidden mb-2 bg-white/20">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(0, (totalExpenses / generalBudget) * 100))}%`,
                      background: availableBalance < 0
                        ? 'linear-gradient(90deg, #EF4444, #F87171)'
                        : 'linear-gradient(90deg, #F95420, #FF8C42)'
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-purple-200">
                {generalBudget > 0 ? (
                  <span>Presupuesto mensual{" "}
                    <span className="font-semibold text-white">{isBalanceHidden ? '$ ••••••' : ars(generalBudget)}</span>
                  </span>
                ) : (
                  <span className="text-amber-300/80">Sin presupuesto configurado</span>
                )}
                {onOpenBudgetModal && (
                  <button onClick={onOpenBudgetModal} className="text-purple-300 hover:text-white transition-colors p-0.5 cursor-pointer" title="Editar presupuesto">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Ring — solo si hay presupuesto configurado */}
            {generalBudget > 0 && (
              <div className="relative flex-shrink-0 w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor={availableBalance < 0 ? "#EF4444" : "#F95420"} />
                      <stop offset="100%" stopColor={availableBalance < 0 ? "#F87171" : "#FF8C42"} />
                    </linearGradient>
                  </defs>
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="7.5" />
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#cg)" strokeWidth="7.5" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1">
                  <p className="text-2xl sm:text-3xl font-black font-outfit leading-none text-white tracking-tight">{budgetUsedPercent}%</p>
                  <p className="text-[10px] sm:text-[11px] text-purple-200 text-center mt-1 leading-tight font-medium">del presupuesto<br />utilizado</p>
                </div>
              </div>
            )}

            {/* Sin presupuesto: placeholder amigable */}
            {generalBudget === 0 && (
              <button
                onClick={onOpenBudgetModal}
                className="flex-shrink-0 w-28 h-28 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 text-white/60 hover:border-white/60 hover:text-white/90 transition-all cursor-pointer gap-1"
              >
                <span className="text-2xl">🎯</span>
                <span className="text-[10px] font-semibold text-center leading-tight">Configurar<br />presupuesto</span>
              </button>
            )}
          </div>
        </div>

        {/* MetricCards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] text-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg shadow-purple-950/20 border border-purple-400/20 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm sm:text-base flex-shrink-0 bg-white/15 text-white">💳</div>
                <p className="text-[11px] sm:text-xs text-purple-200 leading-tight">Límite de gasto diario restante</p>
              </div>
              {dailyBudgetRemaining > 0 ? (
                <>
                  <p className="text-base sm:text-xl font-bold font-outfit text-white leading-none mb-0.5 truncate">
                    {isBalanceHidden ? "$ •••••" : ars(dailyBudgetRemaining)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-purple-300 mb-2 truncate">de {isBalanceHidden ? "$ •••" : ars(dailyTargetBase)}</p>
                </>
              ) : (
                <p className="text-[11px] text-amber-300 mb-2">Configurá presupuesto para ver este límite</p>
              )}
            </div>
            {dailyBudgetRemaining > 0 && (
              <div>
                <div className="h-1.5 rounded-full overflow-hidden mb-1.5 bg-white/20">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${dailyAvailablePercent}%`, background: 'linear-gradient(90deg, #F95420, #FF8C42)' }} />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-emerald-300 whitespace-nowrap">{dailyAvailablePercent}% disponible</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] text-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg shadow-purple-950/20 border border-purple-400/20 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm sm:text-base flex-shrink-0 bg-white/15 text-white">📈</div>
                <p className="text-[11px] sm:text-xs text-purple-200 leading-tight">Promedio de gasto diario</p>
              </div>
              <p className="text-base sm:text-xl font-bold font-outfit text-white leading-none mb-0.5 truncate">
                {isBalanceHidden ? "$ •••••" : (last7DaysStats.avg7Days > 0 ? ars(last7DaysStats.avg7Days) : '—')}
              </p>
              <p className="text-[10px] sm:text-xs text-purple-300 mb-2.5 sm:mb-3">en los últimos 7 días</p>
            </div>
            <div>
              {last7DaysStats.avg7Days > 0 && (
                <p className={`text-[10px] sm:text-xs font-semibold leading-tight ${last7DaysStats.diffPct <= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {last7DaysStats.diffPct <= 0 ? '↓' : '↑'} {Math.abs(last7DaysStats.diffPct)}% vs sem. ant.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── FIX 2: Vencimientos dinámicos ─────────────────────────────── */}
        {(upcomingBills.length > 0 || onAddVencimiento) && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>🔔</span> Próximos vencimientos
              </h3>
              {onNavigateTab && (
                <button onClick={() => onNavigateTab('vencimientos')} className="text-xs text-[#6F2EC5] font-semibold hover:underline cursor-pointer">Ver todos</button>
              )}
            </div>

            {upcomingBills.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-xs font-medium">No tenés vencimientos próximos</p>
                {onAddVencimiento && (
                  <button
                    type="button"
                    onClick={() => {/* abrir modal de agregar vencimiento */}}
                    className="mt-2 text-xs text-[#6F2EC5] hover:underline font-semibold cursor-pointer"
                  >
                    + Agregar vencimiento
                  </button>
                )}
              </div>
            ) : (
              <div>
                {upcomingBills.map((bill, i) => {
                  const badge = billBadge(bill.daysLeft);
                  return (
                    <div key={bill.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                      <span className="text-xl flex-shrink-0">{bill.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{bill.title}</p>
                        <p className="text-xs text-slate-500">{bill.cat} · {bill.due}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div>
                          <p className="text-sm font-bold text-slate-800 text-right">
                            ${bill.amount.toLocaleString('es-AR')}
                          </p>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {bill.isOverdue
                              ? `Vencido hace ${Math.abs(bill.daysLeft)} días`
                              : bill.daysLeft === 0
                                ? 'Hoy'
                                : `En ${bill.daysLeft} ${bill.daysLeft === 1 ? 'día' : 'días'}`
                            }
                          </span>
                        </div>
                        {/* Botón marcar pagado */}
                        {onMarkVencimientoPaid && (
                          <button
                            type="button"
                            onClick={() => onMarkVencimientoPaid(bill.id)}
                            title="Marcar como pagado"
                            className="w-7 h-7 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Score diario */}
        <div
          className="rounded-2xl p-4 cursor-pointer border border-purple-200/60 bg-purple-50/50 hover:bg-purple-50 transition-all"
          onClick={() => setIsScoreModalOpen(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black" style={{ background: GRAD_ICON, color: 'white' }}>
                {dailyScore?.total ?? '—'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Score financiero del día</p>
                <p className="text-xs text-slate-500">
                  {isScoreUnlockedToday ? 'Finalizado ✓' : 'Tocá para ver el detalle'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* Alertas de presupuesto */}
        {budgetAlertsList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertas de presupuesto
                {criticalAlertsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">{criticalAlertsCount}</span>
                )}
              </h3>
            </div>
            {budgetAlertsList.slice(0, 4).map((item, i) => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                    <span className={`text-xs font-bold ${item.textColor}`}>{item.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${item.barColor} transition-all duration-500`} style={{ width: `${Math.min(item.pct, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Gastado: ${item.spent.toLocaleString('es-AR')} / ${item.budget.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pie chart de categorías */}
        {categoryPieData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Distribución de gastos</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value" strokeWidth={2} stroke="white">
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {categoryPieData.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-xs text-slate-600 flex-1 truncate">{item.name}</span>
                    <span className="text-xs font-bold text-slate-800">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </motion.div>

      {/* Score Modal */}
      {isScoreModalOpen && (
        <DailyScoreModal
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          score={dailyScore}
          history={scoreHistory}
          onFinalize={handleFinalizeDay}
          isFinalized={isScoreUnlockedToday}
        />
      )}
    </div>
  );
};

export default DashboardOverview;
