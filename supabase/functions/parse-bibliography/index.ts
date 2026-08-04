// Extrae metadatos bibliográficos (estilo Zotero) de un PDF/EPUB usando Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Input:  { fileBase64: string, mime: string, filename?: string }
// Output: { title, authors[], year, item_type, doi, journal, publisher, abstract, tags[] }
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: userData, error: userErr } = await sb.auth.getUser(token)
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const fileBase64 = typeof body.fileBase64 === 'string' ? body.fileBase64 : null
    const mime = typeof body.mime === 'string' && body.mime ? body.mime : 'application/pdf'
    const filename = typeof body.filename === 'string' ? body.filename : 'documento.pdf'
    if (!fileBase64) {
      return new Response(JSON.stringify({ error: 'Provide fileBase64' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const system = `Sos un asistente bibliográfico (estilo Zotero). A partir de las primeras páginas de un documento académico extraés su ficha. Respondé SOLO con JSON válido: {"title":string,"authors":string[] (nombre completo, "Nombre Apellido"),"year":number|null,"item_type":"article"|"book"|"thesis"|"report"|"chapter"|"web","doi":string|null (sin prefijo https://doi.org/),"journal":string|null,"publisher":string|null,"abstract":string|null (resumen del documento, máx 900 caracteres; si no hay resumen explícito, redactá uno breve),"tags":string[] (3 a 6 palabras clave en minúsculas, en español)}. Si un campo no aparece, usá null o lista vacía. Nunca inventes DOI.`

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extraé la ficha bibliográfica de este documento. Devolvé sólo JSON.' },
              { type: 'file', file: { filename, file_data: `data:${mime};base64,${fileBase64}` } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!resp.ok) {
      const errTxt = await resp.text()
      const status = resp.status === 429 || resp.status === 402 ? resp.status : 502
      return new Response(JSON.stringify({ error: `AI gateway: ${resp.status}`, detail: errTxt.slice(0, 500) }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const json = await resp.json()
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(json.choices?.[0]?.message?.content ?? '{}') } catch { parsed = {} }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
