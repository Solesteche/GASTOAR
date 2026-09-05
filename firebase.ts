import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  getDocFromServer,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Budgets, Transaction, UserAccount } from '../types';

// 1. Initialize Firebase App and Firestore with required firestoreDatabaseId
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Error Handler with strict FirestoreErrorInfo JSON serialization
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test initial connection to Firestore
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection test: client offline or database cold-start.');
    }
    return false;
  }
}

// Format month key: 'YYYY-MM' (ej: '2026-09')
export function getMesKeyFromDate(fechaStr: string): string {
  if (!fechaStr) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
  return fechaStr.substring(0, 7);
}

// Spanish month names helper
export const MONTH_NAMES_ES: { [key: string]: string } = {
  '01': 'Enero',
  '02': 'Febrero',
  '03': 'Marzo',
  '04': 'Abril',
  '05': 'Mayo',
  '06': 'Junio',
  '07': 'Julio',
  '08': 'Agosto',
  '09': 'Septiembre',
  '10': 'Octubre',
  '11': 'Noviembre',
  '12': 'Diciembre',
};

export function getReadableMonthName(mesKey: string): string {
  const parts = mesKey.split('-');
  if (parts.length === 2) {
    const monthName = MONTH_NAMES_ES[parts[1]] || parts[1];
    return `${monthName} ${parts[0]}`;
  }
  return mesKey;
}

// -------------------------------------------------------------
// FIRESTORE SERVICES FOLLOWING REQUESTED HIERARCHY:
// usuarios -> presupuestos -> movimientos -> [mes ej. septiembre]
// -------------------------------------------------------------

/**
 * 1. USUARIOS: Guarda o sincroniza perfil del usuario
 * Path: /users/{userId}
 */
