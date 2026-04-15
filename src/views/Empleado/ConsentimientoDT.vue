<template>
  <q-page padding>
    <div class="consent-shell">
      <q-banner v-if="isOnboarding" class="bg-blue-1 q-mb-md">
        <template #avatar><q-icon name="info" color="primary" /></template>
        <div class="text-weight-medium">Paso obligatorio antes de usar el sistema</div>
        <div class="text-caption">
          Conforme a la Resolución Exenta N°38/2024 de la Dirección del Trabajo,
          debes registrar tu correo personal y aceptar las condiciones del
          sistema antes de comenzar a marcar asistencia.
        </div>
      </q-banner>

      <div class="text-h5 text-weight-bold q-mb-sm">
        <q-icon name="assignment_turned_in" class="text-primary q-mr-sm" />
        Consentimiento DT
      </div>
      <div class="text-subtitle2 text-grey-7 q-mb-md">
        {{ alreadyAccepted
            ? 'Ya aceptaste el consentimiento. Puedes revisarlo o actualizar tu correo personal.'
            : 'Antes de usar el sistema de control de asistencia debes aceptar las siguientes condiciones (Res. Ex. N°38/2024, Dirección del Trabajo).' }}
      </div>

      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">
            1. Correo personal para comprobantes
          </div>
          <div class="text-body2 text-grey-8 q-mb-sm">
            La DT exige que tus comprobantes lleguen a un correo PERSONAL
            (no corporativo), fuera del control de tu empleador.
          </div>
          <q-input
            v-model="personalEmail"
            label="Correo personal"
            outlined dense
            type="email"
            :rules="[val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Email inválido']"
          />
          <q-btn
            class="q-mt-sm" color="primary" unelevated dense
            label="Guardar correo personal"
            icon="save"
            :disable="!isValidEmail"
            @click="savePersonalEmail"
          />
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-md">
            2. Aceptación del sistema
          </div>
          <q-list>
            <q-item tag="label">
              <q-item-section avatar>
                <q-checkbox v-model="form.internalRegulationAccepted" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Acepto el anexo al Reglamento Interno / uso del sistema</q-item-label>
                <q-item-label caption>
                  Declaro conocer y aceptar las condiciones del sistema de control
                  de asistencia según el Art. 33 del Código del Trabajo.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item tag="label">
              <q-item-section avatar>
                <q-checkbox v-model="form.biometricsAccepted" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Acepto uso de foto como mecanismo de identificación</q-item-label>
                <q-item-label caption>
                  Cada marcación capturará una fotografía al momento del registro
                  para validar que eres tú quien marca.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item tag="label">
              <q-item-section avatar>
                <q-checkbox v-model="form.geolocationAccepted" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Acepto uso de geolocalización al momento de la marca</q-item-label>
                <q-item-label caption>
                  Se captura la ubicación SÓLO en el instante de marcar, nunca
                  de forma continua durante la jornada.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item tag="label">
              <q-item-section avatar>
                <q-checkbox v-model="form.personalDeviceAgreement" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Uso de mi teléfono personal como terminal de marcación</q-item-label>
                <q-item-label caption>
                  Si aceptas, el empleador queda obligado a cubrir los costos de
                  datos móviles, accesorios y reposición del equipo conforme a la
                  Res. Ex. N°38/2024. Puedes no aceptar y usar un terminal provisto
                  por el empleador.
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            color="primary" unelevated
            label="Aceptar y firmar"
            icon="check"
            :disable="!canAccept"
            :loading="saving"
            @click="accept"
          />
        </q-card-actions>
      </q-card>

      <q-banner v-if="alreadyAccepted" class="q-mt-md bg-green-1">
        <q-icon name="check_circle" class="text-positive q-mr-sm" />
        Aceptaste este consentimiento el
        <b>{{ fmt(currentConsent?.acceptedAt) }}</b>
        (versión {{ currentConsent?.version }}).
        <q-btn
          flat dense color="primary" label="Ir al panel"
          icon-right="arrow_forward" class="q-ml-sm"
          to="/employee/dashboard"
        />
      </q-banner>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: 'EmpConsentimientoDT' })

import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useDtStore } from '@/stores/dtStore'
import { useAuthStore } from '@/stores/authStore'

const dt = useDtStore()
const auth = useAuthStore()
const router = useRouter()
const $q = useQuasar()

const personalEmail = ref('')
const saving = ref(false)
const currentConsent = ref(null)

// Detecta si el usuario está aquí porque el guard lo redirigió (primer uso)
// o porque vino voluntariamente (ya tiene consent y solo quiere revisar).
const isOnboarding = computed(() => {
  if (auth.role !== 'employee') return false
  return !auth.user?.dtConsent?.acceptedAt || !auth.user?.personalEmail
})

const form = reactive({
  version: '1.0',
  internalRegulationAccepted: false,
  biometricsAccepted: false,
  geolocationAccepted: false,
  personalDeviceAgreement: false,
})

const isValidEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail.value || '')
)

const canAccept = computed(
  () =>
    form.internalRegulationAccepted &&
    form.biometricsAccepted &&
    form.geolocationAccepted
)

const alreadyAccepted = computed(() => !!currentConsent.value?.acceptedAt)

function fmt(d) { return d ? new Date(d).toLocaleString('es-CL') : '-' }

async function savePersonalEmail() {
  try {
    await dt.setPersonalEmail(personalEmail.value.toLowerCase())
    // Refrescar el user del authStore para que el guard sepa que ya hay personalEmail
    try { await auth.fetchMe() } catch {}
    $q.notify({ type: 'positive', message: 'Correo personal guardado' })
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error' })
  }
}

async function accept() {
  saving.value = true
  try {
    await dt.acceptConsent(form)
    // Refrescar el user del authStore para liberar el gate de consentimiento
    try { await auth.fetchMe() } catch {}
    $q.notify({
      type: 'positive',
      message: 'Consentimiento registrado. Bienvenido al sistema.',
      timeout: 2500,
    })
    await load()
    // Si era onboarding, llevarlo a su dashboard.
    // Si vino voluntariamente, lo dejamos donde está.
    if (auth.user?.dtConsent?.acceptedAt && auth.user?.personalEmail) {
      setTimeout(() => router.push('/employee/dashboard'), 800)
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error' })
  } finally {
    saving.value = false
  }
}

async function load() {
  const data = await dt.fetchConsent()
  if (data?.personalEmail) personalEmail.value = data.personalEmail
  if (data?.dtConsent?.acceptedAt) {
    currentConsent.value = data.dtConsent
    Object.assign(form, {
      internalRegulationAccepted: !!data.dtConsent.internalRegulationAccepted,
      biometricsAccepted: !!data.dtConsent.biometricsAccepted,
      geolocationAccepted: !!data.dtConsent.geolocationAccepted,
      personalDeviceAgreement: !!data.dtConsent.personalDeviceAgreement,
      version: data.dtConsent.version || '1.0',
    })
  }
}

onMounted(load)
</script>

<style scoped>
.consent-shell { max-width: 820px; margin: 0 auto; }
</style>
