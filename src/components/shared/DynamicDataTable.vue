<template>
  <q-table
    :class="['rk-table', tableClass]"
    :rows="rows"
    :columns="columns"
    :row-key="rowKey"
    :loading="loading"
    :pagination="pagination"
    :rows-per-page-options="rowsPerPageOptions"
    :binary-state-sort="binaryStateSort"
    :flat="flat"
    :bordered="bordered"
    :wrap-cells="wrapCells"
    :no-data-label="noDataLabel"
    :loading-label="loadingLabel"
    :filter="filter"
    :selection="selection"
    v-model:selected="selectedProxy"
    @request="onRequest"
    @row-dblclick="(...args) => emit('row-dblclick', ...args)"
    @row-click="(...args) => emit('row-click', ...args)"
  >
    <template
      v-for="name in passThroughNames"
      :key="name"
      v-slot:[name]="slotProps"
    >
      <slot :name="name" v-bind="slotProps" />
    </template>

    <template #loading>
      <div class="rk-loading">
        <q-spinner-hourglass color="cyan-5" size="40px" />
        <p>{{ loadingLabel }}</p>
      </div>
    </template>

    <template #no-data>
      <div class="rk-no-data">
        <q-icon name="inbox" size="48px" />
        <p>{{ noDataLabel }}</p>
      </div>
    </template>
  </q-table>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rowKey: { type: String, default: '_id' },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, default: () => ({ page: 1, rowsPerPage: 10 }) },
  rowsPerPageOptions: { type: Array, default: () => [10, 20, 50, 100] },
  binaryStateSort: { type: Boolean, default: true },
  flat: { type: Boolean, default: true },
  bordered: { type: Boolean, default: true },
  wrapCells: { type: Boolean, default: false },
  noDataLabel: { type: String, default: 'Sin datos' },
  loadingLabel: { type: String, default: 'Cargando…' },
  filter: { type: [String, Object], default: '' },
  selection: { type: String, default: 'none' },
  selected: { type: Array, default: () => [] },
  tableClass: { type: [String, Array, Object], default: '' }
})

const emit = defineEmits(['request', 'update:selected', 'row-dblclick', 'row-click'])

const selectedProxy = computed({
  get: () => props.selected,
  set: v => emit('update:selected', v)
})

const onRequest = (payload) => emit('request', payload)

const slots = useSlots()
const passThroughNames = computed(() => {
  const names = Object.keys(slots || {})
  return names.filter(n => n !== 'default' && n !== 'loading' && n !== 'no-data')
})
</script>

<style scoped>
/* ==========================================
   COLORES EXACTOS DE LIQUIDACIONES
   ========================================== */
.rk-table {
  /* Cyan/Teal principal */
  --cyan-bright: #06b6d4;
  --cyan-header: #0891b2;
  --cyan-glow: rgba(6, 182, 212, 0.5);
  
  /* Backgrounds oscuros */
  --bg-dark-1: #0f1419;
  --bg-dark-2: #1a2332;
  --bg-dark-3: #243447;
  --bg-dark-row: #1e2a3a;
  
  /* Borders */
  --border-subtle: rgba(6, 182, 212, 0.15);
  --border-medium: rgba(6, 182, 212, 0.3);
  --border-strong: #0891b2;
  
  /* Text */
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
}

/* ==========================================
   CONTAINER - Integrado con el diseño
   ========================================== */
.rk-table {
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-dark-2);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

/* ==========================================
   TOP BAR - Cyan header matching Liquidaciones
   ========================================== */
.rk-table :deep(.q-table__top) {
  padding: 16px 20px;
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
  border-bottom: none;
}

/* ==========================================
   HEADER - Cyan brillante
   ========================================== */
.rk-table :deep(thead) {
  position: relative;
  z-index: 2;
}

.rk-table :deep(thead tr) {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
}

.rk-table :deep(th) {
  padding: 14px 16px;
  font-weight: 800;
  font-size: 0.7rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ffffff;
  border-bottom: none;
  background: transparent;
  transition: all 0.2s ease;
}

.rk-table :deep(th.sortable) {
  cursor: pointer;
}

