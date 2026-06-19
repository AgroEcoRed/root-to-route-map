import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useDataSources } from "@/hooks/useDataSources";
import { Layers, Loader2, Trash2, UserPlus, ExternalLink } from "lucide-react";

interface Assignment {
  id: string;
  user_id: string;
  layer_id: string;
  created_at: string;
}

export default function AdminLayersPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { sources } = useDataSources();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [layerId, setLayerId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("layer_managers")
      .select("id, user_id, layer_id, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("No se pudo cargar la lista: " + error.message);
    setAssignments((data as Assignment[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/ingresar" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const addManager = async () => {
    if (!email.trim() || !layerId) {
      toast.error("Ingresá un email y elegí una capa");
      return;
    }
    setSubmitting(true);
    // Look up user_id by email via profiles? We don't store email in profiles.
    // Use RPC: query auth.users isn't allowed. Use admin route: ask user to paste user UUID instead.
    // Simpler intermediate: accept UUID directly.
    const uuid = email.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
    if (!isUuid) {
      toast.error("Por ahora ingresá el UUID del usuario (lo ves en la tabla user_roles o en su perfil).");
      setSubmitting(false);
      return;
    }
    const { error } = await (supabase as any)
      .from("layer_managers")
      .insert({ user_id: uuid, layer_id: layerId, granted_by: user.id });
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo asignar: " + error.message);
      return;
    }
    toast.success("Gestor asignado");
    setEmail("");
    setLayerId("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any)
      .from("layer_managers").delete().eq("id", id);
    if (error) toast.error("No se pudo eliminar: " + error.message);
    else { toast.success("Permiso revocado"); load(); }
  };

  const labelFor = (id: string) => sources.find(s => s.source_id === id)?.label || id;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl">Administración de capas</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Asigná representantes (por ejemplo, de Rutas Sanas o UTT) para que gestionen
          únicamente su capa del mapa y del marketplace.
        </p>

        <Card className="p-5 mb-8">
          <h2 className="font-display text-lg mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Asignar gestor a una capa
          </h2>
          <div className="grid gap-4 md:grid-cols-[1fr,1fr,auto]">
            <div>
              <Label htmlFor="uid" className="text-xs">UUID del usuario</Label>
              <Input
                id="uid"
                placeholder="ej: 6b1f...-...-...-...-...."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Capa</Label>
              <Select value={layerId} onValueChange={setLayerId}>
                <SelectTrigger><SelectValue placeholder="Elegí una capa" /></SelectTrigger>
                <SelectContent>
                  {sources.map(s => (
                    <SelectItem key={s.source_id} value={s.source_id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addManager} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Asignar"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            El usuario debe haberse registrado en AgroEco.Red antes de asignarle una capa.
            Una vez asignado, accede a su panel desde <code className="px-1 bg-muted rounded">/admin/capas/&lt;capa&gt;</code>.
          </p>
        </Card>

        <h2 className="font-display text-lg mb-3">Asignaciones actuales</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            Todavía no hay gestores de capa asignados.
          </Card>
        ) : (
          <div className="space-y-2">
            {assignments.map(a => (
              <Card key={a.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{labelFor(a.layer_id)}</Badge>
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      {a.user_id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Asignado el {new Date(a.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/admin/capas/${a.layer_id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}