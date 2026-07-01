<!-- src/components/Drawer.vue -->
<template>
  <q-drawer
    v-model="isOpen"
    show-if-above
    bordered
    :mini="mini"
    :width="280"
    :breakpoint="768"
    class="rk-drawer full-height"
    content-class="rk-drawer__content"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <!-- Shell propio: aquí viven los tokens de tema y el fondo. Envolver en un
         nodo del template (no el de Quasar) garantiza que los estilos scoped
         apliquen y que las variables --rk-* se hereden a todo el menú. -->
    <div class="rk-shell" :class="{ dark: isDark, light: !isDark, mini }">
      <!-- Header -->
      <div class="rk-drawer__header" :class="{ mini }">
        <div class="rk-user">
          <q-avatar size="44px" class="rk-user__avatar" :class="avatarColorClass">
            {{ initials }}
            <div class="rk-user__glow"></div>
          </q-avatar>

          <div v-if="!mini" class="rk-user__info">
            <div class="rk-user__name ellipsis">{{ fullName }}</div>
            <span class="rk-user__role">{{ roleLabel }}</span>
          </div>
        </div>

        <!-- Buscar (Ctrl/Cmd+K) -->
        <div v-if="!mini" class="rk-search">
          <transition name="fade">
            <div v-if="search && filteredFlat.length" class="rk-search__panel">
              <div
                v-for="(it, idx) in filteredFlat"
                :key="it._id"
                class="rk-search__item"
                :class="{ active: idx === highlightedIndex }"
                @click="navigateTo(it)"
                @mouseenter="highlightedIndex = idx"
                role="button"
                tabindex="0"
              >
                <q-icon :name="it.icon" class="rk-search__icon" />
                <div class="rk-search__info">
                  <div class="rk-search__label ellipsis">{{ it.label }}</div>
                  <div class="rk-search__desc ellipsis">{{ it.description || it.groupLabel }}</div>
                </div>
                <q-badge v-if="it.badge" :color="it.badgeColor || 'primary'" rounded>{{ it.badge }}</q-badge>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Navegación -->
      <div
        class="rk-nav"
        ref="navContainerRef"
        tabindex="0"
        @keydown="onKeydownNav"
      >
        <template v-for="(group, gi) in visibleMenu" :key="group.id">
          <div class="rk-nav__group" v-if="group.children?.length">
            <div
              class="rk-group__head"
              :class="{ mini }"
              @click="toggleGroup(group.id)"
              :aria-expanded="!!expandedGroups[group.id]"
              role="button"
              tabindex="0"
              @keyup.enter="toggleGroup(group.id)"
            >
              <q-icon :name="group.icon" class="rk-group__icon" />
              <span v-if="!mini" class="rk-group__label">{{ group.label }}</span>
              <q-icon
                v-if="!mini"
                :name="expandedGroups[group.id] ? 'expand_less' : 'expand_more'"
                class="rk-group__expand"
              />
            </div>

            <q-slide-transition>
              <div v-show="expandedGroups[group.id] || mini" class="rk-group__items">
                <div
                  v-for="(item, ii) in group.children"
                  :key="`${group.id}-${ii}`"
                  class="rk-item"
                  :class="navItemClass(item)"
                  @click="navigateTo(item)"
                  v-ripple
                  :aria-current="isActive(item) ? 'page' : undefined"
                  role="link"
                  tabindex="0"
                  @keyup.enter="navigateTo(item)"
                >
                  <div class="rk-item__content">
                    <q-icon :name="item.icon" class="rk-item__icon" />
                    <div v-if="!mini" class="rk-item__info">
                      <div class="rk-item__label ellipsis">{{ item.label }}</div>
                      <div v-if="item.description" class="rk-item__desc ellipsis">{{ item.description }}</div>
                    </div>
                    <div v-if="item.badge && !mini" class="rk-item__badge">
                      <q-badge :color="item.badgeColor || 'primary'" rounded>{{ item.badge }}</q-badge>
                    </div>
                  </div>

                  <q-tooltip
                    v-if="mini"
                    anchor="center right"
                    self="center left"
                    class="rk-tooltip"
                  >
                    <div class="rk-tooltip__title">{{ item.label }}</div>
                    <div v-if="item.description" class="rk-tooltip__desc">{{ item.description }}</div>
                  </q-tooltip>
                </div>
              </div>
            </q-slide-transition>
          </div>

          <q-separator v-if="gi < visibleMenu.length - 1" class="rk-sep" />
        </template>
      </div>

      <!-- Footer -->
      <div class="rk-drawer__footer" :class="{ mini }">
        <q-btn flat no-caps class="rk-logout" @click="onLogout">
          <q-icon name="logout" class="rk-logout__icon" />
          <span v-if="!mini" class="rk-logout__text">Cerrar sesión</span>
        </q-btn>
      </div>
    </div>
  </q-drawer>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useAccess } from '../composables/useAccess'
