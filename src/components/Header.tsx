import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Sparkles, 
  ArrowDownLeft, 
  ArrowUpRight, 
  LogOut,
  HelpCircle,
  Camera,
  Image as ImageIcon,
  Cloud
} from 'lucide-react';
import { CoupleProfile, ExpenseMode } from '../types';
import { GastoArBrand } from './GastoArLogo';

interface HeaderProps {
  profile?: CoupleProfile;
  activeMode?: ExpenseMode;
  onModeChange?: (mode: ExpenseMode) => void;
  onOpenTransactionModal?: (initialType?: 'gasto' | 'ingreso') => void;
  onOpenIncomeModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenAiModal?: () => void;
  onNavigateHome?: () => void;
  onToggleSidebar?: () => void;
  isSidebarPinned?: boolean;
  isDemoMode?: boolean;
  onExitDemo?: () => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  onOpenCloudSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeMode = 'all',
  onModeChange,
  onOpenTransactionModal,
  onOpenIncomeModal,
  onOpenProfileModal,
  onOpenAiModal,
  onNavigateHome,
  onToggleSidebar,
  isDemoMode = false,
  onExitDemo,
  cloudSyncStatus = 'synced',
  onOpenCloudSync,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const isUser1 = profile?.currentUser === 'user1';
  const currentUserName = profile ? (isUser1 ? profile.user1Name : profile.user2Name) : 'Usuario';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenGasto = () => {
    setShowAddMenu(false);
    if (onOpenTransactionModal) {
      onOpenTransactionModal('gasto');
    }
  };

  const handleOpenIngreso = () => {
    setShowAddMenu(false);
    if (onOpenTransactionModal) {
      onOpenTransactionModal('ingreso');
    } else if (onOpenIncomeModal) {
      onOpenIncomeModal();
    }
  };

  const handleBrandClick = () => {
    // In mobile view, clicking the brand name and logo opens the menu
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggleSidebar) {
      onToggleSidebar();
    } else if (onNavigateHome) {
      onNavigateHome();
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-xl text-slate-800 sticky top-0 z-30 border-b border-purple-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Side: Clickable Brand Logo (Opens menu on mobile, navigates home on desktop) */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleBrandClick}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-purple-50/60 active:scale-95 transition-all cursor-pointer group text-left focus:outline-none"
            title="GastoAr - Menú en móvil / Inicio en escritorio"
            aria-label="GastoAr Menú o Inicio"
          >
            <GastoArBrand 
              size="sm" 
              variant="light" 
              showTagline={false} 
              showAccentBar={false} 
            />
          </button>
        </div>

