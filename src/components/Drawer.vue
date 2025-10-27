<template>
  <q-drawer
    v-model="isOpen"
    show-if-above
    bordered
    :mini="mini"
    :width="280"
    :breakpoint="768"
    class="rk-drawer full-height"
    :content-class="drawerContentClass"
    @mouseover="onHover"
    @mouseleave="onLeave"
  >
    <!-- Header -->
    <div class="rk-drawer-header" :class="{ mini: mini }">
      <div class="rk-user-section">
        <div class="rk-avatar-wrapper">
          <q-avatar size="48px" class="rk-avatar" :class="avatarColorClass">
            {{ initials }}
            <div class="rk-avatar-glow"></div>
          </q-avatar>
        </div>

        <div v-if="!mini" class="rk-user-info">
          <div class="rk-user-name ellipsis">{{ user?.name || "Usuario" }}</div>
          <div class="rk-user-role">
            <q-badge
              :color="roleBadge.color"
              :text-color="roleBadge.textColor"
              class="rk-role-badge"
            >
              {{ role || "Usuario" }}
            </q-badge>
          </div>
        </div>
      </div>

    </div>

    <!-- Buscador (cmd/ctrl+k) -->
    <div class="rk-search" v-if="!mini">
      <transition name="fade">
        <div v-if="search && filteredFlat.length" class="rk-search-panel">
          <div
            v-for="(it, idx) in filteredFlat"
            :key="it._id"
            class="rk-search-item"
            :class="{ active: idx === highlightedIndex }"
            @click="navigateTo(it)"
            @mouseenter="highlightedIndex = idx"
            role="button"
            tabindex="0"
          >
            <q-icon :name="it.icon" class="rk-search-icon" />
            <div class="rk-search-info">
              <div class="rk-search-label ellipsis">{{ it.label }}</div>
              <div class="rk-search-desc ellipsis">
                {{ it.description || it.groupLabel }}
              </div>
            </div>
            <q-badge
              v-if="it.badge"
              :color="it.badgeColor || 'primary'"
              rounded
              >{{ it.badge }}</q-badge
            >
          </div>
        </div>
      </transition>
    </div>

    <!-- Navegación -->
    <q-scroll-area class="rk-nav-scroll" @keydown.native="onKeydownNav">
      <div class="rk-nav-container" ref="navContainerRef">
        <!-- Grupos -->
        <template v-for="(group, gi) in visibleMenu" :key="group.id">
          <div class="rk-nav-group" v-if="group.children?.length">
            <div
              class="rk-group-header"
              :class="{ mini }"
              @click="toggleGroup(group.id)"
              :aria-expanded="!!expandedGroups[group.id]"
              role="button"
              tabindex="0"
              @keyup.enter="toggleGroup(group.id)"
            >
              <q-icon :name="group.icon" class="rk-group-icon" />
              <span v-if="!mini" class="rk-group-label">{{ group.label }}</span>
              <q-icon
                v-if="!mini"
                :name="expandedGroups[group.id] ? 'expand_less' : 'expand_more'"
                class="rk-expand-icon"
              />
            </div>

            <q-slide-transition>
              <div
                v-show="expandedGroups[group.id] || mini"
                class="rk-group-items"
              >
                <div
                  v-for="(item, ii) in group.children"
                  :key="`${group.id}-${ii}`"
                  class="rk-nav-item"
                  :class="navItemClass(item)"
                  @click="navigateTo(item)"
                  v-ripple
                  :aria-current="isActive(item) ? 'page' : undefined"
                  role="link"
                  tabindex="0"
                  @keyup.enter="navigateTo(item)"
                >
                  <div class="rk-item-content">
                    <q-icon :name="item.icon" class="rk-item-icon" />
                    <div v-if="!mini" class="rk-item-info">
                      <div class="rk-item-label ellipsis">{{ item.label }}</div>
                      <div
                        v-if="item.description"
                        class="rk-item-desc ellipsis"
                      >
                        {{ item.description }}
                      </div>
                    </div>
                    <div v-if="item.badge && !mini" class="rk-item-badge">
                      <q-badge :color="item.badgeColor || 'primary'" rounded>{{
                        item.badge
                      }}</q-badge>
                    </div>
                  </div>

                  <div class="rk-active-indicator"></div>

                  <q-tooltip
                    v-if="mini"
                    anchor="center right"
                    self="center left"
                    class="rk-nav-tooltip"
                  >
                    <div class="rk-tooltip-content">
                      <div class="rk-tooltip-title">{{ item.label }}</div>
                      <div v-if="item.description" class="rk-tooltip-desc">
                        {{ item.description }}
                      </div>
                    </div>
                  </q-tooltip>
                </div>
              </div>
            </q-slide-transition>
          </div>

          <q-separator
            v-if="gi < visibleMenu.length - 1"
            class="rk-group-separator"
          />
        </template>
      </div>
    </q-scroll-area>

    <!-- Footer -->
    <div class="rk-drawer-footer" :class="{ mini }">
      <div class="rk-footer-content">
        <q-btn
          flat
          no-caps
          class="rk-logout-btn"
          :class="{ mini }"
          @click="onLogout"
        >
          <q-icon name="logout" class="rk-logout-icon" />
          <span v-if="!mini" class="rk-logout-text">Cerrar sesión</span>
          <div class="rk-logout-glow"></div>
        </q-btn>

      </div>
    </div>

    <!-- Efectos -->
    <div class="rk-drawer-effects">
      <div class="rk-effect-1"></div>
      <div class="rk-effect-2"></div>
      <div class="rk-effect-3"></div>
    </div>
  </q-drawer>
