<template>
  <div class="rk-user-card">
    <!-- Background Effects -->
    <div class="rk-card-bg">
      <div class="rk-grid-subtle"></div>
      <div class="rk-glow-orb"></div>
    </div>

    <!-- Encabezado Premium -->
    <div class="rk-user-header">
      <div class="rk-header-left">
        <div class="rk-header-icon">
          <q-icon name="person_add" />
          <div class="rk-icon-pulse"></div>
        </div>
        <div class="rk-header-content">
          <h3 class="rk-header-title">Datos del usuario</h3>
          <p class="rk-header-subtitle">Información completa del perfil</p>
        </div>
      </div>
      <div class="rk-role-badge" :class="`rk-role-${local.tipo}`">
        <q-icon :name="local.tipo === 'admin' ? 'admin_panel_settings' : 'badge'" />
        <span>{{ local.tipo === 'admin' ? 'Administrador' : 'Empleado' }}</span>
      </div>
    </div>

    <!-- Banner de Ayuda Mejorado -->
    <div class="rk-help-banner">
      <div class="rk-help-icon">
        <q-icon name="lightbulb" />
      </div>
      <div class="rk-help-content">
        <p class="rk-help-text">
          Completa los datos requeridos. Puedes generar una contraseña segura automáticamente.
        </p>
      </div>
    </div>

    <!-- Progress Steps -->
    <div class="rk-progress-steps">
      <div 
        v-for="(step, idx) in progressSteps" 
        :key="idx"
        class="rk-step"
        :class="{ 
          'active': currentStep === idx,
          'completed': currentStep > idx 
        }"
      >
        <div class="rk-step-number">
          <q-icon v-if="currentStep > idx" name="check" />
          <span v-else>{{ idx + 1 }}</span>
        </div>
        <span class="rk-step-label">{{ step }}</span>
      </div>
    </div>

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

      <!-- ===== Sección 2: Rol ===== -->
      <div class="rk-section" data-step="1">
        <div class="rk-section-header">
          <div class="rk-section-icon">
            <q-icon name="supervisor_account" />
          </div>
          <div class="rk-section-title-wrap">
            <h4 class="rk-section-title">Rol del usuario</h4>
            <p class="rk-section-desc">Define el tipo de perfil dentro del sistema</p>
          </div>
        </div>

        <div class="rk-role-selector">
          <div
            v-for="role in roleOpts"
            :key="role.value"
            class="rk-role-card"
            :class="{ 'selected': local.tipo === role.value }"
            @click="local.tipo = role.value"
          >
            <div class="rk-role-card-icon">
              <q-icon :name="role.icon" />
            </div>
            <div class="rk-role-card-content">
              <h5 class="rk-role-card-title">{{ role.label }}</h5>
              <p class="rk-role-card-desc">{{ role.desc }}</p>
            </div>
            <div class="rk-role-check">
              <q-icon name="check_circle" />
            </div>
          </div>
        </div>

        <div v-if="local.tipo === 'admin'" class="rk-admin-note">
          <div class="rk-note-icon">
            <q-icon name="verified_user" />
          </div>
          <div class="rk-note-content">
            <strong>Cuenta administrativa</strong>
            <p>Para administradores, el RUT es opcional y no se requiere empresa ni horario.</p>
          </div>
        </div>
      </div>

      <!-- ===== Sección 3: Vinculación (solo empleados) ===== -->
      <div v-if="local.tipo !== 'admin'" class="rk-section" data-step="2">
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
          <div class="rk-input-wrap">
            <CompanySearchSelect
              v-model="local.empresa"
              :rules="[req]"
              label="Empresa"
              @created="onCompanyCreated"
              class="rk-input"
            />
          </div>

          <div v-if="local.tipo === 'empleado'" class="rk-input-wrap">
            <SchedulePicker
              v-model="local.workScheduleChoice"
              :company-id="local.empresa"
              :company="companyObj"
              :disable="!local.empresa"
              @preview="onPreviewSchedule"
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

