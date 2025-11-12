<template>
  <div class="rk-user-card">
    <!-- Encabezado -->
    <div class="rk-user-header row items-center q-mb-sm">
      <q-icon name="person_add" size="22px" class="q-mr-sm" />
      <div class="text-subtitle1 text-weight-medium">Datos del usuario</div>
      <q-space />
      <q-chip square dense class="rk-user-chip">
        {{ local.tipo === 'admin' ? 'Rol: Admin' : 'Rol: Empleado' }}
      </q-chip>
    </div>

    <q-banner class="rk-user-help q-mb-md">
      <q-icon name="info" class="q-mr-sm" />
      Completa los datos. Los campos marcados son obligatorios. Puedes generar la contraseña automáticamente.
    </q-banner>

    <!-- GRID -->
    <div class="rk-user-grid">
      <!-- ===== Identidad ===== -->
      <div class="rk-section-title rk-span-2">Identidad</div>

      <q-input
        v-model="local.firstName"
        label="Nombre"
        dense outlined clearable
        :rules="[req]"
        autocomplete="given-name"
      />
      <q-input
        v-model="local.lastName"
        label="Apellido"
        dense outlined clearable
        :rules="[req]"
        autocomplete="family-name"
      />

      <!-- RUT y correo lado a lado en Identidad -->
      <q-input
        v-model="local.rut"
        label="RUT (sin puntos, con guion)"
        dense outlined clearable
        :rules="rutRules"
        placeholder="11111111-1"
        @blur="formatRut"
      >
        <template #append>
          <q-icon name="badge" />
          <q-tooltip class="rk-tip-pop">Ej.: 11111111-1</q-tooltip>
        </template>
      </q-input>

      <q-input
        v-model="local.email"
        label="Correo electrónico"
        type="email"
        dense outlined clearable
        :rules="[req, emailRule]"
        autocomplete="email"
        @blur="local.email = (local.email || '').trim().toLowerCase()"
      />

      <!-- ===== Rol ===== -->
      <div class="rk-section-title rk-span-2">Rol</div>
      <div class="rk-span-2">
        <q-option-group
          v-model="local.tipo"
          :options="roleOpts"
          inline
          class="rk-roles"
        />
        <q-banner v-if="local.tipo === 'admin'" class="rk-tip q-mt-sm">
          <q-icon name="admin_panel_settings" class="q-mr-xs" />
          Para administradores, el RUT no es obligatorio y no se requiere empresa ni horario.
        </q-banner>
      </div>

      <!-- ===== Vinculación (solo empleados) ===== -->
      <div v-if="local.tipo !== 'admin'" class="rk-section-title rk-span-2">Vinculación</div>

      <CompanySearchSelect
        v-if="local.tipo !== 'admin'"
        v-model="local.empresa"
        class="rk-span-2"
        :rules="[req]"
        label="Empresa"
        @created="onCompanyCreated"
      />

      <SchedulePicker
        v-if="local.tipo === 'empleado'"
        class="rk-span-2"
        v-model="local.workScheduleChoice"
        :company-id="local.empresa"
        :company="companyObj"
        :disable="!local.empresa"
        @preview="onPreviewSchedule"
        @created="onScheduleCreated"
      />

      <!-- ===== Acceso ===== -->
      <div class="rk-section-title rk-span-2">Acceso</div>

      <q-input
        v-model="local.password"
        :type="showPass ? 'text' : 'password'"
        label="Contraseña"
        dense outlined clearable
        :rules="[passMin]"
        autocomplete="new-password"
      >
        <template #append>
          <q-btn flat dense round :icon="showPass ? 'visibility' : 'visibility_off'" @click="togglePass" />
          <q-btn flat dense round icon="auto_fix_high" @click="generatePassword" />
          <q-btn flat dense round icon="content_copy" @click="copyPassword" />
        </template>
        <template #hint>
          <div class="row items-center no-wrap">
            <q-linear-progress :value="passScore" size="6px" rounded class="col q-mr-sm" />
            <span class="text-caption">{{ passLabel }}</span>
          </div>
        </template>
      </q-input>

      <q-input
        v-model="local.passwordConfirm"
        :type="showPass ? 'text' : 'password'"
        label="Confirmar contraseña"
        dense outlined clearable
        :rules="[matchPasswordRule]"
        autocomplete="new-password"
      >
        <template #append>
          <q-btn flat dense round :icon="showPass ? 'visibility' : 'visibility_off'" @click="togglePass" />
        </template>
      </q-input>

      <q-banner v-if="local.password && !passwordsMatch" class="rk-warn rk-span-2 q-mt-xs">
        <q-icon name="warning" class="q-mr-sm" />
        Las contraseñas no coinciden.
      </q-banner>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref, computed } from 'vue'
