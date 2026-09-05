import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sliders, 
  Target, 
  Check, 
  RotateCcw,
  Sparkles,
  BellRing,
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
  HelpCircle,
  ArrowUpRight,
  Calculator,
  Undo2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Budgets, CategoryMap, CoupleProfile, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budgets;
  categoryMap: CategoryMap;
  profile?: CoupleProfile;
  currency?: string;
  transactions?: Transaction[];
  onSaveBudgets: (newBudgets: Budgets) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgets,
  categoryMap,
  profile,
  currency,
  transactions = [],
  onSaveBudgets,
}) => {
  const currentCurrency = profile?.currency || currency || 'ARS';

  // Core local state
  const [localBudgets, setLocalBudgets] = useState<Budgets>(() => ({
    categories: budgets?.categories ? { ...budgets.categories } : {},
    subcategories: budgets?.subcategories ? { ...budgets.subcategories } : {},
    alertThresholdPercent: budgets?.alertThresholdPercent || 80,
    projectionGrowthPercent: budgets?.projectionGrowthPercent || 15,
  }));

  // Alert threshold state (default 80%)
  const [alertThreshold, setAlertThreshold] = useState<number>(budgets?.alertThresholdPercent || 80);

  // Projection tool states
  const [isProjectionOpen, setIsProjectionOpen] = useState(false);
  const [projectionPercent, setProjectionPercent] = useState<number>(15);
  const [projectionSource, setProjectionSource] = useState<'current_budget' | 'real_expenses'>('current_budget');
  const [roundToThousands, setRoundToThousands] = useState(true);
  const [previousBudgetsBackup, setPreviousBudgetsBackup] = useState<Budgets | null>(null);
  const [projectionAppliedNotice, setProjectionAppliedNotice] = useState<string | null>(null);

  // Sync state on modal open
  useEffect(() => {
    if (isOpen) {
      const initialCats = budgets?.categories ? { ...budgets.categories } : {};
      const initialSubs = budgets?.subcategories ? { ...budgets.subcategories } : {};
      const threshold = budgets?.alertThresholdPercent || 80;
      setLocalBudgets({
        categories: initialCats,
        subcategories: initialSubs,
        alertThresholdPercent: threshold,
        projectionGrowthPercent: budgets?.projectionGrowthPercent || 15,
      });
      setAlertThreshold(threshold);
      setPreviousBudgetsBackup(null);
      setProjectionAppliedNotice(null);
    }
  }, [isOpen, budgets]);

  // Calculate real current expenses per category from transactions
  const realExpensesByCategory = useMemo(() => {
    const expenses: Record<string, number> = {};
    (transactions || []).forEach(tx => {
      if (tx && tx.tipoTransaccion !== 'ingreso') {
        expenses[tx.categoria] = (expenses[tx.categoria] || 0) + (tx.monto || 0);
      }
    });
    return expenses;
  }, [transactions]);

  // Total current vs total calculated
  const totalCurrentBudget = useMemo(() => {
    return (Object.values(localBudgets.categories || {}) as (number | undefined)[]).reduce<number>(
      (acc, val) => acc + (val || 0),
      0
    );
  }, [localBudgets.categories]);

  if (!isOpen) return null;

  const handleCategoryBudgetChange = (cat: string, val: string) => {
    if (val === '') {
      setLocalBudgets(prev => {
        const nextCats = { ...prev.categories };
        delete nextCats[cat];
        return { ...prev, categories: nextCats };
      });
      return;
    }
    const num = parseFloat(val);
    setLocalBudgets(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [cat]: isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleSubcategoryBudgetChange = (sub: string, val: string) => {
    if (val === '') {
      setLocalBudgets(prev => {
        const nextSubs = { ...prev.subcategories };
        delete nextSubs[sub];
        return { ...prev, subcategories: nextSubs };
      });
      return;
    }
    const num = parseFloat(val);
    setLocalBudgets(prev => ({
      ...prev,
      subcategories: {
        ...prev.subcategories,
        [sub]: isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleClearAllBudgets = () => {
    setPreviousBudgetsBackup(JSON.parse(JSON.stringify(localBudgets)));
    setLocalBudgets(prev => ({
      ...prev,
      categories: {},
      subcategories: {},
    }));
    setProjectionAppliedNotice('Se han vaciado los presupuestos. Podés deshacer si fue un error.');
  };

  // Automatic Projection Calculation
  const handleApplyProjection = () => {
    setPreviousBudgetsBackup(JSON.parse(JSON.stringify(localBudgets)));
    const growthFactor = 1 + (projectionPercent / 100);
    const newCategories: Record<string, number> = {};
    const newSubcategories: Record<string, number> = {};

    let totalCalculated = 0;
    let categoriesCount = 0;

    Object.keys(categoryMap).forEach(cat => {
      let baseValue = 0;
      if (projectionSource === 'current_budget') {
        baseValue = localBudgets.categories[cat] || 0;
      } else {
        // Based on real expenses
        baseValue = realExpensesByCategory[cat] || localBudgets.categories[cat] || 0;
      }

      if (baseValue > 0) {
        let projected = baseValue * growthFactor;
        if (roundToThousands) {
          projected = Math.round(projected / 1000) * 1000;
        } else {
          projected = Math.round(projected);
        }
        newCategories[cat] = projected;
        totalCalculated += projected;
        categoriesCount++;
      }
    });

    // Also project subcategories if any were defined
    Object.entries(localBudgets.subcategories || {}).forEach(([sub, val]) => {
      const numVal = Number(val) || 0;
      if (numVal > 0) {
        let projectedSub = numVal * growthFactor;
        if (roundToThousands) {
          projectedSub = Math.round(projectedSub / 1000) * 1000;
        } else {
          projectedSub = Math.round(projectedSub);
        }
        newSubcategories[sub] = projectedSub;
      }
    });

    setLocalBudgets(prev => ({
      ...prev,
      categories: newCategories,
      subcategories: newSubcategories,
      projectionGrowthPercent: projectionPercent,
      lastProjectedDate: new Date().toISOString(),
    }));

    setProjectionAppliedNotice(
      `¡Proyección aplicada con éxito! +${projectionPercent}% para el próximo mes en ${categoriesCount} categorías.`
    );
  };

  const handleUndoProjection = () => {
    if (previousBudgetsBackup) {
      setLocalBudgets(previousBudgetsBackup);
      setPreviousBudgetsBackup(null);
      setProjectionAppliedNotice('Se han restaurado los valores previos.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBudgets: Budgets = {
      ...localBudgets,
      alertThresholdPercent: alertThreshold,
      projectionGrowthPercent: projectionPercent,
    };
    onSaveBudgets(finalBudgets);
    onClose();
  };

  // Preset thresholds
  const alertThresholdPresets = [60, 70, 75, 80, 85, 90, 95];
  // Preset projection percentages
  const projectionPercentPresets = [5, 10, 15, 20, 25, 30];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#140728] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 border border-purple-100 dark:border-purple-900/40 text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Configuración de Presupuestos Mensuales
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Fijá límites, proyectá aumentos futuros y personalizá el umbral de alerta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          
          {/* ========================================================================= */}
          {/* SECTION 1: CONFIGURAR PORCENTAJE DE ALERTA DE PRESUPUESTO                */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-purple-50/50 to-indigo-50/40 dark:from-[#1b0a38] dark:via-[#160730] dark:to-[#220c45] border border-amber-200/80 dark:border-purple-800/60 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-purple-100 flex items-center gap-1.5">
                    <span>Umbral de Alerta Preventiva</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] border border-amber-300 dark:border-amber-700">
                      Alcanzado el {alertThreshold}%
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Establecé a partir de qué porcentaje de gasto emitir notificaciones y avisos
                  </p>
                </div>
              </div>
            </div>

            {/* Quick preset buttons for Alert Threshold */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                <span>Porcentaje de activación:</span>
                <span className="font-bold text-[#2E0854] dark:text-purple-200">
                  {alertThreshold < 70 ? 'Alerta Temprana' : alertThreshold <= 85 ? 'Alerta Moderada Recomendada' : 'Alerta Tardía / Crítica'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {alertThresholdPresets.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setAlertThreshold(pct)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                      alertThreshold === pct
                        ? 'bg-[#2E0854] dark:bg-purple-600 text-white ring-2 ring-purple-400 scale-105'
                        : 'bg-white dark:bg-[#120524] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-purple-800/60 hover:border-purple-400'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}

                {/* Custom Number Input */}
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-[11px] text-slate-500 font-medium">Personalizado:</span>
                  <div className="relative w-20">
                    <input
                      type="number"
                      min="30"
                      max="99"
                      value={alertThreshold}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setAlertThreshold(Math.min(99, Math.max(10, val)));
                      }}
                      className="w-full pl-2 pr-6 py-1 bg-white dark:bg-[#120524] border border-slate-300 dark:border-purple-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Slider for smooth selection */}
              <div className="pt-1 flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400">50%</span>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="flex-1 accent-purple-600 dark:accent-purple-400 cursor-pointer h-2 bg-slate-200 dark:bg-purple-950 rounded-lg"
                />
                <span className="text-[10px] font-bold text-slate-400">95%</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
              <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>
                Cuando cualquier categoría supere el <strong>{alertThreshold}%</strong> se encenderá el indicador naranja preventivo. Al <strong>100%</strong> se mostrará en rojo de presupuesto excedido.
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: PROYECTAR PRESUPUESTO EN FORMA AUTOMÁTICA PARA EL PRÓXIMO MES */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-indigo-50/50 to-pink-50/30 dark:from-[#1b0a38] dark:via-[#15072e] dark:to-[#220c45] border-2 border-purple-300 dark:border-purple-700/60 shadow-xs space-y-3.5">
            
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#2E0854] dark:text-purple-100 flex items-center gap-1.5">
                    <span>Proyección Automática para el Próximo Mes</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                      Nuevo
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Aumentá o ajustá los presupuestos automáticamente seleccionando un porcentaje
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProjectionOpen(prev => !prev)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isProjectionOpen ? 'Ocultar Opciones' : 'Abrir Proyector'}</span>
              </button>
            </div>

            {/* Projection Tool Body */}
            {isProjectionOpen && (
              <div className="pt-3 border-t border-purple-200/70 dark:border-purple-800/40 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* 1. Origin Source Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    1. Base para la proyección del próximo mes:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProjectionSource('current_budget')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        projectionSource === 'current_budget'
                          ? 'bg-purple-100/80 dark:bg-purple-900/60 border-purple-600 text-purple-950 dark:text-white font-bold ring-1 ring-purple-500'
                          : 'bg-white dark:bg-[#120524] border-slate-200 dark:border-purple-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-extrabold">Sobre Límites Actuales</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Ajuste por inflación / aumento sobre techos actuales
                        </div>
                      </div>
                      {projectionSource === 'current_budget' && <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-purple-300 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setProjectionSource('real_expenses')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        projectionSource === 'real_expenses'
                          ? 'bg-purple-100/80 dark:bg-purple-900/60 border-purple-600 text-purple-950 dark:text-white font-bold ring-1 ring-purple-500'
                          : 'bg-white dark:bg-[#120524] border-slate-200 dark:border-purple-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-extrabold">Sobre Gastos Reales Registrados</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Toma lo consumido en el mes + margen de holgura
                        </div>
                      </div>
                      {projectionSource === 'real_expenses' && <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-purple-300 shrink-0" />}
                    </button>
                  </div>
                </div>

                {/* 2. Percentage Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      2. Seleccioná el porcentaje de aumento para el próximo mes:
                    </label>
                    <span className="text-xs font-black text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                      +{projectionPercent}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {projectionPercentPresets.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setProjectionPercent(pct)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                          projectionPercent === pct
                            ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white ring-2 ring-purple-400 scale-105'
                            : 'bg-white dark:bg-[#120524] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-purple-800/60 hover:border-purple-400'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}

                    {/* Custom % input */}
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[11px] text-slate-500 font-medium">Otro %:</span>
                      <div className="relative w-20">
                        <input
                          type="number"
                          step="1"
                          min="-50"
                          max="200"
                          value={projectionPercent}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) setProjectionPercent(val);
                          }}
                          className="w-full pl-2 pr-6 py-1 bg-white dark:bg-[#120524] border border-slate-300 dark:border-purple-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Round to Thousands Option & Apply Button */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={roundToThousands}
                      onChange={(e) => setRoundToThousands(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    />
                    <span>Redondear montos a múltiplos de $1.000 para números limpios</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {previousBudgetsBackup && (
                      <button
                        type="button"
                        onClick={handleUndoProjection}
                        className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Deshacer</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleApplyProjection}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] hover:from-[#1F0538] hover:to-[#6820B0] text-white font-black text-xs shadow-md shadow-purple-900/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Calculator className="w-4 h-4 text-amber-300" />
                      <span>Calcular y Aplicar (+{projectionPercent}%)</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Projection Feedback Notice */}
            {projectionAppliedNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{projectionAppliedNotice}</span>
                </div>
                {previousBudgetsBackup && (
                  <button
                    type="button"
                    onClick={handleUndoProjection}
                    className="underline text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 cursor-pointer"
                  >
                    Deshacer
                  </button>
                )}
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: PRESUPUESTO POR CATEGORÍAS PRINCIPALES                         */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-600" />
                <span>Presupuesto por Categorías Principales</span>
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-extrabold text-[#2E0854] dark:text-purple-200">
                  Total Asignado: {formatCurrency(totalCurrentBudget, currentCurrency)}
                </span>
                <button
                  type="button"
                  onClick={handleClearAllBudgets}
                  className="text-[11px] text-purple-700 dark:text-purple-400 hover:text-purple-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Vaciar / Resetear</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(categoryMap).map((cat) => {
                const currentVal = localBudgets.categories[cat] !== undefined ? localBudgets.categories[cat] : '';
                return (
                  <div key={cat} className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 truncate" title={cat}>
                      {cat}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={currentVal}
                        onChange={(e) => handleCategoryBudgetChange(cat, e.target.value)}
                        placeholder="Sin límite (0.00)"
                        className="w-full pl-3 pr-10 py-2 bg-purple-50/30 dark:bg-[#1a0734] border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:bg-white dark:focus:bg-[#1a0734] focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {currentCurrency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: LÍMITES ESPECÍFICOS POR SUBCATEGORÍA (OPCIONAL)               */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-3 border-t border-purple-100 dark:border-purple-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
              Límites Específicos por Subcategoría (Opcional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
              {(Object.entries(categoryMap) as [string, string[]][]).flatMap(([cat, subs]) =>
                (subs || []).map((sub) => {
                  const currentVal = localBudgets.subcategories[sub] !== undefined ? localBudgets.subcategories[sub] : '';
                  return (
                    <div key={`${cat}-${sub}`} className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate" title={`${cat} › ${sub}`}>
                        {cat} › <strong className="text-slate-800 dark:text-slate-100">{sub}</strong>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="100"
                          min="0"
                          value={currentVal}
                          onChange={(e) => handleSubcategoryBudgetChange(sub, e.target.value)}
                          placeholder="Sin límite"
                          className="w-full pl-2.5 pr-8 py-1.5 bg-slate-50 dark:bg-[#1a0734] border border-slate-200 dark:border-purple-800/60 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:bg-white dark:focus:bg-[#1a0734] focus:outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          {currentCurrency}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-purple-900/40 flex items-center justify-between gap-2.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              Umbral de alerta: <strong>{alertThreshold}%</strong> • Proyección: <strong>+{projectionPercent}%</strong>
            </span>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-purple-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-purple-950/40 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2E0854] to-[#7928CA] hover:from-[#230640] hover:to-[#6820B0] text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Presupuestos</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
