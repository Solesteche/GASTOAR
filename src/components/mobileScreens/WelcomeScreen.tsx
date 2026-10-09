import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Mic, 
  ChevronLeft, 
  ChevronRight,
  Receipt,
  Scale
} from 'lucide-react';
import { GastoArIcon } from '../GastoArLogo';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onCreateAccount?: () => void;
  onLogin: () => void;
  onExploreDemo?: () => void;
  onGoogleLogin?: () => void;
}

interface SlideData {
  id: string;
  badge: string;
  titlePart1: string;
  titleHighlight: string;
  subtitle: string;
  pillTop: { icon: any; text: string; color: string; textColor: string };
  pillBottom: { icon: any; text: string; color: string; textColor: string };
  renderGraphic: () => React.ReactNode;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onCreateAccount,
  onLogin,
  onExploreDemo,
  onGoogleLogin
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const handleRegisterClick = onCreateAccount || onGetStarted;

  // Touch and drag swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  const SLIDES: SlideData[] = [
    {
      id: 'control',
      badge: 'Control Inteligente',
      titlePart1: 'Toma el control de ',
      titleHighlight: 'tus finanzas',
      subtitle: 'Registrá tus gastos diarios, organizá tus tarjetas y cuotas, y alcanzá tus metas en tu cuenta compartida.',
      pillTop: {
        icon: Users,
        text: 'Cuenta Compartida',
        color: 'text-purple-600',
        textColor: 'text-purple-900'
      },
      pillBottom: {
        icon: Sparkles,
        text: 'Carga con IA',
        color: 'text-[#7928CA]',
        textColor: 'text-purple-900'
      },
      renderGraphic: () => (
        <div className="relative w-full max-w-[280px] h-48 flex items-center justify-center">
          {/* Ambient Purple Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-pink-500/15 to-orange-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Background Slanted Card */}
          <div className="absolute -top-1 -right-1 w-44 h-28 rounded-2xl bg-gradient-to-tr from-[#2E0854] to-[#7928CA] p-3 text-white shadow-xl shadow-purple-900/20 transform rotate-6 border border-purple-400/30 flex flex-col justify-between select-none opacity-85">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono tracking-wider text-purple-200">GastoAR Platinum</span>
              <div className="w-5 h-3.5 rounded bg-amber-400/80" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-purple-100">•••• 8924</div>
              <div className="flex justify-between items-center text-[8px] text-purple-200 mt-0.5">
                <span>EXP 08/29</span>
                <span className="font-bold">Cuenta Compartida</span>
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
        </div>
      )
    },
    {
      id: 'shared',
      badge: 'Cuentas Compartidas',
      titlePart1: 'Finanzas claras en tu ',
      titleHighlight: 'cuenta compartida',
      subtitle: 'Dividí gastos equitativamente, conocé en todo momento quién le debe a quién y liquidá saldos al instante.',
      pillTop: {
        icon: Scale,
        text: 'División 50/50',
        color: 'text-indigo-600',
        textColor: 'text-indigo-900'
      },
      pillBottom: {
        icon: Users,
        text: 'Sincronización 24/7',
        color: 'text-purple-600',
        textColor: 'text-purple-900'
      },
      renderGraphic: () => (
        <div className="relative w-full max-w-[280px] h-48 flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Interactive Shared Balance Card */}
          <div className="relative z-10 w-60 rounded-2xl bg-white/95 backdrop-blur-md p-4 border border-purple-100 shadow-xl shadow-purple-500/15 text-left">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#7928CA]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Cuenta Compartida</p>
                  <p className="text-xs font-black text-slate-800">Gastos del Hogar</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Al día ✓
              </span>
            </div>

            {/* Split avatars & balance */}
            <div className="pt-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">V</span>
                  <span className="font-semibold text-slate-700">Vos pagaste</span>
                </div>
                <span className="font-bold text-slate-900">$ 42.600</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">C</span>
                  <span className="font-semibold text-slate-700">Miembro 2</span>
                </div>
                <span className="font-bold text-slate-900">$ 38.000</span>
              </div>
              <div className="mt-1 pt-1.5 border-t border-dashed border-slate-200 flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">Balance a liquidar:</span>
                <span className="font-bold text-emerald-600">Te deben $ 2.300</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cards_and_ai',
      badge: 'Tarjetas & Carga por Voz',
      titlePart1: 'Cuotas y tarjetas con ',
      titleHighlight: 'asistente por voz',
      subtitle: 'Dictá tus compras como si mandaras un WhatsApp y recibí alertas antes del cierre y vencimiento.',
      pillTop: {
        icon: Mic,
        text: 'Carga por Voz IA',
        color: 'text-pink-500',
        textColor: 'text-pink-900'
      },
      pillBottom: {
        icon: CreditCard,
        text: 'Control de Cuotas',
        color: 'text-amber-500',
        textColor: 'text-amber-900'
      },
      renderGraphic: () => (
        <div className="relative w-full max-w-[280px] h-48 flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 via-purple-500/15 to-pink-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Credit Card Mockup */}
          <div className="relative z-10 w-56 rounded-2xl bg-gradient-to-tr from-[#1E1B4B] via-[#4338CA] to-[#7928CA] p-3.5 text-white shadow-xl shadow-indigo-950/25 border border-indigo-400/30 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">Visa Signature</span>
              <div className="w-6 h-4 rounded bg-amber-400/90" />
            </div>
            
            <div className="py-2">
              <div className="text-[11px] font-mono tracking-widest text-indigo-100">•••• 6109</div>
              <p className="text-[10px] text-indigo-200 mt-0.5">3 cuotas pendientes: <strong className="text-white">$ 18.500</strong></p>
            </div>

            <div className="flex justify-between items-center text-[9px] pt-1 border-t border-white/10 text-indigo-200">
              <span>Cierre: 22 de mes</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold text-white">Vence: 06</span>
            </div>
          </div>

          {/* Floating voice badge */}
          <div className="absolute -bottom-2 -left-1 z-20 bg-white px-2.5 py-1 rounded-full shadow-md border border-purple-100 flex items-center gap-1.5 text-[10px] font-bold text-purple-900">
            <Mic className="w-3 h-3 text-[#7928CA] animate-pulse" />
            <span>"Cargué $6.200 en nafta"</span>
          </div>
        </div>
      )
    }
  ];

