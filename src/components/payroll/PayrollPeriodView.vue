<template>
  <div class="rk-period-view">
    <div class="rk-content-card">
      <!-- Controls Section -->
      <div class="rk-controls-section">
        <div class="rk-control-group">
          <label class="rk-control-label">
            <q-icon name="event" />
            <span>Seleccionar período</span>
          </label>
          <q-input
            :model-value="periodInput"
            @update:model-value="$emit('update:periodInput', $event)"
            dense
            outlined
            placeholder="YYYY-MM"
            mask="####-##"
            class="rk-period-input"
          >
            <template #prepend>
              <q-icon name="calendar_today" />
            </template>
            <template #append>
              <q-btn flat dense round icon="more_time" size="sm">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    :model-value="periodInput"
                    @update:model-value="$emit('update:periodInput', $event)"
                    mask="YYYY-MM"
                    minimal
                    color="primary"
                  >
                    <div class="row items-center justify-end q-pa-sm">
                      <q-btn v-close-popup label="Seleccionar" color="primary" unelevated no-caps size="sm" />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-btn>
            </template>
          </q-input>
        </div>

        <div class="rk-info-banner">
          <div class="rk-info-icon">
            <q-icon name="lightbulb" />
          </div>
          <div class="rk-info-content">
            <strong>Tip:</strong> Genera borradores al finalizar el mes. La emisión debe ser revisada y confirmada manualmente.
          </div>
        </div>

        <button
          class="rk-generate-btn"
          :disabled="!isValidPeriod || loading"
          @click="$emit('generate')"
        >
          <q-icon name="bolt" />
          <span>Generar borradores</span>
          <div class="rk-btn-shine"></div>
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="rk-stats-grid">
        <div class="rk-stat-card">
          <div class="rk-stat-card-icon rk-icon-blue">
            <q-icon name="folder" />
          </div>
          <div class="rk-stat-card-content">
            <span class="rk-stat-card-label">Total períodos</span>
            <strong class="rk-stat-card-value">{{ periodRows.length }}</strong>
          </div>
        </div>

        <div class="rk-stat-card">
          <div class="rk-stat-card-icon rk-icon-orange">
            <q-icon name="edit_note" />
          </div>
          <div class="rk-stat-card-content">
            <span class="rk-stat-card-label">En borrador</span>
            <strong class="rk-stat-card-value">{{ countStatus('DRAFT') }}</strong>
          </div>
        </div>

        <div class="rk-stat-card">
          <div class="rk-stat-card-icon rk-icon-green">
            <q-icon name="check_circle" />
          </div>
          <div class="rk-stat-card-content">
            <span class="rk-stat-card-label">Publicados</span>
            <strong class="rk-stat-card-value">{{ countStatus('PUBLISHED') }}</strong>
          </div>
        </div>

        <div class="rk-stat-card">
          <div class="rk-stat-card-icon rk-icon-grey">
            <q-icon name="lock" />
          </div>
          <div class="rk-stat-card-content">
            <span class="rk-stat-card-label">Cerrados</span>
            <strong class="rk-stat-card-value">{{ countStatus('CLOSED') }}</strong>
          </div>
        </div>
      </div>

      <!-- Periods Table -->
      <div class="rk-table-container">
        <q-table
          flat
          :rows="periodRows"
          :columns="columns"
          row-key="period"
          :loading="loading"
          :rows-per-page-options="[10, 25, 50]"
          :pagination="{ rowsPerPage: 10 }"
          class="rk-table"
          no-data-label="No hay períodos generados"
          loading-label="Cargando períodos..."
        >
          <template #body-cell-period="props">
            <q-td :props="props">
              <div class="rk-period-cell">
                <q-icon name="calendar_today" />
                <span>{{ formatPeriod(props.row.period) }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <div class="rk-status-badge" :class="`rk-status-${props.row.status.toLowerCase()}`">
                <q-icon :name="getStatusIcon(props.row.status)" />
                <span>{{ getStatusLabel(props.row.status) }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-counts="props">
            <q-td :props="props">
              <div class="rk-counts-cell">
                <div class="rk-count-chip rk-chip-total">
                  <q-icon name="description" />
                  <span>{{ props.row.total || 0 }}</span>
                </div>
                <div v-if="(props.row.draft || 0) > 0" class="rk-count-chip rk-chip-draft">
                  <q-icon name="edit_note" />
                  <span>{{ props.row.draft }}</span>
                </div>
                <div v-if="(props.row.issued || 0) > 0" class="rk-count-chip rk-chip-issued">
                  <q-icon name="check_circle" />
                  <span>{{ props.row.issued }}</span>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <button class="rk-table-action-btn" @click="$emit('open-period', props.row.period)">
                <q-icon name="open_in_new" />
                <span>Ver liquidaciones</span>
              </button>
            </q-td>
          </template>

          <template #loading>
            <q-inner-loading showing>
              <div class="rk-loading-state">
                <q-spinner-gears size="50px" color="primary" />
                <p>Cargando períodos...</p>
              </div>
            </q-inner-loading>
          </template>

          <template #no-data>
            <div class="rk-empty-state">
              <div class="rk-empty-icon">
                <q-icon name="event_busy" />
              </div>
              <h3 class="rk-empty-title">No hay períodos generados</h3>
              <p class="rk-empty-text">Genera tu primer período usando el botón superior</p>
            </div>
          </template>
        </q-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  periodInput: { type: String, required: true },
  periodRows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
});

