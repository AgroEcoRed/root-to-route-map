# Evolución estratégica de AgroEco.Red

De **marketplace + mapa** a **infraestructura socio-técnica** para redes agroecológicas territoriales: articulación, trazabilidad participativa, monitoreo de transiciones y verificación comunitaria multicapa.

---

## 1. Visión y principios rectores

- **Trayectorias, no etiquetas**: la agroecología se mide como proceso de transición, no como certificación binaria.
- **Confianza distribuida**: combinar documentos + evidencia visual + validación comunitaria + historial — ninguna fuente es "verdad" por sí sola.
- **Soberanía de datos**: cada actor controla qué se comparte, con quién y para qué; exportable e interoperable.
- **Territorial y multiactoral**: productores, organizaciones, consumidores, técnicos, instituciones y facilitadores SPG comparten la misma infraestructura.
- **Low-bandwidth first**: funciona en celular, offline-tolerante, sincronización diferida.

---

## 2. Arquitectura funcional (módulos)

```text
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE EXPERIENCIA                      │
│   Mobile-first PWA · ES/EN/FR/PT · Offline-first sync       │
├─────────────────────────────────────────────────────────────┤
│  PERFILES   │ TRANSICIONES │ VERIFICACIÓN │   TERRITORIO    │
│ territoriales│  (monitoreo) │  multicapa   │  (mapas+rutas)  │
├─────────────────────────────────────────────────────────────┤
│   MERCADO   │     SPG      │  COMUNIDAD   │    SERVICIOS    │
│ (existente) │ (existente+) │ (existente+) │   (existente+)  │
├─────────────────────────────────────────────────────────────┤
│        GOBERNANZA DE DATOS · permisos · consentimiento       │
├─────────────────────────────────────────────────────────────┤
│  Lovable Cloud (Postgres + PostGIS) · Storage · Edge Funcs  │
│  Lovable AI (multimodal) · Open-Meteo · OSM · KoboToolbox   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Módulos prioritarios

### 3.1 Perfiles territoriales enriquecidos
Extender `profiles` con dimensiones agroecológicas:

- **Identidad**: tipo de actor, organización, redes a las que pertenece.
- **Producción**: cultivos, superficie, métodos, calendario estacional.
- **Prácticas**: lista checkable (rotación, cobertura, biopreparados, asociación, manejo integrado de plagas, etc.).
- **Territorio**: polígono de la unidad productiva (no solo punto), biorregión, cuenca.
- **Trayectoria**: línea de tiempo de hitos (inicio transición, primera certificación SPG, primera venta directa…).
- **Galería evidencial**: fotos geo y fecha-estampadas.
- **Vínculos**: con otros perfiles (cooperativa ↔ socios, técnico ↔ productores acompañados).

### 3.2 Monitoreo de transiciones agroecológicas
Núcleo del diferencial frente a LiteFarm.

**Sistema de indicadores** organizados en dimensiones:
1. **Agronómica**: % reducción insumos sintéticos, diversidad cultivada, cobertura del suelo.
2. **Ecológica**: biodiversidad funcional, agua, suelo, corredores.
3. **Económica**: % venta directa, canales cortos, precio justo.
4. **Social/organizacional**: participación en redes, género y cuidados, trabajo digno.
5. **Cultural**: semillas nativas, saberes tradicionales.

**Visualizaciones**:
- **Rueda de transición** (radar chart) por dimensión, comparable año a año.
- **Timeline territorial**: hitos del actor sobre fondo de hitos de la red.
- **Mapa de transición**: capa que colorea polígonos por índice de avance.
- **Reporte anual auto-generado** (PDF exportable) por productor/organización/red.

**Captura de datos**:
- Formularios cortos y estacionales (no un cuestionario único anual).
- Integración opcional con **KoboToolbox / ODK** para encuestas de campo.
- Posibilidad de delegar carga a técnico/a acompañante.

### 3.3 Verificación y confianza multicapa

**Modelo de "Niveles de Confianza Agroecológica"** (no certificación) — score compuesto y transparente:

```text
Nivel ☘     →  Perfil + autodeclaración de prácticas
Nivel ☘☘    →  + Evidencia documental (análisis, actas, fotos geo)
Nivel ☘☘☘   →  + Visita de pares registrada (SPG)
Nivel ☘☘☘☘  →  + Validación cruzada por ≥2 organizaciones de la red
Nivel ☘☘☘☘☘ →  + Histórico ≥2 años con consistencia + reputación territorial
```

Cada nivel **siempre muestra qué evidencia lo respalda** (clickeable).

**(a) Verificación documental**
- Subida de PDFs/imágenes → Edge Function `parse-evidence` con Lovable AI (Gemini multimodal) extrae: tipo de documento, fecha, emisor, valores clave (ej. pH, materia orgánica).
- Detección de inconsistencias (fecha futura, emisor no reconocido, duplicado).
- Historial inmutable (append-only, ya alineado con la biblioteca existente).

**(b) Evidencia visual asistida por AI**
- Análisis de fotos de parcela: clasificación gruesa (monocultivo / policultivo / agroforestal / cobertura), detección de biodiversidad visible, estimación de cobertura vegetal.
- Comparación temporal (mismo punto, distintas fechas) → índice visual de evolución.
- **Siempre etiquetado como "sugerencia AI — requiere validación humana"**. Nunca decisión automática.

**(c) Verificación territorial colectiva (SPG digital)**
- Programación de visitas cruzadas con checklist participativo configurable por SPG.
- Firma digital de actas por participantes.
- Observaciones de pares públicas dentro de la red.
- Sistema de **reputación territorial**: validaciones recibidas, dadas, consistencia.

**(d) Score compuesto transparente**
- Fórmula pública y editable por cada SPG/red (no impuesta centralmente).
- Cada red configura pesos: una SPG puede priorizar visitas, otra evidencia documental.

### 3.4 Territorio: mapas multicapa
Sobre el Leaflet existente:

- **Capas activables**: actores, SPGs, rutas agroecológicas, ferias, biorregiones, cuencas, conflictos socioambientales, capas de biodiversidad (GBIF), uso de suelo (MapBiomas donde aplique).
- **Polígonos** además de puntos (parcelas, territorios SPG).
- **Rutas Sanas del Alimento**: trazado de flujos productor → nodo → consumidor.
- **Modo análisis**: densidad de actores, brechas territoriales, distancia media productor-consumidor.
- Importación/exportación **GeoJSON / KML / Shapefile**.

### 3.5 Gobernanza de datos
- **Permisos granulares por campo**: público / red / SPG / privado.
- **Consentimiento explícito** y revocable para cada uso (mapa público, estadísticas agregadas, investigación).
- **Licencias CC** seleccionables por contenido (fotos, datos, documentos).
- **Exportación total** ("Llevate tus datos") en JSON + GeoJSON + PDFs.
- **Ownership comunitario**: datos de una SPG pertenecen a esa SPG, no a la plataforma.
- API pública read-only sobre datos consentidos como públicos (interoperabilidad con LiteFarm, observatorios, universidades).

### 3.6 UX para baja conectividad
- PWA instalable, **service worker** con cache de mapa offline (tiles de la zona del usuario).
- Formularios offline → cola de sincronización.
- Imágenes comprimidas client-side antes de subir.
- Modo "datos bajos": sin tiles satelitales, sin imágenes pesadas.
- Onboarding por rol (productor / técnico / consumidor / facilitador SPG) — flujos distintos, no un único registro genérico.

---

## 4. Roadmap por fases

```text
FASE 1 · Fundaciones de transición  (4–6 sem)
├─ Indicadores de transición (schema + formularios estacionales)
├─ Rueda de transición + timeline por perfil
├─ Polígonos en perfiles (no solo puntos)
└─ Reporte anual PDF auto-generado

