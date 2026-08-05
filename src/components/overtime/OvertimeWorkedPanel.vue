<!-- src/components/overtime/OvertimeWorkedPanel.vue
     Horas extraordinarias EJECUTADAS: jornada pactada vs trabajada, HE marcada,
     sobretiempo detectado y qué parte está autorizada (y por tanto se paga).
     El pacto previo se gestiona en la pestaña "Autorizaciones". -->
<template>
  <div>
    <!-- Filtros -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col-6 col-md-2">
          <q-input v-model="filters.from" label="Desde" outlined dense readonly>
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover>
                  <q-date v-model="filters.from" mask="YYYY-MM-DD" minimal>
                    <div class="row justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div class="col-6 col-md-2">
          <q-input v-model="filters.to" label="Hasta" outlined dense readonly>
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover>
                  <q-date v-model="filters.to" mask="YYYY-MM-DD" minimal>
                    <div class="row justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="filters.userId"
            :options="employeeOptions"
            emit-value map-options clearable
            use-input input-debounce="200"
            @filter="filterEmployees"
            label="Trabajador (todos)"
            outlined dense
          />
        </div>
        <div class="col-12 col-md-3">
          <q-toggle v-model="filters.onlyWithOvertime" label="Sólo con horas extra o día no pactado" dense />
        </div>
        <div class="col-12 col-md-2 flex items-center justify-end q-gutter-sm">
          <q-btn color="primary" unelevated icon="search" label="Ver" :loading="loading" @click="reload" />
          <q-btn flat dense icon="download" :disable="!rows.length" @click="exportXlsx">
            <q-tooltip>Exportar a Excel</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>

    <!-- Resumen -->
    <div v-if="totals" class="row q-col-gutter-md q-mb-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="ot-kpi">
          <div class="ot-kpi__value">{{ hhmm(totals.executedMinutes) }}</div>
          <div class="ot-kpi__label">Horas extra ejecutadas</div>
          <div class="ot-kpi__sub">
            {{ hhmm(totals.markedMinutes) }} marcadas · {{ hhmm(totals.detectedMinutes) }} detectadas
          </div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="ot-kpi ot-kpi--ok">
          <div class="ot-kpi__value">{{ hhmm(totals.payableMinutes) }}</div>
          <div class="ot-kpi__label">Con pacto — se pagan</div>
          <div class="ot-kpi__sub">Con recargo legal en la liquidación</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="ot-kpi ot-kpi--warn">
          <div class="ot-kpi__value">{{ hhmm(totals.executedMinutes - totals.payableMinutes) }}</div>
          <div class="ot-kpi__label">Sin pacto — no se pagan</div>
          <div class="ot-kpi__sub">{{ totals.daysWithoutPact }} día(s) por regularizar</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="ot-kpi">
          <div class="ot-kpi__value">{{ hhmm(totals.unscheduledMinutes) }}</div>
          <div class="ot-kpi__label">Trabajo en día no pactado</div>
          <div class="ot-kpi__sub">{{ totals.daysUnscheduled }} día(s) de descanso o festivo</div>
        </q-card>
      </div>
    </div>

    <q-banner v-if="totals && totals.executedMinutes > totals.payableMinutes" rounded class="bg-orange-1 text-orange-10 q-mb-md">
      <template #avatar><q-icon name="warning" color="orange" /></template>
      Hay horas trabajadas por sobre la jornada pactada <b>sin autorización previa</b>.
      La ley exige pacto (Art. 32 CT), así que no entran a la liquidación hasta que
      las autorices aquí: usa <b>Autorizar</b> en el día correspondiente.
    </q-banner>

    <!-- Tabla por trabajador (expandible al detalle diario) -->
    <q-card flat bordered>
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="userId"
        :loading="loading"
        flat
        :pagination="{ rowsPerPage: 15 }"
        no-data-label="Sin horas extraordinarias en el rango"
      >
        <template #body="props">
          <q-tr :props="props" class="cursor-pointer" @click="props.expand = !props.expand">
            <q-td auto-width>
              <q-icon :name="props.expand ? 'expand_less' : 'expand_more'" />
            </q-td>
            <q-td key="fullName" :props="props">
              <div class="text-weight-bold">{{ props.row.fullName }}</div>
              <div class="text-caption text-grey-7">{{ props.row.rut || '—' }}</div>
            </q-td>
            <q-td key="executed" :props="props">{{ hhmm(props.row.totals.executedMinutes) }}</q-td>
            <q-td key="marked" :props="props">{{ hhmm(props.row.totals.markedMinutes) }}</q-td>
            <q-td key="detected" :props="props">{{ hhmm(props.row.totals.detectedMinutes) }}</q-td>
            <q-td key="payable" :props="props">
              <span :class="props.row.totals.payableMinutes > 0 ? 'text-positive text-weight-bold' : 'text-grey-6'">
                {{ hhmm(props.row.totals.payableMinutes) }}
              </span>
            </q-td>
            <q-td key="pending" :props="props">
              <q-badge v-if="props.row.art22" color="grey" label="Art. 22" >
                <q-tooltip>Trabajador sin fiscalización de jornada: no genera horas extraordinarias.</q-tooltip>
              </q-badge>
              <q-badge v-else-if="props.row.totals.daysWithoutPact" color="orange"
                :label="`${props.row.totals.daysWithoutPact} sin pacto`" />
              <q-badge v-else-if="props.row.totals.executedMinutes" color="positive" label="Todo autorizado" />
              <span v-else class="text-grey-6">—</span>
            </q-td>
          </q-tr>

          <q-tr v-show="props.expand" :props="props">
            <q-td colspan="100%" class="bg-grey-1 ot-detail">
              <q-markup-table flat dense class="bg-transparent">
                <thead>
                  <tr>
                    <th class="text-left">Día</th>
                    <th class="text-right">Pactada</th>
                    <th class="text-right">Trabajada</th>
                    <th class="text-right">HE marcada</th>
                    <th class="text-right">Sobretiempo</th>
                    <th class="text-right">Autorizado</th>
                    <th class="text-left">Estado</th>
                    <th class="text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in props.row.days" :key="d.dayKey">
                    <td class="text-left">
                      {{ prettyDay(d.dayKey) }}
                      <q-icon v-if="d.overLegalCap" name="report" color="negative" size="16px">
                        <q-tooltip>Supera el tope legal de {{ heCapMinutes }} min diarios (Art. 31 CT).</q-tooltip>
                      </q-icon>
                    </td>
                    <td class="text-right">
                      <span v-if="d.expectedMinutes === null" class="text-grey-6">sin jornada</span>
                      <span v-else>{{ hhmm(d.expectedMinutes) }}</span>
                      <q-tooltip v-if="d.scheduleName">{{ d.scheduleName }} · {{ sourceLabel(d.expectedSource) }}</q-tooltip>
                    </td>
                    <td class="text-right">{{ hhmm(d.workedMinutes) }}</td>
                    <td class="text-right">
                      {{ hhmm(d.markedMinutes) }}
                      <q-icon v-if="d.markedMinutes > 0 && !d.markedAuthorized" name="info" size="14px" color="orange">
                        <q-tooltip>Marcada como HE pero sin autorización previa al momento de marcar.</q-tooltip>
                      </q-icon>
                    </td>
                    <td class="text-right">{{ hhmm(d.detectedMinutes) }}</td>
                    <td class="text-right">{{ d.authorizedMinutes ? hhmm(d.authorizedMinutes) : '—' }}</td>
                    <td class="text-left">
                      <q-badge :color="statusMeta(d.status).color" :label="statusMeta(d.status).label">
                        <q-tooltip max-width="300px">{{ statusMeta(d.status).hint }}</q-tooltip>
                      </q-badge>
                    </td>
                    <td class="text-right">
                      <q-btn
                        v-if="canRegularize(d)"
                        dense flat no-caps color="primary"
                        :icon="d.authorizationId ? 'tune' : 'add_task'"
                        :label="d.authorizationId ? 'Ajustar' : 'Autorizar'"
                        @click.stop="openGrant(props.row, d)"
                      />
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <!-- Diálogo de regularización -->
    <q-dialog v-model="grantDialog.open" persistent>
      <q-card style="min-width: 420px; max-width: 94vw">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold">
            {{ grantDialog.authorizationId ? 'Ajustar autorización' : 'Autorizar horas extra' }}
          </div>
          <div class="text-caption text-grey-7">
            {{ grantDialog.fullName }} · {{ prettyDay(grantDialog.dayKey) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-banner dense rounded class="bg-blue-1 text-blue-9 q-mb-md">
            Ejecutado ese día: <b>{{ hhmm(grantDialog.executedMinutes) }}</b>.
            Autorizar es un acto del empleador y queda en la bitácora; se notifica al trabajador.
          </q-banner>

          <q-input
            v-model.number="grantDialog.maxMinutes"
            type="number" outlined dense
            label="Minutos autorizados *"
            :min="1" :max="heCapMinutes"
            :hint="`Tope legal vigente: ${heCapMinutes} min (${(heCapMinutes / 60).toFixed(1).replace('.0', '')} h) por día — Art. 31 CT`"
          />
          <q-input
            v-model="grantDialog.reason"
            outlined dense class="q-mt-md"
            label="Motivo" maxlength="300"
            placeholder="Ej: cierre de inventario / regularización a posteriori"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn
            unelevated no-caps color="primary"
            :label="grantDialog.authorizationId ? 'Reemplazar autorización' : 'Autorizar'"
            :loading="granting"
            @click="submitGrant"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useOvertimeReportStore } from '@/stores/overtimeReport'
import { useLegalParamsStore } from '@/stores/legalParams'
import { useOvertimeAuthStore } from '@/stores/overtimeAuth'
import { useUserStore } from '@/stores/userStore'

const $q = useQuasar()
const store = useOvertimeReportStore()
const authStore = useOvertimeAuthStore()
const userStore = useUserStore()
const legalParams = useLegalParamsStore()

// Tope diario de HE: parámetro legal con vigencia servido por el backend.
const heCapMinutes = computed(() => legalParams.value('HE_TOPE_DIARIO', 120))

const loading = computed(() => store.loading)
const rows = computed(() => store.rows)
const totals = computed(() => store.totals)

function isoDay(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const today = new Date()
const filters = reactive({
  from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)),
  to: isoDay(today),
  userId: null,
  onlyWithOvertime: true,
})

