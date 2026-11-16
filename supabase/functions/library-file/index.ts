import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// Signs short-lived URLs only for documents published in the library catalogue
// and bound to their uploader (or the curated SPG seed folder).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let itemId: unknown;
  try { ({ item_id: itemId } = await req.json()); } catch { return json({ error: "bad request" }, 400); }
  if (typeof itemId !== "string" || !/^[0-9a-f-]{36}$/i.test(itemId)) return json({ error: "bad request" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: item } = await admin.from("library_items").select("file_path, uploaded_by").eq("id", itemId).maybeSingle();
  if (!item?.file_path) return json({ error: "not found" }, 404);

  const path = item.file_path as string;
  const folder = path.split("/")[0];
  const { data: obj } = await admin.schema("storage").from("objects")
    .select("owner_id").eq("bucket_id", "biblioteca").eq("name", path).maybeSingle();
  if (!obj) return json({ error: "not found" }, 404);
  const owner = (obj as { owner_id: string | null }).owner_id;
  const bound = owner === item.uploaded_by || folder === item.uploaded_by || (owner === null && folder === "spg-seed");
  if (!bound) return json({ error: "not found" }, 404);

  const { data, error } = await admin.storage.from("biblioteca").createSignedUrl(path, 600);
  if (error || !data?.signedUrl) return json({ error: "unavailable" }, 500);
  return json({ url: data.signedUrl });
});
