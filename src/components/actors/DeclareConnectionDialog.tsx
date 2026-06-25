import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";

type ConnType = "proveedor" | "comprador" | "colaboracion" | "spg" | "intercambio" | "red" | "otro";

const TYPE_LABELS: Record<ConnType, string> = {
  proveedor: "Le proveo / le vendo",
  comprador: "Le compro",
  colaboracion: "Colaboramos",
  spg: "SPG / certificación participativa",
  intercambio: "Intercambio (semillas, saberes…)",
  red: "Pertenecemos a la misma red",
  otro: "Otro vínculo",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** The actor the connection is declared TOWARDS (popup target). */
  targetActorId: string | null;
  targetActorName: string;
  /**
   * If provided, declare-via-token flow (no login required): the actor
   * proves authority via their own confirmation_token.
   */
  token?: string | null;
  onSubmitted?: () => void;
}

/**
 * Two modes:
 * - Logged-in user → inserts into actor_connections with their own profile as source.
 * - Token holder (ConfirmActorPage) → picks a target layer_actor and weaves
 *   a connection from their own actor row via declare-actor-connection edge fn.
 * Only the target-search variant differs; props are the same for both.
 */
export const DeclareConnectionDialog = ({ open, onOpenChange, targetActorId, targetActorName, token, onSubmitted }: Props) => {
  const { user } = useAuth();
  const tokenMode = !!token;

  const [ctype, setCtype] = useState<ConnType>("colaboracion");
  const [note, setNote] = useState("");
  const [strength, setStrength] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);

  // Token mode: search a target inside the dialog.
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; name: string; type: string | null }>>([]);
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setCtype("colaboracion"); setNote(""); setStrength(3);
      setSearch(""); setResults([]); setPicked(null);
    }
  }, [open]);

  // Search layer_actors when in token mode.
  useEffect(() => {
    if (!tokenMode) return;
    const t = search.trim();
    if (t.length < 2) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(async () => {
      const { data } = await (supabase as any)
        .from("layer_actors")
        .select("id, name, type")
        .ilike("name", `%${t}%`)
        .limit(12);
      if (!cancelled) {
        setResults((data || []) as any);
        setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [search, tokenMode]);

  const effectiveTarget = tokenMode ? picked : (targetActorId ? { id: targetActorId, name: targetActorName } : null);

  const heading = useMemo(() => {
    if (tokenMode) return "Tejer un vínculo en la red";
    return `Declarar vínculo con ${targetActorName}`;
  }, [tokenMode, targetActorName]);

  const submit = async () => {
    if (!effectiveTarget) { toast.error("Elegí con quién querés vincularte"); return; }
    setSubmitting(true);
    try {
      if (tokenMode) {
        const { data, error } = await supabase.functions.invoke("declare-actor-connection", {
          body: {
            token,
            target_layer_actor_id: effectiveTarget.id,
            connection_type: ctype,
            note: note.trim() || null,
            strength,
          },
        });
        const err = error?.message || (data as any)?.error;
        if (err) throw new Error(err);
      } else {
        if (!user) throw new Error("Necesitás iniciar sesión");
        // Find the caller's own profile id
        const { data: prof, error: pErr } = await (supabase as any)
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (pErr || !prof?.id) throw new Error("Aún no tenés un perfil público. Completá el registro primero.");
        const { error } = await (supabase as any).from("actor_connections").insert({
          source_profile_id: prof.id,
          target_layer_actor_id: effectiveTarget.id,
          connection_type: ctype,
          note: note.trim() || null,
          strength,
          declared: true,
          created_by: user.id,
        });
        if (error) throw error;
      }
      toast.success("¡Gracias! El vínculo quedó registrado en la red.");
      setNote("");
      onSubmitted?.();
      onOpenChange(false);
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      if (msg.toLowerCase().includes("duplicate")) toast.info("Ese vínculo ya existe.");
      else toast.error("No pudimos registrar el vínculo: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{heading}</DialogTitle>
          <DialogDescription>
            {tokenMode
              ? "Sumá un vínculo desde tu organización hacia otra experiencia del mapa. Aparecerá como una línea en la red de vínculos."
              : "Estás declarando un vínculo desde tu perfil hacia esta experiencia. Se dibujará como una línea en la red de vínculos del mapa."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {tokenMode && (
            <div>
              <Label className="text-xs">Buscar a quién querés vincular</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Nombre de la organización, feria, cooperativa…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPicked(null); }}
                />
              </div>
              {searching ? (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> buscando…</div>
              ) : picked ? (
                <div className="mt-2 text-xs bg-primary/5 border border-primary/20 rounded px-2 py-1.5">
                  Vinculando con <strong>{picked.name}</strong>{" "}
                  <button className="underline ml-2" onClick={() => setPicked(null)}>cambiar</button>
                </div>
              ) : results.length > 0 ? (
                <div className="mt-2 max-h-40 overflow-y-auto rounded border divide-y">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setPicked({ id: r.id, name: r.name })}
                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted"
                    >
                      <span className="font-medium">{r.name}</span>
                      {r.type ? <span className="text-muted-foreground"> · {r.type}</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div>
            <Label className="text-xs">Tipo de vínculo</Label>
            <Select value={ctype} onValueChange={(v) => setCtype(v as ConnType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABELS) as ConnType[]).map((k) => (
                  <SelectItem key={k} value={k}>{TYPE_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Intensidad (1 a 5)</Label>
            <Input type="number" min={1} max={5} value={strength} onChange={(e) => setStrength(Math.max(1, Math.min(5, parseInt(e.target.value) || 3)))} />
            <p className="text-[10px] text-muted-foreground mt-1">Más fuerte = línea más visible en la red.</p>
          </div>

          <div>
            <Label className="text-xs">Nota (opcional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Ej: compartimos espacio en la feria de Sáenz, intercambiamos semillas hace 2 años…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting || !effectiveTarget} className="bg-gradient-hero text-primary-foreground">
            {submitting ? "Guardando…" : "Tejer vínculo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};