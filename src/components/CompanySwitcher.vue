<template>
  <div v-if="visible" class="rk-company-pill">
    <!-- ───── Caso: NO switcher (admin_rrhh, employee, dt_inspector) ───── -->
    <!-- Solo avatar informativo, sin chevron, sin menú. -->
    <div
      v-if="!canSwitch"
      class="rk-pill-trigger is-static"
      role="img"
      :aria-label="`Empresa: ${activeName}`"
    >
      <div class="rk-pill-avatar" :style="activeAvatarStyle" aria-hidden="true">
        <span>{{ activeInitial }}</span>
      </div>
      <q-tooltip
        anchor="bottom middle"
        self="top middle"
        :offset="[0, 6]"
        class="rk-pill-tooltip"
      >
        <div class="rk-tooltip-inner">
          <strong>{{ activeName }}</strong>
          <span v-if="activeRut" class="rk-tooltip-rut">{{ activeRut }}</span>
        </div>
      </q-tooltip>
    </div>

    <!-- ───── Caso: superadmin (puede cambiar entre TODAS las empresas) ───── -->
    <div
      v-else
      class="rk-pill-trigger is-clickable"
      :class="{ 'is-disabled': switching, 'is-open': menuOpen, 'is-placeholder': !hasActive }"
      role="button"
      tabindex="0"
      :aria-label="hasActive ? `Empresa activa: ${activeName}. Cambiar empresa` : 'Seleccionar empresa'"
      aria-haspopup="menu"
      :aria-expanded="String(menuOpen)"
    >
      <div class="rk-pill-avatar" :style="activeAvatarStyle" aria-hidden="true">
        <span v-if="hasActive">{{ activeInitial }}</span>
        <q-icon v-else name="apartment" size="18px" />
      </div>
      <q-icon
        :name="menuOpen ? 'expand_less' : 'expand_more'"
        class="rk-pill-chevron"
      />
      <q-spinner v-if="switching" size="14px" class="rk-pill-spinner" />

      <q-tooltip
        v-if="!menuOpen"
        anchor="bottom middle"
        self="top middle"
        :offset="[0, 6]"
        class="rk-pill-tooltip"
      >
        <div class="rk-tooltip-inner">
          <strong>{{ hasActive ? activeName : 'Selecciona una empresa' }}</strong>
          <span v-if="activeRut" class="rk-tooltip-rut">{{ activeRut }}</span>
          <span class="rk-tooltip-hint">Click para cambiar · ⌘K</span>
        </div>
      </q-tooltip>

      <q-menu
        v-model="menuOpen"
        anchor="bottom left"
        self="top left"
        :offset="[0, 10]"
        class="rk-pill-menu"
        :disable="switching"
        @show="onMenuShow"
      >
        <!-- Header con buscador -->
        <div class="rk-menu-header">
          <q-icon name="apartment" />
          <div class="rk-menu-header-text">
            <span class="rk-menu-header-eyebrow">Cambiar empresa</span>
            <span class="rk-menu-header-hint">Plataforma · scope superadmin</span>
          </div>
        </div>

        <div class="rk-menu-search">
          <q-icon name="search" size="16px" />
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            placeholder="Buscar por nombre o RUT…"
            class="rk-menu-search-input"
            @keydown.esc.prevent="menuOpen = false"
          />
          <q-spinner v-if="loading" size="14px" />
        </div>

        <!-- Recientes (solo cuando no hay búsqueda activa) -->
        <div v-if="!query && recents.length" class="rk-menu-section">
          <div class="rk-menu-section-label">
            <q-icon name="history" size="12px" />
            Recientes
          </div>
          <q-list class="rk-menu-list">
            <q-item
              v-for="c in recents"
              :key="`recent-${c._id}`"
              clickable
              v-close-popup
              :active="isActive(c)"
              :disable="switching"
              class="rk-menu-item"
              @click="onPick(c)"
            >
              <q-item-section avatar>
                <div class="rk-menu-avatar" :style="getAvatarStyle(c)">
                  <span>{{ getInitial(c) }}</span>
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="rk-menu-name">{{ c.name || 'Sin nombre' }}</q-item-label>
                <q-item-label v-if="c.rut" caption class="rk-menu-rut">{{ c.rut }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon v-if="isActive(c)" name="check_circle" size="20px" class="rk-menu-check" />
                <q-icon v-else name="arrow_forward" size="16px" class="rk-menu-arrow" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Resultados -->
        <div class="rk-menu-section">
          <div class="rk-menu-section-label">
            <q-icon :name="query ? 'search' : 'list'" size="12px" />
            {{ query ? 'Resultados' : 'Todas las empresas' }}
            <span v-if="!loading" class="rk-menu-section-count">{{ results.length }}</span>
          </div>

          <div v-if="!loading && results.length === 0" class="rk-menu-empty">
            <q-icon name="search_off" size="20px" />
            <span>Sin resultados {{ query ? `para "${query}"` : '' }}</span>
          </div>

          <q-list v-else class="rk-menu-list">
            <q-item
              v-for="c in results"
              :key="`r-${c._id}`"
              clickable
              v-close-popup
              :active="isActive(c)"
              :disable="switching"
              class="rk-menu-item"
              @click="onPick(c)"
            >
              <q-item-section avatar>
                <div class="rk-menu-avatar" :style="getAvatarStyle(c)">
                  <span>{{ getInitial(c) }}</span>
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="rk-menu-name">{{ c.name || 'Sin nombre' }}</q-item-label>
                <q-item-label v-if="c.rut" caption class="rk-menu-rut">{{ c.rut }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon v-if="isActive(c)" name="check_circle" size="20px" class="rk-menu-check" />
                <q-icon v-else name="arrow_forward" size="16px" class="rk-menu-arrow" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-if="hasMore" class="rk-menu-footer">
          <span>Refiná la búsqueda para ver más resultados.</span>
        </div>
      </q-menu>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import secureAxios from '@/utils/secureRequest'
import { useAuthStore } from '@/stores/authStore'
import { getCompanyInitial, DEFAULT_BRAND } from '@/utils/companyBrand'

const RECENTS_KEY = 'recksy:recent-companies'
const RECENTS_MAX = 5
const SEARCH_LIMIT = 12

const authStore = useAuthStore()
const toast = useToast()

const menuOpen = ref(false)
const switching = ref(false)
const loading = ref(false)
const query = ref('')
const results = ref([])
const hasMore = ref(false)
const recents = ref(loadRecents())
const searchInput = ref(null)

const active = computed(() => authStore.activeCompany)
const role = computed(() => String(authStore.user?.role || ''))

const canSwitch = computed(() => role.value === 'superadmin')

// El componente se muestra siempre que haya un user logueado (y haya empresa activa
// o el usuario sea superadmin — que puede no tener empresa todavía).
const visible = computed(() => {
  if (!authStore.user) return false
  return hasActive.value || canSwitch.value
})

const hasActive = computed(() => {
  const a = active.value
  if (!a) return false
  if (typeof a === 'object') return !!(a.name || a._id || a.id)
  return true
})

const activeCompanyObj = computed(() => {
  const a = active.value
  if (!a) return null
  if (typeof a === 'object') return a
  return { name: '—', _id: a }
})

const activeName = computed(() => activeCompanyObj.value?.name || '—')
const activeRut = computed(() => activeCompanyObj.value?.rut || '')
const activeInitial = computed(() => getCompanyInitial(activeCompanyObj.value))

const activeAvatarStyle = computed(() => {
  if (!hasActive.value) {
    return {
      background: 'linear-gradient(135deg, #475569, #20242f)',
      color: '#ffffff',
      boxShadow: '0 4px 10px rgba(15, 23, 42, 0.25)',
    }
  }
  return getAvatarStyle(activeCompanyObj.value)
})

function getAvatarStyle() {
  // Mismo color cyan para todas las empresas (ignoramos el brandColor
  // por empresa aquí para mantener el switcher visualmente uniforme).
  const c = DEFAULT_BRAND
  return {
    background: `linear-gradient(135deg, ${c.bg}, ${c.bgAlt})`,
    color: c.fg,
    boxShadow: `0 4px 12px ${c.bg}55`,
  }
}

function getInitial(company) {
  return getCompanyInitial(company)
}

function isActive(c) {
  const cid = String(c?._id || c?.id || '')
  const a = active.value
  const aid = typeof a === 'object' ? String(a?._id || a?.id || '') : String(a || '')
  return cid && cid === aid
}

/* ───── Recentes (localStorage) ───── */
function loadRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter(c => c && c._id) : []
  } catch {
    return []
  }
}

