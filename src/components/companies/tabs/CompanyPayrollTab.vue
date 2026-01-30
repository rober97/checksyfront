<template>
  <div class="rk-sched">
    <!-- Main Grid Layout -->
    <div class="rk-sched-grid">
      <!-- Left: Configuration Panel -->
      <div class="rk-config-panel">
        <div class="rk-panel-card">
          <!-- Card Header -->
          <div class="rk-card-header">
            <div class="rk-header-content">
              <div class="rk-header-icon">
                <q-icon name="schedule" />
                <div class="rk-icon-pulse"></div>
              </div>
              <div class="rk-header-text">
                <h3 class="rk-header-title">Programación de nómina</h3>
                <p class="rk-header-subtitle">Configura generación y publicación automática</p>
              </div>
            </div>
            <div class="rk-status-badge" :class="`rk-status-${vm.autoPublish ? 'auto' : 'manual'}`">
              <div class="rk-badge-dot"></div>
              <span>{{ vm.autoPublish ? 'Publicación automática' : 'Con revisión' }}</span>
            </div>
          </div>

          <!-- Info Banner -->
          <div class="rk-info-banner">
            <div class="rk-info-icon">
              <q-icon name="info" />
            </div>
            <p>Configura el <strong>corte de variables</strong>, la <strong>regla de pago</strong>, el <strong>ajuste por día no hábil</strong>, y la <strong>hora</strong> de ejecución.</p>
          </div>

          <!-- Form Fields -->
          <div class="rk-form-fields">
            <!-- Frequency -->
            <div class="rk-field-group">
              <label class="rk-field-label">
                <q-icon name="event_repeat" />
                <span>Frecuencia de generación</span>
              </label>
              <q-select
                v-model="vm.frequency"
                :options="freqOpts"
                dense
                outlined
                emit-value
                map-options
                @update:model-value="emitValid"
                class="rk-select"
              />
            </div>

            <!-- Cutoff Day & Payday Rule -->
            <div class="rk-field-row">
              <div class="rk-field-group rk-field-half">
                <label class="rk-field-label">
                  <q-icon name="cut" />
                  <span>Día de corte</span>
                </label>
                <q-input
                  v-model.number="vm.cutoffDay"
                  type="number"
                  min="1"
                  max="31"
                  dense
                  outlined
                  :hint="hintCorte"
                  :error="!!errors.cutoffDay"
                  :error-message="errors.cutoffDay"
                  @update:model-value="emitValid"
                  class="rk-input"
                >
                  <template #prepend>
                    <q-icon name="today" />
                  </template>
                </q-input>
              </div>

              <div class="rk-field-group rk-field-half">
                <label class="rk-field-label">
                  <q-icon name="rule" />
                  <span>Regla de pago</span>
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="help"
                    class="rk-help-btn"
                  >
                    <q-tooltip class="rk-tooltip" max-width="360px">
                      <strong>Último día hábil:</strong> Calcula automáticamente el último día laboral del mes (omite fines de semana y feriados).<br><br>
                      <strong>Día fijo:</strong> Usa el día específico indicado. Si cae en día no hábil, se aplica el ajuste elegido.
                    </q-tooltip>
                  </q-btn>
                </label>
                <q-select
                  v-model="vm.paydayRule"
                  :options="paydayRuleOpts"
                  dense
                  outlined
                  emit-value
                  map-options
                  :error="!!errors.paydayRule"
                  :error-message="errors.paydayRule"
                  @update:model-value="emitValid"
                  class="rk-select"
                />
              </div>
            </div>

            <!-- Fixed Day (conditional) -->
            <div v-if="vm.paydayRule === 'fixed_day'" class="rk-field-group">
              <label class="rk-field-label">
                <q-icon name="push_pin" />
                <span>Día fijo de pago</span>
              </label>
              <q-input
                v-model.number="vm.paydayDayOfMonth"
                type="number"
                min="1"
                max="31"
                dense
                outlined
                hint="Día específico del mes para generar la nómina"
                :error="!!errors.paydayDayOfMonth"
                :error-message="errors.paydayDayOfMonth"
                @update:model-value="emitValid"
                class="rk-input"
              >
                <template #prepend>
                  <q-icon name="calendar_month" />
                </template>
              </q-input>
            </div>

            <!-- Business Day Adjust & Time -->
            <div class="rk-field-row">
              <div class="rk-field-group rk-field-half">
                <label class="rk-field-label">
                  <q-icon name="swap_horiz" />
                  <span>Ajuste por día no hábil</span>
                </label>
                <q-select
                  v-model="vm.businessDayAdjust"
                  :options="adjustOpts"
                  dense
                  outlined
                  emit-value
                  map-options
                  :disable="vm.paydayRule === 'last_business_day'"
                  :hint="vm.paydayRule === 'last_business_day'
                    ? 'No aplica: ya usa el último día hábil'
                    : 'Elige cómo ajustar si cae en día no hábil'"
                  @update:model-value="emitValid"
                  class="rk-select"
                />
              </div>

              <div class="rk-field-group rk-field-half">
                <label class="rk-field-label">
                  <q-icon name="access_time" />
                  <span>Hora de ejecución</span>
                </label>
                <q-input
                  v-model="vm.generateTime"
                  dense
                  outlined
                  mask="##:##"
                  fill-mask
                  hint="Formato 24 horas (HH:mm)"
                  :error="!!errors.generateTime"
                  :error-message="errors.generateTime"
                  @update:model-value="emitValid"
                  class="rk-input"
                >
                  <template #prepend>
                    <q-icon name="schedule" />
                  </template>
                </q-input>
              </div>
            </div>

            <!-- Timezone & Rounding -->
            <div class="rk-field-row">
              <div class="rk-field-group rk-field-grow">
                <label class="rk-field-label">
                  <q-icon name="language" />
                  <span>Zona horaria</span>
                </label>
                <q-select
                  v-model="vm.timezone"
                  :options="tzOpts"
                  dense
                  outlined
                  emit-value
                  map-options
                  @update:model-value="emitValid"
                  class="rk-select"
                />
              </div>

              <div class="rk-field-group rk-field-shrink">
                <label class="rk-field-label">
                  <q-icon name="calculate" />
                  <span>Redondeo</span>
                </label>
                <q-select
                  v-model="vm.rounding"
                  :options="roundingOpts"
                  dense
                  outlined
                  emit-value
                  map-options
                  :hint="roundingHint"
                  @update:model-value="emitValid"
                  class="rk-select"
                />
              </div>
            </div>

            <!-- Toggles Section -->
            <div class="rk-toggles-section">
              <div class="rk-toggle-card">
                <div class="rk-toggle-icon">
                  <q-icon name="rocket_launch" />
                </div>
                <div class="rk-toggle-content">
                  <div class="rk-toggle-header">
                    <strong>Publicación automática</strong>
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      icon="help"
                      class="rk-help-btn"
                    >
                      <q-tooltip class="rk-tooltip">
                        Si está activo, al terminar la generación el documento queda <strong>publicado de inmediato</strong> sin revisión previa.
                      </q-tooltip>
                    </q-btn>
                  </div>
                  <p class="rk-toggle-desc">
                    {{ vm.autoPublish ? 'El documento se publicará automáticamente al generarse' : 'Requiere revisión manual antes de publicar' }}
                  </p>
                </div>
                <q-toggle
                  v-model="vm.autoPublish"
                  @update:model-value="emitValid"
                  color="primary"
                  size="lg"
                />
              </div>

              <div class="rk-toggle-card">
                <div class="rk-toggle-icon">
                  <q-icon name="notifications_active" />
                </div>
                <div class="rk-toggle-content">
                  <div class="rk-toggle-header">
                    <strong>Enviar avisos al publicar</strong>
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      icon="help"
                      class="rk-help-btn"
                    >
                      <q-tooltip class="rk-tooltip">
                        Notifica a los destinatarios cuando el documento queda publicado (automática o manualmente).
                      </q-tooltip>
                    </q-btn>
                  </div>
                  <p class="rk-toggle-desc">
                    {{ vm.notifyOnPublish ? 'Se enviarán notificaciones al publicar' : 'No se enviarán notificaciones' }}
                  </p>
                </div>
                <q-toggle
                  v-model="vm.notifyOnPublish"
                  @update:model-value="emitValid"
                  color="primary"
                  size="lg"
                />
              </div>
            </div>

            <!-- Template -->
            <div class="rk-field-group">
              <label class="rk-field-label">
                <q-icon name="description" />
                <span>Plantilla PDF (opcional)</span>
              </label>
              <q-input
                v-model="vm.templateId"
                dense
                outlined
                placeholder="ID de la plantilla personalizada"
                hint="Deja vacío para usar la plantilla por defecto"
                @update:model-value="emitValid"
                class="rk-input"
              >
                <template #prepend>
                  <q-icon name="picture_as_pdf" />
                </template>
              </q-input>
            </div>

            <!-- Warning: Auto-publish without template -->
            <div v-if="vm.autoPublish && !vm.templateId" class="rk-warning-banner">
              <div class="rk-warning-icon">
                <q-icon name="warning" />
              </div>
              <div class="rk-warning-content">
                <strong>Atención</strong>
                <p>Publicación automática activa sin plantilla personalizada. Se usará el diseño por defecto.</p>
              </div>
            </div>

            <!-- Next Execution Preview -->
            <div class="rk-execution-preview">
              <div class="rk-preview-icon">
                <q-icon name="event" />
              </div>
              <div class="rk-preview-content">
                <h4 class="rk-preview-title">Próxima ejecución estimada</h4>
                <div class="rk-preview-date">
                  <strong>{{ nextDateLabel }}</strong>
                  <span v-if="vm.generateTime && vm.timezone">
                    · {{ vm.generateTime }} ({{ vm.timezone }})
                  </span>
                </div>
                <p v-if="adjustNote" class="rk-preview-note">{{ adjustNote }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Guide & Summary Panel -->
      <div class="rk-guide-panel">
        <!-- Quick Guide -->
        <div class="rk-guide-card">
          <div class="rk-guide-header">
            <div class="rk-guide-icon">
              <q-icon name="lightbulb" />
            </div>
            <h4 class="rk-guide-title">Guía rápida</h4>
          </div>
          
          <div class="rk-guide-list">
            <div class="rk-guide-item">
              <div class="rk-guide-item-icon">
                <q-icon name="cut" />
              </div>
              <div class="rk-guide-item-content">
                <strong>Corte de variables</strong>
                <p>Se incluyen las variables registradas hasta ese día del mes (incluido).</p>
              </div>
            </div>

            <div class="rk-guide-item">
              <div class="rk-guide-item-icon">
                <q-icon name="event_busy" />
              </div>
              <div class="rk-guide-item-content">
                <strong>Último día hábil</strong>
                <p>Calcula automáticamente el último día laboral omitiendo fines de semana y feriados.</p>
              </div>
            </div>

            <div class="rk-guide-item">
              <div class="rk-guide-item-icon">
                <q-icon name="push_pin" />
              </div>
              <div class="rk-guide-item-content">
                <strong>Día fijo</strong>
                <p>Si cae en día no hábil, se aplica el ajuste elegido (anterior/siguiente/sin ajuste).</p>
              </div>
            </div>

            <div class="rk-guide-item">
              <div class="rk-guide-item-icon">
                <q-icon name="rocket_launch" />
              </div>
              <div class="rk-guide-item-content">
                <strong>Publicación automática</strong>
                <p>Al terminar, el documento se publica sin revisión previa.</p>
              </div>
            </div>

            <div class="rk-guide-item">
              <div class="rk-guide-item-icon">
                <q-icon name="notifications" />
              </div>
              <div class="rk-guide-item-content">
                <strong>Avisos</strong>
                <p>Notifica a destinatarios cuando el documento queda publicado.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration Summary -->
        <div class="rk-summary-card">
          <div class="rk-summary-header">
            <div class="rk-summary-icon">
              <q-icon name="summarize" />
            </div>
            <h4 class="rk-summary-title">Resumen de configuración</h4>
          </div>

          <div class="rk-summary-list">
            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="event_repeat" />
                <span>Frecuencia</span>
              </div>
              <strong>{{ etiquetaDe(freqOpts, vm.frequency) }}</strong>
            </div>

            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="cut" />
                <span>Corte de variables</span>
              </div>
              <strong>Día {{ vm.cutoffDay || '—' }}</strong>
            </div>

            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="rule" />
                <span>Regla de pago</span>
              </div>
              <strong>{{ etiquetaDe(paydayRuleOpts, vm.paydayRule) }}</strong>
            </div>

            <div v-if="vm.paydayRule === 'fixed_day'" class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="push_pin" />
                <span>Día fijo</span>
              </div>
              <strong>Día {{ vm.paydayDayOfMonth || '—' }}</strong>
            </div>

            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="swap_horiz" />
                <span>Ajuste día no hábil</span>
              </div>
              <strong>
                {{ vm.paydayRule === 'last_business_day' 
                  ? 'No aplica' 
                  : etiquetaDe(adjustOpts, vm.businessDayAdjust) 
                }}
              </strong>
            </div>

            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="access_time" />
                <span>Hora de ejecución</span>
              </div>
              <strong>{{ vm.generateTime || '—' }}</strong>
            </div>

            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="language" />
                <span>Zona horaria</span>
              </div>
              <strong>{{ vm.timezone || '—' }}</strong>
            </div>

            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="calculate" />
                <span>Redondeo</span>
              </div>
              <strong>{{ etiquetaDe(roundingOpts, vm.rounding) }}</strong>
            </div>

            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="rocket_launch" />
                <span>Publicación</span>
              </div>
              <strong>{{ vm.autoPublish ? 'Automática' : 'Con revisión' }}</strong>
            </div>

            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="notifications" />
                <span>Avisos</span>
              </div>
              <strong>{{ vm.notifyOnPublish ? 'Activados' : 'Desactivados' }}</strong>
            </div>

            <div class="rk-summary-item">
              <div class="rk-summary-item-label">
                <q-icon name="picture_as_pdf" />
                <span>Plantilla PDF</span>
              </div>
              <strong>{{ vm.templateId || 'Por defecto' }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  holidays: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'validity'])

