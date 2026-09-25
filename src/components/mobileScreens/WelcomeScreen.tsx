import React from 'react';
import { Sparkles, ArrowRight, Users } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onExploreDemo?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onLogin,
  onExploreDemo
}) => {
  return (
    <div className="relative w-full h-full min-h-[580px] bg-white text-slate-800 flex flex-col justify-between p-6 select-none overflow-y-auto">
      {/* Top indicator tag */}
      <div className="pt-2 flex justify-between items-center z-10">
        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
          Pantalla 2 · Bienvenida
        </span>
        {onExploreDemo && (
          <button
            type="button"
            onClick={onExploreDemo}
            className="text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors cursor-pointer"
          >
            Modo Demo
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-8 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500 max-w-sm mx-auto">
        {/* Text presentation */}
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Bienvenido a <span className="text-[#2E0854]">Gasto</span><span className="text-[#9333EA]">AR</span>
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-xs font-bold text-[#7928CA]">
            <span>Registra, Controla, Ahorra</span>
          </div>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed pt-2">
            Organiza tu gastos, controla las cuotas con tarjeta, planifica y alcanza tus metas.
          </p>
        </div>

        {/* Feature Highlights Pills: SOLO Carga por Voz Y Finanzas compartidas */}
        <div className="flex justify-center items-center pt-1">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-purple-900 bg-purple-50 px-4 py-2 rounded-full border border-purple-200/80 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Carga por Voz Y Finanzas compartidas</span>
            <Users className="w-3.5 h-3.5 text-violet-600 shrink-0" />
          </span>
        </div>

        {/* Dot carousel indicator */}
        <div className="flex items-center gap-1.5 pt-4">
          <div className="w-5 h-1.5 rounded-full bg-[#7928CA]" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        </div>
      </div>

      {/* Bottom CTAs */}
      <div className="w-full space-y-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onGetStarted}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#7928CA] to-[#9B30FF] hover:from-[#6B21B2] hover:to-[#8824E3] text-white text-sm font-bold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Comenzar</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onLogin}
            className="text-xs font-semibold text-slate-600 hover:text-[#7928CA] transition-colors py-1 cursor-pointer"
          >
            ¿Ya tenés una cuenta? <span className="font-bold text-[#7928CA] underline decoration-purple-300 underline-offset-2">Iniciar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
