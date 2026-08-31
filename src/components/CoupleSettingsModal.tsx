import React, { useState } from 'react';
import { 
  X, 
  Users, 
  User, 
  Copy, 
  Check, 
  Link, 
  RefreshCw, 
  Download, 
  Upload, 
  Heart,
  Coins
} from 'lucide-react';
import { CoupleProfile, SplitType, Transaction } from '../types';

interface CoupleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CoupleProfile;
  onUpdateProfile: (newProfile: Partial<CoupleProfile>) => void;
  onJoinAccount: (code: string) => void;
  onGenerateNewCode: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  transactions: Transaction[];
  onImportData: (data: { transactions: Transaction[]; profile: CoupleProfile }) => void;
}

export const CoupleSettingsModal: React.FC<CoupleSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onJoinAccount,
  onGenerateNewCode,
  onShowToast,
  transactions,
  onImportData,
}) => {
  const [user1Name, setUser1Name] = useState(profile.user1Name);
  const [user2Name, setUser2Name] = useState(profile.user2Name);
  const [currentUser, setCurrentUser] = useState<'user1' | 'user2'>(profile.currentUser);
  const [currency, setCurrency] = useState(profile.currency || 'ARS');
  const [defaultSplit, setDefaultSplit] = useState<SplitType>(profile.defaultSplit || '50_50');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.accountCode);
    setCopied(true);
    onShowToast('¡Código de cuenta copiado al portapapeles!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      user1Name: user1Name.trim() || 'Sol',
      user2Name: user2Name.trim() || 'Martín',
      currentUser,
      currency,
      defaultSplit,
    });
    onShowToast('Perfil actualizado correctamente', 'success');
    onClose();
  };

  const handleJoin = () => {
    if (!joinCodeInput.trim()) {
      onShowToast('Ingresa un código de cuenta válido', 'error');
      return;
    }
    onJoinAccount(joinCodeInput.trim().toUpperCase());
    setJoinCodeInput('');
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify({ transactions, profile }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gastos_pareja_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Copia de seguridad descargada', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && parsed.profile) {
          onImportData(parsed);
          onShowToast('Datos importados con éxito', 'success');
          onClose();
        } else {
          throw new Error('Formato inválido');
        }
      } catch {
        onShowToast('Error al importar archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-amber-600 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-700 flex items-center justify-center text-amber-100 shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Configuración de Pareja & Vinculación
              </h3>
              <p className="text-[10px] text-amber-100">
                Sincronización en tiempo real y nombres personalizados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-100 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs text-slate-700">
          
          {/* Active Account Code Box */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                <span>Código de tu Cuenta Compartida</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Activa
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={profile.accountCode}
                className="w-full font-mono font-bold text-center text-base py-2 px-3 bg-white border border-amber-300 rounded-xl text-slate-900 shadow-inner"
              />
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <p className="text-[11px] text-amber-800 leading-snug">
              Comparte este código con tu pareja para sincronizar los gastos en ambas pantallas.
            </p>
          </div>

          {/* Join existing account */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vincular con la Cuenta de tu Pareja</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Ingresa el código que te compartió para ver los mismos gastos en ambos celulares o computadoras.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Ej: PAREJA-9821"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono uppercase text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleJoin}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shrink-0 active:scale-95"
              >
                Vincular
              </button>
            </div>
          </div>

          {/* Edit Partner Names & Active Device Profile */}
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Nombres de los Integrantes & Dispositivo
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Usuario 1
                </label>
                <input
                  type="text"
                  required
                  value={user1Name}
                  onChange={(e) => setUser1Name(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Usuario 2
                </label>
                <input
                  type="text"
                  required
                  value={user2Name}
                  onChange={(e) => setUser2Name(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Who is using this device right now */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                ¿Quién está usando este dispositivo actualmente?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentUser('user1')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    currentUser === 'user1'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Soy {user1Name || 'Usuario 1'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentUser('user2')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    currentUser === 'user2'
                      ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Soy {user2Name || 'Usuario 2'}</span>
                </button>
              </div>
            </div>

            {/* Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moneda Principal
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ARS">ARS ($ Pesos Argentinos)</option>
                  <option value="USD">USD ($ Dólar Estadounidense)</option>
                  <option value="EUR">EUR (€ Euros)</option>
                  <option value="CLP">CLP ($ Pesos Chilenos)</option>
                  <option value="UYU">UYU ($ Pesos Uruguayos)</option>
                  <option value="COP">COP ($ Pesos Colombianos)</option>
                  <option value="MXN">MXN ($ Pesos Mexicanos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  División por Defecto
                </label>
                <select
                  value={defaultSplit}
                  onChange={(e) => setDefaultSplit(e.target.value as SplitType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="50_50">50% / 50% (Mitad y mitad)</option>
                  <option value="60_40">60% / 40%</option>
                  <option value="70_30">70% / 30%</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onGenerateNewCode}
                className="text-slate-500 hover:text-indigo-600 text-[11px] font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generar nuevo código aleatorio</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                Guardar Perfil
              </button>
            </div>
          </form>

          {/* Backup & Restore Data */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Copia de Seguridad (Backup)
            </h4>
            <p className="text-[11px] text-slate-500">
              Guarda tus gastos en un archivo JSON o restáuralos en otro navegador.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportJson}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Backup JSON</span>
              </button>

              <label className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar desde JSON</span>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
