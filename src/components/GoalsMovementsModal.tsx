import React, { useState, useMemo } from 'react';
import {
  X,
  Target,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Goal, GoalContribution } from '../types';
import { formatCurrency, formatDateEs } from '../utils/formatters';

interface GoalsMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  currency?: string;
  onNavigateTab?: (tab: string) => void;
  onAddContribution?: (goalId: string, contribution: Omit<GoalContribution, 'id'>) => void;
}

interface FlattenedGoalMovement extends GoalContribution {
  goalId: string;
  goalName: string;
  goalEmoji: string;
  goalColor: string;
  goalCategory: string;
}

export const GoalsMovementsModal: React.FC<GoalsMovementsModalProps> = ({
  isOpen,
  onClose,
  goals = [],
  currency = 'ARS',
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'movements' | 'goals'>('movements');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<'all' | 'aporte' | 'retiro'>('all');

  // Overall Goal Metrics
  const metrics = useMemo(() => {
    let totalTarget = 0;
    let totalSaved = 0;
    let completedCount = 0;
    let activeCount = 0;

    goals.forEach(goal => {
      totalTarget += goal.montoObjetivo || 0;
      totalSaved += goal.montoActual || 0;
      if (goal.completada || (goal.montoActual >= goal.montoObjetivo && goal.montoObjetivo > 0)) {
        completedCount++;
      } else {
        activeCount++;
      }
    });

    const percent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

    return {
      totalTarget,
      totalSaved,
      completedCount,
      activeCount,
      percent,
    };
  }, [goals]);

  // Flatten and sort all movements (contributions and withdrawals)
  const allMovements = useMemo(() => {
    const list: FlattenedGoalMovement[] = [];

    goals.forEach(goal => {
      (goal.historial || []).forEach(h => {
        list.push({
          ...h,
          goalId: goal.id,
          goalName: goal.nombre,
          goalEmoji: goal.emoji || '🎯',
          goalColor: goal.color || '#3B82F6',
          goalCategory: goal.categoria,
        });
      });
    });

    // Sort by date descending (most recent first)
    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [goals]);

  // Filtered movements based on dropdown / chip selection
  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      if (selectedGoalFilter !== 'ALL' && m.goalId !== selectedGoalFilter) return false;
      if (filterType !== 'all' && m.tipo !== filterType) return false;
      return true;
    });
  }, [allMovements, selectedGoalFilter, filterType]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#181332] border border-slate-100 dark:border-purple-900/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-purple-900/30 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-transparent dark:from-blue-950/20 dark:via-purple-950/20 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/25 shrink-0">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                  Movimientos y Ahorro en Metas
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
                  {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Historial de aportes, retiros y progreso de tus objetivos financieros
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card with Overall Progress */}
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-[#1e173e]/50 border-b border-slate-100 dark:border-purple-900/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white dark:bg-[#181332] p-3 rounded-2xl border border-slate-100 dark:border-purple-900/30">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Total Ahorrado</span>
              <span className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 mt-0.5 block truncate">
                {formatCurrency(metrics.totalSaved, currency)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#181332] p-3 rounded-2xl border border-slate-100 dark:border-purple-900/30">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Meta Global</span>
              <span className="text-sm sm:text-base font-black text-slate-800 dark:text-white mt-0.5 block truncate">
                {formatCurrency(metrics.totalTarget, currency)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#181332] p-3 rounded-2xl border border-slate-100 dark:border-purple-900/30">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Progreso Global</span>
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {metrics.percent}%
              </span>
            </div>

            <div className="bg-white dark:bg-[#181332] p-3 rounded-2xl border border-slate-100 dark:border-purple-900/30">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">Aportes Hechos</span>
              <span className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-400 mt-0.5 block">
                {allMovements.length}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              <span>Progreso general de ahorro</span>
              <span>{metrics.percent}% alcanzado</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-purple-950/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${metrics.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-4 sm:px-6 pt-3 flex items-center justify-between border-b border-slate-100 dark:border-purple-900/30 bg-white dark:bg-[#181332]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('movements')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'movements'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Movimientos y Aportes ({allMovements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('goals')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'goals'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Detalle de Metas ({goals.length})
            </button>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateTab('goals');
              }}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer pb-2"
            >
              <span>Ir a sección Metas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab Content: Movimientos */}
        {activeTab === 'movements' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedGoalFilter}
                onChange={e => setSelectedGoalFilter(e.target.value)}
                className="text-xs font-bold bg-slate-100 dark:bg-purple-950/60 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl border border-transparent focus:border-blue-500 outline-hidden cursor-pointer"
              >
                <option value="ALL">Todas las metas</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.nombre}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-slate-100 dark:bg-purple-950/60 p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-white dark:bg-[#2A184A] text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('aporte')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterType === 'aporte'
                      ? 'bg-white dark:bg-[#2A184A] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  + Aportes
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('retiro')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterType === 'retiro'
                      ? 'bg-white dark:bg-[#2A184A] text-rose-600 dark:text-rose-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  - Retiros
                </button>
              </div>
            </div>

            {/* List of movements */}
            {filteredMovements.length > 0 ? (
              <div className="space-y-2.5">
                {filteredMovements.map(m => {
                  const isAporte = m.tipo === 'aporte';
                  return (
                    <div
                      key={m.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#1a1336] border border-slate-100 dark:border-purple-900/30 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: `${m.goalColor}18` }}
                        >
                          {m.goalEmoji}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                              {m.goalName}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                                isAporte
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {isAporte ? 'Aporte' : 'Retiro'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDateEs(m.fecha)}</span>
                            </span>
                            {m.nota && (
                              <>
                                <span>•</span>
                                <span className="truncate italic">"{m.nota}"</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm sm:text-base font-black block ${
                            isAporte
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isAporte ? '+' : '-'} {formatCurrency(m.monto, currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-500 mx-auto flex items-center justify-center text-xl mb-3">
                  🎯
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  No hay movimientos registrados
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Aún no se han registrado aportes o retiros en las metas seleccionadas.
                </p>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('goals');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Crear o abonar a una meta
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Detalle de Metas */}
        {activeTab === 'goals' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
            {goals.map(goal => {
              const pct = goal.montoObjetivo > 0
                ? Math.min(100, Math.round((goal.montoActual / goal.montoObjetivo) * 100))
                : 0;
              const isDone = goal.completada || pct >= 100;

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#1a1336] border border-slate-100 dark:border-purple-900/30 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: `${goal.color || '#3B82F6'}20` }}
                      >
                        {goal.emoji || '🎯'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                            {goal.nombre}
                          </h4>
                          {isDone && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Cumplida</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {goal.descripcion || `Meta de ahorro para ${goal.categoria}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-800 dark:text-white block">
                        {formatCurrency(goal.montoActual, currency)}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        de {formatCurrency(goal.montoObjetivo, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <span>{pct}% completado</span>
                      {goal.fechaObjetivo && (
                        <span>Fecha límite: {formatDateEs(goal.fechaObjetivo)}</span>
                      )}
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-purple-950/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: goal.color || '#3B82F6'
                        }}
                      />
                    </div>
                  </div>

                  {/* Historial preview if any */}
                  {goal.historial && goal.historial.length > 0 && (
                    <div className="pt-2 border-t border-slate-50 dark:border-purple-900/20 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>{goal.historial.length} aportes en total</span>
                      <span className="font-semibold">
                        Último: {formatDateEs(goal.historial[goal.historial.length - 1].fecha)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#15102d]">
          {onNavigateTab ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateTab('goals');
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
            >
              <span>Ver panel completo de Metas</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-purple-950 hover:bg-slate-300 dark:hover:bg-purple-900 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
