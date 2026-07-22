<template>
  <q-page class="dashboard-page">
    <!-- Barra superior compacta: identidad + rango, en una sola línea -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-avatar">{{ initials }}</div>
          <div class="header-text">
            <h1 class="header-title">Hola, {{ welcomeName }}</h1>
            <div class="header-meta">
              <span class="role-chip" v-if="roleLabel">{{ roleLabel }}</span>
              <span class="meta-item">{{ periodLabel }}</span>
              <span class="meta-divider">•</span>
              <span class="meta-item">act. {{ lastUpdatedText }}</span>
            </div>
          </div>
        </div>

        <div class="header-controls">
          <div class="preset-pills">
            <button
              v-for="preset in presetOptions"
              :key="preset.value"
              @click="onPresetChange(preset.value)"
              :class="['preset-pill', { active: rangePreset === preset.value }]"
            >
              {{ preset.label }}
            </button>
          </div>

          <!-- El selector de fechas sólo aparece en modo CUSTOM: ocupaba media
               barra para estar deshabilitado el 99% del tiempo. -->
          <q-btn v-if="rangePreset === 'custom'" class="date-picker-btn" flat dense no-caps>
            <q-icon name="event" size="16px" class="q-mr-xs" />
            <span>{{ dateRangeLabel }}</span>
            <q-popup-proxy ref="popup" transition-show="scale" transition-hide="scale">
              <q-date v-model="range" mask="YYYY-MM-DD" range minimal :options="dateGuard">
                <div class="row items-center justify-end q-pa-sm q-gutter-sm">
                  <q-btn flat label="Limpiar" size="sm" @click="clearCustom" />
                  <q-btn flat label="Cancelar" size="sm" v-close-popup />
                  <q-btn
                    unelevated
                    color="primary"
                    label="Aplicar"
                    size="sm"
                    @click="applyCustomRange"
                    v-close-popup
                  />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-btn>

          <q-btn round flat dense icon="refresh" :loading="loading" @click="reload" class="refresh-btn">
            <q-tooltip>Actualizar datos</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Contenedor principal con padding -->
    <div class="dashboard-container">
      <!-- Quick Actions mejorado -->
      <div v-if="quickLinks.length" class="quick-actions-section">
        <div class="section-label">Acceso rápido</div>
        <div class="quick-actions">
          <router-link
            v-for="quick in quickLinks"
            :key="quick.to"
            :to="quick.to"
            class="quick-action-card"
          >
            <div class="action-icon">
              <q-icon :name="quick.icon" size="24px" />
            </div>
            <span class="action-label">{{ quick.label }}</span>
            <q-icon name="arrow_forward" size="16px" class="action-arrow" />
          </router-link>
        </div>
      </div>

      <!-- KPIs genéricos (empleado / superadmin / inspector).
           RR.HH. tiene su propio panel más abajo, con datos de empresa. -->
      <div v-if="!isRrhh" class="kpis-section">
        <div class="section-label">Métricas principales</div>
        
        <!-- Loading State -->
        <div v-if="loading" class="kpis-grid">
          <div v-for="i in 6" :key="'sk-' + i" class="kpi-skeleton">
            <q-skeleton type="rect" height="100%" class="rounded-borders" />
          </div>
        </div>

        <!-- Error State -->
        <q-card v-else-if="error" flat bordered class="error-card">
          <q-card-section class="text-center q-py-lg">
            <q-icon name="error_outline" size="48px" color="negative" />
            <div class="text-h6 q-mt-md">Error al cargar datos</div>
            <div class="text-grey-7 q-mt-sm">{{ error }}</div>
            <q-btn
              unelevated
              color="primary"
              label="Reintentar"
              class="q-mt-md"
              @click="reload"
            />
          </q-card-section>
        </q-card>

        <!-- KPI Cards Grid -->
        <div v-else class="kpis-grid">
          <!-- Asistencias (Siempre) -->
          <KpiCard
            title="Asistencias"
            :value="asistencias"
            icon="event_available"
            icon-gradient="linear-gradient(135deg, #0CA9C4 0%, #0893AA 100%)"
            format-type="auto"
            trend="positive"
          />

          <!-- Días Vacaciones (Solo Empleado) -->
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Días Vacaciones"
            :value="vacaciones"
            icon="beach_access"
            icon-gradient="linear-gradient(135deg, #33BECB 0%, #0CA9C4 100%)"
            format-type="decimal"
            :decimals="0"
            subtitle="Disponibles este año"
          />

          <!-- Solicitudes Pendientes -->
          <KpiCard
            title="Solicitudes Pendientes"
            :value="solicitudes"
            icon="hourglass_empty"
            icon-gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            format-type="auto"
            :badge="solicitudes > 0 ? solicitudes : null"
          />

          <!-- Usuarios Activos (Superadmin y AdminRrhh) -->
          <KpiCard
            v-if="roleDisplay === 'Superadmin'"
            title="Usuarios Activos"
            :value="usuariosActivos"
            icon="people"
            icon-gradient="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            format-type="compact"
            subtitle="En el sistema"
          />

          <!-- Empresas Registradas (Solo Superadmin) -->
          <KpiCard
            v-if="roleDisplay === 'Superadmin'"
            title="Empresas Registradas"
            :value="empresas"
            icon="apartment"
            icon-gradient="linear-gradient(135deg, #0893AA 0%, #067C90 100%)"
            format-type="auto"
            trend="positive"
          />

          <!-- Días Administrativos (Solo Empleado) -->
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Días Administrativos"
            :value="diasAdmin"
            icon="calendar_today"
            icon-gradient="linear-gradient(135deg, #33BECB 0%, #0CA9C4 100%)"
            format-type="decimal"
            :decimals="0"
            subtitle="Disponibles"
          />

          <!-- Último Check-in (Solo Empleado) -->
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Último Check-in"
            :value="ultimoCheck || '—'"
            icon="access_time"
            icon-gradient="linear-gradient(135deg, #0CA9C4 0%, #0893AA 100%)"
            format-type="time"
            variant="highlight"
            subtitle="Hora de entrada"
          />
        </div>
      </div>

      <!-- =============== Panel RR.HH. (solo admin_rrhh) =============== -->
      <section v-if="isRrhh" class="rrhh-section">
        <!-- Tiles densos: lo que RR.HH. mira todos los días -->
        <div class="section-label">Tu empresa hoy</div>

        <div v-if="rrhhError" class="rk-card rk-card--error">
          <q-icon name="error_outline" size="22px" />
          <span>{{ rrhhError }}</span>
          <q-btn flat dense no-caps color="primary" label="Reintentar" @click="reload" />
        </div>

        <div v-else class="rk-tiles">
          <template v-if="!rrhh">
            <div v-for="i in 6" :key="'tsk-' + i" class="rk-tile">
              <q-skeleton type="rect" height="58px" class="rounded-borders" />
            </div>
          </template>

          <template v-else>
            <router-link to="/rrhh/users" class="rk-tile rk-tile--link">
              <div class="rk-tile__ico rk-tile__ico--brand"><q-icon name="groups" size="20px" /></div>
              <div class="rk-tile__body">
                <div class="rk-tile__value">{{ rrhh.headcount.total }}</div>
                <div class="rk-tile__label">Dotación</div>
                <div class="rk-tile__sub">
                  {{ rrhh.headcount.active }} activos
                  <template v-if="rrhh.headcount.pending"> · {{ rrhh.headcount.pending }} por activar</template>
                </div>
              </div>
            </router-link>

            <div class="rk-tile">
              <div class="rk-tile__ico rk-tile__ico--ok"><q-icon name="how_to_reg" size="20px" /></div>
              <div class="rk-tile__body">
                <div class="rk-tile__value">
                  {{ rrhh.today.presentes }}<span class="rk-tile__of">/{{ rrhh.today.dotacion }}</span>
                </div>
                <div class="rk-tile__label">Presentes hoy</div>
                <div class="rk-tile__sub">{{ rrhh.today.enJornada }} aún en jornada</div>
              </div>
              <div class="rk-tile__meter"><span :style="{ width: rrhh.today.cobertura + '%' }" /></div>
            </div>

            <router-link to="/rrhh/requests" class="rk-tile rk-tile--link">
              <div class="rk-tile__ico rk-tile__ico--warn"><q-icon name="pending_actions" size="20px" /></div>
              <div class="rk-tile__body">
                <div class="rk-tile__value">{{ rrhh.requests.pending }}</div>
                <div class="rk-tile__label">Por aprobar</div>
                <div class="rk-tile__sub">{{ rrhh.requests.upcoming.length }} ausencias próximas</div>
              </div>
            </router-link>

            <router-link to="/rrhh/horas-extra" class="rk-tile rk-tile--link">
              <div class="rk-tile__ico rk-tile__ico--info"><q-icon name="more_time" size="20px" /></div>
              <div class="rk-tile__body">
                <div class="rk-tile__value">{{ rrhh.overtime.horas }}<span class="rk-tile__of"> h</span></div>
                <div class="rk-tile__label">Horas extra autorizadas</div>
                <div class="rk-tile__sub">{{ rrhh.overtime.autorizaciones }} autorizaciones · {{ rrhhRangeLabel }}</div>
              </div>
            </router-link>

            <div class="rk-tile">
              <div class="rk-tile__ico rk-tile__ico--purple"><q-icon name="beach_access" size="20px" /></div>
              <div class="rk-tile__body">
                <div class="rk-tile__value">{{ rrhh.timeOff.vacaciones }}</div>
                <div class="rk-tile__label">Días de vacaciones acumulados</div>
                <div class="rk-tile__sub">+{{ rrhh.timeOff.administrativos }} administrativos</div>
              </div>
            </div>

            <router-link to="/rrhh/payroll" class="rk-tile rk-tile--link">
              <div class="rk-tile__ico rk-tile__ico--money"><q-icon name="payments" size="20px" /></div>
              <div class="rk-tile__body">
                <div class="rk-tile__value">{{ rrhh.payroll.issued }}<span class="rk-tile__of">/{{ rrhh.headcount.active }}</span></div>
                <div class="rk-tile__label">Liquidaciones emitidas</div>
                <div class="rk-tile__sub">
                  {{ periodoNombre }}<template v-if="rrhh.payroll.draft"> · {{ rrhh.payroll.draft }} en borrador</template>
                </div>
              </div>
            </router-link>
          </template>
        </div>

        <!-- Alertas accionables: sólo aparecen si hay algo que hacer -->
        <div v-if="alertList.length" class="rk-alerts">
          <router-link v-for="a in alertList" :key="a.label" :to="a.to" class="rk-alert" :class="`rk-alert--${a.tone}`">
            <q-icon :name="a.icon" size="18px" />
            <b>{{ a.count }}</b>
            <span>{{ a.label }}</span>
          </router-link>
        </div>

        <div class="section-label q-mt-md">Análisis del período</div>
        <div class="rrhh-grid">
          <!-- Asistencia diaria -->
          <div class="rk-card span-8">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">Asistencia diaria</div>
                <div class="rk-card__sub">Personas que marcaron cada día · {{ rrhhRangeLabel }}</div>
              </div>
              <div class="rk-card__stat" v-if="rrhh">
                <b>{{ rrhh.attendance.promedioPresentes }}</b> promedio/día
              </div>
            </div>
            <apexchart
              v-if="chartReady && attendanceSeriesData.length"
              type="area" height="260"
              :options="attendanceAreaOptions" :series="attendanceAreaSeries"
            />
            <div v-else class="rk-empty"><q-icon name="show_chart" size="32px" /><span>Sin marcas en el período</span></div>
          </div>

          <!-- Dotación -->
          <div class="rk-card span-4">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">Dotación</div>
                <div class="rk-card__sub">Estado de las cuentas</div>
              </div>
              <q-icon name="groups" class="rk-card__ico" />
            </div>
            <div class="rk-headcount" v-if="rrhh">
              <div class="rk-hc__big">{{ rrhh.headcount.total }}</div>
              <div class="rk-hc__lbl">personas en la empresa</div>
            </div>
            <div class="rk-hc-bar" v-if="rrhh && rrhh.headcount.total">
              <span
                v-for="seg in headcountSegments"
                :key="seg.key"
                class="rk-hc-bar__seg"
                :style="{ width: seg.pct + '%', background: seg.color }"
              >
                <q-tooltip>{{ seg.label }}: {{ seg.value }}</q-tooltip>
              </span>
            </div>
            <div class="rk-hc-legend">
              <span v-for="seg in headcountSegments" :key="seg.key">
                <i class="dot" :style="{ background: seg.color }"></i> {{ seg.label }} <b>{{ seg.value }}</b>
              </span>
            </div>
            <div class="rk-hc-contracts" v-if="contractRows.length">
              <div class="rk-hc-contracts__t">Tipo de contrato</div>
              <div v-for="c in contractRows" :key="c.tipo" class="rk-hc-row">
                <span class="rk-hc-row__l">{{ c.label }}</span>
                <span class="rk-hc-row__bar"><i :style="{ width: c.pct + '%' }" /></span>
                <b>{{ c.total }}</b>
              </div>
            </div>
            <q-btn flat dense no-caps color="primary" icon="people" label="Gestionar empleados" to="/rrhh/users" class="rk-hc-btn" />
          </div>

          <!-- Solicitudes por estado -->
          <div class="rk-card span-4">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">Solicitudes</div>
                <div class="rk-card__sub">Distribución histórica</div>
              </div>
              <q-icon name="donut_large" class="rk-card__ico" />
            </div>
            <apexchart
              v-if="chartReady && reqDonutTotal > 0"
              type="donut" height="240"
              :options="reqDonutOptions" :series="reqDonutSeries"
            />
            <div v-else class="rk-empty"><q-icon name="inbox" size="32px" /><span>Sin solicitudes registradas</span></div>
          </div>

          <!-- Cola de aprobación -->
          <div class="rk-card span-4">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">
                  Cola de aprobación
                  <q-badge v-if="rrhh && rrhh.requests.pending" color="orange" class="q-ml-sm">{{ rrhh.requests.pending }}</q-badge>
                </div>
                <div class="rk-card__sub">Esperan tu decisión</div>
              </div>
              <q-btn flat dense no-caps color="primary" label="Ver todas" to="/rrhh/requests" />
            </div>
            <q-list v-if="rrhh && rrhh.requests.queue.length" class="rk-reqs">
              <q-item v-for="r in rrhh.requests.queue" :key="r.id" class="rk-req">
                <q-item-section avatar>
                  <div class="rk-req__ico"><q-icon :name="(REQ_TYPE[r.type] || {}).icon || 'description'" size="18px" /></div>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="rk-req__title">{{ r.user }}</q-item-label>
                  <q-item-label caption class="rk-req__meta">
                    {{ (REQ_TYPE[r.type] || {}).label || r.type }} · {{ reqDateRange(r) }} · {{ timeAgo(r.createdAt) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="rk-empty"><q-icon name="task_alt" size="32px" /><span>Nada pendiente</span></div>
          </div>

          <!-- Próximas ausencias -->
          <div class="rk-card span-4">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">Próximas ausencias</div>
                <div class="rk-card__sub">Aprobadas, para planificar turnos</div>
              </div>
              <q-icon name="event_busy" class="rk-card__ico" />
            </div>
            <q-list v-if="rrhh && rrhh.requests.upcoming.length" class="rk-reqs">
              <q-item v-for="r in rrhh.requests.upcoming" :key="r.id" class="rk-req">
                <q-item-section avatar>
                  <div class="rk-req__ico rk-req__ico--soft"><q-icon :name="(REQ_TYPE[r.type] || {}).icon || 'event'" size="18px" /></div>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="rk-req__title">{{ r.user }}</q-item-label>
                  <q-item-label caption class="rk-req__meta">
                    {{ (REQ_TYPE[r.type] || {}).label || r.type }} · {{ reqDateRange(r) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="rk-empty"><q-icon name="event_available" size="32px" /><span>Sin ausencias programadas</span></div>
          </div>

          <!-- Saldos + cumpleaños -->
          <div class="rk-card span-4">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">Saldos y agenda</div>
                <div class="rk-card__sub">Vacaciones acumuladas y cumpleaños</div>
              </div>
              <q-icon name="cake" class="rk-card__ico" />
            </div>

            <div v-if="rrhh && rrhh.timeOff.top.length" class="rk-top">
              <div class="rk-top__t">Mayor saldo de vacaciones</div>
              <div v-for="t in rrhh.timeOff.top" :key="t.name" class="rk-hc-row">
                <span class="rk-hc-row__l">{{ t.name }}</span>
                <span class="rk-hc-row__bar"><i :style="{ width: topVacPct(t.dias) + '%' }" /></span>
                <b>{{ t.dias }} d</b>
              </div>
            </div>

            <div v-if="rrhh && rrhh.birthdays.length" class="rk-bdays">
              <div class="rk-top__t">Cumpleaños del mes</div>
              <span v-for="b in rrhh.birthdays" :key="b.name" class="rk-bday" :class="{ 'is-today': b.isToday }">
                {{ b.name }} · {{ b.day }}
              </span>
            </div>

            <div v-if="rrhh && !rrhh.timeOff.top.length && !rrhh.birthdays.length" class="rk-empty">
              <q-icon name="inbox" size="32px" /><span>Sin datos todavía</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Role-specific Banners (modelo 2026) -->
      <transition name="slide-up">
        <div v-if="roleDisplay === 'Superadmin'" class="info-banner admin">
          <div class="banner-content">
            <div class="banner-icon">
              <q-icon name="shield" size="32px" />
            </div>
            <div class="banner-text">
              <div class="banner-title">Panel Superadmin — Plataforma</div>
              <div class="banner-description">
                Gestiona empresas cliente, administradores RR.HH. y supervisa
                el cumplimiento DT de toda la plataforma.
              </div>
            </div>
          </div>
          <q-btn
            unelevated
            color="white"
            text-color="primary"
            label="Ir a empresas"
            to="/superadmin/empresas"
            no-caps
          />
        </div>
      </transition>

      <!-- RR.HH. no lleva banner: el texto era decorativo y su único botón
           ("Gestionar empleados") ya está en Acceso rápido y en la tarjeta de
           Dotación. Ocupaba una franja entera sin aportar información. -->

      <transition name="slide-up">
        <div v-if="roleDisplay === 'Empleado'" class="info-banner employee">
          <div class="banner-content">
            <div class="banner-icon">
              <q-icon name="badge" size="32px" />
            </div>
            <div class="banner-text">
              <div class="banner-title">Panel de Empleado</div>
              <div class="banner-description">
                Recuerda marcar asistencia y revisar tus solicitudes pendientes
              </div>
            </div>
          </div>
          <q-btn
            unelevated
            color="white"
            text-color="primary"
            label="Marcar Asistencia"
            to="/employee/attendance"
            no-caps
          />
        </div>
      </transition>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useKpiStore } from "@/stores/kpiStore";
import { useAuthStore } from "@/stores/authStore";
import KpiCard from "@/components/KpiCard.vue";

const $q = useQuasar();
const isDark = computed(() => $q.dark.isActive);

/* =================== Stores =================== */
const auth = useAuthStore();
const kpi = useKpiStore();

// Ids/rol desde authStore
const userId = computed(() => auth?.user?.id || auth?.user?._id || null);
const companyId = computed(
  () => auth?.user?.company?._id || auth?.user?.company || null
);
const roleRaw = computed(() => auth?.user?.role || "employee");

// Nombre real del usuario para el saludo (modelo 2026).
// Si hay firstName lo usamos; si no, caemos al email o al rol.
const welcomeName = computed(() => {
  const u = auth?.user
  if (!u) return ''
  const first = (u.firstName || u.first_name || '').trim()
  const last = (u.lastName || u.last_name || '').trim()
  if (first) return `${first}${last ? ' ' + last : ''}`
  if (u.name) return u.name
  if (u.email) return String(u.email).split('@')[0]
  return ''
})

const initials = computed(() => {
  const parts = String(welcomeName.value || '').split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
})

// Normaliza rol a etiqueta visible para la UI (modelo 2026).
//   superadmin   → Superadmin
//   admin_rrhh   → Admin RR.HH.
//   employee     → Empleado
//   dt_inspector → Fiscalizador DT
// Mantengo compat para 'admin'/'company' viejos por si aparecen en JWT cacheado.
const roleDisplay = computed(() => {
  const r = String(roleRaw.value).toLowerCase();
  if (r === "superadmin") return "Superadmin";
  if (r === "admin_rrhh") return "AdminRrhh";
  if (r === "dt_inspector") return "InspectorDT";
  if (r === "admin" || r === "administrador") return "Superadmin"; // compat
  if (r === "company" || r === "empresa") return "AdminRrhh"; // compat
  return "Empleado";
});

// Etiqueta amigable (chip arriba del saludo)
const roleLabel = computed(() => {
  const m = {
    Superadmin: 'Superadmin',
    AdminRrhh: 'Administrador RR.HH.',
    InspectorDT: 'Fiscalizador DT',
    Empleado: 'Empleado',
  }
  return m[roleDisplay.value] || ''
});

/* =================== Estado =================== */
const loading = ref(false);
const error = ref(null);
const lastUpdated = ref(null);

/* =================== Rango =================== */
const rangePreset = ref("7d");
const range = ref({ from: null, to: null });

const presetOptions = [
  { label: "7D", value: "7d", icon: "today" },
  { label: "30D", value: "30d", icon: "date_range" },
  { label: "YTD", value: "ytd", icon: "calendar_month" },
  { label: "TODO", value: "all", icon: "all_inclusive" },
  { label: "CUSTOM", value: "custom", icon: "tune" },
];

// Etiquetas visibles
const periodLabel = computed(() => {
  if (rangePreset.value === "7d") return "Últimos 7 días";
  if (rangePreset.value === "30d") return "Últimos 30 días";
  if (rangePreset.value === "ytd") return "Año en curso";
  if (rangePreset.value === "all") return "Histórico completo";
  if (rangePreset.value === "custom") {
    if (!range.value?.from && !range.value?.to) return "Personalizado";
    return toHumanRange(range.value.from, range.value.to);
  }
  return "—";
});

const dateRangeLabel = computed(() => {
  if (rangePreset.value !== "custom") return "Rango personalizado";
  if (!range.value?.from && !range.value?.to) return "Seleccionar rango";
  return toHumanRange(range.value.from, range.value.to);
});

function toHumanRange(from, to) {
  const fmt = (d) => {
    if (!d) return "—";
    const [y, m, dd] = d.split("-");
    return `${dd}/${m}/${y}`;
  };
  return `${fmt(from)} → ${fmt(to)}`;
}

function dateGuard() {
  return true;
}

// Set de fechas por preset
function setPresetDates(val) {
  const now = new Date();
  if (val === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    range.value = {
      from: start.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  } else if (val === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    range.value = {
      from: start.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  } else if (val === "ytd") {
    const start = new Date(now.getFullYear(), 0, 1);
    range.value = {
      from: start.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  } else if (val === "all") {
    range.value = { from: null, to: null };
  }
}

// Cambio de preset
function onPresetChange(val) {
  if (val !== "custom") {
    setPresetDates(val);
    reload();
  } else {
    rangePreset.value = val;
  }
}

// Aplicar custom
function applyCustomRange() {
  if (!range.value?.from && !range.value?.to) return;
  rangePreset.value = "custom";
  reload();
}

function clearCustom() {
  range.value = { from: null, to: null };
}

/* =================== Accesos rápidos (modelo 2026) =================== */
const quickLinks = computed(() => {
  if (roleDisplay.value === "Superadmin") {
    return [
      { icon: "apartment", label: "Empresas", to: "/superadmin/empresas" },
      { icon: "badge", label: "Admins RR.HH.", to: "/superadmin/admins-rrhh" },
      { icon: "download", label: "Reportes DT", to: "/superadmin/dt/reportes" },
      { icon: "history", label: "Auditoría", to: "/superadmin/dt/auditoria" },
    ];
  }
  if (roleDisplay.value === "AdminRrhh") {
    return [
      { icon: "people", label: "Empleados", to: "/rrhh/users" },
      { icon: "schedule", label: "Horarios", to: "/rrhh/horarios" },
      { icon: "assignment", label: "Solicitudes", to: "/rrhh/requests" },
      { icon: "download", label: "Reportes DT", to: "/rrhh/dt/reportes" },
    ];
  }
  if (roleDisplay.value === "Empleado") {
    return [
      { icon: "access_time", label: "Marcar asistencia", to: "/employee/attendance" },
      { icon: "history", label: "Mi historial", to: "/employee/history" },
      { icon: "receipt_long", label: "Mis comprobantes DT", to: "/employee/comprobantes" },
      { icon: "post_add", label: "Nueva solicitud", to: "/employee/create-request" },
    ];
  }
  return [];
});

/* =================== Analítica RR.HH. (admin_rrhh) =================== */
const REQ_TYPE = {
  VACATION: { label: "Vacaciones", icon: "beach_access" },
  ADMIN_DAY: { label: "Día administrativo", icon: "event" },
  PERMISSION: { label: "Permiso", icon: "badge" },
  COMP_DAY: { label: "Día compensatorio", icon: "schedule" },
  OTHER: { label: "Otra solicitud", icon: "description" },
};
const chartReady = ref(false);

// Todo el panel viene agregado del backend en una sola llamada.
const rrhh = computed(() => kpi.rrhh);
const rrhhLoading = computed(() => kpi.rrhhLoading);
const rrhhError = computed(() => kpi.rrhhError);
const isRrhh = computed(() => roleDisplay.value === "AdminRrhh");

function reqDateRange(r) {
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) : "—";
  if (!r.startDate) return "—";
  if (!r.endDate || r.startDate === r.endDate) return fmt(r.startDate);
  return `${fmt(r.startDate)} → ${fmt(r.endDate)}`;
}
/* ---- Derivados del panel ---- */
const CONTRACT_LABEL = {
  indefinido: "Indefinido",
  plazo_fijo: "Plazo fijo",
  part_time: "Part time",
  honorarios: "Honorarios",
  obra_faena: "Obra o faena",
  sin_definir: "Sin definir",
  "": "Sin definir",
};

// Rango REAL que devolvió el backend (con "TODO" lo acota a 12 meses),
// para no rotular el gráfico con un período que no es el que se dibujó.
const rrhhRangeLabel = computed(() => {
  const r = rrhh.value?.range;
  if (!r) return periodLabel.value.toLowerCase();
  return `${shortDay(r.from)} → ${shortDay(r.to)}`;
});

const periodoNombre = computed(() => {
  const p = rrhh.value?.payroll?.period;
  if (!p) return "";
  const [y, m] = p.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
});

// Barra apilada de dotación. Sólo se dibujan los segmentos con gente.
const headcountSegments = computed(() => {
  const h = rrhh.value?.headcount;
  if (!h?.total) return [];
  const defs = [
    { key: "active", label: "Activos", value: h.active, color: "#16a34a" },
    { key: "pending", label: "Por activar", value: h.pending, color: "#7c3aed" },
    { key: "inactive", label: "Inactivos", value: h.inactive, color: "#d97706" },
    { key: "suspended", label: "Suspendidos", value: h.suspended, color: "#dc2626" },
  ];
  return defs
    .filter((s) => s.value > 0)
    .map((s) => ({ ...s, pct: Math.round((s.value / h.total) * 100) }));
});

const contractRows = computed(() => {
  const rows = rrhh.value?.contracts || [];
  const max = Math.max(1, ...rows.map((r) => r.total));
  return rows.map((r) => ({
    ...r,
    label: CONTRACT_LABEL[r.tipo] ?? r.tipo,
    pct: Math.round((r.total / max) * 100),
  }));
});

const topVacPct = (dias) => {
  const max = Math.max(1, ...(rrhh.value?.timeOff?.top || []).map((t) => t.dias));
  return Math.round((dias / max) * 100);
};

// Chips de alerta: cada uno lleva a la pantalla donde se resuelve.
const alertList = computed(() => {
  const a = rrhh.value?.alerts;
  if (!a) return [];
  return [
    { count: a.sinActivar, label: "sin activar su cuenta", icon: "mark_email_unread", tone: "info", to: "/rrhh/users" },
    { count: a.sinHorario, label: "sin horario asignado", icon: "event_busy", tone: "warn", to: "/rrhh/horarios" },
    { count: a.marcasEnRevision, label: "marcas por revisar", icon: "fact_check", tone: "warn", to: "/rrhh/attendance" },
    { count: a.marcasObjetadas, label: "marcas objetadas", icon: "gavel", tone: "err", to: "/rrhh/attendance" },
    { count: a.saldosObjetados, label: "saldos objetados", icon: "rule", tone: "err", to: "/rrhh/saldos-apertura" },
  ].filter((x) => x.count > 0);
});

/* Colores de ejes/grid según tema (para ApexCharts) */
const axisColor = computed(() => (isDark.value ? "#9aa3b8" : "#64748b"));
const gridColor = computed(() => (isDark.value ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)"));
const chartTheme = computed(() => (isDark.value ? "dark" : "light"));

const reqDonutSeries = computed(() => {
  const c = rrhh.value?.requests;
  if (!c) return [0, 0, 0, 0];
  return [c.pending, c.approved, c.rejected, c.cancelled];
});
const reqDonutTotal = computed(() => reqDonutSeries.value.reduce((a, b) => a + b, 0));
const reqDonutOptions = computed(() => ({
  chart: { fontFamily: "inherit", background: "transparent" },
  theme: { mode: chartTheme.value },
  labels: ["Pendientes", "Aprobadas", "Rechazadas", "Canceladas"],
  colors: ["#f59e0b", "#22c55e", "#ef4444", "#94a3b8"],
  stroke: { width: 0 },
  legend: { position: "bottom", labels: { colors: axisColor.value } },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: "70%",
        labels: {
          show: true,
          total: {
            show: true, label: "Solicitudes", color: axisColor.value,
            formatter: () => String(reqDonutTotal.value),
          },
        },
      },
    },
  },
  tooltip: { theme: chartTheme.value },
}));

/* Asistencia diaria: personas distintas que marcaron cada día del rango.
   El backend ya rellena los días sin marcas, así que la curva no miente
   saltándose fines de semana o feriados. */
const attendanceSeriesData = computed(() => rrhh.value?.attendance?.serie || []);
const attendanceAreaSeries = computed(() => [
  { name: "Personas presentes", data: attendanceSeriesData.value.map((d) => d.presentes) },
  { name: "Marcas registradas", data: attendanceSeriesData.value.map((d) => d.marcas) },
]);
const attendanceAreaOptions = computed(() => ({
  chart: {
    fontFamily: "inherit", background: "transparent",
    toolbar: { show: false }, zoom: { enabled: false },
  },
  theme: { mode: chartTheme.value },
  colors: ["#0CA9C4", "#94a3b8"],
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: [3, 2], dashArray: [0, 4] },
  fill: {
    type: ["gradient", "solid"],
    opacity: [1, 0],
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] },
  },
  grid: { borderColor: gridColor.value, strokeDashArray: 4, padding: { left: 4, right: 4 } },
  xaxis: {
    categories: attendanceSeriesData.value.map((d) => shortDay(d.day)),
    labels: { style: { colors: axisColor.value, fontSize: "11px" }, rotate: 0, hideOverlappingLabels: true },
    axisBorder: { show: false }, axisTicks: { show: false },
    tooltip: { enabled: false },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    labels: { style: { colors: axisColor.value, fontSize: "11px" }, formatter: (v) => Math.round(v) },
  },
  legend: { position: "top", horizontalAlign: "right", labels: { colors: axisColor.value } },
  tooltip: { theme: chartTheme.value, shared: true, intersect: false },
}));

