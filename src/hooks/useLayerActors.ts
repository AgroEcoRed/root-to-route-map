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
    const { data } = await (supabase as any)
      .from("layer_actors")
      .select("*")
      .eq("source_id", sourceId)
      .order("name");
    setActors((data as LayerActor[]) || []);
    setLoading(false);
  }, [sourceId]);

  useEffect(() => { load(); }, [load]);

  return { actors, loading, reload: load, setActors };
};