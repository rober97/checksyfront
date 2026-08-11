<!-- src/components/overtime/OvertimeAuthPanel.vue
     Pactos previos de horas extraordinarias (Art. 32 CT). Aquí vive el acto del
     empleador: otorgar, aprobar lo que pide el trabajador, rechazar y anular.
     Lo efectivamente ejecutado se ve en la pestaña "Ejecutadas".

     Las solicitudes pendientes van primero y en tarjetas: son lo único que
     bloquea a alguien. El historial queda abajo, como consulta. -->
<template>
  <div class="ot-panel">
    <!-- ===== Solicitudes pendientes ===== -->
    <transition name="fade">
      <section v-if="pendingRequests.length" class="ota-pending">
        <div class="ota-pending-head">
          <div class="ota-pending-icon"><q-icon name="pending_actions" size="20px" /></div>
          <div>
            <div class="ota-pending-title">
              {{ pendingRequests.length }} solicitud(es) esperando respuesta
            </div>
            <div class="ota-pending-sub">
              Las pidió el trabajador desde la app. Nadie puede resolver las suyas propias.
            </div>
          </div>
        </div>

        <div class="ota-req-grid">
          <article v-for="r in pendingRequests" :key="r.id" class="ota-req">
            <div class="ota-req-top">
              <div class="ot-avatar" :style="{ background: avatarColor(r._empleado) }">
                {{ initials(r._empleado) }}
              </div>
              <div class="ota-req-who">
                <div class="ota-req-name">{{ r._empleado }}</div>
                <div class="ota-req-day">{{ prettyDay(r.dayKey) }} · hasta {{ r.maxMinutes }} min</div>
              </div>
            </div>
            <p class="ota-req-reason">{{ r.reason || 'Sin motivo indicado' }}</p>
            <div class="ota-req-actions">
              <button class="ota-btn-ok" :disabled="store.sending" @click="approveRow(r)">
                <q-icon name="check" size="15px" /> Aprobar
              </button>
              <button class="ota-btn-no" :disabled="store.sending" @click="rejectRow(r)">
                <q-icon name="close" size="15px" /> Rechazar
              </button>
            </div>
          </article>
        </div>
      </section>
    </transition>

    <!-- ===== Toolbar ===== -->
    <div class="rk-toolbar ota-toolbar">
      <button class="ot-range-pill">
        <q-icon name="calendar_month" size="16px" />
        <span>{{ rangeLabel }}</span>
        <q-icon name="expand_more" size="16px" class="ot-range-caret" />
        <q-menu anchor="bottom left" self="top left">
          <div class="ota-range-body">
            <button
              v-for="p in RANGE_PRESETS"
              :key="p.key"
              v-close-popup
              class="ot-preset"
              :class="{ active: activePreset === p.key }"
              @click="applyPreset(p.key)"
            >
              {{ p.label }}
            </button>
          </div>
        </q-menu>
      </button>

      <div class="rk-search-wrap ota-search">
        <q-icon name="search" size="16px" class="rk-search-icon" />
        <input v-model="search" class="rk-search-input" placeholder="Buscar trabajador…" autocomplete="off" />
        <transition name="fade">
          <q-icon v-if="search" name="close" size="14px" class="rk-search-clear" @click="search = ''" />
        </transition>
      </div>

      <div class="rk-status-tabs ota-tabs">
        <button
          v-for="s in statusTabs"
          :key="s.key"
          class="rk-tab"
          :class="{ active: statusFilter === s.key }"
          @click="statusFilter = s.key"
        >
          {{ s.label }}
          <span v-if="s.count" class="ota-tab-count">{{ s.count }}</span>
        </button>
      </div>

      <div class="ota-spacer" />

      <button class="rk-btn-icon" :disabled="loading" @click="reload">
        <q-icon name="refresh" size="16px" :class="{ 'ot-spin': loading }" />
        <q-tooltip>Actualizar</q-tooltip>
      </button>
      <button class="ot-btn-primary ota-btn-new" @click="openGrant">
        <q-icon name="add_task" size="17px" />
        Otorgar autorización
      </button>
    </div>

    <!-- ===== Historial ===== -->
    <div class="rk-table-wrap ota-table-wrap">
      <div v-if="loading" class="rk-skeleton-list">
        <div v-for="n in 5" :key="n" class="rk-skeleton-row">
          <div class="skel skel-avatar" />
          <div class="skel skel-text" style="flex: 1.4" />
          <div class="skel skel-text" style="flex: 2" />
          <div class="skel skel-badge" />
        </div>
      </div>

      <div v-else-if="!visibleRows.length" class="rk-empty">
        <div class="rk-empty-icon"><q-icon name="gavel" size="52px" /></div>
        <div class="rk-empty-title">Sin autorizaciones</div>
        <div class="rk-empty-msg">
          No hay pactos de horas extraordinarias con estos filtros. Otórgalos antes de
          la jornada o regulariza desde la pestaña <b>Ejecutadas</b>.
        </div>
      </div>

      <table v-else class="rk-table ota-table">
        <thead>
          <tr>
            <th class="rk-th">Trabajador</th>
            <th class="rk-th">Día</th>
            <th class="rk-th rk-th--right">Tope</th>
            <th class="rk-th">Motivo</th>
            <th class="rk-th">Estado</th>
            <th class="rk-th rk-th--right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in visibleRows"
            :key="row.id"
            class="rk-tr"
            :style="{ animationDelay: Math.min(idx, 12) * 22 + 'ms' }"
          >
            <td class="rk-td">
              <div class="ot-user">
                <div class="ot-avatar" :style="{ background: avatarColor(row._empleado) }">
                  {{ initials(row._empleado) }}
                </div>
                <div class="ot-user-name">{{ row._empleado }}</div>
              </div>
            </td>
            <td class="rk-td">{{ prettyDay(row.dayKey) }}</td>
            <td class="rk-td rk-td--right">
              <span class="ota-cap">{{ row.maxMinutes }} min</span>
            </td>
            <td class="rk-td ota-reason">{{ row.reason || '—' }}</td>
            <td class="rk-td">
              <div class="ota-status-cell">
                <span class="rk-badge" :class="`ot-badge--${statusMeta(row.status).tone}`">
                  <i class="badge-dot" />{{ statusMeta(row.status).label }}
                </span>
                <span v-if="row.selfApproved" class="rk-badge ot-badge--warn">
                  Auto-aprobada
                  <q-tooltip max-width="320px">
                    El propio trabajador se autorizó estas horas extra actuando como
                    representante del empleador (Art. 4 del Código del Trabajo). Queda
                    registrado en la bitácora para su trazabilidad.
                  </q-tooltip>
                </span>
                <span v-if="row.origin === 'WORKER'" class="rk-badge ot-badge--neutral">
                  Solicitada
                  <q-tooltip max-width="320px">
                    La pidió el propio trabajador desde la app; requiere aprobación de la jefatura.
                  </q-tooltip>
                </span>
              </div>
            </td>
            <td class="rk-td rk-td--right">
              <div class="ota-actions">
                <template v-if="row.status === 'REQUESTED'">
                  <button class="ota-btn-ok ota-btn-sm" :disabled="store.sending" @click="approveRow(row)">
                    <q-icon name="check" size="14px" /> Aprobar
                  </button>
                  <button class="ota-btn-no ota-btn-sm" :disabled="store.sending" @click="rejectRow(row)">
                    <q-icon name="close" size="14px" /> Rechazar
                  </button>
                </template>
                <button
                  v-else-if="row.status === 'APPROVED'"
                  class="ota-btn-no ota-btn-sm"
                  @click="confirmCancel(row)"
                >
                  <q-icon name="cancel" size="14px" /> Anular
                </button>
                <span v-else class="rk-muted">—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== Diálogo: otorgar ===== -->
    <q-dialog v-model="grantOpen">
      <div class="ot-modal ota-modal">
        <div class="ot-modal-head">
          <div class="ot-modal-icon"><q-icon name="add_task" size="20px" /></div>
          <div>
            <div class="ot-modal-title">Otorgar autorización</div>
            <div class="ot-modal-sub">
              Pacto previo de horas extraordinarias (Art. 32 CT). Queda en la bitácora
              y se notifica al trabajador.
            </div>
          </div>
          <q-btn flat round dense icon="close" class="ot-modal-close" v-close-popup />
        </div>

        <div class="ot-modal-body">
          <q-select
            v-model="form.userId"
            :options="employeeOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            use-input
            input-debounce="200"
            outlined
            dense
            label="Trabajador *"
            @filter="filterEmployees"
          />

          <div class="ota-form-row">
            <q-input v-model="form.dayKey" label="Día *" outlined dense readonly class="col">
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.dayKey" mask="YYYY-MM-DD" today-btn minimal>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="OK" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input
              v-model.number="form.maxMinutes"
              type="number"
              label="Tope (min) *"
              outlined
              dense
              class="col"
              :min="1"
              :max="heCapMinutes"
              :hint="`Máx. ${heCapMinutes} min diarios (Art. 31 CT)`"
            />
          </div>

          <q-input v-model="form.reason" label="Motivo" outlined dense maxlength="300" />

          <div class="ota-note">
            <q-icon name="visibility" size="17px" />
            <span>
              Cuatro ojos: sólo la jefatura del trabajador o el representante del empleador
              pueden otorgarla, y <b>nadie puede autorizarse horas extra a sí mismo</b>.
            </span>
          </div>
        </div>

        <div class="ot-modal-foot">
          <button class="ot-btn-ghost" v-close-popup>Cancelar</button>
          <button class="ot-btn-primary" :disabled="store.sending" @click="submitGrant">
            <q-spinner v-if="store.sending" size="16px" />
            <q-icon v-else name="add_task" size="17px" />
            Otorgar horas extra
          </button>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useOvertimeAuthStore } from '@/stores/overtimeAuth'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { useLegalParamsStore } from '@/stores/legalParams'

