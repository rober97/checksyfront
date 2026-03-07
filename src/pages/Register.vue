<template>
  <q-page
    class="rk-register"
    :class="isDark ? 'rk-bg--dark' : 'rk-bg--light'"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Fondo interactivo -->
    <div class="rk-bg-layer">
      <canvas ref="particlesRef" class="rk-canvas" />
      <div class="rk-spotlight" :style="spotStyle" aria-hidden="true"></div>
      <div class="rk-grid-overlay" aria-hidden="true"></div>
      <div class="rk-gradient-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
    </div>

    <div class="rk-center">
      <q-card class="register-card" flat>
        <div class="register-container">

          <!-- ====== LEFT SIDE ====== -->
          <div class="register-left">
            <div class="brand-section">
              <div class="logo-container">
                <div class="logo-outer-ring">
                  <div class="logo-inner-ring">
                    <div class="logo-core">
                      <q-icon name="bolt" size="32px" />
                    </div>
                  </div>
                </div>
              </div>
              <h1 class="brand-title">Recksy</h1>
              <p class="brand-tagline">Plataforma de próxima generación</p>
            </div>

            <div class="steps-sidebar">
              <div
                v-for="(step, idx) in steps"
                :key="idx"
                class="sidebar-step"
                :class="{
                  'sidebar-step--active': currentStep === idx,
                  'sidebar-step--done': currentStep > idx
                }"
              >
                <div class="sidebar-step-icon">
                  <q-icon v-if="currentStep > idx" name="check" size="18px" />
                  <q-icon v-else :name="step.icon" size="18px" />
                </div>
                <div class="sidebar-step-info">
                  <div class="sidebar-step-name">{{ step.name }}</div>
                  <div class="sidebar-step-desc">{{ step.desc }}</div>
                </div>
                <div class="sidebar-step-number">{{ idx + 1 }}</div>
              </div>
            </div>

            <div class="stats-row">
              <div class="stat-item">
                <div class="stat-value">10K+</div>
                <div class="stat-label">Usuarios</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">99.9%</div>
                <div class="stat-label">Uptime</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">24/7</div>
                <div class="stat-label">Soporte</div>
              </div>
            </div>
          </div>

          <!-- ====== RIGHT SIDE ====== -->
          <div class="register-right">

            <!-- Barra de progreso -->
            <div class="top-progress">
              <div class="top-progress-bar">
                <div class="top-progress-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
              <span class="top-progress-label">Paso {{ currentStep + 1 }} de {{ steps.length }}</span>
            </div>

            <!-- Encabezado del paso -->
            <div class="form-header">
              <div class="step-badge">
                <q-icon :name="steps[currentStep].icon" size="18px" />
                <span>{{ steps[currentStep].name }}</span>
              </div>
              <h2 class="form-title">{{ steps[currentStep].title }}</h2>
              <p class="form-subtitle">{{ steps[currentStep].subtitle }}</p>
            </div>

            <!-- ===== PASO 1: Datos personales ===== -->
            <transition name="step-slide" mode="out-in">
              <div v-if="currentStep === 0" key="step0" class="step-body">

                <div class="input-row">
                  <div class="input-col">
                    <div
                      class="floating-input"
                      :class="{
                        filled: !!form.firstName,
                        error: !!errors.firstName,
                        valid: !!form.firstName.trim() && !errors.firstName
                      }"
                    >
                      <q-input
                        v-model="form.firstName"
                        outlined
                        dense
                        hide-bottom-space
                        @blur="validateField('firstName')"
                      >
                        <template #prepend>
                          <div class="input-icon">
                            <q-icon name="person" size="20px" />
                          </div>
                        </template>
                        <template #append>
                          <div
                            v-if="form.firstName.trim() && !errors.firstName"
                            class="input-status success"
                          >
                            <q-icon name="check_circle" size="18px" />
                          </div>
                        </template>
                      </q-input>
                      <label class="floating-label">Nombre *</label>
                    </div>
                  </div>

                  <div class="input-col">
                    <div class="floating-input" :class="{ filled: !!form.lastName }">
                      <q-input v-model="form.lastName" outlined dense hide-bottom-space>
                        <template #prepend>
                          <div class="input-icon">
                            <q-icon name="badge" size="20px" />
                          </div>
                        </template>
                      </q-input>
                      <label class="floating-label">Apellido</label>
                    </div>
                  </div>
                </div>

                <div
                  class="floating-input"
                  :class="{
                    filled: !!form.email,
                    error: !!errors.email,
                    valid: emailValid
                  }"
                >
                  <q-input
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    outlined
                    dense
                    hide-bottom-space
                    @blur="validateField('email')"
                    @update:model-value="onEmailInput"
                  >
                    <template #prepend>
                      <div class="input-icon">
                        <q-icon name="mail" size="20px" />
                      </div>
                    </template>
                    <template #append>
                      <q-spinner-dots v-if="checkingEmail" color="primary" size="18px" />
                      <div v-else-if="emailValid" class="input-status success">
                        <q-icon name="check_circle" size="18px" />
                      </div>
                    </template>
                  </q-input>
                  <label class="floating-label">Correo electrónico *</label>
                </div>

                <transition name="fade-up">
                  <div v-if="errors.email" class="field-hint field-hint--error">
                    <q-icon name="error_outline" size="16px" />
                    {{ errors.email }}
                  </div>
                </transition>
                <transition name="fade-up">
                  <div v-if="!errors.email && emailValid" class="field-hint field-hint--success">
                    <q-icon name="check_circle" size="16px" />
                    Correo disponible y válido
                  </div>
                </transition>

                <transition name="slide-down">
                  <div v-if="stepAttempted[0] && !isStepValid(0)" class="validation-summary">
                    <q-icon name="info" size="18px" />
                    <div>
                      <div class="validation-summary-title">Para continuar necesitas:</div>
                      <ul>
                        <li v-if="!form.firstName.trim()">✗ Ingresar tu nombre</li>
                        <li v-if="!form.email.trim() || !!errors.email">✗ Un correo electrónico válido</li>
                        <li v-if="form.email && !errors.email && !emailValid && !checkingEmail">
                          ✗ Esperar la verificación del correo
                        </li>
                      </ul>
                    </div>
                  </div>
                </transition>

              </div>
            </transition>

            <!-- ===== PASO 2: Contraseña ===== -->
            <transition name="step-slide" mode="out-in">
              <div v-if="currentStep === 1" key="step1" class="step-body">

                <div
                  class="floating-input"
                  :class="{
                    filled: !!form.password,
                    error: !!errors.password,
                    valid: !!form.password && pwdStrength.level >= 3
                  }"
                >
                  <q-input
                    v-model="form.password"
                    :type="showPwd ? 'text' : 'password'"
                    autocomplete="new-password"
                    outlined
                    dense
                    hide-bottom-space
                    @blur="validateField('password')"
                    @update:model-value="onPasswordInput"
                  >
                    <template #prepend>
                      <div class="input-icon">
                        <q-icon name="lock" size="20px" />
                      </div>
                    </template>
                    <template #append>
                      <q-btn
                        flat dense round
                        :icon="showPwd ? 'visibility_off' : 'visibility'"
                        color="grey-6"
                        size="sm"
                        @click="showPwd = !showPwd"
                      />
                      <q-btn flat dense round icon="auto_awesome" color="grey-6" size="sm" @click="genPwd">
                        <q-tooltip anchor="top middle" self="bottom middle">Generar contraseña segura</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                  <label class="floating-label">Contraseña *</label>
                </div>

                <transition name="expand">
                  <div v-if="form.password" class="password-meter">
                    <div class="meter-header">
                      <span class="meter-text">Fortaleza</span>
                      <span class="meter-label" :style="{ color: pwdStrength.color }">{{ pwdStrength.label }}</span>
                    </div>
                    <div class="meter-bars">
                      <div
                        v-for="i in 4"
                        :key="i"
                        class="meter-bar"
                        :class="{ active: i <= pwdStrength.level }"
                        :data-level="pwdStrength.level"
                      ></div>
                    </div>
                    <div class="pwd-requirements">
                      <div class="req" :class="{ met: form.password.length >= 8 }">
                        <q-icon
                          :name="form.password.length >= 8 ? 'check_circle' : 'radio_button_unchecked'"
                          size="14px"
                        />
                        Mínimo 8 caracteres
                      </div>
                      <div class="req" :class="{ met: /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) }">
                        <q-icon
                          :name="/[A-Z]/.test(form.password) && /[a-z]/.test(form.password) ? 'check_circle' : 'radio_button_unchecked'"
                          size="14px"
                        />
                        Mayúsculas y minúsculas
                      </div>
                      <div class="req" :class="{ met: /\d/.test(form.password) }">
                        <q-icon
                          :name="/\d/.test(form.password) ? 'check_circle' : 'radio_button_unchecked'"
                          size="14px"
                        />
                        Al menos un número
                      </div>
                      <div class="req" :class="{ met: /[^A-Za-z0-9]/.test(form.password) }">
                        <q-icon
                          :name="/[^A-Za-z0-9]/.test(form.password) ? 'check_circle' : 'radio_button_unchecked'"
                          size="14px"
                        />
                        Un carácter especial
                      </div>
                    </div>
                  </div>
                </transition>

                <div
                  class="floating-input"
                  :class="{
                    filled: !!form.passwordConfirm,
                    error: !!errors.passwordConfirm,
                    valid: passwordsMatch && !!form.passwordConfirm
                  }"
                >
                  <q-input
                    v-model="form.passwordConfirm"
                    :type="showPwd ? 'text' : 'password'"
                    autocomplete="new-password"
                    outlined
                    dense
                    hide-bottom-space
                    @blur="validateField('passwordConfirm')"
                    @update:model-value="onConfirmInput"
                  >
                    <template #prepend>
                      <div class="input-icon">
                        <q-icon name="lock_clock" size="20px" />
                      </div>
                    </template>
                    <template #append>
                      <div v-if="passwordsMatch && form.passwordConfirm" class="input-status success">
                        <q-icon name="check_circle" size="18px" />
                      </div>
                    </template>
                  </q-input>
                  <label class="floating-label">Confirmar contraseña *</label>
                </div>

                <transition name="fade-up">
                  <div v-if="passwordsMatch && form.passwordConfirm" class="field-hint field-hint--success">
                    <q-icon name="check_circle" size="16px" />
                    Las contraseñas coinciden
                  </div>
                </transition>
                <transition name="fade-up">
                  <div v-if="form.passwordConfirm && !passwordsMatch" class="field-hint field-hint--error">
                    <q-icon name="error_outline" size="16px" />
                    Las contraseñas no coinciden
                  </div>
                </transition>

                <transition name="slide-down">
                  <div v-if="stepAttempted[1] && !isStepValid(1)" class="validation-summary">
                    <q-icon name="info" size="18px" />
                    <div>
                      <div class="validation-summary-title">Para continuar necesitas:</div>
                      <ul>
                        <li v-if="!form.password || form.password.length < 8">✗ Contraseña de al menos 8 caracteres</li>
                        <li v-if="form.password && form.password.length >= 8 && pwdStrength.level < 2">✗ Una contraseña más segura</li>
                        <li v-if="!passwordsMatch">✗ Confirmar tu contraseña correctamente</li>
                      </ul>
                    </div>
                  </div>
                </transition>

              </div>
            </transition>

            <!-- ===== PASO 3: Confirmación ===== -->
            <transition name="step-slide" mode="out-in">
              <div v-if="currentStep === 2" key="step2" class="step-body">

                <div class="summary-card">
                  <div class="summary-title">Resumen de tu cuenta</div>
                  <div class="summary-rows">
                    <div class="summary-row">
                      <div class="summary-key">
                        <q-icon name="person" size="16px" />
                        Nombre
                      </div>
                      <div class="summary-val">{{ form.firstName }} {{ form.lastName }}</div>
                    </div>
                    <div class="summary-row">
                      <div class="summary-key">
                        <q-icon name="mail" size="16px" />
                        Correo
                      </div>
                      <div class="summary-val">{{ form.email }}</div>
                    </div>
                    <div class="summary-row">
                      <div class="summary-key">
                        <q-icon name="lock" size="16px" />
                        Contraseña
                      </div>
                      <div class="summary-val summary-pwd">
                        <span>••••••••••</span>
                        <div class="pwd-badge" :style="{ background: pwdStrength.color }">
                          {{ pwdStrength.label }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-options">
                  <div
                    class="option-row"
                    :class="{ 'option-row--required': stepAttempted[2] && !accept }"
                    @click.self="accept = !accept"
                  >
                    <q-checkbox v-model="accept" color="primary" size="sm" />
                    <span class="option-label">
                      Acepto los
                      <a href="#" class="link" @click.stop.prevent>términos de servicio</a>
                      y la
                      <a href="#" class="link" @click.stop.prevent>política de privacidad</a>
                    </span>
                    <q-icon v-if="stepAttempted[2] && !accept" name="warning" color="orange" size="18px">
                      <q-tooltip>Debes aceptar los términos para continuar</q-tooltip>
                    </q-icon>
                  </div>

                  <div class="option-row" @click.self="autoLogin = !autoLogin">
                    <q-toggle v-model="autoLogin" color="primary" size="sm" />
                    <span class="option-label">Mantener sesión iniciada</span>
                  </div>
                </div>

                <transition name="slide-down">
                  <div v-if="stepAttempted[2] && !isStepValid(2)" class="validation-summary">
                    <q-icon name="info" size="18px" />
                    <div>
                      <div class="validation-summary-title">Para crear tu cuenta:</div>
                      <ul>
                        <li v-if="!accept">✗ Debes aceptar los términos y condiciones</li>
                      </ul>
                    </div>
                  </div>
                </transition>

                <transition name="slide-down">
                  <div v-if="formError" class="error-banner">
                    <q-icon name="error_outline" size="20px" />
                    <span>{{ formError }}</span>
                  </div>
                </transition>

              </div>
            </transition>

            <!-- ===== NAVEGACIÓN ===== -->
            <div class="form-nav">
              <q-btn
                v-if="currentStep > 0"
                flat
                no-caps
                class="nav-btn nav-btn--back"
                :disable="loading"
                @click="prevStep"
              >
                <q-icon name="arrow_back" size="18px" class="q-mr-xs" />
                Atrás
              </q-btn>
              <div v-else class="nav-spacer"></div>

              <q-btn
                v-if="currentStep < steps.length - 1"
                unelevated
                no-caps
                color="primary"
                class="nav-btn nav-btn--next"
                @click="nextStep"
              >
                Continuar
                <q-icon name="arrow_forward" size="18px" class="q-ml-xs" />
              </q-btn>

              <q-btn
                v-else
                unelevated
                no-caps
                color="primary"
                class="nav-btn nav-btn--submit"
                :loading="loading"
                :disable="loading"
                @click="onSubmit"
              >
                <template v-if="!loading">
                  <q-icon name="rocket_launch" size="18px" class="q-mr-xs" />
                  Crear mi cuenta
                </template>
              </q-btn>
            </div>

            <!-- Footer -->
            <div class="form-footer">
              <span class="footer-text">¿Ya tienes cuenta?</span>
              <router-link to="/login" class="footer-link">Inicia sesión aquí</router-link>
            </div>

          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/authStore'

const { dark, notify } = useQuasar()
const isDark = computed(() => dark.isActive)
const router = useRouter()
const auth = useAuthStore()

// ===== Pasos =====
const steps = [
  {
    name: 'Tus datos',
    title: 'Cuéntanos quién eres',
    subtitle: 'Necesitamos algunos datos básicos para crear tu cuenta',
    icon: 'person_outline',
    desc: 'Nombre y correo'
  },
  {
    name: 'Seguridad',
    title: 'Elige una contraseña',
    subtitle: 'Crea una contraseña segura para proteger tu cuenta',
    icon: 'shield',
    desc: 'Contraseña segura'
  },
  {
    name: 'Confirmar',
    title: 'Todo listo para comenzar',
    subtitle: 'Revisa tus datos y acepta los términos',
    icon: 'task_alt',
    desc: 'Revisión final'
  }
]

const currentStep = ref(0)
const stepAttempted = ref([false, false, false])

// ===== Formulario =====
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirm: ''
})

