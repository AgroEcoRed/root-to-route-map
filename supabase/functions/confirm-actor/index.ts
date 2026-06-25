// Public confirmation flow for layer_actors.
// The DB token-RPCs are no longer callable by anon; this function gates
// access by the per-row confirmation token (the credential) and uses
// service_role server-side to invoke them.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bad(status: number, msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function str(v: unknown, max = 2000): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}
function num(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}
function strArr(v: unknown, maxItems = 20, maxLen = 80): string[] | null {
  if (!Array.isArray(v)) return null;
  return v
    .filter((x): x is string => typeof x === "string")
    .slice(0, maxItems)
    .map((s) => s.trim().slice(0, maxLen))
    .filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad(405, "Method not allowed");

  let body: any = null;
  try { body = await req.json(); } catch { return bad(400, "Invalid JSON"); }

  const token = str(body?.token, 64);
  const action = str(body?.action, 16);
  if (!token || !UUID_RE.test(token)) return bad(400, "Invalid token");
  if (action !== "get" && action !== "confirm") return bad(400, "Invalid action");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) return bad(500, "Server not configured");

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (action === "get") {
    const { data, error } = await sb.rpc("get_actor_by_token", { _token: token });
    if (error) return bad(500, "Lookup failed");
    if (!data) return bad(404, "Not found");
    // Strip server-only fields before returning to the public.
    const row: any = Array.isArray(data) ? data[0] : data;
    if (!row) return bad(404, "Not found");
    const { confirmation_token: _t, confirmation_email: _e, confirmation_phone: _p, ...safe } = row;
    return new Response(JSON.stringify(safe), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // action === "confirm"
  const decision = str(body?.decision, 16);
  if (decision !== "confirmed" && decision !== "rejected") return bad(400, "Invalid decision");

  const params = {
    _token: token,
    _decision: decision,
    _name: str(body?.name, 240),
    _description: str(body?.description, 4000),
    _address: str(body?.address, 500),
    _contact: str(body?.contact, 300),
    _delivery_days: strArr(body?.delivery_days),
    _lat: num(body?.lat),
    _lng: num(body?.lng),
  };

  const { data, error } = await sb.rpc("confirm_actor_by_token", params);
  if (error) return bad(400, error.message || "Confirmation failed");
  const row: any = Array.isArray(data) ? data[0] : data;
  if (!row) return bad(404, "Not found");
  const { confirmation_token: _t, confirmation_email: _e, confirmation_phone: _p, ...safe } = row;
  return new Response(JSON.stringify(safe), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});