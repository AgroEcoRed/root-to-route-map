// Reconoce metadatos bibliográficos a partir de un DOI o de un link (OJS, DSpace, SciELO, etc.)
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Meta = {
  title: string; authors: string[]; year: number | null; item_type: string;
  doi: string | null; url: string | null; journal: string | null;
  publisher: string | null; abstract: string | null; tags: string[];
}

const empty = (): Meta => ({
  title: '', authors: [], year: null, item_type: 'article',
  doi: null, url: null, journal: null, publisher: null, abstract: null, tags: [],
})

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, ' ').trim()

const metaValues = (html: string, name: string): string[] => {
  const out: string[] = []
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, 'gi')
  for (const tag of html.match(re) ?? []) {
    const c = tag.match(/content=["']([\s\S]*?)["']/i)?.[1]
    if (c) out.push(decode(c))
  }
  return out
}

const first = (html: string, ...names: string[]): string | null => {
  for (const n of names) { const v = metaValues(html, n)[0]; if (v) return v }
  return null
}

const crossref = async (doi: string): Promise<Meta | null> => {
  const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
  if (!r.ok) return null
  const m = (await r.json()).message
  const meta = empty()
  meta.title = decode(m.title?.[0] ?? '')
  meta.authors = (m.author ?? []).map((a: Record<string, string>) => `${a.given ?? ''} ${a.family ?? ''}`.trim()).filter(Boolean)
  meta.year = m.issued?.['date-parts']?.[0]?.[0] ?? null
  meta.journal = m['container-title']?.[0] ?? null
  meta.publisher = m.publisher ?? null
  meta.abstract = m.abstract ? decode(m.abstract.replace(/<[^>]+>/g, ' ')) : null
  meta.url = m.URL ?? null
  meta.doi = m.DOI ?? doi
  meta.item_type = String(m.type ?? '').includes('book') ? 'book' : 'article'
  return meta.title ? meta : null
}

const fromHtml = (html: string, url: string): Meta => {
  const meta = empty()
  meta.url = url
  meta.title = first(html, 'citation_title', 'DC.Title', 'dc.title', 'og:title')
    ?? decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
  const authors = [
    ...metaValues(html, 'citation_author'),
    ...metaValues(html, 'DC.Creator'),
    ...metaValues(html, 'dc.creator'),
    ...metaValues(html, 'citation_authors').flatMap((v) => v.split(';')),
  ].map((a) => a.includes(',') ? a.split(',').map((s) => s.trim()).reverse().join(' ') : a.trim())
  meta.authors = [...new Set(authors.filter(Boolean))]
  const date = first(html, 'citation_publication_date', 'citation_date', 'citation_online_date', 'DC.Date', 'dc.date') ?? ''
  const y = Number((date.match(/(19|20)\d{2}/) ?? [])[0])
  meta.year = y || null
  meta.journal = first(html, 'citation_journal_title', 'DC.Source', 'dc.source', 'og:site_name')
  meta.publisher = first(html, 'citation_publisher', 'DC.Publisher', 'dc.publisher')
  meta.doi = (first(html, 'citation_doi', 'DC.Identifier.DOI', 'dc.identifier') ?? '')
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').match(/^10\.\S+/)?.[0] ?? null
  meta.abstract = first(html, 'citation_abstract', 'DC.Description', 'dc.description', 'description', 'og:description')
  const kws = [...metaValues(html, 'citation_keywords'), ...metaValues(html, 'keywords'), ...metaValues(html, 'DC.Subject')]
  meta.tags = [...new Set(kws.flatMap((k) => k.split(/[,;]/)).map((k) => k.trim().toLowerCase()).filter((k) => k && k.length < 40))].slice(0, 8)
  const type = (first(html, 'DC.Type', 'og:type') ?? '').toLowerCase()
  if (type.includes('book')) meta.item_type = 'book'
  else if (type.includes('thesis')) meta.item_type = 'thesis'
  else if (type.includes('report')) meta.item_type = 'report'
  return meta
}

const aiFallback = async (html: string, url: string): Promise<Meta | null> => {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) return null
  const text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).slice(0, 12000)
  const system = `Sos un asistente bibliográfico. A partir del texto de una página web de un artículo académico devolvés SOLO JSON válido: {"title":string,"authors":string[] ("Nombre Apellido"),"year":number|null,"item_type":"article"|"book"|"thesis"|"report"|"chapter"|"web","doi":string|null,"journal":string|null,"publisher":string|null,"abstract":string|null,"tags":string[]}. Nunca inventes DOI.`
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `URL: ${url}\n\n${text}` },
      ],
      response_format: { type: 'json_object' },
    }),
  })
  if (!resp.ok) return null
  const j = await resp.json()
  try {
    const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? '{}')
    return { ...empty(), ...parsed, url } as Meta
  } catch { return null }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const body = await req.json().catch(() => ({}))
    const input = typeof body.input === 'string' ? body.input.trim() : ''
    if (!input) return json({ error: 'Falta el DOI o el link' }, 400)

    const doiMatch = input.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').match(/^10\.\d{4,9}\/\S+$/)
    if (doiMatch) {
      const meta = await crossref(doiMatch[0])
      if (meta) return json(meta)
      return json({ error: 'No se encontraron metadatos para ese DOI' }, 404)
    }

    if (!/^https?:\/\//i.test(input)) return json({ error: 'Ingresá un DOI válido o un link completo' }, 400)

    const res = await fetch(input, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AgroEcoRedBot/1.0)', Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
    })
    if (!res.ok) return json({ error: `No se pudo leer la página (${res.status})` }, 502)
    const html = await res.text()

    let meta = fromHtml(html, res.url || input)
    if (meta.doi && (!meta.authors.length || !meta.title)) {
      const cr = await crossref(meta.doi).catch(() => null)
      if (cr) meta = { ...cr, url: meta.url ?? cr.url, tags: meta.tags.length ? meta.tags : cr.tags }
    }
    if (!meta.title || !meta.authors.length) {
      const ai = await aiFallback(html, res.url || input)
      if (ai) {
        meta = {
          ...meta,
          title: meta.title || ai.title,
          authors: meta.authors.length ? meta.authors : ai.authors,
          year: meta.year ?? ai.year,
          journal: meta.journal ?? ai.journal,
          publisher: meta.publisher ?? ai.publisher,
          abstract: meta.abstract ?? ai.abstract,
          doi: meta.doi ?? ai.doi,
          item_type: meta.item_type === 'article' ? ai.item_type ?? 'article' : meta.item_type,
          tags: meta.tags.length ? meta.tags : ai.tags,
        }
      }
    }
    if (!meta.title) return json({ error: 'No se pudieron reconocer los metadatos de ese link' }, 404)
    return json(meta)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
