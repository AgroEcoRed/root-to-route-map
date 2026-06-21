const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

import { createClient } from "npm:@supabase/supabase-js@2";

// ---- SSRF protection -------------------------------------------------------
function ipToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}
function isPrivateIPv4(ip: string): boolean {
  const n = ipToLong(ip);
  if (n === null) return true; // unparseable → treat as unsafe
  const inRange = (start: string, end: string) => {
    const s = ipToLong(start)!, e = ipToLong(end)!;
    return n >= s && n <= e;
  };
  return (
    inRange("0.0.0.0", "0.255.255.255") ||
    inRange("10.0.0.0", "10.255.255.255") ||
    inRange("127.0.0.0", "127.255.255.255") ||
    inRange("169.254.0.0", "169.254.255.255") ||
    inRange("172.16.0.0", "172.31.255.255") ||
    inRange("192.168.0.0", "192.168.255.255") ||
    inRange("100.64.0.0", "100.127.255.255") ||
    inRange("224.0.0.0", "255.255.255.255")
  );
}
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") || lower.startsWith("fd") || // unique local
    lower.startsWith("fe80") || // link-local
    lower.startsWith("::ffff:") // IPv4-mapped
  );
}
async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { throw new Error("URL inválida"); }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Sólo se permiten URLs http/https");
  }
  const host = parsed.hostname;
  if (!host) throw new Error("URL sin hostname");
  const lowerHost = host.toLowerCase();
  if (lowerHost === "localhost" || lowerHost.endsWith(".localhost") || lowerHost.endsWith(".local") || lowerHost.endsWith(".internal")) {
    throw new Error("Host no permitido");
  }
  // Resolve DNS and ensure no record points to a private range
  const looksLikeIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const looksLikeIPv6 = host.includes(":");
  try {
    if (looksLikeIPv4) {
      if (isPrivateIPv4(host)) throw new Error("IP privada no permitida");
    } else if (looksLikeIPv6) {
      if (isPrivateIPv6(host)) throw new Error("IP privada no permitida");
    } else {
      const [a, aaaa] = await Promise.allSettled([
        Deno.resolveDns(host, "A"),
        Deno.resolveDns(host, "AAAA"),
      ]);
      const aRecords = a.status === "fulfilled" ? a.value : [];
      const aaaaRecords = aaaa.status === "fulfilled" ? aaaa.value : [];
      if (aRecords.length === 0 && aaaaRecords.length === 0) {
        throw new Error("No se pudo resolver el host");
      }
      for (const ip of aRecords) if (isPrivateIPv4(ip)) throw new Error("Host resuelve a IP privada");
      for (const ip of aaaaRecords) if (isPrivateIPv6(ip)) throw new Error("Host resuelve a IP privada");
    }
  } catch (e) {
    throw e instanceof Error ? e : new Error(String(e));
  }
  return parsed;
}

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
    try {
      await requireUser(req);
    } catch {
      return new Response(JSON.stringify({ error: "Necesitás iniciar sesión para usar el registro rápido." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Falta la URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = "https://" + normalizedUrl;

    try {
      await assertSafeUrl(normalizedUrl);
    } catch (e) {
      return new Response(JSON.stringify({ error: `URL no permitida: ${(e as Error).message}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the page content
    let pageText = "";
    let pageTitle = "";
    let fetchError = "";
    // Try direct fetch first
    try {
      const pageRes = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AgroEcoBot/1.0)",
          "Accept": "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
      if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`);
      const html = await pageRes.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      pageTitle = titleMatch?.[1]?.trim() || "";
      pageText = stripHtml(html);
    } catch (e) {
      fetchError = String(e);
    }

    // Fallback: use r.jina.ai reader proxy (handles SSL/JS-rendered/social sites)
    if (!pageText || pageText.length < 50) {
      try {
        const proxied = "https://r.jina.ai/" + normalizedUrl;
        const proxyRes = await fetch(proxied, {
          headers: { "Accept": "text/plain", "User-Agent": "AgroEcoBot/1.0" },
        });
        if (proxyRes.ok) {
          const text = await proxyRes.text();
          if (!pageTitle) {
            const m = text.match(/Title:\s*(.+)/i);
            pageTitle = m?.[1]?.trim() || "";
          }
          pageText = text.replace(/\s+/g, " ").trim().slice(0, 12000);
        }
      } catch (e) {
        fetchError = fetchError || String(e);
      }
    }

    if (!pageText || pageText.length < 50) {
      return new Response(JSON.stringify({
        error: "No pudimos leer el contenido de esa URL. Probá con un sitio web público (no Instagram privado).",
        details: fetchError,
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
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Sin créditos de IA disponibles." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Error del servicio de IA", details: errTxt }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
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