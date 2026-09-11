import React, { useState, useMemo } from 'react';
import { 
  Target, 
  AlertTriangle, 
  AlertCircle, 
  Settings2,
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Search, 
  Sliders, 
  Filter, 
  ArrowRight, 
  ExternalLink, 
  Edit3, 
  Plus, 
  Coins, 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle, 
  BarChart3, 
  Layers, 
  Sparkles, 
  Check, 
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { Budgets, CategoryColors, CategoryMap, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { BudgetCategoryEditModal } from './budget/BudgetCategoryEditModal';
import { BudgetAlertsSection } from './budget/BudgetAlertsSection';
import { BudgetProjectionSection } from './budget/BudgetProjectionSection';
import { BudgetComparisonSection } from './budget/BudgetComparisonSection';

interface BudgetSectionProps {
  budgets: Budgets;
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  transactions: Transaction[];
  currency: string;
  onOpenBudgetModal: () => void;
  onUpdateBudgets?: (newBudgets: Budgets) => void;
  onSelectCategory?: (category: string) => void;
}

const DEFAULT_BUDGETS: Budgets = { categories: {}, subcategories: {} };

type ActiveBudgetSection = 'overview' | 'alerts' | 'projection' | 'comparison';
type StatusFilter = 'all' | 'risk' | 'safe' | 'no_budget';
type SortOption = 'percentage' | 'spent' | 'remaining' | 'name';

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  budgets = DEFAULT_BUDGETS,
  categoryMap = {},
  categoryColors = {},
  transactions = [],
  currency = 'ARS',
  onOpenBudgetModal,
  onUpdateBudgets,
  onSelectCategory,
}) => {
  // Navigation: 1) Alta y Categorías, 2) Alertas y Límites, 3) Proyección Automática, 4) Tabla Comparativa
  const [activeSection, setActiveSection] = useState<ActiveBudgetSection>('overview');

  // Search & Filter state for category cards
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('percentage');

  // Quick edit single category limit modal state
  const [editingCategory, setEditingCategory] = useState<{
    name: string;
    currentLimit: number;
    currentSpent: number;
    color: string;
  } | null>(null);

  // 1. Unified Single Date Filter Logic (Eliminates repeated and confusing date filters)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthIso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthIso);
    (transactions || []).forEach(tx => {
      if (tx && tx.fecha && tx.fecha.length >= 7) {
        set.add(tx.fecha.substring(0, 7));
      }
    });

    return Array.from(set)
      .sort()
      .reverse()
      .map(ym => {
        const [y, m] = ym.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        return {
          value: ym,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          year: y,
          month: m - 1,
        };
      });
  }, [transactions, currentMonthIso]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthIso);

  const selectedMonthObj = useMemo(() => {
    const found = availableMonths.find(m => m.value === selectedMonth);
    if (found) return found;
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return {
      value: selectedMonth,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      year: y,
      month: m - 1,
    };
  }, [selectedMonth, availableMonths]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    const currentIndex = availableMonths.findIndex(m => m.value === selectedMonth);
    if (currentIndex >= 0 && currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1].value);
    } else {
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevIso = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(prevIso);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableMonths.findIndex(m => m.value === selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1].value);
    } else {
      const [y, m] = selectedMonth.split('-').map(Number);
      const nextDate = new Date(y, m, 1);
      const nextIso = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(nextIso);
    }
  };

  // Month Pacing Calculations based on unified selected month
  const isCurrentMonth = selectedMonth === currentMonthIso;
  const daysInMonth = new Date(selectedMonthObj.year, selectedMonthObj.month + 1, 0).getDate();
  const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
  const daysRemaining = isCurrentMonth ? Math.max(1, daysInMonth - currentDay) : 0;
  const monthProgressPct = isCurrentMonth ? Math.round((currentDay / daysInMonth) * 100) : 100;

  // Filter transactions for this selected month (expenses only)
  const effectiveExpenses = useMemo(() => {
    return (transactions || []).filter(tx => {
      if (!tx || !tx.fecha) return false;
      if (tx.tipoTransaccion === 'ingreso') return false;
      return tx.fecha.startsWith(selectedMonth);
    });
  }, [transactions, selectedMonth]);

  const alertThreshold = budgets?.alertThresholdPercent || 80;

  // 2. Spending per category & subcategory in the selected month
  const catSpending = useMemo(() => {
    const map: Record<string, { spent: number; count: number }> = {};
    effectiveExpenses.forEach(tx => {
      if (!tx) return;
      const cat = tx.categoria || 'Otros';
      if (!map[cat]) map[cat] = { spent: 0, count: 0 };
      map[cat].spent += (tx.monto || 0);
      map[cat].count += 1;
    });
    return map;
  }, [effectiveExpenses]);

  const subcatSpending = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    effectiveExpenses.forEach(tx => {
      if (!tx) return;
      const cat = tx.categoria || 'Otros';
      const sub = tx.subcategoria || 'General';
      if (!map[cat]) map[cat] = {};
      map[cat][sub] = (map[cat][sub] || 0) + (tx.monto || 0);
    });
    return map;
  }, [effectiveExpenses]);

  // 3. Complete category items list (with subcategory breakdown & auto-summed category budgets)
  const categoryItems = useMemo(() => {
    const set = new Set<string>([
      ...Object.keys(categoryMap || {}),
      ...Object.keys(budgets?.categories || {}),
      ...Object.keys(catSpending),
    ]);

    return Array.from(set).map(cat => {
      const subs = categoryMap[cat] || [];
      const subcategoriesDetails = subs.map(subName => {
        const subBudget = budgets?.subcategories?.[subName] || 0;
        const subSpent = subcatSpending[cat]?.[subName] || 0;
        const subRem = subBudget > 0 ? subBudget - subSpent : 0;
        const subPct = subBudget > 0 ? Math.round((subSpent / subBudget) * 100) : (subSpent > 0 ? 100 : 0);
        let subStatus: 'exceeded' | 'warning' | 'ok' | 'no_budget' = 'no_budget';
        if (subBudget > 0) {
          if (subPct >= 100) subStatus = 'exceeded';
          else if (subPct >= alertThreshold) subStatus = 'warning';
          else subStatus = 'ok';
        }
        return {
          name: subName,
          budget: subBudget,
          spent: subSpent,
          remaining: subRem,
          percentage: subPct,
          status: subStatus,
        };
      });

      // USER REQUIREMENT: Automatically sum subcategories to determine the category total
      const subBudgetsSum = subcategoriesDetails.reduce((sum, s) => sum + s.budget, 0);
      const hasSubcategoryBudgets = subBudgetsSum > 0;
      const directBudget = budgets?.categories?.[cat] || 0;
      const budget = hasSubcategoryBudgets ? subBudgetsSum : directBudget;

      const catData = catSpending[cat] || { spent: 0, count: 0 };
      const spent = catData.spent;
      const count = catData.count;
      const remaining = budget > 0 ? budget - spent : 0;
      const overspent = budget > 0 && spent > budget ? spent - budget : 0;
      const pct = budget > 0 ? Math.round((spent / budget) * 100) : (spent > 0 ? 100 : 0);

      let status: 'exceeded' | 'warning' | 'ok' | 'no_budget' = 'no_budget';
      if (budget > 0) {
        if (pct >= 100) status = 'exceeded';
        else if (pct >= alertThreshold) status = 'warning';
        else status = 'ok';
      }

      const dailyAllowance = budget > 0 && remaining > 0 && daysRemaining > 0
        ? Math.round(remaining / daysRemaining)
        : 0;

      return {
        category: cat,
        budget,
        spent,
        count,
        remaining,
        overspent,
        percentage: pct,
        status,
        color: (categoryColors && categoryColors[cat]) || '#7928CA',
        dailyAllowance,
        hasSubcategoryBudgets,
        subcategories: subcategoriesDetails,
      };
    });
  }, [categoryMap, budgets, catSpending, subcatSpending, alertThreshold, daysRemaining, categoryColors]);

  // 4. Global Budget Totals
  const globalSummary = useMemo(() => {
    let totalBudget = 0;
    let totalSpentWithBudget = 0;
    let allSpent = 0;
    let exceededCount = 0;
    let warningCount = 0;
    let okCount = 0;
    let noBudgetCount = 0;

    categoryItems.forEach(item => {
      allSpent += item.spent;
      if (item.budget > 0) {
        totalBudget += item.budget;
        totalSpentWithBudget += item.spent;
        if (item.status === 'exceeded') exceededCount++;
        else if (item.status === 'warning') warningCount++;
        else okCount++;
      } else {
        noBudgetCount++;
      }
    });

    const netRemaining = totalBudget - totalSpentWithBudget;
    const globalPct = totalBudget > 0 ? Math.round((totalSpentWithBudget / totalBudget) * 100) : 0;
    const dailySafeSpending = netRemaining > 0 && daysRemaining > 0 
      ? Math.round(netRemaining / daysRemaining) 
      : 0;

    return {
      totalBudget,
      totalSpentWithBudget,
      allSpent,
      netRemaining,
      globalPct,
      dailySafeSpending,
      exceededCount,
      warningCount,
      okCount,
      noBudgetCount,
      categoriesCount: categoryItems.length,
    };
  }, [categoryItems, daysRemaining]);

  // 5. Pacing evaluation
  const pacingEvaluation = useMemo(() => {
    const { globalPct, totalBudget } = globalSummary;
    if (totalBudget === 0) {
      return {
        title: 'Sin Presupuesto Asignado',
        badge: 'Sin límites',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        desc: 'Definí presupuestos para activar el ritmo seguro diario y alertas preventivas.',
        isOptimal: false,
      };
    }
    if (globalPct >= 100) {
      return {
        title: '¡Límite Mensual Superado!',
        badge: 'Excedido',
        color: 'bg-rose-50 text-rose-800 border-rose-200',
        desc: `Consumiste el ${globalPct}% del presupuesto mensual en ${selectedMonthObj.label}.`,
        isOptimal: false,
      };
    }
    if (isCurrentMonth && globalPct > monthProgressPct + 15) {
      return {
        title: 'Ritmo de Gasto Acelerado',
        badge: 'Atención',
        color: 'bg-amber-50 text-amber-900 border-amber-200',
        desc: `Día ${currentDay} (${monthProgressPct}% del mes) con ${globalPct}% gastado. Conviene moderar consumos discrecionales.`,
        isOptimal: false,
      };
    }
    return {
      title: 'Ritmo Financiero Saludable',
      badge: 'Bajo Control',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: `${selectedMonthObj.label}: Consumo dentro de los límites programados (${globalPct}% ejecutado).`,
      isOptimal: true,
    };
  }, [globalSummary, monthProgressPct, currentDay, selectedMonthObj.label, isCurrentMonth]);

  // 6. Filtered and Sorted Category Items for Tab 1
  const displayedCategories = useMemo(() => {
    return categoryItems
      .filter(item => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          if (!item.category.toLowerCase().includes(term)) return false;
        }

        if (statusFilter === 'risk') {
          return item.status === 'exceeded' || item.status === 'warning';
        }
        if (statusFilter === 'safe') {
          return item.status === 'ok';
        }
        if (statusFilter === 'no_budget') {
          return item.status === 'no_budget';
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'percentage') {
          return b.percentage - a.percentage;
        }
        if (sortOption === 'spent') {
          return b.spent - a.spent;
        }
        if (sortOption === 'remaining') {
          return a.remaining - b.remaining;
        }
        return a.category.localeCompare(b.category);
      });
  }, [categoryItems, searchTerm, statusFilter, sortOption]);

  const [expandedCardSubs, setExpandedCardSubs] = useState<Record<string, boolean>>({});

  // Quick edit handlers
  const handleOpenEdit = (item: { category: string; budget: number; spent: number; color?: string }) => {
    setEditingCategory({
      name: item.category,
      currentLimit: item.budget,
      currentSpent: item.spent,
      color: item.color || '#7928CA',
    });
  };

  const handleSaveCategoryBudget = (
    categoryName: string, 
    newBudget: number, 
    newSubcategoryBudgets?: Record<string, number>
  ) => {
    const newCategories = {
      ...(budgets.categories || {}),
      [categoryName]: newBudget,
    };
    const newSubs = {
      ...(budgets.subcategories || {}),
      ...(newSubcategoryBudgets || {}),
    };
    const updated: Budgets = {
      ...budgets,
      categories: newCategories,
      subcategories: newSubs,
    };
    if (onUpdateBudgets) {
      onUpdateBudgets(updated);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 0. SECTION HEADER WITH TITLE AND ICON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white flex items-center justify-center shadow-md shadow-purple-900/20 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#2E0854] tracking-tight">
              Presupuestos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Fijá límites, proyectá aumentos y controlá los desvíos mensuales de tus gastos.
            </p>
          </div>
        </div>
      </div>

      {/* 1. TOP UNIFIED DATE BAR (Eliminates repeated/confusing date filters) */}
      <section className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Month Navigator */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-[#7928CA] border border-slate-200 transition-colors cursor-pointer active:scale-95 shrink-0"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-purple-50 text-[#7928CA] font-extrabold text-xs sm:text-base py-2 pl-3 sm:pl-4 pr-8 sm:pr-9 rounded-xl sm:rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7928CA] absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-75" />
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-[#7928CA] border border-slate-200 transition-colors cursor-pointer active:scale-95 shrink-0"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick jump to current month */}
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setSelectedMonth(currentMonthIso)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Actual</span>
            </button>
          )}
        </div>

        {/* Right: Month Pacing Context */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 text-xs text-slate-500 font-medium w-full sm:w-auto">
          {isCurrentMonth ? (
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] sm:text-xs truncate">
              <Clock className="w-3.5 h-3.5 text-[#7928CA] shrink-0" />
              <span className="hidden sm:inline">
                Día <strong>{currentDay}</strong> de {daysInMonth} ({monthProgressPct}% del mes) · <strong>{daysRemaining} días restantes</strong>
              </span>
              <span className="sm:hidden">
                Día <strong>{currentDay}/{daysInMonth}</strong> ({monthProgressPct}%) · <strong>{daysRemaining}d rest.</strong>
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] sm:text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Cerrado · {daysInMonth}d</span>
            </span>
          )}

          <button
            type="button"
            onClick={onOpenBudgetModal}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs font-bold rounded-xl sm:rounded-2xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
            title="Configuración masiva de presupuestos"
          >
            <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Configuración General</span>
            <span className="sm:hidden">Ajustes</span>
          </button>
        </div>
      </section>

      {/* 2. FOUR CORE NAVIGATION SECTIONS (2 buttons per row, 2 rows) */}
      <nav className="bg-purple-50/70 p-1.5 sm:p-2 rounded-2xl grid grid-cols-2 gap-1.5 sm:gap-2 border border-purple-100/90 shadow-2xs">
        {/* Section 1: Alta y Edición de Presupuesto */}
        <button
          type="button"
          onClick={() => setActiveSection('overview')}
          className={`w-full py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center ${
            activeSection === 'overview'
              ? 'bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white font-extrabold shadow-md shadow-purple-900/25'
              : 'text-slate-600 hover:text-[#2E0854] hover:bg-white/80 font-bold'
          }`}
        >
          <Target className="w-4 h-4 shrink-0" />
          <span className="truncate">1) Alta Presupuesto</span>
        </button>

        {/* Section 2: Configurar Alertas de Presupuesto (Alertas y Límites) */}
        <button
          type="button"
          onClick={() => setActiveSection('alerts')}
          className={`w-full py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center ${
            activeSection === 'alerts'
              ? 'bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white font-extrabold shadow-md shadow-purple-900/25'
              : 'text-slate-600 hover:text-[#2E0854] hover:bg-white/80 font-bold'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="truncate">2) Alertas y Límites</span>
        </button>

        {/* Section 3: Proyección Automática */}
        <button
          type="button"
          onClick={() => setActiveSection('projection')}
          className={`w-full py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center ${
            activeSection === 'projection'
              ? 'bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white font-extrabold shadow-md shadow-purple-900/25'
              : 'text-slate-600 hover:text-[#2E0854] hover:bg-white/80 font-bold'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="truncate">3) Proyección Auto</span>
        </button>

        {/* Section 4: Tabla Comparativa */}
        <button
          type="button"
          onClick={() => setActiveSection('comparison')}
          className={`w-full py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center ${
            activeSection === 'comparison'
              ? 'bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white font-extrabold shadow-md shadow-purple-900/25'
              : 'text-slate-600 hover:text-[#2E0854] hover:bg-white/80 font-bold'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span className="truncate">4) Comparativa</span>
        </button>
      </nav>

      {/* 3. SECTION CONTENT SWITCHER */}
      
      {/* SECTION 1: ALTA Y EDICIÓN DE PRESUPUESTO */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header & Global Pacing Cards */}
          <section className="bg-white p-5 sm:p-7 rounded-3xl shadow-[0_4px_24px_-4px_rgba(121,40,202,0.07)] border border-purple-100/90 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-[#2E0854] text-lg sm:text-xl tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#7928CA]" />
                  Gestión y Asignación de Presupuestos
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Cargá o editá el límite de cada categoría directamente haciendo clic en el botón de edición.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenBudgetModal}
                className="px-4 py-2 bg-purple-50 text-[#7928CA] hover:bg-purple-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer border border-purple-200"
              >
                <Plus className="w-4 h-4" />
                <span>Asignar masivamente</span>
              </button>
            </div>

            {/* 3 High-Impact KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              
              {/* Card 1: Presupuesto Global */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/40 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-purple-900">
                    <Coins className="w-4 h-4 text-[#7928CA]" />
                    Presupuesto Global
                  </span>
                  <span className="font-extrabold text-[#7928CA]">
                    {globalSummary.globalPct}% consumido
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 font-outfit">
                      {formatCurrency(globalSummary.totalSpentWithBudget, currency)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium ml-1.5">
                      / {formatCurrency(globalSummary.totalBudget, currency)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        globalSummary.globalPct >= 100 
                          ? 'bg-rose-500' 
                          : globalSummary.globalPct >= alertThreshold 
                            ? 'bg-amber-500' 
                            : 'bg-[#7928CA]'
                      }`}
                      style={{ width: `${Math.min(100, globalSummary.globalPct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>{selectedMonthObj.label}</span>
                    <span>
                      {globalSummary.netRemaining >= 0 ? (
                        <strong className="text-emerald-700">Quedan {formatCurrency(globalSummary.netRemaining, currency)}</strong>
                      ) : (
                        <strong className="text-rose-600">Exceso {formatCurrency(Math.abs(globalSummary.netRemaining), currency)}</strong>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Margen Diario Seguro */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-900">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Gasto Diario Seguro
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {daysRemaining} días restantes
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-emerald-800 font-outfit">
                      {formatCurrency(globalSummary.dailySafeSpending, currency)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      / día
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {globalSummary.netRemaining > 0 ? (
                    <>Margen máximo por día para no pasarte del presupuesto mensual.</>
                  ) : (
                    <span className="text-rose-600 font-bold">Sin margen disponible restante este mes.</span>
                  )}
                </p>
              </div>

              {/* Card 3: Resumen de Cobertura */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/30 border border-slate-200 space-y-3 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Cobertura de Categorías
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${pacingEvaluation.color}`}>
                    {pacingEvaluation.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
                    <span className="text-emerald-800 font-medium">Bajo control:</span>
                    <strong className="font-outfit text-emerald-900 font-bold">{globalSummary.okCount}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-100 flex items-center justify-between">
                    <span className="text-rose-800 font-medium">En riesgo:</span>
                    <strong className="font-outfit text-rose-900 font-bold">
                      {globalSummary.exceededCount + globalSummary.warningCount}
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between col-span-2">
                    <span className="text-slate-600 font-medium">Sin límite fijado:</span>
                    <strong className="font-outfit text-slate-800 font-bold">{globalSummary.noBudgetCount} categorías</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic banner */}
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${pacingEvaluation.color}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {pacingEvaluation.isOptimal ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{pacingEvaluation.title}</span>
                    {globalSummary.exceededCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                        {globalSummary.exceededCount} {globalSummary.exceededCount === 1 ? 'categoría superada' : 'categorías superadas'}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-0.5 text-xs">
                    {pacingEvaluation.desc}
                  </p>
                </div>
              </div>

              {globalSummary.exceededCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('risk')}
                  className="px-3.5 py-1.5 bg-white rounded-xl shadow-xs border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                >
                  Ver categorías en riesgo
                </button>
              )}
            </div>
          </section>

          {/* Search and Filters Toolbar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar categoría para editar..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7928CA]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Status Chips & Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-2 w-full md:w-auto text-xs">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-[11px] font-bold overflow-x-auto scrollbar-none w-full sm:w-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas ({categoryItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('risk')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'risk' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  En Riesgo ({globalSummary.exceededCount + globalSummary.warningCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('safe')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'safe' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700'
                  }`}
                >
                  Bajo Control ({globalSummary.okCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('no_budget')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'no_budget' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sin Límite ({globalSummary.noBudgetCount})
                </button>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto">
                <span className="text-slate-400 text-[11px] font-medium sm:inline shrink-0">Ordenar:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer flex-1 sm:flex-none"
                >
                  <option value="percentage">Mayor % Consumido</option>
                  <option value="spent">Mayor Gasto ($)</option>
                  <option value="remaining">Menor Saldo Restante</option>
                  <option value="name">Alfabético (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CATEGORY EDIT CARDS GRID */}
          {displayedCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCategories.map((item) => {
                const isExceeded = item.status === 'exceeded';
                const isWarning = item.status === 'warning';
                const isNoBudget = item.status === 'no_budget';

                return (
                  <div
                    key={item.category}
                    className={`bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md flex flex-col justify-between gap-4 relative overflow-hidden ${
                      isExceeded
                        ? 'border-rose-200/90 shadow-[0_2px_12px_rgba(244,63,94,0.08)]'
                        : isWarning
                          ? 'border-amber-200/90 shadow-[0_2px_12px_rgba(245,158,11,0.08)]'
                          : 'border-slate-200/80 shadow-xs'
                    }`}
                  >
                    {/* Top Color Accent Line */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1" 
                      style={{ backgroundColor: isExceeded ? '#f43f5e' : isWarning ? '#f59e0b' : item.color }} 
                    />

                    {/* Category Title & Status Pill */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                            style={{ backgroundColor: item.color }} 
                          />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm truncate">
                              {item.category}
                            </h4>
                            {item.hasSubcategoryBudgets && (
                              <span className="text-[10px] text-[#7928CA] font-extrabold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                Suma de {item.subcategories?.filter(s => s.budget > 0).length} subcategorías
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 uppercase tracking-wide border ${
                          isExceeded
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isWarning
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : isNoBudget
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {isExceeded
                            ? `Excedido (${item.percentage}%)`
                            : isWarning
                              ? `Alerta (${item.percentage}%)`
                              : isNoBudget
                                ? 'Sin límite'
                                : `${item.percentage}%`}
                        </span>
                      </div>

                      {/* Amounts Display */}
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-xs text-slate-400 font-medium block">Gastado ({selectedMonthObj.label})</span>
                          <span className="text-lg font-black text-slate-900 font-outfit">
                            {formatCurrency(item.spent, currency)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-medium block">
                            {item.hasSubcategoryBudgets ? 'Total subcategorías' : 'Límite mensual'}
                          </span>
                          {item.budget > 0 ? (
                            <span className="text-sm font-bold text-slate-700 font-outfit">
                              {formatCurrency(item.budget, currency)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              No asignado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual Progress Bar with Threshold Marker */}
                      {item.budget > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                            {/* Threshold marker */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10" 
                              style={{ left: `${alertThreshold}%` }} 
                              title={`Umbral de alerta (${alertThreshold}%)`}
                            />
                            <div 
                              className={`h-full transition-all duration-300 rounded-full ${
                                isExceeded 
                                  ? 'bg-rose-500' 
                                  : isWarning 
                                    ? 'bg-amber-500' 
                                    : 'bg-[#7928CA]'
                              }`}
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                            />
                          </div>

                          {/* Remaining / Overspent helper info */}
                          <div className="flex items-center justify-between text-[11px]">
                            {isExceeded ? (
                              <span className="text-rose-600 font-bold">
                                Exceso de {formatCurrency(item.overspent, currency)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold">
                                Saldo libre: {formatCurrency(item.remaining, currency)}
                              </span>
                            )}

                            {item.dailyAllowance > 0 && !isExceeded && isCurrentMonth && (
                              <span className="text-slate-500 font-medium text-[10px]">
                                ~{formatCurrency(item.dailyAllowance, currency)} / día
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Sin límite de gasto fijado.</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="text-[#7928CA] font-bold hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Fijar presupuesto
                          </button>
                        </div>
                      )}

                      {/* Subcategories Breakdown Drawer inside Card */}
                      {item.subcategories && item.subcategories.length > 0 && (
                        <div className="pt-2 border-t border-slate-100/90 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedCardSubs(p => ({ ...p, [item.category]: !p[item.category] }))}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-purple-50/50 hover:bg-purple-100/60 text-[#7928CA] text-xs font-extrabold transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3 h-3" />
                              <span>{expandedCardSubs[item.category] ? 'Ocultar' : 'Ver'} subcategorías ({item.subcategories.length})</span>
                            </span>
                            {expandedCardSubs[item.category] ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {expandedCardSubs[item.category] && (
                            <div className="space-y-1 p-2 rounded-xl bg-slate-50/80 border border-slate-200/80 max-h-48 overflow-y-auto">
                              {item.subcategories.map(sub => (
                                <div key={sub.name} className="flex items-center justify-between gap-2 p-1.5 bg-white rounded-lg border border-slate-200/70 text-[11px]">
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-800 block truncate">
                                      {sub.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      Gasto: {formatCurrency(sub.spent, currency)}
                                    </span>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-outfit font-extrabold text-slate-900 block">
                                      {sub.budget > 0 ? (
                                        formatCurrency(sub.budget, currency)
                                      ) : (
                                        <span className="text-slate-400 font-normal italic text-[10px]">Sin límite</span>
                                      )}
                                    </span>
                                    {sub.budget > 0 && (
                                      <span className={`text-[10px] font-extrabold ${sub.status === 'exceeded' ? 'text-rose-600' : sub.status === 'warning' ? 'text-amber-600' : 'text-emerald-700'}`}>
                                        {sub.percentage}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer with Direct Category Edit Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectCategory) {
                            onSelectCategory(item.category);
                          }
                        }}
                        className="text-slate-500 hover:text-[#7928CA] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Ver movimientos de ${item.category}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver gastos ({item.count})</span>
                      </button>

                      {/* EDIT CATEGORY BUDGET BUTTON (User Request: "Habilitar la opción de editar el presupuesto de una categoría") */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7928CA] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer text-xs active:scale-95 shadow-2xs border border-purple-200/70"
                        title="Modificar límite de presupuesto para esta categoría"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{item.budget > 0 ? 'Editar Presupuesto' : 'Asignar Presupuesto'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7928CA] mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-800">No se encontraron categorías</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay categorías que coincidan con el filtro o término de búsqueda seleccionado.
              </p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="px-4 py-2 bg-purple-100 text-[#7928CA] text-xs font-bold rounded-xl hover:bg-purple-200 transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: CONFIGURAR ALERTAS DE PRESUPUESTO (ALERTAS Y LÍMITES) */}
      {activeSection === 'alerts' && (
        <BudgetAlertsSection
          categoryItems={categoryItems}
          budgets={budgets}
          currency={currency}
          daysRemaining={daysRemaining}
          daysInMonth={daysInMonth}
          currentDay={currentDay}
          monthProgressPct={monthProgressPct}
          onUpdateBudgets={onUpdateBudgets}
          onOpenEditCategory={handleOpenEdit}
          onSelectCategory={onSelectCategory}
        />
      )}

      {/* SECTION 3: PROYECCIÓN AUTOMÁTICA PARA LOS PRÓXIMOS MESES */}
      {activeSection === 'projection' && (
        <BudgetProjectionSection
          budgets={budgets}
          categoryMap={categoryMap}
          categoryColors={categoryColors}
          transactions={transactions}
          currency={currency}
          onUpdateBudgets={onUpdateBudgets}
        />
      )}

      {/* SECTION 4: TABLA COMPARATIVA (PRESUPUESTO VS. REAL) */}
      {activeSection === 'comparison' && (
        <BudgetComparisonSection
          categoryItems={categoryItems}
          currency={currency}
          selectedMonthName={selectedMonthObj.label}
          alertThreshold={alertThreshold}
          onOpenEditCategory={handleOpenEdit}
          onSelectCategory={onSelectCategory}
        />
      )}

      {/* DIRECT CATEGORY BUDGET EDIT MODAL */}
      {editingCategory && (
        <BudgetCategoryEditModal
          isOpen={true}
          onClose={() => setEditingCategory(null)}
          categoryName={editingCategory.name}
          currentBudget={editingCategory.currentLimit}
          currentSpent={editingCategory.currentSpent}
          currency={currency}
          categoryColor={editingCategory.color}
          subcategories={categoryMap[editingCategory.name] || []}
          subcategoriesBudgets={budgets.subcategories || {}}
          subcategoriesSpent={subcatSpending[editingCategory.name] || {}}
          onSave={handleSaveCategoryBudget}
        />
      )}
    </div>
  );
};
