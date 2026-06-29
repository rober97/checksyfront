<!-- src/views/Admin/AprobacionesJerarquia.vue
     Módulo de gobernanza de la cadena de aprobación.
     - Asignar la jefatura (approverId) de cada persona.
     - Designar/revocar representantes del empleador.
     EDICIÓN reservada al representante del empleador (+ superadmin). Para el resto
     de RR.HH. es una vista de solo lectura del organigrama de aprobaciones.
     El backend (governance/approvalChain.js + users/controller) valida igual. -->
<template>
  <q-page class="q-pa-lg rk-chain-page" :class="{ 'is-dark': $q.dark.isActive }">
    <div class="rk-head">
      <div>
        <div class="text-h4 text-weight-bold">Aprobaciones y jerarquía</div>
        <div class="rk-sub">Quién autoriza las solicitudes de cada persona y quién ostenta la facultad del empleador</div>
      </div>
      <q-btn flat round icon="refresh" :loading="loading" @click="reload">
        <q-tooltip>Recargar</q-tooltip>
      </q-btn>
    </div>

    <!-- Aviso de gobernanza -->
    <q-banner v-if="!canAdministerChain" class="rk-banner q-mb-md" rounded>
      <template #avatar><q-icon name="lock" color="grey-7" /></template>
      Vista de solo lectura. Definir la cadena de aprobación es un acto de la
      <b>facultad del empleador</b>; tu rol de RR.HH. puede consultarla pero no editarla.
    </q-banner>
    <q-banner v-else class="rk-banner rk-banner--ok q-mb-md" rounded>
      <template #avatar><q-icon name="verified_user" color="primary" /></template>
      Administras la cadena de aprobación de la empresa. Todo cambio queda en la bitácora.
    </q-banner>

    <q-card flat bordered class="rk-card">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        :pagination="{ rowsPerPage: 0 }"
        hide-bottom
        flat
        :no-data-label="'No hay personas en esta empresa'"
      >
        <!-- Empleado -->
        <template #body-cell-empleado="p">
          <q-td :props="p">
            <div class="rk-emp">
              <q-avatar size="32px" color="primary" text-color="white">{{ initials(p.row) }}</q-avatar>
              <div>
                <div class="rk-emp-name">{{ fullName(p.row) }}</div>
                <div class="rk-emp-mail">{{ p.row.email || '—' }}</div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- Rol -->
        <template #body-cell-rol="p">
          <q-td :props="p">
            <q-badge :color="roleColor(p.row.role)" :label="roleLabel(p.row.role)" />
          </q-td>
        </template>

        <!-- Aprobador (jefatura) -->
        <template #body-cell-aprobador="p">
          <q-td :props="p">
            <q-select
              dense outlined clearable emit-value map-options
              :model-value="p.row.approverId || null"
              :options="approverOptionsFor(p.row)"
              :disable="!canAdministerChain || savingId === p.row._id"
              :loading="savingId === p.row._id"
              placeholder="Sin jefatura asignada"
              class="rk-approver-select"
              @update:model-value="val => onChangeApprover(p.row, val)"
            />
          </q-td>
        </template>

        <!-- Representante del empleador -->
        <template #body-cell-rep="p">
          <q-td :props="p">
            <q-toggle
              :model-value="p.row.isEmployerRepresentative === true"
              :disable="!canAdministerChain || savingId === p.row._id"
              color="primary"
              @update:model-value="val => onToggleRep(p.row, val)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'

const $q = useQuasar()
const userStore = useUserStore()
const auth = useAuthStore()

const loading = ref(false)
const savingId = ref(null)

const canAdministerChain = computed(() =>
  String(auth.user?.role || '') === 'superadmin' ||
  auth.user?.isEmployerRepresentative === true
)

const rows = computed(() => userStore.users || [])

