import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Bell, BellRing, Building2, Calendar, CalendarClock, CalendarPlus, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, Copy,
  CreditCard, Download, Droplets, Edit3, ExternalLink, FileText, Flame, HeartPulse, History, Home, Landmark,
  Layers, LayoutGrid, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2, Tv, Wifi, X, Zap, Volume2, AlertTriangle, Sparkles, Star
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
  paidMonth?: string; // YYYY-MM for automatic monthly reset
  paidAt?: number;
  lastSyncedAt?: number;
}

interface AlertsSectionProps {
  profile: CoupleProfile;
  transactions?: Transaction[];
  isDemoMode?: boolean;
  isPro?: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onSaveTransaction?: (txData: Partial<Transaction>) => void;
  onOpenTransactionModal?: () => void;
  onOpenCalendarModal?: () => void;
  onOpenCashFlow?: () => void;
}

const DEMO_ITEM_IDS = ['e1', 's1', 's3', 'a1', 's4', 's2', 'c1', 'c2'];

const ALL_QUICK_TEMPLATES = [
  { name: 'Alquiler', icon: Home, bg: 'bg-red-50 text-red-500', defaultAmount: 650000, category: 'alquiler' as AlertItemCategory, provider: 'Inmobiliaria / Dueño' },
  { name: 'Expensas', icon: FileText, bg: 'bg-orange-50 text-orange-500', defaultAmount: 135000, category: 'expensas' as AlertItemCategory, provider: 'Consorcio' },
  { name: 'Luz', icon: Zap, bg: 'bg-amber-50 text-amber-500', defaultAmount: 38000, category: 'servicio' as AlertItemCategory, provider: 'Edenor' },
  { name: 'Agua', icon: Droplets, bg: 'bg-blue-50 text-blue-500', defaultAmount: 28500, category: 'servicio' as AlertItemCategory, provider: 'AySA' },
  { name: 'Gas', icon: Flame, bg: 'bg-amber-50 text-amber-600', defaultAmount: 14620, category: 'servicio' as AlertItemCategory, provider: 'Metrogas' },
  { name: 'Internet', icon: Wifi, bg: 'bg-sky-50 text-sky-500', defaultAmount: 12490, category: 'servicio' as AlertItemCategory, provider: 'Personal Flow' },
  { name: 'Tarjeta', icon: CreditCard, bg: 'bg-purple-50 text-purple-600', defaultAmount: 215450, category: 'tarjeta' as AlertItemCategory, provider: 'Visa Santander / BBVA' },
  { name: 'Streaming', icon: Tv, bg: 'bg-emerald-50 text-emerald-600', defaultAmount: 6500, category: 'suscripcion' as AlertItemCategory, provider: 'Netflix / Spotify' },
];

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

