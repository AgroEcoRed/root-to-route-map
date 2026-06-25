// Public edit flow for events by token.
// Anyone with the per-event edit_token (sent to focal_email) can read & update
// a small allowlist of fields without a login.
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
function iso(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad(405, "Method not allowed");

  let body: any = null;
  try { body = await req.json(); } catch { return bad(400, "Invalid JSON"); }

  const token = str(body?.token, 64);
  const action = str(body?.action, 16);
  if (!token || !UUID_RE.test(token)) return bad(400, "Invalid token");
  if (action !== "get" && action !== "update") return bad(400, "Invalid action");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) return bad(500, "Server not configured");

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (action === "get") {
    const { data, error } = await sb.rpc("get_event_by_edit_token", { _token: token });
    if (error) return bad(500, "Lookup failed");
    const row: any = Array.isArray(data) ? data[0] : data;
    if (!row) return bad(404, "Not found");
    return new Response(JSON.stringify(row), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // action === "update"
  const params = {
    _token: token,
    _title: str(body?.title, 240),
    _description: str(body?.description, 4000),
    _starts_at: iso(body?.starts_at),
    _ends_at: iso(body?.ends_at),
    _location_name: str(body?.location_name, 300),
    _link: str(body?.link, 500),
    _lat: num(body?.lat),
    _lng: num(body?.lng),
    _contact: str(body?.contact, 300),
    _contact_email: str(body?.contact_email, 200),
    _contact_phone: str(body?.contact_phone, 60),
    _focal_name: str(body?.focal_name, 200),
    _focal_email: str(body?.focal_email, 200),
  };

  const { data, error } = await sb.rpc("update_event_by_token", params);
  if (error) return bad(400, error.message || "Update failed");
  const row: any = Array.isArray(data) ? data[0] : data;
  if (!row) return bad(404, "Not found");
  return new Response(JSON.stringify(row), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});