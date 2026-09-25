// src/hooks/useSyncQueue.ts
// Hook para sincronización con Firestore sin race conditions
// Reemplaza el setTimeout manual en App.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SyncQueueOptions<T> {
  /** Función async que hace el sync real (ej: escribir en Firestore) */
  syncFn: (data: T) => Promise<void>;
  /** Milisegundos de espera después del último cambio antes de sync. Default: 1200 */
  debounceMs?: number;
  /** Máximo de reintentos ante error de red. Default: 3 */
  maxRetries?: number;
  /** Callback cuando el sync arranca */
  onSyncStart?: () => void;
  /** Callback cuando el sync termina exitosamente */
  onSyncSuccess?: () => void;
  /** Callback cuando el sync falla — recibe el error y el número de intento */
  onSyncError?: (err: Error, attempt: number) => void;
}

interface SyncQueueResult {
  /** true si hay cambios pendientes que aún no se sincronizaron */
  isDirty: boolean;
  /** true si hay un sync en curso */
  isSyncing: boolean;
  /** Timestamp del último sync exitoso (null si nunca ocurrió) */
  lastSyncAt: number | null;
  /** Forzar sync inmediato — usar antes de cerrar sesión o cerrar app */
  forcSync: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

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

  // Ref al dato más reciente — evita stale closures
  const dataRef    = useRef<T>(data);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef   = useRef(0);
  const mountedRef = useRef(true);

  // Mantener ref sincronizado con el dato actual
  useEffect(() => {
    dataRef.current = data;
  });

  // Detectar cambios post-mount y marcar dirty
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsDirty(true);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Función de sync con retry exponencial ────────────────────────────────────
  const doSync = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsSyncing(true);
    onSyncStart?.();

    try {
      // Siempre usar dataRef.current para tener el estado más reciente,
      // no el que estaba en el closure cuando se creó el timer
      await syncFn(dataRef.current);

      if (!mountedRef.current) return;

      retryRef.current = 0;
      setIsDirty(false);
      setIsSyncing(false);
      setLastSyncAt(Date.now());
      onSyncSuccess?.();

    } catch (rawErr) {
      if (!mountedRef.current) return;

      setIsSyncing(false);
      retryRef.current += 1;

      const err = rawErr instanceof Error ? rawErr : new Error(String(rawErr));
      onSyncError?.(err, retryRef.current);

      // Retry con backoff exponencial: 2s, 4s, 8s...
      if (retryRef.current <= maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, retryRef.current), 30_000);
        timerRef.current = setTimeout(doSync, backoffMs);
      }
      // Si superó maxRetries, se detiene — el usuario fue notificado por onSyncError
    }
  }, [syncFn, maxRetries, onSyncStart, onSyncSuccess, onSyncError]);

  // ── Debounce: arrancar timer cuando hay cambios pendientes ───────────────────
  useEffect(() => {
    if (!isDirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSync, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, debounceMs, doSync]);

  // ── Sync forzado — para usar antes de cerrar sesión ─────────────────────────
  const forcSync = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isDirty || isSyncing) doSync();
  }, [doSync, isDirty, isSyncing]);

  // ── Cleanup al desmontar — best-effort sync si hay cambios ──────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      // Intento best-effort al desmontar (sin await — el componente ya murió)
      if (isDirty) {
        syncFn(dataRef.current).catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { isDirty, isSyncing, lastSyncAt, forcSync };
}
