// ProActionsBar.tsx
// Barra compacta de acciones rápidas Pro para el Dashboard
// Reemplaza el widget de cotizaciones que ocupaba toda la pantalla
// Pegar en la raíz del proyecto

import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, Flame, ChevronRight, RefreshCw } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface QuickRate {
  label: string;
  value: number | null;
  change: number | null; // % cambio vs ayer, null si no disponible
  emoji: string;
}

interface ProActionsBarProps {
  isPro: boolean;
  availableBalanceArs: number;
  onOpenCurrencyModal: () => void;   // abre el modal de cotizaciones completo
  onOpenCashFlowTab: () => void;     // navega a la solapa de flujo de caja
  isBalanceHidden?: boolean;
}

// ─── Fetch cotizacion blue (liviano, solo 1 valor) ────────────────────────────

async function fetchBlueRate(): Promise<{ buy: number; sell: number } | null> {
  try {
    const res = await fetch('https://api.bluelytics.com.ar/v2/latest', {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return {
      buy:  data.blue?.value_buy  ?? null,
      sell: data.blue?.value_sell ?? null,
    };
  } catch {
    return null;
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export const ProActionsBar: React.FC<ProActionsBarProps> = ({
  isPro,
  availableBalanceArs,
  onOpenCurrencyModal,
  onOpenCashFlowTab,
  isBalanceHidden = false,
}) => {
  const [blueRate, setBlueRate] = useState<{ buy: number; sell: number } | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const ars = (n: number) => '$\u00A0' + Math.round(n).toLocaleString('es-AR');
  const usd = (n: number) => 'USD\u00A0' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  useEffect(() => {
    if (!isPro) return;
    loadRate();
    // Actualizar cada 10 minutos
    const interval = setInterval(loadRate, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isPro]);

  const loadRate = async () => {
    setIsLoadingRate(true);
    const rate = await fetchBlueRate();
    if (rate) {
      setBlueRate(rate);
      const now = new Date();
      setLastUpdated(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    }
    setIsLoadingRate(false);
  };

  // Equivalente del saldo en USD Blue
  const balanceInUsd = blueRate && availableBalanceArs > 0
    ? availableBalanceArs / blueRate.sell
    : null;

  if (!isPro) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5">

      {/* ── Botón Cotizaciones ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onOpenCurrencyModal}
        className="group flex items-center gap-3 bg-gradient-to-br from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-2xl p-3.5 border border-white/10 hover:border-white/20 transition-all cursor-pointer text-left shadow-lg"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-md">
          <TrendingUp className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 leading-none mb-1">💵 Dólar Blue</p>
          {isLoadingRate ? (
            <div className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
              <span className="text-xs text-slate-500">Actualizando...</span>
            </div>
          ) : blueRate ? (
            <div>
              <p className="text-base font-black leading-none text-white">
                {ars(blueRate.sell)}
              </p>
              {!isBalanceHidden && balanceInUsd && (
                <p className="text-[10px] text-amber-400 mt-0.5 font-medium">
                  Tu saldo ≈ {usd(balanceInUsd)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Sin conexión</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
      </button>

      {/* ── Botón Flujo de Caja ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onOpenCashFlowTab}
        className="group flex items-center gap-3 bg-gradient-to-br from-blue-950 to-slate-900 hover:from-blue-900 hover:to-slate-800 text-white rounded-2xl p-3.5 border border-blue-800/40 hover:border-blue-700/60 transition-all cursor-pointer text-left shadow-lg"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Activity className="w-[18px] h-[18px] text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-blue-400 leading-none mb-1">Flujo de Caja</p>
          <p className="text-sm font-bold text-white leading-tight">¿Cuánto tendrás?</p>
          <p className="text-[10px] text-blue-300 mt-0.5">Proyección 7 / 15 / 30 días</p>
        </div>
        <ChevronRight className="w-4 h-4 text-blue-500 group-hover:text-blue-300 transition-colors flex-shrink-0" />
      </button>

    </div>
  );
};

export default ProActionsBar;
