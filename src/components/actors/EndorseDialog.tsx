import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  actorId: string | null;
  actorName: string;
  onSubmitted?: () => void;
}

/**
 * Allows a registered user to give a "voto de confianza" to an imported actor.
 * Used while AgroEco.Red admins / layer admins don't yet know the experience first-hand.
 * The note is private (RLS-protected) — only count + last date are public.
 */
export const EndorseDialog = ({ open, onOpenChange, actorId, actorName, onSubmitted }: Props) => {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || !actorId) {
      toast.error("Necesitás iniciar sesión");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("actor_endorsements").insert({
      layer_actor_id: actorId,
      endorser_user_id: user.id,
      endorser_display: (user.user_metadata as any)?.display_name || user.email || null,
      note: note.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      if ((error.message || "").toLowerCase().includes("duplicate")) {
        toast.info("Ya diste tu voto de confianza a esta experiencia.");
      } else {
        toast.error("No pudimos registrar tu voto: " + error.message);
      }
      return;
    }
    toast.success("¡Gracias! Tu voto de confianza fue registrado.");
    setNote("");
    onSubmitted?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Dar voto de confianza</DialogTitle>
          <DialogDescription>
            Estás avalando a <strong>{actorName}</strong> como una experiencia real y confiable
            dentro de la red. Tu voto suma al nivel de verificación visible para todos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>¿Cómo la conocés? (opcional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Ej: trabajamos juntas en la feria de Sáenz, vengo comprando hace 2 años, etc."
          />
          <p className="text-[11px] text-muted-foreground">
            Tu nota la ven sólo los administradores; quienes visitan el mapa ven el conteo de votos
            y la fecha del último.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting || !actorId} className="bg-gradient-hero text-primary-foreground">
            {submitting ? "Enviando..." : "Confirmar voto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};