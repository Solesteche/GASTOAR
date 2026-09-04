export type ExpenseMode = 'all' | 'individual' | 'pareja';

export type SplitType = '50_50' | '60_40' | '70_30' | '100_user1' | '100_user2' | 'custom_percent' | 'custom_amount';

export type PaymentMethod = 'Efectivo' | 'Débito' | 'Crédito' | 'Transferencia' | 'Mercado Pago' | 'Otro';

export interface Transaction {
  id: string;
  concepto: string;
  descripcion?: string;
  monto: number; // Monto total de la compra o ingreso
  moneda: string;
  categoria: string;
  subcategoria: string;
  fecha: string; // YYYY-MM-DD
  tipo: 'individual' | 'pareja';
  tipoTransaccion?: 'gasto' | 'ingreso'; // Indica si es un gasto o un ingreso
  pagadoPor: string; // user1 ID/Name or user2 ID/Name (quién pagó o quién recibió el ingreso)
  splitType?: SplitType;
  // User percentages for shared expenses: user1Percent + user2Percent = 100
  user1Percent?: number;
  user2Percent?: number;
  // Exact user amounts if custom_amount
  user1Amount?: number;
  user2Amount?: number;
  metodoPago?: PaymentMethod;
  // Installment (Cuotas) fields
  esCuotas?: boolean;
  cuotasTotal?: number; // Total number of installments (e.g. 3, 6, 12, 18, 24)
  cuotaActual?: number; // Current paid installment (e.g. 1 of 6)
  montoCuota?: number; // Amount per installment (calculated as monto / cuotasTotal or custom)
  tarjetaNombre?: string; // e.g. "Visa Santander", "Mastercard BBVA", "Amex Galicia", etc.
  primerMesCuota?: string; // YYYY-MM representing the first billing month
  fechaPrimerPago?: string; // YYYY-MM-DD exact due date / payment date of the 1st installment
  notas?: string;
  comprobanteUrl?: string;
  createdAt?: number;
}

export interface CoupleProfile {
  accountCode: string;
  user1Name: string;
  user2Name: string;
  currentUser: 'user1' | 'user2';
  currency: string;
  defaultSplit: SplitType;
  lastSettledDate?: string;
}

export interface CategoryMap {
  [category: string]: string[];
}

export interface CategoryColors {
  [category: string]: string;
}

export interface Budgets {
  categories: { [category: string]: number };
  subcategories: { [subcategory: string]: number };
  alertThresholdPercent?: number; // Percentage (e.g. 70, 80, 85, 90) when warning alert triggers
  projectionGrowthPercent?: number; // Last applied growth/inflation projection percentage
  lastProjectedDate?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  password?: string;
  partnerName?: string;
  accountType: 'pareja' | 'individual';
  accountCode: string;
  currency: string;
  selectedPlanId?: SubscriptionPlanId;
  createdAt: number;
}

export interface SettlementRecord {
  id: string;
  date: string;
  totalSettled: number;
  payerName: string;
  receiverName: string;
  amount: number;
  notes?: string;
}

export type DateRangePreset = 
  | 'all' 
  | 'today' 
  | 'this_week' 
  | 'this_month' 
  | 'last_month' 
  | 'last_30_days' 
  | 'last_90_days' 
  | 'this_year' 
  | 'custom';

export interface GoalContribution {
  id: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  nota?: string;
  tipo: 'aporte' | 'retiro';
}

export type GoalCategory = 'viaje' | 'deuda' | 'emergencia' | 'hogar' | 'vehiculo' | 'ahorro' | 'otro';

export interface Goal {
  id: string;
  nombre: string;
  categoria: GoalCategory;
  montoObjetivo: number;
  montoActual: number;
  fechaObjetivo?: string; // YYYY-MM-DD
  color: string; // Hex color code or Tailwind accent
  emoji: string;
  icono?: string;
  descripcion?: string;
  historial?: GoalContribution[];
  createdAt: number;
  completada?: boolean;
}

export interface FilterState {
  search: string;
  mode: ExpenseMode;
  categoria: string;
  subcategoria: string;
  dateRange: DateRangePreset;
  startDate?: string;
  endDate?: string;
  selectedMonth?: string;
  pagadoPor: string;
  metodoPago: string;
  soloCuotas?: 'ALL' | 'solo_cuotas' | 'sin_cuotas';
}

export type SubscriptionPlanId = 'free' | 'individual' | 'pareja' | 'pro_ai';

export type SubscriptionStatus = 'active' | 'trial' | 'pending_payment' | 'past_due' | 'canceled';

export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  badgeText?: string;
  tagline: string;
  description?: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  features: string[];
  isPopular?: boolean;
  highlighted?: boolean;
  isPro?: boolean;
  maxUsers: number;
  hasAiAssistant: boolean;
  hasCoupleSync: boolean;
  hasInstallmentManager: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  partnerName?: string;
  accountCode: string;
  planId: SubscriptionPlanId;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  pricePaid: number;
  currency: string;
  paymentMethod: string; // e.g. "Mercado Pago"
  mercadopagoPaymentId?: string;
  mercadopagoPreferenceId?: string;
  startDate: string; // YYYY-MM-DD
  lastPaymentDate?: string; // YYYY-MM-DD
  nextRenewalDate?: string; // YYYY-MM-DD
  trialEndsDate?: string; // YYYY-MM-DD
  trialDaysGranted?: number; // e.g. 15
  createdAt: number;
  autoRenew: boolean;
  notes?: string;
}

export interface MercadoPagoPaymentDetails {
  paymentId: string;
  status: 'approved' | 'pending' | 'rejected' | 'in_process';
  statusDetail?: string;
  transactionAmount: number;
  paymentMethodId: string; // 'account_money' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'ticket'
  cardLastFourDigits?: string;
  installments?: number;
  payerEmail: string;
  payerName?: string;
  dateApproved?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
}

export interface ScoreCategoryBreakdown {
  score: number;
  maxScore: number;
  label: string;
  description: string;
  status: 'perfect' | 'good' | 'warning' | 'bad';
}

export interface DailyFinancialScore {
  date: string; // YYYY-MM-DD
  score: number; // 0 to 100
  rating: 'Excelente' | 'Muy Bueno' | 'Bueno' | 'Regular' | 'Atención';
  ratingEmoji: string;
  color: string;
  dailySpent: number;
  dailyLimit: number;
  isWithinLimit: boolean;
  streakDays: number;
  breakdown: {
    limit: ScoreCategoryBreakdown;
    logging: ScoreCategoryBreakdown;
    budgetPacing: ScoreCategoryBreakdown;
    streak: ScoreCategoryBreakdown;
  };
  tip: string;
  unlockedAt?: number;
}

