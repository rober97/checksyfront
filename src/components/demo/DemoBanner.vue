<template>
  <!--
    Barra persistente del ambiente de prueba.

    Vive fuera del layout (se monta en App.vue) por dos razones: sigue visible
    en cualquier rol —incluida la vista de trabajador impersonada, que usa otro
    layout— y no obliga a tocar los cuatro layouts existentes.

    Se muestra siempre, sin opción de cerrarla: quien está probando necesita
    saber en todo momento que los datos que ve son ficticios. Un banner que se
    puede ocultar termina en confusiones del tipo "¿esto ya es mi empresa real?".
  -->
  <div
    v-if="demo.isDemo"
    class="rk-demo-bar"
    :class="{ 'rk-demo-bar--urgent': demo.urgent, 'rk-demo-bar--impersonating': demo.isImpersonating }"
  >
    <div class="rk-demo-bar__inner">

      <!-- Identidad del ambiente -->
      <div class="rk-demo-bar__id">
        <q-icon :name="demo.isImpersonating ? 'visibility' : 'science'" size="18px" />
        <span class="rk-demo-bar__label">
          <template v-if="demo.isImpersonating">
            Estás viendo la app como <strong>{{ currentName }}</strong>
          </template>
          <template v-else>
            Ambiente de prueba · <strong>{{ demo.companyName }}</strong>
          </template>
        </span>
      </div>

      <!-- Vigencia -->
      <div v-if="!demo.isImpersonating" class="rk-demo-bar__days">
        <q-icon name="schedule" size="15px" />
        <span v-if="demo.daysLeft > 0">
          {{ demo.daysLeft }} {{ demo.daysLeft === 1 ? 'día restante' : 'días restantes' }}
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
          <q-btn
            dense flat no-caps
            class="rk-demo-btn"
            icon="badge"
            label="Ver como trabajador"
            @click="employeesOpen = true"
          />
          <q-btn dense flat round icon="more_horiz" class="rk-demo-btn rk-demo-btn--icon">
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

const demo = useDemoStore()
const auth = useAuthStore()
const router = useRouter()
const { notify } = useQuasar()

const employeesOpen = ref(false)
const mailboxOpen = ref(false)
const confirmReset = ref(false)
const busy = ref(false)

const currentName = computed(() =>
  `${auth.user?.firstName || ''} ${auth.user?.lastName || ''}`.trim() || 'un trabajador'
)

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
  /* En móvil solo caben la identidad y una acción; el resto vive en el menú. */
  .rk-demo-bar__label { font-size: 0.75rem; }
  .rk-demo-btn:not(.rk-demo-btn--solid):not(.rk-demo-btn--icon) { display: none; }
}
</style>
