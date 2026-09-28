import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertTriangle,
  Sliders,
  ChevronRight,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Layers,
  PieChart as PieIcon,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';

export interface CriticalSubcategoryItem {
  name: string;
  parentCategory: string;
  spent: number;
  budget?: number;
  pct?: number;
  remaining?: number;
  isCritical?: boolean;
  isExceeded?: boolean;
  emoji?: string;
}

export interface CriticalBudgetItem {
  id: string;
  name: string;
  type: 'category' | 'subcategory';
  parentCategory?: string;
  spent: number;
  budget: number;
  pct: number;
  remaining: number;
  color?: string;
  emoji?: string;
  isExceeded: boolean;
  isCritical: boolean;
  subcategories?: CriticalSubcategoryItem[];
}

interface BudgetAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertThreshold: number; // Parámetro definido por el usuario (ej. 80%)
  criticalCategories: CriticalBudgetItem[];
  criticalSubcategories: CriticalSubcategoryItem[];
  allBudgetItems: CriticalBudgetItem[];
  onOpenBudgetModal?: () => void;
  onSelectCategory?: (category: string) => void;
  onNavigateTab?: (tab: string) => void;
  isBalanceHidden?: boolean;
}

const getCategoryEmoji = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('supermercado') || n.includes('alimento') || n.includes('comestible')) return '🛒';
  if (n.includes('gastro') || n.includes('restauran') || n.includes('bar') || n.includes('delivery') || n.includes('comida') || n.includes('café') || n.includes('cafe')) return '🍔';
  if (n.includes('alquiler') || n.includes('vivienda') || n.includes('hogar')) return '🏠';
  if (n.includes('expensa')) return '🏢';
  if (n.includes('transporte') || n.includes('auto') || n.includes('nafta') || n.includes('combustible') || n.includes('sube') || n.includes('colectivo') || n.includes('uber')) return '🚗';
  if (n.includes('servicio') || n.includes('luz') || n.includes('gas') || n.includes('agua') || n.includes('aysa') || n.includes('internet') || n.includes('wifi') || n.includes('cable')) return '💡';
  if (n.includes('salud') || n.includes('farmacia') || n.includes('medic') || n.includes('prepaga') || n.includes('osde')) return '💊';
  if (n.includes('ocio') || n.includes('entretenimiento') || n.includes('salida') || n.includes('cine')) return '🎟️';
  if (n.includes('suscrip') || n.includes('stream') || n.includes('plataforma') || n.includes('spotify') || n.includes('netflix')) return '📱';
  if (n.includes('educaci') || n.includes('curso') || n.includes('facultad') || n.includes('libro')) return '📚';
  if (n.includes('mascota') || n.includes('veterinar') || n.includes('perro') || n.includes('gato')) return '🐾';
  if (n.includes('indument') || n.includes('ropa') || n.includes('calzado') || n.includes('zapat')) return '👗';
  if (n.includes('tecnolog') || n.includes('electro') || n.includes('computad') || n.includes('celular')) return '💻';
  return '🏷️';
};

