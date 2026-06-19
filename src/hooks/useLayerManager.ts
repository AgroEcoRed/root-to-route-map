import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import type { DataSourceId } from "@/hooks/useDataSources";

export interface LayerManagerAssignment {
  layer_id: DataSourceId;
}

/**
 * Returns the layers the current user can manage.
 * - Global admins implicitly manage every layer.
 * - Layer managers (rows in `layer_managers`) manage only their assigned layers.
 */
export const useLayerManager = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [layers, setLayers] = useState<DataSourceId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user) {
      setLayers([]);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("layer_managers")
        .select("layer_id")
        .eq("user_id", user.id);
      if (active) {
        setLayers(((data as LayerManagerAssignment[] | null) ?? []).map(r => r.layer_id));
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, authLoading, adminLoading]);

  const canManage = (layerId: DataSourceId) => isAdmin || layers.includes(layerId);

  return { layers, isAdmin, canManage, loading };
};