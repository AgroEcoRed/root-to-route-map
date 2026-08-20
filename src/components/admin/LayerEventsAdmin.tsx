import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, Loader2, Search, Trash2, ExternalLink, MapPin, EyeOff, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface LayerEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  custom_type: string | null;
  starts_at: string;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  approved: boolean;
  focal_name: string | null;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export default function LayerEventsAdmin({ layerId }: { layerId: string }) {
  const [events, setEvents] = useState<LayerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [prov, setProv] = useState<string>("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("events")
      .select("id,title,description,event_type,custom_type,starts_at,location_name,lat,lng,approved,focal_name")
      .eq("layer_id", layerId)
      .order("starts_at", { ascending: true });
    setEvents((data as LayerEvent[]) || []);
    setLoading(false);
  }, [layerId]);

  useEffect(() => { load(); }, [load]);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      const p = (e.location_name || "").split(",").pop()?.trim();
      if (p) set.add(p);
    });
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      const p = (e.location_name || "").split(",").pop()?.trim() || "";
      if (prov && p !== prov) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        (e.location_name || "").toLowerCase().includes(q) ||
        (e.focal_name || "").toLowerCase().includes(q)
      );
    });
  }, [events, search, prov]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const toggleApproved = async (ev: LayerEvent) => {
    const { error } = await (supabase as any)
      .from("events").update({ approved: !ev.approved }).eq("id", ev.id);
    if (error) return toast.error("No se pudo actualizar: " + error.message);
    toast.success(!ev.approved ? "Publicada en el mapa" : "Ocultada del mapa");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta actividad?")) return;
    const { error } = await (supabase as any).from("events").delete().eq("id", id);
    if (error) return toast.error("No se pudo eliminar: " + error.message);
    toast.success("Eliminada");
    load();
  };

  const openEdit = async (id: string) => {
    const { data: token, error } = await (supabase as any).rpc("get_my_event_edit_token", { _event_id: id });
    if (error || !token) return toast.error("No se pudo abrir la edición");
    window.open(`/eventos/editar/${token}`, "_blank");
  };

  const published = events.filter((e) => e.approved).length;
  const located = events.filter((e) => e.lat != null && e.lng != null).length;

  return (
    <Card className="p-5 mt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 className="font-display text-lg flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" /> Actividades de esta capa
          <Badge variant="outline">{events.length}</Badge>
        </h2>
        <Button asChild size="sm" variant="outline">
          <Link to="/mapa"><MapPin className="h-4 w-4 mr-1" /> Ver en el mapa</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          ["Total", events.length],
          ["Publicadas", published],
          ["Con ubicación", located],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-lg bg-muted/60 p-3">
            <p className="text-xl font-display">{v as number}</p>
            <p className="text-[11px] text-muted-foreground">{k as string}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por título, lugar u organización…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={prov}
          onChange={(e) => { setProv(e.target.value); setPage(1); }}
        >
          <option value="">Todas las provincias</option>
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="border rounded-lg divide-y">
          {pageRows.map((e) => (
            <div key={e.id} className="p-3 flex items-start justify-between gap-3 hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{e.title}</span>
                  <Badge variant="outline" className="text-[10px]">{e.custom_type || e.event_type}</Badge>
                  {!e.approved && <Badge variant="secondary" className="text-[10px]">Oculta</Badge>}
                  {e.lat == null && <Badge variant="destructive" className="text-[10px]">Sin ubicación</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {fmt(e.starts_at)} · {e.location_name || "—"}
                </p>
                {e.focal_name && (
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{e.focal_name}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button size="sm" variant="ghost" title="Editar" onClick={() => openEdit(e.id)}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" title={e.approved ? "Ocultar" : "Publicar"} onClick={() => toggleApproved(e)}>
                  {e.approved ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                </Button>
                <Button size="sm" variant="ghost" title="Eliminar" onClick={() => remove(e.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {pageRows.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Todavía no hay actividades en esta capa. Cargalas una por una desde el mapa o con la planilla de abajo.
            </p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-muted-foreground">Página {page} de {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}
    </Card>
  );
}
