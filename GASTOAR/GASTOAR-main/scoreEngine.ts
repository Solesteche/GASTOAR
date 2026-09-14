import { Budgets, DailyFinancialScore, ScoreCategoryBreakdown, Transaction } from '../types';

export function getTodayDateString(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function computeDailyFinancialScore(
  transactions: Transaction[],
  budgets: Budgets,
  history: Record<string, DailyFinancialScore> = {},
  targetDate: string = getTodayDateString()
): DailyFinancialScore {
  const now = new Date();
  const parts = targetDate.split('-').map(Number);
  const year = parts[0] || now.getFullYear();
  const month = (parts[1] || now.getMonth() + 1) - 1; // 0-indexed
  const day = parts[2] || now.getDate();

  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = Math.max(1, Math.min(totalDaysInMonth, day));
  const daysRemaining = Math.max(1, totalDaysInMonth - daysElapsed + 1);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  // Transactions for the whole month
  const monthTxs = (transactions || []).filter(t => t.fecha && t.fecha.startsWith(monthPrefix));
  const monthExpenses = monthTxs.filter(t => t.tipoTransaccion !== 'ingreso');
  const monthIncomes = monthTxs.filter(t => t.tipoTransaccion === 'ingreso');

  const totalMonthExpenses = monthExpenses.reduce((acc, t) => acc + (t.monto || 0), 0);
  const totalMonthIncomes = monthIncomes.reduce((acc, t) => acc + (t.monto || 0), 0);

  // General Budget
  const catBudgets = Object.values(budgets?.categories || {}).reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
  const generalBudget = catBudgets > 0 ? catBudgets : (totalMonthIncomes > 0 ? totalMonthIncomes : 200000);

  // Today's expenses
  const todayTxs = monthExpenses.filter(t => t.fecha === targetDate);
  const todaySpent = todayTxs.reduce((acc, t) => acc + (t.monto || 0), 0);

  // Monthly Remaining and Recommended Daily Limit
  const remainingBudget = Math.max(0, generalBudget - (totalMonthExpenses - todaySpent));
  const recommendedDailyLimit = Math.max(1000, Math.round(remainingBudget / daysRemaining));

  // 1. Cumplimiento del Límite Diario (Max 40 pts)
  let limitScore = 40;
  let limitStatus: ScoreCategoryBreakdown['status'] = 'perfect';
  let limitDesc = '¡Excelente! Mantuviste tus gastos dentro del límite recomendado para hoy.';

  if (todaySpent === 0) {
    limitScore = 40;
    limitStatus = 'perfect';
    limitDesc = 'Día sin gastos registrados. ¡Ahorro total del límite diario!';
  } else if (todaySpent <= recommendedDailyLimit) {
    limitScore = 40;
    limitStatus = 'perfect';
    limitDesc = `Gastaste $${Math.round(todaySpent).toLocaleString('es-AR')} de los $${Math.round(recommendedDailyLimit).toLocaleString('es-AR')} disponibles.`;
  } else if (todaySpent <= recommendedDailyLimit * 1.15) {
    limitScore = 32;
    limitStatus = 'good';
    limitDesc = 'Leve exceso del límite diario, pero completamente controlable.';
  } else if (todaySpent <= recommendedDailyLimit * 1.35) {
    limitScore = 20;
    limitStatus = 'warning';
    limitDesc = 'Gastos por encima del promedio diario recomendado.';
  } else if (todaySpent <= recommendedDailyLimit * 1.7) {
    limitScore = 10;
    limitStatus = 'warning';
    limitDesc = 'Superaste el límite diario considerablemente.';
  } else {
    limitScore = 4;
    limitStatus = 'bad';
    limitDesc = 'Exceso significativo del límite diario.';
  }

  // 2. Disciplina de Registro y Categorización (Max 25 pts)
  let loggingScore = 25;
  let loggingStatus: ScoreCategoryBreakdown['status'] = 'perfect';
  let loggingDesc = 'Movimientos registrados con detalle, categorías y método de pago.';

  if (todayTxs.length > 0) {
    const withCategory = todayTxs.filter(t => t.categoria && t.categoria !== 'Sin Categoría').length;
    const withPayment = todayTxs.filter(t => t.metodoPago).length;
    const ratio = (withCategory + withPayment) / (todayTxs.length * 2);
    if (ratio >= 0.9) {
      loggingScore = 25;
      loggingStatus = 'perfect';
      loggingDesc = `${todayTxs.length} gasto(s) categorizados con precisión total.`;
    } else {
      loggingScore = Math.round(15 + ratio * 10);
      loggingStatus = 'good';
      loggingDesc = 'Algunos gastos no tienen categoría o método asignado.';
    }
  } else {
    loggingScore = 25;
    loggingStatus = 'perfect';
    loggingDesc = 'Día cerrado sin compras pendientes de registro.';
  }

  // 3. Ritmo de Presupuesto Mensual & Ahorro (Max 25 pts)
  const expectedPacing = daysElapsed / totalDaysInMonth; // 0 to 1
  const actualPacing = generalBudget > 0 ? (totalMonthExpenses / generalBudget) : 0;
  
  let budgetScore = 25;
  let budgetStatus: ScoreCategoryBreakdown['status'] = 'perfect';
  let budgetDesc = 'Tu ritmo de gasto mensual está alineado o por debajo del presupuesto.';

  if (actualPacing <= expectedPacing + 0.05) {
    budgetScore = 25;
    budgetStatus = 'perfect';
    budgetDesc = `Ritmo óptimo: has consumido el ${Math.round(actualPacing * 100)}% del presupuesto en el día ${daysElapsed} del mes.`;
  } else if (actualPacing <= expectedPacing + 0.15) {
    budgetScore = 18;
    budgetStatus = 'good';
    budgetDesc = 'Consumo levemente acelerado respecto a los días transcurridos.';
  } else if (actualPacing <= expectedPacing + 0.3) {
    budgetScore = 10;
    budgetStatus = 'warning';
    budgetDesc = 'El ritmo de gastos supera la proyección proporcional del mes.';
  } else {
    budgetScore = 4;
    budgetStatus = 'bad';
    budgetDesc = 'Presupuesto mensual comprometido o cerca del límite.';
  }

  // 4. Racha de Días Finalizados / Streak (Max 10 pts)
  // Calculate consecutive days finalized in history
  let streak = 1;
  const yesterday = new Date(year, month, day - 1);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
  
  if (history[yStr] && history[yStr].score >= 60) {
    streak = (history[yStr].streakDays || 1) + 1;
  }

  let streakScore = Math.min(10, 2 + streak * 2);
  let streakStatus: ScoreCategoryBreakdown['status'] = streak >= 3 ? 'perfect' : 'good';
  let streakDesc = streak > 1 
    ? `🔥 Racha de ${streak} días consecutivos cuidando tus finanzas.`
    : '¡Primer día de tu racha financiera! Mantenela mañana.';

  // Total Score (0-100)
  const totalScore = Math.min(100, Math.max(10, limitScore + loggingScore + budgetScore + streakScore));

  // Determine Rating & Color
  let rating: DailyFinancialScore['rating'] = 'Excelente';
  let ratingEmoji = '🏆';
  let color = '#10b981'; // Emerald

  if (totalScore >= 90) {
    rating = 'Excelente';
    ratingEmoji = '🏆';
    color = '#10b981';
  } else if (totalScore >= 78) {
    rating = 'Muy Bueno';
    ratingEmoji = '⭐';
    color = '#38bdf8';
  } else if (totalScore >= 65) {
    rating = 'Bueno';
    ratingEmoji = '👍';
    color = '#f59e0b';
  } else if (totalScore >= 50) {
    rating = 'Regular';
    ratingEmoji = '⚖️';
    color = '#fb923c';
  } else {
    rating = 'Atención';
    ratingEmoji = '⚠️';
    color = '#f43f5e';
  }

  // Actionable tip for tomorrow
  const tips = [
    'Evitá gastos impulsivos revisando el límite diario antes de salir a comprar.',
    'Planificá las comidas de la semana para reducir el gasto hormiga en delivery.',
    'Anotá los gastos en el momento exacto para no olvidar ningún ticket.',
    'Si hoy gastaste de más, compensá los próximos 2 días ajustando gastos prescindibles.',
    'Excelente control: considerá destinar el sobrante de hoy a tu meta de ahorro.',
    'Revisá tus suscripciones activas para dar de baja las que no estés utilizando.',
    'Aprovechá los descuentos con débito o billeteras virtuales en días puntuales.',
  ];
  const tip = tips[(day + totalScore) % tips.length];

  return {
    date: targetDate,
    score: totalScore,
    rating,
    ratingEmoji,
    color,
    dailySpent: Math.round(todaySpent),
    dailyLimit: recommendedDailyLimit,
    isWithinLimit: todaySpent <= recommendedDailyLimit,
    streakDays: streak,
    breakdown: {
      limit: {
        score: limitScore,
        maxScore: 40,
        label: 'Límite Diario',
        description: limitDesc,
        status: limitStatus,
      },
      logging: {
        score: loggingScore,
        maxScore: 25,
        label: 'Registro & Hábitos',
        description: loggingDesc,
        status: loggingStatus,
      },
      budgetPacing: {
        score: budgetScore,
        maxScore: 25,
        label: 'Ritmo de Presupuesto',
        description: budgetDesc,
        status: budgetStatus,
      },
      streak: {
        score: streakScore,
        maxScore: 10,
        label: 'Racha Consecutiva',
        description: streakDesc,
        status: streakStatus,
      },
    },
    tip,
  };
}
