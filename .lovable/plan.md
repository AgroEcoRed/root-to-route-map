## 1. Bio-insumos y bancos de semillas como vendedores

Ya existen los `actor_type` `seed_bank`, `composting_center` y la pseudo-categoría "bio-insumos". Faltan dos cosas:

- **Mapa**: ya están como tipos en el filtro pero hoy llegan vacíos del KMZ. Sumo:
  - Nuevo tipo de actor `bio_input_supplier` (proveedor de bio-insumos) en el enum `actor_type`.
  - Visible en filtros del mapa como "Oferta" (triángulo verde).
  - Card de presentación reutilizando el componente actual de marker/popup.
- **Mercado**: agrego dos categorías nuevas en `MarketplacePage`:
  - "Bio-insumos" (compost, biopreparados, controladores biológicos, lombricompuesto…)
  - "Semillas y Plantines" (criollas/nativas/agroecológicas)
  - Los usuarios con `actor_type` `seed_bank`, `composting_center` o `bio_input_supplier` pueden cargar productos en estas categorías desde su panel.
- **Registro**: agrego `bio_input_supplier` a la lista de "¿Quién sos?" para que se puedan auto-registrar.

Sin tabla nueva — se usa `profiles.actor_type` existente + `custom_categories`.

## 2. Biblioteca colaborativa (Zotero comunitario)

Nueva sección `/biblioteca` con lógica append-only:

- **Subir**: drag-and-drop de PDF/EPUB/links (DOI/URL). Para PDFs, parseo metadatos con `pdfjs-dist` (título, autor, año del XMP/info). Para DOIs, fetch a la API pública de Crossref (sin key) → autores, año, journal, abstract.
- **Listar**: tabla con título, autores, año, tipo, tags, quién lo subió.
- **No se borra**: RLS sólo permite INSERT y SELECT públicos. UPDATE limitado a tags/notas por el que subió.
- **Exportar bibliografía**: selección múltiple → descarga **BibTeX** (.bib) y **CSV** estilo Zotero. Estilo de cita APA visible.
- **Storage**: bucket público `biblioteca` en Lovable Cloud para los PDFs.

Esquema:
```
library_items: id, title, authors[], year, type (article|book|report|web|other),
               doi, url, abstract, tags[], file_path, uploaded_by, created_at
library_collections: id, name, description, created_by  (carpetas/temas opcionales)
library_item_collections: item_id, collection_id
```
RLS: SELECT público, INSERT autenticado, UPDATE sólo del que subió y sólo en tags/notas, **DELETE deshabilitado**.

## 3. Programas gubernamentales con scraping

Esto necesita cuidado: scraping live desde el cliente es imposible (CORS) y desde el servidor es lento + frágil. Propuesta:

- Tabla `gov_programs` con: `country`, `region`, `city`, `name`, `description`, `url`, `topics[]`, `last_synced_at`, `source_html_hash`.
- **Edge function `sync-gov-programs`**: corre on-demand (botón admin) y semanalmente (cron). Usa **Firecrawl** (connector ya existente o lo conectamos) para scrapear listas conocidas:
  - 🇦🇷 INTA ProHuerta, SENASA, MAGyP, SAF, Monotributo Social, programas provinciales (BA, Santa Fe, Mendoza…)
  - 🇧🇷 EMBRAPA, ANATER, PNAE
  - 🇺🇾 INIA, MGAP
  - Catálogo de fuentes definido en `src/data/govSources.json`, así es expandible sin tocar código.
- **UI** `/servicios` → "Programas": filtros País → Provincia → Ciudad. Lista con título, nivel de gobierno, link oficial, fecha de última actualización.
- Si una página no se puede scrapear (login/JS-heavy), se mantiene como link manual.

**Requiere**: conectar el connector **Firecrawl** (te pido aprobación antes de ejecutar `connect`).

## 4. Clima desde servicios meteorológicos oficiales

Hoy uso Open-Meteo (agregador). Lo cambio a fuentes oficiales por país, con fallback a Open-Meteo:

- 🇦🇷 **SMN** (Servicio Meteorológico Nacional): tiene endpoints abiertos en `ws.smn.gob.ar` (pronóstico por estación, sin key).
- 🇧🇷 **INMET**: API pública `apitempo.inmet.gov.br`.
- 🇺🇾 **INUMET**: tiene feed JSON público.
- 🇨🇱 **DMC**: solo HTML — fallback Open-Meteo.
- 🇲🇽 **CONAGUA/SMN-MX**: tiene XML/JSON.

Helper `src/lib/weather/officialWeather.ts` decide la fuente según `country` y `lat/lng` del perfil. Muestra el **logo y nombre del servicio oficial** ("Fuente: SMN — Servicio Meteorológico Nacional 🇦🇷"). Si la fuente oficial falla → Open-Meteo + cartel "datos de respaldo".

Edge function `weather-proxy` para evitar CORS y cachear 30 minutos por estación.

---

## Detalles técnicos

- Migraciones: 1 ALTER al enum `actor_type`, 3 nuevas tablas (`library_items`, `library_collections`, `library_item_collections`, `gov_programs`), 1 bucket de storage `biblioteca`.
- Edge functions nuevas: `sync-gov-programs`, `weather-proxy`, `parse-pdf-metadata`.
- Dependencias front: `pdfjs-dist` (parseo PDF), no necesito más.
- Connector requerido: **Firecrawl** (te confirmo antes de conectar).
- Sin romper nada existente: mapa, marketplace, registro, identidad visual, navegación se preservan.

## Faseo sugerido (cada fase es un commit independiente)

```
Fase A  → Bio-insumos como actor_type + categorías de mercado     (rápido, sin scraping)
Fase B  → Biblioteca colaborativa (subir/listar/exportar)         (mediano)
Fase C  → Clima oficial multi-país con fallback                   (mediano)
Fase D  → Programas gubernamentales con Firecrawl + cron          (más largo, requiere connector)
```

## Confirmaciones necesarias antes de ejecutar

1. ¿Avanzo con el faseo A→D o querés otro orden?
2. Para Fase D: ¿conectamos **Firecrawl** ahora? (te abro el picker cuando confirmes)
3. Para Fase B: ¿la biblioteca arranca **abierta a cualquier visitante** para leer/descargar y **autenticados** para subir, o todo bajo login?
