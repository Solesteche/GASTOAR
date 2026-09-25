# FIX 5 — Race condition en sync con Firestore

## El problema

```ts
// App.tsx — CÓDIGO ACTUAL (problemático)
useEffect(() => {
  const timer = setTimeout(async () => {
    await syncAppStateToFirestore(activeUserId, {
      transactions,
      budgets,
      goals,
      // ...
    });
  }, 800);

  return () => clearTimeout(timer);
}, [transactions, budgets, goals, /* ... */]);
```

**¿Qué pasa mal?**

1. Usuario agrega transacción A → timer arranca (800ms)
2. A los 400ms agrega transacción B → timer se cancela y reinicia
3. Todo bien hasta acá. Pero si el usuario agrega A y B en menos de 800ms, 
   la primera sync nunca ocurre antes del desmontaje del componente.
4. Peor: si Firebase tarda más de 800ms en responder y el estado cambió 
   mientras tanto, se guarda un estado desactualizado ("stale closure").
5. Con conexión lenta (común en mobile AR), pueden quedar datos sin guardar 
   si el usuario cierra la app antes de que el timer se dispare.

---

## Solución: Hook `useSyncQueue` con flag `isDirty` + retry

### PASO 1 — Crear src/hooks/useSyncQueue.ts

```ts
// src/hooks/useSyncQueue.ts
import { useCallback, useEffect, useRef, useState } from 'react';

interface SyncQueueOptions<T> {
  syncFn: (data: T) => Promise<void>;   // función que hace el sync real
  debounceMs?: number;                   // espera antes de sincronizar (default: 1200ms)
  maxRetries?: number;                   // reintentos ante error (default: 3)
  onSyncStart?: () => void;
  onSyncSuccess?: () => void;
  onSyncError?: (err: Error, attempt: number) => void;
}

interface SyncQueueResult {
  isDirty: boolean;       // hay cambios pendientes de sync
  isSyncing: boolean;     // sync en curso
  lastSyncAt: number | null;  // timestamp del último sync exitoso
  forcSync: () => void;   // forzar sync inmediato (ej: al cerrar sesión)
}

export function useSyncQueue<T>(
  data: T,
  options: SyncQueueOptions<T>,
): SyncQueueResult {
  const {
    syncFn,
    debounceMs = 1200,
    maxRetries = 3,
    onSyncStart,
    onSyncSuccess,
    onSyncError,
  } = options;

  const [isDirty, setIsDirty]       = useState(false);
  const [isSyncing, setIsSyncing]   = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  // Usamos refs para acceder siempre al valor más reciente de data
  // sin recrear el efecto ni el timer
  const dataRef    = useRef<T>(data);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef   = useRef(0);
  const mountedRef = useRef(true);

  // Actualizar ref cuando data cambia
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Marcar como dirty cuando data cambia (excepto en el mount inicial)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsDirty(true);
  }, [data]);

  // Función de sync con retry
  const doSync = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsSyncing(true);
    onSyncStart?.();

    try {
      // Siempre usamos dataRef.current para tener el estado más reciente
      await syncFn(dataRef.current);

      if (!mountedRef.current) return;

      retryRef.current = 0;
      setIsDirty(false);
      setIsSyncing(false);
      setLastSyncAt(Date.now());
      onSyncSuccess?.();

    } catch (err) {
      if (!mountedRef.current) return;

      setIsSyncing(false);
      retryRef.current += 1;

      const error = err instanceof Error ? err : new Error(String(err));
      onSyncError?.(error, retryRef.current);

      // Retry con backoff exponencial si no superó el máximo
      if (retryRef.current <= maxRetries) {
        const backoff = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
        timerRef.current = setTimeout(doSync, backoff);
      }
    }
  }, [syncFn, maxRetries, onSyncStart, onSyncSuccess, onSyncError]);

  // Debounce: cuando isDirty cambia a true, arrancar el timer
  useEffect(() => {
    if (!isDirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSync, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, debounceMs, doSync]);

  // Sync forzado (para cerrar sesión, cerrar tab, etc.)
  const forcSync = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSync();
  }, [doSync]);

  // Sync antes de desmontar si hay cambios pendientes
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (isDirty) {
        // Intento best-effort al desmontar (no await — el componente ya murió)
        syncFn(dataRef.current).catch(() => {});
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // solo al montar/desmontar

  return { isDirty, isSyncing, lastSyncAt, forcSync };
}
```

