# Layout Fix — Cotizaciones + Flujo de Caja

## El problema
El widget de cotizaciones del dólar aparece completo (con grid de 6 tipos de cambio,
pizarrón, conversor y tarjeta externa) directo en el DashboardOverview,
ocupando todo el espacio y empujando la info financiera importante hacia abajo.

## La solución
Reemplazarlo por 2 botones compactos (`ProActionsBar`) que abren sus respectivos
modales/solapas cuando el usuario los necesita.

---

## Archivos nuevos (copiar a la raíz del proyecto)

- `ProActionsBar.tsx` — barra de 2 botones compactos (Dólar Blue + Flujo de Caja)
- `CurrencyModal.tsx` — modal completo de cotizaciones con pizarrón + conversor

---

## Cambios en DashboardOverview.tsx

### PASO 1 — Agregar imports al inicio del archivo

```tsx
// Agregar junto a los otros imports
import { ProActionsBar } from './ProActionsBar';
import { CurrencyModal } from './CurrencyModal';
```

### PASO 2 — Agregar props nuevas a la interface

```tsx
interface DashboardOverviewProps {
  // ... props existentes ...
  // ─── NUEVO ───────────────────────────
  isPro?: boolean;
  onOpenCashFlowTab?: () => void;   // navega a la solapa de Flujo de Caja
}
```

### PASO 3 — Agregar al destructuring del componente

```tsx
export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  // ... existentes ...
  isPro = false,          // ← NUEVO
  onOpenCashFlowTab,      // ← NUEVO
}) => {
```

### PASO 4 — Agregar estado del modal de cotizaciones

Dentro del componente, junto a los otros useState:

```tsx
const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
```

### PASO 5 — BUSCAR y ELIMINAR el bloque del widget de cotizaciones

Buscá en el JSX el bloque que empieza con algo como:

```tsx
{/* Cotizaciones del Dólar & Divisas */}
<div className="... bg-... rounded-...">
  <div className="flex items-center justify-between ...">
    ...EN VIVO...
    ...Actualizar...
    ...Pizarrón...
    ...Conversor...
    ...Tarjeta Ext...
  </div>
  {/* Gastos del mes en USD */}
  {/* Saldo disponible en USD */}
  {/* Grid de 6 cotizaciones */}
  ...
</div>
```

**Eliminar ese bloque completo.**

### PASO 6 — En su lugar, pegar el ProActionsBar + CurrencyModal

Exactamente donde estaba el widget eliminado, pegar:

```tsx
{/* ─── Acciones rápidas Pro (reemplaza widget de cotizaciones) ─── */}
{isPro && (
  <ProActionsBar
    isPro={isPro}
    availableBalanceArs={availableBalance}
    onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
    onOpenCashFlowTab={onOpenCashFlowTab || (() => {})}
    isBalanceHidden={isBalanceHidden}
  />
)}

{/* Modal de cotizaciones completo */}
<CurrencyModal
  isOpen={isCurrencyModalOpen}
  onClose={() => setIsCurrencyModalOpen(false)}
  availableBalanceArs={availableBalance}
  totalExpensesArs={totalExpenses}
  isBalanceHidden={isBalanceHidden}
/>
```

---

## Cambios en App.tsx

### Agregar la prop onOpenCashFlowTab al render de DashboardOverview

Buscá donde se renderiza `<DashboardOverview` y agregá:

```tsx
<DashboardOverview
  // ... props existentes ...
  isPro={userSubscription?.planId === 'pro'}   // o la lógica que ya tenés
  onOpenCashFlowTab={() => setActiveTab('cashflow')}  // navega a la solapa
/>
```

---

## Agregar la solapa de Flujo de Caja

Si tenés una navegación lateral (Sidebar) o inferior (MobileBottomNav),
agregá una entrada para "Flujo de Caja" que muestre el `CashFlowSection`.

### En Sidebar.tsx — agregar ítem

```tsx
{
  id: 'cashflow',
  label: 'Flujo de Caja',
  icon: <Activity className="w-4 h-4" />,
  badge: 'PRO',
  isPro: true,
}
```

### En App.tsx — agregar el render de la solapa

```tsx
{activeTab === 'cashflow' && isPro && (
  <CashFlowSection
    transactions={transactions}
    currentBalance={availableBalance}
    scheduledPayments={vencimientosToScheduled(vencimientos)}
    isPro={true}
  />
)}
```

---

## Resultado visual

### Antes
```
┌─────────────────────────────────────────────┐
│ Saldo disponible — $149.000          [19%]  │
└─────────────────────────────────────────────┘
┌────────────────┐ ┌────────────────┐
│ Límite diario  │ │ Prom. diario   │
└────────────────┘ └────────────────┘
┌─────────────────────────────────────────────┐  ← OCUPA TODA LA PANTALLA
│ 💵 Cotizaciones del Dólar & Divisas EN VIVO │
│ [Actualizar] [Pizarrón] [Conversor]         │
│ Gastos USD Blue: $95   Saldo USD MEP: $95   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │Dólar Blue│ │Dólar MEP │ │Dólar Tar.│     │
│ │  $1.540  │ │  $1.551  │ │  $1.944  │     │
│ └──────────┘ └──────────┘ └──────────┘     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │D. Oficial│ │D. Cripto │ │Euro Of.  │     │
│ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────┘
```

### Después
```
┌─────────────────────────────────────────────┐
│ Saldo disponible — $149.000          [19%]  │
└─────────────────────────────────────────────┘
┌────────────────┐ ┌────────────────┐
│ Límite diario  │ │ Prom. diario   │
└────────────────┘ └────────────────┘
┌─────────────────┐ ┌──────────────────┐   ← COMPACTO, 2 botones
│ 💵 Dólar Blue   │ │ 📊 Flujo de Caja │
│    $1.560       │ │ ¿Cuánto tendrás? │
│ Tu saldo≈USD 95 │ │ 7 / 15 / 30 días │
└─────────────────┘ └──────────────────┘
                         ↓ tap abre modal completo
```

## Por qué este diseño es mejor

1. **Jerarquía visual clara**: el saldo y KPIs financieros tienen protagonismo
2. **Cotizaciones on-demand**: el usuario las ve cuando las necesita, no siempre
3. **Flujo de caja como feature de primer nivel**: tiene su propia solapa, no un widget enterrado
4. **Menos scroll**: el dashboard cabe en una pantalla en mobile
5. **PRO badge visible**: los 2 botones tienen estética premium que comunica valor del plan
