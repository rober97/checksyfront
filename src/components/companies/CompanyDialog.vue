<template>
  <q-dialog
    v-model="visible"
    persistent
    transition-show="jump-down"
    transition-hide="jump-up"
  >
    <q-card class="rk-company-card q-pa-none" :class="isDark ? 'rk--dark' : 'rk--light'">
      <!-- ===== Encabezado ===== -->
      <div class="rk-company-header row items-center">
        <div class="row items-center q-gutter-xs">
          <q-icon name="apartment" size="22px" />
          <div class="text-subtitle1 text-weight-medium">
            {{ isEdit ? 'Editar empresa' : 'Crear nueva empresa' }}
          </div>
        </div>

        <q-space />

        <!-- Indicador de cambios -->
        <q-chip
          v-if="tieneCambios"
          color="warning"
          text-color="black"
          dense
          square
          class="rk-company-dirty"
        >
          Cambios sin guardar
        </q-chip>

        <q-btn
          dense round flat icon="close"
          aria-label="Cerrar"
          @click="cancelar"
        />
      </div>

      <q-separator />

      <!-- ===== Cuerpo ===== -->
      <div class="rk-company-body">
        <!-- Pestañas -->
        <q-tabs
          v-model="tab"
          dense
          class="rk-company-tabs text-primary"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
        >
          <q-tab name="basicos"  label="Datos básicos"     icon="domain" />
          <q-tab name="payroll"  label="Nómina"            icon="request_quote" />
          <q-tab name="politica" label="Política de vacaciones" icon="policy" />
          <q-tab name="feriados" label="Feriados"          icon="event_busy" />
          <q-tab name="logo"     label="Logo"              icon="image" />
        </q-tabs>

        <q-separator />

        <!-- Ayuda contextual arriba del panel -->
        <q-banner v-if="ayudaTexto" class="rk-company-help q-mt-sm">
          <q-icon name="info" class="q-mr-sm" />
          <span v-html="ayudaTexto" />
        </q-banner>

        <q-form ref="formRef" greedy class="q-pt-sm" @submit.prevent="submit">
          <q-tab-panels
            v-model="tab"
            animated
            transition-prev="fade"
            transition-next="fade"
          >
            <q-tab-panel name="basicos" class="q-pt-sm">
              <CompanyBasicsTab
                v-model="form"
                :is-edit="isEdit"
                @validity="v => valid.basicos = v"
              />
            </q-tab-panel>

            <q-tab-panel name="payroll" class="q-pt-sm">
              <CompanyPayrollTab
                v-model="form.payrollConfig"
                :holidays="form.holidays"
                @validity="v => valid.payroll = v"
              />
              <q-banner v-if="autoPublicaSinPlantilla" class="rk-company-warn q-mt-md">
                <q-icon name="warning" class="q-mr-sm" />
                Tienes activada la <b>publicación automática</b> sin plantilla PDF.
                Revisa que el diseño por defecto sea el esperado.
              </q-banner>
            </q-tab-panel>

            <q-tab-panel name="politica" class="q-pt-sm">
              <CompanyTimeOffTab
                v-model="form.timeOffPolicy"
                @apply-preset="applyTimeOffPreset"
                @validity="v => valid.politica = v"
              />
            </q-tab-panel>

            <q-tab-panel name="feriados" class="q-pt-sm">
              <CompanyHolidaysTab
                v-model="form.holidays"
                @validity="v => valid.feriados = v"
              />
            </q-tab-panel>

            <q-tab-panel name="logo" class="q-pt-sm">
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

      <!-- ===== Pie ===== -->
      <div class="rk-company-footer row items-center">
        <div class="text-caption text-grey-7">
          <q-icon name="keyboard" size="16px" class="q-mr-xs" />
          Atajos: <b>Ctrl+Enter</b> guardar · <b>Esc</b> cerrar
        </div>

        <q-space />

        <q-btn flat label="Cancelar" @click="cancelar" />
        <q-btn
          color="primary"
          :label="saving ? 'Guardando…' : (isEdit ? 'Guardar' : 'Crear')"
          :loading="saving"
          class="q-ml-sm"
          @click="submit"
          unelevated
          :disable="!validAll"
        />
        <q-btn
          v-if="!isEdit"
          color="primary"
          outline
          :disable="saving"
          class="q-ml-sm"
          label="Guardar y crear otra"
          @click="submitAndReset"
        />
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
const isDark = computed(() => $q.dark.isActive)
const isEdit = computed(() => !!props.editData?._id)

const tab = ref('basicos')
const formRef = ref(null)
const saving  = ref(false)

const logoFile    = ref(null)
const logoPreview = ref('')

/* Validaciones de secciones (controladas por los tabs hijos) */
const valid = ref({
  basicos: false,
  payroll: true,
  politica: true,
  feriados: true,
  logo: true,
})
const validAll = computed(() => Object.values(valid.value).every(Boolean))

