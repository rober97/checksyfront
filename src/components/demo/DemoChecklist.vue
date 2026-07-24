<template>
  <!--
    Guía de primeros pasos del ambiente de prueba.

    Responde la pregunta con la que llega alguien que nunca vio la plataforma:
    "ya entré, ¿y ahora qué miro?". En vez de un tour que resalta botones, cada
    paso es una tarea real del producto; se marca como hecha cuando el backend
    ve el efecto en los datos, no cuando se hace click. Por eso terminar la guía
    equivale a haber usado la plataforma de verdad.
  -->
  <div v-if="demo.active && !demo.isImpersonating" class="rk-onb" :class="{ 'rk-onb--done': demo.completed }">

    <div class="rk-onb__head" @click="demo.toggleChecklist()">
      <div class="rk-onb__title-wrap">
        <div class="rk-onb__icon">
          <q-icon :name="demo.completed ? 'celebration' : 'rocket_launch'" size="20px" />
        </div>
        <div>
          <div class="rk-onb__title">
            {{ demo.completed ? '¡Recorriste toda la plataforma!' : 'Primeros pasos en Recksy' }}
          </div>
          <div class="rk-onb__subtitle">
            <template v-if="demo.completed">
              Ya viste asistencia, solicitudes, nómina y cumplimiento DT. Cuando quieras, lo hacemos con tus datos reales.
            </template>
            <template v-else>
              Cargamos una empresa de ejemplo con {{ demo.employees.length }} trabajadores y un mes de asistencia.
              Sigue estos pasos para ver cómo funciona.
            </template>
          </div>
        </div>
      </div>

      <div class="rk-onb__head-right">
        <div class="rk-onb__count">{{ demo.progress.done }}/{{ demo.progress.total }}</div>
        <q-btn flat round dense :icon="demo.checklistCollapsed ? 'expand_more' : 'expand_less'" size="sm" />
      </div>
    </div>

    <div class="rk-onb__progress">
      <div class="rk-onb__progress-fill" :style="{ width: demo.progress.percent + '%' }"></div>
    </div>

    <q-slide-transition>
      <div v-show="!demo.checklistCollapsed" class="rk-onb__body">
        <div
          v-for="step in demo.steps"
          :key="step.key"
          class="rk-onb__step"
          :class="{ 'rk-onb__step--done': step.done, 'rk-onb__step--next': step.key === demo.nextStep?.key }"
        >
          <div class="rk-onb__step-mark">
            <q-icon v-if="step.done" name="check" size="16px" />
            <q-icon v-else :name="step.icon" size="16px" />
          </div>

          <div class="rk-onb__step-text">
            <div class="rk-onb__step-title">{{ step.title }}</div>
            <div class="rk-onb__step-desc">{{ step.description }}</div>
          </div>

          <q-btn
            v-if="!step.done"
            dense unelevated no-caps size="sm"
            class="rk-onb__step-cta"
            :color="step.key === demo.nextStep?.key ? 'primary' : 'grey-4'"
            :text-color="step.key === demo.nextStep?.key ? 'white' : 'grey-9'"
            :label="step.cta"
            @click="go(step)"
          />
          <div v-else class="rk-onb__step-done-label">Listo</div>
        </div>

        <div v-if="demo.completed" class="rk-onb__cta-final">
          <q-btn
            unelevated no-caps color="primary" icon-right="arrow_forward"
            label="Quiero activarlo con mi empresa"
            @click="goToSales"
          />
        </div>
      </div>
    </q-slide-transition>

    <DemoEmployeesDialog v-model="employeesOpen" />
    <DemoMailboxDialog v-model="mailboxOpen" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDemoStore } from '@/stores/demoStore'
import DemoEmployeesDialog from './DemoEmployeesDialog.vue'
import DemoMailboxDialog from './DemoMailboxDialog.vue'

const demo = useDemoStore()
const router = useRouter()
const employeesOpen = ref(false)
const mailboxOpen = ref(false)

