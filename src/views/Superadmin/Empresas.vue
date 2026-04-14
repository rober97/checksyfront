<template>
  <q-page padding>
    <div class="sa-shell">
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-h5 text-weight-bold">
            <q-icon name="apartment" class="text-deep-purple q-mr-sm" />
            Empresas cliente
          </div>
          <div class="text-caption text-grey-7">
            Cada empresa cliente tiene uno o más admin_rrhh que la administran.
            Al crear una empresa debes asignarle al menos un admin_rrhh.
          </div>
        </div>
        <q-btn
          color="primary" icon="add_business" unelevated
          label="Nueva empresa"
          to="/superadmin/empresas/new"
        />
      </div>

      <q-card flat bordered>
        <q-table
          :rows="companies"
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
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                size="sm" flat icon="visibility" color="primary"
                :to="`/superadmin/empresas/${props.row._id}`"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import secureAxios from '@/utils/secureRequest'

const companies = ref([])
const loading = ref(false)

const columns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
  { name: 'rut', label: 'RUT', field: 'rut', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  { name: 'createdAt', label: 'Creada', field: (r) => new Date(r.createdAt).toLocaleDateString('es-CL'), align: 'left' },
  { name: 'actions', label: '', field: '_id', align: 'center' },
]

function pickArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.companies)) return data.companies
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await secureAxios.get('/companies')
    companies.value = pickArray(data)
  } catch (err) {
    console.error('[SuperadminEmpresas] load error:', err)
    companies.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.sa-shell { max-width: 1200px; margin: 0 auto; }
</style>
