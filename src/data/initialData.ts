import { CategoryColors, CategoryMap, CoupleProfile, Transaction, Budgets } from '../types';

export const DEFAULT_COUPLE_PROFILE: CoupleProfile = {
  accountCode: 'PAREJA-2026',
  user1Name: 'Sol',
  user2Name: 'Martín',
  currentUser: 'user1',
  currency: 'ARS',
  defaultSplit: '50_50',
};

export const DEFAULT_CATEGORY_MAP: CategoryMap = {
  "Alimentación & Bebidas": [
    "Supermercado & Hipermercado",
    "Carnicería & Granja",
    "Verdulería & Frutería",
    "Panadería & Facturas",
    "Kiosco & Almacén de barrio",
    "Delivery (PedidosYa / Rappi)",
    "Restaurantes, Bares & Cafeterías",
    "Heladerías & Postres"
  ],
  "Alquiler": [
    "Alquiler Mensual",
    "Cochera Alquiler",
    "Ajuste ICL / IPC",
    "Depósito / Renovación de Contrato"
  ],
  "Expensas": [
    "Expensas Ordinarias",
    "Expensas Extraordinarias",
    "Expensas Cochera"
  ],
  "Servicios": [
    "Luz (Edenor / Edesur / Provincial)",
    "Gas Natural / Garrafa (Metrogas / Naturgy)",
    "Agua (AySA / Provincial)",
    "Internet Wi-Fi, Fibra & Cable",
    "Telefonía Celular (Personal / Movistar / Claro)",
    "Artículos de Limpieza",
    "Mantenimiento, Ferretería & Arreglos"
  ],
  "Transporte & Movilidad": [
    "Carga Tarjeta SUBE (Colectivo, Tren, Subte)",
    "Combustible (Nafta / GNC)",
    "Peajes & TelePase",
    "Estacionamiento & Cocheras",
    "Taxi / Uber / Cabify / Didi",
    "Seguro del Auto / Moto",
    "Patente & VTV",
    "Mecánico, Repuestos, Gomera & Lavadero"
  ],
  "Salud & Cuidado Personal": [
    "Farmacia & Medicamentos",
    "Prepaga / Obra Social (OSDE, Swiss Medical, Galeno)",
    "Peluquería & Estética"
  ],
  "Educación & Formación": [
    "Cuotas Colegio / Jardín",
    "Universidad & Terciario",
    "Cursos, Talleres & Idiomas",
    "Libros, Manuales & Fotocopias",
    "Útiles Escolares & Librería"
  ],
  "Entretenimiento, Ocio & Suscripciones": [
    "Streaming Video (Netflix, Disney+, Max, Prime)",
    "Streaming Música (Spotify, YouTube Music)",
    "Salidas, Cine & Teatro",
    "Recitales, Boliches & Fiestas",
    "Gimnasio, Club, Pádel & Deportes",
    "Videojuegos & Entretenimiento Digital"
  ],
  "Indumentaria & Calzado": [
    "Ropa Urbana & Casual",
    "Calzado, Zapatillas & Borcegos",
    "Ropa Deportiva",
    "Ropa Formal & de Trabajo",
    "Accesorios, Carteras & Mochilas"
  ],
  "Mascotas": [
    "Alimento Balanceado",
    "Veterinario, Vacunas & Pipetas",
    "Medicación & Estudios Mascota",
    "Pet Shop, Juguetes & Accesorios",
    "Peluquería Canina & Paseador"
  ],
  "Tecnología, Electro & Bazar": [
    "Celulares, Computación & Accesorios",
    "Electrodomésticos para el Hogar",
    "Muebles & Decoración",
    "Bazar, Vajilla & Cocina"
  ]
};

export const DEFAULT_CATEGORY_COLORS: CategoryColors = {
  "Alimentación & Bebidas": "#2563eb", // Royal Blue
  "Alquiler": "#7c3aed", // Deep Violet
  "Expensas": "#9333ea", // Purple
  "Servicios": "#f59e0b", // Amber
  "Transporte & Movilidad": "#10b981", // Emerald
  "Salud & Cuidado Personal": "#ec4899", // Pink
  "Educación & Formación": "#6366f1", // Indigo
  "Entretenimiento, Ocio & Suscripciones": "#8b5cf6", // Violet
  "Indumentaria & Calzado": "#06b6d4", // Cyan
  "Mascotas": "#f97316", // Orange
  "Tecnología, Electro & Bazar": "#14b8a6", // Teal
};

