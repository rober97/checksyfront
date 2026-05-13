<template>
  <div class="rk-ws" :class="{ 'rk-ws--disabled': disable }">
    <!-- MODOS -->
    <div class="rk-modes-grid">
      <button
        v-for="m in modeCards"
        :key="m.value"
        type="button"
        class="rk-mode-card"
        :class="{ 'is-active': mode === m.value, 'is-disabled': m.disabled }"
        :disabled="m.disabled"
        @click="!m.disabled && (mode = m.value)"
      >
        <div class="rk-mode-icon">
          <q-icon :name="m.icon" size="20px" />
        </div>
        <div class="rk-mode-body">
          <div class="rk-mode-title">{{ m.title }}</div>
          <div class="rk-mode-desc">{{ m.desc }}</div>
          <div v-if="m.disabled && m.disabledReason" class="rk-mode-reason">
            <q-icon name="lock" size="11px" class="q-mr-xs" />
            {{ m.disabledReason }}
          </div>
        </div>
        <q-icon
          v-if="mode === m.value"
          name="check_circle"
          class="rk-mode-check"
          size="18px"
        />
      </button>
    </div>

    <!-- HORARIO FIJO -->
    <div v-if="mode === 'fixed'" class="rk-detail">
      <q-select
        ref="selRef"
        v-model="selectedId"
        :disable="disable || !companyId"
        label="Plantilla guardada"
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
              <q-item-label class="text-weight-medium">{{ s.opt.name }}</q-item-label>
              <q-item-label caption class="rk-mono">
                {{ s.opt.type || 'weekly' }} · {{ s.opt.timezone || 'America/Santiago' }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>

        <template #no-option>
          <div class="q-pa-sm text-caption text-grey-7">
            {{ !companyId ? 'Selecciona una empresa primero.' : 'Sin resultados.' }}
          </div>
        </template>
      </q-select>

      <div class="rk-helper">
        ¿Necesitas otra plantilla? Créala en la pestaña <strong>Plantillas</strong>.
      </div>
    </div>

    <!-- TURNOS POR DEMANDA -->
    <div v-if="mode === 'oncall'" class="rk-detail rk-detail--oncall">
      <q-icon name="event_repeat" class="rk-detail-icon" />
      <div class="rk-detail-text">
        Sin plantilla fija. El día a día se programa en
        <strong>Programación mensual</strong> y los turnos llegan a la app del empleado.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import secureAxios from '@/utils/secureRequest'

const props = defineProps({
  companyId: { type: String, default: null },
  company: { type: Object, default: null },
  modelValue: {
    type: Object,
    default: () => ({ mode: 'fixed', scheduleId: null }),
  },
  disable: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function normalizeIncomingMode(m) {
  return m === 'oncall' ? 'oncall' : 'fixed'
}

/* v-model bridge */
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
  { deep: true },
)
watch(
  state,
  (v) => {
    if (!isEqual(v, props.modelValue)) emit('update:modelValue', { ...v })
  },
  { deep: true },
)

const mode = computed({
  get: () => state.value.mode || 'fixed',
  set: (v) => (state.value.mode = v),
})
const selectedId = computed({
  get: () => state.value.scheduleId || null,
  set: (v) => (state.value.scheduleId = v),
})
const companyDefaultId = computed(() => props.company?.defaultWorkScheduleId || null)

const noCompany = computed(() => !props.companyId)
const modeCards = computed(() => [
  {
    value: 'fixed',
    title: 'Horario fijo',
    desc: 'Usa una plantilla guardada de la empresa.',
    icon: 'schedule',
    disabled: props.disable || noCompany.value,
    disabledReason: noCompany.value ? 'Selecciona una empresa primero' : '',
  },
  {
    value: 'oncall',
    title: 'Turnos por demanda',
    desc: 'Sin plantilla. Programación día a día.',
    icon: 'event_repeat',
    disabled: props.disable || noCompany.value,
    disabledReason: noCompany.value ? 'Selecciona una empresa primero' : '',
  },
])

/* Al cambiar a 'oncall', limpiamos el scheduleId. */
watch(mode, (m) => {
  if (m === 'oncall') selectedId.value = null
})

/* Si la empresa tiene plantilla por defecto y aún no hay selección, aplicarla. */
watch(
  [companyDefaultId, () => mode.value, () => props.companyId],
  ([defaultId, m]) => {
    if (m === 'fixed' && defaultId && !selectedId.value) {
      selectedId.value = defaultId
    }
  },
  { immediate: true },
)

/* ===== select + búsqueda ===== */
const selRef = ref(null)
const options = ref([])
const loading = ref(false)
const query = ref('')
const menuOpen = ref(false)

const cacheByKey = new Map() // `${companyId}::${q}` -> items
const cacheById = new Map() // scheduleId -> item

const selectedLabel = computed(() => {
  const id = selectedId.value
  if (!id) return ''
  const fromList = (options.value || []).find((x) => x?._id === id)
  if (fromList) {
    cacheById.set(id, fromList)
    return fromList.name || ''
  }
  return cacheById.get(id)?.name || ''
})
const hasQuery = computed(() => (query.value || '').trim().length > 0)
const displayValue = computed(() =>
  menuOpen.value || hasQuery.value ? null : selectedLabel.value || null,
)

function onMenuOpen() {
  menuOpen.value = true
}
function onMenuHide() {
  menuOpen.value = false
  query.value = ''
}

const lastKey = ref('')
let controller = null
async function onFilter(val, update, abort) {
  if (!props.companyId) {
    abort()
    return
  }
  const q = String(val || '').trim()
  query.value = q

  const key = `${props.companyId}::${q}`
  if (cacheByKey.has(key)) {
    const list = cacheByKey.get(key)
    update(() => { options.value = list })
    return
  }

  if (controller) controller.abort()
  controller = new AbortController()
  lastKey.value = key
  loading.value = true

  try {
    const { data } = await secureAxios.get('/work-schedule', {
      params: { companyId: props.companyId, q, limit: 12, active: true },
      signal: controller.signal,
    })
    if (lastKey.value !== key) return
    const list = Array.isArray(data?.items) ? data.items : []
    list.forEach((it) => { if (it?._id) cacheById.set(it._id, it) })
    cacheByKey.set(key, list)
    update(() => { options.value = list })
  } catch {
    update(() => { options.value = [] })
  } finally {
    if (lastKey.value === key) {
      loading.value = false
      controller = null
    }
  }
}

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
    selectedId.value = null
  },
)
</script>