import { MENU } from '../navigation/menu'

/* Props/Emits */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  miniState:  { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

/* Deps */
const $q = useQuasar()
const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const { role, can } = useAccess()

/* Tema (claro/oscuro) — el menú sigue el tema global de la app. */
const isDark = computed(() => $q.dark.isActive)

/* Drawer state */
const hovered = ref(false)
const isOpen = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v)
})
const mini = computed(() => !!props.miniState && !hovered.value)

/* User block */
const user = computed(() => auth.user)
const fullName = computed(() => {
  const fn = (user.value?.firstName || '').trim()
  const ln = (user.value?.lastName || '').trim()
  const composed = `${fn} ${ln}`.trim()
  return composed || user.value?.name || user.value?.email || 'Usuario'
})
const initials = computed(() => {
  const fn = user.value?.firstName || ''
  const ln = user.value?.lastName || ''
  const fromNames = ((fn[0] || '') + (ln[0] || '')).toUpperCase()
  if (fromNames) return fromNames
  const n = user.value?.name || user.value?.email || ''
  return n.trim().split(/\s+/).slice(0,2).map(s => (s[0]||'').toUpperCase()).join('')
})
const avatarColorClass = computed(() => {
  const colors = ['primary','secondary','accent','info','warning']
  const idx = (fullName.value?.length || 0) % colors.length
  return `avatar-${colors[idx]}`
})

/* Etiqueta de rol legible (el código interno no se muestra al usuario) */
const ROLE_LABELS = {
  admin_rrhh: 'Administrador RR.HH.',
  superadmin: 'Superadministrador',
  admin: 'Administrador',
  employee: 'Colaborador',
  dt_inspector: 'Fiscalizador DT',
}
const roleLabel = computed(
  () => ROLE_LABELS[String(role.value || '').toLowerCase()] || 'Usuario'
)

/* Menu visible por permisos */
const visibleMenu = computed(() =>
  MENU.filter(g => can(g.access))
      .map(g => ({ ...g, children: (g.children || []).filter(it => can(it.access)) }))
      .filter(g => (g.children && g.children.length) > 0)
)

/* Buscar (Ctrl/Cmd+K) */
const search = ref('')
const highlightedIndex = ref(0)
const filteredFlat = computed(() => {
  const s = search.value.trim().toLowerCase()
  const items = []
  visibleMenu.value.forEach(g => (g.children || []).forEach(it => items.push({ ...it, groupLabel: g.label, _id: `${g.id}-${it.label}` })))
  if (!s) return items.slice(0, 50)
  return items.filter(it =>
    it.label?.toLowerCase().includes(s) ||
    it.description?.toLowerCase().includes(s) ||
    it.groupLabel?.toLowerCase().includes(s)
  ).slice(0, 50)
})

/* Expanded groups persistencia */
const expandedGroups = ref({})
const LS_KEYS = { groups: 'rk_nav_groups' }
function loadExpandedGroups(){
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEYS.groups) || '{}')
    // sanitize: drop legacy "undefined" key from older versions when groups had no id
    if (saved && typeof saved === 'object') delete saved.undefined
    expandedGroups.value = saved || {}
  } catch (_) {
    expandedGroups.value = {}
  }
}
function persistExpandedGroups(){
  localStorage.setItem(LS_KEYS.groups, JSON.stringify(expandedGroups.value))
}

/* Active utils */
const navContainerRef = ref(null)
function isActive(item){
  const to = typeof item.to === 'string' ? item.to : item.to?.path
  if (!to) return false
  return route.path === to || route.path.startsWith(to + '/')
}
function navItemClass(item){
  return { active: isActive(item), mini: mini.value, 'has-badge': !!item.badge }
}

