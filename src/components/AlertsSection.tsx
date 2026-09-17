import React, { useMemo, useState } from 'react';
import {
  AlertCircle, Bell, BellRing, Building2, Calendar, CalendarClock, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, Copy,
  CreditCard, Droplets, Edit3, Flame, HeartPulse, Home, Landmark, List,
  MoreHorizontal, Plus, RefreshCw, Search, Shield, Trash2, Tv, Wallet,
  Wifi, X, Zap
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
  isDemoMode?: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onOpenTransactionModal?: () => void;
  onOpenCalendarModal?: () => void;
}

const DEFAULT_ALERT_ITEMS: DueAlertItem[] = [
  { id: 'c1', category: 'tarjeta', name: 'Visa Santander Black', provider: 'Santander', closeDay: 20, dueDay: 5, lastDigits: '4821', reminderDaysBeforeClose: 1, reminderDaysBeforeDue: 2, autoDebit: true, estimatedAmount: 215450 },
  { id: 's2', category: 'servicio', name: 'Internet Fibra Óptica', provider: 'Personal Flow', dueDay: 8, estimatedAmount: 12490, paymentCode: 'Referencia: 9948201', autoDebit: true, reminderDaysBeforeDue: 2 },
  { id: 's3', category: 'servicio', name: 'Agua Potable (AySA)', provider: 'AySA', dueDay: 6, estimatedAmount: 8350, paymentCode: 'Cod. Banelco: 88492019', autoDebit: true, reminderDaysBeforeDue: 2 },
  { id: 's4', category: 'servicio', name: 'Gas Natural (Metrogas)', provider: 'Metrogas', dueDay: 7, estimatedAmount: 14620, paymentCode: 'Referencia: 4892010', autoDebit: true, reminderDaysBeforeDue: 2 },
  { id: 'a1', category: 'alquiler', name: 'Alquiler Departamento', provider: 'Inmobiliaria / Dueño', dueDay: 10, estimatedAmount: 650000, paymentCode: 'alquiler.cbu', autoDebit: false, reminderDaysBeforeDue: 3, notes: 'Transferir antes de las 18 hs y enviar comprobante' },
  { id: 'e1', category: 'expensas', name: 'Expensas Edificio', provider: 'Administración Consorcio', dueDay: 15, estimatedAmount: 135000, paymentCode: '04928103940129', autoDebit: false, reminderDaysBeforeDue: 2 },
  { id: 's1', category: 'servicio', name: 'Electricidad (Edenor)', provider: 'Edenor', dueDay: 12, estimatedAmount: 38000, paymentCode: 'Cod. Banelco: 88492019', autoDebit: true, reminderDaysBeforeDue: 2 },
  { id: 'c2', category: 'tarjeta', name: 'Mastercard BBVA', provider: 'BBVA', closeDay: 25, dueDay: 14, lastDigits: '1904', estimatedAmount: 35090, autoDebit: false, reminderDaysBeforeDue: 2 }
];

const PRESET_TEMPLATES = [
  { category: 'alquiler' as AlertItemCategory, name: 'Alquiler', provider: 'Inmobiliaria / Propietario', dueDay: 10, defaultAmount: 650000, icon: Home },
  { category: 'expensas' as AlertItemCategory, name: 'Expensas', provider: 'Administración', dueDay: 15, defaultAmount: 135000, icon: Building2 },
  { category: 'servicio' as AlertItemCategory, name: 'Luz', provider: 'Edenor', dueDay: 12, defaultAmount: 38000, icon: Zap },
  { category: 'servicio' as AlertItemCategory, name: 'Gas', provider: 'Metrogas', dueDay: 7, defaultAmount: 14620, icon: Flame },
  { category: 'servicio' as AlertItemCategory, name: 'Agua', provider: 'AySA', dueDay: 6, defaultAmount: 8350, icon: Droplets },
  { category: 'servicio' as AlertItemCategory, name: 'Internet', provider: 'Personal Flow', dueDay: 8, defaultAmount: 12490, icon: Wifi },
  { category: 'tarjeta' as AlertItemCategory, name: 'Tarjeta', provider: 'Banco', dueDay: 14, defaultAmount: 150000, icon: CreditCard },
  { category: 'suscripcion' as AlertItemCategory, name: 'Suscripción', provider: 'Proveedor', dueDay: 20, defaultAmount: 15000, icon: Tv }
];