const vm = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

/* Options */
const freqOpts = [{ label: 'Mensual', value: 'monthly' }]
const paydayRuleOpts = [
  { label: 'Último día hábil', value: 'last_business_day' },
  { label: 'Día fijo', value: 'fixed_day' },
]
const adjustOpts = [
  { label: 'Día hábil anterior', value: 'previous' },
  { label: 'Día hábil siguiente', value: 'next' },
  { label: 'Sin ajuste', value: 'none' },
]
const roundingOpts = [
  { label: 'Sin redondeo', value: 'none' },
  { label: 'A enteros (0)', value: '0' },
  { label: 'A décimas (0,1)', value: '0.1' },
  { label: 'A medios (0,5)', value: '0.5' },
  { label: 'A unidades (1)', value: '1' },
]
const tzOpts = [
  { label: 'America/Santiago', value: 'America/Santiago' },
  { label: 'America/Bogota', value: 'America/Bogota' },
  { label: 'UTC', value: 'UTC' },
]

/* Dynamic texts */
const hintCorte = computed(() =>
  vm.value?.cutoffDay
    ? `Variables hasta el día ${vm.value.cutoffDay} incluido`
    : 'Elige un día entre 1 y 31'
)

const roundingHint = computed(() => {
  switch (vm.value?.rounding) {
    case '0': return 'Redondea a enteros'
    case '0.1': return 'Redondea a décimas'
    case '0.5': return 'Redondea a múltiplos de 0,5'
    case '1': return 'Redondea a múltiplos de 1'
    default: return 'No modifica los valores'
  }
})