/* ===== Valores por defecto coherentes con tus otros componentes ===== */
function defaultTimeOff () {
  return {
    vacation: {
      accrual: {
        mode: 'DAILY',          // Diario | Mensual
        perYearDays: 15,
        perMonthDays: null,     // si va null => 15/12
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
    frequency: 'monthly',            // mensual
    cutoffDay: 25,
    paydayRule: 'last_business_day', // último día hábil
    paydayDayOfMonth: 5,             // solo si paydayRule = fixed_day
    businessDayAdjust: 'previous',   // previous | next | none
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

/* ===== Ayuda contextual por pestaña ===== */
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

/* ===== Detección de cambios (para avisar y reseteo) ===== */
let fotografia = ''
function tomarFotografia () {
  fotografia = JSON.stringify(form.value ?? {})
}
const tieneCambios = computed(() => JSON.stringify(form.value ?? {}) !== fotografia)

/* ===== Ciclo de vida al abrir/cerrar ===== */
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

  // reset de validaciones y fotografía
  valid.value = { basicos: false, payroll: true, politica: true, feriados: true, logo: true }
  tomarFotografia()
})

/* Presets de vacaciones desde hijo */
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
    if (logoFile.value) payload._logoFile = logoFile.value // tu store decide multipart

    let res
    if (isEdit.value) {
      res = await companies.updateCompany(props.editData._id, payload)
      $q.notify({ type: 'positive', message: 'Cambios guardados' })
    } else {
      res = await companies.createCompany(payload)
      $q.notify({ type: 'positive', message: 'Empresa creada' })
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
    await companies.createCompany(payload)
    $q.notify({ type: 'positive', message: 'Empresa creada. Puedes crear otra.' })
    emit('saved')
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
  if (tieneCambios) {
    $q.dialog({
      title: 'Descartar cambios',
      message: '¿Deseas cerrar sin guardar?',
      ok: { label: 'Sí, cerrar' },
      cancel: { label: 'Volver' },
      persistent: true,
    }).onOk(() => visible.value = false)
  } else {
    visible.value = false
  }
}
function hotkeys (e) {
  if (!visible.value) return
  if (e.key === 'Escape') cancelar()
  if (e.key === 'Enter' && e.ctrlKey) submit()
  if (!isEdit.value && e.key === 'Enter' && e.altKey) submitAndReset()
}
onMounted(() => window.addEventListener('keydown', hotkeys))
onBeforeUnmount(() => window.removeEventListener('keydown', hotkeys))
</script>

<style scoped>
/* ===== Tarjeta principal ===== */
.rk-company-card {
  min-width: 920px;
  max-width: 96vw;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0,0,0,.16);
  background:
    linear-gradient(180deg, rgba(2,6,23,.02), transparent 60%),
    var(--rk-company-card-bg, #fff);
}

/* ===== Encabezado ===== */
.rk-company-header {
  padding: 10px 14px;
  background: var(--rk-company-header-bg, transparent);
}
.rk-company-dirty {
  background: rgba(245, 158, 11, .12);
}

/* ===== Cuerpo ===== */
.rk-company-body {
  max-height: calc(80vh - 48px - 56px);
  overflow: auto;
}

.rk-company-tabs :deep(.q-field--dense) .q-field__control {
  min-height: 34px;
}

/* Ayuda contextual */
.rk-company-help {
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--rk-company-help-bg, #f3f5f7);
  color: var(--rk-company-help-fg, #1f2937);
}

/* Avisos */
.rk-company-warn {
  border-left: 4px solid #f59e0b;
  background: rgba(245,158,11,.08);
  color: #7c4a00;
  border-radius: 10px;
  padding: 10px 12px;
}

/* ===== Pie ===== */
.rk-company-footer {
  position: sticky;
  bottom: 0;
  background: var(--rk-company-card-bg, #fff);
  padding: 8px 12px;
  border-top: 1px solid var(--rk-company-border, rgba(0,0,0,.08));
  z-index: 2;
}

/* ===== Variables y modos ===== */
:root {
  --rk-company-border: rgba(0,0,0,.08);
  --rk-company-card-bg: #fff;
  --rk-company-header-bg: transparent;
  --rk-company-help-bg: #f3f5f7;
  --rk-company-help-fg: #1f2937;
}
.rk--dark {
  --rk-company-border: rgba(255,255,255,.08);
  --rk-company-card-bg: #0b1220;
  --rk-company-header-bg: rgba(255,255,255,.02);
  --rk-company-help-bg: rgba(255,255,255,.06);
  --rk-company-help-fg: #e5e7eb;
  box-shadow: 0 12px 30px rgba(0,0,0,.45);
}

/* Responsive */
@media (max-width: 1023px) {
  .rk-company-card { min-width: 96vw; }
}
</style>
