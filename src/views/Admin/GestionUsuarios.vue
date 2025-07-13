<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-primary">Gestión de Usuarios</div>
      <q-btn label="Agregar Usuario" color="primary" icon="person_add" @click="abrirDialogoNuevo" />
    </div>

    <q-table
      :rows="usuarios"
      :columns="columnas"
      row-key="id"
      flat
      bordered
      :loading="cargando"
      no-data-label="No hay usuarios registrados"
    >
      <template v-slot:body-cell-acciones="props">
        <q-td align="center">
          <q-btn
            icon="delete"
            color="negative"
            dense
            flat
            round
            @click="eliminarUsuario(props.row.id)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo para agregar usuario -->
    <q-dialog v-model="dialogoNuevo">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Nuevo Usuario</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="nuevoUsuario.nombre"
            label="Nombre"
            dense
            outlined
            class="q-mb-sm"
          />
          <q-input
            v-model="nuevoUsuario.email"
            label="Correo electrónico"
            type="email"
            dense
            outlined
            class="q-mb-sm"
          />
          <q-select
            v-model="nuevoUsuario.rol"
            label="Rol"
            :options="['admin', 'empresa', 'empleado']"
            dense
            outlined
            class="q-mb-sm"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" @click="guardarUsuario" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const usuarios = ref([]);
const cargando = ref(false);
const dialogoNuevo = ref(false);

const nuevoUsuario = ref({
  nombre: '',
  email: '',
  rol: ''
});

const columnas = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'email', label: 'Correo', field: 'email', align: 'left' },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
];

function cargarUsuarios() {
  cargando.value = true;
  // Simulación de carga
  setTimeout(() => {
    usuarios.value = [
      { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', rol: 'empresa' },
      { id: 2, nombre: 'Laura Gómez', email: 'laura@example.com', rol: 'admin' },
    ];
    cargando.value = false;
  }, 800);
}

function abrirDialogoNuevo() {
  nuevoUsuario.value = { nombre: '', email: '', rol: '' };
  dialogoNuevo.value = true;
}

function guardarUsuario() {
  if (!nuevoUsuario.value.nombre || !nuevoUsuario.value.email || !nuevoUsuario.value.rol) {
    return alert('Completa todos los campos');
  }

  usuarios.value.push({
    id: Date.now(),
    ...nuevoUsuario.value,
  });
  dialogoNuevo.value = false;
}

function eliminarUsuario(id) {
  usuarios.value = usuarios.value.filter(u => u.id !== id);
}
onMounted(cargarUsuarios);
</script>
