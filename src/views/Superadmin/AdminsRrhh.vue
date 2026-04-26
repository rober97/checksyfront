<template>
  <q-page class="rk-page" :class="{ 'is-dark': isDark }">

    <!-- ===== Fondo decorativo ===== -->
    <div class="rk-bg-mesh" aria-hidden="true">
      <div class="mesh-orb orb-1" />
      <div class="mesh-orb orb-2" />
      <div class="mesh-orb orb-3" />
      <div class="mesh-grid" />
    </div>

    <!-- ===== Header ===== -->
    <div class="rk-header-wrap">
      <div class="rk-header-inner">
        <div class="rk-header-icon">
          <q-icon name="badge" size="26px" />
        </div>
        <div class="rk-header-text">
          <h1 class="rk-title">Administradores de RR.HH.</h1>
          <p class="rk-subtitle">
            Usuarios con rol <span class="rk-accent">admin_rrhh</span>.
            Cada uno administra <span class="rk-accent">una o más empresas</span>
            y puede cambiar entre ellas desde el switcher del header.
          </p>
        </div>
        <div class="rk-header-actions">
          <button class="rk-btn-new" @click="openCreate">
            <q-icon name="person_add" size="16px" />
            Nuevo admin RR.HH.
          </button>
        </div>
      </div>
    </div>

    <!-- ===== KPIs ===== -->
    <div class="rk-kpi-grid q-mb-lg">
      <div class="rk-kpi kpi-all">
        <div class="kpi-icon-wrap"><q-icon name="manage_accounts" size="22px" /></div>
        <div class="kpi-body">
          <div class="kpi-count">{{ kpiTotal }}</div>
          <div class="kpi-label">Total admins</div>
        </div>
      </div>
      <div class="rk-kpi kpi-active">
        <div class="kpi-icon-wrap"><q-icon name="verified_user" size="22px" /></div>
        <div class="kpi-body">
          <div class="kpi-count">{{ kpiActive }}</div>
          <div class="kpi-label">Activos</div>
        </div>
      </div>
      <div class="rk-kpi kpi-multi">
        <div class="kpi-icon-wrap"><q-icon name="hub" size="22px" /></div>
        <div class="kpi-body">
          <div class="kpi-count">{{ kpiMulti }}</div>
          <div class="kpi-label">Multi-empresa</div>
        </div>
      </div>
      <div class="rk-kpi kpi-coverage">
        <div class="kpi-icon-wrap"><q-icon name="business" size="22px" /></div>
        <div class="kpi-body">
          <div class="kpi-count">{{ kpiCoverage }}</div>
          <div class="kpi-label">Empresas cubiertas</div>
        </div>
      </div>
    </div>

    <!-- ===== Toolbar ===== -->
    <div class="rk-toolbar q-mb-md">
      <div class="rk-search-wrap">
        <q-icon name="search" size="16px" class="rk-search-icon" />
        <input
          v-model="search"
          class="rk-search-input"
          placeholder="Buscar por nombre, email o RUT…"
          autocomplete="off"
        />
        <q-icon v-if="search" name="close" size="14px" class="rk-search-clear" @click="search=''" />
      </div>

      <div class="rk-select-wrap">
        <q-icon name="business" size="14px" class="rk-select-icon" />
        <select v-model="filterCompany" class="rk-select">
          <option value="">Todas las empresas</option>
          <option v-for="c in companyOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
        <q-icon name="expand_more" size="14px" class="rk-select-arrow" />
      </div>

      <div style="flex:1" />

      <button class="rk-btn-icon" @click="reload" :disabled="loading">
        <q-icon name="refresh" size="16px" :class="{ 'rk-spin': loading }" />
        <q-tooltip>Recargar</q-tooltip>
      </button>
    </div>

    <!-- ===== Tabla ===== -->
    <div class="rk-table-wrap">

      <!-- Loading -->
      <div v-if="loading" class="rk-skeleton-list">
        <div v-for="n in 4" :key="n" class="rk-skeleton-row">
          <div class="skel skel-avatar" />
          <div class="skel skel-text" style="flex:1.4" />
          <div class="skel skel-text skel-short" />
          <div class="skel skel-badge" />
          <div class="skel skel-badge" />
          <div class="skel skel-actions" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!filteredRows.length" class="rk-empty">
        <div class="rk-empty-icon"><q-icon name="person_off" size="56px" /></div>
        <div class="rk-empty-title">Sin administradores</div>
        <div class="rk-empty-msg">
          {{ search ? `No hay admins que coincidan con "${search}"` : 'Aún no hay administradores RR.HH. registrados.' }}
        </div>
        <button v-if="!search" class="rk-btn-new q-mt-md" @click="openCreate">
          <q-icon name="person_add" size="16px" />Crear el primero
        </button>
      </div>

      <!-- Rows -->
      <table v-else class="rk-table">
        <thead>
          <tr>
            <th class="rk-th">Administrador</th>
            <th class="rk-th">Email</th>
            <th class="rk-th">RUT</th>
            <th class="rk-th">Empresas asignadas</th>
            <th class="rk-th rk-th--center">Estado</th>
            <th class="rk-th rk-th--right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in filteredRows"
            :key="row._id"
            class="rk-tr"
            :style="{ animationDelay: idx * 25 + 'ms' }"
          >
            <td class="rk-td">
              <div class="cell-user">
                <div class="user-avatar" :style="{ background: avatarColor(row.firstName) }">
                  {{ initials(row.firstName, row.lastName) }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ row.firstName }} {{ row.lastName }}</div>
                  <div class="user-meta">Admin RR.HH.</div>
                </div>
              </div>
            </td>
            <td class="rk-td">
              <a :href="`mailto:${row.email}`" class="rk-link">{{ row.email }}</a>
            </td>
            <td class="rk-td rk-mono">{{ row.rut || '—' }}</td>
            <td class="rk-td">
              <div v-if="companyChips(row).length" class="cell-companies">
                <span
                  v-for="(chip, i) in visibleChips(row)"
                  :key="i"
                  class="company-chip"
                  :class="{ 'is-active': chip.isActive }"
                >
                  <q-icon v-if="chip.isActive" name="star" size="12px" class="q-mr-xs" />
                  <q-icon v-else name="apartment" size="12px" class="q-mr-xs" />
                  {{ chip.name }}
                </span>
                <span v-if="hiddenChipsCount(row) > 0" class="company-chip more-chip">
                  +{{ hiddenChipsCount(row) }}
                  <q-tooltip class="rk-tooltip">
                    <div v-for="(c, i) in companyChips(row).slice(MAX_VISIBLE_CHIPS)" :key="i">
                      {{ c.name }}
                    </div>
                  </q-tooltip>
                </span>
              </div>
              <span v-else class="rk-muted">Sin empresas</span>
            </td>
            <td class="rk-td rk-td--center">
              <span class="rk-badge" :class="`badge-${row.status}`">
                <span class="badge-dot" />
                {{ statusNice(row.status) }}
              </span>
            </td>
            <td class="rk-td rk-td--right">
              <div class="cell-actions">
                <button class="act-btn act-edit" @click="openEdit(row)">
                  <q-icon name="edit" size="15px" />
                  <q-tooltip>Editar</q-tooltip>
                </button>
                <button class="act-btn act-delete" @click="confirmDelete(row)">
                  <q-icon name="delete_outline" size="15px" />
                  <q-tooltip>Eliminar</q-tooltip>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredRows.length" class="rk-table-footer">
        <span>Mostrando <strong>{{ filteredRows.length }}</strong> de <strong>{{ rows.length }}</strong></span>
      </div>
    </div>

    <!-- ===== Diálogo ===== -->
    <q-dialog v-model="openDialog" :class="['rk-admin-dialog', isDark ? 'is-dark' : '']">
      <q-card class="rk-dialog-card">
        <div class="rk-dialog-header">
          <div class="rk-dialog-icon">
            <q-icon :name="isEdit ? 'manage_accounts' : 'person_add'" size="24px" />
          </div>
          <div class="rk-dialog-text">
            <div class="rk-dialog-title">{{ isEdit ? 'Editar administrador RR.HH.' : 'Nuevo administrador RR.HH.' }}</div>
            <div class="rk-dialog-sub">
              Este usuario administrará empleados, horarios, nómina y reportes DT
              de las empresas seleccionadas.
            </div>
          </div>
          <button class="rk-dialog-close" v-close-popup>
            <q-icon name="close" size="18px" />
          </button>
        </div>

        <div class="rk-dialog-body">
          <div class="rk-section-label">
            <q-icon name="person" size="14px" />
            <span>Identidad</span>
          </div>
          <div class="rk-grid-2">
            <q-input v-model="form.firstName" label="Nombre *" outlined dense />
            <q-input v-model="form.lastName" label="Apellido *" outlined dense />
          </div>
          <div class="rk-grid-2 q-mt-sm">
            <q-input v-model="form.email" label="Email corporativo *" outlined dense />
            <q-input v-model="form.rut" label="RUT (12345678-9) *" outlined dense />
          </div>

          <div v-if="!isEdit" class="rk-section-label q-mt-md">
            <q-icon name="lock" size="14px" />
            <span>Acceso</span>
          </div>
          <q-input
            v-if="!isEdit"
            v-model="form.password" label="Contraseña inicial *" type="password" outlined dense
            class="q-mt-sm"
          />

          <div class="rk-section-label q-mt-md">
            <q-icon name="business" size="14px" />
            <span>Empresas</span>
          </div>
          <q-select
            v-model="form.companies"
            :options="companyOptions"
            label="Empresas administradas *"
            hint="Selecciona una o más. Puedes elegir luego cuál es la activa."
            outlined dense emit-value map-options
            multiple use-chips
            class="q-mt-sm"
          />
          <q-select
            v-if="isEdit && form.companies.length > 1"
            v-model="form.company"
            :options="activeCompanyOptions"
            label="Empresa activa al iniciar sesión"
            hint="El admin podrá cambiar luego con el switcher."
            outlined dense emit-value map-options
            class="q-mt-sm"
          />
        </div>

        <div class="rk-dialog-footer">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn
            unelevated no-caps color="primary"
            :label="isEdit ? 'Guardar cambios' : 'Crear administrador'"
            :loading="saving" :disable="!canSubmit"
            @click="save"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'

