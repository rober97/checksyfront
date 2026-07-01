<!-- src/pages/admin/payroll/PayrollRatesPage.vue -->
<template>
  <q-page class="rates-page">
    <!-- Header row -->
    <div class="header-row">
      <div>
        <h5 class="rates-title">Tasas de nómina</h5>
        <p class="rates-subtitle">
          Configura las tasas de AFP, salud, cesantía y otros descuentos para el cálculo de liquidaciones.
        </p>
        <div v-if="lastSyncLabel" class="last-sync">
          <q-icon name="cloud_done" size="14px" color="positive" />
          Última actualización con Previred: <strong>{{ lastSyncLabel }}</strong>
          <span v-if="lastSync?.period" class="last-sync-period">· período {{ lastSync.period }}</span>
        </div>
        <div v-else class="last-sync muted">
          <q-icon name="cloud_off" size="14px" />
          Aún no se ha sincronizado con Previred
        </div>
      </div>
      <div class="header-actions">
        <q-btn
          outline
          no-caps
          color="primary"
          icon="sync"
          label="Sincronizar con Previred"
          class="btn-sync"
          @click="openPrevired"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Nueva tasa"
          class="btn-new"
          @click="openCreate"
        />
      </div>
    </div>

    <!-- Tabs as pill buttons -->
    <div class="tab-bar">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="tab-pill"
        :class="{ active: tab === cat.key }"
        @click="tab = cat.key"
      >
        <q-icon :name="cat.icon" size="18px" />
        <span>{{ cat.label }}</span>
        <span class="tab-count">{{ getCount(cat.key) }}</span>
      </button>
    </div>

    <!-- Summary strip -->
    <div class="summary-strip">
      <div class="summary-chip">
        <q-icon name="check_circle" size="16px" color="positive" />
        <span><strong>{{ activeCount }}</strong> vigentes</span>
      </div>
      <div class="summary-chip">
        <q-icon name="info" size="16px" color="grey-6" />
        <span>{{ currentCategory.desc }}</span>
      </div>
      <q-space />
      <q-input
        v-model="search"
        dense
        outlined
        placeholder="Buscar por nombre o slug…"
        clearable
        class="search-input"
      >
        <template #prepend>
          <q-icon name="search" size="18px" />
        </template>
      </q-input>
      <q-toggle
        v-model="showInactive"
        dense
        label="Inactivos"
        class="toggle-inactive"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
      <div class="text-grey-6 q-mt-sm">Cargando tasas…</div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredRows.length === 0" class="empty-state">
      <q-icon :name="currentCategory.icon" size="48px" color="grey-4" />
      <div class="empty-text">
        No hay tasas{{ search ? ' que coincidan' : '' }} para {{ currentCategory.label }}
      </div>
      <q-btn outline no-caps color="primary" label="+ Agregar tasa" @click="openCreate" class="q-mt-md" />
    </div>

    <!-- Rate cards grid -->
    <TransitionGroup v-else name="card-list" tag="div" class="rates-grid">
      <div
        v-for="row in filteredRows"
        :key="row.id || row.paramId"
        class="rate-card"
        :class="{ inactive: !row.active }"
        @click="openEdit(row)"
      >
        <!-- Left accent bar -->
        <div class="card-body">
          <!-- Top row: name + status -->
          <div class="card-top">
            <span class="card-name">{{ rowDisplayName(row) }}</span>
            <span class="status-pill" :class="row.active ? 'status-active' : 'status-inactive'">
              <span class="status-dot" />
              {{ row.active ? 'Vigente' : 'Inactivo' }}
            </span>
          </div>

          <!-- Slug -->
          <div v-if="showSecondaryKey(row)" class="card-slug">{{ row.key }}</div>

          <!-- Bottom row: dates + rate -->
          <div class="card-bottom">
            <div class="card-dates">
              <q-icon name="event" size="13px" />
              {{ formatDate(row.validFrom) }} → {{ row.validTo ? formatDate(row.validTo) : 'sin fin' }}
            </div>
            <div class="card-rate">{{ formatPercent(row.value) }}</div>
          </div>
        </div>

        <!-- Actions overlay -->
        <div class="card-actions">
          <q-btn flat dense round icon="edit" size="sm" @click.stop="openEdit(row)">
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
          <q-btn
            v-if="row.active"
            flat dense round icon="block" size="sm" color="negative"
            @click.stop="confirmDeactivate(row)"
          >
            <q-tooltip>Desactivar</q-tooltip>
          </q-btn>
        </div>
      </div>
    </TransitionGroup>

    <!-- ========================= MODAL ========================= -->
    <q-dialog v-model="dlg.open" persistent transition-show="slide-up" transition-hide="slide-down">
      <q-card class="dialog-card">
        <!-- Colored header -->
        <div class="dialog-hero" :class="`hero-${tab}`">
          <div class="hero-icon-wrap">
            <q-icon :name="currentCategory.icon" size="28px" color="white" />
          </div>
          <div class="hero-text">
            <div class="hero-title">{{ dlg.title }}</div>
            <div class="hero-sub">{{ currentCategory.desc }}</div>
          </div>
          <q-btn icon="close" flat round dense color="white" class="hero-close" @click="closeDialog" />
        </div>

        <q-card-section class="dialog-body">
          <!-- Contract type / discount key -->
          <div v-if="showKeyField" class="form-group">
            <label class="form-label">
              <q-icon name="sell" size="14px" />
              Nombre del descuento
            </label>
            <q-input
              v-model.trim="dlg.form.label"
              dense
              outlined
              class="form-input"
              placeholder="Ej: Impuesto a la renta"
              :error="!!dlg.errors.key"
              :error-message="dlg.errors.key"
            />
            <div class="field-hint">
              Se guardará como una clave interna derivada del nombre para que puedas tener varios descuentos configurables.
            </div>
          </div>

          <div v-else-if="showContractTypeField" class="form-group">
            <label class="form-label">
              <q-icon name="description" size="14px" />
              Tipo de contrato
            </label>
            <q-select
              v-model="dlg.form.key"
              :options="contractTypeOptions"
              emit-value
              map-options
              dense
              outlined
              class="form-input"
              :error="!!dlg.errors.key"
              :error-message="dlg.errors.key"
            />
          </div>

          <!-- Value section with live preview -->
          <div class="form-group">
            <label class="form-label">
              <q-icon name="percent" size="14px" />
              Tasa
            </label>
            <div class="value-section">
              <div class="value-input-wrap">
                <q-input
                  v-model.number="dlg.form.valueInput"
                  dense
                  outlined
                  type="number"
                  step="0.01"
                  class="form-input"
                  :placeholder="dlg.form.inputMode === 'PERCENT' ? '11.44' : '0.1144'"
                  :error="!!dlg.errors.value"
                  :error-message="dlg.errors.value"
                />
                <q-btn-toggle
                  v-model="dlg.form.inputMode"
                  no-caps
                  dense
                  rounded
                  unelevated
                  toggle-color="primary"
                  text-color="grey-7"
                  :options="[
                    { label: 'Porcentaje', value: 'PERCENT' },
                    { label: 'Decimal', value: 'DECIMAL' },
                  ]"
                  class="mode-toggle"
                />
              </div>

              <!-- Live preview -->
              <div class="live-preview" v-if="previewValue !== null">
                <div class="preview-label">Vista previa</div>
                <div class="preview-grid">
                  <div class="preview-item">
                    <span class="preview-key">Decimal</span>
                    <span class="preview-val">{{ previewDecimal }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-key">Porcentaje</span>
                    <span class="preview-val">{{ previewPercentStr }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-key">Sobre $1.000.000</span>
                    <span class="preview-val highlight">${{ previewOnMillion }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dates -->
          <div class="form-group">
            <label class="form-label">
              <q-icon name="date_range" size="14px" />
              Vigencia
            </label>
            <div class="dates-row">
              <div class="date-col">
                <div class="date-sublabel">Desde</div>
                <q-input
                  v-model="dlg.form.validFrom"
                  dense outlined type="date"
                  class="form-input"
                  :error="!!dlg.errors.validFrom"
                  :error-message="dlg.errors.validFrom"
                />
              </div>
              <div class="date-arrow">
                <q-icon name="arrow_forward" size="18px" color="grey-5" />
              </div>
              <div class="date-col">
                <div class="date-sublabel">Hasta <span class="text-grey-5">(opcional)</span></div>
                <q-input
                  v-model="dlg.form.validTo"
                  dense outlined type="date"
                  class="form-input"
                  :error="!!dlg.errors.validTo"
                  :error-message="dlg.errors.validTo"
                />
              </div>
            </div>
          </div>

          <!-- Info callout -->
          <div class="info-callout">
            <q-icon name="auto_fix_high" size="18px" />
            <span>
              Si ya existe una tasa vigente que se solapa, el sistema la cerrará
              automáticamente justo antes de esta fecha de inicio.
            </span>
          </div>
        </q-card-section>

        <!-- Footer -->
        <div class="dialog-footer">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="closeDialog" />
          <q-btn
            unelevated no-caps
            color="primary"
            icon="save"
            label="Guardar tasa"
            :loading="dlg.saving"
            class="btn-save"
            @click="submitUpsert"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- ===================== PREVIRED SYNC DIALOG ===================== -->
    <q-dialog v-model="previredDlg.open" persistent transition-show="slide-up" transition-hide="slide-down">
      <q-card class="dialog-card previred-card">
        <div class="dialog-hero hero-previred">
          <div class="hero-icon-wrap">
            <q-icon name="sync" size="28px" color="white" />
          </div>
          <div class="hero-text">
            <div class="hero-title">Sincronizar con Previred</div>
            <div class="hero-sub">
              Indicadores previsionales
              <template v-if="store.previred.snapshot?.period">— {{ store.previred.snapshot.period }}</template>
            </div>
          </div>
          <q-btn icon="close" flat round dense color="white" class="hero-close" @click="previredDlg.open = false" />
        </div>

        <q-card-section class="dialog-body previred-body">
          <!-- Loading -->
          <div v-if="store.previred.loadingPreview" class="text-center q-pa-xl">
            <q-spinner-dots size="40px" color="primary" />
            <div class="text-grey-6 q-mt-sm">Consultando Previred…</div>
          </div>

          <template v-else>
            <!-- Summary + bulk actions -->
            <div class="previred-summary">
              <span class="psum-chip new"><strong>{{ countByStatus('new') }}</strong> nuevos</span>
              <span class="psum-chip changed"><strong>{{ countByStatus('changed') }}</strong> cambian</span>
              <span class="psum-chip same"><strong>{{ countByStatus('unchanged') }}</strong> sin cambios</span>
              <q-space />
              <q-btn flat dense no-caps size="sm" color="primary" label="Solo cambios" @click="selectByStatus(['new','changed'])" />
              <q-btn flat dense no-caps size="sm" color="grey-7" label="Todos" @click="selectByStatus(['new','changed','unchanged'])" />
              <q-btn flat dense no-caps size="sm" color="grey-7" label="Ninguno" @click="clearSelection" />
            </div>

            <!-- Warnings -->
            <div v-if="(store.previred.snapshot?.warnings || []).length" class="previred-warn">
              <q-icon name="warning" size="16px" />
              <span>No se pudieron leer: {{ store.previred.snapshot.warnings.join(', ') }}</span>
            </div>

            <!-- Items -->
            <div v-if="previredItems.length" class="previred-list">
              <div
                v-for="it in previredItems"
                :key="itemId(it)"
                class="pv-row"
                :class="{ off: !isChecked(it) }"
                @click="toggleItem(it)"
              >
                <q-icon
                  :name="isChecked(it) ? 'check_box' : 'check_box_outline_blank'"
                  :color="isChecked(it) ? 'primary' : 'grey-5'"
                  size="22px"
                  class="pv-check"
                />
                <div class="pv-main">
                  <div class="pv-label">
                    {{ it.label || it.key }}
                    <span v-if="it.kind === 'indicator'" class="pv-tag">indicador</span>
                    <span v-else-if="it.consumed === false" class="pv-tag soft">no usado aún</span>
                  </div>
                  <div class="pv-values">
                    <span class="pv-old">{{ fmtCandidateValue(it, it.current) }}</span>
                    <q-icon name="arrow_forward" size="13px" color="grey-5" />
                    <span class="pv-new">{{ fmtCandidateValue(it, it.value) }}</span>
                  </div>
                </div>
                <span class="pv-status" :class="it.status">{{ statusLabel(it.status) }}</span>
              </div>
            </div>
            <div v-else class="text-center text-grey-6 q-pa-lg">Sin indicadores para mostrar.</div>
          </template>
        </q-card-section>

        <div class="dialog-footer previred-footer">
          <div v-if="store.previred.validFrom" class="pv-validfrom">
            <q-icon name="event" size="14px" /> Vigencia desde {{ formatDate(store.previred.validFrom) }}
          </div>
          <q-space />
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="previredDlg.open = false" />
          <q-btn
            unelevated no-caps
            color="primary"
            icon="cloud_upload"
            :label="`Aplicar ${selectedCount} seleccionados`"
            :loading="store.previred.applying"
            :disable="selectedCount === 0 || store.previred.loadingPreview"
            class="btn-save"
            @click="applyPrevired"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { usePayrollRatesStore } from '@/stores/payrollRates'

const $q = useQuasar()
const store = usePayrollRatesStore()

const loading = computed(() => store.loading)
const tab = ref('afp')
const search = ref('')
const showInactive = ref(false)

const categories = [
  { key: 'afp', label: 'AFP', icon: 'account_balance', desc: 'Descuento previsional obligatorio' },
  { key: 'health', label: 'Salud', icon: 'health_and_safety', desc: 'Cotización de salud (Fonasa)' },
  { key: 'cesantia', label: 'Cesantía', icon: 'gavel', desc: 'Seguro de cesantía por contrato' },
  { key: 'other', label: 'Otros descuentos', icon: 'request_quote', desc: 'Descuentos adicionales como impuesto a la renta u otras retenciones' },
]

const contractTypeOptions = [
  { label: 'Indefinido', value: 'indefinido' },
  { label: 'Plazo fijo', value: 'plazo_fijo' },
  { label: 'Obra o faena', value: 'obra_faena' },
]

const currentCategory = computed(() =>
  categories.find(c => c.key === tab.value) || categories[0]
)

const hasEntity = computed(() => ['afp', 'health'].includes(tab.value))
const showContractTypeField = computed(() => dlg.scope === 'CONTRACT_TYPE' && !dlg.editingId)
const showKeyField = computed(() => dlg.scope === 'KEY')

// ─── Data ────────────────────────────────────────────────────────
const rowsMap = {
  afp: computed(() => store.afpRows),
  health: computed(() => store.healthRows),
  cesantia: computed(() => store.cesantiaRows),
  other: computed(() => store.otherDeductionRows),
}

const currentRows = computed(() => rowsMap[tab.value]?.value || [])

const activeCount = computed(() =>
  currentRows.value.filter(r => r.active).length
)

function getCount(key) {
  const rows = rowsMap[key]?.value || []
  return rows.filter(r => r.active).length
}

const filteredRows = computed(() => {
  const s = (search.value || '').trim().toLowerCase()
  return currentRows.value.filter(r => {
    if (!showInactive.value && !r.active) return false
    if (!s) return true
    return (
      (r.entityLabel || '').toLowerCase().includes(s) ||
      (r.metaLabel || '').toLowerCase().includes(s) ||
      (r.key || '').toLowerCase().includes(s)
    )
  })
})

// ─── Helpers ─────────────────────────────────────────────────────
function formatPercent(dec) {
  return (Number(dec) * 100).toFixed(2) + '%'
}

function formatDate(d) {
  if (!d) return '—'
  const str = String(d).slice(0, 10)
  const [y, m, day] = str.split('-')
  return `${day}/${m}/${y}`
}

function rowDisplayName(row) {
  if (row?.entityLabel) return row.entityLabel
  return row?.metaLabel || humanizeKey(row?.key)
}

function showSecondaryKey(row) {
  return !!row?.entityLabel || (!!row?.metaLabel && row.metaLabel !== humanizeKey(row.key))
}

function toISODateStart(str) {
  if (!str) return null
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).toISOString()
}

// ─── Load ────────────────────────────────────────────────────────
async function reloadAll() {
  try {
    await store.loadAll({ companyId: null })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Error cargando tasas' })
  }
}
onMounted(() => {
  reloadAll()
  store.loadPreviredStatus().catch(() => {})
})

// ─── Previred sync ───────────────────────────────────────────────
const previredDlg = reactive({ open: false })
const selected = ref(new Set())

const lastSync = computed(() => store.previred.lastSync)
const lastSyncLabel = computed(() => fmtDateTime(lastSync.value?.createdAt || lastSync.value?.updatedAt))

const previredItems = computed(() => [
  ...(store.previred.params || []),
  ...(store.previred.indicators || []),
])
const selectedCount = computed(() =>
  previredItems.value.filter((it) => selected.value.has(itemId(it))).length
)

function itemId(it) {
  return `${it.kind}:${it.type || ''}:${it.scope || ''}:${it.key || ''}:${it.entitySlug || ''}`
}
function isChecked(it) {
  return selected.value.has(itemId(it))
}
function toggleItem(it) {
  const id = itemId(it)
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}
function selectByStatus(statuses) {
  const s = new Set()
  for (const it of previredItems.value) if (statuses.includes(it.status)) s.add(itemId(it))
  selected.value = s
}
function clearSelection() {
  selected.value = new Set()
}
function countByStatus(status) {
  return previredItems.value.filter((it) => it.status === status).length
}
function statusLabel(status) {
  return status === 'new' ? 'Nuevo' : status === 'changed' ? 'Cambia' : 'Igual'
}

function fmtClp(n) {
  return '$' + Math.round(Number(n)).toLocaleString('es-CL')
}
function fmtCandidateValue(it, v) {
  if (v === null || v === undefined || v === '') return '—'
  if (it.kind === 'indicator') {
    return Number.isInteger(Number(v))
      ? fmtClp(v)
      : '$' + Number(v).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (it.unit === 'rate') return (Number(v) * 100).toFixed(2) + '%'
  return fmtClp(v)
}
function fmtDateTime(d) {
  if (!d) return null
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}

async function openPrevired() {
  previredDlg.open = true
  clearSelection()
  store.previred.params = []
  store.previred.indicators = []
  store.previred.snapshot = null
  try {
    await store.loadPreviredPreview()
    selectByStatus(['new', 'changed'])
  } catch (e) {
    previredDlg.open = false
    $q.notify({
      type: 'negative',
      message: e?.response?.data?.message || e?.message || 'No se pudo conectar con Previred',
    })
  }
}

async function applyPrevired() {
  const items = previredItems.value.filter((it) => selected.value.has(itemId(it)))
  if (!items.length) {
    $q.notify({ type: 'warning', message: 'Selecciona al menos un indicador' })
    return
  }
  try {
    const res = await store.applyPrevired(items)
    const errs = res?.errors?.length || 0
    $q.notify({
      type: errs ? 'warning' : 'positive',
      message: `Se aplicaron ${res.applied} indicadores${errs ? `, ${errs} con error` : ''}`,
    })
    previredDlg.open = false
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: e?.response?.data?.message || e?.message || 'Error aplicando indicadores',
    })
  }
}

// ─── Dialog ──────────────────────────────────────────────────────
const dlg = reactive({
  open: false,
  saving: false,
  title: '',
  type: '',
  scope: '',
  entityId: null,
  editingId: null,
  form: {
    key: '',
    label: '',
    validFrom: '',
    validTo: '',
    inputMode: 'PERCENT',
    valueInput: null,
  },
  errors: { key: '', validFrom: '', validTo: '', value: '' },
})

// Live preview computeds
const previewValue = computed(() => {
  const v = Number(dlg.form.valueInput)
  return Number.isFinite(v) && v >= 0 ? v : null
})

const previewDecimal = computed(() => {
  if (previewValue.value === null) return '—'
  const d = dlg.form.inputMode === 'PERCENT'
    ? previewValue.value / 100
    : previewValue.value
  return d.toFixed(4)
})

const previewPercentStr = computed(() => {
  if (previewValue.value === null) return '—'
  const p = dlg.form.inputMode === 'PERCENT'
    ? previewValue.value
    : previewValue.value * 100
  return p.toFixed(2) + '%'
})

const previewOnMillion = computed(() => {
  if (previewValue.value === null) return '—'
  const d = dlg.form.inputMode === 'PERCENT'
    ? previewValue.value / 100
    : previewValue.value
  return Math.round(d * 1000000).toLocaleString('es-CL')
})

function closeDialog() {
  Object.assign(dlg, {
    open: false, saving: false, title: '', type: '', scope: '',
    entityId: null, editingId: null,
    form: { key: '', label: '', validFrom: '', validTo: '', inputMode: 'PERCENT', valueInput: null },
    errors: { key: '', validFrom: '', validTo: '', value: '' },
  })
}

function openCreate() {
  closeDialog()
  const typeMap = { afp: 'AFP_RATE', health: 'FONASA_RATE', cesantia: 'CESANTIA_RATE', other: 'OTHER_DEDUCTION_RATE' }
  dlg.open = true
  dlg.type = typeMap[tab.value]
  dlg.scope = hasEntity.value ? 'ENTITY' : tab.value === 'cesantia' ? 'CONTRACT_TYPE' : 'KEY'
  dlg.title = `Nueva tasa de ${currentCategory.value.label}`
  dlg.form.validFrom = new Date().toISOString().slice(0, 10)
  dlg.form.inputMode = 'PERCENT'
  if (dlg.scope === 'KEY') dlg.form.label = 'Impuesto a la renta'
}

function openEdit(row) {
  closeDialog()
  const typeMap = { afp: 'AFP_RATE', health: 'FONASA_RATE', cesantia: 'CESANTIA_RATE', other: 'OTHER_DEDUCTION_RATE' }
  dlg.open = true
  dlg.type = typeMap[tab.value]
  dlg.scope = row.entityId ? 'ENTITY' : tab.value === 'cesantia' ? 'CONTRACT_TYPE' : 'KEY'
  dlg.entityId = row.entityId || null
  dlg.editingId = row.paramId || null
  dlg.title = `Editar — ${row.metaLabel || row.entityLabel || row.key}`
  dlg.form.key = row.key
  dlg.form.label = row.metaLabel || humanizeKey(row.key)
  dlg.form.validFrom = String(row.validFrom || '').slice(0, 10)
  dlg.form.validTo = row.validTo ? String(row.validTo).slice(0, 10) : ''
  dlg.form.inputMode = 'DECIMAL'
  dlg.form.valueInput = row.value
}

function validate() {
  dlg.errors = { key: '', validFrom: '', validTo: '', value: '' }
  const vf = toISODateStart(dlg.form.validFrom)
  if (!vf) dlg.errors.validFrom = 'Fecha inválida'
  const vt = dlg.form.validTo ? toISODateStart(dlg.form.validTo) : null
  if (dlg.form.validTo && !vt) dlg.errors.validTo = 'Fecha inválida'
  if (vf && vt && new Date(vt) < new Date(vf)) dlg.errors.validTo = 'Debe ser posterior al inicio'
  const n = Number(dlg.form.valueInput)
  if (!Number.isFinite(n)) dlg.errors.value = 'Ingrese un número válido'
  else if (n < 0) dlg.errors.value = 'No puede ser negativo'
  if (dlg.scope === 'CONTRACT_TYPE' && !dlg.form.key)
    dlg.errors.key = 'Seleccione un tipo'
  if (dlg.scope === 'KEY' && !normalizeCustomKey(dlg.form.label))
    dlg.errors.key = 'Ingresa un nombre para el descuento'
  return !dlg.errors.key && !dlg.errors.validFrom && !dlg.errors.validTo && !dlg.errors.value
}

function normalizeValue() {
  const v = Number(dlg.form.valueInput)
  return dlg.form.inputMode === 'PERCENT' ? v / 100 : v
}

function normalizeCustomKey(label) {
  return String(label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function resolveParamKey() {
  if (dlg.scope !== 'KEY') return dlg.form.key

  const normalized = normalizeCustomKey(dlg.form.label)
  if (
    dlg.type === 'OTHER_DEDUCTION_RATE' &&
    ['iu', 'impuesto_unico', 'impuesto_a_la_renta', 'impuesto_unico_de_segunda_categoria'].includes(normalized)
  ) {
    return 'iu'
  }

  return normalized
}

function humanizeKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

async function submitUpsert() {
  if (!validate()) return
  const customKey = dlg.scope === 'KEY' ? resolveParamKey() : null
  const payload = {
    companyId: null,
    type: dlg.type,
    scope: dlg.scope,
    key: dlg.scope === 'KEY' ? customKey : dlg.form.key,
    entityId: dlg.scope === 'ENTITY' ? dlg.entityId : null,
    value: normalizeValue(),
    validFrom: toISODateStart(dlg.form.validFrom),
    validTo: dlg.form.validTo ? toISODateStart(dlg.form.validTo) : null,
    active: true,
    meta: dlg.scope === 'KEY' ? { label: dlg.form.label?.trim() || humanizeKey(customKey) } : {},
  }
  dlg.saving = true
  try {
    await store.upsert(payload)
    $q.notify({ type: 'positive', message: 'Tasa guardada correctamente' })
    closeDialog()
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Error guardando' })
  } finally {
    dlg.saving = false
  }
}

async function confirmDeactivate(row) {
  $q.dialog({
    title: 'Desactivar tasa',
    message: `¿Seguro que quieres desactivar la tasa de ${row.entityLabel || row.key}?`,
    cancel: { flat: true, noCaps: true },
    ok: { color: 'negative', unelevated: true, noCaps: true, label: 'Desactivar' },
    persistent: true,
  }).onOk(async () => {
    try {
      await store.deactivate(row.paramId)
      $q.notify({ type: 'positive', message: 'Tasa desactivada' })
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || 'Error' })
    }
  })
}
</script>

<style scoped>
/* ── Page ──────────────────────────────────────── */
.rates-page {
  padding: 28px 36px;
  max-width: 100%;
}

/* ── Header ────────────────────────────────────── */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.rates-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
  letter-spacing: -0.4px;
  color: var(--text-primary);
}

