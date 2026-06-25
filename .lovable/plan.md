
# Mejoras al registro y a la subida de información

Propongo dividir el trabajo en **4 fases** para entregar valor rápido y validar cada parte antes de seguir. Confirmame si querés que arranque por la Fase 1 o ajustamos el orden.

---

## Fase 1 — Registro con geolocalización y carga preliminar

**Objetivo:** que desde el primer paso del registro se capture la ubicación y se pueda adjuntar un listado previo de nodos.

- Pedir **geolocalización del dispositivo** en el primer paso del registro (botón "Usar mi ubicación actual" + permiso nativo `navigator.geolocation`). Fallback: ingresar dirección manualmente con autocompletado.
- Aclaración visible: *"Si tu experiencia tiene varios puntos (ej. varios nodos AE), registrá uno ahora y agregá el resto desde tu panel una vez dentro."*
- Nuevo paso opcional **"Cargar listado preliminar"**:
  - Adjuntar archivo (CSV / PDF / imagen) **o** pegar un link.
  - Queda guardado como "pendiente de verificación" en el perfil para completarlo después.
- Mismo bloque accesible **dentro de la plataforma** (en `/perfil` → "Importar nodos").

## Fase 2 — Crear nuevos puntos en el mapa (muy visible)

**Objetivo:** que agregar nodos AE u otros puntos sea evidente para usuarios registrados.

- Botón flotante **"+ Agregar punto al mapa"** persistente sobre `/mapa` para usuarios logueados.
- En el dashboard del usuario: card destacada **"Mis nodos en el mapa"** con CTA primaria para sumar uno nuevo.
- Formulario corto: tipo de nodo (AE, productor, comedor, etc.), ubicación (mapa + geolocalización), descripción, contacto.

## Fase 3 — Actividades con flyer y puntos brillantes en el mapa

**Objetivo:** subir eventos a partir de un flyer y que el mapa los muestre vivos.

- Carga de actividad: adjuntar **flyer (imagen/PDF)**. Intento de **extracción automática** de fecha, dirección y contacto (OCR vía Lovable AI), con campos editables.
- Si tiene **fecha + lugar** → punto en el mapa con animación **glow fucsia**, intensificándose cuanto más cerca esté la fecha; desaparece automáticamente al pasar.
- Si **no** tiene fecha o lugar → aparece igual en la **barra lateral de eventos**, marcado como "sin fecha/lugar".
- **Barra lateral desplegable** junto al mapa con pestañas: *Próximos · Sin fecha · Pasados*.
- Cada actividad muestra **contacto de confirmación**: el del flyer (mail/tel detectado) y/o el de la persona que la subió.

## Fase 4 — Red de vínculos entre co-organizadores

**Objetivo:** visualizar colaboraciones cuando varias organizaciones hacen un evento en conjunto.

- En el formulario de actividad: campo **"Co-organizadores"** (búsqueda de actores ya registrados + opción de añadir externos).
- Se genera una **arista en la red de vínculos** entre los actores co-organizadores.
- Capa visible solo al activar el botón **"Ver red de vínculos"** sobre el mapa.

---

## Detalles técnicos

- **DB (nuevas/actualizadas):**
  - `profiles`: ya tiene `lat/lng`; agregar `geolocation_source` (`device` | `manual`).
  - `events`: agregar `flyer_url`, `extracted_contact_email`, `extracted_contact_phone`, `co_organizers uuid[]`, `glow_until` (computado por `event_date`).
  - Nueva `preliminary_imports` (user_id, source_type `file|link`, url/path, status, notes) con RLS por dueño.
  - Nueva `actor_connections` ya existe → reutilizar para co-organizadores con `connection_type = 'co_event'`.
- **Storage:** reutilizar bucket `producer-media` para flyers y adjuntos preliminares.
- **OCR de flyers:** edge function `parse-flyer` que llama a Lovable AI (modelo con visión) y devuelve `{date, location, contact_email, contact_phone}`.
- **Mapa (Leaflet):** marcador custom con clase CSS animada; intensidad calculada por `daysUntil(event_date)`; auto-remoción al pasar la fecha.
- **Barra lateral de eventos:** componente nuevo `EventsSidebar.tsx` con tabs y filtros.
- **i18n:** todos los textos nuevos en ES/EN/FR/PT vía `LanguageContext`.
- **Geolocalización:** wrapper `useDeviceLocation()` con manejo de permisos denegados.

---

¿Empiezo por la **Fase 1** o querés cambiar el orden / alcance de alguna fase?
