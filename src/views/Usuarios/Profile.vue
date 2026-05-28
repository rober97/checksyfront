<template>
  <q-page class="rk-profile-page q-pa-lg">
    <!-- Hero -->
    <div class="rk-profile-hero" :class="{ 'is-dark': $q.dark.isActive }">
      <div class="rk-profile-hero__bg"></div>

      <div class="rk-profile-hero__content">
        <div class="rk-profile-hero__avatar-wrap">
          <q-avatar
            size="120px"
            color="primary"
            text-color="white"
            class="rk-profile-hero__avatar"
          >
            <img
              v-if="avatarSrc"
              :src="avatarSrc"
              alt="Avatar"
              referrerpolicy="no-referrer"
              @error="onAvatarError"
            />
            <span v-else class="rk-profile-hero__initials">{{ initials }}</span>
          </q-avatar>

          <button
            class="rk-profile-hero__upload-btn"
            :disabled="uploadingAvatar"
            @click="pickAvatar"
            type="button"
            aria-label="Cambiar foto"
          >
            <q-spinner v-if="uploadingAvatar" size="18px" color="white" />
            <q-icon v-else name="photo_camera" />
            <q-tooltip>Cambiar foto</q-tooltip>
          </button>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="rk-hidden-input"
            @change="onAvatarSelected"
          />
        </div>

        <div class="rk-profile-hero__info">
          <h1 class="rk-profile-hero__name">{{ fullName }}</h1>
          <p class="rk-profile-hero__email">
            <q-icon name="mail" size="16px" />
            {{ user?.email || "—" }}
          </p>
          <div class="rk-profile-hero__chips">
            <q-badge
              :color="roleColor"
              class="rk-profile-hero__chip"
              outline
            >
              <q-icon name="badge" size="12px" class="q-mr-xs" />
              {{ roleNice }}
            </q-badge>
            <q-badge
              v-if="companyName"
              color="primary"
              outline
              class="rk-profile-hero__chip"
            >
              <q-icon name="apartment" size="12px" class="q-mr-xs" />
              {{ companyName }}
            </q-badge>
          </div>
        </div>

        <div class="rk-profile-hero__cta">
          <q-btn
            unelevated
            color="primary"
            icon="edit"
            label="Editar"
            class="rk-cta-btn"
            v-if="!editing"
            @click="startEdit"
          />
          <template v-else>
            <q-btn
              flat
              color="grey-7"
              label="Cancelar"
              :disable="saving"
              @click="cancelEdit"
            />
            <q-btn
              unelevated
              color="primary"
              icon="save"
              label="Guardar"
              :loading="saving"
              @click="saveProfile"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="rk-stats-grid">
      <div class="rk-stat-card" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="rk-stat-card__icon rk-stat-card__icon--cyan">
          <q-icon name="check_circle" />
        </div>
        <div class="rk-stat-card__body">
          <div class="rk-stat-card__label">Asistencia (30 días)</div>
          <div class="rk-stat-card__value">
            <q-spinner v-if="statsLoading" size="20px" color="primary" />
            <template v-else>{{ stats.asistenciaPct || "—" }}</template>
          </div>
        </div>
      </div>

      <div class="rk-stat-card" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="rk-stat-card__icon rk-stat-card__icon--violet">
          <q-icon name="assignment" />
        </div>
        <div class="rk-stat-card__body">
          <div class="rk-stat-card__label">Solicitudes</div>
          <div class="rk-stat-card__value">
            <q-spinner v-if="statsLoading" size="20px" color="primary" />
            <template v-else>{{ stats.solicitudes ?? 0 }}</template>
          </div>
        </div>
      </div>

      <div class="rk-stat-card" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="rk-stat-card__icon rk-stat-card__icon--amber">
          <q-icon name="beach_access" />
        </div>
        <div class="rk-stat-card__body">
          <div class="rk-stat-card__label">Vacaciones</div>
          <div class="rk-stat-card__value">
            <q-spinner v-if="statsLoading" size="20px" color="primary" />
            <template v-else>{{ stats.vacaciones || "0 d" }}</template>
          </div>
        </div>
      </div>
    </div>

    <!-- Personal info -->
    <div class="rk-section-card" :class="{ 'is-dark': $q.dark.isActive }">
      <div class="rk-section-card__header">
        <div class="rk-section-card__title">
          <q-icon name="person" size="20px" />
          <span>Información personal</span>
        </div>
        <p class="rk-section-card__hint">
          {{ editing ? "Edita tus datos y guarda los cambios." : "Estos son los datos visibles para tu empresa." }}
        </p>
      </div>

      <div class="rk-section-card__body">
        <div class="rk-grid-2">
          <q-input
            v-model="form.firstName"
            label="Nombre"
            outlined
            dense
            :readonly="!editing"
            :bg-color="editing ? undefined : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
          >
            <template #prepend><q-icon name="person" /></template>
          </q-input>
          <q-input
            v-model="form.lastName"
            label="Apellido"
            outlined
            dense
            :readonly="!editing"
            :bg-color="editing ? undefined : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
          >
            <template #prepend><q-icon name="badge" /></template>
          </q-input>

          <q-input
            v-model="form.email"
            label="Email"
            outlined
            dense
            readonly
            :bg-color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
            hint="El correo no se puede modificar desde aquí."
          >
            <template #prepend><q-icon name="mail" /></template>
          </q-input>
          <q-input
            v-model="form.phone"
            label="Teléfono"
            outlined
            dense
            :readonly="!editing"
            :bg-color="editing ? undefined : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
          >
            <template #prepend><q-icon name="phone" /></template>
          </q-input>

          <q-input
            v-model="form.username"
            label="Usuario"
            outlined
            dense
            :readonly="!editing"
            :bg-color="editing ? undefined : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
          >
            <template #prepend><q-icon name="alternate_email" /></template>
          </q-input>
          <q-input
            v-model="form.title"
            label="Cargo"
            outlined
            dense
            :readonly="!editing"
            :bg-color="editing ? undefined : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
          >
            <template #prepend><q-icon name="work" /></template>
          </q-input>

          <q-input
            v-model="form.location"
            label="Ubicación"
            outlined
            dense
            :readonly="!editing"
            :bg-color="editing ? undefined : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
          >
            <template #prepend><q-icon name="place" /></template>
          </q-input>
          <q-select
            v-model="form.lang"
            :options="langOptions"
            emit-value
            map-options
            label="Idioma"
            outlined
            dense
            :readonly="!editing"
            :bg-color="editing ? undefined : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
          >
            <template #prepend><q-icon name="language" /></template>
          </q-select>
        </div>
      </div>
    </div>

    <!-- Account meta -->
    <div class="rk-section-card" :class="{ 'is-dark': $q.dark.isActive }">
      <div class="rk-section-card__header">
        <div class="rk-section-card__title">
          <q-icon name="manage_accounts" size="20px" />
          <span>Cuenta</span>
        </div>
        <p class="rk-section-card__hint">
          Acciones rápidas vinculadas a tu cuenta.
        </p>
      </div>

      <div class="rk-section-card__body">
        <div class="rk-action-row">
          <div class="rk-action-row__info">
            <div class="rk-action-row__title">Preferencias y configuración</div>
            <div class="rk-action-row__desc">Tema, idioma, notificaciones, contraseña.</div>
          </div>
          <q-btn
            outline
            color="primary"
            icon="settings"
            label="Abrir configuración"
            :to="{ path: '/configuration' }"
          />
        </div>

        <q-separator class="q-my-md" />

        <div class="rk-action-row">
          <div class="rk-action-row__info">
            <div class="rk-action-row__title">Cerrar sesión</div>
            <div class="rk-action-row__desc">Termina tu sesión en este navegador.</div>
          </div>
          <q-btn
            outline
            color="negative"
            icon="logout"
            label="Cerrar sesión"
            :loading="loggingOut"
            @click="confirmLogout"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "@/stores/authStore";
