// MultiCurrencyEngine.ts
// Motor Multi-moneda USD / USDT / BTC — Feature exclusivo Plan Pro GastoAR
// Cotización en tiempo real vía API pública + fallback con cache

import { Transaction } from './types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SupportedCurrency = 'ARS' | 'USD_OFICIAL' | 'USD_BLUE' | 'USD_MEP' | 'USDT' | 'BTC';

export interface ExchangeRate {
  currency: SupportedCurrency;
  rateToBuy: number;     // ARS que cuesta comprar 1 unidad
  rateToSell: number;    // ARS que obtenés vendiendo 1 unidad
  label: string;
  emoji: string;
  fetchedAt: number;     // timestamp
  source: string;
}

export interface RatesCache {
  rates: Record<SupportedCurrency, ExchangeRate>;
  lastUpdated: number;
  isStale: boolean;
}

export interface MultiCurrencyTransaction extends Partial<Transaction> {
  originalCurrency: SupportedCurrency;
  originalAmount: number;
  arsEquivalent: number;       // monto convertido a ARS al momento del gasto
  rateApplied: number;         // cotización usada
  rateType: SupportedCurrency;
}

export interface NetWorthEntry {
  currency: SupportedCurrency;
  amount: number;
  arsValue: number;
  label: string;
  emoji: string;
  pctOfTotal: number;
}

export interface NetWorthSummary {
  entries: NetWorthEntry[];
  totalInArs: number;
  totalInUsd: number;
  breakdown: {
    ars: number;
    usdOfficial: number;
    usdBlue: number;
    usdMep: number;
    usdt: number;
    btc: number;
  };
}

// ─── Cache key localStorage ───────────────────────────────────────────────────

const CACHE_KEY = 'gastoar_exchange_rates_v2';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

// ─── Cotizaciones de fallback (se usan cuando la API falla) ──────────────────
// Actualizar manualmente con valores aproximados

const FALLBACK_RATES: Record<SupportedCurrency, Omit<ExchangeRate, 'fetchedAt' | 'source'>> = {
  ARS:          { currency: 'ARS',          rateToBuy: 1,       rateToSell: 1,       label: 'Peso Arg.',     emoji: '🇦🇷' },
  USD_OFICIAL:  { currency: 'USD_OFICIAL',   rateToBuy: 1060,    rateToSell: 1050,    label: 'Dólar Oficial', emoji: '🏦' },
  USD_BLUE:     { currency: 'USD_BLUE',      rateToBuy: 1150,    rateToSell: 1140,    label: 'Dólar Blue',    emoji: '💵' },
  USD_MEP:      { currency: 'USD_MEP',       rateToBuy: 1120,    rateToSell: 1110,    label: 'Dólar MEP',     emoji: '📊' },
  USDT:         { currency: 'USDT',          rateToBuy: 1145,    rateToSell: 1135,    label: 'USDT',          emoji: '₮'  },
  BTC:          { currency: 'BTC',           rateToBuy: 95000000, rateToSell: 94000000, label: 'Bitcoin',    emoji: '₿'  },
};

// ─── Motor ────────────────────────────────────────────────────────────────────

export class MultiCurrencyEngine {