const $q = useQuasar()

/* ── Theme ─────────────────────────────────────── */
const isDark = ref($q.dark.isActive)
watch(() => $q.dark.isActive, (v) => { isDark.value = v })

/* ── Estado ────────────────────────────────────── */
const rows = ref([])
const loading = ref(false)
const openDialog = ref(false)
const saving = ref(false)
const companyOptions = ref([])
const search = ref('')
const filterCompany = ref('')

const editingId = ref(null)
const isEdit = computed(() => !!editingId.value)

const MAX_VISIBLE_CHIPS = 3

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  rut: '',
  password: '',
  companies: [],
  company: null,
})

function resetForm() {
  Object.assign(form, {
    firstName: '', lastName: '', email: '', rut: '', password: '',
    companies: [], company: null,
  })
  editingId.value = null
}

const activeCompanyOptions = computed(() =>
  companyOptions.value.filter(opt => form.companies.includes(opt.value))
)

/* ── Helpers de presentación ───────────────────── */
const AVATAR_COLORS = ["#3d6fff","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899"]
const avatarColor = (name="") => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (fn="", ln="") => ((fn?.[0]||"") + (ln?.[0]||"") || "U").toUpperCase()
const statusNice = (s) => ({ active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido', pending: 'Pendiente' }[s] || s || '—')

function companyChips(row) {
  const arr = Array.isArray(row?.companies) && row.companies.length ? row.companies : []
  const activeId = String(row?.company?._id || row?.company || '')
  return arr
    .map(c => {
      const id = String(c?._id || c || '')
      // resuelve nombre desde el populate o desde el catálogo
      const fromPopulate = c?.name
      const fromCatalog = !fromPopulate
        ? companyOptions.value.find(o => String(o.value) === id)?.label
        : null
      const name = fromPopulate || fromCatalog || (id.slice(0, 8) + '…')
      return { id, name, isActive: id === activeId }
    })
    .filter(c => c.id)
    .sort((a, b) => (a.isActive ? -1 : 0) - (b.isActive ? -1 : 0))
}

function visibleChips(row) {
  return companyChips(row).slice(0, MAX_VISIBLE_CHIPS)
}
function hiddenChipsCount(row) {
  return Math.max(0, companyChips(row).length - MAX_VISIBLE_CHIPS)
}

/* ── Filtrado ──────────────────────────────────── */
const filteredRows = computed(() => {
  let arr = rows.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    arr = arr.filter(r => [r.firstName, r.lastName, r.email, r.rut]
      .filter(Boolean)
      .some(s => String(s).toLowerCase().includes(q)))
  }
  if (filterCompany.value) {
    arr = arr.filter(r => {
      const ids = Array.isArray(r.companies) ? r.companies.map(c => String(c?._id || c)) : []
      return ids.includes(String(filterCompany.value))
    })
  }
  return arr
})

/* ── KPIs ──────────────────────────────────────── */
const kpiTotal = computed(() => rows.value.length)
const kpiActive = computed(() => rows.value.filter(r => r.status === 'active').length)
const kpiMulti = computed(() =>
  rows.value.filter(r => Array.isArray(r.companies) && r.companies.length > 1).length
)
const kpiCoverage = computed(() => {
  const set = new Set()
  rows.value.forEach(r => {
    (r.companies || []).forEach(c => set.add(String(c?._id || c)))
  })
  return set.size
})

/* ── Validación ────────────────────────────────── */
const canSubmit = computed(() => {
  const baseOk =
    form.firstName &&
    form.lastName &&
    form.email &&
    form.rut &&
    Array.isArray(form.companies) && form.companies.length > 0
  if (!baseOk) return false
  return isEdit.value ? true : !!form.password
})

/* ── Data fetching ─────────────────────────────── */
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
    const { data } = await secureAxios.get('/users?role=admin_rrhh&limit=500')
    const users = pickArray(data)
    rows.value = users.filter((u) => u.role === 'admin_rrhh')
  } catch (err) {
    console.error('[AdminsRrhh] load error:', err)
    rows.value = []
  } finally {
    loading.value = false
  }
}
const reload = () => load()

