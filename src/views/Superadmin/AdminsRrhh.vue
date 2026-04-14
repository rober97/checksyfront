<template>
  <q-page padding>
    <div class="sa-shell">
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-h5 text-weight-bold">
            <q-icon name="badge" class="text-primary q-mr-sm" />
            Administradores de RR.HH.
          </div>
          <div class="text-caption text-grey-7">
            Usuarios con rol <b>admin_rrhh</b>. Cada uno administra UNA empresa
            cliente y sólo ve los datos de su propia empresa.
          </div>
        </div>
        <q-btn
          color="primary" icon="person_add" unelevated
          label="Nuevo admin RR.HH."
          @click="openDialog = true"
        />
      </div>

      <q-card flat bordered>
        <q-table
          :rows="rows"
          :columns="columns"
          :loading="loading"
          row-key="_id"
          flat
          :pagination="{ rowsPerPage: 15 }"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.status === 'active' ? 'positive' : 'grey'"
                text-color="white" dense
              >
                {{ props.row.status }}
              </q-chip>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <q-dialog v-model="openDialog">
      <q-card style="min-width:520px">
        <q-card-section>
          <div class="text-h6">Nuevo administrador RR.HH.</div>
          <div class="text-caption text-grey-7">
            Este usuario administrará los empleados, horarios, nómina y reportes
            DT de la empresa seleccionada.
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input v-model="form.firstName" label="Nombre *" outlined dense />
          <q-input v-model="form.lastName" label="Apellido *" outlined dense class="q-mt-sm" />
          <q-input v-model="form.email" label="Email corporativo *" outlined dense class="q-mt-sm" />
          <q-input v-model="form.rut" label="RUT (ej 12345678-9) *" outlined dense class="q-mt-sm" />
          <q-input v-model="form.password" label="Contraseña inicial *" type="password" outlined dense class="q-mt-sm" />
          <q-select
            v-model="form.company"
            :options="companyOptions"
            label="Empresa *"
            outlined dense emit-value map-options
            class="q-mt-sm"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            unelevated color="primary" label="Crear"
            :loading="saving" :disable="!canSubmit"
            @click="create"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'

const $q = useQuasar()
const rows = ref([])
const loading = ref(false)
const openDialog = ref(false)
const saving = ref(false)
const companyOptions = ref([])

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  rut: '',
  password: '',
  company: '',
})

const columns = [
  { name: 'name', label: 'Nombre', field: (r) => `${r.firstName} ${r.lastName}`, align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'rut', label: 'RUT', field: 'rut', align: 'left' },
  { name: 'company', label: 'Empresa', field: (r) => r.company?.name || '—', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
]

const canSubmit = computed(
  () =>
    form.firstName &&
    form.lastName &&
    form.email &&
    form.rut &&
    form.password &&
    form.company
)

function pickArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.users)) return data.users
  if (Array.isArray(data?.companies)) return data.companies
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

async function load() {
  loading.value = true
  try {
    const { data } = await secureAxios.get('/users?role=admin_rrhh')
    const users = pickArray(data)
    rows.value = users.filter((u) => u.role === 'admin_rrhh')
  } catch (err) {
    console.error('[AdminsRrhh] load error:', err)
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function loadCompanies() {
  try {
    const { data } = await secureAxios.get('/companies')
    const cs = pickArray(data)
    companyOptions.value = cs.map((c) => ({ label: `${c.name} (${c.rut})`, value: c._id }))
  } catch (err) {
    console.error('[AdminsRrhh] companies error:', err)
    companyOptions.value = []
  }
}

async function create() {
  saving.value = true
  try {
    await secureAxios.post('/users', {
      role: 'admin_rrhh',
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email.toLowerCase(),
      rut: form.rut,
      password: form.password,
      company: form.company,
      status: 'active',
    })
    $q.notify({ type: 'positive', message: 'Administrador creado' })
    openDialog.value = false
    Object.assign(form, { firstName: '', lastName: '', email: '', rut: '', password: '', company: '' })
    await load()
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  load()
  loadCompanies()
})
</script>

<style scoped>
.sa-shell { max-width: 1200px; margin: 0 auto; }
</style>
