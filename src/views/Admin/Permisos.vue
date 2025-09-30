<template>
  <q-page class="permisos-page column" :class="pageBgClass">
    <!-- Header -->
    <div class="q-pa-md text-h5 row items-center" :class="headerTextClass">
      <q-icon name="vpn_key" class="q-mr-sm" />
      Gestión de Permisos
    </div>

    <!-- Contenedor principal (ocupa todo el espacio disponible) -->
    <div class="q-pa-md col flex column">
      <q-card flat bordered class="fit column" :class="cardClass">
        <!-- Controles -->
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-select
                v-model="modo"
                :options="['Por rol', 'Por usuario']"
                label="Tipo de gestión"
                dense
                outlined
              />
            </div>
            <div class="col-12 col-md-4" v-if="modo === 'Por usuario'">
              <q-select
                v-model="usuarioSeleccionado"
                :options="usuariosDisponibles"
                label="Seleccionar usuario"
                dense
                outlined
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-4" v-if="modo === 'Por rol'">
              <q-tabs
                v-model="rolSeleccionado"
                align="left"
                narrow-indicator
                class="custom-tabs"
              >
                <q-tab name="admin" label="admin" />
                <q-tab name="empresa" label="Empresa" />
                <q-tab name="empleado" label="Empleado" />
              </q-tabs>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Permisos con scroll interno -->
        <q-card-section class="col scroll-area">
          <div
            v-for="permiso in permisosDisponibles"
            :key="permiso"
            class="q-mb-sm"
          >
            <q-toggle
              v-model="permisosActivos[permiso]"
              :label="permiso"
              color="primary"
              :class="toggleClass"
            />
          </div>
        </q-card-section>

        <q-separator />

        <!-- Acciones -->
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="Restablecer" flat @click="resetearCambios" />
          <q-btn
            label="Guardar Cambios"
            color="primary"
            @click="guardarCambios"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();

const modo = ref("Por rol");
const rolSeleccionado = ref("admin");
const usuarioSeleccionado = ref(null);

const permisosDisponibles = [
  "Ver empleados",
  "Crear empleados",
  "Editar empleados",
  "Eliminar empleados",
  "Ver asistencias",
  "Marcar asistencias",
  "Gestionar solicitudes",
  "Aprobar solicitudes",
  "Subir documentos",
  "Gestionar usuarios",
  "Configurar empresa",
];

const usuariosDisponibles = [
  { label: "Juan Pérez", value: "user_1" },
  { label: "Ana Gómez", value: "user_2" },
];

const permisosPorRol = ref({
  admin: { ...defaultPermisos(true) },
  empresa: {
    ...defaultPermisos(false, [
      "Eliminar empleados",
      "Aprobar solicitudes",
      "Gestionar usuarios",
    ]),
  },
  empleado: {
    ...defaultPermisos(false, [
      "Ver asistencias",
      "Marcar asistencias",
      "Gestionar solicitudes",
    ]),
  },
});

const permisosPorUsuario = ref({
  user_1: { ...defaultPermisos(true) },
  user_2: { ...defaultPermisos(false, ["Ver asistencias"]) },
});

const copiaOriginal = {
  rol: JSON.parse(JSON.stringify(permisosPorRol.value)),
  usuario: JSON.parse(JSON.stringify(permisosPorUsuario.value)),
};

const permisosActivos = ref({});

watch(
  [modo, rolSeleccionado, usuarioSeleccionado],
  () => {
    if (modo.value === "Por rol") {
      permisosActivos.value = {
        ...permisosPorRol.value[rolSeleccionado.value],
      };
    } else if (usuarioSeleccionado.value) {
      permisosActivos.value = {
        ...permisosPorUsuario.value[usuarioSeleccionado.value],
      };
    }
  },
  { immediate: true }
);

function resetearCambios() {
  if (modo.value === "Por rol") {
    permisosActivos.value = { ...copiaOriginal.rol[rolSeleccionado.value] };
  } else if (usuarioSeleccionado.value) {
    permisosActivos.value = {
      ...copiaOriginal.usuario[usuarioSeleccionado.value],
    };
  }
}

function guardarCambios() {
  if (modo.value === "Por rol") {
    permisosPorRol.value[rolSeleccionado.value] = { ...permisosActivos.value };
    copiaOriginal.rol[rolSeleccionado.value] = { ...permisosActivos.value };
  } else if (usuarioSeleccionado.value) {
    permisosPorUsuario.value[usuarioSeleccionado.value] = {
      ...permisosActivos.value,
    };
    copiaOriginal.usuario[usuarioSeleccionado.value] = {
      ...permisosActivos.value,
    };
  }
  $q.notify({
    type: "positive",
    message: "Permisos actualizados correctamente",
  });
}

function defaultPermisos(valorPorDefecto, permitidos = []) {
  const permisos = {};
  for (const permiso of permisosDisponibles) {
    permisos[permiso] = valorPorDefecto;
  }
  if (!valorPorDefecto && permitidos.length) {
    for (const permiso of permitidos) {
      permisos[permiso] = true;
    }
  }
  return permisos;
}

const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"
);
const cardClass = computed(() =>
  isDark.value ? "bg-grey-9 text-white" : "bg-white text-dark"
);
const headerTextClass = computed(() =>
  isDark.value ? "text-white" : "text-primary"
);
const toggleClass = computed(() => (isDark.value ? "text-white" : "text-dark"));
</script>

<style scoped>
.text-h5 {
  font-weight: 600;
}
.permisos-page {
  height: 90vh;
}
.scroll-area {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.custom-tabs {
  display: flex;
  gap: 10px;
  padding: 8px;
  background-color: var(--tab-bg);
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.custom-tabs :deep(.q-tab) {
  background-color: transparent;
  color: var(--tab-color);
  border-radius: 6px;
  padding: 6px 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.custom-tabs :deep(.q-tab--active) {
  background-color: var(--tab-active-bg);
  color: var(--tab-active-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

body.body--light {
  --tab-bg: #f5f7fa;
  --tab-color: #5f6368;
  --tab-active-bg: #e0e0e0;
  --tab-active-color: #1e1e1e;
}

body.body--dark {
  --tab-bg: #2a2a2a;
  --tab-color: #c0c0c0;
  --tab-active-bg: #424242;
  --tab-active-color: #ffffff;
}
</style>
