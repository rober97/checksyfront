<template>
  <div class="rk-page-header">
    <!-- Header Content -->
    <div class="rk-header-content">
      <div class="rk-header-left">
        <div class="rk-header-icon">
          <q-icon name="account_balance_wallet" />
          <div class="rk-icon-pulse"></div>
        </div>
        <div class="rk-header-text">
          <h1 class="rk-page-title">Gestión de Liquidaciones</h1>
          <p class="rk-page-subtitle">Administra el proceso completo de liquidación de sueldos</p>
        </div>
      </div>

      <div class="rk-header-actions">
        <!-- Mode Toggle -->
        <div class="rk-mode-toggle">
          <button
            class="rk-mode-btn"
            :class="{ active: mode === 'periods' }"
            @click="$emit('update:mode', 'periods')"
          >
            <q-icon name="calendar_month" />
            <span>Períodos</span>
          </button>
          <button
            class="rk-mode-btn"
            :class="{ active: mode === 'detail' }"
            @click="$emit('update:mode', 'detail')"
          >
            <q-icon name="people" />
            <span>Empleados</span>
          </button>
          <div class="rk-mode-indicator" :class="`rk-mode-${mode}`"></div>
        </div>

        <!-- Refresh Button -->
        <button class="rk-action-btn" @click="$emit('reload')" :disabled="loading">
          <q-icon name="refresh" :class="{ 'rotate-animation': loading }" />
          <span>Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Company Selector -->
    <div class="rk-company-selector">
      <div class="rk-selector-header">
        <div class="rk-selector-icon">
          <q-icon name="business" />
        </div>
        <div class="rk-selector-content">
          <label class="rk-selector-label">Seleccionar empresa</label>
          <q-select
            :model-value="selectedCompany"
            @update:model-value="$emit('update:selectedCompany', $event); $emit('company-change')"
            :options="companyOptions"
            option-value="_id"
            option-label="name"
            emit-value
            map-options
            outlined
            dense
            :loading="loading"
            :disable="loading"
            class="rk-company-select"
          >
            <template #prepend>
              <q-avatar size="36px" square class="rk-company-avatar">
                <img v-if="currentCompanyData?.logo" :src="currentCompanyData.logo" alt="logo" />
                <q-icon v-else name="apartment" />
              </q-avatar>
            </template>

            <template #option="scope">
              <q-item v-bind="scope.itemProps" class="rk-company-option">
                <q-item-section avatar>
                  <q-avatar size="40px" square>
                    <img v-if="scope.opt.logo" :src="scope.opt.logo" alt="logo" />
                    <q-icon v-else name="apartment" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ scope.opt.name }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.rut || 'Sin RUT' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="getStatusColor(scope.opt.status)"
                    :label="getStatusLabel(scope.opt.status)"
                    class="rk-status-badge-mini"
                  />
                </q-item-section>
              </q-item>
            </template>

            <template #no-option>
              <div class="rk-no-companies">
                <q-icon name="business_center" />
                <p>No hay empresas disponibles</p>
                <span>Crea una empresa primero</span>
              </div>
            </template>
          </q-select>
        </div>
      </div>

      <!-- Company Stats -->
      <div v-if="currentCompanyData" class="rk-company-stats">
        <div class="rk-stat-item">
          <div class="rk-stat-icon">
            <q-icon name="group" />
          </div>
          <div class="rk-stat-content">
            <span class="rk-stat-label">Empleados</span>
            <strong class="rk-stat-value">{{ currentCompanyData.employeesCount || 0 }}</strong>
          </div>
        </div>

        <div class="rk-stat-item">
          <div class="rk-stat-icon">
            <q-icon name="event" />
          </div>
          <div class="rk-stat-content">
            <span class="rk-stat-label">Períodos</span>
            <strong class="rk-stat-value">{{ periodCount }}</strong>
          </div>
        </div>

        <div class="rk-stat-item">
          <div class="rk-stat-icon">
            <q-icon name="pending_actions" />
          </div>
          <div class="rk-stat-content">
            <span class="rk-stat-label">Pendientes</span>
            <strong class="rk-stat-value">{{ pendingCount }}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  mode: { type: String, required: true },
  selectedCompany: { type: String, default: null },
  companyOptions: { type: Array, required: true },
  currentCompanyData: { type: Object, default: null },
  periodCount: { type: Number, default: 0 },
  pendingCount: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
});

defineEmits(['update:mode', 'update:selectedCompany', 'reload', 'company-change']);

function getStatusLabel(status) {
  const labels = { active: "Activa", inactive: "Inactiva", suspended: "Suspendida" };
  return labels[(status || "").toLowerCase()] || status || "—";
}

function getStatusColor(status) {
  const colors = { active: "positive", inactive: "warning", suspended: "negative" };
  return colors[(status || "").toLowerCase()] || "grey";
}
</script>

<style scoped>
.rk-page-header {
  position: relative;
  z-index: 1;
  margin-bottom: 32px;
  animation: fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rk-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding: 28px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
}

.body--dark .rk-header-content {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(6, 182, 212, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.rk-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.rk-header-icon {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
}

.rk-header-icon .q-icon {
  font-size: 32px;
  color: #fff;
  z-index: 1;
}

.rk-icon-pulse {
  position: absolute;
  inset: -6px;
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  border-radius: 20px;
  opacity: 0;
  filter: blur(10px);
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }
}

.rk-page-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: rgba(15, 23, 42, 0.95);
  letter-spacing: -0.5px;
}

.body--dark .rk-page-title {
  color: rgba(255, 255, 255, 0.95);
}

.rk-page-subtitle {
  font-size: 1rem;
  color: rgba(15, 23, 42, 0.7);
  margin: 0;
  font-weight: 500;
}

