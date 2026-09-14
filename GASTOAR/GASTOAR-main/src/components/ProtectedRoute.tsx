import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RotateCw, ShieldCheck } from 'lucide-react';
import { GastoArHeroBrand } from './GastoArLogo';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  isAuthLoading,
  children,
}) => {
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#130722] via-[#2E0854] to-[#0A0314] flex flex-col items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300">
          <GastoArHeroBrand />
          <div className="flex items-center space-x-2 text-purple-200 text-xs font-semibold bg-purple-950/50 px-4 py-2 rounded-full border border-purple-800/40 backdrop-blur-xs">
            <RotateCw className="w-4 h-4 animate-spin text-[#F95420]" />
            <span>Sincronizando sesión activa con Firebase...</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verificando credenciales protegidas</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirige al inicio de sesión preservando la ubicación original solicitada
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