/* Validation */
const errors = computed(() => {
  const t = vm.value || {}
  const e = {}

  const okTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(t.generateTime || '')
  if (!okTime) e.generateTime = 'Formato HH:mm (00-23:59)'

  const cut = Number(t.cutoffDay)
  if (!Number.isFinite(cut) || cut < 1 || cut > 31) e.cutoffDay = 'Entre 1 y 31'

  if (!t.paydayRule) e.paydayRule = 'Requerido'

  if (t.paydayRule === 'fixed_day') {
    const d = Number(t.paydayDayOfMonth)
    if (!Number.isFinite(d) || d < 1 || d > 31) e.paydayDayOfMonth = 'Entre 1 y 31'
  }

  return e
})

function esValido () { return Object.keys(errors.value).length === 0 }
function emitValid () { emit('validity', esValido()) }
onMounted(emitValid)
watch(() => vm.value, emitValid, { deep: true })

/* Business days and holidays logic */
function isoUTC (date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString().slice(0,10)
}
function esFinDeSemanaUTC (date) {
  const d = date.getUTCDay()
  return d === 0 || d === 6
}
function esFeriadoUTC (date) {
  return (props.holidays || []).includes(isoUTC(date))
}
function esHabilUTC (date) {
  return !esFinDeSemanaUTC(date) && !esFeriadoUTC(date)
}
function ultimoHabilDelMesUTC (y, m) {
  const d = new Date(Date.UTC(y, m + 1, 0, 12, 0, 0))
  while (!esHabilUTC(d)) d.setUTCDate(d.getUTCDate() - 1)
  return d
}
function moverAHabilUTC (date, direccion) {
  if (direccion === 'none') return date
  const d = new Date(date)
  if (esHabilUTC(d)) return d
  if (direccion === 'previous') while (!esHabilUTC(d)) d.setUTCDate(d.getUTCDate() - 1)
  else if (direccion === 'next') while (!esHabilUTC(d)) d.setUTCDate(d.getUTCDate() + 1)
  return d
}