.rk-table :deep(th.sortable):hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Sort icon blanco */
.rk-table :deep(.q-table__sort-icon) {
  opacity: 0.6;
  color: #ffffff;
  transition: all 0.2s ease;
}

.rk-table :deep(th[aria-sort] .q-table__sort-icon) {
  opacity: 1;
  transform: scale(1.1);
}

/* ==========================================
   STICKY HEADER
   ========================================== */
.rk-table.rk-scrollable :deep(.q-table__middle) {
  max-height: 65vh;
  overflow: auto;
}

.rk-table.rk-scrollable :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
}

/* ==========================================
   TABLE BODY - Oscuro con hover cyan
   ========================================== */
.rk-table :deep(tbody tr) {
  transition: all 0.2s ease;
  background: var(--bg-dark-2);
  border-bottom: 1px solid var(--border-subtle);
}

/* Zebra striping sutil */
.rk-table :deep(tbody tr:nth-child(even)) {
  background: var(--bg-dark-row);
}

/* Row hover - Efecto cyan brillante */
.rk-table :deep(tbody tr:hover) {
  background: linear-gradient(90deg, rgba(6, 182, 212, 0.15), transparent);
  box-shadow: inset 3px 0 0 var(--cyan-bright);
}

/* Cells */
.rk-table :deep(td) {
  padding: 14px 16px;
  font-size: 0.875rem;
  color: var(--text-primary);
  border-bottom: none;
}

.rk-table :deep(td:first-child) {
  font-weight: 700;
}

/* ==========================================
   SELECTION - Checkboxes cyan
   ========================================== */
.rk-table :deep(.q-checkbox__bg) {
  border: 2px solid var(--border-medium);
  border-radius: 4px;
  background: var(--bg-dark-3);
}

.rk-table :deep(.q-checkbox__bg):hover {
  border-color: var(--cyan-bright);
  box-shadow: 0 0 8px var(--cyan-glow);
}

.rk-table :deep(.q-checkbox__inner--truthy .q-checkbox__bg) {
  background: var(--cyan-bright);
  border-color: var(--cyan-bright);
  box-shadow: 0 0 12px var(--cyan-glow);
}

/* Selected row - Cyan glow */
.rk-table :deep(.q-tr--selected) {
  background: rgba(6, 182, 212, 0.2) !important;
  box-shadow: 
    inset 3px 0 0 var(--cyan-bright),
    0 0 15px rgba(6, 182, 212, 0.3);
}

/* ==========================================
   CHIPS & BADGES - Estilo Liquidaciones
   ========================================== */
.rk-table :deep(.q-chip) {
  background: var(--bg-dark-3);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 4px 10px;
  color: var(--text-primary);
}

.rk-table :deep(.q-badge) {
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.7rem;
  padding: 3px 8px;
  background: var(--cyan-header);
  box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);
}

/* ==========================================
   BUTTONS - Cyan matching UI
   ========================================== */
.rk-table :deep(td .q-btn) {
  border-radius: 8px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.rk-table :deep(td .q-btn.q-btn--flat) {
  color: var(--cyan-bright);
}

.rk-table :deep(td .q-btn.q-btn--flat):hover {
  background: rgba(6, 182, 212, 0.1);
}

.rk-table :deep(td .q-btn:not(.q-btn--flat)) {
  background: var(--cyan-header);
  color: #ffffff;
}

.rk-table :deep(td .q-btn:not(.q-btn--flat)):hover {
  background: var(--cyan-bright);
  box-shadow: 0 4px 12px var(--cyan-glow);
  transform: translateY(-2px);
}

/* ==========================================
   MONOSPACE - IDs y códigos
   ========================================== */
.rk-table :deep(.rk-mono) {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--cyan-bright);
  background: rgba(6, 182, 212, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-medium);
}

/* ==========================================
   STATUS BADGES - Colores semánticos
   ========================================== */
.rk-table :deep(.rk-status) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.75rem;
}

