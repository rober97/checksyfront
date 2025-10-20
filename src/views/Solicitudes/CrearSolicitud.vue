<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <q-card flat bordered class="rk-card">
      <q-card-section>
        <div class="text-h6" :class="headerTextClass">Crear Nueva Solicitud</div>
        <div class="text-subtitle2 text-grey">Vacaciones, días compensatorios u otros permisos</div>
      </q-card-section>

      <q-separator />

      <q-form ref="formRef" @submit.prevent="enviar" greedy class="q-pa-md">
        <div class="row q-col-gutter-md">

          <!-- Tipo -->
          <div class="col-12 col-md-4">
            <q-select
              v-model="form.tipo"
              :options="tipos"
              label="Tipo de solicitud"
              dense outlined emit-value map-options
              :rules="[v => !!v || 'Campo obligatorio']"
              @update:model-value="onTipoChange"
            >
              <template #prepend><q-icon name="category" /></template>
            </q-select>
          </div>

          <!-- Rango de fechas -->
          <div class="col-12 col-md-8">
            <q-input
              v-model="rangeLabel"
              label="Rango de fechas"
              dense outlined readonly
              :rules="[v => !!form.fechaInicio && !!form.fechaFin || 'Selecciona un rango']"
            >
              <template #prepend><q-icon name="date_range" /></template>
              <q-popup-proxy transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="dateRange"
                  range
                  mask="YYYY-MM-DD"
                  :options="isSelectable"
                  :landscape="$q.screen.gt.sm"
                  today-btn
                  :title="`Selecciona el rango (${diasHabiles} días hábiles)`"
                >
                  <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                    <q-btn flat label="Cerrar" v-close-popup />
                    <q-btn color="primary" label="Aplicar" @click="applyRange" />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-input>
          </div>

          <!-- Medio día -->
          <div class="col-12 col-md-4">
            <q-toggle v-model="form.medioDia" label="Medio día" dense />
          </div>
          <div class="col-12 col-md-4" v-if="form.medioDia">
            <q-select
              v-model="form.medioDiaPeriodo"
              :options="medioDiaOpts"
              label="Periodo"
              dense outlined emit-value map-options
              :rules="[v => !!v || 'Obligatorio']"
            />
          </div>

          <!-- Comentario -->
          <div class="col-12">
            <q-input
              v-model="form.comentario"
              label="Comentario"
              type="textarea"
              autogrow outlined dense
              placeholder="Motivo o detalles adicionales"
              :counter="300"
              :maxlength="300"
            />
          </div>

          <!-- Adjuntos opcionales -->
          <div class="col-12 col-md-6">
            <q-file
              v-model="archivos"
              label="Adjuntar respaldo (opcional)"
              multiple
              dense outlined
              use-chips
              clear-icon="close"
              :max-files="5"
              accept=".pdf,.jpg,.jpeg,.png,.heic"
            >
              <template #prepend><q-icon name="attach_file" /></template>
            </q-file>
          </div>

          <!-- Resumen -->
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-sm">
              <div class="text-subtitle2 q-mb-xs">Resumen</div>
              <div class="rk-row"><span>Tipo</span><span>{{ tipoLabel || '—' }}</span></div>
              <div class="rk-row"><span>Inicio</span><span>{{ form.fechaInicio || '—' }}</span></div>
              <div class="rk-row"><span>Fin</span><span>{{ form.fechaFin || '—' }}</span></div>
              <div class="rk-row"><span>Días hábiles</span><span class="text-weight-medium">{{ diasHabiles || '—' }}</span></div>
              <div class="rk-row" v-if="form.medioDia"><span>Medio día</span><span>{{ form.medioDiaPeriodo === 'am' ? 'AM' : 'PM' }}</span></div>
              <div class="rk-row" v-if="vacacionesAplica">
                <span>Saldo Vacaciones</span>
                <span>
                  <q-badge :color="saldoOk ? 'positive' : 'negative'" outline>
                    {{ saldoVacacionesDispLabel }}
                  </q-badge>
                </span>
              </div>
            </q-card>
          </div>

          <!-- Alertas -->
          <div class="col-12">
            <q-banner v-if="overlapAlert" dense class="bg-orange-1 text-orange-9 q-pa-sm q-my-xs">
              <q-icon name="warning" class="q-mr-sm" /> Tienes solicitudes que se traslapan con este rango.
            </q-banner>
            <q-banner v-if="!rangoValido" dense class="bg-red-1 text-red-9 q-pa-sm q-my-xs">
              <q-icon name="error" class="q-mr-sm" /> La fecha de inicio debe ser anterior o igual a la fecha de fin.
            </q-banner>
          </div>

        </div>

        <!-- Footer acciones -->
        <div class="row items-center justify-between q-mt-md">
          <div class="text-caption text-grey-7">
            Feriados excluidos del conteo: {{ feriadosLabel || 'sin datos' }}
          </div>
          <div class="row items-center q-gutter-sm">
            <q-btn flat color="primary" icon="refresh" label="Limpiar" @click="resetForm" />
            <q-btn
              label="Enviar Solicitud"
              type="submit"
              color="primary"
              icon="send"
              no-caps
              unelevated
              :disable="disableSubmit"
              :loading="sending"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/authStore'
