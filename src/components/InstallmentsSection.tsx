import React, { useState, useMemo, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Edit3, 
  Trash2, 
  Check, 
  RotateCcw, 
  Users, 
  User, 
  Sparkles,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpRight,
  Filter,
  CreditCard as CardIcon,
  History,
  Hourglass,
  CalendarDays,
  Pin
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { CoupleProfile, Transaction } from '../types';
import { formatCurrency, formatDateEs } from '../utils/formatters';
import { 
  getInstallmentPlanDetails, 
  getMonthlyInstallmentsOverview, 
  MonthInstallmentSummary 
} from '../utils/installmentCalculations';

interface InstallmentsSectionProps {
  transactions: Transaction[];
  profile: CoupleProfile;
  onOpenNewInstallmentModal: () => void;
  onOpenPriorInstallmentsModal?: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateInstallmentProgress: (txId: string, delta: number) => void;
  onCompleteInstallment: (txId: string) => void;
}

export const InstallmentsSection: React.FC<InstallmentsSectionProps> = ({
  transactions,
  profile,
  onOpenNewInstallmentModal,
  onOpenPriorInstallmentsModal,
  onEditTransaction,
  onDeleteTransaction,
  onUpdateInstallmentProgress,
  onCompleteInstallment,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [filterCard, setFilterCard] = useState<string>('ALL');
  const [filterPerson, setFilterPerson] = useState<string>('ALL');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('');
  const [expandedScheduleTxId, setExpandedScheduleTxId] = useState<string | null>(null);

  // Month pinning state for Installments View
  const [isMonthPinned, setIsMonthPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gastoar_is_installments_pinned') === 'true';
    } catch {
      return false;
    }
  });

  // Restore pinned month on mount
  useEffect(() => {
    try {
      if (localStorage.getItem('gastoar_is_installments_pinned') === 'true') {
        const savedMonth = localStorage.getItem('gastoar_pinned_installments_month');
        if (savedMonth) {
          setSelectedMonthKey(savedMonth);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const togglePinMonth = (newVal?: boolean) => {
    const targetVal = typeof newVal === 'boolean' ? newVal : !isMonthPinned;
    setIsMonthPinned(targetVal);
    try {
      localStorage.setItem('gastoar_is_installments_pinned', String(targetVal));
      if (targetVal) {
        if (selectedMonthKey) {
          localStorage.setItem('gastoar_pinned_installments_month', selectedMonthKey);
        }
      } else {
        localStorage.removeItem('gastoar_pinned_installments_month');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isMonthPinned && selectedMonthKey) {
      try {
        localStorage.setItem('gastoar_pinned_installments_month', selectedMonthKey);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isMonthPinned, selectedMonthKey]);

  const isUser1 = profile.currentUser === 'user1';
  const currency = profile.currency || 'ARS';

  // Helper for bank / card visual badges
  const getCardBadgeStyle = (cardName: string) => {
    const c = cardName.toLowerCase();
    if (c.includes('naranja')) {
      return 'bg-orange-100 text-orange-800 border-orange-300 font-bold';
    }
    if (c.includes('mercado pago')) {
      return 'bg-sky-100 text-sky-800 border-sky-300 font-bold';
    }
    if (c.includes('santander')) {
      return 'bg-red-50 text-red-700 border-red-200 font-semibold';
    }
    if (c.includes('bbva')) {
      return 'bg-blue-50 text-blue-800 border-blue-200 font-semibold';
    }
    if (c.includes('galicia')) {
      return 'bg-amber-50 text-amber-900 border-amber-300 font-semibold';
    }
    if (c.includes('nación') || c.includes('nacion') || c.includes('bna')) {
      return 'bg-blue-900/10 text-blue-950 border-blue-300 font-semibold';
    }
    if (c.includes('provincia') || c.includes('bapro')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
    }
    if (c.includes('macro')) {
      return 'bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold';
    }
    if (c.includes('ualá') || c.includes('uala')) {
      return 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
    }
    if (c.includes('lemon')) {
      return 'bg-lime-100 text-lime-900 border-lime-300 font-semibold';
    }
    if (c.includes('brubank')) {
      return 'bg-purple-50 text-purple-800 border-purple-200 font-semibold';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
  };

  // Filter transactions that have installments (either esCuotas is true or cuotasTotal > 1 or payment method is Crédito with cuotasTotal)
  const installmentTxs = useMemo(() => {
    return transactions.filter(tx => 
      Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1))
    );
  }, [transactions]);

  // Overall metrics calculation
  const metrics = useMemo(() => {
    let totalCommitted = 0; // Total purchase cost in installments
    let totalPaidSoFar = 0; // Amount paid so far across installments
    let totalPending = 0;   // Remaining amount left to pay
    let monthlyThisMonth = 0; // Monthly quota load for current month
    let activePlansCount = 0;
    let completedPlansCount = 0;

    let user1MonthlyLoad = 0;
    let user2MonthlyLoad = 0;

    installmentTxs.forEach(tx => {
      const totalCuotas = tx.cuotasTotal || 1;
      const currentCuota = tx.cuotaActual || 1;
      const montoTotal = tx.monto;
      const cuotaMonto = tx.montoCuota || (montoTotal / totalCuotas);

      totalCommitted += montoTotal;

      const paidCuotas = Math.min(totalCuotas, Math.max(0, currentCuota));
      const paid = paidCuotas * cuotaMonto;
      const remaining = Math.max(0, (totalCuotas - paidCuotas) * cuotaMonto);

      totalPaidSoFar += paid;
      totalPending += remaining;

      const isCompleted = paidCuotas >= totalCuotas;
      if (isCompleted) {
        completedPlansCount++;
      } else {
        activePlansCount++;
        monthlyThisMonth += cuotaMonto;

        // Calculate breakdown for user1 vs user2 this month
        if (tx.tipo === 'individual') {
          if (tx.pagadoPor === 'user1') user1MonthlyLoad += cuotaMonto;
          else user2MonthlyLoad += cuotaMonto;
        } else {
          // Shared expense
          let p1 = 50;
          let p2 = 50;
          if (tx.splitType === '60_40') { p1 = 60; p2 = 40; }
          else if (tx.splitType === '70_30') { p1 = 70; p2 = 30; }
          else if (tx.splitType === '100_user1') { p1 = 100; p2 = 0; }
          else if (tx.splitType === '100_user2') { p1 = 0; p2 = 100; }
          else if (tx.splitType === 'custom_percent') {
            p1 = tx.user1Percent ?? 50;
            p2 = tx.user2Percent ?? 50;
          }
          user1MonthlyLoad += (cuotaMonto * p1) / 100;
          user2MonthlyLoad += (cuotaMonto * p2) / 100;
        }
      }
    });

    return {
      totalCommitted,
      totalPaidSoFar,
      totalPending,
      monthlyThisMonth,
      activePlansCount,
      completedPlansCount,
      user1MonthlyLoad,
      user2MonthlyLoad,
    };
  }, [installmentTxs]);

  // Unique Cards List
  const cardList = useMemo(() => {
    const set = new Set<string>();
    installmentTxs.forEach(tx => {
      if (tx.tarjetaNombre) set.add(tx.tarjetaNombre);
    });
    return Array.from(set);
  }, [installmentTxs]);

  // Cards Breakdown
  const cardsSummary = useMemo(() => {
    const map: { [card: string]: { count: number; total: number; monthly: number; pending: number } } = {};
    installmentTxs.forEach(tx => {
      const card = tx.tarjetaNombre || 'Tarjeta Principal';
      const totalCuotas = tx.cuotasTotal || 1;
      const currentCuota = tx.cuotaActual || 1;
      const montoTotal = tx.monto;
      const cuotaMonto = tx.montoCuota || (montoTotal / totalCuotas);
      const isCompleted = currentCuota >= totalCuotas;
      const pending = isCompleted ? 0 : (totalCuotas - currentCuota) * cuotaMonto;

      if (!map[card]) {
        map[card] = { count: 0, total: 0, monthly: 0, pending: 0 };
      }
      map[card].count++;
      map[card].total += montoTotal;
      if (!isCompleted) {
        map[card].monthly += cuotaMonto;
        map[card].pending += pending;
      }
    });
    return map;
  }, [installmentTxs]);

  // Full Monthly Installments Overview (Schedule, Totals and Items)
  const monthlyOverviewList = useMemo(() => {
    return getMonthlyInstallmentsOverview(transactions, profile, 9);
  }, [transactions, profile]);

  // Active selected month summary
  const activeMonthSummary = useMemo(() => {
    if (!monthlyOverviewList.length) return null;
    if (!selectedMonthKey) return monthlyOverviewList[0];
    return monthlyOverviewList.find(m => m.monthKey === selectedMonthKey) || monthlyOverviewList[0];
  }, [monthlyOverviewList, selectedMonthKey]);

  // Monthly Projection chart formatted data
  const monthlyProjectionData = useMemo(() => {
    return monthlyOverviewList.map(item => ({
      monthLabel: item.monthLabel,
      mesKey: item.monthKey,
      total: item.totalAmount,
      [profile.user1Name]: Math.round(item.user1Amount),
      [profile.user2Name]: Math.round(item.user2Amount),
    }));
  }, [monthlyOverviewList, profile]);

  // Filtered List of Installments
  const filteredInstallmentTxs = useMemo(() => {
    return installmentTxs.filter(tx => {
      const totalCuotas = tx.cuotasTotal || 1;
      const currentCuota = tx.cuotaActual || 1;
      const isCompleted = currentCuota >= totalCuotas;

      if (filterStatus === 'active' && isCompleted) return false;
      if (filterStatus === 'completed' && !isCompleted) return false;

      if (filterCard !== 'ALL' && tx.tarjetaNombre !== filterCard) return false;

      if (filterPerson === 'user1' && tx.pagadoPor !== 'user1') return false;
      if (filterPerson === 'user2' && tx.pagadoPor !== 'user2') return false;

      return true;
    });
  }, [installmentTxs, filterStatus, filterCard, filterPerson]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Add */}
      <div className="bg-gradient-to-br from-[#2E0854] via-[#3B0764] to-[#7928CA] rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-purple-900/50 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F95420]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#7928CA]/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-purple-100 rounded-full text-xs font-bold border border-white/15 backdrop-blur-xs">
              <CreditCard className="w-3.5 h-3.5 text-[#F95420]" />
              <span>Gestión Financiera de Tarjetas & Cuotas</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Balance de Gastos en Cuotas
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-medium">
              Controla las compras financiadas con tarjeta de crédito, visualiza el compromiso mensual de cada uno y proyecta tus finanzas futuras sin sorpresas.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenPriorInstallmentsModal && (
              <button
                onClick={onOpenPriorInstallmentsModal}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                title="Cargar consumos o deudas en cuotas que compraste antes de usar la app"
              >
                <History className="w-4 h-4 text-purple-200" />
                <span>Cargar Cuotas Anteriores</span>
              </button>
            )}

            <button
              onClick={onOpenNewInstallmentModal}
              className="px-4 py-2.5 bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] active:scale-95 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Compra en Cuotas</span>
            </button>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <p className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">Total Financiado</p>
            <p className="text-lg sm:text-xl font-black text-white mt-1">
              {formatCurrency(metrics.totalCommitted, currency)}
            </p>
            <p className="text-[10px] text-purple-200 mt-0.5 font-medium">En {installmentTxs.length} compras en cuotas</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <p className="text-[11px] font-bold text-orange-200 uppercase tracking-wider">Saldo por Pagar</p>
            <p className="text-lg sm:text-xl font-black text-orange-300 mt-1">
              {formatCurrency(metrics.totalPending, currency)}
            </p>
            <p className="text-[10px] text-purple-200 mt-0.5 font-medium">Deuda futura restante</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Cuota Este Mes</p>
            <p className="text-lg sm:text-xl font-black text-emerald-300 mt-1">
              {formatCurrency(metrics.monthlyThisMonth, currency)}
            </p>
            <p className="text-[10px] text-purple-200 mt-0.5 font-medium">Carga en resumen actual</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <p className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">Planes Activos</p>
            <p className="text-lg sm:text-xl font-black text-white mt-1">
              {metrics.activePlansCount}{' '}
              <span className="text-xs font-normal text-purple-200">activos</span>
            </p>
            <p className="text-[10px] text-purple-200 mt-0.5 font-medium">{metrics.completedPlansCount} finalizados</p>
          </div>
        </div>
      </div>

      {/* Couple Monthly Responsibility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User 1 Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center font-extrabold text-[#7928CA] text-sm">
              {profile.user1Name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-purple-900/60 font-bold uppercase tracking-wider">Compromiso en Cuotas</p>
              <h4 className="font-extrabold text-[#2E0854] text-base">{profile.user1Name}</h4>
              <p className="text-[11px] text-slate-500">Individuales + parte proporcional</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400">Cuota mensual:</span>
            <p className="text-lg sm:text-xl font-black text-[#7928CA]">
              {formatCurrency(metrics.user1MonthlyLoad, currency)}
            </p>
          </div>
        </div>

        {/* User 2 Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center font-extrabold text-[#F95420] text-sm">
              {profile.user2Name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-purple-900/60 font-bold uppercase tracking-wider">Compromiso en Cuotas</p>
              <h4 className="font-extrabold text-[#2E0854] text-base">{profile.user2Name}</h4>
              <p className="text-[11px] text-slate-500">Individuales + parte proporcional</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400">Cuota mensual:</span>
            <p className="text-lg sm:text-xl font-black text-[#F95420]">
              {formatCurrency(metrics.user2MonthlyLoad, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Projection Timeline Chart */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-[#2E0854] text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#7928CA]" />
              <span>Proyección de Cuotas por Mes</span>
            </h3>
            <p className="text-xs text-slate-500">
              Carga económica proyectada para los próximos {monthlyProjectionData.length} meses según las cuotas pendientes
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-[#7928CA]">
              <span className="w-3 h-3 rounded-full bg-[#7928CA]" />
              <span>{profile.user1Name}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#F95420]">
              <span className="w-3 h-3 rounded-full bg-[#F95420]" />
              <span>{profile.user2Name}</span>
            </span>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyProjectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5efff" />
              <XAxis 
                dataKey="monthLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                formatter={(val: any, name: any) => [formatCurrency(Number(val), currency), name]}
                labelStyle={{ fontWeight: 700, color: '#2E0854', marginBottom: '4px' }}
                contentStyle={{ borderRadius: '1rem', border: '1px solid #ede4f9', boxShadow: '0 10px 15px -3px rgba(121, 40, 202, 0.08)' }}
              />
              <Bar 
                dataKey={profile.user1Name} 
                stackId="a" 
                fill="#7928CA" 
                radius={[0, 0, 4, 4]} 
              />
              <Bar 
                dataKey={profile.user2Name} 
                stackId="a" 
                fill="#F95420" 
                radius={[6, 6, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NEW: Cronograma y Detalle Interactivo Mes a Mes */}
      {monthlyOverviewList.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-50 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#7928CA]" />
                <h3 className="font-extrabold text-[#2E0854] text-base sm:text-lg">
                  ¿Cuánto hay que pagar por mes de cuotas?
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona un mes para auditar el total exigible, la fecha exacta de vencimiento y el aporte de cada uno
              </p>
            </div>

            {/* Total Indicator & Pin for selected month */}
            <div className="flex items-center gap-2 flex-wrap">
              {activeMonthSummary && (
                <div className="bg-purple-50/80 border border-purple-100 px-4 py-2 rounded-2xl flex items-center gap-3">
                  <span className="text-xs text-[#2E0854] font-bold">Total a pagar:</span>
                  <span className="text-base sm:text-lg font-black text-[#7928CA]">
                    {formatCurrency(activeMonthSummary.totalAmount, currency)}
                  </span>
                </div>
              )}

              {/* Pin month toggle */}
              <label 
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border cursor-pointer select-none transition-all text-xs font-bold ${
                  isMonthPinned
                    ? 'bg-[#7928CA] text-white border-[#7928CA] shadow-xs'
                    : 'bg-purple-50/40 border-purple-100 text-[#2E0854] hover:bg-purple-50'
                }`}
                title="Fijar este mes mientras la casilla esté tildada"
              >
                <input
                  type="checkbox"
                  checked={isMonthPinned}
                  onChange={(e) => togglePinMonth(e.target.checked)}
                  className="sr-only"
                />
                <Pin className={`w-3.5 h-3.5 ${isMonthPinned ? 'fill-white rotate-45' : 'text-[#7928CA]'}`} />
                <span>{isMonthPinned ? 'Mes Fijado' : 'Fijar Mes'}</span>
                {isMonthPinned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </label>
            </div>
          </div>

          {/* Month Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {monthlyOverviewList.map((m, idx) => {
              const isSelected = activeMonthSummary?.monthKey === m.monthKey;
              const isFirst = idx === 0;
              return (
                <button
                  key={m.monthKey}
                  type="button"
                  onClick={() => setSelectedMonthKey(m.monthKey)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex flex-col items-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#7928CA] border-[#7928CA] text-white shadow-md shadow-purple-600/20'
                      : 'bg-purple-50/30 border-purple-100 text-[#2E0854] hover:bg-purple-50'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span>{m.monthLabel}</span>
                    {isFirst && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-[#7928CA] font-bold'}`}>
                        Actual
                      </span>
                    )}
                  </span>
                  <span className={`text-[11px] font-black ${isSelected ? 'text-purple-100' : 'text-[#2E0854]'}`}>
                    {formatCurrency(m.totalAmount, currency)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Month Details Container */}
          {activeMonthSummary && (
            <div className="space-y-4 pt-1">
              
              {/* Responsibility split cards for this selected month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-purple-50/30 border border-purple-100/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7928CA] flex items-center justify-center font-extrabold text-xs">
                      {profile.user1Name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-purple-900/60 block uppercase">Paga {profile.user1Name}</span>
                      <span className="text-xs font-bold text-[#2E0854]">
                        {activeMonthSummary.monthFullLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm sm:text-base font-black text-[#7928CA]">
                    {formatCurrency(activeMonthSummary.user1Amount, currency)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-orange-50/30 border border-orange-100/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F95420] flex items-center justify-center font-extrabold text-xs">
                      {profile.user2Name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-orange-900/60 block uppercase">Paga {profile.user2Name}</span>
                      <span className="text-xs font-bold text-[#2E0854]">
                        {activeMonthSummary.monthFullLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm sm:text-base font-black text-[#F95420]">
                    {formatCurrency(activeMonthSummary.user2Amount, currency)}
                  </span>
                </div>
              </div>

              {/* List of cuotas due in this specific month */}
              {activeMonthSummary.items.length > 0 ? (
                <div className="border border-purple-100/80 rounded-2xl overflow-hidden">
                  <div className="bg-purple-50/50 px-4 py-2.5 text-xs font-bold text-[#2E0854] uppercase tracking-wider flex items-center justify-between border-b border-purple-100">
                    <span>Vencimientos de {activeMonthSummary.monthFullLabel} ({activeMonthSummary.items.length} {activeMonthSummary.items.length === 1 ? 'cuota' : 'cuotas'})</span>
                    <span>Importe</span>
                  </div>

                  <div className="divide-y divide-purple-50">
                    {activeMonthSummary.items.map((item, i) => (
                      <div key={`${item.txId}-${item.cuotaNum}-${i}`} className="p-3.5 sm:p-4 hover:bg-purple-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-[#2E0854] text-sm">{item.concepto}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-[#7928CA] border border-purple-200">
                              Cuota {item.cuotaNum} de {item.cuotasTotal}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] border ${getCardBadgeStyle(item.tarjetaNombre)}`}>
                              💳 {item.tarjetaNombre}
                            </span>
                            {item.isPaid ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ Pagada
                              </span>
                            ) : item.isNext ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-800 border border-orange-300">
                                ⚡ Próximo vencimiento
                              </span>
                            ) : null}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-purple-400" />
                              <span>Fecha estimada de pago: <strong>{item.dueDateFormatted}</strong></span>
                            </span>
                            <span>•</span>
                            <span>Titular: <strong>{item.pagadoPor === 'user1' ? profile.user1Name : profile.user2Name}</strong></span>
                            <span>({item.tipo === 'pareja' ? 'Compartido' : 'Individual'})</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base sm:text-lg font-black text-[#7928CA]">
                            {formatCurrency(item.amount, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-purple-50/30 rounded-2xl border border-purple-100">
                  <p className="text-xs font-semibold text-slate-500">No hay cuotas programadas para {activeMonthSummary.monthFullLabel}</p>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* Breakdown by Cards / Banks */}
      {cardList.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#2E0854] text-base flex items-center gap-2">
                <CardIcon className="w-5 h-5 text-[#7928CA]" />
                <span>Desglose por Tarjeta de Crédito</span>
              </h3>
              <p className="text-xs text-slate-500">Total comprometido y vencimiento mensual por plástico</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(Object.entries(cardsSummary) as [string, { count: number; total: number; monthly: number; pending: number }][]).map(([cardName, data]) => (
              <div 
                key={cardName}
                className="p-4 rounded-2xl border border-purple-100/70 bg-gradient-to-br from-purple-50/20 to-white hover:border-purple-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2E0854] to-[#7928CA] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      💳
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-[#2E0854]">{cardName}</h4>
                      <span className="text-[10px] text-slate-400">{data.count} {data.count === 1 ? 'compra' : 'compras'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-50 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-purple-900/60 font-semibold block">Cuota mensual:</span>
                    <span className="font-black text-[#7928CA]">{formatCurrency(data.monthly, currency)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-purple-900/60 font-semibold block">Resta pagar:</span>
                    <span className="font-black text-[#F95420]">{formatCurrency(data.pending, currency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Installment Purchases List */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] border border-purple-100/80 overflow-hidden space-y-4">
        {/* Header & Filters */}
        <div className="p-4 sm:p-5 border-b border-purple-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-[#2E0854] text-base sm:text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#7928CA]" />
              <span>Listado de Compras en Cuotas</span>
            </h3>
            <p className="text-xs text-slate-500">
              Administra el progreso de cada plan de cuotas y márcalas como pagadas
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="bg-purple-50/50 p-1 rounded-xl flex items-center text-xs font-bold border border-purple-100">
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'active' ? 'bg-[#7928CA] text-white shadow-xs' : 'text-slate-600 hover:text-[#2E0854]'
                }`}
              >
                Activos ({metrics.activePlansCount})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'completed' ? 'bg-[#7928CA] text-white shadow-xs' : 'text-slate-600 hover:text-[#2E0854]'
                }`}
              >
                Finalizados ({metrics.completedPlansCount})
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'all' ? 'bg-[#7928CA] text-white shadow-xs' : 'text-slate-600 hover:text-[#2E0854]'
                }`}
              >
                Todos ({installmentTxs.length})
              </button>
            </div>

            {/* Card selector filter if multiple */}
            {cardList.length > 1 && (
              <select
                value={filterCard}
                onChange={(e) => setFilterCard(e.target.value)}
                className="px-2.5 py-1.5 bg-purple-50/40 border border-purple-100 rounded-xl text-xs font-bold text-[#2E0854] focus:outline-none"
              >
                <option value="ALL">Todas las tarjetas</option>
                {cardList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Person selector filter */}
            <select
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              className="px-2.5 py-1.5 bg-purple-50/40 border border-purple-100 rounded-xl text-xs font-bold text-[#2E0854] focus:outline-none"
            >
              <option value="ALL">Todos los titulares</option>
              <option value="user1">{profile.user1Name}</option>
              <option value="user2">{profile.user2Name}</option>
            </select>
          </div>
        </div>

        {/* Installment Items Cards */}
        <div className="p-4 sm:p-6 space-y-4">
          {filteredInstallmentTxs.length > 0 ? (
            filteredInstallmentTxs.map((tx) => {
              const planDetails = getInstallmentPlanDetails(tx);
              const totalCuotas = tx.cuotasTotal || 1;
              const currentCuota = tx.cuotaActual || 1;
              const cuotaMonto = tx.montoCuota || (tx.monto / totalCuotas);
              const isCompleted = planDetails.isCompleted;
              const progressPercent = planDetails.progressPct;
              const remainingCuotas = planDetails.remainingCuotas;
              const remainingAmount = planDetails.remainingAmount;
              const payerName = tx.pagadoPor === 'user1' ? profile.user1Name : profile.user2Name;
              const isScheduleOpen = expandedScheduleTxId === tx.id;

              return (
                <div
                  key={tx.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCompleted 
                      ? 'bg-purple-50/20 border-purple-100/60 opacity-80' 
                      : 'bg-white border-purple-100/80 hover:border-purple-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Concept & Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-[#2E0854] text-sm sm:text-base">
                          {tx.concepto}
                        </span>
                        
                        {/* Status Badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Finalizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#7928CA] border border-purple-200">
                            <Clock className="w-3 h-3" /> En curso
                          </span>
                        )}

                        {/* Remaining Months Pill */}
                        {!isCompleted && remainingCuotas > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-800 border border-orange-300/80">
                            <Hourglass className="w-3 h-3 text-[#F95420]" />
                            {remainingCuotas === 1 ? 'Falta 1 mes' : `Faltan ${remainingCuotas} meses`}
                          </span>
                        )}

                        {/* Card Name */}
                        {tx.tarjetaNombre && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] border flex items-center gap-1 ${getCardBadgeStyle(tx.tarjetaNombre)}`}>
                            💳 {tx.tarjetaNombre}
                          </span>
                        )}

                        {/* Type Badge */}
                        {tx.tipo === 'pareja' ? (
                          <span className="px-2 py-0.5 bg-orange-50 text-[#F95420] border border-orange-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <Users className="w-3 h-3" /> Pareja ({payerName})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-purple-50 text-[#7928CA] border border-purple-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <User className="w-3 h-3" /> {payerName}
                          </span>
                        )}
                      </div>

                      {tx.descripcion && (
                        <p className="text-xs text-slate-500">{tx.descripcion}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                        <span>Categoría: <strong className="text-[#2E0854]">{tx.categoria}</strong> › {tx.subcategoria}</span>
                        <span>•</span>
                        <span>Fecha de compra: {formatDateEs(tx.fecha)}</span>
                      </div>
                    </div>

                    {/* Financial Figures */}
                    <div className="flex items-center gap-6 shrink-0 text-right">
                      <div>
                        <span className="text-[10px] text-purple-900/60 font-bold block uppercase">Cuota Mensual</span>
                        <span className="text-base sm:text-lg font-black text-[#7928CA]">
                          {formatCurrency(cuotaMonto, currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/ mes</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-purple-900/60 font-bold block uppercase">Total Plan</span>
                        <span className="text-base sm:text-lg font-black text-[#2E0854]">
                          {formatCurrency(tx.monto, currency)}
                        </span>
                        <span className="text-[10px] text-[#F95420] font-bold block">
                          Debés: {formatCurrency(remainingAmount, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates & Payment Schedule Highlights */}
                  <div className="mt-3.5 p-3 bg-purple-50/20 border border-purple-100 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#7928CA] shrink-0" />
                      <div>
                        <span className="text-[10px] text-purple-900/60 font-bold uppercase block">1ª Cuota (Inicio)</span>
                        <span className="font-extrabold text-[#2E0854]">{planDetails.firstDueDateFormatted || 'No definida'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#F95420] shrink-0" />
                      <div>
                        <span className="text-[10px] text-orange-800 font-bold uppercase block">Próximo Vencimiento</span>
                        <span className="font-extrabold text-orange-950">
                          {isCompleted ? '✓ Todo pagado' : (planDetails.nextDueDateFormatted || 'Inmediato')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:text-right sm:justify-end">
                      <div>
                        <span className="text-[10px] text-purple-900/60 font-bold uppercase block">Finalización</span>
                        <span className="font-extrabold text-[#2E0854]">{planDetails.finalDueDateFormatted || 'No definida'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Interactive Step Controls */}
                  <div className="mt-3 pt-3 border-t border-purple-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 space-y-1.5 max-w-md">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#2E0854]">
                          Cuota {currentCuota} de {totalCuotas} ({progressPercent}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedScheduleTxId(isScheduleOpen ? null : tx.id)}
                          className="text-[11px] font-extrabold text-[#7928CA] hover:text-[#2E0854] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{isScheduleOpen ? 'Ocultar cronograma' : 'Ver cronograma de pagos'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isScheduleOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <div className="w-full h-2.5 bg-purple-50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#7928CA] to-[#9333EA]'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Interactive Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => onUpdateInstallmentProgress(tx.id, -1)}
                        disabled={currentCuota <= 1}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-purple-50/50 hover:bg-purple-100 disabled:opacity-30 rounded-xl transition-all cursor-pointer"
                        title="Retroceder una cuota"
                      >
                        -1 Cuota
                      </button>

                      <button
                        onClick={() => onUpdateInstallmentProgress(tx.id, 1)}
                        disabled={currentCuota >= totalCuotas}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-[#7928CA] hover:bg-[#6820b3] disabled:opacity-30 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="Avanzar una cuota pagada"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+1 Cuota Pagada</span>
                      </button>

                      {!isCompleted && (
                        <button
                          onClick={() => onCompleteInstallment(tx.id)}
                          className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer"
                          title="Marcar todas las cuotas como pagadas"
                        >
                          Liquidar Todo
                        </button>
                      )}

                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 text-slate-400 hover:text-[#7928CA] hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                        title="Editar plan de cuotas"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Schedule Breakdown Table */}
                  {isScheduleOpen && (
                    <div className="mt-4 pt-4 border-t border-purple-50 animate-in fade-in duration-200">
                      <h5 className="text-xs font-extrabold text-[#2E0854] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-[#7928CA]" />
                        <span>Cronograma Detallado ({totalCuotas} cuotas)</span>
                      </h5>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {planDetails.schedule.map((sch) => (
                          <div 
                            key={sch.cuotaNum}
                            className={`p-2.5 rounded-xl border text-xs transition-all ${
                              sch.isPaid
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                : sch.isNext
                                ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-300/50 text-orange-950 shadow-xs'
                                : 'bg-purple-50/20 border-purple-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>Cuota {sch.cuotaNum}/{sch.cuotasTotal}</span>
                              {sch.isPaid ? (
                                <span className="text-[10px] text-emerald-700 font-extrabold">✓ Pagada</span>
                              ) : sch.isNext ? (
                                <span className="text-[10px] text-orange-800 font-extrabold">⚡ Próxima</span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">Futura</span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500 font-medium">
                              📅 {sch.dueDateFormatted}
                            </div>
                            <div className="mt-1 font-black text-[#7928CA] text-[12px]">
                              {formatCurrency(sch.amount, currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7928CA] flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-[#2E0854] text-sm">No hay compras en cuotas registradas</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Registra compras con tarjeta de crédito en 3, 6, 12 o más cuotas o carga tus deudas previas para hacer seguimiento del compromiso mensual.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {onOpenPriorInstallmentsModal && (
                  <button
                    onClick={onOpenPriorInstallmentsModal}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-[#7928CA] border border-purple-200 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-[#7928CA]" />
                    <span>Cargar cuotas anteriores a la app</span>
                  </button>
                )}
                <button
                  onClick={onOpenNewInstallmentModal}
                  className="px-4 py-2 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva compra en cuotas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
