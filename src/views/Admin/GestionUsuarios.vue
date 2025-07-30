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
      row-key="_id"
      flat
      bordered
      :loading="cargando"
      class="styled-table"
      no-data-label="No hay usuarios registrados"
      :class="tableClass"
    >
      <template v-slot:body-cell-nombre="props">
        <q-td>{{ props.row.nombre || props.row.firstName }}</q-td>
      </template>

      <template v-slot:body-cell-apellido="props">
        <q-td>{{ props.row.apellido || props.row.lastName }}</q-td>
      </template>

      <template v-slot:body-cell-email="props">
        <q-td>{{ props.row.email }}</q-td>
      </template>

      <template v-slot:body-cell-role="props">
        <q-td>{{ props.row.tipo || props.row.role }}</q-td>
      </template>

      <template v-slot:body-cell-acciones="props">
        <q-td align="center">
          <q-btn
            icon="delete"
            color="negative"
            dense
            flat
            round
            @click="eliminarUsuario(props.row._id)"
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
import { useUserStore } from "@/stores/userStore";
import { useCompaniesStore } from "@/stores/companies";
import UserCreation from "@/components/UserCreation.vue";
import { useToast } from "vue-toastification";

const toast = useToast();
const $q = useQuasar();
const userStore = useUserStore();
const companiesStore = useCompaniesStore();

const dialogoNuevo = ref(false);
const empresas = ref([]);
const horarios = ref([]);

const columnas = [
  {
    name: "nombre",
    label: "Nombre",
    field: (row) => row.firstName,
    align: "left",
  },
  {
    name: "apellido",
    label: "Apellido",
    field: (row) => row.lastName,
    align: "left",
  },
  { name: "email", label: "Correo", field: "email", align: "left" },
  {
    name: "role",
    label: "Rol",
    field: (row) => row.tipo || row.role,
    align: "left",
  },
  { name: "acciones", label: "Acciones", field: "acciones", align: "center" },
];

const usuarios = computed(() => userStore.users);
const cargando = computed(() => userStore.loading);

async function cargarUsuarios() {
  try {
    await userStore.fetchUsers();
  } catch (err) {
    toast.error("Error al cargar usuarios");
  }
}


async function cargarEmpresasYHorarios() {
  try {
    await companiesStore.fetchCompanies();
    empresas.value = companiesStore.companies.map((e) => ({
      id: e._id,
      nombre: e.name,
    }));

    // Carga todos los horarios de todas las empresas
    horarios.value = [];
    for (const empresa of empresas.value) {
      await companiesStore.fetchWorkSchedulesByCompany(empresa.id);
      const nuevos = companiesStore.workSchedules.map((h) => ({
        id: h._id,
        name: h.name,
      }));
      horarios.value.push(...nuevos);
    }
  } catch (e) {
    toast.error("Error al cargar empresas u horarios");
  }
}

function abrirDialogoNuevo() {
  dialogoNuevo.value = true;
}

async function eliminarUsuario(id) {
  try {
    await userStore.deleteUser(id);
    toast.success("Usuario eliminado correctamente");
    await cargarUsuarios();
  } catch (e) {
    toast.error("No se pudo eliminar el usuario");
  }
}

// Tema
const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"
);
const tableClass = computed(() =>
  isDark.value ? "bg-grey-9 text-white" : "bg-white text-dark"
);
const headerTextClass = computed(() =>
  isDark.value ? "text-white" : "text-primary"
);

onMounted(async () => {
  await cargarUsuarios();
  await cargarEmpresasYHorarios();
});
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
