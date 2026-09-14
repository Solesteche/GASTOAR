import React, { useState, useMemo } from 'react';
import { 
  FolderPlus, 
  Plus, 
  Trash2, 
  Sparkles, 
  Search, 
  Layers, 
  Tag, 
  Check, 
  X, 
  Edit3, 
  Lock, 
  ShieldCheck, 
  Tv, 
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { CategoryColors, CategoryMap } from '../types';

interface CategoriesSectionProps {
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  canManageCategories?: boolean;
  onAddCategory?: (name: string, color: string) => void;
  onAddSubcategory: (catName: string, subcatName: string) => void;
  onDeleteCategory: (catName: string) => void;
  onDeleteSubcategory: (catName: string, subcatName: string) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const P = "#6F2EC5";

const COLOR_PALETTE = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#6F2EC5', // Brand Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#475569', // Slate
];

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categoryMap = {},
  categoryColors = {},
  canManageCategories = true,
  onAddCategory,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pro Plan Demo View Toggle
  const [isDemoProView, setIsDemoProView] = useState(true);

  // Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSubcatModalOpen, setIsSubcatModalOpen] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PALETTE[0]);
  const [initialSubcat, setInitialSubcat] = useState('');
  const [newSubcatName, setNewSubcatName] = useState('');

  const categories = useMemo(() => Object.keys(categoryMap), [categoryMap]);
  
  const totalSubcategories = useMemo(() => {
    return (Object.values(categoryMap) as string[][]).reduce((acc, subs) => acc + (Array.isArray(subs) ? subs.length : 0), 0);
  }, [categoryMap]);

  // Filter categories and subcategories
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.toLowerCase();

    return categories.filter(cat => {
      const nameMatch = cat.toLowerCase().includes(q);
      const subs = categoryMap[cat] || [];
      const subMatch = subs.some(s => s.toLowerCase().includes(q));
      return nameMatch || subMatch;
    });
  }, [categories, categoryMap, searchTerm]);

  const handleOpenAddCategory = () => {
    setNewCatName('');
    setNewCatColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    setInitialSubcat('');
    setIsCatModalOpen(true);
  };

  const handleOpenAddSubcat = (catName?: string) => {
    setSelectedParentCategory(catName || categories[0] || '');
    setNewSubcatName('');
    setIsSubcatModalOpen(true);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      onShowToast?.('Ingresá el nombre de la categoría', 'error');
      return;
    }
    if (onAddCategory) {
      onAddCategory(newCatName.trim(), newCatColor);
      if (initialSubcat.trim()) {
        onAddSubcategory(newCatName.trim(), initialSubcat.trim());
      }
      onShowToast?.(`Categoría "${newCatName.trim()}" creada con éxito`, 'success');
      setIsCatModalOpen(false);
    }
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentCategory || !newSubcatName.trim()) {
      onShowToast?.('Completá el nombre del subrubro', 'error');
      return;
    }
    onAddSubcategory(selectedParentCategory, newSubcatName.trim());
    onShowToast?.(`Subrubro "${newSubcatName.trim()}" añadido a ${selectedParentCategory}`, 'success');
    setIsSubcatModalOpen(false);
  };

  const handleDeleteCat = (catName: string) => {
    if (confirm(`¿Eliminar la categoría "${catName}" y todos sus subrubros?`)) {
      onDeleteCategory(catName);
      onShowToast?.(`Categoría eliminada`, 'info');
    }
  };

  const handleDeleteSub = (catName: string, subName: string) => {
    if (confirm(`¿Eliminar el subrubro "${subName}"?`)) {
      onDeleteSubcategory(catName, subName);
      onShowToast?.(`Subrubro eliminado`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PRO DEMO VIEW (Matches visual language of Lista de Gastos) */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: P }}
            >
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Categorías y Subrubros
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#6F2EC5] border border-purple-200">
                  {categories.length} categorías • {totalSubcategories} subrubros
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Estructura contable para clasificar con precisión tus gastos personales y de pareja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenAddSubcat()}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>+ Nuevo Subrubro</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddCategory}
              className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: P }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nueva Categoría</span>
            </button>
          </div>
        </div>

        {/* 2. DEMO PRO VIEW BANNER */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-50 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6F2EC5] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-[#6F2EC5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900">
                  Vista Plan Pro (Demo Activa)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Ilimitado
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                En esta demo podés crear, editar y organizar todas las categorías y subrubros personalizados sin restricciones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-xs text-purple-900 font-bold bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs">
              Suscripciones & Plataformas Incluidas
            </span>
          </div>
        </div>
      </section>

      {/* 3. SEARCH BAR */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar categorías o plataformas (Netflix, Spotify, Supermercado, Expensas...)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </section>

      {/* 4. CATEGORIES GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map(cat => {
          const subs = categoryMap[cat] || [];
          const color = categoryColors[cat] || '#6F2EC5';
          const isSubscriptions = cat === 'Suscripciones' || cat.toLowerCase().includes('suscrip');

          return (
            <div
              key={cat}
              className={`p-5 rounded-3xl border transition-all space-y-4 ${
                isSubscriptions
                  ? 'bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 border-purple-300 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-purple-200 hover:shadow-xs'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate flex items-center gap-2">
                      <span>{cat}</span>
                      {isSubscriptions && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6F2EC5] border border-purple-200">
                          Digital & Streaming
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {subs.length} subrubros registrados
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenAddSubcat(cat)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-[#6F2EC5] hover:bg-purple-50 transition-colors cursor-pointer"
                    title={`Agregar subrubro a ${cat}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCat(cat)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={`Eliminar categoría ${cat}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subcategories Chips */}
              <div className="flex flex-wrap gap-1.5">
                {subs.map(sub => (
                  <span
                    key={sub}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSub(cat, sub)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                      title={`Eliminar subrubro ${sub}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={() => handleOpenAddSubcat(cat)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50/70 hover:bg-purple-100 text-[#6F2EC5] text-xs font-bold border border-purple-200/80 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Subrubro</span>
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* 5. ADD CATEGORY MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2E0854]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 border border-purple-100">
            <div className="bg-gradient-to-r from-[#2E0854] to-[#45108A] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-200 shadow-xs border border-purple-400/20">
                  <FolderPlus className="w-4 h-4 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    Nueva Categoría
                  </h3>
                  <p className="text-[10px] text-purple-200">
                    Definí el nombre y color identificador
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-purple-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Suscripciones, Gimnasio, Mascotas..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Color Distintivo</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        newCatColor === c ? 'scale-110 ring-2 ring-purple-600 ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {newCatColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Primer Subrubro (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. General, Mensual..."
                  value={initialSubcat}
                  onChange={e => setInitialSubcat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                  style={{ backgroundColor: P }}
                >
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD SUBCATEGORY MODAL */}
      {isSubcatModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2E0854]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 border border-purple-100">
            <div className="bg-gradient-to-r from-[#2E0854] to-[#45108A] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-200 shadow-xs border border-purple-400/20">
                  <Tag className="w-4 h-4 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    Nuevo Subrubro
                  </h3>
                  <p className="text-[10px] text-purple-200">
                    Añadí un nuevo concepto detallado a tu categoría
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubcatModalOpen(false)}
                className="text-purple-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubcategory} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Categoría Contenedora</label>
                <select
                  value={selectedParentCategory}
                  onChange={e => setSelectedParentCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre del Subrubro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Netflix, Spotify, Carnicería, Alquiler Mensual..."
                  value={newSubcatName}
                  onChange={e => setNewSubcatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubcatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                  style={{ backgroundColor: P }}
                >
                  Añadir Subrubro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
