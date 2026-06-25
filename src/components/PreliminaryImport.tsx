import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Link as LinkIcon, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PreliminaryImport {
  id: string;
  source_type: "file" | "link";
  url: string | null;
  file_path: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface Props {
  /** When set we render a compact in-form variant that just collects a single
   *  draft (link / file / notes) without persisting until parent calls submit.
   *  Used in the registration flow before the user account exists. */
  draftMode?: boolean;
  draft?: { url: string; notes: string; file: File | null };
  onDraftChange?: (d: { url: string; notes: string; file: File | null }) => void;
}

/** Section that lets a logged-in user attach a preliminary list of nodes
 *  (file or link) for the platform team to verify together.
 *  Used inside /perfil. Also has a "draftMode" used during registration. */
export const PreliminaryImport = ({ draftMode = false, draft, onDraftChange }: Props) => {
  const [items, setItems] = useState<PreliminaryImport[]>([]);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (draftMode) return;
    const { data } = await (supabase as any)
      .from("preliminary_imports")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as PreliminaryImport[]) || []);
  };
  useEffect(() => { load(); }, [draftMode]);

  const submitLink = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Necesitás iniciar sesión"); setSubmitting(false); return; }
    const { error } = await (supabase as any)
      .from("preliminary_imports")
      .insert({ user_id: user.id, source_type: "link", url: url.trim(), notes: notes.trim() || null });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Listado preliminar registrado. Lo verificamos juntos.");
    setUrl(""); setNotes("");
    load();
  };

  const submitFile = async (file: File) => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Necesitás iniciar sesión"); setSubmitting(false); return; }
    const path = `${user.id}/preliminary/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("producer-media").upload(path, file, { upsert: false });
    if (upErr) { setSubmitting(false); toast.error(upErr.message); return; }
    const { error } = await (supabase as any)
      .from("preliminary_imports")
      .insert({ user_id: user.id, source_type: "file", file_path: path, notes: notes.trim() || null });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Archivo recibido. Lo verificamos juntos.");
    setNotes("");
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este envío preliminar?")) return;
    await (supabase as any).from("preliminary_imports").delete().eq("id", id);
    load();
  };

  if (draftMode && draft && onDraftChange) {
    return (
      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-primary mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">¿Tenés un listado de nodos / actores para sumar?</p>
            <p className="text-muted-foreground">
              Pegá un link (Google Sheet, Drive, Maps) o adjuntá un archivo (CSV, PDF, imagen).
              Lo verificamos juntos después de tu registro. Opcional.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <LinkIcon className="h-4 w-4 mt-2.5 text-muted-foreground" />
          <Input
            value={draft.url}
            onChange={(e) => onDraftChange({ ...draft, url: e.target.value })}
            placeholder="https://docs.google.com/..."
            className="text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv,.pdf,.xls,.xlsx,image/*,.txt,.kml,.json"
            onChange={(e) => onDraftChange({ ...draft, file: e.target.files?.[0] || null })}
            className="text-xs file:mr-2 file:px-2 file:py-1 file:rounded file:border file:border-border file:bg-white file:text-xs"
          />
          {draft.file && <span className="text-xs text-muted-foreground truncate">{draft.file.name}</span>}
        </div>
        <Textarea
          value={draft.notes}
          onChange={(e) => onDraftChange({ ...draft, notes: e.target.value })}
          placeholder="Notas opcionales (qué incluye, criterios, etc.)"
          rows={2}
          className="text-sm"
        />
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl mb-1 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" /> Importar listado preliminar
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Si tenés un listado de nodos o actores para sumar al mapa (Google Sheet, PDF, CSV, imagen, Google Maps…),
        compartilo acá y lo verificamos juntos antes de publicarlo.
      </p>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Link (Google Sheet, Drive, Maps, etc.)</Label>
          <div className="flex gap-2 mt-1">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            <Button onClick={submitLink} disabled={submitting || !url.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">Enviar link</span>
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs">…o archivo (CSV, PDF, imagen, etc.)</Label>
          <div className="flex gap-2 mt-1 items-center">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.pdf,.xls,.xlsx,image/*,.txt,.kml,.json"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) submitFile(f); }}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Adjuntar archivo
            </Button>
          </div>
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas opcionales (qué incluye, contacto del autor del listado, criterios…)"
          rows={2}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Tus envíos</h3>
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 text-sm border border-border rounded-lg p-2.5 bg-white/60">
                {it.source_type === "link" ? <LinkIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    {it.source_type === "link"
                      ? <a href={it.url || "#"} target="_blank" rel="noopener noreferrer" className="text-primary underline">{it.url}</a>
                      : it.file_path?.split("/").pop()}
                  </p>
                  {it.notes && <p className="text-xs text-muted-foreground truncate">{it.notes}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(it.created_at).toLocaleString("es-AR")} · {it.status}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(it.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default PreliminaryImport;