<style scoped>
.rk-ws {
  --rk-border: rgba(15, 17, 23, 0.10);
  --rk-surface: #ffffff;
  --rk-muted: #5a6482;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  padding: 14px;
}
.rk-ws--disabled { opacity: 0.6; pointer-events: none; }

/* Mode cards */
.rk-modes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}
@media (max-width: 540px) {
  .rk-modes-grid { grid-template-columns: 1fr; }
}
.rk-mode-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--rk-border);
  background: var(--rk-surface);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
}
.rk-mode-card:hover:not(.is-disabled) { border-color: rgba(6, 182, 212, 0.4); }
.rk-mode-card.is-active {
  border-color: var(--q-primary, #06b6d4);
  background: rgba(6, 182, 212, 0.06);
}
.rk-mode-card.is-disabled { cursor: not-allowed; opacity: 0.7; }
.rk-mode-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.1);
  color: var(--q-primary, #06b6d4);
  flex-shrink: 0;
}
.rk-mode-body { flex: 1; min-width: 0; }
.rk-mode-title { font-weight: 600; font-size: 13px; }
.rk-mode-desc { font-size: 11px; color: var(--rk-muted); margin-top: 2px; }
.rk-mode-reason {
  font-size: 11px; color: #d97706; margin-top: 4px;
  display: inline-flex; align-items: center;
}
.rk-mode-check {
  position: absolute; top: 8px; right: 8px;
  color: var(--q-primary, #06b6d4);
}

/* Detail blocks */
.rk-detail { display: flex; flex-direction: column; gap: 8px; }
.rk-detail--oncall {
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(6, 182, 212, 0.06);
  border: 1px solid rgba(6, 182, 212, 0.18);
}
.rk-detail-icon { color: var(--q-primary, #06b6d4); margin-top: 2px; }
.rk-detail-text { font-size: 13px; color: var(--rk-muted); line-height: 1.4; }
.rk-helper { font-size: 11px; color: var(--rk-muted); }
.rk-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

/* Dark mode */
.body--dark .rk-ws {
  --rk-border: rgba(255, 255, 255, 0.08);
  --rk-surface: #101318;
  --rk-muted: #9aa3b2;
}
.body--dark .rk-mode-card.is-active { background: rgba(6, 182, 212, 0.16); }
.body--dark .rk-detail--oncall {
  background: rgba(6, 182, 212, 0.10);
  border-color: rgba(6, 182, 212, 0.25);
}
</style>
