import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Loader2, Eye, ShieldCheck } from "lucide-react";
import type { LayerActor } from "@/hooks/useLayerActors";

interface Privacy { hide_contact?: boolean; blur_location?: boolean; hide_type?: boolean; require_review?: boolean }

const OPTIONS: { key: keyof Privacy; title: string; desc: string }[] = [
  { key: "hide_contact", title: "Reservar contactos", desc: "Teléfonos, correos y redes sólo los ve el equipo de la capa." },
  { key: "blur_location", title: "Reservar la ubicación exacta", desc: "En el mapa público el punto se muestra aproximado (alrededor de 1 km)." },
  { key: "hide_type", title: "Reservar tipologías", desc: "El tipo y la familia de cada experiencia quedan sólo para la investigación." },
  { key: "require_review", title: "Revisar antes de publicar", desc: "Las experiencias nuevas no salen al mapa público hasta que el equipo las valide." },
];

interface PublicRow { id: string; lat: number; lng: number; contact: string | null; actor_type: string | null }

/** Decide qué datos son públicos; los datos completos quedan siempre guardados para el equipo. */
export default function LayerPrivacyPanel({ layerId, actors = [], onApplied }: { layerId: string; actors?: LayerActor[]; onApplied?: () => void }) {
  const [privacy, setPrivacy] = useState<Privacy>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(0);
  const [publicRows, setPublicRows] = useState<Map<string, PublicRow>>(new Map());

  const loadStatus = async () => {
    const [{ count }, { data }] = await Promise.all([
      (supabase as any).from("layer_actor_private").select("layer_actor_id", { count: "exact", head: true }).eq("source_id", layerId),
      (supabase as any).from("layer_actors").select("id,lat,lng,contact,actor_type").eq("source_id", layerId).order("updated_at", { ascending: false }).limit(3),
    ]);
    setSaved(count || 0);
    setPublicRows(new Map(((data as PublicRow[]) || []).map((r) => [r.id, r])));
  };

  useEffect(() => {
    (supabase as any).from("data_source_settings").select("privacy").eq("source_id", layerId).maybeSingle()
      .then(({ data }: any) => setPrivacy((data?.privacy as Privacy) || {}));
  }, [layerId]);
  useEffect(() => { loadStatus(); /* eslint-disable-next-line */ }, [layerId, actors]);

  const save = async () => {
    setBusy(true);
    const { error } = await (supabase as any).from("data_source_settings").update({ privacy }).eq("source_id", layerId);
    if (!error) {
      const { error: e2 } = await (supabase as any).rpc("apply_layer_privacy", { _layer_id: layerId });
      if (e2) toast.error(e2.message); else { toast.success("Reglas aplicadas. Los datos completos siguen guardados."); onApplied?.(); }
    } else toast.error(error.message);
    setBusy(false);
  };

  const samples = actors.filter((a) => publicRows.has(a.id)).slice(0, 3);
  const dash = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

  return (
    <Card className="p-5 mt-4">
      <h2 className="font-display text-lg flex items-center gap-2 mb-1">
        <Lock className="h-4 w-4 text-primary" /> Qué se ve en el mapa público
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Los datos completos siempre se guardan para el equipo de la capa y nunca se borran. Acá elegís qué
        se reserva para fines de investigación. Para ocultar un punto entero, usá el ojo en la lista.
      </p>
      <p className="mb-4 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Copia completa guardada de <strong>{saved}</strong> de <strong>{actors.length}</strong> experiencias.
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

      {samples.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2"><Eye className="h-4 w-4" /> Cómo queda aplicado</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr><th className="text-left p-1.5">Experiencia</th><th className="text-left p-1.5">Dato</th><th className="text-left p-1.5">Equipo</th><th className="text-left p-1.5">Público</th></tr>
              </thead>
              <tbody>
                {samples.flatMap((a) => {
                  const pub = publicRows.get(a.id)!;
                  return [
                    ["Contacto", dash(a.contact), dash(pub.contact)],
                    ["Ubicación", `${a.lat}, ${a.lng}`, `${pub.lat}, ${pub.lng}`],
                    ["Tipología", dash(a.actor_type), dash(pub.actor_type)],
                  ].map(([k, team, pubV], i) => (
                    <tr key={a.id + k} className="border-t border-border">
                      <td className="p-1.5 font-medium">{i === 0 ? a.name : ""}</td>
                      <td className="p-1.5">{k}</td>
                      <td className="p-1.5">{team}</td>
                      <td className="p-1.5 text-muted-foreground">{pubV}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
