<template>
  <div class="container page">
    <Breadcrumbs :items="[{ label: 'Inicio', to: '/' }, { label: 'Ligas', to: '/ligas' }, { label: lgName }]" />

    <div v-if="!liga" class="empty">
      <h1>Liga no encontrada</h1>
      <NuxtLink to="/ligas" class="btn btn-primary">Volver a ligas</NuxtLink>
    </div>

    <template v-else>
      <p class="eyebrow">{{ liga.codigo }}</p>
      <h1 class="page-title">{{ lgName }}</h1>
      <p v-if="liga.descripcion" class="page-desc">{{ liga.descripcion }}</p>
      <p class="page-sub">{{ allFranchises.length }} franquicias · {{ totalSeasons.toLocaleString('es') }} temporadas registradas</p>

      <div class="toolbar">
        <input v-model="query" class="input" type="text" placeholder="Buscar franquicia por nombre…">
      </div>

      <div v-if="loading" class="grid grid-3">
        <div v-for="i in 6" :key="i" class="skeleton" style="height:104px" />
      </div>

      <p v-else-if="!filtered.length" class="no-results">No se encontraron franquicias que coincidan con "{{ query }}".</p>

      <div v-else class="grid grid-3">
        <NuxtLink v-for="f in pageItems" :key="f.franchID" :to="`/liga/${lgSlug}/${f.slug}`" class="card-link">
          <div class="card franch-card">
            <h3>{{ f.franchName }}</h3>
            <p>{{ f.count }} temporadas · {{ f.minYear }}–{{ f.maxYear }}</p>
            <div class="franch-badges">
              <span v-if="f.titles" class="pill pill-red">{{ f.titles }}× Serie Mundial</span>
              <span v-if="f.divTitles" class="pill pill-blue">{{ f.divTitles }}× División</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <Pagination v-if="!loading" :page="page" :total-pages="totalPages" @update:page="p => page = p" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCometEntry, useCometList, rel, type Liga, type Temporada } from '~/composables/useComet'

const route = useRoute()
const lgSlug = computed(() => String(route.params.lg).toLowerCase())

const { data: liga } = await useCometEntry<Liga>('ligas', lgSlug)
// Temporadas de esta liga: filtro por la relación "liga" + include de la franquicia
const { data: temporadasData, status } = await useCometList<Temporada>('temporadas', () => ({
  'filter[liga]': liga.value?.slug ?? '-',
  include: 'franquicia'
}))

const loading = computed(() => status.value === 'pending')
const leagueRows = computed(() => temporadasData.value.items)
const lgName = computed(() => liga.value?.nombre ?? lgSlug.value.toUpperCase())
const totalSeasons = computed(() => leagueRows.value.length)

const allFranchises = computed(() => {
  const map = new Map<string, { franchID: string; slug: string; franchName: string; count: number; minYear: number; maxYear: number; titles: number; divTitles: number }>()
  for (const t of leagueRows.value) {
    const fr = rel(t.franquicia)
    if (!fr) continue
    if (!map.has(fr.id)) {
      map.set(fr.id, { franchID: fr.id, slug: fr.slug, franchName: fr.nombre, count: 0, minYear: t.anio, maxYear: t.anio, titles: 0, divTitles: 0 })
    }
    const e = map.get(fr.id)!
    e.count++
    e.minYear = Math.min(e.minYear, t.anio)
    e.maxYear = Math.max(e.maxYear, t.anio)
    if (t.campeon_serie_mundial) e.titles++
    if (t.campeon_division) e.divTitles++
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.franchName.localeCompare(b.franchName))
})

const query = ref('')
const page = ref(1)
const pageSize = 12

const filtered = computed(() => {
  if (!query.value.trim()) return allFranchises.value
  const q = query.value.toLowerCase()
  return allFranchises.value.filter(f => f.franchName.toLowerCase().includes(q))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const pageItems = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch(query, () => { page.value = 1 })
watch(lgSlug, () => { page.value = 1; query.value = '' })
</script>

<style scoped>
.page { padding: 40px 0 64px; }
.page-title { font-size: 30px; margin: 4px 0 6px; }
.page-sub { color: var(--mlb-gray-600); margin: 0 0 24px; }
.page-desc { max-width: 720px; line-height: 1.6; margin: 0 0 8px; }
.toolbar { max-width: 420px; margin-bottom: 28px; }
.franch-card { padding: 20px; height: 100%; }
.franch-card h3 { font-size: 17px; margin-bottom: 6px; }
.franch-card p { margin: 0 0 10px; font-size: 13px; color: var(--mlb-gray-600); }
.franch-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.no-results { color: var(--mlb-gray-600); padding: 40px 0; text-align: center; }
.empty { padding: 60px 0; text-align: center; }
</style>
