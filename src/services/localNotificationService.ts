import { Vencimiento } from '../types';
import { DueAlertItem } from '../components/AlertsSection';

export interface VencimientoNotificationAlert {
  id: string;
  title: string;
  amount: number;
  dueDate: string;          // ISO format YYYY-MM-DD
  dueTimestamp: number;     // ms of payment deadline (23:59:59 of dueDate)
  hoursRemaining: number;   // exact hours until payment deadline
  isUnder48Hours: boolean;  // hoursRemaining <= 48 && hoursRemaining >= -24
  urgencyLevel: 'expired' | 'critical' | 'warning' | 'normal'; // critical: <= 24h, warning: <= 48h
  urgencyMessage: string;   // e.g. "¡Vence hoy!", "Vence en 14 horas", "Vence en 38 horas"
  category?: string;
  icon?: string;
  source: 'vencimiento' | 'alert_item';
  isPaid?: boolean;
}

export interface LocalNotificationSettings {
  enabled: boolean;
  sound: boolean;
  thresholdHours: number; // default 48
}

const STORAGE_KEY_SETTINGS = 'gastoar_vencimientos_notif_settings_v1';
const STORAGE_KEY_LOG = 'gastoar_vencimientos_notif_log_v2';
const STORAGE_KEY_ENABLED = 'gastoar_vencimientos_notif_v1';

/**
 * Audio cue using Web Audio API synthesis (cross-platform, zero asset dependency)
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a friendly, distinct two-tone alert chime (F5 -> A5)
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now); // F5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.18, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.debug('Audio notification not available:', e);
  }
}

/**
 * Checks if browser Web Notifications API is supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission state ('granted' | 'denied' | 'default' | 'unsupported')
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
    }
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Gets user configuration for notification service
 */
export function getNotificationSettings(): LocalNotificationSettings {
  const isGranted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  const savedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);
  const isEnabled = savedEnabled !== null ? savedEnabled === 'true' : isGranted;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: isEnabled,
        sound: parsed.sound ?? true,
        thresholdHours: 48,
      };
    }
  } catch {}

  return {
    enabled: isEnabled,
    sound: true,
    thresholdHours: 48,
  };
}

/**
 * Updates user configuration
 */
export function saveNotificationSettings(settings: Partial<LocalNotificationSettings>): LocalNotificationSettings {
  const current = getNotificationSettings();
  const updated = { ...current, ...settings, thresholdHours: 48 };
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  if (settings.enabled !== undefined) {
    localStorage.setItem(STORAGE_KEY_ENABLED, String(settings.enabled));
  }
  return updated;
}

/**
 * Converts a day of month (dueDay) to a full ISO date string YYYY-MM-DD
 */
