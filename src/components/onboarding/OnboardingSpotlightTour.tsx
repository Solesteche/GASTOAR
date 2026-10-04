import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  ArrowRight,
  Plus,
  Sliders,
  DollarSign
} from 'lucide-react';

export interface TourStep {
  id: number;
  targetId: string;
  title: string;
  text: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    targetId: 'tour-available-balance',
    title: '1. Ingresá tu dinero disponible 💰',
    text: 'Registrá con cuánto dinero arrancás hoy (efectivo, banco, billeteras virtuales). Esto te servirá de base para medir tu capacidad de gasto.',
    primaryActionLabel: 'Cargar mi saldo',
    secondaryActionLabel: 'Siguiente',
  },
  {
    id: 2,
    targetId: 'tour-budget',
    title: '2. Definí tus límites de gasto 🎯',
    text: 'Establecé cuánto querés gastar este mes por categoría (Alquiler, Comida, Entretenimiento, etc.). Podés usar tus valores reales o una sugerencia rápida.',
    primaryActionLabel: 'Armar mi presupuesto',
    secondaryActionLabel: 'Siguiente',
  },
  {
    id: 3,
    targetId: 'tour-add-expense',
    title: '3. Registrá tu primer movimiento ➕',
    text: 'Cada vez que compres algo, tocá este botón. Elegí la categoría, poné el monto ¡y listo! Solo te tomará 5 segundos.',
    primaryActionLabel: 'Probar registrar gasto',
    secondaryActionLabel: 'Siguiente',
  },
  {
    id: 4,
    targetId: 'tour-alerts',
    title: '4. Mirá cómo evoluciona tu mes 📊',
    text: 'GastoAR te avisará automáticamente en naranja cuando te acerques a tu límite y en rojo si te excedés, para que nunca tengas sorpresas.',
    primaryActionLabel: '¡Entendido, empezar a usar!',
  },
];

interface OnboardingSpotlightTourProps {
  isActive: boolean;
  onCompleteTour: () => void;
  onDismissTour: () => void;
  onSaveInitialBalance?: (amount: number) => void;
  onOpenBudgetModal?: () => void;
  onOpenTransactionModal?: () => void;
}