export const DEFAULT_BUDGETS: Budgets = {
  categories: {
    "Alimentación & Bebidas": 380000,
    "Alquiler": 450000,
    "Expensas": 85000,
    "Servicios": 120000,
    "Transporte & Movilidad": 85000,
    "Salud & Cuidado Personal": 95000,
    "Educación & Formación": 65000,
    "Entretenimiento, Ocio & Suscripciones": 55000,
    "Indumentaria & Calzado": 60000,
    "Mascotas": 45000,
    "Tecnología, Electro & Bazar": 40000
  },
  subcategories: {
    "Supermercado & Hipermercado": 230000,
    "Carnicería & Granja": 70000,
    "Verdulería & Frutería": 40000,
    "Alquiler Mensual": 450000,
    "Expensas Ordinarias": 85000,
    "Luz (Edenor / Edesur / Provincial)": 28000,
    "Gas Natural / Garrafa (Metrogas / Naturgy)": 16000,
    "Internet Wi-Fi, Fibra & Cable": 32000,
    "Carga Tarjeta SUBE (Colectivo, Tren, Subte)": 28000,
    "Combustible (Nafta / GNC)": 50000,
    "Farmacia & Medicamentos": 55000,
    "Prepaga / Obra Social (OSDE, Swiss Medical, Galeno)": 85000,
    "Alimento Balanceado": 35000
  }
};