async function loadCompanies() {
  try {
    const { data } = await secureAxios.get('/companies?limit=500')
    const cs = pickArray(data)
    companyOptions.value = cs.map((c) => ({ label: c.name, value: c._id, rut: c.rut }))
  } catch (err) {
    console.error('[AdminsRrhh] companies error:', err)
    companyOptions.value = []
  }
}

/* ── Acciones ──────────────────────────────────── */
function openCreate() {
  resetForm()
  openDialog.value = true
}

function openEdit(row) {
  resetForm()
  editingId.value = row._id
  form.firstName = row.firstName || ''
  form.lastName = row.lastName || ''
  form.email = row.email || ''
  form.rut = row.rut || ''
  form.companies = Array.isArray(row.companies)
    ? row.companies.map(c => c?._id || c).filter(Boolean)
    : (row.company ? [row.company?._id || row.company] : [])
  form.company = row.company?._id || row.company || form.companies[0] || null
  openDialog.value = true
}

async function save() {
  saving.value = true
  try {
    if (isEdit.value) {
      await secureAxios.put(`/users/${editingId.value}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email.toLowerCase(),
        rut: form.rut,
        companies: form.companies,
        company: form.companies.includes(form.company) ? form.company : (form.companies[0] || null),
      })
      $q.notify({ type: 'positive', message: 'Administrador actualizado', position: 'top-right' })
    } else {
      await secureAxios.post('/users', {
        role: 'admin_rrhh',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email.toLowerCase(),
        rut: form.rut,
        password: form.password,
        companies: form.companies,
        company: form.companies[0] || null,
        status: 'active',
      })
      $q.notify({ type: 'positive', message: 'Administrador creado', position: 'top-right' })
    }
    openDialog.value = false
    resetForm()
    await load()
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error', position: 'top-right' })
  } finally {
    saving.value = false
  }
}

function confirmDelete(row) {
  $q.dialog({
    title: 'Eliminar administrador',
    message: `¿Eliminar a ${row.firstName} ${row.lastName}? Esta acción no se puede deshacer.`,
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: { label: 'Cancelar' },
    persistent: true,
  }).onOk(async () => {
    try {
      await secureAxios.delete(`/users/${row._id}`)
      $q.notify({ type: 'positive', message: 'Administrador eliminado', position: 'top-right' })
      await load()
    } catch (err) {
      $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error eliminando', position: 'top-right' })
    }
  })
}

onMounted(() => {
  load()
  loadCompanies()
})
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════ */
.rk-page {
  --c-bg:        #f0f2f7;
  --c-surface:   #ffffff;
  --c-surface2:  #f7f8fc;
  --c-border:    rgba(0,0,0,0.08);
  --c-text:      #0f1117;
  --c-text2:     #5a6482;
  --c-text3:     #9aa1b9;
  --c-primary:   #06b6d4;
  --c-primary-l: rgba(6,182,212,0.12);
  --c-ok:        #16a34a;
  --c-ok-l:      rgba(22,163,74,0.12);
  --c-warn:      #d97706;
  --c-warn-l:    rgba(217,119,6,0.12);
  --c-err:       #dc2626;
  --c-err-l:     rgba(220,38,38,0.12);
  --c-purple:    #8b5cf6;
  --c-purple-l:  rgba(139,92,246,0.12);
  --c-teal:      #0d9488;
  --c-teal-l:    rgba(13,148,136,0.12);
  --c-indigo:    #6366f1;
  --c-indigo-l:  rgba(99,102,241,0.12);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-lg:   0 12px 36px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05);
  --radius-md:   14px;
  --radius-lg:   20px;
  --ff-body:     'DM Sans','Segoe UI',system-ui,sans-serif;
  --ff-mono:     'JetBrains Mono','Fira Code',ui-monospace,monospace;
  --ff-display:  'Sora','DM Sans',system-ui,sans-serif;

  font-family: var(--ff-body);
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  padding: 28px 32px 60px;
  position: relative;
  overflow-x: hidden;
  transition: background 0.3s, color 0.3s;
}
.rk-page.is-dark {
  --c-bg:        #0c0e14;
  --c-surface:   #141720;
  --c-surface2:  #1a1e2a;
  --c-border:    rgba(255,255,255,0.07);
  --c-text:      #e8eaf2;
  --c-text2:     #8b92ad;
  --c-text3:     #555d78;
  --c-primary-l: rgba(6,182,212,0.18);
  --c-ok-l:      rgba(22,163,74,0.18);
  --c-warn-l:    rgba(217,119,6,0.18);
  --c-err-l:     rgba(220,38,38,0.18);
  --c-purple-l:  rgba(139,92,246,0.18);
  --c-teal-l:    rgba(13,148,136,0.18);
  --c-indigo-l:  rgba(99,102,241,0.18);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.3);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg:   0 12px 36px rgba(0,0,0,0.5);
}

/* ══════════════════════════════════════════════════
   FONDO
══════════════════════════════════════════════════ */
.rk-bg-mesh { position:absolute; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
.mesh-orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.35; }
.rk-page:not(.is-dark) .mesh-orb { opacity:0.12; }
.orb-1 { width:520px; height:520px; top:-180px; right:-100px; background:var(--c-primary); }
.orb-2 { width:380px; height:380px; bottom:120px; left:-120px; background:var(--c-purple); }
.orb-3 { width:280px; height:280px; top:40%; left:45%; background:var(--c-teal); }
.mesh-grid {
  position:absolute; inset:0;
  background-image:
    linear-gradient(var(--c-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--c-border) 1px, transparent 1px);
  background-size: 40px 40px; opacity:0.5;
}

/* ══════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════ */
.rk-header-wrap { position:relative; z-index:1; margin-bottom:28px; }
.rk-header-inner { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
.rk-header-icon {
  width:54px; height:54px; border-radius:16px;
  background:linear-gradient(135deg, var(--c-primary), var(--c-teal));
  color:#fff;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 8px 24px rgba(6,182,212,0.35); flex-shrink:0;
}
.rk-header-text { flex:1; min-width:240px; }
.rk-title { font-family:var(--ff-display); font-size:26px; font-weight:700; letter-spacing:-0.5px; margin:0 0 4px; line-height:1.2; }
.rk-subtitle { font-size:13.5px; color:var(--c-text2); margin:0; line-height:1.5; }
.rk-accent { color:var(--c-primary); font-weight:600; }

.rk-header-actions { margin-left:auto; }
.rk-btn-new {
  display:inline-flex; align-items:center; gap:8px;
  padding:10px 18px; border-radius:12px; border:none;
  background:linear-gradient(135deg, var(--c-primary), var(--c-teal));
  color:#fff;
  font-size:13.5px; font-weight:600; font-family:var(--ff-body);
  cursor:pointer;
  box-shadow:0 6px 20px rgba(6,182,212,0.35);
  transition:transform 0.15s, box-shadow 0.15s;
  white-space:nowrap;
}
.rk-btn-new:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(6,182,212,0.45); }

/* ══════════════════════════════════════════════════
   KPIs
══════════════════════════════════════════════════ */
.rk-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; position:relative; z-index:1; }
@media(max-width:900px){ .rk-kpi-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:500px){ .rk-kpi-grid{ grid-template-columns:1fr; } }

.rk-kpi {
  background:var(--c-surface); border:1px solid var(--c-border);
  border-radius:var(--radius-md); padding:18px;
  position:relative; overflow:hidden;
  box-shadow:var(--shadow-sm);
  display:flex; align-items:center; gap:14px;
  transition:transform 0.18s, box-shadow 0.18s;
}
.rk-kpi:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }
.rk-kpi::after {
  content:""; position:absolute; left:0; top:0; bottom:0; width:3px;
  background:var(--kpi-c);
}

.kpi-all      { --kpi-c:var(--c-indigo);  --kpi-cl:var(--c-indigo-l);  }
.kpi-active   { --kpi-c:var(--c-ok);      --kpi-cl:var(--c-ok-l);      }
.kpi-multi    { --kpi-c:var(--c-purple);  --kpi-cl:var(--c-purple-l);  }
.kpi-coverage { --kpi-c:var(--c-primary); --kpi-cl:var(--c-primary-l); }

.kpi-icon-wrap {
  width:44px; height:44px; border-radius:12px;
  background:var(--kpi-cl); color:var(--kpi-c);
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.kpi-body { display:flex; flex-direction:column; }
.kpi-count { font-family:var(--ff-display); font-size:26px; font-weight:700; line-height:1; letter-spacing:-1px; }
.kpi-label { font-size:11.5px; font-weight:500; color:var(--c-text2); text-transform:uppercase; letter-spacing:0.6px; margin-top:6px; }

/* ══════════════════════════════════════════════════
   TOOLBAR
══════════════════════════════════════════════════ */
.rk-toolbar {
  background:var(--c-surface); border:1px solid var(--c-border);
  border-radius:var(--radius-md); padding:10px 14px;
  box-shadow:var(--shadow-sm); position:relative; z-index:1;
  display:flex; align-items:center; gap:10px; flex-wrap:wrap;
}

.rk-search-wrap {
  display:flex; align-items:center; gap:8px;
  background:var(--c-surface2); border:1px solid var(--c-border);
  border-radius:10px; padding:7px 12px; min-width:240px; flex:1; max-width:380px;
  transition:border-color 0.15s, box-shadow 0.15s;
}
.rk-search-wrap:focus-within { border-color:var(--c-primary); box-shadow:0 0 0 3px var(--c-primary-l); }
.rk-search-icon { color:var(--c-text3); flex-shrink:0; }
.rk-search-input { border:none; background:transparent; outline:none; font-size:13px; color:var(--c-text); flex:1; min-width:0; font-family:var(--ff-body); }
.rk-search-input::placeholder { color:var(--c-text3); }
.rk-search-clear { color:var(--c-text3); cursor:pointer; }
.rk-search-clear:hover { color:var(--c-text); }

.rk-select-wrap {
  display:flex; align-items:center; gap:6px; position:relative;
  background:var(--c-surface2); border:1px solid var(--c-border);
  border-radius:10px; padding:7px 10px; min-width:180px;
  transition:border-color 0.15s;
}
.rk-select-wrap:focus-within { border-color:var(--c-primary); }
.rk-select-icon { color:var(--c-text3); flex-shrink:0; }
.rk-select-arrow { color:var(--c-text3); flex-shrink:0; pointer-events:none; }
.rk-select {
  border:none; background:transparent; outline:none;
  font-size:13px; color:var(--c-text); font-family:var(--ff-body);
  flex:1; min-width:0; cursor:pointer; appearance:none;
}

.rk-btn-icon {
  width:36px; height:36px; border-radius:10px;
  border:1px solid var(--c-border); background:var(--c-surface2);
  color:var(--c-text2); cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:transform 0.15s, color 0.15s, box-shadow 0.15s;
}
.rk-btn-icon:hover:not(:disabled) { transform:translateY(-1px); color:var(--c-primary); box-shadow:var(--shadow-md); }
.rk-btn-icon:disabled { opacity:0.5; cursor:wait; }
.rk-spin { animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* ══════════════════════════════════════════════════
   TABLA
══════════════════════════════════════════════════ */
.rk-table-wrap {
  background:var(--c-surface); border:1px solid var(--c-border);
  border-radius:var(--radius-lg); overflow:hidden;
  box-shadow:var(--shadow-md); position:relative; z-index:1;
}

/* Skeleton */
.rk-skeleton-list { padding:8px 0; }
.rk-skeleton-row { display:flex; align-items:center; gap:14px; padding:14px 20px; border-bottom:1px solid var(--c-border); }
.rk-skeleton-row:last-child { border-bottom:none; }
.skel { background:linear-gradient(90deg,var(--c-border) 25%,var(--c-surface2) 50%,var(--c-border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
.skel-avatar { width:36px; height:36px; border-radius:11px; flex-shrink:0; }
.skel-text { height:12px; flex:1; }
.skel-short { flex:0.35; }
.skel-badge { width:80px; height:22px; border-radius:999px; flex-shrink:0; }
.skel-actions { width:80px; height:28px; flex-shrink:0; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Empty */
.rk-empty { display:flex; flex-direction:column; align-items:center; padding:64px 24px; gap:8px; }
.rk-empty-icon { width:80px; height:80px; border-radius:24px; background:var(--c-surface2); display:flex; align-items:center; justify-content:center; color:var(--c-text3); margin-bottom:8px; }
.rk-empty-title { font-size:16px; font-weight:700; }
.rk-empty-msg { font-size:13.5px; color:var(--c-text2); text-align:center; max-width:340px; }

/* Tabla */
.rk-table { width:100%; border-collapse:collapse; font-size:13.5px; }
.rk-th {
  padding:12px 18px; text-align:left;
  font-size:11.5px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase;
  color:var(--c-text3); background:var(--c-surface2);
  border-bottom:1px solid var(--c-border); white-space:nowrap;
}
.rk-th--center { text-align:center; }
.rk-th--right  { text-align:right; }

.rk-tr { border-bottom:1px solid var(--c-border); animation:rowIn 0.25s ease both; transition:background 0.12s; }
.rk-tr:last-child { border-bottom:none; }
.rk-tr:hover { background:var(--c-surface2); }
@keyframes rowIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

.rk-td { padding:14px 18px; color:var(--c-text); vertical-align:middle; }
.rk-td--center { text-align:center; }
.rk-td--right { text-align:right; }
.rk-mono { font-family:var(--ff-mono); font-size:12.5px; color:var(--c-text2); }
.rk-muted { color:var(--c-text3); font-style:italic; font-size:12.5px; }
.rk-link { color:var(--c-primary); text-decoration:none; font-weight:500; }
.rk-link:hover { text-decoration:underline; }

/* Cell: usuario */
.cell-user { display:flex; align-items:center; gap:12px; }
.user-avatar {
  width:38px; height:38px; border-radius:11px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:700; color:#fff; letter-spacing:0.5px;
  box-shadow:0 4px 10px rgba(0,0,0,0.12);
}
.user-name { font-weight:600; line-height:1.2; }
.user-meta { font-size:11px; color:var(--c-text3); margin-top:2px; text-transform:uppercase; letter-spacing:0.4px; }

/* Cell: empresas */
.cell-companies { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.company-chip {
  display:inline-flex; align-items:center;
  padding:4px 10px; border-radius:999px;
  background:var(--c-primary-l); color:var(--c-primary);
  font-size:11.5px; font-weight:600;
  border:1px solid transparent;
}
.company-chip.is-active {
  background:linear-gradient(135deg, var(--c-primary), var(--c-teal));
  color:#fff;
  box-shadow:0 2px 8px rgba(6,182,212,0.35);
}
.company-chip.more-chip {
  background:var(--c-surface2);
  color:var(--c-text2);
  border-color:var(--c-border);
  cursor:default;
}
.rk-tooltip { background:rgba(15,17,23,0.95); color:#fff; padding:8px 12px; border-radius:8px; font-size:12px; line-height:1.5; }

/* Estado */
.rk-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 11px; border-radius:999px; font-size:12px; font-weight:600; }
.badge-dot { width:6px; height:6px; border-radius:50%; }
.badge-active    { background:var(--c-ok-l);   color:var(--c-ok);   }
.badge-active    .badge-dot { background:var(--c-ok); }
.badge-inactive  { background:var(--c-warn-l); color:var(--c-warn); }
.badge-inactive  .badge-dot { background:var(--c-warn); }
.badge-suspended { background:var(--c-err-l);  color:var(--c-err);  }
.badge-suspended .badge-dot { background:var(--c-err); }
.badge-pending   { background:var(--c-text3);  color:#fff;          }

/* Acciones */
.cell-actions { display:inline-flex; align-items:center; gap:4px; }
.act-btn { width:32px; height:32px; border:none; border-radius:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; background:transparent; color:var(--c-text2); transition:background 0.12s, transform 0.12s, color 0.12s; }
.act-edit:hover { background:var(--c-primary-l); color:var(--c-primary); transform:scale(1.08); }
.act-delete:hover { background:var(--c-err-l); color:var(--c-err); transform:scale(1.08); }

/* Footer tabla */
.rk-table-footer {
  padding:12px 20px; border-top:1px solid var(--c-border);
  background:var(--c-surface2); font-size:12.5px; color:var(--c-text2);
}
.rk-table-footer strong { color:var(--c-text); }

</style>

<!-- Dialog styles: NO scoped because q-dialog se teleporta fuera del componente -->
<style>
.rk-admin-dialog {
  --d-surface:   #ffffff;
  --d-surface2:  #f7f8fc;
  --d-border:    rgba(0,0,0,0.08);
  --d-text:      #0f1117;
  --d-text2:     #5a6482;
  --d-text3:     #9aa1b9;
  --d-primary:   #06b6d4;
  --d-teal:      #0d9488;
  --d-err:       #dc2626;
  --d-err-l:     rgba(220,38,38,0.12);
  --d-shadow:    0 24px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.08);
  --d-radius:    20px;
  --d-ff:        'DM Sans','Segoe UI',system-ui,sans-serif;
  --d-ff-disp:   'Sora','DM Sans',system-ui,sans-serif;
}
.rk-admin-dialog.is-dark {
  --d-surface:   #141720;
  --d-surface2:  #1a1e2a;
  --d-border:    rgba(255,255,255,0.08);
  --d-text:      #e8eaf2;
  --d-text2:     #8b92ad;
  --d-text3:     #555d78;
  --d-err-l:     rgba(220,38,38,0.2);
  --d-shadow:    0 24px 60px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.4);
}

.rk-admin-dialog .q-dialog__backdrop {
  background: rgba(8, 10, 16, 0.55);
  backdrop-filter: blur(4px);
}
.rk-admin-dialog.is-dark .q-dialog__backdrop {
  background: rgba(0, 0, 0, 0.7);
}

.rk-admin-dialog .rk-dialog-card {
  min-width: 520px;
  max-width: 600px;
  background: var(--d-surface) !important;
  color: var(--d-text);
  border-radius: var(--d-radius);
  border: 1px solid var(--d-border);
  box-shadow: var(--d-shadow);
  font-family: var(--d-ff);
  overflow: hidden;
}

.rk-admin-dialog .rk-dialog-header {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 20px 22px;
  background: var(--d-surface);
  border-bottom: 1px solid var(--d-border);
}
.rk-admin-dialog .rk-dialog-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, var(--d-primary), var(--d-teal));
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 14px rgba(6,182,212,0.35);
}
.rk-admin-dialog .rk-dialog-text { flex: 1; min-width: 0; }
.rk-admin-dialog .rk-dialog-title {
  font-family: var(--d-ff-disp);
  font-size: 18px; font-weight: 700;
  line-height: 1.25;
  color: var(--d-text);
}
.rk-admin-dialog .rk-dialog-sub {
  font-size: 12.5px; color: var(--d-text2);
  margin-top: 4px; line-height: 1.5;
}
.rk-admin-dialog .rk-dialog-close {
  width: 32px; height: 32px; border: none; border-radius: 9px;
  background: var(--d-surface2); color: var(--d-text2);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s, color 0.12s;
}
.rk-admin-dialog .rk-dialog-close:hover {
  background: var(--d-err-l); color: var(--d-err);
}

.rk-admin-dialog .rk-dialog-body {
  padding: 20px 22px;
  background: var(--d-surface);
}
.rk-admin-dialog .rk-section-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.6px;
  color: var(--d-text3);
  margin-bottom: 10px;
}
.rk-admin-dialog .rk-grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
@media(max-width:560px){
  .rk-admin-dialog .rk-grid-2 { grid-template-columns: 1fr; }
  .rk-admin-dialog .rk-dialog-card { min-width: auto; width: 95vw; }
}

.rk-admin-dialog .rk-dialog-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 22px;
  background: var(--d-surface2);
  border-top: 1px solid var(--d-border);
}

/* Inputs en dark mode */
.rk-admin-dialog.is-dark .q-field--outlined .q-field__control {
  background: var(--d-surface2);
}
.rk-admin-dialog.is-dark .q-field--outlined .q-field__control:before {
  border-color: var(--d-border);
}
.rk-admin-dialog.is-dark .q-field__label,
.rk-admin-dialog.is-dark .q-field__messages {
  color: var(--d-text2);
}
.rk-admin-dialog.is-dark .q-field__native,
.rk-admin-dialog.is-dark .q-field__input {
  color: var(--d-text);
}
</style>
