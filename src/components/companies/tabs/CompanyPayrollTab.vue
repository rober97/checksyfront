<template>
  <div class="rk-sched row q-col-gutter-sm">
    <!-- ===== Configuración ===== -->
    <div class="col-12 col-md-7">
      <q-card flat bordered class="rk-sched-card q-pa-md">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-h6">Programación de generación y publicación</div>
          <q-chip square dense class="rk-sched-chip">
            {{ vm.autoPublish ? 'Publicación automática' : 'Publicación con revisión' }}
          </q-chip>
        </div>

        <div class="text-caption text-grey-7 q-mb-md">
          Configura el <b>corte de variables</b>, la <b>regla de pago o publicación</b>, el <b>ajuste por día no hábil</b>,
          y la <b>hora</b> con su <b>zona horaria</b>.
        </div>

        <!-- Frecuencia -->
        <q-select
          v-model="vm.frequency"
          :options="freqOpts"
          dense outlined
          label="Frecuencia"
          emit-value map-options
          @update:model-value="emitValid"
        />

        <!-- Corte y Regla -->
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-6">
            <q-input
              v-model.number="vm.cutoffDay"
              type="number" min="1" max="31"
              dense outlined
              label="Día de corte de variables"
              :hint="hintCorte"
              :error="!!errors.cutoffDay"
              :error-message="errors.cutoffDay"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-6">
            <q-select
              v-model="vm.paydayRule"
              :options="paydayRuleOpts"
              dense outlined
              label="Regla de pago / publicación"
              emit-value map-options
              :error="!!errors.paydayRule"
              :error-message="errors.paydayRule"
              @update:model-value="emitValid"
            >
              <template #after>
                <q-icon name="info" size="18px" class="q-ml-xs text-grey-6">
                  <q-tooltip class="rk-sched-tooltip">
                    <div class="text-body2">
                      <b>Último día hábil:</b> utiliza el último día laboral del mes
                      (omite sábados, domingos y feriados).<br>
                      <b>Día fijo:</b> usa el día indicado; si no es hábil, se aplica el ajuste elegido.
                    </div>
                  </q-tooltip>
                </q-icon>
              </template>
            </q-select>
          </div>
        </div>

        <!-- Día fijo si corresponde -->
        <q-input
          v-if="vm.paydayRule === 'fixed_day'"
          v-model.number="vm.paydayDayOfMonth"
          class="q-mt-sm"
          type="number" min="1" max="31"
          dense outlined
          label="Día fijo de pago / publicación"
          :error="!!errors.paydayDayOfMonth"
          :error-message="errors.paydayDayOfMonth"
          @update:model-value="emitValid"
        />

        <!-- Ajuste y Hora -->
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-6">
            <q-select
              v-model="vm.businessDayAdjust"
              :options="adjustOpts"
              dense outlined
              label="Si cae en día no hábil"
              emit-value map-options
              :disable="vm.paydayRule === 'last_business_day'"
              :hint="vm.paydayRule === 'last_business_day'
                ? 'No corresponde: ya calcula el último día hábil del mes.'
                : 'Elige mover al día hábil anterior, siguiente o no ajustar.'"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-6">
            <q-input
              v-model="vm.generateTime"
              dense outlined
              mask="##:##" fill-mask
              label="Hora de ejecución (HH:mm)"
              :error="!!errors.generateTime"
              :error-message="errors.generateTime"
              :hint="'Se ejecutará a esta hora en la zona horaria indicada.'"
              @update:model-value="emitValid"
            />
          </div>
        </div>

        <!-- Zona horaria y Redondeo -->
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-7">
            <q-select
              v-model="vm.timezone"
              :options="tzOpts"
              dense outlined
              label="Zona horaria"
              emit-value map-options
              @update:model-value="emitValid"
            />
          </div>
          <div class="col-5">
            <q-select
              v-model="vm.rounding"
              :options="roundingOpts"
              dense outlined
              label="Redondeo"
              emit-value map-options
              :hint="roundingHint"
              @update:model-value="emitValid"
            />
          </div>
        </div>

        <!-- Publicación y Avisos -->
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-sm-6">
            <q-toggle
              v-model="vm.autoPublish"
              @update:model-value="emitValid"
              :label="vm.autoPublish ? 'Publicación automática (sin revisión)' : 'Requiere revisión antes de publicar'"
            >
              <q-tooltip class="rk-sched-tooltip">
                <div class="text-body2">
                  Si está activo, al terminar la generación el documento queda <b>publicado de inmediato</b>.
                </div>
              </q-tooltip>
            </q-toggle>
          </div>

          <div class="col-12 col-sm-6">
            <q-toggle
              v-model="vm.notifyOnPublish"
              @update:model-value="emitValid"
              label="Enviar avisos al publicar"
            >
              <q-tooltip class="rk-sched-tooltip">
                <div class="text-body2">
                  Notifica a los destinatarios cuando el documento queda publicado
                  (de forma automática o tras la revisión).
                </div>
              </q-tooltip>
            </q-toggle>
          </div>
        </div>

        <!-- Plantilla -->
        <q-input
          v-model="vm.templateId"
          dense outlined class="q-mt-sm"
          label="Plantilla PDF (opcional)"
          :hint="'Identificador de la plantilla que se aplicará al PDF.'"
          @update:model-value="emitValid"
        />

        <!-- Alerta contextual -->
        <q-banner
          v-if="vm.autoPublish && !vm.templateId"
          class="rk-sched-alert q-mt-md"
        >
          <q-icon name="warning" class="q-mr-sm" />
          Publicación automática activa sin plantilla. Verifica que el diseño por defecto sea el esperado.
        </q-banner>

        <!-- Próxima ejecución -->
        <q-banner class="rk-sched-banner q-mt-md">
          <q-icon name="event" size="20px" class="q-mr-sm" />
          <div class="column">
            <div class="text-caption">
              Próxima ejecución <i>(estimada)</i>:
              <b>{{ nextDateLabel }}</b>
              <span v-if="vm.generateTime && vm.timezone">
                · {{ vm.generateTime }} ({{ vm.timezone }})
              </span>
            </div>
            <div v-if="adjustNote" class="text-caption text-grey-7 q-mt-xs">
              {{ adjustNote }}
            </div>
          </div>
        </q-banner>
      </q-card>
    </div>

    <!-- ===== Guía y Resumen ===== -->
    <div class="col-12 col-md-5">
      <q-card flat bordered class="rk-sched-card q-pa-md">
        <div class="text-subtitle2 q-mb-xs">Guía rápida</div>
        <q-list dense class="text-caption">
          <q-item><q-item-section>
            <b>Corte de variables:</b> se incluyen las variables registradas hasta ese día del mes (incluido).
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Último día hábil:</b> calcula automáticamente el último día laboral del mes
            (omite sábados, domingos y feriados configurados).
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Día fijo:</b> si cae en día no hábil, se aplica el ajuste elegido (anterior / siguiente / sin ajuste).
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Publicación automática:</b> al terminar, el documento se publica sin revisión previa.
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Avisos:</b> si está activado, se notificará a los destinatarios cuando el documento quede publicado.
          </q-item-section></q-item>
        </q-list>

        <q-separator spaced />

        <div class="text-subtitle2 q-mb-xs">Resumen de la configuración</div>
        <q-list dense class="text-caption">
          <q-item>
            <q-item-section avatar>🗓️</q-item-section>
            <q-item-section>
              Frecuencia: <b>{{ etiquetaDe(freqOpts, vm.frequency) }}</b>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>✂️</q-item-section>
            <q-item-section>
              Corte de variables: <b>{{ vm.cutoffDay || '—' }}</b>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>📌</q-item-section>
            <q-item-section>
              Regla: <b>{{ etiquetaDe(paydayRuleOpts, vm.paydayRule) }}</b>
              <span v-if="vm.paydayRule==='fixed_day'"> · Día fijo: <b>{{ vm.paydayDayOfMonth || '—' }}</b></span>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>⚖️</q-item-section>
            <q-item-section>
              Ajuste por no hábil:
              <b>{{ vm.paydayRule==='last_business_day' ? 'No corresponde' : etiquetaDe(adjustOpts, vm.businessDayAdjust) }}</b>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>⏰</q-item-section>
            <q-item-section>
              Hora y zona horaria: <b>{{ vm.generateTime || '—' }}</b> · <b>{{ vm.timezone || '—' }}</b>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>➗</q-item-section>
            <q-item-section>
              Redondeo: <b>{{ etiquetaDe(roundingOpts, vm.rounding) }}</b>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>🚀</q-item-section>
            <q-item-section>
              Publicación: <b>{{ vm.autoPublish ? 'Automática' : 'Con revisión' }}</b>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>🔔</q-item-section>
            <q-item-section>
              Avisos: <b>{{ vm.notifyOnPublish ? 'Sí' : 'No' }}</b>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>📄</q-item-section>
            <q-item-section>
              Plantilla PDF: <b>{{ vm.templateId || '—' }}</b>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  /** feriados en formato 'AAAA-MM-DD' */
  holidays: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'validity'])

