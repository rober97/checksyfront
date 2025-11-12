<template>
  <div class="rk-vac row q-col-gutter-sm">
    <!-- ===== Acciones rápidas ===== -->
    <div class="col-12">
      <div class="row items-center">
        <q-btn
          outline dense color="secondary" icon="dashboard_customize"
          class="q-mb-sm q-mr-sm rk-vac-btn"
          @click="$emit('apply-preset', 'cl_basica')"
        >
          Aplicar “Chile – Básica” (15 días/año)
          <q-tooltip class="rk-vac-tip">
            Configura 15 días por año (~1,25 por mes), sin traslado ni tope.
          </q-tooltip>
        </q-btn>

        <q-btn
          outline dense color="secondary" icon="science"
          class="q-mb-sm rk-vac-btn"
          @click="$emit('apply-preset', 'acumulacion_mensual')"
        >
          Aplicar “Mensual 1,25 d”
          <q-tooltip class="rk-vac-tip">
            Configura acumulación mensual directa: 1,25 días al mes (equivalente a 15/año).
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- ===== Tarjeta principal: Configuración ===== -->
    <div class="col-12 col-md-7">
      <q-card flat bordered class="rk-vac-card q-pa-md">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-h6">Acumulación de vacaciones</div>
          <q-chip square dense class="rk-vac-chip">
            {{ vm.vacation.cap?.enabled ? 'Tope activo' : 'Sin tope' }}
          </q-chip>
        </div>

        <div class="text-caption text-grey-7 q-mb-md">
          Define cómo se <b>acumulan</b> los días, si cuentan solo <b>días hábiles</b>, la <b>carencia</b> inicial,
          si se <b>prorratea</b> desde el inicio y, opcionalmente, el <b>traslado de saldo</b> al año siguiente y un <b>tope</b>.
        </div>

        <!-- Modo y solo hábiles -->
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="vm.vacation.accrual.mode"
              :options="accrualModes"
              emit-value map-options
              dense outlined
              label="Modo de acumulación"
              :hint="hintModo"
              :error="!!errors.mode"
              :error-message="errors.mode"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-toggle
              v-model="vm.vacation.accrual.accrueOnBusinessDays"
              dense
              :label="vm.vacation.accrual.accrueOnBusinessDays
                ? 'Solo días hábiles (activado)'
                : 'Incluir fines de semana (desactivado)'"
              @update:model-value="emitValid"
            >
              <q-tooltip class="rk-vac-tip">
                Si está activo, la acumulación considera solo días laborales (omite fines de semana y feriados definidos por tu sistema).
              </q-tooltip>
            </q-toggle>
          </div>
        </div>

        <!-- Tasas -->
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="vm.vacation.accrual.perYearDays"
              type="number" min="0" step="0.5"
              dense outlined
              label="Días por año"
              :hint="equivalenciasTexto"
              :error="!!errors.perYearDays"
              :error-message="errors.perYearDays"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="vm.vacation.accrual.perMonthDays"
              type="number" min="0" step="0.1"
              dense outlined
              label="Días por mes (opcional)"
              :hint="hintMes"
              :error="!!errors.perMonthDays"
              :error-message="errors.perMonthDays"
              @update:model-value="emitValid"
            />
          </div>
        </div>

        <!-- Carencia y prorrateo -->
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="vm.vacation.accrual.startAfterDays"
              type="number" min="0" step="1"
              dense outlined
              label="Carencia inicial (días)"
              :hint="'La acumulación comienza después de ' + (vm.vacation.accrual.startAfterDays || 0) + ' día(s).' "
              :error="!!errors.startAfterDays"
              :error-message="errors.startAfterDays"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-toggle
              v-model="vm.vacation.accrual.prorateFromStartDate"
              dense
              label="Prorratear desde el inicio de contrato"
              @update:model-value="emitValid"
            >
              <q-tooltip class="rk-vac-tip">
                Si el contrato comienza a mitad de mes, acumula proporcionalmente según los días trabajados.
              </q-tooltip>
            </q-toggle>
          </div>
        </div>

        <!-- Avisos de configuración -->
        <q-banner
          v-if="!tieneTasa"
          class="rk-vac-warn q-mt-md"
        >
          <q-icon name="warning" class="q-mr-sm" />
          Aún no definiste una tasa de acumulación. Ingresa <b>días por año</b> o <b>días por mes</b>.
        </q-banner>

        <q-separator class="q-my-md" />

        <!-- ===== Traslado de saldo (Carry over) ===== -->
        <div class="text-subtitle2 q-mb-xs row items-center">
          Traslado de saldo al año siguiente
          <q-icon name="help_outline" size="16px" class="q-ml-xs">
            <q-tooltip class="rk-vac-tip">Cuántos días no usados se trasladan al siguiente año y cuándo se ejecuta.</q-tooltip>
          </q-icon>
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-4">
            <q-toggle
              v-model="vm.vacation.carryOver.enabled"
              dense
              :label="vm.vacation.carryOver.enabled ? 'Traslado activado' : 'Traslado desactivado'"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-6 col-sm-4">
            <q-input
              v-model.number="vm.vacation.carryOver.maxCarry"
              type="number" min="0" step="0.5"
              dense outlined
              label="Máximo a trasladar"
              :disable="!vm.vacation.carryOver.enabled"
              :error="!!errors.maxCarry"
              :error-message="errors.maxCarry"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-6 col-sm-4">
            <q-select
              v-model="vm.vacation.carryOver.resetMonth"
              :options="mesesOpts"
              emit-value map-options
              dense outlined
              label="Mes de traslado"
              :disable="!vm.vacation.carryOver.enabled"
              :error="!!errors.resetMonth"
              :error-message="errors.resetMonth"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-6 col-sm-3">
            <q-input
              v-model.number="vm.vacation.carryOver.resetDay"
              type="number" min="1" max="31"
              dense outlined
              label="Día"
              :disable="!vm.vacation.carryOver.enabled"
              :hint="hintDiaTraslado"
              :error="!!errors.resetDay"
              :error-message="errors.resetDay"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-12 col-sm-9">
            <q-banner v-if="vm.vacation.carryOver.enabled" class="rk-vac-banner q-mt-sm">
              <q-icon name="event_repeat" class="q-mr-sm" />
              Próximo traslado (estimado): <b>{{ proximoTrasladoLabel }}</b>
            </q-banner>
          </div>
        </div>

        <q-separator class="q-my-md" />

        <!-- ===== Tope de acumulación ===== -->
        <div class="row q-col-gutter-sm">
          <div class="col-6 col-sm-4">
            <q-toggle
              v-model="vm.vacation.cap.enabled"
              dense
              :label="vm.vacation.cap.enabled ? 'Tope activado' : 'Sin tope'"
              @update:model-value="emitValid"
            />
          </div>

          <div class="col-6 col-sm-8">
            <q-input
              v-model.number="vm.vacation.cap.maxDays"
              type="number" min="0" step="0.5"
              dense outlined
              label="Máximo de días acumulables"
              :disable="!vm.vacation.cap.enabled"
              :error="!!errors.maxDays"
              :error-message="errors.maxDays"
              @update:model-value="emitValid"
            />
          </div>
        </div>
      </q-card>
    </div>

    <!-- ===== Lado derecho: Guía y resumen ===== -->
    <div class="col-12 col-md-5">
      <q-card flat bordered class="rk-vac-card q-pa-md">
        <div class="text-subtitle2 q-mb-xs">Guía clara</div>
        <q-list dense class="text-caption">
          <q-item><q-item-section>
            <b>Modo de acumulación:</b> “Diario” reparte la tasa por día; “Mensual” agrega un bloque cada mes.
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Solo días hábiles:</b> si está activo, no se acumula en fines de semana ni feriados.
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Días por año / mes:</b> puedes indicar uno u otro. Si “por mes” queda vacío, se calcula como (por año ÷ 12).
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Carencia inicial:</b> la acumulación comienza pasado ese número de días desde el inicio.
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Prorrateo:</b> si el inicio no es el día 1, se acumula proporcionalmente.
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Traslado de saldo:</b> define cuántos días no usados pasan al año siguiente y en qué fecha ocurre.
          </q-item-section></q-item>
          <q-item><q-item-section>
            <b>Tope:</b> impide superar cierta cantidad de días acumulados.
          </q-item-section></q-item>
        </q-list>

        <q-separator spaced />

        <div class="text-subtitle2 q-mb-xs">Resumen actual</div>
        <q-list dense class="text-caption">
          <q-item>
            <q-item-section avatar>⚙️</q-item-section>
            <q-item-section>Modo: <b>{{ etiquetaDe(accrualModes, vm.vacation.accrual.mode) }}</b></q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>➕</q-item-section>
            <q-item-section>
              Tasa: <b>{{ tasaAnualTexto }}</b> · <b>{{ tasaMensualTexto }}</b>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>🏁</q-item-section>
            <q-item-section>Carencia: <b>{{ vm.vacation.accrual.startAfterDays || 0 }}</b> día(s)</q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>📅</q-item-section>
            <q-item-section>Prorrateo: <b>{{ vm.vacation.accrual.prorateFromStartDate ? 'Sí' : 'No' }}</b></q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>🏢</q-item-section>
            <q-item-section>Solo hábiles: <b>{{ vm.vacation.accrual.accrueOnBusinessDays ? 'Sí' : 'No' }}</b></q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>🔁</q-item-section>
            <q-item-section>
              Traslado: <b>{{ vm.vacation.carryOver.enabled ? 'Activado' : 'Desactivado' }}</b>
              <template v-if="vm.vacation.carryOver.enabled">
                · Máx: <b>{{ formNum(vm.vacation.carryOver.maxCarry) }}</b>
                · Fecha: <b>{{ proximoTrasladoLabel }}</b>
              </template>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>⛔</q-item-section>
            <q-item-section>
              Tope: <b>{{ vm.vacation.cap.enabled ? formNum(vm.vacation.cap.maxDays) + ' días' : 'Sin tope' }}</b>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue', 'apply-preset', 'validity'])