const emit = defineEmits(['pending-change'])

const $q = useQuasar()
const store = useOvertimeAuthStore()
const userStore = useUserStore()
const auth = useAuthStore()
const legalParams = useLegalParamsStore()

const heCapMinutes = computed(() => legalParams.value('HE_TOPE_DIARIO', 120))
const loading = computed(() => store.loading)

/* ── Formato ── */
function isoDay(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function dateOf(dayKey) {
  const [y, m, d] = String(dayKey).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function prettyDay(dayKey) {
  if (!dayKey) return '—'
  return dateOf(dayKey).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

const AVATAR_COLORS = ['#0893AA', '#6366f1', '#8b5cf6', '#059669', '#d97706', '#0ea5e9', '#e11d48']
function avatarColor(name = '') {
  let h = 0
  for (const ch of String(name)) h = (h + ch.charCodeAt(0)) % 997
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function fullName(u) {
  return `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.email || '—'
}

/* ── Rango ── */
const filters = reactive({ from: '', to: '' })
const RANGE_PRESETS = [
  { key: 'all', label: 'Todo el historial' },
  { key: 'thisMonth', label: 'Este mes' },
  { key: 'lastMonth', label: 'Mes pasado' },
  { key: 'last30', label: 'Últimos 30 días' },
]
const activePreset = ref('all')

function applyPreset(key) {
  const now = new Date()
  activePreset.value = key
  if (key === 'thisMonth') {
    filters.from = isoDay(new Date(now.getFullYear(), now.getMonth(), 1))
    filters.to = isoDay(now)
  } else if (key === 'lastMonth') {
    filters.from = isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    filters.to = isoDay(new Date(now.getFullYear(), now.getMonth(), 0))
  } else if (key === 'last30') {
    const first = new Date(now)
    first.setDate(first.getDate() - 29)
    filters.from = isoDay(first)
    filters.to = isoDay(now)
  } else {
    filters.from = ''
    filters.to = ''
  }
  reload()
}

const rangeLabel = computed(
  () => RANGE_PRESETS.find((p) => p.key === activePreset.value)?.label || 'Rango'
)

/* ── Estados ── */
function statusMeta(s) {
  return (
    {
      REQUESTED: { tone: 'warn', label: 'Pendiente' },
      APPROVED: { tone: 'ok', label: 'Vigente' },
      REJECTED: { tone: 'danger', label: 'Rechazada' },
      CANCELLED: { tone: 'neutral', label: 'Anulada' },
    }[s] || { tone: 'neutral', label: s || '—' }
  )
}

const search = ref('')
const statusFilter = ref('all')

// Mapa userId → nombre, sólo como respaldo: el backend ya manda `userName`
// resuelto. Cruzar contra la lista local dejaba filas en "—" apenas el
// trabajador no estuviera cargado (otra empresa, paginación, baja).
const userMap = computed(() => {
  const m = {}
  for (const u of userStore.users || []) m[String(u._id)] = fullName(u)
  return m
})

const rows = computed(() =>
  (store.list || []).map((a) => ({
    ...a,
    _empleado: a.userName || userMap.value[String(a.userId)] || '—',
  }))
)

const pendingRequests = computed(() => rows.value.filter((r) => r.status === 'REQUESTED'))

const statusTabs = computed(() => [
  { key: 'all', label: 'Todas', count: 0 },
  { key: 'REQUESTED', label: 'Pendientes', count: pendingRequests.value.length },
  { key: 'APPROVED', label: 'Vigentes', count: 0 },
  { key: 'CANCELLED', label: 'Anuladas', count: 0 },
])

const visibleRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (q && !String(r._empleado).toLowerCase().includes(q)) return false
    if (statusFilter.value === 'all') return true
    if (statusFilter.value === 'CANCELLED') return r.status === 'CANCELLED' || r.status === 'REJECTED'
    return r.status === statusFilter.value
  })
})

/* ── Selector de trabajadores ── */
const filterText = ref('')
const workers = computed(() =>
  (userStore.users || []).filter((u) => u.role !== 'superadmin' && u.role !== 'dt_inspector')
)
const employeeOptions = computed(() => {
  const q = filterText.value.trim().toLowerCase()
  return workers.value
    .filter((u) => !q || fullName(u).toLowerCase().includes(q) || (u.rut || '').toLowerCase().includes(q))
    .map((u) => ({ value: u._id, label: `${fullName(u)}${u.rut ? ' — ' + u.rut : ''}` }))
})
function filterEmployees(val, update) {
  update(() => {
    filterText.value = val || ''
  })
}

/* ── Otorgar ── */
const grantOpen = ref(false)
const form = reactive({ userId: null, dayKey: '', maxMinutes: null, reason: '' })

function openGrant() {
  form.userId = null
  form.dayKey = isoDay(new Date())
  form.maxMinutes = heCapMinutes.value
  form.reason = ''
  grantOpen.value = true
}

async function submitGrant() {
  if (!form.userId) {
    $q.notify({ type: 'warning', message: 'Selecciona un trabajador', position: 'top-right' })
    return
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dayKey)) {
    $q.notify({ type: 'warning', message: 'Selecciona el día', position: 'top-right' })
    return
  }
  const min = Number(form.maxMinutes)
  if (!Number.isFinite(min) || min < 1 || min > heCapMinutes.value) {
    $q.notify({
      type: 'warning',
      message: `El tope debe estar entre 1 y ${heCapMinutes.value} minutos`,
      position: 'top-right',
    })
    return
  }
  try {
    await store.grant({ userId: form.userId, dayKey: form.dayKey, maxMinutes: min, reason: form.reason || '' })
    grantOpen.value = false
    $q.notify({
      type: 'positive',
      message: 'Horas extra autorizadas. Se notificó al trabajador.',
      position: 'top-right',
    })
    emitPending()
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'No se pudo otorgar', position: 'top-right' })
  }
}

async function approveRow(row) {
  try {
    await store.approve(row.id)
    $q.notify({
      type: 'positive',
      message: `Horas extra aprobadas para ${row._empleado}. Se notificó al trabajador.`,
      position: 'top-right',
    })
    emitPending()
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'No se pudo aprobar', position: 'top-right' })
  }
}

function rejectRow(row) {
  $q.dialog({
    title: 'Rechazar solicitud',
    message: `Motivo del rechazo para ${row._empleado} (opcional):`,
    prompt: { model: '', type: 'text' },
    cancel: true,
    persistent: true,
  }).onOk(async (note) => {
    try {
      await store.reject(row.id, note || '')
      $q.notify({ type: 'positive', message: 'Solicitud rechazada. Se notificó al trabajador.', position: 'top-right' })
      emitPending()
    } catch {
      $q.notify({ type: 'negative', message: store.error || 'No se pudo rechazar', position: 'top-right' })
    }
  })
}

function confirmCancel(row) {
  $q.dialog({
    title: 'Anular autorización',
    message: `¿Anular la autorización de HE de ${row._empleado} para el ${row.dayKey}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await store.cancel(row.id)
      $q.notify({ type: 'positive', message: 'Autorización anulada', position: 'top-right' })
    } catch {
      $q.notify({ type: 'negative', message: store.error || 'No se pudo anular', position: 'top-right' })
    }
  })
}

/* ── Carga ── */
function emitPending() {
  emit('pending-change', pendingRequests.value.length)
}

async function loadUsers() {
  const params = { limit: 500 }
  if (String(auth.user?.role || '') === 'superadmin' && auth.user?.company) {
    params.company = auth.user.company
  }
  try {
    await userStore.fetchUsers(params)
  } catch {
    /* el selector queda vacío; el resto del panel sigue sirviendo */
  }
}

async function reload() {
  await store.fetchAuthorizations({
    from: filters.from,
    to: filters.to,
    // Sin esto el superadmin recibía las autorizaciones de todas las empresas
    // mezcladas con las de la que está viendo. Para RR.HH. el backend ya fuerza
    // su propia empresa y este parámetro es inocuo.
    companyId: auth.user?.company || '',
  })
  emitPending()
}

onMounted(async () => {
  legalParams.fetch()
  await Promise.all([loadUsers(), reload()])
})

defineExpose({ reload })
</script>

<style scoped>
/* Las primitivas compartidas (.ot-panel, .ot-range-pill, .ot-user,
   .ot-badge--*, .ot-btn-primary/ghost, .ot-modal…) están en
   src/css/overtime.css. Aquí sólo lo propio de las autorizaciones. */

/* ── Solicitudes pendientes ── */
.ota-pending {
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--rk-c-warn) 30%, transparent);
  border-radius: var(--app-radius-lg);
  background: var(--rk-c-warn-soft);
}

