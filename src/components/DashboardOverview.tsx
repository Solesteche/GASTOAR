import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Target, 
  RefreshCw, 
  Tag, 
  ShoppingBag, 
  Utensils, 
  Home, 
  Pill, 
  Car, 
  Film, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  DollarSign,
  Activity,
  AlertCircle,
  MoreHorizontal,
  Wallet,
  CheckCircle2,
  Sparkles,
  PieChart,
  Award,
  Flame,
  Layers,
  ArrowRight,
  Pin,
  PinOff,
  Check
} from 'lucide-react';
import { Budgets, CategoryColors, CategoryMap, CoupleProfile, ExpenseMode, Transaction } from '../types';

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
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Alimentación': '🛒',
  'Supermercado': '🛒',
  'Restaurantes & Bares': '🍽️',
  'Servicios & Hogar': '🏠',
  'Hogar': '🏠',
  'Farmacia & Salud': '💊',
  'Movilidad & Transporte': '🚗',
  'Ocio & Suscripciones': '🎬',
  'Streaming': '🎬',
  'Otros Gastos': '📦',
};

// Colors matching the text and letter accents of the Balance Cards (Emerald, Orange, Lavender, Pink, Sky, Amber)
const BALANCE_LETTERS_PALETTE = [
  '#34d399', // Emerald (Verde ingresos y promedio de gasto)
  '#fb923c', // Orange (Naranja presupuesto usado y %)
  '#c084fc', // Purple/Lavender (Lavanda saldo y límites)
  '#f472b6', // Pink/Rose (Rosa alertas y saldo)
  '#38bdf8', // Sky Blue (Celeste detalles)
  '#facc15', // Amber/Yellow (Amarillo metas)
];

const PASTEL_PALETTE = BALANCE_LETTERS_PALETTE;

