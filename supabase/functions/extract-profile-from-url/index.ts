const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ACTOR_TYPES = [
  "producer","cooperative","social_kitchen","restaurant","retail","consumer",
  "institution","logistics","processing","agroecological_node","seed_bank",
  "composting_center","research_center","solidarity_intermediary","community_garden",
  "consumer_node","individual_consumer","food_bank","consumer_cooperative",
  "community_org","health_food_store","agroecological_store","agroecological_fair",
  "agroecological_market","bio_input_supplier"
];

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Falta la URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = "https://" + normalizedUrl;

    // Fetch the page content
    let pageText = "";
    let pageTitle = "";
    try {
      const pageRes = await fetch(normalizedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 AgroEcoBot/1.0" },
        redirect: "follow",
      });
      if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`);
      const html = await pageRes.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      pageTitle = titleMatch?.[1]?.trim() || "";
      pageText = stripHtml(html);
    } catch (e) {
      return new Response(JSON.stringify({
        error: "No pudimos leer esa URL. Verificá que sea pública y accesible.",
        details: String(e),
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!pageText || pageText.length < 50) {
      return new Response(JSON.stringify({
        error: "La página no tiene contenido suficiente para extraer un perfil.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
              "Sos un asistente que extrae perfiles de actores agroecológicos a partir del contenido de una página web (sitio, blog, perfil de Instagram público, Linktree, Google Drive público, etc). Devolvé SIEMPRE un JSON con esta forma exacta y nada más:\n" +
              `{"display_name": string, "actor_type": one of [${ACTOR_TYPES.join(", ")}], "description": string (máx 400 chars), "location": string (ciudad, provincia, país si lo encontrás), "products": string[] (categorías o productos detectados, máx 10), "phone": string|null, "confidence": "high"|"medium"|"low"}\n` +
              "Si no encontrás un dato, ponelo en null o string vacío. No inventes coordenadas. Respondé sólo el JSON sin markdown.",
          },
          {
            role: "user",
            content: `URL: ${normalizedUrl}\nTítulo de la página: ${pageTitle}\n\nContenido:\n${pageText}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errTxt = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso alcanzado. Intentá más tarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Sin créditos de IA disponibles." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Error del servicio de IA", details: errTxt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    // Sanitize actor_type
    if (!ACTOR_TYPES.includes(parsed.actor_type)) parsed.actor_type = "producer";
    if (!Array.isArray(parsed.products)) parsed.products = [];
    parsed.products = parsed.products.slice(0, 10).map((p: any) => String(p).slice(0, 60));

    return new Response(JSON.stringify({ profile: parsed, sourceUrl: normalizedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});