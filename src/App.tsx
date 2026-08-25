import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './store/AuthContext';
import { AppProvider } from './store/AppContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';

// Auth Page
import { LoginPage } from './features/auth/LoginPage';

// Feature Pages
import { DashboardPage } from './features/dashboard/DashboardPage';
import { UsersPage } from './features/users/UsersPage';
import { BirthdaysPage } from './features/birthdays/BirthdaysPage';
import { SlaughterPage } from './features/slaughter/SlaughterPage';
import { ColdRoomPage } from './features/coldroom/ColdRoomPage';
// import { DeliveryPage } from './features/delivery/DeliveryPage'; // ocultado temporariamente
import { PushPage } from './features/push/PushPage';
import { ChamadosPage } from './features/chamados/ChamadosPage';
import { NewsPage } from './features/news/NewsPage';
import { AuditPage } from './features/audit/AuditPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutos
    },
  },
});

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Header Superior Vermelho com Dados do Perfil Supabase */}
      <AppHeader />

      {/* Conteúdo Principal com Espaço para Navegação Inferior */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24">
        {children}
      </main>

      {/* Navegação Flutuante Inferior com Animação e RBAC */}
      <BottomNav />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />

            <Routes>
              {/* Rota Pública de Login */}
              <Route path="/login" element={<LoginPage />} />

              {/* Rotas Protegidas do Painel Administrativo */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <DashboardPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <UsersPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/birthdays"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <BirthdaysPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/slaughter"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <SlaughterPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coldroom"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <ColdRoomPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              {/* Rota ocultada temporariamente junto com o item do menu em constants.ts
              <Route
                path="/delivery"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <DeliveryPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              */}
              <Route
                path="/push"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <PushPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chamados"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <ChamadosPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/news"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <NewsPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuthenticatedLayout>
                      <AuditPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Fallback de Redirecionamento */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
