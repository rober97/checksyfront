<template>
  <div class="rk-employee-view">
    <div class="rk-content-card">
      <!-- Top bar: back + period + title -->
      <div class="rk-top-bar">
        <q-btn
          flat dense
          icon="arrow_back"
          label="Períodos"
          @click="$emit('back-to-periods')"
          class="rk-back-btn"
        />
        <h2 class="rk-view-title">
          Liquidaciones de <strong>{{ formatPeriod(periodSelected) }}</strong>
        </h2>
      </div>

      <!-- Alert banner when there are drafts -->
      <div
        v-if="countByStatus('DRAFT') > 0"
        class="rk-alert rk-alert-warning"
      >
        <q-icon name="pending_actions" size="20px" />
        <span>
          <strong>{{ countByStatus('DRAFT') }}</strong> borrador{{ countByStatus('DRAFT') !== 1 ? 'es' : '' }} pendiente{{ countByStatus('DRAFT') !== 1 ? 's' : '' }} de emisión.
          Al emitir, el PDF se abre automaticamente.
        </span>
      </div>

      <!-- Filters -->
      <div class="rk-filters">
        <q-input
          :model-value="query"
          @update:model-value="$emit('update:query', $event)"
          dense
          outlined
          debounce="300"
          placeholder="Buscar empleado..."
          clearable
          class="rk-filter-input"
        >
          <template #prepend>
            <q-icon name="search" size="18px" />
          </template>
        </q-input>

        <q-select
          :model-value="status"
          @update:model-value="$emit('update:status', $event)"
          :options="statusOptions"
          dense
          outlined
          emit-value
          map-options
          clearable
          placeholder="Estado"
          class="rk-filter-select"
        />

        <q-btn
          v-if="selected.length > 0"
          unelevated
          color="primary"
          icon="receipt_long"
          :label="`Emitir ${selected.length} seleccionado${selected.length > 1 ? 's' : ''}`"
          :disable="issuingMany || loading"
          :loading="issuingMany"
          class="rk-emit-btn"
          @click="$emit('issue-selected')"
        />
      </div>

      <!-- Quick stats -->
      <div class="rk-stats-row">
        <div class="rk-stat">
          <span class="rk-stat-val">{{ payslips.length }}</span>
          <span class="rk-stat-lbl">Total</span>
        </div>
        <div class="rk-stat">
          <q-icon name="edit_note" size="16px" color="orange" />
          <span class="rk-stat-val">{{ countByStatus('DRAFT') }}</span>
          <span class="rk-stat-lbl">Borrador</span>
        </div>
        <div class="rk-stat">
          <q-icon name="check_circle" size="16px" color="green" />
          <span class="rk-stat-val">{{ countByStatus('ISSUED') }}</span>
          <span class="rk-stat-lbl">Emitidas</span>
        </div>
        <div class="rk-stat">
          <q-icon name="paid" size="16px" color="primary" />
          <span class="rk-stat-val rk-stat-money">{{ formatMoney(totalLiquido) }}</span>
          <span class="rk-stat-lbl">Liquido</span>
        </div>
      </div>

      <!-- Employees Table -->
      <div class="rk-table-wrap">
        <q-table
          flat
          :rows="payslips"
          :columns="columns"
          row-key="id"
          selection="multiple"
          :selected="selected"
          @update:selected="$emit('update:selected', $event)"
          :loading="loading"
          :rows-per-page-options="[10, 25, 50, 100]"
          :pagination="{ rowsPerPage: 25 }"
          class="rk-table"
          no-data-label="No hay liquidaciones para este período"
          loading-label="Cargando..."
        >
          <template #body-cell-employee="props">
            <q-td :props="props">
              <div class="rk-emp-cell" @click="$emit('open-detail', props.row)" style="cursor:pointer">
                <q-avatar
                  size="34px"
                  class="rk-avatar"
                  :style="{ background: getAvatarColor(props.row.employeeName) }"
                >
                  {{ getInitials(props.row.employeeName) }}
                </q-avatar>
                <div>
                  <strong class="rk-emp-name">{{ props.row.employeeName || '—' }}</strong>
                  <span class="rk-emp-rut">{{ props.row.employeeRut || '' }}</span>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-totals="props">
            <q-td :props="props">
              <strong class="rk-net">{{ formatMoney(props.row.totalNet) }}</strong>
              <div class="rk-breakdown">
                <span class="text-green">+{{ formatMoney(props.row.totalEarn) }}</span>
                <span class="text-red"> -{{ formatMoney(props.row.totalDeduct) }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="statusBadgeColor(props.row.status)"
                :label="statusLabel(props.row.status)"
                outline
                class="rk-status-badge"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <div class="rk-actions">
                <!-- DRAFT: primary action is Emitir -->
                <q-btn
                  v-if="props.row.status === 'DRAFT'"
                  unelevated dense
                  color="primary"
                  icon="receipt_long"
                  label="Emitir"
                  :disable="loading"
                  @click="$emit('issue-one', props.row)"
                  class="rk-action-btn"
                />

                <!-- ISSUED: primary action is Ver PDF -->
                <q-btn
                  v-if="props.row.status === 'ISSUED'"
                  unelevated dense
                  color="red-6"
                  icon="picture_as_pdf"
                  label="Ver PDF"
                  :disable="loading"
                  @click="$emit('open-pdf', props.row)"
                  class="rk-action-btn"
                />

                <!-- ISSUED: secondary action is Anular -->
                <q-btn
                  v-if="props.row.status === 'ISSUED'"
                  flat dense
                  color="orange"
                  icon="block"
                  :disable="loading"
                  @click="$emit('void-one', props.row)"
                >
                  <q-tooltip>Anular liquidacion</q-tooltip>
                </q-btn>

                <!-- Detail button for all -->
                <q-btn
                  flat dense
                  icon="visibility"
                  color="grey-7"
                  @click="$emit('open-detail', props.row)"
                >
                  <q-tooltip>Ver detalle</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <template #no-data>
            <div class="rk-empty">
              <q-icon name="receipt_long" size="48px" color="grey-5" />
              <p class="text-subtitle1 text-weight-bold q-mt-md">Sin liquidaciones</p>
              <p class="text-caption text-grey">Genera borradores desde la vista de Períodos</p>
            </div>
          </template>
        </q-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatPeriodLabel, normalizePeriodValue } from "@/utils/payrollPeriod.js";

