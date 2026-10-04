import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config'; // Ajusta la ruta a tu config de Firebase

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  loginWithDemo: () => void;
  registerUser: (email: string, pass: string, name: string) => Promise<void>;
  loginUser?: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    return localStorage.getItem('gastoar_is_demo') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Si hay usuario real autenticado, se desactiva la demo
        setIsDemo(false);
        localStorage.removeItem('gastoar_is_demo');
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerUser = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser = userCredential.user;

    // 1. Asignar el nombre en Firebase Auth
    await updateProfile(newUser, { displayName: name });

    // 2. Guardar el documento del usuario en Firestore
    await setDoc(doc(db, 'users', newUser.uid), {
      uid: newUser.uid,
      displayName: name,
      email: email,
      createdAt: new Date()
    });

    // 3. Crear el documento inicial de resumen en $0 (en lugar de cargar datos demo)
    await setDoc(doc(db, 'resumen', newUser.uid), {
      saldoDisponible: 0,
      presupuestoMensual: 0,
      limiteDiario: 0,
      promedioDiario: 0
    });

    // Forzar la actualización del estado local del usuario con su nombre
    setUser({ ...newUser, displayName: name });
  };

  const loginUser = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    setUser(userCredential.user);
    setIsDemo(false);
    localStorage.removeItem('gastoar_is_demo');
  };

  const loginWithDemo = () => {
    setIsDemo(true);
    localStorage.setItem('gastoar_is_demo', 'true');
  };

  const logout = async () => {
    await signOut(auth);
    setIsDemo(false);
    localStorage.removeItem('gastoar_is_demo');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, registerUser, loginUser, loginWithDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
