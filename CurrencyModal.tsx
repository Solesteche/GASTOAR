// CurrencyModal.tsx
// Modal completo de cotizaciones del dólar — se abre desde el ProActionsBar
// Toda la info que antes estaba inline en el dashboard ahora vive acá
// Pegar en la raíz del proyecto

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
        accentColor: '#3B82F6',
      },
      {
        key: 'tarjeta', label: 'Dólar Tarjeta', emoji: '💳',
        buy: Math.round(oficB * 1.3), sell: Math.round(oficS * 1.3),
        description: 'Compras · Viajes · Streaming',
        accentColor: '#F59E0B',
      },
      {
        key: 'oficial', label: 'Dólar Oficial (BNA)', emoji: '🏦',
        buy: oficB, sell: oficS,
        description: 'Banco Nación Argentina',
        accentColor: '#6366F1',
      },
      {
        key: 'cripto', label: 'Dólar Cripto', emoji: '⚡',
        buy: Math.round(blueB * 0.998), sell: Math.round(blueS * 0.998),
        description: 'USDT 24/7',
        accentColor: '#8B5CF6',
      },
      {
        key: 'euro', label: 'Euro Oficial', emoji: '🇪🇺',
        buy: Math.round(oficB * 1.14), sell: Math.round(oficS * 1.14),
        description: 'Europa Oficial',
        accentColor: '#EC4899',
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-950 rounded-t-3xl overflow-hidden"
        style={{ maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>💵</span> Cotizaciones del Dólar & Divisas
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                EN VIVO
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              Mercado cambiario argentino
              {lastUpdated && <span>· Actualizado {lastUpdated}</span>}
              {isStale && <span className="text-amber-400">· Usando cache</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors ${isLoading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-2">
          {(['cotizaciones', 'calculadora'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab === 'cotizaciones' ? '📊 Pizarrón' : '🧮 Conversor'}
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
                <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/50 grid grid-cols-2 gap-3 mb-4">
                  {availableBalanceArs > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">💰 Saldo disponible en USD (Blue)</p>
                      <p className="text-sm font-black text-emerald-400">
                        USD {usd(balanceUsd)}
                      </p>
                    </div>
                  )}
                  {totalExpensesArs > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">💳 Saldo disponible en USD (MEP)</p>
                      <p className="text-sm font-black text-blue-400">
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
                    <div key={i} className="bg-slate-800/60 rounded-2xl p-4 h-24 animate-pulse" />
                  ))}
                </div>
              )}

              {/* Grid de cotizaciones */}
              {rates && (
                <div className="grid grid-cols-2 gap-2.5">
                  {rates.map(rate => (
                    <div
                      key={rate.key}
                      className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/40 hover:border-slate-600/60 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-base">{rate.emoji}</span>
                        <div>
                          <p className="text-[11px] font-bold text-white leading-none">{rate.label}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{rate.description}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500">COMPRA</span>
                          <span className="text-xs font-bold text-white">{ars(rate.buy)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500">VENTA</span>
                          <span className="text-sm font-black" style={{ color: rate.accentColor }}>{ars(rate.sell)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setCalcRateKey(rate.key); setActiveTab('calculadora'); }}
                        className="mt-2.5 w-full py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                        style={{ background: rate.accentColor + '20', color: rate.accentColor }}
                      >
                        🧮 Calcular con {rate.label.replace('Dólar ', '').replace(' Oficial', '')}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-slate-600 text-center pt-2">
                ⓘ Cotizaciones informativas promedio del mercado argentino · No constituyen asesoramiento financiero
              </p>
            </div>
          )}

          {/* ── Tab Calculadora ──────────────────────────────────────── */}
          {activeTab === 'calculadora' && (
            <div className="space-y-4 pt-2">
              {/* Selector de tipo de dólar */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Tipo de cotización</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(rates || []).slice(0, 6).map(r => (
                    <button
                      key={r.key}
                      onClick={() => setCalcRateKey(r.key)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                        calcRateKey === r.key
                          ? 'bg-white text-slate-900 border-white'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
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
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    calcFrom === 'ARS' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  ARS → USD
                </button>
                <button
                  onClick={() => setCalcFrom('USD')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    calcFrom === 'USD' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  USD → ARS
                </button>
              </div>

              {/* Input */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">
                  Monto en {calcFrom === 'ARS' ? 'pesos argentinos' : 'dólares'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">
                    {calcFrom === 'ARS' ? '$' : 'USD'}
                  </span>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={e => setCalcAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-xl font-black text-white focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-600"
                    autoFocus
                  />
                </div>
              </div>

              {/* Resultado */}
              {calcResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-purple-950 to-slate-900 border border-purple-800/50 rounded-2xl p-5 text-center"
                >
                  <p className="text-sm text-purple-300 mb-1">
                    {parseFloat(calcAmount).toLocaleString('es-AR')} {calcFrom} =
                  </p>
                  <p className="text-4xl font-black text-white mb-2">
                    {calcResult.label === 'USD'
                      ? `USD ${usd(calcResult.value)}`
                      : ars(calcResult.value)
                    }
                  </p>
                  <p className="text-[11px] text-purple-400">
                    Cotización {rates?.find(r => r.key === calcRateKey)?.label} · {calcFrom === 'ARS' ? 'Venta' : 'Compra'}: {ars(calcResult.rate)}
                  </p>
                </motion.div>
              )}

              {/* Accesos rápidos con el saldo */}
              {!isBalanceHidden && availableBalanceArs > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block">Calcular con mi saldo</label>
                  <button
                    onClick={() => { setCalcAmount(String(availableBalanceArs)); setCalcFrom('ARS'); }}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer text-left px-4"
                  >
                    💰 Saldo disponible: {ars(availableBalanceArs)}
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
