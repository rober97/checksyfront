<template>
  <div class="rk-ws" :class="{ 'rk-ws--disabled': disable }">
    <div class="rk-head q-mb-sm">
      <div class="rk-label">Horario laboral</div>
      <div class="rk-help">¿Cómo trabaja este empleado?</div>
    </div>

    <!-- MODOS (cards) -->
    <div class="rk-modes-grid q-mb-md">
      <button
        v-for="m in modeCards"
        :key="m.value"
        type="button"
        class="rk-mode-card"
        :class="{
          'is-active': mode === m.value,
          'is-disabled': m.disabled,
        }"
        :disabled="m.disabled"
        @click="!m.disabled && (mode = m.value)"
      >
        <div class="rk-mode-icon">
          <q-icon :name="m.icon" size="20px" />
        </div>
        <div class="rk-mode-body">
          <div class="rk-mode-title">{{ m.title }}</div>
          <div class="rk-mode-desc">{{ m.desc }}</div>
          <div
            v-if="m.disabled && m.disabledReason"
            class="rk-mode-reason"
          >
            <q-icon name="lock" size="11px" class="q-mr-xs" />
            {{ m.disabledReason }}
          </div>
          <div v-else-if="m.example" class="rk-mode-eg">{{ m.example }}</div>
        </div>
        <q-icon
          v-if="mode === m.value"
          name="check_circle"
          class="rk-mode-check"
          size="18px"
        />
      </button>
    </div>

    <!-- HORARIO FIJO (fusión: elegir plantilla existente o crear una nueva) -->
    <div
      v-if="mode === 'fixed'"
      class="rk-detail q-mb-sm"
    >
      <div class="rk-detail-row q-mb-sm">
        <q-icon name="schedule" class="rk-detail-icon" />
        <div class="rk-detail-text">
          Selecciona un horario ya guardado en la empresa o crea uno nuevo.
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-8">
          <q-select
            ref="selRef"
            v-model="selectedId"
            :disable="disable || !companyId"
            label="Buscar plantilla guardada"
            :options="options"
            option-value="_id"
            option-label="name"
            dense
            outlined
            clearable
            use-input
            emit-value
            map-options
            :loading="loading"
            :input-debounce="200"
            :display-value="displayValue"
            @filter="onFilter"
            @popup-show="onMenuOpen"
            @popup-hide="onMenuHide"
          >
            <template #prepend><q-icon name="search" /></template>

            <template #option="s">
              <q-item v-bind="s.itemProps">
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ s.opt.name }}
                  </q-item-label>
                  <q-item-label caption class="rk-mono">
                    {{ s.opt.type || 'weekly' }} ·
                    {{ s.opt.timezone || 'America/Santiago' }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template #no-option>
              <div class="q-pa-sm">
                <div class="text-caption text-grey-7">
                  {{
                    !companyId
                      ? 'Selecciona una empresa primero.'
                      : hasQuery
                      ? `Sin resultados para «${qDisplay}». Crea uno nuevo →`
                      : 'Aún no hay horarios guardados. Crea uno nuevo →'
                  }}
                </div>
              </div>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-4">
          <q-btn
            outline
            class="full-width"
            color="primary"
            icon="add"
            label="Crear nuevo"
            :disable="disable || !companyId"
            @click="openQuickFromQuery()"
          />
        </div>
      </div>
    </div>

    <!-- TURNOS POR DEMANDA -->
    <div
      v-if="mode === 'oncall'"
      class="rk-detail q-mb-sm"
    >
      <div class="rk-detail-row">
        <q-icon name="event_repeat" class="rk-detail-icon" />
        <div class="rk-detail-text">
          Sin horario semanal fijo. Tras crear al empleado podrás programar
          turnos puntuales (fecha + hora) desde su ficha. Las notificaciones
          móviles se ajustan a cada turno.
        </div>
      </div>

      <div class="rk-oncall-form q-mt-sm">
        <q-input
          v-model="oncall.name"
          label="Nombre del horario (opcional)"
          dense
          outlined
          :placeholder="oncallPlaceholder"
          class="q-mb-sm"
        />

        <div class="rk-field-label q-mb-xs">
          Disponibilidad típica
          <span class="rk-field-hint">— informativo, no obliga turno</span>
        </div>
        <div class="row q-gutter-xs q-mb-sm">
          <q-chip
            v-for="d in dayChips"
            :key="d.value"
            clickable
            :outline="!oncall.defaultDays.includes(d.value)"
            :color="oncall.defaultDays.includes(d.value) ? 'primary' : undefined"
            :text-color="oncall.defaultDays.includes(d.value) ? 'white' : undefined"
            dense
            size="sm"
            @click="toggleOncallDay(d.value)"
          >
            {{ d.label }}
          </q-chip>
        </div>

        <q-toggle
          v-model="oncall.allowAnyDay"
          label="Puede recibir turnos cualquier día"
          dense
        />
      </div>
    </div>

    <!-- DIALOGO CREAR -->
    <q-dialog v-model="quickOpen" persistent>
      <q-card class="rk-dialog">
        <q-card-section class="row items-center">
          <q-icon name="bolt" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">
            Nuevo horario rápido
          </div>
          <q-space />
          <q-btn dense flat round icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-sm">
            <q-input
              v-model="quick.name"
              class="col-12"
              label="Nombre"
              dense
              outlined
            />

            <q-input
              v-model="quick.start"
              class="col-6"
              label="Entrada (HH:mm)"
              dense
              outlined
              :rules="[hhmm]"
            />
            <q-input
              v-model="quick.lunchStart"
              class="col-6"
              label="Inicio colación (HH:mm)"
              dense
              outlined
              :rules="[hhmmOpt]"
            />
            <q-input
              v-model="quick.lunchEnd"
              class="col-6"
              label="Fin colación (HH:mm)"
              dense
              outlined
              :rules="[hhmmOpt]"
            />
            <q-input
              v-model="quick.end"
              class="col-6"
              label="Salida (HH:mm)"
              dense
              outlined
              :rules="[hhmm]"
            />

            <div class="col-12">
              <div class="rk-field-label q-mb-xs">
                Días que trabaja
                <span class="rk-field-hint">— toca para activar o desactivar</span>
              </div>
              <div class="row q-gutter-xs">
                <q-chip
                  v-for="d in dayChips"
                  :key="d.value"
                  clickable
                  :outline="!quick.days.includes(d.value)"
                  :color="quick.days.includes(d.value) ? 'primary' : undefined"
                  :text-color="quick.days.includes(d.value) ? 'white' : undefined"
                  dense
                  @click="toggleQuickDay(d.value)"
                >
                  {{ d.label }}
                </q-chip>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Crear y asignar"
            :loading="savingQuick"
            :disable="disable || !companyId || !quick.days.length"
            @click="createQuick"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import secureAxios from '@/utils/secureRequest'

/* ===== props / emits ===== */
const props = defineProps({
  companyId: { type: String, default: null },
  company: { type: Object, default: null },
  modelValue: {
    type: Object,
    default: () => ({ mode: 'fixed', scheduleId: null })
  },
  disable: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'created'])

/* ===== util ===== */
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* ===== state v-model ===== */
const state = ref({
  ...props.modelValue,
  mode: normalizeIncomingMode(props.modelValue?.mode),
})
watch(
  () => props.modelValue,
  (v) => {
    const incoming = { ...v, mode: normalizeIncomingMode(v?.mode) }
    if (!isEqual(incoming, state.value)) state.value = incoming
  },
  { deep: true }
)
watch(
  state,
  (v) => {
    if (!isEqual(v, props.modelValue)) emit('update:modelValue', { ...v })
  },
  { deep: true }
)

const mode = computed({
  get: () => state.value.mode || 'fixed',
  set: (v) => (state.value.mode = v)
})
const selectedId = computed({
  get: () => state.value.scheduleId || null,
  set: (v) => (state.value.scheduleId = v)
})
const companyDefaultId = computed(
  () => props.company?.defaultWorkScheduleId || null
)

/* Opciones de modo — 2 tarjetas con descripción */
const noCompany = computed(() => !props.companyId)

const modeCards = computed(() => [
  {
    value: 'fixed',
    title: 'Horario fijo',
    desc: 'Elegir una plantilla existente o crear una nueva.',
    example: 'Ej.: «Turno mañana», jornada parcial L–V',
    icon: 'schedule',
    disabled: props.disable || noCompany.value,
    disabledReason: noCompany.value ? 'Selecciona una empresa primero' : '',
  },
  {
    value: 'oncall',
    title: 'Turnos por demanda',
    desc: 'Sin horario fijo. Programa fechas puntuales luego.',
    example: 'Para fines de semana variables o llamados ad-hoc',
    icon: 'event_repeat',
    disabled: props.disable || noCompany.value,
    disabledReason: noCompany.value ? 'Selecciona una empresa primero' : '',
  },
])

/**
 * Compatibilidad con valores antiguos del v-model.
 * Cualquier modo distinto de 'oncall' se mapea a 'fixed' (incluido 'companyDefault',
 * 'pickTemplate' y 'createQuick' de versiones previas).
 */
function normalizeIncomingMode (m) {
  return m === 'oncall' ? 'oncall' : 'fixed'
}

/* ===== oncall config (sin horario fijo) ===== */
const dayChips = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' }
]
const oncall = computed({
  get: () => state.value.oncall || { name: '', defaultDays: [], allowAnyDay: true },
  set: (v) => { state.value.oncall = v }
})
const oncallPlaceholder = computed(
  () => `Turnos por demanda · ${props.company?.name || 'empleado'}`
)
function toggleOncallDay (v) {
  const cur = Array.isArray(oncall.value.defaultDays)
    ? oncall.value.defaultDays.slice()
    : []
  const i = cur.indexOf(v)
  if (i >= 0) cur.splice(i, 1)
  else cur.push(v)
  cur.sort((a, b) => a - b)
  state.value.oncall = { ...(state.value.oncall || {}), defaultDays: cur }
}

