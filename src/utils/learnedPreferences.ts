import { LearnedMerchant, PaymentMethod } from '../types';

const STORAGE_KEY = 'gastoar_learned_merchants';

export const DEFAULT_LEARNED_MERCHANTS: LearnedMerchant[] = [
  {
    id: 'farmacia',
    keyword: 'farmacia',
    merchantName: 'Farmacia',
    categoria: 'Salud & Cuidado Personal',
    subcategoria: 'Farmacia & Medicamentos',
    defaultMetodoPago: 'Débito',
    frequency: 5,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'la-shell',
    keyword: 'la shell',
    merchantName: 'Shell',
    categoria: 'Transporte & Movilidad',
    subcategoria: 'Combustible (Nafta / GNC)',
    defaultMetodoPago: 'Débito',
    frequency: 4,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'shell',
    keyword: 'shell',
    merchantName: 'Shell',
    categoria: 'Transporte & Movilidad',
    subcategoria: 'Combustible (Nafta / GNC)',
    defaultMetodoPago: 'Débito',
    frequency: 4,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'ypf',
    keyword: 'ypf',
    merchantName: 'YPF',
    categoria: 'Transporte & Movilidad',
    subcategoria: 'Combustible (Nafta / GNC)',
    defaultMetodoPago: 'Débito',
    frequency: 5,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'axion',
    keyword: 'axion',
    merchantName: 'Axion',
    categoria: 'Transporte & Movilidad',
    subcategoria: 'Combustible (Nafta / GNC)',
    defaultMetodoPago: 'Débito',
    frequency: 3,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'coto',
    keyword: 'coto',
    merchantName: 'Coto',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Supermercado & Hipermercado',
    defaultMetodoPago: 'Débito',
    frequency: 6,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'carrefour',
    keyword: 'carrefour',
    merchantName: 'Carrefour',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Supermercado & Hipermercado',
    defaultMetodoPago: 'Débito',
    frequency: 5,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'en-dia',
    keyword: 'en dia',
    merchantName: 'Supermercado Día',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Supermercado & Hipermercado',
    defaultMetodoPago: 'Débito',
    frequency: 15,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'dia',
    keyword: 'dia',
    merchantName: 'Supermercado Día',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Supermercado & Hipermercado',
    defaultMetodoPago: 'Débito',
    frequency: 15,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'en-dia-acento',
    keyword: 'en día',
    merchantName: 'Supermercado Día',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Supermercado & Hipermercado',
    defaultMetodoPago: 'Débito',
    frequency: 15,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'dia-acento',
    keyword: 'día',
    merchantName: 'Supermercado Día',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Supermercado & Hipermercado',
    defaultMetodoPago: 'Débito',
    frequency: 15,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'supermercado-dia',
    keyword: 'supermercado dia',
    merchantName: 'Supermercado Día',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Supermercado & Hipermercado',
    defaultMetodoPago: 'Débito',
    frequency: 15,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'farmacity',
    keyword: 'farmacity',
    merchantName: 'Farmacity',
    categoria: 'Salud & Cuidado Personal',
    subcategoria: 'Farmacia & Medicamentos',
    defaultMetodoPago: 'Débito',
    frequency: 3,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'sube',
    keyword: 'sube',
    merchantName: 'Carga SUBE',
    categoria: 'Transporte & Movilidad',
    subcategoria: 'Carga Tarjeta SUBE (Colectivo, Tren, Subte)',
    defaultMetodoPago: 'Transferencia',
    frequency: 3,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'veterinaria',
    keyword: 'veterinaria',
    merchantName: 'Veterinaria',
    categoria: 'Mascotas',
    subcategoria: 'Veterinaria & Medicamentos',
    defaultMetodoPago: 'Débito',
    frequency: 2,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'pedidosya',
    keyword: 'pedidosya',
    merchantName: 'PedidosYa',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Crédito',
    frequency: 4,
    lastUsed: Date.now(),
    source: 'auto_learned'
  },
  {
    id: 'el-super',
    keyword: 'el super',
    merchantName: 'Supermercado',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Supermercado & Hipermercado',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'supermercado',
    keyword: 'supermercado',
    merchantName: 'Supermercado',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Supermercado & Hipermercado',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'nafta',
    keyword: 'nafta',
    merchantName: 'Estación de Servicio',
    categoria: 'Transporte & Movilidad',
    subcategoria: 'Combustible (Nafta / GNC)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'estacion-de-servicio',
    keyword: 'estacion de servicio',
    merchantName: 'Estación de Servicio',
    categoria: 'Transporte & Movilidad',
    subcategoria: 'Combustible (Nafta / GNC)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'almacen',
    keyword: 'almacen',
    merchantName: 'Almacén',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Kiosco & Almacén de barrio',
    defaultMetodoPago: 'Efectivo',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'kiosco',
    keyword: 'kiosco',
    merchantName: 'Kiosco',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Kiosco & Almacén de barrio',
    defaultMetodoPago: 'Efectivo',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'verduleria',
    keyword: 'verduleria',
    merchantName: 'Verdulería',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Verdulería & Frutería',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'restaurante',
    keyword: 'restaurante',
    merchantName: 'Restaurante',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Restaurantes, Bares & Cafeterías',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'delivery',
    keyword: 'delivery',
    merchantName: 'Delivery',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'rappi',
    keyword: 'rappi',
    merchantName: 'Rappi',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Crédito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'pedidos-ya',
    keyword: 'pedidos ya',
    merchantName: 'PedidosYa',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Crédito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'helado',
    keyword: 'helado',
    merchantName: 'Helado',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'heladeria',
    keyword: 'heladeria',
    merchantName: 'Heladería',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'heladeria-accent',
    keyword: 'heladería',
    merchantName: 'Heladería',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'pizzeria',
    keyword: 'pizzeria',
    merchantName: 'Pizzería',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'pizzeria-accent',
    keyword: 'pizzería',
    merchantName: 'Pizzería',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'pizza',
    keyword: 'pizza',
    merchantName: 'Pizza',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'empanadas',
    keyword: 'empanadas',
    merchantName: 'Empanadas',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'empanada',
    keyword: 'empanada',
    merchantName: 'Empanadas',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'sushi',
    keyword: 'sushi',
    merchantName: 'Sushi',
    categoria: 'Alimentación & Bebidas',
    subcategoria: 'Delivery (PedidosYa / Rappi)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'alquiler',
    keyword: 'alquiler',
    merchantName: 'Alquiler',
    categoria: 'Alquiler',
    subcategoria: 'Alquiler Mensual',
    defaultMetodoPago: 'Transferencia',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'expensas',
    keyword: 'expensas',
    merchantName: 'Expensas',
    categoria: 'Expensas',
    subcategoria: 'Expensas Ordinarias',
    defaultMetodoPago: 'Transferencia',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'luz',
    keyword: 'luz',
    merchantName: 'Luz',
    categoria: 'Servicios',
    subcategoria: 'Luz / Electricidad (Edenor, Edesur, Provincial)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'gas',
    keyword: 'gas',
    merchantName: 'Gas',
    categoria: 'Servicios',
    subcategoria: 'Gas Natural / Garrafa (Metrogas, Naturgy)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'internet',
    keyword: 'internet',
    merchantName: 'Internet',
    categoria: 'Servicios',
    subcategoria: 'Internet Fibra Óptica & Wi-Fi',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  },
  {
    id: 'celular',
    keyword: 'celular',
    merchantName: 'Celular',
    categoria: 'Servicios',
    subcategoria: 'Telefonía Celular & Planes Móviles (Personal, Claro, Movistar)',
    defaultMetodoPago: 'Débito',
    frequency: 10,
    lastUsed: Date.now(),
    source: 'manual'
  }
];

