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
  Pin,
  Bell
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
  onOpenCardAlerts?: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateInstallmentProgress?: (txId: string, delta: number) => void;
  onCompleteInstallment?: (txId: string) => void;
}

const P = "#6F2EC5";
const P_LIGHT = "#F5EFFF";
const P_MID = "#A77BEE";
const P_ORANGE = "#F95420";

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

    (installmentTxs || []).forEach(tx => {
      if (!tx) return;
      const totalCuotas = tx.cuotasTotal || 1;
      const currentCuota = tx.cuotaActual || 1;
      const montoTotal = tx.monto || 0;
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

    const percentPaid = totalCommitted > 0 ? Math.min(100, Math.round((totalPaidSoFar / totalCommitted) * 100)) : 0;

    return {
      totalCommitted,
      totalPaidSoFar,
      totalPending,
      monthlyThisMonth,
      activePlansCount,
      completedPlansCount,
      user1MonthlyLoad,
      user2MonthlyLoad,
      percentPaid,
    };
  }, [installmentTxs]);

  // Unique Cards List
  const cardList = useMemo(() => {
    const set = new Set<string>();
    (installmentTxs || []).forEach(tx => {
      if (tx && tx.tarjetaNombre) set.add(tx.tarjetaNombre);
    });
    return Array.from(set);
  }, [installmentTxs]);

  // Cards Breakdown
  const cardsSummary = useMemo(() => {
    const map: { [card: string]: { count: number; total: number; monthly: number; pending: number } } = {};
    (installmentTxs || []).forEach(tx => {
      if (!tx) return;
      const card = tx.tarjetaNombre || 'Tarjeta Principal';
      const totalCuotas = tx.cuotasTotal || 1;
      const currentCuota = tx.cuotaActual || 1;
      const montoTotal = tx.monto || 0;
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

  // Circular progress math (matching Resumen style)
  const r = 38, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const dash = (metrics.percentPaid / 100) * circ;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16 font-sans">
      
      {/* 1. Header: Section title + Actions (sin el botón de alertas de calendar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <p className="text-sm text-gray-400">Tarjetas & Financiación</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gastos en Cuotas</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenPriorInstallmentsModal && (
            <button
              onClick={onOpenPriorInstallmentsModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-purple-50/50 text-slate-700 hover:text-[#6F2EC5] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="Cargar consumos o deudas en cuotas que compraste antes de usar la app"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Cargar Cuotas Anteriores</span>
            </button>
          )}

          <button
            onClick={onOpenNewInstallmentModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            style={{ backgroundColor: P }}
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Compra en Cuotas</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Balance Card (Estilo Resumen: Saldo por pagar & % Amortizado) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-white">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-2" style={{ color: P }}>Saldo total por pagar</p>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-3xl font-bold font-outfit text-gray-900 tracking-tight leading-none">
                {formatCurrency(metrics.totalPending, currency)}
              </p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: P_LIGHT }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ 
                  width: `${Math.min(100, Math.max(5, metrics.percentPaid))}%`, 
                  background: `linear-gradient(90deg, ${P_MID}, ${P})` 
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Total financiado:{" "}
                <span className="font-semibold text-gray-700">{formatCurrency(metrics.totalCommitted, currency)}</span>
              </span>
              <span>•</span>
              <span>Pagado:{" "}
                <span className="font-semibold text-emerald-600">{formatCurrency(metrics.totalPaidSoFar, currency)}</span>
              </span>
            </div>
          </div>

          {/* Circular Progress Gauge (Igual al de Resumen) */}
          <div className="relative flex-shrink-0" style={{ width: 110, height: 110 }}>
            <svg width="110" height="110" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="installmentCg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={P_MID} />
                  <stop offset="100%" stopColor={P} />
                </linearGradient>
              </defs>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={P_LIGHT} strokeWidth="7" />
              <circle
                cx={cx} cy={cy} r={r} fill="none"
                stroke="url(#installmentCg)" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                transform={`rotate(-90 ${cx} ${cy})`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xl font-bold font-outfit leading-none" style={{ color: P }}>{metrics.percentPaid}%</p>
              <p className="text-[9px] text-gray-400 text-center mt-0.5 leading-tight">del total<br />amortizado</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Stat Cards (Estilo Resumen MetricCards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Cuota Este Mes */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: P_LIGHT }}>
              💳
            </div>
            <p className="text-xs text-gray-500 leading-tight">Cuota de este mes</p>
          </div>
          <p className="text-xl font-bold font-outfit text-gray-900 leading-none mb-0.5">
            {formatCurrency(metrics.monthlyThisMonth, currency)}
          </p>
          <p className="text-xs text-gray-400">Carga en resumen actual</p>
        </div>

        {/* Saldo por Pagar */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: P_LIGHT }}>
              ⏳
            </div>
            <p className="text-xs text-gray-500 leading-tight">Saldo pendiente</p>
          </div>
          <p className="text-xl font-bold font-outfit text-gray-900 leading-none mb-0.5">
            {formatCurrency(metrics.totalPending, currency)}
          </p>
          <p className="text-xs text-gray-400">Deuda futura restante</p>
        </div>

        {/* Total Financiado */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: P_LIGHT }}>
              🏷️
            </div>
            <p className="text-xs text-gray-500 leading-tight">Total financiado</p>
          </div>
          <p className="text-xl font-bold font-outfit text-gray-900 leading-none mb-0.5">
            {formatCurrency(metrics.totalCommitted, currency)}
          </p>
          <p className="text-xs text-gray-400">En {installmentTxs.length} {installmentTxs.length === 1 ? 'compra' : 'compras'}</p>
        </div>

        {/* Planes Activos */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: P_LIGHT }}>
              📊
            </div>
            <p className="text-xs text-gray-500 leading-tight">Planes de cuotas</p>
          </div>
          <p className="text-xl font-bold font-outfit text-gray-900 leading-none mb-0.5">
            {metrics.activePlansCount} <span className="text-xs font-normal text-gray-400">activos</span>
          </p>
          <p className="text-xs text-gray-400">{metrics.completedPlansCount} finalizados</p>
        </div>
      </div>

      {/* 4. Couple Monthly Responsibility Cards (Estilo Resumen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* User 1 Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm" style={{ backgroundColor: P_LIGHT, color: P }}>
              {profile.user1Name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Compromiso en Cuotas</p>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">{profile.user1Name}</h4>
              <p className="text-[11px] text-gray-400">Individuales + proporcional</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-gray-400">Cuota mensual</span>
            <p className="text-lg sm:text-xl font-bold font-outfit" style={{ color: P }}>
              {formatCurrency(metrics.user1MonthlyLoad, currency)}
            </p>
          </div>
        </div>

        {/* User 2 Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F95420] flex items-center justify-center font-bold text-sm">
              {profile.user2Name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Compromiso en Cuotas</p>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">{profile.user2Name}</h4>
              <p className="text-[11px] text-gray-400">Individuales + proporcional</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-gray-400">Cuota mensual</span>
            <p className="text-lg sm:text-xl font-bold font-outfit text-[#F95420]">
              {formatCurrency(metrics.user2MonthlyLoad, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Monthly Projection Timeline Chart (Estilo Resumen) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: P }} />
              <span>Proyección de Cuotas por Mes</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Carga económica estimada para los próximos {monthlyProjectionData.length} meses según las cuotas pendientes
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5" style={{ color: P }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: P }} />
              <span>{profile.user1Name}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#F95420]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F95420]" />
              <span>{profile.user2Name}</span>
            </span>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyProjectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                labelStyle={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}
                contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
              />
              <Bar 
                dataKey={profile.user1Name} 
                stackId="a" 
                fill={P} 
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

      {/* 6. Cronograma y Detalle Interactivo Mes a Mes (Estilo Resumen) */}
      {monthlyOverviewList.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" style={{ color: P }} />
                <h3 className="font-bold text-gray-900 text-base">
                  ¿Cuánto hay que pagar por mes de cuotas?
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Selecciona un mes para auditar el total exigible, la fecha estimada y el aporte de cada uno
              </p>
            </div>

            {/* Total Indicator & Pin for selected month */}
            <div className="flex items-center gap-2 flex-wrap">
              {activeMonthSummary && (
                <div className="px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs border border-purple-100" style={{ backgroundColor: P_LIGHT }}>
                  <span className="text-gray-600 font-medium">Total a pagar:</span>
                  <span className="font-bold font-outfit text-sm" style={{ color: P }}>
                    {formatCurrency(activeMonthSummary.totalAmount, currency)}
                  </span>
                </div>
              )}

              {/* Pin month toggle */}
              <label 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all text-xs font-semibold ${
                  isMonthPinned
                    ? 'bg-[#6F2EC5] text-white border-[#6F2EC5] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Fijar este mes mientras la casilla esté tildada"
              >
                <input
                  type="checkbox"
                  checked={isMonthPinned}
                  onChange={(e) => togglePinMonth(e.target.checked)}
                  className="sr-only"
                />
                <Pin className={`w-3 h-3 ${isMonthPinned ? 'fill-white rotate-45' : 'text-slate-400'}`} />
                <span>{isMonthPinned ? 'Mes Fijado' : 'Fijar Mes'}</span>
                {isMonthPinned && <Check className="w-3 h-3 stroke-[3]" />}
              </label>
            </div>
          </div>

          {/* Month Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {monthlyOverviewList.map((m, idx) => {
              const isSelected = activeMonthSummary?.monthKey === m.monthKey;
              const isFirst = idx === 0;
              return (
                <button
                  key={m.monthKey}
                  type="button"
                  onClick={() => setSelectedMonthKey(m.monthKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex flex-col items-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#6F2EC5] border-[#6F2EC5] text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span>{m.monthLabel}</span>
                    {isFirst && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-[#6F2EC5] font-bold'}`}>
                        Actual
                      </span>
                    )}
                  </span>
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-purple-100' : 'text-slate-800'}`}>
                    {formatCurrency(m.totalAmount, currency)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Month Details Container */}
          {activeMonthSummary && (
            <div className="space-y-3 pt-1">
              
              {/* Responsibility split cards for this selected month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs" style={{ backgroundColor: P_LIGHT, color: P }}>
                      {profile.user1Name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 block uppercase">Paga {profile.user1Name}</span>
                      <span className="text-xs font-bold text-gray-800">
                        {activeMonthSummary.monthFullLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-outfit" style={{ color: P }}>
                    {formatCurrency(activeMonthSummary.user1Amount, currency)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F95420] flex items-center justify-center font-bold text-xs">
                      {profile.user2Name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 block uppercase">Paga {profile.user2Name}</span>
                      <span className="text-xs font-bold text-gray-800">
                        {activeMonthSummary.monthFullLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-outfit text-[#F95420]">
                    {formatCurrency(activeMonthSummary.user2Amount, currency)}
                  </span>
                </div>
              </div>

              {/* List of cuotas due in this specific month */}
              {activeMonthSummary.items.length > 0 ? (
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                    <span>Vencimientos de {activeMonthSummary.monthFullLabel} ({activeMonthSummary.items.length} {activeMonthSummary.items.length === 1 ? 'cuota' : 'cuotas'})</span>
                    <span>Importe</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {activeMonthSummary.items.map((item, i) => (
                      <div key={`${item.txId}-${item.cuotaNum}-${i}`} className="p-3.5 sm:p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{item.concepto}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-[#6F2EC5] border border-purple-100">
                              Cuota {item.cuotaNum} de {item.cuotasTotal}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] border ${getCardBadgeStyle(item.tarjetaNombre)}`}>
                              💳 {item.tarjetaNombre}
                            </span>
                            {item.isPaid ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ Pagada
                              </span>
                            ) : item.isNext ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-300">
                                ⚡ Próximo vencimiento
                              </span>
                            ) : null}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Fecha de pago: <strong className="text-gray-600">{item.dueDateFormatted}</strong></span>
                            </span>
                            <span>•</span>
                            <span>Titular: <strong className="text-gray-600">{item.pagadoPor === 'user1' ? profile.user1Name : profile.user2Name}</strong></span>
                            <span>({item.tipo === 'pareja' ? 'Compartido' : 'Individual'})</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-bold font-outfit" style={{ color: P }}>
                            {formatCurrency(item.amount, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-medium text-gray-400">No hay cuotas programadas para {activeMonthSummary.monthFullLabel}</p>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* 7. Breakdown by Cards / Banks (Estilo Resumen) */}
      {cardList.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <CardIcon className="w-4 h-4" style={{ color: P }} />
                <span>Desglose por Tarjeta de Crédito</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Total comprometido y vencimiento mensual por plástico</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.entries(cardsSummary) as [string, { count: number; total: number; monthly: number; pending: number }][]).map(([cardName, data]) => (
              <div 
                key={cardName}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-purple-200 transition-all space-y-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs" style={{ backgroundColor: P_LIGHT, color: P }}>
                    💳
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900">{cardName}</h4>
                    <span className="text-[10px] text-gray-400">{data.count} {data.count === 1 ? 'compra' : 'compras'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-medium block">Cuota mensual:</span>
                    <span className="font-bold font-outfit" style={{ color: P }}>{formatCurrency(data.monthly, currency)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-medium block">Resta pagar:</span>
                    <span className="font-bold font-outfit text-[#F95420]">{formatCurrency(data.pending, currency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Main Installment Purchases List (Estilo Resumen) */}
      <div className="bg-white rounded-3xl shadow-sm border border-white overflow-hidden space-y-4">
        {/* Header & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: P }} />
              <span>Listado de Compras en Cuotas</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Administra el progreso de cada plan de cuotas y márcalas como pagadas
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'active' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Activos ({metrics.activePlansCount})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'completed' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Finalizados ({metrics.completedPlansCount})
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'all' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
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
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
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
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Todos los titulares</option>
              <option value="user1">{profile.user1Name}</option>
              <option value="user2">{profile.user2Name}</option>
            </select>
          </div>
        </div>

        {/* Installment Items Cards */}
        <div className="p-4 sm:p-5 space-y-3">
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
                      ? 'bg-slate-50/50 border-slate-100 opacity-75' 
                      : 'bg-white border-slate-100 hover:border-purple-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Concept & Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm sm:text-base">
                          {tx.concepto}
                        </span>
                        
                        {/* Status Badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Finalizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#6F2EC5] border border-purple-100">
                            <Clock className="w-3 h-3" /> En curso
                          </span>
                        )}

                        {/* Remaining Months Pill */}
                        {!isCompleted && remainingCuotas > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-800 border border-orange-200">
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
                          <span className="px-2 py-0.5 bg-orange-50 text-[#F95420] border border-orange-200 rounded-md text-[10px] font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3" /> Pareja ({payerName})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-purple-50 text-[#6F2EC5] border border-purple-100 rounded-md text-[10px] font-semibold flex items-center gap-1">
                            <User className="w-3 h-3" /> {payerName}
                          </span>
                        )}
                      </div>

                      {tx.descripcion && (
                        <p className="text-xs text-gray-500">{tx.descripcion}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 pt-0.5">
                        <span>Categoría: <strong className="text-gray-700">{tx.categoria}</strong> › {tx.subcategoria}</span>
                        <span>•</span>
                        <span>Fecha de compra: {formatDateEs(tx.fecha)}</span>
                      </div>
                    </div>

                    {/* Financial Figures */}
                    <div className="flex items-center gap-5 shrink-0 text-right">
                      <div>
                        <span className="text-[10px] text-gray-400 font-medium block uppercase">Cuota Mensual</span>
                        <span className="text-base sm:text-lg font-bold font-outfit" style={{ color: P }}>
                          {formatCurrency(cuotaMonto, currency)}
                        </span>
                        <span className="text-[10px] text-gray-400 block">/ mes</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 font-medium block uppercase">Total Plan</span>
                        <span className="text-base sm:text-lg font-bold font-outfit text-gray-900">
                          {formatCurrency(tx.monto, currency)}
                        </span>
                        <span className="text-[10px] text-[#F95420] font-semibold block">
                          Resta: {formatCurrency(remainingAmount, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates & Payment Schedule Highlights */}
                  <div className="mt-3 p-3 bg-slate-50/70 border border-slate-100 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-medium uppercase block">1ª Cuota (Inicio)</span>
                        <span className="font-semibold text-gray-800">{planDetails.firstDueDateFormatted || 'No definida'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#F95420] shrink-0" />
                      <div>
                        <span className="text-[10px] text-orange-700 font-medium uppercase block">Próximo Vencimiento</span>
                        <span className="font-semibold text-orange-950">
                          {isCompleted ? '✓ Todo pagado' : (planDetails.nextDueDateFormatted || 'Inmediato')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:text-right sm:justify-end">
                      <div>
                        <span className="text-[10px] text-gray-400 font-medium uppercase block">Finalización</span>
                        <span className="font-semibold text-gray-800">{planDetails.finalDueDateFormatted || 'No definida'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Interactive Step Controls */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 space-y-1 max-w-md">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-800">
                          Cuota {currentCuota} de {totalCuotas} ({progressPercent}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedScheduleTxId(isScheduleOpen ? null : tx.id)}
                          className="text-[11px] font-bold text-[#6F2EC5] hover:text-[#5b24a3] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{isScheduleOpen ? 'Ocultar cronograma' : 'Ver cronograma de pagos'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isScheduleOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: P_LIGHT }}>
                        <div 
                          className={`h-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500' : 'rounded-full'
                          }`}
                          style={{ 
                            width: `${progressPercent}%`,
                            background: isCompleted ? undefined : `linear-gradient(90deg, ${P_MID}, ${P})`
                          }}
                        />
                      </div>
                    </div>

                    {/* Progress Interactive Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => onUpdateInstallmentProgress?.(tx.id, -1)}
                        disabled={currentCuota <= 1 || !onUpdateInstallmentProgress}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-xl transition-all cursor-pointer"
                        title="Retroceder una cuota"
                      >
                        -1 Cuota
                      </button>

                      <button
                        onClick={() => onUpdateInstallmentProgress?.(tx.id, 1)}
                        disabled={currentCuota >= totalCuotas || !onUpdateInstallmentProgress}
                        className="px-3 py-1.5 text-xs font-bold text-white disabled:opacity-30 rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                        style={{ backgroundColor: P }}
                        title="Avanzar una cuota pagada"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+1 Cuota Pagada</span>
                      </button>

                      {!isCompleted && (
                        <button
                          onClick={() => onCompleteInstallment?.(tx.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer"
                          title="Marcar todas las cuotas como pagadas"
                        >
                          Liquidar Todo
                        </button>
                      )}

                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 text-slate-400 hover:text-[#6F2EC5] hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
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
                    <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                      <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" style={{ color: P }} />
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
                                ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-300/40 text-orange-950 shadow-2xs'
                                : 'bg-slate-50/60 border-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>Cuota {sch.cuotaNum}/{sch.cuotasTotal}</span>
                              {sch.isPaid ? (
                                <span className="text-[10px] text-emerald-700 font-bold">✓ Pagada</span>
                              ) : sch.isNext ? (
                                <span className="text-[10px] text-orange-800 font-bold">⚡ Próxima</span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-normal">Futura</span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500 font-medium">
                              📅 {sch.dueDateFormatted}
                            </div>
                            <div className="mt-1 font-bold font-outfit text-[12px]" style={{ color: P }}>
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
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: P_LIGHT, color: P }}>
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">No hay compras en cuotas registradas</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Registra compras con tarjeta de crédito en 3, 6, 12 o más cuotas o carga tus deudas previas para hacer seguimiento del compromiso mensual.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {onOpenPriorInstallmentsModal && (
                  <button
                    onClick={onOpenPriorInstallmentsModal}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cargar cuotas anteriores a la app</span>
                  </button>
                )}
                <button
                  onClick={onOpenNewInstallmentModal}
                  className="px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: P }}
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