function shortDay(dayKey) {
  const [y, m, d] = String(dayKey || "").split("-");
  if (!y) return dayKey;
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
  });
}

/* =================== Carga KPIs =================== */
async function reload() {
  if (!userId.value && roleDisplay.value === "Empleado") {
    error.value = "No se encontró el usuario autenticado.";
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    // RR.HH. no usa /kpi/summary: su panel viene completo del endpoint propio.
    if (!isRrhh.value) {
      await kpi.fetchKpis({
        role: roleDisplay.value,
        companyId: companyId.value || undefined,
        userId: userId.value || undefined,
        from: range.value?.from || undefined,
        to: range.value?.to || undefined,
      });
    }
    if (isRrhh.value) {
      await kpi.fetchRrhhDashboard({
        from: range.value?.from || undefined,
        to: range.value?.to || undefined,
      });
    }
    lastUpdated.value = new Date();
  } catch (e) {
    error.value = e?.message || "No se pudieron cargar los KPIs.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // Monta los gráficos un tick después de que el DOM exista para evitar
  // la carrera de render de ApexCharts ("Element not found").
  chartReady.value = true;
  setPresetDates("7d");
  reload();
  const t = setInterval(() => reload(), 60000);
  if (import.meta?.hot) {
    import.meta.hot.on("vite:beforeFullReload", () => clearInterval(t));
  }
});

