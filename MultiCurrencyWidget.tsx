// MultiCurrencyWidget.tsx
// Widget UI Multi-moneda — Plan Pro GastoAR
// Cotizaciones en tiempo real + patrimonio neto en USD/ARS/USDT

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw, Plus, Trash2, Lock,
  TrendingUp, ChevronDown, ChevronUp, Wallet
} from 'lucide-react';
import {
  MultiCurrencyEngine,
  SupportedCurrency,
  RatesCache,
  ExchangeRate,
} from './MultiCurrencyEngine';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AssetEntry {
  id: string;
  currency: SupportedCurrency;
  amount: number;
  label: string;
}

interface MultiCurrencyWidgetProps {
  isPro: boolean;
  onUpgradePro?: () => void;
  isDarkMode?: boolean;
}

const CURRENCY_OPTIONS: SupportedCurrency[] = ['ARS', 'USD_OFICIAL', 'USD_BLUE', 'USD_MEP', 'USDT', 'BTC'];

// ─── Componente ───────────────────────────────────────────────────────────────

export const MultiCurrencyWidget: React.FC<MultiCurrencyWidgetProps> = ({
  isPro,
  onUpgradePro,
  isDarkMode = false,
}) => {
  const [ratesCache, setRatesCache]   = useState<RatesCache | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [assets, setAssets]           = useState<AssetEntry[]>(() => {
    try {
      const saved = localStorage.getItem('gastoar_pro_assets_v1');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCurrency, setNewCurrency] = useState<SupportedCurrency>('USD_BLUE');
  const [newAmount, setNewAmount]     = useState('');
  const [newLabel, setNewLabel]       = useState('');
  const [showRates, setShowRates]     = useState(true);
  const [lastUpdatedStr, setLastUpdatedStr] = useState('');

  // Formateo
  const ars = (n: number) => '$\u00A0' + Math.round(n).toLocaleString('es-AR');
  const usd = (n: number) => 'USD\u00A0' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  // Fetch cotizaciones
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const cache = await MultiCurrencyEngine.fetchRates();
      setRatesCache(cache);
      const date = new Date(cache.lastUpdated);
      setLastUpdatedStr(`${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPro) fetchRates();
  }, [isPro, fetchRates]);

  // Guardar assets en localStorage
  useEffect(() => {
    try { localStorage.setItem('gastoar_pro_assets_v1', JSON.stringify(assets)); } catch {}
  }, [assets]);

  // Net worth calculado
  const netWorth = ratesCache
    ? MultiCurrencyEngine.calculateNetWorth(
        assets.map(a => ({ currency: a.currency, amount: a.amount })),
        ratesCache.rates,
      )
    : null;

  const handleAddAsset = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;
    const rate = ratesCache?.rates[newCurrency];
    setAssets(prev => [...prev, {
      id: `asset-${Date.now()}`,
      currency: newCurrency,
      amount,
      label: newLabel.trim() || rate?.label || newCurrency,
    }]);
    setNewAmount('');
    setNewLabel('');
    setShowAddForm(false);
  };

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // ── Paywall ────────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-purple-200/60">
        <div className="filter blur-sm pointer-events-none p-5 bg-white h-52">
          <div className="grid grid-cols-3 gap-2">
            {['💵 Blue', '₮ USDT', '🏦 Oficial'].map(c => (
              <div key={c} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-slate-400">{c}</p>
                <p className="text-lg font-black text-purple-600">$1.150</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs p-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base font-bold text-slate-900 text-center mb-1">Multi-moneda USD / USDT / BTC</h3>
          <p className="text-xs text-slate-500 text-center mb-4 max-w-xs leading-relaxed">
            Cotizaciones en tiempo real, seguimiento de patrimonio en todas las monedas y equivalentes USD en cada gasto.
          </p>
          <button
            onClick={onUpgradePro}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Activar Plan Pro →
          </button>
        </div>
      </div>
    );
  }

  const rates = ratesCache?.rates;

  const MAIN_CURRENCIES: SupportedCurrency[] = ['USD_BLUE', 'USD_OFICIAL', 'USD_MEP', 'USDT'];

  return (
    <div className="space-y-4">

      {/* Header cotizaciones */}
      <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-orange-950 via-purple-950 to-slate-900 border-orange-900/30'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Cotizaciones</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[9px] font-bold border border-orange-500/30">PRO</span>
              </div>
              {lastUpdatedStr && (
                <p className="text-[10px] text-slate-500">
                  Actualizado a las {lastUpdatedStr}
                  {ratesCache?.isStale && <span className="text-amber-400 ml-1">· Cache</span>}
                </p>
              )}
            </div>
          </div>
          <button onClick={fetchRates} className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${isLoading ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Grid de cotizaciones */}
        {rates ? (
          <div className="grid grid-cols-2 gap-2">
            {MAIN_CURRENCIES.map(cur => {
              const r = rates[cur];
              if (!r) return null;
              return (
                <div key={cur} className="bg-white/8 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{r.emoji}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{r.label}</span>
                  </div>
                  <p className="text-base font-black text-white leading-none">
                    {ars(r.rateToBuy)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Venta: {ars(r.rateToSell)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white/8 rounded-xl p-3 h-16 animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* Patrimonio multi-moneda */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-bold text-slate-800">Mis activos</h4>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>

        {/* Formulario agregar */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-100"
            >
              <div className="p-4 bg-purple-50/50 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Moneda</label>
                    <select
                      value={newCurrency}
                      onChange={e => setNewCurrency(e.target.value as SupportedCurrency)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                    >
                      {CURRENCY_OPTIONS.map(c => (
                        <option key={c} value={c}>{rates?.[c]?.emoji} {rates?.[c]?.label || c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Cantidad</label>
                    <input
                      type="number" step="0.000001" min="0"
                      value={newAmount}
                      onChange={e => setNewAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Etiqueta (opcional)</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="Ej: Cuenta Galicia, Binance, Colchón..."
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddAsset} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer">
                    Agregar activo
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="px-3 py-2 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de activos */}
        {assets.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-2xl mb-1">💼</p>
            <p className="text-xs">Agregá tus ahorros en distintas monedas</p>
          </div>
        ) : (
          <div>
            {assets.map(asset => {
              const arsVal = rates
                ? MultiCurrencyEngine.toARS(asset.amount, asset.currency, rates, true)
                : 0;
              const rate = rates?.[asset.currency];
              return (
                <div key={asset.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
                  <span className="text-lg flex-shrink-0">{rate?.emoji || '💰'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{asset.label}</p>
                    <p className="text-[10px] text-slate-500">
                      {asset.amount.toLocaleString('es-AR', { maximumFractionDigits: 6 })} {rate?.label || asset.currency}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900">{ars(arsVal)}</p>
                    {rates && asset.currency !== 'ARS' && (
                      <p className="text-[10px] text-slate-400">
                        ≈ {usd(MultiCurrencyEngine.fromARS(arsVal, 'USD_BLUE', rates))}
                      </p>
                    )}
                  </div>
                  <button onClick={() => removeAsset(asset.id)} className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Total */}
            {netWorth && netWorth.totalInArs > 0 && (
              <div className="px-4 py-3 bg-purple-50 border-t border-purple-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-900">Patrimonio total</span>
                  <div className="text-right">
                    <p className="text-base font-black text-purple-700">{ars(netWorth.totalInArs)}</p>
                    <p className="text-[10px] text-purple-500">{usd(netWorth.totalInUsd)} al blue</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default MultiCurrencyWidget;
