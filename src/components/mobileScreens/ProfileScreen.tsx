import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  CreditCard, 
  Activity, 
  Users, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Camera, 
  Check, 
  Sparkles,
  ShieldCheck,
  Cloud,
  ExternalLink,
  Crown
} from 'lucide-react';
import { CoupleProfile, UserAccount, UserSubscription } from '../../types';

interface ProfileScreenProps {
  onBack?: () => void;
  userAccount: UserAccount | null;
  profile: CoupleProfile;
  subscription?: UserSubscription | null;
  onUpdateProfile?: (data: Partial<CoupleProfile>) => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenCloudSync?: () => void;
  onLogout: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  userAccount,
  profile,
  subscription,
  onUpdateProfile,
  onNavigateToTab,
  onOpenCloudSync,
  onLogout,
  onShowToast
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(userAccount?.name || profile.user1Name || 'Usuario');
  const [userEmail, setUserEmail] = useState(userAccount?.email || 'usuario@ejemplo.com');
  const [partnerName, setPartnerName] = useState(userAccount?.partnerName || profile.user2Name || 'Mi Pareja');

  const isPro = subscription?.status === 'active' || userAccount?.selectedPlanId === 'pareja' || userAccount?.selectedPlanId === 'familiar_pro';

  const handleSaveEdit = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        user1Name: userName,
        user2Name: partnerName
      });
    }
    setIsEditing(false);
    if (onShowToast) onShowToast('Perfil actualizado correctamente', 'success');
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-50 text-slate-800 flex flex-col justify-between select-none overflow-y-auto">
      {/* Top Banner & Avatar Header (Matching Screen 6) */}
      <div className="relative bg-gradient-to-b from-[#5C1690] via-[#7928CA] to-[#9B30FF] pt-5 pb-8 px-6 text-white text-center rounded-b-[36px] shadow-lg shadow-purple-600/20">
        {/* Navigation row */}
        <div className="flex items-center justify-between pb-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
          <span className="text-[11px] font-bold text-white/90 bg-white/15 px-3 py-1 rounded-full backdrop-blur-md">
            Pantalla 6 · Perfil
          </span>
          <div className="w-9 h-9" />
        </div>

        {/* User Avatar with verified & camera badge */}
        <div className="relative inline-block my-2">
          <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-white p-1 shadow-2xl mx-auto">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#7928CA] to-[#F95420] text-white flex items-center justify-center font-black text-2xl overflow-hidden">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-white text-purple-700 shadow-md flex items-center justify-center border border-purple-100 hover:scale-110 transition-transform cursor-pointer"
            title="Cambiar foto / Editar"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Name & Email */}
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-white">
            {userName}
          </h2>
          <p className="text-xs text-purple-200/90 font-medium">
            {userEmail}
          </p>

          <div className="pt-2 flex justify-center">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                isPro
                  ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-slate-900 shadow-xs'
                  : 'bg-white/20 text-white'
              }`}
            >
              <Crown className="w-3 h-3" />
              {isPro ? 'Plan PRO Activo' : 'Plan Básico Gratuito'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Edit Mode Form */}
      {isEditing && (
        <div className="m-4 p-4 rounded-3xl bg-white border border-purple-100 shadow-md space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-black text-slate-800">Editar Datos Personales</span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre de Pareja</label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveEdit}
            className="w-full py-2.5 rounded-xl bg-[#7928CA] text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            Guardar Cambios
          </button>
        </div>
      )}

      {/* Options List (Matching Screen 6 rows) */}
      <div className="px-4 py-4 space-y-2 flex-1">
        <div className="bg-white rounded-3xl p-1.5 border border-slate-200/70 shadow-xs space-y-0.5">
          {/* 1. Edit Profile */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7928CA] flex items-center justify-center group-hover:scale-105 transition-transform">
                <User className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Editar Perfil
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </button>

          {/* 2. My Activity */}
          <button
            type="button"
            onClick={() => onNavigateToTab && onNavigateToTab('transactions')}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Activity className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Mi Actividad Financiera
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
          </button>

          {/* 3. Tarjetas & Bancos */}
          <button
            type="button"
            onClick={() => onNavigateToTab && onNavigateToTab('card_alerts')}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F95420] flex items-center justify-center group-hover:scale-105 transition-transform">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Tarjetas y Vencimientos
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
          </button>

          {/* 4. Cuenta Compartida */}
          <button
            type="button"
            onClick={() => onNavigateToTab && onNavigateToTab('couple_balance')}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 block">
                  Cuenta Compartida / Pareja
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {profile.accountCode || 'COMPARTIDA-GastoAr'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </button>

          {/* 5. Cloud Sync */}
          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Cloud className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Sincronización en la Nube
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
            </button>
          )}

          {/* 6. Help & Support */}
          <a
            href="https://wa.me/5491100000000?text=Hola%20tengo%20una%20consulta%20sobre%20GastoAr"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Ayuda & Soporte Técnico
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </a>
        </div>

        {/* 7. Log Out Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full p-3 rounded-2xl bg-white border border-rose-100 hover:bg-rose-50/70 text-rose-600 flex items-center justify-center gap-2 font-bold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
