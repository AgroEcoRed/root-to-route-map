import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LayerActor {
  id: string;
  source_id: string;
  name: string;
  lat: number;
  lng: number;
  actor_type: string | null;
  family: string | null;
  description: string | null;
  address: string | null;
  contact: string | null;
  delivery_days: string[] | null;
  verified_at: string | null;
  verified_by_role: string | null;
  public_visible?: boolean;
  extra: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export const useLayerActors = (sourceId: string | undefined) => {
  const [actors, setActors] = useState<LayerActor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sourceId) return;
    setLoading(true);
    // Explicit column list: confirmation_email / confirmation_phone are PII
    // and no longer readable from the Data API for anon/authenticated. They
    // are fetched on demand via the get_actor_confirmation_contact RPC.
    const { data } = await (supabase as any)
      .from("layer_actors")
      .select(
        "id,source_id,name,lat,lng,actor_type,family,description,address,contact,delivery_days,verified_at,verified_by_role,public_visible,extra,created_at,updated_at,created_by,confirmation_status,confirmation_sent_at,confirmed_at,confirmed_by"
      )
      .eq("source_id", sourceId)
      .order("name");
    let rows = (data as LayerActor[]) || [];
    // Quienes gestionan la capa ven los datos completos reservados (RLS devuelve
    // filas sólo a managers/admins; para el público esta consulta viene vacía).
    const { data: priv } = await (supabase as any)
      .from("layer_actor_private")
      .select("layer_actor_id,lat,lng,contact,actor_type,family")
      .eq("source_id", sourceId);
    if (priv && priv.length) {
      const m = new Map<string, any>(priv.map((p: any) => [p.layer_actor_id, p]));
      rows = rows.map((r) => {
        const p = m.get(r.id);
        return p ? { ...r, lat: p.lat ?? r.lat, lng: p.lng ?? r.lng, contact: p.contact, actor_type: p.actor_type, family: p.family } : r;
      });
    }
    setActors(rows);
    setLoading(false);
  }, [sourceId]);

  useEffect(() => { load(); }, [load]);

  return { actors, loading, reload: load, setActors };
};