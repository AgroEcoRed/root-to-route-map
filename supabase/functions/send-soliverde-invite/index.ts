// Función temporal de un solo uso: envía la invitación de administración de la
// capa Soliverde a Solidaires desde info@agroeco.red y registra la invitación.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const EMAIL = "solidaires.argentine@gmail.com";
const LAYER_ID = "soliverde";
const ORIGIN = "https://agroeco.red";

Deno.serve(async () => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: source } = await sb
    .from("data_source_settings")
    .select("source_id,label")
    .eq("source_id", LAYER_ID)
    .maybeSingle();
  if (!source) return new Response(JSON.stringify({ error: "layer missing" }), { status: 404 });

  const { error: inviteErr } = await sb
    .from("layer_manager_invites")
    .upsert({ email: EMAIL, layer_id: LAYER_ID }, { onConflict: "email,layer_id" });
  if (inviteErr) return new Response(JSON.stringify({ error: inviteErr.message }), { status: 500 });

  const layerUrl = `/admin/capas/${LAYER_ID}`;
  const inviteLink = `${ORIGIN}/ingresar?signup=1&email=${encodeURIComponent(EMAIL)}&next=${encodeURIComponent(layerUrl)}`;
  const loginLink = `${ORIGIN}/ingresar?email=${encodeURIComponent(EMAIL)}&next=${encodeURIComponent(layerUrl)}`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1f2937;line-height:1.55">
    <h2 style="color:#15803d;margin-bottom:4px">Invitación à gérer une couche de la carte vivante / Invitación a gestionar una capa del Mapa Vivo</h2>
    <p style="font-size:13px;color:#6b7280;margin-top:0">AgroEco.Red · sistemas alimentarios agroecológicos</p>
    <p>Bonjour / Hola,</p>
    <p>Desde AgroEco.Red creamos una capa propia para <strong>Soliverde — Solidaires</strong>, para que el relevamiento de iniciativas ecológicas francófonas se transforme directamente en mapeo.</p>
    <p>Podrán cargar, importar (Excel), editar, verificar y geolocalizar sus registros sin tocar otras capas. Cada punto tiene un interruptor <strong>“Visible en el mapa público”</strong>: lo agroecológico puede publicarse en el mapa general, mientras que bioconstrucción, turismo sustentable y demás registros quedan marcados como internos y sólo los ve el equipo de la capa.</p>
    <div style="background:#f0fdf4;border-left:4px solid #15803d;padding:12px 14px;border-radius:6px;margin:16px 0">
      <p style="margin:0 0 8px"><strong>Para aceptar la invitación:</strong></p>
      <ol style="margin:0;padding-left:18px">
        <li>Crear una cuenta o ingresar con este correo: <strong>${EMAIL}</strong>.</li>
        <li>Confirmar el correo si la plataforma lo solicita.</li>
        <li>Entrar al panel de gestión de la capa Soliverde.</li>
      </ol>
    </div>
    <p style="margin:18px 0 8px"><a href="${inviteLink}" style="background:#15803d;color:#fff;padding:11px 16px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:700">Registrarse y gestionar la capa</a></p>
    <p style="font-size:12px;color:#6b7280;margin:0 0 16px">Si ya tienen cuenta: <a href="${loginLink}">${loginLink}</a></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0"/>
    <p style="font-size:12px;color:#9ca3af">Si el enlace no abre, copien y peguen esta dirección: ${inviteLink}</p>
  </div>`;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "AgroEco.Red <info@agroeco.red>",
      reply_to: "info@agroeco.red",
      to: [EMAIL],
      subject: "AgroEco.Red — invitación para gestionar la capa Soliverde (Solidaires)",
      html,
    }),
  });
  const txt = await resp.text();
  return new Response(JSON.stringify({ ok: resp.ok, resend: txt, inviteLink }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
