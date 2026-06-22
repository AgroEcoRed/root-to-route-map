// Sembra — Asistente AgroEco.Red
// Modos: general | onboarding | map
// Tools: buscar_actores_cercanos (Supabase) + buscar_web (DuckDuckGo)
// Lovable AI Gateway (OpenAI-compatible) — Gemini 3 Flash por defecto.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CHAT_MODEL = "google/gemini-3-flash-preview";

type ChatMode = "general" | "onboarding" | "map";

const BASE_TONE =
  `Te llamás **Sembra**, asistente de AgroEco.Red. Hablás con tono cálido, territorial, inclusivo. ` +
  `Decí "sistemas alimentarios" (no "cadenas") y "Sistemas Participativos de Garantía (SPG)" (no "certificación"). ` +
  `Respondé en el idioma del usuario (es/en/fr/pt). Usá markdown (listas, **negritas**, [enlaces](url)). ` +
  `Cuando uses información externa con la herramienta buscar_web, **citá las fuentes** al final como ` +
  `"Fuentes: [Título](URL)". Cuando uses buscar_actores_cercanos, mostrá los nodos con nombre, distancia y ` +
  `contacto, y aclarar que vienen del Mapa Vivo de AgroEco.Red. Si no tenés data, decilo honestamente.`;

const SYSTEM_PROMPTS: Record<ChatMode, string> = {
  general:
    `${BASE_TONE} ` +
    `Podés explicar agroecología, SPG, transición, ferias y cómo usar la plataforma. ` +
    `Si la persona pregunta dónde conseguir/intercambiar algo, **usá buscar_actores_cercanos** ` +
    `con su zona o productos. Si necesita info externa (normativa, definiciones, noticias, papers), ` +
    `usá buscar_web y citá fuentes. Sé breve (máx ~150 palabras) salvo que te pidan detalle.`,
  onboarding:
    `${BASE_TONE} ` +
    `Acompañás el registro paso a paso (productorx, cooperativa, comedor, comercio, institución, logística, consumidorx). ` +
    `Preguntá una cosa por vez. Cuando tengan los datos básicos, indicales ir a /registro. ` +
    `Podés usar buscar_actores_cercanos para mostrarles quién hay cerca y motivarlxs.`,
  map:
    `${BASE_TONE} ` +
    `Sos buscador del Mapa Vivo. Cuando la persona describa qué busca (productos, zona, radio, días de entrega), ` +
    `**llamá siempre a buscar_actores_cercanos** con esos filtros y devolvé los nodos más cercanos ordenados por distancia, ` +
    `con nombre, qué ofrecen, distancia y contacto. Sugerí abrir el Mapa Vivo en /mapa para verlos.`,
};

// ---------- Tools ----------

const TOOLS = [
  {
    type: "function",
    function: {
      name: "buscar_actores_cercanos",
      description:
        "Busca productores, ferias, cooperativas y otros nodos agroecológicos en el Mapa Vivo de AgroEco.Red. " +
        "Devuelve los más cercanos a una ubicación (lat/lng o zona) opcionalmente filtrados por tipo de actor o productos.",
      parameters: {
        type: "object",
        properties: {
          zona: { type: "string", description: "Nombre de localidad/zona (ej: 'La Plata, Buenos Aires')." },
          lat: { type: "number", description: "Latitud aproximada (opcional)." },
          lng: { type: "number", description: "Longitud aproximada (opcional)." },
          radio_km: { type: "number", description: "Radio máximo en km. Default 50." },
          tipo_actor: {
            type: "array", items: { type: "string" },
            description: "Filtros tipo: productor, feria, cooperativa, comedor, comercio, logistica, etc.",
          },
          productos: {
            type: "array", items: { type: "string" },
            description: "Palabras clave de productos: hortalizas, miel, semillas, lácteos, bioinsumos, etc.",
          },
          limit: { type: "number", description: "Máx resultados. Default 6." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_web",
      description:
        "Busca información en la web pública (DuckDuckGo). Úsala para normativa, definiciones, noticias, " +
        "papers o cualquier dato que no esté en AgroEco.Red. Siempre citá la fuente con su URL.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Consulta de búsqueda en lenguaje natural." },
        },
        required: ["query"],
      },
    },
  },
];

