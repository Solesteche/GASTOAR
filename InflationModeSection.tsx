// InflationModeSection.tsx
// Componente UI del Modo Inflación IPC — Plan Pro GastoAR
// Pegar en la raíz del proyecto junto a BudgetSection.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, Zap, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Info, Sparkles,
  BarChart3, Settings2, RefreshCw, ArrowUpRight,
  Lock
} from 'lucide-react';
import { Budgets } from './types';
import {
  InflationModeEngine,
  InflationSettings,
  BudgetProjection,
  IPC_GENERAL_RATE,
} from './InflationModeEngine';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface InflationModeSectionProps {
  budgets: Budgets;
  onApplyAdjustment: (newBudgets: Budgets, selectedCategories: string[]) => void;
  onUpdateSettings: (settings: InflationSettings) => void;
  inflationSettings: InflationSettings;
  isPro: boolean;  // si false → mostrar paywall
  onUpgradePro?: () => void;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const RecommendationBadge: React.FC<{ rec: BudgetProjection['recommendation'] }> = ({ rec }) => {
  const map = {
    adjust_now:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Ajustar ahora',   icon: '🔴' },
    adjust_soon: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Ajustar pronto',  icon: '🟡' },
    ok:          { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'OK por ahora',  icon: '🟢' },
  };
  const s = map[rec];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  );
};