const props = defineProps({
  periodSelected: { type: String, required: true },
  query: { type: String, default: '' },
  status: { type: String, default: null },
  selected: { type: Array, required: true },
  payslips: { type: Array, required: true },
  totalLiquido: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  issuingMany: { type: Boolean, default: false },
});

const emit = defineEmits([
  'update:periodSelected',
  'update:query',
  'update:status',
  'update:selected',
  'load',
  'back-to-periods',
  'issue-selected',
  'open-detail',
  'issue-one',
  'void-one',
  'open-pdf',
]);

const statusOptions = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Emitida", value: "ISSUED" },
  { label: "Anulada", value: "VOID" },
];

const columns = [
  { name: "employee", label: "Empleado", field: "employeeName", sortable: true, align: "left" },
  { name: "totals", label: "Montos", field: "totalNet", sortable: true, align: "left" },
  { name: "status", label: "Estado", field: "status", sortable: true, align: "center" },
  { name: "actions", label: "", field: "actions", align: "right" },
];

function countByStatus(s) {
  return props.payslips.filter(x => x.status === s).length;
}

function formatMoney(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#06b6d4', '#14b8a6', '#22d3ee', '#0891b2', '#0e7490'];
  const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function statusBadgeColor(s) {
  const map = { ISSUED: "green", DRAFT: "orange", VOID: "grey" };
  return map[s] || "grey";
}

function statusLabel(status) {
  const labels = { ISSUED: "Emitida", DRAFT: "Borrador", VOID: "Anulada" };
  return labels[status] || status || "—";
}

function formatPeriod(period) {
  return formatPeriodLabel(period);
}
</script>

<style scoped>
.rk-employee-view {
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

/* Top bar */
.rk-top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.rk-back-btn {
  text-transform: none;
  font-weight: 600;
}

.rk-view-title {
  font-size: 1.15rem;
  font-weight: 500;
  margin: 0;
  color: rgba(0,0,0,.75);
}

.body--dark .rk-view-title {
  color: rgba(255,255,255,.75);
}

.rk-view-title strong {
  color: rgba(0,0,0,.95);
  font-weight: 800;
}

.body--dark .rk-view-title strong {
  color: rgba(255,255,255,.95);
}

/* Alert */
.rk-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.rk-alert-warning {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #92400e;
}

.body--dark .rk-alert-warning {
  color: #fbbf24;
}

/* Filters */
.rk-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.rk-filter-input {
  flex: 1 1 240px;
  max-width: 320px;
}

.rk-filter-input :deep(.q-field__control),
.rk-filter-select :deep(.q-field__control) {
  border-radius: 8px;
  min-height: 36px;
}

.rk-filter-select {
  flex: 0 0 160px;
}

.rk-emit-btn {
  text-transform: none;
  font-weight: 700;
  border-radius: 8px;
  min-height: 36px;
  margin-left: auto;
}

/* Stats */
.rk-stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.rk-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0,0,0,.02);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 8px;
}

.body--dark .rk-stat {
  background: rgba(255,255,255,.04);
  border-color: rgba(255,255,255,.06);
}

.rk-stat-val {
  font-weight: 800;
  font-size: 1rem;
}

.rk-stat-money {
  font-family: 'Space Mono', monospace;
  font-size: 0.9rem;
}

.rk-stat-lbl {
  font-size: 0.75rem;
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
  padding: 10px 16px;
}

.rk-emp-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rk-avatar {
  color: #fff;
  font-weight: 800;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.rk-emp-name {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
}

.rk-emp-rut {
  display: block;
  font-size: 0.75rem;
  color: rgba(0,0,0,.45);
}

.body--dark .rk-emp-rut {
  color: rgba(255,255,255,.45);
}

.rk-net {
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  color: #16a34a;
  font-family: 'Space Mono', monospace;
}

.rk-breakdown {
  font-size: 0.72rem;
  margin-top: 2px;
  display: flex;
  gap: 8px;
}

.rk-status-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.rk-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.rk-action-btn {
  text-transform: none;
  font-weight: 700;
  font-size: 0.8rem;
  border-radius: 6px;
  padding: 2px 12px;
}

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

  .rk-top-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .rk-filters {
    flex-direction: column;
  }

  .rk-filter-input,
  .rk-filter-select {
    flex: 1 1 100%;
    max-width: none;
  }

  .rk-emit-btn {
    width: 100%;
    margin-left: 0;
  }

  .rk-stats-row {
    gap: 8px;
  }

  .rk-stat {
    flex: 1 1 calc(50% - 8px);
  }
}
</style>
