import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { ProtectedRoute } from './components/ProtectedRoute';
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
  BudgetCreateModal 
} from './components/BudgetCreateModal';
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
  CashFlowSection 
} from './components/CashFlowSection';
import { 
  MultiCurrencyWidget 
} from './components/MultiCurrencyWidget';
import { 
  ScheduledPayment 
} from './CashFlowEngine';
import { useVencimientoNotifications } from './hooks/useVencimientoNotifications';
import { 
  SplashScreen 
} from './components/mobileScreens/SplashScreen';
import { 
  OnboardingScreen 
} from './components/mobileScreens/OnboardingScreen';
import { 
  ProfileScreen 
} from './components/mobileScreens/ProfileScreen';
import { 
  SettingsScreen 
} from './components/mobileScreens/SettingsScreen';
import { 
  MobileSubscriptionScreen 
} from './components/mobileScreens/MobileSubscriptionScreen';
import { 
  FirebaseCloudSyncModal 
} from './components/FirebaseCloudSyncModal';
import { 
  auth,
  onAuthStateChanged,
  logOutFirebase,
  getMesKeyFromDate,
  getMonthMovementsFromFirestore,
  getUserProfileFromFirestore,
  getBudgetsFromFirestore,
  saveMovementToFirestore,
  deleteMovementFromFirestore,
  syncBudgetsToFirestore,
  syncUserProfileToFirestore,
  signInWithGoogle,
  registerWithEmailFirebase,
  loginWithEmailFirebase,
  getAppStateFromFirestore,
  syncAppStateToFirestore,
  listenToAppState,
  listenToMonthMovements
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
  UserSubscription,
  Vencimiento
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
import { recordLearnedPreference } from './utils/learnedPreferences';


/**
 * Local data ownership
 * --------------------
 * Demo data is intentionally global because it is disposable.
 * Real user data is scoped to the authenticated account so a new account
 * can never inherit the previous user's local state.
 */
const getStoredAccount = (): UserAccount | null => {
  try {
    const raw = localStorage.getItem('control_gastos_account_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as UserAccount : null;
  } catch {
    return null;
  }
};

const getStoredOwnerId = (): string | null => {
  if (localStorage.getItem('control_gastos_is_demo') === 'true') return 'demo';

  const account = getStoredAccount();
  if (account?.id) return account.id;
  if (account?.email) return account.email.toLowerCase();

  return null;
};

const scopedStorageKey = (baseKey: string, ownerId: string | null): string => {
  if (!ownerId || ownerId === 'demo') return baseKey;
  return `${baseKey}__user_${ownerId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
};

const readScopedStorage = <T,>(
  baseKey: string,
  ownerId: string | null,
  fallback: T,
): T => {
  try {
    if (!ownerId) return fallback;

    const scopedKey = scopedStorageKey(baseKey, ownerId);
    const scoped = localStorage.getItem(scopedKey);

    if (scoped !== null) {
      return JSON.parse(scoped) as T;
    }

    // Never fall back to an unscoped key for a real account.
    // Unscoped storage may belong to the Demo mode or to a previous account.
    return fallback;
  } catch {
    return fallback;
  }
};

const writeScopedStorage = (
  baseKey: string,
  ownerId: string | null,
  value: unknown,
): void => {
  try {
    localStorage.setItem(
      scopedStorageKey(baseKey, ownerId),
      JSON.stringify(value),
    );
  } catch {
    // Ignore storage quota/private-mode errors.
  }
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('control_gastos_is_authenticated') === 'true';
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() => {
    return !localStorage.getItem('control_gastos_is_authenticated');
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
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.accountCode && (parsed.accountCode.startsWith('PAREJA-') || parsed.accountCode.startsWith('PAIR-'))) {
          parsed.accountCode = parsed.accountCode.replace(/^(PAREJA|PAIR)-/, 'COMPARTIDA-');
        }
        return parsed;
      } catch {}
    }
    return null;
  });

  // Global Session Persistence via Firebase onAuthStateChanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        localStorage.setItem('control_gastos_is_authenticated', 'true');

        try {
          const profileFromDb = await getUserProfileFromFirestore(user.uid);
          if (profileFromDb) {
            if (profileFromDb.accountCode && (profileFromDb.accountCode.startsWith('PAREJA-') || profileFromDb.accountCode.startsWith('PAIR-'))) {
              profileFromDb.accountCode = profileFromDb.accountCode.replace(/^(PAREJA|PAIR)-/, 'COMPARTIDA-');
            }
            setCurrentUserAccount(profileFromDb);
            localStorage.setItem('control_gastos_account_v1', JSON.stringify(profileFromDb));
          } else {
            // IMPORTANT: never inherit account fields from the previous local
            // session here. This callback can run while a brand-new Firebase
            // account is still being registered.
            const email = user.email || 'usuario@gastoar.com';
            const name = user.displayName || email.split('@')[0];
            const updated: UserAccount = {
              id: user.uid,
              email,
              name,
              accountType: 'individual',
              selectedPlanId: 'individual',
              accountCode: 'COMPARTIDA-' + Math.floor(1000 + Math.random() * 9000),
              currency: 'ARS',
              createdAt: Date.now(),
            };
            setCurrentUserAccount(updated);
            localStorage.setItem('control_gastos_account_v1', JSON.stringify(updated));
          }
        } catch (e) {
          console.warn('Error synchronizing Firebase user profile:', e);
        }
      } else {
        const isDemo = localStorage.getItem('control_gastos_is_demo') === 'true';
        const isAdminStorage = localStorage.getItem('control_gastos_is_admin') === 'true';
        if (!isDemo && !isAdminStorage) {
          setIsAuthenticated(false);
          setCurrentUserAccount(null);
          // Do not leave the previous account cached in localStorage.
          // Otherwise the next Firebase session can be initialized with the
          // previous user's identity before the new profile is available.
          localStorage.removeItem('control_gastos_is_authenticated');
          localStorage.removeItem('control_gastos_account_v1');
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Dark Mode State - Light mode is the default and canonical design of GastoAR
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // If mobile or client had legacy dark mode flag set, reset so mobile displays identical to web
    const saved = localStorage.getItem('gastoar_dark_mode_v2');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('gastoar_dark_mode_v2', String(isDarkMode));
    localStorage.removeItem('gastoar_dark_mode');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // User Subscriptions State (Admin and active client subscription)
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>(() => {
    const isDemo = localStorage.getItem('control_gastos_is_demo') === 'true';
    const ownerId = getStoredOwnerId();
    return readScopedStorage<UserSubscription[]>(
      'control_gastos_subscriptions_v1',
      ownerId,
      isDemo ? INITIAL_USER_SUBSCRIPTIONS : [],
    );
  });

  // Application State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const isDemo = localStorage.getItem('control_gastos_is_demo') === 'true';
    const ownerId = getStoredOwnerId();
    const saved = readScopedStorage<Transaction[]>(
      'control_gastos_tx_v5',
      ownerId,
      isDemo ? DEFAULT_TRANSACTIONS : [],
    );
    if (saved.length > 0) {
      try {

        const parsed: Transaction[] = saved;
        return parsed.map(tx => {
          if (tx.categoria === 'Salud & Cuidado Personal') {
            const sub = ((tx.subcategoria || '') + ' ' + (tx.descripcion || '') + ' ' + (tx.concepto || '')).toLowerCase();
            if (
              sub.includes('peluquer') ||
              sub.includes('barber') ||
              sub.includes('estétic') ||
              sub.includes('estetic') ||
              sub.includes('gimnasio') ||
              sub.includes('club') ||
              sub.includes('pádel') ||
              sub.includes('padel') ||
              sub.includes('deport') ||
              sub.includes('cosmétic') ||
              sub.includes('facial') ||
              sub.includes('spa') ||
              sub.includes('uñas')
            ) {
              return { ...tx, categoria: 'Cuidado Personal' };
            }
            return { ...tx, categoria: 'Salud' };
          }
          if (tx.subcategoria === 'Gimnasio, Club, Pádel & Deportes' && tx.categoria.toLowerCase().includes('entretenimiento')) {
            return { ...tx, categoria: 'Cuidado Personal' };
          }
          if (
            tx.categoria === 'Entretenimiento, Ocio & Suscripciones' ||
            tx.categoria === 'Entretenimiento & Ocio' ||
            tx.categoria === 'Entretenimiento, Ocio & Salidas'
          ) {
            return { ...tx, categoria: 'Entretenimiento' };
          }
          if (
            tx.categoria === 'Suscripciones y Plataformas' ||
            tx.categoria === 'Suscripciones'
          ) {
            return { ...tx, categoria: 'Suscripciones & Plataformas' };
          }
          if (tx.categoria === 'Tecnología, Electro & Bazar') {
            return { ...tx, categoria: 'Tecnología, Electrónica & Bazar' };
          }
          return tx;
        });
      } catch {}
    }
    return saved;
  });

  const [categoryMap, setCategoryMap] = useState<CategoryMap>(() => {

    const ownerId = getStoredOwnerId();
    const saved = readScopedStorage<CategoryMap>(
      'control_gastos_catmap_v6',
      ownerId,
      DEFAULT_CATEGORY_MAP,
    );
    try {
        const parsed: CategoryMap = saved;
        // Ensure "Salud" and "Cuidado Personal" are independent
        if (!parsed['Salud']) {
          parsed['Salud'] = DEFAULT_CATEGORY_MAP['Salud'];
        }
        if (!parsed['Cuidado Personal']) {
          parsed['Cuidado Personal'] = DEFAULT_CATEGORY_MAP['Cuidado Personal'];
        }
        if (parsed['Salud & Cuidado Personal']) {
          delete parsed['Salud & Cuidado Personal'];
        }

        // Ensure "Entretenimiento" is the standard category name
        if (!parsed['Entretenimiento']) {
          parsed['Entretenimiento'] = parsed['Entretenimiento, Ocio & Suscripciones'] || parsed['Entretenimiento & Ocio'] || parsed['Entretenimiento, Ocio & Salidas'] || DEFAULT_CATEGORY_MAP['Entretenimiento'];
        }
        delete parsed['Entretenimiento, Ocio & Suscripciones'];
        delete parsed['Entretenimiento & Ocio'];
        delete parsed['Entretenimiento, Ocio & Salidas'];

        // Ensure ONLY "Suscripciones & Plataformas" is established (Deduplicate)
        if (!parsed['Suscripciones & Plataformas']) {
          parsed['Suscripciones & Plataformas'] = parsed['Suscripciones y Plataformas'] || parsed['Suscripciones'] || DEFAULT_CATEGORY_MAP['Suscripciones & Plataformas'];
        }
        delete parsed['Suscripciones y Plataformas'];
        delete parsed['Suscripciones'];

        // Ensure "Tecnología, Electrónica & Bazar" is established
        if (!parsed['Tecnología, Electrónica & Bazar']) {
          parsed['Tecnología, Electrónica & Bazar'] = parsed['Tecnología, Electro & Bazar'] || DEFAULT_CATEGORY_MAP['Tecnología, Electrónica & Bazar'];
        }
        delete parsed['Tecnología, Electro & Bazar'];

        // Remove Gimnasio and Streaming from Entretenimiento
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
              return true;
            });
          }
        });

        return parsed;
    } catch {}
    return saved;
  });

  const [categoryColors, setCategoryColors] = useState<CategoryColors>(() => {

    const ownerId = getStoredOwnerId();
    const saved = readScopedStorage<CategoryColors>(
      'control_gastos_colors_v6',
      ownerId,
      DEFAULT_CATEGORY_COLORS,
    );
    return {
      ...saved,
      ...DEFAULT_CATEGORY_COLORS,
    };
  });

  const [budgets, setBudgets] = useState<Budgets>(() => {
    const isDemo = localStorage.getItem('control_gastos_is_demo') === 'true';

    const ownerId = getStoredOwnerId();
    const saved = readScopedStorage<Budgets>(
      'control_gastos_budgets_v5',
      ownerId,
      isDemo ? DEFAULT_BUDGETS : { categories: {}, subcategories: {} },
    );
    try {
        const parsed = saved;
        if (parsed.categories) {
          // Deduplicate Suscripciones
          if (parsed.categories['Suscripciones y Plataformas'] || parsed.categories['Suscripciones']) {
            if (!parsed.categories['Suscripciones & Plataformas']) {
              parsed.categories['Suscripciones & Plataformas'] = parsed.categories['Suscripciones y Plataformas'] || parsed.categories['Suscripciones'] || 60000;
            }
            delete parsed.categories['Suscripciones y Plataformas'];
            delete parsed.categories['Suscripciones'];
          }
          // Enforce Entretenimiento
          if (parsed.categories['Entretenimiento, Ocio & Suscripciones'] || parsed.categories['Entretenimiento & Ocio'] || parsed.categories['Entretenimiento, Ocio & Salidas']) {
            if (!parsed.categories['Entretenimiento']) {
              parsed.categories['Entretenimiento'] = parsed.categories['Entretenimiento, Ocio & Suscripciones'] || parsed.categories['Entretenimiento & Ocio'] || parsed.categories['Entretenimiento, Ocio & Salidas'] || 55000;
            }
            delete parsed.categories['Entretenimiento, Ocio & Suscripciones'];
            delete parsed.categories['Entretenimiento & Ocio'];
            delete parsed.categories['Entretenimiento, Ocio & Salidas'];
          }
          // Enforce Tecnología
          if (parsed.categories['Tecnología, Electro & Bazar']) {
            if (!parsed.categories['Tecnología, Electrónica & Bazar']) {
              parsed.categories['Tecnología, Electrónica & Bazar'] = parsed.categories['Tecnología, Electro & Bazar'];
            }
            delete parsed.categories['Tecnología, Electro & Bazar'];
          }
          // Remove obsolete Salud & Cuidado Personal
          if (parsed.categories['Salud & Cuidado Personal']) {
            delete parsed.categories['Salud & Cuidado Personal'];
          }
        }
        return parsed;
    } catch {}
    return saved;
  });

  const [profile, setProfile] = useState<CoupleProfile>(() => {

    const ownerId = getStoredOwnerId();
    const saved = readScopedStorage<CoupleProfile>(
      'control_gastos_profile_v3',
      ownerId,
      DEFAULT_COUPLE_PROFILE,
    );
    try {
        const parsed = saved;
        if (parsed?.accountCode && (parsed.accountCode.startsWith('PAREJA-') || parsed.accountCode.startsWith('PAIR-'))) {
          parsed.accountCode = parsed.accountCode.replace(/^(PAREJA|PAIR)-/, 'COMPARTIDA-');
        }
        if (!isDemo && parsed?.user1Name === 'Sol' && parsed?.user2Name === 'Martín') {
          return {
            accountCode: parsed.accountCode || ('COMPARTIDA-' + Math.floor(1000 + Math.random() * 9000)),
            user1Name: 'Mi Usuario',
            user2Name: 'Mi Pareja',
            currentUser: 'user1',
            currency: 'ARS',
            defaultSplit: '50_50',
          };
        }
        return parsed;

    } catch {}
    return saved;
  });

  const [settlementHistory, setSettlementHistory] = useState<SettlementRecord[]>(() => {
    const ownerId = getStoredOwnerId();
    return readScopedStorage<SettlementRecord[]>(
      'control_gastos_settlements_v3',
      ownerId,
      [],
    );
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const isDemo = localStorage.getItem('control_gastos_is_demo') === 'true';

    const ownerId = getStoredOwnerId();
    return readScopedStorage<Goal[]>(
      'control_gastos_goals_v1',
      ownerId,
      isDemo ? DEFAULT_GOALS : [],
    );
  });

  // ─── Vencimientos ─────────────────────────────────────────────────────────────
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>(() => {

    const isDemo = localStorage.getItem('control_gastos_is_demo') === 'true';
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const addDays = (d: Date, days: number) => {
      const r = new Date(d);
      r.setDate(r.getDate() + days);
      return `${r.getFullYear()}-${pad(r.getMonth() + 1)}-${pad(r.getDate())}`;
    };

    const defaultItems: Vencimiento[] = [
      {
        id: 'v1',
        icon: '💳',
        title: 'Tarjeta Visa',
        cat: 'Tarjeta de crédito',
        amount: 85000,
        dueDate: addDays(today, 2), // Rojo semántico (2 días)
        isRecurring: true,
      },
      {
        id: 'v2',
        icon: '🏢',
        title: 'Expensas',
        cat: 'Hogar',
        amount: 135000,
        dueDate: addDays(today, 7), // Naranja semántico (7 días)
        isRecurring: true,
      },
      {
        id: 'v4',
        icon: '🌐',
        title: 'Internet',
        cat: 'Servicios',
        amount: 12000,
        dueDate: addDays(today, 15), // Verde semántico (15 días)
        isRecurring: true,
      },
      {
        id: 'v3',
        icon: '💧',
        title: 'AySA',
        cat: 'Servicios',
        amount: 28500,
        dueDate: addDays(today, 18),
        isRecurring: true,
      },
      {
        id: 'v5',
        icon: '🏠',
        title: 'Alquiler',
        cat: 'Vivienda',
        amount: 650000,
        dueDate: addDays(today, 22),
        isRecurring: true,
      },
    ];


    const isDemo = localStorage.getItem('control_gastos_is_demo') === 'true';
    const ownerId = getStoredOwnerId();
    const saved = readScopedStorage<Vencimiento[]>(
      'gastoar_vencimientos_v1',
      ownerId,
      isDemo ? defaultItems : [],
    );
    if (Array.isArray(saved) && saved.length > 0) {
      try {
        const parsed = saved;
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Asegurar que los 3 vencimientos clave mantengan la semántica requerida por el usuario
          return parsed.map((item: Vencimiento) => {
            const t = (item.title || '').toLowerCase();
            if (t.includes('visa') || t.includes('tarjeta')) {
              return { ...item, title: 'Tarjeta Visa', dueDate: addDays(today, 2) };
            }
            if (t.includes('expen')) {
              return { ...item, title: 'Expensas', dueDate: addDays(today, 7) };
            }
            if (t.includes('internet')) {
              return { ...item, title: 'Internet', dueDate: addDays(today, 15) };
            }
            return item;
          });
        }
      } catch {}
    }

    return saved;
  });

  // UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'installments' | 'card_alerts' | 'couple_balance' | 'budgets' | 'categories' | 'ai' | 'settlement' | 'goals' | 'subscriptions' | 'admin_subscriptions' | 'charts' | 'profile' | 'settings' | 'cashflow' | 'currency'>('dashboard');

  // Sync route path with activeTab if user accesses specific route
  useEffect(() => {
    const raw = location.pathname.replace(/^\/+/, '').toLowerCase();
    if (!raw || raw === 'login') return;
    if (raw === 'installments' || raw === 'cuotas') setActiveTab('installments');
    else if (raw === 'card_alerts' || raw === 'vencimientos' || raw === 'alertas') setActiveTab('card_alerts');
    else if (raw === 'couple_balance' || raw === 'balance') setActiveTab('couple_balance');
    else if (raw === 'budgets' || raw === 'presupuestos') setActiveTab('budgets');
    else if (raw === 'categories' || raw === 'categorias') setActiveTab('categories');
    else if (raw === 'goals' || raw === 'metas') setActiveTab('goals');
    else if (raw === 'subscriptions' || raw === 'suscripciones') setActiveTab('subscriptions');
    else if (raw === 'admin_subscriptions' || raw === 'admin') setActiveTab('admin_subscriptions');
    else if (raw === 'transactions' || raw === 'gastos') setActiveTab('transactions');
    else if (raw === 'cashflow' || raw === 'flujocaja' || raw === 'flujo') setActiveTab('cashflow');
    else if (raw === 'currency' || raw === 'dolar' || raw === 'divisas') setActiveTab('currency');
    else if (raw === 'profile' || raw === 'perfil') setActiveTab('profile');
    else if (raw === 'settings' || raw === 'configuracion' || raw === 'ajustes') setActiveTab('settings');
    else if (raw === 'dashboard') setActiveTab('dashboard');
  }, [location.pathname]);
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
  const [isBudgetCreateModalOpen, setIsBudgetCreateModalOpen] = useState(false);
  const [budgetCreateStartMode, setBudgetCreateStartMode] = useState<'empty' | 'copy' | 'real'>('copy');
  const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isCardAlertsModalOpen, setIsCardAlertsModalOpen] = useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);

  // Screen 1 & 4: Mobile startup splash and tutorial modal
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return !sessionStorage.getItem('gastoar_splash_seen');
  });
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);

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

  // ─── Servicio de Notificaciones Locales de Vencimientos (<48hs) ─────────────────
  const {
    urgentAlerts,
    urgentCount,
    checkNotifications: checkVencimientoNotifications,
  } = useVencimientoNotifications({
    vencimientos,
    onShowToast: showToast,
  });

  const appScheduledPayments = useMemo<ScheduledPayment[]>(() => {
    return (vencimientos || []).filter(v => !v.isPaid).map(v => ({
      id: v.id,
      label: v.title || (v as any).servicio || 'Vencimiento',
      amount: Number(v.amount || 0),
      dueDate: v.dueDate || new Date().toISOString().split('T')[0],
      type: 'expense' as const,
      category: v.cat || 'Servicios',
      emoji: v.icon || '📅',
    }));
  }, [vencimientos]);

  const appTotalIncome = useMemo(() => {
    return transactions.filter(t => t.tipoTransaccion === 'ingreso').reduce((s, t) => s + Number(t.monto || 0), 0);

  }, [transactions]);

  const appTotalExpenses = useMemo(() => {
    return transactions.filter(t => t.tipoTransaccion !== 'ingreso').reduce((s, t) => s + Number(t.monto || 0), 0);
  }, [transactions]);

  const appAvailableBalance = useMemo(() => {
    return appTotalIncome - appTotalExpenses;
  }, [appTotalIncome, appTotalExpenses]);

  // Sync state to LocalStorage.
  // Real accounts are namespaced by user ID; demo data stays disposable/global.
  const localStorageOwnerId = useMemo(() => {
    if (isDemoMode) return 'demo';
    if (!isAuthenticated || !currentUserAccount) return null;
    return currentUserAccount.id || currentUserAccount.email || null;
  }, [isDemoMode, isAuthenticated, currentUserAccount]);

  // Persistir vencimientos por usuario; nunca compartir vencimientos entre cuentas.
  useEffect(() => {
    if (!localStorageOwnerId) return;
    writeScopedStorage('gastoar_vencimientos_v1', localStorageOwnerId, vencimientos);
  }, [vencimientos, localStorageOwnerId]);

  useEffect(() => {
    if (!localStorageOwnerId) return;
    writeScopedStorage('control_gastos_tx_v5', localStorageOwnerId, transactions);
  }, [transactions, localStorageOwnerId]);

  useEffect(() => {
    if (!localStorageOwnerId) return;
    writeScopedStorage('control_gastos_catmap_v6', localStorageOwnerId, categoryMap);
  }, [categoryMap, localStorageOwnerId]);

  useEffect(() => {
    if (!localStorageOwnerId) return;
    writeScopedStorage('control_gastos_colors_v6', localStorageOwnerId, categoryColors);
  }, [categoryColors, localStorageOwnerId]);

  useEffect(() => {
    if (!localStorageOwnerId) return;
    writeScopedStorage('control_gastos_budgets_v5', localStorageOwnerId, budgets);
  }, [budgets, localStorageOwnerId]);

  useEffect(() => {
    if (!localStorageOwnerId) return;
    writeScopedStorage('control_gastos_profile_v3', localStorageOwnerId, profile);
  }, [profile, localStorageOwnerId]);

  useEffect(() => {
    if (!localStorageOwnerId) return;
    writeScopedStorage('control_gastos_settlements_v3', localStorageOwnerId, settlementHistory);
  }, [settlementHistory, localStorageOwnerId]);

  useEffect(() => {
    if (!localStorageOwnerId) return;
    writeScopedStorage('control_gastos_goals_v1', localStorageOwnerId, goals);
  }, [goals, localStorageOwnerId]);

  useEffect(() => {
    if (!localStorageOwnerId) return;
    writeScopedStorage('control_gastos_subscriptions_v1', localStorageOwnerId, subscriptions);
  }, [subscriptions, localStorageOwnerId]);

  useEffect(() => {
    localStorage.setItem('control_gastos_is_demo', String(isDemoMode));
  }, [isDemoMode]);

  // Active user ID for Firebase Firestore partitioning
  const activeUserId = useMemo(() => {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    if (currentUserAccount?.id) return currentUserAccount.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (currentUserAccount?.email) return currentUserAccount.email.replace(/[^a-zA-Z0-9_-]/g, '_');
    return 'usuario_principal';
  }, [currentUserAccount, auth.currentUser?.uid]);

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
  const isRemoteUpdate = useRef<boolean>(false);
  const isInitialCloudLoadDone = useRef<boolean>(isDemoMode);

  // Sincronización en tiempo real con Firebase Firestore (onSnapshot)
  // Cross-device: PC <-> Celular
  // Elimina la secuencia bloqueante (mes actual + presupuesto + estado completo) del arranque.
  useEffect(() => {
    if (!isAuthenticated || !currentUserAccount?.email || isDemoMode || !activeUserId) return;

    setCloudSyncStatus('syncing');

    // 1. Listener en tiempo real de Movimientos del mes actual (PC <-> Celular)
    const currentMonthKey = getMesKeyFromDate('');
    const unsubscribeMovements = listenToMonthMovements(
      activeUserId,
      currentMonthKey,
      (remoteMonthTxs) => {
        // Never merge month-level data into a session until the complete
        // Firestore app-state snapshot for this UID has been accepted.
        // Otherwise a demo/previous-account state can briefly reappear.
        if (!isInitialCloudLoadDone.current) return;
        isRemoteUpdate.current = true;
        setTransactions(prev => {
          const map = new Map<string, Transaction>();
          // Conservar movimientos de otros meses ya cargados en memoria
          prev.forEach(t => map.set(t.id, t));
          // Sincronizar reactivamente los movimientos del mes actual
          remoteMonthTxs.forEach(t => map.set(t.id, t));
          const merged = Array.from(map.values());
          merged.sort((a, b) => {
            const dateDiff = (b.fecha || '').localeCompare(a.fecha || '');
            if (dateDiff !== 0) return dateDiff;
            return (b.createdAt || 0) - (a.createdAt || 0);
          });
          return merged;
        });
        setCloudSyncStatus('synced');
      },
      () => setCloudSyncStatus('offline')
    );

    // 2. Listener en tiempo real del Estado General de la aplicación (PC <-> Celular)
    const unsubscribeAppState = listenToAppState(
      activeUserId,
      (data) => {
        // The first Firestore snapshot is authoritative for this account.
        // Never merge it with whatever was left by another account/demo.
        isRemoteUpdate.current = true;

        setTransactions(
          Array.isArray(data.transactions)
            ? (data.transactions as Transaction[])
            : [],
        );

        if (data.categoryMap && Object.keys(data.categoryMap as object).length > 0) {
          setCategoryMap(data.categoryMap as Record<string, string[]>);
        } else {
          setCategoryMap(DEFAULT_CATEGORY_MAP);
        }

        if (data.categoryColors && Object.keys(data.categoryColors as object).length > 0) {
          setCategoryColors({
            ...(data.categoryColors as Record<string, string>),
            ...DEFAULT_CATEGORY_COLORS,
          });
        } else {
          setCategoryColors(DEFAULT_CATEGORY_COLORS);
        }

        setBudgets(
          data.budgets && typeof data.budgets === 'object'
            ? data.budgets as Budgets
            : { categories: {}, subcategories: {} },
        );

        if (data.profile) {
          setProfile(data.profile as CoupleProfile);
        }

        setSettlementHistory(
          Array.isArray(data.settlementHistory)
            ? data.settlementHistory as SettlementRecord[]
            : [],
        );

        setGoals(
          Array.isArray(data.goals)
            ? data.goals as Goal[]
            : [],
        );

        setSubscriptions(
          Array.isArray(data.subscriptions)
            ? data.subscriptions as UserSubscription[]
            : [],
        );

        if ('vencimientos' in data) {
          setVencimientos(
            Array.isArray(data.vencimientos)
              ? data.vencimientos as Vencimiento[]
              : [],
          );
        }

        isInitialCloudLoadDone.current = true;
        setCloudSyncStatus('synced');
      },
      () => setCloudSyncStatus('offline')
    );

    return () => {
      unsubscribeMovements();
      unsubscribeAppState();
    };
  }, [isAuthenticated, currentUserAccount?.email, activeUserId, isDemoMode]);

  // Auto-sincronización con Firestore cuando el usuario modifica datos localmente (evita loops por updates remotos)
  useEffect(() => {
    if (!isAuthenticated || !currentUserAccount?.email || isDemoMode || !activeUserId) return;

    // Do not upload local state until the first authoritative Firestore
    // snapshot has been loaded for this account.
    if (!isInitialCloudLoadDone.current) return;

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCloudSyncStatus('syncing');
        await syncAppStateToFirestore(activeUserId, {
          transactions, categoryMap, categoryColors, budgets, profile,
          settlementHistory, goals, subscriptions, vencimientos,
        });
        setCloudSyncStatus('synced');
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
    vencimientos,
    isAuthenticated,
    currentUserAccount?.email,
    activeUserId,
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

    // Automatically update learned preferences whenever an expense is created or edited
    if (savedTx.tipoTransaccion === 'gasto' && savedTx.concepto && savedTx.categoria && savedTx.concepto !== 'Gasto por voz') {
      try {
        recordLearnedPreference(
          savedTx.concepto,
          savedTx.categoria,
          savedTx.subcategoria || 'General',
          savedTx.metodoPago,
          'auto_learned'
        );
      } catch (err) {
        console.warn('Could not record learned preference:', err);
      }
    }

    // Persist to Firebase Firestore under users/{userId}/movimientos/{mesKey}/items/{txId}
    if (activeUserId && !isDemoMode) {
      saveMovementToFirestore(activeUserId, savedTx).catch(err => {
        console.warn('Could not sync movement to Firebase Firestore:', err);
      });
      // Sincronización inmediata de estado para reflejo instantáneo en otros dispositivos (PC <-> Celular)
      const updatedTxs = [savedTx, ...transactions.filter(t => t.id !== savedTx.id)];
      syncAppStateToFirestore(activeUserId, {
        transactions: updatedTxs,
        categoryMap,
        categoryColors,
        budgets,
        profile,
        settlementHistory,
        goals,
        subscriptions,
      }).catch(err => {
        console.warn('Could not sync app state on save:', err);
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
      const remainingTxs = transactions.filter(t => t.id !== id);
      syncAppStateToFirestore(activeUserId, {
        transactions: remainingTxs,
        categoryMap,
        categoryColors,
        budgets,
        profile,
        settlementHistory,
        goals,
        subscriptions,
      }).catch(err => {
        console.warn('Could not sync app state on delete:', err);
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
  const handleAddGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>): Goal => {
    const newGoal: Goal = {
      ...goalData,
      id: 'goal-' + Date.now(),
      createdAt: Date.now(),
    };
    setGoals(prev => [newGoal, ...prev]);
    showToast(`Caja de meta "${newGoal.nombre}" creada con éxito`, 'success');
    return newGoal;
  };

  const handleUpdateGoal = (id: string, updated: Partial<Goal>) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updated } : g)));
    showToast('Caja de meta actualizada', 'success');
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    showToast('Caja de meta eliminada', 'info');
  };

  // ─── Handlers de Vencimientos ─────────────────────────────────────────────────

  const handleAddVencimiento = (v: Omit<Vencimiento, 'id'>) => {
    const newV: Vencimiento = { ...v, id: 'venc-' + Date.now() };
    setVencimientos(prev => [...prev, newV].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
    showToast(`Vencimiento "${v.title}" agregado`, 'success');
  };

  const handleMarkVencimientoPaid = (id: string) => {
    setVencimientos(prev => prev.map(v => {
      if (v.id !== id) return v;
      // Si es recurrente, avanzar al próximo mes en lugar de eliminar
      if (v.isRecurring) {
        const next = new Date(v.dueDate);
        next.setMonth(next.getMonth() + 1);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const nextDate = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
        return { ...v, dueDate: nextDate, isPaid: false };
      }
      return { ...v, isPaid: true };
    }));
    showToast('Vencimiento marcado como pagado ✓', 'success');
  };

  const handleDeleteVencimiento = (id: string) => {
    setVencimientos(prev => prev.filter(v => v.id !== id));
    showToast('Vencimiento eliminado', 'info');
  };

  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `gastoar_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Datos exportados exitosamente en formato JSON', 'success');
    } catch {
      showToast('Error al exportar datos', 'error');
    }
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
    const newCode = 'COMPARTIDA-' + Math.floor(1000 + Math.random() * 9000);
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
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
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
      const cleanInput = email.trim();
      const cleanEmail = cleanInput.toLowerCase();

      // Firebase Auth es la fuente de verdad para cuentas nuevas. A diferencia
      // del archivo temporal de Vercel, funciona igual desde cualquier equipo.
      try {
        const firebaseUser = await loginWithEmailFirebase(cleanEmail, password || '');
        const savedProfile = await getUserProfileFromFirestore(firebaseUser.uid);
        const cloudState = await getAppStateFromFirestore(firebaseUser.uid);
        const now = Date.now();
        const acc: UserAccount = savedProfile || {
          id: firebaseUser.uid,
          email: firebaseUser.email || cleanEmail,
          name: firebaseUser.displayName || cleanEmail.split('@')[0],
          accountType: 'individual',
          accountCode: `COMPARTIDA-${Math.floor(1000 + Math.random() * 9000)}`,
          currency: 'ARS',
          createdAt: now,
        };
        // Hydrate the account before enabling the cloud sync effects.
        // If Firestore has no state yet, start from a completely clean account.
        const state = cloudState || {};
        setTransactions(
          Array.isArray(state.transactions)
            ? state.transactions as Transaction[]
            : [],
        );
        setCategoryMap(
          state.categoryMap && Object.keys(state.categoryMap as object).length > 0
            ? state.categoryMap as CategoryMap
            : DEFAULT_CATEGORY_MAP,
        );
        setCategoryColors(
          state.categoryColors && Object.keys(state.categoryColors as object).length > 0
            ? {
                ...(state.categoryColors as CategoryColors),
                ...DEFAULT_CATEGORY_COLORS,
              }
            : DEFAULT_CATEGORY_COLORS,
        );
        setBudgets(
          state.budgets && typeof state.budgets === 'object'
            ? state.budgets as Budgets
            : { categories: {}, subcategories: {} },
        );
        setProfile(
          state.profile
            ? state.profile as CoupleProfile
            : {
                ...DEFAULT_COUPLE_PROFILE,
                user1Name: acc.name,
                user2Name: acc.partnerName || 'Mi Pareja',
                currency: acc.currency || 'ARS',
                accountCode: acc.accountCode || DEFAULT_COUPLE_PROFILE.accountCode,
              },
        );
        setSettlementHistory(
          Array.isArray(state.settlementHistory)
            ? state.settlementHistory as SettlementRecord[]
            : [],
        );
        setGoals(
          Array.isArray(state.goals)
            ? state.goals as Goal[]
            : [],
        );
        setSubscriptions(
          Array.isArray(state.subscriptions)
            ? state.subscriptions as UserSubscription[]
            : [],
        );
        setVencimientos(
          Array.isArray(state.vencimientos)
            ? state.vencimientos as Vencimiento[]
            : readScopedStorage<Vencimiento[]>('gastoar_vencimientos_v1', firebaseUser.uid, []),
        );

        isInitialCloudLoadDone.current = false;
        setCurrentUserAccount(acc);
        localStorage.setItem('control_gastos_account_v1', JSON.stringify(acc));
        setIsAdmin(false);
        setIsDemoMode(false);
        setIsAuthenticated(true);
        localStorage.setItem('control_gastos_is_authenticated', 'true');
        localStorage.setItem('control_gastos_is_admin', 'false');
        localStorage.setItem('control_gastos_is_demo', 'false');
        setCloudSyncStatus('synced');
        showToast('¡Sesión iniciada! Tus datos se están sincronizando desde la nube ☁️', 'success');
        return { success: true };
      } catch (firebaseError: any) {
        // Se conserva el camino heredado sólo para cuentas creadas antes de la
        // migración; las cuentas nuevas no dependen de él.
        if (!['auth/user-not-found', 'auth/invalid-credential'].includes(firebaseError?.code)) {
          return { success: false, error: 'No se pudo iniciar sesión. Revisá el correo y la contraseña.' };
        }
      }

      let json: any = null;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanInput, password }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          json = await res.json();
        } else {
          console.warn('Non-JSON response from /api/auth/login:', res.status);
        }
      } catch (fetchErr) {
        console.warn('Network call to /api/auth/login failed:', fetchErr);
      }

      if (json && json.success && json.account) {
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
          // A successful login without payload must never display whatever was
          // left by Demo mode or the previous account. Start empty instead.
          clearPreviousSessionData();
          setProfile({
            ...DEFAULT_COUPLE_PROFILE,
            user1Name: acc.name,
            user2Name: acc.partnerName || 'Mi Pareja',
            currency: acc.currency || 'ARS',
            accountCode: acc.accountCode || DEFAULT_COUPLE_PROFILE.accountCode,
          });
        }

        setIsAdmin(false);
        setIsDemoMode(false);
        localStorage.setItem('control_gastos_is_admin', 'false');
        localStorage.setItem('control_gastos_is_demo', 'false');
        setIsAuthenticated(true);
        localStorage.setItem('control_gastos_is_authenticated', 'true');
        setCloudSyncStatus('synced');
        isInitialCloudLoadDone.current = true;

        // Sync profile to Firestore in background
        if (acc.id) {
          syncUserProfileToFirestore(acc.id, acc).catch(() => {});
        }

        showToast('¡Sesión iniciada con éxito! Información sincronizada desde la nube ☁️', 'success');
        return { success: true };
      }

      // If server returned structured error (e.g. invalid password or user not found)
      if (json && !json.success && json.error) {
        setCloudSyncStatus('offline');
        // Check local storage before failing if account exists locally
        const savedAccountStr = localStorage.getItem('control_gastos_account_v1');
        if (savedAccountStr) {
          try {
            const savedAccount: UserAccount = JSON.parse(savedAccountStr);
            if (
              savedAccount.email.toLowerCase() === cleanEmail ||
              savedAccount.name.toLowerCase() === cleanEmail ||
              savedAccount.accountCode.toUpperCase() === cleanInput.toUpperCase()
            ) {
              if (savedAccount.password && password && savedAccount.password !== password) {
                return { success: false, error: 'Contraseña incorrecta. Por favor verificala.' };
              }
              setCurrentUserAccount(savedAccount);
              clearPreviousSessionData();
              setIsDemoMode(false);
              setIsAuthenticated(true);
              localStorage.setItem('control_gastos_is_authenticated', 'true');
              localStorage.setItem('control_gastos_is_demo', 'false');
              showToast('¡Sesión iniciada con tu cuenta guardada localmente!', 'success');
              return { success: true };
            }
          } catch {}
        }
        return { success: false, error: json.error };
      }

      // Fallback local login if server offline or returned non-JSON
      const savedAccountStr = localStorage.getItem('control_gastos_account_v1');
      if (savedAccountStr) {
        try {
          const savedAccount: UserAccount = JSON.parse(savedAccountStr);
          if (
            savedAccount.email.toLowerCase() === cleanEmail ||
            savedAccount.name.toLowerCase() === cleanEmail ||
            savedAccount.accountCode.toUpperCase() === cleanInput.toUpperCase()
          ) {
            if (savedAccount.password && password && savedAccount.password !== password) {
              return { success: false, error: 'Contraseña incorrecta. Por favor verificala.' };
            }
            setCurrentUserAccount(savedAccount);
            clearPreviousSessionData();
            setIsDemoMode(false);
            setIsAuthenticated(true);
            localStorage.setItem('control_gastos_is_authenticated', 'true');
            localStorage.setItem('control_gastos_is_demo', 'false');
            showToast('¡Sesión iniciada en modo local!', 'success');
            return { success: true };
          }
        } catch {}
      }

      return {
        success: false,
        error: 'No se encontró ninguna cuenta con este correo o usuario. Seleccioná "Crear Cuenta" o ingresá en "Modo Demo".',
      };
    } catch (err: any) {
      console.error('Error logging in:', err);
      return { success: false, error: 'No se pudo conectar al servidor. Podés ingresar en Modo Demo.' };
    }
  };

  /**
   * Put the client in a guaranteed clean state before entering a real account.
   * This is intentionally separate from Demo mode: a real account must never
   * reuse the demo/unscoped localStorage keys.
   */
  const clearPreviousSessionData = () => {
    setTransactions([]);
    setGoals([]);
    setSettlementHistory([]);
    setVencimientos([]);
    setBudgets({ categories: {}, subcategories: {} });
    setCategoryMap(DEFAULT_CATEGORY_MAP);
    setCategoryColors(DEFAULT_CATEGORY_COLORS);
    setProfile(DEFAULT_COUPLE_PROFILE);
    setSubscriptions([]);

    const emptyValues: Record<string, unknown> = {
      'control_gastos_tx_v5': [],
      'control_gastos_budgets_v5': { categories: {}, subcategories: {} },
      'control_gastos_goals_v1': [],
      'control_gastos_settlements_v3': [],
      'control_gastos_card_alerts_v2': [],
      'gastoar_vencimientos_alerts_v5': [],
      'gastoar_vencimientos_alerts_v4': [],
      'gastoar_vencimientos_alerts_v3': [],
    };

    Object.entries(emptyValues).forEach(([key, value]) => {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    });

    // Remove disposable demo-only global data so it cannot be mistaken for
    // real account data during a session transition. A later explicit Demo
    // entry recreates these values through handleGuestDemo().
    [
      'control_gastos_tx_v5',
      'control_gastos_budgets_v5',
      'control_gastos_goals_v1',
      'control_gastos_settlements_v3',
      'gastoar_vencimientos_v1',
      'control_gastos_profile_v3',
      'control_gastos_subscriptions_v1',
    ].forEach((key) => {
      try { localStorage.removeItem(key); } catch {}
    });

    localStorage.setItem('control_gastos_is_demo', 'false');
    localStorage.setItem('control_gastos_is_admin', 'false');
  };

  const handleRegister = async (data: {
    name: string;
    lastName?: string;
    phone?: string;
    email: string;
    password?: string;
    accountType: 'pareja' | 'individual';
    partnerName?: string;
    currency?: string;
    accountCode?: string;
    selectedPlanId?: SubscriptionPlanId;
    emailVerified?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setCloudSyncStatus('syncing');

      const cleanEmail = data.email.trim().toLowerCase();
      if (!data.password) {
        return { success: false, error: 'Ingresá una contraseña para crear tu cuenta.' };
      }

      const today = new Date();
      const trialEnd = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
      const chosenPlan = SUBSCRIPTION_PLANS.find(p => p.id === (data.selectedPlanId || (data.accountType === 'individual' ? 'individual' : 'pareja'))) || SUBSCRIPTION_PLANS[1];

      const initialSub: UserSubscription = {
        id: 'sub-' + Date.now(),
        userId: 'usr-' + Date.now(),
        userEmail: cleanEmail,
        userName: `${data.name.trim()}${data.lastName ? ' ' + data.lastName.trim() : ''}`,
        partnerName: data.partnerName ? data.partnerName.trim() : undefined,
        accountCode: data.accountCode ? data.accountCode.replace(/^(PAREJA|PAIR)-/, 'COMPARTIDA-') : ('COMPARTIDA-' + Math.floor(1000 + Math.random() * 9000)),
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

      let firebaseUser;
      try {
        firebaseUser = await registerWithEmailFirebase(cleanEmail, data.password, data.name.trim(), data.lastName?.trim());
      } catch (firebaseError: any) {
        if (firebaseError?.code === 'auth/email-already-in-use') {
          return { success: false, error: 'Ya existe una cuenta con este correo. Elegí “Iniciar sesión”.' };
        }
        return { success: false, error: 'No se pudo crear la cuenta. Intentá nuevamente.' };
      }

      const payload = {
        name: data.name.trim(),
        lastName: data.lastName ? data.lastName.trim() : undefined,
        phone: data.phone ? data.phone.trim() : undefined,
        email: cleanEmail,
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
          vencimientos: [],
        },
      };

      const newAcc: UserAccount = {
        id: firebaseUser.uid,
        email: cleanEmail,
        name: data.name.trim(),
        lastName: data.lastName ? data.lastName.trim() : undefined,
        phone: data.phone ? data.phone.trim() : undefined,
        accountType: data.accountType,
        partnerName: data.partnerName ? data.partnerName.trim() : undefined,
        currency: data.currency || 'ARS',
        accountCode: initialSub.accountCode,
        selectedPlanId: chosenPlan.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        emailVerified: firebaseUser.emailVerified,
      };

      await syncUserProfileToFirestore(firebaseUser.uid, newAcc);
      await syncAppStateToFirestore(firebaseUser.uid, payload.initialData);

      setCurrentUserAccount(newAcc);
      localStorage.setItem('control_gastos_account_v1', JSON.stringify(newAcc));

      // Update local registry of known accounts to prevent duplicate creation
      try {
        const knownStr = localStorage.getItem('control_gastos_known_accounts_v1');
        const known = knownStr ? JSON.parse(knownStr) : {};
        known[cleanEmail] = {
          email: cleanEmail,
          name: data.name.trim(),
          lastName: data.lastName ? data.lastName.trim() : '',
          phone: data.phone ? data.phone.trim() : '',
          accountCode: initialSub.accountCode,
          createdAt: Date.now(),
        };
        localStorage.setItem('control_gastos_known_accounts_v1', JSON.stringify(known));
      } catch {}

      // IMPORTANT: discard any demo/previous-account state before enabling
      // the real session. The new account is hydrated only from its own UID.
      clearPreviousSessionData();
      setProfile(cleanProfile);
      setSubscriptions([initialSub]);

      setIsAdmin(false);
      setIsDemoMode(false);
      localStorage.setItem('control_gastos_is_admin', 'false');
      localStorage.setItem('control_gastos_is_demo', 'false');

      setIsAuthenticated(true);
      localStorage.setItem('control_gastos_is_authenticated', 'true');
      setCloudSyncStatus('syncing');
      // The Firestore listener must be the first authoritative read for the
      // new UID. Do not allow the auto-sync effect to upload stale/demo data.
      isInitialCloudLoadDone.current = false;
      setActiveTab('dashboard');

      // Sync profile to Firestore
      if (newAcc.id) {
        syncUserProfileToFirestore(newAcc.id, newAcc).catch(() => {});
      }

      showToast('¡Cuenta creada y sincronizada en la nube con 15 días de prueba gratis! ☁️', 'success');
      return { success: true };
    } catch (err: any) {
      console.error('Error registering:', err);
      return { success: false, error: 'Error al registrar la cuenta. Podés ingresar en Modo Demo.' };
    }
  };

  const handleGoogleLogin = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setCloudSyncStatus('syncing');
      const user = await signInWithGoogle();
      if (!user || !user.email) {
        return { success: false, error: 'No se pudo completar el inicio de sesión con Google.' };
      }

      const email = user.email.toLowerCase();
      const name = user.displayName || email.split('@')[0];
      const accountCode = 'COMPARTIDA-' + Math.floor(1000 + Math.random() * 9000);

      const acc: UserAccount = {
        id: user.uid,
        email,
        name,
        accountType: 'individual',
        accountCode,
        currency: 'ARS',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Try server sync
      try {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: acc.name,
            email: acc.email,
            accountType: acc.accountType,
            currency: acc.currency,
            accountCode: acc.accountCode,
            initialData: {
              transactions: [],
              categoryMap: DEFAULT_CATEGORY_MAP,
              categoryColors: DEFAULT_CATEGORY_COLORS,
              budgets: { categories: {}, subcategories: {} },
              profile: { ...DEFAULT_COUPLE_PROFILE, user1Name: acc.name, accountCode: acc.accountCode },
              settlementHistory: [],
              goals: [],
              subscriptions: [],
              vencimientos: [],
            },
          }),
        });
      } catch {}

      // Save locally
      setCurrentUserAccount(acc);
      localStorage.setItem('control_gastos_account_v1', JSON.stringify(acc));

      // Reset state for the new Google session; never reuse Demo data.
      clearPreviousSessionData();
      setCategoryMap(DEFAULT_CATEGORY_MAP);
      setCategoryColors(DEFAULT_CATEGORY_COLORS);
      setProfile({ ...DEFAULT_COUPLE_PROFILE, user1Name: acc.name, accountCode: acc.accountCode });

      setIsAdmin(false);
      setIsDemoMode(false);
      localStorage.setItem('control_gastos_is_admin', 'false');
      localStorage.setItem('control_gastos_is_demo', 'false');

      setIsAuthenticated(true);
      localStorage.setItem('control_gastos_is_authenticated', 'true');
      setCloudSyncStatus('syncing');
      // The Firestore listener must be the first authoritative read for the
      // new UID. Do not allow the auto-sync effect to upload stale/demo data.
      isInitialCloudLoadDone.current = false;
      setActiveTab('dashboard');

      // Sync profile to Firestore
      syncUserProfileToFirestore(user.uid, acc).catch(() => {});

      showToast(`¡Bienvenido/a, ${name}! Sesión iniciada con Google ☁️`, 'success');
      return { success: true };
    } catch (err: any) {
      console.error('Error with Google Sign In:', err);
      return { success: false, error: err.message || 'Error al conectar con Google.' };
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
    // Limpieza total del estado demo
    setTransactions([]);
    setGoals([]);
    setBudgets({ categories: {}, subcategories: {} });
    setVencimientos([]);
    setSettlementHistory([]);
    setProfile({
      accountCode: 'COMPARTIDA-' + Math.floor(1000 + Math.random() * 9000),
      user1Name: 'Mi Usuario',
      user2Name: 'Mi Pareja',
      currentUser: 'user1',
      currency: 'ARS',
      defaultSplit: '50_50',
    });
    localStorage.removeItem('control_gastos_tx_v5');
    localStorage.removeItem('control_gastos_budgets_v5');
    localStorage.removeItem('control_gastos_goals_v1');
    localStorage.removeItem('control_gastos_settlements_v3');
    localStorage.removeItem('gastoar_vencimientos_v1');
    localStorage.removeItem('gastoar_vencimientos_alerts_v5');
    localStorage.removeItem('gastoar_card_alerts_v2');
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

  const handleLogout = async () => {
    try {
      await logOutFirebase();
    } catch (e) {
      console.warn('Error signing out of Firebase:', e);
    }
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsDemoMode(false);
    setCurrentUserAccount(null);
    setTransactions([]);
    setGoals([]);
    setBudgets({ categories: {}, subcategories: {} });
    setVencimientos([]);
    setSettlementHistory([]);
    setProfile({
      accountCode: 'COMPARTIDA-' + Math.floor(1000 + Math.random() * 9000),
      user1Name: 'Mi Usuario',
      user2Name: 'Mi Pareja',
      currentUser: 'user1',
      currency: 'ARS',
      defaultSplit: '50_50',
    });
    localStorage.removeItem('control_gastos_is_authenticated');
    localStorage.removeItem('control_gastos_is_admin');
    localStorage.removeItem('control_gastos_is_demo');
    localStorage.removeItem('control_gastos_account_v1');

    localStorage.removeItem('control_gastos_tx_v5');
    localStorage.removeItem('control_gastos_budgets_v5');
    localStorage.removeItem('control_gastos_goals_v1');
    localStorage.removeItem('control_gastos_settlements_v3');
    localStorage.removeItem('gastoar_vencimientos_v1');
    localStorage.removeItem('gastoar_vencimientos_alerts_v5');
    localStorage.removeItem('gastoar_card_alerts_v2');
    showToast('Has cerrado sesión correctamente. ¡Hasta pronto!', 'info');
    navigate('/login', { replace: true });
  };

  // Active User Subscription & Permissions
  const activeUserSub = subscriptions.find(s => s.userEmail.toLowerCase() === (currentUserAccount?.email || 'ejemplo@ejemplo.com').toLowerCase());
  const currentPlanId: SubscriptionPlanId = activeUserSub?.planId || currentUserAccount?.selectedPlanId || (currentUserAccount?.accountType === 'individual' ? 'individual' : 'pareja');
  const canManageCategories = isAdmin || (currentPlanId !== 'individual' && currentPlanId !== 'free');

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

  return (
    <>
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={(location.state as any)?.from?.pathname || '/'} replace />
            ) : (
              <>
                <AuthLandingPage
                  onLogin={async (email, pass) => {
                    const res = await handleLogin(email, pass);
                    if (res.success) {
                      navigate((location.state as any)?.from?.pathname || '/', { replace: true });
                    }
                    return res;
                  }}
                  onRegister={async (data) => {
                    const res = await handleRegister(data);
                    if (res.success) {
                      navigate((location.state as any)?.from?.pathname || '/', { replace: true });
                    }
                    return res;
                  }}
                  onGoogleLogin={async () => {
                    const res = await handleGoogleLogin();
                    if (res.success) {
                      navigate((location.state as any)?.from?.pathname || '/', { replace: true });
                    }
                    return res;
                  }}
                  onGuestDemo={() => {
                    handleGuestDemo();
                    navigate('/', { replace: true });
                  }}
                  onOpenAdminPanel={() => {
                    handleOpenAdminPanel();
                    navigate('/admin', { replace: true });
                  }}
                />
              </>
            )
          }
        />

        {/* Protected App Routes (Expenses Management, Balance, Alerts, Categories, Sync, Admin, etc.) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAuthLoading={isAuthLoading}>
              {isTrialExpired ? (
                <TrialExpiredBlockedScreen
                  userAccount={currentUserAccount}
                  subscription={activeUserSub}
                  onSelectPlanPayment={handleSelectPlanPayment}
                  onLogout={handleLogout}
                  onOpenAdminPanel={handleOpenAdminPanel}
                />
              ) : (
                <div className={`min-h-screen flex flex-col md:flex-row antialiased selection:bg-purple-100 selection:text-purple-900 transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0314] text-purple-50' : 'bg-slate-50 text-slate-800'}`}>

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
        isDarkMode={isDarkMode}
        urgentVencimientosCount={urgentCount}
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
          isDarkMode={isDarkMode}
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
              isDemoMode={isDemoMode}
              onShowToast={showToast}
              onSaveTransaction={handleSaveTransaction}
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
                isPro={currentPlanId === 'pro_ai' || isAdmin || isDemoMode}
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
                onCreateBudget={(mode) => {
                  if (mode) setBudgetCreateStartMode(mode);
                  setIsBudgetCreateModalOpen(true);
                }}
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
                onUpgradeToPro={() => setActiveTab('subscriptions')}
              />
            </div>
          )}

          {/* TAB 4: CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <CategoriesSection
              categoryMap={categoryMap}
              categoryColors={categoryColors}
              canManageCategories={canManageCategories}
              onUpgradePlan={() => setActiveTab('subscriptions')}
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
                goals={goals}
                isDemoMode={isDemoMode}
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
                vencimientos={vencimientos}
                onMarkVencimientoPaid={handleMarkVencimientoPaid}
                onDeleteVencimiento={handleDeleteVencimiento}
                onAddVencimiento={handleAddVencimiento}
                isPro={currentPlanId === 'pro_ai' || isAdmin || isDemoMode}
                onUpgradeToPro={() => setActiveTab('subscriptions')}
                onOpenCashFlowTab={() => setActiveTab('cashflow')}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                onOpenSettlementModal={() => setIsSettlementModalOpen(true)}
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

          {/* TAB: FLUJO DE CAJA (CASH FLOW PRO) */}
          {activeTab === 'cashflow' && (
            <CashFlowSection
              transactions={transactions}
              currentBalance={appAvailableBalance}
              scheduledPayments={appScheduledPayments}
              isPro={currentPlanId === 'pro_ai' || isAdmin || isDemoMode}
              onUpgradePro={() => setActiveTab('subscriptions')}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB: COTIZACIONES MULTIMONEDA & CONVERSOR DÓLAR */}
          {activeTab === 'currency' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>💵 Dólar & Cotizaciones Multimoneda</span>
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-300 text-[10px] font-black uppercase border border-orange-300">
                      En Vivo
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cotizaciones en tiempo real del Dólar Blue, MEP, Tarjeta, Cripto y Euro con conversor inteligente.
                  </p>
                </div>
              </div>
              <MultiCurrencyWidget
                variant="card"
                currentBalance={appAvailableBalance}
                monthlyExpenses={appTotalExpenses}
                isPro={currentPlanId === 'pro_ai' || isAdmin || isDemoMode}
                onUpgradePro={() => setActiveTab('subscriptions')}
                isDarkMode={isDarkMode}
                onApplyConversion={(arsAmount) => {
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

          {/* TAB: SUSCRIPCIÓN PRO (Pantalla 8) */}
          {activeTab === 'subscriptions' && (
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
              <MobileSubscriptionScreen
                onBack={() => setActiveTab('dashboard')}
                onSelectPlanPayment={(plan, cycle) => {
                  if (activeUserSub) {
                    handleUpdateSubscription(activeUserSub.id, {
                      planId: plan.id as any,
                      billingCycle: cycle,
                      status: 'active'
                    });
                  }
                  showToast(`¡Plan ${plan.name} activado con éxito!`, 'success');
                  setActiveTab('dashboard');
                }}
                onShowToast={showToast}
              />
            </div>
          )}

          {/* TAB 10: MI PERFIL (Pantalla 6) */}
          {activeTab === 'profile' && (
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
              <ProfileScreen
                onBack={() => setActiveTab('dashboard')}
                onClose={() => setActiveTab('dashboard')}
                userAccount={currentUserAccount}
                profile={profile}
                subscription={activeUserSub}
                onUpdateProfile={(data) => {
                  setProfile(prev => ({ ...prev, ...data }));
                  showToast('Perfil actualizado con éxito', 'success');
                }}
                onUpdateAccount={handleUpdateAccount}
                onNavigateToTab={(tab) => setActiveTab(tab as any)}
                onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
                onLogout={handleLogout}
                onShowToast={showToast}
              />
            </div>
          )}

          {/* TAB 11: CONFIGURACIÓN (Pantalla 7) */}
          {activeTab === 'settings' && (
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
              <SettingsScreen
                userAccount={currentUserAccount}
                profile={profile}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                onUpdateProfile={(data) => {
                  setProfile(prev => ({ ...prev, ...data }));
                }}
                onExportData={handleExportData}
                onLogout={handleLogout}
                onShowToast={showToast}
                onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
              />
            </div>
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
        onOpenVoiceExpense={() => setIsAiModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpenMobile(prev => !prev)}
        hasDebt={debtInfo.debtAmount > 0}
        urgentVencimientosCount={urgentCount}
      />

      {/* Floating Demo Mode Exit & Register Pill / Bar (Req: fácil salida y registro) */}
      {isDemoMode && (
        <aside
          aria-label="Aviso de Modo Demostración"
          className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-[calc(100vw-24px)] pointer-events-auto"
        >
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/95 backdrop-blur-md text-white p-2 pl-3.5 sm:pl-4 rounded-2xl shadow-2xl border border-purple-500/40 ring-2 ring-purple-400/20">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-[11px] sm:text-xs font-black text-amber-300 leading-tight">
                  Modo Demo
                </p>
                <p className="text-[10px] text-slate-300 truncate hidden xs:block">
                  ¿Querés guardar tus datos?
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExitDemo}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#7928CA] to-[#F95420] hover:from-[#6A1FB8] hover:to-[#E04412] text-white text-xs sm:text-sm font-black shadow-lg flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-all"
              title="Salir del modo demo y registrar tu cuenta real"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Salir y Registrarme</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </aside>
      )}

      {/* MODALS */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); setInitialIsCuotas(false); }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
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
        goals={goals}
        onAddGoal={handleAddGoal}
        onAddGoalContribution={handleAddContribution}
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

      <BudgetCreateModal
        isOpen={isBudgetCreateModalOpen}
        onClose={() => setIsBudgetCreateModalOpen(false)}
        initialStartMode={budgetCreateStartMode}
        budgets={budgets}
        categoryMap={categoryMap}
        categoryColors={categoryColors}
        transactions={transactions}
        currency={profile?.currency || 'ARS'}
        onCreate={(newBudgets) => {
          setBudgets(newBudgets);
          showToast('Presupuesto creado con éxito', 'success');
        }}
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
        onNavigateToTab={(tab) => {
          setIsProfileModalOpen(false);
          setActiveTab(tab as any);
        }}
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
        isDemoMode={isDemoMode}
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

      {/* Pantalla 4: Onboarding Tutorial Modal */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100 max-h-[92vh] flex flex-col">
            <OnboardingScreen
              onFinish={() => {
                localStorage.setItem('gastoar_onboarding_completed', 'true');
                setIsOnboardingModalOpen(false);
                showToast('¡Tutorial completado!', 'success');
              }}
              onSkip={() => {
                localStorage.setItem('gastoar_onboarding_completed', 'true');
                setIsOnboardingModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Pantalla 1: Native Splash Screen on App Launch */}
      {showSplash && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0D041A]">
          <div className="w-full max-w-md h-full min-h-[580px] bg-[#0D041A] flex flex-col">
            <SplashScreen 
              onFinish={() => {
                sessionStorage.setItem('gastoar_splash_seen', 'true');
                setShowSplash(false);
              }} 
            />
          </div>
        </div>
      )}
                </div>
              )}
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
