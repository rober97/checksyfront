<template>
  <!--
    Barra persistente del período de prueba.

    Se monta dentro del QHeader compartido (components/Header.vue), así que sigue
    visible en cualquier rol —incluida la vista de trabajador impersonada, que
    usa otro layout— sin tocar los cuatro layouts existentes.

    Cumple dos funciones y ninguna es opcional, por eso no se puede cerrar:
    dice cuánto queda de prueba, y dice EN QUÉ EMPRESA se está parado. Desde que
    conviven el ambiente de ejemplo y la empresa real, la segunda pesa más que la
    primera: escribir datos verdaderos creyendo estar en la empresa real cuando
    se está en la de ejemplo es el error que esta barra existe para evitar.
  -->
  <div
    v-if="demo.showBar"
    class="rk-demo-bar"
    :class="{
      'rk-demo-bar--urgent': demo.urgent,
      'rk-demo-bar--impersonating': demo.isImpersonating,
      'rk-demo-bar--real': demo.inRealCompany && !demo.isImpersonating,
      'rk-demo-bar--locked': demo.locked,
    }"
  >
    <div class="rk-demo-bar__inner">

      <!-- Identidad del ambiente -->
      <div class="rk-demo-bar__id">
        <q-icon :name="idIcon" size="18px" />
        <span class="rk-demo-bar__label">
          <template v-if="demo.isImpersonating">
            Estás viendo la app como <strong>{{ currentName }}</strong>
          </template>
          <template v-else-if="demo.inRealCompany">
            Tu empresa · <strong>{{ demo.companyName }}</strong>
          </template>
          <template v-else>
            Ambiente de prueba · <strong>{{ demo.companyName }}</strong>
          </template>
        </span>
      </div>

      <!--
        Cambio de ambiente.

        Son dos empresas distintas, no dos vistas de la misma: la de ejemplo
        tiene RUT inventado y datos ficticios; la real es la tuya. Se muestran
        como un par para que en todo momento se sepa en cuál se está parado —
        entrar datos verdaderos creyendo estar en la real, o al revés, es el
        único error grave que esta pantalla puede provocar.
      -->
      <div v-if="showSwitch" class="rk-env-switch">
        <button
          class="rk-env-switch__opt"
          :class="{ 'is-active': demo.isDemo }"
          :disabled="busy || demo.isDemo"
          @click="switchTo(demo.environments.demo.id)"
        >
          <q-icon name="science" size="15px" />
          <span>Prueba</span>
        </button>
        <button
          v-if="demo.hasRealCompany"
          class="rk-env-switch__opt"
          :class="{ 'is-active': demo.inRealCompany }"
          :disabled="busy || demo.inRealCompany"
          @click="switchTo(demo.environments.real.id)"
        >
          <q-icon name="apartment" size="15px" />
          <span>Mi empresa</span>
        </button>
        <button v-else class="rk-env-switch__opt rk-env-switch__opt--new" :disabled="busy" @click="realDialogOpen = true">
          <q-icon name="add" size="15px" />
          <span>Crear mi empresa</span>
        </button>
      </div>

      <!-- Vigencia -->
      <div v-if="!demo.isImpersonating" class="rk-demo-bar__days">
        <q-icon :name="demo.locked ? 'lock' : 'schedule'" size="15px" />
        <span v-if="demo.locked">Prueba vencida · solo lectura</span>
        <span v-else-if="demo.remainingDays > 0">
          {{ demo.remainingDays }} {{ demo.remainingDays === 1 ? 'día restante' : 'días restantes' }}
        </span>
        <span v-else>Tu prueba venció</span>
      </div>

      <q-space />

      <!-- Acciones -->
      <div class="rk-demo-bar__actions">
        <q-btn
          v-if="demo.isImpersonating"
          dense unelevated no-caps
          class="rk-demo-btn rk-demo-btn--solid"
          icon="arrow_back"
          label="Volver a RR.HH."
          :loading="busy"
          @click="onExit"
        />
        <template v-else>
          <!-- Los atajos del guion de la demo no existen en la empresa real:
               ahí no hay trabajadores ficticios que mirar ni datos que reiniciar. -->
          <q-btn
            v-if="demo.isDemo"
            dense flat no-caps
            class="rk-demo-btn"
            icon="badge"
            label="Ver como trabajador"
            @click="employeesOpen = true"
          />
          <q-btn v-if="demo.isDemo" dense flat round icon="more_horiz" class="rk-demo-btn rk-demo-btn--icon">
            <q-menu anchor="bottom right" self="top right">
              <q-list dense style="min-width: 230px">
                <q-item clickable v-close-popup @click="showChecklist">
                  <q-item-section avatar><q-icon name="checklist" size="20px" /></q-item-section>
                  <q-item-section>
                    <q-item-label>Guía de primeros pasos</q-item-label>
                    <q-item-label caption>{{ demo.progress.done }} de {{ demo.progress.total }} completados</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="mailboxOpen = true">
                  <q-item-section avatar><q-icon name="mark_email_read" size="20px" /></q-item-section>
                  <q-item-section>
                    <q-item-label>Correos que envió el sistema</q-item-label>
                    <q-item-label caption>
                      {{ demo.mailCount ? `${demo.mailCount} correo${demo.mailCount === 1 ? '' : 's'}` : 'Aún ninguno' }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup :disable="demo.resetsLeft <= 0" @click="confirmReset = true">
                  <q-item-section avatar><q-icon name="restart_alt" size="20px" /></q-item-section>
                  <q-item-section>
                    <q-item-label>Reiniciar datos de prueba</q-item-label>
                    <q-item-label caption>
                      {{ demo.resetsLeft > 0 ? `Te quedan ${demo.resetsLeft}` : 'Sin reinicios disponibles' }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn
            dense unelevated no-caps
            class="rk-demo-btn rk-demo-btn--solid"
            label="Activar cuenta real"
            @click="goToSales"
          />
        </template>
      </div>
    </div>

    <DemoEmployeesDialog v-model="employeesOpen" />
    <DemoMailboxDialog v-model="mailboxOpen" />
    <RealCompanyDialog v-model="realDialogOpen" />

    <!-- Reinicio: destruye lo que el visitante haya hecho, así que se confirma. -->
    <q-dialog v-model="confirmReset">
      <q-card class="rk-demo-dialog">
        <q-card-section class="row items-center no-wrap q-gutter-sm">
          <q-icon name="restart_alt" size="28px" color="warning" />
          <div>
            <div class="text-subtitle1 text-weight-bold">Reiniciar datos de prueba</div>
            <div class="text-caption text-grey-7">
              Volvemos a dejar la empresa como el primer día. Se borra todo lo que hayas
              creado o modificado en esta prueba.
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn unelevated no-caps color="warning" label="Sí, reiniciar" :loading="busy" @click="onReset" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useDemoStore } from '@/stores/demoStore'
import { useAuthStore } from '@/stores/authStore'
import DemoEmployeesDialog from './DemoEmployeesDialog.vue'
import DemoMailboxDialog from './DemoMailboxDialog.vue'
import RealCompanyDialog from './RealCompanyDialog.vue'

const demo = useDemoStore()
const auth = useAuthStore()
const router = useRouter()
const { notify } = useQuasar()

const employeesOpen = ref(false)
const mailboxOpen = ref(false)
const realDialogOpen = ref(false)
const confirmReset = ref(false)
const busy = ref(false)

const currentName = computed(() =>
  `${auth.user?.firstName || ''} ${auth.user?.lastName || ''}`.trim() || 'un trabajador'
)

const idIcon = computed(() => {
  if (demo.isImpersonating) return 'visibility'
  return demo.inRealCompany ? 'apartment' : 'science'
})

/**
 * El cambio de ambiente no se ofrece mientras se mira la app como trabajador:
 * esa sesión es de otra persona y saltar de empresa desde ahí no significa nada.
 * Tampoco si ya no queda ambiente de prueba (venció y se purgó): en ese punto
 * hay una sola empresa y no hay nada entre qué elegir.
 */
const showSwitch = computed(() => !demo.isImpersonating && !!demo.environments?.demo)

async function switchTo(companyId) {
  if (!companyId || busy.value) return
  busy.value = true
  try {
    await demo.switchEnvironment(companyId)
    // Media app guarda en caché datos de la empresa anterior. Recargar es más
    // seguro que perseguir cada módulo, y es el mismo criterio del reinicio.
    window.location.reload()
  } catch (e) {
    notify({ type: 'negative', message: e?.message || 'No pudimos cambiar de empresa', position: 'top' })
    busy.value = false
  }
}

async function onExit() {
  busy.value = true
  try {
    await demo.exitImpersonation()
    router.replace('/rrhh/dashboard')
  } catch (e) {
    notify({ type: 'negative', message: e?.message || 'No pudimos volver a tu cuenta', position: 'top' })
  } finally {
    busy.value = false
  }
}

async function onReset() {
  busy.value = true
  try {
    await demo.reset()
    confirmReset.value = false
    notify({ type: 'positive', message: 'Ambiente reiniciado con datos frescos', position: 'top' })
    // Recarga dura: media app tiene datos en caché de la empresa anterior y
    // refrescarlos módulo por módulo sería frágil.
    window.location.reload()
  } catch (e) {
    notify({ type: 'negative', message: e?.message || 'No pudimos reiniciar el ambiente', position: 'top' })
  } finally {
    busy.value = false
  }
}

function showChecklist() {
  if (demo.checklistCollapsed) demo.toggleChecklist()
  router.push('/rrhh/dashboard')
}

function goToSales() {
  router.push({ path: '/contact', query: { tipo: 'ventas', origen: 'demo' } })
}
</script>

<style scoped>
.rk-demo-bar {
  /* Fluye dentro del QHeader: es Quasar quien la fija y quien descuenta su
     alto del contenido. Posicionarla acá rompería ese cálculo. */
  position: relative;
  background: linear-gradient(90deg, #1e3a8a 0%, #4338ca 100%);
  color: #fff;
  font-size: 0.8125rem;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.12) inset;
}
.rk-demo-bar--urgent { background: linear-gradient(90deg, #9a3412 0%, #b45309 100%); }
.rk-demo-bar--impersonating { background: linear-gradient(90deg, #065f46 0%, #047857 100%); }
/* La empresa real usa otro color a propósito: es la señal de un vistazo de que
   lo que se escriba acá va en serio. */
.rk-demo-bar--real { background: linear-gradient(90deg, #0f766e 0%, #0e7490 100%); }
.rk-demo-bar--locked { background: linear-gradient(90deg, #7f1d1d 0%, #9a3412 100%); }

.rk-demo-bar__inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 1rem;
  min-height: 40px;
  max-width: 1800px;
  margin: 0 auto;
}

.rk-demo-bar__id { display: flex; align-items: center; gap: 0.45rem; min-width: 0; }
.rk-demo-bar__label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rk-demo-bar__label strong { font-weight: 700; }

.rk-demo-bar__days {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  white-space: nowrap;
  font-weight: 600;
}

/* ===== Cambio de ambiente ===== */
.rk-env-switch {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.22);
  flex-shrink: 0;
}
.rk-env-switch__opt {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.2rem 0.7rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.rk-env-switch__opt:hover:not(:disabled) { color: #fff; background: rgba(255, 255, 255, 0.14); }
.rk-env-switch__opt.is-active {
  background: rgba(255, 255, 255, 0.95);
  color: #1e293b;
  cursor: default;
}
/* Deshabilitado solo por ser el activo: no debe leerse como "no disponible". */
.rk-env-switch__opt:disabled:not(.is-active) { opacity: 0.5; cursor: default; }
.rk-env-switch__opt--new { border: 1px dashed rgba(255, 255, 255, 0.45); }

.rk-demo-bar__actions { display: flex; align-items: center; gap: 0.35rem; }

.rk-demo-btn { color: #fff; font-size: 0.8125rem; border-radius: 8px; }
.rk-demo-btn--solid {
  background: rgba(255, 255, 255, 0.18);
  padding: 0 0.75rem;
  font-weight: 600;
}
.rk-demo-btn--solid:hover { background: rgba(255, 255, 255, 0.28); }
.rk-demo-btn--icon { padding: 0; }

.rk-demo-dialog { max-width: 420px; border-radius: 14px; }

@media (max-width: 900px) {
  .rk-demo-bar__days { display: none; }
  .rk-demo-bar__inner { padding: 0.35rem 0.6rem; gap: 0.4rem; }
}
@media (max-width: 600px) {
  /* En móvil solo caben la identidad y una acción; el resto vive en el menú.
     El cambio de ambiente SÍ sobrevive —reducido a los iconos— porque saber en
     qué empresa estás no es opcional. */
  .rk-demo-bar__label { font-size: 0.75rem; }
  .rk-demo-btn:not(.rk-demo-btn--solid):not(.rk-demo-btn--icon) { display: none; }
  .rk-env-switch__opt span { display: none; }
  .rk-env-switch__opt { padding: 0.25rem 0.5rem; }
  .rk-env-switch__opt--new span { display: inline; }
}
</style>