  const totalSlides = SLIDES.length;

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    const threshold = 40; // minimum distance to trigger swipe

    if (diffX > threshold) {
      // Swiped left -> next slide
      goToNextSlide();
    } else if (diffX < -threshold) {
      // Swiped right -> prev slide
      goToPrevSlide();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
  };

  // Mouse drag handlers for desktop preview
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

    if (diffX > threshold) {
      goToNextSlide();
    } else if (diffX < -threshold) {
      goToPrevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeSlide = SLIDES[currentSlide];

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
      {/* Top Header Bar */}
      <div className="pt-1 flex justify-between items-center z-10">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 shadow-xs">
            GastoAR Móvil
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {currentSlide + 1} de {totalSlides}
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

      {/* Main Hero & Illustration Graphic with Swipe Animation */}
      <div className="relative my-auto py-3 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto w-full">
        
        {/* Graphic container with floating pills */}
        <div className="relative w-full flex items-center justify-center">
          {/* Top Left Floating Pill */}
          <div className="absolute -top-2 left-3 z-20 bg-white px-2.5 py-1 rounded-full shadow-md border border-purple-100 flex items-center gap-1.5 text-[10px] font-bold transition-all duration-300">
            <activeSlide.pillTop.icon className={`w-3 h-3 ${activeSlide.pillTop.color}`} />
            <span className={activeSlide.pillTop.textColor}>{activeSlide.pillTop.text}</span>
          </div>

          {/* Bottom Left Floating Pill */}
          <div className="absolute -bottom-2 -left-1 z-20 bg-white px-2.5 py-1 rounded-full shadow-md border border-purple-100 flex items-center gap-1.5 text-[10px] font-bold transition-all duration-300">
            <activeSlide.pillBottom.icon className={`w-3 h-3 ${activeSlide.pillBottom.color}`} />
            <span className={activeSlide.pillBottom.textColor}>{activeSlide.pillBottom.text}</span>
          </div>

          {/* Slide graphic with key transition */}
          <div 
            key={activeSlide.id}
            className="animate-in fade-in zoom-in-95 duration-300 w-full flex justify-center"
          >
            {activeSlide.renderGraphic()}
          </div>

          {/* Swipe navigation arrows (desktop & tap friendly) */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goToPrevSlide(); }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200/60 flex items-center justify-center transition-colors cursor-pointer z-30"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goToNextSlide(); }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200/60 flex items-center justify-center transition-colors cursor-pointer z-30"
            title="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Text Presentation with smooth transition */}
        <div 
          key={`text-${activeSlide.id}`}
          className="space-y-1.5 pt-1 animate-in fade-in duration-300 px-2"
        >
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {activeSlide.titlePart1}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E0854] via-[#7928CA] to-[#F95420]">
              {activeSlide.titleHighlight}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
            {activeSlide.subtitle}
          </p>
        </div>

        {/* Dot Carousel Indicator - Interactive & Clickable with Touch Feedback */}
        <div className="flex items-center gap-2 pt-1">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? 'w-7 bg-[#7928CA] shadow-xs'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`Ir al slide ${idx + 1}: ${slide.badge}`}
              aria-label={`Ir al slide ${idx + 1}`}
            />
          ))}
        </div>
        <p className="text-[10px] text-slate-400 font-medium select-none">
          Deslizá con el dedo para ver más
        </p>
      </div>

      {/* Bottom Action CTAs */}
      <div className="w-full space-y-2.5 pt-2 border-t border-slate-100">
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
