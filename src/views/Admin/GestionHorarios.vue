<template>
  <q-page padding>
    <q-card flat class="q-pa-md">
      <q-card-section class="text-h6 row items-center q-gutter-sm">
        <q-icon name="schedule" size="sm" />
        Horarios Laborales por Empresa
        <q-space />
        <q-btn icon="add" color="primary" @click="openNewScheduleDialog" dense />
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="scheduleList"
          :columns="tableColumns"
          row-key="id"
          flat
          bordered
        />
      </q-card-section>
    </q-card>

    <q-dialog v-model="isDialogOpen">
      <q-card style="min-width: 400px">
        <q-card-section class="text-h6">Crear Horario Laboral</q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-select
            v-model="scheduleForm.companyId"
            label="Empresa"
            :options="companyOptions"
            option-value="id"
            option-label="name"
            dense outlined emit-value map-options
            :rules="[val => !!val || 'Selecciona empresa']"
          />

          <q-input
            v-model="scheduleForm.name"
            label="Nombre del horario"
            dense outlined
            :rules="[val => !!val || 'Requerido']"
          />

          <q-input
            v-model="scheduleForm.startTime"
            label="Hora de entrada (HH:mm)"
            mask="##:##"
            dense outlined
            :rules="[val => !!val || 'Requerido']"
          />

          <q-input
            v-model="scheduleForm.endTime"
            label="Hora de salida (HH:mm)"
            mask="##:##"
            dense outlined
            :rules="[val => !!val || 'Requerido']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="isDialogOpen = false" />
          <q-btn color="primary" label="Guardar" @click="saveSchedule" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useCompaniesStore } from '@/stores/companies'

const toast = useToast()
const companiesStore = useCompaniesStore()

const scheduleList = ref([])
const companyOptions = ref([])
const isDialogOpen = ref(false)

const scheduleForm = ref({
  companyId: null,
  name: '',
  startTime: '',
  endTime: ''
})

const tableColumns = [
  { name: 'company', label: 'Empresa', field: 'companyName', align: 'left' },
  { name: 'name', label: 'Horario', field: 'name', align: 'left' },
  { name: 'startTime', label: 'Entrada', field: 'startTime', align: 'left' },
  { name: 'endTime', label: 'Salida', field: 'endTime', align: 'left' }
]

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

    const company = companyOptions.value.find((c) => c.id === companyId)

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
  companyOptions.value = companiesStore.companies.map((c) => ({
    id: c._id,
    name: c.name
  }))
}

async function loadSchedulesForSelectedCompany() {
  if (companyOptions.value.length === 0) return
  for (const company of companyOptions.value) {
    await companiesStore.fetchWorkSchedulesByCompany(company.id)
    companiesStore.workSchedules.forEach((schedule) => {
      scheduleList.value.push({
        ...schedule,
        companyName: company.name
      })
    })
  }
}

onMounted(async () => {
  await loadCompanyOptions()
  await loadSchedulesForSelectedCompany()
})
</script>

