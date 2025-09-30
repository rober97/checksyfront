<template>
  <q-page class="q-pa-md bg-grey-1">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-primary">Gestión de Permisos</div>
        <div class="text-subtitle2 text-grey">
          Asigna roles y permisos a los distintos usuarios de la plataforma.
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        :rows="usuarios"
        :columns="columns"
        row-key="id"
        flat
        bordered
        no-data-label="No hay usuarios registrados"
      >
        <template v-slot:body-cell:acciones="props">
          <q-td align="center">
            <q-btn
              dense flat color="primary" icon="lock_open"
              label="Editar permisos"
              @click="editarPermisos(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogVisible">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Editar Permisos: {{ usuarioSeleccionado?.nombre }}</div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="usuarioSeleccionado.rol"
            :options="roles"
            label="Rol"
            outlined
          />

          <q-option-group
            v-model="usuarioSeleccionado.permisos"
            :options="todosLosPermisos"
            label="Permisos específicos"
            type="checkbox"
            inline
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" @click="guardarPermisos" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const usuarios = ref([
  {
    id: 1,
    nombre: 'Admin General',
    rol: 'admin',
    permisos: ['crear_empresa', 'ver_reportes', 'editar_usuarios'],
  },
  {
    id: 2,
    nombre: 'Pedro Martínez',
    rol: 'Empresa',
    permisos: ['crear_empleado', 'ver_asistencias'],
  },
]);

const roles = ['admin', 'Empresa', 'Empleado', 'Supervisor'];

const todosLosPermisos = [
  { label: 'Crear Empresa', value: 'crear_empresa' },
  { label: 'Crear Empleado', value: 'crear_empleado' },
  { label: 'Ver Asistencias', value: 'ver_asistencias' },
  { label: 'Editar Usuarios', value: 'editar_usuarios' },
  { label: 'Ver Reportes', value: 'ver_reportes' },
  { label: 'Aprobar Solicitudes', value: 'aprobar_solicitudes' },
];

const columns = [
  { name: 'nombre', label: 'Usuario', field: 'nombre', align: 'left' },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'left' },
  { name: 'acciones', label: 'Acciones', align: 'center' },
];

const dialogVisible = ref(false);
const usuarioSeleccionado = ref(null);

function editarPermisos(usuario) {
  usuarioSeleccionado.value = { ...usuario };
  dialogVisible.value = true;
}

function guardarPermisos() {
  const index = usuarios.value.findIndex((u) => u.id === usuarioSeleccionado.value.id);
  if (index !== -1) {
    usuarios.value[index] = { ...usuarioSeleccionado.value };
  }
  dialogVisible.value = false;
  $q.notify({ type: 'positive', message: 'Permisos actualizados correctamente' });
}
</script>
