# Auto-alojamiento de AgroEco.Red

> Guía para replicar la plataforma en infraestructura propia — priorizando
> soberanía tecnológica, servidores en territorio argentino y software libre.

AgroEco.Red se distribuye como **software libre bajo AGPL-3.0**. Cualquier
organización, cooperativa o comunidad puede desplegar su propia instancia,
adaptarla a sus necesidades y federarse con otras redes agroecológicas.

Este documento describe los pasos, los componentes y las decisiones abiertas
de la migración desde la infraestructura administrada actual hacia un stack
100% autoalojable.

---

## 1. Componentes de la plataforma

| Capa | Tecnología actual | Alternativa autoalojable |
|------|-------------------|--------------------------|
| Frontend | React 18 + Vite + Tailwind | Igual — se construye a estáticos y se sirve con Nginx / Caddy |
| API + Auth + DB | Supabase (managed) | **Supabase self-hosted** (Docker Compose) o Postgres + PostgREST + GoTrue |
| Storage de archivos | Supabase Storage | MinIO o Supabase Storage self-hosted |
| Funciones serverless | Supabase Edge Functions (Deno) | `supabase functions serve` en un VPS o Deno Deploy autohospedado |
| IA (chatbot Sembra, parse-flyer) | Lovable AI Gateway (Gemini) | Cualquier proveedor compatible con OpenAI API (Ollama local, vLLM, DeepSeek, etc.) |
| Correo transaccional | Resend | Postmark, Mailgun o un SMTP propio (Postfix + DKIM) |
| Mapas base | OpenStreetMap (tile.openstreetmap.org) | Tile server propio (OpenMapTiles + tileserver-gl) |
| Geocodificación | Nominatim público | Nominatim autoalojado sobre OSM Argentina |

---

## 2. Requisitos mínimos

Para una instancia con ~2.000 actores mapeados y tráfico regional:

- **VPS / servidor**: 4 vCPU, 8 GB RAM, 80 GB SSD.
- **Base de datos**: PostgreSQL 15+ con extensiones `pgcrypto`, `pg_trgm` y
  (opcional) `postgis` si se quieren consultas espaciales avanzadas.
- **Dominio propio** con certificado TLS (Let's Encrypt).
- **SMTP** habilitado para enviar confirmaciones de registro y de actividades.

### Proveedores sugeridos en Argentina

- [**ARSAT**](https://www.arsat.com.ar/) — infraestructura estatal, Data
  Center Tier III en Benavídez.
- [**gcoop**](https://www.gcoop.coop/) — cooperativa de software libre.
- [**Donweb / Neolo**](https://donweb.com/) — hosting comercial argentino.
- Servidores universitarios (UNSAM, UBA) para instancias académicas.

---

## 3. Pasos de despliegue

### 3.1 Clonar el repositorio

```bash
git clone https://codeberg.org/AgroEcoRed/agroeco-red.git
cd agroeco-red
```

### 3.2 Levantar el backend con Supabase self-hosted

```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# editar .env: cambiar POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, SITE_URL
docker compose up -d
```

### 3.3 Aplicar las migraciones del proyecto

Las migraciones SQL viven en `supabase/migrations/`. Aplicarlas en orden:

```bash
for f in supabase/migrations/*.sql; do
  psql "$SUPABASE_DB_URL" -f "$f"
done
```

### 3.4 Configurar variables de entorno del frontend

Crear `.env.local`:

```
VITE_SUPABASE_URL=https://tu-instancia.example.org
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=self-hosted
```

### 3.5 Compilar y servir el frontend

```bash
npm install
npm run build
# el resultado queda en dist/, servir con Nginx / Caddy
```

### 3.6 Desplegar las Edge Functions

```bash
cd supabase/functions
supabase functions deploy notify-event-created
supabase functions deploy parse-flyer
supabase functions deploy invite-layer-manager
supabase functions deploy edit-event-by-token
# ... resto de funciones en el directorio
```

Definir los secretos: `RESEND_API_KEY`, `RESEND_FROM`, `LOVABLE_API_KEY`
(o su equivalente para el proveedor de IA elegido).

---

## 4. Migración de datos

Para trasladar información desde la instancia canónica de AgroEco.Red hacia
una instancia federada:

1. Solicitar a la administración general un **volcado ODbL** de las capas
   públicas del mapa (`layer_actors`, `data_source_settings`).
2. Importar el dump con `psql \copy` o con las herramientas de la interfaz
   `/admin`.
3. Respetar la atribución: cada capa mantiene su `source_id` y sus
   responsables originales.

Los **datos personales** (emails, teléfonos, tokens de edición) **no se
comparten** entre instancias federadas. Cada persona debe re-confirmar su
participación en la nueva instancia.

---

## 5. Federación (roadmap)

A mediano plazo, AgroEco.Red busca implementar sincronización entre
instancias mediante ActivityPub o un protocolo similar, de forma que las
capas del mapa y los eventos puedan compartirse sin centralizar la
infraestructura. Este trabajo se coordina en el issue tracker de Codeberg.

---

## 6. Licencias

- **Código fuente**: [AGPL-3.0](../LICENSE)
- **Datos georreferenciados**: [ODbL 1.0](../DATA-LICENSE.md)
- **Contenidos colaborativos**: [CC BY-SA 4.0](../CONTENT-LICENSE.md)

Al desplegar tu propia instancia, tenés la obligación (AGPL) de mantener el
código fuente disponible para las personas usuarias de tu servicio, incluidas
las modificaciones que hagas.

---

## 7. Soporte y contacto

- **Repositorio de desarrollo (upstream, siempre al día):**
  <https://github.com/AgroEcoRed/root-to-route-map> — es el repositorio conectado
  a la herramienta de desarrollo asistido que usa el equipo, por lo que recibe
  los commits primero.
- **Repositorio comunitario en Codeberg (espejo publicado):**
  <https://codeberg.org/AgroEcoRed/agroeco-red> — se sincroniza periódicamente
  desde el upstream. Es el lugar preferido para *issues*, discusiones y
  *pull requests* de la comunidad.
- **Cómo contribuir sin desincronizarse:** abrí el *issue* o el PR en Codeberg.
  Quien mantiene el proyecto aplica el cambio sobre el upstream de GitHub y en
  la siguiente sincronización queda reflejado en Codeberg. No trabajes sobre un
  fork de Codeberg durante mucho tiempo sin avisar: pedí primero que se
  sincronice el espejo para partir de la última versión.
- **Cómo se mantiene el espejo:** ver [`docs/codeberg-espejo.md`](./codeberg-espejo.md).
- Contacto: `info@agroeco.red`


*Última actualización: Agosto 2026.*
