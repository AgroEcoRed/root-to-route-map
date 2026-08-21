# Réplica GitHub → Codeberg y presentación del proyecto

Guía operativa para mantener el espejo de AgroEco.Red sincronizado y para
presentar el proyecto en Codeberg dejando clara la gobernanza humana.

---

## 1. Cómo queda el flujo

```text
Herramienta de desarrollo asistido
        │  (push automático)
        ▼
GitHub: AgroEcoRed/root-to-route-map   ← repositorio vivo (upstream)
        │  (GitHub Action en cada commit a main)
        ▼
Codeberg: AgroEcoRed/agroeco-red       ← repo normal: issues + pull requests
```

- El código se escribe en el upstream de GitHub.
- Una **GitHub Action** (`.github/workflows/mirror-to-codeberg.yml`) empuja a
  Codeberg en cada commit a `main`. El cómputo lo pone GitHub, no Codeberg.
- Codeberg queda como repositorio normal, con *issues* y *pull requests*
  habilitados: es el espacio comunitario de referencia.

---

## 2. Por qué no usamos pull mirror

Codeberg corre Forgejo, y Forgejo **no permite convertir un repositorio
existente en pull mirror**: el modo espejo solo se define al crear el
repositorio con *New Migration*, marcando "This repository will be a mirror".
En un repo ya creado, `Settings → Repository → Mirror Settings` solo ofrece
**push mirrors**, que empujan desde Codeberg hacia afuera — lo contrario de lo
que necesitamos.

Ver <https://forgejo.org/docs/latest/user/repo-mirror/>.

Recrear el repositorio de Codeberg como espejo tampoco sirve acá: **los repos
espejo no aceptan pull requests**, y `CONTRIBUTING.md` invita justamente a
mandar PRs a Codeberg.

Por eso el espejo se hace **empujando desde GitHub**.

---

## 3. Puesta en marcha (una sola vez)

1. **Token en Codeberg.** Foto de perfil → *Settings* → *Applications* →
   *Manage Access Tokens* → *Generate New Token*. Nombre sugerido:
   `github-mirror`. Permisos: `repository` en modo **Read and Write**. Copiar
   el token: se muestra una sola vez.
2. **Secret en GitHub.** En `AgroEcoRed/root-to-route-map`: *Settings* →
   *Secrets and variables* → *Actions* → *New repository secret*.
   Name: `CODEBERG_TOKEN`. Secret: el token de Codeberg.
3. **Workflows habilitados.** En GitHub → *Settings* → *Actions* → *General*,
   verificar que los workflows estén habilitados con permisos de lectura.
4. **Primera sincronización a mano.** Pestaña *Actions* → "Espejo a Codeberg"
   → *Run workflow*.

---

## 4. Qué pasa cuando alguien contribuye en Codeberg

1. El *pull request* se revisa y discute en Codeberg.
2. Quien mantiene el proyecto aplica el cambio sobre el upstream de GitHub
   conservando la autoría del commit (`git cherry-pick` o `git am`).
3. El push siguiente lo refleja en ambos lados.

El workflow empuja **sin `--force`** a propósito. Si las historias divergen
(por ejemplo, porque se mergeó algo directamente en Codeberg), el workflow
**falla y avisa** en vez de borrar el aporte de la comunidad. Ante ese fallo:
integrar primero el cambio en el upstream y volver a correr el workflow.
Nunca forzar el push.

### Plan B: sincronización manual desde una terminal

```bash
git clone --mirror https://github.com/AgroEcoRed/root-to-route-map.git
cd root-to-route-map.git
git remote add codeberg https://codeberg.org/AgroEcoRed/agroeco-red.git
git push --mirror codeberg
```

Repetir `git fetch --prune origin && git push --mirror codeberg` cuando se
quiera sincronizar.

> `--mirror` **sí sobrescribe** la historia del destino. Usarlo solo si el
> repositorio de Codeberg no tiene aportes propios sin integrar.

---

## 5. Cumplir las guidelines de Codeberg sobre contenido generado con IA

Codeberg no prohíbe el uso de asistentes; pide que el proyecto sea un bien
común real y no consuma recursos de la comunidad sin contrapartida. Para eso:

- **No activar Woodpecker CI en Codeberg.** El build, el despliegue y el
  espejo ocurren fuera de la infraestructura de Codeberg.
- **Mantenedoras humanas identificables**: `CONTRIBUTORS.md` lista la
  coordinación general y a lxs administradorxs de capa.
- **Revisión humana explícita**: documentada en `CONTRIBUTING.md`.
- **Uso real más allá de quien lo creó**: la plataforma está en producción en
  <https://agroeco.red> con redes territoriales usando el mapa.
- **Responder los issues** en Codeberg en plazos razonables.

---

## 6. Descripción del proyecto para Codeberg

**Descripción corta** (campo *Description* del repositorio, máx. ~200 car.):

> Plataforma digital libre para los sistemas alimentarios agroecológicos:
> mapeo colaborativo, capas autogestionadas por redes territoriales,
> biblioteca abierta y SPG. AGPL-3.0 / ODbL / CC BY-SA.

**Website**: `https://agroeco.red`

**Topics**: `agroecology` `food-systems` `mapping` `leaflet` `openstreetmap`
`commons` `argentina` `agplv3` `odbl` `civic-tech`

**Texto largo** (para el README de Codeberg o la página de la organización):

> AgroEco.Red es una plataforma digital libre para los sistemas alimentarios
> agroecológicos. Reúne un mapa colaborativo de actores (producción,
> comercialización, servicios, redes), actividades territoriales, una
> biblioteca de acceso abierto y herramientas de Sistemas Participativos de
> Garantía.
>
> Cada red territorial administra su propia capa del mapa de forma autónoma:
> decide qué se releva, valida la información y responde por la calidad de sus
> datos. La coordinación general y lxs administradorxs de capa figuran en
> `CONTRIBUTORS.md`.
>
> Parte del código se genera con asistencia de herramientas automatizadas —por
> eso muchos commits figuran a nombre de un bot de despliegue—, pero **nada se
> publica sin revisión humana** y las decisiones de diseño, contenido y
> gobernanza de datos las toman personas.
>
> El desarrollo diario ocurre en el upstream de GitHub y se replica acá
> automáticamente en cada commit. Este es el espacio preferido para *issues*,
> discusiones y *pull requests*.
>
> Licencias: código AGPL-3.0, datos georreferenciados ODbL 1.0, contenidos
> CC BY-SA 4.0.
>
> Contacto: info@agroeco.red

---

## 7. Aviso al inicio del README (ya incluido)

```markdown
> **Espejo.** El desarrollo diario ocurre en
> <https://github.com/AgroEcoRed/root-to-route-map> y se replica automáticamente acá
> en cada commit. Abrí *issues* y *pull requests* en
> <https://codeberg.org/AgroEcoRed/agroeco-red>: quien mantiene el proyecto los aplica
> en el upstream y la sincronización siguiente los refleja en ambos lados,
> conservando la autoría del commit.
```

---

*Última actualización: agosto 2026.*
