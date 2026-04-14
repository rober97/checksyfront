<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" persistent>
    <q-card style="min-width:520px;max-width:680px">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="edit_note" class="q-mr-sm text-warning" />
          Modificar marcación
        </div>
        <div class="text-caption text-grey-7">
          Esta acción queda registrada en la bitácora inmutable (Res. Ex. 38/2024).
          El trabajador será notificado en su correo personal y dispondrá de
          <b>48 horas</b> para objetar la modificación.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="attendance">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div class="text-caption text-grey-7">Registro actual</div>
            <div>
              <b>{{ tipoLabel(attendance.tipo) }}</b> ·
              {{ fmt(attendance.serverTimestamp || attendance.timestamp) }}
            </div>
            <div class="text-caption text-grey-7 hash-mini">Hash: {{ attendance.hash }}</div>
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="form.tipo"
              :options="tipoOptions"
              label="Tipo"
              outlined dense emit-value map-options
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.timestamp"
              type="datetime-local"
              label="Nueva fecha/hora"
              outlined dense
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="form.note"
              label="Comentario (opcional)"
              outlined dense autogrow
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="form.reason"
              label="Razón de la modificación *"
              outlined autogrow
              :rules="[val => (val && val.length >= 5) || 'Mínimo 5 caracteres']"
              placeholder="Ej: Error en hora de entrada reportado por el trabajador."
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn
          unelevated color="warning" label="Guardar modificación"
          icon="save"
          :loading="saving"
          :disable="!canSubmit"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDtStore } from '@/stores/dtStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  attendance: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'updated'])

const dt = useDtStore()
const $q = useQuasar()
const saving = ref(false)

const tipoOptions = [
  { label: 'Entrada', value: 'entrada' },
  { label: 'Salida', value: 'salida' },
  { label: 'Inicio de colación', value: 'colacion_inicio' },
  { label: 'Fin de colación', value: 'colacion_fin' },
  { label: 'Inicio horas extras', value: 'he_inicio' },
  { label: 'Fin horas extras', value: 'he_fin' },
]

const form = reactive({
  tipo: '',
  timestamp: '',
  note: '',
  reason: '',
})

const canSubmit = computed(
  () => form.reason && form.reason.length >= 5 && (form.tipo || form.timestamp || form.note)
)

const TIPOS = {
  entrada: 'Entrada',
  salida: 'Salida',
  colacion_inicio: 'Inicio de colación',
  colacion_fin: 'Fin de colación',
  he_inicio: 'Inicio HE',
  he_fin: 'Fin HE',
}
function tipoLabel(t) { return TIPOS[t] || t }
function fmt(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' })
}
function toLocalInput(d) {
  if (!d) return ''
  const dt = new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

watch(
  () => props.attendance,
  (a) => {
    if (!a) return
    form.tipo = a.tipo || ''
    form.timestamp = toLocalInput(a.serverTimestamp || a.timestamp)
    form.note = a.note || ''
    form.reason = ''
  },
  { immediate: true }
)

async function submit() {
  if (!canSubmit.value || !props.attendance) return
  saving.value = true
  try {
    const payload = { reason: form.reason }
    if (form.tipo && form.tipo !== props.attendance.tipo) payload.tipo = form.tipo
    if (form.note !== (props.attendance.note || '')) payload.note = form.note
    if (form.timestamp) {
      payload.timestamp = new Date(form.timestamp).toISOString()
    }
    const res = await dt.modifyAttendance(props.attendance._id, payload)
    $q.notify({
      type: 'positive',
      message: 'Modificación registrada. Se notificó al trabajador.',
      timeout: 3000,
    })
    emit('updated', res.asistencia || res)
    emit('update:modelValue', false)
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err?.response?.data?.message || 'Error guardando la modificación',
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.hash-mini {
  font-family: monospace;
  font-size: 10px;
  word-break: break-all;
  margin-top: 4px;
}
</style>
