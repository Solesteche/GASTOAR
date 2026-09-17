import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, BellRing, Calendar, Check, CheckCircle2, ChevronRight,
  Edit3, Lightbulb, Plus, Settings2, ShieldCheck, Target, TrendingDown, TrendingUp,
  WalletCards, X, Sparkles
} from 'lucide-react';
import { Budgets, CategoryColors, CategoryMap, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { BudgetComparisonView } from './BudgetComparisonView';

interface BudgetSectionProps {
  budgets: Budgets;
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  transactions: Transaction[];
  currency: string;
  onOpenBudgetModal: () => void;
  onCreateBudget?: () => void;
  onUpdateBudgets?: (newBudgets: Budgets) => void;
  onSelectCategory?: (category: string) => void;
}

const DEFAULT_BUDGETS: Budgets = { categories: {}, subcategories: {} };
type BudgetView = 'budget' | 'alerts' | 'projection' | 'comparison';

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  budgets = DEFAULT_BUDGETS,
  categoryMap = {},
  categoryColors = {},
  transactions = [],
  currency = 'ARS',
  onOpenBudgetModal,
  onCreateBudget,
  onUpdateBudgets,
  onSelectCategory,
}) => {
  const [view, setView] = useState<BudgetView>('budget');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [quickValue, setQuickValue] = useState('');
  const [projectionPercent, setProjectionPercent] = useState(budgets?.projectionGrowthPercent || 15);
  const [projectionSource, setProjectionSource] = useState<'current_budget' | 'real_expenses'>('current_budget');
  const [search, setSearch] = useState('');

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
    return { category, limit, spent, pct, status, remaining: limit - spent, color: categoryColors[category] || '#7928CA' };
  }), [categories, budgets.categories, spending, threshold, categoryColors]);

  const summary = useMemo(() => {
    const totalBudget = rows.reduce((s, r) => s + r.limit, 0);
    const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
    const assigned = rows.filter(r => r.limit > 0).length;
    const risk = rows.filter(r => r.status === 'warning' || r.status === 'exceeded').length;
    const safe = rows.filter(r => r.status === 'ok').length;
    const remaining = totalBudget - totalSpent;
    return { totalBudget, totalSpent, assigned, risk, safe, remaining, pct: totalBudget ? Math.round(totalSpent / totalBudget * 100) : 0 };
  }, [rows]);

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

  const tabs: Array<[BudgetView, string, React.ElementType]> = [
    ['budget', 'Presupuesto', WalletCards],
    ['alerts', 'Alertas y Límites', BellRing],
    ['projection', 'Proyección', TrendingUp],
    ['comparison', 'Comparativa', BarChart3],
  ];

  return (
    <div className="budget-responsive space-y-5 pb-24 sm:pb-5">
      <section className="rounded-[28px] border border-purple-100 bg-white shadow-[0_8px_30px_-12px_rgba(121,40,202,0.15)] overflow-hidden dark:bg-[#140728] dark:border-purple-900/40">
        <div className="p-4 sm:p-6 bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-black uppercase tracking-wider">Planificación financiera</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-300/20 text-[10px] font-bold">{monthLabel}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-3">Presupuesto</h2>
              <p className="text-xs sm:text-sm text-purple-100/80 mt-1 max-w-2xl">Definí tus límites, anticipá el próximo mes y compará lo que presupuestaste contra tus gastos reales.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={onCreateBudget || onOpenBudgetModal} className="px-4 py-2.5 rounded-2xl bg-[#F95420] hover:bg-[#E04412] text-white text-xs font-black shadow-lg flex items-center gap-1.5 active:scale-95 transition-all"><Plus className="w-4 h-4" />Crear presupuesto</button>
              <button onClick={onOpenBudgetModal} className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5"><Settings2 className="w-4 h-4" />Configuración</button>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-5 pt-3 border-b border-slate-100 dark:border-purple-900/40 overflow-x-auto">
          <div className="flex min-w-max gap-1">
            {tabs.map(([id, label, Icon]) => (
              <button key={id} onClick={() => setView(id)} className={`px-4 py-3 rounded-t-xl text-xs font-black flex items-center gap-1.5 transition-all ${view === id ? 'bg-purple-50 text-[#7928CA] dark:bg-purple-950/40 dark:text-purple-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}><Icon className="w-4 h-4" />{label}</button>
            ))}
          </div>
        </div>

        {view === 'budget' && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Metric label="Presupuesto asignado" value={formatCurrency(summary.totalBudget, currency)} icon={Target} tone="purple" helper={`${summary.assigned} categorías con límite`} />
              <Metric label="Gastado" value={formatCurrency(summary.totalSpent, currency)} icon={TrendingUp} tone="orange" helper={`${summary.pct}% consumido`} />
              <Metric label="Disponible" value={formatCurrency(Math.max(0, summary.remaining), currency)} icon={CheckCircle2} tone="green" helper={summary.remaining >= 0 ? 'Dentro del presupuesto' : 'Presupuesto excedido'} />
              <Metric label="Gasto diario seguro" value={formatCurrency(Math.max(0, Math.round(summary.remaining / daysRemaining)), currency)} icon={Calendar} tone="blue" helper={`${daysRemaining} días restantes`} />
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-purple-900/50 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><h3 className="font-black text-[#2E0854] dark:text-white">Progreso del presupuesto</h3><p className="text-[11px] text-slate-500 mt-1">Tu consumo real frente al total asignado.</p></div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${summary.pct >= 100 ? 'bg-rose-100 text-rose-700' : summary.pct >= threshold ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{summary.pct}% consumido</span>
              </div>
              <div className="mt-4 h-4 rounded-full bg-slate-100 dark:bg-purple-950/60 overflow-hidden"><div className={`h-full rounded-full transition-all ${summary.pct >= 100 ? 'bg-rose-500' : summary.pct >= threshold ? 'bg-amber-500' : 'bg-gradient-to-r from-[#7928CA] to-[#A855F7]'}`} style={{ width: `${Math.min(100, summary.pct)}%` }} /></div>
              <div className="flex justify-between mt-2 text-[11px] font-bold"><span className="text-slate-500">{formatCurrency(summary.totalSpent, currency)} gastado</span><span className="text-slate-700 dark:text-slate-200">{formatCurrency(summary.totalBudget, currency)} total</span></div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3"><div><h3 className="font-black text-[#2E0854] dark:text-white">Tus categorías</h3><p className="text-[11px] text-slate-500">Editá cada límite sin salir de esta pantalla.</p></div><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar categoría..." className="w-full sm:w-56 rounded-xl border border-slate-200 dark:border-purple-900 bg-slate-50 dark:bg-[#190731] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500/20" /></div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {rows.filter(r => r.category.toLowerCase().includes(search.toLowerCase())).map(r => <CategoryCard key={r.category} row={r} currency={currency} threshold={threshold} onEdit={() => openQuick(r.category, r.limit)} onView={() => onSelectCategory?.(r.category)} />)}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-purple-100 bg-purple-50/60 dark:bg-purple-950/20 dark:border-purple-900/40 p-4"><div className="flex items-start gap-3"><Lightbulb className="w-5 h-5 text-[#7928CA] mt-0.5" /><div><p className="text-xs font-black text-[#2E0854] dark:text-purple-100">¿Querés ahorrar tiempo?</p><p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">Creá un nuevo presupuesto copiando el actual o usando tus gastos reales como base.</p></div></div></div>
              <button onClick={() => setView('projection')} className="rounded-2xl border border-orange-100 bg-orange-50/60 dark:bg-orange-950/20 dark:border-orange-900/40 p-4 text-left flex items-center justify-between group"><div><p className="text-xs font-black text-orange-900 dark:text-orange-200">Proyección automática</p><p className="text-[11px] text-orange-800/70 dark:text-orange-300/70 mt-1">Ajustá tus límites según inflación o consumo real.</p></div><ChevronRight className="w-5 h-5 text-orange-500 group-hover:translate-x-1 transition-transform" /></button>
            </div>
          </div>
        )}

        {view === 'alerts' && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-purple-50/50 dark:from-amber-950/20 dark:to-purple-950/20 dark:border-amber-900/50 p-5">
              <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center"><BellRing className="w-5 h-5" /></div><div><h3 className="font-black text-[#2E0854] dark:text-white">Alertas y límites de presupuesto</h3><p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Configurá el porcentaje a partir del cual GastoAR te avisa que una categoría está entrando en zona de riesgo.</p></div></div>
              <div className="mt-5 flex items-center justify-between"><span className="text-xs font-bold">Alerta activa al</span><span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black">{threshold}%</span></div>
              <div className="grid grid-cols-5 gap-2 mt-3">{[70,75,80,85,90].map(p => <button key={p} onClick={() => onUpdateBudgets?.({ ...budgets, alertThresholdPercent: p })} className={`py-2 rounded-xl text-xs font-black border ${threshold === p ? 'bg-[#7928CA] border-[#7928CA] text-white' : 'bg-white dark:bg-[#190731] border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-slate-300'}`}>{p}%</button>)}</div>
              <input type="range" min="50" max="95" step="5" value={threshold} onChange={e => onUpdateBudgets?.({ ...budgets, alertThresholdPercent: Number(e.target.value) })} className="w-full mt-5 accent-purple-600" />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold"><span>Temprana</span><span>Moderada</span><span>Tardía</span></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <StatusBox title="Bajo control" count={summary.safe} tone="green" icon={CheckCircle2} />
              <StatusBox title="En riesgo" count={summary.risk} tone="orange" icon={AlertTriangle} />
              <StatusBox title="Sin límite" count={rows.filter(r => r.limit <= 0).length} tone="slate" icon={ShieldCheck} />
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-purple-900/50 overflow-hidden"><div className="px-4 py-3 bg-slate-50 dark:bg-[#190731] text-xs font-black">Categorías que requieren atención</div>{rows.filter(r => r.status === 'warning' || r.status === 'exceeded').length === 0 ? <div className="p-6 text-center text-xs text-slate-500">No hay categorías en riesgo. ¡Buen trabajo!</div> : rows.filter(r => r.status === 'warning' || r.status === 'exceeded').map(r => <div key={r.category} className="px-4 py-3 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between"><div><p className="text-xs font-black">{r.category}</p><p className="text-[10px] text-slate-500">{formatCurrency(r.spent, currency)} de {formatCurrency(r.limit, currency)}</p></div><span className={`text-xs font-black ${r.status === 'exceeded' ? 'text-rose-600' : 'text-amber-600'}`}>{r.pct}%</span></div>)}</div>
          </div>
        )}

        {view === 'projection' && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 dark:border-purple-900/50 p-5">
              <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-2xl bg-[#7928CA] text-white flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div><div><h3 className="font-black text-[#2E0854] dark:text-white">Proyección automática para próximos meses</h3><p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Ajustá tus presupuestos según la inflación esperada tomando como base tus límites actuales o tus gastos reales.</p></div></div>
              <div className="mt-5 grid sm:grid-cols-2 gap-3"><button onClick={() => setProjectionSource('current_budget')} className={`text-left p-4 rounded-2xl border ${projectionSource === 'current_budget' ? 'bg-white dark:bg-[#190731] border-purple-500 ring-2 ring-purple-500/10' : 'bg-white/50 dark:bg-[#16072b] border-slate-200 dark:border-purple-900/50'}`}><p className="text-xs font-black">Opción A · Límites actuales</p><p className="text-[10px] text-slate-500 mt-1">Aplica la inflación sobre los presupuestos definidos hoy.</p></button><button onClick={() => setProjectionSource('real_expenses')} className={`text-left p-4 rounded-2xl border ${projectionSource === 'real_expenses' ? 'bg-white dark:bg-[#190731] border-purple-500 ring-2 ring-purple-500/10' : 'bg-white/50 dark:bg-[#16072b] border-slate-200 dark:border-purple-900/50'}`}><p className="text-xs font-black">Opción B · Gastos reales</p><p className="text-[10px] text-slate-500 mt-1">Usa tu consumo registrado como punto de partida.</p></button></div>
              <div className="mt-5"><div className="flex items-center justify-between"><span className="text-xs font-black">Inflación / ajuste esperado</span><span className="text-lg font-black text-[#7928CA]">+{projectionPercent}%</span></div><input type="range" min="0" max="50" step="1" value={projectionPercent} onChange={e => setProjectionPercent(Number(e.target.value))} className="w-full mt-3 accent-purple-600" /><div className="flex gap-2 flex-wrap mt-3">{[5,10,15,20,25,30].map(p => <button key={p} onClick={() => setProjectionPercent(p)} className={`px-3 py-1.5 rounded-xl text-[11px] font-black border ${projectionPercent === p ? 'bg-[#2E0854] text-white border-[#2E0854]' : 'bg-white dark:bg-[#190731] border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-slate-300'}`}>+{p}%</button>)}</div></div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Base actual" value={formatCurrency(projection.reduce((s,r)=>s+r.base,0), currency)} icon={Target} tone="purple" helper="Base seleccionada" /><Metric label="Proyectado" value={formatCurrency(projectedTotal, currency)} icon={TrendingUp} tone="green" helper={`+${projectionPercent}%`} /><Metric label="Diferencia" value={formatCurrency(projectedTotal - projection.reduce((s,r)=>s+r.base,0), currency)} icon={TrendingUp} tone="orange" helper="Ajuste estimado" /><Metric label="Categorías" value={String(projection.length)} icon={WalletCards} tone="blue" helper="Con base disponible" /></div>
            <div className="rounded-2xl border border-slate-200 dark:border-purple-900/50 overflow-hidden"><div className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] gap-2 px-4 py-3 bg-slate-50 dark:bg-[#190731] text-[10px] uppercase font-black text-slate-400"><span>Categoría</span><span>Base</span><span>Proyección</span><span>Δ</span></div>{projection.map(r => <div key={r.category} className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] gap-2 px-4 py-3 border-t border-slate-100 dark:border-purple-900/30 text-xs"><span className="font-bold truncate">{r.category}</span><span>{formatCurrency(r.base,currency)}</span><strong className="text-[#7928CA]">{formatCurrency(r.projected,currency)}</strong><span className="text-emerald-600 font-bold">+{Math.round(r.projected-r.base).toLocaleString('es-AR')}</span></div>)}</div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4"><div><p className="text-xs font-black text-emerald-900 dark:text-emerald-200">La proyección no cambia nada hasta que la confirmes.</p><p className="text-[10px] text-emerald-800/70 dark:text-emerald-300/70 mt-1">Podés revisar los valores y aplicar el ajuste cuando estés conforme.</p></div><button onClick={applyProjection} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2E0854] to-[#7928CA] text-white text-xs font-black flex items-center justify-center gap-1.5"><Check className="w-4 h-4" />Aplicar proyección</button></div>
          </div>
        )}

        {view === 'comparison' && <div className="p-3 sm:p-5"><BudgetComparisonView budgets={budgets} categoryMap={categoryMap} categoryColors={categoryColors} transactions={transactions} currency={currency} /></div>}
      </section>

      {editingCategory && <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#140728] p-6 shadow-2xl border border-purple-100 dark:border-purple-900/50"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase font-black text-purple-500">Edición rápida</p><h3 className="text-lg font-black text-[#2E0854] dark:text-white">Límite de {editingCategory}</h3></div><button onClick={() => setEditingCategory(null)}><X className="w-5 h-5 text-slate-400" /></button></div><label className="block mt-5 text-xs font-bold">Nuevo límite mensual</label><div className="relative mt-2"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span><input autoFocus type="number" value={quickValue} onChange={e=>setQuickValue(e.target.value)} className="w-full pl-8 pr-3 py-3 rounded-xl border border-slate-200 dark:border-purple-900 bg-slate-50 dark:bg-[#190731] font-black outline-none" /></div><div className="flex gap-2 mt-4 flex-wrap">{[10,15,20].map(p=><button key={p} onClick={()=>setQuickValue(String(Math.round((spending[editingCategory]||0)*(1+p/100)/1000)*1000))} className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-[#7928CA] text-[11px] font-black">+{p}% gasto real</button>)}</div><div className="flex justify-end gap-2 mt-6"><button onClick={()=>setEditingCategory(null)} className="px-4 py-2 rounded-xl text-xs font-bold">Cancelar</button><button onClick={saveQuick} className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7928CA] to-[#A855F7] text-white text-xs font-black">Guardar límite</button></div></div></div>}
    </div>
  );
};

function Metric({ label, value, helper, icon: Icon, tone }: { label:string; value:string; helper:string; icon:React.ElementType; tone:'purple'|'orange'|'green'|'blue' }) {
  const tones = { purple:'bg-purple-50 text-[#7928CA] dark:bg-purple-950/30', orange:'bg-orange-50 text-orange-600 dark:bg-orange-950/20', green:'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20', blue:'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' };
  return <div className="rounded-2xl border border-slate-200 dark:border-purple-900/40 p-4 bg-white dark:bg-[#16072b]"><div className="flex items-center justify-between gap-2"><span className="text-[10px] uppercase tracking-wider font-black text-slate-400">{label}</span><span className={`w-8 h-8 rounded-xl flex items-center justify-center ${tones[tone]}`}><Icon className="w-4 h-4" /></span></div><p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-3 truncate">{value}</p><p className="text-[10px] text-slate-500 mt-1">{helper}</p></div>;
}

function StatusBox({ title, count, tone, icon: Icon }: { title:string; count:number; tone:'green'|'orange'|'slate'; icon:React.ElementType }) {
  const cls = tone === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : tone === 'orange' ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-700';
  return <div className={`rounded-2xl border p-4 ${cls}`}><div className="flex items-center justify-between"><Icon className="w-5 h-5" /><span className="text-2xl font-black">{count}</span></div><p className="text-xs font-black mt-3">{title}</p></div>;
}

function CategoryCard({ row, currency, threshold, onEdit, onView }: { row:any; currency:string; threshold:number; onEdit:()=>void; onView:()=>void }) {
  const statusClass = row.status === 'exceeded' ? 'bg-rose-100 text-rose-700' : row.status === 'warning' ? 'bg-amber-100 text-amber-700' : row.status === 'none' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700';
  return <div className="rounded-2xl border border-slate-200 dark:border-purple-900/40 p-4 bg-white dark:bg-[#16072b] hover:shadow-md transition-shadow relative overflow-hidden"><div className="absolute top-0 left-0 right-0 h-1" style={{backgroundColor:row.status==='exceeded'?'#f43f5e':row.status==='warning'?'#f59e0b':row.color}} /><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor:row.color}} /><h4 className="text-sm font-black truncate">{row.category}</h4></div><p className="text-[10px] text-slate-400 mt-1">{row.limit > 0 ? `${formatCurrency(row.spent,currency)} de ${formatCurrency(row.limit,currency)}` : 'Sin límite asignado'}</p></div><span className={`px-2 py-1 rounded-full text-[9px] font-black ${statusClass}`}>{row.limit <= 0 ? 'Sin límite' : `${row.pct}%`}</span></div>{row.limit > 0 && <div className="mt-3 h-2.5 rounded-full bg-slate-100 dark:bg-purple-950/60 overflow-hidden"><div className={`h-full rounded-full ${row.status==='exceeded'?'bg-rose-500':row.status==='warning'?'bg-amber-500':'bg-[#7928CA]'}`} style={{width:`${Math.min(100,row.pct)}%`}} /></div>}<div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-purple-900/30"><button onClick={onView} className="text-[10px] font-black text-slate-500 hover:text-[#7928CA]">Ver gastos</button><button onClick={onEdit} className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-[#7928CA] text-[10px] font-black flex items-center gap-1"><Edit3 className="w-3 h-3" />{row.limit>0?'Editar':'Asignar'}</button></div></div>;
}
