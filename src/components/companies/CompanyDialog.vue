<template>
  <q-dialog
    v-model="visible"
    persistent
    transition-show="scale"
    transition-hide="scale"
    maximized
    class="rk-company-dialog-wrapper"
  >
    <q-card class="rk-company-dialog">
      <!-- Decorative Background -->
      <div class="rk-dialog-bg">
        <div class="rk-grid-pattern"></div>
        <div class="rk-glow-orb rk-orb-1"></div>
        <div class="rk-glow-orb rk-orb-2"></div>
      </div>

      <!-- Header Premium -->
      <div class="rk-header">
        <div class="rk-header-content">
          <div class="rk-header-icon">
            <q-icon name="apartment" />
            <div class="rk-icon-pulse"></div>
          </div>
          <div class="rk-header-text">
            <h3 class="rk-header-title">
              {{ isEdit ? 'Editar empresa' : 'Crear nueva empresa' }}
            </h3>
            <p class="rk-header-subtitle">
              {{ isEdit ? 'Modifica los datos de la empresa' : 'Configura los datos de la nueva empresa' }}
            </p>
          </div>
        </div>
        <div class="rk-header-actions">
          <!-- Cambios sin guardar badge -->
          <div v-if="tieneCambios" class="rk-changes-badge">
            <div class="rk-badge-pulse"></div>
            <q-icon name="edit" />
            <span>Cambios sin guardar</span>
          </div>
          <button class="rk-close-btn" @click="cancelar">
            <q-icon name="close" />
          </button>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div class="rk-progress-container">
        <div class="rk-progress-bar">
          <div 
            class="rk-progress-fill" 
            :style="{ width: formProgress + '%' }"
          ></div>
        </div>
        <div class="rk-progress-label">
          <span>Progreso de configuración</span>
          <strong>{{ formProgress }}%</strong>
        </div>
      </div>

      <!-- Body -->
      <div class="rk-body">
        <!-- Tabs Premium -->
        <div class="rk-tabs-wrapper">
          <div class="rk-tabs">
            <button
              v-for="tabItem in tabs"
              :key="tabItem.value"
              class="rk-tab"
              :class="{ 
                'active': tab === tabItem.value, 
                'completed': isTabCompleted(tabItem.value),
                'has-warning': tabItem.value === 'payroll' && autoPublicaSinPlantilla
              }"
              @click="tab = tabItem.value"
            >
              <div class="rk-tab-icon">
                <q-icon :name="tabItem.icon" />
                <div v-if="isTabCompleted(tabItem.value)" class="rk-tab-check">
                  <q-icon name="check" />
                </div>
                <div v-if="tabItem.value === 'payroll' && autoPublicaSinPlantilla" class="rk-tab-warning">
                  <q-icon name="warning" />
                </div>
              </div>
              <div class="rk-tab-content">
                <span class="rk-tab-label">{{ tabItem.label }}</span>
                <span class="rk-tab-desc">{{ tabItem.desc }}</span>
              </div>
              <div class="rk-tab-indicator"></div>
            </button>
          </div>
        </div>

        <!-- Contextual Help Banner -->
        <div v-if="ayudaTexto" class="rk-help-banner">
          <div class="rk-help-icon">
            <q-icon name="lightbulb" />
          </div>
          <div class="rk-help-content">
            <p v-html="ayudaTexto"></p>
          </div>
        </div>

        <!-- Form Content -->
        <q-form
          ref="formRef"
          greedy
          class="rk-form"
          @submit.prevent="submit"
        >
          <q-tab-panels
            v-model="tab"
            animated
            transition-prev="slide-right"
            transition-next="slide-left"
            class="rk-panels"
          >
            <!-- Panel: Datos Básicos -->
            <q-tab-panel name="basicos" class="rk-panel">
              <div class="rk-panel-header">
                <q-icon name="domain" class="rk-panel-icon" />
                <div>
                  <h4 class="rk-panel-title">Datos básicos</h4>
                  <p class="rk-panel-subtitle">Información legal y de contacto</p>
                </div>
              </div>
              <CompanyBasicsTab
                v-model="form"
                :is-edit="isEdit"
                @validity="v => valid.basicos = v"
              />
            </q-tab-panel>

            <!-- Panel: Nómina -->
            <q-tab-panel name="payroll" class="rk-panel">
              <div class="rk-panel-header">
                <q-icon name="request_quote" class="rk-panel-icon" />
                <div>
                  <h4 class="rk-panel-title">Configuración de nómina</h4>
                  <p class="rk-panel-subtitle">Frecuencia, corte y reglas de pago</p>
                </div>
              </div>
              <CompanyPayrollTab
                v-model="form.payrollConfig"
                :holidays="form.holidays"
                @validity="v => valid.payroll = v"
              />
              
              <!-- Warning: Auto-publish sin template -->
              <div v-if="autoPublicaSinPlantilla" class="rk-warning-card">
                <div class="rk-warning-icon">
                  <q-icon name="warning" />
                </div>
                <div class="rk-warning-content">
                  <strong>Publicación automática sin plantilla</strong>
                  <p>Tienes activada la publicación automática pero no has seleccionado una plantilla PDF. Se usará el diseño por defecto.</p>
                </div>
              </div>
            </q-tab-panel>

            <!-- Panel: Política de Vacaciones -->
            <q-tab-panel name="politica" class="rk-panel">
              <div class="rk-panel-header">
                <q-icon name="policy" class="rk-panel-icon" />
                <div>
                  <h4 class="rk-panel-title">Política de vacaciones</h4>
                  <p class="rk-panel-subtitle">Acumulación, traslado y límites</p>
                </div>
              </div>
              <CompanyTimeOffTab
                v-model="form.timeOffPolicy"
                @apply-preset="applyTimeOffPreset"
                @validity="v => valid.politica = v"
              />
            </q-tab-panel>

            <!-- Panel: Feriados -->
            <q-tab-panel name="feriados" class="rk-panel">
              <div class="rk-panel-header">
                <q-icon name="event_busy" class="rk-panel-icon" />
                <div>
                  <h4 class="rk-panel-title">Feriados de la empresa</h4>
                  <p class="rk-panel-subtitle">Días no laborables para cálculos</p>
                </div>
              </div>
              <CompanyHolidaysTab
                v-model="form.holidays"
                @validity="v => valid.feriados = v"
              />
            </q-tab-panel>

            <!-- Panel: Logo -->
            <q-tab-panel name="logo" class="rk-panel">
              <div class="rk-panel-header">
                <q-icon name="image" class="rk-panel-icon" />
                <div>
                  <h4 class="rk-panel-title">Logo de la empresa</h4>
                  <p class="rk-panel-subtitle">Imagen que aparecerá en documentos</p>
                </div>
              </div>
              <CompanyLogoTab
                v-model:logo="form.logo"
                v-model:file="logoFile"
                v-model:preview="logoPreview"
                @validity="v => valid.logo = v"
              />
            </q-tab-panel>
          </q-tab-panels>
        </q-form>
      </div>

      <!-- Footer Actions -->
      <div class="rk-footer">
        <div class="rk-footer-info">
          <q-icon name="keyboard" />
          <span>
            Usa <kbd>Esc</kbd> para cancelar, 
            <kbd>Ctrl+Enter</kbd> para guardar
            <span v-if="!isEdit">, <kbd>Alt+Enter</kbd> para guardar y crear otra</span>
          </span>
        </div>
        <div class="rk-footer-actions">
          <q-btn
            flat
            no-caps
            label="Cancelar"
            @click="cancelar"
            class="rk-footer-btn rk-btn-cancel"
          />
          <q-btn
            v-if="!isEdit"
            outline
            no-caps
            :disable="saving || !validAll"
            label="Guardar y crear otra"
            icon-right="add"
            @click="submitAndReset"
            class="rk-footer-btn rk-btn-secondary"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear empresa')"
            :loading="saving"
            :disable="!validAll"
            icon-right="check"
            @click="submit"
            class="rk-footer-btn rk-btn-primary"
          >
            <div class="rk-btn-shine"></div>
          </q-btn>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import { useCompaniesStore } from '@/stores/companies'