.rates-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.btn-new {
  padding: 10px 22px;
  font-weight: 600;
  border-radius: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

.btn-sync {
  padding: 10px 18px;
  font-weight: 600;
  border-radius: 10px;
}

.last-sync {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.last-sync strong {
  color: var(--text-primary);
  font-weight: 600;
}

.last-sync-period {
  color: var(--text-muted);
}

.last-sync.muted {
  color: var(--text-muted);
}

/* ── Pill tabs ─────────────────────────────────── */
.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--card-background);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-pill:hover {
  border-color: var(--border-color);
  background: var(--surface-soft);
}

.tab-pill.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.tab-pill.active .tab-count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.tab-count {
  font-size: 11px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-secondary);
  padding: 1px 7px;
  border-radius: 20px;
  min-width: 20px;
  text-align: center;
}

/* ── Summary strip ─────────────────────────────── */
.summary-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.summary-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.summary-chip strong {
  font-weight: 600;
  color: var(--text-primary);
}

.search-input {
  min-width: 260px;
  max-width: 340px;
}

.toggle-inactive {
  font-size: 13px;
}

/* ── Rate cards grid ───────────────────────────── */
.rates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 10px;
}

.rate-card {
  position: relative;
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--card-background);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.18s ease;
}

.rate-card:hover {
  border-color: rgba(0, 0, 0, 0.16);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.rate-card.inactive {
  opacity: 0.5;
}

.card-body {
  flex: 1;
  padding: 16px 20px;
  min-width: 0;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
}

.card-name {
  font-weight: 600;
  font-size: 15.5px;
  color: var(--text-primary);
  text-transform: capitalize;
}

.card-slug {
  font-size: 11.5px;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  margin-bottom: 8px;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.card-dates {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
}

.card-rate {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.8px;
  font-variant-numeric: tabular-nums;
}

.card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.rate-card:hover .card-actions {
  opacity: 1;
}

/* ── Status pill ───────────────────────────────── */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 20px;
  letter-spacing: 0.2px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-active {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.status-active .status-dot {
  background: var(--color-success);
}

.status-inactive {
  background: var(--surface-soft);
  color: var(--text-muted);
}

.status-inactive .status-dot {
  background: var(--border-color);
}

/* ── Empty state ───────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 64px 20px;
}

.empty-text {
  font-size: 15px;
  color: var(--text-muted);
  margin-top: 12px;
}

/* ═══════════════════════════════════════════════════
   DIALOG — Premium design
   ═══════════════════════════════════════════════════ */
.dialog-card {
  width: 580px;
  max-width: 95vw;
  border-radius: 18px !important;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18) !important;
}

/* Colored hero header */
.dialog-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 26px;
  position: relative;
}

.hero-afp {
  background: linear-gradient(135deg, #067C90 0%, var(--color-primary) 100%);
}

.hero-health {
  background: linear-gradient(135deg, var(--color-accent-dark, #067C90) 0%, var(--color-accent) 100%);
}

.hero-cesantia {
  background: linear-gradient(135deg, #713f12 0%, var(--color-warning) 100%);
}

.hero-other {
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
}

.hero-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-text {
  flex: 1;
  min-width: 0;
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
}

.hero-sub {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.hero-close {
  position: absolute;
  top: 14px;
  right: 14px;
  opacity: 0.7;
}

.hero-close:hover {
  opacity: 1;
}

/* Dialog body */
.dialog-body {
  padding: 24px 26px 16px !important;
}

.form-group {
  margin-bottom: 22px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
}

.field-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.45;
}

/* Value section */
.value-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.value-input-wrap {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.value-input-wrap .form-input {
  flex: 1;
}

.mode-toggle {
  border-radius: 10px;
  flex-shrink: 0;
}

/* Live preview */
.live-preview {
  background: var(--surface-soft);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px 16px;
}

.preview-label {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.preview-grid {
  display: flex;
  gap: 12px;
}

.preview-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-key {
  font-size: 11px;
  color: var(--text-muted);
}

.preview-val {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.preview-val.highlight {
  color: var(--color-primary);
}

/* Dates */
.dates-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.date-col {
  flex: 1;
}

.date-arrow {
  padding-bottom: 12px;
  flex-shrink: 0;
}

.date-sublabel {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

/* Info callout */
.info-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 12.5px;
  color: var(--color-primary-dark);
  line-height: 1.5;
}

/* Dialog footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 26px 22px;
}

.btn-save {
  padding: 10px 24px;
  font-weight: 600;
  border-radius: 10px;
}

/* ── Transitions ───────────────────────────────── */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.25s ease;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.card-list-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

.card-list-move {
  transition: transform 0.25s ease;
}

/* ═══════════════════════════════════════════════════
   PREVIRED SYNC DIALOG
   ═══════════════════════════════════════════════════ */
.previred-card {
  width: 640px;
}

.hero-previred {
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
}

.previred-body {
  padding: 18px 22px 8px !important;
}

.previred-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.psum-chip {
  font-size: 12.5px;
  padding: 3px 11px;
  border-radius: 20px;
  background: var(--surface-soft);
  color: var(--text-secondary);
}

.psum-chip strong {
  font-weight: 700;
  color: var(--text-primary);
}

.psum-chip.new {
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
}

.psum-chip.changed {
  background: #fef3c7;
  color: #92400e;
}

.previred-warn {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  margin-bottom: 12px;
  line-height: 1.4;
}

.previred-list {
  max-height: 48vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 -6px;
  padding: 0 6px;
}

.pv-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.13s ease;
}

.pv-row:hover {
  background: var(--surface-soft);
}

.pv-row.off {
  opacity: 0.55;
}

.pv-check {
  flex-shrink: 0;
}

.pv-main {
  flex: 1;
  min-width: 0;
}

.pv-label {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 7px;
}

.pv-tag {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
}

.pv-tag.soft {
  background: var(--surface-soft);
  color: var(--text-muted);
}

.pv-values {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.pv-old {
  color: var(--text-muted);
}

.pv-new {
  color: var(--text-primary);
  font-weight: 600;
}

.pv-status {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 20px;
  background: var(--surface-soft);
  color: var(--text-muted);
}

.pv-status.new {
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
}

.pv-status.changed {
  background: #fef3c7;
  color: #92400e;
}

.previred-footer {
  align-items: center;
}

.pv-validfrom {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Dark mode ─────────────────────────────────── */
/* Most overrides are now handled automatically by tokens.css.
   Only non-token specifics remain below. */

.body--dark .psum-chip.changed,
.body--dark .pv-status.changed,
.body--dark .previred-warn {
  background: rgba(251, 191, 36, 0.15);
  color: #fcd34d;
}

.body--dark .tab-pill.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.body--dark .tab-pill.active .tab-count {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.body--dark .tab-count {
  background: rgba(255, 255, 255, 0.08);
}

.body--dark .rate-card:hover {
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow: var(--shadow-soft);
}

.body--dark .info-callout {
  color: var(--color-primary);
}
</style>
