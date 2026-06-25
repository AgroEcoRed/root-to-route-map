import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import LocationPicker from "@/components/LocationPicker";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, MapPin, Mail, CheckCircle2 } from "lucide-react";

interface Row {
  id: string;
  name: string;
  lat: number;
  lng: number;
  actor_type: string | null;
  description: string | null;
  address: string | null;
  contact: string | null;
  delivery_days: string[] | null;
  source_id: string;
  confirmation_status: string | null;
  confirmation_token: string | null;
}

export default function MyMapContributions() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("layer_actors")
      .select("id,name,lat,lng,actor_type,description,address,contact,delivery_days,source_id,confirmation_status,confirmation_token")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false });
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) { toast.error("Nombre obligatorio"); return; }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("layer_actors")
      .update({
        name: editing.name,
        lat: editing.lat,
        lng: editing.lng,
        description: editing.description,
        address: editing.address,
        contact: editing.contact,
        delivery_days: editing.delivery_days,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar: " + error.message);
    toast.success("Actualizado");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este punto del mapa?")) return;
    const { error } = await (supabase as any).from("layer_actors").delete().eq("id", id);
    if (error) return toast.error("No se pudo eliminar");
    toast.success("Eliminado");
    load();
  };

  if (!user) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 mb-8">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-display text-xl flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Mis aportes al mapa
        </h2>
        <Badge variant="outline">{rows.length}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Acá podés editar o borrar los puntos que cargaste vos. Si te pidieron <strong>confirmar</strong> un
        registro, también aparece su estado.
      </p>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Todavía no cargaste puntos.</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {rows.map((r) => (
            <div key={r.id} className="p-3 flex items-start justify-between gap-3 hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{r.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{r.source_id}</Badge>
                  {r.confirmation_status === "pending" && (
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">
                      <Mail className="h-3 w-3 mr-1" /> Esperando confirmación
                    </Badge>
                  )}
                  {r.confirmation_status === "confirmed" && (
                    <Badge className="text-[10px] bg-emerald-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.description || r.address || "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{r.lat.toFixed(4)}, {r.lng.toFixed(4)} · {r.actor_type || "—"}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar mi punto</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Dirección</Label>
                <Input value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Ubicación</Label>
                <LocationPicker
                  lat={editing.lat}
                  lng={editing.lng}
                  onChange={(la, ln) => setEditing({ ...editing, lat: la, lng: ln })}
                />
              </div>
              <div>
                <Label className="text-xs">Contacto público</Label>
                <Input value={editing.contact || ""} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Días / horario</Label>
                <Input
                  value={(editing.delivery_days || []).join(", ")}
                  onChange={(e) => setEditing({ ...editing, delivery_days: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
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
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}