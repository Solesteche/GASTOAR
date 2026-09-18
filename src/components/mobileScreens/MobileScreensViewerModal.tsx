import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  Play,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { SplashScreen } from './SplashScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { MobileLoginScreen } from './MobileLoginScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { MobileHomeScreen } from './MobileHomeScreen';
import { ProfileScreen } from './ProfileScreen';
import { SettingsScreen } from './SettingsScreen';
import { MobileSubscriptionScreen } from './MobileSubscriptionScreen';
import { CoupleProfile, Transaction, UserAccount, UserSubscription } from '../../types';

export type ScreenId = 'splash' | 'welcome' | 'login' | 'onboarding' | 'home' | 'profile' | 'settings' | 'subscription';

export interface ScreenMetadata {
  id: ScreenId;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  badgeColor: string;
}

export const SCREENS_CATALOG: ScreenMetadata[] = [
  {
    id: 'splash',
    number: 1,
    title: 'Intro / Splash Screen',
    subtitle: 'Primera impresión memorable',
    description: 'Muestra la identidad de marca, carga inicial fluida y genera impacto visual desde el primer segundo.',
    badgeColor: 'bg-purple-500'
  },
  {
    id: 'welcome',
    number: 2,
    title: 'Welcome Screen',
    subtitle: 'Propuesta de valor clave',
    description: 'Introduce la aplicación y comunica los beneficios centrales de forma amigable antes del registro.',
    badgeColor: 'bg-indigo-500'
  },
  {
    id: 'login',
    number: 3,
    title: 'Login Screen',
    subtitle: 'Acceso seguro e intuitivo',
    description: 'Permite a los usuarios acceder a su cuenta con correo/contraseña, biometría o login social seguro.',
    badgeColor: 'bg-blue-500'
  },
  {
    id: 'onboarding',
    number: 4,
    title: 'Onboarding Screen',
    subtitle: 'Educación interactiva',
    description: 'Guía paso a paso por las funciones más poderosas: control de gastos, cuotas, modo pareja y presupuestos.',
    badgeColor: 'bg-teal-500'
  },
  {
    id: 'home',
    number: 5,
    title: 'Home Screen',
    subtitle: 'El centro principal de acciones',
    description: 'El hub neurálgico donde el usuario consulta sus saldos, agrega gastos, carga por voz y ve alertas.',
    badgeColor: 'bg-violet-600'
  },
  {
    id: 'profile',
    number: 6,
    title: 'Profile Screen',
    subtitle: 'Gestión personal y cuenta',
    description: 'Administración de datos del usuario, avatar, plan activo, vinculación en pareja y métodos de pago.',
    badgeColor: 'bg-orange-500'
  },
  {
    id: 'settings',
    number: 7,
    title: 'Settings Screen',
    subtitle: 'Control total de la experiencia',
    description: 'Configuración de recordatorios, modo oscuro/claro, moneda ARS/USD, seguridad y centro de ayuda.',
    badgeColor: 'bg-slate-700'
  },
  {
    id: 'subscription',
    number: 8,
    title: 'Subscription Screen',
    subtitle: 'Monetización y Plan PRO',
    description: 'Ofrece el upgrade a funciones ilimitadas con selector mensual/anual y llamada a la acción irresistible.',
    badgeColor: 'bg-amber-500'
  }
];