import secureAxios from "@/utils/secureRequest";

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();

const fileInputRef = ref(null);
const avatarBroken = ref(false);
const uploadingAvatar = ref(false);
const editing = ref(false);
const saving = ref(false);
const loggingOut = ref(false);

const stats = reactive({
  asistenciaPct: "",
  solicitudes: 0,
  vacaciones: "",
});
const statsLoading = ref(false);

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  username: "",
  title: "",
  location: "",
  lang: "es",
});

const langOptions = [
  { label: "Español", value: "es" },
  { label: "English", value: "en" },
  { label: "Português", value: "pt" },
];

const user = computed(() => auth.user || null);

const fullName = computed(() => {
  const fn = user.value?.firstName || "";
  const ln = user.value?.lastName || "";
  return (fn + " " + ln).trim() || "Usuario";
});

const initials = computed(() => {
  const fn = user.value?.firstName?.[0] || "";
  const ln = user.value?.lastName?.[0] || "";
  return ((fn + ln) || "U").toUpperCase();
});

const companyName = computed(
  () => user.value?.company?.name || user.value?.companyName || ""
);

const avatarSrc = computed(() => {
  if (avatarBroken.value) return null;
  const u = user.value;
  if (!u) return null;
  if (u.avatarUrl) return u.avatarUrl;
  const pic = u.profilePicture;
  if (pic && /^https?:\/\//i.test(pic)) return pic;
  return null;
});

const roleNice = computed(() => {
  const r = String(user.value?.role || "").toLowerCase();
  return (
    {
      superadmin: "Superadmin",
      admin: "Admin",
      admin_rrhh: "Admin RR.HH.",
      company: "Empresa",
      employee: "Empleado",
      dt_inspector: "Fiscalizador DT",
    }[r] || "Usuario"
  );
});

const roleColor = computed(() => {
  const r = String(user.value?.role || "").toLowerCase();
  return (
    {
      superadmin: "deep-purple-5",
      admin: "deep-purple-5",
      admin_rrhh: "indigo-6",
      company: "indigo-6",
      employee: "teal-6",
      dt_inspector: "amber-9",
    }[r] || "grey-6"
  );
});

function onAvatarError() {
  avatarBroken.value = true;
}

watch(user, (u) => {
  if (!u) return;
  // Sólo refrescamos el form fuera del modo edición para no pisar lo que el
  // usuario está escribiendo.
  if (!editing.value) hydrateForm(u);
}, { immediate: true });

function hydrateForm(u) {
  form.firstName = u.firstName || "";
  form.lastName = u.lastName || "";
  form.email = u.email || "";
  form.phone = u.phone || "";
  form.username = u.username || "";
  form.title = u.title || "";
  form.location = u.location || "";
  form.lang = u.lang || "es";
}

function startEdit() {
  hydrateForm(user.value || {});
  editing.value = true;
}

function cancelEdit() {
  hydrateForm(user.value || {});
  editing.value = false;
}

async function saveProfile() {
  saving.value = true;
  try {
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      username: form.username,
      title: form.title,
      location: form.location,
      lang: form.lang,
    };
    const res = await secureAxios.patch("/profile", payload);
    if (res.data?.success) {
      // Patcheamos el user del auth store con los valores enviados.
      // /profile devuelve `name` (concatenado), pero ya tenemos el detalle.
      auth.user = { ...auth.user, ...payload };
      editing.value = false;
      $q.notify({
        type: "positive",
        message: "Perfil actualizado",
        icon: "check",
      });
    } else {
      throw new Error(res.data?.message || "No se pudo guardar");
    }
  } catch (err) {
    $q.notify({
      type: "negative",
      message: err?.response?.data?.message || err?.message || "Error al guardar",
      icon: "error",
    });
  } finally {
    saving.value = false;
  }
}

