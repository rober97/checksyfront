<template>
  <q-page>
    <div class="rk-module-shell">
      <section class="rk-module-header">
        <div class="rk-module-icon">
          <q-icon name="schedule" size="28px" />
        </div>
        <div class="col">
          <h1 class="rk-module-title">Horarios laborales</h1>
          <p class="rk-module-subtitle">
            Centraliza los turnos por empresa con la misma línea visual del módulo de asistencias.
          </p>
        </div>
        <div class="rk-module-actions">
          <q-btn unelevated color="primary" icon="add" label="Nuevo horario" @click="openNewScheduleDialog" />
        </div>
      </section>

      <section class="rk-module-grid rk-module-grid--2">
        <div class="rk-module-stat">
          <div class="rk-module-stat__icon">
            <q-icon name="apartment" size="20px" />
          </div>
          <div>
            <div class="rk-module-stat__label">Empresas</div>
            <div class="rk-module-stat__value">{{ companyOptions.length }}</div>
          </div>
        </div>

        <div class="rk-module-stat">
          <div class="rk-module-stat__icon">
            <q-icon name="pending_actions" size="20px" />
          </div>
          <div>
            <div class="rk-module-stat__label">Horarios cargados</div>
            <div class="rk-module-stat__value">{{ scheduleList.length }}</div>
          </div>
        </div>
      </section>

      <section class="rk-module-panel">
        <div class="rk-module-panel__section">
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-12 col-md">
              <div class="rk-module-panel__title">Listado de horarios</div>
              <p class="rk-module-panel__caption">
                Revisa la jornada configurada por empresa y mantén el catálogo ordenado.
              </p>
            </div>
            <div class="col-12 col-md-auto">
              <q-input
                v-model="filter"
                dense
                outlined
                clearable
                placeholder="Buscar empresa u horario"
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>

          <q-table
            :rows="filteredSchedules"
            :columns="tableColumns"
            row-key="_id"
            flat
            bordered
            :pagination="{ rowsPerPage: 8 }"
            :loading="loading"
            no-data-label="No hay horarios registrados"
          >
            <template #body-cell-summary="props">
              <q-td :props="props">
                <div class="rk-week-chips">
                  <q-chip
                    v-for="group in props.row.summaryGroups"
                    :key="group.key"
                    dense
                    square
                    color="primary"
                    text-color="white"
                    class="rk-week-chip"
                  >
                    <span class="rk-week-chip__days">{{ group.label }}</span>
                    <span class="rk-week-chip__time">{{ group.time }}</span>
                  </q-chip>
                  <q-chip
                    v-if="!props.row.summaryGroups.length"
                    dense
                    square
                    color="grey-4"
                    text-color="grey-8"
                  >
                    Sin jornada
                  </q-chip>
                </div>
              </q-td>
            </template>

            <template #body-cell-hours="props">
              <q-td :props="props" class="text-right">
                <span class="rk-weekly-hours">{{ props.row.totalHours }} h/sem</span>
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn flat dense round icon="edit" @click="openEditScheduleDialog(props.row)">
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>
                <q-btn flat dense round icon="delete" color="negative" @click="confirmDelete(props.row)">
                  <q-tooltip>Eliminar</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </div>
      </section>
    </div>

    <q-dialog v-model="isDialogOpen" persistent>
      <q-card style="min-width: min(680px, 94vw)">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-h6">{{ editingId ? 'Editar horario' : 'Crear horario laboral' }}</div>
            <div class="text-caption text-grey-6">Define la jornada día por día. Los días desactivados cuentan como libres.</div>
          </div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="scheduleForm.companyId"
                label="Empresa"
                :options="companyOptions"
                option-value="id"
                option-label="name"
                dense
                outlined
                emit-value
                map-options
                :disable="!!editingId"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="scheduleForm.name"
                label="Nombre del horario"
                dense
                outlined
              />
            </div>
          </div>

          <q-separator />

          <div class="row items-center justify-between">
            <div class="text-subtitle2">Jornada semanal</div>
            <div class="rk-quick-actions">
              <q-btn size="sm" flat dense label="Lun-Vie 09-19" @click="applyPreset('weekdays')" />
              <q-btn size="sm" flat dense label="Lun-Sáb 09-18" @click="applyPreset('montosat')" />
              <q-btn size="sm" flat dense label="Copiar Lunes a todos" @click="copyMondayToAll" />
              <q-btn size="sm" flat dense label="Limpiar" color="negative" @click="clearAllDays" />
            </div>
          </div>

          <div class="rk-days-editor">
            <div
              v-for="day in dayDefs"
              :key="day.key"
              class="rk-day-row"
              :class="{ 'rk-day-row--off': !scheduleForm.weekly[day.key].enabled }"
            >
              <q-toggle
                v-model="scheduleForm.weekly[day.key].enabled"
                :label="day.label"
                class="rk-day-toggle"
              />
              <div class="rk-day-times">
                <q-input
                  v-model="scheduleForm.weekly[day.key].start"
                  mask="##:##"
                  dense
                  outlined
                  placeholder="09:00"
                  :disable="!scheduleForm.weekly[day.key].enabled"
                  style="width: 110px"
                >
                  <template #prepend><q-icon name="login" size="16px" /></template>
                </q-input>
                <span class="text-grey-6">—</span>
                <q-input
                  v-model="scheduleForm.weekly[day.key].end"
                  mask="##:##"
                  dense
                  outlined
                  placeholder="19:00"
                  :disable="!scheduleForm.weekly[day.key].enabled"
                  style="width: 110px"
                >
                  <template #prepend><q-icon name="logout" size="16px" /></template>
                </q-input>
              </div>
              <div class="rk-day-hours">
                <q-chip
                  v-if="scheduleForm.weekly[day.key].enabled"
                  dense
                  square
                  color="grey-3"
                  text-color="grey-9"
                >
                  {{ dayHours(day.key) }} h
                </q-chip>
                <span v-else class="text-grey-5 text-caption">Libre</span>
              </div>
            </div>
          </div>

          <div class="row justify-end">
            <q-chip dense square color="primary" text-color="white">
              Total semanal: {{ totalFormHours }} h
            </q-chip>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" :label="editingId ? 'Guardar cambios' : 'Crear horario'" @click="saveSchedule" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useQuasar } from 'quasar'
