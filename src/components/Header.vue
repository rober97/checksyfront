<template>
  <q-header reveal elevated class="rk-header">
    <!-- Main Header Bar -->
    <div class="rk-header-bar">
      <!-- Left Section -->
      <div class="rk-header-left">
        <button class="rk-menu-btn" @click="$emit('toggle-drawer')">
          <q-icon name="menu" />
          <div class="rk-btn-ripple"></div>
        </button>

        <!-- Brand -->
        <button class="rk-brand" @click="goHome">
          <div class="rk-brand-icon">
            <q-icon name="precision_manufacturing" />
            <div class="rk-brand-pulse"></div>
          </div>
          <span class="rk-brand-text">Recksy</span>
          <div class="rk-brand-badge">v2.0</div>
        </button>
      </div>

      <!-- Center: Breadcrumbs -->
      <nav class="rk-breadcrumbs">
        <div class="rk-breadcrumb-container">
          <div
            v-for="(b, i) in breadcrumbs"
            :key="i"
            class="rk-breadcrumb-item"
          >
            <button
              v-if="b.to && i < breadcrumbs.length - 1"
              class="rk-breadcrumb-link"
              @click="router.push(b.to)"
            >
              <q-icon v-if="b.icon" :name="b.icon" />
              <span>{{ b.label }}</span>
            </button>
            <div v-else class="rk-breadcrumb-current">
              <q-icon v-if="b.icon" :name="b.icon" />
              <span>{{ b.label }}</span>
            </div>
            <q-icon
              v-if="i < breadcrumbs.length - 1"
              name="chevron_right"
              class="rk-breadcrumb-separator"
            />
          </div>
        </div>
      </nav>

      <!-- Right Section -->
      <div class="rk-header-right">
        <!-- Company Switcher (solo admin_rrhh multi-empresa) -->
        <CompanySwitcher />

        <!-- Search Button -->
        <button class="rk-action-btn" @click="openCommand">
          <q-icon name="search" />
          <q-tooltip class="rk-tooltip">
            Buscar ({{ isMac ? "⌘" : "Ctrl" }} + K)
          </q-tooltip>
        </button>

        <!-- Theme Toggle -->
        <button class="rk-action-btn" @click="toggleDark">
          <q-icon :name="darkIcon" />
          <div class="rk-theme-indicator"></div>
          <q-tooltip class="rk-tooltip">{{ darkTip }}</q-tooltip>
        </button>

        <!-- Notifications -->
        <div class="rk-notif-wrapper">
          <button class="rk-action-btn" @click="notifOpen = !notifOpen">
            <q-icon name="notifications" />
            <div v-if="unreadCount > 0" class="rk-notif-badge">
              <span>{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
              <div class="rk-badge-pulse"></div>
            </div>
          </button>

          <!-- Notifications Menu -->
          <q-menu
            v-model="notifOpen"
            anchor="bottom right"
            self="top right"
            :offset="[0, 8]"
            class="rk-notif-menu"
          >
            <div class="rk-notif-panel">
              <div class="rk-notif-header">
                <div class="rk-notif-title-section">
                  <div class="rk-notif-icon">
                    <q-icon name="notifications_active" />
                  </div>
                  <div>
                    <h4 class="rk-notif-title">Notificaciones</h4>
                    <p class="rk-notif-subtitle">{{ unreadCount }} sin leer</p>
                  </div>
                </div>
                <button
                  v-if="notifications.length > 0"
                  class="rk-mark-read-btn"
                  @click="markAllRead"
                >
                  <q-icon name="done_all" />
                  <span>Marcar leídas</span>
                </button>
              </div>

              <div class="rk-notif-list">
                <div
                  v-for="n in notifications"
                  :key="n.id"
                  class="rk-notif-item"
                  :class="{ 'rk-notif-unread': !n.read }"
                  @click="openNotif(n)"
                >
                  <div class="rk-notif-item-icon">
                    <q-icon :name="n.icon || 'notifications_active'" />
                  </div>
                  <div class="rk-notif-item-content">
                    <h5 class="rk-notif-item-title">{{ n.title }}</h5>
                    <p class="rk-notif-item-body">{{ n.body }}</p>
                    <span class="rk-notif-item-time">{{ n.time || 'Hace un momento' }}</span>
                  </div>
                  <div v-if="!n.read" class="rk-notif-item-dot"></div>
                </div>

                <div v-if="notifications.length === 0" class="rk-notif-empty">
                  <div class="rk-empty-icon">
                    <q-icon name="notifications_off" />
                  </div>
                  <p class="rk-empty-text">No tienes notificaciones</p>
                </div>
              </div>
            </div>
          </q-menu>
        </div>

        <!-- Page Actions Slot -->
        <div class="rk-page-actions">
          <slot name="actions" />
        </div>

        <!-- User Avatar Menu -->
        <UserAvatarMenu />
      </div>
    </div>

    <!-- Command Palette -->
    <q-dialog
      v-model="commandOpen"
      persistent
      transition-show="scale"
      transition-hide="scale"
      class="rk-command-dialog"
    >
      <div class="rk-command-palette">
        <!-- Header -->
        <div class="rk-command-header">
          <div class="rk-command-search">
            <q-icon name="search" class="rk-search-icon" />
            <input
              v-model="query"
              type="text"
              placeholder="Buscar páginas, acciones, documentos..."
              autofocus
              class="rk-search-input"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="activate()"
              @keydown.esc="commandOpen = false"
            />
            <div class="rk-search-kbd">
              <kbd>{{ isMac ? "⌘" : "Ctrl" }}</kbd>
              <span>+</span>
              <kbd>K</kbd>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div class="rk-command-results">
          <div v-if="results.length > 0" class="rk-results-section">
            <div class="rk-results-label">Resultados</div>
            <div
              v-for="(opt, i) in results"
              :key="opt.key"
              class="rk-command-item"
              :class="{ 'active': i === hi }"
              @click="exec(opt)"
              @mouseenter="hi = i"
            >
              <div class="rk-command-item-icon">
                <q-icon :name="opt.icon" />
              </div>
              <div class="rk-command-item-content">
                <h5 class="rk-command-item-label">{{ opt.label }}</h5>
                <p class="rk-command-item-desc">{{ opt.desc }}</p>
              </div>
              <kbd v-if="opt.kbd" class="rk-command-kbd">{{ opt.kbd }}</kbd>
            </div>
          </div>

          <div v-else class="rk-command-empty">
            <div class="rk-empty-icon">
              <q-icon name="search_off" />
            </div>
            <p class="rk-empty-text">Sin resultados para "{{ query }}"</p>
            <p class="rk-empty-hint">Intenta con otros términos</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="rk-command-footer">
          <div class="rk-command-hints">
            <div class="rk-hint-item">
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              <span>Navegar</span>
            </div>
            <div class="rk-hint-item">
              <kbd>↵</kbd>
              <span>Seleccionar</span>
            </div>
            <div class="rk-hint-item">
              <kbd>Esc</kbd>
              <span>Cerrar</span>
            </div>
          </div>
        </div>
      </div>
    </q-dialog>

    <!-- Loading Bar -->
    <q-ajax-bar ref="ajax" position="top" size="3px" color="primary" />
  </q-header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Dark, useQuasar } from "quasar";
