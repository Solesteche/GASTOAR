import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Store, 
  CreditCard,
  Tag,
  AlertCircle,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { CategoryMap, LearnedMerchant, PaymentMethod } from '../types';
import { 
  getLearnedPreferences, 
  saveLearnedPreferences, 
  recordLearnedPreference, 
  deleteLearnedPreference, 
  resetLearnedPreferences,
  cleanKeywordPhrase
} from '../utils/learnedPreferences';

interface LearnedPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryMap: CategoryMap;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Mercado Pago'];

export const LearnedPreferencesModal: React.FC<LearnedPreferencesModalProps> = ({
  isOpen,
  onClose,
  categoryMap,
  onShowToast
}) => {
  const [preferences, setPreferences] = useState<LearnedMerchant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New rule form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newMerchantName, setNewMerchantName] = useState('');
  const [newCategoria, setNewCategoria] = useState('');
  const [newSubcategoria, setNewSubcategoria] = useState('');
  const [newMetodoPago, setNewMetodoPago] = useState<PaymentMethod | ''>('');

  // Edit rule state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategoria, setEditCategoria] = useState('');
  const [editSubcategoria, setEditSubcategoria] = useState('');
  const [editMetodoPago, setEditMetodoPago] = useState<PaymentMethod | ''>('');
  const [editMerchantName, setEditMerchantName] = useState('');

  // Load preferences
  useEffect(() => {
    if (isOpen) {
      setPreferences(getLearnedPreferences());
      // Set initial categories for add form if available
      const firstCat = Object.keys(categoryMap)[0] || 'Alimentación & Bebidas';
      setNewCategoria(firstCat);
      setNewSubcategoria(categoryMap[firstCat]?.[0] || 'General');
    }
  }, [isOpen, categoryMap]);

  // When new category changes, update subcategory options
  const handleNewCategoryChange = (cat: string) => {
    setNewCategoria(cat);
    const subcats = categoryMap[cat] || [];
    setNewSubcategoria(subcats[0] || 'General');
  };

  const handleEditCategoryChange = (cat: string) => {
    setEditCategoria(cat);
    const subcats = categoryMap[cat] || [];
    setEditSubcategoria(subcats[0] || 'General');
  };

  // Filtered list
  const filteredPreferences = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return preferences;
    return preferences.filter(p => 
      p.keyword.toLowerCase().includes(term) ||
      p.merchantName.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term) ||
      p.subcategoria.toLowerCase().includes(term)
    );
  }, [preferences, searchTerm]);

  if (!isOpen) return null;

  // Handle Add New Rule
  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newMerchantName.trim() || !newCategoria) {
      onShowToast('Completá la palabra clave, el nombre del comercio y la categoría.', 'error');
      return;
    }

    const updated = recordLearnedPreference(
      newMerchantName.trim(),
      newCategoria,
      newSubcategoria || 'General',
      newMetodoPago ? (newMetodoPago as PaymentMethod) : undefined,
      'manual'
    );

    // If user typed a custom keyword different from the merchant name, register keyword mapping
    const cleanKey = cleanKeywordPhrase(newKeyword);
    const targetItem = updated.find(item => item.merchantName.toLowerCase() === newMerchantName.trim().toLowerCase());
    if (targetItem && cleanKey && cleanKey !== targetItem.keyword) {
      targetItem.keyword = cleanKey;
      saveLearnedPreferences(updated);
    }

    setPreferences(getLearnedPreferences());
    setIsAddingNew(false);
    setNewKeyword('');
    setNewMerchantName('');
    setNewMetodoPago('');
    onShowToast(`✅ Regla para "${newMerchantName}" agregada con éxito`, 'success');
  };

  // Start editing
  const startEditing = (rule: LearnedMerchant) => {
    setEditingId(rule.id);
    setEditMerchantName(rule.merchantName);
    setEditCategoria(rule.categoria);
    setEditSubcategoria(rule.subcategoria);
    setEditMetodoPago(rule.defaultMetodoPago || '');
  };

  // Save edit
  const saveEditing = (id: string) => {
    const updated = preferences.map(p => {
      if (p.id === id) {
        return {
          ...p,
          merchantName: editMerchantName.trim() || p.merchantName,
          categoria: editCategoria,
          subcategoria: editSubcategoria,
          defaultMetodoPago: editMetodoPago ? (editMetodoPago as PaymentMethod) : undefined,
          lastUsed: Date.now()
        };
      }
      return p;
    });

    saveLearnedPreferences(updated);
    setPreferences(updated);
    setEditingId(null);
    onShowToast('Regla de comercio actualizada.', 'success');
  };

  // Delete rule
  const handleDelete = (id: string, name: string) => {
    const updated = deleteLearnedPreference(id);
    setPreferences(updated);
    onShowToast(`Regla para "${name}" eliminada.`, 'info');
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm('¿Querés restablecer la base de comercios aprendidos a los valores recomendados de Argentina?')) {
      const defs = resetLearnedPreferences();
      setPreferences(defs);
      onShowToast('Se restablecieron los comercios aprendidos iniciales.', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-purple-100/80 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Comercios y Preferencias Aprendidas
                </h2>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  {preferences.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Aprende automáticamente tus frases y asocia comercios con categorías
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explain info banner */}
        <div className="px-5 py-3 bg-indigo-50/60 border-b border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            Cada vez que registrás o confirmás un gasto (ej: <em>"La Shell"</em> o <em>"Farmacia"</em>), el sistema aprende esa preferencia y la propondrá automáticamente con máxima confianza en tus próximos audios.
          </span>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar comercio o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              {isAddingNew ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isAddingNew ? 'Cancelar' : 'Nuevo Comercio'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              title="Restablecer sugerencias iniciales"
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add New Rule Form */}
        {isAddingNew && (
          <form onSubmit={handleAddNew} className="p-4 bg-purple-50/70 border-b border-purple-200 animate-in slide-in-from-top-2">
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-purple-600" />
              Agregar nuevo comercio aprendido
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Frase o palabra clave dicha:
                </label>
                <input
                  type="text"
                  placeholder="ej: la shell, farmacia, chino..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Nombre del comercio / concepto:
                </label>
                <input
                  type="text"
                  placeholder="ej: Shell, Farmacia, Coto..."
                  value={newMerchantName}
                  onChange={(e) => setNewMerchantName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Categoría asignada:
                </label>
                <select
                  value={newCategoria}
                  onChange={(e) => handleNewCategoryChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {Object.keys(categoryMap).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Subcategoría:
                </label>
                <select
                  value={newSubcategoria}
                  onChange={(e) => setNewSubcategoria(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  {(categoryMap[newCategoria] || ['General']).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">
                  Método de pago habitual (opcional):
                </label>
                <select
                  value={newMetodoPago}
                  onChange={(e) => setNewMetodoPago(e.target.value as PaymentMethod | '')}
                  className="w-full sm:w-1/2 px-3 py-1.5 rounded-xl border border-purple-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">(Sin preferencia fija)</option>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-white text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Guardar Comercio
              </button>
            </div>
          </form>
        )}

        {/* List of Learned Merchants */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
          {filteredPreferences.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Store className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No se encontraron comercios aprendidos.</p>
              <p className="text-xs mt-1 text-slate-400">Podés agregar uno manualmente con el botón superior.</p>
            </div>
          ) : (
            filteredPreferences.map((pref) => {
              const isEditing = editingId === pref.id;

              if (isEditing) {
                return (
                  <div key={pref.id} className="pt-2.5 first:pt-0">
                    <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-300 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                        <span>Editando regla para: "{pref.keyword}"</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Nombre Comercio:</label>
                          <input
                            type="text"
                            value={editMerchantName}
                            onChange={(e) => setEditMerchantName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Método de Pago:</label>
                          <select
                            value={editMetodoPago}
                            onChange={(e) => setEditMetodoPago(e.target.value as PaymentMethod | '')}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                          >
                            <option value="">(Sin método preferido)</option>
                            {PAYMENT_METHODS.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Categoría:</label>
                          <select
                            value={editCategoria}
                            onChange={(e) => handleEditCategoryChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                          >
                            {Object.keys(categoryMap).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Subcategoría:</label>
                          <select
                            value={editSubcategoria}
                            onChange={(e) => setEditSubcategoria(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                          >
                            {(categoryMap[editCategoria] || ['General']).map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded-xl text-slate-600 hover:bg-white text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditing(pref.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={pref.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Store className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {pref.merchantName}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                          "{pref.keyword}"
                        </span>
                        {pref.frequency > 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                            Usado {pref.frequency}x
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 flex-wrap text-xs">
                        <span className="inline-flex items-center gap-1 text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3 text-purple-500" />
                          {pref.categoria}
                        </span>
                        <span className="text-slate-400">›</span>
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {pref.subcategoria}
                        </span>
                        {pref.defaultMetodoPago && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                            <CreditCard className="w-3 h-3" />
                            {pref.defaultMetodoPago}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditing(pref)}
                      title="Editar regla"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pref.id, pref.merchantName)}
                      title="Eliminar regla"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredPreferences.length} de {preferences.length} comercios</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
