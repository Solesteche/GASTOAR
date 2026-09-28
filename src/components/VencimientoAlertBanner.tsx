import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  X,
  Volume2,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  VencimientoNotificationAlert,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  playNotificationSound,
} from '../services/localNotificationService';

interface VencimientoAlertBannerProps {
  urgentAlerts: VencimientoNotificationAlert[];
  onMarkPaid?: (id: string, source: 'vencimiento' | 'alert_item') => void;
  onNavigateToVencimientos: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const VencimientoAlertBanner: React.FC<VencimientoAlertBannerProps> = ({
  urgentAlerts,
  onMarkPaid,
  onNavigateToVencimientos,
  onShowToast,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  if (urgentAlerts.length === 0 || isDismissed) {
    return null;
  }

  const handleRequestPermission = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      playNotificationSound();
      if (onShowToast) onShowToast('¡Notificaciones activadas con éxito!', 'success');
      sendTestNotification();
    } else if (result === 'denied') {
      if (onShowToast) onShowToast('Las notificaciones están bloqueadas en el navegador.', 'info');
    }
  };

  const handleTestSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNotificationSound();
    if (onShowToast) onShowToast('Sonido de alerta probado ✓', 'info');
  };

  const totalAmount = urgentAlerts.reduce((acc, a) => acc + (a.amount || 0), 0);
  const criticalCount = urgentAlerts.filter(a => a.urgencyLevel === 'critical' || a.urgencyLevel === 'expired').length;

  return (
    <div className="relative z-30 mb-3 overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm transition-all animate-fade-in">
      {/* Soft luminous top accent bar */}
      <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 w-full" />

      {/* Main compact bar */}
      <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white">
        {/* Left: Icon & Compact Summary */}
        <div 
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="relative shrink-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${
              criticalCount > 0
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-amber-500 text-white shadow-xs'
            }`}>
              <AlertTriangle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-white">
              {urgentAlerts.length}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-md shrink-0">
                ⚡ &lt;48 hs
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                {urgentAlerts.length} {urgentAlerts.length === 1 ? 'vencimiento próximo' : 'vencimientos próximos'}
                {totalAmount > 0 && (
                  <span className="text-[#E04B1D] font-black ml-1">
                    (${totalAmount.toLocaleString('es-AR')})
                  </span>
                )}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden sm:block mt-0.5">
              Evitá recargos pagando a tiempo. Tocá para ver los detalles.
            </p>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {permission !== 'granted' && (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-[#E04B1D] text-xs font-bold transition-colors cursor-pointer"
              title="Activar avisos sonoros y en pantalla"
            >
              <BellRing className="w-3 h-3" />
              <span>Avisos</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToVencimientos}
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#F95420] hover:bg-[#E04412] text-white text-xs font-black flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <span>Ver</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isExpanded ? 'Ocultar detalles' : 'Ver detalle de vencimientos'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-orange-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Ocultar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible item list */}
      {isExpanded && (
        <div className="p-2.5 sm:p-3 bg-slate-50/80 border-t border-amber-200/60 space-y-1.5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {urgentAlerts.map(alert => {
              const hrs = Math.max(0, Math.round(alert.hoursRemaining));
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{alert.icon || '💳'}</span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 truncate">
                        {alert.title}
                      </p>
                      <p className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                        <span>⚡</span>
                        <span>{hrs === 0 ? '¡Vence hoy!' : `Vence en ~${hrs}hs`}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {alert.amount > 0 && (
                      <span className="font-black text-slate-800 tabular-nums">
                        ${alert.amount.toLocaleString('es-AR')}
                      </span>
                    )}
                    {onMarkPaid && (
                      <button
                        type="button"
                        onClick={() => onMarkPaid(alert.id, alert.source)}
                        className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95"
                        title="Marcar como abonado"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Pagado</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-slate-500">
            <span>Tocá "Ver" para gestionar códigos de pago y recordatorios completos.</span>
            <button
              type="button"
              onClick={handleTestSound}
              className="text-slate-400 hover:text-orange-600 inline-flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3 h-3" />
              <span>Probar timbre</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
