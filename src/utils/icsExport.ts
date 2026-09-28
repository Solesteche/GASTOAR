import { DueAlertItem } from '../components/AlertsSection';
import { formatCurrency } from './formatters';
import { convertDueDayToDateStr } from '../services/localNotificationService';

/**
 * Escapes characters per RFC 5545 iCalendar specification
 */
function escapeICS(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Formats YYYY-MM-DD into iCalendar DATE format YYYYMMDD
 */
function formatDateToICSValue(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/**
 * Computes next day in YYYYMMDD format for exclusive DTEND in all-day events
 */
function getNextDayICSValue(dateStr: string): string {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const nextDate = new Date(y, m, d + 1);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${nextDate.getFullYear()}${pad(nextDate.getMonth() + 1)}${pad(nextDate.getDate())}`;
}

/**
 * Generates an iCalendar (.ics) string for payment items (DueAlertItem[])
 * Compatible with Google Calendar, Apple Calendar, Outlook, and other standard calendar apps.
 */
export function generateVencimientosICS(
  items: DueAlertItem[],
  options: {
    currency?: string;
    onlyPending?: boolean;
    calendarName?: string;
  } = {}
): string {
  const {
    currency = 'ARS',
    onlyPending = true,
    calendarName = 'Vencimientos Pendientes - GastoAR'
  } = options;

  const targetItems = onlyPending ? items.filter(i => !i.paidThisMonth) : items;

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GastoAR//Control de Gastos y Vencimientos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
    'X-WR-CALDESC:Pagos y vencimientos pendientes para Google Calendar y Apple Calendar'
  ];

  targetItems.forEach((item) => {
    const dateStr = convertDueDayToDateStr(item.dueDay, now);
    const dtstart = formatDateToICSValue(dateStr);
    const dtend = getNextDayICSValue(dateStr);

    const amountFormatted = item.estimatedAmount ? formatCurrency(item.estimatedAmount, currency) : '';
    const summary = amountFormatted 
      ? `Pagar ${item.name} (${amountFormatted})` 
      : `Pagar ${item.name}`;

    const descriptionParts: string[] = [];
    descriptionParts.push(`Vencimiento: ${item.name}`);
    if (item.provider) descriptionParts.push(`Proveedor / Empresa: ${item.provider}`);
    if (item.estimatedAmount) descriptionParts.push(`Monto estimado: ${amountFormatted}`);
    if (item.paymentCode) descriptionParts.push(`Código de pago / Referencia: ${item.paymentCode}`);
    if (item.autoDebit !== undefined) descriptionParts.push(`Débito automático: ${item.autoDebit ? 'Sí' : 'No'}`);
    if (item.lastDigits) descriptionParts.push(`Últimos 4 dígitos tarjeta: ••${item.lastDigits}`);
    if (item.notes) descriptionParts.push(`Notas: ${item.notes}`);
    descriptionParts.push(`Categoría: ${item.category.toUpperCase()}`);
    descriptionParts.push(`Estado: ${item.paidThisMonth ? 'Pagado' : 'Pendiente'}`);
    descriptionParts.push(`Generado por GastoAR`);

    const description = escapeICS(descriptionParts.join('\n'));
    const reminderDays = item.reminderDaysBeforeDue !== undefined ? item.reminderDaysBeforeDue : 2;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:vencimiento-${item.id}-${dtstart}@gastoar.app`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
    lines.push(`DTEND;VALUE=DATE:${dtend}`);
    lines.push(`SUMMARY:${escapeICS(summary)}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:TRANSPARENT');
    lines.push(`CATEGORIES:PAGOS,VENCIMIENTOS,${item.category.toUpperCase()}`);

    // Alarm prior to due date (e.g. 2 days before)
    if (reminderDays > 0) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Recordatorio: ${escapeICS(item.name)} vence en ${reminderDays} días`);
      lines.push(`TRIGGER:-P${reminderDays}D`);
      lines.push('END:VALARM');
    }

    // Alarm on the due date
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:¡Hoy vence el pago de ${escapeICS(item.name)}!`);
    lines.push('TRIGGER:-PT0M');
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Helper to detect if device is an Apple device (iPhone, iPad, Mac)
 */
export function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Macintosh|iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
}

/**
 * Triggers native Apple Calendar (.ics) import optimized for iOS Safari / macOS.
 * In iOS Safari, opening a calendar .ics triggers the native "Añadir a Calendario" sheet in 1 tap.
 */
export function openInAppleCalendar(
  items: DueAlertItem[],
  options: { currency?: string; onlyPending?: boolean } = {}
): void {
  const ics = generateVencimientosICS(items, {
    currency: options.currency || 'ARS',
    onlyPending: options.onlyPending !== undefined ? options.onlyPending : true,
    calendarName: 'Vencimientos GastoAR'
  });

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'vencimientos_apple_calendar.ics');
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Triggers browser download of .ics file
 */
export function downloadICS(content: string, filename = 'vencimientos_pendientes.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates direct Google Calendar Web URL for a single item
 */
export function generateGoogleCalendarWebUrl(item: DueAlertItem, currency = 'ARS'): string {
  const now = new Date();
  const dateStr = convertDueDayToDateStr(item.dueDay, now);
  const dtstart = formatDateToICSValue(dateStr);
  const dtend = getNextDayICSValue(dateStr);

  const amountFormatted = item.estimatedAmount ? formatCurrency(item.estimatedAmount, currency) : '';
  const summary = amountFormatted 
    ? `Pagar ${item.name} (${amountFormatted})` 
    : `Pagar ${item.name}`;

  const details: string[] = [];
  details.push(`Vencimiento: ${item.name}`);
  if (item.provider) details.push(`Proveedor: ${item.provider}`);
  if (item.estimatedAmount) details.push(`Monto estimado: ${amountFormatted}`);
  if (item.paymentCode) details.push(`Código de pago: ${item.paymentCode}`);
  if (item.notes) details.push(`Notas: ${item.notes}`);
  details.push(`Exportado desde GastoAR`);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${dtstart}/${dtend}`,
    details: details.join('\n')
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
