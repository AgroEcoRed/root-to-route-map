/**
 * Símbolos (glifos) agroecológicos por tipo de actor para los marcadores del mapa.
 * Cada glifo es markup SVG interno (viewBox 0 0 24 24) pensado para dibujarse
 * en blanco sobre el color del rol (oferta / demanda / servicio).
 */

const S = `fill="none" stroke="#ffffff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"`;
const F = `fill="#ffffff"`;

const glyphs: Record<string, string> = {
  // ---- Oferta (producción) ----
  // Hoja: producción agroecológica
  producer: `<path ${S} d="M19 5c0 7-4.5 11-10 11H6c0-6 4-11 10-11h3z"/><path ${S} d="M6 19c1.5-4 4.5-7 8-8.5"/>`,
  // Manos unidas: cooperativa
  cooperative: `<path ${S} d="M4 12l3-3 5 2 5-2 3 3"/><path ${S} d="M7 9V6m10 3V6"/><path ${S} d="M4 12v4a3 3 0 003 3h10a3 3 0 003-3v-4"/>`,
  // Molino / procesamiento
  processing: `<path ${S} d="M12 12V4m0 8h8m-8 0H4m8 0v8"/><circle ${S} cx="12" cy="12" r="2.2"/>`,
  // Canasta: nodo agroecológico
  agroecological_node: `<path ${S} d="M3.5 10h17l-2 8.5a2 2 0 01-2 1.5H7.5a2 2 0 01-2-1.5L3.5 10z"/><path ${S} d="M8 10L11 4m5 6l-3-6"/>`,
  // Semillas
  seed_bank: `<path ${S} d="M9 6.5c2.5 0 4 1.8 4 4s-1.5 4-4 4-4-1.8-4-4 1.5-4 4-4z"/><path ${S} d="M15.5 12c2 0 3.5 1.5 3.5 3.5S17.5 19 15.5 19 12 17.5 12 15.5"/>`,
  // Compost: ciclo
  composting_center: `<path ${S} d="M5 12a7 7 0 0111.5-5.4M19 12a7 7 0 01-11.5 5.4"/><path ${S} d="M16 3.5v3.5h-3.5M8 20.5V17h3.5"/>`,
  // Investigación: lupa sobre hoja
  research_center: `<circle ${S} cx="10.5" cy="10.5" r="5.5"/><path ${S} d="M15 15l5 5"/><path ${S} d="M8.5 12c0-2.5 2-4 4.5-4"/>`,
  // Intermediación solidaria: puente
  solidarity_intermediary: `<path ${S} d="M3 15c4 0 5-7 9-7s5 7 9 7"/><path ${S} d="M3 15v4m18-4v4M9 12.5V19m6-6.5V19"/>`,
  // Huerta comunitaria: surcos con brotes
  community_garden: `<path ${S} d="M4 19h16"/><path ${S} d="M7 19v-4m0 0c-1.6 0-2.6-1-2.6-2.6C6 12.4 7 13.4 7 15zm0 0c1.6 0 2.6-1 2.6-2.6C8 12.4 7 13.4 7 15z"/><path ${S} d="M15 19V9m0 0c-2 0-3.2-1.2-3.2-3.2 2 0 3.2 1.2 3.2 3.2zm0 0c2 0 3.2-1.2 3.2-3.2-2 0-3.2 1.2-3.2 3.2z"/>`,
  // Bio-insumos: gota
  bio_input_supplier: `<path ${S} d="M12 3.5s5.5 6 5.5 9.5a5.5 5.5 0 11-11 0C6.5 9.5 12 3.5 12 3.5z"/><path ${S} d="M12 17a4 4 0 01-4-4"/>`,

  // ---- Demanda (consumo) ----
  restaurant: `<path ${S} d="M7 3v8m0 0v10M5 3v4a2 2 0 004 0V3"/><path ${S} d="M16.5 3c-1.5 2-2 4-2 6.5 0 1.5.8 2.5 2 2.5s2-1 2-2.5c0-2.5-.5-4.5-2-6.5z"/><path ${S} d="M16.5 12v9"/>`,
  social_kitchen: `<path ${S} d="M3.5 12h17a8.5 8.5 0 01-17 0z"/><path ${S} d="M3 20h18"/><path ${S} d="M9 8c0-1.2 1-1.8 1-3s-1-1.8-1-3m5 6c0-1.2 1-1.8 1-3s-1-1.8-1-3"/>`,
  institution: `<path ${S} d="M3.5 9.5L12 4l8.5 5.5"/><path ${S} d="M5.5 10v8m4-8v8m5-8v8m4-8v8"/><path ${S} d="M3 20h18"/>`,
  retail: `<path ${S} d="M4 8h16l-1 12H5L4 8z"/><path ${S} d="M8.5 8V6a3.5 3.5 0 017 0v2"/>`,
  consumer_node: `<circle ${S} cx="12" cy="12" r="2.5"/><circle ${S} cx="5" cy="6" r="2"/><circle ${S} cx="19" cy="6" r="2"/><circle ${S} cx="6" cy="19" r="2"/><circle ${S} cx="18" cy="19" r="2"/><path ${S} d="M10.3 10.4L6.6 7.4m7.2 3l3.5-3m-7 7.3l-3.3 2.5m7.3-2.5l2.9 2.2"/>`,
  individual_consumer: `<circle ${S} cx="12" cy="8" r="3.2"/><path ${S} d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/>`,
  food_bank: `<path ${S} d="M4.5 9h15v10.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5V9z"/><path ${S} d="M3 5.5h18V9H3z"/><path ${S} d="M12 9v12"/><path ${S} d="M12 5.5C10.5 2.8 7 3.5 7.6 5.5m4.4 0c1.5-2.7 5-2 4.4 0"/>`,
  consumer_cooperative: `<path ${S} d="M4 10.5h16L18.5 20h-13L4 10.5z"/><path ${S} d="M9 10.5V8a3 3 0 016 0v2.5"/><path ${S} d="M9 15h6"/>`,
  community_org: `<circle ${S} cx="8" cy="8.5" r="2.6"/><circle ${S} cx="16" cy="8.5" r="2.6"/><path ${S} d="M3 19c0-2.8 2.2-4.8 5-4.8s5 2 5 4.8"/><path ${S} d="M13.5 14.6c2.6-.6 6.5.9 6.5 4.4"/>`,
  health_food_store: `<path ${S} d="M12 5.5v13m-6.5-6.5h13"/><circle ${S} cx="12" cy="12" r="8.5"/>`,
  agroecological_store: `<path ${S} d="M4 9.5h16V20H4z"/><path ${S} d="M3 5.5h18l-1 4H4l-1-4z"/><path ${S} d="M9.5 20v-5h5v5"/>`,
  agroecological_fair: `<path ${S} d="M3 10.5h18L19 6H5l-2 4.5z"/><path ${S} d="M5 10.5V20m14-9.5V20M3.5 20h17"/><path ${S} d="M9 20v-5h6v5"/>`,
  agroecological_market: `<path ${S} d="M4 11h16l-1.2 9H5.2L4 11z"/><path ${S} d="M3 11l2-5h14l2 5"/><path ${S} d="M9 15h6"/>`,

  // ---- Servicio ----
  logistics: `<path ${S} d="M2.5 7.5h11v9h-11z"/><path ${S} d="M13.5 11h4l3 3v2.5h-7z"/><circle ${S} cx="7" cy="18" r="1.8"/><circle ${S} cx="17.5" cy="18" r="1.8"/>`,
};

const fallbackGlyph = `<circle ${F} cx="12" cy="12" r="3.4"/>`;

/** Devuelve el markup interno del SVG (24x24) para un tipo de actor. */
export function actorGlyph(type: string): string {
  return glyphs[type] ?? fallbackGlyph;
}

/** SVG completo listo para insertar en el marcador. */
export function actorGlyphSvg(type: string, size = 17): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="display:block">${actorGlyph(type)}</svg>`;
}
