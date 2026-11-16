import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { canDownloadExport, canReviewExport, csvCell } from "./permissions.ts";
import { selectPublicActivities } from "../_shared/activityFeed.ts";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) throw new Error("Missing configuration");
    const body = await req.json();
    if (!body || !["layers", "request", "review", "download"].includes(body.action)) return json({ error: "Solicitud inválida" }, 400);
    const db = createClient(url, service, { auth: { persistSession: false } });
    if (body.action === "layers") {
      const { data, error } = await db.from("data_source_settings").select("source_id,label").eq("enabled", true).order("label");
      if (error) throw error;
      return json({ layers: data });
    }
    const header = req.headers.get("Authorization") || "";
    if (!header.startsWith("Bearer ")) return json({ error: "Ingresá para solicitar o descargar una exportación" }, 401);
    const auth = createClient(url, anon, { global: { headers: { Authorization: header } } });
    const { data: claims, error: authError } = await auth.auth.getClaims(header.slice(7));
    const userId = claims?.claims?.sub;
    if (authError || !userId) return json({ error: "Ingresá nuevamente" }, 401);
    const layerId = body.layer_id;
    if (typeof layerId !== "string" || !/^[a-z0-9_]{1,80}$/.test(layerId)) return json({ error: "Capa inválida" }, 400);
    const { data: layer, error: layerError } = await db.from("data_source_settings").select("source_id,label,enabled,privacy").eq("source_id", layerId).maybeSingle();
    if (layerError) throw layerError;
    if (!layer) return json({ error: "Capa no disponible" }, 404);
    const { data: manager, error: managerError } = await db.rpc("can_manage_layer", { _user_id: userId, _layer_id: layerId });
    if (managerError) throw managerError;
    if (body.action === "request") {
      if (!layer.enabled) return json({ error: "Capa no disponible" }, 403);
      const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
      const name = typeof body.requester_name === "string" ? body.requester_name.trim() : "";
      if (purpose.length < 10 || purpose.length > 2000 || !name || name.length > 120) return json({ error: "Completá tu nombre y el motivo (10 a 2000 caracteres)" }, 400);
      const { data: existing, error: existingError } = await db.from("layer_export_requests").select("id,status").eq("layer_id", layerId).eq("requester_id", userId).maybeSingle();
      if (existingError) throw existingError;
      if (existing && ["pending", "approved"].includes(existing.status)) return json({ status: existing.status });
      const values = { layer_id: layerId, requester_id: userId, requester_name: name, purpose, status: "pending", reviewed_by: null, reviewed_at: null };
      const result = existing ? await db.from("layer_export_requests").update(values).eq("id", existing.id).eq("status", existing.status) : await db.from("layer_export_requests").insert(values);
      if (result.error) throw result.error;
      return json({ status: "pending" });
    }
    if (body.action === "review") {
      if (!manager) return json({ error: "Solo quienes administran esta capa pueden decidir" }, 403);
      if (typeof body.request_id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.request_id)) return json({ error: "Solicitud inválida" }, 400);
      const { data: request, error } = await db.from("layer_export_requests").select("id,status").eq("id", body.request_id).eq("layer_id", layerId).maybeSingle();
      if (error) throw error;
      if (!request || !canReviewExport(!!manager, request.status, body.status)) return json({ error: "Decisión no permitida" }, 409);
      const { data: changed, error: updateError } = await db.from("layer_export_requests").update({ status: body.status, reviewed_by: userId, reviewed_at: new Date().toISOString() }).eq("id", request.id).eq("status", request.status).select("id");
      if (updateError) throw updateError;
      if (!changed?.length) return json({ error: "La solicitud cambió; actualizá la lista" }, 409);
      return json({ status: body.status });
    }
    const { data: permission, error: permissionError } = await db.from("layer_export_requests").select("status").eq("layer_id", layerId).eq("requester_id", userId).maybeSingle();
    if (permissionError) throw permissionError;
    if (!canDownloadExport(permission?.status, !!manager, layer.enabled)) return json({ error: "La exportación requiere aprobación de quienes administran la capa" }, 403);
    if (!["geojson", "csv"].includes(body.format)) return json({ error: "Formato inválido" }, 400);
    // Only the privacy-rewritten public rows; never layer_actor_private or extra/contact metadata.
    const features: any[] = [];
    for (let offset = 0; ; offset += 500) {
      if (offset >= 20000) return json({ error: "Esta capa es demasiado grande para descargarla de una vez" }, 413);
      const { data, error } = await db.from("layer_actors").select("id,name,lat,lng,actor_type,description,address").eq("source_id", layerId).eq("public_visible", true).order("id").range(offset, offset + 499);
      if (error) throw error;
      for (const actor of data || []) features.push({ type: "Feature", geometry: { type: "Point", coordinates: [actor.lng, actor.lat] }, properties: { id: actor.id, name: actor.name, type: actor.actor_type, description: actor.description, location: actor.address, layer: layerId, source: "https://agroeco.red", license: "ODbL-1.0" } });
      if (!data || data.length < 500) break;
    }
    const events: Array<{ id: string; title: string; description: string | null; starts_at: string; ends_at: string | null; location_name: string | null; created_at: string; approved: boolean; layer_id: string | null; lat: number | null; lng: number | null }> = [];
    for (let offset = 0; ; offset += 500) {
      if (offset >= 20000) return json({ error: "Esta capa es demasiado grande para descargarla de una vez" }, 413);
      const { data, error } = await db.from("public_events").select("id,title,description,starts_at,ends_at,location_name,created_at,approved,layer_id,lat,lng").eq("layer_id", layerId).eq("approved", true).order("id").range(offset, offset + 499);
      if (error) throw error;
      events.push(...(data || []));
      if (!data || data.length < 500) break;
    }
    for (const event of selectPublicActivities(events, [layer], Date.now(), events.length)) {
      const point = events.find(e => e.id === event.id);
      features.push({ type: "Feature", geometry: point?.lat != null && point?.lng != null ? { type: "Point", coordinates: [point.lng, point.lat] } : null, properties: { id: event.id, name: event.title, type: "actividad", description: event.description, location: event.location_name, starts_at: event.starts_at, ends_at: event.ends_at, layer: layerId, source: "https://agroeco.red", license: "ODbL-1.0" } });
    }
    const columns = ["id", "name", "type", "description", "location", "starts_at", "ends_at", "layer", "source", "license", "longitude", "latitude"];
    const content = body.format === "geojson" ? JSON.stringify({ type: "FeatureCollection", name: layer.label, license: "ODbL-1.0", attribution: "AgroEco.Red y la red responsable de la capa", features }) : "\uFEFF" + [columns.map(csvCell).join(","), ...features.map(f => columns.map(c => csvCell(c === "longitude" ? f.geometry?.coordinates[0] : c === "latitude" ? f.geometry?.coordinates[1] : f.properties[c])).join(","))].join("\r\n");
    return json({ content, filename: `${layerId}.${body.format}`, count: features.length });
  } catch {
    return json({ error: "No se pudo completar la solicitud" }, 500);
  }
});