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
  AlertsSection 
} from './components/AlertsSection';
import { 
  CoupleBalanceSection 
} from './components/CoupleBalanceSection';
import { 
  CategoriesSection 
} from './components/CategoriesSection';
import { 
  SubscriptionsView 
} from './components/SubscriptionsView';
import { 
  SubscriptionAdminPanel 
} from './components/SubscriptionAdminPanel';
import { 
  UserProfileModal 
} from './components/UserProfileModal';
import { 
  LogoDownloadModal 
} from './components/LogoDownloadModal';
import { 
  ProCardAlertsModal 
} from './components/ProCardAlertsModal';
import { 
  FinancialDiagnosisModal 
} from './components/FinancialDiagnosisModal';
import { 
  TrialExpiredBlockedScreen 
} from './components/TrialExpiredBlockedScreen';
import { 
  FirebaseCloudSyncModal 
} from './components/FirebaseCloudSyncModal';
import { 
  getMesKeyFromDate,
  getMonthMovementsFromFirestore,
  getUserProfileFromFirestore,
  getBudgetsFromFirestore,
  saveMovementToFirestore,
  deleteMovementFromFirestore,
  syncBudgetsToFirestore,
  syncUserProfileToFirestore
} from './lib/firebase';
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

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('control_gastos_is_demo') === 'true';
  });

  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('control_gastos_account_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return null;
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('gastoar_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('gastoar_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
      try {
        const parsed: Transaction[] = JSON.parse(saved);
        return parsed.map(tx => {
          if (tx.subcategoria === 'Gimnasio, Club, Pádel & Deportes' && tx.categoria.toLowerCase().includes('entretenimiento')) {
            return { ...tx, categoria: 'Salud & Cuidado Personal' };
          }
          return tx;
        });
      } catch {}
    }
    return DEFAULT_TRANSACTIONS;
  });

  const [categoryMap, setCategoryMap] = useState<CategoryMap>(() => {
    const saved = localStorage.getItem('control_gastos_catmap_v5');
    if (saved) {
      try {
        const parsed: CategoryMap = JSON.parse(saved);
        if (!parsed['Suscripciones']) {
          parsed['Suscripciones'] = DEFAULT_CATEGORY_MAP['Suscripciones'];
        }

        // Add "Gimnasio, Club, Pádel & Deportes" to Salud & Cuidado Personal if missing
        const saludKey = Object.keys(parsed).find(k => k.toLowerCase().includes('salud')) || 'Salud & Cuidado Personal';
        if (!parsed[saludKey]) {
          parsed[saludKey] = DEFAULT_CATEGORY_MAP['Salud & Cuidado Personal'];
        } else if (!parsed[saludKey].includes('Gimnasio, Club, Pádel & Deportes')) {
          parsed[saludKey].push('Gimnasio, Club, Pádel & Deportes');
        }

        // Remove Gimnasio and Streaming Video y Música from Entretenimiento
        Object.keys(parsed).forEach(cat => {
          if (cat.toLowerCase().includes('entretenimiento')) {
            parsed[cat] = parsed[cat].filter(sub => {
              const s = sub.toLowerCase().trim();
              if (s.includes('gimnasio') || s.includes('pádel') || s.includes('padel') || (s.includes('club') && s.includes('deport'))) {
                return false;
              }
              if (s.includes('streaming') && (s.includes('video') || s.includes('musica') || s.includes('música'))) {
                return false;
              }
              if (s === 'streaming video y musica' || s === 'streaming video & musica') {
                return false;
              }
              return true;
            });
          }
        });

        return parsed;
      } catch {}
    }
    return DEFAULT_CATEGORY_MAP;
  });

  const [categoryColors, setCategoryColors] = useState<CategoryColors>(() => {
    const saved = localStorage.getItem('control_gastos_colors_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed['Suscripciones']) {
          parsed['Suscripciones'] = DEFAULT_CATEGORY_COLORS['Suscripciones'];
        }
        return parsed;
      } catch {}
    }
    return DEFAULT_CATEGORY_COLORS;
  });

  const [budgets, setBudgets] = useState<Budgets>(() => {
    const saved = localStorage.getItem('control_gastos_budgets_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.categories && !parsed.categories['Suscripciones']) {
          parsed.categories['Suscripciones'] = 60000;
        }
        return parsed;
      } catch {}
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
  const [activeMode, setActiveMode] = useState<ExpenseMode>(() => {
    const saved = localStorage.getItem('gastoar_active_mode');
    if (saved === 'individual' || saved === 'pareja') return saved;
    return 'individual';
  });
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isCardAlertsModalOpen, setIsCardAlertsModalOpen] = useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>(() => {
    const savedMode = localStorage.getItem('gastoar_active_mode');
    const initialMode: ExpenseMode = (savedMode === 'individual' || savedMode === 'pareja') ? savedMode : 'individual';
    return {
      search: '',
      mode: initialMode,
      categoria: 'ALL',
      subcategoria: 'ALL',
      dateRange: 'all',
      pagadoPor: 'ALL',
      metodoPago: 'ALL',
      soloCuotas: 'ALL',
    };
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

  useEffect(() => {
    localStorage.setItem('control_gastos_is_demo', String(isDemoMode));
  }, [isDemoMode]);

  // Active user ID for Firebase Firestore partitioning
  const activeUserId = useMemo(() => {
    if (currentUserAccount?.id) return currentUserAccount.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (currentUserAccount?.email) return currentUserAccount.email.replace(/[^a-zA-Z0-9_-]/g, '_');
    return 'usuario_principal';
  }, [currentUserAccount]);

  const handleMergeTransactions = (newTxs: Transaction[]) => {
    setTransactions(prev => {
      const map = new Map<string, Transaction>();
      prev.forEach(t => map.set(t.id, t));
      newTxs.forEach(t => map.set(t.id, t));
      return Array.from(map.values());
    });
  };

  // Cloud Sync State (for multi-device real-time consistency)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const isInitialCloudLoadDone = React.useRef<boolean>(false);

  // Load from Cloud on App start / session restore
  // OPTIMIZACIÓN DE LECTURAS: Solo se descarga el mes actual (ej: septiembre)
  useEffect(() => {
    if (!isAuthenticated || !currentUserAccount?.email || isDemoMode) return;

    const loadCloudData = async () => {
      try {
        setCloudSyncStatus('syncing');

        // 1. Firebase Firestore: Descarga optimizada únicamente del mes actual
        if (activeUserId) {
          try {
            const currentMonthKey = getMesKeyFromDate('');
            const firestoreMonthTxs = await getMonthMovementsFromFirestore(activeUserId, currentMonthKey);
            if (firestoreMonthTxs && firestoreMonthTxs.length > 0) {
              setTransactions(prev => {
                const map = new Map<string, Transaction>();
                prev.forEach(t => map.set(t.id, t));
                firestoreMonthTxs.forEach(t => map.set(t.id, t));
                return Array.from(map.values());
              });
            }

            const firestoreBudgets = await getBudgetsFromFirestore(activeUserId);
            if (firestoreBudgets) {
              setBudgets(firestoreBudgets);
            }
          } catch (fbErr) {
            console.warn('Firebase initial month load check:', fbErr);
          }
        }

        const emailParam = encodeURIComponent(currentUserAccount.email);
        const codeParam = encodeURIComponent(currentUserAccount.accountCode || profile.accountCode || '');
        const res = await fetch(`/api/sync/load?email=${emailParam}&accountCode=${codeParam}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const data = json.data;
            if (Array.isArray(data.transactions) && data.transactions.length > 0) {
              setTransactions(prev => {
                const map = new Map<string, Transaction>();
                (data.transactions as Transaction[]).forEach(t => map.set(t.id, t));
                prev.forEach(t => map.set(t.id, t));
                return Array.from(map.values());
              });
            }
            if (data.categoryMap && Object.keys(data.categoryMap).length > 0) {
              setCategoryMap(data.categoryMap);
            }
            if (data.categoryColors) {
              setCategoryColors(data.categoryColors);
            }
            if (data.budgets) {
              setBudgets(data.budgets);
            }
            if (data.profile) {
              setProfile(data.profile);
            }
            if (Array.isArray(data.settlementHistory)) {
              setSettlementHistory(data.settlementHistory);
            }
            if (Array.isArray(data.goals)) {
              setGoals(data.goals);
            }
            if (Array.isArray(data.subscriptions) && data.subscriptions.length > 0) {
              setSubscriptions(data.subscriptions);
            }
            if (json.account) {
              setCurrentUserAccount(json.account);
              localStorage.setItem('control_gastos_account_v1', JSON.stringify(json.account));
            }
            setCloudSyncStatus('synced');
          } else {
            setCloudSyncStatus('synced');
          }
        }
      } catch (err) {
        console.warn('Could not sync cloud data on load:', err);
        setCloudSyncStatus('offline');
      } finally {
        isInitialCloudLoadDone.current = true;
      }
    };

    loadCloudData();
  }, [isAuthenticated, currentUserAccount?.email]);

  // Debounced auto-sync to Cloud whenever state changes
  useEffect(() => {
    if (!isAuthenticated || !currentUserAccount?.email || isDemoMode) return;
    if (!isInitialCloudLoadDone.current) return;

    const timer = setTimeout(async () => {
      try {
        setCloudSyncStatus('syncing');
        const res = await fetch('/api/sync/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUserAccount.email,
            accountCode: profile.accountCode || currentUserAccount.accountCode,
            data: {
              transactions,
              categoryMap,
              categoryColors,
              budgets,
              profile,
              settlementHistory,
              goals,
              subscriptions,
            },
          }),
        });
        if (res.ok) {
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus('error');
        }
      } catch {
        setCloudSyncStatus('offline');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    transactions,
    categoryMap,
    categoryColors,
    budgets,
    profile,
    settlementHistory,
    goals,
    subscriptions,
    isAuthenticated,
    currentUserAccount?.email,
    currentUserAccount?.accountCode,
    profile.accountCode,
    isDemoMode,
  ]);

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

    const email = currentUserAccount?.email || 'ejemplo@ejemplo.com';
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
    try {
      localStorage.setItem('gastoar_active_mode', mode);
    } catch {}
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
    const totalBudget = (Object.values(budgets?.categories || {}) as (number | undefined)[]).reduce<number>((acc, b) => acc + (b || 0), 0);
    const totalSpent = (filteredTransactions || []).reduce<number>((acc, t) => acc + (t.monto || 0), 0);
    const percentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    return { totalBudget, totalSpent, percentage };
  }, [budgets, filteredTransactions]);

  // Handlers
  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    let savedTx: Transaction;

    if (txData.id) {
      // Edit existing transaction
      const existing = transactions.find(t => t.id === txData.id);
      savedTx = { ...existing, ...txData } as Transaction;
      setTransactions(prev => prev.map(t => (t.id === txData.id ? savedTx : t)));
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
        subcategoria: txData.subcategoria || (isIncome ? 'Sueldo' : 'General'),
        fecha: txData.fecha || new Date().toISOString().split('T')[0],
        tipo: txData.tipo || (activeMode === 'pareja' ? 'pareja' : 'individual'),
        pagadoPor: txData.pagadoPor || profile.currentUser,
        splitType: txData.splitType || (txData.tipo === 'pareja' ? profile.defaultSplit || '50_50' : undefined),
        user1Percent: txData.user1Percent,
        user2Percent: txData.user2Percent,
        user1Amount: txData.user1Amount,
        user2Amount: txData.user2Amount,
        metodoPago: txData.metodoPago || 'Débito',
        tarjetaNombre: txData.tarjetaNombre,
        esCuotas: txData.esCuotas || false,
        cuotasTotal: txData.cuotasTotal,
        cuotaActual: txData.cuotaActual,
        montoCuota: txData.montoCuota,
        tipoTransaccion: isIncome ? 'ingreso' : 'gasto',
      };
      savedTx = newTx;
      setTransactions(prev => [newTx, ...prev]);
      showToast(isIncome ? '¡Ingreso registrado con éxito!' : '¡Gasto registrado con éxito!', 'success');
    }

    // Persist to Firebase Firestore under users/{userId}/movimientos/{mesKey}/items/{txId}
    if (activeUserId && !isDemoMode) {
      saveMovementToFirestore(activeUserId, savedTx).catch(err => {
        console.warn('Could not sync movement to Firebase Firestore:', err);
      });
    }

    setIsTxModalOpen(false);
    setIsIncomeModalOpen(false);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setInitialIsCuotas(Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1)));
    setTxModalInitialType(tx.tipoTransaccion === 'ingreso' ? 'ingreso' : 'gasto');
    setIsTxModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    const toDelete = transactions.find(t => t.id === id);
    if (toDelete && activeUserId && !isDemoMode) {
      deleteMovementFromFirestore(activeUserId, id, toDelete.fecha).catch(err => {
        console.warn('Could not delete movement from Firebase Firestore:', err);
      });
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast('Movimiento eliminado', 'info');
  };

  const handleUpdateInstallmentProgress = (txId: string, delta: number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== txId) return t;
      const total = t.cuotasTotal || 1;
      const current = t.cuotaActual || 1;
      const next = Math.max(1, Math.min(total, current + delta));
      return { ...t, cuotaActual: next };
    }));
    showToast(delta > 0 ? 'Cuota pagada registrada (+1)' : 'Cuota actualizada (-1)', 'success');
  };

  const handleCompleteInstallment = (txId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== txId) return t;
      const total = t.cuotasTotal || 1;
      return { ...t, cuotaActual: total };
    }));
    showToast('Plan de cuotas liquidado por completo', 'success');
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

  const handleJoinAccount = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    setProfile(prev => ({ ...prev, accountCode: cleanCode }));
    if (currentUserAccount) {
      handleUpdateAccount({ accountCode: cleanCode });
    }

    // Try loading shared partner data from cloud immediately
    try {
      const res = await fetch(`/api/sync/load?accountCode=${encodeURIComponent(cleanCode)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (Array.isArray(json.data.transactions)) setTransactions(json.data.transactions);
          if (json.data.budgets) setBudgets(json.data.budgets);
          if (Array.isArray(json.data.goals)) setGoals(json.data.goals);
          if (json.data.profile) setProfile(json.data.profile);
        }
      }
    } catch {}

    showToast(`¡Vinculado a la cuenta compartida ${cleanCode}!`, 'success');
    setIsCoupleModalOpen(false);
  };

  const handleImportData = (data: { transactions: Transaction[]; profile: CoupleProfile }) => {
    if (data.transactions) setTransactions(data.transactions);
    if (data.profile) setProfile(data.profile);
  };

  // Profile Modal Updates
  const handleUpdateAccount = async (updates: Partial<UserAccount>) => {
    if (!currentUserAccount) return;
    const updated: UserAccount = { ...currentUserAccount, ...updates };
    setCurrentUserAccount(updated);
    localStorage.setItem('control_gastos_account_v1', JSON.stringify(updated));

    setProfile(prev => ({
      ...prev,
      user1Name: updated.name || prev.user1Name,
      user2Name: updated.partnerName || prev.user2Name,
      accountCode: updated.accountCode || prev.accountCode,
      currency: updated.currency || prev.currency,
    }));

    try {
      await fetch('/api/auth/update-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserAccount.email, updates }),
      });
    } catch (err) {
      console.warn('Could not sync account update to server:', err);
    }

    showToast('Datos de cuenta actualizados y guardados en la nube', 'success');
  };

  const handleApplyDiscountCode = (code: string) => {
    showToast(`¡Código "${code}" aplicado con 20% de descuento en suscripciones!`, 'success');
  };

  const handleLinkCoupleCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    setProfile(prev => ({ ...prev, accountCode: cleanCode }));
    if (currentUserAccount) {
      handleUpdateAccount({ accountCode: cleanCode });
    }
    showToast(`¡Cuenta vinculada con el código de pareja ${cleanCode}!`, 'success');
  };

  // Auth Handlers (Cloud-enabled for seamless Mobile <-> PC sync)
  const handleLogin = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setCloudSyncStatus('syncing');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setCloudSyncStatus('offline');
        return {
          success: false,
          error: json.error || 'No se encontró la cuenta o la contraseña es incorrecta.',
        };
      }

      const acc: UserAccount = json.account;
      setCurrentUserAccount(acc);
      localStorage.setItem('control_gastos_account_v1', JSON.stringify(acc));

      if (json.data) {
        const data = json.data;
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (data.categoryMap) setCategoryMap(data.categoryMap);
        if (data.categoryColors) setCategoryColors(data.categoryColors);
        if (data.budgets) setBudgets(data.budgets);
        if (data.profile) setProfile(data.profile);
        if (Array.isArray(data.settlementHistory)) setSettlementHistory(data.settlementHistory);
        if (Array.isArray(data.goals)) setGoals(data.goals);
        if (Array.isArray(data.subscriptions) && data.subscriptions.length > 0) setSubscriptions(data.subscriptions);
      } else {
        setProfile(prev => ({
          ...prev,
          user1Name: acc.name,
          user2Name: acc.partnerName || prev.user2Name,
          currency: acc.currency || prev.currency,
          accountCode: acc.accountCode || prev.accountCode,
        }));
      }

      setIsAdmin(false);
      setIsDemoMode(false);
      localStorage.setItem('control_gastos_is_admin', 'false');
      localStorage.setItem('control_gastos_is_demo', 'false');
      setIsAuthenticated(true);
      localStorage.setItem('control_gastos_is_authenticated', 'true');
      setCloudSyncStatus('synced');
      isInitialCloudLoadDone.current = true;
      showToast('¡Sesión iniciada con éxito! Información sincronizada desde la nube ☁️', 'success');
      return { success: true };
    } catch (err: any) {
      console.error('Error logging in:', err);
      // Fallback local login if server offline
      const savedAccountStr = localStorage.getItem('control_gastos_account_v1');
      if (savedAccountStr) {
        try {
          const savedAccount: UserAccount = JSON.parse(savedAccountStr);
          if (savedAccount.email.toLowerCase() === email.toLowerCase() || savedAccount.name.toLowerCase() === email.toLowerCase()) {
            setCurrentUserAccount(savedAccount);
            setIsAuthenticated(true);
            localStorage.setItem('control_gastos_is_authenticated', 'true');
            showToast('¡Sesión iniciada en modo local!', 'success');
            return { success: true };
          }
        } catch {}
      }
      return { success: false, error: 'No se pudo conectar al servidor. Verificá tu conexión a internet.' };
    }
  };

  const handleRegister = async (data: {
    name: string;
    email: string;
    password?: string;
    accountType: 'pareja' | 'individual';
    partnerName?: string;
    currency: string;
    accountCode?: string;
    selectedPlanId?: SubscriptionPlanId;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setCloudSyncStatus('syncing');

      const today = new Date();
      const trialEnd = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
      const chosenPlan = SUBSCRIPTION_PLANS.find(p => p.id === (data.selectedPlanId || (data.accountType === 'individual' ? 'individual' : 'pareja'))) || SUBSCRIPTION_PLANS[1];

      const initialSub: UserSubscription = {
        id: 'sub-' + Date.now(),
        userId: 'usr-' + Date.now(),
        userEmail: data.email.trim().toLowerCase(),
        userName: data.name.trim(),
        partnerName: data.partnerName ? data.partnerName.trim() : undefined,
        accountCode: data.accountCode || ('PAIR-' + Math.floor(1000 + Math.random() * 9000)),
        planId: chosenPlan.id,
        planName: chosenPlan.name,
        status: 'trial',
        billingCycle: 'monthly',
        pricePaid: 0,
        currency: data.currency || 'ARS',
        paymentMethod: 'Mercado Pago',
        startDate: today.toISOString().split('T')[0],
        trialEndsDate: trialEnd.toISOString().split('T')[0],
        trialDaysGranted: 15,
        autoRenew: true,
        createdAt: Date.now(),
        notes: 'Período de prueba de 15 días concedido al registrarse.',
      };

      const cleanProfile: CoupleProfile = {
        accountCode: initialSub.accountCode,
        user1Name: data.name.trim(),
        user2Name: data.accountType === 'individual' ? 'Fondo Ahorro' : (data.partnerName ? data.partnerName.trim() : 'Mi Pareja'),
        currentUser: 'user1',
        currency: data.currency || 'ARS',
        defaultSplit: data.accountType === 'individual' ? '100_user1' : '50_50',
      };

      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        accountType: data.accountType,
        partnerName: data.partnerName,
        currency: data.currency || 'ARS',
        accountCode: initialSub.accountCode,
        selectedPlanId: chosenPlan.id,
        initialData: {
          transactions: [],
          categoryMap: DEFAULT_CATEGORY_MAP,
          categoryColors: DEFAULT_CATEGORY_COLORS,
          budgets: { categories: {}, subcategories: {} },
          profile: cleanProfile,
          settlementHistory: [],
          goals: [],
          subscriptions: [initialSub],
        },
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setCloudSyncStatus('offline');
        return {
          success: false,
          error: json.error || 'Ya existe una cuenta con este correo. Por favor seleccioná "Iniciar Sesión".',
        };
      }

      const newAcc: UserAccount = json.account;
      setCurrentUserAccount(newAcc);
      localStorage.setItem('control_gastos_account_v1', JSON.stringify(newAcc));

      // Reset application state to clean initial registration state
      setTransactions([]);
      setGoals([]);
      setSettlementHistory([]);
      setBudgets({ categories: {}, subcategories: {} });
      setCategoryMap(DEFAULT_CATEGORY_MAP);
      setCategoryColors(DEFAULT_CATEGORY_COLORS);
      setProfile(cleanProfile);
      setSubscriptions([initialSub]);

      setIsAdmin(false);
      setIsDemoMode(false);
      localStorage.setItem('control_gastos_is_admin', 'false');
      localStorage.setItem('control_gastos_is_demo', 'false');

      setIsAuthenticated(true);
      localStorage.setItem('control_gastos_is_authenticated', 'true');
      setCloudSyncStatus('synced');
      isInitialCloudLoadDone.current = true;
      setActiveTab('dashboard');
      showToast('¡Cuenta creada y sincronizada en la nube con 15 días de prueba gratis! ☁️', 'success');
      return { success: true };
    } catch (err: any) {
      console.error('Error registering:', err);
      return { success: false, error: 'Error al conectar con el servidor para registrar la cuenta.' };
    }
  };

  const handleGuestDemo = () => {
    // In Demo mode, populate with sample data for exploration
    setTransactions(DEFAULT_TRANSACTIONS);
    setGoals(DEFAULT_GOALS);
    setProfile(DEFAULT_COUPLE_PROFILE);
    setBudgets(DEFAULT_BUDGETS);
    localStorage.setItem('control_gastos_tx_v5', JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem('control_gastos_goals_v1', JSON.stringify(DEFAULT_GOALS));
    localStorage.setItem('control_gastos_profile_v3', JSON.stringify(DEFAULT_COUPLE_PROFILE));
    localStorage.setItem('control_gastos_budgets_v5', JSON.stringify(DEFAULT_BUDGETS));

    setIsAdmin(false);
    setIsDemoMode(true);
    localStorage.setItem('control_gastos_is_admin', 'false');
    localStorage.setItem('control_gastos_is_demo', 'true');
    setIsAuthenticated(true);
    localStorage.setItem('control_gastos_is_authenticated', 'true');
    setActiveTab('dashboard');
    showToast('Modo Demostración activo con datos de prueba.', 'info');
  };

  const handleExitDemo = () => {
    setIsDemoMode(false);
    setIsAuthenticated(false);
    localStorage.setItem('control_gastos_is_demo', 'false');
    localStorage.setItem('control_gastos_is_authenticated', 'false');
    showToast('Has salido del modo demostración. ¡Registrate para crear tu cuenta real!', 'info');
  };

  const handleOpenAdminPanel = () => {
    setIsAdmin(true);
    setIsDemoMode(false);
    localStorage.setItem('control_gastos_is_admin', 'true');
    localStorage.setItem('control_gastos_is_demo', 'false');
    setIsAuthenticated(true);
    localStorage.setItem('control_gastos_is_authenticated', 'true');
    setActiveTab('admin_subscriptions');
    showToast('Modo Administrador activado. Gestión de suscripciones y clientes.', 'info');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsDemoMode(false);
    setCurrentUserAccount(null);
    localStorage.removeItem('control_gastos_is_authenticated');
    localStorage.removeItem('control_gastos_is_admin');
    localStorage.removeItem('control_gastos_is_demo');
    localStorage.removeItem('control_gastos_account_v1');
    showToast('Has cerrado sesión correctamente. ¡Hasta pronto! 👋', 'info');
  };

  // Active User Subscription & Permissions
  const activeUserSub = subscriptions.find(s => s.userEmail.toLowerCase() === (currentUserAccount?.email || 'ejemplo@ejemplo.com').toLowerCase());
  const currentPlanId: SubscriptionPlanId = activeUserSub?.planId || currentUserAccount?.selectedPlanId || (currentUserAccount?.accountType === 'individual' ? 'individual' : 'pareja');
  const canManageCategories = isAdmin || currentPlanId !== 'individual';

  // Check if Trial is Expired
  const isTrialExpired = useMemo(() => {
    if (isAdmin || isDemoMode || !activeUserSub) return false;
    if (activeUserSub.status === 'active') return false;
    if (activeUserSub.status === 'expired') return true;
    if (activeUserSub.status === 'trial') {
      if (!activeUserSub.trialEndsDate) return false;
      const todayStr = new Date().toISOString().split('T')[0];
      return todayStr > activeUserSub.trialEndsDate;
    }
    return false;
  }, [isAdmin, isDemoMode, activeUserSub]);

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

  // Render Trial Expired Block Screen if trial has ended
  if (isTrialExpired) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <TrialExpiredBlockedScreen
          userAccount={currentUserAccount}
          subscription={activeUserSub}
          onSelectPlanPayment={handleSelectPlanPayment}
          onLogout={handleLogout}
          onOpenAdminPanel={handleOpenAdminPanel}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row antialiased selection:bg-purple-100 selection:text-purple-900 transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0314] text-purple-50' : 'bg-slate-50 text-slate-800'}`}>
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
        onOpenTransactionModal={() => { setEditingTransaction(null); setInitialIsCuotas(false); setTxModalInitialType('gasto'); setIsTxModalOpen(true); }}
        onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenCardAlerts={() => setIsCardAlertsModalOpen(true)}
        onOpenSettlementModal={() => setIsSettlementModalOpen(true)}
        onOpenLogoDownload={() => setIsLogoModalOpen(true)}
        debtInfo={debtInfo}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        isDemoMode={isDemoMode}
        onExitDemo={handleExitDemo}
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
          onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onNavigateHome={() => setActiveTab('dashboard')}
          onToggleSidebar={() => setIsSidebarOpenMobile(prev => !prev)}
          isSidebarPinned={isSidebarPinned}
          isDemoMode={isDemoMode}
          onExitDemo={handleExitDemo}
          cloudSyncStatus={cloudSyncStatus}
          onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
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
              onOpenCardAlerts={() => setIsCardAlertsModalOpen(true)}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onUpdateInstallmentProgress={handleUpdateInstallmentProgress}
              onCompleteInstallment={handleCompleteInstallment}
            />
          )}

          {/* TAB 1.5: VENCIMIENTOS */}
          {activeTab === 'card_alerts' && (
            <AlertsSection
              profile={profile}
              transactions={transactions}
              onShowToast={showToast}
              onOpenTransactionModal={() => {
                setEditingTransaction(null);
                setInitialIsCuotas(false);
                setTxModalInitialType('gasto');
                setIsTxModalOpen(true);
              }}
              onOpenCalendarModal={() => setIsCardAlertsModalOpen(true)}
            />
          )}

          {/* TAB 2: COUPLE BALANCE & SETTLEMENTS */}
          {activeTab === 'couple_balance' && (
            <CoupleBalanceSection
              transactions={transactions}
              profile={profile}
              debtInfo={debtInfo}
              categoryMap={categoryMap}
              categoryColors={categoryColors}
              onOpenSettlementModal={() => setIsSettlementModalOpen(true)}
              onOpenTransactionModal={() => {
                setEditingTransaction(null);
                setInitialIsCuotas(false);
                setTxModalInitialType('gasto');
                setActiveMode('pareja');
                setIsTxModalOpen(true);
              }}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {/* TAB 3: BUDGETS & LIMITS */}
          {activeTab === 'budgets' && (
            <div className="space-y-6">
              <BudgetSection
                budgets={budgets}
                categoryMap={categoryMap}
                categoryColors={categoryColors}
                transactions={transactions}
                currency={profile.currency}
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
                onUpdateBudgets={(newBudgets) => {
                  setBudgets(newBudgets);
                  showToast('Límites de presupuesto actualizados con éxito', 'success');
                }}
                onSelectCategory={(category) => {
                  setFilters(prev => ({
                    ...prev,
                    categoria: category || 'ALL',
                    subcategoria: 'ALL',
                  }));
                  setActiveTab('transactions');
                }}
              />
            </div>
          )}

          {/* TAB 4: CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <CategoriesSection
              categoryMap={categoryMap}
              categoryColors={categoryColors}
              canManageCategories={true}
              onAddCategory={handleAddCategory}
              onAddSubcategory={handleAddSubcategory}
              onDeleteCategory={handleDeleteCategory}
              onDeleteSubcategory={handleDeleteSubcategory}
              onShowToast={showToast}
            />
          )}

          {/* TAB 5: GOALS & SAVINGS */}
          {activeTab === 'goals' && (
            <GoalsSection
              goals={goals}
              profile={profile}
              currency={profile.currency}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddContribution={handleAddContribution}
            />
          )}

          {/* TAB 6: TRANSACTIONS LIST & FILTERS */}
          {activeTab === 'transactions' && (
            <TransactionsTable
              transactions={transactions}
              filteredTransactions={filteredTransactions}
              filters={filters}
              onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
              onResetFilters={() => setFilters({
                search: '',
                mode: 'all',
                categoria: 'ALL',
                subcategoria: 'ALL',
                dateRange: 'all',
                pagadoPor: 'ALL',
                metodoPago: 'ALL',
                soloCuotas: 'ALL',
                startDate: undefined,
                endDate: undefined,
                selectedMonth: undefined,
              })}
              categoryMap={categoryMap}
              categoryColors={categoryColors}
              profile={profile}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onExportCSV={() => exportTransactionsToCSV(filteredTransactions, profile.currency)}
              onResetData={handleGuestDemo}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
            />
          )}

          {/* TAB 7: MAIN DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-7">
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
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSelectCategory={(category) => {
                  setFilters(prev => ({
                    ...prev,
                    categoria: category || 'ALL',
                    subcategoria: 'ALL',
                  }));
                  setActiveTab('transactions');
                }}
              />
            </div>
          )}

          {/* TAB 7.5: REPORTES & ANALYTICS CHARTS */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <ChartsSection
                transactions={filteredTransactions}
                categoryMap={categoryMap}
                categoryColors={categoryColors}
                currency={profile.currency}
                onOpenTransactionModal={() => {
                  setEditingTransaction(null);
                  setInitialIsCuotas(false);
                  setTxModalInitialType('gasto');
                  setIsTxModalOpen(true);
                }}
              />
            </div>
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
        onToggleSidebar={() => setIsSidebarOpenMobile(prev => !prev)}
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
        transactions={transactions}
        budgets={budgets}
        onAddTransaction={handleSaveTransaction}
        onShowToast={showToast}
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
        transactions={filteredTransactions}
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

      {/* User Profile & Account Settings Modal (Req 12) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        userAccount={currentUserAccount}
        activeSubscription={activeUserSub}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
        onUpdateProfile={(newProf) => {
          setProfile(prev => ({ ...prev, ...newProf }));
          showToast('Perfil actualizado con éxito', 'success');
        }}
        onUpdateAccount={handleUpdateAccount}
        onApplyDiscountCode={handleApplyDiscountCode}
        onLinkCoupleCode={handleLinkCoupleCode}
        onOpenSubscriptionsTab={() => {
          setIsProfileModalOpen(false);
          setActiveTab('subscriptions');
        }}
        onLogout={handleLogout}
        onSelectPlanPayment={handleSelectPlanPayment}
        onShowToast={showToast}
        onOpenCloudSync={() => {
          setIsProfileModalOpen(false);
          setIsCloudSyncModalOpen(true);
        }}
      />

      {/* Firebase Cloud Sync & Selective Historic Partition Loader Modal */}
      <FirebaseCloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        userId={activeUserId}
        userAccount={currentUserAccount}
        profile={profile}
        budgets={budgets}
        transactions={transactions}
        onMergeTransactions={handleMergeTransactions}
        onShowToast={showToast}
      />

      {/* Logo Download Modal (Req 6) */}
      <LogoDownloadModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
      />

      {/* Pro Card Alerts & Google Calendar Modal */}
      <ProCardAlertsModal
        isOpen={isCardAlertsModalOpen}
        onClose={() => setIsCardAlertsModalOpen(false)}
        transactions={transactions}
        profile={profile}
        onUpgradePlan={() => { setIsCardAlertsModalOpen(false); setActiveTab('subscriptions'); }}
        onShowToast={showToast}
        isProOrTrial={activeUserSub ? (activeUserSub.status === 'active' || activeUserSub.status === 'trial') : true}
      />

      {/* Financial Health Diagnosis Modal */}
      <FinancialDiagnosisModal
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        transactions={transactions}
        profile={profile}
        budgets={budgets}
        onUpgradePlan={() => { setIsDiagnosisModalOpen(false); setActiveTab('subscriptions'); }}
      />
    </div>
  );
}