import CompanyBasicsTab   from './tabs/CompanyBasicsTab.vue'
import CompanyTimeOffTab  from './tabs/CompanyTimeOffTab.vue'
import CompanyHolidaysTab from './tabs/CompanyHolidaysTab.vue'
import CompanyLogoTab     from './tabs/CompanyLogoTab.vue'
import CompanyPayrollTab  from './tabs/CompanyPayrollTab.vue'

/* Props / Emits */
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  editData:   { type: Object,  default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

/* Estado base */
const $q = useQuasar()
const companies = useCompaniesStore()
const visible = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v),
})
const isEdit = computed(() => !!props.editData?._id)

const tab = ref('basicos')
const formRef = ref(null)
const saving  = ref(false)

const logoFile    = ref(null)
const logoPreview = ref('')

/* Tabs Definition */
const tabs = [
  {
    value: 'basicos',
    label: 'Datos básicos',
    desc: 'Información legal',
    icon: 'domain'
  },
  {
    value: 'payroll',
    label: 'Nómina',
    desc: 'Configuración de pagos',
    icon: 'request_quote'
  },
  {
    value: 'politica',
    label: 'Vacaciones',
    desc: 'Política de tiempo libre',
    icon: 'policy'
  },
  {
    value: 'feriados',
    label: 'Feriados',
    desc: 'Días no laborables',
    icon: 'event_busy'
  },
  {
    value: 'logo',
    label: 'Logo',
    desc: 'Imagen corporativa',
    icon: 'image'
  }
]