export function convertDueDayToDateStr(dueDay: number, now = new Date()): string {
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let targetMonth = currentMonth;
  let targetYear = currentYear;

  // If dueDay already passed more than 2 days ago in this month, project to next month
  if (dueDay < currentDay && (currentDay - dueDay) > 2) {
    targetMonth = currentMonth + 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear++;
    }
  }

  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(Math.max(1, dueDay), maxDays);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(clampedDay)}`;
}

/**
 * Precise calculation of hours remaining until due date
 * Deadline is considered 23:59:59 of the payment due date.
 */
export function calculateHoursUntilDue(dueDateStr: string): {
  dueTimestamp: number;
  hoursRemaining: number;
  isUnder48Hours: boolean;
  urgencyLevel: 'expired' | 'critical' | 'warning' | 'normal';
  urgencyMessage: string;
} {
  const parts = dueDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  // Expiration deadline: end of the payment day (23:59:59)
  const dueDate = new Date(year, month, day, 23, 59, 59, 999);
  const now = new Date();

  const diffMs = dueDate.getTime() - now.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDateOnly = new Date(year, month, day).getTime();
  const daysDiff = Math.round((dueDateOnly - todayDateOnly) / (1000 * 60 * 60 * 24));

  // Under 48 hours threshold: hoursRemaining <= 48 and not expired more than 24h ago
  const isUnder48Hours = hoursRemaining <= 48 && hoursRemaining >= -24;

  let urgencyLevel: 'expired' | 'critical' | 'warning' | 'normal' = 'normal';
  let urgencyMessage = '';

  if (hoursRemaining < 0 && hoursRemaining >= -24) {
    urgencyLevel = 'expired';
    urgencyMessage = '¡El plazo vence hoy!';
  } else if (daysDiff === 0 || hoursRemaining <= 24) {
    urgencyLevel = 'critical';
    const hrs = Math.max(1, Math.round(hoursRemaining));
    urgencyMessage = daysDiff === 0
      ? `¡Vence hoy! (~${hrs} hs restantes)`
      : `Vence en ${hrs} horas (mañana)`;
  } else if (hoursRemaining <= 48) {
    urgencyLevel = 'warning';
    const hrs = Math.round(hoursRemaining);
    urgencyMessage = `Vence en ${hrs} horas (en 2 días)`;
  } else {
    urgencyLevel = 'normal';
    urgencyMessage = `Vence en ${daysDiff} días`;
  }

  return {
    dueTimestamp: dueDate.getTime(),
    hoursRemaining,
    isUnder48Hours,
    urgencyLevel,
    urgencyMessage,
  };
}

/**
 * Scans both Vencimiento models and returns list of all upcoming vencimientos
 * with exact time calculations, filtering those under 48 hours.
 */
export function analyzeVencimientos(
  vencimientos: Vencimiento[] = [],
  alertItems: DueAlertItem[] = []
): {
  all: VencimientoNotificationAlert[];
  urgentUnder48Hours: VencimientoNotificationAlert[];
  criticalUnder24Hours: VencimientoNotificationAlert[];
} {
  const result: VencimientoNotificationAlert[] = [];
  const seenKeys = new Set<string>();

  // 1. Process Vencimientos (from App.tsx state)
  for (const v of vencimientos) {
    if (v.isPaid) continue;
    if (!v.dueDate) continue;

    const calc = calculateHoursUntilDue(v.dueDate);
    const item: VencimientoNotificationAlert = {
      id: v.id,
      title: v.title || 'Vencimiento',
      amount: v.amount || 0,
      dueDate: v.dueDate,
      dueTimestamp: calc.dueTimestamp,
      hoursRemaining: calc.hoursRemaining,
      isUnder48Hours: calc.isUnder48Hours,
      urgencyLevel: calc.urgencyLevel,
      urgencyMessage: calc.urgencyMessage,
      category: v.cat,
      icon: v.icon || '💳',
      source: 'vencimiento',
      isPaid: v.isPaid,
    };

    result.push(item);
    seenKeys.add(v.title.toLowerCase().trim());
  }

  // 2. Process DueAlertItem (from AlertsSection / localStorage)
  for (const a of alertItems) {
    if (a.paidThisMonth) continue;
    const normName = a.name.toLowerCase().trim();
    // Avoid double counting if already present in vencimientos
    if (seenKeys.has(normName)) continue;

    const dateStr = convertDueDayToDateStr(a.dueDay);
    const calc = calculateHoursUntilDue(dateStr);

    const item: VencimientoNotificationAlert = {
      id: a.id,
      title: a.name,
      amount: a.estimatedAmount || 0,
      dueDate: dateStr,
      dueTimestamp: calc.dueTimestamp,
      hoursRemaining: calc.hoursRemaining,
      isUnder48Hours: calc.isUnder48Hours,
      urgencyLevel: calc.urgencyLevel,
      urgencyMessage: calc.urgencyMessage,
      category: a.category,
      icon: a.category === 'tarjeta' ? '💳' : a.category === 'expensas' ? '🏢' : '⚡',
      source: 'alert_item',
      isPaid: a.paidThisMonth,
    };

    result.push(item);
    seenKeys.add(normName);
  }

  // Sort by hours remaining (most urgent first)
  result.sort((a, b) => a.hoursRemaining - b.hoursRemaining);

  const urgentUnder48Hours = result.filter(r => r.isUnder48Hours);
  const criticalUnder24Hours = result.filter(r => r.hoursRemaining <= 24 && r.hoursRemaining >= -24);

  return {
    all: result,
    urgentUnder48Hours,
    criticalUnder24Hours,
  };
}

/**
 * Sends a native browser notification via Service Worker or Notification API
 */
export async function dispatchNativeNotification(
  title: string,
  body: string,
  tag: string,
  extraData?: any
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  // Try Service Worker registration first
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag,
          renotify: true,
          data: extraData || { url: '/#card_alerts' },
        } as any);
        return true;
      }
    }
  } catch (err) {
    console.debug('ServiceWorker notification fallback to window.Notification:', err);
  }

  // Fallback to standard window Notification
  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag,
    });
    notif.onclick = () => {
      window.focus();
      const el = document.getElementById('vencimientos-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    return true;
  } catch (err) {
    console.warn('Native notification failed:', err);
    return false;
  }
}

/**
 * Checks for vencimientos under 48 hours and dispatches notifications
 * Deduplicates to prevent spamming the user repeatedly.
 */
export async function checkAndNotifyVencimientos(
  vencimientos: Vencimiento[],
  alertItems: DueAlertItem[] = [],
  options: {
    force?: boolean;
    onInAppAlert?: (alert: VencimientoNotificationAlert) => void;
  } = {}
): Promise<{
  urgentCount: number;
  urgentAlerts: VencimientoNotificationAlert[];
  notificationsSent: number;
}> {
  const settings = getNotificationSettings();
  const { urgentUnder48Hours } = analyzeVencimientos(vencimientos, alertItems);

  if (urgentUnder48Hours.length === 0) {
    return { urgentCount: 0, urgentAlerts: [], notificationsSent: 0 };
  }

  // Load notification log to avoid repeating notification within 12 hours
  let log: Record<string, { lastSent: number; level: string }> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOG);
    if (raw) log = JSON.parse(raw);
  } catch {}

  const now = Date.now();
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  let notificationsSent = 0;

  for (const alert of urgentUnder48Hours) {
    const lastEntry = log[alert.id];
    const hoursSinceLast = lastEntry ? (now - lastEntry.lastSent) : Infinity;

    // Conditions to send native notification:
    // 1) Forced check (e.g. user requested verification) OR
    // 2) Never notified before OR
    // 3) More than 12 hours passed OR
    // 4) Escalated to critical (<= 24h) when previous alert was only warning (>24h)
    const shouldSend =
      options.force ||
      !lastEntry ||
      hoursSinceLast > TWELVE_HOURS ||
      (alert.urgencyLevel === 'critical' && lastEntry.level === 'warning');

    if (shouldSend) {
      const formattedAmount = alert.amount > 0 ? `$${alert.amount.toLocaleString('es-AR')}` : '';
      const title = `⚠️ Vencimiento Próximo: ${alert.title}`;
      const body = `${alert.urgencyMessage}${formattedAmount ? ` por ${formattedAmount}` : ''}. No olvides pagarlo para mantener tus finanzas al día.`;

      // Dispatch native notification if permissions are active
      if (settings.enabled && Notification.permission === 'granted') {
        const ok = await dispatchNativeNotification(title, body, `venc-${alert.id}`, { id: alert.id });
        if (ok) notificationsSent++;
      }

      // Play audio chime if enabled
      if (settings.sound && (options.force || notificationsSent > 0)) {
        playNotificationSound();
      }

      // Trigger in-app toast / banner callback
      if (options.onInAppAlert) {
        options.onInAppAlert(alert);
      }

      // Update log
      log[alert.id] = { lastSent: now, level: alert.urgencyLevel };
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_LOG, JSON.stringify(log));
  } catch {}

  return {
    urgentCount: urgentUnder48Hours.length,
    urgentAlerts: urgentUnder48Hours,
    notificationsSent,
  };
}

/**
 * Triggers a manual test notification to verify audio and browser integration
 */
export async function sendTestNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  playNotificationSound();

  if (perm === 'granted') {
    return await dispatchNativeNotification(
      '🔔 Notificación de Prueba • GastoAR',
      '¡El servicio de alertas de vencimientos locales a 48 hs está activo y funcionando correctamente!',
      'test-notification'
    );
  }
  return false;
}