defineEmits(['update:periodInput', 'generate', 'open-period']);

const columns = [
  { name: "period", label: "Período", field: "period", sortable: true, align: "left" },
  { name: "status", label: "Estado", field: "status", sortable: true, align: "center" },
  { name: "counts", label: "Resumen", field: "counts", align: "left" },
  { name: "actions", label: "Acciones", field: "actions", align: "right" },
];

const isValidPeriod = computed(() => {
  return /^\d{4}-\d{2}$/.test(props.periodInput);
});

function countStatus(status) {
  return props.periodRows.filter(p => p.status === status).length;
}

function formatPeriod(period) {
  if (!period || !period.match(/^\d{4}-\d{2}$/)) return period;
  const [year, month] = period.split("-");
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function getStatusIcon(status) {
  const icons = { CLOSED: "lock", PUBLISHED: "check_circle", DRAFT: "edit_note" };
  return icons[status] || "help";
}

function getStatusLabel(status) {
  const labels = { CLOSED: "Cerrado", PUBLISHED: "Publicado", DRAFT: "Borrador" };
  return labels[status] || status || "—";
}
</script>

<style scoped>
.rk-period-view {
  position: relative;
  z-index: 1;
}

.rk-content-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
}

.body--dark .rk-content-card {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(6, 182, 212, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.rk-controls-section {
  display: grid;
  grid-template-columns: 300px 1fr 200px;
  gap: 20px;
  margin-bottom: 32px;
  align-items: flex-end;
}

.rk-control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rk-control-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.7);
}

.body--dark .rk-control-label {
  color: rgba(255, 255, 255, 0.7);
}

.rk-control-label .q-icon {
  font-size: 16px;
  color: #22d3ee;
}

.rk-period-input :deep(.q-field__control) {
  background: rgba(6, 182, 212, 0.04);
  border-color: rgba(6, 182, 212, 0.15);
  border-radius: 10px;
}

.body--dark .rk-period-input :deep(.q-field__control) {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
}

.rk-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-left: 4px solid #3b82f6;
  border-radius: 10px;
}

.body--dark .rk-info-banner {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.3);
}

.rk-info-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 7px;
  flex-shrink: 0;
}

.rk-info-icon .q-icon {
  font-size: 16px;
  color: #3b82f6;
}

.rk-info-content {
  font-size: 0.88rem;
  color: #1e40af;
  line-height: 1.5;
}

.body--dark .rk-info-content {
  color: #93c5fd;
}

.rk-generate-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

.rk-generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
}

.rk-generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.rk-generate-btn .q-icon {
  font-size: 20px;
}

.rk-btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.rk-generate-btn:hover .rk-btn-shine {
  left: 100%;
}

.rk-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.rk-stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(6, 182, 212, 0.04);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 14px;
  transition: all 0.3s ease;
}

.body--dark .rk-stat-card {
  background: rgba(6, 182, 212, 0.06);
  border-color: rgba(6, 182, 212, 0.15);
}

.rk-stat-card:hover {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
}

.rk-stat-card-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.rk-icon-blue {
  background: rgba(59, 130, 246, 0.12);
}

.rk-icon-blue .q-icon {
  font-size: 26px;
  color: #3b82f6;
}

.rk-icon-orange {
  background: rgba(245, 158, 11, 0.12);
}