/* Cuando entramos a 'oncall', limpiamos scheduleId y aseguramos config base */
watch(mode, (m) => {
  if (m === 'oncall') {
    selectedId.value = null
    if (!state.value.oncall) {
      state.value.oncall = { name: '', defaultDays: [], allowAnyDay: true }
    }
  }
})

/* Auto-seleccionar la plantilla por defecto de la empresa cuando estamos en
 * modo 'fixed' y aún no hay un scheduleId elegido: si la empresa tiene un
 * horario por defecto, se aplica sin que el usuario abra el selector. */
watch(
  [companyDefaultId, () => mode.value, () => props.companyId],
  ([defaultId, m]) => {
    if (m === 'fixed' && defaultId && !selectedId.value) {
      selectedId.value = defaultId
    }
  },
  { immediate: true }
)

/* ===== select + búsqueda ===== */
const selRef = ref(null)
const options = ref([])
const loading = ref(false)
const query = ref('')
const menuOpen = ref(false)

const hasQuery = computed(() => (query.value || '').trim().length > 0)
const qDisplay = computed(() => (query.value || '').trim())

// Cache por texto y por id (para display value consistente)
const cacheByKey = new Map() // key: `${companyId}::${q}` -> [items]
const cacheById = new Map() // key: scheduleId -> item

