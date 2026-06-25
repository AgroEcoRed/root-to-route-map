import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import Index from "./pages/Index";
import MapPage from "./pages/MapPage";
import MarketplacePage from "./pages/MarketplacePage";
import ActorsPage from "./pages/ActorsPage";
import RegistrationPage from "./pages/RegistrationPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CommunityPage from "./pages/CommunityPage";
import ServicesPage from "./pages/ServicesPage";
import LibraryPage from "./pages/LibraryPage";
import ProgramsPage from "./pages/ProgramsPage";
import TransitionPage from "./pages/TransitionPage";
import MiPerfilPage from "./pages/MiPerfilPage";
import QuickRegistrationPage from "./pages/QuickRegistrationPage";
import LicensesPage from "./pages/LicensesPage";
import ImportInstagramPage from "./pages/ImportInstagramPage";
import AdminLayersPage from "./pages/AdminLayersPage";
import LayerAdminPage from "./pages/LayerAdminPage";
import AdminPage from "./pages/AdminPage";
import AdminHintsPage from "./pages/AdminHintsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ObservatorioPage from "./pages/ObservatorioPage";
import ConfirmActorPage from "./pages/ConfirmActorPage";
import EditEventPage from "./pages/EditEventPage";
import ChatAsistente from "./components/chat/ChatAsistente";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <CartProvider>
          <AuthProvider>
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/mapa" element={<MapPage />} />
              <Route path="/mercado" element={<MarketplacePage />} />
              {/* Alias: Marketplace -> Mercado Agroecológico */}
              <Route path="/marketplace" element={<Navigate to="/mercado" replace />} />
              <Route path="/actores" element={<ActorsPage />} />
              <Route path="/comunidad" element={<CommunityPage />} />
              {/* Garantías Participativas (SPG) — por ahora reusa CommunityPage hasta tener página dedicada */}
              <Route path="/garantias" element={<CommunityPage />} />
              <Route path="/spg" element={<Navigate to="/garantias" replace />} />
              {/* Recursos Compartidos (ex Servicios) */}
              <Route path="/recursos" element={<ServicesPage />} />
              <Route path="/servicios" element={<ServicesPage />} />
              {/* Observatorio Agroecológico */}
              <Route path="/observatorio" element={<ObservatorioPage />} />
              <Route path="/biblioteca" element={<LibraryPage />} />
              <Route path="/programas" element={<ProgramsPage />} />
              <Route path="/transicion" element={<TransitionPage />} />
              <Route path="/mi-perfil" element={<MiPerfilPage />} />
              <Route path="/registro" element={<RegistrationPage />} />
              <Route path="/registro-rapido" element={<QuickRegistrationPage />} />
              <Route path="/ingresar" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/licencias" element={<LicensesPage />} />
              <Route path="/importar/instagram" element={<ImportInstagramPage />} />
              <Route path="/admin/capas" element={<AdminLayersPage />} />
              <Route path="/admin/capas/:layerId" element={<LayerAdminPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/hints" element={<AdminHintsPage />} />
              <Route path="/admin/usuarios" element={<AdminUsersPage />} />
              <Route path="/confirmar/:token" element={<ConfirmActorPage />} />
              <Route path="/eventos/editar/:token" element={<EditEventPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatAsistente />
          </AuthProvider>
          </CartProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
