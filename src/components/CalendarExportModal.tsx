import React, { useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  Download,
  ExternalLink,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Smartphone,
  Laptop,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { DueAlertItem } from './AlertsSection';
import { formatCurrency } from '../utils/formatters';
import { generateVencimientosICS, downloadICS, generateGoogleCalendarWebUrl } from '../utils/icsExport';
import { convertDueDayToDateStr } from '../services/localNotificationService';

interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DueAlertItem[];
  currency: string;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onOpenGoogleCalendarSync?: () => void;
  onOpenAppleCalendarSync?: () => void;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onShowToast,
  onOpenGoogleCalendarSync,
  onOpenAppleCalendarSync
}) => {
  const [onlyPending, setOnlyPending] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'apple' | 'google'>('google');

  if (!isOpen) return null;

  const pendingItems = items.filter(i => !i.paidThisMonth);
  const selectedItems = onlyPending ? pendingItems : items;
  const totalAmount = selectedItems.reduce((acc, curr) => acc + (curr.estimatedAmount || 0), 0);

  const handleDownload = () => {
    if (selectedItems.length === 0) {
      onShowToast('No hay vencimientos para exportar.', 'info');
      return;
    }

    try {
      const ics = generateVencimientosICS(items, {
        currency,
        onlyPending,
        calendarName: 'Vencimientos - GastoAR'
      });

      const fileName = onlyPending ? 'vencimientos_pendientes_gastoar.ics' : 'todos_vencimientos_gastoar.ics';
      downloadICS(ics, fileName);
      setDownloaded(true);
      onShowToast(
        `✓ ${selectedItems.length} ${selectedItems.length === 1 ? 'vencimiento exportado' : 'vencimientos exportados'} a .ics`,
        'success'
      );
    } catch (err) {
      console.error(err);
      onShowToast('Error al generar el archivo .ics', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-purple-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Bright vibrant purple */}
        <div className="bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#8B5CF6] text-white p-4 sm:p-5 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarPlus className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Exportar o Sincronizar
                </h2>
                <span className="text-[10px] font-black uppercase bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Calendarios
                </span>
              </div>
              <p className="text-xs text-purple-100 mt-0.5">
                Sincronización con Google Calendar, Apple Calendar o archivo .ics
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {/* Quick Direct Sync Cards for Google & Apple */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Google Calendar 1-Tap */}
            {onOpenGoogleCalendarSync && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200/90 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
                    <svg className="w-4.5 h-4.5" viewBox="0 0 40 40">
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
                    <h3 className="text-xs font-black text-slate-900 leading-tight">
                      Google Calendar
                    </h3>
                    <span className="text-[10px] text-blue-700 font-extrabold uppercase">
                      Automático
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Sincronizá con tu cuenta de Google y agendá alarmas en la nube.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGoogleCalendarSync();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Sincronizar Google</span>
                </button>
              </div>
            )}

            {/* Apple Calendar 1-Tap */}
            {onOpenAppleCalendarSync && (
              <div className="bg-gradient-to-br from-rose-50 to-orange-50/70 border border-rose-200/90 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white flex flex-col items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <div className="w-full bg-[#FF3B30] text-white text-[7px] font-black text-center py-0.2">
                      CAL
                    </div>
                    <div className="text-slate-900 font-black text-xs leading-none py-0.5">
                      {new Date().getDate()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-tight">
                      Apple Calendar
                    </h3>
                    <span className="text-[10px] text-rose-700 font-extrabold uppercase">
                      iPhone / iPad / Mac
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Abrí directamente en iOS y guardá en iCloud en 1 toque.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAppleCalendarSync();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span>Añadir en iOS</span>
                </button>
              </div>
            )}
          </div>

          {/* Divider between Direct and Manual File Download */}
          <div className="relative flex items-center py-0.5">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              o descargar archivo .ics universal
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Summary Box */}
          <div className="bg-[#FFF6F2] border border-[#FFE4D6] rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase text-[#E04B1D] tracking-wide">
                {onlyPending ? 'Pagos Pendientes a Exportar' : 'Todos los Vencimientos'}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {selectedItems.length} {selectedItems.length === 1 ? 'pago' : 'pagos'}
                </span>
                {totalAmount > 0 && (
                  <span className="text-xs sm:text-sm font-bold text-slate-600">
                    ({formatCurrency(totalAmount, currency)})
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F95420] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          {/* Toggle filter */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="font-bold text-slate-700">Exportar únicamente pagos pendientes:</span>
            <button
              type="button"
              onClick={() => setOnlyPending(!onlyPending)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                onlyPending
                  ? 'bg-[#F95420] text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {onlyPending ? 'Sí (Recomendado)' : 'Todos los items'}
            </button>
          </div>

          {/* Main Download CTA Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={selectedItems.length === 0}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              selectedItems.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : downloaded
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
                : 'bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white active:scale-[0.98]'
            }`}
          >
            {downloaded ? (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>¡Descargado! Volver a descargar archivo .ics</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Descargar archivo .ics ({selectedItems.length})</span>
              </>
            )}
          </button>

          {/* Instructions Tabs: Google Calendar vs Apple Calendar */}
          <div className="border border-slate-200/80 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span>¿Cómo importarlo a tu calendario?</span>
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('google')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    activeTab === 'google'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Google Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('apple')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    activeTab === 'apple'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Apple Calendar
                </button>
              </div>
            </div>

            {activeTab === 'google' ? (
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-800">Descargá el archivo .ics</strong> usando el botón superior.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-800">En la web de Google Calendar:</strong> Ingresá a{' '}
                    <a
                      href="https://calendar.google.com/calendar/r/settings/export"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      Configuración ➔ Importar
                      <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    y subí el archivo <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">.ics</span>.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-800">En celulares Android:</strong> Al descargar el archivo, tocá la notificación y elegí abrir con Google Calendar para importar todos los pagos en 1 toque.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-800">En iPhone, iPad o Mac:</strong> Tocá o hacé doble clic sobre el archivo descargado.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    Apple Calendar abrirá automáticamente un diálogo: seleccioná{' '}
                    <strong className="text-slate-800">"Añadir todos a Calendario"</strong>.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-800">¡Listo!</strong> Tus recordatorios quedarán sincronizados con iCloud en todos tus dispositivos Apple.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List of items that will be exported */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Vista previa de los vencimientos ({selectedItems.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {selectedItems.map((item) => {
                const dateStr = convertDueDayToDateStr(item.dueDay);
                const gCalUrl = generateGoogleCalendarWebUrl(item, currency);

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between text-xs hover:border-purple-200 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.provider} • Día {item.dueDay} ({dateStr})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-slate-800">
                        {item.estimatedAmount ? formatCurrency(item.estimatedAmount, currency) : 'A definir'}
                      </span>
                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg text-purple-600 hover:bg-purple-50"
                        title="Agregar directamente a Google Calendar Web"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl text-xs font-black bg-[#F95420] text-white hover:bg-[#E04412] flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .ics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
