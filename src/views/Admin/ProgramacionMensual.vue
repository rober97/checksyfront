<template>
  <div class="rk-tab-content">
    <div class="rk-module-shell rk-module-shell--embedded">
      <!-- Toolbar -->
      <section class="rk-module-panel">
        <div class="rk-module-panel__section">
          <div class="row items-end q-col-gutter-md">
            <div class="col-12 col-md-auto">
              <q-chip
                v-if="plan?.status === 'published'"
                color="positive"
                text-color="white"
                icon="public"
              >Publicado</q-chip>
              <q-chip
                v-else
                color="grey-6"
                text-color="white"
                icon="edit_note"
              >Borrador</q-chip>
            </div>
            <div class="col-12 col-md-4">
              <div class="rk-month-nav">
                <q-btn flat dense round icon="chevron_left" @click="shiftMonth(-1)">
                  <q-tooltip>Mes anterior</q-tooltip>
                </q-btn>
                <div class="rk-month-label">
                  {{ monthLabel }}
                </div>
                <q-btn flat dense round icon="chevron_right" @click="shiftMonth(1)">
                  <q-tooltip>Mes siguiente</q-tooltip>
                </q-btn>
                <q-btn flat dense no-caps size="sm" label="Hoy" @click="goToCurrentMonth" />
              </div>
            </div>

            <div class="col-12 col-md">
              <div class="rk-actions-row">
                <q-btn
                  unelevated
                  color="primary"
                  icon="auto_fix_high"
                  label="Pre-rellenar mes"
                  no-caps
                  :loading="prefilling"
                  :disable="!canEdit"
                  @click="onPrefill"
                />
                <q-btn
                  v-if="plan?.status !== 'published'"
                  unelevated
                  color="positive"
                  icon="public"
                  label="Publicar mes"
                  no-caps
                  :disable="!canEdit"
                  @click="onPublish"
                />
                <q-btn
                  v-else
                  outline
                  color="warning"
                  icon="lock_open"
                  label="Despublicar"
                  no-caps
                  :disable="!canEdit"
                  @click="onUnpublish"
                />
                <q-btn
                  flat
                  color="negative"
                  icon="delete_sweep"
                  label="Limpiar mes"
                  no-caps
                  :disable="!canEdit"
                  @click="onClearConfirm"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="rk-module-grid rk-module-grid--4 q-mt-md">
        <div class="rk-module-stat">
          <div class="rk-module-stat__icon"><q-icon name="badge" size="20px" /></div>
          <div>
            <div class="rk-module-stat__label">Con asignación</div>
            <div class="rk-module-stat__value">{{ assignments.length }}</div>
          </div>
        </div>
        <div class="rk-module-stat">
          <div class="rk-module-stat__icon"><q-icon name="person_off" size="20px" /></div>
          <div>
            <div class="rk-module-stat__label">Sin asignación</div>
            <div class="rk-module-stat__value">{{ unassigned.length }}</div>
          </div>
        </div>
        <div class="rk-module-stat">
          <div class="rk-module-stat__icon"><q-icon name="event_available" size="20px" /></div>
          <div>
            <div class="rk-module-stat__label">Turnos planificados</div>
            <div class="rk-module-stat__value">{{ shifts.length }}</div>
          </div>
        </div>
        <div class="rk-module-stat">
          <div class="rk-module-stat__icon"><q-icon name="schedule" size="20px" /></div>
          <div>
            <div class="rk-module-stat__label">Horas planificadas</div>
            <div class="rk-module-stat__value">{{ totalPlannedHours }} h</div>
          </div>
        </div>
      </section>

      <!-- Empty state -->
      <section v-if="!companyId" class="rk-module-panel q-mt-md">
        <div class="rk-module-panel__section text-center q-py-lg">
          <q-icon name="apartment" size="32px" class="text-grey-6" />
          <p class="text-grey-7 q-mt-sm">No hay empresa activa. Selecciona una desde el menú superior.</p>
        </div>
      </section>

      <!-- Grilla -->
      <section v-else class="rk-module-panel q-mt-md rk-grid-panel">
        <q-inner-loading :showing="loading">
          <q-spinner color="primary" size="40px" />
        </q-inner-loading>

        <div class="rk-grid-wrap">
          <table class="rk-grid">
            <thead>
              <tr>
                <th class="rk-grid-corner">Empleado</th>
                <th
                  v-for="d in monthDays"
                  :key="d.key"
                  class="rk-grid-day"
                  :class="{
                    'rk-grid-day--weekend': d.isWeekend,
                    'rk-grid-day--today': d.isToday,
                  }"
                >
                  <div class="rk-grid-day__short">{{ d.short }}</div>
                  <div class="rk-grid-day__num">{{ d.day }}</div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="row in rows" :key="row.userId">
                <th class="rk-grid-emp">
                  <q-avatar size="28px" color="primary" text-color="white" class="q-mr-sm">
                    <img v-if="row.user.profilePicture" :src="row.user.profilePicture" />
                    <span v-else>{{ row.initials }}</span>
                  </q-avatar>
                  <div class="rk-grid-emp__text">
                    <div class="rk-grid-emp__name">
                      {{ row.user.firstName }} {{ row.user.lastName }}
                      <q-icon
                        v-if="row.exceedsContract"
                        name="warning"
                        color="warning"
                        size="15px"
                        class="q-ml-xs"
                      >
                        <q-tooltip>
                          Semana de {{ row.maxWeekHours }} h planificadas supera el contrato
                          ({{ row.contractHours }} h/sem). El exceso debe registrarse como horas extra.
                        </q-tooltip>
                      </q-icon>
                    </div>
                    <div class="rk-grid-emp__role">
                      <span v-if="row.assignment">{{ row.assignment.scheduleId?.name || 'Sin plantilla' }}</span>
                      <span v-else class="text-warning">Sin asignación</span>
                      <span v-if="row.contractHours > 0" class="rk-grid-emp__contract">
                        · {{ row.contractHours }} h/sem
                      </span>
                    </div>
                  </div>
                </th>
                <td
                  v-for="d in monthDays"
                  :key="d.key"
                  class="rk-grid-cell"
                  :class="{
                    'rk-grid-cell--weekend': d.isWeekend,
                    'rk-grid-cell--has-shifts': row.shiftsByDate[d.key]?.length,
                    'rk-grid-cell--off': !row.shiftsByDate[d.key]?.length,
                    'rk-grid-cell--today': d.isToday,
                  }"
                  :tabindex="canEdit ? 0 : -1"
                  @click="canEdit && openCellEditor(row, d)"
                  @keyup.enter="canEdit && openCellEditor(row, d)"
                >
                  <div v-if="row.shiftsByDate[d.key]?.length" class="rk-grid-segments">
                    <div
                      v-for="(s, i) in row.shiftsByDate[d.key]"
                      :key="i"
                      class="rk-grid-seg"
                    >
                      {{ s.start }}–{{ s.end }}
                    </div>
                  </div>
                  <span v-else class="rk-grid-empty">—</span>
                </td>
              </tr>

              <tr v-if="!rows.length">
                <td :colspan="monthDays.length + 1" class="text-center text-grey-7 q-pa-lg">
                  No hay empleados para esta empresa.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Diálogo edición de celda (multi-segment) -->
    <q-dialog v-model="cellDialog.open" persistent>
      <q-card style="min-width: min(480px, 94vw)">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-h6">Editar día</div>
            <div class="text-caption text-grey-6">
              {{ cellDialog.userName }} · {{ cellDialog.dateLabel }}
            </div>
          </div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <div v-if="cellDialog.segments.length" class="rk-cell-editor">
            <div
              v-for="(s, idx) in cellDialog.segments"
              :key="idx"
              class="rk-cell-row"
            >
              <q-input
                v-model="s.start"
                mask="##:##"
                dense
                outlined
                placeholder="09:00"
                style="width: 110px"
              >
                <template #prepend><q-icon name="login" size="16px" /></template>
              </q-input>
              <span class="text-grey-6">—</span>
              <q-input
                v-model="s.end"
                mask="##:##"
                dense
                outlined
                placeholder="18:00"
                style="width: 110px"
              >
                <template #prepend><q-icon name="logout" size="16px" /></template>
              </q-input>
              <q-btn
                v-if="cellDialog.segments.length > 1"
                flat
                dense
                round
                size="sm"
                icon="close"
                @click="removeCellSegment(idx)"
              />
            </div>
            <q-btn
              flat
              dense
              no-caps
              size="sm"
              icon="add"
              label="Añadir tramo"
              class="rk-cell-add"
              @click="addCellSegment"
            />
          </div>
          <div v-else class="text-grey-7 q-py-sm">
            Día libre. Agrega un tramo para programar turno.
            <div class="q-mt-sm">
              <q-btn flat dense no-caps icon="add" label="Añadir tramo" @click="addCellSegment" />
            </div>
          </div>

          <div class="row justify-end q-mt-md">
            <q-chip
              dense
              square
              :color="cellDialog.totalHours > 0 ? 'primary' : 'grey-5'"
              text-color="white"
            >
              Total: {{ cellDialog.totalHours.toFixed(1) }} h
            </q-chip>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            v-if="cellDialog.hasExisting"
            flat
            color="negative"
            label="Marcar libre"
            no-caps
            @click="saveCellAsFree"
          />
          <q-btn
            unelevated
            color="primary"
            label="Guardar"
            no-caps
            :loading="cellDialog.saving"
            @click="saveCell"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useToast } from 'vue-toastification'
