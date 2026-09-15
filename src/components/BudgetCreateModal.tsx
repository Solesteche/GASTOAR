import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  X,
  WalletCards,
} from 'lucide-react';
import { Budgets, CategoryMap, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BudgetCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budgets;
  categoryMap: CategoryMap;
  categoryColors?: Record<string, string>;
  transactions?: Transaction[];
  currency?: string;
  onCreate: (newBudgets: Budgets) => void;
}

type StartMode = 'empty' | 'copy' | 'real';

export const BudgetCreateModal: React.FC<BudgetCreateModalProps> = ({
  isOpen,
  onClose,
  budgets,
  categoryMap,
  categoryColors = {},
  transactions = [],
  currency = 'ARS',
  onCreate,
}) => {
  const [step, setStep] = useState(1);
  const [startMode, setStartMode] = useState<StartMode>('copy');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [income, setIncome] = useState('');
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [created, setCreated] = useState(false);

  const realExpensesByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (!tx || tx.tipoTransaccion === 'ingreso') return;
      result[tx.categoria] = (result[tx.categoria] || 0) + Number(tx.monto || 0);
    });
    return result;
  }, [transactions]);

  const categoryList = useMemo(() => {
    return Array.from(new Set([...Object.keys(categoryMap || {}), ...Object.keys(budgets?.categories || {})]));
  }, [categoryMap, budgets]);

  const totalAssigned = useMemo(
    () => Object.values(categories).reduce<number>((sum, value) => sum + (Number(value) || 0), 0),
    [categories]
  );

  const suggestedByReal = useMemo(() => {
    const next: Record<string, number> = {};
    categoryList.forEach((cat) => {
      const real = realExpensesByCategory[cat] || 0;
      if (real > 0) next[cat] = Math.round(real / 1000) * 1000;
    });
    return next;
  }, [categoryList, realExpensesByCategory]);

  const suggestedCopy = useMemo(() => ({ ...(budgets?.categories || {}) }), [budgets]);

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStep(1);
    setStartMode(Object.keys(budgets?.categories || {}).length ? 'copy' : 'empty');
    setName(first.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase()));
    setStartDate(iso(first));
    setEndDate(iso(last));
    setIncome('');
    setCategories({ ...(budgets?.categories || {}) });
    setAlertThreshold(budgets?.alertThresholdPercent || 80);
    setCreated(false);
  }, [isOpen, budgets]);

  useEffect(() => {
    if (!isOpen) return;
    if (startMode === 'empty') setCategories({});
    if (startMode === 'copy') setCategories(suggestedCopy);
    if (startMode === 'real') setCategories(suggestedByReal);
  }, [startMode, isOpen, suggestedCopy, suggestedByReal]);

  if (!isOpen) return null;

  const handleChange = (cat: string, value: string) => {
    const numeric = value === '' ? 0 : Math.max(0, Math.round(Number(value) || 0));
    setCategories((prev) => ({ ...prev, [cat]: numeric }));
  };

  const handleCreate = () => {
    const newBudgets: Budgets = {
      ...budgets,
      name: name.trim() || 'Presupuesto mensual',
      startDate,
      endDate,
      income: Number(income) || 0,
      categories,
      alertThresholdPercent: alertThreshold,
      projectionGrowthPercent: budgets?.projectionGrowthPercent || 15,
      createdAt: new Date().toISOString(),
    };
    onCreate(newBudgets);
    setCreated(true);
  };

  const canContinue = step === 1 ? Boolean(name.trim() && startDate && endDate) : totalAssigned > 0;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-3xl max-h-[94vh] overflow-hidden rounded-[28px] bg-white dark:bg-[#140728] border border-purple-100 dark:border-purple-900/50 shadow-2xl text-slate-800 dark:text-slate-100 flex flex-col">
        <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-5 sm:p-6 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-purple-200 font-black">Nuevo presupuesto</p>
                <h2 className="text-lg sm:text-xl font-black">Armá tu presupuesto en 3 pasos</h2>
                <p className="text-xs text-purple-100/80 mt-1">Definí el período, asigná límites y revisá antes de activar.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-purple-100" aria-label="Cerrar"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[['1', 'Datos'], ['2', 'Categorías'], ['3', 'Revisar']].map(([n, label]) => (
              <div key={n} className={`rounded-xl px-3 py-2 border text-xs font-bold ${step === Number(n) ? 'bg-white text-[#4A0E78] border-white' : 'bg-white/10 border-white/15 text-purple-100'}`}>
                <span className="mr-1.5">{n}.</span>{label}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {created ? (
            <div className="py-10 text-center space-y-5">
              <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-9 h-9" /></div>
              <div>
                <h3 className="text-2xl font-black text-[#2E0854] dark:text-white">¡Presupuesto creado!</h3>
                <p className="text-sm text-slate-500 mt-2">{name} ya está listo para controlar tus gastos.</p>
              </div>
              <div className="mx-auto max-w-sm rounded-2xl border border-purple-100 bg-purple-50/60 dark:bg-purple-950/30 dark:border-purple-900/40 p-4">
                <p className="text-xs font-bold text-slate-500">Total asignado</p>
                <p className="text-2xl font-black text-[#7928CA] mt-1">{formatCurrency(totalAssigned, currency)}</p>
              </div>
              <button onClick={onClose} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2E0854] to-[#7928CA] text-white text-sm font-black shadow-lg">Ver mi presupuesto</button>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-black text-[#2E0854] dark:text-white">1. Datos generales</h3>
                    <p className="text-xs text-slate-500 mt-1">Podés dejar que GastoAR complete el nombre del período automáticamente.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="space-y-1.5"><span className="text-xs font-bold text-slate-700 dark:text-slate-200">Nombre</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Septiembre 2026" className="w-full rounded-2xl border border-slate-200 dark:border-purple-900 bg-slate-50 dark:bg-[#1a0734] px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500/20" /></label>
                    <label className="space-y-1.5"><span className="text-xs font-bold text-slate-700 dark:text-slate-200">Ingresos previstos <span className="font-normal text-slate-400">(opcional)</span></span><input type="number" min="0" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0" className="w-full rounded-2xl border border-slate-200 dark:border-purple-900 bg-slate-50 dark:bg-[#1a0734] px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500/20" /></label>
                    <label className="space-y-1.5"><span className="text-xs font-bold text-slate-700 dark:text-slate-200">Desde</span><div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" /><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-2xl border border-slate-200 dark:border-purple-900 bg-slate-50 dark:bg-[#1a0734] pl-11 pr-4 py-3 text-sm font-semibold outline-none" /></div></label>
                    <label className="space-y-1.5"><span className="text-xs font-bold text-slate-700 dark:text-slate-200">Hasta</span><div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" /><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-2xl border border-slate-200 dark:border-purple-900 bg-slate-50 dark:bg-[#1a0734] pl-11 pr-4 py-3 text-sm font-semibold outline-none" /></div></label>
                  </div>
                  <div className="rounded-2xl border border-purple-100 dark:border-purple-900/50 p-4 bg-purple-50/50 dark:bg-purple-950/20">
                    <div className="flex items-center gap-2 mb-3"><WalletCards className="w-4 h-4 text-[#7928CA]" /><span className="text-xs font-black text-[#2E0854] dark:text-purple-100">¿Cómo querés empezar?</span></div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {([
                        ['empty', 'Desde cero', 'Configurá tus límites manualmente', Target],
                        ['copy', 'Copiar actual', 'Usá los límites que ya tenés', Copy],
                        ['real', 'Gastos reales', 'Tomá tu consumo como base', TrendingUp],
                      ] as const).map(([value, title, desc, Icon]) => (
                        <button key={value} type="button" onClick={() => setStartMode(value)} className={`text-left rounded-2xl p-4 border transition-all ${startMode === value ? 'border-purple-500 bg-white dark:bg-[#190731] ring-2 ring-purple-500/15 shadow-sm' : 'border-slate-200 dark:border-purple-900/60 bg-white/60 dark:bg-[#16072b]'}`}>
                          <Icon className={`w-5 h-5 ${startMode === value ? 'text-[#7928CA]' : 'text-slate-400'}`} />
                          <p className="text-xs font-black mt-3">{title}</p><p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div><h3 className="text-lg font-black text-[#2E0854] dark:text-white">2. Asigná límites por categoría</h3><p className="text-xs text-slate-500 mt-1">Solo necesitás definir las categorías que realmente querés controlar.</p></div>
                    <div className="text-right"><p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Total asignado</p><p className="text-xl font-black text-[#7928CA]">{formatCurrency(totalAssigned, currency)}</p></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {categoryList.map((cat) => {
                      const value = categories[cat] || 0;
                      const real = realExpensesByCategory[cat] || 0;
                      return (
                        <div key={cat} className="rounded-2xl border border-slate-200 dark:border-purple-900/50 p-4 bg-white dark:bg-[#16072b]">
                          <div className="flex items-center gap-2 mb-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[cat] || '#7928CA' }} /><span className="text-xs font-black truncate">{cat}</span></div>
                          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span><input type="number" min="0" step="1000" value={value || ''} onChange={(e) => handleChange(cat, e.target.value)} placeholder="Sin límite" className="w-full rounded-xl border border-slate-200 dark:border-purple-900 bg-slate-50 dark:bg-[#1a0734] pl-8 pr-3 py-2.5 text-sm font-black outline-none focus:ring-2 focus:ring-purple-500/20" /></div>
                          {real > 0 && <p className="text-[10px] text-slate-400 mt-2">Gasto real reciente: <strong>{formatCurrency(real, currency)}</strong></p>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 flex items-start gap-3"><Lightbulb className="w-5 h-5 text-emerald-600 shrink-0" /><div><p className="text-xs font-black text-emerald-900 dark:text-emerald-200">No hace falta completar todo</p><p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-1">Podés agregar o ajustar límites después desde la sección Presupuesto.</p></div></div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div><h3 className="text-lg font-black text-[#2E0854] dark:text-white">3. Revisá antes de crear</h3><p className="text-xs text-slate-500 mt-1">Estos valores serán la base para alertas, comparativas y proyecciones.</p></div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 p-4"><p className="text-[10px] uppercase font-black text-slate-400">Presupuesto</p><p className="text-lg font-black text-[#7928CA] mt-1">{formatCurrency(totalAssigned, currency)}</p></div>
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4"><p className="text-[10px] uppercase font-black text-slate-400">Categorías</p><p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1">{Object.values(categories).filter(v => Number(v) > 0).length}</p></div>
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-4"><p className="text-[10px] uppercase font-black text-slate-400">Alerta</p><p className="text-lg font-black text-amber-700 dark:text-amber-300 mt-1">{alertThreshold}%</p></div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 dark:border-purple-900/50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-[#190731] flex items-center justify-between"><span className="text-xs font-black">{name}</span><span className="text-[10px] text-slate-500">{startDate} → {endDate}</span></div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-purple-900/30">
                      {categoryList.filter(cat => (categories[cat] || 0) > 0).map(cat => <div key={cat} className="px-4 py-3 flex items-center justify-between"><span className="text-xs font-semibold">{cat}</span><strong className="text-xs">{formatCurrency(categories[cat], currency)}</strong></div>)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-purple-100 dark:border-purple-900/50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black">Umbral de alerta preventiva</p><p className="text-[10px] text-slate-500 mt-1">Avisar cuando una categoría alcance este porcentaje.</p></div><strong className="text-sm text-[#7928CA]">{alertThreshold}%</strong></div><div className="flex gap-2 mt-3 flex-wrap">{[70,75,80,85,90].map(p => <button key={p} type="button" onClick={() => setAlertThreshold(p)} className={`px-3 py-1.5 rounded-xl text-xs font-black border ${alertThreshold === p ? 'bg-[#7928CA] text-white border-[#7928CA]' : 'bg-white dark:bg-[#16072b] border-slate-200 dark:border-purple-900/60 text-slate-600 dark:text-slate-300'}`}>{p}%</button>)}</div></div>
                </div>
              )}
            </>
          )}
        </div>

        {!created && (
          <div className="px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-purple-900/40 flex items-center justify-between gap-3 shrink-0 bg-white/95 dark:bg-[#140728]/95">
            <button type="button" onClick={() => step === 1 ? onClose() : setStep((s) => s - 1)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-purple-950/40 flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" />{step === 1 ? 'Cancelar' : 'Atrás'}</button>
            {step < 3 ? (
              <button type="button" disabled={!canContinue} onClick={() => setStep((s) => s + 1)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2E0854] to-[#7928CA] text-white text-xs font-black shadow-md disabled:opacity-40 flex items-center gap-1.5">Continuar<ArrowRight className="w-4 h-4" /></button>
            ) : (
              <button type="button" disabled={!canContinue} onClick={handleCreate} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F95420] to-[#FF6B3D] text-white text-xs font-black shadow-md disabled:opacity-40 flex items-center gap-1.5"><Check className="w-4 h-4" />Crear presupuesto</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
