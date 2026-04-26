<template>
  <div class="rk-user-card">
    <!-- GRID DE FORMULARIO -->
    <div class="rk-form-sections">
      
      <!-- ===== Sección 1: Identidad ===== -->
      <div class="rk-section" data-step="0">
        <div class="rk-section-header">
          <div class="rk-section-icon">
            <q-icon name="fingerprint" />
          </div>
          <div class="rk-section-title-wrap">
            <h4 class="rk-section-title">Identidad</h4>
            <p class="rk-section-desc">Información personal del usuario</p>
          </div>
        </div>

        <div class="rk-section-grid">
          <div class="rk-input-wrap">
            <q-input
              v-model="local.firstName"
              label="Nombre"
              dense
              outlined
              clearable
              :rules="[req]"
              autocomplete="given-name"
              class="rk-input"
            >
              <template #prepend>
                <q-icon name="person" class="rk-input-icon" />
              </template>
            </q-input>
          </div>

          <div class="rk-input-wrap">
            <q-input
              v-model="local.lastName"
              label="Apellido"
              dense
              outlined
              clearable
              :rules="[req]"
              autocomplete="family-name"
              class="rk-input"
            >
              <template #prepend>
                <q-icon name="person_outline" class="rk-input-icon" />
              </template>
            </q-input>
          </div>

          <div class="rk-input-wrap">
            <q-input
              v-model="local.rut"
              label="RUT (sin puntos, con guion)"
              dense
              outlined
              clearable
              :rules="rutRules"
              placeholder="11111111-1"
              @blur="formatRut"
              class="rk-input"
            >
              <template #prepend>
                <q-icon name="badge" class="rk-input-icon" />
              </template>
              <template #append>
                <q-btn 
                  flat 
                  dense 
                  round 
                  size="sm"
                  icon="info"
                  class="rk-info-btn"
                >
                  <q-tooltip class="rk-tooltip">
                    Formato: 11111111-1
                  </q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>

          <div class="rk-input-wrap">
            <q-input
              v-model="local.email"
              label="Correo electrónico"
              type="email"
              dense
              outlined
              clearable
              :rules="[req, emailRule]"
              autocomplete="email"
              @blur="local.email = (local.email || '').trim().toLowerCase()"
              class="rk-input"
            >
              <template #prepend>
                <q-icon name="email" class="rk-input-icon" />
              </template>
            </q-input>
          </div>
        </div>
      </div>

      <!-- ===== Sección Rol (sólo para superadmin) ===== -->
      <div v-if="canPickRole" class="rk-section" data-step="1">
        <div class="rk-section-header">
          <div class="rk-section-icon">
            <q-icon name="verified_user" />
          </div>
          <div class="rk-section-title-wrap">
            <h4 class="rk-section-title">Tipo de usuario</h4>
            <p class="rk-section-desc">Define el nivel de acceso del nuevo usuario</p>
          </div>
        </div>

        <div class="rk-role-selector">
          <div
            class="rk-role-card"
            :class="{ selected: local.tipo === 'empleado' }"
            @click="local.tipo = 'empleado'"
          >
            <div class="rk-role-card-icon">
              <q-icon name="badge" />
            </div>
            <div class="rk-role-card-content">
              <h4 class="rk-role-card-title">Empleado</h4>
              <p class="rk-role-card-desc">
                Trabajador de una empresa. Sólo accede a sus propios registros.
              </p>
            </div>
            <div class="rk-role-check">
              <q-icon name="check" />
            </div>
          </div>

          <div
            class="rk-role-card"
            :class="{ selected: isAdminRrhh }"
            @click="local.tipo = 'admin_rrhh'"
          >
            <div class="rk-role-card-icon">
              <q-icon name="admin_panel_settings" />
            </div>
            <div class="rk-role-card-content">
              <h4 class="rk-role-card-title">Admin RR.HH.</h4>
              <p class="rk-role-card-desc">
                Administra una o más empresas. Puede gestionar empleados y nómina.
              </p>
            </div>
            <div class="rk-role-check">
              <q-icon name="check" />
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Sección 2: Vinculación ===== -->
      <div class="rk-section" data-step="2">
        <div class="rk-section-header">
          <div class="rk-section-icon">
            <q-icon name="business" />
          </div>
          <div class="rk-section-title-wrap">
            <h4 class="rk-section-title">Vinculación empresarial</h4>
            <p class="rk-section-desc">Asigna empresa y horario laboral</p>
          </div>
        </div>

        <div class="rk-section-grid rk-single-col">
          <!-- Empleado / DT / Superadmin: una sola empresa -->
          <div v-if="!isAdminRrhh" class="rk-input-wrap">
            <CompanySearchSelect
              v-model="local.empresa"
              :rules="[req]"
              label="Empresa"
              @created="onCompanyCreated"
              class="rk-input"
            />
          </div>

          <!-- admin_rrhh: múltiples empresas (multi-select) -->
          <div v-else class="rk-input-wrap">
            <q-select
              v-model="local.empresas"
              :options="empresaOptions"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              multiple
              use-chips
              dense
              outlined
              label="Empresas administradas"
              hint="El administrador podrá cambiar entre ellas. La primera será la empresa activa por defecto."
              :rules="[arrayReq]"
              class="rk-input"
            >
              <template #prepend>
                <q-icon name="business" class="rk-input-icon" />
              </template>
            </q-select>
          </div>

          <div v-if="local.tipo === 'empleado'" class="rk-input-wrap">
            <SchedulePicker
              v-model="local.workScheduleChoice"
              :company-id="local.empresa"
              :company="companyObj"
              :disable="!local.empresa"
              @created="onScheduleCreated"
              class="rk-input"
            />
          </div>
        </div>
      </div>

      <!-- ===== Sección 4: Acceso y Seguridad ===== -->
      <div class="rk-section" data-step="3">
        <div class="rk-section-header">
          <div class="rk-section-icon">
            <q-icon name="lock" />
          </div>
          <div class="rk-section-title-wrap">
            <h4 class="rk-section-title">Acceso y seguridad</h4>
            <p class="rk-section-desc">
              {{ requirePassword ? 'Configura las credenciales de acceso' : 'Actualiza la contraseña solo si necesitas cambiarla' }}
            </p>
          </div>
        </div>

        <div class="rk-section-grid">
          <div class="rk-input-wrap rk-password-wrap">
            <q-input
              v-model="local.password"
              :type="showPass ? 'text' : 'password'"
              label="Contraseña"
              dense
              outlined
              clearable
              :rules="passwordRules"
              autocomplete="new-password"
              class="rk-input"
            >
              <template #prepend>
                <q-icon name="key" class="rk-input-icon" />
              </template>
              <template #append>
                <div class="rk-password-actions">
                  <q-btn 
                    flat 
                    dense 
                    round 
                    size="sm"
                    :icon="showPass ? 'visibility_off' : 'visibility'" 
                    @click="togglePass"
                    class="rk-action-btn"
                  >
                    <q-tooltip>{{ showPass ? 'Ocultar' : 'Mostrar' }}</q-tooltip>
                  </q-btn>
                  <q-btn 
                    flat 
                    dense 
                    round 
                    size="sm"
                    icon="auto_fix_high" 
                    @click="generatePassword"
                    class="rk-action-btn"
                  >
                    <q-tooltip>Generar automáticamente</q-tooltip>
                  </q-btn>
                  <q-btn 
                    flat 
                    dense 
                    round 
                    size="sm"
                    icon="content_copy" 
                    @click="copyPassword"
                    class="rk-action-btn"
                    :disable="!local.password"
                  >
                    <q-tooltip>Copiar contraseña</q-tooltip>
                  </q-btn>
                </div>
              </template>
            </q-input>
            
            <!-- Password Strength Indicator -->
            <div class="rk-password-strength">
              <div class="rk-strength-bar">
                <div 
                  class="rk-strength-fill" 
                  :class="`rk-strength-${passStrengthClass}`"
                  :style="{ width: (passScore * 100) + '%' }"
                ></div>
              </div>
              <div class="rk-strength-label">
                <span>Fortaleza:</span>
                <strong :class="`rk-strength-${passStrengthClass}`">{{ passLabel }}</strong>
              </div>
            </div>
          </div>

          <div class="rk-input-wrap">
            <q-input
              v-model="local.passwordConfirm"
              :type="showPass ? 'text' : 'password'"
              label="Confirmar contraseña"
              dense
              outlined
              clearable
              :rules="confirmPasswordRules"
              autocomplete="new-password"
              class="rk-input"
            >
              <template #prepend>
                <q-icon name="lock_reset" class="rk-input-icon" />
              </template>
              <template #append>
                <q-btn 
                  flat 
                  dense 
                  round 
                  size="sm"
                  :icon="showPass ? 'visibility_off' : 'visibility'" 
                  @click="togglePass"
                  class="rk-action-btn"
                />
              </template>
            </q-input>
            
            <!-- Match Indicator -->
            <div v-if="local.password && local.passwordConfirm" class="rk-match-indicator">
              <q-icon 
                :name="passwordsMatch ? 'check_circle' : 'cancel'" 
                :class="passwordsMatch ? 'text-positive' : 'text-negative'"
              />
              <span>{{ passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden' }}</span>
            </div>
          </div>
        </div>

        <div v-if="local.password && !passwordsMatch" class="rk-warning-banner">
          <div class="rk-warning-icon">
            <q-icon name="warning" />
          </div>
          <p>Las contraseñas no coinciden. Por favor, verifica ambos campos.</p>
        </div>
      </div>

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
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const canPickRole = computed(() => String(authStore.user?.role || '') === 'superadmin')

/* Props / Emits */
const props = defineProps({
  modelValue: { type: Object, required: true },
  empresasRaw: { type: Array, default: () => [] },
  requirePassword: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'tipo-change'])

/* Estado base */
const EMPTY = () => ({
  firstName: '',
  lastName: '',
  email: '',
  tipo: 'empleado',
  empresa: null,
  empresas: [],
  rut: '',
  horarioLaboralId: null,
  workScheduleChoice: { mode: 'fixed', scheduleId: null, oncall: null },
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
  x.empresas  = Array.isArray(s.empresas) ? s.empresas.slice() : []
  x.rut       = s.rut       ?? ''
  x.horarioLaboralId = s.horarioLaboralId ?? null
  x.workScheduleChoice = {
    mode: w.mode ?? 'fixed',
    scheduleId: w.scheduleId ?? null,
    oncall: w.oncall
      ? {
          name: w.oncall.name ?? '',
          defaultDays: Array.isArray(w.oncall.defaultDays) ? w.oncall.defaultDays.slice() : [],
          allowAnyDay: w.oncall.allowAnyDay !== false,
          minNoticeHours: Number.isFinite(+w.oncall.minNoticeHours) ? +w.oncall.minNoticeHours : 0,
        }
      : null,
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


let syncing = false

/* Reglas RUT dinámicas */
const rutRule = (value) => {
  if (!value) return true
  try { return validarRUT(value) || 'RUT inválido' } catch { return true }
}
const rutRules = computed(() => [req, rutRule])

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

/* Emitir cambios de tipo */
watch(
  () => local.tipo,
  (nv, ov) => {
    if (syncing) return
    if (nv === ov) return
    emit('tipo-change', nv)

  }
)

/* Reset de horario cuando cambia empresa */
watch(
  () => local.empresa,
  (nv, ov) => {
    if (syncing) return
    if (nv !== ov) {
      local.workScheduleChoice = { mode: 'fixed', scheduleId: null, oncall: null }
    }
  }
)

/* Utilidades */
const matchPasswordRule = (v) => {
  if (!props.requirePassword && !local.password && !v) return true
  return v === local.password || 'Las contraseñas no coinciden'
}
const passwordsMatch = computed(() => !local.password || local.passwordConfirm === local.password)
const passwordRules = computed(() => props.requirePassword ? [passMin] : [(v) => !v || passMin(v)])
const confirmPasswordRules = computed(() =>
  props.requirePassword
    ? [matchPasswordRule]
    : [(v) => (!local.password && !v) || matchPasswordRule(v)]
)

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

/* Password Strength */
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
  if (v >= 0.9) return 'Muy fuerte'
  if (v >= 0.7) return 'Fuerte'
  if (v >= 0.5) return 'Media'
  if (v > 0) return 'Débil'
  return 'Sin definir'
})

const passStrengthClass = computed(() => {
  const v = passScore.value
  if (v >= 0.9) return 'excellent'
  if (v >= 0.7) return 'good'
  if (v >= 0.5) return 'medium'
  if (v > 0) return 'weak'
  return 'none'
})

/* admin_rrhh con multi-empresa */
const isAdminRrhh = computed(() => ['admin_rrhh', 'admin', 'rrhh', 'empresa'].includes(String(local.tipo)))

const empresaOptions = computed(() =>
  (props.empresasRaw || []).map(e => ({ id: e.id || e._id, name: e.name }))
)

const arrayReq = (v) => (Array.isArray(v) && v.length > 0) || 'Selecciona al menos una empresa'

// Mantén sincronizado empresa ↔ empresas[] para admin_rrhh:
// la primera del array es la "empresa activa".
watch(
  () => local.empresas,
  (arr) => {
    if (!isAdminRrhh.value) return
    const first = Array.isArray(arr) && arr.length ? arr[0] : null
    if (first !== local.empresa) local.empresa = first
  },
  { deep: true }
)

// Cuando cambia el rol, limpia lo irrelevante
watch(
  () => local.tipo,
  (t) => {
    if (['admin_rrhh', 'admin', 'rrhh', 'empresa'].includes(String(t))) {
      if (local.empresa && !local.empresas.includes(local.empresa)) {
        local.empresas = [local.empresa, ...local.empresas]
      }
    } else {
      // empleado / dt → una sola empresa
      if (local.empresas.length > 0 && !local.empresa) {
        local.empresa = local.empresas[0]
      }
      local.empresas = local.empresa ? [local.empresa] : []
    }
  }
)

/* Datos de empresa */
const companyObj = computed(() => {
  const id = String(local.empresa || '')
  if (!id) return null
  const arr = props.empresasRaw || []
  return arr.find(e => String(e.id || e._id) === id) || null
})

/* Eventos hijos */
function onCompanyCreated (company) { if (company?._id) local.empresa = company._id }
function onScheduleCreated () { /* opcional */ }
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   TOKENS — heredan visualmente del modal padre
══════════════════════════════════════════════════ */
.rk-user-card {
  --rk-bg:           #ffffff;
  --rk-surface:      #f7f8fc;
  --rk-surface-2:    #eef0f6;
  --rk-border:       rgba(15, 17, 23, 0.08);
  --rk-border-2:     rgba(15, 17, 23, 0.14);
  --rk-text:         #0f1117;
  --rk-text-2:       #5a6482;
  --rk-text-3:       #9aa1b9;
  --rk-accent:       #6366f1;
  --rk-accent-soft:  rgba(99, 102, 241, 0.10);
  --rk-success:      #16a34a;
  --rk-success-soft: rgba(22, 163, 74, 0.12);
  --rk-warn:         #d97706;
  --rk-warn-soft:    rgba(217, 119, 6, 0.12);
  --rk-err:          #dc2626;
  --rk-err-soft:     rgba(220, 38, 38, 0.10);
}

.body--dark .rk-user-card {
  --rk-bg:           #141720;
  --rk-surface:      #1a1e2a;
  --rk-surface-2:    #232838;
  --rk-border:       rgba(255, 255, 255, 0.08);
  --rk-border-2:     rgba(255, 255, 255, 0.16);
  --rk-text:         #e8eaf2;
  --rk-text-2:       #8b92ad;
  --rk-text-3:       #555d78;
  --rk-accent-soft:  rgba(99, 102, 241, 0.18);
  --rk-success-soft: rgba(22, 163, 74, 0.18);
  --rk-warn-soft:    rgba(217, 119, 6, 0.20);
  --rk-err-soft:     rgba(220, 38, 38, 0.18);
}

/* Container — sin padding propio: el panel del modal ya lo da */
.rk-user-card {
  position: relative;
  background: transparent;
  color: var(--rk-text);
}

/* ══════════════════════════════════════════════════
   FORM SECTIONS — separadas por aire, sin cards anidadas
══════════════════════════════════════════════════ */
.rk-form-sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rk-section {
  background: transparent;
}
.rk-section + .rk-section {
  padding-top: 18px;
  border-top: 1px dashed var(--rk-border);
}

/* Section header */
.rk-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.rk-section-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
  border-radius: 8px;
  flex-shrink: 0;
}
.rk-section-icon .q-icon { font-size: 15px; }

.rk-section-title-wrap { min-width: 0; }
.rk-section-title {
  font-size: 13px;
  font-weight: 700;
  margin: 0;
  color: var(--rk-text);
  letter-spacing: -0.1px;
  line-height: 1.25;
}
.rk-section-desc {
  font-size: 11.5px;
  color: var(--rk-text-2);
  margin: 1px 0 0 0;
  font-weight: 500;
}

/* Section grid */
.rk-section-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 12px;
}
.rk-single-col {
  grid-template-columns: 1fr;
}
.rk-input-wrap {
  position: relative;
}

/* Inputs — usan los estilos heredados del modal padre.
   Aquí solo afinamos color de iconos prepend. */
.rk-input-icon {
  color: var(--rk-text-3) !important;
}
.rk-input :deep(.q-field--focused .q-field__prepend .rk-input-icon) {
  color: var(--rk-accent) !important;
}

.rk-info-btn,
.rk-action-btn {
  color: var(--rk-text-3);
  transition: color 0.15s, background 0.15s;
}
.rk-info-btn:hover,
.rk-action-btn:hover {
  color: var(--rk-accent);
  background: var(--rk-accent-soft);
}

/* ══════════════════════════════════════════════════
   ROLE SELECTOR — tarjetas tipo "radio card" sobrias
══════════════════════════════════════════════════ */
.rk-role-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.rk-role-card {
  position: relative;
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.rk-role-card:hover {
  border-color: var(--rk-border-2);
  background: var(--rk-surface-2);
}
.rk-role-card.selected {
  border-color: var(--rk-accent);
  background: var(--rk-accent-soft);
}

.rk-role-card-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-bg);
  color: var(--rk-text-2);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
  flex-shrink: 0;
}
.rk-role-card.selected .rk-role-card-icon {
  background: var(--rk-accent);
  color: #fff;
  border-color: var(--rk-accent);
}
.rk-role-card-icon .q-icon { font-size: 17px; }

