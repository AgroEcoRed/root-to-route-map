import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLayerManager } from "@/hooks/useLayerManager";
import { useDataSources, type DataSourceId } from "@/hooks/useDataSources";
import { useLayerActors, type LayerActor } from "@/hooks/useLayerActors";
import { toast } from "sonner";
import { Layers, Loader2, ArrowLeft, MapPin, ShoppingBag, Power, Pencil, Plus, Trash2, CheckCircle2, Search, Send, Copy } from "lucide-react";

const EDITABLE_LAYERS: DataSourceId[] = ["rutas_sanas"];

const emptyDraft = (sourceId: string): Partial<LayerActor> => ({
  source_id: sourceId,
  name: "",
  lat: 0,
  lng: 0,
  actor_type: "consumer_node",
  family: "",
  description: "",
  address: "",
  contact: "",
  delivery_days: [],
});

export default function LayerAdminPage() {
  const { layerId } = useParams<{ layerId: DataSourceId }>();
  const { user, loading: authLoading } = useAuth();
  const { canManage, isAdmin, loading: lmLoading } = useLayerManager();
  const { sources, toggle } = useDataSources();
  const [pending, setPending] = useState(false);
  const editable = !!layerId && EDITABLE_LAYERS.includes(layerId);
  const { actors, loading: actorsLoading, reload } = useLayerActors(editable ? layerId : undefined);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<LayerActor> | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return actors;
    return actors.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.description || "").toLowerCase().includes(q) ||
      (a.address || "").toLowerCase().includes(q)
    );
  }, [actors, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveActor = async () => {
    if (!editing) return;
    if (!editing.name || editing.lat == null || editing.lng == null) {
      toast.error("Nombre, lat y lng son obligatorios");
      return;
    }
    setSaving(true);
    const payload: any = {
      source_id: layerId,
      name: editing.name,
      lat: Number(editing.lat),
      lng: Number(editing.lng),
      actor_type: editing.actor_type || null,
      family: editing.family || null,
      description: editing.description || null,
      address: editing.address || null,
      contact: editing.contact || null,
      delivery_days: editing.delivery_days || null,
    };
    let error;
    if (editing.id) {
      ({ error } = await (supabase as any).from("layer_actors").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await (supabase as any).from("layer_actors").insert(payload));
    }
    setSaving(false);
    if (error) return toast.error("No se pudo guardar: " + error.message);
    toast.success("Guardado");
    setEditing(null);
    reload();
  };

  const removeActor = async (id: string) => {
    if (!confirm("¿Eliminar este actor?")) return;
    const { error } = await (supabase as any).from("layer_actors").delete().eq("id", id);
    if (error) return toast.error("No se pudo eliminar: " + error.message);
    toast.success("Eliminado");
    reload();
  };

  const markVerified = async (id: string) => {
    const { error } = await (supabase as any)
      .from("layer_actors")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error("No se pudo verificar: " + error.message);
    toast.success("Marcado como verificado");
    reload();
  };

  const sendToConfirm = async (actor: LayerActor) => {
    const contact = prompt(
      "Email o teléfono del actor a quien enviar la confirmación (se guarda como referencia):",
      (actor as any).confirmation_email || (actor as any).confirmation_phone || actor.contact || ""
    );
    if (contact === null) return;
    const isEmail = /@/.test(contact);
    const token = crypto.randomUUID();
    const { error } = await (supabase as any)
      .from("layer_actors")
      .update({
        confirmation_token: token,
        confirmation_status: "pending",
        confirmation_sent_at: new Date().toISOString(),
        confirmation_email: isEmail ? contact : null,
        confirmation_phone: isEmail ? null : contact,
      })
      .eq("id", actor.id);
    if (error) return toast.error("No se pudo generar el link: " + error.message);
    const url = `${window.location.origin}/confirmar/${token}`;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    toast.success("Link de confirmación copiado al portapapeles");
    reload();
  };

  const copyConfirmLink = async (token: string) => {
    const url = `${window.location.origin}/confirmar/${token}`;
    try { await navigator.clipboard.writeText(url); toast.success("Link copiado"); }
    catch { toast.error("No se pudo copiar"); }
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
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-display text-lg flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" /> Actores de esta capa
              {editable && <Badge variant="outline">{actors.length}</Badge>}
            </h2>
            {editable && (
              <Button size="sm" onClick={() => setEditing(emptyDraft(layerId))}>
                <Plus className="h-4 w-4 mr-1" /> Agregar actor
              </Button>
            )}
          </div>

          {!editable && (
            <p className="text-sm text-muted-foreground">
              Esta capa todavía se sirve desde archivos versionados. Pedile al equipo de AgroEco.Red
              que la migre a la base para editarla desde acá.
            </p>
          )}

          {editable && (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar por nombre, descripción, dirección…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>

              {actorsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {pageRows.map(a => (
                    <div key={a.id} className="p-3 flex items-start justify-between gap-3 hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{a.name}</span>
                          {a.verified_at ? (
                            <Badge variant="default" className="text-[10px]">Verificado</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Sin verificar</Badge>
                          )}
                          {a.delivery_days && a.delivery_days.length > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              {a.delivery_days.join(", ")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {a.description || a.family || "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {a.lat.toFixed(4)}, {a.lng.toFixed(4)} · {a.actor_type || "—"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!a.verified_at && (
                          <Button size="sm" variant="ghost" onClick={() => markVerified(a.id)} title="Marcar verificado">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        )}
                        {(a as any).confirmation_token && (a as any).confirmation_status === "pending" ? (
                          <Button size="sm" variant="ghost" onClick={() => copyConfirmLink((a as any).confirmation_token)} title="Copiar link de confirmación">
                            <Copy className="h-3.5 w-3.5 text-amber-600" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => sendToConfirm(a)} title="Enviar a confirmar por el actor">
                            <Send className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => removeActor(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pageRows.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">Sin resultados</div>
                  )}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-muted-foreground">Página {page} de {totalPages}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Editar actor" : "Nuevo actor"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Nombre *</Label>
                  <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Latitud *</Label>
                    <Input type="number" step="any" value={editing.lat ?? ""} onChange={(e) => setEditing({ ...editing, lat: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="text-xs">Longitud *</Label>
                    <Input type="number" step="any" value={editing.lng ?? ""} onChange={(e) => setEditing({ ...editing, lng: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Input value={editing.actor_type || ""} onChange={(e) => setEditing({ ...editing, actor_type: e.target.value })} placeholder="consumer_node" />
                  </div>
                  <div>
                    <Label className="text-xs">Familia</Label>
                    <Input value={editing.family || ""} onChange={(e) => setEditing({ ...editing, family: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Dirección</Label>
                  <Input value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Contacto (tel / email / redes)</Label>
                  <Input value={editing.contact || ""} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Días de entrega / apertura (separados por coma)</Label>
                  <Input
                    value={(editing.delivery_days || []).join(", ")}
                    onChange={(e) => setEditing({ ...editing, delivery_days: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    placeholder="Martes, Jueves"
                  />
                </div>
                <div>
                  <Label className="text-xs">Descripción</Label>
                  <Textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={saveActor} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}