import UserAvatarMenu from "@/components/UserAvatarMenu.vue";
import CompanySwitcher from "@/components/CompanySwitcher.vue";
import { useThemeStore } from "@/stores/themeStore";

defineEmits(["toggle-drawer"]);

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();

/* Theme */
const darkIcon = computed(() =>
  $q.dark.isActive ? "dark_mode" : "light_mode"
);
const darkTip = computed(() =>
  $q.dark.isActive ? "Modo oscuro" : "Modo claro"
);

function toggleDark() {
  const v = !$q.dark.isActive;
  Dark.set(v);
  themeStore.isDark = v;
  localStorage.setItem("darkMode", String(v));
  $q.notify({
    type: "info",
    message: v ? "Modo oscuro activado" : "Modo claro activado",
    icon: v ? "dark_mode" : "light_mode",
  });
}

/* Breadcrumbs */
const breadcrumbs = computed(() => {
  const m = route.matched || [];
  const parts = [];
  m.forEach((r) => {
    const bc = r.meta?.breadcrumb;
    if (Array.isArray(bc)) parts.push(...bc);
    else if (r.meta?.title) parts.push({ label: r.meta.title, to: r.path, icon: r.meta.icon });
  });
  if (parts.length)
    parts[parts.length - 1] = { ...parts[parts.length - 1], to: null };
  return parts.length ? parts : [{ label: "Inicio", to: null, icon: "home" }];
});

