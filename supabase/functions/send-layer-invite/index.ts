import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ALLOWED_ORIGINS = new Set(["https://agroeco.red", "https://www.agroeco.red"]);
const DEFAULT_ORIGIN = "https://agroeco.red";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "Missing bearer token" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) return json({ error: "Server not configured" }, 500);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: who, error: whoErr } = await userClient.auth.getUser();
  if (whoErr || !who?.user) return json({ error: "Invalid bearer token" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const email = String(body?.email || "").trim().toLowerCase();
  const layerId = String(body?.layer_id || "").trim();
  if (!EMAIL_RE.test(email)) return json({ error: "Email inválido" }, 400);
  if (!layerId || !/^[a-z0-9_:-]+$/i.test(layerId)) return json({ error: "Capa inválida" }, 400);

  const requestedOrigin = String(body?.origin || "").replace(/\/$/, "");
  const origin = ALLOWED_ORIGINS.has(requestedOrigin) ? requestedOrigin : DEFAULT_ORIGIN;

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: role } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", who.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) return json({ error: "No autorizado" }, 403);

  const { data: source, error: sourceErr } = await sb
    .from("data_source_settings")
    .select("source_id, label")
    .eq("source_id", layerId)
    .maybeSingle();
  if (sourceErr || !source) return json({ error: "La capa no existe" }, 404);

  const { error: inviteErr } = await sb
    .from("layer_manager_invites")
    .upsert({ email, layer_id: layerId, invited_by: who.user.id }, { onConflict: "email,layer_id" });
  if (inviteErr) return json({ error: inviteErr.message }, 500);

  const layerUrl = `/admin/capas/${encodeURIComponent(layerId)}`;
  const inviteLink = `${origin}/ingresar?signup=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(layerUrl)}`;
  const loginLink = `${origin}/ingresar?email=${encodeURIComponent(email)}&next=${encodeURIComponent(layerUrl)}`;
  const subject = `AgroEco.Red — invitación para gestionar la capa ${source.label}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1f2937;line-height:1.55">
      <h2 style="color:#15803d;margin-bottom:4px">Invitación a gestionar una capa del Mapa Vivo</h2>
      <p style="font-size:13px;color:#6b7280;margin-top:0">AgroEco.Red · sistemas alimentarios agroecológicos</p>
      <p>Hola,</p>
      <p>Desde AgroEco.Red queremos invitar al <strong>NAT San Martín</strong> a administrar una capa autónoma del mapeo: <strong>${escapeHtml(source.label)}</strong>.</p>
      <p>La idea es que puedan cargar, revisar, actualizar y verificar los puntos vinculados a su trabajo territorial, sin modificar otras capas de la plataforma.</p>
      <div style="background:#f0fdf4;border-left:4px solid #15803d;padding:12px 14px;border-radius:6px;margin:16px 0">
        <p style="margin:0 0 8px"><strong>Para aceptar la invitación:</strong></p>
        <ol style="margin:0;padding-left:18px">
          <li>Crear una cuenta o ingresar con este correo: <strong>${escapeHtml(email)}</strong>.</li>
          <li>Confirmar el correo si la plataforma lo solicita.</li>
          <li>Entrar al panel de gestión de la capa NAT San Martín.</li>
        </ol>
      </div>
      <p style="margin:18px 0 8px"><a href="${inviteLink}" style="background:#15803d;color:#fff;padding:11px 16px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:700">Registrarse y gestionar la capa</a></p>
      <p style="font-size:12px;color:#6b7280;margin:0 0 16px">Si ya tienen cuenta, pueden ingresar desde este enlace: <a href="${loginLink}">${loginLink}</a></p>
      <p>Al ingresar con ese correo, AgroEco.Red les asignará automáticamente el permiso para administrar únicamente esa capa.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0"/>
      <p style="font-size:12px;color:#9ca3af">Si el enlace no abre, copien y peguen esta dirección en el navegador: ${inviteLink}</p>
    </div>`;

  const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_KEY) return json({ ok: true, sent: false, inviteLink });

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM") || "AgroEco.Red <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    }),
  });
  const txt = await resp.text();
  if (!resp.ok) return json({ ok: false, sent: false, inviteLink, error: txt }, 200);
  return json({ ok: true, sent: true, inviteLink });
});