.rk-table :deep(.rk-status.success) {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.rk-table :deep(.rk-status.warning) {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.rk-table :deep(.rk-status.danger) {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.rk-table :deep(.rk-status.info) {
  background: rgba(6, 182, 212, 0.15);
  color: var(--cyan-bright);
  border: 1px solid var(--border-medium);
}

/* ==========================================
   ROW VARIANTS
   ========================================== */
.rk-table :deep(.rk-row--success) {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.1), transparent);
  box-shadow: inset 3px 0 0 #22c55e;
}

.rk-table :deep(.rk-row--warning) {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.1), transparent);
  box-shadow: inset 3px 0 0 #f59e0b;
}

.rk-table :deep(.rk-row--danger) {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.1), transparent);
  box-shadow: inset 3px 0 0 #ef4444;
}

/* ==========================================
   LOADING - Cyan spinner
   ========================================== */
.rk-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  gap: 16px;
}

.rk-loading p {
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0;
}

/* ==========================================
   NO DATA - Empty state
   ========================================== */
.rk-no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
}

.rk-no-data .q-icon {
  color: var(--text-muted);
  margin-bottom: 16px;
}

.rk-no-data p {
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0;
}

/* ==========================================
   PAGINATION - Matching UI
   ========================================== */
.rk-table :deep(.q-table__bottom) {
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-dark-3);
}

.rk-table :deep(.q-table__control) {
  color: var(--text-secondary);
  font-weight: 600;
}

.rk-table :deep(.q-btn.q-pagination__btn) {
  border-radius: 6px;
  min-width: 32px;
  height: 32px;
  font-weight: 700;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.rk-table :deep(.q-btn.q-pagination__btn:hover) {
  border-color: var(--cyan-bright);
  background: rgba(6, 182, 212, 0.1);
}

.rk-table :deep(.q-btn.q-pagination__btn.q-btn--active) {
  background: var(--cyan-bright);
  color: #ffffff;
  border-color: var(--cyan-bright);
  box-shadow: 0 0 12px var(--cyan-glow);
}

/* ==========================================
   SCROLLBAR - Cyan theme
   ========================================== */
.rk-table :deep(.q-table__middle)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.rk-table :deep(.q-table__middle)::-webkit-scrollbar-track {
  background: var(--bg-dark-3);
}

.rk-table :deep(.q-table__middle)::-webkit-scrollbar-thumb {
  background: var(--cyan-header);
  border-radius: 4px;
}

.rk-table :deep(.q-table__middle)::-webkit-scrollbar-thumb:hover {
  background: var(--cyan-bright);
  box-shadow: 0 0 8px var(--cyan-glow);
}

/* ==========================================
   UTILITIES
   ========================================== */
.rk-table :deep(.rk-ellipsis) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.rk-table :deep(.rk-nowrap) {
  white-space: nowrap;
}

.rk-table :deep(.rk-text-cyan) {
  color: var(--cyan-bright);
  font-weight: 700;
}

/* ==========================================
   DENSITY
   ========================================== */
.rk-table.rk-compact :deep(td),
.rk-table.rk-compact :deep(th) {
  padding: 8px 12px;
}

.rk-table.rk-spacious :deep(td),
.rk-table.rk-spacious :deep(th) {
  padding: 18px 20px;
}

/* ==========================================
   FOCUS
   ========================================== */
.rk-table :deep(tbody tr:focus-within) {
  outline: 2px solid var(--cyan-bright);
  outline-offset: -2px;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
}

/* ==========================================
   RESPONSIVE
   ========================================== */
@media (max-width: 767px) {
  .rk-table {
    border-radius: 10px;
  }

  .rk-table :deep(.q-table__top) {
    padding: 12px 16px;
  }

  .rk-table :deep(th),
  .rk-table :deep(td) {
    padding: 12px 14px;
    font-size: 0.8rem;
  }

  .rk-table :deep(th) {
    font-size: 0.65rem;
  }
}

/* ==========================================
   REDUCED MOTION
   ========================================== */
@media (prefers-reduced-motion: reduce) {
  .rk-table,
  .rk-table :deep(*) {
    animation: none !important;
    transition: none !important;
  }
}

/* ==========================================
   PRINT
   ========================================== */
@media print {
  .rk-table {
    box-shadow: none;
    border: 1px solid #999;
  }

  .rk-table :deep(.q-table__top),
  .rk-table :deep(.q-table__bottom) {
    display: none;
  }

  .rk-table :deep(thead tr) {
    background: #0891b2 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>