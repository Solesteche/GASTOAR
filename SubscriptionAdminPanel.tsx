import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  MoreVertical, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Calendar, 
  ShieldCheck, 
  ExternalLink, 
  Mail, 
  DollarSign, 
  UserCheck, 
  Edit3, 
  Trash2, 
  BadgePercent,
  Check,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { BillingCycle, SubscriptionPlan, SubscriptionPlanId, SubscriptionStatus, UserSubscription } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { formatCurrency, formatDateEs } from '../utils/formatters';

interface SubscriptionAdminPanelProps {
  subscriptions: UserSubscription[];
  onUpdateSubscription: (id: string, updates: Partial<UserSubscription>) => void;
  onAddSubscription: (newSub: Omit<UserSubscription, 'id' | 'createdAt'>) => void;
  onDeleteSubscription: (id: string) => void;
  onClose?: () => void;
}

export const SubscriptionAdminPanel: React.FC<SubscriptionAdminPanelProps> = ({
  subscriptions = [],
  onUpdateSubscription,
  onAddSubscription,
  onDeleteSubscription,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  
  // Modals inside Admin
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<UserSubscription | null>(null);
  const [viewingReceiptSub, setViewingReceiptSub] = useState<UserSubscription | null>(null);
  const [extendingTrialSub, setExtendingTrialSub] = useState<UserSubscription | null>(null);
  const [customExtendDays, setCustomExtendDays] = useState<number>(15);

  // New Subscription Form State
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formAccountCode, setFormAccountCode] = useState<string>(() => 'PAIR-' + Math.floor(1000 + Math.random() * 9000));
  const [formPlanId, setFormPlanId] = useState<SubscriptionPlanId>('pareja');
  const [formCycle, setFormCycle] = useState<BillingCycle>('monthly');
  const [formStatus, setFormStatus] = useState<SubscriptionStatus>('trial');
  const [formTrialDays, setFormTrialDays] = useState<number>(15);
  const [formNotes, setFormNotes] = useState<string>('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Calculations for KPI Cards
  const stats = useMemo(() => {
    const totalSubs = subscriptions.length;
    const activeSubs = subscriptions.filter(s => s.status === 'active').length;
    
    // Trial stats
    const trialSubs = subscriptions.filter(s => {
      if (s.status !== 'trial') return false;
      const renewal = s.nextRenewalDate || s.trialEndsDate || '';
      return renewal >= todayStr;
    }).length;

    const trialExpiredSubs = subscriptions.filter(s => {
      if (s.status === 'trial') {
        const renewal = s.nextRenewalDate || s.trialEndsDate || '';
        return renewal < todayStr;
      }
      return s.status === 'past_due' || s.status === 'canceled';
    }).length;

    const pendingSubs = subscriptions.filter(s => s.status === 'pending_payment').length;
    const pastDueSubs = subscriptions.filter(s => s.status === 'past_due' || s.status === 'canceled').length;

    // Monthly Recurring Revenue (MRR)
    const mrr = subscriptions.reduce((acc, sub) => {
      if (sub.status === 'active') {
        if (sub.billingCycle === 'monthly') {
          return acc + sub.pricePaid;
        } else if (sub.billingCycle === 'annual') {
          return acc + Math.round(sub.pricePaid / 12);
        }
      }
      return acc;
    }, 0);

    // Total accumulated volume
    const totalVolume = subscriptions.reduce((acc, sub) => acc + sub.pricePaid, 0);

    return {
      totalSubs,
      activeSubs,
      trialSubs,
      trialExpiredSubs,
      pendingSubs,
      pastDueSubs,
      mrr,
      totalVolume,
    };
  }, [subscriptions, todayStr]);

  // Filtered List
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        sub.userName.toLowerCase().includes(searchLower) ||
        sub.userEmail.toLowerCase().includes(searchLower) ||
        sub.accountCode.toLowerCase().includes(searchLower) ||
        (sub.mercadopagoPaymentId && sub.mercadopagoPaymentId.toLowerCase().includes(searchLower));

      // Status
      let matchesStatus = true;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'trial_active') {
        matchesStatus = sub.status === 'trial' && (sub.nextRenewalDate || '') >= todayStr;
      } else if (statusFilter === 'trial_expired') {
        matchesStatus = sub.status === 'trial' && (sub.nextRenewalDate || '') < todayStr;
      } else {
        matchesStatus = sub.status === statusFilter;
      }

      // Plan
      const matchesPlan = planFilter === 'all' || sub.planId === planFilter;

      // Cycle
      const matchesCycle = cycleFilter === 'all' || sub.billingCycle === cycleFilter;

      return matchesSearch && matchesStatus && matchesPlan && matchesCycle;
    });
  }, [subscriptions, searchTerm, statusFilter, planFilter, cycleFilter, todayStr]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === formPlanId) || SUBSCRIPTION_PLANS[1];
    const price = formCycle === 'annual' ? selectedPlan.priceAnnual : selectedPlan.priceMonthly;

    const nextRenewal = new Date();
    if (formStatus === 'trial') {
      nextRenewal.setDate(nextRenewal.getDate() + (formTrialDays || 15));
    } else if (formCycle === 'annual') {
      nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
    } else {
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    }

    const renewalStr = nextRenewal.toISOString().split('T')[0];

    onAddSubscription({
      userId: `usr-${Date.now()}`,
      userName: formName.trim(),
      userEmail: formEmail.trim(),
      accountCode: formAccountCode.trim(),
      planId: formPlanId,
      planName: selectedPlan.name,
      status: formStatus,
      billingCycle: formCycle,
      pricePaid: formStatus === 'trial' ? 0 : price,
      currency: 'ARS',
      paymentMethod: formStatus === 'trial' ? 'Mercado Pago (Prueba 15 Días)' : 'Mercado Pago',
      mercadopagoPaymentId: `MP-${Math.floor(800000000 + Math.random() * 199999999)}`,
      startDate: todayStr,
      lastPaymentDate: todayStr,
      nextRenewalDate: renewalStr,
      trialEndsDate: formStatus === 'trial' ? renewalStr : undefined,
      trialDaysGranted: formStatus === 'trial' ? (formTrialDays || 15) : undefined,
      autoRenew: true,
      notes: formNotes.trim() || (formStatus === 'trial' ? `Prueba gratuita de ${formTrialDays || 15} días asignada.` : 'Registrado desde Panel de Administración.'),
    });

    setIsAddModalOpen(false);
    // Reset
    setFormName('');
    setFormEmail('');
    setFormNotes('');
  };

  const handleExtendTrialDays = (sub: UserSubscription, days: number, asActiveStatus = false) => {
    const baseDate = new Date();
    // If the subscription is currently active or in trial and date is in the future, extend from that date
    if (sub.nextRenewalDate && new Date(sub.nextRenewalDate) > baseDate) {
      baseDate.setTime(new Date(sub.nextRenewalDate).getTime());
    }
    baseDate.setDate(baseDate.getDate() + days);
    const newDate = baseDate.toISOString().split('T')[0];

    onUpdateSubscription(sub.id, {
      nextRenewalDate: newDate,
      trialEndsDate: newDate,
      status: asActiveStatus ? 'active' : 'trial',
      notes: `${sub.notes ? sub.notes + ' | ' : ''}Prórroga de +${days} días otorgada el ${new Date().toLocaleDateString('es-AR')}`
    });
  };

  const exportSubsToCSV = () => {
    const headers = ['ID', 'Cliente', 'Email', 'Cuenta', 'Plan', 'Ciclo', 'Monto ARS', 'Estado', 'Medio de Pago', 'ID Mercado Pago', 'Inicio', 'Ultimo Pago', 'Proxima Renovacion'];
    const rows = filteredSubscriptions.map(s => [
      s.id,
      `"${s.userName}"`,
      s.userEmail,
      s.accountCode,
      `"${s.planName}"`,
      s.billingCycle === 'annual' ? 'Anual' : 'Mensual',
      s.pricePaid,
      s.status,
      `"${s.paymentMethod}"`,
      s.mercadopagoPaymentId || '',
      s.startDate,
      s.lastPaymentDate,
      s.nextRenewalDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suscriptores_gastoar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (sub: UserSubscription) => {
    const isPastDue = (sub.nextRenewalDate || '') < todayStr && sub.status !== 'canceled';

    if (sub.status === 'trial') {
      if (isPastDue) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>Prueba Vencida (Bloqueada)</span>
          </span>
        );
      }
      // Calculate remaining days
      const end = new Date(sub.nextRenewalDate || sub.trialEndsDate || todayStr);
      const now = new Date(todayStr);
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);

      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Prueba: {diffDays} {diffDays === 1 ? 'día' : 'días'}</span>
        </span>
      );
    }

    switch (sub.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Activa</span>
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pendiente MP</span>
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Vencida</span>
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Cancelada</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getPlanBadge = (planId: SubscriptionPlanId) => {
    switch (planId) {
      case 'pro_ai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pro & IA</span>
          </span>
        );
      case 'pareja':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-pink-100 text-pink-800 border border-pink-200">
            <Users className="w-3.5 h-3.5 text-pink-600" />
            <span>Parejas Dúo</span>
          </span>
        );
      case 'individual':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Individual</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Gratuito</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Panel de Control de Suscripciones & Clientes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoreo de ingresos recurrentes, cobros automáticos de Mercado Pago y estado de usuarios.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportSubsToCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#009EE3] hover:bg-[#0089C7] text-white font-extrabold text-xs shadow-md shadow-[#009EE3]/30 transition-all flex items-center gap-1.5 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Suscripción</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: MRR */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">MRR Mensual</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(stats.mrr, 'ARS')}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">Cobro recurrente activo</span>
          </div>
        </div>

        {/* Card 2: Clientes Activos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Suscriptores Activos</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.activeSubs} <span className="text-sm font-semibold text-slate-400">/ {stats.totalSubs} total</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {stats.trialSubs} en período de prueba gratuito
          </div>
        </div>

        {/* Card 3: Mercado Pago Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Facturación Mercado Pago</span>
            <div className="p-2 rounded-xl bg-sky-50 text-[#009EE3]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(stats.totalVolume, 'ARS')}
          </div>
          <div className="text-[11px] text-slate-500">
            Acreditado en cuenta Mercado Pago
          </div>
        </div>

        {/* Card 4: Alertas de Pago */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cobros Pendientes</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats.pendingSubs + stats.pastDueSubs}
          </div>
          <div className="text-[11px] text-slate-500">
            {stats.pendingSubs} pendientes • {stats.pastDueSubs} vencidas
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente por nombre, email, código de cuenta o ID Mercado Pago..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Quick Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo Activas</option>
              <option value="trial_active">✨ Prueba Activa (Vigente)</option>
              <option value="trial_expired">⛔ Prueba Vencida (Bloqueada)</option>
              <option value="pending_payment">Pendiente MP</option>
              <option value="past_due">Vencidas</option>
              <option value="canceled">Canceladas</option>
            </select>

            {/* Plan Selector */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los planes</option>
              <option value="individual">Plan Individual</option>
              <option value="pareja">Plan Parejas Dúo</option>
              <option value="pro_ai">Plan Pro & IA</option>
            </select>

            {/* Billing Cycle */}
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los ciclos</option>
              <option value="monthly">Mensual</option>
              <option value="annual">Anual</option>
            </select>
          </div>

        </div>
      </div>

      {/* SUBSCRIBERS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Cliente / Usuario</th>
                <th className="py-3.5 px-4">Plan Contratado</th>
                <th className="py-3.5 px-4">Ciclo & Monto</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Próxima Renovación</th>
                <th className="py-3.5 px-4">Mercado Pago</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No se encontraron suscriptores con esos filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const isPastDue = new Date(sub.nextRenewalDate) < new Date() && sub.status !== 'canceled';
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {sub.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{sub.userName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span>{sub.userEmail}</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-semibold">{sub.accountCode}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        {getPlanBadge(sub.planId)}
                      </td>

                      {/* Ciclo & Monto */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(sub.pricePaid, 'ARS')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {sub.billingCycle === 'annual' ? 'Facturación Anual' : 'Facturación Mensual'}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {getStatusBadge(sub)}
                        </div>
                      </td>

                      {/* Renovación */}
                      <td className="py-3.5 px-4">
                        <div className={`font-semibold ${isPastDue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                          {formatDateEs(sub.nextRenewalDate)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sub.status === 'trial' ? (
                            <span>Prueba otorgada: {formatDateEs(sub.startDate)}</span>
                          ) : (
                            <span>Último cobro: {formatDateEs(sub.lastPaymentDate)}</span>
                          )}
                        </div>
                      </td>

                      {/* Mercado Pago ID */}
                      <td className="py-3.5 px-4">
                        {sub.mercadopagoPaymentId ? (
                          <button
                            type="button"
                            onClick={() => setViewingReceiptSub(sub)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-[#009EE3] hover:underline font-bold"
                          >
                            <span>{sub.mercadopagoPaymentId}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Cobro manual</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Quick Extend Trial Days Modal trigger */}
                          <button
                            type="button"
                            onClick={() => setExtendingTrialSub(sub)}
                            title="Extender período de prueba (Prórroga)"
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[10px] transition-colors border border-purple-200/80 flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-[#7928CA]" />
                            <span>Extender Prueba</span>
                          </button>

                          {/* Quick Extend +30 days */}
                          <button
                            type="button"
                            onClick={() => handleExtendTrialDays(sub, 30, true)}
                            title="Extender +30 días como Activa"
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                          >
                            +30d
                          </button>

                          {/* Quick Status Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus: SubscriptionStatus = sub.status === 'active' ? 'pending_payment' : 'active';
                              onUpdateSubscription(sub.id, { status: nextStatus });
                            }}
                            title={sub.status === 'active' ? 'Pausar Suscripción' : 'Activar Suscripción'}
                            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                              sub.status === 'active'
                                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            {sub.status === 'active' ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit Modal */}
                          <button
                            type="button"
                            onClick={() => setEditingSub(sub)}
                            title="Editar Plan y Datos"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar el registro de suscripción de ${sub.userName}?`)) {
                                onDeleteSubscription(sub.id);
                              }
                            }}
                            title="Eliminar registro"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD MANUAL SUBSCRIPTION */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Registrar Nueva Suscripción Manual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej. Agustín Gómez"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="agustin@ejemplo.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Plan a Asignar</label>
                  <select
                    value={formPlanId}
                    onChange={(e) => setFormPlanId(e.target.value as SubscriptionPlanId)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="individual">Plan Individual ($4.900/m)</option>
                    <option value="pareja">Plan Parejas Dúo ($7.900/m)</option>
                    <option value="pro_ai">Plan Pro & IA ($12.500/m)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Ciclo de Cobro</label>
                  <select
                    value={formCycle}
                    onChange={(e) => setFormCycle(e.target.value as BillingCycle)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="annual">Anual (con descuento)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Estado Inicial</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as SubscriptionStatus)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Activa (Pagado)</option>
                    <option value="trial">Prueba Gratuita</option>
                    <option value="pending_payment">Pendiente de Pago</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Código de Cuenta</label>
                  <input
                    type="text"
                    value={formAccountCode}
                    onChange={(e) => setFormAccountCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Notas u Observaciones</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ej. Abonó por transferencia bancaria directa..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Guardar Suscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUBSCRIPTION */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                Modificar Suscripción: {editingSub.userName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Estado de la Suscripción</label>
                <select
                  value={editingSub.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as SubscriptionStatus;
                    setEditingSub({ ...editingSub, status: newStatus });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Activa</option>
                  <option value="trial">En Prueba</option>
                  <option value="pending_payment">Pendiente de Pago</option>
                  <option value="past_due">Vencida</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Plan Asignado</label>
                <select
                  value={editingSub.planId}
                  onChange={(e) => {
                    const pId = e.target.value as SubscriptionPlanId;
                    const p = SUBSCRIPTION_PLANS.find(x => x.id === pId);
                    setEditingSub({ 
                      ...editingSub, 
                      planId: pId, 
                      planName: p?.name || editingSub.planName,
                      pricePaid: editingSub.billingCycle === 'annual' ? (p?.priceAnnual || 0) : (p?.priceMonthly || 0)
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="individual">Plan Individual</option>
                  <option value="pareja">Plan Parejas Dúo</option>
                  <option value="pro_ai">Plan Pro & IA</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Próxima Fecha de Renovación</label>
                <input
                  type="date"
                  value={editingSub.nextRenewalDate}
                  onChange={(e) => setEditingSub({ ...editingSub, nextRenewalDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Trial Extender inside Edit Modal */}
              <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#7928CA]" />
                    Prórroga Rápida de Prueba
                  </span>
                  <span className="text-[10px] text-purple-600 font-semibold">Suma días a la fecha</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(editingSub.nextRenewalDate || new Date());
                      d.setDate(d.getDate() + 7);
                      setEditingSub({ 
                        ...editingSub, 
                        status: 'trial', 
                        nextRenewalDate: d.toISOString().split('T')[0],
                        notes: `${editingSub.notes ? editingSub.notes + ' | ' : ''}+7d prueba otorgados` 
                      });
                    }}
                    className="py-1 px-2 rounded-lg bg-white hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition-colors"
                  >
                    +7 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(editingSub.nextRenewalDate || new Date());
                      d.setDate(d.getDate() + 15);
                      setEditingSub({ 
                        ...editingSub, 
                        status: 'trial', 
                        nextRenewalDate: d.toISOString().split('T')[0],
                        notes: `${editingSub.notes ? editingSub.notes + ' | ' : ''}+15d prueba otorgados` 
                      });
                    }}
                    className="py-1 px-2 rounded-lg bg-white hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition-colors"
                  >
                    +15 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(editingSub.nextRenewalDate || new Date());
                      d.setDate(d.getDate() + 30);
                      setEditingSub({ 
                        ...editingSub, 
                        status: 'trial', 
                        nextRenewalDate: d.toISOString().split('T')[0],
                        notes: `${editingSub.notes ? editingSub.notes + ' | ' : ''}+30d prueba otorgados` 
                      });
                    }}
                    className="py-1 px-2 rounded-lg bg-white hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition-colors"
                  >
                    +30 Días
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Notas</label>
                <textarea
                  rows={2}
                  value={editingSub.notes || ''}
                  onChange={(e) => setEditingSub({ ...editingSub, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSubscription(editingSub.id, editingSub);
                  setEditingSub(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXTEND TRIAL DAYS (ADMIN SPECIAL ACTION) */}
      {extendingTrialSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-[#7928CA]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Extender Días de Prueba
                  </h3>
                  <p className="text-[11px] text-slate-500">{extendingTrialSub.userName} ({extendingTrialSub.userEmail})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExtendingTrialSub(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-slate-500">Vencimiento actual registrado:</div>
                <div className="text-sm font-black text-slate-800">
                  {formatDateEs(extendingTrialSub.nextRenewalDate)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Plan actual: {extendingTrialSub.planName}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Seleccionar días de prórroga:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendTrialDays(extendingTrialSub, 7, false);
                      setExtendingTrialSub(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7928CA] font-extrabold text-xs border border-purple-200 transition-all flex flex-col items-center gap-0.5 active:scale-95"
                  >
                    <span>+7 Días</span>
                    <span className="text-[10px] font-normal text-purple-600">1 semana</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleExtendTrialDays(extendingTrialSub, 15, false);
                      setExtendingTrialSub(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-all flex flex-col items-center gap-0.5 active:scale-95"
                  >
                    <span>+15 Días</span>
                    <span className="text-[10px] font-normal text-purple-200">Recomendado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleExtendTrialDays(extendingTrialSub, 30, false);
                      setExtendingTrialSub(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7928CA] font-extrabold text-xs border border-purple-200 transition-all flex flex-col items-center gap-0.5 active:scale-95"
                  >
                    <span>+30 Días</span>
                    <span className="text-[10px] font-normal text-purple-600">1 mes extra</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700">O ingresar cantidad personalizada de días:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={customExtendDays}
                    onChange={(e) => setCustomExtendDays(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendTrialDays(extendingTrialSub, customExtendDays, false);
                      setExtendingTrialSub(null);
                    }}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Aplicar +{customExtendDays} Días
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExtendingTrialSub(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW MERCADO PAGO RECEIPT */}
      {viewingReceiptSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="bg-[#009EE3] text-white p-4 -m-6 mb-4 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">MP</span>
                <div>
                  <h4 className="font-bold text-sm">Detalle de Cobro Mercado Pago</h4>
                  <p className="text-[11px] text-sky-100 font-mono">{viewingReceiptSub.mercadopagoPaymentId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceiptSub(null)}
                className="text-white hover:bg-white/20 p-1 rounded-full"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cliente:</span>
                <strong className="text-slate-900">{viewingReceiptSub.userName} ({viewingReceiptSub.userEmail})</strong>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Plan:</span>
                <strong className="text-slate-900">{viewingReceiptSub.planName}</strong>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Monto Acreditado:</span>
                <strong className="text-slate-900 text-sm font-bold text-[#009EE3]">
                  {formatCurrency(viewingReceiptSub.pricePaid, 'ARS')}
                </strong>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Fecha de Cobro:</span>
                <span className="text-slate-900">{formatDateEs(viewingReceiptSub.lastPaymentDate)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Próximo Vencimiento:</span>
                <span className="text-slate-900 font-semibold">{formatDateEs(viewingReceiptSub.nextRenewalDate)}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Estado de Acreditación:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado & Acreditado
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingReceiptSub(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
