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
        │  (pull mirror cada hora)
        ▼
Codeberg: AgroEcoRed/agroeco-red       ← espejo publicado + issues + PRs
```

- El código se escribe en el upstream de GitHub.
- Codeberg replica automáticamente y es el espacio comunitario de referencia.
- Los aportes de la comunidad entran por Codeberg y se aplican en el upstream.

---

## 2. Configurar la réplica automática (pull mirror)

En Codeberg, sobre el repositorio `AgroEcoRed/agroeco-red`:

1. Entrar en **Settings → Repository → Mirror Settings**.
2. Elegir **Pull mirror** (Codeberg trae los cambios; no hace falta dar acceso
   de escritura a nadie).
3. Completar:
   - **Clone From URL**: `https://github.com/AgroEcoRed/root-to-route-map.git`
   - **Authorization**: vacío si el repo de GitHub es público.
   - **Mirror Interval**: `1h` (o `8h` si se prefiere menos ruido).
   - Marcar **Sync when new commits are pushed** si aparece la opción.
4. Guardar y pulsar **Synchronize Now** para la primera copia.

> Si el repositorio de Codeberg ya tiene historia propia divergente, conviene
> renombrarlo (por ejemplo `agroeco-red-archivo`) y crear uno nuevo vacío como
> espejo. Un pull mirror sobrescribe la historia local del espejo.

### Alternativa: réplica manual desde una terminal

```bash
git clone --mirror https://github.com/AgroEcoRed/root-to-route-map.git
cd root-to-route-map.git
git remote add codeberg https://codeberg.org/AgroEcoRed/agroeco-red.git
git push --mirror codeberg
```

Repetir `git fetch --prune origin && git push --mirror codeberg` cuando se
quiera sincronizar.

---

## 3. Cumplir las guidelines de Codeberg sobre contenido generado con IA

Codeberg no prohíbe el uso de asistentes; pide que el proyecto sea un bien
común real y no consuma recursos de la comunidad sin contrapartida. Para eso:

- **No activar Woodpecker CI en Codeberg.** El build y el despliegue ocurren
  fuera de la infraestructura de Codeberg.
- **Mantenedoras humanas identificables**: `CONTRIBUTORS.md` lista la
  coordinación general y a lxs administradorxs de capa.
- **Revisión humana explícita**: documentada en `CONTRIBUTING.md`.
- **Uso real más allá de quien lo creó**: la plataforma está en producción en
  <https://agroeco.red> con redes territoriales usando el mapa.
- **Responder los issues** en Codeberg en plazos razonables.

---

## 4. Descripción del proyecto para Codeberg

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
> El desarrollo diario ocurre en el upstream de GitHub y se replica acá. Este
> es el espacio preferido para *issues*, discusiones y *pull requests*.
>
> Licencias: código AGPL-3.0, datos georreferenciados ODbL 1.0, contenidos
> CC BY-SA 4.0.
>
> Contacto: info@agroeco.red

---

## 5. Aviso al inicio del README (opcional pero recomendado)

```markdown
> **Espejo.** El desarrollo ocurre en
> <https://github.com/AgroEcoRed/root-to-route-map> y se replica acá cada hora.
> Abrí *issues* y *pull requests* en Codeberg: quien mantiene el proyecto los
> aplica en el upstream y la sincronización siguiente los refleja en ambos
> lados, conservando la autoría del commit.
```

---

*Última actualización: agosto 2026.*
