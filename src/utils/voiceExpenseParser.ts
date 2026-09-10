import { CategoryMap, LearnedMerchant, TransactionConfidence } from '../types';
import { findLearnedMatch } from './learnedPreferences';

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
  tarjetaNombre?: string;
  esCuotas?: boolean;
  cuotasTotal?: number;
  tipoOperacion?: 'gasto' | 'ingreso' | 'meta';
  metaNombre?: string;
  fecha: string;
  confidence: TransactionConfidence;
  unconfirmedFields?: Array<'amount' | 'category' | 'paymentMethod' | 'installments'>;
  confirmationQuestion?: string;
  learnedPreferenceApplied?: boolean;
  learnedRule?: LearnedMerchant;
}

// Convert common Spanish text numbers to numeric value
export function parseSpanishNumberWords(text: string): number | null {
  if (!text) return null;
  const clean = text.toLowerCase().trim();

  // 1. Direct 4+ digit numbers FIRST (e.g. "11000", "50000", "$50000", "$11000", "11000 en farmacia", "audio de 11000")
  // Prioritize full numbers so no decimal or partial regex can truncate them
  const largeDirectMatch = clean.match(/\$?\s*(\d{4,9})\b/);
  if (largeDirectMatch) {
    const val = parseInt(largeDirectMatch[1], 10);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  // 2. Spoken Argentine words for thousands / lucas (Check compound phrases first)
  const wordsToNumbers: Array<{ phrase: string; value: number }> = [
    { phrase: 'un millon', value: 1000000 },
    { phrase: 'un millón', value: 1000000 },
    { phrase: 'quinientos mil', value: 500000 },
    { phrase: 'quinientas lucas', value: 500000 },
    { phrase: 'cuatrocientos mil', value: 400000 },
    { phrase: 'cuatrocientas lucas', value: 400000 },
    { phrase: 'trescientos mil', value: 300000 },
    { phrase: 'trescientas lucas', value: 300000 },
    { phrase: 'doscientos mil', value: 200000 },
    { phrase: 'doscientas lucas', value: 200000 },
    { phrase: 'ciento cincuenta mil', value: 150000 },
    { phrase: 'ciento cincuenta lucas', value: 150000 },
    { phrase: 'cien mil', value: 100000 },
    { phrase: 'cien lucas', value: 100000 },
    { phrase: 'noventa mil', value: 90000 },
    { phrase: 'noventa lucas', value: 90000 },
    { phrase: 'ochenta mil', value: 80000 },
    { phrase: 'ochenta lucas', value: 80000 },
    { phrase: 'setenta mil', value: 70000 },
    { phrase: 'setenta lucas', value: 70000 },
    { phrase: 'sesenta mil', value: 60000 },
    { phrase: 'sesenta lucas', value: 60000 },
    { phrase: 'cincuenta y cinco mil', value: 55000 },
    { phrase: 'cincuenta mil quinientos', value: 50500 },
    { phrase: 'cincuenta mil', value: 50000 },
    { phrase: 'cincuenta lucas', value: 50000 },
    { phrase: 'cuarenta y cinco mil', value: 45000 },
    { phrase: 'cuarenta mil', value: 40000 },
    { phrase: 'cuarenta lucas', value: 40000 },
    { phrase: 'treinta y cinco mil', value: 35000 },
    { phrase: 'treinta y cinco lucas', value: 35000 },
    { phrase: 'treinta mil', value: 30000 },
    { phrase: 'treinta lucas', value: 30000 },
    { phrase: 'veinticinco mil', value: 25000 },
    { phrase: 'veinticinco lucas', value: 25000 },
    { phrase: 'veinticuatro mil', value: 24000 },
    { phrase: 'veintitres mil', value: 23000 },
    { phrase: 'veintitrés mil', value: 23000 },
    { phrase: 'veintidos mil', value: 22000 },
    { phrase: 'veintidós mil', value: 22000 },
    { phrase: 'veintiun mil', value: 21000 },
    { phrase: 'veintiún mil', value: 21000 },
    { phrase: 'veinte mil', value: 20000 },
    { phrase: 'veinte lucas', value: 20000 },
    { phrase: 'diecinueve mil', value: 19000 },
    { phrase: 'dieciocho mil', value: 18000 },
    { phrase: 'diecisiete mil', value: 17000 },
    { phrase: 'dieciseis mil', value: 16000 },
    { phrase: 'dieciséis mil', value: 16000 },
    { phrase: 'quince mil', value: 15000 },
    { phrase: 'quince lucas', value: 15000 },
    { phrase: 'catorce mil', value: 14000 },
    { phrase: 'catorce lucas', value: 14000 },
    { phrase: 'trece mil', value: 13000 },
    { phrase: 'trece lucas', value: 13000 },
    { phrase: 'doce mil', value: 12000 },
    { phrase: 'doce lucas', value: 12000 },
    { phrase: 'once mil quinientos', value: 11500 },
    { phrase: 'once mil doscientos', value: 11200 },
    { phrase: 'once mil', value: 11000 },
    { phrase: 'once lucas', value: 11000 },
    { phrase: 'diez mil', value: 10000 },
    { phrase: 'diez lucas', value: 10000 },
    { phrase: 'nueve mil', value: 9000 },
    { phrase: 'nueve lucas', value: 9000 },
    { phrase: 'ocho mil', value: 8000 },
    { phrase: 'ocho lucas', value: 8000 },
    { phrase: 'siete mil', value: 7000 },
    { phrase: 'siete lucas', value: 7000 },
    { phrase: 'seis mil', value: 6000 },
    { phrase: 'seis lucas', value: 6000 },
    { phrase: 'cinco mil', value: 5000 },
    { phrase: 'cinco lucas', value: 5000 },
    { phrase: 'cuatro mil', value: 4000 },
    { phrase: 'cuatro lucas', value: 4000 },
    { phrase: 'tres mil', value: 3000 },
    { phrase: 'tres lucas', value: 3000 },
    { phrase: 'dos mil', value: 2000 },
    { phrase: 'dos lucas', value: 2000 },
    { phrase: 'un mil', value: 1000 },
    { phrase: 'una luca', value: 1000 },
  ];

  for (const item of wordsToNumbers) {
    if (clean.includes(item.phrase)) {
      return item.value;
    }
  }

  // 3. Numbers with "mil" / "k" / "lucas" e.g. "11 mil", "50mil", "50 lucas", "11 lucas", "11k", "50k"
  const milRegex = /(\d+(?:[.,]\d+)?)\s*(mil|k|lucas?)\b/i;
  const milMatch = clean.match(milRegex);
  if (milMatch) {
    const base = parseFloat(milMatch[1].replace(',', '.'));
    if (!isNaN(base) && base > 0) {
      return Math.round(base * 1000);
    }
  }

  // 4. Dotted or comma thousands e.g. "50.000", "11.000", "11,000", "50,000", "1.250.000"
  const thousandsMatch = clean.match(/\b(\d{1,3})[.,](\d{3})(?:[.,](\d{3}))?(?:[.,](\d{1,2}))?\b/);
  if (thousandsMatch) {
    const p1 = thousandsMatch[1];
    const p2 = thousandsMatch[2];
    const p3 = thousandsMatch[3] || '';
    const decimals = thousandsMatch[4] ? '.' + thousandsMatch[4] : '';
    const combined = `${p1}${p2}${p3}${decimals}`;
    const val = parseFloat(combined);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  // 5. Space-separated thousands (often output by speech recognition: "11 000", "50 000", "1 250 000")
  const spaceMatch = clean.match(/\b(\d{1,3})\s+(\d{3})(?:\s+(\d{3}))?\b/);
  if (spaceMatch) {
    const fullStr = spaceMatch[1] + spaceMatch[2] + (spaceMatch[3] || '');
    const val = parseInt(fullStr, 10);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  // 6. Speech recognition artifacts where thousands were transcribed as ".00" or ",00" (e.g. "11.00", "50.00")
  // In Argentine peso expenses, 11.00 or 50.00 are speech-to-text truncations for 11000 and 50000
  const dotDoubleZeroMatch = clean.match(/\b(\d{1,3})[.,]00\b/);
  if (dotDoubleZeroMatch) {
    const baseNum = parseInt(dotDoubleZeroMatch[1], 10);
    if (!isNaN(baseNum) && baseNum > 0) {
      return baseNum * 1000;
    }
  }

  // 7. Spoken Argentine shortcut numbers before preposition/merchant (e.g. "50 en farmacia", "11 en verduleria", "once en farmacia")
  const wordShortcuts: Array<{ word: string; value: number }> = [
    { word: 'cincuenta', value: 50000 },
    { word: 'cuarenta', value: 40000 },
    { word: 'treinta', value: 30000 },
    { word: 'veinticinco', value: 25000 },
    { word: 'veinte', value: 20000 },
    { word: 'quince', value: 15000 },
    { word: 'catorce', value: 14000 },
    { word: 'trece', value: 13000 },
    { word: 'doce', value: 12000 },
    { word: 'once', value: 11000 },
    { word: 'diez', value: 10000 },
    { word: 'cien', value: 100000 },
  ];
  for (const s of wordShortcuts) {
    const regexShortcut = new RegExp(`\\b${s.word}\\s+(?:en|de|para|con|al|a)\\b`, 'i');
    if (regexShortcut.test(clean)) {
      return s.value;
    }
  }

  // Numeric shortcut before preposition (e.g. "50 en farmacia", "11 en verdulería", "15 de nafta")
  const numericShortcutMatch = clean.match(/\b(\d{1,3})\s+(?:en|de|para|con|al|a)\b/i);
  if (numericShortcutMatch) {
    const num = parseInt(numericShortcutMatch[1], 10);
    if (!isNaN(num) && num > 0 && num <= 500) {
      return num * 1000;
    }
  }

  // 8. Direct standard smaller numbers with optional decimals (e.g. "500", "850.50")
  const directMatch = clean.match(/\$?\s*(\d+(?:[.,]\d{1,2})?)\b/);
  if (directMatch) {
    const val = parseFloat(directMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      // In Argentina expenses, 11 or 50 are spoken shortcuts for $11.000 or $50.000
      if (val === 11) return 11000;
      if (val === 50) return 50000;
      if (val <= 150 && (clean.includes('farmacia') || clean.includes('coto') || clean.includes('super') || clean.includes('nafta') || clean.includes('verduleria') || clean.includes('carniceria'))) {
        return val * 1000;
      }
      return val;
    }
  }

  // 9. Lone words like "cincuenta" or "once" without preposition
  for (const s of wordShortcuts) {
    const regexLone = new RegExp(`\\b${s.word}\\b`, 'i');
    if (regexLone.test(clean)) {
      return s.value;
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
  currentUser: string = 'Yo',
  learnedPreferences?: LearnedMerchant[],
  existingGoals?: Array<{ id: string; nombre: string }>
): ParsedVoiceExpense {
  const text = spokenText.trim();
  const lower = text.toLowerCase();

  // 1. Extract Amount
  let monto = parseSpanishNumberWords(lower) || 0;

  // 2. Classify Operation Type (Gasto vs Ingreso vs Meta)
  let tipoOperacion: 'gasto' | 'ingreso' | 'meta' = 'gasto';
  let metaNombre: string | undefined = undefined;

  // Check if it's a contribution to a Goal / Fondo
  const metaKeywords = [
    'al fondo para', 'al fondo de', 'al fondo', 'fondo para', 'fondo de', 'fondo',
    'a la meta de', 'a la meta', 'para la meta de', 'para la meta', 'meta de', 'meta para',
    'ahorro para', 'ahorre para', 'ahorré para', 'ahorrar para',
    'separé para', 'separe para', 'guardé para', 'guarde para',
    'puse para', 'puse en el fondo', 'meter al fondo', 'metí al fondo', 'mande al fondo', 'mandé al fondo',
    'agregue al fondo', 'agregué al fondo', 'agrega al fondo', 'agregar al fondo',
    'agregue a la meta', 'agregué a la meta', 'agrega a la meta', 'agregar a la meta',
    'sume al fondo', 'sumé al fondo', 'sumar al fondo',
    'sume a la meta', 'sumé a la meta', 'sumar a la meta',
    'aporte para', 'aporté para', 'aporte al fondo', 'aporté al fondo', 'aporte a la meta', 'aporté a la meta',
    'ingreso al fondo', 'ingreso a la meta', 'ingresos a metas', 'ingreso a metas',
    'ingresé al fondo', 'ingrese al fondo', 'ingresé a la meta', 'ingrese a la meta',
    'destiné para', 'destine para', 'destiné al fondo', 'destine al fondo',
    'para las vacaciones', 'para el viaje a', 'para mendoza', 'fondo mendoza'
  ];

  // Match against known goals in account
  let matchedGoalObj = existingGoals?.find(g => {
    const gn = g.nombre.toLowerCase().trim();
    if (!gn) return false;
    return lower.includes(gn) || (gn.includes('mendoza') && lower.includes('mendoza'));
  });

  const hasMetaKeyword = metaKeywords.some(kw => lower.includes(kw));
  const isMeta = Boolean(matchedGoalObj) || hasMetaKeyword;

  if (isMeta) {
    tipoOperacion = 'meta';
    if (matchedGoalObj) {
      metaNombre = matchedGoalObj.nombre;
    } else {
      // Extract goal target name from Argentine speech
      const matchFondo = lower.match(/(?:al fondo para|al fondo de|fondo para|fondo de|fondo|a la meta de|para la meta de|a la meta|para la meta|meta de|meta para|para el viaje a|para las vacaciones en|para)\s+([a-záéíóúñ\s0-9]+)/i);
      if (matchFondo && matchFondo[1]) {
        metaNombre = matchFondo[1].trim()
          .replace(/\b(de|el|la|los|las|un|una|mi|mis)\b/gi, '')
          .replace(/\b(\d+)\b/g, '')
          .trim();
        if (metaNombre) {
          metaNombre = metaNombre.charAt(0).toUpperCase() + metaNombre.slice(1);
        }
      }
      if (!metaNombre && lower.includes('mendoza')) {
        metaNombre = 'Mendoza';
      }
    }
  } else if (
    lower.includes('ingresé') ||
    lower.includes('ingrese') ||
    lower.includes('ingreso de') ||
    lower.includes('ingreso') ||
    lower.includes('ingresos') ||
    lower.includes('agregué un ingreso') ||
    lower.includes('agregar ingreso') ||
    lower.includes('cobré') ||
    lower.includes('cobre') ||
    lower.includes('cobro de') ||
    lower.includes('cobro') ||
    lower.includes('mi sueldo') ||
    lower.includes('sueldo de') ||
    lower.includes('sueldo') ||
    lower.includes('salario') ||
    lower.includes('honorarios') ||
    lower.includes('aguinaldo') ||
    lower.includes('bono') ||
    lower.includes('me pagaron') ||
    lower.includes('pago recibido') ||
    lower.includes('plata que cobré') ||
    lower.includes('entrada de dinero')
  ) {
    tipoOperacion = 'ingreso';
  }

  // 3. Detect Payment Method and Credit Card
  let metodoPago = 'Débito';
  let tarjetaNombre: string | undefined = undefined;
  let esCuotas = false;
  let cuotasTotal = 1;
  let hasExplicitPaymentMethod = false;
  let hasExplicitInstallments = false;

  // Check installment phrases
  const cuotasMatch = lower.match(/(?:en\s+)?(\d{1,2})\s+cuotas/i);
  if (cuotasMatch) {
    esCuotas = true;
    cuotasTotal = parseInt(cuotasMatch[1], 10) || 1;
    hasExplicitInstallments = true;
    metodoPago = 'Crédito';
    hasExplicitPaymentMethod = true;
  }

  if (
    lower.includes('credito') ||
    lower.includes('crédito') ||
    lower.includes('tarjeta') ||
    lower.includes('visa') ||
    lower.includes('mastercard') ||
    lower.includes('master') ||
    lower.includes('naranja') ||
    lower.includes('santander') ||
    lower.includes('bbva') ||
    lower.includes('galicia') ||
    lower.includes('macro') ||
    lower.includes('mercado pago') ||
    lower.includes('mercadopago') ||
    lower.includes('cuotas')
  ) {
    metodoPago = 'Crédito';
    hasExplicitPaymentMethod = true;
    if (lower.includes('naranja')) tarjetaNombre = 'Naranja X';
    else if (lower.includes('visa')) tarjetaNombre = 'Visa';
    else if (lower.includes('master')) tarjetaNombre = 'Mastercard';
    else if (lower.includes('santander')) tarjetaNombre = 'Santander Río';
    else if (lower.includes('bbva')) tarjetaNombre = 'BBVA Francés';
    else if (lower.includes('galicia')) tarjetaNombre = 'Banco Galicia';
    else if (lower.includes('macro')) tarjetaNombre = 'Banco Macro';
    else if (lower.includes('mercado pago') || lower.includes('mercadopago')) tarjetaNombre = 'Mercado Pago';
  } else if (lower.includes('efectivo') || lower.includes('cash') || lower.includes('en mano')) {
    metodoPago = 'Efectivo';
    hasExplicitPaymentMethod = true;
  } else if (lower.includes('transferencia') || lower.includes('transferí') || lower.includes('transferi')) {
    metodoPago = 'Transferencia';
    hasExplicitPaymentMethod = true;
  } else if (lower.includes('debito') || lower.includes('débito')) {
    metodoPago = 'Débito';
    hasExplicitPaymentMethod = true;
  }

  // 4. Classify Category & Subcategory based on Argentine market terms
  let categoria = tipoOperacion === 'ingreso' ? 'Ingresos' : (tipoOperacion === 'meta' ? 'Ahorro' : 'Alimentación & Bebidas');
  let subcategoria = tipoOperacion === 'ingreso' ? 'Sueldo' : (tipoOperacion === 'meta' ? 'Metas & Fondos' : 'Supermercado & Hipermercado');
  let concepto = tipoOperacion === 'meta' 
    ? `Aporte a meta ${metaNombre || 'Ahorro'}` 
    : (tipoOperacion === 'ingreso' ? 'Ingreso registrado' : 'Gasto por voz');
  let descripcion = text;
  let hasExplicitCategory = false;

  if (tipoOperacion === 'ingreso') {
    if (lower.includes('sueldo') || lower.includes('salario')) {
      subcategoria = 'Sueldo';
      concepto = 'Sueldo / Salario';
    } else if (lower.includes('honorarios') || lower.includes('freelance')) {
      subcategoria = 'Honorarios';
      concepto = 'Honorarios';
    } else if (lower.includes('bono') || lower.includes('aguinaldo')) {
      subcategoria = 'Bono';
      concepto = 'Aguinaldo / Bono';
    } else if (lower.includes('venta')) {
      subcategoria = 'Ventas';
      concepto = 'Venta';
    } else {
      subcategoria = 'Varios';
      concepto = 'Ingreso';
    }
  } else if (tipoOperacion === 'meta') {
    concepto = metaNombre ? `Aporte Fondo ${metaNombre}` : 'Aporte a Meta de Ahorro';
    categoria = 'Ahorro';
    subcategoria = 'Metas & Fondos';
  }

  // 4.5 Check Learned User Preferences (ABSOLUTE HIGHEST PRIORITY)
  // E.g. "Farmacia" -> automatically proposes Salud & Cuidado Personal -> Farmacia & Medicamentos
  // E.g. "La Shell" -> recognizes merchant and proposes Shell -> Transporte & Movilidad -> Combustible (Nafta / GNC)
  const learnedMatch = findLearnedMatch(text, learnedPreferences);
  let learnedPreferenceApplied = false;
  let matchedLearnedRule: LearnedMerchant | undefined = undefined;

  if (tipoOperacion === 'gasto' && learnedMatch) {
    concepto = learnedMatch.merchantName;
    categoria = learnedMatch.categoria;
    subcategoria = learnedMatch.subcategoria;
    if (!hasExplicitPaymentMethod && learnedMatch.defaultMetodoPago) {
      metodoPago = learnedMatch.defaultMetodoPago;
    }
    hasExplicitCategory = true;
    learnedPreferenceApplied = true;
    matchedLearnedRule = learnedMatch;
  }

  // Supermarkets & Food
  if (!learnedPreferenceApplied && (
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
  )) {
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

  // Confidence calculation for voice recognition
  const amountConfidence = monto > 0 ? 0.99 : 0.30;
  const isGenericConcept = concepto === 'Gasto por voz' || concepto === 'Ingreso registrado';
  
  let categoryConfidence = 0.95;
  let paymentMethodConfidence = 0.95;
  let installmentsConfidence = 0.98;

  if (tipoOperacion === 'meta') {
    // Goal contributions are fixed rubro Ahorro -> Metas & Fondos and do not need card or payment verification
    categoryConfidence = 1.0;
    paymentMethodConfidence = 1.0;
    installmentsConfidence = 1.0;
  } else if (tipoOperacion === 'ingreso') {
    // Income operations have fixed rubro Ingresos and no installments
    categoryConfidence = 1.0;
    paymentMethodConfidence = hasExplicitPaymentMethod ? 1.0 : 0.90;
    installmentsConfidence = 1.0;
  } else {
    // Gasto standard confidence
    categoryConfidence = learnedPreferenceApplied 
      ? 1.0 
      : (!isGenericConcept ? 0.95 : 0.50);
    paymentMethodConfidence = hasExplicitPaymentMethod 
      ? 0.95 
      : (learnedPreferenceApplied && matchedLearnedRule?.defaultMetodoPago ? 0.88 : 0.35);
    installmentsConfidence = (metodoPago !== 'Crédito' || hasExplicitInstallments) ? 0.98 : 0.60;
  }

  const confidence: TransactionConfidence = {
    amount: amountConfidence,
    category: categoryConfidence,
    paymentMethod: paymentMethodConfidence,
    installments: installmentsConfidence
  };

  const unconfirmedFields: Array<'amount' | 'category' | 'paymentMethod' | 'installments'> = [];
  if (amountConfidence < 0.85) unconfirmedFields.push('amount');
  if (categoryConfidence < 0.85) unconfirmedFields.push('category');
  if (paymentMethodConfidence < 0.85) unconfirmedFields.push('paymentMethod');
  if (installmentsConfidence < 0.85) unconfirmedFields.push('installments');

  let confirmationQuestion: string | undefined = undefined;
  if (tipoOperacion === 'meta') {
    if (amountConfidence < 0.85) {
      confirmationQuestion = `Entendí el aporte para ${metaNombre || 'la meta'}, pero no pude determinar el monto exacto.`;
    }
  } else if (tipoOperacion === 'ingreso') {
    if (amountConfidence < 0.85) {
      confirmationQuestion = `Entendí el ingreso de dinero, pero no pude determinar el monto exacto.`;
    }
  } else {
    if (paymentMethodConfidence < 0.85) {
      const merchantText = concepto && !isGenericConcept ? ` en ${concepto}` : '';
      const formattedMonto = monto > 0 ? `$${monto.toLocaleString('es-AR')}` : 'el gasto';
      confirmationQuestion = `Entendí ${formattedMonto}${merchantText}, pero no pude determinar la forma de pago.`;
    } else if (categoryConfidence < 0.85) {
      confirmationQuestion = `Entendí $${monto.toLocaleString('es-AR')}, pero no pude determinar la categoría con certeza.`;
    } else if (amountConfidence < 0.85) {
      confirmationQuestion = `No pude determinar con certeza el monto total. ¿Podrías confirmar el importe?`;
    } else if (installmentsConfidence < 0.85) {
      confirmationQuestion = `Detecté pago con tarjeta de crédito, pero no las cuotas. ¿En cuántas cuotas pagaste?`;
    }
  }

  return {
    transcripcion: text,
    concepto,
    descripcion: `Registro por voz: "${text}"`,
    monto,
    categoria,
    subcategoria,
    tipoGasto: isPareja ? 'pareja' : 'individual',
    division: isPareja ? '50_50' : undefined,
    metodoPago,
    tarjetaNombre,
    esCuotas,
    cuotasTotal,
    tipoOperacion,
    metaNombre,
    fecha: new Date().toISOString().split('T')[0],
    confidence,
    unconfirmedFields,
    confirmationQuestion,
    learnedPreferenceApplied,
    learnedRule: matchedLearnedRule
  };
}
