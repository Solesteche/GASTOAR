import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  WalletCards,
} from 'lucide-react';

type BudgetAlert = {
  id: string;
  name: string;
  emoji?: string;
  pct: number;
  spent: number;
  budget: number;
  textColor?: string;
  barColor?: string;
};

type DueItem = {
  id: string;
  name: string;
  provider?: string;
  dueDay: number;
  estimatedAmount?: number;
  paidThisMonth?: boolean;
  category?: string;
};

interface DashboardAlertsSectionProps {
  budgetAlertsList: BudgetAlert[];
  criticalAlertsCount: number;
  vencimientos?: DueItem[];
  onNavigateVencimientos?: () => void;
  onMarkVencimientoPaid?: (id: string) => void;
}

const money = (value = 0) =>
  '$ ' + Math.round(value).toLocaleString('es-AR');

export const DashboardAlertsSection: React.FC<DashboardAlertsSectionProps> = ({
  budgetAlertsList,
  criticalAlertsCount,
  vencimientos = [],
  onNavigateVencimientos,
  onMarkVencimientoPaid,
}) => {
  const today = new Date().getDate();

  const upcoming = useMemo(() => {
    return [...vencimientos]
      .filter(item => !item.paidThisMonth)
      .map(item => {
        let days = item.dueDay - today;
        // If the day already passed, consider it overdue.
        return { ...item, days };
      })
      .sort((a, b) => {
        const aOverdue = a.days < 0;
        const bOverdue = b.days < 0;
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        return a.days - b.days;
      })
      .slice(0, 5);
  }, [vencimientos, today]);

  const getDueLabel = (days: number) => {
    if (days < 0) return `Vencido hace ${Math.abs(days)} ${Math.abs(days) === 1 ? 'día' : 'días'}`;
    if (days === 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `Vence en ${days} días`;
  };

  const getDueClass = (days: number) => {
    if (days < 0) return 'bg-red-50 text-red-600 border-red-100';
    if (days === 0) return 'bg-orange-50 text-orange-600 border-orange-100';
    if (days <= 3) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-purple-50 text-[#7E22CE] border-purple-100';
  };

  return (
    <div className="space-y-3">

      {/* ALERTAS DE PRESUPUESTO */}
      {budgetAlertsList.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F95420] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-800">
                  Alertas de presupuesto
                </h3>
                <p className="text-[10px] text-slate-500">
                  Categorías que requieren atención
                </p>
              </div>
              {criticalAlertsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                  {criticalAlertsCount}
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {budgetAlertsList.slice(0, 4).map(item => (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg shrink-0">{item.emoji || '⚠️'}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                        {item.name}
                      </p>
                      <span className={`text-xs font-extrabold ${item.textColor || 'text-orange-600'}`}>
                        {item.pct}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.barColor || 'bg-[#F95420]'
                        }`}
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-1.5 gap-2">
                      <span className="text-[10px] text-slate-500 truncate">
                        {money(item.spent)} de {money(item.budget)}
                      </span>
                      {item.pct >= 100 && (
                        <span className="text-[9px] font-bold text-red-600 shrink-0">
                          Presupuesto superado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRÓXIMOS VENCIMIENTOS */}
      <section className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#9333EA] flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                Próximos vencimientos
              </h3>
              <p className="text-[10px] text-slate-500">
                Lo que tenés que pagar próximamente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateVencimientos}
            className="text-[10px] font-extrabold text-[#9333EA] hover:text-[#7E22CE] flex items-center gap-0.5 shrink-0"
          >
            Ver todos
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="px-4 py-7 text-center">
            <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-2" />
            <p className="text-xs font-bold text-slate-700">
              No tenés vencimientos pendientes
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Todo al día por ahora.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map(item => (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <WalletCards className="w-4 h-4 text-[#9333EA]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {item.provider || item.category || 'Vencimiento'} · día {item.dueDay}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {money(item.estimatedAmount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${getDueClass(item.days)}`}>
                        <Clock3 className="w-3 h-3" />
                        {getDueLabel(item.days)}
                      </span>

                      {onMarkVencimientoPaid && (
                        <button
                          type="button"
                          onClick={() => onMarkVencimientoPaid(item.id)}
                          className="text-[9px] font-extrabold text-[#9333EA] hover:text-[#F95420]"
                        >
                          Marcar pagado
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100">
          <button
            type="button"
            onClick={onNavigateVencimientos}
            className="w-full h-9 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#F95420] text-white text-xs font-extrabold shadow-sm hover:opacity-95 transition-opacity"
          >
            + Nuevo vencimiento
          </button>
        </div>
      </section>
    </div>
  );
};

export default DashboardAlertsSection;
