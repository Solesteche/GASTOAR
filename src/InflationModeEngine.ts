// InflationModeEngine.ts
// Motor de Modo Inflación IPC — Feature exclusivo Plan Pro GastoAR
// Ajusta presupuestos por categoría según inflación real o estimada por rubro

import { Budgets, CategoryMap } from './types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface IPCData {
  month: string;           // "YYYY-MM"
  generalRate: number;     // ej: 0.042 = 4.2% mensual
  byCategory: Record<string, number>; // tasa por categoría
  source: 'indec_real' | 'estimated';
  fetchedAt: number;       // timestamp
}

export interface InflationSettings {
  enabled: boolean;
  mode: 'auto_ipc' | 'manual_rate' | 'per_category';
  manualRate: number;      // % mensual manual, ej: 4.5
  perCategoryRates: Record<string, number>; // % por categoría
  autoAdjustDay: number;   // día del mes para ajuste automático (ej: 1)
  lastAdjustedMonth: string; // "YYYY-MM"
  accumulatedSinceDate: string; // desde cuándo acumula
  showRealValueWarning: boolean;
}

export interface BudgetProjection {
  category: string;
  currentBudget: number;
  projectedBudget: number;
  inflationRate: number;     // % aplicado
  delta: number;             // diferencia en pesos
  realValueLoss: number;     // % de pérdida de poder adquisitivo si no ajusta
  recommendation: 'adjust_now' | 'adjust_soon' | 'ok';
}

export interface InflationReport {
  month: string;
  generalRate: number;
  projections: BudgetProjection[];
  totalCurrentBudget: number;
  totalProjectedBudget: number;
  totalDelta: number;
  appliedAt?: number;
}

// ─── Tasas IPC estimadas por rubro (INDEC - referencia mensual AR 2025/2026) ──
// Estas son tasas de referencia. En producción, fetchear de la API del INDEC
// o de una API propia que las actualice mensualmente.

export const IPC_CATEGORY_RATES: Record<string, number> = {
  // Alimentos y bebidas — suben más que el promedio
  'Alimentación':                  0.052,
  'Alimentación & Bebidas':        0.052,
  'Supermercado':                  0.052,
  'Alimentos':                     0.052,

  // Indumentaria — ajustes estacionales
  'Ropa & Calzado':                0.038,
  'Indumentaria & Calzado':        0.038,

  // Vivienda y servicios — regulados, suben por decisión gubernamental
  'Hogar':                         0.045,
  'Servicios & Hogar':             0.045,
  'Alquiler':                      0.055, // indexado por ICL generalmente
  'Expensas':                      0.048,

  // Servicios públicos y comunicaciones
  'Servicios':                     0.043,

  // Transporte
  'Transporte':                    0.041,
  'Transporte & Movilidad':        0.041,
  'Movilidad & Transporte':        0.041,

  // Salud — medicamentos suben mucho
  'Salud':                         0.058,
  'Salud & Cuidado Personal':      0.058,
  'Farmacia & Salud':              0.058,

  // Entretenimiento y ocio
  'Entretenimiento':               0.035,
  'Entretenimiento, Ocio & Salidas': 0.035,
  'Ocio & Suscripciones':          0.032,
  'Restaurantes & Bares':          0.048,
  'Restaurantes':                  0.048,

  // Educación — ajustes por ciclo lectivo
  'Educación':                     0.044,
  'Educación & Formación':         0.044,

  // Tecnología — dolarizado
  'Tecnología, Electro & Bazar':   0.028, // dolarizado, sube menos en % ARS

  // Mascotas
  'Mascotas':                      0.046,

  // Default para categorías no mapeadas
  'Otros':                         0.042,
  'Otros Gastos':                  0.042,
};

export const IPC_GENERAL_RATE = 0.042; // 4.2% mensual estimado (referencia)

// ─── Motor principal ──────────────────────────────────────────────────────────

export class InflationModeEngine {

