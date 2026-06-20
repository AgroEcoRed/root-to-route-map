import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import data from "./data.json" with { type: "json" };

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Avoid duplicate seed
  const { count } = await supabase
    .from("layer_actors")
    .select("*", { count: "exact", head: true })
    .eq("source_id", "rutas_sanas");

  if ((count ?? 0) > 0) {
    return new Response(
      JSON.stringify({ skipped: true, existing: count }),
      { headers: { "content-type": "application/json" } },
    );
  }

  const rows = (data as Array<{n:string;lat:number;lng:number;t:string;f:string;d:string}>).map(r => ({
    source_id: "rutas_sanas",
    name: r.n,
    lat: r.lat,
    lng: r.lng,
    actor_type: r.t,
    family: r.f,
    description: r.d || null,
  }));

  // chunk inserts to keep request size sane
  const chunkSize = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("layer_actors").insert(chunk);
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message, inserted }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
    inserted += chunk.length;
  }

  return new Response(
    JSON.stringify({ ok: true, inserted }),
    { headers: { "content-type": "application/json" } },
  );
});