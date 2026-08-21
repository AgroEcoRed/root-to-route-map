import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
  if (whoErr || !who?.user?.email) return json({ error: "Invalid bearer token" }, 401);

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const email = who.user.email.toLowerCase();
  const { data: invites, error: inviteErr } = await sb
    .from("layer_manager_invites")
    .select("id, layer_id, invited_by")
    .eq("email", email);
  if (inviteErr) return json({ error: inviteErr.message }, 500);

  const claimed: string[] = [];
  for (const invite of invites || []) {
    const { error } = await sb
      .from("layer_managers")
      .upsert({ user_id: who.user.id, layer_id: invite.layer_id, granted_by: invite.invited_by }, { onConflict: "user_id,layer_id" });
    if (!error) claimed.push(invite.layer_id);
  }

  if (claimed.length > 0) {
    const { error: acceptErr } = await sb
      .from("layer_manager_invites")
      .update({ accepted_by: who.user.id, accepted_at: new Date().toISOString() })
      .eq("email", email)
      .in("layer_id", claimed);
    if (acceptErr) return json({ error: acceptErr.message }, 500);

    // Una invitación institucional aceptada completa el alta necesaria para
    // gestionar una capa; no corresponde pedir el registro territorial general.
    const { error: profileErr } = await sb
      .from("profiles")
      .update({ registration_completed: true })
      .eq("user_id", who.user.id);
    if (profileErr) return json({ error: profileErr.message }, 500);
  }

  return json({ ok: true, claimed });
});