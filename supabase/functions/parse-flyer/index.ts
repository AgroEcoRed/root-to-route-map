import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Parses an event flyer image and extracts structured info using Lovable AI (Gemini vision).
// Input:  { imageBase64: string, mime: string }  OR  { imageUrl: string }
// Output: { title, description, starts_at (ISO|null), location_name, lat, lng, contact_email, contact_phone, organizers: string[] }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing bearer token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : null
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : null
    const mime = typeof body.mime === 'string' ? body.mime : 'image/jpeg'
    if (!imageUrl && !imageBase64) {
      return new Response(JSON.stringify({ error: 'Provide imageUrl or imageBase64' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const dataUrl = imageBase64
      ? `data:${mime};base64,${imageBase64}`
      : imageUrl!

    const system = `Sos un asistente que extrae información estructurada de flyers de actividades agroecológicas (ferias, intercambios, talleres). Respondé SOLO con JSON válido siguiendo este esquema: {"title":string,"description":string,"starts_at":string|null (ISO 8601 con zona AR si hay fecha+hora, sólo YYYY-MM-DD si no hay hora, null si no hay fecha),"location_name":string|null,"contact_email":string|null,"contact_phone":string|null,"organizers":string[]}. Si un campo no aparece en el flyer, usá null o string vacío. La hora por defecto si no aparece es 18:00. Asumí zona horaria America/Argentina/Buenos_Aires.`

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extraé los datos de esta actividad. Devolvé sólo JSON.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!resp.ok) {
      const errTxt = await resp.text()
      return new Response(JSON.stringify({ error: `AI gateway: ${resp.status}`, detail: errTxt.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const json = await resp.json()
    const content = json.choices?.[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(content) } catch { parsed = {} }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})