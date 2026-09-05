export interface BankOrCard {
  id: string;
  name: string;
  category: 'fintech' | 'privado' | 'publico_provincial' | 'tarjeta_comercial' | 'digital';
  shortName: string;
  type: string[];
}

export const ARGENTINE_BANKS_AND_CARDS: BankOrCard[] = [
  // --- FINTECHS Y BILLETERAS VIRTUALES POPULARES ---
  { id: 'naranja_x', name: 'Tarjeta Naranja X (Naranja / Visa / Mastercard)', shortName: 'Naranja X', category: 'fintech', type: ['Crédito', 'Débito'] },
  { id: 'mercado_pago', name: 'Mercado Pago (Mastercard / Débito / Crédito)', shortName: 'Mercado Pago', category: 'fintech', type: ['Crédito', 'Débito', 'Virtual'] },
  { id: 'uala', name: 'Ualá (Mastercard Crédito / Débito)', shortName: 'Ualá', category: 'fintech', type: ['Crédito', 'Débito'] },
  { id: 'personal_pay', name: 'Personal Pay (Visa Prepaga / Débito)', shortName: 'Personal Pay', category: 'fintech', type: ['Débito', 'Prepaga'] },
  { id: 'lemon_cash', name: 'Lemon Cash (Visa Crypto / Débito)', shortName: 'Lemon Cash', category: 'fintech', type: ['Débito', 'Prepaga'] },
  { id: 'belo', name: 'Belo (Mastercard Crypto / Débito)', shortName: 'Belo', category: 'fintech', type: ['Débito', 'Prepaga'] },
  { id: 'prex', name: 'Prex (Mastercard Débito / Prepaga)', shortName: 'Prex', category: 'fintech', type: ['Débito', 'Prepaga'] },
  { id: 'brubank', name: 'Brubank (Visa Débito / Crédito)', shortName: 'Brubank', category: 'digital', type: ['Crédito', 'Débito'] },
  { id: 'openbank', name: 'Openbank Santander (Visa Débito)', shortName: 'Openbank', category: 'digital', type: ['Débito'] },
  { id: 'reba', name: 'Reba (Visa / Mastercard Crédito & Débito)', shortName: 'Reba', category: 'digital', type: ['Crédito', 'Débito'] },
  { id: 'iudu', name: 'IUDÚ / Banco Supervielle', shortName: 'IUDÚ', category: 'digital', type: ['Crédito', 'Débito'] },
  { id: 'buepp', name: 'Buepp (Banco Ciudad Virtual)', shortName: 'Buepp', category: 'digital', type: ['Débito', 'Virtual'] },
  { id: 'cuenta_dni', name: 'Cuenta DNI (Banco Provincia)', shortName: 'Cuenta DNI', category: 'digital', type: ['Débito', 'Virtual'] },
  { id: 'bna_mas', name: 'BNA+ (Banco Nación Virtual)', shortName: 'BNA+', category: 'digital', type: ['Débito', 'Virtual'] },

  // --- BANCOS PRIVADOS PRINCIPALES ---
  { id: 'santander', name: 'Banco Santander (Visa / Mastercard / Amex)', shortName: 'Santander', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'galicia', name: 'Banco Galicia (Visa / Mastercard / American Express)', shortName: 'Galicia', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'bbva', name: 'Banco BBVA (Visa / Mastercard)', shortName: 'BBVA', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'macro', name: 'Banco Macro (Visa / Mastercard / Amex)', shortName: 'Macro', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'macro_bma', name: 'Banco Macro BMA (Ex Itaú)', shortName: 'Macro BMA', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'icbc', name: 'Banco ICBC (Visa / Mastercard)', shortName: 'ICBC', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'supervielle', name: 'Banco Supervielle (Visa / Mastercard)', shortName: 'Supervielle', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'hsbc', name: 'Banco HSBC (Visa / Mastercard / Amex)', shortName: 'HSBC', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'patagonia', name: 'Banco Patagonia (Visa / Mastercard / Amex)', shortName: 'Patagonia', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'hipotecario', name: 'Banco Hipotecario (Visa)', shortName: 'Hipotecario', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'credicoop', name: 'Banco Credicoop (Cabal / Visa / Mastercard)', shortName: 'Credicoop', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'comafi', name: 'Banco Comafi (Visa / Mastercard)', shortName: 'Comafi', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'columbia', name: 'Banco Columbia (Visa / Mastercard)', shortName: 'Columbia', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'banco_del_sol', name: 'Banco del Sol (Sancor Seguros - Visa)', shortName: 'Banco del Sol', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'piano', name: 'Banco Piano (Visa / Mastercard)', shortName: 'Banco Piano', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'bind', name: 'Banco Industrial / BIND (Visa / Mastercard)', shortName: 'BIND', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'bst', name: 'Banco BST (Servicios y Transacciones)', shortName: 'BST', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'mariva', name: 'Banco Mariva', shortName: 'Mariva', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'meridian', name: 'Banco Meridian', shortName: 'Meridian', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'voii', name: 'Banco Voii', shortName: 'Voii', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'roela', name: 'Banco Roela', shortName: 'Roela', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'cmf', name: 'Banco CMF', shortName: 'CMF', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'julio', name: 'Banco Julio', shortName: 'Banco Julio', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'coinag', name: 'Banco Coinag', shortName: 'Coinag', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'dino', name: 'Banco Dino', shortName: 'Banco Dino', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'interfinanzas', name: 'Banco Interfinanzas / Binter', shortName: 'Interfinanzas', category: 'privado', type: ['Crédito', 'Débito'] },
  { id: 'saenz', name: 'Banco Sáenz', shortName: 'Banco Sáenz', category: 'privado', type: ['Crédito', 'Débito'] },

  // --- BANCOS PÚBLICOS Y PROVINCIALES ---
  { id: 'bna', name: 'Banco Nación Argentina (BNA - Visa / Mastercard / Nativa)', shortName: 'Banco Nación', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'bapro', name: 'Banco Provincia de Buenos Aires (BAPRO - Visa / Mastercard)', shortName: 'Banco Provincia', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'ciudad', name: 'Banco Ciudad de Buenos Aires (Visa / Mastercard / Cabal)', shortName: 'Banco Ciudad', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'bancor', name: 'Banco de Córdoba (Bancor - Cordobesa / Visa / Mastercard)', shortName: 'Bancor (Córdoba)', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'santa_fe', name: 'Banco Santa Fe (Visa / Mastercard)', shortName: 'Banco Santa Fe', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'entre_rios', name: 'Banco Entre Ríos (Visa / Mastercard)', shortName: 'Banco Entre Ríos', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'san_juan', name: 'Banco San Juan (Visa / Mastercard)', shortName: 'Banco San Juan', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'santa_cruz', name: 'Banco Santa Cruz (Visa / Mastercard)', shortName: 'Banco Santa Cruz', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'la_pampa', name: 'Banco de La Pampa (Visa / Mastercard / Caldén)', shortName: 'Banco La Pampa', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'chubut', name: 'Banco del Chubut (Patagonia 365 / Visa / Mastercard)', shortName: 'Banco Chubut', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'corrientes', name: 'Banco de Corrientes (Visa / Mastercard)', shortName: 'Banco Corrientes', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'bpn', name: 'Banco Provincia del Neuquén (BPN - Confiable / Visa / Mastercard)', shortName: 'BPN (Neuquén)', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'rioja', name: 'Banco Rioja (Visa / Mastercard / Débito)', shortName: 'Banco Rioja', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'formosa', name: 'Banco de Formosa (Chigüé / Visa / Mastercard)', shortName: 'Banco Formosa', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'nbch', name: 'Nuevo Banco del Chaco (Tarjeta Tuya / Visa / Mastercard)', shortName: 'NBCH (Chaco)', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'bse', name: 'Banco Santiago del Estero (Tarjeta Sol / Visa)', shortName: 'BSE (Santiago del Estero)', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'btf', name: 'Banco de Tierra del Fuego (BTF - Fueguina / Visa / Mastercard)', shortName: 'BTF (Tierra del Fuego)', category: 'publico_provincial', type: ['Crédito', 'Débito'] },
  { id: 'bice', name: 'Banco BICE (Inversión y Comercio Exterior)', shortName: 'BICE', category: 'publico_provincial', type: ['Crédito', 'Débito'] },

  // --- TARJETAS COMERCIALES Y REGIONALES ---
  { id: 'cencosud', name: 'Tarjeta Cencosud (Jumbo / Easy / Disco / Vea - Mastercard)', shortName: 'Tarjeta Cencosud', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'carrefour', name: 'Tarjeta Carrefour (Mastercard)', shortName: 'Tarjeta Carrefour', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'cmr', name: 'Tarjeta CMR Falabella / Sodimac (Mastercard)', shortName: 'Tarjeta CMR', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'carta_sur', name: 'Tarjeta Carta Sur', shortName: 'Carta Sur', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'favacard', name: 'Tarjeta Favacard', shortName: 'Favacard', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'coopeplus', name: 'Tarjeta Coopeplus', shortName: 'Coopeplus', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'tarjeta_sol', name: 'Tarjeta Sol (Santiago del Estero / Tucumán)', shortName: 'Tarjeta Sol', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'tarjeta_tuya', name: 'Tarjeta Tuya (Chaco / NBCH)', shortName: 'Tarjeta Tuya', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'tarjeta_cordobesa', name: 'Tarjeta Cordobesa (Bancor)', shortName: 'Tarjeta Cordobesa', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'tarjeta_nativa', name: 'Tarjeta Nativa (Banco Nación)', shortName: 'Tarjeta Nativa BNA', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'amex_directa', name: 'American Express Directa (Centurion / Black)', shortName: 'American Express', category: 'tarjeta_comercial', type: ['Crédito'] },
  { id: 'cabal_directa', name: 'Tarjeta Cabal Directa', shortName: 'Cabal', category: 'tarjeta_comercial', type: ['Crédito'] },
];

export const POPULAR_QUICK_CARDS = [
  'Tarjeta Naranja X',
  'Mercado Pago (Mastercard)',
  'Visa Santander',
  'Mastercard BBVA',
  'Visa Banco Galicia',
  'Visa Banco Nación',
  'Visa Banco Provincia',
  'Mastercard Banco Macro',
  'Ualá (Mastercard)',
  'Brubank (Visa)',
  'Personal Pay (Visa)',
  'Tarjeta Cencosud',
];

export const BANK_CATEGORIES_LABEL: Record<string, string> = {
  fintech: 'Billeteras Virtuales & Fintechs (Naranja X, Mercado Pago, Ualá...)',
  digital: 'Bancos Digitales (Brubank, Openbank, Reba...)',
  privado: 'Bancos Privados Nacionales e Internacionales',
  publico_provincial: 'Bancos Públicos y Provinciales (Nación, BAPRO, Bancor...)',
  tarjeta_comercial: 'Tarjetas Comerciales, Regionales y Retail',
};