import { useCompaniesStore } from '@/stores/companies'

const toast = useToast()
const $q = useQuasar()
const companiesStore = useCompaniesStore()

const scheduleList = ref([])
const companyOptions = ref([])
const isDialogOpen = ref(false)
const editingId = ref(null)
const loading = ref(false)
const filter = ref('')

const dayDefs = [
  { key: 'mon', label: 'Lunes', short: 'Lun' },
  { key: 'tue', label: 'Martes', short: 'Mar' },
  { key: 'wed', label: 'Miércoles', short: 'Mié' },
  { key: 'thu', label: 'Jueves', short: 'Jue' },
  { key: 'fri', label: 'Viernes', short: 'Vie' },
  { key: 'sat', label: 'Sábado', short: 'Sáb' },
  { key: 'sun', label: 'Domingo', short: 'Dom' },
]

function emptyWeekly() {
  return dayDefs.reduce((acc, d) => {
    acc[d.key] = { enabled: false, start: '09:00', end: '18:00' }
    return acc
  }, {})
}

const scheduleForm = ref({
  companyId: null,
  name: '',
  weekly: emptyWeekly(),
})

/* ---------- Helpers tiempo ---------- */
function toMinutes(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (h > 23 || m > 59) return null
  return h * 60 + m
}
function diffHours(start, end) {
  const s = toMinutes(start)
  let e = toMinutes(end)
  if (s == null || e == null) return 0
  if (e < s) e += 24 * 60 // turno cruza medianoche
  return +((e - s) / 60).toFixed(2)
}
function dayHours(key) {
  const d = scheduleForm.value.weekly[key]
  return diffHours(d.start, d.end)
}
const totalFormHours = computed(() => {
  return dayDefs.reduce((sum, d) => {
    const day = scheduleForm.value.weekly[d.key]
    return sum + (day.enabled ? diffHours(day.start, day.end) : 0)
  }, 0).toFixed(1)
})

