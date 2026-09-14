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
  X
} from 'lucide-react';
import { Budgets, CategoryColors, CategoryMap, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { BudgetComparisonView } from './BudgetComparisonView';

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
  // View mode: 'cards' (Control y Semáforo) or 'comparison' (Tabla detallada histórica)
  const [viewMode, setViewMode] = useState<'cards' | 'comparison'>('cards');
  
  // Search & Filter state for category cards
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('percentage');

  // Quick edit category limit modal state
  const [editingCategory, setEditingCategory] = useState<{
    name: string;
    currentLimit: number;
    currentSpent: number;
  } | null>(null);
  const [quickLimitInput, setQuickLimitInput] = useState<string>('');

  // 1. Month Pacing Calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const monthProgressPct = Math.round((currentDay / daysInMonth) * 100);
  const monthName = now.toLocaleDateString('es-AR', { month: 'long' });
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Filter transactions for this month (expenses only)
  const currentMonthIso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  const currentMonthExpenses = useMemo(() => {
    return (transactions || []).filter(tx => {
      if (!tx || !tx.fecha) return false;
      if (tx.tipoTransaccion === 'ingreso') return false;
      return tx.fecha.startsWith(currentMonthIso);
    });
  }, [transactions, currentMonthIso]);

  // Fallback to all expenses if dataset doesn't have current month (e.g. historical sample data)
  const effectiveExpenses = currentMonthExpenses.length > 0 
    ? currentMonthExpenses 
    : (transactions || []).filter(tx => tx && tx.tipoTransaccion !== 'ingreso');

  const alertThreshold = budgets?.alertThresholdPercent || 80;

  // 2. Compute spending per category
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

  // 3. Complete category list
  const categoryItems = useMemo(() => {
    const set = new Set<string>([
      ...Object.keys(categoryMap || {}),
      ...Object.keys(budgets?.categories || {}),
      ...Object.keys(catSpending),
    ]);

    return Array.from(set).map(cat => {
      const budget = budgets?.categories?.[cat] || 0;
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

      const dailyAllowance = budget > 0 && remaining > 0 ? Math.round(remaining / daysRemaining) : 0;

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
      };
    });
  }, [categoryMap, budgets, catSpending, alertThreshold, daysRemaining, categoryColors]);

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
    const dailySafeSpending = netRemaining > 0 ? Math.round(netRemaining / daysRemaining) : 0;

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

  // 5. Pacing status evaluation
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
        desc: `Consumiste el ${globalPct}% del presupuesto mensual a ${daysRemaining} días del cierre.`,
        isOptimal: false,
      };
    }
    if (globalPct > monthProgressPct + 15) {
      return {
        title: 'Ritmo de Gasto Acelerado',
        badge: 'Atención',
        color: 'bg-amber-50 text-amber-900 border-amber-200',
        desc: `Vas en el día ${currentDay} (${monthProgressPct}% del mes), pero ya gastaste el ${globalPct}%. Conviene frenar gastos no esenciales.`,
        isOptimal: false,
      };
    }
    return {
      title: 'Ritmo Financiero Saludable',
      badge: 'Bajo Control',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: `Día ${currentDay} (${monthProgressPct}% del mes) con el ${globalPct}% gastado. Vas a buen ritmo para cerrar el mes con superávit.`,
      isOptimal: true,
    };
  }, [globalSummary, monthProgressPct, currentDay, daysRemaining]);

  // 6. Filtered and Sorted Category Items
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

  // Quick edit handlers
  const handleOpenQuickEdit = (item: typeof categoryItems[0]) => {
    setEditingCategory({
      name: item.category,
      currentLimit: item.budget,
      currentSpent: item.spent,
    });
    setQuickLimitInput(item.budget > 0 ? String(item.budget) : (item.spent > 0 ? String(item.spent) : '50000'));
  };

  const handleSaveQuickLimit = () => {
    if (!editingCategory) return;
    const num = Math.max(0, Math.round(Number(quickLimitInput) || 0));
    const newCategories = {
      ...(budgets.categories || {}),
      [editingCategory.name]: num,
    };
    const updated: Budgets = {
      ...budgets,
      categories: newCategories,
    };
    if (onUpdateBudgets) {
      onUpdateBudgets(updated);
    }
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & PRIMARY CONTROLS */}
      <section className="bg-white p-5 sm:p-7 rounded-3xl shadow-[0_4px_24px_-4px_rgba(121,40,202,0.07)] border border-purple-100/90 space-y-6">
        
        {/* Top Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#7928CA] flex items-center justify-center shadow-xs">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="font-extrabold text-[#2E0854] text-lg sm:text-xl tracking-tight">
                Control y Límites de Presupuestos
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100/80 text-[#7928CA] font-bold text-xs border border-purple-200">
                {monthNameCapitalized} {currentYear}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                Alerta al {alertThreshold}%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Controlá el ritmo de gasto diario, detectá desvíos a tiempo y asigná límites por categoría para no llegar a fin de mes en rojo.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
            {/* View Switcher: Tablero vs Detalle */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#7928CA] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Semáforo & Control</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('comparison')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'comparison'
                    ? 'bg-white text-[#7928CA] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Tabla Comparativa</span>
              </button>
            </div>

            <button
              onClick={onOpenBudgetModal}
              className="px-4 py-2 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Ajustar límites de forma masiva o proyectar aumentos por inflación"
            >
              <Settings2 className="w-4 h-4" />
              <span>Configurar / Inflación</span>
            </button>
          </div>
        </div>

        {/* 3 HIGH-IMPACT METRIC CARDS FOR EFFECTIVE BUDGET CONTROL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          
          {/* Card 1: Presupuesto Global del Mes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/40 border border-purple-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5 text-purple-900">
                <Coins className="w-4 h-4 text-[#7928CA]" />
                Presupuesto del Mes
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
                <span>Día {currentDay} de {daysInMonth} ({monthProgressPct}% del mes)</span>
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

          {/* Card 2: Margen Diario Seguro (Pacing) */}
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
                <>
                  Margen máximo por día para no pasarte del presupuesto antes del <strong>{daysInMonth} de {monthName}</strong>.
                </>
              ) : (
                <span className="text-rose-600 font-bold">
                  Sin margen diario disponible. El presupuesto mensual ha sido sobrepasado.
                </span>
              )}
            </p>
          </div>

          {/* Card 3: Semáforo y Estado de Salud de Categorías */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/30 border border-slate-200 space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Semáforo de Categorías
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${pacingEvaluation.color}`}>
                {pacingEvaluation.badge}
              </span>
            </div>

            {/* Status Breakdown Chips */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('safe')}
                className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  statusFilter === 'safe'
                    ? 'bg-emerald-100 border-emerald-300 font-bold text-emerald-900'
                    : 'bg-emerald-50/70 border-emerald-100 text-emerald-800 hover:bg-emerald-100/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Bajo control
                </span>
                <strong className="font-outfit">{globalSummary.okCount}</strong>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('risk')}
                className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  statusFilter === 'risk'
                    ? 'bg-rose-100 border-rose-300 font-bold text-rose-900'
                    : 'bg-rose-50/70 border-rose-100 text-rose-800 hover:bg-rose-100/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  En riesgo / Exceso
                </span>
                <strong className="font-outfit">
                  {globalSummary.exceededCount + globalSummary.warningCount}
                </strong>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('no_budget')}
                className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  statusFilter === 'no_budget'
                    ? 'bg-slate-200 border-slate-300 font-bold text-slate-900'
                    : 'bg-slate-100/70 border-slate-200 text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Sin límite
                </span>
                <strong className="font-outfit">{globalSummary.noBudgetCount}</strong>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-purple-100 border-purple-300 font-bold text-[#7928CA]'
                    : 'bg-purple-50/50 border-purple-100 text-slate-700 hover:bg-purple-100/50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>Todas</span>
                </span>
                <strong className="font-outfit">{globalSummary.categoriesCount}</strong>
              </button>
            </div>
          </div>
        </div>

        {/* RITMO & DIAGNOSIS BANNER */}
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
              onClick={() => setStatusFilter('risk')}
              className="px-3.5 py-1.5 bg-white rounded-xl shadow-xs border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Ver categorías en riesgo
            </button>
          )}
        </div>
      </section>

      {/* VIEW MODE 1: INTERACTIVE CARDS & CONTROL DASHBOARD */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          
          {/* Filtering & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7928CA]"
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
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas ({categoryItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('risk')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'risk' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  En Riesgo ({globalSummary.exceededCount + globalSummary.warningCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('safe')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'safe' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700'
                  }`}
                >
                  Seguras ({globalSummary.okCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('no_budget')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'no_budget' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sin Límite ({globalSummary.noBudgetCount})
                </button>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Ordenar:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="percentage">Mayor % Consumido</option>
                  <option value="spent">Mayor Gasto ($)</option>
                  <option value="remaining">Menor Saldo Restante</option>
                  <option value="name">Alfabético (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CATEGORY CONTROL CARDS GRID */}
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
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">
                            {item.category}
                          </h4>
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
                          <span className="text-xs text-slate-400 font-medium block">Gastado este mes</span>
                          <span className="text-lg font-black text-slate-900 font-outfit">
                            {formatCurrency(item.spent, currency)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-medium block">Límite fijado</span>
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
                            {/* 80% threshold tick indicator */}
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

                            {item.dailyAllowance > 0 && !isExceeded && (
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
                            onClick={() => handleOpenQuickEdit(item)}
                            className="text-[#7928CA] font-bold hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Fijar límite
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      {/* Navigate to Transactions Table for this category */}
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

                      {/* Quick Edit Budget Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenQuickEdit(item)}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#7928CA] hover:bg-purple-100 font-bold flex items-center gap-1 transition-all cursor-pointer text-xs active:scale-95"
                        title="Modificar límite de presupuesto para esta categoría"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{item.budget > 0 ? 'Editar límite' : 'Asignar límite'}</span>
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

      {/* VIEW MODE 2: HISTORICAL DETAILED COMPARISON TABLE */}
      {viewMode === 'comparison' && (
        <BudgetComparisonView
          budgets={budgets}
          categoryMap={categoryMap}
          categoryColors={categoryColors}
          transactions={transactions}
          currency={currency}
        />
      )}

      {/* QUICK EDIT CATEGORY LIMIT MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-purple-100 space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7928CA] flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Límite para {editingCategory.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Presupuesto mensual asignado
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditingCategory(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Spent Info */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Gasto actual este mes:</span>
              <strong className="font-bold text-slate-900 font-outfit">
                {formatCurrency(editingCategory.currentSpent, currency)}
              </strong>
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Nuevo límite mensual ({currency}):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={quickLimitInput}
                  onChange={(e) => setQuickLimitInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-base font-outfit focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-[#7928CA]"
                  placeholder="0"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Presets based on current spend */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Sugerencias rápidas:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {editingCategory.currentSpent > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuickLimitInput(String(Math.round(editingCategory.currentSpent * 1.15)))}
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7928CA] font-bold text-center transition-colors cursor-pointer"
                  >
                    +15% del gasto ({formatCurrency(Math.round(editingCategory.currentSpent * 1.15), currency)})
                  </button>
                )}
                {editingCategory.currentSpent > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuickLimitInput(String(Math.ceil(editingCategory.currentSpent / 10000) * 10000))}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-center transition-colors cursor-pointer"
                  >
                    Redondear ({formatCurrency(Math.ceil(editingCategory.currentSpent / 10000) * 10000, currency)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setQuickLimitInput('0')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-center border border-slate-200 transition-colors cursor-pointer"
                >
                  Sin límite ($0)
                </button>
                {editingCategory.currentLimit > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuickLimitInput(String(Math.round(editingCategory.currentLimit * 1.1)))}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-center transition-colors cursor-pointer"
                  >
                    +10% inflación
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuickLimit}
                className="px-5 py-2 bg-gradient-to-r from-[#7928CA] to-[#9d4edd] hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Límite</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