onMounted(() => { demo.fetch() })

function go(step) {
  // Estos dos pasos no navegan a ninguna ruta: abren un diálogo. El de
  // trabajadores porque hay que elegir a quién, y el de correos porque la
  // bandeja del ambiente no es una pantalla del producto.
  if (step.action === 'impersonate') {
    employeesOpen.value = true
    return
  }
  if (step.action === 'mailbox') {
    mailboxOpen.value = true
    return
  }
  // Los pasos de "visita" se dan por hechos al ir hacia el módulo; los de datos
  // se completan solos cuando el backend ve el efecto.
  if (step.source === 'visit') demo.markVisited(step.key)
  if (step.to) router.push(step.to)
}

function goToSales() {
  router.push({ path: '/contact', query: { tipo: 'ventas', origen: 'demo' } })
}
</script>

<style scoped>
.rk-onb {
  border: 1px solid rgba(59, 130, 246, 0.25);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(139, 92, 246, 0.04));
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 1.25rem;
}
body.body--dark .rk-onb {
  border-color: rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.08));
}
.rk-onb--done { border-color: rgba(16, 185, 129, 0.35); }

.rk-onb__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; padding: 1rem 1.25rem; cursor: pointer;
}
.rk-onb__title-wrap { display: flex; gap: 0.75rem; min-width: 0; }
.rk-onb__icon {
  width: 38px; height: 38px; flex-shrink: 0;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
}
.rk-onb--done .rk-onb__icon { background: linear-gradient(135deg, #10b981, #059669); }
.rk-onb__title { font-size: 1rem; font-weight: 700; }
.rk-onb__subtitle { font-size: 0.8125rem; color: #64748b; margin-top: 2px; max-width: 70ch; line-height: 1.45; }
body.body--dark .rk-onb__subtitle { color: #94a3b8; }

.rk-onb__head-right { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; }
.rk-onb__count { font-size: 0.8125rem; font-weight: 700; color: #3b82f6; }
.rk-onb--done .rk-onb__count { color: #10b981; }

.rk-onb__progress { height: 4px; background: rgba(148, 163, 184, 0.22); }
.rk-onb__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.rk-onb--done .rk-onb__progress-fill { background: linear-gradient(90deg, #10b981, #059669); }

.rk-onb__body { padding: 0.5rem 1.25rem 1rem; }

.rk-onb__step {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}
.rk-onb__step:last-of-type { border-bottom: none; }

.rk-onb__step-mark {
  width: 28px; height: 28px; flex-shrink: 0;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(148, 163, 184, 0.2);
  color: #64748b;
}
.rk-onb__step--next .rk-onb__step-mark { background: rgba(59, 130, 246, 0.16); color: #3b82f6; }
.rk-onb__step--done .rk-onb__step-mark { background: #10b981; color: #fff; }

.rk-onb__step-text { flex: 1; min-width: 0; }
.rk-onb__step-title { font-size: 0.875rem; font-weight: 600; }
.rk-onb__step--done .rk-onb__step-title { color: #94a3b8; text-decoration: line-through; }
.rk-onb__step-desc { font-size: 0.75rem; color: #94a3b8; margin-top: 1px; }
.rk-onb__step--done .rk-onb__step-desc { display: none; }

.rk-onb__step-cta { border-radius: 8px; min-width: 108px; }
.rk-onb__step-done-label {
  font-size: 0.75rem; font-weight: 600; color: #10b981;
  min-width: 108px; text-align: center;
}

.rk-onb__cta-final { padding-top: 0.9rem; display: flex; justify-content: center; }

@media (max-width: 720px) {
  .rk-onb__step { flex-wrap: wrap; }
  .rk-onb__step-cta, .rk-onb__step-done-label { min-width: 0; margin-left: 40px; }
  .rk-onb__step-text { flex-basis: calc(100% - 100px); }
}
</style>
