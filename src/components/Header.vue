<template>
  <q-header reveal elevated :class="['rk-header', headerTone]">
    <div class="rk-top row items-center justify-between">
      <!-- IZQUIERDA: menú + marca + empresa -->
      <div class="row items-center no-wrap">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Abrir menú"
          @click="$emit('toggle-drawer')"
          class="q-mr-xs"
        />

        <!-- Marca -->
        <q-btn flat dense no-caps class="rk-brand q-mr-xs" @click="goHome">
          <q-avatar size="22px" class="q-mr-xs"
            ><q-icon name="precision_manufacturing"
          /></q-avatar>
          <span class="text-weight-bold">Recksy</span>
        </q-btn>

      </div>

      <!-- CENTRO: breadcrumbs (se ocultan en móvil) -->
      <nav class="rk-bc ellipsis">
        <span v-for="(b, i) in breadcrumbs" :key="i" class="rk-bc-item">
          <q-btn
            v-if="b.to && i < breadcrumbs.length - 1"
            dense
            flat
            no-caps
            class="rk-bc-link"
            @click="router.push(b.to)"
            :label="b.label"
          />
          <span v-else class="rk-bc-current">{{ b.label }}</span>
          <q-icon
            v-if="i < breadcrumbs.length - 1"
            name="chevron_right"
            size="16px"
            class="q-mx-xs rk-bc-sep"
          />
        </span>
      </nav>

      <!-- DERECHA: búsqueda, tema, notifs, acciones, usuario -->
      <div class="row items-center no-wrap">
        <q-btn
          flat
          dense
          round
          icon="search"
          aria-label="Buscar"
          @click="openCommand"
        >
          <q-tooltip>Buscar ({{ isMac ? "⌘" : "Ctrl" }} + K)</q-tooltip>
        </q-btn>

        <q-btn
          flat
          dense
          round
          :icon="darkIcon"
          @click="toggleDark"
          aria-label="Cambiar tema"
        >
          <q-tooltip>{{ darkTip }}</q-tooltip>
        </q-btn>

        <!-- Notificaciones -->
        <q-btn
          flat
          dense
          round
          icon="notifications"
          aria-label="Notificaciones"
        >
          <q-badge v-if="unreadCount > 0" color="red" floating>{{
            unreadCount
          }}</q-badge>
          <q-menu
            anchor="bottom right"
            self="top right"
            class="rk-menu"
            :offset="[0, 4]"
          >
            <div class="q-pa-sm rk-menu-title row items-center justify-between">
              <div class="text-subtitle2">Notificaciones</div>
              <q-btn
                flat
                dense
                size="sm"
                icon="done_all"
                label="Marcar leídas"
                @click="markAllRead"
              />
            </div>
            <q-separator />
            <q-list
              separator
              style="min-width: 280px; max-height: 50vh"
              bordered
            >
              <q-item
                v-for="n in notifications"
                :key="n.id"
                clickable
                @click="openNotif(n)"
              >
                <q-item-section avatar>
                  <q-icon :name="n.icon || 'notifications_active'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium ellipsis">{{
                    n.title
                  }}</q-item-label>
                  <q-item-label caption class="ellipsis-2-lines">{{
                    n.body
                  }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge v-if="!n.read" color="red" rounded />
                </q-item-section>
              </q-item>
              <q-item v-if="notifications.length === 0">
                <q-item-section>
                  <q-item-label caption>Sin notificaciones</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <!-- Acciones de página inyectables -->
        <slot name="actions" />

        <UserAvatarMenu />
      </div>
    </div>

    <!-- Paleta de comandos -->
    <q-dialog
      v-model="commandOpen"
      persistent
      transition-show="scale"
      transition-hide="scale"
    >
      <q-card class="rk-cmd">
        <q-input
          v-model="query"
          dense
          outlined
          autofocus
          placeholder="Buscar páginas, acciones…"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="activate()"
        >
          <template #prepend><q-icon name="search" /></template>
          <template #append
            ><q-chip dense square
              >{{ isMac ? "⌘" : "Ctrl" }} + K</q-chip
            ></template
          >
        </q-input>
        <q-separator spaced />
        <div class="rk-cmd-list">
          <q-item
            v-for="(opt, i) in results"
            :key="opt.key"
            clickable
            :active="i === hi"
            @click="exec(opt)"
            @mouseenter="hi = i"
          >
            <q-item-section avatar><q-icon :name="opt.icon" /></q-item-section>
            <q-item-section>
              <q-item-label class="ellipsis">{{ opt.label }}</q-item-label>
              <q-item-label caption class="ellipsis">{{
                opt.desc
              }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="opt.kbd"
              ><q-chip dense>{{ opt.kbd }}</q-chip></q-item-section
            >
          </q-item>
          <div v-if="!results.length" class="q-pa-sm text-grey">
            Sin resultados
          </div>
        </div>
        <q-separator />
        <div class="row justify-end q-pa-sm">
          <q-btn flat label="Cerrar" @click="commandOpen = false" />
        </div>
      </q-card>
    </q-dialog>

    <q-ajax-bar ref="ajax" position="top" size="3px" />
  </q-header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Dark, useQuasar } from "quasar";
import UserAvatarMenu from "@/components/UserAvatarMenu.vue";
import { useThemeStore } from "@/stores/themeStore";

defineEmits(["toggle-drawer"]);

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();

/* Apariencia */
const headerTone = computed(() =>
  $q.dark.isActive ? "rk--dark" : "rk--light"
);

/* Tema */
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
  });
}