/* Validaciones de secciones */
const valid = ref({
  basicos: false,
  payroll: true,
  politica: true,
  feriados: true,
  logo: true,
})
const validAll = computed(() => Object.values(valid.value).every(Boolean))

/* Form Progress */
const formProgress = computed(() => {
  let progress = 0
  const f = form.value
  
  // Básicos (40%)
  if (f.name) progress += 10
  if (f.rut) progress += 10
  if (f.email) progress += 10
  if (f.phone) progress += 5
  if (f.address) progress += 5
  
  // Payroll (20%)
  if (f.payrollConfig?.frequency) progress += 10
  if (f.payrollConfig?.cutoffDay) progress += 10
  
  // Política (20%)
  if (f.timeOffPolicy?.vacation?.accrual?.mode) progress += 10
  if (f.timeOffPolicy?.vacation?.accrual?.perYearDays) progress += 10
  
  // Feriados (10%)
  if (f.holidays?.length > 0) progress += 10
  
  // Logo (10%)
  if (f.logo || logoFile.value) progress += 10
  
  return Math.min(Math.round(progress), 100)
})

/* Tab Completion */
const isTabCompleted = (tabName) => {
  const f = form.value
  switch(tabName) {
    case 'basicos':
      return !!(f.name && f.rut && f.email)
    case 'payroll':
      return !!(f.payrollConfig?.frequency && f.payrollConfig?.cutoffDay)
    case 'politica':
      return !!(f.timeOffPolicy?.vacation?.accrual?.mode)
    case 'feriados':
      return f.holidays?.length > 0
    case 'logo':
      return !!(f.logo || logoFile.value)
    default:
      return false
  }
}

/* Valores por defecto */
function defaultTimeOff () {
  return {
    vacation: {
      accrual: {
        mode: 'DAILY',
        perYearDays: 15,
        perMonthDays: null,
        accrueOnBusinessDays: true,
        startAfterDays: 0,
        prorateFromStartDate: true,
      },
      carryOver: { enabled: true,  maxCarry: 5,  resetMonth: 1, resetDay: 1 },
      cap:       { enabled: true,  maxDays: 30 },
    },
    policyVersion: 1,
  }
}

function defaultPayrollConfig () {
  return {
    frequency: 'monthly',
    cutoffDay: 25,
    paydayRule: 'last_business_day',
    paydayDayOfMonth: 5,
    businessDayAdjust: 'previous',
    generateTime: '20:00',
    timezone: 'America/Santiago',
    autoPublish: true,
    notifyOnPublish: true,
    templateId: '',
    rounding: '0',
    lastRunAt: null,
    nextRunAt: null,
  }
}

