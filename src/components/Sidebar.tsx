import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  User, 
  Users, 
  FolderPlus, 
  Sliders, 
  Sparkles, 
  Pin, 
  Scale, 
  Plus, 
  Settings, 
  Receipt,
  FileSpreadsheet,
  Coins,
  CreditCard,
  TrendingUp,
  LogOut,
  Target,
  ShieldCheck,
  BadgePercent,
  Download,
  AlertCircle,
  Bell,
  ArrowUpRight,
  CalendarClock
} from 'lucide-react';
import { CoupleProfile, ExpenseMode } from '../types';
import { GastoArBrand, GastoArIcon } from './GastoArLogo';

interface SidebarProps {
  isOpenMobile: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  onCloseMobile: () => void;
  activeTab: 'dashboard' | 'transactions' | 'couple_balance' | 'installments' | 'budgets' | 'categories' | 'ai' | 'settlement' | 'goals' | 'subscriptions' | 'admin_subscriptions';
  onSelectTab: (tab: any) => void;
  activeMode: ExpenseMode;
  onModeChange: (mode: ExpenseMode) => void;
  profile: CoupleProfile;
  onOpenTransactionModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenProfileModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenAiModal: () => void;
  onOpenCardAlerts?: () => void;
  onOpenSettlementModal: () => void;
  onOpenLogoDownload?: () => void;
  debtInfo: { debtAmount: number; whoOwesWhom: string };
  onLogout?: () => void;
  isAdmin?: boolean;
  isDemoMode?: boolean;
  onExitDemo?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  isPinned,
  onTogglePin,
  onCloseMobile,
  activeTab,
  onSelectTab,
  activeMode,
  onModeChange,
  profile,
  onOpenTransactionModal,
  onOpenIncomeModal,
  onOpenProfileModal,
  onOpenCategoryModal,
  onOpenBudgetModal,
  onOpenAiModal,
  onOpenCardAlerts,
  onOpenSettlementModal,
  onOpenLogoDownload,
  debtInfo,
  onLogout,
  isAdmin = false,
  isDemoMode = false,
  onExitDemo,
}) => {
  const isUser1 = profile.currentUser === 'user1';
  const currentUserName = isUser1 ? profile.user1Name : profile.user2Name;

  const baseNavItems = [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard, badge: null },
    { id: 'transactions', label: 'Movimientos', icon: Receipt, badge: null },
    { id: 'installments', label: 'Gastos en Cuotas', icon: CreditCard, badge: 'Tarjetas' },
    { id: 'card_alerts', label: 'Vencimientos', icon: CalendarClock, badge: null },
    { 
      id: 'couple_balance', 
      label: 'Balance de Pareja', 
      icon: Scale, 
      badge: debtInfo.debtAmount > 0 ? (debtInfo.whoOwesWhom === (isUser1 ? 'user1_owes_user2' : 'user2_owes_user1') ? 'Debes' : 'Te deben') : 'Al día' 
    },
    { id: 'budgets', label: 'Presupuestos & Límites', icon: Sliders, badge: null },
    { id: 'goals', label: 'Metas & Cajas', icon: Target, badge: 'Ahorro' },
    { id: 'categories', label: 'Categorías & Subcat', icon: FolderPlus, badge: null },
    { id: 'ai', label: 'Asistente IA (Tickets)', icon: Sparkles, badge: 'Gemini', isModal: true },
  ];

  const adminItem = { id: 'admin_subscriptions', label: 'Panel Admin Clientes', icon: ShieldCheck, badge: 'Admin' };

  const navItems = isAdmin ? [...baseNavItems, adminItem] : baseNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#1c0533]/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed md:sticky top-0 bottom-0 left-0 inset-y-0 z-50 md:z-30 h-screen max-h-screen min-h-screen bg-white/95 backdrop-blur-xl text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out border-r border-purple-100 shadow-xl shrink-0 self-start ${
          isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isPinned ? 'md:w-64' : 'md:w-16'}`}
      >
        {/* Full Height Column */}
        <div className="flex flex-col h-full min-h-full max-h-full overflow-hidden justify-between w-full">
          
          {/* Header with Clickable Logo to Home/Dashboard (Req 13) */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-purple-50 shrink-0 bg-white">
            {/* When expanded */}
            <button
              type="button"
              onClick={() => {
                onSelectTab('dashboard');
                onCloseMobile();
              }}
              className={`flex items-center space-x-3 overflow-hidden text-left cursor-pointer focus:outline-none ${!isPinned ? 'md:hidden' : ''}`}
              title="Ir al Resumen / Inicio"
            >
              <GastoArBrand 
                size="sm" 
                variant="light" 
                showTagline={true} 
                showAccentBar={true} 
              />
            </button>

            {/* When collapsed on desktop */}
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className={`hidden cursor-pointer focus:outline-none ${!isPinned ? 'md:flex md:items-center md:justify-center md:w-full' : ''}`}
              title="Ir al Resumen / Inicio"
            >
              <GastoArIcon size={30} />
            </button>

            {/* Pin Toggle on Desktop */}
            <button
              onClick={onTogglePin}
              title={isPinned ? 'Contraer panel lateral' : 'Fijar panel lateral'}
              className={`p-1.5 text-slate-400 hover:text-[#7928CA] hover:bg-purple-50 rounded-lg transition-colors hidden md:block shrink-0 cursor-pointer ${!isPinned ? 'hidden' : ''}`}
            >
              <Pin className={`w-4 h-4 transition-transform ${isPinned ? 'text-[#7928CA] rotate-45' : 'text-slate-400'}`} />
            </button>
          </div>

          {/* Quick Action CTAs: Gasto & Ingreso */}
          <div className="p-3 border-b border-purple-50 shrink-0 space-y-2">
            <button
              onClick={onOpenTransactionModal}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              title="Registrar Gasto"
            >
              <ArrowUpRight className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span className={`truncate tracking-wide ${!isPinned ? 'md:hidden' : ''}`}>Registrar Gasto</span>
            </button>
            <button
              onClick={onOpenIncomeModal}
              className="w-full py-2 px-3 bg-purple-50/90 hover:bg-purple-100 text-[#6F2EC5] border border-purple-200/90 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              title="Ingresar Ingreso"
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-[#6F2EC5]" />
              <span className={`truncate ${!isPinned ? 'md:hidden' : ''}`}>Ingresar Ingreso</span>
            </button>
          </div>

          {/* Demo Mode Alert Banner in Sidebar (Req 3) */}
          {isDemoMode && isPinned && (
            <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 shrink-0">
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modo Demostración</span>
                </span>
              </div>
              <p className="text-[10px] text-amber-700 leading-tight">
                Estás navegando con datos de prueba.
              </p>
              {onExitDemo && (
                <button
                  type="button"
                  onClick={onExitDemo}
                  className="w-full py-1 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                >
                  Salir de la Demo
                </button>
              )}
            </div>
          )}

          {/* Mode Switcher inside Sidebar */}
          <div className={`p-3 border-b border-purple-50 ${!isPinned ? 'md:hidden' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-900/60 mb-2">Vista Activa</p>
            <div className="relative grid grid-cols-2 gap-1 bg-purple-50/70 p-1 rounded-xl border border-purple-100">
              <button
                type="button"
                onClick={() => onModeChange('individual')}
                className={`relative py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer select-none text-center ${
                  activeMode === 'individual' ? 'text-[#7928CA]' : 'text-slate-500 hover:text-purple-950'
                }`}
                title={`Gastos de ${currentUserName}`}
              >
                {activeMode === 'individual' && (
                  <motion.div
                    layoutId="sidebarActiveModePill"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-purple-100"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">Personal</span>
              </button>
              <button
                type="button"
                onClick={() => onModeChange('pareja')}
                className={`relative py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer select-none text-center ${
                  activeMode === 'pareja' ? 'text-[#F95420]' : 'text-slate-500 hover:text-purple-950'
                }`}
                title="Gastos Compartidos"
              >
                {activeMode === 'pareja' && (
                  <motion.div
                    layoutId="sidebarActiveModePill"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-purple-100"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">Compartido</span>
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1 min-h-0 text-xs">
            <p className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-purple-900/50 ${!isPinned ? 'md:hidden' : ''}`}>
              Navegación
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAiButton = item.id === 'ai';
              const isCardAlertsButton = item.id === 'card_alerts';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isAiButton) {
                      onOpenAiModal();
                    } else {
                      onSelectTab(item.id);
                    }
                    onCloseMobile();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white font-bold shadow-md shadow-purple-900/25' 
                      : 'text-slate-700 hover:bg-purple-50 hover:text-[#2E0854] font-medium'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white stroke-[2.5]' : 'text-slate-400 group-hover:text-[#7928CA]'}`} />
                    <span className={`truncate ${!isPinned ? 'md:hidden' : ''}`}>{item.label}</span>
                  </div>
                  {item.badge && isPinned && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'Debes' 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                        : item.badge === 'Te deben' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : item.badge === 'Gemini'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : item.badge === 'Google Cal'
                        ? 'bg-gradient-to-r from-amber-100 to-purple-100 text-purple-900 border border-purple-300 font-extrabold'
                        : item.badge === 'Ahorro'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-purple-50 text-purple-800 border border-purple-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile Card at bottom of sidebar (Req 12) */}
          <div className="p-3 border-t border-purple-50 bg-purple-50/40 shrink-0">
            <div className={`flex items-center justify-between ${!isPinned ? 'md:justify-center' : ''}`}>
              <button
                type="button"
                onClick={() => {
                  onOpenProfileModal();
                  onCloseMobile();
                }}
                className={`flex items-center space-x-2 min-w-0 text-left cursor-pointer group ${!isPinned ? 'md:hidden' : ''}`}
                title="Ver Mi Cuenta, Contraseña, Plan y Ajustes"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7928CA] to-[#F95420] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs border border-white group-hover:scale-105 transition-transform">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-purple-900">{currentUserName}</p>
                </div>
              </button>

              <div className="flex items-center gap-1">
                {onOpenLogoDownload && isPinned && (
                  <button
                    type="button"
                    onClick={onOpenLogoDownload}
                    className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100/60 rounded-lg transition-colors cursor-pointer"
                    title="Descargar Logo de la Aplicación"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Cerrar Sesión / Salir a Inicio"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