/* Breadcrumbs */
const breadcrumbs = computed(() => {
  const m = route.matched || [];
  const parts = [];
  m.forEach((r) => {
    const bc = r.meta?.breadcrumb;
    if (Array.isArray(bc)) parts.push(...bc);
    else if (r.meta?.title) parts.push({ label: r.meta.title, to: r.path });
  });
  if (parts.length)
    parts[parts.length - 1] = { ...parts[parts.length - 1], to: null };
  return parts.length ? parts : [{ label: "Inicio", to: null }];
});
function goHome() {
  router.push("/");
}

/* Notificaciones (demo) */
const notifications = ref([
  // {
  //   id: 1,
  //   title: "Liquidación disponible",
  //   body: "Tu liquidación de septiembre está lista.",
  //   icon: "receipt_long",
  //   read: false,
  // },
  // {
  //   id: 2,
  //   title: "Documento firmado",
  //   body: "Contrato anexo firmado.",
  //   icon: "edit_document",
  //   read: true,
  // },
]);
const unreadCount = computed(
  () => notifications.value.filter((n) => !n.read).length
);
function markAllRead() {
  notifications.value = notifications.value.map((n) => ({ ...n, read: true }));
}
function openNotif(n) {
  n.read = true;
  $q.notify({ type: "positive", message: n.title });
}

/* Paleta de comandos */
const commandOpen = ref(false);
const query = ref("");
const hi = ref(0);
const isMac = (navigator?.platform || "").toUpperCase().includes("MAC");
const baseCommands = computed(() => [
  {
    key: "docs",
    icon: "description",
    label: "Mis documentos",
    desc: "Ver y descargar",
    to: "/documentos",
  },
  {
    key: "perfil",
    icon: "person",
    label: "Mi perfil",
    desc: "Editar datos",
    to: "/perfil",
  },
  {
    key: "ayuda",
    icon: "help",
    label: "Ayuda",
    desc: "Centro de ayuda",
    to: "/ayuda",
  },
]);
const results = computed(() => {
  const q = (query.value || "").toLowerCase();
  const all = baseCommands.value;
  if (!q) return all;
  return all.filter(
    (c) => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
  );
});
function openCommand() {
  // commandOpen.value = true;
  // query.value = "";
  // hi.value = 0;
}
function move(dir) {
  const len = results.value.length;
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

/* Red + hotkeys */
const isOnline = ref(navigator.onLine);
function onOnline() {
  isOnline.value = true;
}
function onOffline() {
  isOnline.value = false;
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
/* Vidrio + gradiente */
.rk-header {
  backdrop-filter: saturate(1.2) blur(10px);
  border-bottom: 1px solid var(--rk-border);
}
.rk--light {
  --rk-border: rgba(0, 0, 0, 0.06);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.86) 0%,
    rgba(255, 255, 255, 0.72) 100%
  );
  color: #111;
}
.rk--dark {
  --rk-border: rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    180deg,
    rgba(16, 16, 20, 0.78) 0%,
    rgba(16, 16, 20, 0.62) 100%
  );
  color: #fff;
}

.rk-top {
  padding: 6px 10px;
}

/* Marca + empresa */
.rk-brand {
  letter-spacing: 0.4px;
  border-radius: 10px;
}
.rk-brand:hover {
  background: rgba(99, 102, 241, 0.12);
}
.rk-company {
  margin-left: 0.25rem;
}
.rk-company-trigger :deep(.q-field__control) {
  min-height: 30px !important;
} /* compacto */

/* Breadcrumbs centro */
.rk-bc {
  flex: 1 1 auto;
  text-align: center;
  max-width: 52vw;
  font-size: 0.92rem;
  opacity: 0.95;
}
.rk-bc-item {
  display: inline-flex;
  align-items: center;
}
.rk-bc-link {
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 8px;
}
.rk-bc-link:hover {
  background: rgba(99, 102, 241, 0.12);
}
.rk-bc-current {
  opacity: 0.85;
  font-weight: 600;
}
.rk-bc-sep {
  opacity: 0.45;
}

/* Menú notificaciones */
.rk-menu {
  min-width: 320px;
}
.rk-menu-title {
  min-width: 280px;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Paleta comandos */
.rk-cmd {
  width: min(720px, 96vw);
  border-radius: 14px;
}
.rk-cmd .rk-cmd-list {
  max-height: 50vh;
  overflow: auto;
}

/* Responsive */
@media (max-width: 1024px) {
  .rk-bc {
    max-width: 42vw;
  }
}
@media (max-width: 768px) {
  .rk-bc {
    display: none;
  }
  .rk-company {
    display: none;
  } /* en móvil: sugiere mover selector a un drawer o a /empresa/cambiar */
}
</style>