/* =================== KPIs para template =================== */
const vacaciones = computed(() => kpi.vacaciones ?? "—");
const asistencias = computed(() => kpi.asistencias ?? "—");
const solicitudes = computed(() => kpi.solicitudes ?? "—");
const usuariosActivos = computed(() => kpi.usuariosActivos ?? "—");
const empresas = computed(() => kpi.empresas ?? "—");
const diasAdmin = computed(() => kpi.diasAdmin ?? "—");
const ultimoCheck = computed(() => kpi.ultimoCheck ?? "—");

const lastUpdatedText = computed(() =>
  lastUpdated.value
    ? lastUpdated.value.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—"
);
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: 100vh;
  background: transparent;
}

/* =================== HEADER (compacto: ~64px) =================== */
.dashboard-header {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-soft);
  border-radius: 14px;
  padding: 0.6rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.header-avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.header-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
}

.role-chip {
  padding: 1px 8px;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: 8px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.meta-item { display: flex; align-items: center; gap: 0.25rem; }
.meta-divider { opacity: 0.3; }

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Preset Pills */
.preset-pills {
  display: flex;
  gap: 2px;
  background: var(--surface-soft);
  padding: 3px;
  border-radius: 10px;
}

.preset-pill {
  padding: 0.3rem 0.7rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.18s ease;
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.02em;

  &:hover {
    background: var(--color-primary-soft);
    color: var(--text-primary);
  }

  &.active {
    background: var(--color-primary);
    color: #fff;
  }
}

.date-picker-btn {
  background: var(--surface-soft);
  padding: 0.25rem 0.7rem;
  border-radius: 9px;
  font-size: 0.78rem;
  color: var(--text-secondary);

  &:hover { background: var(--color-primary-soft); }
}

.refresh-btn {
  background: var(--surface-soft);

  &:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
}

/* =================== CONTAINER =================== */
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
}

