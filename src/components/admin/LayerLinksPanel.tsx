import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Trash2, Users } from "lucide-react";
import type { LayerActor } from "@/hooks/useLayerActors";

type Link = { id: string; source_actor_id: string; target_actor_id: string; link_type: string; note: string | null };
const TYPES = ["Trabajo conjunto", "Intercambio de saberes", "Mentoría", "Derivación", "Otro"];

/** Red de vínculos declarados entre integrantes de una capa. Solo la ve el equipo de la capa. */
const LayerLinksPanel = ({ layerId, actors }: { layerId: string; actors: LayerActor[] }) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [t, setT] = useState(TYPES[0]); const [note, setNote] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await (supabase as any).from("layer_actor_links").select("*").eq("layer_id", layerId);
    setLinks(data || []);
  }, [layerId]);
  useEffect(() => { load(); }, [load]);

  const byId = useMemo(() => new Map(actors.map((x) => [x.id, x])), [actors]);
  // Proyección simple de lat/lng al recuadro del gráfico
  const pos = useMemo(() => {
    if (!actors.length) return new Map<string, { x: number; y: number }>();
    const lats = actors.map((x) => x.lat), lngs = actors.map((x) => x.lng);
    const [la0, la1, ln0, ln1] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    return new Map(actors.map((x) => [x.id, {
      x: 8 + ((x.lng - ln0) / (ln1 - ln0 || 1)) * 84,
      y: 8 + ((la1 - x.lat) / (la1 - la0 || 1)) * 74,
    }]));
  }, [actors]);

  const add = async () => {
    if (!a || !b || a === b) return;
    await (supabase as any).from("layer_actor_links").insert({ layer_id: layerId, source_actor_id: a, target_actor_id: b, link_type: t, note: note || null });
    setNote(""); load();
  };
  const del = async (id: string) => { await (supabase as any).from("layer_actor_links").delete().eq("id", id); load(); };
  const shown = sel ? links.filter((l) => l.source_actor_id === sel || l.target_actor_id === sel) : links;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Users className="h-5 w-5" />
        <h2 className="font-display text-xl">Red de vínculos declarados</h2>
        <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Solo equipo de la capa</Badge>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <svg viewBox="0 0 100 90" className="w-full rounded-lg bg-muted/30">
          {links.map((l) => {
            const p = pos.get(l.source_actor_id), q = pos.get(l.target_actor_id);
            if (!p || !q) return null;
            const on = !sel || l.source_actor_id === sel || l.target_actor_id === sel;
            return <line key={l.id} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className={on ? "stroke-primary" : "stroke-muted-foreground/30"} strokeWidth={on ? 0.8 : 0.4} />;
          })}
          {actors.map((x) => { const p = pos.get(x.id)!; return (
            <g key={x.id} onClick={() => setSel(sel === x.id ? null : x.id)} className="cursor-pointer">
              <circle cx={p.x} cy={p.y} r={x.id === sel ? 4 : 3} className={x.id === sel ? "fill-primary" : "fill-secondary stroke-primary"} strokeWidth={0.4} />
              <text x={p.x} y={p.y + 7} textAnchor="middle" className="fill-foreground" fontSize="3">{x.name.split(" ")[0]}</text>
            </g>
          ); })}
        </svg>
        <ul className="space-y-2 text-sm max-h-80 overflow-auto">
          {shown.length === 0 && <li className="text-muted-foreground">Todavía no hay vínculos declarados.</li>}
          {shown.map((l) => (
            <li key={l.id} className="rounded-lg border p-3 flex justify-between gap-2">
              <div>
                <p className="font-medium">{byId.get(l.source_actor_id)?.name} ↔ {byId.get(l.target_actor_id)?.name}</p>
                <p className="text-xs"><Badge variant="outline" className="mr-1">{l.link_type}</Badge>{l.note}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => del(l.id)} aria-label="Borrar vínculo"><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid sm:grid-cols-5 gap-2 items-end">
        <select className="h-10 rounded-md border bg-background px-2 text-sm" value={a} onChange={(e) => setA(e.target.value)}>
          <option value="">Quién…</option>{actors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select className="h-10 rounded-md border bg-background px-2 text-sm" value={b} onChange={(e) => setB(e.target.value)}>
          <option value="">Con quién…</option>{actors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select className="h-10 rounded-md border bg-background px-2 text-sm" value={t} onChange={(e) => setT(e.target.value)}>
          {TYPES.map((x) => <option key={x}>{x}</option>)}
        </select>
        <Input placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button onClick={add} disabled={!a || !b || a === b}>Agregar vínculo</Button>
      </div>
    </Card>
  );
};

export default LayerLinksPanel;
