<template>
  <div class="rk-employee-view">
    <div class="rk-content-card">
      <!-- Filters Section -->
      <div class="rk-filters-section">
        <div class="rk-filter-group">
          <label class="rk-filter-label">
            <q-icon name="event" />
            <span>Período</span>
          </label>
          <q-input
            :model-value="periodSelected"
            @update:model-value="$emit('update:periodSelected', $event)"
            dense
            outlined
            placeholder="YYYY-MM"
            mask="####-##"
            class="rk-filter-input"
          >
            <template #prepend>
              <q-icon name="calendar_today" />
            </template>
            <template #append>
              <q-btn flat dense round icon="more_time" size="sm">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    :model-value="periodSelected"
                    @update:model-value="$emit('update:periodSelected', $event)"
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

        <div class="rk-filter-group">
          <label class="rk-filter-label">
            <q-icon name="search" />
            <span>Buscar empleado</span>
          </label>
          <q-input
            :model-value="query"
            @update:model-value="$emit('update:query', $event)"
            dense
            outlined
            debounce="300"
            placeholder="Nombre o RUT..."
            clearable
            class="rk-filter-input"
          >
            <template #prepend>
              <q-icon name="person_search" />
            </template>
          </q-input>
        </div>

        <div class="rk-filter-group">
          <label class="rk-filter-label">
            <q-icon name="filter_list" />
            <span>Estado</span>
          </label>
          <q-select
            :model-value="status"
            @update:model-value="$emit('update:status', $event)"
            :options="statusOptions"
            dense
            outlined
            emit-value
            map-options
            clearable
            placeholder="Todos"
            class="rk-filter-input"
          />
        </div>

        <div class="rk-filter-actions">
          <button class="rk-filter-btn" @click="$emit('load')" :disabled="loading">
            <q-icon name="refresh" :class="{ 'rotate-animation': loading }" />
            <span>Cargar</span>
          </button>
          <button
            class="rk-filter-btn rk-btn-primary"
            @click="$emit('issue-selected')"
            :disabled="selected.length === 0 || issuingMany"
          >
            <q-icon name="receipt_long" />
            <span>Emitir seleccionados</span>
            <div v-if="selected.length > 0" class="rk-selection-badge">{{ selected.length }}</div>
          </button>
        </div>
      </div>

      <!-- Employee Stats -->
      <div class="rk-employee-stats">
        <div class="rk-employee-stat-card">
          <div class="rk-employee-stat-icon rk-icon-blue">
            <q-icon name="description" />
          </div>
          <div class="rk-employee-stat-content">
            <span class="rk-employee-stat-label">Total liquidaciones</span>
            <strong class="rk-employee-stat-value">{{ payslips.length }}</strong>
          </div>
        </div>

        <div class="rk-employee-stat-card">
          <div class="rk-employee-stat-icon rk-icon-orange">
            <q-icon name="edit_note" />
          </div>
          <div class="rk-employee-stat-content">
            <span class="rk-employee-stat-label">Borradores</span>
            <strong class="rk-employee-stat-value">{{ countByStatus('DRAFT') }}</strong>
            <span class="rk-employee-stat-percentage">{{ getPercentage('DRAFT') }}%</span>
          </div>
        </div>

        <div class="rk-employee-stat-card">
          <div class="rk-employee-stat-icon rk-icon-green">
            <q-icon name="check_circle" />
          </div>
          <div class="rk-employee-stat-content">
            <span class="rk-employee-stat-label">Emitidas</span>
            <strong class="rk-employee-stat-value">{{ countByStatus('ISSUED') }}</strong>
            <span class="rk-employee-stat-percentage">{{ getPercentage('ISSUED') }}%</span>
          </div>
        </div>

        <div class="rk-employee-stat-card">
          <div class="rk-employee-stat-icon rk-icon-teal">
            <q-icon name="paid" />
          </div>
          <div class="rk-employee-stat-content">
            <span class="rk-employee-stat-label">Total líquido</span>
            <strong class="rk-employee-stat-value rk-value-money">{{ formatMoney(totalLiquido) }}</strong>
            <span class="rk-employee-stat-percentage">Suma emitidas</span>
          </div>
        </div>
      </div>

      <!-- Employees Table -->
      <div class="rk-table-container">
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
          class="rk-table rk-table-selectable"
          no-data-label="No hay liquidaciones para este período"
          loading-label="Cargando liquidaciones..."
        >
          <template #body-cell-employee="props">
            <q-td :props="props">
              <div class="rk-employee-cell">
                <q-avatar 
                  size="40px" 
                  class="rk-employee-avatar" 
                  :style="{ background: getAvatarColor(props.row.employeeName) }"
                >
                  {{ getInitials(props.row.employeeName) }}
                </q-avatar>
                <div class="rk-employee-info">
                  <strong class="rk-employee-name">{{ props.row.employeeName || '—' }}</strong>
                  <span class="rk-employee-rut">{{ props.row.employeeRut || 'Sin RUT' }}</span>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-days="props">
            <q-td :props="props">
              <div class="rk-days-cell">
                <div class="rk-day-item">
                  <q-icon name="event_available" />
                  <span>{{ props.row.daysExpected ?? 0 }}</span>
                </div>
                <div class="rk-day-item rk-day-success">
                  <q-icon name="check_circle" />
                  <span>{{ props.row.daysPaid ?? 0 }}</span>
                </div>
                <div v-if="(props.row.daysAbsent ?? 0) > 0" class="rk-day-item rk-day-error">
                  <q-icon name="event_busy" />
                  <span>{{ props.row.daysAbsent }}</span>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-totals="props">
            <q-td :props="props">
              <div class="rk-totals-cell">
                <strong class="rk-total-net">{{ formatMoney(props.row.totalNet) }}</strong>
                <div class="rk-total-breakdown">
                  <span class="rk-total-earn">
                    <q-icon name="add_circle" />
                    {{ formatMoney(props.row.totalEarn) }}
                  </span>
                  <span class="rk-total-deduct">
                    <q-icon name="remove_circle" />
                    {{ formatMoney(props.row.totalDeduct) }}
                  </span>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <div class="rk-status-badge" :class="`rk-status-${props.row.status.toLowerCase()}`">
                <q-icon :name="getStatusIcon(props.row.status)" />
                <span>{{ props.row.status }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <div class="rk-action-group">
                <button class="rk-action-icon-btn" @click="$emit('open-detail', props.row)">
                  <q-icon name="visibility" />
                  <q-tooltip>Ver detalle</q-tooltip>
                </button>
                <button
                  v-if="props.row.status === 'DRAFT'"
                  class="rk-action-icon-btn rk-btn-success"
                  @click="$emit('issue-one', props.row)"
                >
                  <q-icon name="receipt_long" />
                  <q-tooltip>Emitir</q-tooltip>
                </button>
                <button
                  v-if="props.row.status === 'ISSUED'"
                  class="rk-action-icon-btn rk-btn-danger"
                  @click="$emit('open-pdf', props.row)"
                >
                  <q-icon name="picture_as_pdf" />
                  <q-tooltip>PDF</q-tooltip>
                </button>
                <button
                  v-if="props.row.status === 'ISSUED'"
                  class="rk-action-icon-btn rk-btn-warning"
                  @click="$emit('void-one', props.row)"
                >
                  <q-icon name="block" />
                  <q-tooltip>Anular</q-tooltip>
                </button>
              </div>
            </q-td>
          </template>

          <template #loading>
            <q-inner-loading showing>
              <div class="rk-loading-state">
                <q-spinner-gears size="50px" color="primary" />
                <p>Cargando liquidaciones...</p>
              </div>
            </q-inner-loading>
          </template>

          <template #no-data>
            <div class="rk-empty-state">
              <div class="rk-empty-icon">
                <q-icon name="receipt_long" />
              </div>
              <h3 class="rk-empty-title">No hay liquidaciones</h3>
              <p class="rk-empty-text">Verifica el período seleccionado o genera nuevos borradores</p>
            </div>
          </template>
        </q-table>
      </div>
    </div>
  </div>
</template>

<script setup>
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

defineEmits([
  'update:periodSelected',
  'update:query',
  'update:status',
  'update:selected',
  'load',
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
  { name: "days", label: "Asistencia", field: "daysPaid", sortable: false, align: "left" },
  { name: "totals", label: "Montos", field: "totalNet", sortable: true, align: "left" },
  { name: "status", label: "Estado", field: "status", sortable: true, align: "center" },
  { name: "actions", label: "Acciones", field: "actions", align: "right" },
];

function countByStatus(s) {
  return props.payslips.filter(x => x.status === s).length;
}

function getPercentage(s) {
  const count = countByStatus(s);
  return props.payslips.length > 0 ? ((count / props.payslips.length) * 100).toFixed(0) : 0;
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

function getStatusIcon(s) {
  const icons = { ISSUED: "check_circle", DRAFT: "edit_note", VOID: "block" };
  return icons[s] || "help";
}
</script>

<style scoped>
.rk-employee-view {
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

.rk-filters-section {
  display: grid;
  grid-template-columns: 200px 280px 180px 1fr;
  gap: 16px;
  margin-bottom: 28px;
  align-items: flex-end;
}

.rk-filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rk-filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.7);
}

.body--dark .rk-filter-label {
  color: rgba(255, 255, 255, 0.7);
}

.rk-filter-label .q-icon {
  font-size: 14px;
  color: #22d3ee;
}

.rk-filter-input :deep(.q-field__control) {
  background: rgba(6, 182, 212, 0.04);
  border-color: rgba(6, 182, 212, 0.15);
  border-radius: 10px;
  min-height: 44px;
}

.body--dark .rk-filter-input :deep(.q-field__control) {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
}

.rk-filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.rk-filter-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(6, 182, 212, 0.05);
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 10px;
  color: rgba(15, 23, 42, 0.95);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.body--dark .rk-filter-btn {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.rk-filter-btn:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
}

.rk-filter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rk-filter-btn .q-icon {
  font-size: 18px;
}

.rotate-animation {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rk-btn-primary {
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4);
}

.rk-selection-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 800;
  color: #fff;
}

.rk-employee-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.rk-employee-stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(6, 182, 212, 0.04);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 14px;
  transition: all 0.3s ease;
}

