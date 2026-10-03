import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
  X,
  AlertCircle,
  BellRing,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { DueAlertItem } from './AlertsSection';
import { formatCurrency } from '../utils/formatters';
import { convertDueDayToDateStr } from '../services/localNotificationService';
import { syncPaymentsToGoogleCalendar, CalendarSyncProgress, CalendarSyncResult } from '../services/googleCalendarService';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DueAlertItem[];
  currency: string;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onSyncComplete?: () => void;
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onShowToast,
  onSyncComplete
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => 
    items.filter(i => !i.paidThisMonth).map(i => i.id)
  );
  const [step, setStep] = useState<'confirm' | 'syncing' | 'completed' | 'error'>('confirm');
  const [progress, setProgress] = useState<CalendarSyncProgress | null>(null);
  const [result, setResult] = useState<CalendarSyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const pendingItems = items.filter(i => !i.paidThisMonth);
  const targetItems = items.filter(i => selectedIds.includes(i.id));
  const totalAmount = targetItems.reduce((acc, curr) => acc + (curr.estimatedAmount || 0), 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(pendingItems.map(i => i.id));
  };

  const handleStartSync = async () => {
    if (targetItems.length === 0) {
      onShowToast('Selecciona al menos un vencimiento para sincronizar.', 'info');
      return;
    }

    setStep('syncing');
    setErrorMessage('');

    try {
      const res = await syncPaymentsToGoogleCalendar(targetItems, {
        currency,
        onlyPending: false, // We already filtered targetItems by selectedIds
        onProgress: (p) => setProgress(p)
      });

      setResult(res);

      if (res.errors.length > 0 && res.created + res.updated === 0) {
        setErrorMessage(res.errors.join(', '));
        setStep('error');
      } else {
        setStep('completed');
        onShowToast(
          `✓ ${res.created + res.updated} ${res.created + res.updated === 1 ? 'vencimiento sincronizado' : 'vencimientos sincronizados'} con Google Calendar`,
          'success'
        );
        onSyncComplete?.();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Ocurrió un error al conectar con Google Calendar.');
      setStep('error');
    }
  };

  const handleReset = () => {
    setStep('confirm');
    setProgress(null);
    setResult(null);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-purple-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E1B4B] text-white p-4 sm:p-5 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-md">
              {/* Google Calendar official 4-color icon style */}
              <svg className="w-6 h-6" viewBox="0 0 40 40">
                <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
                <path d="M28 8H12C9.79 8 8 9.79 8 12V28C8 30.21 9.79 32 12 32H28C30.21 32 32 30.21 32 28V12C32 9.79 30.21 8 28 8Z" fill="#FFFFFF"/>
                <path d="M28 8H12C9.79 8 8 9.79 8 12V15H32V12C32 9.79 30.21 8 28 8Z" fill="#1A73E8"/>
                <circle cx="13" cy="11.5" r="1.5" fill="#FFFFFF"/>
                <circle cx="27" cy="11.5" r="1.5" fill="#FFFFFF"/>
                <text x="20" y="26" fontSize="11" fontWeight="900" fill="#1A73E8" textAnchor="middle" fontFamily="sans-serif">
                  31
                </text>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Google Calendar
                </h2>
                <span className="text-[10px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Auto-Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Sincronización directa y recordatorios en tu cuenta de Google
              </p>
            </div>
          </div>
        </div>

        {/* Content depending on step */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {step === 'confirm' && (
            <>
              {/* Confirmation Explanation Box */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
                  <BellRing className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>¿Deseas sincronizar estos pagos en tu Google Calendar?</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Al confirmar, GastoAR creará o actualizará automáticamente los eventos correspondientes en tu calendario personal con recordatorios programados <strong>2 días antes</strong> y la <strong>mañana del vencimiento</strong>.
                </p>
              </div>

              {/* Summary Stats */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wide">
                    Pagos seleccionados para sincronizar
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {targetItems.length} {targetItems.length === 1 ? 'pago' : 'pagos'}
                    </span>
                    {totalAmount > 0 && (
                      <span className="text-xs sm:text-sm font-bold text-slate-600">
                        ({formatCurrency(totalAmount, currency)})
                      </span>
                    )}
                  </div>
                </div>
                {targetItems.length < pendingItems.length && (
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    Seleccionar todos ({pendingItems.length})
                  </button>
                )}
              </div>

              {/* Items List with checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>Vencimientos a sincronizar</span>
                  <span>{targetItems.length} de {pendingItems.length}</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {pendingItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const dateStr = convertDueDayToDateStr(item.dueDay);

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelect(item.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-50/50 border-purple-200'
                            : 'bg-white border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {item.provider} • Día {item.dueDay} ({dateStr})
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-black text-slate-800">
                            {item.estimatedAmount ? formatCurrency(item.estimatedAmount, currency) : 'A definir'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {pendingItems.length === 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                      No tienes pagos pendientes este mes para sincronizar.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 'syncing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Sincronizando con Google Calendar...
                </h3>
                {progress ? (
                  <p className="text-xs text-slate-500 mt-1">
                    {progress.current} de {progress.total}: <strong className="text-slate-700">{progress.itemName}</strong>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">
                    Conectando con tu cuenta de Google...
                  </p>
                )}
              </div>

              {progress && (
                <div className="w-full bg-slate-100 rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {step === 'completed' && result && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  ¡Sincronización Exitosa!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Tus {result.created + result.updated} {result.created + result.updated === 1 ? 'vencimiento fue agendado' : 'vencimientos fueron agendados'} en Google Calendar con alertas automáticas.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1.5 text-left">
                <div className="flex justify-between font-bold">
                  <span>Nuevos eventos creados:</span>
                  <span className="text-emerald-700 font-black">{result.created}</span>
                </div>
                {result.updated > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Eventos actualizados:</span>
                    <span className="text-blue-700 font-black">{result.updated}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                  <span>Recordatorios configurados:</span>
                  <span>-2 días y el día de pago</span>
                </div>
              </div>

              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <span>Ver eventos en Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {step === 'error' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  No se pudo completar la sincronización
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {errorMessage || 'Ocurrió un error de conexión o el permiso de Google Calendar no fue otorgado.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Intentar nuevamente</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={step === 'syncing'}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            {step === 'completed' ? 'Cerrar' : 'Cancelar'}
          </button>

          {step === 'confirm' && (
            <button
              type="button"
              onClick={handleStartSync}
              disabled={targetItems.length === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Confirmar y Sincronizar ({targetItems.length})</span>
            </button>
          )}

          {step === 'completed' && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Finalizar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
