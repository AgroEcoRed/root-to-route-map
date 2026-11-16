import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { buildActivitiesRss, selectPublicActivities, type FeedEvent } from "./feed.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Método no permitido", { status: 405, headers: { ...corsHeaders, Allow: "GET, HEAD, OPTIONS" } });
  }
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) throw new Error("Missing public connection");
    // Always anonymous, even for signed-in requests: never expose an owner's private records.
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data: layers, error: layerError } = await client.from("data_source_settings")
      .select("source_id,enabled,privacy").eq("enabled", true);
    if (layerError) throw layerError;
    const events: FeedEvent[] = [];
    for (let offset = 0; ; offset += 500) {
      if (offset >= 10000) throw new Error("Feed capacity exceeded");
      const { data, error } = await client.from("public_events")
        .select("id,title,description,starts_at,ends_at,location_name,created_at,approved,layer_id")
        .eq("approved", true).order("created_at", { ascending: false }).order("id")
        .range(offset, offset + 499);
      if (error) throw error;
      events.push(...(data || []));
      if (!data || data.length < 500) break;
    }
    const xml = buildActivitiesRss(selectPublicActivities(events, layers || []), `${url}/functions/v1/activities-rss`);
    return new Response(req.method === "HEAD" ? null : xml, { headers: {
      ...corsHeaders, "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=900", "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response("El canal de actividades no está disponible en este momento.", {
      status: 503, headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", "Retry-After": "60" },
    });
  }
});