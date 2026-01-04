<template>
  <q-page class="dashboard-page">
    <!-- Header Superior con gradiente -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <q-icon name="dashboard" size="32px" class="header-icon" />
          <div class="header-text">
            <h1 class="header-title">Bienvenido {{ nombreRol }}</h1>
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
            icon-gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            format-type="auto"
            trend="positive"
          />

          <!-- Días Vacaciones (Solo Empleado) -->
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Días Vacaciones"
            :value="vacaciones"
            icon="beach_access"
            icon-gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            format-type="decimal"
            :decimals="0"
            subtitle="Disponibles este año"
          />

          <!-- Solicitudes Pendientes -->
          <KpiCard
            title="Solicitudes Pendientes"
            :value="solicitudes"
            icon="hourglass_empty"
            icon-gradient="linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)"
            format-type="auto"
            :badge="solicitudes > 0 ? solicitudes : null"
          />

          <!-- Usuarios Activos (Solo Admin) -->
          <KpiCard
            v-if="roleDisplay === 'Administrador'"
            title="Usuarios Activos"
            :value="usuariosActivos"
            icon="people"
            icon-gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
            format-type="compact"
            subtitle="En el sistema"
          />

          <!-- Empresas Registradas (Solo Admin) -->
          <KpiCard
            v-if="roleDisplay === 'Administrador'"
            title="Empresas Registradas"
            :value="empresas"
            icon="apartment"
            icon-gradient="linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
            format-type="auto"
            trend="positive"
            :trend-value="12"
          />

          <!-- Días Administrativos (Solo Empleado) -->
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Días Administrativos"
            :value="diasAdmin"
            icon="calendar_today"
            icon-gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
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
            icon-gradient="linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
            format-type="time"
            variant="highlight"
            subtitle="Hora de entrada"
          />
        </div>
      </div>

      <!-- Role-specific Banners -->
      <transition name="slide-up">
        <div v-if="roleDisplay === 'Administrador'" class="info-banner admin">
          <div class="banner-content">
            <div class="banner-icon">
              <q-icon name="admin_panel_settings" size="32px" />
            </div>
            <div class="banner-text">
              <div class="banner-title">Panel de Administración</div>
              <div class="banner-description">
                Gestiona usuarios, permisos y empresas desde el menú lateral
              </div>
            </div>
          </div>
          <q-btn
            unelevated
            color="white"
            text-color="primary"
            label="Ir a Gestión"
            to="/admin/users"
            no-caps
          />
        </div>
      </transition>

      <transition name="slide-up">
        <div v-if="roleDisplay === 'Empresa'" class="info-banner company">
          <div class="banner-content">
            <div class="banner-icon">
              <q-icon name="business" size="32px" />
            </div>
            <div class="banner-text">
              <div class="banner-title">Panel de Empresa</div>
              <div class="banner-description">
                Revisa reportes y administra a tus empleados
              </div>
            </div>
          </div>
          <q-btn
            unelevated
            color="white"
            text-color="green"
            label="Ver Empleados"
            to="/company/employees"
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
            text-color="orange"
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

// Normaliza rol para la UI
const roleDisplay = computed(() => {
  const r = String(roleRaw.value).toLowerCase();
  if (r === "admin" || r === "administrador") return "Administrador";
  if (r === "company" || r === "empresa") return "Empresa";
  return "Empleado";
});

const nombreRol = computed(() => roleDisplay.value);

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

/* =================== Accesos rápidos =================== */
const quickLinks = computed(() => {
  if (roleDisplay.value === "Administrador") {
    return [
      { icon: "manage_accounts", label: "Usuarios", to: "/admin/users" },
      { icon: "apartment", label: "Empresas", to: "/admin/companies" },
      { icon: "assessment", label: "KPIs", to: "/admin/kpi" },
    ];
  }
  if (roleDisplay.value === "Empresa") {
    return [
      { icon: "group", label: "Empleados", to: "/company/employees" },
      { icon: "summarize", label: "Reportes", to: "/company/reports" },
      { icon: "pending_actions", label: "Solicitudes", to: "/company/requests" },
    ];
  }
  return [];
});

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
    lastUpdated.value = new Date();
  } catch (e) {
    error.value = e?.message || "No se pudieron cargar los KPIs.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  
  .body--dark & {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
}

/* =================== HEADER =================== */
.dashboard-header {
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .body--dark & {
    background: #1e1e2e;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }
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
  color: var(--q-primary);
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
  color: #2c3e50;
  
  .body--dark & {
    color: #ecf0f1;
  }
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #7f8c8d;
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
  background: rgba(var(--q-primary-rgb), 0.1);
  color: var(--q-primary);
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
  background: #f8f9fa;
  padding: 0.25rem;
  border-radius: 12px;
  
  .body--dark & {
    background: rgba(255, 255, 255, 0.05);
  }
}

.preset-pill {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.875rem;
  border: none;
  background: transparent;
  color: #7f8c8d;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.875rem;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #2c3e50;
    
    .body--dark & {
      background: rgba(255, 255, 255, 0.1);
      color: #ecf0f1;
    }
  }

  &.active {
    background: var(--q-primary);
    color: white;
    box-shadow: 0 2px 8px rgba(var(--q-primary-rgb), 0.3);
  }
}

.date-picker-btn {
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  color: #7f8c8d;
  transition: all 0.2s ease;
  
  .body--dark & {
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    background: var(--q-primary);
    color: white;
  }

  &:not(.active):hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.refresh-btn {
  background: #f8f9fa;
  
  .body--dark & {
    background: rgba(255, 255, 255, 0.05);
  }

  &:hover {
    background: rgba(var(--q-primary-rgb), 0.1);
    color: var(--q-primary);
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
  color: #7f8c8d;
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: #2c3e50;
  transition: all 0.3s ease;
  
  .body--dark & {
    background: #2a2a3e;
    color: #ecf0f1;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

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
  background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  &.company {
    background: linear-gradient(135deg, #2ed573 0%, #17c0eb 100%);
    color: white;
  }

  &.employee {
    background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);
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