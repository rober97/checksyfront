<template>
  <q-page class="sa-page">
    <div class="sa-shell">
      <!-- ============ HERO ============ -->
      <header class="sa-hero">
        <div class="sa-hero__bg"></div>
        <div class="sa-hero__content">
          <div class="sa-hero__left">
            <div class="sa-hero__icon">
              <q-icon name="insights" size="30px" />
            </div>
            <div>
              <div class="sa-hero__eyebrow">Plataforma Recksy</div>
              <h1 class="sa-hero__title">Analítica web</h1>
              <div class="sa-hero__meta">
                <span class="sa-hero__chip">
                  <q-icon name="language" size="15px" /> Tráfico de recksy.com
                </span>
                <span class="sa-hero__date">
                  <q-icon name="event" size="15px" /> {{ rangeLabel }}
                </span>
              </div>
            </div>
          </div>
          <div class="sa-hero__actions">
            <q-btn-toggle
              v-model="days"
              :options="rangeOptions"
              unelevated no-caps dense
              toggle-color="white"
              toggle-text-color="primary"
              text-color="white"
              class="sa-hero__toggle"
              @update:model-value="load"
            />
            <q-btn
              flat round color="white" icon="refresh"
              :loading="loading" @click="load"
            >
              <q-tooltip>Actualizar</q-tooltip>
            </q-btn>
          </div>
        </div>
      </header>

      <!-- ============ KPIs ============ -->
      <div class="row q-col-gutter-md sa-kpis">
        <div v-for="k in kpiCards" :key="k.key" class="col-12 col-sm-6 col-lg-3">
          <q-card flat class="sa-kpi" :class="`sa-kpi--${k.tone}`">
            <div class="sa-kpi__top">
              <div class="sa-kpi__ico"><q-icon :name="k.icon" size="22px" /></div>
            </div>
            <div class="sa-kpi__value">
              <template v-if="loading"><q-skeleton type="text" width="56px" /></template>
              <template v-else>{{ k.value }}</template>
            </div>
            <div class="sa-kpi__label">{{ k.label }}</div>
            <div class="sa-kpi__sub">{{ k.sub }}</div>
          </q-card>
        </div>
      </div>

      <!-- ============ CHART: tráfico en el tiempo ============ -->
      <div class="row q-col-gutter-md q-mt-xs">
        <div class="col-12 col-lg-8">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">Tráfico en el tiempo</div>
                <div class="sa-card__sub">Visitas y visitantes únicos por día</div>
              </div>
              <q-icon name="show_chart" class="sa-card__headico" />
            </div>
            <apexchart
              v-if="hasTraffic"
              type="area" height="300"
              :options="trafficOptions" :series="trafficSeries"
            />
            <div v-else class="sa-empty">
              <q-icon name="query_stats" size="34px" />
              <span>Aún no hay visitas registradas en este período.</span>
              <span class="sa-empty__hint">
                El registro comienza a poblarse cuando alguien abre recksy.com.
              </span>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-lg-4">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">Dispositivos</div>
                <div class="sa-card__sub">Con qué entran a la web</div>
              </div>
              <q-icon name="devices" class="sa-card__headico" />
            </div>
            <apexchart
              v-if="hasDevices"
              type="donut" height="300"
              :options="deviceOptions" :series="deviceSeries"
            />
            <div v-else class="sa-empty">
              <q-icon name="devices" size="34px" /> <span>Sin datos aún</span>
            </div>
          </q-card>
        </div>
      </div>

      <!-- ============ TOP páginas + referrers ============ -->
      <div class="row q-col-gutter-md q-mt-xs">
        <div class="col-12 col-lg-7">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">Páginas más visitadas</div>
                <div class="sa-card__sub">Dónde aterrizan tus visitantes</div>
              </div>
              <q-icon name="description" class="sa-card__headico" />
            </div>
            <apexchart
              v-if="topPages.length"
              type="bar" height="320"
              :options="pagesOptions" :series="pagesSeries"
            />
            <div v-else class="sa-empty">
              <q-icon name="inbox" size="34px" /> <span>Sin páginas registradas aún</span>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-lg-5">
          <q-card flat bordered class="sa-card full-height">
            <div class="sa-card__head">
              <div>
                <div class="sa-card__title">De dónde llegan</div>
                <div class="sa-card__sub">Fuentes de tráfico (referrers)</div>
              </div>
              <q-icon name="alt_route" class="sa-card__headico" />
            </div>

            <div v-if="loading" class="q-pa-md">
              <q-skeleton v-for="n in 4" :key="n" type="text" class="q-mb-sm" />
            </div>
            <q-list v-else-if="topReferrers.length" class="sa-feed">
              <q-item v-for="(r, i) in topReferrers" :key="i" class="sa-feed__item">
                <q-item-section avatar>
                  <div class="sa-feed__ico sa-feed__ico--primary">
                    <q-icon name="public" size="18px" />
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="sa-feed__title">{{ r.host }}</q-item-label>
                  <q-item-label caption class="sa-feed__meta">
                    {{ r.count }} visita{{ r.count === 1 ? '' : 's' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="sa-ref__bar">
                    <div class="sa-ref__fill" :style="{ width: refPct(r.count) + '%' }"></div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="sa-empty">
              <q-icon name="explore_off" size="34px" />
              <span>Sin referrers todavía</span>
              <span class="sa-empty__hint">
                La mayoría de las visitas iniciales llegan directas (sin fuente).
              </span>
            </div>
          </q-card>
        </div>
      </div>

      <!-- nota privacidad -->
      <div class="sa-note">
        <q-icon name="lock" size="16px" />
        <span>
          Analítica propia y privada: no usamos Google Analytics ni cookies de
          terceros. Los visitantes se cuentan con un identificador anónimo, sin
          datos personales.
        </span>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'

const $q = useQuasar()
const loading = ref(true)

const days = ref(30)
const rangeOptions = [
  { label: '7 días', value: 7 },
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
]

const totals = ref({ pageviews: 0, uniqueVisitors: 0, directVisits: 0, bots: 0 })
const series = ref([])          // [{ date, pageviews, uniqueVisitors }]
const topPages = ref([])        // [{ path, count }]
const topReferrers = ref([])    // [{ host, count }]
const devices = ref({ mobile: 0, tablet: 0, desktop: 0, bot: 0 })

/* ---------- theme-aware colors ---------- */
const axisColor = computed(() => ($q.dark.isActive ? '#9aa3b8' : '#64748b'))
const gridColor = computed(() => ($q.dark.isActive ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'))
const themeMode = computed(() => ($q.dark.isActive ? 'dark' : 'light'))

const rangeLabel = computed(() => `Últimos ${days.value} días`)

/* ---------- KPI cards ---------- */
const kpiCards = computed(() => [
  {
    key: 'views', icon: 'visibility', tone: 'primary',
    label: 'Visitas (páginas vistas)', value: fmt(totals.value.pageviews),
    sub: 'total del período',
  },
  {
    key: 'visitors', icon: 'group', tone: 'teal',
    label: 'Visitantes únicos', value: fmt(totals.value.uniqueVisitors),
    sub: 'navegadores distintos',
  },
  {
    key: 'direct', icon: 'my_location', tone: 'indigo',
    label: 'Visitas directas', value: fmt(totals.value.directVisits),
    sub: 'sin fuente / enlace externo',
  },
  {
    key: 'bots', icon: 'smart_toy', tone: 'amber',
    label: 'Bots detectados', value: fmt(totals.value.bots),
    sub: 'excluidos de las métricas',
  },
])

/* ---------- traffic chart ---------- */
const hasTraffic = computed(() => totals.value.pageviews > 0)

const trafficSeries = computed(() => [
  { name: 'Visitas', data: series.value.map((d) => d.pageviews) },
  { name: 'Visitantes únicos', data: series.value.map((d) => d.uniqueVisitors) },
])

const trafficOptions = computed(() => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', background: 'transparent' },
  theme: { mode: themeMode.value },
  colors: ['#0CA9C4', '#6366f1'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] } },
  grid: { borderColor: gridColor.value, strokeDashArray: 4 },
  xaxis: {
    categories: series.value.map((d) => shortDate(d.date)),
    labels: { style: { colors: axisColor.value }, rotate: 0, hideOverlappingLabels: true },
    axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: 8,
  },
  yaxis: { labels: { style: { colors: axisColor.value } }, min: 0, forceNiceScale: true },
  legend: { labels: { colors: axisColor.value }, markers: { radius: 12 } },
  tooltip: { theme: themeMode.value, x: { formatter: (_, { dataPointIndex }) => longDate(series.value[dataPointIndex]?.date) } },
}))

