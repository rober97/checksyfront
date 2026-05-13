<template>
  <div class="rk-tab-content">
    <div class="rk-module-shell rk-module-shell--embedded">
      <!-- Toolbar -->
      <section class="rk-module-panel">
        <div class="rk-module-panel__section">
          <div class="row items-center q-col-gutter-md">
            <div v-if="companyOptions.length > 1" class="col-12 col-md-4">
              <q-select
                v-model="companyId"
                :options="companyOptions"
                option-value="id"
                option-label="name"
                emit-value
                map-options
                label="Empresa"
                dense
                outlined
              />
            </div>
            <div class="col-12 col-md">
              <div class="rk-module-panel__title">Asignaciones de plantilla</div>
              <p class="rk-module-panel__caption">
                Define qué plantilla de horario usa cada empleado. Una sola asignación activa por persona.
              </p>
            </div>
            <div class="col-12 col-md-auto">
              <q-input v-model="filter" dense outlined clearable placeholder="Buscar empleado">
                <template #prepend><q-icon name="search" /></template>
              </q-input>
            </div>
          </div>
        </div>
      </section>

      <section class="rk-module-grid rk-module-grid--2 q-mt-md">
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
      </section>

      <section v-if="!companyId" class="rk-module-panel q-mt-md">
        <div class="rk-module-panel__section text-center q-py-lg">
          <q-icon name="apartment" size="32px" class="text-grey-6" />
          <p class="text-grey-7 q-mt-sm">Selecciona una empresa para gestionar sus asignaciones.</p>
        </div>
      </section>

      <section v-else class="rk-module-panel q-mt-md">
        <div class="rk-module-panel__section">
          <q-table
            :rows="filteredRows"
            :columns="columns"
            row-key="userId"
            flat
            bordered
            :loading="loading"
            :pagination="{ rowsPerPage: 12 }"
            no-data-label="No hay empleados en esta empresa"
          >
            <template #body-cell-employee="props">
              <q-td :props="props">
                <div class="row items-center no-wrap">
                  <q-avatar size="30px" color="primary" text-color="white" class="q-mr-sm">
                    <img v-if="props.row.user.profilePicture" :src="props.row.user.profilePicture" />
                    <span v-else>{{ props.row.initials }}</span>
                  </q-avatar>
                  <div>
                    <div class="text-weight-medium">{{ props.row.user.firstName }} {{ props.row.user.lastName }}</div>
                    <div class="text-caption text-grey-6">{{ props.row.user.email }}</div>
                  </div>
                </div>
              </q-td>
            </template>

            <template #body-cell-template="props">
              <q-td :props="props">
                <q-chip
                  v-if="props.row.assignment && props.row.assignment.scheduleId"
                  dense square color="primary" text-color="white" icon="schedule"
                >{{ props.row.assignment.scheduleId.name || 'Plantilla' }}</q-chip>
                <q-chip
                  v-else-if="props.row.assignment"
                  dense square color="cyan-6" text-color="white" icon="event_repeat"
                >Turnos por demanda</q-chip>
                <q-chip
                  v-else
                  dense square color="orange-4" text-color="white" icon="warning"
                >Sin asignación</q-chip>
              </q-td>
            </template>

            <template #body-cell-since="props">
              <q-td :props="props">
                <span v-if="props.row.assignment?.validFrom" class="text-grey-8">
                  {{ formatDate(props.row.assignment.validFrom) }}
                </span>
                <span v-else class="text-grey-5">—</span>
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  flat dense no-caps size="sm"
                  :icon="props.row.assignment ? 'swap_horiz' : 'add'"
                  :label="props.row.assignment ? 'Cambiar' : 'Asignar'"
                  color="primary"
                  @click="openAssignDialog(props.row)"
                />
                <q-btn
                  v-if="props.row.assignment"
                  flat dense round size="sm" icon="link_off" color="negative"
                  @click="confirmEnd(props.row)"
                >
                  <q-tooltip>Quitar asignación</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </div>
      </section>
    </div>

    <!-- Diálogo: asignar / cambiar plantilla -->
    <q-dialog v-model="assignDialog.open" persistent>
      <q-card class="rk-assign-dialog" style="min-width: min(640px, 94vw)">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="rk-assign-title">Asignar plantilla de horario</div>
            <div class="rk-assign-subtitle">{{ assignDialog.userName }}</div>
          </div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <SchedulePicker
            v-model="assignDialog.choice"
            :company-id="companyId"
            :company="companyObj"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            unelevated color="primary" label="Guardar asignación" no-caps
            :loading="assignDialog.saving"
            @click="saveAssignment"
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
import { useAuthStore } from '@/stores/authStore'
import SchedulePicker from '@/components/users/SchedulePicker.vue'

const $q = useQuasar()
const toast = useToast()
const companiesStore = useCompaniesStore()
const authStore = useAuthStore()

const isSuperadmin = computed(() => authStore.user?.role === 'superadmin')

const companyOptions = ref([])
const companyId = ref(null)
const companyObj = computed(() => companiesStore.companies.find((c) => c._id === companyId.value) || { _id: companyId.value })