const CATEGORY_META: Record<AlertItemCategory, { label: string; Icon: React.ElementType; soft: string; text: string }> = {
  tarjeta: { label: 'Tarjeta', Icon: CreditCard, soft: 'bg-orange-50', text: 'text-[#F95420]' },
  alquiler: { label: 'Vivienda', Icon: Home, soft: 'bg-blue-50', text: 'text-blue-600' },
  expensas: { label: 'Expensas', Icon: Building2, soft: 'bg-violet-50', text: 'text-violet-600' },
  servicio: { label: 'Servicios', Icon: Wifi, soft: 'bg-sky-50', text: 'text-sky-600' },
  impuesto: { label: 'Impuesto', Icon: Landmark, soft: 'bg-rose-50', text: 'text-rose-600' },
  suscripcion: { label: 'Suscripción', Icon: Tv, soft: 'bg-emerald-50', text: 'text-emerald-600' },
  salud: { label: 'Salud', Icon: HeartPulse, soft: 'bg-teal-50', text: 'text-teal-600' },
  otro: { label: 'Otro', Icon: MoreHorizontal, soft: 'bg-slate-100', text: 'text-slate-600' }
};

const formatDay = (day: number) => String(day).padStart(2, '0');

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  profile,
  isDemoMode = false,
  onShowToast,
  onOpenTransactionModal,
  onOpenCalendarModal
}) => {
  const [items, setItems] = useState<DueAlertItem[]>(() => {
    try {
      const saved = localStorage.getItem('gastoar_vencimientos_alerts_v4');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return isDemoMode ? DEFAULT_ALERT_ITEMS : [];
  });

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleDateString('es-AR', { month: 'long' });
  const [activeView, setActiveView] = useState<'proximos' | 'mes' | 'pagados' | 'todos' | 'calendario'>('proximos');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AlertItemCategory>('all');
  const [sortBy, setSortBy] = useState<'day' | 'amount_desc' | 'name'>('day');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DueAlertItem | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(currentMonth);
  const [calendarYear, setCalendarYear] = useState(currentYear);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('gastoar_vencimientos_notif_v1') === 'true');

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
  const [formNotes, setFormNotes] = useState('');

  const saveItems = (updated: DueAlertItem[]) => {
    setItems(updated);
    localStorage.setItem('gastoar_vencimientos_alerts_v4', JSON.stringify(updated));
  };

  const openCreate = (day?: number) => {
    setEditingItem(null); setFormCategory('servicio'); setFormName(''); setFormProvider(''); setFormDueDay(day ? String(day) : '');
    setFormCloseDay(''); setFormEstimatedAmount(''); setFormPaymentCode(''); setFormAutoDebit(false); setFormLastDigits(''); setFormReminderDue(3); setFormNotes(''); setIsModalOpen(true);
  };

  const openEdit = (item: DueAlertItem) => {
    setEditingItem(item); setFormCategory(item.category); setFormName(item.name); setFormProvider(item.provider || ''); setFormDueDay(String(item.dueDay));
    setFormCloseDay(item.closeDay ? String(item.closeDay) : ''); setFormEstimatedAmount(item.estimatedAmount ? String(item.estimatedAmount) : ''); setFormPaymentCode(item.paymentCode || '');
    setFormAutoDebit(Boolean(item.autoDebit)); setFormLastDigits(item.lastDigits || ''); setFormReminderDue(item.reminderDaysBeforeDue || 3); setFormNotes(item.notes || ''); setIsModalOpen(true);
  };

  const applyPreset = (preset: typeof PRESET_TEMPLATES[number]) => {
    setEditingItem(null); setFormCategory(preset.category); setFormName(preset.name); setFormProvider(preset.provider); setFormDueDay(String(preset.dueDay)); setFormCloseDay('');
    setFormEstimatedAmount(String(preset.defaultAmount)); setFormPaymentCode(''); setFormAutoDebit(false); setFormLastDigits(''); setFormReminderDue(3); setFormNotes(''); setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { onShowToast('Ingresá un nombre para el vencimiento', 'error'); return; }
    const due = Math.min(31, Math.max(1, Number(formDueDay) || 10));
    const close = formCloseDay ? Math.min(31, Math.max(1, Number(formCloseDay) || 20)) : undefined;
    const amount = formEstimatedAmount ? Number(formEstimatedAmount.replace(/[^0-9.]/g, '')) : undefined;
    const common = {
      category: formCategory, name: formName.trim(), provider: formProvider.trim() || 'Proveedor', dueDay: due,
      closeDay: formCategory === 'tarjeta' ? close : undefined, estimatedAmount: Number.isFinite(amount) ? amount : undefined,
      paymentCode: formPaymentCode.trim() || undefined, autoDebit: formAutoDebit, lastDigits: formCategory === 'tarjeta' ? formLastDigits.trim() || undefined : undefined,
      reminderDaysBeforeDue: formReminderDue || 3, notes: formNotes.trim() || undefined
    };
    if (editingItem) saveItems(items.map(i => i.id === editingItem.id ? { ...i, ...common } : i));
    else saveItems([...items, { id: `venc-${Date.now()}`, ...common, paidThisMonth: false }]);
    onShowToast(editingItem ? 'Vencimiento actualizado' : 'Vencimiento creado', 'success');
    setIsModalOpen(false);
  };

  const togglePaid = (id: string) => {
    saveItems(items.map(i => i.id === id ? { ...i, paidThisMonth: !i.paidThisMonth, paidAt: !i.paidThisMonth ? Date.now() : undefined } : i));
    onShowToast('Estado actualizado', 'info');
  };

  const deleteItem = (id: string, name: string) => {
    if (confirm(`¿Eliminar el vencimiento "${name}"?`)) { saveItems(items.filter(i => i.id !== id)); onShowToast('Vencimiento eliminado', 'info'); }
  };

  const toggleNotifications = async () => {
    if (!('Notification' in window)) { onShowToast('Tu navegador no soporta notificaciones web.', 'info'); return; }
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { onShowToast('Permiso de notificaciones rechazado.', 'info'); return; }
    }
    setNotificationsEnabled(true); localStorage.setItem('gastoar_vencimientos_notif_v1', 'true');
    onShowToast('Notificaciones activadas en este dispositivo.', 'success');
  };

  const stats = useMemo(() => {
    const pending = items.filter(i => !i.paidThisMonth);
    const paid = items.filter(i => i.paidThisMonth);
    const urgent = pending.filter(i => { const d = i.dueDay - currentDay; return d >= 0 && d <= 7; });
    return {
      pendingCount: pending.length,
      paidCount: paid.length,
      urgentCount: urgent.length,
      total: items.reduce((s, i) => s + (i.estimatedAmount || 0), 0),
      pendingAmount: pending.reduce((s, i) => s + (i.estimatedAmount || 0), 0),
      paidAmount: paid.reduce((s, i) => s + (i.estimatedAmount || 0), 0)
    };
  }, [items, currentDay]);

  const filteredItems = useMemo(() => {
    let result = items.filter(i => {
      if (activeView === 'mes' && i.paidThisMonth) return false;
      if (activeView === 'pagados' && !i.paidThisMonth) return false;
      if (activeView === 'proximos') {
        const d = i.dueDay - currentDay;
        if (i.paidThisMonth || d < 0 || d > 30) return false;
      }
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!`${i.name} ${i.provider} ${i.notes || ''}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    return result.sort((a, b) => sortBy === 'amount_desc' ? (b.estimatedAmount || 0) - (a.estimatedAmount || 0) : sortBy === 'name' ? a.name.localeCompare(b.name) : a.dueDay - b.dueDay);
  }, [items, activeView, categoryFilter, searchTerm, sortBy, currentDay]);

  const monthDays = useMemo(() => {
    const first = new Date(calendarYear, calendarMonth, 1);
    const days = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const mondayOffset = (first.getDay() + 6) % 7;
    return { days, mondayOffset };
  }, [calendarMonth, calendarYear]);

  const changeMonth = (delta: number) => {
    const next = new Date(calendarYear, calendarMonth + delta, 1);
    setCalendarMonth(next.getMonth()); setCalendarYear(next.getFullYear());
  };

  const calendarLabel = new Date(calendarYear, calendarMonth, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const itemStatus = (item: DueAlertItem) => {
    const d = item.dueDay - currentDay;
    if (item.paidThisMonth) return { label: 'Pagado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (d < 0) return { label: `Vencido hace ${Math.abs(d)} días`, cls: 'bg-rose-50 text-rose-700 border-rose-100' };
    if (d === 0) return { label: 'Vence hoy', cls: 'bg-[#FFF0EA] text-[#D94316] border-orange-100' };
    if (d === 1) return { label: 'Vence mañana', cls: 'bg-[#FFF5F0] text-[#D94316] border-orange-100' };
    return { label: `Vence en ${d} días`, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  const renderCard = (item: DueAlertItem) => {
    const meta = CATEGORY_META[item.category]; const Icon = meta.Icon; const status = itemStatus(item); const expanded = expandedItemId === item.id;
    return (
      <article key={item.id} className={`bg-white border rounded-2xl p-3.5 sm:p-4 transition-all hover:shadow-sm ${item.paidThisMonth ? 'border-slate-100 opacity-80' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
            <span className="text-[9px] font-extrabold uppercase text-slate-400">{new Date(currentYear, currentMonth, item.dueDay).toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}</span>
            <span className="text-xl leading-none font-black text-slate-900">{formatDay(item.dueDay)}</span>
            <span className="text-[9px] font-bold uppercase text-slate-400">{new Date(currentYear, currentMonth, 1).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</span>
          </div>
          <div className={`w-11 h-11 rounded-xl ${meta.soft} ${meta.text} flex items-center justify-center shrink-0`}><Icon className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm text-slate-900 truncate">{item.name}</h3>
              {item.lastDigits && <span className="text-[10px] font-mono font-bold text-slate-500">••{item.lastDigits}</span>}
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.provider} · {meta.label}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${status.cls}`}>{status.label}</span>
              {item.autoDebit && <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500">Débito automático</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm sm:text-base font-black text-slate-900">{item.estimatedAmount ? formatCurrency(item.estimatedAmount, profile.currency) : 'A definir'}</p>
            <button type="button" onClick={() => setExpandedItemId(expanded ? null : item.id)} className="mt-1 w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-[#F95420] hover:border-orange-200 inline-flex items-center justify-center cursor-pointer">
              <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90 text-[#F95420]' : ''}`} />
            </button>
          </div>
        </div>
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            <button type="button" onClick={() => togglePaid(item.id)} className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${item.paidThisMonth ? 'bg-slate-100 text-slate-700' : 'bg-[#F95420] text-white'}`}><Check className="w-3.5 h-3.5" />{item.paidThisMonth ? 'Desmarcar pagado' : 'Marcar como pagado'}</button>
            {onOpenTransactionModal && !item.paidThisMonth && <button type="button" onClick={onOpenTransactionModal} className="px-3 py-2 rounded-xl border border-orange-200 text-[#F95420] bg-orange-50 text-xs font-bold cursor-pointer">+ Registrar gasto</button>}
            {item.paymentCode && <button type="button" onClick={() => { navigator.clipboard?.writeText(item.paymentCode!); onShowToast('Código copiado', 'success'); }} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold cursor-pointer flex items-center gap-1"><Copy className="w-3.5 h-3.5" />Copiar código</button>}
            <button type="button" onClick={() => openEdit(item)} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" />Editar</button>
            <button type="button" onClick={() => deleteItem(item.id, item.name)} className="px-3 py-2 rounded-xl border border-rose-100 text-rose-600 text-xs font-bold cursor-pointer flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" />Eliminar</button>
          </div>
        )}
      </article>
    );
  };

  const renderCalendar = () => (
    <section className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div><h2 className="font-black text-lg text-slate-900 capitalize">{calendarLabel}</h2><p className="text-xs text-slate-500">Tocá un día para agregar un vencimiento.</p></div>
        <div className="flex items-center gap-1.5"><button onClick={() => changeMonth(-1)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#F95420] cursor-pointer"><ChevronLeft className="w-4 h-4" /></button><button onClick={() => { setCalendarMonth(currentMonth); setCalendarYear(currentYear); }} className="px-3 h-9 rounded-xl border border-orange-200 text-[#F95420] text-xs font-bold cursor-pointer">Hoy</button><button onClick={() => changeMonth(1)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#F95420] cursor-pointer"><ChevronRight className="w-4 h-4" /></button></div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">{['L','M','M','J','V','S','D'].map((d,i)=><div key={`${d}-${i}`} className="text-center text-[10px] font-black text-slate-400 py-2">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: monthDays.mondayOffset }).map((_,i)=><div key={`empty-${i}`} className="min-h-16 sm:min-h-20" />)}
        {Array.from({ length: monthDays.days }, (_,i)=>i+1).map(day=>{
          const dayItems=items.filter(x=>x.dueDay===day); const isToday=calendarMonth===currentMonth&&calendarYear===currentYear&&day===currentDay; const pending=dayItems.some(x=>!x.paidThisMonth);
          return <button key={day} type="button" onClick={()=>openCreate(day)} className={`min-h-16 sm:min-h-20 rounded-xl border p-1.5 text-left hover:border-orange-300 transition-colors cursor-pointer ${isToday?'border-[#F95420] bg-orange-50/60':'border-slate-100 bg-slate-50/40'}`}>
            <div className="flex items-center justify-between"><span className={`text-xs font-black ${isToday?'text-[#F95420]':'text-slate-700'}`}>{day}</span>{isToday&&<span className="text-[8px] font-black text-[#F95420]">HOY</span>}</div>
            <div className="mt-2 space-y-1">{dayItems.slice(0,2).map(x=><div key={x.id} className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${x.paidThisMonth?'bg-emerald-500':pending?'bg-[#F95420]':'bg-slate-300'}`} /><span className="text-[8px] font-bold text-slate-500 truncate">{x.name}</span></div>)}{dayItems.length>2&&<span className="text-[8px] font-bold text-slate-400">+{dayItems.length-2} más</span>}</div>
          </button>
        })}
      </div>
    </section>
  );

  return (
    <div className="space-y-4 sm:space-y-5 bg-white/40">
      {/* Header */}
      <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF0EA] text-[#F95420] flex items-center justify-center"><CalendarClock className="w-5 h-5" /></div>
            <div><h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Vencimientos</h1><p className="text-xs text-slate-500 mt-0.5">Organizá tus pagos y evitá recargos.</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={toggleNotifications} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:border-orange-200 hover:text-[#F95420]">{notificationsEnabled?<BellRing className="w-4 h-4 text-[#F95420]"/>:<Bell className="w-4 h-4"/>}{notificationsEnabled?'Avisos activos':'Activar avisos'}</button>
            {onOpenCalendarModal && <button type="button" onClick={onOpenCalendarModal} className="px-3 py-2 rounded-xl border border-orange-200 bg-white text-[#F95420] text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Calendar className="w-4 h-4"/>Google Calendar</button>}
            <button type="button" onClick={()=>openCreate()} className="px-4 py-2.5 rounded-xl bg-[#F95420] hover:bg-[#E04412] text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer"><Plus className="w-4 h-4"/>Agregar</button>
          </div>
        </div>
      </section>

      {/* Main filters */}
      <section className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-1 overflow-x-auto scrollbar-none">
        {[['proximos','Próximos',stats.urgentCount],['mes','Este mes',items.filter(i=>!i.paidThisMonth).length],['pagados','Pagados',stats.paidCount],['todos','Todos',items.length]].map(([id,label,count])=><button key={id} type="button" onClick={()=>setActiveView(id as any)} className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${activeView===id?'bg-[#F95420] text-white':'text-slate-600 hover:bg-slate-50'}`}><span>{label}</span><span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeView===id?'bg-white/20':'bg-slate-100 text-slate-500'}`}>{count}</span></button>)}
        <button type="button" onClick={()=>setActiveView('calendario')} className={`ml-auto px-3.5 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${activeView==='calendario'?'bg-[#F95420] text-white':'text-slate-600 hover:bg-slate-50'}`}><Calendar className="w-3.5 h-3.5"/>Calendario</button>
      </section>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button type="button" onClick={()=>setActiveView('proximos')} className="text-left bg-[#FFF7F3] border border-orange-100 rounded-2xl p-4 cursor-pointer hover:border-orange-200"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-[#D94316]">Vencen esta semana</span><Clock className="w-4 h-4 text-[#F95420]"/></div><div className="mt-2 text-2xl font-black text-slate-900">{stats.urgentCount}</div><p className="text-[11px] text-slate-500 mt-0.5">Pendientes de atención</p></button>
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Pendientes</span><Wallet className="w-4 h-4 text-[#F95420]"/></div><div className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(stats.pendingAmount, profile.currency)}</div><p className="text-[11px] text-slate-500 mt-0.5">{stats.pendingCount} vencimientos</p></div>
        <button type="button" onClick={()=>setActiveView('pagados')} className="text-left bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 cursor-pointer"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Pagados este mes</span><CheckCircle2 className="w-4 h-4 text-emerald-600"/></div><div className="mt-2 text-2xl font-black text-slate-900">{stats.paidCount}</div><p className="text-[11px] text-slate-500 mt-0.5">{formatCurrency(stats.paidAmount, profile.currency)}</p></button>
      </div>

      {activeView === 'calendario' ? renderCalendar() : (
        <>
          {/* Quick templates */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-black text-slate-900">Agregá rápido</h2><p className="text-[11px] text-slate-500">Plantillas para tus pagos habituales.</p></div><Zap className="w-4 h-4 text-[#F95420]"/></div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">{PRESET_TEMPLATES.map(p=>{const Icon=p.icon;return <button key={p.name} type="button" onClick={()=>applyPreset(p)} className="shrink-0 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40 flex items-center gap-2 cursor-pointer"><span className="w-8 h-8 rounded-lg bg-orange-50 text-[#F95420] flex items-center justify-center"><Icon className="w-4 h-4"/></span><span className="text-left"><span className="block text-[11px] font-extrabold text-slate-800">{p.name}</span><span className="block text-[10px] text-slate-400">{formatCurrency(p.defaultAmount, profile.currency)}</span></span></button>})}</div>
          </section>

          {/* List toolbar */}
          <section className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar vencimiento..." className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300"/></div><div className="flex gap-2"><select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 outline-none"><option value="day">Por fecha</option><option value="amount_desc">Mayor monto</option><option value="name">Alfabético</option></select><button type="button" onClick={()=>setActiveView('calendario')} className="px-3 py-2.5 rounded-xl border border-orange-200 text-[#F95420] text-xs font-bold flex items-center gap-1 cursor-pointer"><Calendar className="w-3.5 h-3.5"/>Calendario</button></div></div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">{(['all','tarjeta','servicio','alquiler','expensas','suscripcion','impuesto','salud','otro'] as const).map(cat=>{const count=cat==='all'?items.length:items.filter(i=>i.category===cat).length;if(cat!=='all'&&count===0)return null;return <button key={cat} type="button" onClick={()=>setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold whitespace-nowrap cursor-pointer ${categoryFilter===cat?'bg-[#F95420] text-white':'bg-slate-100 text-slate-600'}`}>{cat==='all'?'Todos':CATEGORY_META[cat].label} {count}</button>})}</div>
          </section>

          {/* Section heading */}
          <div className="flex items-center justify-between px-1"><div><h2 className="text-base sm:text-lg font-black text-slate-900">{activeView==='pagados'?'Pagados este mes':activeView==='todos'?'Todos tus vencimientos':'Próximos vencimientos'}</h2><p className="text-[11px] text-slate-500">{filteredItems.length} {filteredItems.length===1?'vencimiento':'vencimientos'} registrados</p></div><button type="button" onClick={()=>openCreate()} className="text-[#F95420] text-xs font-extrabold flex items-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5"/>Agregar</button></div>
          <div className="space-y-2.5">{filteredItems.length?filteredItems.map(renderCard):<div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center"><div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F95420] mx-auto flex items-center justify-center"><CalendarClock className="w-6 h-6"/></div><h3 className="mt-3 text-sm font-black text-slate-800">No hay vencimientos para mostrar</h3><p className="mt-1 text-xs text-slate-500">Agregá tu primer vencimiento o elegí una plantilla rápida.</p><button type="button" onClick={()=>openCreate()} className="mt-4 px-4 py-2.5 rounded-xl bg-[#F95420] text-white text-xs font-extrabold cursor-pointer">+ Agregar vencimiento</button></div>}</div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><div><h3 className="text-base font-black text-slate-900">{editingItem?'Editar vencimiento':'Nuevo vencimiento'}</h3><p className="text-[11px] text-slate-500">Configurá cuándo y cuánto tenés que pagar.</p></div><button onClick={()=>setIsModalOpen(false)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center cursor-pointer"><X className="w-4 h-4"/></button></div>
          <form onSubmit={handleSaveForm} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
            <div><label className="text-xs font-extrabold text-slate-700">Tipo</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">{(Object.keys(CATEGORY_META) as AlertItemCategory[]).map(cat=>{const M=CATEGORY_META[cat];const I=M.Icon;return <button key={cat} type="button" onClick={()=>setFormCategory(cat)} className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${formCategory===cat?'bg-[#F95420] text-white border-[#F95420]':'bg-white text-slate-600 border-slate-200'}`}><I className="w-3.5 h-3.5"/>{M.label}</button>})}</div></div>
            <div className="grid sm:grid-cols-2 gap-3"><label className="text-xs font-extrabold text-slate-700">Nombre<input required value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Ej. Internet, Expensas, Visa" className="mt-1.5 w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"/></label><label className="text-xs font-extrabold text-slate-700">Proveedor<input value={formProvider} onChange={e=>setFormProvider(e.target.value)} placeholder="Ej. Edenor, BBVA" className="mt-1.5 w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"/></label></div>
            <div className="grid grid-cols-2 gap-3"><label className="text-xs font-extrabold text-slate-700">Día de vencimiento<input inputMode="numeric" value={formDueDay} onChange={e=>setFormDueDay(e.target.value.replace(/\D/g,''))} placeholder="Ej. 10" className="mt-1.5 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"/></label><label className="text-xs font-extrabold text-slate-700">Monto estimado<input inputMode="decimal" value={formEstimatedAmount} onChange={e=>setFormEstimatedAmount(e.target.value.replace(/[^0-9.]/g,''))} placeholder="$ 0" className="mt-1.5 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"/></label></div>
            {formCategory==='tarjeta'&&<div className="grid grid-cols-2 gap-3"><label className="text-xs font-extrabold text-slate-700">Día de cierre<input inputMode="numeric" value={formCloseDay} onChange={e=>setFormCloseDay(e.target.value.replace(/\D/g,''))} placeholder="Ej. 20" className="mt-1.5 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"/></label><label className="text-xs font-extrabold text-slate-700">Últimos 4 dígitos<input inputMode="numeric" maxLength={4} value={formLastDigits} onChange={e=>setFormLastDigits(e.target.value.replace(/\D/g,''))} placeholder="4821" className="mt-1.5 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"/></label></div>}
            <label className="text-xs font-extrabold text-slate-700">Código de pago / referencia<input value={formPaymentCode} onChange={e=>setFormPaymentCode(e.target.value)} placeholder="CBU, referencia, número de cliente..." className="mt-1.5 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-300"/></label>
            <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3 flex items-center justify-between"><div><p className="text-xs font-extrabold text-slate-800">Débito automático</p><p className="text-[10px] text-slate-500">Se cobra solo desde tu cuenta o tarjeta.</p></div><button type="button" onClick={()=>setFormAutoDebit(v=>!v)} className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${formAutoDebit?'bg-[#F95420]':'bg-slate-300'}`}><span className={`block w-5 h-5 rounded-full bg-white transition-transform ${formAutoDebit?'translate-x-5':''}`}/></button></div>
            <label className="text-xs font-extrabold text-slate-700">Notas (opcional)<textarea value={formNotes} onChange={e=>setFormNotes(e.target.value)} placeholder="Ej. enviar comprobante después de transferir" rows={3} className="mt-1.5 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:border-orange-300"/></label>
            <div className="flex gap-2 pt-1"><button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-extrabold cursor-pointer">Cancelar</button><button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#F95420] hover:bg-[#E04412] text-white text-xs font-extrabold cursor-pointer">{editingItem?'Guardar cambios':'Guardar vencimiento'}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
};
