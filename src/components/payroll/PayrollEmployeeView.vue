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
      <div class="rk-stat-cards">
        <div class="rk-stat-card rk-stat-card--primary">
          <div class="rk-stat-card__icon"><q-icon name="groups" size="22px" /></div>
          <div class="rk-stat-card__body">
            <div class="rk-stat-card__val">{{ payslips.length }}</div>
            <div class="rk-stat-card__lbl">Total</div>
          </div>
          <div class="rk-stat-card__deco"></div>
        </div>
        <div class="rk-stat-card rk-stat-card--warning">
          <div class="rk-stat-card__icon"><q-icon name="edit_note" size="22px" /></div>
          <div class="rk-stat-card__body">
            <div class="rk-stat-card__val">{{ countByStatus('DRAFT') }}</div>
            <div class="rk-stat-card__lbl">Borradores</div>
          </div>
          <div class="rk-stat-card__deco"></div>
        </div>
        <div class="rk-stat-card rk-stat-card--positive">
          <div class="rk-stat-card__icon"><q-icon name="check_circle" size="22px" /></div>
          <div class="rk-stat-card__body">
            <div class="rk-stat-card__val">{{ countByStatus('ISSUED') }}</div>
            <div class="rk-stat-card__lbl">Emitidas</div>
          </div>
          <div class="rk-stat-card__deco"></div>
        </div>
        <div class="rk-stat-card rk-stat-card--money">
          <div class="rk-stat-card__icon"><q-icon name="paid" size="22px" /></div>
          <div class="rk-stat-card__body">
            <div class="rk-stat-card__val rk-stat-card__val--money">{{ formatMoney(totalLiquido) }}</div>
            <div class="rk-stat-card__lbl">Líquido emitido</div>
          </div>
          <div class="rk-stat-card__deco"></div>
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
                <span class="text-positive">+{{ formatMoney(props.row.totalEarn) }}</span>
                <span class="text-negative"> -{{ formatMoney(props.row.totalDeduct) }}</span>
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

                <!-- DRAFT: secondary action is Eliminar -->
                <q-btn
                  v-if="props.row.status === 'DRAFT'"
                  flat dense
                  color="negative"
                  icon="delete"
                  :disable="loading"
                  @click="$emit('delete-one', props.row)"
                >
                  <q-tooltip>Eliminar borrador</q-tooltip>
                </q-btn>

                <!-- ISSUED: primary action is Ver PDF -->
                <q-btn
                  v-if="props.row.status === 'ISSUED'"
                  unelevated dense
                  color="primary"
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
                  color="warning"
                  icon="block"
                  :disable="loading"
                  @click="$emit('void-one', props.row)"
                >
                  <q-tooltip>Anular liquidación</q-tooltip>
                </q-btn>

                <!-- VOID: allow delete -->
                <q-btn
                  v-if="props.row.status === 'VOID'"
                  flat dense
                  color="negative"
                  icon="delete"
                  :disable="loading"
                  @click="$emit('delete-one', props.row)"
                >
                  <q-tooltip>Eliminar liquidación anulada</q-tooltip>
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
  'delete-one',
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
  const colors = ['#0CA9C4', '#0893AA', '#33BECB', '#0893AA', '#067C90'];
  const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function statusBadgeColor(s) {
  const map = { ISSUED: "positive", DRAFT: "warning", VOID: "grey" };
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
  background: var(--color-warning-soft);
  border: 1px solid var(--color-warning-soft);
  color: var(--color-warning);
}

.body--dark .rk-alert-warning {
  color: var(--color-warning);
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

/* Stat cards */
.rk-stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
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

.rk-stat-card__val--money {
  font-family: 'Space Mono', monospace;
  font-size: 1.25rem;
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

.rk-stat-card--primary .rk-stat-card__icon { background: var(--color-primary-soft); color: var(--color-primary); }
.rk-stat-card--warning .rk-stat-card__icon { background: var(--color-warning-soft); color: var(--color-warning); }
.rk-stat-card--positive .rk-stat-card__icon { background: var(--color-success-soft, rgba(34,197,94,.14)); color: var(--color-success); }
.rk-stat-card--money .rk-stat-card__icon { background: var(--color-primary-soft); color: var(--color-primary); }
.rk-stat-card--money .rk-stat-card__val { color: var(--color-success); }

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
  color: var(--color-success);
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

  .rk-stat-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>
