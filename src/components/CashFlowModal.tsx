import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Info,
  Crown,
  Zap,
  Plus,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Transaction, Vencimiento } from '../types';
import { CashFlowEngine, ScheduledPayment, CashFlowProjection, DayProjection } from '../CashFlowEngine';
import { formatCurrency } from '../utils/formatters';

interface CashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currentBalance: number;
  vencimientos?: Vencimiento[];
  isPro?: boolean;
  onUpgradeToPro?: () => void;
  onNavigateToVencimientos?: () => void;
}

export const CashFlowModal: React.FC<CashFlowModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
  currentBalance = 0,
  vencimientos = [],
  isPro = true,
  onUpgradeToPro,
  onNavigateToVencimientos,
}) => {
  const [daysAhead, setDaysAhead] = useState<number>(30);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'paydays' | 'scheduled'>('all');
  const [customScheduled, setCustomScheduled] = useState<ScheduledPayment[]>([]);
  const [showAddScheduled, setShowAddScheduled] = useState(false);

  // Form for custom scheduled payment
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');
  const [newCategory, setNewCategory] = useState('Servicios');
  const [newEmoji, setNewEmoji] = useState('📅');

  // Convert real vencimientos from the app + user custom scheduled payments
  const allScheduledPayments = useMemo<ScheduledPayment[]>(() => {
    const fromVencimientos = CashFlowEngine.vencimientosToScheduled(
      vencimientos.map(v => ({
        id: v.id,
        icon: v.icon || '📄',
        title: v.title,
        cat: v.cat || 'General',
        amount: v.amount,
        dueDate: v.dueDate,
        isPaid: v.isPaid,
      }))
    );
    return [...fromVencimientos, ...customScheduled];
  }, [vencimientos, customScheduled]);

  // Run CashFlowEngine
  const projection: CashFlowProjection = useMemo(() => {
    return CashFlowEngine.calculate(
      transactions,
      currentBalance,
      allScheduledPayments,
      daysAhead
    );
  }, [transactions, currentBalance, allScheduledPayments, daysAhead]);

  if (!isOpen) return null;

  const handleAddScheduled = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (!newLabel.trim() || isNaN(amt) || amt <= 0 || !newDueDate) return;

    const payment: ScheduledPayment = {
      id: 'sched-' + Date.now(),
      label: newLabel.trim(),
      amount: amt,
      dueDate: newDueDate,
      type: newType,
      category: newCategory,
      isRecurring: false,
      emoji: newEmoji || (newType === 'income' ? '💵' : '💸'),
    };

    setCustomScheduled(prev => [...prev, payment]);
    setNewLabel('');
    setNewAmount('');
    setNewDueDate('');
    setShowAddScheduled(false);
  };

  const filteredDays = projection.days.filter(d => {
    if (activeFilter === 'critical') return d.isCritical || d.balance <= 0;
    if (activeFilter === 'paydays') return d.isPayday;
    if (activeFilter === 'scheduled') return d.scheduledPayments.length > 0;
    return true;
  });

  const ars = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#140728] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[94vh] animate-in fade-in zoom-in-95 duration-200 border border-purple-100 dark:border-purple-900/40 text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-4 sm:p-6 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl tracking-tight text-white">
                  Motor de Flujo de Caja (Cash Flow)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-xs flex items-center gap-1">
                  <Crown className="w-3 h-3 text-slate-950 fill-current" />
                  Plan Pro
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Proyección inteligente de liquidez diaria a {daysAhead} días con detección de días críticos y cobros
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-purple-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Non-Pro Gate / Teaser banner if user is not Pro */}
        {!isPro && (
          <div className="p-4 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border-b border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white font-black shadow-xs">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Función Exclusiva Plan Pro & Asistente IA
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Visualizá una simulación previa de tu saldo diario o pasate al Plan Pro con 15 días gratis.
                </p>
              </div>
            </div>
            {onUpgradeToPro && (
              <button
                type="button"
                onClick={onUpgradeToPro}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2E0854] to-[#7928CA] hover:from-[#1F0538] hover:to-[#6820B0] text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
              >
                Probar 15 Días Gratis
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* Controls: Horizon selector & Quick stats */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-purple-950/60 rounded-2xl border border-slate-200/60 dark:border-purple-800/40">
              <span className="text-xs font-bold text-slate-600 dark:text-purple-300 px-2 py-1">
                Horizonte:
              </span>
              {[
                { days: 7, label: '7 Días' },
                { days: 15, label: '15 Días' },
                { days: 30, label: '30 Días' },
              ].map(opt => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setDaysAhead(opt.days)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    daysAhead === opt.days
                      ? 'bg-[#2E0854] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-purple-900/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddScheduled(prev => !prev)}
                className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 text-purple-900 dark:text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200 dark:border-purple-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simular Pago / Ingreso</span>
              </button>

              {onNavigateToVencimientos && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToVencimientos();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-purple-950/40 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Ver Vencimientos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Simulation Form Drawer */}
          {showAddScheduled && (
            <form
              onSubmit={handleAddScheduled}
              className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <span>Simular Movimiento Futuro</span>
                  <span className="text-[10px] font-normal text-purple-600 dark:text-purple-400">
                    (No modifica tus registros reales)
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddScheduled(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    Concepto
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Bono extra, Compra super..."
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#120524] text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej: 45000"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#120524] text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    Fecha programada
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#120524] text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    Tipo
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewType('expense')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        newType === 'expense'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-purple-900/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-purple-800'
                      }`}
                    >
                      Gasto
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('income')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        newType === 'income'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-purple-900/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-purple-800'
                      }`}
                    >
                      Ingreso
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs shadow-xs hover:from-purple-800 hover:to-indigo-800 cursor-pointer"
                >
                  Agregar a la Proyección
                </button>
              </div>
            </form>
          )}

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Current Balance */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">
                  Saldo Actual
                </span>
                <Wallet className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className={`text-lg font-black tracking-tight ${currentBalance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {ars(currentBalance)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Disponible al día de hoy
              </p>
            </div>

            {/* In 7 Days */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">
                  Saldo en 7 Días
                </span>
                {projection.projectedBalanceIn7Days >= currentBalance ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
              <p className={`text-lg font-black tracking-tight ${projection.projectedBalanceIn7Days < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {ars(projection.projectedBalanceIn7Days)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Delta: {projection.projectedBalanceIn7Days >= currentBalance ? '+' : ''}{ars(projection.projectedBalanceIn7Days - currentBalance)}
              </p>
            </div>

            {/* In 15 Days */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">
                  Saldo en 15 Días
                </span>
                {projection.projectedBalanceIn15Days >= currentBalance ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
              <p className={`text-lg font-black tracking-tight ${projection.projectedBalanceIn15Days < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {ars(projection.projectedBalanceIn15Days)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mitad del mes proyectada
              </p>
            </div>

            {/* In 30 Days */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">
                  Saldo en 30 Días
                </span>
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <p className={`text-lg font-black tracking-tight ${projection.projectedBalanceIn30Days < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {ars(projection.projectedBalanceIn30Days)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Cierre proyectado
              </p>
            </div>
          </div>

          {/* Secondary stats bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#180a32] border border-slate-200/80 dark:border-purple-800/40 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black">
                📉
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold">
                  Gasto Diario Estimado:
                </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">
                  {ars(projection.averageDailyExpense)} / día
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black">
                💰
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold">
                  Próximo Día de Cobro:
                </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">
                  {projection.nextPayday ? projection.nextPayday : 'Detectado según historial'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${
                projection.criticalDays.length > 0
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}>
                {projection.criticalDays.length > 0 ? '⚠️' : '🛡️'}
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold">
                  Estado de Liquidez:
                </span>
                <span className={`font-extrabold ${projection.criticalDays.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {projection.criticalDays.length > 0
                    ? `${projection.criticalDays.length} días de saldo crítico`
                    : 'Margen seguro de liquidez'}
                </span>
              </div>
            </div>
          </div>

          {/* AI / Smart Cash Flow Alerts */}
          {projection.alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-purple-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Alertas Inteligentes de Flujo de Caja</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {projection.alerts.map((alert, idx) => {
                  const isHigh = alert.severity === 'high';
                  const isMed = alert.severity === 'medium';
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
                        isHigh
                          ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100'
                          : isMed
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-100'
                            : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-100'
                      }`}
                    >
                      <div className="shrink-0 pt-0.5">
                        {isHigh ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        ) : isMed ? (
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold leading-snug">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day-by-Day Forecast Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-purple-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Evolución Diaria del Saldo ({filteredDays.length} días)</span>
              </h4>

              {/* Filter pills */}
              <div className="flex items-center gap-1">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'critical', label: 'Críticos ⚠️' },
                  { key: 'paydays', label: 'Cobros 💰' },
                  { key: 'scheduled', label: 'Con Pagos 💳' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                      activeFilter === tab.key
                        ? 'bg-[#2E0854] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-purple-950/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Days */}
            <div className="rounded-2xl border border-slate-200 dark:border-purple-800/40 overflow-hidden divide-y divide-slate-100 dark:divide-purple-900/30 max-h-[380px] overflow-y-auto">
              {filteredDays.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay días que coincidan con el filtro seleccionado.
                </div>
              ) : (
                filteredDays.map((d: DayProjection) => {
                  const isNegative = d.balance < 0;
                  return (
                    <div
                      key={d.date}
                      className={`p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 transition-colors ${
                        d.isCritical
                          ? 'bg-rose-50/60 dark:bg-rose-950/20'
                          : d.isPayday
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'hover:bg-slate-50 dark:hover:bg-purple-950/30'
                      }`}
                    >
                      {/* Left: Day & Badges */}
                      <div className="flex items-center gap-2.5 min-w-[140px] sm:min-w-[180px]">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          d.isCritical
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            : d.isPayday
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-purple-50 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
                        }`}>
                          {d.isPayday ? '💰' : d.isCritical ? '⚠️' : '📅'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                            {d.dayLabel}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {d.isPayday && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Cobro
                              </span>
                            )}
                            {d.isCritical && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                Saldo Crítico
                              </span>
                            )}
                            {d.scheduledPayments.length > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                {d.scheduledPayments.length} pago{d.scheduledPayments.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Scheduled Details if any */}
                      <div className="hidden sm:flex flex-1 min-w-0 flex-col gap-0.5">
                        {d.scheduledPayments.map(p => (
                          <div key={p.id} className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 truncate">
                            <span>{p.emoji}</span>
                            <span className="font-semibold truncate">{p.label}</span>
                            <span className={`font-bold ${p.type === 'income' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-200'}`}>
                              ({p.type === 'income' ? '+' : '-'}{ars(p.amount)})
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Right: Net flow + Projected Balance */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] text-slate-400">Flujo:</span>
                          <span className={`text-xs font-extrabold ${d.netFlow >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {d.netFlow >= 0 ? '+' : ''}{ars(d.netFlow)}
                          </span>
                        </div>
                        <p className={`text-sm font-black tracking-tight leading-tight ${
                          isNegative
                            ? 'text-rose-600 dark:text-rose-400'
                            : d.isCritical
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                        }`}>
                          {ars(d.balance)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-[#110524] p-4 border-t border-slate-200 dark:border-purple-900/40 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>
              Proyección calculada a partir de los patrones de gasto de los últimos 60 días y vencimientos agendados.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-purple-900/60 hover:bg-slate-300 dark:hover:bg-purple-800 text-slate-800 dark:text-white font-bold cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
