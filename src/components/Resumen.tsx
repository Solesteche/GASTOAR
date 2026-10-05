import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

interface ResumenData {
  saldoDisponible: number;
  presupuestoMensual: number;
  limiteDiario: number;
  promedioDiario: number;
}

// Datos de prueba para el Modo Demo exclusivamente
const DEMO_RESUMEN: ResumenData = {
  saldoDisponible: 770000,
  presupuestoMensual: 770000,
  limiteDiario: 26552,
  promedioDiario: 25667
};

// Estado inicial en cero para un usuario real nuevo
const INITIAL_RESUMEN: ResumenData = {
  saldoDisponible: 0,
  presupuestoMensual: 0,
  limiteDiario: 0,
  promedioDiario: 0
};

export const Resumen: React.FC = () => {
  const { user, isDemo, loading: authLoading } = useAuth();
  const [resumen, setResumen] = useState<ResumenData>(INITIAL_RESUMEN);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  useEffect(() => {
    // Escenario A: Modo Demo explícito
    if (isDemo) {
      setResumen(DEMO_RESUMEN);
      setLoadingData(false);
      return;
    }

    // Escenario B: Usuario real registrado e iniciado
    if (user?.uid) {
      setLoadingData(true);
      const docRef = doc(db, 'resumen', user.uid);

      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setResumen(docSnap.data() as ResumenData);
          } else {
            // Usuario real sin datos cargados todavía
            setResumen(INITIAL_RESUMEN);
          }
          setLoadingData(false);
        },
        (error) => {
          console.error("Error leyendo Firestore:", error);
          setResumen(INITIAL_RESUMEN);
          setLoadingData(false);
        }
      );

      return () => unsubscribe();
    } else {
      setLoadingData(false);
    }
  }, [user, isDemo]);

  if (authLoading || loadingData) {
    return <div className="p-6 text-center text-gray-500">Cargando resumen...</div>;
  }

  // Selección del nombre a mostrar con fallbacks
  const displayName = isDemo
    ? "Demo"
    : user?.displayName || "Usuario";

  // Primera letra para la foto/avatar
  const avatarInitial = displayName.charAt(0).toUpperCase();

  // Cálculos de porcentajes para las barras afinadas
  const budgetUsedPct = resumen.presupuestoMensual > 0
    ? Math.min(100, Math.max(0, Math.round(((resumen.presupuestoMensual - resumen.saldoDisponible) / resumen.presupuestoMensual) * 100)))
    : (isDemo ? 37 : 0);

  const dailyPct = resumen.limiteDiario > 0
    ? Math.min(100, Math.max(0, Math.round((resumen.limiteDiario / (resumen.promedioDiario || resumen.limiteDiario || 1)) * 100)))
    : (isDemo ? 75 : 100);

  return (
    <div className="w-full max-w-lg mx-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 transition-all font-sans">
      {/* Encabezado */}
      <div className="flex justify-between items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">Hola, {displayName}</p>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F95420] tracking-tight">Resumen</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-800 to-[#7928CA] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
          {avatarInitial}
        </div>
      </div>

      {/* Tarjeta de Saldo Disponible con barra de progreso afinada */}
      <div className="bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white rounded-3xl p-4.5 sm:p-6 shadow-xl border border-purple-400/20 space-y-3 sm:space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <p className="text-xs text-purple-200/90 font-medium">Saldo disponible</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mt-0.5 tabular-nums">
              $ {resumen.saldoDisponible.toLocaleString('es-AR')}
            </p>
          </div>
          {budgetUsedPct > 0 && (
            <span className="text-[11px] font-bold text-purple-200/90 sm:self-start">
              {budgetUsedPct}% utilizado
            </span>
          )}
        </div>

        {/* Barra de progreso afinada (h-1, delicada y moderna para todas las versiones) */}
        <div className="h-1 rounded-full bg-white/20 overflow-hidden w-full shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-orange-400 to-[#F95420]"
            style={{ width: `${budgetUsedPct}%` }}
          />
        </div>

        <div className="pt-2 sm:pt-3 border-t border-purple-700/60 text-xs text-purple-200 flex items-center justify-between flex-wrap gap-1">
          <span>Presupuesto mensual</span>
          <span className="font-bold text-white">${resumen.presupuestoMensual.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* Tarjeta de Límite Diario con barra de progreso afinada */}
      <div className="bg-gradient-to-br from-[#2E0B5B] via-[#431478] to-[#3B0D6F] text-white rounded-3xl p-4.5 sm:p-6 shadow-xl border border-purple-400/20 space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-purple-200/90 font-medium">Límite de gasto diario restante</p>
          <span className="text-xs font-bold text-emerald-400">{dailyPct}% disponible</span>
        </div>

        <p className="text-xl sm:text-2xl lg:text-3xl font-black tabular-nums">
          $ {resumen.limiteDiario.toLocaleString('es-AR')}
        </p>

        {/* Barra de progreso afinada (h-1, delicada y moderna para todas las versiones) */}
        <div className="h-1 rounded-full bg-white/20 overflow-hidden w-full shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-[#F95420] transition-all duration-700"
            style={{ width: `${dailyPct}%` }}
          />
        </div>

        {resumen.promedioDiario > 0 && (
          <p className="text-[11px] text-purple-200/80">
            Promedio diario: <span className="font-semibold text-white">${resumen.promedioDiario.toLocaleString('es-AR')}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Resumen;
