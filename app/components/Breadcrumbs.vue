<template>
  <nav class="crumbs" aria-label="Breadcrumb">
    <template v-for="(item, i) in items" :key="i">
      <NuxtLink v-if="item.to && i !== items.length - 1" :to="item.to" class="crumb-link">{{ item.label }}</NuxtLink>
      <span v-else class="crumb-current">{{ item.label }}</span>
      <span v-if="i !== items.length - 1" class="crumb-sep">/</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ items: { label: string; to?: string }[] }>()
</script>

<style scoped>
.crumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
  color: var(--mlb-gray-600);
  margin-bottom: 20px;
}
.crumb-link { color: var(--mlb-blue); font-weight: 600; }
.crumb-link:hover { text-decoration: underline; }
.crumb-current { color: var(--mlb-gray-800); font-weight: 700; }
.crumb-sep { color: var(--mlb-gray-400); }
</style>
