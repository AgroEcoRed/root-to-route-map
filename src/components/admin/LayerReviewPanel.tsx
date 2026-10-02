import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, Check, X } from "lucide-react";
import type { LayerActor } from "@/hooks/useLayerActors";

/** Experiencias que esperan validación del equipo antes de salir al mapa público. */
export default function LayerReviewPanel({ actors, onChanged }: { actors: LayerActor[]; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const pending = actors.filter((a: any) => a.confirmation_status === "pending_review");

  const decide = async (id: string, decision: "approve" | "reject") => {
    setBusyId(id);
    const { error } = await (supabase as any).rpc("review_layer_actor", { _id: id, _decision: decision });
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(decision === "approve" ? "Validada: ya se ve en el mapa público" : "Rechazada: queda solo para el equipo");
    onChanged();
  };

  return (
    <Card className="p-5 mt-4">
      <h2 className="font-display text-lg flex items-center gap-2 mb-1">
        <ShieldCheck className="h-4 w-4 text-primary" /> Para validar
        <Badge variant={pending.length ? "default" : "outline"}>{pending.length}</Badge>
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Si activaste "Revisar antes de publicar", cada experiencia nueva espera acá. Al validarla aparece
        en el mapa público (respetando lo que reservaste); si la rechazás, queda solo para el equipo.
      </p>
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay experiencias esperando validación.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 flex-wrap rounded-xl border border-border p-3">
              <div className="min-w-0 flex-1 text-sm">
                <strong className="block">{a.name}</strong>
                <span className="text-xs text-muted-foreground block">
                  {[a.actor_type, a.family, a.address].filter(Boolean).join(" · ")}
                </span>
                {a.contact && <span className="text-xs text-muted-foreground block">Contacto: {a.contact}</span>}
                <span className="text-xs text-muted-foreground block">{a.lat?.toFixed(5)}, {a.lng?.toFixed(5)}</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" disabled={busyId === a.id} onClick={() => decide(a.id, "approve")}>
                  <Check className="h-4 w-4 mr-1" /> Validar
                </Button>
                <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => decide(a.id, "reject")}>
                  <X className="h-4 w-4 mr-1" /> Rechazar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