// Texto que se muestra cuando NO estás filtrando ni con menú abierto
const selectedLabel = computed(() => {
  const id = selectedId.value
  if (!id) return ''
  const fromList = (options.value || []).find((x) => x?._id === id)
  if (fromList) {
    cacheById.set(id, fromList)
    return fromList.name || ''
  }
  const fromCache = cacheById.get(id)
  return fromCache?.name || ''
})
const displayValue = computed(() =>
  menuOpen.value || hasQuery.value ? null : selectedLabel.value || null
)

function onMenuOpen () {
  menuOpen.value = true
}
function onMenuHide () {
  menuOpen.value = false
  query.value = '' // limpiamos para que 'displayValue' vuelva a aplicarse
}

/* QSelect @filter: (val, update, abort) */
const lastKey = ref('')
let controller = null
async function onFilter (val, update, abort) {
  if (!props.companyId) {
    abort()
    return
  }
  const q = String(val || '').trim()
  query.value = q

  const key = `${props.companyId}::${q}`
  if (cacheByKey.has(key)) {
    const list = cacheByKey.get(key)
    update(() => {
      options.value = list
    })
    return
  }

  if (controller) controller.abort()
  controller = new AbortController()
  lastKey.value = key
  loading.value = true

  try {
    const { data } = await secureAxios.get('/work-schedule', {
      params: { companyId: props.companyId, q, limit: 12, active: true },
      signal: controller.signal
    })
    if (lastKey.value !== key) return
    const list = Array.isArray(data?.items) ? data.items : []
    list.forEach((it) => {
      if (it?._id) cacheById.set(it._id, it)
    })
    cacheByKey.set(key, list)
    update(() => {
      options.value = list
    })
  } catch (e) {
    update(() => {
      options.value = []
    })
  } finally {
    if (lastKey.value === key) {
      loading.value = false
      controller = null
    }
  }
}

