import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Search,
  ArrowUpDown,
  Filter,
  ChevronDown,
  ChevronRight,
  Edit3,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Info,
  Layers,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import { Budgets, CategoryColors, CategoryMap, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BudgetInsightsSectionProps {
  budgets: Budgets;
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  transactions: Transaction[];
  currency: string;
  onEditCategory?: (category: string, currentLimit: number) => void;
  onSelectCategory?: (category: string) => void;
  onOpenBudgetModal?: () => void;
}

type FilterStatus = 'all' | 'critical_90' | 'exceeded_100' | 'healthy' | 'no_budget';
type SortOption = 'percentage' | 'spent' | 'budget' | 'overspent' | 'name';

interface CategoryInsightItem {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  remaining: number;
  overspent: number;
  isExceeded: boolean;
  isCritical90: boolean;
  isHealthy: boolean;
  hasBudget: boolean;
  color: string;
  dailyAllowance: number;
  txCount: number;
  subcategories: {
    name: string;
    spent: number;
    budget: number;
    percentage: number;
    isCritical90: boolean;
    isExceeded: boolean;
  }[];
}

export const BudgetInsightsSection: React.FC<BudgetInsightsSectionProps> = ({
  budgets,
  categoryMap = {},
  categoryColors = {},
  transactions = [],
  currency = 'ARS',
  onEditCategory,
  onSelectCategory,
  onOpenBudgetModal,
}) => {
  // Filters and controls
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('percentage');
  const [sortAscending, setSortAscending] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showSubcategoriesGlobal, setShowSubcategoriesGlobal] = useState<boolean>(false);

  // Time calculations
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - day);
  const monthLabel = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
  const monthIso = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Transactions of current month
  const expenses = useMemo(() => {
    const monthExpenses = transactions.filter(tx => tx && tx.tipoTransaccion !== 'ingreso' && tx.fecha?.startsWith(monthIso));
    return monthExpenses.length > 0 ? monthExpenses : transactions.filter(tx => tx && tx.tipoTransaccion !== 'ingreso');
  }, [transactions, monthIso]);

  // Aggregate spending by category and subcategory
  const { catSpending, subSpending, txCounts } = useMemo(() => {
    const catMap: Record<string, number> = {};
    const subMap: Record<string, Record<string, number>> = {};
    const countMap: Record<string, number> = {};

    expenses.forEach(tx => {
      const cat = tx.categoria || 'Sin categoría';
      const sub = tx.subcategoria || 'General';
      const amount = Number(tx.monto || 0);

      catMap[cat] = (catMap[cat] || 0) + amount;
      countMap[cat] = (countMap[cat] || 0) + 1;

      if (!subMap[cat]) subMap[cat] = {};
      subMap[cat][sub] = (subMap[cat][sub] || 0) + amount;
    });

    return { catSpending: catMap, subSpending: subMap, txCounts: countMap };
  }, [expenses]);

  // All known categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    Object.keys(budgets.categories || {}).forEach(c => set.add(c));
    Object.keys(categoryMap).forEach(c => set.add(c));
    Object.keys(catSpending).forEach(c => set.add(c));
    return Array.from(set);
  }, [budgets.categories, categoryMap, catSpending]);

  // Build structured insights for each category
  const insightItems: CategoryInsightItem[] = useMemo(() => {
    return allCategories.map(category => {
      const budget = Number(budgets.categories?.[category] || 0);
      const spent = Number(catSpending[category] || 0);
      const hasBudget = budget > 0;
      const percentage = hasBudget ? (spent / budget) * 100 : 0;
      const remaining = hasBudget ? Math.max(0, budget - spent) : 0;
      const overspent = hasBudget && spent > budget ? spent - budget : 0;
      const isExceeded = hasBudget && percentage >= 100;
      const isCritical90 = hasBudget && percentage >= 90;
      const isHealthy = hasBudget && percentage < 90;
      const dailyAllowance = remaining > 0 ? Math.round(remaining / daysRemaining) : 0;
      const color = categoryColors[category] || '#7928CA';
      const txCount = txCounts[category] || 0;

      // Subcategories detail
      const definedSubs = categoryMap[category] || [];
      const actualSubs = subSpending[category] || {};
      const subNames = Array.from(new Set([...definedSubs, ...Object.keys(actualSubs)]));

      const subcategories = subNames.map(subName => {
        const subSpent = Number(actualSubs[subName] || 0);
        const subBudget = Number(budgets.subcategories?.[subName] || 0);
        const subPct = subBudget > 0 ? (subSpent / subBudget) * 100 : 0;
        return {
          name: subName,
          spent: subSpent,
          budget: subBudget,
          percentage: subPct,
          isCritical90: subBudget > 0 && subPct >= 90,
          isExceeded: subBudget > 0 && subPct >= 100,
        };
      }).sort((a, b) => b.spent - a.spent);

      return {
        category,
        budget,
        spent,
        percentage,
        remaining,
        overspent,
        isExceeded,
        isCritical90,
        isHealthy,
        hasBudget,
        color,
        dailyAllowance,
        txCount,
        subcategories,
      };
    });
  }, [allCategories, budgets.categories, budgets.subcategories, catSpending, categoryMap, subSpending, txCounts, categoryColors, daysRemaining]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const withBudget = insightItems.filter(i => i.hasBudget);
    const critical90Items = withBudget.filter(i => i.isCritical90);
    const exceededItems = withBudget.filter(i => i.isExceeded);
    const healthyItems = withBudget.filter(i => i.isHealthy);

    const totalBudget = withBudget.reduce((sum, i) => sum + i.budget, 0);
    const totalSpent = withBudget.reduce((sum, i) => sum + i.spent, 0);
    const totalOverspent = exceededItems.reduce((sum, i) => sum + i.overspent, 0);
    const totalRemaining = withBudget.reduce((sum, i) => sum + i.remaining, 0);
    const globalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalCategoriesWithBudget: withBudget.length,
      critical90Count: critical90Items.length,
      critical90Items,
      exceededCount: exceededItems.length,
      healthyCount: healthyItems.length,
      totalBudget,
      totalSpent,
      totalOverspent,
      totalRemaining,
      globalPercentage,
    };
  }, [insightItems]);

  // Filtered & Sorted items
  const displayItems = useMemo(() => {
    let list = insightItems.filter(item => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesSub = item.subcategories.some(s => s.name.toLowerCase().includes(query));
        if (!matchesCat && !matchesSub) return false;
      }

      // Status filter
      if (filterStatus === 'critical_90') return item.isCritical90;
      if (filterStatus === 'exceeded_100') return item.isExceeded;
      if (filterStatus === 'healthy') return item.isHealthy;
      if (filterStatus === 'no_budget') return !item.hasBudget;
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      let diff = 0;
      if (sortOption === 'percentage') {
        diff = b.percentage - a.percentage;
      } else if (sortOption === 'spent') {
        diff = b.spent - a.spent;
      } else if (sortOption === 'budget') {
        diff = b.budget - a.budget;
      } else if (sortOption === 'overspent') {
        diff = b.overspent - a.overspent;
      } else if (sortOption === 'name') {
        diff = a.category.localeCompare(b.category);
      }
      return sortAscending ? -diff : diff;
    });

    return list;
  }, [insightItems, searchQuery, filterStatus, sortOption, sortAscending]);

  const toggleExpand = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER SECTION                                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-purple-100 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/70 via-white to-amber-50/40 dark:from-[#190731] dark:via-[#140728] dark:to-[#220d36] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-[#7928CA] dark:text-purple-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Insights de Presupuesto
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-purple-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                {monthLabel} · {daysRemaining} días restantes
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#2E0854] dark:text-white">
              Gasto Real vs. Límite Presupuestado
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Comparativa visual mediante <strong>gráficos de barras horizontales</strong>. Las categorías que superan el <span className="text-amber-600 dark:text-amber-400 font-bold">90%</span> de su límite asignado son resaltadas para prevenir sobregiros antes de fin de mes.
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenBudgetModal && (
              <button
                type="button"
                onClick={onOpenBudgetModal}
                className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1f093d] border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs font-black hover:bg-purple-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-[#7928CA]" />
                <span>Gestionar Límites</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Consumption Bar with 90% and 100% threshold markers */}
        <div className="mt-6 pt-5 border-t border-purple-100 dark:border-purple-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold mb-2">
            <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span>Presupuesto Mensual Total Consumido</span>
              <span className="text-slate-400 font-normal">
                ({formatCurrency(kpis.totalSpent, currency)} de {formatCurrency(kpis.totalBudget, currency)})
              </span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-amber-600 dark:text-amber-400 text-[11px] font-black flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Umbral de Alerta: 90%
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                kpis.globalPercentage >= 100
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : kpis.globalPercentage >= 90
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}>
                {kpis.globalPercentage.toFixed(1)}% Consumido
              </span>
            </div>
          </div>

          {/* Bar track with markers at 90% and 100% */}
          <div className="relative w-full h-1 rounded-full bg-slate-100 dark:bg-purple-950/80 overflow-visible">
            {/* 90% Threshold marker line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
              style={{ left: '90%' }}
              title="Umbral de Alerta 90%"
            >
              <div className="absolute -top-5 -translate-x-1/2 text-[9px] font-black text-amber-600 dark:text-amber-400 whitespace-nowrap bg-amber-50 dark:bg-amber-950/80 px-1 rounded border border-amber-300 dark:border-amber-800">
                90%
              </div>
            </div>

            {/* Fill bar */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                kpis.globalPercentage >= 100
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600'
                  : kpis.globalPercentage >= 90
                  ? 'bg-gradient-to-r from-[#7928CA] via-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-[#7928CA] to-[#A855F7]'
              }`}
              style={{ width: `${Math.min(100, kpis.globalPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
            <span>0%</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">90% Zona de Atención</span>
            <span>100% Límite</span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4 SUMMARY KPIS                                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Categorías > 90% */}
        <div className={`p-4 rounded-2xl border transition-all ${
          kpis.critical90Count > 0
            ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-xs'
            : 'bg-white dark:bg-[#16072b] border-slate-200 dark:border-purple-900/40'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">
              Categorías &gt;90%
            </span>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              kpis.critical90Count > 0
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300'
                : 'bg-slate-100 text-slate-500 dark:bg-purple-950/40 dark:text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {kpis.critical90Count}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {kpis.critical90Count === 1 ? '1 categoría en zona crítica' : `${kpis.critical90Count} categorías en zona crítica`}
          </p>
        </div>

        {/* KPI 2: Categorías Excedidas (>100%) */}
        <div className={`p-4 rounded-2xl border transition-all ${
          kpis.exceededCount > 0
            ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-xs'
            : 'bg-white dark:bg-[#16072b] border-slate-200 dark:border-purple-900/40'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">
              Excedidas (&gt;100%)
            </span>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              kpis.exceededCount > 0
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300'
            }`}>
              {kpis.exceededCount > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {kpis.exceededCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {kpis.exceededCount > 0 ? `Exceso: ${formatCurrency(kpis.totalOverspent, currency)}` : 'Sin sobregiros al 100%'}
          </p>
        </div>

        {/* KPI 3: Categorías Bajo Control (<90%) */}
        <div className="p-4 rounded-2xl border bg-white dark:bg-[#16072b] border-slate-200 dark:border-purple-900/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">
              Bajo Control (&lt;90%)
            </span>
            <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {kpis.healthyCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Margen seguro: {formatCurrency(kpis.totalRemaining, currency)}
          </p>
        </div>

        {/* KPI 4: Gasto Diario Disponible Seguro */}
        <div className="p-4 rounded-2xl border bg-white dark:bg-[#16072b] border-slate-200 dark:border-purple-900/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">
              Gasto Diario Sugerido
            </span>
            <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums truncate">
            {formatCurrency(Math.max(0, Math.round(kpis.totalRemaining / daysRemaining)), currency)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Por día para no sobrepasar el mes
          </p>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SPOTLIGHT ALERT BANNER: CATEGORIES EXCEEDING 90%             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {kpis.critical90Count > 0 ? (
        <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-purple-50/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-purple-950/20 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Flame className="w-5 h-5 text-amber-100" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                  Atención Prioritaria
                </span>
                <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                  {kpis.critical90Count} categoría{kpis.critical90Count === 1 ? '' : 's'} han excedido el 90% del límite asignado
                </span>
              </div>
              <p className="text-xs text-amber-950/80 dark:text-amber-200/80 mt-1">
                Te sugerimos revisar los gastos de estas categorías o ampliar sus presupuestos para no superar el límite antes de que termine el mes:
              </p>

              {/* Quick chip list of critical categories */}
              <div className="flex flex-wrap gap-2 mt-3">
                {kpis.critical90Items.map(item => (
                  <div
                    key={item.category}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#190731] border border-amber-200 dark:border-amber-800/80 shadow-2xs text-xs font-bold"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-800 dark:text-white font-black truncate max-w-[140px] sm:max-w-[200px]">
                      {item.category}
                    </span>
                    <span className={`font-mono text-[11px] font-black ${item.isExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {item.percentage.toFixed(0)}%
                    </span>
                    {onEditCategory && (
                      <button
                        type="button"
                        onClick={() => onEditCategory(item.category, item.budget)}
                        className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline ml-1 font-semibold cursor-pointer"
                        title="Editar límite de esta categoría"
                      >
                        Ajustar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200">
              ¡Excelente control presupuestario!
            </h4>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              Ninguna de tus categorías ha superado el umbral crítico del 90% este mes.
            </p>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FILTER CONTROLS & SEARCH                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-purple-900/40 bg-white dark:bg-[#16072b] p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-[#7928CA] dark:text-purple-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-purple-950/40'
              }`}
            >
              Todas ({insightItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('critical_90')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'critical_90'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Superan el 90% ({kpis.critical90Count})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('exceeded_100')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'exceeded_100'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Excedidas ({kpis.exceededCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('healthy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterStatus === 'healthy'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Bajo control ({kpis.healthyCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('no_budget')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterStatus === 'no_budget'
                  ? 'bg-slate-200 dark:bg-purple-900 text-slate-800 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-purple-950/40'
              }`}
            >
              Sin límite
            </button>
          </div>

          {/* Search box & sort */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-purple-900/60 bg-slate-50 dark:bg-[#140728] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value as SortOption)}
                aria-label="Criterio de ordenamiento"
                className="text-xs font-bold rounded-xl border border-slate-200 dark:border-purple-900/60 bg-slate-50 dark:bg-[#140728] text-slate-700 dark:text-slate-300 px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="percentage">Mayor % de Límite</option>
                <option value="spent">Mayor Gasto Real</option>
                <option value="budget">Mayor Presupuesto</option>
                <option value="overspent">Mayor Exceso</option>
                <option value="name">Nombre (A-Z)</option>
              </select>
              <button
                type="button"
                onClick={() => setSortAscending(!sortAscending)}
                title={sortAscending ? 'Orden ascendente' : 'Orden descendente'}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-purple-900/60 bg-slate-50 dark:bg-[#140728] text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Global subcategory toggle helper */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-purple-900/30 text-[11px] text-slate-500">
          <span>Mostrando {displayItems.length} categorías</span>
          <button
            type="button"
            onClick={() => setShowSubcategoriesGlobal(!showSubcategoriesGlobal)}
            className="text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3 h-3" />
            <span>{showSubcategoriesGlobal ? 'Ocultar todas las subcategorías' : 'Expandir todas las subcategorías'}</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* HORIZONTAL BAR CHARTS LIST                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {displayItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-purple-900/50 bg-slate-50/50 dark:bg-[#140728]">
          <BarChart2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
            No se encontraron categorías con los filtros actuales
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Probá quitando el filtro de búsqueda o cambiando el estado seleccionado.
          </p>
          <button
            type="button"
            onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-[#7928CA] dark:text-purple-200 text-xs font-black hover:bg-purple-200 transition-colors"
          >
            Ver todas las categorías
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayItems.map(item => {
            const isExpanded = showSubcategoriesGlobal || !!expandedCategories[item.category];
            // Calculate scale: if exceeded, normalize bar so excess is visibly noticeable past 100%
            const maxScale = Math.max(100, item.percentage > 100 ? Math.min(150, Math.ceil(item.percentage / 10) * 10) : 100);
            const spentPercentScaled = item.budget > 0 ? Math.min(100, (item.spent / (item.budget * (maxScale / 100))) * 100) : 0;
            const threshold90Scaled = (90 / maxScale) * 100;
            const limit100Scaled = (100 / maxScale) * 100;

            return (
              <div
                key={item.category}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  item.isExceeded
                    ? 'border-rose-300 dark:border-rose-900/60 bg-gradient-to-r from-rose-50/40 via-white to-white dark:from-rose-950/20 dark:via-[#16072b] dark:to-[#16072b] shadow-xs ring-1 ring-rose-400/20'
                    : item.isCritical90
                    ? 'border-amber-300 dark:border-amber-900/60 bg-gradient-to-r from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-[#16072b] dark:to-[#16072b] shadow-xs ring-1 ring-amber-400/20'
                    : 'border-slate-200 dark:border-purple-900/40 bg-white dark:bg-[#16072b] hover:border-purple-200 dark:hover:border-purple-800'
                }`}
              >
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Category Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        {item.category}
                      </h4>

                      {/* Status Badges */}
                      {item.isExceeded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertCircle className="w-3 h-3" />
                          <span>EXCEDIDO &gt;100%</span>
                        </span>
                      ) : item.isCritical90 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>ZONA CRÍTICA &gt;90%</span>
                        </span>
                      ) : item.hasBudget ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>En regla</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-purple-950/40">
                          Sin presupuesto
                        </span>
                      )}
                    </div>

                    {/* Numeric Figures (Spent vs Budget) */}
                    <div className="flex items-baseline gap-2 shrink-0">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
                        {formatCurrency(item.spent, currency)}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold font-mono tabular-nums">
                        {item.hasBudget ? `de ${formatCurrency(item.budget, currency)}` : '(sin límite)'}
                      </span>
                      {item.hasBudget && (
                        <span className={`text-xs font-black font-mono tabular-nums px-2 py-0.5 rounded-lg ${
                          item.isExceeded
                            ? 'bg-rose-500 text-white'
                            : item.isCritical90
                            ? 'bg-amber-500 text-white'
                            : 'bg-purple-100 dark:bg-purple-900/60 text-[#7928CA] dark:text-purple-300'
                        }`}>
                          {item.percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* HORIZONTAL BAR GRAPH                                     */}
                  {/* ───────────────────────────────────────────────────────── */}
                  {item.hasBudget ? (
                    <div className="space-y-1.5 pt-1">
                      {/* Bar Track Container */}
                      <div className="relative w-full h-5 rounded-xl bg-slate-100 dark:bg-purple-950/70 overflow-hidden shadow-inner">
                        {/* 90% Threshold vertical guideline */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-500/80 z-20 pointer-events-none"
                          style={{ left: `${threshold90Scaled}%` }}
                        >
                          <div className="absolute -top-0.5 right-1 text-[8px] font-black text-amber-700 dark:text-amber-300 opacity-90">
                            90%
                          </div>
                        </div>

                        {/* 100% Limit vertical guideline */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-600 dark:bg-slate-300 z-20 pointer-events-none"
                          style={{ left: `${limit100Scaled}%` }}
                        >
                          <div className="absolute -top-0.5 left-1 text-[8px] font-black text-slate-600 dark:text-slate-300 opacity-90">
                            100%
                          </div>
                        </div>

                        {/* Spent Horizontal Bar Fill */}
                        <div
                          className={`h-full rounded-l-xl transition-all duration-500 relative ${
                            item.isExceeded
                              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600'
                              : item.isCritical90
                              ? 'bg-gradient-to-r from-[#7928CA] via-amber-500 to-orange-500'
                              : 'bg-gradient-to-r from-[#7928CA] to-[#A855F7]'
                          }`}
                          style={{ width: `${Math.min(100, spentPercentScaled)}%` }}
                        >
                          {/* Inner percentage text if bar is wide enough */}
                          {spentPercentScaled > 15 && (
                            <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-black text-white font-mono drop-shadow-xs">
                              {item.percentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bar scale indicators & metrics below */}
                      <div className="flex items-center justify-between text-[11px] font-semibold pt-0.5">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                          {item.isExceeded ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                              ⚠️ Superado por {formatCurrency(item.overspent, currency)}
                            </span>
                          ) : (
                            <span className="font-mono">
                              Disponible: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(item.remaining, currency)}</strong>
                            </span>
                          )}

                          {!item.isExceeded && item.dailyAllowance > 0 && (
                            <span className="hidden sm:inline-block text-slate-400">
                              · Gasto seguro: <strong className="text-slate-600 dark:text-slate-300 font-mono">{formatCurrency(item.dailyAllowance, currency)}/día</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.isCritical90 && !item.isExceeded && (
                            <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Restan solo {formatCurrency(item.remaining, currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-purple-950/30 text-xs text-slate-500 flex items-center justify-between">
                      <span>Esta categoría no tiene un límite mensual fijado.</span>
                      {onEditCategory && (
                        <button
                          type="button"
                          onClick={() => onEditCategory(item.category, 0)}
                          className="text-xs font-black text-[#7928CA] dark:text-purple-400 hover:underline cursor-pointer"
                        >
                          Asignar presupuesto
                        </button>
                      )}
                    </div>
                  )}

                  {/* Footer Action Strip */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-purple-900/30 text-xs">
                    {/* Left: Subcategories trigger if available */}
                    {item.subcategories.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.category)}
                        className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-[#7928CA] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        <span>
                          {isExpanded ? 'Ocultar' : 'Ver'} {item.subcategories.length} subcategoría{item.subcategories.length === 1 ? '' : 's'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Sin subcategorías registradas</span>
                    )}

                    {/* Right: Quick action buttons */}
                    <div className="flex items-center gap-2">
                      {onSelectCategory && (
                        <button
                          type="button"
                          onClick={() => onSelectCategory(item.category)}
                          className="text-[11px] font-bold text-slate-500 hover:text-[#7928CA] dark:text-slate-400 dark:hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Ver {item.txCount} movimientos</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      {onEditCategory && (
                        <button
                          type="button"
                          onClick={() => onEditCategory(item.category, item.budget)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#7928CA] dark:text-purple-300 hover:bg-purple-100 transition-colors text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.hasBudget ? 'Ajustar límite' : 'Asignar'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* EXPANDABLE SUBCATEGORIES BREAKDOWN WITH HORIZONTAL BARS   */}
                  {/* ───────────────────────────────────────────────────────── */}
                  {isExpanded && item.subcategories.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-purple-900/40 space-y-2.5 bg-slate-50/70 dark:bg-purple-950/20 p-3 rounded-xl">
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <span>Desglose por Subcategoría</span>
                        <span>Gasto vs. Límite</span>
                      </div>

                      {item.subcategories.map(sub => {
                        const hasSubBudget = sub.budget > 0;
                        const subShare = item.spent > 0 ? (sub.spent / item.spent) * 100 : 0;
                        const subPercent = hasSubBudget ? sub.percentage : subShare;

                        return (
                          <div key={sub.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>{sub.name}</span>
                              </span>
                              <div className="flex items-center gap-2 font-mono tabular-nums text-[11px]">
                                <span className="font-bold text-slate-800 dark:text-white">
                                  {formatCurrency(sub.spent, currency)}
                                </span>
                                {hasSubBudget ? (
                                  <span className="text-slate-400">/ {formatCurrency(sub.budget, currency)}</span>
                                ) : (
                                  <span className="text-slate-400">({subShare.toFixed(0)}% del total)</span>
                                )}
                                {hasSubBudget && (
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    sub.isExceeded
                                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                      : sub.isCritical90
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                      : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                  }`}>
                                    {sub.percentage.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Mini horizontal bar for subcategory */}
                            <div className="h-1 rounded-full bg-slate-200 dark:bg-purple-950/60 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  sub.isExceeded
                                    ? 'bg-rose-500'
                                    : sub.isCritical90
                                    ? 'bg-amber-500'
                                    : 'bg-[#7928CA]'
                                }`}
                                style={{ width: `${Math.min(100, subPercent)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