import { useCompaniesStore } from '@/stores/companies'
import { useMonthlyPlanStore } from '@/stores/monthlyPlan'
import { useAuthStore } from '@/stores/authStore'
import { toMinutes, diffHours } from '@/utils/workHours'

const $q = useQuasar()
const toast = useToast()
const companiesStore = useCompaniesStore()
const planStore = useMonthlyPlanStore()
const authStore = useAuthStore()

const companyId = ref(null)

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1) // 1..12

const canEdit = computed(() => ['superadmin', 'admin_rrhh'].includes(authStore.user?.role))

/* ---------- Estado del store ---------- */
const loading = computed(() => planStore.loading)
const plan = computed(() => planStore.plan)
const assignments = computed(() => planStore.assignments)
const shifts = computed(() => planStore.shifts)
const unassigned = computed(() => planStore.unassigned)

/* ---------- Generación de días del mes ---------- */
const SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const monthDays = computed(() => {
  const days = []
  const last = new Date(Date.UTC(year.value, month.value, 0)).getUTCDate()
  const todayStr = new Date().toISOString().slice(0, 10)
  for (let d = 1; d <= last; d++) {
    const date = new Date(Date.UTC(year.value, month.value - 1, d))
    const dow = date.getUTCDay()
    const key = date.toISOString().slice(0, 10)
    days.push({
      key,
      day: d,
      short: SHORT[dow],
      isWeekend: dow === 0 || dow === 6,
      isToday: key === todayStr,
    })
  }
  return days
})

