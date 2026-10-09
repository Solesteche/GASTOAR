import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Users, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Phone,
  Heart
} from 'lucide-react';
import { SubscriptionPlanId } from '../../types';

interface MobileRegisterScreenProps {
  onBack?: () => void;
  onRegister: (data: {
    name: string;
    lastName?: string;
    phone?: string;
    email: string;
    password?: string;
    accountType: 'pareja' | 'individual';
    partnerName?: string;
    currency: string;
    accountCode?: string;
    selectedPlanId?: SubscriptionPlanId;
  }) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onGoogleLogin?: () => void;
  onGoToLogin: () => void;
  onDemoLogin?: () => void;
}

export const MobileRegisterScreen: React.FC<MobileRegisterScreenProps> = ({
  onBack,
  onRegister,
  onGoogleLogin,
  onGoToLogin,
  onDemoLogin
}) => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<'pareja' | 'individual'>('pareja');
  const [partnerName, setPartnerName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor ingresá tu nombre');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor ingresá un correo electrónico válido');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (accountType === 'pareja' && !partnerName.trim()) {
      setError('Ingresá el nombre de tu pareja o elegí cuenta individual');
      return;
    }
    if (!acceptTerms) {
      setError('Debés aceptar los términos y condiciones para continuar');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onRegister({
        name: name.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase(),
        password,
        accountType,
        partnerName: accountType === 'pareja' ? partnerName.trim() : undefined,
        currency: 'ARS',
        accountCode: 'COMPARTIDA-' + Math.floor(1000 + Math.random() * 9000),
        selectedPlanId: accountType === 'pareja' ? 'pareja' : 'individual',
      });

      if (!res.success && res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-white text-slate-800 flex flex-col justify-between p-5 sm:p-6 select-none overflow-y-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pt-1 pb-3">
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
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 shadow-xs">
            Registro Oficial GastoAR
          </span>
          <div className="w-9 h-9" />
        </div>

        {/* Tab Toggle: Iniciar Sesión / Registrarse */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-4 border border-slate-200/80">
          <button
            type="button"
            onClick={onGoToLogin}
            className="py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            className="py-2 text-xs font-bold rounded-xl bg-white text-[#7928CA] shadow-sm transition-all cursor-default"
          >
            Registrarse
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Creá tu cuenta gratis
          </h2>
          <p className="text-xs text-slate-500">
            Comenzá a organizar tus gastos y cuotas con 15 días de prueba completa.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Account Type Toggle */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
              Modalidad de Uso
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('pareja')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  accountType === 'pareja'
                    ? 'border-[#7928CA] bg-purple-50/60 ring-2 ring-purple-100'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  accountType === 'pareja' ? 'bg-[#7928CA] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Heart className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-tight">En Pareja</p>
                  <p className="text-[10px] text-slate-500 truncate">Finanzas 50/50</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('individual')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  accountType === 'individual'
                    ? 'border-[#7928CA] bg-purple-50/60 ring-2 ring-purple-100'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  accountType === 'individual' ? 'bg-[#7928CA] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Individual</p>
                  <p className="text-[10px] text-slate-500 truncate">Uso Personal</p>
                </div>
              </button>
            </div>
          </div>

          {/* Name & Last Name */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Nombre *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#7928CA] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Apellido
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#7928CA] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Partner Name (if pareja) */}
          {accountType === 'pareja' && (
            <div className="space-y-1 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-purple-900 block flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-500" />
                <span>Nombre de tu Pareja *</span>
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Ej. Sofía, Lucas..."
                required
                className="w-full px-3 py-2.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#7928CA] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
              />
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Correo Electrónico *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tunombre@ejemplo.com"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#7928CA] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Contraseña (mínimo 6 caracteres) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#7928CA] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2 pt-0.5">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#7928CA] focus:ring-purple-400 border-slate-300"
            />
            <label htmlFor="acceptTerms" className="text-[11px] text-slate-500 leading-tight cursor-pointer">
              Acepto los términos del servicio y política de privacidad de GastoAR.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7928CA] to-[#9B30FF] hover:from-[#6B21B2] hover:to-[#8824E3] text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Creando cuenta...</span>
            ) : (
              <>
                <span>Crear Cuenta Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            O registrate con
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Social / Alternative buttons */}
        <div className="grid grid-cols-2 gap-2">
          {onGoogleLogin && (
            <button
              type="button"
              onClick={onGoogleLogin}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
              </svg>
              <span>Google</span>
            </button>
          )}

          {onDemoLogin && (
            <button
              type="button"
              onClick={onDemoLogin}
              className="py-2.5 px-3 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-xs font-bold text-purple-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Modo Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer link to Login */}
      <div className="pt-4 pb-1 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          ¿Ya tenés una cuenta?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            className="font-bold text-[#7928CA] hover:underline cursor-pointer"
          >
            Iniciá sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
};
