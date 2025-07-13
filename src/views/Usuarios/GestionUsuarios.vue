<template>
  <q-page class="q-pa-md bg-grey-1">
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6 text-primary">Gestión de Usuarios</div>
          <div class="text-subtitle2 text-grey">
            Administra los accesos y roles de los usuarios registrados en la plataforma
          </div>
        </div>
        <q-btn label="Nuevo Usuario" color="primary" icon="person_add" @click="crearUsuario" />
      </q-card-section>

      <q-separator />

      <q-table
        flat
        bordered
        :rows="usuarios"
        :columns="columns"
        row-key="id"
        no-data-label="No hay usuarios registrados"
      >
        <template v-slot:body-cell:acciones="props">
          <q-td align="center">
            <q-btn
              dense flat round icon="edit" color="primary"
              @click="editarUsuario(props.row)"
              title="Editar"
            />
            <q-btn
              dense flat round icon="delete" color="negative"
              @click="eliminarUsuario(props.row.id)"
              title="Eliminar"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const usuarios = ref([]);

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'email', label: 'Correo', field: 'email', align: 'left' },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'left' },
  { name: 'empresa', label: 'Empresa', field: 'empresa', align: 'left' },
  { name: 'acciones', label: 'Acciones', align: 'center' },
];

onMounted(() => {
  // Datos simulados
  usuarios.value = [
    { id: 1, nombre: 'Admin General', email: 'admin@checksy.com', rol: 'Administrador', empresa: '-' },
    { id: 2, nombre: 'María Soto', email: 'maria@empresa1.com', rol: 'Empresa', empresa: 'Empresa 1' },
    { id: 3, nombre: 'Carlos Rivas', email: 'carlos@empresa1.com', rol: 'Empleado', empresa: 'Empresa 1' },
  ];
});

function editarUsuario(usuario) {
  $q.dialog({
    title: 'Editar Usuario',
    message: `Funcionalidad futura para editar: ${usuario.nombre}`,
  });
}

function eliminarUsuario(id) {
  $q.dialog({
    title: '¿Eliminar usuario?',
    message: 'Esta acción no se puede deshacer.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    usuarios.value = usuarios.value.filter((u) => u.id !== id);
    $q.notify({ type: 'positive', message: 'Usuario eliminado correctamente' });
  });
}

function crearUsuario() {
  $q.dialog({
    title: 'Nuevo Usuario',
    message: 'Funcionalidad futura para crear usuario.',
  });
}
</script>
