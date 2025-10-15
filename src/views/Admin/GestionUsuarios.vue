<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 row items-center" :class="headerTextClass">
        <q-icon name="group" class="q-mr-sm" />
        Gestión de Usuarios
      </div>
      <q-btn
        color="primary"
        icon="person_add"
        label="Nuevo"
        unelevated
        class="q-px-sm shadow-2"
        @click="abrirDialogoNuevo"
      />
    </div>

    <!-- Toolbar -->
    <div class="rk-toolbar row items-center q-gutter-sm q-mb-sm">
      <q-input
        v-model="filters.q"
        dense outlined clearable
        placeholder="Buscar por nombre, correo o RUT…"
        class="col-12 col-md-4"
        debounce="200"
        @update:model-value="reload"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <q-select
        v-model="filters.role"
        :options="roleOptions"
        dense outlined clearable
        label="Rol"
        class="col-6 col-md-2"
        emit-value map-options
        @update:model-value="reload"
      >
        <template #prepend><q-icon name="verified_user" /></template>
      </q-select>

      <q-select
        v-model="filters.company"
        :options="empresas"
        option-value="id" option-label="name"
        dense outlined clearable
        label="Empresa"
        class="col-6 col-md-3"
        emit-value map-options
        @update:model-value="reload"
      >
        <template #prepend><q-icon name="business" /></template>
      </q-select>

      <q-space />

      <q-btn flat dense icon="download" label="Exportar CSV" @click="exportCsv" />
      <q-btn
        flat dense icon="delete_sweep" color="negative"
        :disable="!selected.length"
        label="Borrar seleccionados"
        @click="confirmBulkDelete"
      />
    </div>

    <!-- Tabla -->
    <q-table
      class="rk-table"
      :rows="rows"
      :columns="columns"
      row-key="_id"
      :loading="loading"
      selection="multiple"
      v-model:selected="selected"
      :pagination="pagination"
      @request="onRequest"
      binary-state-sort
      flat bordered
      :wrap-cells="false"
      :rows-per-page-options="[10,20,50,100]"
      no-data-label="No hay usuarios"
      :class="tableClass"
      @row-dblclick="editar"
    >
      <template #top-right>
        <div class="text-caption text-grey-7 q-pr-sm">{{ total }} resultado(s)</div>
      </template>

      <!-- Usuario -->
      <template #body-cell-name="p">
        <q-td :props="p">
          <div class="row items-center no-wrap">
            <q-avatar color="primary" text-color="white" size="28px" class="q-mr-sm">
              {{ initials(p.row.firstName, p.row.lastName) }}
            </q-avatar>
            <div class="col">
              <div class="text-body2 text-weight-medium ellipsis">
                {{ p.row.firstName }} {{ p.row.lastName }}
              </div>
              <div class="text-caption text-grey-7 ellipsis">{{ p.row.email }}</div>
            </div>
          </div>
        </q-td>
      </template>

      <!-- Empresa -->
      <template #body-cell-company="p">
        <q-td :props="p">
          <q-chip v-if="p.row.company?.name" dense square icon="apartment">
            {{ p.row.company.name }}
          </q-chip>
          <span v-else>—</span>
        </q-td>
      </template>

      <!-- Rol -->
      <template #body-cell-role="p">
        <q-td :props="p">
          <q-badge :color="roleColor(p.row.role || p.row.tipo)" outline>
            {{ roleNice(p.row.role || p.row.tipo) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Estado -->
      <template #body-cell-status="p">
        <q-td :props="p">
          <q-badge :color="statusColor(p.row.status)" outline>
            {{ statusNice(p.row.status) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Último acceso -->
      <template #body-cell-lastLogin="p">
        <q-td :props="p">
          <span v-if="p.row.lastLogin">{{ formatDate(p.row.lastLogin) }}</span>
          <span v-else>—</span>
        </q-td>
      </template>

      <!-- Acciones -->
      <template #body-cell-actions="p">
        <q-td :props="p" class="q-gutter-xs">
          <q-btn dense flat round icon="visibility" @click="ver(p.row)" title="Ver" />
          <q-btn dense flat round icon="edit" color="primary" @click="editar(p.row)" title="Editar" />
          <q-btn dense flat round icon="delete" color="negative" @click="confirmDelete(p.row)" title="Eliminar" />
        </q-td>
      </template>

      <template #loading>
        <q-inner-loading showing><q-spinner size="32px" /></q-inner-loading>
      </template>
    </q-table>

    <!-- Diálogo Crear -->
    <UserCreation
      v-model="dialogoNuevo"
      :empresas="empresas"
      :horarios="horarios"
      @guardar="guardarUsuario"
    />

    <!-- Diálogo Editar -->
    <EditUserDialog
      v-model="dialogoEditar"
      :user-id="userIdEditar"
      @updated="reload"
      @deleted="reload"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useToast } from 'vue-toastification'
import { useUserStore } from '@/stores/userStore'
import { useCompaniesStore } from '@/stores/companies'
import UserCreation from '@/components/UserCreation.vue'
import EditUserDialog from '@/components/EditUserDialog.vue'

const $q = useQuasar()
const toast = useToast()
const userStore = useUserStore()
const companiesStore = useCompaniesStore()

/* Filtros y paginación */
const filters = ref({ q: '', role: null, company: null })
const pagination = ref({ page: 1, rowsPerPage: 20, sortBy: 'createdAt', descending: true })
const total = ref(0)
const loading = ref(false)
const rows = ref([])
const selected = ref([])

/* Columnas */
const columns = [
  { name: 'name', label: 'Usuario', field: 'firstName', align: 'left', sortable: true },
  { name: 'company', label: 'Empresa', field: r => r.company?.name, align: 'left', sortable: true },
  { name: 'role', label: 'Rol', field: r => r.role || r.tipo, align: 'left', sortable: true },
  { name: 'status', label: 'Estado', field: 'status', align: 'left', sortable: true },
  { name: 'lastLogin', label: 'Último acceso', field: 'lastLogin', align: 'left', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' }
]

/* Empresas/Horarios (para el diálogo de crear) */
const dialogoNuevo = ref(false)
const empresas = ref([])
const horarios = ref([])

async function loadEmpresas () {
  await companiesStore.fetchCompanies()
  empresas.value = (companiesStore.companies || []).map(e => ({ id: e._id, name: e.name }))
}
async function loadHorariosAll () {
  horarios.value = []
  for (const e of empresas.value) {
    await companiesStore.fetchWorkSchedulesByCompany(e.id)
    const hs = (companiesStore.workSchedules || []).map(h => ({ id: h._id, name: h.name }))
    horarios.value.push(...hs)
  }
}

/* Carga de tabla (server-ready) */
async function onRequest ({ pagination: p }) {
  const { page, rowsPerPage, sortBy, descending } = p
  loading.value = true
  try {
    // Si tu API soporta filtros/paginación, usa:
    // await userStore.fetchUsers({ page, limit: rowsPerPage, sortBy, descending, ...filters.value })
    await userStore.fetchUsers() // fallback local

    const all = (userStore.users || []).map(x => ({ ...x, role: x.role || x.tipo }))

    // filtros locales
    const q = (filters.value.q || '').toLowerCase()
    const byQ = !q ? all : all.filter(u =>
      [u.firstName, u.lastName, u.email, u.rut].filter(Boolean)
        .some(s => String(s).toLowerCase().includes(q))
    )
    const byRole = filters.value.role ? byQ.filter(u => (u.role === filters.value.role || u.tipo === filters.value.role)) : byQ
    const byCompany = filters.value.company ? byRole.filter(u => u.company?._id === filters.value.company) : byRole

    // ordenar
    const sorted = [...byCompany].sort((a, b) => {
      const dir = descending ? -1 : 1
      const av = sortBy === 'createdAt' ? new Date(a.createdAt) : a[sortBy]
      const bv = sortBy === 'createdAt' ? new Date(b.createdAt) : b[sortBy]
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir
    })

    total.value = sorted.length
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    rows.value = rowsPerPage === 0 ? sorted : sorted.slice(start, end)

    pagination.value = { page, rowsPerPage, sortBy, descending }
  } catch (e) {
    toast.error('Error al cargar usuarios')
  } finally {
    loading.value = false
  }
}

function reload () { onRequest({ pagination: pagination.value }) }

/* Acciones */
function abrirDialogoNuevo () { dialogoNuevo.value = true }
async function guardarUsuario () { dialogoNuevo.value = false; reload() }

function ver (row) {
  $q.notify({ message: `Usuario: ${row.firstName} ${row.lastName}`, color: 'info' })
}

/* Edición integrada */
const dialogoEditar = ref(false)
const userIdEditar = ref(null)

function editar (row) {
  const r = row?._id ? row : row?.row // soporte @row-dblclick (pasa {row,...})
  const id = r?._id
  if (!id) return
  userIdEditar.value = id
  dialogoEditar.value = true
}

function confirmDelete (row) {
  $q.dialog({
    title: 'Eliminar usuario',
    message: `¿Eliminar a ${row.firstName} ${row.lastName}?`,
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: { label: 'Cancelar' }
  }).onOk(async () => { await eliminarUsuario(row._id) })
}

function confirmBulkDelete () {
  $q.dialog({
    title: 'Eliminar usuarios',
    message: `¿Eliminar ${selected.value.length} usuario(s) seleccionados?`,
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: { label: 'Cancelar' }
  }).onOk(async () => {
    for (const r of selected.value) await eliminarUsuario(r._id)
    selected.value = []
    reload()
  })
}

async function eliminarUsuario (id) {
  try { await userStore.deleteUser(id); toast.success('Usuario eliminado'); reload() }
  catch { toast.error('No se pudo eliminar el usuario') }
}

/* Catálogos/UI helpers */
const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Empresa', value: 'company' },
  { label: 'Empleado', value: 'employee' },
  { label: 'Supervisor', value: 'supervisor' }
]
function roleNice (r) { return ({ admin:'Admin', company:'Empresa', employee:'Empleado', supervisor:'Supervisor', empresa:'Empresa', empleado:'Empleado' }[r] || r) }
function roleColor (r) { const rr = r==='empresa'?'company': r==='empleado'?'employee': r; return rr==='admin'?'deep-purple-5': rr==='company'?'indigo-6': rr==='employee'?'teal-6':'grey-6' }
function statusNice (s) { return ({ active:'Activo', inactive:'Inactivo', suspended:'Suspendido' }[s] || s || '—') }
function statusColor (s) { return s==='active'?'positive': s==='inactive'?'grey':'warning' }
function initials (fn='', ln='') { return ((fn?.[0]||'') + (ln?.[0]||'') || 'U').toUpperCase() }
function formatDate (d) { try { return new Intl.DateTimeFormat('es-CL',{dateStyle:'medium',timeStyle:'short'}).format(new Date(d)) } catch { return '—' } }

/* Tema */
const isDark = computed(() => $q.dark.isActive)
const pageBgClass = computed(() => isDark.value ? 'bg-grey-10 text-white' : 'bg-grey-1')
const tableClass = computed(() => isDark.value ? 'bg-grey-9 text-white' : 'bg-white text-dark')
const headerTextClass = computed(() => isDark.value ? 'text-white' : 'text-primary')

/* Export CSV */
function exportCsv () {
  const header = ['Nombre','Apellido','Correo','Rol','Empresa','Estado','Último acceso']
  const lines = rows.value.map(r => [
    r.firstName||'', r.lastName||'', r.email||'',
    roleNice(r.role || r.tipo), r.company?.name||'', statusNice(r.status),
    r.lastLogin ? new Date(r.lastLogin).toISOString() : ''
  ])
  const csv = [header, ...lines].map(a => a.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `usuarios_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* Lifecycle */
onMounted(async () => {
  await loadEmpresas()
  await loadHorariosAll()
  reload()
})
</script>

<style scoped>
.rk-toolbar{
  background: var(--rk-card, #fff);
  border: 1px solid var(--rk-border, rgba(0,0,0,.06));
  border-radius: 10px;
  padding: 8px;
}
.rk-table{
  border-radius: 12px;
  overflow: hidden;
  transition: background-color .3s, color .3s;
}
.q-table__middle tbody tr:nth-child(even){
  background-color: rgba(0,0,0,.02);
}
.q-btn.shadow-2{ transition: transform .2s ease; }
.q-btn.shadow-2:hover{ transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,123,255,.25); }

/* tokens tema */
:root{ --rk-border: rgba(0,0,0,.06); --rk-card:#fff; }
.body--dark{ --rk-border: rgba(255,255,255,.08); --rk-card:#111317; }
</style>
