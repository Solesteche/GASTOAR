import { Transaction, CoupleProfile } from '../types';

export interface InstallmentScheduleItem {
  cuotaNum: number;
  cuotasTotal: number;
  dueDate: string; // YYYY-MM-DD
  dueDateFormatted: string; // e.g. "10 Sep 2026"
  monthKey: string; // YYYY-MM
  amount: number;
  isPaid: boolean;
  isNext: boolean;
}

export interface InstallmentPlanDetails {
  firstDueDate: string;
  firstDueDateFormatted: string;
  nextDueDate: string | null;
  nextDueDateFormatted: string | null;
  finalDueDate: string;
  finalDueDateFormatted: string;
  remainingCuotas: number;
  remainingAmount: number;
  paidCuotas: number;
  paidAmount: number;
  progressPct: number;
  isCompleted: boolean;
  schedule: InstallmentScheduleItem[];
}

export interface MonthlyInstallmentDueItem {
  txId: string;
  concepto: string;
  tarjetaNombre: string;
  cuotaNum: number;
  cuotasTotal: number;
  amount: number;
  dueDate: string;
  dueDateFormatted: string;
  pagadoPor: string;
  tipo: 'individual' | 'pareja';
  isPaid: boolean;
  isNext: boolean;
}

export interface MonthInstallmentSummary {
  monthKey: string; // YYYY-MM
  monthLabel: string; // "Sep 26"
  monthFullLabel: string; // "Septiembre 2026"
  totalAmount: number;
  user1Amount: number;
  user2Amount: number;
  itemsCount: number;
  items: MonthlyInstallmentDueItem[];
}

const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_NAMES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Calculates complete dates and schedule for a single installment transaction
 */
export function getInstallmentPlanDetails(tx: Transaction): InstallmentPlanDetails {
  const cuotasTotal = Math.max(1, tx.cuotasTotal || 1);
  const cuotaActual = Math.max(0, Math.min(cuotasTotal, tx.cuotaActual || 1));
  const cuotaMonto = tx.montoCuota || (tx.monto / cuotasTotal);
  const isCompleted = cuotaActual >= cuotasTotal;
  const remainingCuotas = Math.max(0, cuotasTotal - cuotaActual);
  const remainingAmount = remainingCuotas * cuotaMonto;
  const paidCuotas = cuotaActual;
  const paidAmount = paidCuotas * cuotaMonto;
  const progressPct = Math.min(100, Math.round((paidCuotas / cuotasTotal) * 100));

  // Determine base date (1st installment due date)
  let baseYear: number;
  let baseMonth: number;
  let baseDay: number;

  if (tx.fechaPrimerPago) {
    const parts = tx.fechaPrimerPago.split('-');
    baseYear = parseInt(parts[0]) || new Date().getFullYear();
    baseMonth = (parseInt(parts[1]) || 1) - 1;
    baseDay = parseInt(parts[2]) || 10;
  } else if (tx.primerMesCuota) {
    const parts = tx.primerMesCuota.split('-');
    baseYear = parseInt(parts[0]) || new Date().getFullYear();
    baseMonth = (parseInt(parts[1]) || 1) - 1;
    baseDay = 10;
  } else {
    const txDate = tx.fecha ? new Date(tx.fecha) : new Date();
    baseYear = txDate.getFullYear();
    baseMonth = txDate.getMonth() + 1; // Default next month for credit cards
    baseDay = 10;
  }

  const schedule: InstallmentScheduleItem[] = [];

  for (let i = 0; i < cuotasTotal; i++) {
    const quotaNum = i + 1;
    const targetDate = new Date(baseYear, baseMonth + i, baseDay);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dateFormatted = `${targetDate.getDate()} ${MONTH_NAMES_SHORT[targetDate.getMonth()]} ${yyyy}`;
    const monthKey = `${yyyy}-${mm}`;
    
    const isPaid = quotaNum <= cuotaActual;
    const isNext = quotaNum === cuotaActual + 1;

    schedule.push({
      cuotaNum: quotaNum,
      cuotasTotal,
      dueDate: dateStr,
      dueDateFormatted: dateFormatted,
      monthKey,
      amount: cuotaMonto,
      isPaid,
      isNext,
    });
  }

  const firstItem = schedule[0];
  const lastItem = schedule[schedule.length - 1];
  const nextItem = schedule.find(s => s.isNext) || (isCompleted ? null : firstItem);

  return {
    firstDueDate: firstItem ? firstItem.dueDate : '',
    firstDueDateFormatted: firstItem ? firstItem.dueDateFormatted : '',
    nextDueDate: nextItem ? nextItem.dueDate : null,
    nextDueDateFormatted: nextItem ? nextItem.dueDateFormatted : null,
    finalDueDate: lastItem ? lastItem.dueDate : '',
    finalDueDateFormatted: lastItem ? lastItem.dueDateFormatted : '',
    remainingCuotas,
    remainingAmount,
    paidCuotas,
    paidAmount,
    progressPct,
    isCompleted,
    schedule,
  };
}

