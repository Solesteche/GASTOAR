import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Users, 
  User, 
  Plus, 
  Search, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Edit3, 
  Trash2, 
  Coins, 
  Receipt,
  Calendar,
  Sparkles,
  CreditCard,
  Tag,
  Link2,
  Share2
} from 'lucide-react';
import { CoupleProfile, Transaction, CategoryMap, CategoryColors } from '../types';
import { formatCurrency, formatDateEs } from '../utils/formatters';

interface CoupleBalanceSectionProps {
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
  categoryMap?: CategoryMap;
  categoryColors?: CategoryColors;
  partnerConnected?: boolean;
  onOpenCoupleSettings?: () => void;
  onOpenMonthlyReport?: () => void;
  onOpenSettlementModal: () => void;
  onOpenTransactionModal: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

const P = "#6D3FEA";

export const CoupleBalanceSection: React.FC<CoupleBalanceSectionProps> = ({
  transactions = [],
  profile,
  debtInfo,
  categoryMap = {},
  categoryColors = {},
  partnerConnected = false,
  onOpenCoupleSettings,
  onOpenMonthlyReport,
  onOpenSettlementModal,
  onOpenTransactionModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const isUser1 = profile.currentUser === 'user1';
  const currentUserName = isUser1 ? profile.user1Name : profile.user2Name;
  const partnerName = isUser1 ? profile.user2Name : profile.user1Name;

  const isEven = debtInfo.debtAmount <= 0.01;
  const currentUserOwes = isUser1
    ? debtInfo.whoOwesWhom === 'user1_owes_user2'
    : debtInfo.whoOwesWhom === 'user2_owes_user1';

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [payerFilter, setPayerFilter] = useState<'ALL' | 'user1' | 'user2'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Filter only couple transactions
  const coupleTransactions = useMemo(() => {
    return transactions.filter(t => t && t.tipo === 'pareja');
  }, [transactions]);

  const filteredCoupleTransactions = useMemo(() => {
    return coupleTransactions.filter(t => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const descMatch = (t.descripcion || '').toLowerCase().includes(q);
        const catMatch = (t.categoria || '').toLowerCase().includes(q);
        const subMatch = (t.subcategoria || '').toLowerCase().includes(q);
        if (!descMatch && !catMatch && !subMatch) return false;
      }
      if (payerFilter !== 'ALL' && t.pagadoPor !== payerFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && t.categoria !== categoryFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [coupleTransactions, searchTerm, payerFilter, categoryFilter]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    coupleTransactions.forEach(t => {
      if (t.categoria) set.add(t.categoria);
    });
    return Array.from(set);
  }, [coupleTransactions]);

  const currentUserPaid = isUser1 ? debtInfo.user1Paid : debtInfo.user2Paid;
  const partnerPaid = isUser1 ? debtInfo.user2Paid : debtInfo.user1Paid;

  const currentUserPercent = useMemo(() => {
    if (debtInfo.totalCoupleSpent <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((currentUserPaid / debtInfo.totalCoupleSpent) * 100)));
  }, [currentUserPaid, debtInfo.totalCoupleSpent]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto font-sans pb-16">
      {/* 1. Header: Section title + Actions (Estilo idéntico a Movimientos / Vencimientos) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <p className="text-sm text-gray-400">Balance & Cuentas</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cuenta Compartida</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCoupleSettings && (
            <button
              type="button"
              onClick={onOpenCoupleSettings}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-purple-50/50 text-slate-700 hover:text-[#6F2EC5] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="Vincular dispositivo de tu pareja o configurar división"
            >
              <Link2 className="w-3.5 h-3.5 text-[#6936F5]" />
              <span>{partnerConnected ? 'Pareja sincronizada' : 'Vincular Pareja'}</span>
            </button>
          )}

          {onOpenMonthlyReport && (
            <button
              type="button"
              onClick={onOpenMonthlyReport}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-purple-50/50 text-slate-700 hover:text-[#6F2EC5] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="Copiar liquidación para WhatsApp o descargar reporte"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>WhatsApp / Cierre</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettlementModal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-purple-50/50 text-slate-700 hover:text-[#6F2EC5] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Liquidar o registrar pagos entre ambos"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>Liquidar Cuentas</span>
          </button>

          <button
            type="button"
            onClick={onOpenTransactionModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 bg-[#6936F5] hover:bg-[#5b2bd9]"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Balance Card (Unified GastoAR style — Zero Circular Gauge) */}
      <div
        style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D3FEA 55%, #7C3AED 100%)' }}
        className="text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-purple-300/30 relative overflow-hidden"
      >
        <div className="w-full">
          <p className="text-xs sm:text-sm font-medium text-white/80 mb-1.5 tracking-wide">
            Saldo total compartido
          </p>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-[32px] sm:text-4xl font-black font-outfit text-white tracking-tight leading-none truncate">
              {formatCurrency(debtInfo.totalCoupleSpent, profile.currency)}
            </h2>
            {profile.accountCode && (
              <span className="text-xs text-white/80 font-mono">
                Sala: {profile.accountCode}
              </span>
            )}
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-3 bg-white/20">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#FFA234] via-[#F97316] to-[#F95420]"
              style={{ 
                width: `${Math.min(100, Math.max(debtInfo.totalCoupleSpent > 0 ? 5 : 0, currentUserPercent))}%`, 
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/85 flex-wrap">
            <span>{currentUserName}:{" "}
              <span className="font-semibold text-white">{formatCurrency(currentUserPaid, profile.currency)}</span>
            </span>
            <span>•</span>
            <span>{partnerName}:{" "}
              <span className="font-semibold text-emerald-300">{formatCurrency(partnerPaid, profile.currency)}</span>
            </span>
            <span>•</span>
            <span>{coupleTransactions.length} movimientos en común</span>
          </div>
        </div>
      </div>

      {/* 3. NET SETTLEMENT STATUS BANNER */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-xs ${
        isEven
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : currentUserOwes
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : 'bg-purple-50/70 border-purple-200 text-purple-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isEven
                ? 'bg-emerald-100 text-emerald-700'
                : currentUserOwes
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-purple-100 text-[#6F2EC5]'
            }`}>
              {isEven ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : currentUserOwes ? (
                <ArrowUpRight className="w-6 h-6" />
              ) : (
                <ArrowDownLeft className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                Estado de Cuentas
              </span>
              <h3 className="font-extrabold text-base leading-tight">
                {isEven
                  ? '¡Todo equilibrado! Ninguno le debe nada al otro.'
                  : currentUserOwes
                    ? `Le debes transferir a ${partnerName}:`
                    : `Saldo a favor con ${partnerName}:`}
              </h3>
            </div>
          </div>

          {!isEven && (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className={`text-2xl font-black font-outfit ${
                currentUserOwes ? 'text-rose-600' : 'text-[#6F2EC5]'
              }`}>
                {formatCurrency(debtInfo.debtAmount, profile.currency)}
              </span>
              <button
                type="button"
                onClick={onOpenSettlementModal}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-800 border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                Saldar ahora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. 4 KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Compartido */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Compartido
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-outfit">
            {formatCurrency(debtInfo.totalCoupleSpent, profile.currency)}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">En común este período</p>
        </div>

        {/* User 1 Paid */}
        <div className={`p-4 rounded-3xl border shadow-2xs ${isUser1 ? 'bg-purple-50/40 border-purple-200' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {profile.user1Name} {isUser1 && '(Tú)'}
            </span>
            <User className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-outfit">
            {formatCurrency(debtInfo.user1Paid, profile.currency)}
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Le correspondía: {formatCurrency(debtInfo.user1ShouldPay, profile.currency)}
          </p>
        </div>

        {/* User 2 Paid */}
        <div className={`p-4 rounded-3xl border shadow-2xs ${!isUser1 ? 'bg-purple-50/40 border-purple-200' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {profile.user2Name} {!isUser1 && '(Tú)'}
            </span>
            <User className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-outfit">
            {formatCurrency(debtInfo.user2Paid, profile.currency)}
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Le correspondía: {formatCurrency(debtInfo.user2ShouldPay, profile.currency)}
          </p>
        </div>

        {/* Balance Neto */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Diferencia a Ajustar
          </span>
          <span className={`text-xl sm:text-2xl font-black font-outfit ${isEven ? 'text-emerald-600' : 'text-[#6F2EC5]'}`}>
            {isEven ? '$ 0' : formatCurrency(debtInfo.debtAmount, profile.currency)}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isEven ? 'Equilibrio total' : currentUserOwes ? 'Saldo a pagar' : 'Saldo a favor'}
          </p>
        </div>
      </div>

      {/* 4. FILTERS & SEARCH BAR (Exact styling of TransactionsTable) */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en gastos compartidos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Payer Filter */}
            <select
              value={payerFilter}
              onChange={e => setPayerFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="ALL">Pagado por: Ambos</option>
              <option value="user1">Pagó {profile.user1Name}</option>
              <option value="user2">Pagó {profile.user2Name}</option>
            </select>

            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="ALL">Todas las categorías</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* 5. COUPLE TRANSACTIONS LIST */}
      <section className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden space-y-4">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#6F2EC5]" />
              <span>Gastos de Cuenta Compartida</span>
            </h2>
            <span className="bg-purple-50 text-[#6F2EC5] text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
              {filteredCoupleTransactions.length} registros
            </span>
          </div>
        </div>

        {filteredCoupleTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredCoupleTransactions.map(tx => {
              const whoPaid = tx.pagadoPor === 'user1' ? profile.user1Name : profile.user2Name;
              const isCurrentUserPayer = 
                (isUser1 && tx.pagadoPor === 'user1') || (!isUser1 && tx.pagadoPor === 'user2');
              const catColor = categoryColors[tx.categoria] || '#6F2EC5';
              const halfAmount = tx.monto / 2;

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Date, Category & Description */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-2.5 h-10 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: catColor }}
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-semibold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateEs(tx.fecha)}
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded-full text-[11px] font-bold border"
                          style={{
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                            borderColor: `${catColor}30`,
                          }}
                        >
                          {tx.categoria}
                        </span>
                        {tx.subcategoria && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            • {tx.subcategoria}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-sm text-slate-900 truncate">
                        {tx.descripcion}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Pagó: <strong className="text-slate-700">{whoPaid} {isCurrentUserPayer && '(Tú)'}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          División 50/50
                        </span>
                        {tx.metodoPago && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{tx.metodoPago}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amounts & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-base sm:text-lg font-black text-slate-900 font-outfit block">
                        {formatCurrency(tx.monto, profile.currency)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Tu parte: <strong>{formatCurrency(halfAmount, profile.currency)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {onEditTransaction && (
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#6F2EC5] hover:bg-purple-50 transition-colors cursor-pointer"
                          title="Editar gasto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteTransaction && (
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6F2EC5] flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">No hay gastos compartidos que coincidan</h4>
              <p className="text-xs text-slate-500">
                Los gastos que registres como compartidos aparecerán detallados aquí para calcular los reembolsos.
              </p>
            </div>
            <button
              onClick={onOpenTransactionModal}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs cursor-pointer shadow-xs"
              style={{ backgroundColor: P }}
            >
              + Registrar Gasto Compartido
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