function goHome() {
  router.push("/");
}

/* Notifications */
const notifOpen = ref(false);
const notifications = ref([
  {
    id: 1,
    title: "Liquidación disponible",
    body: "Tu liquidación de diciembre está lista para descargar.",
    icon: "receipt_long",
    read: false,
    time: "Hace 2 horas",
  },
  {
    id: 2,
    title: "Documento firmado",
    body: "El contrato anexo ha sido firmado exitosamente.",
    icon: "edit_document",
    read: true,
    time: "Hace 1 día",
  },
  {
    id: 3,
    title: "Solicitud aprobada",
    body: "Tu solicitud de vacaciones ha sido aprobada.",
    icon: "check_circle",
    read: false,
    time: "Hace 3 horas",
  },
]);

const unreadCount = computed(
  () => notifications.value.filter((n) => !n.read).length
);

function markAllRead() {
  notifications.value = notifications.value.map((n) => ({ ...n, read: true }));
  $q.notify({
    type: "positive",
    message: "Todas las notificaciones marcadas como leídas",
    icon: "done_all",
  });
}

function openNotif(n) {
  n.read = true;
  notifOpen.value = false;
  $q.notify({ type: "info", message: n.title });
}

/* Command Palette */
const commandOpen = ref(false);
const query = ref("");
const hi = ref(0);
const isMac = (navigator?.platform || "").toUpperCase().includes("MAC");

const baseCommands = computed(() => [
  {
    key: "home",
    icon: "home",
    label: "Inicio",
    desc: "Ir a la página principal",
    to: "/",
  },
  {
    key: "docs",
    icon: "description",
    label: "Mis documentos",
    desc: "Ver y descargar documentos",
    to: "/documentos",
  },
  {
    key: "perfil",
    icon: "person",
    label: "Mi perfil",
    desc: "Editar información personal",
    to: "/perfil",
  },
  {
    key: "usuarios",
    icon: "group",
    label: "Usuarios",
    desc: "Gestionar usuarios del sistema",
    to: "/usuarios",
  },
  {
    key: "empresas",
    icon: "business",
    label: "Empresas",
    desc: "Administrar empresas",
    to: "/empresas",
  },
  {
    key: "nomina",
    icon: "request_quote",
    label: "Nómina",
    desc: "Procesar y revisar nómina",
    to: "/nomina",
  },
  {
    key: "ayuda",
    icon: "help",
    label: "Ayuda",
    desc: "Centro de ayuda y documentación",
    to: "/ayuda",
  },
  {
    key: "config",
    icon: "settings",
    label: "Configuración",
    desc: "Ajustes del sistema",
    to: "/configuracion",
  },
]);

const results = computed(() => {
  const q = (query.value || "").toLowerCase();
  const all = baseCommands.value;
  if (!q) return all;
  return all.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q) ||
      c.key.toLowerCase().includes(q)
  );
});

function openCommand() {
  commandOpen.value = true;
  query.value = "";
  hi.value = 0;
}

function move(dir) {
  const len = results.value.length;
  if (len === 0) return;
  hi.value = (hi.value + dir + len) % len;
}

function activate() {
  const it = results.value[hi.value];
  if (it) exec(it);
}

function exec(opt) {
  commandOpen.value = false;
  if (opt.to) router.push(opt.to);
}

function onGlobalKey(e) {
  const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
  if (isCmdK) {
    e.preventDefault();
    openCommand();
  }
}

/* Network status */
const isOnline = ref(navigator.onLine);
function onOnline() {
  isOnline.value = true;
}
function onOffline() {
  isOnline.value = false;
  $q.notify({
    type: "warning",
    message: "Sin conexión a internet",
    icon: "wifi_off",
  });
}

