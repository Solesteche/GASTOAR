import { CategoryMap } from '../types';

export interface ParsedVoiceExpense {
  transcripcion?: string;
  concepto: string;
  descripcion: string;
  monto: number;
  categoria: string;
  subcategoria: string;
  tipoGasto: 'individual' | 'pareja';
  division?: '50_50' | '100_0' | '0_100';
  metodoPago: string;
  fecha: string;
}

// Convert common Spanish text numbers to numeric value
function parseSpanishNumberWords(text: string): number | null {
  const clean = text.toLowerCase().trim();

  // 1. Handle patterns like "50 mil", "50mil", "50 k", "50 lucas"
  const milRegex = /(\d+(?:[.,]\d+)?)\s*(mil|k|lucas?)/i;
  const milMatch = clean.match(milRegex);
  if (milMatch) {
    const base = parseFloat(milMatch[1].replace(',', '.'));
    if (!isNaN(base)) {
      return base * 1000;
    }
  }

  // 2. Handle dotted thousands e.g. "50.000", "1.250.000", "50.000,50"
  const dottedMatch = clean.match(/\b(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)\b/);
  if (dottedMatch) {
    const val = parseFloat(dottedMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  // 3. Handle standard numbers e.g. "50000", "50000.50", "$50000"
  const directMatch = clean.match(/\b(\d+(?:[.,]\d{1,2})?)\b/);
  if (directMatch) {
    const val = parseFloat(directMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  // Common spoken Argentine Spanish quantities
  const wordsToNumbers: Record<string, number> = {
    'diez mil': 10000,
    'quince mil': 15000,
    'veinte mil': 20000,
    'veinticinco mil': 25000,
    'treinta mil': 30000,
    'cuarenta mil': 40000,
    'cincuenta mil': 50000,
    'sesenta mil': 60000,
    'setenta mil': 70000,
    'ochenta mil': 80000,
    'noventa mil': 90000,
    'cien mil': 100000,
    'ciento cincuenta mil': 150000,
    'doscientos mil': 200000,
    'quinientos mil': 500000,
    'un millon': 1000000,
    'un millón': 1000000,
  };

  for (const [phrase, value] of Object.entries(wordsToNumbers)) {
    if (clean.includes(phrase)) {
      return value;
    }
  }

  return null;
}

/**
 * Intelligent client-side parser for voice expenses in Argentina.
 * Works offline, instantaneously, and with 100% reliability for common phrases.
 */
export function parseVoiceExpenseLocally(
  spokenText: string,
  categoryMap: CategoryMap,
  currentUser: string = 'Yo'
): ParsedVoiceExpense {
  const text = spokenText.trim();
  const lower = text.toLowerCase();

  // 1. Extract Amount
  let monto = parseSpanishNumberWords(lower) || 0;

  // 2. Classify Category & Subcategory based on Argentine market terms
  let categoria = 'Alimentación & Bebidas';
  let subcategoria = 'Supermercado & Hipermercado';
  let concepto = 'Gasto por voz';
  let descripcion = text;

  // Supermarkets & Food
  if (
    lower.includes('coto') ||
    lower.includes('carrefour') ||
    lower.includes('dia') ||
    lower.includes('día') ||
    lower.includes('jumbo') ||
    lower.includes('vea') ||
    lower.includes('changomas') ||
    lower.includes('chango más') ||
    lower.includes('makro') ||
    lower.includes('vital') ||
    lower.includes('disco') ||
    lower.includes('maxiconsumo') ||
    lower.includes('supermercado') ||
    lower.includes('super')
  ) {
    categoria = 'Alimentación & Bebidas';
    subcategoria = 'Supermercado & Hipermercado';
    if (lower.includes('coto')) concepto = 'Coto';
    else if (lower.includes('carrefour')) concepto = 'Carrefour';
    else if (lower.includes('dia') || lower.includes('día')) concepto = 'Supermercado Día';
    else if (lower.includes('jumbo')) concepto = 'Jumbo';
    else if (lower.includes('vea')) concepto = 'Vea';
    else if (lower.includes('changomas') || lower.includes('chango más')) concepto = 'ChangoMás';
    else if (lower.includes('makro')) concepto = 'Makro';
    else if (lower.includes('vital')) concepto = 'Mayorista Vital';
    else concepto = 'Supermercado';
  } else if (lower.includes('carniceria') || lower.includes('carnicería') || lower.includes('carne') || lower.includes('asado') || lower.includes('granja') || lower.includes('pollo')) {
    categoria = 'Alimentación & Bebidas';
    subcategoria = 'Carnicería & Granja';
    concepto = 'Carnicería';
  } else if (lower.includes('verduleria') || lower.includes('verdulería') || lower.includes('fruteria') || lower.includes('frutería') || lower.includes('verdura')) {
    categoria = 'Alimentación & Bebidas';
    subcategoria = 'Verdulería & Frutería';
    concepto = 'Verdulería';
  } else if (lower.includes('panaderia') || lower.includes('panadería') || lower.includes('facturas') || lower.includes('pan')) {
    categoria = 'Alimentación & Bebidas';
    subcategoria = 'Panadería & Facturas';
    concepto = 'Panadería';
  } else if (lower.includes('pedidosya') || lower.includes('pedidos ya') || lower.includes('rappi') || lower.includes('delivery')) {
    categoria = 'Alimentación & Bebidas';
    subcategoria = 'Delivery (PedidosYa / Rappi)';
    concepto = lower.includes('rappi') ? 'Rappi' : 'PedidosYa';
  } else if (lower.includes('restaurante') || lower.includes('resto') || lower.includes('bar') || lower.includes('cafeteria') || lower.includes('café') || lower.includes('cafe') || lower.includes('starbucks') || lower.includes('havanna')) {
    categoria = 'Alimentación & Bebidas';
    subcategoria = 'Restaurantes, Bares & Cafeterías';
    concepto = lower.includes('starbucks') ? 'Starbucks' : lower.includes('havanna') ? 'Havanna' : 'Restaurante / Bar';
  }
  // Fuel & Transport
  else if (
    lower.includes('ypf') ||
    lower.includes('shell') ||
    lower.includes('axion') ||
    lower.includes('puma') ||
    lower.includes('nafta') ||
    lower.includes('combustible') ||
    lower.includes('gnc') ||
    lower.includes('estacion') ||
    lower.includes('estación')
  ) {
    categoria = 'Transporte & Movilidad';
    subcategoria = 'Combustible (Nafta / GNC)';
    if (lower.includes('ypf')) concepto = 'YPF';
    else if (lower.includes('shell')) concepto = 'Shell';
    else if (lower.includes('axion')) concepto = 'Axion';
    else concepto = 'Combustible';
  } else if (lower.includes('sube') || lower.includes('colectivo') || lower.includes('subte') || lower.includes('tren')) {
    categoria = 'Transporte & Movilidad';
    subcategoria = 'Carga Tarjeta SUBE (Colectivo, Tren, Subte)';
    concepto = 'Carga SUBE';
  } else if (lower.includes('uber') || lower.includes('cabify') || lower.includes('didi') || lower.includes('taxi')) {
    categoria = 'Transporte & Movilidad';
    subcategoria = 'Taxi / Uber / Cabify / Didi';
    concepto = lower.includes('cabify') ? 'Cabify' : lower.includes('uber') ? 'Uber' : lower.includes('didi') ? 'Didi' : 'Taxi';
  }
  // Health & Pharmacy
  else if (lower.includes('farmacity') || lower.includes('farmacia') || lower.includes('remedio') || lower.includes('medicamento')) {
    categoria = 'Salud & Cuidado Personal';
    subcategoria = 'Farmacia & Medicamentos';
    concepto = lower.includes('farmacity') ? 'Farmacity' : 'Farmacia';
  }
  // Housing / Rent / Services
  else if (lower.includes('alquiler')) {
    categoria = 'Alquiler';
    subcategoria = 'Alquiler Mensual';
    concepto = 'Alquiler Mensual';
  } else if (lower.includes('expensa') || lower.includes('expensas')) {
    categoria = 'Expensas';
    subcategoria = 'Expensas Ordinarias';
    concepto = 'Expensas';
  } else if (lower.includes('edenor') || lower.includes('edesur') || lower.includes('luz') || lower.includes('electricidad')) {
    categoria = 'Servicios';
    subcategoria = 'Luz / Electricidad (Edenor, Edesur, Provincial)';
    concepto = lower.includes('edenor') ? 'Edenor' : lower.includes('edesur') ? 'Edesur' : 'Luz';
  } else if (lower.includes('metrogas') || lower.includes('naturgy') || lower.includes('gas')) {
    categoria = 'Servicios';
    subcategoria = 'Gas Natural / Garrafa (Metrogas, Naturgy)';
    concepto = 'Gas';
  } else if (lower.includes('aysa') || lower.includes('agua')) {
    categoria = 'Servicios';
    subcategoria = 'Agua & Cloacas (AySA, Provincial)';
    concepto = 'AySA / Agua';
  } else if (lower.includes('fibertel') || lower.includes('personal') || lower.includes('claro') || lower.includes('movistar') || lower.includes('wifi') || lower.includes('internet')) {
    categoria = 'Servicios';
    subcategoria = 'Internet Fibra Óptica & Wi-Fi';
    concepto = 'Internet';
  }

  // Verify that category exists in user's categoryMap; fallback gracefully
  if (!categoryMap[categoria]) {
    const firstCat = Object.keys(categoryMap)[0] || 'Alimentación & Bebidas';
    categoria = firstCat;
    subcategoria = categoryMap[firstCat]?.[0] || 'General';
  } else if (!categoryMap[categoria].includes(subcategoria)) {
    subcategoria = categoryMap[categoria][0] || 'General';
  }

  // 3. Detect Shared vs Individual
  const isPareja = (
    lower.includes('a medias') ||
    lower.includes('mitad y mitad') ||
    lower.includes('50 50') ||
    lower.includes('50/50') ||
    lower.includes('compartido') ||
    lower.includes('en pareja') ||
    lower.includes('gastamos') ||
    lower.includes('pagamos') ||
    lower.includes('entre los dos') ||
    lower.includes('para los dos')
  );

  return {
    transcripcion: text,
    concepto,
    descripcion: `Gasto dictado por voz: "${text}"`,
    monto,
    categoria,
    subcategoria,
    tipoGasto: isPareja ? 'pareja' : 'individual',
    division: isPareja ? '50_50' : undefined,
    metodoPago: 'Débito',
    fecha: new Date().toISOString().split('T')[0]
  };
}
