import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Check, 
  Edit3, 
  ExternalLink, 
  HelpCircle,
  TrendingDown,
  Clock,
  Sparkles
} from 'lucide-react';
import { Budgets, CategoryColors, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CategoryItemData {
  category: string;
  budget: number;
  spent: number;
  count: number;
  remaining: number;
  overspent: number;
  percentage: number;
  status: 'exceeded' | 'warning' | 'ok' | 'no_budget';
  color: string;
  dailyAllowance: number;
}

interface BudgetAlertsSectionProps {
  categoryItems: CategoryItemData[];
  budgets: Budgets;
  currency: string;
  daysRemaining: number;
  daysInMonth: number;
  currentDay: number;
  monthProgressPct: number;
  onUpdateBudgets?: (newBudgets: Budgets) => void;
  onOpenEditCategory: (item: CategoryItemData) => void;
  onSelectCategory?: (category: string) => void;
}

export const BudgetAlertsSection: React.FC<BudgetAlertsSectionProps> = ({
  categoryItems,
  budgets,
  currency,
  daysRemaining,
  daysInMonth,
  currentDay,
  monthProgressPct,
  onUpdateBudgets,
  onOpenEditCategory,
  onSelectCategory,
}) => {
  const currentThreshold = budgets?.alertThresholdPercent || 80;
  const [selectedThreshold, setSelectedThreshold] = useState<number>(currentThreshold);
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'exceeded' | 'warning' | 'ok'>('all');

  // Groups
  const exceededList = categoryItems.filter(item => item.status === 'exceeded');
  const warningList = categoryItems.filter(item => item.status === 'warning');
  const okList = categoryItems.filter(item => item.status === 'ok');
  const noBudgetList = categoryItems.filter(item => item.status === 'no_budget');

  const handleSaveThreshold = (newVal: number) => {
    setSelectedThreshold(newVal);
    if (onUpdateBudgets) {
      const updated: Budgets = {
        ...budgets,
        alertThresholdPercent: newVal,
      };
      onUpdateBudgets(updated);
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2500);
    }
  };

  const presetThresholds = [70, 75, 80, 85, 90];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Configuration of Alert Threshold */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Alertas y Límites de Presupuesto
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configurá el porcentaje de advertencia y controlá el semáforo de riesgo para no llegar a fin de mes en rojo.
                </p>
              </div>
            </div>
          </div>

          {/* Current Threshold Badge */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3.5 py-1.5 rounded-2xl bg-amber-100/80 text-amber-900 border border-amber-200 text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Alerta activa al {currentThreshold}%
            </span>
          </div>
        </div>

        {/* THRESHOLD CONFIGURATOR CONTROLS */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/40 border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#7928CA]" />
                Umbral de Alerta Preventiva:
              </label>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Las categorías pasarán a color amarillo de advertencia cuando su consumo alcance este porcentaje del límite fijado.
              </p>
            </div>

            {isSavedNotice && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 self-start sm:self-auto animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                ¡Umbral guardado!
              </span>
            )}
          </div>

          {/* Preset Buttons & Slider */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {presetThresholds.map((preset) => {
                const isActive = selectedThreshold === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSaveThreshold(preset)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#7928CA] text-white shadow-md scale-105'
                        : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200'
                    }`}
                  >
                    {preset}%
                  </button>
                );
              })}
            </div>

            {/* Custom slider */}
            <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 sm:max-w-xs sm:ml-4">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={selectedThreshold}
                onChange={(e) => handleSaveThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7928CA]"
              />
              <span className="text-xs font-extrabold text-[#7928CA] w-12 text-right shrink-0">
                {selectedThreshold}%
              </span>
            </div>
          </div>

          {/* Explanatory helper */}
          <div className="text-[10px] sm:text-[11px] leading-tight sm:leading-normal text-slate-600 bg-white/85 py-1.5 px-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/70 flex items-start gap-1.5 sm:gap-2 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0 mt-0.5" />
            <span className="leading-snug sm:leading-normal">
              <strong className="text-slate-800 font-bold">¿Cómo funciona el sistema de alertas?</strong> Se mostrará 🟢 <strong>Verde</strong> si llevás gastado menos del {selectedThreshold}%, 🟡 <strong>Amarillo</strong> al alcanzar entre el {selectedThreshold}% y el 99%, y 🔴 <strong>Rojo</strong> si superás el 100% de tu presupuesto.
            </span>
          </div>
        </div>

        {/* 3 SEMAPHORE KPI COUNTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Green Safe */}
          <button
            type="button"
            onClick={() => setActiveTabFilter(activeTabFilter === 'ok' ? 'all' : 'ok')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTabFilter === 'ok'
                ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
                : 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Bajo Control
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px]">
                &lt; {currentThreshold}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-900 font-outfit">
                {okList.length}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">
                {okList.length === 1 ? 'categoría' : 'categorías'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Gastos dentro del margen programado.
            </p>
          </button>

          {/* Yellow Warning */}
          <button
            type="button"
            onClick={() => setActiveTabFilter(activeTabFilter === 'warning' ? 'all' : 'warning')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTabFilter === 'warning'
                ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-500/20 shadow-md'
                : 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-800 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Alerta Preventiva
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                {currentThreshold}% a 99%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-900 font-outfit">
                {warningList.length}
              </span>
              <span className="text-xs text-amber-700 font-semibold">
                {warningList.length === 1 ? 'categoría' : 'categorías'}
              </span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              Cerca del tope. Frenar gastos discrecionales.
            </p>
          </button>

          {/* Red Exceeded */}
          <button
            type="button"
            onClick={() => setActiveTabFilter(activeTabFilter === 'exceeded' ? 'all' : 'exceeded')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTabFilter === 'exceeded'
                ? 'bg-rose-100/80 border-rose-400 ring-2 ring-rose-500/20 shadow-md'
                : 'bg-rose-50/50 border-rose-200/80 hover:bg-rose-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-800 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Límite Excedido
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-extrabold text-[10px]">
                ≥ 100%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-900 font-outfit">
                {exceededList.length}
              </span>
              <span className="text-xs text-rose-700 font-semibold">
                {exceededList.length === 1 ? 'categoría' : 'categorías'}
              </span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              Superó el presupuesto pactado.
            </p>
          </button>
        </div>
      </div>

      {/* 2. SEMAPHORE CATEGORY BREAKDOWN LIST */}
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Filtrar:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTabFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTabFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({categoryItems.filter(c => c.budget > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter('exceeded')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTabFilter === 'exceeded'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Rojo ({exceededList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter('warning')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTabFilter === 'warning'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Amarillo ({warningList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter('ok')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTabFilter === 'ok'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Verde ({okList.length})
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Faltan {daysRemaining} días para cerrar el mes
          </span>
        </div>

        {/* Category Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryItems
            .filter(item => {
              if (item.budget === 0) return false;
              if (activeTabFilter === 'exceeded') return item.status === 'exceeded';
              if (activeTabFilter === 'warning') return item.status === 'warning';
              if (activeTabFilter === 'ok') return item.status === 'ok';
              return true;
            })
            .map(item => {
              const isExceeded = item.status === 'exceeded';
              const isWarning = item.status === 'warning';

              return (
                <div
                  key={item.category}
                  className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between gap-3.5 relative overflow-hidden ${
                    isExceeded
                      ? 'border-rose-300 shadow-[0_2px_12px_rgba(244,63,94,0.09)]'
                      : isWarning
                        ? 'border-amber-300 shadow-[0_2px_12px_rgba(245,158,11,0.09)]'
                        : 'border-emerald-200/90 shadow-xs'
                  }`}
                >
                  {/* Status strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{
                      backgroundColor: isExceeded ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'
                    }}
                  />

                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">
                          {item.category}
                        </h4>
                      </div>

                      {/* Semaphore Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isExceeded
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : isWarning
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {isExceeded ? 'Excedido' : isWarning ? 'Alerta' : 'Bajo control'} ({item.percentage}%)
                      </span>
                    </div>

                    {/* Progress Bar with Alert Threshold Line */}
                    <div className="space-y-1 pt-3">
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                        {/* Threshold mark */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                          style={{ left: `${currentThreshold}%` }}
                          title={`Umbral de alerta (${currentThreshold}%)`}
                        />
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>Gastado: {formatCurrency(item.spent, currency)}</span>
                        <span>Límite: {formatCurrency(item.budget, currency)}</span>
                      </div>
                    </div>

                    {/* Result Callout */}
                    <div className="mt-3 p-2.5 rounded-xl text-xs font-semibold">
                      {isExceeded ? (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-lg flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                          <span>
                            Sobrepasado por <strong>{formatCurrency(item.overspent, currency)}</strong> a {daysRemaining} días de fin de mes.
                          </span>
                        </div>
                      ) : isWarning ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                          <span>
                            Quedan solo <strong>{formatCurrency(item.remaining, currency)}</strong> disponibles ({formatCurrency(item.dailyAllowance, currency)}/día).
                          </span>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-lg flex items-start gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                          <span>
                            Margen seguro de <strong>{formatCurrency(item.remaining, currency)}</strong> (~{formatCurrency(item.dailyAllowance, currency)}/día).
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onSelectCategory && onSelectCategory(item.category)}
                      className="text-slate-500 hover:text-[#7928CA] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver gastos ({item.count})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEditCategory(item)}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#7928CA] hover:bg-purple-100 font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar límite</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* If no items match filter */}
        {categoryItems.filter(item => item.budget > 0).length === 0 && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7928CA] mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-base">Aún no hay categorías con presupuesto</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Asigná presupuestos a tus categorías en la solapa "Alta de Presupuesto" para activar el semáforo y las alertas automáticas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