export const OnboardingSpotlightTour: React.FC<OnboardingSpotlightTourProps> = ({
  isActive,
  onCompleteTour,
  onDismissTour,
  onSaveInitialBalance,
  onOpenBudgetModal,
  onOpenTransactionModal,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [initialBalanceInput, setInitialBalanceInput] = useState('');
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Update target rect calculation
  const updateRect = useCallback(() => {
    if (!isActive || !step) return;

    const el =
      document.querySelector(`[data-tour="${step.targetId}"]`) ||
      document.getElementById(step.targetId);

    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      
      // Auto-scroll target into center view with margin
      const inView =
        rect.top >= 80 &&
        rect.bottom <= window.innerHeight - 80;

      if (!inView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Recalculate slightly after scroll
        setTimeout(() => {
          const updated = el.getBoundingClientRect();
          setTargetRect(updated);
        }, 300);
      }
    } else {
      // Fallback: If element not found in DOM yet, center spotlight
      setTargetRect(null);
    }
  }, [isActive, step]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect]);

  // Keyboard navigation (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === 'Escape') {
        onDismissTour();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onDismissTour]);

  if (!isActive || !step) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onCompleteTour();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handlePrimaryAction = () => {
    if (step.id === 1) {
      const parsed = parseFloat(initialBalanceInput.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed > 0 && onSaveInitialBalance) {
        onSaveInitialBalance(parsed);
      }
      handleNext();
    } else if (step.id === 2) {
      if (onOpenBudgetModal) {
        onOpenBudgetModal();
      }
      handleNext();
    } else if (step.id === 3) {
      if (onOpenTransactionModal) {
        onOpenTransactionModal();
      }
      handleNext();
    } else {
      onCompleteTour();
    }
  };

  // Tooltip positioning
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      // Centered fallback
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
      };
    }

    const margin = 16;
    const tooltipWidth = Math.min(window.innerWidth - 32, 420);
    const estimatedHeight = 240;

    let top: number;
    let left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, targetRect.left + (targetRect.width - tooltipWidth) / 2));

    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow >= estimatedHeight + margin) {
      // Place below target
      top = targetRect.bottom + margin;
    } else if (spaceAbove >= estimatedHeight + margin) {
      // Place above target
      top = Math.max(16, targetRect.top - estimatedHeight - margin);
    } else {
      // Clamped inside viewport
      top = Math.max(70, window.innerHeight - estimatedHeight - 20);
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 9999,
    };
  };

  const pad = 6;
  const highlightStyle: React.CSSProperties | undefined = targetRect
    ? {
        position: 'fixed',
        top: `${Math.max(0, targetRect.top - pad)}px`,
        left: `${Math.max(0, targetRect.left - pad)}px`,
        width: `${targetRect.width + pad * 2}px`,
        height: `${targetRect.height + pad * 2}px`,
        borderRadius: '24px',
        boxShadow: '0 0 0 9999px rgba(10, 3, 20, 0.78)',
        zIndex: 9995,
        pointerEvents: 'none',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    : undefined;

  return (
    <>
      {/* Dimmed Overlay Backdrop with cutout box-shadow spotlight */}
      {targetRect ? (
        <div
          style={highlightStyle}
          className="border-2 border-purple-400 dark:border-purple-300 ring-4 ring-purple-500/30 animate-pulse duration-1000"
        />
      ) : (
        <div className="fixed inset-0 z-[9995] bg-black/75 backdrop-blur-xs transition-opacity duration-300" />
      )}

      {/* Floating Interactive Tooltip */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className="bg-white dark:bg-[#160d2b] rounded-3xl p-5 sm:p-6 shadow-2xl border border-purple-200 dark:border-purple-800/80 space-y-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Tooltip Header: Step indicator & Close button */}
        <div className="flex items-center justify-between gap-3 pb-1 border-b border-purple-100 dark:border-purple-900/40">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-[#7928CA] dark:text-purple-300">
              Paso {step.id} de 4
            </span>
          </div>

          <button
            type="button"
            onClick={onDismissTour}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/80 text-slate-500 dark:text-purple-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Salir del tour (X)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            {step.title}
          </h3>
          <p className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-purple-200 leading-relaxed">
            {step.text}
          </p>
        </div>

        {/* Step 1 Quick Numeric Input */}
        {step.id === 1 && (
          <div className="bg-purple-50/80 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-1.5">
            <label htmlFor="tour-initial-balance" className="block text-[11px] font-bold text-slate-700 dark:text-purple-200">
              Ingresá tu saldo actual (opcional):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                $
              </span>
              <input
                id="tour-initial-balance"
                type="number"
                inputMode="decimal"
                value={initialBalanceInput}
                onChange={(e) => setInitialBalanceInput(e.target.value)}
                placeholder="150000"
                className="w-full pl-7 pr-3 py-2 rounded-xl bg-white dark:bg-[#1e133a] border border-purple-200 dark:border-purple-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7928CA]"
              />
            </div>
          </div>
        )}

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                idx === currentStepIndex
                  ? 'w-6 bg-[#F95420]'
                  : 'w-2 bg-slate-200 dark:bg-purple-900 hover:bg-slate-300'
              }`}
              title={`Ir al paso ${s.id}`}
            />
          ))}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-purple-300 hover:bg-slate-100 dark:hover:bg-purple-950 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step.secondaryActionLabel && (
              <button
                type="button"
                onClick={handleNext}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-purple-800 text-xs font-bold text-slate-700 dark:text-purple-200 hover:bg-slate-50 dark:hover:bg-purple-950/60 transition-colors cursor-pointer"
              >
                {step.secondaryActionLabel}
              </button>
            )}

            <button
              type="button"
              onClick={handlePrimaryAction}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs sm:text-[13px] font-black shadow-md shadow-orange-500/25 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span>{step.primaryActionLabel}</span>
              {isLastStep ? <Check className="w-4 h-4 stroke-[3]" /> : <ChevronRight className="w-4 h-4 stroke-[3]" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
