import React, { useState, useMemo, useRef } from 'react';
import { 
  CalendarClock, 
  Calendar, 
  Plus, 
  CreditCard, 
  Search, 
  Check, 
  Trash2, 
  Edit3, 
  Zap, 
  Flame, 
  Droplets, 
  Wifi, 
  Home, 
  Building, 
  Landmark, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  X, 
  Filter,
  Tv,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  CalendarDays,
  ListFilter,
  List,
  Wallet,
  HeartPulse,
  Tag,
  Share2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Shield
} from 'lucide-react';
import { CoupleProfile, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

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
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onOpenTransactionModal?: () => void;
  onOpenCalendarModal?: () => void;
}

const DEFAULT_ALERT_ITEMS: DueAlertItem[] = [
  { 
    id: 'c1', 
    category: 'tarjeta',
    name: 'Visa Santander Black', 
    provider: 'Santander', 
    closeDay: 20, 
    dueDay: 5, 
    lastDigits: '4821', 
    color: 'from-red-600 to-rose-700',
    reminderDaysBeforeClose: 1,
    reminderDaysBeforeDue: 2,
    autoDebit: true,
    estimatedAmount: 215450,
  },
  { 
    id: 's2', 
    category: 'servicio',
    name: 'Internet Fibra Óptica', 
    provider: 'Personal Flow', 
    dueDay: 8, 
    estimatedAmount: 12490,
    paymentCode: 'Referencia: 9948201',
    autoDebit: true,
    reminderDaysBeforeDue: 2
  },
  { 
    id: 's3', 
    category: 'servicio',
    name: 'Agua Potable (AySA)', 
    provider: 'AySA', 
    dueDay: 6, 
    estimatedAmount: 8350,
    paymentCode: 'Cod. Banelco: 88492019',
    autoDebit: true,
    reminderDaysBeforeDue: 2
  },
  { 
    id: 's4', 
    category: 'servicio',
    name: 'Gas Natural (Metrogas)', 
    provider: 'Metrogas', 
    dueDay: 7, 
    estimatedAmount: 14620,
    paymentCode: 'Referencia: 4892010',
    autoDebit: true,
    reminderDaysBeforeDue: 2
  },
  { 
    id: 'a1', 
    category: 'alquiler',
    name: 'Alquiler Departamento', 
    provider: 'Inmobiliaria / Dueño', 
    dueDay: 10, 
    estimatedAmount: 650000,
    paymentCode: 'alquiler.palermo.cbu',
    autoDebit: false,
    reminderDaysBeforeDue: 3,
    notes: 'Transferir antes de las 18 hs y enviar comprobante'
  },
  { 
    id: 'e1', 
    category: 'expensas',
    name: 'Expensas Edificio', 
    provider: 'Administración Consorcio', 
    dueDay: 15, 
    estimatedAmount: 135000,
    paymentCode: '04928103940129',
    autoDebit: false,
    reminderDaysBeforeDue: 2
  },
  { 
    id: 's1', 
    category: 'servicio',
    name: 'Electricidad (Edenor)', 
    provider: 'Edenor', 
    dueDay: 12, 
    estimatedAmount: 38000,
    paymentCode: 'Cod. Banelco: 88492019',
    autoDebit: true,
    reminderDaysBeforeDue: 2
  },
  { 
    id: 'c2', 
    category: 'tarjeta',
    name: 'Mastercard BBVA', 
    provider: 'BBVA', 
    closeDay: 25, 
    dueDay: 14, 
    lastDigits: '1904', 
    estimatedAmount: 35090,
    autoDebit: false,
    reminderDaysBeforeDue: 2
  }
];

