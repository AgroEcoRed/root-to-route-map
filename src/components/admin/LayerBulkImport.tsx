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

// Busca primero el nombre exacto de columna y, si no, una columna que empiece
// así (útil para encabezados largos de Google Forms, ej. "Título de la actividad").
const pick = (row: Record<string, unknown>, keys: string[]): string => {
  const val = (v: unknown) => (v !== undefined && v !== null && String(v).trim() !== "" ? String(v).trim() : "");
  for (const k of keys) { const v = val(row[k]); if (v) return v; }
  const cols = Object.keys(row);
  for (const k of keys) {
    const c = cols.find((c) => c.startsWith(k + "_") || c === k);
    if (c) { const v = val(row[c]); if (v) return v; }
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

/** Acepta fechas de Excel (número), dd/mm/aaaa, aaaa-mm-dd, con o sin hora. Hora de Argentina. */
function parseDate(raw: string, timeRaw = ""): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  let y: number, mo: number, d: number, h = 0, mi = 0;
  const serial = /^\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    const ms = Math.round((serial - 25569) * 86400000);
    const u = new Date(ms);
    y = u.getUTCFullYear(); mo = u.getUTCMonth() + 1; d = u.getUTCDate(); h = u.getUTCHours(); mi = u.getUTCMinutes();
  } else {
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})[:.hH](\d{2}))?/);
    if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; h = +(m[4] || 0); mi = +(m[5] || 0); }
    else {
      m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[ ,T]+(\d{1,2})[:.hH](\d{2})?)?/);
      if (!m) return null;
      d = +m[1]; mo = +m[2]; y = +m[3]; if (y < 100) y += 2000; h = +(m[4] || 0); mi = +(m[5] || 0);
    }
  }
  const t = timeRaw.trim();
  if (t) {
    const tn = /^\d*\.\d+$/.test(t) ? parseFloat(t) : NaN; // hora de Excel (fracción del día)
    if (Number.isFinite(tn)) { const mins = Math.round(tn * 1440); h = Math.floor(mins / 60); mi = mins % 60; }
    else { const tm = t.match(/(\d{1,2})(?:[:.hH](\d{2}))?/); if (tm) { h = +tm[1]; mi = +(tm[2] || 0); } }
  }
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y > 1900)) return null;
  const date = new Date(Date.UTC(y, mo - 1, d, h + 3, mi)); // Argentina = UTC-3
  return isNaN(date.getTime()) ? null : date;
}

const EVENT_TYPES = ["feria", "intercambio", "formacion", "otro", "conferencia_jornada", "taller", "encuentro", "voluntariado"];
function mapEventType(raw: string): { type: string; custom: string | null } {
  if (!raw) return { type: "otro", custom: null };
  const k = norm(raw);
  if (EVENT_TYPES.includes(k)) return { type: k, custom: null };
  if (/feria|mercado/.test(k)) return { type: "feria", custom: raw };
  if (/taller/.test(k)) return { type: "taller", custom: raw };
  if (/curso|capacit|formac|charla/.test(k)) return { type: "formacion", custom: raw };
  if (/jornada|conferen|congreso|semin|panel/.test(k)) return { type: "conferencia_jornada", custom: raw };
  if (/encuentro|reunion|visita|recorrida/.test(k)) return { type: "encuentro", custom: raw };
  if (/intercambio|trueque|semilla/.test(k)) return { type: "intercambio", custom: raw };
  if (/voluntar|minga|plantac/.test(k)) return { type: "voluntariado", custom: raw };
  return { type: "otro", custom: raw };
}