const InflationBar: React.FC<{ rate: number }> = ({ rate }) => {
  const pct = Math.min(100, (rate / 8) * 100); // 8% = max visual
  const color = rate >= 5 ? '#EF4444' : rate >= 3.5 ? '#F59E0B' : '#10B981';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{rate}%/mes</span>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const InflationModeSection: React.FC<InflationModeSectionProps> = ({
  budgets,
  onApplyAdjustment,
  onUpdateSettings,
  inflationSettings,
  isPro,
  onUpgradePro,
}) => {
  const [monthsAhead, setMonthsAhead] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [localSettings, setLocalSettings] = useState<InflationSettings>(inflationSettings);
  const [applied, setApplied] = useState(false);

  // Calcular proyecciones
  const report = useMemo(() => {
    if (!isPro) return null;
    return InflationModeEngine.calculateProjections(budgets, localSettings, monthsAhead);
  }, [budgets, localSettings, monthsAhead, isPro]);

  // Inicializar todas seleccionadas
  const allCategories = useMemo(() =>
    Object.keys(budgets.categories || {}).filter(c => (budgets.categories[c] || 0) > 0),
    [budgets]
  );

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCategories(new Set(allCategories));
  }, [allCategories]);

  const clearAll = useCallback(() => {
    setSelectedCategories(new Set());
  }, []);

  const handleApply = () => {
    if (!report) return;
    const cats = selectedCategories.size > 0 ? Array.from(selectedCategories) : allCategories;
    const newBudgets = InflationModeEngine.applyAdjustment(budgets, report, cats);
    onApplyAdjustment(newBudgets, cats);
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  };

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    setShowSettings(false);
  };

  const ars = (n: number) => '$\u00A0' + Math.round(n).toLocaleString('es-AR');

  // ── Paywall ────────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-purple-200/60">
        {/* Contenido bloqueado (borroso) */}
        <div className="filter blur-sm pointer-events-none p-5 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Modo Inflación IPC</h3>
              <p className="text-xs text-slate-500">Ajuste automático de presupuestos por inflación real</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Alimentos', 'Transporte', 'Salud'].map(c => (
              <div key={c} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">{c}</p>
                <p className="text-lg font-bold text-purple-600">+5.2%</p>
              </div>
            ))}
          </div>
        </div>
        {/* Overlay de upgrade */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs p-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center mb-3 shadow-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base font-bold text-slate-900 text-center mb-1">Modo Inflación IPC</h3>
          <p className="text-xs text-slate-500 text-center mb-4 max-w-xs leading-relaxed">
            Ajustá tus presupuestos automáticamente según el IPC real por categoría. Exclusivo Plan Pro.
          </p>
          <button
            onClick={onUpgradePro}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Activar Plan Pro →
          </button>
        </div>
      </div>
    );
  }

  // ── Vista principal ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header card */}
      <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-slate-900 rounded-2xl p-5 border border-purple-700/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-purple-500 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Modo Inflación IPC</h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">PRO</span>
              </div>
              <p className="text-xs text-purple-300">Tasas INDEC por rubro · Argentina</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle activar modo */}
            <button
              onClick={() => {
                const next = { ...localSettings, enabled: !localSettings.enabled };
                setLocalSettings(next);
                onUpdateSettings(next);
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.enabled ? 'bg-orange-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${localSettings.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <button onClick={() => setShowSettings(v => !v)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <Settings2 className="w-4 h-4 text-purple-300" />
            </button>
          </div>
        </div>

        {/* Resumen de inflación estimada */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <p className="text-[10px] text-purple-300 mb-1">IPC general est.</p>
            <p className="text-xl font-black text-orange-400">{Math.round(IPC_GENERAL_RATE * 1000) / 10}%</p>
            <p className="text-[10px] text-purple-400">mensual</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <p className="text-[10px] text-purple-300 mb-1">Ajuste necesario</p>
            <p className="text-xl font-black text-white">{report ? ars(report.totalDelta) : '—'}</p>
            <p className="text-[10px] text-purple-400">total presupuesto</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <p className="text-[10px] text-purple-300 mb-1">Poder adq. perdido</p>
            <p className="text-xl font-black text-red-400">
              {report ? `${Math.round(((report.totalProjectedBudget / report.totalCurrentBudget) - 1) * 100)}%` : '—'}
            </p>
            <p className="text-[10px] text-purple-400">si no ajustás</p>
          </div>
        </div>

        {/* Selector de proyección */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-300 font-medium">Proyectar</span>
          {[1, 2, 3, 6].map(m => (
            <button
              key={m}
              onClick={() => setMonthsAhead(m)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${monthsAhead === m ? 'bg-orange-500 text-white' : 'bg-white/10 text-purple-300 hover:bg-white/20'}`}
            >
              {m} {m === 1 ? 'mes' : 'meses'}
            </button>
          ))}
          <span className="text-xs text-purple-300 font-medium">adelante</span>
        </div>
      </div>

      {/* Settings expandible */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-purple-600" />
                Configuración de ajuste
              </h4>

              {/* Modo de cálculo */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">Modo de cálculo</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'auto_ipc',      label: 'Auto IPC',      desc: 'Tasas INDEC por rubro' },
                    { value: 'manual_rate',   label: 'Tasa manual',   desc: 'Un % para todos' },
                    { value: 'per_category',  label: 'Por categoría', desc: 'Personalizado' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setLocalSettings(p => ({ ...p, mode: opt.value }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${localSettings.mode === opt.value ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                    >
                      <p className={`text-xs font-bold ${localSettings.mode === opt.value ? 'text-purple-700' : 'text-slate-700'}`}>{opt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasa manual */}
              {localSettings.mode === 'manual_rate' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Tasa mensual: <span className="text-purple-600 font-black">{localSettings.manualRate}%</span>
                  </label>
                  <input
                    type="range" min="1" max="15" step="0.5"
                    value={localSettings.manualRate}
                    onChange={e => setLocalSettings(p => ({ ...p, manualRate: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1%</span><span>5%</span><span>10%</span><span>15%</span>
                  </div>
                </div>
              )}

              {/* Día de ajuste automático */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Ajuste automático mensual</p>
                  <p className="text-[10px] text-slate-500">GastoAR ajusta solo el día que elijas</p>
                </div>
                <select
                  value={localSettings.autoAdjustDay}
                  onChange={e => setLocalSettings(p => ({ ...p, autoAdjustDay: parseInt(e.target.value) }))}
                  className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {[1, 5, 10, 15, 20, 25].map(d => (
                    <option key={d} value={d}>Día {d}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Guardar configuración
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabla de proyecciones por categoría */}
      {report && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
            onClick={() => setShowDetails(v => !v)}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-slate-800">Proyección por categoría</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {report.projections.length} categorías
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <button onClick={e => { e.stopPropagation(); selectAll(); }} className="text-[10px] font-semibold text-purple-600 hover:underline cursor-pointer">Todas</button>
                <span className="text-slate-300">|</span>
                <button onClick={e => { e.stopPropagation(); clearAll(); }} className="text-[10px] font-semibold text-slate-500 hover:underline cursor-pointer">Ninguna</button>
              </div>
              {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {report.projections.map(p => {
                    const isSelected = selectedCategories.size === 0 || selectedCategories.has(p.category);
                    return (
                      <div
                        key={p.category}
                        onClick={() => toggleCategory(p.category)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-white hover:bg-purple-50/40' : 'bg-slate-50/50 opacity-50'}`}
                      >
                        {/* Checkbox */}
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-800 truncate">{p.category}</span>
                            <RecommendationBadge rec={p.recommendation} />
                          </div>
                          <InflationBar rate={p.inflationRate} />
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                            <span>Actual: <strong className="text-slate-700">{ars(p.currentBudget)}</strong></span>
                            <ArrowUpRight className="w-3 h-3 text-orange-500" />
                            <span>Ajustado: <strong className="text-orange-600">{ars(p.projectedBudget)}</strong></span>
                            <span className="text-orange-500 font-bold">+{ars(p.delta)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer con totales y botón aplicar */}
          <div className="px-4 py-4 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-600">
                <span>Presupuesto actual: <strong>{ars(report.totalCurrentBudget)}</strong></span>
                <span className="mx-2 text-slate-300">→</span>
                <span>Ajustado: <strong className="text-orange-600">{ars(report.totalProjectedBudget)}</strong></span>
              </div>
              <span className="text-xs font-black text-orange-600">+{ars(report.totalDelta)}</span>
            </div>

            {/* Insight de IA */}
            <div className="flex items-start gap-2 p-2.5 bg-purple-50 rounded-xl border border-purple-100 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-purple-700 leading-relaxed">
                {InflationModeEngine.generateInsight(report)}
              </p>
            </div>

            <button
              onClick={handleApply}
              disabled={applied}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                applied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:opacity-90 shadow-lg'
              }`}
            >
              {applied ? (
                <><CheckCircle2 className="w-4 h-4" /> Presupuestos actualizados</>
              ) : (
                <><RefreshCw className="w-4 h-4" /> Aplicar ajuste inflacionario</>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default InflationModeSection;