function defaultForm () {
  return {
    name:    '',
    rut:     '',
    email:   '',
    phone:   '',
    address: '',
    status:  'active',
    logo:    '',
    timeOffPolicy: defaultTimeOff(),
    payrollConfig: defaultPayrollConfig(),
    holidays: [],
  }
}

const form = ref(defaultForm())

/* Ayuda contextual por pestaña */
const ayudaTexto = computed(() => {
  switch (tab.value) {
    case 'basicos':
      return 'Completa los <b>datos legales y de contacto</b> de la empresa. Estos datos se usarán en documentos y notificaciones.'
    case 'payroll':
      return 'Configura la <b>frecuencia</b>, <b>corte</b>, <b>regla de pago</b> y la <b>hora</b> de ejecución; si habilitas <b>publicación automática</b>, el documento se publicará sin revisión.'
    case 'politica':
      return 'Define cómo se <b>acumulan</b> las vacaciones (por año/mes), si hay <b>carencia</b>, <b>prorrateo</b>, <b>traslado de saldo</b> y <b>tope</b> de días.'
    case 'feriados':
      return 'Carga los <b>feriados</b> de la empresa. Se usan para calcular <b>días hábiles</b> en nómina y vacación.'
    case 'logo':
      return 'Sube el <b>logo</b> que se mostrará en documentos y vistas de la empresa.'
    default:
      return ''
  }
})

/* Aviso: publicación automática sin plantilla */
const autoPublicaSinPlantilla = computed(() =>
  form.value?.payrollConfig?.autoPublish && !form.value?.payrollConfig?.templateId
)

/* Detección de cambios */
let fotografia = ''
function tomarFotografia () {
  fotografia = JSON.stringify(form.value ?? {})
}
const tieneCambios = computed(() => JSON.stringify(form.value ?? {}) !== fotografia)

/* Ciclo de vida al abrir/cerrar */
watch(() => visible.value, (v) => {
  if (!v) return
  tab.value = 'basicos'

  if (props.editData) {
    form.value = {
      name:    props.editData.name    || '',
      rut:     props.editData.rut     || '',
      email:   props.editData.email   || '',
      phone:   props.editData.phone   || '',
      address: props.editData.address || '',
      status:  props.editData.status  || 'active',
      logo:    props.editData.logo    || '',
      timeOffPolicy: props.editData.timeOffPolicy || defaultTimeOff(),
      payrollConfig: props.editData.payrollConfig || defaultPayrollConfig(),
      holidays: Array.isArray(props.editData.holidays) ? props.editData.holidays : [],
    }
    logoPreview.value = props.editData.logo || ''
  } else {
    form.value = defaultForm()
    logoFile.value = null
    logoPreview.value = ''
  }

  valid.value = { basicos: false, payroll: true, politica: true, feriados: true, logo: true }
  tomarFotografia()
})

/* Presets de vacaciones */
function applyTimeOffPreset (key) {
  if (key === 'cl_basica') {
    form.value.timeOffPolicy = defaultTimeOff()
    $q.notify({ type: 'info', message: 'Preset aplicado: Chile – Básica' })
  }
  if (key === 'acumulacion_mensual') {
    form.value.timeOffPolicy = {
      vacation: {
        accrual: {
          mode: 'MONTHLY',
          perYearDays: 15,
          perMonthDays: 1.25,
          accrueOnBusinessDays: false,
          startAfterDays: 0,
          prorateFromStartDate: true,
        },
        carryOver: { enabled: true, maxCarry: 5, resetMonth: 1, resetDay: 1 },
        cap:       { enabled: true, maxDays: 30 },
      },
      policyVersion: 1,
    }
    $q.notify({ type: 'info', message: 'Preset aplicado: Mensual 1,25 días' })
  }
}

/* Guardar */
async function submit () {
  const ok = await formRef.value?.validate?.().catch(() => false)
  if (!ok || !validAll.value) {
    $q.notify({ type: 'negative', message: 'Revisa los campos obligatorios de cada sección.' })
    return
  }
  try {
    saving.value = true
    const payload = { ...form.value }
    if (logoFile.value) payload._logoFile = logoFile.value

    let res
    if (isEdit.value) {
      res = await companies.updateCompany(props.editData._id, payload)
      $q.notify({ type: 'positive', message: 'Cambios guardados correctamente' })
    } else {
      res = await companies.createCompany(payload)
      $q.notify({ type: 'positive', message: 'Empresa creada correctamente' })
    }
    emit('saved', res)
    visible.value = false
  } catch (e) {
    $q.notify({ type: 'negative', message: companies.error || e?.message || 'Error al guardar' })
  } finally {
    saving.value = false
  }
}

