// src/components/MultiCurrencyWidget.tsx
// Widget de Cotizaciones Multimoneda y Conversor en Vivo — GastoAR

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRightLeft,
  CreditCard,
  Globe,
  Sparkles,
  Calculator,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
  Coins,
  ShieldCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CurrencyRate {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
  variacion?: number; // % diario
  emoji?: string;
  badge?: string;
  descripcion?: string;
}

export interface MultiCurrencyWidgetProps {
  currentBalance?: number;
  monthlyExpenses?: number;
  variant?: 'card' | 'ticker' | 'compact' | 'full';
  isPro?: boolean;
  onUpgradePro?: () => void;
  isDarkMode?: boolean;
  onApplyConversion?: (amountInArs: number, note: string) => void;
}

// ─── Tasas por defecto (resiliencia offline y carga inicial) ───────────────────

const INITIAL_RATES: CurrencyRate[] = [
  {
    moneda: 'USD',
    casa: 'blue',
    nombre: 'Dólar Blue',
    compra: 1265,
    venta: 1285,
    fechaActualizacion: new Date().toISOString(),
    variacion: 0.39,
    emoji: '💵',
    badge: 'Mercado Libre',
    descripcion: 'Cotización informal de referencia en Argentina'
  },
  {
    moneda: 'USD',
    casa: 'bolsa',
    nombre: 'Dólar MEP',
    compra: 1255,
    venta: 1260,
    fechaActualizacion: new Date().toISOString(),
    variacion: -0.15,
    emoji: '📈',
    badge: 'Bolsa Legal',
    descripcion: 'Operado a través de bonos (AL30 / GD30)'
  },
  {
    moneda: 'USD',
    casa: 'tarjeta',
    nombre: 'Dólar Tarjeta',
    compra: 1040,
    venta: 1656,
    fechaActualizacion: new Date().toISOString(),
    variacion: 0.12,
    emoji: '💳',
    badge: 'Viajes & Streaming',
    descripcion: 'Oficial + 30% Impuesto PAIS + 30% Percepción Ganancias'
  },
  {
    moneda: 'USD',
    casa: 'oficial',
    nombre: 'Dólar Oficial (BNA)',
    compra: 1015,
    venta: 1055,
    fechaActualizacion: new Date().toISOString(),
    variacion: 0.1,
    emoji: '🏛️',
    badge: 'Banco Nación',
    descripcion: 'Cotización mayorista/minorista de referencia estatal'
  },
  {
    moneda: 'USD',
    casa: 'cripto',
    nombre: 'Dólar Cripto',
    compra: 1270,
    venta: 1290,
    fechaActualizacion: new Date().toISOString(),
    variacion: 0.25,
    emoji: '⚡',
    badge: 'USDT 24/7',
    descripcion: 'Cotización de stablecoins (USDT/USDC) en plataformas P2P'
  },
  {
    moneda: 'EUR',
    casa: 'euro_oficial',
    nombre: 'Euro Oficial',
    compra: 1110,
    venta: 1170,
    fechaActualizacion: new Date().toISOString(),
    variacion: 0.05,
    emoji: '💶',
    badge: 'Europa Oficial',
    descripcion: 'Cotización del Euro en bancos'
  },
];

const LOCAL_STORAGE_KEY = 'gastoar_currency_rates_cache_v2';

