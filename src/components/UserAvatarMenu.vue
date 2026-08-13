<template>
  <button
    type="button"
    class="rk-um-trigger"
    :class="{ 'is-open': menuOpen, 'is-busy': loggingOut }"
    aria-label="Menú de usuario"
    @click="toggleMenu"
  >
    <span class="rk-um-ring">
      <span class="rk-um-face">
        <img
          v-if="avatarSrc && !avatarBroken"
          :src="avatarSrc"
          alt="Avatar"
          referrerpolicy="no-referrer"
          @error="avatarBroken = true"
        />
        <span v-else class="rk-um-initials">{{
          initials(user?.firstName, user?.lastName)
        }}</span>
      </span>
    </span>
    <span class="rk-um-pulse" aria-hidden="true"></span>
    <q-spinner v-if="loggingOut" class="rk-um-busy" size="18px" />

    <q-menu
      ref="menuRef"
      :no-parent-event="true"
      anchor="bottom right"
      self="top right"
      :offset="[0, 12]"
      transition-show="jump-down"
      transition-hide="jump-up"
      class="rk-um-menu"
      @show="menuOpen = true"
      @hide="menuOpen = false"
    >
      <div class="rk-um-panel">
        <!-- Identidad -->
        <header class="rk-um-head">
          <span class="rk-um-glow" aria-hidden="true"></span>

          <div class="rk-um-identity">
            <span class="rk-um-ring rk-um-ring--lg">
              <span class="rk-um-face">
                <img
                  v-if="avatarSrc && !avatarBroken"
                  :src="avatarSrc"
                  alt="Avatar"
                  referrerpolicy="no-referrer"
                  @error="avatarBroken = true"
                />
                <span v-else class="rk-um-initials">{{
                  initials(user?.firstName, user?.lastName)
                }}</span>
              </span>
            </span>

            <div class="rk-um-meta">
              <p class="rk-um-name">{{ fullName }}</p>
              <div class="rk-um-mail">
                <span class="rk-um-mail-text">{{ user?.email || "—" }}</span>
                <button
                  v-if="user?.email"
                  type="button"
                  class="rk-um-copy"
                  aria-label="Copiar correo"
                  @click.stop="copyEmail"
                >
                  <q-icon :name="copied ? 'check' : 'content_copy'" />
                  <q-tooltip anchor="top middle" self="bottom middle">
                    {{ copied ? "Copiado" : "Copiar correo" }}
                  </q-tooltip>
                </button>
              </div>
            </div>
          </div>

          <div class="rk-um-tags">
            <span class="rk-um-role">{{ roleNice(user?.role) }}</span>
            <span v-if="companyName" class="rk-um-company">
              <q-icon name="apartment" />
              <span class="ellipsis">{{ companyName }}</span>
            </span>
          </div>
        </header>

        <!-- Acciones -->
        <nav class="rk-um-body">
          <button type="button" class="rk-um-item" @click="goToPerfil">
            <span class="rk-um-ico"><q-icon name="person" /></span>
            <span class="rk-um-label">Perfil</span>
            <q-icon class="rk-um-arrow" name="arrow_forward" />
          </button>

          <button type="button" class="rk-um-item" @click="goToConfig">
            <span class="rk-um-ico"><q-icon name="tune" /></span>
            <span class="rk-um-label">Configuración</span>
            <q-icon class="rk-um-arrow" name="arrow_forward" />
          </button>

          <button
            v-if="canSwitchEmpresa"
            type="button"
            class="rk-um-item"
            @click="goToEmpresas"
          >
            <span class="rk-um-ico"><q-icon name="business" /></span>
            <span class="rk-um-label">Mis empresas</span>
            <q-icon class="rk-um-arrow" name="arrow_forward" />
          </button>

          <span class="rk-um-sep" aria-hidden="true"></span>

          <button
            type="button"
            class="rk-um-item is-danger"
            :disabled="loggingOut"
            @click="confirmLogout"
          >
            <span class="rk-um-ico">
              <q-spinner v-if="loggingOut" size="16px" />
              <q-icon v-else name="logout" />
            </span>
            <span class="rk-um-label">{{
              loggingOut ? "Cerrando sesión…" : "Cerrar sesión"
            }}</span>
            <span class="rk-um-kbd">{{ shortcutHint }}</span>
          </button>
        </nav>

        <footer v-if="footerNote" class="rk-um-foot">
          <span class="rk-um-dot" aria-hidden="true"></span>
          {{ footerNote }}
        </footer>
      </div>
    </q-menu>
  </button>
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
const menuOpen = ref(false);
const avatarBroken = ref(false);
const copied = ref(false);
let copiedTimer = null;

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
  if (menuRef.value?.showing) menuRef.value.hide();
  else menuRef.value?.toggle(ev); // usa el evento como ancla
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

