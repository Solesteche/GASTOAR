import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
  X, 
  Check, 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  Ban, 
  Plus, 
  Layers, 
  Calculator, 
  RotateCcw,
  Info,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface BudgetCategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  currentBudget: number;
  currentSpent: number;
  currency: string;
  categoryColor?: string;
  subcategories?: string[];
  subcategoriesBudgets?: Record<string, number>;
  subcategoriesSpent?: Record<string, number>;
  onSave: (
    categoryName: string, 
    calculatedCategoryBudget: number, 
    newSubcategoryBudgets: Record<string, number>
  ) => void;
  onAddSubcategory?: (categoryName: string, subcatName: string) => void;
}

export const BudgetCategoryEditModal: React.FC<BudgetCategoryEditModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  currentBudget,
  currentSpent,
  currency,
  categoryColor = '#7928CA',
  subcategories = [],
  subcategoriesBudgets = {},
  subcategoriesSpent = {},
  onSave,
  onAddSubcategory,
}) => {
  // Local state for subcategory budgets
  const [localSubBudgets, setLocalSubBudgets] = useState<Record<string, number>>({});
  // Local state for direct budget input (fallback when no subcategories)
  const [directBudgetInput, setDirectBudgetInput] = useState<string>('');
  // Mode: 'subcategories' (auto-sum) or 'direct' (lump sum)
  const [activeMode, setActiveMode] = useState<'subcategories' | 'direct'>('subcategories');
  // New subcategory input
  const [newSubcatName, setNewSubcatName] = useState<string>('');
  const [showAddSubcat, setShowAddSubcat] = useState<boolean>(false);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      const initialSubs: Record<string, number> = {};
      subcategories.forEach(sub => {
        if (subcategoriesBudgets[sub] !== undefined) {
          initialSubs[sub] = subcategoriesBudgets[sub];
        } else {
          initialSubs[sub] = 0;
        }
      });
      setLocalSubBudgets(initialSubs);
      setDirectBudgetInput(currentBudget > 0 ? String(currentBudget) : '');

      const hasExistingSubBudgets = Object.values(subcategoriesBudgets).some(v => (Number(v) || 0) > 0);
      if (hasExistingSubBudgets || subcategories.length > 0) {
        setActiveMode('subcategories');
      } else {
        setActiveMode('direct');
      }
    }
  }, [isOpen, categoryName, subcategories, subcategoriesBudgets, currentBudget]);

  // Sum of all subcategories
  const totalSubcategoriesSum = useMemo(() => {
    return Object.values(localSubBudgets).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
  }, [localSubBudgets]);

  const hasAnySubcategoryBudget = useMemo(() => {
    return Object.values(localSubBudgets).some(val => (Number(val) || 0) > 0);
  }, [localSubBudgets]);

  // Effective category budget:
  // If in subcategories mode and subcategories have budgets (or mode is subcategories),
  // the category total is automatically derived from the sum of subcategories.
  const effectiveCategoryBudget = useMemo(() => {
    if (activeMode === 'subcategories') {
      return totalSubcategoriesSum;
    }
    return Math.max(0, Math.round(Number(directBudgetInput) || 0));
  }, [activeMode, totalSubcategoriesSum, directBudgetInput]);

  const differenceWithSpent = effectiveCategoryBudget > 0 ? effectiveCategoryBudget - currentSpent : 0;
  const isOverSpentWithNewLimit = effectiveCategoryBudget > 0 && currentSpent > effectiveCategoryBudget;

  if (!isOpen) return null;

  const handleSubBudgetChange = (sub: string, rawVal: string) => {
    const num = Math.max(0, parseFloat(rawVal) || 0);
    setLocalSubBudgets(prev => ({
      ...prev,
      [sub]: num,
    }));
  };

  // Quick Preset: Copy real expenses for all subcategories
  const handleCopyAllRealExpenses = () => {
    const next: Record<string, number> = {};
    subcategories.forEach(sub => {
      const spent = subcategoriesSpent[sub] || 0;
      next[sub] = Math.ceil(spent / 1000) * 1000 || spent;
    });
    setLocalSubBudgets(next);
  };

  // Quick Preset: Apply inflation percentage to all active subcategory budgets
  const handleApplyInflation = (pct: number) => {
    const factor = 1 + pct / 100;
    const next: Record<string, number> = {};
    Object.entries(localSubBudgets).forEach(([sub, val]) => {
      const numVal = Number(val) || 0;
      if (numVal > 0) {
        next[sub] = Math.ceil((numVal * factor) / 1000) * 1000;
      } else {
        // If 0, use spent * factor
        const spent = subcategoriesSpent[sub] || 0;
        if (spent > 0) {
          next[sub] = Math.ceil((spent * factor) / 1000) * 1000;
        } else {
          next[sub] = 0;
        }
      }
    });
    setLocalSubBudgets(next);
  };

  // Quick Preset: Distribute equal amount
  const handleDistributeEqually = (totalToDistribute: number) => {
    if (subcategories.length === 0) return;
    const perSub = Math.round(totalToDistribute / subcategories.length / 1000) * 1000;
    const next: Record<string, number> = {};
    subcategories.forEach(sub => {
      next[sub] = perSub;
    });
    setLocalSubBudgets(next);
  };

  // Clear all subcategory budgets
  const handleClearAll = () => {
    const next: Record<string, number> = {};
    subcategories.forEach(sub => {
      next[sub] = 0;
    });
    setLocalSubBudgets(next);
    setDirectBudgetInput('');
  };

  // Add new subcategory handler
  const handleAddNewSubcat = () => {
    const trimmed = newSubcatName.trim();
    if (!trimmed) return;
    if (onAddSubcategory) {
      onAddSubcategory(categoryName, trimmed);
    }
    setLocalSubBudgets(prev => ({
      ...prev,
      [trimmed]: 0,
    }));
    setNewSubcatName('');
    setShowAddSubcat(false);
  };

  const handleSave = () => {
    // If subcategories mode, save subcategories map and the auto-calculated sum
    if (activeMode === 'subcategories') {
      onSave(categoryName, totalSubcategoriesSum, localSubBudgets);
    } else {
      // Direct lump sum mode: clear subcategories budgets for this category
      const clearedSubs: Record<string, number> = {};
      subcategories.forEach(s => {
        clearedSubs[s] = 0;
      });
      const parsedDirect = Math.max(0, Math.round(Number(directBudgetInput) || 0));
      onSave(categoryName, parsedDirect, clearedSubs);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-5 animate-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: categoryColor }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Asignar Presupuesto por Subcategoría
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Categoría: <strong className="text-slate-800">{categoryName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PROMINENT AUTO-CALCULATED CATEGORY TOTAL DISPLAY */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border border-purple-200/90 shadow-xs space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#7928CA]" />
              Total Presupuesto de {categoryName}
            </span>
            {activeMode === 'subcategories' && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7928CA] text-[11px] font-extrabold flex items-center gap-1 border border-purple-200">
                <Sparkles className="w-3 h-3 text-[#7928CA]" />
                Suma Automática de Subcategorías
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
                {formatCurrency(effectiveCategoryBudget, currency)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                límite total mensual
              </span>
            </div>

            {/* Spent comparison */}
            <div className="text-right text-xs">
              <span className="text-slate-500 font-medium block">
                Gasto real este mes: <strong>{formatCurrency(currentSpent, currency)}</strong>
              </span>
              {effectiveCategoryBudget > 0 && (
                isOverSpentWithNewLimit ? (
                  <span className="text-rose-600 font-bold">
                    Supera por {formatCurrency(Math.abs(differenceWithSpent), currency)}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">
                    Saldo libre: {formatCurrency(differenceWithSpent, currency)}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Detailed sum explanation */}
          {activeMode === 'subcategories' && (
            <p className="text-[11px] text-purple-800/80 font-medium pt-1 border-t border-purple-100/80">
              💡 <strong>Cálculo automático:</strong> El total de la categoría se actualiza automáticamente sumando cada subcategoría. No necesitás ingresar el total de la categoría manualmente.
            </p>
          )}
        </div>

        {/* MODE TOGGLE TABS */}
        <div className="flex items-center justify-between shrink-0">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMode('subcategories')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'subcategories'
                  ? 'bg-white text-[#7928CA] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Por Subcategoría ({subcategories.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('direct')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'direct'
                  ? 'bg-white text-[#7928CA] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Monto Global Directo</span>
            </button>
          </div>

          {activeMode === 'subcategories' && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={handleCopyAllRealExpenses}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-purple-50 hover:text-[#7928CA] rounded-lg transition-colors cursor-pointer"
                title="Copiar el gasto real registrado de cada subcategoría como su presupuesto"
              >
                Copiar reales
              </button>
              <button
                type="button"
                onClick={() => handleApplyInflation(8)}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-purple-50 hover:text-[#7928CA] rounded-lg transition-colors cursor-pointer"
                title="Aumentar un 8% por inflación"
              >
                +8% inflac.
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Restablecer a 0"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* CONTENT AREA (SCROLLABLE) */}
        <div className="overflow-y-auto pr-1 space-y-3 flex-1">
          {activeMode === 'subcategories' ? (
            <div className="space-y-3">
              {subcategories.length > 0 ? (
                <div className="space-y-2">
                  {subcategories.map(sub => {
                    const val = localSubBudgets[sub] !== undefined ? localSubBudgets[sub] : 0;
                    const spent = subcategoriesSpent[sub] || 0;
                    const subDiff = val > 0 ? val - spent : 0;
                    const subPct = val > 0 ? Math.round((spent / val) * 100) : 0;

                    return (
                      <div
                        key={sub}
                        className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-purple-200 hover:bg-purple-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        {/* Subcategory Label & Spent info */}
                        <div className="space-y-0.5 min-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#7928CA]" />
                            <strong className="text-xs font-extrabold text-slate-900 truncate">
                              {sub}
                            </strong>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Gasto real: <span className="font-outfit text-slate-700 font-bold">{formatCurrency(spent, currency)}</span>
                            {val > 0 && (
                              <span className={`ml-1.5 font-bold ${subDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                ({subPct}%)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Input & Quick Fill */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {spent > 0 && val === 0 && (
                            <button
                              type="button"
                              onClick={() => handleSubBudgetChange(sub, String(spent))}
                              className="px-2 py-1 bg-white border border-purple-200 text-[#7928CA] rounded-lg text-[10px] font-bold hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Copiar gasto real"
                            >
                              Copiar ${Math.round(spent)}
                            </button>
                          )}

                          <div className="relative w-36">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={val > 0 ? val : ''}
                              onChange={(e) => handleSubBudgetChange(sub, e.target.value)}
                              placeholder="0"
                              className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 font-outfit focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-[#7928CA] text-right"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-600 font-medium">
                    Esta categoría no tiene subcategorías registradas aún.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddSubcat(true)}
                    className="px-3 py-1.5 bg-purple-50 text-[#7928CA] border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear primera subcategoría
                  </button>
                </div>
              )}

              {/* Add new subcategory field */}
              {showAddSubcat ? (
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubcatName}
                    onChange={(e) => setNewSubcatName(e.target.value)}
                    placeholder="Nombre de la nueva subcategoría..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddNewSubcat}
                    disabled={!newSubcatName.trim()}
                    className="px-3 py-1.5 bg-[#7928CA] text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSubcat(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddSubcat(true)}
                  className="text-xs text-[#7928CA] font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar otra subcategoría a {categoryName}
                </button>
              )}
            </div>
          ) : (
            /* DIRECT MODE */
            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Límite mensual global para {categoryName} ({currency}):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={directBudgetInput}
                    onChange={(e) => setDirectBudgetInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-base font-outfit focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    placeholder="Ej: 80000"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500">Sugerencias:</span>
                {currentSpent > 0 && (
                  <button
                    type="button"
                    onClick={() => setDirectBudgetInput(String(Math.ceil((currentSpent * 1.15) / 1000) * 1000))}
                    className="px-2.5 py-1 bg-white border border-purple-200 text-[#7928CA] rounded-lg text-xs font-bold hover:bg-purple-50 transition-colors cursor-pointer"
                  >
                    +15% sobre gasto real ({formatCurrency(Math.ceil(currentSpent * 1.15), currency)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDirectBudgetInput('0')}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Quitar límite (0)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Total a guardar: <strong className="text-slate-900 font-outfit">{formatCurrency(effectiveCategoryBudget, currency)}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-[#7928CA] to-[#9d4edd] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Presupuesto</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
