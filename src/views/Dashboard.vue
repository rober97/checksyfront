<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-primary q-mb-md">
      Bienvenido {{ nombreRol }}
    </div>

    <!-- KPIs generales -->
    <div class="kpi-grid-wrapper">
      <div class="q-gutter-md row q-col-gutter-md q-mb-md kpi-grid">
        <KpiCard
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

    <!-- Banners según rol -->
    <q-banner
      v-if="role === 'Administrador'"
      class="q-pa-md q-mb-md"
      :class="bannerAdminClass"
      rounded
    >
      <q-icon name="admin_panel_settings" color="blue" class="q-mr-sm" />
      Puedes gestionar <strong>usuarios</strong>, <strong>permisos</strong>, y
      <strong>empresas</strong> desde el menú lateral.
      <q-btn
        flat
        color="primary"
        label="Ir a Gestión"
        class="q-ml-sm"
        to="/admin/users"
      />
    </q-banner>

    <q-banner
      v-if="role === 'Empresa'"
      class="q-pa-md q-mb-md"
      :class="bannerCompanyClass"
      rounded
    >
      <q-icon name="business" color="green" class="q-mr-sm" />
      Desde aquí puedes revisar <strong>reportes</strong> y administrar a tus
      <strong>empleados</strong>.
      <q-btn
        flat
        color="primary"
        label="Ver empleados"
        class="q-ml-sm"
        to="/company/employees"
      />
    </q-banner>

    <q-banner
      v-if="role === 'Empleado'"
      class="q-pa-md q-mb-md"
      :class="bannerEmployeeClass"
      rounded
    >
      <q-icon name="badge" color="orange" class="q-mr-sm" />
      Recuerda <strong>marcar asistencia</strong> cada día y revisar tu
      historial de solicitudes.
      <q-btn
        flat
        color="primary"
        label="Marcar Asistencia"
        class="q-ml-sm"
        to="/employee/attendance"
      />
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import KpiCard from "@/components/KpiCard.vue";
import { useThemeClasses } from "@/utils/themeClasses";

const { cardClass, bannerAdminClass, bannerCompanyClass, bannerEmployeeClass } =
  useThemeClasses();

const role = ref(localStorage.getItem("role") || "Empleado");
const nombreRol = {
  Administrador: "Administrador",
  Empresa: "Empresa",
  Empleado: "Empleado",
}[role.value];

// KPI simulados
const vacaciones = ref(15.5);
const asistencias = ref(120);
const solicitudes = ref(3);
const usuariosActivos = ref(42);
const empresas = ref(8);
const diasAdmin = ref(2);
const ultimoCheck = ref("10/10/2025 08:55");
</script>

<style scoped>
.kpi-grid-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
  padding: 16px;
  text-align: center;
}

.kpi-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: bold;
}

.kpi-title {
  font-size: 1rem;
  color: var(--q-secondary);
}

/* Modo oscuro */
body.body--dark .kpi-card {
  background-color: #1e1e1e;
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.04);
}
</style>
