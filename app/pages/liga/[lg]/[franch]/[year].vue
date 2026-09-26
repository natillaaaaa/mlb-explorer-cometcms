<template>
  <div class="container page">
    <Breadcrumbs :items="[
      { label: 'Inicio', to: '/' },
      { label: 'Ligas', to: '/ligas' },
      { label: lgName, to: `/liga/${lgSlug}` },
      { label: franchName, to: `/liga/${lgSlug}/${franchSlug}` },
      { label: yearLabel }
    ]" />

    <div v-if="loading" class="skeleton" style="height:400px" />

    <div v-else-if="!team" class="empty">
      <h1>Temporada no encontrada</h1>
      <NuxtLink :to="`/liga/${lgSlug}/${franchSlug}`" class="btn btn-primary">Volver a {{ franchName }}</NuxtLink>
    </div>

    <template v-else>
      <div class="detail-head">
        <div>
          <p class="eyebrow">{{ team.anio }} · {{ lgName }}</p>
          <h1 class="page-title">{{ team.nombre_equipo }}</h1>
          <p class="page-sub">{{ team.estadio || 'Estadio no registrado' }}</p>
        </div>
        <div class="badges">
          <span v-if="team.campeon_serie_mundial" class="pill pill-red">🏆 Campeón Serie Mundial</span>
          <span v-if="team.campeon_liga" class="pill pill-blue">Campeón de Liga</span>
          <span v-if="team.campeon_division" class="pill">Campeón de División</span>
          <span v-if="team.comodin" class="pill">Comodín</span>
        </div>
      </div>

      <div class="grid grid-4 record-grid">
        <div class="stat-card"><span>Récord</span><strong>{{ team.victorias }}-{{ team.derrotas }}</strong></div>
        <div class="stat-card"><span>Porcentaje</span><strong>{{ pct }}</strong></div>
        <div class="stat-card"><span>Posición</span><strong>{{ team.posicion || '—' }}º · {{ divLabel }}</strong></div>
        <div class="stat-card"><span>Asistencia</span><strong>{{ attendance }}</strong></div>
      </div>

      <div class="grid grid-2 stats-cols">
        <div class="card stats-block">
          <h2>Ofensiva</h2>
          <dl>
            <div><dt>Carreras anotadas (R)</dt><dd>{{ team.carreras ?? '—' }}</dd></div>
            <div><dt>Turnos al bate (AB)</dt><dd>{{ team.turnos_al_bate ?? '—' }}</dd></div>
            <div><dt>Hits (H)</dt><dd>{{ team.hits ?? '—' }}</dd></div>
            <div><dt>Jonrones (HR)</dt><dd>{{ team.jonrones ?? '—' }}</dd></div>
            <div><dt>Bases por bolas (BB)</dt><dd>{{ team.bases_por_bolas ?? '—' }}</dd></div>
            <div><dt>Ponches (SO)</dt><dd>{{ team.ponches ?? '—' }}</dd></div>
            <div><dt>Bases robadas (SB)</dt><dd>{{ team.bases_robadas ?? '—' }}</dd></div>
          </dl>
        </div>
        <div class="card stats-block">
          <h2>Pitcheo y defensa</h2>
          <dl>
            <div><dt>Carreras permitidas (RA)</dt><dd>{{ team.carreras_permitidas ?? '—' }}</dd></div>
            <div><dt>Efectividad (ERA)</dt><dd>{{ team.efectividad ?? '—' }}</dd></div>
            <div><dt>Errores (E)</dt><dd>{{ team.errores ?? '—' }}</dd></div>
            <div><dt>Porcentaje de fildeo (FP)</dt><dd>{{ team.fildeo ?? '—' }}</dd></div>
            <div><dt>Juegos jugados (G)</dt><dd>{{ team.juegos ?? '—' }}</dd></div>
          </dl>
        </div>
      </div>

      <nav class="season-nav">
        <NuxtLink v-if="prevTeam" class="btn btn-ghost" :to="`/liga/${lgSlug}/${franchSlug}/${prevTeam.slug}`">← {{ prevTeam.anio }}</NuxtLink>
        <NuxtLink :to="`/liga/${lgSlug}/${franchSlug}`" class="btn btn-primary">Todas las temporadas</NuxtLink>
        <NuxtLink v-if="nextTeam" class="btn btn-ghost" :to="`/liga/${lgSlug}/${franchSlug}/${nextTeam.slug}`">{{ nextTeam.anio }} →</NuxtLink>
      </nav>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCometEntry, useCometList, rel, winPct, divName, type Liga, type Franquicia, type Temporada } from '~/composables/useComet'

