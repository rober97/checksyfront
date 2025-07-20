<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md">

        <!-- Apariencia -->
        <q-card flat bordered>
          <q-card-section>
            <div class="section-header">
              <q-icon name="palette" class="q-mr-sm" />
              <span>Apariencia</span>
            </div>
            <q-toggle
              v-model="isDark"
              label="Modo oscuro"
              left-label
              color="primary"
              @update:model-value="toggleDark"
            />
          </q-card-section>
        </q-card>

        <!-- Idioma -->
        <q-card flat bordered>
          <q-card-section>
            <div class="section-header">
              <q-icon name="language" class="q-mr-sm" />
              <span>Idioma</span>
            </div>
            <q-select
              v-model="idioma"
              :options="opcionesIdioma"
              label="Selecciona tu idioma"
              outlined
              dense
              color="primary"
            />
          </q-card-section>
        </q-card>

        <!-- Notificaciones -->
        <q-card flat bordered>
          <q-card-section>
            <div class="section-header">
              <q-icon name="notifications" class="q-mr-sm" />
              <span>Notificaciones</span>
            </div>
            <q-toggle
              v-model="notificaciones"
              label="Habilitar notificaciones"
              left-label
              color="primary"
            />
          </q-card-section>
        </q-card>

        <!-- Seguridad -->
        <q-card flat bordered>
          <q-card-section>
            <div class="section-header">
              <q-icon name="security" class="q-mr-sm" />
              <span>Seguridad</span>
            </div>
            <q-btn
              label="Cambiar contraseña"
              icon="lock"
              color="primary"
              flat
              @click="cambiarPassword"
            />
          </q-card-section>
        </q-card>

        <!-- Información -->
        <q-card flat bordered>
          <q-card-section>
            <div class="section-header">
              <q-icon name="info" class="q-mr-sm" />
              <span>Información</span>
            </div>
            <q-btn
              label="Términos y condiciones"
              icon="description"
              flat
              color="primary"
              @click="verTerminos"
            />
            <div class="text-caption q-mt-sm">
              Versión de la app: <strong>1.0.0</strong>
            </div>
          </q-card-section>
        </q-card>

        <!-- Cerrar sesión -->
        <q-card flat bordered class="bg-grey-1 text-negative">
          <q-card-section>
            <div class="section-header">
              <q-icon name="logout" class="q-mr-sm" />
              <span>Cuenta</span>
            </div>
            <q-btn
              label="Cerrar sesión"
              icon="logout"
              color="negative"
              @click="cerrarSesion"
              flat
            />
          </q-card-section>
        </q-card>

      </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Drawer from "@/components/Drawer.vue";
import Header from "@/components/Header.vue";
import { Dark } from "quasar";
import { useThemeClasses } from '@/utils/themeClasses';
const router = useRouter();

const isDark = ref(false);
const idioma = ref("es");
const notificaciones = ref(true);

const opcionesIdioma = [
  { label: "Español", value: "es" },
  { label: "Inglés", value: "en" },
  { label: "Portugués", value: "pt" },
  { label: "Alemán", value: "de" },
];

onMounted(() => {
  const savedDark = localStorage.getItem("darkMode");
  if (savedDark !== null) isDark.value = savedDark === "true";
});

function toggleDark(val) {
  Dark.set(val);
  localStorage.setItem("darkMode", String(val));
}

function cerrarSesion() {
  localStorage.removeItem("token");
  router.push("/login");
}

function cambiarPassword() {
  router.push("/cambiar-password");
}

function verTerminos() {
  router.push("/terminos-condiciones");
}

</script>

<style scoped>
/* Encabezado de sección con ícono y título */
.section-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1.15rem;
  margin-bottom: 10px;
  color: var(--text-primary);
}

/* Espaciado entre tarjetas */
.q-card {
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

/* Hover para dar feedback visual */
.q-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* Botón de cerrar sesión resaltado */
.q-card.text-negative .q-btn {
  font-weight: bold;
  letter-spacing: 0.5px;
}

/* Espaciado interno del contenedor */
.q-page-container {
  padding: 24px;
}

/* Ajuste del select */
.q-select {
  min-width: 200px;
}

/* Ajustes visuales para modo oscuro si estás usando body.body--dark */
body.body--dark .section-header {
  color: #ffffff;
}

body.body--dark .q-card {
  background-color: #1f1f1f;
  border: 1px solid #2c2c2c;
}

/* Mejor feedback visual para toggles */
.q-toggle__inner {
  transition: background-color 0.3s;
}
</style>
