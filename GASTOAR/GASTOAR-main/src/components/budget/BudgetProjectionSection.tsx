import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Calculator, 
  ArrowRight, 
  Check, 
  RotateCcw, 
  Info, 
  Coins, 
  Calendar,
  Layers,
  Percent,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Budgets, CategoryMap, CategoryColors, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BudgetProjectionSectionProps {
  budgets: Budgets;
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  transactions: Transaction[];
  currency: string;
  onUpdateBudgets?: (newBudgets: Budgets) => void;
}

export const BudgetProjectionSection: React.FC<BudgetProjectionSectionProps> = ({
  budgets,
  categoryMap,
  categoryColors,
  transactions,
  currency,
  onUpdateBudgets,
}) => {
  // A) Sobre limites actuales vs B) Sobre gastos reales registrados
  const [sourceMode, setSourceMode] = useState<'current_budget' | 'real_expenses'>('current_budget');

  // C) Porcentaje de inflación
  const [inflationPercent, setInflationPercent] = useState<number>(
    budgets?.projectionGrowthPercent || 5
  );
  const [compoundMonthly, setCompoundMonthly] = useState<boolean>(true);
  const [roundToThousands, setRoundToThousands] = useState<boolean>(true);

  // Notice state after applying
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [previousBackup, setPreviousBackup] = useState<Budgets | null>(null);

  // 1. Calculate Real Average Monthly Expenses per Category
  const realExpensesData = useMemo(() => {
    const expensesMap: Record<string, { total: number; months: Set<string> }> = {};

    (transactions || []).forEach(tx => {
      if (!tx || !tx.fecha || tx.tipoTransaccion === 'ingreso') return;
      const cat = tx.categoria || 'Otros';
      const monthKey = tx.fecha.substring(0, 7); // YYYY-MM

      if (!expensesMap[cat]) {
        expensesMap[cat] = { total: 0, months: new Set() };
      }
      expensesMap[cat].total += (tx.monto || 0);
      expensesMap[cat].months.add(monthKey);
    });

    const result: Record<string, number> = {};
    Object.entries(expensesMap).forEach(([cat, data]) => {
      const monthCount = Math.max(1, data.months.size);
      result[cat] = Math.round(data.total / monthCount);
    });

    return result;
  }, [transactions]);

  // 2. All Categories List
  const allCategories = useMemo(() => {
    const set = new Set<string>([
      ...Object.keys(categoryMap || {}),
      ...Object.keys(budgets?.categories || {}),
      ...Object.keys(realExpensesData),
    ]);
    return Array.from(set).sort();
  }, [categoryMap, budgets, realExpensesData]);

  // 3. Base Amount per category depending on A or B
  const baseCategoryAmounts = useMemo(() => {
    const result: Record<string, number> = {};
    allCategories.forEach(cat => {
      if (sourceMode === 'current_budget') {
        const subs = categoryMap[cat] || [];
        const subSum = subs.reduce((sum, s) => sum + (budgets?.subcategories?.[s] || 0), 0);
        result[cat] = subSum > 0 ? subSum : (budgets?.categories?.[cat] || 0);
      } else {
        result[cat] = realExpensesData[cat] || 0;
      }
    });
    return result;
  }, [allCategories, sourceMode, budgets, realExpensesData, categoryMap]);

  // 4. Calculate month names for next 3 months
  const nextMonths = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const name = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      months.push({
        index: i,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        rate: compoundMonthly 
          ? Math.pow(1 + inflationPercent / 100, i) - 1
          : (inflationPercent / 100) * i,
      });
    }
    return months;
  }, [inflationPercent, compoundMonthly]);

  // 5. Projected amounts for each category across 3 months
  const projectedTable = useMemo(() => {
    return allCategories.map(cat => {
      const base = baseCategoryAmounts[cat] || 0;
      const projections = nextMonths.map(m => {
        let proj = base * (1 + m.rate);
        if (roundToThousands && proj > 0) {
          proj = Math.ceil(proj / 1000) * 1000;
        } else {
          proj = Math.round(proj);
        }
        return {
          monthIndex: m.index,
          projected: proj,
          difference: proj - base,
        };
      });

      return {
        category: cat,
        color: categoryColors[cat] || '#7928CA',
        base,
        month1: projections[0],
        month2: projections[1],
        month3: projections[2],
      };
    });
  }, [allCategories, baseCategoryAmounts, nextMonths, roundToThousands, categoryColors]);

  // 6. Global Totals
  const totals = useMemo(() => {
    const baseTotal: number = (Object.values(baseCategoryAmounts) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
    const m1Total: number = projectedTable.reduce((a, item) => a + item.month1.projected, 0);
    const m2Total: number = projectedTable.reduce((a, item) => a + item.month2.projected, 0);
    const m3Total: number = projectedTable.reduce((a, item) => a + item.month3.projected, 0);

    return {
      baseTotal,
      m1Total,
      m2Total,
      m3Total,
      diffM1: m1Total - baseTotal,
      pctM1: baseTotal > 0 ? Math.round(((m1Total - baseTotal) / baseTotal) * 100) : inflationPercent,
      diffM3: m3Total - baseTotal,
      pctM3: baseTotal > 0 ? Math.round(((m3Total - baseTotal) / baseTotal) * 100) : 0,
    };
  }, [baseCategoryAmounts, projectedTable, inflationPercent]);

  // Preset inflation buttons
  const presetRates = [3, 4.5, 5, 8, 10, 15];

  // Apply to actual budgets handler
  const handleApplyProjections = () => {
    if (!onUpdateBudgets) return;

    // Backup current budgets for undo
    setPreviousBackup({ ...budgets });

    const newCategories: Record<string, number> = { ...(budgets.categories || {}) };
    projectedTable.forEach(item => {
      // If month 1 projected is greater than 0, apply it
      if (item.month1.projected > 0) {
        newCategories[item.category] = item.month1.projected;
      }
    });

    const updated: Budgets = {
      ...budgets,
      categories: newCategories,
      projectionGrowthPercent: inflationPercent,
      lastProjectedDate: new Date().toISOString(),
    };

    onUpdateBudgets(updated);
    setAppliedNotice(
      `¡Se aplicaron los presupuestos proyectados (+${inflationPercent}%) a tus categorías exitosamente!`
    );
    setTimeout(() => setAppliedNotice(null), 5000);
  };

  const handleUndo = () => {
    if (previousBackup && onUpdateBudgets) {
      onUpdateBudgets(previousBackup);
      setPreviousBackup(null);
      setAppliedNotice('Se restablecieron los presupuestos anteriores.');
      setTimeout(() => setAppliedNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* SECTION HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Proyección Automática para Próximos Meses
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ajustá tus presupuestos según la inflación esperada tomando como base tus límites actuales o tus gastos reales.
                </p>
              </div>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold flex items-center gap-1.5 self-start md:self-auto">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Simulador de Inflación Dinámico
          </span>
        </div>

        {/* FEEDBACK BANNER */}
        {appliedNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{appliedNotice}</span>
            </div>
            {previousBackup && (
              <button
                type="button"
                onClick={handleUndo}
                className="px-3 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-xs font-extrabold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Deshacer</span>
              </button>
            )}
          </div>
        )}

        {/* 1. SELECCIÓN DE BASE (A vs B) Y CONFIGURACIÓN DE INFLACIÓN (C) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/30 border border-slate-200/90">
          
          {/* Base Selector: A vs B */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">
              1. Base de Cálculo de la Proyección:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Option A: Sobre límites actuales */}
              <button
                type="button"
                onClick={() => setSourceMode('current_budget')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  sourceMode === 'current_budget'
                    ? 'bg-white border-[#7928CA] ring-2 ring-[#7928CA]/20 shadow-md text-slate-900'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#7928CA]">
                    Opción A
                  </span>
                  {sourceMode === 'current_budget' && (
                    <span className="w-2 h-2 rounded-full bg-[#7928CA]" />
                  )}
                </div>
                <div>
                  <strong className="block text-slate-900 text-sm">Sobre Límites Actuales</strong>
                  <span className="text-[11px] text-slate-500">
                    Aplica la inflación sobre los presupuestos fijados hoy ({formatCurrency(totals.baseTotal, currency)}).
                  </span>
                </div>
              </button>

              {/* Option B: Sobre gastos reales registrados */}
              <button
                type="button"
                onClick={() => setSourceMode('real_expenses')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  sourceMode === 'real_expenses'
                    ? 'bg-white border-[#7928CA] ring-2 ring-[#7928CA]/20 shadow-md text-slate-900'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#7928CA]">
                    Opción B
                  </span>
                  {sourceMode === 'real_expenses' && (
                    <span className="w-2 h-2 rounded-full bg-[#7928CA]" />
                  )}
                </div>
                <div>
                  <strong className="block text-slate-900 text-sm">Sobre Gastos Reales</strong>
                  <span className="text-[11px] text-slate-500">
                    Aplica la inflación sobre el promedio histórico mensual registrado en tus movimientos.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Inflation Rate Input: C */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">
              2. Estimación de Inflación (%):
            </label>

            {/* Input + Presets */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1 w-full">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={inflationPercent}
                    onChange={(e) => setInflationPercent(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-black text-lg font-outfit focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    placeholder="5"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-base">
                    %
                  </span>
                </div>

                {/* Compound toggle */}
                <button
                  type="button"
                  onClick={() => setCompoundMonthly(!compoundMonthly)}
                  className={`w-full sm:w-auto px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 text-center ${
                    compoundMonthly
                      ? 'bg-purple-100 border-purple-300 text-[#7928CA]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                  title="Aplica la inflación acumulativa mes a mes"
                >
                  {compoundMonthly ? 'Acumulativo mensual' : 'Ajuste plano'}
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
                {presetRates.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setInflationPercent(rate)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      inflationPercent === rate
                        ? 'bg-[#7928CA] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    +{rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. THREE-MONTH PROJECTION SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {nextMonths.map((m, idx) => {
            const mTotal = idx === 0 ? totals.m1Total : idx === 1 ? totals.m2Total : totals.m3Total;
            const diff = mTotal - totals.baseTotal;
            const pct = totals.baseTotal > 0 ? Math.round((diff / totals.baseTotal) * 100) : 0;

            return (
              <div
                key={m.index}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <Calendar className="w-4 h-4 text-[#7928CA]" />
                    {m.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#7928CA] font-extrabold text-[11px]">
                    +{pct}% acumulado
                  </span>
                </div>

                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-outfit">
                    {formatCurrency(mTotal, currency)}
                  </span>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Variación: <strong className="text-indigo-700">+{formatCurrency(diff, currency)}</strong> sobre base
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ACTION CTA: APPLY TO BUDGETS */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-orange-50/40 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#7928CA]" />
              ¿Querés fijar esta proyección como tus nuevos límites?
            </h4>
            <p className="text-xs text-slate-600 font-medium">
              Al confirmar, se actualizarán los presupuestos de todas tus categorías con el valor calculado para el próximo mes ({nextMonths[0]?.name}).
            </p>
          </div>

          <button
            type="button"
            onClick={handleApplyProjections}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#7928CA] to-[#9d4edd] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar a mis presupuestos</span>
          </button>
        </div>

        {/* 3. CATEGORY PROJECTION BREAKDOWN */}
        <div className="space-y-3 pt-2">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#7928CA]" />
            Desglose Proyectado por Categoría:
          </h4>

          {/* MOBILE CARDS VIEW (block md:hidden) */}
          <div className="block md:hidden space-y-2.5">
            {projectedTable.map((item) => (
              <div key={`mob-proj-${item.category}`} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-extrabold text-slate-900 text-xs truncate">
                      {item.category}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#7928CA] text-[10px] font-extrabold shrink-0 border border-purple-200">
                    +{Math.round(nextMonths[0]?.rate * 100)}% est.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Base ({sourceMode === 'current_budget' ? 'Límite' : 'Real'})
                    </span>
                    <span className="font-bold text-slate-700 font-outfit block mt-0.5">
                      {formatCurrency(item.base, currency)}
                    </span>
                  </div>
                  <div className="bg-purple-100/40 p-1.5 rounded-lg border border-purple-200/50">
                    <span className="text-[10px] text-purple-900 font-bold block">
                      {nextMonths[0]?.name}
                    </span>
                    <span className="font-black text-[#7928CA] font-outfit block mt-0.5">
                      {formatCurrency(item.month1.projected, currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>{nextMonths[1]?.name}: <strong>{formatCurrency(item.month2.projected, currency)}</strong></span>
                  <span>{nextMonths[2]?.name}: <strong>{formatCurrency(item.month3.projected, currency)}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-right">
                    Base Actual ({sourceMode === 'current_budget' ? 'Límite' : 'Gasto Real'})
                  </th>
                  <th className="py-3 px-4 text-right bg-purple-50/50 text-[#7928CA]">
                    {nextMonths[0]?.name} (+{Math.round(nextMonths[0]?.rate * 100)}%)
                  </th>
                  <th className="py-3 px-4 text-right hidden md:table-cell">
                    {nextMonths[1]?.name} (+{Math.round(nextMonths[1]?.rate * 100)}%)
                  </th>
                  <th className="py-3 px-4 text-right hidden lg:table-cell">
                    {nextMonths[2]?.name} (+{Math.round(nextMonths[2]?.rate * 100)}%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectedTable.map((item) => (
                  <tr key={item.category} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-slate-800">{item.category}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-600 font-outfit">
                      {formatCurrency(item.base, currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-[#7928CA] font-outfit bg-purple-50/30">
                      {formatCurrency(item.month1.projected, currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-700 font-outfit hidden md:table-cell">
                      {formatCurrency(item.month2.projected, currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-700 font-outfit hidden lg:table-cell">
                      {formatCurrency(item.month3.projected, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/90 font-extrabold text-slate-900 border-t border-slate-200">
                  <td className="py-3 px-4">TOTAL GENERAL</td>
                  <td className="py-3 px-4 text-right font-outfit">
                    {formatCurrency(totals.baseTotal, currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-outfit text-[#7928CA] bg-purple-100/40">
                    {formatCurrency(totals.m1Total, currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-outfit hidden md:table-cell">
                    {formatCurrency(totals.m2Total, currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-outfit hidden lg:table-cell">
                    {formatCurrency(totals.m3Total, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
