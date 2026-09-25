// CashFlowSection.tsx
// Componente UI de Proyección de Flujo de Caja — Plan Pro GastoAR
// Pegar en la raíz del proyecto

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingDown, TrendingUp, AlertTriangle, Calendar,
  ChevronRight, Zap, Lock, RefreshCw, Info,
  ArrowUpRight, ArrowDownLeft, DollarSign
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Transaction } from './types';
import { CashFlowEngine, CashFlowProjection, DayProjection, ScheduledPayment } from './CashFlowEngine';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CashFlowSectionProps {
  transactions: Transaction[];
  currentBalance: number;
  scheduledPayments?: ScheduledPayment[];
  isPro: boolean;
  onUpgradePro?: () => void;
  isDarkMode?: boolean;
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d: DayProjection = payload[0]?.payload;
  const ars = (n: number) => '$\u00A0' + Math.round(n).toLocaleString('es-AR');
  return (
    <div className="bg-slate-900 text-white rounded-xl p-3 text-xs shadow-xl border border-white/10 min-w-[160px]">
      <p className="font-bold mb-2 text-purple-300">{d?.dayLabel}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Saldo</span>
          <span className={`font-bold ${d?.balance < 0 ? 'text-red-400' : 'text-white'}`}>{ars(d?.balance)}</span>
        </div>
        {d?.dailyIncome > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-emerald-400">↑ Ingreso</span>
            <span className="font-semibold text-emerald-400">{ars(d.dailyIncome)}</span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-red-400">↓ Gasto est.</span>
          <span className="font-semibold text-red-400">{ars(d?.dailyExpense)}</span>
        </div>
        {d?.scheduledPayments?.length > 0 && (
          <div className="pt-1 border-t border-white/10">
            {d.scheduledPayments.map(p => (
              <div key={p.id} className="flex justify-between gap-2 text-amber-300">
                <span>{p.emoji} {p.label}</span>
                <span>{ars(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const CashFlowSection: React.FC<CashFlowSectionProps> = ({
  transactions,
  currentBalance,
  scheduledPayments = [],
  isPro,
  onUpgradePro,
  isDarkMode = false,
}) => {
  const [daysAhead, setDaysAhead] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [selectedDay, setSelectedDay] = useState<DayProjection | null>(null);

  const ars = (n: number) => '$\u00A0' + Math.round(Math.abs(n)).toLocaleString('es-AR');

  // Calcular proyección
  const projection = useMemo<CashFlowProjection | null>(() => {
    if (!isPro) return null;
    return CashFlowEngine.calculate(
      transactions,
      currentBalance,
      scheduledPayments,
      daysAhead,
    );
  }, [transactions, currentBalance, scheduledPayments, daysAhead, isPro, lastRefresh]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => { setLastRefresh(Date.now()); setIsLoading(false); }, 600);
  };

  // Datos para el gráfico (1 de cada 2 días para no saturar)
  const chartData = useMemo(() => {
    if (!projection) return [];
    return projection.days.filter((_, i) => i % (daysAhead > 15 ? 2 : 1) === 0).map(d => ({
      ...d,
      name: d.dayLabel.split(' ').slice(1).join(' '), // solo "15 Sep"
      balanceK: Math.round(d.balance / 1000),
    }));
  }, [projection, daysAhead]);

  // ── Paywall ────────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-purple-200/60">
        <div className="filter blur-sm pointer-events-none p-5 bg-white h-64">
          <div className="h-full bg-gradient-to-b from-purple-50 to-slate-100 rounded-xl" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs p-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-3 shadow-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base font-bold text-slate-900 text-center mb-1">Proyección de Flujo de Caja</h3>
          <p className="text-xs text-slate-500 text-center mb-4 max-w-xs leading-relaxed">
            Sabé cuánto dinero vas a tener en los próximos 7, 15 o 30 días. Alertas automáticas cuando el saldo se va a poner crítico.
          </p>
          <button
            onClick={onUpgradePro}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Activar Plan Pro →
          </button>
        </div>
      </div>
    );
  }

  if (!projection) return null;

  const balanceIn = (days: number) => {
    if (days === 7)  return projection.projectedBalanceIn7Days;
    if (days === 15) return projection.projectedBalanceIn15Days;
    return projection.projectedBalanceIn30Days;
  };

  // ── Vista principal ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className={`rounded-2xl p-5 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-blue-900/30'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Flujo de Caja</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">PRO</span>
              </div>
              <p className="text-xs text-slate-400">¿Cuánto vas a tener?</p>
            </div>
          </div>
          <button onClick={handleRefresh} className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${isLoading ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Selector de horizonte */}
        <div className="flex items-center gap-2 mb-4">
          {[7, 15, 30].map(d => (
            <button
              key={d}
              onClick={() => setDaysAhead(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${daysAhead === d ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
            >
              {d} días
            </button>
          ))}
        </div>

        {/* Cards de saldo proyectado */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[7, 15, 30].map(d => {
            const bal = balanceIn(d);
            const isNeg = bal < 0;
            return (
              <div key={d} className={`rounded-xl p-3 border ${daysAhead === d ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/10'}`}>
                <p className="text-[10px] text-slate-400 mb-1">En {d} días</p>
                <p className={`text-base font-black leading-none ${isNeg ? 'text-red-400' : 'text-white'}`}>
                  {isNeg ? '−' : ''}{ars(bal)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Gráfico de área */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 9 }} axisLine={false} tickLine={false} interval={daysAhead > 15 ? 4 : 2} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} />
              <Area
                type="monotone" dataKey="balance"
                stroke="#3B82F6" strokeWidth={2}
                fill="url(#cfGrad)"
                dot={(props: any) => {
                  const d: DayProjection = props.payload;
                  if (d.isCritical) return <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill="#EF4444" stroke="white" strokeWidth={1.5} />;
                  if (d.isPayday) return <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill="#10B981" stroke="white" strokeWidth={1.5} />;
                  return <circle key={props.key} cx={props.cx} cy={props.cy} r={0} />;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Saldo crítico</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Día de cobro</span>
        </div>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 mb-1">Gasto diario promedio</p>
          <p className="text-lg font-black text-slate-900">{ars(projection.averageDailyExpense)}</p>
          <p className="text-[10px] text-slate-400">basado en los últimos 60 días</p>
        </div>
        <div className={`border rounded-xl p-3 ${projection.daysUntilZero !== null && projection.daysUntilZero < 20 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <p className="text-[10px] text-slate-500 mb-1">Saldo llega a 0 en</p>
          <p className={`text-lg font-black ${projection.daysUntilZero !== null && projection.daysUntilZero < 20 ? 'text-red-600' : 'text-slate-900'}`}>
            {projection.daysUntilZero !== null ? `${projection.daysUntilZero} días` : '> 30 días'}
          </p>
          <p className="text-[10px] text-slate-400">si el gasto sigue igual</p>
        </div>
      </div>

      {/* Alertas */}
      {projection.alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Alertas inteligentes</h4>
          {projection.alerts.map((alert, i) => {
            const colors = {
              high:   { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',   icon: '🚨' },
              medium: { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700', icon: '⚠️' },
              low:    { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',  icon: '💡' },
            };
            const c = colors[alert.severity];
            return (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                <span className="text-base flex-shrink-0">{c.icon}</span>
                <p className={`text-xs leading-relaxed ${c.text}`}>{alert.message}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline de los próximos días */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800">Próximos {Math.min(7, daysAhead)} días</h4>
          <span className="text-[10px] text-slate-400">Tocá un día para el detalle</span>
        </div>
        <div className="divide-y divide-slate-100">
          {projection.days.slice(0, 7).map(day => (
            <div
              key={day.date}
              onClick={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                day.isCritical ? 'bg-red-50/50 hover:bg-red-50' :
                day.isPayday   ? 'bg-emerald-50/50 hover:bg-emerald-50' :
                                 'hover:bg-slate-50'
              }`}
            >
              {/* Indicador */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                day.isCritical ? 'bg-red-400' :
                day.isPayday   ? 'bg-emerald-400' :
                                 'bg-slate-300'
              }`} />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{day.dayLabel}</p>
                {day.scheduledPayments.length > 0 && (
                  <p className="text-[10px] text-amber-600 truncate">
                    {day.scheduledPayments.map(p => `${p.emoji} ${p.label}`).join(' · ')}
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${day.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {day.balance < 0 ? '−' : ''}{ars(day.balance)}
                </p>
                <p className={`text-[10px] font-medium ${day.netFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {day.netFlow >= 0 ? '+' : '−'}{ars(day.netFlow)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CashFlowSection;