</template>

<script setup>
import {
  computed,
  ref,
  onMounted,
  watch,
  nextTick,
  onBeforeUnmount,
} from "vue";
import { useQuasar } from "quasar";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useAccess } from "../composables/useAccess";
import { MENU } from "../navigation/menu";

/* Props/Emits */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  miniState: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

/* Deps */
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { role, can } = useAccess();

/* State */
const expandedGroups = ref({});
const hovered = ref(false);
const unreadNotifications = ref(3);
const appVersion = ref("1.0.0");

/* Drawer v-model */
const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
const mini = computed(() => !!props.miniState && !hovered.value);

/* Styles */
const drawerContentClass = computed(() => {
  const base = "rk-drawer-content";
  const theme = $q.dark.isActive ? "dark" : "light";
  const state = mini.value ? "mini" : "expanded";
  return `${base} ${theme} ${state}`;
});

/* User */
const user = computed(() => auth.user);
const initials = computed(() => {
  const n = auth.user?.name || auth.user?.email || "";
  return n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => (s[0] || "").toUpperCase())
    .join("");
});
const avatarColorClass = computed(() => {
  const colors = ["primary", "secondary", "accent", "info", "warning"];
  const index = (user.value?.name?.length || 0) % colors.length;
  return `avatar-${colors[index]}`;
});
const roleBadge = computed(() => {
  const map = {
    admin: { color: "red", textColor: "white" },
    manager: { color: "orange", textColor: "dark" },
    user: { color: "primary", textColor: "white" },
    guest: { color: "grey", textColor: "white" },
  };
  return map[role.value?.toLowerCase()] || map.user;
});

/* Menu visible por permisos */
const visibleMenu = computed(() =>
  MENU.filter((g) => can(g.access))
    .map((g) => ({
      ...g,
      children: (g.children || []).filter((it) => can(it.access)),
    }))
    .filter((g) => (g.children && g.children.length) > 0)
);

/* SEARCH */
const search = ref("");
const highlightedIndex = ref(0);
const filteredFlat = computed(() => {
  const s = search.value.trim().toLowerCase();
  const items = [];
  visibleMenu.value.forEach((g) => {
    (g.children || []).forEach((it) =>
      items.push({ ...it, groupLabel: g.label, _id: `${g.id}-${it.label}` })
    );
  });
  if (!s) return items.slice(0, 50);
  return items
    .filter(
      (it) =>
        it.label?.toLowerCase().includes(s) ||
        it.description?.toLowerCase().includes(s) ||
        it.groupLabel?.toLowerCase().includes(s)
    )
    .slice(0, 50);
});

/* Persistencia de grupos y “recientes” (sin favoritos) */
const LS_KEYS = { groups: "rk_nav_groups", recents: "rk_nav_recents" };
const recents = ref(JSON.parse(localStorage.getItem(LS_KEYS.recents) || "[]")); // {_id,label,icon,to}
function persistRecents() {
  localStorage.setItem(LS_KEYS.recents, JSON.stringify(recents.value));
}

function loadExpandedGroups() {
  const saved = JSON.parse(localStorage.getItem(LS_KEYS.groups) || "{}");
  expandedGroups.value = saved;
}
function persistExpandedGroups() {
  localStorage.setItem(LS_KEYS.groups, JSON.stringify(expandedGroups.value));
}

