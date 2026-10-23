import React, { useMemo, useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowLeftRight,
  Search,
  Building2,
  Banknote,
  Smartphone,
  DollarSign,
  Pencil,
  Trash2,
  X,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
} from 'lucide-react';
import {
  Transaction,
  WalletAccount,
  WalletAccountType,
  WalletTransfer,
  PaymentMethod,
} from '../types';

interface WalletsSectionProps {
  wallets: WalletAccount[];
  transfers: WalletTransfer[];
  transactions: Transaction[];
  usdRate?: number;
  onSaveWallets: (wallets: WalletAccount[]) => void;
  onSaveTransfers: (transfers: WalletTransfer[]) => void;
  onShowToast?: (msg: string) => void;
}

export const DEFAULT_WALLETS: WalletAccount[] = [
  {
    id: 'wallet_mp',
    nombre: 'Mercado Pago',
    tipo: 'billetera_virtual',
    moneda: 'ARS',
    saldoInicial: 0,
    color: '#009EE3',
    icono: 'smartphone',
    metodoPagoAsociado: 'Mercado Pago',
  },
  {
    id: 'wallet_banco',
    nombre: 'Banco / Débito',
    tipo: 'banco',
    moneda: 'ARS',
    saldoInicial: 0,
    color: '#6936F5',
    icono: 'bank',
    metodoPagoAsociado: 'Débito',
  },
  {
    id: 'wallet_efectivo',
    nombre: 'Efectivo ARS',
    tipo: 'efectivo',
    moneda: 'ARS',
    saldoInicial: 0,
    color: '#10B981',
    icono: 'cash',
    metodoPagoAsociado: 'Efectivo',
  },
  {
    id: 'wallet_usd',
    nombre: 'Caja Ahorro USD',
    tipo: 'ahorro_usd',
    moneda: 'USD',
    saldoInicial: 0,
    color: '#F59E0B',
    icono: 'usd',
  },
];

const ACCOUNT_TYPE_LABELS: Record<WalletAccountType, string> = {
  billetera_virtual: 'Billetera Virtual',
  banco: 'Banco / Débito',
  efectivo: 'Efectivo',
  ahorro_usd: 'Ahorro en USD',
};

const WALLET_COLORS = ['#6936F5', '#009EE3', '#10B981', '#F95420', '#F59E0B', '#EC4899', '#334155'];

export const computeWalletBalances = (
  wallets: WalletAccount[],
  transactions: Transaction[],
  transfers: WalletTransfer[]
) => {
  const stats = new Map<
    string,
    {
      ingresos: number;
      gastos: number;
      transferIn: number;
      transferOut: number;
      saldoActual: number;
      movCount: number;
    }
  >();

  for (const w of wallets) {
    stats.set(w.id, {
      ingresos: 0,
      gastos: 0,
      transferIn: 0,
      transferOut: 0,
      saldoActual: w.saldoInicial || 0,
      movCount: 0,
    });
  }

  for (const tx of transactions) {
    if (tx.deletedAt) continue;
    const txCurrency = tx.moneda === 'USD' ? 'USD' : 'ARS';
    let targetWallet: WalletAccount | undefined;

    if (tx.walletId) {
      targetWallet = wallets.find((w) => w.id === tx.walletId);
    } else if (tx.metodoPago && tx.metodoPago !== 'Crédito') {
      if (tx.metodoPago === 'Transferencia') {
        targetWallet =
          wallets.find((w) => w.metodoPagoAsociado === 'Transferencia' && w.moneda === txCurrency) ||
          wallets.find((w) => w.tipo === 'banco' && w.moneda === txCurrency);
      } else {
        targetWallet = wallets.find(
          (w) => w.metodoPagoAsociado === tx.metodoPago && w.moneda === txCurrency
        );
      }
    }

    if (!targetWallet) continue;
    const entry = stats.get(targetWallet.id);
    if (!entry) continue;

    const amount =
      tx.esCuotas && tx.montoCuota && tx.montoCuota > 0 ? tx.montoCuota : tx.monto || 0;

    if (tx.tipoTransaccion === 'ingreso') {
      entry.ingresos += amount;
      entry.saldoActual += amount;
    } else {
      entry.gastos += amount;
      entry.saldoActual -= amount;
    }
    entry.movCount += 1;
  }

  for (const tr of transfers) {
    const origin = stats.get(tr.origenWalletId);
    if (origin) {
      origin.transferOut += tr.montoOrigen;
      origin.saldoActual -= tr.montoOrigen;
    }
    const dest = stats.get(tr.destinoWalletId);
    if (dest) {
      dest.transferIn += tr.montoDestino;
      dest.saldoActual += tr.montoDestino;
    }
  }

  return stats;
};

