<template>
  <q-card
    flat
    bordered
    class="theme-kpi-card animate__animated animate__fadeInUp"
    :class="isDark ? 'dark-card' : 'light-card'"
  >
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
  border-radius: 20px;
  min-height: 200px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: default;
}

.theme-kpi-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.dark-card {
  background: #1e1e1e;
  color: #f4f4f4;
  border: 1px solid #2a2a2a;
}

.light-card {
  background: #ffffff;
  color: #1e1e1e;
  border: 1px solid #e0e0e0;
}

.kpi-icon-wrapper {
  background: var(--color-primary);
  color: var(--text-light);
  border-radius: 50%;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 153, 255, 0.3);
  animation: pulse-glow 2.2s infinite ease-in-out;
}

.kpi-icon {
  font-size: 36px;
}

.kpi-value {
  font-size: 30px;
  font-weight: bold;
  color: var(--color-primary);
  text-shadow: 0 0 6px rgba(0, 153, 255, 0.3);
}

.kpi-title {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.85;
}

/* Animación del glow */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 12px rgba(0, 153, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 18px rgba(0, 153, 255, 0.6);
  }
}
</style>