/* ---------- device donut ---------- */
const hasDevices = computed(() =>
  (devices.value.mobile + devices.value.tablet + devices.value.desktop) > 0
)
const deviceSeries = computed(() => [
  devices.value.desktop, devices.value.mobile, devices.value.tablet,
])
const deviceOptions = computed(() => ({
  chart: { fontFamily: 'inherit', background: 'transparent' },
  theme: { mode: themeMode.value },
  labels: ['Escritorio', 'Móvil', 'Tablet'],
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
            show: true, label: 'Visitas', color: axisColor.value,
            formatter: () => String(deviceSeries.value.reduce((a, b) => a + b, 0)),
          },
        },
      },
    },
  },
  tooltip: { theme: themeMode.value },
}))

/* ---------- top pages bar ---------- */
const pagesSeries = computed(() => [{ name: 'Visitas', data: topPages.value.map((p) => p.count) }])
const pagesOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit', background: 'transparent' },
  theme: { mode: themeMode.value },
  colors: ['#0CA9C4'],
  plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '58%' } },
  dataLabels: { enabled: true, style: { colors: [$q.dark.isActive ? '#e8eaf2' : '#0f172a'] }, offsetX: 18 },
  grid: { borderColor: gridColor.value, strokeDashArray: 4 },
  xaxis: {
    categories: topPages.value.map((p) => p.path),
    labels: { style: { colors: axisColor.value } },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: axisColor.value } } },
  tooltip: { theme: themeMode.value },
}))