.ota-pending-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.ota-pending-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--rk-c-warn) 18%, transparent);
  color: var(--rk-c-warn);
}

.ota-pending-title {
  font-size: 14px;
  font-weight: 700;
}

.ota-pending-sub {
  margin-top: 2px;
  color: var(--rk-c-text-2);
  font-size: 12.5px;
}

.ota-req-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.ota-req {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--rk-c-border);
  border-radius: 14px;
  background: var(--rk-c-surface);
  box-shadow: var(--app-shadow-sm);
}

.ota-req-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ota-req-who {
  min-width: 0;
}

.ota-req-name {
  font-size: 13.5px;
  font-weight: 700;
}

.ota-req-day {
  color: var(--rk-c-text-2);
  font-size: 12px;
}

.ota-req-reason {
  margin: 0;
  color: var(--rk-c-text-2);
  font-size: 12.5px;
  line-height: 1.4;
}

.ota-req-actions {
  display: flex;
  gap: 8px;
}

.ota-btn-ok,
.ota-btn-no {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border: 1px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  white-space: nowrap;
  font-family: var(--app-font-sans);
  font-size: 12.5px;
  font-weight: 600;
  transition: transform 0.15s, filter 0.15s;
}

.ota-btn-ok {
  background: var(--rk-c-ok);
  color: #fff;
}