import { useRequestsStore } from '@/stores/requests'   // 👈 tu store de solicitudes
import { useCompaniesStore } from '@/stores/companies'  // para feriados de la empresa (si aplica)

/* Quasar / router */
const $q = useQuasar()
const router = useRouter()

/* Stores */
const auth = useAuthStore()
const requests = useRequestsStore()
const companies = useCompaniesStore()

/* UI / tema */
const pageBgClass = computed(() => $q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-grey-1')
const headerTextClass = computed(() => $q.dark.isActive ? 'text-white' : 'text-primary')

/* Catálogos */
const tipos = [
  { label: 'Vacaciones', value: 'vacaciones' },
  { label: 'Día Compensatorio', value: 'compensatorio' },
  { label: 'Permiso Personal', value: 'permiso' },
  { label: 'Licencia Médica', value: 'licencia' },
]
const medioDiaOpts = [
  { label: 'AM (mañana)', value: 'am' },
  { label: 'PM (tarde)', value: 'pm' }
]

/* Form */
const formRef = ref(null)
const form = ref({
  tipo: '',
  fechaInicio: '',
  fechaFin: '',
  medioDia: false,
  medioDiaPeriodo: 'am',
  comentario: ''
})
const archivos = ref([]) // QFile

/* Calendario / rango */
const dateRange = ref({ from: '', to: '' })
const rangeLabel = computed(() => {
  if (!form.value.fechaInicio || !form.value.fechaFin) return ''
  return `${form.value.fechaInicio} → ${form.value.fechaFin}`
})
function applyRange () {
  form.value.fechaInicio = dateRange.value.from || ''
  form.value.fechaFin = dateRange.value.to || dateRange.value.from || ''
}

/* Feriados de empresa (opcional) */
const feriados = ref([]) // ['2025-01-01', ...] formato YYYY-MM-DD
const feriadosLabel = computed(() => feriados.value?.slice(0, 5).join(', ') + (feriados.value.length > 5 ? '…' : ''))

/* Saldos / validaciones derivadas */
const vacacionesAplica = computed(() => form.value.tipo === 'vacaciones')
const saldoVacaciones = ref(null) // en días. Traído del backend
const saldoVacacionesDispLabel = computed(() => {
  if (saldoVacaciones.value == null) return '—'
  return `${saldoVacaciones.value} día(s)`
})
const saldoOk = computed(() => {
  if (!vacacionesAplica.value || saldoVacaciones.value == null) return true
  return diasHabiles.value <= saldoVacaciones.value
})

/* Reglas calendario */
function isSelectable (dateStr) {
  // Deshabilita fechas antes de hoy y feriados si tu política lo requiere
  // Permite seleccionar feriados si tu política lo permite; aquí solo evitamos fines de semana para el conteo
  // Formato 'YYYY/MM/DD' o 'YYYY-MM-DD' según QDate — usamos mask 'YYYY-MM-DD'
  // Permitimos todo; el conteo de hábiles solo excluye sábados y domingos + feriados
  return true
}

/* Cálculo de días hábiles (excluye sábados, domingos y feriados conocidos) */
const diasHabiles = computed(() => {
  const start = form.value.fechaInicio
  const end = form.value.fechaFin
  if (!start || !end) return 0
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  if (s > e) return 0
  let count = 0
  const fer = new Set(feriados.value || [])
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay() // 0=Dom 6=Sáb
    const iso = d.toISOString().slice(0, 10)
    if (dow === 0 || dow === 6) continue
    if (fer.has(iso)) continue
    count++
  }
  // medio día solo resta 0.5 si el rango es un único día hábil
  if (form.value.medioDia && count === 1) return 0.5
  return count
})

const rangoValido = computed(() => {
  if (!form.value.fechaInicio || !form.value.fechaFin) return true
  return new Date(form.value.fechaInicio) <= new Date(form.value.fechaFin)
})