onMounted(() => {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  window.addEventListener("keydown", onGlobalKey);
  
  const saved = localStorage.getItem("darkMode");
  if (saved !== null) {
    const v = saved === "true";
    Dark.set(v);
    themeStore.isDark = v;
  } else {
    localStorage.setItem("darkMode", String(Dark.isActive));
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOffline);
  window.removeEventListener("keydown", onGlobalKey);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

:root {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-accent: #14b8a6;
}

/* Theme Variables */
.rk-header {
  --header-bg: rgba(255, 255, 255, 0.92);
  --header-border: rgba(6, 182, 212, 0.12);
  --text-primary: rgba(15, 23, 42, 0.95);
  --text-secondary: rgba(15, 23, 42, 0.7);
  --text-muted: rgba(15, 23, 42, 0.5);
  --surface-1: rgba(6, 182, 212, 0.05);
  --surface-2: rgba(6, 182, 212, 0.08);
  --border-1: rgba(6, 182, 212, 0.15);
  backdrop-filter: saturate(1.2) blur(16px);
  border-bottom: 1.5px solid var(--header-border);
  background: var(--header-bg);
  font-family: 'Sora', -apple-system, sans-serif;
}

.body--dark .rk-header {
  --header-bg: rgba(10, 14, 20, 0.92);
  --header-border: rgba(6, 182, 212, 0.2);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --surface-1: rgba(6, 182, 212, 0.08);
  --surface-2: rgba(6, 182, 212, 0.12);
  --border-1: rgba(6, 182, 212, 0.2);
}

/* Header Bar */
.rk-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 20px;
  min-height: 64px;
}

/* Left Section */
.rk-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Menu Button */
.rk-menu-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--text-primary);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.rk-menu-btn:hover {
  background: var(--surface-1);
  color: var(--color-primary-light);
}

.rk-menu-btn .q-icon {
  font-size: 22px;
  z-index: 1;
}

.rk-btn-ripple {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, var(--color-primary), transparent 70%);
  opacity: 0;
  transform: scale(0);
  transition: all 0.6s ease;
}

.rk-menu-btn:active .rk-btn-ripple {
  opacity: 0.3;
  transform: scale(1);
}

/* Brand */
.rk-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.rk-brand:hover {
  background: var(--surface-1);
}

.rk-brand-icon {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 9px;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-brand-icon .q-icon {
  font-size: 20px;
  color: #fff;
  z-index: 1;
}

.rk-brand-pulse {
  position: absolute;
  inset: -3px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 11px;
  opacity: 0;
  filter: blur(6px);
  animation: brandPulse 3s ease-in-out infinite;
}

@keyframes brandPulse {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.15);
  }
}

.rk-brand-text {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.rk-brand-badge {
  padding: 3px 8px;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.25);
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.3px;
}

.body--dark .rk-brand-badge {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.35);
  color: var(--color-primary-light);
}

/* Breadcrumbs */
.rk-breadcrumbs {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
}

.rk-breadcrumb-container {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.rk-breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rk-breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.rk-breadcrumb-link:hover {
  background: var(--surface-1);
  color: var(--color-primary-light);
}

.rk-breadcrumb-link .q-icon {
  font-size: 16px;
}

.rk-breadcrumb-current {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
}

.rk-breadcrumb-current .q-icon {
  font-size: 16px;
  color: var(--color-primary-light);
}

.rk-breadcrumb-separator {
  font-size: 14px;
  color: var(--text-muted);
}

/* Right Section */
.rk-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Action Buttons */
.rk-action-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-action-btn:hover {
  background: var(--surface-1);
  color: var(--color-primary-light);
}

.rk-action-btn .q-icon {
  font-size: 20px;
}

/* Theme Indicator */
.rk-theme-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  border: 1.5px solid var(--header-bg);
}

/* Notification Badge */
.rk-notif-wrapper {
  position: relative;
}

.rk-notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  background: #ef4444;
  border: 2px solid var(--header-bg);
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 800;
  color: #fff;
  z-index: 2;
}

.rk-badge-pulse {
  position: absolute;
  inset: -2px;
  background: #ef4444;
  border-radius: 10px;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  70% {
    opacity: 0.6;
    transform: scale(1.5);
  }
}

/* Notifications Menu */
.rk-notif-menu {
  margin-top: 8px;
}

.rk-notif-panel {
  width: 400px;
  max-width: 95vw;
  background: var(--header-bg);
  backdrop-filter: blur(20px);
  border: 1.5px solid var(--border-1);
  border-radius: 16px;
  overflow: hidden;
}

.rk-notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;
  border-bottom: 1.5px solid var(--border-1);
}

.rk-notif-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rk-notif-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-notif-icon .q-icon {
  font-size: 20px;
  color: #fff;
}

.rk-notif-title {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0 0 2px 0;
  color: var(--text-primary);
}

.rk-notif-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 600;
}

.rk-mark-read-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-mark-read-btn:hover {
  background: var(--surface-2);
  color: var(--color-primary-light);
}