function saveRecents(list) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, RECENTS_MAX)))
  } catch {}
}

function promoteRecent(company) {
  if (!company || !company._id) return
  const slim = {
    _id: String(company._id),
    name: company.name || '',
    rut: company.rut || '',
    brandColor: company.brandColor || '',
  }
  const next = [slim, ...recents.value.filter(c => String(c._id) !== slim._id)]
  recents.value = next.slice(0, RECENTS_MAX)
  saveRecents(recents.value)
}

/* ───── Search (debounced) ───── */
let inflight = null
let debounceTimer = null

async function runSearch(q) {
  if (inflight) inflight.abort()
  inflight = new AbortController()
  loading.value = true
  try {
    const { data } = await secureAxios.get('/companies/search', {
      params: { q, limit: SEARCH_LIMIT },
      signal: inflight.signal,
    })
    const items = Array.isArray(data?.items) ? data.items : []
    results.value = items
    hasMore.value = !!data?.hasMore
  } catch (err) {
    if (err?.name !== 'CanceledError' && err?.message !== 'canceled') {
      console.error('[CompanySwitcher] search error:', err)
      results.value = []
      hasMore.value = false
    }
  } finally {
    inflight = null
    loading.value = false
  }
}

watch(query, (q) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => runSearch(String(q || '').trim()), 220)
})