const monthLabel = computed(() => {
  const names = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  return `${names[month.value - 1]} ${year.value}`
})

/* ---------- Construcción de filas (empleados × días) ---------- */
function initialsOf(u) {
  const f = (u?.firstName || '').trim()
  const l = (u?.lastName || '').trim()
  return ((f[0] || '') + (l[0] || '')).toUpperCase() || '?'
}

function contractHoursOf(u) {
  return Number(u?.payroll?.weeklyContractHours || 0)
}

/** Clave ISO semana (YYYY-Www) para agrupar turnos por semana. */
function isoWeekKey(yyyymmdd) {
  const [y, m, d] = yyyymmdd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const day = dt.getUTCDay() || 7
  dt.setUTCDate(dt.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((dt - yearStart) / 86400000 + 1) / 7)
  return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/** Mayor total de horas planificadas en una misma semana ISO para el empleado.
 *  Programación ADVIERTE (no bloquea): un exceso puntual puede ser hora extra. */
function maxWeeklyPlanned(shiftsByDate) {
  const byWeek = {}
  for (const dKey of Object.keys(shiftsByDate || {})) {
    const wk = isoWeekKey(dKey)
    const dayHrs = (shiftsByDate[dKey] || []).reduce((sum, s) => sum + diffHours(s.start, s.end), 0)
    byWeek[wk] = (byWeek[wk] || 0) + dayHrs
  }
  let max = 0
  for (const wk of Object.keys(byWeek)) max = Math.max(max, byWeek[wk])
  return +max.toFixed(1)
}

const rows = computed(() => {
  const result = []

  // Indice rápido: shiftsByUserDate[userId][YYYY-MM-DD] = [{start, end, _id, source, scheduleId}, ...]
  const shiftsIndex = {}
  for (const s of shifts.value) {
    const uid = String(s.userId)
    const dKey = new Date(s.date).toISOString().slice(0, 10)
    if (!shiftsIndex[uid]) shiftsIndex[uid] = {}
    if (!shiftsIndex[uid][dKey]) shiftsIndex[uid][dKey] = []
    shiftsIndex[uid][dKey].push(s)
  }
  for (const uid of Object.keys(shiftsIndex)) {
    for (const dk of Object.keys(shiftsIndex[uid])) {
      shiftsIndex[uid][dk].sort((a, b) => (a.start || '').localeCompare(b.start || ''))
    }
  }

  // Empleados con asignación primero
  for (const a of assignments.value) {
    const u = a.userId
    if (!u) continue
    result.push({
      userId: String(u._id),
      user: u,
      initials: initialsOf(u),
      assignment: a,
      shiftsByDate: shiftsIndex[String(u._id)] || {},
    })
  }

  // Empleados sin asignación
  for (const u of unassigned.value) {
    result.push({
      userId: String(u._id),
      user: u,
      initials: initialsOf(u),
      assignment: null,
      shiftsByDate: shiftsIndex[String(u._id)] || {},
    })
  }

  // Enriquecer con contrato y aviso de exceso semanal (no bloqueante).
  for (const r of result) {
    r.contractHours = contractHoursOf(r.user)
    r.maxWeekHours = maxWeeklyPlanned(r.shiftsByDate)
    r.exceedsContract = r.contractHours > 0 && r.maxWeekHours > r.contractHours + 0.01
  }

  result.sort((a, b) => {
    const an = `${a.user.firstName || ''} ${a.user.lastName || ''}`.toLowerCase()
    const bn = `${b.user.firstName || ''} ${b.user.lastName || ''}`.toLowerCase()
    return an.localeCompare(bn)
  })

  return result
})

const totalPlannedHours = computed(() => {
  let mins = 0
  for (const s of shifts.value) {
    const sm = toMinutes(s.start)
    let em = toMinutes(s.end)
    if (sm == null || em == null) continue
    if (em < sm) em += 24 * 60
    mins += em - sm
  }
  return (mins / 60).toFixed(1)
})

/* ---------- Carga ---------- */
// Lee la empresa activa del JWT (la setea el CompanySwitcher del header).
// Mantenemos fetchCompanies por si algún sub-componente lo necesita.
async function loadCompanies() {
  try { await companiesStore.fetchCompanies() } catch { /* noop */ }
  const u = authStore.user
  companyId.value = u?.company?._id || u?.company || u?.companyId || null
}

async function refresh() {
  if (!companyId.value) return
  await planStore.fetchPlan({ companyId: companyId.value, year: year.value, month: month.value })
}

// Un único watcher cubre la carga inicial (companyId pasa de null al valor que
// setea loadCompanies) y los cambios manuales. Deduplica si la misma terna
// (companyId+year+month) se solicita dos veces seguidas.
let pendingKey = null
watch([companyId, year, month], ([cid, y, m]) => {
  if (!cid) return
  const key = `${cid}|${y}|${m}`
  if (pendingKey === key) return
  pendingKey = key
  refresh().finally(() => { if (pendingKey === key) pendingKey = null })
})

/* ---------- Acciones de mes ---------- */
function shiftMonth(delta) {
  let m = month.value + delta
  let y = year.value
  while (m < 1) { m += 12; y -= 1 }
  while (m > 12) { m -= 12; y += 1 }
  month.value = m
  year.value = y
}

function goToCurrentMonth() {
  const t = new Date()
  year.value = t.getFullYear()
  month.value = t.getMonth() + 1
}

const prefilling = ref(false)

async function onPrefill() {
  if (!companyId.value) return
  prefilling.value = true
  try {
    const data = await planStore.prefillMonth({
      companyId: companyId.value, year: year.value, month: month.value,
    })
    toast.success(
      data.created
        ? `${data.created} turnos creados${data.skipped ? `, ${data.skipped} omitidos` : ''}.`
        : (data.message || 'Sin cambios.')
    )
    await refresh()
  } catch (err) {
    toast.error(err.message || 'No se pudo pre-rellenar.')
  } finally {
    prefilling.value = false
  }
}

async function onPublish() {
  try {
    await planStore.publishMonth({
      companyId: companyId.value, year: year.value, month: month.value,
    })
    toast.success('Mes publicado. Visible para los empleados.')
  } catch (err) {
    toast.error(err.message || 'No se pudo publicar.')
  }
}

async function onUnpublish() {
  try {
    await planStore.unpublishMonth({
      companyId: companyId.value, year: year.value, month: month.value,
    })
    toast.success('Mes despublicado.')
  } catch (err) {
    toast.error(err.message || 'No se pudo despublicar.')
  }
}

function onClearConfirm() {
  $q.dialog({
    title: 'Limpiar mes',
    message: 'Se borrarán todos los turnos planificados del mes (los completados se conservan). ¿Continuar?',
    cancel: true,
    persistent: true,
    ok: { label: 'Limpiar', color: 'negative', unelevated: true },
  }).onOk(async () => {
    try {
      const data = await planStore.clearMonth({
        companyId: companyId.value, year: year.value, month: month.value,
      })
      toast.success(`${data.deleted || 0} turnos eliminados.`)
      await refresh()
    } catch (err) {
      toast.error(err.message || 'No se pudo limpiar.')
    }
  })
}

/* ---------- Edición de celda ---------- */
const cellDialog = reactive({
  open: false,
  saving: false,
  userId: null,
  userName: '',
  date: null,
  dateLabel: '',
  segments: [],
  hasExisting: false,
  scheduleId: null,
  totalHours: 0,
})

const cellTotalHours = computed(() => {
  let mins = 0
  for (const s of cellDialog.segments) {
    const sm = toMinutes(s.start)
    let em = toMinutes(s.end)
    if (sm == null || em == null) continue
    if (em < sm) em += 24 * 60
    mins += em - sm
  }
  return mins / 60
})
watch(cellTotalHours, (v) => { cellDialog.totalHours = v }, { immediate: true })

function openCellEditor(row, day) {
  const existing = row.shiftsByDate[day.key] || []
  cellDialog.userId = row.userId
  cellDialog.userName = `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim()
  cellDialog.date = day.key
  cellDialog.dateLabel = formatLongDate(day.key)
  cellDialog.segments = existing.length
    ? existing.map((s) => ({ start: s.start, end: s.end }))
    : [{ start: '09:00', end: '18:00' }]
  cellDialog.hasExisting = existing.length > 0
  cellDialog.scheduleId = row.assignment?.scheduleId?._id || row.assignment?.scheduleId || null
  cellDialog.totalHours = 0
  cellDialog.open = true
}

function addCellSegment() {
  const last = cellDialog.segments[cellDialog.segments.length - 1]
  cellDialog.segments.push({ start: last?.end || '14:00', end: '18:00' })
}

function removeCellSegment(idx) {
  if (cellDialog.segments.length <= 1) {
    cellDialog.segments = []
    return
  }
  cellDialog.segments.splice(idx, 1)
}

async function saveCell() {
  cellDialog.saving = true
  try {
    await planStore.upsertCellShifts({
      userId: cellDialog.userId,
      companyId: companyId.value,
      date: cellDialog.date,
      segments: cellDialog.segments,
      scheduleId: cellDialog.scheduleId,
    })
    toast.success('Día actualizado.')
    cellDialog.open = false
    await refresh()
  } catch (err) {
    toast.error(err.message || 'No se pudo guardar.')
  } finally {
    cellDialog.saving = false
  }
}

async function saveCellAsFree() {
  cellDialog.segments = []
  await saveCell()
}

function formatLongDate(yyyymmdd) {
  const [y, m, d] = yyyymmdd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const monNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${dayNames[dt.getUTCDay()]} ${d} de ${monNames[m - 1]}`
}

/* ---------- Mount ---------- */
onMounted(async () => {
  // loadCompanies setea companyId → el watcher dispara el refresh
  await loadCompanies()
})
</script>

<style scoped>
.rk-month-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}
.rk-month-label {
  font-size: 14px;
  font-weight: 600;
  text-transform: capitalize;
  min-width: 140px;
  text-align: center;
}
.rk-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.rk-grid-panel {
  position: relative;
  padding: 0;
  overflow: hidden;
}
.rk-grid-wrap {
  overflow: auto;
  max-height: calc(100vh - 360px);
  position: relative;
}
.rk-grid {
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
  min-width: 100%;
  font-size: 12px;
}
.rk-grid thead th {
  position: sticky;
  top: 0;
  background: var(--surface-soft, #f8fafc);
  z-index: 3;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}
.rk-grid-corner {
  left: 0;
  z-index: 4 !important;
  min-width: 220px;
  text-align: left;
  padding: 8px 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}
.rk-grid-day {
  min-width: 86px;
  padding: 6px 4px;
  text-align: center;
  font-weight: 500;
  color: var(--text-secondary, #475569);
}
.rk-grid-day--weekend { background: var(--color-primary-soft, rgba(12, 169, 196,0.08)); }
.rk-grid-day--today {
  background: var(--color-primary-soft, rgba(12, 169, 196,0.18)) !important;
  color: var(--color-primary-dark, #0893AA);
}
.rk-grid-day__short {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}
.rk-grid-day__num {
  font-weight: 700;
  font-size: 14px;
}

.rk-grid-emp {
  position: sticky;
  left: 0;
  background: var(--card-background, #fff);
  z-index: 2;
  min-width: 220px;
  text-align: left;
  padding: 8px 12px;
  border-right: 1px solid var(--border-color, #e2e8f0);
  border-bottom: 1px solid var(--surface-soft, #f1f5f9);
  display: flex;
  align-items: center;
}
.rk-grid-emp__text { line-height: 1.2; }
.rk-grid-emp__name { font-weight: 600; color: var(--text-primary, #0f172a); }
.rk-grid-emp__role { font-size: 11px; color: var(--text-secondary, #64748b); }
.rk-grid-emp__contract { color: var(--text-muted, #94a3b8); font-variant-numeric: tabular-nums; }

.rk-grid-cell {
  min-width: 86px;
  height: 56px;
  padding: 4px;
  text-align: center;
  border-bottom: 1px solid var(--surface-soft, #f1f5f9);
  border-right: 1px solid var(--surface-soft, #f1f5f9);
  cursor: pointer;
  transition: background 0.1s;
}
.rk-grid-cell:hover {
  background: var(--color-primary-soft, rgba(12, 169, 196,0.08));
}
.rk-grid-cell--weekend { background: var(--surface-soft, #f8fafc); }
.rk-grid-cell--today { background: var(--color-primary-soft, rgba(12, 169, 196,0.12)); }
.rk-grid-cell--has-shifts { background: var(--color-success-soft, rgba(34, 197, 94, 0.08)); }
.rk-grid-cell--off { color: var(--border-color, #cbd5e1); }
.rk-grid-cell:focus { outline: 2px solid var(--color-primary, #0CA9C4); outline-offset: -2px; }

.rk-grid-segments {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  font-variant-numeric: tabular-nums;
}
.rk-grid-seg {
  font-size: 11px;
  color: var(--color-success, #16a34a);
  font-weight: 600;
  white-space: nowrap;
}
.rk-grid-empty {
  font-size: 14px;
  color: var(--border-color, #cbd5e1);
}

/* Editor de celda */
.rk-cell-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rk-cell-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rk-cell-add { align-self: flex-start; font-size: 12px; }

/* ---------- Dark mode ----------
   Most rules above already consume CSS tokens (--surface-soft, --border-color,
   --card-background, --text-primary/secondary, --color-primary-soft,
   --color-success, --color-success-soft) that flip automatically in
   body--dark via tokens.css.  Only the few values that can't be expressed
   as a single shared token need explicit overrides here. */

/* thead sticky background must match the dark surface-soft token */
.body--dark .rk-grid thead th {
  background: var(--surface-soft);
  border-bottom-color: var(--border-color);
  color: var(--text-secondary);
}
/* weekend column: re-use a subtle cyan tint darker in dark mode */
.body--dark .rk-grid-day--weekend { background: var(--color-primary-soft); }
/* today column: stronger tint so it's visible on dark surface */
.body--dark .rk-grid-day--today {
  background: var(--color-primary-soft) !important;
  color: var(--color-primary);
}
/* Sticky employee column uses card-background token — already correct.
   Only the border tokens need the dark values, handled by token.css. */
.body--dark .rk-grid-emp__name { color: var(--text-primary); }
.body--dark .rk-grid-emp__role { color: var(--text-secondary); }
/* Cell borders: lighter than surface-soft in dark mode */
.body--dark .rk-grid-cell {
  border-bottom-color: var(--border-color);
  border-right-color: var(--border-color);
}
.body--dark .rk-grid-cell:hover { background: var(--color-primary-soft); }
.body--dark .rk-grid-cell--weekend { background: var(--surface-soft); }
.body--dark .rk-grid-cell--today { background: var(--color-primary-soft); }
.body--dark .rk-grid-cell--has-shifts { background: var(--color-success-soft); }
.body--dark .rk-grid-cell--off { color: var(--text-muted); }
.body--dark .rk-grid-empty { color: var(--text-muted); }
.body--dark .rk-grid-seg { color: var(--color-success); }

@media (max-width: 768px) {
  .rk-grid-corner { min-width: 160px; }
  .rk-grid-emp { min-width: 160px; }
  .rk-grid-day { min-width: 64px; }
  .rk-grid-cell { min-width: 64px; height: 48px; }
  .rk-grid-seg { font-size: 10px; }
  .rk-actions-row { justify-content: flex-start; }
}
</style>
