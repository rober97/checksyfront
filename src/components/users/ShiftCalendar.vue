<template>
  <div class="rk-shifts">
    <div class="rk-shifts-header row items-center justify-between q-mb-sm">
      <div class="row items-center">
        <q-icon name="event_available" size="20px" class="q-mr-xs" />
        <div class="text-subtitle2 text-weight-bold">Turnos programados</div>
        <q-badge v-if="items.length" class="q-ml-sm" color="primary">
          {{ items.length }}
        </q-badge>
      </div>
      <q-btn
        v-if="!readonly"
        color="primary"
        icon="add"
        label="Agregar turno"
        :disable="!userId"
        @click="openCreate()"
        dense
        unelevated
        size="sm"
      />
    </div>

    <q-banner
      v-if="!items.length && !loading"
      class="rk-empty bg-grey-2 text-grey-8"
      dense
    >
      <template #avatar><q-icon name="info" /></template>
      No hay turnos programados próximos.
      <span v-if="!readonly">Usa «Agregar turno» para programar uno.</span>
    </q-banner>

    <q-spinner v-if="loading" color="primary" />

    <q-list v-if="items.length" bordered separator class="rk-list rounded-borders">
      <q-item v-for="s in items" :key="s._id" class="rk-item">
        <q-item-section avatar>
          <q-avatar square size="36px" class="rk-date-avatar">
            <div class="rk-date-day">{{ formatDay(s.date) }}</div>
            <div class="rk-date-mon">{{ formatMon(s.date) }}</div>
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ formatFullDate(s.date) }}
          </q-item-label>
          <q-item-label caption class="rk-mono">
            {{ s.start }} – {{ s.end }}
            <span v-if="s.notifyMinutesBefore" class="text-grey-7">
              · aviso {{ s.notifyMinutesBefore }} min antes
            </span>
          </q-item-label>
          <q-item-label v-if="s.notes" caption class="rk-notes">
            {{ s.notes }}
          </q-item-label>
        </q-item-section>

        <q-item-section side v-if="!readonly">
          <div class="row q-gutter-xs">
            <q-btn
              flat dense round size="sm" icon="edit"
              @click="openEdit(s)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              flat dense round size="sm" icon="delete" color="negative"
              @click="confirmDelete(s)"
            >
              <q-tooltip>Cancelar turno</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Diálogo crear/editar -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="rk-shift-dialog">
        <q-card-section class="row items-center">
          <q-icon :name="editing ? 'edit_calendar' : 'add_alarm'" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">
            {{ editing ? 'Editar turno' : 'Programar turno' }}
          </div>
          <q-space />
          <q-btn dense flat round icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-sm">
            <q-input
              v-model="form.date"
              class="col-12"
              label="Fecha"
              dense
              outlined
              readonly
              :rules="[(v) => !!v || 'Requerido']"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.date" mask="YYYY-MM-DD" minimal :options="dateOptions" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input
              v-model="form.start"
              class="col-6"
              label="Hora inicio (HH:mm)"
              dense
              outlined
              :rules="[hhmm]"
              mask="##:##"
            >
              <template #append>
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="form.start" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input
              v-model="form.end"
              class="col-6"
              label="Hora fin (HH:mm)"
              dense
              outlined
              :rules="[hhmm]"
              mask="##:##"
            >
              <template #append>
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="form.end" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-select
              v-model="form.notifyMinutesBefore"
              class="col-6"
              label="Recordar antes (min)"
              dense
              outlined
              :options="notifyOptions"
              emit-value
              map-options
            />

            <q-input
              v-model="form.notes"
              class="col-12"
              label="Notas (opcional)"
              dense
              outlined
              autogrow
              type="textarea"
              :input-style="{ minHeight: '40px' }"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup :disable="saving" />
          <q-btn
            color="primary"
            :label="editing ? 'Guardar cambios' : 'Programar'"
            :loading="saving"
            @click="submit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'

const props = defineProps({
  userId:    { type: String, required: true },
  companyId: { type: String, default: null },
  scheduleId:{ type: String, default: null }, // workScheduleId del empleado (oncall)
  readonly:  { type: Boolean, default: false },
  days:      { type: Number, default: 60 },   // ventana visible en días
})

const emit = defineEmits(['changed'])

const $q = useQuasar()

const items   = ref([])
const loading = ref(false)
const saving  = ref(false)
const dialogOpen = ref(false)
const editing = ref(null)

