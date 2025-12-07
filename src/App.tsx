import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// IMPORTANTE: Imports de Autenticação
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Auth from "./pages/Auth"; // Sua tela de login

// Imports Públicos
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Layout Administrativo
import { AdminLayout } from "./components/layout/AdminLayout";

// Páginas Administrativas
import Dashboard from "./pages/admin/Dashboard";
import Libraries from "./pages/admin/Libraries";
import Circulation from "./pages/admin/Circulation";
import Catalog from "./pages/admin/Catalog";
import Inventory from "./pages/admin/Inventory";
import Readers from "./pages/admin/Readers";
import Events from "./pages/admin/Events";
import Audit from "./pages/admin/Audit";
import Settings from "./pages/admin/Settings";
import Profile from "./pages/admin/Profile";

const queryClient = new QueryClient();

// --- COMPONENTE GUARDA-COSTAS ---
// Ele verifica se tem usuário logado. Se não tiver, manda pro login.
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Enquanto verifica se tá logado, mostra um carregando simples
    return <div className="flex items-center justify-center h-screen">Carregando sistema...</div>;
  }

  if (!user) {
    // Não tá logado? Tchau! Vai pro login.
    return <Navigate to="/auth" replace />;
  }

  // Tá logado? Pode entrar.
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Envolvemos o site inteiro no AuthProvider para a memória de login funcionar */}
        <AuthProvider>
          <Routes>
            
            {/* ROTA PÚBLICA (Catálogo/Home) - Qualquer um acessa */}
            <Route path="/" element={<Index />} />
            
            {/* ROTA DE LOGIN */}
            <Route path="/auth" element={<Auth />} />
            
            {/* ROTAS ADMINISTRATIVAS (Protegidas) */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="bibliotecas" element={<Libraries />} />
              <Route path="circulacao" element={<Circulation />} />
              <Route path="catalogo" element={<Catalog />} />
              <Route path="acervo" element={<Inventory />} />
              <Route path="leitores" element={<Readers />} />
              <Route path="eventos" element={<Events />} />
              <Route path="auditoria" element={<Audit />} />
              <Route path="configuracoes" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
            
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;