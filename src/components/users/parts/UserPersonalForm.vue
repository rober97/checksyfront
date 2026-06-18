<template>
  <div class="rk-personal-wrap">

    <!-- Banner legal -->
    <div class="rk-info">
      <q-icon name="gavel" size="20px" class="rk-info-icon" />
      <div>
        <div class="rk-info-title">Datos personales — Art. 10 Código del Trabajo</div>
        <p class="rk-info-text">
          Estos datos son requisito legal para emitir el contrato individual de trabajo.
          Sin ellos, el sistema podrá calcular asistencia y liquidaciones, pero
          <strong>no podrá generar un contrato válido</strong>.
        </p>
      </div>
    </div>

    <!-- ===== Sección: Identidad personal ===== -->
    <section class="rk-section">
      <div class="rk-section-header">
        <div class="rk-section-icon"><q-icon name="person_pin" /></div>
        <div>
          <div class="rk-section-title">Identidad personal</div>
          <div class="rk-section-desc">Datos demográficos del trabajador</div>
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6 col-lg-4">
          <q-input
            v-model="local.birthDate"
            label="Fecha de nacimiento *"
            dense outlined readonly
            class="rk-field"
            placeholder="YYYY-MM-DD"
            :rules="employeeReq"
            :hint="ageHint"
          >
            <template #prepend><q-icon name="cake" /></template>
            <template #append>
              <q-icon name="calendar_month" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="local.birthDate" mask="YYYY-MM-DD" minimal color="primary" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-select
            v-model="local.gender"
            :options="genderOptions"
            label="Sexo / género *"
            dense outlined
            emit-value map-options
            class="rk-field"
            :rules="employeeReq"
          >
            <template #prepend><q-icon name="wc" /></template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-select
            v-model="local.civilStatus"
            :options="civilOptions"
            label="Estado civil"
            dense outlined
            emit-value map-options
            class="rk-field"
          >
            <template #prepend><q-icon name="favorite" /></template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-select
            v-model="local.birthPlace"
            :options="birthPlaceOptions"
            label="Lugar de nacimiento"
            dense outlined clearable
            use-input fill-input hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add-unique"
            hide-bottom-space behavior="menu"
            class="rk-field"
            placeholder="Ej: Santiago (o ciudad/país si nació en el extranjero)"
            @filter="filterBirthPlace"
            @input-value="onBirthPlaceInput"
          >
            <template #prepend><q-icon name="public" /></template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-select
            v-model="local.nationality"
            :options="nationalityOptions"
            label="Nacionalidad *"
            dense outlined
            emit-value map-options
            use-input input-debounce="0"
            @filter="filterNationality"
            class="rk-field"
            :rules="employeeReq"
          >
            <template #prepend><q-icon name="flag" /></template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-select
            v-model="local.educationLevel"
            :options="educationOptions"
            label="Nivel educacional"
            dense outlined
            emit-value map-options
            class="rk-field"
          >
            <template #prepend><q-icon name="school" /></template>
          </q-select>
        </div>

        <div class="col-12">
          <q-input
            v-model="local.profession"
            label="Profesión u oficio *"
            dense outlined clearable
            class="rk-field"
            placeholder="Ej: Ingeniero Civil, Vendedor, Técnico Eléctrico"
            :rules="employeeReq"
            hint="Art. 10 N°3 — debe quedar en el contrato"
          >
            <template #prepend><q-icon name="badge" /></template>
          </q-input>
        </div>
      </div>
    </section>

    <!-- ===== Sección: Trabajadores extranjeros ===== -->
    <section v-if="isExtranjero" class="rk-section rk-section--warn">
      <div class="rk-section-header">
        <div class="rk-section-icon rk-section-icon--warn"><q-icon name="travel_explore" /></div>
        <div>
          <div class="rk-section-title">Trabajador extranjero (Ley 21.325)</div>
          <div class="rk-section-desc">Visa y vencimiento son obligatorios</div>
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
          <q-select
            v-model="local.visaType"
            :options="visaOptions"
            label="Tipo de visa *"
            dense outlined
            emit-value map-options
            class="rk-field"
            :rules="visaReq"
          >
            <template #prepend><q-icon name="contact_emergency" /></template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="local.visaExpiry"
            label="Vencimiento visa *"
            dense outlined readonly
            class="rk-field"
            placeholder="YYYY-MM-DD"
            :rules="visaExpiryRules"
          >
            <template #prepend><q-icon name="schedule" /></template>
            <template #append>
              <q-icon name="calendar_month" class="cursor-pointer">
                <q-popup-proxy cover>
                  <q-date v-model="local.visaExpiry" mask="YYYY-MM-DD" minimal color="primary" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6">
          <q-select
            v-model="local.documentType"
            :options="docTypeOptions"
            label="Documento de identidad"
            dense outlined
            emit-value map-options
            class="rk-field"
          >
            <template #prepend><q-icon name="badge" /></template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="local.documentNumber"
            label="Número del documento"
            dense outlined clearable
            class="rk-field"
            placeholder="Pasaporte / DNI"
          >
            <template #prepend><q-icon name="123" /></template>
          </q-input>
        </div>
      </div>
    </section>

    <!-- ===== Sección: Menor de edad ===== -->
    <section v-if="isMenor" class="rk-section rk-section--alert">
      <div class="rk-section-header">
        <div class="rk-section-icon rk-section-icon--alert"><q-icon name="warning" /></div>
        <div>
          <div class="rk-section-title">Trabajador menor de edad (Art. 13 Cód. del Trabajo)</div>
          <div class="rk-section-desc">
            Edad detectada: <strong>{{ Math.floor(ageYears) }} años</strong>.
            <span v-if="ageYears < 15">Menores de 15 NO pueden ser contratados.</span>
            <span v-else>Requiere autorización del representante legal.</span>
          </div>
        </div>
      </div>

      <div v-if="ageYears >= 15" class="rk-tutor-upload">
        <q-icon name="upload_file" size="22px" />
        <div class="rk-tutor-text">
          <strong>Autorización del representante legal</strong>
          <span v-if="local.tutorAuthorizationDocId">Documento adjuntado (id: {{ String(local.tutorAuthorizationDocId).slice(-6) }})</span>
          <span v-else>Sin documento — sube la autorización firmada</span>
        </div>
        <q-btn
          flat dense no-caps
          :color="local.tutorAuthorizationDocId ? 'primary' : 'grey-7'"
          :icon="local.tutorAuthorizationDocId ? 'visibility' : 'cloud_upload'"
          :label="local.tutorAuthorizationDocId ? 'Ver' : 'Subir PDF'"
          :disable="!canUploadDoc"
          @click="emit('upload-tutorDoc')"
        />
        <q-btn
          v-if="local.tutorAuthorizationDocId"
          flat dense round
          icon="delete"
          color="negative"
          size="sm"
          @click="local.tutorAuthorizationDocId = null"
        >
          <q-tooltip>Quitar documento</q-tooltip>
        </q-btn>
      </div>
      <div v-if="ageYears >= 15 && !canUploadDoc" class="rk-tutor-hint">
        <q-icon name="info" size="14px" />
        Guarda el usuario antes de adjuntar la autorización.
      </div>
    </section>

  </div>
