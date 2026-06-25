import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DataSourceId = "rutas_sanas" | "mercado_territorial" | "agroeco" | "eventos" | "el_click" | "el_brote" | "utt_nodos" | "user_points";

export interface DataSourceSetting {
  source_id: DataSourceId;
  label: string;
  enabled: boolean;
}

const DEFAULTS: DataSourceSetting[] = [
  { source_id: "rutas_sanas", label: "Rutas Sanas del Alimento", enabled: true },
  { source_id: "mercado_territorial", label: "Mercado Territorial", enabled: true },
  { source_id: "agroeco", label: "AgroEco.Red (perfiles propios)", enabled: true },
  { source_id: "eventos", label: "Actividades futuras", enabled: true },
  { source_id: "el_click", label: "El Click Bolsones", enabled: true },
  { source_id: "el_brote", label: "El Brote Tienda", enabled: true },
  { source_id: "utt_nodos", label: "Nodos UTT (Unión de Trabajadores de la Tierra)", enabled: true },
  { source_id: "user_points", label: "Puntos agregados por la comunidad", enabled: true },
];

export const useDataSources = () => {
  const [sources, setSources] = useState<DataSourceSetting[]>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("data_source_settings")
      .select("source_id, label, enabled");
    if (data && data.length > 0) {
      // Preserve canonical order
      const map = new Map(data.map((d: any) => [d.source_id, d]));
      setSources(DEFAULTS.map(d => (map.get(d.source_id) as DataSourceSetting) || d));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`data_source_settings_changes_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "data_source_settings" },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const toggle = useCallback(async (sourceId: DataSourceId, enabled: boolean) => {
    const { error } = await (supabase as any)
      .from("data_source_settings")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("source_id", sourceId);
    if (!error) {
      setSources(prev => prev.map(s => s.source_id === sourceId ? { ...s, enabled } : s));
    }
    return { error };
  }, []);

  const isEnabled = useCallback(
    (sourceId: DataSourceId) => sources.find(s => s.source_id === sourceId)?.enabled ?? true,
    [sources]
  );

  return { sources, loading, toggle, isEnabled };
};