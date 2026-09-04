import React from 'react';
import { 
  DollarSign, 
  Receipt, 
  PieChart, 
  Target, 
  Users, 
  User, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertTriangle,
  Scale
} from 'lucide-react';
import { CoupleProfile, ExpenseMode, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface KpiCardsProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  profile: CoupleProfile;
  activeMode: ExpenseMode;
  debtInfo: {
    totalCoupleSpent: number;
    user1Paid: number;
    user2Paid: number;
    user1ShouldPay: number;
    user2ShouldPay: number;
    debtAmount: number;
    whoOwesWhom: string;
  };
  globalBudget: {
    totalBudget: number;
    totalSpent: number;
    percentage: number;
  };
  topCategory: {
    name: string;
    amount: number;
  };
  onOpenSettlementModal: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  filteredTransactions = [],
  profile,
  activeMode,
  debtInfo,
  globalBudget,
  topCategory,
  onOpenSettlementModal,
}) => {
  const isUser1 = profile.currentUser === 'user1';
  const currentUserName = isUser1 ? profile.user1Name : profile.user2Name;
  const partnerName = isUser1 ? profile.user2Name : profile.user1Name;

  // Filtered total
  const safeFiltered = filteredTransactions || [];
  const totalSpent = safeFiltered.reduce((acc, tx) => acc + (tx?.monto || 0), 0);
  const avgTicket = safeFiltered.length > 0 ? totalSpent / safeFiltered.length : 0;

  // Individual vs Couple breakdown in filtered set
  const individualSpent = safeFiltered
    .filter(tx => tx?.tipo === 'individual')
    .reduce((acc, tx) => acc + (tx?.monto || 0), 0);

  const coupleSpent = safeFiltered
    .filter(tx => tx?.tipo === 'pareja')
    .reduce((acc, tx) => acc + (tx?.monto || 0), 0);

  // User Debt state
  const currentUserOwes = isUser1 
    ? debtInfo.whoOwesWhom === 'user1_owes_user2'
    : debtInfo.whoOwesWhom === 'user2_owes_user1';

  const partnerOwesMe = isUser1
    ? debtInfo.whoOwesWhom === 'user2_owes_user1'
    : debtInfo.whoOwesWhom === 'user1_owes_user2';

  const isEven = debtInfo.debtAmount <= 0.01;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Spent Card */}
      <div className="bg-white p-5 sm:p-6 rounded-[22px] shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] border border-purple-100/80 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(121,40,202,0.12)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-1.5 w-12 bg-purple-200/80 rounded-full mb-1.5" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/50">
              {activeMode === 'all' ? 'Gasto Total' : activeMode === 'individual' ? `Gastos de ${currentUserName}` : 'Gastos en Pareja'}
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#2E0854] mt-1">
              {formatCurrency(totalSpent, profile.currency)}
            </h3>
          </div>
          <div className="w-10 h-10 bg-purple-50 border border-purple-200/70 text-[#7928CA] rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-purple-50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{safeFiltered.length} transacciones</span>
          <span className="font-bold text-slate-800">Prom: {formatCurrency(avgTicket, profile.currency)}</span>
        </div>
      </div>

      {/* 2. Couple Balance / Settlement Status Card */}
      <div className={`p-5 sm:p-6 rounded-[22px] shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] border flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(121,40,202,0.12)] ${
        isEven 
          ? 'bg-white border-purple-100/80' 
          : currentUserOwes
          ? 'bg-rose-50/50 border-rose-200/80 text-rose-950'
          : 'bg-purple-50/40 border-purple-200/80 text-purple-950'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Scale className="w-3.5 h-3.5 text-[#F95420]" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/50">
                Balance Pareja
              </p>
            </div>
            {isEven ? (
              <div className="mt-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Están a mano</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">$0.00 pendiente</p>
              </div>
            ) : currentUserOwes ? (
              <div className="mt-1">
                <h3 className="text-lg sm:text-xl font-bold text-rose-700 flex items-center gap-1">
                  <ArrowUpRight className="w-5 h-5" />
                  <span>Debes {formatCurrency(debtInfo.debtAmount, profile.currency)}</span>
                </h3>
                <p className="text-[11px] text-rose-600 mt-0.5">A {partnerName}</p>
              </div>
            ) : (
              <div className="mt-1">
                <h3 className="text-lg sm:text-xl font-bold text-[#7928CA] flex items-center gap-1">
                  <ArrowDownLeft className="w-5 h-5" />
                  <span>Te deben {formatCurrency(debtInfo.debtAmount, profile.currency)}</span>
                </h3>
                <p className="text-[11px] text-purple-700 mt-0.5">{partnerName} te debe</p>
              </div>
            )}
          </div>

          <button
            onClick={onOpenSettlementModal}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
              isEven 
                ? 'bg-purple-50 hover:bg-purple-100 text-[#2E0854]' 
                : 'bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white shadow-orange-500/25'
            }`}
            title="Ver detalle de liquidación o saldar cuentas"
          >
            {isEven ? 'Detalle' : 'Saldar'}
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-purple-50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Gasto compartido: {formatCurrency(debtInfo.totalCoupleSpent, profile.currency)}</span>
          <span className="font-bold text-[#7928CA] hover:underline cursor-pointer" onClick={onOpenSettlementModal}>
            Desglose →
          </span>
        </div>
      </div>

      {/* 3. Top Spending Category Card */}
      <div className="bg-white p-5 sm:p-6 rounded-[22px] shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] border border-purple-100/80 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(121,40,202,0.12)]">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="h-1.5 w-12 bg-purple-200/80 rounded-full mb-1.5" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/50">Mayor Gasto</p>
            <h3 className="text-base sm:text-lg font-bold text-[#2E0854] mt-1 truncate" title={topCategory.name}>
              {topCategory.name || 'Sin gastos'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatCurrency(topCategory.amount, profile.currency)}
            </p>
          </div>
          <div className="w-10 h-10 bg-purple-50 border border-purple-200/70 text-[#7928CA] rounded-xl flex items-center justify-center shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-purple-50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Participación</span>
          <span className="font-bold text-slate-800">
            {totalSpent > 0 ? ((topCategory.amount / totalSpent) * 100).toFixed(1) : 0}% del total
          </span>
        </div>
      </div>

      {/* 4. Budget Consumed Card */}
      <div className="bg-white p-5 sm:p-6 rounded-[22px] shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] border border-purple-100/80 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(121,40,202,0.12)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-1.5 w-12 bg-purple-200/80 rounded-full mb-1.5" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/50">Presupuesto Mensual</p>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2E0854] mt-1 flex items-center gap-2">
              <span>{globalBudget.percentage}%</span>
              {globalBudget.percentage >= 100 ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-md flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Excedido
                </span>
              ) : globalBudget.percentage >= 80 ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 font-bold rounded-md">
                  Alerta
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 font-bold rounded-md">
                  En meta
                </span>
              )}
            </h3>
          </div>
          <div className="w-10 h-10 bg-purple-50 border border-purple-200/70 text-[#7928CA] rounded-xl flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 space-y-1.5">
          <div className="w-full bg-purple-50 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                globalBudget.percentage >= 100 
                  ? 'bg-rose-500' 
                  : globalBudget.percentage >= 80 
                  ? 'bg-amber-500' 
                  : 'bg-gradient-to-r from-[#7928CA] to-[#9333EA]'
              }`}
              style={{ width: `${Math.min(globalBudget.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{formatCurrency(globalBudget.totalSpent, profile.currency)}</span>
            <span>Meta: {formatCurrency(globalBudget.totalBudget, profile.currency)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