const vm = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

/* Opciones */
const freqOpts = [{ label: 'Mensual', value: 'monthly' }]
const paydayRuleOpts = [
  { label: 'Último día hábil', value: 'last_business_day' },
  { label: 'Día fijo', value: 'fixed_day' },
]
const adjustOpts = [
  { label: 'Mover al día hábil anterior', value: 'previous' },
  { label: 'Mover al día hábil siguiente', value: 'next' },
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

/* Textos dinámicos */
const hintCorte = computed(() =>
  vm.value?.cutoffDay
    ? `Se incluyen variables hasta el día ${vm.value.cutoffDay} (incluido).`
    : 'Elige un día entre 1 y 31.'
)

const roundingHint = computed(() => {
  switch (vm.value?.rounding) {
    case '0': return 'Redondea a enteros.'
    case '0.1': return 'Redondea a décimas.'
    case '0.5': return 'Redondea a múltiplos de 0,5.'
    case '1': return 'Redondea a múltiplos de 1.'
    default: return 'No modifica los valores.'
  }
})

/* Validación */
const errors = computed(() => {
  const t = vm.value || {}
  const e = {}

  const okTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(t.generateTime || '')
  if (!okTime) e.generateTime = 'Usa el formato HH:mm (00–23:59).'

  const cut = Number(t.cutoffDay)
  if (!Number.isFinite(cut) || cut < 1 || cut > 31) e.cutoffDay = 'Debe estar entre 1 y 31.'

  if (!t.paydayRule) e.paydayRule = 'Elige una regla.'

  if (t.paydayRule === 'fixed_day') {
    const d = Number(t.paydayDayOfMonth)
    if (!Number.isFinite(d) || d < 1 || d > 31) e.paydayDayOfMonth = 'Debe estar entre 1 y 31.'
  }

  return e
})

function esValido () { return Object.keys(errors.value).length === 0 }
function emitValid () { emit('validity', esValido()) }
onMounted(emitValid)
watch(() => vm.value, emitValid, { deep: true })

/* Hábiles y feriados */
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

/* Próxima ejecución (estimada) */
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
  if (t.paydayRule === 'last_business_day') return 'Se utiliza el último día hábil del mes (omite fines de semana y feriados).'
  if (t.paydayRule === 'fixed_day') {
    if (t.businessDayAdjust === 'previous') return 'Si el día fijo cae en no hábil, se mueve al hábil anterior.'
    if (t.businessDayAdjust === 'next') return 'Si el día fijo cae en no hábil, se mueve al hábil siguiente.'
    if (t.businessDayAdjust === 'none') return 'Si el día fijo cae en no hábil, no se modifica.'
  }
  return ''
})

