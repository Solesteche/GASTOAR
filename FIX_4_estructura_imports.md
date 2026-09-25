# FIX 4 — Estructura de carpetas e imports consistentes

## El problema

Los archivos están mezclados en la raíz del repo:
- `DashboardOverview.tsx` → raíz
- `TransactionModal.tsx` → raíz  
- `scoreEngine.ts` → raíz
- `DailyScoreModal.tsx` → raíz
- PERO `App.tsx` importa algunos desde `./components/Header`, `./components/Sidebar`

Esto genera inconsistencia y va a romper imports a medida que el proyecto crece.

---

## Estructura objetivo

```
src/
├── App.tsx
├── main.tsx
├── firebase.ts
│
├── components/
│   ├── dashboard/
│   │   ├── DashboardOverview.tsx
│   │   └── DailyScoreModal.tsx
│   ├── transactions/
│   │   ├── TransactionModal.tsx
│   │   └── TransactionsTable.tsx    (si existe)
│   ├── budget/
│   │   ├── BudgetSection.tsx        (si existe)
│   │   └── BudgetModal.tsx          (si existe)
│   ├── vencimientos/
│   │   └── VencimientosSection.tsx  (si existe)
│   └── shared/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── Toast.tsx
│       └── BottomNav.tsx
│
├── hooks/
│   ├── useTransactions.ts
│   ├── useBudget.ts
│   └── useAuth.ts
│
├── services/
│   ├── firestore.ts
│   └── formatters.ts
│
├── utils/
│   └── scoreEngine.ts
│
└── types/
    └── index.ts
```

---

## PASO 1 — Script de migración

Corré esto desde la raíz del proyecto en la terminal:

```bash
#!/bin/bash
# migrate-structure.sh
# Correr desde la raíz del proyecto: bash migrate-structure.sh

mkdir -p src/components/dashboard
mkdir -p src/components/transactions
mkdir -p src/components/budget
mkdir -p src/components/vencimientos
mkdir -p src/components/shared
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/types

# Mover componentes principales
[ -f DashboardOverview.tsx ] && mv DashboardOverview.tsx src/components/dashboard/
[ -f DailyScoreModal.tsx   ] && mv DailyScoreModal.tsx   src/components/dashboard/
[ -f TransactionModal.tsx  ] && mv TransactionModal.tsx  src/components/transactions/
[ -f VoiceExpenseModal.tsx ] && mv VoiceExpenseModal.tsx src/components/transactions/

# Mover utilidades
[ -f scoreEngine.ts        ] && mv scoreEngine.ts        src/utils/
[ -f theme.ts              ] && mv theme.ts              src/utils/

# Mover tipos
[ -f types.ts              ] && mv types.ts              src/types/index.ts

# Mover servicios Firebase
[ -f firebase.ts           ] && mv firebase.ts           src/services/
[ -f firestore.ts          ] && mv firestore.ts          src/services/

echo "✅ Estructura migrada. Ahora actualizá los imports en App.tsx"
```

---

## PASO 2 — Actualizar imports en App.tsx

### ❌ BUSCAR en App.tsx (imports actuales desordenados):

```ts
import DashboardOverview from './DashboardOverview';
import { TransactionModal } from './TransactionModal';
import { DailyScoreModal } from './DailyScoreModal';
import { computeDailyFinancialScore } from './scoreEngine';
import { Transaction, CoupleProfile } from './types';
// Mezclados con:
import Header from './components/Header';
import Sidebar from './components/Sidebar';
```

### ✅ REEMPLAZAR POR (imports ordenados por dominio):

```ts
// ─── Tipos ────────────────────────────────────────────────────────────────────
import type { Transaction, CoupleProfile, Budgets, Vencimiento } from './types';

// ─── Servicios ────────────────────────────────────────────────────────────────
import { auth, db } from './services/firebase';
import { syncAppStateToFirestore, loadStateFromFirestore } from './services/firestore';

// ─── Utilidades ───────────────────────────────────────────────────────────────
import { computeDailyFinancialScore, getTodayDateString } from './utils/scoreEngine';

// ─── Componentes compartidos ──────────────────────────────────────────────────
import Header    from './components/shared/Header';
import Sidebar   from './components/shared/Sidebar';
import BottomNav from './components/shared/BottomNav';
import Toast     from './components/shared/Toast';

// ─── Dashboard ────────────────────────────────────────────────────────────────
import DashboardOverview from './components/dashboard/DashboardOverview';
import DailyScoreModal   from './components/dashboard/DailyScoreModal';

// ─── Transacciones ────────────────────────────────────────────────────────────
import { TransactionModal }  from './components/transactions/TransactionModal';
import { VoiceExpenseModal } from './components/transactions/VoiceExpenseModal';
```

---

## PASO 3 — Actualizar imports DENTRO de cada componente

Cada componente que fue movido necesita actualizar sus imports relativos.

### DashboardOverview.tsx (ahora en src/components/dashboard/)

```ts
// ❌ ANTES
import { computeDailyFinancialScore } from '../scoreEngine';
import type { Transaction } from '../types';

// ✅ DESPUÉS
import { computeDailyFinancialScore } from '../../utils/scoreEngine';
import type { Transaction } from '../../types';
```

### TransactionModal.tsx (ahora en src/components/transactions/)

```ts
// ❌ ANTES
import type { Transaction, CoupleProfile } from '../types';

// ✅ DESPUÉS
import type { Transaction, CoupleProfile } from '../../types';
```

### scoreEngine.ts (ahora en src/utils/)

```ts
// ❌ ANTES
import { Transaction, Budgets } from './types';

// ✅ DESPUÉS
import { Transaction, Budgets } from '../types';
```

---

## PASO 4 — Agregar path aliases en vite.config.ts (opcional pero muy recomendado)

Con aliases, en lugar de `../../types` escribís `@/types` desde cualquier lugar.

### vite.config.ts — AGREGAR:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### tsconfig.json — AGREGAR en compilerOptions:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Resultado — imports limpios desde cualquier componente:

```ts
// Desde cualquier archivo, sin importar dónde esté:
import type { Transaction } from '@/types';
import { computeDailyFinancialScore } from '@/utils/scoreEngine';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
```

---

## Orden de ejecución recomendado

1. Hacer commit de todo lo que tenés ahora (backup)
2. Correr `migrate-structure.sh`
3. Actualizar `vite.config.ts` y `tsconfig.json` con los aliases
4. Actualizar imports en `App.tsx`
5. Correr `npm run dev` — TypeScript va a marcar en rojo cada import roto
6. Ir archivo por archivo corrigiendo los paths según el paso 3
7. Correr `npm run build` — si compila sin errores, la migración está completa