  /**
   * Obtiene cotizaciones actualizadas.
   * Usa la API de bluelytics.com.ar (pública, sin key) con fallback en cache.
   */
  static async fetchRates(): Promise<RatesCache> {
    // Intentar desde cache primero
    const cached = MultiCurrencyEngine.getCachedRates();
    if (cached && !cached.isStale) return cached;

    try {
      // API pública de cotizaciones AR (no requiere auth)
      const res = await fetch('https://api.bluelytics.com.ar/v2/latest', {
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      const now = Date.now();

      const rates: Record<SupportedCurrency, ExchangeRate> = {
        ARS: { ...FALLBACK_RATES.ARS, fetchedAt: now, source: 'bluelytics' },
        USD_OFICIAL: {
          currency: 'USD_OFICIAL',
          rateToBuy:  data.oficial?.value_buy  ?? FALLBACK_RATES.USD_OFICIAL.rateToBuy,
          rateToSell: data.oficial?.value_sell ?? FALLBACK_RATES.USD_OFICIAL.rateToSell,
          label: 'Dólar Oficial', emoji: '🏦',
          fetchedAt: now, source: 'bluelytics',
        },
        USD_BLUE: {
          currency: 'USD_BLUE',
          rateToBuy:  data.blue?.value_buy  ?? FALLBACK_RATES.USD_BLUE.rateToBuy,
          rateToSell: data.blue?.value_sell ?? FALLBACK_RATES.USD_BLUE.rateToSell,
          label: 'Dólar Blue', emoji: '💵',
          fetchedAt: now, source: 'bluelytics',
        },
        USD_MEP: {
          currency: 'USD_MEP',
          rateToBuy:  (data.blue?.value_buy ?? FALLBACK_RATES.USD_BLUE.rateToBuy) * 0.975,
          rateToSell: (data.blue?.value_sell ?? FALLBACK_RATES.USD_BLUE.rateToSell) * 0.975,
          label: 'Dólar MEP', emoji: '📊',
          fetchedAt: now, source: 'bluelytics_estimated',
        },
        USDT: {
          currency: 'USDT',
          rateToBuy:  (data.blue?.value_buy ?? FALLBACK_RATES.USD_BLUE.rateToBuy) * 0.995,
          rateToSell: (data.blue?.value_sell ?? FALLBACK_RATES.USD_BLUE.rateToSell) * 0.995,
          label: 'USDT', emoji: '₮',
          fetchedAt: now, source: 'bluelytics_estimated',
        },
        BTC: {
          ...FALLBACK_RATES.BTC,
          fetchedAt: now, source: 'fallback',
        },
      };

      const cache: RatesCache = { rates, lastUpdated: now, isStale: false };
      MultiCurrencyEngine.saveRatesToCache(cache);
      return cache;

    } catch {
      // Fallback a cache viejo o valores hardcodeados
      const old = MultiCurrencyEngine.getCachedRates();
      if (old) return { ...old, isStale: true };

      const now = Date.now();
      const rates = Object.fromEntries(
        Object.entries(FALLBACK_RATES).map(([k, v]) => [k, { ...v, fetchedAt: now, source: 'fallback' }])
      ) as Record<SupportedCurrency, ExchangeRate>;
      return { rates, lastUpdated: now, isStale: true };
    }
  }

  /**
   * Convierte un monto de cualquier moneda a ARS
   */
  static toARS(
    amount: number,
    fromCurrency: SupportedCurrency,
    rates: Record<SupportedCurrency, ExchangeRate>,
    useSellingRate = false,
  ): number {
    if (fromCurrency === 'ARS') return amount;
    const rate = rates[fromCurrency];
    if (!rate) return amount;
    const r = useSellingRate ? rate.rateToSell : rate.rateToBuy;
    return Math.round(amount * r);
  }

  /**
   * Convierte ARS a otra moneda
   */
  static fromARS(
    arsAmount: number,
    toCurrency: SupportedCurrency,
    rates: Record<SupportedCurrency, ExchangeRate>,
  ): number {
    if (toCurrency === 'ARS') return arsAmount;
    const rate = rates[toCurrency];
    if (!rate || rate.rateToBuy === 0) return arsAmount;
    return arsAmount / rate.rateToBuy;
  }

  /**
   * Calcula el patrimonio neto multi-moneda
   */
  static calculateNetWorth(
    assets: Array<{ currency: SupportedCurrency; amount: number }>,
    rates: Record<SupportedCurrency, ExchangeRate>,
  ): NetWorthSummary {
    const entries: NetWorthEntry[] = assets.map(a => {
      const arsValue = MultiCurrencyEngine.toARS(a.amount, a.currency, rates, true);
      const rate = rates[a.currency];
      return {
        currency: a.currency,
        amount: a.amount,
        arsValue,
        label: rate?.label || a.currency,
        emoji: rate?.emoji || '💰',
        pctOfTotal: 0, // se calcula abajo
      };
    });

    const totalInArs = entries.reduce((s, e) => s + e.arsValue, 0);

    // Calcular porcentajes
    entries.forEach(e => {
      e.pctOfTotal = totalInArs > 0 ? Math.round((e.arsValue / totalInArs) * 100) : 0;
    });

    const usdRate = rates['USD_BLUE']?.rateToBuy || 1;

    return {
      entries: entries.sort((a, b) => b.arsValue - a.arsValue),
      totalInArs,
      totalInUsd: totalInArs / usdRate,
      breakdown: {
        ars:         entries.filter(e => e.currency === 'ARS').reduce((s, e) => s + e.arsValue, 0),
        usdOfficial: entries.filter(e => e.currency === 'USD_OFICIAL').reduce((s, e) => s + e.arsValue, 0),
        usdBlue:     entries.filter(e => e.currency === 'USD_BLUE').reduce((s, e) => s + e.arsValue, 0),
        usdMep:      entries.filter(e => e.currency === 'USD_MEP').reduce((s, e) => s + e.arsValue, 0),
        usdt:        entries.filter(e => e.currency === 'USDT').reduce((s, e) => s + e.arsValue, 0),
        btc:         entries.filter(e => e.currency === 'BTC').reduce((s, e) => s + e.arsValue, 0),
      },
    };
  }

  /**
   * Muestra el equivalente en USD de un gasto en ARS (para el detalle de transacción)
   */
  static arsToDisplayUSD(
    arsAmount: number,
    rates: Record<SupportedCurrency, ExchangeRate>,
    rateType: 'USD_BLUE' | 'USD_OFICIAL' | 'USD_MEP' = 'USD_BLUE',
  ): string {
    const usd = MultiCurrencyEngine.fromARS(arsAmount, rateType, rates);
    return `USD ${usd.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
  }

  // ── Cache ──────────────────────────────────────────────────────────────────

  private static saveRatesToCache(cache: RatesCache): void {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
  }

  private static getCachedRates(): RatesCache | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache: RatesCache = JSON.parse(raw);
      const isStale = Date.now() - cache.lastUpdated > CACHE_TTL_MS;
      return { ...cache, isStale };
    } catch { return null; }
  }
}
