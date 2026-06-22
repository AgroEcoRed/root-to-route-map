
## Parte A — Rediseño de 6 módulos (renombres + IA)

Nueva navegación principal (en este orden), con redirects desde rutas viejas:

1. **🌱 Mapa Vivo** (`/mapa`, alias `/actores`) — "Mapa Vivo del Ecosistema Agroecológico". Actores, iniciativas, territorios, relaciones y **saberes georreferenciados** (ver Parte B).
2. **🧺 Mercado Agroecológico** (`/mercado`, alias `/marketplace`) — Rename global "Marketplace" → "Mercado Agroecológico". Subtítulo: *"Espacio para fortalecer circuitos cortos de comercialización, intercambio y abastecimiento agroecológico"*. Filtros por chips: productos · servicios · semillas · bioinsumos · logística · herramientas · saberes · compras colectivas · ferias · ofertas/demandas.
3. **🤝 Garantías Participativas** (`/garantias`, alias `/spg`) — "Sistemas Participativos de Garantía". Reframe como procesos sociales (no certificación tipo sello).
4. **📚 Comunidad y Saberes** (`/comunidad`) — Foro + wiki + eventos + nueva pestaña **Biblioteca / Memoria Agroecológica** (reusa `LibraryPage`). Alias `/biblioteca`.
5. **🔧 Recursos Compartidos** (`/recursos`, alias `/servicios`) — "Red de Servicios para la Agroecología", con cross-links a Mercado.
6. **📊 Observatorio Agroecológico** (`/observatorio`, NUEVO) — Tarjetas con datos reales derivados de la DB (actores por capa, distribución geo, % SPG verificado, transiciones registradas).

**Lenguaje "Rutas Sanas"**: aplicaré el tono cuidado/territorial/colectivo que ya usamos en esa propuesta a copies de hero, subtítulos y CTAs de los 6 módulos. (Adjunto aceptado como guía; si querés que cite frases puntuales antes de implementar, decímelo.)

**i18n**: nuevas claves ES/EN/FR/PT en `LanguageContext` para los 6 nombres, subtítulos y chips de Mercado.

## Parte B — Biblioteca georreferenciada (alcance completo)

Migración a `library_items`:
- Agregar `lat double precision`, `lng double precision` (opcionales).
- Agregar `actor_id uuid` (FK opcional a `profiles` o `layer_actors`) → hereda ubicación si no hay lat/lng propias.
- Agregar `route_geojson jsonb` (opcional) para recorridos/transiciones territoriales (LineString o FeatureCollection).
- Índice geoespacial básico sobre lat/lng.

En el **Mapa Vivo**:
- Nueva capa "Saberes y experiencias" toggleable (ícono libro/foto/video según `media_type`).
- Marcadores diferenciados por tipo (📖 texto · 📷 foto · 🎬 video · 🎙️ audio).
- Recorridos renderizados como polilíneas con color por tipo de transición.
- Popup: thumbnail + título + autor/actor vinculado + link a `/biblioteca/:id`.

En la **Biblioteca**:
- Formulario de carga gana: picker de ubicación (mapa) o "usar ubicación de actor X" o "subir track GPX/GeoJSON".
- Vista de detalle muestra mini-mapa si hay geo.

## Parte C — Chatbot AI (3 modos, localStorage, Gemini con switch)

**Backend**: edge function `chat-asistente` usando AI SDK + Lovable AI Gateway. Modelo default `google/gemini-3-flash-preview`. Variable interna `CHAT_MODEL` en una sola constante para que cambiar a `openai/gpt-5.4` o a Claude (vía ANTHROPIC_API_KEY si se agrega después) sea un edit de una línea.

**3 modos** (selector en UI):
- **General**: agroecología, SPG, uso de la plataforma. Tools: `buscar_actores`, `buscar_productos`, `buscar_ferias_eventos`, `buscar_saberes` (nueva, sobre `library_items`).
- **Onboarding/Registro**: guía conversacional para nuevos productorxs, sugiere categoría/capa, completa campos. Tool: `sugerir_categoria_registro`.
- **Buscador del Mapa Vivo**: queries tipo "hortalizas a 50km de La Plata con entrega los jueves" → aplica filtros al mapa. Tool: `aplicar_filtros_mapa`.

**UI**: AI Elements (`Conversation`, `Message`, `MessageResponse`, `PromptInput`, `Tool`, `Shimmer`). Botón flotante con ícono agroecológico custom (no Sparkles). `localStorage` key `agrored-chat-history-{modo}`. Botón "Nueva conversación" por modo.

**Persistencia**: solo navegador (localStorage), una conversación por modo.

## Detalles técnicos

```text
Archivos nuevos:
  supabase/functions/chat-asistente/index.ts
  supabase/migrations/<ts>_library_geo.sql   (lat/lng/actor_id/route_geojson + grants)
  src/components/chat/ChatAsistente.tsx
  src/components/chat/ChatBubble.tsx
  src/components/chat/modeSelector.tsx
  src/hooks/useChatHistory.ts
  src/pages/ObservatorioPage.tsx
  src/components/map/LibraryLayer.tsx
  src/components/library/GeoPicker.tsx
  src/assets/chat-icon.png (generado)

Archivos editados:
  src/App.tsx                  (rutas nuevas + alias/redirects)
  src/components/Navbar.tsx    (nuevo orden de 6 módulos)
  src/components/Footer.tsx
  src/contexts/LanguageContext.tsx  (claves ES/EN/FR/PT)
  src/pages/MarketplacePage.tsx     (rename + chips)
  src/pages/ServicesPage.tsx        (rename)
  src/pages/SPGPage.tsx             (rename)
  src/pages/CommunityPage.tsx       (tab Biblioteca)
  src/pages/MapPage.tsx             (capa Saberes + recorridos)
  src/pages/LibraryPage.tsx         (GeoPicker, vínculo a actor)
  src/pages/Index.tsx               (narrativa 6 módulos)
```

**Migración** (solo agregar columnas, no rompe nada existente):
```sql
ALTER TABLE public.library_items
  ADD COLUMN lat double precision,
  ADD COLUMN lng double precision,
  ADD COLUMN actor_id uuid,
  ADD COLUMN route_geojson jsonb;
CREATE INDEX library_items_geo_idx ON public.library_items (lat, lng);
```
(Sin cambios de RLS; las policies existentes siguen aplicando.)

**Sin nuevos secretos**: `LOVABLE_API_KEY` ya existe.

**Orden de implementación**:
1. Migración `library_geo`.
2. Renombres + i18n + nuevo Navbar/Footer/Index/App.tsx.
3. ObservatorioPage con datos reales básicos.
4. LibraryLayer en mapa + GeoPicker en biblioteca.
5. Edge function `chat-asistente` + UI del chatbot con 3 modos.

## Lo que NO incluye este plan
- Editorial fino de cada copy nuevo (puedo pasarte después un diff de textos para que ajustes).
- Moderación / aprobación previa para saberes geolocalizados (queda abierto si después lo querés).
- Migrar Claude como modelo real (queda preparado el switch; cuando quieras, sumás `ANTHROPIC_API_KEY` y cambiás la constante).
