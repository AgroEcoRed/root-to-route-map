// Chat asistente AgroEco — modos: general | onboarding | map
// Usa Lovable AI Gateway con fetch directo (sin AI SDK).
// Por defecto Gemini 3 Flash. Cambiá CHAT_MODEL para usar otro modelo.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const CHAT_MODEL = "google/gemini-3-flash-preview";

type ChatMode = "general" | "onboarding" | "map";

const SYSTEM_PROMPTS: Record<ChatMode, string> = {
  general:
    `Sos el asistente de AgroEco.Red, una plataforma de agroecología en español. ` +
    `Hablás con tono cálido, territorial y respetuoso. Usá lenguaje inclusivo cuando aplique. ` +
    `Decí "sistemas alimentarios" en lugar de "cadenas". Hablá de "Sistemas Participativos de Garantía (SPG)" en lugar de "certificación". ` +
    `Podés explicar agroecología, SPG, transición, ferias, mercado, y cómo usar la plataforma. ` +
    `Si te preguntan por actores, productos o eventos puntuales, sugerí ir al Mapa Vivo o al Mercado Agroecológico. ` +
    `Respondé en el idioma del usuario (es/en/fr/pt). Sé breve (máx ~120 palabras) salvo que te pidan detalle.`,
  onboarding:
    `Sos un asistente de registro guiado para AgroEco.Red. ` +
    `Acompañás a productorxs, cooperativas, comedores, comercios, instituciones, logística y consumidorxs a registrarse paso a paso. ` +
    `Preguntá una cosa por vez: tipo de actor, nombre, ubicación, qué producen/ofrecen/buscan, métodos de producción, contacto. ` +
    `Sugerí categorías y capas pertinentes según lo que cuentan. Cuando tengan los datos básicos, indicales ir a /registro para completar el formulario. ` +
    `Tono cálido y claro, sin tecnicismos. Lenguaje inclusivo.`,
  map:
    `Sos un buscador semántico del Mapa Vivo de AgroEco.Red. ` +
    `El usuario describe en lenguaje natural qué actores, productos, ferias o saberes busca (ej: "hortalizas a 50km de La Plata con entrega los jueves"). ` +
    `Devolvé en JSON dentro de un bloque \`\`\`json ... \`\`\` con esta forma: { "filtros": { "tipo_actor": [...], "productos": [...], "zona": "...", "radio_km": N, "dias_entrega": [...], "certificacion": "..." }, "explicacion": "..." } ` +
    `Y luego un breve texto explicando qué encontraría. Si no hay info suficiente, pedila.`,
};

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

    const gatewayRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[mode] },
          ...cleaned,
        ],
      }),
    });

    if (gatewayRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "rate_limit" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (gatewayRes.status === 402) {
      return new Response(
        JSON.stringify({ error: "credits_exhausted" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!gatewayRes.ok) {
      const txt = await gatewayRes.text();
      console.error("[chat-asistente] gateway error", gatewayRes.status, txt);
      return new Response(
        JSON.stringify({ error: "gateway_error", status: gatewayRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await gatewayRes.json();
    const text = data?.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ text, mode, model: CHAT_MODEL }),
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