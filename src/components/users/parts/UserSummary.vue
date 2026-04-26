<template>
  <div class="rk-summary-wrap">
    <!-- Header -->
    <div class="rk-head row items-center no-wrap q-mb-sm">
      <q-avatar class="rk-avatar q-mr-sm" size="36px">
        {{ initials }}
      </q-avatar>

      <div class="col">
        <div class="row items-center no-wrap">
          <div class="text-body2 text-weight-medium ellipsis">
            {{ fullName || '—' }}
          </div>
          <q-badge :color="roleColor" class="q-ml-xs" outline align="middle">
            {{ roleLabel }}
          </q-badge>
        </div>

        <div class="row items-center q-gutter-xs text-caption text-grey-7 q-mt-xs">
          <div class="row items-center no-wrap">
            <q-icon name="mail" size="16px" class="q-mr-xs" />
            <span class="ellipsis">{{ form.email || '—' }}</span>
            <q-btn
              v-if="form.email"
              flat dense round size="sm" icon="content_copy"
              class="q-ml-xs"
              @click="copy(form.email)"
            >
              <q-tooltip>Copiar correo</q-tooltip>
            </q-btn>
          </div>

          <div class="row items-center no-wrap" v-if="form.rut">
            <q-separator vertical spaced inset />
            <q-icon name="badge" size="16px" class="q-mr-xs" />
            <span>{{ form.rut }}</span>
            <q-btn
              flat dense round size="sm" icon="content_copy"
              class="q-ml-xs"
              @click="copy(form.rut)"
            >
              <q-tooltip>Copiar RUT</q-tooltip>
            </q-btn>
          </div>

          <div class="row items-center no-wrap">
            <q-separator vertical spaced inset />
            <q-icon name="business" size="16px" class="q-mr-xs" />
            <q-chip
              v-if="empresaLabel"
              dense square class="rk-chip"
              icon="apartment"
            >
              {{ empresaLabel }}
            </q-chip>
            <span v-else>—</span>
          </div>
        </div>
      </div>
    </div>

    <q-separator spaced />

    <!-- Completitud -->
    <div class="q-mb-sm">
      <div class="row items-center justify-between q-mb-xs">
        <div class="text-caption text-grey-7">Completitud del perfil</div>
        <div class="text-caption">{{ completeness.pct }}%</div>
      </div>
      <q-linear-progress
        :value="completeness.value"
        :color="completeness.color"
        size="8px"
        rounded
      />
      <div class="rk-miss-list" v-if="completeness.missing.length">
        <div class="text-caption text-grey-7 q-mt-sm">Faltan:</div>
        <div class="rk-miss-items">
          <q-badge
            v-for="m in completeness.missing"
            :key="m"
            color="warning"
            text-color="black"
            class="rk-miss-badge"
            outline
          >
            {{ m }}
          </q-badge>
        </div>
      </div>
    </div>

    <q-separator spaced />

    <!-- Liquidación -->
    <div class="rk-summary-block">
      <div class="text-caption text-grey-7 q-mb-xs">Liquidación</div>

      <div class="rk-kpis">
        <div class="rk-kpi">
          <div class="rk-kpi-label">Base</div>
          <div class="rk-kpi-value">{{ money(form.payroll.baseSalary) || '—' }}</div>
        </div>

        <div class="rk-kpi">
          <div class="rk-kpi-label">Contrato</div>
          <div class="rk-kpi-value">{{ contractNice || '—' }}</div>
        </div>

        <div class="rk-kpi">
          <div class="rk-kpi-label">AFP / Salud</div>
          <div class="rk-kpi-value ellipsis">
            {{ afpDisplay || '—' }} · {{ healthDisplay || '—' }}
          </div>
        </div>

        <div class="rk-kpi">
          <div class="rk-kpi-label">Ingreso</div>
          <div class="rk-kpi-value">{{ form.payroll.startDate || '—' }}</div>
        </div>

        <div class="rk-kpi" v-if="isEmployee">
          <div class="rk-kpi-label">Cargas</div>
          <div class="rk-kpi-value">
            {{ Number(form.payroll.cargasFamiliares || 0) }}
          </div>
        </div>

        <div class="rk-kpi" v-if="isEmployee">
          <div class="rk-kpi-label">Imp. renta</div>
          <div class="rk-kpi-value">
            {{ form.payroll.incomeTaxApplies === false ? 'Exento' : 'Afecto' }}
          </div>
        </div>
      </div>

      <!-- Detalle compacto si hay Isapre -->
      <div
        v-if="healthDisplay === 'ISAPRE' && (form.payroll.isaprePlan || form.payroll.isapreUf)"
        class="rk-compact"
      >
        <q-icon name="medical_services" size="16px" class="q-mr-xs" />
        <span class="text-caption">
          Plan: <b>{{ form.payroll.isaprePlan || '—' }}</b>
          <span v-if="form.payroll.isapreUf"> · {{ form.payroll.isapreUf }} UF</span>
        </span>
      </div>

      <div
        v-if="isEmployee && form.payroll.incomeTaxApplies === false && form.payroll.incomeTaxNote"
        class="rk-compact"
      >
        <q-icon name="receipt_long" size="16px" class="q-mr-xs" />
        <span class="text-caption">
          Exención tributaria: <b>{{ form.payroll.incomeTaxNote }}</b>
        </span>
      </div>
    </div>

    <q-separator spaced />

    <div class="rk-summary-hint text-caption">
      Revisa que todo esté correcto. Puedes volver a cualquier pestaña para ajustar.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { formatMoney } from '@/utils/format'

