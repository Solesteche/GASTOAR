import { DueAlertItem } from '../components/AlertsSection';
import { formatCurrency } from '../utils/formatters';
import { convertDueDayToDateStr } from './localNotificationService';
import { getAccessToken, requestGoogleCalendarAccessToken } from '../lib/firebase';

export interface CalendarSyncResult {
  success: boolean;
  total: number;
  created: number;
  updated: number;
  errors: string[];
}

export interface CalendarSyncProgress {
  current: number;
  total: number;
  itemName: string;
  status: 'syncing' | 'success' | 'error';
}

/**
 * Calculates next calendar day in YYYY-MM-DD for exclusive DTEND in Google Calendar all-day events
 */
function getNextDayDateStr(dateStr: string): string {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const nextDate = new Date(y, m, d + 1);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}`;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  tarjeta: '💳',
  alquiler: '🏠',
  expensas: '🏢',
  servicio: '⚡',
  impuesto: '🏛️',
  suscripcion: '📺',
  salud: '🩺',
  otro: '📌'
};

/**
 * Builds Google Calendar event payload for a DueAlertItem
 */
function buildCalendarEventPayload(item: DueAlertItem, currency: string) {
  const dateStr = convertDueDayToDateStr(item.dueDay);
  const nextDayStr = getNextDayDateStr(dateStr);
  const emoji = CATEGORY_EMOJIS[item.category] || '🔔';

  const amountStr = item.estimatedAmount ? formatCurrency(item.estimatedAmount, currency) : '';
  const summary = amountStr 
    ? `${emoji} Vencimiento: ${item.name} (${amountStr})` 
    : `${emoji} Vencimiento: ${item.name}`;

  const descLines: string[] = [
    `🔔 Recordatorio de Pago • GastoAR`,
    `Concepto: ${item.name}`,
    `Proveedor: ${item.provider}`,
  ];

  if (item.estimatedAmount) {
    descLines.push(`Monto estimado: ${amountStr}`);
  }
  if (item.paymentCode) {
    descLines.push(`Código / CBU / Alias / Referencia: ${item.paymentCode}`);
  }
  if (item.autoDebit !== undefined) {
    descLines.push(`Débito automático: ${item.autoDebit ? 'Sí (verificar saldo en cuenta)' : 'No (pago manual requerido)'}`);
  }
  if (item.lastDigits) {
    descLines.push(`Tarjeta: terminación ••${item.lastDigits}`);
  }
  if (item.notes) {
    descLines.push(`Notas: ${item.notes}`);
  }
  descLines.push(``);
  descLines.push(`Sincronizado automáticamente desde GastoAR`);
  descLines.push(`[GastoAR_ID:${item.id}]`);

  const reminderDays = item.reminderDaysBeforeDue !== undefined ? item.reminderDaysBeforeDue : 2;
  const overrides: Array<{ method: string; minutes: number }> = [];

  if (reminderDays > 0) {
    overrides.push({ method: 'popup', minutes: reminderDays * 1440 });
  }
  // Morning of the due day (9:00 AM approx / 180 min before midnight UTC projection)
  overrides.push({ method: 'popup', minutes: 180 });

  return {
    summary,
    description: descLines.join('\n'),
    start: { date: dateStr },
    end: { date: nextDayStr },
    recurrence: ['RRULE:FREQ=MONTHLY'],
    reminders: {
      useDefault: false,
      overrides
    },
    extendedProperties: {
      private: {
        gastoar_item_id: item.id,
        gastoar_source: 'gastoar_app'
      }
    }
  };
}

/**
 * Lists all existing events in primary calendar that were created by GastoAR
 */
async function fetchExistingGastoarEvents(accessToken: string): Promise<any[]> {
  try {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('q', 'GastoAR');
    url.searchParams.set('maxResults', '250');

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn('Could not fetch existing calendar events:', res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (err) {
    console.warn('Error fetching existing calendar events:', err);
    return [];
  }
}

/**
 * Synchronizes pending or selected payment items directly to Google Calendar using the Google Calendar REST API
 */
export async function syncPaymentsToGoogleCalendar(
  items: DueAlertItem[],
  options: {
    currency?: string;
    onlyPending?: boolean;
    onProgress?: (progress: CalendarSyncProgress) => void;
  } = {}
): Promise<CalendarSyncResult> {
  const {
    currency = 'ARS',
    onlyPending = true,
    onProgress
  } = options;

  const targetItems = onlyPending ? items.filter(i => !i.paidThisMonth) : items;

  if (targetItems.length === 0) {
    return {
      success: true,
      total: 0,
      created: 0,
      updated: 0,
      errors: []
    };
  }

  // Obtain access token
  let token = await getAccessToken();
  if (!token) {
    token = await requestGoogleCalendarAccessToken();
  }

  if (!token) {
    throw new Error('No se pudo obtener la autorización para Google Calendar. Por favor inicia sesión.');
  }

  // Find existing GastoAR events to avoid duplicate events and update them cleanly
  const existingEvents = await fetchExistingGastoarEvents(token);

  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (let idx = 0; idx < targetItems.length; idx++) {
    const item = targetItems[idx];
    const payload = buildCalendarEventPayload(item, currency);

    if (onProgress) {
      onProgress({
        current: idx + 1,
        total: targetItems.length,
        itemName: item.name,
        status: 'syncing'
      });
    }

    // Match existing event by gastoar_item_id in extendedProperties or marker in description
    const existing = existingEvents.find(ev => {
      const extId = ev.extendedProperties?.private?.gastoar_item_id;
      if (extId && extId === item.id) return true;
      const desc = ev.description || '';
      return desc.includes(`[GastoAR_ID:${item.id}]`);
    });

    try {
      if (existing && existing.id) {
        // Update existing event
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Error HTTP ${res.status}`);
        }
        updatedCount++;
      } else {
        // Create new event
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Error HTTP ${res.status}`);
        }
        createdCount++;
      }

      if (onProgress) {
        onProgress({
          current: idx + 1,
          total: targetItems.length,
          itemName: item.name,
          status: 'success'
        });
      }
    } catch (err: any) {
      console.error(`Error sincronizando "${item.name}" con Google Calendar:`, err);
      errors.push(`${item.name}: ${err?.message || 'Error desconocido'}`);

      if (onProgress) {
        onProgress({
          current: idx + 1,
          total: targetItems.length,
          itemName: item.name,
          status: 'error'
        });
      }
    }
  }

  // Mark items as synced in storage
  try {
    const now = Date.now();
    const currentSaved = localStorage.getItem('gastoar_vencimientos_alerts_v5');
    if (currentSaved) {
      const parsed = JSON.parse(currentSaved);
      if (Array.isArray(parsed)) {
        const targetIds = new Set(targetItems.map(i => i.id));
        const updatedItems = parsed.map((it: any) => targetIds.has(it.id) ? { ...it, lastSyncedAt: now } : it);
        localStorage.setItem('gastoar_vencimientos_alerts_v5', JSON.stringify(updatedItems));
      }
    }
    localStorage.setItem('gastoar_last_calendar_sync', String(now));
  } catch (err) {
    console.warn('Could not update lastSyncedAt in localStorage:', err);
  }

  return {
    success: errors.length === 0,
    total: targetItems.length,
    created: createdCount,
    updated: updatedCount,
    errors
  };
}
