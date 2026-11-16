import { describe, it, expect } from 'vitest';
import { mapShareUrl, mapEmbedCode } from '../lib/mapSharing';
import { actorSchema, eventSchema, documentSchema, schemaJson } from '../lib/structuredData';

describe('Public interoperability', () => {
  it('only shares public map parameters, not edit tokens', () => {
    expect(mapShareUrl('?capa=mes_agroecologia&edit_token=secret')).toBe('https://agroeco.red/mapa?capa=mes_agroecologia');
  });
  it('embeds the selected layer without giving export credentials', () => {
    expect(mapEmbedCode('?event=old&token=secret', 'rutas_sanas')).toContain('https://agroeco.red/mapa/incrustar?capa=rutas_sanas');
    expect(mapEmbedCode('?event=old&token=secret', 'rutas_sanas')).not.toContain('secret');
  });
  it('never spreads private actor fields into schema.org', () => {
    const actor = { id: 1, name: 'Huerta', type: 'producer', lat: -34, lng: -58, source: 'user_points', contact: 'private', confirmation_token: 'secret' };
    expect(actorSchema(actor).location.geo.latitude).toBe(-34);
    expect(JSON.stringify(actorSchema(actor))).not.toMatch(/private|secret/);
  });
  it('publishes event dates without edit credentials', () => {
    const event = { id: 'a', title: 'Encuentro', starts_at: '2026-11-27T15:30:00Z', ends_at: null, location_name: 'UNSAM', lat: null, lng: null, edit_token: 'secret' };
    expect(eventSchema(event).startDate).toBe('2026-11-27T15:30:00Z');
    expect(JSON.stringify(eventSchema(event))).not.toContain('secret');
  });
  it('preserves the noncommercial document license without publishing storage paths', () => {
    const item = { id: 'b', title: 'Documento', authors: ['Ana'], item_type: 'report', license: 'CC-BY-NC-SA-4.0', doi: null, url: null, file_path: 'private.pdf' };
    expect(documentSchema(item).license).toBe('https://creativecommons.org/licenses/by-nc-sa/4.0/');
    expect(JSON.stringify(documentSchema(item))).not.toContain('private.pdf');
  });
  it('keeps submitted text inert inside JSON-LD scripts', () => {
    expect(schemaJson([{ name: '</script><script>alert(1)</script>' }])).not.toContain('</script>');
  });
});