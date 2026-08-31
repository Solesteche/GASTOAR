import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  User, 
  Users, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Percent, 
  Check, 
  Sparkles,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Layers,
  Clock,
  ChevronDown,
  Coins
} from 'lucide-react';
import { CategoryMap, CoupleProfile, PaymentMethod, SplitType, Transaction } from '../types';
import { BankCardSelect } from './BankCardSelect';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  editingTransaction?: Transaction | null;
  categoryMap: CategoryMap;
  profile: CoupleProfile;
  initialIsCuotas?: boolean;
  initialTransactionType?: 'gasto' | 'ingreso';
}

const COMMON_INSTALLMENTS = [1, 3, 6, 9, 12, 18, 24];

const INCOME_PRESETS = [
  { label: 'Sueldo / Salario', category: 'Ingresos', subcategory: 'Sueldo', icon: '💼' },
  { label: 'Honorarios / Freelance', category: 'Ingresos', subcategory: 'Honorarios', icon: '💻' },
  { label: 'Venta / Emprendimiento', category: 'Ingresos', subcategory: 'Ventas', icon: '🛍️' },
  { label: 'Inversiones / Rendimientos', category: 'Ingresos', subcategory: 'Inversiones', icon: '📈' },
  { label: 'Aguinaldo / Bono', category: 'Ingresos', subcategory: 'Bono', icon: '🎁' },
  { label: 'Reintegro / Devolución', category: 'Ingresos', subcategory: 'Reintegro', icon: '🔄' },
  { label: 'Alquiler / Cobro', category: 'Ingresos', subcategory: 'Alquiler', icon: '🏠' },
  { label: 'Otro Ingreso', category: 'Ingresos', subcategory: 'Varios', icon: '💰' },
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  categoryMap,
  profile,
  initialIsCuotas = false,
  initialTransactionType = 'gasto',
}) => {
  // Main transaction kind: Gasto vs Ingreso
  const [tipoTransaccion, setTipoTransaccion] = useState<'gasto' | 'ingreso'>('gasto');

  // Shared fields
  const [tipo, setTipo] = useState<'individual' | 'pareja'>('pareja');
  const [concepto, setConcepto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState<string>('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [pagadoPor, setPagadoPor] = useState<'user1' | 'user2'>(profile.currentUser || 'user1');
  const [splitType, setSplitType] = useState<SplitType>('50_50');
  const [user1Percent, setUser1Percent] = useState<number>(50);
  const [user2Percent, setUser2Percent] = useState<number>(50);
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('Débito');

  // Installment (Cuotas) states (for expenses)
  const [esCuotas, setEsCuotas] = useState<boolean>(false);
  const [cuotasTotal, setCuotasTotal] = useState<number>(3);
  const [cuotaActual, setCuotaActual] = useState<number>(1);
  const [tarjetaNombre, setTarjetaNombre] = useState<string>('Visa Santander');
  const [primerMesCuota, setPrimerMesCuota] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [fechaPrimerPago, setFechaPrimerPago] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(10);
    return d.toISOString().split('T')[0];
  });
  const [showSchedulePreview, setShowSchedulePreview] = useState<boolean>(false);
  const [calcMode, setCalcMode] = useState<'total' | 'por_cuota'>('total');
  const [montoPorCuotaInput, setMontoPorCuotaInput] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      const isInc = editingTransaction.tipoTransaccion === 'ingreso';
      setTipoTransaccion(isInc ? 'ingreso' : 'gasto');
      setTipo(editingTransaction.tipo || (isInc ? 'individual' : 'pareja'));
      setConcepto(editingTransaction.concepto || '');
      setDescripcion(editingTransaction.descripcion || '');
      setMonto(editingTransaction.monto ? editingTransaction.monto.toString() : '');
      setCategoria(editingTransaction.categoria || (isInc ? 'Ingresos' : (Object.keys(categoryMap)[0] || 'Alimentación')));
      setSubcategoria(editingTransaction.subcategoria || '');
      setFecha(editingTransaction.fecha || new Date().toISOString().split('T')[0]);
      setPagadoPor((editingTransaction.pagadoPor as any) || profile.currentUser);
      setSplitType(editingTransaction.splitType || '50_50');
      setUser1Percent(editingTransaction.user1Percent ?? 50);
      setUser2Percent(editingTransaction.user2Percent ?? 50);
      setMetodoPago(editingTransaction.metodoPago || (isInc ? 'Transferencia' : 'Débito'));
      
      const hasCuotas = Boolean(editingTransaction.esCuotas || (editingTransaction.cuotasTotal && editingTransaction.cuotasTotal > 1));
      setEsCuotas(hasCuotas);
      setCuotasTotal(editingTransaction.cuotasTotal || 3);
      setCuotaActual(editingTransaction.cuotaActual || 1);
      setTarjetaNombre(editingTransaction.tarjetaNombre || 'Visa Santander');
      
      const txFecha = editingTransaction.fecha || new Date().toISOString().split('T')[0];
      const initialFirstPay = editingTransaction.fechaPrimerPago || (() => {
        if (editingTransaction.primerMesCuota) {
          return `${editingTransaction.primerMesCuota}-10`;
        }
        const d = new Date(txFecha);
        d.setMonth(d.getMonth() + 1);
        d.setDate(10);
        return d.toISOString().split('T')[0];
      })();
      setFechaPrimerPago(initialFirstPay);
      setPrimerMesCuota(initialFirstPay.substring(0, 7));
      
      if (editingTransaction.montoCuota) {
        setMontoPorCuotaInput(editingTransaction.montoCuota.toString());
      } else if (editingTransaction.monto && editingTransaction.cuotasTotal) {
        setMontoPorCuotaInput((editingTransaction.monto / editingTransaction.cuotasTotal).toFixed(2));
      }
    } else {
      const mode = initialTransactionType || 'gasto';
      setTipoTransaccion(mode);
      setTipo(mode === 'ingreso' ? 'individual' : 'pareja');
      setConcepto(mode === 'ingreso' ? 'Sueldo' : '');
      setDescripcion('');
      setMonto('');
      const firstCat = Object.keys(categoryMap)[0] || 'Alimentación';
      setCategoria(mode === 'ingreso' ? 'Ingresos' : firstCat);
      setSubcategoria(mode === 'ingreso' ? 'Sueldo' : (categoryMap[firstCat]?.[0] || ''));
      const todayStr = new Date().toISOString().split('T')[0];
      setFecha(todayStr);
      setPagadoPor(profile.currentUser || 'user1');
      setSplitType('50_50');
      setUser1Percent(50);
      setUser2Percent(50);

      const nextMonthPay = new Date();
      nextMonthPay.setMonth(nextMonthPay.getMonth() + 1);
      nextMonthPay.setDate(10);
      const defaultFirstPay = nextMonthPay.toISOString().split('T')[0];

      if (initialIsCuotas && mode === 'gasto') {
        setMetodoPago('Crédito');
        setEsCuotas(true);
        setCuotasTotal(6);
        setCuotaActual(1);
      } else {
        setMetodoPago(mode === 'ingreso' ? 'Transferencia' : 'Débito');
        setEsCuotas(false);
        setCuotasTotal(3);
        setCuotaActual(1);
      }
      setTarjetaNombre('Visa Santander');
      setFechaPrimerPago(defaultFirstPay);
      setPrimerMesCuota(defaultFirstPay.substring(0, 7));
      setMontoPorCuotaInput('');
    }
  }, [editingTransaction, isOpen, categoryMap, profile, initialIsCuotas, initialTransactionType]);

  const handleCategoryChange = (newCat: string) => {
    setCategoria(newCat);
    const availableSubs = categoryMap[newCat] || [];
    setSubcategoria(availableSubs[0] || '');
  };

  const handlePercent1Change = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setUser1Percent(clamped);
    setUser2Percent(100 - clamped);
  };

  const handleMetodoPagoChange = (method: PaymentMethod) => {
    setMetodoPago(method);
    if (method === 'Crédito' && tipoTransaccion === 'gasto') {
      setEsCuotas(true);
    }
  };

  const handleTotalMontoChange = (val: string) => {
    setMonto(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && cuotasTotal > 0) {
      setMontoPorCuotaInput((num / cuotasTotal).toFixed(2));
    }
  };

  const handleMontoPorCuotaChange = (val: string) => {
    setMontoPorCuotaInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && cuotasTotal > 0) {
      setMonto((num * cuotasTotal).toFixed(2));
    }
  };

  const handleCuotasTotalChange = (n: number) => {
    const validN = Math.max(1, n);
    setCuotasTotal(validN);
    if (cuotaActual > validN) {
      setCuotaActual(validN);
    }
    const numTotal = parseFloat(monto);
    if (!isNaN(numTotal) && numTotal > 0) {
      setMontoPorCuotaInput((numTotal / validN).toFixed(2));
    }
  };

  const calculatedMontoCuota = () => {
    const numMonto = parseFloat(monto);
    if (isNaN(numMonto) || numMonto <= 0 || cuotasTotal <= 0) return 0;
    return numMonto / cuotasTotal;
  };

  const installmentSchedule = useMemo(() => {
    if (!esCuotas || cuotasTotal <= 0 || tipoTransaccion === 'ingreso') return [];
    const list = [];
    const cuotaMonto = calculatedMontoCuota();
    
    const [yStr, mStr, dStr] = (fechaPrimerPago || new Date().toISOString().split('T')[0]).split('-');
    const baseYear = parseInt(yStr) || new Date().getFullYear();
    const baseMonth = (parseInt(mStr) || (new Date().getMonth() + 1)) - 1;
    const baseDay = parseInt(dStr) || 10;

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 0; i < cuotasTotal; i++) {
      const quotaNum = i + 1;
      const targetDate = new Date(baseYear, baseMonth + i, baseDay);
      const isPaid = quotaNum <= cuotaActual;
      list.push({
        num: quotaNum,
        dateFormatted: `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`,
        monthKey: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`,
        monto: cuotaMonto,
        isPaid,
        isCurrent: quotaNum === cuotaActual + 1,
      });
    }
    return list;
  }, [esCuotas, cuotasTotal, cuotaActual, fechaPrimerPago, monto, montoPorCuotaInput, tipoTransaccion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = parseFloat(monto);
    if (!concepto.trim() || isNaN(numMonto) || numMonto <= 0) {
      return;
    }

    if (tipoTransaccion === 'ingreso') {
      onSave({
        id: editingTransaction ? editingTransaction.id : undefined,
        concepto: concepto.trim(),
        descripcion: descripcion.trim() || undefined,
        monto: numMonto,
        moneda: profile.currency || 'ARS',
        categoria: 'Ingresos',
        subcategoria: subcategoria || concepto.trim(),
        fecha: fecha || new Date().toISOString().split('T')[0],
        tipo,
        tipoTransaccion: 'ingreso',
        pagadoPor, // Quién cobró o recibió el dinero
        metodoPago: metodoPago || 'Transferencia',
      });
      return;
    }

    // Expense submit
    const isInstallmentActive = esCuotas && (cuotasTotal > 1 || metodoPago === 'Crédito');
    const finalMontoCuota = isInstallmentActive 
      ? (parseFloat(montoPorCuotaInput) || numMonto / (cuotasTotal || 1))
      : undefined;

    onSave({
      id: editingTransaction ? editingTransaction.id : undefined,
      concepto: concepto.trim(),
      descripcion: descripcion.trim(),
      monto: numMonto,
      moneda: profile.currency || 'ARS',
      categoria: categoria || Object.keys(categoryMap)[0] || 'Alimentación',
      subcategoria: subcategoria || categoryMap[categoria]?.[0] || 'General',
      fecha: fecha || new Date().toISOString().split('T')[0],
      tipo,
      tipoTransaccion: 'gasto',
      pagadoPor,
      splitType: tipo === 'pareja' ? splitType : undefined,
      user1Percent: tipo === 'pareja' && splitType === 'custom_percent' ? user1Percent : undefined,
      user2Percent: tipo === 'pareja' && splitType === 'custom_percent' ? user2Percent : undefined,
      metodoPago: isInstallmentActive ? 'Crédito' : metodoPago,
      esCuotas: isInstallmentActive,
      cuotasTotal: isInstallmentActive ? cuotasTotal : undefined,
      cuotaActual: isInstallmentActive ? cuotaActual : undefined,
      montoCuota: finalMontoCuota,
      tarjetaNombre: isInstallmentActive ? tarjetaNombre.trim() : undefined,
      primerMesCuota: isInstallmentActive ? (fechaPrimerPago ? fechaPrimerPago.substring(0, 7) : primerMesCuota) : undefined,
      fechaPrimerPago: isInstallmentActive ? fechaPrimerPago : undefined,
    });
  };

  if (!isOpen) return null;

  const isIncome = tipoTransaccion === 'ingreso';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className={`p-4 sm:p-5 flex items-center justify-between shrink-0 transition-colors duration-200 text-white ${
          isIncome 
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700' 
            : 'bg-slate-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
              isIncome ? 'bg-emerald-500/80 border border-white/20' : (esCuotas ? 'bg-indigo-600' : 'bg-[#0070f3]')
            }`}>
              {isIncome ? (
                <TrendingUp className="w-5 h-5" />
              ) : esCuotas ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {editingTransaction 
                  ? (isIncome ? 'Editar Ingreso' : 'Editar Gasto')
                  : (isIncome ? 'Registrar Nuevo Ingreso' : (esCuotas ? 'Registrar Compra en Cuotas' : 'Registrar Nuevo Gasto'))}
              </h3>
              <p className="text-[11px] text-white/80">
                {isIncome 
                  ? 'Registra sueldos, cobros, ventas o transferencias' 
                  : (tipo === 'pareja' ? 'Gasto compartido en pareja' : 'Gasto individual personal') + (esCuotas ? ' • En Cuotas' : '')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg transition-colors hover:bg-white/10"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          
          {/* PRIMARY SWITCHER: GASTO vs INGRESO */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ¿Qué deseas registrar? *
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setTipoTransaccion('gasto');
                  if (categoria === 'Ingresos') {
                    const first = Object.keys(categoryMap)[0] || 'Alimentación';
                    setCategoria(first);
                    setSubcategoria(categoryMap[first]?.[0] || '');
                  }
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  !isIncome
                    ? 'bg-[#0070f3] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>💸 Gasto / Compra</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoTransaccion('ingreso');
                  setCategoria('Ingresos');
                  setSubcategoria('Sueldo');
                  if (!concepto || concepto === 'Supermercado') setConcepto('Sueldo');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isIncome
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>💰 Ingreso / Cobro</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INGRESO MODE FIELDS */}
          {/* ========================================================================= */}
          {isIncome ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Quick Income Category Presets */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Tipo de Ingreso Rápido
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {INCOME_PRESETS.map((preset) => {
                    const isSelected = concepto === preset.label || subcategoria === preset.subcategory;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setConcepto(preset.label);
                          setSubcategoria(preset.subcategory);
                        }}
                        className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-400 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{preset.icon}</span>
                        <span className="truncate">{preset.label.split(' / ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Concepto & Monto */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Concepto / Empresa / Pagador *
                  </label>
                  <input
                    type="text"
                    required
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Ej: Sueldo Empresa, Cliente Freelance, Venta..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto Recibido ({profile.currency || 'ARS'}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-3 pr-9 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">
                      {profile.currency || '$'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Who received the income */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>¿Quién recibió o cobró este ingreso? *</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPagadoPor('user1')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      pagadoPor === 'user1'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{profile.user1Name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPagadoPor('user2')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      pagadoPor === 'user2'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{profile.user2Name}</span>
                  </button>
                </div>
              </div>

              {/* Income Scope: Individual vs Fondo Común / Pareja */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Destino del Ingreso
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTipo('individual')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      tipo === 'individual'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Ingreso Propio / Individual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('pareja')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      tipo === 'pareja'
                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Fondo Común Pareja</span>
                  </button>
                </div>
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medio de Cobro
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Mercado Pago">Mercado Pago / Billetera</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Débito">Depósito en Cuenta</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Acreditación
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nota o Detalle Adicional (Opcional)
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Cobro de factura 004, bono por desempeño..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* GASTO MODE FIELDS */
            /* ========================================================================= */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Mode Switcher (Individual vs Pareja) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ámbito del Gasto *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTipo('individual')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      tipo === 'individual'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Gasto Individual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipo('pareja')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      tipo === 'pareja'
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>En Pareja (Compartido)</span>
                  </button>
                </div>
              </div>

              {/* Concepto & Monto */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Concepto / Comercio *
                  </label>
                  <input
                    type="text"
                    required
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Ej: Smart TV, Supermercado, Zapatillas..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto Total ({profile.currency || 'ARS'}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={monto}
                      onChange={(e) => handleTotalMontoChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {profile.currency || '$'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method & Cuotas Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Método de Pago
                    </label>
                    <p className="text-[11px] text-slate-400">Forma de pago utilizada</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={metodoPago}
                      onChange={(e) => handleMetodoPagoChange(e.target.value as PaymentMethod)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Débito">Tarjeta de Débito</option>
                      <option value="Crédito">Tarjeta de Crédito</option>
                      <option value="Mercado Pago">Mercado Pago / Billetera</option>
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Otro">Otro</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !esCuotas;
                        setEsCuotas(next);
                        if (next && metodoPago !== 'Crédito') {
                          setMetodoPago('Crédito');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        esCuotas
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{esCuotas ? 'En Cuotas (Activo)' : '¿En Cuotas?'}</span>
                    </button>
                  </div>
                </div>

                {/* EXPANDED CUOTAS CONFIGURATION PANEL */}
                {esCuotas && (
                  <div className="pt-3 border-t border-slate-200 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Configuración de Plan en Cuotas</span>
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        Tarjeta de Crédito
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <BankCardSelect
                        value={tarjetaNombre}
                        onChange={setTarjetaNombre}
                        label="Tarjeta / Banco Emisor (Argentina)"
                        showQuickChips={true}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Cantidad de Cuotas *
                        </label>
                        <span className="text-xs font-bold text-indigo-600">
                          {cuotasTotal} cuota{cuotasTotal > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_INSTALLMENTS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => handleCuotasTotalChange(n)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              cuotasTotal === n
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {n} {n === 1 ? 'pago' : 'cuotas'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Valor por Cuota ({profile.currency || 'ARS'})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={montoPorCuotaInput || (monto && cuotasTotal ? (parseFloat(monto) / cuotasTotal).toFixed(2) : '')}
                          onChange={(e) => handleMontoPorCuotaChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Vencimiento / Primer Resumen
                        </label>
                        <input
                          type="date"
                          value={fechaPrimerPago}
                          onChange={(e) => {
                            setFechaPrimerPago(e.target.value);
                            setPrimerMesCuota(e.target.value.substring(0, 7));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción / Detalle (Opcional)
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Cuotas sin interés, supermercado mensual..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    {Object.keys(categoryMap).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subcategoría *
                  </label>
                  <select
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    {(categoryMap[categoria] || []).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Pareja Fields: Pagado Por & Split Ratio */}
              {tipo === 'pareja' && (
                <div className="p-3.5 bg-pink-50/70 border border-pink-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-pink-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-pink-600" />
                      <span>¿Quién es el titular o pagó con su tarjeta?</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPagadoPor('user1')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        pagadoPor === 'user1'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{profile.user1Name}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPagadoPor('user2')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        pagadoPor === 'user2'
                          ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{profile.user2Name}</span>
                    </button>
                  </div>

                  {/* Division Options */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      División del gasto entre ambos:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setSplitType('50_50')}
                        className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                          splitType === '50_50'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        50 / 50 (Mitad)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('60_40')}
                        className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                          splitType === '60_40'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        60 / 40
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('70_30')}
                        className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                          splitType === '70_30'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        70 / 30
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('100_user1')}
                        className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                          splitType === '100_user1'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        100% {profile.user1Name}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('100_user2')}
                        className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                          splitType === '100_user2'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        100% {profile.user2Name}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('custom_percent')}
                        className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                          splitType === 'custom_percent'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Personalizado %
                      </button>
                    </div>

                    {splitType === 'custom_percent' && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 mt-2">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>{profile.user1Name}: {user1Percent}%</span>
                          <span>{profile.user2Name}: {user2Percent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={user1Percent}
                          onChange={(e) => handlePercent1Change(parseInt(e.target.value))}
                          className="w-full accent-pink-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Individual mode */}
              {tipo === 'individual' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>¿De quién es este gasto individual?</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPagadoPor('user1')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        pagadoPor === 'user1'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {profile.user1Name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPagadoPor('user2')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        pagadoPor === 'user2'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {profile.user2Name}
                    </button>
                  </div>
                </div>
              )}

              {/* Date of purchase */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${
                isIncome 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25' 
                  : 'bg-[#0070f3] hover:bg-[#0060df] shadow-blue-500/25'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {editingTransaction 
                  ? 'Guardar Cambios' 
                  : (isIncome ? 'Registrar Ingreso' : (esCuotas ? 'Registrar Compra en Cuotas' : 'Registrar Gasto'))}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