/**
 * Normalizes text for matching keywords and merchants
 */
export function normalizeMerchantText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean keyword by stripping common noise prepositions
 */
export function cleanKeywordPhrase(phrase: string): string {
  const norm = normalizeMerchantText(phrase);
  // remove leading words like "en la", "en el", "de la", "de", "la", "el", "un", "una", "gasto en"
  return norm
    .replace(/^(?:gasto en|compre en|compré en|pague en|pagué en|en el|en la|en los|en las|a la|al|de la|de el|del|la|el|los|las|un|una)\s+/i, '')
    .trim();
}

/**
 * Get all learned merchants from localStorage or defaults
 */
export function getLearnedPreferences(): LearnedMerchant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEARNED_MERCHANTS));
      return DEFAULT_LEARNED_MERCHANTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure the user's explicit rule for Supermercado Dia is guaranteed to be present and prioritized
      let needsSave = false;
      const list: LearnedMerchant[] = [...parsed];

      const hasEnDia = list.some(p => p.keyword === 'en dia');
      if (!hasEnDia) {
        list.unshift({
          id: 'en-dia',
          keyword: 'en dia',
          merchantName: 'Supermercado Día',
          categoria: 'Alimentación & Bebidas',
          subcategoria: 'Supermercado & Hipermercado',
          defaultMetodoPago: 'Débito',
          frequency: 15,
          lastUsed: Date.now(),
          source: 'manual'
        });
        needsSave = true;
      }

      const diaIndex = list.findIndex(p => p.keyword === 'dia');
      if (diaIndex >= 0) {
        if (list[diaIndex].merchantName !== 'Supermercado Día' || !list[diaIndex].subcategoria.toLowerCase().includes('supermercado')) {
          list[diaIndex] = {
            ...list[diaIndex],
            merchantName: 'Supermercado Día',
            categoria: 'Alimentación & Bebidas',
            subcategoria: 'Supermercado & Hipermercado',
            frequency: Math.max(list[diaIndex].frequency || 0, 15),
            source: 'manual'
          };
          needsSave = true;
        }
      } else {
        list.unshift({
          id: 'dia',
          keyword: 'dia',
          merchantName: 'Supermercado Día',
          categoria: 'Alimentación & Bebidas',
          subcategoria: 'Supermercado & Hipermercado',
          defaultMetodoPago: 'Débito',
          frequency: 15,
          lastUsed: Date.now(),
          source: 'manual'
        });
        needsSave = true;
      }

      // Ensure delivery subcategory keywords are explicitly enforced
      const deliveryKeywords = ['delivery', 'helado', 'pizzeria', 'pizzería', 'pizza', 'empanadas', 'empanada', 'heladeria', 'heladería', 'sushi', 'rappi', 'pedidos ya', 'pedidosya'];
      for (const kw of deliveryKeywords) {
        const itemIdx = list.findIndex(p => p.keyword.toLowerCase().trim() === kw);
        if (itemIdx >= 0) {
          if (list[itemIdx].categoria !== 'Alimentación & Bebidas' || !list[itemIdx].subcategoria.toLowerCase().includes('delivery')) {
            list[itemIdx].categoria = 'Alimentación & Bebidas';
            list[itemIdx].subcategoria = 'Delivery (PedidosYa / Rappi)';
            needsSave = true;
          }
        }
      }

      for (const def of DEFAULT_LEARNED_MERCHANTS) {
        if (!list.some(p => p.keyword === def.keyword)) {
          list.push(def);
          needsSave = true;
        }
      }

      if (needsSave) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
      return list;
    }
    return DEFAULT_LEARNED_MERCHANTS;
  } catch (err) {
    console.warn('Error reading learned merchants preferences:', err);
    return DEFAULT_LEARNED_MERCHANTS;
  }
}