const columns = [
  { name: 'empleado', label: 'Persona', field: 'empleado', align: 'left' },
  { name: 'rol', label: 'Rol', field: 'role', align: 'left' },
  { name: 'aprobador', label: 'Aprobador (jefatura)', field: 'approverId', align: 'left' },
  { name: 'rep', label: 'Representante del empleador', field: 'isEmployerRepresentative', align: 'center' },
]

function fullName(u) {
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '—'
}
function initials(u) {
  const n = fullName(u)
  return n.split(/\s+/).slice(0, 2).map(s => (s[0] || '').toUpperCase()).join('') || '?'
}
const roleLabel = (r) => ({ employee: 'Empleado', admin_rrhh: 'Admin RR.HH.', superadmin: 'Superadmin' }[r] || r || '—')
const roleColor = (r) => ({ employee: 'blue-grey', admin_rrhh: 'teal', superadmin: 'purple' }[r] || 'grey')

// Opciones de jefatura: cualquier persona de la lista, excepto la propia
// (nadie es su propia jefatura). El backend revalida (ciclos, empresa).
function approverOptionsFor(row) {
  return rows.value
    .filter(u => String(u._id) !== String(row._id))
    .map(u => ({ value: u._id, label: `${fullName(u)} — ${roleLabel(u.role)}` }))
}

async function reload() {
  loading.value = true
  try {
    // admin_rrhh queda scopeado por el backend (su JWT). El superadmin opera por
    // empresa activa: le pasamos company para no listar toda la plataforma.
    const params = { limit: 500 }
    if (String(auth.user?.role || '') === 'superadmin' && auth.user?.company) {
      params.company = auth.user.company
    }
    await userStore.fetchUsers(params)
  } finally {
    loading.value = false
  }
}

async function onChangeApprover(row, val) {
  if (!canAdministerChain.value) return
  const prev = row.approverId || null
  savingId.value = row._id
  try {
    await userStore.updateUser({ id: row._id, patch: { approverId: val || null } })
    row.approverId = val || null
    $q.notify({ type: 'positive', message: 'Jefatura actualizada', timeout: 2500, position: 'top-right' })
  } catch (err) {
    row.approverId = prev // revertir
    $q.notify({ type: 'negative', message: err?.message || 'No se pudo asignar la jefatura', position: 'top-right' })
  } finally {
    savingId.value = null
  }
}

async function onToggleRep(row, val) {
  if (!canAdministerChain.value) return
  savingId.value = row._id
  try {
    await userStore.updateUser({ id: row._id, patch: { isEmployerRepresentative: val === true } })
    row.isEmployerRepresentative = val === true
    $q.notify({
      type: 'positive',
      message: val ? 'Designado representante del empleador' : 'Revocada la facultad de representante',
      timeout: 2800, position: 'top-right',
    })
  } catch (err) {
    // El backend bloquea (último representante / autorrevocación); revertimos.
    row.isEmployerRepresentative = !val
    $q.notify({ type: 'negative', message: err?.message || 'No se pudo cambiar la facultad', position: 'top-right' })
  } finally {
    savingId.value = null
  }
}

onMounted(reload)
</script>

<style scoped>
.rk-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.rk-sub { color: var(--q-color-grey-7, #64748b); font-size: 14px; margin-top: 2px; }
.rk-banner { background: rgba(100, 116, 139, 0.08); border: 1px solid rgba(100, 116, 139, 0.16); font-size: 13px; }
.rk-banner--ok { background: rgba(8, 147, 170, 0.08); border-color: rgba(8, 147, 170, 0.2); }
.rk-card { border-radius: 14px; overflow: hidden; }
.rk-emp { display: flex; align-items: center; gap: 10px; }
.rk-emp-name { font-weight: 700; line-height: 1.2; }
.rk-emp-mail { font-size: 12px; opacity: 0.7; }
.rk-approver-select { min-width: 230px; max-width: 320px; }
.rk-chain-page.is-dark .rk-emp-mail { opacity: 0.6; }
</style>
