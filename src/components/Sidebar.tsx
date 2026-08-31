import React from 'react';
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
  BadgePercent
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
  onOpenCoupleModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenAiModal: () => void;
  onOpenSettlementModal: () => void;
  debtInfo: { debtAmount: number; whoOwesWhom: string };
  onLogout?: () => void;
  isAdmin?: boolean;
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
  onOpenCoupleModal,
  onOpenCategoryModal,
  onOpenBudgetModal,
  onOpenAiModal,
  onOpenSettlementModal,
  debtInfo,
  onLogout,
  isAdmin = false,
}) => {
  const isUser1 = profile.currentUser === 'user1';
  const currentUserName = isUser1 ? profile.user1Name : profile.user2Name;
  const partnerName = isUser1 ? profile.user2Name : profile.user1Name;

  const baseNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'transactions', label: 'Lista de Gastos', icon: Receipt, badge: null },
    { id: 'installments', label: 'Gastos en Cuotas', icon: CreditCard, badge: 'Tarjetas' },
    { 
      id: 'couple_balance', 
      label: 'Balance de Pareja', 
      icon: Scale, 
      badge: debtInfo.debtAmount > 0 ? (debtInfo.whoOwesWhom === (isUser1 ? 'user1_owes_user2' : 'user2_owes_user1') ? 'Debes' : 'Te deben') : 'Al día' 
    },
    { id: 'budgets', label: 'Presupuestos & Límites', icon: Sliders, badge: null },
    { id: 'goals', label: 'Metas & Cajas', icon: Target, badge: 'Ahorro' },
    { id: 'categories', label: 'Categorías & Subcat', icon: FolderPlus, badge: null },
    { id: 'ai', label: 'Asistente IA (Tickets)', icon: Sparkles, badge: 'Gemini' },
    { id: 'subscriptions', label: 'Planes & Mercado Pago', icon: BadgePercent, badge: 'Oficial' },
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
          {/* Header with Opción 1 Logo */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-purple-50 shrink-0 bg-white">
            {/* When expanded */}
            <div className={`flex items-center space-x-3 overflow-hidden ${!isPinned ? 'md:hidden' : ''}`}>
              <GastoArBrand 
                size="sm" 
                variant="light" 
                showTagline={true} 
                showAccentBar={true} 
              />
            </div>

            {/* When collapsed on desktop */}
            <div className={`hidden ${!isPinned ? 'md:flex md:items-center md:justify-center md:w-full' : ''}`}>
              <GastoArIcon size={30} />
            </div>

            {/* Pin Toggle on Desktop */}
            <button
              onClick={onTogglePin}
              title={isPinned ? 'Contraer panel lateral' : 'Fijar panel lateral'}
              className={`p-1.5 text-slate-400 hover:text-[#7928CA] hover:bg-purple-50 rounded-lg transition-colors hidden md:block shrink-0 ${!isPinned ? 'hidden' : ''}`}
            >
              <Pin className={`w-4 h-4 transition-transform ${isPinned ? 'text-[#7928CA] rotate-45' : 'text-slate-400'}`} />
            </button>
          </div>

          {/* Quick Action CTAs: Gasto (Coral CTA) e Ingreso (Purple Pill) */}
          <div className="p-3 border-b border-purple-50 shrink-0 space-y-2">
            <button
              onClick={onOpenTransactionModal}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              title="Registrar Gasto"
            >
              <Plus className="w-4 h-4 shrink-0 stroke-[3]" />
              <span className={`truncate tracking-wide ${!isPinned ? 'md:hidden' : ''}`}>+ Registrar Gasto</span>
            </button>
            <button
              onClick={onOpenIncomeModal}
              className="w-full py-2 px-3 bg-purple-50/80 hover:bg-purple-100/90 text-[#2E0854] border border-purple-200/80 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              title="Ingresar Ingreso"
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-[#7928CA]" />
              <span className={`truncate ${!isPinned ? 'md:hidden' : ''}`}>Ingresar Ingreso</span>
            </button>
          </div>

          {/* Mode Switcher inside Sidebar */}
          <div className={`p-3 border-b border-purple-50 ${!isPinned ? 'md:hidden' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-900/60 mb-2">Vista Activa</p>
            <div className="grid grid-cols-3 gap-1 bg-purple-50/70 p-1 rounded-xl border border-purple-100">
              <button
                onClick={() => onModeChange('all')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  activeMode === 'all' ? 'bg-white text-[#2E0854] shadow-xs' : 'text-slate-500 hover:text-purple-950'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => onModeChange('individual')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  activeMode === 'individual' ? 'bg-white text-[#7928CA] shadow-xs' : 'text-slate-500 hover:text-purple-950'
                }`}
                title={`Gastos de ${currentUserName}`}
              >
                Míos
              </button>
              <button
                onClick={() => onModeChange('pareja')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  activeMode === 'pareja' ? 'bg-white text-[#F95420] shadow-xs' : 'text-slate-500 hover:text-purple-950'
                }`}
                title="Gastos Compartidos"
              >
                Pareja
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
              const isActionItem = (item as any).isAction;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isActionItem) {
                      onOpenIncomeModal();
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

            <div className="pt-3">
              <p className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-purple-900/50 ${!isPinned ? 'md:hidden' : ''}`}>
                Cuenta Compartida
              </p>

              <button
                onClick={() => {
                  onOpenCoupleModal();
                  onCloseMobile();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-purple-50 text-slate-700 hover:text-[#2E0854] transition-all flex items-center justify-between group cursor-pointer"
                title="Configuración de Pareja"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Users className="w-4 h-4 text-slate-400 group-hover:text-[#F95420] shrink-0" />
                  <span className={`truncate font-medium ${!isPinned ? 'md:hidden' : ''}`}>Perfil de Pareja</span>
                </div>
                {isPinned && (
                  <span className="font-mono text-[10px] bg-purple-50 text-purple-900 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                    {profile.accountCode}
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* User Profile Card at bottom of sidebar */}
          <div className="p-3 border-t border-purple-50 bg-purple-50/40 shrink-0">
            <div className={`flex items-center justify-between ${!isPinned ? 'md:justify-center' : ''}`}>
              <div className={`flex items-center space-x-2 min-w-0 ${!isPinned ? 'md:hidden' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7928CA] to-[#F95420] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs border border-white">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUserName}</p>
                  <p className="text-[10px] text-slate-500 truncate">Pareja: {partnerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenCoupleModal}
                  className="p-1.5 text-slate-400 hover:text-[#2E0854] hover:bg-purple-100/60 rounded-lg transition-colors cursor-pointer"
                  title="Ajustes y cambio de usuario"
                >
                  <Settings className="w-4 h-4" />
                </button>
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
