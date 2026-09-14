import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Calendar, 
  UploadCloud, 
  DownloadCloud, 
  Layers, 
  ShieldCheck, 
  AlertCircle,
  FolderTree,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  getAvailableMonthsFromFirestore, 
  getMonthMovementsFromFirestore, 
  saveMovementToFirestore, 
  syncBudgetsToFirestore, 
  syncUserProfileToFirestore,
  getMesKeyFromDate,
  getReadableMonthName,
  auth
} from '../lib/firebase';
import { Budgets, Transaction, UserAccount, CoupleProfile } from '../types';

interface FirebaseCloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userAccount: UserAccount | null;
  profile: CoupleProfile;
  budgets: Budgets;
  transactions: Transaction[];
  onMergeTransactions: (newTxs: Transaction[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FirebaseCloudSyncModal: React.FC<FirebaseCloudSyncModalProps> = ({
  isOpen,
  onClose,
  userId,
  userAccount,
  profile,
  budgets,
  transactions,
  onMergeTransactions,
  onShowToast,
}) => {
  const [loading, setLoading] = useState(false);
  const [availableCloudMonths, setAvailableCloudMonths] = useState<{ mesKey: string; nombreMes: string }[]>([]);
  const [loadingMonthKey, setLoadingMonthKey] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const currentMonthKey = getMesKeyFromDate('');
  const currentMonthName = getReadableMonthName(currentMonthKey);

  // Load list of available months in Firebase (zero heavy reads)
  const refreshAvailableMonths = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const months = await getAvailableMonthsFromFirestore(userId);
      setAvailableCloudMonths(months);
    } catch (err) {
      console.error('Error fetching available months:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      refreshAvailableMonths();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  // 1. Upload/Sync only current month to Firebase
  const handleSyncCurrentMonth = async () => {
    if (!userId) {
      onShowToast('Debes tener una cuenta activa para sincronizar', 'error');
      return;
    }
    setLoading(true);
    try {
      // 1. Sincronizar usuario y presupuestos
      if (userAccount) {
        await syncUserProfileToFirestore(userId, userAccount);
      }
      await syncBudgetsToFirestore(userId, budgets);

      // 2. Filtrar solo movimientos de este mes
      const currentMonthTxs = transactions.filter(t => getMesKeyFromDate(t.fecha) === currentMonthKey);
      
      for (const tx of currentMonthTxs) {
        await saveMovementToFirestore(userId, tx);
      }

      await refreshAvailableMonths();
      onShowToast(`¡${currentMonthTxs.length} movimientos de ${currentMonthName} sincronizados en Firebase!`, 'success');
    } catch (error) {
      console.error(error);
      onShowToast('Error al sincronizar con Firebase', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Upload ALL local transactions partitioned by month into Firestore
  const handleBackupAllHistoryPartitioned = async () => {
    if (!userId) return;
    if (!window.confirm('Se subirán tus datos locales organizados mes a mes en Firebase. ¿Deseas continuar?')) return;

    setLoading(true);
    try {
      if (userAccount) {
        await syncUserProfileToFirestore(userId, userAccount);
      }
      await syncBudgetsToFirestore(userId, budgets);

      let done = 0;
      setUploadProgress({ current: 0, total: transactions.length });

      for (const tx of transactions) {
        await saveMovementToFirestore(userId, tx);
        done++;
        setUploadProgress({ current: done, total: transactions.length });
      }

      await refreshAvailableMonths();
      onShowToast('¡Historial completo respaldado mes a mes en Firebase!', 'success');
    } catch (error) {
      console.error(error);
      onShowToast('Error al respaldar historial', 'error');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  // 3. Load on demand a specific historical month
  const handleLoadMonthOnDemand = async (mesKey: string, nombreMes: string) => {
    if (!userId) return;
    setLoadingMonthKey(mesKey);
    try {
      const monthTxs = await getMonthMovementsFromFirestore(userId, mesKey);
      if (monthTxs.length === 0) {
        onShowToast(`No se encontraron movimientos guardados en Firebase para ${nombreMes}`, 'info');
      } else {
        onMergeTransactions(monthTxs);
        onShowToast(`¡Se cargaron ${monthTxs.length} movimientos de ${nombreMes} sin descargar el resto del historial!`, 'success');
      }
    } catch (error) {
      console.error(error);
      onShowToast(`Error al cargar datos de ${nombreMes}`, 'error');
    } finally {
      setLoadingMonthKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-purple-100 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100 bg-gradient-to-r from-[#FAF7FE] via-white to-[#FAF7FE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2E0854] text-white flex items-center justify-center shadow-md shadow-purple-900/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 font-outfit">
                  Sincronización Firebase Firestore
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Activa
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Lecturas optimizadas por mes · Sin descargas masivas de históricos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Architecture Tree Card */}
          <div className="p-4 rounded-2xl bg-[#FAF7FE] border border-purple-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#5B21B6] flex items-center gap-1.5">
                <FolderTree className="w-4 h-4" />
                <span>Jerarquía de Base de Datos Configurada</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">Zero-Waste Reads</span>
            </div>

            <div className="bg-white rounded-xl p-3 border border-purple-100 font-mono text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1 text-[#2E0854] font-bold">
                <span className="text-purple-400">📁</span> usuarios <span className="text-slate-400 text-[10px]">(/users/{userId || 'usuario_id'})</span>
              </div>
              <div className="pl-4 flex items-center gap-1 text-slate-600">
                <span className="text-slate-400">└─ 📁</span> presupuestos <span className="text-slate-400 text-[10px]">(límites y categorías)</span>
              </div>
              <div className="pl-4 flex items-center gap-1 text-slate-600">
                <span className="text-slate-400">└─ 📁</span> movimientos <span className="text-slate-400 text-[10px]">(particionados por mes)</span>
              </div>
              <div className="pl-8 flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 py-0.5 px-1.5 rounded-md w-fit">
                <span>└─ 📄</span> {currentMonthKey} ({currentMonthName}) <span className="text-[10px] font-normal text-emerald-600">← Solo se descarga este</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Protección al actualizar la app:</strong> Al subir tus gastos a Firebase, si descargas una nueva versión o cambias de dispositivo, tus datos nunca se pierden. Solo se descarga el mes actual para ahorrar cuota de lecturas en Firestore.
            </p>
          </div>

          {/* Current Month Quick Sync */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#7928CA]" />
                  <span>Mes Vigente: {currentMonthName}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Respaldar los movimientos de este mes en el nodo <code className="text-[#5B21B6] bg-purple-50 px-1 rounded">/movimientos/{currentMonthKey}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncCurrentMonth}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-[#2E0854] hover:bg-[#1C0533] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>Sincronizar {currentMonthName}</span>
              </button>
            </div>
          </div>

          {/* Historical Months on Demand */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#F95420]" />
                  <span>Meses Históricos en Firebase</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consultá cualquier mes anterior. Se descarga <strong>únicamente</strong> cuando lo solicitás.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshAvailableMonths}
                disabled={loading}
                title="Actualizar lista de meses"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {availableCloudMonths.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
                No hay meses indexados en Firebase aún. Pulsá el botón de sincronización para comenzar.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {availableCloudMonths.map((m) => {
                  const isCurrent = m.mesKey === currentMonthKey;
                  const isFetching = loadingMonthKey === m.mesKey;
                  return (
                    <div 
                      key={m.mesKey}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isCurrent 
                          ? 'bg-purple-50/70 border-purple-200 text-[#2E0854]' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>{m.nombreMes}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-purple-200 text-purple-800 font-bold px-1.5 py-0.2 rounded-full">
                              Actual
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {m.mesKey}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLoadMonthOnDemand(m.mesKey, m.nombreMes)}
                        disabled={isFetching}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-[#5B21B6] font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        {isFetching ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-[#5B21B6]" />
                        ) : (
                          <DownloadCloud className="w-3 h-3" />
                        )}
                        <span>Cargar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Backup entire local history partitioned into Firestore */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs text-slate-500">
              ¿Tenés movimientos locales antiguos? Podés migrarlos a la estructura mensual de Firebase:
            </div>
            <button
              type="button"
              onClick={handleBackupAllHistoryPartitioned}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B21B6] border border-purple-200 font-bold text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {uploadProgress ? `Subiendo (${uploadProgress.current}/${uploadProgress.total})...` : 'Migrar Todo a Firebase'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Reglas de seguridad ABAC activadas en Firestore</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
