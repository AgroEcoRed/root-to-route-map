import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles, Loader2, Trash2, ArrowLeft, Plus } from "lucide-react";

type Scope = "registration" | "chatbot" | "both";
interface Hint {
  id: string;
  scope: Scope;
  title: string;
  content: string;
  tags: string[];
  enabled: boolean;
  priority: number;
  updated_at: string;
}

const SCOPE_LABEL: Record<Scope, string> = {
  registration: "Registro",
  chatbot: "Chatbot",
  both: "Ambos",
};

export default function AdminHintsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [hints, setHints] = useState<Hint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Scope | "all">("all");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scope, setScope] = useState<Scope>("both");
  const [tags, setTags] = useState("");
  const [priority, setPriority] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ai_hints")
      .select("id, scope, title, content, tags, enabled, priority, updated_at")
      .order("priority", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) toast.error("No se pudo cargar: " + error.message);
    setHints((data as Hint[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/ingresar" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const add = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Completá título y contenido");
      return;
    }
    setSubmitting(true);
    const tagArr = tags.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await (supabase as any).from("ai_hints").insert({
      title: title.trim(),
      content: content.trim(),
      scope,
      tags: tagArr,
      priority,
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) { toast.error("No se pudo guardar: " + error.message); return; }
    toast.success("Hint agregado");
    setTitle(""); setContent(""); setTags(""); setPriority(0); setScope("both");
    load();
  };

  const toggleEnabled = async (h: Hint) => {
    const { error } = await (supabase as any)
      .from("ai_hints").update({ enabled: !h.enabled }).eq("id", h.id);
    if (error) toast.error("Error: " + error.message);
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este hint?")) return;
    const { error } = await (supabase as any).from("ai_hints").delete().eq("id", id);
    if (error) toast.error("Error: " + error.message);
    else { toast.success("Eliminado"); load(); }
  };

  const visible = filter === "all" ? hints : hints.filter(h => h.scope === filter || h.scope === "both");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl">Hints de la IA (Sembra)</h1>
        </div>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Lista de reglas y conocimiento curado que se inyecta como contexto al
          asistente. Usalo para fijar terminología, tono, ejemplos de buenas
          respuestas, datos de contacto, criterios SPG, etc. Los hints habilitados
          se cargan automáticamente en cada conversación según el ámbito.
        </p>

        <Card className="p-5 mb-8">
          <h2 className="font-display text-lg mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Nuevo hint
          </h2>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="h-title" className="text-xs">Título</Label>
              <Input id="h-title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="ej: Decir 'sistemas alimentarios' (nunca 'cadenas')" />
            </div>
            <div>
              <Label htmlFor="h-content" className="text-xs">Contenido / regla</Label>
              <Textarea id="h-content" rows={4} value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="Escribí la regla, el ejemplo o el dato que la IA debe tener en cuenta." />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Ámbito</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Ambos (registro + chatbot)</SelectItem>
                    <SelectItem value="registration">Solo registro</SelectItem>
                    <SelectItem value="chatbot">Solo chatbot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="h-tags" className="text-xs">Tags (coma separadas)</Label>
                <Input id="h-tags" value={tags} onChange={(e) => setTags(e.target.value)}
                  placeholder="terminologia, spg" />
              </div>
              <div>
                <Label htmlFor="h-prio" className="text-xs">Prioridad</Label>
                <Input id="h-prio" type="number" value={priority}
                  onChange={(e) => setPriority(Number(e.target.value) || 0)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={add} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar hint"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">Hints actuales ({hints.length})</h2>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="registration">Registro</SelectItem>
              <SelectItem value="chatbot">Chatbot</SelectItem>
              <SelectItem value="both">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            Todavía no hay hints. Agregá uno para empezar a guiar a Sembra.
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map(h => (
              <Card key={h.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="secondary">{SCOPE_LABEL[h.scope]}</Badge>
                      {h.priority !== 0 && (
                        <Badge variant="outline">prioridad {h.priority}</Badge>
                      )}
                      {h.tags?.map(t => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                    <h3 className="font-medium">{h.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{h.content}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch checked={h.enabled} onCheckedChange={() => toggleEnabled(h)} />
                      <span className="text-xs text-muted-foreground">{h.enabled ? "activo" : "pausado"}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => remove(h.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}