<template>
  <q-page
    class="rk-register"
    :class="isDark ? 'rk-bg--dark' : 'rk-bg--light'"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Fondo interactivo mejorado -->
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
          <!-- Left side: Branding + Features -->
          <div class="register-left">
            <!--Brand section -->
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

            <!-- Features grid -->
            <div class="features-grid">
              <div 
                v-for="(feature, idx) in features" 
                :key="idx"
                class="feature-card"
                :style="{ animationDelay: (idx * 0.08) + 's' }"
              >
                <div class="feature-icon-wrap">
                  <q-icon :name="feature.icon" size="24px" />
                </div>
                <div class="feature-info">
                  <div class="feature-name">{{ feature.title }}</div>
                  <div class="feature-desc">{{ feature.desc }}</div>
                </div>
              </div>
            </div>

            <!-- Stats -->
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

          <!-- Right side: Form -->
          <div class="register-right">
            <!-- Progress bar -->
            <div class="progress-indicator">
              <div class="progress-steps">
                <div 
                  v-for="i in 4" 
                  :key="i"
                  class="progress-step"
                  :class="{ active: formProgress >= (i * 25) }"
                ></div>
              </div>
              <div class="progress-text">
                {{ Math.round(formProgress) }}% completado
              </div>
            </div>

            <!-- Form header -->
            <div class="form-header">
              <h2 class="form-title">Crear cuenta</h2>
              <p class="form-subtitle">Comienza tu viaje con nosotros</p>
            </div>

            <q-form @submit.prevent="onSubmit" class="register-form">
              <!-- Nombre completo -->
              <div class="form-group">
                <div class="input-row">
                  <div class="input-col">
                    <div class="floating-input" :class="{ filled: form.firstName, error: errors.firstName }">
                      <q-input 
                        v-model="form.firstName" 
                        outlined 
                        dense
                        :disable="loading"
                        @blur="validateField('firstName')"
                        hide-bottom-space
                      >
                        <template #prepend>
                          <div class="input-icon">
                            <q-icon name="person" size="20px" />
                          </div>
                        </template>
                      </q-input>
                      <label class="floating-label">Nombre</label>
                    </div>
                  </div>
                  
                  <div class="input-col">
                    <div class="floating-input" :class="{ filled: form.lastName }">
                      <q-input 
                        v-model="form.lastName" 
                        outlined 
                        dense 
                        :disable="loading"
                        hide-bottom-space
                      >
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
              </div>

              <!-- Email -->
              <div class="form-group">
                <div class="floating-input" :class="{ filled: form.email, error: errors.email, valid: emailValid }">
                  <q-input 
                    v-model="form.email" 
                    type="email" 
                    autocomplete="email"
                    outlined 
                    dense 
                    :disable="loading"
                    @blur="validateField('email')"
                    @input="onEmailInput"
                    hide-bottom-space
                  >
                    <template #prepend>
                      <div class="input-icon">
                        <q-icon name="mail" size="20px" />
                      </div>
                    </template>
                    <template #append>
                      <transition name="scale-fade">
                        <div v-if="checkingEmail" class="input-status">
                          <q-spinner-dots color="primary" size="18px" />
                        </div>
                      </transition>
                      <transition name="scale-fade">
                        <div v-if="emailValid" class="input-status success">
                          <q-icon name="check_circle" size="20px" />
                        </div>
                      </transition>
                    </template>
                  </q-input>
                  <label class="floating-label">Correo electrónico</label>
                </div>
              </div>

              <!-- Contraseña -->
              <div class="form-group">
                <div class="floating-input" :class="{ filled: form.password, error: errors.password }">
                  <q-input 
                    ref="pwdRef"
                    v-model="form.password" 
                    :type="showPwd ? 'text' : 'password'"
                    autocomplete="new-password" 
                    outlined 
                    dense 
                    :disable="loading"
                    @blur="validateField('password')"
                    @input="onPasswordInput"
                    @keyup="onPwdKey"
                    @focus="passwordFocused = true"
                    hide-bottom-space
                  >
                    <template #prepend>
                      <div class="input-icon">
                        <q-icon name="lock" size="20px" />
                      </div>
                    </template>
                    <template #append>
                      <q-btn 
                        flat 
                        dense 
                        round 
                        :icon="showPwd ? 'visibility_off' : 'visibility'"
                        color="grey-6" 
                        size="sm"
                        @click="showPwd = !showPwd"
                      />
                      <q-btn 
                        flat 
                        dense 
                        round 
                        icon="auto_awesome" 
                        color="grey-6"
                        size="sm"
                        @click="genPwd"
                      >
                        <q-tooltip anchor="top middle" self="bottom middle">Generar contraseña segura</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                  <label class="floating-label">Contraseña</label>
                </div>

                <!-- Password strength -->
                <transition name="expand">
                  <div v-if="form.password" class="password-meter">
                    <div class="meter-bars">
                      <div 
                        v-for="i in 4" 
                        :key="i" 
                        class="meter-bar"
                        :class="{ 
                          active: i <= pwdStrength.level,
                          level: i <= pwdStrength.level
                        }"
                        :data-level="pwdStrength.level"
                      ></div>
                    </div>
                    <div class="meter-label" :style="{ color: pwdStrength.color }">
                      {{ pwdStrength.label }}
                    </div>
                  </div>
                </transition>
              </div>

              <!-- Confirmar contraseña -->
              <div class="form-group">
                <div class="floating-input" :class="{ filled: form.passwordConfirm, error: errors.passwordConfirm, valid: passwordsMatch && form.passwordConfirm }">
                  <q-input 
                    v-model="form.passwordConfirm" 
                    :type="showPwd ? 'text' : 'password'"
                    autocomplete="new-password" 
                    outlined 
                    dense
                    :disable="loading"
                    @blur="validateField('passwordConfirm')"
                    @input="checkPasswordMatch"
                    hide-bottom-space
                  >
                    <template #prepend>
                      <div class="input-icon">
                        <q-icon name="lock_clock" size="20px" />
                      </div>
                    </template>
                    <template #append>
                      <transition name="scale-fade">
                        <div v-if="passwordsMatch && form.passwordConfirm" class="input-status success">
                          <q-icon name="check_circle" size="20px" />
                        </div>
                      </transition>
                    </template>
                  </q-input>
                  <label class="floating-label">Confirmar contraseña</label>
                </div>
              </div>

              <!-- Opciones -->
              <div class="form-options">
                <div class="option-row" @click.self="accept = !accept">
                  <q-checkbox 
                    v-model="accept" 
                    :disable="loading"
                    color="primary"
                    size="sm"
                  />
                  <span class="option-label">
                    Acepto los <a href="#" @click.stop.prevent class="link">términos</a> y 
                    <a href="#" @click.stop.prevent class="link">política</a>
                  </span>
                </div>

                <div class="option-row" @click.self="autoLogin = !autoLogin">
                  <q-toggle 
                    v-model="autoLogin" 
                    :disable="loading"
                    color="primary"
                    size="sm"
                  />
                  <span class="option-label">Mantener sesión iniciada</span>
                </div>
              </div>

              <!-- Error message -->
              <transition name="slide-down">
                <div v-if="formError" class="error-banner">
                  <q-icon name="error_outline" size="20px" />
                  <span>{{ formError }}</span>
                </div>
              </transition>

              <!-- Submit button -->
              <q-btn 
                type="submit" 
                color="primary" 
                class="submit-btn" 
                unelevated
                no-caps
                :loading="loading" 
                :disable="!canSubmit || loading"
              >
                <template v-if="!loading">
                  <q-icon name="rocket_launch" size="20px" class="q-mr-sm" />
                  <span>Crear mi cuenta</span>
                </template>
              </q-btn>

              <!-- Footer -->
              <div class="form-footer">
                <span class="footer-text">¿Ya tienes cuenta?</span>
                <router-link to="/login" class="footer-link">
                  Inicia sesión aquí
                </router-link>
              </div>
            </q-form>
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