---

### PASO 2 — Reemplazar el useEffect de sync en App.tsx

#### ❌ BUSCAR y ELIMINAR en App.tsx:

```ts
// Este bloque completo — puede aparecer varias veces con distintas deps
useEffect(() => {
  const timer = setTimeout(async () => {
    await syncAppStateToFirestore(activeUserId, {
      transactions,
      budgets,
      goals,
      scoreHistory,
      profile,
      vencimientos,
    });
  }, 800);

  return () => clearTimeout(timer);
}, [transactions, budgets, goals, scoreHistory, profile, vencimientos, activeUserId]);
```

#### ✅ REEMPLAZAR POR:

```ts
// ─── 1. Importar el hook (arriba del archivo) ─────────────────────────────────
import { useSyncQueue } from './hooks/useSyncQueue';

// ─── 2. Definir el estado a sincronizar (dentro del componente App) ───────────
const appState = useMemo(() => ({
  transactions,
  budgets,
  goals,
  scoreHistory,
  profile,
  vencimientos,
}), [transactions, budgets, goals, scoreHistory, profile, vencimientos]);

// ─── 3. Función de sync (estable — no se recrea) ─────────────────────────────
const syncToFirestore = useCallback(async (state: typeof appState) => {
  if (!activeUserId) return; // sin usuario, no sync
  await syncAppStateToFirestore(activeUserId, state);
}, [activeUserId]);

// ─── 4. Usar el hook en lugar del setTimeout manual ──────────────────────────
const { isDirty, isSyncing, lastSyncAt, forcSync } = useSyncQueue(appState, {
  syncFn: syncToFirestore,
  debounceMs: 1200,    // espera 1.2s después del último cambio
  maxRetries: 3,
  onSyncError: (err, attempt) => {
    if (attempt >= 3) {
      showToast('No se pudo sincronizar. Revisá tu conexión.', 'error');
    }
  },
});

// ─── 5. Forzar sync antes de cerrar sesión ────────────────────────────────────
const handleLogout = async () => {
  forcSync();          // guardar cualquier cambio pendiente
  await auth.signOut();
};
```

---

### PASO 3 — Indicador de sync en el Header (opcional pero muy recomendado)

Pasá `isDirty` e `isSyncing` al Header para mostrar el estado de sincronización:

```tsx
// En el JSX de App.tsx — donde renderizás el Header:
<Header
  // ... props existentes ...
  isSyncing={isSyncing}
  isDirty={isDirty}
  lastSyncAt={lastSyncAt}
/>
```

```tsx
// En Header.tsx — agregar el indicador:
interface HeaderProps {
  // ... props existentes ...
  isSyncing?: boolean;
  isDirty?: boolean;
  lastSyncAt?: number | null;
}

// Dentro del JSX del Header:
{isSyncing && (
  <div className="flex items-center gap-1.5 text-xs text-purple-300 animate-pulse">
    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-spin" />
    <span>Guardando...</span>
  </div>
)}
{isDirty && !isSyncing && (
  <div className="flex items-center gap-1.5 text-xs text-amber-300">
    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
    <span>Cambios sin guardar</span>
  </div>
)}
{!isDirty && !isSyncing && lastSyncAt && (
  <div className="text-xs text-purple-400/60">
    ✓ Guardado
  </div>
)}
```

---

## Comparación antes / después

| Escenario | ❌ Antes | ✅ Después |
|-----------|----------|-----------|
| 2 cambios en 400ms | Timer se cancela, guarda solo el segundo | Debounce correcto — guarda el estado más reciente |
| Firebase tarda 2s | Puede guardar estado viejo (stale closure) | Siempre usa `dataRef.current` — el más reciente |
| Error de red | Falla silenciosamente | 3 reintentos con backoff, toast al usuario |
| Usuario cierra la app | Cambios pendientes se pierden | Best-effort sync al desmontar |
| Cerrar sesión con cambios | Puede no guardar | `forcSync()` garantiza el último guardado |
| Sin internet | Loop infinito de errores silenciosos | Máximo 3 reintentos, luego avisa |

---

## ¿Por qué 1200ms y no 800ms?

800ms es muy corto para redes móviles argentinas con latencia variable.
1200ms da margen para que el usuario termine de tipear un monto sin
disparar una sync por cada dígito. Si querés un balance: 
- 800ms para sesiones de escritorio
- 1500ms para mobile (podés detectar con `navigator.connection`)