.rk-icon-orange .q-icon {
  font-size: 26px;
  color: #f59e0b;
}

.rk-icon-green {
  background: rgba(34, 197, 94, 0.12);
}

.rk-icon-green .q-icon {
  font-size: 26px;
  color: #22c55e;
}

.rk-icon-grey {
  background: rgba(107, 114, 128, 0.12);
}

.rk-icon-grey .q-icon {
  font-size: 26px;
  color: #6b7280;
}

.rk-stat-card-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.5);
  margin-bottom: 6px;
}

.body--dark .rk-stat-card-label {
  color: rgba(255, 255, 255, 0.5);
}

.rk-stat-card-value {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.95);
  line-height: 1;
}

.body--dark .rk-stat-card-value {
  color: rgba(255, 255, 255, 0.95);
}

.rk-table-container {
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid rgba(6, 182, 212, 0.12);
}

.body--dark .rk-table-container {
  border-color: rgba(6, 182, 212, 0.2);
}

.rk-table {
  background: rgba(255, 255, 255, 0.95);
}

.body--dark .rk-table {
  background: rgba(17, 24, 39, 0.95);
}

.rk-table :deep(thead tr) {
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
}

.rk-table :deep(thead th) {
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px;
}

.rk-table :deep(tbody tr) {
  transition: background 0.2s ease;
}

.rk-table :deep(tbody tr:hover) {
  background: rgba(6, 182, 212, 0.05);
}

.rk-table :deep(tbody td) {
  padding: 16px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.08);
}

.body--dark .rk-table :deep(tbody td) {
  border-bottom-color: rgba(6, 182, 212, 0.12);
}

.rk-period-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rk-period-cell .q-icon {
  font-size: 18px;
  color: #22d3ee;
}

.rk-period-cell span {
  font-weight: 700;
  color: rgba(15, 23, 42, 0.95);
}

.body--dark .rk-period-cell span {
  color: rgba(255, 255, 255, 0.95);
}

.rk-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.rk-status-badge .q-icon {
  font-size: 14px;
}

.rk-status-draft {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.rk-status-published {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.rk-status-closed {
  background: rgba(107, 114, 128, 0.12);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.rk-counts-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rk-count-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 700;
}

.rk-count-chip .q-icon {
  font-size: 14px;
}

.rk-chip-total {
  background: rgba(6, 182, 212, 0.1);
  color: rgba(15, 23, 42, 0.95);
}

.body--dark .rk-chip-total {
  color: rgba(255, 255, 255, 0.95);
}

.rk-chip-draft {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.rk-chip-issued {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.rk-table-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.15);
  border-radius: 8px;
  color: rgba(15, 23, 42, 0.95);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.body--dark .rk-table-action-btn {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.rk-table-action-btn:hover {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.25);
  color: #22d3ee;
}

.rk-table-action-btn .q-icon {
  font-size: 16px;
}

.rk-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
}

.rk-loading-state p {
  margin-top: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.7);
}

.body--dark .rk-loading-state p {
  color: rgba(255, 255, 255, 0.7);
}

.rk-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  text-align: center;
}

.rk-empty-icon {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.08);
  border-radius: 20px;
  margin-bottom: 24px;
}

.rk-empty-icon .q-icon {
  font-size: 48px;
  color: rgba(15, 23, 42, 0.5);
}

.body--dark .rk-empty-icon .q-icon {
  color: rgba(255, 255, 255, 0.5);
}

.rk-empty-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.7);
  margin: 0 0 12px 0;
}

.body--dark .rk-empty-title {
  color: rgba(255, 255, 255, 0.7);
}

.rk-empty-text {
  font-size: 1rem;
  color: rgba(15, 23, 42, 0.5);
  margin: 0;
}

.body--dark .rk-empty-text {
  color: rgba(255, 255, 255, 0.5);
}

/* Responsive */
@media (max-width: 1400px) {
  .rk-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1023px) {
  .rk-controls-section {
    grid-template-columns: 1fr;
  }

  .rk-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .rk-content-card {
    padding: 20px;
    border-radius: 16px;
  }

  .rk-stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .rk-stat-card {
    padding: 16px;
  }

  .rk-stat-card-icon {
    width: 44px;
    height: 44px;
  }

  .rk-stat-card-icon .q-icon {
    font-size: 22px;
  }

  .rk-stat-card-value {
    font-size: 1.6rem;
  }
}
</style>