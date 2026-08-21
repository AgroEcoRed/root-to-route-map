# AgroEco.Red

**Plataforma libre y colaborativa para el mapeo, articulación y fortalecimiento de sistemas alimentarios agroecológicos.**

Sitio: https://agroeco.red

AgroEco.Red es una infraestructura pública de investigación-acción que integra:

- Un **mapa colaborativo** de actores agroecológicos (productorxs, nodos, ferias, redes, iniciativas).
- Un **mercado agroecológico** con pedidos directos entre consumidorxs y productorxs.
- Una **biblioteca abierta** de conocimientos sobre agroecología y Sistemas Participativos de Garantía (SPG).
- Un **sistema de verificación comunitaria** y de votos de confianza entre actores de la red.

La plataforma se desarrolla con la vocación de sostener la **soberanía tecnológica y alimentaria**, y de alojar sus datos en servidores en territorio argentino.

---

## Licencias

AgroEco.Red distingue tres capas y aplica una licencia libre a cada una:

| Capa | Licencia | Alcance |
|------|----------|---------|
| Código fuente | **[GNU AGPL-3.0](./LICENSE)** | Todo el software del repositorio. |
| Datos georreferenciados (mapa, actores, eventos) | **[Open Database License (ODbL) 1.0](./DATA-LICENSE.md)** | Base de datos del mapa y sus extractos. |
| Contenidos colaborativos (biblioteca, textos, imágenes) | **[Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0)](./CONTENT-LICENSE.md)** | Documentos, artículos y materiales cargados por la comunidad. |

Cualquier reutilización debe conservar la atribución a **AgroEco.Red** y a lxs autorxs originales de cada dato o contenido, y redistribuirse bajo la misma licencia.

---

## Equipo

El desarrollo técnico se apoya en herramientas automatizadas (por eso muchos commits figuran a nombre de un bot de despliegue), pero las decisiones sobre qué se mapea, cómo se verifica y bajo qué licencias se comparte las toma un equipo de personas y organizaciones territoriales. El listado está en [`CONTRIBUTORS.md`](./CONTRIBUTORS.md).

Cada capa del mapa la administra de forma autónoma la red que la sostiene. Si tu organización quiere gestionar su propia capa e integrar el equipo, escribinos a **info@agroeco.red**.

## Cómo contribuir

Leé la guía de contribución en [`CONTRIBUTING.md`](./CONTRIBUTING.md) y el [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).


---

## Desarrollo local

Requisitos: Node.js 20+ y `npm` o `bun`.

```sh
git clone https://codeberg.org/agroecored/agroeco-red.git
cd agroeco-red
npm install
npm run dev
```

El backend (base de datos, auth, funciones, storage) está desplegado en Lovable Cloud (Supabase). Para levantar una instancia propia consultar [`docs/self-hosting.md`](./docs/self-hosting.md) (en preparación).

---

## Stack técnico

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Leaflet para el mapa
- Supabase (Postgres, Auth, Edge Functions, Storage)

---

## Contacto

contacto@agroeco.red
