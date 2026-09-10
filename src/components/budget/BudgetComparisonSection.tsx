import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ArrowUpDown, 
  Search, 
  X, 
  Filter, 
  ExternalLink, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Coins,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { Budgets, CategoryColors } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export interface SubcategoryComparisonDetail {
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'exceeded' | 'warning' | 'ok' | 'no_budget';
}

export interface CategoryComparisonItem {
  category: string;
  budget: number;
  spent: number;
  count: number;
  remaining: number;
  overspent: number;
  percentage: number;
  status: 'exceeded' | 'warning' | 'ok' | 'no_budget';
  color: string;
  dailyAllowance: number;
  hasSubcategoryBudgets?: boolean;
  subcategories?: SubcategoryComparisonDetail[];
}

interface BudgetComparisonSectionProps {
  categoryItems: CategoryComparisonItem[];
  currency: string;
  selectedMonthName: string;
  alertThreshold: number;
  onOpenEditCategory: (item: CategoryComparisonItem) => void;
  onSelectCategory?: (category: string) => void;
}

type SortField = 'difference' | 'spent' | 'budget' | 'percentage' | 'name';
type SortOrder = 'asc' | 'desc';

export const BudgetComparisonSection: React.FC<BudgetComparisonSectionProps> = ({
  categoryItems,
  currency,
  selectedMonthName,
  alertThreshold,
  onOpenEditCategory,
  onSelectCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'exceeded' | 'warning' | 'ok' | 'no_budget'>('all');
  const [sortField, setSortField] = useState<SortField>('spent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleExpand = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Filter and Sort
  const displayedItems = useMemo(() => {
    return categoryItems
      .filter(item => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          if (!item.category.toLowerCase().includes(term)) return false;
        }

        if (statusFilter === 'exceeded') return item.status === 'exceeded';
        if (statusFilter === 'warning') return item.status === 'warning';
        if (statusFilter === 'ok') return item.status === 'ok';
        if (statusFilter === 'no_budget') return item.status === 'no_budget';

        return true;
      })
      .sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        if (sortField === 'name') {
          return sortOrder === 'asc' 
            ? a.category.localeCompare(b.category) 
            : b.category.localeCompare(a.category);
        }

        if (sortField === 'spent') {
          valA = a.spent;
          valB = b.spent;
        } else if (sortField === 'budget') {
          valA = a.budget;
          valB = b.budget;
        } else if (sortField === 'percentage') {
          valA = a.percentage;
          valB = b.percentage;
        } else if (sortField === 'difference') {
          valA = a.budget - a.spent;
          valB = b.budget - b.spent;
        }

        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [categoryItems, searchTerm, statusFilter, sortField, sortOrder]);

  // Overall Totals
  const totals = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    let exceededCount = 0;
    let okCount = 0;

    categoryItems.forEach(item => {
      totalSpent += item.spent;
      if (item.budget > 0) {
        totalBudget += item.budget;
        if (item.status === 'exceeded') exceededCount++;
        else okCount++;
      }
    });

    const netDifference = totalBudget - totalSpent;
    const globalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
      totalBudget,
      totalSpent,
      netDifference,
      globalPct,
      exceededCount,
      okCount,
    };
  }, [categoryItems]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* SECTION HEADER & STATS */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#7928CA] flex items-center justify-center shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Tabla Comparativa: Presupuesto vs. Real
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Análisis consolidado de desvíos, ahorros y ejecución presupuestaria para <strong className="text-slate-800">{selectedMonthName}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3.5 py-1.5 rounded-2xl bg-purple-50 text-[#7928CA] border border-purple-200 text-xs font-bold flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              {totals.globalPct}% de ejecución mensual
            </span>
          </div>
        </div>

        {/* 3 KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
            <span className="text-xs text-purple-900 font-bold block">Total Presupuestado</span>
            <span className="text-2xl font-black text-slate-900 font-outfit">
              {formatCurrency(totals.totalBudget, currency)}
            </span>
            <span className="text-[11px] text-slate-500 block">Límite fijado en categorías</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
            <span className="text-xs text-indigo-900 font-bold block">Total Gastado Real</span>
            <span className="text-2xl font-black text-slate-900 font-outfit">
              {formatCurrency(totals.totalSpent, currency)}
            </span>
            <span className="text-[11px] text-slate-500 block">Movimientos del mes</span>
          </div>

          <div className={`p-4 rounded-2xl border space-y-1 ${
            totals.netDifference >= 0 
              ? 'bg-emerald-50/70 border-emerald-200' 
              : 'bg-rose-50/70 border-rose-200'
          }`}>
            <span className={`text-xs font-bold block ${
              totals.netDifference >= 0 ? 'text-emerald-900' : 'text-rose-900'
            }`}>
              {totals.netDifference >= 0 ? 'Superávit / Saldo a Favor' : 'Déficit / Sobregasto Total'}
            </span>
            <span className={`text-2xl font-black font-outfit ${
              totals.netDifference >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              {formatCurrency(Math.abs(totals.netDifference), currency)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {totals.netDifference >= 0 ? 'Monto no consumido' : 'Exceso sobre el total'}
            </span>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar categoría en tabla..."
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

          {/* Filter Status Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({categoryItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('exceeded')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'exceeded'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Excedidas ({categoryItems.filter(c => c.status === 'exceeded').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('warning')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'warning'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              En Alerta ({categoryItems.filter(c => c.status === 'warning').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ok')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'ok'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Bajo Control ({categoryItems.filter(c => c.status === 'ok').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('no_budget')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'no_budget'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sin Límite ({categoryItems.filter(c => c.status === 'no_budget').length})
            </button>
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Categoría</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('budget')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Presupuesto</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('spent')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Gasto Real</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('difference')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Diferencia / Desvío</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 select-none w-44" onClick={() => handleSort('percentage')}>
                  <div className="flex items-center justify-center gap-1.5">
                    <span>% Ejecutado</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                <th className="py-3.5 px-4 text-center">Estado Semáforo</th>

                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {displayedItems.length > 0 ? (
                displayedItems.map((item) => {
                  const diff = item.budget > 0 ? item.budget - item.spent : 0;
                  const isExceeded = item.status === 'exceeded';
                  const isWarning = item.status === 'warning';
                  const isNoBudget = item.status === 'no_budget';
                  const hasSubs = item.subcategories && item.subcategories.length > 0;
                  const isExpanded = !!expandedCategories[item.category];

                  return (
                    <React.Fragment key={item.category}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {hasSubs ? (
                              <button
                                type="button"
                                onClick={() => toggleExpand(item.category)}
                                className="p-0.5 text-slate-400 hover:text-[#7928CA] rounded transition-colors cursor-pointer"
                                title={isExpanded ? 'Ocultar subcategorías' : 'Ver desglose de subcategorías'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-[#7928CA]" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <div className="w-3.5" />
                            )}
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-800 text-xs">
                                {item.category}
                              </span>
                              {item.hasSubcategoryBudgets && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-50 text-[#7928CA] text-[9px] font-extrabold border border-purple-200 inline-flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Suma subcat
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="py-3.5 px-4 text-right font-bold text-slate-700 font-outfit">
                          {item.budget > 0 ? (
                            formatCurrency(item.budget, currency)
                          ) : (
                            <span className="text-slate-400 font-normal italic">Sin límite</span>
                          )}
                        </td>

                        {/* Spent */}
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 font-outfit">
                          {formatCurrency(item.spent, currency)}
                        </td>

                        {/* Difference */}
                        <td className="py-3.5 px-4 text-right font-bold font-outfit">
                          {item.budget > 0 ? (
                            diff >= 0 ? (
                              <span className="text-emerald-700 flex items-center justify-end gap-1">
                                <TrendingDown className="w-3 h-3 text-emerald-600" />
                                +{formatCurrency(diff, currency)}
                              </span>
                            ) : (
                              <span className="text-rose-600 flex items-center justify-end gap-1">
                                <TrendingUp className="w-3 h-3 text-rose-500" />
                                -{formatCurrency(Math.abs(diff), currency)}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Execution Progress bar */}
                        <td className="py-3.5 px-4">
                          {item.budget > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className={isExceeded ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-700'}>
                                  {item.percentage}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-center block text-[11px]">N/A</span>
                          )}
                        </td>

                        {/* Semaphore Pill */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isExceeded
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : isWarning
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : isNoBudget
                                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {isExceeded ? (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                Excedido
                              </>
                            ) : isWarning ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                Alerta ({alertThreshold}%)
                              </>
                            ) : isNoBudget ? (
                              'Sin límite'
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Bajo Control
                              </>
                            )}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectCategory && onSelectCategory(item.category)}
                              className="p-1.5 text-slate-400 hover:text-[#7928CA] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title={`Ver gastos de ${item.category}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEditCategory(item)}
                              className="p-1.5 text-slate-400 hover:text-[#7928CA] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar presupuesto y subcategorías"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Nested Subcategories Rows if expanded */}
                      {isExpanded && item.subcategories && item.subcategories.map(sub => {
                        const subDiff = sub.budget > 0 ? sub.budget - sub.spent : 0;
                        const subIsExceeded = sub.status === 'exceeded';
                        const subIsWarning = sub.status === 'warning';

                        return (
                          <tr key={`${item.category}-${sub.name}`} className="bg-purple-50/20 hover:bg-purple-50/50 transition-colors border-l-2 border-l-[#7928CA]">
                            <td className="py-2.5 px-4 pl-10">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                                <span className="text-slate-400 font-bold">↳</span>
                                <span className="truncate">{sub.name}</span>
                              </div>
                            </td>

                            <td className="py-2.5 px-4 text-right text-xs font-semibold text-slate-600 font-outfit">
                              {sub.budget > 0 ? (
                                formatCurrency(sub.budget, currency)
                              ) : (
                                <span className="text-slate-400 font-normal italic text-[11px]">Sin límite</span>
                              )}
                            </td>

                            <td className="py-2.5 px-4 text-right text-xs font-extrabold text-slate-800 font-outfit">
                              {formatCurrency(sub.spent, currency)}
                            </td>

                            <td className="py-2.5 px-4 text-right text-xs font-bold font-outfit">
                              {sub.budget > 0 ? (
                                subDiff >= 0 ? (
                                  <span className="text-emerald-700">+{formatCurrency(subDiff, currency)}</span>
                                ) : (
                                  <span className="text-rose-600">-{formatCurrency(Math.abs(subDiff), currency)}</span>
                                )
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="py-2.5 px-4">
                              {sub.budget > 0 ? (
                                <div className="space-y-0.5">
                                  <span className={`text-[10px] font-bold ${subIsExceeded ? 'text-rose-600' : subIsWarning ? 'text-amber-600' : 'text-emerald-700'}`}>
                                    {sub.percentage}%
                                  </span>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        subIsExceeded ? 'bg-rose-500' : subIsWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(100, sub.percentage)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-center block text-[10px]">N/A</span>
                              )}
                            </td>

                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                subIsExceeded 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                  : subIsWarning 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                    : sub.budget > 0 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                                {subIsExceeded ? 'Excedido' : subIsWarning ? 'Alerta' : sub.budget > 0 ? 'OK' : 'Sin límite'}
                              </span>
                            </td>

                            <td className="py-2.5 px-4 text-right">
                              <span className="text-[10px] text-slate-400">Subcategoría</span>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No se encontraron categorías para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Footer Summary Row */}
            <tfoot>
              <tr className="bg-slate-100/90 font-extrabold text-slate-900 border-t border-slate-200">
                <td className="py-3.5 px-4">TOTAL GENERAL</td>
                <td className="py-3.5 px-4 text-right font-outfit">
                  {formatCurrency(totals.totalBudget, currency)}
                </td>
                <td className="py-3.5 px-4 text-right font-outfit">
                  {formatCurrency(totals.totalSpent, currency)}
                </td>
                <td className="py-3.5 px-4 text-right font-outfit">
                  {totals.netDifference >= 0 ? (
                    <span className="text-emerald-700">+{formatCurrency(totals.netDifference, currency)}</span>
                  ) : (
                    <span className="text-rose-600">-{formatCurrency(Math.abs(totals.netDifference), currency)}</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center font-outfit text-purple-900">
                  {totals.globalPct}% global
                </td>
                <td className="py-3.5 px-4 text-center" colSpan={2}>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {totals.exceededCount} {totals.exceededCount === 1 ? 'categoría superada' : 'categorías superadas'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
