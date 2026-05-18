<template>
  <div v-if="hasActive" class="rk-company-pill">
    <div
      class="rk-pill-trigger"
      :class="{
        'is-clickable': canSwitch,
        'is-disabled': switching,
        'is-open': menuOpen,
      }"
      role="button"
      :tabindex="canSwitch ? 0 : -1"
      :aria-label="canSwitch ? `Empresa activa: ${activeName}. Cambiar empresa` : `Empresa activa: ${activeName}`"
      :aria-haspopup="canSwitch ? 'menu' : undefined"
      :aria-expanded="canSwitch ? String(menuOpen) : undefined"
    >
      <div class="rk-pill-avatar" :style="activeAvatarStyle" aria-hidden="true">
        <span>{{ activeInitial }}</span>
      </div>
      <q-icon
        v-if="canSwitch"
        name="expand_more"
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
          <strong>{{ activeName }}</strong>
          <span v-if="activeRut" class="rk-tooltip-rut">{{ activeRut }}</span>
          <span v-if="canSwitch" class="rk-tooltip-hint">Click para cambiar · ⌘K</span>
        </div>
      </q-tooltip>

      <q-menu
        v-if="canSwitch"
        v-model="menuOpen"
        anchor="bottom left"
        self="top left"
        :offset="[0, 10]"
        class="rk-pill-menu"
        :disable="switching"
      >
        <div class="rk-menu-header">
          <q-icon name="apartment" />
          <div class="rk-menu-header-text">
            <span class="rk-menu-header-eyebrow">Cambiar empresa</span>
            <span class="rk-menu-header-hint">{{ companies.length }} disponibles · ⌘K para buscar</span>
          </div>
        </div>
        <q-list class="rk-menu-list">
          <q-item
            v-for="c in companies"
            :key="c._id || c.id"
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
              <q-icon
                v-if="isActive(c)"
                name="check_circle"
                size="20px"
                class="rk-menu-check"
              />
              <q-icon
                v-else
                name="arrow_forward"
                size="16px"
                class="rk-menu-arrow"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/authStore'
import { getCompanyColor, getCompanyInitial } from '@/utils/companyBrand'

const authStore = useAuthStore()
const toast = useToast()

const menuOpen = ref(false)
const switching = ref(false)

const companies = computed(() => authStore.assignedCompanies)
const active = computed(() => authStore.activeCompany)

const hasActive = computed(() => {
  const a = active.value
  if (!a) return false
  if (typeof a === 'object') return !!(a.name || a._id || a.id)
  return true
})

const canSwitch = computed(() => {
  const role = String(authStore.user?.role || '')
  return role === 'admin_rrhh' && companies.value.length > 1
})

const activeCompanyObj = computed(() => {
  const a = active.value
  if (!a) return null
  if (typeof a === 'object') return a
  return companies.value.find(c => String(c._id || c.id) === String(a)) || { name: '—', _id: a }
})

const activeName = computed(() => activeCompanyObj.value?.name || '—')
const activeRut = computed(() => activeCompanyObj.value?.rut || '')
const activeInitial = computed(() => getCompanyInitial(activeCompanyObj.value))
const activeAvatarStyle = computed(() => getAvatarStyle(activeCompanyObj.value))

function getAvatarStyle(company) {
  const c = getCompanyColor(company)
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

async function onPick(c) {
  const cid = c?._id || c?.id
  if (!cid || isActive(c)) { menuOpen.value = false; return }
  try {
    switching.value = true
    await authStore.switchCompany(cid)
    toast.success(`Empresa activa: ${c.name || ''}`)
    menuOpen.value = false
    window.location.reload()
  } catch (e) {
    toast.error(e?.message || 'No se pudo cambiar de empresa')
  } finally {
    switching.value = false
  }
}
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
  outline: 2px solid var(--color-primary, #06b6d4);
  outline-offset: 2px;
}

.rk-pill-trigger.is-disabled {
  opacity: 0.6;
  cursor: progress;
  pointer-events: none;
}

/* Avatar minimal: solo el círculo de color con la inicial */
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
  background: var(--color-primary, #06b6d4);
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

<!--
  Estilos no-scoped: q-menu y q-tooltip se teletransportan fuera del componente,
  por lo que los estilos scoped no aplican al panel.
-->
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

/* Menú */
.rk-pill-menu {
  background: #ffffff;
  border: 1.5px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  font-family: 'Sora', -apple-system, sans-serif;
  min-width: 320px;
  max-width: 380px;
}

.body--dark .rk-pill-menu {
  background: #0f172a;
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
}

.body--dark .rk-pill-menu .rk-menu-header {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
}

.rk-pill-menu .rk-menu-header .q-icon {
  font-size: 20px;
  color: var(--color-primary, #06b6d4);
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

.rk-pill-menu .rk-menu-list {
  padding: 8px;
  background: transparent;
}

.rk-pill-menu .rk-menu-item {
  border-radius: 10px;
  padding: 8px 10px;
  min-height: 56px;
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
  color: var(--color-primary, #06b6d4);
}

.rk-pill-menu .rk-menu-arrow {
  color: rgba(15, 23, 42, 0.3);
  transition: transform 0.2s ease, color 0.2s ease;
}

.body--dark .rk-pill-menu .rk-menu-arrow {
  color: rgba(255, 255, 255, 0.3);
}

.rk-pill-menu .rk-menu-item:hover .rk-menu-arrow {
  color: var(--color-primary, #06b6d4);
  transform: translateX(2px);
}
</style>
