import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Globe, 
  HelpCircle, 
  Info, 
  LogOut, 
  ChevronRight, 
  Check, 
  Smartphone,
  Trash2,
  FileDown
} from 'lucide-react';
import { CoupleProfile, UserAccount } from '../../types';

interface SettingsScreenProps {
  onBack?: () => void;
  userAccount: UserAccount | null;
  profile: CoupleProfile;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateProfile?: (data: Partial<CoupleProfile>) => void;
  onExportData?: () => void;
  onLogout: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  userAccount,
  profile,
  isDarkMode,
  onToggleDarkMode,
  onUpdateProfile,
  onExportData,
  onLogout,
  onShowToast
}) => {
  const [notificationsDue, setNotificationsDue] = useState(true);
  const [notificationsBudget, setNotificationsBudget] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(profile.currency || 'ARS');
  const [biometricLock, setBiometricLock] = useState(false);

  const [activeSubModal, setActiveSubModal] = useState<string | null>(null);

  const handleCurrencyChange = (curr: string) => {
    setSelectedCurrency(curr);
    if (onUpdateProfile) {
      onUpdateProfile({ currency: curr });
    }
    if (onShowToast) onShowToast(`Moneda cambiada a ${curr}`, 'success');
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-50 text-slate-800 flex flex-col justify-between p-5 select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}

          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Configuración
          </h2>

          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            Pantalla 7
          </span>
        </div>

        {/* Settings Group 1: Preferencias de Uso */}
        <div className="bg-white rounded-3xl p-1.5 border border-slate-200/70 shadow-xs space-y-0.5">
          {/* Account */}
          <button
            type="button"
            onClick={() => setActiveSubModal('account')}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7928CA] flex items-center justify-center">
                <User className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Cuenta</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {userAccount?.email || 'Cuenta individual o en pareja'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
          </button>

          {/* Notifications */}
          <div className="w-full p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F95420] flex items-center justify-center">
                <Bell className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Recordatorios de Alerta</span>
                <span className="text-[10px] text-slate-400 font-medium">Avisos de vencimientos</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsDue}
                onChange={() => {
                  setNotificationsDue(!notificationsDue);
                  if (onShowToast) onShowToast('Preferencia de notificación actualizada', 'info');
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#7928CA]"></div>
            </label>
          </div>

          {/* Privacy & Security */}
          <div className="w-full p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Seguridad y Privacidad</span>
                <span className="text-[10px] text-slate-400 font-medium">Bloqueo de acceso local</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={biometricLock}
                onChange={() => {
                  setBiometricLock(!biometricLock);
                  if (onShowToast) onShowToast(biometricLock ? 'Bloqueo desactivado' : 'Bloqueo biométrico simulado activado', 'info');
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Appearance / Dark Mode */}
          <div className="w-full p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {isDarkMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Apariencia</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="py-1 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Cambiar
            </button>
          </div>

          {/* Currency & Language */}
          <div className="w-full p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Globe className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Moneda Principal</span>
                <span className="text-[10px] text-slate-400 font-medium">Visualización de montos</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleCurrencyChange('ARS')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  selectedCurrency === 'ARS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                ARS $
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyChange('USD')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  selectedCurrency === 'USD'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                USD u$s
              </button>
            </div>
          </div>
        </div>

        {/* Settings Group 2: Datos y Acerca de */}
        <div className="bg-white rounded-3xl p-1.5 border border-slate-200/70 shadow-xs space-y-0.5">
          {/* Export Data */}
          {onExportData && (
            <button
              type="button"
              onClick={onExportData}
              className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileDown className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Exportar Resumen (CSV)
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>
          )}

          {/* Help & Support */}
          <button
            type="button"
            onClick={() => setActiveSubModal('help')}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Centro de Ayuda & FAQ
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
          </button>

          {/* About Us */}
          <button
            type="button"
            onClick={() => setActiveSubModal('about')}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Info className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Acerca de GastoAr</span>
                <span className="text-[10px] text-slate-400 font-medium">Versión 2.5.0 (2026)</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
          </button>
        </div>

        {/* Log Out */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full p-3 rounded-2xl bg-white border border-rose-100 hover:bg-rose-50/70 text-rose-600 flex items-center justify-center gap-2 font-bold text-xs transition-colors cursor-pointer shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Sub-modal: FAQ or About */}
      {activeSubModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl border border-purple-100 animate-in zoom-in-95">
            <h3 className="text-sm font-black text-slate-900 capitalize">
              {activeSubModal === 'account'
                ? 'Información de Cuenta'
                : activeSubModal === 'help'
                ? 'Preguntas Frecuentes'
                : 'Acerca de GastoAr'}
            </h3>

            <div className="text-xs text-slate-600 space-y-2 max-h-60 overflow-y-auto">
              {activeSubModal === 'account' && (
                <div className="space-y-1.5">
                  <p><strong>Usuario:</strong> {userAccount?.name || profile.user1Name}</p>
                  <p><strong>Email:</strong> {userAccount?.email || 'Demo'}</p>
                  <p><strong>Tipo:</strong> {profile.accountCode ? 'Cuenta en Pareja' : 'Individual'}</p>
                  <p><strong>Código:</strong> {profile.accountCode || 'COMPARTIDA-GastoAr'}</p>
                </div>
              )}

              {activeSubModal === 'help' && (
                <div className="space-y-2">
                  <div>
                    <p className="font-bold text-slate-800">¿Cómo funciona la carga por voz?</p>
                    <p className="text-slate-500">Tocá el botón naranja del micrófono y dictá tu gasto (ej: "Gasté 5000 en verdulería en efectivo"). La IA lo clasifica automáticamente.</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">¿Cómo agrego un vencimiento?</p>
                    <p className="text-slate-500">En la solapa de Vencimientos, pulsá "+ Agregar vencimiento" y seleccioná con cuántos días de anticipación querés el recordatorio.</p>
                  </div>
                </div>
              )}

              {activeSubModal === 'about' && (
                <div className="space-y-1.5">
                  <p><strong>GastoAr</strong> es la aplicación integral de gestión de finanzas personales, cuotas y gastos en pareja diseñada especialmente para Argentina.</p>
                  <p className="text-slate-400">Versión: 2.5.0 · 2026</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveSubModal(null)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