</template>

<script setup>
import { reactive, computed, watch, ref } from 'vue'
import { COMUNAS, normalize } from '@/data/chileRegiones.js'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  // Si es 'empleado', exige campos legalmente obligatorios.
  isEmployee: { type: Boolean, default: true },
  canUploadDoc: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'upload-tutorDoc'])

const local = reactive({
  birthDate: toIsoDate(props.modelValue?.birthDate),
  birthPlace: props.modelValue?.birthPlace || '',
  nationality: props.modelValue?.nationality || 'CL',
  gender: props.modelValue?.gender || '',
  civilStatus: props.modelValue?.civilStatus || '',
  educationLevel: props.modelValue?.educationLevel || '',
  profession: props.modelValue?.profession || '',
  documentType: props.modelValue?.documentType || 'rut',
  documentNumber: props.modelValue?.documentNumber || '',
  visaType: props.modelValue?.visaType || '',
  visaExpiry: toIsoDate(props.modelValue?.visaExpiry),
  tutorAuthorizationDocId: props.modelValue?.tutorAuthorizationDocId || null,
})

function toIsoDate(v) {
  if (!v) return null
  try { return String(v).slice(0, 10) } catch { return null }
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    local.birthDate = toIsoDate(v.birthDate)
    local.birthPlace = v.birthPlace || ''
    local.nationality = v.nationality || 'CL'
    local.gender = v.gender || ''
    local.civilStatus = v.civilStatus || ''
    local.educationLevel = v.educationLevel || ''
    local.profession = v.profession || ''
    local.documentType = v.documentType || 'rut'
    local.documentNumber = v.documentNumber || ''
    local.visaType = v.visaType || ''
    local.visaExpiry = toIsoDate(v.visaExpiry)
    local.tutorAuthorizationDocId = v.tutorAuthorizationDocId || null
  },
  { deep: true },
)

