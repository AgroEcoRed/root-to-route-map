import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationPicker from "@/components/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2).max(140),
  actor_type: z.string().min(1),
  description: z.string().trim().max(800).optional(),
  address: z.string().trim().max(200).optional(),
  contact: z.string().trim().max(200).optional(),
  delivery_info: z.string().trim().max(200).optional(),
});

const TYPES: { value: string; label: string }[] = [
  { value: "agroecological_node", label: "Nodo Agroecológico" },
  { value: "producer", label: "Productor/a" },
  { value: "cooperative", label: "Cooperativa" },
  { value: "consumer_node", label: "Nodo de Consumo" },
  { value: "community_garden", label: "Huerta Comunitaria" },
  { value: "seed_bank", label: "Banco de Semillas" },
  { value: "agroecological_fair", label: "Feria Agroecológica" },
  { value: "agroecological_store", label: "Almacén Agroecológico" },
  { value: "composting_center", label: "Centro de Compostaje" },
  { value: "community_org", label: "Organización Comunitaria" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export const AddMapPointDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", actor_type: "agroecological_node", description: "", address: "", contact: "", delivery_info: "" });
  const [submitting, setSubmitting] = useState(false);
  const upd = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!user) { toast.error("Necesitás iniciar sesión"); return; }
    if (lat == null || lng == null) { toast.error("Marcá el punto en el mapa"); return; }
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || "Datos inválidos"); return; }
    setSubmitting(true);
    const { error } = await (supabase as any).from("layer_actors").insert({
      source_id: "user_points",
      name: parsed.data.name,
      actor_type: parsed.data.actor_type,
      description: parsed.data.description || null,
      address: parsed.data.address || null,
      contact: parsed.data.contact || null,
      delivery_days: parsed.data.delivery_info ? [parsed.data.delivery_info] : null,
      lat, lng,
      verified_at: new Date().toISOString(),
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) { toast.error("No se pudo crear: " + error.message); return; }
    toast.success("¡Punto agregado al mapa!");
    setForm({ name: "", actor_type: "agroecological_node", description: "", address: "", contact: "", delivery_info: "" });
    setLat(null); setLng(null);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Agregar punto al mapa
          </DialogTitle>
          <DialogDescription>
            Sumá un nodo, huerta, cooperativa u otro actor que conozcas. Vas a poder editarlo después desde tu perfil.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => upd("name", e.target.value)} maxLength={140} />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.actor_type} onValueChange={(v) => upd("actor_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Dirección (texto)</Label>
            <Input value={form.address} onChange={(e) => upd("address", e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>Ubicación en el mapa *</Label>
            <LocationPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
          </div>
          <div>
            <Label>Día/horario de apertura o entrega</Label>
            <Input value={form.delivery_info} onChange={(e) => upd("delivery_info", e.target.value)} maxLength={200} placeholder="Ej: Jueves 17-20hs" />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={(e) => upd("description", e.target.value)} rows={3} maxLength={800} />
          </div>
          <div>
            <Label>Contacto (público)</Label>
            <Input value={form.contact} onChange={(e) => upd("contact", e.target.value)} maxLength={200} placeholder="WhatsApp, email, etc." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting} className="bg-gradient-hero text-primary-foreground">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
            Publicar punto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMapPointDialog;