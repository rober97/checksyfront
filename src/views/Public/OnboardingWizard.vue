<template>
  <div class="ow-root">
    <div class="ow-card">
      <!-- ═══════════ Estado: cargando token ═══════════ -->
      <template v-if="loading">
        <div class="ow-center">
          <q-spinner size="38px" color="primary" />
          <div class="ow-loading-text">Validando enlace…</div>
        </div>
      </template>

      <!-- ═══════════ Estado: error (token inválido / vencido) ═══════════ -->
      <template v-else-if="error">
        <div class="ow-center">
          <q-icon name="error_outline" size="48px" color="negative" />
          <h2 class="ow-error-title">Enlace inválido o vencido</h2>
          <p class="ow-error-msg">{{ error }}</p>
          <p class="ow-error-hint">
            Pedile a RR.HH. de tu empresa que te reenvíe el correo de activación.
          </p>
        </div>
      </template>

      <!-- ═══════════ Estado: éxito (cuenta activada) ═══════════ -->
      <template v-else-if="completed">
        <div class="ow-center">
          <q-icon name="task_alt" size="56px" color="positive" />
          <h2 class="ow-success-title">¡Listo! Tu cuenta está activa.</h2>
          <p class="ow-success-msg">
            Ya podés iniciar sesión y empezar a marcar tu jornada.
          </p>
          <q-btn unelevated color="primary" size="md" label="Ir a iniciar sesión" @click="goLogin" />
        </div>
      </template>

      <!-- ═══════════ Wizard ═══════════ -->
      <template v-else>
        <!-- Header -->
        <header class="ow-head">
          <div class="ow-brand">
            <q-icon name="badge" size="22px" />
            <span>Activación de cuenta</span>
          </div>
          <div v-if="data?.company?.name" class="ow-company">{{ data.company.name }}</div>
        </header>

        <q-stepper
          v-model="step"
          ref="stepper"
          color="primary"
          animated
          flat
          header-nav
          class="ow-stepper"
        >
          <!-- ───── Paso 1: Bienvenida + datos personales ───── -->
          <q-step
            :name="1"
            title="Tus datos"
            icon="person"
            :done="step > 1"
          >
            <p class="ow-step-intro">
              Hola <b>{{ data?.user?.firstName || '' }}</b>, completá o confirmá tu información de contacto.
              Estos datos quedan en tu ficha y son los que usaremos para enviarte avisos.
            </p>

            <div class="ow-form-grid">
              <q-input v-model="form.phone" outlined dense label="Teléfono" :rules="phoneRules">
                <template #prepend><q-icon name="phone" size="16px" /></template>
              </q-input>
              <q-input v-model="form.emergencyContact" outlined dense label="Contacto de emergencia">
                <template #prepend><q-icon name="emergency" size="16px" /></template>
              </q-input>
              <q-input v-model="form.personalEmail" outlined dense label="Correo personal" :rules="emailRules" type="email">
                <template #prepend><q-icon name="alternate_email" size="16px" /></template>
              </q-input>
              <q-input v-model="form.address.line1" outlined dense label="Dirección">
                <template #prepend><q-icon name="home" size="16px" /></template>
              </q-input>
              <q-select
                v-model="form.address.region"
                :options="regionOptions"
                outlined dense label="Región"
                clearable use-input input-debounce="0"
                hide-bottom-space behavior="menu"
                @filter="filterRegion"
                @update:model-value="onRegionChange"
              >
                <template #no-option>
                  <q-item><q-item-section class="text-grey">Sin coincidencias</q-item-section></q-item>
                </template>
              </q-select>
              <q-select
                v-model="form.address.commune"
                :options="comunaOptions"
                outlined dense label="Comuna"
                clearable use-input input-debounce="0"
                hide-bottom-space behavior="menu"
                @filter="filterComuna"
                @update:model-value="onComunaChange"
              >
                <template #no-option>
                  <q-item><q-item-section class="text-grey">Sin coincidencias</q-item-section></q-item>
                </template>
              </q-select>
              <q-input v-model="form.address.city" outlined dense label="Ciudad (opcional)" />
            </div>

            <div class="ow-actions">
              <q-btn unelevated color="primary" size="md" label="Continuar" :disable="!step1Valid" @click="goStep(2)" />
            </div>
          </q-step>

          <!-- ───── Paso 2: Reglamento Interno ───── -->
          <q-step
            :name="2"
            title="Reglamento"
            icon="gavel"
            :done="step > 2"
          >
            <p class="ow-step-intro">
              Tomate un momento para revisar el Reglamento Interno de la empresa.
            </p>

            <div v-if="data?.company?.regulationConfigured" class="ow-pdf-wrap">
              <iframe
                :src="data.company.regulationUrl"
                class="ow-pdf-iframe"
                title="Reglamento Interno"
                allow="fullscreen"
              ></iframe>
              <div class="ow-pdf-hint">
                <q-icon name="info" size="14px" />
                <span>¿Problemas para visualizarlo?
                  <a :href="data.company.regulationUrl" target="_blank" rel="noopener">Abrir en una pestaña nueva</a>.
                </span>
              </div>
            </div>
            <div v-else class="ow-warn">
              <q-icon name="warning" size="18px" />
              <div>
                La empresa todavía no publicó su Reglamento Interno. No podés continuar hasta que RR.HH. lo cargue.
              </div>
            </div>

            <q-checkbox
              v-model="form.regulationRead"
              :disable="!data?.company?.regulationConfigured"
              label="He leído y comprendo el Reglamento Interno"
              class="ow-check"
            />

            <div class="ow-actions">
              <q-btn flat color="grey-7" label="Atrás" @click="goStep(1)" />
              <q-btn unelevated color="primary" label="Continuar" :disable="!form.regulationRead" @click="goStep(3)" />
            </div>
          </q-step>

          <!-- ───── Paso 3: Anexo DT Res. Ex. 38/2024 ───── -->
          <q-step
            :name="3"
            title="Consentimiento DT"
            icon="rule"
            :done="step > 3"
          >
            <p class="ow-step-intro">
              Para poder marcar tu jornada de trabajo en este sistema necesitamos tu consentimiento expreso
              sobre las siguientes cláusulas (Res. Ex. N°38/2024 — Dirección del Trabajo).
            </p>

            <div class="ow-consent-list">
              <label class="ow-consent-item">
                <q-checkbox v-model="form.personalDeviceAgreement" />
                <div class="ow-consent-body">
                  <div class="ow-consent-title">Uso de mi teléfono personal como terminal de marcación</div>
                  <div class="ow-consent-text">
                    Autorizo a usar mi propio dispositivo móvil para registrar mis marcaciones. Mi empleador
                    se compromete a costear el plan de datos, accesorios y/o reposición del equipo cuando
                    corresponda según el dictamen DT.
                  </div>
                </div>
              </label>

              <label class="ow-consent-item">
                <q-checkbox v-model="form.biometricsAccepted" />
                <div class="ow-consent-body">
                  <div class="ow-consent-title">Captura de fotografía / biometría</div>
                  <div class="ow-consent-text">
                    Acepto que el sistema capture mi imagen al momento de marcar entrada y salida, con el
                    único fin de verificar mi identidad. La fotografía se conserva cifrada y sólo puede ser
                    consultada por personal autorizado de RR.HH. o un fiscalizador de la DT.
                  </div>
                </div>
              </label>

              <label class="ow-consent-item">
                <q-checkbox v-model="form.geolocationAccepted" />
                <div class="ow-consent-body">
                  <div class="ow-consent-title">Captura de geolocalización en el instante de marcar</div>
                  <div class="ow-consent-text">
                    Acepto que el sistema capture mi ubicación GPS <b>únicamente en el momento puntual</b> en
                    que registro una marcación. NO hay rastreo continuo durante la jornada ni fuera de ella.
                  </div>
                </div>
              </label>
            </div>

            <div class="ow-actions">
              <q-btn flat color="grey-7" label="Atrás" @click="goStep(2)" />
              <q-btn unelevated color="primary" label="Continuar" :disable="!step3Valid" @click="goStep(hasOpeningBalance ? 4 : 5)" />
            </div>
          </q-step>

          <!-- ───── Paso 4: Confirmación de saldo de vacaciones (sólo carga inicial) ───── -->
          <q-step
            v-if="hasOpeningBalance"
            :name="4"
            title="Tus vacaciones"
            icon="beach_access"
            :done="step > 4"
          >
            <p class="ow-step-intro">
              Al incorporarte al sistema, tu empleador registró el saldo de vacaciones que traías
              acumulado a la fecha de corte. Revisalo y confirmá si coincide con tu última liquidación.
            </p>

            <div class="ow-balance-box">
              <div class="ow-balance-days">{{ openingBalance.vacationDays }}</div>
              <div class="ow-balance-meta">
                <div class="ow-balance-label">días hábiles de vacaciones disponibles</div>
                <div v-if="openingBalance.cutoffDate" class="ow-balance-cutoff">
                  al {{ formatDate(openingBalance.cutoffDate) }}
                </div>
              </div>
            </div>

            <div class="ow-consent-list" style="margin-top: 16px;">
              <label class="ow-consent-item" :class="{ 'is-active': form.openingBalanceConfirmed === true }">
                <q-radio v-model="form.openingBalanceConfirmed" :val="true" />
                <div class="ow-consent-body">
                  <div class="ow-consent-title">Sí, el saldo es correcto</div>
                  <div class="ow-consent-text">Coincide con lo que tengo registrado en mi última liquidación.</div>
                </div>
              </label>

              <label class="ow-consent-item" :class="{ 'is-active': form.openingBalanceConfirmed === false }">
                <q-radio v-model="form.openingBalanceConfirmed" :val="false" />
                <div class="ow-consent-body">
                  <div class="ow-consent-title">No coincide</div>
                  <div class="ow-consent-text">
                    El número no calza con mi saldo. RR.HH. lo revisará; podés activar tu cuenta igual y
                    se corregirá después.
                  </div>
                </div>
              </label>
            </div>

            <div v-if="form.openingBalanceConfirmed === false" class="ow-warn" style="margin-top: 14px;">
              <q-icon name="info" size="18px" />
              <div>Tu objeción quedará registrada para que RR.HH. revise y corrija el saldo.</div>
            </div>

            <div class="ow-actions">
              <q-btn flat color="grey-7" label="Atrás" @click="goStep(3)" />
              <q-btn unelevated color="primary" label="Continuar" :disable="form.openingBalanceConfirmed === null" @click="goStep(5)" />
            </div>
          </q-step>

          <!-- ───── Paso 5: Contraseña + firma ───── -->
          <q-step
            :name="5"
            title="Contraseña"
            icon="lock"
          >
            <p class="ow-step-intro">
              Definí la contraseña con la que vas a iniciar sesión. Mínimo 8 caracteres, te recomendamos mezclar
              mayúsculas, minúsculas y números.
            </p>

            <div class="ow-form-grid ow-form-grid--narrow">
              <q-input
                v-model="form.newPassword"
                outlined dense
                label="Nueva contraseña"
                :type="showPwd ? 'text' : 'password'"
                :rules="passwordRules"
              >
                <template #prepend><q-icon name="lock" size="16px" /></template>
                <template #append>
                  <q-icon
                    :name="showPwd ? 'visibility_off' : 'visibility'"
                    size="16px" class="cursor-pointer"
                    @click="showPwd = !showPwd"
                  />
                </template>
              </q-input>
              <q-input
                v-model="form.confirmPassword"
                outlined dense
                label="Repetir contraseña"
                :type="showPwd ? 'text' : 'password'"
                :rules="confirmRules"
              >
                <template #prepend><q-icon name="lock_outline" size="16px" /></template>
              </q-input>
            </div>

            <div class="ow-legal">
              <q-icon name="verified_user" size="18px" />
              <div>
                Al presionar <b>Firmar electrónicamente y activar</b> declarás aceptar el Reglamento Interno
                y las 3 cláusulas del anexo DT. Tu firma se registra como Firma Electrónica Simple
                (Ley N°19.799) y queda anclada a tu IP, dispositivo y fecha mediante un hash SHA-256.
              </div>
            </div>

            <div class="ow-actions">
              <q-btn flat color="grey-7" label="Atrás" :disable="submitting" @click="goStep(hasOpeningBalance ? 4 : 3)" />
              <q-btn
                unelevated color="primary"
                :loading="submitting"
                :disable="!step5Valid"
                label="Firmar electrónicamente y activar"
                icon="task_alt"
                @click="submit"
              />
            </div>
          </q-step>
        </q-stepper>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { API_URL } from '@/utils/api'