        {/* Demo Mode Badge with quick Exit button (Req 3) */}
        {isDemoMode && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs shadow-2xs animate-pulse">
            <span className="font-extrabold text-[11px] uppercase tracking-wider">Modo Demo</span>
            {onExitDemo && (
              <button
                type="button"
                onClick={onExitDemo}
                className="px-2 py-0.5 rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[10px] transition-colors cursor-pointer"
              >
                Salir de la demo
              </button>
            )}
          </div>
        )}

        {/* Center: Vista Activa Selector (Personal / Compartido) */}
        {onModeChange && (
          <div className="flex items-center bg-purple-50/90 p-0.5 sm:p-1 rounded-xl border border-purple-100/90 text-[11px] sm:text-xs font-bold shadow-2xs relative">
            <button
              type="button"
              onClick={() => onModeChange('individual')}
              className={`relative px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer select-none ${
                activeMode === 'individual'
                  ? 'text-[#7928CA]'
                  : 'text-slate-500 hover:text-[#2E0854]'
              }`}
              title={`Ver gastos y movimientos personales (${currentUserName})`}
            >
              {activeMode === 'individual' && (
                <motion.div
                  layoutId="headerActiveModePill"
                  className="absolute inset-0 bg-white rounded-lg shadow-xs border border-purple-100"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 font-bold">Personal</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('pareja')}
              className={`relative px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer select-none ${
                activeMode === 'pareja'
                  ? 'text-[#F95420]'
                  : 'text-slate-500 hover:text-[#2E0854]'
              }`}
              title="Ver gastos y movimientos compartidos"
            >
              {activeMode === 'pareja' && (
                <motion.div
                  layoutId="headerActiveModePill"
                  className="absolute inset-0 bg-white rounded-lg shadow-xs border border-purple-100"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 font-bold">Compartido</span>
            </button>
          </div>
        )}

        {/* Right Side: Quick Action Buttons & Profile Initial */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* AI Advisor / Tickets Button with Camera & Gallery permissions info (Req 10) */}
          {onOpenAiModal && (
            <button
              type="button"
              onClick={onOpenAiModal}
              title="Escanear Tickets y Comprobantes con IA (Cámara / Galería)"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#2E0854] font-bold text-xs transition-all flex items-center gap-1.5 border border-purple-200/80 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#7928CA] animate-pulse" />
              <span className="hidden sm:inline">IA Tickets</span>
            </button>
          )}

          {/* Firebase Cloud Sync Status & Quick Action */}
          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              title="Sincronización en la Nube con Firebase Firestore (usuarios → presupuestos → movimientos por mes)"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#2E0854] font-bold text-xs transition-all flex items-center gap-1.5 border border-purple-200/80 cursor-pointer shadow-2xs"
            >
              <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-bounce text-[#F95420]' : 'text-[#7928CA]'}`} />
              <span className="hidden sm:inline">Firebase</span>
            </button>
          )}

          {/* Quick Action Buttons for Gasto & Ingreso */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenGasto}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Registrar nuevo gasto"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>Gasto</span>
            </button>
            <button
              type="button"
              onClick={handleOpenIngreso}
              className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6F2EC5] border border-purple-200/90 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Registrar nuevo ingreso"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Ingreso</span>
            </button>
          </div>

          {/* Quick Add Button with Dropdown (Mobile / Compact) */}
          {onOpenTransactionModal && (
            <div className="relative md:hidden" ref={addMenuRef}>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setShowAddMenu(prev => !prev)}
                  title="Registrar Gasto o Ingreso"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] active:scale-95 text-white font-bold transition-all flex items-center justify-center shadow-md shadow-orange-500/25 cursor-pointer"
                  aria-expanded={showAddMenu}
                  aria-haspopup="true"
                >
                  <Plus className="w-5 h-5 stroke-[2.8]" />
                </button>
              </div>

              {/* Floating Menu for Gasto / Ingreso selection */}
              {showAddMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-purple-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-purple-50 text-[10px] font-bold uppercase tracking-wider text-purple-900/50">
                    Nueva Transacción
                  </div>

                  {/* Option 1: Registrar Gasto */}
                  <button
                    type="button"
                    onClick={handleOpenGasto}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:text-[#F95420] hover:bg-orange-50/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#F95420] flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="leading-tight">Registrar Gasto</div>
                      <div className="text-[10px] font-normal text-slate-400">Compra, cuotas o salida</div>
                    </div>
                  </button>

                  {/* Option 2: Registrar Ingreso */}
                  <button
                    type="button"
                    onClick={handleOpenIngreso}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:text-[#7928CA] hover:bg-purple-50/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#7928CA] flex items-center justify-center shrink-0">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="leading-tight">Registrar Ingreso</div>
                      <div className="text-[10px] font-normal text-slate-400">Sueldo, freelance o cobro</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Account Avatar (Initial) - Opens UserProfileModal (Req 12) */}
          {profile && (
            <button
              type="button"
              onClick={onOpenProfileModal}
              title={`Mi Cuenta & Perfil: ${currentUserName} (Tocar para ver cuenta, contraseña, plan y ajustes)`}
              className="relative p-0.5 rounded-full hover:ring-2 hover:ring-purple-400 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#7928CA] to-[#F95420] text-white font-black text-xs flex items-center justify-center shadow-xs border border-white group-hover:scale-105 transition-transform">
                {currentUserName.charAt(0).toUpperCase()}
              </div>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
