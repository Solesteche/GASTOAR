import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Plus, 
  Sparkles, 
  Settings,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
import { CoupleProfile, ExpenseMode } from '../types';
import { GastoArBrand } from './GastoArLogo';

interface HeaderProps {
  profile?: CoupleProfile;
  activeMode?: ExpenseMode;
  onModeChange?: (mode: ExpenseMode) => void;
  onOpenTransactionModal?: (initialType?: 'gasto' | 'ingreso') => void;
  onOpenIncomeModal?: () => void;
  onOpenCoupleModal?: () => void;
  onOpenAiModal?: () => void;
  onOpenCategoryModal?: () => void;
  onOpenBudgetModal?: () => void;
  onToggleSidebar?: () => void;
  isSidebarPinned?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeMode = 'all',
  onModeChange,
  onOpenTransactionModal,
  onOpenIncomeModal,
  onOpenCoupleModal,
  onOpenAiModal,
  onToggleSidebar,
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

  return (
    <header className="bg-white/90 backdrop-blur-xl text-slate-800 sticky top-0 z-30 border-b border-purple-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Side: Hamburger & Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-600 hover:text-[#2E0854] hover:bg-purple-50 rounded-xl transition-colors md:hidden shrink-0"
              title="Abrir Menú"
              aria-label="Abrir o cerrar menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <GastoArBrand 
              size="sm" 
              variant="light" 
              showTagline={false} 
              showAccentBar={false} 
            />
          </div>
        </div>

        {/* Center: Vista Activa Selector (Todos / Míos / Pareja) */}
        {onModeChange && (
          <div className="hidden sm:flex items-center bg-purple-50/80 p-1 rounded-xl border border-purple-100/80 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => onModeChange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeMode === 'all'
                  ? 'bg-white text-[#2E0854] shadow-xs'
                  : 'text-slate-500 hover:text-[#2E0854]'
              }`}
              title="Ver todos los gastos e ingresos"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onModeChange('individual')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeMode === 'individual'
                  ? 'bg-white text-[#7928CA] shadow-xs'
                  : 'text-slate-500 hover:text-[#2E0854]'
              }`}
              title={`Ver movimientos de ${currentUserName}`}
            >
              Míos ({currentUserName})
            </button>
            <button
              type="button"
              onClick={() => onModeChange('pareja')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeMode === 'pareja'
                  ? 'bg-white text-[#F95420] shadow-xs'
                  : 'text-slate-500 hover:text-[#2E0854]'
              }`}
              title="Ver gastos compartidos en pareja"
            >
              En Pareja
            </button>
          </div>
        )}

        {/* Right Side: Quick Action Buttons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Advisor Button */}
          {onOpenAiModal && (
            <button
              type="button"
              onClick={onOpenAiModal}
              title="Asistente Financiero IA"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-[#2E0854] font-bold text-xs transition-all flex items-center gap-1.5 border border-purple-200/70"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#7928CA] animate-pulse" />
              <span className="hidden sm:inline">IA Assistant</span>
            </button>
          )}

          {/* Quick Add Button with Dropdown (Opción 1 Coral CTA button) */}
          {onOpenTransactionModal && (
            <div className="relative" ref={addMenuRef}>
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

          {/* Settings button */}
          {onOpenCoupleModal && (
            <button
              type="button"
              onClick={onOpenCoupleModal}
              title="Configuración"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50/60 hover:bg-purple-100 text-slate-700 flex items-center justify-center transition-colors border border-purple-100 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* User Account Avatar */}
          {profile && (
            <button
              type="button"
              onClick={onOpenCoupleModal}
              title={`Perfil: ${currentUserName}`}
              className="relative p-0.5 rounded-full hover:ring-2 hover:ring-purple-400 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#7928CA] to-[#F95420] text-white font-bold text-xs flex items-center justify-center shadow-xs border border-white">
                {currentUserName.charAt(0).toUpperCase()}
              </div>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
