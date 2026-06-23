import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Layers, Sparkles, Users, Loader2, ShieldCheck } from "lucide-react";

const sections = [
  {
    to: "/admin/capas",
    icon: Layers,
    title: "Mapa y capas",
    desc: "Activar/desactivar capas del Mapa Vivo y asignar referentes que gestionen sus propios datos.",
  },
  {
    to: "/admin/hints",
    icon: Sparkles,
    title: "Hints de la IA (Sembra)",
    desc: "Reglas, terminología, ejemplos y conocimiento curado que la IA usa en el registro y en el chat.",
  },
  {
    to: "/admin/usuarios",
    icon: Users,
    title: "Usuarios y roles",
    desc: "Ver usuarios registrados, asignar o revocar el rol de administrador.",
  },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/ingresar" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl">Panel de administración</h1>
        </div>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Configurá las áreas centrales de AgroEco.Red: las capas del Mapa Vivo,
          los hints que orientan a la IA Sembra y los permisos de quienes
          administran la plataforma.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {sections.map((s) => (
            <Link key={s.to} to={s.to} className="block group">
              <Card className="p-6 h-full transition-all hover:shadow-elevated hover:border-primary/40">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary/20 transition-colors">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg mb-1">{s.title}</h2>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}