/* Active utils */
function isActive(item) {
  const to = typeof item.to === "string" ? item.to : item.to?.path;
  if (!to) return false;
  return route.path === to || route.path.startsWith(to + "/");
}
function navItemClass(item) {
  return { active: isActive(item), mini, "has-badge": !!item.badge };
}

/* Keyboard nav en buscador */
function moveHighlight(dir) {
  const len = filteredFlat.value.length;
  highlightedIndex.value = (highlightedIndex.value + dir + len) % len;
}
function activateHighlighted() {
  const it = filteredFlat.value[highlightedIndex.value];
  if (it) navigateTo(it);
}

/* Navegación */
function navigateTo(item) {
  try {
    if (item.external) return window.open(item.to, "_blank", "noopener");
    const to = typeof item.to === "string" ? item.to : item.to?.path;
    if (to) router.push(to);

    // guardar recientes (no se muestran aquí, pero quedan listos si quieres usarlos)
    const id = item._id || item.to || item.label;
    const entry = {
      _id: id,
      label: item.label,
      icon: item.icon,
      to: to || item.to,
    };
    recents.value = [entry, ...recents.value.filter((r) => r._id !== id)].slice(
      0,
      8
    );
    persistRecents();

    if (mini.value) emit("update:modelValue", false);
  } catch (_) {}
}

/* Grupos */
function toggleGroup(groupId) {
  if (!mini.value) {
    expandedGroups.value[groupId] = !expandedGroups.value[groupId];
    persistExpandedGroups();
  }
}

/* Hover mini */
function onHover() {
  if (props.miniState) hovered.value = true;
}
function onLeave() {
  hovered.value = false;
}

/* Theme */
function toggleDark() {
  $q.dark.set(!$q.dark.isActive);
  $q.notify({
    message: $q.dark.isActive ? "Modo oscuro activado" : "Modo claro activado",
    color: "primary",
    position: "top-right",
  });
}

/* Notifs */
function goToNotifications() {
  router.push("/notificaciones");
}

/* Logout */
function onLogout() {
  $q.dialog({
    title: "Cerrar sesión",
    message: "¿Estás seguro de que quieres cerrar sesión?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await auth.logout(true);
    router.push("/");
  });
}

/* Keyboard global (Ctrl/Cmd+K para buscar) */
function onGlobalKey(e) {
  const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
  if (isCmdK) {
    e.preventDefault();
    if (!isOpen.value) emit("update:modelValue", true);
    nextTick(() => {
      const el = document.querySelector(".rk-search input");
      el?.focus();
    });
  }
}

/* Nav keyboard (flechas en la lista cuando no está el buscador enfocado) */
const navContainerRef = ref(null);
function onKeydownNav(e) {
  if (!isOpen.value || mini.value) return;
  const key = e.key.toLowerCase();
  if (["arrowup", "arrowdown"].includes(key)) {
    const focusables = Array.from(
      navContainerRef.value?.querySelectorAll('.rk-nav-item[tabindex="0"]') ||
        []
    );
    const currentIndex = focusables.findIndex(
      (el) => el === document.activeElement
    );
    const delta = key === "arrowdown" ? 1 : -1;
    const nextIndex = Math.max(
      0,
      Math.min(focusables.length - 1, currentIndex + delta)
    );
    focusables[nextIndex]?.focus();
    e.preventDefault();
  }
  if (key === "escape") {
    const input = document.querySelector(".rk-search input");
    if (input === document.activeElement) input.blur();
  }
}

/* Lifecycle */
onMounted(() => {
  visibleMenu.value.forEach((g) => {
    if (expandedGroups.value[g.id] == null) expandedGroups.value[g.id] = true;
  });
  loadExpandedGroups();
  window.addEventListener("keydown", onGlobalKey);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalKey);
});

/* React route change */
watch(
  () => route.path,
  () => {
    search.value = "";
    if ($q.screen.lt.md) emit("update:modelValue", false);
  }
);
</script>

<style scoped lang="scss">
/* (idéntico a tu versión, sin estilos de Favoritos) */
.rk-drawer {
  --rk-dark: #1a1a1a;
  --rk-light: #ffffff;
  --rk-glow: rgba(99, 102, 241, 0.25);
  position: relative;
  overflow: hidden;

  &-content {
    position: relative;
    z-index: 1;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    &.dark {
      background: linear-gradient(135deg, var(--rk-dark) 0%, #2d2d2d 100%);
      color: #fff;
    }
    &.light {
      background: linear-gradient(135deg, var(--rk-light) 0%, #f8fafc 100%);
      color: #1a1a1a;
    }
  }
}

.rk-drawer-header {
  padding: 1.2rem 1rem 0.8rem;
  position: relative;
  transition: all 0.3s ease;
  &.mini {
    padding: 0.8rem 0.5rem;
  }
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 1rem;
    right: 1rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
    opacity: 0.1;
  }
}
.rk-user-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.rk-avatar {
  position: relative;
  border: 2px solid;
  font-weight: 700;
  box-shadow: 0 4px 12px var(--rk-glow);
  transition: 0.2s;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px var(--rk-glow);
  }
}
.rk-avatar-glow {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: var(--rk-glow);
  opacity: 0;
  transition: 0.2s;
  .rk-avatar:hover & {
    opacity: 1;
  }
}