watch(local, (v) => emit('update:modelValue', { ...v }), { deep: true })

// Options
const genderOptions = [
  { label: 'Femenino', value: 'F' },
  { label: 'Masculino', value: 'M' },
  { label: 'No binario / Otro', value: 'X' },
  { label: 'Prefiere no informar', value: 'no_informado' },
]
const civilOptions = [
  { label: 'Soltero/a', value: 'soltero' },
  { label: 'Casado/a', value: 'casado' },
  { label: 'Conviviente civil', value: 'conviviente_civil' },
  { label: 'Divorciado/a', value: 'divorciado' },
  { label: 'Separado/a judicialmente', value: 'separado_judicial' },
  { label: 'Viudo/a', value: 'viudo' },
]
const educationOptions = [
  { label: 'Básica incompleta', value: 'basica_incompleta' },
  { label: 'Básica completa', value: 'basica_completa' },
  { label: 'Media incompleta', value: 'media_incompleta' },
  { label: 'Media completa', value: 'media_completa' },
  { label: 'Técnica', value: 'tecnica' },
  { label: 'Universitaria', value: 'universitaria' },
  { label: 'Postgrado', value: 'postgrado' },
]
const visaOptions = [
  { label: 'Visa sujeta a contrato', value: 'sujeta_contrato' },
  { label: 'Visa temporaria', value: 'temporaria' },
  { label: 'Visa definitiva', value: 'definitiva' },
  { label: 'Permanencia definitiva', value: 'permanente' },
  { label: 'Refugiado / asilo', value: 'refugiado' },
]
const docTypeOptions = [
  { label: 'RUT', value: 'rut' },
  { label: 'Pasaporte', value: 'pasaporte' },
  { label: 'DNI extranjero', value: 'dni_extranjero' },
  { label: 'DNI', value: 'dni' },
]

// Países comunes en Chile (catálogo corto, se puede ampliar)
const ALL_COUNTRIES = [
  { label: 'Chile', value: 'CL' },
  { label: 'Argentina', value: 'AR' },
  { label: 'Bolivia', value: 'BO' },
  { label: 'Brasil', value: 'BR' },
  { label: 'Colombia', value: 'CO' },
  { label: 'Cuba', value: 'CU' },
  { label: 'Ecuador', value: 'EC' },
  { label: 'España', value: 'ES' },
  { label: 'Estados Unidos', value: 'US' },
  { label: 'Haití', value: 'HT' },
  { label: 'México', value: 'MX' },
  { label: 'Paraguay', value: 'PY' },
  { label: 'Perú', value: 'PE' },
  { label: 'República Dominicana', value: 'DO' },
  { label: 'Uruguay', value: 'UY' },
  { label: 'Venezuela', value: 'VE' },
  { label: 'China', value: 'CN' },
  { label: 'Otro', value: 'XX' },
]
const nationalityOptions = ref(ALL_COUNTRIES)
function filterNationality(val, update) {
  update(() => {
    const needle = (val || '').toLowerCase()
    nationalityOptions.value = !needle
      ? ALL_COUNTRIES
      : ALL_COUNTRIES.filter(c => c.label.toLowerCase().includes(needle))
  })
}

// Lugar de nacimiento: sugiere comunas chilenas pero permite texto libre
// (un trabajador extranjero pudo nacer fuera de Chile).
const birthPlaceOptions = ref([])
function filterBirthPlace(val, update) {
  update(() => {
    const needle = normalize(val)
    birthPlaceOptions.value = needle
      ? COMUNAS.filter(c => normalize(c).includes(needle)).slice(0, 50)
      : []
  })
}
function onBirthPlaceInput(val) {
  local.birthPlace = val || ''
}

