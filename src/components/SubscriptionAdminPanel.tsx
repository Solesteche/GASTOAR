import React, { useState, useMemo, useEffect } from 'react';
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
  ArrowUpRight,
  Lock,
  KeyRound,
  AlertCircle,
  X,
  Smartphone,
  QrCode,
  Copy,
  UserPlus,
  Phone,
  Shield,
  Key,
  Layers,
  Heart
} from 'lucide-react';
import QRCode from 'qrcode';
import { BillingCycle, SubscriptionPlan, SubscriptionPlanId, SubscriptionStatus, UserSubscription } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { formatCurrency, formatDateEs } from '../utils/formatters';

export interface AdminAccountItem {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  fullName: string;
  phone?: string;
  password?: string;
  accountType: 'pareja' | 'individual';
  partnerName?: string;
  accountCode: string;
  currency: string;
  selectedPlanId: SubscriptionPlanId;
  createdAt: number;
  updatedAt: number;
  transactionCount: number;
  hasTransactions: boolean;
  status: string;
  remainingTrialDays: number;
  subscription?: UserSubscription;
}

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

  // Dual View Mode: 'accounts' (Cuentas Creadas) vs 'subscriptions' (Suscripciones & Cobros MP)
  const [adminView, setAdminView] = useState<'accounts' | 'subscriptions'>('accounts');
  const [accountsList, setAccountsList] = useState<AdminAccountItem[]>([]);
  const [serverSubscriptions, setServerSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [accountPlanFilter, setAccountPlanFilter] = useState<string>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('all');
  const [copiedEmail, setCopiedEmail] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string>('');

  // Modals for Accounts Management
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState<boolean>(false);
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccLastName, setNewAccLastName] = useState<string>('');
  const [newAccEmail, setNewAccEmail] = useState<string>('');
  const [newAccPhone, setNewAccPhone] = useState<string>('');
  const [newAccPassword, setNewAccPassword] = useState<string>('password123');
  const [newAccType, setNewAccType] = useState<'individual' | 'pareja'>('individual');
  const [newAccPartnerName, setNewAccPartnerName] = useState<string>('');
  const [newAccPlanId, setNewAccPlanId] = useState<SubscriptionPlanId>('individual');
  const [newAccTrialDays, setNewAccTrialDays] = useState<number>(15);
  const [newAccStatus, setNewAccStatus] = useState<SubscriptionStatus>('trial');
  const [newAccNotes, setNewAccNotes] = useState<string>('');

  const [editingAccount, setEditingAccount] = useState<AdminAccountItem | null>(null);
  const [editAccName, setEditAccName] = useState<string>('');
  const [editAccLastName, setEditAccLastName] = useState<string>('');
  const [editAccPhone, setEditAccPhone] = useState<string>('');
  const [editAccPassword, setEditAccPassword] = useState<string>('');
  const [editAccType, setEditAccType] = useState<'individual' | 'pareja'>('individual');
  const [editAccPartnerName, setEditAccPartnerName] = useState<string>('');
  const [editAccPlanId, setEditAccPlanId] = useState<SubscriptionPlanId>('individual');
  const [editAccStatus, setEditAccStatus] = useState<SubscriptionStatus>('trial');
  const [editAccRenewalDate, setEditAccRenewalDate] = useState<string>('');
  const [editAccNotes, setEditAccNotes] = useState<string>('');
  
  // Dedicated Modals for Extending Trial & Deleting Account
  const [extendingAccount, setExtendingAccount] = useState<AdminAccountItem | null>(null);
  const [extendingDaysInput, setExtendingDaysInput] = useState<number>(15);
  const [extendingDateInput, setExtendingDateInput] = useState<string>('');
  const [extendingAsActive, setExtendingAsActive] = useState<boolean>(false);
  const [extendingNotesInput, setExtendingNotesInput] = useState<string>('');
  const [extendingIsSubmitting, setExtendingIsSubmitting] = useState<boolean>(false);

  const [deletingAccount, setDeletingAccount] = useState<AdminAccountItem | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState<boolean>(false);

  // Security PIN & Google Authenticator Modal State
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [securityMode, setSecurityMode] = useState<'overview' | 'pin' | 'totp'>('overview');
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean>(true);
  const [hasTotpConfigured, setHasTotpConfigured] = useState<boolean>(true);
  const [securityNewPin, setSecurityNewPin] = useState<string>('');
  const [securityConfirmPin, setSecurityConfirmPin] = useState<string>('');
  const [securityTotpSecret, setSecurityTotpSecret] = useState<string>('');
  const [securityTotpQrCode, setSecurityTotpQrCode] = useState<string>('');
  const [securityTotpVerifyCode, setSecurityTotpVerifyCode] = useState<string>('');
  const [copiedTotpSecret, setCopiedTotpSecret] = useState<boolean>(false);
  const [securityMsg, setSecurityMsg] = useState<string>('');
  const [securityError, setSecurityError] = useState<string>('');
  const [securityLoading, setSecurityLoading] = useState<boolean>(false);

  // Fetch registered accounts & subscriptions from backend server
  const fetchAccounts = async (showNotice = false) => {
    setIsLoadingAccounts(true);
    try {
      // 1. Sync any local accounts from localStorage so they are guaranteed in server DB
      try {
        const knownAccountsStr = localStorage.getItem('control_gastos_known_accounts_v1');
        const currentAccStr = localStorage.getItem('control_gastos_account_v1');
        const localAccs: any[] = [];
        if (knownAccountsStr) {
          const parsed = JSON.parse(knownAccountsStr);
          Object.values(parsed).forEach((acc: any) => localAccs.push(acc));
        }
        if (currentAccStr) {
          const parsedCurrent = JSON.parse(currentAccStr);
          if (parsedCurrent && parsedCurrent.email) {
            localAccs.push(parsedCurrent);
          }
        }
        if (localAccs.length > 0) {
          await fetch('/api/admin/accounts/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accounts: localAccs }),
          });
        }
      } catch {}

      // 2. Fetch full list of accounts
      const res = await fetch('/api/admin/accounts');
      const data = await res.json();
      if (res.ok && data.success) {
        setAccountsList(data.users || []);
        if (Array.isArray(data.subscriptions) && data.subscriptions.length > 0) {
          setServerSubscriptions(data.subscriptions);
        }
        if (showNotice) {
          setActionNotice(`¡Base de datos actualizada! ${data.users?.length || 0} cuentas detectadas.`);
          setTimeout(() => setActionNotice(''), 3000);
        }
      }
    } catch (err) {
      console.error('Error fetching admin accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    try {
      const res = await fetch('/api/auth/admin-status');
      const data = await res.json();
      if (data.success) {
        setHasPinConfigured(Boolean(data.hasPinConfigured));
        setHasTotpConfigured(Boolean(data.hasTotpConfigured));
      }
    } catch {}
  };

  const loadTotpSetupData = async () => {
    setSecurityLoading(true);
    setSecurityError('');

    // 1. Try server first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/auth/setup-admin-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@gastoar.app' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.success && data.secret && data.qrCode) {
        setSecurityTotpSecret(data.secret);
        setSecurityTotpQrCode(data.qrCode);
        setSecurityLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Servidor no disponible para QR, generando de forma local:', err);
    }

    // 2. High-reliability local fallback
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const array = new Uint8Array(32);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
      }
      const secret = Array.from(array, byte => chars[byte % chars.length]).join('');
      const otpauth = `otpauth://totp/GastoAR:admin%40gastoar.app?secret=${secret}&issuer=GastoAR`;
      const qrDataUrl = await QRCode.toDataURL(otpauth, {
        margin: 1,
        width: 260,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      });
      setSecurityTotpSecret(secret);
      setSecurityTotpQrCode(qrDataUrl);
      setSecurityError('');
    } catch {
      setSecurityError('No se pudo generar el código QR. Hacé clic en reintentar.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleUpdateAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecurityMsg('');

    if (!securityNewPin.trim() || securityNewPin.trim().length < 4) {
      setSecurityError('El PIN debe tener al menos 4 caracteres.');
      return;
    }
    if (securityNewPin !== securityConfirmPin) {
      setSecurityError('Los PINs no coinciden.');
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await fetch('/api/auth/set-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPin: securityNewPin.trim(),
          forceReset: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecurityMsg('¡PIN de administrador actualizado correctamente!');
        setHasPinConfigured(true);
        setSecurityNewPin('');
        setSecurityConfirmPin('');
        setTimeout(() => {
          setSecurityMode('overview');
          setSecurityMsg('');
        }, 1200);
      } else {
        setSecurityError(data.error || 'No se pudo guardar la clave.');
      }
    } catch {
      setSecurityError('Error al comunicar con el servidor.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecurityMsg('');

    const cleanCode = securityTotpVerifyCode.replace(/\s+/g, '').trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setSecurityError('Ingresá el código de 6 dígitos que muestra tu app.');
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await fetch('/api/auth/verify-and-activate-admin-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: securityTotpSecret,
          token: cleanCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecurityMsg('¡Google Authenticator vinculado y activado con éxito!');
        setHasTotpConfigured(true);
        setSecurityTotpVerifyCode('');
        setTimeout(() => {
          setSecurityMode('overview');
          setSecurityMsg('');
        }, 1200);
      } else {
        setSecurityError(data.error || 'Código incorrecto o expirado.');
      }
    } catch {
      setSecurityError('Error al verificar el código con el servidor.');
    } finally {
      setSecurityLoading(false);
    }
  };

  // Modals inside Admin
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<UserSubscription | null>(null);
  const [viewingReceiptSub, setViewingReceiptSub] = useState<UserSubscription | null>(null);
  const [extendingTrialSub, setExtendingTrialSub] = useState<UserSubscription | null>(null);
  const [customExtendDays, setCustomExtendDays] = useState<number>(15);

  // New Subscription Form State
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formAccountCode, setFormAccountCode] = useState<string>(() => 'COMPARTIDA-' + Math.floor(1000 + Math.random() * 9000));
  const [formPlanId, setFormPlanId] = useState<SubscriptionPlanId>('pareja');
  const [formCycle, setFormCycle] = useState<BillingCycle>('monthly');
  const [formStatus, setFormStatus] = useState<SubscriptionStatus>('trial');
  const [formTrialDays, setFormTrialDays] = useState<number>(15);
  const [formNotes, setFormNotes] = useState<string>('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Effective list of subscriptions (prioritizing server-synced data)
  const effectiveSubscriptions = useMemo(() => {
    if (serverSubscriptions.length > 0) return serverSubscriptions;
    if (subscriptions.length > 0) return subscriptions;
    return accountsList.map(a => a.subscription).filter(Boolean) as UserSubscription[];
  }, [serverSubscriptions, subscriptions, accountsList]);

  // Calculations for Subscription KPI Cards
  const stats = useMemo(() => {
    const totalSubs = effectiveSubscriptions.length;
    const activeSubs = effectiveSubscriptions.filter(s => s.status === 'active').length;
    
    // Trial stats
    const trialSubs = effectiveSubscriptions.filter(s => {
      if (s.status !== 'trial') return false;
      const renewal = s.nextRenewalDate || s.trialEndsDate || '';
      return renewal >= todayStr;
    }).length;

    const trialExpiredSubs = effectiveSubscriptions.filter(s => {
      if (s.status === 'trial') {
        const renewal = s.nextRenewalDate || s.trialEndsDate || '';
        return renewal < todayStr;
      }
      return s.status === 'past_due' || s.status === 'canceled';
    }).length;

    const pendingSubs = effectiveSubscriptions.filter(s => s.status === 'pending_payment').length;
    const pastDueSubs = effectiveSubscriptions.filter(s => s.status === 'past_due' || s.status === 'canceled').length;

    // Monthly Recurring Revenue (MRR)
    const mrr = effectiveSubscriptions.reduce((acc, sub) => {
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
    const totalVolume = effectiveSubscriptions.reduce((acc, sub) => acc + sub.pricePaid, 0);

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
  }, [effectiveSubscriptions, todayStr]);

  // Calculations for Account KPI Cards
  const accountStats = useMemo(() => {
    const total = accountsList.length;
    const individual = accountsList.filter(a => a.accountType === 'individual').length;
    const couple = accountsList.filter(a => a.accountType === 'pareja').length;
    const trialActive = accountsList.filter(a => (a.status === 'trial' || a.subscription?.status === 'trial') && (a.remainingTrialDays > 0)).length;
    const trialExpired = accountsList.filter(a => a.status === 'trial_expired' || (a.status === 'trial' && a.remainingTrialDays === 0)).length;
    const active = accountsList.filter(a => a.status === 'active' || a.subscription?.status === 'active').length;
    const withTx = accountsList.filter(a => a.hasTransactions).length;
    return { total, individual, couple, trialActive, trialExpired, active, withTx };
  }, [accountsList]);

  // Filtered Accounts List
  const filteredAccounts = useMemo(() => {
    return accountsList.filter(acc => {
      if (!acc) return false;
      const q = accountSearch.toLowerCase().trim();
      const displayName = (acc.fullName || `${acc.name || ''} ${acc.lastName || ''}`.trim() || acc.email || '').toLowerCase();
      const emailLower = (acc.email || '').toLowerCase();
      const codeLower = (acc.accountCode || '').toLowerCase();
      const partnerLower = (acc.partnerName || '').toLowerCase();
      const phoneStr = acc.phone || '';

      const matchesSearch =
        !q ||
        displayName.includes(q) ||
        emailLower.includes(q) ||
        codeLower.includes(q) ||
        partnerLower.includes(q) ||
        phoneStr.includes(q);

      const matchesType =
        accountTypeFilter === 'all' || acc.accountType === accountTypeFilter;

      const matchesPlan =
        accountPlanFilter === 'all' || acc.selectedPlanId === accountPlanFilter || acc.subscription?.planId === accountPlanFilter;

      let matchesStatus = true;
      if (accountStatusFilter === 'all') {
        matchesStatus = true;
      } else if (accountStatusFilter === 'trial_active') {
        matchesStatus = (acc.status === 'trial' || acc.subscription?.status === 'trial') && (acc.remainingTrialDays ?? 0) > 0;
      } else if (accountStatusFilter === 'trial_expired') {
        matchesStatus = acc.status === 'trial_expired' || ((acc.status === 'trial' || acc.subscription?.status === 'trial') && (acc.remainingTrialDays ?? 0) === 0);
      } else if (accountStatusFilter === 'active') {
        matchesStatus = acc.status === 'active' || acc.subscription?.status === 'active';
      }

      return matchesSearch && matchesType && matchesPlan && matchesStatus;
    });
  }, [accountsList, accountSearch, accountTypeFilter, accountPlanFilter, accountStatusFilter]);

  // Filtered Subscriptions List
  const filteredSubscriptions = useMemo(() => {
    return effectiveSubscriptions.filter(sub => {
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
  }, [effectiveSubscriptions, searchTerm, statusFilter, planFilter, cycleFilter, todayStr]);

  // Account Operations Handlers
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccEmail.trim()) return;

    try {
      const res = await fetch('/api/admin/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccName.trim(),
          lastName: newAccLastName.trim() || undefined,
          email: newAccEmail.trim().toLowerCase(),
          phone: newAccPhone.trim() || undefined,
          password: newAccPassword.trim() || 'password123',
          accountType: newAccType,
          partnerName: newAccType === 'pareja' ? newAccPartnerName.trim() : undefined,
          selectedPlanId: newAccPlanId,
          trialDays: Number(newAccTrialDays) || 15,
          status: newAccStatus,
          notes: newAccNotes.trim() || 'Cuenta creada desde Panel Administrativo',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateAccountModalOpen(false);
        setNewAccName('');
        setNewAccLastName('');
        setNewAccEmail('');
        setNewAccPhone('');
        setNewAccPartnerName('');
        setNewAccNotes('');
        setActionNotice(`¡Cuenta ${newAccEmail} registrada correctamente con 15 días de prueba!`);
        setTimeout(() => setActionNotice(''), 3500);
        await fetchAccounts();
      } else {
        alert(data.error || 'No se pudo crear la cuenta.');
      }
    } catch {
      alert('Error de conexión al crear la cuenta.');
    }
  };

  const handleOpenEditAccount = (acc: AdminAccountItem) => {
    setEditingAccount(acc);
    setEditAccName(acc.name);
    setEditAccLastName(acc.lastName || '');
    setEditAccPhone(acc.phone || '');
    setEditAccPassword(acc.password || '');
    setEditAccType(acc.accountType);
    setEditAccPartnerName(acc.partnerName || '');
    setEditAccPlanId(acc.selectedPlanId);
    setEditAccStatus(acc.subscription?.status || (acc.status === 'trial_expired' ? 'trial' : acc.status) as any);
    setEditAccRenewalDate(acc.subscription?.nextRenewalDate || acc.subscription?.trialEndsDate || '');
    setEditAccNotes(acc.subscription?.notes || '');
  };

  const handleUpdateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      const res = await fetch('/api/admin/accounts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingAccount.email,
          updates: {
            name: editAccName.trim(),
            lastName: editAccLastName.trim(),
            phone: editAccPhone.trim(),
            password: editAccPassword.trim() || undefined,
            accountType: editAccType,
            partnerName: editAccType === 'pareja' ? editAccPartnerName.trim() : '',
            selectedPlanId: editAccPlanId,
            status: editAccStatus,
            nextRenewalDate: editAccRenewalDate || undefined,
            trialEndsDate: editAccRenewalDate || undefined,
            notes: editAccNotes.trim(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingAccount(null);
        setActionNotice(`¡Cuenta ${editingAccount.email} actualizada con éxito!`);
        setTimeout(() => setActionNotice(''), 3500);
        await fetchAccounts();
      } else {
        alert(data.error || 'No se pudo guardar la modificación.');
      }
    } catch {
      alert('Error al comunicar los cambios al servidor.');
    }
  };

  const handleOpenExtendAccount = (acc: AdminAccountItem) => {
    setExtendingAccount(acc);
    setExtendingDaysInput(15);
    setExtendingAsActive(false);
    setExtendingNotesInput('');
    const baseDate = new Date();
    const currentRenewal = acc.subscription?.nextRenewalDate || acc.subscription?.trialEndsDate;
    if (currentRenewal) {
      const candidate = new Date(currentRenewal);
      if (candidate > baseDate) {
        baseDate.setTime(candidate.getTime());
      }
    }
    baseDate.setDate(baseDate.getDate() + 15);
    setExtendingDateInput(baseDate.toISOString().split('T')[0]);
  };

  const handleApplyAccountExtension = async (days?: number) => {
    if (!extendingAccount) return;
    setExtendingIsSubmitting(true);
    try {
      const finalDays = days !== undefined ? days : (Number(extendingDaysInput) || 15);
      const res = await fetch('/api/admin/accounts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: extendingAccount.email,
          updates: {
            extendDays: finalDays,
            asActiveStatus: extendingAsActive,
            notes: extendingNotesInput.trim() || undefined,
            ...(extendingDateInput && days === undefined ? { nextRenewalDate: extendingDateInput, trialEndsDate: extendingDateInput } : {})
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice(`¡Prórroga de prueba aplicada para ${extendingAccount.fullName || extendingAccount.email}!`);
        setTimeout(() => setActionNotice(''), 3500);
        setExtendingAccount(null);
        await fetchAccounts();
      } else {
        alert(data.error || 'No se pudo aplicar la prórroga.');
      }
    } catch {
      alert('Error de conexión al comunicar la prórroga al servidor.');
    } finally {
      setExtendingIsSubmitting(false);
    }
  };

  const handleExtendAccountTrialDays = async (acc: AdminAccountItem, days: number, asActive = false) => {
    try {
      const res = await fetch('/api/admin/accounts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: acc.email,
          updates: {
            extendDays: days,
            asActiveStatus: asActive,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice(`¡Prórroga de +${days} días otorgada a ${acc.email}!`);
        setTimeout(() => setActionNotice(''), 3500);
        await fetchAccounts();
      }
    } catch {}
  };

  const handleActivateAccountDirect = async (acc: AdminAccountItem) => {
    try {
      const res = await fetch('/api/admin/accounts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: acc.email,
          updates: {
            status: 'active',
            notes: 'Activada directamente por el Administrador.',
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice(`¡Cuenta ${acc.email} activada como suscripción activa!`);
        setTimeout(() => setActionNotice(''), 3500);
        await fetchAccounts();
      }
    } catch {}
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deletingAccount) return;
    setIsDeletingLoading(true);
    try {
      const res = await fetch('/api/admin/accounts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deletingAccount.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice(`Cuenta ${deletingAccount.email} eliminada del sistema.`);
        setTimeout(() => setActionNotice(''), 3500);
        try {
          const knownStr = localStorage.getItem('control_gastos_known_accounts_v1');
          if (knownStr) {
            const known = JSON.parse(knownStr);
            delete known[deletingAccount.email.toLowerCase()];
            localStorage.setItem('control_gastos_known_accounts_v1', JSON.stringify(known));
          }
        } catch {}
        setDeletingAccount(null);
        if (editingAccount?.email === deletingAccount.email) {
          setEditingAccount(null);
        }
        await fetchAccounts();
      } else {
        alert(data.error || 'No se pudo eliminar la cuenta.');
      }
    } catch {
      alert('Error de conexión al eliminar la cuenta.');
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const handleDeleteAccountDirect = async (acc: AdminAccountItem) => {
    setDeletingAccount(acc);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(''), 2000);
  };

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
    if (adminView === 'accounts') {
      const headers = ['ID', 'Nombre', 'Email', 'Telefono', 'Codigo Cuenta', 'Modalidad', 'Pareja', 'Plan', 'Estado', 'Dias Prueba Restantes', 'Fecha Registro', 'Movimientos'];
      const rows = filteredAccounts.map(a => [
        a.id,
        `"${a.fullName || a.name || a.email}"`,
        a.email,
        a.phone || '',
        a.accountCode,
        a.accountType === 'pareja' ? 'Parejas Duo' : 'Individual',
        `"${a.partnerName || ''}"`,
        `"${a.selectedPlanId}"`,
        a.status,
        a.remainingTrialDays,
        new Date(a.createdAt).toISOString().split('T')[0],
        a.transactionCount,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `cuentas_gastoar_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

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
            <div className="p-2.5 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Panel de Control de Cuentas & Suscripciones
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Administración de cuentas registradas en GastoAR, asignación de planes y períodos de prueba.
              </p>
            </div>
          </div>

          {/* Navigation View Switcher (Tabs) */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => setAdminView('accounts')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                adminView === 'accounts'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/25 ring-2 ring-purple-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Cuentas Creadas ({accountsList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminView('subscriptions')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                adminView === 'subscriptions'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/25 ring-2 ring-purple-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Suscripciones & Cobros MP ({effectiveSubscriptions.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Reload / Sync Button */}
          <button
            type="button"
            onClick={() => fetchAccounts(true)}
            disabled={isLoadingAccounts}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Recargar cuentas desde la base de datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAccounts ? 'animate-spin text-purple-600' : ''}`} />
            <span>{isLoadingAccounts ? 'Actualizando...' : 'Actualizar Cuentas'}</span>
          </button>

          {/* Security & 2FA Modal */}
          <button
            type="button"
            onClick={() => {
              setIsSecurityModalOpen(true);
              setSecurityMode('overview');
              setSecurityError('');
              setSecurityMsg('');
              setSecurityNewPin('');
              setSecurityConfirmPin('');
              setSecurityTotpVerifyCode('');
              loadSecurityStatus();
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Seguridad de acceso: PIN + Google Authenticator (2FA)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Seguridad & 2FA</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={exportSubsToCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          {/* Primary Action Button */}
          {adminView === 'accounts' ? (
            <button
              type="button"
              onClick={() => setIsCreateAccountModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md shadow-purple-700/30 transition-all flex items-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Nueva Cuenta</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#009EE3] hover:bg-[#0089C7] text-white font-extrabold text-xs shadow-md shadow-[#009EE3]/30 transition-all flex items-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nueva Suscripción</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice('')}
            className="text-emerald-600 hover:text-emerald-900 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 1: CUENTAS CREADAS & USUARIOS REGISTRADOS */}
      {/* ======================================================== */}
      {adminView === 'accounts' && (
        <div className="space-y-6">
          
          {/* KPI METRICS CARDS: CUENTAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Cuentas */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cuentas Creadas</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {accountStats.total} <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Registradas</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Base de datos persistente en servidor
              </div>
            </div>

            {/* Card 2: Cuentas Pareja vs Individual */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tipo de Cuenta</span>
                <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>{accountStats.couple}</span>
                <span className="text-xs font-semibold text-slate-400">Parejas Dúo • {accountStats.individual} Indiv.</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {accountStats.couple > 0 ? `${Math.round((accountStats.couple / (accountStats.total || 1)) * 100)}% usan finanzas compartidas` : 'Modalidad de uso'}
              </div>
            </div>

            {/* Card 3: Cuentas en Prueba Vigente */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Prueba Gratuita (15 días)</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-600">
                {accountStats.trialActive} <span className="text-xs font-bold text-slate-400">vigentes</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {accountStats.trialExpired} con prueba finalizada
              </div>
            </div>

            {/* Card 4: Cuentas Activas / Confirmadas */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Suscripciones Activas</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {accountStats.active} <span className="text-xs font-bold text-slate-400">confirmadas</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {accountStats.withTx} cuentas con movimientos cargados
              </div>
            </div>

          </div>

          {/* SEARCH & FILTERS BAR FOR ACCOUNTS */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Buscar cuenta por nombre, apellido, email, código de cuenta o teléfono..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Quick Selectors */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Type Selector */}
                <select
                  value={accountTypeFilter}
                  onChange={(e) => setAccountTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todas las modalidades</option>
                  <option value="individual">Solo Individual</option>
                  <option value="pareja">Solo Parejas Dúo</option>
                </select>

                {/* Plan Selector */}
                <select
                  value={accountPlanFilter}
                  onChange={(e) => setAccountPlanFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos los planes</option>
                  <option value="individual">Plan Individual</option>
                  <option value="pareja">Plan Parejas Dúo</option>
                  <option value="pro_ai">Plan Pro & IA</option>
                </select>

                {/* Status Selector */}
                <select
                  value={accountStatusFilter}
                  onChange={(e) => setAccountStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="trial_active">✨ Prueba Activa (Vigente)</option>
                  <option value="trial_expired">⛔ Prueba Vencida (Bloqueada)</option>
                  <option value="active">✅ Activas (Confirmadas)</option>
                </select>
              </div>

            </div>
          </div>

          {/* CREATED ACCOUNTS TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Usuario / Titular</th>
                    <th className="py-3.5 px-4">Código & Modalidad</th>
                    <th className="py-3.5 px-4">Plan Asignado</th>
                    <th className="py-3.5 px-4">Estado & Prueba</th>
                    <th className="py-3.5 px-4">Fecha de Registro</th>
                    <th className="py-3.5 px-4">Movimientos</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-sm">No se encontraron cuentas creadas con esos filtros.</p>
                        <p className="text-xs text-slate-400 mt-1">Podés hacer clic en "Nueva Cuenta" para registrar una cuenta ahora mismo.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => {
                      const isExpired = acc.status === 'trial_expired' || (acc.status === 'trial' && (acc.remainingTrialDays ?? 0) === 0);
                      const isTrial = acc.status === 'trial' || acc.subscription?.status === 'trial';
                      const isActive = acc.status === 'active' || acc.subscription?.status === 'active';
                      const displayName = acc.fullName || `${acc.name || ''} ${acc.lastName || ''}`.trim() || acc.email || 'Usuario';
                      const initialChar = (displayName.charAt(0) || 'U').toUpperCase();

                      return (
                        <tr key={acc.id || acc.email} className="hover:bg-slate-50/70 transition-colors">
                          
                          {/* Usuario Titular */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-purple-700 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                                {initialChar}
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                  <span>{displayName}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                  <span className="font-mono text-slate-600">{acc.email}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyEmail(acc.email)}
                                    title="Copiar correo"
                                    className="text-slate-400 hover:text-purple-700 transition-colors cursor-pointer"
                                  >
                                    {copiedEmail === acc.email ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  {acc.phone && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                        <Phone className="w-2.5 h-2.5" />
                                        <span>{acc.phone}</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Código & Modalidad */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="font-mono text-[11px] text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-lg font-bold">
                                {acc.accountCode}
                              </span>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                {acc.accountType === 'pareja' ? (
                                  <span className="text-pink-700 font-medium flex items-center gap-0.5">
                                    <Heart className="w-3 h-3 text-pink-500" />
                                    <span>Pareja Dúo {acc.partnerName ? `(${acc.partnerName})` : ''}</span>
                                  </span>
                                ) : (
                                  <span className="text-sky-700 font-medium flex items-center gap-0.5">
                                    <UserCheck className="w-3 h-3 text-sky-500" />
                                    <span>Individual</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="py-3.5 px-4">
                            {getPlanBadge(acc.selectedPlanId)}
                          </td>

                          {/* Estado & Días de Prueba */}
                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Activa</span>
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <Lock className="w-3.5 h-3.5 text-rose-600" />
                                <span>Prueba Vencida (Bloqueada)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                <span>Prueba: {acc.remainingTrialDays} {acc.remainingTrialDays === 1 ? 'día' : 'días'}</span>
                              </span>
                            )}
                          </td>

                          {/* Fecha Registro */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              {new Date(acc.createdAt).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(acc.createdAt).toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })} hs
                            </div>
                          </td>

                          {/* Movimientos */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                              acc.transactionCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {acc.transactionCount} {acc.transactionCount === 1 ? 'gasto' : 'gastos'}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              
                              {/* Modal Extender Prueba */}
                              <button
                                type="button"
                                onClick={() => handleOpenExtendAccount(acc)}
                                title="Extender período de prueba con opciones avanzadas"
                                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition-colors border border-purple-200 flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                <span>Extender Prueba</span>
                              </button>

                              {/* Quick Extend +15d */}
                              <button
                                type="button"
                                onClick={() => handleExtendAccountTrialDays(acc, 15, false)}
                                title="Extender +15 días directos con un clic"
                                className="px-2 py-1.5 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-bold rounded-xl text-xs transition-colors border border-slate-200 cursor-pointer active:scale-95"
                              >
                                +15d
                              </button>

                              {/* Activate Plan */}
                              {!isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleActivateAccountDirect(acc)}
                                  title="Activar cuenta"
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors border border-emerald-200 flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Activar</span>
                                </button>
                              )}

                              {/* Edit Modal */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditAccount(acc)}
                                title="Editar cuenta, clave y datos"
                                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Account */}
                              <button
                                type="button"
                                onClick={() => handleDeleteAccountDirect(acc)}
                                title="Eliminar cuenta y datos del sistema"
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition-colors border border-rose-200 flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Eliminar</span>
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

        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: SUSCRIPCIONES & COBROS (MERCADO PAGO) */}
      {/* ======================================================== */}
      {adminView === 'subscriptions' && (
        <div className="space-y-6">

          {/* KPI METRIC CARDS: SUSCRIPCIONES */}
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
                      const isPastDue = new Date(sub.nextRenewalDate || '') < new Date() && sub.status !== 'canceled';
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
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-[#009EE3] hover:underline font-bold cursor-pointer"
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

        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREAR NUEVA CUENTA DE USUARIO */}
      {/* ======================================================== */}
      {isCreateAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Registrar Nueva Cuenta de Usuario
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    La cuenta se creará en la base de datos con 15 días de prueba gratis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="ej. Juan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Apellido</label>
                  <input
                    type="text"
                    value={newAccLastName}
                    onChange={(e) => setNewAccLastName(e.target.value)}
                    placeholder="ej. Pérez"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={newAccEmail}
                    onChange={(e) => setNewAccEmail(e.target.value)}
                    placeholder="juanperez@ejemplo.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    value={newAccPhone}
                    onChange={(e) => setNewAccPhone(e.target.value)}
                    placeholder="+54 9 11 ..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Contraseña Inicial</label>
                <input
                  type="text"
                  required
                  value={newAccPassword}
                  onChange={(e) => setNewAccPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Modalidad</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as 'individual' | 'pareja')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="individual">Individual</option>
                    <option value="pareja">Parejas Dúo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Plan</label>
                  <select
                    value={newAccPlanId}
                    onChange={(e) => setNewAccPlanId(e.target.value as SubscriptionPlanId)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="individual">Plan Individual</option>
                    <option value="pareja">Plan Parejas Dúo</option>
                    <option value="pro_ai">Plan Pro & IA</option>
                  </select>
                </div>
              </div>

              {newAccType === 'pareja' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nombre de la Pareja</label>
                  <input
                    type="text"
                    value={newAccPartnerName}
                    onChange={(e) => setNewAccPartnerName(e.target.value)}
                    placeholder="ej. María"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Días de Prueba Gratis</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={newAccTrialDays}
                    onChange={(e) => setNewAccTrialDays(parseInt(e.target.value) || 15)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Estado Inicial</label>
                  <select
                    value={newAccStatus}
                    onChange={(e) => setNewAccStatus(e.target.value as SubscriptionStatus)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="trial">Prueba Gratuita</option>
                    <option value="active">Activa (Confirmada)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Observaciones</label>
                <textarea
                  rows={2}
                  value={newAccNotes}
                  onChange={(e) => setNewAccNotes(e.target.value)}
                  placeholder="Notas internas del cliente..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-700/30 cursor-pointer"
                >
                  Crear Cuenta en Base de Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR CUENTA DE USUARIO & PLAN */}
      {/* ======================================================== */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Modificar Cuenta: {editingAccount.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {editingAccount.email} • {editingAccount.accountCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateAccountSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nombre</label>
                  <input
                    type="text"
                    required
                    value={editAccName}
                    onChange={(e) => setEditAccName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Apellido</label>
                  <input
                    type="text"
                    value={editAccLastName}
                    onChange={(e) => setEditAccLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Teléfono</label>
                  <input
                    type="tel"
                    value={editAccPhone}
                    onChange={(e) => setEditAccPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Contraseña (ver / cambiar)</label>
                  <input
                    type="text"
                    value={editAccPassword}
                    onChange={(e) => setEditAccPassword(e.target.value)}
                    placeholder="Contraseña del usuario"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Modalidad</label>
                  <select
                    value={editAccType}
                    onChange={(e) => setEditAccType(e.target.value as 'individual' | 'pareja')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="individual">Individual</option>
                    <option value="pareja">Parejas Dúo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Plan Asignado</label>
                  <select
                    value={editAccPlanId}
                    onChange={(e) => setEditAccPlanId(e.target.value as SubscriptionPlanId)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="individual">Plan Individual</option>
                    <option value="pareja">Plan Parejas Dúo</option>
                    <option value="pro_ai">Plan Pro & IA</option>
                  </select>
                </div>
              </div>

              {editAccType === 'pareja' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nombre de la Pareja</label>
                  <input
                    type="text"
                    value={editAccPartnerName}
                    onChange={(e) => setEditAccPartnerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Estado de Cuenta</label>
                  <select
                    value={editAccStatus}
                    onChange={(e) => setEditAccStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="trial">En Prueba Gratuita</option>
                    <option value="active">Activa</option>
                    <option value="pending_payment">Pendiente de Pago</option>
                    <option value="past_due">Vencida</option>
                    <option value="canceled">Cancelada</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Fecha de Renovación / Fin de Prueba</label>
                  <input
                    type="date"
                    value={editAccRenewalDate}
                    onChange={(e) => setEditAccRenewalDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Quick Trial Extender inside Edit Modal */}
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                    Prórroga Rápida de Días
                  </span>
                  <span className="text-[10px] text-purple-600">Suma días a la fecha</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(editAccRenewalDate || new Date());
                      d.setDate(d.getDate() + 7);
                      setEditAccRenewalDate(d.toISOString().split('T')[0]);
                    }}
                    className="py-1 px-2 rounded-lg bg-white hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition-colors cursor-pointer"
                  >
                    +7 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(editAccRenewalDate || new Date());
                      d.setDate(d.getDate() + 15);
                      setEditAccRenewalDate(d.toISOString().split('T')[0]);
                    }}
                    className="py-1 px-2 rounded-lg bg-white hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition-colors cursor-pointer"
                  >
                    +15 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(editAccRenewalDate || new Date());
                      d.setDate(d.getDate() + 30);
                      setEditAccRenewalDate(d.toISOString().split('T')[0]);
                    }}
                    className="py-1 px-2 rounded-lg bg-white hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition-colors cursor-pointer"
                  >
                    +30 Días
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Notas u Observaciones</label>
                <textarea
                  rows={2}
                  value={editAccNotes}
                  onChange={(e) => setEditAccNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="pt-3 border-t border-rose-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-700">Zona de Peligro</div>
                  <div className="text-[10px] text-slate-400">Eliminar permanentemente esta cuenta y todos sus registros</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const accToDelete = editingAccount;
                    setDeletingAccount(accToDelete);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Cuenta</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-700/30 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EXTENDER PERÍODO DE PRUEBA (CUENTA DE USUARIO) */}
      {/* ======================================================== */}
      {extendingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shadow-2xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Extender Período de Prueba
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {extendingAccount.fullName || extendingAccount.name} • {extendingAccount.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExtendingAccount(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Current State Info Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Estado actual:</span>
                <span className="font-bold text-slate-800">
                  {extendingAccount.status === 'active' ? '✅ Suscripción Activa' : (extendingAccount.remainingTrialDays > 0 ? `✨ Prueba: ${extendingAccount.remainingTrialDays} días restantes` : '⛔ Prueba Vencida')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Vencimiento registrado:</span>
                <span className="font-bold font-mono text-purple-700">
                  {formatDateEs(extendingAccount.subscription?.nextRenewalDate || extendingAccount.subscription?.trialEndsDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Plan asignado:</span>
                <span className="font-bold text-slate-700">
                  {getPlanBadge(extendingAccount.selectedPlanId)}
                </span>
              </div>
            </div>

            {/* Preset Extension Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Seleccioná una prórroga rápida:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyAccountExtension(7)}
                  disabled={extendingIsSubmitting}
                  className="py-2.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs border border-purple-200 transition-all flex flex-col items-center gap-0.5 active:scale-95 cursor-pointer"
                >
                  <span>+7 Días</span>
                  <span className="text-[10px] font-normal text-purple-600">1 semana</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAccountExtension(15)}
                  disabled={extendingIsSubmitting}
                  className="py-2.5 px-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md shadow-purple-700/25 transition-all flex flex-col items-center gap-0.5 active:scale-95 cursor-pointer"
                >
                  <span>+15 Días</span>
                  <span className="text-[10px] font-medium text-purple-200">Recomendado</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAccountExtension(30)}
                  disabled={extendingIsSubmitting}
                  className="py-2.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs border border-purple-200 transition-all flex flex-col items-center gap-0.5 active:scale-95 cursor-pointer"
                >
                  <span>+30 Días</span>
                  <span className="text-[10px] font-normal text-purple-600">1 mes extra</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAccountExtension(60)}
                  disabled={extendingIsSubmitting}
                  className="py-2.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs border border-purple-200 transition-all flex flex-col items-center gap-0.5 active:scale-95 cursor-pointer"
                >
                  <span>+60 Días</span>
                  <span className="text-[10px] font-normal text-purple-600">2 meses extra</span>
                </button>
              </div>
            </div>

            {/* Custom Days Input & Date Selection */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Días a sumar</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={extendingDaysInput}
                    onChange={(e) => {
                      const days = Math.max(1, parseInt(e.target.value) || 1);
                      setExtendingDaysInput(days);
                      const base = new Date();
                      base.setDate(base.getDate() + days);
                      setExtendingDateInput(base.toISOString().split('T')[0]);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">O nueva fecha de fin</label>
                  <input
                    type="date"
                    value={extendingDateInput}
                    onChange={(e) => setExtendingDateInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Motivo / Observaciones (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Solicitud de soporte, ampliación de prueba"
                  value={extendingNotesInput}
                  onChange={(e) => setExtendingNotesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={extendingAsActive}
                  onChange={(e) => setExtendingAsActive(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Otorgar como <strong>Suscripción Activa</strong> sin restricciones
                </span>
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExtendingAccount(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={extendingIsSubmitting}
                onClick={() => handleApplyAccountExtension()}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-700/25 cursor-pointer active:scale-95"
              >
                {extendingIsSubmitting ? 'Guardando...' : `Confirmar Prórroga (+${extendingDaysInput} días)`}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ELIMINAR CUENTA DE USUARIO DEFINITIVAMENTE */}
      {/* ======================================================== */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-rose-950">
                    Eliminar Cuenta de Usuario
                  </h3>
                  <p className="text-[11px] text-rose-600 font-semibold">
                    Acción destructiva permanente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Warning Message Card */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-2">
              <p className="leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente la cuenta de <strong>{deletingAccount.fullName || deletingAccount.name}</strong>?
              </p>
              <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200/80 font-mono text-[11px] space-y-1 text-slate-700">
                <div>• Correo: <strong>{deletingAccount.email}</strong></div>
                <div>• Código de Cuenta: <strong>{deletingAccount.accountCode}</strong> ({deletingAccount.accountType === 'pareja' ? 'Parejas Dúo' : 'Individual'})</div>
                <div>• Movimientos asociados: <strong>{deletingAccount.transactionCount} gastos</strong></div>
                <div>• Plan: <strong>{deletingAccount.selectedPlanId}</strong></div>
              </div>
              <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                ⚠️ Se eliminarán de forma inmediata todos los datos en el servidor, transacciones, presupuestos y suscripciones vinculadas. El usuario ya no podrá ingresar con estas credenciales.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                disabled={isDeletingLoading}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar y Conservar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeletingLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingLoading ? 'Eliminando...' : 'Sí, Eliminar Cuenta Definitivamente'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

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

      {/* MODAL CONFIGURACIÓN SEGURIDAD Y 2FA DE ADMINISTRADOR */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-slate-800 my-auto">
            <button
              onClick={() => setIsSecurityModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Seguridad y Doble Factor (2FA)
                </h3>
                <p className="text-xs text-slate-500">
                  Acceso protegido con <strong className="text-purple-700">PIN + Google Authenticator juntos</strong>
                </p>
              </div>
            </div>

            {/* Feedback Messages */}
            {securityError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{securityError}</span>
              </div>
            )}

            {securityMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{securityMsg}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 mb-4 gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setSecurityMode('overview'); setSecurityError(''); setSecurityMsg(''); }}
                className={`pb-2.5 transition-colors cursor-pointer ${
                  securityMode === 'overview' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Estado de Seguridad
              </button>
              <button
                type="button"
                onClick={() => { setSecurityMode('pin'); setSecurityError(''); setSecurityMsg(''); }}
                className={`pb-2.5 transition-colors cursor-pointer ${
                  securityMode === 'pin' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Cambiar PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setSecurityMode('totp');
                  setSecurityError('');
                  setSecurityMsg('');
                  if (!securityTotpSecret) loadTotpSetupData();
                }}
                className={`pb-2.5 transition-colors cursor-pointer ${
                  securityMode === 'totp' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Google Authenticator (QR)
              </button>
            </div>

            {/* VIEW 1: OVERVIEW */}
            {securityMode === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Factor 1: PIN */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-purple-600" />
                        <span>1. PIN Privado</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3" />
                        <span>Activo</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      PIN secreto configurado en el servidor para autorizar cada ingreso.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSecurityMode('pin'); setSecurityError(''); setSecurityMsg(''); }}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                    >
                      Actualizar PIN
                    </button>
                  </div>

                  {/* Factor 2: Google Authenticator */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-purple-600" />
                        <span>2. Google Authenticator</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3" />
                        <span>Vinculado</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Generación de códigos TOTP de 6 dígitos con rotación cada 30 segundos.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSecurityMode('totp');
                        setSecurityError('');
                        setSecurityMsg('');
                        if (!securityTotpSecret) loadTotpSetupData();
                      }}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                    >
                      Ver / Re-vincular QR
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Política de Doble Factor Activa</p>
                    <p className="text-[11px] text-purple-800/80 leading-relaxed">
                      Para ingresar al panel de administración se requiere obligatoriamente ingresar tanto tu <strong>PIN</strong> como el <strong>código actual de Google Authenticator</strong> juntos en la misma pantalla.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsSecurityModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2: CAMBIAR PIN */}
            {securityMode === 'pin' && (
              <form onSubmit={handleUpdateAdminPin} className="space-y-4">
                <div className="p-3 bg-purple-50/60 rounded-xl text-xs text-purple-900 border border-purple-100">
                  🔒 El PIN se almacena de forma cifrada y persistente en la base de datos de administración.
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nuevo PIN Secreto (mínimo 4 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={securityNewPin}
                    onChange={(e) => setSecurityNewPin(e.target.value)}
                    placeholder="Tu nuevo PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Confirmar Nuevo PIN
                  </label>
                  <input
                    type="password"
                    required
                    value={securityConfirmPin}
                    onChange={(e) => setSecurityConfirmPin(e.target.value)}
                    placeholder="Confirmá tu nuevo PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setSecurityMode('overview'); setSecurityError(''); setSecurityMsg(''); }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Volver al resumen
                  </button>
                  <button
                    type="submit"
                    disabled={securityLoading || securityNewPin.length < 4 || securityNewPin !== securityConfirmPin}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-700/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {securityLoading ? 'Guardando...' : 'Actualizar PIN'}
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 3: VINCULAR GOOGLE AUTHENTICATOR QR */}
            {securityMode === 'totp' && (
              <form onSubmit={handleVerifyTotp} className="space-y-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-center space-y-1">
                    <p className="text-xs font-black text-slate-800">
                      Escaneá este código QR con Google Authenticator
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Abrí la app Google Authenticator en tu celular y seleccioná "Escanear un código QR".
                    </p>
                  </div>

                  {/* QR Image */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    {securityTotpQrCode ? (
                      <img
                        src={securityTotpQrCode}
                        alt="Código QR de Google Authenticator"
                        className="w-36 h-36 object-contain rounded"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs font-medium">
                        Cargando código QR...
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 font-bold mt-1 tracking-wider uppercase">
                      GastoAR Admin 2FA
                    </span>
                  </div>

                  {/* Manual Key */}
                  {securityTotpSecret && (
                    <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-600 truncate mr-2 font-mono text-[10px]">
                        Clave: {securityTotpSecret}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(securityTotpSecret);
                          setCopiedTotpSecret(true);
                          setTimeout(() => setCopiedTotpSecret(false), 2000);
                        }}
                        className="text-purple-700 hover:text-purple-900 font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedTotpSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedTotpSecret ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}

                  {/* Validate 6 digits */}
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Código de 6 dígitos que muestra tu app
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={securityTotpVerifyCode}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setSecurityTotpVerifyCode(clean);
                        setSecurityError('');
                      }}
                      placeholder="000 000"
                      className="w-full text-center tracking-[0.35em] py-2 bg-white border border-slate-200 rounded-xl text-lg font-black text-purple-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setSecurityMode('overview'); setSecurityError(''); setSecurityMsg(''); }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Volver al resumen
                  </button>
                  <button
                    type="submit"
                    disabled={securityLoading || securityTotpVerifyCode.length !== 6}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-700/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {securityLoading ? 'Verificando...' : 'Confirmar y Activar'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
