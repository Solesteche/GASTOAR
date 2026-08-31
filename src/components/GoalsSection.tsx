import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Plus, 
  Plane, 
  CreditCard, 
  ShieldCheck, 
  Home, 
  Car, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  History, 
  Coins, 
  Smile, 
  AlertCircle,
  Clock,
  Award,
  DollarSign,
  X,
  Check
} from 'lucide-react';
import { Goal, GoalCategory, GoalContribution } from '../types';

interface GoalsSectionProps {
  goals: Goal[];
  currency: string;
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (id: string, updated: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
  onAddContribution: (goalId: string, contribution: Omit<GoalContribution, 'id'>) => void;
}

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; emoji: string; color: string; bg: string }> = {
  viaje: { label: 'Viaje / Vacaciones', emoji: '✈️', color: '#0284c7', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  deuda: { label: 'Saldar Deuda / Tarjeta', emoji: '💳', color: '#e11d48', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  emergencia: { label: 'Fondo de Emergencia', emoji: '🛡️', color: '#059669', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  hogar: { label: 'Hogar / Muebles', emoji: '🏠', color: '#d97706', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  vehiculo: { label: 'Auto / Moto', emoji: '🚗', color: '#7c3aed', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  ahorro: { label: 'Ahorro General', emoji: '💰', color: '#2563eb', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  otro: { label: 'Otra Meta', emoji: '🎯', color: '#4b5563', bg: 'bg-slate-50 text-slate-700 border-slate-200' }
};

const COLOR_PRESETS = [
  { name: 'Coral Vibrante', hex: '#F95420', bg: 'bg-[#F95420]' },
  { name: 'Violeta Eléctrico', hex: '#7928CA', bg: 'bg-[#7928CA]' },
  { name: 'Ciruela Profundo', hex: '#2E0854', bg: 'bg-[#2E0854]' },
  { name: 'Esmeralda', hex: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Rosa / Deuda', hex: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Ámbar', hex: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Cian Viajero', hex: '#06b6d4', bg: 'bg-cyan-500' }
];

const EMOJI_PRESETS = ['✈️', '🏖️', '💳', '🛡️', '🏠', '🚗', '💻', '🎓', '💍', '💰', '🚀', '🎯', '🎸', '👟'];

const formatNumber = (num: number): string => {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  currency = 'ARS',
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddContribution
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | GoalCategory | 'completed'>('all');
  
  // Modals
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [historyGoal, setHistoryGoal] = useState<Goal | null>(null);

  // Contribution Form State
  const [contribAmount, setContribAmount] = useState<string>('');
  const [contribType, setContribType] = useState<'aporte' | 'retiro'>('aporte');
  const [contribNote, setContribNote] = useState<string>('');
  const [contribDate, setContribDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  // Goal Form State
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState<GoalCategory>('viaje');
  const [formMontoObjetivo, setFormMontoObjetivo] = useState('');
  const [formMontoActual, setFormMontoActual] = useState('');
  const [formFechaObjetivo, setFormFechaObjetivo] = useState('');
  const [formColor, setFormColor] = useState(COLOR_PRESETS[0].hex);
  const [formEmoji, setFormEmoji] = useState('✈️');
  const [formDescripcion, setFormDescripcion] = useState('');

  // Overall Statistics
  const { totalSaved, totalTarget, globalProgress, activeCount, completedCount } = useMemo(() => {
    let saved = 0;
    let target = 0;
    let completed = 0;

    goals.forEach(g => {
      saved += Number(g.montoActual) || 0;
      target += Number(g.montoObjetivo) || 0;
      if ((g.montoActual >= g.montoObjetivo && g.montoObjetivo > 0) || g.completada) {
        completed++;
      }
    });

    const progress = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    return {
      totalSaved: saved,
      totalTarget: target,
      globalProgress: progress,
      activeCount: goals.length - completed,
      completedCount: completed
    };
  }, [goals]);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const isDone = (g.montoActual >= g.montoObjetivo && g.montoObjetivo > 0) || g.completada;
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'completed') return isDone;
      return g.categoria === selectedFilter;
    });
  }, [goals, selectedFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingGoal(null);
    setFormNombre('');
    setFormCategoria('viaje');
    setFormMontoObjetivo('');
    setFormMontoActual('0');
    setFormFechaObjetivo('');
    setFormColor(COLOR_PRESETS[0].hex);
    setFormEmoji('✈️');
    setFormDescripcion('');
    setIsNewGoalModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormNombre(goal.nombre);
    setFormCategoria(goal.categoria);
    setFormMontoObjetivo(goal.montoObjetivo.toString());
    setFormMontoActual(goal.montoActual.toString());
    setFormFechaObjetivo(goal.fechaObjetivo || '');
    setFormColor(goal.color || COLOR_PRESETS[0].hex);
    setFormEmoji(goal.emoji || '🎯');
    setFormDescripcion(goal.descripcion || '');
    setIsNewGoalModalOpen(true);
  };

  // Submit Goal (Create or Edit)
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;
    const targetAmt = parseFloat(formMontoObjetivo) || 0;
    const currentAmt = parseFloat(formMontoActual) || 0;

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, {
        nombre: formNombre.trim(),
        categoria: formCategoria,
        montoObjetivo: targetAmt,
        montoActual: currentAmt,
        fechaObjetivo: formFechaObjetivo || undefined,
        color: formColor,
        emoji: formEmoji,
        descripcion: formDescripcion.trim() || undefined,
        completada: targetAmt > 0 && currentAmt >= targetAmt
      });
    } else {
      onAddGoal({
        nombre: formNombre.trim(),
        categoria: formCategoria,
        montoObjetivo: targetAmt,
        montoActual: currentAmt,
        fechaObjetivo: formFechaObjetivo || undefined,
        color: formColor,
        emoji: formEmoji,
        descripcion: formDescripcion.trim() || undefined,
        completada: targetAmt > 0 && currentAmt >= targetAmt,
        historial: currentAmt > 0 ? [{
          id: Date.now().toString(),
          monto: currentAmt,
          fecha: new Date().toISOString().slice(0, 10),
          nota: 'Aporte inicial al crear la caja',
          tipo: 'aporte'
        }] : []
      });
    }

    setIsNewGoalModalOpen(false);
  };

  // Open Contribution Modal
  const handleOpenContribution = (goal: Goal, type: 'aporte' | 'retiro' = 'aporte') => {
    setContributingGoal(goal);
    setContribType(type);
    setContribAmount('');
    setContribNote(type === 'aporte' ? 'Aporte de ahorro' : 'Retiro / Pago realizado');
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    setContribDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  // Submit Contribution
  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal) return;
    const amt = parseFloat(contribAmount);
    if (!amt || amt <= 0) return;

    onAddContribution(contributingGoal.id, {
      monto: amt,
      fecha: contribDate,
      nota: contribNote.trim() || undefined,
      tipo: contribType
    });

    setContributingGoal(null);
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. Header & Summary Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#7928CA] flex items-center justify-center shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2E0854] tracking-tight">
                Metas & Cajas de Ahorro
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Crea cajas personalizadas para ahorrar para viajes, saldar deudas o crear fondos de respaldo
              </p>
            </div>
          </div>
        </div>

        {/* New Goal CTA */}
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 self-start sm:self-auto active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Nueva Caja de Meta</span>
        </button>
      </div>

      {/* 2. Top Stats Overview (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Ahorrado / Saldado */}
        <div className="bg-white rounded-3xl p-5 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Acumulado</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#2E0854] tracking-tight">
            ${formatNumber(totalSaved)}
          </p>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <span>En {goals.length} cajas creadas</span>
          </div>
        </div>

        {/* Card 2: Monto Objetivo Total */}
        <div className="bg-white rounded-3xl p-5 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Meta Global Total</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-[#7928CA] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#2E0854] tracking-tight">
            ${formatNumber(totalTarget)}
          </p>
          <div className="text-xs text-slate-400 font-medium">
            Faltan ${formatNumber(Math.max(0, totalTarget - totalSaved))}
          </div>
        </div>

        {/* Card 3: Progreso General */}
        <div className="bg-white rounded-3xl p-5 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Progreso Global</span>
            <span className="text-xs font-black text-[#7928CA] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              {globalProgress}%
            </span>
          </div>
          <div className="w-full bg-purple-100/60 h-2.5 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-[#7928CA] to-[#F95420] rounded-full transition-all duration-500"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between pt-1">
            <span>Objetivo general</span>
            <span className="font-bold text-[#2E0854]">{globalProgress}% completado</span>
          </div>
        </div>

        {/* Card 4: Metas Activas & Cumplidas */}
        <div className="bg-white rounded-3xl p-5 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Estado de Cajas</span>
            <div className="w-7 h-7 rounded-xl bg-orange-50 text-[#F95420] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-[#2E0854] tracking-tight">{activeCount}</p>
            <span className="text-xs text-slate-400 font-semibold">activas</span>
            <span className="text-slate-300">·</span>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">{completedCount}</p>
            <span className="text-xs text-emerald-600 font-semibold">logradas 🎉</span>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {completedCount > 0 ? '¡Excelente avance!' : '¡A por tu primera meta!'}
          </div>
        </div>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedFilter === 'all'
              ? 'bg-[#2E0854] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-purple-50 border border-purple-100/70'
          }`}
        >
          Todas ({goals.length})
        </button>
        <button
          onClick={() => setSelectedFilter('viaje')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedFilter === 'viaje'
              ? 'bg-[#7928CA] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-purple-50 border border-purple-100/70'
          }`}
        >
          <span>✈️</span>
          <span>Viajes</span>
        </button>
        <button
          onClick={() => setSelectedFilter('deuda')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedFilter === 'deuda'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-rose-50 border border-purple-100/70'
          }`}
        >
          <span>💳</span>
          <span>Saldar Deudas</span>
        </button>
        <button
          onClick={() => setSelectedFilter('emergencia')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedFilter === 'emergencia'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-emerald-50 border border-purple-100/70'
          }`}
        >
          <span>🛡️</span>
          <span>Fondos Emergencia</span>
        </button>
        <button
          onClick={() => setSelectedFilter('hogar')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedFilter === 'hogar'
              ? 'bg-[#F95420] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-orange-50 border border-purple-100/70'
          }`}
        >
          <span>🏠</span>
          <span>Hogar</span>
        </button>
        <button
          onClick={() => setSelectedFilter('completed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ml-auto ${
            selectedFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-purple-50 border border-purple-100/70'
          }`}
        >
          <span>🎉</span>
          <span>Completadas ({completedCount})</span>
        </button>
      </div>

      {/* 4. Grid of Customized Goal Boxes */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-purple-100/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#7928CA] flex items-center justify-center mx-auto text-2xl">
            🎯
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-[#2E0854]">No hay cajas en esta categoría</h3>
            <p className="text-xs text-slate-500">
              Crea tu primera caja para planificar tus próximas vacaciones, saldar tarjetas o armar un fondo de ahorro.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            + Crear Caja de Ahorro o Deuda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredGoals.map((goal) => {
            const pct = goal.montoObjetivo > 0 
              ? Math.min(100, Math.round((goal.montoActual / goal.montoObjetivo) * 100))
              : 100;
            const isCompleted = pct >= 100 || goal.completada;
            const remaining = Math.max(0, goal.montoObjetivo - goal.montoActual);
            const categoryConfig = CATEGORY_CONFIG[goal.categoria] || CATEGORY_CONFIG.otro;

            // Date calculations if deadline exists
            let daysLeft: number | null = null;
            let monthlyReq: number | null = null;
            if (goal.fechaObjetivo) {
              const now = new Date();
              const targetDate = new Date(goal.fechaObjetivo);
              const diffTime = targetDate.getTime() - now.getTime();
              daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (daysLeft > 0 && remaining > 0) {
                const monthsLeft = Math.max(0.5, daysLeft / 30.4);
                monthlyReq = Math.round(remaining / monthsLeft);
              }
            }

            return (
              <div
                key={goal.id}
                className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-[0_4px_20px_-4px_rgba(121,40,202,0.06)] hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Top Accent Color Bar */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5" 
                  style={{ backgroundColor: goal.color || '#7928CA' }} 
                />

                <div>
                  {/* Card Header: Emoji/Icon + Category Badge + Menu */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs border border-black/5"
                        style={{ backgroundColor: `${goal.color || '#7928CA'}15` }}
                      >
                        {goal.emoji || categoryConfig.emoji}
                      </div>
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${categoryConfig.bg}`}>
                          {categoryConfig.label}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-[#2E0854] tracking-tight leading-tight mt-1 line-clamp-1">
                          {goal.nombre}
                        </h3>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 text-slate-400 hover:text-[#7928CA] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar caja"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar caja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description / Note if present */}
                  {goal.descripcion && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {goal.descripcion}
                    </p>
                  )}

                  {/* Progress Numbers */}
                  <div className="space-y-2 mb-4 bg-purple-50/20 p-3.5 rounded-2xl border border-purple-100/60">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        {goal.categoria === 'deuda' ? 'Saldado a la fecha' : 'Ahorrado a la fecha'}
                      </span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
                        {pct}%
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-[#2E0854]">
                        ${formatNumber(goal.montoActual)}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        / ${formatNumber(goal.montoObjetivo)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-purple-100/60 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 3)}%`,
                          backgroundColor: goal.color || '#7928CA'
                        }}
                      />
                    </div>

                    {/* Remaining or Completed message */}
                    <div className="flex items-center justify-between text-[11px] font-semibold pt-0.5">
                      {isCompleted ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ¡Meta alcanzada! 🎉
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          Faltan ${formatNumber(remaining)}
                        </span>
                      )}

                      {goal.fechaObjetivo && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {goal.fechaObjetivo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Smart Advice / Pace info */}
                  {!isCompleted && daysLeft !== null && (
                    <div className="mb-4 px-3 py-2 rounded-xl bg-orange-50/60 border border-orange-100/80 text-[11px] text-orange-950 flex items-center justify-between">
                      <span className="font-medium">
                        {daysLeft > 0 ? `Quedan ${daysLeft} días` : 'Fecha límite cumplida'}
                      </span>
                      {monthlyReq && daysLeft > 0 && (
                        <span className="font-bold text-[#F95420]">
                          ~${formatNumber(monthlyReq)} / mes
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 border-t border-purple-50 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenContribution(goal, 'aporte')}
                      className="w-full py-2 px-3 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{goal.categoria === 'deuda' ? '+ Pagar Deuda' : '+ Aportar'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenContribution(goal, 'retiro')}
                      className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-[#7928CA] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-purple-100"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-[#7928CA]" />
                      <span>Retirar / Ajustar</span>
                    </button>
                  </div>

                  {/* History View Button */}
                  <button
                    onClick={() => setHistoryGoal(goal)}
                    className="w-full py-1 text-[11px] font-semibold text-slate-400 hover:text-[#7928CA] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <History className="w-3 h-3" />
                    <span>Ver {goal.historial?.length || 0} movimientos de esta caja</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL: CREAR / EDITAR CAJA DE META */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 bg-[#2E0854]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-purple-100 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7928CA] flex items-center justify-center font-bold">
                  {formEmoji}
                </div>
                <h3 className="text-lg font-extrabold text-[#2E0854]">
                  {editingGoal ? 'Editar Caja de Meta' : 'Crear Nueva Caja de Meta'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewGoalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-[#7928CA] rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1.5">
                  Tipo de Meta / Caja
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as GoalCategory[]).map((catKey) => {
                    const cfg = CATEGORY_CONFIG[catKey];
                    const isSel = formCategoria === catKey;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => {
                          setFormCategoria(catKey);
                          if (!editingGoal) {
                            setFormEmoji(cfg.emoji);
                          }
                        }}
                        className={`p-2.5 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          isSel 
                            ? 'border-[#7928CA] bg-purple-50 text-[#7928CA] font-bold shadow-xs' 
                            : 'border-slate-200 text-slate-600 hover:bg-purple-50/50'
                        }`}
                      >
                        <span className="text-base">{cfg.emoji}</span>
                        <span className="truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goal Name */}
              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1">
                  Nombre personalizado de la caja *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Vacaciones en Brasil 2027 o Cancelar Tarjeta Visa"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA]"
                />
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2E0854] mb-1">
                    Monto Objetivo ($) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="ej. 850000"
                    value={formMontoObjetivo}
                    onChange={(e) => setFormMontoObjetivo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2E0854] mb-1">
                    Monto Actual Ahorrado ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="ej. 150000"
                    value={formMontoActual}
                    onChange={(e) => setFormMontoActual(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA]"
                  />
                </div>
              </div>

              {/* Deadline Date */}
              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1">
                  Fecha Objetivo / Límite (Opcional)
                </label>
                <input
                  type="date"
                  value={formFechaObjetivo}
                  onChange={(e) => setFormFechaObjetivo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA]"
                />
              </div>

              {/* Custom Emoji Picker */}
              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1">
                  Ícono / Emoji
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {EMOJI_PRESETS.map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setFormEmoji(em)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                        formEmoji === em
                          ? 'bg-purple-100 border-2 border-[#7928CA] scale-105'
                          : 'bg-slate-100 hover:bg-slate-200 border border-transparent'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Preset Picker */}
              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1">
                  Color de la caja
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      type="button"
                      key={col.hex}
                      onClick={() => setFormColor(col.hex)}
                      className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center cursor-pointer ${
                        formColor === col.hex ? 'scale-110 ring-2 ring-offset-2 ring-purple-600' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {formColor === col.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Motivation */}
              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1">
                  Notas / Motivación (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. Pasajes para 2 personas, incluye hotel y traslados"
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-purple-50">
                <button
                  type="button"
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                >
                  {editingGoal ? 'Guardar Cambios' : 'Crear Caja de Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: REGISTRAR APORTE / RETIRO */}
      {contributingGoal && (
        <div className="fixed inset-0 bg-[#2E0854]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-purple-100 space-y-5">
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{contributingGoal.emoji}</span>
                <div>
                  <h3 className="text-base font-extrabold text-[#2E0854]">
                    {contribType === 'aporte' ? 'Registrar Aporte' : 'Registrar Retiro / Ajuste'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                    {contributingGoal.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setContributingGoal(null)}
                className="p-1.5 text-slate-400 hover:text-[#7928CA] rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContribution} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-purple-50/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setContribType('aporte')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    contribType === 'aporte' 
                      ? 'bg-white text-[#7928CA] shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Aportar Dinero</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContribType('retiro')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    contribType === 'retiro' 
                      ? 'bg-white text-rose-600 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />
                  <span>- Retirar / Pagar</span>
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1">
                  Monto a {contribType === 'aporte' ? 'ingresar' : 'descontar'} ($) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  placeholder="ej. 50000"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA]"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1">
                  Fecha del movimiento
                </label>
                <input
                  type="date"
                  required
                  value={contribDate}
                  onChange={(e) => setContribDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA]"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-[#2E0854] mb-1">
                  Nota / Detalle (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Aporte con sueldo del mes, aguinaldo, etc."
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7928CA]/20 focus:border-[#7928CA]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-purple-50">
                <button
                  type="button"
                  onClick={() => setContributingGoal(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer ${
                    contribType === 'aporte'
                      ? 'bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] shadow-orange-500/25'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
                  }`}
                >
                  {contribType === 'aporte' ? 'Confirmar Aporte' : 'Confirmar Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: HISTORIAL DE APORTES DE LA CAJA */}
      {historyGoal && (
        <div className="fixed inset-0 bg-[#2E0854]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-purple-100 space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-purple-50 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{historyGoal.emoji}</span>
                  <div>
                    <h3 className="text-base font-extrabold text-[#2E0854]">{historyGoal.nombre}</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Historial de movimientos y aportes registrados
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryGoal(null)}
                  className="p-1.5 text-slate-400 hover:text-[#7928CA] rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List of Contributions */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {(!historyGoal.historial || historyGoal.historial.length === 0) ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    Aún no hay movimientos registrados en esta caja.
                  </div>
                ) : (
                  historyGoal.historial.slice().reverse().map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-purple-50/20 border border-purple-100/60 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          item.tipo === 'retiro' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {item.tipo === 'retiro' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#2E0854] truncate">
                            {item.nota || (item.tipo === 'retiro' ? 'Retiro / Pago' : 'Aporte de ahorro')}
                          </p>
                          <p className="text-[10px] text-slate-400">{item.fecha}</p>
                        </div>
                      </div>

                      <span className={`font-black text-sm shrink-0 ${
                        item.tipo === 'retiro' ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {item.tipo === 'retiro' ? '-' : '+'}${formatNumber(item.monto)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-purple-50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">
                Total actual: <strong className="text-[#2E0854]">${formatNumber(historyGoal.montoActual)}</strong>
              </span>
              <button
                onClick={() => setHistoryGoal(null)}
                className="px-4 py-2 bg-[#2E0854] hover:bg-[#3B0764] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