/* ---------- Visualización: agrupar días contiguos con mismo horario ---------- */
function buildSummaryGroups(weekly) {
  const entries = dayDefs.map((d) => {
    const seg = Array.isArray(weekly?.[d.key]) ? weekly[d.key][0] : null
    if (!seg || !seg.start || !seg.end) return { day: d, time: null }
    return { day: d, time: `${seg.start}-${seg.end}` }
  })

  const groups = []
  let i = 0
  while (i < entries.length) {
    const cur = entries[i]
    if (!cur.time) { i++; continue }
    let j = i
    while (j + 1 < entries.length && entries[j + 1].time === cur.time) j++
    const label = i === j
      ? cur.day.short
      : `${entries[i].day.short}-${entries[j].day.short}`
    groups.push({ key: `${i}-${j}-${cur.time}`, label, time: cur.time })
    i = j + 1
  }
  return groups
}

function calcTotalHours(weekly) {
  return dayDefs.reduce((sum, d) => {
    const seg = Array.isArray(weekly?.[d.key]) ? weekly[d.key][0] : null
    if (!seg) return sum
    return sum + diffHours(seg.start, seg.end)
  }, 0).toFixed(1)
}

/* ---------- Normalización de filas ---------- */
function normalizeRow(schedule, companyName) {
  const weekly = schedule.weekly || {}
  // Si sólo vino startTime/endTime (legacy), lo expandimos virtualmente
  if (!Object.keys(weekly).length && schedule.startTime && schedule.endTime) {
    const seg = [{ start: schedule.startTime, end: schedule.endTime }]
    weekly.mon = seg; weekly.tue = seg; weekly.wed = seg; weekly.thu = seg; weekly.fri = seg
    weekly.sat = []; weekly.sun = []
  }
  return {
    ...schedule,
    _id: schedule._id || schedule.id || '',
    companyName,
    weekly,
    summaryGroups: buildSummaryGroups(weekly),
    totalHours: calcTotalHours(weekly),
  }
}

