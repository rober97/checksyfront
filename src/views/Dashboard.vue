<template>
  <q-page class="q-pa-md" :class="pageContainerClass">
    <!-- Título -->
    <div class="row items-center q-mb-lg">
      <q-icon name="dashboard" class="q-mr-sm" size="28px" color="primary" />
      <div class="text-h5" :class="isDark ? 'text-white' : 'text-primary'">
        Bienvenido {{ nombreRol }}
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid-wrapper">
      <div class="q-gutter-md row q-col-gutter-md q-mb-md kpi-grid">
        <KpiCard
          v-if="role === 'Empleado'"
          title="Días Vacaciones"
          :value="vacaciones"
          icon="beach_access"
        />
        <KpiCard
          title="Asistencias"
          :value="asistencias"
          icon="event_available"
        />
        <KpiCard
          title="Solicitudes Pendientes"
          :value="solicitudes"
          icon="hourglass_empty"
        />

        <KpiCard
          v-if="role === 'Administrador'"
          title="Usuarios Activos"
          :value="usuariosActivos"
          icon="people"
        />
        <KpiCard
          v-if="role === 'Administrador'"
          title="Empresas Registradas"
          :value="empresas"
          icon="apartment"
        />

        <KpiCard
          v-if="role === 'Empleado'"
          title="Días Administrativos"
          :value="diasAdmin"
          icon="calendar_today"
        />
        <KpiCard
          v-if="role === 'Empleado'"
          title="Último Check-in"
          :value="ultimoCheck"
          icon="access_time"
        />
      </div>
    </div>

    <!-- Banner por rol -->
    <q-banner
      v-if="role === 'Administrador'"
      class="q-pa-md q-mb-md animate__animated animate__fadeIn"
      :class="bannerAdminClass"
      rounded
    >
      <q-icon name="admin_panel_settings" color="blue" class="q-mr-sm" />
      Puedes gestionar <strong>usuarios</strong>, <strong>permisos</strong> y
      <strong>empresas</strong> desde el menú lateral.
      <q-btn
        flat
        color="white"
        label="Ir a Gestión"
        class="q-ml-sm"
        to="/admin/users"
      />
    </q-banner>

    <q-banner
      v-if="role === 'Empresa'"
      class="q-pa-md q-mb-md animate__animated animate__fadeIn"
      :class="bannerCompanyClass"
      rounded
    >
      <q-icon name="business" color="green" class="q-mr-sm" />
      Desde aquí puedes revisar <strong>reportes</strong> y administrar a tus
      <strong>empleados</strong>.
      <q-btn
        flat
        color="white"
        label="Ver empleados"
        class="q-ml-sm"
        to="/company/employees"
      />
    </q-banner>

    <q-banner
      v-if="role === 'Empleado'"
      class="q-pa-md q-mb-md animate__animated animate__fadeIn"
      :class="bannerEmployeeClass"
      rounded
    >
      <q-icon name="badge" color="orange" class="q-mr-sm" />
      Recuerda <strong>marcar asistencia</strong> cada día y revisar tu
      historial de solicitudes.
      <q-btn
        flat
        color="white"
        label="Marcar Asistencia"
        class="q-ml-sm"
        to="/employee/attendance"
      />
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import KpiCard from "@/components/KpiCard.vue";
import { useThemeClasses } from "@/utils/themeClasses";
import { useKpiStore } from "@/stores/kpiStore";

const {
  isDark,
  pageContainerClass,
  bannerAdminClass,
  bannerCompanyClass,
  bannerEmployeeClass,
} = useThemeClasses();

const role = ref(localStorage.getItem("role") || "Empleado");
const companyId = localStorage.getItem("companyId") || undefined;
const userId = localStorage.getItem("userId") || undefined;

const nombreRol = computed(
  () =>
    ({
      Administrador: "Administrador",
      Empresa: "Empresa",
      Empleado: "Empleado",
    }[role.value] || "Usuario")
);

const kpi = useKpiStore();

function cargarKpis() {
  kpi.fetchKpis({
    role: role.value,
    companyId,
    userId,
    // puedes pasar from/to si agregas filtros de fecha
  });
}

onMounted(cargarKpis);
watch(() => role.value, cargarKpis);

// Computed para bindear en el template
const vacaciones = computed(() => kpi.vacaciones);
const asistencias = computed(() => kpi.asistencias);
const solicitudes = computed(() => kpi.solicitudes);
const usuariosActivos = computed(() => kpi.usuariosActivos);
const empresas = computed(() => kpi.empresas);
const diasAdmin = computed(() => kpi.diasAdmin);
const ultimoCheck = computed(() => kpi.ultimoCheck);
</script>

<style scoped>
.kpi-grid-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.text-h5 {
  font-weight: 600;
}

/* Animaciones y sombras */
.q-banner {
  transition: all 0.3s ease;
}
</style>
