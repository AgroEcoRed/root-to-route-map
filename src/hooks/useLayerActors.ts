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
        "id,source_id,name,lat,lng,actor_type,family,description,address,contact,delivery_days,verified_at,verified_by_role,extra,created_at,updated_at,created_by,confirmation_status,confirmation_token,confirmation_sent_at,confirmed_at,confirmed_by"
      )
      .eq("source_id", sourceId)
      .order("name");
    setActors((data as LayerActor[]) || []);
    setLoading(false);
  }, [sourceId]);

  useEffect(() => { load(); }, [load]);

  return { actors, loading, reload: load, setActors };
};