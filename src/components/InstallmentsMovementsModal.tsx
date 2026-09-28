import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingDown,
  Search,
  ShieldCheck
} from 'lucide-react';
import { Transaction, CoupleProfile } from '../types';
import { formatCurrency, formatDateEs } from '../utils/formatters';
import { getInstallmentPlanDetails, InstallmentPlanDetails } from '../utils/installmentCalculations';

interface InstallmentsMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  profile: CoupleProfile;
  currency?: string;
  onNavigateTab?: (tab: string) => void;
  initialFilter?: 'all' | 'ending_this_month' | 'active' | 'completed';
}

interface InstallmentItemWithDetails {
  tx: Transaction;
  details: InstallmentPlanDetails;
  isEndingThisMonth: boolean;
  totalCuotas: number;
  cuotaActual: number;
  cuotaMonto: number;
  remainingCuotas: number;
  remainingAmount: number;
  progressPct: number;
  isCompleted: boolean;
}

export const InstallmentsMovementsModal: React.FC<InstallmentsMovementsModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
  profile,
  currency = 'ARS',
  onNavigateTab,
  initialFilter = 'all',
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ending_this_month' | 'active' | 'completed'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<string>('ALL');

  // Today and current month key (e.g. "2026-09")
  const today = useMemo(() => new Date(), []);
  const currentMonthKey = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }, [today]);

  const currentMonthName = useMemo(() => {
    return today.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }, [today]);

  // Compute all installment transactions and their details
  const installmentItems: InstallmentItemWithDetails[] = useMemo(() => {
    const list: InstallmentItemWithDetails[] = [];

    transactions.forEach(tx => {
      const isInstallment = Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1));
      if (!isInstallment) return;

      const details = getInstallmentPlanDetails(tx);
      const totalCuotas = Math.max(1, tx.cuotasTotal || 1);
      const cuotaActual = Math.max(0, Math.min(totalCuotas, tx.cuotaActual || 1));
      const cuotaMonto = tx.montoCuota || (tx.monto / totalCuotas);
      const isCompleted = cuotaActual >= totalCuotas || details.isCompleted;

      // Determine if ending this month
      // 1. The last scheduled installment month is this month
      // 2. Or cuotaActual === totalCuotas and finalDueDate falls in currentMonthKey
      let isEndingThisMonth = false;
      if (details.schedule && details.schedule.length > 0) {
        const lastItem = details.schedule[details.schedule.length - 1];
        if (lastItem.monthKey === currentMonthKey) {
          isEndingThisMonth = true;
        }
      }
      if (!isEndingThisMonth && cuotaActual === totalCuotas && details.finalDueDate?.startsWith(currentMonthKey)) {
        isEndingThisMonth = true;
      }

      list.push({
        tx,
        details,
        isEndingThisMonth,
        totalCuotas,
        cuotaActual,
        cuotaMonto,
        remainingCuotas: details.remainingCuotas,
        remainingAmount: details.remainingAmount,
        progressPct: details.progressPct,
        isCompleted,
      });
    });

    // Sort: ending this month first, then active, then completed
    return list.sort((a, b) => {
      if (a.isEndingThisMonth && !b.isEndingThisMonth) return -1;
      if (!a.isEndingThisMonth && b.isEndingThisMonth) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      if (a.isCompleted && !b.isCompleted) return 1;
      return new Date(b.tx.fecha).getTime() - new Date(a.tx.fecha).getTime();
    });
  }, [transactions, currentMonthKey]);

  // Unique cards list for filter
  const cardList = useMemo(() => {
    const set = new Set<string>();
    installmentItems.forEach(item => {
      if (item.tx.tarjetaNombre) set.add(item.tx.tarjetaNombre);
    });
    return Array.from(set);
  }, [installmentItems]);

  // Overall metrics calculation
  const metrics = useMemo(() => {
    let totalCommitted = 0;
    let monthlyLoadThisMonth = 0;
    let totalPending = 0;
    let endingThisMonthCount = 0;
    let endingThisMonthAmountLiberated = 0;
    let activeCount = 0;
    let completedCount = 0;

    installmentItems.forEach(item => {
      totalCommitted += item.tx.monto || 0;
      if (!item.isCompleted) {
        activeCount++;
        monthlyLoadThisMonth += item.cuotaMonto;
        totalPending += item.remainingAmount;
      } else {
        completedCount++;
      }

      if (item.isEndingThisMonth) {
        endingThisMonthCount++;
        endingThisMonthAmountLiberated += item.cuotaMonto;
      }
    });

    return {
      totalCommitted,
      monthlyLoadThisMonth,
      totalPending,
      endingThisMonthCount,
      endingThisMonthAmountLiberated,
      activeCount,
      completedCount,
    };
  }, [installmentItems]);

  // Filtered list based on state
  const filteredList = useMemo(() => {
    return installmentItems.filter(item => {
      if (activeFilter === 'ending_this_month' && !item.isEndingThisMonth) return false;
      if (activeFilter === 'active' && item.isCompleted) return false;
      if (activeFilter === 'completed' && !item.isCompleted) return false;

      if (selectedCard !== 'ALL' && item.tx.tarjetaNombre !== selectedCard) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const concepto = item.tx.concepto.toLowerCase();
        const tarjeta = (item.tx.tarjetaNombre || '').toLowerCase();
        const desc = (item.tx.descripcion || '').toLowerCase();
        if (!concepto.includes(q) && !tarjeta.includes(q) && !desc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [installmentItems, activeFilter, selectedCard, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#181332] border border-slate-100 dark:border-purple-900/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-purple-900/30 flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-purple-50/30 to-transparent dark:from-amber-950/20 dark:via-purple-950/20 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/25 shrink-0">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                  Movimientos y Gastos en Cuotas
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase">
                  {installmentItems.length} {installmentItems.length === 1 ? 'compra' : 'compras'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                Control de planes en cuotas · {currentMonthName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Banner: Cuotas que terminan este mes */}
        {metrics.endingThisMonthCount > 0 ? (
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/10 border-b border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-base font-black shadow-xs shrink-0">
                🎉
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <span>¡Buenas noticias!</span>
                  <span className="underline decoration-emerald-400">
                    {metrics.endingThisMonthCount} {metrics.endingThisMonthCount === 1 ? 'cuota termina' : 'cuotas terminan'} este mes
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Al completar este ciclo liberarás <span className="font-bold">{formatCurrency(metrics.endingThisMonthAmountLiberated, currency)}</span> por mes en tus tarjetas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveFilter('ending_this_month')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
            >
              Ver {metrics.endingThisMonthCount === 1 ? 'la que termina' : 'las que terminan'} →
            </button>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-purple-950/20 border-b border-slate-100 dark:border-purple-900/30 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Ninguna cuota finaliza este mes. Tus planes se mantienen al día y ordenados.
            </span>
          </div>
        )}

        {/* Summary metrics row */}
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-[#1e173e]/50 border-b border-slate-100 dark:border-purple-900/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white dark:bg-[#181332] p-3 rounded-2xl border border-slate-100 dark:border-purple-900/30">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Carga Este Mes</span>
              <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 block truncate">
                {formatCurrency(metrics.monthlyLoadThisMonth, currency)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#181332] p-3 rounded-2xl border border-slate-100 dark:border-purple-900/30">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Terminan Este Mes</span>
              <span className={`text-sm sm:text-base font-black mt-0.5 block ${metrics.endingThisMonthCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                {metrics.endingThisMonthCount > 0 ? `🎉 ${metrics.endingThisMonthCount}` : '0'}
              </span>
            </div>

            <div className="bg-white dark:bg-[#181332] p-3 rounded-2xl border border-slate-100 dark:border-purple-900/30">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Saldo Pendiente</span>
              <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 block truncate">
                {formatCurrency(metrics.totalPending, currency)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#181332] p-3 rounded-2xl border border-slate-100 dark:border-purple-900/30">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Total Comprometido</span>
              <span className="text-sm sm:text-base font-black text-slate-800 dark:text-white mt-0.5 block truncate">
                {formatCurrency(metrics.totalCommitted, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-purple-900/30 bg-white dark:bg-[#181332]">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-purple-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-purple-900'
              }`}
            >
              Todas ({installmentItems.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('ending_this_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                activeFilter === 'ending_this_month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : metrics.endingThisMonthCount > 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-100 dark:bg-purple-950/60 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>🏁 Terminan este mes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px]">
                {metrics.endingThisMonthCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'active'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-purple-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-purple-900'
              }`}
            >
              Activas ({metrics.activeCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'completed'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-purple-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-purple-900'
              }`}
            >
              Finalizadas ({metrics.completedCount})
            </button>
          </div>

          {/* Card selector & search */}
          <div className="flex items-center gap-2">
            {cardList.length > 0 && (
              <select
                value={selectedCard}
                onChange={e => setSelectedCard(e.target.value)}
                className="text-xs font-bold bg-slate-100 dark:bg-purple-950/60 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl border border-transparent focus:border-amber-500 outline-hidden cursor-pointer"
              >
                <option value="ALL">Todas las tarjetas</option>
                {cardList.map(card => (
                  <option key={card} value={card}>
                    {card}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar compra..."
                className="pl-8 pr-2.5 py-1.5 text-xs bg-slate-100 dark:bg-purple-950/60 text-slate-800 dark:text-white rounded-xl border border-transparent focus:border-amber-500 outline-hidden w-28 sm:w-36"
              />
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredList.length > 0 ? (
            <div className="space-y-3">
              {filteredList.map(item => {
                const isEnding = item.isEndingThisMonth;
                const isComplete = item.isCompleted;

                return (
                  <div
                    key={item.tx.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-2xs space-y-2.5 ${
                      isEnding
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60 hover:border-emerald-400'
                        : isComplete
                        ? 'bg-slate-50/50 dark:bg-[#171131] border-slate-100 dark:border-purple-900/30 opacity-80'
                        : 'bg-white dark:bg-[#1a1336] border-slate-100 dark:border-purple-900/30 hover:border-amber-300 dark:hover:border-amber-700/60'
                    }`}
                  >
                    {/* Top Row: Concepto + Tarjeta + Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                            {item.tx.concepto}
                          </h4>
                          {isEnding && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase flex items-center gap-1 shadow-2xs animate-pulse">
                              <span>🏁</span>
                              <span>¡Termina este mes!</span>
                            </span>
                          )}
                          {isComplete && !isEnding && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-purple-950 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase">
                              Completada
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-purple-950 text-slate-700 dark:text-slate-300 font-semibold">
                            💳 {item.tx.tarjetaNombre || 'Tarjeta de Crédito'}
                          </span>
                          <span>•</span>
                          <span>
                            {item.tx.tipo === 'individual'
                              ? `Pagado por ${item.tx.pagadoPor === 'user1' ? profile.user1Name : profile.user2Name}`
                              : 'Gasto compartido (50/50)'}
                          </span>
                        </div>
                      </div>

                      {/* Monto de la cuota */}
                      <div className="text-right shrink-0">
                        <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 block">
                          {formatCurrency(item.cuotaMonto, currency)}
                          <span className="text-[10px] font-bold text-slate-400 block">/ mes</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Installments */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span>Cuota {item.cuotaActual} de {item.totalCuotas}</span>
                          {item.remainingCuotas > 0 ? (
                            <span className="text-slate-400 font-normal">
                              ({item.remainingCuotas} {item.remainingCuotas === 1 ? 'restante' : 'restantes'})
                            </span>
                          ) : (
                            <span className="text-emerald-500 font-bold">¡Totalmente pagado!</span>
                          )}
                        </span>
                        <span>{item.progressPct}% pagado</span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-purple-950/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isEnding
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : isComplete
                              ? 'bg-slate-400'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                          style={{ width: `${item.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom stats breakdown */}
                    <div className="pt-2 border-t border-slate-100 dark:border-purple-900/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div>
                        Total compra: <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.tx.monto, currency)}</span>
                        {item.remainingAmount > 0 && (
                          <span className="ml-2">
                            · Saldo pendiente: <span className="font-bold text-rose-500 dark:text-rose-400">{formatCurrency(item.remainingAmount, currency)}</span>
                          </span>
                        )}
                      </div>

                      {item.details.finalDueDate && (
                        <div className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {isEnding ? '¡Finaliza este mes!' : `Finaliza en ${formatDateEs(item.details.finalDueDate)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-500 mx-auto flex items-center justify-center text-xl mb-3">
                💳
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                No se encontraron compras en cuotas
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No hay compras que coincidan con el filtro seleccionado.
              </p>
              {activeFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-purple-950 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Ver todas las compras
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#15102d]">
          {onNavigateTab ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateTab('installments');
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
            >
              <span>Ver panel completo de Tarjetas y Cuotas</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-purple-950 hover:bg-slate-300 dark:hover:bg-purple-900 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
