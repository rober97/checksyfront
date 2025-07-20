<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-primary">Gestión de Usuarios</div>
        <div class="text-subtitle2 text-grey-7">Administra los accesos y roles de los usuarios registrados en la plataforma</div>
      </div>
      <q-btn label="Nuevo Usuario" color="primary" icon="person_add" @click="crearUsuario" />
    </div>

    <q-card flat bordered :class="cardClass">
      <q-table
        title="Listado de Usuarios"
        :rows="usuarios"
        :columns="columns"
        row-key="id"
        flat
        bordered
        no-data-label="No hay usuarios registrados"
        :pagination="{ rowsPerPage: 10 }"
        :class="tableClass"
      >
        <template v-slot:body-cell-acciones="props">
          <q-td align="center">
            <q-btn dense flat icon="visibility" @click="verUsuario(props.row)" title="Ver" />
            <q-btn dense flat icon="edit" color="primary" @click="editarUsuario(props.row)" title="Editar" />
            <q-btn dense flat icon="delete" color="negative" @click="eliminarUsuario(props.row.id)" title="Eliminar" />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>



<script setup>
import { ref, onMounted, computed } from 'vue';
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
  usuarios.value = [
    { id: 1, nombre: 'Admin General', email: 'admin@checksy.com', rol: 'Administrador', empresa: '-' },
    { id: 2, nombre: 'María Soto', email: 'maria@empresa1.com', rol: 'Empresa', empresa: 'Empresa 1' },
    { id: 3, nombre: 'Carlos Rivas', email: 'carlos@empresa1.com', rol: 'Empleado', empresa: 'Empresa 1' },
  ];
});

function verUsuario(usuario) {
  $q.dialog({
    title: 'Detalle del Usuario',
    message: `Nombre: ${usuario.nombre}\nEmail: ${usuario.email}\nRol: ${usuario.rol}`,
  });
}

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

// Detecta modo oscuro y aplica clases condicionales
const cardClass = computed(() =>
  $q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-white text-dark'
);
const tableClass = computed(() =>
  $q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-white text-dark'
);
</script>


