import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Pencil,
  ArrowRight
} from 'lucide-react';
import { Budgets, Transaction } from '../types';

export interface CategoryCriticalItem {
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  overspent: number;
  percentage: number;
  status: 'exceeded' | 'warning' | 'ok';
  subcategories?: SubcategoryCriticalItem[];
  color?: string;
  emoji?: string;
}

export interface SubcategoryCriticalItem {
  name: string;
  parentCategory: string;
  budget: number;
  spent: number;
  remaining: number;
  overspent: number;
  percentage: number;
  status: 'exceeded' | 'warning' | 'ok';
}

interface BudgetCriticalAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets?: Budgets;
  monthExpensesList?: Transaction[];
  categoryColors?: Record<string, string>;
  categoryMap?: Record<string, string[]>;
  isBalanceHidden?: boolean;
  onOpenBudgetModal?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const BudgetCriticalAlertsModal: React.FC<BudgetCriticalAlertsModalProps> = ({
  isOpen,
  onClose,
  budgets,
  monthExpensesList = [],
  categoryColors = {},
  categoryMap = {},
  isBalanceHidden = false,
  onOpenBudgetModal,
  onNavigateTab,
}) => {
  const [viewFilter, setViewFilter] = useState<'critical' | 'all' | 'subcategories'>('critical');

  const alertThreshold = budgets?.alertThresholdPercent || 80;

  const ars = (n: number) =>
    "$ " + Math.round(Math.abs(n)).toLocaleString("es-AR", { maximumFractionDigits: 0 });

  const getEmoji = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('aliment') || c.includes('super')) return '🛒';
    if (c.includes('alquiler') || c.includes('vivien')) return '🏠';
    if (c.includes('expen')) return '🏢';
    if (c.includes('transp') || c.includes('auto') || c.includes('sube')) return '🚗';
    if (c.includes('salud') || c.includes('farma') || c.includes('prepag')) return '💊';
    if (c.includes('servici') || c.includes('luz') || c.includes('gas') || c.includes('agua')) return '⚡';
    if (c.includes('educac') || c.includes('colegio')) return '📚';
    if (c.includes('ocio') || c.includes('entreten') || c.includes('salida')) return '🍿';
    if (c.includes('suscrip')) return '📺';
    if (c.includes('indument') || c.includes('ropa') || c.includes('calzad')) return '👕';
    if (c.includes('mascot')) return '🐾';
    if (c.includes('gastro') || c.includes('cafe')) return '☕';
    return '📊';
  };

  // Process Category and Subcategory spending vs user defined parameters
  const { categoryItems, subcategoryItems, criticalCategories, criticalSubcategories } = useMemo(() => {
    // 1. Group expenses by category and subcategory
    const catSpent: Record<string, number> = {};
    const subSpent: Record<string, { total: number; parentCat: string }> = {};

    monthExpensesList.forEach(t => {
      if (!t || t.tipoTransaccion === 'ingreso') return;
      const cat = t.categoria || 'Otros';
      catSpent[cat] = (catSpent[cat] || 0) + (t.monto || 0);

      if (t.subcategoria) {
        if (!subSpent[t.subcategoria]) {
          subSpent[t.subcategoria] = { total: 0, parentCat: cat };
        }
        subSpent[t.subcategoria].total += (t.monto || 0);
      }
    });

    const userBudgetCats = budgets?.categories || {};
    const userBudgetSubs = budgets?.subcategories || {};

    // 2. Combine all categories with budgets or expenses
    const allCatKeys = Array.from(
      new Set([
        ...Object.keys(userBudgetCats),
        ...Object.keys(catSpent),
        ...Object.keys(categoryMap || {})
      ])
    );

    const catList: CategoryCriticalItem[] = [];

    allCatKeys.forEach(cat => {
      const budget = userBudgetCats[cat] || 0;
      const spent = catSpent[cat] || 0;

      // Only evaluate if there is a budget or spent amount
      if (budget === 0 && spent === 0) return;

      const pct = budget > 0 ? Math.round((spent / budget) * 100) : (spent > 0 ? 100 : 0);
      const remaining = Math.max(0, budget - spent);
      const overspent = Math.max(0, spent - budget);

      let status: 'exceeded' | 'warning' | 'ok' = 'ok';
      if (budget > 0) {
        if (pct >= 100) status = 'exceeded';
        else if (pct >= alertThreshold) status = 'warning';
        else status = 'ok';
      } else if (spent > 0) {
        status = 'warning';
      }

      catList.push({
        name: cat,
        budget,
        spent,
        remaining,
        overspent,
        percentage: pct,
        status,
        color: categoryColors[cat] || '#7928CA',
        emoji: getEmoji(cat)
      });
    });

    // Sort categories: exceeded first, then warning, then highest percentage
    catList.sort((a, b) => {
      if (a.status === 'exceeded' && b.status !== 'exceeded') return -1;
      if (b.status === 'exceeded' && a.status !== 'exceeded') return 1;
      if (a.status === 'warning' && b.status === 'ok') return -1;
      if (b.status === 'warning' && a.status === 'ok') return 1;
      return b.percentage - a.percentage;
    });

    // 3. Process Subcategories
    const allSubKeys = Array.from(
      new Set([
        ...Object.keys(userBudgetSubs),
        ...Object.keys(subSpent)
      ])
    );

    const subList: SubcategoryCriticalItem[] = [];

    allSubKeys.forEach(sub => {
      const budget = userBudgetSubs[sub] || 0;
      const spentInfo = subSpent[sub];
      const spent = spentInfo ? spentInfo.total : 0;
      const parentCat = spentInfo ? spentInfo.parentCat : 'General';

      if (budget === 0 && spent === 0) return;

      const pct = budget > 0 ? Math.round((spent / budget) * 100) : (spent > 0 ? 100 : 0);
      const remaining = Math.max(0, budget - spent);
      const overspent = Math.max(0, spent - budget);

      let status: 'exceeded' | 'warning' | 'ok' = 'ok';
      if (budget > 0) {
        if (pct >= 100) status = 'exceeded';
        else if (pct >= alertThreshold) status = 'warning';
        else status = 'ok';
      }

      subList.push({
        name: sub,
        parentCategory: parentCat,
        budget,
        spent,
        remaining,
        overspent,
        percentage: pct,
        status
      });
    });

    subList.sort((a, b) => b.percentage - a.percentage);

    const critCats = catList.filter(c => c.status === 'exceeded' || c.status === 'warning');
    const critSubs = subList.filter(s => s.status === 'exceeded' || s.status === 'warning');

    return {
      categoryItems: catList,
      subcategoryItems: subList,
      criticalCategories: critCats,
      criticalSubcategories: critSubs
    };
  }, [monthExpensesList, budgets, categoryColors, categoryMap, alertThreshold]);

  const displayedCategories = viewFilter === 'all' ? categoryItems : criticalCategories;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#181332] rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/50 overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-3 bg-gradient-to-r from-rose-50/70 via-white to-amber-50/50 dark:from-rose-950/30 dark:via-[#181332] dark:to-amber-950/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-[#F95420] text-white flex items-center justify-center text-lg shadow-sm font-bold shrink-0">
                  ⚠️
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight truncate">
                      Alertas de Límites de Presupuesto
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] shrink-0">
                      Umbral: {alertThreshold}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Rubros en estado crítico según los parámetros configurados
                  </p>
                </div>
              </div>

              {/* Close (Cruz) */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer shrink-0"
                title="Cerrar"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Threshold & Parameters Banner */}
            <div className="px-4 sm:px-5 py-3 bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-[11px] font-bold text-purple-200/90 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-300" />
                    Parámetros definidos por el usuario
                  </span>
                  <p className="text-xs text-purple-100/90 font-medium mt-0.5">
                    Alerta preventiva activada al <span className="font-black text-amber-300">{alertThreshold}%</span> del límite.
                  </p>
                </div>

                {onOpenBudgetModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBudgetModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Modificar límites</span>
                  </button>
                )}
              </div>

              {/* Quick counts summary */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center text-xs">
                <div className="bg-white/10 rounded-xl p-1.5">
                  <p className="text-[10px] text-purple-200/80">Límite superado (≥100%)</p>
                  <p className="font-black text-rose-300 text-sm">
                    {categoryItems.filter(c => c.status === 'exceeded').length}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-1.5">
                  <p className="text-[10px] text-purple-200/80">En advertencia (≥{alertThreshold}%)</p>
                  <p className="font-black text-amber-300 text-sm">
                    {categoryItems.filter(c => c.status === 'warning').length}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-1.5">
                  <p className="text-[10px] text-purple-200/80">Bajo control (&lt;{alertThreshold}%)</p>
                  <p className="font-black text-emerald-300 text-sm">
                    {categoryItems.filter(c => c.status === 'ok').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Toggle Pills */}
            <div className="p-3 sm:px-5 border-b border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center bg-slate-100 dark:bg-purple-950/60 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewFilter('critical')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewFilter === 'critical'
                      ? 'bg-white dark:bg-[#2A184A] text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Críticas</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px]">
                    {criticalCategories.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewFilter('subcategories')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewFilter === 'subcategories'
                      ? 'bg-white dark:bg-[#2A184A] text-[#7928CA] dark:text-purple-300 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Subcategorías</span>
                  {criticalSubcategories.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px]">
                      {criticalSubcategories.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setViewFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewFilter === 'all'
                      ? 'bg-white dark:bg-[#2A184A] text-[#7928CA] dark:text-purple-300 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todas ({categoryItems.length})
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {viewFilter === 'subcategories'
                  ? `${subcategoryItems.length} subcategorías evaluadas`
                  : `${displayedCategories.length} rubros evaluados`}
              </span>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 divide-y divide-slate-100 dark:divide-purple-900/20 max-h-[390px]">
              {viewFilter === 'subcategories' ? (
                // SUBCATEGORIES VIEW
                subcategoryItems.length > 0 ? (
                  subcategoryItems.map(sub => {
                    const isExceeded = sub.status === 'exceeded';
                    const isWarning = sub.status === 'warning';

                    return (
                      <div
                        key={sub.name}
                        className="py-3 flex flex-col gap-2 hover:bg-slate-50/80 dark:hover:bg-purple-950/20 rounded-2xl px-2.5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                                {sub.name}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                isExceeded
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : isWarning
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              }`}>
                                {isExceeded ? 'Excedida' : isWarning ? 'Alerta' : 'Bajo control'}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                              Categoría: {sub.parentCategory}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tabular-nums">
                              {isBalanceHidden ? '$ •••••' : ars(sub.spent)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              de {isBalanceHidden ? '$ •••••' : ars(sub.budget)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="h-1 rounded-full bg-slate-100 dark:bg-purple-950/50 overflow-hidden w-full">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, sub.percentage)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-bold">
                              {sub.percentage}% consumido
                            </span>
                            <span>
                              {sub.overspent > 0
                                ? `Exceso: ${isBalanceHidden ? '$ •••••' : ars(sub.overspent)}`
                                : `Disponible: ${isBalanceHidden ? '$ •••••' : ars(sub.remaining)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      No hay subcategorías en estado crítico
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tus consumos por subcategoría están dentro del límite fijado.
                    </p>
                  </div>
                )
              ) : (
                // CATEGORIES VIEW (CRITICAL OR ALL)
                displayedCategories.length > 0 ? (
                  displayedCategories.map(item => {
                    const isExceeded = item.status === 'exceeded';
                    const isWarning = item.status === 'warning';

                    return (
                      <div
                        key={item.name}
                        className="py-3 flex flex-col gap-2 hover:bg-slate-50/80 dark:hover:bg-purple-950/20 rounded-2xl px-2.5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                              isExceeded
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                                : isWarning
                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}>
                              {item.emoji}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                                  {item.name}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                  isExceeded
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                    : isWarning
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                }`}>
                                  {isExceeded
                                    ? 'Superó el 100%'
                                    : isWarning
                                    ? `Alerta ≥${alertThreshold}%`
                                    : 'Dentro del margen'}
                                </span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                                {isExceeded
                                  ? `Excedido por ${isBalanceHidden ? '$ •••••' : ars(item.overspent)}`
                                  : `Restante: ${isBalanceHidden ? '$ •••••' : ars(item.remaining)}`}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-xs sm:text-sm font-black tabular-nums block ${
                              isExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                            }`}>
                              {isBalanceHidden ? '$ •••••' : ars(item.spent)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              de {isBalanceHidden ? '$ •••••' : ars(item.budget)}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="h-1 rounded-full bg-slate-100 dark:bg-purple-950/50 overflow-hidden w-full">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                            <span className={isExceeded ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                              {item.percentage}% del presupuesto fijado
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">
                              {item.budget > 0 ? `Tope: ${ars(item.budget)}` : 'Sin límite configurado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      ¡Excelente! Ninguna categoría está en estado crítico
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Todos tus gastos de este período se mantienen por debajo del umbral de alerta definido ({alertThreshold}%).
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setViewFilter('all')}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#7928CA] dark:text-purple-300 font-bold text-xs hover:underline cursor-pointer"
                      >
                        Ver todas las categorías →
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-slate-50/80 dark:bg-purple-950/40 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-2">
              {onOpenBudgetModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBudgetModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-900 text-[#7928CA] dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configurar presupuestos</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('budgets');
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#7928CA] hover:bg-[#6821ad] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                  >
                    <span>Ir a Presupuestos</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-purple-950 dark:hover:bg-purple-900 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BudgetCriticalAlertsModal;
