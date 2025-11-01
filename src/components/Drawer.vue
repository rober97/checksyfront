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
    :content-class="drawerContentClass"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <!-- Header -->
    <div class="rk-drawer__header" :class="{ mini }">
      <div class="rk-user">
        <q-avatar size="48px" class="rk-user__avatar" :class="avatarColorClass">
          {{ initials }}
          <div class="rk-user__glow"></div>
        </q-avatar>

        <div v-if="!mini" class="rk-user__info">
          <div class="rk-user__name ellipsis">{{ user?.name || 'Usuario' }}</div>
          <q-badge :color="roleBadge.color" :text-color="roleBadge.textColor" class="rk-user__role">
            {{ role || 'Usuario' }}
          </q-badge>
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

    <!-- Navegación (SIN SCROLL) -->
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

                <!-- Aura / Beam -->
                <div class="rk-item__ambient"></div>
                <div class="rk-item__beam"></div>

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
        <div class="rk-logout__glow"></div>
      </q-btn>
    </div>

    <!-- FX de fondo -->
    <div class="rk-fx">
      <div class="rk-fx__a"></div>
      <div class="rk-fx__b"></div>
      <div class="rk-fx__c"></div>
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

/* Drawer state */
const hovered = ref(false)
const isOpen = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v)
})
const mini = computed(() => !!props.miniState && !hovered.value)

/* Content class + forzar animación del beam */
const forceBeam = true
const drawerContentClass = computed(() => {
  const theme = $q.dark.isActive ? 'dark' : 'light'
  const state = mini.value ? 'mini' : 'expanded'
  return `rk-drawer__content ${theme} ${state} ${forceBeam ? 'anim-force' : ''}`.trim()
})

/* User block */
const user = computed(() => auth.user)
const initials = computed(() => {
  const n = auth.user?.name || auth.user?.email || ''
  return n.trim().split(/\s+/).slice(0,2).map(s => (s[0]||'').toUpperCase()).join('')
})
const avatarColorClass = computed(() => {
  const colors = ['primary','secondary','accent','info','warning']
  const idx = (user.value?.name?.length || 0) % colors.length
  return `avatar-${colors[idx]}`
})
const roleBadge = computed(() => {
  const map = {
    admin:   { color: 'red',       textColor: 'white' },
    manager: { color: 'orange',    textColor: 'dark'  },
    user:    { color: 'primary',   textColor: 'white' },
    guest:   { color: 'grey',      textColor: 'white' }
  }
  return map[role.value?.toLowerCase()] || map.user
})

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
  const saved = JSON.parse(localStorage.getItem(LS_KEYS.groups) || '{}')
  expandedGroups.value = saved
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
  visibleMenu.value.forEach(g => { if (expandedGroups.value[g.id] == null) expandedGroups.value[g.id] = true })
  loadExpandedGroups()
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
/* ===== Tokens ===== */
.rk-drawer {
  --rk-dark: #1a1a1a;
  --rk-light: #ffffff;
  --rk-glow: rgba(99,102,241,.24);
  --rk-border: rgba(255,255,255,.08);
  --rk-beam-speed: 1.45s;
  --rk-beam-strength: .95;
  --rk-beam-blur: 18px;

  position: relative;
  overflow: hidden; /* SIN SCROLL global */
}

