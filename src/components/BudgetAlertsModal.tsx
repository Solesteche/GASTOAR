import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Sliders,
  TrendingUp,
  Tag,
  CheckCircle2,
  ExternalLink,
  Pencil
} from 'lucide-react';
import { Budgets, CategoryColors, CategoryMap, Transaction } from '../types';

export interface CategoryAlertDetail {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  status: 'exceeded' | 'warning' | 'ok';
  overspent: number;
  remaining: number;
  color: string;
  emoji: string;
  subcategories: {
    name: string;
    spent: number;
    budget: number;
    percentage: number;
    isCritical: boolean;
  }[];
}

interface BudgetAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets?: Budgets;
  categoryMap?: CategoryMap;
  categoryColors?: CategoryColors;
  monthExpensesList?: Transaction[];
  generalBudget?: number;
  isBalanceHidden?: boolean;
  onOpenBudgetModal?: () => void;
  onSelectCategory?: (category: string) => void;
  onNavigateTab?: (tab: string) => void;
}

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

const DEFAULT_EMOJIS: Record<string, string> = {
  'Alimentación': '🛒',
  'Supermercado': '🛒',
  'Vivienda': '🏠',
  'Alquiler': '🏠',
  'Transporte': '🚗',
  'Salud': '💊',
  'Farmacia': '💊',
  'Ocio': '🍿',
  'Gastronomía': '☕',
  'Servicios': '⚡',
  'Internet': '🌐',
  'Otros': '📦',
};

