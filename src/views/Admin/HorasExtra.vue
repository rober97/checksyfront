<!-- src/views/Admin/HorasExtra.vue
     Autorización PREVIA de horas extraordinarias (Art. 30-32 CT / Res. Ex. 38).
     El empleador (jefatura o representante) otorga la HE a un trabajador para un
     día, con tope de minutos (≤120) y motivo. El backend valida la autoridad de
     cuatro ojos, evita duplicados y notifica al trabajador. -->
<template>
  <q-page class="q-pa-lg" :class="{ 'is-dark': $q.dark.isActive }">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold">Horas extraordinarias</div>
        <div class="text-grey-7">Otorga o aprueba las horas extra de tus trabajadores (máx. 2 h/día)</div>
      </div>
      <q-btn flat round icon="refresh" :loading="loading" @click="reload">
        <q-tooltip>Recargar</q-tooltip>
      </q-btn>
    </div>

    <q-banner rounded class="bg-blue-1 text-blue-9 q-mb-md">
      <template #avatar><q-icon name="gavel" color="primary" /></template>
      La autorización es un acto del empleador y queda registrada en la bitácora. Sólo la
      jefatura del trabajador o el representante del empleador pueden otorgarla, y
      <b>nadie puede autorizarse horas extra a sí mismo</b> (cuatro ojos): siempre debe
      resolverlas otra persona.
    </q-banner>

    <!-- Solicitudes de HE pendientes (las pide el trabajador desde la app) -->
    <q-card v-if="pendingRequests.length" flat bordered class="q-mb-lg">
      <q-card-section class="row items-center q-gutter-sm bg-orange-1 text-orange-10">
        <q-icon name="pending_actions" size="24px" />
        <div class="text-subtitle1 text-weight-bold">
          Solicitudes de horas extra pendientes ({{ pendingRequests.length }})
        </div>
      </q-card-section>
      <q-separator />
      <q-list separator>
        <q-item v-for="r in pendingRequests" :key="r.id">
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ r._empleado }}</q-item-label>
            <q-item-label caption>
              {{ r.dayKey }} · {{ r.maxMinutes }} min · {{ r.reason || 'Sin motivo indicado' }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn
                unelevated dense color="positive" icon="check" label="Aprobar"
                :loading="store.sending" @click="approveRow(r)"
              />
              <q-btn
                outline dense color="negative" icon="close" label="Rechazar"
                @click="rejectRow(r)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Formulario de otorgamiento -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Otorgar autorización</div>
        <q-form @submit.prevent="submitGrant" class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="form.userId"
              :options="employeeOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              use-input
              input-debounce="200"
              @filter="filterEmployees"
              label="Trabajador *"
              outlined
              dense
              :rule="[v => !!v || 'Selecciona un trabajador']"
            />
          </div>

          <div class="col-6 col-md-3">
            <q-input v-model="form.dayKey" label="Día *" outlined dense readonly>
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.dayKey" mask="YYYY-MM-DD" today-btn minimal>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="OK" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-6 col-md-2">
            <q-input
              v-model.number="form.maxMinutes"
              type="number"
              label="Tope (min) *"
              outlined
              dense
              :min="1"
              :max="120"
              hint="Máx. 120 (2 h)"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-input v-model="form.reason" label="Motivo" outlined dense maxlength="300" />
          </div>

          <div class="col-12">
            <q-btn
              type="submit"
              color="primary"
              icon="add_task"
              label="Otorgar horas extra"
              :loading="store.sending"
              unelevated
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Filtros + tabla -->
    <q-card flat bordered>
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col-6 col-md-3">
          <q-input v-model="filters.from" label="Desde" outlined dense readonly>
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover><q-date v-model="filters.from" mask="YYYY-MM-DD" minimal><div class="row justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div></q-date></q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div class="col-6 col-md-3">
          <q-input v-model="filters.to" label="Hasta" outlined dense readonly>
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover><q-date v-model="filters.to" mask="YYYY-MM-DD" minimal><div class="row justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div></q-date></q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div class="col-6 col-md-3">
          <q-select v-model="filters.status" :options="statusOptions" emit-value map-options label="Estado" outlined dense clearable />
        </div>
        <div class="col-6 col-md-3 flex items-center">
          <q-btn color="primary" outline icon="search" label="Filtrar" @click="reload" />
        </div>
      </q-card-section>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        flat
        :pagination="{ rowsPerPage: 20 }"
        no-data-label="No hay autorizaciones en el rango"
      >
        <template #body-cell-empleado="p">
          <q-td :props="p">{{ p.row._empleado }}</q-td>
        </template>

        <template #body-cell-tope="p">
          <q-td :props="p">{{ p.row.maxMinutes }} min</q-td>
        </template>

        <template #body-cell-status="p">
          <q-td :props="p">
            <q-badge :color="statusMeta(p.row.status).color" :label="statusMeta(p.row.status).label" />
            <q-badge v-if="p.row.selfApproved" color="orange" class="q-ml-xs" label="Auto-aprobada">
              <q-tooltip max-width="320px">
                El propio trabajador se autorizó estas horas extra actuando como
                representante del empleador (Art. 4 del Código del Trabajo). Queda
                registrado en la bitácora para su trazabilidad.
              </q-tooltip>
            </q-badge>
            <q-badge v-if="p.row.origin === 'WORKER'" color="blue-grey" class="q-ml-xs" label="Solicitada">
              <q-tooltip max-width="320px">
                La pidió el propio trabajador desde la app; requiere aprobación de la jefatura.
              </q-tooltip>
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-acciones="p">
          <q-td :props="p" class="text-right">
            <template v-if="p.row.status === 'REQUESTED'">
              <q-btn flat dense color="positive" icon="check" label="Aprobar" @click="approveRow(p.row)" />
              <q-btn flat dense color="negative" icon="close" label="Rechazar" @click="rejectRow(p.row)" />
            </template>
            <q-btn
              v-else-if="p.row.status === 'APPROVED'"
              flat dense color="negative" icon="cancel" label="Cancelar"
              @click="confirmCancel(p.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useOvertimeAuthStore } from '@/stores/overtimeAuth'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'

const $q = useQuasar()
const store = useOvertimeAuthStore()
const userStore = useUserStore()
const auth = useAuthStore()

const loading = computed(() => store.loading)

const form = reactive({ userId: null, dayKey: '', maxMinutes: 120, reason: '' })
const filters = reactive({ from: '', to: '', status: null })

const statusOptions = [
  { label: 'Pendiente', value: 'REQUESTED' },
  { label: 'Vigente', value: 'APPROVED' },
  { label: 'Rechazada', value: 'REJECTED' },
  { label: 'Anulada', value: 'CANCELLED' },
]

function statusMeta(s) {
  switch (s) {
    case 'REQUESTED': return { color: 'orange', label: 'Pendiente' }
    case 'APPROVED': return { color: 'positive', label: 'Vigente' }
    case 'REJECTED': return { color: 'negative', label: 'Rechazada' }
    case 'CANCELLED': return { color: 'grey', label: 'Anulada' }
    default: return { color: 'grey', label: s || '—' }
  }
}

const columns = [
  { name: 'empleado', label: 'Trabajador', field: '_empleado', align: 'left' },
  { name: 'dayKey', label: 'Día', field: 'dayKey', align: 'left', sortable: true },
  { name: 'tope', label: 'Tope', field: 'maxMinutes', align: 'left' },
  { name: 'reason', label: 'Motivo', field: 'reason', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
  { name: 'acciones', label: '', field: 'acciones', align: 'right' },
]

function fullName(u) {
  return `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.email || '—'
}

// Trabajadores de la empresa (excluye superadmin / fiscalizador).
const workers = computed(() =>
  (userStore.users || []).filter(u => u.role !== 'superadmin' && u.role !== 'dt_inspector')
)

// Opciones del selector (con filtro por texto).
const filterText = ref('')
const employeeOptions = computed(() => {
  const q = filterText.value.trim().toLowerCase()
  return workers.value
    .filter(u => !q || fullName(u).toLowerCase().includes(q) || (u.rut || '').toLowerCase().includes(q))
    .map(u => ({ value: u._id, label: `${fullName(u)}${u.rut ? ' — ' + u.rut : ''}` }))
})
function filterEmployees(val, update) {
  update(() => { filterText.value = val || '' })
}

// Mapa userId → nombre para la tabla.
const userMap = computed(() => {
  const m = {}
  for (const u of userStore.users || []) m[String(u._id)] = fullName(u)
  return m
})
const rows = computed(() =>
  (store.list || []).map(a => ({ ...a, _empleado: userMap.value[String(a.userId)] || '—' }))
)

// Solicitudes que el trabajador pidió desde la app y esperan resolución.
const pendingRequests = computed(() => rows.value.filter(r => r.status === 'REQUESTED'))

async function loadUsers() {
  const params = { limit: 500 }
  if (String(auth.user?.role || '') === 'superadmin' && auth.user?.company) {
    params.company = auth.user.company
  }
  await userStore.fetchUsers(params)
}

async function reload() {
  await store.fetchAuthorizations({
    from: filters.from,
    to: filters.to,
    status: filters.status || '',
  })
}

async function submitGrant() {
  if (!form.userId) { $q.notify({ type: 'warning', message: 'Selecciona un trabajador' }); return }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dayKey)) { $q.notify({ type: 'warning', message: 'Selecciona el día' }); return }
  const min = Number(form.maxMinutes)
  if (!Number.isFinite(min) || min < 1 || min > 120) {
    $q.notify({ type: 'warning', message: 'El tope debe estar entre 1 y 120 minutos' }); return
  }
  try {
    await store.grant({
      userId: form.userId,
      dayKey: form.dayKey,
      maxMinutes: min,
      reason: form.reason || '',
    })
    $q.notify({ type: 'positive', message: 'Horas extra autorizadas. Se notificó al trabajador.', position: 'top-right' })
    form.userId = null; form.dayKey = ''; form.maxMinutes = 120; form.reason = ''
  } catch (err) {
    $q.notify({ type: 'negative', message: store.error || 'No se pudo otorgar', position: 'top-right' })
  }
}

async function approveRow(row) {
  try {
    await store.approve(row.id)
    $q.notify({ type: 'positive', message: `Horas extra aprobadas para ${row._empleado}. Se notificó al trabajador.`, position: 'top-right' })
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'No se pudo aprobar', position: 'top-right' })
  }
}

function rejectRow(row) {
  $q.dialog({
    title: 'Rechazar solicitud',
    message: `Motivo del rechazo para ${row._empleado} (opcional):`,
    prompt: { model: '', type: 'text' },
    cancel: true,
    persistent: true,
  }).onOk(async (note) => {
    try {
      await store.reject(row.id, note || '')
      $q.notify({ type: 'positive', message: 'Solicitud rechazada. Se notificó al trabajador.', position: 'top-right' })
    } catch {
      $q.notify({ type: 'negative', message: store.error || 'No se pudo rechazar', position: 'top-right' })
    }
  })
}

function confirmCancel(row) {
  $q.dialog({
    title: 'Cancelar autorización',
    message: `¿Cancelar la autorización de HE de ${row._empleado} para el ${row.dayKey}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await store.cancel(row.id)
      $q.notify({ type: 'positive', message: 'Autorización cancelada', position: 'top-right' })
    } catch {
      $q.notify({ type: 'negative', message: store.error || 'No se pudo cancelar', position: 'top-right' })
    }
  })
}

onMounted(async () => {
  await Promise.all([loadUsers(), reload()])
})
</script>
