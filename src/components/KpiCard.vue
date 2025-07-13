<template>
  <q-card class="kpi-card text-center">
    <q-card-section>
      <div class="text-caption text-grey-7">{{ title }}</div>
      <div class="text-h5 text-primary q-mt-sm">{{ value }}</div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number]
});
</script>

<style scoped>
.kpi-card {
  width: 100%;
  max-width: 180px;
  min-height: 100px;
  border: 1px solid #e0e0e0;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.kpi-card:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
