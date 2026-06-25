import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AgroEvent {
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
  source: "user" | "admin" | "community";
  approved: boolean;
  created_by: string | null;
}

export const useUpcomingEvents = () => {
  const [events, setEvents] = useState<AgroEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("events")
      .select("*")
      .gte("starts_at", new Date().toISOString())
      .eq("approved", true)
      .order("starts_at", { ascending: true });
    setEvents((data as AgroEvent[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`events_changes_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { events, loading, refresh: load };
};