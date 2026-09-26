<template>
  <div class="container page">
    <Breadcrumbs :items="[{ label: 'Inicio', to: '/' }, { label: 'Ligas' }]" />
    <h1 class="page-title">Ligas históricas</h1>
    <p class="page-sub">Selecciona una liga para explorar sus franquicias y temporadas.</p>

    <div v-if="loading" class="grid grid-2">
      <div v-for="i in 4" :key="i" class="skeleton" style="height:120px" />
    </div>
    <div v-else class="grid grid-2">
      <NuxtLink v-for="lg in leagues" :key="lg.id" :to="`/liga/${lg.slug}`" class="card-link">
        <div class="card lg-card">
          <div class="lg-card-top">
            <span class="pill pill-blue">{{ lg.codigo }}</span>
            <span v-if="lg.seasons" class="lg-years">{{ lg.minYear }}–{{ lg.maxYear }}</span>
          </div>
          <h2>{{ lg.nombre }}</h2>
          <p v-if="lg.descripcion" class="lg-desc">{{ lg.descripcion }}</p>
          <p>{{ lg.franchises }} franquicias · {{ lg.seasons.toLocaleString('es') }} temporadas registradas</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCometList, type Liga, type Temporada } from '~/composables/useComet'

const { data: ligasData, status } = await useCometList<Liga>('ligas')
const { data: temporadasData } = await useCometList<Temporada>('temporadas')
const loading = computed(() => status.value === 'pending')

const leagues = computed(() =>
  ligasData.value.items
    .map((lg) => {
      const rows = temporadasData.value.items.filter(t => t.liga === lg.id)
      const years = rows.map(t => t.anio)
      return {
        ...lg,
        franchises: new Set(rows.map(t => t.franquicia)).size,
        seasons: rows.length,
        minYear: years.length ? Math.min(...years) : 0,
        maxYear: years.length ? Math.max(...years) : 0
      }
    })
    .sort((a, b) => b.seasons - a.seasons)
)
</script>

<style scoped>
.page { padding: 40px 0 64px; }
.page-title { font-size: 30px; margin-bottom: 6px; }
.page-sub { color: var(--mlb-gray-600); margin: 0 0 28px; }
.lg-card { padding: 22px; height: 100%; }
.lg-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.lg-years { font-size: 12px; color: var(--mlb-gray-400); font-weight: 600; }
.lg-card h2 { font-size: 22px; margin-bottom: 6px; }
.lg-card p { margin: 0; color: var(--mlb-gray-600); font-size: 14px; }
.lg-card .lg-desc { margin-bottom: 8px; }
</style>