import { useChileAddress } from '@/composables/useChileAddress.js'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const token = computed(() => String(route.params.token || ''))

const loading = ref(true)
const error = ref(null)
const completed = ref(false)
const submitting = ref(false)

const data = ref(null)
const step = ref(1)
const showPwd = ref(false)

// Timer del paso 2 (cuánto tiempo el empleado estuvo viendo el reglamento)
let regulationStepEnterAt = null
const regulationStepMs = ref(0)

const form = reactive({
  phone: '',
  emergencyContact: '',
  personalEmail: '',
  address: { line1: '', commune: '', city: '', region: '' },
  regulationRead: false,
  personalDeviceAgreement: false,
  biometricsAccepted: false,
  geolocationAccepted: false,
  openingBalanceConfirmed: null, // null = sin responder, true = confirma, false = objeta
  newPassword: '',
  confirmPassword: '',
})

// Saldo de apertura de vacaciones (sólo presente en empleados de carga inicial)
const openingBalance = computed(() => data.value?.openingBalance || null)
const hasOpeningBalance = computed(() => openingBalance.value?.vacationDays != null)

function formatDate(d) {
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(new Date(d))
  } catch {
    return String(d)
  }
}

// Selectores de dirección (Región -> Comuna en cascada)
const {
  regionOptions,
  comunaOptions,
  filterRegion,
  filterComuna,
  onRegionChange,
  onComunaChange,
} = useChileAddress(() => form.address)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const phoneRules = [
  v => !v || v.length <= 30 || 'Demasiado largo',
]
const emailRules = [
  v => !v || EMAIL_RE.test(v) || 'Email inválido',
]
const passwordRules = [
  v => !!v || 'La contraseña es obligatoria',
  v => (v || '').length >= 8 || 'Mínimo 8 caracteres',
]
const confirmRules = [
  v => v === form.newPassword || 'Las contraseñas no coinciden',
]

