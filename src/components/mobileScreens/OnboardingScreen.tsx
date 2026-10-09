import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  CreditCard, 
  Users, 
  Target, 
  Check, 
  Receipt,
  Mic,
  CalendarClock
} from 'lucide-react';

interface OnboardingScreenProps {
  onFinish: () => void;
  onSkip: () => void;
  onGoToRegister?: () => void;
  onGoToLogin?: () => void;
}

const ONBOARDING_SLIDES = [
  {
    id: 'expenses',
    title: 'Control Inteligente y Carga con IA',
    description: 'Registrá tus compras en segundos con texto o dictando un audio por voz. Categorización y montos automáticos.',
    badge: 'Inteligencia Artificial',
    icon: Mic,
    color: 'from-purple-500 to-indigo-600',
    accent: '#7928CA',
    illustration: (
      <div className="relative w-44 h-44 flex items-center justify-center">
        <div className="absolute inset-0 bg-purple-100 rounded-full blur-xl opacity-70" />
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-[#7928CA] to-[#9B30FF] p-4 shadow-xl shadow-purple-500/30 flex flex-col items-center justify-center text-white relative z-10">
          <Mic className="w-10 h-10 mb-2 stroke-[2.2] animate-pulse" />
          <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
            "Cargué $4.500 en súper"
          </span>
        </div>
      </div>
    )
  },
  {
    id: 'cards',
    title: 'Cuotas y Vencimientos en Argentina',
    description: 'Gestioná tus resúmenes de tarjetas de crédito, fechas de cierre y recordatorios de pago con anticipación personalizada.',
    badge: 'Tarjetas & Vencimientos',
    icon: CalendarClock,
    color: 'from-orange-500 to-amber-600',
    accent: '#F95420',
    illustration: (
      <div className="relative w-44 h-44 flex items-center justify-center">
        <div className="absolute inset-0 bg-orange-100 rounded-full blur-xl opacity-70" />
        <div className="w-36 h-24 rounded-2xl bg-gradient-to-tr from-[#F95420] to-[#FF8555] p-3 shadow-xl shadow-orange-500/30 flex flex-col justify-between text-white relative z-10">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-wider">Visa Galicia</span>
            <CreditCard className="w-4 h-4 opacity-80" />
          </div>
          <div className="text-[10px] font-mono opacity-90">•••• 4821</div>
          <div className="flex justify-between text-[9px] font-bold">
            <span>Cierre: 20</span>
            <span className="bg-white/25 px-1.5 py-0.5 rounded">Vence: 05</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'couple',
    title: 'Finanzas con Cuenta Compartida',
    description: 'Dividí gastos equitativamente, conocé en todo momento quién le debe a quién y liquidá saldos con un solo toque.',
    badge: 'Cuenta Compartida',
    icon: Users,
    color: 'from-violet-500 to-purple-600',
    accent: '#7928CA',
    illustration: (
      <div className="relative w-44 h-44 flex items-center justify-center">
        <div className="absolute inset-0 bg-violet-100 rounded-full blur-xl opacity-70" />
        <div className="relative z-10 flex items-center -space-x-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-1 shadow-lg text-white flex items-center justify-center font-black text-xl">
            Vos
          </div>
          <div className="w-10 h-10 rounded-full bg-white shadow-md border border-purple-100 flex items-center justify-center z-20 text-[#7928CA]">
            <Users className="w-5 h-5" />
          </div>
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 p-1 shadow-lg text-white flex items-center justify-center font-black text-sm text-center px-1">
            Cuenta Compartida
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'budgets',
    title: 'Presupuestos y Metas de Ahorro',
    description: 'Fijá límites por categoría para no pasarte, creá cajas de ahorro para tus proyectos y alcanzá la tranquilidad financiera.',
    badge: 'Metas Claras',
    icon: Target,
    color: 'from-emerald-500 to-teal-600',
    accent: '#10B981',
    illustration: (
      <div className="relative w-44 h-44 flex items-center justify-center">
        <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-70" />
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 p-4 shadow-xl shadow-emerald-500/30 flex flex-col items-center justify-center text-white relative z-10">
          <Target className="w-10 h-10 mb-2 stroke-[2.2]" />
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-1">
            <div className="bg-white h-full w-4/5 rounded-full" />
          </div>
          <span className="text-[10px] font-bold mt-1.5">Meta 80% alcanzada</span>
        </div>
      </div>
    )
  }
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onFinish,
  onSkip,
  onGoToRegister,
  onGoToLogin
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  const slide = ONBOARDING_SLIDES[currentSlide];
  const isLast = currentSlide === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (onGoToRegister) {
        onGoToRegister();
      } else {
        onFinish();
      }
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    const threshold = 40;

    if (diffX > threshold && !isLast) {
      handleNext();
    } else if (diffX < -threshold && currentSlide > 0) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    touchStartX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    const threshold = 40;

    if (diffX > threshold && !isLast) {
      handleNext();
    } else if (diffX < -threshold && currentSlide > 0) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div 
      className="relative w-full h-full min-h-[580px] bg-white text-slate-800 flex flex-col justify-between p-5 sm:p-6 select-none overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header with Back / Skip */}
      <div className="flex items-center justify-between pt-1">
        {currentSlide > 0 ? (
          <button
            type="button"
            onClick={handlePrev}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            title="Anterior"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}

        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 shadow-xs">
          Guía Rápida GastoAR
        </span>

        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 transition-colors cursor-pointer"
        >
          Omitir
        </button>
      </div>

      {/* Main Slide Presentation */}
      <div className="my-auto py-5 flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
        {/* Dynamic Graphic */}
        <div>{slide.illustration}</div>

        {/* Slide Category Pill */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-black text-slate-700">
          <slide.icon className="w-3.5 h-3.5 text-purple-600" />
          <span>{slide.badge}</span>
        </span>

        {/* Text */}
        <div className="space-y-1.5 max-w-sm px-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            {slide.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom Progress & Action Controls */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        {/* On the last slide, present both Register and Login buttons */}
        {isLast ? (
          <div className="space-y-2 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => {
                if (onGoToRegister) onGoToRegister();
                else onFinish();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7928CA] to-[#9B30FF] hover:from-[#6B21B2] hover:to-[#8824E3] text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Crear cuenta gratis</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onGoToLogin && (
              <button
                type="button"
                onClick={onGoToLogin}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-purple-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ¿Ya tenés cuenta? Iniciar Sesión
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {/* Carousel Dots */}
            <div className="flex items-center gap-1.5">
              {ONBOARDING_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide
                      ? 'w-7 bg-[#7928CA]'
                      : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                  title={`Ir al paso ${idx + 1}`}
                />
              ))}
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleNext}
              className="py-3 px-5 rounded-2xl bg-[#7928CA] hover:bg-[#6818B8] text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
