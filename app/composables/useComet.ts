// Acceso al contenido publicado en CometCMS a través del proxy /api/comet
import type { MaybeRefOrGetter } from 'vue'

export interface Liga {
  id: string
  slug: string
  title: string
  codigo: string
  nombre: string
  descripcion?: string
  logo?: string[]
}

export interface Franquicia {
  id: string
  slug: string
  title: string
  codigo: string
  nombre: string
  descripcion?: string
  logo?: string[]
}

export interface Temporada {
  id: string
  slug: string
  title: string
  liga: Liga | string | null
  franquicia: Franquicia | string | null
  anio: number
  equipo_id: string
  nombre_equipo: string
  division: string
  posicion: number | null
  juegos: number | null
  victorias: number | null
  derrotas: number | null
  campeon_division: boolean
  comodin: boolean
  campeon_liga: boolean
  campeon_serie_mundial: boolean
  carreras: number | null
  turnos_al_bate: number | null
  hits: number | null
  jonrones: number | null
  bases_por_bolas: number | null
  ponches: number | null
  bases_robadas: number | null
  carreras_permitidas: number | null
  efectividad: number | null
  errores: number | null
  fildeo: number | null
  estadio: string
  asistencia: number | null
}

type Query = Record<string, string | number | boolean | undefined>

// CometCMS devuelve los campos propios dentro de `data`, mientras que las
// relaciones expandidas con `include` llegan con los campos en la raíz.
// Se aplanan ambos formatos para que las páginas usen entry.campo.
function flat(entry: any): any {
  if (!entry || typeof entry !== 'object') return entry
  const { data, ...rest } = entry
  const e = { ...rest, ...(data && typeof data === 'object' ? data : {}) }
  for (const rel of ['liga', 'franquicia']) {
    if (e[rel] && typeof e[rel] === 'object') e[rel] = flat(e[rel])
  }
  return e
}

/** Listado de un content type, con el total informado en meta. */
export function useCometList<T>(type: string, query: MaybeRefOrGetter<Query> = {}) {
  return useFetch(`/api/comet/content/${type}`, {
    query,
    transform: (res: any) => ({
      items: ((res?.data ?? []) as any[]).map(flat) as T[],
      total: Number(res?.meta?.total ?? res?.data?.length ?? 0)
    }),
    default: () => ({ items: [] as T[], total: 0 })
  })
}

/** Una entrada por slug o id. */
export function useCometEntry<T>(type: string, identifier: MaybeRefOrGetter<string>, query: Query = {}) {
  return useFetch(() => `/api/comet/content/${type}/${toValue(identifier)}`, {
    query,
    transform: (res: any) => flat(res?.data) as T | null,
    default: () => null
  })
}

// Helpers para relaciones que pueden venir expandidas (objeto) o solo como id
export function rel<T extends { codigo: string }>(v: T | string | null | undefined): T | null {
  return v && typeof v === 'object' ? v : null
}

export function seasonPath(t: Temporada) {
  const lg = rel(t.liga)?.slug ?? ''
  const fr = rel(t.franquicia)?.slug ?? ''
  return `/liga/${lg}/${fr}/${t.slug}`
}

const DIV_NAMES: Record<string, string> = {
  E: 'División Este',
  W: 'División Oeste',
  C: 'División Central',
  '': 'Sin división'
}

export function divName(div: string | null | undefined) {
  return DIV_NAMES[div ?? ''] ?? div
}

export function winPct(w: number | null, l: number | null) {
  const wn = Number(w), ln = Number(l)
  if (!wn && !ln) return '—'
  const pct = wn / (wn + ln)
  return isNaN(pct) ? '—' : pct.toFixed(3).replace(/^0/, '')
}