/**
 * Save learned preferences to local storage and sync
 */
export function saveLearnedPreferences(preferences: LearnedMerchant[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    // Trigger custom event so reactive UI components update immediately
    window.dispatchEvent(new CustomEvent('gastoar_learned_merchants_updated', { detail: preferences }));
  } catch (err) {
    console.warn('Error saving learned preferences:', err);
  }
}

/**
 * Find if spoken text matches any learned merchant preference.
 * Priority: longer phrases first, then higher frequency.
 */
export function findLearnedMatch(
  spokenText: string, 
  customPreferences?: LearnedMerchant[]
): LearnedMerchant | null {
  if (!spokenText) return null;
  const list = customPreferences || getLearnedPreferences();
  const normalizedSpeech = ` ${normalizeMerchantText(spokenText)} `;

  // Sort: prioritize longer keywords (e.g. "la shell" before "shell") and then higher frequency
  const sorted = [...list].sort((a, b) => {
    if (b.keyword.length !== a.keyword.length) {
      return b.keyword.length - a.keyword.length;
    }
    return b.frequency - a.frequency;
  });

  for (const pref of sorted) {
    const normKey = normalizeMerchantText(pref.keyword);
    const normMerchant = normalizeMerchantText(pref.merchantName);

    if (normKey && normalizedSpeech.includes(` ${normKey} `)) {
      return pref;
    }
    if (normMerchant && normalizedSpeech.includes(` ${normMerchant} `)) {
      return pref;
    }
  }

  return null;
}

