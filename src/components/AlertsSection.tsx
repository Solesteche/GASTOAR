import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell, BellRing, Building2, Calendar, CalendarClock, CalendarPlus, Check,
  CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy,
  CreditCard, Download, Droplets, Edit3, ExternalLink, FileText, Flame, HeartPulse, Home, Landmark,
  MoreHorizontal, Plus, Search, Trash2, Tv, Wifi, X, Zap, Volume2, AlertTriangle, Sparkles
} from 'lucide-react';
import { CoupleProfile, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  checkAndNotifyVencimientos,
  requestNotificationPermission,
  sendTestNotification,
  playNotificationSound,
  convertDueDayToDateStr,
  calculateHoursUntilDue,
} from '../services/localNotificationService';
import { CalendarExportModal } from './CalendarExportModal';
import { GoogleCalendarSyncModal } from './GoogleCalendarSyncModal';
import { AppleCalendarSyncModal } from './AppleCalendarSyncModal';
import { generateVencimientosICS, downloadICS, openInAppleCalendar, isIOS } from '../utils/icsExport';

export type AlertItemCategory = 'tarjeta' | 'alquiler' | 'expensas' | 'servicio' | 'impuesto' | 'suscripcion' | 'salud' | 'otro';

export interface DueAlertItem {
  id: string;
  category: AlertItemCategory;
  name: string;
  provider: string;
  dueDay: number;
  closeDay?: number;
  estimatedAmount?: number;
  paymentCode?: string;
  autoDebit?: boolean;
  lastDigits?: string;
  color?: string;
  reminderDaysBeforeDue?: number;
  reminderDaysBeforeClose?: number;
  notes?: string;
  paidThisMonth?: boolean;
  paidAt?: number;
  lastSyncedAt?: number;
}

interface AlertsSectionProps {
  profile: CoupleProfile;
  transactions?: Transaction[];
  isDemoMode?: boolean;
  isPro?: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onOpenTransactionModal?: () => void;
  onOpenCalendarModal?: () => void;
  onOpenCashFlow?: () => void;
}

const DEMO_ITEM_IDS = ['e1', 's1', 's3', 'a1', 's4', 's2', 'c1', 'c2'];

const DEFAULT_ALERT_ITEMS: DueAlertItem[] = [
  { id: 'e1', category: 'expensas', name: 'Expensas', provider: 'Consorcio', dueDay: 10, estimatedAmount: 135000, paymentCode: '04928103940129', autoDebit: false, reminderDaysBeforeDue: 2 },
  { id: 's1', category: 'servicio', name: 'Luz', provider: 'Edenor', dueDay: 12, estimatedAmount: 38000, paymentCode: 'Cod. Banelco: 88492019', autoDebit: true, reminderDaysBeforeDue: 2 },
  { id: 's3', category: 'servicio', name: 'Agua', provider: 'AySA', dueDay: 15, estimatedAmount: 28500, paymentCode: 'Cod. Banelco: 88492019', autoDebit: true, reminderDaysBeforeDue: 2 },
  { id: 'a1', category: 'alquiler', name: 'Alquiler', provider: 'Inmobiliaria / Dueño', dueDay: 10, estimatedAmount: 650000, paymentCode: 'alquiler.cbu', autoDebit: false, reminderDaysBeforeDue: 3, notes: 'Transferir antes de las 18 hs y enviar comprobante' },
  { id: 's4', category: 'servicio', name: 'Gas', provider: 'Metrogas', dueDay: 7, estimatedAmount: 14620, paymentCode: 'Referencia: 4892010', autoDebit: true, reminderDaysBeforeDue: 2 },
  { id: 's2', category: 'servicio', name: 'Internet', provider: 'Personal Flow', dueDay: 8, estimatedAmount: 12490, paymentCode: 'Referencia: 9948201', autoDebit: true, reminderDaysBeforeDue: 2 },
  { id: 'c1', category: 'tarjeta', name: 'Visa Santander Black', provider: 'Santander', closeDay: 20, dueDay: 5, lastDigits: '4821', reminderDaysBeforeClose: 1, reminderDaysBeforeDue: 2, autoDebit: true, estimatedAmount: 215450 },
  { id: 'c2', category: 'tarjeta', name: 'Mastercard BBVA', provider: 'BBVA', closeDay: 25, dueDay: 14, lastDigits: '1904', estimatedAmount: 14940, autoDebit: false, reminderDaysBeforeDue: 2 }
];

