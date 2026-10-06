import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  Settings,
  Sparkles,
  Unlock,
  Check,
  Smartphone,
  QrCode,
  Copy,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { auth } from '../lib/firebase';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Login credentials
  const [pin, setPin] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Setup credentials
  const [currentPinToChange, setCurrentPinToChange] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupTotpCode, setSetupTotpCode] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrCode, setSetupQrCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Status & UI
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasTotpConfigured, setHasTotpConfigured] = useState<boolean | null>(null);
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  // Real-time 30-second Google Authenticator countdown
  useEffect(() => {
    const updateTimer = () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      setTimeLeft(30 - (nowSeconds % 30));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentEmail = auth.currentUser?.email?.toLowerCase().trim() || '';

  // Load setup QR code and secret
  const loadSetupCredentials = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/setup-admin-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail || 'admin@gastoar.app' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSetupSecret(data.secret);
        setSetupQrCode(data.qrCode);
      } else {
        setError(data.error || 'No se pudo generar el código QR de Google Authenticator.');
      }
    } catch {
      setError('Error al comunicar con el servidor para generar el código QR.');
    } finally {
      setLoading(false);
    }
  };

  // Check admin status on modal open
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSuccessMsg('');
    setPin('');
    setTotpCode('');
    setNewPin('');
    setConfirmPin('');
    setSetupTotpCode('');
    setCopiedSecret(false);

    let isMounted = true;
    fetch('/api/auth/admin-status')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success) {
          const hasTotp = Boolean(data.hasTotpConfigured);
          const hasPin = Boolean(data.hasPinConfigured);
          setHasTotpConfigured(hasTotp);
          setHasPinConfigured(hasPin);

          // If neither or only one is configured, guide to setup
          if (!hasTotp || !hasPin) {
            setMode('setup');
            loadSetupCredentials();
          } else {
            setMode('login');
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasTotpConfigured(false);
          setHasPinConfigured(false);
          setMode('setup');
          loadSetupCredentials();
        }
      });

    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Copy secret key to clipboard
  const handleCopySecret = () => {
    if (!setupSecret) return;
    navigator.clipboard.writeText(setupSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  // Submit unified Login (PIN + Google Authenticator)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanPin = pin.trim();
    const cleanCode = totpCode.replace(/\s+/g, '').trim();

    if (!cleanPin) {
      setError('Por favor ingresá tu PIN de administrador.');
      return;
    }
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Por favor ingresá el código de 6 dígitos de Google Authenticator.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pin: cleanPin,
          code: cleanCode,
          email: currentEmail || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        localStorage.setItem('control_gastos_is_admin', 'true');
        setSuccessMsg('¡PIN y Google Authenticator verificados con éxito!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
      } else {
        setError(data.error || 'Credenciales incorrectas. Verificá tu PIN y el código actual de la app.');
      }
    } catch {
      setError('No se pudo verificar el acceso en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Submit unified Setup (PIN + Google Authenticator activation)
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanNewPin = newPin.trim();
    const cleanCode = setupTotpCode.replace(/\s+/g, '').trim();

    if (!cleanNewPin || cleanNewPin.length < 4) {
      setError('El PIN de administrador debe tener al menos 4 caracteres.');
      return;
    }
    if (cleanNewPin !== confirmPin.trim()) {
      setError('Los PINs ingresados no coinciden.');
      return;
    }
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Por favor ingresá el código de 6 dígitos que muestra tu app Google Authenticator.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/save-admin-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPin: cleanNewPin,
          totpSecret: setupSecret,
          totpToken: cleanCode,
          email: currentEmail || undefined,
          currentPin: hasPinConfigured ? currentPinToChange.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('¡PIN y Google Authenticator configurados con éxito!');
        setHasPinConfigured(true);
        setHasTotpConfigured(true);
        localStorage.setItem('control_gastos_is_admin', 'true');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setError(data.error || 'No se pudieron guardar las credenciales.');
      }
    } catch {
      setError('Error al comunicar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white leading-tight">
              Acceso a Administración
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Doble factor obligatorio: <strong className="text-amber-300">PIN + Google Authenticator</strong>
            </p>
          </div>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 mb-4 text-xs font-bold gap-4">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'login' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ingresar (PIN + Authenticator)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('setup');
              setError('');
              setSuccessMsg('');
              if (!setupSecret) loadSetupCredentials();
            }}
            className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'setup' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar / Cambiar</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* VIEW 1: UNIFIED 2FA LOGIN (PIN + GOOGLE AUTHENTICATOR)      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Field 1: Admin PIN */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. Tu PIN de Administrador</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPin ? 'Ocultar' : 'Ver'}</span>
                </button>
              </label>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPin ? "text" : "password"}
                  required
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  placeholder="Ingresá tu PIN privado"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Field 2: Google Authenticator (6 digits) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Código de Google Authenticator</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  {timeLeft}s
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTotpCode(clean);
                    setError('');
                  }}
                  placeholder="000 000"
                  className="w-full text-center tracking-[0.35em] sm:tracking-[0.5em] py-3 bg-slate-950 border border-slate-800 rounded-xl text-xl font-black text-amber-400 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-inner"
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Escribí el código de 6 dígitos que aparece en tu app Google Authenticator.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('setup');
                  if (!setupSecret) loadSetupCredentials();
                }}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-medium cursor-pointer flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                <span>¿Cambiar PIN o código QR?</span>
              </button>

              <button
                type="submit"
                disabled={loading || !pin.trim() || totpCode.length !== 6}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer ml-auto"
              >
                <span>{loading ? 'Verificando...' : 'Ingresar con PIN + Authenticator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* VIEW 2: UNIFIED SETUP (PIN + GOOGLE AUTHENTICATOR QR)       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {mode === 'setup' && (
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            
            {/* Step A: Definir PIN */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Lock className="w-3.5 h-3.5" />
                <span>Paso 1: Definí tu PIN de Administrador</span>
              </div>

              {hasPinConfigured && (
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    PIN Actual (requerido para autorizar el cambio)
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPinToChange}
                    onChange={(e) => { setCurrentPinToChange(e.target.value); setError(''); }}
                    placeholder="Ingresá tu PIN actual"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono mb-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Nuevo PIN (mín. 4 car.)</label>
                  <input
                    type="password"
                    required
                    value={newPin}
                    onChange={(e) => { setNewPin(e.target.value); setError(''); }}
                    placeholder="Elegí tu PIN"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Confirmar PIN</label>
                  <input
                    type="password"
                    required
                    value={confirmPin}
                    onChange={(e) => { setConfirmPin(e.target.value); setError(''); }}
                    placeholder="Repetí el PIN"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step B: Vincular Google Authenticator QR */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <QrCode className="w-3.5 h-3.5" />
                <span>Paso 2: Escaneá el QR en Google Authenticator</span>
              </div>

              {/* QR Image */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-700/80 shadow-md">
                {setupQrCode ? (
                  <img
                    src={setupQrCode}
                    alt="Código QR de Google Authenticator"
                    className="w-36 h-36 object-contain rounded"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-500 text-xs font-medium">
                    Generando QR...
                  </div>
                )}
                <span className="text-[10px] text-slate-600 font-bold mt-1 tracking-wider uppercase">
                  GastoAR Admin 2FA
                </span>
              </div>

              {/* Manual Secret Key Fallback */}
              {setupSecret && (
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400 truncate mr-2 font-mono text-[10px] text-amber-300">
                    Clave: {setupSecret}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="text-amber-400 hover:text-amber-300 font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSecret ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              )}

              {/* Confirm 6 digits */}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <label className="block text-[11px] font-bold text-slate-200">
                  Paso 3: Código actual de 6 dígitos de la app
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={setupTotpCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setSetupTotpCode(clean);
                    setError('');
                  }}
                  placeholder="000 000"
                  className="w-full text-center tracking-[0.35em] py-2 bg-slate-900 border border-slate-800 rounded-xl text-lg font-black text-amber-400 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {hasPinConfigured && hasTotpConfigured && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Volver al ingreso
                </button>
              )}

              <button
                type="submit"
                disabled={loading || (Boolean(hasPinConfigured) && !currentPinToChange.trim()) || newPin.length < 4 || newPin !== confirmPin || setupTotpCode.length !== 6}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer ml-auto"
              >
                <span>{loading ? 'Guardando...' : 'Guardar PIN + Activar Authenticator'}</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
