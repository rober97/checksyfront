<template>
  <q-page>
    <div class="rk-module-shell">
      <section class="rk-module-header">
        <div class="rk-module-icon">
          <q-icon name="schedule" size="28px" />
        </div>
        <div class="col">
          <h1 class="rk-module-title">Horarios laborales</h1>
          <p class="rk-module-subtitle">{{ subtitle }}</p>
        </div>
      </section>

      <q-tabs
        v-model="tab"
        dense
        no-caps
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="rk-module-tabs"
      >
        <q-tab name="plantillas" icon="view_list" label="Plantillas" />
        <q-tab name="asignaciones" icon="group" label="Asignaciones" />
        <q-tab name="mensual" icon="event_note" label="Programación mensual" />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="tab" animated keep-alive class="rk-module-tabpanels">
        <q-tab-panel name="plantillas" class="q-pa-none q-pt-md">
          <SchedulesTab />
        </q-tab-panel>
        <q-tab-panel name="asignaciones" class="q-pa-none q-pt-md">
          <AssignmentsTab />
        </q-tab-panel>
        <q-tab-panel name="mensual" class="q-pa-none q-pt-md">
          <ProgramacionMensual />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SchedulesTab from './GestionHorarios.vue'
import AssignmentsTab from './AssignmentsTab.vue'
import ProgramacionMensual from './ProgramacionMensual.vue'

const route = useRoute()
const router = useRouter()

const VALID = ['plantillas', 'asignaciones', 'mensual']
const initial = VALID.includes(route.query.vista) ? route.query.vista : 'plantillas'
const tab = ref(initial)

const subtitle = computed(() => {
  if (tab.value === 'mensual') return 'Planifica el mes empleado por empleado: parte de las plantillas y ajusta lo que difiere.'
  if (tab.value === 'asignaciones') return 'Define qué plantilla de horario usa cada empleado de la empresa.'
  return 'Define las plantillas de jornada por empresa. Luego se asignan a empleados y se planifican en el mes.'
})

watch(tab, (v) => {
  if (route.query.vista === v) return
  router.replace({ query: { ...route.query, vista: v } })
})
</script>

<style scoped>
.rk-module-tabs {
  margin-top: 4px;
}
.rk-module-tabpanels {
  background: transparent;
}
</style>