/**
 * Record and learn from a user confirmed transaction.
 * When the user registers or confirms a movement (e.g., "La Shell", "Farmacia"),
 * the system records or reinforces this preference.
 */
export function recordLearnedPreference(
  concept: string,
  categoria: string,
  subcategoria: string,
  metodoPago?: PaymentMethod,
  source: 'auto_learned' | 'manual' = 'auto_learned'
): LearnedMerchant[] {
  if (!concept || !categoria) return getLearnedPreferences();

  // Don't learn generic placeholders
  const cleanConcept = concept.trim();
  const lowerConcept = cleanConcept.toLowerCase();
  if (
    lowerConcept === 'gasto por voz' ||
    lowerConcept === 'ingreso registrado' ||
    lowerConcept === 'movimiento' ||
    lowerConcept === 'gasto' ||
    lowerConcept === 'sin concepto' ||
    lowerConcept.length < 2
  ) {
    return getLearnedPreferences();
  }

  const keyword = cleanKeywordPhrase(cleanConcept);
  if (!keyword || keyword.length < 2) return getLearnedPreferences();

  const id = normalizeMerchantText(keyword).replace(/\s+/g, '-');
  const current = getLearnedPreferences();

  const existingIndex = current.findIndex(
    item => item.id === id || normalizeMerchantText(item.keyword) === normalizeMerchantText(keyword)
  );

  let updatedList: LearnedMerchant[];

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    const updatedItem: LearnedMerchant = {
      ...existing,
      merchantName: cleanConcept,
      categoria,
      subcategoria: subcategoria || existing.subcategoria,
      defaultMetodoPago: metodoPago || existing.defaultMetodoPago,
      frequency: (existing.frequency || 1) + 1,
      lastUsed: Date.now(),
      source: existing.source === 'manual' ? 'manual' : source
    };
    updatedList = [...current];
    updatedList[existingIndex] = updatedItem;
  } else {
    const newItem: LearnedMerchant = {
      id,
      keyword,
      merchantName: cleanConcept,
      categoria,
      subcategoria: subcategoria || 'General',
      defaultMetodoPago: metodoPago,
      frequency: 1,
      lastUsed: Date.now(),
      source
    };
    updatedList = [newItem, ...current];
  }

  saveLearnedPreferences(updatedList);
  return updatedList;
}

/**
 * Delete a learned merchant rule
 */
export function deleteLearnedPreference(id: string): LearnedMerchant[] {
  const current = getLearnedPreferences();
  const updated = current.filter(item => item.id !== id);
  saveLearnedPreferences(updated);
  return updated;
}

/**
 * Reset to defaults
 */
export function resetLearnedPreferences(): LearnedMerchant[] {
  saveLearnedPreferences(DEFAULT_LEARNED_MERCHANTS);
  return DEFAULT_LEARNED_MERCHANTS;
}