/* Keyboard navegación en buscador de quick list */
function moveHighlight(dir){
  const len = filteredFlat.value.length
  highlightedIndex.value = (highlightedIndex.value + dir + len) % len
}
function activateHighlighted(){
  const it = filteredFlat.value[highlightedIndex.value]
  if (it) navigateTo(it)
}

/* Navegación */
function navigateTo(item){
  try{
    if (item.external) return window.open(item.to, '_blank', 'noopener')
    const to = typeof item.to === 'string' ? item.to : item.to?.path
    if (to) router.push(to)
    if (mini.value) emit('update:modelValue', false)
  }catch(_){}
}

/* Toggle groups */
function toggleGroup(id){
  if (!mini.value){
    expandedGroups.value[id] = !expandedGroups.value[id]
    persistExpandedGroups()
  }
}

/* Hover handlers */
function onEnter(){ if (props.miniState) hovered.value = true }
function onLeave(){ hovered.value = false }

/* Logout */
function onLogout(){
  $q.dialog({
    title: 'Cerrar sesión',
    message: '¿Estás seguro de que quieres cerrar sesión?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await auth.logout(true)
    router.push('/')
  })
}

/* Global hotkey Ctrl/Cmd+K */
function onGlobalKey(e){
  const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'
  if (isCmdK){
    e.preventDefault()
    if (!isOpen.value) emit('update:modelValue', true)
    nextTick(() => document.querySelector('.rk-search input')?.focus())
  }
}

/* Keyboard nav en la lista cuando no hay buscador activo */
function onKeydownNav(e){
  if (!isOpen.value || mini.value) return
  const key = e.key.toLowerCase()
  if (key === 'arrowdown' || key === 'arrowup'){
    const focusables = Array.from(
      navContainerRef.value?.querySelectorAll('.rk-item[tabindex="0"]') || []
    )
    const current = focusables.findIndex(el => el === document.activeElement)
    const delta = key === 'arrowdown' ? 1 : -1
    const next = Math.max(0, Math.min(focusables.length - 1, current + delta))
    focusables[next]?.focus()
    e.preventDefault()
  }
  if (key === 'escape'){
    const input = document.querySelector('.rk-search input')
    if (input === document.activeElement) input.blur()
  }
}

/* Lifecycle */
onMounted(() => {
  // load persisted state first, then default any new groups to expanded
  loadExpandedGroups()
  visibleMenu.value.forEach(g => {
    if (g.id && expandedGroups.value[g.id] == null) expandedGroups.value[g.id] = true
  })
  persistExpandedGroups()
  window.addEventListener('keydown', onGlobalKey)
})
onBeforeUnmount(() => { window.removeEventListener('keydown', onGlobalKey) })

/* Route change close on mobile */
watch(() => route.path, () => {
  search.value = ''
  if ($q.screen.lt.md) emit('update:modelValue', false)
})
</script>

<style scoped lang="scss">
/* =========================================================================
   Drawer — menú profesional, adaptable a tema claro y oscuro.
   Los tokens --rk-* se definen por tema en .rk-shell y se heredan a todo.
   ========================================================================= */

/* Neutraliza padding/scroll propios del nodo de Quasar para que mande el shell */
:deep(.rk-drawer__content){ padding: 0; }

