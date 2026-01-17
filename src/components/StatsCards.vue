<template>
  <div class="stats-section">
    <div class="stat-card stat-card--gradient-1">
      <div class="stat-icon-wrapper">
        <q-icon name="receipt_long" />
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ totalRecords }}</div>
        <div class="stat-label">Marcas registradas</div>
      </div>
      <div class="stat-decoration"></div>
    </div>

    <div class="stat-card stat-card--gradient-2">
      <div class="stat-icon-wrapper">
        <q-icon name="calendar_today" />
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ totalDays }}</div>
        <div class="stat-label">Días trabajados</div>
      </div>
      <div class="stat-decoration"></div>
    </div>

    <div class="stat-card stat-card--gradient-3">
      <div class="stat-icon-wrapper">
        <q-icon name="access_time" />
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ totalHours }}</div>
        <div class="stat-label">Horas totales</div>
      </div>
      <div class="stat-decoration"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalRecords: { type: Number, default: 0 },
  totalDays: { type: Number, default: 0 },
  totalHours: { type: String, default: '0h 0m' }
});
</script>

<style scoped>
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
}

.stat-card--gradient-1 {
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.12) 0%, 
    rgba(139, 92, 246, 0.08) 100%);
}

.stat-card--gradient-2 {
  background: linear-gradient(135deg, 
    rgba(236, 72, 153, 0.12) 0%, 
    rgba(245, 158, 11, 0.08) 100%);
}

.stat-card--gradient-3 {
  background: linear-gradient(135deg, 
    rgba(6, 182, 212, 0.12) 0%, 
    rgba(16, 185, 129, 0.08) 100%);
}

body.body--dark .stat-card {
  background: linear-gradient(135deg, 
    rgba(30, 41, 59, 0.6) 0%, 
    rgba(15, 23, 42, 0.4) 100%);
  border-color: rgba(255, 255, 255, 0.08);
}

.stat-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: rgba(255, 255, 255, 0.9);
  color: #6366f1;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.stat-card--gradient-1 .stat-icon-wrapper {
  color: #6366f1;
}

.stat-card--gradient-2 .stat-icon-wrapper {
  color: #ec4899;
}

.stat-card--gradient-3 .stat-icon-wrapper {
  color: #06b6d4;
}

body.body--dark .stat-icon-wrapper {
  background: rgba(255, 255, 255, 0.08);
  color: #a5b4fc;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 6px;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

body.body--dark .stat-value {
  background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

body.body--dark .stat-label {
  color: #94a3b8;
}

.stat-decoration {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>