.rk-search {
  padding: 0.25rem 0.75rem 0.5rem;
  position: relative;
}
.rk-search-panel {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  margin-top: 0.35rem;
  max-height: 220px;
  overflow: auto;
}
.body--dark .rk-search-panel {
  background: rgba(255, 255, 255, 0.06);
}
.rk-search-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  cursor: pointer;
  border-radius: 8px;
  &:hover {
    background: var(--rk-glow);
  }
  &.active {
    background: rgba(99, 102, 241, 0.35);
    color: #fff;
  }
}
.rk-search-icon {
  opacity: 0.9;
}
.rk-search-info {
  flex: 1;
  min-width: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.rk-nav-scroll {
  height: calc(100vh - 250px);
}
.rk-nav-container {
  padding: 0.5rem 0.5rem 1rem;
}
.rk-group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  border-radius: 12px;
  transition: 0.2s;
  margin: 0.4rem 0 0.3rem;
  &:hover {
    background: var(--rk-glow);
    transform: translateX(4px);
  }
  &.mini {
    justify-content: center;
    padding: 0.6rem;
  }
}
.rk-group-icon {
  font-size: 1.2rem;
  opacity: 0.8;
}
.rk-group-label {
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.4px;
  opacity: 0.85;
}
.rk-group-items {
  margin-left: 0.5rem;
  padding-left: 0.5rem;
  border-left: 1px solid;
  opacity: 0.7;
}
.rk-nav-item {
  position: relative;
  margin-bottom: 0.25rem;
  border-radius: 10px;
  transition: 0.15s;
  cursor: pointer;
  outline: none;
  &:hover {
    background: var(--rk-glow);
    transform: translateX(8px);
    opacity: 1 !important;
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.45);
  }
  &.active {
    background: var(--q-primary);
    color: #fff;
    opacity: 1;
    .rk-active-indicator {
      opacity: 1;
      transform: scaleY(1);
    }
  }
}
.rk-item-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  position: relative;
  z-index: 1;
}
.rk-item-label {
  font-weight: 600;
  font-size: 0.92rem;
}
.rk-item-desc {
  font-size: 0.75rem;
  opacity: 0.75;
  margin-top: 0.1rem;
}
.rk-active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: scaleY(0) translateY(-50%);
  width: 3px;
  height: 60%;
  border-radius: 0 4px 4px 0;
  transition: 0.2s;
  opacity: 0;
}

.rk-group-separator {
  margin: 0.7rem 0;
  opacity: 0.1;
}

.rk-drawer-footer {
  padding: 1rem;
  position: relative;
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 1rem;
    right: 1rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
    opacity: 0.1;
  }
  &.mini {
    padding: 0.8rem 0.5rem;
  }
}
.rk-footer-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.rk-logout-btn {
  position: relative;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  transition: 0.2s;
  overflow: hidden;
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    transform: translateX(4px);
    .rk-logout-glow {
      opacity: 1;
    }
  }
}
.rk-logout-glow {
  position: absolute;
  inset: 0;
  background: rgba(239, 68, 68, 0.08);
  opacity: 0;
  transition: 0.2s;
}

.rk-drawer-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.rk-effect-1,
.rk-effect-2,
.rk-effect-3 {
  position: absolute;
  border-radius: 50%;
  background: var(--rk-glow);
  filter: blur(40px);
  opacity: 0.1;
}
.rk-effect-1 {
  width: 200px;
  height: 200px;
  top: -100px;
  right: -100px;
}
.rk-effect-2 {
  width: 150px;
  height: 150px;
  bottom: 50px;
  left: -50px;
}
.rk-effect-3 {
  width: 100px;
  height: 100px;
  bottom: 100px;
  right: 50px;
}

/* Anim / Responsive */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.rk-nav-item {
  animation: slideIn 0.25s ease forwards;
}
@media (max-width: 768px) {
  .rk-nav-scroll {
    height: calc(100vh - 220px);
  }
}
</style>
