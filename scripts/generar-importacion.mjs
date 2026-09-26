// Genera scripts/importar-en-comet.js a partir de data/teams.json.
//
// Uso:  node scripts/generar-importacion.mjs [anioDesde] [anioHasta]
//       (por defecto 2010 2015)
//
// El archivo generado se pega en la consola del navegador (DevTools) estando
// en el sitio de CometCMS, y crea los content types + los registros vía API.
import { readFileSync, writeFileSync } from 'node:fs'

const desde = Number(process.argv[2] ?? 2010)
const hasta = Number(process.argv[3] ?? 2015)

const teams = JSON.parse(readFileSync(new URL('../data/teams.json', import.meta.url), 'utf8'))
const rows = teams.filter(t => t.year >= desde && t.year <= hasta)

const num = v => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v))
const yes = v => v === 'Y'

const ligas = new Map()
const franquicias = new Map()
const temporadas = []

for (const t of rows) {
  if (!ligas.has(t.lgID)) {
    ligas.set(t.lgID, { slug: t.lgID.toLowerCase(), title: t.lgName, codigo: t.lgID, nombre: t.lgName })
  }
  if (!franquicias.has(t.franchID)) {
    franquicias.set(t.franchID, { slug: t.franchID.toLowerCase(), title: t.franchName, codigo: t.franchID, nombre: t.franchName })
  }
  temporadas.push({
    slug: t.id.toLowerCase(),
    title: `${t.year} ${t.name}`,
    // Las relaciones guardan el slug del registro enlazado (llave foránea)
    liga: t.lgID.toLowerCase(),
    franquicia: t.franchID.toLowerCase(),
    anio: t.year,
    equipo_id: t.teamID,
    nombre_equipo: t.name,
    ...(t.div ? { division: t.div } : {}),
    posicion: num(t.rank),
    juegos: num(t.G),
    victorias: num(t.W),
    derrotas: num(t.L),
    campeon_division: yes(t.DivWin),
    comodin: yes(t.WCWin),
    campeon_liga: yes(t.LgWin),
    campeon_serie_mundial: yes(t.WSWin),
    carreras: num(t.R),
    turnos_al_bate: num(t.AB),
    hits: num(t.H),
    jonrones: num(t.HR),
    bases_por_bolas: num(t.BB),
    ponches: num(t.SO),
    bases_robadas: num(t.SB),
    carreras_permitidas: num(t.RA),
    efectividad: num(t.ERA),
    errores: num(t.E),
    fildeo: num(t.FP),
    estadio: t.park,
    asistencia: num(t.attendance)
  })
}

// Esquemas de los content types (tablas) en CometCMS
const n = label => ({ type: 'number', label })
const b = label => ({ type: 'boolean', label, default: false })
const schemas = [
  {
    name: 'ligas',
    label: 'Ligas',
    visibility: 'private',
    fields: {
      codigo: { type: 'text', label: 'Código', required: true },
      nombre: { type: 'text', label: 'Nombre', required: true },
      descripcion: { type: 'textarea', label: 'Descripción' },
      logo: { type: 'media', label: 'Logo' }
    }
  },
  {
    name: 'franquicias',
    label: 'Franquicias',
    visibility: 'private',
    fields: {
      codigo: { type: 'text', label: 'Código', required: true },
      nombre: { type: 'text', label: 'Nombre', required: true },
      descripcion: { type: 'textarea', label: 'Descripción' },
      logo: { type: 'media', label: 'Logo' }
    }
  },
  {
    name: 'temporadas',
    label: 'Temporadas',
    visibility: 'private',
    fields: {
      liga: { type: 'relation', label: 'Liga', target: 'ligas', required: true },
      franquicia: { type: 'relation', label: 'Franquicia', target: 'franquicias', required: true },
      anio: n('Año'),
      equipo_id: { type: 'text', label: 'ID del equipo' },
      nombre_equipo: { type: 'text', label: 'Nombre del equipo' },
      division: {
        type: 'select',
        label: 'División',
        options: ['E', 'C', 'W']
      },
      posicion: n('Posición'),
      juegos: n('Juegos (G)'),
      victorias: n('Victorias (W)'),
      derrotas: n('Derrotas (L)'),
      campeon_division: b('Campeón de división'),
      comodin: b('Comodín'),
      campeon_liga: b('Campeón de liga'),
      campeon_serie_mundial: b('Campeón Serie Mundial'),
      carreras: n('Carreras (R)'),
      turnos_al_bate: n('Turnos al bate (AB)'),
      hits: n('Hits (H)'),
      jonrones: n('Jonrones (HR)'),
      bases_por_bolas: n('Bases por bolas (BB)'),
      ponches: n('Ponches (SO)'),
      bases_robadas: n('Bases robadas (SB)'),
      carreras_permitidas: n('Carreras permitidas (RA)'),
      efectividad: n('Efectividad (ERA)'),
      errores: n('Errores (E)'),
      fildeo: n('Porcentaje de fildeo (FP)'),
      estadio: { type: 'text', label: 'Estadio' },
      asistencia: n('Asistencia')
    }
  }
]

const data = { schemas, ligas: [...ligas.values()], franquicias: [...franquicias.values()], temporadas }

const importer = `// Importación MLB Explorer -> CometCMS (${desde}-${hasta}).
// 1. Inicie sesión en el panel de CometCMS.
// 2. Cree un Access Token con permisos schema.create, content.create y content.publish.
// 3. Complete TOKEN y WORKSPACE, pegue este archivo en la consola (DevTools) y presione Enter.
const TOKEN = 'ctcms_PEGUE_AQUI_SU_TOKEN'
const WORKSPACE = 'default'

const DATA = ${JSON.stringify(data)}

;(async () => {
  const base = location.origin + '/api/v1/workspaces/' + WORKSPACE
  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
      body: body ? JSON.stringify(body) : undefined
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(method + ' ' + path + ' -> ' + res.status + ' ' + JSON.stringify(json.error ?? json))
    return json.data
  }
  // Si el registro ya existe (por slug) se reutiliza, así el script puede re-ejecutarse
  const upsert = async (type, entry) => {
    try { return await call('GET', '/content/' + type + '/' + entry.slug) } catch {}
    return call('POST', '/content/' + type, { ...entry, status: 'published' })
  }

  for (const schema of DATA.schemas) {
    try { await call('POST', '/content-types', schema); console.log('Tipo creado:', schema.name) }
    catch (e) { console.warn('Tipo', schema.name, 'no creado (¿ya existe?):', e.message) }
  }

  for (const l of DATA.ligas) await upsert('ligas', l)
  for (const f of DATA.franquicias) await upsert('franquicias', f)
  console.log('Ligas y franquicias listas:', DATA.ligas.length, '+', DATA.franquicias.length)

  let i = 0
  for (const t of DATA.temporadas) {
    await upsert('temporadas', t)
    if (++i % 20 === 0) console.log('Temporadas:', i, '/', DATA.temporadas.length)
  }
  console.log('Importación terminada:', i, 'temporadas')
})()
`

writeFileSync(new URL('./importar-en-comet.js', import.meta.url), importer)
console.log(`Generado scripts/importar-en-comet.js: ${ligas.size} ligas, ${franquicias.size} franquicias, ${temporadas.length} temporadas (${desde}-${hasta})`)
