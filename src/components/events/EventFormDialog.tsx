import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  title: z.string().trim().min(3, "Mínimo 3 caracteres").max(140),
  description: z.string().trim().max(1000).optional(),
  event_type: z.enum(["feria", "intercambio", "formacion", "otro"]),
  starts_at: z.string().min(1, "Requerido"),
  ends_at: z.string().optional(),
  location_name: z.string().trim().max(200).optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  link: z.string().trim().max(300).url("URL inválida").optional().or(z.literal("")),
  contact: z.string().trim().max(200).optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export const EventFormDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const [quick, setQuick] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", event_type: "feria" as const,
    starts_at: "", ends_at: "", location_name: "", lat: "", lng: "", link: "", contact: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!user) {
      toast.error("Necesitás iniciar sesión");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Datos inválidos");
      return;
    }
    setSubmitting(true);
    const payload: any = {
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_type: parsed.data.event_type,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
      location_name: parsed.data.location_name || null,
      lat: parsed.data.lat ? Number(parsed.data.lat) : null,
      lng: parsed.data.lng ? Number(parsed.data.lng) : null,
      link: parsed.data.link || null,
      contact: parsed.data.contact || null,
      source: "user",
      approved: true,
      created_by: user.id,
    };
    const { error } = await (supabase as any).from("events").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo crear: " + error.message);
      return;
    }
    toast.success("¡Actividad publicada! Aparece en el mapa y en la comunidad.");
    setForm({ title: "", description: "", event_type: "feria", starts_at: "", ends_at: "", location_name: "", lat: "", lng: "", link: "", contact: "" });
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Publicar actividad futura</DialogTitle>
          <DialogDescription>
            Feria, intercambio de semillas/saberes, formación. Aparecerá con un marcador brillante en el mapa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <Switch checked={quick} onCheckedChange={setQuick} id="quick" />
          <Label htmlFor="quick" className="cursor-pointer">Formulario rápido (solo lo esencial)</Label>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={140} placeholder="Ej: Feria de intercambio de semillas" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={form.event_type} onValueChange={(v) => update("event_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feria">Feria</SelectItem>
                  <SelectItem value="intercambio">Intercambio</SelectItem>
                  <SelectItem value="formacion">Formación</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cuándo *</Label>
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => update("starts_at", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Lugar (texto)</Label>
            <Input value={form.location_name} onChange={(e) => update("location_name", e.target.value)} maxLength={200} placeholder="Ej: Plaza de Florencio Varela" />
          </div>
          {!quick && (
            <>
              <div>
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} maxLength={1000} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitud</Label>
                  <Input value={form.lat} onChange={(e) => update("lat", e.target.value)} placeholder="-34.61" />
                </div>
                <div>
                  <Label>Longitud</Label>
                  <Input value={form.lng} onChange={(e) => update("lng", e.target.value)} placeholder="-58.44" />
                </div>
              </div>
              <div>
                <Label>Finaliza</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => update("ends_at", e.target.value)} />
              </div>
              <div>
                <Label>Link / inscripción</Label>
                <Input value={form.link} onChange={(e) => update("link", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Contacto (email/whatsapp)</Label>
                <Input value={form.contact} onChange={(e) => update("contact", e.target.value)} maxLength={200} />
              </div>
            </>
          )}
          <p className="text-[11px] text-muted-foreground">
            Tip: para que se vea en el mapa, agregá lat/lng (modo completo). Sin coordenadas, aparece solo en la lista de la comunidad.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting} className="bg-gradient-hero text-primary-foreground">
            {submitting ? "Publicando..." : "Publicar actividad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};