export const WalletsSection: React.FC<WalletsSectionProps> = ({
  wallets,
  transfers,
  transactions,
  usdRate = 1200,
  onSaveWallets,
  onSaveTransfers,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'ARS' | 'USD'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | WalletAccountType>('ALL');

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletAccount | null>(null);
  const [walletForm, setWalletForm] = useState<{
    nombre: string;
    tipo: WalletAccountType;
    moneda: 'ARS' | 'USD';
    saldoInicial: string;
    color: string;
    metodoPagoAsociado: string;
    aliasCbu: string;
  }>({
    nombre: '',
    tipo: 'billetera_virtual',
    moneda: 'ARS',
    saldoInicial: '0',
    color: '#6936F5',
    metodoPagoAsociado: '',
    aliasCbu: '',
  });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState<{
    origenWalletId: string;
    destinoWalletId: string;
    montoOrigen: string;
    montoDestino: string;
    fecha: string;
    nota: string;
  }>({
    origenWalletId: wallets[0]?.id || '',
    destinoWalletId: wallets[1]?.id || wallets[0]?.id || '',
    montoOrigen: '',
    montoDestino: '',
    fecha: new Date().toISOString().split('T')[0],
    nota: '',
  });

  const [confirmDeleteWalletId, setConfirmDeleteWalletId] = useState<string | null>(null);

  const balanceMap = useMemo(
    () => computeWalletBalances(wallets, transactions, transfers),
    [wallets, transactions, transfers]
  );

  const summary = useMemo(() => {
    let totalArs = 0;
    let totalUsd = 0;
    for (const w of wallets) {
      const st = balanceMap.get(w.id);
      const val = st ? st.saldoActual : w.saldoInicial;
      if (w.moneda === 'USD') {
        totalUsd += val;
      } else {
        totalArs += val;
      }
    }
    const consolidatedArs = totalArs + totalUsd * (usdRate || 1200);
    const arsSharePct =
      consolidatedArs > 0
        ? Math.min(100, Math.max(0, Math.round((Math.max(0, totalArs) / consolidatedArs) * 100)))
        : 100;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTransfers = transfers.filter((t) => t.fecha.startsWith(currentMonth)).length;

    return {
      totalArs,
      totalUsd,
      consolidatedArs,
      arsSharePct,
      monthTransfers,
    };
  }, [wallets, balanceMap, usdRate, transfers]);

  const filteredWallets = useMemo(() => {
    return wallets.filter((w) => {
      if (currencyFilter !== 'ALL' && w.moneda !== currencyFilter) return false;
      if (typeFilter !== 'ALL' && w.tipo !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = w.nombre.toLowerCase().includes(q);
        const matchAlias = (w.aliasCbu || '').toLowerCase().includes(q);
        if (!matchName && !matchAlias) return false;
      }
      return true;
    });
  }, [wallets, currencyFilter, typeFilter, search]);

  const formatMoney = (amount: number, currency: 'ARS' | 'USD' = 'ARS') => {
    const prefix = currency === 'USD' ? 'US$ ' : '$ ';
    const sign = amount < 0 ? '-' : '';
    return (
      sign +
      prefix +
      Math.abs(amount).toLocaleString('es-AR', {
        minimumFractionDigits: currency === 'USD' ? 2 : 0,
        maximumFractionDigits: currency === 'USD' ? 2 : 0,
      })
    );
  };

  const openNewWalletModal = () => {
    setEditingWallet(null);
    setWalletForm({
      nombre: '',
      tipo: 'billetera_virtual',
      moneda: 'ARS',
      saldoInicial: '0',
      color: '#6936F5',
      metodoPagoAsociado: '',
      aliasCbu: '',
    });
    setIsAccountModalOpen(true);
  };

  const openEditWalletModal = (w: WalletAccount) => {
    setEditingWallet(w);
    setWalletForm({
      nombre: w.nombre,
      tipo: w.tipo,
      moneda: w.moneda,
      saldoInicial: String(w.saldoInicial || 0),
      color: w.color || '#6936F5',
      metodoPagoAsociado: w.metodoPagoAsociado || '',
      aliasCbu: w.aliasCbu || '',
    });
    setIsAccountModalOpen(true);
  };

  const handleSaveWalletForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletForm.nombre.trim()) return;
    const parsedInitial = parseFloat(walletForm.saldoInicial.replace(',', '.')) || 0;
    const iconByType: Record<WalletAccountType, string> = {
      billetera_virtual: 'smartphone',
      banco: 'bank',
      efectivo: 'cash',
      ahorro_usd: 'usd',
    };

    if (editingWallet) {
      const updated = wallets.map((w) =>
        w.id === editingWallet.id
          ? {
              ...w,
              nombre: walletForm.nombre.trim(),
              tipo: walletForm.tipo,
              moneda: walletForm.moneda,
              saldoInicial: parsedInitial,
              color: walletForm.color,
              icono: iconByType[walletForm.tipo],
              metodoPagoAsociado: (walletForm.metodoPagoAsociado as PaymentMethod) || undefined,
              aliasCbu: walletForm.aliasCbu.trim() || undefined,
            }
          : w
      );
      onSaveWallets(updated);
      onShowToast?.(`Cuenta "${walletForm.nombre.trim()}" actualizada`);
    } else {
      const created: WalletAccount = {
        id: `wallet_${Date.now()}`,
        nombre: walletForm.nombre.trim(),
        tipo: walletForm.tipo,
        moneda: walletForm.moneda,
        saldoInicial: parsedInitial,
        color: walletForm.color,
        icono: iconByType[walletForm.tipo],
        metodoPagoAsociado: (walletForm.metodoPagoAsociado as PaymentMethod) || undefined,
        aliasCbu: walletForm.aliasCbu.trim() || undefined,
      };
      onSaveWallets([...wallets, created]);
      onShowToast?.(`Cuenta "${created.nombre}" creada`);
    }
    setIsAccountModalOpen(false);
  };

  const handleDeleteWallet = (id: string) => {
    const target = wallets.find((w) => w.id === id);
    onSaveWallets(wallets.filter((w) => w.id !== id));
    setConfirmDeleteWalletId(null);
    onShowToast?.(`Cuenta "${target?.nombre || ''}" eliminada`);
  };

  const openTransferModal = (preselectedOriginId?: string) => {
    const originId = preselectedOriginId || wallets[0]?.id || '';
    const fallbackDest = wallets.find((w) => w.id !== originId)?.id || originId;
    setTransferForm({
      origenWalletId: originId,
      destinoWalletId: fallbackDest,
      montoOrigen: '',
      montoDestino: '',
      fecha: new Date().toISOString().split('T')[0],
      nota: '',
    });
    setIsTransferModalOpen(true);
  };

  const originWallet = wallets.find((w) => w.id === transferForm.origenWalletId);
  const destWallet = wallets.find((w) => w.id === transferForm.destinoWalletId);
  const isCrossCurrency =
    originWallet && destWallet && originWallet.moneda !== destWallet.moneda;

  const handleOriginAmountChange = (val: string) => {
    const num = parseFloat(val.replace(',', '.')) || 0;
    let nextDest = val;
    if (isCrossCurrency && num > 0 && usdRate > 0) {
      if (originWallet?.moneda === 'ARS' && destWallet?.moneda === 'USD') {
        nextDest = (num / usdRate).toFixed(2);
      } else if (originWallet?.moneda === 'USD' && destWallet?.moneda === 'ARS') {
        nextDest = Math.round(num * usdRate).toString();
      }
    }
    setTransferForm((prev) => ({
      ...prev,
      montoOrigen: val,
      montoDestino: isCrossCurrency ? nextDest : val,
    }));
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originWallet || !destWallet) return;
    if (originWallet.id === destWallet.id) {
      onShowToast?.('Elegí una cuenta de destino distinta a la de origen');
      return;
    }
    const montoOrig = parseFloat(transferForm.montoOrigen.replace(',', '.')) || 0;
    const montoDest = isCrossCurrency
      ? parseFloat(transferForm.montoDestino.replace(',', '.')) || 0
      : montoOrig;
    if (montoOrig <= 0 || montoDest <= 0) return;

    const newTransfer: WalletTransfer = {
      id: `tr_${Date.now()}`,
      origenWalletId: originWallet.id,
      destinoWalletId: destWallet.id,
      montoOrigen: montoOrig,
      monedaOrigen: originWallet.moneda,
      montoDestino: montoDest,
      monedaDestino: destWallet.moneda,
      fecha: transferForm.fecha || new Date().toISOString().split('T')[0],
      nota: transferForm.nota.trim() || undefined,
      createdAt: Date.now(),
    };

    onSaveTransfers([newTransfer, ...transfers]);
    setIsTransferModalOpen(false);
    onShowToast?.(
      `Transferencia registrada: ${originWallet.nombre} → ${destWallet.nombre}`
    );
  };

  const handleDeleteTransfer = (id: string) => {
    onSaveTransfers(transfers.filter((t) => t.id !== id));
    onShowToast?.('Transferencia revertida');
  };

  const renderWalletIcon = (tipo: WalletAccountType) => {
    switch (tipo) {
      case 'billetera_virtual':
        return <Smartphone className="w-5 h-5 text-white" />;
      case 'banco':
        return <Building2 className="w-5 h-5 text-white" />;
      case 'efectivo':
        return <Banknote className="w-5 h-5 text-white" />;
      case 'ahorro_usd':
        return <DollarSign className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans pb-16">
      {/* Unified Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <p className="text-sm text-gray-400">Liquidez real por medio de pago</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Cuentas y Billeteras
          </h1>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => openTransferModal()}
            disabled={wallets.length < 2}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#6936F5]" />
            <span>Transferir</span>
          </button>
          <button
            type="button"
            onClick={openNewWalletModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6936F5] hover:bg-[#5b2bd9] text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>

      {/* Unified Full-Width Purple Hero Card (Zero Circular Gauges) */}
      <div
        className="rounded-3xl p-6 sm:p-7 text-white shadow-sm relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4C1D95 0%, #6D3FEA 55%, #7C3AED 100%)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70 mb-1">
              Patrimonio Líquido Consolidado (ARS + USD)
            </p>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
              {formatMoney(summary.consolidatedArs, 'ARS')}
            </div>
            <p className="text-xs text-white/75 mt-1">
              Calculado automáticamente según saldo inicial, ingresos, gastos y transferencias propias
            </p>
          </div>
          <div className="flex sm:flex-col items-start sm:items-end gap-3 sm:gap-1 text-right">
            <div>
              <span className="text-[11px] text-white/65 block">Pesos disponibles</span>
              <span className="text-base font-bold tabular-nums">
                {formatMoney(summary.totalArs, 'ARS')}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-white/65 block">Ahorro en dólares</span>
              <span className="text-base font-bold tabular-nums text-amber-300">
                {formatMoney(summary.totalUsd, 'USD')}
              </span>
            </div>
          </div>
        </div>

        {/* Thin Horizontal Orange Distribution Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] text-white/75 mb-1.5">
            <span>Composición Pesos ({summary.arsSharePct}%)</span>
            <span>Dólares valorizados a ${usdRate.toLocaleString('es-AR')} ({100 - summary.arsSharePct}%)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FFA234] via-[#F97316] to-[#F95420] transition-all duration-500"
              style={{ width: `${summary.arsSharePct}%` }}
            />
          </div>
        </div>

        {/* Clean Unboxed Dot-Separated Summary Metrics */}
        <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/85">
          <span>{wallets.length} cuentas activas</span>
          <span aria-hidden="true">•</span>
          <span>{summary.monthTransfers} transferencias este mes</span>
          <span aria-hidden="true">•</span>
          <span>Las transferencias propias no inflan tus gastos</span>
        </div>
      </div>

      {/* Reduced Compact Filter Bar */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cuenta o alias/CBU..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6936F5]/25 focus:border-[#6936F5]"
            />
          </div>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as 'ALL' | 'ARS' | 'USD')}
            aria-label="Filtrar por moneda"
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#6936F5]/25"
          >
            <option value="ALL">Todas las monedas</option>
            <option value="ARS">Solo ARS ($)</option>
            <option value="USD">Solo USD (US$)</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'ALL' | WalletAccountType)}
            aria-label="Filtrar por tipo de cuenta"
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#6936F5]/25"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="billetera_virtual">Billetera Virtual</option>
            <option value="banco">Banco / Débito</option>
            <option value="efectivo">Efectivo</option>
            <option value="ahorro_usd">Ahorro en USD</option>
          </select>
        </div>
      </div>

      {/* Wallet Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredWallets.map((w) => {
          const st = balanceMap.get(w.id) || {
            ingresos: 0,
            gastos: 0,
            transferIn: 0,
            transferOut: 0,
            saldoActual: w.saldoInicial,
            movCount: 0,
          };
          const isConfirmingDelete = confirmDeleteWalletId === w.id;

          return (
            <div
              key={w.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: w.color || '#6936F5' }}
                  >
                    {renderWalletIcon(w.tipo)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">{w.nombre}</h3>
                    <p className="text-xs text-slate-500 truncate">
                      {ACCOUNT_TYPE_LABELS[w.tipo]} · {w.moneda}
                      {w.metodoPagoAsociado ? ` · Vinculada a ${w.metodoPagoAsociado}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openTransferModal(w.id)}
                    title="Transferir desde esta cuenta"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#6936F5] hover:bg-purple-50 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditWalletModal(w)}
                    title="Editar saldo inicial o datos"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteWallet(w.id)}
                        className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-semibold"
                      >
                        Borrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteWalletId(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteWalletId(w.id)}
                      title="Eliminar cuenta"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div
                  className={`text-2xl font-extrabold tabular-nums tracking-tight ${
                    st.saldoActual < 0 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {formatMoney(st.saldoActual, w.moneda)}
                </div>
                {w.aliasCbu && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(w.aliasCbu || '');
                      onShowToast?.(`Alias/CBU copiado: ${w.aliasCbu}`);
                    }}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#6936F5] transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span className="truncate max-w-[220px]">{w.aliasCbu}</span>
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>Inicial: {formatMoney(w.saldoInicial, w.moneda)}</span>
                <div className="flex items-center gap-2.5 tabular-nums">
                  <span className="text-emerald-600 font-medium">
                    +{formatMoney(st.ingresos + st.transferIn, w.moneda)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-600 font-medium">
                    -{formatMoney(st.gastos + st.transferOut, w.moneda)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfers History */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Transferencias entre cuentas propias
            </h2>
            <p className="text-xs text-slate-500">
              Mové plata del banco a Mercado Pago, efectivo o compra de USD sin duplicar gastos
            </p>
          </div>
          <button
            type="button"
            onClick={() => openTransferModal()}
            disabled={wallets.length < 2}
            className="text-xs font-semibold text-[#6936F5] hover:underline disabled:opacity-50"
          >
            + Registrar pase
          </button>
        </div>

        {transfers.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Todavía no registraste pases entre tus cuentas.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transfers.slice(0, 12).map((tr) => {
              const orig = wallets.find((w) => w.id === tr.origenWalletId);
              const dest = wallets.find((w) => w.id === tr.destinoWalletId);
              return (
                <div
                  key={tr.id}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#6936F5] flex items-center justify-center shrink-0">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {orig?.nombre || 'Cuenta origen'} → {dest?.nombre || 'Cuenta destino'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {tr.fecha}
                        {tr.nota ? ` · ${tr.nota}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right tabular-nums">
                      <span className="font-bold text-slate-900 block">
                        {formatMoney(tr.montoOrigen, tr.monedaOrigen)}
                      </span>
                      {tr.monedaOrigen !== tr.monedaDestino && (
                        <span className="text-xs text-emerald-600 font-medium block">
                          → {formatMoney(tr.montoDestino, tr.monedaDestino)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTransfer(tr.id)}
                      title="Revertir transferencia"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Wallet Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingWallet ? 'Editar Cuenta' : 'Nueva Cuenta o Billetera'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWalletForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre de la cuenta
                </label>
                <input
                  type="text"
                  required
                  value={walletForm.nombre}
                  onChange={(e) => setWalletForm({ ...walletForm, nombre: e.target.value })}
                  placeholder="Ej: Brubank, Galicia Sueldo, Efectivo Casa..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6936F5]/25 focus:border-[#6936F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo de cuenta
                  </label>
                  <select
                    value={walletForm.tipo}
                    onChange={(e) => {
                      const nextTipo = e.target.value as WalletAccountType;
                      setWalletForm({
                        ...walletForm,
                        tipo: nextTipo,
                        moneda: nextTipo === 'ahorro_usd' ? 'USD' : walletForm.moneda,
                      });
                    }}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="billetera_virtual">Billetera Virtual</option>
                    <option value="banco">Banco / Débito</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="ahorro_usd">Caja Ahorro USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Moneda
                  </label>
                  <select
                    value={walletForm.moneda}
                    onChange={(e) =>
                      setWalletForm({ ...walletForm, moneda: e.target.value as 'ARS' | 'USD' })
                    }
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="ARS">Pesos (ARS)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Saldo inicial base
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={walletForm.saldoInicial}
                    onChange={(e) =>
                      setWalletForm({ ...walletForm, saldoInicial: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Medio automático
                  </label>
                  <select
                    value={walletForm.metodoPagoAsociado}
                    onChange={(e) =>
                      setWalletForm({ ...walletForm, metodoPagoAsociado: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Manual al cargar</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Débito">Débito</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Alias o CBU/CVU (opcional, para copiar en 1 toque)
                </label>
                <input
                  type="text"
                  value={walletForm.aliasCbu}
                  onChange={(e) => setWalletForm({ ...walletForm, aliasCbu: e.target.value })}
                  placeholder="Ej: mi.alias.mp"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Color identificador
                </label>
                <div className="flex items-center gap-2">
                  {WALLET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWalletForm({ ...walletForm, color: c })}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        walletForm.color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {walletForm.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#6936F5] hover:bg-[#5b2bd9] text-white shadow-sm"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Between Wallets Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Transferir entre cuentas</h3>
                <p className="text-xs text-slate-500">
                  No suma como gasto ni ingreso mensual
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Sale de
                  </label>
                  <select
                    value={transferForm.origenWalletId}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, origenWalletId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nombre} ({w.moneda})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Entra en
                  </label>
                  <select
                    value={transferForm.destinoWalletId}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, destinoWalletId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nombre} ({w.moneda})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Monto que sale ({originWallet?.moneda || 'ARS'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={transferForm.montoOrigen}
                    onChange={(e) => handleOriginAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                  />
                </div>

                {isCrossCurrency ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Monto que acredita ({destWallet?.moneda})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={transferForm.montoDestino}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, montoDestino: e.target.value })
                      }
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={transferForm.fecha}
                      onChange={(e) => setTransferForm({ ...transferForm, fecha: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                )}
              </div>

              {isCrossCurrency && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={transferForm.fecha}
                    onChange={(e) => setTransferForm({ ...transferForm, fecha: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nota (opcional)
                </label>
                <input
                  type="text"
                  value={transferForm.nota}
                  onChange={(e) => setTransferForm({ ...transferForm, nota: e.target.value })}
                  placeholder="Ej: Fondeo Mercado Pago / Compra MEP"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#6936F5] hover:bg-[#5b2bd9] text-white shadow-sm"
                >
                  Confirmar Pase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