.rk-shell{
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  position: relative;
  overflow: hidden;

  /* ---- Acento de marca (común a ambos temas) ---- */
  --rk-accent: var(--color-primary, #0CA9C4);
  --rk-accent-soft: color-mix(in srgb, var(--color-primary, #0CA9C4) 14%, transparent);
  --rk-accent-line: color-mix(in srgb, var(--color-primary, #0CA9C4) 50%, transparent);
}

/* ================= TEMA OSCURO ================= */
.rk-shell.dark{
  --rk-text: rgba(255,255,255,.92);
  --rk-text-dim: rgba(255,255,255,.62);
  --rk-text-faint: rgba(255,255,255,.42);
  --rk-border: rgba(255,255,255,.08);
  --rk-hover: rgba(255,255,255,.06);
  --rk-footer-bg: #0e0f13;
  --rk-active-label: #ffffff;
  --rk-scroll: rgba(148,163,184,.30);

  background: linear-gradient(180deg, #191c22 0%, #14161b 58%, #0e0f13 100%);
  color: var(--rk-text);
}

/* ================= TEMA CLARO ================= */
.rk-shell.light{
  --rk-text: #1e293b;
  --rk-text-dim: #475569;
  --rk-text-faint: #8a97a8;
  --rk-border: rgba(15,23,42,.09);
  --rk-hover: rgba(15,23,42,.045);
  --rk-footer-bg: #ffffff;
  --rk-active-label: #0f172a;
  --rk-scroll: rgba(100,116,139,.35);

  background: linear-gradient(180deg, #ffffff 0%, #f7f9fb 100%);
  color: var(--rk-text);
}

/* Header y footer no se encogen; el nav se lleva el resto */
.rk-drawer__header{ flex: 0 0 auto; }
.rk-drawer__footer{ flex: 0 0 auto; }

/* ===== Header / usuario ===== */
.rk-drawer__header{
  padding: 18px 14px 12px;
  border-bottom: 1px solid var(--rk-border);
  &.mini{ padding: 14px 8px 10px; }
}
.rk-user{ display:flex; align-items:center; gap:.7rem; }
.rk-user__avatar{
  position:relative; font-weight:700; font-size:.95rem;
  box-shadow: 0 2px 10px rgba(0,0,0,.18);
}
.rk-user__glow{
  position:absolute; inset:-2px; border-radius:50%;
  box-shadow: 0 0 0 2px var(--rk-accent-soft);
  opacity:0; transition:.2s;
}
.rk-user__avatar:hover .rk-user__glow{ opacity:1 }
.rk-user__info{ min-width:0 }
.rk-user__name{ font-weight:700; font-size:.95rem; line-height:1.25; color: var(--rk-active-label) }
.rk-user__role{
  display:inline-block; margin-top:4px;
  padding: 2px 8px; border-radius:999px;
  font-size:.66rem; font-weight:700; letter-spacing:.04em;
  color: var(--rk-accent);
  background: var(--rk-accent-soft);
  border: 1px solid var(--rk-accent-line);
}

/* ===== Buscador (quick list) ===== */
.rk-search{ padding:12px 14px 4px }
.rk-search__panel{
  margin-top:6px; border-radius:12px; background: var(--rk-hover);
  border:1px solid var(--rk-border);
  padding:6px; max-height:230px; overflow:auto;
}
.rk-search__item{
  display:flex; align-items:center; gap:.6rem; padding:.5rem .6rem; border-radius:9px; cursor:pointer;
  transition: background .15s ease;
}
.rk-search__item:hover{ background: var(--rk-hover) }
.rk-search__item.active{ background: var(--rk-accent-soft) }
.rk-search__icon{ color: var(--rk-text-dim) }
.rk-search__info{ flex:1; min-width:0 }
.rk-search__label{ font-weight:600; font-size:.85rem; color: var(--rk-active-label) }
.rk-search__desc{ font-size:.72rem; color: var(--rk-text-faint) }

.fade-enter-active,.fade-leave-active{ transition:opacity .12s ease }
.fade-enter-from,.fade-leave-to{ opacity:0 }

/* ===== Nav ===== */
.rk-nav{
  flex: 1 1 auto;
  min-height: 0;
  padding: 10px 10px 12px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  scrollbar-gutter: stable;
  transition: scrollbar-color .25s ease;
}
.rk-nav:hover{ scrollbar-color: var(--rk-scroll) transparent; }
.rk-nav::-webkit-scrollbar{ width: 6px; }
.rk-nav::-webkit-scrollbar-track{ background: transparent; }
.rk-nav::-webkit-scrollbar-thumb{
  background: transparent; border-radius: 99px;
  border: 2px solid transparent; background-clip: padding-box;
  transition: background-color .25s ease;
}
.rk-nav:hover::-webkit-scrollbar-thumb{ background: var(--rk-scroll); background-clip: padding-box; }
.rk-nav:hover::-webkit-scrollbar-thumb:hover{ background: var(--rk-accent-line); background-clip: padding-box; }

.rk-nav__group{ padding: 2px 0 10px }

/* Cabecera de sección: rótulo tipo overline, sobrio */
.rk-group__head{
  display:flex; align-items:center; gap:.6rem;
  padding:.45rem .55rem; margin-bottom:2px;
  border-radius:8px; cursor:pointer;
  transition: background .15s ease, color .15s ease;
  color: var(--rk-text-faint);
}
.rk-group__head:hover{ background: var(--rk-hover); color: var(--rk-text-dim) }
.rk-group__head.mini{ justify-content:center; padding:.5rem; color: var(--rk-text-dim) }
.rk-group__icon{ font-size:1.05rem }
.rk-group__label{
  flex:1; font-weight:700; font-size:.68rem; letter-spacing:.13em; text-transform:uppercase;
}
.rk-group__expand{ font-size:1.1rem; opacity:.7 }
/* Sangría para que los ítems se lean claramente como submenú de la sección */
.rk-group__items{ display:flex; flex-direction:column; gap:1px; margin-top:2px; padding-left:1.45rem }
/* En mini-mode los íconos van centrados: sin sangría */
.rk-shell.mini .rk-group__items{ padding-left:0 }

/* ===== Item ===== */
.rk-item{
  position:relative; border-radius:9px; cursor:pointer; outline:none;
  transition: background .15s ease, color .15s ease;
}
.rk-item__content{
  display:flex; align-items:center; gap:.65rem;
  padding:.48rem .6rem; position:relative; z-index:1;
}
.rk-item__icon{ font-size:1.05rem; color: var(--rk-text-dim); transition: color .15s ease }
.rk-item__info{ min-width:0; flex:1 }
.rk-item__label{ font-weight:500; font-size:.8rem; color: var(--rk-text); transition: color .15s ease }
.rk-item__desc{ font-size:.68rem; color: var(--rk-text-faint); margin-top:.1rem }
.rk-item__badge{ margin-left:auto }

/* Hover */
.rk-item:hover{ background: var(--rk-hover) }
.rk-item:hover .rk-item__icon,
.rk-item:hover .rk-item__label{ color: var(--rk-active-label) }

/* Foco accesible por teclado */
.rk-item:focus-visible{ box-shadow: inset 0 0 0 1.5px var(--rk-accent-line); }

/* Activo: fondo tenue de marca + ícono y label en acento (sin barra lateral) */
.rk-item.active{ background: var(--rk-accent-soft) }
.rk-item.active .rk-item__label{ color: var(--rk-active-label); font-weight:600 }
.rk-item.active .rk-item__icon{ color: var(--rk-accent) }

/* Mini: sólo íconos centrados */
.rk-item.mini .rk-item__content{ justify-content:center; padding:.6rem }

.rk-sep{ margin: 4px 6px; background: var(--rk-border); }

/* ===== Tooltip (mini) ===== */
.rk-tooltip{
  background: #0b0c10; color:#fff; border:1px solid rgba(255,255,255,.1);
  border-radius:8px; padding:8px 10px; box-shadow:0 8px 24px rgba(0,0,0,.4);
}
.rk-tooltip__title{ font-weight:700; font-size:.82rem }
.rk-tooltip__desc{ font-size:.72rem; color: rgba(255,255,255,.6); margin-top:2px }

/* ===== Footer ===== */
.rk-drawer__footer{
  padding: 12px 14px;
  border-top: 1px solid var(--rk-border);
  background: var(--rk-footer-bg);
}
.rk-logout{
  width:100%; justify-content:flex-start;
  border-radius:9px; padding:.6rem .8rem;
  color: var(--rk-text-dim);
  transition: background .15s ease, color .15s ease;
}
.rk-logout:hover{ background: rgba(239,68,68,.12); color:#e11d48 }
.rk-logout__icon{ margin-right:10px; font-size:1.2rem }
.rk-logout__text{ font-weight:600; font-size:.875rem }

/* ===== Avatares (color por inicial) ===== */
.avatar-primary   { color:#fff; background:var(--color-primary-dark, #0893AA) }
.avatar-secondary { color:#fff; background:var(--color-accent, #0893AA) }
.avatar-accent    { color:#fff; background:var(--color-accent-dark, #067C90) }
.avatar-info      { color:#fff; background:var(--color-info, #0893AA) }
.avatar-warning   { color:#111; background:#ffca28 }
</style>
