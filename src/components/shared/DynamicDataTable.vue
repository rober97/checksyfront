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
    <!-- Re-expose all named slots except default & loading to avoid conflicts -->
    <template
      v-for="name in passThroughNames"
      :key="name"
      v-slot:[name]="slotProps"
    >
      <slot :name="name" v-bind="slotProps" />
    </template>

    <!-- Provide our own loading slot (safe) -->
    <template #loading>
      <q-inner-loading showing>
        <q-spinner size="32px" />
      </q-inner-loading>
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
  selection: { type: String, default: 'none' }, // 'multiple' | 'single' | 'none'
  selected: { type: Array, default: () => [] },
  tableClass: { type: [String, Array, Object], default: '' }
})

const emit = defineEmits(['request', 'update:selected', 'row-dblclick', 'row-click'])

const selectedProxy = computed({
  get: () => props.selected,
  set: v => emit('update:selected', v)
})

const onRequest = (payload) => emit('request', payload)

// Dynamic slot passthrough (exclude default & loading to prevent runtime errors)
const slots = useSlots()
const passThroughNames = computed(() => {
  const names = Object.keys(slots || {})
  return names.filter(n => n !== 'default' && n !== 'loading')
})
</script>

<style scoped>
/* ======= Tokens Light/Dark ======= */
:root{
  --rk-border: rgba(0,0,0,.08);
  --rk-card: #ffffff;
  --rk-soft: #f5f7fb;
  --rk-muted: #667085;
  --rk-shadow: 0 8px 22px rgba(0,0,0,.06);
}
.body--dark{
  --rk-border: rgba(255,255,255,.10);
  --rk-card: #0f1216;
  --rk-soft: #0b0e12;
  --rk-muted: #9aa3b2;
  --rk-shadow: 0 10px 28px rgba(0,0,0,.45);
}

/* ======= Contenedor ======= */
.rk-table{
  border-radius: 14px;
  overflow: hidden;
  border:1px solid var(--rk-border);
  background: var(--rk-card);
  box-shadow: var(--rk-shadow);
  transition: box-shadow .2s ease, transform .12s ease, background-color .2s ease;
}
.rk-table:hover{ box-shadow: 0 14px 34px rgba(0,0,0,.10) }
.body--dark .rk-table:hover{ box-shadow: 0 16px 40px rgba(0,0,0,.6) }

/* ======= Top bar ======= */
.rk-table :deep(.q-table__top){
  padding: 10px 12px;
  border-bottom:1px solid var(--rk-border);
  background:
    radial-gradient(140% 120% at 0% 0%, color-mix(in oklab, var(--q-primary) 10%, transparent), transparent 60%),
    var(--rk-card);
  backdrop-filter: saturate(1.05) blur(6px);
}

/* ======= Cabecera ======= */
.rk-table :deep(thead tr){
  background: color-mix(in oklab, var(--rk-soft) 92%, transparent);
}
.body--dark .rk-table :deep(thead tr){
  background: color-mix(in oklab, var(--rk-soft) 85%, transparent);
}
.rk-table :deep(th){
  font-weight: 700;
  letter-spacing: .2px;
  color: var(--rk-muted);
  font-size: 12.5px;
  border-bottom:1px solid var(--rk-border);
  transition: background-color .2s ease, color .2s ease;
}

/* ======= Cabecera sticky (activar con clase rk-scrollable en <q-table>) ======= */
.rk-table.rk-scrollable :deep(.q-table__middle){
  max-height: 58vh; /* ajusta a tu layout */
  overflow: auto;
  scrollbar-gutter: stable;
}
.rk-table.rk-scrollable :deep(thead th){
  position: sticky;
  top: 0;
  z-index: 2;
  backdrop-filter: blur(6px) saturate(1.05);
  background:
    linear-gradient(180deg, color-mix(in oklab, var(--rk-soft) 92%, transparent), transparent);
}

/* Indicador de sort más visible */
.rk-table :deep(.q-table__sort-icon){
  opacity: .55;
  transform: translateY(-.5px);
  transition: opacity .12s ease, transform .12s ease;
}
.rk-table :deep(th[aria-sort="ascending"] .q-table__sort-icon),
.rk-table :deep(th[aria-sort="descending"] .q-table__sort-icon){
  opacity: 1;
  transform: translateY(-.5px) scale(1.05);
}

