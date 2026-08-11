<!-- src/views/Admin/HorasExtra.vue
     Horas extraordinarias (Art. 30-32 CT / Res. Ex. 38). Dos caras del mismo
     asunto, separadas porque la ley las distingue:
       · Ejecutadas     — lo efectivamente trabajado sobre la jornada pactada.
       · Autorizaciones — el pacto previo del empleador (tope diario y motivo).

     Ambos paneles se montan de entrada: el contador de solicitudes pendientes
     tiene que verse aunque RR.HH. nunca abra la pestaña. -->
<template>
  <q-page class="rk-page rk-page--overtime" :class="{ 'is-dark': isDark }">
    <!-- ===== Fondo decorativo ===== -->
    <div class="rk-bg-mesh" aria-hidden="true">
      <div class="mesh-orb orb-1" />
      <div class="mesh-orb orb-2" />
      <div class="mesh-grid" />
    </div>

    <!-- ===== Header ===== -->
    <div class="rk-header-wrap">
      <div class="rk-header-inner">
        <div class="rk-header-icon">
          <q-icon name="more_time" size="26px" />
        </div>
        <div class="rk-header-text">
          <h1 class="rk-title">Horas extraordinarias</h1>
          <p class="rk-subtitle">
            Qué se trabajó de más, qué está <span class="rk-accent">autorizado</span> y qué se paga.
          </p>
        </div>
        <div class="rk-header-actions q-ml-auto">
          <button class="rk-btn-refresh" :disabled="loading" @click="reloadActive">
            <q-icon name="refresh" size="16px" :class="{ 'ot-spin': loading }" />
            Actualizar
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Pestañas ===== -->
    <nav class="hx-tabs">
      <button
        v-for="t in TABS"
        :key="t.key"
        class="hx-tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        <q-icon :name="t.icon" size="17px" />
        {{ t.label }}
        <span v-if="t.key === 'autorizaciones' && pendingCount" class="hx-tab-badge">
          {{ pendingCount }}
        </span>
      </button>
    </nav>

    <!-- ===== Paneles ===== -->
    <div v-show="tab === 'ejecutadas'">
      <OvertimeWorkedPanel ref="workedPanel" @granted="authPanel?.reload?.()" />
    </div>
    <div v-show="tab === 'autorizaciones'">
      <OvertimeAuthPanel ref="authPanel" @pending-change="pendingCount = $event" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useOvertimeAuthStore } from '@/stores/overtimeAuth'
import { useOvertimeReportStore } from '@/stores/overtimeReport'
import OvertimeWorkedPanel from '@/components/overtime/OvertimeWorkedPanel.vue'
import OvertimeAuthPanel from '@/components/overtime/OvertimeAuthPanel.vue'

const $q = useQuasar()
const authStore = useOvertimeAuthStore()
const reportStore = useOvertimeReportStore()

const isDark = ref($q.dark.isActive)
watch(() => $q.dark.isActive, (v) => { isDark.value = v })

const TABS = [
  { key: 'ejecutadas', label: 'Ejecutadas', icon: 'timelapse' },
  { key: 'autorizaciones', label: 'Autorizaciones', icon: 'gavel' },
]

const tab = ref('ejecutadas')
const pendingCount = ref(0)

const workedPanel = ref(null)
const authPanel = ref(null)

const loading = computed(() =>
  tab.value === 'ejecutadas' ? reportStore.loading : authStore.loading
)

// El botón de recargar actúa sobre la pestaña visible.
function reloadActive() {
  return tab.value === 'ejecutadas' ? workedPanel.value?.reload?.() : authPanel.value?.reload?.()
}
</script>

<style scoped>
.rk-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hx-tabs {
  position: relative;
  z-index: 1;
  display: inline-flex;
  gap: 4px;
  margin-bottom: 18px;
  padding: 5px;
  border: 1px solid var(--rk-c-border);
  border-radius: 14px;
  background: var(--rk-c-surface);
  box-shadow: var(--app-shadow-sm);
}

.hx-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--rk-c-text-2);
  cursor: pointer;
  font-family: var(--app-font-sans);
  font-size: 13.5px;
  font-weight: 600;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.hx-tab:hover {
  color: var(--rk-c-text);
  background: var(--rk-c-surface-2);
}

.hx-tab.active {
  background: var(--rk-c-primary);
  color: #fff;
  box-shadow: 0 5px 16px color-mix(in srgb, var(--rk-c-primary) 35%, transparent);
}

.hx-tab-badge {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--rk-c-warn);
  color: #fff;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
}

.hx-tab.active .hx-tab-badge {
  background: rgba(255, 255, 255, 0.9);
  color: var(--rk-c-primary);
}
</style>
