<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-primary row items-center">
        <q-icon name="group" class="q-mr-sm" />
        Gestión de Usuarios
      </div>
      <q-btn
        label="Agregar Usuario"
        color="primary"
        icon="person_add"
        unelevated
        class="q-px-md shadow-2 transition-ease"
        @click="abrirDialogoNuevo"
      />
    </div>

    <!-- Tabla de Usuarios -->
    <q-table
      :rows="usuarios"
      :columns="columnas"
      row-key="id"
      flat
      bordered
      :loading="cargando"
      class="styled-table"
      no-data-label="No hay usuarios registrados"
    >
      <!-- Acciones -->
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

    <!-- Diálogo Nuevo Usuario -->
    <q-dialog v-model="dialogoNuevo" persistent>
      <q-card class="q-pa-md" style="min-width: 400px; max-width: 95vw">
        <q-card-section class="text-h6 text-primary row items-center q-pb-none">
          <q-icon name="person_add" class="q-mr-sm" />
          Nuevo Usuario
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-input
            v-model="nuevoUsuario.nombre"
            label="Nombre"
            dense
            outlined
            clearable
            :rules="[val => !!val || 'Requerido']"
            prefix-icon="person"
          />
          <q-input
            v-model="nuevoUsuario.email"
            label="Correo electrónico"
            type="email"
            dense
            outlined
            clearable
            :rules="[val => !!val || 'Requerido']"
            prefix-icon="mail"
          />
          <q-select
            v-model="nuevoUsuario.rol"
            label="Rol"
            :options="['admin', 'empresa', 'empleado']"
            dense
            outlined
            emit-value
            map-options
            :rules="[val => !!val || 'Selecciona un rol']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Guardar"
            @click="guardarUsuario"
            unelevated
          />
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
<style scoped>
.styled-table {
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--q-background);
  color: var(--q-text);
}


.q-table__middle tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.03);
}

.q-btn.shadow-2 {
  transition: transform 0.2s ease;
}
.q-btn.shadow-2:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 123, 255, 0.25);
}

</style>