// reset al cambiar empresa
watch(
  () => props.companyId,
  (newId) => {
    options.value = []
    query.value = ''
    if (controller) controller.abort()

    if (!newId) {
      mode.value = 'fixed'
      selectedId.value = null
      return
    }

    // al cambiar de empresa, olvidamos horario anterior; el watcher de
    // auto-select del default lo repondrá si la nueva empresa tiene uno.
    selectedId.value = null
  }
)

/* ===== quick create ===== */
const quickOpen = ref(false)
const savingQuick = ref(false)
const quick = ref({
  name: 'Horario L–V 09–18',
  start: '09:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
  end: '18:00',
  days: [1, 2, 3, 4, 5], // 1=Lun ... 7=Dom
})
const hhmm = (v) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')) || 'Formato HH:mm'
const hhmmOpt = (v) => !v || hhmm(v) || 'Formato HH:mm'

function toggleQuickDay (v) {
  const cur = Array.isArray(quick.value.days) ? quick.value.days.slice() : []
  const i = cur.indexOf(v)
  if (i >= 0) cur.splice(i, 1)
  else cur.push(v)
  cur.sort((a, b) => a - b)
  quick.value = { ...quick.value, days: cur }
}

function openQuick () {
  quickOpen.value = true
}
function openQuickFromQuery () {
  if (qDisplay.value) quick.value.name = qDisplay.value
  quickOpen.value = true
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function buildWeekly (q) {
  const seg = (a, b) => (a && b ? [{ start: a, end: b }] : [])
  const col = (a, b) => (a && b ? [{ start: a, end: b }] : [])
  const daySegs = [...seg(q.start, q.end), ...col(q.lunchStart, q.lunchEnd)]
  const days = Array.isArray(q.days) ? q.days : []
  const out = {}
  DAY_KEYS.forEach((key, idx) => {
    out[key] = days.includes(idx + 1) ? daySegs : []
  })
  return out
}

async function createQuick () {
  if (!props.companyId || props.disable) return

  const baseOk =
    hhmm(quick.value.start) === true && hhmm(quick.value.end) === true
  const lunchOk =
    hhmmOpt(quick.value.lunchStart) === true &&
    hhmmOpt(quick.value.lunchEnd) === true
  const daysOk = Array.isArray(quick.value.days) && quick.value.days.length > 0
  if (!baseOk || !lunchOk || !daysOk) return

  savingQuick.value = true
  try {
    const payload = {
      companyId: props.companyId,
      name: String(quick.value.name || 'Horario nuevo').trim(),
      type: 'weekly',
      weekly: buildWeekly(quick.value)
    }
    const { data } = await secureAxios.post('/work-schedule', payload)
    const item = data?.item || data?.schedule || data
    if (item?._id) {
      mode.value = 'fixed'
      selectedId.value = item._id

      // Asegura que el nombre del seleccionado esté disponible para display-value
      cacheById.set(item._id, item)

      // insertar/actualizar lista y cache de búsqueda actual
      const key = `${props.companyId}::${qDisplay.value}`
      const list = (options.value || []).slice()
      const idx = list.findIndex((x) => x._id === item._id)
      if (idx >= 0) list.splice(idx, 1, item)
      else list.unshift(item)
      options.value = list
      cacheByKey.set(key, list)

      emit('created', item)
      quickOpen.value = false
    }
  } finally {
    savingQuick.value = false
  }
}
</script>

<style scoped>
/* ========= Layout ========= */
.rk-ws {
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  padding: 12px;
}
.rk-ws--disabled {
  opacity: 0.6;
}
.rk-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.rk-label {
  font-size: 12px;
  color: var(--rk-muted);
  font-weight: 800;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.rk-help {
  font-size: 12px;
  color: var(--rk-muted);
}

/* ===== Modes grid ===== */
.rk-modes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 700px) {
  .rk-modes-grid {
    grid-template-columns: 1fr;
  }
}

.rk-mode-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 10px;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.12s ease, box-shadow 0.12s ease,
    background 0.12s ease, transform 0.08s ease;
}
.rk-mode-card:hover:not(.is-disabled) {
  border-color: rgba(99, 102, 241, 0.45);
  background: var(--rk-soft);
  transform: translateY(-1px);
}
.rk-mode-card.is-active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.08);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.rk-mode-card.is-disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.rk-mode-icon {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}
.rk-mode-card.is-active .rk-mode-icon {
  background: #6366f1;
  color: white;
}