/* Utilidades */
function etiquetaDe (opts, val) {
  const o = (opts || []).find(o => o.value === val)
  return o ? o.label : '—'
}
</script>

<style scoped>
/* Estilo con prefijo único (sin tocar body) */
.rk-sched-card {
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(0,0,0,.06);
  background:
    linear-gradient(180deg, rgba(2,6,23,.02), transparent 60%),
    var(--rk-sched-card-bg, #fff);
}

.rk-sched-chip {
  background: rgba(59,130,246,.10);
  color: #1e3a8a;
  font-weight: 600;
}

.rk-sched-tooltip { max-width: 360px; }

.rk-sched-banner {
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--rk-sched-banner-bg, #f3f5f7);
  color: var(--rk-sched-banner-fg, #1f2937);
}

.rk-sched-alert {
  border-left: 4px solid #f59e0b;
  background: rgba(245, 158, 11, .08);
  color: #7c4a00;
}

.body--dark .rk-sched-card {
  --rk-sched-card-bg: #0b1220;
  box-shadow: 0 4px 14px rgba(0,0,0,.28);
}
.body--dark .rk-sched-chip {
  background: rgba(59,130,246,.18);
  color: #93c5fd;
}
.body--dark .rk-sched-banner {
  --rk-sched-banner-bg: rgba(255,255,255,.06);
  --rk-sched-banner-fg: #e5e7eb;
}
.body--dark .rk-sched-alert {
  background: rgba(245, 158, 11, .15);
  color: #ffd28a;
  border-left-color: #fbbf24;
}
</style>
