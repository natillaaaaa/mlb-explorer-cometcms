<template>
  <div v-if="totalPages > 1" class="pagination">
    <button class="btn btn-ghost" :disabled="page <= 1" @click="$emit('update:page', page - 1)">← Anterior</button>
    <div class="pages">
      <button
        v-for="p in visiblePages"
        :key="p"
        class="page-btn"
        :class="{ active: p === page }"
        :disabled="p === '…'"
        @click="typeof p === 'number' && $emit('update:page', p)"
      >{{ p }}</button>
    </div>
    <button class="btn btn-ghost" :disabled="page >= totalPages" @click="$emit('update:page', page + 1)">Siguiente →</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ page: number; totalPages: number }>()
defineEmits<{ 'update:page': [number] }>()

const visiblePages = computed<(number | string)[]>(() => {
  const total = props.totalPages
  const cur = props.page
  const pages: (number | string)[] = []
  const window = 1
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= cur - window && p <= cur + window)) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }
  return pages
})
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 32px 0;
  flex-wrap: wrap;
}
.pages { display: flex; gap: 4px; }
.page-btn {
  min-width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--mlb-gray-200);
  background: #fff;
  font-weight: 600;
  font-size: 14px;
  color: var(--mlb-gray-600);
  cursor: pointer;
}
.page-btn:hover:not(:disabled) { border-color: var(--mlb-blue); color: var(--mlb-blue); }
.page-btn.active { background: var(--mlb-blue); color: #fff; border-color: var(--mlb-blue); }
.page-btn:disabled { cursor: default; opacity: 0.5; }
</style>
