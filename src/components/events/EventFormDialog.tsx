import { useRef, useState } from "react";
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
import { Sparkles, Upload, Loader2, Image as ImageIcon } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(3, "Mínimo 3 caracteres").max(140),
  description: z.string().trim().max(1000).optional(),
  event_type: z.enum([
    "feria",
    "intercambio",
    "formacion",
    "conferencia_jornada",
    "taller",
    "encuentro",
    "voluntariado",
    "otro",
  ]),
  custom_type: z.string().trim().max(60).optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  location_name: z.string().trim().max(200).optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  link: z.string().trim().max(300).url("URL inválida").optional().or(z.literal("")),
  contact: z.string().trim().max(200).optional(),
  // Otros contactos: lista libre de emails separados por espacios, comas o ;
  contact_email: z.string().trim().max(600).optional(),
  contact_phone: z.string().trim().max(40).optional(),
  extra_organizer_names: z.string().trim().max(400).optional(),
  focal_name: z.string().trim().max(200).optional(),
  focal_email: z.string().trim().email("Email del punto focal inválido").optional().or(z.literal("")),
  submitted_by_name: z.string().trim().max(200).optional(),
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
  const [parsing, setParsing] = useState(false);
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "", description: "", event_type: "feria" as
      | "feria" | "intercambio" | "formacion" | "conferencia_jornada"
      | "taller" | "encuentro" | "voluntariado" | "otro",
    custom_type: "",
    starts_at: "", ends_at: "", location_name: "", lat: "", lng: "", link: "", contact: "",
    contact_email: "", contact_phone: "", extra_organizer_names: "",
    focal_name: "", focal_email: "", submitted_by_name: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const onPickFlyer = async (file: File) => {
    setFlyerFile(file);
    setFlyerPreview(URL.createObjectURL(file));
    if (!user) { toast.info("Iniciá sesión para auto-completar desde el flyer."); return; }
    setParsing(true);
    try {
      // Convert to base64
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = ""; for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      const { data, error } = await supabase.functions.invoke("parse-flyer", {
        body: { imageBase64: b64, mime: file.type || "image/jpeg" },
      });
      if (error) throw error;
      const p = (data || {}) as any;
      setForm((f) => ({
        ...f,
        title: f.title || p.title || "",
        description: f.description || p.description || "",
        starts_at: f.starts_at || (p.starts_at ? toLocalInput(p.starts_at) : ""),
        ends_at: f.ends_at || (p.ends_at ? toLocalInput(p.ends_at) : ""),
        location_name: f.location_name || p.location_name || "",
        contact_email: f.contact_email || p.contact_email || "",
        contact_phone: f.contact_phone || p.contact_phone || "",
        extra_organizer_names: f.extra_organizer_names || (Array.isArray(p.organizers) ? p.organizers.join(", ") : ""),
      }));
      setQuick(false);
      toast.success("Datos sugeridos a partir del flyer. Revisalos antes de publicar.");
    } catch (e: any) {
      toast.error("No pudimos leer el flyer: " + (e?.message || e));
    } finally {
      setParsing(false);
    }
  };

  const toLocalInput = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ""; }
  };

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
    // If user gave a location_name but no lat/lng, try to geocode via Nominatim
    // (free, no key). This is what makes the activity appear as a glowing star
    // on the map instead of falling into "sin fecha/lugar".
    let geocodedLat = parsed.data.lat ? Number(parsed.data.lat) : null;
    let geocodedLng = parsed.data.lng ? Number(parsed.data.lng) : null;
    if ((geocodedLat == null || geocodedLng == null) && parsed.data.location_name) {
      // Build a list of progressively simpler queries. Helps cases like
      // "Crámer entre Virrey Avilés y Virrey Olaguer y Feliú" donde la
      // primera consulta literal falla pero "Cramer y Virrey Avilés" sí
      // resuelve.
      const raw = parsed.data.location_name.trim();
      const queries: string[] = [raw];
      const m = raw.match(/^([^,]+?)\s+(?:entre|y|esquina|esq\.?|&)\s+([^,]+?)(?:\s+y\s+.+)?(?:,\s*(.+))?$/i);
      if (m) {
        const main = m[1].trim();
        const cross = m[2].trim();
        const place = (m[3] || "Buenos Aires").trim();
        queries.push(`${main} y ${cross}, ${place}`);
        queries.push(`${main} ${cross}, ${place}`);
        queries.push(`${cross}, ${place}`);
        queries.push(`${main}, ${place}`);
      }
      for (const q of queries) {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(q)}`,
            { headers: { "Accept-Language": "es" } }
          );
          const arr = (await r.json()) as Array<{ lat: string; lon: string }>;
          if (arr?.[0]) {
            geocodedLat = Number(arr[0].lat);
            geocodedLng = Number(arr[0].lon);
            break;
          }
        } catch { /* try next */ }
      }
    }
    // Autocomplete end date with start date if missing — supports single-day events
    // and lets the map "glow" use a definite end. If the flyer/user provided a real range,
    // we keep it as-is.
    const effectiveEnds =
      parsed.data.ends_at && parsed.data.ends_at.trim().length > 0
        ? parsed.data.ends_at
        : parsed.data.starts_at;
    setSubmitting(true);

    // Upload flyer if present
    let flyer_url: string | null = null;
    if (flyerFile) {
      const path = `${user.id}/${Date.now()}_${flyerFile.name}`;
      const { error: upErr } = await supabase.storage.from("event-flyers").upload(path, flyerFile, { upsert: false });
      if (upErr) {
        setSubmitting(false);
        toast.error("No se pudo subir el flyer: " + upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from("event-flyers").getPublicUrl(path);
      flyer_url = pub.publicUrl;
    }

    const extraOrgs = (parsed.data.extra_organizer_names || "")
      .split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);

    const payload: any = {
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_type: parsed.data.event_type,
      custom_type:
        parsed.data.event_type === "otro" && parsed.data.custom_type
          ? parsed.data.custom_type.trim()
          : null,
      starts_at: parsed.data.starts_at ? new Date(parsed.data.starts_at).toISOString() : null,
      ends_at: effectiveEnds ? new Date(effectiveEnds).toISOString() : null,
      location_name: parsed.data.location_name || null,
      lat: geocodedLat,
      lng: geocodedLng,
      link: parsed.data.link || null,
      contact: parsed.data.contact || null,
      contact_email: parsed.data.contact_email
        ? parsed.data.contact_email
            .split(/[\s,;]+/)
            .map((s) => s.trim())
            .filter((s) => /.+@.+\..+/.test(s))
            .join(", ") || null
        : null,
      contact_phone: parsed.data.contact_phone || null,
      extra_organizer_names: extraOrgs,
      flyer_url,
      source: "user",
      approved: true,
      created_by: user.id,
      focal_name: parsed.data.focal_name || null,
      focal_email: parsed.data.focal_email || null,
      submitted_by_name:
        parsed.data.submitted_by_name ||
        (user.user_metadata as any)?.display_name ||
        user.email ||
        null,
    };
    const { data: inserted, error } = await (supabase as any)
      .from("events")
      .insert(payload)
      .select("id, edit_token")
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo crear: " + error.message);
      return;
    }
    // Notify focal point (and surface the edit link) — non-blocking.
    const editLink = inserted?.edit_token
      ? `${window.location.origin}/eventos/editar/${inserted.edit_token}`
      : null;
    if (inserted?.id) {
      supabase.functions
        .invoke("notify-event-created", {
          body: { event_id: inserted.id, origin: window.location.origin },
        })
        .catch(() => {});
    }
    if (editLink) {
      toast.success("¡Actividad publicada! Link de edición copiado al portapapeles.", {
        duration: 8000,
        action: { label: "Abrir", onClick: () => window.open(editLink, "_blank") },
      });
      try { await navigator.clipboard.writeText(editLink); } catch { /* noop */ }
    } else {
      toast.success(
        payload.starts_at && payload.lat && payload.lng
          ? "¡Actividad publicada! Aparece como punto brillante en el mapa."
          : "¡Actividad publicada! Aparece en la barra lateral de actividades."
      );
    }
    setForm({ title: "", description: "", event_type: "feria", custom_type: "", starts_at: "", ends_at: "", location_name: "", lat: "", lng: "", link: "", contact: "", contact_email: "", contact_phone: "", extra_organizer_names: "", focal_name: "", focal_email: "", submitted_by_name: "" });
    setFlyerFile(null); setFlyerPreview(null);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Publicar actividad futura</DialogTitle>
          <DialogDescription>
            Feria, intercambio de semillas/saberes, formación. Subí el flyer y completamos los datos juntos.
            Si tiene fecha y lugar, aparecerá como un punto brillante en el mapa que se intensifica al acercarse la fecha.
            Si no, aparecerá en la barra de actividades.
          </DialogDescription>
        </DialogHeader>

        {/* Flyer upload + AI parse */}
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-20 h-20 rounded-md bg-white border border-border flex items-center justify-center overflow-hidden">
              {flyerPreview ? (
                <img src={flyerPreview} alt="Flyer" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 text-xs">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Subí un flyer y autocompletamos
              </p>
              <p className="text-muted-foreground mb-2">Detectamos título, fecha, lugar, contacto y co-organizadores.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFlyer(f); }}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={parsing}>
                {parsing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                {parsing ? "Analizando..." : (flyerFile ? "Cambiar flyer" : "Adjuntar flyer")}
              </Button>
            </div>
          </div>
        </div>

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
              <Select value={form.event_type} onValueChange={(v) => update("event_type", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feria">Feria</SelectItem>
                  <SelectItem value="intercambio">Intercambio (semillas, saberes)</SelectItem>
                  <SelectItem value="formacion">Formación / curso</SelectItem>
                  <SelectItem value="taller">Taller</SelectItem>
                  <SelectItem value="conferencia_jornada">Conferencia, charla o jornada</SelectItem>
                  <SelectItem value="encuentro">Encuentro / asamblea</SelectItem>
                  <SelectItem value="voluntariado">Voluntariado / trabajo colectivo</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              {form.event_type === "otro" && (
                <Input
                  className="mt-2"
                  value={form.custom_type}
                  onChange={(e) => update("custom_type", e.target.value)}
                  maxLength={60}
                  placeholder="Decinos qué tipo (ej: cine debate, festival…)"
                />
              )}
            </div>
            <div>
              <Label>Cuándo</Label>
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => update("starts_at", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Lugar (texto)</Label>
            <Input value={form.location_name} onChange={(e) => update("location_name", e.target.value)} maxLength={200} placeholder="Ej: Plaza de Florencio Varela" />
          </div>
          <div>
            <Label>Otros contactos (mails)</Label>
            <Input
              value={form.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              placeholder="otro@correo.com  tercero@correo.com"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Separá varios mails con espacios, comas o punto y coma. Todos reciben copia.
            </p>
          </div>
          <div>
            <Label>Contacto teléfono</Label>
            <Input value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} placeholder="+54 9 11 ..." />
          </div>
          <div>
            <Label>Co-organizan (separados por coma)</Label>
            <Input
              value={form.extra_organizer_names}
              onChange={(e) => update("extra_organizer_names", e.target.value)}
              placeholder="Ej: NAT San Martín, UTT, Municipio…"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Cada organización mencionada genera una línea en la red de vínculos.</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground">Punto focal de la actividad</p>
            <p className="text-[11px] text-muted-foreground -mt-2">
              Quien aparezca acá recibirá un mail con el link privado para revisar y modificar los datos.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nombre del punto focal</Label>
                <Input value={form.focal_name} onChange={(e) => update("focal_name", e.target.value)} placeholder="Ej: María Pérez" />
              </div>
              <div>
                <Label className="text-xs">Email del punto focal</Label>
                <Input value={form.focal_email} onChange={(e) => update("focal_email", e.target.value)} placeholder="focal@correo.com" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Quién carga la actividad</Label>
              <Input
                value={form.submitted_by_name}
                onChange={(e) => update("submitted_by_name", e.target.value)}
                placeholder={`Tu nombre (default: ${(user?.user_metadata as any)?.display_name || user?.email || "tu cuenta"})`}
              />
            </div>
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
                <Label>Otro contacto (texto libre)</Label>
                <Input value={form.contact} onChange={(e) => update("contact", e.target.value)} maxLength={200} />
              </div>
            </>
          )}
          <p className="text-[11px] text-muted-foreground">
            Tip: con fecha + lat/lng el punto brilla cada vez más fuerte al acercarse el día. Sin fecha o lugar, aparece en la barra de actividades.
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