.rk-drawer__content{
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: hidden; /* SIN SCROLL en el contenido */
  &.dark{  background: linear-gradient(135deg, var(--rk-dark) 0%, #222 100%); color:#fff; }
  &.light{ background: linear-gradient(135deg, var(--rk-light) 0%, #f7f9fc 100%); color:#111; }
}

/* ===== Header ===== */
.rk-drawer__header{
  padding: 16px 12px 10px;
  border-bottom: 1px solid var(--rk-border);
  &.mini{ padding: 12px 8px 8px; }
}
.rk-user{ display:flex; align-items:center; gap:.75rem; }
.rk-user__avatar{
  position:relative; font-weight:700; border:2px solid; box-shadow:0 4px 12px var(--rk-glow);
}
.rk-user__glow{ position:absolute; inset:-2px; border-radius:50%; background:var(--rk-glow); opacity:0; transition:.2s }
.rk-user__avatar:hover .rk-user__glow{ opacity:1 }
.rk-user__name{ font-weight:700; line-height:1.2 }
.rk-user__role{ margin-top:2px }

/* ===== Search ===== */
.rk-search{ padding:10px 12px 8px }
.rk-search__panel{
  margin-top:6px; border-radius:10px; background:rgba(255,255,255,.06);
  padding:6px; max-height:220px; overflow:auto;
}
.rk-search__item{
  display:flex; align-items:center; gap:.6rem; padding:.5rem .6rem; border-radius:8px; cursor:pointer;
}
.rk-search__item:hover{ background:rgba(99,102,241,.18) }
.rk-search__item.active{ background:rgba(99,102,241,.32); color:#fff }
.rk-search__info{ flex:1; min-width:0 }
.rk-search__label{ font-weight:600 }
.rk-search__desc{ font-size:.75rem; opacity:.8 }

.fade-enter-active,.fade-leave-active{ transition:opacity .12s ease }
.fade-enter-from,.fade-leave-to{ opacity:0 }

/* ===== Nav (SIN SCROLL) ===== */
.rk-nav{
  height: calc(100% - 216px); /* header + search + footer aprox. ajusta si cambias alturas */
  padding: 6px 8px 10px;
  overflow: hidden; /* SIN SCROLL */
  position: relative;
}
.rk-nav__group{ padding: 2px 2px 8px }
.rk-group__head{
  display:flex; align-items:center; gap:.75rem; padding:.6rem .75rem; border-radius:12px; cursor:pointer; transition:.2s;
}
.rk-group__head:hover{ background: var(--rk-glow); transform: translateX(4px) }
.rk-group__head.mini{ justify-content:center; padding:.6rem }
.rk-group__icon{ font-size:1.2rem; opacity:.85 }
.rk-group__label{ font-weight:800; font-size:.86rem; letter-spacing:.2px; opacity:.9 }
.rk-group__items{ margin-left:.5rem; padding-left:.5rem; border-left:1px solid var(--rk-border) }

.rk-item{
  position:relative; margin: 2px 0; border-radius:10px; cursor:pointer; outline:none; transition:.15s;
}
.rk-item:hover{ background: rgba(99,102,241,.20); transform: translateX(6px) }
.rk-item.active{ background: var(--q-primary); color:#fff }
.rk-item__content{ display:flex; align-items:center; gap:.75rem; padding:.7rem .9rem; position:relative; z-index:1 }
.rk-item__label{ font-weight:700; font-size:.92rem }
.rk-item__desc{ font-size:.75rem; opacity:.8; margin-top:.1rem }
.rk-item__icon{ opacity:.95 }
.rk-item__badge{ margin-left:auto }

.rk-sep{ margin: 8px 0; opacity:.12 }

/* ===== Aura / Beam (2025) ===== */
.rk-item__ambient{
  position:absolute; inset:-14% -10%; pointer-events:none; z-index:0;
  opacity:0; filter: blur(18px) saturate(1.06); mix-blend-mode: screen;
  background:
    radial-gradient(60% 70% at 15% 50%, color-mix(in oklab, var(--q-primary) 26%, transparent) 14%, transparent 64%),
    radial-gradient(70% 80% at 85% 50%, color-mix(in oklab, var(--q-primary) 18%, transparent) 12%, transparent 62%);
  transition: opacity .22s ease;
}
.rk-item:hover .rk-item__ambient,
.rk-item.active .rk-item__ambient,
.rk-item:focus-visible .rk-item__ambient{ opacity:.32 }

.rk-item__beam{
  position:absolute; top:-30%; bottom:-30%; left:-60%; width:80%;
  pointer-events:none; z-index:0; opacity:0;
  transform: translateX(-70%) skewX(-14deg);
  filter: blur(var(--rk-beam-blur)) saturate(1.08);
  mix-blend-mode: screen; will-change: transform, opacity;
  background:
    linear-gradient(90deg,
      transparent 0%,
      color-mix(in oklab, var(--q-primary) 42%, white) 45%,
      white 50%,
      color-mix(in oklab, var(--q-primary) 42%, white) 55%,
      transparent 100%
    ),
    radial-gradient(90% 120% at 30% 50%,
      color-mix(in oklab, var(--q-primary) 38%, transparent) 0%,
      transparent 70%);
  background-repeat: no-repeat;
  background-size: 75% 100%, 100% 100%;
  transition: opacity .16s ease;
}
.rk-item.active .rk-item__beam{
  opacity: calc(.95 * var(--rk-beam-strength));
  animation: rk-beam-sweep var(--rk-beam-speed) cubic-bezier(.22,.61,.36,1) infinite;
}
.rk-item:hover:not(.active) .rk-item__beam{
  opacity: calc(.60 * var(--rk-beam-strength));
  animation: rk-beam-sweep calc(var(--rk-beam-speed)*1.15) cubic-bezier(.22,.61,.36,1) 1;
}
.rk-item:focus-visible .rk-item__beam{
  opacity: calc(.62 * var(--rk-beam-strength));
  animation: rk-beam-sweep calc(var(--rk-beam-speed)*1.1) cubic-bezier(.22,.61,.36,1) 1;
}

/* Recorrido del haz de IZQ → DER (sin pegarse a borde) */
@keyframes rk-beam-sweep{
  0%   { transform: translateX(-70%)  skewX(-14deg); }
  55%  { transform: translateX(15%)   skewX(-14deg); }
  100% { transform: translateX(118%)  skewX(-14deg); }
}

/* Fallback por si GPU bloquea transform: animación por background-position */
.rk-item.active .rk-item__beam.rk-fallback{
  background: linear-gradient(110deg, transparent 0, rgba(255,255,255,.4) 45%, white 50%, rgba(255,255,255,.4) 55%, transparent 100%);
  background-size: 220% 100%;
  animation: rk-beam-pos 1.7s linear infinite;
}
@keyframes rk-beam-pos{
  0%   { background-position: -40% 0; }
  100% { background-position: 140% 0; }
}

/* Forzar animación aunque el SO tenga reduce-motion */
@media (prefers-reduced-motion: reduce){
  .anim-force .rk-item.active .rk-item__beam,
  .anim-force .rk-item:hover:not(.active) .rk-item__beam,
  .anim-force .rk-item:focus-visible .rk-item__beam{
    animation: rk-beam-sweep var(--rk-beam-speed) linear infinite !important;
    opacity: calc(.9 * var(--rk-beam-strength)) !important;
  }
}

/* ===== Footer ===== */
.rk-drawer__footer{
  padding: 14px 12px;
  border-top: 1px solid var(--rk-border);
  position: absolute; left:0; right:0; bottom:0;
}
.rk-logout{
  position:relative; width:100%; justify-content:flex-start;
  border-radius:10px; padding:.7rem .9rem; transition:.2s; overflow:hidden;
}
.rk-logout:hover{ background: rgba(239,68,68,.10); color:#ef4444; transform: translateX(4px) }
.rk-logout__glow{ position:absolute; inset:0; background: rgba(239,68,68,.08); opacity:0; transition:.2s }
.rk-logout:hover .rk-logout__glow{ opacity:1 }
.rk-logout__icon{ margin-right:8px }

/* ===== FX de fondo ===== */
.rk-fx{ position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0 }
.rk-fx__a,.rk-fx__b,.rk-fx__c{
  position:absolute; border-radius:50%; background:var(--rk-glow); filter: blur(40px); opacity:.10;
}
.rk-fx__a{ width:200px; height:200px; top:-100px; right:-100px }
.rk-fx__b{ width:150px; height:150px; bottom:50px; left:-50px }
.rk-fx__c{ width:100px; height:100px; bottom:100px; right:50px }

/* ===== Theme helpers ===== */
.avatar-primary   { color:#fff; background:#3f51b5 }
.avatar-secondary { color:#fff; background:#9c27b0 }
.avatar-accent    { color:#fff; background:#ff4081 }
.avatar-info      { color:#fff; background:#00acc1 }
.avatar-warning   { color:#111; background:#ffca28 }
</style>
