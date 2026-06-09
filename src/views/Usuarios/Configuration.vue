<template>
  <q-page class="rk-config-page q-pa-lg">
    <!-- Header -->
    <div class="rk-config-header">
      <div class="rk-config-header__icon">
        <q-icon name="settings" />
      </div>
      <div class="rk-config-header__text">
        <h1 class="rk-config-header__title">Configuración</h1>
        <p class="rk-config-header__subtitle">
          Ajusta cómo Recksy se ve y se comporta para ti.
        </p>
      </div>
      <q-btn
        flat
        no-caps
        color="primary"
        icon="person"
        label="Mi perfil"
        :to="{ path: '/profile' }"
        class="rk-config-header__cta"
      />
    </div>

    <div class="rk-config-grid">
      <!-- Apariencia -->
      <section class="rk-card" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="rk-card__head">
          <div class="rk-card__title">
            <q-icon name="palette" />
            <span>Apariencia</span>
          </div>
          <p class="rk-card__hint">Tema visual de la aplicación.</p>
        </div>

        <div class="rk-row">
          <div class="rk-row__info">
            <div class="rk-row__label">Modo oscuro</div>
            <div class="rk-row__desc">Reduce el brillo y mejora la lectura nocturna.</div>
          </div>
          <q-toggle
            v-model="isDark"
            color="primary"
            keep-color
            :icon="isDark ? 'dark_mode' : 'light_mode'"
            @update:model-value="toggleDark"
          />
        </div>
      </section>

      <!-- Idioma -->
      <section class="rk-card" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="rk-card__head">
          <div class="rk-card__title">
            <q-icon name="language" />
            <span>Idioma</span>
          </div>
          <p class="rk-card__hint">Elige el idioma de la interfaz.</p>
        </div>

        <div class="rk-row">
          <div class="rk-row__info">
            <div class="rk-row__label">Idioma de la interfaz</div>
            <div class="rk-row__desc">Se aplica a menús, botones y mensajes.</div>
          </div>
          <q-select
            v-model="idioma"
            :options="opcionesIdioma"
            outlined
            dense
            emit-value
            map-options
            class="rk-row__select"
          />
        </div>
      </section>

      <!-- Notificaciones -->
      <section class="rk-card" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="rk-card__head">
          <div class="rk-card__title">
            <q-icon name="notifications_active" />
            <span>Notificaciones</span>
          </div>
          <p class="rk-card__hint">Cómo te avisamos sobre eventos importantes.</p>
        </div>

        <div class="rk-row">
          <div class="rk-row__info">
            <div class="rk-row__label">Notificaciones del navegador</div>
            <div class="rk-row__desc">Avisos de marcaciones, solicitudes y aprobaciones.</div>
          </div>
          <q-toggle v-model="notificaciones" color="primary" keep-color />
        </div>

        <q-separator class="q-my-md" />

        <div class="rk-row">
          <div class="rk-row__info">
            <div class="rk-row__label">Boletín mensual</div>
            <div class="rk-row__desc">Resumen de novedades del producto y guías.</div>
          </div>
          <q-toggle
            v-model="prefs.newsletter"
            color="primary"
            keep-color
            :disable="prefsSaving"
            @update:model-value="savePref('newsletter', $event)"
          />
        </div>
      </section>

      <!-- Seguridad -->
      <section class="rk-card" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="rk-card__head">
          <div class="rk-card__title">
            <q-icon name="shield" />
            <span>Seguridad</span>
          </div>
          <p class="rk-card__hint">Protege tu cuenta y datos.</p>
        </div>

        <div class="rk-row">
          <div class="rk-row__info">
            <div class="rk-row__label">Verificación en dos pasos</div>
            <div class="rk-row__desc">Refuerza el inicio de sesión con un código adicional.</div>
          </div>
          <q-toggle
            v-model="prefs.twoFA"
            color="primary"
            keep-color
            :disable="prefsSaving"
            @update:model-value="savePref('twoFA', $event)"
          />
        </div>

        <q-separator class="q-my-md" />

        <div class="rk-row">
          <div class="rk-row__info">
            <div class="rk-row__label">Cambiar contraseña</div>
            <div class="rk-row__desc">Recomendado al menos cada 90 días.</div>
          </div>
          <q-btn
            outline
            color="primary"
            icon="lock_reset"
            label="Cambiar"
            @click="cambiarPassword"
          />
        </div>
      </section>

      <!-- Información -->
      <section class="rk-card" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="rk-card__head">
          <div class="rk-card__title">
            <q-icon name="info" />
            <span>Información</span>
          </div>
          <p class="rk-card__hint">Detalles de la versión y documentos legales.</p>
        </div>

        <div class="rk-row">
          <div class="rk-row__info">
            <div class="rk-row__label">Términos y privacidad</div>
            <div class="rk-row__desc">Condiciones de uso y política de datos.</div>
          </div>
          <q-btn
            flat
            no-caps
            color="primary"
            icon="description"
            label="Ver"
            @click="verTerminos"
          />
        </div>

        <q-separator class="q-my-md" />

        <div class="rk-row">
          <div class="rk-row__info">
            <div class="rk-row__label">Versión de la app</div>
            <div class="rk-row__desc">Número de build instalado en este navegador.</div>
          </div>
          <q-badge color="primary" outline class="rk-badge-version">{{ appVersion }}</q-badge>
        </div>
      </section>

      <!-- Cuenta -->
      <section class="rk-card rk-card--danger" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="rk-card__head">
          <div class="rk-card__title rk-card__title--danger">
            <q-icon name="logout" />
            <span>Cuenta</span>
          </div>
          <p class="rk-card__hint">Acciones que terminan tu sesión actual.</p>
        </div>

        <div class="rk-row">
          <div class="rk-row__info">
            <div class="rk-row__label">Cerrar sesión</div>
            <div class="rk-row__desc">Te llevaremos a la pantalla de inicio.</div>
          </div>
          <q-btn
            unelevated
            color="negative"
            icon="logout"
            label="Cerrar sesión"
            :loading="loggingOut"
            @click="confirmLogout"
          />
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Dark, useQuasar } from "quasar";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import secureAxios from "@/utils/secureRequest";

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const themeStore = useThemeStore();

