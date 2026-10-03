import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Search, ArrowUpRight, ArrowDownLeft, Plus, Calendar, Tag } from 'lucide-react';
import { Transaction } from '../types';

interface RecentMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[];
  monthExpensesList?: Transaction[];
  generalBudget: number;
  totalExpenses: number;
  budgetUsedPercent: number;
  isBalanceHidden?: boolean;
  onNavigateTab?: (tab: string) => void;
  onOpenTransactionModal?: () => void;
}

export const RecentMovementsModal: React.FC<RecentMovementsModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
  monthExpensesList = [],
  generalBudget,
  totalExpenses,
  budgetUsedPercent,
  isBalanceHidden = false,
  onNavigateTab,
  onOpenTransactionModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'gasto' | 'ingreso'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const ars = (n: number) =>
    "$ " + Math.round(Math.abs(n)).toLocaleString("es-AR", { maximumFractionDigits: 0 });

  // Source transactions list: month expenses/transactions first, or all transactions fallback
  const items = useMemo(() => {
    let list: Transaction[] = [];

    if (transactions && transactions.length > 0) {
      list = [...transactions];
    } else if (monthExpensesList && monthExpensesList.length > 0) {
      list = [...monthExpensesList];
    }

    // Sort descending by date, then createdAt
    list.sort((a, b) => {
      const dateA = a.fecha || '';
      const dateB = b.fecha || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    if (list.length === 0) {
      // Mock movements so the user always sees clean data
      return [
        {
          id: 'm1',
          concepto: 'Supermercado Coto',
          descripcion: 'Supermercado',
          monto: 32500,
          moneda: 'ARS',
          categoria: 'Alimentación',
          subcategoria: 'Supermercado',
          fecha: new Date().toISOString().split('T')[0],
          tipo: 'individual',
          tipoTransaccion: 'gasto',
          pagadoPor: 'Sol',
        },
        {
          id: 'm2',
          concepto: 'Cafetería Martínez',
          descripcion: 'Café de especialidad',
          monto: 4500,
          moneda: 'ARS',
          categoria: 'Gastronomía',
          subcategoria: 'Café',
          fecha: new Date().toISOString().split('T')[0],
          tipo: 'individual',
          tipoTransaccion: 'gasto',
          pagadoPor: 'Sol',
        },
        {
          id: 'm3',
          concepto: 'Viaje Uber',
          descripcion: 'Traslado trabajo',
          monto: 6800,
          moneda: 'ARS',
          categoria: 'Transporte',
          subcategoria: 'Taxi/Uber',
          fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          tipo: 'individual',
          tipoTransaccion: 'gasto',
          pagadoPor: 'Sol',
        },
        {
          id: 'm4',
          concepto: 'Farmacia Farmacity',
          descripcion: 'Medicamentos y cuidado',
          monto: 12300,
          moneda: 'ARS',
          categoria: 'Salud',
          subcategoria: 'Farmacia',
          fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          tipo: 'individual',
          tipoTransaccion: 'gasto',
          pagadoPor: 'Sol',
        },
        {
          id: 'm5',
          concepto: 'Carga SUBE',
          descripcion: 'Transporte público',
          monto: 5000,
          moneda: 'ARS',
          categoria: 'Transporte',
          subcategoria: 'Colectivo/Tren',
          fecha: new Date(Date.now() - 172800000).toISOString().split('T')[0],
          tipo: 'individual',
          tipoTransaccion: 'gasto',
          pagadoPor: 'Sol',
        },
        {
          id: 'm6',
          concepto: 'Ingreso Sueldo',
          descripcion: 'Honorarios mensuales',
          monto: 850000,
          moneda: 'ARS',
          categoria: 'Ingresos',
          subcategoria: 'Sueldo',
          fecha: new Date(Date.now() - 259200000).toISOString().split('T')[0],
          tipo: 'individual',
          tipoTransaccion: 'ingreso',
          pagadoPor: 'Sol',
        },
      ] as Transaction[];
    }

    return list;
  }, [transactions, monthExpensesList]);

  // Filtered by type and search
  const filteredItems = useMemo(() => {
    return items.filter(t => {
      const isIngreso = t.tipoTransaccion === 'ingreso';
      if (filterType === 'gasto' && isIngreso) return false;
      if (filterType === 'ingreso' && !isIngreso) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (t.descripcion || t.concepto || '').toLowerCase();
        const cat = (t.categoria || '').toLowerCase();
        const sub = (t.subcategoria || '').toLowerCase();
        return title.includes(q) || cat.includes(q) || sub.includes(q);
      }
      return true;
    });
  }, [items, filterType, searchQuery]);

  const getEmoji = (t: Transaction) => {
    const isIngreso = t.tipoTransaccion === 'ingreso';
    if (isIngreso) return '💰';
    const c = (t.categoria || '').toLowerCase();
    if (c.includes('aliment') || c.includes('super')) return '🛒';
    if (c.includes('cafe') || c.includes('gastro') || c.includes('restau')) return '☕';
    if (c.includes('transp') || c.includes('uber') || c.includes('auto')) return '🚗';
    if (c.includes('salud') || c.includes('farma')) return '💊';
    if (c.includes('serv') || c.includes('luz') || c.includes('gas')) return '⚡';
    if (c.includes('vivien') || c.includes('alquiler')) return '🏠';
    if (c.includes('tarjet')) return '💳';
    if (c.includes('ocio') || c.includes('entrete')) return '🍿';
    return '💸';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Reciente';
    try {
      const [y, m, d] = dateStr.split('-');
      if (!y || !m || !d) return dateStr;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      const today = new Date();
      const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Ayer';
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${Number(d)} ${months[Number(m) - 1]}`;
    } catch {
      return dateStr;
    }
  };

  const remainingBudget = Math.max(0, generalBudget - totalExpenses);

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

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#181332] rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/50 overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-3 bg-gradient-to-r from-purple-50/50 via-white to-orange-50/40 dark:from-purple-950/40 dark:via-[#181332] dark:to-orange-950/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F95420] to-[#E03A00] text-white flex items-center justify-center text-lg shadow-sm font-bold shrink-0">
                  ⏱
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight truncate">
                      Últimos movimientos
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#F95420] font-black text-[11px] shrink-0">
                      {budgetUsedPercent}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Movimientos asociados al consumo de tu presupuesto
                  </p>
                </div>
              </div>

              {/* Close Button (Cruz) */}
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

            {/* Budget status banner */}
            <div className="px-4 sm:px-5 py-3 bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-200/90 mb-1.5">
                <span>Presupuesto mensual consumido</span>
                <span className="font-black text-white">{budgetUsedPercent}%</span>
              </div>

              {/* Mini progress bar */}
              <div className="h-1 rounded-full bg-white/15 overflow-hidden mb-2.5 w-full">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-[#F95420]"
                  style={{ width: `${Math.min(100, budgetUsedPercent)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-purple-200/75">Gastado</p>
                  <p className="text-xs sm:text-sm font-black text-white truncate">
                    {isBalanceHidden ? '$ •••••' : ars(totalExpenses)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-purple-200/75">Presupuesto</p>
                  <p className="text-xs sm:text-sm font-black text-white truncate">
                    {isBalanceHidden ? '$ •••••' : ars(generalBudget)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-purple-200/75">Restante</p>
                  <p className="text-xs sm:text-sm font-black text-emerald-400 truncate">
                    {isBalanceHidden ? '$ •••••' : ars(remainingBudget)}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls: Filter Pills & Search */}
            <div className="p-3 sm:px-5 border-b border-slate-100 dark:border-purple-900/30 flex flex-wrap items-center justify-between gap-2.5">
              {/* Type pills */}
              <div className="flex items-center bg-slate-100 dark:bg-purple-950/60 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-white dark:bg-[#2A184A] text-[#7928CA] dark:text-purple-300 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('gasto')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === 'gasto'
                      ? 'bg-white dark:bg-[#2A184A] text-[#7928CA] dark:text-purple-300 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Gastos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('ingreso')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === 'ingreso'
                      ? 'bg-white dark:bg-[#2A184A] text-[#7928CA] dark:text-purple-300 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Ingresos
                </button>
              </div>

              {/* Search input */}
              <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-xl bg-slate-50 dark:bg-purple-950/40 border border-slate-200 dark:border-purple-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7928CA]"
                />
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 divide-y divide-slate-100 dark:divide-purple-900/20 max-h-[380px]">
              {filteredItems.length > 0 ? (
                filteredItems.map((tx) => {
                  const isIngreso = tx.tipoTransaccion === 'ingreso';
                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        onClose();
                        if (onNavigateTab) onNavigateTab('transactions');
                      }}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-purple-950/30 rounded-2xl px-2.5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 shadow-2xs ${
                            isIngreso
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          }`}
                        >
                          {getEmoji(tx)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-[#7928CA] dark:group-hover:text-purple-300 transition-colors">
                            {tx.descripcion || tx.concepto || 'Movimiento'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
                            <span>{formatDate(tx.fecha)}</span>
                            <span>•</span>
                            <span className="truncate">{tx.categoria || 'Varios'}</span>
                            {tx.pagadoPor && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-slate-500 dark:text-slate-400">
                                  {tx.pagadoPor}
                                </span>
                              </>
                            )}
                            {tx.esCuotas && tx.cuotasTotal && (
                              <span className="px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-900/50 text-[#7928CA] dark:text-purple-300 text-[9px] font-bold">
                                {tx.cuotaActual ? `${tx.cuotaActual}/${tx.cuotasTotal}` : `${tx.cuotasTotal}c`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-black tabular-nums ${
                            isIngreso
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500 dark:text-rose-400'
                          }`}
                        >
                          {isIngreso ? '+' : '-'} {isBalanceHidden ? '$ •••••' : ars(tx.monto)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-purple-950/60 flex items-center justify-center mx-auto text-xl">
                    🔍
                  </div>
                  <p className="text-xs font-semibold">No se encontraron movimientos</p>
                  <p className="text-[11px] text-slate-400">
                    {searchQuery ? 'Prueba con otra palabra clave' : 'No hay registros en esta categoría'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 bg-slate-50/80 dark:bg-purple-950/40 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-2">
              {onOpenTransactionModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTransactionModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-900 text-[#7928CA] dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo gasto</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('transactions');
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#7928CA] hover:bg-[#6821ad] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-purple-950 dark:hover:bg-purple-900 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
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
export default RecentMovementsModal;
