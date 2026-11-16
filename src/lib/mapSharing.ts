export function mapShareUrl(search: string, layer?: string, embedded = false) {
  const url = new URL(embedded ? '/mapa/incrustar' : '/mapa', 'https://agroeco.red');
  const params = new URLSearchParams(search);
  for (const key of ['capa', 'event']) {
    const value = params.get(key);
    if (value && /^[a-zA-Z0-9_-]{1,100}$/.test(value)) url.searchParams.set(key, value);
  }
  if (layer) {
    url.searchParams.set('capa', layer);
    url.searchParams.delete('event');
  }
  return url.toString();
}

export function mapEmbedCode(search: string, layer?: string) {
  return `<iframe src="${mapShareUrl(search, layer, true).replace(/&/g, '&amp;')}" title="AgroEco.Red · Mapa Vivo" width="100%" height="600" style="border:0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}