/* ---------- referrers bar width ---------- */
const maxRef = computed(() => Math.max(1, ...topReferrers.value.map((r) => r.count)))
function refPct(n) { return Math.round((n / maxRef.value) * 100) }

/* ---------- helpers ---------- */
function fmt(n) { return new Intl.NumberFormat('es-CL').format(Number(n) || 0) }
function shortDate(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}
function longDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
}

/* ---------- load ---------- */
async function load() {
  loading.value = true
  try {
    const { data } = await secureAxios.get('/analytics/summary', { params: { days: days.value } })
    totals.value = data?.totals || { pageviews: 0, uniqueVisitors: 0, directVisits: 0, bots: 0 }
    series.value = Array.isArray(data?.series) ? data.series : []
    topPages.value = Array.isArray(data?.topPages) ? data.topPages : []
    topReferrers.value = Array.isArray(data?.topReferrers) ? data.topReferrers : []
    devices.value = data?.devices || { mobile: 0, tablet: 0, desktop: 0, bot: 0 }
  } catch (err) {
    console.warn('[Analitica] error:', err?.message)
    $q.notify?.({ type: 'negative', message: 'No se pudo cargar la analítica' })
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.sa-page { padding: 16px; }
.sa-shell { max-width: 1400px; margin: 0 auto; }

/* ============ HERO ============ */
.sa-hero {
  position: relative; border-radius: 20px; overflow: hidden;
  padding: 26px 30px; margin-bottom: 20px; color: #fff;
}
.sa-hero__bg { position: absolute; inset: 0; background: linear-gradient(120deg, #0893AA 0%, #0CA9C4 45%, #0893AA 100%); }
.sa-hero__bg::after {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(circle at 88% 12%, rgba(255,255,255,0.22), transparent 42%),
    radial-gradient(circle at 12% 95%, rgba(0,0,0,0.18), transparent 50%);
}
.sa-hero__content { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.sa-hero__left { display: flex; align-items: center; gap: 16px; }
.sa-hero__icon {
  width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,0.18);
  display: grid; place-items: center; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.25);
}
.sa-hero__eyebrow { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.85; }
.sa-hero__title { margin: 2px 0 6px; font-size: 1.7rem; font-weight: 800; line-height: 1.1; }
.sa-hero__meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.sa-hero__chip { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; padding: 3px 11px; border-radius: 20px; background: rgba(255,255,255,0.18); }
.sa-hero__date { display: inline-flex; align-items: center; gap: 5px; font-size: 0.82rem; opacity: 0.92; }
.sa-hero__actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.sa-hero__toggle { border-radius: 12px; font-weight: 600; border: 1px solid rgba(255,255,255,0.35); overflow: hidden; }

/* ============ KPI ============ */
.sa-kpis { margin-top: 0; }
.sa-kpi {
  border-radius: 18px; padding: 18px 18px 16px;
  background: var(--card-background); border: 1px solid var(--border-color);
  box-shadow: var(--shadow-soft); position: relative; overflow: hidden;
  transition: transform .18s ease, box-shadow .18s ease;
}
.sa-kpi::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--accent, #0CA9C4); }
.sa-kpi:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.16); }
.sa-kpi--primary { --accent: #0CA9C4; }
.sa-kpi--teal { --accent: #0893AA; }
.sa-kpi--indigo { --accent: #6366f1; }
.sa-kpi--amber { --accent: #f59e0b; }
.sa-kpi__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.sa-kpi__ico { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
.sa-kpi__value { font-size: 2.1rem; font-weight: 800; line-height: 1; color: var(--text-primary); }
.sa-kpi__label { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin-top: 6px; }
.sa-kpi__sub { font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px; }

/* ============ CARDS ============ */
.sa-card { border-radius: 18px; background: var(--card-background); border: 1px solid var(--border-color); padding: 6px 6px 12px; }
.full-height { height: 100%; }
.sa-card__head { display: flex; align-items: flex-start; justify-content: space-between; padding: 14px 16px 6px; }
.sa-card__title { font-size: 1.02rem; font-weight: 700; color: var(--text-primary); }
.sa-card__sub { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }
.sa-card__headico { font-size: 22px; color: var(--text-secondary); opacity: 0.6; }

.sa-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 48px 16px; color: var(--text-secondary); opacity: 0.75; font-size: 0.86rem; text-align: center;
}
.sa-empty__hint { font-size: 0.76rem; opacity: 0.8; max-width: 320px; }

/* ============ FEED (referrers) ============ */
.sa-feed { padding: 4px 6px 8px; }
.sa-feed__item { border-radius: 12px; }
.sa-feed__item:hover { background: var(--surface-soft); }
.sa-feed__ico { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; }
.sa-feed__ico--primary { background: rgba(12, 169, 196,0.15); color: #0893AA; }
.sa-feed__title { font-weight: 600; font-size: 0.88rem; color: var(--text-primary); word-break: break-all; }
.sa-feed__meta { font-size: 0.75rem; color: var(--text-secondary); }
.sa-ref__bar { width: 80px; height: 6px; border-radius: 4px; background: rgba(12,169,196,0.14); overflow: hidden; }
.sa-ref__fill { height: 100%; border-radius: 4px; background: #0CA9C4; }

/* ============ NOTE ============ */
.sa-note {
  display: flex; align-items: center; gap: 8px; margin-top: 18px; padding: 10px 14px;
  border-radius: 12px; font-size: 0.78rem; color: var(--text-secondary);
  background: var(--surface-soft); border: 1px solid var(--border-color);
}

body.body--dark .sa-feed__ico--primary { color: #33BECB; }
</style>
