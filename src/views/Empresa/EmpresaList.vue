<template>
  <q-page class="q-pa-md" :class="pageContainerClass">
    <div class="row items-center justify-between q-mb-md">
      <div
        class="text-h5 row items-center"
        :class="isDark ? 'text-white' : 'text-primary'"
      >
        <q-icon name="business" class="q-mr-sm" />
        Empresas registradas
      </div>
      <q-btn
        color="primary"
        icon="add"
        unelevated
        class="q-px-md shadow-2"
        @click="dialogCrearEmpresa = true"
      />
    </div>

    <q-card flat bordered :class="cardClass">
      <q-table
        title="Listado de Empresas"
        :rows="empresas"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :pagination="pagination"
        :class="cardClass"
        no-data-label="No hay empresas registradas"
      >
        <template v-slot:body-cell-acciones="props">
          <q-td align="center">
            <q-btn
              flat
              dense
              icon="visibility"
              @click="verEmpresa(props.row)"
              title="Ver"
            />
            <q-btn
              flat
              dense
              icon="edit"
              color="primary"
              @click="editarEmpresa(props.row)"
              title="Editar"
            />
            <q-btn
              flat
              dense
              icon="delete"
              color="negative"
              @click="eliminarEmpresa(props.row)"
              title="Eliminar"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogCrearEmpresa" persistent>
      <q-card :class="cardClass" style="min-width: 400px; max-width: 95vw">
        <q-card-section class="row items-center text-h6" :class="headerClass">
          <q-icon name="apartment" class="q-mr-sm" />
          Nueva Empresa
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-input
            v-model="nuevaEmpresa.name"
            label="Nombre de la empresa"
            dense
            outlined
            clearable
            :rules="[(val) => !!val || 'Campo requerido']"
          />
          <q-input
            v-model="nuevaEmpresa.rut"
            label="RUT"
            dense
            outlined
            clearable
            mask="##.###.###-#"
            fill-mask
            :rules="[(val) => !!val || 'Campo requerido']"
          />
          <q-input
            v-model="nuevaEmpresa.email"
            label="Correo electrónico"
            type="email"
            dense
            outlined
            clearable
          />
          <q-input
            v-model="nuevaEmpresa.phone"
            label="Teléfono"
            dense
            outlined
            clearable
            mask="+56 9 ########"
            fill-mask
          />
          <q-input
            v-model="nuevaEmpresa.address"
            label="Dirección"
            dense
            outlined
            clearable
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            label="Crear Empresa"
            color="primary"
            unelevated
            @click="guardarEmpresa"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeClasses } from '@/utils/themeClasses'
import { useCompaniesStore } from '@/stores/companies'
import { useQuasar } from 'quasar'
import { useToast } from 'vue-toastification'

const toast = useToast()
const $q = useQuasar()
const router = useRouter()
const companiesStore = useCompaniesStore()

const empresas = ref([])
const pagination = ref({ rowsPerPage: 10 })
const dialogCrearEmpresa = ref(false)

const { isDark, cardClass, pageContainerClass, headerClass } = useThemeClasses()

// Columnas de la tabla
const columns = [
  { name: 'nombre', label: 'Nombre', field: 'name', align: 'left' },
  { name: 'rut', label: 'RUT', field: 'rut', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'telefono', label: 'Teléfono', field: 'phone', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
]

// Nueva empresa
const nuevaEmpresa = ref({
  name: '',
  rut: '',
  email: '',
  phone: '',
  address: ''
})

// Navegación
function verEmpresa(empresa) {
  router.push(`/admin/company/${empresa._id}`)
}

function editarEmpresa(empresa) {
  router.push(`/admin/company/${empresa._id}/edit`)
}

function eliminarEmpresa(empresa) {
  $q.dialog({
    title: 'Confirmar',
    message: `¿Deseas eliminar la empresa "${empresa.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await companiesStore.deleteCompany(empresa._id)
      toast.success('Empresa eliminada correctamente ✅')
      await cargarEmpresas()
    } catch (err) {
      toast.error('Error al eliminar la empresa ❌')
    }
  })
}

// Crear empresa
async function guardarEmpresa() {
  const camposObligatorios = ['name', 'rut', 'email', 'phone']
  const faltantes = camposObligatorios.filter((c) => !nuevaEmpresa.value[c])

  if (faltantes.length) {
    toast.warning('Completa todos los campos obligatorios ⚠️')
    return
  }

  try {
    await companiesStore.createCompany(nuevaEmpresa.value)
    dialogCrearEmpresa.value = false
    toast.success('Empresa creada correctamente 🎉')
    await cargarEmpresas()
    nuevaEmpresa.value = { name: '', rut: '', email: '', phone: '', address: '' }
  } catch (error) {
    toast.error(companiesStore.error || 'Error al crear empresa ❌')
  }
}

// Cargar empresas al montar
async function cargarEmpresas() {
  await companiesStore.fetchCompanies()
  empresas.value = companiesStore.companies
}

onMounted(() => {
  cargarEmpresas()
})
</script>



<style scoped>
.text-h5 {
  font-weight: 600;
}

.q-btn.shadow-2 {
  transition: transform 0.2s ease;
}
.q-btn.shadow-2:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 123, 255, 0.25);
}
</style>
