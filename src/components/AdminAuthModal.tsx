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
  Check
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
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'access' | 'set_pin'>('access');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [forceReset, setForceReset] = useState(false);
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean | null>(null);

  // Check admin status on modal open
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSuccessMsg('');
    setPin('');
    setNewPin('');
    setConfirmPin('');

    let isMounted = true;
    fetch('/api/auth/admin-status')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success) {
          setHasPinConfigured(Boolean(data.hasPinConfigured));
          if (!data.hasPinConfigured) {
            setMode('set_pin');
          }
        }
      })
      .catch(() => {
        if (isMounted) setHasPinConfigured(false);
      });

    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentEmail = auth.currentUser?.email?.toLowerCase().trim() || '';

  // Direct owner access (grants admin privileges immediately)
  const handleDirectAccess = async () => {
    setLoading(true);
    setError('');
    try {
      await fetch('/api/auth/admin-direct-access', { method: 'POST' }).catch(() => {});
      localStorage.setItem('control_gastos_is_admin', 'true');
      onSuccess();
      onClose();
    } catch {
      localStorage.setItem('control_gastos_is_admin', 'true');
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // MODE: Set / Update PIN
    if (mode === 'set_pin') {
      if (!newPin.trim() || newPin.trim().length < 4) {
        setError('El PIN debe tener al menos 4 caracteres.');
        return;
      }
      if (newPin !== confirmPin) {
        setError('Los PINs ingresados no coinciden.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/set-admin-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            newPin: newPin.trim(), 
            email: currentEmail || undefined,
            currentPin: pin.trim() || undefined,
            forceReset: forceReset || !hasPinConfigured,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg('¡Clave de administrador guardada exitosamente en la base de datos!');
          localStorage.setItem('control_gastos_is_admin', 'true');
          setNewPin('');
          setConfirmPin('');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        } else {
          setError(data.error || 'No se pudo guardar la nueva clave.');
        }
      } catch (err: any) {
        setError('Error al comunicar con el servidor.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // MODE: Access with PIN
    if (!pin.trim()) {
      setError('Por favor ingresá tu PIN de administrador.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pin: pin.trim(),
          email: currentEmail || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authorized) {
          localStorage.setItem('control_gastos_is_admin', 'true');
          onSuccess();
          onClose();
          return;
        }
      }

      const errData = await res.json().catch(() => null);
      if (errData?.setupNeeded) {
        setMode('set_pin');
        setError('No había ninguna clave configurada aún. Por favor definí tu nueva clave privada.');
      } else {
        setError(errData?.error || 'PIN de Administrador incorrecto.');
      }
    } catch {
      setError('No se pudo verificar la clave en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              Acceso a Administración
            </h3>
            <p className="text-xs text-slate-400">
              Panel privado de clientes, suscripciones y métricas
            </p>
          </div>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick direct access banner for the Owner (never get locked out) */}
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-purple-950/40 to-slate-900 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Acceso de Propietario</span>
            </span>
            <span className="text-[10px] text-slate-400">1 clic</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ingresá directamente al panel de control como administrador. Desde allí podrás gestionar clientes y configurar o cambiar tu PIN privado cuando quieras.
          </p>
          <button
            type="button"
            onClick={handleDirectAccess}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <Unlock className="w-4 h-4" />
            <span>Ingresar al Panel de Administrador</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => { setMode('access'); setError(''); setSuccessMsg(''); }}
            className={`pb-2 text-xs font-bold transition-colors cursor-pointer mr-4 ${
              mode === 'access' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Ingresar con PIN
          </button>
          <button
            type="button"
            onClick={() => { setMode('set_pin'); setError(''); setSuccessMsg(''); }}
            className={`pb-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              mode === 'set_pin' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Definir / Cambiar PIN</span>
          </button>
        </div>

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'access' ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Tu PIN de Administrador
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  placeholder="Ingresá tu PIN privado"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>La clave se valida contra la base de datos persistente.</span>
                <button
                  type="button"
                  onClick={() => { setMode('set_pin'); setForceReset(true); }}
                  className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                >
                  ¿No tenés PIN o querés cambiarlo?
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs">
                💡 <span className="font-semibold">Sin contraseñas en el código:</span> Tu PIN se guardará directamente en la base de datos del servidor y sólo vos tendrás acceso.
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Nuevo PIN de Administrador (mínimo 4 caracteres)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPin}
                    onChange={(e) => {
                      setNewPin(e.target.value);
                      setError('');
                    }}
                    placeholder="Elegí tu PIN secreto"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Confirmar Nuevo PIN
                </label>
                <div className="relative">
                  <Check className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPin}
                    onChange={(e) => {
                      setConfirmPin(e.target.value);
                      setError('');
                    }}
                    placeholder="Repetí el nuevo PIN"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                  />
                </div>
              </div>

              {hasPinConfigured && !forceReset && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      PIN actual (opcional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setForceReset(true)}
                      className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Restablecer sin PIN anterior
                    </button>
                  </div>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN anterior (si lo recordás)"
                    className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <span>
                {loading
                  ? 'Guardando...'
                  : mode === 'set_pin'
                  ? 'Guardar PIN y Entrar'
                  : 'Ingresar con PIN'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