export const MultiCurrencyWidget: React.FC<MultiCurrencyWidgetProps> = ({
  currentBalance = 0,
  monthlyExpenses = 0,
  variant = 'card',
  isPro = false,
  onUpgradePro,
  isDarkMode = false,
  onApplyConversion,
}) => {
  const [rates, setRates] = useState<CurrencyRate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_RATES;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [converterDirection, setConverterDirection] = useState<'ARS_TO_USD' | 'USD_TO_ARS'>('USD_TO_ARS');
  const [converterAmount, setConverterAmount] = useState<string>('100');
  const [selectedRateKey, setSelectedRateKey] = useState<string>('USD-blue');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'rates' | 'converter' | 'card_calculator'>('rates');

  // Fetch live rates from public Argentine APIs
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dolaresRes, euroRes] = await Promise.allSettled([
        fetch('https://dolarapi.com/v1/dolares'),
        fetch('https://dolarapi.com/v1/cotizaciones/eur')
      ]);

      let newRates: CurrencyRate[] = [...rates];

      if (dolaresRes.status === 'fulfilled' && dolaresRes.value.ok) {
        const dolaresData = await dolaresRes.value.json();
        if (Array.isArray(dolaresData)) {
          const mapped: Record<string, any> = {};
          dolaresData.forEach(d => {
            mapped[d.casa] = d;
          });

          newRates = newRates.map(r => {
            if (r.moneda === 'USD' && mapped[r.casa]) {
              const live = mapped[r.casa];
              return {
                ...r,
                compra: live.compra || r.compra,
                venta: live.venta || r.venta,
                fechaActualizacion: live.fechaActualizacion || new Date().toISOString()
              };
            }
            return r;
          });
        }
      }

      if (euroRes.status === 'fulfilled' && euroRes.value.ok) {
        const euroData = await euroRes.value.json();
        if (euroData && euroData.venta) {
          newRates = newRates.map(r => {
            if (r.moneda === 'EUR') {
              return {
                ...r,
                compra: euroData.compra || r.compra,
                venta: euroData.venta || r.venta,
                fechaActualizacion: euroData.fechaActualizacion || new Date().toISOString()
              };
            }
            return r;
          });
        }
      }

      setRates(newRates);
      setLastUpdated(new Date());
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newRates));
    } catch {
      // Fallback smoothly to existing cached or initial rates
    } finally {
      setIsLoading(false);
    }
  }, [rates]);

  // Initial fetch on mount
  useEffect(() => {
    fetchRates();
    const interval = setInterval(() => {
      fetchRates();
    }, 120000); // 2 minutes auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Formatter helpers
  const ars = (n: number) => '$\u00A0' + Math.round(n).toLocaleString('es-AR');
  const usd = (n: number) => 'U$S\u00A0' + (n >= 1000 ? Math.round(n).toLocaleString('es-AR') : n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  // Main rates for quick access
  const blueRate = useMemo(() => rates.find(r => r.casa === 'blue') || INITIAL_RATES[0], [rates]);
  const oficialRate = useMemo(() => rates.find(r => r.casa === 'oficial') || INITIAL_RATES[3], [rates]);
  const mepRate = useMemo(() => rates.find(r => r.casa === 'bolsa') || INITIAL_RATES[1], [rates]);
  const tarjetaRate = useMemo(() => rates.find(r => r.casa === 'tarjeta') || INITIAL_RATES[2], [rates]);

  // Brecha cambiaria (Blue vs Oficial)
  const brecha = useMemo(() => {
    if (oficialRate.venta <= 0) return 0;
    return Math.round(((blueRate.venta - oficialRate.venta) / oficialRate.venta) * 100);
  }, [blueRate, oficialRate]);

  // Current selected rate for converter
  const activeRate = useMemo(() => {
    return rates.find(r => `${r.moneda}-${r.casa}` === selectedRateKey || r.casa === selectedRateKey) || blueRate;
  }, [rates, selectedRateKey, blueRate]);

  // Conversion calculations
  const parsedAmount = Math.max(0, parseFloat(converterAmount.replace(/,/g, '.')) || 0);

  const convertedResult = useMemo(() => {
    const ratePrice = activeRate.venta || 1;
    if (converterDirection === 'USD_TO_ARS') {
      return parsedAmount * ratePrice;
    } else {
      return parsedAmount / ratePrice;
    }
  }, [parsedAmount, activeRate, converterDirection]);

  // Tarjeta breakdown calculation (for $100 USD purchase)
  const tarjetaBreakdown = useMemo(() => {
    const usdAmount = parsedAmount || 100;
    const baseOficial = oficialRate.venta || 1055;
    const baseArs = usdAmount * baseOficial;
    const impuestoPais = baseArs * 0.30;
    const percepcionGanancias = baseArs * 0.30;
    const totalTarjetaArs = baseArs + impuestoPais + percepcionGanancias;
    const tipoEfectivo = totalTarjetaArs / usdAmount;
    return {
      usdAmount,
      baseArs,
      impuestoPais,
      percepcionGanancias,
      totalTarjetaArs,
      tipoEfectivo
    };
  }, [parsedAmount, oficialRate]);

  const handleCopy = () => {
    const textToCopy = converterDirection === 'USD_TO_ARS' 
      ? Math.round(convertedResult).toString() 
      : convertedResult.toFixed(2);
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Ticker / Cinta compacta ───────────────────────────────────────────────
  if (variant === 'ticker') {
    return (
      <div className="w-full overflow-x-auto no-scrollbar py-1.5 px-3 bg-slate-900/90 text-white backdrop-blur-md border-b border-purple-500/20 flex items-center gap-6 text-xs select-none">
        <div className="flex items-center gap-1.5 font-black text-amber-400 shrink-0">
          <Globe className="w-3.5 h-3.5 animate-pulse" />
          <span className="uppercase tracking-wider text-[10px]">Dólar Hoy</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-semibold text-slate-300">Blue:</span>
          <span className="font-black text-emerald-400">{ars(blueRate.venta)}</span>
          <span className="text-[10px] text-slate-400">c: {ars(blueRate.compra)}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-semibold text-slate-300">MEP:</span>
          <span className="font-black text-purple-300">{ars(mepRate.venta)}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-semibold text-slate-300">Tarjeta:</span>
          <span className="font-black text-orange-400">{ars(tarjetaRate.venta)}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-semibold text-slate-300">Oficial:</span>
          <span className="font-black text-blue-300">{ars(oficialRate.venta)}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 text-[10px] ml-auto">
          <button 
            type="button" 
            onClick={fetchRates} 
            disabled={isLoading}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Compact Widget (for top of dashboard or sidebar) ──────────────────────
  if (variant === 'compact') {
    return (
      <div className="rounded-2xl p-3.5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 text-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">💵</span>
            <div>
              <p className="text-xs font-black">Cotizaciones AR</p>
              <p className="text-[10px] text-purple-300">Brecha {brecha}%</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchRates}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Actualizar cotizaciones"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-1.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Blue</p>
            <p className="text-xs font-black text-emerald-400">{ars(blueRate.venta)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-1.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">MEP</p>
            <p className="text-xs font-black text-purple-300">{ars(mepRate.venta)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-1.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Tarjeta</p>
            <p className="text-xs font-black text-orange-400">{ars(tarjetaRate.venta)}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Card / Section Widget ────────────────────────────────────────────
  return (
    <div className={`rounded-3xl border transition-all overflow-hidden ${
      isDarkMode 
        ? 'bg-slate-900/90 border-purple-900/40 text-white shadow-xl' 
        : 'bg-white border-purple-100 text-slate-900 shadow-lg shadow-purple-500/5'
    }`}>
      {/* Header bar */}
      <div className="p-5 bg-gradient-to-r from-[#2E0854] via-[#5B1E9B] to-[#7928CA] text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
              🌎
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Cotizaciones del Dólar & Divisas</h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-black border border-orange-400/30 uppercase tracking-wider">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Mercado cambiario argentino · Brecha con oficial: <strong className="text-amber-300">{brecha}%</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchRates}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm border border-white/10"
              title="Actualizar cotizaciones en vivo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-200' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {/* Quick tab switcher inside header */}
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('rates')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${activeTab === 'rates' ? 'bg-white text-purple-950 font-black shadow-xs' : 'text-purple-200 hover:text-white'}`}
              >
                Pizarrón
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('converter')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${activeTab === 'converter' ? 'bg-white text-purple-950 font-black shadow-xs' : 'text-purple-200 hover:text-white'}`}
              >
                Conversor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('card_calculator')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${activeTab === 'card_calculator' ? 'bg-white text-purple-950 font-black shadow-xs' : 'text-purple-200 hover:text-white'}`}
              >
                Tarjeta Ext.
              </button>
            </div>
          </div>
        </div>

        {/* Wealth in Hard Currency Quick Summary Bar */}
        {(monthlyExpenses > 0 || currentBalance !== 0) && (
          <div className="mt-4 pt-3.5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-purple-200 flex items-center gap-1.5 font-medium">
                <Coins className="w-3.5 h-3.5 text-amber-300" />
                Gastos del mes en USD (Blue):
              </span>
              <span className="font-black text-emerald-300 tabular-nums">
                {usd(monthlyExpenses / (blueRate.venta || 1))}
              </span>
            </div>
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-purple-200 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                Saldo disponible en USD (MEP):
              </span>
              <span className="font-black text-purple-200 tabular-nums">
                {usd(currentBalance / (mepRate.venta || 1))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Body content based on activeTab */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {/* TAB 1: PIZARRON DE COTIZACIONES */}
          {activeTab === 'rates' && (
            <motion.div
              key="rates"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rates.map(rate => {
                  const isBlue = rate.casa === 'blue';
                  const isTarjeta = rate.casa === 'tarjeta';
                  const isMep = rate.casa === 'bolsa';
                  
                  return (
                    <div
                      key={`${rate.moneda}-${rate.casa}`}
                      className={`rounded-2xl p-4 border transition-all hover:scale-[1.01] ${
                        isBlue
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 ring-1 ring-emerald-500/20'
                          : isTarjeta
                          ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40'
                          : isMep
                          ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{rate.emoji || '💵'}</span>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              {rate.nombre}
                            </p>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {rate.badge || rate.casa}
                            </span>
                          </div>
                        </div>

                        {rate.variacion !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 ${
                            rate.variacion >= 0 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                          }`}>
                            {rate.variacion >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {rate.variacion > 0 ? `+${rate.variacion}%` : `${rate.variacion}%`}
                          </span>
                        )}
                      </div>

                      {/* Compra / Venta values */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/40">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compra</p>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">
                            {rate.compra > 0 ? ars(rate.compra) : '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Venta</p>
                          <p className={`text-base font-black tabular-nums ${
                            isBlue ? 'text-emerald-600 dark:text-emerald-400' :
                            isTarjeta ? 'text-orange-600 dark:text-orange-400' :
                            isMep ? 'text-purple-600 dark:text-purple-400' :
                            'text-slate-900 dark:text-white'
                          }`}>
                            {ars(rate.venta)}
                          </p>
                        </div>
                      </div>

                      {/* Convert Shortcut */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRateKey(`${rate.moneda}-${rate.casa}`);
                          setActiveTab('converter');
                        }}
                        className="w-full mt-3 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Calculator className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>Calcular con {rate.nombre.split(' ')[1] || rate.nombre}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-purple-500" />
                  Cotizaciones informativas promedio del mercado argentino actualizadas cada 2 minutos.
                </span>
                <span className="text-[11px]">
                  Última sincronización: {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                </span>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CONVERSOR MULTIMONEDA */}
          {activeTab === 'converter' && (
            <motion.div
              key="converter"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  {/* From Amount */}
                  <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
                      {converterDirection === 'USD_TO_ARS' ? 'Monto en Dólares (USD)' : 'Monto en Pesos (ARS)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                        {converterDirection === 'USD_TO_ARS' ? 'U$S' : '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={converterAmount}
                        onChange={e => setConverterAmount(e.target.value)}
                        placeholder="100"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-black text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Switch Direction Button */}
                  <button
                    type="button"
                    onClick={() => setConverterDirection(d => d === 'USD_TO_ARS' ? 'ARS_TO_USD' : 'USD_TO_ARS')}
                    className="p-3 rounded-2xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 transition-transform active:rotate-180 duration-300 cursor-pointer shadow-sm shrink-0"
                    title="Intercambiar divisas"
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                  </button>

                  {/* Selected Rate Casa */}
                  <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
                      Cotización de referencia
                    </label>
                    <select
                      value={selectedRateKey}
                      onChange={e => setSelectedRateKey(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      {rates.map(r => {
                        const optKey = `${r.moneda}-${r.casa}`;
                        return (
                          <option key={optKey} value={optKey}>
                            {r.nombre} ({ars(r.venta)})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Conversion Result Box */}
                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                  <div>
                    <span className="text-xs text-purple-200 font-medium">Equivalente estimado:</span>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-300 tabular-nums tracking-tight mt-0.5">
                      {converterDirection === 'USD_TO_ARS' ? ars(convertedResult) : usd(convertedResult)}
                    </p>
                    <span className="text-[11px] text-purple-300 mt-1 block">
                      1 USD = {ars(activeRate.venta)} ({activeRate.nombre})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>

                    {onApplyConversion && (
                      <button
                        type="button"
                        onClick={() => {
                          const arsVal = converterDirection === 'USD_TO_ARS' ? convertedResult : parsedAmount;
                          onApplyConversion(arsVal, `Conversión de ${usd(converterDirection === 'USD_TO_ARS' ? parsedAmount : convertedResult)} a ${activeRate.nombre}`);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#F95420] hover:bg-[#E04412] active:scale-95 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Usar en Gasto</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap mt-4">
                  <span className="text-xs font-bold text-slate-500">Montos rápidos:</span>
                  {[20, 50, 100, 200, 500, 1000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConverterAmount(val.toString())}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        converterAmount === val.toString()
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      U$S {val}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: CALCULADORA DE DÓLAR TARJETA (COMPRAS EXTERIOR) */}
          {activeTab === 'card_calculator' && (
            <motion.div
              key="card_calculator"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-50 via-amber-50/40 to-purple-50/30 dark:from-slate-800 dark:to-slate-850 border border-orange-200/80 dark:border-slate-700">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Calculadora de Compras con Tarjeta en el Exterior
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Simulá cuánto pagarás en pesos en tu resumen bancario por servicios internacionales (Netflix, Spotify, AWS, compras en el extranjero).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                      Consumo en Dólares (USD):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                        U$S
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={converterAmount}
                        onChange={e => setConverterAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-black text-base focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:pt-6">
                    {['10 (Streaming)', '30 (Suscripción)', '100 (Compra)', '500 (Vuelo)'].map(item => {
                      const val = item.split(' ')[0];
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setConverterAmount(val)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-orange-100 transition-colors cursor-pointer"
                        >
                          U$S {val}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Breakdown details */}
                <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-orange-200/60 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Base oficial ({usd(tarjetaBreakdown.usdAmount)} × {ars(oficialRate.venta)} BNA):</span>
                    <span className="font-semibold">{ars(tarjetaBreakdown.baseArs)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>+ Impuesto PAIS (30%):</span>
                    <span className="font-semibold text-orange-600">{ars(tarjetaBreakdown.impuestoPais)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>+ Percepción Ganancias/Bienes Personales (30%):</span>
                    <span className="font-semibold text-orange-600">{ars(tarjetaBreakdown.percepcionGanancias)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
                    <span className="font-black text-slate-900 dark:text-white">Total a pagar en tu tarjeta:</span>
                    <span className="font-black text-lg text-orange-600 dark:text-orange-400 tabular-nums">
                      {ars(tarjetaBreakdown.totalTarjetaArs)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 text-right">
                    Tipo de cambio efectivo: <strong>{ars(tarjetaBreakdown.tipoEfectivo)}</strong> por cada USD
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultiCurrencyWidget;