/* Next execution */
const nextDate = computed(() => {
  try {
    const ahora = new Date()
    const y = ahora.getUTCFullYear()
    const m = ahora.getUTCMonth()
    const t = vm.value || {}

    if (t.paydayRule === 'last_business_day') return ultimoHabilDelMesUTC(y, m)

    const base = new Date(Date.UTC(y, m, Number(t.paydayDayOfMonth || 1), 12, 0, 0))
    return moverAHabilUTC(base, t.businessDayAdjust || 'none')
  } catch {
    return null
  }
})

const nextDateLabel = computed(() => {
  if (!nextDate.value) return '—'
  try { return new Intl.DateTimeFormat('es-CL', { dateStyle: 'full' }).format(nextDate.value) }
  catch { return nextDate.value.toISOString().slice(0,10) }
})

const adjustNote = computed(() => {
  const t = vm.value || {}
  if (t.paydayRule === 'last_business_day') 
    return 'Se utiliza el último día hábil del mes (omite fines de semana y feriados)'
  if (t.paydayRule === 'fixed_day') {
    if (t.businessDayAdjust === 'previous') 
      return 'Si cae en día no hábil, se mueve al hábil anterior'
    if (t.businessDayAdjust === 'next') 
      return 'Si cae en día no hábil, se mueve al hábil siguiente'
    if (t.businessDayAdjust === 'none') 
      return 'Si cae en día no hábil, no se modifica'
  }
  return ''
})

