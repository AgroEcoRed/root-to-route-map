import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Loader2 } from "lucide-react";
import { readEventVisibility, type EventVisibility } from "@/lib/eventVisibility";

export default function EventVisibilityPanel({ layerId, years }: { layerId: string; years: number[] }) {
  const [privacy, setPrivacy] = useState<Record<string, unknown> | null>(null);
  const [vis, setVis] = useState<EventVisibility | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (supabase as any).from("data_source_settings").select("privacy").eq("source_id", layerId).maybeSingle()
      .then(({ data }: any) => {
        const p = (data?.privacy as Record<string, unknown>) || {};
        setPrivacy(p);
        setVis(readEventVisibility(p));
      });
  }, [layerId]);

  const save = async (next: EventVisibility) => {
    setVis(next);
    setSaving(true);
    const merged = { ...(privacy || {}), events_visibility: next };
    const { error } = await (supabase as any).from("data_source_settings").update({ privacy: merged }).eq("source_id", layerId);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar: " + error.message);
    setPrivacy(merged);
    toast.success("Listo, el mapa ya muestra lo que elegiste");
  };

  if (!vis) return null;
  const modeBtn = (past: "hide" | "show", title: string, desc: string) => (
    <button
      onClick={() => save({ ...vis, past })}
      className={`text-left rounded-lg border p-3 transition ${vis.past === past ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
    >
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </button>
  );

  return (
    <Card className="p-5 mt-4">
      <h2 className="font-display text-lg flex items-center gap-2 mb-1">
        <Eye className="h-4 w-4 text-primary" /> Qué se ve en el mapa público
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </h2>
      <p className="text-xs text-muted-foreground mb-3">Podés cambiarlo cuando quieras. No se borra ninguna actividad.</p>
      <div className="grid sm:grid-cols-2 gap-2 mb-4">
        {modeBtn("hide", "Solo las próximas", "Ideal durante el Mes: las que ya pasaron no aparecen.")}
        {modeBtn("show", "Próximas + historial en gris", "Ideal después del Mes: las pasadas se ven como estrellas grises chiquitas.")}
      </div>
      {vis.past === "show" && years.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2">Años que se muestran:</p>
          <div className="flex gap-2 flex-wrap">
            {years.map((y) => {
              const on = !vis.hidden_years.includes(y);
              return (
                <Button key={y} size="sm" variant={on ? "default" : "outline"}
                  onClick={() => save({ ...vis, hidden_years: on ? [...vis.hidden_years, y] : vis.hidden_years.filter((h) => h !== y) })}>
                  {y} {on ? "· visible" : "· oculto"}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
