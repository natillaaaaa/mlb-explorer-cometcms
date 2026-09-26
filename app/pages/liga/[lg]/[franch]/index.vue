<template>
  <div class="container page">
    <Breadcrumbs :items="[
      { label: 'Inicio', to: '/' },
      { label: 'Ligas', to: '/ligas' },
      { label: lgName, to: `/liga/${lgSlug}` },
      { label: franchName }
    ]" />

    <template v-if="!liga || !franquicia">
      <div class="empty">
        <h1>Franquicia no encontrada</h1>
        <NuxtLink :to="`/liga/${lgSlug}`" class="btn btn-primary">Volver a {{ lgName }}</NuxtLink>
      </div>
    </template>

    <template v-else>
      <div class="franch-head">
        <img v-if="franquicia.logo?.length" :src="franquicia.logo[0]" :alt="`Logo de ${franchName}`" class="franch-logo">
        <div>
          <p class="eyebrow">{{ liga.codigo }} · Franquicia</p>
          <h1 class="page-title">{{ franchName }}</h1>
        </div>
      </div>
      <p v-if="franquicia.descripcion" class="page-desc">{{ franquicia.descripcion }}</p>
      <p class="page-sub">{{ rows.length }} temporadas registradas ({{ minYear }}–{{ maxYear }})</p>

      <div class="summary-strip">
        <div class="summary-item"><strong>{{ titles }}</strong><span>Serie Mundial</span></div>
        <div class="summary-item"><strong>{{ lgTitles }}</strong><span>Títulos de Liga</span></div>
        <div class="summary-item"><strong>{{ divTitles }}</strong><span>Títulos de División</span></div>
        <div class="summary-item"><strong>{{ totalWins.toLocaleString('es') }}</strong><span>Victorias totales</span></div>
      </div>

      <div class="toolbar">
        <input v-model="query" class="input" type="text" placeholder="Buscar temporada por año, nombre o estadio…">
      </div>

      <p v-if="!loading && !filtered.length" class="no-results">No se encontraron temporadas para "{{ query }}".</p>

      <div v-else class="table-wrap">
        <table v-if="!loading" class="season-table">
          <thead>
            <tr>
              <th>Año</th><th>Equipo</th><th>Div.</th><th>G-P</th><th>%</th><th>Título</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in pageItems" :key="t.id" class="row-link" @click="go(t)">
              <td class="year-cell">{{ t.anio }}</td>
              <td>{{ t.nombre_equipo }}</td>
              <td>{{ t.division || '—' }}</td>
              <td>{{ t.victorias }}-{{ t.derrotas }}</td>
              <td>{{ pct(t.victorias, t.derrotas) }}</td>
              <td>
                <span v-if="t.campeon_serie_mundial" class="pill pill-red">Serie Mundial</span>
                <span v-else-if="t.campeon_liga" class="pill pill-blue">Liga</span>
                <span v-else-if="t.campeon_division" class="pill">División</span>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="skeleton" style="height:320px" />
      </div>

      <Pagination v-if="!loading" :page="page" :total-pages="totalPages" @update:page="p => page = p" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCometEntry, useCometList, winPct, type Franquicia, type Liga, type Temporada } from '~/composables/useComet'

const route = useRoute()
const router = useRouter()
const lgSlug = computed(() => String(route.params.lg).toLowerCase())
const franchSlug = computed(() => String(route.params.franch).toLowerCase())

const { data: liga } = await useCometEntry<Liga>('ligas', lgSlug)
const { data: franquicia } = await useCometEntry<Franquicia>('franquicias', franchSlug)
// Temporadas que enlazan con esta liga y con esta franquicia
const { data: temporadasData, status } = await useCometList<Temporada>('temporadas', () => ({
  'filter[liga]': liga.value?.slug ?? '-',
  'filter[franquicia]': franquicia.value?.slug ?? '-',
  sort: '-anio'
}))

const loading = computed(() => status.value === 'pending')
const rows = computed(() => temporadasData.value.items)

const lgName = computed(() => liga.value?.nombre ?? lgSlug.value.toUpperCase())
const franchName = computed(() => franquicia.value?.nombre ?? franchSlug.value.toUpperCase())
const minYear = computed(() => rows.value.length ? Math.min(...rows.value.map(t => t.anio)) : '—')
const maxYear = computed(() => rows.value.length ? Math.max(...rows.value.map(t => t.anio)) : '—')
const titles = computed(() => rows.value.filter(t => t.campeon_serie_mundial).length)
const lgTitles = computed(() => rows.value.filter(t => t.campeon_liga).length)
const divTitles = computed(() => rows.value.filter(t => t.campeon_division).length)
const totalWins = computed(() => rows.value.reduce((s, t) => s + (Number(t.victorias) || 0), 0))

const query = ref('')
const page = ref(1)
const pageSize = 15

const filtered = computed(() => {
  if (!query.value.trim()) return rows.value
  const q = query.value.toLowerCase()
  return rows.value.filter(t =>
    String(t.anio).includes(q) ||
    t.nombre_equipo.toLowerCase().includes(q) ||
    (t.estadio || '').toLowerCase().includes(q)
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const pageItems = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch(query, () => { page.value = 1 })
watch(franchSlug, () => { page.value = 1; query.value = '' })

function pct(w: number | null, l: number | null) { return winPct(w, l) }

function go(t: Temporada) {
  router.push(`/liga/${lgSlug.value}/${franchSlug.value}/${t.slug}`)
}
</script>

<style scoped>
.page { padding: 40px 0 64px; }
.page-title { font-size: 30px; margin: 4px 0 6px; }
.page-sub { color: var(--mlb-gray-600); margin: 0 0 20px; }
.page-desc { max-width: 720px; line-height: 1.6; margin: 0 0 8px; }
.franch-head { display: flex; align-items: center; gap: 16px; }
.franch-logo { width: 64px; height: 64px; object-fit: contain; }

.summary-strip {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  padding: 18px 22px;
  background: var(--mlb-gray-50);
  border: 1px solid var(--mlb-gray-200);
  border-radius: var(--radius);
  margin-bottom: 24px;
}
.summary-item { display: flex; flex-direction: column; }
.summary-item strong { font-family: var(--font-display); font-size: 22px; color: var(--mlb-blue); }
.summary-item span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mlb-gray-600); }

.toolbar { max-width: 420px; margin-bottom: 20px; }

.table-wrap { overflow-x: auto; border: 1px solid var(--mlb-gray-200); border-radius: var(--radius); }
.season-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.season-table th {
  text-align: left;
  padding: 12px 16px;
  background: var(--mlb-blue);
  color: #fff;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.season-table td { padding: 12px 16px; border-top: 1px solid var(--mlb-gray-100); }
.year-cell { font-weight: 700; color: var(--mlb-blue); font-family: var(--font-display); }
.row-link { cursor: pointer; }
.row-link:hover { background: var(--mlb-gray-50); }
.no-results { color: var(--mlb-gray-600); padding: 40px 0; text-align: center; }
.empty { padding: 60px 0; text-align: center; }
</style>
