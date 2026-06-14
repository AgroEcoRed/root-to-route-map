import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SHOP_API = "https://panel.tiendaschasqui.ar/shop-api";
const VENDURE_TOKEN = "mtr";
const CATALOG_URL = "https://tiendaschasqui.ar/mtr/catalogo";

const SEARCH_QUERY = `query Search($take: Int!, $skip: Int!) {
  search(input: { take: $take, skip: $skip, groupByProduct: true }) {
    totalItems
    items {
      productId
      productName
      slug
      description
      productAsset { preview }
      priceWithTax {
        __typename
        ... on SinglePrice { value }
        ... on PriceRange { min max }
      }
      currencyCode
      facetValueIds
      collectionIds
      inStock
    }
  }
}`;

const FACETS_QUERY = `{
  facets(options: { take: 50 }) {
    items {
      code
      name
      values { id code name }
    }
  }
}`;

async function gql<T = any>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(SHOP_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "vendure-token": VENDURE_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data as T;
}

function priceFromItem(p: any): number | null {
  const pw = p.priceWithTax;
  if (!pw) return null;
  if (typeof pw.value === "number") return pw.value;
  if (typeof pw.min === "number") return pw.min;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: logRow } = await supabase
    .from("mtr_sync_log")
    .insert({ status: "running" })
    .select("id")
    .single();
  const logId = logRow?.id;

  try {
    // 1. Sync facets
    const facetsData: any = await gql(FACETS_QUERY);
    const facetRows: any[] = [];
    for (const facet of facetsData.facets.items) {
      for (const v of facet.values || []) {
        facetRows.push({
          code: v.id, // use id as PK to match facetValueIds
          name: v.name,
          facet_code: facet.code,
          facet_name: facet.name,
          external_id: v.id,
          updated_at: new Date().toISOString(),
        });
      }
    }
    if (facetRows.length > 0) {
      const { error: fErr } = await supabase.from("mtr_facets").upsert(facetRows, { onConflict: "code" });
      if (fErr) throw fErr;
    }

    // 2. Sync products (paginated)
    const take = 100;
    let skip = 0;
    let total = Infinity;
    let synced = 0;
    const seenIds = new Set<string>();

    while (skip < total) {
      const data: any = await gql(SEARCH_QUERY, { take, skip });
      total = data.search.totalItems;
      const items = data.search.items as any[];
      if (items.length === 0) break;

      const rows = items.map((it) => {
        seenIds.add(it.productId);
        return {
          product_id: it.productId,
          name: it.productName,
          slug: it.slug,
          description: it.description,
          image_url: it.productAsset?.preview ?? null,
          price_cents: priceFromItem(it),
          currency: it.currencyCode ?? "ARS",
          facet_value_ids: it.facetValueIds ?? [],
          collection_ids: it.collectionIds ?? [],
          in_stock: !!it.inStock,
          source_url: `${CATALOG_URL}/${it.slug}`,
          updated_at: new Date().toISOString(),
        };
      });

      const { error: upErr } = await supabase.from("mtr_products").upsert(rows, { onConflict: "product_id" });
      if (upErr) throw upErr;
      synced += rows.length;
      skip += take;
    }

    // 3. Remove products no longer in catalog
    if (seenIds.size > 0) {
      await supabase.from("mtr_products").delete().not("product_id", "in", `(${Array.from(seenIds).map(id => `"${id}"`).join(",")})`);
    }

    if (logId) {
      await supabase.from("mtr_sync_log").update({
        status: "success",
        finished_at: new Date().toISOString(),
        products_synced: synced,
        facets_synced: facetRows.length,
      }).eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: true, products_synced: synced, facets_synced: facetRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[sync-mtr-catalog] error", err);
    if (logId) {
      await supabase.from("mtr_sync_log").update({
        status: "error",
        finished_at: new Date().toISOString(),
        error_message: err?.message ?? String(err),
      }).eq("id", logId);
    }
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});