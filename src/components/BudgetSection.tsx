import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, BarChart3, BellRing, Calendar, Check, CheckCircle2, ChevronDown, ChevronRight,
  Edit3, Lightbulb, Plus, Settings2, ShieldCheck, Target, TrendingDown, TrendingUp,
  WalletCards, X, Sparkles, HelpCircle, Flame, Crown, RotateCcw, CheckSquare, Square,
  Info, ArrowUpRight, Zap, Search, Filter, LayoutGrid, List, ArrowUpDown, SlidersHorizontal
} from 'lucide-react';
import { Budgets, CategoryColors, CategoryMap, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { BudgetComparisonView } from './BudgetComparisonView';
import { InflationModeSection } from './InflationModeSection';
import { BudgetInsightsSection } from './budget/BudgetInsightsSection';
import {
  InflationModeEngine,
  InflationSettings,
  IPC_CATEGORY_RATES,
  IPC_GENERAL_RATE,
  InflationReport,
  BudgetProjection
} from '../InflationModeEngine';

interface BudgetSectionProps {
  budgets: Budgets;
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  transactions: Transaction[];
  currency: string;
  isPro?: boolean;
  onOpenBudgetModal: () => void;
  onCreateBudget?: () => void;
  onUpdateBudgets?: (newBudgets: Budgets) => void;
  onSelectCategory?: (category: string) => void;
  onUpgradeToPro?: () => void;
}

const DEFAULT_BUDGETS: Budgets = { categories: {}, subcategories: {} };
type BudgetView = 'budget' | 'insights' | 'alerts' | 'projection' | 'comparison';
type DisplayMode = 'list' | 'grid';
type SortOption = 'risk' | 'spent' | 'percentage' | 'limit' | 'name';

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  budgets = DEFAULT_BUDGETS,
  categoryMap = {},
  categoryColors = {},
  transactions = [],
  currency = 'ARS',
  isPro = false,
  onOpenBudgetModal,
  onCreateBudget,
  onUpdateBudgets,
  onSelectCategory,
  onUpgradeToPro,
}) => {
  const [view, setView] = useState<BudgetView>('budget');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('risk');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [quickValue, setQuickValue] = useState('');
  const [projectionPercent, setProjectionPercent] = useState(budgets?.projectionGrowthPercent || 15);
  const [projectionSource, setProjectionSource] = useState<'current_budget' | 'real_expenses'>('current_budget');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'with_limit' | 'risk' | 'no_limit'>('all');

  // ─── Estado Modo Inflación IPC (Plan Pro) ──────────────────────────────────
  const [projectionSubTab, setProjectionSubTab] = useState<'ipc_pro' | 'standard'>('ipc_pro');
  const [ipcSettings, setIpcSettings] = useState<InflationSettings>(() => InflationModeEngine.defaultSettings());
  const [ipcMonthsAhead, setIpcMonthsAhead] = useState<number>(1);
  const [selectedIpcCategories, setSelectedIpcCategories] = useState<string[]>([]);
  const [previousBudgetsBackup, setPreviousBudgetsBackup] = useState<Budgets | null>(null);
  const [ipcNotice, setIpcNotice] = useState<string | null>(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const optionsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (optionsDropdownRef.current && !optionsDropdownRef.current.contains(event.target as Node)) {
        setShowOptionsDropdown(false);
      }
    };
    if (showOptionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showOptionsDropdown]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - day);
  const monthLabel = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
  const monthIso = `${year}-${String(month + 1).padStart(2, '0')}`;

  const expenses = useMemo(() => transactions.filter(tx => tx && tx.tipoTransaccion !== 'ingreso' && tx.fecha?.startsWith(monthIso)), [transactions, monthIso]);
  const effectiveExpenses = expenses.length ? expenses : transactions.filter(tx => tx && tx.tipoTransaccion !== 'ingreso');

  const spending = useMemo(() => {
    const map: Record<string, number> = {};
    effectiveExpenses.forEach(tx => { map[tx.categoria] = (map[tx.categoria] || 0) + Number(tx.monto || 0); });
    return map;
  }, [effectiveExpenses]);

  const categories = useMemo(() => Array.from(new Set([...Object.keys(categoryMap), ...Object.keys(budgets.categories || {}), ...Object.keys(spending)])), [categoryMap, budgets.categories, spending]);
  const threshold = budgets.alertThresholdPercent || 80;

  const rows = useMemo(() => categories.map(category => {
    const limit = Number(budgets.categories?.[category] || 0);
    const spent = Number(spending[category] || 0);
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const status = limit <= 0 ? 'none' : pct >= 100 ? 'exceeded' : pct >= threshold ? 'warning' : 'ok';
    return {
      category,
      limit,
      spent,
      pct,
      status,
      remaining: limit - spent,
      color: categoryColors[category] || '#7928CA',
      subsCount: (categoryMap[category] || []).length
    };
  }), [categories, budgets.categories, spending, threshold, categoryColors, categoryMap]);

  const summary = useMemo(() => {
    const totalBudget = rows.reduce((s, r) => s + r.limit, 0);
    const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
    const assigned = rows.filter(r => r.limit > 0).length;
    const risk = rows.filter(r => r.status === 'warning' || r.status === 'exceeded').length;
    const safe = rows.filter(r => r.status === 'ok').length;
    const remaining = totalBudget - totalSpent;
    return {
      totalBudget,
      totalSpent,
      assigned,
      risk,
      safe,
      remaining,
      pct: totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0
    };
  }, [rows]);

  const sortedAndFilteredRows = useMemo(() => {
    const list = rows.filter(r => {
      if (search.trim()) {
        const query = search.toLowerCase();
        if (!r.category.toLowerCase().includes(query)) return false;
      }
      if (categoryFilter === 'with_limit') return r.limit > 0;
      if (categoryFilter === 'risk') return r.status === 'warning' || r.status === 'exceeded';
      if (categoryFilter === 'no_limit') return r.limit <= 0;
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'risk') {
        const score = (r: typeof a) => (r.status === 'exceeded' ? 3 : r.status === 'warning' ? 2 : r.limit > 0 ? 1 : 0);
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
        return b.pct - a.pct;
      }
      if (sortBy === 'spent') return b.spent - a.spent;
      if (sortBy === 'percentage') return b.pct - a.pct;
      if (sortBy === 'limit') return b.limit - a.limit;
      return a.category.localeCompare(b.category);
    });
  }, [rows, search, categoryFilter, sortBy]);

  const realByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(tx => tx && tx.tipoTransaccion !== 'ingreso').forEach(tx => { map[tx.categoria] = (map[tx.categoria] || 0) + Number(tx.monto || 0); });
    return map;
  }, [transactions]);

  const projection = useMemo(() => {
    const factor = 1 + projectionPercent / 100;
    return rows.filter(r => (projectionSource === 'current_budget' ? r.limit > 0 : (realByCategory[r.category] || r.limit) > 0)).map(r => {
      const base = projectionSource === 'current_budget' ? r.limit : (realByCategory[r.category] || r.limit);
      return { ...r, base, projected: Math.round(base * factor / 1000) * 1000 };
    });
  }, [rows, projectionPercent, projectionSource, realByCategory]);
  const projectedTotal = projection.reduce((s, r) => s + r.projected, 0);

  const saveQuick = () => {
    if (!editingCategory || !onUpdateBudgets) return;
    onUpdateBudgets({ ...budgets, categories: { ...(budgets.categories || {}), [editingCategory]: Math.max(0, Number(quickValue) || 0) } });
    setEditingCategory(null);
  };

  const applyProjection = () => {
    if (!onUpdateBudgets) return;
    const cats: Record<string, number> = { ...(budgets.categories || {}) };
    projection.forEach(r => { cats[r.category] = r.projected; });
    onUpdateBudgets({ ...budgets, categories: cats, projectionGrowthPercent: projectionPercent, lastProjectedDate: new Date().toISOString() });
  };

  const openQuick = (category: string, value: number) => { setEditingCategory(category); setQuickValue(value ? String(value) : ''); };

  // ─── Proyecciones IPC Pro con InflationModeEngine ─────────────────────────
  const ipcReport: InflationReport = useMemo(() => {
    return InflationModeEngine.calculateProjections(budgets, ipcSettings, ipcMonthsAhead);
  }, [budgets, ipcSettings, ipcMonthsAhead]);

  useEffect(() => {
    if (ipcReport.projections.length > 0 && selectedIpcCategories.length === 0) {
      setSelectedIpcCategories(ipcReport.projections.map(p => p.category));
    }
  }, [ipcReport.projections]);

  const handleApplyIpcAdjustment = () => {
    if (!onUpdateBudgets) return;
    setPreviousBudgetsBackup(JSON.parse(JSON.stringify(budgets)));
    const updated = InflationModeEngine.applyAdjustment(
      budgets,
      ipcReport,
      selectedIpcCategories.length > 0 ? selectedIpcCategories : undefined
    );
    onUpdateBudgets(updated);
    const affectedCount = selectedIpcCategories.length || ipcReport.projections.length;
    setIpcNotice(`¡Ajuste por inflación IPC aplicado con éxito a ${affectedCount} categoría${affectedCount === 1 ? '' : 's'}!`);
    setTimeout(() => setIpcNotice(null), 6000);
  };

  const handleUndoIpcAdjustment = () => {
    if (previousBudgetsBackup && onUpdateBudgets) {
      onUpdateBudgets(previousBudgetsBackup);
      setPreviousBudgetsBackup(null);
      setIpcNotice('Se restablecieron los presupuestos anteriores.');
      setTimeout(() => setIpcNotice(null), 4000);
    }
  };

  const tabs: Array<[BudgetView, string, React.ElementType]> = [
    ['budget', 'Presupuesto', WalletCards],
    ['insights', 'Insights', Sparkles],
    ['alerts', 'Alertas y Límites', BellRing],
    ['projection', 'Proyección & IPC', TrendingUp],
    ['comparison', 'Comparativa', BarChart3],
  ];

  return (
    <div className="budget-responsive space-y-5 pb-24 sm:pb-6">
      <section className="rounded-[28px] border border-purple-200/80 bg-white shadow-[0_8px_30px_-12px_rgba(109,63,234,0.25)] overflow-hidden dark:bg-[#140728] dark:border-purple-900/40">
        
        {/* ─── CAJA DE TÍTULO PRINCIPAL (Limpia y sin saturación) ──────────── */}
        <div
          style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D3FEA 55%, #7C3AED 100%)' }}
          className="p-4 sm:p-6 text-white"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-black uppercase tracking-wider">
                Planificación financiera
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-[10px] font-bold">
                {monthLabel}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">Presupuesto</h2>
            <p className="text-xs sm:text-sm text-purple-100/80 mt-0.5 max-w-2xl">
              Definí tus límites mensuales, seguí el consumo diario y mantené tus finanzas bajo control.
            </p>
          </div>
        </div>

        {/* ─── BARRA DE PESTAÑAS Y MENÚ DESPLEGABLE (Debajo del título, fuera de la caja) ─ */}
        <div className="px-3 sm:px-5 border-b border-slate-100 dark:border-purple-900/40 flex items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-[#16072b]/50">
          <div className="flex min-w-0 overflow-x-auto gap-1 pt-2 sm:pt-2.5 pb-1 no-scrollbar">
            {tabs.map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`px-3 sm:px-3.5 py-2 rounded-t-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  view === id
                    ? 'bg-white dark:bg-[#140728] text-[#7928CA] dark:text-purple-300 shadow-xs border-t-2 border-[#7928CA]'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-[#190731]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Botones de acción DEBAJO del título y FUERA de la caja del título */}
          <div className="flex items-center gap-2 shrink-0 py-1.5">
            {/* Botón Crear presupuesto VISIBLE y DIRECTO */}
            <button
              type="button"
              onClick={() => {
                if (typeof onCreateBudget === 'function') {
                  onCreateBudget();
                } else if (typeof onOpenBudgetModal === 'function') {
                  onOpenBudgetModal();
                }
              }}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-[#7928CA] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 cursor-pointer shrink-0"
              title="Crear o armar un nuevo presupuesto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Crear presupuesto</span>
            </button>

            {/* Menú desplegable Opciones */}
            <div className="relative shrink-0" ref={optionsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowOptionsDropdown(prev => !prev)}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-purple-100/70 hover:bg-purple-200/80 dark:bg-purple-950/80 dark:hover:bg-purple-900/80 border border-purple-200 dark:border-purple-800 text-[#7928CA] dark:text-purple-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                aria-expanded={showOptionsDropdown}
                aria-haspopup="true"
                title="Más opciones de presupuesto"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Opciones</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showOptionsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showOptionsDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1A0B2E] rounded-2xl shadow-2xl border border-purple-100 dark:border-purple-800/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-purple-50 dark:border-purple-900/40 text-[10px] font-black uppercase tracking-wider text-purple-900/60 dark:text-purple-300/60 flex items-center justify-between">
                    <span>Acciones de Presupuesto</span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{monthLabel}</span>
                  </div>

                  {/* Opción 1: Crear presupuesto */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptionsDropdown(false);
                      if (typeof onCreateBudget === 'function') {
                        onCreateBudget();
                      } else if (typeof onOpenBudgetModal === 'function') {
                        onOpenBudgetModal();
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#7928CA] hover:bg-purple-50/80 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7928CA] dark:bg-purple-900/50 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="leading-tight font-black text-slate-800 dark:text-white group-hover:text-[#7928CA] dark:group-hover:text-purple-300">Crear presupuesto</div>
                      <div className="text-[10px] font-normal text-slate-400 dark:text-slate-400 mt-0.5">Asignar montos para nuevas categorías</div>
                    </div>
                  </button>

                  {/* Opción 2: Configuración */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptionsDropdown(false);
                      if (typeof onOpenBudgetModal === 'function') {
                        onOpenBudgetModal();
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#7928CA] hover:bg-purple-50/80 dark:hover:bg-purple-900/30 flex items-center gap-3 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <Settings2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="leading-tight font-black text-slate-800 dark:text-white group-hover:text-[#7928CA] dark:group-hover:text-purple-300">Configuración</div>
                      <div className="text-[10px] font-normal text-slate-400 dark:text-slate-400 mt-0.5">Ajustar límites, alertas y parámetros</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── VISTA 1: PRESUPUESTO PRINCIPAL ─────────────────────────────── */}
        {view === 'budget' && (
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* 1. HERO BALANCE Y RESUMEN EJECUTIVO LIGERO */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-purple-900/50 bg-gradient-to-b from-white to-purple-50/20 dark:from-[#17082e] dark:to-[#120524] p-5 sm:p-6 shadow-xs space-y-5">
              
              {/* Saldo disponible y estado claro */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-purple-300/70">
                    Disponible para gastar
                  </p>
                  <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                    <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
                      summary.remaining < 0 
                        ? 'text-rose-600 dark:text-rose-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {formatCurrency(Math.max(0, summary.remaining), currency)}
                    </span>
                    {summary.remaining < 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        Excedido por {formatCurrency(Math.abs(summary.remaining), currency)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Gastado {formatCurrency(summary.totalSpent, currency)} de {formatCurrency(summary.totalBudget, currency)} presupuestado
                  </p>
                </div>

                {/* Badge de estado del mes */}
                <div className="self-start sm:self-auto shrink-0">
                  <div className={`px-3.5 py-2 rounded-2xl text-xs font-black inline-flex items-center gap-2 border shadow-2xs ${
                    summary.pct >= 100
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                      : summary.pct >= threshold
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                        : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                  }`}>
                    {summary.pct >= 100 ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Presupuesto superado ({summary.pct}%)</span>
                      </>
                    ) : summary.pct >= threshold ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Zona preventiva ({summary.pct}% consumido)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Bajo control ({summary.pct}% consumido)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de progreso fina (acorde al grosor de líneas del panel principal) */}
              <div className="space-y-1.5">
                <div className="h-[3px] rounded-full bg-slate-100 dark:bg-purple-950/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.pct >= 100
                        ? 'bg-rose-500'
                        : summary.pct >= threshold
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-[#7928CA] to-[#A855F7]'
                    }`}
                    style={{ width: `${Math.min(100, summary.pct)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{summary.pct}% consumido</span>
                  <span>{100 - Math.min(100, summary.pct)}% disponible</span>
                </div>
              </div>

              {/* 3 Tarjetas métricas limpias y directas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-purple-900/40">
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#1a0833] border border-slate-100 dark:border-purple-900/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Límite Total Mensual</span>
                  <p className="text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {formatCurrency(summary.totalBudget, currency)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {summary.assigned} categorías con presupuesto
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#1a0833] border border-slate-100 dark:border-purple-900/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ritmo Diario Sugerido</span>
                  <p className="text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {formatCurrency(Math.max(0, Math.round(summary.remaining / daysRemaining)), currency)}
                    <span className="text-[11px] font-normal text-slate-400 ml-1">/ día</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Para los próximos {daysRemaining} días
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#1a0833] border border-slate-100 dark:border-purple-900/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salud de Rubros</span>
                  <p className={`text-base font-black mt-0.5 ${
                    summary.risk > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {summary.risk > 0 ? `${summary.risk} en riesgo` : 'Todo dentro del límite'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Alerta preventiva al {threshold}%
                  </p>
                </div>
              </div>
            </div>

            {/* 2. BARRA DE CONTROL POR CATEGORÍAS (Buscador, Filtros, Orden y Toggle Lista/Tarjetas) */}
            <div className="space-y-3.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <h3 className="font-black text-base text-[#2E0854] dark:text-white flex items-center gap-2">
                      <span>Control por categorías</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/60 text-[#7928CA] dark:text-purple-300">
                        {sortedAndFilteredRows.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ajustá los límites de cada rubro o tocá para ver sus movimientos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof onCreateBudget === 'function') {
                        onCreateBudget();
                      } else if (typeof onOpenBudgetModal === 'function') {
                        onOpenBudgetModal();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#7928CA] dark:text-purple-300 font-bold text-xs border border-purple-200/80 dark:border-purple-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Nuevo presupuesto</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Buscador de categorías */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar categoría..."
                      className="w-full rounded-xl border border-slate-200 dark:border-purple-900 bg-white dark:bg-[#190731] pl-8 pr-7 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-800 dark:text-slate-100"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Selector de orden */}
                  <div className="relative shrink-0">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortOption)}
                      className="rounded-xl border border-slate-200 dark:border-purple-900 bg-white dark:bg-[#190731] px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="risk">Ordenar: En riesgo primero</option>
                      <option value="spent">Ordenar: Mayor gasto</option>
                      <option value="percentage">Ordenar: % Consumido</option>
                      <option value="limit">Ordenar: Mayor límite</option>
                      <option value="name">Ordenar: Nombre A-Z</option>
                    </select>
                  </div>

                  {/* Toggle Vista Lista / Tarjetas (Reduce drásticamente la fatiga visual) */}
                  <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#190731] border border-slate-200/80 dark:border-purple-900/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('list')}
                      title="Vista compacta de lista (menos carga visual)"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        displayMode === 'list'
                          ? 'bg-white dark:bg-[#20083c] text-[#7928CA] dark:text-purple-300 shadow-xs'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('grid')}
                      title="Vista de tarjetas"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        displayMode === 'grid'
                          ? 'bg-white dark:bg-[#20083c] text-[#7928CA] dark:text-purple-300 shadow-xs'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filtros rápidos (Chips limpios) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-[#7928CA] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-purple-950/40 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Todas ({rows.length})
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryFilter('risk')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'risk'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : rows.filter(r => r.status === 'warning' || r.status === 'exceeded').length > 0
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40'
                        : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-purple-950/40 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>En riesgo ({rows.filter(r => r.status === 'warning' || r.status === 'exceeded').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryFilter('with_limit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'with_limit'
                      ? 'bg-[#7928CA] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-purple-950/40 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>Con presupuesto ({rows.filter(r => r.limit > 0).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryFilter('no_limit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    categoryFilter === 'no_limit'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-purple-950/40 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Sin asignar ({rows.filter(r => r.limit <= 0).length})
                </button>
              </div>

              {/* ─── VISTA 1: LISTA COMPACTA (Ultra limpia, reduce el scroll y la carga visual) ─ */}
              {displayMode === 'list' && sortedAndFilteredRows.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-purple-900/40 bg-white dark:bg-[#16072b] overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-purple-900/30">
                  {sortedAndFilteredRows.map(r => {
                    const statusPill = r.status === 'exceeded'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : r.status === 'warning'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : r.status === 'none'
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';

                    return (
                      <div
                        key={r.category}
                        className="p-3 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-purple-950/20 transition-colors"
                      >
                        {/* Nombre y color */}
                        <div className="flex items-center gap-3 min-w-0 sm:w-1/3">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: r.color }}
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                              {r.category}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              {r.subsCount > 0 ? `${r.subsCount} subcategorías` : 'General'}
                            </p>
                          </div>
                        </div>

                        {/* Barra de progreso y % de consumo */}
                        <div className="flex-1 sm:px-4">
                          {r.limit > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-slate-600 dark:text-slate-300">
                                  {formatCurrency(r.spent, currency)} <span className="text-slate-400 font-normal">/ {formatCurrency(r.limit, currency)}</span>
                                </span>
                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${statusPill}`}>
                                  {r.pct}%
                                </span>
                              </div>
                              <div className="h-[3px] rounded-full bg-slate-100 dark:bg-purple-950/60 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    r.status === 'exceeded'
                                      ? 'bg-rose-500'
                                      : r.status === 'warning'
                                        ? 'bg-amber-500'
                                        : 'bg-[#7928CA]'
                                  }`}
                                  style={{ width: `${Math.min(100, r.pct)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Gastado: {formatCurrency(r.spent, currency)} (Sin límite)
                            </span>
                          )}
                        </div>

                        {/* Disponible y Acciones rápidas */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-1/3">
                          <div className="text-left sm:text-right">
                            {r.limit > 0 ? (
                              <span className={`text-xs font-bold ${
                                r.remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {r.remaining >= 0 ? `Quedan ${formatCurrency(r.remaining, currency)}` : `Exceso: ${formatCurrency(Math.abs(r.remaining), currency)}`}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Sin límite</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectCategory?.(r.category)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-[#7928CA] dark:text-slate-400 dark:hover:text-purple-300 hover:bg-slate-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                              title="Ver transacciones de esta categoría"
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              onClick={() => openQuick(r.category, r.limit)}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7928CA] dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Modificar límite"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{r.limit > 0 ? 'Ajustar' : 'Fijar'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── VISTA 2: GRID DE TARJETAS (Mejorada y sin saturación) ──────── */}
              {displayMode === 'grid' && sortedAndFilteredRows.length > 0 && (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {sortedAndFilteredRows.map(r => (
                    <CategoryCard
                      key={r.category}
                      row={r}
                      currency={currency}
                      threshold={threshold}
                      onEdit={() => openQuick(r.category, r.limit)}
                      onView={() => onSelectCategory?.(r.category)}
                    />
                  ))}
                </div>
              )}

              {/* Estado vacío cuando no hay resultados de búsqueda o filtros */}
              {sortedAndFilteredRows.length === 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-purple-900/40 bg-white dark:bg-[#16072b] p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#7928CA] dark:text-purple-300 flex items-center justify-center mx-auto">
                    {categoryFilter === 'risk' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Filter className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      {categoryFilter === 'risk'
                        ? '¡Excelente! Ninguna categoría en riesgo'
                        : search
                          ? `No encontramos resultados para "${search}"`
                          : 'No hay categorías con este filtro'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      {categoryFilter === 'risk'
                        ? 'Tus gastos se encuentran por debajo del umbral de alerta configurado.'
                        : 'Probá seleccionando "Todas" o limpiando el texto de búsqueda.'}
                    </p>
                  </div>
                  {(search || categoryFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setCategoryFilter('all');
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7928CA] dark:text-purple-300 text-xs font-bold hover:bg-purple-100 cursor-pointer"
                    >
                      Restablecer filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── VISTA 2: INSIGHTS INTELIGENTES ─────────────────────────────── */}
        {view === 'insights' && (
          <div className="p-4 sm:p-6">
            <BudgetInsightsSection
              budgets={budgets}
              categoryMap={categoryMap}
              categoryColors={categoryColors}
              transactions={transactions}
              currency={currency}
              onEditCategory={(category, currentLimit) => openQuick(category, currentLimit)}
              onSelectCategory={onSelectCategory}
              onOpenBudgetModal={onOpenBudgetModal}
            />
          </div>
        )}

        {/* ─── VISTA 3: ALERTAS Y LÍMITES ─────────────────────────────────── */}
        {view === 'alerts' && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-purple-50/50 dark:from-amber-950/20 dark:to-purple-950/20 dark:border-amber-900/50 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-[#2E0854] dark:text-white">Alertas y umbrales de presupuesto</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Configurá el porcentaje a partir del cual GastoAR te avisa que una categoría está entrando en zona preventiva.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs font-bold">Alerta activa al</span>
                <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-2xs">{threshold}%</span>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-3">
                {[70, 75, 80, 85, 90].map(p => (
                  <button
                    key={p}
                    onClick={() => onUpdateBudgets?.({ ...budgets, alertThresholdPercent: p })}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      threshold === p
                        ? 'bg-[#7928CA] border-[#7928CA] text-white shadow-2xs'
                        : 'bg-white dark:bg-[#190731] border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={threshold}
                onChange={e => onUpdateBudgets?.({ ...budgets, alertThresholdPercent: Number(e.target.value) })}
                className="w-full mt-5 accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>Temprana (50%)</span>
                <span>Moderada (80%)</span>
                <span>Tardía (95%)</span>
              </div>

              <div className="mt-4 text-[10px] sm:text-[11px] leading-tight sm:leading-normal text-slate-600 bg-white/85 py-2 px-3 rounded-xl border border-slate-200/70 flex items-start gap-2 shadow-2xs">
                <HelpCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span className="leading-snug sm:leading-normal">
                  <strong className="text-slate-800 font-bold">Semáforo de control:</strong> 🟢 <strong>Verde</strong> si llevás gastado menos del {threshold}%, 🟡 <strong>Amarillo</strong> entre el {threshold}% y 99%, y 🔴 <strong>Rojo</strong> si superás el 100%.
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <StatusBox title="Bajo control" count={summary.safe} tone="green" icon={CheckCircle2} />
              <StatusBox title="En riesgo" count={summary.risk} tone="orange" icon={AlertTriangle} />
              <StatusBox title="Sin límite" count={rows.filter(r => r.limit <= 0).length} tone="slate" icon={ShieldCheck} />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-purple-900/50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-[#190731] text-xs font-black">Categorías que requieren atención</div>
              {rows.filter(r => r.status === 'warning' || r.status === 'exceeded').length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No hay categorías en riesgo. ¡Excelente trabajo!</div>
              ) : (
                rows.filter(r => r.status === 'warning' || r.status === 'exceeded').map(r => (
                  <div key={r.category} className="px-4 py-3 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black">{r.category}</p>
                      <p className="text-[10px] text-slate-500">{formatCurrency(r.spent, currency)} de {formatCurrency(r.limit, currency)}</p>
                    </div>
                    <span className={`text-xs font-black ${r.status === 'exceeded' ? 'text-rose-600' : 'text-amber-600'}`}>{r.pct}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── VISTA 4: PROYECCIÓN & IPC ──────────────────────────────────── */}
        {view === 'projection' && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-purple-900/40">
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-[#16072b] rounded-2xl">
                <button
                  type="button"
                  onClick={() => setProjectionSubTab('ipc_pro')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                    projectionSubTab === 'ipc_pro'
                      ? 'bg-gradient-to-r from-[#2E0854] to-[#7928CA] text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>Modo Inflación IPC</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-purple-950 uppercase tracking-wider">
                    PRO
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setProjectionSubTab('standard')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    projectionSubTab === 'standard'
                      ? 'bg-white dark:bg-[#20083c] text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Simulador Estándar</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isPro ? (
                  <span className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-[11px] font-black flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Plan Pro Activo · Motor IPC Habilitado</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onUpgradeToPro}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Desbloquear Plan Pro</span>
                  </button>
                )}
              </div>
            </div>

            {ipcNotice && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{ipcNotice}</span>
                </div>
                {previousBudgetsBackup && (
                  <button
                    type="button"
                    onClick={handleUndoIpcAdjustment}
                    className="px-3 py-1 bg-white dark:bg-[#1a0833] border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-black hover:bg-emerald-100 dark:hover:bg-purple-900/40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Deshacer</span>
                  </button>
                )}
              </div>
            )}

            {projectionSubTab === 'ipc_pro' && (
              <InflationModeSection
                budgets={budgets}
                onApplyAdjustment={(newBudgets, selectedCategories) => {
                  setPreviousBudgetsBackup(budgets);
                  onUpdateBudgets?.(newBudgets);
                  setIpcNotice(`Ajuste de inflación aplicado con éxito a ${selectedCategories.length} categorías.`);
                }}
                onUpdateSettings={(newSettings) => {
                  setIpcSettings(newSettings);
                }}
                inflationSettings={ipcSettings}
                isPro={isPro}
                onUpgradePro={onUpgradeToPro}
              />
            )}

            {projectionSubTab === 'standard' && (
              <div className="space-y-5">
                <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 dark:border-purple-900/50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#7928CA] text-white flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#2E0854] dark:text-white">
                        Simulador Estándar de Ajuste Porcentual
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Aplica un porcentaje plano a todas las categorías tomando como base tus límites actuales o tus gastos reales.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProjectionSource('current_budget')}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        projectionSource === 'current_budget'
                          ? 'bg-white dark:bg-[#190731] border-purple-500 ring-2 ring-purple-500/10'
                          : 'bg-white/50 dark:bg-[#16072b] border-slate-200 dark:border-purple-900/50'
                      }`}
                    >
                      <p className="text-xs font-black">Opción A · Límites actuales</p>
                      <p className="text-[10px] text-slate-500 mt-1">Aplica el porcentaje sobre los presupuestos definidos hoy.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectionSource('real_expenses')}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        projectionSource === 'real_expenses'
                          ? 'bg-white dark:bg-[#190731] border-purple-500 ring-2 ring-purple-500/10'
                          : 'bg-white/50 dark:bg-[#16072b] border-slate-200 dark:border-purple-900/50'
                      }`}
                    >
                      <p className="text-xs font-black">Opción B · Gastos reales</p>
                      <p className="text-[10px] text-slate-500 mt-1">Usa tu consumo registrado histórico como punto de partida.</p>
                    </button>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">Inflación / ajuste esperado</span>
                      <span className="text-lg font-black text-[#7928CA]">+{projectionPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={projectionPercent}
                      onChange={e => setProjectionPercent(Number(e.target.value))}
                      className="w-full mt-3 accent-purple-600 cursor-pointer"
                    />
                    <div className="flex gap-2 flex-wrap mt-3">
                      {[5, 10, 15, 20, 25, 30].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProjectionPercent(p)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                            projectionPercent === p
                              ? 'bg-[#2E0854] text-white border-[#2E0854]'
                              : 'bg-white dark:bg-[#190731] border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          +{p}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Metric label="Base actual" value={formatCurrency(projection.reduce((s, r) => s + r.base, 0), currency)} icon={Target} tone="purple" helper="Base seleccionada" />
                  <Metric label="Proyectado" value={formatCurrency(projectedTotal, currency)} icon={TrendingUp} tone="green" helper={`+${projectionPercent}%`} />
                  <Metric label="Diferencia" value={formatCurrency(projectedTotal - projection.reduce((s, r) => s + r.base, 0), currency)} icon={TrendingUp} tone="orange" helper="Ajuste estimado" />
                  <Metric label="Categorías" value={String(projection.length)} icon={WalletCards} tone="blue" helper="Con base disponible" />
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-purple-900/50 overflow-hidden">
                  <div className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] gap-2 px-4 py-3 bg-slate-50 dark:bg-[#190731] text-[10px] uppercase font-black text-slate-400">
                    <span>Categoría</span>
                    <span>Base</span>
                    <span>Proyección</span>
                    <span>Δ</span>
                  </div>
                  {projection.map(r => (
                    <div key={r.category} className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] gap-2 px-4 py-3 border-t border-slate-100 dark:border-purple-900/30 text-xs">
                      <span className="font-bold truncate">{r.category}</span>
                      <span>{formatCurrency(r.base, currency)}</span>
                      <strong className="text-[#7928CA]">{formatCurrency(r.projected, currency)}</strong>
                      <span className="text-emerald-600 font-bold">+{Math.round(r.projected - r.base).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4">
                  <div>
                    <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">La proyección no cambia nada hasta que la confirmes.</p>
                    <p className="text-[10px] text-emerald-800/70 dark:text-emerald-300/70 mt-1">Podés revisar los valores y aplicar el ajuste cuando estés conforme.</p>
                  </div>
                  <button
                    type="button"
                    onClick={applyProjection}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2E0854] to-[#7928CA] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aplicar proyección</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── VISTA 5: COMPARATIVA ───────────────────────────────────────── */}
        {view === 'comparison' && (
          <div className="p-3 sm:p-5">
            <BudgetComparisonView
              budgets={budgets}
              categoryMap={categoryMap}
              categoryColors={categoryColors}
              transactions={transactions}
              currency={currency}
            />
          </div>
        )}
      </section>

      {/* ─── MODAL DE EDICIÓN RÁPIDA DE LÍMITES ──────────────────────────── */}
      {editingCategory && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#140728] p-6 shadow-2xl border border-purple-100 dark:border-purple-900/50 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-black text-purple-500">Edición rápida de límite</p>
                <h3 className="text-lg font-black text-[#2E0854] dark:text-white mt-0.5">{editingCategory}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#190731] border border-slate-100 dark:border-purple-900/40 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Gasto registrado este mes:</span>
              <strong className="text-slate-800 dark:text-white">{formatCurrency(spending[editingCategory] || 0, currency)}</strong>
            </div>

            <label className="block mt-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              Límite mensual a asignar
            </label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
              <input
                autoFocus
                type="number"
                min="0"
                step="1000"
                value={quickValue}
                onChange={e => setQuickValue(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-3 py-3 rounded-xl border border-slate-200 dark:border-purple-900 bg-slate-50 dark:bg-[#190731] font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Accesos rápidos sugeridos */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {[10, 20].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuickValue(String(Math.round(((spending[editingCategory] || 0) * (1 + p / 100)) / 1000) * 1000))}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-[#7928CA] dark:text-purple-300 text-[11px] font-bold hover:bg-purple-100 cursor-pointer"
                >
                  +{p}% gasto real
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuickValue(String(spending[editingCategory] || 0))}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#190731] text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
              >
                Igualar gasto real
              </button>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-purple-900/40">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveQuick}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7928CA] to-[#A855F7] text-white text-xs font-black shadow-md cursor-pointer active:scale-95"
              >
                Guardar límite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; helper: string; icon: React.ElementType; tone: 'purple' | 'orange' | 'green' | 'blue' }> = ({ label, value, helper, icon: Icon, tone }) => {
  const tones = {
    purple: 'bg-purple-50 text-[#7928CA] dark:bg-purple-950/30',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20',
    blue: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20'
  };
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-purple-900/40 p-4 bg-white dark:bg-[#16072b]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">{label}</span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${tones[tone]}`}><Icon className="w-4 h-4" /></span>
      </div>
      <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-3 truncate">{value}</p>
      <p className="text-[10px] text-slate-500 mt-1">{helper}</p>
    </div>
  );
};

const StatusBox: React.FC<{ title: string; count: number; tone: 'green' | 'orange' | 'slate'; icon: React.ElementType }> = ({ title, count, tone, icon: Icon }) => {
  const cls = tone === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : tone === 'orange' ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-700';
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="flex items-center justify-between"><Icon className="w-5 h-5" /><span className="text-2xl font-black">{count}</span></div>
      <p className="text-xs font-black mt-3">{title}</p>
    </div>
  );
};

const CategoryCard: React.FC<{ row: any; currency: string; threshold: number; onEdit: () => void; onView: () => void }> = ({ row, currency, threshold, onEdit, onView }) => {
  const statusClass = row.status === 'exceeded'
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
    : row.status === 'warning'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
      : row.status === 'none'
        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60';

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-purple-900/40 p-4 bg-white dark:bg-[#16072b] hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: row.status === 'exceeded' ? '#f43f5e' : row.status === 'warning' ? '#f59e0b' : row.color }} />
      
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: row.color }} />
              <h4 className="text-sm font-black truncate text-slate-800 dark:text-slate-100">{row.category}</h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {row.limit > 0 ? (
                <>
                  Gastado <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(row.spent, currency)}</strong> de {formatCurrency(row.limit, currency)}
                </>
              ) : (
                'Sin límite asignado'
              )}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${statusClass}`}>
            {row.limit <= 0 ? 'Sin límite' : `${row.pct}%`}
          </span>
        </div>

        {row.limit > 0 && (
          <div className="mt-3">
            <div className="h-[3px] rounded-full bg-slate-100 dark:bg-purple-950/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  row.status === 'exceeded'
                    ? 'bg-rose-500'
                    : row.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-[#7928CA]'
                }`}
                style={{ width: `${Math.min(100, row.pct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1.5 font-bold">
              <span className={row.remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {row.remaining >= 0 ? `Quedan ${formatCurrency(row.remaining, currency)}` : `Exceso: ${formatCurrency(Math.abs(row.remaining), currency)}`}
              </span>
              <span className="text-slate-400">
                {row.spent > 0 ? `${formatCurrency(row.spent, currency)} gastado` : 'Sin consumo'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-purple-900/30">
        <button
          type="button"
          onClick={onView}
          className="text-xs font-bold text-slate-500 hover:text-[#7928CA] dark:text-slate-400 dark:hover:text-purple-300 transition-colors cursor-pointer"
        >
          Ver movimientos
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#7928CA] dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{row.limit > 0 ? 'Modificar' : 'Asignar'}</span>
        </button>
      </div>
    </div>
  );
};
