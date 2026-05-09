<template>
  <q-btn
    round
    flat
    dense
    aria-label="Menú de usuario"
    :loading="loggingOut"
    @click="toggleMenu"
  >
    <q-avatar size="28px" color="primary" text-color="white">
      <img
        v-if="avatarSrc && !avatarBroken"
        :src="avatarSrc"
        alt="Avatar"
        referrerpolicy="no-referrer"
        @error="avatarBroken = true"
      />
      <span v-else>{{ initials(user?.firstName, user?.lastName) }}</span>
    </q-avatar>

    <q-menu
      ref="menuRef"
      :no-parent-event="true"
      anchor="bottom right"
      self="top right"
      :offset="[0, 8]"
      transition-show="jump-down"
      transition-hide="jump-up"
      @show="onShow"
      @hide="onHide"
    >
      <q-list style="min-width: 260px" class="q-pa-xs">
        <!-- Header -->
        <div class="row items-center q-pa-sm q-gutter-sm">
          <q-avatar size="42px" color="primary" text-color="white">
            <img
              v-if="avatarSrc && !avatarBroken"
              :src="avatarSrc"
              alt="Avatar"
              referrerpolicy="no-referrer"
              @error="avatarBroken = true"
            />
            <span v-else>{{ initials(user?.firstName, user?.lastName) }}</span>
          </q-avatar>
          <div class="col">
            <div class="text-body2 text-weight-medium ellipsis">
              {{ fullName }}
            </div>
            <div class="text-caption text-grey-7 ellipsis">
              {{ user?.email || "—" }}
            </div>
            <div class="row items-center q-gutter-xs q-mt-xs">
              <q-badge :color="roleColor(user?.role)" outline>{{
                roleNice(user?.role)
              }}</q-badge>
              <q-chip v-if="companyName" dense square icon="apartment">{{
                companyName
              }}</q-chip>
            </div>
          </div>
        </div>

        <q-separator spaced />

        <q-item clickable v-ripple @click="goToPerfil">
          <q-item-section avatar
            ><q-icon name="account_circle"
          /></q-item-section>
          <q-item-section>Perfil</q-item-section>
          <q-item-section side><q-icon name="chevron_right" /></q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="goToConfig">
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>Configuración</q-item-section>
          <q-item-section side><q-icon name="tune" /></q-item-section>
        </q-item>

        <q-item
          v-if="canSwitchEmpresa"
          clickable
          v-ripple
          @click="goToEmpresas"
        >
          <q-item-section avatar><q-icon name="business" /></q-item-section>
          <q-item-section>Mis Empresas</q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item clickable v-ripple @click="copyEmail">
          <q-item-section avatar><q-icon name="content_copy" /></q-item-section>
          <q-item-section>Copiar correo</q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item clickable v-ripple :disable="loggingOut" @click="confirmLogout">
          <q-item-section avatar>
            <q-icon :name="loggingOut ? 'hourglass_empty' : 'logout'" />
          </q-item-section>
          <q-item-section>
            <div class="row items-center no-wrap">
              <span class="q-mr-sm">{{
                loggingOut ? "Cerrando…" : "Cerrar sesión"
              }}</span>
              <q-spinner v-if="loggingOut" size="16px" />
            </div>
          </q-item-section>
        </q-item>

        <q-item-label header class="text-caption text-grey-6 q-mt-xs q-pt-none">
          {{ footerNote }}
        </q-item-label>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useQuasar, copyToClipboard as quasarCopy } from "quasar";

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();

const loggingOut = ref(false);
const menuRef = ref(null); // 👈 control directo del menú
const avatarBroken = ref(false);
let lastEvt = null; // guarda el evento click para posicionamiento correcto

/* Datos */
const user = computed(() => auth.user || null);
const fullName = computed(() => {
  const fn = user.value?.firstName || "";
  const ln = user.value?.lastName || "";
  return (fn + " " + ln).trim() || "Usuario";
});
const companyName = computed(
  () => user.value?.company?.name || user.value?.companyName || ""
);

// Misma foto que la app móvil: avatarUrl viene de /profile/me (S3 firmado).
// Fallback a profilePicture si ya es una URL http directa.
const avatarSrc = computed(() => {
  const u = user.value;
  if (!u) return null;
  if (u.avatarUrl) return u.avatarUrl;
  const pic = u.profilePicture;
  if (pic && /^https?:\/\//i.test(pic)) return pic;
  return null;
});

const canSwitchEmpresa = computed(() => {
  const role = user.value?.role;
  return role === "admin" || role === "company";
});

// Reintenta resolver el avatarUrl si aún no está cargado al abrir el menú
// (p. ej. tras login el fetch corre en background).
watch(user, (u) => {
  if (u && !u.avatarUrl) auth.fetchAvatarUrl?.().catch(() => {});
}, { immediate: true });

/* Abrir/cerrar de forma robusta */
function toggleMenu(ev) {
  if (loggingOut.value) return;
  lastEvt = ev;
  if (menuRef.value?.showing) menuRef.value.hide();
  else menuRef.value?.toggle(ev); // usa el evento como ancla
}
function onShow() {
  // evita cierres “fugaces” si hay clics globales
  setTimeout(() => {
    // foco al primer item si quieres: menuRef.value?.contentEl?.querySelector('.q-item')?.focus()
  }, 0);
}
function onHide() {
  lastEvt = null;
}

/* Navegación */
function goToPerfil() {
  menuRef.value?.hide();
  router.push("/profile");
}
function goToConfig() {
  menuRef.value?.hide();
  router.push("/configuration");
}
function goToEmpresas() {
  menuRef.value?.hide();
  router.push("/admin/companies");
}

/* Logout */
function confirmLogout() {
  $q.dialog({
    title: "Cerrar sesión",
    message: "¿Seguro que quieres salir?",
    cancel: true,
    persistent: true,
  }).onOk(doLogout);
}
async function doLogout() {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await auth.logout(true);
    await router.replace("/login");
  } catch (e) {
    await router.replace("/login");
  } finally {
    loggingOut.value = false;
    menuRef.value?.hide();
  }
}

/* Helpers */
function initials(fn = "", ln = "") {
  return ((fn?.[0] || "") + (ln?.[0] || "") || "U").toUpperCase();
}
function roleNice(r) {
  return (
    {
      admin: "Admin",
      company: "Empresa",
      employee: "Empleado",
      supervisor: "Supervisor",
    }[r] || "—"
  );
}
function roleColor(r) {
  return r === "admin"
    ? "deep-purple-5"
    : r === "company"
    ? "indigo-6"
    : r === "employee"
    ? "teal-6"
    : "grey-6";
}
async function copyEmail() {
  const text = user.value?.email;
  if (!text) return;
  try {
    await quasarCopy(text);
    $q.notify({
      message: "Correo copiado",
      color: "positive",
      icon: "check",
      timeout: 900,
    });
  } catch {
    $q.notify({ message: "No se pudo copiar", color: "negative" });
  }
}

/* Atajo teclado: Ctrl/Cmd + Shift + L para logout */
function keyHandler(e) {
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const meta = isMac ? e.metaKey : e.ctrlKey;
  if (meta && e.shiftKey && (e.key === "L" || e.key === "l")) {
    e.preventDefault();
    confirmLogout();
  }
}
onMounted(() => window.addEventListener("keydown", keyHandler));
onBeforeUnmount(() => window.removeEventListener("keydown", keyHandler));

const footerNote = computed(() => {
  const v = import.meta?.env?.VITE_APP_VERSION || "";
  return v ? `Versión ${v}` : " ";
});
</script>

<style scoped>
.q-item {
  min-height: 36px;
}
</style>