const loading = ref(false)
const assignments = ref([])
const unassigned = ref([])
const filter = ref('')

const columns = [
  { name: 'employee', label: 'Empleado', field: 'employee', align: 'left' },
  { name: 'template', label: 'Plantilla asignada', field: 'template', align: 'left' },
  { name: 'since', label: 'Vigente desde', field: 'since', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

function initialsOf(u) {
  const f = (u?.firstName || '').trim()
  const l = (u?.lastName || '').trim()
  return ((f[0] || '') + (l[0] || '')).toUpperCase() || '?'
}

const rows = computed(() => {
  const out = []
  for (const a of assignments.value) {
    if (!a.userId) continue
    out.push({ userId: String(a.userId._id), user: a.userId, initials: initialsOf(a.userId), assignment: a })
  }
  for (const u of unassigned.value) {
    out.push({ userId: String(u._id), user: u, initials: initialsOf(u), assignment: null })
  }
  out.sort((a, b) => {
    const an = `${a.user.firstName || ''} ${a.user.lastName || ''}`.toLowerCase()
    const bn = `${b.user.firstName || ''} ${b.user.lastName || ''}`.toLowerCase()
    return an.localeCompare(bn)
  })
  return out
})

const filteredRows = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((r) =>
    [`${r.user.firstName} ${r.user.lastName}`, r.user.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  )
})

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return '' }
}

/* ---------- carga ---------- */
async function loadCompanies() {
  try {
    await companiesStore.fetchCompanies()
    companyOptions.value = (companiesStore.companies || []).map((c) => ({ id: c._id, name: c.name }))
  } catch { companyOptions.value = [] }

  const active = authStore.user?.company || null
  if (active && companyOptions.value.some((c) => c.id === active)) {
    companyId.value = active
  } else if (companyOptions.value.length) {
    companyId.value = companyOptions.value[0].id
  } else {
    companyId.value = active // último recurso (admin con 1 empresa que no vino en el listado)
  }
}

async function refresh() {
  if (!companyId.value) { assignments.value = []; unassigned.value = []; return }
  loading.value = true
  try {
    const { assignments: a, unassigned: u } = await companiesStore.fetchAssignmentsByCompany(companyId.value)
    assignments.value = a
    unassigned.value = u
  } finally {
    loading.value = false
  }
}

// Un único watcher cubre el caso inicial (companyId pasa de null al valor real
// que setea loadCompanies) y los cambios manuales del selector. Evita el
// segundo fetch redundante que provocaba el patrón "onMounted + refresh".
let pendingFetch = null
watch(companyId, (id) => {
  if (!id) { assignments.value = []; unassigned.value = []; return }
  if (pendingFetch === id) return
  pendingFetch = id
  refresh().finally(() => { pendingFetch = null })
})

/* ---------- asignar / cambiar ---------- */
const assignDialog = reactive({
  open: false,
  saving: false,
  userId: null,
  userName: '',
  choice: { mode: 'fixed', scheduleId: null },
})

function openAssignDialog(row) {
  assignDialog.userId = row.userId
  assignDialog.userName = `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim()
  const a = row.assignment
  assignDialog.choice = a
    ? { mode: a.scheduleId ? 'fixed' : 'oncall', scheduleId: a.scheduleId?._id || a.scheduleId || null }
    : { mode: 'fixed', scheduleId: null }
  assignDialog.open = true
}

async function saveAssignment() {
  const choice = assignDialog.choice || {}
  const isOncall = choice.mode === 'oncall'
  if (!isOncall && !choice.scheduleId) {
    toast.error('Selecciona una plantilla o elige "Turnos por demanda".')
    return
  }
  assignDialog.saving = true
  try {
    await companiesStore.createAssignment(assignDialog.userId, {
      companyId: companyId.value,
      scheduleId: isOncall ? null : choice.scheduleId,
    })
    toast.success('Asignación guardada.')
    assignDialog.open = false
    await refresh()
  } catch (err) {
    toast.error(err.message || 'No se pudo guardar la asignación.')
  } finally {
    assignDialog.saving = false
  }
}

function confirmEnd(row) {
  $q.dialog({
    title: 'Quitar asignación',
    message: `¿Quitar la plantilla asignada a ${row.user.firstName} ${row.user.lastName}? Quedará sin horario hasta que asignes otra.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Quitar', color: 'negative', unelevated: true },
  }).onOk(async () => {
    try {
      await companiesStore.endAssignment(row.userId, row.assignment._id)
      toast.success('Asignación finalizada.')
      await refresh()
    } catch (err) {
      toast.error(err.message || 'No se pudo finalizar la asignación.')
    }
  })
}

onMounted(async () => {
  // loadCompanies setea companyId → el watcher dispara el refresh
  await loadCompanies()
})
</script>

<style scoped>
.rk-assign-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.2px;
  line-height: 1.25;
  color: #0f1117;
}
.rk-assign-subtitle {
  font-size: 12.5px;
  font-weight: 500;
  margin-top: 2px;
  color: #5a6482;
}
.body--dark .rk-assign-title { color: #e8eaf2; }
.body--dark .rk-assign-subtitle { color: #9aa3b2; }
</style>