/* Utilities */
function etiquetaDe (opts, val) {
  const o = (opts || []).find(o => o.value === val)
  return o ? o.label : '—'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

:root {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-accent: #14b8a6;
}

/* Theme Variables */
.rk-sched {
  --bg-card: rgba(255, 255, 255, 0.95);
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
}

.body--dark .rk-sched {
  --bg-card: rgba(10, 14, 20, 0.95);
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
}

/* Container */
.rk-sched {
  font-family: 'Sora', -apple-system, sans-serif;
  padding: 0;
}

/* Main Grid */
.rk-sched-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

/* Panel Cards Base */
.rk-panel-card,
.rk-guide-card,
.rk-summary-card {
  background: var(--bg-card);
  border: 1.5px solid var(--border-1);
  border-radius: 20px;
  padding: 28px;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
}

/* Card Header */
.rk-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1.5px solid var(--border-1);
}

.rk-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
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
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.rk-header-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Status Badge */
.rk-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.rk-status-auto {
  background: rgba(34, 197, 94, 0.12);
  border: 1.5px solid rgba(34, 197, 94, 0.3);
  color: #16a34a;
}

.body--dark .rk-status-auto {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: #4ade80;
}

.rk-status-manual {
  background: rgba(6, 182, 212, 0.12);
  border: 1.5px solid rgba(6, 182, 212, 0.25);
  color: var(--color-primary);
}

.body--dark .rk-status-manual {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.35);
  color: var(--color-primary-light);
}

.rk-badge-dot {
  width: 8px;
  height: 8px;
  background: currentColor;
  border-radius: 50%;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 currentColor;
  }
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
}

/* Info Banner */
.rk-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-left: 4px solid var(--color-primary);
  border-radius: 12px;
  margin-bottom: 24px;
}

