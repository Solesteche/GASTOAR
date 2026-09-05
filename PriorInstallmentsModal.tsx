import React, { useState, useMemo } from 'react';
import { 
  X, 
  History, 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  HelpCircle, 
  Sparkles,
  Calculator,
  User,
  Users,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CategoryMap, CoupleProfile, SplitType, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { BankCardSelect } from './BankCardSelect';

interface PriorInstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  profile: CoupleProfile;
  categoryMap: CategoryMap;
}

const PRESET_PRIOR_EXPENSES = [
  { label: 'Smart TV / Electro', cat: 'Servicios & Hogar', subcat: 'Equipamiento' },
  { label: 'Celular / Computadora', cat: 'Servicios & Hogar', subcat: 'Tecnología' },
  { label: 'Pasajes / Vacaciones', cat: 'Ocio & Suscripciones', subcat: 'Viajes' },
  { label: 'Muebles / Hogar', cat: 'Servicios & Hogar', subcat: 'Hogar' },
  { label: 'Indumentaria / Ropa', cat: 'Otros Gastos', subcat: 'Indumentaria' },
  { label: 'Curso / Educación', cat: 'Otros Gastos', subcat: 'Educación' },
];

export const PriorInstallmentsModal: React.FC<PriorInstallmentsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profile,
  categoryMap,
}) => {
  // Input mode: 'by_monthly_fee' (Sé la cuota mensual) vs 'by_total_debt' (Sé la deuda total)
  const [calculationMode, setCalculationMode] = useState<'by_monthly_fee' | 'by_total_debt'>('by_monthly_fee');

  const [concepto, setConcepto] = useState('');
  const [tarjetaNombre, setTarjetaNombre] = useState('Tarjeta Naranja X');

  // Values
  const [montoCuotaMensual, setMontoCuotaMensual] = useState(''); // Cuánto paga por mes
  const [cuotasTotalesPlan, setCuotasTotalesPlan] = useState<number>(12); // Ej. 12 cuotas
  const [cuotaActualNumero, setCuotaActualNumero] = useState<number>(4); // Ej. voy por la cuota 4
  const [deudaTotalPendiente, setDeudaTotalPendiente] = useState(''); // Monto total que debe

  // Who pays & split
  const [tipo, setTipo] = useState<'individual' | 'pareja'>('pareja');
  const [pagadoPor, setPagadoPor] = useState<'user1' | 'user2'>(profile.currentUser || 'user1');
  const [splitType, setSplitType] = useState<SplitType>('50_50');

  // Category
  const availableCats = Object.keys(categoryMap);
  const [categoria, setCategoria] = useState<string>(availableCats[0] || 'Servicios & Hogar');
  const [subcategoria, setSubcategoria] = useState<string>(categoryMap[availableCats[0]]?.[0] || 'General');

  // Date of start or first quota
  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const d = new Date();
    // Default to a few months ago
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });

  const currency = profile.currency || 'ARS';

  // Derived Calculations
  const calculations = useMemo(() => {
    let cuotaMonto = 0;
    let totalPlanMonto = 0;
    let saldoPendiente = 0;
    let totalCuotas = Math.max(1, cuotasTotalesPlan);
    let cuotaActual = Math.max(1, Math.min(totalCuotas, cuotaActualNumero));

    if (calculationMode === 'by_monthly_fee') {
      cuotaMonto = parseFloat(montoCuotaMensual) || 0;
      totalPlanMonto = cuotaMonto * totalCuotas;
      const cuotasPagadas = cuotaActual - 1; // Ya se pagaron las anteriores
      const cuotasRestantes = Math.max(0, totalCuotas - cuotasPagadas);
      saldoPendiente = cuotasRestantes * cuotaMonto;
    } else {
      saldoPendiente = parseFloat(deudaTotalPendiente) || 0;
      const cuotasRestantes = Math.max(1, totalCuotas - cuotaActual + 1);
      cuotaMonto = saldoPendiente > 0 ? saldoPendiente / cuotasRestantes : 0;
      totalPlanMonto = cuotaMonto * totalCuotas;
    }

    // Remaining months/installments
    const mesesFaltantes = Math.max(0, totalCuotas - cuotaActual + 1);

    // Estimated completion date
    const today = new Date();
    const finishDate = new Date(today.getFullYear(), today.getMonth() + mesesFaltantes - 1, 1);
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const finishMonthName = monthNames[finishDate.getMonth()];
    const finishYear = finishDate.getFullYear();
    const completionLabel = `${finishMonthName} de ${finishYear}`;

    // Progress percentage
    const progressPct = Math.round(((cuotaActual - 1) / totalCuotas) * 100);

    return {
      cuotaMonto,
      totalPlanMonto,
      saldoPendiente,
      totalCuotas,
      cuotaActual,
      mesesFaltantes,
      completionLabel,
      progressPct,
    };
  }, [
    calculationMode,
    montoCuotaMensual,
    cuotasTotalesPlan,
    cuotaActualNumero,
    deudaTotalPendiente,
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || calculations.totalPlanMonto <= 0) return;

    const finalCardName = tarjetaNombre.trim() || 'Tarjeta Naranja X';

    onSave({
      concepto: concepto.trim(),
      descripcion: `Consumo previo a la app (${calculations.cuotaActual}/${calculations.totalCuotas} cuotas - Faltan ${calculations.mesesFaltantes} meses)`,
      monto: calculations.totalPlanMonto,
      moneda: currency,
      categoria,
      subcategoria: subcategoria || 'General',
      fecha: fechaInicio || new Date().toISOString().split('T')[0],
      tipo,
      tipoTransaccion: 'gasto',
      pagadoPor,
      splitType: tipo === 'pareja' ? splitType : undefined,
      metodoPago: 'Crédito',
      esCuotas: true,
      cuotasTotal: calculations.totalCuotas,
      cuotaActual: calculations.cuotaActual,
      montoCuota: calculations.cuotaMonto,
      tarjetaNombre: finalCardName,
      primerMesCuota: fechaInicio.substring(0, 7),
      fechaPrimerPago: fechaInicio,
    });

    onClose();
  };

  const handleSelectPreset = (p: typeof PRESET_PRIOR_EXPENSES[0]) => {
    setConcepto(p.label);
    setCategoria(p.cat);
    if (categoryMap[p.cat]) {
      setSubcategoria(p.subcat);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Cargar Cuotas Anteriores a la App</h2>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] font-bold rounded-full border border-indigo-500/40">
                  Deudas en curso
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Registra consumos financiados previamente para calcular cuánto debés y meses restantes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Plantillas de consumos habituales
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PRIOR_EXPENSES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                    concepto === preset.label
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Concepto y Tarjeta */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                ¿Qué compraste? (Concepto)
              </label>
              <input
                type="text"
                required
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="ej. Smart TV 55 Samsung, Pasajes, Celular, etc."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Bank and Card selector for Argentina */}
            <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl">
              <BankCardSelect
                value={tarjetaNombre}
                onChange={setTarjetaNombre}
                label="Tarjeta, Banco o Billetera Virtual (Argentina)"
                showQuickChips={true}
              />
            </div>
          </div>

          {/* 2. Calculation Mode Toggle */}
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>¿Cómo preferís cargar los valores?</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCalculationMode('by_monthly_fee')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  calculationMode === 'by_monthly_fee'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-50'
                }`}
              >
                Sé cuánto pago por mes
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('by_total_debt')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  calculationMode === 'by_total_debt'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-50'
                }`}
              >
                Sé la deuda total pendiente
              </button>
            </div>
          </div>

          {/* 3. Numeric Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {calculationMode === 'by_monthly_fee' ? (
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cuota Mensual ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={montoCuotaMensual}
                    onChange={(e) => setMontoCuotaMensual(e.target.value)}
                    placeholder="25000"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Monto exacto por mes</span>
              </div>
            ) : (
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Deuda Restante Total ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={deudaTotalPendiente}
                    onChange={(e) => setDeudaTotalPendiente(e.target.value)}
                    placeholder="150000"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Total que debés hoy</span>
              </div>
            )}

            {/* Total Installments */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Plan Total de Cuotas
              </label>
              <select
                value={cuotasTotalesPlan}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCuotasTotalesPlan(val);
                  if (cuotaActualNumero > val) setCuotaActualNumero(val);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {[2, 3, 4, 6, 9, 12, 18, 24, 36, 48].map(n => (
                  <option key={n} value={n}>{n} cuotas</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400">En cuántas cuotas fue</span>
            </div>

            {/* Current Quota Number */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                ¿Por qué cuota vas hoy?
              </label>
              <select
                value={cuotaActualNumero}
                onChange={(e) => setCuotaActualNumero(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {Array.from({ length: cuotasTotalesPlan }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>
                    Cuota {n} de {cuotasTotalesPlan}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400">Próxima cuota a pagar</span>
            </div>

          </div>

          {/* 4. REAL-TIME CALCULATION SUMMARY CARD (Crucial requirement) */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-800 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Diagnóstico Automático de la Deuda
                </span>
              </div>
              <span className="text-xs font-extrabold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                {calculations.mesesFaltantes === 1 ? '¡Último mes!' : `Faltan ${calculations.mesesFaltantes} meses`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Faltan pagar</span>
                <span className="text-base sm:text-lg font-black text-amber-300">
                  {calculations.mesesFaltantes} {calculations.mesesFaltantes === 1 ? 'cuota' : 'cuotas'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Terminás en</span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {calculations.completionLabel}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Cuota mensual</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  {formatCurrency(calculations.cuotaMonto, currency)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Saldo total que debés</span>
                <span className="text-base sm:text-lg font-black text-white">
                  {formatCurrency(calculations.saldoPendiente, currency)}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-300">
                <span>Progreso del plan: {calculations.progressPct}% amortizado</span>
                <span>Cuota {calculations.cuotaActual} de {calculations.totalCuotas}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-400 transition-all duration-300"
                  style={{ width: `${calculations.progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* 5. Distribution & Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                ¿De quién es el gasto?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('individual')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    tipo === 'individual'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('pareja')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    tipo === 'pareja'
                      ? 'bg-pink-600 border-pink-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Compartido Pareja
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Titular / Pagador de la Tarjeta
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPagadoPor('user1')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    pagadoPor === 'user1'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {profile.user1Name}
                </button>
                <button
                  type="button"
                  onClick={() => setPagadoPor('user2')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    pagadoPor === 'user2'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {profile.user2Name}
                </button>
              </div>
            </div>
          </div>

          {/* 6. Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={calculations.totalPlanMonto <= 0 || !concepto.trim()}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Guardar Consumo Anterior en Cuotas</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