export const BudgetAlertsModal: React.FC<BudgetAlertsModalProps> = ({
  isOpen,
  onClose,
  alertThreshold,
  criticalCategories,
  criticalSubcategories,
  allBudgetItems,
  onOpenBudgetModal,
  onSelectCategory,
  onNavigateTab,
  isBalanceHidden = false,
}) => {
  const [filterTab, setFilterTab] = useState<'critical' | 'categories' | 'subcategories' | 'all'>('critical');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const ars = (n: number) =>
    isBalanceHidden ? '$ •••••' : '$ ' + Math.round(Math.abs(n)).toLocaleString('es-AR');

  const totalCriticalCount = criticalCategories.length + criticalSubcategories.length;

  // Filter items based on current active tab and search query
  const displayedItems = useMemo(() => {
    let list: (CriticalBudgetItem | (CriticalSubcategoryItem & { id: string; type: 'subcategory'; budget: number }))[] = [];

    if (filterTab === 'critical') {
      // Both critical categories and critical subcategories
      list = [
        ...criticalCategories,
        ...criticalSubcategories.map(s => ({
          ...s,
          id: `sub-${s.name}`,
          type: 'subcategory' as const,
          budget: s.budget || 0,
          pct: s.pct || 0,
          remaining: s.remaining ?? ((s.budget || 0) - s.spent),
          isExceeded: Boolean(s.isExceeded),
          isCritical: Boolean(s.isCritical),
        }))
      ];
    } else if (filterTab === 'categories') {
      list = [...criticalCategories];
    } else if (filterTab === 'subcategories') {
      list = criticalSubcategories.map(s => ({
        ...s,
        id: `sub-${s.name}`,
        type: 'subcategory' as const,
        budget: s.budget || 0,
        pct: s.pct || 0,
        remaining: s.remaining ?? ((s.budget || 0) - s.spent),
        isExceeded: Boolean(s.isExceeded),
        isCritical: Boolean(s.isCritical),
      }));
    } else {
      // All items with budget
      list = [...allBudgetItems];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesParent = 'parentCategory' in item && item.parentCategory ? item.parentCategory.toLowerCase().includes(q) : false;
        return matchesName || matchesParent;
      });
    }

    // Sort by pct descending (highest consumed first)
    return list.sort((a, b) => b.pct - a.pct);
  }, [filterTab, criticalCategories, criticalSubcategories, allBudgetItems, searchQuery]);

  // Overall metrics
  const totalCriticalSpent = useMemo(() => {
    return criticalCategories.reduce((acc, c) => acc + c.spent, 0);
  }, [criticalCategories]);

  const totalCriticalBudget = useMemo(() => {
    return criticalCategories.reduce((acc, c) => acc + c.budget, 0);
  }, [criticalCategories]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#160d2b] rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/60 overflow-hidden flex flex-col max-h-[92vh] z-10 font-sans"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center justify-center text-lg shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg leading-tight text-white">
                    Límites de Presupuesto
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs">
                    Estado Crítico
                  </span>
                </div>
                <p className="text-xs text-purple-200 mt-0.5">
                  Categorías y subcategorías que alcanzaron o superaron el umbral fijado ({alertThreshold}%)
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

          {/* User Parameters Info Bar */}
          <div className="bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-rose-500/10 dark:from-purple-950/40 dark:to-[#1a0f35] px-4 py-3 border-b border-purple-100 dark:border-purple-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-bold text-slate-800 dark:text-purple-100">
                Parámetro definido por usuario:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] border border-amber-300/60 dark:border-amber-700/60">
                Alerta a partir de {alertThreshold}%
              </span>
            </div>

            {onOpenBudgetModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBudgetModal();
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#7928CA] dark:text-purple-300 hover:underline cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Modificar umbral o límites</span>
              </button>
            )}
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50/70 dark:bg-purple-950/20 border-b border-slate-100 dark:border-purple-900/30 text-center shrink-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#1a1233] border border-slate-200/80 dark:border-purple-800/40 shadow-2xs">
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                Categorías críticas
              </p>
              <p className="text-base sm:text-xl font-black text-rose-500 dark:text-rose-400 mt-0.5">
                {criticalCategories.length}
              </p>
            </div>

            <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#1a1233] border border-slate-200/80 dark:border-purple-800/40 shadow-2xs">
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                Subcategorías críticas
              </p>
              <p className="text-base sm:text-xl font-black text-amber-500 dark:text-amber-400 mt-0.5">
                {criticalSubcategories.length}
              </p>
            </div>

            <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#1a1233] border border-slate-200/80 dark:border-purple-800/40 shadow-2xs">
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                Gasto rubros críticos
              </p>
              <p className="text-sm sm:text-base font-black text-purple-700 dark:text-purple-300 mt-1 truncate">
                {ars(totalCriticalSpent)}
              </p>
            </div>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-purple-900/30 space-y-2.5 shrink-0 bg-white dark:bg-[#160d2b]">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-purple-950/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterTab('critical')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'critical'
                      ? 'bg-white dark:bg-[#251842] text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Todas las críticas ({totalCriticalCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('categories')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'categories'
                      ? 'bg-white dark:bg-[#251842] text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Categorías ({criticalCategories.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('subcategories')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'subcategories'
                      ? 'bg-white dark:bg-[#251842] text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Subcategorías ({criticalSubcategories.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-white dark:bg-[#251842] text-[#7928CA] dark:text-purple-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Todas con límite ({allBudgetItems.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar categoría o subcategoría..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-purple-950/40 border border-slate-200 dark:border-purple-800/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7928CA] dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Items */}
          <div className="p-3 sm:p-5 overflow-y-auto space-y-3.5 flex-1 divide-y divide-transparent">
            {displayedItems.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 dark:bg-purple-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-purple-800/40">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-3 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
                  {filterTab === 'critical' || filterTab === 'categories' || filterTab === 'subcategories'
                    ? `¡Todo en orden! Ninguna ${filterTab === 'subcategories' ? 'subcategoría' : 'categoría'} supera el ${alertThreshold}%`
                    : 'No se encontraron resultados con ese criterio'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  Los gastos actuales se encuentran bajo el umbral de alerta que definiste ({alertThreshold}%).
                  Podés consultar las categorías con presupuesto asignado cambiando a la pestaña "Todas con límite".
                </p>
                {filterTab !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-[#7928CA] dark:text-purple-200 text-xs font-bold hover:bg-purple-200 transition-colors cursor-pointer"
                  >
                    Ver todas las categorías con presupuesto
                  </button>
                )}
              </div>
            ) : (
              displayedItems.map((item) => {
                const isSub = item.type === 'subcategory';
                const isExceeded = item.pct >= 100;
                const isCritical = item.pct >= alertThreshold;
                const hasSubcategories = 'subcategories' in item && Boolean(item.subcategories && item.subcategories.length > 0);
                const isExpanded = Boolean(expandedCategories[item.id]);

                // Badge styling
                let badgeBg = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
                let badgeText = `Saludable (${item.pct}%)`;
                let barColor = 'from-emerald-400 to-emerald-500';

                if (isExceeded) {
                  badgeBg = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
                  badgeText = `Superado por ${ars(Math.abs(item.remaining))} (${item.pct}%)`;
                  barColor = 'from-rose-500 to-red-600';
                } else if (isCritical) {
                  badgeBg = 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
                  badgeText = `Crítico: Quedan ${ars(item.remaining)} (${item.pct}%)`;
                  barColor = 'from-amber-400 to-rose-500';
                }

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isExceeded
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-2xs'
                        : isCritical
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-2xs'
                        : 'bg-white dark:bg-[#1a1233] border-slate-200/80 dark:border-purple-800/40'
                    }`}
                  >
                    {/* Top Row: Icon, Title, Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: item.color ? `${item.color}20` : '#7928CA20',
                            color: item.color || '#7928CA',
                          }}
                        >
                          {item.emoji || getCategoryEmoji(item.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            {isSub && item.parentCategory && (
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                                de {item.parentCategory}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {isSub ? 'Subcategoría' : 'Categoría principal'} · Límite fijado: {ars(item.budget)}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border shrink-0 ${badgeBg}`}>
                        {badgeText}
                      </span>
                    </div>

                    {/* Progress Bar with Alert Threshold Marker */}
                    <div className="mt-3 relative">
                      <div className="h-2.5 sm:h-3 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden relative w-full">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>

                      {/* Threshold indicator line at the alertThreshold% position */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-800 dark:bg-white z-10 opacity-70 pointer-events-none"
                        style={{ left: `${Math.min(100, Math.max(0, alertThreshold))}%` }}
                        title={`Umbral de alerta definido: ${alertThreshold}%`}
                      >
                        <span className="absolute -top-4 -translate-x-1/2 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                          {alertThreshold}%
                        </span>
                      </div>
                    </div>

                    {/* Financial details row */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">Gastado: </span>
                        <span className="font-extrabold text-slate-800 dark:text-white tabular-nums">
                          {ars(item.spent)}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] ml-1">
                          ({item.pct}% de {ars(item.budget)})
                        </span>
                      </div>

                      <div className="text-right">
                        {isExceeded ? (
                          <span className="text-rose-600 dark:text-rose-400 font-extrabold text-[11px]">
                            Exceso: +{ars(Math.abs(item.remaining))}
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                            Disponible: {ars(item.remaining)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subcategories list if available */}
                    {hasSubcategories && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-purple-900/30">
                        <button
                          type="button"
                          onClick={() => toggleCategoryExpand(item.id)}
                          className="flex items-center justify-between w-full text-[11px] font-bold text-[#7928CA] dark:text-purple-300 hover:opacity-80 cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Ver desglose de subcategorías ({item.subcategories?.length})</span>
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && item.subcategories && (
                          <div className="mt-2 space-y-1.5 pl-2 sm:pl-3 border-l-2 border-purple-200 dark:border-purple-800 animate-in fade-in duration-150">
                            {item.subcategories.map(sub => {
                              const subIsCrit = (sub.pct || 0) >= alertThreshold;
                              const subIsExceed = (sub.pct || 0) >= 100;
                              return (
                                <div
                                  key={sub.name}
                                  className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-purple-950/40 text-[11px]"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-xs">{sub.emoji || getCategoryEmoji(sub.name)}</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                                      {sub.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="tabular-nums font-bold text-slate-800 dark:text-purple-100">
                                      {ars(sub.spent)}
                                    </span>
                                    {sub.budget ? (
                                      <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                        subIsExceed
                                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                          : subIsCrit
                                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                          : 'text-slate-500'
                                      }`}>
                                        {sub.pct}%
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick action buttons */}
                    <div className="mt-3 flex items-center justify-end gap-2 text-xs">
                      {onSelectCategory && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectCategory(isSub && item.parentCategory ? item.parentCategory : item.name);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-[#7928CA] dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/60 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          <span>Ver movimientos</span>
                        </button>
                      )}

                      {onOpenBudgetModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenBudgetModal();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-purple-900/40 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-purple-900/70 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Ajustar límite</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-[#120724] border-t border-slate-100 dark:border-purple-900/40 flex items-center justify-between gap-3 shrink-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Presupuestos calculados según los parámetros definidos en tus configuraciones.
            </p>

            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab('budgets');
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-purple-950 border border-slate-200 dark:border-purple-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Ir a Presupuestos
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-[#7928CA] to-[#9333EA] text-white text-xs font-extrabold shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BudgetAlertsModal;
