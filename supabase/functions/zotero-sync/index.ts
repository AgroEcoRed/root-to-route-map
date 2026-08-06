// Integración con Zotero: lista bibliotecas accesibles con una API key e importa
// colecciones + ítems (solo metadatos, sin archivos adjuntos) a la Biblioteca.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ZOTERO = "https://api.zotero.org";

const zfetch = async (path: string, apiKey: string) => {
  const r = await fetch(`${ZOTERO}${path}`, {
    headers: { "Zotero-API-Key": apiKey, "Zotero-API-Version": "3" },
  });
  if (!r.ok) throw new Error(`Zotero ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r;
};

const zall = async (basePath: string, apiKey: string) => {
  const out: any[] = [];
  let start = 0;
  // paginación de 100 en 100
  for (let i = 0; i < 60; i++) {
    const sep = basePath.includes("?") ? "&" : "?";
    const r = await zfetch(`${basePath}${sep}limit=100&start=${start}`, apiKey);
    const page = await r.json();
    out.push(...page);
    if (page.length < 100) break;
    start += 100;
  }
  return out;
};

const TYPE_MAP: Record<string, string> = {
  journalArticle: "article", magazineArticle: "article", newspaperArticle: "article",
  preprint: "article", conferencePaper: "article",
  book: "book", bookSection: "chapter", thesis: "thesis",
  report: "report", webpage: "web", blogPost: "web", document: "report",
};

const creatorName = (c: any): string =>
  c?.name ? String(c.name).trim() : `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    if (!token) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (!apiKey) return json({ error: "Falta la API key de Zotero" }, 400);
    const action = body.action === "import" ? "import" : "libraries";

    const me = await (await zfetch("/keys/current", apiKey)).json();
    const zUserId = me?.userID;

    if (action === "libraries") {
      const groups = zUserId ? await zall(`/users/${zUserId}/groups`, apiKey) : [];
      return json({
        libraries: [
          ...(zUserId ? [{ type: "user", id: String(zUserId), name: "Mi biblioteca personal" }] : []),
          ...groups.map((g: any) => ({ type: "group", id: String(g.id), name: g.data?.name ?? `Grupo ${g.id}` })),
        ],
      });
    }

    const libType = body.libraryType === "user" ? "users" : "groups";
    const libId = String(body.libraryId ?? "").replace(/\D/g, "");
    if (!libId) return json({ error: "Falta la biblioteca de Zotero" }, 400);
    const onlyOpen = body.onlyOpenAccess !== false;
    const base = `/${libType}/${libId}`;

    // 1) Colecciones (aplanadas: se usa el nombre de la subcarpeta)
    const zCollections = await zall(`${base}/collections`, apiKey);
    const nameByKey = new Map<string, string>();
    for (const c of zCollections) nameByKey.set(c.key, String(c.data?.name ?? "").trim());

    const { data: existingCols } = await admin.from("library_collections").select("id,name");
    const colIdByName = new Map<string, string>((existingCols ?? []).map((c: any) => [c.name.toLowerCase(), c.id]));
    const colIdByKey = new Map<string, string>();

    for (const c of zCollections) {
      const name = nameByKey.get(c.key) || "Sin nombre";
      const existing = colIdByName.get(name.toLowerCase());
      if (existing) { colIdByKey.set(c.key, existing); continue; }
      const { data: created, error } = await admin
        .from("library_collections")
        .insert({ name, description: "Importada desde Zotero", created_by: userId })
        .select("id").single();
      if (!error && created) {
        colIdByName.set(name.toLowerCase(), created.id);
        colIdByKey.set(c.key, created.id);
      }
    }

    // 2) Ítems (solo metadatos)
    const zItems = await zall(`${base}/items?itemType=-attachment%20||%20note`, apiKey);

    const { data: existingItems } = await admin.from("library_items").select("title,doi");
    const seenTitles = new Set((existingItems ?? []).map((i: any) => String(i.title ?? "").toLowerCase().trim()));
    const seenDois = new Set((existingItems ?? []).map((i: any) => String(i.doi ?? "").toLowerCase()).filter(Boolean));

    const rows: any[] = [];
    let skippedClosed = 0;
    for (const it of zItems) {
      const d = it.data ?? {};
      if (d.itemType === "attachment" || d.itemType === "note") continue;
      const title = String(d.title ?? "").trim();
      if (!title) continue;
      const doi = String(d.DOI ?? "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim() || null;
      const url = String(d.url ?? "").trim() || null;
      if (onlyOpen && !doi && !url) { skippedClosed++; continue; }
      const key = title.toLowerCase();
      if (seenTitles.has(key) || (doi && seenDois.has(doi.toLowerCase()))) continue;
      seenTitles.add(key);
      if (doi) seenDois.add(doi.toLowerCase());

      const year = Number(String(d.date ?? "").match(/\d{4}/)?.[0]) || null;
      const colKey = (d.collections ?? [])[0];
      rows.push({
        title,
        authors: (d.creators ?? []).map(creatorName).filter(Boolean),
        year,
        item_type: TYPE_MAP[d.itemType] ?? "article",
        doi,
        url,
        journal: d.publicationTitle || d.bookTitle || d.proceedingsTitle || null,
        publisher: d.publisher || d.university || d.institution || null,
        abstract: d.abstractNote ? String(d.abstractNote).slice(0, 4000) : null,
        tags: (d.tags ?? []).map((t: any) => String(t.tag ?? "").toLowerCase().trim()).filter(Boolean).slice(0, 12),
        uploaded_by: userId,
        collection_id: colKey ? colIdByKey.get(colKey) ?? null : null,
        license: typeof body.license === "string" ? body.license : "cc-by-sa-4.0",
      });
    }

    let inserted = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const { error } = await admin.from("library_items").insert(chunk);
      if (error) return json({ error: error.message, inserted }, 500);
      inserted += chunk.length;
    }

    return json({
      inserted,
      collections: colIdByKey.size,
      totalFound: zItems.length,
      skippedClosed,
      skippedDuplicates: zItems.length - inserted - skippedClosed,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
