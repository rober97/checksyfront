<template>
  <!--
    Bandeja de correos del ambiente de prueba.

    Buena parte de lo que exige la normativa DT ocurre por correo: el trabajador
    recibe el comprobante de cada marca, el aviso cuando le modifican un registro
    (con su ventana de 48 h para objetar), su liquidación. Quien está probando no
    tiene forma de ver nada de eso —los trabajadores no existen y no tienen
    buzón—, así que el circuito completo quedaría invisible justo para quien
    está evaluando si el sistema cumple.

    Acá se muestra tal cual sale: mismo asunto, mismo HTML, mismo destinatario.
  -->
  <q-dialog v-model="open" @show="load">
    <q-card class="rk-demo-mail">
      <q-card-section class="rk-demo-mail__head">
        <div>
          <div class="text-subtitle1 text-weight-bold">Correos que envió el sistema</div>
          <div class="text-caption text-grey-7">
            Todo lo que Recksy mandó desde tu ambiente de prueba, tal como lo recibe cada persona.
          </div>
        </div>
        <div class="row items-center no-wrap">
          <q-btn flat round dense icon="refresh" :loading="loading" @click="load">
            <q-tooltip>Actualizar</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="close" v-close-popup />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="rk-demo-mail__body">
        <!-- Lectura de un correo -->
        <div v-if="current" class="rk-demo-mail__reader">
          <q-btn flat dense no-caps icon="arrow_back" label="Volver a la bandeja" @click="current = null" />

          <div class="rk-demo-mail__meta">
            <div class="rk-demo-mail__subject">{{ current.subject }}</div>
            <div class="rk-demo-mail__to">
              Para <strong>{{ current.to }}</strong> · {{ formatDate(current.sentAt) }}
            </div>
            <q-badge :color="deliveryColor(current.delivery)" :label="deliveryLabel(current.delivery)" />
            <div v-if="current.attachments.length" class="rk-demo-mail__attach">
              <q-icon name="attach_file" size="14px" />
              {{ current.attachments.join(', ') }}
            </div>
          </div>

          <!--
            El cuerpo va en un iframe con sandbox: es HTML generado por las
            plantillas del propio sistema, pero renderizarlo con v-html lo
            metería en el DOM de la app compartiendo estilos y contexto. El
            iframe lo aísla y además lo muestra como lo vería un cliente de
            correo, que es el punto.
          -->
          <iframe
            ref="frameRef"
            class="rk-demo-mail__frame"
            sandbox=""
            title="Contenido del correo"
          ></iframe>
        </div>

        <!-- Listado -->
        <template v-else>
          <q-list v-if="mails.length" separator>
            <q-item v-for="mail in mails" :key="mail.id" clickable @click="openMail(mail)">
              <q-item-section avatar>
                <q-avatar size="34px" :color="deliveryColor(mail.delivery)" text-color="white" icon="mail" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ mail.subject || '(sin asunto)' }}</q-item-label>
                <q-item-label caption>{{ mail.to }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>{{ formatDate(mail.sentAt) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else-if="!loading" class="rk-demo-mail__empty">
            <q-icon name="drafts" size="32px" />
            <div class="text-weight-medium">Todavía no hay correos</div>
            <p>
              Se llenan solos a medida que uses la plataforma: marca asistencia como
              trabajador y verás llegar su comprobante DT; edita una marca y verás
              el aviso con la ventana para objetar.
            </p>
          </div>

          <div v-if="loading" class="rk-demo-mail__loading">
            <q-spinner size="26px" color="primary" />
          </div>
        </template>
      </q-card-section>

      <q-separator />

      <q-card-section class="rk-demo-mail__note">
        <q-icon name="info" size="16px" />
        <span>
          A los trabajadores de ejemplo no se les envía de verdad —sus direcciones
          son ficticias y rebotarían—, pero el correo se genera igual y lo ves acá.
          Si diste de alta a alguien con un correo real, ese sí se entrega.
        </span>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'
import { useDemoStore } from '@/stores/demoStore'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const { notify } = useQuasar()
const demo = useDemoStore()

const mails = ref([])
const current = ref(null)
const loading = ref(false)
const frameRef = ref(null)

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

async function load() {
  current.value = null
  loading.value = true
  try {
    const { data } = await secureAxios.get('/demo/mails')
    mails.value = data?.mails || []
    demo.markVisited('review_mails')
  } catch (e) {
    notify({ type: 'negative', message: 'No pudimos cargar los correos', position: 'top' })
  } finally {
    loading.value = false
  }
}

async function openMail(mail) {
  loading.value = true
  try {
    const { data } = await secureAxios.get(`/demo/mails/${mail.id}`)
    current.value = data.mail
    await nextTick()
    // srcdoc en vez de v-html: el iframe con sandbox vacío no ejecuta scripts
    // ni hereda los estilos de la app, así que el correo se ve como se vería
    // en un cliente de correo real.
    if (frameRef.value) {
      frameRef.value.srcdoc = current.value.html
        || `<pre style="font:14px/1.5 system-ui;white-space:pre-wrap;padding:12px">${escapeHtml(current.value.text || '')}</pre>`
    }
  } catch (e) {
    notify({ type: 'negative', message: 'No pudimos abrir el correo', position: 'top' })
  } finally {
    loading.value = false
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
  } catch { return '' }
}

const DELIVERY = {
  delivered: { label: 'Entregado', color: 'green-7' },
  console: { label: 'Sin SMTP configurado', color: 'blue-grey-6' },
  unroutable: { label: 'Destinatario de ejemplo', color: 'indigo-6' },
  failed: { label: 'Falló el envío', color: 'red-7' },
}
const deliveryLabel = (k) => DELIVERY[k]?.label || k
const deliveryColor = (k) => DELIVERY[k]?.color || 'grey-6'
</script>

<style scoped>
.rk-demo-mail { width: 100%; max-width: 720px; border-radius: 16px; }

.rk-demo-mail__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
}

.rk-demo-mail__body { min-height: 260px; max-height: 60vh; overflow-y: auto; }

.rk-demo-mail__empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 2.5rem 1rem; color: #94a3b8; text-align: center;
}
.rk-demo-mail__empty p { max-width: 46ch; font-size: 0.8125rem; margin: 0; line-height: 1.5; }

.rk-demo-mail__loading { display: flex; justify-content: center; padding: 2rem 0; }

.rk-demo-mail__meta { margin: 0.75rem 0; display: flex; flex-direction: column; gap: 0.3rem; align-items: flex-start; }
.rk-demo-mail__subject { font-size: 1rem; font-weight: 700; }
.rk-demo-mail__to { font-size: 0.8125rem; color: #64748b; }
.rk-demo-mail__attach { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 0.25rem; }

.rk-demo-mail__frame {
  width: 100%; height: 380px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  background: #fff;
}

.rk-demo-mail__note {
  display: flex; align-items: flex-start; gap: 0.5rem;
  font-size: 0.75rem; color: #64748b; line-height: 1.45;
  background: rgba(59, 130, 246, 0.05);
}
.rk-demo-mail__note .q-icon { flex-shrink: 0; margin-top: 1px; }
</style>
