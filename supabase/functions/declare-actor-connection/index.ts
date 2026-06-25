// Lets an actor — already validated via their confirmation_token — weave
// a connection towards another layer_actor. Used from ConfirmActorPage so
// that imported actors (Rutas Sanas, UTT, etc.) can declare their own ties
// without needing an AgroEco.Red account.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_TYPES = new Set(["proveedor", "comprador", "colaboracion", "spg", "intercambio", "red", "otro"]);

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

  const token = String(body?.token || "");
  const targetId = String(body?.target_layer_actor_id || "");
  const ctype = String(body?.connection_type || "");
  const note = typeof body?.note === "string" ? body.note.slice(0, 400) : null;
  const strengthRaw = Number(body?.strength);
  const strength = Number.isFinite(strengthRaw) && strengthRaw >= 1 && strengthRaw <= 5
    ? Math.floor(strengthRaw)
    : 3;

  if (!UUID_RE.test(token)) return bad(400, "Invalid token");
  if (!UUID_RE.test(targetId)) return bad(400, "Invalid target");
  if (!VALID_TYPES.has(ctype)) return bad(400, "Invalid type");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) return bad(500, "Server not configured");

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data, error } = await sb.rpc("declare_connection_by_token", {
    _token: token,
    _target_layer_actor_id: targetId,
    _connection_type: ctype,
    _note: note,
    _strength: strength,
  });
  if (error) return bad(400, error.message || "Could not declare connection");
  return new Response(JSON.stringify({ ok: true, data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});