const route = useRoute()
const lgSlug = computed(() => String(route.params.lg).toLowerCase())
const franchSlug = computed(() => String(route.params.franch).toLowerCase())
const seasonSlug = computed(() => String(route.params.year).toLowerCase())

// include=liga,franquicia reemplaza los ids de las relaciones por los objetos completos
const { data: team, status } = await useCometEntry<Temporada>('temporadas', seasonSlug, { include: 'liga,franquicia' })
const liga = computed(() => rel<Liga>(team.value?.liga))
const franquicia = computed(() => rel<Franquicia>(team.value?.franquicia))

// Resto de temporadas de la misma franquicia en la liga, para navegar entre años
const { data: siblingsData } = await useCometList<Temporada>('temporadas', () => ({
  'filter[liga]': liga.value?.slug ?? '-',
  'filter[franquicia]': franquicia.value?.slug ?? '-',
  sort: 'anio'
}))

const loading = computed(() => status.value === 'pending')
const yearLabel = computed(() => team.value?.anio ?? seasonSlug.value.split('-')[0])
const lgName = computed(() => liga.value?.nombre ?? lgSlug.value.toUpperCase())
const franchName = computed(() => franquicia.value?.nombre ?? franchSlug.value.toUpperCase())
const divLabel = computed(() => team.value ? divName(team.value.division) : '')
const pct = computed(() => team.value ? winPct(team.value.victorias, team.value.derrotas) : '—')
const attendance = computed(() => {
  const a = Number(team.value?.asistencia)
  return a ? a.toLocaleString('es') : 'N/D'
})

const franchRows = computed(() => siblingsData.value.items)
const idx = computed(() => franchRows.value.findIndex(t => t.id === team.value?.id))
const prevTeam = computed(() => idx.value > 0 ? franchRows.value[idx.value - 1] : null)
const nextTeam = computed(() => idx.value >= 0 && idx.value < franchRows.value.length - 1 ? franchRows.value[idx.value + 1] : null)
</script>

<style scoped>
.page { padding: 40px 0 64px; }
.detail-head { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; }
.page-title { font-size: 32px; margin: 4px 0 6px; }
.page-sub { color: var(--mlb-gray-600); margin: 0; }
.badges { display: flex; gap: 8px; flex-wrap: wrap; }

.record-grid { margin-bottom: 28px; }
.stat-card {
  padding: 18px;
  border: 1px solid var(--mlb-gray-200);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-card span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mlb-gray-600); }
.stat-card strong { font-family: var(--font-display); font-size: 22px; color: var(--mlb-blue); }

.stats-cols { margin-bottom: 32px; }
.stats-block { padding: 22px; }
.stats-block h2 { font-size: 17px; margin-bottom: 14px; color: var(--mlb-red); }
.stats-block dl { margin: 0; }
.stats-block dl div { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--mlb-gray-100); font-size: 14px; }
.stats-block dl div:first-child { border-top: none; }
.stats-block dt { color: var(--mlb-gray-600); }
.stats-block dd { margin: 0; font-weight: 700; }

.season-nav { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.empty { padding: 60px 0; text-align: center; }
</style>