/* Guardar y limpiar para crear otra */
async function submitAndReset () {
  if (isEdit.value) return
  const ok = await formRef.value?.validate?.().catch(() => false)
  if (!ok || !validAll.value) {
    $q.notify({ type: 'negative', message: 'Revisa los campos obligatorios de cada sección.' })
    return
  }
  try {
    saving.value = true
    const payload = { ...form.value }
    if (logoFile.value) payload._logoFile = logoFile.value
    const res = await companies.createCompany(payload)
    $q.notify({ type: 'positive', message: 'Empresa creada. Puedes crear otra.' })
    emit('saved', res)
    form.value = defaultForm()
    logoFile.value = null
    logoPreview.value = ''
    tab.value = 'basicos'
    tomarFotografia()
  } catch (e) {
    $q.notify({ type: 'negative', message: companies.error || e?.message || 'Error al guardar' })
  } finally {
    saving.value = false
  }
}

/* Cerrar y atajos */
function cancelar () {
  if (tieneCambios.value) {
    $q.dialog({
      title: 'Descartar cambios',
      message: '¿Deseas cerrar sin guardar los cambios?',
      ok: { label: 'Sí, cerrar', color: 'negative' },
      cancel: { label: 'Volver', flat: true },
      persistent: true,
    }).onOk(() => visible.value = false)
  } else {
    visible.value = false
  }
}

function hotkeys (e) {
  if (!visible.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    cancelar()
  }
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    submit()
  }
  if (!isEdit.value && e.key === 'Enter' && e.altKey) {
    e.preventDefault()
    submitAndReset()
  }
}

onMounted(() => window.addEventListener('keydown', hotkeys))
onBeforeUnmount(() => window.removeEventListener('keydown', hotkeys))
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

:root {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-accent: #14b8a6;
}

/* Theme Variables */
.rk-company-dialog {
  --dialog-bg: rgba(255, 255, 255, 0.98);
  --surface-1: rgba(6, 182, 212, 0.03);
  --surface-2: rgba(6, 182, 212, 0.06);
  --surface-3: rgba(6, 182, 212, 0.1);
  --text-primary: rgba(15, 23, 42, 0.95);
  --text-secondary: rgba(15, 23, 42, 0.7);
  --text-muted: rgba(15, 23, 42, 0.5);
  --border-1: rgba(6, 182, 212, 0.12);
  --border-2: rgba(6, 182, 212, 0.2);
  --shadow-sm: 0 2px 8px rgba(6, 182, 212, 0.08);
  --shadow-md: 0 4px 16px rgba(6, 182, 212, 0.12);
  --shadow-lg: 0 8px 32px rgba(6, 182, 212, 0.15);
}

.body--dark .rk-company-dialog {
  --dialog-bg: rgba(10, 14, 20, 0.98);
  --surface-1: rgba(6, 182, 212, 0.05);
  --surface-2: rgba(6, 182, 212, 0.08);
  --surface-3: rgba(6, 182, 212, 0.12);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --border-1: rgba(6, 182, 212, 0.15);
  --border-2: rgba(6, 182, 212, 0.25);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* Dialog Wrapper */
.rk-company-dialog-wrapper :deep(.q-dialog__backdrop) {
  backdrop-filter: blur(8px);
  background: rgba(10, 14, 20, 0.7);
}

/* Dialog Container */
.rk-company-dialog {
  position: relative;
  width: 95vw;
  max-width: 1400px;
  height: 90vh;
  max-height: 900px;
  border-radius: 24px;
  background: var(--dialog-bg);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg);
  border: 1.5px solid var(--border-1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Sora', -apple-system, sans-serif;
}

/* Background Effects */
.rk-dialog-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.rk-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(var(--border-1) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-1) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
}

.rk-glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.08;
}

