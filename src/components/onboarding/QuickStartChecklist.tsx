import React from 'react';
import { Check, ArrowRight, Plus, Sliders, DollarSign, Compass, Sparkles } from 'lucide-react';

interface QuickStartChecklistProps {
  hasCreatedAccount?: boolean;
  hasLoadedBalance?: boolean;
  hasDefinedBudget?: boolean;
  hasRegisteredExpense?: boolean;
  onOpenIncomeModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenTransactionModal: () => void;
  onRestartTour?: () => void;
}

export const QuickStartChecklist: React.FC<QuickStartChecklistProps> = ({
  hasCreatedAccount = true,
  hasLoadedBalance = false,
  hasDefinedBudget = false,
  hasRegisteredExpense = false,
  onOpenIncomeModal,
  onOpenBudgetModal,
  onOpenTransactionModal,
  onRestartTour,
}) => {
  const tasks = [
    {
      id: 1,
      title: '1. Crear cuenta',
      isCompleted: hasCreatedAccount,
      actionLabel: null,
      onAction: null,
    },
    {
      id: 2,
      title: '2. Cargar tu saldo inicial',
      isCompleted: hasLoadedBalance,
      actionLabel: 'Ingresar',
      onAction: onOpenIncomeModal,
    },
    {
      id: 3,
      title: '3. Definir tu primer presupuesto',
      isCompleted: hasDefinedBudget,
      actionLabel: 'Configurar',
      onAction: onOpenBudgetModal,
    },
    {
      id: 4,
      title: '4. Registrar tu primer gasto',
      isCompleted: hasRegisteredExpense,
      actionLabel: '+ Cargar',
      onAction: onOpenTransactionModal,
    },
  ];

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalTasks = tasks.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  // Once 100% complete, the card completely disappears to leave the panel clean!
  if (completedCount >= totalTasks) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#150d28] rounded-3xl p-5 sm:p-6 shadow-md border border-purple-100 dark:border-purple-900/60 relative overflow-hidden transition-all duration-300">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title and progress tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Tu inicio en GastoAR
          </h3>
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
            {completedCount}/{totalTasks} completado
          </span>
        </div>

        {onRestartTour && (
          <button
            type="button"
            onClick={onRestartTour}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7928CA] dark:text-purple-300 hover:underline cursor-pointer self-start sm:self-auto"
            title="Iniciar tour guiado"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Ver tour guiado</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-purple-950/80 overflow-hidden mb-4 p-0.5 border border-purple-100/60 dark:border-purple-900/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7928CA] via-[#9B30FF] to-[#F95420] transition-all duration-500 ease-out"
          style={{ width: `${Math.max(8, progressPercent)}%` }}
        />
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
              task.isCompleted
                ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100/80 dark:border-purple-900/30 text-slate-500 dark:text-purple-300'
                : 'bg-slate-50/80 dark:bg-purple-950/40 border-slate-100 dark:border-purple-900/50 text-slate-800 dark:text-white hover:border-purple-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                  task.isCompleted
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'border-2 border-slate-300 dark:border-purple-800 text-transparent'
                }`}
              >
                {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
              </div>

              <span
                className={`text-xs sm:text-sm font-bold ${
                  task.isCompleted ? 'line-through text-slate-400 dark:text-purple-400 font-medium' : ''
                }`}
              >
                {task.title}
              </span>
            </div>

            <div>
              {task.isCompleted ? (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>Listo</span>
                </span>
              ) : (
                task.actionLabel &&
                task.onAction && (
                  <button
                    type="button"
                    onClick={task.onAction}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs font-black shadow-xs shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {task.actionLabel}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
