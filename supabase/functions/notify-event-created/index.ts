// Sends a confirmation email to the focal point of a new event, including
// the share link, the public URL, and a token-based edit link.
// Uses Resend if RESEND_API_KEY is configured; otherwise logs and returns ok.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Allowed origins for the public-facing links embedded in the email body.
// We never trust a client-supplied `origin`: an attacker calling this
// function could otherwise turn it into an open relay that emails arbitrary
// recipients with attacker-controlled links pointing to phishing pages.
const ALLOWED_ORIGINS = new Set<string>([
  "https://agroeco.red",
  "https://www.agroeco.red",
]);
const DEFAULT_ORIGIN = "https://agroeco.red";

function bad(status: number, msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad(405, "Method not allowed");

  // ---- AuthN: must be an authenticated Supabase user ---------------------
  // The function uses the platform's email-sending budget and writes
  // emails on behalf of AgroEco.Red, so unauthenticated callers are
  // rejected to prevent abuse / open-relay scenarios.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return bad(401, "Missing bearer token");
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) return bad(500, "Server not configured");

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: who, error: whoErr } = await userClient.auth.getUser();
  if (whoErr || !who?.user) return bad(401, "Invalid bearer token");

  let body: any = null;
  try { body = await req.json(); } catch { return bad(400, "Invalid JSON"); }

  const eventId = String(body?.event_id || "");
  if (!UUID_RE.test(eventId)) return bad(400, "Invalid event_id");
  // Origin is validated against an allowlist — never reflect a client value
  // verbatim into outbound links.
  const requestedOrigin = String(body?.origin || "").replace(/\/$/, "");
  const origin = ALLOWED_ORIGINS.has(requestedOrigin) ? requestedOrigin : DEFAULT_ORIGIN;
  // `to_override` is intentionally removed: previously any caller could
  // force the email to land in an arbitrary inbox of their choice, which
  // made this endpoint usable as an open relay. Recipients are now always
  // derived server-side from the event's own focal/contact fields.

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: ev, error } = await sb
    .from("events")
    .select("id, title, description, starts_at, location_name, focal_name, focal_email, contact_email, submitted_by_name, edit_token, flyer_url")
    .eq("id", eventId)
    .maybeSingle();
  if (error || !ev) return bad(404, "Event not found");

  // Only the event owner or a platform admin may trigger the notification
  // for a given event. This keeps a legitimate authenticated user from
  // spamming focal emails of events they don't own.
  const callerId = who.user.id;
  const { data: ownerRow } = await sb
    .from("events").select("created_by").eq("id", eventId).maybeSingle();
  const isOwner = ownerRow?.created_by === callerId;
  let isAdmin = false;
  if (!isOwner) {
    const { data: roleRow } = await sb
      .from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
    isAdmin = !!roleRow;
  }
  if (!isOwner && !isAdmin) return bad(403, "Not allowed for this event");

  // focal_email puede ser una lista separada por comas (puntos focales primarios).
  const targets: string[] = [];
  const pushEmails = (raw: unknown) => {
    String(raw || "")
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => /.+@.+\..+/.test(s))
      .forEach((e) => { if (!targets.includes(e)) targets.push(e); });
  };
  pushEmails(ev.focal_email);
  pushEmails(ev.contact_email);

  const editLink = `${origin}/eventos/editar/${ev.edit_token}`;
  const mapLink = `${origin}/mapa?event=${ev.id}`;
  const registerLink = `${origin}/ingresar?next=${encodeURIComponent("/perfil")}`;

  const subject = `AgroEco.Red — Confirmá tu actividad: ${ev.title}`;
  const safeFlyerUrl = (raw: unknown): string | null => {
    if (typeof raw !== "string" || raw.length > 2000) return null;
    let u: URL;
    try { u = new URL(raw.trim()); } catch { return null; }
    if (u.protocol !== "https:") return null;
    // Only images served from this project's own storage domain are embedded.
    let projectHost = "";
    try { projectHost = new URL(Deno.env.get("SUPABASE_URL") ?? "").host; } catch { /* noop */ }
    if (!projectHost || u.host !== projectHost) return null;
    if (!u.pathname.startsWith("/storage/v1/")) return null;
    return u.toString();
  };
  const flyer = safeFlyerUrl((ev as any).flyer_url);
  const flyerBlock = flyer
    ? `<p style="margin:14px 0 6px"><img src="${escapeHtml(flyer)}" alt="Flyer" style="max-width:100%;border-radius:8px;border:1px solid #e5e7eb"/></p>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1f2937;line-height:1.55">
      <h2 style="color:#15803d;margin-bottom:4px">Tu actividad fue publicada en AgroEco.Red</h2>
      <p style="font-size:13px;color:#6b7280;margin-top:0">Mapa Vivo de los sistemas alimentarios agroecológicos</p>
      <p>Hola${ev.focal_name ? ` <strong>${escapeHtml(ev.focal_name)}</strong>` : ""},</p>
      <p>${ev.submitted_by_name ? escapeHtml(ev.submitted_by_name) + " cargó" : "Se cargó"} la siguiente actividad y te designó como punto focal:</p>
      <p style="background:#f0fdf4;border-left:4px solid #15803d;padding:10px 14px;border-radius:6px">
        <strong>${escapeHtml(ev.title)}</strong><br/>
        ${ev.starts_at ? `📅 ${formatAR(ev.starts_at)}<br/>` : ""}
        ${ev.location_name ? `📍 ${escapeHtml(ev.location_name)}` : ""}
      </p>
      ${flyerBlock}

      <h3 style="color:#15803d;font-size:15px;margin:22px 0 6px">1. Confirmá o modificá los datos de la actividad</h3>
      <p style="margin:0 0 10px">Este link privado te permite editar fecha, lugar, descripción, flyer y datos de contacto:</p>
      <p style="margin:0"><a href="${editLink}" style="background:#15803d;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">Revisar / editar la actividad</a></p>
      <p style="font-size:12px;color:#6b7280;margin:6px 0 0">O copiá: ${editLink}</p>

      <h3 style="color:#15803d;font-size:15px;margin:24px 0 6px">2. Registrá tu experiencia / colectivo</h3>
      <p style="margin:0 0 10px">Te invitamos a sumar tu experiencia o la de tu colectivo al Mapa Vivo. Podés registrarte con el correo que más te represente — institucional, personal o de un colectivo — y desde tu perfil declarar vínculos con otros actores de la red.</p>
      <p style="margin:0"><a href="${registerLink}" style="background:#0f766e;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">Crear mi cuenta en AgroEco.Red</a></p>
      <p style="font-size:12px;color:#6b7280;margin:6px 0 0">El correo de acceso lo elegís vos en ese paso; no necesita coincidir con este.</p>

      <h3 style="color:#15803d;font-size:15px;margin:24px 0 6px">3. Compartí el mapa con tu red</h3>
      <p style="margin:0">Tu actividad aparece como una estrella titilante en el mapa público:<br/>
        <a href="${mapLink}">${mapLink}</a>
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0"/>
      <p style="font-size:12px;color:#9ca3af">Si no reconocés esta actividad, ignorá este mensaje o escribinos a info@agroeco.red.</p>
    </div>`;

  const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_KEY || targets.length === 0) {
    console.log("notify-event-created: skipped (no key or no targets)", { eventId, targets });
    return new Response(JSON.stringify({ ok: true, sent: false, editLink }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") || "AgroEco.Red <onboarding@resend.dev>",
        to: targets,
        subject,
        html,
      }),
    });
    const txt = await resp.text();
    if (!resp.ok) {
      console.error("Resend error", resp.status, txt);
      return new Response(JSON.stringify({ ok: false, sent: false, editLink, error: txt }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, sent: true, editLink }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-event-created send error", e);
    return new Response(JSON.stringify({ ok: false, sent: false, editLink }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Formatea una fecha ISO en horario argentino (UTC-3), 24 h. Evita el
// bug de mostrar 17:00 UTC ("5:00 PM") cuando la actividad es a las 14 h AR.
function formatAR(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const fmt = new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    return fmt.format(d) + " h (hora AR)";
  } catch { return iso; }
}