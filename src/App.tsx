import React, { useState, useEffect, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  Sidebar 
} from './components/Sidebar';
import { 
  MobileBottomNav 
} from './components/MobileBottomNav';
import { 
  KpiCards 
} from './components/KpiCards';
import { 
  CoupleBalanceBanner 
} from './components/CoupleBalanceBanner';
import { 
  ChartsSection 
} from './components/ChartsSection';
import { 
  BudgetSection 
} from './components/BudgetSection';
import { 
  TransactionsTable 
} from './components/TransactionsTable';
import { 
  InstallmentsSection 
} from './components/InstallmentsSection';
import {
  DateFilterBar
} from './components/DateFilterBar';
import { 
  TransactionModal 
} from './components/TransactionModal';
import { 
  AiAssistantModal 
} from './components/AiAssistantModal';
import { 
  CategoryManagerModal 
} from './components/CategoryManagerModal';
import { 
  BudgetModal 
} from './components/BudgetModal';
import { 
  CoupleSettingsModal 
} from './components/CoupleSettingsModal';
import { 
  SettlementModal 
} from './components/SettlementModal';
import { 
  ToastContainer, 
  ToastMessage 
} from './components/Toast';
import { 
  AuthLandingPage 
} from './components/AuthLandingPage';
import { 
  DashboardOverview 
} from './components/DashboardOverview';
import { 
  IncomeModal 
} from './components/IncomeModal';
import { 
  PriorInstallmentsModal 
} from './components/PriorInstallmentsModal';
import { 
  GoalsSection 
} from './components/GoalsSection';
import { 
  SubscriptionsView 
} from './components/SubscriptionsView';
import { 
  SubscriptionAdminPanel 
} from './components/SubscriptionAdminPanel';
import { 
  BillingCycle,
  Budgets, 
  CategoryColors, 
  CategoryMap, 
  CoupleProfile, 
  ExpenseMode, 
  FilterState, 
  Goal, 
  GoalContribution, 
  SettlementRecord, 
  SubscriptionPlan,
  SubscriptionPlanId,
  Transaction,
  UserAccount,
  UserSubscription
} from './types';
import { 
  DEFAULT_BUDGETS, 
  DEFAULT_CATEGORY_COLORS, 
  DEFAULT_CATEGORY_MAP, 
  DEFAULT_COUPLE_PROFILE, 
  DEFAULT_GOALS, 
  DEFAULT_TRANSACTIONS 
} from './data/initialData';
import { 
  INITIAL_USER_SUBSCRIPTIONS, 
  SUBSCRIPTION_PLANS 
} from './data/subscriptionPlans';
import { 
  calculateCoupleBalances, 
  exportTransactionsToCSV,
  isDateInRange 
} from './utils/formatters';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('control_gastos_is_authenticated') === 'true';
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('control_gastos_is_admin') === 'true';
  });

  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('control_gastos_account_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return null;
  });

  // User Subscriptions State (Admin and active client subscription)
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>(() => {
    const saved = localStorage.getItem('control_gastos_subscriptions_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_USER_SUBSCRIPTIONS;
  });

  // Application State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('control_gastos_tx_v5');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_TRANSACTIONS;
  });

  const [categoryMap, setCategoryMap] = useState<CategoryMap>(() => {
    const saved = localStorage.getItem('control_gastos_catmap_v5');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_CATEGORY_MAP;
  });

  const [categoryColors, setCategoryColors] = useState<CategoryColors>(() => {
    const saved = localStorage.getItem('control_gastos_colors_v5');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_CATEGORY_COLORS;
  });

  const [budgets, setBudgets] = useState<Budgets>(() => {
    const saved = localStorage.getItem('control_gastos_budgets_v5');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_BUDGETS;
  });

  const [profile, setProfile] = useState<CoupleProfile>(() => {
    const saved = localStorage.getItem('control_gastos_profile_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_COUPLE_PROFILE;
  });

  const [settlementHistory, setSettlementHistory] = useState<SettlementRecord[]>(() => {
    const saved = localStorage.getItem('control_gastos_settlements_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('control_gastos_goals_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_GOALS;
  });

  // UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'installments' | 'couple_balance' | 'budgets' | 'categories' | 'ai' | 'settlement' | 'goals' | 'subscriptions' | 'admin_subscriptions'>('dashboard');
  const [activeMode, setActiveMode] = useState<ExpenseMode>('all');
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() => {
    return localStorage.getItem('control_gastos_sidebar_pinned') !== 'false';
  });
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalInitialType, setTxModalInitialType] = useState<'gasto' | 'ingreso'>('gasto');
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isPriorInstallmentsModalOpen, setIsPriorInstallmentsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialIsCuotas, setInitialIsCuotas] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    mode: 'all',
    categoria: 'ALL',
    subcategoria: 'ALL',
    dateRange: 'all',
    pagadoPor: 'ALL',
    metodoPago: 'ALL',
    soloCuotas: 'ALL',
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('control_gastos_tx_v5', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('control_gastos_catmap_v5', JSON.stringify(categoryMap));
  }, [categoryMap]);

  useEffect(() => {
    localStorage.setItem('control_gastos_colors_v5', JSON.stringify(categoryColors));
  }, [categoryColors]);

  useEffect(() => {
    localStorage.setItem('control_gastos_budgets_v5', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('control_gastos_profile_v3', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('control_gastos_settlements_v3', JSON.stringify(settlementHistory));
  }, [settlementHistory]);

  useEffect(() => {
    localStorage.setItem('control_gastos_goals_v1', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('control_gastos_subscriptions_v1', JSON.stringify(subscriptions));
  }, [subscriptions]);

  // Subscription Handlers
  const handleUpdateSubscription = (id: string, updates: Partial<UserSubscription>) => {
    setSubscriptions(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    showToast('Suscripción actualizada correctamente', 'success');
  };

  const handleAddSubscription = (newSub: Omit<UserSubscription, 'id' | 'createdAt'>) => {
    const created: UserSubscription = {
      ...newSub,
      id: 'sub-' + Date.now(),
      createdAt: Date.now(),
    };
    setSubscriptions(prev => [created, ...prev]);
    showToast(`Suscripción de ${created.userName} registrada con éxito`, 'success');
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    showToast('Registro de suscripción eliminado', 'info');
  };

  const handleSelectPlanPayment = (plan: SubscriptionPlan, cycle: BillingCycle) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    if (cycle === 'annual') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    const newPaymentId = `MP-${Math.floor(800000000 + Math.random() * 199999999)}`;
    const price = cycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

    const email = currentUserAccount?.email || 'estechesol@gmail.com';
    const existing = subscriptions.find(s => s.userEmail.toLowerCase() === email.toLowerCase());

    if (existing) {
      handleUpdateSubscription(existing.id, {
        planId: plan.id,
        planName: plan.name,
        billingCycle: cycle,
        pricePaid: price,
        status: 'active',
        lastPaymentDate: todayStr,
        nextRenewalDate: nextDate.toISOString().split('T')[0],
        mercadopagoPaymentId: newPaymentId,
      });
    } else {
      handleAddSubscription({
        userId: currentUserAccount?.id || 'usr-current',
        userEmail: email,
        userName: currentUserAccount?.name || profile.user1Name,
        partnerName: currentUserAccount?.partnerName || profile.user2Name,
        accountCode: profile.accountCode,
        planId: plan.id,
        planName: plan.name,
        status: 'active',
        billingCycle: cycle,
        pricePaid: price,
        currency: 'ARS',
        paymentMethod: 'Mercado Pago',
        mercadopagoPaymentId: newPaymentId,
        startDate: todayStr,
        lastPaymentDate: todayStr,
        nextRenewalDate: nextDate.toISOString().split('T')[0],
        autoRenew: true,
        notes: 'Abonado vía Mercado Pago Checkout.',
      });
    }

    showToast(`¡Plan ${plan.name} activado con éxito vía Mercado Pago!`, 'success');
  };

  useEffect(() => {
    localStorage.setItem('control_gastos_goals_v1', JSON.stringify(goals));
  }, [goals]);

  const toggleSidebarPin = () => {
    setIsSidebarPinned(prev => {
      const next = !prev;
      localStorage.setItem('control_gastos_sidebar_pinned', String(next));
      return next;
    });
  };

  // Keep filters.mode in sync with activeMode
  const handleModeChange = (mode: ExpenseMode) => {
    setActiveMode(mode);
    setFilters(prev => ({ ...prev, mode }));
  };

  // Calculate Couple Debt and Balances
  const debtInfo = useMemo(() => {
    return calculateCoupleBalances(transactions, profile);
  }, [transactions, profile]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 0. Date Range Filter
      if (!isDateInRange(tx.fecha, filters.dateRange, filters.startDate, filters.endDate, filters.selectedMonth)) {
        return false;
      }

      // 1. Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchConcept = tx.concepto.toLowerCase().includes(query);
        const matchDesc = tx.descripcion ? tx.descripcion.toLowerCase().includes(query) : false;
        if (!matchConcept && !matchDesc) return false;
      }

      // 2. Mode (all / individual / pareja)
      if (filters.mode === 'individual' && tx.tipo !== 'individual') return false;
      if (filters.mode === 'pareja' && tx.tipo !== 'pareja') return false;

      // 3. Category
      if (filters.categoria !== 'ALL' && tx.categoria !== filters.categoria) return false;

      // 4. Subcategory
      if (filters.subcategoria !== 'ALL' && tx.subcategoria !== filters.subcategoria) return false;

      // 5. Solo Cuotas filter
      if (filters.soloCuotas === 'solo_cuotas') {
        const isInst = Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1));
        if (!isInst) return false;
      }
      if (filters.soloCuotas === 'sin_cuotas') {
        const isInst = Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1));
        if (isInst) return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Global Budget calculations
  const globalBudget = useMemo(() => {
    const totalBudget = (Object.values(budgets.categories) as (number | undefined)[]).reduce<number>((acc, b) => acc + (b || 0), 0);
    const totalSpent = filteredTransactions.reduce<number>((acc, t) => acc + (t.monto || 0), 0);
    const percentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    return { totalBudget, totalSpent, percentage };
  }, [budgets, filteredTransactions]);

  // Top spending category
  const topCategory = useMemo(() => {
    const sums: { [cat: string]: number } = {};
    filteredTransactions.forEach(t => {
      sums[t.categoria] = (sums[t.categoria] || 0) + t.monto;
    });
    let bestCat = '-';
    let bestAmount = 0;
    Object.entries(sums).forEach(([cat, amt]) => {
      if (amt > bestAmount) {
        bestAmount = amt;
        bestCat = cat;
      }
    });
    return { name: bestCat, amount: bestAmount };
  }, [filteredTransactions]);

  // Handlers
  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    if (txData.id) {
      // Edit existing transaction
      setTransactions(prev => prev.map(t => (t.id === txData.id ? { ...t, ...txData } as Transaction : t)));
      showToast(txData.tipoTransaccion === 'ingreso' ? 'Ingreso actualizado correctamente' : 'Gasto actualizado correctamente', 'success');
    } else {
      // Create new transaction
      const isIncome = txData.tipoTransaccion === 'ingreso';
      const newTx: Transaction = {
        id: Date.now().toString(),
        concepto: txData.concepto || (isIncome ? 'Nuevo Ingreso' : 'Nuevo Gasto'),
        descripcion: txData.descripcion || '',
        monto: txData.monto || 0,
        moneda: profile.currency || 'ARS',
        categoria: txData.categoria || (isIncome ? 'Ingresos' : (Object.keys(categoryMap)[0] || 'Alimentación')),
        subcategoria: txData.subcategoria || 'General',
        fecha: txData.fecha || new Date().toISOString().split('T')[0],
        tipo: txData.tipo || (isIncome ? 'individual' : 'pareja'),
        tipoTransaccion: txData.tipoTransaccion || 'gasto',
        pagadoPor: txData.pagadoPor || profile.currentUser,
        splitType: txData.splitType || (!isIncome && txData.tipo === 'pareja' ? '50_50' : undefined),
        user1Percent: txData.user1Percent,
        user2Percent: txData.user2Percent,
        metodoPago: txData.metodoPago || (isIncome ? 'Transferencia' : 'Débito'),
        esCuotas: isIncome ? false : txData.esCuotas,
        cuotasTotal: isIncome ? undefined : txData.cuotasTotal,
        cuotaActual: isIncome ? undefined : txData.cuotaActual,
        montoCuota: isIncome ? undefined : txData.montoCuota,
        tarjetaNombre: isIncome ? undefined : txData.tarjetaNombre,
        primerMesCuota: isIncome ? undefined : txData.primerMesCuota,
      };
      setTransactions(prev => [newTx, ...prev]);
      if (isIncome) {
        showToast('Ingreso registrado con éxito', 'success');
      } else {
        showToast(newTx.esCuotas ? 'Compra en cuotas registrada con éxito' : 'Gasto registrado con éxito', 'success');
      }
    }
    setIsTxModalOpen(false);
    setIsIncomeModalOpen(false);
    setEditingTransaction(null);
    setInitialIsCuotas(false);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setInitialIsCuotas(Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1)));
    setTxModalInitialType(tx.tipoTransaccion === 'ingreso' ? 'ingreso' : 'gasto');
    setIsTxModalOpen(true);
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const copyTx: Transaction = {
      ...tx,
      id: Date.now().toString(),
      fecha: new Date().toISOString().split('T')[0],
      concepto: `${tx.concepto} (Copia)`,
    };
    setTransactions(prev => [copyTx, ...prev]);
    showToast('Gasto duplicado', 'info');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast('Gasto eliminado', 'info');
  };

  // Installments Progress Handler (+1 or -1 quota)
  const handleUpdateInstallmentProgress = (txId: string, delta: number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== txId) return t;
      const total = t.cuotasTotal || 1;
      const current = t.cuotaActual || 1;
      const nextCuota = Math.max(1, Math.min(total, current + delta));
      
      if (nextCuota === total && delta > 0) {
        showToast(`¡Plan completado! Pagaste todas las cuotas de "${t.concepto}"`, 'success');
      } else if (delta > 0) {
        showToast(`Cuota ${nextCuota} de ${total} pagada para "${t.concepto}"`, 'info');
      }

      return {
        ...t,
        cuotaActual: nextCuota,
      };
    }));
  };

  // Complete / Liquidate Installment Plan
  const handleCompleteInstallment = (txId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== txId) return t;
      const total = t.cuotasTotal || 1;
      showToast(`¡Plan de cuotas de "${t.concepto}" marcado como totalmente pagado!`, 'success');
      return {
        ...t,
        cuotaActual: total,
      };
    }));
  };

  const handleResetData = () => {
    if (window.confirm('¿Estás seguro de restablecer todos los datos a los valores iniciales de ejemplo?')) {
      setTransactions(DEFAULT_TRANSACTIONS);
      setCategoryMap(DEFAULT_CATEGORY_MAP);
      setCategoryColors(DEFAULT_CATEGORY_COLORS);
      setBudgets(DEFAULT_BUDGETS);
      setProfile(DEFAULT_COUPLE_PROFILE);
      setSettlementHistory([]);
      showToast('Datos restablecidos correctamente', 'info');
    }
  };

  const handleAddCategory = (name: string, color: string) => {
    if (!name.trim() || categoryMap[name]) return;
    setCategoryMap(prev => ({ ...prev, [name.trim()]: ['General'] }));
    setCategoryColors(prev => ({ ...prev, [name.trim()]: color }));
    showToast(`Categoría "${name}" creada`, 'success');
  };

  const handleAddSubcategory = (catName: string, subcatName: string) => {
    if (!subcatName.trim() || !categoryMap[catName]) return;
    if (categoryMap[catName].includes(subcatName.trim())) return;
    setCategoryMap(prev => ({
      ...prev,
      [catName]: [...prev[catName], subcatName.trim()],
    }));
    showToast(`Subcategoría "${subcatName}" añadida a ${catName}`, 'success');
  };

  const handleDeleteCategory = (catName: string) => {
    setCategoryMap(prev => {
      const next = { ...prev };
      delete next[catName];
      return next;
    });
    showToast(`Categoría "${catName}" eliminada`, 'info');
  };

  const handleDeleteSubcategory = (catName: string, subcatName: string) => {
    setCategoryMap(prev => ({
      ...prev,
      [catName]: (prev[catName] || []).filter(s => s !== subcatName),
    }));
    showToast(`Subcategoría eliminada`, 'info');
  };

  const handleSettleDebt = (notes: string) => {
    if (debtInfo.debtAmount <= 0) return;

    const debtor = debtInfo.whoOwesWhom === 'user1_owes_user2' ? profile.user1Name : profile.user2Name;
    const creditor = debtInfo.whoOwesWhom === 'user1_owes_user2' ? profile.user2Name : profile.user1Name;

    const record: SettlementRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      totalSettled: debtInfo.totalCoupleSpent,
      payerName: debtor,
      receiverName: creditor,
      amount: debtInfo.debtAmount,
      notes,
    };

    setSettlementHistory(prev => [record, ...prev]);

    // Insert a compensating balancing transaction
    const balancingTx: Transaction = {
      id: Date.now().toString(),
      concepto: `Liquidación de cuentas (${debtor} → ${creditor})`,
      descripcion: notes || 'Saldado de balance en común',
      monto: debtInfo.debtAmount,
      moneda: profile.currency || 'ARS',
      categoria: 'Otros Gastos',
      subcategoria: 'Liquidación',
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'individual',
      pagadoPor: debtInfo.whoOwesWhom === 'user1_owes_user2' ? 'user1' : 'user2',
      metodoPago: 'Transferencia',
    };

    setTransactions(prev => [balancingTx, ...prev]);
    showToast('¡Cuentas saldadas y registradas con éxito!', 'success');
  };

  // Goals Handlers
  const handleAddGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: 'goal-' + Date.now(),
      createdAt: Date.now(),
    };
    setGoals(prev => [newGoal, ...prev]);
    showToast(`Caja de meta "${newGoal.nombre}" creada con éxito`, 'success');
  };

  const handleUpdateGoal = (id: string, updated: Partial<Goal>) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updated } : g)));
    showToast('Caja de meta actualizada', 'success');
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    showToast('Caja de meta eliminada', 'info');
  };

  const handleAddContribution = (goalId: string, contribution: Omit<GoalContribution, 'id'>) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const contribId = 'contrib-' + Date.now();
      const newContrib: GoalContribution = {
        ...contribution,
        id: contribId,
      };
      const delta = contribution.tipo === 'retiro' ? -contribution.monto : contribution.monto;
      const nextAmount = Math.max(0, g.montoActual + delta);
      const isCompleted = g.montoObjetivo > 0 && nextAmount >= g.montoObjetivo;

      if (contribution.tipo === 'aporte') {
        if (isCompleted && !g.completada) {
          showToast(`🎉 ¡Felicitaciones! ¡Alcanzaste la meta "${g.nombre}"!`, 'success');
        } else {
          showToast(`Aporte registrado en "${g.nombre}"`, 'success');
        }
      } else {
        showToast(`Retiro / pago registrado en "${g.nombre}"`, 'info');
      }

      return {
        ...g,
        montoActual: nextAmount,
        completada: isCompleted,
        historial: [...(g.historial || []), newContrib],
      };
    }));
  };

  const handleGenerateNewCode = () => {
    const newCode = 'PAREJA-' + Math.floor(1000 + Math.random() * 9000);
    setProfile(prev => ({ ...prev, accountCode: newCode }));
    showToast(`Nuevo código asignado: ${newCode}`, 'success');
  };

  const handleJoinAccount = (code: string) => {
    setProfile(prev => ({ ...prev, accountCode: code }));
    showToast(`Vinculado a la cuenta ${code}`, 'success');
    setIsCoupleModalOpen(false);
  };

  const handleImportData = (data: { transactions: Transaction[]; profile: CoupleProfile }) => {
    if (data.transactions) setTransactions(data.transactions);
    if (data.profile) setProfile(data.profile);
  };

  // Auth Handlers
  const handleLogin = (email: string): { success: boolean; error?: string } => {
    const savedAccountStr = localStorage.getItem('control_gastos_account_v1');
    if (savedAccountStr) {
      try {
        const savedAccount: UserAccount = JSON.parse(savedAccountStr);
        if (savedAccount.email.toLowerCase() === email.toLowerCase() || savedAccount.name.toLowerCase() === email.toLowerCase()) {
          setCurrentUserAccount(savedAccount);
          setProfile(prev => ({
            ...prev,
            user1Name: savedAccount.name,
            user2Name: savedAccount.partnerName || prev.user2Name,
            currency: savedAccount.currency || prev.currency,
            accountCode: savedAccount.accountCode || prev.accountCode,
          }));
        }
      } catch {}
    } else {
      const newAcc: UserAccount = {
        id: 'acc-' + Date.now(),
        email: email,
        name: email.includes('@') ? email.split('@')[0] : email,
        partnerName: 'Mi Pareja',
        accountType: 'pareja',
        accountCode: profile.accountCode,
        currency: profile.currency,
        createdAt: Date.now(),
      };
      setCurrentUserAccount(newAcc);
      localStorage.setItem('control_gastos_account_v1', JSON.stringify(newAcc));
    }

    setIsAdmin(false);
    localStorage.setItem('control_gastos_is_admin', 'false');
    setIsAuthenticated(true);
    localStorage.setItem('control_gastos_is_authenticated', 'true');
    showToast('¡Sesión iniciada con éxito! Bienvenido/a.', 'success');
    return { success: true };
  };

  const handleRegister = (data: {
    name: string;
    email: string;
    password?: string;
    accountType: 'pareja' | 'individual';
    partnerName?: string;
    currency: string;
    accountCode?: string;
  }): { success: boolean; error?: string } => {
    const newAcc: UserAccount = {
      id: 'acc-' + Date.now(),
      email: data.email,
      name: data.name,
      partnerName: data.partnerName,
      accountType: data.accountType,
      accountCode: data.accountCode || ('PAIR-' + Math.floor(1000 + Math.random() * 9000)),
      currency: data.currency || 'ARS',
      createdAt: Date.now(),
    };

    setCurrentUserAccount(newAcc);
    localStorage.setItem('control_gastos_account_v1', JSON.stringify(newAcc));

    // Clear demo transactions, goals and settlements for the new clean real subscriber account
    setTransactions([]);
    setGoals([]);
    setSettlementHistory([]);
    localStorage.setItem('control_gastos_tx_v3', JSON.stringify([]));
    localStorage.setItem('control_gastos_goals_v1', JSON.stringify([]));
    localStorage.setItem('control_gastos_settlements_v3', JSON.stringify([]));

    const cleanProfile: CoupleProfile = {
      accountCode: newAcc.accountCode,
      user1Name: data.name,
      user2Name: data.accountType === 'individual' ? 'Fondo Ahorro' : (data.partnerName || 'Mi Pareja'),
      currentUser: 'user1',
      currency: data.currency || 'ARS',
      defaultSplit: data.accountType === 'individual' ? '100_user1' : '50_50',
    };
    setProfile(cleanProfile);
    localStorage.setItem('control_gastos_profile_v3', JSON.stringify(cleanProfile));

    setIsAdmin(false);
    localStorage.setItem('control_gastos_is_admin', 'false');

    setIsAuthenticated(true);
    localStorage.setItem('control_gastos_is_authenticated', 'true');
    setActiveTab('dashboard');
    showToast('¡Cuenta creada con éxito! Tu panel está listo para tus primeros gastos.', 'success');
    return { success: true };
  };

  const handleGuestDemo = () => {
    // In Demo mode, populate with sample data for exploration
    setTransactions(DEFAULT_TRANSACTIONS);
    setGoals(DEFAULT_GOALS);
    setProfile(DEFAULT_COUPLE_PROFILE);
    localStorage.setItem('control_gastos_tx_v3', JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem('control_gastos_goals_v1', JSON.stringify(DEFAULT_GOALS));
    localStorage.setItem('control_gastos_profile_v3', JSON.stringify(DEFAULT_COUPLE_PROFILE));

    setIsAdmin(false);
    localStorage.setItem('control_gastos_is_admin', 'false');
    setIsAuthenticated(true);
    localStorage.setItem('control_gastos_is_authenticated', 'true');
    setActiveTab('dashboard');
    showToast('Modo Demostración activo con datos de prueba.', 'info');
  };

  const handleOpenAdminPanel = () => {
    setIsAdmin(true);
    localStorage.setItem('control_gastos_is_admin', 'true');
    setIsAuthenticated(true);
    localStorage.setItem('control_gastos_is_authenticated', 'true');
    setActiveTab('admin_subscriptions');
    showToast('Modo Administrador activado. Acceso a gestión de clientes y suscripciones.', 'info');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.setItem('control_gastos_is_authenticated', 'false');
    localStorage.setItem('control_gastos_is_admin', 'false');
    showToast('Has cerrado sesión correctamente.', 'info');
  };

  // Active User Subscription & Permissions
  const activeUserSub = subscriptions.find(s => s.userEmail.toLowerCase() === (currentUserAccount?.email || 'estechesol@gmail.com').toLowerCase());
  const currentPlanId: SubscriptionPlanId = activeUserSub?.planId || currentUserAccount?.selectedPlanId || (currentUserAccount?.accountType === 'individual' ? 'individual' : 'pareja');
  const canManageCategories = isAdmin || currentPlanId !== 'individual';

  // Render Auth Landing Page if not logged in
  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <AuthLandingPage
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGuestDemo={handleGuestDemo}
          onOpenAdminPanel={handleOpenAdminPanel}
        />
      </>
    );
  }

  return (
    <div className="text-slate-800 min-h-screen flex flex-col md:flex-row antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        isOpenMobile={isSidebarOpenMobile}
        isPinned={isSidebarPinned}
        onTogglePin={toggleSidebarPin}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeMode={activeMode}
        onModeChange={handleModeChange}
        profile={profile}
        onOpenTransactionModal={() => { setEditingTransaction(null); setInitialIsCuotas(false); setIsTxModalOpen(true); }}
        onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
        onOpenCoupleModal={() => setIsCoupleModalOpen(true)}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenSettlementModal={() => setIsSettlementModalOpen(true)}
        debtInfo={debtInfo}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-8">
        
        {/* Top Header */}
        <Header
          profile={profile}
          activeMode={activeMode}
          onModeChange={handleModeChange}
          onOpenTransactionModal={(initialType) => { 
            setEditingTransaction(null); 
            setInitialIsCuotas(false); 
            setTxModalInitialType(initialType || 'gasto'); 
            setIsTxModalOpen(true); 
          }}
          onOpenCoupleModal={() => setIsCoupleModalOpen(true)}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpenMobile(prev => !prev)}
          isSidebarPinned={isSidebarPinned}
        />

        {/* Dashboard Main Container */}
        <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1 w-full space-y-6">
          
          {/* TAB 1: DEDICATED INSTALLMENTS SECTION */}
          {activeTab === 'installments' && (
            <InstallmentsSection
              transactions={transactions}
              profile={profile}
              onOpenNewInstallmentModal={() => {
                setEditingTransaction(null);
                setInitialIsCuotas(true);
                setIsTxModalOpen(true);
              }}
              onOpenPriorInstallmentsModal={() => setIsPriorInstallmentsModalOpen(true)}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onUpdateInstallmentProgress={handleUpdateInstallmentProgress}
              onCompleteInstallment={handleCompleteInstallment}
            />
          )}

          {/* TAB 2: TRANSACTIONS LIST */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <DateFilterBar
                filters={filters}
                onFilterChange={(newF) => setFilters(prev => ({ ...prev, ...newF }))}
                transactions={transactions}
                filteredTransactions={filteredTransactions}
                currency={profile.currency || 'ARS'}
              />
              <TransactionsTable
                transactions={transactions}
                filteredTransactions={filteredTransactions}
                filters={filters}
                onFilterChange={(newF) => setFilters(prev => ({ ...prev, ...newF }))}
                onResetFilters={() => setFilters({
                  search: '',
                  mode: activeMode,
                  categoria: 'ALL',
                  subcategoria: 'ALL',
                  dateRange: 'all',
                  startDate: undefined,
                  endDate: undefined,
                  selectedMonth: undefined,
                  pagadoPor: 'ALL',
                  metodoPago: 'ALL',
                  soloCuotas: 'ALL',
                })}
                categoryMap={categoryMap}
                categoryColors={categoryColors}
                profile={profile}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onDuplicateTransaction={handleDuplicateTransaction}
                onExportCSV={() => exportTransactionsToCSV(filteredTransactions, profile.currency)}
                onResetData={handleResetData}
              />
            </div>
          )}

          {/* TAB 3: COUPLE BALANCE & SETTLEMENT */}
          {activeTab === 'couple_balance' && (
            <div className="space-y-6">
              <CoupleBalanceBanner
                transactions={transactions}
                profile={profile}
                debtInfo={debtInfo}
                onOpenSettlementModal={() => setIsSettlementModalOpen(true)}
                onOpenTransactionModal={() => { setEditingTransaction(null); setInitialIsCuotas(false); setIsTxModalOpen(true); }}
              />
              <DateFilterBar
                filters={filters}
                onFilterChange={(newF) => setFilters(prev => ({ ...prev, ...newF }))}
                transactions={transactions.filter(t => t.tipo === 'pareja')}
                filteredTransactions={filteredTransactions.filter(t => t.tipo === 'pareja')}
                currency={profile.currency || 'ARS'}
              />
              <ChartsSection
                transactions={filteredTransactions.filter(t => t.tipo === 'pareja')}
                categoryMap={categoryMap}
                categoryColors={categoryColors}
                currency={profile.currency || 'ARS'}
              />
              <TransactionsTable
                transactions={transactions}
                filteredTransactions={filteredTransactions.filter(t => t.tipo === 'pareja')}
                filters={{ ...filters, mode: 'pareja' }}
                onFilterChange={(newF) => setFilters(prev => ({ ...prev, ...newF }))}
                onResetFilters={() => setFilters({
                  search: '',
                  mode: 'pareja',
                  categoria: 'ALL',
                  subcategoria: 'ALL',
                  dateRange: 'all',
                  startDate: undefined,
                  endDate: undefined,
                  selectedMonth: undefined,
                  pagadoPor: 'ALL',
                  metodoPago: 'ALL',
                  soloCuotas: 'ALL',
                })}
                categoryMap={categoryMap}
                categoryColors={categoryColors}
                profile={profile}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onDuplicateTransaction={handleDuplicateTransaction}
                onExportCSV={() => exportTransactionsToCSV(filteredTransactions.filter(t => t.tipo === 'pareja'), profile.currency)}
                onResetData={handleResetData}
              />
            </div>
          )}

          {/* TAB 4: BUDGETS */}
          {activeTab === 'budgets' && (
            <div className="space-y-6">
              <BudgetSection
                budgets={budgets}
                categoryMap={categoryMap}
                categoryColors={categoryColors}
                transactions={transactions}
                currency={profile.currency || 'ARS'}
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              />
            </div>
          )}

          {/* TAB 5: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-extrabold text-[#2E0854]">
                        {canManageCategories ? 'Administrador de Categorías' : 'Catálogo de Categorías'}
                      </h2>
                      {!canManageCategories ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Plan Básico (Fijas)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#7928CA] border border-purple-200">
                          Personalización Ilimitada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {canManageCategories
                        ? 'Gestiona tus categorías, subrubros y colores contables'
                        : 'Categorías estándar incluidas en tu suscripción'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    {canManageCategories ? 'Administrar Categorías' : 'Ver Catálogo Completo'}
                  </button>
                </div>

                {!canManageCategories && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs leading-relaxed">
                      <strong>¿Querés crear tus propias categorías o nuevos subrubros?</strong><br />
                      La creación y personalización de categorías está disponible en los <strong>Planes Pareja Dúo y Pro</strong>.
                    </div>
                    <button
                      onClick={() => setActiveTab('subscriptions')}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F95420] to-[#FF6B3D] hover:from-[#E04412] hover:to-[#F95420] text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs"
                    >
                      Ver Planes & Actualizar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                  {(Object.entries(categoryMap) as [string, string[]][]).map(([cat, subs]) => (
                    <div key={cat} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/20 hover:border-purple-200 transition-all space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0 ring-2 ring-purple-100" style={{ backgroundColor: categoryColors[cat] || '#7928CA' }} />
                          <h4 className="font-extrabold text-sm text-[#2E0854] truncate">{cat}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-[#7928CA] bg-purple-50 px-1.5 py-0.5 rounded-md shrink-0">{(subs || []).length} subcat</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(subs || []).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-white text-slate-700 rounded-lg text-[11px] font-medium border border-purple-100 shadow-2xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GOALS & SAVINGS / DEBTS */}
          {activeTab === 'goals' && (
            <GoalsSection
              goals={goals}
              currency={profile.currency || 'ARS'}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddContribution={handleAddContribution}
            />
          )}

          {/* TAB 7: DEFAULT OVERALL DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-7">
              {/* Main Visual Dashboard Layout (Balance, 4 Stat Cards, Category Consumption Donut, Top 5) */}
              <DashboardOverview
                transactions={transactions}
                profile={profile}
                categoryColors={categoryColors}
                categoryMap={categoryMap}
                budgets={budgets}
                activeMode={activeMode}
                onModeChange={handleModeChange}
                onOpenTransactionModal={() => { 
                  setEditingTransaction(null); 
                  setInitialIsCuotas(false); 
                  setTxModalInitialType('gasto'); 
                  setIsTxModalOpen(true); 
                }}
                onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
              />
            </div>
          )}

          {/* TAB 8: SUBSCRIPTIONS & MERCADO PAGO TIERS */}
          {activeTab === 'subscriptions' && (
            <SubscriptionsView
              userAccount={currentUserAccount}
              profile={profile}
              currentSubscription={subscriptions.find(s => s.userEmail.toLowerCase() === (currentUserAccount?.email || 'estechesol@gmail.com').toLowerCase())}
              onSelectPlanPayment={handleSelectPlanPayment}
              onOpenAdminPanel={() => setActiveTab('admin_subscriptions')}
            />
          )}

          {/* TAB 9: ADMIN PANEL FOR CLIENT SUBSCRIPTIONS */}
          {activeTab === 'admin_subscriptions' && (
            <SubscriptionAdminPanel
              subscriptions={subscriptions}
              onUpdateSubscription={handleUpdateSubscription}
              onAddSubscription={handleAddSubscription}
              onDeleteSubscription={handleDeleteSubscription}
            />
          )}

        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'ai') setIsAiModalOpen(true);
          else if (tab === 'couple_balance') setActiveTab('couple_balance');
          else setActiveTab(tab);
        }}
        onOpenTransactionModal={() => { 
          setEditingTransaction(null); 
          setInitialIsCuotas(false); 
          setTxModalInitialType('gasto'); 
          setIsTxModalOpen(true); 
        }}
        hasDebt={debtInfo.debtAmount > 0}
      />

      {/* MODALS */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); setInitialIsCuotas(false); }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        categoryMap={categoryMap}
        profile={profile}
        initialIsCuotas={initialIsCuotas}
        initialTransactionType={txModalInitialType}
      />

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSave={handleSaveTransaction}
        profile={profile}
      />

      <PriorInstallmentsModal
        isOpen={isPriorInstallmentsModalOpen}
        onClose={() => setIsPriorInstallmentsModalOpen(false)}
        onSave={handleSaveTransaction}
        profile={profile}
        categoryMap={categoryMap}
      />

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        categoryMap={categoryMap}
        profile={profile}
        onAddTransaction={handleSaveTransaction}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryMap={categoryMap}
        categoryColors={categoryColors}
        canManageCategories={canManageCategories}
        onUpgradePlan={() => setActiveTab('subscriptions')}
        onAddCategory={handleAddCategory}
        onAddSubcategory={handleAddSubcategory}
        onDeleteCategory={handleDeleteCategory}
        onDeleteSubcategory={handleDeleteSubcategory}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgets={budgets}
        categoryMap={categoryMap}
        profile={profile}
        currency={profile?.currency || 'ARS'}
        onSaveBudgets={(newBudgets) => {
          setBudgets(newBudgets);
          showToast('Presupuestos actualizados con éxito', 'success');
        }}
      />

      <CoupleSettingsModal
        isOpen={isCoupleModalOpen}
        onClose={() => setIsCoupleModalOpen(false)}
        profile={profile}
        onSaveProfile={(newProfile) => {
          setProfile(newProfile);
          showToast('Configuración de pareja actualizada', 'success');
        }}
        onGenerateNewCode={handleGenerateNewCode}
        onJoinAccount={handleJoinAccount}
        onImportData={handleImportData}
        transactions={transactions}
      />

      <SettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        debtInfo={debtInfo}
        profile={profile}
        transactions={transactions}
        settlementHistory={settlementHistory}
        onSettleDebt={handleSettleDebt}
      />
    </div>
  );
}
