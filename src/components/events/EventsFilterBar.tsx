import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { argentinaRegions } from "@/data/argentinaRegions";
import { AgroEventFull } from "@/hooks/useEvents";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

/** city (normalizada) -> provincia; se construye una sola vez. */
let cityIndex: Map<string, string> | null = null;
const getCityIndex = () => {
  if (cityIndex) return cityIndex;
  cityIndex = new Map();
  (argentinaRegions as { name: string; cities: string[] }[]).forEach((r) => {
    r.cities?.forEach((c) => {
      const k = norm(c);
      if (!cityIndex!.has(k)) cityIndex!.set(k, r.name);
    });
  });
  return cityIndex;
};

/** Deduce la provincia de una actividad a partir de su localidad/dirección. */
export function eventProvince(ev: AgroEventFull): string | null {
  const loc = norm(ev.location_name || "");
  if (!loc) return null;
  const regions = argentinaRegions as { name: string; cities: string[] }[];
  const byRegion = regions.find((r) => loc.includes(norm(r.name)));
  if (byRegion) return byRegion.name;
  const idx = getCityIndex();
  const parts = loc.split(/[,\-–|/]/).map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    const hit = idx.get(p);
    if (hit) return hit;
  }
  for (const [city, prov] of idx) {
    if (city.length > 4 && loc.includes(city)) return prov;
  }
  return null;
}

export const monthKey = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const name = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${String(y).slice(2)}`;
};

export interface EventsFilters {
  province: string | null;
  months: string[];
}

interface Props {
  /** Todas las actividades (sin filtrar) para calcular contadores. */
  events: AgroEventFull[];
  value: EventsFilters;
  onChange: (v: EventsFilters) => void;
}

/** Aplica los filtros de provincia y mes a una lista de actividades. */
export function applyEventFilters(events: AgroEventFull[], f: EventsFilters) {
  return events.filter((e) => {
    if (f.province && eventProvince(e) !== f.province) return false;
    if (f.months.length && !f.months.includes(monthKey(e.starts_at))) return false;
    return true;
  });
}

const EventsFilterBar = ({ events, value, onChange }: Props) => {
  const provinces = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((e) => {
      const p = eventProvince(e);
      if (p) counts.set(p, (counts.get(p) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [events]);

  const months = useMemo(() => {
    const base = value.province ? events.filter((e) => eventProvince(e) === value.province) : events;
    const counts = new Map<string, number>();
    base.forEach((e) => {
      const k = monthKey(e.starts_at);
      if (k) counts.set(k, (counts.get(k) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [events, value.province]);

  const toggleMonth = (k: string) =>
    onChange({
      ...value,
      months: value.months.includes(k) ? value.months.filter((m) => m !== k) : [...value.months, k],
    });

  const dirty = !!value.province || value.months.length > 0;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full text-xs h-8 shrink-0">
            {value.province || "Todas las provincias"}
            <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-popover z-[1000] max-h-72 overflow-y-auto">
          <DropdownMenuItem className="text-xs" onClick={() => onChange({ ...value, province: null })}>
            Todas las provincias
          </DropdownMenuItem>
          {provinces.map(([p, n]) => (
            <DropdownMenuItem key={p} className="text-xs" onClick={() => onChange({ ...value, province: p })}>
              {p} <span className="ml-auto pl-3 text-[10px] text-muted-foreground">{n}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {months.map(([k, n]) => {
        const active = value.months.includes(k);
        return (
          <button
            key={k}
            onClick={() => toggleMonth(k)}
            className={`shrink-0 rounded-full border px-3 h-8 text-xs transition ${
              active ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card hover:border-primary/40"
            }`}
          >
            {monthLabel(k)} <span className="ml-1 text-[10px] text-muted-foreground">{n}</span>
          </button>
        );
      })}

      {dirty && (
        <button
          onClick={() => onChange({ province: null, months: [] })}
          className="shrink-0 text-xs underline text-muted-foreground hover:text-foreground px-1"
        >
          Limpiar
        </button>
      )}
    </div>
  );
};

export default EventsFilterBar;
