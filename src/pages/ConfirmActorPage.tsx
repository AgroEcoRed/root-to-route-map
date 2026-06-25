import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { DeclareConnectionDialog } from "@/components/actors/DeclareConnectionDialog";
import { Network } from "lucide-react";

interface Actor {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  contact: string | null;
  delivery_days: string[] | null;
  lat: number;
  lng: number;
  source_id: string;
  confirmation_status: string | null;
  confirmed_at: string | null;
}

export default function ConfirmActorPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [actor, setActor] = useState<Actor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<"confirmed" | "rejected" | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await supabase.functions.invoke("confirm-actor", {
        body: { token, action: "get" },
      });
      if (error || !data || (data as any).error) {
        setError("Link inválido o expirado");
      } else {
        const row = data as Actor;
        setActor(row);
        if (row.confirmation_status === "confirmed" || row.confirmation_status === "rejected") {
          setDone(row.confirmation_status as "confirmed" | "rejected");
        }
      }
      setLoading(false);
    })();
  }, [token]);

  const decide = async (decision: "confirmed" | "rejected") => {
    if (!actor || !token) return;
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("confirm-actor", {
      body: {
        token,
        action: "confirm",
        decision,
        name: actor.name,
        description: actor.description,
        address: actor.address,
        contact: actor.contact,
        delivery_days: actor.delivery_days,
        lat: actor.lat,
        lng: actor.lng,
      },
    });
    setSaving(false);
    const errMsg = error?.message || (data as any)?.error;
    if (errMsg) return toast.error("No se pudo guardar: " + errMsg);
    setDone(decision);
    toast.success(decision === "confirmed" ? "¡Gracias por confirmar!" : "Registro marcado como incorrecto");
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
              <p className="text-sm text-muted-foreground mb-4">Pedile a quien te envió este link que genere uno nuevo.</p>
              <Button asChild variant="outline"><Link to="/">Ir al inicio</Link></Button>
            </Card>
          ) : done ? (
            <Card className="p-8 text-center">
              {done === "confirmed" ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
              )}
              <h1 className="font-display text-2xl mb-2">
                {done === "confirmed" ? "¡Información confirmada!" : "Registro marcado como incorrecto"}
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                {done === "confirmed"
                  ? "Tus datos quedaron verificados en el mapa vivo de AgroEco.Red."
                  : "Avisamos al equipo para que revise el registro."}
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline"><Link to="/mapa"><MapPin className="h-4 w-4 mr-1" /> Ver mapa</Link></Button>
                <Button asChild><Link to="/registro">Registrarme en AgroEco.Red</Link></Button>
              </div>
              {done === "confirmed" && (
                <div className="mt-6 pt-6 border-t">
                  <h2 className="font-display text-lg mb-1 flex items-center justify-center gap-2">
                    <Network className="h-4 w-4 text-primary" /> Tejé los vínculos de tu red
                  </h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    ¿Con quiénes trabajás? Sumá vínculos hacia otras experiencias del mapa: se dibujarán como líneas en la red de vínculos.
                  </p>
                  <Button onClick={() => setConnectOpen(true)} className="bg-gradient-hero text-primary-foreground">
                    <Network className="h-4 w-4 mr-1" /> Sumar un vínculo
                  </Button>
                </div>
              )}
            </Card>
          ) : actor ? (
            <Card className="p-6">
              <h1 className="font-display text-2xl mb-1">Confirmá tus datos</h1>
              <p className="text-sm text-muted-foreground mb-5">
                Cargamos este registro a nombre de tu organización en el mapa vivo.
                Revisá la información, corregí lo que haga falta y confirmá si está bien.
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Nombre</Label>
                  <Input value={actor.name || ""} onChange={(e) => setActor({ ...actor, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Dirección</Label>
                  <Input value={actor.address || ""} onChange={(e) => setActor({ ...actor, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Latitud</Label>
                    <Input type="number" step="any" value={actor.lat ?? ""} onChange={(e) => setActor({ ...actor, lat: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="text-xs">Longitud</Label>
                    <Input type="number" step="any" value={actor.lng ?? ""} onChange={(e) => setActor({ ...actor, lng: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Contacto público</Label>
                  <Input value={actor.contact || ""} onChange={(e) => setActor({ ...actor, contact: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Días / horarios</Label>
                  <Input
                    value={(actor.delivery_days || []).join(", ")}
                    onChange={(e) => setActor({ ...actor, delivery_days: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Descripción</Label>
                  <Textarea rows={3} value={actor.description || ""} onChange={(e) => setActor({ ...actor, description: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-6 flex-wrap">
                <Button onClick={() => decide("confirmed")} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Confirmar datos
                </Button>
                <Button variant="outline" onClick={() => decide("rejected")} disabled={saving}>
                  <XCircle className="h-4 w-4 mr-1" /> No corresponde / quitar
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </main>
      <Footer />
      <DeclareConnectionDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        targetActorId={null}
        targetActorName=""
        token={token || null}
      />
    </div>
  );
}