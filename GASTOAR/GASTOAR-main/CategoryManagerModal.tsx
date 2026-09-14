import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  Plus, 
  Trash2, 
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { CategoryColors, CategoryMap } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  canManageCategories?: boolean;
  onUpgradePlan?: () => void;
  onAddCategory?: (name: string, color: string) => void;
  onSaveCategory?: (catName: string, subcatName: string, color: string) => void;
  onAddSubcategory: (catName: string, subcatName: string) => void;
  onDeleteCategory: (catName: string) => void;
  onDeleteSubcategory: (catName: string, subcatName: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categoryMap,
  categoryColors,
  canManageCategories = true,
  onUpgradePlan,
  onAddCategory,
  onSaveCategory,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
}) => {
  const [actionType, setActionType] = useState<'new_cat' | 'add_sub'>('new_cat');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [targetCategory, setTargetCategory] = useState(Object.keys(categoryMap)[0] || '');
  const [newSubcatName, setNewSubcatName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCategories) return;

    if (actionType === 'new_cat') {
      if (!newCatName.trim()) return;
      if (onAddCategory) {
        onAddCategory(newCatName.trim(), newCatColor);
      } else if (onSaveCategory) {
        onSaveCategory(newCatName.trim(), newSubcatName.trim() || 'General', newCatColor);
      }
      if (newSubcatName.trim() && newSubcatName.trim().toLowerCase() !== 'general') {
        onAddSubcategory(newCatName.trim(), newSubcatName.trim());
      }
      setNewCatName('');
      setNewSubcatName('');
    } else {
      if (!targetCategory || !newSubcatName.trim()) return;
      onAddSubcategory(targetCategory, newSubcatName.trim());
      setNewSubcatName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2E0854]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-purple-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E0854] to-[#45108A] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-200 shadow-sm border border-purple-400/20">
              <FolderPlus className="w-4 h-4 text-[#F95420]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                {canManageCategories ? 'Gestión de Categorías y Subrubros' : 'Catálogo de Categorías'}
              </h3>
              <p className="text-[10px] text-purple-200">
                {canManageCategories 
                  ? 'Personalizá la estructura contable de tus gastos' 
                  : 'Categorías estándar fijas incluidas en tu plan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          
          {/* If Basic Plan: Show locked banner and call to upgrade */}
          {!canManageCategories ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span>Categorías estándar fijas (Plan Básico)</span>
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Tu plan incluye todas las categorías base necesarias para registrar tus consumos. Para <strong>crear tus propias categorías, personalizar colores y añadir subrubros ilimitados</strong>, podés pasarte al Plan Parejas Dúo o Plan Pro.
                  </p>
                </div>
              </div>

              {onUpgradePlan && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onUpgradePlan();
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Desbloquear Categorías Personalizadas (Ver Planes)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            /* Creation Form for Dúo and Pro plans */
            <form onSubmit={handleSubmit} className="p-4 bg-purple-50/20 border border-purple-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E0854]">
                  Agregar Nueva Clasificación
                </span>
              </div>

              {/* Action Type Toggle */}
              <div className="grid grid-cols-2 gap-2 bg-purple-50/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActionType('new_cat')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    actionType === 'new_cat' ? 'bg-white text-[#7928CA] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Nueva Categoría
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('add_sub')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    actionType === 'add_sub' ? 'bg-white text-[#7928CA] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Añadir Subcategoría
                </button>
              </div>

              {actionType === 'new_cat' ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#2E0854] mb-1">
                      Nombre de la Categoría *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ej: Ocio, Mascotas, Educación..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2E0854] mb-1">
                      Color Representativo
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-10 h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white"
                      />
                      <span className="text-xs text-slate-500 font-mono">{newCatColor}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-[#2E0854] mb-1">
                    Categoría Destino *
                  </label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA] focus:outline-none"
                  >
                    {Object.keys(categoryMap).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1">
                  {actionType === 'new_cat' ? 'Subcategoría Inicial (Opcional)' : 'Nombre de la Nueva Subcategoría *'}
                </label>
                <input
                  type="text"
                  required={actionType === 'add_sub'}
                  value={newSubcatName}
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  placeholder={actionType === 'new_cat' ? 'Ej: General, Veterinario, Cine...' : 'Ej: Veterinario, Cine...'}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Guardar Clasificación</span>
              </button>
            </form>
          )}

          {/* List of Existing Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2E0854]/60">
              Categorías Disponibles {canManageCategories ? 'Configuradas' : 'Estándar'}
            </h4>

            <div className="space-y-2.5">
              {(Object.entries(categoryMap) as [string, string[]][]).map(([cat, subs]) => {
                const color = categoryColors[cat] || '#7928CA';
                const subList = subs || [];
                return (
                  <div
                    key={cat}
                    className="p-3.5 bg-purple-50/20 border border-purple-100 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-full ring-2 ring-purple-100" style={{ backgroundColor: color }} />
                        <h5 className="font-extrabold text-xs text-[#2E0854]">{cat}</h5>
                        <span className="text-[10px] text-[#7928CA] bg-purple-50 px-1.5 py-0.5 rounded-md font-bold">({subList.length} subcat)</span>
                      </div>

                      {canManageCategories && Object.keys(categoryMap).length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {subList.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-white text-slate-700 border border-purple-100 shadow-2xs group"
                        >
                          <span>{s}</span>
                          {canManageCategories && subList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteSubcategory(cat, s)}
                              className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                              title="Quitar subcategoría"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