/* ======= Filas / Celdas ======= */
.rk-table :deep(tbody tr){
  transition: background-color .16s ease, transform .08s ease, box-shadow .16s ease;
}
.rk-table :deep(tbody tr:nth-child(even)){
  background: color-mix(in oklab, var(--rk-soft) 80%, transparent);
}
.rk-table :deep(tbody tr:hover){
  background: color-mix(in oklab, var(--q-primary) 6%, transparent);
}
.body--dark .rk-table :deep(tbody tr:hover){
  background: color-mix(in oklab, var(--q-primary) 12%, transparent);
}
.rk-table :deep(td){
  vertical-align: middle;
  font-size: 13.2px;
  border-bottom:1px solid color-mix(in oklab, var(--rk-border) 60%, transparent);
}

/* Densidad (agrega rk-compact o rk-spacious al q-table) */
.rk-table.rk-compact :deep(td){ padding-top: 6px; padding-bottom: 6px }
.rk-table.rk-spacious :deep(td){ padding-top: 14px; padding-bottom: 14px }

/* Selección (checkbox y fila seleccionada) */
.rk-table :deep(.q-checkbox__inner){
  filter: drop-shadow(0 1px 3px rgba(0,0,0,.12));
}
.rk-table :deep(.q-tr--selected){
  background: color-mix(in oklab, var(--q-primary) 12%, transparent) !important;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--q-primary) 40%, transparent);
}
.body--dark .rk-table :deep(.q-tr--selected){
  background: color-mix(in oklab, var(--q-primary) 18%, transparent) !important;
}

/* Estado de foco por accesibilidad */
.rk-table :deep(tbody tr:focus-within){
  outline: 2px solid color-mix(in oklab, var(--q-primary) 45%, transparent);
  outline-offset: -2px;
}

/* ======= Celdas “clave” / monospace (opcional) ======= */
.rk-table :deep(.rk-mono){
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
  font-size: 12.5px;
}

/* ======= Chips / Badges internos ======= */
.rk-table :deep(.q-chip){
  background: color-mix(in oklab, var(--rk-soft) 82%, transparent);
  border:1px solid var(--rk-border);
  font-weight:600;
  border-radius: 9px;
}
.rk-table :deep(.q-badge){
  border-radius:10px;
  font-weight:700;
}

/* ======= Empty / Loading ======= */
.rk-table :deep(.q-table__bottom--nodata){
  color: var(--rk-muted);
}
.rk-table :deep(.q-inner-loading){
  backdrop-filter: blur(2px) saturate(1.02);
}

/* ======= Scrollbars sutiles ======= */
.rk-table :deep(.q-table__middle::-webkit-scrollbar){ width: 10px; height: 10px }
.rk-table :deep(.q-table__middle::-webkit-scrollbar-thumb){
  background: linear-gradient(180deg, rgba(127,127,127,.35), rgba(127,127,127,.24));
  border-radius: 999px; border: 2px solid transparent; background-clip: content-box;
}
.rk-table :deep(.q-table__middle:hover::-webkit-scrollbar-thumb){
  background: linear-gradient(180deg, rgba(127,127,127,.5), rgba(127,127,127,.34));
}

/* ======= Acciones (botones en celdas) ======= */
.rk-table :deep(td .q-btn){
  border-radius: 10px;
  transition: transform .08s ease, background-color .12s ease, box-shadow .12s ease;
}
.rk-table :deep(td .q-btn:hover){
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0,0,0,.12);
}
.body--dark .rk-table :deep(td .q-btn:hover){
  box-shadow: 0 6px 16px rgba(0,0,0,.5);
}

/* ======= Mini utilidades ======= */
.rk-table :deep(.rk-ellipsis){
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rk-table :deep(.rk-nowrap){ white-space: nowrap }

/* ======= Variantes de fila semánticas (opcionales) ======= */
/* Añade estas clases a <q-tr> (via slot body) si quieres estados */
.rk-table :deep(.rk-row--ok){ background: color-mix(in oklab, #22c55e 10%, transparent) }
.rk-table :deep(.rk-row--warn){ background: color-mix(in oklab, #f59e0b 12%, transparent) }
.rk-table :deep(.rk-row--err){
  background: color-mix(in oklab, #ef4444 10%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, #ef4444 35%, transparent);
}
</style>

