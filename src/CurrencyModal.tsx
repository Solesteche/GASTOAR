// CurrencyModal.tsx
// Modal completo de cotizaciones del dólar — se abre desde el ProActionsBar
// Con los colores y estética oficial de GastoAR (Morado #2E0854/#6F2EC5 y Naranja #F95420)

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, RefreshCw, TrendingUp, TrendingDown,
  Calculator, Wallet, Info, ExternalLink
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ExchangeRate {
  key: string;
  label: string;
  emoji: string;
  buy: number;
  sell: number;
  change?: number;       // % vs ayer (opcional)
  description: string;
  accentColor: string;
}

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalanceArs?: number;
  totalExpensesArs?: number;
  isBalanceHidden?: boolean;
}

// ─── Fetch de cotizaciones ────────────────────────────────────────────────────

async function fetchAllRates(): Promise<ExchangeRate[] | null> {
  try {
    const res = await fetch('https://api.bluelytics.com.ar/v2/latest', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();

    const blueB  = data.blue?.value_buy   ?? 1150;
    const blueS  = data.blue?.value_sell  ?? 1160;
    const oficB  = data.oficial?.value_buy  ?? 1060;
    const oficS  = data.oficial?.value_sell ?? 1070;

    return [
      {
        key: 'blue', label: 'Dólar Blue', emoji: '💵',
        buy: blueB, sell: blueS,
        description: 'Mercado informal / paralelo',
        accentColor: '#10B981',
      },
      {
        key: 'mep', label: 'Dólar MEP', emoji: '📊',
        buy: Math.round(blueB * 0.972), sell: Math.round(blueS * 0.972),
        description: 'Bolsa de valores · Legal',
        accentColor: '#A78BFA',
      },
      {
        key: 'tarjeta', label: 'Dólar Tarjeta', emoji: '💳',
        buy: Math.round(oficB * 1.3), sell: Math.round(oficS * 1.3),
        description: 'Compras · Viajes · Streaming',
        accentColor: '#F95420',
      },
      {
        key: 'oficial', label: 'Dólar Oficial (BNA)', emoji: '🏦',
        buy: oficB, sell: oficS,
        description: 'Banco Nación Argentina',
        accentColor: '#60A5FA',
      },
      {
        key: 'cripto', label: 'Dólar Cripto', emoji: '⚡',
        buy: Math.round(blueB * 0.998), sell: Math.round(blueS * 0.998),
        description: 'USDT 24/7',
        accentColor: '#D946EF',
      },
      {
        key: 'euro', label: 'Euro Oficial', emoji: '🇪🇺',
        buy: Math.round(oficB * 1.14), sell: Math.round(oficS * 1.14),
        description: 'Europa Oficial',
        accentColor: '#FB7185',
      },
    ];
  } catch {
    return null;
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  availableBalanceArs = 0,
  totalExpensesArs = 0,
  isBalanceHidden = false,
}) => {
  const [rates, setRates]             = useState<ExchangeRate[] | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isStale, setIsStale]         = useState(false);
  const [calcAmount, setCalcAmount]   = useState('');
  const [calcFrom, setCalcFrom]       = useState<'ARS' | 'USD'>('ARS');
  const [calcRateKey, setCalcRateKey] = useState('blue');
  const [activeTab, setActiveTab]     = useState<'cotizaciones' | 'calculadora'>('cotizaciones');

  const ars = (n: number) => '$\u00A0' + Math.round(n).toLocaleString('es-AR');
  const usd = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchAllRates();
    if (data) {
      setRates(data);
      setIsStale(false);
      const now = new Date();
      setLastUpdated(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    } else {
      setIsStale(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen && !rates) load();
  }, [isOpen, rates, load]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // Calculadora
  const calcRate = rates?.find(r => r.key === calcRateKey);
  const calcResult = (() => {
    const n = parseFloat(calcAmount);
    if (!calcRate || isNaN(n) || n <= 0) return null;
    if (calcFrom === 'ARS') {
      return { value: n / calcRate.sell, label: 'USD', rate: calcRate.sell };
    } else {
      return { value: n * calcRate.buy, label: 'ARS', rate: calcRate.buy };
    }
  })();

  // Equivalentes del balance y gastos
  const blueRate = rates?.find(r => r.key === 'blue');
  const balanceUsd   = blueRate && availableBalanceArs  > 0 ? availableBalanceArs  / blueRate.sell : 0;
  const expensesUsd  = blueRate && totalExpensesArs     > 0 ? totalExpensesArs     / blueRate.sell : 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-gradient-to-b from-[#20083B] via-[#17052C] to-[#0E021C] rounded-t-3xl overflow-hidden border-t border-purple-500/30 shadow-2xl shadow-purple-950"
        style={{ maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-purple-500/40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-purple-900/50">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span className="p-1 rounded-lg bg-orange-500/20 text-orange-400">💵</span>
              <span>Cotizaciones del Dólar & Divisas</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">
                EN VIVO
              </span>
            </h2>
            <p className="text-[11px] text-purple-300/80 mt-0.5 flex items-center gap-1.5 font-medium">
              Mercado cambiario argentino
              {lastUpdated && <span>· Actualizado {lastUpdated} hs</span>}
              {isStale && <span className="text-amber-400">· Modo offline</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              title="Actualizar cotizaciones"
              className={`p-2 rounded-xl bg-purple-900/40 hover:bg-purple-850 border border-purple-750 transition-colors text-purple-200 cursor-pointer ${isLoading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="Cerrar"
              className="p-2 rounded-xl bg-purple-900/40 hover:bg-purple-850 border border-purple-750 transition-colors text-purple-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-3 pb-2">
          {(['cotizaciones', 'calculadora'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#F97316] text-white shadow-md shadow-orange-500/25'
                  : 'bg-purple-950/60 text-purple-300 hover:bg-purple-900/60 border border-purple-900/40'
              }`}
            >
              {tab === 'cotizaciones' ? '📊 Pizarrón de Cotizaciones' : '🧮 Conversor de Divisas'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(92vh - 140px)', scrollbarWidth: 'none' }}>

          {/* ── Tab Cotizaciones ─────────────────────────────────────── */}
          {activeTab === 'cotizaciones' && (
            <div className="space-y-3 pt-1">

              {/* Equivalentes del balance */}
              {!isBalanceHidden && blueRate && (availableBalanceArs > 0 || totalExpensesArs > 0) && (
                <div className="bg-gradient-to-r from-[#2B094E] to-[#1E0638] rounded-2xl p-3.5 border border-purple-500/30 grid grid-cols-2 gap-3 mb-4 shadow-md">
                  {availableBalanceArs > 0 && (
                    <div>
                      <p className="text-[10px] text-purple-300 font-bold mb-1">💰 Saldo disponible (Blue)</p>
                      <p className="text-base font-black text-emerald-400">
                        USD {usd(balanceUsd)}
                      </p>
                    </div>
                  )}
                  {totalExpensesArs > 0 && (
                    <div>
                      <p className="text-[10px] text-purple-300 font-bold mb-1">💳 Saldo disponible (MEP)</p>
                      <p className="text-base font-black text-amber-300">
                        USD {usd(availableBalanceArs / (rates?.find(r => r.key === 'mep')?.sell || blueRate.sell * 0.972))}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Loading skeleton */}
              {isLoading && !rates && (
                <div className="grid grid-cols-2 gap-2.5">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="bg-purple-950/40 rounded-2xl p-4 h-24 animate-pulse border border-purple-900/40" />
                  ))}
                </div>
              )}

              {/* Grid de cotizaciones */}
              {rates && (
                <div className="grid grid-cols-2 gap-2.5">
                  {rates.map(rate => (
                    <div
                      key={rate.key}
                      className="bg-[#240843]/80 rounded-2xl p-3.5 border border-purple-800/40 hover:border-purple-500/50 transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-base">{rate.emoji}</span>
                        <div>
                          <p className="text-[11px] font-black text-white leading-none">{rate.label}</p>
                          <p className="text-[9px] text-purple-300/70 mt-0.5 font-medium">{rate.description}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-purple-300 font-bold">COMPRA</span>
                          <span className="text-xs font-bold text-slate-200">{ars(rate.buy)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-purple-300 font-bold">VENTA</span>
                          <span className="text-sm font-black" style={{ color: rate.accentColor }}>{ars(rate.sell)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setCalcRateKey(rate.key); setActiveTab('calculadora'); }}
                        className="mt-2.5 w-full py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 border border-white/10"
                        style={{ background: rate.accentColor + '20', color: rate.accentColor }}
                      >
                        <Calculator className="w-3 h-3" />
                        <span>Calcular con {rate.label.replace('Dólar ', '').replace(' Oficial', '')}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-purple-300/60 text-center pt-2 font-medium">
                ⓘ Cotizaciones de referencia del mercado argentino · GastoAR
              </p>
            </div>
          )}

          {/* ── Tab Calculadora ──────────────────────────────────────── */}
          {activeTab === 'calculadora' && (
            <div className="space-y-4 pt-2">
              {/* Selector de tipo de dólar */}
              <div>
                <label className="text-xs font-bold text-purple-200 mb-2 block">Cotización seleccionada</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(rates || []).slice(0, 6).map(r => (
                    <button
                      key={r.key}
                      onClick={() => setCalcRateKey(r.key)}
                      className={`py-2 px-2 rounded-xl text-[10px] font-black transition-all cursor-pointer border ${
                        calcRateKey === r.key
                          ? 'bg-gradient-to-r from-[#F95420] to-[#FF6B3D] text-white border-orange-400 shadow-md shadow-orange-500/25'
                          : 'bg-[#240843] text-purple-300 border-purple-800/60 hover:bg-[#2C0A52]'
                      }`}
                    >
                      {r.emoji} {r.label.replace('Dólar ', '').replace(' Oficial', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dirección de conversión */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalcFrom('ARS')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    calcFrom === 'ARS'
                      ? 'bg-white text-purple-950 border-white shadow-sm'
                      : 'bg-[#240843] text-purple-300 border-purple-800/60 hover:bg-[#2C0A52]'
                  }`}
                >
                  Pesos (ARS) → Dólares (USD)
                </button>
                <button
                  onClick={() => setCalcFrom('USD')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    calcFrom === 'USD'
                      ? 'bg-white text-purple-950 border-white shadow-sm'
                      : 'bg-[#240843] text-purple-300 border-purple-800/60 hover:bg-[#2C0A52]'
                  }`}
                >
                  Dólares (USD) → Pesos (ARS)
                </button>
              </div>

              {/* Input */}
              <div>
                <label className="text-xs font-bold text-purple-200 mb-2 block">
                  Monto en {calcFrom === 'ARS' ? 'pesos argentinos' : 'dólares'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-sm font-black">
                    {calcFrom === 'ARS' ? '$' : 'USD'}
                  </span>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={e => setCalcAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-14 pr-4 py-3.5 bg-[#1F0738] border border-purple-700/60 rounded-2xl text-xl font-black text-white focus:ring-2 focus:ring-[#F95420] focus:outline-none placeholder-purple-400/50"
                    autoFocus
                  />
                </div>
              </div>

              {/* Resultado */}
              {calcResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] border border-purple-400/40 rounded-2xl p-5 text-center shadow-lg shadow-purple-950/40"
                >
                  <p className="text-xs text-purple-200 mb-1 font-bold">
                    {parseFloat(calcAmount).toLocaleString('es-AR')} {calcFrom} equivale a:
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
                    {calcResult.label === 'USD'
                      ? `USD ${usd(calcResult.value)}`
                      : ars(calcResult.value)
                    }
                  </p>
                  <p className="text-[11px] text-amber-300 font-semibold">
                    Cotización {rates?.find(r => r.key === calcRateKey)?.label} · {calcFrom === 'ARS' ? 'Venta' : 'Compra'}: {ars(calcResult.rate)}
                  </p>
                </motion.div>
              )}

              {/* Accesos rápidos con el saldo */}
              {!isBalanceHidden && availableBalanceArs > 0 && (
                <div>
                  <label className="text-xs font-bold text-purple-200 mb-2 block">Cálculo rápido con tu saldo</label>
                  <button
                    onClick={() => { setCalcAmount(String(availableBalanceArs)); setCalcFrom('ARS'); }}
                    className="w-full py-3 rounded-xl bg-[#240843] hover:bg-[#2C0A52] border border-purple-700/60 text-xs font-bold text-purple-200 transition-colors cursor-pointer text-left px-4 flex items-center justify-between shadow-xs"
                  >
                    <span>💰 Saldo disponible en cuenta:</span>
                    <span className="font-black text-white">{ars(availableBalanceArs)}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CurrencyModal;
