# Fix: aislamiento de datos Demo vs usuarios reales

Cambios principales:
- Los datos locales de transacciones, presupuesto, categorías, metas, perfil, suscripciones y vencimientos ahora se guardan con namespace por `userId`.
- La Demo conserva sus datos de prueba en las claves globales existentes.
- Un usuario real nuevo arranca con:
  - transacciones vacías
  - presupuesto vacío
  - metas vacías
  - vencimientos vacíos
  - historial de liquidaciones vacío
  - categorías estándar sin movimientos demo
- El primer snapshot de Firestore es autoritativo y ya no se mezcla con datos que hayan quedado de otra cuenta o de la Demo.
- Si una cuenta nueva no tiene documento de estado en Firestore, se inicializa en blanco y recién después se habilita la sincronización.
- Se agregó `vencimientos` al estado sincronizado con Firestore.
- `DashboardOverview` ya no muestra `DEFAULT_GOALS` a usuarios reales cuando todavía no tienen metas.
- Se mantuvo la Demo con sus datos precargados.

Archivos modificados:
- `src/App.tsx`
- `src/lib/firebase.ts`
- `src/components/DashboardOverview.tsx`

Validación:
- TypeScript no reportó errores propios de estos cambios; la comprobación completa del proyecto queda limitada porque el ZIP no contiene `node_modules` y la instalación de dependencias agotó el tiempo disponible.