const notifyOptions = [
  { label: 'Sin aviso', value: 0 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
]

const form = ref({
  date: '',
  start: '09:00',
  end: '17:00',
  notifyMinutesBefore: 10,
  notes: ''
})

const hhmm = (v) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')) || 'Formato HH:mm'

function dateOptions (dateStr) {
  // Bloquea fechas pasadas (hoy en adelante)
  const todayIso = new Date().toISOString().slice(0, 10).replace(/-/g, '/')
  return dateStr >= todayIso
}

function pad (n) { return String(n).padStart(2, '0') }

async function load () {
  if (!props.userId) return
  loading.value = true
  try {
    const { data } = await secureAxios.get('/scheduled-shifts/upcoming', {
      params: { userId: props.userId, days: props.days }
    })
    items.value = Array.isArray(data?.items) ? data.items : []
  } catch (e) {
    items.value = []
  } finally {
    loading.value = false
  }
}

function openCreate () {
  editing.value = null
  const today = new Date()
  form.value = {
    date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    start: '09:00',
    end: '17:00',
    notifyMinutesBefore: 10,
    notes: ''
  }
  dialogOpen.value = true
}

function openEdit (s) {
  editing.value = s
  const d = new Date(s.date)
  form.value = {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    start: s.start,
    end: s.end,
    notifyMinutesBefore: s.notifyMinutesBefore ?? 10,
    notes: s.notes || ''
  }
  dialogOpen.value = true
}

async function submit () {
  if (hhmm(form.value.start) !== true) {
    $q.notify({ type: 'negative', message: 'Hora inicio inválida' }); return
  }
  if (hhmm(form.value.end) !== true) {
    $q.notify({ type: 'negative', message: 'Hora fin inválida' }); return
  }
  if (!form.value.date) {
    $q.notify({ type: 'negative', message: 'Selecciona una fecha' }); return
  }

  const dateIso = String(form.value.date).replace(/\//g, '-')
  const payload = {
    date: dateIso,
    start: form.value.start,
    end: form.value.end,
    notifyMinutesBefore: form.value.notifyMinutesBefore,
    notes: form.value.notes
  }

  saving.value = true
  try {
    if (editing.value) {
      await secureAxios.patch(`/scheduled-shifts/${editing.value._id}`, payload)
      $q.notify({ type: 'positive', message: 'Turno actualizado' })
    } else {
      await secureAxios.post('/scheduled-shifts', {
        ...payload,
        userId: props.userId,
        companyId: props.companyId,
        scheduleId: props.scheduleId,
        source: 'oncall'
      })
      $q.notify({ type: 'positive', message: 'Turno programado' })
    }
    dialogOpen.value = false
    await load()
    emit('changed')
  } catch (e) {
    const msg = e?.response?.data?.message || 'No se pudo guardar el turno'
    $q.notify({ type: 'negative', message: msg })
  } finally {
    saving.value = false
  }
}

function confirmDelete (s) {
  $q.dialog({
    title: 'Cancelar turno',
    message: `¿Eliminar el turno del ${formatFullDate(s.date)} (${s.start}–${s.end})?`,
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: { label: 'Volver' }
  }).onOk(async () => {
    try {
      await secureAxios.delete(`/scheduled-shifts/${s._id}`)
      $q.notify({ type: 'positive', message: 'Turno eliminado' })
      await load()
      emit('changed')
    } catch (e) {
      $q.notify({ type: 'negative', message: 'No se pudo eliminar' })
    }
  })
}

/* ===== formatters ===== */
const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function formatDay (d) {
  const date = new Date(d)
  return pad(date.getUTCDate())
}
function formatMon (d) {
  const date = new Date(d)
  return monthNames[date.getUTCMonth()]
}
function formatFullDate (d) {
  const date = new Date(d)
  const wd = dayNames[date.getUTCDay()]
  return `${wd} ${date.getUTCDate()} ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

watch(() => props.userId, () => load(), { immediate: false })

onMounted(load)

defineExpose({ reload: load })
</script>

<style scoped>
.rk-shifts {
  background: var(--rk-surface, #fff);
  border: 1px solid var(--rk-border, rgba(0, 0, 0, 0.08));
  border-radius: 12px;
  padding: 12px;
}
.rk-empty {
  border-radius: 8px;
}
.rk-list {
  background: transparent;
}
.rk-item {
  align-items: center;
}
.rk-date-avatar {
  background: linear-gradient(180deg, #e6f0ff, #d6e6ff);
  color: #1f4ea0;
  border: 1px solid #cfd9ec;
  flex-direction: column;
  font-family: ui-monospace, Menlo, Consolas, monospace;
}
.rk-date-day {
  font-size: 14px;
  line-height: 1;
  font-weight: 800;
}
.rk-date-mon {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.rk-mono {
  font-family: ui-monospace, Menlo, Consolas, monospace;
}
.rk-notes {
  white-space: pre-wrap;
}
.rk-shift-dialog {
  min-width: 460px;
  max-width: 96vw;
  border-radius: 12px;
}
@media (max-width: 640px) {
  .rk-shift-dialog {
    min-width: calc(100vw - 32px);
  }
}
.body--dark .rk-shifts {
  background: #101318;
  border-color: rgba(255, 255, 255, 0.08);
}
.body--dark .rk-date-avatar {
  background: linear-gradient(180deg, #172034, #12243f);
  color: #8ab6ff;
  border-color: #2a3b56;
}
</style>