function pickAvatar() {
  fileInputRef.value?.click();
}

async function onAvatarSelected(ev) {
  const file = ev.target?.files?.[0];
  if (!file) return;
  // reset input para permitir re-elegir el mismo archivo
  ev.target.value = "";

  if (file.size > 5 * 1024 * 1024) {
    $q.notify({ type: "negative", message: "La imagen no debe superar 5MB" });
    return;
  }

  uploadingAvatar.value = true;
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await secureAxios.post("/profile/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const url = res.data?.url;
    if (url) {
      avatarBroken.value = false;
      auth.user = { ...auth.user, avatarUrl: url };
      $q.notify({ type: "positive", message: "Foto actualizada", icon: "check" });
    } else {
      throw new Error(res.data?.message || "No se pudo subir la imagen");
    }
  } catch (err) {
    $q.notify({
      type: "negative",
      message: err?.response?.data?.message || err?.message || "Error al subir avatar",
      icon: "error",
    });
  } finally {
    uploadingAvatar.value = false;
  }
}

async function loadStats() {
  statsLoading.value = true;
  try {
    const res = await secureAxios.get("/profile/stats");
    if (res.data?.success !== false) {
      stats.asistenciaPct = res.data?.asistenciaPct ?? "—";
      stats.solicitudes = res.data?.solicitudes ?? 0;
      stats.vacaciones = res.data?.vacaciones ?? "0 d";
    }
  } catch {
    // silencioso: si falla, dejamos los placeholders
  } finally {
    statsLoading.value = false;
  }
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

onMounted(() => {
  if (user.value) hydrateForm(user.value);
  loadStats();
  // Asegura avatarUrl actualizado
  if (!user.value?.avatarUrl) auth.fetchAvatarUrl?.().catch(() => {});
});
</script>

<style scoped>
.rk-profile-page {
  max-width: 1100px;
  margin: 0 auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.rk-profile-page::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.rk-hidden-input {
  display: none;
}

/* ===== Hero ===== */
.rk-profile-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
}

.rk-profile-hero.is-dark {
  background: #0f172a;
  border-color: rgba(255, 255, 255, 0.08);
}

.rk-profile-hero__bg {
  position: absolute;
  inset: 0;
  height: 140px;
  background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 60%, #6366f1 100%);
}

.rk-profile-hero__content {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: 100px 28px 24px;
  flex-wrap: wrap;
}

.rk-profile-hero__avatar-wrap {
  position: relative;
}

.rk-profile-hero__avatar {
  border: 4px solid #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.rk-profile-hero.is-dark .rk-profile-hero__avatar {
  border-color: #0f172a;
}

.rk-profile-hero__initials {
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.rk-profile-hero__upload-btn {
  position: absolute;
  right: -2px;
  bottom: 6px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  color: #fff;
  border: 3px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 6px 14px rgba(6, 182, 212, 0.45);
}

.rk-profile-hero.is-dark .rk-profile-hero__upload-btn {
  border-color: #0f172a;
}

.rk-profile-hero__upload-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
}

.rk-profile-hero__upload-btn:disabled {
  cursor: progress;
}

.rk-profile-hero__upload-btn .q-icon {
  font-size: 18px;
}

.rk-profile-hero__info {
  flex: 1;
  min-width: 220px;
}

.rk-profile-hero__name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.95);
  line-height: 1.2;
}

