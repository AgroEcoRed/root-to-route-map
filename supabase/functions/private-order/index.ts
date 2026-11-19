import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

const hashAccessKey = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 2048) return json({ error: "Solicitud inválida" }, 400);
    const body = await request.json();
    const orderSlug = body?.orderSlug;
    const accessKey = body?.accessKey;
    if (
      typeof orderSlug !== "string" ||
      !/^[a-z0-9-]{3,100}$/.test(orderSlug) ||
      typeof accessKey !== "string" ||
      accessKey.length < 20 ||
      accessKey.length > 200
    ) {
      return json({ error: "Solicitud inválida" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Acceso no disponible" }, 500);

    const db = createClient(url, serviceKey, { auth: { persistSession: false } });
    const keyHash = await hashAccessKey(accessKey);
    const { data, error } = await db
      .from("private_order_links")
      .select("payload")
      .eq("order_slug", orderSlug)
      .eq("access_key_hash", keyHash)
      .is("revoked_at", null)
      .maybeSingle();

    if (error) return json({ error: "Acceso no disponible" }, 500);
    if (!data?.payload) return json({ error: "Acceso no disponible" }, 401);
    return json({ order: data.payload });
  } catch {
    return json({ error: "Solicitud inválida" }, 400);
  }
});
