import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { GastoArIcon } from '../GastoArLogo';

interface SplashScreenProps {
  onFinish?: () => void;
  autoAdvance?: boolean;
  onNavigateTo?: (screenId: string) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  autoAdvance = true,
  onNavigateTo
}) => {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(45), 300);
    const timer2 = setTimeout(() => setProgress(80), 700);
    const timer3 = setTimeout(() => setProgress(100), 1200);

    let finishTimer: NodeJS.Timeout;
    if (autoAdvance) {
      finishTimer = setTimeout(() => {
        if (onFinish) onFinish();
        else if (onNavigateTo) onNavigateTo('welcome');
      }, 1600);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [autoAdvance, onFinish, onNavigateTo]);

  return (
    <div className="relative w-full h-full min-h-[580px] bg-gradient-to-b from-[#130826] via-[#1A0B33] to-[#0D041A] text-white flex flex-col justify-between items-center p-8 select-none overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top indicator tag */}
      <div className="pt-4 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-medium text-purple-200">
          <Sparkles className="w-3 h-3 text-orange-400" />
          <span>Pantalla 1 · Intro / Splash</span>
        </div>
      </div>

      {/* Center Brand Identity */}
      <div className="flex flex-col items-center text-center z-10 my-auto space-y-4 animate-in fade-in zoom-in-95 duration-700">
        {/* Official Brand Icon with Ambient Glow */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#7928CA] via-[#D946EF] to-[#F95420] rounded-3xl blur-xl opacity-60 group-hover:opacity-90 transition duration-500" />
          <GastoArIcon size={96} className="relative z-10 shadow-2xl" />
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5 pt-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center">
            <span>Gasto</span>
            <span className="text-[#D946EF] ml-0.5">AR</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 font-bold tracking-wide">
            Registra, Controla, Ahorra
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-[#7E22CE] via-[#D946EF] to-[#F97316] rounded-full mx-auto mt-1" />
        </div>
      </div>

      {/* Bottom Progress & Skip CTA */}
      <div className="w-full max-w-xs z-10 pb-6 space-y-4">
        {/* Sleek Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-xs">
            <div
              className="h-full bg-gradient-to-r from-[#7928CA] to-[#F95420] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-purple-300/60 font-medium px-1">
            <span>Iniciando entorno...</span>
            <span>{progress}%</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onFinish) onFinish();
            else if (onNavigateTo) onNavigateTo('welcome');
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-purple-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <span>Continuar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