const isDark = ref(false);
const idioma = ref("es");
const notificaciones = ref(true);
const loggingOut = ref(false);
const prefsSaving = ref(false);

const prefs = reactive({
  twoFA: false,
  newsletter: true,
});

const opcionesIdioma = [
  { label: "Español", value: "es" },
  { label: "English", value: "en" },
  { label: "Português", value: "pt" },
  { label: "Deutsch", value: "de" },
];

const appVersion = import.meta?.env?.VITE_APP_VERSION || "1.0.0";

onMounted(async () => {
  // Tema
  const savedDark = localStorage.getItem("darkMode");
  isDark.value = savedDark !== null ? savedDark === "true" : Dark.isActive;

  // Idioma (preferencia local hasta que tengamos endpoint)
  const savedLang = localStorage.getItem("appLang");
  if (savedLang) idioma.value = savedLang;

  // Notificaciones del navegador (preferencia local)
  const savedNotif = localStorage.getItem("notif.browser");
  if (savedNotif !== null) notificaciones.value = savedNotif === "true";

  // Prefs del backend (twoFA, newsletter)
  try {
    const res = await secureAxios.get("/profile/prefs");
    if (res.data?.success) {
      prefs.twoFA = !!res.data.twoFA;
      prefs.newsletter = !!res.data.newsletter;
    }
  } catch {
    // si falla, dejamos los defaults
  }
});

function toggleDark(val) {
  Dark.set(val);
  themeStore.isDark = val;
  localStorage.setItem("darkMode", String(val));
  $q.notify({
    type: "info",
    message: val ? "Modo oscuro activado" : "Modo claro activado",
    icon: val ? "dark_mode" : "light_mode",
    timeout: 1200,
  });
}

async function savePref(key, value) {
  prefsSaving.value = true;
  try {
    await secureAxios.patch("/profile/prefs", { [key]: value });
    $q.notify({ type: "positive", message: "Preferencia guardada", icon: "check", timeout: 1000 });
  } catch (err) {
    // revierte el toggle si falla
    prefs[key] = !value;
    $q.notify({
      type: "negative",
      message: err?.response?.data?.message || "No se pudo guardar la preferencia",
      icon: "error",
    });
  } finally {
    prefsSaving.value = false;
  }
}

function cambiarPassword() {
  $q.notify({
    type: "info",
    message: "Próximamente: cambio de contraseña.",
    icon: "lock_reset",
  });
}

function verTerminos() {
  router.push("/legal/terms");
}

function confirmLogout() {
  $q.dialog({
    title: "Cerrar sesión",
    message: "¿Seguro que quieres salir?",
    cancel: true,
    persistent: true,
  }).onOk(doLogout);
}

async function doLogout() {
  loggingOut.value = true;
  try {
    await auth.logout(true);
  } finally {
    loggingOut.value = false;
    router.replace("/login");
  }
}
</script>

<style scoped>
.rk-config-page {
  max-width: 1100px;
  margin: 0 auto;
}

/* ===== Header ===== */
.rk-config-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.rk-config-header__icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.35);
  flex-shrink: 0;
}

.rk-config-header__icon .q-icon {
  font-size: 28px;
  color: #fff;
}

.rk-config-header__text {
  flex: 1;
  min-width: 200px;
}

.rk-config-header__title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.2px;
  color: var(--text-primary);
}

.rk-config-header__subtitle {
  margin: 4px 0 0;
  font-size: 0.92rem;
  color: var(--text-secondary);
}

.rk-config-header__cta {
  font-weight: 700;
}

/* ===== Grid ===== */
.rk-config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 18px;
}

/* ===== Cards ===== */
.rk-card {
  background: var(--card-background, #fff);
  border: 1px solid var(--border-color, rgba(15, 23, 42, 0.08));
  border-radius: 16px;
  padding: 20px 22px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.rk-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
  transform: translateY(-1px);
}

.rk-card.is-dark {
  background: var(--card-background);
  border-color: var(--border-color);
}

.rk-card--danger {
  border-color: rgba(239, 68, 68, 0.25);
}

.rk-card--danger.is-dark {
  border-color: rgba(239, 68, 68, 0.35);
}

.rk-card__head {
  margin-bottom: 14px;
}

.rk-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.rk-card__title .q-icon {
  color: #06b6d4;
  font-size: 22px;
}

.rk-card__title--danger .q-icon {
  color: #ef4444;
}

.rk-card__hint {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* ===== Rows ===== */
.rk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.rk-row__info {
  flex: 1;
  min-width: 180px;
}

.rk-row__label {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.rk-row__desc {
  font-size: 0.83rem;
  color: var(--text-muted);
  margin-top: 2px;
  line-height: 1.4;
}

.rk-row__select {
  min-width: 200px;
}

.rk-badge-version {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.4px;
}

@media (max-width: 600px) {
  .rk-config-grid {
    grid-template-columns: 1fr;
  }
  .rk-config-header__title {
    font-size: 1.35rem;
  }
}
</style>