const PASTEL_PILLS = [
  { bg: 'bg-[#d7e6f8]', text: 'text-[#1e3a8a]' }, // Pastel Blue
  { bg: 'bg-[#e2f38d]', text: 'text-[#365314]' }, // Pastel Lime
  { bg: 'bg-[#fae8cb]', text: 'text-[#78350f]' }, // Pastel Peach
  { bg: 'bg-[#f2dbec]', text: 'text-[#581c87]' }, // Pastel Lilac
  { bg: 'bg-[#cffafe]', text: 'text-[#155e75]' }, // Pastel Cyan
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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
}) => {
  // Current user display name
  const currentUserName = profile.currentUser === 'user1' ? profile.user1Name : profile.user2Name;

  // Selected date cursor
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Filter mode: 'month' | 'last7' | 'last15' | 'last30' | 'thisYear' | 'custom'
  const [filterMode, setFilterMode] = useState<'month' | 'last7' | 'last15' | 'last30' | 'thisYear' | 'custom'>('month');
  
  // Custom date range state (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: todayStr.slice(0, 8) + '01',
    end: todayStr
  });

  // Date range pinned status (allows locking a date range while the checkbox is checked)
  const [isRangePinned, setIsRangePinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gastoar_is_range_pinned') === 'true';
    } catch {
      return false;
    }
  });

  // Load pinned state data if pinned previously
  useEffect(() => {
    try {
      const isPinned = localStorage.getItem('gastoar_is_range_pinned') === 'true';
      if (isPinned) {
        const saved = localStorage.getItem('gastoar_pinned_range_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.mode) setFilterMode(parsed.mode);
          if (parsed.customRange) setCustomRange(parsed.customRange);
          if (parsed.dateStr) setSelectedDate(new Date(parsed.dateStr));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Update storage whenever pinning changes or active range changes while pinned
  const togglePinRange = (newVal?: boolean) => {
    const targetVal = typeof newVal === 'boolean' ? newVal : !isRangePinned;
    setIsRangePinned(targetVal);
    try {
      localStorage.setItem('gastoar_is_range_pinned', String(targetVal));
      if (targetVal) {
        localStorage.setItem('gastoar_pinned_range_data', JSON.stringify({
          mode: filterMode,
          customRange,
          dateStr: selectedDate.toISOString()
        }));
      } else {
        localStorage.removeItem('gastoar_pinned_range_data');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Keep stored pinned data updated if user adjusts dates while pinned
  useEffect(() => {
    if (isRangePinned) {
      try {
        localStorage.setItem('gastoar_pinned_range_data', JSON.stringify({
          mode: filterMode,
          customRange,
          dateStr: selectedDate.toISOString()
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isRangePinned, filterMode, customRange, selectedDate]);

  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const dateRangeRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target as Node)) {
        setIsDateRangeOpen(false);
      }
    };
    if (isDateRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDateRangeOpen]);

  // Compute effective date range [startDate, endDate] as YYYY-MM-DD
  const { effectiveStart, effectiveEnd, rangeLabel, totalDaysInRange } = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (filterMode === 'month') {
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth();
      const lastDay = new Date(y, m + 1, 0).getDate();
      const start = `${y}-${pad(m + 1)}-01`;
      const end = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
      const label = `${MONTH_NAMES[m]} ${y}`;
      return { effectiveStart: start, effectiveEnd: end, rangeLabel: label, totalDaysInRange: lastDay };
    }

    if (filterMode === 'last7') {
      const startD = new Date(now);
      startD.setDate(now.getDate() - 6);
      const start = formatD(startD);
      const end = formatD(now);
      return { effectiveStart: start, effectiveEnd: end, rangeLabel: 'Últimos 7 días', totalDaysInRange: 7 };
    }

    if (filterMode === 'last15') {
      const startD = new Date(now);
      startD.setDate(now.getDate() - 14);
      const start = formatD(startD);
      const end = formatD(now);
      return { effectiveStart: start, effectiveEnd: end, rangeLabel: 'Últimos 15 días', totalDaysInRange: 15 };
    }

    if (filterMode === 'last30') {
      const startD = new Date(now);
      startD.setDate(now.getDate() - 29);
      const start = formatD(startD);
      const end = formatD(now);
      return { effectiveStart: start, effectiveEnd: end, rangeLabel: 'Últimos 30 días', totalDaysInRange: 30 };
    }

    if (filterMode === 'thisYear') {
      const y = now.getFullYear();
      const start = `${y}-01-01`;
      const end = `${y}-12-31`;
      return { effectiveStart: start, effectiveEnd: end, rangeLabel: `Año ${y}`, totalDaysInRange: 365 };
    }

    // Custom
    const start = customRange.start || '2026-01-01';
    const end = customRange.end || todayStr;
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    
    // Format friendly label (e.g. 10 Ago - 25 Ago 2026)
    const formatShort = (str: string) => {
      const parts = str.split('-').map(Number);
      if (parts.length < 3) return str;
      const monthShort = MONTH_NAMES[parts[1] - 1]?.slice(0, 3) || '';
      return `${parts[2]} ${monthShort}`;
    };

    const label = `${formatShort(start)} - ${formatShort(end)} ${end.slice(0, 4)}`;
    return { effectiveStart: start, effectiveEnd: end, rangeLabel: label, totalDaysInRange: diffDays };
  }, [filterMode, selectedDate, customRange, todayStr]);

  const [hoveredDay, setHoveredDay] = useState<{ day: number; amount: number } | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    setFilterMode('month');
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setFilterMode('month');
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setFilterMode('month');
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const isCurrentMonthSelected = useMemo(() => {
    const now = new Date();
    return filterMode === 'month' && selectedDate.getFullYear() === now.getFullYear() && selectedDate.getMonth() === now.getMonth();
  }, [selectedDate, filterMode]);

  const monthName = MONTH_NAMES[selectedDate.getMonth()];
  const yearNumber = selectedDate.getFullYear();
  const formattedMonthHeader = `${monthName} ${yearNumber}`;

  // Days in range and days elapsed/remaining calculations
  const { daysElapsed, daysRemaining } = useMemo(() => {
    const now = new Date();
    const today = todayStr;

    // If range is in future
    if (effectiveStart > today) {
      return { daysElapsed: 1, daysRemaining: totalDaysInRange };
    }
    // If range is fully in past
    if (effectiveEnd < today) {
      return { daysElapsed: totalDaysInRange, daysRemaining: 1 };
    }
    // Range is ongoing (contains today)
    const sDate = new Date(effectiveStart);
    const nDate = new Date(today);
    const elapsed = Math.max(1, Math.min(totalDaysInRange, Math.ceil((nDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1));
    const remaining = Math.max(1, totalDaysInRange - elapsed + 1);
    return { daysElapsed: elapsed, daysRemaining: remaining };
  }, [effectiveStart, effectiveEnd, totalDaysInRange, todayStr]);

  // Filter transactions belonging to the selected date range AND active view mode
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.fecha) return false;
      const inDate = t.fecha >= effectiveStart && t.fecha <= effectiveEnd;
      if (!inDate) return false;

      // Filter by activeMode (Todos / Míos / Pareja)
      if (activeMode === 'individual') {
        const isCurrent = !t.pagadoPor || t.pagadoPor === profile.currentUser;
        if (t.tipo !== 'individual' || !isCurrent) return false;
      } else if (activeMode === 'pareja') {
        if (t.tipo !== 'pareja') return false;
      }

      return true;
    });
  }, [transactions, effectiveStart, effectiveEnd, activeMode, profile.currentUser]);

  // Separate incomes from expenses
  const monthIncomesList = useMemo(() => {
    return monthTransactions.filter(t => t.tipoTransaccion === 'ingreso');
  }, [monthTransactions]);

  const monthExpensesList = useMemo(() => {
    return monthTransactions.filter(t => t.tipoTransaccion !== 'ingreso');
  }, [monthTransactions]);

  // Financial calculations from REAL recorded user transactions
  const totalIncome = useMemo(() => {
    return monthIncomesList.reduce((acc, t) => acc + (t.monto || 0), 0);
  }, [monthIncomesList]);
  
  const totalExpenses = useMemo(() => {
    return monthExpensesList.reduce((acc, t) => acc + (t.monto || 0), 0);
  }, [monthExpensesList]);

  // 1. Saldo de dinero disponible (Ingresos vs Egresos)
  const availableBalance = totalIncome - totalExpenses;
  const savingsPercent = totalIncome > 0 ? Math.max(0, Math.round((availableBalance / totalIncome) * 100)) : 0;

  // 2. Presupuesto General del Mes & % Usado
  const generalBudget = useMemo(() => {
    const categories = budgets?.categories || {};
    const sumCategories = Object.values(categories).reduce<number>((acc, b) => acc + (Number(b) || 0), 0);
    if (sumCategories > 0) return sumCategories;
    if (totalIncome > 0) return totalIncome;
    return totalExpenses > 0 ? totalExpenses : 0;
  }, [budgets, totalIncome, totalExpenses]);

  const budgetUsedPercent = generalBudget > 0 ? Math.round((totalExpenses / generalBudget) * 100) : (totalExpenses > 0 ? 100 : 0);

  // 3. Promedio de gastos por día
  const avgDailySpent = Math.round(totalExpenses / Math.max(1, daysElapsed));

  // 4. Balance restante y cuánto podés gastar por día para no pasarte
  const remainingBudget = generalBudget - totalExpenses;
  const dailyBudgetRemaining = remainingBudget > 0 ? Math.round(remainingBudget / daysRemaining) : 0;

  // Group by category for Donut and List with reference screenshot pastel styling
  const categorySummary = useMemo(() => {
    const catMap: Record<string, number> = {};

    monthExpensesList.forEach(t => {
      const cat = t.categoria || 'Otros Gastos';
      catMap[cat] = (catMap[cat] || 0) + (t.monto || 0);
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, item) => sum + item[1], 0) || 0;

    return sorted.map(([name, amount], index) => {
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      const color = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
      const emoji = CATEGORY_EMOJIS[name] || '🏷️';
      return { name, amount, pct, color, emoji };
    });
  }, [monthExpensesList]);

  // Recent transactions for the selected period
  const displayItems = useMemo(() => {
    return monthExpensesList.slice(0, 4);
  }, [monthExpensesList]);

  // Helpers for number display
  const formatNumberWithDots = (val: number) => {
    return Math.abs(Math.round(val)).toLocaleString('es-AR');
  };

  const formatCurrencyNice = (val: number) => {
    return `$${Math.abs(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Donut SVG Segment calculations
  let currentDonutAngle = 0;
  const donutSegments = categorySummary.map(item => {
    const start = currentDonutAngle;
    const sweep = (item.pct / 100) * 360;
    currentDonutAngle += sweep;
    return {
      ...item,
      startAngle: start,
      endAngle: currentDonutAngle,
      strokeDasharray: `${(item.pct * 2.83).toFixed(2)} 283`,
      strokeDashoffset: `-${(start * 2.83 / 360 * 100).toFixed(2)}`,
    };
  });

  // Top 5 Categories with most consumption and % of category budget consumed to date
  const top5Categories = useMemo(() => {
    return categorySummary.slice(0, 5).map((cat, idx) => {
      const assignedBudget = Number(budgets?.categories?.[cat.name]) || 0;
      // If no category budget explicitly set, benchmark against proportional share or default
      const effectiveBudget = assignedBudget > 0 
        ? assignedBudget 
        : Math.round(generalBudget * Math.max(0.1, (cat.pct / 100))) || 60000;
      const consumedPct = effectiveBudget > 0 ? Math.round((cat.amount / effectiveBudget) * 100) : 0;
      const txCount = monthExpensesList.filter(t => (t.categoria || 'Otros Gastos') === cat.name).length;
      const isOverBudget = cat.amount > effectiveBudget;
      const remaining = effectiveBudget - cat.amount;

      return {
        ...cat,
        rank: idx + 1,
        budget: effectiveBudget,
        hasAssignedBudget: assignedBudget > 0,
        consumedPct,
        txCount,
        isOverBudget,
        remaining
      };
    });
  }, [categorySummary, budgets, generalBudget, monthExpensesList]);

  return (
    <div className="space-y-6 sm:space-y-7 max-w-6xl mx-auto">
      
      {/* 1. TOP SECTION: Section Title ("Balance") + Vista Activa + Month Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Title & Vista Activa Badge */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F95420] tracking-tight flex items-center gap-2.5">
              <span>Balance</span>
            </h1>
            
            {/* Vista Activa Pills right in Dashboard Header */}
            {onModeChange && (
              <div className="flex items-center bg-purple-50/80 p-1 rounded-xl border border-purple-100 text-xs font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => onModeChange('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeMode === 'all'
                      ? 'bg-white text-[#2E0854] shadow-xs'
                      : 'text-slate-500 hover:text-[#2E0854]'
                  }`}
                  title="Ver todos los movimientos"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('individual')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeMode === 'individual'
                      ? 'bg-white text-[#7928CA] shadow-xs'
                      : 'text-slate-500 hover:text-[#2E0854]'
                  }`}
                  title={`Ver solo movimientos de ${currentUserName}`}
                >
                  Míos ({currentUserName})
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('pareja')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeMode === 'pareja'
                      ? 'bg-white text-[#F95420] shadow-xs'
                      : 'text-slate-500 hover:text-[#2E0854]'
                  }`}
                  title="Ver gastos compartidos en pareja"
                >
                  En Pareja
                </button>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {activeMode === 'all' 
              ? `Hola ${currentUserName}, este es el resumen consolidado de ingresos, gastos y presupuesto.`
              : activeMode === 'individual'
              ? `Vista individual: mostrando únicamente los movimientos personales de ${currentUserName}.`
              : `Vista en pareja: mostrando gastos compartidos y fondo común.`
            }
          </p>
        </div>

        {/* Right: Date Range Selector & Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Date Range Selector */}
          <div className="relative" ref={dateRangeRef}>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsDateRangeOpen(prev => !prev)}
                className={`px-3.5 sm:px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border shadow-xs active:scale-95 cursor-pointer ${
                  isRangePinned
                    ? 'bg-purple-50 text-[#7928CA] border-purple-300 ring-2 ring-purple-500/20 shadow-purple-500/10'
                    : filterMode !== 'month'
                    ? 'bg-gradient-to-r from-[#2E0854] to-[#7928CA] text-white border-transparent shadow-purple-900/25'
                    : 'bg-white text-slate-700 hover:text-[#2E0854] border-purple-100 hover:border-purple-200'
                }`}
                title={isRangePinned ? "Rango de fechas fijado. Clic para modificar o desbloquear." : "Seleccionar rango de fechas específico"}
              >
                <div className="flex items-center gap-1.5">
                  {isRangePinned ? (
                    <Pin className="w-3.5 h-3.5 text-[#7928CA] fill-[#7928CA] rotate-45 shrink-0" />
                  ) : (
                    <Calendar className={`w-4 h-4 ${filterMode !== 'month' ? 'text-white' : 'text-[#7928CA]'}`} />
                  )}
                  <span>{rangeLabel}</span>
                </div>

                {isRangePinned && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-[#7928CA] text-white rounded-md">
                    Fijado
                  </span>
                )}

                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDateRangeOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Quick Pin/Unpin Icon Button */}
              <button
                type="button"
                onClick={() => togglePinRange()}
                title={isRangePinned ? "Desfijar rango de fechas" : "Fijar rango de fechas actual"}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isRangePinned
                    ? 'bg-[#7928CA] border-[#7928CA] text-white shadow-xs shadow-purple-500/25 hover:bg-[#6b21a8]'
                    : 'bg-white border-purple-100 text-slate-400 hover:text-[#2E0854] hover:bg-purple-50'
                }`}
              >
                <Pin className={`w-4 h-4 ${isRangePinned ? 'fill-white rotate-45' : ''}`} />
              </button>
            </div>

            {/* Dropdown / Popover Menu */}
            {isDateRangeOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-84 bg-white rounded-2xl p-4 shadow-xl border border-purple-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-purple-50">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-900/50">Rango de Fechas</span>
                  {filterMode !== 'month' && !isRangePinned && (
                    <button
                      onClick={() => {
                        setFilterMode('month');
                        setIsDateRangeOpen(false);
                      }}
                      className="text-[11px] font-bold text-[#7928CA] hover:underline cursor-pointer"
                    >
                      Mes Actual
                    </button>
                  )}
                </div>

                {/* Casilla para Fijar Rango de Fechas */}
                <div 
                  className={`mb-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isRangePinned
                      ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                      : 'bg-purple-50/40 border-purple-100 hover:bg-purple-50/70 text-slate-800'
                  }`}
                  onClick={() => togglePinRange()}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={isRangePinned}
                        onChange={(e) => togglePinRange(e.target.checked)}
                        className="sr-only"
                        id="pin-date-range-checkbox"
                      />
                      <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                        isRangePinned
                          ? 'bg-[#7928CA] border-[#7928CA] text-white shadow-xs'
                          : 'bg-white border-purple-300 hover:border-purple-400'
                      }`}>
                        {isRangePinned && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <Pin className={`w-3.5 h-3.5 ${isRangePinned ? 'text-[#7928CA] fill-[#7928CA]' : 'text-slate-400'}`} />
                          Fijar rango de fechas
                        </span>
                        {isRangePinned ? (
                          <span className="text-[9px] font-extrabold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-md tracking-wider">
                            FIJADO
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-400">
                            Desactivado
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-medium leading-tight mt-1">
                        {isRangePinned 
                          ? 'El rango seleccionado permanece fijado mientras la casilla esté tildada.'
                          : 'Tildá la casilla para mantener fijo este rango y evitar cambios automáticos.'
                        }
                      </p>
                    </div>
                  </label>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-3.5">
                  <button
                    onClick={() => {
                      setFilterMode('month');
                      setSelectedDate(new Date());
                      setIsDateRangeOpen(false);
                    }}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                      filterMode === 'month' ? 'bg-purple-50 text-[#7928CA] font-bold border border-purple-200/60' : 'text-slate-600 hover:bg-purple-50/50'
                    }`}
                  >
                    Este mes ({monthName})
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('last7');
                      setIsDateRangeOpen(false);
                    }}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                      filterMode === 'last7' ? 'bg-purple-50 text-[#7928CA] font-bold border border-purple-200/60' : 'text-slate-600 hover:bg-purple-50/50'
                    }`}
                  >
                    Últimos 7 días
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('last15');
                      setIsDateRangeOpen(false);
                    }}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                      filterMode === 'last15' ? 'bg-purple-50 text-[#7928CA] font-bold border border-purple-200/60' : 'text-slate-600 hover:bg-purple-50/50'
                    }`}
                  >
                    Últimos 15 días
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('last30');
                      setIsDateRangeOpen(false);
                    }}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                      filterMode === 'last30' ? 'bg-purple-50 text-[#7928CA] font-bold border border-purple-200/60' : 'text-slate-600 hover:bg-purple-50/50'
                    }`}
                  >
                    Últimos 30 días
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('thisYear');
                      setIsDateRangeOpen(false);
                    }}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-xl text-left transition-colors col-span-2 cursor-pointer ${
                      filterMode === 'thisYear' ? 'bg-purple-50 text-[#7928CA] font-bold border border-purple-200/60' : 'text-slate-600 hover:bg-purple-50/50'
                    }`}
                  >
                    Todo el Año {yearNumber}
                  </button>
                </div>

                {/* Custom Date Range Inputs */}
                <div className="pt-3 border-t border-purple-50 space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/50">Rango personalizado</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Desde</label>
                      <input
                        type="date"
                        value={customRange.start}
                        onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full bg-purple-50/30 border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7928CA]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Hasta</label>
                      <input
                        type="date"
                        value={customRange.end}
                        onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full bg-purple-50/30 border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7928CA]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (customRange.start && customRange.end) {
                        setFilterMode('custom');
                        setIsDateRangeOpen(false);
                      }
                    }}
                    className="w-full mt-2 py-2 bg-gradient-to-r from-[#2E0854] to-[#7928CA] hover:from-[#1C0533] hover:to-[#6B21A8] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Aplicar Rango</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS IN TRANSLUCENT WHITE BANNER WITH TRANSLUCENT VIOLET CARDS */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-[0_10px_35px_-5px_rgba(121,40,202,0.08)] border border-purple-100/80 ring-1 ring-purple-50/60 relative overflow-hidden">
        {/* Subtle decorative glows behind cards */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-3.5 sm:gap-4 relative z-10 font-sans">
          
          {/* Card 1: Saldo Disponible (70% on desktop) */}
          <div className="sm:col-span-2 lg:col-span-7 bg-[#581C87]/88 hover:bg-[#581C87]/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl text-white shadow-md shadow-purple-950/20 border border-purple-400/35 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-purple-100 shadow-xs">
                    <Wallet className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-[15px] sm:text-[17px] font-extrabold text-purple-100 tracking-wide">
                    Saldo Disponible
                  </p>
                </div>
                <span className={`text-[12.5px] font-bold px-3 py-1 rounded-full ${
                  availableBalance >= 0 
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' 
                    : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                }`}>
                  {availableBalance >= 0 ? 'Balance Positivo' : 'Saldo Negativo'}
                </span>
              </div>

              <div className="my-3 sm:my-4">
                <p className={`text-[26px] sm:text-[42px] font-black tracking-tight leading-none ${
                  availableBalance >= 0 ? 'text-white' : 'text-rose-300'
                }`}>
                  {availableBalance >= 0 ? '+' : '-'}${formatNumberWithDots(Math.abs(availableBalance))}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-[14.5px] text-purple-200">
              <div className="flex items-center gap-2">
                <span className="text-purple-200/90">Total Ingresos:</span>
                <strong className="text-emerald-300 font-extrabold">+${formatNumberWithDots(totalIncome)}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-200/90">Total Egresos:</span>
                <strong className="text-purple-100 font-extrabold">-${formatNumberWithDots(totalExpenses)}</strong>
              </div>
              <div className="text-xs text-purple-200/80 font-medium">
                {monthExpensesList.length} movimientos en el mes
              </div>
            </div>
          </div>

          {/* Card 2: % Presupuesto Usado (30% on desktop) */}
          <div className="sm:col-span-2 lg:col-span-3 bg-[#6B21A8]/88 hover:bg-[#6B21A8]/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl text-white shadow-md shadow-purple-950/20 border border-purple-400/35 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[15px] sm:text-[17px] font-extrabold text-orange-200 tracking-wide">
                  Presupuesto Usado
                </p>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                  budgetUsedPercent > 100
                    ? 'bg-rose-500/35 text-rose-200 border border-rose-400/40'
                    : budgetUsedPercent >= 80
                    ? 'bg-amber-500/35 text-amber-200 border border-amber-400/40'
                    : 'bg-emerald-500/35 text-emerald-200 border border-emerald-400/40'
                }`}>
                  {budgetUsedPercent > 100 ? 'Excedido' : budgetUsedPercent >= 80 ? 'Alerta' : 'En meta'}
                </span>
              </div>
              
              <div className="my-2 sm:my-3">
                <p className="text-[26px] sm:text-[32px] font-black text-orange-300 tracking-tight leading-tight">
                  {budgetUsedPercent}%
                </p>
                <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mt-2 border border-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetUsedPercent > 100 
                        ? 'bg-rose-400' 
                        : budgetUsedPercent >= 80 
                        ? 'bg-amber-400' 
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs sm:text-[12.5px] text-purple-200">
              <span>Gastado: <strong className="text-orange-200 font-bold">${formatNumberWithDots(totalExpenses)}</strong></span>
              <span>Meta: <strong className="text-white font-bold">${formatNumberWithDots(generalBudget)}</strong></span>
            </div>
          </div>

          {/* Card 3: Promedio de Gasto Diario (50% on desktop) */}
          <div className="sm:col-span-1 lg:col-span-5 bg-[#581C87]/83 hover:bg-[#581C87]/92 backdrop-blur-md p-4 sm:p-5 rounded-2xl text-white shadow-md shadow-purple-950/20 border border-purple-400/35 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-emerald-200">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[15px] sm:text-[17px] font-extrabold text-emerald-200 tracking-wide">
                    Promedio Gasto Diario
                  </p>
                </div>
              </div>
              <p className="text-[22px] sm:text-[26px] font-black text-emerald-300 mt-2 tracking-tight flex items-baseline gap-1">
                <span>${formatNumberWithDots(avgDailySpent)}</span>
                <span className="text-xs sm:text-[13px] font-normal text-purple-200">/ día</span>
              </p>
            </div>
            <div className="pt-2.5 mt-2 border-t border-white/15 flex items-center justify-between text-xs sm:text-[12.5px] text-purple-200">
              <span>En {daysElapsed} días transcurridos</span>
              <span className="font-bold text-white">{monthExpensesList.length} compras</span>
            </div>
          </div>

          {/* Card 4: Límite Diario / Balance Restante (50% on desktop) */}
          <div className="sm:col-span-1 lg:col-span-5 bg-[#581C87]/83 hover:bg-[#581C87]/92 backdrop-blur-md p-4 sm:p-5 rounded-2xl text-white shadow-md shadow-purple-950/20 border border-purple-400/35 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-purple-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[15px] sm:text-[17px] font-extrabold text-purple-100 tracking-wide">
                    Límite Diario Restante
                  </p>
                </div>
              </div>
              <p className="text-[22px] sm:text-[26px] font-black text-white mt-2 tracking-tight flex items-baseline gap-1">
                {remainingBudget > 0 ? (
                  <>
                    <span>${formatNumberWithDots(dailyBudgetRemaining)}</span>
                    <span className="text-xs sm:text-[13px] font-normal text-purple-200">/ día máx</span>
                  </>
                ) : (
                  <>
                    <span className="text-rose-300">$0</span>
                    <span className="text-xs sm:text-[13px] font-normal text-rose-300">/ agotado</span>
                  </>
                )}
              </p>
            </div>
            <div className="pt-2.5 mt-2 border-t border-white/15 flex items-center justify-between text-xs sm:text-[12.5px] text-purple-200">
              {remainingBudget > 0 ? (
                <>
                  <span>Quedan <strong>${formatNumberWithDots(remainingBudget)}</strong></span>
                  <span className="font-bold text-emerald-300 bg-emerald-500/25 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    {daysRemaining} d rest.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-rose-300 font-bold">Superado por ${formatNumberWithDots(Math.abs(remainingBudget))}</span>
                  <span className="font-bold text-rose-200 bg-rose-500/30 px-2 py-0.5 rounded-full border border-rose-400/40">
                    Límite 0
                  </span>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 3. GRÁFICO CON EL CONSUMO POR CATEGORÍA */}
      <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] transition-all">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-purple-50">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7928CA] flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#2E0854] tracking-tight">
                Consumo por Categoría
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 ml-10">
              Distribución porcentual y monto total gastado por categoría en el periodo
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-purple-50/60 border border-purple-100 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#2E0854]">
            <span>Total Egresos:</span>
            <span className="font-extrabold text-[#7928CA]">${formatNumberWithDots(totalExpenses)}</span>
          </div>
        </div>

        {/* Inner Content: Left Donut Visual + Right Detailed Distribution List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Center: Interactive Donut Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-48 h-48 sm:w-56 sm:h-56 -rotate-90 transform filter drop-shadow-xs">
                {donutSegments.length > 0 ? (
                  donutSegments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="34"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="15"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                  ))
                ) : (
                  <circle cx="50" cy="50" r="34" fill="transparent" stroke="#e2e8f0" strokeWidth="15" />
                )}
              </svg>

              {/* Inner Center Cutout / Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[10px] sm:text-xs uppercase font-extrabold text-purple-900/50 tracking-wider">TOTAL GASTADO</span>
                <span className="text-lg sm:text-2xl font-black text-[#2E0854] leading-tight">
                  ${formatNumberWithDots(totalExpenses)}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {categorySummary.length} categorías
                </span>
              </div>
            </div>
          </div>

          {/* Right: Grid of category breakdown with percentages, amounts, and progress bars */}
          <div className="lg:col-span-7 space-y-3">
            {categorySummary.length > 0 ? (
              categorySummary.map((cat) => (
                <div 
                  key={cat.name} 
                  className="p-3 sm:p-3.5 rounded-2xl bg-purple-50/20 hover:bg-purple-50/50 border border-purple-100/60 transition-all"
                >
                  <div className="flex items-center justify-between gap-3 text-xs sm:text-sm mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs" 
                        style={{ backgroundColor: cat.color }} 
                      />
                      <span className="text-base">{cat.emoji}</span>
                      <span className="font-bold text-slate-800 truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-slate-900">
                        ${formatNumberWithDots(cat.amount)}
                      </span>
                      <span 
                        className="text-xs font-black px-2.5 py-0.5 rounded-full border"
                        style={{ 
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                          borderColor: `${cat.color}40`
                        }}
                      >
                        {cat.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-purple-50/80 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-2xs"
                      style={{
                        width: `${Math.max(cat.pct, 4)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-purple-50/30 border border-dashed border-purple-200 rounded-2xl">
                <p className="text-sm font-bold text-slate-700 mb-1">Sin egresos en este período</p>
                <p className="text-xs text-slate-400 mb-4">No se registran gastos para el rango de fechas y vista activa seleccionada.</p>
                <button
                  type="button"
                  onClick={onOpenTransactionModal}
                  className="px-4 py-2 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  + Registrar Gasto
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 4. TOP 5 CATEGORÍAS CON MÁS CONSUMO & % DE PRESUPUESTO CONSUMIDO A LA FECHA */}
      <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] transition-all">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-purple-50">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F95420] flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#2E0854] tracking-tight">
                Top 5 Categorías con Mayor Consumo
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 ml-10">
              Porcentaje de presupuesto consumido a la fecha y balance disponible
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-orange-50 border border-orange-200/60 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-900">
            <Flame className="w-3.5 h-3.5 text-[#F95420]" />
            <span>Mayor impacto en tus gastos</span>
          </div>
        </div>

        {/* Top 5 List */}
        <div className="space-y-4">
          {top5Categories.length > 0 ? (
            top5Categories.map((item) => {
            const isExceeded = item.consumedPct > 100;
            const isWarning = item.consumedPct >= 80 && item.consumedPct <= 100;

            return (
              <div 
                key={item.name}
                className="p-4 sm:p-5 rounded-2xl border border-purple-100/70 bg-white hover:border-purple-200 hover:shadow-xs transition-all space-y-3"
              >
                {/* Upper Row: Rank + Category Name + Current Spent vs Budget + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge using balance letters palette */}
                    <span 
                      className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: `${item.color}20`,
                        color: item.color,
                        borderColor: `${item.color}50`
                      }}
                    >
                      #{item.rank}
                    </span>
                    
                    {/* Emoji + Name */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.emoji}</span>
                        <h3 className="font-extrabold text-sm sm:text-base text-[#2E0854] truncate">
                          {item.name}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.txCount} movimientos registrados
                      </span>
                    </div>
                  </div>

                  {/* Right: Spent vs Budget & Consumed % */}
                  <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-purple-900/50 font-medium">Gasto / Presupuesto</div>
                      <div className="text-sm font-extrabold text-[#2E0854]">
                        ${formatNumberWithDots(item.amount)}
                        <span className="text-xs font-semibold text-slate-400 ml-1">
                          / ${formatNumberWithDots(item.budget)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-purple-900/50 font-medium">Consumido</div>
                        <div 
                          className="text-base sm:text-lg font-black tracking-tight"
                          style={{ color: isExceeded ? '#e11d48' : item.color }}
                        >
                          {item.consumedPct}%
                        </div>
                      </div>

                      <span 
                        className="text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 border"
                        style={isExceeded ? {
                          backgroundColor: '#fff1f2',
                          color: '#e11d48',
                          borderColor: '#fecdd3'
                        } : {
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                          borderColor: `${item.color}45`
                        }}
                      >
                        {isExceeded ? 'Excedido' : isWarning ? 'Alerta' : 'En meta'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Sub-indicators */}
                <div className="space-y-1.5">
                  <div className="w-full bg-purple-50/80 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-2xs"
                      style={{
                        width: `${Math.min(item.consumedPct, 100)}%`,
                        backgroundColor: isExceeded ? '#f43f5e' : item.color
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium">
                    {item.remaining >= 0 ? (
                      <span className="text-purple-800 font-semibold">
                        ✓ Quedan ${formatNumberWithDots(item.remaining)} disponibles de presupuesto
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold">
                        ⚠ Excedido por ${formatNumberWithDots(Math.abs(item.remaining))}
                      </span>
                    )}

                    <span className="text-slate-400">
                      Representa el {item.pct}% de tus gastos totales
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-purple-50/30 border border-dashed border-purple-200 rounded-2xl">
            <p className="text-sm font-bold text-slate-700 mb-1">Sin datos para el Top 5</p>
            <p className="text-xs text-slate-400">Al registrar gastos con categorías asignadas se mostrará aquí el desglose detallado.</p>
          </div>
        )}
        </div>

        {/* Quick Footer Action */}
        <div className="mt-6 pt-4 border-t border-purple-50 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Top 5 calculado en base a tus {monthExpensesList.length} movimientos</span>
          <button
            onClick={onOpenTransactionModal}
            className="text-[#7928CA] font-bold hover:text-[#2E0854] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>+ Registrar nuevo gasto</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};

