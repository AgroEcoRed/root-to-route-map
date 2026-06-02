import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
              <Route path="/actores" element={<ActorsPage />} />
              <Route path="/comunidad" element={<CommunityPage />} />
              <Route path="/servicios" element={<ServicesPage />} />
              <Route path="/biblioteca" element={<LibraryPage />} />
              <Route path="/programas" element={<ProgramsPage />} />
              <Route path="/transicion" element={<TransitionPage />} />
              <Route path="/mi-perfil" element={<MiPerfilPage />} />
              <Route path="/registro" element={<RegistrationPage />} />
              <Route path="/ingresar" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
          </CartProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
