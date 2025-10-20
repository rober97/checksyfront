<template>
  <q-page class="q-pa-md" :class="pageContainerClass">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="row items-center">
        <q-icon name="dashboard" class="q-mr-sm" size="28px" color="primary" />
        <div class="column">
          <div class="text-h5" :class="isDark ? 'text-white' : 'text-primary'">
            Bienvenido {{ nombreRol }}
          </div>
          <div class="text-caption text-grey-6">
            Última actualización: {{ lastUpdatedText }}
          </div>
          <div class="text-caption text-primary q-mt-xs">
            Periodo: <span class="text-weight-medium">{{ periodLabel }}</span>
          </div>
        </div>
      </div>

      <div class="row items-center header-actions">
        <!-- Presets bonitos y funcionales -->
        <SegmentControl
          v-model="rangePreset"
          :options="presetOptions"
          @update:model-value="onPresetChange"
        />

        <!-- Custom range (solo activo en 'custom') -->
        <q-input
          dense
          standout="bg"
          v-model="dateRangeLabel"
          :disable="rangePreset !== 'custom'"
          placeholder="Rango personalizado"
          readonly
          class="rk-date q-ml-sm"
        >
          <template #prepend>
            <q-icon name="event" />
          </template>

          <q-popup-proxy
            ref="popup"
            transition-show="scale"
            transition-hide="scale"
            :breakpoint="520"
          >
            <q-date
              v-model="range"
              mask="YYYY-MM-DD"
              range
              minimal
              :options="dateGuard"
            >
              <div class="row items-center justify-end q-pa-sm q-gutter-sm">
                <q-btn flat label="Limpiar" @click="clearCustom" />
                <q-btn flat label="Cancelar" v-close-popup />
                <q-btn
                  color="primary"
                  label="Aplicar"
                  @click="applyCustomRange"
                  v-close-popup
                />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-input>

        <q-btn
          dense
          round
          icon="refresh"
          :loading="loading"
          @click="reload"
          class="q-ml-sm"
        >
          <q-tooltip>Actualizar</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Accesos rápidos -->
    <div class="row q-gutter-sm q-mb-md">
      <q-btn
        v-for="quick in quickLinks"
        :key="quick.to"
        flat
        dense
        class="rk-ghost"
        :icon="quick.icon"
        :label="quick.label"
        :to="quick.to"
      />
    </div>

    <!-- KPIs -->
    <div class="kpi-grid-wrapper">
      <div class="kpi-grid">
        <!-- Loading -->
        <template v-if="loading">
          <q-skeleton
            v-for="i in 6"
            :key="'sk-' + i"
            height="120px"
            type="rect"
            class="rounded-borders"
          />
        </template>

        <!-- Error -->
        <q-banner
          v-else-if="error"
          class="q-pa-md"
          rounded
          :class="isDark ? 'bg-red-10 text-white' : 'bg-red-2'"
        >
          <q-icon name="error" color="negative" class="q-mr-sm" />
          {{ error }}
          <q-btn
            flat
            dense
            color="white"
            label="Reintentar"
            class="q-ml-sm"
            @click="reload"
          />
        </q-banner>

        <!-- KPI Cards -->
        <template v-else>
          <KpiCard
            title="Asistencias"
            :value="asistencias"
            icon="event_available"
          />
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Días Vacaciones"
            :value="vacaciones"
            icon="beach_access"
          />
          <KpiCard
            title="Solicitudes Pendientes"
            :value="solicitudes"
            icon="hourglass_empty"
          />
          <KpiCard
            v-if="roleDisplay === 'Administrador'"
            title="Usuarios Activos"
            :value="usuariosActivos"
            icon="people"
          />
          <KpiCard
            v-if="roleDisplay === 'Administrador'"
            title="Empresas Registradas"
            :value="empresas"
            icon="apartment"
          />
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Días Administrativos"
            :value="diasAdmin"
            icon="calendar_today"
          />
          <KpiCard
            v-if="roleDisplay === 'Empleado'"
            title="Último Check-in"
            :value="ultimoCheck || '—'"
            icon="access_time"
          />
        </template>
      </div>
    </div>

    <!-- Banners por rol -->
    <transition name="fade">
      <q-banner
        v-if="roleDisplay === 'Administrador'"
        class="q-pa-md q-mt-lg"
        :class="bannerAdminClass"
        rounded
      >
        <q-icon name="admin_panel_settings" color="blue" class="q-mr-sm" />
        Gestiona <strong>usuarios</strong>, <strong>permisos</strong> y
        <strong>empresas</strong> desde el menú.
        <q-btn
          flat
          color="white"
          label="Ir a Gestión"
          class="q-ml-sm"
          to="/admin/users"
        />
      </q-banner>
    </transition>

    <transition name="fade">
      <q-banner
        v-if="roleDisplay === 'Empresa'"
        class="q-pa-md q-mt-md"
        :class="bannerCompanyClass"
        rounded
      >
        <q-icon name="business" color="green" class="q-mr-sm" />
        Revisa <strong>reportes</strong> y administra a tus
        <strong>empleados</strong>.
        <q-btn
          flat
          color="white"
          label="Ver empleados"
          class="q-ml-sm"
          to="/company/employees"
        />
      </q-banner>
    </transition>

    <transition name="fade">
      <q-banner
        v-if="roleDisplay === 'Empleado'"
        class="q-pa-md q-mt-md"
        :class="bannerEmployeeClass"
        rounded
      >
        <q-icon name="badge" color="orange" class="q-mr-sm" />
        Recuerda <strong>marcar asistencia</strong> y revisar tus solicitudes.
        <q-btn
          flat
          color="white"
          label="Marcar Asistencia"
          class="q-ml-sm"
          to="/employee/attendance"
        />
      </q-banner>
    </transition>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import KpiCard from "@/components/KpiCard.vue";