function onMenuShow() {
  // Foco al buscador y carga inicial (lista completa paginada).
  nextTick(() => {
    try { searchInput.value?.focus() } catch {}
  })
  if (results.value.length === 0) {
    runSearch('')
  }
}

/* ───── Pick ───── */
async function onPick(c) {
  const cid = c?._id || c?.id
  if (!cid || isActive(c)) { menuOpen.value = false; return }
  try {
    switching.value = true
    await authStore.switchCompany(cid)
    promoteRecent(c)
    toast.success(`Empresa activa: ${c.name || ''}`)
    menuOpen.value = false
    window.location.reload()
  } catch (e) {
    toast.error(e?.message || 'No se pudo cambiar de empresa')
  } finally {
    switching.value = false
  }
}

onMounted(() => {
  // Si superadmin tiene company activa al cargar, la promovemos a recientes.
  if (canSwitch.value && hasActive.value) promoteRecent(activeCompanyObj.value)
})
</script>

<style scoped>
.rk-company-pill {
  display: flex;
  align-items: center;
}

.rk-pill-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px 4px 4px;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 999px;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
  user-select: none;
}

.rk-pill-trigger.is-clickable {
  cursor: pointer;
}

.rk-pill-trigger.is-clickable:hover,
.rk-pill-trigger.is-clickable.is-open {
  background: rgba(15, 23, 42, 0.05);
  border-color: rgba(15, 23, 42, 0.08);
}

.body--dark .rk-pill-trigger.is-clickable:hover,
.body--dark .rk-pill-trigger.is-clickable.is-open {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.rk-pill-trigger.is-clickable:focus-visible {
  outline: 2px solid var(--color-primary, #0CA9C4);
  outline-offset: 2px;
}

.rk-pill-trigger.is-disabled {
  opacity: 0.6;
  cursor: progress;
  pointer-events: none;
}

.rk-pill-trigger.is-static {
  cursor: default;
}

.rk-pill-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.rk-pill-chevron {
  font-size: 18px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.08);
  color: rgba(15, 23, 42, 0.75);
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  margin-right: 2px;
}

.body--dark .rk-pill-chevron {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.85);
}

.rk-pill-trigger.is-clickable:hover .rk-pill-chevron {
  background: rgba(15, 23, 42, 0.14);
  color: rgba(15, 23, 42, 0.95);
}

