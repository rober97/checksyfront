<template>
  <div class="rk-period-view">
    <div class="rk-content-card">
      <!-- Controls: period picker + generate -->
      <div class="rk-controls-row">
        <div class="rk-control-group">
          <label class="rk-label">Período</label>
          <q-input
            :model-value="periodInput"
            @update:model-value="updatePeriod"
            dense
            outlined
            type="month"
            class="rk-input"
          >
            <template #prepend>
              <q-icon name="calendar_today" size="18px" />
            </template>
          </q-input>
        </div>

        <q-btn
          unelevated
          color="primary"
          icon="bolt"
          label="Generar borradores"
          :disable="!isValidPeriod || loading"
          :loading="loading"
          class="rk-generate-btn"
          @click="$emit('generate')"
        />
      </div>

      <!-- Quick stats -->
      <div class="rk-stats-row">
        <div class="rk-stat" v-for="s in stats" :key="s.label">
          <q-icon :name="s.icon" :color="s.color" size="20px" />
          <span class="rk-stat-val">{{ s.value }}</span>
          <span class="rk-stat-lbl">{{ s.label }}</span>
        </div>
      </div>

      <!-- Periods Table -->
      <div class="rk-table-wrap">
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
          loading-label="Cargando..."
        >
          <template #body-cell-period="props">
            <q-td :props="props">
              <div class="rk-cell-period">
                <q-icon name="calendar_today" size="16px" color="primary" />
                <strong>{{ formatPeriod(props.row.period) }}</strong>
              </div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="statusColor(props.row.status)"
                :label="statusLabel(props.row.status)"
                outline
                class="rk-status-badge"
              />
            </q-td>
          </template>

          <template #body-cell-counts="props">
            <q-td :props="props">
              <div class="rk-counts">
                <span class="rk-count">
                  <q-icon name="description" size="14px" />
                  {{ props.row.total || 0 }} total
                </span>
                <span v-if="(props.row.draft || 0) > 0" class="rk-count rk-count-draft">
                  {{ props.row.draft }} borrador{{ props.row.draft !== 1 ? 'es' : '' }}
                </span>
                <span v-if="(props.row.issued || 0) > 0" class="rk-count rk-count-issued">
                  {{ props.row.issued }} emitida{{ props.row.issued !== 1 ? 's' : '' }}
                </span>
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat dense
                color="primary"
                icon="open_in_new"
                label="Ver empleados"
                @click="$emit('open-period', props.row.period)"
              />
            </q-td>
          </template>

          <template #no-data>
            <div class="rk-empty">
              <q-icon name="event_busy" size="48px" color="grey-5" />
              <p class="text-subtitle1 text-weight-bold q-mt-md">No hay períodos</p>
              <p class="text-caption text-grey">Selecciona un mes y genera los borradores</p>
            </div>
          </template>
        </q-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  formatPeriodLabel,
  isValidPeriod as isValidPeriodValue,
  normalizePeriodValue,
} from "@/utils/payrollPeriod.js";

const props = defineProps({
  periodInput: { type: String, required: true },
  periodRows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['update:periodInput', 'generate', 'open-period']);

const columns = [
  { name: "period", label: "Período", field: "period", sortable: true, align: "left" },
  { name: "status", label: "Estado", field: "status", sortable: true, align: "center" },
  { name: "counts", label: "Resumen", field: "counts", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" },
];

const isValidPeriod = computed(() => isValidPeriodValue(props.periodInput));

const stats = computed(() => [
  { icon: "folder", color: "primary", value: props.periodRows.length, label: "Períodos" },
  { icon: "edit_note", color: "orange", value: countStatus('DRAFT'), label: "Borrador" },
  { icon: "check_circle", color: "green", value: countStatus('PUBLISHED'), label: "Publicados" },
  { icon: "lock", color: "grey", value: countStatus('CLOSED'), label: "Cerrados" },
]);

function countStatus(status) {
  return props.periodRows.filter(p => p.status === status).length;
}

function formatPeriod(period) {
  return formatPeriodLabel(period);
}

function updatePeriod(value) {
  emit("update:periodInput", normalizePeriodValue(value));
}

function statusColor(status) {
  const map = { CLOSED: "grey", PUBLISHED: "green", DRAFT: "orange" };
  return map[status] || "grey";
}

function statusLabel(status) {
  const map = { CLOSED: "Cerrado", PUBLISHED: "Publicado", DRAFT: "Borrador" };
  return map[status] || status || "—";
}
</script>

<style scoped>
.rk-period-view {
  position: relative;
  z-index: 1;
}

.rk-content-card {
  background: var(--rk-card, #fff);
  border: 1px solid var(--rk-border, rgba(0,0,0,.08));
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,.04);
}

.body--dark .rk-content-card {
  background: #101318;
  border-color: rgba(255,255,255,.08);
}

/* Controls row */
.rk-controls-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.rk-control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 0 0 220px;
}

.rk-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(0,0,0,.55);
}

.body--dark .rk-label {
  color: rgba(255,255,255,.55);
}

.rk-input :deep(.q-field__control) {
  border-radius: 8px;
  min-height: 38px;
}

.rk-generate-btn {
  min-height: 38px;
  text-transform: none;
  font-weight: 700;
  border-radius: 8px;
  padding: 0 20px;
}

/* Stats */
.rk-stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.rk-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(0,0,0,.02);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 8px;
}

.body--dark .rk-stat {
  background: rgba(255,255,255,.04);
  border-color: rgba(255,255,255,.06);
}

.rk-stat-val {
  font-size: 1.1rem;
  font-weight: 800;
}

.rk-stat-lbl {
  font-size: 0.78rem;
  color: rgba(0,0,0,.5);
}

.body--dark .rk-stat-lbl {
  color: rgba(255,255,255,.5);
}

/* Table */
.rk-table-wrap {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.06);
}

.body--dark .rk-table-wrap {
  border-color: rgba(255,255,255,.08);
}

.rk-table :deep(thead tr) {
  background: var(--q-primary);
}

.rk-table :deep(thead th) {
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 12px 16px;
}

.rk-table :deep(tbody td) {
  padding: 12px 16px;
}

.rk-cell-period {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rk-status-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.rk-counts {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.82rem;
}

.rk-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(0,0,0,.65);
}

.body--dark .rk-count {
  color: rgba(255,255,255,.65);
}

.rk-count-draft { color: #d97706; }
.rk-count-issued { color: #16a34a; }

.rk-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
}

@media (max-width: 767px) {
  .rk-content-card {
    padding: 16px;
    border-radius: 12px;
  }

  .rk-control-group {
    flex: 1 1 100%;
  }

  .rk-generate-btn {
    width: 100%;
  }

  .rk-stats-row {
    gap: 10px;
  }

  .rk-stat {
    flex: 1 1 calc(50% - 10px);
  }
}
</style>
