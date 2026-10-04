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

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Hola, {displayName}</p>
          <h1 className="text-3xl font-extrabold text-orange-500">Resumen</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-lg shadow">
          {avatarInitial}
        </div>
      </div>

      {/* Tarjeta de Saldo Disponible */}
      <div className="bg-purple-900 text-white rounded-3xl p-6 shadow-lg space-y-4">
        <div>
          <p className="text-xs text-purple-200">Saldo disponible</p>
          <p className="text-3xl font-bold tracking-tight">
            $ {resumen.saldoDisponible.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="pt-3 border-t border-purple-700 text-xs text-purple-200">
          Presupuesto mensual <span className="font-semibold">${resumen.presupuestoMensual.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* Tarjeta de Límite Diario */}
      <div className="bg-purple-900 text-white rounded-3xl p-6 shadow-lg space-y-2">
        <p className="text-xs text-purple-200">Límite de gasto diario restante</p>
        <p className="text-2xl font-bold">
          $ {resumen.limiteDiario.toLocaleString('es-AR')}
        </p>
      </div>
    </div>
  );
};

export default Resumen;
