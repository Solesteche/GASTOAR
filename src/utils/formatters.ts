import { CoupleProfile, DateRangePreset, Transaction } from '../types';

export function formatCurrency(amount: number, currency: string = 'ARS'): string {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatDateEs(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function isDateInRange(
  dateStr: string,
  dateRange: DateRangePreset,
  startDate?: string,
  endDate?: string,
  selectedMonth?: string
): boolean {
  if (dateRange === 'all' && !selectedMonth) return true;
  if (!dateStr) return false;

  const parts = dateStr.split('-');
  if (parts.length < 3) return true;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);

  const txDate = new Date(y, m, d);
  txDate.setHours(0, 0, 0, 0);

  const now = new Date();
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Specific selected month filter: "YYYY-MM"
  if (selectedMonth) {
    const [smY, smM] = selectedMonth.split('-').map(Number);
    if (y !== smY || m !== smM - 1) return false;
  }

  if (dateRange === 'all') return true;

  if (dateRange === 'today') {
    return txDate.getTime() === todayZero.getTime();
  }

  if (dateRange === 'this_week') {
    const day = todayZero.getDay(); // 0 is Sunday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(todayZero);
    monday.setDate(todayZero.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return txDate >= monday && txDate <= sunday;
  }

  if (dateRange === 'this_month') {
    return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
  }

  if (dateRange === 'last_month') {
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    return txDate.getFullYear() === lastMonthYear && txDate.getMonth() === lastMonth;
  }

  if (dateRange === 'last_30_days') {
    const past30 = new Date(todayZero);
    past30.setDate(todayZero.getDate() - 30);
    return txDate >= past30 && txDate <= todayZero;
  }

  if (dateRange === 'last_90_days') {
    const past90 = new Date(todayZero);
    past90.setDate(todayZero.getDate() - 90);
    return txDate >= past90 && txDate <= todayZero;
  }

  if (dateRange === 'this_year') {
    return txDate.getFullYear() === now.getFullYear();
  }

  if (dateRange === 'custom') {
    if (startDate) {
      const [sy, smNum, sd] = startDate.split('-').map(Number);
      const start = new Date(sy, smNum - 1, sd);
      start.setHours(0, 0, 0, 0);
      if (txDate < start) return false;
    }
    if (endDate) {
      const [ey, emNum, ed] = endDate.split('-').map(Number);
      const end = new Date(ey, emNum - 1, ed);
      end.setHours(23, 59, 59, 999);
      if (txDate > end) return false;
    }
    return true;
  }

  return true;
}

export function getDateRangeDescription(
  dateRange: DateRangePreset,
  startDate?: string,
  endDate?: string,
  selectedMonth?: string
): string {
  if (selectedMonth) {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }

  switch (dateRange) {
    case 'today':
      return 'Hoy';
    case 'this_week':
      return 'Esta semana';
    case 'this_month':
      return 'Este mes';
    case 'last_month':
      return 'Mes anterior';
    case 'last_30_days':
      return 'Últimos 30 días';
    case 'last_90_days':
      return 'Últimos 90 días';
    case 'this_year':
      return 'Este año (' + new Date().getFullYear() + ')';
    case 'custom':
      if (startDate && endDate) {
        return `${formatDateEs(startDate)} - ${formatDateEs(endDate)}`;
      } else if (startDate) {
        return `Desde ${formatDateEs(startDate)}`;
      } else if (endDate) {
        return `Hasta ${formatDateEs(endDate)}`;
      }
      return 'Rango personalizado';
    case 'all':
    default:
      return 'Todo el historial';
  }
}

export interface CoupleBalanceSummary {
  totalCoupleSpent: number;
  user1Paid: number;
  user2Paid: number;
  user1ShouldPay: number;
  user2ShouldPay: number;
  // Positive: user2 owes user1. Negative: user1 owes user2. 0: settled
  netBalance: number;
  whoOwesWhom: 'even' | 'user2_owes_user1' | 'user1_owes_user2';
  debtAmount: number;
}

export function calculateCoupleBalances(
  transactions: Transaction[],
  profile: CoupleProfile
): CoupleBalanceSummary {
  const coupleTxs = transactions.filter(t => t.tipo === 'pareja');

  let totalCoupleSpent = 0;
  let user1Paid = 0;
  let user2Paid = 0;
  let user1ShouldPay = 0;
  let user2ShouldPay = 0;

  coupleTxs.forEach(tx => {
    const amount = tx.monto || 0;
    totalCoupleSpent += amount;

    if (tx.pagadoPor === 'user1') {
      user1Paid += amount;
    } else {
      user2Paid += amount;
    }

    // Determine proportions
    let u1Share = 0.5;
    let u2Share = 0.5;

    if (tx.splitType === '60_40') {
      u1Share = 0.6;
      u2Share = 0.4;
    } else if (tx.splitType === '70_30') {
      u1Share = 0.7;
      u2Share = 0.3;
    } else if (tx.splitType === '100_user1') {
      u1Share = 1.0;
      u2Share = 0.0;
    } else if (tx.splitType === '100_user2') {
      u1Share = 0.0;
      u2Share = 1.0;
    } else if (tx.splitType === 'custom_percent' && tx.user1Percent !== undefined && tx.user2Percent !== undefined) {
      u1Share = tx.user1Percent / 100;
      u2Share = tx.user2Percent / 100;
    } else if (tx.splitType === 'custom_amount' && (tx.user1Amount !== undefined || tx.user2Amount !== undefined)) {
      const u1Amt = tx.user1Amount ?? (amount - (tx.user2Amount || 0));
      const u2Amt = tx.user2Amount ?? (amount - u1Amt);
      user1ShouldPay += u1Amt;
      user2ShouldPay += u2Amt;
      return;
    }

    user1ShouldPay += amount * u1Share;
    user2ShouldPay += amount * u2Share;
  });

  // Net balance: what user1 paid vs what user1 should pay
  // If user1Paid > user1ShouldPay, user2 owes user1 the difference
  const netBalance = user1Paid - user1ShouldPay;
  const debtAmount = Math.abs(netBalance);

  let whoOwesWhom: 'even' | 'user2_owes_user1' | 'user1_owes_user2' = 'even';
  if (debtAmount > 0.01) {
    if (netBalance > 0) {
      whoOwesWhom = 'user2_owes_user1';
    } else {
      whoOwesWhom = 'user1_owes_user2';
    }
  }

  return {
    totalCoupleSpent,
    user1Paid,
    user2Paid,
    user1ShouldPay,
    user2ShouldPay,
    netBalance,
    whoOwesWhom,
    debtAmount,
  };
}

export function exportTransactionsToCSV(transactions: Transaction[], currency: string = 'ARS') {
  if (transactions.length === 0) return;

  const headers = ['Fecha', 'Concepto', 'Descripción', 'Tipo', 'Categoría', 'Subcategoría', 'Monto', 'Moneda', 'Pagado Por', 'División', 'Método Pago'];
  const rows = transactions.map(t => [
    t.fecha,
    `"${(t.concepto || '').replace(/"/g, '""')}"`,
    `"${(t.descripcion || '').replace(/"/g, '""')}"`,
    t.tipo === 'pareja' ? 'En Pareja' : 'Individual',
    `"${(t.categoria || '').replace(/"/g, '""')}"`,
    `"${(t.subcategoria || '').replace(/"/g, '""')}"`,
    t.monto,
    t.moneda || currency,
    t.pagadoPor === 'user1' ? 'Usuario 1' : 'Usuario 2',
    t.splitType || (t.tipo === 'pareja' ? '50/50' : '-'),
    t.metodoPago || 'Efectivo',
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `control_gastos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
