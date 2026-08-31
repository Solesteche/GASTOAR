import React from 'react';
import { 
  Target, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Plus,
  Settings2
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
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  budgets,
  categoryMap,
  categoryColors,
  transactions,
  currency,
  onOpenBudgetModal,
}) => {
  // Calculate total spent per category and subcategory
  const catTotals: { [cat: string]: number } = {};
  const subTotals: { [sub: string]: number } = {};

  transactions.forEach(tx => {
    catTotals[tx.categoria] = (catTotals[tx.categoria] || 0) + tx.monto;
    subTotals[tx.subcategoria] = (subTotals[tx.subcategoria] || 0) + tx.monto;
  });

  const activeAlerts: { type: 'danger' | 'warning' | 'info'; title: string; message: string }[] = [];

  // Check Category alerts
  Object.keys(categoryMap).forEach(cat => {
    const budget = budgets.categories[cat] || 0;
    const spent = catTotals[cat] || 0;
    if (budget > 0) {
      const pct = Math.round((spent / budget) * 100);
      if (pct >= 100) {
        activeAlerts.push({
          type: 'danger',
          title: `¡Presupuesto Excedido! (${cat})`,
          message: `Has consumido el ${pct}% (${formatCurrency(spent, currency)} de ${formatCurrency(budget, currency)}).`,
        });
      } else if (pct >= 85) {
        activeAlerts.push({
          type: 'warning',
          title: `Alerta preventiva (${cat})`,
          message: `Llevas consumido el ${pct}% del límite mensual fijado.`,
        });
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Section: Quick Summary & Category Limits Config */}
      <section className="bg-white p-5 sm:p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] border border-purple-100/80 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-50">
          <div>
            <h2 className="font-extrabold text-[#2E0854] text-base sm:text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-[#7928CA]" />
              <span>Control y Límites de Presupuestos</span>
            </h2>
            <p className="text-xs text-slate-500">
              Supervisa los límites mensuales fijados por categoría y recibe alertas en tiempo real.
            </p>
          </div>

          <button
            onClick={onOpenBudgetModal}
            className="px-4 py-2 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <Settings2 className="w-4 h-4" />
            <span>Configurar Presupuestos</span>
          </button>
        </div>

        {/* Alert Banners */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            {activeAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 shadow-xs ${
                  alert.type === 'danger'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-orange-50 border-orange-200 text-orange-900'
                }`}
              >
                {alert.type === 'danger' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#F95420] shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="font-bold block">{alert.title}</strong>
                  <span className="text-slate-600">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Budgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Object.keys(categoryMap).map(cat => {
            const budget = budgets.categories[cat] || 0;
            const spent = catTotals[cat] || 0;
            const color = categoryColors[cat] || '#7928CA';
            const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;

            let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            let barBg = 'bg-emerald-500';

            if (pct >= 100) {
              badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
              barBg = 'bg-rose-500';
            } else if (pct >= 80) {
              badgeColor = 'bg-orange-50 text-orange-800 border-orange-200';
              barBg = 'bg-[#F95420]';
            }

            return (
              <div
                key={cat}
                className="p-4 bg-purple-50/20 border border-purple-100/70 rounded-2xl space-y-2.5 hover:border-purple-300 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <h4 className="font-extrabold text-xs text-[#2E0854] truncate" title={cat}>{cat}</h4>
                  </div>
                  {budget > 0 ? (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {pct}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-purple-50 px-1.5 py-0.5 rounded-md font-bold">
                      Sin límite
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-purple-100/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barBg}`}
                    style={{ width: `${budget > 0 ? Math.min(pct, 100) : 0}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5 font-medium">
                  <span>Gastado: <strong className="text-[#2E0854] font-bold">{formatCurrency(spent, currency)}</strong></span>
                  <span>
                    {budget > 0 ? `Límite: ${formatCurrency(budget, currency)}` : 'Definir meta'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Section: Comprehensive Budget vs Real Consumption Comparison by Date Range */}
      <BudgetComparisonView
        budgets={budgets}
        categoryMap={categoryMap}
        categoryColors={categoryColors}
        transactions={transactions}
        currency={currency}
      />
    </div>
  );
};
