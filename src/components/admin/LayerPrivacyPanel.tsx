import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";

interface Privacy { hide_contact?: boolean; blur_location?: boolean; hide_type?: boolean }

const OPTIONS: { key: keyof Privacy; title: string; desc: string }[] = [
  { key: "hide_contact", title: "Reservar contactos", desc: "Teléfonos, correos y redes sólo los ve el equipo de la capa." },
  { key: "blur_location", title: "Reservar la ubicación exacta", desc: "En el mapa público el punto se muestra aproximado (alrededor de 1 km)." },
  { key: "hide_type", title: "Reservar tipologías", desc: "El tipo y la familia de cada experiencia quedan sólo para la investigación." },
];

/** Decide qué datos de la capa son públicos y cuáles se reservan para el equipo. */
export default function LayerPrivacyPanel({ layerId, onApplied }: { layerId: string; onApplied?: () => void }) {
  const [privacy, setPrivacy] = useState<Privacy>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (supabase as any).from("data_source_settings").select("privacy").eq("source_id", layerId).maybeSingle()
      .then(({ data }: any) => setPrivacy((data?.privacy as Privacy) || {}));
  }, [layerId]);

  const save = async () => {
    setBusy(true);
    const { error } = await (supabase as any).from("data_source_settings").update({ privacy }).eq("source_id", layerId);
    if (!error) {
      const { error: e2 } = await (supabase as any).rpc("apply_layer_privacy", { _layer_id: layerId });
      if (e2) toast.error(e2.message); else { toast.success("Reglas de privacidad aplicadas a toda la capa"); onApplied?.(); }
    } else toast.error(error.message);
    setBusy(false);
  };

  return (
    <Card className="p-5 mt-4">
      <h2 className="font-display text-lg flex items-center gap-2 mb-1">
        <Lock className="h-4 w-4 text-primary" /> Qué se ve en el mapa público
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Los datos completos siempre se guardan para el equipo de la capa. Acá elegís qué se reserva
        para fines de investigación. Para ocultar un punto entero, usá el ojo en la lista.
      </p>
      <div className="space-y-3 mb-4">
        {OPTIONS.map((o) => (
          <label key={o.key} className="flex items-start justify-between gap-4 rounded-xl border border-border p-3">
            <span className="text-sm">
              <strong className="block">{o.title}</strong>
              <span className="text-xs text-muted-foreground">{o.desc}</span>
            </span>
            <Switch checked={!!privacy[o.key]} onCheckedChange={(v) => setPrivacy((p) => ({ ...p, [o.key]: v }))} />
          </label>
        ))}
      </div>
      <Button size="sm" onClick={save} disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Guardar y aplicar
      </Button>
    </Card>
  );
}
