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
            row-key="id"
            flat
            bordered
            :pagination="{ rowsPerPage: 8 }"
            :loading="loading"
            no-data-label="No hay horarios registrados"
          />
        </div>
      </section>
    </div>

    <q-dialog v-model="isDialogOpen">
      <q-card style="min-width: min(560px, 92vw)">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-h6">Crear horario laboral</div>
            <div class="text-caption text-grey-6">Mantén horarios consistentes para cada empresa.</div>
          </div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-md">
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
            :rules="[val => !!val || 'Selecciona empresa']"
          />

          <q-input
            v-model="scheduleForm.name"
            label="Nombre del horario"
            dense
            outlined
            :rules="[val => !!val || 'Requerido']"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="scheduleForm.startTime"
                label="Hora de entrada"
                mask="##:##"
                dense
                outlined
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="scheduleForm.endTime"
                label="Hora de salida"
                mask="##:##"
                dense
                outlined
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Guardar" @click="saveSchedule" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useCompaniesStore } from '@/stores/companies'

const toast = useToast()
const companiesStore = useCompaniesStore()

const scheduleList = ref([])
const companyOptions = ref([])
const isDialogOpen = ref(false)
const loading = ref(false)
const filter = ref('')

const scheduleForm = ref({
  companyId: null,
  name: '',
  startTime: '',
  endTime: ''
})

const tableColumns = [
  { name: 'company', label: 'Empresa', field: 'companyName', align: 'left', sortable: true },
  { name: 'name', label: 'Horario', field: 'name', align: 'left', sortable: true },
  { name: 'startTime', label: 'Entrada', field: 'startTime', align: 'left', sortable: true },
  { name: 'endTime', label: 'Salida', field: 'endTime', align: 'left', sortable: true }
]

const filteredSchedules = computed(() => {
  const query = filter.value.trim().toLowerCase()
  if (!query) return scheduleList.value

  return scheduleList.value.filter((schedule) =>
    [schedule.companyName, schedule.name, schedule.startTime, schedule.endTime]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  )
})

function openNewScheduleDialog() {
  scheduleForm.value = {
    companyId: null,
    name: '',
    startTime: '',
    endTime: ''
  }
  isDialogOpen.value = true
}

async function saveSchedule() {
  const { companyId, name, startTime, endTime } = scheduleForm.value

  if (!companyId || !name || !startTime || !endTime) {
    toast.error('Completa todos los campos obligatorios.')
    return
  }

  try {
    const result = await companiesStore.createWorkSchedule({
      company: companyId,
      name,
      startTime,
      endTime
    })

    const company = companyOptions.value.find((item) => item.id === companyId)

    scheduleList.value.push({
      ...result,
      companyName: company?.name || 'Desconocida'
    })

    toast.success('Horario creado correctamente.')
    isDialogOpen.value = false
  } catch (err) {
    toast.error('No se pudo guardar el horario.')
  }
}

async function loadCompanyOptions() {
  await companiesStore.fetchCompanies()
  companyOptions.value = companiesStore.companies.map((company) => ({
    id: company._id,
    name: company.name
  }))
}

async function loadSchedulesForSelectedCompany() {
  if (!companyOptions.value.length) return

  loading.value = true
  scheduleList.value = []

  try {
    for (const company of companyOptions.value) {
      await companiesStore.fetchWorkSchedulesByCompany(company.id)
      companiesStore.workSchedules.forEach((schedule) => {
        scheduleList.value.push({
          ...schedule,
          companyName: company.name
        })
      })
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCompanyOptions()
  await loadSchedulesForSelectedCompany()
})
</script>