.rk-role-card-content { flex: 1; min-width: 0; padding-right: 22px; }
.rk-role-card-title {
  font-size: 12.5px;
  font-weight: 700;
  margin: 0 0 2px 0;
  color: var(--rk-text);
  line-height: 1.25;
}
.rk-role-card-desc {
  font-size: 11px;
  color: var(--rk-text-2);
  margin: 0;
  line-height: 1.45;
}

.rk-role-check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-accent);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.15s, transform 0.15s;
}
.rk-role-card.selected .rk-role-check {
  opacity: 1;
  transform: scale(1);
}
.rk-role-check .q-icon {
  font-size: 12px;
  color: #fff;
}

/* ══════════════════════════════════════════════════
   PASSWORD — fortaleza + match
══════════════════════════════════════════════════ */
.rk-password-wrap {
  grid-column: 1 / -1;
}

.rk-password-actions {
  display: flex;
  gap: 2px;
}

.rk-password-strength {
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
}

.rk-strength-bar {
  height: 4px;
  background: var(--rk-surface-2);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 6px;
}

.rk-strength-fill {
  height: 100%;
  transition: width 0.3s, background 0.3s;
  border-radius: 999px;
}
.rk-strength-fill.rk-strength-weak      { background: var(--rk-err); }
.rk-strength-fill.rk-strength-medium    { background: var(--rk-warn); }
.rk-strength-fill.rk-strength-good      { background: var(--rk-accent); }
.rk-strength-fill.rk-strength-excellent { background: var(--rk-success); }