.body--dark .rk-employee-stat-card {
  background: rgba(6, 182, 212, 0.06);
  border-color: rgba(6, 182, 212, 0.15);
}

.rk-employee-stat-card:hover {
  background: rgba(6, 182, 212, 0.08);
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
}

.rk-employee-stat-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  flex-shrink: 0;
}

.rk-icon-blue {
  background: rgba(59, 130, 246, 0.12);
}

.rk-icon-blue .q-icon {
  font-size: 28px;
  color: #3b82f6;
}

.rk-icon-orange {
  background: rgba(245, 158, 11, 0.12);
}

.rk-icon-orange .q-icon {
  font-size: 28px;
  color: #f59e0b;
}

.rk-icon-green {
  background: rgba(34, 197, 94, 0.12);
}

.rk-icon-green .q-icon {
  font-size: 28px;
  color: #22c55e;
}

.rk-icon-teal {
  background: rgba(6, 182, 212, 0.12);
}

.rk-icon-teal .q-icon {
  font-size: 28px;
  color: #22d3ee;
}

.rk-employee-stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.rk-employee-stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.5);
  margin-bottom: 6px;
}

.body--dark .rk-employee-stat-label {
  color: rgba(255, 255, 255, 0.5);
}

.rk-employee-stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.95);
  line-height: 1;
  margin-bottom: 4px;
}