// Reglas
const req = (v) => !!v || 'Campo requerido'
const employeeReq = computed(() => props.isEmployee ? [req] : [])
const isExtranjero = computed(() => !!local.nationality && local.nationality !== 'CL')
const visaReq = computed(() => isExtranjero.value && props.isEmployee ? [req] : [])
const visaExpiryRules = computed(() => {
  if (!isExtranjero.value || !props.isEmployee) return []
  return [
    req,
    (v) => {
      try { return new Date(v) > new Date() || 'La visa está vencida' }
      catch { return true }
    },
  ]
})

// Edad calculada
const ageYears = computed(() => {
  if (!local.birthDate) return null
  try {
    const d = new Date(local.birthDate)
    return (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)
  } catch { return null }
})
const isMenor = computed(() => Number.isFinite(ageYears.value) && ageYears.value < 18)
const ageHint = computed(() => {
  if (!Number.isFinite(ageYears.value)) return ''
  return `Edad: ${Math.floor(ageYears.value)} años`
})
</script>

<style scoped>
.rk-personal-wrap {
  --rk-bg:           #ffffff;
  --rk-surface:      #f7f8fc;
  --rk-surface-2:    #eef0f6;
  --rk-border:       rgba(15, 17, 23, 0.08);
  --rk-border-2:     rgba(15, 17, 23, 0.14);
  --rk-text:         #0f1117;
  --rk-text-2:       #5a6482;
  --rk-text-3:       #9aa1b9;
  --rk-accent:       #06b6d4;
  --rk-accent-soft:  rgba(6, 182, 212, 0.10);
  --rk-warn:         #d97706;
  --rk-warn-soft:    rgba(217, 119, 6, 0.10);
  --rk-err:          #dc2626;
  --rk-err-soft:     rgba(220, 38, 38, 0.10);
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--rk-text);
}
.body--dark .rk-personal-wrap {
  --rk-bg:           var(--card-background);
  --rk-surface:      var(--surface-soft);
  --rk-surface-2:    rgba(255, 255, 255, 0.05);
  --rk-border:       var(--border-color);
  --rk-text:         var(--text-primary);
  --rk-text-2:       var(--text-secondary);
  --rk-text-3:       var(--text-muted);
  --rk-accent-soft:  var(--color-primary-soft);
}

.rk-info {
  display: flex; gap: 10px;
  padding: 10px 12px;
  background: var(--rk-accent-soft);
  border: 1px solid rgba(6, 182, 212, 0.22);
  border-radius: 10px;
}
.rk-info-icon { color: var(--rk-accent); margin-top: 1px; }
.rk-info-title { font-weight: 700; font-size: 12.5px; color: var(--rk-text); }
.rk-info-text {
  margin: 2px 0 0 0; font-size: 11.5px; color: var(--rk-text-2); line-height: 1.45;
}

.rk-section {
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  padding: 14px 16px;
}
.rk-section--warn {
  background: var(--rk-warn-soft);
  border-color: rgba(217, 119, 6, 0.25);
}
.rk-section--alert {
  background: var(--rk-err-soft);
  border-color: rgba(220, 38, 38, 0.25);
}

.rk-section-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.rk-section-icon {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
  border-radius: 8px;
}
.rk-section-icon--warn { background: rgba(217, 119, 6, 0.18); color: var(--rk-warn); }
.rk-section-icon--alert { background: rgba(220, 38, 38, 0.18); color: var(--rk-err); }
.rk-section-title { font-size: 13px; font-weight: 700; color: var(--rk-text); }
.rk-section-desc { font-size: 11.5px; color: var(--rk-text-2); margin-top: 1px; }

.rk-field :deep(.q-field__control) {
  min-height: 40px; border-radius: 9px; background: var(--rk-bg);
}
.rk-field :deep(.q-field__label) {
  color: var(--rk-text-2); font-weight: 500; font-size: 12.5px;
}
.rk-field :deep(.q-field__native), .rk-field :deep(.q-field__input) {
  color: var(--rk-text); font-size: 13px;
}
.rk-field :deep(.q-field__hint) {
  color: var(--rk-text-3); font-size: 10.5px;
}

.rk-tutor-upload {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  background: var(--rk-bg);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
}
.rk-tutor-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.rk-tutor-text strong { font-size: 12.5px; color: var(--rk-text); }
.rk-tutor-text span { font-size: 11px; color: var(--rk-text-2); }
.rk-tutor-hint {
  display: flex; align-items: center; gap: 4px;
  margin-top: 4px; padding-left: 6px;
  font-size: 10.5px; color: var(--rk-warn);
}
</style>
