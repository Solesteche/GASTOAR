import React, { useState } from 'react';
import { 
  BadgePercent, 
  Check, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  User, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight, 
  ExternalLink,
  Zap,
  Users
} from 'lucide-react';
import { BillingCycle, CoupleProfile, SubscriptionPlan, SubscriptionPlanId, UserAccount, UserSubscription } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { formatCurrency, formatDateEs } from '../utils/formatters';
import { MercadoPagoModal } from './MercadoPagoModal';

interface SubscriptionsViewProps {
  userAccount: UserAccount | null;
  profile: CoupleProfile;
  currentSubscription?: UserSubscription | null;
  onSelectPlanPayment: (plan: SubscriptionPlan, cycle: BillingCycle) => void;
  onOpenAdminPanel?: () => void;
  onOpenCardAlerts?: () => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  userAccount,
  profile,
  currentSubscription,
  onSelectPlanPayment,
  onOpenAdminPanel,
  onOpenCardAlerts,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const [isMpModalOpen, setIsMpModalOpen] = useState<boolean>(false);

  const activePlanId: SubscriptionPlanId = currentSubscription?.planId || 'pareja';

  const handleOpenMpModal = (plan: SubscriptionPlan) => {
    setSelectedPlanForPayment(plan);
    setIsMpModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#009EE3]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#009EE3]/20 border border-[#009EE3]/40 text-[#009EE3] text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Suscripción Oficial Mercado Pago</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Gestioná tu Plan de GastoAR
            </h2>

            <p className="text-xs sm:text-sm text-slate-300">
              Desbloqueá sincronización automática en pareja, control ilimitado de cuotas de tarjetas y escaneo inteligente de comprobantes con IA.
            </p>
          </div>

          {/* Current Plan Badge Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0 space-y-2 min-w-[240px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Tu Estado de Cuenta:
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white">
                {currentSubscription ? currentSubscription.planName : 'Plan Parejas Dúo'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-white text-[10px] font-extrabold uppercase ${
                currentSubscription?.status === 'trial' ? 'bg-purple-500' : 'bg-emerald-500'
              }`}>
                {currentSubscription?.status === 'trial' ? 'En Prueba' : 'Activo'}
              </span>
            </div>
            {currentSubscription && (
              <div className="text-[11px] text-sky-200">
                {currentSubscription.status === 'trial' ? (
                  <span className="flex items-center gap-1 text-purple-200 font-bold">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Vencimiento de prueba: {formatDateEs(currentSubscription.nextRenewalDate)}
                  </span>
                ) : (
                  <span>Próxima renovación: {formatDateEs(currentSubscription.nextRenewalDate)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Free Trial Banner Notice */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 rounded-2xl p-4 border border-purple-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-purple-900">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-[#2E0854]">15 Días de Prueba Gratis Incluidos</span>
            <p className="text-purple-700 mt-0.5">
              Todos los nuevos usuarios acceden a 15 días de prueba completos. Al finalizar el período, podés abonar con Mercado Pago para desbloquear todas las funciones.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Toggle */}
      <div className="text-center space-y-3">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Nuestros 3 Planes de Suscripción
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Seleccioná tu plan y aboná al instante con dinero en cuenta, tarjetas o transferencia mediante Mercado Pago.
        </p>

        {/* Toggle */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>
            Facturación Mensual
          </span>

          <button
            type="button"
            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
            className="w-14 h-7 rounded-full bg-slate-200 p-1 flex items-center transition-colors relative focus:outline-none"
          >
            <div
              className={`w-5 h-5 rounded-full bg-[#009EE3] transition-transform duration-200 shadow-md ${
                billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>

          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400'}`}>
              Facturación Anual
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wide border border-emerald-200">
              🔥 Ahorrá 34%
            </span>
          </div>
        </div>
      </div>

      {/* 3 PLAN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = activePlanId === plan.id;
          const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
          const monthlyEquiv = billingCycle === 'annual' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative bg-white border ${
                plan.isPopular
                  ? 'border-[#009EE3] ring-2 ring-[#009EE3]/30 shadow-xl shadow-[#009EE3]/10'
                  : plan.isPro
                  ? 'border-indigo-300 shadow-lg shadow-indigo-100'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className={`px-3.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-md ${
                    plan.isPopular
                      ? 'bg-[#009EE3] text-white'
                      : plan.isPro
                      ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    {plan.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                    {plan.tagline}
                  </p>
                </div>

                <div className="py-2 border-y border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">
                      {formatCurrency(price, 'ARS')}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {billingCycle === 'annual' ? '/año' : '/mes'}
                    </span>
                  </div>

                  {billingCycle === 'annual' && (
                    <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" />
                      <span>Equivale a {formatCurrency(monthlyEquiv, 'ARS')}/mes</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 pt-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${
                        plan.isPopular ? 'bg-sky-100 text-[#009EE3]' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 space-y-2">
                {isCurrent ? (
                  <div className="w-full py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Plan Actual Activo</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenMpModal(plan)}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md cursor-pointer ${
                      plan.isPopular
                        ? 'bg-[#009EE3] hover:bg-[#0089C7] text-white shadow-[#009EE3]/30'
                        : plan.isPro
                        ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-indigo-500/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Cambiar / Pagar con MP</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Mercado Pago Modal */}
      <MercadoPagoModal
        isOpen={isMpModalOpen}
        onClose={() => setIsMpModalOpen(false)}
        plan={selectedPlanForPayment}
        billingCycle={billingCycle}
        userEmail={userAccount?.email || 'estechesol@gmail.com'}
        userName={userAccount?.name || profile.user1Name}
        accountCode={profile.accountCode}
        onPaymentSuccess={(details) => {
          onSelectPlanPayment(selectedPlanForPayment!, billingCycle);
        }}
      />

    </div>
  );
};
