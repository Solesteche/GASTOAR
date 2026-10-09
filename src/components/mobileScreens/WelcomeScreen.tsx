import React from 'react';
import { Sparkles, ArrowRight, Users, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { GastoArIcon } from '../GastoArLogo';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onCreateAccount?: () => void;
  onLogin: () => void;
  onExploreDemo?: () => void;
  onGoogleLogin?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onCreateAccount,
  onLogin,
  onExploreDemo,
  onGoogleLogin
}) => {
  const handleRegisterClick = onCreateAccount || onGetStarted;

  return (
    <div className="relative w-full h-full min-h-[580px] bg-white text-slate-800 flex flex-col justify-between p-5 sm:p-6 select-none overflow-y-auto">
      {/* Top Header Bar */}
      <div className="pt-1 flex justify-between items-center z-10">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 shadow-xs">
            GastoAR Móvil
          </span>
        </div>
        {onExploreDemo && (
          <button
            type="button"
            onClick={onExploreDemo}
            className="text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors px-2.5 py-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer"
          >
            Modo Demo
          </button>
        )}
      </div>

      {/* Main Hero & Illustration Graphic */}
      <div className="my-auto py-4 flex flex-col items-center text-center space-y-5 animate-in fade-in duration-500 max-w-sm mx-auto">
        
        {/* Visual Graphic: Modern 3D Floating Financial Card & Badges */}
        <div className="relative w-full max-w-[280px] h-48 flex items-center justify-center">
          {/* Ambient Purple Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-pink-500/15 to-orange-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Background Slanted Card (Debit / Credit) */}
          <div className="absolute -top-1 -right-1 w-44 h-28 rounded-2xl bg-gradient-to-tr from-[#2E0854] to-[#7928CA] p-3 text-white shadow-xl shadow-purple-900/20 transform rotate-6 border border-purple-400/30 flex flex-col justify-between select-none opacity-85">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono tracking-wider text-purple-200">GastoAR Platinum</span>
              <div className="w-5 h-3.5 rounded bg-amber-400/80" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-purple-100">•••• 8924</div>
              <div className="flex justify-between items-center text-[8px] text-purple-200 mt-0.5">
                <span>EXP 08/29</span>
                <span className="font-bold">Finanzas 50/50</span>
              </div>
            </div>
          </div>

          {/* Main Foreground Card: Smart Balance & Analytics */}
          <div className="relative z-10 w-52 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 border border-purple-100 shadow-xl shadow-purple-500/15 text-left transform -rotate-3 transition-transform hover:rotate-0 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GastoArIcon size={26} />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Saldo Disponible</p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">$ 348.500</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 text-[10px]">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                +18.4% ahorro
              </span>
              <span className="text-slate-400 font-medium">Cuotas al día</span>
            </div>
          </div>

          {/* Floating Pill: Carga por Voz IA */}
          <div className="absolute -bottom-2 -left-2 z-20 bg-white px-2.5 py-1 rounded-full shadow-md border border-purple-100 flex items-center gap-1.5 text-[10px] font-bold text-purple-900 animate-bounce duration-1000">
            <Sparkles className="w-3 h-3 text-[#7928CA]" />
            <span>Carga con IA</span>
          </div>

          {/* Floating Pill: En Pareja */}
          <div className="absolute -top-2 left-2 z-20 bg-white px-2.5 py-1 rounded-full shadow-md border border-purple-100 flex items-center gap-1.5 text-[10px] font-bold text-violet-900">
            <Users className="w-3 h-3 text-pink-500" />
            <span>Finanzas en Pareja</span>
          </div>
        </div>

        {/* Text Presentation */}
        <div className="space-y-2 pt-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Toma el control de <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E0854] via-[#7928CA] to-[#F95420]">
              tus finanzas
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
            Registrá tus gastos diarios, organizá tus tarjetas y cuotas, y alcanzá tus metas en pareja en un solo lugar.
          </p>
        </div>

        {/* Dot Carousel Indicator */}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-6 h-1.5 rounded-full bg-[#7928CA]" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        </div>
      </div>

      {/* Bottom Action CTAs */}
      <div className="w-full space-y-2.5 pt-3 border-t border-slate-100">
        {/* Primary CTA: Crear cuenta / Comenzar */}
        <button
          type="button"
          onClick={handleRegisterClick}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7928CA] to-[#9B30FF] hover:from-[#6B21B2] hover:to-[#8824E3] text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Crear cuenta</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Secondary CTA: Iniciar sesión */}
        <button
          type="button"
          onClick={onLogin}
          className="w-full py-3 px-4 rounded-2xl border-2 border-purple-200/80 hover:border-[#7928CA] text-[#7928CA] font-bold text-xs sm:text-sm bg-purple-50/30 hover:bg-purple-50/60 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <span>Iniciar sesión</span>
        </button>

        {/* Google Sign-in */}
        {onGoogleLogin && (
          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
            </svg>
            <span>Continuar con Google</span>
          </button>
        )}

        {/* Tutorial Guide Link */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onGetStarted}
            className="text-[11px] font-semibold text-slate-500 hover:text-[#7928CA] transition-colors cursor-pointer"
          >
            Ver cómo funciona (Tutorial de 1 minuto) →
          </button>
        </div>
      </div>
    </div>
  );
};