/* ---------- Tabla ---------- */
const tableColumns = [
  { name: 'company', label: 'Empresa', field: 'companyName', align: 'left', sortable: true },
  { name: 'name', label: 'Horario', field: 'name', align: 'left', sortable: true },
  { name: 'summary', label: 'Jornada semanal', field: 'name', align: 'left' },
  { name: 'hours', label: 'Horas', field: 'totalHours', align: 'right', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const filteredSchedules = computed(() => {
  const query = filter.value.trim().toLowerCase()
  if (!query) return scheduleList.value
  return scheduleList.value.filter((s) =>
    [s.companyName, s.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(query))
  )
})

/* ---------- Acciones rápidas del editor ---------- */
function applyPreset(kind) {
  const fresh = emptyWeekly()
  if (kind === 'weekdays') {
    ;['mon', 'tue', 'wed', 'thu', 'fri'].forEach((k) => {
      fresh[k] = { enabled: true, start: '09:00', end: '19:00' }
    })
  } else if (kind === 'montosat') {
    ;['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach((k) => {
      fresh[k] = { enabled: true, start: '09:00', end: '18:00' }
    })
  }
  scheduleForm.value.weekly = fresh
}

function copyMondayToAll() {
  const mon = scheduleForm.value.weekly.mon
  dayDefs.forEach((d) => {
    if (d.key === 'mon') return
    scheduleForm.value.weekly[d.key] = { ...mon }
  })
}

function clearAllDays() {
  scheduleForm.value.weekly = emptyWeekly()
}

/* ---------- Diálogo ---------- */
function openNewScheduleDialog() {
  editingId.value = null
  scheduleForm.value = {
    companyId: null,
    name: '',
    weekly: emptyWeekly(),
  }
  applyPreset('weekdays')
  isDialogOpen.value = true
}

function openEditScheduleDialog(row) {
  editingId.value = row._id
  const weekly = emptyWeekly()
  dayDefs.forEach((d) => {
    const seg = Array.isArray(row.weekly?.[d.key]) ? row.weekly[d.key][0] : null
    if (seg && seg.start && seg.end) {
      weekly[d.key] = { enabled: true, start: seg.start, end: seg.end }
    }
  })
  scheduleForm.value = {
    companyId: row.companyId || row.company || null,
    name: row.name || '',
    weekly,
  }
  isDialogOpen.value = true
}

/* ---------- Guardar ---------- */
function buildWeeklyPayload() {
  const out = {}
  dayDefs.forEach((d) => {
    const day = scheduleForm.value.weekly[d.key]
    out[d.key] = day.enabled && day.start && day.end
      ? [{ start: day.start, end: day.end }]
      : []
  })
  return out
}

async function saveSchedule() {
  const { companyId, name } = scheduleForm.value
  if (!companyId || !name?.trim()) {
    toast.error('Empresa y nombre son obligatorios.')
    return
  }
  const weekly = buildWeeklyPayload()
  const anyEnabled = Object.values(weekly).some((arr) => arr.length > 0)
  if (!anyEnabled) {
    toast.error('Activa al menos un día con horario.')
    return
  }

  try {
    if (editingId.value) {
      const updated = await companiesStore.updateWorkSchedule(editingId.value, {
        name: name.trim(),
        weekly,
      })
      const company = companyOptions.value.find((c) => c.id === companyId)
      const idx = scheduleList.value.findIndex((s) => s._id === editingId.value)
      if (idx !== -1) {
        scheduleList.value[idx] = normalizeRow(updated, company?.name || scheduleList.value[idx].companyName)
      }
      toast.success('Horario actualizado.')
    } else {
      const created = await companiesStore.createWorkSchedule({
        company: companyId,
        name: name.trim(),
        weekly,
      })
      const company = companyOptions.value.find((c) => c.id === companyId)
      scheduleList.value.push(normalizeRow(created, company?.name || 'Desconocida'))
      toast.success('Horario creado correctamente.')
    }
    isDialogOpen.value = false
  } catch (err) {
    toast.error('No se pudo guardar el horario.')
  }
}

function confirmDelete(row) {
  $q.dialog({
    title: 'Eliminar horario',
    message: `¿Seguro que deseas eliminar "${row.name}"? Esta acción no se puede deshacer.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true },
  }).onOk(async () => {
    try {
      await companiesStore.deleteWorkSchedule(row._id)
      scheduleList.value = scheduleList.value.filter((s) => s._id !== row._id)
      toast.success('Horario eliminado.')
    } catch {
      toast.error('No se pudo eliminar el horario.')
    }
  })
}

/* ---------- Carga inicial ---------- */
async function loadCompanyOptions() {
  await companiesStore.fetchCompanies()
  companyOptions.value = companiesStore.companies.map((c) => ({ id: c._id, name: c.name }))
}

async function loadSchedulesForAllCompanies() {
  if (!companyOptions.value.length) return
  loading.value = true
  scheduleList.value = []
  try {
    for (const company of companyOptions.value) {
      await companiesStore.fetchWorkSchedulesByCompany(company.id)
      companiesStore.workSchedules.forEach((schedule) => {
        scheduleList.value.push(normalizeRow(schedule, company.name))
      })
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCompanyOptions()
  await loadSchedulesForAllCompanies()
})
</script>

<style scoped>
.rk-week-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.rk-week-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 8px;
}
.rk-week-chip__days {
  font-weight: 600;
}
.rk-week-chip__time {
  opacity: 0.9;
}
.rk-weekly-hours {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #334155;
}
.rk-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.rk-days-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #f8fafc;
}
.rk-day-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 8px;
  background: #fff;
  transition: background 0.15s;
}
.rk-day-row--off {
  background: #f1f5f9;
  opacity: 0.75;
}
.rk-day-toggle {
  font-weight: 500;
}
.rk-day-times {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rk-day-hours {
  min-width: 64px;
  text-align: right;
}
@media (max-width: 600px) {
  .rk-day-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .rk-day-hours { text-align: left; }
}
</style>