const PRESET_TEMPLATES = [
  { category: 'alquiler' as AlertItemCategory, name: 'Alquiler', subtitle: 'Vivienda', provider: 'Inmobiliaria / Propietario', dueDay: 10, defaultAmount: 650000, icon: Home },
  { category: 'expensas' as AlertItemCategory, name: 'Expensas', subtitle: 'Edificio', provider: 'Administración', dueDay: 15, defaultAmount: 135000, icon: Building },
  { category: 'servicio' as AlertItemCategory, name: 'Luz', subtitle: 'Edenor / Edesur', provider: 'Edenor', dueDay: 12, defaultAmount: 38000, icon: Zap },
  { category: 'servicio' as AlertItemCategory, name: 'Gas', subtitle: 'Metrogas', provider: 'Metrogas', dueDay: 7, defaultAmount: 14620, icon: Flame },
  { category: 'servicio' as AlertItemCategory, name: 'Agua', subtitle: 'AySA', provider: 'AySA', dueDay: 6, defaultAmount: 8350, icon: Droplets },
  { category: 'servicio' as AlertItemCategory, name: 'Internet', subtitle: 'Fibra & TV', provider: 'Personal Flow', dueDay: 8, defaultAmount: 12490, icon: Wifi },
  { category: 'tarjeta' as AlertItemCategory, name: 'Tarjeta', subtitle: 'Visa / Master', provider: 'Banco', dueDay: 14, defaultAmount: 150000, icon: CreditCard },
  { category: 'servicio' as AlertItemCategory, name: 'Seguro', subtitle: 'Auto / Hogar', provider: 'La Segunda', dueDay: 20, defaultAmount: 45000, icon: Shield },
];

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  profile,
  transactions = [],
  onShowToast,
  onOpenTransactionModal,
  onOpenCalendarModal
}) => {
  const [items, setItems] = useState<DueAlertItem[]>(() => {
    try {
      const savedV4 = localStorage.getItem('gastoar_vencimientos_alerts_v4');
      if (savedV4) return JSON.parse(savedV4);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ALERT_ITEMS;
  });

  // Active view tab: 'proximos' | 'todos' | 'calendario'
  const [activeView, setActiveView] = useState<'proximos' | 'todos' | 'calendario'>('proximos');
  const [isCalendarDeployed, setIsCalendarDeployed] = useState<boolean>(true);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Template Carousel slide state (Matching Movimientos TransactionsTable)
  const templateCarouselRef = useRef<HTMLDivElement>(null);
  const [activeTemplatePage, setActiveTemplatePage] = useState<number>(0);

  const handleTemplateCarouselScroll = () => {
    if (!templateCarouselRef.current) return;
    const { scrollLeft, clientWidth } = templateCarouselRef.current;
    if (clientWidth > 0) {
      const page = Math.round(scrollLeft / clientWidth);
      setActiveTemplatePage(page);
    }
  };

  const scrollToTemplatePage = (pageIndex: number) => {
    if (!templateCarouselRef.current) return;
    templateCarouselRef.current.scrollTo({
      left: pageIndex * templateCarouselRef.current.clientWidth,
      behavior: 'smooth',
    });
    setActiveTemplatePage(pageIndex);
  };

  const calendarSectionRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AlertItemCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'autodebit'>('all');
  const [sortBy, setSortBy] = useState<'day' | 'amount_desc' | 'name'>('day');
  
  // Modal state for creating / editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DueAlertItem | null>(null);
  const [showAllTemplatesModal, setShowAllTemplatesModal] = useState(false);

  // Form states
  const [formCategory, setFormCategory] = useState<AlertItemCategory>('servicio');
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formDueDay, setFormDueDay] = useState(10);
  const [formCloseDay, setFormCloseDay] = useState(20);
  const [formEstimatedAmount, setFormEstimatedAmount] = useState('');
  const [formPaymentCode, setFormPaymentCode] = useState('');
  const [formAutoDebit, setFormAutoDebit] = useState(false);
  const [formLastDigits, setFormLastDigits] = useState('');
  const [formReminderDue, setFormReminderDue] = useState(2);
  const [formReminderClose, setFormReminderClose] = useState(1);
  const [formNotes, setFormNotes] = useState('');

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthName = today.toLocaleDateString('es-AR', { month: 'long' });

  const saveItems = (updated: DueAlertItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem('gastoar_vencimientos_alerts_v4', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormCategory('servicio');
    setFormName('');
    setFormProvider('');
    setFormDueDay(10);
    setFormCloseDay(20);
    setFormEstimatedAmount('');
    setFormPaymentCode('');
    setFormAutoDebit(false);
    setFormLastDigits('');
    setFormReminderDue(2);
    setFormReminderClose(1);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenCreateWithDay = (day: number) => {
    handleOpenCreate();
    setFormDueDay(day);
  };

  const handleOpenEdit = (item: DueAlertItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormName(item.name);
    setFormProvider(item.provider || '');
    setFormDueDay(item.dueDay || 10);
    setFormCloseDay(item.closeDay || 20);
    setFormEstimatedAmount(item.estimatedAmount ? item.estimatedAmount.toString() : '');
    setFormPaymentCode(item.paymentCode || '');
    setFormAutoDebit(Boolean(item.autoDebit));
    setFormLastDigits(item.lastDigits || '');
    setFormReminderDue(item.reminderDaysBeforeDue || 2);
    setFormReminderClose(item.reminderDaysBeforeClose || 1);
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setEditingItem(null);
    setFormCategory(preset.category);
    setFormName(preset.name);
    setFormProvider(preset.provider);
    setFormDueDay(preset.dueDay);
    if ('closeDay' in preset && preset.closeDay) setFormCloseDay(preset.closeDay);
    if (preset.defaultAmount) setFormEstimatedAmount(preset.defaultAmount.toString());
    setFormPaymentCode('');
    setFormAutoDebit(false);
    setFormLastDigits('');
    setFormReminderDue(2);
    setFormReminderClose(1);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onShowToast('Ingresá un nombre para el vencimiento', 'error');
      return;
    }

    const amt = formEstimatedAmount ? parseFloat(formEstimatedAmount.replace(/[^0-9.]/g, '')) : undefined;

    if (editingItem) {
      // Update existing
      const updated = items.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            category: formCategory,
            name: formName.trim(),
            provider: formProvider.trim() || 'Proveedor',
            dueDay: Math.min(31, Math.max(1, Number(formDueDay) || 10)),
            closeDay: formCategory === 'tarjeta' ? Math.min(31, Math.max(1, Number(formCloseDay) || 20)) : undefined,
            estimatedAmount: isNaN(amt as number) ? undefined : amt,
            paymentCode: formPaymentCode.trim() || undefined,
            autoDebit: formAutoDebit,
            lastDigits: formCategory === 'tarjeta' ? formLastDigits.trim() || undefined : undefined,
            reminderDaysBeforeDue: Number(formReminderDue) || 2,
            reminderDaysBeforeClose: formCategory === 'tarjeta' ? Number(formReminderClose) || 1 : undefined,
            notes: formNotes.trim() || undefined
          };
        }
        return item;
      });
      saveItems(updated);
      onShowToast(`Vencimiento "${formName}" actualizado con éxito`, 'success');
    } else {
      // Create new
      const newItem: DueAlertItem = {
        id: 'venc-' + Date.now(),
        category: formCategory,
        name: formName.trim(),
        provider: formProvider.trim() || 'Proveedor',
        dueDay: Math.min(31, Math.max(1, Number(formDueDay) || 10)),
        closeDay: formCategory === 'tarjeta' ? Math.min(31, Math.max(1, Number(formCloseDay) || 20)) : undefined,
        estimatedAmount: isNaN(amt as number) ? undefined : amt,
        paymentCode: formPaymentCode.trim() || undefined,
        autoDebit: formAutoDebit,
        lastDigits: formCategory === 'tarjeta' ? formLastDigits.trim() || undefined : undefined,
        reminderDaysBeforeDue: Number(formReminderDue) || 2,
        reminderDaysBeforeClose: formCategory === 'tarjeta' ? Number(formReminderClose) || 1 : undefined,
        notes: formNotes.trim() || undefined,
        paidThisMonth: false
      };
      saveItems([...items, newItem]);
      onShowToast(`Nuevo vencimiento "${formName}" dado de alta con éxito`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleTogglePaid = (id: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const nextPaid = !item.paidThisMonth;
        return {
          ...item,
          paidThisMonth: nextPaid,
          paidAt: nextPaid ? Date.now() : undefined
        };
      }
      return item;
    });
    saveItems(updated);
    onShowToast('Estado del vencimiento actualizado', 'info');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar el vencimiento "${name}"?`)) {
      const updated = items.filter(item => item.id !== id);
      saveItems(updated);
      onShowToast(`Vencimiento eliminado`, 'info');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    onShowToast('Código de pago copiado al portapapeles', 'success');
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalEstimated = 0;
    let pendingEstimated = 0;
    let paidEstimated = 0;
    let pendingCount = 0;
    let paidCount = 0;
    let autoDebitCount = 0;
    let urgentUpcomingCount = 0;

    items.forEach(item => {
      const amt = item.estimatedAmount || 0;
      totalEstimated += amt;
      const daysLeft = item.dueDay - currentDay;

      if (item.paidThisMonth) {
        paidCount++;
        paidEstimated += amt;
      } else {
        pendingCount++;
        pendingEstimated += amt;
        if (daysLeft >= 0 && daysLeft <= 7) {
          urgentUpcomingCount++;
        }
      }
      if (item.autoDebit) autoDebitCount++;
    });

    return { 
      totalEstimated, 
      pendingEstimated, 
      paidEstimated, 
      pendingCount, 
      paidCount, 
      autoDebitCount,
      urgentUpcomingCount 
    };
  }, [items, currentDay]);

  // Grouped upcoming items for "Próximos Vencimientos" view
  const upcomingGroups = useMemo(() => {
    const overdue: DueAlertItem[] = [];
    const dueToday: DueAlertItem[] = [];
    const next7Days: DueAlertItem[] = [];
    const laterThisMonth: DueAlertItem[] = [];
    const alreadyPaid: DueAlertItem[] = [];

    items.forEach(item => {
      if (item.paidThisMonth) {
        alreadyPaid.push(item);
        return;
      }

      const diff = item.dueDay - currentDay;
      if (diff < 0) {
        overdue.push(item);
      } else if (diff === 0) {
        dueToday.push(item);
      } else if (diff <= 7) {
        next7Days.push(item);
      } else {
        laterThisMonth.push(item);
      }
    });

    // Sort each group chronologically by dueDay
    overdue.sort((a, b) => a.dueDay - b.dueDay);
    next7Days.sort((a, b) => a.dueDay - b.dueDay);
    laterThisMonth.sort((a, b) => a.dueDay - b.dueDay);
    alreadyPaid.sort((a, b) => a.dueDay - b.dueDay);

    return { overdue, dueToday, next7Days, laterThisMonth, alreadyPaid };
  }, [items, currentDay]);

  // Filtered and sorted items for "Todos los Vencimientos"
  const allFilteredItems = useMemo(() => {
    return items.filter(item => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = 
          item.name.toLowerCase().includes(q) ||
          item.provider.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q)) ||
          (item.paymentCode && item.paymentCode.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'pending' && item.paidThisMonth) return false;
      if (statusFilter === 'paid' && !item.paidThisMonth) return false;
      if (statusFilter === 'autodebit' && !item.autoDebit) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount_desc') {
        return (b.estimatedAmount || 0) - (a.estimatedAmount || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // default: sort by due day
      return a.dueDay - b.dueDay;
    });
  }, [items, searchTerm, categoryFilter, statusFilter, sortBy]);

  const totalFilteredAmount = useMemo(() => {
    return allFilteredItems.reduce((acc, it) => acc + (it.estimatedAmount || 0), 0);
  }, [allFilteredItems]);

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all' || categoryFilter !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const getItemVisuals = (item: DueAlertItem) => {
    const isDueToday = item.dueDay === currentDay;
    const daysLeft = item.dueDay - currentDay;
    const isOverdue = daysLeft < 0 && !item.paidThisMonth;

    let icon = CalendarClock;
    let iconBg = 'bg-[#F5F1FD] text-[#5B21B6]';
    let tagBg = 'bg-[#FAF7FE] text-[#5B21B6] border-purple-100';
    let tagLabel = 'Vencimiento';
    let bottomBorder = 'border-b-2 border-b-[#5B21B6]';

    switch (item.category) {
      case 'tarjeta':
        icon = CreditCard;
        iconBg = 'bg-[#F5F1FD] text-[#5B21B6]';
        tagBg = 'bg-[#FAF7FE] text-[#5B21B6] border-purple-100';
        tagLabel = 'Tarjeta';
        bottomBorder = 'border-b-2 border-b-[#EA580C]';
        break;
      case 'servicio':
        if (item.name.toLowerCase().includes('agua') || item.provider?.toLowerCase().includes('aysa')) {
          icon = Droplets;
          iconBg = 'bg-[#EFF8FF] text-[#0284C7]';
          tagBg = 'bg-[#EFF8FF] text-[#0284C7] border-sky-200/70';
          tagLabel = 'Servicio';
          bottomBorder = 'border-b-2 border-b-[#0284C7]';
        } else if (item.name.toLowerCase().includes('gas') || item.provider?.toLowerCase().includes('metrogas')) {
          icon = Flame;
          iconBg = 'bg-[#EEF2FF] text-[#4F46E5]';
          tagBg = 'bg-[#EEF2FF] text-[#4F46E5] border-indigo-200/70';
          tagLabel = 'Servicio';
          bottomBorder = 'border-b-2 border-b-[#4F46E5]';
        } else {
          icon = Wifi;
          iconBg = 'bg-[#FFF9EB] text-[#F59E0B]';
          tagBg = 'bg-[#FFF9EB] text-[#D97706] border-amber-200/70';
          tagLabel = 'Servicio';
          bottomBorder = 'border-b-2 border-b-[#F59E0B]';
        }
        break;
      case 'alquiler':
        icon = Home;
        iconBg = 'bg-[#EFF6FF] text-[#2563EB]';
        tagBg = 'bg-[#EFF6FF] text-[#2563EB] border-blue-100';
        tagLabel = 'Alquiler';
        bottomBorder = 'border-b-2 border-b-[#2563EB]';
        break;
      case 'expensas':
        icon = Building;
        iconBg = 'bg-[#F5F3FF] text-[#7C3AED]';
        tagBg = 'bg-[#F5F3FF] text-[#7C3AED] border-purple-100';
        tagLabel = 'Expensas';
        bottomBorder = 'border-b-2 border-b-[#7C3AED]';
        break;
      case 'impuesto':
        icon = Landmark;
        iconBg = 'bg-[#FEF2F2] text-[#DC2626]';
        tagBg = 'bg-[#FEF2F2] text-[#DC2626] border-rose-200';
        tagLabel = 'Impuesto';
        bottomBorder = 'border-b-2 border-b-[#DC2626]';
        break;
      case 'suscripcion':
        icon = Tv;
        iconBg = 'bg-[#ECFDF5] text-[#059669]';
        tagBg = 'bg-[#ECFDF5] text-[#059669] border-emerald-200';
        tagLabel = 'Suscripción';
        bottomBorder = 'border-b-2 border-b-[#059669]';
        break;
      case 'salud':
        icon = HeartPulse;
        iconBg = 'bg-[#F0FDFA] text-[#0D9488]';
        tagBg = 'bg-[#F0FDFA] text-[#0D9488] border-teal-200';
        tagLabel = 'Prepaga / Salud';
        bottomBorder = 'border-b-2 border-b-[#0D9488]';
        break;
      default:
        icon = CalendarClock;
        iconBg = 'bg-slate-100 text-slate-700';
        tagBg = 'bg-slate-100 text-slate-700 border-slate-200';
        tagLabel = 'Otro';
        bottomBorder = 'border-b-2 border-b-slate-300';
    }

    return { icon, iconBg, tagBg, tagLabel, bottomBorder, isDueToday, daysLeft, isOverdue };
  };

  // Render Monthly Calendar view (con todos los días del mes 1 al 31, día actual resaltado, montos y etiquetas)
  const renderMonthlyCalendar = () => (
    <section 
      ref={calendarSectionRef}
      className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-purple-100/90 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FAF7FE] text-[#5B21B6] border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-slate-900 capitalize font-outfit">
                Calendario Mensual · {currentMonthName}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#5B21B6] px-2 py-0.5 rounded-full">
                Mes en curso
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Distribución de pagos del día 1 al 31 con montos estimados, etiquetas de servicio y estado.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-amber-500 text-white shadow-xs flex items-center gap-1.5 font-outfit">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Hoy es día {currentDay}
          </span>
          <button
            type="button"
            onClick={() => setIsCalendarDeployed(false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B21B6] border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-purple-300 active:scale-95"
            title="Cerrar calendario mensual"
          >
            <ChevronUp className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>
      </div>

      {/* Referencias visuales */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] font-semibold text-slate-600 bg-[#FAF7FE] p-2.5 px-3.5 rounded-2xl border border-purple-100/70">
        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Referencias:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
          <span className="text-amber-950 font-bold">Día de hoy</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#5B21B6]" />
          <span>Vencimiento pendiente</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Pagado este mes</span>
        </span>
      </div>

      {/* Calendar Day Grid (1 to 31) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5 pt-1">
        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
          const dayItems = items.filter(it => it.dueDay === day);
          const isToday = day === currentDay;
          const hasItems = dayItems.length > 0;
          const hasPending = dayItems.some(it => !it.paidThisMonth);

          return (
            <div
              key={day}
              className={`p-2.5 sm:p-3 rounded-2xl border min-h-[105px] flex flex-col justify-between transition-all ${
                isToday
                  ? 'bg-amber-50/85 border-amber-400 ring-2 ring-amber-300 shadow-md'
                  : hasItems
                    ? hasPending
                      ? 'bg-purple-50/40 border-purple-200/90 shadow-2xs hover:border-purple-300'
                      : 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                    : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Header Día */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black font-outfit ${isToday ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Día {day}
                </span>
                {isToday ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white uppercase tracking-wider shadow-2xs">
                    HOY
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenCreateWithDay(day)}
                    className="w-5 h-5 rounded-md text-slate-300 hover:text-[#5B21B6] hover:bg-purple-100/50 flex items-center justify-center transition-colors cursor-pointer"
                    title={`Agregar vencimiento el día ${day}`}
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </button>
                )}
              </div>

              {/* Items / Servicios del Día */}
              {hasItems ? (
                <div className="space-y-1.5 my-1.5">
                  {dayItems.map(item => {
                    const isPaid = Boolean(item.paidThisMonth);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleOpenEdit(item)}
                        className={`p-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all border flex flex-col gap-0.5 group active:scale-95 ${
                          isPaid
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : isToday
                              ? 'bg-amber-100/90 border-amber-300 text-amber-950 hover:bg-amber-200'
                              : 'bg-white border-purple-200 text-slate-800 hover:border-[#5B21B6] hover:bg-purple-50/50 shadow-2xs'
                        }`}
                        title={`${item.name} (${item.category}): ${item.estimatedAmount ? formatCurrency(item.estimatedAmount, profile.currency) : 'Sin monto'}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`truncate ${isPaid ? 'line-through opacity-70' : 'font-extrabold text-slate-900'}`}>
                            {item.name}
                          </span>
                          <span className={`text-[8px] font-black px-1 py-0.2 rounded uppercase shrink-0 ${
                            item.category === 'alquiler'
                              ? 'bg-purple-100 text-purple-800'
                              : item.category === 'tarjeta'
                                ? 'bg-indigo-100 text-indigo-800'
                                : item.category === 'expensas'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.category === 'servicio' ? 'Serv' : item.category.slice(0, 4)}
                          </span>
                        </div>
                        {item.estimatedAmount ? (
                          <span className={`text-[10px] font-black font-outfit ${isPaid ? 'text-emerald-700 line-through' : 'text-[#5B21B6]'}`}>
                            {formatCurrency(item.estimatedAmount, profile.currency)}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">Sin monto fijo</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div 
                  onClick={() => handleOpenCreateWithDay(day)}
                  className="py-2 text-[10px] text-slate-300 italic text-center cursor-pointer hover:text-purple-500 transition-colors"
                >
                  Sin pagos
                </div>
              )}

              {/* Total del Día */}
              {hasItems && (
                <div className="text-[10px] text-right font-black font-outfit text-slate-700 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Total:</span>
                  <span>
                    {formatCurrency(
                      dayItems.reduce((acc, it) => acc + (it.estimatedAmount || 0), 0),
                      profile.currency
                    )}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer para cerrar calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-purple-100/70">
        <p className="text-xs text-slate-500 font-medium">
          Mostrando los 31 días de {currentMonthName} · Tocá un servicio para editar o <span className="font-bold text-[#5B21B6]">+</span> para agregar.
        </p>
        <button
          type="button"
          onClick={() => setIsCalendarDeployed(false)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B21B6] border border-purple-200/80 font-bold text-xs transition-colors cursor-pointer self-end sm:self-auto"
          title="Cerrar calendario mensual"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>Cerrar calendario</span>
        </button>
      </div>
    </section>
  );

  // Render a single Vencimiento Card matching reference design
  const renderItemCard = (item: DueAlertItem) => {
    const { icon: ItemIcon, iconBg, tagBg, tagLabel, bottomBorder, isDueToday, daysLeft, isOverdue } = getItemVisuals(item);
    const isExpanded = expandedItemId === item.id;

    return (
      <div
        key={item.id}
        className={`bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 ${bottomBorder} ${
          item.paidThisMonth ? 'opacity-85 bg-slate-50/40' : ''
        }`}
      >
        <div className="flex items-start sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Icon, Name + lastDigits, Provider, Amount, Badges */}
          <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
              <ItemIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 space-y-0.5 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h4 className="font-black text-slate-900 text-sm sm:text-base truncate">
                  {item.name}
                </h4>
                {item.lastDigits && (
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    ••{item.lastDigits}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">
                {item.provider || 'Sin proveedor'}
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 font-outfit pt-0.5">
                {item.estimatedAmount ? formatCurrency(item.estimatedAmount, profile.currency) : 'A definir'}
              </p>

              {/* Badges directly below amount */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${tagBg}`}>
                  {tagLabel}
                </span>
                {item.autoDebit && (
                  <span className="bg-[#FAF7FE] text-[#5B21B6] border border-purple-100 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
                    Débito automático
                  </span>
                )}
                {item.paidThisMonth && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Pagado</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Due Day info & expand toggle button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 pt-0.5 sm:pt-0">
            <div className="text-right">
              <p className="text-[11px] sm:text-xs font-bold text-slate-800 whitespace-nowrap">
                Vence día {item.dueDay}
              </p>
              <p className={`text-[10px] sm:text-xs font-bold whitespace-nowrap mt-0.5 ${
                item.paidThisMonth
                  ? 'text-emerald-600'
                  : isOverdue
                    ? 'text-rose-600'
                    : isDueToday
                      ? 'text-[#EA580C] animate-pulse'
                      : daysLeft <= 3
                        ? 'text-[#EA580C]'
                        : 'text-slate-500'
              }`}>
                {item.paidThisMonth
                  ? 'Listo este mes'
                  : isDueToday
                    ? '¡Vence hoy!'
                    : isOverdue
                      ? `Venció hace ${Math.abs(daysLeft)}d`
                      : daysLeft === 1
                        ? '(mañana)'
                        : `(en ${daysLeft} días)`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                isExpanded ? 'bg-[#5B21B6] text-white rotate-90' : 'bg-[#FAF7FE] hover:bg-[#F3EEFC] text-[#5B21B6]'
              }`}
              title={isExpanded ? 'Ocultar opciones' : 'Ver opciones'}
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Expanded Action Panel */}
        {isExpanded && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => handleTogglePaid(item.id)}
                className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  item.paidThisMonth
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{item.paidThisMonth ? 'Desmarcar pagado' : 'Marcar como pagado'}</span>
              </button>

              {onOpenTransactionModal && !item.paidThisMonth && (
                <button
                  type="button"
                  onClick={onOpenTransactionModal}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold text-[#5B21B6] bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer text-center"
                >
                  + Registrar en Movimientos
                </button>
              )}

              {item.paymentCode && (
                <button
                  type="button"
                  onClick={() => handleCopyCode(item.paymentCode!)}
                  className="w-full sm:w-auto px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Copiar código CBU o pago"
                >
                  <Copy className="w-3 h-3" />
                  <span className="truncate">CBU/Ref: {item.paymentCode}</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenEdit(item)}
                className="px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-[#5B21B6] hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Editar este vencimiento"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id, item.name)}
                className="px-2.5 py-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Eliminar vencimiento"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <section className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#5B21B6] flex items-center justify-center text-white shadow-md shadow-purple-950/20 shrink-0">
            <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Vencimientos
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Organizá y controlá tus próximos pagos para evitar recargos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto">
          {onOpenCalendarModal && (
            <button
              onClick={onOpenCalendarModal}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold text-xs shadow-md shadow-purple-900/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Sincronizar con Google Calendar"
            >
              <Calendar className="w-4 h-4 text-white" />
              <span>Google Calendar</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md shadow-orange-900/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Dar de alta</span>
          </button>
        </div>
      </section>

      {/* 2. KPI METRICS CARDS (2 cajas por fila) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {/* Próximos a Vencer */}
        <div 
          onClick={() => {
            setActiveView('proximos');
            setIsCalendarDeployed(true);
            setTimeout(() => {
              calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }}
          className="bg-white rounded-2xl p-3 sm:p-4 border border-orange-200/90 shadow-2xs flex flex-col justify-between gap-1.5 cursor-pointer hover:border-orange-400 hover:shadow-xs active:scale-95 transition-all group"
          title="Ver calendario mensual interactivo y próximos vencimientos"
        >
          <span className="text-[10px] sm:text-[11px] font-extrabold text-[#EA580C] uppercase tracking-wider block">
            PRÓXIMOS A VENCER <span className="text-slate-400 font-normal text-[10px] sm:text-xs">(7 días)</span>
          </span>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="text-2xl sm:text-3xl font-black text-[#EA580C] font-outfit">
              {stats.urgentUpcomingCount}
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FFF3EB] text-[#EA580C] flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
            inminentes · Ver calendario 📅
          </span>
        </div>

        {/* Pendientes de Pago */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-purple-100 shadow-2xs flex flex-col justify-between gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-[#4F46E5] uppercase tracking-wider block truncate">
            PENDIENTES DE PAGO
          </span>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="text-2xl sm:text-3xl font-black text-[#4F46E5] font-outfit">
              {stats.pendingCount}
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F4F0FD] text-[#4F46E5] flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
            por {formatCurrency(stats.pendingEstimated, profile.currency)}
          </span>
        </div>

        {/* Débito Automático */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-pink-100 shadow-2xs flex flex-col justify-between gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-[#DB2777] uppercase tracking-wider block truncate">
            DÉBITO AUTOMÁTICO
          </span>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="text-2xl sm:text-3xl font-black text-[#DB2777] font-outfit">
              {stats.autoDebitCount}
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FDF2F8] text-[#DB2777] flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
            se cobran solos
          </span>
        </div>

        {/* Pagados Este Mes */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-2xs flex flex-col justify-between gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-[#059669] uppercase tracking-wider block truncate">
            PAGADOS ESTE MES
          </span>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="text-2xl sm:text-3xl font-black text-[#059669] font-outfit">
              {stats.paidCount}
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
            ({formatCurrency(stats.paidEstimated, profile.currency)})
          </span>
        </div>
      </div>

      {/* 3. QUICK PRESET CHIPS (Interactive Slide Carousel matching Movimientos TransactionsTable) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800">
            <Zap className="w-3.5 h-3.5 text-[#5B21B6] fill-[#5B21B6]" />
            <span>PLANTILLAS RÁPIDAS</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAllTemplatesModal(true)}
            className="text-xs font-semibold text-[#5B21B6] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Carousel matching Movimientos with snap-x */}
        <div
          ref={templateCarouselRef}
          onScroll={handleTemplateCarouselScroll}
          className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-none px-0.5 snap-x snap-mandatory scroll-smooth"
        >
          {PRESET_TEMPLATES.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={`${p.name}-${idx}`}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="bg-white hover:bg-[#FAF7FE] active:bg-[#F3EEFC] border border-purple-100 rounded-2xl p-2 sm:p-2.5 px-3 sm:px-3.5 flex items-center gap-2.5 shrink-0 snap-start shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left group active:scale-95 w-[calc((100%-12px)/2)] min-w-[145px] sm:w-auto sm:min-w-[170px]"
              >
                <div className="w-8 h-8 rounded-xl bg-[#FAF7FE] group-hover:bg-[#F3EEFC] text-[#5B21B6] flex items-center justify-center shrink-0 border border-purple-50">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#5B21B6] leading-tight truncate">
                    + {p.name}
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 leading-tight truncate">
                    {p.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Carousel pagination indicator matching Movimientos */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {Array.from({ length: Math.ceil(PRESET_TEMPLATES.length / 2) }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToTemplatePage(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeTemplatePage === idx 
                  ? 'w-7 sm:w-8 bg-[#6F2EC5]' 
                  : 'w-3.5 sm:w-5 bg-slate-200 hover:bg-slate-300'
              }`}
              aria-label={`Página ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 4. NAVIGATION TABS: Próximos Vencimientos | Todos */}
      <section className="bg-white rounded-2xl p-1.5 sm:p-2 shadow-2xs border border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => {
            if (activeView !== 'proximos') {
              setActiveView('proximos');
              setIsCalendarDeployed(true);
              setTimeout(() => {
                calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            } else {
              setIsCalendarDeployed(prev => !prev);
            }
          }}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
            activeView === 'proximos'
              ? 'bg-[#5B21B6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title={isCalendarDeployed ? "Plegar / desplegar calendario mensual" : "Desplegar calendario mensual"}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Próximos Vencimientos</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeView === 'proximos' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
          }`}>
            {stats.urgentUpcomingCount}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
            activeView === 'proximos' && isCalendarDeployed ? 'rotate-180' : ''
          }`} />
        </button>

        <button
          type="button"
          onClick={() => setActiveView('todos')}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
            activeView === 'todos'
              ? 'bg-[#5B21B6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Todos</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeView === 'todos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {items.length}
          </span>
        </button>
      </section>

      {/* 5. VIEW 1: PRÓXIMOS VENCIMIENTOS (Calendario Mensual Desplegable + Próximos 7 días) */}
      {activeView === 'proximos' && (
        <div className="space-y-6">
          {/* Calendario Mensual: Desplegado o Plegado con botón para reabrirlo */}
          {isCalendarDeployed ? (
            renderMonthlyCalendar()
          ) : (
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF7FE] text-[#5B21B6] border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-slate-900 font-outfit">
                      Calendario Mensual · {currentMonthName}
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#5B21B6] px-2 py-0.5 rounded-full">
                      Día 1 al 31
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    El calendario está cerrado. Tocá el botón para desplegar la vista de pagos del mes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCalendarDeployed(true);
                  setTimeout(() => {
                    calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 50);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                <Calendar className="w-4 h-4" />
                <span>Desplegar Calendario</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Next 7 Days Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#5B21B6] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#5B21B6]" />
                <span>
                  PRÓXIMOS 7 DÍAS ({upcomingGroups.dueToday.length + upcomingGroups.next7Days.length + upcomingGroups.overdue.length})
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveView('todos')}
                className="text-xs font-semibold text-[#5B21B6] hover:underline cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {/* Overdue if any */}
              {upcomingGroups.overdue.map(item => renderItemCard(item))}

              {/* Due Today */}
              {upcomingGroups.dueToday.map(item => renderItemCard(item))}

              {/* Next 7 Days */}
              {upcomingGroups.next7Days.map(item => renderItemCard(item))}

              {upcomingGroups.dueToday.length === 0 && upcomingGroups.next7Days.length === 0 && upcomingGroups.overdue.length === 0 && (
                <div className="p-6 text-center bg-white rounded-2xl border border-slate-100 text-xs text-slate-500">
                  No hay vencimientos en los próximos 7 días.
                </div>
              )}
            </div>
          </div>

          {/* TODOS LOS VENCIMIENTOS section inside Proximos view (as shown in the reference image) */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-800">
                <Clock className="w-4 h-4 text-[#5B21B6]" />
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-800">
                  TODOS LOS VENCIMIENTOS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('calendario')}
                className="text-xs font-bold text-[#5B21B6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver calendario mensual</span>
                <span>📅</span>
              </button>
            </div>

            {/* Filter pills: Todos 8 | Próximos 4 | Débito automático 5 | Servicios 4 | Tarjetas 2 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); }}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  categoryFilter === 'all' && statusFilter === 'all'
                    ? 'bg-[#ECE5F8] text-[#5B21B6] border border-purple-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Todos {items.length}
              </button>

              <button
                onClick={() => { setCategoryFilter('all'); setStatusFilter('pending'); }}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/70'
                }`}
              >
                Próximos {stats.urgentUpcomingCount}
              </button>

              <button
                onClick={() => { setCategoryFilter('all'); setStatusFilter('autodebit'); }}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  statusFilter === 'autodebit'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100/70'
                }`}
              >
                Débito automático {stats.autoDebitCount}
              </button>

              <button
                onClick={() => { setCategoryFilter('servicio'); setStatusFilter('all'); }}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  categoryFilter === 'servicio'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100/70'
                }`}
              >
                Servicios {items.filter(it => it.category === 'servicio').length}
              </button>

              <button
                onClick={() => { setCategoryFilter('tarjeta'); setStatusFilter('all'); }}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  categoryFilter === 'tarjeta'
                    ? 'bg-pink-100 text-pink-900 border border-pink-300'
                    : 'bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100/70'
                }`}
              >
                Tarjetas {items.filter(it => it.category === 'tarjeta').length}
              </button>
            </div>

            {/* List of items */}
            <div className="space-y-3 pt-1">
              {allFilteredItems.map(item => renderItemCard(item))}
            </div>
          </section>
        </div>
      )}

      {/* 6. VIEW 2: TODOS LOS VENCIMIENTOS (Full List with Filters & Search) */}
      {activeView === 'todos' && (
        <div className="space-y-3.5">
          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs border border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, proveedor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B21B6]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer text-[10px]"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B21B6] truncate cursor-pointer appearance-none"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="paid">Pagados</option>
                    <option value="autodebit">Débito autom.</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B21B6] truncate cursor-pointer appearance-none"
                  >
                    <option value="day">Día (1 al 31)</option>
                    <option value="amount_desc">Mayor monto</option>
                    <option value="name">Alfabético</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'tarjeta', label: 'Tarjetas' },
                { id: 'servicio', label: 'Servicios' },
                { id: 'alquiler', label: 'Alquiler' },
                { id: 'expensas', label: 'Expensas' },
                { id: 'suscripcion', label: 'Suscripciones' },
                { id: 'impuesto', label: 'Impuestos' },
                { id: 'salud', label: 'Salud' },
                { id: 'otro', label: 'Otros' }
              ].map(tab => {
                const count = tab.id === 'all' 
                  ? items.length 
                  : items.filter(it => it.category === tab.id).length;

                if (count === 0 && tab.id !== 'all' && categoryFilter !== tab.id) {
                  return null;
                }

                const isSelected = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#5B21B6] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Result Counter & Quick Reset Strip */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-slate-800 font-outfit whitespace-nowrap">
                  {allFilteredItems.length} {allFilteredItems.length === 1 ? 'vencimiento' : 'vencimientos'}
                </span>
                {allFilteredItems.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="truncate">Total: <strong className="text-slate-800 font-outfit">{formatCurrency(totalFilteredAmount, profile.currency)}</strong></span>
                  </>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-[#5B21B6] hover:text-[#4C1D95] hover:underline cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* List of All Filtered Items */}
          {allFilteredItems.length > 0 ? (
            <div className="space-y-3">
              {allFilteredItems.map(item => renderItemCard(item))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-100 space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7FE] text-[#5B21B6] flex items-center justify-center mx-auto">
                <CalendarClock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">No se encontraron vencimientos</h4>
                <p className="text-xs text-slate-500">Probá ajustando la búsqueda o los filtros seleccionados.</p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs cursor-pointer shadow-xs transition-colors active:scale-95"
              >
                + Dar de Alta Vencimiento
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. VIEW 3: CALENDARIO MENSUAL */}
      {activeView === 'calendario' && renderMonthlyCalendar()}

      {/* 8. MODAL FOR DAR DE ALTA / EDITAR VENCIMIENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2E0854]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 border border-purple-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2E0854] via-[#45108A] to-[#6F2EC5] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-200 shadow-xs border border-purple-400/20">
                  <CalendarClock className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    {editingItem ? 'Editar Vencimiento' : 'Dar de Alta Vencimiento'}
                  </h3>
                  <p className="text-[10px] text-purple-200">
                    Configurá el día de corte, montos estimados y códigos de pago
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-purple-200 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Tipo de Vencimiento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'servicio', label: 'Servicio', icon: Zap },
                    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                    { id: 'alquiler', label: 'Alquiler', icon: Home },
                    { id: 'expensas', label: 'Expensas', icon: Building },
                    { id: 'suscripcion', label: 'Suscripción', icon: Tv },
                    { id: 'impuesto', label: 'Impuesto', icon: Landmark },
                    { id: 'salud', label: 'Prepaga / Salud', icon: HeartPulse },
                    { id: 'otro', label: 'Otro', icon: CalendarClock },
                  ].map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormCategory(cat.id as any)}
                        className={`p-2 rounded-xl border flex items-center gap-1.5 text-left font-bold transition-all cursor-pointer ${
                          formCategory === cat.id
                            ? 'bg-[#6F2EC5] text-white border-[#6F2EC5] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Nombre del vencimiento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Edenor, Fibertel, Alquiler"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Proveedor o Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Edenor S.A., Banco Santander"
                    value={formProvider}
                    onChange={e => setFormProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              {/* Due Day & Card Close Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Día del mes que vence (1 al 31) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={formDueDay}
                      onChange={e => setFormDueDay(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black font-outfit text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                    />
                    <span className="text-xs text-slate-500 font-semibold shrink-0">de cada mes</span>
                  </div>
                </div>

                {formCategory === 'tarjeta' ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      Día de cierre de tarjeta
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={formCloseDay}
                        onChange={e => setFormCloseDay(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black font-outfit text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                      />
                      <span className="text-xs text-slate-500 font-semibold shrink-0">de cada mes</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      Monto estimado mensual ($)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 35000"
                      value={formEstimatedAmount}
                      onChange={e => setFormEstimatedAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-outfit text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* If tarjeta: Last 4 digits + Amount */}
              {formCategory === 'tarjeta' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      Últimos 4 dígitos de la tarjeta
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Ej. 4821"
                      value={formLastDigits}
                      onChange={e => setFormLastDigits(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      Gasto estimado resumen ($)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 250000"
                      value={formEstimatedAmount}
                      onChange={e => setFormEstimatedAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-outfit text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Payment Code / CBU / Reference */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Código de pago electrónico / CBU / Referencia Banelco / Link
                </label>
                <input
                  type="text"
                  placeholder="Ej. Partida 884920, CBU 0720..., o link de pago"
                  value={formPaymentCode}
                  onChange={e => setFormPaymentCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Auto Debit Toggle & Reminder Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="font-bold text-slate-800 block">¿Débito Automático?</span>
                    <span className="text-[10px] text-slate-500 block">Se cobra solo en cuenta</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAutoDebit}
                    onChange={e => setFormAutoDebit(e.target.checked)}
                    className="w-4 h-4 rounded text-[#6F2EC5] focus:ring-purple-400 cursor-pointer"
                  />
                </label>

                <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Avisar con anticipación:
                  </label>
                  <select
                    value={formReminderDue}
                    onChange={e => setFormReminderDue(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <option value={1}>1 día antes</option>
                    <option value={2}>2 días antes</option>
                    <option value={3}>3 días antes</option>
                    <option value={5}>5 días antes</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Notas o instrucciones adicionales
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Enviar comprobante por WhatsApp al dueño antes de las 18hs"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2E0854] to-[#6F2EC5] text-white font-bold shadow-md shadow-purple-900/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingItem ? 'Guardar Cambios' : 'Dar de Alta Vencimiento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Templates Modal */}
      {showAllTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#5B21B6] fill-[#5B21B6]" />
                <h3 className="font-black text-slate-900 text-lg">
                  Plantillas Rápidas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllTemplatesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Seleccioná un servicio o gasto recurrente para completar automáticamente los datos en el formulario:
            </p>

            <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {PRESET_TEMPLATES.map(p => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setShowAllTemplatesModal(false);
                      handleApplyPreset(p);
                    }}
                    className="p-3 rounded-2xl bg-[#FAF7FE] hover:bg-[#F3EEFC] border border-purple-100 text-left flex items-center gap-3 transition-all cursor-pointer group active:scale-95"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white group-hover:bg-purple-50 text-[#5B21B6] flex items-center justify-center shrink-0 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#5B21B6] block leading-tight">
                        + {p.name}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 block leading-tight mt-0.5">
                        {p.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
