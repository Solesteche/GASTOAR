import React from 'react';
import { 
  Scale, 
  Users, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Coins, 
  Sparkles, 
  HeartHandshake,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { CoupleProfile, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CoupleBalanceBannerProps {
  transactions: Transaction[];
  profile: CoupleProfile;
  debtInfo: {
    totalCoupleSpent: number;
    user1Paid: number;
    user2Paid: number;
    user1ShouldPay: number;
    user2ShouldPay: number;
    debtAmount: number;
    whoOwesWhom: string;
  };
  onOpenSettlementModal: () => void;
  onOpenTransactionModal: () => void;
}

export const CoupleBalanceBanner: React.FC<CoupleBalanceBannerProps> = ({
  transactions,
  profile,
  debtInfo,
  onOpenSettlementModal,
  onOpenTransactionModal,
}) => {
  const isUser1 = profile.currentUser === 'user1';
  const currentUserName = isUser1 ? profile.user1Name : profile.user2Name;
  const partnerName = isUser1 ? profile.user2Name : profile.user1Name;

  const isEven = debtInfo.debtAmount <= 0.01;
  const currentUserOwes = isUser1
    ? debtInfo.whoOwesWhom === 'user1_owes_user2'
    : debtInfo.whoOwesWhom === 'user2_owes_user1';

  // Individual vs Couple stats
  const txList = transactions || [];
  const totalAll = txList.reduce((acc, t) => acc + (t?.monto || 0), 0);
  const indSpent = txList.filter(t => t?.tipo === 'individual').reduce((acc, t) => acc + (t?.monto || 0), 0);
  const coupSpent = debtInfo?.totalCoupleSpent || 0;

  const indPct = totalAll > 0 ? Math.round((indSpent / totalAll) * 100) : 0;
  const coupPct = totalAll > 0 ? Math.round((coupSpent / totalAll) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-[#2E0854] via-[#3B0764] to-[#7928CA] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-purple-900/50 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#F95420]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#7928CA]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Summary & Balances */}
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-xl bg-white/10 text-[#F95420] border border-white/15">
              <HeartHandshake className="w-4 h-4" />
            </span>
            <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <span>Finanzas Compartidas & Balance de Pareja</span>
            </h2>
            <span className="text-[10px] font-mono font-bold bg-white/15 text-purple-100 px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-xs">
              Código: {profile.accountCode}
            </span>
          </div>

          <p className="text-xs text-purple-100/90 leading-relaxed max-w-2xl font-medium">
            Registra gastos conjuntos divididos 50/50 o según porcentajes y calcula automáticamente quién debe a quién para mantener las cuentas claras sin discusiones.
          </p>

          {/* Partner contribution comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* User 1 */}
            <div className={`p-3.5 rounded-2xl border backdrop-blur-xs ${isUser1 ? 'bg-white/15 border-purple-300/40 ring-1 ring-white/20' : 'bg-white/10 border-white/10'}`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-200" />
                  <span>{profile.user1Name} {isUser1 && '(Tú)'}</span>
                </span>
                <span className="text-[10px] text-purple-200 font-medium">Pagó en común</span>
              </div>
              <p className="text-lg font-black text-white">
                {formatCurrency(debtInfo.user1Paid, profile.currency)}
              </p>
              <div className="flex justify-between text-[10px] text-purple-200 mt-1 font-medium">
                <span>Le correspondía: {formatCurrency(debtInfo.user1ShouldPay, profile.currency)}</span>
              </div>
            </div>

            {/* User 2 */}
            <div className={`p-3.5 rounded-2xl border backdrop-blur-xs ${!isUser1 ? 'bg-white/15 border-orange-300/40 ring-1 ring-white/20' : 'bg-white/10 border-white/10'}`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-300" />
                  <span>{profile.user2Name} {!isUser1 && '(Tú)'}</span>
                </span>
                <span className="text-[10px] text-purple-200 font-medium">Pagó en común</span>
              </div>
              <p className="text-lg font-black text-white">
                {formatCurrency(debtInfo.user2Paid, profile.currency)}
              </p>
              <div className="flex justify-between text-[10px] text-purple-200 mt-1 font-medium">
                <span>Le correspondía: {formatCurrency(debtInfo.user2ShouldPay, profile.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Net Settlement Action Box */}
        <div className="lg:w-80 bg-[#2E0854]/80 border border-white/15 p-4 sm:p-5 rounded-2xl flex flex-col justify-between shrink-0 space-y-4 backdrop-blur-md shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
              Estado de la Liquidación
            </span>
            {isEven ? (
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">Cuentas Equilibradas</h3>
                  <p className="text-[11px] text-purple-200">No hay deudas pendientes</p>
                </div>
              </div>
            ) : currentUserOwes ? (
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-purple-100 font-medium">Tienes que pagarle a <strong className="text-white">{partnerName}</strong></p>
                  <h3 className="text-xl font-black text-rose-300 mt-0.5">
                    {formatCurrency(debtInfo.debtAmount, profile.currency)}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-purple-100 font-medium"><strong className="text-white">{partnerName}</strong> debe transferirte</p>
                  <h3 className="text-xl font-black text-emerald-300 mt-0.5">
                    {formatCurrency(debtInfo.debtAmount, profile.currency)}
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* Quick settlement action button */}
          <div className="space-y-2">
            <button
              onClick={onOpenSettlementModal}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                isEven
                  ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                  : 'bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white shadow-orange-500/25'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>{isEven ? 'Ver Historial de Liquidaciones' : 'Liquidar y Saldar Deuda'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
