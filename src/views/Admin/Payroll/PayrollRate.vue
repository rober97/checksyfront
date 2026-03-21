<!-- src/pages/admin/payroll/PayrollRatesPage.vue -->
<template>
  <q-page class="rates-page">
    <!-- Header row -->
    <div class="header-row">
      <div>
        <h5 class="rates-title">Tasas de nómina</h5>
        <p class="rates-subtitle">
          Configura las tasas de AFP, salud y cesantía para el cálculo de liquidaciones.
        </p>
      </div>
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
        <div class="card-accent" :class="row.active ? 'accent-active' : 'accent-inactive'" />

        <div class="card-body">
          <!-- Top row: name + status -->
          <div class="card-top">
            <span class="card-name">{{ hasEntity ? row.entityLabel : row.key }}</span>
            <span class="status-pill" :class="row.active ? 'status-active' : 'status-inactive'">
              <span class="status-dot" />
              {{ row.active ? 'Vigente' : 'Inactivo' }}
            </span>
          </div>

          <!-- Slug -->
          <div v-if="hasEntity" class="card-slug">{{ row.key }}</div>

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
          <!-- Contract type (cesantía only, new) -->
          <div v-if="!hasEntity && !dlg.editingId" class="form-group">
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
]

const contractTypeOptions = [
  { label: 'Indefinido', value: 'indefinido' },
  { label: 'Plazo fijo', value: 'plazo_fijo' },
  { label: 'Obra o faena', value: 'obra_faena' },
]

const currentCategory = computed(() =>
  categories.find(c => c.key === tab.value) || categories[0]
)

const hasEntity = computed(() => tab.value !== 'cesantia')

// ─── Data ────────────────────────────────────────────────────────
const rowsMap = {
  afp: computed(() => store.afpRows),
  health: computed(() => store.healthRows),
  cesantia: computed(() => store.cesantiaRows),
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
onMounted(reloadAll)

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
    validFrom: '',
    validTo: '',
    inputMode: 'PERCENT',
    valueInput: null,
  },
  errors: { validFrom: '', validTo: '', value: '' },
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
    form: { key: '', validFrom: '', validTo: '', inputMode: 'PERCENT', valueInput: null },
    errors: { validFrom: '', validTo: '', value: '' },
  })
}

function openCreate() {
  closeDialog()
  const typeMap = { afp: 'AFP_RATE', health: 'FONASA_RATE', cesantia: 'CESANTIA_RATE' }
  dlg.open = true
  dlg.type = typeMap[tab.value]
  dlg.scope = hasEntity.value ? 'ENTITY' : 'CONTRACT_TYPE'
  dlg.title = `Nueva tasa de ${currentCategory.value.label}`
  dlg.form.validFrom = new Date().toISOString().slice(0, 10)
  dlg.form.inputMode = 'PERCENT'
}

function openEdit(row) {
  closeDialog()
  const typeMap = { afp: 'AFP_RATE', health: 'FONASA_RATE', cesantia: 'CESANTIA_RATE' }
  dlg.open = true
  dlg.type = typeMap[tab.value]
  dlg.scope = row.entityId ? 'ENTITY' : 'CONTRACT_TYPE'
  dlg.entityId = row.entityId || null
  dlg.editingId = row.paramId || null
  dlg.title = `Editar — ${row.entityLabel || row.key}`
  dlg.form.key = row.key
  dlg.form.validFrom = String(row.validFrom || '').slice(0, 10)
  dlg.form.validTo = row.validTo ? String(row.validTo).slice(0, 10) : ''
  dlg.form.inputMode = 'DECIMAL'
  dlg.form.valueInput = row.value
}

function validate() {
  dlg.errors = { validFrom: '', validTo: '', value: '' }
  const vf = toISODateStart(dlg.form.validFrom)
  if (!vf) dlg.errors.validFrom = 'Fecha inválida'
  const vt = dlg.form.validTo ? toISODateStart(dlg.form.validTo) : null
  if (dlg.form.validTo && !vt) dlg.errors.validTo = 'Fecha inválida'
  if (vf && vt && new Date(vt) < new Date(vf)) dlg.errors.validTo = 'Debe ser posterior al inicio'
  const n = Number(dlg.form.valueInput)
  if (!Number.isFinite(n)) dlg.errors.value = 'Ingrese un número válido'
  else if (n < 0) dlg.errors.value = 'No puede ser negativo'
  if (dlg.scope === 'CONTRACT_TYPE' && !dlg.form.key)
    dlg.errors.value = dlg.errors.value || 'Seleccione un tipo'
  return !dlg.errors.validFrom && !dlg.errors.validTo && !dlg.errors.value
}