const columns = [
  { name: 'expand', label: '', field: 'expand' },
  { name: 'fullName', label: 'Trabajador', field: 'fullName', align: 'left', sortable: true },
  { name: 'executed', label: 'HE ejecutadas', field: (r) => r.totals.executedMinutes, align: 'right', sortable: true },
  { name: 'marked', label: 'Marcadas', field: (r) => r.totals.markedMinutes, align: 'right' },
  { name: 'detected', label: 'Sobretiempo', field: (r) => r.totals.detectedMinutes, align: 'right' },
  { name: 'payable', label: 'Se pagan', field: (r) => r.totals.payableMinutes, align: 'right', sortable: true },
  { name: 'pending', label: 'Pacto', field: (r) => r.totals.daysWithoutPact, align: 'left' },
]

function hhmm(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0))
  if (!m) return '0h'
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (!h) return `${rest}m`
  return rest ? `${h}h ${rest}m` : `${h}h`
}

function prettyDay(dayKey) {
  if (!dayKey) return '—'
  const [y, m, d] = String(dayKey).split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function sourceLabel(source) {
  return ({
    scheduled_shift: 'turno programado',
    schedule_weekly: 'plantilla semanal',
    holiday: 'feriado',
    rest_day: 'día de descanso',
    oncall_unscheduled: 'turnos por demanda, sin turno ese día',
    none: 'sin horario asignado',
  })[source] || source
}

function statusMeta(status) {
  return ({
    OK: { color: 'positive', label: 'Autorizada', hint: 'Lo ejecutado está dentro del tope autorizado: se paga con recargo del 50%.' },
    PARCIAL: { color: 'orange', label: 'Excede lo autorizado', hint: 'Se trabajó más de lo autorizado. Sólo se paga hasta el tope; ajusta la autorización para cubrir el resto.' },
    SIN_PACTO: { color: 'negative', label: 'Sin pacto', hint: 'Se trabajó sobre la jornada sin autorización previa. No se paga hasta que RR.HH. lo autorice.' },
    SIN_JORNADA: { color: 'purple', label: 'Día no pactado', hint: 'Trabajó en un día sin jornada pactada (descanso, festivo o turno no programado). No es hora extra automáticamente: revisa el descanso compensatorio (Art. 38 CT).' },
    ART22: { color: 'grey', label: 'Art. 22', hint: 'Trabajador excluido de la limitación de jornada: no genera horas extraordinarias.' },
    SIN_HE: { color: 'grey-4', label: 'Sin HE', hint: 'Jornada dentro de lo pactado.' },
  })[status] || { color: 'grey', label: status, hint: '' }
}

function canRegularize(d) {
  return d.status === 'SIN_PACTO' || d.status === 'PARCIAL'
}

/* ── Selector de trabajadores ── */
const filterText = ref('')
const employeeOptions = computed(() => {
  const q = filterText.value.trim().toLowerCase()
  return (userStore.users || [])
    .filter((u) => u.role !== 'superadmin' && u.role !== 'dt_inspector')
    .map((u) => ({
      value: u._id,
      label: `${`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}${u.rut ? ' — ' + u.rut : ''}`,
    }))
    .filter((o) => !q || o.label.toLowerCase().includes(q))
})
function filterEmployees(val, update) {
  update(() => { filterText.value = val || '' })
}

async function reload() {
  try {
    await store.fetchSummary({
      from: filters.from,
      to: filters.to,
      userId: filters.userId || '',
      onlyWithOvertime: filters.onlyWithOvertime ? 'true' : '',
    })
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'No se pudo cargar el reporte', position: 'top-right' })
  }
}

async function exportXlsx() {
  try {
    await store.exportSummary({ from: filters.from, to: filters.to, userId: filters.userId || '' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo exportar', position: 'top-right' })
  }
}

/* ── Regularización (autorizar a posteriori) ── */
const granting = ref(false)
const grantDialog = reactive({
  open: false,
  userId: null,
  fullName: '',
  dayKey: '',
  executedMinutes: 0,
  maxMinutes: 0,
  reason: '',
  authorizationId: null,
})

function openGrant(row, day) {
  grantDialog.userId = row.userId
  grantDialog.fullName = row.fullName
  grantDialog.dayKey = day.dayKey
  grantDialog.executedMinutes = day.executedMinutes
  grantDialog.maxMinutes = Math.min(heCapMinutes.value, Math.max(1, Math.round(day.executedMinutes)))
  grantDialog.reason = 'Regularización a posteriori'
  grantDialog.authorizationId = day.authorizationId || null
  grantDialog.open = true
}

async function submitGrant() {
  const min = Number(grantDialog.maxMinutes)
  if (!Number.isFinite(min) || min < 1 || min > heCapMinutes.value) {
    $q.notify({ type: 'warning', message: `El tope debe estar entre 1 y ${heCapMinutes.value} minutos` })
    return
  }
  granting.value = true
  try {
    // Ajustar = anular la autorización vigente y otorgar una nueva con el tope
    // corregido. Deja las dos huellas en la bitácora, que es lo que corresponde.
    if (grantDialog.authorizationId) {
      await authStore.cancel(grantDialog.authorizationId)
    }
    await authStore.grant({
      userId: grantDialog.userId,
      dayKey: grantDialog.dayKey,
      maxMinutes: min,
      reason: grantDialog.reason || '',
    })
    grantDialog.open = false
    $q.notify({ type: 'positive', message: 'Horas extra autorizadas. Se notificó al trabajador.', position: 'top-right' })
    await reload()
  } catch {
    $q.notify({
      type: 'negative',
      message: authStore.error || 'No se pudo autorizar',
      position: 'top-right',
    })
  } finally {
    granting.value = false
  }
}

onMounted(async () => {
  legalParams.fetch()
  if (!userStore.users?.length) {
    try { await userStore.fetchUsers({ limit: 500 }) } catch { /* el selector queda vacío */ }
  }
  await reload()
})

defineExpose({ reload })
</script>

<style scoped>
.ot-kpi {
  padding: 14px 16px;
  border-radius: 12px;
  height: 100%;
}
.ot-kpi__value { font-size: 22px; font-weight: 800; line-height: 1.1; }
.ot-kpi__label { font-size: 12.5px; font-weight: 600; margin-top: 2px; }
.ot-kpi__sub { font-size: 11px; opacity: .7; margin-top: 2px; }
.ot-kpi--ok .ot-kpi__value { color: #16a34a; }
.ot-kpi--warn .ot-kpi__value { color: #d97706; }
.ot-detail { padding: 4px 12px 12px; }
.body--dark .ot-detail { background: rgba(255, 255, 255, 0.03) !important; }
</style>