export async function syncUserProfileToFirestore(userId: string, account: UserAccount): Promise<void> {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      email: account.email || auth.currentUser?.email || '',
      name: account.name || 'Usuario',
      lastName: account.lastName || '',
      phone: account.phone || '',
      partnerName: account.partnerName || '',
      accountType: account.accountType || 'individual',
      accountCode: account.accountCode || '',
      currency: account.currency || 'ARS',
      updatedAt: new Date().toISOString(),
      createdAt: account.createdAt ? new Date(account.createdAt).toISOString() : new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * 1. USUARIOS: Obtiene el perfil del usuario
 * Path: /users/{userId}
 */
export async function getUserProfileFromFirestore(userId: string): Promise<UserAccount | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/**
 * 2. PRESUPUESTOS: Guarda la configuración de presupuestos
 * Path: /users/{userId}/presupuestos/actual
 */
export async function syncBudgetsToFirestore(userId: string, budgets: Budgets): Promise<void> {
  const path = `users/${userId}/presupuestos/actual`;
  try {
    await setDoc(doc(db, 'users', userId, 'presupuestos', 'actual'), {
      userId,
      categories: budgets.categories || {},
      subcategories: budgets.subcategories || {},
      alertThresholdPercent: budgets.alertThresholdPercent ?? 80,
      projectionGrowthPercent: budgets.projectionGrowthPercent ?? 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * 2. PRESUPUESTOS: Lee los presupuestos del usuario
 * Path: /users/{userId}/presupuestos/actual
 */
export async function getBudgetsFromFirestore(userId: string): Promise<Budgets | null> {
  const path = `users/${userId}/presupuestos/actual`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'presupuestos', 'actual'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        categories: data.categories || {},
        subcategories: data.subcategories || {},
        alertThresholdPercent: data.alertThresholdPercent,
        projectionGrowthPercent: data.projectionGrowthPercent,
        lastProjectedDate: data.updatedAt
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/**
 * Estado que no forma parte de un movimiento individual. Mantenerlo en
 * Firestore evita que un dispositivo nuevo dependa de localStorage o de la
 * carpeta temporal de un servidor serverless.
 */
export async function syncAppStateToFirestore(userId: string, state: Record<string, unknown>): Promise<void> {
  const path = `users/${userId}/estado/actual`;
  try {
    await setDoc(doc(db, 'users', userId, 'estado', 'actual'), {
      ...state,
      userId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getAppStateFromFirestore(userId: string): Promise<Record<string, unknown> | null> {
  const path = `users/${userId}/estado/actual`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'estado', 'actual'));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/**
 * 3. MOVIMIENTOS PARTICIONADOS POR MES (Optimización de lecturas):
 * Path: /users/{userId}/movimientos/{mesKey}/items/{txId}
 * No descarga el histórico completo; cada mes es independiente.
 */
export async function saveMovementToFirestore(userId: string, tx: Transaction): Promise<void> {
  const mesKey = getMesKeyFromDate(tx.fecha);
  const monthDocPath = `users/${userId}/movimientos/${mesKey}`;
  const itemDocPath = `${monthDocPath}/items/${tx.id}`;

  try {
    // 1. Guardar o actualizar el contenedor del mes
    await setDoc(doc(db, 'users', userId, 'movimientos', mesKey), {
      userId,
      mesKey,
      nombreMes: getReadableMonthName(mesKey),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Guardar el movimiento específico bajo el mes correspondiente
    await setDoc(doc(db, 'users', userId, 'movimientos', mesKey, 'items', tx.id), {
      id: tx.id,
      userId,
      mesKey,
      concepto: tx.concepto,
      descripcion: tx.descripcion || '',
      monto: Number(tx.monto) || 0,
      moneda: tx.moneda || 'ARS',
      categoria: tx.categoria || 'Varios',
      subcategoria: tx.subcategoria || '',
      fecha: tx.fecha,
      tipo: tx.tipo || 'individual',
      tipoTransaccion: tx.tipoTransaccion || 'gasto',
      pagadoPor: tx.pagadoPor || 'user1',
      splitType: tx.splitType || '50_50',
      user1Percent: tx.user1Percent ?? 50,
      user2Percent: tx.user2Percent ?? 50,
      user1Amount: tx.user1Amount ?? 0,
      user2Amount: tx.user2Amount ?? 0,
      metodoPago: tx.metodoPago || 'Efectivo',
      esCuotas: Boolean(tx.esCuotas),
      cuotasTotal: tx.cuotasTotal || 1,
      cuotaActual: tx.cuotaActual || 1,
      montoCuota: tx.montoCuota || tx.monto,
      tarjetaNombre: tx.tarjetaNombre || '',
      createdAt: tx.createdAt || Date.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, itemDocPath);
  }
}

/**
 * Elimina un movimiento de su mes correspondiente en Firestore
 */
export async function deleteMovementFromFirestore(userId: string, txId: string, fecha: string): Promise<void> {
  const mesKey = getMesKeyFromDate(fecha);
  const itemDocPath = `users/${userId}/movimientos/${mesKey}/items/${txId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'movimientos', mesKey, 'items', txId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, itemDocPath);
  }
}

/**
 * Obtiene ÚNICAMENTE los movimientos de un mes específico (ej: septiembre '2026-09').
 * ¡Esto evita leer o transferir todos los gastos históricos del usuario!
 * Path: /users/{userId}/movimientos/{mesKey}/items
 */
export async function getMonthMovementsFromFirestore(userId: string, mesKey: string): Promise<Transaction[]> {
  const collectionPath = `users/${userId}/movimientos/${mesKey}/items`;
  try {
    const q = query(
      collection(db, 'users', userId, 'movimientos', mesKey, 'items'),
      orderBy('fecha', 'desc')
    );
    const snap = await getDocs(q);
    const results: Transaction[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as Transaction);
    });
    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
  }
}

/**
 * Obtiene la lista de meses disponibles (índice ligero sin descargar sus transacciones).
 * Permite al usuario elegir qué mes histórico desea ver sin gastar lecturas en sus ítems.
 * Path: /users/{userId}/movimientos
 */
export async function getAvailableMonthsFromFirestore(userId: string): Promise<{ mesKey: string; nombreMes: string }[]> {
  const collectionPath = `users/${userId}/movimientos`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'movimientos'));
    const months: { mesKey: string; nombreMes: string }[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      months.push({
        mesKey: docSnap.id,
        nombreMes: data.nombreMes || getReadableMonthName(docSnap.id)
      });
    });
    // Ordenar descendente (más recientes primero)
    months.sort((a, b) => b.mesKey.localeCompare(a.mesKey));
    return months;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
  }
}

/**
 * Registro con Correo y Contraseña mediante Firebase Auth
 * Crea la cuenta en Firebase Auth y despacha automáticamente el correo de verificación.
 */
export async function registerWithEmailFirebase(
  email: string, 
  pass: string, 
  name: string,
  lastName?: string
): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const fullName = `${name} ${lastName || ''}`.trim();
  if (fullName) {
    try {
      await updateProfile(userCredential.user, { displayName: fullName });
    } catch (e) {
      console.warn('Could not update displayName:', e);
    }
  }

  // Envía el correo de verificación oficial de Firebase
  try {
    await sendEmailVerification(userCredential.user);
  } catch (err) {
    console.warn('Error sending verification email via Firebase Auth:', err);
  }

  return userCredential.user;
}

/**
 * Reenviar correo de verificación oficial de Firebase
 * Si no hay sesión activa pero se proveen email y pass, recupera la sesión primero.
 */
export async function sendVerificationEmailFirebase(email?: string, pass?: string): Promise<boolean> {
  let user = auth.currentUser;
  if (!user && email && pass) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      user = cred.user;
    } catch (loginErr) {
      console.warn('Could not auto-login to resend verification:', loginErr);
    }
  }

  if (user) {
    await sendEmailVerification(user);
    return true;
  }

  return false;
}

/**
 * Iniciar sesión con Correo y Contraseña mediante Firebase Auth
 */
export async function loginWithEmailFirebase(email: string, pass: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * Recarga y verifica el estado de verificación de correo en Firebase
 */
export async function checkEmailVerifiedFirebase(email?: string, pass?: string): Promise<boolean> {
  let user = auth.currentUser;
  if (!user && email && pass) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      user = cred.user;
    } catch {}
  }
  if (!user) return false;
  try {
    await user.reload();
    return Boolean(user.emailVerified);
  } catch {
    return false;
  }
}

/**
 * Enviar correo de restablecimiento de contraseña mediante Firebase
 */
export async function sendPasswordResetFirebase(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Autenticación con Google
 */
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error in signInWithGoogle:', error);
    throw error;
  }
}

/**
 * Cerrar sesión
 */
export async function logOutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}