.rk-orb-1 {
  width: 350px;
  height: 350px;
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, var(--color-primary), transparent 60%);
}

.rk-orb-2 {
  width: 300px;
  height: 300px;
  bottom: -80px;
  left: -80px;
  background: radial-gradient(circle, var(--color-accent), transparent 60%);
}

/* Header */
.rk-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  background: var(--surface-1);
  border-bottom: 1.5px solid var(--border-1);
  z-index: 10;
}

.rk-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rk-header-icon {
  position: relative;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3);
}

.rk-header-icon .q-icon {
  font-size: 26px;
  color: #fff;
  z-index: 1;
}

.rk-icon-pulse {
  position: absolute;
  inset: -4px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 16px;
  opacity: 0;
  filter: blur(8px);
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }
}

.rk-header-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.rk-header-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

.rk-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Changes Badge */
.rk-changes-badge {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(245, 158, 11, 0.12);
  border: 1.5px solid rgba(245, 158, 11, 0.3);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #f59e0b;
  letter-spacing: 0.3px;
}

.body--dark .rk-changes-badge {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}

.rk-changes-badge .q-icon {
  font-size: 16px;
}

.rk-badge-pulse {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 50%;
  left: 8px;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
  }
}

.rk-close-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: 1.5px solid var(--border-1);
  border-radius: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-close-btn:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
  color: var(--text-primary);
  transform: rotate(90deg);
}

.rk-close-btn .q-icon {
  font-size: 20px;
}

/* Progress Bar */
.rk-progress-container {
  position: relative;
  padding: 16px 32px;
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-1);
  z-index: 9;
}

.rk-progress-bar {
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.rk-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
}

.rk-progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.rk-progress-label span {
  color: var(--text-muted);
  font-weight: 600;
}

.rk-progress-label strong {
  font-weight: 800;
  color: var(--color-primary);
  font-family: 'Space Mono', monospace;
}

.body--dark .rk-progress-label strong {
  color: var(--color-primary-light);
}

/* Body */
.rk-body {
  flex: 1;
  position: relative;
  overflow-y: auto;
  z-index: 1;
}

/* Tabs Premium */
.rk-tabs-wrapper {
  padding: 20px 32px 0;
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-1);
}

.rk-tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.rk-tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.rk-tab::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--surface-2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rk-tab:hover::before {
  opacity: 1;
}

.rk-tab.active {
  background: var(--dialog-bg);
  border-color: var(--border-2);
  border-bottom-color: transparent;
}

.rk-tab.active::before {
  opacity: 0;
}

.rk-tab-icon {
  position: relative;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 10px;
  transition: all 0.3s ease;
  z-index: 1;
}

.rk-tab.active .rk-tab-icon {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-tab-icon .q-icon {
  font-size: 20px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.rk-tab.active .rk-tab-icon .q-icon {
  color: #fff;
}

/* Tab Check */
.rk-tab-check {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
  z-index: 2;
}

.body--dark .rk-tab-check {
  background: #4ade80;
}

.rk-tab-check .q-icon {
  font-size: 12px;
  color: #fff;
}

/* Tab Warning */
.rk-tab-warning {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f59e0b;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
  z-index: 2;
  animation: warningPulse 2s ease-in-out infinite;
}

@keyframes warningPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.rk-tab-warning .q-icon {
  font-size: 12px;
  color: #fff;
}

.rk-tab-content {
  text-align: center;
  z-index: 1;
}

.rk-tab-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 2px;
  transition: color 0.3s ease;
}

.rk-tab.active .rk-tab-label {
  color: var(--text-primary);
}

.rk-tab-desc {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
}

.rk-tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rk-tab.active .rk-tab-indicator {
  opacity: 1;
}

/* Help Banner */
.rk-help-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 32px;
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-left: 4px solid var(--color-primary);
  margin: 16px 32px;
  border-radius: 12px;
}

.rk-help-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 8px;
  flex-shrink: 0;
}

.rk-help-icon .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-help-content p {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-weight: 500;
}

/* Form */
.rk-form {
  flex: 1;
}

.rk-panels {
  background: transparent;
}

.rk-panels :deep(.q-panel) {
  overflow-y: auto;
}

