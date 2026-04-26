<template>
  <div v-if="showSwitcher" class="rk-company-switcher">
    <div
      class="rk-switcher-trigger"
      :class="{ 'is-disabled': switching }"
      role="button"
      tabindex="0"
    >
      <q-icon name="business" class="rk-switcher-icon" />
      <div class="rk-switcher-text">
        <span class="rk-switcher-label">Empresa activa</span>
        <strong class="rk-switcher-name">{{ activeName }}</strong>
      </div>
      <q-icon name="expand_more" class="rk-switcher-chevron" />
      <q-spinner v-if="switching" size="16px" class="rk-switcher-spinner" />

      <q-menu
        v-model="menuOpen"
        anchor="bottom right"
        self="top right"
        :offset="[0, 8]"
        class="rk-switcher-menu"
        :disable="switching"
      >
        <div class="rk-menu-header">
          <q-icon name="business" />
          <span>Cambiar empresa</span>
        </div>
        <q-list dense class="rk-menu-list">
          <q-item
            v-for="c in companies"
            :key="c._id || c.id"
            clickable
            v-close-popup
            :active="isActive(c)"
            :disable="switching"
            @click="onPick(c)"
          >
            <q-item-section avatar>
              <q-icon
                :name="isActive(c) ? 'check_circle' : 'radio_button_unchecked'"
                :color="isActive(c) ? 'primary' : 'grey-6'"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ c.name || 'Sin nombre' }}</q-item-label>
              <q-item-label caption v-if="c.rut">{{ c.rut }}</q-item-label>
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

const authStore = useAuthStore()
const toast = useToast()

const menuOpen = ref(false)
const switching = ref(false)

const companies = computed(() => authStore.assignedCompanies)
const active = computed(() => authStore.activeCompany)

const showSwitcher = computed(() => {
  // solo rol admin_rrhh con más de una empresa asignada
  const role = String(authStore.user?.role || '')
  return role === 'admin_rrhh' && companies.value.length > 1
})

const activeName = computed(() => {
  const a = active.value
  if (!a) return '—'
  if (typeof a === 'object') return a.name || '—'
  const match = companies.value.find(c => String(c._id || c.id) === String(a))
  return match?.name || '—'
})

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
    // Recarga para que vistas y stores leídos al montar refresquen sus datos
    window.location.reload()
  } catch (e) {
    toast.error(e?.message || 'No se pudo cambiar de empresa')
  } finally {
    switching.value = false
  }
}
</script>

<style scoped>
.rk-company-switcher {
  display: flex;
  align-items: center;
}

.rk-switcher-trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(6, 182, 212, 0.08);
  border: 1.5px solid rgba(6, 182, 212, 0.22);
  border-radius: 12px;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s ease;
  max-width: 260px;
}

.rk-switcher-trigger:hover:not(.is-disabled) {
  background: rgba(6, 182, 212, 0.14);
  border-color: rgba(6, 182, 212, 0.4);
}

.rk-switcher-trigger:focus-visible {
  outline: 2px solid rgba(6, 182, 212, 0.5);
  outline-offset: 2px;
}

.rk-switcher-trigger.is-disabled {
  opacity: 0.6;
  cursor: progress;
  pointer-events: none;
}

.rk-switcher-trigger { user-select: none; }

.rk-switcher-icon {
  font-size: 18px;
  color: #06b6d4;
}

.rk-switcher-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
  min-width: 0;
}

.rk-switcher-label {
  font-size: 0.66rem;
  font-weight: 600;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.rk-switcher-name {
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.rk-switcher-chevron {
  font-size: 18px;
  opacity: 0.7;
}

.rk-switcher-spinner {
  margin-left: 4px;
}

.rk-menu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.rk-menu-list {
  min-width: 280px;
  padding: 6px;
}

.rk-switcher-menu :deep(.q-item) {
  border-radius: 8px;
}

.rk-switcher-menu :deep(.q-item--active) {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  font-weight: 600;
}

@media (max-width: 767px) {
  .rk-switcher-label {
    display: none;
  }
  .rk-switcher-name {
    max-width: 120px;
  }
}
</style>
