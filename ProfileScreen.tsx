import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  CreditCard,
  Users,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  Check,
  Sparkles,
  ShieldCheck,
  Cloud,
  Crown,
  CalendarDays,
  Pencil,
  Settings,
  Copy,
  CheckCircle2,
  ExternalLink,
  WalletCards
} from 'lucide-react';
import { CoupleProfile, UserAccount, UserSubscription } from './types';
import { SUBSCRIPTION_PLANS } from './data/subscriptionPlans';
import { formatCurrency, formatDateEs } from './utils/formatters';

interface ProfileScreenProps {
  onBack?: () => void;
  userAccount: UserAccount | null;
  profile: CoupleProfile;
  subscription?: UserSubscription | null;
  onUpdateProfile?: (data: Partial<CoupleProfile>) => void;
  onUpdateAccount?: (data: Partial<UserAccount>) => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenCloudSync?: () => void;
  onLogout: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ORANGE = '#F95420';
const PURPLE = '#9333EA';

const statusLabel: Record<string, string> = {
  active: 'Activo',
  trial: 'Período de prueba',
  pending_payment: 'Pago pendiente',
  past_due: 'Pago vencido',
  canceled: 'Cancelado',
};

const statusClass: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial: 'bg-purple-50 text-purple-700 border-purple-200',
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  past_due: 'bg-red-50 text-red-700 border-red-200',
  canceled: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  userAccount,
  profile,
  subscription,
  onUpdateProfile,
  onUpdateAccount,
  onNavigateToTab,
  onOpenCloudSync,
  onLogout,
  onShowToast,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(userAccount?.name || profile.user1Name || 'Usuario');
  const [lastName, setLastName] = useState(userAccount?.lastName || '');
  const [partnerName, setPartnerName] = useState(userAccount?.partnerName || profile.user2Name || '');
  const [copied, setCopied] = useState(false);

