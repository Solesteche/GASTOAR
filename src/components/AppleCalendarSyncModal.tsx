import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  X,
  Smartphone,
  ShieldCheck,
  HelpCircle,
  Download
} from 'lucide-react';
import { DueAlertItem } from './AlertsSection';
import { formatCurrency } from '../utils/formatters';
import { convertDueDayToDateStr } from '../services/localNotificationService';
import { openInAppleCalendar, isIOS } from '../utils/icsExport';

interface AppleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DueAlertItem[];
  currency: string;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AppleCalendarSyncModal: React.FC<AppleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onShowToast
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    items.filter(i => !i.paidThisMonth).map(i => i.id)
  );
  const [added, setAdded] = useState(false);

  if (!isOpen) return null;

  const pendingItems = items.filter(i => !i.paidThisMonth);
  const targetItems = items.filter(i => selectedIds.includes(i.id));
  const totalAmount = targetItems.reduce((acc, curr) => acc + (curr.estimatedAmount || 0), 0);
  const onIOS = isIOS();

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(pendingItems.map(i => i.id));
  };

  const handleSyncApple = () => {
    if (targetItems.length === 0) {
      onShowToast('Selecciona al menos un vencimiento para sincronizar.', 'info');
      return;
    }

    try {
      openInAppleCalendar(targetItems, { currency, onlyPending: false });
      setAdded(true);
      onShowToast(
        `✓ ${targetItems.length} ${targetItems.length === 1 ? 'vencimiento enviado' : 'vencimientos enviados'} a Apple Calendar`,
        'success'
      );
    } catch (err) {
      console.error(err);
      onShowToast('Error al abrir en Apple Calendar.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Apple style clean & refined */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white flex flex-col items-center justify-center shrink-0 shadow-md overflow-hidden">
              {/* Apple Calendar classic icon */}
              <div className="w-full bg-[#FF3B30] text-white text-[8px] font-black text-center py-0.5 uppercase tracking-wider">
                CAL
              </div>
              <div className="text-slate-900 font-black text-sm leading-none py-1">
                {new Date().getDate()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Apple Calendar
                </h2>
                <span className="text-[10px] font-black uppercase bg-[#FF3B30] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> iOS / Mac
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Sincronización nativa con la app Calendario de iPhone, iPad y Mac
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {/* iOS Specific Guidance Banner */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-rose-950 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-[#FF3B30] shrink-0" />
              <span>Sincronización en 1 toque en iPhone y iPad</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              Al tocar el botón, iOS abrirá automáticamente la app <strong>Calendario</strong> del sistema. Selecciona <strong className="text-slate-900">"Añadir todos a Calendario"</strong> y los recordatorios se guardarán en tu cuenta de iCloud en todos tus dispositivos Apple.
            </p>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wide">
                Pagos a sincronizar en Apple Calendar
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
                className="text-xs font-bold text-[#FF3B30] hover:underline cursor-pointer"
              >
                Seleccionar todos ({pendingItems.length})
              </button>
            )}
          </div>

          {/* Action CTA Button */}
          <button
            type="button"
            onClick={handleSyncApple}
            disabled={targetItems.length === 0}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              targetItems.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                : 'bg-gradient-to-r from-slate-900 via-slate-800 to-black hover:bg-slate-800 text-white active:scale-95'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>¡Abierto en iOS! Tocar de nuevo para volver a enviar</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-rose-400" />
                <span>Añadir a Apple Calendar ({targetItems.length})</span>
              </>
            )}
          </button>

          {/* Steps for iOS / Mac */}
          <div className="border border-slate-200/80 rounded-2xl p-3.5 bg-slate-50/50 space-y-2.5 text-xs text-slate-600">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#FF3B30]" />
              <span>¿Cómo funciona en tu dispositivo Apple?</span>
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-[#FF3B30] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tocá el botón <strong>"Añadir a Apple Calendar"</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-[#FF3B30] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  En tu iPhone, tocá <strong>"Añadir todos"</strong> cuando aparezca la ventana emergente de Calendario.
                </p>
              </div>
              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-[#FF3B30] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  ¡Listo! Tus pagos se sincronizan en tu iPhone, Apple Watch y Mac con alarmas a 48 hs.
                </p>
              </div>
            </div>
          </div>

          {/* List of items */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Vencimientos a incluir ({targetItems.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {pendingItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const dateStr = convertDueDayToDateStr(item.dueDay);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-white border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-[#FF3B30] focus:ring-rose-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.provider} • Día {item.dueDay} ({dateStr})
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 font-black text-slate-800">
                      {item.estimatedAmount ? formatCurrency(item.estimatedAmount, currency) : 'A definir'}
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
            onClick={handleSyncApple}
            disabled={targetItems.length === 0}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-black text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>Añadir a Apple Calendar ({targetItems.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