const errors = ref({
  firstName: '',
  email: '',
  password: '',
  passwordConfirm: ''
})

const showPwd = ref(false)
const loading = ref(false)
const formError = ref('')
const accept = ref(false)
const autoLogin = ref(true)
const checkingEmail = ref(false)
const emailValid = ref(false)
const passwordsMatch = ref(false)

// ===== Progreso =====
const progressPercent = computed(() => {
  return Math.round(((currentStep.value + 1) / steps.length) * 100)
})

// ===== Validación por paso =====
const isStepValid = (step) => {
  if (step === 0) {
    return (
      form.value.firstName.trim().length > 0 &&
      !errors.value.firstName &&
      emailValid.value &&
      !errors.value.email
    )
  }
  if (step === 1) {
    return (
      form.value.password.length >= 8 &&
      pwdStrength.value.level >= 2 &&
      passwordsMatch.value &&
      !errors.value.password &&
      !errors.value.passwordConfirm
    )
  }
  if (step === 2) {
    return accept.value
  }
  return false
}

// ===== Navegación =====
const nextStep = () => {
  stepAttempted.value[currentStep.value] = true
  validateCurrentStep()
  if (isStepValid(currentStep.value)) {
    currentStep.value++
    nextTick(() => {
      document.querySelector('.register-right')?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  } else {
    const btn = document.querySelector('.nav-btn--next')
    if (btn) {
      btn.classList.add('shake')
      setTimeout(() => btn.classList.remove('shake'), 600)
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

const validateCurrentStep = () => {
  if (currentStep.value === 0) {
    validateField('firstName')
    validateField('email')
  } else if (currentStep.value === 1) {
    validateField('password')
    validateField('passwordConfirm')
  }
}

// ===== Validación campos =====
const validateField = (field) => {
  errors.value[field] = ''
  switch (field) {
    case 'firstName':
      if (!form.value.firstName.trim()) {
        errors.value.firstName = 'El nombre es obligatorio'
      }
      break
    case 'email':
      if (!form.value.email.trim()) {
        errors.value.email = 'El correo es obligatorio'
        emailValid.value = false
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        errors.value.email = 'Correo inválido'
        emailValid.value = false
      }
      break
    case 'password':
      if (!form.value.password) {
        errors.value.password = 'La contraseña es obligatoria'
      } else if (form.value.password.length < 8) {
        errors.value.password = 'Mínimo 8 caracteres'
      }
      break
    case 'passwordConfirm':
      if (form.value.password !== form.value.passwordConfirm) {
        errors.value.passwordConfirm = 'Las contraseñas no coinciden'
      }
      break
  }
}

// ===== Email =====
let emailTimer = null

const onEmailInput = (val) => {
  emailValid.value = false
  errors.value.email = ''
  clearTimeout(emailTimer)
  const email = typeof val === 'string' ? val : form.value.email
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailTimer = setTimeout(checkEmailAvailability, 700)
  }
}

const checkEmailAvailability = async () => {
  checkingEmail.value = true
  await new Promise((resolve) => setTimeout(resolve, 800))
  checkingEmail.value = false
  emailValid.value = true
}

// ===== Contraseña =====
const onPasswordInput = () => {
  errors.value.password = ''
  if (form.value.passwordConfirm) {
    checkPasswordMatch()
  }
}

const onConfirmInput = () => {
  checkPasswordMatch()
}

const checkPasswordMatch = () => {
  errors.value.passwordConfirm = ''
  passwordsMatch.value =
    form.value.password === form.value.passwordConfirm &&
    form.value.passwordConfirm.length > 0
}

// ===== Fuerza contraseña =====
const pwdStrength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return { level: 0, label: '', color: '#9ca3af' }

  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  const level = Math.min(4, Math.ceil(score / 1.25))
  const map = {
    0: { label: 'Muy débil', color: '#ef4444' },
    1: { label: 'Muy débil', color: '#ef4444' },
    2: { label: 'Aceptable', color: '#f59e0b' },
    3: { label: 'Fuerte', color: '#3b82f6' },
    4: { label: 'Muy fuerte', color: '#10b981' }
  }
  return { level, ...map[level] }
})

// ===== Generar contraseña =====
const genPwd = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  const special = '!@#$%*_-+'
  const all = upper + lower + numbers + special

  let pwd = ''
  pwd += upper[Math.floor(Math.random() * upper.length)]
  pwd += lower[Math.floor(Math.random() * lower.length)]
  pwd += numbers[Math.floor(Math.random() * numbers.length)]
  pwd += special[Math.floor(Math.random() * special.length)]
  for (let i = 4; i < 14; i++) {
    pwd += all[Math.floor(Math.random() * all.length)]
  }

  form.value.password = pwd.split('').sort(() => Math.random() - 0.5).join('')
  form.value.passwordConfirm = ''
  passwordsMatch.value = false
  errors.value.password = ''
  errors.value.passwordConfirm = ''

  notify({
    type: 'positive',
    message: 'Contraseña generada. ¡Cópiala antes de continuar!',
    icon: 'check_circle',
    position: 'top',
    timeout: 3000
  })
}

// ===== Submit =====
const onSubmit = async () => {
  stepAttempted.value[2] = true
  if (!isStepValid(2)) return

  formError.value = ''
  loading.value = true

  try {
    await auth.register({
      firstName: form.value.firstName.trim(),
      lastName: form.value.lastName.trim(),
      email: form.value.email.trim().toLowerCase(),
      password: form.value.password
    })

    notify({
      type: 'positive',
      message: '¡Cuenta creada exitosamente!',
      icon: 'celebration',
      position: 'top'
    })

    if (autoLogin.value) {
      await auth.login({
        email: form.value.email.trim().toLowerCase(),
        password: form.value.password
      })
      router.replace('/')
    } else {
      router.replace('/login')
    }
  } catch (e) {
    formError.value = e?.message || 'Error al crear la cuenta'
  } finally {
    loading.value = false
  }
}

// ===== Canvas partículas =====
const particlesRef = ref(null)
let ctx, W, H, rafId, lastT = 0
const MOUSE = { x: -9999, y: -9999, r: 180 }
const particles = []
const mouseX = ref(-9999)
const mouseY = ref(-9999)

const rand = (a, b) => a + Math.random() * (b - a)

const makeParticle = () => ({
  x: rand(0, W),
  y: rand(0, H),
  vx: rand(-0.3, 0.3),
  vy: rand(-0.3, 0.3),
  r: rand(1.5, 3),
  opacity: rand(0.3, 0.8)
})

function initCanvas() {
  const c = particlesRef.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  W = c.clientWidth
  H = c.clientHeight
  c.width = W * dpr
  c.height = H * dpr
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  particles.length = 0
  for (let i = 0; i < 100; i++) particles.push(makeParticle())
  lastT = performance.now()
}

function animateCanvas(now) {
  if (!ctx) return
  lastT = now
  ctx.clearRect(0, 0, W, H)

  for (const p of particles) {
    const mx = p.x - MOUSE.x
    const my = p.y - MOUSE.y
    const d2 = mx * mx + my * my
    if (d2 < MOUSE.r * MOUSE.r) {
      const d = Math.sqrt(d2) || 0.001
      p.vx += (mx / d) * 0.1
      p.vy += (my / d) * 0.1
    }
    p.vx *= 0.99
    p.vy *= 0.99
    p.x += p.vx
    p.y += p.vy
    if (p.x < -12) p.x = W + 12
    else if (p.x > W + 12) p.x = -12
    if (p.y < -12) p.y = H + 12
    else if (p.y > H + 12) p.y = -12
  }

  for (const p of particles) {
    const alpha = p.opacity
    ctx.fillStyle = isDark.value
      ? `rgba(147,197,253,${alpha})`
      : `rgba(59,130,246,${alpha})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  }

  rafId = requestAnimationFrame(animateCanvas)
}

function onMouseMove(e) {
  const rect = particlesRef.value?.getBoundingClientRect()
  if (!rect) return
  MOUSE.x = e.clientX - rect.left
  MOUSE.y = e.clientY - rect.top
  mouseX.value = MOUSE.x
  mouseY.value = MOUSE.y
}

function onMouseLeave() {
  MOUSE.x = -9999
  MOUSE.y = -9999
  mouseX.value = -9999
  mouseY.value = -9999
}

const spotStyle = computed(() => ({
  transform: `translate(${mouseX.value - 300}px, ${mouseY.value - 300}px)`
}))

onMounted(async () => {
  await nextTick()
  initCanvas()
  rafId = requestAnimationFrame(animateCanvas)
  window.addEventListener('resize', initCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', initCanvas)
  cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/* ===== Base ===== */
.rk-register {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}
.rk-bg--light { background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%); }
.rk-bg--dark  { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }

/* ===== Background layers ===== */
.rk-bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.rk-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.4;
}
.rk-grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.03) 1.5px, transparent 1.5px),
    linear-gradient(90deg, rgba(59,130,246,0.03) 1.5px, transparent 1.5px);
  background-size: 60px 60px;
  opacity: 0.6;
}
.rk-gradient-orbs { position: absolute; inset: 0; }
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s ease-in-out infinite;
}
.orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%);
  top: -200px; right: -100px;
}
.orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%);
  bottom: -150px; left: -100px;
  animation-delay: -7s;
}
.orb-3 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(168,85,247,0.3), transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}
@keyframes float {
  0%, 100% { transform: translate(0,0) scale(1); }
  33%       { transform: translate(30px,-30px) scale(1.1); }
  66%       { transform: translate(-20px,20px) scale(0.9); }
}
.rk-spotlight {
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%);
  filter: blur(60px);
  transition: transform 0.1s ease-out;
  opacity: 0.5;
}
body.body--dark .rk-spotlight {
  background: radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%);
}

/* ===== Center ===== */
.rk-center {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

/* ===== Card ===== */
.register-card {
  width: 100%;
  max-width: 1100px;
  height: 680px;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow:
    0 50px 100px rgba(0,0,0,0.08),
    0 20px 60px rgba(0,0,0,0.04),
    inset 0 1px 0 rgba(255,255,255,0.8);
  animation: cardSlideIn 0.8s cubic-bezier(0.16,1,0.3,1) both;
}
body.body--dark .register-card {
  background: rgba(15,23,42,0.88);
  border-color: rgba(255,255,255,0.1);
  box-shadow:
    0 50px 100px rgba(0,0,0,0.5),
    0 20px 60px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.05);
}
@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.register-container {
  display: grid;
  grid-template-columns: 380px 1fr;
  height: 100%;
}

/* ===== LEFT ===== */
.register-left {
  background: linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(147,197,253,0.05) 100%);
  border-right: 1px solid rgba(203,213,225,0.2);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  overflow: hidden;
}
body.body--dark .register-left {
  background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(30,41,59,0.4) 100%);
  border-right-color: rgba(51,65,85,0.3);
}
.register-left::before {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%);
  border-radius: 50%;
  filter: blur(40px);
}

/* Brand */
.brand-section { text-align: center; padding-bottom: 0.5rem; }
.logo-container { display: inline-flex; margin-bottom: 1rem; }
.logo-outer-ring {
  width: 70px; height: 70px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #3b82f6 0deg, #8b5cf6 120deg, #3b82f6 240deg, #8b5cf6 360deg);
  padding: 3px;
  animation: rotate 8s linear infinite;
  box-shadow: 0 10px 40px rgba(59,130,246,0.4);
}
@keyframes rotate { to { transform: rotate(360deg); } }
.logo-inner-ring {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: #fff;
  padding: 4px;
  display: flex; align-items: center; justify-content: center;
}
body.body--dark .logo-inner-ring { background: #0f172a; }
.logo-core {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex; align-items: center; justify-content: center;
  color: white;
}
.brand-title {
  font-size: 1.75rem; font-weight: 800;
  background: linear-gradient(135deg, #1e293b, #475569);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0; letter-spacing: -1px;
}
body.body--dark .brand-title {
  background: linear-gradient(135deg, #f1f5f9, #cbd5e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.brand-tagline { margin: 0.4rem 0 0; color: #64748b; font-size: 0.85rem; font-weight: 500; }
body.body--dark .brand-tagline { color: #94a3b8; }

/* Steps sidebar */
.steps-sidebar { display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
.sidebar-step {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: rgba(255,255,255,0.5);
  border: 1.5px solid rgba(255,255,255,0.6);
  border-radius: 14px;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  cursor: default;
}
body.body--dark .sidebar-step {
  background: rgba(15,23,42,0.4);
  border-color: rgba(51,65,85,0.3);
}
.sidebar-step--active {
  background: rgba(59,130,246,0.1);
  border-color: rgba(59,130,246,0.5);
  box-shadow: 0 4px 20px rgba(59,130,246,0.12);
  transform: translateX(4px);
}
body.body--dark .sidebar-step--active { background: rgba(59,130,246,0.15); }
.sidebar-step--done {
  background: rgba(16,185,129,0.08);
  border-color: rgba(16,185,129,0.4);
}
body.body--dark .sidebar-step--done { background: rgba(16,185,129,0.1); }
.sidebar-step-icon {
  width: 38px; height: 38px;
  border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: white;
  background: linear-gradient(135deg, rgba(148,163,184,0.3), rgba(100,116,139,0.2));
  transition: all 0.35s;
}
.sidebar-step--active .sidebar-step-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 4px 12px rgba(59,130,246,0.3);
}
.sidebar-step--done .sidebar-step-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}
.sidebar-step-info { flex: 1; min-width: 0; }
.sidebar-step-name { font-size: 0.875rem; font-weight: 600; color: #1e293b; transition: color 0.2s; }
body.body--dark .sidebar-step-name { color: #f1f5f9; }
.sidebar-step--active .sidebar-step-name { color: #3b82f6; }
.sidebar-step--done  .sidebar-step-name { color: #10b981; }
.sidebar-step-desc { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
.sidebar-step-number { font-size: 0.75rem; font-weight: 700; color: #cbd5e1; }
.sidebar-step--active .sidebar-step-number { color: #3b82f6; }
.sidebar-step--done  .sidebar-step-number { color: #10b981; }

/* Stats */
.stats-row {
  display: flex; align-items: center; justify-content: space-around;
  padding: 1rem;
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 14px;
}
body.body--dark .stats-row { background: rgba(15,23,42,0.4); border-color: rgba(51,65,85,0.3); }
.stat-item { text-align: center; }
.stat-value {
  font-size: 1.25rem; font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-label { font-size: 0.7rem; color: #64748b; font-weight: 500; margin-top: 2px; }
body.body--dark .stat-label { color: #94a3b8; }
.stat-divider { width: 1px; height: 28px; background: rgba(203,213,225,0.3); }
body.body--dark .stat-divider { background: rgba(51,65,85,0.5); }

/* ===== RIGHT ===== */
.register-right {
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}
.register-right::-webkit-scrollbar { width: 5px; }
.register-right::-webkit-scrollbar-track { background: transparent; }
.register-right::-webkit-scrollbar-thumb { background: rgba(203,213,225,0.3); border-radius: 3px; }

/* Progress */
.top-progress {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; margin-bottom: 2rem;
}
.top-progress-bar {
  flex: 1; height: 6px;
  background: rgba(203,213,225,0.2);
  border-radius: 999px; overflow: hidden;
}
body.body--dark .top-progress-bar { background: rgba(51,65,85,0.4); }
.top-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 10px rgba(59,130,246,0.4);
}
.top-progress-label { font-size: 0.75rem; font-weight: 600; color: #64748b; white-space: nowrap; }
body.body--dark .top-progress-label { color: #94a3b8; }

/* Header */
.form-header { margin-bottom: 1.75rem; }
.step-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  background: rgba(59,130,246,0.1);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 999px;
  color: #3b82f6; font-size: 0.75rem; font-weight: 600;
  margin-bottom: 0.875rem;
}
body.body--dark .step-badge { background: rgba(59,130,246,0.15); }
.form-title { font-size: 1.625rem; font-weight: 700; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
body.body--dark .form-title { color: #f1f5f9; }
.form-subtitle { margin: 0.5rem 0 0; color: #64748b; font-size: 0.9rem; }
body.body--dark .form-subtitle { color: #94a3b8; }

/* Step body */
.step-body { flex: 1; display: flex; flex-direction: column; }

/* Input grid */
.input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
.input-col { min-width: 0; }

/* ===== Floating inputs ===== */
.floating-input {
  position: relative;
  margin-bottom: 1.25rem;
}

/* Remove Quasar's own label to avoid conflict */
.floating-input :deep(.q-field__label) { display: none; }

.floating-input :deep(.q-field__control) {
  height: 50px;
  border-radius: 12px;
  background: rgba(248,250,252,0.5);
  border: 1.5px solid rgba(203,213,225,0.3);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
}
body.body--dark .floating-input :deep(.q-field__control) {
  background: rgba(15,23,42,0.4);
  border-color: rgba(51,65,85,0.4);
}
.floating-input :deep(.q-field__control:hover) {
  border-color: rgba(59,130,246,0.4);
  background: rgba(248,250,252,0.8);
}
body.body--dark .floating-input :deep(.q-field__control:hover) {
  background: rgba(15,23,42,0.6);
}
.floating-input :deep(.q-field--focused .q-field__control) {
  border-color: #3b82f6 !important;
  background: rgba(255,255,255,0.95) !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
}
body.body--dark .floating-input :deep(.q-field--focused .q-field__control) {
  background: rgba(15,23,42,0.8) !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
}
.floating-input.filled :deep(.q-field__control) {
  border-color: rgba(59,130,246,0.3);
}
.floating-input.valid :deep(.q-field__control) {
  border-color: #10b981 !important;
  background: rgba(16,185,129,0.03) !important;
}
.floating-input.error :deep(.q-field__control) {
  border-color: #ef4444 !important;
  background: rgba(239,68,68,0.04) !important;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.08) !important;
}

/* Floating label custom */
.floating-label {
  position: absolute;
  left: 3rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.9375rem;
  font-weight: 500;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  padding: 0 0.25rem;
  z-index: 2;
  background: transparent;
}

/* Label floats up when filled */
.floating-input.filled .floating-label {
  top: 0;
  left: 2.75rem;
  font-size: 0.72rem;
  color: #3b82f6;
  background: white;
}
body.body--dark .floating-input.filled .floating-label {
  background: #0f172a;
}
.floating-input.error .floating-label { color: #ef4444; }
.floating-input.valid .floating-label { color: #10b981; }

.input-icon {
  display: flex; align-items: center; justify-content: center;
  color: #94a3b8; transition: color 0.2s;
}
.floating-input.error .input-icon { color: #ef4444; }
.floating-input.valid .input-icon { color: #10b981; }

.input-status { display: flex; align-items: center; }
.input-status.success { color: #10b981; }

/* ===== Field hints ===== */
.field-hint {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.8rem; font-weight: 500;
  padding: 0.4rem 0.75rem; border-radius: 8px;
  margin-top: -0.75rem; margin-bottom: 1rem;
}
.field-hint--error   { color: #ef4444; background: rgba(239,68,68,0.06); }
.field-hint--success { color: #10b981; background: rgba(16,185,129,0.07); }

/* ===== Validation summary ===== */
.validation-summary {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 1rem 1.125rem; margin-bottom: 1rem;
  background: rgba(245,158,11,0.08);
  border: 1.5px solid rgba(245,158,11,0.3);
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  color: #b45309;
}
body.body--dark .validation-summary { background: rgba(245,158,11,0.1); color: #fcd34d; }
.validation-summary > .q-icon { margin-top: 2px; color: #f59e0b; flex-shrink: 0; }
.validation-summary-title { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.4rem; }
.validation-summary ul {
  margin: 0; padding-left: 0; list-style: none;
  display: flex; flex-direction: column; gap: 0.25rem;
}
.validation-summary li { font-size: 0.8125rem; }

/* ===== Password meter ===== */
.password-meter {
  padding: 1rem;
  background: rgba(241,245,249,0.5);
  border-radius: 12px;
  margin-bottom: 1.25rem;
}
body.body--dark .password-meter { background: rgba(15,23,42,0.5); }
.meter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.625rem; }
.meter-text { font-size: 0.8rem; color: #64748b; font-weight: 500; }
body.body--dark .meter-text { color: #94a3b8; }
.meter-label { font-size: 0.8rem; font-weight: 700; transition: color 0.3s; }
.meter-bars { display: flex; gap: 0.375rem; margin-bottom: 0.875rem; }
.meter-bar {
  flex: 1; height: 5px;
  background: rgba(203,213,225,0.3);
  border-radius: 999px;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
}
body.body--dark .meter-bar { background: rgba(51,65,85,0.5); }
.meter-bar.active[data-level="1"] { background: linear-gradient(90deg, #ef4444, #dc2626); box-shadow: 0 0 8px rgba(239,68,68,0.4); }
.meter-bar.active[data-level="2"] { background: linear-gradient(90deg, #f59e0b, #d97706); box-shadow: 0 0 8px rgba(245,158,11,0.4); }
.meter-bar.active[data-level="3"] { background: linear-gradient(90deg, #3b82f6, #2563eb); box-shadow: 0 0 8px rgba(59,130,246,0.4); }
.meter-bar.active[data-level="4"] { background: linear-gradient(90deg, #10b981, #059669); box-shadow: 0 0 8px rgba(16,185,129,0.4); }
.pwd-requirements { display: grid; grid-template-columns: 1fr 1fr; gap: 0.375rem; }
.req { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: #94a3b8; transition: color 0.2s; }
.req.met { color: #10b981; }

/* ===== Summary card ===== */
.summary-card {
  background: rgba(241,245,249,0.6);
  border: 1px solid rgba(203,213,225,0.3);
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}
body.body--dark .summary-card { background: rgba(15,23,42,0.5); border-color: rgba(51,65,85,0.4); }
.summary-title {
  font-size: 0.8125rem; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem;
}
body.body--dark .summary-title { color: #94a3b8; }
.summary-rows { display: flex; flex-direction: column; gap: 0.875rem; }
.summary-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.summary-key {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.8rem; color: #64748b; font-weight: 500; white-space: nowrap;
}
body.body--dark .summary-key { color: #94a3b8; }
.summary-val { font-size: 0.875rem; font-weight: 600; color: #1e293b; text-align: right; word-break: break-all; }
body.body--dark .summary-val { color: #f1f5f9; }
.summary-pwd { display: flex; align-items: center; gap: 0.5rem; }
.pwd-badge { font-size: 0.7rem; font-weight: 700; color: white; padding: 0.15rem 0.5rem; border-radius: 999px; }

/* ===== Options ===== */
.form-options { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem; }
.option-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(241,245,249,0.4);
  border: 1.5px solid rgba(203,213,225,0.2);
  border-radius: 12px; cursor: pointer;
  transition: all 0.25s;
}
body.body--dark .option-row { background: rgba(15,23,42,0.4); border-color: rgba(51,65,85,0.3); }
.option-row:hover { background: rgba(241,245,249,0.7); border-color: rgba(203,213,225,0.4); }
body.body--dark .option-row:hover { background: rgba(15,23,42,0.6); }
.option-row--required {
  border-color: rgba(245,158,11,0.5) !important;
  background: rgba(245,158,11,0.05) !important;
  animation: pulse-border 1.5s ease-in-out 2;
}
@keyframes pulse-border {
  0%,100% { border-color: rgba(245,158,11,0.5); }
  50% { border-color: rgba(245,158,11,0.9); box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
}
.option-label { font-size: 0.875rem; color: #475569; flex: 1; }
body.body--dark .option-label { color: #cbd5e1; }
.link { color: #3b82f6; text-decoration: none; font-weight: 600; transition: color 0.2s; }
.link:hover { color: #2563eb; text-decoration: underline; }

/* ===== Error banner ===== */
.error-banner {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-left: 3px solid #ef4444;
  border-radius: 10px;
  color: #dc2626; font-size: 0.875rem; font-weight: 500;
  margin-bottom: 1rem;
}
body.body--dark .error-banner { background: rgba(239,68,68,0.15); color: #fca5a5; }

/* ===== Navigation ===== */
.form-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: auto; padding-top: 1.25rem;
  border-top: 1px solid rgba(203,213,225,0.2);
  gap: 0.75rem;
}
body.body--dark .form-nav { border-top-color: rgba(51,65,85,0.3); }
.nav-spacer { flex: 1; }
.nav-btn {
  height: 46px; border-radius: 12px;
  font-size: 0.9rem; font-weight: 600;
  min-width: 130px;
}
.nav-btn--back {
  color: #64748b;
  border: 1.5px solid rgba(203,213,225,0.4);
}
body.body--dark .nav-btn--back { color: #94a3b8; border-color: rgba(51,65,85,0.5); }
.nav-btn--next,
.nav-btn--submit {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  box-shadow: 0 6px 20px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
  color: white !important;
  flex: 1; max-width: 220px;
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
}
.nav-btn--next:hover,
.nav-btn--submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(59,130,246,0.45) !important;
}
.nav-btn--next:active,
.nav-btn--submit:active { transform: translateY(0); }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  15% { transform: translateX(-6px); }
  30% { transform: translateX(6px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
  90% { transform: translateX(2px); }
}
.shake { animation: shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both; }

/* ===== Footer ===== */
.form-footer { text-align: center; padding-top: 1rem; }
.footer-text { color: #64748b; font-size: 0.875rem; }
body.body--dark .footer-text { color: #94a3b8; }
.footer-link { color: #3b82f6; text-decoration: none; font-weight: 600; margin-left: 0.25rem; transition: color 0.2s; }
.footer-link:hover { color: #2563eb; text-decoration: underline; }

/* ===== Transitions ===== */
.step-slide-enter-active,
.step-slide-leave-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.step-slide-enter-from { opacity: 0; transform: translateX(30px); }
.step-slide-leave-to  { opacity: 0; transform: translateX(-30px); }

.fade-up-enter-active,
.fade-up-leave-active { transition: all 0.25s ease; }
.fade-up-enter-from,
.fade-up-leave-to { opacity: 0; transform: translateY(6px); }

.expand-enter-active,
.expand-leave-active { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); overflow: hidden; }
.expand-enter-from,
.expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to,
.expand-leave-from { opacity: 1; max-height: 280px; }

.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* ===== Responsive ===== */
@media (max-width: 1024px) {
  .register-container { grid-template-columns: 1fr; }
  .register-left { display: none; }
  .register-card { height: auto; max-height: 90vh; }
}
@media (max-width: 768px) {
  .register-right { padding: 2rem 1.5rem; }
  .input-row { grid-template-columns: 1fr; }
  .form-title { font-size: 1.4rem; }
  .pwd-requirements { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .rk-center { padding: 1rem; }
  .register-card { border-radius: 16px; }
  .register-right { padding: 1.5rem 1rem; }
}
@media (min-height: 800px) {
  .register-card { height: 720px; }
}
</style>