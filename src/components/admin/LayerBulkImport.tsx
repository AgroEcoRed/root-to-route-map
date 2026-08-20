import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, Upload, Download } from "lucide-react";

type Mode = "actores" | "actividades";

interface Props {
  layerId: string;
  onImported?: () => void;
}

const norm = (s: string) =>
  s.toString().trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const pick = (row: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
};

const num = (v: string): number | null => {
  if (!v) return null;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(q)}`
    );
    const data = await res.json();
    if (Array.isArray(data) && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* ignore */ }
  return null;
}

export default function LayerBulkImport({ layerId, onImported }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("actores");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const rows = mode === "actores"
      ? [{ nombre: "", tipo: "agroecological_node", direccion: "", localidad: "", lat: "", lng: "", contacto: "", dias_entrega: "", descripcion: "" }]
      : [{ titulo: "", tipo: "feria", fecha_inicio: "2026-11-05 18:00", fecha_fin: "", lugar: "", localidad: "", lat: "", lng: "", contacto: "", enlace: "", descripcion: "" }];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, mode);
    XLSX.writeFile(wb, `plantilla_${mode}_${layerId}.xlsx`);
  };

  const handleFile = async (file: File) => {
    if (!user) { toast.error("Necesitás iniciar sesión"); return; }
    setBusy(true);
    setLog([]);
    const lines: string[] = [];
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows = raw.map((r) => {
        const o: Record<string, unknown> = {};
        Object.entries(r).forEach(([k, v]) => { o[norm(k)] = v; });
        return o;
      });

      let ok = 0, skipped = 0, geocoded = 0;

      for (const r of rows) {
        const name = pick(r, mode === "actores"
          ? ["nombre", "name", "actor", "titulo", "organizacion"]
          : ["titulo", "title", "nombre", "actividad", "evento"]);
        if (!name) { skipped++; continue; }

        let lat = num(pick(r, ["lat", "latitud", "latitude"]));
        let lng = num(pick(r, ["lng", "lon", "long", "longitud", "longitude"]));
        const address = pick(r, ["direccion", "address", "lugar", "domicilio", "ubicacion"]);
        const locality = pick(r, ["localidad", "ciudad", "municipio", "partido", "provincia"]);

        if ((lat == null || lng == null) && (address || locality)) {
          const g = await geocode([address, locality, "Argentina"].filter(Boolean).join(", "));
          if (g) { lat = g.lat; lng = g.lng; geocoded++; }
          await new Promise((res) => setTimeout(res, 1100));
        }

        if (mode === "actores") {
          if (lat == null || lng == null) { skipped++; lines.push(`Sin ubicación: ${name}`); continue; }
          const dias = pick(r, ["dias_entrega", "dias", "entrega", "apertura", "horario", "dia_de_entrega"]);
          const { error } = await (supabase as any).from("layer_actors").insert({
            source_id: layerId,
            name,
            lat, lng,
            actor_type: pick(r, ["tipo", "actor_type", "type"]) || "agroecological_node",
            family: pick(r, ["familia", "family", "categoria"]) || null,
            description: pick(r, ["descripcion", "description", "detalle"]) || null,
            address: address || locality || null,
            contact: pick(r, ["contacto", "contact", "telefono", "email", "whatsapp"]) || null,
            delivery_days: dias ? dias.split(/[,;/]/).map(s => s.trim()).filter(Boolean) : null,
            created_by: user.id,
          });
          if (error) { skipped++; lines.push(`${name}: ${error.message}`); } else ok++;
        } else {
          const startRaw = pick(r, ["fecha_inicio", "fecha", "inicio", "starts_at", "start"]);
          const start = startRaw ? new Date(startRaw.replace(" ", "T")) : null;
          if (!start || isNaN(start.getTime())) { skipped++; lines.push(`Fecha inválida: ${name}`); continue; }
          const endRaw = pick(r, ["fecha_fin", "fin", "ends_at", "end"]);
          const end = endRaw ? new Date(endRaw.replace(" ", "T")) : null;
          const { error } = await (supabase as any).from("events").insert({
            title: name,
            description: pick(r, ["descripcion", "description", "detalle"]) || null,
            event_type: pick(r, ["tipo", "event_type", "categoria"]) || "otro",
            starts_at: start.toISOString(),
            ends_at: end && !isNaN(end.getTime()) ? end.toISOString() : null,
            location_name: [address, locality].filter(Boolean).join(", ") || null,
            lat, lng,
            link: pick(r, ["enlace", "link", "url"]) || null,
            contact: pick(r, ["contacto", "contact", "telefono", "whatsapp"]) || null,
            source: "community",
            approved: true,
            created_by: user.id,
          });
          if (error) { skipped++; lines.push(`${name}: ${error.message}`); } else ok++;
        }
      }

      lines.unshift(`Importadas ${ok} filas · ${skipped} omitidas · ${geocoded} geolocalizadas por dirección`);
      setLog(lines.slice(0, 25));
      toast.success(`Se importaron ${ok} filas`);
      onImported?.();
    } catch (e) {
      toast.error("No se pudo leer el archivo: " + (e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card className="p-5 mt-4">
      <h2 className="font-display text-lg flex items-center gap-2 mb-2">
        <FileSpreadsheet className="h-4 w-4 text-primary" /> Carga masiva por Excel / CSV
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Subí una planilla con actores o actividades de tu capa. Si faltan coordenadas, se intentan
        deducir desde la dirección o localidad. Después podés editar cada registro desde la lista.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Label className="text-xs">Contenido:</Label>
        {(["actores", "actividades"] as Mode[]).map((m) => (
          <Badge
            key={m}
            variant={mode === m ? "default" : "outline"}
            className="cursor-pointer capitalize"
            onClick={() => setMode(m)}
          >
            {m}
          </Badge>
        ))}
        <Button size="sm" variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-1" /> Plantilla
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
        {busy ? "Importando…" : "Subir planilla"}
      </Button>

      {log.length > 0 && (
        <div className="mt-3 text-xs bg-muted rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
          {log.map((l, i) => <p key={i} className={i === 0 ? "font-medium" : "text-muted-foreground"}>{l}</p>)}
        </div>
      )}
    </Card>
  );
}
