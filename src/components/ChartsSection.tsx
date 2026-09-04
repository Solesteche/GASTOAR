import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { CategoryColors, CategoryMap, Transaction } from '../types';

interface ChartsSectionProps {
  transactions: Transaction[];
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  currency?: string;
  onOpenTransactionModal?: () => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CATEGORY_EMOJIS: Record<string, string> = {
  'Alimentos': '🛒',
  'Alimentación': '🛒',
  'Supermercado': '🛒',
  'Transporte': '🚗',
  'Movilidad & Transporte': '🚗',
  'Hogar': '🏠',
  'Servicios & Hogar': '🏠',
  'Entretenimiento': '🎬',
  'Ocio & Suscripciones': '🎬',
  'Salud': '💊',
  'Farmacia & Salud': '💊',
  'Restaurantes': '🍽️',
  'Educación': '📚',
  'Otros': '📦',
  'Otros Gastos': '📦',
};

const CATEGORY_DEFAULT_COLORS: Record<string, string> = {
  'Alimentos': '#a855f7',
  'Alimentación': '#a855f7',
  'Transporte': '#eab308',
  'Movilidad & Transporte': '#eab308',
  'Hogar': '#ef4444',
  'Servicios & Hogar': '#ef4444',
  'Entretenimiento': '#ec4899',
  'Ocio & Suscripciones': '#ec4899',
  'Otros': '#38bdf8',
  'Otros Gastos': '#38bdf8',
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  transactions = [],
  categoryMap = {},
  categoryColors = {},
  currency = 'ARS',
  onOpenTransactionModal,
}) => {
  const [periodTab, setPeriodTab] = useState<'semanal' | 'mensual' | 'anual'>('mensual');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const pad = (n: number) => n.toString().padStart(2, '0');

  const monthName = MONTH_NAMES[month];

  const handlePrev = () => {
    setSelectedDate(prev => {
      if (periodTab === 'anual') {
        return new Date(prev.getFullYear() - 1, prev.getMonth(), 1);
      }
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  };

  const handleNext = () => {
    setSelectedDate(prev => {
      if (periodTab === 'anual') {
        return new Date(prev.getFullYear() + 1, prev.getMonth(), 1);
      }
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  };

  // Filter expenses based on selected month / year
  const filteredTxs = useMemo(() => {
    const monthPrefix = `${year}-${pad(month + 1)}`;
    const yearPrefix = `${year}-`;

    return (transactions || []).filter(t => {
      if (!t || !t.fecha || t.tipoTransaccion === 'ingreso') return false;
      if (periodTab === 'anual') {
        return t.fecha.startsWith(yearPrefix);
      }
      return t.fecha.startsWith(monthPrefix);
    });
  }, [transactions, year, month, periodTab]);

  const totalSpent = useMemo(() => {
    return filteredTxs.reduce((acc, t) => acc + (t.monto || 0), 0);
  }, [filteredTxs]);

  // Previous period comparison
  const prevPeriodSpent = useMemo(() => {
    let pPrefix = '';
    if (periodTab === 'anual') {
      pPrefix = `${year - 1}-`;
    } else {
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      pPrefix = `${prevY}-${pad(prevM + 1)}`;
    }

    const prevTxs = (transactions || []).filter(t => t && t.fecha && t.tipoTransaccion !== 'ingreso' && t.fecha.startsWith(pPrefix));
    return prevTxs.reduce((acc, t) => acc + (t.monto || 0), 0);
  }, [transactions, year, month, periodTab]);

  let diffPct = 0;
  if (prevPeriodSpent > 0) {
    diffPct = Math.round(((totalSpent - prevPeriodSpent) / prevPeriodSpent) * 100);
  }

  // Daily or Monthly Bar Chart data
  const barChartData = useMemo(() => {
    if (periodTab === 'anual') {
      // 12 months
      return MONTH_NAMES.map((mName, mIdx) => {
        const p = `${year}-${pad(mIdx + 1)}`;
        const sum = (transactions || [])
          .filter(t => t.tipoTransaccion !== 'ingreso' && t.fecha && t.fecha.startsWith(p))
          .reduce((acc, t) => acc + (t.monto || 0), 0);
        return { label: mName.slice(0, 3), amount: sum };
      });
    }

    // Days in selected month
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      const sum = filteredTxs
        .filter(t => t.fecha === dStr)
        .reduce((acc, t) => acc + (t.monto || 0), 0);
      days.push({ label: String(d), amount: sum });
    }
    return days;
  }, [periodTab, year, month, transactions, filteredTxs]);

  const maxBarAmount = Math.max(1, ...barChartData.map(b => b.amount));

  // Category Breakdown
  const categorySummary = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredTxs.forEach(t => {
      const cat = t.categoria || 'Otros';
      catMap[cat] = (catMap[cat] || 0) + (t.monto || 0);
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, item) => sum + item[1], 0) || 0;

    return sorted.map(([name, amount]) => {
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      const color = categoryColors[name] || CATEGORY_DEFAULT_COLORS[name] || '#a855f7';
      const emoji = CATEGORY_EMOJIS[name] || '📦';
      return { name, amount, pct, color, emoji };
    });
  }, [filteredTxs, categoryColors]);

  let currentDonutAngle = 0;
  const donutSegments = categorySummary.map(item => {
    const start = currentDonutAngle;
    const sweep = (item.pct / 100) * 360;
    currentDonutAngle += sweep;
    return {
      ...item,
      startAngle: start,
      endAngle: currentDonutAngle,
      strokeDasharray: `${(item.pct * 2.83).toFixed(2)} 283`,
      strokeDashoffset: `-${(start * 2.83 / 360 * 100).toFixed(2)}`,
    };
  });

  const formatNumberWithDots = (val: number) => {
    return Math.abs(Math.round(val)).toLocaleString('es-AR');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      
      {/* Header matching Screenshot 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Reportes</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Análisis y estadísticas de tus gastos</p>
        </div>

        {/* Period Selector Tabs (Semanal | Mensual | Anual) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto border border-slate-200/60">
          <button
            onClick={() => setPeriodTab('semanal')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              periodTab === 'semanal' ? 'bg-white text-[#7928CA] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriodTab('mensual')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              periodTab === 'mensual' ? 'bg-white text-[#7928CA] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setPeriodTab('anual')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              periodTab === 'anual' ? 'bg-white text-[#7928CA] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {/* Date Navigator (< Mayo 2024 >) */}
      <div className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-2xl border border-purple-100 shadow-2xs">
        <button
          onClick={handlePrev}
          className="p-2 rounded-xl hover:bg-purple-50 text-slate-700 transition-colors cursor-pointer"
          title="Período anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center font-black text-sm sm:text-base text-slate-900">
          {periodTab === 'anual' ? `Año ${year}` : `${monthName} ${year}`}
        </div>

        <button
          onClick={handleNext}
          className="p-2 rounded-xl hover:bg-purple-50 text-slate-700 transition-colors cursor-pointer"
          title="Período siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Spend Stat Highlight */}
      <div className="bg-gradient-to-br from-[#1b0633] via-[#260a47] to-[#120324] rounded-[28px] p-6 text-white shadow-xl border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            $ {formatNumberWithDots(totalSpent)},00
          </div>
          <p className="text-xs text-purple-200/80 mt-1 font-semibold">
            Total gastado en {periodTab === 'anual' ? `el año ${year}` : `${monthName.toLowerCase()}`}
          </p>
        </div>

        <div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
            diffPct <= 0 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
              : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
          }`}>
            <span>{diffPct <= 0 ? '▼' : '▲'}</span>
            <span>{Math.abs(diffPct)}% vs período anterior</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Histogram */}
      <div className="bg-white rounded-[26px] p-5 sm:p-7 border border-purple-100 shadow-md space-y-4">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
          Evolución del gasto
        </h3>

        <div className="h-48 sm:h-56 flex items-end gap-1 sm:gap-2 pt-4 border-b border-slate-100 overflow-x-auto pb-2 custom-scrollbar">
          {barChartData.map((bar, i) => {
            const hPct = Math.max(4, Math.round((bar.amount / maxBarAmount) * 100));
            return (
              <div key={i} className="flex-1 min-w-[14px] flex flex-col items-center gap-1.5 group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded-md whitespace-nowrap pointer-events-none mb-1 shadow-md">
                  ${formatNumberWithDots(bar.amount)}
                </div>

                {/* Vertical Bar */}
                <div className="w-full bg-purple-50 rounded-t-lg flex items-end h-32 sm:h-40">
                  <div 
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#7928CA] to-[#F95420] transition-all duration-500 hover:brightness-110"
                    style={{ height: `${hPct}%` }}
                  />
                </div>

                {/* Label */}
                <span className="text-[10px] text-slate-400 font-semibold truncate">
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Por categoría Section */}
      <div className="bg-white rounded-[26px] p-5 sm:p-7 border border-purple-100 shadow-md">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mb-4 pb-2 border-b border-purple-50">
          Por categoría
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Donut Chart */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {donutSegments.length > 0 ? (
                  donutSegments.map((seg) => (
                    <circle
                      key={seg.name}
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="13"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-300"
                    />
                  ))
                ) : (
                  <circle cx="50" cy="50" r="36" fill="transparent" stroke="#f1f5f9" strokeWidth="13" />
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none">
                <span className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  ${formatNumberWithDots(totalSpent)},00
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                  Total gastado
                </span>
              </div>
            </div>
          </div>

          {/* Category List */}
          <div className="lg:col-span-7 space-y-2.5">
            {categorySummary.length > 0 ? (
              categorySummary.map((cat) => (
                <div 
                  key={cat.name} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/20 border border-purple-100/50 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span className="text-base">{cat.emoji}</span>
                    <span className="font-bold text-slate-800 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-slate-900">
                      $ {formatNumberWithDots(cat.amount)},00
                    </span>
                    <span 
                      className="text-xs font-black px-2 py-0.5 rounded-full border"
                      style={{ 
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                        borderColor: `${cat.color}35`
                      }}
                    >
                      {cat.pct}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center bg-purple-50/20 border border-dashed border-purple-200 rounded-2xl text-xs text-slate-400">
                Sin datos de gastos para este período.
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