const $q = useQuasar()
const props = defineProps({
  form: { type: Object, required: true },
  empresasRaw: { type: Array, default: () => [] },
})

const form = props.form
const money = (n) => formatMoney(n)

const fullName = computed(() =>
  [form.firstName, form.lastName].filter(Boolean).join(' ')
)

const initials = computed(() => {
  const s = (fullName.value || '').trim()
  if (!s) return 'U'
  const parts = s.split(/\s+/)
  const a = (parts[0] || 'U')[0]
  const b = (parts[1] || '')[0] || ''
  return (a + b).toUpperCase()
})

const roleLabel = computed(() => {
  if (form.tipo === 'empresa') return 'Empresa'
  if (form.tipo === 'empleado') return 'Empleado'
  return '—'
})

const roleColor = computed(() => {
  return form.tipo === 'empresa'
    ? 'indigo-6'
    : form.tipo === 'empleado'
    ? 'teal-6'
    : 'grey-6'
})

const empresaLabel = computed(() => {
  const it = props.empresasRaw.find((e) => e.id === form.empresa)
  return it ? it.name : ''
})

const isEmployee = computed(() => form.tipo === 'empleado')
const afpDisplay = computed(() => form?.payroll?.afp || form?.payroll?.afpEntityId || '')
const healthDisplay = computed(() => form?.payroll?.saludSistema || form?.payroll?.healthEntityId || '')

/* Nombre bonito del contrato */
const contractNice = computed(() => {
  const m = {
    indefinido: 'Indefinido',
    plazo_fijo: 'Plazo fijo',
    part_time: 'Part-time',
    honorarios: 'Honorarios',
  }
  return m[form?.payroll?.contractType] || form?.payroll?.contractType
})

/* Completitud dinámica */
const completeness = computed(() => {
  const reqBase = ['firstName', 'lastName', 'email', 'password', 'tipo']
  const reqCompany = ['empresa']
  // Empleado on-call no requiere horarioLaboralId — el horario se crea automáticamente al guardar
  const isOncall = form?.workScheduleChoice?.mode === 'oncall'
  const reqEmp = form.tipo === 'empleado'
    ? (isOncall ? ['rut'] : ['rut', 'horarioLaboralId'])
    : []
  const reqPayroll = ['payroll.baseSalary', 'payroll.contractType', 'payroll.jornada', 'payroll.startDate', 'payroll.afpEntityId', 'payroll.healthEntityId']

  const required = [...reqBase, ...reqCompany, ...reqEmp, ...reqPayroll]
  const missing = required.filter((path) => !get(form, path))

  const pct = Math.round(((required.length - missing.length) / required.length) * 100)
  return {
    value: Math.max(0, Math.min(1, pct / 100)),
    pct,
    color: pct < 60 ? 'warning' : pct < 90 ? 'info' : 'positive',
    missing: missing.map(humanizeField),
  }
})