// Mismas etiquetas legibles que el Drawer: el código interno no se muestra.
const ROLE_LABELS = {
  superadmin: "Superadministrador",
  admin_rrhh: "Administrador RR.HH.",
  admin: "Administrador",
  company: "Empresa",
  supervisor: "Supervisor",
  employee: "Colaborador",
  dt_inspector: "Fiscalizador DT",
};
function roleNice(r) {
  return ROLE_LABELS[String(r || "").toLowerCase()] || "Usuario";
}

async function copyEmail() {
  const text = user.value?.email;
  if (!text) return;
  try {
    await quasarCopy(text);
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copied.value = false), 1600);
  } catch {
    $q.notify({ message: "No se pudo copiar", color: "negative" });
  }
}

/* Atajo teclado: Ctrl/Cmd + Shift + L para logout */
const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const shortcutHint = computed(() => (isMac ? "⇧⌘L" : "Ctrl ⇧ L"));
function keyHandler(e) {
  const meta = isMac ? e.metaKey : e.ctrlKey;
  if (meta && e.shiftKey && (e.key === "L" || e.key === "l")) {
    e.preventDefault();
    confirmLogout();
  }
}
onMounted(() => window.addEventListener("keydown", keyHandler));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", keyHandler);
  clearTimeout(copiedTimer);
});

const footerNote = computed(() => {
  const v = import.meta?.env?.VITE_APP_VERSION || "";
  return v ? `Versión ${v}` : "";
});
</script>

