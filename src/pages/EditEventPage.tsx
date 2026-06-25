import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, CalendarRange } from "lucide-react";
import { toast } from "sonner";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  link: string | null;
  contact: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  focal_name: string | null;
  focal_email: string | null;
  submitted_by_name: string | null;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EditEventPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ev, setEv] = useState<EventRow | null>(null);
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await supabase.functions.invoke("edit-event-by-token", {
        body: { token, action: "get" },
      });
      if (error || !data || (data as any).error) {
        setError("Link inválido o expirado");
      } else {
        const row = data as EventRow;
        setEv(row);
        setStarts(toLocalInput(row.starts_at));
        setEnds(toLocalInput(row.ends_at));
      }
      setLoading(false);
    })();
  }, [token]);

  const save = async () => {
    if (!ev || !token) return;
    setSaving(true);
    const payload = {
      token,
      action: "update",
      title: ev.title,
      description: ev.description,
      starts_at: starts ? new Date(starts).toISOString() : null,
      ends_at: ends ? new Date(ends).toISOString() : (starts ? new Date(starts).toISOString() : null),
      location_name: ev.location_name,
      lat: ev.lat,
      lng: ev.lng,
      link: ev.link,
      contact: ev.contact,
      contact_email: ev.contact_email,
      contact_phone: ev.contact_phone,
      focal_name: ev.focal_name,
      focal_email: ev.focal_email,
    };
    const { data, error } = await supabase.functions.invoke("edit-event-by-token", { body: payload });
    setSaving(false);
    const errMsg = error?.message || (data as any)?.error;
    if (errMsg) return toast.error("No se pudo guardar: " + errMsg);
    toast.success("Cambios guardados — el evento ya se actualizó en el mapa.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <div className="container max-w-2xl">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : error ? (
            <Card className="p-8 text-center">
              <XCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
              <h1 className="font-display text-2xl mb-2">{error}</h1>
              <p className="text-sm text-muted-foreground mb-4">Pedile a quien creó la actividad que te envíe un nuevo link de edición.</p>
              <Button asChild variant="outline"><Link to="/mapa">Ir al mapa</Link></Button>
            </Card>
          ) : ev ? (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <CalendarRange className="h-5 w-5 text-primary" />
                <h1 className="font-display text-2xl">Editar actividad</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                {ev.submitted_by_name ? <><strong>{ev.submitted_by_name}</strong> cargó esta actividad y te designó como punto focal. </> : null}
                Modificá lo que haga falta y guardá; los cambios se reflejan en el mapa al instante.
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input value={ev.title || ""} onChange={(e) => setEv({ ...ev, title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Descripción</Label>
                  <Textarea rows={3} value={ev.description || ""} onChange={(e) => setEv({ ...ev, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Comienza</Label>
                    <Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Finaliza</Label>
                    <Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Lugar</Label>
                  <Input value={ev.location_name || ""} onChange={(e) => setEv({ ...ev, location_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Latitud</Label>
                    <Input type="number" step="any" value={ev.lat ?? ""} onChange={(e) => setEv({ ...ev, lat: e.target.value === "" ? null : parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="text-xs">Longitud</Label>
                    <Input type="number" step="any" value={ev.lng ?? ""} onChange={(e) => setEv({ ...ev, lng: e.target.value === "" ? null : parseFloat(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Email de contacto</Label>
                    <Input value={ev.contact_email || ""} onChange={(e) => setEv({ ...ev, contact_email: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Teléfono</Label>
                    <Input value={ev.contact_phone || ""} onChange={(e) => setEv({ ...ev, contact_phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Link / inscripción</Label>
                  <Input value={ev.link || ""} onChange={(e) => setEv({ ...ev, link: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <Label className="text-xs">Punto focal — nombre</Label>
                    <Input value={ev.focal_name || ""} onChange={(e) => setEv({ ...ev, focal_name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Punto focal — email</Label>
                    <Input value={ev.focal_email || ""} onChange={(e) => setEv({ ...ev, focal_email: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={save} disabled={saving} className="bg-gradient-hero text-primary-foreground">
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Guardar cambios
                </Button>
                <Button asChild variant="outline"><Link to="/mapa">Ver en el mapa</Link></Button>
              </div>
            </Card>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}