/* ===== Estado ===== */
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
const capsOn = ref(false)
const loading = ref(false)
const formError = ref('')
const accept = ref(false)
const autoLogin = ref(true)
const pwdRef = ref(null)
const passwordFocused = ref(false)
const checkingEmail = ref(false)
const emailValid = ref(false)
const passwordsMatch = ref(false)

/* ===== Features ===== */
const features = [
  {
    icon: 'bolt',
    title: 'Rápido',
    desc: 'Respuesta instantánea'
  },
  {
    icon: 'shield',
    title: 'Seguro',
    desc: 'Encriptación total'
  },
  {
    icon: 'cloud_done',
    title: 'En la nube',
    desc: 'Acceso desde cualquier lugar'
  },
  {
    icon: 'support_agent',
    title: 'Soporte',
    desc: 'Ayuda cuando la necesites'
  }
]

/* ===== Validación ===== */
const validateField = (field) => {
  errors.value[field] = ''
  
  switch(field) {
    case 'firstName':
      if (!form.value.firstName.trim()) {
        errors.value.firstName = 'El nombre es obligatorio'
      }
      break
      
    case 'email':
      if (!form.value.email.trim()) {
        errors.value.email = 'El correo es obligatorio'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        errors.value.email = 'Correo inválido'
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

/* ===== Email validation ===== */
const onEmailInput = () => {
  emailValid.value = false
  if (form.value.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    checkEmailAvailability()
  }
}

const checkEmailAvailability = async () => {
  checkingEmail.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  checkingEmail.value = false
  emailValid.value = true
}

/* ===== Password ===== */
const onPasswordInput = () => {
  if (form.value.passwordConfirm) {
    checkPasswordMatch()
  }
}

const checkPasswordMatch = () => {
  passwordsMatch.value = form.value.password === form.value.passwordConfirm && form.value.passwordConfirm.length > 0
}

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
  let label = 'Muy débil'
  let color = '#ef4444'
  
  if (level === 4) {
    label = 'Muy fuerte'
    color = '#10b981'
  } else if (level === 3) {
    label = 'Fuerte'
    color = '#3b82f6'
  } else if (level === 2) {
    label = 'Aceptable'
    color = '#f59e0b'
  }
  
  return { level, label, color }
})

const onPwdKey = (e) => {
  capsOn.value = e.getModifierState && e.getModifierState('CapsLock')
}

/* ===== Generar contraseña ===== */
const genPwd = () => {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%*_-+'
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  const special = '!@#$%*_-+'
  
  let pwd = ''
  pwd += upper.charAt(Math.floor(Math.random() * upper.length))
  pwd += lower.charAt(Math.floor(Math.random() * lower.length))
  pwd += numbers.charAt(Math.floor(Math.random() * numbers.length))
  pwd += special.charAt(Math.floor(Math.random() * special.length))
  
  for (let i = 4; i < 14; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  pwd = pwd.split('').sort(() => Math.random() - 0.5).join('')
  
  form.value.password = pwd
  form.value.passwordConfirm = ''
  
  notify({
    type: 'positive',
    message: 'Contraseña generada',
    icon: 'check_circle',
    position: 'top',
    timeout: 2000
  })
  
  nextTick(() => pwdRef.value?.focus?.())
}

/* ===== Progress ===== */
const formProgress = computed(() => {
  let progress = 0
  if (form.value.firstName.trim()) progress += 25
  if (emailValid.value) progress += 25
  if (form.value.password && pwdStrength.value.level >= 2) progress += 25
  if (passwordsMatch.value && accept.value) progress += 25
  return progress
})

/* ===== Submit ===== */
const canSubmit = computed(() => {
  return (
    accept.value &&
    form.value.firstName.trim() &&
    emailValid.value &&
    form.value.password.length >= 8 &&
    passwordsMatch.value
  )
})

const onSubmit = async () => {
  validateField('firstName')
  validateField('email')
  validateField('password')
  validateField('passwordConfirm')
  
  if (!canSubmit.value) {
    formError.value = 'Completa todos los campos correctamente'
    return
  }
  
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
      message: '¡Cuenta creada!',
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

/* ===== Fondo interactivo ===== */
const particlesRef = ref(null)
let ctx, W, H, rafId, lastT = 0
const MOUSE = { x: -9999, y: -9999, r: 180 }
const particles = []

const rand = (a, b) => a + Math.random() * (b - a)

function make() {
  return {
    x: rand(0, W),
    y: rand(0, H),
    vx: rand(-0.3, 0.3),
    vy: rand(-0.3, 0.3),
    r: rand(1.5, 3),
    opacity: rand(0.3, 0.8)
  }
}

function init() {
  const c = particlesRef.value
  if (!c) return
  
  const dpr = devicePixelRatio || 1
  W = c.clientWidth
  H = c.clientHeight
  c.width = W * dpr
  c.height = H * dpr
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  
  particles.length = 0
  for (let i = 0; i < 100; i++) particles.push(make())
  
  lastT = performance.now()
}

function step(now) {
  if (!ctx) return
  
  const dt = Math.min(0.033, (now - lastT) / 1000 || 0.016)
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
    const color = isDark.value 
      ? `rgba(147, 197, 253, ${p.opacity})` 
      : `rgba(59, 130, 246, ${p.opacity})`
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  }
  
  rafId = requestAnimationFrame(step)
}

const mouseX = ref(-9999)
const mouseY = ref(-9999)

function onMouseMove(e) {
  const r = particlesRef.value?.getBoundingClientRect()
  if (!r) return
  MOUSE.x = e.clientX - r.left
  MOUSE.y = e.clientY - r.top
  mouseX.value = MOUSE.x
  mouseY.value = MOUSE.y
}

function onMouseLeave() {
  MOUSE.x = MOUSE.y = -9999
  mouseX.value = mouseY.value = -9999
}

const spotStyle = computed(() => ({
  transform: `translate(${mouseX.value - 300}px, ${mouseY.value - 300}px)`
}))

onMounted(async () => {
  await nextTick()
  init()
  rafId = requestAnimationFrame(step)
  window.addEventListener('resize', init)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', init)
  cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/* ===== Layout base ===== */
.rk-register {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.rk-bg--light {
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
}

.rk-bg--dark {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

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
    linear-gradient(rgba(59, 130, 246, 0.03) 1.5px, transparent 1.5px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1.5px, transparent 1.5px);
  background-size: 60px 60px;
  opacity: 0.6;
}

body.body--dark .rk-grid-overlay {
  background-image: 
    linear-gradient(rgba(59, 130, 246, 0.05) 1.5px, transparent 1.5px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1.5px, transparent 1.5px);
}

.rk-gradient-orbs {
  position: absolute;
  inset: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent 70%);
  top: -200px;
  right: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent 70%);
  bottom: -150px;
  left: -100px;
  animation-delay: -7s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.3), transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

.rk-spotlight {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15), transparent 70%);
  filter: blur(60px);
  transition: transform 0.1s ease-out;
  opacity: 0.5;
}

body.body--dark .rk-spotlight {
  background: radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%);
}