<style scoped>
/* =====================================================================
   Tokens locales. El q-menu se teletransporta a <body>, así que aquí
   sólo se consumen variables globales (tokens.css), nunca las del header.
===================================================================== */
.rk-um-trigger,
.rk-um-panel {
  --um-surface: rgba(255, 255, 255, 0.94);
  --um-soft: color-mix(in srgb, var(--color-primary, #0ca9c4) 8%, transparent);
  --um-soft-strong: color-mix(in srgb, var(--color-primary, #0ca9c4) 14%, transparent);
  --um-border: color-mix(in srgb, var(--color-primary, #0ca9c4) 18%, transparent);
  --um-hairline: color-mix(in srgb, var(--color-primary, #0ca9c4) 12%, transparent);
  --um-ink: rgba(15, 23, 42, 0.95);
  --um-ink-soft: rgba(15, 23, 42, 0.62);
  --um-ink-muted: rgba(15, 23, 42, 0.45);
  --um-brand: linear-gradient(135deg, var(--color-primary, #0ca9c4), var(--color-accent, #0893aa));
  font-family: "Sora", "DM Sans", -apple-system, sans-serif;
}

:global(body.body--dark) .rk-um-trigger,
:global(body.body--dark) .rk-um-panel {
  --um-surface: rgba(16, 20, 28, 0.96);
  --um-soft: color-mix(in srgb, var(--color-primary, #0ca9c4) 12%, transparent);
  --um-soft-strong: color-mix(in srgb, var(--color-primary, #0ca9c4) 20%, transparent);
  --um-border: color-mix(in srgb, var(--color-primary, #0ca9c4) 26%, transparent);
  --um-hairline: rgba(255, 255, 255, 0.08);
  --um-ink: rgba(255, 255, 255, 0.95);
  --um-ink-soft: rgba(255, 255, 255, 0.66);
  --um-ink-muted: rgba(255, 255, 255, 0.42);
}

/* ============================ Avatar (trigger) ====================== */
.rk-um-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  transition: transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.rk-um-trigger:hover {
  transform: translateY(-1px) scale(1.04);
}
.rk-um-trigger:active {
  transform: scale(0.96);
}
.rk-um-trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--um-soft-strong);
}
.rk-um-trigger.is-busy {
  cursor: progress;
}

/* Anillo degradado: borde vivo + separación con el fondo */
.rk-um-ring {
  position: relative;
  display: block;
  padding: 2px;
  border-radius: 50%;
  background: var(--um-brand);
  box-shadow: 0 4px 14px rgba(12, 169, 196, 0.32);
  transition: box-shadow 0.3s ease, background 0.3s ease;
}

.rk-um-trigger:hover .rk-um-ring,
.rk-um-trigger.is-open .rk-um-ring {
  box-shadow: 0 6px 20px rgba(12, 169, 196, 0.48);
}

.rk-um-face {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--um-brand);
  border: 2px solid var(--um-surface);
}

.rk-um-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.rk-um-initials {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}

/* Halo que respira sólo con el menú abierto */
.rk-um-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid var(--color-primary, #0ca9c4);
  opacity: 0;
  transform: scale(0.85);
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.rk-um-trigger.is-open .rk-um-pulse {
  opacity: 0.55;
  transform: scale(1);
}

.rk-um-busy {
  position: absolute;
  inset: 0;
  margin: auto;
  color: #fff;
}
.rk-um-trigger.is-busy .rk-um-face {
  filter: brightness(0.55);
}

/* ============================== Panel =============================== */
/* Quita el fondo/sombra cuadrada que Quasar pinta bajo el popover */
.rk-um-menu {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 20px;
  overflow: visible;
}

.rk-um-panel {
  width: 300px;
  max-width: calc(100vw - 24px);
  border-radius: 20px;
  background: var(--um-surface);
  backdrop-filter: saturate(1.3) blur(20px);
  border: 1.5px solid var(--um-border);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  color: var(--um-ink);
}

:global(body.body--dark) .rk-um-panel {
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.6);
}

/* ------------------------------ Cabecera ---------------------------- */
.rk-um-head {
  position: relative;
  padding: 18px 18px 14px;
  background: linear-gradient(160deg, var(--um-soft), transparent 70%);
  border-bottom: 1.5px solid var(--um-hairline);
  overflow: hidden;
}

/* Resplandor de marca en la esquina, da profundidad sin ruido */
.rk-um-glow {
  position: absolute;
  top: -60px;
  right: -40px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-primary, #0ca9c4) 32%, transparent),
    transparent 70%
  );
  filter: blur(12px);
  pointer-events: none;
}

.rk-um-identity {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.rk-um-ring--lg {
  padding: 2.5px;
  flex-shrink: 0;
}
.rk-um-ring--lg .rk-um-face {
  width: 46px;
  height: 46px;
}
.rk-um-ring--lg .rk-um-initials {
  font-size: 1rem;
}

.rk-um-meta {
  min-width: 0;
  flex: 1;
}

.rk-um-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--um-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rk-um-mail {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.rk-um-mail-text {
  font-size: 0.76rem;
  color: var(--um-ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rk-um-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--um-ink-muted);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}
.rk-um-copy .q-icon {
  font-size: 13px;
}
.rk-um-head:hover .rk-um-copy,
.rk-um-copy:focus-visible {
  opacity: 1;
}
.rk-um-copy:hover {
  background: var(--um-soft-strong);
  color: var(--color-primary, #0ca9c4);
}

.rk-um-tags {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  min-width: 0;
}

.rk-um-role {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--um-brand);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(12, 169, 196, 0.3);
}

.rk-um-company {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--um-soft);
  border: 1px solid var(--um-hairline);
  color: var(--um-ink-soft);
  font-size: 0.68rem;
  font-weight: 600;
}
.rk-um-company .q-icon {
  font-size: 12px;
  flex-shrink: 0;
}

/* ------------------------------ Acciones ---------------------------- */
.rk-um-body {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 2px;
}

.rk-um-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--um-ink);
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.rk-um-item:hover:not(:disabled) {
  background: var(--um-soft);
  transform: translateX(2px);
}
.rk-um-item:focus-visible {
  outline: none;
  background: var(--um-soft);
  box-shadow: inset 0 0 0 1.5px var(--um-border);
}
.rk-um-item:disabled {
  cursor: progress;
  opacity: 0.75;
}

/* Tile del icono: gris en reposo, degradado de marca al pasar */
.rk-um-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--um-soft);
  color: var(--color-primary, #0ca9c4);
  transition: all 0.25s ease;
}
.rk-um-ico .q-icon {
  font-size: 17px;
}

.rk-um-item:hover:not(:disabled) .rk-um-ico {
  background: var(--um-brand);
  color: #fff;
  box-shadow: 0 4px 10px rgba(12, 169, 196, 0.3);
}

.rk-um-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rk-um-arrow {
  flex-shrink: 0;
  font-size: 15px;
  color: var(--um-ink-muted);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.25s ease;
}
.rk-um-item:hover .rk-um-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--color-primary, #0ca9c4);
}

.rk-um-sep {
  height: 1px;
  margin: 6px 4px;
  background: var(--um-hairline);
}

/* Cerrar sesión: mismo lenguaje, tono de peligro */
.rk-um-item.is-danger {
  color: var(--color-danger, #dc2626);
}
.rk-um-item.is-danger .rk-um-ico {
  background: var(--color-danger-soft, rgba(220, 38, 38, 0.12));
  color: var(--color-danger, #dc2626);
}
.rk-um-item.is-danger:hover:not(:disabled) {
  background: var(--color-danger-soft, rgba(220, 38, 38, 0.12));
}
.rk-um-item.is-danger:hover:not(:disabled) .rk-um-ico {
  background: linear-gradient(135deg, var(--color-danger, #dc2626), #b91c1c);
  color: #fff;
  box-shadow: 0 4px 10px rgba(220, 38, 38, 0.32);
}

.rk-um-kbd {
  flex-shrink: 0;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid var(--um-hairline);
  background: var(--um-soft);
  color: var(--um-ink-muted);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* ------------------------------- Pie -------------------------------- */
.rk-um-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-top: 1.5px solid var(--um-hairline);
  background: var(--um-soft);
  color: var(--um-ink-muted);
  font-size: 0.68rem;
  font-weight: 600;
}

.rk-um-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success, #16a34a);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-success, #16a34a) 22%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .rk-um-trigger,
  .rk-um-ring,
  .rk-um-item,
  .rk-um-ico,
  .rk-um-arrow,
  .rk-um-pulse {
    transition: none;
  }
}
</style>
