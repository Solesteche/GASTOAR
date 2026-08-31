import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Plus, 
  Scale, 
  Sparkles,
  CreditCard
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'transactions' | 'couple_balance' | 'installments' | 'budgets' | 'categories' | 'ai' | 'settlement' | 'goals';
  onSelectTab: (tab: any) => void;
  onOpenTransactionModal: () => void;
  hasDebt: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenTransactionModal,
  hasDebt,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-purple-100 px-2 py-1.5 shadow-[0_-4px_20px_rgba(46,8,84,0.06)] safe-area-inset-bottom">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#7928CA] font-bold scale-105' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Resumen</span>
        </button>

        {/* Expenses List */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'transactions' ? 'text-[#7928CA] font-bold scale-105' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Gastos</span>
        </button>

        {/* Center Floating (+) Add Button in Opción 1 Coral */}
        <button
          onClick={onOpenTransactionModal}
          className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white w-12 h-12 rounded-full shadow-lg shadow-orange-500/35 active:scale-95 transition-transform border-2 border-white cursor-pointer"
          title="Agregar Gasto"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Cuotas */}
        <button
          onClick={() => onSelectTab('installments')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'installments' ? 'text-[#7928CA] font-bold scale-105' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Cuotas</span>
        </button>

        {/* Couple Balances */}
        <button
          onClick={() => onSelectTab('couple_balance')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'couple_balance' ? 'text-[#F95420] font-bold scale-105' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Pareja</span>
          {hasDebt && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#F95420]" />
          )}
        </button>
      </div>
    </div>
  );
};
