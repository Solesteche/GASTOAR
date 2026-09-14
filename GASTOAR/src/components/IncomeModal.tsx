import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  User, 
  Users, 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Sparkles, 
  Coins,
  ArrowDownLeft,
  Plus
} from 'lucide-react';
import { CoupleProfile, Transaction } from '../types';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Partial<Transaction>) => void;
  profile: CoupleProfile;
}

const INCOME_PRESETS = [
  { label: 'Sueldo / Salario', category: 'Ingresos', subcategory: 'Sueldo', icon: '💼' },
  { label: 'Honorarios / Freelance', category: 'Ingresos', subcategory: 'Honorarios', icon: '💻' },
  { label: 'Venta / Emprendimiento', category: 'Ingresos', subcategory: 'Ventas', icon: '🛍️' },
  { label: 'Inversiones / Rendimientos', category: 'Ingresos', subcategory: 'Inversiones', icon: '📈' },
  { label: 'Aguinaldo / Bono', category: 'Ingresos', subcategory: 'Bono', icon: '🎁' },
  { label: 'Reintegro / Devolución', category: 'Ingresos', subcategory: 'Reintegro', icon: '🔄' },
  { label: 'Otro Ingreso', category: 'Ingresos', subcategory: 'Varios', icon: '💰' },
];

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profile,
}) => {
  const [concepto, setConcepto] = useState<string>('Sueldo');
  const [monto, setMonto] = useState<string>('');
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [destinatario, setDestinatario] = useState<'user1' | 'user2'>(profile.currentUser || 'user1');
  const [tipo, setTipo] = useState<'individual' | 'pareja'>('individual');
  const [notas, setNotas] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = parseFloat(monto);
    if (!concepto.trim() || isNaN(numMonto) || numMonto <= 0) {
      return;
    }

    onSave({
      concepto: concepto.trim(),
      descripcion: notas.trim() || undefined,
      monto: numMonto,
      moneda: profile.currency || 'ARS',
      categoria: 'Ingresos',
      subcategoria: concepto.trim(),
      fecha: fecha || new Date().toISOString().split('T')[0],
      tipo,
      tipoTransaccion: 'ingreso',
      pagadoPor: destinatario,
      metodoPago: 'Transferencia',
    });

    onClose();
  };

  const handleSelectPreset = (preset: typeof INCOME_PRESETS[0]) => {
    setConcepto(preset.label);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Ingresar Ingreso</h2>
              <p className="text-xs text-emerald-100">Registra sueldos, cobros o entradas de dinero</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Tipo de Ingreso Frecuente
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INCOME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                    concepto === preset.label
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Monto del Ingreso ({profile.currency || 'ARS'})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Concept input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Concepto / Título
            </label>
            <input
              type="text"
              required
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="ej. Sueldo Mensual, Honorarios Proyecto, etc."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Destination & Mode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Who received it */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                ¿Quién lo percibe?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDestinatario('user1')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    destinatario === 'user1'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {profile.user1Name}
                </button>
                <button
                  type="button"
                  onClick={() => setDestinatario('user2')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    destinatario === 'user2'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {profile.user2Name}
                </button>
              </div>
            </div>

            {/* Scope: Individual or Pareja (Fondo común) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Destino
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('individual')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    tipo === 'individual'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
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
                      ? 'bg-pink-600 border-pink-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Fondo Pareja
                </button>
              </div>
            </div>

          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Fecha de Cobro / Depósito
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Notas o Detalles (Opcional)
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="ej. Cobro quincenal, cliente ABC, etc."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Ingreso</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
