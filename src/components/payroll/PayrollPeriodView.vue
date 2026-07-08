<template>
  <div class="rk-period-view">
    <div class="rk-content-card">
      <!-- Controls: period picker + generate -->
      <div class="rk-controls-row">
        <div class="rk-control-group">
          <label class="rk-label">Período</label>
          <q-input
            :model-value="periodDisplay"
            readonly
            dense
            outlined
            class="rk-input rk-input-clickable"
          >
            <template #prepend>
              <q-icon name="calendar_today" size="18px" />
            </template>
            <template #append>
              <q-icon name="expand_more" size="18px" />
            </template>
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-date
                :model-value="periodDatePicker"
                @update:model-value="onPickPeriod"
                default-view="Months"
                emit-immediately
                mask="YYYY-MM"
                minimal
              >
                <div class="row items-center justify-end q-gutter-sm">
                  <q-btn v-close-popup label="Cerrar" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-input>
        </div>

        <div class="rk-generate-zone">
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
          <span class="rk-generate-hint">
            <q-icon name="info" size="14px" />
            Incluye a todos los trabajadores con contrato activo (sin importar su rol).
          </span>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="rk-stat-cards">
        <div
          v-for="s in stats"
          :key="s.label"
          class="rk-stat-card"
          :class="`rk-stat-card--${s.tone}`"
        >
          <div class="rk-stat-card__icon">
            <q-icon :name="s.icon" size="22px" />
          </div>
          <div class="rk-stat-card__body">
            <div class="rk-stat-card__val">{{ s.value }}</div>
            <div class="rk-stat-card__lbl">{{ s.label }}</div>
          </div>
          <div class="rk-stat-card__deco"></div>
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
              <div class="rk-row-actions">
                <q-btn
                  flat dense
                  color="primary"
                  icon="open_in_new"
                  label="Ver empleados"
                  @click="$emit('open-period', props.row.period)"
                />
                <q-btn
                  flat dense
                  color="negative"
                  icon="delete"
                  :disable="(props.row.issued || 0) > 0 || loading"
                  @click="$emit('delete-period', props.row.period)"
                >
                  <q-tooltip>
                    {{ (props.row.issued || 0) > 0
                      ? 'No se puede eliminar: hay liquidaciones emitidas'
                      : 'Eliminar período' }}
                  </q-tooltip>
                </q-btn>
              </div>
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

function periodToDateMask(period) {
  const normalized = normalizePeriodValue(period);
  if (!isValidPeriodValue(normalized)) return "";
  return normalized;
}

const props = defineProps({
  periodInput: { type: String, required: true },
  periodRows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['update:periodInput', 'generate', 'open-period', 'delete-period']);

const columns = [
  { name: "period", label: "Período", field: "period", sortable: true, align: "left" },
  { name: "status", label: "Estado", field: "status", sortable: true, align: "center" },
  { name: "counts", label: "Resumen", field: "counts", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" },
];

const isValidPeriod = computed(() => isValidPeriodValue(props.periodInput));

const periodDisplay = computed(() => formatPeriodLabel(props.periodInput) || "Selecciona un período");
const periodDatePicker = computed(() => periodToDateMask(props.periodInput));

function onPickPeriod(value) {
  if (!value) return;
  emit("update:periodInput", normalizePeriodValue(value));
}

const stats = computed(() => [
  { icon: "folder", tone: "primary", value: props.periodRows.length, label: "Períodos" },
  { icon: "edit_note", tone: "warning", value: countStatus('DRAFT'), label: "Borradores" },
  { icon: "check_circle", tone: "positive", value: countStatus('PUBLISHED'), label: "Publicados" },
  { icon: "lock", tone: "neutral", value: countStatus('CLOSED'), label: "Cerrados" },
]);

function countStatus(status) {
  return props.periodRows.filter(p => p.status === status).length;
}

function formatPeriod(period) {
  return formatPeriodLabel(period);
}

function statusColor(status) {
  const map = { CLOSED: "grey", PUBLISHED: "positive", DRAFT: "warning" };
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
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--app-shadow-sm);
}

.body--dark .rk-content-card {
  background: var(--card-background);
  border-color: var(--border-color);
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

.rk-input-clickable :deep(.q-field__control),
.rk-input-clickable :deep(.q-field__native) {
  cursor: pointer;
}

.rk-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.rk-generate-zone {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rk-generate-btn {
  min-height: 38px;
  text-transform: none;
  font-weight: 700;
  border-radius: 8px;
  padding: 0 20px;
}

.rk-generate-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  color: rgba(0,0,0,.5);
  max-width: 320px;
  line-height: 1.3;
}

.body--dark .rk-generate-hint {
  color: rgba(255,255,255,.5);
}

/* Stat cards */
.rk-stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.rk-stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.06);
  background: rgba(0,0,0,.02);
  transition: transform .25s ease, box-shadow .25s ease;
}

.rk-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--app-shadow-sm);
}

.body--dark .rk-stat-card {
  background: rgba(255,255,255,.03);
  border-color: rgba(255,255,255,.07);
}

.rk-stat-card__icon {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rk-stat-card__val {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

.rk-stat-card__lbl {
  margin-top: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0,0,0,.5);
}

.body--dark .rk-stat-card__lbl {
  color: rgba(255,255,255,.5);
}

.rk-stat-card__deco {
  position: absolute;
  top: -18px;
  right: -18px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.10) 0%, transparent 70%);
  pointer-events: none;
}

/* Stat card tones */
.rk-stat-card--primary .rk-stat-card__icon { background: var(--color-primary-soft); color: var(--color-primary); }
.rk-stat-card--warning .rk-stat-card__icon { background: var(--color-warning-soft); color: var(--color-warning); }
.rk-stat-card--positive .rk-stat-card__icon { background: var(--color-success-soft, rgba(34,197,94,.14)); color: var(--color-success); }
.rk-stat-card--neutral .rk-stat-card__icon { background: rgba(120,120,120,.14); color: #8a8f98; }

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

.rk-count-draft { color: var(--color-warning); }
.rk-count-issued { color: var(--color-success); }

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

  .rk-generate-zone {
    width: 100%;
  }

  .rk-generate-btn {
    width: 100%;
  }

  .rk-generate-hint {
    max-width: none;
  }

  .rk-stat-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>