.body--dark .rk-pill-trigger.is-clickable:hover .rk-pill-chevron {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.rk-pill-trigger.is-open .rk-pill-chevron {
  background: var(--color-primary, #0CA9C4);
  color: #ffffff;
  transform: rotate(180deg);
}

.rk-pill-spinner {
  margin-left: 2px;
}

@media (max-width: 599px) {
  .rk-pill-avatar { width: 32px; height: 32px; font-size: 0.78rem; }
}
</style>

<!-- Teleported elements (tooltip + menu) -->
<style>
.rk-pill-tooltip {
  background: rgba(15, 23, 42, 0.94) !important;
  color: #fff !important;
  border-radius: 10px;
  padding: 8px 12px;
  font-family: 'Sora', -apple-system, sans-serif;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.rk-pill-tooltip .rk-tooltip-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.25;
}

.rk-pill-tooltip strong {
  font-size: 0.88rem;
  font-weight: 800;
}

.rk-pill-tooltip .rk-tooltip-rut {
  font-size: 0.72rem;
  opacity: 0.7;
  font-weight: 600;
}

.rk-pill-tooltip .rk-tooltip-hint {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-weight: 600;
}

.rk-pill-menu {
  background: #ffffff;
  border: 1.5px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  font-family: 'Sora', -apple-system, sans-serif;
  width: 380px;
  max-width: 92vw;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.body--dark .rk-pill-menu {
  background: var(--card-background, #1a1e27);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.rk-pill-menu .rk-menu-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.85);
  flex-shrink: 0;
}

.body--dark .rk-pill-menu .rk-menu-header {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
}

.rk-pill-menu .rk-menu-header .q-icon {
  font-size: 20px;
  color: var(--color-primary, #0CA9C4);
}

.rk-pill-menu .rk-menu-header-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.rk-pill-menu .rk-menu-header-eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rk-pill-menu .rk-menu-header-hint {
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.6;
  margin-top: 2px;
}

/* Search */
.rk-pill-menu .rk-menu-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  color: rgba(15, 23, 42, 0.5);
  flex-shrink: 0;
}

.body--dark .rk-pill-menu .rk-menu-search {
  border-bottom-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
}

.rk-pill-menu .rk-menu-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(15, 23, 42, 0.92);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
}

.body--dark .rk-pill-menu .rk-menu-search-input {
  color: rgba(255, 255, 255, 0.92);
}

.rk-pill-menu .rk-menu-search-input::placeholder {
  color: rgba(15, 23, 42, 0.4);
  font-weight: 500;
}

.body--dark .rk-pill-menu .rk-menu-search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* Section */
.rk-pill-menu .rk-menu-section {
  padding: 8px;
  overflow-y: auto;
}

.rk-pill-menu .rk-menu-section + .rk-menu-section {
  border-top: 1px dashed rgba(15, 23, 42, 0.06);
}

.body--dark .rk-pill-menu .rk-menu-section + .rk-menu-section {
  border-top-color: rgba(255, 255, 255, 0.06);
}

.rk-pill-menu .rk-menu-section-label {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  font-size: 0.68rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.body--dark .rk-pill-menu .rk-menu-section-label {
  color: rgba(255, 255, 255, 0.45);
}

.rk-pill-menu .rk-menu-section-count {
  margin-left: auto;
  font-size: 0.66rem;
  font-weight: 700;
  padding: 1px 6px;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  letter-spacing: 0;
}

.body--dark .rk-pill-menu .rk-menu-section-count {
  background: rgba(255, 255, 255, 0.08);
}

.rk-pill-menu .rk-menu-list {
  background: transparent;
  padding: 0;
}

.rk-pill-menu .rk-menu-item {
  border-radius: 10px;
  padding: 8px 10px;
  min-height: 54px;
  transition: background 0.15s ease;
}

.rk-pill-menu .rk-menu-item:hover {
  background: rgba(15, 23, 42, 0.04);
}

.body--dark .rk-pill-menu .rk-menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.rk-pill-menu .rk-menu-item.q-item--active {
  background: rgba(15, 23, 42, 0.05);
}

.body--dark .rk-pill-menu .rk-menu-item.q-item--active {
  background: rgba(255, 255, 255, 0.07);
}

.rk-pill-menu .rk-menu-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.rk-pill-menu .rk-menu-name {
  font-size: 0.93rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.95);
}

.body--dark .rk-pill-menu .rk-menu-name {
  color: rgba(255, 255, 255, 0.95);
}

.rk-pill-menu .rk-menu-rut {
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.55);
  font-weight: 600;
  margin-top: 2px;
}

.body--dark .rk-pill-menu .rk-menu-rut {
  color: rgba(255, 255, 255, 0.55);
}

.rk-pill-menu .rk-menu-check {
  color: var(--color-primary, #0CA9C4);
}

.rk-pill-menu .rk-menu-arrow {
  color: rgba(15, 23, 42, 0.3);
  transition: transform 0.2s ease, color 0.2s ease;
}

.body--dark .rk-pill-menu .rk-menu-arrow {
  color: rgba(255, 255, 255, 0.3);
}

.rk-pill-menu .rk-menu-item:hover .rk-menu-arrow {
  color: var(--color-primary, #0CA9C4);
  transform: translateX(2px);
}

.rk-pill-menu .rk-menu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  color: rgba(15, 23, 42, 0.45);
  font-size: 0.82rem;
  font-weight: 600;
}

.body--dark .rk-pill-menu .rk-menu-empty {
  color: rgba(255, 255, 255, 0.45);
}

.rk-pill-menu .rk-menu-footer {
  padding: 8px 16px 12px;
  font-size: 0.7rem;
  color: rgba(15, 23, 42, 0.45);
  text-align: center;
  border-top: 1px solid rgba(15, 23, 42, 0.05);
  flex-shrink: 0;
}

.body--dark .rk-pill-menu .rk-menu-footer {
  color: rgba(255, 255, 255, 0.45);
  border-top-color: rgba(255, 255, 255, 0.05);
}
</style>