.rk-mode-body {
  flex: 1 1 auto;
  min-width: 0;
}
.rk-mode-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--q-primary, #1f2937);
  line-height: 1.2;
}
.rk-mode-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--rk-muted);
  line-height: 1.35;
}
.rk-mode-eg {
  margin-top: 4px;
  font-size: 11px;
  color: #6366f1;
  font-style: italic;
  line-height: 1.2;
}
.rk-mode-reason {
  margin-top: 4px;
  font-size: 11px;
  color: #b45309;
  line-height: 1.2;
  display: flex;
  align-items: center;
}
.body--dark .rk-mode-reason {
  color: #fbbf24;
}

.rk-mode-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #6366f1;
}

/* ===== Detail box (debajo de las cards) ===== */
.rk-detail {
  background: var(--rk-soft);
  border: 1px solid var(--rk-border);
  border-radius: 10px;
  padding: 10px 12px;
}
.rk-detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rk-detail-icon {
  flex: 0 0 auto;
  color: #6366f1;
  font-size: 22px;
}
.rk-detail-text {
  flex: 1 1 auto;
  font-size: 13px;
  line-height: 1.4;
  color: var(--q-primary, #1f2937);
}
.rk-oncall-form {
  border-top: 1px dashed var(--rk-border);
  padding-top: 10px;
}
.rk-field-label {
  font-size: 12px;
  color: var(--rk-muted);
  font-weight: 600;
}
.rk-field-hint {
  font-weight: 400;
  color: var(--rk-muted);
}

.rk-section {
  background: var(--rk-soft);
  border: 1px solid var(--rk-border);
  border-radius: 10px;
  padding: 8px 10px;
}
.rk-banner {
  min-height: 44px;
}

/* Opción "crear" en el menú */
.rk-create-item {
  border: 1px solid #c9defa;
  border-radius: 10px;
  background: #eaf3ff;
  transition: transform 0.08s ease, box-shadow 0.12s ease, background 0.12s ease;
}
.rk-create-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.18);
  background: #e2eeff;
}
.rk-create-avatar {
  background: #d6e8ff;
  color: #1976d2;
}
.rk-mono {
  font-family: ui-monospace, Menlo, Consolas, monospace;
}

/* Diálogo */
.rk-dialog {
  min-width: 560px;
  max-width: 96vw;
  border-radius: 12px;
}
@media (max-width: 640px) {
  .rk-dialog {
    min-width: calc(100vw - 32px);
  }
}

/* Tokens */
:root {
  --rk-border: rgba(0, 0, 0, 0.08);
  --rk-surface: #fff;
  --rk-soft: #f5f7fb;
  --rk-muted: #667085;
}
.body--dark {
  --rk-border: rgba(255, 255, 255, 0.08);
  --rk-surface: #101318;
  --rk-soft: #0f1216;
  --rk-muted: #9aa3b2;
}
.body--dark .rk-create-item {
  border-color: #2a3b56;
  background: #172034;
}
.body--dark .rk-create-item:hover {
  background: #1b2740;
}
.body--dark .rk-create-avatar {
  background: #12243f;
  color: #8ab6ff;
}
.body--dark .rk-mode-card {
  background: #101318;
}
.body--dark .rk-mode-card:hover:not(.is-disabled) {
  background: #161b24;
}
.body--dark .rk-mode-card.is-active {
  background: rgba(99, 102, 241, 0.18);
}
.body--dark .rk-mode-title,
.body--dark .rk-detail-text {
  color: #e5e7eb;
}
</style>