function normalizeValue() {
  const v = Number(dlg.form.valueInput)
  return dlg.form.inputMode === 'PERCENT' ? v / 100 : v
}

async function submitUpsert() {
  if (!validate()) return
  const payload = {
    companyId: null,
    type: dlg.type,
    scope: dlg.scope,
    key: dlg.form.key,
    entityId: dlg.scope === 'ENTITY' ? dlg.entityId : null,
    value: normalizeValue(),
    validFrom: toISODateStart(dlg.form.validFrom),
    validTo: dlg.form.validTo ? toISODateStart(dlg.form.validTo) : null,
    active: true,
    meta: {},
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
  color: #1c1917;
}

.rates-subtitle {
  color: #78716c;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.btn-new {
  padding: 10px 22px;
  font-weight: 600;
  border-radius: 10px;
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
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  font-size: 13.5px;
  font-weight: 500;
  color: #57534e;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-pill:hover {
  border-color: rgba(0, 0, 0, 0.16);
  background: #fafaf9;
}

.tab-pill.active {
  background: #1c1917;
  color: #fff;
  border-color: #1c1917;
}

.tab-pill.active .tab-count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.tab-count {
  font-size: 11px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.06);
  color: #78716c;
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
  color: #57534e;
}

.summary-chip strong {
  font-weight: 600;
  color: #1c1917;
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
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 14px;
  background: #fff;
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

.card-accent {
  width: 4px;
  flex-shrink: 0;
}

.accent-active {
  background: linear-gradient(180deg, #10b981, #059669);
}

.accent-inactive {
  background: #d6d3d1;
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
  color: #1c1917;
  text-transform: capitalize;
}

.card-slug {
  font-size: 11.5px;
  color: #a8a29e;
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
  color: #a8a29e;
}

.card-rate {
  font-size: 26px;
  font-weight: 700;
  color: #1c1917;
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
  background: #ecfdf5;
  color: #047857;
}

.status-active .status-dot {
  background: #10b981;
}

.status-inactive {
  background: #f5f5f4;
  color: #a8a29e;
}

.status-inactive .status-dot {
  background: #d6d3d1;
}

/* ── Empty state ───────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 64px 20px;
}

.empty-text {
  font-size: 15px;
  color: #a8a29e;
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
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
}

.hero-health {
  background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
}

.hero-cesantia {
  background: linear-gradient(135deg, #713f12 0%, #d97706 100%);
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
  color: #57534e;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
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
  background: #fafaf9;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 14px 16px;
}

.preview-label {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #a8a29e;
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
  color: #a8a29e;
}

.preview-val {
  font-size: 15px;
  font-weight: 600;
  color: #1c1917;
  font-variant-numeric: tabular-nums;
}

.preview-val.highlight {
  color: #2563eb;
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
  color: #78716c;
  margin-bottom: 4px;
}

/* Info callout */
.info-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 12.5px;
  color: #1e40af;
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

/* ── Dark mode ─────────────────────────────────── */
.body--dark .rates-title {
  color: #fafaf9;
}

.body--dark .rates-subtitle {
  color: #a8a29e;
}

.body--dark .tab-pill {
  background: #292524;
  border-color: rgba(255, 255, 255, 0.06);
  color: #d6d3d1;
}

.body--dark .tab-pill:hover {
  background: #3a3633;
}

.body--dark .tab-pill.active {
  background: #fafaf9;
  color: #1c1917;
  border-color: #fafaf9;
}

.body--dark .tab-pill.active .tab-count {
  background: rgba(0, 0, 0, 0.12);
  color: #1c1917;
}

.body--dark .tab-count {
  background: rgba(255, 255, 255, 0.08);
  color: #a8a29e;
}

.body--dark .summary-chip {
  color: #a8a29e;
}

.body--dark .summary-chip strong {
  color: #fafaf9;
}

.body--dark .rate-card {
  background: #292524;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .rate-card:hover {
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.body--dark .card-name,
.body--dark .card-rate {
  color: #fafaf9;
}

.body--dark .status-active {
  background: #064e3b;
  color: #6ee7b7;
}

.body--dark .status-inactive {
  background: #3a3633;
  color: #78716c;
}

.body--dark .live-preview {
  background: #1c1917;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .preview-val {
  color: #fafaf9;
}

.body--dark .preview-val.highlight {
  color: #60a5fa;
}

.body--dark .info-callout {
  background: #1e293b;
  border-color: #1e3a5f;
  color: #93c5fd;
}
</style>