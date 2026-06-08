import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instagram, Loader2, MapPin, Download, ExternalLink, Sparkles, AlertCircle } from "lucide-react";

interface ExtractedNode {
  display_name: string;
  actor_type: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  full_address?: string;
  phone?: string | null;
  schedule?: string | null;
  products?: string[];
  instagram?: string | null;
  confidence?: "high" | "medium" | "low";
  lat?: number | null;
  lng?: number | null;
  geocoded_label?: string | null;
}

const toCsv = (nodes: ExtractedNode[]) => {
  const headers = [
    "display_name","actor_type","description","address","city","province","country",
    "phone","schedule","products","instagram","lat","lng","confidence",
  ];
  const rows = nodes.map((n) =>
    headers.map((h) => {
      const v = (n as any)[h];
      const s = Array.isArray(v) ? v.join(" | ") : v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
};

const ImportInstagramPage = () => {
  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<ExtractedNode[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!url.trim() && !pasted.trim()) {
      toast.error("Pegá una URL o el texto del highlight");
      return;
    }
    setLoading(true);
    setErr(null);
    setNodes(null);
    try {
      const { data, error } = await supabase.functions.invoke("import-instagram-stories", {
        body: { url: url.trim(), pastedText: pasted.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setNodes(data.nodes || []);
      if (!data.nodes?.length) {
        toast.warning("No se detectaron nodos con dirección suficiente.");
      } else {
        toast.success(`Se detectaron ${data.nodes.length} nodos`);
      }
    } catch (e: any) {
      setErr(e.message || "Error procesando");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!nodes?.length) return;
    const csv = toCsv(nodes);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nodos-importados.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-3">
              <Sparkles className="h-3 w-3 mr-1" /> Beta · asistido por IA
            </Badge>
            <h1 className="font-display text-4xl mb-2 flex items-center gap-3">
              <Instagram className="h-8 w-8 text-primary" />
              Importar desde historias de Instagram
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Pegá el enlace de una historia destacada pública (por ejemplo
              <code className="text-xs mx-1 px-1.5 py-0.5 bg-muted rounded">
                instagram.com/stories/highlights/…
              </code>
              ) y la plataforma intentará detectar automáticamente los nodos
              agroecológicos mencionados, extraer sus direcciones y geolocalizarlos
              en el mapa.
            </p>
          </div>

          <section className="rounded-2xl border border-border bg-card p-6 space-y-4 mb-8">
            <div>
              <Label htmlFor="ig-url">URL del highlight o perfil público</Label>
              <Input
                id="ig-url"
                placeholder="https://www.instagram.com/stories/highlights/17888592281735840/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ig-text" className="flex items-center gap-2">
                Texto pegado (recomendado)
                <span className="text-xs text-muted-foreground font-normal">
                  — Instagram suele bloquear el acceso automático
                </span>
              </Label>
              <Textarea
                id="ig-text"
                placeholder="Pegá acá el texto/captions de cada historia: nombres de nodos, direcciones, horarios, teléfonos…"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                rows={8}
                className="mt-1"
              />
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Por restricciones de Instagram, lo más confiable es pegar el texto
                de cada slide. La plataforma usa IA para extraer nodos y
                geocodifica las direcciones con OpenStreetMap. Revisá los
                resultados antes de crear los perfiles.
              </span>
            </div>
            <Button onClick={run} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {loading ? "Procesando…" : "Detectar nodos"}
            </Button>
          </section>

          {err && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-6">
              {err}
            </div>
          )}

          {nodes && nodes.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-display text-2xl">
                  {nodes.length} nodo{nodes.length === 1 ? "" : "s"} detectado{nodes.length === 1 ? "" : "s"}
                </h2>
                <Button variant="outline" onClick={download}>
                  <Download className="h-4 w-4 mr-2" /> Descargar CSV
                </Button>
              </div>
              <div className="space-y-3">
                {nodes.map((n, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-lg">{n.display_name}</h3>
                          <Badge variant="outline" className="text-[10px]">{n.actor_type}</Badge>
                          {n.confidence && (
                            <Badge
                              variant={n.confidence === "high" ? "secondary" : "outline"}
                              className="text-[10px]"
                            >
                              {n.confidence}
                            </Badge>
                          )}
                        </div>
                        {n.description && (
                          <p className="text-sm text-muted-foreground mt-1">{n.description}</p>
                        )}
                        <div className="text-sm mt-2 flex items-start gap-1.5">
                          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{n.full_address || n.address}</span>
                        </div>
                        {n.lat != null && n.lng != null ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            Coordenadas: {n.lat.toFixed(5)}, {n.lng.toFixed(5)}
                            {n.geocoded_label && (
                              <span className="opacity-60"> · {n.geocoded_label}</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600 mt-1">
                            No se pudo geocodificar — revisar dirección manualmente.
                          </p>
                        )}
                        {n.schedule && (
                          <p className="text-xs mt-1"><strong>Horario:</strong> {n.schedule}</p>
                        )}
                        {n.phone && (
                          <p className="text-xs mt-1"><strong>Tel:</strong> {n.phone}</p>
                        )}
                        {n.products && n.products.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {n.products.map((p, j) => (
                              <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-muted">{p}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {n.lat != null && n.lng != null && (
                          <a
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                            href={`https://www.openstreetmap.org/?mlat=${n.lat}&mlon=${n.lng}#map=17/${n.lat}/${n.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" /> Ver en mapa
                          </a>
                        )}
                        {n.instagram && (
                          <a
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                            href={n.instagram.startsWith("http") ? n.instagram : `https://instagram.com/${n.instagram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Instagram className="h-3 w-3" /> Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Los datos extraídos quedan en pantalla para tu revisión. Para
                cargarlos al mapa, descargá el CSV y subílo desde el panel de
                administración, o creá cada perfil desde{" "}
                <Link to="/registro-rapido" className="underline">registro rápido</Link>.
              </p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ImportInstagramPage;