<template>
  <q-page padding class="verify-page">
    <div class="verify-shell">
      <div class="text-center q-mb-lg">
        <q-icon name="verified" size="64px" class="text-primary" />
        <div class="text-h4 text-weight-bold q-mt-sm">Verificador de comprobante</div>
        <div class="text-subtitle2 text-grey-7">
          Sistema de control de asistencia Recksy<br />
          Resolución Exenta N°38/2024 — Dirección del Trabajo, Chile
        </div>
      </div>

      <q-card flat bordered>
        <q-card-section>
          <q-input
            v-model="hashInput"
            label="Hash SHA-256 del comprobante"
            outlined
            placeholder="64 caracteres hexadecimales"
            @keyup.enter="verify"
          >
            <template #append>
              <q-btn
                color="primary"
                icon="search"
                label="Verificar"
                unelevated
                :loading="loading"
                @click="verify"
              />
            </template>
          </q-input>
        </q-card-section>
      </q-card>

      <q-card v-if="result" flat bordered class="q-mt-md" :class="resultClass">
        <q-card-section v-if="!result.found">
          <div class="row items-center">
            <q-icon name="error" size="32px" class="text-negative q-mr-sm" />
            <div class="text-h6">No encontramos ningún comprobante con ese hash</div>
          </div>
          <div class="text-body2 q-mt-sm">
            Verifica que hayas copiado el hash completo (64 caracteres).
          </div>
        </q-card-section>

        <q-card-section v-else>
          <div class="row items-center q-mb-md">
            <q-icon
              :name="result.record.modified ? 'warning' : (result.integrityOk ? 'check_circle' : 'dangerous')"
              size="40px"
              :class="result.integrityOk ? 'text-positive' : 'text-negative'"
              class="q-mr-sm"
            />
            <div>
              <div class="text-h6">
                {{ result.integrityOk ? 'Comprobante válido' : 'Comprobante alterado' }}
              </div>
              <div class="text-caption text-grey-7">
                {{ result.integrityOk
                    ? 'La integridad criptográfica del registro es correcta.'
                    : 'El contenido del registro no coincide con el hash almacenado.' }}
              </div>
            </div>
          </div>

          <q-separator class="q-my-sm" />
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-7">Trabajador</div>
              <div class="text-body1 text-weight-medium">{{ result.record.worker.fullName }}</div>
              <div class="text-caption">RUT {{ result.record.worker.rut }}</div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-7">Empleador</div>
              <div class="text-body1 text-weight-medium">{{ result.record.employer.name }}</div>
              <div class="text-caption">RUT {{ result.record.employer.rut }}</div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-7">Tipo de marca</div>
              <div class="text-body1">{{ tipoLabel(result.record.tipo) }}</div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-7">Fecha y hora del servidor</div>
              <div class="text-body1">{{ fmt(result.record.serverTimestamp) }}</div>
            </div>
            <div class="col-12">
              <div class="text-caption text-grey-7">Hash SHA-256</div>
              <div class="mono-hash">{{ result.record.hash }}</div>
            </div>
            <div v-if="result.record.modified" class="col-12">
              <q-banner class="bg-amber-2 text-dark">
                <q-icon name="edit_note" class="q-mr-xs" />
                Este registro fue modificado el {{ fmt(result.record.modifiedAt) }}.
                <span v-if="result.record.workerObjected">
                  <b>El trabajador objetó la modificación.</b>
                </span>
              </q-banner>
            </div>

            <!-- Objeción one-click: si la URL trae ?object=<token>&id=<id> -->
            <div v-if="canObjectFromUrl && !objectionDone" class="col-12 q-mt-sm">
              <q-banner class="bg-red-1 text-dark">
                <template #avatar><q-icon name="gavel" color="negative" size="28px" /></template>
                <div class="text-weight-medium">¿Deseas objetar esta modificación?</div>
                <div class="text-caption q-mb-sm">
                  Al confirmar, la modificación quedará rechazada y se notificará
                  a tu empleador. Esta acción es inmediata e irreversible.
                </div>
                <template #action>
                  <q-btn
                    unelevated color="negative" label="Confirmar objeción"
                    :loading="objectingLoading"
                    @click="doObjection"
                  />
                </template>
              </q-banner>
            </div>
            <div v-if="objectionDone" class="col-12 q-mt-sm">
              <q-banner class="bg-green-1 text-dark">
                <template #avatar><q-icon name="check_circle" color="positive" size="28px" /></template>
                <b>Objeción registrada.</b> Tu empleador será notificado.
              </q-banner>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="text-center text-caption text-grey-6 q-mt-lg">
        Este verificador es de acceso público y gratuito. Cualquier persona,
        incluida la Dirección del Trabajo, puede validar la integridad de un
        comprobante ingresando su hash.
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useDtStore } from '@/stores/dtStore'

const dt = useDtStore()
const route = useRoute()
const $q = useQuasar()

const hashInput = ref('')
const loading = ref(false)
const result = ref(null)
const objectingLoading = ref(false)
const objectionDone = ref(false)

// Si el link del email incluye ?object=<token>&id=<attId> activamos el flujo.
const canObjectFromUrl = computed(() => {
  if (!result.value?.found) return false
  if (!result.value.record?.modified) return false
  if (result.value.record?.workerObjected) return false
  return !!(route.query?.object && route.query?.id)
})

async function doObjection() {
  const token = route.query?.object
  const id = route.query?.id
  if (!token || !id) return
  objectingLoading.value = true
  try {
    const data = await dt.publicObject(id, token)
    if (data?.success) {
      objectionDone.value = true
      $q.notify({ type: 'positive', message: 'Objeción registrada correctamente' })
    } else {
      $q.notify({ type: 'negative', message: data?.message || 'Error procesando objeción' })
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err?.response?.data?.message || 'Error procesando objeción',
    })
  } finally {
    objectingLoading.value = false
  }
}

const resultClass = computed(() => {
  if (!result.value) return ''
  if (!result.value.found) return 'bg-red-1'
  return result.value.integrityOk ? 'bg-green-1' : 'bg-red-1'
})

const TIPOS = {
  entrada: 'Entrada de jornada',
  salida: 'Salida de jornada',
  colacion_inicio: 'Inicio de colación',
  colacion_fin: 'Fin de colación',
  he_inicio: 'Inicio horas extras',
  he_fin: 'Fin horas extras',
}

function tipoLabel(t) { return TIPOS[t] || t }
function fmt(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'medium' })
}

async function verify() {
  const h = String(hashInput.value || '').trim()
  if (!/^[a-f0-9]{64}$/i.test(h)) {
    result.value = null
    return
  }
  loading.value = true
  try {
    result.value = await dt.verifyHash(h)
  } catch (err) {
    result.value = { found: false }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Permitir URL /verificar-comprobante/:hash para escanear QR
  const h = route.params?.hash
  if (h) {
    hashInput.value = h
    verify()
  }
})
</script>

<style scoped>
.verify-page { max-width: 860px; margin: 0 auto; }
.verify-shell { padding: 24px 0; }
.mono-hash {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  padding: 8px 10px;
  background: #f4f4f4;
  border-radius: 4px;
}
</style>
