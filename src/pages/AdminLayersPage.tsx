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
import { Layers, Loader2, Trash2, UserPlus, ExternalLink, Mail } from "lucide-react";

interface Assignment {
  id: string;
  user_id: string;
  layer_id: string;
  created_at: string;
}
interface Invite {
  id: string;
  email: string;
  layer_id: string;
  accepted_at: string | null;
  created_at: string;
}

export default function AdminLayersPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { sources } = useDataSources();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [layerId, setLayerId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [managerRows, inviteRows] = await Promise.all([
      (supabase as any)
        .from("layer_managers")
        .select("id, user_id, layer_id, created_at")
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("layer_manager_invites")
        .select("id, email, layer_id, accepted_at, created_at")
        .order("created_at", { ascending: false }),
    ]);
    if (managerRows.error) toast.error("No se pudo cargar la lista: " + managerRows.error.message);
    if (inviteRows.error) toast.error("No se pudieron cargar las invitaciones: " + inviteRows.error.message);
    setAssignments((managerRows.data as Assignment[]) || []);
    setInvites((inviteRows.data as Invite[]) || []);
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
    const { data, error } = await supabase.functions.invoke("send-layer-invite", {
      body: { email: email.trim(), layer_id: layerId, origin: window.location.origin },
    });
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo asignar: " + error.message);
      return;
    }
    if ((data as any)?.sent === false && (data as any)?.inviteLink) {
      toast.warning("Invitación creada, pero no se pudo enviar el email automáticamente. Copié el link para enviarlo manualmente.");
      try { await navigator.clipboard.writeText((data as any).inviteLink); } catch { /* noop */ }
    } else {
      toast.success("Invitación enviada");
    }
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
              <Label htmlFor="uid" className="text-xs">Email del gestor/a</Label>
              <Input
                id="uid"
                type="email"
                placeholder="nombre@organizacion.org"
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
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invitar"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            La persona recibirá un email para registrarse o ingresar. Al entrar con ese mismo correo,
            la capa queda asignada automáticamente y puede acceder a <code className="px-1 bg-muted rounded">/admin/capas/&lt;capa&gt;</code>.
          </p>
        </Card>

        <h2 className="font-display text-lg mb-3">Invitaciones enviadas</h2>
        {loading ? null : invites.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm mb-8">
            Todavía no hay invitaciones pendientes.
          </Card>
        ) : (
          <div className="space-y-2 mb-8">
            {invites.map(inv => (
              <Card key={inv.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium truncate">{inv.email}</span>
                    <Badge variant="secondary">{labelFor(inv.layer_id)}</Badge>
                    <Badge variant={inv.accepted_at ? "default" : "outline"}>
                      {inv.accepted_at ? "aceptada" : "pendiente"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enviada el {new Date(inv.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link to={`/admin/capas/${inv.layer_id}`}><ExternalLink className="h-4 w-4" /></Link>
                </Button>
              </Card>
            ))}
          </div>
        )}

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