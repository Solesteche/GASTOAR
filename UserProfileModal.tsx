import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CreditCard, 
  Heart, 
  Copy, 
  Check, 
  Moon, 
  Sun, 
  LogOut, 
  CheckCircle2, 
  Tag,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Zap,
  CheckCircle,
  Cloud,
  Database
} from 'lucide-react';
import { CoupleProfile, BillingCycle, SubscriptionPlan, SubscriptionPlanId, UserAccount, UserSubscription } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { formatCurrency, formatDateEs } from '../utils/formatters';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount: UserAccount | null;
  profile: CoupleProfile;
  currentSubscription?: UserSubscription | null;
  activeSubscription?: UserSubscription | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateProfile?: (newProfile: Partial<CoupleProfile>) => void;
  onUpdateAccount?: (updated: Partial<UserAccount>) => void;
  onJoinAccount?: (code: string) => void;
  onApplyDiscountCode?: (code: string) => void;
  onLinkCoupleCode?: (code: string) => void;
  onOpenSubscriptionsTab?: () => void;
  onOpenCloudSync?: () => void;
  onLogout: () => void;
  onSelectPlanPayment?: (plan: SubscriptionPlan, cycle: BillingCycle) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userAccount,
  profile,
  currentSubscription,
  activeSubscription,
  isDarkMode,
  onToggleDarkMode,
  onUpdateProfile,
  onUpdateAccount,
  onJoinAccount,
  onApplyDiscountCode,
  onLinkCoupleCode,
  onOpenSubscriptionsTab,
  onOpenCloudSync,
  onLogout,
  onSelectPlanPayment,
  onShowToast,
}) => {
  const sub = activeSubscription || currentSubscription;
  
  const [userName, setUserName] = useState(userAccount?.name || profile.user1Name || 'Usuario');
  const [partnerName, setPartnerName] = useState(userAccount?.partnerName || profile.user2Name || 'Mi Pareja');
  const [userEmail, setUserEmail] = useState(userAccount?.email || 'ejemplo@ejemplo.com');
  const [userPassword, setUserPassword] = useState(userAccount?.password || '••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Plans view state inside profile modal
  const [showPlansView, setShowPlansView] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');

  // Discount code state
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(() => {
    try {
      const saved = localStorage.getItem('gastoar_applied_discount');
      if (saved) return JSON.parse(saved);
    } catch {
      return null;
    }
    return null;
  });

  // Couple Code state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onShowToast) onShowToast(msg, type);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.accountCode);
    setCopiedCode(true);
    notify('¡Código Pareja copiado al portapapeles!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const code = discountCodeInput.trim().toUpperCase();
    if (!code) {
      notify('Ingresa un código de descuento', 'error');
      return;
    }

    const validCodes: Record<string, number> = {
      'GASTOAR20': 20,
      'PROMO50': 50,
      'AHORRO10': 10,
      'LANZAMIENTO30': 30,
      'PAREJA15': 15,
      'ESTECHESOL': 25,
      'PROMO2026': 20,
    };

    if (validCodes[code]) {
      const discountObj = { code, percent: validCodes[code] };
      setAppliedDiscount(discountObj);
      try {
        localStorage.setItem('gastoar_applied_discount', JSON.stringify(discountObj));
      } catch (e) {
        console.error(e);
      }
      if (onApplyDiscountCode) onApplyDiscountCode(code);
      notify(`🎉 ¡Código ${code} aplicado! Tenés ${validCodes[code]}% de descuento en los planes.`, 'success');
      setDiscountCodeInput('');
    } else {
      notify('Código de descuento no válido o expirado.', 'error');
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    try {
      localStorage.removeItem('gastoar_applied_discount');
    } catch (e) {
      console.error(e);
    }
    notify('Código de descuento removido.', 'info');
  };

  const handleSaveAccountInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        user1Name: userName.trim() || 'Sol',
        user2Name: partnerName.trim() || 'Martín',
      });
    }

    if (onUpdateAccount) {
      onUpdateAccount({
        name: userName.trim(),
        partnerName: partnerName.trim(),
        email: userEmail.trim(),
        ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
      });
    }

    if (newPassword.trim()) {
      setUserPassword(newPassword.trim());
      setIsEditingPassword(false);
      setNewPassword('');
    }

    notify('Datos de perfil y cuenta actualizados correctamente', 'success');
  };

  const handleJoin = () => {
    if (!joinCodeInput.trim()) {
      notify('Ingresa un código de cuenta válido', 'error');
      return;
    }
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (onLinkCoupleCode) {
      onLinkCoupleCode(cleanCode);
    } else if (onJoinAccount) {
      onJoinAccount(cleanCode);
    }
    setJoinCodeInput('');
  };

  const handlePayPlan = (plan: SubscriptionPlan) => {
    if (onSelectPlanPayment) {
      onSelectPlanPayment(plan, selectedCycle);
      setShowPlansView(false);
      onClose();
    } else if (onOpenSubscriptionsTab) {
      onClose();
      onOpenSubscriptionsTab();
    }
  };

  // Plan & Date Calculations
  const isTrial = sub?.status === 'trial';
  const isActive = sub?.status === 'active';
  const planName = sub?.planName || 'Plan Parejas Dúo';

  // Registration Date
  const rawRegistrationDate = userAccount?.createdAt || sub?.createdAt || Date.now();
  const registrationDateObj = new Date(rawRegistrationDate);
  const registrationDateFormatted = isNaN(registrationDateObj.getTime())
    ? 'Hoy'
    : registrationDateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Expiration / Trial validity calculation
  let expirationLabel = 'Vencimiento del plan:';
  let expirationDateStr = '-';
  let trialRemainingDays: number | null = null;
  let isExpired = false;

  if (isTrial) {
    expirationLabel = 'Vencimiento de la prueba gratuita:';
    const trialDate = sub?.trialEndsDate || sub?.nextRenewalDate;
    if (trialDate) {
      expirationDateStr = formatDateEs(trialDate);
      const [y, m, d] = trialDate.split('-').map(Number);
      const endObj = new Date(y, m - 1, d);
      const nowObj = new Date();
      nowObj.setHours(0, 0, 0, 0);
      const diffTime = endObj.getTime() - nowObj.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      trialRemainingDays = diffDays;
      if (diffDays <= 0) {
        isExpired = true;
      }
    } else {
      expirationDateStr = '15 días de prueba activos';
    }
  } else if (isActive) {
    expirationLabel = 'Vencimiento / Renovación del plan:';
    const renDate = sub?.nextRenewalDate;
    expirationDateStr = renDate ? formatDateEs(renDate) : 'Suscripción Activa';
  } else if (sub?.status === 'canceled' || sub?.status === 'past_due') {
    expirationLabel = 'Estado de la cuenta:';
    expirationDateStr = 'Vencida / Pendiente de Pago';
    isExpired = true;
  } else {
    expirationLabel = 'Vencimiento de la prueba gratuita:';
    expirationDateStr = '15 días de prueba';
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#140728] border border-purple-100 dark:border-purple-900/40 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
        
        {/* Header - TITLE IS STRICTLY "Mi Perfil" */}
        <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xs font-black text-xl">
              {(userName[0] || 'U').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight leading-none text-white">
                  Mi Perfil
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase border border-white/30 backdrop-blur-xs">
                  {isTrial ? '15 Días Gratis' : (isActive ? 'Plan Activo' : 'Cuenta Activa')}
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-white">{userName}</span>
                <span className="opacity-60">•</span>
                <span className="text-purple-200">{userEmail}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-xs">
          
          {/* ========================================================================= */}
          {/* REGISTRATION DATE & PLAN VIGENCY / TRIAL EXPIRATION SECTION               */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-indigo-50/60 to-purple-100/50 dark:from-[#1b0a38] dark:via-[#15072e] dark:to-[#220c45] border border-purple-200/80 dark:border-purple-700/50 shadow-xs space-y-3.5">
            
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-purple-200/60 dark:border-purple-800/40 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">Plan Actual</span>
                  <div className="text-sm font-black text-[#2E0854] dark:text-purple-100 leading-tight">
                    {planName}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPlansView(prev => !prev)}
                className="px-3.5 py-2 rounded-xl bg-[#2E0854] hover:bg-[#1C0533] dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                <span>{showPlansView ? 'Ocultar Planes' : 'Ver Planes & Precios'}</span>
              </button>
            </div>

            {/* Registration Date & Expiration Dates Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Fecha de Registro */}
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#120524]/80 border border-purple-200/60 dark:border-purple-800/40 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha de Registro</div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {registrationDateFormatted}
                  </div>
                </div>
              </div>

              {/* Vencimiento de la prueba gratuita o del plan */}
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#120524]/80 border border-purple-200/60 dark:border-purple-800/40 flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg shrink-0 ${isTrial ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                    {isTrial ? 'Vencimiento Prueba Gratis' : 'Vencimiento / Renovación'}
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {expirationDateStr}
                  </div>
                </div>
              </div>
            </div>

            {/* Informative status text */}
            <div className="text-[11px] text-purple-900 dark:text-purple-200 font-medium bg-purple-100/60 dark:bg-purple-900/30 p-2.5 rounded-xl border border-purple-200/40 dark:border-purple-800/30">
              {isTrial ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🎁</span>
                  <span>
                    Período de <strong>15 días de prueba gratuita</strong>.
                    {trialRemainingDays !== null && (
                      trialRemainingDays > 0 ? (
                        <span className="text-purple-700 dark:text-purple-300 font-bold ml-1">
                          (Restan {trialRemainingDays} {trialRemainingDays === 1 ? 'día' : 'días'} de acceso completo).
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-bold ml-1">
                          (Prueba finalizada. Renovalo para continuar).
                        </span>
                      )
                    )}
                  </span>
                </div>
              ) : isActive ? (
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Suscripción activa con Mercado Pago. Próximo cobro automático el <strong>{expirationDateStr}</strong>.</span>
                </div>
              ) : (
                <span>Cuenta activa. Podés cambiar tu plan o consultar promociones cuando lo desees.</span>
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* INTERACTIVE PLANS & VALUES BREAKDOWN (TRIGGERED BY "VER PLANES")          */}
          {/* ========================================================================= */}
          {showPlansView && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#100320] border-2 border-purple-400/80 dark:border-purple-600 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Planes y Valores Disponibles</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Seleccioná tu plan preferido para abonar de forma segura con Mercado Pago
                  </p>
                </div>

                {/* Billing Cycle Switcher */}
                <div className="flex items-center bg-white dark:bg-[#1a0734] border border-purple-200 dark:border-purple-700/60 p-1 rounded-xl shadow-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('monthly')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      selectedCycle === 'monthly'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-700'
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('annual')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                      selectedCycle === 'annual'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-700'
                    }`}
                  >
                    <span>Anual</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black">
                      -34%
                    </span>
                  </button>
                </div>
              </div>

              {/* Plans Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isCurrent = sub?.planId === plan.id;
                  const basePrice = selectedCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
                  const discountPercent = appliedDiscount?.percent || 0;
                  const finalPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;

                  return (
                    <div
                      key={plan.id}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                        plan.isPopular
                          ? 'bg-gradient-to-b from-purple-50/80 to-indigo-50/50 dark:from-[#210c44] dark:to-[#170530] border-purple-400 dark:border-purple-500 shadow-xs'
                          : plan.isPro
                          ? 'bg-gradient-to-b from-amber-50/60 to-purple-50/40 dark:from-[#2a134a] dark:to-[#180633] border-amber-300 dark:border-purple-600'
                          : 'bg-white dark:bg-[#15072b] border-slate-200 dark:border-purple-900/50'
                      }`}
                    >
                      <div className="space-y-2">
                        {plan.badge && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-extrabold shadow-xs">
                            {plan.badge}
                          </span>
                        )}
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {plan.name}
                        </h5>

                        <div className="space-y-0.5">
                          {discountPercent > 0 && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatCurrency(basePrice, 'ARS')}
                            </span>
                          )}
                          <div className="text-base font-black text-[#2E0854] dark:text-purple-200">
                            {formatCurrency(finalPrice, 'ARS')}
                            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                              /{selectedCycle === 'annual' ? 'año' : 'mes'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-2">
                          {plan.tagline}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-purple-800/40">
                        <button
                          type="button"
                          onClick={() => handlePayPlan(plan)}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            plan.isPopular
                              ? 'bg-purple-700 hover:bg-purple-800 text-white'
                              : plan.isPro
                              ? 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white'
                              : 'bg-slate-800 hover:bg-slate-900 dark:bg-purple-900/80 dark:hover:bg-purple-800 text-white'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isCurrent ? 'Renovar con MP' : 'Elegir y Pagar'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full subscriptions view shortcut */}
              {onOpenSubscriptionsTab && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSubscriptionsTab();
                    }}
                    className="text-[11px] text-purple-700 dark:text-purple-300 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver pantalla completa de planes y medios de pago</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* DISCOUNT CODE SECTION                                                     */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#120524] border border-slate-200 dark:border-purple-900/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Código de Descuento para Planes</span>
              </span>
              {appliedDiscount && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                  {appliedDiscount.percent}% OFF ACTIVO
                </span>
              )}
            </div>

            {appliedDiscount ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-xs">
                    Código <strong>{appliedDiscount.code}</strong> aplicado ({appliedDiscount.percent}% de descuento).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  className="text-[11px] text-emerald-700 dark:text-emerald-300 underline font-bold hover:text-emerald-900 cursor-pointer"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyDiscount} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="ej. GASTOAR20 o PROMO50"
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-[#1a0734] border border-slate-300 dark:border-purple-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase font-mono font-bold"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Aplicar
                </button>
              </form>
            )}
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Ingresá cupones promocionales (ej. <strong>GASTOAR20</strong>, <strong>PROMO50</strong>, <strong>LANZAMIENTO30</strong>) para aplicar descuentos en tu plan.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* USER & PARTNER CREDENTIALS FORM                                           */}
          {/* ========================================================================= */}
          <form onSubmit={handleSaveAccountInfo} className="space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Datos de Registro y Acceso</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a0734] border border-slate-200 dark:border-purple-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre de tu Pareja</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a0734] border border-slate-200 dark:border-purple-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Mail de Registro</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#1a0734] border border-slate-200 dark:border-purple-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Contraseña de la Cuenta</label>
                  <button
                    type="button"
                    onClick={() => setIsEditingPassword(!isEditingPassword)}
                    className="text-[10px] text-purple-700 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    {isEditingPassword ? 'Cancelar cambio' : 'Cambiar Contraseña'}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    readOnly={!isEditingPassword}
                    value={isEditingPassword ? newPassword : userPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={isEditingPassword ? 'Ingresa la nueva contraseña' : '••••••••'}
                    className={`w-full pl-9 pr-10 py-2 border rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                      isEditingPassword 
                        ? 'bg-white dark:bg-[#1a0734] border-purple-400' 
                        : 'bg-slate-50 dark:bg-[#1a0734]/60 border-slate-200 dark:border-purple-800/40 font-mono'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-[#7928CA] hover:bg-[#6820B0] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Guardar Cambios de Cuenta
              </button>
            </div>
          </form>

          {/* ========================================================================= */}
          {/* COUPLE CODE (CÓDIGO PAREJA) SECTION                                      */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                <span>Código Pareja & Vinculación Compartida</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Sincronizada
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={profile.accountCode}
                className="w-full font-mono font-bold text-center text-sm py-2 px-3 bg-white dark:bg-[#1a0734] border border-amber-300 dark:border-amber-700/60 rounded-xl text-slate-900 dark:text-white shadow-inner"
              />
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95 shadow-xs"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Join another couple code */}
            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/30 space-y-1.5">
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200">
                ¿Querés unirte al código de tu pareja?
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="ej. PAREJA-9942"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 bg-white dark:bg-[#1a0734] border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs uppercase font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  className="px-3.5 py-2 bg-[#2E0854] hover:bg-[#1C0533] dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Vincular
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SETTINGS: DARK MODE ONLY (LOGO DOWNLOAD OPTION REMOVED AS REQUESTED)     */}
          {/* ========================================================================= */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-purple-900/40">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider pt-2">
              Preferencias & Opciones de Aplicación
            </h4>

            {/* Dark Mode Toggle Card */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-purple-800/60 bg-slate-50 dark:bg-[#120524] hover:bg-slate-100 dark:hover:bg-[#1a0734] flex items-center justify-between text-left transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'bg-purple-900/80 text-amber-300 border border-purple-700' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Modo Oscuro</div>
                  <div className="text-[11px] text-slate-500 dark:text-purple-300">
                    {isDarkMode ? 'Activado • Tema oscuro violeta de alto contraste' : 'Desactivado • Tema claro violeta'}
                  </div>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-purple-600' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* EXIT DEMO OR LOGOUT                                                       */}
          {/* ========================================================================= */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión / Salir del Modo Demo</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