/* ===== Center container ===== */
.rk-center {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

/* ===== Card principal ===== */
.register-card {
  width: 100%;
  max-width: 1100px;
  height: 650px;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 50px 100px rgba(0, 0, 0, 0.08),
    0 20px 60px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  animation: cardSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

body.body--dark .register-card {
  background: rgba(15, 23, 42, 0.85);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 50px 100px rgba(0, 0, 0, 0.5),
    0 20px 60px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== Container ===== */
.register-container {
  display: grid;
  grid-template-columns: 420px 1fr;
  height: 100%;
}

/* ===== Left side ===== */
.register-left {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.08) 0%, 
    rgba(147, 197, 253, 0.05) 100%
  );
  border-right: 1px solid rgba(203, 213, 225, 0.2);
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  overflow: hidden;
}

body.body--dark .register-left {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1) 0%, 
    rgba(30, 41, 59, 0.4) 100%
  );
  border-right-color: rgba(51, 65, 85, 0.3);
}

.register-left::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%);
  border-radius: 50%;
  filter: blur(40px);
}

/* ===== Brand section ===== */
.brand-section {
  text-align: center;
}

.logo-container {
  display: inline-flex;
  position: relative;
  margin-bottom: 1.5rem;
}

.logo-outer-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #3b82f6 0deg,
    #8b5cf6 120deg,
    #3b82f6 240deg,
    #8b5cf6 360deg
  );
  padding: 3px;
  animation: rotate 8s linear infinite;
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

