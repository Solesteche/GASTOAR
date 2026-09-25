import React from 'react';
import { 
  Bell, 
  Plus, 
  Mic, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  CalendarClock, 
  TrendingUp, 
  ChevronRight, 
  Sparkles,
  Receipt,
  Search
} from 'lucide-react';
import { Transaction, CoupleProfile } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface MobileHomeScreenProps {
  userName?: string;
  transactions: Transaction[];
  profile: CoupleProfile;
  onOpenNewExpense: () => void;
  onOpenNewIncome: () => void;
  onOpenVoiceExpense: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenNotifications?: () => void;
}

export const MobileHomeScreen: React.FC<MobileHomeScreenProps> = ({
  userName = 'Alex',
  transactions = [],
  profile,
  onOpenNewExpense,
  onOpenNewIncome,
  onOpenVoiceExpense,
  onNavigateToTab,
  onOpenNotifications
}) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? '¡Buen día' : currentHour < 20 ? '¡Buenas tardes' : '¡Buenas noches';

  // Calculate monthly stats
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const currentMonthTx = transactions.filter(t => t.date && t.date.startsWith(currentMonthStr));
  const totalExpense = currentMonthTx
    .filter(t => t.type !== 'ingreso')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  
  const totalIncome = currentMonthTx
    .filter(t => t.type === 'ingreso')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const balance = totalIncome - totalExpense;
  const budgetRatio = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 68;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-50 text-slate-800 flex flex-col justify-between p-4 sm:p-5 select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Top Bar Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7928CA] to-[#F95420] text-white font-bold flex items-center justify-center text-sm shadow-sm border-2 border-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight flex items-center gap-1">
                {greeting}, {userName} <span className="text-sm">👋</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Panel Financiero Personal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenNotifications || (() => onNavigateToTab('card_alerts'))}
              className="w-9 h-9 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-600 hover:text-[#7928CA] transition-colors relative cursor-pointer"
              title="Notificaciones & Vencimientos"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F95420]" />
            </button>
          </div>
        </div>

        {/* Highlight Progress Card (Matching Screen 5 Violet Card) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#651A9E] via-[#7928CA] to-[#9B30FF] p-5 text-white shadow-xl shadow-purple-600/20">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-purple-200">
                Presupuesto Utilizado
              </span>
              <div className="text-3xl font-black tracking-tight">
                {budgetRatio}%
              </div>
              <p className="text-[11px] text-purple-200/80">
                Gastado: {formatCurrency(totalExpense, profile?.currency || 'ARS')}
              </p>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-orange-400"
                  strokeDasharray={`${budgetRatio}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-black">
                {budgetRatio}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-purple-200">Saldo Disponible</span>
              {balance < 0 && (
                <span className="text-[9px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30 px-1.5 py-0.5 rounded-full">
                  Déficit
                </span>
              )}
            </div>
            <span className={`font-extrabold ${balance < 0 ? 'text-rose-200' : 'text-white'}`}>
              {formatCurrency(balance, profile?.currency || 'ARS')}
            </span>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={onOpenNewExpense}
            className="p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs hover:border-purple-300 hover:shadow-md flex flex-col items-center gap-1 transition-all text-slate-700 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold">+ Gasto</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewIncome}
            className="p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs hover:border-purple-300 hover:shadow-md flex flex-col items-center gap-1 transition-all text-slate-700 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold">+ Ingreso</span>
          </button>

          <button
            type="button"
            onClick={onOpenVoiceExpense}
            className="p-2.5 rounded-2xl bg-white border border-orange-200 shadow-xs hover:border-orange-400 hover:shadow-md flex flex-col items-center gap-1 transition-all text-slate-700 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F95420] flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold">Voz IA</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('card_alerts')}
            className="p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs hover:border-purple-300 hover:shadow-md flex flex-col items-center gap-1 transition-all text-slate-700 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7928CA] flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold">Alertas</span>
          </button>
        </div>

        {/* Section: Mis Movimientos Recientes */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Mis Movimientos
            </h3>
            <button
              type="button"
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs font-bold text-[#7928CA] hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === 'ingreso';
                return (
                  <div
                    key={tx.id}
                    onClick={() => onNavigateToTab('transactions')}
                    className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex items-center justify-between hover:border-purple-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600'
                            : tx.isCuotas
                            ? 'bg-orange-50 text-orange-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : tx.isCuotas ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <Receipt className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {tx.description || tx.categoria}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {tx.date} · {tx.categoria}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-black ${
                          isIncome ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount, profile?.currency || 'ARS')}
                      </span>
                      {tx.isCuotas && (
                        <p className="text-[9px] font-bold text-orange-600">
                          {tx.cuotaActual}/{tx.cuotasTotales} cuotas
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No hay movimientos cargados todavía.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screen 5 Tag Footer */}
      <div className="pt-3 text-center">
        <span className="text-[10px] font-bold text-slate-400">
          Pantalla 5 · Inicio / Dashboard Hub
        </span>
      </div>
    </div>
  );
};
