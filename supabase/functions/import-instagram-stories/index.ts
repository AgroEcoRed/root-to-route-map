const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

import { createClient } from "npm:@supabase/supabase-js@2";

async function requireUser(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("UNAUTHORIZED");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return data.user.id;
}

const ACTOR_TYPES = [
  "producer","cooperative","social_kitchen","restaurant","retail","consumer",
  "institution","logistics","processing","agroecological_node","seed_bank",
  "composting_center","research_center","solidarity_intermediary","community_garden",
  "consumer_node","individual_consumer","food_bank","consumer_cooperative",
  "community_org","health_food_store","agroecological_store","agroecological_fair",
  "agroecological_market","bio_input_supplier"
];

async function fetchReadable(url: string): Promise<{ text: string; title: string }> {
  // Instagram blocks unauthenticated scrapes; r.jina.ai acts as a reader proxy
  // and renders OG metadata + visible text from highlights/profiles.
  let text = "";
  let title = "";
  try {
    const proxied = "https://r.jina.ai/" + url;
    const res = await fetch(proxied, {
      headers: { "Accept": "text/plain", "User-Agent": "AgroEcoBot/1.0" },
    });
    if (res.ok) {
      const t = await res.text();
      const m = t.match(/Title:\s*(.+)/i);
      title = m?.[1]?.trim() || "";
      text = t.replace(/\s+/g, " ").trim().slice(0, 18000);
    }
  } catch (_) {}
  return { text, title };
}

async function geocode(query: string): Promise<{ lat: number; lng: number; display: string } | null> {
  if (!query || query.trim().length < 4) return null;
  try {
    const u = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const r = await fetch(u, {
      headers: { "User-Agent": "AgroEcoRed/1.0 (https://agroeco.red)" },
    });
    if (!r.ok) return null;
    const arr = await r.json();
    if (!Array.isArray(arr) || !arr.length) return null;
    return {
      lat: parseFloat(arr[0].lat),
      lng: parseFloat(arr[0].lon),
      display: arr[0].display_name as string,
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    try {
      await requireUser(req);
    } catch {
      return new Response(JSON.stringify({ error: "Necesitás iniciar sesión para usar el importador." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url, pastedText } = await req.json();
    let normalizedUrl = (url ?? "").toString().trim();
    if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    let source = "";
    let title = "";
    if (normalizedUrl) {
      const { text, title: t } = await fetchReadable(normalizedUrl);
      source = text;
      title = t;
    }
    if (pastedText && typeof pastedText === "string") {
      source = (source + "\n\n" + pastedText).slice(0, 24000);
    }

    if (!source || source.length < 40) {
      return new Response(JSON.stringify({
        error: "No pudimos leer contenido. Instagram suele bloquear el acceso automático: pegá el texto del highlight en el campo de texto y volvé a intentar.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY no configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Sos un asistente que extrae listados de nodos agroecológicos (puntos de retiro, ferias, productores, comedores, etc.) a partir del contenido público de historias destacadas de Instagram, capturas o textos pegados por el usuario. " +
              "Devolvé SIEMPRE un JSON con esta forma exacta: " +
              `{"nodes":[{"display_name": string, "actor_type": one of [${ACTOR_TYPES.join(", ")}], "description": string (máx 280), "address": string (dirección completa con calle, número, ciudad y provincia si está), "city": string, "province": string, "country": string, "phone": string|null, "schedule": string|null, "products": string[] (máx 8), "instagram": string|null, "confidence": "high"|"medium"|"low"}]}` +
              ". Sé exhaustivo: extraé TODOS los nodos/puntos/direcciones que aparezcan. Si el mismo nodo aparece varias veces, devolvelo una sola vez. " +
              "No inventes direcciones: si no hay calle o ciudad concreta, omití ese nodo. País por defecto: Argentina. Respondé sólo el JSON.",
          },
          {
            role: "user",
            content: `URL fuente: ${normalizedUrl || "(no URL)"}\nTítulo: ${title}\n\nContenido:\n${source}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso de IA alcanzado. Probá en unos minutos." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Sin créditos de IA disponibles." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Error del servicio de IA", details: txt }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); }
    catch { const m = content.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : {}; }

    const rawNodes: any[] = Array.isArray(parsed.nodes) ? parsed.nodes : [];

    // Geocode each node (cap at 25 to protect rate limits)
    const limited = rawNodes.slice(0, 25);
    const nodes = [] as any[];
    for (const n of limited) {
      if (!ACTOR_TYPES.includes(n.actor_type)) n.actor_type = "agroecological_node";
      n.products = Array.isArray(n.products) ? n.products.slice(0, 8).map((p: any) => String(p).slice(0, 60)) : [];
      const country = n.country || "Argentina";
      const fullAddr = [n.address, n.city, n.province, country].filter(Boolean).join(", ");
      const geo = await geocode(fullAddr);
      // Nominatim asks for ~1 req/sec
      await new Promise((r) => setTimeout(r, 1100));
      nodes.push({
        ...n,
        country,
        full_address: fullAddr,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        geocoded_label: geo?.display ?? null,
      });
    }

    return new Response(JSON.stringify({ nodes, sourceUrl: normalizedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});