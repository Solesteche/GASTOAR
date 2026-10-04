import React, { useState } from 'react';
import { Rocket, ArrowRight, X, Sparkles, UserCheck } from 'lucide-react';

interface OnboardingWelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkipTour: () => void;
  currentName?: string;
  onUpdateName?: (newName: string) => void;
}

export const OnboardingWelcomeModal: React.FC<OnboardingWelcomeModalProps> = ({
  isOpen,
  onStartTour,
  onSkipTour,
  currentName = '',
  onUpdateName,
}) => {
  const [nameInput, setNameInput] = useState(() => {
    const trimmed = (currentName || '').trim();
    if (trimmed && trimmed !== 'Mi Usuario' && trimmed !== 'Usuario') {
      return trimmed.split(/\s+/)[0];
    }
    return '';
  });

  if (!isOpen) return null;

  const handleStart = () => {
    if (nameInput.trim() && onUpdateName) {
      onUpdateName(nameInput.trim());
    }
    onStartTour();
  };

  const handleSkip = () => {
    if (nameInput.trim() && onUpdateName) {
      onUpdateName(nameInput.trim());
    }
    onSkipTour();
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#150d2a] rounded-3xl p-6 sm:p-7 shadow-2xl border border-purple-100 dark:border-purple-900/60 overflow-hidden space-y-5 animate-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close "X" button */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/70 text-slate-500 dark:text-purple-300 flex items-center justify-center transition-colors cursor-pointer"
          title="Omitir"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center pt-2 space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7928CA] to-[#9B30FF] text-white shadow-lg shadow-purple-500/30">
            <Rocket className="w-7 h-7" />
          </div>

          <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            ¡Te damos la bienvenida a GastoAR! 🚀
          </h2>

          <p className="text-sm font-medium text-slate-600 dark:text-purple-200 leading-relaxed max-w-sm mx-auto">
            Configuremos tu cuenta en menos de 1 minuto para que empieces a tomar el control de tus finanzas.
          </p>
        </div>

        {/* Optional Name Input if not set yet */}
        {(!currentName || currentName === 'Mi Usuario' || currentName === 'Usuario') && (
          <div className="bg-purple-50/80 dark:bg-purple-950/40 rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/50 space-y-1.5">
            <label htmlFor="onboarding-user-name" className="block text-xs font-bold text-slate-700 dark:text-purple-200">
              ¿Cómo te gustaría que te llamemos?
            </label>
            <div className="relative">
              <input
                id="onboarding-user-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ej. Sol, Martín, Lucas..."
                maxLength={25}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#1d1238] border border-purple-200 dark:border-purple-800 text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7928CA]"
              />
            </div>
          </div>
        )}

        {/* Feature summary preview badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-600 dark:text-purple-200">
          <div className="bg-slate-50 dark:bg-purple-950/30 p-2.5 rounded-2xl border border-slate-100 dark:border-purple-900/30">
            <span className="block text-base mb-0.5">💰</span>
            Saldo inicial
          </div>
          <div className="bg-slate-50 dark:bg-purple-950/30 p-2.5 rounded-2xl border border-slate-100 dark:border-purple-900/30">
            <span className="block text-base mb-0.5">🎯</span>
            Presupuesto
          </div>
          <div className="bg-slate-50 dark:bg-purple-950/30 p-2.5 rounded-2xl border border-slate-100 dark:border-purple-900/30">
            <span className="block text-base mb-0.5">📊</span>
            Alertas en vivo
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Configurar en 3 pasos</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 dark:text-purple-300 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer text-center"
          >
            Omitir e ir al panel
          </button>
        </div>
      </div>
    </div>
  );
};
