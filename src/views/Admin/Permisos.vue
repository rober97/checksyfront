<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="text-h5 text-primary q-mb-lg">Gestión de Permisos</div>

    <q-card flat bordered>
      <q-card-section>
        <q-tabs
          v-model="rolSeleccionado"
          class="text-primary"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
        >
          <q-tab name="admin" label="Administrador" />
          <q-tab name="empresa" label="Empresa" />
          <q-tab name="empleado" label="Empleado" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-for="permiso in permisosDisponibles" :key="permiso" class="q-mb-sm">
          <q-toggle
            v-model="permisosPorRol[rolSeleccionado][permiso]"
            :label="permiso"
            color="primary"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Restablecer" flat @click="resetearCambios" />
        <q-btn label="Guardar Cambios" color="primary" @click="guardarCambios" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';

// Roles disponibles
const rolSeleccionado = ref('admin');

// Lista de permisos posibles
const permisosDisponibles = [
  'Ver empleados',
  'Crear empleados',
  'Editar empleados',
  'Eliminar empleados',
  'Ver asistencias',
  'Marcar asistencias',
  'Gestionar solicitudes',
  'Aprobar solicitudes',
  'Subir documentos',
  'Gestionar usuarios',
  'Configurar empresa',
];

// Permisos actuales por rol (simulado)
const permisosPorRol = ref({
  admin: {
    'Ver empleados': true,
    'Crear empleados': true,
    'Editar empleados': true,
    'Eliminar empleados': true,
    'Ver asistencias': true,
    'Marcar asistencias': true,
    'Gestionar solicitudes': true,
    'Aprobar solicitudes': true,
    'Subir documentos': true,
    'Gestionar usuarios': true,
    'Configurar empresa': true,
  },
  empresa: {
    'Ver empleados': true,
    'Crear empleados': true,
    'Editar empleados': true,
    'Eliminar empleados': false,
    'Ver asistencias': true,
    'Marcar asistencias': true,
    'Gestionar solicitudes': true,
    'Aprobar solicitudes': false,
    'Subir documentos': true,
    'Gestionar usuarios': false,
    'Configurar empresa': true,
  },
  empleado: {
    'Ver empleados': false,
    'Crear empleados': false,
    'Editar empleados': false,
    'Eliminar empleados': false,
    'Ver asistencias': true,
    'Marcar asistencias': true,
    'Gestionar solicitudes': true,
    'Aprobar solicitudes': false,
    'Subir documentos': false,
    'Gestionar usuarios': false,
    'Configurar empresa': false,
  }
});

// Copia original para resetear
const copiaOriginal = JSON.parse(JSON.stringify(permisosPorRol.value));

function resetearCambios() {
  permisosPorRol.value = JSON.parse(JSON.stringify(copiaOriginal));
}

function guardarCambios() {
  // Aquí puedes hacer un fetch o axios.post al backend para guardar cambios
  copiaOriginal[rolSeleccionado.value] = {
    ...permisosPorRol.value[rolSeleccionado.value]
  };
  $q.notify({ type: 'positive', message: 'Permisos actualizados' });
}
</script>
