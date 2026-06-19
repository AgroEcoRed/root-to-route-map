import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLayerManager } from "@/hooks/useLayerManager";
import { useDataSources, type DataSourceId } from "@/hooks/useDataSources";
import { toast } from "sonner";
import { Layers, Loader2, ArrowLeft, MapPin, ShoppingBag, Power, Pencil } from "lucide-react";

export default function LayerAdminPage() {
  const { layerId } = useParams<{ layerId: DataSourceId }>();
  const { user, loading: authLoading } = useAuth();
  const { canManage, isAdmin, loading: lmLoading } = useLayerManager();
  const { sources, toggle } = useDataSources();
  const [pending, setPending] = useState(false);

  if (authLoading || lmLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/ingresar" replace />;
  if (!layerId || !canManage(layerId)) return <Navigate to="/" replace />;

  const source = sources.find(s => s.source_id === layerId);
  const label = source?.label || layerId;
  const enabled = source?.enabled ?? true;

  const handleToggle = async (next: boolean) => {
    setPending(true);
    const { error } = await toggle(layerId, next);
    setPending(false);
    if (error) toast.error("No se pudo cambiar el estado: " + error.message);
    else toast.success(`Capa ${next ? "activada" : "desactivada"}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to={isAdmin ? "/admin/capas" : "/mi-perfil"}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Layers className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl">{label}</h1>
          {isAdmin && <Badge variant="outline">Admin global</Badge>}
        </div>
        <p className="text-muted-foreground mb-6">
          Panel de gestión de la capa <code className="px-1 bg-muted rounded text-xs">{layerId}</code>.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-display text-lg flex items-center gap-2">
                  <Power className="h-4 w-4 text-primary" /> Visibilidad pública
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Activá o desactivá esta capa en el mapa y el marketplace para todas las personas.
                </p>
              </div>
              {pending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Switch checked={enabled} onCheckedChange={handleToggle} />}
            </div>
            <p className="text-xs">
              Estado actual: <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Activa" : "Desactivada"}</Badge>
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" /> Vista pública
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Verificá cómo se ve tu capa en este momento.
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/mapa"><MapPin className="h-4 w-4 mr-1" /> Mapa</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/mercado"><ShoppingBag className="h-4 w-4 mr-1" /> Mercado</Link>
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-5 mt-4">
          <h2 className="font-display text-lg flex items-center gap-2 mb-2">
            <Pencil className="h-4 w-4 text-primary" /> Edición de actores y productos
          </h2>
          <p className="text-sm text-muted-foreground">
            Esta capa todavía se sirve desde archivos de datos versionados. Cuando quieras editar
            actores (dirección, días de entrega, verificación), agregar nuevos puntos o gestionar
            productos del marketplace desde esta interfaz, migramos esta capa a la base de datos y
            habilitamos el editor en este mismo panel — sin tocar el resto de las capas.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Mientras tanto, podés solicitar cambios al equipo de AgroEco.Red y los aplicamos en el día.
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}