.body--dark .rk-page-subtitle {
  color: rgba(255, 255, 255, 0.7);
}

.rk-header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.rk-mode-toggle {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  flex: 0 1 380px;
  width: min(100%, 380px);
  min-width: 280px;
  background: rgba(6, 182, 212, 0.05);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 12px;
  padding: 4px;
  isolation: isolate;
}

.body--dark .rk-mode-toggle {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
}

.rk-mode-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  min-height: 44px;
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: rgba(15, 23, 42, 0.7);
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.25s ease, transform 0.25s ease, opacity 0.25s ease;
  z-index: 2;
  opacity: 0.72;
}

.body--dark .rk-mode-btn {
  color: rgba(255, 255, 255, 0.7);
}

.rk-mode-btn .q-icon {
  font-size: 18px;
}

.rk-mode-btn.active {
  color: rgba(15, 23, 42, 0.95);
  opacity: 1;
  transform: translateY(-1px);
}

.body--dark .rk-mode-btn.active {
  color: rgba(255, 255, 255, 0.95);
}

.rk-mode-btn.active .q-icon,
.rk-mode-btn.active span {
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.18);
}

.body--dark .rk-mode-btn.active .q-icon,
.body--dark .rk-mode-btn.active span {
  text-shadow: none;
}

.rk-mode-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 249, 255, 0.98));
  border-radius: 10px;
  border: 1px solid rgba(6, 182, 212, 0.18);
  box-shadow:
    0 10px 24px rgba(6, 182, 212, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  pointer-events: none;
}

.body--dark .rk-mode-indicator {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
  border-color: rgba(34, 211, 238, 0.22);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.rk-mode-periods {
  transform: translateX(0);
}

.rk-mode-detail {
  transform: translateX(calc(100% + 4px));
}

.rk-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  min-width: 144px;
  background: rgba(6, 182, 212, 0.05);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 12px;
  color: rgba(15, 23, 42, 0.95);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.body--dark .rk-action-btn {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.rk-action-btn:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
}

.rk-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rk-action-btn .q-icon {
  font-size: 18px;
}

.rotate-animation {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rk-company-selector {
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
}

.body--dark .rk-company-selector {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(6, 182, 212, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.rk-selector-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.rk-selector-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
  flex-shrink: 0;
}

.rk-selector-icon .q-icon {
  font-size: 24px;
  color: #fff;
}

.rk-selector-content {
  flex: 1;
}

.rk-selector-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.7);
  margin-bottom: 10px;
}

.body--dark .rk-selector-label {
  color: rgba(255, 255, 255, 0.7);
}

.rk-company-select :deep(.q-field__control) {
  background: rgba(6, 182, 212, 0.04);
  border-color: rgba(6, 182, 212, 0.15);
  min-height: 52px;
  border-radius: 12px;
}

.body--dark .rk-company-select :deep(.q-field__control) {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
}

.rk-company-select :deep(.q-field__control):hover {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.25);
}

.rk-company-avatar {
  background: rgba(6, 182, 212, 0.1);
}

.rk-company-option {
  padding: 12px 16px;
}

.rk-status-badge-mini {
  font-size: 0.7rem;
  padding: 4px 10px;
}

.rk-no-companies {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.rk-no-companies .q-icon {
  font-size: 48px;
  color: rgba(15, 23, 42, 0.5);
  margin-bottom: 16px;
}

.body--dark .rk-no-companies .q-icon {
  color: rgba(255, 255, 255, 0.5);
}

.rk-no-companies p {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.7);
  margin: 0 0 8px 0;
}

.body--dark .rk-no-companies p {
  color: rgba(255, 255, 255, 0.7);
}

.rk-no-companies span {
  font-size: 0.9rem;
  color: rgba(15, 23, 42, 0.5);
}

.body--dark .rk-no-companies span {
  color: rgba(255, 255, 255, 0.5);
}

.rk-company-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.rk-stat-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: rgba(6, 182, 212, 0.04);
  border: 1px solid rgba(6, 182, 212, 0.12);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.body--dark .rk-stat-item {
  background: rgba(6, 182, 212, 0.06);
  border-color: rgba(6, 182, 212, 0.15);
}

.rk-stat-item:hover {
  background: rgba(6, 182, 212, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
}

.rk-stat-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.1);
  border-radius: 10px;
  flex-shrink: 0;
}

.body--dark .rk-stat-icon {
  background: rgba(6, 182, 212, 0.15);
}

.rk-stat-icon .q-icon {
  font-size: 22px;
  color: #22d3ee;
}

.rk-stat-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.5);
  margin-bottom: 4px;
}

.body--dark .rk-stat-label {
  color: rgba(255, 255, 255, 0.5);
}

.rk-stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.95);
}

.body--dark .rk-stat-value {
  color: rgba(255, 255, 255, 0.95);
}

/* Responsive */
@media (max-width: 1023px) {
  .rk-header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .rk-header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .rk-company-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .rk-header-content,
  .rk-company-selector {
    padding: 20px;
    border-radius: 16px;
  }

  .rk-header-icon {
    width: 52px;
    height: 52px;
  }

  .rk-header-icon .q-icon {
    font-size: 26px;
  }

  .rk-page-title {
    font-size: 1.4rem;
  }

  .rk-page-subtitle {
    font-size: 0.9rem;
  }

  .rk-mode-toggle {
    width: 100%;
    min-width: 0;
  }

  .rk-action-btn {
    width: 100%;
    justify-content: center;
  }

  .rk-mode-btn {
    padding: 10px 12px;
    font-size: 0.88rem;
  }

  .rk-mode-btn span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
