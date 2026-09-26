# MLB Explorer — Archivo Histórico de Equipos

**Estudiante:** Nathali Abigail Chacon Murillo
**Curso:** EIF-511 Arquitectura de Información — Tarea 3: Uso de un CMS headless

**Sitio publicado en Netlify:** https://mlb-explorer-cometcms-nathali.netlify.app

## Descripción

El sitio del primer proyecto se adaptó para obtener todo su contenido desde **CometCMS**, un CMS headless.
El contenido ya no forma parte del código (antes estaba en `public/data/teams.json`). Ahora se administra
desde el panel de CometCMS y Nuxt lo consulta mediante la API REST de CometCMS.

- **Fuente de los datos:** [Baseball Databank](https://github.com/chadwickbureau/baseballdatabank) (Chadwick Baseball Bureau).
- **Registros cargados en el CMS:** temporadas 2010–2015 (2 ligas, 30 franquicias, 180 temporadas).

### Nota sobre el servidor CMS del curso

No se recibieron credenciales para el espacio en http://cms-una.gt.tc. Además, ese hosting responde con una
verificación de JavaScript (cookie `__test`) que impide que un servidor, como el de Nuxt, consulte la API.
Por eso CometCMS se instaló localmente (versión oficial de https://github.com/GetCometCMS/CometCMS). Para usar
el CMS del curso basta con cambiar las variables `NUXT_COMET_URL`, `NUXT_COMET_WORKSPACE` y `NUXT_COMET_API_TOKEN`;
el código no cambia.

## Jerarquía de navegación

```
Inicio
 └─ Ligas (AL, NL)                       → content type "ligas"
     └─ Franquicia (Yankees, Red Sox...)  → content type "franquicias"
         └─ Temporada (año + equipo)      → content type "temporadas"
```

Además existe una página de **Búsqueda global** (por equipo, año o estadio, con filtros por liga y títulos).

## Modelo de contenido en CometCMS

Los tres content types están marcados como **Private**, así que solo se pueden leer con un token.
Todos incluyen los campos `title` y `slug` propios de CometCMS.

**`ligas`**

| Campo | Tipo |
| --- | --- |
| codigo | text (requerido) |
| nombre | text (requerido) |
| descripcion | textarea |
| logo | media |

**`franquicias`**

| Campo | Tipo |
| --- | --- |
| codigo | text (requerido) |
| nombre | text (requerido) |
| descripcion | textarea |
| logo | media |

**`temporadas`**

| Campo | Tipo |
| --- | --- |
| **liga** | **relation → ligas** (llave foránea) |
| **franquicia** | **relation → franquicias** (llave foránea) |
| anio, posicion, juegos, victorias, derrotas | number |
| carreras, turnos_al_bate, hits, jonrones, bases_por_bolas, ponches, bases_robadas | number |
| carreras_permitidas, efectividad, errores, fildeo, asistencia | number |
| campeon_division, comodin, campeon_liga, campeon_serie_mundial | boolean |
| division | select (E, C, W) |
| equipo_id, nombre_equipo, estadio | text |

### Uso de las relaciones en el sitio

- **Detalle de temporada:** `GET temporadas/{slug}?include=liga,franquicia` trae la liga y la franquicia completas sin hacer más peticiones.
- **Página de liga:** `GET temporadas?filter[liga]={slug}&include=franquicia` trae las temporadas de esa liga.
- **Página de franquicia:** `GET temporadas?filter[liga]={slug}&filter[franquicia]={slug}&sort=-anio`.
- **Inicio:** `GET temporadas?filter[campeon_serie_mundial]=true&sort=-anio&limit=4` trae los campeones recientes.

## Front-end en Nuxt.js

- `server/api/comet/[...path].ts`: proxy en el servidor (Nitro) que agrega el encabezado `Authorization: Bearer ...`.
  El token nunca llega al navegador.
- `app/composables/useComet.ts`: `useCometList` y `useCometEntry` hacen `useFetch` contra `/api/comet/...` y aplanan la respuesta `{ data, meta }` de CometCMS.
- `nuxt.config.ts`: `runtimeConfig` con `cometApiToken`, `cometUrl` y `cometWorkspace`, que se leen del archivo `.env`.

## Cómo ejecutarlo

### 1. Instalar CometCMS (requiere PHP 8.2 o superior)

```bash
git clone https://github.com/GetCometCMS/CometCMS.git
cd CometCMS && npm install && make build
cp -R dist ../mlb-explorer/cms-local      # copiar dentro de la carpeta de este proyecto
```

### 2. Encender el CMS y crear el usuario administrador

```bash
npm run cms        # CometCMS queda en http://127.0.0.1:8000
```

Abrir http://127.0.0.1:8000/admin. La primera vez aparece la pantalla de configuración, donde se crea el usuario administrador.

### 3. Cargar los datos

1. En el panel, ir a **Access Tokens → New token** y crear un token con estos permisos:
   ```json
   [{ "effect": "allow",
      "actions": ["schema.create", "schema.read", "content.read", "content.create", "content.publish"],
      "resources": ["schema:*", "content:*"] }]
   ```
2. Abrir `scripts/importar-en-comet.js` y poner ese token en `TOKEN` y el nombre del workspace en `WORKSPACE`.
3. En el panel del CMS, abrir la consola del navegador (F12), pegar el contenido del archivo y presionar Enter.
   El script crea los content types y publica las ligas, las franquicias y las temporadas, ya enlazadas entre sí.
4. Revocar ese token y crear uno **solo de lectura** para el sitio:
   ```json
   [{ "effect": "allow", "actions": ["content.read"],
      "resources": ["content:ligas:*", "content:franquicias:*", "content:temporadas:*"] }]
   ```

Para cargar otro rango de años: `node scripts/generar-importacion.mjs 2005 2015`.

### 4. Ejecutar el sitio

```bash
npm install
cp .env.example .env   # completar el token de lectura, la URL (http://127.0.0.1:8000) y el workspace
npm run dev            # en otra terminal, con el CMS encendido
```

Abrir http://localhost:3000.

## Publicación en Netlify

El sitio se publica con `npm run generate`, la opción del tutorial que pre-renderiza el sitio.
Al compilar, Nuxt consulta el CMS y genera todas las páginas (ligas, franquicias y temporadas) ya con los datos.
El token no queda en los archivos publicados.

Para publicar cambios hechos en el CMS (con el CMS encendido):

```bash
npm run generate
npm run deploy     # netlify deploy --prod --no-build --dir .output/public
```