.rk-panel {
  padding: 28px 32px;
}

.rk-panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1.5px solid var(--border-1);
}

.rk-panel-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 12px;
  font-size: 24px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
}

.rk-panel-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.rk-panel-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Warning Card */
.rk-warning-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  margin-top: 24px;
}

.body--dark .rk-warning-card {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);
}

.rk-warning-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 8px;
  flex-shrink: 0;
}

.body--dark .rk-warning-icon {
  background: rgba(245, 158, 11, 0.2);
}

.rk-warning-icon .q-icon {
  font-size: 18px;
  color: #f59e0b;
}

.body--dark .rk-warning-icon .q-icon {
  color: #fbbf24;
}

.rk-warning-content strong {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: #d97706;
}

.body--dark .rk-warning-content strong {
  color: #fbbf24;
}

.rk-warning-content p {
  font-size: 0.88rem;
  color: #d97706;
  margin: 0;
  line-height: 1.5;
}

.body--dark .rk-warning-content p {
  color: rgba(251, 191, 36, 0.9);
}

/* Footer */
.rk-footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  background: var(--surface-1);
  border-top: 1.5px solid var(--border-1);
  z-index: 10;
}

.rk-footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.rk-footer-info .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-footer-info kbd {
  padding: 4px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  color: var(--text-primary);
}

.rk-footer-actions {
  display: flex;
  gap: 12px;
}

.rk-footer-btn {
  border-radius: 11px;
  font-weight: 700;
  padding: 12px 24px;
  text-transform: none;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-btn-cancel {
  color: var(--text-secondary);
  border: 1.5px solid var(--border-1);
  background: var(--surface-2);
}

.rk-btn-cancel:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
  color: var(--text-primary);
}

.rk-btn-secondary {
  color: var(--color-primary);
  border: 1.5px solid var(--border-2);
  background: var(--surface-2);
}

.body--dark .rk-btn-secondary {
  color: var(--color-primary-light);
}

.rk-btn-secondary:hover {
  background: var(--surface-3);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
}

.rk-btn-primary {
  position: relative;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3);
  overflow: hidden;
}

.rk-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
}

.rk-btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.rk-btn-primary:hover .rk-btn-shine {
  left: 100%;
}

/* Responsive */
@media (max-width: 1200px) {
  .rk-company-dialog {
    width: 98vw;
    height: 95vh;
  }

  .rk-tabs {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1023px) {
  .rk-header {
    padding: 20px 24px;
  }

  .rk-progress-container,
  .rk-tabs-wrapper,
  .rk-help-banner,
  .rk-panel {
    padding-left: 24px;
    padding-right: 24px;
  }

  .rk-tabs {
    grid-template-columns: repeat(2, 1fr);
  }

  .rk-footer {
    padding: 16px 24px;
  }
}

@media (max-width: 767px) {
  .rk-company-dialog {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .rk-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 20px;
  }

  .rk-header-content {
    width: 100%;
  }

  .rk-header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .rk-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  .rk-progress-container,
  .rk-tabs-wrapper,
  .rk-help-banner,
  .rk-panel {
    padding-left: 20px;
    padding-right: 20px;
  }

  .rk-tabs {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .rk-tab {
    flex-direction: row;
    justify-content: flex-start;
    border-radius: 12px;
    border-bottom-color: var(--border-1);
  }

  .rk-tab.active {
    border-bottom-color: var(--border-2);
  }

  .rk-tab-content {
    text-align: left;
  }

  .rk-tab-indicator {
    display: none;
  }

  .rk-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .rk-footer-info {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .rk-footer-actions {
    width: 100%;
    flex-direction: column;
  }

  .rk-footer-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 599px) {
  .rk-header-icon {
    width: 44px;
    height: 44px;
  }

  .rk-header-icon .q-icon {
    font-size: 22px;
  }

  .rk-header-title {
    font-size: 1.3rem;
  }

  .rk-tab-icon {
    width: 38px;
    height: 38px;
  }

  .rk-tab-icon .q-icon {
    font-size: 18px;
  }

  .rk-panel-icon {
    width: 42px;
    height: 42px;
    font-size: 22px;
  }
}
</style>