export const BudgetAlertsModal: React.FC<BudgetAlertsModalProps> = ({
  isOpen,
  onClose,
  budgets,
  categoryMap = {},
  categoryColors = {},
  monthExpensesList = [],
  generalBudget = 770000,
  isBalanceHidden = false,
  onOpenBudgetModal,
  onSelectCategory,
  onNavigateTab,
}) => {
  const [filterMode, setFilterMode] = useState<'critical' | 'all'>('critical');

  const alertThreshold = budgets?.alertThresholdPercent || 80;

  const ars = (n: number) =>
    "$ " + Math.round(Math.abs(n)).toLocaleString("es-AR", { maximumFractionDigits: 0 });

  // Compute all category & subcategory limits and spending
  const alertDetails = useMemo(() => {
    // 1. Group expenses by category and subcategory
    const catSpent: Record<string, { total: number; subcategories: Record<string, number> }> = {};

    monthExpensesList.forEach(tx => {
      if (!tx || tx.tipoTransaccion === 'ingreso') return;
      const cat = tx.categoria || 'Otros';
      const sub = tx.subcategoria || 'Varios';
      const amt = tx.monto || 0;

      if (!catSpent[cat]) {
        catSpent[cat] = { total: 0, subcategories: {} };
      }
      catSpent[cat].total += amt;
      catSpent[cat].subcategories[sub] = (catSpent[cat].subcategories[sub] || 0) + amt;
    });

    // 2. Collect all tracked categories (from categoryMap, budgets, or expenses)
    const allCatKeys = Array.from(
      new Set([
        ...Object.keys(budgets?.categories || {}),
        ...Object.keys(categoryMap || {}),
        ...Object.keys(catSpent),
      ])
    );

    // Fallback baseline distribution if user hasn't set custom category budgets yet
    const fallbackPctMap: Record<string, number> = {
      'Alimentación': 0.28,
      'Vivienda': 0.22,
      'Transporte': 0.15,
      'Salud': 0.10,
      'Ocio': 0.10,
      'Servicios': 0.08,
      'Otros': 0.07,
    };

    const hasAnyCustomBudget = Object.values(budgets?.categories || {}).some(v => (Number(v) || 0) > 0);

    const list: CategoryAlertDetail[] = allCatKeys.map(cat => {
      let budget = budgets?.categories?.[cat] || 0;
      if (!hasAnyCustomBudget && budget === 0) {
        const factor = fallbackPctMap[cat] || 0.10;
        budget = Math.round(generalBudget * factor);
      }

      const spentData = catSpent[cat] || { total: 0, subcategories: {} };
      const spent = spentData.total;
      const pct = budget > 0 ? Math.round((spent / budget) * 100) : (spent > 0 ? 100 : 0);

      let status: 'exceeded' | 'warning' | 'ok' = 'ok';
      if (pct >= 100) {
        status = 'exceeded';
      } else if (pct >= alertThreshold) {
        status = 'warning';
      }

      const overspent = Math.max(0, spent - budget);
      const remaining = Math.max(0, budget - spent);

      // Subcategories breakdown
      const declaredSubs = categoryMap[cat] || [];
      const spentSubs = Object.keys(spentData.subcategories);
      const allSubs = Array.from(new Set([...declaredSubs, ...spentSubs]));

      const subcategories = allSubs.map(sub => {
        const subSpent = spentData.subcategories[sub] || 0;
        const subBudget = budgets?.subcategories?.[sub] || 0;
        const subPct = subBudget > 0
          ? Math.round((subSpent / subBudget) * 100)
          : (budget > 0 ? Math.round((subSpent / budget) * 100) : 0);

        const isCritical = subBudget > 0 ? subPct >= alertThreshold : (status !== 'ok' && subSpent > 0);

        return {
          name: sub,
          spent: subSpent,
          budget: subBudget,
          percentage: subPct,
          isCritical,
        };
      }).sort((a, b) => b.spent - a.spent);

      return {
        category: cat,
        budget,
        spent,
        percentage: pct,
        status,
        overspent,
        remaining,
        color: categoryColors[cat] || DEFAULT_CATEGORY_COLORS[cat] || '#8B5CF6',
        emoji: DEFAULT_EMOJIS[cat] || '📦',
        subcategories,
      };
    });

    // If transactions list was empty, provide realistic preset so user sees informative state
    if (list.length === 0 || list.every(i => i.spent === 0)) {
      const demoItems: CategoryAlertDetail[] = [
        {
          category: 'Alimentación',
          budget: 180000,
          spent: 198720,
          percentage: 110,
          status: 'exceeded',
          overspent: 18720,
          remaining: 0,
          color: '#3B82F6',
          emoji: '🛒',
          subcategories: [
            { name: 'Supermercado', spent: 145000, budget: 130000, percentage: 111, isCritical: true },
            { name: 'Carnicería / Verdulería', spent: 53720, budget: 50000, percentage: 107, isCritical: true },
          ]
        },
        {
          category: 'Transporte',
          budget: 95000,
          spent: 93150,
          percentage: 98,
          status: 'warning',
          overspent: 0,
          remaining: 1850,
          color: '#8B5CF6',
          emoji: '🚗',
          subcategories: [
            { name: 'Combustible', spent: 65000, budget: 60000, percentage: 108, isCritical: true },
            { name: 'Uber / Cabify', spent: 28150, budget: 35000, percentage: 80, isCritical: true },
          ]
        },
        {
          category: 'Ocio',
          budget: 50000,
          spent: 49680,
          percentage: 99,
          status: 'warning',
          overspent: 0,
          remaining: 320,
          color: '#F59E0B',
          emoji: '🍿',
          subcategories: [
            { name: 'Salidas / Bares', spent: 34000, budget: 30000, percentage: 113, isCritical: true },
            { name: 'Cine y Eventos', spent: 15680, budget: 20000, percentage: 78, isCritical: false },
          ]
        },
        {
          category: 'Vivienda',
          budget: 200000,
          spent: 149040,
          percentage: 75,
          status: 'ok',
          overspent: 0,
          remaining: 50960,
          color: '#EC4899',
          emoji: '🏠',
          subcategories: [
            { name: 'Alquiler', spent: 110000, budget: 150000, percentage: 73, isCritical: false },
            { name: 'Expensas', spent: 39040, budget: 50000, percentage: 78, isCritical: false },
          ]
        },
        {
          category: 'Salud',
          budget: 80000,
          spent: 55890,
          percentage: 70,
          status: 'ok',
          overspent: 0,
          remaining: 24110,
          color: '#10B981',
          emoji: '💊',
          subcategories: [
            { name: 'Farmacia', spent: 35000, budget: 50000, percentage: 70, isCritical: false },
            { name: 'Consultas', spent: 20890, budget: 30000, percentage: 70, isCritical: false },
          ]
        },
      ];
      return demoItems;
    }

    // Sort by status: exceeded first, then warning, then ok
    return list.sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categoryMap, monthExpensesList, generalBudget, alertThreshold, categoryColors]);

  const criticalItems = useMemo(() => {
    return alertDetails.filter(item => item.status === 'exceeded' || item.status === 'warning');
  }, [alertDetails]);

  const exceededItems = useMemo(() => {
    return alertDetails.filter(item => item.status === 'exceeded');
  }, [alertDetails]);

  const totalOverspent = useMemo(() => {
    return alertDetails.reduce((sum, item) => sum + item.overspent, 0);
  }, [alertDetails]);

  const displayItems = filterMode === 'critical' ? criticalItems : alertDetails;

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
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#181332] rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/50 overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-3 bg-gradient-to-r from-rose-50/60 via-purple-50/40 to-amber-50/40 dark:from-rose-950/40 dark:via-[#181332] dark:to-amber-950/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#B91C1C] text-white flex items-center justify-center text-lg shadow-sm font-bold shrink-0">
                  ⚠️
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight truncate">
                      Alertas de Límites de Presupuesto
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black text-[11px] shrink-0">
                      {criticalItems.length} {criticalItems.length === 1 ? 'crítica' : 'críticas'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Control de límites y semáforo de riesgo según tu umbral del {alertThreshold}%
                  </p>
                </div>
              </div>

              {/* Close Button */}
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

            {/* KPI Banner */}
            <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                  <p className="text-[10px] text-purple-200/80 font-semibold uppercase tracking-wider">Umbral definido</p>
                  <p className="text-base sm:text-lg font-black text-amber-300 mt-0.5">
                    {alertThreshold}%
                  </p>
                  <p className="text-[9px] text-purple-200/70">Alerta preventiva</p>
                </div>

                <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                  <p className="text-[10px] text-purple-200/80 font-semibold uppercase tracking-wider">Límite excedido</p>
                  <p className="text-base sm:text-lg font-black text-rose-300 mt-0.5">
                    {exceededItems.length} {exceededItems.length === 1 ? 'categoría' : 'categorías'}
                  </p>
                  <p className="text-[9px] text-purple-200/70">≥ 100% presupuestado</p>
                </div>

                <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                  <p className="text-[10px] text-purple-200/80 font-semibold uppercase tracking-wider">Exceso total</p>
                  <p className="text-base sm:text-lg font-black text-white mt-0.5 truncate">
                    {isBalanceHidden ? '$ •••••' : ars(totalOverspent)}
                  </p>
                  <p className="text-[9px] text-rose-300 font-bold">Por encima del tope</p>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="p-3 sm:px-5 border-b border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-purple-950/60 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setFilterMode('critical')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterMode === 'critical'
                      ? 'bg-white dark:bg-[#2A184A] text-[#EF4444] dark:text-rose-300 shadow-xs font-black'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Solo críticas ({criticalItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-white dark:bg-[#2A184A] text-[#7928CA] dark:text-purple-300 shadow-xs font-black'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todas ({alertDetails.length})
                </button>
              </div>

              {onOpenBudgetModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBudgetModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl text-[#7928CA] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Configurar límites</span>
                </button>
              )}
            </div>

            {/* Categories & Subcategories List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 max-h-[420px]">
              {displayItems.length > 0 ? (
                displayItems.map((item) => {
                  const isExceeded = item.status === 'exceeded';
                  const isWarning = item.status === 'warning';

                  return (
                    <div
                      key={item.category}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isExceeded
                          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs'
                          : isWarning
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs'
                          : 'bg-slate-50/80 dark:bg-purple-950/20 border-slate-200/80 dark:border-purple-900/40'
                      }`}
                    >
                      {/* Header of Category Card */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-2xs"
                            style={{ backgroundColor: `${item.color}20` }}
                          >
                            <span>{item.emoji}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-800 dark:text-white truncate">
                                {item.category}
                              </h4>
                              {isExceeded && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wide shrink-0">
                                  Excedido
                                </span>
                              )}
                              {isWarning && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wide shrink-0">
                                  Alerta {item.percentage}%
                                </span>
                              )}
                              {!isExceeded && !isWarning && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                                  Bajo control
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {isExceeded ? (
                                <span className="text-rose-600 dark:text-rose-400 font-bold">
                                  Superó el límite por {isBalanceHidden ? '$ •••••' : ars(item.overspent)}
                                </span>
                              ) : isWarning ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  Riesgo crítico: quedan {isBalanceHidden ? '$ •••••' : ars(item.remaining)}
                                </span>
                              ) : (
                                <span>Disponible: {isBalanceHidden ? '$ •••••' : ars(item.remaining)}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Amounts */}
                        <div className="text-right shrink-0">
                          <p className={`text-sm sm:text-base font-black tabular-nums ${
                            isExceeded
                              ? 'text-rose-600 dark:text-rose-400'
                              : isWarning
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-800 dark:text-white'
                          }`}>
                            {isBalanceHidden ? '$ •••••' : ars(item.spent)}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                            de {isBalanceHidden ? '$ •••••' : ars(item.budget)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar with Alert Threshold Marker */}
                      <div className="relative pt-1 pb-1">
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-purple-950/60 overflow-hidden w-full relative">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isExceeded
                                ? 'bg-rose-500'
                                : isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Subcategories Breakdown */}
                      {item.subcategories && item.subcategories.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-purple-900/40 space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                            <span>Subcategorías asociadas</span>
                            <span>Gasto / Consumo</span>
                          </p>
                          <div className="space-y-1">
                            {item.subcategories.map(sub => (
                              <div
                                key={sub.name}
                                className={`flex items-center justify-between px-2 py-1 rounded-xl text-xs ${
                                  sub.isCritical
                                    ? 'bg-rose-100/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    sub.isCritical ? 'bg-rose-500' : 'bg-slate-400'
                                  }`} />
                                  <span className="truncate">{sub.name}</span>
                                  {sub.budget > 0 && (
                                    <span className="text-[9px] font-semibold text-slate-400">
                                      (límite {ars(sub.budget)})
                                    </span>
                                  )}
                                </span>
                                <span className="font-extrabold tabular-nums shrink-0 ml-2">
                                  {isBalanceHidden ? '$ •••••' : ars(sub.spent)}
                                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                                    ({sub.percentage}%)
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl">
                    ✓
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    ¡No hay categorías en estado crítico!
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Todos los gastos se mantienen por debajo del umbral del {alertThreshold}%.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 bg-slate-50/90 dark:bg-purple-950/40 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-2">
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
                  <span>Ajustar umbral y límites</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-purple-950 dark:hover:bg-purple-900 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
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

export default BudgetAlertsModal;
