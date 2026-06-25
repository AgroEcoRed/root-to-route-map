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

function bad(status: number, msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad(405, "Method not allowed");

  let body: any = null;
  try { body = await req.json(); } catch { return bad(400, "Invalid JSON"); }

  const eventId = String(body?.event_id || "");
  if (!UUID_RE.test(eventId)) return bad(400, "Invalid event_id");
  const origin = String(body?.origin || "https://agroeco.red").replace(/\/$/, "");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) return bad(500, "Server not configured");

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: ev, error } = await sb
    .from("events")
    .select("id, title, starts_at, location_name, focal_name, focal_email, contact_email, submitted_by_name, edit_token")
    .eq("id", eventId)
    .maybeSingle();
  if (error || !ev) return bad(404, "Event not found");

  const targets: string[] = [];
  if (ev.focal_email) targets.push(String(ev.focal_email));
  if (ev.contact_email && !targets.includes(String(ev.contact_email))) targets.push(String(ev.contact_email));

  const editLink = `${origin}/eventos/editar/${ev.edit_token}`;
  const publicLink = `${origin}/mapa`;

  const subject = `AgroEco.Red — Confirmá tu actividad: ${ev.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937;line-height:1.5">
      <h2 style="color:#15803d">Tu actividad fue publicada en AgroEco.Red</h2>
      <p>Hola${ev.focal_name ? ` <strong>${escapeHtml(ev.focal_name)}</strong>` : ""},</p>
      <p>${ev.submitted_by_name ? escapeHtml(ev.submitted_by_name) + " cargó" : "Se cargó"} la siguiente actividad y te designó como punto focal:</p>
      <p style="background:#f0fdf4;border-left:4px solid #15803d;padding:10px 14px;border-radius:6px">
        <strong>${escapeHtml(ev.title)}</strong><br/>
        ${ev.starts_at ? `📅 ${new Date(ev.starts_at).toLocaleString("es-AR")}<br/>` : ""}
        ${ev.location_name ? `📍 ${escapeHtml(ev.location_name)}` : ""}
      </p>
      <p>Podés <strong>revisar y modificar</strong> los datos en cualquier momento desde este link privado:</p>
      <p><a href="${editLink}" style="background:#15803d;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">Editar mi actividad</a></p>
      <p style="font-size:13px;color:#6b7280">O copialo: ${editLink}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0"/>
      <p style="font-size:13px;color:#6b7280">Ver el mapa público: <a href="${publicLink}">${publicLink}</a></p>
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
        from: Deno.env.get("RESEND_FROM") || "AgroEco.Red <no-reply@agroeco.red>",
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