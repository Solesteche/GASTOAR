import React, { useState } from 'react';
import { 
  X, 
  Scale, 
  Coins, 
  CheckCircle2, 
  ArrowRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  HeartHandshake, 
  Sparkles,
  History,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CoupleProfile, SettlementRecord, Transaction } from '../types';
import { formatCurrency, formatDateEs } from '../utils/formatters';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  transactions?: Transaction[];
  settlementHistory: SettlementRecord[];
  onSettleDebt: (notes: string) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  profile,
  debtInfo,
  transactions = [],
  settlementHistory = [],
  onSettleDebt,
}) => {
  const [activeTab, setActiveTab] = useState<'settle' | 'history'>('settle');
  const [notes, setNotes] = useState('Transferencia bancaria / Pago acordado');

  if (!isOpen) return null;

  const isUser1 = profile?.currentUser === 'user1';
  const currentUserName = isUser1 ? profile?.user1Name : profile?.user2Name;
  const partnerName = isUser1 ? profile?.user2Name : profile?.user1Name;

  const isEven = (debtInfo?.debtAmount || 0) <= 0.01;
  const currentUserOwes = isUser1
    ? debtInfo?.whoOwesWhom === 'user1_owes_user2'
    : debtInfo?.whoOwesWhom === 'user2_owes_user1';

  const debtorName = debtInfo?.whoOwesWhom === 'user1_owes_user2' ? profile?.user1Name : profile?.user2Name;
  const creditorName = debtInfo?.whoOwesWhom === 'user1_owes_user2' ? profile?.user2Name : profile?.user1Name;
  const currency = profile?.currency || 'ARS';

  const handleConfirmSettlement = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    onSettleDebt(notes);
    onClose();
  };

  const coupleTxs = transactions.filter(t => t.tipo === 'pareja');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-700 via-pink-600 to-indigo-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-sm">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Liquidación de Cuentas en Pareja
              </h3>
              <p className="text-[10px] text-pink-100">
                Detalle exacto de aportes y saldos pendientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-pink-100 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('settle')}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'settle'
                ? 'border-pink-600 text-pink-600 bg-white'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Balance Actual</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'border-pink-600 text-pink-600 bg-white'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial ({settlementHistory.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {activeTab === 'settle' ? (
            <>
              {/* Grand Total banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Gasto Total en Pareja:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(debtInfo.totalCoupleSpent, currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <p className="text-[11px] font-bold text-indigo-900 truncate">{profile?.user1Name || 'Usuario 1'}</p>
                    <p className="text-xs text-slate-500">Pagó: <strong className="text-slate-800">{formatCurrency(debtInfo.user1Paid, currency)}</strong></p>
                    <p className="text-[10px] text-slate-400">Le correspondía: {formatCurrency(debtInfo.user1ShouldPay, currency)}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <p className="text-[11px] font-bold text-pink-900 truncate">{profile?.user2Name || 'Usuario 2'}</p>
                    <p className="text-xs text-slate-500">Pagó: <strong className="text-slate-800">{formatCurrency(debtInfo.user2Paid, currency)}</strong></p>
                    <p className="text-[10px] text-slate-400">Le correspondía: {formatCurrency(debtInfo.user2ShouldPay, currency)}</p>
                  </div>
                </div>
              </div>

              {/* Status Outcome */}
              {isEven ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="block font-bold text-sm text-emerald-950">¡Las cuentas están al día!</strong>
                    <span>No hay ninguna diferencia económica pendiente por saldar.</span>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  currentUserOwes 
                    ? 'bg-rose-50 border-rose-200 text-rose-950' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-pink-600" />
                      <span className="font-bold text-xs uppercase tracking-wider">
                        Resolución del Balance
                      </span>
                    </div>
                    <span className="text-base font-bold">
                      {formatCurrency(debtInfo.debtAmount, currency)}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed">
                    Para quedar 100% equilibrados, <strong>{debtorName}</strong> debe transferirle o entregarle <strong>{formatCurrency(debtInfo.debtAmount, currency)}</strong> a <strong>{creditorName}</strong>.
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Nota de la liquidación:
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Transferido por Mercado Pago / Efectivo"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />

                    <button
                      onClick={handleConfirmSettlement}
                      className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registrar Deuda como Saldada</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Breakdown List of couple items */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gastos Compartidos Incluidos ({coupleTxs.length})
                </h4>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {coupleTxs.map((t) => {
                    const payer = t.pagadoPor === 'user1' ? (profile?.user1Name || 'Usuario 1') : (profile?.user2Name || 'Usuario 2');
                    return (
                      <div key={t.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <p className="font-semibold text-slate-800">{t.concepto}</p>
                          <p className="text-[10px] text-slate-400">Pagado por {payer} ({t.splitType === '50_50' ? '50/50' : t.splitType})</p>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(t.monto, currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: Settlement History */
            <div className="space-y-3">
              {settlementHistory.length > 0 ? (
                settlementHistory.map((rec) => (
                  <div key={rec.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{rec.payerName} → {rec.receiverName}</span>
                      <span className="text-emerald-600">{formatCurrency(rec.amount, currency)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{rec.notes || 'Liquidación de saldo'}</span>
                      <span className="font-mono">{formatDateEs(rec.date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">
                  No hay liquidaciones pasadas registradas todavía.
                </p>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
