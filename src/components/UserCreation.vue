<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card :class="dialogClass" style="min-width: 400px; max-width: 95vw">
      <q-card-section
        class="text-h6 row items-center q-pb-none"
        :class="headerTextClass"
      >
        <q-icon name="person_add" class="q-mr-sm" />
        Crear Nuevo Usuario
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <!-- Nombre -->
        <q-input
          v-model="form.firstName"
          label="Nombre"
          dense
          outlined
          clearable
          :rules="[(val) => !!val || 'Requerido']"
        />

        <q-input
          v-model="form.lastName"
          label="Apellido"
          dense
          outlined
          clearable
          :rules="[(val) => !!val || 'Requerido']"
        />

        <!-- Correo -->
        <q-input
          v-model="form.email"
          label="Correo electrónico"
          type="email"
          dense
          outlined
          clearable
          :rules="[(val) => !!val || 'Requerido']"
        />

        <!-- RUT -->
        <q-input
          v-if="form.tipo === 'empleado' || form.tipo === 'empresa'"
          v-model="form.rut"
          label="RUT"
          dense
          outlined
          clearable
          :rules="[(val) => !!val || 'Requerido']"
        />

        <!-- Empresa -->
        <q-select
          v-if="form.tipo !== 'admin'"
          v-model="form.empresa"
          label="Empresa"
          :options="empresas"
          option-value="id"
          option-label="name"
          dense
          outlined
          emit-value
          map-options
          :rules="[(val) => !!val || 'Selecciona empresa']"
        />

        <!-- Tipo -->
        <q-select
          v-model="form.tipo"
          label="Tipo de usuario"
          :options="['admin', 'empresa', 'empleado']"
          dense
          outlined
          emit-value
          map-options
          :rules="[(val) => !!val || 'Selecciona un tipo']"
        />

        <!-- Horario -->
        <q-select
          v-if="form.tipo === 'empleado'"
          v-model="form.horarioLaboralId"
          label="Horario Laboral"
          :options="horarios"
          option-value="id"
          option-label="name"
          dense
          outlined
          emit-value
          map-options
          :rules="[(val) => !!val || 'Selecciona un horario']"
        />

        <!-- Contraseña -->
        <q-input
          v-model="form.password"
          label="Contraseña"
          type="password"
          dense
          outlined
          clearable
          :rules="[(val) => !!val || 'Requerido']"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="cancelar" />
        <q-btn color="primary" label="Guardar" @click="guardar" unelevated />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useToast } from "vue-toastification";
import { useUserStore } from "@/stores/userStore";
import { useCompaniesStore } from "@/stores/companies";

const toast = useToast();
const userStore = useUserStore();
const companiesStore = useCompaniesStore();

// Props
const props = defineProps({
  modelValue: { type: Boolean, required: true },
});

// Emits
const emit = defineEmits(["update:modelValue", "created"]);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const empresas = ref([]);
const horarios = ref([]);

const form = ref({
  nombre: "",
  email: "",
  rut: "",
  tipo: "",
  empresa: null,
  horarioLaboralId: null,
  password: "",
});

// Reset form on open
watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      form.value = {
        firstName: "",
        lastName: "",
        email: "",
        rut: "",
        tipo: "",
        empresa: null,
        horarioLaboralId: null,
        password: "",
      };
      await loadEmpresas();
    }
  }
);

// Cargar empresas
async function loadEmpresas() {
  try {
    await companiesStore.fetchCompanies();
    empresas.value = companiesStore.companies.map((c) => ({
      id: c._id,
      name: c.name,
    }));
  } catch (error) {
    toast.error("Error al cargar empresas");
  }
}

// Watch para cargar horarios cuando cambia empresa y el tipo es empleado
watch(
  () => form.value.empresa,
  async (empresaId) => {
    if (form.value.tipo === "empleado" && empresaId) {
      try {
        await companiesStore.fetchWorkSchedulesByCompany(empresaId);
        horarios.value = companiesStore.workSchedules.map((h) => ({
          id: h._id,
          name: h.name,
        }));
      } catch {
        horarios.value = [];
        toast.error("No se pudieron cargar los horarios.");
      }
    }
  }
);

watch(
  () => form.value.tipo,
  async (nuevoTipo) => {
    const empresaId = form.value.empresa;

    if (nuevoTipo === "empleado" && empresaId) {
      try {
        await companiesStore.fetchWorkSchedulesByCompany(empresaId);
        horarios.value = companiesStore.workSchedules.map((h) => ({
          id: h._id,
          name: h.name,
        }));
      } catch {
        horarios.value = [];
        toast.error("No se pudieron cargar los horarios.");
      }
    }
  }
);

async function guardar() {
  const required = ["firstName", "email", "tipo", "password"];
  const missing = required.filter((f) => !form.value[f]);

  if (missing.length > 0) {
    toast.error("Faltan campos obligatorios.");
    return;
  }

  if (form.value.tipo !== "admin" && !form.value.empresa) {
    toast.error("Debes seleccionar una empresa.");
    return;
  }

  if (form.value.tipo === "empleado" && !form.value.horarioLaboralId) {
    toast.error("Selecciona un horario laboral.");
    return;
  }

  const payload = {
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    email: form.value.email,
    rut: form.value.rut,
    tipo: form.value.tipo,
    password: form.value.password,
    empresa: form.value.empresa,
    horarioLaboralId: form.value.horarioLaboralId,
  };

  try {
    await userStore.createUser(payload);
    toast.success("Usuario creado correctamente.");
    emit("created");
    dialogVisible.value = false;
  } catch (err) {
    toast.error(userStore.error || "No se pudo crear el usuario.");
  }
}

function cancelar() {
  dialogVisible.value = false;
}
</script>