  const plan = useMemo(
    () => subscription
      ? SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId)
      : userAccount?.selectedPlanId
        ? SUBSCRIPTION_PLANS.find(p => p.id === userAccount.selectedPlanId)
        : SUBSCRIPTION_PLANS.find(p => p.id === 'free'),
    [subscription, userAccount?.selectedPlanId]
  );

  const trialDaysLeft = useMemo(() => {
    if (!subscription?.trialEndsDate) return null;
    const end = new Date(`${subscription.trialEndsDate}T23:59:59`);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
  }, [subscription?.trialEndsDate]);

  const accountTypeLabel = userAccount?.accountType === 'individual'
    ? 'Cuenta personal'
    : 'Cuenta compartida';

  const initials = `${userName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    onShowToast?.(message, type);
  };

  const saveProfile = () => {
    onUpdateProfile?.({
      user1Name: userName.trim() || 'Usuario',
      user2Name: partnerName.trim() || profile.user2Name,
    });
    onUpdateAccount?.({
      name: userName.trim() || 'Usuario',
      lastName: lastName.trim(),
      partnerName: partnerName.trim(),
    });
    setIsEditing(false);
    notify('Perfil actualizado correctamente', 'success');
  };

  const copyAccountCode = async () => {
    if (!profile.accountCode) return;
    try {
      await navigator.clipboard.writeText(profile.accountCode);
      setCopied(true);
      notify('Código de cuenta copiado', 'success');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      notify('No se pudo copiar el código', 'error');
    }
  };

  const subscriptionStatus = subscription?.status || 'active';
  const isTrial = subscriptionStatus === 'trial';

  return (
    <div className="w-full min-h-full bg-[#F8F7FB] text-slate-800 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
                aria-label="Volver"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cuenta</p>
              <h1 className="text-lg font-black text-slate-900">Mi perfil</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(v => !v)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border transition"
            style={{ color: PURPLE, borderColor: '#E9D5FF', background: '#FAF5FF' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 pb-8">
        {/* Identity card */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-sm shrink-0"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, ${ORANGE})` }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                    placeholder="Nombre"
                  />
                  <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                    placeholder="Apellido"
                  />
                </div>
              ) : (
                <h2 className="text-xl font-black text-slate-900 truncate">
                  {userName} {lastName}
                </h2>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
                  <Mail className="w-3.5 h-3.5" />
                  {userAccount?.email || 'Sin email'}
                </span>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                  {accountTypeLabel}
                </span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={saveProfile}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-white text-xs font-black shadow-sm"
                style={{ background: ORANGE }}
              >
                <Check className="w-4 h-4" />
                Guardar cambios
              </button>
            </div>
          )}
        </section>

        {/* Subscription */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tu suscripción</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-lg font-black text-slate-900">
                  {subscription?.planName || plan?.name || 'Plan gratuito'}
                </h2>
                <span className={`px-2 py-1 rounded-full border text-[10px] font-black ${statusClass[subscriptionStatus] || statusClass.active}`}>
                  {statusLabel[subscriptionStatus] || 'Activo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {subscription
                  ? `${subscription.billingCycle === 'annual' ? 'Facturación anual' : 'Facturación mensual'} · ${formatCurrency(subscription.pricePaid || 0, subscription.currency || 'ARS')}`
                  : 'Sin suscripción activa'}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#FAF5FF', color: PURPLE }}
            >
              {isTrial ? <Sparkles className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
            </div>
          </div>

          {isTrial && (
            <div className="mx-5 mb-5 rounded-xl border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-purple-900">Estás en período de prueba</p>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    {trialDaysLeft !== null ? `Te quedan ${trialDaysLeft} día${trialDaysLeft === 1 ? '' : 's'}.` : 'Revisá la fecha de finalización.'}
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              {subscription?.trialEndsDate && (
                <p className="text-[10px] text-purple-600 mt-2">
                  Finaliza el {formatDateEs(subscription.trialEndsDate)}
                </p>
              )}
            </div>
          )}

          {subscription?.nextRenewalDate && !isTrial && (
            <div className="mx-5 mb-5 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3">
              <span className="text-xs text-slate-500 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Próxima renovación
              </span>
              <span className="text-xs font-black text-slate-800">
                {formatDateEs(subscription.nextRenewalDate)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigateToTab?.('subscriptions')}
            className="w-full border-t border-slate-100 px-5 py-3.5 flex items-center justify-between text-xs font-black hover:bg-slate-50 transition"
            style={{ color: PURPLE }}
          >
            <span>{subscription ? 'Gestionar suscripción y plan' : 'Ver planes disponibles'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* Shared account */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F95420] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cuenta</p>
              <h2 className="text-base font-black text-slate-900 mt-0.5">{accountTypeLabel}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {userAccount?.accountType === 'individual'
                  ? 'Tus movimientos y presupuestos son personales.'
                  : partnerName
                    ? `Compartida con ${partnerName}.`
                    : 'Podés vincular otra persona para compartir gastos.'}
              </p>

              {userAccount?.accountType !== 'individual' && profile.accountCode && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Código de cuenta</p>
                    <p className="text-sm font-black tracking-wider text-slate-800">{profile.accountCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyAccountCode}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                    title="Copiar código"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick account actions */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          <button type="button" onClick={onOpenCloudSync} className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Cloud className="w-4 h-4" /></span>
            <span className="flex-1">
              <span className="block text-xs font-black text-slate-800">Sincronización en la nube</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">Ver estado y sincronizar tus datos</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button type="button" onClick={() => onNavigateToTab?.('settings')} className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50">
            <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Settings className="w-4 h-4" /></span>
            <span className="flex-1">
              <span className="block text-xs font-black text-slate-800">Preferencias y configuración</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">Apariencia, datos y preferencias</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button type="button" onClick={() => onShowToast?.('Centro de ayuda próximamente disponible', 'info')} className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50">
            <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><HelpCircle className="w-4 h-4" /></span>
            <span className="flex-1">
              <span className="block text-xs font-black text-slate-800">Ayuda y soporte</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">Resolvé dudas sobre GastoAR</span>
            </span>
            <ExternalLink className="w-4 h-4 text-slate-300" />
          </button>
        </section>

        {/* Account summary */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <User className="w-4 h-4 mb-2 text-purple-600" />
            <p className="text-[10px] text-slate-400">Moneda</p>
            <p className="text-sm font-black text-slate-800 mt-0.5">{profile.currency || userAccount?.currency || 'ARS'}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <ShieldCheck className="w-4 h-4 mb-2 text-emerald-600" />
            <p className="text-[10px] text-slate-400">Cuenta</p>
            <p className="text-sm font-black text-slate-800 mt-0.5">
              {userAccount?.emailVerified ? 'Verificada' : 'Sin verificar'}
            </p>
          </div>
        </section>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-2xl bg-white border border-red-200 text-red-600 py-3.5 text-xs font-black flex items-center justify-center gap-2 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>

        <p className="text-center text-[10px] text-slate-400">
          GastoAR · Tu información financiera en un solo lugar
        </p>
      </main>
    </div>
  );
};