.ota-btn-no {
  border-color: color-mix(in srgb, var(--rk-c-danger) 28%, transparent);
  background: var(--rk-c-danger-soft);
  color: var(--rk-c-danger);
}

.ota-btn-ok:hover:not(:disabled),
.ota-btn-no:hover:not(:disabled) {
  transform: translateY(-1px);
}

.ota-btn-ok:disabled,
.ota-btn-no:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ota-btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

/* ── Toolbar ── */
.ota-toolbar {
  flex-wrap: wrap;
}

.ota-spacer {
  flex: 1;
}

.ota-search {
  min-width: 200px;
}

.ota-tabs {
  flex-wrap: wrap;
}

.ota-tab-count {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--rk-c-warn-soft);
  color: var(--rk-c-warn);
  font-size: 11px;
  font-weight: 700;
}

.ota-btn-new {
  padding: 8px 15px;
  font-size: 13px;
}

.ota-range-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  min-width: 180px;
}

/* ── Tabla ── */
.ota-table-wrap {
  overflow-x: auto;
}

.ota-table {
  min-width: 860px;
}

.ota-cap {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--rk-c-primary-soft);
  color: var(--rk-c-primary);
  font-family: var(--app-font-mono);
  font-size: 12px;
  font-weight: 700;
}

.ota-reason {
  max-width: 260px;
  color: var(--rk-c-text-2);
  font-size: 12.5px;
}

.ota-status-cell,
.ota-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ota-actions {
  justify-content: flex-end;
}

/* ── Diálogo ── */
.ota-modal .ot-modal-body {
  gap: 16px;
}

.ota-form-row {
  display: flex;
  gap: 12px;
}

.ota-form-row .col {
  flex: 1;
}

.ota-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px 13px;
  border-radius: 12px;
  background: var(--color-info-soft);
  color: var(--color-info);
  font-size: 12.5px;
  line-height: 1.45;
}
</style>