  /**
   * Calcula las proyecciones de presupuesto ajustadas por inflación
   */
  static calculateProjections(
    budgets: Budgets,
    settings: InflationSettings,
    monthsAhead = 1,
  ): InflationReport {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const month = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

    const projections: BudgetProjection[] = [];
    let totalCurrent = 0;
    let totalProjected = 0;

    Object.entries(budgets.categories || {}).forEach(([category, currentBudget]) => {
      const budget = Number(currentBudget) || 0;
      if (budget <= 0) return;

      // Obtener tasa para esta categoría
      let monthlyRate = 0;
      if (settings.mode === 'manual_rate') {
        monthlyRate = settings.manualRate / 100;
      } else if (settings.mode === 'per_category') {
        monthlyRate = (settings.perCategoryRates[category] ?? settings.manualRate) / 100;
      } else {
        // auto_ipc: usar tasas por rubro
        monthlyRate = IPC_CATEGORY_RATES[category] ?? IPC_GENERAL_RATE;
      }

      // Proyección compuesta para N meses
      const compoundFactor = Math.pow(1 + monthlyRate, monthsAhead);
      const projectedBudget = Math.round(budget * compoundFactor);
      const delta = projectedBudget - budget;
      const realValueLoss = Math.round(((compoundFactor - 1) / compoundFactor) * 100 * 10) / 10;

      // Recomendación
      let recommendation: BudgetProjection['recommendation'];
      if (monthlyRate >= 0.04) recommendation = 'adjust_now';
      else if (monthlyRate >= 0.02) recommendation = 'adjust_soon';
      else recommendation = 'ok';

      projections.push({
        category,
        currentBudget: budget,
        projectedBudget,
        inflationRate: Math.round(monthlyRate * 1000) / 10, // % con 1 decimal
        delta,
        realValueLoss,
        recommendation,
      });

      totalCurrent += budget;
      totalProjected += projectedBudget;
    });

    return {
      month,
      generalRate: settings.mode === 'manual_rate'
        ? settings.manualRate
        : Math.round(IPC_GENERAL_RATE * 1000) / 10,
      projections: projections.sort((a, b) => b.delta - a.delta),
      totalCurrentBudget: totalCurrent,
      totalProjectedBudget: totalProjected,
      totalDelta: totalProjected - totalCurrent,
    };
  }

  /**
   * Aplica el ajuste — devuelve el objeto Budgets actualizado
   */
  static applyAdjustment(
    budgets: Budgets,
    report: InflationReport,
    categoriesToAdjust?: string[], // null = ajustar todas
  ): Budgets {
    const newCategories = { ...budgets.categories };
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');

    report.projections.forEach(p => {
      if (categoriesToAdjust && !categoriesToAdjust.includes(p.category)) return;
      newCategories[p.category] = p.projectedBudget;
    });

    return {
      ...budgets,
      categories: newCategories,
      projectionGrowthPercent: report.generalRate,
      lastProjectedDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    };
  }

  /**
   * Calcula la pérdida acumulada de poder adquisitivo desde una fecha
   */
  static calculateAccumulatedLoss(
    monthlyRates: number[], // array de tasas mensuales ej: [4.2, 3.8, 5.1]
  ): number {
    const compound = monthlyRates.reduce((acc, rate) => acc * (1 + rate / 100), 1);
    return Math.round((compound - 1) * 100 * 10) / 10;
  }

  /**
   * Genera el mensaje contextual para mostrar al usuario
   */
  static generateInsight(report: InflationReport): string {
    const pct = Math.round(((report.totalProjectedBudget / report.totalCurrentBudget) - 1) * 100);
    const delta = report.totalDelta.toLocaleString('es-AR');
    const cat = report.projections[0]?.category || '';
    return `Con una inflación estimada del ${report.generalRate}% mensual, ` +
      `tu presupuesto necesita un ajuste de $${delta} (+${pct}%). ` +
      `La categoría más afectada es ${cat}.`;
  }

  /**
   * Verifica si corresponde hacer ajuste automático este mes
   */
  static shouldAutoAdjust(settings: InflationSettings): boolean {
    if (!settings.enabled) return false;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const currentMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    if (settings.lastAdjustedMonth === currentMonth) return false;
    return now.getDate() >= settings.autoAdjustDay;
  }

  /**
   * Valores por defecto para la configuración inicial
   */
  static defaultSettings(): InflationSettings {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      enabled: false,
      mode: 'auto_ipc',
      manualRate: 4.2,
      perCategoryRates: {},
      autoAdjustDay: 1,
      lastAdjustedMonth: '',
      accumulatedSinceDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
      showRealValueWarning: true,
    };
  }
}