const step1Valid = computed(() => {
  // personalEmail es obligatorio para empleados; si está vacío forzamos
  // que lo carguen acá. Si ya venía del backend, valida formato.
  if (!form.personalEmail) return false
  if (!EMAIL_RE.test(form.personalEmail)) return false
  return true
})

const step3Valid = computed(() =>
  form.personalDeviceAgreement && form.biometricsAccepted && form.geolocationAccepted
)

// El saldo debe estar respondido (confirmado u objetado) si corresponde.
const openingStepValid = computed(() =>
  !hasOpeningBalance.value || form.openingBalanceConfirmed !== null
)

const step5Valid = computed(() =>
  (form.newPassword || '').length >= 8 &&
  form.newPassword === form.confirmPassword &&
  step1Valid.value && step3Valid.value && form.regulationRead &&
  openingStepValid.value
)

async function load() {
  try {
    loading.value = true
    const res = await axios.get(`${API_URL}/auth/activate/${encodeURIComponent(token.value)}`)
    if (!res.data?.success) {
      error.value = res.data?.message || 'Enlace inválido'
      return
    }
    data.value = res.data.data
    // Prefill desde lo que el backend ya tiene
    form.phone            = data.value?.user?.phone || ''
    form.emergencyContact = data.value?.user?.emergencyContact || ''
    form.personalEmail    = data.value?.user?.personalEmail || ''
    form.address.line1    = data.value?.user?.address?.line1 || ''
    form.address.commune  = data.value?.user?.address?.commune || ''
    form.address.city     = data.value?.user?.address?.city || ''
    form.address.region   = data.value?.user?.address?.region || ''
  } catch (err) {
    error.value = err?.response?.data?.message || 'No se pudo validar el enlace.'
  } finally {
    loading.value = false
  }
}