/* =================== QUICK ACTIONS =================== */
.quick-actions-section {
  animation: fadeIn 0.4s ease;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.8rem;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-soft);
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: var(--color-primary);
    box-shadow: var(--app-shadow-lg);

    .action-arrow {
      transform: translateX(4px);
    }
  }
}

.action-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: 10px;
  color: white;

  :deep(.q-icon) { font-size: 18px; }
}

.action-label {
  flex: 1;
  font-weight: 600;
  font-size: 0.85rem;
}

.action-arrow {
  transition: transform 0.3s ease;
  opacity: 0.5;
}

/* =================== KPIs =================== */
.kpis-section {
  animation: fadeIn 0.5s ease 0.1s both;
}

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.kpi-skeleton {
  height: 160px;
  border-radius: 16px;
}

.error-card {
  animation: shake 0.5s ease;
}

/* =================== INFO BANNERS =================== */
.info-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.6s ease 0.2s both;
  gap: 1.5rem;
  flex-wrap: wrap;

  &.admin {
    background: linear-gradient(135deg, #0CA9C4 0%, #067C90 100%);
    color: white;
  }

  &.company {
    background: linear-gradient(135deg, #0893AA 0%, #33BECB 100%);
    color: white;
  }

  &.employee {
    background: linear-gradient(135deg, #33BECB 0%, #0CA9C4 100%);
    color: white;
  }
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.banner-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.banner-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.banner-title {
  font-size: 1.125rem;
  font-weight: 700;
}

.banner-description {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* =================== ANIMATIONS =================== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.slide-up-enter-active {
  animation: slideUp 0.4s ease;
}

.slide-up-leave-active {
  animation: slideUp 0.4s ease reverse;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =================== PANEL RR.HH. =================== */
.rrhh-section {
  animation: fadeIn 0.5s ease 0.15s both;
  display: flex;
  flex-direction: column;
}

/* ---- Tiles densos ---- */
.rk-tiles {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem;
}
@media (max-width: 1280px) { .rk-tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 720px)  { .rk-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.rk-tile {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.8rem 0.85rem 0.9rem;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
}
.rk-tile--link { transition: transform .18s ease, border-color .18s ease; }
.rk-tile--link:hover { transform: translateY(-2px); border-color: var(--color-primary); }

.rk-tile__ico {
  width: 34px; height: 34px; flex: 0 0 34px;
  border-radius: 10px; display: grid; place-items: center;
}
.rk-tile__ico--brand  { background: var(--color-primary-soft); color: var(--color-primary); }
.rk-tile__ico--ok     { background: var(--color-success-soft); color: var(--color-success); }
.rk-tile__ico--warn   { background: var(--color-warning-soft); color: var(--color-warning); }
.rk-tile__ico--info   { background: var(--color-info-soft);    color: var(--color-info); }
.rk-tile__ico--purple { background: rgba(124,58,237,.14);      color: #7c3aed; }
.rk-tile__ico--money  { background: var(--color-accent-soft);  color: var(--color-accent); }

.rk-tile__body { min-width: 0; }
.rk-tile__value {
  font-family: var(--app-font-display, inherit);
  font-size: 1.6rem; font-weight: 800; line-height: 1;
  letter-spacing: -0.02em; color: var(--text-primary);
}
.rk-tile__of { font-size: .9rem; font-weight: 600; color: var(--text-muted); }
.rk-tile__label {
  margin-top: 5px; font-size: .74rem; font-weight: 600;
  color: var(--text-secondary); line-height: 1.25;
}
.rk-tile__sub { margin-top: 2px; font-size: .7rem; color: var(--text-muted); }
.rk-tile__meter {
  position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
  background: var(--surface-soft);
}
.rk-tile__meter span {
  display: block; height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width .6s cubic-bezier(.34,1.56,.64,1);
}

/* ---- Alertas accionables ---- */
.rk-alerts { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
.rk-alert {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 999px;
  font-size: .78rem; text-decoration: none;
  border: 1px solid transparent; transition: filter .15s ease;
}
.rk-alert:hover { filter: brightness(1.06); }
.rk-alert b { font-weight: 800; }
.rk-alert--info { background: var(--color-info-soft);    color: var(--color-info); }
.rk-alert--warn { background: var(--color-warning-soft); color: var(--color-warning); }
.rk-alert--err  { background: var(--color-danger-soft);  color: var(--color-danger); }

/* ---- Grid de análisis ---- */
.rrhh-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}
.span-3 { grid-column: span 3; }
.span-4 { grid-column: span 4; }
.span-5 { grid-column: span 5; }
.span-8 { grid-column: span 8; }
.span-12 { grid-column: span 12; }

.rk-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  padding: 1rem 1.1rem 1.1rem;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.rk-card--error {
  flex-direction: row; align-items: center; gap: 10px;
  color: var(--color-danger); border-color: var(--color-danger);
}
.rk-card__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  width: 100%; gap: .5rem; margin-bottom: .4rem;
}
.rk-card__title { font-weight: 700; font-size: 1.02rem; color: var(--text-primary); }
.rk-card__sub { font-size: .78rem; color: var(--text-secondary); margin-top: 2px; }
.rk-card__ico { font-size: 22px; color: var(--text-secondary); opacity: .55; }
.rk-card__stat { font-size: .78rem; color: var(--text-secondary); white-space: nowrap; }
.rk-card__stat b { color: var(--text-primary); font-size: .95rem; }

.rk-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 34px 12px; color: var(--text-secondary); opacity: .7; font-size: .85rem;
  flex: 1;
}

/* ---- Dotación ---- */
.rk-headcount { margin: .4rem 0 .5rem; }
.rk-hc__big { font-size: 2.2rem; font-weight: 800; line-height: 1; color: var(--text-primary); }
.rk-hc__lbl { font-size: .78rem; color: var(--text-secondary); margin-top: 2px; }
.rk-hc-bar {
  display: flex; height: 10px; border-radius: 99px; overflow: hidden;
  background: var(--surface-soft); margin: .4rem 0 .6rem; gap: 2px;
}
.rk-hc-bar__seg { display: block; height: 100%; transition: width .5s ease; }
.rk-hc-legend {
  display: flex; gap: .5rem 1rem; font-size: .78rem;
  color: var(--text-secondary); flex-wrap: wrap;
}
.rk-hc-legend b { color: var(--text-primary); }
.rk-hc-legend .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; }

.rk-hc-contracts { margin-top: .9rem; }
.rk-hc-contracts__t, .rk-top__t {
  font-size: .68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; color: var(--text-muted); margin-bottom: .4rem;
}
.rk-hc-row {
  display: grid; grid-template-columns: minmax(0, 1fr) 60px 26px;
  align-items: center; gap: 8px; font-size: .78rem;
  color: var(--text-secondary); padding: 2px 0;
}
.rk-hc-row__l { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rk-hc-row__bar { height: 6px; border-radius: 99px; background: var(--surface-soft); overflow: hidden; }
.rk-hc-row__bar i {
  display: block; height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
}
.rk-hc-row b { color: var(--text-primary); text-align: right; }
.rk-hc-btn { margin-top: auto; align-self: flex-start; padding-top: .6rem; }

/* ---- Cumpleaños ---- */
.rk-bdays { margin-top: .9rem; display: flex; flex-wrap: wrap; gap: 6px; }
.rk-bdays .rk-top__t { width: 100%; margin-bottom: 0; }
.rk-bday {
  font-size: .74rem; padding: 3px 9px; border-radius: 999px;
  background: var(--surface-soft); color: var(--text-secondary);
}
.rk-bday.is-today {
  background: var(--color-primary-soft); color: var(--color-primary); font-weight: 700;
}

/* ---- Listas de solicitudes ---- */
.rk-reqs { padding: 2px 0; }
.rk-req { border-radius: 12px; padding-left: 4px; padding-right: 4px; }
.rk-req:hover { background: var(--surface-soft); }
.rk-req__ico {
  width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center;
  background: var(--color-primary-soft); color: var(--color-primary);
}
.rk-req__ico--soft { background: var(--surface-soft); color: var(--text-secondary); }
.rk-req__title { font-weight: 600; font-size: .88rem; color: var(--text-primary); }
.rk-req__meta { font-size: .74rem; color: var(--text-secondary); }

@media (max-width: 1024px) {
  .span-3, .span-4, .span-5, .span-8 { grid-column: span 6; }
}
@media (max-width: 680px) {
  .span-3, .span-4, .span-5, .span-8, .span-12 { grid-column: span 12; }
}

/* =================== RESPONSIVE =================== */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-controls {
    justify-content: space-between;
  }

  .kpis-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1rem;
  }

  .dashboard-container {
    padding: 1rem;
  }

  .preset-pills {
    flex-wrap: wrap;
  }

  .kpis-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .info-banner {
    flex-direction: column;
    text-align: center;
  }

  .banner-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>