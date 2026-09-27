import React, { useState, useEffect } from 'react';
import { Bell, BellRing, AlertTriangle, CheckCircle2, ChevronRight, X, Volume2, ShieldAlert } from 'lucide-react';
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

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  if (urgentAlerts.length === 0 || isDismissed) {
    return null;
  }

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      playNotificationSound();
      if (onShowToast) onShowToast('¡Notificaciones del navegador activadas con éxito!', 'success');
      sendTestNotification();
    } else if (result === 'denied') {
      if (onShowToast) onShowToast('Las notificaciones fueron bloqueadas en los permisos del navegador.', 'info');
    }
  };

  const handleTestSound = () => {
    playNotificationSound();
    if (onShowToast) onShowToast('Sonido de alerta probado ✓', 'info');
  };

  const totalAmount = urgentAlerts.reduce((acc, a) => acc + (a.amount || 0), 0);
  const criticalCount = urgentAlerts.filter(a => a.urgencyLevel === 'critical' || a.urgencyLevel === 'expired').length;

  return (
    <div className="relative z-30 mb-4 overflow-hidden rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-[#2a1b18] dark:via-[#26172e] dark:to-[#2b1820] p-3.5 sm:p-4 shadow-md transition-all animate-fade-in">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Icon & Title */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative shrink-0 mt-0.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              criticalCount > 0
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white">
              {urgentAlerts.length}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                ⚡ Menos de 48 Horas
              </span>
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 dark:bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200">
                  ¡Vence hoy o mañana!
                </span>
              )}
            </div>

            <h4 className="mt-1 text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
              Tenés {urgentAlerts.length} {urgentAlerts.length === 1 ? 'vencimiento próximo' : 'vencimientos próximos'} a abonar
              {totalAmount > 0 && (
                <span className="text-[#F95420] dark:text-orange-400 font-extrabold ml-1">
                  (${totalAmount.toLocaleString('es-AR')})
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              El servicio de alertas locales te avisa para evitar recargos e intereses de pago tardío.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 self-end md:self-center">
          {permission !== 'granted' && (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#F95420] to-[#E04412] text-white text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              title="Permitir alertas en el navegador y celular"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Activar avisos</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToVencimientos}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-purple-900/50 text-slate-800 dark:text-white text-xs font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <span>Ver vencimientos</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={handleTestSound}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-purple-900/40 text-slate-500 hover:text-[#7928CA] dark:text-slate-400 transition-colors"
            title="Probar sonido del timbre de alerta"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Ocultar por esta sesión"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List of items under 48 hours */}
      <div className="mt-3 pt-3 border-t border-amber-200/70 dark:border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {urgentAlerts.map(alert => {
          const isCritical = alert.urgencyLevel === 'critical' || alert.urgencyLevel === 'expired';
          const hrs = Math.max(0, Math.round(alert.hoursRemaining));
          return (
            <div
              key={alert.id}
              className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white/90 dark:bg-slate-850/80 border border-amber-100 dark:border-purple-900/30 shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{alert.icon || '💳'}</span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {alert.title}
                  </p>
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>⚡</span>
                    <span>{hrs === 0 ? '¡Vence hoy!' : `Quedan ~${hrs} horas`}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {alert.amount > 0 && (
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
                    ${alert.amount.toLocaleString('es-AR')}
                  </span>
                )}
                {onMarkPaid && (
                  <button
                    type="button"
                    onClick={() => onMarkPaid(alert.id, alert.source)}
                    className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                    title="Marcar como pagado"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pagar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
