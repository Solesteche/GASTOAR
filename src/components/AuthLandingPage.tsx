import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Users, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CreditCard, 
  CheckCircle2, 
  Heart, 
  TrendingUp,
  Coins,
  ChevronRight,
  Check,
  Zap,
  Sliders,
  Layers,
  Building2,
  ExternalLink,
  BadgePercent,
  Target
} from 'lucide-react';
import { BillingCycle, CoupleProfile, SubscriptionPlan, SubscriptionPlanId, UserAccount } from '../types';
import { GastoArBrand, GastoArHeroBrand } from './GastoArLogo';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { formatCurrency } from '../utils/formatters';
import { MercadoPagoModal } from './MercadoPagoModal';
import { AdminAuthModal } from './AdminAuthModal';

interface AuthLandingPageProps {
  onLogin: (email: string, password?: string) => { success: boolean; error?: string };
  onRegister: (data: {
    name: string;
    email: string;
    password?: string;
    accountType: 'pareja' | 'individual';
    partnerName?: string;
    currency: string;
    accountCode?: string;
    selectedPlanId?: SubscriptionPlanId;
  }) => { success: boolean; error?: string };
  onGuestDemo: () => void;
  onOpenAdminPanel?: () => void;
}

export const AuthLandingPage: React.FC<AuthLandingPageProps> = ({
  onLogin,
  onRegister,
  onGuestDemo,
  onOpenAdminPanel,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Admin PIN Auth Modal State
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);

  // Billing Cycle Toggle for Plans
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  // Mercado Pago Checkout Modal State
  const [isMpModalOpen, setIsMpModalOpen] = useState<boolean>(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Register form state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regAccountType, setRegAccountType] = useState<'pareja' | 'individual'>('pareja');
  const [regPartnerName, setRegPartnerName] = useState<string>('');
  const [regCurrency, setRegCurrency] = useState<string>('ARS');
  const [regAccountCode, setRegAccountCode] = useState<string>(() => 'PAIR-' + Math.floor(1000 + Math.random() * 9000));
  const [regSelectedPlan, setRegSelectedPlan] = useState<SubscriptionPlanId>('pareja');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico o nombre de usuario.');
      return;
    }
    const res = onLogin(loginEmail.trim(), loginPassword);
    if (!res.success) {
      setErrorMsg(res.error || 'Credenciales no encontradas.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg('La contraseña debe contener al menos 4 caracteres.');
      return;
    }
    if (regAccountType === 'pareja' && !regPartnerName.trim()) {
      setErrorMsg('Por favor ingresa el nombre de tu pareja para vincular la cuenta.');
      return;
    }

    const res = onRegister({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      accountType: regAccountType,
      partnerName: regAccountType === 'pareja' ? regPartnerName.trim() : undefined,
      currency: regCurrency,
      accountCode: regAccountCode,
      selectedPlanId: regSelectedPlan,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Hubo un error al crear la cuenta.');
    }
  };

  const handleSelectPlanForMp = (plan: SubscriptionPlan) => {
    setSelectedPlanForPayment(plan);
    setRegSelectedPlan(plan.id);
    if (plan.id === 'individual') {
      setRegAccountType('individual');
    } else {
      setRegAccountType('pareja');
    }
    setIsMpModalOpen(true);
  };

  const handlePaymentSuccess = (details: {
    planId: string;
    planName: string;
    billingCycle: BillingCycle;
    paymentId: string;
    amount: number;
  }) => {
    // If user filled email/name, auto-register or sign in
    const emailToUse = regEmail.trim() || 'cliente@gastoar.com';
    const nameToUse = regName.trim() || 'Usuario Suscriptor';

    onRegister({
      name: nameToUse,
      email: emailToUse,
      accountType: details.planId === 'individual' ? 'individual' : 'pareja',
      partnerName: details.planId === 'individual' ? undefined : (regPartnerName.trim() || 'Mi Pareja'),
      currency: 'ARS',
      accountCode: regAccountCode,
      selectedPlanId: details.planId as SubscriptionPlanId,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation / Brand */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <GastoArBrand 
          size="md" 
          variant="dark" 
          showTagline={true} 
          showAmberBar={true} 
        />

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#planes"
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all flex items-center gap-1"
          >
            <span>Ver Planes</span>
          </a>

          <button
            onClick={onGuestDemo}
            className="text-xs font-bold text-amber-300 hover:text-amber-200 px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Modo Demo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
        
        {/* Left Column: Value Proposition */}
        <div className="flex-1 max-w-xl space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Finanzas personales, en pareja y cuotas bancarias en Argentina</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Registrá. Controlá. Ahorrá. <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-amber-300">con GastoAR</span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Tu centro de control financiero inteligente: registrá consumos en segundos, dividí gastos de pareja con cálculo de deudas y monitoreá tus tarjetas y cuotas bancarias en un solo lugar.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-left space-y-1">
              <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
                <Heart className="w-4 h-4 text-pink-500" />
                <span>División en Pareja</span>
              </div>
              <p className="text-xs text-slate-400 leading-snug">
                Balance en tiempo real con liquidaciones automáticas 50/50 o personalizadas.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-left space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span>Control de Cuotas</span>
              </div>
              <p className="text-xs text-slate-400 leading-snug">
                Seguimiento de compras financiadas con tarjetas y vencimientos futuros.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-left space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Presupuestos y Gráficos</span>
              </div>
              <p className="text-xs text-slate-400 leading-snug">
                Límites por categoría, filtros por período de fecha y visualizaciones claras.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-left space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Metas & Cajas de Ahorro</span>
              </div>
              <p className="text-xs text-slate-400 leading-snug">
                Fijá objetivos de ahorro, alcancías virtuales y registrá aportes individuales o en pareja.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card (Login / Register Tabs) */}
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-5">
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                tab === 'login'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                tab === 'register'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Correo Electrónico o Usuario
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ej. estechesol@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Contraseña
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Ingresa tu clave"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                  />
                  <span>Recordarme en este equipo</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ingresar al Panel</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-400">
                  ¿No tenés cuenta aún?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('register'); setErrorMsg(''); }}
                    className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-2"
                  >
                    Registrate gratis
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Tu Nombre
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="ej. Sol"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ej. sol@ejemplo.com"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Tipo de Cuenta & Uso
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setRegAccountType('pareja'); setRegSelectedPlan('pareja'); }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      regAccountType === 'pareja'
                        ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>En Pareja (Dúo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRegAccountType('individual'); setRegSelectedPlan('individual'); }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      regAccountType === 'individual'
                        ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Individual</span>
                  </button>
                </div>
              </div>

              {regAccountType === 'pareja' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-slate-300">
                    Nombre de tu Pareja
                  </label>
                  <div className="relative">
                    <Heart className="w-4 h-4 text-pink-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regPartnerName}
                      onChange={(e) => setRegPartnerName(e.target.value)}
                      placeholder="ej. Martín"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Crear Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-10 pr-10 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span><strong>15 días de prueba gratis incluidos:</strong> explorá todas las funciones premium. Al finalizar podrás activar tu suscripción con Mercado Pago.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Comenzar 15 Días de Prueba Gratis</span>
                <Sparkles className="w-4 h-4" />
              </button>

              <div className="pt-1 text-center">
                <p className="text-xs text-slate-400">
                  ¿Ya tenés cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setErrorMsg(''); }}
                    className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-2"
                  >
                    Iniciar Sesión
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Quick Demo Access Footer in Card */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>¿Querés probar sin registrarte?</span>
            <button
              onClick={onGuestDemo}
              className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              Explorar modo Demo
            </button>
          </div>
        </div>
      </main>

      {/* 3 SUBSCRIPTION PLANS SECTION (PRICING TIERS) */}
      <section id="planes" className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#009EE3]/15 border border-[#009EE3]/40 text-[#009EE3] text-xs font-black uppercase tracking-wider">
            <span>Planes de Suscripción Oficiales</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Elegí el plan perfecto para tus finanzas
          </h3>
          
          <p className="text-slate-400 text-xs sm:text-sm">
            Aboná de forma 100% segura mediante <strong className="text-white">Mercado Pago</strong> con dinero en cuenta, tarjetas bancarias o transferencia directa.
          </p>

          {/* Billing Cycle Switcher (Monthly / Annual) */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Mensual
            </span>

            <button
              type="button"
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
              className="w-14 h-7 rounded-full bg-slate-800 p-1 flex items-center transition-colors relative border border-slate-700 focus:outline-none"
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#009EE3] transition-transform duration-200 shadow-md ${
                  billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>

            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>
                Anual
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black tracking-wide">
                🔥 Ahorrá hasta 34%
              </span>
            </div>
          </div>
        </div>

        {/* 3 Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {SUBSCRIPTION_PLANS.map((plan) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            const monthlyEquivalent = billingCycle === 'annual' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
                  plan.isPopular
                    ? 'bg-slate-900 border-2 border-[#009EE3] shadow-2xl shadow-[#009EE3]/20 md:-translate-y-2'
                    : plan.isPro
                    ? 'bg-slate-900/90 border border-indigo-500/50 shadow-xl shadow-indigo-950/40'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Popular / Pro Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`px-3.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-md ${
                      plan.isPopular
                        ? 'bg-[#009EE3] text-white'
                        : plan.isPro
                        ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Plan Title & Tagline */}
                  <div>
                    <h4 className="text-xl font-black text-white tracking-tight">
                      {plan.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="py-2 border-y border-slate-800/80">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        {formatCurrency(price, 'ARS')}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {billingCycle === 'annual' ? '/año' : '/mes'}
                      </span>
                    </div>

                    {billingCycle === 'annual' && (
                      <div className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                        <BadgePercent className="w-3.5 h-3.5" />
                        <span>Equivale a {formatCurrency(monthlyEquivalent, 'ARS')}/mes</span>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${
                          plan.isPopular ? 'bg-[#009EE3]/20 text-[#009EE3]' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-6 space-y-2">
                  {/* Mercado Pago Subscribe Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectPlanForMp(plan)}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-98 shadow-lg cursor-pointer ${
                      plan.isPopular
                        ? 'bg-[#009EE3] hover:bg-[#0089C7] text-white shadow-[#009EE3]/30'
                        : plan.isPro
                        ? 'bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/30'
                        : 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pagar con Mercado Pago</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegSelectedPlan(plan.id);
                      setTab('register');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-2 text-slate-400 hover:text-white font-bold text-xs transition-colors"
                  >
                    Elegir y Registrarme
                  </button>
                </div>

              </div>
            );
          })}

        </div>

        {/* Mercado Pago Trust Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#009EE3]/15 text-[#009EE3] border border-[#009EE3]/30 flex items-center justify-center font-black text-xl shrink-0">
              MP
            </div>
            <div>
              <h5 className="font-extrabold text-sm text-white">
                Garantía y Seguridad Mercado Pago
              </h5>
              <p className="text-xs text-slate-400">
                Cancelá en cualquier momento. Acreditación automática y soporte preferencial en Argentina.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              100% Protegido
            </span>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>GastoAR &copy; {new Date().getFullYear()} — Registrá. Controlá. Ahorrá. Finanzas individuales, en pareja y cuotas bancarias en Argentina.</p>
        
        {onOpenAdminPanel && (
          <button
            onClick={() => setIsAdminAuthOpen(true)}
            className="text-slate-500 hover:text-slate-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Acceso Administración</span>
          </button>
        )}
      </footer>

      {/* Admin PIN Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => {
          onOpenAdminPanel?.();
        }}
      />

      {/* Mercado Pago Checkout Modal */}
      <MercadoPagoModal
        isOpen={isMpModalOpen}
        onClose={() => setIsMpModalOpen(false)}
        plan={selectedPlanForPayment}
        billingCycle={billingCycle}
        userEmail={regEmail}
        userName={regName}
        accountCode={regAccountCode}
        onPaymentSuccess={handlePaymentSuccess}
      />

    </div>
  );
};