const today = new Date();
const formatDate = (offsetDays = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  { 
    id: "1", 
    concepto: "Supermercado Carrefour", 
    descripcion: "Compras del mes y provisiones", 
    monto: 117717.00, 
    moneda: "ARS", 
    categoria: "Alimentación & Bebidas", 
    subcategoria: "Supermercado & Hipermercado",
    fecha: formatDate(1),
    tipo: "pareja",
    pagadoPor: "user1",
    splitType: "50_50",
    metodoPago: "Débito"
  },
  { 
    id: "2", 
    concepto: "Panadería & Facturas", 
    descripcion: "Pan, medialunas y chipá", 
    monto: 7220.00, 
    moneda: "ARS", 
    categoria: "Alimentación & Bebidas", 
    subcategoria: "Panadería & Facturas",
    fecha: formatDate(2),
    tipo: "pareja",
    pagadoPor: "user2",
    splitType: "50_50",
    metodoPago: "Mercado Pago"
  },
  { 
    id: "3", 
    concepto: "Almacén de barrio", 
    descripcion: "Reposición despensa y lácteos", 
    monto: 15520.00, 
    moneda: "ARS", 
    categoria: "Alimentación & Bebidas", 
    subcategoria: "Kiosco & Almacén de barrio",
    fecha: formatDate(3),
    tipo: "pareja",
    pagadoPor: "user1",
    splitType: "50_50",
    metodoPago: "Débito"
  },
  { 
    id: "4", 
    concepto: "Kiosco Open 25", 
    descripcion: "Golosinas, chicles y café al paso", 
    monto: 5000.00, 
    moneda: "ARS", 
    categoria: "Alimentación & Bebidas", 
    subcategoria: "Kiosco & Almacén de barrio",
    fecha: formatDate(4),
    tipo: "individual",
    pagadoPor: "user1",
    metodoPago: "Efectivo"
  },
  { 
    id: "5", 
    concepto: "Delivery PedidosYa", 
    descripcion: "Empanadas de carne y queso", 
    monto: 18260.00, 
    moneda: "ARS", 
    categoria: "Alimentación & Bebidas", 
    subcategoria: "Delivery (PedidosYa / Rappi)",
    fecha: formatDate(5),
    tipo: "pareja",
    pagadoPor: "user2",
    splitType: "50_50",
    metodoPago: "Mercado Pago"
  },
  { 
    id: "6", 
    concepto: "Estacionamiento", 
    descripcion: "Cochera turno médico Sanatorio", 
    monto: 7600.00, 
    moneda: "ARS", 
    categoria: "Transporte & Movilidad", 
    subcategoria: "Estacionamiento & Cocheras",
    fecha: formatDate(6),
    tipo: "pareja",
    pagadoPor: "user1",
    splitType: "50_50",
    metodoPago: "Efectivo"
  },
  { 
    id: "7", 
    concepto: "Carga de Nafta YPF", 
    descripcion: "Nafta Súper tanque lleno", 
    monto: 36936.00, 
    moneda: "ARS", 
    categoria: "Transporte & Movilidad", 
    subcategoria: "Combustible (Nafta / GNC)",
    fecha: formatDate(7),
    tipo: "pareja",
    pagadoPor: "user2",
    splitType: "50_50",
    metodoPago: "Mercado Pago"
  },
  { 
    id: "8", 
    concepto: "Corte de pelo & Peinado", 
    descripcion: "Peluquería y barbería mensual", 
    monto: 16000.00, 
    moneda: "ARS", 
    categoria: "Salud & Cuidado Personal", 
    subcategoria: "Peluquería & Estética",
    fecha: formatDate(8),
    tipo: "individual",
    pagadoPor: "user1",
    metodoPago: "Crédito"
  },
  { 
    id: "9", 
    concepto: "Carnicería Res", 
    descripcion: "Asado fin de semana, vacío y chorizos", 
    monto: 45580.00, 
    moneda: "ARS", 
    categoria: "Alimentación & Bebidas", 
    subcategoria: "Carnicería & Granja",
    fecha: formatDate(9),
    tipo: "pareja",
    pagadoPor: "user2",
    splitType: "50_50",
    metodoPago: "Transferencia"
  },
  { 
    id: "10", 
    concepto: "Farmacia Farmaplus", 
    descripcion: "Antibióticos y analgésicos recetados", 
    monto: 37214.00, 
    moneda: "ARS", 
    categoria: "Salud & Cuidado Personal", 
    subcategoria: "Farmacia & Medicamentos",
    fecha: formatDate(10),
    tipo: "pareja",
    pagadoPor: "user1",
    splitType: "50_50",
    metodoPago: "Débito"
  },
  { 
    id: "11", 
    concepto: "Prepaga OSDE 210", 
    descripcion: "Cuota mensual salud", 
    monto: 85385.00, 
    moneda: "ARS", 
    categoria: "Salud & Cuidado Personal", 
    subcategoria: "Prepaga / Obra Social (OSDE, Swiss Medical, Galeno)",
    fecha: formatDate(11),
    tipo: "pareja",
    pagadoPor: "user2",
    splitType: "50_50",
    metodoPago: "Débito"
  },
  { 
    id: "12", 
    concepto: "Carga Tarjeta SUBE", 
    descripcion: "Saldo viajes colectivo y tren", 
    monto: 8000.00, 
    moneda: "ARS", 
    categoria: "Transporte & Movilidad", 
    subcategoria: "Carga Tarjeta SUBE (Colectivo, Tren, Subte)",
    fecha: formatDate(12),
    tipo: "individual",
    pagadoPor: "user1",
    metodoPago: "Mercado Pago"
  },
  { 
    id: "13", 
    concepto: "Alquiler Departamento", 
    descripcion: "Pago mensual alquiler vivienda", 
    monto: 450000.00, 
    moneda: "ARS", 
    categoria: "Alquiler", 
    subcategoria: "Alquiler Mensual",
    fecha: formatDate(5),
    tipo: "pareja",
    pagadoPor: "user1",
    splitType: "50_50",
    metodoPago: "Transferencia"
  },
  { 
    id: "14", 
    concepto: "Expensas Edificio", 
    descripcion: "Expensas ordinarias del mes", 
    monto: 78500.00, 
    moneda: "ARS", 
    categoria: "Expensas", 
    subcategoria: "Expensas Ordinarias",
    fecha: formatDate(10),
    tipo: "pareja",
    pagadoPor: "user2",
    splitType: "50_50",
    metodoPago: "Transferencia"
  },
  { 
    id: "15", 
    concepto: "Factura de Luz Edenor", 
    descripcion: "Consumo bimestre electricidad", 
    monto: 24600.00, 
    moneda: "ARS", 
    categoria: "Servicios", 
    subcategoria: "Luz (Edenor / Edesur / Provincial)",
    fecha: formatDate(14),
    tipo: "pareja",
    pagadoPor: "user2",
    splitType: "50_50",
    metodoPago: "Débito"
  },
  { 
    id: "16", 
    concepto: "Verdulería central", 
    descripcion: "Papas, cebollas, tomates, palta y lechuga", 
    monto: 19560.00, 
    moneda: "ARS", 
    categoria: "Alimentación & Bebidas", 
    subcategoria: "Verdulería & Frutería",
    fecha: formatDate(16),
    tipo: "pareja",
    pagadoPor: "user1",
    splitType: "50_50",
    metodoPago: "Mercado Pago"
  },
  {
    id: "17",
    concepto: "Smart TV 55' 4K",
    descripcion: "Televisor para el living en cuotas sin interés",
    monto: 540000.00,
    moneda: "ARS",
    categoria: "Tecnología, Electro & Bazar",
    subcategoria: "Electrodomésticos para el Hogar",
    fecha: formatDate(45),
    tipo: "pareja",
    pagadoPor: "user1",
    splitType: "50_50",
    metodoPago: "Crédito",
    esCuotas: true,
    cuotasTotal: 6,
    cuotaActual: 2,
    montoCuota: 90000.00,
    tarjetaNombre: "Visa Santander",
    primerMesCuota: "2026-07"
  },
  {
    id: "18",
    concepto: "Heladera No Frost Inverter",
    descripcion: "Equipamiento para la cocina en 12 cuotas",
    monto: 720000.00,
    moneda: "ARS",
    categoria: "Tecnología, Electro & Bazar",
    subcategoria: "Electrodomésticos para el Hogar",
    fecha: formatDate(100),
    tipo: "pareja",
    pagadoPor: "user2",
    splitType: "50_50",
    metodoPago: "Crédito",
    esCuotas: true,
    cuotasTotal: 12,
    cuotaActual: 4,
    montoCuota: 60000.00,
    tarjetaNombre: "Mastercard BBVA",
    primerMesCuota: "2026-05"
  },
  {
    id: "19",
    concepto: "Zapatillas Running Nike",
    descripcion: "Calzado deportivo en 3 cuotas fijas",
    monto: 120000.00,
    moneda: "ARS",
    categoria: "Indumentaria & Calzado",
    subcategoria: "Calzado, Zapatillas & Borcegos",
    fecha: formatDate(10),
    tipo: "individual",
    pagadoPor: "user1",
    metodoPago: "Crédito",
    esCuotas: true,
    cuotasTotal: 3,
    cuotaActual: 1,
    montoCuota: 40000.00,
    tarjetaNombre: "Visa Santander",
    primerMesCuota: "2026-08"
  },
  {
    id: "20",
    concepto: "Monitor Curvo 27' Dell",
    descripcion: "Upgrade para home office",
    monto: 240000.00,
    moneda: "ARS",
    categoria: "Tecnología, Electro & Bazar",
    subcategoria: "Celulares, Computación & Accesorios",
    fecha: formatDate(60),
    tipo: "individual",
    pagadoPor: "user2",
    metodoPago: "Crédito",
    esCuotas: true,
    cuotasTotal: 6,
    cuotaActual: 3,
    montoCuota: 40000.00,
    tarjetaNombre: "Amex Galicia",
    primerMesCuota: "2026-06"
  }
];

