// ProActionsBar.tsx
// Barra compacta de acciones rápidas Pro para el Dashboard con los colores oficiales de GastoAR
// Morado (#2E0854 / #6F2EC5) y Naranja (#F95420 / #F97316)

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ProActionsBarProps {
  isPro?: boolean;
  availableBalanceArs: number;
  onOpenCurrencyModal: () => void;   // abre el modal de cotizaciones completo
  onOpenCashFlowTab: () => void;     // navega a la solapa de flujo de caja
  isBalanceHidden?: boolean;
  onUpgradeToPro?: () => void;
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
  isPro = false,
  availableBalanceArs,
  onOpenCurrencyModal,
  onOpenCashFlowTab,
  isBalanceHidden = false,
  onUpgradeToPro,
}) => {
  const [blueRate, setBlueRate] = useState<{ buy: number; sell: number } | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const ars = (n: number) => '$\u00A0' + Math.round(n).toLocaleString('es-AR');
  const usd = (n: number) => 'USD\u00A0' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  useEffect(() => {
    loadRate();
    const interval = setInterval(loadRate, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleCashFlowClick = () => {
    onOpenCashFlowTab();
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">

      {/* ── Botón Cotizaciones Dólar (USD COTIZACION) ── */}
      <button
        type="button"
        onClick={onOpenCurrencyModal}
        className="group relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-[#2E0854] via-[#3B0E68] to-[#1E0538] hover:from-[#370A64] hover:to-[#260747] text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-orange-500/30 hover:border-orange-500/60 transition-all cursor-pointer text-left shadow-lg shadow-purple-950/30 active:scale-[0.99] min-h-[92px]"
      >
        {/* Glow decorativo sutil en esquina */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/15 transition-all" />

        <div className="w-full">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-orange-300 leading-none">
              USD COTIZACION
            </p>
            <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[8px] font-black border border-orange-500/30 animate-pulse">
              EN VIVO
            </span>
          </div>

          {isLoadingRate ? (
            <div className="flex items-center gap-1.5 py-1">
              <RefreshCw className="w-3 h-3 text-orange-300 animate-spin" />
              <span className="text-[11px] text-orange-200/80 font-medium">Actualizando...</span>
            </div>
          ) : blueRate ? (
            <div>
              <p className="text-xl sm:text-2xl font-black leading-none text-white tracking-tight">
                {ars(blueRate.sell)}
              </p>
              {!isBalanceHidden && balanceInUsd ? (
                <p className="text-[10px] sm:text-[11px] text-amber-300 mt-1.5 font-bold truncate">
                  Tu saldo ≈ {usd(balanceInUsd)}
                </p>
              ) : (
                <p className="text-[10px] text-orange-200/70 mt-1 font-medium truncate">
                  Tocá para ver cotizaciones
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-orange-200/70 py-1">Sin conexión</p>
          )}
        </div>
      </button>

      {/* ── Botón Flujo de Caja (GastoAR Violeta Real & Amatista) ── */}
      <button
        type="button"
        onClick={handleCashFlowClick}
        className="group relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] hover:from-[#370A64] hover:to-[#7928CA] text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-purple-400/30 hover:border-purple-300/60 transition-all cursor-pointer text-left shadow-lg shadow-purple-950/30 active:scale-[0.99] min-h-[92px]"
      >
        {/* Glow decorativo sutil en esquina */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/15 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-300/20 transition-all" />

        <div className="w-full">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-purple-200 leading-none">
              Flujo de Caja
            </p>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[8px] font-black border border-amber-400/40">
              PRO
            </span>
          </div>

          <p className="text-base sm:text-lg font-black text-white leading-tight truncate">
            ¿Cuánto tendrás?
          </p>
          <p className="text-[10px] sm:text-[11px] text-purple-200 mt-1.5 font-medium truncate">
            Proyección 7 / 15 / 30 días
          </p>
        </div>
      </button>

    </div>
  );
};

export default ProActionsBar;
