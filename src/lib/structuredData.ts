type PublicActor = { id: number; layerActorId?: string; name: string; type: string; lat: number; lng: number; source: string };
type PublicEvent = { id: string; title: string; starts_at: string; ends_at: string | null; location_name: string | null; lat: number | null; lng: number | null };
type PublicDocument = { id: string; title: string; authors: string[]; item_type: string; license?: string | null; doi: string | null; url: string | null };

const base = 'https://agroeco.red';
const geo = (lat: number, lng: number) => ({ '@type': 'GeoCoordinates', latitude: lat, longitude: lng });
export function actorSchema(actor: PublicActor) {
  const url = `${base}/mapa?capa=${encodeURIComponent(actor.source)}`;
  return {
    '@type': actor.type === 'individual_consumer' || actor.type === 'facilitator' ? 'Person' : 'Organization',
    '@id': `${url}#actor-${actor.layerActorId || actor.id}`, name: actor.name, url,
    location: { '@type': 'Place', geo: geo(actor.lat, actor.lng) },
  };
}
export function eventSchema(event: PublicEvent) {
  const url = `${base}/mapa?event=${encodeURIComponent(event.id)}`;
  return { '@type': 'Event', '@id': url, url, name: event.title,
    ...(Number.isFinite(Date.parse(event.starts_at)) ? { startDate: event.starts_at } : {}),
    ...(event.ends_at && Number.isFinite(Date.parse(event.ends_at)) ? { endDate: event.ends_at } : {}),
    ...(event.location_name || (event.lat != null && event.lng != null) ? { location: {
      '@type': 'Place', ...(event.location_name ? { name: event.location_name } : {}),
      ...(event.lat != null && event.lng != null ? { geo: geo(event.lat, event.lng) } : {}),
    } } : {}),
  };
}
export function documentSchema(item: PublicDocument) {
  return { '@type': item.item_type === 'book' ? 'Book' : item.item_type === 'article' ? 'Article' : 'CreativeWork',
    '@id': `${base}/biblioteca#document-${item.id}`, name: item.title,
    author: item.authors.map(name => ({ '@type': 'Person', name })),
    ...(item.doi ? { identifier: item.doi } : {}),
    ...(item.url && /^https?:\/\//i.test(item.url) ? { sameAs: item.url } : {}),
    ...(item.license?.startsWith('CC-') ? { license: `https://creativecommons.org/licenses/${item.license.slice(3, -4).toLowerCase()}/4.0/` } : {}),
  };
}
export function schemaJson(nodes: unknown[]) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
}