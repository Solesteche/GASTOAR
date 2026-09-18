import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  RotateCw, 
  CreditCard,
  Users,
  Mic,
  CalendarClock
} from 'lucide-react';
import { BillingCycle, SubscriptionPlan } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../data/subscriptionPlans';
import { formatCurrency } from '../../utils/formatters';

interface MobileSubscriptionScreenProps {
  onBack?: () => void;
  onSelectPlanPayment?: (plan: SubscriptionPlan, cycle: BillingCycle) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const MobileSubscriptionScreen: React.FC<MobileSubscriptionScreenProps> = ({
  onBack,
  onSelectPlanPayment,
  onShowToast
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [selectedPlanId, setSelectedPlanId] = useState<'basic' | 'premium'>('premium');

  const proPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'pareja') || {
    id: 'pareja',
    name: 'GastoAr PRO Ilimitado',
    priceMonthly: 2999,
    priceYearly: 26990,
    features: [
      'Tarjetas y cuotas ilimitadas',
      'Alertas de vencimientos anticipadas',
      'Carga de gastos por voz con Inteligencia Artificial',
      'Sincronización en pareja en tiempo real',
      'Copia de seguridad cifrada en la nube'
    ]
  };

  const handleContinue = () => {
    if (selectedPlanId === 'basic') {
      if (onShowToast) onShowToast('Ya estás utilizando el plan Básico Gratuito.', 'info');
      if (onBack) onBack();
      return;
    }

    if (onSelectPlanPayment) {
      onSelectPlanPayment(proPlan as any, billingCycle);
    } else {
      if (onShowToast) onShowToast('Iniciando suscripción a GastoAr PRO...', 'success');
    }
  };

  const handleRestore = () => {
    if (onShowToast) {
      onShowToast('Comprobando compras previas en tu cuenta...', 'info');
      setTimeout(() => {
        onShowToast('No se encontraron suscripciones previas pendientes.', 'info');
      }, 1000);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-white text-slate-800 flex flex-col justify-between p-5 sm:p-6 select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}

          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Pantalla 8 · Suscripción PRO
          </span>

          <div className="w-9 h-9" />
        </div>

        {/* Hero Crown & Title (Matching Screen 8) */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 text-slate-900 shadow-xl shadow-amber-500/25 flex items-center justify-center mx-auto">
            <Crown className="w-7 h-7 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Actualizá a <span className="text-[#7928CA]">Gasto</span><span className="text-[#F95420]">Ar PRO</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Desbloqueá todas las funciones premium y tomá el control total de tu dinero.
          </p>
        </div>

        {/* Billing Cycle Selector Pill (Monthly vs Yearly) */}
        <div className="flex justify-center pt-1">
          <div className="p-1 rounded-2xl bg-slate-100 flex items-center gap-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mensual
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                -25%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards (Basic vs Premium) */}
        <div className="space-y-2.5 pt-1">
          {/* 1. Basic Plan Card */}
          <div
            onClick={() => setSelectedPlanId('basic')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedPlanId === 'basic'
                ? 'border-[#7928CA] bg-purple-50/50 ring-2 ring-purple-100'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Plan Básico</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  Gratuito
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                1 tarjeta, sin sincronización en tiempo real
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-700">$0 / mes</span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedPlanId === 'basic' ? 'border-[#7928CA] bg-[#7928CA]' : 'border-slate-300'
              }`}>
                {selectedPlanId === 'basic' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
          </div>

          {/* 2. Premium / PRO Plan Card (Highlighted) */}
          <div
            onClick={() => setSelectedPlanId('premium')}
            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative ${
              selectedPlanId === 'premium'
                ? 'border-[#7928CA] bg-gradient-to-tr from-purple-50/70 via-white to-orange-50/40 shadow-lg shadow-purple-500/10'
                : 'border-slate-200 bg-white hover:border-purple-200'
            }`}
          >
            <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-[#7928CA] to-[#F95420] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
              Recomendado
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-purple-100/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">GastoAr PRO</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-xs text-slate-500">
                  {billingCycle === 'yearly' ? 'Facturado anualmente ($26.990)' : 'Facturado mensualmente'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-sm font-black text-[#7928CA]">
                    {billingCycle === 'yearly' ? '$2.249' : '$2.999'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">/ mes</span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedPlanId === 'premium' ? 'border-[#7928CA] bg-[#7928CA]' : 'border-slate-300'
                }`}>
                  {selectedPlanId === 'premium' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </div>

            {/* Features checkmarks list */}
            <div className="pt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Tarjetas, cuotas y categorías <strong>ilimitadas</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Carga por voz con Inteligencia Artificial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Alertas de vencimientos con anticipación personalizada</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Modo Pareja con sincronización en tiempo real</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA & Restore */}
      <div className="pt-4 space-y-2.5 border-t border-slate-100">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7928CA] via-[#8E28DE] to-[#F95420] hover:opacity-95 text-white text-sm font-bold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>{selectedPlanId === 'premium' ? 'Continuar con PRO' : 'Continuar con Básico'}</span>
        </button>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
          <button
            type="button"
            onClick={handleRestore}
            className="hover:text-slate-600 cursor-pointer"
          >
            Restaurar compra
          </button>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Cancelá en cualquier momento
          </span>
        </div>
      </div>
    </div>
  );
};