function goStep(n) {
  // Suma el tiempo en el paso del reglamento al salir
  if (step.value === 2 && regulationStepEnterAt) {
    regulationStepMs.value += (Date.now() - regulationStepEnterAt)
    regulationStepEnterAt = null
  }
  if (n === 2) regulationStepEnterAt = Date.now()
  step.value = n
}

// Watcher por si el stepper navega via header-nav
watch(step, (v, old) => {
  if (old === 2 && regulationStepEnterAt) {
    regulationStepMs.value += (Date.now() - regulationStepEnterAt)
    regulationStepEnterAt = null
  }
  if (v === 2 && !regulationStepEnterAt) {
    regulationStepEnterAt = Date.now()
  }
})

async function submit() {
  if (!step5Valid.value) {
    $q.notify({ type: 'negative', message: 'Revisá que estén completos todos los pasos' })
    return
  }
  // Calcular tiempo total en paso 2 (incluido el momento actual si estamos por error en 2)
  let totalRegMs = regulationStepMs.value
  if (step.value === 2 && regulationStepEnterAt) {
    totalRegMs += (Date.now() - regulationStepEnterAt)
  }

  try {
    submitting.value = true
    const body = {
      personalData: {
        phone: form.phone,
        emergencyContact: form.emergencyContact,
        personalEmail: form.personalEmail,
        address: { ...form.address },
      },
      consent: {
        internalRegulationAccepted: form.regulationRead,
        personalDeviceAgreement: form.personalDeviceAgreement,
        biometricsAccepted: form.biometricsAccepted,
        geolocationAccepted: form.geolocationAccepted,
        regulationVersion: data.value?.company?.regulationVersion || '1.0',
        timeOnRegulationStepMs: totalRegMs,
      },
      // Sólo se envía cuando hay saldo de apertura que confirmar/objetar.
      ...(hasOpeningBalance.value ? { openingBalanceConfirmed: form.openingBalanceConfirmed } : {}),
      newPassword: form.newPassword,
    }
    const res = await axios.post(
      `${API_URL}/auth/activate/${encodeURIComponent(token.value)}/complete`,
      body
    )
    if (!res.data?.success) {
      $q.notify({ type: 'negative', message: res.data?.message || 'No se pudo activar' })
      return
    }
    completed.value = true
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error al activar la cuenta' })
  } finally {
    submitting.value = false
  }
}