.rk-info-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 8px;
  flex-shrink: 0;
}

.rk-info-icon .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-info-banner p {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-weight: 500;
}

/* Form Fields */
.rk-form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rk-field-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rk-field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.rk-field-label .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-help-btn {
  color: var(--text-muted);
  margin-left: auto;
}

.rk-help-btn:hover {
  color: var(--color-primary-light);
}

.rk-field-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.rk-field-half {
  grid-column: span 1;
}

.rk-field-grow {
  flex: 1;
}

.rk-field-shrink {
  width: 180px;
}

/* Input Styling */
.rk-input :deep(.q-field__control),
.rk-select :deep(.q-field__control) {
  background: var(--surface-1);
  border-color: var(--border-1);
  transition: all 0.3s ease;
}

.rk-input :deep(.q-field__control):hover,
.rk-select :deep(.q-field__control):hover {
  background: var(--surface-2);
  border-color: var(--border-2);
}

.rk-input :deep(.q-field--focused .q-field__control),
.rk-select :deep(.q-field--focused .q-field__control) {
  background: var(--surface-2);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
}

/* Toggles Section */
.rk-toggles-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.rk-toggle-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  background: var(--surface-1);
  border: 1.5px solid var(--border-1);
  border-radius: 14px;
  transition: all 0.3s ease;
}

.rk-toggle-card:hover {
  background: var(--surface-2);
  border-color: var(--border-2);
}

.rk-toggle-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 11px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-toggle-icon .q-icon {
  font-size: 22px;
  color: #fff;
}

.rk-toggle-content {
  flex: 1;
}

.rk-toggle-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.rk-toggle-header strong {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.rk-toggle-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* Warning Banner */
.rk-warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
}

.body--dark .rk-warning-banner {
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

/* Execution Preview */
.rk-execution-preview {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: var(--surface-1);
  border: 1.5px solid var(--border-1);
  border-radius: 14px;
  margin-top: 8px;
}

.rk-preview-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
}

.rk-preview-icon .q-icon {
  font-size: 24px;
  color: #fff;
}

.rk-preview-content {
  flex: 1;
}

.rk-preview-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.rk-preview-date {
  font-size: 1.05rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.5;
}

.rk-preview-date strong {
  color: var(--color-primary);
  font-weight: 800;
}

.body--dark .rk-preview-date strong {
  color: var(--color-primary-light);
}

.rk-preview-note {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
  font-style: italic;
}

/* Guide Panel */
.rk-guide-card,
.rk-summary-card {
  margin-bottom: 24px;
}

.rk-guide-header,
.rk-summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1.5px solid var(--border-1);
}

.rk-guide-icon,
.rk-summary-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-guide-icon .q-icon,
.rk-summary-icon .q-icon {
  font-size: 20px;
  color: #fff;
}

.rk-guide-title,
.rk-summary-title {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-primary);
}

/* Guide List */
.rk-guide-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rk-guide-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.rk-guide-item-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 8px;
  flex-shrink: 0;
}

.rk-guide-item-icon .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-guide-item-content strong {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.rk-guide-item-content p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Summary List */
.rk-summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rk-summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: var(--surface-1);
  border-radius: 10px;
}

.rk-summary-item-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.rk-summary-item-label .q-icon {
  font-size: 16px;
  color: var(--color-primary-light);
}

.rk-summary-item strong {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: right;
}

/* Tooltip */
.rk-tooltip {
  background: rgba(6, 182, 212, 0.95);
  backdrop-filter: blur(10px);
  font-size: 0.85rem;
  padding: 12px;
  border-radius: 8px;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 1200px) {
  .rk-sched-grid {
    grid-template-columns: 1fr;
  }

  .rk-guide-panel {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}

@media (max-width: 767px) {
  .rk-panel-card,
  .rk-guide-card,
  .rk-summary-card {
    padding: 20px;
  }

  .rk-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .rk-status-badge {
    width: 100%;
    justify-content: center;
  }

  .rk-field-row {
    grid-template-columns: 1fr;
  }

  .rk-field-half,
  .rk-field-grow,
  .rk-field-shrink {
    width: 100%;
  }

  .rk-guide-panel {
    grid-template-columns: 1fr;
  }

  .rk-toggle-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>