<template>
  <div class="rk-ws" :class="{ 'rk-ws--disabled': disable }">
    <div class="rk-label q-mb-xs">Horario laboral</div>

    <!-- MODOS -->
    <q-option-group
      v-model="mode"
      type="radio"
      :options="modeOpts"
      inline
      class="q-mb-sm rk-modes"
      :disable="disable || !companyId"
    />

    <!-- DEFAULT EMPRESA -->
    <q-banner
      v-if="mode === 'companyDefault'"
      class="rk-section rk-banner row items-center justify-between q-mb-sm"
    >
      <div class="text-caption">
        Usar horario por defecto de
        <b>{{ company?.name || 'la empresa' }}</b>.
        <span v-if="!companyDefaultId" class="text-negative">
          (la empresa no tiene horario por defecto)
        </span>
      </div>

      <q-btn
        v-if="companyDefaultId"
        dense
        flat
        color="primary"
        icon="visibility"
        label="Ver detalle"
        :disable="disable"
        @click="preview(companyDefaultId)"
      />
    </q-banner>

    <!-- ELEGIR PLANTILLA -->
    <div
      v-if="mode === 'pickTemplate'"
      class="row q-col-gutter-sm q-mb-sm"
    >
      <div class="col-12 col-sm-8">
        <q-select
          ref="selRef"
          v-model="selectedId"
          :disable="disable || !companyId"
          label="Seleccionar plantilla"
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
          <template #prepend><q-icon name="schedule" /></template>

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

          <!-- Sin resultados / aún sin escribir -->
          <template #no-option>
            <div class="q-pa-xs column q-gutter-xs">
              <div class="text-caption text-grey-7">
                {{
                  !companyId
                    ? 'Selecciona una empresa para ver horarios.'
                    : hasQuery
                    ? `Sin resultados para «${qDisplay}»`
                    : 'Escribe para buscar horarios…'
                }}
              </div>

              <!-- Crear rápido desde lo escrito -->
              <q-item
                v-if="companyId && (hasQuery || !options.length)"
                clickable
                class="rk-create-item"
                @click.stop="openQuickFromQuery()"
              >
                <q-item-section avatar>
                  <q-avatar square size="24px" class="rk-create-avatar">
                    <q-icon name="add_alarm" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-primary text-weight-bold">
                    Crear «{{ qDisplay || 'Nuevo horario' }}»
                  </q-item-label>
                  <q-item-label caption>
                    Se asignará a la empresa seleccionada
                  </q-item-label>
                </q-item-section>
              </q-item>
            </div>
          </template>
        </q-select>
      </div>

      <div class="col-12 col-sm-4">
        <q-btn
          outline
          class="full-width"
          color="primary"
          icon="visibility"
          label="Vista previa"
          :disable="disable || !selectedId"
          @click="preview(selectedId)"
        />
      </div>
    </div>

    <!-- CREAR RÁPIDO -->
    <q-banner
      v-if="mode === 'createQuick'"
      class="rk-section rk-banner row items-center justify-between q-mb-sm"
    >
      <div class="text-caption">
        Crea una plantilla rápida (L–V 09:00–18:00 con 1h de colación — editable).
      </div>
      <q-btn
        color="primary"
        dense
        icon="add"
        label="Configurar y crear"
        :disable="disable || !companyId"
        @click="openQuick()"
      />
    </q-banner>

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

            <q-toggle
              v-model="quick.saturday"
              label="Trabaja sábado"
              class="col-6"
            />
            <q-toggle
              v-model="quick.sunday"
              label="Trabaja domingo"
              class="col-6"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Crear y asignar"
            :loading="savingQuick"
            :disable="disable || !companyId"
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
    default: () => ({ mode: 'companyDefault', scheduleId: null })
  },
  disable: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'preview', 'created'])

/* ===== util ===== */
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* ===== state v-model ===== */
const state = ref({ ...props.modelValue })
watch(
  () => props.modelValue,
  (v) => {
    if (!isEqual(v, state.value)) state.value = { ...v }
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
  get: () => state.value.mode || 'companyDefault',
  set: (v) => (state.value.mode = v)
})
const selectedId = computed({
  get: () => state.value.scheduleId || null,
  set: (v) => (state.value.scheduleId = v)
})
const companyDefaultId = computed(
  () => props.company?.defaultWorkScheduleId || null
)

/* Opciones de modo (radios) */
const modeOpts = computed(() => [
  {
    label: 'Por defecto empresa',
    value: 'companyDefault',
    disable: props.disable || !props.companyId || !companyDefaultId.value
  },
  {
    label: 'Elegir plantilla',
    value: 'pickTemplate',
    disable: props.disable || !props.companyId
  },
  {
    label: 'Crear horario rápido',
    value: 'createQuick',
    disable: props.disable || !props.companyId
  }
])

/* Si no hay horario por defecto, evitamos dejar al usuario en companyDefault */
watch(
  companyDefaultId,
  (id) => {
    if (!id && props.companyId && mode.value === 'companyDefault') {
      mode.value = 'pickTemplate'
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
      // sin empresa -> reseteamos todo
      mode.value = 'companyDefault'
      selectedId.value = null
      return
    }

    // al cambiar de empresa, olvidamos horario anterior
    selectedId.value = null

    // si esta empresa no tiene default y estamos en companyDefault, empujamos a plantillas
    if (!companyDefaultId.value && mode.value === 'companyDefault') {
      mode.value = 'pickTemplate'
    }
  }
)

/* preview */
function preview (id) {
  if (id) emit('preview', id)
}

/* ===== quick create ===== */
const quickOpen = ref(false)
const savingQuick = ref(false)
const quick = ref({
  name: 'Horario L–V 09–18',
  start: '09:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
  end: '18:00',
  saturday: false,
  sunday: false
})
const hhmm = (v) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')) || 'Formato HH:mm'
const hhmmOpt = (v) => !v || hhmm(v) || 'Formato HH:mm'

function openQuick () {
  quickOpen.value = true
}
function openQuickFromQuery () {
  if (qDisplay.value) quick.value.name = qDisplay.value
  quickOpen.value = true
}

function buildWeekly (q) {
  const seg = (a, b) => (a && b ? [{ start: a, end: b }] : [])
  const col = (a, b) => (a && b ? [{ start: a, end: b }] : [])
  return {
    mon: [...seg(q.start, q.end), ...col(q.lunchStart, q.lunchEnd)],
    tue: [...seg(q.start, q.end), ...col(q.lunchStart, q.lunchEnd)],
    wed: [...seg(q.start, q.end), ...col(q.lunchStart, q.lunchEnd)],
    thu: [...seg(q.start, q.end), ...col(q.lunchStart, q.lunchEnd)],
    fri: [...seg(q.start, q.end), ...col(q.lunchStart, q.lunchEnd)],
    sat: q.saturday ? seg(q.start, q.end) : [],
    sun: q.sunday ? seg(q.start, q.end) : []
  }
}

async function createQuick () {
  if (!props.companyId || props.disable) return

  const baseOk =
    hhmm(quick.value.start) === true && hhmm(quick.value.end) === true
  const lunchOk =
    hhmmOpt(quick.value.lunchStart) === true &&
    hhmmOpt(quick.value.lunchEnd) === true
  if (!baseOk || !lunchOk) return

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
      mode.value = 'pickTemplate'
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
.rk-label {
  font-size: 12px;
  color: var(--rk-muted);
  font-weight: 800;
  letter-spacing: 0.3px;
  text-transform: uppercase;
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
</style>
