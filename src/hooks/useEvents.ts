import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AgroEventFull {
  id: string;
  title: string;
  description: string | null;
  event_type: "feria" | "intercambio" | "formacion" | "otro";
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  link: string | null;
  contact: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  flyer_url: string | null;
  co_organizers: string[];
  extra_organizer_names: string[];
  source: string;
  approved: boolean;
  created_by: string | null;
}

/** Loads ALL events (past, future, undated) so we can power the sidebar. */
export const useEvents = () => {
  const [events, setEvents] = useState<AgroEventFull[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("events")
      .select("*")
      .eq("approved", true)
      .order("starts_at", { ascending: false });
    setEvents((data as AgroEventFull[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`events_full_changes_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return { events, loading, refresh: load };
};

/** Time bucket for an event based on starts_at and presence of location. */
export type EventBucket = "upcoming" | "undated_or_unplaced" | "past";

export function eventBucket(ev: AgroEventFull): EventBucket {
  const hasDate = !!ev.starts_at && !isNaN(new Date(ev.starts_at).getTime());
  const hasPlace = ev.lat != null && ev.lng != null;
  if (!hasDate) return "undated_or_unplaced";
  const t = new Date(ev.starts_at).getTime();
  if (t < Date.now()) return "past";
  if (!hasPlace) return "undated_or_unplaced";
  return "upcoming";
}

/** 0..1 intensity: closer to event date = brighter. >7 days out = 0.2, day of = 1. */
export function glowIntensity(startsAt: string | null): number {
  if (!startsAt) return 0;
  const t = new Date(startsAt).getTime();
  if (isNaN(t)) return 0;
  const days = (t - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0) return 0;
  if (days < 0.5) return 1;
  if (days < 1) return 0.95;
  if (days < 3) return 0.8;
  if (days < 7) return 0.55;
  if (days < 14) return 0.35;
  return 0.2;
}

/**
 * Color scale for upcoming events based on proximity (intensity 0..1).
 * Cold blue (lejos) → cyan → amarillo → naranja → rojo (inminente).
 * Evita morados/violetas para no chocar con los íconos de actores en el mapa.
 */
export function proximityColor(intensity: number): string {
  if (intensity >= 0.9) return "#dc2626";  // < 12 h → rojo
  if (intensity >= 0.75) return "#f97316"; // < 1 día → naranja
  if (intensity >= 0.55) return "#f59e0b"; // < 3 días → ámbar
  if (intensity >= 0.35) return "#eab308"; // < 7 días → amarillo
  if (intensity >= 0.25) return "#0ea5e9"; // < 14 días → celeste
  return "#2563eb";                          // lejos → azul
}