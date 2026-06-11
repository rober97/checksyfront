<template>
  <q-page class="dashboard-page">
    <!-- Header Superior con gradiente -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <q-icon name="dashboard" size="32px" class="header-icon" />
          <div class="header-text">
            <h1 class="header-title">Bienvenido, {{ welcomeName }}</h1>
            <div class="role-chip" v-if="roleLabel">{{ roleLabel }}</div>
            <div class="header-meta">
              <span class="meta-item">
                <q-icon name="schedule" size="14px" />
                {{ lastUpdatedText }}
              </span>
              <span class="meta-divider">•</span>
              <span class="meta-item period-badge">
                {{ periodLabel }}
              </span>
            </div>
          </div>
        </div>

        <!-- Controles mejorados -->
        <div class="header-controls">
          <div class="preset-pills">
            <button
              v-for="preset in presetOptions"
              :key="preset.value"
              @click="onPresetChange(preset.value)"
              :class="['preset-pill', { active: rangePreset === preset.value }]"
            >
              <q-icon :name="preset.icon" size="16px" />
              <span>{{ preset.label }}</span>
            </button>
          </div>

          <!-- Custom Date Picker -->
          <q-btn
            :class="['date-picker-btn', { active: rangePreset === 'custom' }]"
            :disable="rangePreset !== 'custom'"
            flat
            no-caps
          >
            <q-icon name="event" class="q-mr-xs" />
            <span>{{ dateRangeLabel }}</span>
            
            <q-popup-proxy
              v-if="rangePreset === 'custom'"
              ref="popup"
              transition-show="scale"
              transition-hide="scale"
            >
              <q-date
                v-model="range"
                mask="YYYY-MM-DD"
                range
                minimal
                :options="dateGuard"
              >
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

          <q-btn
            round
            flat
            icon="refresh"
            :loading="loading"
            @click="reload"
            class="refresh-btn"
          >
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

      <!-- KPIs Grid Mejorado -->
      <div class="kpis-section">
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
            icon-gradient="linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)"
            format-type="auto"
            trend="positive"
          />

          <!-- Días Vacaciones (Solo Empleado) -->
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Días Vacaciones"
            :value="vacaciones"
            icon="beach_access"
            icon-gradient="linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)"
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
            v-if="roleDisplay === 'Superadmin' || roleDisplay === 'AdminRrhh'"
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
            icon-gradient="linear-gradient(135deg, #0891b2 0%, #0d9488 100%)"
            format-type="auto"
            trend="positive"
          />

          <!-- Días Administrativos (Solo Empleado) -->
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Días Administrativos"
            :value="diasAdmin"
            icon="calendar_today"
            icon-gradient="linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)"
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
            icon-gradient="linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)"
            format-type="time"
            variant="highlight"
            subtitle="Hora de entrada"
          />
        </div>
      </div>

      <!-- =============== Analítica RR.HH. (solo admin_rrhh) =============== -->
      <section v-if="roleDisplay === 'AdminRrhh' && !error" class="rrhh-section">
        <div class="section-label">Panel de tu empresa</div>
        <div class="rrhh-grid">
          <!-- Solicitudes por estado -->
          <div class="rk-card span-5">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">Solicitudes por estado</div>
                <div class="rk-card__sub">Distribución histórica de tu empresa</div>
              </div>
              <q-icon name="donut_large" class="rk-card__ico" />
            </div>
            <apexchart
              v-if="chartReady && reqDonutTotal > 0"
              type="donut" height="260"
              :options="reqDonutOptions" :series="reqDonutSeries"
            />
            <div v-else class="rk-empty"><q-icon name="inbox" size="32px" /><span>Sin solicitudes registradas</span></div>
          </div>

          <!-- Asistencia de hoy (gauge) -->
          <div class="rk-card span-3 rk-card--center">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">Asistencia de hoy</div>
                <div class="rk-card__sub">Presentes vs. plantilla activa</div>
              </div>
            </div>
            <apexchart
              v-if="chartReady"
              type="radialBar" height="240"
              :options="attendanceGaugeOptions" :series="attendanceGaugeSeries"
            />
            <div class="rk-gauge-foot">
              <b>{{ rrhhTodayAttendance }}</b> marcas hoy ·
              <b>{{ rrhhActiveEmployees || usuariosActivos }}</b> activos
            </div>
          </div>

          <!-- Plantilla -->
          <div class="rk-card span-4">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">Plantilla</div>
                <div class="rk-card__sub">Estado de tus empleados</div>
              </div>
              <q-icon name="groups" class="rk-card__ico" />
            </div>
            <div class="rk-headcount">
              <div class="rk-hc__big">{{ headcountTotal || usuariosActivos }}</div>
              <div class="rk-hc__lbl">empleados en total</div>
            </div>
            <div class="rk-hc-bar" v-if="headcountTotal">
              <div class="rk-hc-bar__fill" :style="{ width: (rrhhActiveEmployees / headcountTotal * 100) + '%' }"></div>
            </div>
            <div class="rk-hc-legend">
              <span><i class="dot dot--active"></i> Activos <b>{{ rrhhActiveEmployees }}</b></span>
              <span><i class="dot dot--inactive"></i> Inactivos <b>{{ rrhhInactiveEmployees }}</b></span>
            </div>
            <q-btn flat dense no-caps color="primary" icon="people" label="Gestionar empleados" to="/rrhh/users" class="rk-hc-btn" />
          </div>

          <!-- Solicitudes pendientes -->
          <div class="rk-card span-12">
            <div class="rk-card__head">
              <div>
                <div class="rk-card__title">
                  Solicitudes pendientes
                  <q-badge v-if="rrhhCounts.pending" color="orange" class="q-ml-sm">{{ rrhhCounts.pending }}</q-badge>
                </div>
                <div class="rk-card__sub">Últimas solicitudes de tu equipo</div>
              </div>
              <q-btn flat dense no-caps color="primary" icon="assignment" label="Ver todas" to="/rrhh/requests" />
            </div>

            <q-list v-if="rrhhRecent.length" class="rk-reqs">
              <q-item v-for="r in rrhhRecent" :key="r.id" class="rk-req">
                <q-item-section avatar>
                  <div class="rk-req__ico"><q-icon :name="(REQ_TYPE[r.type] || {}).icon || 'description'" size="18px" /></div>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="rk-req__title">
                    {{ reqUserName(r) }} · {{ (REQ_TYPE[r.type] || {}).label || r.type }}
                  </q-item-label>
                  <q-item-label caption class="rk-req__meta">
                    {{ reqDateRange(r) }} · {{ timeAgo(r.createdAt) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :style="{ backgroundColor: (REQ_STATUS[r.status] || {}).color || '#94a3b8' }"
                    text-color="white"
                  >
                    {{ (REQ_STATUS[r.status] || {}).label || r.status }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="rk-empty"><q-icon name="inbox" size="32px" /><span>No hay solicitudes recientes</span></div>
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

      <transition name="slide-up">
        <div v-if="roleDisplay === 'AdminRrhh'" class="info-banner company">
          <div class="banner-content">
            <div class="banner-icon">
              <q-icon name="admin_panel_settings" size="32px" />
            </div>
            <div class="banner-text">
              <div class="banner-title">Panel RR.HH. — Tu empresa</div>
              <div class="banner-description">
                Administra los empleados de tu empresa, sus horarios, solicitudes
                y descarga los reportes exigidos por la Dirección del Trabajo.
              </div>
            </div>
          </div>
          <q-btn
            unelevated
            color="white"
            text-color="primary"
            label="Gestionar empleados"
            to="/rrhh/users"
            no-caps
          />
        </div>
      </transition>

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
import secureAxios from "@/utils/secureRequest";
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
const REQ_STATUS = {
  PENDING: { label: "Pendiente", color: "#f59e0b" },
  APPROVED: { label: "Aprobada", color: "#22c55e" },
  REJECTED: { label: "Rechazada", color: "#ef4444" },
  CANCELLED: { label: "Cancelada", color: "#94a3b8" },
};

const chartReady = ref(false);
const rrhhCounts = ref({ pending: 0, approved: 0, rejected: 0, cancelled: 0 });
const rrhhTodayAttendance = ref(0);
const rrhhActiveEmployees = ref(0);
const rrhhInactiveEmployees = ref(0);
const rrhhRecent = ref([]);

function reqDateRange(r) {
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) : "—";
  if (!r.startDate) return "—";
  if (!r.endDate || r.startDate === r.endDate) return fmt(r.startDate);
  return `${fmt(r.startDate)} → ${fmt(r.endDate)}`;
}
function reqUserName(r) {
  const u = r.userId;
  if (u && typeof u === "object") {
    const n = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return n || u.email || "Empleado";
  }
  return "Empleado";
}
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (isNaN(diff)) return "";
  if (diff < 60) return "recién";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return new Date(dateStr).toLocaleDateString("es-CL");
}

function pickArray(data, ...keys) {
  if (Array.isArray(data)) return data;
  for (const k of keys) if (Array.isArray(data?.[k])) return data[k];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

async function loadRrhhExtras() {
  const cid = companyId.value || undefined;
  try {
    const [summaryRes, listRes, usersRes] = await Promise.all([
      secureAxios.get("/requests/requests/summary", { params: { companyId: cid } }).catch(() => null),
      secureAxios.get("/requests", { params: { companyId: cid, limit: 8 } }).catch(() => null),
      secureAxios.get("/users", { params: { companyId: cid } }).catch(() => null),
    ]);

    const sum = summaryRes?.data?.data;
    if (sum?.requests) {
      rrhhCounts.value = {
        pending: sum.requests.pending || 0,
        approved: sum.requests.approved || 0,
        rejected: sum.requests.rejected || 0,
        cancelled: sum.requests.cancelled || 0,
      };
    }
    rrhhTodayAttendance.value = sum?.todayAttendanceCount || 0;

    rrhhRecent.value = pickArray(listRes?.data, "data").slice(0, 8);

    const us = pickArray(usersRes?.data, "users");
    const emps = us.filter((u) => u.role === "employee");
    rrhhActiveEmployees.value = emps.filter((u) => u.active !== false && u.status !== "inactive").length;
    rrhhInactiveEmployees.value = emps.length - rrhhActiveEmployees.value;
  } catch (e) {
    console.warn("[Dashboard] loadRrhhExtras error:", e?.message);
  }
}

/* Colores de ejes/grid según tema (para ApexCharts) */
const axisColor = computed(() => (isDark.value ? "#9aa3b8" : "#64748b"));
const gridColor = computed(() => (isDark.value ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)"));
const chartTheme = computed(() => (isDark.value ? "dark" : "light"));

const reqDonutSeries = computed(() => {
  const c = rrhhCounts.value;
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

const attendancePct = computed(() => {
  const active = rrhhActiveEmployees.value || usuariosActivos.value || 0;
  if (!active) return 0;
  return Math.min(100, Math.round((rrhhTodayAttendance.value / active) * 100));
});
const attendanceGaugeSeries = computed(() => [attendancePct.value]);
const attendanceGaugeOptions = computed(() => ({
  chart: { fontFamily: "inherit", background: "transparent" },
  theme: { mode: chartTheme.value },
  colors: ["#06b6d4"],
  plotOptions: {
    radialBar: {
      hollow: { size: "62%" },
      track: { background: isDark.value ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.07)" },
      dataLabels: {
        name: { offsetY: 22, color: axisColor.value, fontSize: "0.8rem" },
        value: {
          offsetY: -12, fontSize: "1.7rem", fontWeight: 800,
          color: isDark.value ? "#e8eaf2" : "#0f172a",
          formatter: (v) => `${Math.round(v)}%`,
        },
      },
    },
  },
  fill: {
    type: "gradient",
    gradient: { shade: "dark", type: "horizontal", gradientToColors: ["#14b8a6"], stops: [0, 100] },
  },
  stroke: { lineCap: "round" },
  labels: ["Presentes hoy"],
}));

const headcountTotal = computed(() => rrhhActiveEmployees.value + rrhhInactiveEmployees.value);

/* =================== Carga KPIs =================== */
async function reload() {
  if (!userId.value && roleDisplay.value === "Empleado") {
    error.value = "No se encontró el usuario autenticado.";
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    await kpi.fetchKpis({
      role: roleDisplay.value,
      companyId: companyId.value || undefined,
      userId: userId.value || undefined,
      from: range.value?.from || undefined,
      to: range.value?.to || undefined,
    });
    if (roleDisplay.value === "AdminRrhh") await loadRrhhExtras();
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

/* =================== HEADER =================== */
.dashboard-header {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-soft);
  border-radius: 16px;
  padding: 1.5rem 2rem;
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
  gap: 2rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  color: var(--color-primary);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.role-chip {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 10px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: 10px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-divider {
  opacity: 0.3;
}

.period-badge {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Preset Pills */
.preset-pills {
  display: flex;
  gap: 0.5rem;
  background: var(--surface-soft);
  padding: 0.25rem;
  border-radius: 12px;
}

.preset-pill {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.875rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.875rem;

  &:hover {
    background: var(--color-primary-soft);
    color: var(--text-primary);
  }

  &.active {
    background: var(--color-primary);
    color: #fff;
    box-shadow: 0 2px 8px var(--color-primary-soft);
  }
}

.date-picker-btn {
  background: var(--surface-soft);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  color: var(--text-secondary);
  transition: all 0.2s ease;

  &.active {
    background: var(--color-primary);
    color: #fff;
  }

  &:not(.active):hover {
    background: var(--color-primary-soft);
  }
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
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section-label {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

/* =================== QUICK ACTIONS =================== */
.quick-actions-section {
  animation: fadeIn 0.4s ease;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
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
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: 12px;
  color: white;
}

.action-label {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
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
    background: linear-gradient(135deg, #06b6d4 0%, #0d9488 100%);
    color: white;
  }

  &.company {
    background: linear-gradient(135deg, #0891b2 0%, #22d3ee 100%);
    color: white;
  }

  &.employee {
    background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
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

/* =================== ANALÍTICA RR.HH. =================== */
.rrhh-section { animation: fadeIn 0.5s ease 0.15s both; }
.rrhh-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.25rem;
}
.span-3 { grid-column: span 3; }
.span-4 { grid-column: span 4; }
.span-5 { grid-column: span 5; }
.span-12 { grid-column: span 12; }

.rk-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  padding: 1rem 1.1rem 1.1rem;
  display: flex;
  flex-direction: column;
}
.rk-card--center { align-items: center; }
.rk-card__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  width: 100%; gap: .5rem; margin-bottom: .4rem;
}
.rk-card__title { font-weight: 700; font-size: 1.02rem; color: var(--text-primary); }
.rk-card__sub { font-size: .78rem; color: var(--text-secondary); margin-top: 2px; }
.rk-card__ico { font-size: 22px; color: var(--text-secondary); opacity: .55; }

.rk-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 40px 12px; color: var(--text-secondary); opacity: .7; font-size: .85rem;
}

.rk-gauge-foot { font-size: .8rem; color: var(--text-secondary); margin-top: -8px; text-align: center; }
.rk-gauge-foot b { color: var(--text-primary); }

/* Plantilla */
.rk-headcount { margin: .4rem 0 .6rem; }
.rk-hc__big { font-size: 2.4rem; font-weight: 800; line-height: 1; color: var(--text-primary); }
.rk-hc__lbl { font-size: .8rem; color: var(--text-secondary); margin-top: 2px; }
.rk-hc-bar {
  height: 10px; border-radius: 99px; overflow: hidden;
  background: rgba(148,163,184,.22); margin: .4rem 0 .7rem;
}
.rk-hc-bar__fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, #06b6d4, #14b8a6); transition: width .5s ease;
}
.rk-hc-legend {
  display: flex; gap: 1.2rem; font-size: .82rem; color: var(--text-secondary); flex-wrap: wrap;
}
.rk-hc-legend b { color: var(--text-primary); }
.rk-hc-legend .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; }
.dot--active { background: #14b8a6; }
.dot--inactive { background: #94a3b8; }
.rk-hc-btn { margin-top: auto; align-self: flex-start; }

/* Solicitudes pendientes */
.rk-reqs { padding: 2px 0; }
.rk-req { border-radius: 12px; }
.rk-req:hover { background: var(--surface-soft); }
.rk-req__ico {
  width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;
  background: var(--color-primary-soft); color: var(--color-primary);
}
.rk-req__title { font-weight: 600; font-size: .9rem; color: var(--text-primary); }
.rk-req__meta { font-size: .76rem; color: var(--text-secondary); }

@media (max-width: 1024px) {
  .span-5, .span-3, .span-4 { grid-column: span 6; }
}
@media (max-width: 680px) {
  .span-5, .span-3, .span-4, .span-12 { grid-column: span 12; }
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