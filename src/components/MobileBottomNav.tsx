import React, { useState, useRef, useEffect } from 'react';
import { 
  Home,
  LayoutDashboard, 
  Receipt, 
  Plus, 
  BarChart3,
  MoreHorizontal,
  Menu,
  Scale, 
  Sparkles,
  CreditCard,
  Target,
  Layers,
  Sliders,
  Bell,
  CalendarClock,
  X,
  Mic
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onOpenTransactionModal: () => void;
  onToggleSidebar?: () => void;
  hasDebt: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenTransactionModal,
  onToggleSidebar,
  hasDebt,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreOpen]);

  const handleMoreItemClick = (tab: string) => {
    setIsMoreOpen(false);
    onSelectTab(tab);
  };

  const isMoreTabActive = ['installments', 'charts', 'couple_balance', 'goals', 'budgets', 'categories', 'ai'].includes(activeTab);

  return (
    <>
      {/* "Más" Sheet Modal */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end animate-in fade-in duration-150">
          <div 
            ref={moreRef}
            className="w-full bg-white rounded-t-[32px] p-5 pb-8 shadow-2xl border-t border-purple-100 space-y-4 animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-purple-50">
              <span className="font-extrabold text-sm text-[#2E0854]">Más Secciones & Herramientas</span>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <button
                onClick={() => handleMoreItemClick('installments')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'installments' ? 'bg-purple-50 border-purple-300 text-[#7928CA] font-bold' : 'bg-slate-50/70 border-slate-100 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7928CA] flex items-center justify-center">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                <span>Cuotas</span>
              </button>

              <button
                onClick={() => handleMoreItemClick('charts')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'charts' ? 'bg-purple-50 border-purple-300 text-[#7928CA] font-bold' : 'bg-slate-50/70 border-slate-100 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7928CA] flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5" />
                </div>
                <span>Reportes</span>
              </button>

              <button
                onClick={() => handleMoreItemClick('couple_balance')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all relative cursor-pointer ${
                  activeTab === 'couple_balance' ? 'bg-purple-50 border-purple-300 text-[#6F2EC5] font-bold' : 'bg-slate-50/70 border-slate-100 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6F2EC5] flex items-center justify-center">
                  <Scale className="w-4.5 h-4.5" />
                </div>
                <span>Pareja</span>
                {hasDebt && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#6F2EC5]" />
                )}
              </button>

              <button
                onClick={() => handleMoreItemClick('goals')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'goals' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50/70 border-slate-100 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Target className="w-4.5 h-4.5" />
                </div>
                <span>Metas</span>
              </button>

              <button
                onClick={() => handleMoreItemClick('budgets')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'budgets' ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'bg-slate-50/70 border-slate-100 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Sliders className="w-4.5 h-4.5" />
                </div>
                <span>Límites</span>
              </button>

              <button
                onClick={() => handleMoreItemClick('categories')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'categories' ? 'bg-pink-50 border-pink-300 text-pink-700 font-bold' : 'bg-slate-50/70 border-slate-100 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <span>Categorías</span>
              </button>

              <button
                onClick={() => handleMoreItemClick('ai')}
                className="p-3 rounded-2xl border bg-purple-50/60 border-purple-200/80 text-purple-900 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#6F2EC5] text-white flex items-center justify-center shadow-xs">
                  <Mic className="w-4.5 h-4.5" />
                </div>
                <span>Gasto por Voz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar (Exact match to Screenshot 1: Inicio | Gastos | (+) | Reportes | Más) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-purple-100 px-3 py-1.5 shadow-[0_-4px_20px_rgba(46,8,84,0.08)] safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          
          {/* 1. Inicio */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#7928CA] font-black scale-105' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold">Inicio</span>
          </button>

          {/* 2. Movimientos */}
          <button
            onClick={() => onSelectTab('transactions')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'transactions' ? 'text-[#7928CA] font-black scale-105' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold">Movimientos</span>
          </button>

          {/* 3. Center Floating (+) Add Button */}
          <button
            onClick={onOpenTransactionModal}
            className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-[#E04412] via-[#F95420] to-[#FF7A45] hover:from-[#D03808] hover:to-[#F95420] text-white w-12 h-12 rounded-full shadow-lg shadow-orange-500/35 active:scale-95 transition-transform border-2 border-white cursor-pointer"
            title="Agregar Gasto"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          {/* 4. Vencimientos */}
          <button
            onClick={() => onSelectTab('card_alerts')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'card_alerts' ? 'text-[#7928CA] font-black scale-105' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Vencimientos"
          >
            <CalendarClock className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold">Vencimientos</span>
          </button>

          {/* 5. Menú (anteriormente "Más", ahora abre el menú de la app) */}
          <button
            onClick={() => {
              if (onToggleSidebar) {
                onToggleSidebar();
              } else {
                setIsMoreOpen(true);
              }
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              isMoreTabActive ? 'text-[#7928CA] font-black scale-105' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Abrir Menú"
            aria-label="Menú"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold">Menú</span>
          </button>

        </div>
      </div>
    </>
  );
};