import {
  validarRUT,
  formatearRUT,
  emailRule,
  req,
  passMin
} from '@/utils/validators'
import CompanySearchSelect from '@/components/companies/CompanySearchSelect.vue'
import SchedulePicker from '@/components/users/SchedulePicker.vue'

/* Props / Emits */
const props = defineProps({
  modelValue: { type: Object, required: true },
  empresasRaw: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'tipo-change', 'preview-schedule'])

/* Estado base */
const EMPTY = () => ({
  firstName: '',
  lastName: '',
  email: '',
  tipo: 'empleado',
  empresa: null,
  rut: '',
  horarioLaboralId: null,
  workScheduleChoice: { mode: 'companyDefault', scheduleId: null },
  password: '',
  passwordConfirm: ''
})

const clean = (v = {}) => {
  const x = EMPTY()
  const s = v || {}
  const w = s.workScheduleChoice || {}
  x.firstName = s.firstName ?? ''
  x.lastName  = s.lastName  ?? ''
  x.email     = s.email     ?? ''
  x.tipo      = s.tipo      ?? 'empleado'
  x.empresa   = s.empresa   ?? null
  x.rut       = s.rut       ?? ''
  x.horarioLaboralId = s.horarioLaboralId ?? null
  x.workScheduleChoice = {
    mode: w.mode ?? 'companyDefault',
    scheduleId: w.scheduleId ?? null
  }
  x.password  = s.password  ?? ''
  x.passwordConfirm = s.passwordConfirm ?? ''
  return x
}

const stableStringify = (o) => JSON.stringify(o)
const isEqualClean = (a, b) => stableStringify(clean(a)) === stableStringify(clean(b))

/* Estado local */
const local = reactive(clean(props.modelValue))
const showPass = ref(false)
const roleOpts = [
  { label: 'Empleado', value: 'empleado' },
  { label: 'Admin',    value: 'admin' }
]
let syncing = false

/* Reglas RUT dinámicas: obligatorio solo para empleado */
const rutRule = (value) => {
  if (!value) return true
  try { return validarRUT(value) || 'RUT inválido' } catch { return true }
}
const rutRules = computed(() =>
  local.tipo === 'empleado'
    ? [req, rutRule]
    : [rutRule] // opcional para admin
)

/* Sincronización Padre -> Hijo */
watch(
  () => props.modelValue,
  (v) => {
    const src = clean(v)
    if (!isEqualClean(src, local)) {
      syncing = true
      Object.assign(local, src)
      queueMicrotask(() => { syncing = false })
    }
  },
  { deep: true, immediate: true }
)

/* Sincronización Hijo -> Padre */
watch(
  local,
  (v) => {
    if (syncing) return
    const out = clean(v)
    if (!isEqualClean(out, props.modelValue)) {
      emit('update:modelValue', structuredClone(out))
    }
  },
  { deep: true }
)

/* Emitir cambios de tipo y limpiar cuando es admin */
watch(
  () => local.tipo,
  (nv, ov) => {
    if (syncing) return
    if (nv === ov) return
    emit('tipo-change', nv)

    if (nv === 'admin') {
      // Para admin no queremos empresa ni horario
      local.empresa = null
      local.workScheduleChoice = { mode: 'companyDefault', scheduleId: null }
    }
  }
)