FASE 2 · Verificación multicapa  (6–8 sem)
├─ Niveles de Confianza Agroecológica (score transparente)
├─ Edge Function parse-evidence (AI multimodal documental)
├─ SPG digital: visitas, actas, checklist configurable
└─ Reputación territorial básica

FASE 3 · Territorio enriquecido  (4–6 sem)
├─ Mapas multicapa (GBIF, biorregiones, conflictos)
├─ Rutas Sanas del Alimento (flujos)
├─ Import/Export GeoJSON/KML
└─ Modo análisis territorial

FASE 4 · Evidencia visual AI  (4–6 sem)
├─ Análisis de fotos de parcela (clasificación gruesa)
├─ Comparación temporal mismo punto
└─ Integración como sugerencia, nunca decisión

FASE 5 · Gobernanza + Interop  (4 sem)
├─ Permisos granulares por campo
├─ Consentimiento explícito + licencias CC
├─ Export total ("llevate tus datos")
└─ API pública read-only + KoboToolbox/ODK ingest

FASE 6 · Offline / PWA  (3–4 sem)
├─ Service worker + cache de tiles
├─ Cola de sincronización offline
└─ Onboarding por rol
```

---

## 5. Stack técnico recomendado (sobre lo existente)

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | React + Vite + Tailwind (actual) + **PWA / service worker** | Sigue siendo apto; añadir offline |
| Datos | Lovable Cloud (Postgres) + **extensión PostGIS** | Polígonos, queries espaciales |
| Storage | Lovable Cloud Storage (actual) | Documentos, fotos |
| AI | **Lovable AI Gateway** (Gemini multimodal) | Sin API keys del usuario; documental + visual |
| Mapas | Leaflet (actual) + **vector tiles OSM** + capas externas (GBIF, MapBiomas) | Sin lock-in |
| Encuestas de campo | **KoboToolbox / ODK** vía webhook → ingest | Estándar del sector ONG/rural |
| Interop | API REST + **GeoJSON** + **BibTeX** (ya hay) | Datos portables |
| Auth | Lovable Cloud Auth (actual) + roles por red/SPG | RLS por organización |

---

## 6. Features innovadoras de alto impacto

1. **Rueda de transición pública por red**: cada SPG/red tiene su propio dashboard agregado, sin exponer datos individuales sin consentimiento.
2. **"Vecindades agroecológicas"**: cuando un productor sube una práctica, sugerir productores cercanos con prácticas complementarias.
3. **Padrinazgo entre redes**: una SPG consolidada puede acompañar a una en formación, con visitas registradas en plataforma.
4. **Trazabilidad QR de producto**: cada producto en mercado puede emitir QR público con su nivel de confianza, historial y red de pertenencia.
5. **Observatorio abierto**: datos agregados anónimos consultables por investigación y políticas públicas (con consentimiento explícito).
6. **Alertas territoriales**: notificación a la red si se detecta conflicto socioambiental (fumigación, desmonte) cerca de actores registrados.

---

## 7. Qué NO hacer

- ❌ Modelo de certificación cerrada / pago / centralizada.
- ❌ "Verdad automática" por AI sin validación humana.
- ❌ Lock-in: todo debe ser exportable.
- ❌ Forms anuales de 80 preguntas — preferir cargas cortas, frecuentes, contextuales.
- ❌ Métricas extractivas (engagement por engagement); medir lo agroecológicamente relevante.

---

## Próximo paso sugerido

Empezar por **Fase 1** porque (a) construye sobre el schema existente sin migraciones disruptivas, (b) da valor inmediato visible (rueda + timeline + reporte PDF), y (c) sienta la base de datos sobre la que se apoyan las fases 2 y 4.

¿Avanzamos con Fase 1, o querés que empiece por otro módulo (verificación multicapa / mapas multicapa / PWA offline)?
