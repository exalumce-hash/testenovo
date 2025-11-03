import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Kits from "./pages/Kits";
import KitsMontados from "./pages/KitsMontados";
import Estoque from "./pages/Estoque";
import Clientes from "./pages/Clientes";
import Orcamentos from "./pages/Orcamentos";
import Vendas from "./pages/Vendas";
import Fornecedores from "./pages/Fornecedores";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Pedidos from "./pages/Pedidos";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Configuracoes from "./pages/Configuracoes";
import CatalogoCliente from "./pages/CatalogoCliente";
import Carrinho from "./pages/Carrinho";
import MeusPedidos from "./pages/MeusPedidos";
import CatalogoPublico from "./pages/CatalogoPublico";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Produtos />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kits"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Kits />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kits-montados"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <KitsMontados />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Estoque />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Clientes />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orcamentos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Orcamentos />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendas"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Vendas />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fornecedores"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Fornecedores />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/financeiro"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Financeiro />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Pedidos />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Relatorios />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Configuracoes />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
