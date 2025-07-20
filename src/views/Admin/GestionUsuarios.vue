<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 row items-center" :class="headerTextClass">
        <q-icon name="group" class="q-mr-sm" />
        Gestión de Usuarios
      </div>
      <q-btn
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
      :class="tableClass"
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
            title="Eliminar"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Nuevo Usuario -->
    <UserCreation
      v-model="dialogoNuevo"
      :empresas="empresas"
      :horarios="horarios"
      @guardar="guardarUsuario"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useQuasar } from "quasar";
import UserCreation from "@/components/UserCreation.vue";

const $q = useQuasar();
const usuarios = ref([]);
const cargando = ref(false);
const dialogoNuevo = ref(false);

const nuevoUsuario = ref({
  nombre: "",
  email: "",
  rol: "",
});

const columnas = [
  { name: "nombre", label: "Nombre", field: "nombre", align: "left" },
  { name: "email", label: "Correo", field: "email", align: "left" },
  { name: "rol", label: "Rol", field: "rol", align: "left" },
  { name: "acciones", label: "Acciones", field: "acciones", align: "center" },
];

function cargarUsuarios() {
  cargando.value = true;
  setTimeout(() => {
    usuarios.value = [
      {
        id: 1,
        nombre: "Juan Pérez",
        email: "juan@example.com",
        rol: "empresa",
      },
      {
        id: 2,
        nombre: "Laura Gómez",
        email: "laura@example.com",
        rol: "admin",
      },
    ];
    cargando.value = false;
  }, 800);
}

function abrirDialogoNuevo() {
  nuevoUsuario.value = { nombre: "", email: "", rol: "" };
  dialogoNuevo.value = true;
}

function guardarUsuario() {
  if (
    !nuevoUsuario.value.nombre ||
    !nuevoUsuario.value.email ||
    !nuevoUsuario.value.rol
  ) {
    $q.notify({ type: "warning", message: "Completa todos los campos" });
    return;
  }

  usuarios.value.push({
    id: Date.now(),
    ...nuevoUsuario.value,
  });
  dialogoNuevo.value = false;
}

function eliminarUsuario(id) {
  usuarios.value = usuarios.value.filter((u) => u.id !== id);
  $q.notify({ type: "positive", message: "Usuario eliminado correctamente" });
}

// 🎯 Computed para detectar modo oscuro
const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"
);
const tableClass = computed(() =>
  isDark.value ? "bg-grey-9 text-white" : "bg-white text-dark"
);
const dialogClass = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-white text-dark"
);
const headerTextClass = computed(() =>
  isDark.value ? "text-white" : "text-primary"
);

onMounted(cargarUsuarios);
</script>

<style scoped>
.styled-table {
  border-radius: 12px;
  overflow: hidden;
  transition: background-color 0.3s, color 0.3s;
}

.q-table__middle tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.025);
}

.q-btn.shadow-2 {
  transition: transform 0.2s ease;
}
.q-btn.shadow-2:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 123, 255, 0.25);
}
</style>
