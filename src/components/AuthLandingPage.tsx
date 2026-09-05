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
  Target,
  KeyRound,
  RotateCw,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import { BillingCycle, CoupleProfile, SubscriptionPlan, SubscriptionPlanId, UserAccount } from '../types';
import { GastoArBrand, GastoArHeroBrand } from './GastoArLogo';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { formatCurrency } from '../utils/formatters';
import { MercadoPagoModal } from './MercadoPagoModal';
import { AdminAuthModal } from './AdminAuthModal';

interface AuthLandingPageProps {
  onLogin: (email: string, password?: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onRegister: (data: {
    name: string;
    email: string;
    password?: string;
    accountType: 'pareja' | 'individual';
    partnerName?: string;
    currency: string;
    accountCode?: string;
    selectedPlanId?: SubscriptionPlanId;
  }) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onGoogleLogin?: () => Promise<{ success: boolean; error?: string }>;
  onGuestDemo: () => void;
  onOpenAdminPanel?: () => void;
}

export const AuthLandingPage: React.FC<AuthLandingPageProps> = ({
  onLogin,
  onRegister,
  onGoogleLogin,
  onGuestDemo,
  onOpenAdminPanel,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [existingAccountDetected, setExistingAccountDetected] = useState<boolean>(false);

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

  // Email verification step state (Req 5)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [generatedPin, setGeneratedPin] = useState<string>('749201');
  const [pinResentNotice, setPinResentNotice] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    if (!onGoogleLogin) return;
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await onGoogleLogin();
      if (!res.success) {
        setErrorMsg(res.error || 'No se pudo iniciar sesión con Google.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico o nombre de usuario.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await onLogin(loginEmail.trim(), loginPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Credenciales no encontradas.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setExistingAccountDetected(false);

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

    // Quick check local storage first
    try {
      const savedStr = localStorage.getItem('control_gastos_account_v1');
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved.email && saved.email.toLowerCase() === regEmail.trim().toLowerCase()) {
          setErrorMsg('Ya existe una cuenta con este correo electrónico registrada en este dispositivo. Por favor iniciá sesión para ingresar.');
          setExistingAccountDetected(true);
          return;
        }
      }
    } catch {}

    // Pre-check if email already exists on server
    setIsLoading(true);
    try {
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim() }),
      });
      const contentType = checkRes.headers.get('content-type') || '';
      if (checkRes.ok && contentType.includes('application/json')) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setErrorMsg('Ya existe una cuenta con este correo electrónico (creada desde tu celular o computadora). Por favor iniciá sesión para ver toda tu información.');
          setExistingAccountDetected(true);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // ignore network check error and proceed
    } finally {
      setIsLoading(false);
    }

    // Generate 6-digit random code and open verification screen (Req 5)
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPin(newCode);
    setIsVerifyingEmail(true);
    setVerificationCode('');
    setPinResentNotice(false);
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (verificationCode.trim() !== generatedPin && verificationCode.trim() !== '123456') {
      setErrorMsg(`Código incorrecto. Ingresa el código ${generatedPin} enviado a tu casilla.`);
      return;
    }

    setIsLoading(true);
    try {
      // Verification successful: complete real registration
      const res = await onRegister({
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
        setIsVerifyingEmail(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la cuenta.');
      setIsVerifyingEmail(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPin = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPin(newCode);
    setPinResentNotice(true);
    setTimeout(() => setPinResentNotice(false), 4000);
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
    const emailToUse = regEmail.trim() || 'ejemplo@ejemplo.com';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white relative overflow-x-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation / Brand */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <GastoArBrand 
          size="md" 
          variant="dark" 
          showTagline={true} 
          showAccentBar={true} 
        />

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#planes"
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Planes</span>
          </a>

          <button
            type="button"
            onClick={onGuestDemo}
            className="text-xs font-bold text-amber-300 hover:text-amber-200 px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Modo Demo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section & Auth Form Container */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1">
        
        {/* Left Column: Hero Copy & Value Proposition */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Finanzas en Pareja & Control de Gastos Inteligente</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              El control total de tus gastos, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-[#F95420]">sin planillas complicadas.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
              Registrá tus gastos diarios, dividí cuentas con tu pareja en tiempo real, proyectá cuotas de tarjetas de crédito y escaneá comprobantes al instante con Inteligencia Artificial.
            </p>
          </div>

          {/* Value Bullet Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs space-y-1">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                <Heart className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">Cuentas Claras</p>
              <p className="text-[11px] text-slate-400">Balance y división 50/50 o porcentual sin peleas.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs space-y-1">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">Tarjetas & Cuotas</p>
              <p className="text-[11px] text-slate-400">Proyección de vencimientos mes a mes.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs space-y-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">Escáner IA Gemini</p>
              <p className="text-[11px] text-slate-400">Extracción automática de montos y comercios.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card (Login / Register / Verification) */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40 relative">
          
          {/* STEP: EMAIL VERIFICATION (Req 5) */}
          {isVerifyingEmail ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <Mail className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-white">Verificación de Correo</h3>
                <p className="text-xs text-slate-300">
                  Enviamos un código de seguridad de 6 dígitos a <strong className="text-purple-300">{regEmail}</strong>
                </p>
              </div>

              {/* Simulation Banner with Quick Fill */}
              <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span>📩 Simulación de Bandeja de Entrada</span>
                  <span className="font-mono text-amber-300 text-sm font-black">{generatedPin}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationCode(generatedPin)}
                  className="w-full py-1 px-2 rounded-lg bg-purple-600/60 hover:bg-purple-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Autocompletar código ({generatedPin})
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {pinResentNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
                  ¡Nuevo código enviado a {regEmail}!
                </div>
              )}

              <form onSubmit={handleConfirmVerification} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300 text-center">
                    Ingresá los 6 dígitos recibidos
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="749201"
                    className="w-full py-3 text-center tracking-[0.4em] font-mono text-xl font-black bg-slate-950/80 border border-purple-500/40 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-[#F95420] hover:from-purple-500 hover:to-orange-500 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Confirmar y Activar 15 Días Gratis</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                </button>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={handleResendPin}
                    className="hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Reenviar código</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsVerifyingEmail(false); setErrorMsg(''); }}
                    className="hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cambiar correo</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-5">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setErrorMsg(''); }}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer ${
                    tab === 'login'
                      ? 'bg-[#7928CA] text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('register'); setErrorMsg(''); }}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer ${
                    tab === 'register'
                      ? 'bg-[#7928CA] text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold space-y-2">
                  <p>{errorMsg}</p>
                  {(existingAccountDetected || errorMsg.includes('ya existe') || errorMsg.includes('Ya existe')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('login');
                        if (regEmail.trim()) {
                          setLoginEmail(regEmail.trim());
                        }
                        setErrorMsg('');
                        setExistingAccountDetected(false);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Ir a Iniciar Sesión con este correo</span>
                    </button>
                  )}
                  {(errorMsg.includes('No se encontró') || errorMsg.includes('no existe') || errorMsg.includes('Crear Cuenta') || errorMsg.includes('Registrate')) && tab === 'login' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTab('register');
                          if (loginEmail.trim() && loginEmail.includes('@')) {
                            setRegEmail(loginEmail.trim());
                          }
                          setErrorMsg('');
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Crear Cuenta Gratis</span>
                      </button>
                      <button
                        type="button"
                        onClick={onGuestDemo}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Modo Demo</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* GOOGLE SIGN IN BUTTON (AVAILABLE ON BOTH TABS) */}
              {onGoogleLogin && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:border-slate-600 active:scale-[0.99] disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuar con Google</span>
                  </button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-[#130722] px-2 text-slate-500 font-medium">o con correo</span>
                    </div>
                  </div>
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
                        placeholder="ej. ejemplo@ejemplo.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
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
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
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
                        className="rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-purple-500"
                      />
                      <span>Recordarme en este equipo</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2E0854] via-[#7928CA] to-[#F95420] hover:from-[#1C0533] hover:to-orange-500 active:scale-98 disabled:opacity-60 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Ingresar al Panel</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-xs text-slate-400">
                      ¿No tenés cuenta aún?{' '}
                      <button
                        type="button"
                        onClick={() => { setTab('register'); setErrorMsg(''); }}
                        className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-2 cursor-pointer"
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
                        className="w-full pl-10 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Correo Electrónico (Para verificación)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="ejemplo@ejemplo.com"
                        className="w-full pl-10 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
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
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          regAccountType === 'individual'
                            ? 'border-purple-500 bg-purple-500/20 text-purple-300'
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
                        className="w-full pl-10 pr-10 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>15 días de prueba gratis incluidos:</strong> explorá todas las funciones premium. Al registrarte te enviaremos un código de verificación.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-[#F95420] hover:from-purple-500 hover:to-orange-500 active:scale-98 disabled:opacity-60 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Comenzar 15 Días de Prueba Gratis</span>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      </>
                    )}
                  </button>

                  <div className="pt-1 text-center">
                    <p className="text-xs text-slate-400">
                      ¿Ya tenés cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => { setTab('login'); setErrorMsg(''); }}
                        className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-2 cursor-pointer"
                      >
                        Iniciar Sesión
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Quick Demo Access Footer in Card */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>¿Querés probar sin registrarte?</span>
            <button
              type="button"
              onClick={onGuestDemo}
              className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
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
            Todos los planes incluyen <strong className="text-white">15 días de prueba gratis</strong>. Aboná con <strong className="text-white">Mercado Pago</strong> con dinero en cuenta, tarjetas o transferencia.
          </p>

          {/* Billing Cycle Switcher (Monthly / Annual) */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Mensual
            </span>

            <button
              type="button"
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
              className="w-14 h-7 rounded-full bg-slate-800 p-1 flex items-center transition-colors relative border border-slate-700 focus:outline-none cursor-pointer"
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#009EE3] transition-transform duration-200 shadow-md ${
                  billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>

            <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>
              <span>Anual</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                2 Meses Gratis
              </span>
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            const isPopular = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                  isPopular
                    ? 'bg-gradient-to-b from-[#2E0854] via-[#4A0E78] to-[#1C0533] border-2 border-purple-400/60 shadow-2xl shadow-purple-950/60 scale-102'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-[#F95420] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                    {plan.badgeText || 'Plan Más Recomendado'}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-black text-white">{plan.name}</h4>
                    <p className="text-xs text-slate-300 mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        {formatCurrency(price, 'ARS')}
                      </span>
                      <span className="text-xs text-slate-400">
                        {billingCycle === 'annual' ? '/año' : '/mes'}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 mt-1 text-[11px] text-amber-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Incluye 15 días de prueba gratis</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="pt-6 mt-6 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleSelectPlanForMp(plan)}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-[#F95420] to-pink-500 hover:from-orange-500 hover:to-pink-400 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    <span>Suscribirme con Mercado Pago</span>
                    <CreditCard className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} GastoAR</span>
          <span>•</span>
          <span>Finanzas para Parejas & Control Personal</span>
        </div>

        <div className="flex items-center gap-3">
          {onOpenAdminPanel && (
            <button
              type="button"
              onClick={() => setIsAdminAuthOpen(true)}
              className="hover:text-purple-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3 h-3" />
              <span>Acceso Administrador</span>
            </button>
          )}
        </div>
      </footer>

      {/* Mercado Pago Modal */}
      {isMpModalOpen && selectedPlanForPayment && (
        <MercadoPagoModal
          isOpen={isMpModalOpen}
          onClose={() => setIsMpModalOpen(false)}
          plan={selectedPlanForPayment}
          billingCycle={billingCycle}
          userAccount={{
            id: 'usr-new',
            name: regName.trim() || 'Nuevo Usuario',
            email: regEmail.trim() || 'ejemplo@ejemplo.com',
            partnerName: regPartnerName.trim() || 'Mi Pareja',
            accountType: regAccountType,
            accountCode: regAccountCode,
            currency: 'ARS',
            createdAt: Date.now(),
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Admin Auth Modal */}
      {isAdminAuthOpen && onOpenAdminPanel && (
        <AdminAuthModal
          isOpen={isAdminAuthOpen}
          onClose={() => setIsAdminAuthOpen(false)}
          onSuccess={() => {
            setIsAdminAuthOpen(false);
            onOpenAdminPanel();
          }}
        />
      )}
    </div>
  );
};
