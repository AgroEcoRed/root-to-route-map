export interface FeedEvent {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  created_at: string;
  approved: boolean;
  layer_id: string | null;
}

export interface FeedLayer {
  source_id: string;
  enabled: boolean;
  privacy: unknown;
}

export function selectPublicActivities(events: FeedEvent[], layers: FeedLayer[], now = Date.now()) {
  const settings = new Map(layers.map(layer => [layer.source_id, layer]));
  return events.filter(event => {
    if (!event.approved) return false;
    if (!event.layer_id) return true;
    const layer = settings.get(event.layer_id);
    // A missing layer is private, not an invitation to publish its events.
    if (!layer?.enabled) return false;
    const privacy = layer.privacy as { events_visibility?: { past?: string; hidden_years?: unknown[] } } | null;
    const visibility = privacy?.events_visibility;
    const date = new Date(event.starts_at);
    if (!Number.isFinite(date.getTime())) return true;
    const year = Number(date.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric" }));
    if (visibility?.hidden_years?.map(Number).includes(year)) return false;
    return visibility?.past !== "hide" || date.getTime() >= now;
  }).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 100);
}

export const escapeXml = (value: string) => value
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function activityDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

export function buildActivitiesRss(events: FeedEvent[], selfUrl: string, now = new Date()) {
  const items = events.map(event => {
    const link = `https://agroeco.red/mapa?event=${encodeURIComponent(event.id)}`;
    const details = [event.description, activityDate(event.starts_at) && `Fecha: ${activityDate(event.starts_at)} (Argentina)`,
      event.ends_at && activityDate(event.ends_at) && `Finaliza: ${activityDate(event.ends_at)} (Argentina)`,
      event.location_name && `Lugar: ${event.location_name}`].filter(Boolean).join("\n\n");
    // RSS readers interpret descriptions as HTML: escape twice to keep submitted text inert.
    const description = escapeXml(escapeXml(details));
    const published = new Date(event.created_at);
    return `<item><title>${escapeXml(event.title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid>${Number.isFinite(published.getTime()) ? `<pubDate>${published.toUTCString()}</pubDate>` : ""}<description>${description}</description></item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:creativeCommons="http://backend.userland.com/creativeCommonsRssModule">
<channel><title>AgroEco.Red · Actividades</title><link>https://agroeco.red/mapa</link>
<description>Actividades públicas de la red agroecológica: ferias, encuentros, intercambios y formación.</description>
<language>es-ar</language><lastBuildDate>${now.toUTCString()}</lastBuildDate><ttl>15</ttl>
<atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml"/>
<creativeCommons:license>https://creativecommons.org/licenses/by-sa/4.0/</creativeCommons:license>
${items}</channel></rss>`;
}