// Haversine en km
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Geocoding gratis vía Nominatim (OpenStreetMap).
async function geocode(zona: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(zona)}`,
      { headers: { "User-Agent": "AgroEcoRed-Sembra/1.0 (contact@agroeco.red)" } },
    );
    if (!r.ok) return null;
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
  } catch {
    return null;
  }
}

async function toolBuscarActores(args: Record<string, unknown>) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let lat = typeof args.lat === "number" ? args.lat : null;
  let lng = typeof args.lng === "number" ? args.lng : null;
  const zona = typeof args.zona === "string" ? args.zona : null;
  if ((lat === null || lng === null) && zona) {
    const g = await geocode(zona);
    if (g) { lat = g.lat; lng = g.lng; }
  }
  const radio = typeof args.radio_km === "number" ? args.radio_km : 50;
  const limit = typeof args.limit === "number" ? args.limit : 6;
  const tipos = Array.isArray(args.tipo_actor) ? args.tipo_actor.map(String) : [];
  const productos = Array.isArray(args.productos) ? args.productos.map((p) => String(p).toLowerCase()) : [];

  // Pull layer_actors + profiles (both have lat/lng)
  const [{ data: actors }, { data: profiles }] = await Promise.all([
    sb.from("layer_actors").select("id,name,actor_type,description,address,contact,lat,lng,source_id").limit(500),
    sb.from("profiles").select("user_id,display_name,actor_type,location,description,products,lat,lng").not("lat", "is", null).limit(500),
  ]);

  type Node = { name: string; tipo: string; descripcion: string; contacto: string; lat: number; lng: number; productos: string[]; origen: string };
  const nodes: Node[] = [];
  (actors ?? []).forEach((a: any) => {
    if (a.lat == null || a.lng == null) return;
    nodes.push({
      name: a.name, tipo: a.actor_type ?? "actor",
      descripcion: a.description ?? a.address ?? "",
      contacto: a.contact ?? "",
      lat: a.lat, lng: a.lng,
      productos: [], origen: `Capa: ${a.source_id}`,
    });
  });
  (profiles ?? []).forEach((p: any) => {
    nodes.push({
      name: p.display_name ?? "Sin nombre", tipo: p.actor_type ?? "actor",
      descripcion: p.description ?? p.location ?? "",
      contacto: "",
      lat: p.lat, lng: p.lng,
      productos: Array.isArray(p.products) ? p.products : [],
      origen: "Perfil AgroEco.Red",
    });
  });

  let filtered = nodes;
  if (tipos.length) filtered = filtered.filter((n) => tipos.some((t) => n.tipo?.toLowerCase().includes(t.toLowerCase())));
  if (productos.length) {
    filtered = filtered.filter((n) => {
      const blob = (n.descripcion + " " + n.productos.join(" ") + " " + n.name).toLowerCase();
      return productos.some((p) => blob.includes(p));
    });
  }

  let ranked: (Node & { distancia_km: number | null })[] = filtered.map((n) => ({
    ...n,
    distancia_km: lat !== null && lng !== null ? Math.round(haversine({ lat, lng }, { lat: n.lat, lng: n.lng }) * 10) / 10 : null,
  }));
  if (lat !== null && lng !== null) {
    ranked = ranked.filter((n) => (n.distancia_km ?? 0) <= radio).sort((a, b) => (a.distancia_km! - b.distancia_km!));
  }
  ranked = ranked.slice(0, limit);

  return {
    centro: lat !== null && lng !== null ? { lat, lng, zona } : null,
    total_encontrados: ranked.length,
    nodos: ranked,
    nota: "Resultados del Mapa Vivo de AgroEco.Red.",
  };
}

async function toolBuscarWeb(args: Record<string, unknown>) {
  const query = String(args.query ?? "").slice(0, 200);
  if (!query) return { error: "query required" };
  try {
    // DuckDuckGo Instant Answer API (gratis, sin key)
    const r = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=agroecored`,
    );
    if (!r.ok) return { error: `ddg ${r.status}`, query };
    const d = await r.json();
    const results: { title: string; url: string; snippet: string }[] = [];
    if (d.AbstractText && d.AbstractURL) {
      results.push({ title: d.Heading || query, url: d.AbstractURL, snippet: d.AbstractText });
    }
    const topics = Array.isArray(d.RelatedTopics) ? d.RelatedTopics : [];
    for (const t of topics) {
      if (results.length >= 5) break;
      if (t.FirstURL && t.Text) results.push({ title: t.Text.slice(0, 80), url: t.FirstURL, snippet: t.Text });
      else if (Array.isArray(t.Topics)) {
        for (const tt of t.Topics) {
          if (results.length >= 5) break;
          if (tt.FirstURL && tt.Text) results.push({ title: tt.Text.slice(0, 80), url: tt.FirstURL, snippet: tt.Text });
        }
      }
    }
    return { query, results, source: "DuckDuckGo" };
  } catch (e) {
    return { error: String(e), query };
  }
}

async function execTool(name: string, args: Record<string, unknown>) {
  if (name === "buscar_actores_cercanos") return await toolBuscarActores(args);
  if (name === "buscar_web") return await toolBuscarWeb(args);
  return { error: `unknown tool ${name}` };
}

const isValidMode = (m: unknown): m is ChatMode =>
  m === "general" || m === "onboarding" || m === "map";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null) as
      | { messages?: Array<{ role: string; content: string }>; mode?: string }
      | null;

    if (!body || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid body: messages[] required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mode: ChatMode = isValidMode(body.mode) ? body.mode : "general";

    // Sanitize messages: keep only role + content strings, last 30.
    const cleaned = body.messages
      .filter((m) =>
        m && typeof m === "object" && typeof m.content === "string" &&
        (m.role === "user" || m.role === "assistant")
      )
      .slice(-30)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    if (cleaned.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Tool-calling loop (max 4 iterations).
    const conversation: any[] = [
      { role: "system", content: SYSTEM_PROMPTS[mode] },
      ...cleaned,
    ];
    const toolsUsed: string[] = [];
    let finalText = "";

    for (let i = 0; i < 4; i++) {
      const gatewayRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model: CHAT_MODEL, messages: conversation, tools: TOOLS }),
      });

      if (gatewayRes.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (gatewayRes.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!gatewayRes.ok) {
        const txt = await gatewayRes.text();
        console.error("[chat-asistente] gateway error", gatewayRes.status, txt);
        return new Response(JSON.stringify({ error: "gateway_error", status: gatewayRes.status }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await gatewayRes.json();
      const msg = data?.choices?.[0]?.message;
      if (!msg) break;
      conversation.push(msg);

      const toolCalls = msg.tool_calls;
      if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        finalText = msg.content ?? "";
        break;
      }

      for (const tc of toolCalls) {
        const name = tc?.function?.name;
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(tc?.function?.arguments ?? "{}"); } catch { /* noop */ }
        const result = await execTool(name, args);
        if (!toolsUsed.includes(name)) toolsUsed.push(name);
        conversation.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result).slice(0, 12000),
        });
      }
    }

    return new Response(
      JSON.stringify({ text: finalText || "…", mode, model: CHAT_MODEL, tools_used: toolsUsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[chat-asistente] unhandled", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});