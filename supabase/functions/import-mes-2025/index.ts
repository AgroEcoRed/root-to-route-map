import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: file, error: dlErr } = await supabase.storage
    .from("biblioteca")
    .download("imports/mes2025.json");
  if (dlErr || !file) {
    return new Response(JSON.stringify({ error: dlErr?.message }), { status: 500 });
  }

  const rows = JSON.parse(await file.text());

  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("layer_id", "mes_agroecologia");
  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ skipped: true, existing: count }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error } = await supabase.from("events").insert(rows);
  return new Response(JSON.stringify({ inserted: error ? 0 : rows.length, error: error?.message }), {
    headers: { "Content-Type": "application/json" },
  });
});
