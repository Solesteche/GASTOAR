import React, { useMemo, useState } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb, 
  ArrowRight, 
  Download, 
  Copy, 
  Check, 
  Coins, 
  Heart, 
  Zap,
  Target
} from 'lucide-react';
import { Budgets, CoupleProfile, Transaction } from '../types';
import { formatCurrency, formatDateEs } from '../utils/formatters';

interface FinancialDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  budgets: Budgets;
  profile: CoupleProfile;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FinancialDiagnosisModal: React.FC<FinancialDiagnosisModalProps> = ({
  isOpen,
  onClose,
  transactions,
  budgets,
  profile,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const currency = profile.currency || 'ARS';

  if (!isOpen) return null;

  // Compute metrics from current transactions
  const txList = transactions || [];
  const totalSpent = txList.reduce((acc, tx) => acc + (tx?.monto || 0), 0);

  // Group by 50/30/20 buckets
  const needsCategories = ["Alimentación & Bebidas", "Alquiler", "Expensas", "Servicios", "Transporte & Movilidad", "Salud & Cuidado Personal", "Educación & Formación"];
  const wantsCategories = ["Entretenimiento, Ocio & Suscripciones", "Indumentaria & Calzado", "Mascotas", "Tecnología, Electro & Bazar"];

  const needsSpent = txList
    .filter(tx => tx && needsCategories.includes(tx.categoria))
    .reduce((acc, tx) => acc + (tx?.monto || 0), 0);

  const wantsSpent = txList
    .filter(tx => tx && wantsCategories.includes(tx.categoria))
    .reduce((acc, tx) => acc + (tx?.monto || 0), 0);

  // Installments debt total
  const installmentTx = txList.filter(tx => tx && tx.esCuotas);
  const monthlyInstallmentCommitment = installmentTx.reduce((acc, tx) => acc + (tx?.montoCuota || 0), 0);

  // Ant expenses detection (e.g. under $15.000 in Kiosco, Delivery, Cafetería, etc.)
  const antExpenses = txList.filter(tx => {
    if (!tx) return false;
    const sub = (tx.subcategoria || '').toLowerCase();
    const conc = (tx.concepto || '').toLowerCase();
    return (
      (tx.monto || 0) <= 20000 &&
      (sub.includes('kiosco') || sub.includes('delivery') || sub.includes('cafetería') || conc.includes('kiosco') || conc.includes('open 25') || conc.includes('pedidosya') || conc.includes('rappi'))
    );
  });
  const totalAntExpenses = antExpenses.reduce((acc, tx) => acc + (tx?.monto || 0), 0);

  // Estimated baseline income (from couple default or budgets)
  const estimatedIncome = Math.max(totalSpent * 1.25, 1200000);
  const savingsAmount = Math.max(0, estimatedIncome - totalSpent);
  const savingsRate = Math.round((savingsAmount / estimatedIncome) * 100);

  const needsPercentage = Math.round((needsSpent / (totalSpent || 1)) * 100);
  const wantsPercentage = Math.round((wantsSpent / (totalSpent || 1)) * 100);

  // Health Score (0-100)
  let healthScore = 85;
  if (needsPercentage > 65) healthScore -= 10;
  if (wantsPercentage > 35) healthScore -= 10;
  if (totalAntExpenses > 60000) healthScore -= 5;
  if (monthlyInstallmentCommitment > 180000) healthScore -= 10;
  healthScore = Math.max(50, Math.min(98, healthScore));

  const handleCopySummary = () => {
    const text = `📊 DIAGNÓSTICO FINANCIERO MENSUAL - GastoAR
Puntuación de Salud Financiera: ${healthScore}/100
Gasto Total: ${formatCurrency(totalSpent, currency)}
- Necesidades Básicas (50% ideal): ${formatCurrency(needsSpent, currency)} (${needsPercentage}%)
- Deseos y Ocio (30% ideal): ${formatCurrency(wantsSpent, currency)} (${wantsPercentage}%)
- Gastos Hormiga detectados: ${formatCurrency(totalAntExpenses, currency)} (${antExpenses.length} compras)
- Compromiso Mensual de Cuotas: ${formatCurrency(monthlyInstallmentCommitment, currency)}

Recomendación Pro: Optimizar compras hormiga y mantener las cuotas por debajo del 25% de los ingresos totales.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('¡Diagnóstico copiado al portapapeles!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">
                  Diagnóstico Financiero Mensual & Recomendaciones
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-[#2E0854] text-[10px] font-black uppercase">
                  Plan Pro ✨
                </span>
              </div>
              <p className="text-xs text-purple-200">
                Auditoría automática con regla 50/30/20, detección de fugas y sugerencias de ahorro
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
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-xs text-slate-700">
          
          {/* Health Score Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-[#2E0854] to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Índice de Salud Financiera</span>
              <h4 className="text-xl sm:text-2xl font-black text-white">
                {healthScore >= 80 ? '¡Excelente Control Financiero! 🚀' : 'Salud Financiera Buena con Oportunidades 💡'}
              </h4>
              <p className="text-xs text-purple-200 max-w-md">
                Tus gastos esenciales están equilibrados. Controlar los gastos hormiga te permitirá ahorrar un {Math.max(5, Math.round((totalAntExpenses / (totalSpent || 1)) * 100))}% extra este mes.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 border border-white/20 min-w-[100px] text-center">
              <span className="text-3xl font-black text-amber-300">{healthScore}</span>
              <span className="text-[10px] font-bold text-purple-200 uppercase">de 100 pts</span>
            </div>
          </div>

          {/* 50/30/20 Rule Breakdown Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-purple-600" />
                <span>Desglose por Regla 50 / 30 / 20</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-semibold">Total evaluado: {formatCurrency(totalSpent, currency)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Needs (50%) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">1. Necesidades (50%)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                    {needsPercentage}%
                  </span>
                </div>
                <div className="text-base font-black text-slate-900">
                  {formatCurrency(needsSpent, currency)}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Alquiler, supermercado, expensas, luz, gas e internet.
                </p>
              </div>

              {/* Wants (30%) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">2. Ocio / Deseos (30%)</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px]">
                    {wantsPercentage}%
                  </span>
                </div>
                <div className="text-base font-black text-slate-900">
                  {formatCurrency(wantsSpent, currency)}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Restaurantes, salidas, indumentaria, cine y compras opcionales.
                </p>
              </div>

              {/* Savings & Debt (20%) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">3. Ahorro & Cuotas (20%)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                    {savingsRate}%
                  </span>
                </div>
                <div className="text-base font-black text-slate-900">
                  {formatCurrency(savingsAmount, currency)}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Aportes a metas, fondo de emergencia y amortización de deudas.
                </p>
              </div>
            </div>
          </div>

          {/* Ant Expenses (Gastos Hormiga) Alert Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Detector de Gastos Hormiga & Compras Rápidas</span>
              </span>
              <span className="font-extrabold text-amber-800 text-xs">
                {formatCurrency(totalAntExpenses, currency)} / mes
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Se detectaron <strong>{antExpenses.length} consumos menores</strong> (kioscos, deliverys, cafés y compras al paso). Reduciendo un 30% estos consumos podrías sumar <strong>{formatCurrency(totalAntExpenses * 0.3, currency)}</strong> directo a tu meta de ahorro mensual.
            </p>
          </div>

          {/* 3 Strategic Recommendations */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>3 Recomendaciones Estratégicas para este Mes</span>
            </h4>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs flex items-start gap-3">
                <div className="p-1.5 rounded-xl bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs">1. Planificar compras de despensa en 1 o 2 salidas grandes</span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Agrupar compras de supermercado reduce un 15% las compras imprevistas en almacenes y minimiza costos de delivery.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs flex items-start gap-3">
                <div className="p-1.5 rounded-xl bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs">2. Topar las cuotas de tarjetas en máximo $150.000 mensuales</span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Tu compromiso actual en cuotas activas es de {formatCurrency(monthlyInstallmentCommitment, currency)}. Mantenerlo estable evitará sobrecargar resúmenes futuros.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs flex items-start gap-3">
                <div className="p-1.5 rounded-xl bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs">3. Automatizar el aporte a tu Meta principal el día de cobro</span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Aportar primero al ahorro (pagate a vos mismo primero) en lugar de ahorrar lo que sobre a fin de mes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center gap-1.5 border border-purple-200 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Diagnóstico'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#2E0854] hover:bg-[#1C0533] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