export const DEFAULT_GOALS = [
  {
    id: "goal-1",
    nombre: "Viaje a Brasil (Florianópolis)",
    categoria: "viaje" as const,
    montoObjetivo: 1200000,
    montoActual: 680000,
    fechaObjetivo: "2027-01-20",
    color: "#0070f3",
    emoji: "✈️",
    descripcion: "Ahorro para pasajes de avión, hotel frente al mar y comidas",
    historial: [
      { id: "h1", monto: 350000, fecha: "2026-06-15", nota: "Aporte inicial vacaciones", tipo: "aporte" as const },
      { id: "h2", monto: 330000, fecha: "2026-07-20", nota: "Ahorro de medio aguinaldo", tipo: "aporte" as const }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    completada: false
  },
  {
    id: "goal-2",
    nombre: "Saldar Tarjeta Visa Santander",
    categoria: "deuda" as const,
    montoObjetivo: 450000,
    montoActual: 300000,
    fechaObjetivo: "2026-11-30",
    color: "#f43f5e",
    emoji: "💳",
    descripcion: "Saldar el total acumulado en compras anteriores para dejar límite libre",
    historial: [
      { id: "h3", monto: 150000, fecha: "2026-07-05", nota: "Pago extraordinario cuota 1", tipo: "aporte" as const },
      { id: "h4", monto: 150000, fecha: "2026-08-05", nota: "Pago cuota 2", tipo: "aporte" as const }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
    completada: false
  },
  {
    id: "goal-3",
    nombre: "Fondo de Emergencia (3 Meses)",
    categoria: "emergencia" as const,
    montoObjetivo: 900000,
    montoActual: 540000,
    color: "#10b981",
    emoji: "🛡️",
    descripcion: "Respaldo intocable ante imprevistos médicos o laborales",
    historial: [
      { id: "h5", monto: 270000, fecha: "2026-05-10", nota: "Base del fondo", tipo: "aporte" as const },
      { id: "h6", monto: 270000, fecha: "2026-07-10", nota: "Segundo aporte mensual", tipo: "aporte" as const }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
    completada: false
  }
];

