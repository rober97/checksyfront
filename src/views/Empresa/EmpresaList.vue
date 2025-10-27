<template>
  <q-page class="q-pa-md companies-page">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-icon name="business" size="28px" class="q-mr-sm" color="primary" />
        <div class="column">
          <div class="text-h6 page-title" :class="titleClass">Empresas</div>
          <div class="text-caption text-grey-7">
            Administra datos básicos, políticas de vacaciones y feriados.
          </div>
        </div>
      </div>
      <q-btn
        color="primary"
        icon="add"
        label="Nueva"
        no-caps
        unelevated
        class="elev"
        @click="openCreate"
      />
    </div>

    <!-- Tabla -->
    <q-card flat bordered class="soft-card">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="_id"
        :pagination="pagination"
        :rows-per-page-options="[5, 10, 25, 50]"
        flat
        bordered
        :loading="companies.loading"
        loading-label="Cargando empresas…"
        no-data-label="No hay empresas registradas"
        :filter="search"
        binary-state-sort
      >
        <!-- Top-right: buscador -->
        <template #top-right>
          <div class="row items-center q-gutter-sm">
            <q-input
              v-model="search"
              dense
              outlined
              debounce="250"
              placeholder="Buscar…"
              class="search-input"
              clearable
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
        </template>

        <!-- Empty / No results -->
        <template #no-data>
          <div class="full-width column items-center q-pa-lg text-grey-7">
            <q-icon name="apartment" size="48px" class="q-mb-sm" />
            <div class="text-subtitle1 q-mb-xs">No hay empresas</div>
            <div class="text-caption q-mb-md">
              Crea la primera empresa con el botón “Nueva”.
            </div>
            <q-btn color="primary" icon="add" label="Nueva" @click="openCreate" />
          </div>
        </template>

        <!-- Body: Name -->
        <template #body-cell-name="p">
          <q-td :props="p">
            <div class="row items-center no-wrap">
              <q-avatar size="28px" class="q-mr-sm" square>
                <img v-if="p.row.logo" :src="p.row.logo" />
                <q-icon v-else name="apartment" color="grey-7" />
              </q-avatar>
              <div class="ellipsis">{{ p.row.name || '—' }}</div>
            </div>
          </q-td>
        </template>

        <!-- Body: RUT (si existe en el modelo) -->
        <template #body-cell-rut="p">
          <q-td :props="p">
            {{ p.row.rut || '—' }}
          </q-td>
        </template>

        <!-- Body: Status -->
        <template #body-cell-status="p">
          <q-td :props="p">
            <q-badge
              :color="statusColor(p.row.status)"
              outline
            >
              {{ p.row.status || '—' }}
            </q-badge>
          </q-td>
        </template>

        <!-- Body: Actions -->
        <template #body-cell-actions="p">
          <q-td :props="p" class="text-right">
            <q-btn flat dense round icon="visibility" @click="verEmpresa(p.row)" />
            <q-btn flat dense round icon="edit" color="primary" @click="editarEmpresa(p.row)" />
            <q-btn flat dense round icon="delete" color="negative" @click="confirmEliminar(p.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialogo de creación/edición -->
    <CompanyDialog
      v-model="dlgOpen"
      :editData="editRow"
      @saved="loadCompanies"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import CompanyDialog from '@/components/companies/CompanyDialog.vue'
import { useCompaniesStore } from '@/stores/companies'

const $q = useQuasar()
const companies = useCompaniesStore()

// --------- UI State ----------
const titleClass = 'text-primary'
const dlgOpen = ref(false)
const editRow = ref(null)
const search = ref('')

// Paginación defensiva
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'name',
  descending: false
})

// --------- Data defensiva ---------
// Asegura SIEMPRE un array, evita el "reading 'length'"
const rows = computed(() => {
  // Ajusta al nombre real del array en tu store:
  // p.ej. companies.items, companies.list, companies.empresas, etc.
  debugger
  const arr = companies.items || companies.empresas || companies.list || []
  return Array.isArray(arr) ? arr : []
})

// Columnas declaradas (no undefined)
const columns = [
  {
    name: 'name',
    label: 'Nombre',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'rut',
    label: 'RUT',
    field: 'rut',
    align: 'left',
    sortable: true
  },
  {
    name: 'status',
    label: 'Estado',
    field: 'status',
    align: 'left',
    sortable: true
  },
  {
    name: 'actions',
    label: '',
    field: '__actions',
    align: 'right',
    sortable: false
  }
]

// --------- Helpers ----------
function statusColor(status) {
  if (status === 'active') return 'positive'
  if (status === 'inactive') return 'warning'
  if (status === 'suspended') return 'negative'
  return 'grey'
}

// --------- Actions ----------
function openCreate() {
  editRow.value = null
  dlgOpen.value = true
}

function editarEmpresa(row) {
  editRow.value = row
  dlgOpen.value = true
}

function verEmpresa(row) {
  // Implementa navegación o detalle según tu app
  // this.$router.push({ name: 'company.view', params: { id: row._id } })
  $q.notify({ type: 'info', message: `Ver empresa: ${row?.name || row?._id}` })
}

function confirmEliminar(row) {
  $q.dialog({
    title: 'Eliminar empresa',
    message: `¿Eliminar "${row?.name || 'esta empresa'}"? Esta acción no se puede deshacer.`,
    cancel: true,
    ok: { label: 'Eliminar', color: 'negative' }
  }).onOk(async () => {
    try {
      // Ajusta al método real de tu store
      await companies.removeCompany(row._id)
      $q.notify({ type: 'positive', message: 'Empresa eliminada' })
      await loadCompanies()
    } catch (err) {
      console.error(err)
      $q.notify({ type: 'negative', message: 'No se pudo eliminar' })
    }
  })
}

async function loadCompanies() {
  try {
    await companies.fetchCompanies()
  } catch (err) {
    console.error('[loadCompanies] error:', err)
  }
}

onMounted(() => {
  loadCompanies()
})
</script>

<style scoped>
.soft-card {
  border-radius: 16px;
}
.page-title {
  line-height: 1.2;
}
.search-input {
  min-width: 220px;
}
.elev {
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
}
</style>