import SegmentControl from "@/components/SegmentControl.vue";
import { useThemeClasses } from "@/utils/themeClasses";
import { useKpiStore } from "@/stores/kpiStore";
import { useAuthStore } from "@/stores/authStore";

const $q = useQuasar();
const {
  isDark,
  pageContainerClass,
  bannerAdminClass,
  bannerCompanyClass,
  bannerEmployeeClass,
} = useThemeClasses();

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
// QDate en modo range
const range = ref({ from: null, to: null });

const presetOptions = [
  { label: "7D", value: "7d", icon: "bolt" },
  { label: "30D", value: "30d", icon: "calendar_view_month" },
  { label: "YTD", value: "ytd", icon: "timeline" },
  { label: "TODO", value: "all", icon: "all_inbox" },
  { label: "CUSTOM", value: "custom", icon: "tune" },
];

// Etiquetas visibles
const periodLabel = computed(() => {
  if (rangePreset.value === "7d") return "Últimos 7 días";
  if (rangePreset.value === "30d") return "Últimos 30 días";
  if (rangePreset.value === "ytd") return "Año en curso";
  if (rangePreset.value === "all") return "Todo";
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

// Limita fechas si quieres (aquí permitimos todas)
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
      { icon: "insights", label: "KPIs", to: "/admin/kpi" },
    ];
  }
  if (roleDisplay.value === "Empresa") {
    return [
      { icon: "group", label: "Empleados", to: "/company/employees" },
      { icon: "summarize", label: "Reportes", to: "/company/reports" },
      { icon: "event_note", label: "Solicitudes", to: "/company/requests" },
    ];
  }
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
  // preset inicial
  setPresetDates("7d");
  reload();
  // Auto refresh opcional
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
        second: "2-digit",
      })
    : "—"
);
</script>

<style scoped>
.kpi-grid-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
}

/* header box */
.header-actions {
  padding: 8px 10px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--q-primary) 6%, transparent);
  gap: 10px;
  align-items: center;
}

/* ghost buttons */
.rk-ghost {
  background: transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
}
.rk-ghost:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* input de fecha */
.rk-date :deep(.q-field__control) {
  border-radius: 10px;
}

/* transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
