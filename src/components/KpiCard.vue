<template>
  <div class="rk-kpi-aura" :style="auraStyle">
    <q-card
      flat
      bordered
      class="rk-kpi rk-glass"
      :class="[{ 'is-dark': isDark, disabled }, dense ? 'rk-kpi--dense' : 'rk-kpi--normal']"
      :style="{
        '--kpi-accent': `var(--q-${color})`,
        '--kpi-accent-weak': `color-mix(in oklab, var(--q-${color}) 12%, transparent)`,
        '--kpi-accent-ultra-weak': `color-mix(in oklab, var(--q-${color}) 5%, transparent)`,
        '--kpi-accent-glow': `color-mix(in oklab, var(--q-${color}) 25%, transparent)`
      }"
      v-ripple
    >
      <q-card-section class="rk-kpi__content">
        <!-- Icono con aura -->
        <div class="rk-kpi__icon-aura">
          <div class="rk-kpi__icon-container">
            <div class="rk-kpi__icon">
              <q-icon :name="icon" size="22px" />
            </div>
          </div>
        </div>

        <!-- Contenido de texto -->
        <div class="rk-kpi__text-content">
          <div class="rk-kpi__title-wrapper">
            <div class="rk-kpi__title">{{ title }}</div>
            <div class="rk-kpi__value-main">
              <span v-if="loading" class="rk-kpi__skeleton" />
              <span v-else class="rk-kpi__value">{{ formattedValue }}</span>
            </div>
          </div>
          
          <div class="rk-kpi__subtitle-wrapper" v-if="subtitle || trend != null">
            <div class="rk-kpi__subtitle">{{ subtitle }}</div>
            <div class="rk-kpi__trend-container" v-if="!loading && trend != null">
              <q-badge class="rk-kpi__trend" :class="trendColor">
                <q-icon :name="trendIcon" size="10px" class="q-mr-xs" />
                {{ Math.abs(trend) }}%
              </q-badge>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Indicador de progreso con glow -->
      <div 
        v-if="progress != null"
        class="rk-kpi__progress-wrapper"
      >
        <div 
          class="rk-kpi__progress-indicator"
          :style="{ width: `${clampedProgress * 100}%` }"
        />
        <div class="rk-kpi__progress-glow" :style="{ width: `${clampedProgress * 100}%` }" />
      </div>

      <!-- Efectos de aura internos -->
      <div class="rk-kpi__inner-glow" />
      <div class="rk-kpi__particle-field" />
      <div class="rk-kpi__light-streaks" />
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Dark } from 'quasar'
import { useThemeStore } from '@/stores/themeStore'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: 0 },
  icon:  { type: String, default: 'insights' },
  subtitle: { type: String, default: '' },
  color: { type: String, default: 'primary' },
  trend: { type: Number, default: null },
  progress: { type: Number, default: null },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  dense: { type: Boolean, default: false },
  glowIntensity: { type: Number, default: 1 } // 0.5 a 2
})

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark ?? Dark.isActive)

const clampedProgress = computed(() => {
  if (props.progress == null) return null
  return Math.max(0, Math.min(1, Number(props.progress)))
})

const trendIcon = computed(() => (props.trend ?? 0) >= 0 ? 'north_east' : 'south_west')
const trendColor = computed(() => (props.trend ?? 0) >= 0 ? 'trend-positive' : 'trend-negative')

// Formatear valor para mejor legibilidad
const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return new Intl.NumberFormat().format(props.value)
  }
  return props.value
})

// Estilo del aura exterior
const auraStyle = computed(() => {
  const intensity = props.glowIntensity || 1
  return {
    '--glow-intensity': intensity,
    '--glow-color': `var(--q-${props.color})`
  }
})
</script>

<style scoped>
/* ===== SISTEMA DE AURA EXTERIOR ===== */
.rk-kpi-aura {
  position: relative;
  border-radius: 24px;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.rk-kpi-aura::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 26px;
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--glow-color) calc(15% * var(--glow-intensity)), transparent) 0%,
    color-mix(in oklab, var(--glow-color) calc(8% * var(--glow-intensity)), transparent) 50%,
    color-mix(in oklab, var(--glow-color) calc(15% * var(--glow-intensity)), transparent) 100%
  );
  opacity: 0;
  transition: all 0.6s ease;
  z-index: -1;
  filter: blur(12px);
}

