import React, { useState } from 'react';
import { 
  PieChart, 
  BarChart3, 
  Layers, 
  Users, 
  User, 
  ArrowUpRight, 
  TrendingUp,
  Percent
} from 'lucide-react';
import { CategoryColors, CategoryMap, CoupleProfile, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ChartsSectionProps {
  transactions: Transaction[];
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  currency: string;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  transactions,
  categoryMap,
  categoryColors,
  currency,
}) => {
  const [selectedView, setSelectedView] = useState<'all' | 'individual' | 'pareja'>('all');

  const filtered = selectedView === 'all' 
    ? transactions 
    : transactions.filter(t => t.tipo === selectedView);

  const totalSpent = filtered.reduce((acc, t) => acc + (t.monto || 0), 0);

  // Group by Category
  const categorySums: { [cat: string]: number } = {};
  filtered.forEach(t => {
    categorySums[t.categoria] = (categorySums[t.categoria] || 0) + t.monto;
  });

  const sortedCategories = Object.entries(categorySums).sort((a, b) => b[1] - a[1]);

  // Group by Subcategory
  const subcategorySums: { [sub: string]: { amount: number; category: string } } = {};
  filtered.forEach(t => {
    if (!subcategorySums[t.subcategoria]) {
      subcategorySums[t.subcategoria] = { amount: 0, category: t.categoria };
    }
    subcategorySums[t.subcategoria].amount += t.monto;
  });

  const sortedSubcategories = Object.entries(subcategorySums).sort((a, b) => b[1].amount - a[1].amount);
  const maxSubAmount = sortedSubcategories.length > 0 ? sortedSubcategories[0][1].amount : 1;

  // Donut SVG calculations
  let accumulatedAngle = 0;
  const donutSegments = sortedCategories.map(([cat, amount]) => {
    const pct = totalSpent > 0 ? amount / totalSpent : 0;
    const startAngle = accumulatedAngle;
    accumulatedAngle += pct * 360;
    const color = categoryColors[cat] || '#6366f1';
    return {
      cat,
      amount,
      pct: pct * 100,
      startAngle,
      endAngle: accumulatedAngle,
      color,
    };
  });

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Category Distribution Donut & Breakdown (5 cols) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" />
              <span>Distribución por Categoría</span>
            </h2>

            {/* Local View Filter */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                onClick={() => setSelectedView('all')}
                className={`px-2 py-1 rounded-md transition-all ${
                  selectedView === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedView('individual')}
                className={`px-2 py-1 rounded-md transition-all ${
                  selectedView === 'individual' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Indiv.
              </button>
              <button
                onClick={() => setSelectedView('pareja')}
                className={`px-2 py-1 rounded-md transition-all ${
                  selectedView === 'pareja' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Pareja
              </button>
            </div>
          </div>

          {/* Donut Visualization */}
          <div className="relative flex items-center justify-center my-4">
            <svg viewBox="0 0 100 100" className="w-44 h-44 -rotate-90 transform">
              {donutSegments.length > 0 ? (
                donutSegments.map((seg, i) => {
                  const strokeDasharray = `${(seg.pct * 2.83).toFixed(2)} 283`;
                  const strokeDashoffset = `-${(seg.startAngle * 2.83 / 360 * 100).toFixed(2)}`;
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500 hover:opacity-85"
                    />
                  );
                })
              ) : (
                <circle cx="50" cy="50" r="42" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
              )}
            </svg>

            {/* Inner text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
              <span className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {formatCurrency(totalSpent, currency)}
              </span>
              <span className="text-[10px] text-slate-500">{filtered.length} gastos</span>
            </div>
          </div>
        </div>

        {/* Category Percentage List */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {sortedCategories.length > 0 ? (
            sortedCategories.map(([cat, amount]) => {
              const pct = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : '0.0';
              const color = categoryColors[cat] || '#6366f1';
              return (
                <div key={cat} className="flex items-center justify-between text-xs group">
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-medium text-slate-700 truncate">{cat}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-slate-500">{formatCurrency(amount, currency)}</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No hay gastos para mostrar</p>
          )}
        </div>
      </div>

      {/* 2. Subcategory Detailed Ranking (7 cols) */}
      <div className="lg:col-span-7 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Desglose por Subcategorías</span>
            </h2>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">
              Ranking de Gastos
            </span>
          </div>

          {/* Subcategory Horizontal Bars */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {sortedSubcategories.length > 0 ? (
              sortedSubcategories.map(([sub, info]) => {
                const pct = totalSpent > 0 ? ((info.amount / totalSpent) * 100).toFixed(1) : '0.0';
                const relativePct = maxSubAmount > 0 ? (info.amount / maxSubAmount) * 100 : 0;
                const catColor = categoryColors[info.category] || '#10b981';

                return (
                  <div key={sub} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 min-w-0 pr-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                        <span className="font-semibold text-slate-800 truncate">{sub}</span>
                        <span className="text-[10px] text-slate-400 truncate hidden sm:inline">({info.category})</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="font-bold text-slate-900">{formatCurrency(info.amount, currency)}</span>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(relativePct, 3)}%`,
                          backgroundColor: catColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No hay transacciones registradas</p>
            )}
          </div>
        </div>

        {/* Quick pill summary tags */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Principales Subrubros
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sortedSubcategories.slice(0, 5).map(([sub, info]) => {
              const pct = totalSpent > 0 ? ((info.amount / totalSpent) * 100).toFixed(0) : '0';
              return (
                <span
                  key={sub}
                  className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{sub}</span>
                  <span className="font-bold text-slate-900">{pct}%</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