interface MobileScreensViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScreen?: ScreenId;
  userAccount: UserAccount | null;
  profile: CoupleProfile;
  transactions: Transaction[];
  subscription?: UserSubscription | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenNewExpense: () => void;
  onOpenNewIncome: () => void;
  onOpenVoiceExpense: () => void;
  onOpenCloudSync?: () => void;
  onLogout: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const MobileScreensViewerModal: React.FC<MobileScreensViewerModalProps> = ({
  isOpen,
  onClose,
  initialScreen = 'home',
  userAccount,
  profile,
  transactions,
  subscription,
  isDarkMode,
  onToggleDarkMode,
  onNavigateToTab,
  onOpenNewExpense,
  onOpenNewIncome,
  onOpenVoiceExpense,
  onOpenCloudSync,
  onLogout,
  onShowToast
}) => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>(initialScreen);
  const [viewMode, setViewMode] = useState<'device' | 'gallery'>('device');

  if (!isOpen) return null;

  const currentMeta = SCREENS_CATALOG.find(s => s.id === activeScreen) || SCREENS_CATALOG[4];
  const currentIndex = SCREENS_CATALOG.findIndex(s => s.id === activeScreen);

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + SCREENS_CATALOG.length) % SCREENS_CATALOG.length;
    setActiveScreen(SCREENS_CATALOG[prevIdx].id);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % SCREENS_CATALOG.length;
    setActiveScreen(SCREENS_CATALOG[nextIdx].id);
  };

  const renderScreenContent = (screenId: ScreenId) => {
    switch (screenId) {
      case 'splash':
        return (
          <SplashScreen
            autoAdvance={false}
            onFinish={() => setActiveScreen('welcome')}
            onNavigateTo={(id) => setActiveScreen(id as ScreenId)}
          />
        );
      case 'welcome':
        return (
          <WelcomeScreen
            onGetStarted={() => setActiveScreen('onboarding')}
            onLogin={() => setActiveScreen('login')}
            onExploreDemo={() => setActiveScreen('home')}
          />
        );
      case 'login':
        return (
          <MobileLoginScreen
            onBack={() => setActiveScreen('welcome')}
            onLogin={async () => {
              if (onShowToast) onShowToast('¡Inicio de sesión simulado exitoso!', 'success');
              setActiveScreen('home');
              return { success: true };
            }}
            onGoogleLogin={() => {
              if (onShowToast) onShowToast('Conectado con Google', 'success');
              setActiveScreen('home');
            }}
            onGoToRegister={() => setActiveScreen('onboarding')}
            onDemoLogin={() => setActiveScreen('home')}
          />
        );
      case 'onboarding':
        return (
          <OnboardingScreen
            onFinish={() => setActiveScreen('home')}
            onSkip={() => setActiveScreen('home')}
          />
        );
      case 'home':
        return (
          <MobileHomeScreen
            userName={userAccount?.name || profile.user1Name || 'Alex'}
            transactions={transactions}
            profile={profile}
            onOpenNewExpense={onOpenNewExpense}
            onOpenNewIncome={onOpenNewIncome}
            onOpenVoiceExpense={onOpenVoiceExpense}
            onNavigateToTab={(tab) => {
              if (tab === 'profile') setActiveScreen('profile');
              else if (tab === 'settings') setActiveScreen('settings');
              else if (tab === 'subscriptions') setActiveScreen('subscription');
              else {
                onClose();
                onNavigateToTab(tab);
              }
            }}
            onOpenNotifications={() => setActiveScreen('settings')}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setActiveScreen('home')}
            userAccount={userAccount}
            profile={profile}
            subscription={subscription}
            onNavigateToTab={(tab) => {
              if (tab === 'settings') setActiveScreen('settings');
              else if (tab === 'subscriptions') setActiveScreen('subscription');
              else {
                onClose();
                onNavigateToTab(tab);
              }
            }}
            onOpenCloudSync={onOpenCloudSync}
            onLogout={onLogout}
            onShowToast={onShowToast}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onBack={() => setActiveScreen('home')}
            userAccount={userAccount}
            profile={profile}
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onExportData={() => {
              if (onShowToast) onShowToast('Exportando datos...', 'info');
            }}
            onLogout={onLogout}
            onShowToast={onShowToast}
          />
        );
      case 'subscription':
        return (
          <MobileSubscriptionScreen
            onBack={() => setActiveScreen('home')}
            onSelectPlanPayment={() => {
              if (onShowToast) onShowToast('Suscripción PRO seleccionada con éxito', 'success');
            }}
            onShowToast={onShowToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 select-none">
      {/* Container Box */}
      <div className="w-full max-w-5xl h-[94vh] max-h-[900px] bg-slate-900/95 text-white rounded-[32px] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7928CA] to-[#F95420] text-white flex items-center justify-center font-black shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white">
                  8 Pantallas Esenciales de la App Móvil
                </h3>
                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  Guía UI/UX
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Estructura canónica: Splash, Bienvenida, Login, Onboarding, Inicio, Perfil, Configuración y Suscripción.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-white/10 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('device')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'device' ? 'bg-[#7928CA] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dispositivo</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'gallery' ? 'bg-[#7928CA] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Galería (8)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 8-Screens Quick Selector Pill Ribbon */}
        <div className="px-4 py-2 bg-slate-900 border-b border-white/5 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
          {SCREENS_CATALOG.map((scr) => {
            const isActive = activeScreen === scr.id;
            return (
              <button
                key={scr.id}
                type="button"
                onClick={() => {
                  setActiveScreen(scr.id);
                  if (viewMode === 'gallery') setViewMode('device');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7928CA] to-[#9B30FF] text-white border-purple-400/50 shadow-md shadow-purple-900/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/5 hover:border-white/15'
                }`}
              >
                <span className={`w-4.5 h-4.5 rounded-full text-[10px] font-black flex items-center justify-center ${
                  isActive ? 'bg-white text-purple-900' : 'bg-white/15 text-slate-300'
                }`}>
                  {scr.number}
                </span>
                <span>{scr.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Body View */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {viewMode === 'device' ? (
            /* Single Device Simulator with Information Panel */
            <div className="h-full flex flex-col lg:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
              {/* Left Phone Mockup Chassis */}
              <div className="relative shrink-0">
                {/* iPhone Chassis Container */}
                <div className="relative w-[310px] sm:w-[340px] h-[580px] sm:h-[620px] bg-black rounded-[48px] p-3 shadow-2xl ring-1 ring-white/20 shadow-purple-500/10 flex flex-col justify-between overflow-hidden">
                  
                  {/* Outer Bezel Buttons Simulation */}
                  <div className="absolute top-24 -left-1 w-1 h-8 bg-slate-700 rounded-l-md" />
                  <div className="absolute top-36 -left-1 w-1 h-12 bg-slate-700 rounded-l-md" />
                  <div className="absolute top-28 -right-1 w-1 h-16 bg-slate-700 rounded-r-md" />

                  {/* Inner Screen Area */}
                  <div className="relative w-full h-full bg-white rounded-[38px] overflow-hidden flex flex-col shadow-inner">
                    {/* Dynamic Island / Speaker Notch */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-24 h-5 bg-black rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-900/80 mr-3" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-900/80" />
                    </div>

                    {/* Active Screen Component */}
                    <div className="w-full h-full pt-4 overflow-y-auto">
                      {renderScreenContent(activeScreen)}
                    </div>
                  </div>
                </div>

                {/* Left/Right Floating Navigation Arrows */}
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-[-20px] sm:left-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer border border-white/15"
                  title="Pantalla anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-[-20px] sm:right-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer border border-white/15"
                  title="Pantalla siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Right Side Screen Explanation & Details */}
              <div className="flex-1 max-w-md space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                  <span className="w-2 h-2 rounded-full bg-[#F95420]" />
                  <span>Pantalla {currentMeta.number} de 8</span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {currentMeta.title}
                  </h2>
                  <p className="text-sm font-semibold text-purple-300">
                    {currentMeta.subtitle}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {currentMeta.description}
                  </p>
                </div>

                {/* UX Key checklist */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-300">
                  <div className="font-bold text-white text-xs mb-1">
                    Elementos Clave de Diseño & Funcionalidad:
                  </div>
                  {currentMeta.id === 'splash' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Logotipo y paleta de marca distintiva con carga suave</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Barra de progreso de inicialización interactiva</span>
                      </div>
                    </>
                  )}
                  {currentMeta.id === 'welcome' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ilustración hero cálida y propuesta de valor concisa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Llamado a la acción "Comenzar" y acceso a login existente</span>
                      </div>
                    </>
                  )}
                  {currentMeta.id === 'login' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Formulario accesible con validación y recuperación de clave</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Acceso con Google y modo demo rápido</span>
                      </div>
                    </>
                  )}
                  {currentMeta.id === 'onboarding' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Carrusel interactivo de 4 pasos con puntos de navegación</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Educación sobre IA, cuotas, modo pareja y presupuestos</span>
                      </div>
                    </>
                  )}
                  {currentMeta.id === 'home' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tarjeta destacada de progreso con anillo circular</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Acciones rápidas para + Gasto, + Ingreso, Voz IA y Alertas</span>
                      </div>
                    </>
                  )}
                  {currentMeta.id === 'profile' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cabecera con avatar, insignia PRO y edición de datos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Acceso directo a actividad, tarjetas, pareja y soporte</span>
                      </div>
                    </>
                  )}
                  {currentMeta.id === 'settings' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Toggles interactivos para notificaciones y modo oscuro</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Selector de moneda (ARS / USD) y exportación de datos</span>
                      </div>
                    </>
                  )}
                  {currentMeta.id === 'subscription' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Interruptor mensual / anual con descuento de 25%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Comparativa visual entre plan Básico y plan PRO destacado</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Action to Navigate in the actual App */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (currentMeta.id === 'home') onNavigateToTab('dashboard');
                    else if (currentMeta.id === 'profile') onNavigateToTab('profile');
                    else if (currentMeta.id === 'settings') onNavigateToTab('settings');
                    else if (currentMeta.id === 'subscription') onNavigateToTab('subscriptions');
                    else onNavigateToTab('dashboard');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#7928CA] to-[#F95420] text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity cursor-pointer"
                >
                  <span>Abrir esta pantalla en la app principal</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Gallery Mode: 8 Screens Grid (Matching the Poster from the uploaded image!) */
            <div className="space-y-4">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h3 className="text-xl font-black text-white">
                  Catálogo de las 8 Pantallas Esenciales
                </h3>
                <p className="text-xs text-slate-400">
                  Seleccioná cualquiera de las pantallas para interactuar y probar su diseño en detalle.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {SCREENS_CATALOG.map((scr) => (
                  <div
                    key={scr.id}
                    onClick={() => {
                      setActiveScreen(scr.id);
                      setViewMode('device');
                    }}
                    className="group rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 p-3 flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="flex items-center justify-between pb-2">
                      <span className="w-6 h-6 rounded-full bg-[#7928CA] text-white text-xs font-black flex items-center justify-center">
                        {scr.number}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold group-hover:text-purple-300 transition-colors">
                        Ver pantalla →
                      </span>
                    </div>

                    {/* Miniature Screen Preview Mock */}
                    <div className="h-36 rounded-xl bg-slate-950 border border-white/10 overflow-hidden relative p-2 flex flex-col justify-between shadow-inner">
                      <div className="w-8 h-1 bg-white/20 rounded-full mx-auto" />
                      <div className="text-center space-y-1">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7928CA] to-[#F95420] mx-auto flex items-center justify-center text-[10px] font-black">
                          {scr.number}
                        </div>
                        <p className="text-[10px] font-bold text-white truncate px-1">
                          {scr.title}
                        </p>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full" />
                    </div>

                    <div className="pt-2 text-left">
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300">
                        {scr.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {scr.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Diseño y UX adaptado a Mobile Apps modernas</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-white hover:text-purple-300 cursor-pointer"
          >
            Cerrar visualizador
          </button>
        </div>
      </div>
    </div>
  );
};
