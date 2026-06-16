import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActorConnection {
  id: string;
  source_profile_id: string;
  target_profile_id: string;
  connection_type: "proveedor" | "comprador" | "colaboracion" | "spg" | "intercambio" | "red" | "otro";
  strength: number;
  note: string | null;
  declared: boolean;
}

export const useActorConnections = () => {
  const [connections, setConnections] = useState<ActorConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("actor_connections")
      .select("*");
    setConnections((data as ActorConnection[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("actor_connections_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "actor_connections" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { connections, loading, refresh: load };
};