.rk-strength-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}
.rk-strength-label span {
  color: var(--rk-text-3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.rk-strength-label strong { font-weight: 700; }
.rk-strength-label strong.rk-strength-weak      { color: var(--rk-err); }
.rk-strength-label strong.rk-strength-medium    { color: var(--rk-warn); }
.rk-strength-label strong.rk-strength-good      { color: var(--rk-accent); }
.rk-strength-label strong.rk-strength-excellent { color: var(--rk-success); }

.rk-match-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 6px 10px;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--rk-text-2);
}

/* ══════════════════════════════════════════════════
   WARNING BANNER
══════════════════════════════════════════════════ */
.rk-warning-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--rk-warn-soft);
  border: 1px solid rgba(217, 119, 6, 0.28);
  border-left: 3px solid var(--rk-warn);
  border-radius: 10px;
  margin-top: 10px;
  grid-column: 1 / -1;
}
.rk-warning-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(217, 119, 6, 0.18);
  color: var(--rk-warn);
  border-radius: 6px;
  flex-shrink: 0;
}
.rk-warning-icon .q-icon { font-size: 14px; }
.rk-warning-banner p {
  font-size: 11.5px;
  color: var(--rk-warn);
  margin: 0;
  font-weight: 600;
}

/* ══════════════════════════════════════════════════
   TOOLTIP
══════════════════════════════════════════════════ */
.rk-tooltip {
  background: var(--rk-text);
  color: var(--rk-bg);
  font-size: 11.5px;
  padding: 6px 10px;
  border-radius: 6px;
}

/* ══════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════ */
@media (max-width: 1023px) {
  .rk-section-grid { grid-template-columns: 1fr; }
  .rk-role-selector { grid-template-columns: 1fr; }
}

@media (max-width: 599px) {
  .rk-password-actions { flex-wrap: wrap; }
}
</style>