.rk-kpi-aura::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 28px;
  background: conic-gradient(
    from 0deg at 50% 50%,
    color-mix(in oklab, var(--glow-color) calc(25% * var(--glow-intensity)), transparent) 0deg,
    color-mix(in oklab, var(--glow-color) calc(40% * var(--glow-intensity)), transparent) 90deg,
    color-mix(in oklab, var(--glow-color) calc(25% * var(--glow-intensity)), transparent) 180deg,
    color-mix(in oklab, var(--glow-color) calc(40% * var(--glow-intensity)), transparent) 270deg,
    color-mix(in oklab, var(--glow-color) calc(25% * var(--glow-intensity)), transparent) 360deg
  );
  opacity: 0;
  transition: all 0.8s ease;
  z-index: -2;
  filter: blur(20px);
  animation: aura-rotate 8s linear infinite;
}

@keyframes aura-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.rk-kpi-aura:hover::before {
  opacity: 0.8;
  inset: -4px;
  filter: blur(16px);
}

.rk-kpi-aura:hover::after {
  opacity: 0.6;
  inset: -8px;
  filter: blur(24px);
}

/* ===== KPI BASE MEJORADO ===== */
.rk-kpi {
  --rk-border: rgba(0, 0, 0, 0.08);
  --rk-bg: #ffffff;
  --rk-fg: #0f172a;
  --rk-muted: #64748b;
  --rk-surface: #f8fafc;
  
  position: relative;
  border-radius: 20px;
  border: 1px solid var(--rk-border);
  background: var(--rk-bg);
  color: var(--rk-fg);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: hidden;
  min-height: 110px;
  z-index: 1;
}

.rk-kpi:hover {
  transform: translateY(-6px) scale(1.02);
  border-color: color-mix(in oklab, var(--kpi-accent) 30%, transparent);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px color-mix(in oklab, var(--kpi-accent) 15%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.rk-kpi.is-dark {
  --rk-border: rgba(255, 255, 255, 0.12);
  --rk-bg: #0a0f1a;
  --rk-fg: #f1f5f9;
  --rk-muted: #94a3b8;
  --rk-surface: #1a2435;
}

.rk-kpi.is-dark:hover {
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px color-mix(in oklab, var(--kpi-accent) 20%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.rk-glass {
  backdrop-filter: saturate(2) blur(25px);
  background: color-mix(in oklab, var(--rk-bg) 92%, transparent);
}

/* ===== ESTRUCTURA DE CONTENIDO ===== */
.rk-kpi__content {
  padding: 22px 26px !important;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  position: relative;
  z-index: 3;
}

.rk-kpi--dense .rk-kpi__content {
  padding: 18px 22px !important;
  gap: 16px;
}

.rk-kpi__text-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ===== ICONO CON AURA ===== */
.rk-kpi__icon-aura {
  position: relative;
  flex-shrink: 0;
}

.rk-kpi__icon-aura::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 20px;
  background: radial-gradient(
    circle at center,
    var(--kpi-accent-glow) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: all 0.5s ease;
  filter: blur(12px);
}

.rk-kpi:hover .rk-kpi__icon-aura::before {
  opacity: 0.6;
}

.rk-kpi__icon-container {
  --size: 56px;
  width: var(--size);
  height: var(--size);
  min-width: var(--size);
  border-radius: 18px;
  position: relative;
  display: grid;
  place-items: center;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

.rk-kpi:hover .rk-kpi__icon-container {
  transform: scale(1.15) rotate(12deg);
}

.rk-kpi__icon {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kpi-accent);
  background: linear-gradient(
    135deg,
    var(--kpi-accent-ultra-weak) 0%,
    color-mix(in oklab, var(--kpi-accent-ultra-weak) 30%, transparent) 100%
  );
  box-shadow: 
    inset 0 2px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1),
    0 8px 32px var(--kpi-accent-weak),
    0 0 20px var(--kpi-accent-glow);
  transition: all 0.5s ease;
  position: relative;
  z-index: 2;
}

.rk-kpi:hover .rk-kpi__icon {
  box-shadow: 
    inset 0 2px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15),
    0 12px 40px var(--kpi-accent-weak),
    0 0 30px var(--kpi-accent-glow);
}

/* ===== SISTEMA DE TEXTO ===== */
.rk-kpi__title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  min-height: 34px;
}

.rk-kpi__title {
  font-weight: 650;
  font-size: 16px;
  line-height: 1.3;
  color: var(--rk-fg);
  letter-spacing: -0.01em;
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.rk-kpi__value-main {
  flex-shrink: 0;
  text-align: right;
}

.rk-kpi__value {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-size: 26px;
  line-height: 1;
  color: var(--rk-fg);
  letter-spacing: -0.02em;
  transition: all 0.4s ease;
  display: block;
  text-shadow: 
    0 0 30px color-mix(in oklab, var(--kpi-accent) 30%, transparent),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.rk-kpi:hover .rk-kpi__value {
  color: var(--kpi-accent);
  transform: scale(1.1);
  text-shadow: 
    0 0 40px color-mix(in oklab, var(--kpi-accent) 50%, transparent),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

/* ===== TREND CON GLOW ===== */
.rk-kpi__trend {
  font-weight: 700;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 11px;
  letter-spacing: 0.04em;
  backdrop-filter: blur(20px) saturate(2);
  border: none;
  transition: all 0.4s ease;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 0 12px color-mix(in oklab, currentColor 30%, transparent);
  font-variant-numeric: tabular-nums;
  position: relative;
  overflow: hidden;
}

.rk-kpi__trend::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.2) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  opacity: 0.6;
}

.rk-kpi__trend.trend-positive {
  background: linear-gradient(135deg, #10b981, #059669, #047857);
  color: white;
}

.rk-kpi__trend.trend-negative {
  background: linear-gradient(135deg, #ef4444, #dc2626, #b91c1c);
  color: white;
}

.rk-kpi:hover .rk-kpi__trend {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.3),
    0 0 20px color-mix(in oklab, currentColor 40%, transparent);
}

/* ===== PROGRESS CON AURA ===== */
.rk-kpi__progress-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: color-mix(in oklab, var(--rk-muted) 10%, transparent);
  z-index: 2;
  overflow: hidden;
}

.rk-kpi__progress-indicator {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--kpi-accent),
    color-mix(in oklab, var(--kpi-accent) 70%, white)
  );
  border-radius: 0 4px 4px 0;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 2;
}

