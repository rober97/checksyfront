<template>
  <!--
    Entrar al panel del trabajador.

    Dos caminos a propósito, porque responden a preguntas distintas:
      1. "Ver ahora" — cambia la sesión al vuelo. Es para entender qué ve y qué
         puede hacer un trabajador (marcar con foto, ver su comprobante DT).
      2. Las credenciales — para cerrar sesión y entrar como esa persona desde
         la pantalla de login, o desde el teléfono con la app móvil, que es
         donde realmente se marca asistencia.

    Los trabajadores que el visitante da de alta durante la prueba aparecen acá
    igual, pero como PENDIENTES: siguen el flujo real de la plataforma, en el que
    la persona recibe un correo, firma su anexo DT y elige su propia contraseña.
    Ese flujo no se salta en la demo — es justo lo que va a vivir con su equipo.
    Lo único que se ofrece es el mismo enlace que viaja en el correo, para el
    caso de que haya dado de alta a alguien con una dirección inventada y no
    pueda abrir ese buzón.
  -->
  <q-dialog v-model="open" @show="onShow">
    <q-card class="rk-demo-emp">
      <q-card-section class="rk-demo-emp__head">
        <div>
          <div class="text-subtitle1 text-weight-bold">Entrar como trabajador</div>
          <div class="text-caption text-grey-7">
            Así ve la plataforma alguien de tu equipo. Vuelves cuando quieras desde la barra superior.
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="rk-demo-emp__body">
        <q-list separator>
          <q-item v-for="emp in demo.employees" :key="emp.id" class="rk-demo-emp__item">
            <q-item-section avatar>
              <q-avatar size="38px" color="primary" text-color="white">
                {{ initials(emp.name) }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ emp.name }}
                <q-badge v-if="!emp.activated" color="orange-8" class="q-ml-xs" label="Activación pendiente" />
              </q-item-label>
              <q-item-label caption>{{ emp.cargo || 'Trabajador' }}</q-item-label>
              <q-item-label caption class="rk-demo-emp__mail">
                {{ emp.email }}
                <q-btn
                  flat dense round size="xs" icon="content_copy"
                  @click="copy(emp.email, 'Correo copiado')"
                >
                  <q-tooltip>Copiar correo</q-tooltip>
                </q-btn>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn
                v-if="emp.activated"
                dense unelevated no-caps color="primary"
                label="Ver ahora"
                :loading="busyId === emp.id"
                :disable="!!busyId"
                @click="enter(emp)"
              />
              <q-btn
                v-else
                dense outline no-caps color="orange-9"
                label="Activar"
                :loading="busyId === emp.id"
                :disable="!!busyId"
                @click="openActivation(emp)"
              >
                <q-tooltip>
                  Abre el mismo asistente de activación que recibe por correo
                </q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Explica por qué unos entran directo y otros no: sin esto, el
             "Activación pendiente" se lee como un error de la demo. -->
        <div v-if="hasPending" class="rk-demo-emp__note">
          <q-icon name="info" size="16px" />
          <span>
            Los trabajadores que creas tú siguen el flujo real: reciben un correo,
            aceptan su anexo DT y eligen su contraseña. Si usaste un correo
            inventado, «Activar» te abre ese mismo asistente.
          </span>
        </div>

        <div v-if="!demo.employees.length" class="rk-demo-emp__empty">
          <q-icon name="group_off" size="28px" />
          <div>Todavía no hay trabajadores en este ambiente.</div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Credenciales: el camino "a mano", incluida la app móvil. -->
      <q-card-section class="rk-demo-emp__creds">
        <div class="rk-demo-emp__creds-title">
          <q-icon name="key" size="16px" />
          Contraseña del equipo de ejemplo
        </div>
        <div class="rk-demo-emp__creds-row">
          <code>{{ demo.employeePassword || '—' }}</code>
          <q-btn
            flat dense no-caps size="sm" icon="content_copy" label="Copiar"
            @click="copy(demo.employeePassword, 'Contraseña copiada')"
          />
        </div>
        <div class="rk-demo-emp__creds-hint">
          Sirve para los trabajadores de ejemplo que venían cargados —también en la app móvil,
          que es donde se marca asistencia con foto y ubicación. Los que crees tú
          eligen su propia contraseña al activar su cuenta.
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'
import { useDemoStore } from '@/stores/demoStore'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const demo = useDemoStore()
const router = useRouter()
const { notify } = useQuasar()