.logo-inner-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

body.body--dark .logo-inner-ring {
  background: #0f172a;
}

.logo-core {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
}

.brand-title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #1e293b, #475569);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -1px;
}

body.body--dark .brand-title {
  background: linear-gradient(135deg, #f1f5f9, #cbd5e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-tagline {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

body.body--dark .brand-tagline {
  color: #94a3b8;
}

/* ===== Features grid ===== */
.features-grid {
  display: grid;
  gap: 1rem;
  flex: 1;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  animation: slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  cursor: default;
}

body.body--dark .feature-card {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(51, 65, 85, 0.4);
}

.feature-card:hover {
  transform: translateX(6px);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

body.body--dark .feature-card:hover {
  background: rgba(15, 23, 42, 0.7);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.feature-icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.feature-info {
  flex: 1;
  min-width: 0;
}

.feature-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

body.body--dark .feature-name {
  color: #f1f5f9;
}

.feature-desc {
  font-size: 0.8125rem;
  color: #64748b;
}

body.body--dark .feature-desc {
  color: #94a3b8;
}

/* ===== Stats row ===== */
.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  margin-top: auto;
}

body.body--dark .stats-row {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.3);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  margin-top: 2px;
}

body.body--dark .stat-label {
  color: #94a3b8;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(203, 213, 225, 0.3);
}

body.body--dark .stat-divider {
  background: rgba(51, 65, 85, 0.5);
}

/* ===== Right side ===== */
.register-right {
  padding: 3rem 3.5rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.register-right::-webkit-scrollbar {
  width: 6px;
}

.register-right::-webkit-scrollbar-track {
  background: transparent;
}

.register-right::-webkit-scrollbar-thumb {
  background: rgba(203, 213, 225, 0.3);
  border-radius: 3px;
}

.register-right::-webkit-scrollbar-thumb:hover {
  background: rgba(203, 213, 225, 0.5);
}

/* ===== Progress indicator ===== */
.progress-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.progress-steps {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  max-width: 200px;
}

.progress-step {
  flex: 1;
  height: 4px;
  background: rgba(203, 213, 225, 0.3);
  border-radius: 999px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

body.body--dark .progress-step {
  background: rgba(51, 65, 85, 0.5);
}

.progress-step.active {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.progress-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
}

body.body--dark .progress-text {
  color: #94a3b8;
}

/* ===== Form header ===== */
.form-header {
  margin-bottom: 2rem;
}

.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.5px;
}

body.body--dark .form-title {
  color: #f1f5f9;
}

.form-subtitle {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 0.9375rem;
}

body.body--dark .form-subtitle {
  color: #94a3b8;
}

/* ===== Form ===== */
.register-form {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.25rem;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input-col {
  min-width: 0;
}

/* ===== Floating inputs ===== */
.floating-input {
  position: relative;
}

.floating-input :deep(.q-field__control) {
  height: 50px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.5);
  border: 1.5px solid rgba(203, 213, 225, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

body.body--dark .floating-input :deep(.q-field__control) {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.4);
}

.floating-input :deep(.q-field__control):hover {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(248, 250, 252, 0.8);
}

body.body--dark .floating-input :deep(.q-field__control):hover {
  background: rgba(15, 23, 42, 0.6);
}

.floating-input :deep(.q-field--focused .q-field__control) {
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

body.body--dark .floating-input :deep(.q-field--focused .q-field__control) {
  background: rgba(15, 23, 42, 0.8);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.floating-input.filled :deep(.q-field__control) {
  border-color: rgba(59, 130, 246, 0.3);
}

.floating-input.valid :deep(.q-field__control) {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.03);
}

body.body--dark .floating-input.valid :deep(.q-field__control) {
  background: rgba(16, 185, 129, 0.05);
}

.floating-input.error :deep(.q-field__control) {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.03);
}

body.body--dark .floating-input.error :deep(.q-field__control) {
  background: rgba(239, 68, 68, 0.05);
}

.floating-label {
  position: absolute;
  left: 3rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.9375rem;
  font-weight: 500;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  padding: 0 0.25rem;
}

.floating-input :deep(.q-field--focused) ~ .floating-label,
.floating-input.filled .floating-label {
  top: 0;
  left: 2.75rem;
  font-size: 0.75rem;
  color: #3b82f6;
  background: inherit;
}

.floating-input.error .floating-label {
  color: #ef4444;
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: color 0.2s;
}

.floating-input :deep(.q-field--focused) .input-icon {
  color: #3b82f6;
}

.floating-input.error .input-icon {
  color: #ef4444;
}

.input-status {
  display: flex;
  align-items: center;
}

.input-status.success {
  color: #10b981;
}

/* ===== Password meter ===== */
.password-meter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(241, 245, 249, 0.5);
  border-radius: 10px;
}

body.body--dark .password-meter {
  background: rgba(15, 23, 42, 0.5);
}

.meter-bars {
  display: flex;
  gap: 0.375rem;
  flex: 1;
}

.meter-bar {
  flex: 1;
  height: 5px;
  background: rgba(203, 213, 225, 0.3);
  border-radius: 999px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

body.body--dark .meter-bar {
  background: rgba(51, 65, 85, 0.5);
}

.meter-bar.active[data-level="1"] {
  background: linear-gradient(90deg, #ef4444, #dc2626);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}

.meter-bar.active[data-level="2"] {
  background: linear-gradient(90deg, #f59e0b, #d97706);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.meter-bar.active[data-level="3"] {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

.meter-bar.active[data-level="4"] {
  background: linear-gradient(90deg, #10b981, #059669);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.meter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}

/* ===== Form options ===== */
.form-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(241, 245, 249, 0.4);
  border: 1px solid rgba(203, 213, 225, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

body.body--dark .option-row {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.3);
}

.option-row:hover {
  background: rgba(241, 245, 249, 0.6);
  border-color: rgba(203, 213, 225, 0.3);
}

body.body--dark .option-row:hover {
  background: rgba(15, 23, 42, 0.6);
}

.option-label {
  font-size: 0.875rem;
  color: #475569;
  flex: 1;
}

body.body--dark .option-label {
  color: #cbd5e1;
}

.link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.link:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* ===== Error banner ===== */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 3px solid #ef4444;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
}

body.body--dark .error-banner {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

/* ===== Submit button ===== */
.submit-btn {
  height: 50px;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 
    0 8px 24px rgba(59, 130, 246, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 1.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 32px rgba(59, 130, 246, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.5;
}

/* ===== Form footer ===== */
.form-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(203, 213, 225, 0.2);
}

body.body--dark .form-footer {
  border-top-color: rgba(51, 65, 85, 0.3);
}

.footer-text {
  color: #64748b;
  font-size: 0.875rem;
}

body.body--dark .footer-text {
  color: #94a3b8;
}

.footer-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.25rem;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* ===== Animations ===== */
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 100px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ===== Responsive ===== */
@media (max-width: 1024px) {
  .register-container {
    grid-template-columns: 1fr;
  }

  .register-left {
    display: none;
  }

  .register-card {
    height: auto;
    max-height: 90vh;
  }
}

@media (max-width: 768px) {
  .register-right {
    padding: 2rem 1.5rem;
  }

  .input-row {
    grid-template-columns: 1fr;
  }

  .form-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .rk-center {
    padding: 1rem;
  }

  .register-card {
    border-radius: 16px;
  }

  .register-right {
    padding: 1.5rem 1rem;
  }

  .progress-indicator {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .progress-steps {
    max-width: 100%;
  }
}

@media (min-height: 800px) {
  .register-card {
    height: 900px;
  }
}
</style>