const CATEGORY_META: Record<AlertItemCategory, { label: string; Icon: React.ElementType; soft: string; text: string }> = {
  tarjeta: { label: 'Tarjeta', Icon: CreditCard, soft: 'bg-[#FFF3EE]', text: 'text-[#F95420]' },
  alquiler: { label: 'Alquiler', Icon: Home, soft: 'bg-[#FFF1F2]', text: 'text-[#E11D48]' },
  expensas: { label: 'Expensas', Icon: Home, soft: 'bg-[#F4EEFF]', text: 'text-[#7C3AED]' },
  servicio: { label: 'Servicio', Icon: Wifi, soft: 'bg-[#EBF4FF]', text: 'text-[#2563EB]' },
  impuesto: { label: 'Impuesto', Icon: Landmark, soft: 'bg-rose-50', text: 'text-rose-600' },
  suscripcion: { label: 'Suscripción', Icon: Tv, soft: 'bg-emerald-50', text: 'text-emerald-600' },
  salud: { label: 'Salud', Icon: HeartPulse, soft: 'bg-teal-50', text: 'text-teal-600' },
  otro: { label: 'Otro', Icon: MoreHorizontal, soft: 'bg-slate-100', text: 'text-slate-600' }
};

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  profile,
  transactions,
  isDemoMode = false,
  isPro = false,
  onShowToast,
  onOpenTransactionModal,
  onOpenCalendarModal,
  onOpenCashFlow,
}) => {
  const [items, setItems] = useState<DueAlertItem[]>(() => {
    try {
      const saved = localStorage.getItem('gastoar_vencimientos_alerts_v5');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (!isDemoMode) {
            // Usuario real: filtrar estrictamente cualquier residuo de items de demo
            return parsed.filter((it: DueAlertItem) => it && it.id && !DEMO_ITEM_IDS.includes(it.id));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Solo ofrecer datos de demo si el modo demo está explícitamente activo
    return isDemoMode ? DEFAULT_ALERT_ITEMS : [];
  });

  // Limpiar residuos de demo si el usuario pasa a modo real
  useEffect(() => {
    if (!isDemoMode) {
      setItems(prev => {
        const hasDemoItems = prev.some(it => it && DEMO_ITEM_IDS.includes(it.id));
        if (hasDemoItems) {
          const cleaned = prev.filter(it => it && !DEMO_ITEM_IDS.includes(it.id));
          localStorage.setItem('gastoar_vencimientos_alerts_v5', JSON.stringify(cleaned));
          return cleaned;
        }
        return prev;
      });
    }
  }, [isDemoMode]);

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [activeView, setActiveView] = useState<'proximos' | 'mes' | 'pagados' | 'todos' | 'calendario'>('proximos');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AlertItemCategory>('all');
  const [sortBy, setSortBy] = useState<'day' | 'amount_desc' | 'name'>('day');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DueAlertItem | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(currentMonth);
  const [calendarYear, setCalendarYear] = useState(currentYear);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(currentDay);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('gastoar_vencimientos_notif_v1') === 'true');
  const [isCalendarExportModalOpen, setIsCalendarExportModalOpen] = useState(false);
  const [isGoogleCalendarModalOpen, setIsGoogleCalendarModalOpen] = useState(false);
  const [isAppleCalendarModalOpen, setIsAppleCalendarModalOpen] = useState(false);

  const handleDirectExportICS = (onlyPending = true) => {
    const targetItems = onlyPending ? items.filter(i => !i.paidThisMonth) : items;
    if (targetItems.length === 0) {
      onShowToast('No hay pagos pendientes para exportar.', 'info');
      return;
    }
    try {
      const ics = generateVencimientosICS(items, {
        currency: profile.currency,
        onlyPending,
        calendarName: 'Vencimientos Pendientes - GastoAR'
      });
      downloadICS(ics, onlyPending ? 'vencimientos_pendientes_gastoar.ics' : 'todos_vencimientos_gastoar.ics');
      onShowToast(`✓ ${targetItems.length} pagos pendientes exportados a .ics`, 'success');
    } catch (e) {
      console.error(e);
      onShowToast('Error al generar el archivo .ics', 'error');
    }
  };

  const [formCategory, setFormCategory] = useState<AlertItemCategory>('servicio');
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formDueDay, setFormDueDay] = useState('');
  const [formCloseDay, setFormCloseDay] = useState('');
  const [formEstimatedAmount, setFormEstimatedAmount] = useState('');
  const [formPaymentCode, setFormPaymentCode] = useState('');
  const [formAutoDebit, setFormAutoDebit] = useState(false);
  const [formLastDigits, setFormLastDigits] = useState('');
  const [formReminderDue, setFormReminderDue] = useState(3);
  const [isCustomReminder, setIsCustomReminder] = useState(false);
  const [customReminderDays, setCustomReminderDays] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const saveItems = (updated: DueAlertItem[]) => {
    setItems(updated);
    localStorage.setItem('gastoar_vencimientos_alerts_v5', JSON.stringify(updated));
  };

  const openCreate = (day?: number) => {
    setEditingItem(null);
    setFormCategory('servicio');
    setFormName('');
    setFormProvider('');
    setFormDueDay(day ? String(day) : '');
    setFormCloseDay('');
    setFormEstimatedAmount('');
    setFormPaymentCode('');
    setFormAutoDebit(false);
    setFormLastDigits('');
    setFormReminderDue(3);
    setIsCustomReminder(false);
    setCustomReminderDays('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEdit = (item: DueAlertItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormName(item.name);
    setFormProvider(item.provider || '');
    setFormDueDay(String(item.dueDay));
    setFormCloseDay(item.closeDay ? String(item.closeDay) : '');
    setFormEstimatedAmount(item.estimatedAmount ? String(item.estimatedAmount) : '');
    setFormPaymentCode(item.paymentCode || '');
    setFormAutoDebit(Boolean(item.autoDebit));
    setFormLastDigits(item.lastDigits || '');
    const rem = item.reminderDaysBeforeDue !== undefined ? item.reminderDaysBeforeDue : 3;
    const isStandard = [0, 1, 2, 3, 5, 7, 10].includes(rem);
    setFormReminderDue(rem);
    setIsCustomReminder(!isStandard);
    setCustomReminderDays(!isStandard ? String(rem) : '');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const applyTemplate = (tpl: { name: string; provider: string; category: AlertItemCategory; defaultAmount: number; defaultDay?: number }) => {
    setEditingItem(null);
    setFormCategory(tpl.category);
    setFormName(tpl.name);
    setFormProvider(tpl.provider);
    setFormDueDay(String(tpl.defaultDay || 10));
    setFormCloseDay('');
    setFormEstimatedAmount(String(tpl.defaultAmount));
    setFormPaymentCode('');
    setFormAutoDebit(false);
    setFormLastDigits('');
    setFormReminderDue(3);
    setIsCustomReminder(false);
    setCustomReminderDays('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onShowToast('Ingresá un nombre para el vencimiento', 'error');
      return;
    }
    const due = Math.min(31, Math.max(1, Number(formDueDay) || 10));
    const close = formCloseDay ? Math.min(31, Math.max(1, Number(formCloseDay) || 20)) : undefined;
    const amount = formEstimatedAmount ? Number(formEstimatedAmount.replace(/[^0-9.]/g, '')) : undefined;
    const finalReminder = isCustomReminder
      ? Math.max(0, Math.min(30, Number(customReminderDays) || 0))
      : formReminderDue;

    const common = {
      category: formCategory,
      name: formName.trim(),
      provider: formProvider.trim() || 'Proveedor',
      dueDay: due,
      closeDay: formCategory === 'tarjeta' ? close : undefined,
      estimatedAmount: Number.isFinite(amount) ? amount : undefined,
      paymentCode: formPaymentCode.trim() || undefined,
      autoDebit: formAutoDebit,
      lastDigits: formCategory === 'tarjeta' ? formLastDigits.trim() || undefined : undefined,
      reminderDaysBeforeDue: finalReminder,
      notes: formNotes.trim() || undefined
    };

    if (editingItem) {
      saveItems(items.map(i => i.id === editingItem.id ? { ...i, ...common } : i));
      onShowToast('Vencimiento actualizado', 'success');
    } else {
      saveItems([...items, { id: `venc-${Date.now()}`, ...common, paidThisMonth: false }]);
      onShowToast('Vencimiento creado', 'success');
    }
    setIsModalOpen(false);
  };

  const togglePaid = (id: string) => {
    saveItems(
      items.map(i => i.id === id ? { ...i, paidThisMonth: !i.paidThisMonth, paidAt: !i.paidThisMonth ? Date.now() : undefined } : i)
    );
    onShowToast('Estado actualizado', 'info');
  };

  const deleteItem = (id: string, name: string) => {
    if (confirm(`¿Eliminar el vencimiento "${name}"?`)) {
      saveItems(items.filter(i => i.id !== id));
      onShowToast('Vencimiento eliminado', 'info');
    }
  };

  const toggleNotifications = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      setNotificationsEnabled(true);
      playNotificationSound();
      onShowToast('¡Servicio de notificaciones a menos de 48 hs activado!', 'success');
      // Trigger evaluation immediately
      checkAndNotifyVencimientos([], items, {
        force: true,
        onInAppAlert: (alert) => {
          onShowToast(`⏰ Alerta: "${alert.title}" vence en menos de 48 hs (${alert.urgencyMessage})`, 'info');
        }
      });
    } else if (res === 'denied') {
      onShowToast('Permiso de notificaciones rechazado en el navegador.', 'info');
    } else {
      onShowToast('Tu navegador no soporta notificaciones de escritorio.', 'info');
    }
  };

  const handleTestNotification = async () => {
    playNotificationSound();
    const ok = await sendTestNotification();
    if (ok) {
      onShowToast('Notificación de prueba enviada con éxito ✓', 'success');
    } else {
      onShowToast('Sonido reproducido. Activa permisos para recibir notificaciones del sistema.', 'info');
    }
  };

  // Verificación periódica y a menos de 48 horas de la fecha de pago
  useEffect(() => {
    if (!notificationsEnabled) return;
    checkAndNotifyVencimientos([], items, {
      force: false,
      onInAppAlert: (alert) => {
        onShowToast(`⏰ Vencimiento en menos de 48 hs: "${alert.title}" (${alert.urgencyMessage})`, 'info');
      }
    });
  }, [notificationsEnabled, items]);

  const stats = useMemo(() => {
    const pending = items.filter(i => !i.paidThisMonth);
    const paid = items.filter(i => i.paidThisMonth);
    const urgent = pending.filter(i => {
      const d = i.dueDay - currentDay;
      return d >= 0 && d <= 7;
    });
    return {
      pendingCount: pending.length,
      paidCount: paid.length,
      urgentCount: urgent.length,
      pendingAmount: pending.reduce((s, i) => s + (i.estimatedAmount || 0), 0),
      paidAmount: paid.reduce((s, i) => s + (i.estimatedAmount || 0), 0)
    };
  }, [items, currentDay]);

  const filteredItems = useMemo(() => {
    let result = items.filter(i => {
      if (activeView === 'mes' && i.paidThisMonth) return false;
      if (activeView === 'pagados' && !i.paidThisMonth) return false;
      if (activeView === 'proximos' && i.paidThisMonth) return false;
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!`${i.name} ${i.provider} ${i.notes || ''}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'amount_desc') return (b.estimatedAmount || 0) - (a.estimatedAmount || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.dueDay - b.dueDay;
    });
  }, [items, activeView, categoryFilter, searchTerm, sortBy]);

  const getItemIconConfig = (item: DueAlertItem) => {
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes('luz') || nameLower.includes('edenor') || nameLower.includes('edesur')) {
      return { Icon: Zap, bg: 'bg-[#FFF3EE]', text: 'text-[#F95420]' };
    }
    if (nameLower.includes('agua') || nameLower.includes('aysa')) {
      return { Icon: Droplets, bg: 'bg-[#EBF4FF]', text: 'text-[#2563EB]' };
    }
    if (nameLower.includes('gas') || nameLower.includes('metrogas') || nameLower.includes('naturgy')) {
      return { Icon: Flame, bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' };
    }
    if (nameLower.includes('expensas') || item.category === 'expensas') {
      return { Icon: Home, bg: 'bg-[#F4EEFF]', text: 'text-[#7C3AED]' };
    }
    if (nameLower.includes('alquiler') || item.category === 'alquiler') {
      return { Icon: Home, bg: 'bg-[#FFF1F2]', text: 'text-[#E11D48]' };
    }
    if (item.category === 'tarjeta') {
      return { Icon: CreditCard, bg: 'bg-[#FFF3EE]', text: 'text-[#F95420]' };
    }
    if (item.category === 'servicio') {
      return { Icon: Wifi, bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]' };
    }
    const meta = CATEGORY_META[item.category] || CATEGORY_META.otro;
    return { Icon: meta.Icon, bg: meta.soft, text: meta.text };
  };

  const formatDueDateString = (day: number) => {
    const monthShort = new Date(currentYear, currentMonth, 1)
      .toLocaleDateString('es-AR', { month: 'short' })
      .replace('.', '');
    return `${day} ${monthShort} ${currentYear}`;
  };

  const monthDays = useMemo(() => {
    const first = new Date(calendarYear, calendarMonth, 1);
    const days = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const mondayOffset = (first.getDay() + 6) % 7;
    return { days, mondayOffset };
  }, [calendarMonth, calendarYear]);

  const changeMonth = (delta: number) => {
    const next = new Date(calendarYear, calendarMonth + delta, 1);
    setCalendarMonth(next.getMonth());
    setCalendarYear(next.getFullYear());
  };

  const calendarLabel = new Date(calendarYear, calendarMonth, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const renderCard = (item: DueAlertItem) => {
    const { Icon, bg, text } = getItemIconConfig(item);
    const expanded = expandedItemId === item.id;
    const dateStr = convertDueDayToDateStr(item.dueDay);
    const hoursCalc = calculateHoursUntilDue(dateStr);
    const isUnder48h = !item.paidThisMonth && hoursCalc.isUnder48Hours;

    return (
      <article
        key={item.id}
        className={`bg-white border rounded-2xl p-3.5 sm:p-4 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-purple-200 ${
          isUnder48h 
            ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/10'
            : item.paidThisMonth 
            ? 'border-slate-100 opacity-80' 
            : 'border-slate-100'
        }`}
      >
        <div
          onClick={() => setExpandedItemId(expanded ? null : item.id)}
          className="flex items-center justify-between gap-2.5 sm:gap-4 cursor-pointer select-none"
        >
          {/* Left: Squircle Icon + Name & Provider */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${bg} ${text} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate">
                  {item.name}
                </h3>
                {item.lastDigits && (
                  <span className="text-[10px] font-mono font-bold text-slate-500">••{item.lastDigits}</span>
                )}
                {isUnder48h && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.2 rounded-md animate-pulse">
                    ⚡ &lt;48 hs
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                {item.provider}
              </p>
            </div>
          </div>

          {/* Center: Due Date with Calendar Icon and Reminder pill */}
          <div className="flex flex-col items-end sm:items-center gap-1 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F95420]">
              <Calendar className="w-3.5 h-3.5 text-[#F95420]" />
              <span className="whitespace-nowrap">{formatDueDateString(item.dueDay)}</span>
            </div>
            {item.reminderDaysBeforeDue !== undefined && (
              <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                <Bell className="w-2.5 h-2.5 text-[#F95420]" />
                <span>{item.reminderDaysBeforeDue === 0 ? 'Aviso el día' : `Aviso -${item.reminderDaysBeforeDue}d`}</span>
              </span>
            )}
          </div>

          {/* Right: Amount + Chevron */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-black text-xs sm:text-sm md:text-base text-slate-900 whitespace-nowrap">
              {item.estimatedAmount ? formatCurrency(item.estimatedAmount, profile.currency) : 'A definir'}
            </span>
            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90 text-purple-600' : ''}`} />
          </div>
        </div>

        {/* Expanded actions panel */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
            {/* Payment reminder info */}
            <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#F95420] flex items-center justify-center shrink-0">
                  <BellRing className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-orange-800">Anticipación del recordatorio</p>
                  <p className="font-bold text-slate-800 text-[11px] sm:text-xs">
                    {item.reminderDaysBeforeDue === 0
                      ? `Aviso programado el mismo día ${item.dueDay} del vencimiento`
                      : `Aviso programado ${item.reminderDaysBeforeDue || 3} ${(item.reminderDaysBeforeDue || 3) === 1 ? 'día' : 'días'} antes (Día ${Math.max(1, item.dueDay - (item.reminderDaysBeforeDue || 3))} de cada mes)`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(item);
                }}
                className="text-[11px] font-bold text-[#F95420] hover:underline cursor-pointer shrink-0"
              >
                Cambiar
              </button>
            </div>

            {item.notes && (
              <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-100">
                <span className="font-bold text-slate-700">Nota: </span>
                {item.notes}
              </div>
            )}
            {item.paymentCode && (
              <div className="p-2.5 rounded-xl bg-orange-50/50 border border-orange-100 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-orange-700">Código / Referencia / Alias</p>
                  <p className="text-xs font-mono font-bold text-slate-800 truncate">{item.paymentCode}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard?.writeText(item.paymentCode!);
                    onShowToast('Código copiado al portapapeles', 'success');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-orange-200 text-[#F95420] text-xs font-bold shrink-0 flex items-center gap-1 hover:bg-orange-50 cursor-pointer active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => togglePaid(item.id)}
                className={`col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform ${
                  item.paidThisMonth ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#F95420] text-white hover:bg-[#E04412]'
                }`}
              >
                <Check className="w-4 h-4" />
                {item.paidThisMonth ? 'Desmarcar pagado' : 'Marcar como pagado'}
              </button>
              {onOpenTransactionModal && !item.paidThisMonth && (
                <button
                  type="button"
                  onClick={onOpenTransactionModal}
                  className="px-3 py-2.5 rounded-xl border border-orange-200 text-[#F95420] bg-orange-50/70 hover:bg-orange-100 text-xs font-bold cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar gasto</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsGoogleCalendarModalOpen(true)}
                className="px-3 py-2.5 rounded-xl border border-blue-200 text-blue-700 bg-blue-50/70 hover:bg-blue-100 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-colors"
                title="Sincronizar en Google Calendar automáticamente"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 40 40">
                  <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
                  <path d="M28 8H12C9.79 8 8 9.79 8 12V28C8 30.21 9.79 32 12 32H28C30.21 32 32 30.21 32 28V12C32 9.79 30.21 8 28 8Z" fill="#FFFFFF"/>
                  <path d="M28 8H12C9.79 8 8 9.79 8 12V15H32V12C32 9.79 30.21 8 28 8Z" fill="#1A73E8"/>
                  <circle cx="13" cy="11.5" r="1.5" fill="#FFFFFF"/>
                  <circle cx="27" cy="11.5" r="1.5" fill="#FFFFFF"/>
                  <text x="20" y="26" fontSize="11" fontWeight="900" fill="#1A73E8" textAnchor="middle" fontFamily="sans-serif">
                    31
                  </text>
                </svg>
                <span>Google Cal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    openInAppleCalendar([item], { currency: profile.currency, onlyPending: false });
                    onShowToast(`✓ Vencimiento "${item.name}" abierto para Apple Calendar`, 'success');
                  } catch (e) {
                    console.error(e);
                    onShowToast('Error al exportar a Apple Calendar', 'error');
                  }
                }}
                className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/70 hover:bg-rose-100 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-colors"
                title="Añadir este pago a Apple Calendar (iOS / iPhone / Mac)"
              >
                <div className="w-3.5 h-3.5 rounded bg-white flex flex-col items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                  <div className="w-full bg-[#FF3B30] text-[4px] leading-none py-0.2" />
                  <span className="text-[7px] font-black text-slate-900 leading-none">{item.dueDay}</span>
                </div>
                <span>Apple Cal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const ics = generateVencimientosICS([item], {
                      currency: profile.currency,
                      onlyPending: false,
                      calendarName: `Pago: ${item.name} - GastoAR`
                    });
                    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    downloadICS(ics, `vencimiento_${safeName}.ics`);
                    onShowToast(`✓ Vencimiento "${item.name}" exportado a .ics para tu calendario`, 'success');
                  } catch (e) {
                    console.error(e);
                    onShowToast('Error al exportar este pago', 'error');
                  }
                }}
                className="px-3 py-2.5 rounded-xl border border-purple-200 text-purple-700 bg-purple-50/70 hover:bg-purple-100 text-xs font-bold cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-colors"
                title="Exportar este pago a Google Calendar / Apple Calendar (.ics)"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-purple-600" />
                <span>Exportar .ics</span>
              </button>
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                onClick={() => deleteItem(item.id, item.name)}
                className="px-3 py-2.5 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        )}
      </article>
    );
  };

  const renderCalendar = () => {
    const selectedItems = selectedCalendarDay ? items.filter(x => x.dueDay === selectedCalendarDay) : [];
    return (
      <section className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-black text-base sm:text-lg text-slate-900 capitalize">{calendarLabel}</h2>
            <p className="text-xs text-slate-500">Tocá un día para ver o agendar vencimientos.</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#F95420] cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(currentMonth);
                setCalendarYear(currentYear);
                setSelectedCalendarDay(currentDay);
              }}
              className="px-3 h-8 rounded-xl border border-orange-200 text-[#F95420] text-xs font-bold cursor-pointer active:scale-95"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#F95420] cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={`${d}-${i}`} className="text-center text-[10px] font-black text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: monthDays.mondayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-11 sm:min-h-16" />
          ))}
          {Array.from({ length: monthDays.days }, (_, i) => i + 1).map(day => {
            const dayItems = items.filter(x => x.dueDay === day);
            const isToday = calendarMonth === currentMonth && calendarYear === currentYear && day === currentDay;
            const isSelected = selectedCalendarDay === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedCalendarDay(day)}
                className={`h-11 sm:min-h-16 rounded-xl border p-1 sm:p-1.5 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-[#F95420] border-[#F95420] bg-orange-50/80 shadow-xs'
                    : isToday
                    ? 'border-[#F95420] bg-orange-50/40'
                    : dayItems.length > 0
                    ? 'border-slate-200 bg-white hover:border-orange-200'
                    : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] sm:text-xs font-black ${isSelected || isToday ? 'text-[#F95420]' : 'text-slate-700'}`}>
                    {day}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F95420]" />
                  )}
                </div>
                {dayItems.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-auto">
                    <span className="w-2 h-2 rounded-full bg-[#F95420]" />
                    {dayItems.length > 1 && (
                      <span className="text-[9px] font-black text-slate-500">+{dayItems.length - 1}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day details */}
        {selectedCalendarDay && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800">
                  Día {selectedCalendarDay} de {new Date(calendarYear, calendarMonth, 1).toLocaleDateString('es-AR', { month: 'long' })}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  ({selectedItems.length} {selectedItems.length === 1 ? 'vencimiento' : 'vencimientos'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => openCreate(selectedCalendarDay)}
                className="px-2.5 py-1.5 rounded-xl bg-orange-50 text-[#F95420] border border-orange-200 text-xs font-bold flex items-center gap-1 hover:bg-orange-100 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar para este día</span>
              </button>
            </div>

            {selectedItems.length > 0 ? (
              <div className="space-y-2">
                {selectedItems.map(renderCard)}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs text-slate-500">No hay vencimientos programados para este día.</p>
                <button
                  type="button"
                  onClick={() => openCreate(selectedCalendarDay)}
                  className="mt-2 text-xs font-extrabold text-[#F95420] hover:underline cursor-pointer"
                >
                  + Programar pago para el día {selectedCalendarDay}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-28 sm:pb-8">
      {/* 1. Header Card (Hero con #6D3FEA) */}
      <section className="bg-gradient-to-br from-[#6D3FEA] via-[#5A2FD1] to-[#451BA8] text-white rounded-3xl p-3 sm:p-5 shadow-xl border border-purple-300/30 space-y-2.5 sm:space-y-3.5 relative overflow-hidden">
        {/* Ambient decorative glow */}
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#F95420]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top row: Icon + Title + Subtitle */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-xs">
            <div className="relative">
              <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#F95420] rounded-full ring-2 ring-[#7C3AED]" />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight">Vencimientos</h1>
            <p className="text-xs text-purple-100 font-normal mt-0.5">Organizá tus pagos y evitá recargos.</p>
          </div>
        </div>

        {/* Second row: Avisos, Calendario, Google Cal, Apple Cal, Exportar .ics & Flujo Pro pills */}
        <div className={`relative z-10 grid ${onOpenCashFlow ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'} gap-1.5 sm:gap-2`}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleNotifications}
              className={`flex-1 py-2 px-2 sm:py-2.5 sm:px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
                notificationsEnabled 
                  ? 'border-white/40 bg-white/25 text-white shadow-xs' 
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {notificationsEnabled ? <BellRing className="w-3.5 h-3.5 text-[#FFA785]" /> : <Bell className="w-3.5 h-3.5 text-purple-100" />}
              <span className="truncate">{notificationsEnabled ? 'Avisos (<48h)' : 'Avisos'}</span>
            </button>
            {notificationsEnabled && (
              <button
                type="button"
                onClick={handleTestNotification}
                className="py-2 px-2 sm:py-2.5 sm:px-2 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                title="Probar sonido y notificación local de 48 hs"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-200" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveView(activeView === 'calendario' ? 'proximos' : 'calendario')}
            className={`py-2 px-2 sm:py-2.5 sm:px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
              activeView === 'calendario'
                ? 'border-white/50 bg-white/30 text-white shadow-xs'
                : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-white" />
            <span className="truncate">Calendario</span>
          </button>

          {/* Sincronizar Google Calendar */}
          <button
            type="button"
            onClick={() => setIsGoogleCalendarModalOpen(true)}
            className="py-2 px-2 sm:py-2.5 sm:px-2.5 rounded-xl border border-blue-300/40 bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            title="Sincronizar pagos con Google Calendar automáticamente"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 40 40">
              <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
              <path d="M28 8H12C9.79 8 8 9.79 8 12V28C8 30.21 9.79 32 12 32H28C30.21 32 32 30.21 32 28V12C32 9.79 30.21 8 28 8Z" fill="#FFFFFF"/>
              <path d="M28 8H12C9.79 8 8 9.79 8 12V15H32V12C32 9.79 30.21 8 28 8Z" fill="#1A73E8"/>
              <circle cx="13" cy="11.5" r="1.5" fill="#FFFFFF"/>
              <circle cx="27" cy="11.5" r="1.5" fill="#FFFFFF"/>
              <text x="20" y="26" fontSize="11" fontWeight="900" fill="#1A73E8" textAnchor="middle" fontFamily="sans-serif">
                31
              </text>
            </svg>
            <span className="truncate">Google Cal</span>
            {stats.pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-400/40 text-blue-100 rounded-md text-[10px] font-black">
                {stats.pendingCount}
              </span>
            )}
          </button>

          {/* Apple Calendar (iOS) */}
          <button
            type="button"
            onClick={() => setIsAppleCalendarModalOpen(true)}
            className="py-2 px-2 sm:py-2.5 sm:px-2.5 rounded-xl border border-rose-300/40 bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            title="Sincronizar con Apple Calendar (iPhone / iPad / Mac)"
          >
            <div className="w-3.5 h-3.5 rounded bg-white flex flex-col items-center justify-center overflow-hidden shrink-0">
              <div className="w-full bg-[#FF3B30] text-[4px] leading-none py-0.2" />
              <span className="text-[7px] font-black text-slate-900 leading-none">{new Date().getDate()}</span>
            </div>
            <span className="truncate">Apple Cal</span>
          </button>

          {/* Exportar a Calendar (.ics) */}
          <button
            type="button"
            onClick={() => setIsCalendarExportModalOpen(true)}
            className="py-2 px-2 sm:py-2.5 sm:px-2.5 rounded-xl border border-amber-300/40 bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            title="Exportar pagos pendientes a un archivo .ics para Google Calendar o Apple Calendar"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-amber-200" />
            <span className="truncate">Exportar .ics</span>
          </button>

          {onOpenCashFlow && (
            <button
              type="button"
              onClick={onOpenCashFlow}
              className="py-2 px-2 sm:py-2.5 sm:px-2 rounded-xl border border-purple-200/40 bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Proyección de Flujo de Caja Pro"
            >
              <span className="text-amber-200">🔮</span>
              <span className="truncate">Flujo Pro</span>
            </button>
          )}
        </div>

        {/* Third row: Full-width vibrant orange button */}
        <button
          type="button"
          onClick={() => openCreate()}
          className="relative z-10 w-full py-2.5 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          <span>Nuevo vencimiento</span>
        </button>
      </section>

      {/* 2. Status Filter Pills */}
      <section className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
        {[
          { id: 'proximos', label: 'Próximos', count: stats.pendingCount },
          { id: 'mes', label: 'Este mes', count: items.filter(i => !i.paidThisMonth).length },
          { id: 'pagados', label: 'Pagados', count: stats.paidCount },
          { id: 'todos', label: 'Todos', count: undefined }
        ].map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                isActive
                  ? 'bg-[#F95420] text-white shadow-xs'
                  : 'bg-[#F1F4F9] text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  isActive ? 'bg-white/25 text-white' : 'bg-white/80 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </section>

      {/* 3. KPI Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Card 1: VENCE PRONTO */}
        <button
          type="button"
          onClick={() => setActiveView('proximos')}
          className="text-left bg-[#FFF6F2] border border-[#FFE7DD] rounded-2xl p-3 sm:p-4 cursor-pointer hover:border-orange-300 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#E04B1D]">
              VENCE PRONTO
            </span>
            <Clock className="w-4 h-4 text-[#E04B1D] shrink-0" />
          </div>
          <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {stats.urgentCount}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">En 7 días</p>
        </button>

        {/* Card 2: PENDIENTES */}
        <button
          type="button"
          onClick={() => setIsCalendarExportModalOpen(true)}
          className="text-left bg-[#F5F7FF] border border-[#E4E9FC] rounded-2xl p-3 sm:p-4 cursor-pointer hover:border-indigo-300 transition-all active:scale-[0.98] group"
          title="Click para exportar pagos pendientes a Google Calendar o Apple Calendar (.ics)"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#4F6BE8]">
              PENDIENTES
            </span>
            <div className="flex items-center gap-1 text-[#4F6BE8]">
              <CalendarPlus className="w-3.5 h-3.5 opacity-80 group-hover:scale-110 transition-transform" />
              <FileText className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 text-xs sm:text-base font-black text-slate-900 leading-tight truncate">
            {formatCurrency(stats.pendingAmount, profile.currency)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#4F6BE8] font-bold mt-0.5 truncate flex items-center justify-between">
            <span>{stats.pendingCount} {stats.pendingCount === 1 ? 'pago' : 'pagos'}</span>
            <span className="text-[9px] underline">.ics ➔</span>
          </p>
        </button>

        {/* Card 3: PAGADOS */}
        <button
          type="button"
          onClick={() => setActiveView('pagados')}
          className="text-left bg-[#F2FAF5] border border-[#DDF0E5] rounded-2xl p-3 sm:p-4 cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#22A05B]">
              PAGADOS
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#22A05B] shrink-0" />
          </div>
          <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {stats.paidCount}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
            {formatCurrency(stats.paidAmount, profile.currency)}
          </p>
        </button>
      </div>

      {activeView === 'calendario' ? renderCalendar() : (
        <>
          {/* 4. Quick templates ("Agregá rápido") */}
          <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">Agregá rápido</h2>
                <p className="text-[11px] text-slate-400">Plantillas para tus pagos habituales.</p>
              </div>
              <button
                type="button"
                onClick={() => openCreate()}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Ver todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
              {[
                { name: 'Alquiler', icon: Home, bg: 'bg-red-50 text-red-500', defaultAmount: 650000, category: 'alquiler' as AlertItemCategory, provider: 'Inmobiliaria / Dueño' },
                { name: 'Expensas', icon: FileText, bg: 'bg-orange-50 text-orange-500', defaultAmount: 135000, category: 'expensas' as AlertItemCategory, provider: 'Consorcio' },
                { name: 'Luz', icon: Zap, bg: 'bg-amber-50 text-amber-500', defaultAmount: 38000, category: 'servicio' as AlertItemCategory, provider: 'Edenor' },
                { name: 'Agua', icon: Droplets, bg: 'bg-blue-50 text-blue-500', defaultAmount: 28500, category: 'servicio' as AlertItemCategory, provider: 'AySA' },
              ].map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="px-3.5 py-2 rounded-2xl bg-white border border-slate-100 hover:border-purple-200 flex items-center gap-2 shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <span className={`w-8 h-8 rounded-xl ${tpl.bg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-slate-800">{tpl.name}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => openCreate()}
                className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                title="Más plantillas"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* 5. Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar vencimiento..."
              className="w-full pl-10 pr-9 py-3 rounded-2xl bg-[#F5F7FA] border border-slate-200/80 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Calendar Sync Banner */}
          {stats.pendingCount > 0 && activeView !== 'pagados' && (
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/70 border border-blue-200/80 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Calendar className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-black text-slate-900 truncate">
                      Sincronizá tus vencimientos en tu calendario
                    </p>
                    <span className="text-[9px] bg-blue-600 text-white font-extrabold uppercase px-1.5 py-0.2 rounded-full">
                      Auto-Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    {stats.pendingCount} {stats.pendingCount === 1 ? 'pago pendiente' : 'pagos pendientes'} con alarmas automáticas en Google y Apple Calendar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsGoogleCalendarModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all"
                  title="Sincronizar con Google Calendar"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Google Cal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAppleCalendarModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
                  title="Añadir a Apple Calendar (iOS / iPhone / Mac)"
                >
                  <div className="w-3.5 h-3.5 rounded bg-white flex flex-col items-center justify-center overflow-hidden shrink-0">
                    <div className="w-full bg-[#FF3B30] text-[4px] leading-none py-0.2" />
                    <span className="text-[7px] font-black text-slate-900 leading-none">{new Date().getDate()}</span>
                  </div>
                  <span>Apple Cal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarExportModalOpen(true)}
                  className="px-2 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Descargar archivo manual .ics"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>.ics</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. List of Items */}
          <section className="space-y-2.5">
            {/* List Heading */}
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                {activeView === 'pagados' ? 'Pagados este mes' : activeView === 'todos' ? 'Todos los vencimientos' : 'Próximos vencimientos'}
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                {stats.pendingCount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsGoogleCalendarModalOpen(true)}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                      title="Sincronizar pagos con Google Calendar"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 40 40">
                        <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
                        <path d="M28 8H12C9.79 8 8 9.79 8 12V28C8 30.21 9.79 32 12 32H28C30.21 32 32 30.21 32 28V12C32 9.79 30.21 8 28 8Z" fill="#FFFFFF"/>
                        <path d="M28 8H12C9.79 8 8 9.79 8 12V15H32V12C32 9.79 30.21 8 28 8Z" fill="#1A73E8"/>
                        <circle cx="13" cy="11.5" r="1.5" fill="#FFFFFF"/>
                        <circle cx="27" cy="11.5" r="1.5" fill="#FFFFFF"/>
                        <text x="20" y="26" fontSize="11" fontWeight="900" fill="#1A73E8" textAnchor="middle" fontFamily="sans-serif">
                          31
                        </text>
                      </svg>
                      <span className="hidden sm:inline">Google Cal</span>
                      <span className="sm:hidden">GCal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAppleCalendarModalOpen(true)}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                      title="Añadir a Apple Calendar (iOS / iPhone / Mac)"
                    >
                      <div className="w-3.5 h-3.5 rounded bg-white flex flex-col items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                        <div className="w-full bg-[#FF3B30] text-[4px] leading-none py-0.2" />
                        <span className="text-[7px] font-black text-slate-900 leading-none">{new Date().getDate()}</span>
                      </div>
                      <span className="hidden sm:inline">Apple Cal</span>
                      <span className="sm:hidden">Apple</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCalendarExportModalOpen(true)}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F95420] border border-orange-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                      title="Exportar pagos pendientes a un archivo .ics para Google Calendar o Apple Calendar"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Exportar .ics</span>
                      <span className="sm:hidden">.ics</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-[#F95420] text-white text-[10px] font-black">
                        {stats.pendingCount}
                      </span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setActiveView('todos')}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Ver todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {filteredItems.length ? (
              filteredItems.map(renderCard)
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-6 sm:p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F95420] mx-auto flex items-center justify-center">
                  <CalendarClock className="w-6 h-6" />
                </div>
                <h3 className="mt-3 text-sm font-black text-slate-800">No hay vencimientos registrados</h3>
                <p className="mt-1 text-xs text-slate-500">Agregá tus servicios, tarjetas o alquileres para llevar el control.</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openCreate()}
                    className="px-4 py-2.5 rounded-xl bg-[#F95420] text-white text-xs font-extrabold cursor-pointer active:scale-95 shadow-sm hover:bg-[#E04412]"
                  >
                    + Agregar vencimiento
                  </button>
                  {isDemoMode && (
                    <button
                      type="button"
                      onClick={() => saveItems(DEFAULT_ALERT_ITEMS)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Cargar ejemplos de prueba
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* Responsive Modal / Bottom Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {editingItem ? 'Editar vencimiento' : 'Nuevo vencimiento'}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Configurá cuándo y cuánto tenés que pagar.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveForm} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] sm:text-xs font-extrabold text-slate-700">Tipo de gasto</label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-1.5">
                  {(Object.keys(CATEGORY_META) as AlertItemCategory[]).map(cat => {
                    const M = CATEGORY_META[cat];
                    const I = M.Icon;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`p-2 rounded-xl border text-[11px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition-colors ${
                          formCategory === cat
                            ? 'bg-[#F95420] text-white border-[#F95420]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <I className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{M.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <label className="text-[11px] sm:text-xs font-extrabold text-slate-700">
                  Nombre
                  <input
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ej. Internet, Expensas, Visa"
                    className="mt-1 w-full px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="text-[11px] sm:text-xs font-extrabold text-slate-700">
                  Proveedor
                  <input
                    value={formProvider}
                    onChange={e => setFormProvider(e.target.value)}
                    placeholder="Ej. Edenor, BBVA, Consorcio"
                    className="mt-1 w-full px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <label className="text-[11px] sm:text-xs font-extrabold text-slate-700">
                  Día vencimiento
                  <input
                    inputMode="numeric"
                    value={formDueDay}
                    onChange={e => setFormDueDay(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 10"
                    className="mt-1 w-full px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"
                  />
                </label>
                <label className="text-[11px] sm:text-xs font-extrabold text-slate-700">
                  Monto estimado
                  <input
                    inputMode="decimal"
                    value={formEstimatedAmount}
                    onChange={e => setFormEstimatedAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="$ 0"
                    className="mt-1 w-full px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"
                  />
                </label>
              </div>

              {formCategory === 'tarjeta' && (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <label className="text-[11px] sm:text-xs font-extrabold text-slate-700">
                    Día de cierre
                    <input
                      inputMode="numeric"
                      value={formCloseDay}
                      onChange={e => setFormCloseDay(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej. 20"
                      className="mt-1 w-full px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"
                    />
                  </label>
                  <label className="text-[11px] sm:text-xs font-extrabold text-slate-700">
                    Últimos 4 dígitos
                    <input
                      inputMode="numeric"
                      maxLength={4}
                      value={formLastDigits}
                      onChange={e => setFormLastDigits(e.target.value.replace(/\D/g, ''))}
                      placeholder="4821"
                      className="mt-1 w-full px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"
                    />
                  </label>
                </div>
              )}

              <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 block">
                Código de pago / referencia / Alias
                <input
                  value={formPaymentCode}
                  onChange={e => setFormPaymentCode(e.target.value)}
                  placeholder="CBU, referencia, número de cliente..."
                  className="mt-1 w-full px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"
                />
              </label>

              <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Débito automático</p>
                  <p className="text-[10px] text-slate-500">Se debita solo de tu cuenta o tarjeta.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAutoDebit(v => !v)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${formAutoDebit ? 'bg-[#F95420]' : 'bg-slate-300'}`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${formAutoDebit ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {/* Anticipación del recordatorio */}
              <div className="rounded-2xl bg-orange-50/70 border border-orange-100 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#F95420]" />
                    <span className="text-xs font-black text-slate-800">Anticipación del recordatorio</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#F95420] bg-white px-2 py-0.5 rounded-full border border-orange-200">
                    {isCustomReminder
                      ? `${customReminderDays || '0'} días antes`
                      : formReminderDue === 0
                      ? 'Mismo día'
                      : `${formReminderDue} ${formReminderDue === 1 ? 'día' : 'días'} antes`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Elegí con cuántos días de anticipación querés recibir la alerta o aviso para abonar:
                </p>

                {/* Anticipation pill options */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1">
                  {[
                    { value: 0, label: 'Mismo día' },
                    { value: 1, label: '1 día antes' },
                    { value: 2, label: '2 días antes' },
                    { value: 3, label: '3 días antes' },
                    { value: 5, label: '5 días antes' },
                    { value: 7, label: '1 semana' },
                    { value: 10, label: '10 días' },
                  ].map(opt => {
                    const active = !isCustomReminder && formReminderDue === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setIsCustomReminder(false);
                          setFormReminderDue(opt.value);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                          active
                            ? 'bg-[#F95420] text-white border-[#F95420] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomReminder(true);
                      if (!customReminderDays) setCustomReminderDays('4');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                      isCustomReminder
                        ? 'bg-[#F95420] text-white border-[#F95420] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>

                {/* Custom numeric input */}
                {isCustomReminder && (
                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Ingresá la cantidad de días de anticipación (0 a 30):
                      <div className="relative mt-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={30}
                          value={customReminderDays}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '') {
                              setCustomReminderDays('');
                            } else {
                              const n = Math.min(30, Math.max(0, parseInt(val, 10) || 0));
                              setCustomReminderDays(String(n));
                            }
                          }}
                          placeholder="Ej. 4"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-orange-200 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-orange-200"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                          días antes
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Calculated preview text */}
                <div className="p-2 rounded-xl bg-white border border-orange-100/70 text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#F95420] shrink-0" />
                  <span>
                    {(() => {
                      const due = Math.min(31, Math.max(1, Number(formDueDay) || 10));
                      const remDays = isCustomReminder
                        ? Math.max(0, Math.min(30, Number(customReminderDays) || 0))
                        : formReminderDue;
                      if (remDays === 0) {
                        return `Te avisará el mismo día ${due} de cada mes.`;
                      }
                      const notifDay = Math.max(1, due - remDays);
                      return `Vence el día ${due}. Te avisará con ${remDays} ${remDays === 1 ? 'día' : 'días'} de anticipación (día ${notifDay} de cada mes).`;
                    })()}
                  </span>
                </div>
              </div>

              <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 block">
                Notas (opcional)
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ej. transferir antes de las 18 hs y enviar comprobante"
                  rows={2}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:border-orange-300"
                />
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-extrabold cursor-pointer hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#F95420] hover:bg-[#E04412] text-white text-xs font-extrabold cursor-pointer active:scale-95 transition-transform"
                >
                  {editingItem ? 'Guardar cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Export Modal (.ics for Google Calendar and Apple Calendar) */}
      <CalendarExportModal
        isOpen={isCalendarExportModalOpen}
        onClose={() => setIsCalendarExportModalOpen(false)}
        items={items}
        currency={profile.currency}
        onShowToast={onShowToast}
        onOpenGoogleCalendarSync={() => setIsGoogleCalendarModalOpen(true)}
        onOpenAppleCalendarSync={() => setIsAppleCalendarModalOpen(true)}
      />

      {/* Google Calendar Direct Automated Sync Modal */}
      <GoogleCalendarSyncModal
        isOpen={isGoogleCalendarModalOpen}
        onClose={() => setIsGoogleCalendarModalOpen(false)}
        items={items}
        currency={profile.currency}
        onShowToast={onShowToast}
        onSyncComplete={() => {
          try {
            const saved = localStorage.getItem('gastoar_vencimientos_alerts_v5');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) setItems(parsed);
            }
          } catch {}
        }}
      />

      {/* Apple Calendar (iOS / iPhone / Mac) Native Sync Modal */}
      <AppleCalendarSyncModal
        isOpen={isAppleCalendarModalOpen}
        onClose={() => setIsAppleCalendarModalOpen(false)}
        items={items}
        currency={profile.currency}
        onShowToast={onShowToast}
      />
    </div>
  );
};
