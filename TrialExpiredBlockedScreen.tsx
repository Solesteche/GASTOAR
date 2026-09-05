import React, { useState } from 'react';
import { 
  Lock, 
  Sparkles, 
  CreditCard, 
  Check, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  LogOut, 
  KeyRound, 
  MessageCircle, 
  Users, 
  Zap, 
  UserCheck 
} from 'lucide-react';
import { BillingCycle, SubscriptionPlan, SubscriptionPlanId, UserAccount, UserSubscription } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { formatCurrency, formatDateEs } from '../utils/formatters';
import { GastoArHeroBrand } from './GastoArLogo';
import { MercadoPagoModal } from './MercadoPagoModal';
import { AdminAuthModal } from './AdminAuthModal';

interface TrialExpiredBlockedScreenProps {
  userAccount: UserAccount | null;
  subscription?: UserSubscription | null;
  onSelectPlanPayment: (plan: SubscriptionPlan, cycle: BillingCycle) => void;
  onLogout: () => void;
  onOpenAdminPanel?: () => void;
}

export const TrialExpiredBlockedScreen: React.FC<TrialExpiredBlockedScreenProps> = ({
  userAccount,
  subscription,
  onSelectPlanPayment,
  onLogout,
  onOpenAdminPanel,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const [isMpModalOpen, setIsMpModalOpen] = useState<boolean>(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);

  const defaultPlanId: SubscriptionPlanId = subscription?.planId || (userAccount?.accountType === 'individual' ? 'individual' : 'pareja');

  const handleOpenPayment = (plan: SubscriptionPlan) => {
    setSelectedPlanForPayment(plan);
    setIsMpModalOpen(true);
  };

  const handlePaymentSuccess = (details: {
    planId: string;
    planName: string;
    billingCycle: BillingCycle;
    paymentId: string;
  }) => {
    setIsMpModalOpen(false);
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === details.planId) || SUBSCRIPTION_PLANS[1];
    onSelectPlanPayment(plan, details.billingCycle);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800/80">
        <GastoArHeroBrand />

        <div className="flex items-center gap-2">
          {onOpenAdminPanel && (
            <button
              type="button"
              onClick={() => setIsAdminAuthOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Acceso Admin</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-800/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Lock Content */}
      <div className="max-w-5xl w-full mx-auto my-auto py-8 space-y-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner of Expiration */}
        <div className="bg-gradient-to-r from-rose-950/80 via-purple-950/70 to-slate-900/90 rounded-3xl p-6 sm:p-8 border border-rose-500/30 shadow-2xl relative overflow-hidden text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Período de Prueba de 15 Días Finalizado</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight max-w-2xl mx-auto leading-tight">
            Activá tu suscripción para continuar disfrutando de <span className="text-[#F95420]">Gasto</span><span className="text-[#7928CA]">AR</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
            ¡Esperamos que hayas disfrutado tus primeros 15 días! Tus datos, presupuestos, compras en cuotas y balances de pareja siguen guardados de forma segura. Elegí tu plan para desbloquear tu cuenta de inmediato con Mercado Pago.
          </p>

          {subscription && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-xl text-xs text-slate-200 border border-white/10">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Prueba finalizada el: <strong>{formatDateEs(subscription.nextRenewalDate || subscription.trialEndsDate || '')}</strong></span>
            </div>
          )}
        </div>

        {/* Billing Cycle Switch */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Facturación Mensual
            </span>

            <button
              type="button"
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
              className="w-14 h-7 rounded-full bg-slate-800 border border-slate-700 p-1 flex items-center transition-colors relative focus:outline-none"
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#009EE3] transition-transform duration-200 shadow-md ${
                  billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>

            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>
                Facturación Anual
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-wide border border-emerald-500/40">
                🔥 Ahorrá 34%
              </span>
            </div>
          </div>
        </div>

        {/* 3 Subscription Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isPreferred = defaultPlanId === plan.id;
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            const monthlyEquiv = billingCycle === 'annual' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 relative bg-slate-900/90 border ${
                  plan.isPopular || isPreferred
                    ? 'border-[#009EE3] ring-2 ring-[#009EE3]/40 shadow-xl shadow-[#009EE3]/15'
                    : plan.isPro
                    ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#009EE3] text-white shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      {plan.id === 'pro_ai' && <Sparkles className="w-4 h-4 text-indigo-400" />}
                      {plan.id === 'pareja' && <Users className="w-4 h-4 text-pink-400" />}
                      {plan.id === 'individual' && <UserCheck className="w-4 h-4 text-sky-400" />}
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">
                        {formatCurrency(price, 'ARS')}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        /{billingCycle === 'annual' ? 'año' : 'mes'}
                      </span>
                    </div>

                    {billingCycle === 'annual' && (
                      <div className="text-[11px] text-emerald-400 font-bold mt-1">
                        Equivale a {formatCurrency(monthlyEquiv, 'ARS')}/mes
                      </div>
                    )}
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2 text-xs text-slate-300 pt-2">
                    {plan.features.slice(0, 5).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleOpenPayment(plan)}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                      plan.isPopular || isPreferred
                        ? 'bg-[#009EE3] hover:bg-[#0089C7] text-white shadow-[#009EE3]/30 active:scale-98'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pagar con Mercado Pago</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support and Extension request */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>¿Necesitás más días para evaluar la plataforma o ayuda con el pago?</span>
          </div>

          <a
            href="https://wa.me/?text=Hola%2C%20quisiera%20solicitar%20una%20extensi%C3%B3n%20de%20d%C3%ADas%20de%20prueba%20en%20mi%20cuenta%20de%20GastoAR"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/40 transition-colors"
          >
            Solicitar Prórroga al Administrador
          </a>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 py-3 border-t border-slate-800/60">
        GastoAR © 2026 • Cobros procesados de forma 100% segura mediante Mercado Pago Argentina
      </div>

      {/* Mercado Pago Checkout Modal */}
      {selectedPlanForPayment && (
        <MercadoPagoModal
          isOpen={isMpModalOpen}
          onClose={() => setIsMpModalOpen(false)}
          plan={selectedPlanForPayment}
          billingCycle={billingCycle}
          userEmail={userAccount?.email || subscription?.userEmail || 'usuario@gastoar.com'}
          userName={userAccount?.name || subscription?.userName || 'Usuario'}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Admin Auth Modal (for Admin bypass) */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => {
          setIsAdminAuthOpen(false);
          if (onOpenAdminPanel) onOpenAdminPanel();
        }}
      />

    </div>
  );
};
