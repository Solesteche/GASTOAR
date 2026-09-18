import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface MobileLoginScreenProps {
  onBack?: () => void;
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onGoogleLogin?: () => void;
  onGoToRegister: () => void;
  onForgotPassword?: (email: string) => void;
  onDemoLogin?: () => void;
}

export const MobileLoginScreen: React.FC<MobileLoginScreenProps> = ({
  onBack,
  onLogin,
  onGoogleLogin,
  onGoToRegister,
  onForgotPassword,
  onDemoLogin
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completá tu correo y contraseña');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await onLogin(email, password);
      if (!res.success && res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-white text-slate-800 flex flex-col justify-between p-6 select-none overflow-y-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pt-1 pb-4">
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
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            Pantalla 3 · Inicio de Sesión
          </span>
          <div className="w-9 h-9" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5 pt-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ¡Bienvenido de nuevo!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Iniciá sesión para acceder a tu panel de finanzas.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tunombre@ejemplo.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#7928CA] focus:ring-3 focus:ring-purple-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#7928CA] focus:ring-3 focus:ring-purple-100 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#7928CA] focus:ring-purple-400 border-slate-300 rounded-sm"
              />
              <span className="font-medium">Recordarme</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                if (onForgotPassword && email) onForgotPassword(email);
              }}
              className="font-bold text-[#7928CA] hover:underline cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-[#7928CA] hover:bg-[#6818B8] text-white text-sm font-bold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Iniciando...</span>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            O continuá con
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Social / Alternative buttons */}
        <div className="grid grid-cols-2 gap-2.5">
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
              <span>Demo Rápida</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer link to Register */}
      <div className="pt-6 pb-2 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          ¿No tenés una cuenta?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-bold text-[#7928CA] hover:underline cursor-pointer"
          >
            Registrate aquí
          </button>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-2xl border border-purple-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7928CA] flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Restablecer Contraseña</h3>
              <p className="text-xs text-slate-500">
                {forgotSent 
                  ? 'Te enviamos un enlace para restablecer tu clave. Revisá tu casilla o spam.' 
                  : 'Ingresá tu correo electrónico para recibir un enlace de recuperación.'}
              </p>
            </div>
            {!forgotSent ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="w-full py-2.5 rounded-xl bg-[#7928CA] text-white text-xs font-bold"
                >
                  Enviar enlace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSent(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Entendido
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