/* Props / Emits */
const props = defineProps({
  modelValue: { type: Object, required: true },
  empresasRaw: { type: Array, default: () => [] },
  requirePassword: { type: Boolean, default: true }
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
  { 
    label: 'Empleado', 
    value: 'empleado',
    icon: 'badge',
    desc: 'Usuario con acceso limitado a sus datos'
  },
  { 
    label: 'Administrador', 
    value: 'admin',
    icon: 'admin_panel_settings',
    desc: 'Acceso completo a toda la plataforma'
  }
]

const progressSteps = computed(() => {
  const steps = ['Identidad', 'Rol']
  if (local.tipo !== 'admin') {
    steps.push('Vinculación')
  }
  steps.push('Acceso')
  return steps
})

const currentStep = computed(() => {
  if (!local.firstName || !local.lastName || !local.email || !local.rut) return 0
  if (!local.tipo) return 1
  if (local.tipo !== 'admin' && !local.empresa) return 2
  if (props.requirePassword && (!local.password || !local.passwordConfirm)) return local.tipo === 'admin' ? 2 : 3
  return progressSteps.value.length
})

let syncing = false

/* Reglas RUT dinámicas */
const rutRule = (value) => {
  if (!value) return true
  try { return validarRUT(value) || 'RUT inválido' } catch { return true }
}
const rutRules = computed(() =>
  local.tipo === 'empleado'
    ? [req, rutRule]
    : [rutRule]
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

/* Emitir cambios de tipo */
watch(
  () => local.tipo,
  (nv, ov) => {
    if (syncing) return
    if (nv === ov) return
    emit('tipo-change', nv)

    if (nv === 'admin') {
      local.empresa = null
      local.workScheduleChoice = { mode: 'companyDefault', scheduleId: null }
    }
  }
)

/* Reset de horario cuando cambia empresa */
watch(
  () => local.empresa,
  (nv, ov) => {
    if (syncing) return
    if (nv !== ov) {
      local.workScheduleChoice = { mode: 'companyDefault', scheduleId: null }
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

/* Datos de empresa */
const companyObj = computed(() => {
  const id = String(local.empresa || '')
  if (!id) return null
  const arr = props.empresasRaw || []
  return arr.find(e => String(e.id || e._id) === id) || null
})

/* Eventos hijos */
function onCompanyCreated (company) { if (company?._id) local.empresa = company._id }
function onPreviewSchedule (id) { if (id) emit('preview-schedule', id) }
function onScheduleCreated () { /* opcional */ }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

:root {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-accent: #14b8a6;
}

/* Theme Variables */
.rk-user-card {
  /* Light Mode (Default) */
  --card-bg: rgba(255, 255, 255, 0.95);
  --card-border: rgba(6, 182, 212, 0.15);
  --text-primary: rgba(15, 23, 42, 0.95);
  --text-secondary: rgba(15, 23, 42, 0.65);
  --text-muted: rgba(15, 23, 42, 0.5);
  --surface-1: rgba(6, 182, 212, 0.04);
  --surface-2: rgba(6, 182, 212, 0.08);
  --surface-3: rgba(6, 182, 212, 0.12);
  --border-1: rgba(6, 182, 212, 0.12);
  --border-2: rgba(6, 182, 212, 0.2);
  --shadow-color: rgba(6, 182, 212, 0.15);
}

/* Dark Mode */
.body--dark .rk-user-card {
  --card-bg: rgba(10, 14, 20, 0.95);
  --card-border: rgba(6, 182, 212, 0.2);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --surface-1: rgba(6, 182, 212, 0.06);
  --surface-2: rgba(6, 182, 212, 0.1);
  --surface-3: rgba(6, 182, 212, 0.15);
  --border-1: rgba(6, 182, 212, 0.15);
  --border-2: rgba(6, 182, 212, 0.3);
  --shadow-color: rgba(6, 182, 212, 0.2);
}

/* Card Container */
.rk-user-card {
  position: relative;
  border-radius: 24px;
  border: 1.5px solid var(--card-border);
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  padding: 32px;
  overflow: hidden;
  font-family: 'Sora', -apple-system, sans-serif;
  transition: background 0.3s ease, border-color 0.3s ease;
}

/* Background Effects */
.rk-card-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.rk-grid-subtle {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.5;
}

.rk-glow-orb {
  position: absolute;
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, var(--color-primary), transparent 60%);
  filter: blur(80px);
  opacity: 0.08;
}

/* Header */
.rk-user-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.rk-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rk-header-icon {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3);
}

.rk-header-icon .q-icon {
  font-size: 28px;
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

/* Role Badge */
.rk-role-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
}

.rk-role-admin {
  background: rgba(139, 92, 246, 0.12);
  border: 1.5px solid rgba(139, 92, 246, 0.3);
  color: #a78bfa;
}

.body--dark .rk-role-admin {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  color: #c4b5fd;
}

.rk-role-empleado {
  background: rgba(6, 182, 212, 0.12);
  border: 1.5px solid rgba(6, 182, 212, 0.25);
  color: var(--color-primary);
}

.body--dark .rk-role-empleado {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.35);
  color: var(--color-primary-light);
}

.rk-role-badge .q-icon {
  font-size: 18px;
}

/* Help Banner */
.rk-help-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-left: 4px solid var(--color-primary);
  border-radius: 12px;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
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

.rk-help-text {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-weight: 500;
}

/* Progress Steps */
.rk-progress-steps {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  padding: 20px;
  background: var(--surface-1);
  border-radius: 16px;
  position: relative;
  z-index: 1;
  overflow-x: auto;
}

.rk-step {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: fit-content;
}

.rk-step-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: 2px solid var(--border-1);
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.rk-step.active .rk-step-number {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

.rk-step.completed .rk-step-number {
  background: rgba(34, 197, 94, 0.15);
  border-color: #22c55e;
  color: #22c55e;
}

.body--dark .rk-step.completed .rk-step-number {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.rk-step-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-muted);
  transition: color 0.3s ease;
}

.rk-step.active .rk-step-label,
.rk-step.completed .rk-step-label {
  color: var(--text-primary);
}

/* Form Sections */
.rk-form-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
  position: relative;
  z-index: 1;
}

/* Section */
.rk-section {
  padding: 28px;
  background: var(--surface-1);
  border: 1.5px solid var(--border-1);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.rk-section:hover {
  border-color: var(--border-2);
  background: var(--surface-2);
}

.rk-section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.rk-section-icon {
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

.rk-section-icon .q-icon {
  font-size: 24px;
  color: #fff;
}

.rk-section-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.rk-section-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Section Grid */
.rk-section-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.rk-single-col {
  grid-template-columns: 1fr;
}

.rk-input-wrap {
  position: relative;
}

/* Input Styling */
.rk-input :deep(.q-field__control) {
  background: var(--surface-1);
  border-color: var(--border-1);
  transition: all 0.3s ease;
}

.rk-input :deep(.q-field__control):hover {
  background: var(--surface-2);
  border-color: var(--border-2);
}

.rk-input :deep(.q-field--focused .q-field__control) {
  background: var(--surface-2);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
}

.rk-input :deep(.q-field__label) {
  color: var(--text-secondary);
}

.rk-input :deep(.q-field__native) {
  color: var(--text-primary);
}

.rk-input-icon {
  color: var(--color-primary-light) !important;
}

.rk-info-btn,
.rk-action-btn {
  color: var(--color-primary);
  transition: all 0.3s ease;
}

.body--dark .rk-info-btn,
.body--dark .rk-action-btn {
  color: var(--color-primary-light);
}

.rk-info-btn:hover,
.rk-action-btn:hover {
  color: var(--color-primary-light);
  background: var(--surface-2);
}

/* Role Selector */
.rk-role-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.rk-role-card {
  position: relative;
  padding: 24px;
  background: var(--surface-1);
  border: 2px solid var(--border-1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.rk-role-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rk-role-card:hover {
  border-color: var(--border-2);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--shadow-color);
}

.rk-role-card.selected {
  border-color: var(--color-primary);
  background: var(--surface-2);
  box-shadow: 0 8px 24px var(--shadow-color);
}

.rk-role-card.selected::before {
  opacity: 0.05;
}

.rk-role-card-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
  position: relative;
  z-index: 1;
}

.rk-role-card-icon .q-icon {
  font-size: 28px;
  color: #fff;
}

.rk-role-card-content {
  position: relative;
  z-index: 1;
}

.rk-role-card-title {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.rk-role-card-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.rk-role-check {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(34, 197, 94, 0.15);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.body--dark .rk-role-check {
  background: rgba(34, 197, 94, 0.2);
}

.rk-role-card.selected .rk-role-check {
  opacity: 1;
  transform: scale(1);
}

.rk-role-check .q-icon {
  font-size: 18px;
  color: #22c55e;
}

.body--dark .rk-role-check .q-icon {
  color: #4ade80;
}

/* Admin Note */
.rk-admin-note {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-left: 4px solid #8b5cf6;
  border-radius: 12px;
  margin-top: 20px;
}

.body--dark .rk-admin-note {
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.3);
}

.rk-note-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 8px;
  flex-shrink: 0;
}

.body--dark .rk-note-icon {
  background: rgba(139, 92, 246, 0.2);
}

.rk-note-icon .q-icon {
  font-size: 18px;
  color: #a78bfa;
}

.body--dark .rk-note-icon .q-icon {
  color: #c4b5fd;
}

.rk-note-content strong {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: #8b5cf6;
}

.body--dark .rk-note-content strong {
  color: #a78bfa;
}

.rk-note-content p {
  font-size: 0.88rem;
  color: rgba(139, 92, 246, 0.8);
  margin: 0;
  line-height: 1.5;
}

.body--dark .rk-note-content p {
  color: rgba(167, 139, 250, 0.85);
}

/* Password Strength */
.rk-password-wrap {
  grid-column: 1 / -1;
}

.rk-password-actions {
  display: flex;
  gap: 4px;
}

.rk-password-strength {
  margin-top: 12px;
  padding: 12px;
  background: var(--surface-1);
  border-radius: 10px;
}

.rk-strength-bar {
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.rk-strength-fill {
  height: 100%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 3px;
}

.rk-strength-weak { background: linear-gradient(90deg, #ef4444, #f87171); }
.rk-strength-medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.rk-strength-good { background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); }
.rk-strength-excellent { background: linear-gradient(90deg, #22c55e, #4ade80); }

.rk-strength-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.rk-strength-label span {
  color: var(--text-secondary);
  font-weight: 600;
}

.rk-strength-label strong {
  font-weight: 800;
  letter-spacing: 0.3px;
}

.rk-strength-weak strong { color: #ef4444; }
.rk-strength-medium strong { color: #f59e0b; }
.rk-strength-good strong { color: var(--color-primary); }
.body--dark .rk-strength-good strong { color: var(--color-primary-light); }
.rk-strength-excellent strong { color: #22c55e; }
.body--dark .rk-strength-excellent strong { color: #4ade80; }

/* Match Indicator */
.rk-match-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--surface-1);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

/* Warning Banner */
.rk-warning-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  margin-top: 16px;
}

.body--dark .rk-warning-banner {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);
}

.rk-warning-icon {
  width: 28px;
  height: 28px;
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
  font-size: 16px;
  color: #f59e0b;
}

.body--dark .rk-warning-icon .q-icon {
  color: #fbbf24;
}

.rk-warning-banner p {
  font-size: 0.88rem;
  color: #d97706;
  margin: 0;
  font-weight: 600;
}

.body--dark .rk-warning-banner p {
  color: #fbbf24;
}

/* Tooltip */
.rk-tooltip {
  background: rgba(6, 182, 212, 0.95);
  backdrop-filter: blur(10px);
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 8px;
}

/* Responsive */
@media (max-width: 1023px) {
  .rk-user-card {
    padding: 24px;
  }

  .rk-section-grid {
    grid-template-columns: 1fr;
  }

  .rk-role-selector {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .rk-user-card {
    padding: 20px;
    border-radius: 20px;
  }

  .rk-user-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .rk-header-icon {
    width: 48px;
    height: 48px;
  }

  .rk-header-icon .q-icon {
    font-size: 24px;
  }

  .rk-header-title {
    font-size: 1.3rem;
  }

  .rk-progress-steps {
    flex-direction: column;
    align-items: stretch;
  }

  .rk-step {
    padding: 12px;
    background: rgba(6, 182, 212, 0.04);
    border-radius: 10px;
  }

  .rk-section {
    padding: 20px;
  }

  .rk-section-icon {
    width: 40px;
    height: 40px;
  }

  .rk-section-icon .q-icon {
    font-size: 20px;
  }

  .rk-role-card-icon {
    width: 48px;
    height: 48px;
  }

  .rk-role-card-icon .q-icon {
    font-size: 24px;
  }
}

@media (max-width: 599px) {
  .rk-user-card {
    padding: 16px;
  }

  .rk-section {
    padding: 16px;
  }

  .rk-password-actions {
    flex-wrap: wrap;
  }
}
</style>
