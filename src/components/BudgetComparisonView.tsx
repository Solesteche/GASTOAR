import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpDown, 
  CalendarRange, 
  ChevronDown, 
  BarChart3, 
  Filter, 
  SlidersHorizontal,
  Info,
  DollarSign,
  PieChart,
  Layers,
  Sparkles,
  Search,
  Pin,
  Check
} from 'lucide-react';
import { Budgets, CategoryColors, CategoryMap, DateRangePreset, ExpenseMode, Transaction } from '../types';
import { formatCurrency, formatDateEs, isDateInRange } from '../utils/formatters';

interface BudgetComparisonViewProps {
  budgets: Budgets;
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  transactions: Transaction[];
  currency: string;
}

type SortField = 'spent' | 'budget' | 'difference' | 'percentage' | 'name';
type SortDirection = 'asc' | 'desc';

export const BudgetComparisonView: React.FC<BudgetComparisonViewProps> = ({
  budgets,
  categoryMap,
  categoryColors,
  transactions,
  currency = 'ARS',
}) => {
  // Date range filters
  const [dateRange, setDateRange] = useState<DateRangePreset>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [expenseMode, setExpenseMode] = useState<ExpenseMode>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('difference');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'exceeded' | 'warning' | 'ok' | 'no_budget'>('all');

  // Pinned date range state for Budget View
  const [isRangePinned, setIsRangePinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gastoar_is_budget_pinned') === 'true';
    } catch {
      return false;
    }
  });

  // Load saved pinned date if previously set
  useEffect(() => {
    try {
      if (localStorage.getItem('gastoar_is_budget_pinned') === 'true') {
        const saved = localStorage.getItem('gastoar_pinned_budget_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.dateRange) setDateRange(parsed.dateRange);
          if (parsed.startDate) setStartDate(parsed.startDate);
          if (parsed.endDate) setEndDate(parsed.endDate);
          if (parsed.selectedMonth !== undefined) setSelectedMonth(parsed.selectedMonth);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const togglePinRange = (newVal?: boolean) => {
    const targetVal = typeof newVal === 'boolean' ? newVal : !isRangePinned;
    setIsRangePinned(targetVal);
    try {
      localStorage.setItem('gastoar_is_budget_pinned', String(targetVal));
      if (targetVal) {
        localStorage.setItem('gastoar_pinned_budget_data', JSON.stringify({
          dateRange,
          startDate,
          endDate,
          selectedMonth
        }));
      } else {
        localStorage.removeItem('gastoar_pinned_budget_data');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isRangePinned) {
      try {
        localStorage.setItem('gastoar_pinned_budget_data', JSON.stringify({
          dateRange,
          startDate,
          endDate,
          selectedMonth
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isRangePinned, dateRange, startDate, endDate, selectedMonth]);

  // Generate available months for quick selection
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const now = new Date();
    const curMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(curMonthStr);
    monthSet.add(prevMonthStr);

    transactions.forEach(t => {
      if (t.fecha && t.fecha.length >= 7) {
        monthSet.add(t.fecha.slice(0, 7));
      }
    });

    return Array.from(monthSet).sort().reverse().map(ym => {
      const [year, month] = ym.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      return { value: ym, label: label.charAt(0).toUpperCase() + label.slice(1) };
    });
  }, [transactions]);

  // Filter transactions by date range and expense mode
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Date filter
      const inDate = isDateInRange(t.fecha, dateRange, startDate, endDate, selectedMonth);
      if (!inDate) return false;

      // Mode filter
      if (expenseMode === 'individual' && t.tipoGasto !== 'individual') return false;
      if (expenseMode === 'pareja' && t.tipoGasto !== 'pareja') return false;

      return true;
    });
  }, [transactions, dateRange, startDate, endDate, selectedMonth, expenseMode]);

  // Calculate comparison rows per category
  const comparisonData = useMemo(() => {
    // 1. Calculate actual spent per category in filtered transactions
    const spentByCategory: Record<string, { total: number; count: number; subcategories: Record<string, number> }> = {};

    filteredTransactions.forEach(tx => {
      if (!spentByCategory[tx.categoria]) {
        spentByCategory[tx.categoria] = { total: 0, count: 0, subcategories: {} };
      }
      spentByCategory[tx.categoria].total += tx.monto;
      spentByCategory[tx.categoria].count += 1;

      if (tx.subcategoria) {
        spentByCategory[tx.categoria].subcategories[tx.subcategoria] = 
          (spentByCategory[tx.categoria].subcategories[tx.subcategoria] || 0) + tx.monto;
      }
    });

    // 2. Combine all categories (from categoryMap + any present in transactions)
    const allCategories = Array.from(
      new Set([...Object.keys(categoryMap), ...Object.keys(spentByCategory)])
    );

    return allCategories.map(cat => {
      const budget = budgets.categories[cat] || 0;
      const catSpentData = spentByCategory[cat] || { total: 0, count: 0, subcategories: {} };
      const spent = catSpentData.total;
      const count = catSpentData.count;
      const difference = budget > 0 ? budget - spent : -spent;
      const pct = budget > 0 ? Math.round((spent / budget) * 100) : (spent > 0 ? 100 : 0);

      // Status calculation
      let status: 'exceeded' | 'warning' | 'ok' | 'no_budget' = 'no_budget';
      if (budget > 0) {
        if (pct > 100) status = 'exceeded';
        else if (pct >= 85) status = 'warning';
        else status = 'ok';
      }

      // Top subcategory
      const sortedSubs = Object.entries(catSpentData.subcategories).sort((a, b) => b[1] - a[1]);
      const topSub = sortedSubs.length > 0 ? sortedSubs[0] : null;

      return {
        category: cat,
        budget,
        spent,
        count,
        difference,
        percentage: pct,
        status,
        color: categoryColors[cat] || '#6366f1',
        topSub,
      };
    });
  }, [categoryMap, budgets, filteredTransactions, categoryColors]);

  // Overall Totals for the selected range
  const summary = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    let totalSpentWithBudget = 0;
    let categoriesWithBudget = 0;
    let exceededCategories = 0;
    let onTrackCategories = 0;

    comparisonData.forEach(row => {
      totalSpent += row.spent;
      if (row.budget > 0) {
        totalBudget += row.budget;
        totalSpentWithBudget += row.spent;
        categoriesWithBudget++;
        if (row.status === 'exceeded') exceededCategories++;
        else onTrackCategories++;
      }
    });

    const netDifference = totalBudget - totalSpentWithBudget;
    const globalPct = totalBudget > 0 ? Math.round((totalSpentWithBudget / totalBudget) * 100) : 0;
    const isExceeded = netDifference < 0;

    return {
      totalBudget,
      totalSpent,
      totalSpentWithBudget,
      netDifference,
      globalPct,
      isExceeded,
      categoriesWithBudget,
      exceededCategories,
      onTrackCategories,
      txCount: filteredTransactions.length,
    };
  }, [comparisonData, filteredTransactions]);

  // Filtered & Sorted Comparison Rows
  const displayedRows = useMemo(() => {
    return comparisonData
      .filter(row => {
        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          if (!row.category.toLowerCase().includes(term)) return false;
        }

        // Status filter
        if (statusFilter === 'exceeded' && row.status !== 'exceeded') return false;
        if (statusFilter === 'warning' && row.status !== 'warning') return false;
        if (statusFilter === 'ok' && row.status !== 'ok') return false;
        if (statusFilter === 'no_budget' && row.status !== 'no_budget') return false;

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'difference') {
          // When sorting by difference, exceeded categories should appear first if desc
          valA = a.difference;
          valB = b.difference;
        }

        if (typeof valA === 'string') {
          return sortDirection === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [comparisonData, searchTerm, statusFilter, sortField, sortDirection]);

  // Toggle sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  // Date range label formatter
  const dateRangeLabel = useMemo(() => {
    if (selectedMonth) {
      const found = availableMonths.find(m => m.value === selectedMonth);
      return found ? found.label : selectedMonth;
    }
    switch (dateRange) {
      case 'this_month': return 'Este Mes en Curso';
      case 'last_month': return 'Mes Anterior';
      case 'last_30_days': return 'Últimos 30 días';
      case 'last_90_days': return 'Últimos 90 días (Trimestre)';
      case 'this_year': return 'Año Actual';
      case 'custom': 
        return startDate && endDate 
          ? `${formatDateEs(startDate)} al ${formatDateEs(endDate)}`
          : 'Rango Personalizado';
      default: return 'Todo el Historial';
    }
  }, [dateRange, selectedMonth, availableMonths, startDate, endDate]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Comparativa: Presupuesto vs. Consumo Real
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Analiza desvíos, ahorros y porcentaje de ejecución presupuestaria por rango de fechas
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Range Badge & Pin Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold ${
            isRangePinned
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            {isRangePinned ? (
              <Pin className="w-4 h-4 fill-white rotate-45" />
            ) : (
              <Calendar className="w-4 h-4 text-amber-500" />
            )}
            <span>Período: <strong className={isRangePinned ? 'text-white' : 'text-slate-900'}>{dateRangeLabel}</strong></span>
            {isRangePinned && (
              <span className="ml-1 text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">
                Fijado
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => togglePinRange()}
            title={isRangePinned ? "Desfijar rango de fechas" : "Fijar rango de fechas actual"}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isRangePinned
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${isRangePinned ? 'text-amber-600 fill-amber-600 rotate-45' : 'text-slate-400'}`} />
            <span>{isRangePinned ? 'Fijado' : 'Fijar Fecha'}</span>
          </button>
        </div>
      </div>

      {/* 2. Date Range & Filters Toolbar */}
      <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
        isRangePinned 
          ? 'bg-amber-50/40 border-amber-200 ring-2 ring-amber-500/10' 
          : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Quick Pin Checkbox */}
            <label 
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border cursor-pointer select-none transition-all text-xs font-semibold mr-1 ${
                isRangePinned 
                  ? 'bg-amber-100/80 border-amber-300 text-amber-900' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Fijar rango de fechas mientras la casilla esté tildada"
            >
              <div className="relative flex items-center justify-center shrink-0">
                <input
                  type="checkbox"
                  checked={isRangePinned}
                  onChange={(e) => togglePinRange(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                  isRangePinned
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'bg-white border-slate-300'
                }`}>
                  {isRangePinned && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
              <span className="flex items-center gap-1">
                <Pin className={`w-3 h-3 ${isRangePinned ? 'text-amber-700 fill-amber-700 rotate-45' : 'text-slate-400'}`} />
                Fijar
              </span>
            </label>

            <button
              onClick={() => { setDateRange('this_month'); setSelectedMonth(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRange === 'this_month' && !selectedMonth
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => { setDateRange('last_month'); setSelectedMonth(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRange === 'last_month' && !selectedMonth
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Mes Anterior
            </button>
            <button
              onClick={() => { setDateRange('last_30_days'); setSelectedMonth(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRange === 'last_30_days' && !selectedMonth
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Últimos 30 días
            </button>
            <button
              onClick={() => { setDateRange('last_90_days'); setSelectedMonth(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRange === 'last_90_days' && !selectedMonth
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Últimos 90 días
            </button>
            <button
              onClick={() => { setDateRange('this_year'); setSelectedMonth(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRange === 'this_year' && !selectedMonth
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Año Actual
            </button>
            <button
              onClick={() => { setDateRange('custom'); setSelectedMonth(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                dateRange === 'custom' && !selectedMonth
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Personalizado</span>
            </button>
          </div>

          {/* Month Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Mes específico:</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value) setDateRange('this_month');
              }}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">(Seleccionar mes)</option>
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Pickers (if dateRange === 'custom') */}
        {dateRange === 'custom' && !selectedMonth && (
          <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-slate-200/80 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                Limpiar fechas
              </button>
            )}
          </div>
        )}

        {/* Sub-Filters: Mode & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setExpenseMode('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                expenseMode === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos los Gastos
            </button>
            <button
              onClick={() => setExpenseMode('individual')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                expenseMode === 'individual' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gastos Individuales
            </button>
            <button
              onClick={() => setExpenseMode('pareja')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                expenseMode === 'pareja' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gastos en Pareja
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* 3. High-Level Summary KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Presupuesto Total */}
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Presupuesto Asignado</span>
            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              {summary.categoriesWithBudget} con límite
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(summary.totalBudget, currency)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            Suma de metas en categorías activas
          </p>
        </div>

        {/* Card 2: Consumo Real Registrado */}
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Consumo Real</span>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              {summary.txCount} compras
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(summary.totalSpent, currency)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            Total gastado en el rango seleccionado
          </p>
        </div>

        {/* Card 3: Variación / Brecha Presupuestaria */}
        <div className={`rounded-2xl p-4 border space-y-1.5 ${
          summary.isExceeded 
            ? 'bg-rose-50/80 border-rose-200 text-rose-950' 
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">
              {summary.isExceeded ? 'Excedente / Desvío' : 'Saldo a Favor / Ahorro'}
            </span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              summary.isExceeded ? 'bg-rose-200 text-rose-700' : 'bg-emerald-200 text-emerald-700'
            }`}>
              {summary.isExceeded ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black tracking-tight ${
            summary.isExceeded ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            {summary.isExceeded ? '+' : ''}{formatCurrency(Math.abs(summary.netDifference), currency)}
          </p>
          <p className="text-[11px] font-medium opacity-80">
            {summary.isExceeded 
              ? `Superaste el presupuesto por ${Math.abs(summary.globalPct - 100)}%` 
              : `Ahorraste el ${100 - summary.globalPct}% del límite fijado`}
          </p>
        </div>

        {/* Card 4: % Ejecutado Global */}
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">% Ejecución Global</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              summary.globalPct > 100 
                ? 'bg-rose-100 text-rose-700' 
                : summary.globalPct >= 85 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-emerald-100 text-emerald-700'
            }`}>
              {summary.globalPct}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.globalPct > 100 
                  ? 'bg-rose-500' 
                  : summary.globalPct >= 85 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(summary.globalPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span>{summary.onTrackCategories} en meta</span>
            <span className="text-rose-600">{summary.exceededCategories} excedidas</span>
          </div>
        </div>
      </div>

      {/* 4. Status Filter Pills */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-400 mr-1 hidden sm:inline">Mostrar:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({comparisonData.length})
          </button>
          <button
            onClick={() => setStatusFilter('exceeded')}
            className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1 ${
              statusFilter === 'exceeded'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span>🚨 Excedidas ({comparisonData.filter(r => r.status === 'exceeded').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('warning')}
            className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1 ${
              statusFilter === 'warning'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>⚠️ Al Límite ({comparisonData.filter(r => r.status === 'warning').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('ok')}
            className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1 ${
              statusFilter === 'ok'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span>✅ En Meta ({comparisonData.filter(r => r.status === 'ok').length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Mostrando <strong>{displayedRows.length}</strong> categorías
        </div>
      </div>

      {/* 5. Visual Comparison Bars & Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedRows.map((row) => {
          const isOver = row.status === 'exceeded';
          const isWarning = row.status === 'warning';
          const hasBudget = row.budget > 0;

          return (
            <div
              key={row.category}
              className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                isOver
                  ? 'bg-rose-50/30 border-rose-200 shadow-2xs'
                  : isWarning
                    ? 'bg-amber-50/30 border-amber-200 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Card Header: Category Name + Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: row.color }}
                  />
                  <h4 className="font-black text-sm text-slate-900 truncate" title={row.category}>
                    {row.category}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                    ({row.count} gastos)
                  </span>
                </div>

                {/* Status Badge */}
                {hasBudget ? (
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                      isOver
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : isWarning
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {isOver ? '🚨 Excedido' : isWarning ? '⚠️ Alerta' : '✅ En Meta'}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-md font-bold shrink-0">
                    Sin Límite
                  </span>
                )}
              </div>

              {/* Comparative Amounts Grid */}
              <div className="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Presupuesto</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700">
                    {hasBudget ? formatCurrency(row.budget, currency) : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Gasto Real</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    {formatCurrency(row.spent, currency)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {row.difference < 0 ? 'Desvío' : 'Disponible'}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-black ${
                      row.difference < 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {row.difference < 0 ? '+' : ''}{formatCurrency(Math.abs(row.difference), currency)}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              {hasBudget && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Ejecución del presupuesto</span>
                    <span
                      className={`font-black ${
                        isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {row.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(row.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Top Subcategory preview */}
              {row.topSub && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                  <span className="truncate">
                    Mayor consumo: <strong className="text-slate-700">{row.topSub[0]}</strong>
                  </span>
                  <span className="font-bold text-slate-700 shrink-0">
                    {formatCurrency(row.topSub[1], currency)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. Comprehensive Comparison Table */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Tabla de Desglose Comparativo</span>
          </h4>
          <span className="text-xs text-slate-400 font-medium">
            Clic en las cabeceras para ordenar
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Categoría</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('budget')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Presupuesto</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('spent')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Consumo Real</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('difference')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Diferencia</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('percentage')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>% Ejecución</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs font-medium">
                    No se encontraron categorías para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                displayedRows.map((row) => {
                  const isOver = row.status === 'exceeded';
                  const isWarning = row.status === 'warning';
                  const hasBudget = row.budget > 0;

                  return (
                    <tr key={row.category} className="hover:bg-slate-50/80 transition-colors">
                      {/* Category */}
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                          />
                          <span className="truncate">{row.category}</span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3 text-right font-semibold text-slate-600">
                        {hasBudget ? formatCurrency(row.budget, currency) : '-'}
                      </td>

                      {/* Spent */}
                      <td className="px-4 py-3 text-right font-black text-slate-900">
                        {formatCurrency(row.spent, currency)}
                      </td>

                      {/* Difference */}
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-black ${
                            row.difference < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {row.difference < 0 ? '+' : ''}{formatCurrency(Math.abs(row.difference), currency)}
                        </span>
                      </td>

                      {/* Percentage */}
                      <td className="px-4 py-3 text-center">
                        {hasBudget ? (
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`font-black text-xs ${
                                isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {row.percentage}%
                            </span>
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${
                                  isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(row.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {hasBudget ? (
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              isOver
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isWarning
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {isOver ? 'Excedido' : isWarning ? 'Alerta' : 'En Meta'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            Sin Límite
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
