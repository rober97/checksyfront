<template>
  <q-header elevated :class="headerClass">
    <q-toolbar>
      <!-- Menú lateral -->
      <q-btn
        flat
        dense
        round
        icon="menu"
        aria-label="Menu"
        @click="$emit('toggle-drawer')"
      />

      <!-- Título -->
      <q-toolbar-title class="text-weight-bold text-uppercase"
        >Recksy</q-toolbar-title
      >

      <!-- Empresa seleccionada (abreviación) -->
      <BusinessSelector/>

      <!-- 🌙 Modo Oscuro -->
      <q-toggle
        v-model="isDark"
        color="white"
        icon="dark_mode"
        size="sm"
        dense
        @update:model-value="toggleDark"
        class="q-mr-sm"
      />

      <!-- Menú Usuario -->
      <q-btn round flat dense>
        <UserAvatarMenu />
      </q-btn>
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Dark, useQuasar } from "quasar";
import UserAvatarMenu from "@/components/UserAvatarMenu.vue";
import BusinessSelector from "@/components/BusinessSelector.vue";
import { useThemeClasses } from "@/utils/themeClasses";
import { useThemeStore } from "@/stores/themeStore";

const $q = useQuasar();
const router = useRouter();
const themeStore = useThemeStore();
const isDark = ref(false);
const { headerClass } = useThemeClasses();

// Estado del selector de empresa
const empresaMenu = ref(false);
const loadingEmpresa = ref(false);
const empresas = ref([
  { id: 1, nombre: "Empresa Uno" },
  { id: 2, nombre: "Empresa Dos" },
  { id: 3, nombre: "Empresa Tres" },
]);

const empresaSeleccionada = ref(null);

// Obtener siglas
function getSiglas(nombre) {
  return (
    nombre
      ?.split(" ")
      .map((palabra) => palabra[0]?.toUpperCase())
      .join("") || ""
  );
}

// Seleccionar empresa
function seleccionarEmpresa(empresa) {
  loadingEmpresa.value = true;
  setTimeout(() => {
    empresaSeleccionada.value = empresa;
    localStorage.setItem("empresaSeleccionada", JSON.stringify(empresa));
    loadingEmpresa.value = false;

    // Aquí podrías emitir un evento global si quieres que otras vistas escuchen este cambio
  }, 600); // Simula carga
}

onMounted(() => {
  const savedEmpresa = localStorage.getItem("empresaSeleccionada");
  empresaSeleccionada.value = savedEmpresa
    ? JSON.parse(savedEmpresa)
    : empresas.value[0];

  const savedPreference = localStorage.getItem("darkMode");
  if (savedPreference !== null) {
    isDark.value = savedPreference === "true";
    themeStore.isDark = isDark.value;
    Dark.set(isDark.value);
  } else {
    isDark.value = Dark.isActive;
    localStorage.setItem("darkMode", String(Dark.isActive));
  }
});

function toggleDark(val) {
  themeStore.isDark = val;
  Dark.set(val);
  localStorage.setItem("darkMode", String(val));
}
</script>

<style scoped>
.empresa-abreviada {
  background-color: transparent;
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  transition: 0.2s ease;
}

.empresa-abreviada:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .empresa-abreviada {
  color: #ffffff;
}

body:not(.body--dark) .empresa-abreviada {
  color: #1e1e1e;
}
</style>
