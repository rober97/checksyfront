<template>
  <q-page class="sa-page">
    <div class="sa-shell">
      <!-- ============ HERO ============ -->
      <header class="sa-hero">
        <div class="sa-hero__bg"></div>
        <div class="sa-hero__content">
          <div class="sa-hero__left">
            <div class="sa-hero__icon">
              <q-icon name="shield" size="30px" />
            </div>
            <div>
              <div class="sa-hero__eyebrow">Plataforma Recksy</div>
              <h1 class="sa-hero__title">Panel del Superadmin</h1>
              <div class="sa-hero__meta">
                <span class="sa-hero__chip sa-hero__chip--live">
                  <span class="sa-dot"></span> Operativa
                </span>
                <span class="sa-hero__date">
                  <q-icon name="event" size="15px" /> {{ todayLabel }}
                </span>
              </div>
            </div>
          </div>
          <div class="sa-hero__actions">
            <q-btn
              unelevated color="white" text-color="primary"
              icon="add_business" label="Nueva empresa" no-caps
              to="/superadmin/empresas/new" class="sa-hero__btn"
            />
            <q-btn
              outline color="white" icon="download" label="Reportes DT" no-caps
              to="/superadmin/dt/reportes" class="sa-hero__btn"
            />
          </div>
        </div>
      </header>

      <!-- ============ KPIs ============ -->
      <div class="row q-col-gutter-md sa-kpis">
        <div
          v-for="k in kpiCards" :key="k.key"
          class="col-12 col-sm-6 col-lg-3"
        >
          <q-card flat class="sa-kpi" :class="`sa-kpi--${k.tone}`" @click="$router.push(k.to)">
            <div class="sa-kpi__top">
              <div class="sa-kpi__ico"><q-icon :name="k.icon" size="22px" /></div>
              <q-badge v-if="k.deltaLabel" :class="`sa-kpi__delta sa-kpi__delta--${k.deltaTone}`" rounded>
                <q-icon :name="k.deltaTone === 'up' ? 'trending_up' : 'remove'" size="13px" class="q-mr-xs" />
                {{ k.deltaLabel }}
              </q-badge>
            </div>
            <div class="sa-kpi__value">
              <template v-if="loading"><q-skeleton type="text" width="48px" /></template>
              <template v-else>{{ k.value }}</template>
            </div>
            <div class="sa-kpi__label">{{ k.label }}</div>
            <div class="sa-kpi__sub">{{ k.sub }}</div>
          </q-card>
        </div>
      </div>

      <!-- ============ CHARTS ROW 1 ============ -->
      <div class="row q-col-gutter-md q-mt-xs">
        <div class="col-12 col-lg-8">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">Crecimiento de la plataforma</div>
                <div class="sa-card__sub">Empresas y empleados incorporados — últimos 6 meses</div>
              </div>
              <q-icon name="show_chart" class="sa-card__headico" />
            </div>
            <apexchart
              type="area" height="280"
              :options="growthOptions" :series="growthSeries"
            />
          </q-card>
        </div>
        <div class="col-12 col-lg-4">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">Composición de cuentas</div>
                <div class="sa-card__sub">Usuarios por rol y estado</div>
              </div>
              <q-icon name="donut_large" class="sa-card__headico" />
            </div>
            <apexchart
              type="donut" height="280"
              :options="donutOptions" :series="donutSeries"
            />
          </q-card>
        </div>
      </div>

      <!-- ============ CHARTS ROW 2 ============ -->
      <div class="row q-col-gutter-md q-mt-xs">
        <div class="col-12 col-lg-7">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">Empleados por empresa</div>
                <div class="sa-card__sub">Tamaño de cada empresa cliente</div>
              </div>
              <q-icon name="apartment" class="sa-card__headico" />
            </div>
            <apexchart
              v-if="byCompanySeries[0].data.length"
              type="bar" height="300"
              :options="byCompanyOptions" :series="byCompanySeries"
            />
            <div v-else class="sa-empty">
              <q-icon name="inbox" size="34px" /> <span>Sin empresas con empleados aún</span>
            </div>
          </q-card>
        </div>
        <div class="col-12 col-lg-5">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">Actividad reciente</div>
                <div class="sa-card__sub">Últimos eventos de auditoría</div>
              </div>
              <q-btn flat dense round icon="history" color="primary" to="/superadmin/dt/auditoria">
                <q-tooltip>Ver auditoría global</q-tooltip>
              </q-btn>
            </div>

            <div v-if="loading" class="q-pa-md">
              <q-skeleton v-for="n in 4" :key="n" type="text" class="q-mb-sm" />
            </div>
            <q-list v-else-if="recentActivity.length" class="sa-feed">
              <q-item v-for="(ev, i) in recentActivity" :key="i" class="sa-feed__item">
                <q-item-section avatar>
                  <div class="sa-feed__ico" :class="`sa-feed__ico--${ev.color}`">
                    <q-icon :name="ev.icon" size="18px" />
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="sa-feed__title">{{ ev.text }}</q-item-label>
                  <q-item-label caption class="sa-feed__meta">
                    {{ ev.actor }} · {{ ev.ago }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="sa-empty">
              <q-icon name="inbox" size="34px" /> <span>Sin actividad registrada</span>
            </div>
          </q-card>
        </div>
      </div>

      <!-- ============ COMPLIANCE + ROLES ============ -->
      <div class="row q-col-gutter-md q-mt-xs">
        <div class="col-12 col-lg-5">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">Cumplimiento DT</div>
                <div class="sa-card__sub">Res. Ex. 38/2024 · Fiscalización</div>
              </div>
              <q-icon name="gavel" class="sa-card__headico text-amber" />
            </div>
            <div class="sa-comp">
              <div class="sa-comp__row">
                <div class="sa-comp__ico sa-comp__ico--ok"><q-icon name="vpn_key" /></div>
                <div class="sa-comp__body">
                  <div class="sa-comp__val">{{ stats.dtTokens }}</div>
                  <div class="sa-comp__lbl">Tokens fiscalizadores activos</div>
                </div>
                <q-btn flat dense no-caps color="primary" label="Gestionar" to="/superadmin/dt/tokens" />
              </div>
              <q-separator spaced />
              <div class="sa-comp__row">
                <div class="sa-comp__ico" :class="stats.dtExpiring ? 'sa-comp__ico--warn' : 'sa-comp__ico--ok'">
                  <q-icon name="schedule" />
                </div>
                <div class="sa-comp__body">
                  <div class="sa-comp__val">{{ stats.dtExpiring }}</div>
                  <div class="sa-comp__lbl">Por expirar en 3 días</div>
                </div>
                <q-btn flat dense no-caps color="primary" label="Auditoría" to="/superadmin/dt/auditoria" />
              </div>
              <q-separator spaced />
              <div class="sa-comp__row">
                <div class="sa-comp__ico sa-comp__ico--ok"><q-icon name="menu_book" /></div>
                <div class="sa-comp__body">
                  <div class="sa-comp__val">{{ stats.companies }}</div>
                  <div class="sa-comp__lbl">Libros de asistencia disponibles</div>
                </div>
                <q-btn flat dense no-caps color="primary" label="Ver libro" to="/superadmin/dt/libro" />
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-lg-7">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">Modelo de roles</div>
                <div class="sa-card__sub">Quién hace qué en la plataforma</div>
              </div>
              <q-icon name="groups" class="sa-card__headico" />
            </div>
            <div class="sa-roles">
              <div v-for="r in roleModel" :key="r.role" class="sa-role">
                <div class="sa-role__ico" :class="`sa-role__ico--${r.tone}`">
                  <q-icon :name="r.icon" size="20px" />
                </div>
                <div>
                  <div class="sa-role__name">{{ r.role }} <span class="sa-role__tag">— {{ r.tag }}</span></div>
                  <div class="sa-role__desc">{{ r.desc }}</div>
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'

const $q = useQuasar()
const loading = ref(true)

const stats = reactive({
  companies: 0, companiesInactive: 0, companiesNew: 0,
  rrhh: 0, rrhhNew: 0,
  employees: 0, employeesNew: 0, employeesPending: 0,
  dtTokens: 0, dtExpiring: 0,
})

const companies = ref([])
const users = ref([])
const auditRows = ref([])

const todayLabel = new Date().toLocaleDateString('es-CL', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

/* ---------- helpers ---------- */
function pickArray(data, ...keys) {
  if (Array.isArray(data)) return data
  for (const k of keys) if (Array.isArray(data?.[k])) return data[k]
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

function monthBuckets(n) {
  const now = new Date()
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', ''),
    })
  }
  return out
}

