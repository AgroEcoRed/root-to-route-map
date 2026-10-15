// Visibilidad pública de actividades por capa, decidida por su equipo.
// Se guarda en data_source_settings.privacy.events_visibility.
export interface EventVisibility {
  /** "show": las pasadas se ven grises y chicas; "hide": no aparecen en el mapa público. */
  past: "show" | "hide";
  /** Años que no se muestran en el mapa público (por ejemplo [2025]). */
  hidden_years: number[];
}

export const DEFAULT_EVENT_VISIBILITY: EventVisibility = { past: "show", hidden_years: [] };

export function readEventVisibility(privacy: unknown): EventVisibility {
  const v = (privacy as any)?.events_visibility || {};
  return {
    past: v.past === "hide" ? "hide" : "show",
    hidden_years: Array.isArray(v.hidden_years) ? v.hidden_years.map(Number).filter((n: number) => !isNaN(n)) : [],
  };
}

const yearAR = (iso: string) =>
  Number(new Date(iso).toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric" }));

/** true si la actividad debe dibujarse en el mapa público. */
export function isEventPubliclyVisible(
  ev: { starts_at: string },
  vis: EventVisibility,
  now: number = Date.now(),
): boolean {
  const t = new Date(ev.starts_at).getTime();
  if (isNaN(t)) return true;
  if (vis.hidden_years.includes(yearAR(ev.starts_at))) return false;
  if (vis.past === "hide" && t < now) return false;
  return true;
}