/* Reset de horario cuando cambia de empresa */
watch(
  () => local.empresa,
  (nv, ov) => {
    if (syncing) return
    if (nv !== ov) {
      // Nueva empresa -> limpiamos elección de horario
      local.workScheduleChoice = { mode: 'companyDefault', scheduleId: null }
    }
  }
)

/* Utilidades */
const matchPasswordRule = (v) => v === local.password || 'Las contraseñas no coinciden'
const passwordsMatch = computed(() => !local.password || local.passwordConfirm === local.password)

function formatRut () {
  if (!local.rut) return
  try { local.rut = formatearRUT(local.rut) } catch {}
}
function generatePassword () {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*_-'
  let out = ''
  for (let i = 0; i < 12; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
  local.password = out
  local.passwordConfirm = ''
}
function copyPassword () {
  if (!local.password) return
  navigator?.clipboard?.writeText?.(local.password).catch(() => {})
}
function togglePass () { showPass.value = !showPass.value }

/* Indicador simple de fortaleza */
const passScore = computed(() => {
  const p = String(local.password || '')
  let s = 0
  if (p.length >= 8) s += 0.25
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s += 0.25
  if (/\d/.test(p)) s += 0.25
  if (/[^A-Za-z0-9]/.test(p)) s += 0.25
  return Math.min(1, s)
})
const passLabel = computed(() => {
  const v = passScore.value
  if (v >= 0.9) return 'Fuerte'
  if (v >= 0.6) return 'Media'
  if (v > 0)   return 'Débil'
  return '—'
})

/* Datos de empresa (opcional) */
const companyObj = computed(() => {
  const id = String(local.empresa || '')
  if (!id) return null
  const arr = props.empresasRaw || []
  return arr.find(e => String(e.id || e._id) === id) || null
})

/* Eventos hijos */
function onCompanyCreated (company) { if (company?._id) local.empresa = company._id }
function onPreviewSchedule (id)    { if (id) emit('preview-schedule', id) }
function onScheduleCreated ()      { /* opcional */ }
</script>

<style scoped>
/* Tarjeta */
.rk-user-card {
  border-radius: 14px;
  border: 1px solid var(--rk-user-border, rgba(0,0,0,.08));
  background:
    linear-gradient(180deg, rgba(2,6,23,.02), transparent 60%),
    var(--rk-user-bg, #fff);
  padding: 14px;
}

/* Encabezado */
.rk-user-chip {
  background: rgba(59,130,246,.12);
  color: #1e3a8a;
  font-weight: 600;
}

/* Ayudas y avisos */
.rk-user-help {
  border-radius: 10px;
  background: var(--rk-user-help-bg, #f3f5f7);
  color: var(--rk-user-help-fg, #1f2937);
  padding: 10px 12px;
}
.rk-tip {
  border-left: 4px solid #10b981;
  background: rgba(16,185,129,.10);
  color: #065f46;
  border-radius: 8px;
  padding: 8px 10px;
}
.rk-warn {
  border-left: 4px solid #f59e0b;
  background: rgba(245,158,11,.10);
  color: #7c4a00;
  border-radius: 8px;
  padding: 8px 10px;
}
.rk-tip-pop { max-width: 220px; }

/* Títulos de sección */
.rk-section-title {
  font-weight: 600;
  color: var(--rk-user-title, #111827);
  margin: 2px 0 2px;
}

/* Grid */
.rk-user-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 12px 14px;
}
.rk-span-2 { grid-column: 1 / -1; }

/* Roles */
.rk-roles { padding: 2px 0 0; }

/* Modo oscuro */
.body--dark .rk-user-card {
  --rk-user-bg: #0b1220;
  --rk-user-border: rgba(255,255,255,.08);
}
.body--dark .rk-user-help {
  --rk-user-help-bg: rgba(255,255,255,.06);
  --rk-user-help-fg: #e5e7eb;
}
.body--dark .rk-tip {
  background: rgba(16,185,129,.18);
  color: #a7f3d0;
}
.body--dark .rk-warn {
  background: rgba(245,158,11,.18);
  color: #ffd28a;
}

/* Responsive */
@media (max-width: 768px) {
  .rk-user-grid { grid-template-columns: 1fr; }
}
</style>