.rk-kpi__progress-glow {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--kpi-accent);
  border-radius: 0 4px 4px 0;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: blur(8px);
  opacity: 0.6;
  z-index: 1;
}

/* ===== EFECTOS DE AURA INTERNOS ===== */
.rk-kpi__inner-glow {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: radial-gradient(
    ellipse at center,
    color-mix(in oklab, var(--kpi-accent) 8%, transparent) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  z-index: 1;
}

.rk-kpi:hover .rk-kpi__inner-glow {
  opacity: 0.4;
}

.rk-kpi__particle-field {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background-image: 
    radial-gradient(circle at 20% 30%, var(--kpi-accent-glow) 1px, transparent 1px),
    radial-gradient(circle at 80% 70%, var(--kpi-accent-glow) 1px, transparent 1px),
    radial-gradient(circle at 40% 80%, var(--kpi-accent-glow) 1px, transparent 1px);
  background-size: 200px 200px, 150px 150px, 180px 180px;
  opacity: 0;
  transition: opacity 0.8s ease;
  pointer-events: none;
  z-index: 0;
  animation: particle-float 20s infinite linear;
}

@keyframes particle-float {
  0% { background-position: 0 0, 0 0, 0 0; }
  100% { background-position: 200px 200px, 150px 150px, 180px 180px; }
}

.rk-kpi:hover .rk-kpi__particle-field {
  opacity: 0.1;
}

.rk-kpi__light-streaks {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transform: skewX(-15deg);
  opacity: 0;
  transition: all 0.8s ease;
  pointer-events: none;
  z-index: 1;
}

.rk-kpi:hover .rk-kpi__light-streaks {
  left: 100%;
  opacity: 0.3;
  transition-duration: 1.2s;
}

/* ===== SKELETON CON GLOW ===== */
.rk-kpi__skeleton {
  display: inline-block;
  width: 80px;
  height: 32px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--rk-muted) 8%, transparent) 25%,
    color-mix(in oklab, var(--rk-muted) 15%, transparent) 50%,
    color-mix(in oklab, var(--rk-muted) 8%, transparent) 75%
  );
  background-size: 200% 100%;
  animation: rk-shimmer 2.5s infinite ease-in-out;
  box-shadow: 0 0 20px color-mix(in oklab, var(--rk-muted) 20%, transparent);
}

@keyframes rk-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .rk-kpi__content {
    padding: 20px 22px !important;
  }
  
  .rk-kpi__icon-container {
    --size: 52px;
  }
  
  .rk-kpi__value {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .rk-kpi-aura:hover::before,
  .rk-kpi-aura:hover::after {
    opacity: 0.3;
  }
  
  .rk-kpi__content {
    padding: 18px 20px !important;
    flex-direction: column;
    gap: 16px;
  }
  
  .rk-kpi__title-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .rk-kpi__value-main {
    text-align: left;
    width: 100%;
  }
}

/* Garantía de texto visible */
.rk-kpi__title,
.rk-kpi__subtitle {
  overflow: visible !important;
  text-overflow: unset !important;
  white-space: normal !important;
  line-height: 1.4 !important;
}
</style>