function goLogin() {
  router.push({ name: 'Login' })
}

onMounted(load)
</script>

<style scoped>
.ow-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 32px 16px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

.ow-card {
  width: 100%;
  max-width: 760px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.ow-center {
  padding: 56px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  text-align: center;
}
.ow-loading-text { color: #475569; font-size: .95rem; }

.ow-error-title { font-size: 1.15rem; font-weight: 800; margin: 8px 0 0; color: #b91c1c; }
.ow-error-msg { color: #475569; margin: 0; }
.ow-error-hint { color: #94a3b8; font-size: .85rem; }

.ow-success-title { font-size: 1.25rem; font-weight: 800; margin: 8px 0 0; color: #166534; }
.ow-success-msg { color: #475569; }

.ow-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
}
.ow-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: .95rem; }
.ow-company { font-size: .85rem; opacity: .9; }

.ow-stepper {
  padding: 14px 20px 24px;
  background: transparent;
}
.ow-stepper :deep(.q-stepper__header) { box-shadow: none; }

.ow-step-intro { color: #475569; margin: 4px 0 18px; line-height: 1.55; }

.ow-form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px;
  margin-bottom: 18px;
}
.ow-form-grid--narrow { grid-template-columns: 1fr; max-width: 360px; }
@media (max-width: 520px) {
  .ow-form-grid, .ow-form-grid--narrow { grid-template-columns: 1fr; max-width: none; }
}

.ow-actions {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.ow-pdf-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
.ow-pdf-iframe { width: 100%; height: 460px; border: 0; display: block; background: #f8fafc; }
.ow-pdf-hint {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  font-size: .78rem; color: #64748b;
}
.ow-pdf-hint a { color: #4f46e5; text-decoration: none; }
.ow-pdf-hint a:hover { text-decoration: underline; }

.ow-warn {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 16px;
  background: #fef3c7; border: 1px solid #fcd34d; border-left: 3px solid #f59e0b;
  border-radius: 9px;
  color: #92400e; font-size: .88rem; line-height: 1.5;
}

.ow-check { margin-top: 14px; }

.ow-consent-list { display: flex; flex-direction: column; gap: 12px; }
.ow-consent-item {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 14px 16px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.ow-consent-item:hover { border-color: #c7d2fe; background: #eef2ff; }
.ow-consent-item.is-active { border-color: #6366f1; background: #eef2ff; }

.ow-balance-box {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 22px;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  border: 1px solid #c7d2fe; border-radius: 12px;
}
.ow-balance-days { font-size: 2.4rem; font-weight: 800; color: #4f46e5; line-height: 1; }
.ow-balance-meta { display: flex; flex-direction: column; gap: 2px; }
.ow-balance-label { font-weight: 700; color: #0f172a; font-size: .92rem; }
.ow-balance-cutoff { color: #64748b; font-size: .82rem; }
.ow-consent-body { display: flex; flex-direction: column; gap: 4px; }
.ow-consent-title { font-weight: 700; color: #0f172a; font-size: .9rem; }
.ow-consent-text { color: #475569; font-size: .82rem; line-height: 1.55; }

.ow-legal {
  display: flex; gap: 10px; align-items: flex-start;
  margin-top: 18px;
  padding: 12px 14px;
  background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 10px;
  color: #1e3a8a; font-size: .82rem; line-height: 1.55;
}
.ow-legal .q-icon { flex-shrink: 0; margin-top: 1px; }
</style>