/* helpers */
function get(obj, path) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined && acc[k] !== '' ? acc[k] : null), obj)
}

function humanizeField(f) {
  const map = {
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo',
    password: 'Contraseña',
    tipo: 'Tipo de usuario',
    empresa: 'Empresa',
    rut: 'RUT',
    horarioLaboralId: 'Horario laboral',
    'payroll.baseSalary': 'Sueldo base',
    'payroll.contractType': 'Tipo contrato',
    'payroll.jornada': 'Jornada',
    'payroll.startDate': 'Fecha ingreso',
    'payroll.afpEntityId': 'AFP',
    'payroll.healthEntityId': 'Salud',
  }
  return map[f] || f
}

function copy(text) {
  navigator.clipboard?.writeText(String(text)).then(() => {
    $q.notify({ message: 'Copiado', color: 'primary', timeout: 1000 })
  })
}
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   TOKENS — heredan del modal padre
══════════════════════════════════════════════════ */
.rk-summary-wrap {
  --rk-bg:           #ffffff;
  --rk-surface:      #f7f8fc;
  --rk-border:       rgba(15, 17, 23, 0.08);
  --rk-text:         #0f1117;
  --rk-text-2:       #5a6482;
  --rk-text-3:       #9aa1b9;
  --rk-accent:       #6366f1;
  --rk-accent-soft:  rgba(99, 102, 241, 0.10);
  --rk-success:      #16a34a;
  --rk-warn:         #d97706;
  color: var(--rk-text);
}

.body--dark .rk-summary-wrap {
  --rk-bg:           #141720;
  --rk-surface:      #1a1e2a;
  --rk-border:       rgba(255, 255, 255, 0.08);
  --rk-text:         #e8eaf2;
  --rk-text-2:       #8b92ad;
  --rk-text-3:       #555d78;
  --rk-accent-soft:  rgba(99, 102, 241, 0.18);
}

/* Header */
.rk-head .ellipsis { max-width: 180px; }
.rk-avatar {
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
  font-weight: 700;
}

/* Texto auxiliar — sustituye text-grey-7 que no se ve bien en dark */
.rk-summary-wrap :deep(.text-grey-7) {
  color: var(--rk-text-2) !important;
}

/* chips/badges */
.rk-chip {
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  color: var(--rk-text-2);
  font-weight: 500;
}

/* KPIs grid */
.rk-kpis {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
  padding: 4px 0;
}
.rk-kpi {
  padding: 6px 8px;
  background: var(--rk-bg);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
}
.rk-kpi-label {
  font-size: 10.5px;
  color: var(--rk-text-3);
  letter-spacing: 0.4px;
  text-transform: uppercase;
  font-weight: 600;
}
.rk-kpi-value {
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--rk-text);
  margin-top: 2px;
}

/* hint compacta (Isapre / exención) */
.rk-compact {
  margin-top: 8px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
  color: var(--rk-text-2);
  font-size: 11.5px;
}
.rk-compact .q-icon { color: var(--rk-accent); }

/* missing badges */
.rk-miss-items { margin-top: 4px; }
.rk-miss-badge {
  margin: 2px 4px 0 0;
  border-color: var(--rk-warn) !important;
  color: var(--rk-warn) !important;
  font-weight: 600;
}

/* hint final */
.rk-summary-hint {
  color: var(--rk-text-3);
  line-height: 1.5;
}

@media (min-width: 1200px) {
  .rk-head .ellipsis { max-width: 220px; }
}
</style>
