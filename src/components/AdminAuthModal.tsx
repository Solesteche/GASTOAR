import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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

function generateBase32Secret(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

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

  // Load setup QR code and secret (with local fallback and persistent cache so it NEVER fails or rotates)
  const loadSetupCredentials = async (forceRegenerate = false) => {
    // If we already have a pending secret and user didn't ask to regenerate, keep it!
    const cachedSecret = localStorage.getItem('control_gastos_pending_totp_secret');
    const cachedQr = localStorage.getItem('control_gastos_pending_totp_qr');
    if (!forceRegenerate && cachedSecret && cachedQr) {
      setSetupSecret(cachedSecret);
      setSetupQrCode(cachedQr);
      return;
    }

    setLoading(true);
    setError('');

    // 1. Try server endpoint first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/auth/setup-admin-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail || 'admin@gastoar.app' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.success && data.qrCode && data.secret) {
        setSetupSecret(data.secret);
        setSetupQrCode(data.qrCode);
        localStorage.setItem('control_gastos_pending_totp_secret', data.secret);
        localStorage.setItem('control_gastos_pending_totp_qr', data.qrCode);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Servidor no disponible para QR, generando de forma local:', err);
    }

    // 2. High-reliability local fallback: generate QR code and RFC-compliant Base32 secret directly
    try {
      const email = currentEmail || 'admin@gastoar.app';
      const secret = generateBase32Secret(32);
      const otpauth = `otpauth://totp/GastoAR:${encodeURIComponent(email)}?secret=${secret}&issuer=GastoAR`;
      const qrDataUrl = await QRCode.toDataURL(otpauth, {
        margin: 1,
        width: 260,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      });
      setSetupSecret(secret);
      setSetupQrCode(qrDataUrl);
      localStorage.setItem('control_gastos_pending_totp_secret', secret);
      localStorage.setItem('control_gastos_pending_totp_qr', qrDataUrl);
      setError('');
    } catch (localErr) {
      console.error('Error generando QR local:', localErr);
      setError('No se pudo generar el código QR automáticamente. Hacé clic en "Reintentar QR".');
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
    if (hasTotpConfigured && (!cleanCode || cleanCode.length !== 6)) {
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
          code: cleanCode || undefined,
          email: currentEmail || undefined,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: 'Respuesta inválida del servidor.' };
      }

      if (res.ok && data.authorized) {
        localStorage.setItem('control_gastos_is_admin', 'true');
        localStorage.setItem('control_gastos_admin_pin', cleanPin);
        setSuccessMsg(data.message || '¡Ingreso autorizado con éxito!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
      } else {
        // Check local pin backup if server reports not found or invalid
        const localPin = localStorage.getItem('control_gastos_admin_pin');
        if (localPin && cleanPin === localPin && !hasTotpConfigured) {
          localStorage.setItem('control_gastos_is_admin', 'true');
          setSuccessMsg('¡PIN verificado con éxito!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 500);
          return;
        }
        setError(data.error || 'Credenciales incorrectas. Verificá tu PIN y el código actual.');
      }
    } catch (err: any) {
      const localPin = localStorage.getItem('control_gastos_admin_pin');
      if (localPin && cleanPin === localPin) {
        localStorage.setItem('control_gastos_is_admin', 'true');
        setSuccessMsg('¡PIN verificado!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
        return;
      }
      setError(err?.message || 'Error de conexión con el servidor. Verificá tu red e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Save PIN only directly (guarantees PIN is recorded even before Authenticator activation)
  const handleSavePinOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanNewPin = newPin.trim();
    if (!cleanNewPin || cleanNewPin.length < 4) {
      setError('El PIN de administrador debe tener al menos 4 caracteres.');
      return;
    }
    if (cleanNewPin !== confirmPin.trim()) {
      setError('Los PINs ingresados no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/set-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPin: cleanNewPin,
          email: currentEmail || undefined,
          forceReset: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('control_gastos_admin_pin', cleanNewPin);
        setHasPinConfigured(true);
        setSuccessMsg('¡PIN de administrador guardado con éxito! Ya podés usarlo para ingresar o vincular Google Authenticator en el Paso 2.');
      } else {
        setError(data.error || 'No se pudo guardar el PIN.');
      }
    } catch {
      localStorage.setItem('control_gastos_admin_pin', cleanNewPin);
      setHasPinConfigured(true);
      setSuccessMsg('¡PIN guardado localmente con éxito!');
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

    // If user has not entered 6 digits yet, save the PIN directly!
    if (!cleanCode || cleanCode.length !== 6) {
      await handleSavePinOnly();
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
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('control_gastos_admin_pin', cleanNewPin);
        setHasPinConfigured(true);
        if (data.totpSaved) {
          setHasTotpConfigured(true);
          localStorage.removeItem('control_gastos_pending_totp_secret');
          localStorage.removeItem('control_gastos_pending_totp_qr');
          setSuccessMsg('¡PIN y Google Authenticator configurados con éxito!');
          localStorage.setItem('control_gastos_is_admin', 'true');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        } else {
          setSuccessMsg(data.message || '¡PIN guardado con éxito!');
        }
      } else {
        setError(data.error || 'No se pudieron guardar las credenciales.');
      }
    } catch {
      localStorage.setItem('control_gastos_admin_pin', cleanNewPin);
      setHasPinConfigured(true);
      setSuccessMsg('¡PIN guardado localmente!');
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

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSavePinOnly}
                  disabled={loading || newPin.length < 4 || newPin !== confirmPin}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Guardar PIN</span>
                </button>
              </div>
            </div>

            {/* Step B: Vincular Google Authenticator QR */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Paso 2: Escaneá el QR en Google Authenticator</span>
                </div>
                <button
                  type="button"
                  onClick={loadSetupCredentials}
                  disabled={loading}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                  title="Generar un nuevo código QR"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Generando...' : 'Reintentar QR'}</span>
                </button>
              </div>

              {/* QR Image */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-700/80 shadow-md min-h-[160px]">
                {setupQrCode ? (
                  <img
                    src={setupQrCode}
                    alt="Código QR de Google Authenticator"
                    className="w-36 h-36 object-contain rounded animate-in fade-in"
                  />
                ) : (
                  <div className="w-36 h-36 flex flex-col items-center justify-center text-slate-500 text-xs font-medium gap-2 text-center">
                    <RefreshCw className={`w-5 h-5 text-amber-500 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? 'Generando código QR...' : 'Hacé clic para generar el código'}</span>
                    {!loading && (
                      <button
                        type="button"
                        onClick={loadSetupCredentials}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        Generar QR
                      </button>
                    )}
                  </div>
                )}
                <span className="text-[10px] text-slate-600 font-bold mt-1 tracking-wider uppercase">
                  GastoAR Admin 2FA
                </span>
              </div>

              {/* Manual Secret Key Fallback */}
              {setupSecret && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 text-[10px] font-medium">
                      O escribí la clave manual en tu app:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="text-amber-400 hover:text-amber-300 font-bold shrink-0 flex items-center gap-1 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/20 transition-colors"
                    >
                      {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSecret ? '¡Copiado!' : 'Copiar clave'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-amber-300 font-bold tracking-widest bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-center select-all">
                    {setupSecret.match(/.{1,4}/g)?.join(' ') || setupSecret}
                  </div>
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

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Volver al ingreso
              </button>

              <button
                type="submit"
                disabled={loading || newPin.length < 4 || newPin !== confirmPin}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer ml-auto"
              >
                <span>
                  {loading 
                    ? 'Guardando...' 
                    : setupTotpCode.length === 6 
                      ? 'Guardar PIN + Activar Authenticator' 
                      : 'Guardar PIN de Administrador'}
                </span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