.rk-profile-hero.is-dark .rk-profile-hero__name {
  color: rgba(255, 255, 255, 0.95);
}

.rk-profile-hero__email {
  margin: 6px 0 12px;
  font-size: 0.95rem;
  color: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  gap: 6px;
}

.rk-profile-hero.is-dark .rk-profile-hero__email {
  color: rgba(255, 255, 255, 0.65);
}

.rk-profile-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rk-profile-hero__chip {
  padding: 6px 10px;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.3px;
  display: inline-flex;
  align-items: center;
}

.rk-profile-hero__cta {
  display: flex;
  gap: 8px;
  align-self: flex-end;
  flex-wrap: wrap;
}

.rk-cta-btn {
  font-weight: 700;
}

/* ===== Stats grid ===== */
.rk-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.rk-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.rk-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
}

.rk-stat-card.is-dark {
  background: #0f172a;
  border-color: rgba(255, 255, 255, 0.08);
}

.rk-stat-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rk-stat-card__icon .q-icon {
  font-size: 24px;
  color: #fff;
}

.rk-stat-card__icon--cyan {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
}

.rk-stat-card__icon--violet {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
}

.rk-stat-card__icon--amber {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.rk-stat-card__label {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.rk-stat-card.is-dark .rk-stat-card__label {
  color: rgba(255, 255, 255, 0.6);
}

.rk-stat-card__value {
  font-size: 1.5rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.92);
  line-height: 1.2;
}

.rk-stat-card.is-dark .rk-stat-card__value {
  color: rgba(255, 255, 255, 0.92);
}

/* ===== Section cards ===== */
.rk-section-card {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  margin-bottom: 20px;
  overflow: hidden;
}

.rk-section-card.is-dark {
  background: #0f172a;
  border-color: rgba(255, 255, 255, 0.08);
}

.rk-section-card__header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.rk-section-card.is-dark .rk-section-card__header {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

.rk-section-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.92);
}

.rk-section-card.is-dark .rk-section-card__title {
  color: rgba(255, 255, 255, 0.92);
}

.rk-section-card__title .q-icon {
  color: #06b6d4;
}

.rk-section-card__hint {
  margin: 6px 0 0;
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.55);
}

.rk-section-card.is-dark .rk-section-card__hint {
  color: rgba(255, 255, 255, 0.55);
}

.rk-section-card__body {
  padding: 22px 24px;
}

/* ===== Grid 2-col ===== */
.rk-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px 16px;
}

/* ===== Action rows ===== */
.rk-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.rk-action-row__title {
  font-size: 0.98rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.9);
}

.rk-section-card.is-dark .rk-action-row__title {
  color: rgba(255, 255, 255, 0.9);
}

.rk-action-row__desc {
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.55);
  margin-top: 2px;
}

.rk-section-card.is-dark .rk-action-row__desc {
  color: rgba(255, 255, 255, 0.55);
}

@media (max-width: 600px) {
  .rk-profile-hero__content {
    padding: 90px 18px 18px;
  }
  .rk-profile-hero__name {
    font-size: 1.45rem;
  }
  .rk-section-card__body {
    padding: 18px;
  }
}
</style>
