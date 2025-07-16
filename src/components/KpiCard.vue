<template>
  <q-card flat bordered :class="['theme-kpi-card', isDark ? 'dark-card' : 'light-card']">
    <q-card-section class="column items-center justify-center q-gutter-sm">
      <div class="kpi-icon-wrapper">
        <q-icon :name="icon" class="kpi-icon" />
      </div>
      <div class="kpi-value">{{ value }}</div>
      <div class="kpi-title">{{ title }}</div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

defineProps({
  title: String,
  value: [String, Number],
  icon: String
})
</script>

<style scoped>
.theme-kpi-card {
  border-radius: 18px;
  min-height: 200px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.theme-kpi-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.dark-card {
  background: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.light-card {
  background: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.kpi-icon-wrapper {
  background: var(--color-primary);
  color: var(--text-light);
  border-radius: 50%;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kpi-icon {
  font-size: 32px;
}

.kpi-value {
  font-size: 26px;
  font-weight: bold;
  color: var(--color-primary);
  text-shadow: 0 0 4px rgba(0, 153, 255, 0.2);
}

.kpi-title {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.85;
}
</style>