/* Overlaps: consulta al store si hay solapes con otras solicitudes del usuario */
const overlapAlert = computed(() => {
  if (!form.value.fechaInicio || !form.value.fechaFin) return false
  const list = requests.myRequests || []
  const s = new Date(form.value.fechaInicio)
  const e = new Date(form.value.fechaFin)
  return list.some(r => {
    const rs = new Date(r.startDate)
    const re = new Date(r.endDate || r.startDate)
    return !(re < s || rs > e) // se solapan
  })
})

/* Botón enviar */
const disableSubmit = computed(() => {
  return !form.value.tipo ||
         !form.value.fechaInicio ||
         !form.value.fechaFin ||
         !rangoValido.value ||
         diasHabiles.value <= 0 ||
         (vacacionesAplica.value && !saldoOk.value)
})
const sending = ref(false)

/* Helpers */
const tipoLabel = computed(() => tipos.find(t => t.value === form.value.tipo)?.label || '')

function onTipoChange () {
  // Si cambia a no vacaciones, ignoramos saldo
}

/* Reset */
function resetForm () {
  form.value = { tipo: '', fechaInicio: '', fechaFin: '', medioDia: false, medioDiaPeriodo: 'am', comentario: '' }
  archivos.value = []
  dateRange.value = { from: '', to: '' }
}

/* Envío */
async function enviar () {
  const ok = await formRef.value?.validate()
  if (!ok) { $q.notify({ type: 'negative', message: 'Revisa los campos requeridos.' }); return }
  if (!rangoValido.value) { $q.notify({ type: 'negative', message: 'Rango de fechas inválido.' }); return }

  try {
    sending.value = true

    // Si el backend acepta archivos, usamos FormData; si no, payload JSON
    const hasFiles = (archivos.value && archivos.value.length)
    let payload
    if (hasFiles) {
      payload = new FormData()
      payload.append('type', form.value.tipo)
      payload.append('startDate', form.value.fechaInicio)
      payload.append('endDate', form.value.fechaFin)
      payload.append('halfDay', form.value.medioDia ? 'true' : 'false')
      if (form.value.medioDia) payload.append('halfDayPeriod', form.value.medioDiaPeriodo)
      payload.append('businessDays', String(diasHabiles.value))
      if (form.value.comentario) payload.append('comment', form.value.comentario)
      archivos.value.forEach((f, i) => payload.append('attachments', f, f.name || `archivo_${i}`))
    } else {
      payload = {
        type: form.value.tipo,
        startDate: form.value.fechaInicio,
        endDate: form.value.fechaFin,
        halfDay: !!form.value.medioDia,
        halfDayPeriod: form.value.medioDia ? form.value.medioDiaPeriodo : undefined,
        businessDays: diasHabiles.value,
        comment: form.value.comentario || ''
      }
    }

    // Llamada al store (ajusta el método si tu store usa otro nombre)
    await requests.createRequest(payload)

    $q.notify({ type: 'positive', message: 'Solicitud enviada correctamente' })
    router.push('/solicitudes')
  } catch (e) {
    const msg = requests.error || 'No se pudo enviar la solicitud'
    $q.notify({ type: 'negative', message: msg })
  } finally {
    sending.value = false
  }
}

/* Carga inicial: feriados, saldo y solicitudes previas para overlaps */
onMounted(async () => {
  try {
    // Carga solicitudes del usuario (para detectar solapes)
    if (!requests.myRequests?.length) await requests.fetchMyRequests()
  } catch {}
  try {
    const companyId = auth.user?.company?._id || auth.user?.company || null
    if (companyId && companies.fetchCompanyHolidays) {
      await companies.fetchCompanyHolidays(companyId)
      feriados.value = (companies.holidays || []).map(d => (typeof d === 'string' ? d : d.date)).filter(Boolean)
    } else if (requests.fetchHolidays) {
      await requests.fetchHolidays()
      feriados.value = (requests.holidays || []).map(d => d.date || d).filter(Boolean)
    }
  } catch { feriados.value = [] }
  try {
    if (requests.fetchVacationBalance) {
      const balance = await requests.fetchVacationBalance()
      // asume { daysAvailable: number }
      saldoVacaciones.value = Number(balance?.daysAvailable ?? balance?.diasDisponibles ?? 0)
    }
  } catch { saldoVacaciones.value = null }
})
</script>

<style scoped>
.rk-card { border-radius: 12px; overflow: hidden; }
.rk-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px; }
</style>