.body--dark .rk-employee-stat-value {
  color: rgba(255, 255, 255, 0.95);
}

.rk-value-money {
  font-size: 1.5rem;
  font-family: 'Space Mono', monospace;
}

.rk-employee-stat-percentage {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.5);
}

.body--dark .rk-employee-stat-percentage {
  color: rgba(255, 255, 255, 0.5);
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

.rk-employee-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rk-employee-avatar {
  color: #fff;
  font-weight: 800;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.rk-employee-name {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.95);
  margin-bottom: 4px;
}

.body--dark .rk-employee-name {
  color: rgba(255, 255, 255, 0.95);
}

.rk-employee-rut {
  display: block;
  font-size: 0.8rem;
  color: rgba(15, 23, 42, 0.5);
}

.body--dark .rk-employee-rut {
  color: rgba(255, 255, 255, 0.5);
}

.rk-days-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rk-day-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.7);
}

.body--dark .rk-day-item {
  color: rgba(255, 255, 255, 0.7);
}

.rk-day-item .q-icon {
  font-size: 16px;
}

.rk-day-success {
  color: #22c55e;
}

.rk-day-error {
  color: #ef4444;
}

.rk-totals-cell {
  display: flex;
  flex-direction: column;
}

.rk-total-net {
  font-size: 1.25rem;
  font-weight: 800;
  color: #22c55e;
  margin-bottom: 8px;
  font-family: 'Space Mono', monospace;
}

.rk-total-breakdown {
  display: flex;
  gap: 14px;
  font-size: 0.8rem;
}

.rk-total-earn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #22c55e;
  font-weight: 600;
}

.rk-total-earn .q-icon {
  font-size: 14px;
}

.rk-total-deduct {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ef4444;
  font-weight: 600;
}

.rk-total-deduct .q-icon {
  font-size: 14px;
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

.rk-status-issued {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.rk-status-void {
  background: rgba(107, 114, 128, 0.12);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.rk-action-group {
  display: flex;
  gap: 6px;
}

.rk-action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.15);
  border-radius: 8px;
  color: rgba(15, 23, 42, 0.95);
  cursor: pointer;
  transition: all 0.3s ease;
}

.body--dark .rk-action-icon-btn {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.rk-action-icon-btn:hover {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
}

.rk-action-icon-btn .q-icon {
  font-size: 18px;
}

.rk-btn-success:hover {
  background: rgba(34, 197, 94, 0.12);
  border-color: #22c55e;
  color: #22c55e;
}

.rk-btn-danger:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
  color: #ef4444;
}

.rk-btn-warning:hover {
  background: rgba(245, 158, 11, 0.12);
  border-color: #f59e0b;
  color: #f59e0b;
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
  .rk-employee-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1023px) {
  .rk-filters-section {
    grid-template-columns: 1fr;
  }

  .rk-filter-actions {
    justify-content: flex-start;
  }

  .rk-employee-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .rk-content-card {
    padding: 20px;
    border-radius: 16px;
  }

  .rk-table :deep(thead th),
  .rk-table :deep(tbody td) {
    padding: 12px;
  }
}
</style>