/**
 * Calculates month-by-month payments schedule across all transactions
 */
export function getMonthlyInstallmentsOverview(
  transactions: Transaction[],
  profile: CoupleProfile,
  monthsSpan: number = 10
): MonthInstallmentSummary[] {
  const installmentTxs = transactions.filter(tx => 
    Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1))
  );

  const today = new Date();
  const startYear = today.getFullYear();
  const startMonth = today.getMonth(); // 0-indexed

  const monthsMap = new Map<string, MonthInstallmentSummary>();

  // Pre-populate upcoming months
  for (let i = 0; i < monthsSpan; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yyyy}-${mm}`;
    const monthLabel = `${MONTH_NAMES_SHORT[d.getMonth()]} ${yyyy.toString().slice(2)}`;
    const monthFullLabel = `${MONTH_NAMES_FULL[d.getMonth()]} ${yyyy}`;

    monthsMap.set(key, {
      monthKey: key,
      monthLabel,
      monthFullLabel,
      totalAmount: 0,
      user1Amount: 0,
      user2Amount: 0,
      itemsCount: 0,
      items: [],
    });
  }

  // Distribute every quota into its target month
  installmentTxs.forEach(tx => {
    const details = getInstallmentPlanDetails(tx);

    details.schedule.forEach(item => {
      // Find matching month
      let monthSummary = monthsMap.get(item.monthKey);

      // If outside pre-populated span but within future bounds, create it if needed
      if (!monthSummary && item.monthKey >= `${startYear}-${String(startMonth + 1).padStart(2, '0')}`) {
        const [y, m] = item.monthKey.split('-');
        const yNum = parseInt(y);
        const mNum = parseInt(m) - 1;
        monthSummary = {
          monthKey: item.monthKey,
          monthLabel: `${MONTH_NAMES_SHORT[mNum]} ${y.slice(2)}`,
          monthFullLabel: `${MONTH_NAMES_FULL[mNum]} ${y}`,
          totalAmount: 0,
          user1Amount: 0,
          user2Amount: 0,
          itemsCount: 0,
          items: [],
        };
        monthsMap.set(item.monthKey, monthSummary);
      }

      if (monthSummary) {
        monthSummary.totalAmount += item.amount;
        monthSummary.itemsCount += 1;
        monthSummary.items.push({
          txId: tx.id,
          concepto: tx.concepto,
          tarjetaNombre: tx.tarjetaNombre || 'Tarjeta Crédito',
          cuotaNum: item.cuotaNum,
          cuotasTotal: item.cuotasTotal,
          amount: item.amount,
          dueDate: item.dueDate,
          dueDateFormatted: item.dueDateFormatted,
          pagadoPor: tx.pagadoPor,
          tipo: tx.tipo,
          isPaid: item.isPaid,
          isNext: item.isNext,
        });

        // Split calculation
        if (tx.tipo === 'individual') {
          if (tx.pagadoPor === 'user1') {
            monthSummary.user1Amount += item.amount;
          } else {
            monthSummary.user2Amount += item.amount;
          }
        } else {
          let p1 = 50;
          let p2 = 50;
          if (tx.splitType === '60_40') { p1 = 60; p2 = 40; }
          else if (tx.splitType === '70_30') { p1 = 70; p2 = 30; }
          else if (tx.splitType === '100_user1') { p1 = 100; p2 = 0; }
          else if (tx.splitType === '100_user2') { p1 = 0; p2 = 100; }
          else if (tx.splitType === 'custom_percent') {
            p1 = tx.user1Percent ?? 50;
            p2 = tx.user2Percent ?? 50;
          }
          monthSummary.user1Amount += (item.amount * p1) / 100;
          monthSummary.user2Amount += (item.amount * p2) / 100;
        }
      }
    });
  });

  // Sort by monthKey chronologically
  return Array.from(monthsMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}
