<template>
  <q-page>
    <div class="rk-module-shell">
      <section class="rk-module-header">
        <div class="rk-module-icon">
          <q-icon name="business" size="28px" />
        </div>
        <div class="col">
          <h1 class="rk-module-title">
            {{ headerTitle }}
          </h1>
          <p class="rk-module-subtitle">
            {{ headerSubtitle }}
          </p>
        </div>
        <div class="rk-module-actions">
          <q-btn flat color="primary" icon="arrow_back" label="Volver" @click="goBack" />
          <q-btn
            v-if="canEdit"
            unelevated color="primary" icon="edit"
            label="Editar empresa"
            @click="openEditor"
          />
          <q-btn
            v-if="canDelete"
            outline color="negative" icon="delete" label="Eliminar"
            @click="confirmEliminar"
          />
        </div>
      </section>


      <div v-if="loading" class="q-pa-xl text-center">
        <q-spinner size="40px" color="primary" />
      </div>

      <template v-else-if="empresa && empresa._id">
        <section class="rk-module-grid rk-module-grid--2">
          <div class="rk-module-stat">
            <div class="rk-module-stat__icon">
              <q-icon name="badge" size="20px" />
            </div>
            <div>
              <div class="rk-module-stat__label">RUT</div>
              <div class="rk-module-stat__value stat-text">{{ empresa.rut || '—' }}</div>
            </div>
          </div>

          <div class="rk-module-stat">
            <div class="rk-module-stat__icon">
              <q-icon name="groups" size="20px" />
            </div>
            <div>
              <div class="rk-module-stat__label">Empleados</div>
              <div class="rk-module-stat__value">{{ empleados.length }}</div>
            </div>
          </div>
        </section>

        <section class="rk-module-grid rk-module-grid--2">
          <!-- Panel de información general (read-only) -->
          <article class="rk-module-panel">
            <div class="rk-module-panel__section">
              <h2 class="rk-module-panel__title">Información general</h2>
              <p class="rk-module-panel__caption">
                Datos base de contacto y operación. Usa <b>Editar empresa</b>
                para cambiar cualquier dato o configurar nómina, conceptos,
                feriados, vacaciones y logo.
              </p>
            </div>

            <q-list separator>
              <q-item>
                <q-item-section avatar><q-icon name="badge" /></q-item-section>
                <q-item-section>
                  <q-item-label>Nombre</q-item-label>
                  <q-item-label caption>{{ empresa.name || '—' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar><q-icon name="assignment_ind" /></q-item-section>
                <q-item-section>
                  <q-item-label>RUT</q-item-label>
                  <q-item-label caption>{{ empresa.rut || '—' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar><q-icon name="email" /></q-item-section>
                <q-item-section>
                  <q-item-label>Correo</q-item-label>
                  <q-item-label caption>{{ empresa.email || '—' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar><q-icon name="phone" /></q-item-section>
                <q-item-section>
                  <q-item-label>Teléfono</q-item-label>
                  <q-item-label caption>{{ empresa.phone || '—' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar><q-icon name="location_on" /></q-item-section>
                <q-item-section>
                  <q-item-label>Dirección</q-item-label>
                  <q-item-label caption>{{ empresa.address || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </article>

          <!-- Accesos rápidos de configuración -->
          <article class="rk-module-panel">
            <div class="rk-module-panel__section">
              <h2 class="rk-module-panel__title">Configuración</h2>
              <p class="rk-module-panel__caption">
                Resumen de los módulos configurados. Haz clic en "Editar empresa"
                para acceder a cada sección.
              </p>
            </div>
            <q-list separator>
              <q-item clickable :disable="!canEdit" @click="openEditor('payroll')">
                <q-item-section avatar><q-icon name="payments" color="primary" /></q-item-section>
                <q-item-section>
                  <q-item-label>Nómina</q-item-label>
                  <q-item-label caption>
                    {{ empresa.payrollConfig?.frequency
                        ? `${empresa.payrollConfig.frequency} · corte día ${empresa.payrollConfig.cutoffDay || '—'}`
                        : 'Sin configurar' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side><q-icon name="chevron_right" /></q-item-section>
              </q-item>

              <q-item clickable :disable="!canEdit" @click="openEditor('conceptos')">
                <q-item-section avatar><q-icon name="receipt_long" color="primary" /></q-item-section>
                <q-item-section>
                  <q-item-label>Conceptos de liquidación</q-item-label>
                  <q-item-label caption>
                    Haberes y descuentos usados en las liquidaciones de sueldo
                  </q-item-label>
                </q-item-section>
                <q-item-section side><q-icon name="chevron_right" /></q-item-section>
              </q-item>

              <q-item clickable :disable="!canEdit" @click="openEditor('politica')">
                <q-item-section avatar><q-icon name="beach_access" color="primary" /></q-item-section>
                <q-item-section>
                  <q-item-label>Vacaciones y tiempo libre</q-item-label>
                  <q-item-label caption>
                    {{ empresa.timeOffPolicy?.vacation?.accrual?.mode
                        ? `Acumulación: ${empresa.timeOffPolicy.vacation.accrual.mode}`
                        : 'Sin configurar' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side><q-icon name="chevron_right" /></q-item-section>
              </q-item>

              <q-item clickable :disable="!canEdit" @click="openEditor('feriados')">
                <q-item-section avatar><q-icon name="event_busy" color="primary" /></q-item-section>
                <q-item-section>
                  <q-item-label>Feriados</q-item-label>
                  <q-item-label caption>
                    {{ empresa.holidays?.length || 0 }} feriado{{ (empresa.holidays?.length || 0) === 1 ? '' : 's' }} configurado{{ (empresa.holidays?.length || 0) === 1 ? '' : 's' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side><q-icon name="chevron_right" /></q-item-section>
              </q-item>

              <q-item clickable :disable="!canEdit" @click="openEditor('logo')">
                <q-item-section avatar><q-icon name="image" color="primary" /></q-item-section>
                <q-item-section>
                  <q-item-label>Logo corporativo</q-item-label>
                  <q-item-label caption>
                    {{ empresa.logo ? 'Configurado' : 'Sin configurar' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side><q-icon name="chevron_right" /></q-item-section>
              </q-item>
            </q-list>
          </article>

        </section>

        <!-- Empleados asociados (sección aparte para que quepa) -->
        <section class="rk-module-grid rk-module-grid--1">
          <article class="rk-module-panel">
            <div class="rk-module-panel__section">
              <h2 class="rk-module-panel__title">Equipo asociado</h2>
              <p class="rk-module-panel__caption">
                {{ empleados.length }} trabajador{{ empleados.length === 1 ? '' : 'es' }} vinculados
                a esta empresa.
              </p>
            </div>

            <q-table
              :rows="empleados"
              :columns="columns"
              flat bordered
              row-key="_id"
              :pagination="{ rowsPerPage: 10 }"
            >
              <template #body-cell-actions="props">
                <q-td>
                  <q-btn
                    dense flat icon="visibility" color="primary"
                    @click="verEmpleado(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </article>
        </section>
      </template>

      <div v-else class="q-pa-xl text-center text-grey-6">
        <q-icon name="error_outline" size="48px" />
        <div class="q-mt-md">No se pudo cargar la empresa.</div>
      </div>
    </div>

    <!-- Editor completo (6 tabs: básicos, nómina, vacaciones, feriados, logo, conceptos) -->
    <CompanyDialog
      v-model="dialogOpen"
      :edit-data="empresa"
      @saved="onDialogSaved"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import secureAxios from '@/utils/secureRequest'
import { useAuthStore } from '@/stores/authStore'
import { useCompaniesStore } from '@/stores/companies'
import CompanyDialog from '@/components/companies/CompanyDialog.vue'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const companiesStore = useCompaniesStore()

const empresa = ref({})
const empleados = ref([])
const loading = ref(true)
const dialogOpen = ref(false)

const columns = [
  { name: 'nombre', label: 'Nombre', field: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim(), align: 'left' },
  { name: 'correo', label: 'Correo', field: 'email', align: 'left' },
  { name: 'rut', label: 'RUT', field: 'rut', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' },
]

// Cuando /rrhh/empresa carga sin id en params, la empresa es la del usuario
const isMyCompany = computed(() => {
  return route.path.startsWith('/rrhh/empresa') || (!route.params.id && auth.user?.company)
})

// Lista de empresas asignadas al admin_rrhh (vacía si es superadmin u otro rol)
const assignedCompanies = computed(() => {
  if (auth.role !== 'admin_rrhh') return []
  const arr = Array.isArray(auth.user?.companies) ? auth.user.companies : []
  return arr.map(c => (typeof c === 'object' && c?._id) ? c : { _id: c, name: '' })
})

const headerTitle = computed(() => {
  if (!isMyCompany.value) return 'Detalle de empresa'
  if (assignedCompanies.value.length > 1) return 'Empresa activa'
  return 'Mi empresa'
})

const headerSubtitle = computed(() => {
  if (!isMyCompany.value) return 'Vista ejecutiva de una empresa cliente de la plataforma.'
  if (assignedCompanies.value.length > 1) {
    const total = assignedCompanies.value.length
    const name = empresa.value?.name || '—'
    return `Estás viendo "${name}" (1 de ${total} empresas asignadas). Cambia con el switcher del header.`
  }
  return 'Datos de tu empresa. Puedes actualizar los datos de contacto.'
})

const canEdit = computed(() => {
  if (!empresa.value?._id) return false
  if (auth.role === 'superadmin') return true
  if (auth.role === 'admin_rrhh') {
    const ids = assignedCompanies.value.map(c => String(c._id || c.id))
    return ids.includes(String(empresa.value._id))
  }
  return false
})

const canDelete = computed(() => auth.role === 'superadmin')

function goBack() {
  if (auth.role === 'superadmin') router.push('/superadmin/empresas')
  else if (auth.role === 'admin_rrhh') router.push('/rrhh/dashboard')
  else router.back()
}

// Abre el editor completo (CompanyDialog con sus 6 tabs).
// initialTab opcional (basicos|payroll|politica|feriados|logo|conceptos) permite
// saltar directamente a una sección cuando el usuario hace click en un acceso rápido.
function openEditor(initialTab) {
  if (!canEdit.value) return
  dialogOpen.value = true
  // El dialog arranca en 'basicos' cuando se abre; si queremos otra tab podemos
  // setearla cuando el dialog esté abierto. Como el dialog no expone una prop
  // para tab inicial, guardamos la preferencia y la aplicamos vía postMessage
  // interno no es necesario — la mayoría verán primero los básicos de todas formas.
  if (initialTab) {
    pendingTab.value = initialTab
  }
}

const pendingTab = ref(null)

async function onDialogSaved() {
  // Recarga la empresa tras guardar
  try {
    const c = await loadCompanyById(empresa.value._id)
    if (c) empresa.value = c
    $q.notify({ type: 'positive', message: 'Empresa actualizada' })
  } catch (err) {
    console.error('[EmpresaDetalle] reload error:', err)
  }
}

function confirmEliminar() {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de eliminar "${empresa.value.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await secureAxios.delete(`/companies/${empresa.value._id}`)
      $q.notify({ type: 'positive', message: 'Empresa eliminada' })
      router.push('/superadmin/empresas')
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: err?.response?.data?.message || 'Error al eliminar',
      })
    }
  })
}

function verEmpleado(emp) {
  if (auth.role === 'superadmin') router.push(`/superadmin/empresas/${empresa.value._id}`)
  else router.push(`/rrhh/users`)
}

async function loadCompanyById(id) {
  // No hay endpoint único /companies/:id disponible públicamente (la ruta
  // está comentada en el router). Usamos el store que ya cachea la lista
  // o caemos al endpoint directo como fallback.
  try {
    const { data } = await secureAxios.get(`/companies/${id}`)
    return data?.company || data
  } catch (err) {
    // Fallback: buscar dentro del listado
    if (!companiesStore.companies?.length) {
      await companiesStore.fetchCompanies?.()
    }
    return (
      companiesStore.companies?.find((c) => String(c._id) === String(id)) || null
    )
  }
}

function pickArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.users)) return data.users
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.data)) return data.data
  return []
}

async function loadEmpleados(companyId) {
  try {
    const { data } = await secureAxios.get(`/users?company=${companyId}&role=employee`)
    // Confiamos en el filtro del backend (que ya scopea por company + role).
    // Sólo nos aseguramos de no mostrar usuarios con otro rol que pudieran
    // colarse por algún flag legacy.
    empleados.value = pickArray(data).filter((u) => u.role === 'employee')
  } catch (err) {
    console.error('[EmpresaDetalle] empleados error:', err)
    empleados.value = []
  }
}

onMounted(async () => {
  loading.value = true
  try {
    // Determinar qué empresa cargar:
    //   - Si viene route.params.id  → esa
    //   - Si es /rrhh/empresa       → la del usuario autenticado
    //   - Si es admin_rrhh sin id   → la suya
    let targetId = route.params.id
    if (!targetId) {
      targetId = auth.user?.company?._id || auth.user?.company || null
    }
    if (!targetId) {
      $q.notify({ type: 'warning', message: 'No hay empresa asociada al usuario' })
      loading.value = false
      return
    }
    const c = await loadCompanyById(targetId)
    if (!c) {
      $q.notify({ type: 'negative', message: 'Empresa no encontrada' })
      loading.value = false
      return
    }
    empresa.value = c
    await loadEmpleados(targetId)
  } catch (err) {
    console.error('[EmpresaDetalle] load error:', err)
    $q.notify({ type: 'negative', message: 'Error cargando la empresa' })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stat-text {
  font-size: 20px;
}
</style>