const busyId = ref(null)

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const hasPending = computed(() => demo.employees.some((e) => !e.activated))

function onShow() {
  // Refresca por si el visitante acaba de crear un trabajador propio: la gracia
  // es poder entrar justamente con ese.
  demo.fetch({ force: true })
}

function initials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

async function copy(text, message) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    notify({ type: 'positive', message, position: 'top', timeout: 1500 })
  } catch {
    notify({ type: 'warning', message: 'Cópialo manualmente', position: 'top' })
  }
}

/**
 * Abre el asistente de activación del trabajador — el mismo al que lleva el
 * enlace del correo. Se pide al backend en el momento porque el token solo se
 * guarda hasheado; cada apertura emite uno nuevo, igual que "reenviar
 * activación" en el flujo normal.
 */
async function openActivation(emp) {
  busyId.value = emp.id
  try {
    const { data } = await secureAxios.post('/demo/activation-link', { employeeId: emp.id })
    if (!data?.success || !data?.link) throw new Error(data?.message || 'No pudimos generar el enlace')
    open.value = false
    // Pestaña nueva: el asistente de activación es un flujo público y completo
    // (acepta el reglamento, firma el anexo DT y fija contraseña). Sacar al
    // visitante de su panel a media prueba lo haría perder el contexto.
    window.open(data.link, '_blank', 'noopener')
  } catch (e) {
    notify({
      type: 'negative',
      message: e?.response?.data?.message || e?.message || 'No pudimos abrir la activación',
      position: 'top',
    })
  } finally {
    busyId.value = null
  }
}

async function enter(emp) {
  busyId.value = emp.id
  try {
    await demo.impersonate(emp.id)
    open.value = false
    router.replace('/employee/attendance')
  } catch (e) {
    notify({
      type: 'negative',
      message: e?.response?.data?.message || e?.message || 'No pudimos abrir esa vista',
      position: 'top',
    })
  } finally {
    busyId.value = null
  }
}
</script>

<style scoped>
.rk-demo-emp { width: 100%; max-width: 560px; border-radius: 16px; }

.rk-demo-emp__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.rk-demo-emp__body { max-height: 46vh; overflow-y: auto; padding-top: 0; padding-bottom: 0; }
.rk-demo-emp__item { padding-left: 0; padding-right: 0; }
.rk-demo-emp__mail {
  display: flex;
  align-items: center;
  gap: 2px;
  word-break: break-all;
}

.rk-demo-emp__note {
  display: flex; align-items: flex-start; gap: 0.5rem;
  margin: 0.75rem 0 1rem;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.09);
  color: #92400e;
  font-size: 0.75rem;
  line-height: 1.45;
}
body.body--dark .rk-demo-emp__note { color: #fcd34d; }
.rk-demo-emp__note .q-icon { flex-shrink: 0; margin-top: 1px; }

.rk-demo-emp__empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 2rem 0; color: #94a3b8; font-size: 0.875rem;
}

.rk-demo-emp__creds { background: rgba(59, 130, 246, 0.06); }
.rk-demo-emp__creds-title {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #64748b; margin-bottom: 0.5rem;
}
.rk-demo-emp__creds-row { display: flex; align-items: center; gap: 0.5rem; }
.rk-demo-emp__creds-row code {
  font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em;
  background: rgba(15, 23, 42, 0.06); padding: 0.25rem 0.6rem; border-radius: 8px;
}
body.body--dark .rk-demo-emp__creds-row code { background: rgba(255, 255, 255, 0.1); }
.rk-demo-emp__creds-hint { margin-top: 0.5rem; font-size: 0.75rem; color: #64748b; line-height: 1.4; }
</style>