const vm = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

/* ===== Opciones ===== */
const accrualModes = [
  { label: 'Diario', value: 'DAILY' },
  { label: 'Mensual', value: 'MONTHLY' },
]
const mesesOpts = [
  { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
]

/* ===== Textos dinámicos ===== */
const hintModo = computed(() =>
  vm.value?.vacation?.accrual?.mode === 'DAILY'
    ? 'Distribuye la tasa de manera diaria.'
    : 'Agrega un bloque de días cada mes.'
)

const perYear = computed(() => num(vm.value?.vacation?.accrual?.perYearDays))
const perMonth = computed(() => {
  const v = vm.value?.vacation?.accrual?.perMonthDays
  return v === null || v === undefined || v === '' ? null : num(v)
})
const perMonthEfectivo = computed(() => {
  if (perMonth.value !== null) return perMonth.value
  if (perYear.value > 0) return round(perYear.value / 12, 2)
  return 0
})
const equivalenciasTexto = computed(() => {
  if (!perYear.value) return 'Ejemplo: 15 por año ≈ 1,25 por mes.'
  return `Equivale a ~ ${formNum(round(perYear.value / 12, 2))} por mes.`
})
const hintMes = computed(() =>
  perMonth.value === null
    ? 'Si lo dejas vacío, se calcula como (días por año ÷ 12).'
    : 'Valor mensual explícito (ignora el cálculo automático).'
)

const tasaAnualTexto = computed(() =>
  `Año: ${formNum(perYear.value || (perMonthEfectivo.value * 12))} días`
)
const tasaMensualTexto = computed(() =>
  `Mes: ${formNum(perMonthEfectivo.value)} días`
)

const hintDiaTraslado = computed(() => {
  const m = vm.value?.vacation?.carryOver?.resetMonth
  if (!m) return 'Elige un mes para habilitar este campo.'
  const max = diasDelMes(yearNow(), m)
  return `Para ${nombreMes(m)} (${yearNow()}), máximo ${max}.`
})

/* ===== Validaciones ===== */
const errors = computed(() => {
  const e = {}
  const a = vm.value?.vacation?.accrual || {}
  const co = vm.value?.vacation?.carryOver || {}
  const cap = vm.value?.vacation?.cap || {}

  // Modo
  if (!a.mode) e.mode = 'Selecciona el modo.'

  // Tasas
  const y = num(a.perYearDays)
  const m = vm.value?.vacation?.accrual?.perMonthDays
  const mes = (m === null || m === undefined || m === '') ? null : num(m)

  if (y < 0) e.perYearDays = 'No puede ser negativo.'
  if (mes !== null && mes < 0) e.perMonthDays = 'No puede ser negativo.'
  if ((y === 0 || !isFinite(y)) && (mes === null || mes === 0)) {
    e.perYearDays = 'Ingresa días por año o por mes.'
    e.perMonthDays = 'Ingresa días por año o por mes.'
  }

  // Carencia
  const wait = num(a.startAfterDays)
  if (wait < 0) e.startAfterDays = 'No puede ser negativo.'

  // Carry Over
  if (co.enabled) {
    const mc = num(co.maxCarry)
    if (mc < 0) e.maxCarry = 'No puede ser negativo.'
    if (!co.resetMonth) e.resetMonth = 'Elige el mes del traslado.'
    const rd = num(co.resetDay)
    if (rd <= 0) e.resetDay = 'Debe ser mayor o igual a 1.'
    const maxDay = diasDelMes(yearNow(), co.resetMonth || 1)
    if (rd > maxDay) e.resetDay = `Para ${nombreMes(co.resetMonth)} ${yearNow()}, máximo ${maxDay}.`
  }

  // Tope
  if (cap.enabled) {
    const md = num(cap.maxDays)
    if (!isFinite(md) || md < 0) e.maxDays = 'Ingresa un valor válido (≥ 0).'
  }

  return e
})

const tieneTasa = computed(() => {
  const a = vm.value?.vacation?.accrual || {}
  const y = num(a.perYearDays)
  const m = a.perMonthDays
  const mes = (m === null || m === undefined || m === '') ? null : num(m)
  return (y > 0) || (mes !== null && mes > 0)
})

function isValid () { return Object.keys(errors.value).length === 0 }
function emitValid () { emit('validity', isValid()) }
onMounted(emitValid)
watch(() => vm.value, emitValid, { deep: true })

/* ===== Próximo traslado (estimado) ===== */
const proximoTraslado = computed(() => {
  try {
    const co = vm.value?.vacation?.carryOver || {}
    if (!co.enabled || !co.resetMonth || !co.resetDay) return null
    const y = yearNow()
    const maxD = diasDelMes(y, co.resetMonth)
    const d = Math.min(num(co.resetDay), maxD)
    return new Date(Date.UTC(y, co.resetMonth - 1, d, 12, 0, 0))
  } catch { return null }
})
const proximoTrasladoLabel = computed(() => {
  if (!proximoTraslado.value) return '—'
  try {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'full' }).format(proximoTraslado.value)
  } catch {
    return proximoTraslado.value.toISOString().slice(0,10)
  }
})

