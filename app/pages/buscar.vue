<template>
  <div class="container page">
    <Breadcrumbs :items="[{ label: 'Inicio', to: '/' }, { label: 'Buscar' }]" />
    <h1 class="page-title">Buscar en el archivo</h1>
    <p class="page-sub">Busca por equipo, ciudad, año o estadio entre las temporadas publicadas en CometCMS.</p>

    <div class="search-panel card">
      <input v-model="query" class="input" type="text" placeholder="Ej. Yankees, Dodgers, 1927, Fenway…" autofocus>
      <div class="filters">
        <select v-model="lgFilter" class="input select">
          <option value="">Todas las ligas</option>
          <option v-for="lg in leagueOptions" :key="lg.id" :value="lg.slug">{{ lg.codigo }} · {{ lg.nombre }}</option>
        </select>
        <select v-model="titleFilter" class="input select">
          <option value="">Cualquier resultado</option>
          <option value="ws">Solo campeones de Serie Mundial</option>
          <option value="lg">Solo campeones de liga</option>
          <option value="div">Solo campeones de división</option>
        </select>
      </div>
    </div>

    <p class="results-count">
      {{ loading ? 'Cargando…' : `${results.total.toLocaleString('es')} resultado(s)` }}
    </p>

    <div v-if="loading" class="grid grid-3">
      <div v-for="i in 6" :key="i" class="skeleton" style="height:110px" />
    </div>

    <p v-else-if="!results.items.length" class="no-results">No se encontraron resultados. Intenta con otro término o quita los filtros.</p>

    <div v-else class="grid grid-3">
      <NuxtLink v-for="t in results.items" :key="t.id" :to="seasonPath(t)" class="card-link">
        <div class="card result-card">
          <div class="result-top">
            <span class="pill pill-blue">{{ rel(t.liga)?.codigo }}</span>
            <span class="result-year">{{ t.anio }}</span>
          </div>
          <h3>{{ t.nombre_equipo }}</h3>
          <p>{{ t.victorias }}-{{ t.derrotas }} · {{ t.estadio || 'Estadio no registrado' }}</p>
          <span v-if="t.campeon_serie_mundial" class="pill pill-red">Serie Mundial</span>
        </div>
      </NuxtLink>
    </div>

    <Pagination v-if="!loading" :page="page" :total-pages="totalPages" @update:page="p => page = p" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCometList, seasonPath, rel, type Liga, type Temporada } from '~/composables/useComet'

const route = useRoute()
const router = useRouter()

const query = ref(String(route.query.q ?? ''))
const lgFilter = ref('')
const titleFilter = ref('')
const page = ref(1)
const pageSize = 12

// Se obtienen las ligas y todas las temporadas (con liga y franquicia expandidas)
// desde CometCMS; el filtrado se hace en el navegador para que también funcione
// en la versión estática generada con `npm run generate`.
const { data: ligasData } = await useCometList<Liga>('ligas')
const { data: temporadasData, status } = await useCometList<Temporada>('temporadas', {
  include: 'liga,franquicia',
  sort: '-anio'
})

const loading = computed(() => status.value === 'pending')
const leagueOptions = computed(() => [...ligasData.value.items].sort((a, b) => a.codigo.localeCompare(b.codigo)))

const filtered = computed(() => {
  let rows = temporadasData.value.items
  const q = query.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter(t =>
      t.nombre_equipo.toLowerCase().includes(q) ||
      (rel(t.franquicia)?.nombre ?? '').toLowerCase().includes(q) ||
      (t.estadio || '').toLowerCase().includes(q) ||
      String(t.anio).includes(q)
    )
  }
  if (lgFilter.value) rows = rows.filter(t => rel(t.liga)?.slug === lgFilter.value)
  if (titleFilter.value === 'ws') rows = rows.filter(t => t.campeon_serie_mundial)
  if (titleFilter.value === 'lg') rows = rows.filter(t => t.campeon_liga)
  if (titleFilter.value === 'div') rows = rows.filter(t => t.campeon_division)
  return rows
})

const results = computed(() => ({
  total: filtered.value.length,
  items: filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize)
}))
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))

watch([query, lgFilter, titleFilter], () => { page.value = 1 })
watch(query, (v) => {
  router.replace({ query: v ? { q: v } : {} })
})
</script>

<style scoped>
.page { padding: 40px 0 64px; }
.page-title { font-size: 30px; margin-bottom: 6px; }
.page-sub { color: var(--mlb-gray-600); margin: 0 0 24px; }

.search-panel { padding: 20px; display: flex; flex-direction: column; gap: 14px; margin-bottom: 12px; }
.filters { display: flex; gap: 12px; flex-wrap: wrap; }
.select { max-width: 240px; cursor: pointer; }

.results-count { font-size: 13px; color: var(--mlb-gray-600); margin: 20px 0 16px; }

.result-card { padding: 18px; height: 100%; display: flex; flex-direction: column; gap: 8px; }
.result-top { display: flex; justify-content: space-between; align-items: center; }
.result-year { font-family: var(--font-display); font-weight: 700; color: var(--mlb-gray-600); }
.result-card h3 { font-size: 16px; margin: 0; }
.result-card p { margin: 0; font-size: 13px; color: var(--mlb-gray-600); }
.no-results { color: var(--mlb-gray-600); padding: 40px 0; text-align: center; }
</style>
