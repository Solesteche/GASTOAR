import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PieChart as PieChartIcon, TrendingUp, ChevronRight, Tag, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Transaction } from '../types';

interface ExpenseDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryPieData: Array<{
    name: string;
    value: number;
    pct: number;
    color: string;
  }>;
  totalExpenses: number;
  generalBudget: number;
  budgetUsedPercent?: number;
  transactions?: Transaction[];
  monthExpensesList?: Transaction[];
  isBalanceHidden?: boolean;
  currency?: string;
  onSelectCategory?: (category: string) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenTransactionModal?: () => void;
}

export const ExpenseDistributionModal: React.FC<ExpenseDistributionModalProps> = ({
  isOpen,
  onClose,
  categoryPieData = [],
  totalExpenses,
  generalBudget,
  budgetUsedPercent,
  transactions = [],
  monthExpensesList = [],
  isBalanceHidden = false,
  currency = 'ARS',
  onSelectCategory,
  onNavigateTab,
  onOpenTransactionModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const ars = (n: number) =>
    '$ ' + Math.round(Math.abs(n)).toLocaleString('es-AR', { maximumFractionDigits: 0 });

  const calculatedPct = generalBudget > 0
    ? Math.round((totalExpenses / generalBudget) * 100)
    : 0;
  const displayBudgetUsedPercent = budgetUsedPercent ?? calculatedPct;

  const activeCategoryData = selectedCategory
    ? categoryPieData.find((c) => c.name.toLowerCase() === selectedCategory.toLowerCase())
    : null;

  const displayHighlight = activeCategoryData || categoryPieData[0];

  // Transactions belonging to selected category or recent expenses
  const allExpenses = (monthExpensesList.length > 0 ? monthExpensesList : transactions)
    .filter((t) => t.tipoTransaccion !== 'ingreso');

  const filteredMovements = selectedCategory
    ? allExpenses.filter((t) => (t.categoria || 'Otros').toLowerCase() === selectedCategory.toLowerCase())
    : allExpenses.slice(0, 5);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#150D2A] rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/60 overflow-hidden z-10 my-8"
        >
          {/* Header styled with linear-gradient */}
          <div
            style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D3FEA 55%, #7C3AED 100%)' }}
            className="p-4 sm:p-6 text-white relative"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-xs">
                  <PieChartIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    Distribución de Gastos
                  </h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Desglose por categoría del presupuesto consumido
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total spent & budget usage summary strip */}
            <div className="mt-4 pt-3.5 border-t border-white/15 grid grid-cols-3 gap-2 text-left">
              <div>
                <span className="text-[10px] text-purple-200 font-semibold block uppercase tracking-wider">Total Gastado</span>
                <span className="text-xl sm:text-2xl font-black font-outfit text-white tracking-tight">
                  {isBalanceHidden ? '$ ••••••' : ars(totalExpenses)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-purple-200 font-semibold block uppercase tracking-wider">Presupuesto</span>
                <span className="text-xl sm:text-2xl font-black font-outfit text-white/90 tracking-tight">
                  {isBalanceHidden ? '$ ••••••' : ars(generalBudget)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-purple-200 font-semibold block uppercase tracking-wider">% Utilizado</span>
                <span className="text-xl sm:text-2xl font-black font-outfit text-orange-300 tracking-tight">
                  {displayBudgetUsedPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Donut Chart & Category Focus */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-3xl border border-purple-100/70 dark:border-purple-900/40">
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={68}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#ffffff"
                      onClick={(data) => {
                        setSelectedCategory((prev) => (prev === data.name ? null : data.name));
                      }}
                    >
                      {categoryPieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          opacity={selectedCategory && selectedCategory !== entry.name ? 0.35 : 1}
                          className="cursor-pointer transition-all hover:opacity-90"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [ars(val), 'Gastado']}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
                  <span className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                    {categoryPieData.length}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                    Categorías
                  </span>
                </div>
              </div>

              {/* Quick stats or selected category highlight */}
              <div className="flex-1 w-full text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {activeCategoryData ? 'Categoría seleccionada' : 'Mayor consumo'}
                  </span>
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="text-[10px] text-[#6D3FEA] dark:text-purple-300 font-bold hover:underline cursor-pointer"
                    >
                      Ver todas
                    </button>
                  )}
                </div>

                {displayHighlight && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#1F143D] border border-purple-100 dark:border-purple-900/50 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: displayHighlight.color }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                          {displayHighlight.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {isBalanceHidden ? '$ •••' : ars(displayHighlight.value)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#6D3FEA] dark:text-purple-300 block">
                        {displayHighlight.pct}%
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">
                        del total
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {selectedCategory
                    ? `Filtrando por "${selectedCategory}". Hacé clic en la lista para cambiar.`
                    : 'Tocá una categoría o porción del gráfico para ver sus detalles.'}
                </p>
              </div>
            </div>

            {/* Category breakdown list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Participación por Categoría
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {categoryPieData.length} activas
                </span>
              </div>

              <div className="space-y-1.5">
                {categoryPieData.map((item) => {
                  const isSelected = selectedCategory?.toLowerCase() === item.name.toLowerCase();
                  return (
                    <div
                      key={item.name}
                      onClick={() => {
                        setSelectedCategory((prev) => (prev === item.name ? null : item.name));
                      }}
                      className={`flex flex-col gap-1.5 p-2.5 rounded-2xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-600 shadow-xs'
                          : 'bg-white dark:bg-[#1A1235]/60 hover:bg-slate-50 dark:hover:bg-purple-950/30 border-slate-100 dark:border-purple-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className={`font-bold truncate ${
                            isSelected
                              ? 'text-[#6D3FEA] dark:text-purple-300'
                              : 'text-slate-800 dark:text-white'
                          }`}>
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                            {item.pct}%
                          </span>
                          <span className="font-black text-slate-900 dark:text-white tabular-nums">
                            {isBalanceHidden ? '$ •••••' : ars(item.value)}
                          </span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                            isSelected ? 'rotate-90 text-[#6D3FEA]' : 'text-slate-400'
                          }`} />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-purple-950/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, item.pct)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected category / Recent movements breakdown */}
            {filteredMovements.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-purple-900/40">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {selectedCategory ? `Movimientos en "${selectedCategory}"` : 'Últimos movimientos del mes'}
                  </span>
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectCategory) {
                          onSelectCategory(selectedCategory);
                          onClose();
                        } else if (onNavigateTab) {
                          onNavigateTab('transactions');
                          onClose();
                        }
                      }}
                      className="text-[11px] font-bold text-[#6D3FEA] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Ver en movimientos</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-purple-900/30 rounded-2xl border border-slate-100 dark:border-purple-900/40 overflow-hidden bg-slate-50/50 dark:bg-purple-950/20">
                  {filteredMovements.slice(0, 4).map((m) => (
                    <div key={m.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-[#6D3FEA] dark:text-purple-300 flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {m.concepto || m.descripcion || m.categoria || 'Gasto'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {m.fecha || 'Sin fecha'} {m.subcategoria ? `• ${m.subcategoria}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white shrink-0">
                        {isBalanceHidden ? '$ •••' : ars(m.monto)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer action */}
          <div className="p-4 bg-slate-50/80 dark:bg-purple-950/30 border-t border-slate-100 dark:border-purple-900/40 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {selectedCategory
                ? `Mostrando ${selectedCategory}`
                : 'Distribución en tiempo real'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) onNavigateTab('transactions');
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#6D3FEA] hover:bg-[#5A2FD1] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Ver transacciones</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
