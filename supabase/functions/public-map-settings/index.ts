import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async req => {
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (!['POST', 'GET'].includes(req.method)) return new Response('{}', { status: 405, headers });
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('configuration');
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.from('data_source_settings').select('source_id,label,privacy').eq('enabled', true);
    if (error) throw error;
    const layers = (data || []).map(row => {
      const v = row.privacy?.events_visibility;
      return { source_id: row.source_id, label: row.label, enabled: true,
        privacy: { events_visibility: { past: v?.past === 'hide' ? 'hide' : 'show',
          hidden_years: Array.isArray(v?.hidden_years) ? v.hidden_years.map(Number).filter(Number.isFinite) : [] } } };
    });
    return new Response(JSON.stringify({ layers }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: 'No disponible' }), { status: 503, headers });
  }
});