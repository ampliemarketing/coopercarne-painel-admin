import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import type { AdminRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#c51d1f] p-2.5 flex items-center justify-center shadow-xl shadow-red-900/20 animate-pulse">
            <img src="/logo.png" alt="COOPERCARNE" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-[#c51d1f]" />
            <span>Validando credenciais do painel...</span>
          </div>
        </div>
      </div>
    );
  }

  // Não autenticado -> Redireciona para /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se a rota exige papéis específicos e o usuário não possui
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-[#c51d1f] mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Acesso Restrito</h2>
        <p className="text-xs text-slate-500 max-w-md mb-6">
          Seu perfil ({role === 'operador_camara' ? 'Operador de Câmara Fria' : role}) não possui permissão para acessar esta seção do painel administrativo.
        </p>
        <a
          href="/"
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-colors"
        >
          Voltar para a Página Inicial
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
