import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Target, 
  Check, 
  Coins 
} from 'lucide-react';
import { Budgets, CategoryMap, CoupleProfile } from '../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budgets;
  categoryMap: CategoryMap;
  profile?: CoupleProfile;
  currency?: string;
  onSaveBudgets: (newBudgets: Budgets) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgets,
  categoryMap,
  profile,
  currency,
  onSaveBudgets,
}) => {
  const [localBudgets, setLocalBudgets] = useState<Budgets>(JSON.parse(JSON.stringify(budgets)));
  const currentCurrency = profile?.currency || currency || 'ARS';

  if (!isOpen) return null;

  const handleCategoryBudgetChange = (cat: string, val: string) => {
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
    const num = parseFloat(val);
    setLocalBudgets(prev => ({
      ...prev,
      subcategories: {
        ...prev.subcategories,
        [sub]: isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBudgets(localBudgets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-amber-600 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-700 flex items-center justify-center text-amber-100 shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Configuración de Presupuestos Mensuales
              </h3>
              <p className="text-[10px] text-amber-100">
                Fija techos de gasto ({currentCurrency}) para recibir alertas preventivas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-100 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
          
          {/* Main Category Limits */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Presupuesto por Categorías Principales
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(categoryMap).map((cat) => {
                const currentVal = localBudgets.categories[cat] || '';
                return (
                  <div key={cat} className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 truncate" title={cat}>
                      {cat}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={currentVal}
                        onChange={(e) => handleCategoryBudgetChange(cat, e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
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

          {/* Subcategory Limits */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Límites Específicos por Subcategoría (Opcional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {(Object.entries(categoryMap) as [string, string[]][]).flatMap(([cat, subs]) =>
                (subs || []).map((sub) => {
                  const currentVal = localBudgets.subcategories[sub] || '';
                  return (
                    <div key={`${cat}-${sub}`} className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-600 truncate" title={`${cat} › ${sub}`}>
                        {cat} › <strong className="text-slate-800">{sub}</strong>
                      </label>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={currentVal}
                        onChange={(e) => handleSubcategoryBudgetChange(sub, e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Presupuestos</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