/* ===== Utilidades numéricas y de fecha ===== */
function num (v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}
function round (v, d = 2) {
  const p = Math.pow(10, d)
  return Math.round((v + Number.EPSILON) * p) / p
}
function formNum (v) {
  const n = isFinite(Number(v)) ? Number(v) : 0
  return n.toLocaleString('es-CL', { maximumFractionDigits: 2 })
}
function yearNow () { return new Date().getUTCFullYear() }
function diasDelMes (y, m /*1..12*/) {
  if (!m) return 31
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}
function nombreMes (m) {
  const o = mesesOpts.find(x => x.value === m)
  return o ? o.label : '—'
}
function etiquetaDe (opts, val) {
  const o = (opts || []).find(o => o.value === val)
  return o ? o.label : '—'
}
</script>

<style scoped>
/* ===== Estilos con prefijo único ===== */
.rk-vac-card {
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(0,0,0,.06);
  background:
    linear-gradient(180deg, rgba(2,6,23,.02), transparent 60%),
    var(--rk-vac-card-bg, #fff);
}

.rk-vac-chip {
  background: rgba(99,102,241,.12); /* índigo suave */
  color: #1e3a8a;
  font-weight: 600;
}

.rk-vac-btn { border-radius: 10px; }
.rk-vac-tip { max-width: 360px; }

.rk-vac-banner {
  border-radius: 10px;
  padding: 8px 12px;
  background: var(--rk-vac-banner-bg, #f3f5f7);
  color: var(--rk-vac-banner-fg, #1f2937);
}

.rk-vac-warn {
  border-left: 4px solid #f59e0b;
  background: rgba(245,158,11,.08);
  color: #7c4a00;
  border-radius: 10px;
  padding: 10px 12px;
}

/* Dark mode friendly (sin tocar body) */
.body--dark .rk-vac-card {
  --rk-vac-card-bg: #0b1220;
  box-shadow: 0 4px 14px rgba(0,0,0,.28);
}
.body--dark .rk-vac-chip {
  background: rgba(99,102,241,.18);
  color: #93c5fd;
}
.body--dark .rk-vac-banner {
  --rk-vac-banner-bg: rgba(255,255,255,.06);
  --rk-vac-banner-fg: #e5e7eb;
}
.body--dark .rk-vac-warn {
  background: rgba(245,158,11,.15);
  color: #ffd28a;
  border-left-color: #fbbf24;
}
</style>
