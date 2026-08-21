# Contribuir a AgroEco.Red

¡Gracias por sumarte! AgroEco.Red es un proyecto colectivo y toda contribución —código, datos, contenidos, traducciones, reporte de errores— es bienvenida.

## Formas de contribuir

1. **Reportar errores o sugerir mejoras** — abrí un *issue* con pasos para reproducir el problema y capturas si aplica.
2. **Aportar código** — leé la sección "Flujo de trabajo" más abajo.
3. **Cargar datos al mapa** — registrate en https://agroeco.red y sumá tu iniciativa. Los datos son publicados bajo ODbL 1.0.
4. **Aportar contenidos** — biblioteca, textos, materiales pedagógicos. Se publican bajo CC BY-SA 4.0.
5. **Traducir** — el sistema de i18n vive en `src/contexts/LanguageContext.tsx`.

## Dónde vive el código (y cómo evitar desincronizarse)

El desarrollo diario ocurre en el repositorio *upstream* de GitHub
(<https://github.com/AgroEcoRed/root-to-route-map>), porque está conectado a la
herramienta de desarrollo asistido que usa el equipo. Ese repositorio se
sincroniza hacia **Codeberg**
(<https://codeberg.org/AgroEcoRed/agroeco-red>), que es el espacio comunitario
de referencia para *issues*, discusiones y revisiones.

Si querés contribuir:

1. Abrí primero un *issue* en Codeberg describiendo el cambio.
2. Pedí que se sincronice el espejo antes de empezar, para partir de la última
   versión (el equipo puede hacerlo en el momento).
3. Enviá tu *pull request* a Codeberg. Quien mantiene el proyecto lo aplica en
   el upstream y la sincronización siguiente lo refleja en ambos lados,
   conservando tu autoría en el commit.

No dejamos ramas largas sin sincronizar: los cambios comunitarios se integran
en el ciclo de sincronización más cercano.

## Revisión humana

Parte del código se genera con asistencia de IA, pero **nada se publica sin
revisión humana**. Las personas que mantienen el proyecto figuran en
[`CONTRIBUTORS.md`](CONTRIBUTORS.md), conocen la base de código y son quienes
responden los *issues* y aplican correcciones.

## Flujo de trabajo (código)

1. *Fork* del repositorio (preferentemente Codeberg).
2. Crear una rama descriptiva: `feat/mapa-filtro-fecha`, `fix/estrella-color`, etc.
3. Instalar dependencias: `npm install`.
4. Ejecutar en modo desarrollo: `npm run dev`.
5. Verificar el build: `npm run build`.
6. Abrir un *pull request* / *merge request* explicando el cambio y su motivación.


## Estilo

- TypeScript estricto. Sin `any` salvo justificación.
- Componentes pequeños y enfocados; preferir composición.
- Colores y tipografías sólo mediante tokens semánticos del design system (`index.css`, `tailwind.config.ts`). No hardcodear colores.
- Textos de la interfaz en español rioplatense (idioma primario del proyecto).

## Licencia de tus contribuciones

Al enviar una contribución aceptás que se publique bajo la licencia correspondiente a esa capa del proyecto:

- **Código**: [GNU AGPL-3.0](./LICENSE)
- **Datos**: [ODbL 1.0](./DATA-LICENSE.md)
- **Contenidos**: [CC BY-SA 4.0](./CONTENT-LICENSE.md)

No se requiere firma de CLA. La atribución se conserva a través del historial de Git y los créditos en la plataforma.

## Código de conducta

Toda participación se rige por el [Código de Conducta](./CODE_OF_CONDUCT.md). Buscamos un espacio de cuidado, escucha y trabajo horizontal.

## Contacto

contacto@agroeco.red