export default function LayerBulkImport({ layerId, onImported }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>(layerId === "mes_agroecologia" ? "actividades" : "actores");
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

      let ok = 0, skipped = 0, duplicated = 0, geocoded = 0;

      for (const r of rows) {
        const name = pick(r, mode === "actores"
          ? ["nombre", "name", "actor", "titulo", "organizacion"]
          : ["titulo_de_la_actividad", "titulo", "title", "nombre", "actividad", "evento"]);
        if (!name) { skipped++; continue; }

        let lat = num(pick(r, ["lat", "latitud", "latitude"]));
        let lng = num(pick(r, ["lng", "lon", "long", "longitud", "longitude"]));
        const address = pick(r, ["direccion_de_la_actividad", "direccion", "address", "lugar", "domicilio", "ubicacion"]);
        const locality = pick(r, ["localidad", "ciudad", "municipio"]);
        const district = pick(r, ["partido_departamento", "partido", "departamento"]);
        const province = pick(r, ["provincia", "province"]);

        if ((lat == null || lng == null) && (address || locality)) {
          // Cuanto más contexto territorial enviamos, menos probable es que una
          // dirección ambigua termine en otra ciudad o en otro barrio homónimo.
          let g = await geocode([address, locality, district, province, "Argentina"].filter(Boolean).join(", "));
          if (!g && address && locality) {
            await new Promise((res) => setTimeout(res, 1100));
            // Si la dirección no puede resolverse (por ejemplo, el nombre de una
            // persona o de una casa), ubicamos por localidad. El mapa la mostrará
            // como una estrella punteada para indicar que es aproximada.
            g = await geocode([locality, district, province, "Argentina"].filter(Boolean).join(", "));
          }
          if (g) { lat = g.lat; lng = g.lng; geocoded++; }
          await new Promise((res) => setTimeout(res, 1100));
        }

        if (mode === "actores") {
          if (lat == null || lng == null) { skipped++; lines.push(`Sin ubicación: ${name}`); continue; }
          const dias = pick(r, ["dias_entrega", "dias", "entrega", "apertura", "horario", "dia_de_entrega"]);
          // Columna opcional "publico" / "visible": no / non / false ⇒ el punto queda
          // sólo visible para quienes administran la capa (no sale al mapa público).
          const pub = (pick(r, ["publico", "público", "public", "visible", "publique", "mapa_publico"]) || "").toLowerCase();
          const publicVisible = pub === "" ? true : !["no", "non", "false", "0", "oculto", "interno", "privado"].includes(pub);
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
            public_visible: publicVisible,
            created_by: user.id,
          });
          if (error) { skipped++; lines.push(`${name}: ${error.message}`); } else ok++;
        } else {
          const startRaw = pick(r, ["fecha_inicio", "fecha", "inicio", "fecha_de_inicio", "dia", "starts_at", "start"]);
          const timeRaw = pick(r, ["hora_de_comienzo", "hora", "hora_inicio", "horario"]);
          const start = parseDate(startRaw, timeRaw);
          if (!start) { skipped++; lines.push(`Fecha inválida ("${startRaw}"): ${name}`); continue; }
          const endRaw = pick(r, ["fecha_fin", "fin", "fecha_de_fin", "ends_at", "end"]);
          const end = endRaw ? parseDate(endRaw, pick(r, ["hora_fin"])) : null;
          const typeRaw = pick(r, ["tipo_de_actividad", "tipo", "event_type", "categoria"]);
          const { type: eventType, custom } = mapEventType(typeRaw);
          const startsAt = start.toISOString();
          const { data: existing, error: duplicateCheckError } = await (supabase as any)
            .from("events")
            .select("id")
            .eq("layer_id", layerId)
            .eq("title", name)
            .eq("starts_at", startsAt)
            .limit(1);
          if (duplicateCheckError) {
            skipped++;
            lines.push(`${name}: no se pudo comprobar si ya estaba cargada (${duplicateCheckError.message})`);
            continue;
          }
          if (Array.isArray(existing) && existing.length > 0) {
            duplicated++;
            lines.push(`Ya estaba cargada: ${name}`);
            continue;
          }
          const email = pick(r, ["correo_electronico", "email", "mail", "direccion_de_correo_electronico"]);
          const phone = pick(r, ["telefono", "whatsapp", "celular"]);
          const social = pick(r, ["red_social", "redes_sociales", "instagram", "facebook"]);
          const linkRaw = pick(r, ["enlace", "link", "url"]);
          const link = linkRaw || (/^https?:\/\//i.test(social) ? social : "");
          const contactParts = [
            pick(r, ["contacto", "contact"]),
            phone && `Tel: ${phone}`,
            email && `Correo: ${email}`,
            social && !/^https?:\/\//i.test(social) && `Redes: ${social}`,
          ].filter(Boolean) as string[];
          const comments = pick(r, ["comentarios_adicionales", "comentarios", "observaciones"]);
          const extras = [
            ["Modalidad", pick(r, ["modalidad"])],
            ["Duración", pick(r, ["duracion_de_la_actividad", "duracion"])],
            ["Organizan", pick(r, ["instituciones_entidades_persona", "organizan", "organizador", "organiza"])],
            ["Tipo de organización", pick(r, ["tipo_de_instituciones", "tipo_de_organizacion"])],
            ["Comentarios", /^(ninguno|ninguna|no|-)$/i.test(comments) ? "" : comments],
          ].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
          const baseDesc = pick(r, ["descripcion_de_la_actividad", "descripcion", "description", "detalle"]);
          const description = [baseDesc, extras.join("\n")].filter(Boolean).join("\n\n");
          const { error } = await (supabase as any).from("events").insert({
            title: name,
            description: description || null,
            event_type: eventType,
            custom_type: custom,
            starts_at: startsAt,
            ends_at: end ? end.toISOString() : null,
            location_name: [address, locality, district, province].filter(Boolean).join(", ") || null,
            lat, lng,
            link: link || null,
            contact: contactParts.join(" · ") || null,
            contact_email: email || null,
            contact_phone: phone || null,
            focal_email: email || null,
            focal_name: pick(r, ["nombre_y_apellido", "referente"]) || null,
            source: "community",
            approved: true,
            layer_id: layerId,
            created_by: user.id,
          });
          if (error) { skipped++; lines.push(`${name}: ${error.message}`); } else ok++;
        }
      }

      lines.unshift(`Importadas ${ok} filas · ${duplicated} ya existentes · ${skipped} omitidas · ${geocoded} geolocalizadas`);
      setLog(lines.slice(0, 25));
      if (skipped > 0) toast.warning(`Se importaron ${ok} filas y ${skipped} necesitan revisión`);
      else toast.success(ok > 0 ? `Se importaron ${ok} filas` : "No había actividades nuevas para importar");
      if (ok > 0) onImported?.();
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

      <p className="mb-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground">
        Vas a importar: <span className="capitalize text-primary">{mode}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Label className="text-xs">Elegí qué contiene la planilla:</Label>
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
        {busy ? "Importando…" : `Subir planilla de ${mode}`}
      </Button>

      {log.length > 0 && (
        <div className="mt-3 text-xs bg-muted rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
          {log.map((l, i) => <p key={i} className={i === 0 ? "font-medium" : "text-muted-foreground"}>{l}</p>)}
        </div>
      )}
    </Card>
  );
}
