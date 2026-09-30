import { useEffect, useState, useCallback, useMemo } from 'react';
import { Vencimiento } from '../types';
import { DueAlertItem } from '../components/AlertsSection';
import {
  VencimientoNotificationAlert,
  analyzeVencimientos,
  checkAndNotifyVencimientos,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  playNotificationSound,
  getNotificationSettings,
  saveNotificationSettings,
} from '../services/localNotificationService';

interface UseVencimientoNotificationsOptions {
  vencimientos: Vencimiento[];
  alertItems?: DueAlertItem[];
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  checkIntervalMs?: number; // default 15 minutes
}

export function useVencimientoNotifications({
  vencimientos,
  alertItems,
  onShowToast,
  checkIntervalMs = 15 * 60 * 1000,
}: UseVencimientoNotificationsOptions) {
  const [permission, setPermission] = useState<string>(() => getNotificationPermission());
  const [settings, setSettings] = useState(() => getNotificationSettings());

  // Get alert items from state or fallback to localStorage
  const resolvedAlertItems = useMemo<DueAlertItem[]>(() => {
    if (alertItems && alertItems.length > 0) return alertItems;
    try {
      const saved = localStorage.getItem('gastoar_vencimientos_alerts_v5');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }, [alertItems]);

  // Compute urgent list
  const analysis = useMemo(() => {
    return analyzeVencimientos(vencimientos, resolvedAlertItems);
  }, [vencimientos, resolvedAlertItems]);

  const urgentAlerts = analysis.urgentUnder48Hours;
  const urgentCount = urgentAlerts.length;
  const criticalCount = analysis.criticalUnder24Hours.length;

  // Run check and notification dispatch (dispatches system notifications outside the app, no in-app launch popup)
  const checkNotifications = useCallback(async (force = false) => {
    const result = await checkAndNotifyVencimientos(vencimientos, resolvedAlertItems, {
      force,
      // No in-app alert when opening the app - native OS/browser notifications and calendar reminders handle alerts outside the app
    });
    return result;
  }, [vencimientos, resolvedAlertItems]);

  // Initial check on mount & whenever vencimientos change
  useEffect(() => {
    checkNotifications(false);
  }, [checkNotifications]);

  // Periodic check
  useEffect(() => {
    const timer = setInterval(() => {
      checkNotifications(false);
    }, checkIntervalMs);

    return () => clearInterval(timer);
  }, [checkNotifications, checkIntervalMs]);

  // Check on tab visibility / focus change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNotifications(false);
        setPermission(getNotificationPermission());
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [checkNotifications]);

  // Request notification permissions
  const requestPermission = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    setSettings(getNotificationSettings());
    if (res === 'granted') {
      playNotificationSound();
      if (onShowToast) {
        onShowToast('¡Notificaciones locales activadas! Recibirás avisos a menos de 48 hs.', 'success');
      }
      // Run immediate notification check
      checkNotifications(true);
    }
    return res;
  }, [checkNotifications, onShowToast]);

  // Trigger test notification
  const triggerTest = useCallback(async () => {
    playNotificationSound();
    const ok = await sendTestNotification();
    if (onShowToast) {
      if (ok) {
        onShowToast('Notificación de prueba enviada con éxito ✓', 'success');
      } else {
        onShowToast('Alerta sonora reproducida. Para notificaciones de escritorio, activa los permisos.', 'info');
      }
    }
    return ok;
  }, [onShowToast]);

  // Update settings
  const updateSettings = useCallback((partial: Partial<typeof settings>) => {
    const updated = saveNotificationSettings(partial);
    setSettings(updated);
  }, []);

  return {
    permission,
    settings,
    urgentAlerts,
    urgentCount,
    criticalCount,
    allVencimientos: analysis.all,
    checkNotifications,
    requestPermission,
    triggerTest,
    updateSettings,
    playNotificationSound,
  };
}