function bucketKey(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  return `${d.getFullYear()}-${d.getMonth()}`
}

function isThisMonth(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (isNaN(diff)) return ''
  if (diff < 60) return 'recién'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`
  return new Date(dateStr).toLocaleDateString('es-CL')
}

/* ---------- KPI cards ---------- */
const kpiCards = computed(() => [
  {
    key: 'companies', icon: 'apartment', tone: 'primary', label: 'Empresas activas',
    value: stats.companies, to: '/superadmin/empresas',
    sub: stats.companiesInactive ? `${stats.companiesInactive} inactiva(s)` : 'todas operativas',
    deltaLabel: stats.companiesNew ? `+${stats.companiesNew} este mes` : '',
    deltaTone: stats.companiesNew ? 'up' : 'flat',
  },
  {
    key: 'rrhh', icon: 'admin_panel_settings', tone: 'teal', label: 'Admins RR.HH.',
    value: stats.rrhh, to: '/superadmin/admins-rrhh',
    sub: 'uno por empresa cliente',
    deltaLabel: stats.rrhhNew ? `+${stats.rrhhNew} este mes` : '',
    deltaTone: stats.rrhhNew ? 'up' : 'flat',
  },
  {
    key: 'employees', icon: 'groups', tone: 'indigo', label: 'Empleados totales',
    value: stats.employees, to: '/superadmin/empresas',
    sub: stats.employeesPending ? `${stats.employeesPending} sin activar` : 'todos activados',
    deltaLabel: stats.employeesNew ? `+${stats.employeesNew} este mes` : '',
    deltaTone: stats.employeesNew ? 'up' : 'flat',
  },
  {
    key: 'tokens', icon: 'gavel', tone: 'amber', label: 'Tokens DT activos',
    value: stats.dtTokens, to: '/superadmin/dt/tokens',
    sub: stats.dtExpiring ? `${stats.dtExpiring} por expirar` : 'sin vencimientos próximos',
    deltaLabel: '', deltaTone: 'flat',
  },
])

/* ---------- charts ---------- */
const axisColor = computed(() => ($q.dark.isActive ? '#9aa3b8' : '#64748b'))
const gridColor = computed(() => ($q.dark.isActive ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'))
const themeMode = computed(() => ($q.dark.isActive ? 'dark' : 'light'))

const buckets = monthBuckets(6)

const growthSeries = ref([
  { name: 'Empresas', data: [] },
  { name: 'Empleados', data: [] },
])

const growthOptions = computed(() => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', background: 'transparent' },
  theme: { mode: themeMode.value },
  colors: ['#0CA9C4', '#0893AA'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] } },
  grid: { borderColor: gridColor.value, strokeDashArray: 4 },
  xaxis: {
    categories: buckets.map((b) => b.label),
    labels: { style: { colors: axisColor.value } },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: axisColor.value } }, min: 0, forceNiceScale: true },
  legend: { labels: { colors: axisColor.value }, markers: { radius: 12 } },
  tooltip: { theme: themeMode.value },
}))

const donutSeries = ref([0, 0, 0])
const donutOptions = computed(() => ({
  chart: { fontFamily: 'inherit', background: 'transparent' },
  theme: { mode: themeMode.value },
  labels: ['Admins RR.HH.', 'Empleados activos', 'Pendientes'],
  colors: ['#0CA9C4', '#0893AA', '#f59e0b'],
  stroke: { width: 0 },
  legend: { position: 'bottom', labels: { colors: axisColor.value } },
  dataLabels: { enabled: true, formatter: (v) => `${Math.round(v)}%` },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true, label: 'Usuarios', color: axisColor.value,
            formatter: () => String(donutSeries.value.reduce((a, b) => a + b, 0)),
          },
        },
      },
    },
  },
  tooltip: { theme: themeMode.value },
}))

const byCompanySeries = ref([{ name: 'Empleados', data: [] }])
const byCompanyCats = ref([])
const byCompanyOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit', background: 'transparent' },
  theme: { mode: themeMode.value },
  colors: ['#0CA9C4'],
  plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '58%', distributed: false } },
  dataLabels: { enabled: true, style: { colors: [$q.dark.isActive ? '#e8eaf2' : '#0f172a'] }, offsetX: 18 },
  grid: { borderColor: gridColor.value, strokeDashArray: 4 },
  xaxis: {
    categories: byCompanyCats.value,
    labels: { style: { colors: axisColor.value } },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: axisColor.value } } },
  tooltip: { theme: themeMode.value },
}))

/* ---------- recent activity ---------- */
const ACTION_META = {
  create: { icon: 'add_circle', color: 'positive' },
  update: { icon: 'edit', color: 'primary' },
  delete: { icon: 'delete', color: 'negative' },
  correct: { icon: 'build', color: 'warning' },
  revoke: { icon: 'block', color: 'negative' },
  issue: { icon: 'vpn_key', color: 'primary' },
  login: { icon: 'login', color: 'grey' },
  approve: { icon: 'check_circle', color: 'positive' },
  reject: { icon: 'cancel', color: 'negative' },
}
const ENTITY_LABEL = {
  company: 'empresa', companies: 'empresa', user: 'usuario', users: 'usuario',
  attendance: 'asistencia', request: 'solicitud', requests: 'solicitud',
  payroll: 'liquidación', token: 'token DT', inspectorToken: 'token DT',
}

const recentActivity = computed(() =>
  auditRows.value.slice(0, 7).map((r) => {
    const verb = String(r.action || '').split('.').pop().toLowerCase()
    const meta = ACTION_META[verb] || { icon: 'bolt', color: 'primary' }
    const entity = ENTITY_LABEL[r.entity] || r.entity || 'registro'
    return {
      icon: meta.icon,
      color: meta.color,
      text: `${capitalize(verb)} · ${entity}`,
      actor: r.actorName || r.actorRole || 'Sistema',
      ago: timeAgo(r.createdAt),
    }
  })
)

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

/* ---------- role model ---------- */
const roleModel = [
  { role: 'superadmin', tag: 'tú', icon: 'shield', tone: 'primary',
    desc: 'Gestiona la plataforma: crea empresas y administradores RR.HH. No opera el día a día.' },
  { role: 'admin_rrhh', tag: 'uno por empresa', icon: 'admin_panel_settings', tone: 'teal',
    desc: 'Registra empleados, configura horarios y nómina, aprueba solicitudes y descarga reportes DT sólo de su empresa.' },
  { role: 'employee', tag: 'el trabajador', icon: 'person', tone: 'indigo',
    desc: 'Marca asistencia, ve su historial y comprobantes DT, hace solicitudes.' },
  { role: 'dt_inspector', tag: 'fiscalizador DT', icon: 'gavel', tone: 'amber',
    desc: 'Acceso read-only desde red oficial DT o por token externo (mín. 10 días).' },
]

/* ---------- load ---------- */
onMounted(async () => {
  try {
    const [companiesRes, usersRes, tokensRes, auditRes] = await Promise.all([
      secureAxios.get('/companies').catch(() => ({ data: [] })),
      secureAxios.get('/users').catch(() => ({ data: [] })),
      secureAxios.get('/dt/inspector-tokens').catch(() => ({ data: [] })),
      secureAxios.get('/audit', { params: { limit: 20 } }).catch(() => ({ data: [] })),
    ])

    companies.value = pickArray(companiesRes.data, 'companies')
    users.value = pickArray(usersRes.data, 'users')
    const tokens = pickArray(tokensRes.data, 'rows')
    auditRows.value = pickArray(auditRes.data, 'rows')

    const cs = companies.value
    const us = users.value
    const admins = us.filter((u) => u.role === 'admin_rrhh')
    const emps = us.filter((u) => u.role === 'employee')

    // KPIs
    stats.companies = cs.length
    stats.companiesInactive = cs.filter((c) => c.status && c.status !== 'active').length
    stats.companiesNew = cs.filter((c) => isThisMonth(c.createdAt)).length
    stats.rrhh = admins.length
    stats.rrhhNew = admins.filter((u) => isThisMonth(u.createdAt)).length
    stats.employees = emps.length
    stats.employeesNew = emps.filter((u) => isThisMonth(u.createdAt)).length
    stats.employeesPending = emps.filter(
      (u) => u.status === 'pending' || (u.active === false) || (u.activationCompletedAt == null && u.activationTokenHash)
    ).length

    const now = Date.now()
    const soon = now + 3 * 86400 * 1000
    const activeTokens = tokens.filter((t) => !t.revoked && new Date(t.expiresAt).getTime() > now)
    stats.dtTokens = activeTokens.length
    stats.dtExpiring = activeTokens.filter((t) => new Date(t.expiresAt).getTime() <= soon).length

    // Growth chart
    const compByMonth = Object.fromEntries(buckets.map((b) => [b.key, 0]))
    const empByMonth = Object.fromEntries(buckets.map((b) => [b.key, 0]))
    cs.forEach((c) => { const k = bucketKey(c.createdAt); if (k in compByMonth) compByMonth[k]++ })
    emps.forEach((e) => { const k = bucketKey(e.createdAt); if (k in empByMonth) empByMonth[k]++ })
    growthSeries.value = [
      { name: 'Empresas', data: buckets.map((b) => compByMonth[b.key]) },
      { name: 'Empleados', data: buckets.map((b) => empByMonth[b.key]) },
    ]

    // Donut
    const empActive = emps.length - stats.employeesPending
    donutSeries.value = [admins.length, Math.max(empActive, 0), stats.employeesPending]

    // Employees per company
    const nameById = Object.fromEntries(cs.map((c) => [String(c._id), c.name || c.rut || 'Empresa']))
    const countByCompany = {}
    emps.forEach((e) => {
      const cid = String(e.company || (Array.isArray(e.companies) ? e.companies[0] : '') || '')
      if (!cid) return
      countByCompany[cid] = (countByCompany[cid] || 0) + 1
    })
    const ranked = Object.entries(countByCompany)
      .map(([cid, n]) => ({ name: nameById[cid] || 'Empresa', n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
    byCompanyCats.value = ranked.map((r) => r.name)
    byCompanySeries.value = [{ name: 'Empleados', data: ranked.map((r) => r.n) }]
  } catch (err) {
    console.warn('[SuperadminDashboard] stats error:', err?.message)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.sa-page { padding: 16px; }
.sa-shell { max-width: 1400px; margin: 0 auto; }

/* ============ HERO ============ */
.sa-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  padding: 26px 30px;
  margin-bottom: 20px;
  color: #fff;
}
.sa-hero__bg {
  position: absolute; inset: 0;
  background: linear-gradient(120deg, #0893AA 0%, #0CA9C4 45%, #0893AA 100%);
}
.sa-hero__bg::after {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(circle at 88% 12%, rgba(255,255,255,0.22), transparent 42%),
    radial-gradient(circle at 12% 95%, rgba(0,0,0,0.18), transparent 50%);
}
.sa-hero__content {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; flex-wrap: wrap;
}
.sa-hero__left { display: flex; align-items: center; gap: 16px; }
.sa-hero__icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: rgba(255,255,255,0.18);
  display: grid; place-items: center;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.25);
}
.sa-hero__eyebrow {
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; opacity: 0.85;
}
.sa-hero__title { margin: 2px 0 6px; font-size: 1.7rem; font-weight: 800; line-height: 1.1; }
.sa-hero__meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.sa-hero__chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.78rem; font-weight: 600;
  padding: 3px 11px; border-radius: 20px;
  background: rgba(255,255,255,0.18);
}
.sa-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #4ade80;
  box-shadow: 0 0 0 0 rgba(74,222,128,0.7); animation: sa-pulse 1.8s infinite;
}
@keyframes sa-pulse {
  0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
  70% { box-shadow: 0 0 0 7px rgba(74,222,128,0); }
  100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
}
.sa-hero__date { display: inline-flex; align-items: center; gap: 5px; font-size: 0.82rem; opacity: 0.92; text-transform: capitalize; }
.sa-hero__actions { display: flex; gap: 10px; flex-wrap: wrap; }
.sa-hero__btn { border-radius: 12px; font-weight: 600; }

/* ============ KPI ============ */
.sa-kpis { margin-top: 0; }
.sa-kpi {
  border-radius: 18px;
  padding: 18px 18px 16px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  position: relative; overflow: hidden;
}
.sa-kpi::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background: var(--accent, #0CA9C4);
}
.sa-kpi:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.16); }
.sa-kpi--primary { --accent: #0CA9C4; }
.sa-kpi--teal { --accent: #0893AA; }
.sa-kpi--indigo { --accent: #6366f1; }
.sa-kpi--amber { --accent: #f59e0b; }
.sa-kpi__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.sa-kpi__ico {
  width: 42px; height: 42px; border-radius: 12px;
  display: grid; place-items: center;
  color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent);
}
.sa-kpi__delta { font-size: 0.68rem; font-weight: 700; padding: 3px 8px; }
.sa-kpi__delta--up { background: rgba(34,197,94,0.16); color: #16a34a; }
.sa-kpi__delta--flat { background: rgba(148,163,184,0.16); color: #64748b; }
.sa-kpi__value { font-size: 2.1rem; font-weight: 800; line-height: 1; color: var(--text-primary); }
.sa-kpi__label { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin-top: 6px; }
.sa-kpi__sub { font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px; }

/* ============ CARDS ============ */
.sa-card {
  border-radius: 18px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  padding: 6px 6px 12px;
}
.full-height { height: 100%; }
.sa-card__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 14px 16px 6px;
}
.sa-card__title { font-size: 1.02rem; font-weight: 700; color: var(--text-primary); }
.sa-card__sub { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }
.sa-card__headico { font-size: 22px; color: var(--text-secondary); opacity: 0.6; }

.sa-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 48px 16px; color: var(--text-secondary); opacity: 0.7;
  font-size: 0.86rem;
}

/* ============ FEED ============ */
.sa-feed { padding: 4px 6px 8px; }
.sa-feed__item { border-radius: 12px; }
.sa-feed__item:hover { background: var(--surface-soft); }
.sa-feed__ico {
  width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;
}
.sa-feed__ico--positive { background: rgba(34,197,94,0.15); color: #16a34a; }
.sa-feed__ico--primary { background: rgba(12, 169, 196,0.15); color: #0893AA; }
.sa-feed__ico--negative { background: rgba(239,68,68,0.15); color: #dc2626; }
.sa-feed__ico--warning { background: rgba(245,158,11,0.15); color: #d97706; }
.sa-feed__ico--grey { background: rgba(148,163,184,0.18); color: #64748b; }
.sa-feed__title { font-weight: 600; font-size: 0.88rem; color: var(--text-primary); }
.sa-feed__meta { font-size: 0.75rem; color: var(--text-secondary); }

/* ============ COMPLIANCE ============ */
.sa-comp { padding: 4px 16px 12px; }
.sa-comp__row { display: flex; align-items: center; gap: 14px; padding: 6px 0; }
.sa-comp__ico { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 20px; }
.sa-comp__ico--ok { background: rgba(12, 169, 196,0.14); color: #0893AA; }
.sa-comp__ico--warn { background: rgba(245,158,11,0.16); color: #d97706; }
.sa-comp__body { flex: 1; }
.sa-comp__val { font-size: 1.35rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.sa-comp__lbl { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }

/* ============ ROLES ============ */
.sa-roles { padding: 6px 16px 14px; display: grid; gap: 12px; }
.sa-role { display: flex; gap: 14px; align-items: flex-start; }
.sa-role__ico { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; }
.sa-role__ico--primary { background: rgba(12, 169, 196,0.14); color: #0893AA; }
.sa-role__ico--teal { background: rgba(8, 147, 170,0.14); color: #067C90; }
.sa-role__ico--indigo { background: rgba(99,102,241,0.14); color: #4f46e5; }
.sa-role__ico--amber { background: rgba(245,158,11,0.16); color: #d97706; }
.sa-role__name { font-weight: 700; font-size: 0.92rem; color: var(--text-primary); }
.sa-role__tag { font-weight: 500; color: var(--text-secondary); font-size: 0.84rem; }
.sa-role__desc { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; line-height: 1.4; }

body.body--dark .sa-kpi__delta--up { color: #4ade80; }
body.body--dark .sa-feed__ico--primary,
body.body--dark .sa-comp__ico--ok,
body.body--dark .sa-role__ico--primary { color: #33BECB; }
</style>