const CATEGORY_META: Record<AlertItemCategory, { label: string; Icon: React.ElementType; soft: string; text: string; border: string }> = {
  tarjeta: { label: 'Tarjeta', Icon: CreditCard, soft: 'bg-[#FFF3EE]', text: 'text-[#F95420]', border: 'border-orange-200' },
  alquiler: { label: 'Alquiler', Icon: Home, soft: 'bg-[#FFF1F2]', text: 'text-[#E11D48]', border: 'border-rose-200' },
  expensas: { label: 'Expensas', Icon: Home, soft: 'bg-[#F4EEFF]', text: 'text-[#7C3AED]', border: 'border-purple-200' },
  servicio: { label: 'Servicio', Icon: Wifi, soft: 'bg-[#EBF4FF]', text: 'text-[#2563EB]', border: 'border-blue-200' },
  impuesto: { label: 'Impuesto', Icon: Landmark, soft: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  suscripcion: { label: 'Suscripción', Icon: Tv, soft: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  salud: { label: 'Salud', Icon: HeartPulse, soft: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  otro: { label: 'Otro', Icon: MoreHorizontal, soft: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
};

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  profile,
  transactions,
  isDemoMode = false,
  isPro = false,
  onShowToast,
  onSaveTransaction,
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
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Reinicio automático mensual de vencimientos recurrentes al comenzar un nuevo mes
  useEffect(() => {
    setItems((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        if (it.paidThisMonth && it.paidMonth && it.paidMonth !== currentMonthKey) {
          changed = true;
          return { ...it, paidThisMonth: false, paidAt: undefined, paidMonth: undefined };
        }
        return it;
      });
      if (changed) {
        try {
          localStorage.setItem('gastoar_vencimientos_alerts_v5', JSON.stringify(next));
        } catch {}
        return next;
      }
      return prev;
    });
  }, [currentMonthKey]);

  const [activeView, setActiveView] = useState<'proximos' | 'mes' | 'pagados' | 'todos' | 'calendario'>('proximos');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'week' | 'month' | 'next'>('all');
  const [promptPayItem, setPromptPayItem] = useState<DueAlertItem | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [payScopeInput, setPayScopeInput] = useState<'individual' | 'pareja'>('individual');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [templateFrequency, setTemplateFrequency] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('gastoar_vencimientos_tpl_freq');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isCalendarSynced, setIsCalendarSynced] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gastoar_calendar_synced') === 'true';
    } catch {
      return false;
    }
  });
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AlertItemCategory>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'this_month' | 'next_month' | 'overdue'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'auto' | 'manual' | 'tarjeta'>('all');
  const [activeCarouselPage, setActiveCarouselPage] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const clientWidth = carouselRef.current.clientWidth;
      const page = Math.round(scrollLeft / (clientWidth * 0.8));
      setActiveCarouselPage(page);
    }
  };

  const scrollToCarouselPage = (pageIdx: number) => {
    if (carouselRef.current) {
      const clientWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: pageIdx * (clientWidth * 0.8),
        behavior: 'smooth'
      });
      setActiveCarouselPage(pageIdx);
    }
  };
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
    const target = items.find((i) => i.id === id);
    if (!target) return;
    if (target.paidThisMonth) {
      saveItems(
        items.map((i) =>
          i.id === id
            ? { ...i, paidThisMonth: false, paidAt: undefined, paidMonth: undefined }
            : i
        )
      );
      onShowToast('Vencimiento marcado nuevamente como pendiente', 'info');
      return;
    }

    if (onSaveTransaction) {
      setPromptPayItem(target);
      setPayAmountInput(target.estimatedAmount ? String(target.estimatedAmount) : '');
      setPayScopeInput(target.category === 'alquiler' || target.category === 'expensas' ? 'pareja' : 'individual');
      return;
    }

    saveItems(
      items.map((i) =>
        i.id === id
          ? { ...i, paidThisMonth: true, paidAt: Date.now(), paidMonth: currentMonthKey }
          : i
      )
    );
    onShowToast('Vencimiento marcado como pagado', 'success');
  };

  const confirmMarkPaid = (recordInMovimientos: boolean) => {
    if (!promptPayItem) return;
    const finalAmt = parseFloat(payAmountInput.replace(',', '.')) || promptPayItem.estimatedAmount || 0;
    saveItems(
      items.map((i) =>
        i.id === promptPayItem.id
          ? {
              ...i,
              estimatedAmount: finalAmt > 0 ? finalAmt : i.estimatedAmount,
              paidThisMonth: true,
              paidAt: Date.now(),
              paidMonth: currentMonthKey,
            }
          : i
      )
    );

    if (recordInMovimientos && onSaveTransaction && finalAmt > 0) {
      const catMapByAlert: Record<AlertItemCategory, string> = {
        tarjeta: 'Tarjetas',
        alquiler: 'Hogar',
        expensas: 'Hogar',
        servicio: 'Servicios',
        impuesto: 'Impuestos',
        suscripcion: 'Suscripciones',
        salud: 'Salud',
        otro: 'Otros',
      };
      onSaveTransaction({
        concepto: `Pago ${promptPayItem.name}${promptPayItem.provider ? ` (${promptPayItem.provider})` : ''}`,
        monto: finalAmt,
        moneda: profile.currency || 'ARS',
        categoria: catMapByAlert[promptPayItem.category] || 'Servicios',
        subcategoria: CATEGORY_META[promptPayItem.category]?.label || 'General',
        fecha: new Date().toISOString().split('T')[0],
        tipo: payScopeInput,
        tipoTransaccion: 'gasto',
        pagadoPor: profile.currentUser || 'user1',
        splitType: payScopeInput === 'pareja' ? profile.defaultSplit : undefined,
        metodoPago: promptPayItem.autoDebit ? 'Débito' : 'Transferencia',
      });
      onShowToast(`Pagado y registrado en Movimientos ($${finalAmt.toLocaleString('es-AR')})`, 'success');
    } else {
      onShowToast('Vencimiento marcado como pagado', 'success');
    }

    setPromptPayItem(null);
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
    setConfirmDeleteId(null);
    onShowToast('Vencimiento eliminado', 'info');
  };

  const toggleNotifications = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      setNotificationsEnabled(true);
      localStorage.setItem('gastoar_vencimientos_notif_v1', 'true');
      playNotificationSound();
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: 'Alertas de GastoAR activadas',
          body: 'Te avisaremos antes de que venzan tus servicios y tarjetas.',
          url: '/vencimientos',
        });
      }
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

  // Calculations for Hero Balance Card (Matching Gastos en Cuotas / Movimientos style)
  const totalCommitted = stats.pendingAmount + stats.paidAmount;
  const percentPaid = totalCommitted > 0 
    ? Math.min(100, Math.max(0, Math.round((stats.paidAmount / totalCommitted) * 100))) 
    : (items.length > 0 && stats.pendingCount === 0 ? 100 : 0);

  // Totales de gastos/compromisos por categoría para el carrusel
  const categoryTotals = useMemo(() => {
    const totals: Partial<Record<AlertItemCategory, number>> = {};
    items.forEach(it => {
      const cat = it.category || 'otro';
      totals[cat] = (totals[cat] || 0) + (it.estimatedAmount || 0);
    });
    return totals;
  }, [items]);

  // Mostrar ÚNICAMENTE categorías que tengan gasto/monto > 0 o la categoría seleccionada (Req 3: cero ruido de categorías vacías)
  const carouselCategories = useMemo<AlertItemCategory[]>(() => {
    const activeWithSpending = (Object.keys(CATEGORY_META) as AlertItemCategory[])
      .filter(cat => (categoryTotals[cat] || 0) > 0 || categoryFilter === cat)
      .sort((a, b) => (categoryTotals[b] || 0) - (categoryTotals[a] || 0));

    if (activeWithSpending.length === 0) {
      const present = Array.from(new Set(items.map(i => i.category)));
      return present.length > 0 ? present : (['servicio', 'tarjeta', 'expensas', 'alquiler'] as AlertItemCategory[]);
    }
    return activeWithSpending;
  }, [categoryTotals, categoryFilter, items]);

  const filteredItems = useMemo(() => {
    let result = items.filter(i => {
      // 1. Status view filter
      if (activeView === 'mes' && i.paidThisMonth) return false;
      if (activeView === 'pagados' && !i.paidThisMonth) return false;
      if (activeView === 'proximos' && i.paidThisMonth) return false;

      // 2. Plazo / Fecha filter
      if (dateFilter === 'overdue') {
        if (i.paidThisMonth || i.dueDay >= currentDay) return false;
      } else if (dateFilter === 'week') {
        const diff = i.dueDay - currentDay;
        if (diff < 0 || diff > 7) return false;
      } else if (dateFilter === 'next_month') {
        const diff = i.dueDay - currentDay;
        if (diff <= 7) return false;
      }

      // 3. Modo de pago filter
      if (modeFilter === 'auto' && !i.autoDebit) return false;
      if (modeFilter === 'manual' && i.autoDebit) return false;
      if (modeFilter === 'tarjeta' && i.category !== 'tarjeta') return false;

      // 4. Categoría filter
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;

      // 5. Búsqueda con feedback
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = `${i.name} ${i.provider} ${i.notes || ''} ${i.paymentCode || ''} ${i.lastDigits || ''}`.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'amount_desc') return (b.estimatedAmount || 0) - (a.estimatedAmount || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.dueDay - b.dueDay;
    });
  }, [items, activeView, dateFilter, modeFilter, categoryFilter, searchTerm, sortBy, currentDay]);

  const totalFilteredAmount = useMemo(() => {
    return filteredItems.reduce((acc, it) => acc + (it.estimatedAmount || 0), 0);
  }, [filteredItems]);

  const isSearchFiltered = searchTerm.trim().length > 0;
  const isDateFiltered = dateFilter !== 'all';
  const isModeFiltered = modeFilter !== 'all';
  const isCategoryFiltered = categoryFilter !== 'all';

  const activeFiltersCount = (isSearchFiltered ? 1 : 0) +
    (isDateFiltered ? 1 : 0) +
    (isModeFiltered ? 1 : 0) +
    (isCategoryFiltered ? 1 : 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setModeFilter('all');
    setCategoryFilter('all');
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'week': return 'Próximos 7 días';
      case 'this_month': return 'Este mes';
      case 'next_month': return 'Próximo mes';
      case 'overdue': return 'Vencidos';
      default: return 'Todos los plazos';
    }
  };

  const getModeFilterLabel = () => {
    switch (modeFilter) {
      case 'auto': return 'Débito automático';
      case 'manual': return 'Pago manual';
      case 'tarjeta': return 'Tarjeta de crédito';
      default: return 'Todos los modos';
    }
  };

  const getCategoryFilterLabel = () => {
    if (categoryFilter === 'all') return 'Todas';
    return CATEGORY_META[categoryFilter]?.label || categoryFilter;
  };

  // ─── Agrupación de filas de vencimientos por fecha (Req 4) ──────────────────────
  interface VencimientoDateGroup {
    dateKey: string;
    day: number;
    displayDate: string;
    isToday: boolean;
    isTomorrow: boolean;
    isPast: boolean;
    hasUnpaid: boolean;
    totalAmount: number;
    items: DueAlertItem[];
  }

  const groupedVencimientos = useMemo<VencimientoDateGroup[]>(() => {
    const groupsMap = new Map<number, DueAlertItem[]>();

    filteredItems.forEach(it => {
      const day = it.dueDay || 1;
      const existing = groupsMap.get(day) || [];
      existing.push(it);
      groupsMap.set(day, existing);
    });

    const monthName = new Date(currentYear, currentMonth, 1)
      .toLocaleDateString('es-AR', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const sortedDays = Array.from(groupsMap.keys()).sort((a, b) => {
      if (sortBy === 'amount_desc') {
        const sumA = (groupsMap.get(a) || []).reduce((s, i) => s + (i.estimatedAmount || 0), 0);
        const sumB = (groupsMap.get(b) || []).reduce((s, i) => s + (i.estimatedAmount || 0), 0);
        return sumB - sumA;
      }
      return a - b;
    });

    const groups: VencimientoDateGroup[] = [];
    sortedDays.forEach(day => {
      const list = groupsMap.get(day) || [];
      const isToday = day === currentDay;
      const isTomorrow = day === currentDay + 1;
      const isPast = day < currentDay;
      const hasUnpaid = list.some(i => !i.paidThisMonth);
      const totalAmount = list.reduce((sum, i) => sum + (i.estimatedAmount || 0), 0);

      let displayDate = `Día ${day} de ${capitalizedMonth}`;
      if (isToday) {
        displayDate = `Hoy, ${day} de ${capitalizedMonth}`;
      } else if (isTomorrow) {
        displayDate = `Mañana, ${day} de ${capitalizedMonth}`;
      } else if (isPast && hasUnpaid) {
        const daysAgo = currentDay - day;
        displayDate = `Día ${day} • Vencido hace ${daysAgo} ${daysAgo === 1 ? 'día' : 'días'}`;
      } else if (isPast && !hasUnpaid) {
        displayDate = `Día ${day} de ${capitalizedMonth} • Pagado ✓`;
      }

      groups.push({
        dateKey: `day-${day}`,
        day,
        displayDate,
        isToday,
        isTomorrow,
        isPast,
        hasUnpaid,
        totalAmount,
        items: list,
      });
    });

    return groups;
  }, [filteredItems, currentDay, currentMonth, currentYear, sortBy]);

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
              {confirmDeleteId === item.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="px-3 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2.5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(item.id)}
                  className="px-3 py-2.5 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )}
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
    <div className="space-y-4 max-w-4xl mx-auto pb-28 sm:pb-8 font-sans">
      {/* 1. Header: Section title + Actions (Estilo idéntico a Gastos en Cuotas / Resumen) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <p className="text-sm text-gray-400">Servicios & Tarjetas</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vencimientos</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={toggleNotifications}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
              notificationsEnabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white hover:bg-purple-50/50 text-slate-700'
            }`}
            title="Activar recordatorios automáticos en tu dispositivo"
          >
            {notificationsEnabled ? (
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{notificationsEnabled ? 'Alertas activas' : 'Activar alertas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView(activeView === 'calendario' ? 'proximos' : 'calendario')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-purple-50/50 text-slate-700 hover:text-[#6F2EC5] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Ver vista calendario mensual o lista de vencimientos"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>{activeView === 'calendario' ? 'Ver Lista' : 'Calendario'}</span>
          </button>

          <button
            type="button"
            onClick={() => openCreate()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 bg-[#6936F5] hover:bg-[#5b2bd9]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Vencimiento</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Balance Card (Estilo Resumen: Saldo por pagar & % Pagado con linear-gradient) */}
      <div
        style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D3FEA 55%, #7C3AED 100%)' }}
        className="text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-purple-300/30 relative overflow-hidden"
      >
        <div className="w-full">
          <p className="text-xs sm:text-sm font-medium text-white/80 mb-1.5 tracking-wide">
            Saldo total por pagar
          </p>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[32px] sm:text-4xl font-black font-outfit text-white tracking-tight leading-none truncate">
              {formatCurrency(stats.pendingAmount, profile.currency)}
            </h2>
          </div>
          <div className="h-1 rounded-full overflow-hidden mb-2.5 bg-white/20">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#FFA234] via-[#F97316] to-[#F95420]"
              style={{ 
                width: `${Math.min(100, Math.max(stats.paidAmount > 0 ? 5 : 0, percentPaid))}%`, 
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/80 flex-wrap">
            <span>Total a pagar:{" "}
              <span className="font-semibold text-white">{formatCurrency(totalCommitted, profile.currency)}</span>
            </span>
            <span>•</span>
            <span>Pagado:{" "}
              <span className="font-semibold text-emerald-300">{formatCurrency(stats.paidAmount, profile.currency)}</span>
            </span>
          </div>
        </div>
      </div>



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

          {/* 5. REDUCED COMPACT FILTER BAR (Estilo idéntico a la solapa compartida / image_4fc71c01.png) */}
          <section className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200/80">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar vencimientos o servicios..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Plazo Dropdown */}
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                >
                  <option value="all">Plazo: Todos</option>
                  <option value="week">Próximos 7 días</option>
                  <option value="this_month">Este mes</option>
                  <option value="next_month">Próximo mes</option>
                  <option value="overdue">Vencidos</option>
                </select>

                {/* Categorías Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                >
                  <option value="all">Todas las categorías</option>
                  {(Object.keys(CATEGORY_META) as AlertItemCategory[]).map(cat => (
                    <option key={cat} value={cat}>
                      {CATEGORY_META[cat]?.label || cat}
                    </option>
                  ))}
                </select>

                {/* Modo Dropdown */}
                <select
                  value={modeFilter}
                  onChange={e => setModeFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                >
                  <option value="all">Modo: Todos</option>
                  <option value="auto">Débito automático</option>
                  <option value="manual">Pago manual</option>
                  <option value="tarjeta">Tarjeta de crédito</option>
                </select>

                {/* Reset button if active */}
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 transition-all cursor-pointer"
                    title="Restablecer filtros"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </section>



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

          {/* 7. List of Items Grouped by Date (Req 4: agrupación por fecha) */}
          <section className="space-y-4">
            {/* List Heading */}
            <div className="flex items-center justify-between px-0.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  {activeView === 'pagados' ? 'Pagados este mes' : activeView === 'todos' ? 'Todos los vencimientos' : 'Próximos vencimientos'}
                </h2>
                <span className="text-[11px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredItems.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {stats.pendingCount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsGoogleCalendarModalOpen(true)}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                      title="Sincronizar pagos con Google Calendar"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Google Cal</span>
                      <span className="sm:hidden">GCal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAppleCalendarModalOpen(true)}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                      title="Añadir a Apple Calendar (iOS / iPhone / Mac)"
                    >
                      <Calendar className="w-3.5 h-3.5 text-rose-600" />
                      <span className="hidden sm:inline">Apple Cal</span>
                      <span className="sm:hidden">Apple</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCalendarExportModalOpen(true)}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F95420] border border-orange-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                      title="Exportar pagos pendientes a un archivo .ics"
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
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 cursor-pointer ml-1"
                >
                  <span>Ver todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Grouped items by date */}
            {groupedVencimientos.length > 0 ? (
              groupedVencimientos.map((group) => (
                <div key={group.dateKey} className="space-y-2">
                  {/* Group Date Header with subtotal and indicator dot */}
                  <div className="flex items-center justify-between px-2 pt-2 pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        group.isToday 
                          ? 'bg-[#7928CA] ring-4 ring-purple-100' 
                          : group.isTomorrow 
                          ? 'bg-amber-500 ring-4 ring-amber-100' 
                          : group.isPast && group.hasUnpaid
                          ? 'bg-rose-500 ring-4 ring-rose-100'
                          : 'bg-slate-300'
                      }`} />
                      <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight truncate">
                        {group.displayDate}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {group.items.length} {group.items.length === 1 ? 'vencimiento' : 'vencimientos'}
                      </span>
                    </div>

                    {/* Day subtotal */}
                    <div className="text-right text-xs font-bold shrink-0 ml-2">
                      <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                        {formatCurrency(group.totalAmount, profile.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Cards for this date group */}
                  <div className="space-y-2">
                    {group.items.map(renderCard)}
                  </div>
                </div>
              ))
            ) : (
              /* Empty state (feedback for active search or general empty) */
              activeFiltersCount > 0 ? (
                <div className="bg-white border border-dashed border-purple-200 rounded-3xl p-6 sm:p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7928CA] mx-auto flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">
                    No se encontraron vencimientos para los filtros aplicados
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchTerm.trim() ? `No hay coincidencias con «${searchTerm}».` : 'Probá cambiando el plazo, modo o categoría.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#7928CA] text-xs font-black cursor-pointer transition-colors"
                  >
                    Restablecer filtros y búsqueda
                  </button>
                </div>
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
              )
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

      {/* 1-Click Vencimiento -> Movimiento Payment Confirmation Modal */}
      {promptPayItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Confirmar pago de {promptPayItem.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Podés descontarlo también en Movimientos con 1 toque
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPromptPayItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Importe final abonado ({profile.currency || 'ARS'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ámbito si se registra en Movimientos
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPayScopeInput('individual')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      payScopeInput === 'individual'
                        ? 'bg-white text-[#6936F5] shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayScopeInput('pareja')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      payScopeInput === 'pareja'
                        ? 'bg-white text-[#F95420] shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Compartido
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => confirmMarkPaid(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#6936F5] hover:bg-[#5b2bd9] text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
              >
                Marcar pagado + Registrar en Movimientos
              </button>
              <button
                type="button"
                onClick={() => confirmMarkPaid(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Solo marcar como pagado aquí
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