.rk-mark-read-btn .q-icon {
  font-size: 16px;
}

/* Notification List */
.rk-notif-list {
  max-height: 400px;
  overflow-y: auto;
}

.rk-notif-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.rk-notif-item:hover {
  background: var(--surface-1);
}

.rk-notif-item:last-child {
  border-bottom: none;
}

.rk-notif-unread {
  background: var(--surface-1);
}

.rk-notif-item-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 8px;
  flex-shrink: 0;
}

.rk-notif-item-icon .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-notif-item-content {
  flex: 1;
}

.rk-notif-item-title {
  font-size: 0.92rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--text-primary);
  line-height: 1.4;
}

.rk-notif-item-body {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 6px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rk-notif-item-time {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.rk-notif-item-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

/* Empty State */
.rk-notif-empty,
.rk-command-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.rk-empty-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-1);
  border-radius: 16px;
  margin-bottom: 16px;
}

.rk-empty-icon .q-icon {
  font-size: 32px;
  color: var(--text-muted);
}

.rk-empty-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.rk-empty-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

/* Command Palette */
.rk-command-dialog :deep(.q-dialog__backdrop) {
  backdrop-filter: blur(8px);
  background: rgba(10, 14, 20, 0.7);
}

.rk-command-palette {
  width: min(640px, 95vw);
  background: var(--header-bg);
  backdrop-filter: blur(20px);
  border: 1.5px solid var(--border-1);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.rk-command-header {
  padding: 20px;
  border-bottom: 1.5px solid var(--border-1);
}

.rk-command-search {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rk-search-icon {
  font-size: 22px;
  color: var(--color-primary-light);
  flex-shrink: 0;
}

.rk-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Sora', -apple-system, sans-serif;
}

.rk-search-input::placeholder {
  color: var(--text-muted);
  font-weight: 500;
}

.rk-search-kbd {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.rk-search-kbd kbd {
  padding: 4px 8px;
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  color: var(--text-primary);
}

/* Results */
.rk-command-results {
  max-height: 400px;
  overflow-y: auto;
}

.rk-results-section {
  padding: 12px;
}

.rk-results-label {
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rk-command-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-command-item:hover,
.rk-command-item.active {
  background: var(--surface-1);
}

.rk-command-item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 10px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.rk-command-item.active .rk-command-item-icon {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-command-item-icon .q-icon {
  font-size: 20px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.rk-command-item.active .rk-command-item-icon .q-icon {
  color: #fff;
}

.rk-command-item-content {
  flex: 1;
}

.rk-command-item-label {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.rk-command-item-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.rk-command-kbd {
  padding: 4px 10px;
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  color: var(--text-muted);
}

/* Footer */
.rk-command-footer {
  padding: 14px 20px;
  border-top: 1.5px solid var(--border-1);
  background: var(--surface-1);
}

.rk-command-hints {
  display: flex;
  align-items: center;
  gap: 20px;
}

.rk-hint-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.rk-hint-item kbd {
  padding: 3px 7px;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 5px;
  font-size: 0.7rem;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  color: var(--text-primary);
}

/* Tooltip */
.rk-tooltip {
  background: rgba(6, 182, 212, 0.95);
  backdrop-filter: blur(10px);
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
}

/* Page Actions */
.rk-page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Responsive */
@media (max-width: 1200px) {
  .rk-breadcrumbs {
    max-width: 400px;
  }
}

@media (max-width: 1023px) {
  .rk-breadcrumbs {
    max-width: 300px;
  }
}

@media (max-width: 767px) {
  .rk-header-bar {
    padding: 10px 16px;
    min-height: 56px;
  }

  .rk-breadcrumbs {
    display: none;
  }

  .rk-brand-text {
    font-size: 1rem;
  }

  .rk-brand-badge {
    display: none;
  }

  .rk-notif-panel {
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    border: none;
    border-top: 1.5px solid var(--border-1);
  }

  .rk-command-palette {
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    border: none;
    border-top: 1.5px solid var(--border-1);
  }
}

@media (max-width: 599px) {
  .rk-header-left {
    gap: 8px;
  }

  .rk-brand-icon {
    width: 32px;
    height: 32px;
  }

  .rk-brand-icon .q-icon {
    font-size: 18px;
  }

  .rk-action-btn {
    width: 36px;
    height: 36px;
  }

  .rk-action-btn .q-icon {
    font-size: 18px;
  }
}
</style>