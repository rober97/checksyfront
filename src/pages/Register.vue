<template>
  <q-page
    class="rk-login q-pa-md"
    :class="isDark ? 'rk-bg--dark' : 'rk-bg--light'"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Fondo interactivo -->
    <div class="rk-bg-layer">
      <canvas ref="particlesRef" class="rk-canvas" />
      <div class="rk-spotlight" :style="spotStyle" aria-hidden="true"></div>
    </div>

    <div class="rk-center">
      <q-card class="login-card" flat bordered>
        <!-- Header -->
        <q-card-section class="text-center q-pt-lg q-pb-md">
          <div class="rk-logo-wrap">
            <div class="rk-logo"><q-icon name="bolt" /></div>
          </div>
          <div class="text-h5 text-weight-bold q-mt-sm">Crear cuenta</div>
          <div class="text-subtitle2 rk-muted">Regístrate para usar <b>Recksy</b></div>
        </q-card-section>

        <!-- Formulario -->
        <q-form @submit.prevent="onSubmit" class="q-gutter-md q-px-lg q-pb-md">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.firstName" label="Nombre" outlined dense
                       :disable="loading" :rules="[rules.required]">
                <template #prepend><q-icon name="person" color="primary" /></template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.lastName" label="Apellido" outlined dense :disable="loading">
                <template #prepend><q-icon name="badge" color="primary" /></template>
              </q-input>
            </div>
          </div>

          <q-input v-model="form.email" label="Correo electrónico" type="email" autocomplete="email"
                   outlined dense clearable :disable="loading" :rules="[rules.required, rules.email]"
                   @blur="form.email = (form.email || '').trim().toLowerCase()">
            <template #prepend><q-icon name="mail" color="primary" /></template>
            <template #after>
              <q-badge v-if="emailOk" color="positive" outline>ok</q-badge>
            </template>
          </q-input>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input ref="pwdRef" v-model="form.password" :type="showPwd ? 'text' : 'password'"
                       label="Contraseña" autocomplete="new-password" outlined dense :disable="loading"
                       :rules="[rules.required, rules.minPwd]" @keyup="onPwdKey">
                <template #prepend><q-icon name="lock" color="primary" /></template>
                <template #append>
                  <q-btn flat dense round :icon="showPwd ? 'visibility_off' : 'visibility'"
                         color="grey" @click="showPwd = !showPwd" />
                  <q-btn flat dense round icon="auto_fix_high" color="grey" @click="genPwd"
                         :title="'Generar contraseña segura'"/>
                </template>
                <template #hint>
                  <span v-if="capsOn" class="text-negative text-bold">⚠ Mayúsculas activadas</span>
                </template>
              </q-input>
            </div>

            <div class="col-12 col-sm-6">
              <q-input v-model="form.passwordConfirm" :type="showPwd ? 'text' : 'password'"
                       label="Confirmar contraseña" autocomplete="new-password" outlined dense
                       :disable="loading" :rules="[rules.matchPwd]">
                <template #prepend><q-icon name="lock_reset" color="primary" /></template>
              </q-input>
            </div>
          </div>

          <!-- Medidor -->
          <div class="row items-center justify-between q-gutter-xs">
            <q-linear-progress :value="pwdStrength.pct" rounded :color="pwdStrength.color"
                               class="col-grow rk-pwd-meter" />
            <div class="text-caption rk-muted q-ml-sm" style="min-width:64px;text-align:right;">
              {{ pwdStrength.label }}
            </div>
          </div>

          <!-- Código de invitación (opcional) -->
          <q-input v-model="form.inviteCode" label="Código de invitación (opcional)"
                   outlined dense clearable :disable="loading">
            <template #prepend><q-icon name="key" color="primary" /></template>
          </q-input>

          <div class="row items-center justify-between">
            <q-checkbox v-model="accept" :disable="loading"
                        label="Acepto los términos y la política de privacidad" />
            <q-toggle v-model="autoLogin" :disable="loading" label="Ingresar automáticamente" />
          </div>

          <!-- Error -->
          <transition name="fade">
            <q-banner v-if="formError" class="bg-red-2 text-negative q-pa-sm rounded-borders" dense>
              <q-icon name="error" color="negative" class="q-mr-sm" />{{ formError }}
            </q-banner>
          </transition>

          <!-- Botón -->
          <q-btn type="submit" color="primary" class="full-width q-mt-sm login-btn" unelevated
                 :loading="loading" :disable="!canSubmit || loading">
            <q-icon left name="person_add" /> CREAR CUENTA
          </q-btn>

          <div class="text-center text-caption q-mt-xs" :class="isDark ? 'text-grey-4' : 'text-grey-7'">
            ¿Ya tienes cuenta?
            <router-link to="/login">Inicia sesión</router-link>
          </div>
        </q-form>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/authStore'  // <-- Pinia

const { dark, notify } = useQuasar()
const isDark = computed(() => dark.isActive)
const router = useRouter()
const auth = useAuthStore()

/* ===== estado ===== */
const form = ref({
  firstName: '', lastName: '', email: '',
  password: '', passwordConfirm: '',
  inviteCode: ''
})
const showPwd   = ref(false)
const capsOn    = ref(false)
const loading   = ref(false)
const formError = ref('')
const accept    = ref(false)
const autoLogin = ref(true)
const pwdRef    = ref(null)

/* ===== reglas ===== */
const rules = {
  required : v => !!String(v || '').trim() || 'Obligatorio',
  email    : v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim()) || 'Correo inválido',
  minPwd   : v => String(v||'').length >= 8 || 'Mínimo 8 caracteres',
  matchPwd : v => v === form.value.password || 'Las contraseñas no coinciden'
}
const emailOk = computed(() => rules.email(form.value.email) === true)
function onPwdKey (e){ capsOn.value = e.getModifierState && e.getModifierState('CapsLock') }

/* fuerza contraseña + tips */
const pwdStrength = computed(() => {
  const v = String(form.value.password || '')
  if (!v) return { pct: 0, color: 'grey-5', label: '—' }
  let s = 0
  if (v.length >= 8) s++
  if (v.length >= 12) s++
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++
  if (/\d/.test(v)) s++
  if (/[^A-Za-z0-9]/.test(v)) s++
  const pct = Math.min(1, s/5)
  const color = pct > 0.8 ? 'positive' : pct > 0.5 ? 'warning' : 'orange-5'
  const label = pct > 0.8 ? 'Fuerte'    : pct > 0.5 ? 'Aceptable' : 'Débil'
  return { pct, color, label }
})

const canSubmit = computed(() =>
  accept.value &&
  rules.required(form.value.firstName) === true &&
  rules.required(form.value.email) === true &&
  rules.email(form.value.email) === true &&
  rules.minPwd(form.value.password) === true &&
  rules.matchPwd(form.value.passwordConfirm) === true
)

/* generador de contraseña */
function genPwd () {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%*_'
  let out = ''
  for (let i = 0; i < 12; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
  form.value.password = out
  form.value.passwordConfirm = ''
  nextTick(() => pwdRef.value?.focus?.())
}

/* submit conectado a Pinia */
async function onSubmit () {
  formError.value = ''
  if (!canSubmit.value) { formError.value = 'Revisa los campos del formulario.'; return }
  loading.value = true
  try {
    // acción de Pinia (ver más abajo)
    await auth.register({
      firstName: form.value.firstName,
      lastName : form.value.lastName,
      email    : (form.value.email || '').trim().toLowerCase(),
      password : form.value.password,
      inviteCode: (form.value.inviteCode || '').trim() || null
    })

    notify({ type: 'positive', message: 'Cuenta creada correctamente.' })

    if (autoLogin.value) {
      await auth.login({ email: form.value.email, password: form.value.password })
      router.replace('/')
    } else {
      router.replace('/login')
    }
  } catch (e) {
    formError.value = e?.message || 'Error creando la cuenta'
  } finally {
    loading.value = false
  }
}

/* ===== Fondo interactivo (igual a Login) ===== */
const particlesRef = ref(null)
let ctx, W, H, rafId, lastT = 0
const MOUSE = { x: -9999, y: -9999, r: 160 }
const particles = []
const rand = (a,b)=>a+Math.random()*(b-a)
function make(){ return { x:rand(0,W), y:rand(0,H), vx:rand(-.4,.4), vy:rand(-.4,.4), r:rand(1,2) } }
function init(){
  const c = particlesRef.value; if(!c) return
  const dpr = devicePixelRatio||1; W=c.clientWidth; H=c.clientHeight
  c.width=W*dpr; c.height=H*dpr; ctx=c.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0)
  particles.length=0; for(let i=0;i<120;i++) particles.push(make()); lastT=performance.now()
}
function step(now){
  if(!ctx) return
  const dt = Math.min(.033, (now-lastT)/1000 || .016); lastT = now
  ctx.clearRect(0,0,W,H)
  for(const p of particles){
    const mx = p.x-MOUSE.x, my = p.y-MOUSE.y, d2 = mx*mx+my*my
    if(d2 < MOUSE.r*MOUSE.r){ const d=Math.sqrt(d2)||.001; p.vx += (mx/d)*.08; p.vy += (my/d)*.08 }
    p.vx*=.992; p.vy*=.992; p.x+=p.vx; p.y+=p.vy
    if(p.x< -12) p.x=W+12; else if(p.x>W+12) p.x=-12
    if(p.y< -12) p.y=H+12; else if(p.y>H+12) p.y=-12
  }
  for(const p of particles){ ctx.fillStyle=isDark.value?'rgba(160,200,255,.9)':'rgba(70,120,200,.9)'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill() }
  rafId=requestAnimationFrame(step)
}
function onMouseMove(e){ const r=particlesRef.value?.getBoundingClientRect(); if(!r) return; MOUSE.x=e.clientX-r.left; MOUSE.y=e.clientY-r.top; mouseX.value=MOUSE.x; mouseY.value=MOUSE.y }
function onMouseLeave(){ MOUSE.x=MOUSE.y=-9999; mouseX.value=mouseY.value=-9999 }
onMounted(async()=>{ await nextTick(); init(); rafId=requestAnimationFrame(step); window.addEventListener('resize', init) })
onBeforeUnmount(()=>{ window.removeEventListener('resize', init); cancelAnimationFrame(rafId) })

/* spotlight */
const mouseX = ref(-9999), mouseY = ref(-9999)
const spotStyle = computed(()=>({ transform:`translate(${mouseX.value-220}px, ${mouseY.value-220}px)` }))
</script>

<style scoped>
/* Reusa estilos del Login */
.rk-login{ position:relative; min-height:100vh; overflow:hidden; }
.rk-bg--light{
  background:
    radial-gradient(1000px 600px at 10% 90%, #b9f3df33, transparent 60%),
    radial-gradient(900px 520px at 85% 10%, #c8dbff33, transparent 60%),
    linear-gradient(135deg, #eef3f7, #dde4eb);
}
.rk-bg--dark{
  background:
    radial-gradient(1000px 600px at 10% 90%, #2fd6a733, transparent 60%),
    radial-gradient(900px 520px at 85% 10%, #8ab4ff2b, transparent 60%),
    linear-gradient(135deg, #181a1e, #23262b);
}
.rk-bg-layer{ position:absolute; inset:0; pointer-events:none; }
.rk-canvas{ position:absolute; inset:0; width:100%; height:100%; display:block; }
.rk-spotlight{
  position:absolute; width:440px; height:440px; border-radius:50%;
  pointer-events:none; mix-blend-mode:soft-light; filter:blur(18px);
  background:
    radial-gradient(closest-side, rgba(255,255,255,.40), rgba(255,255,255,0) 65%),
    conic-gradient(from 0deg, rgba(255,255,255,.28), rgba(255,255,255,0) 65%);
  transition: transform .04s linear;
}
.rk-center{ position:relative; z-index:1; min-height:100vh; display:grid; place-items:center; }
.login-card{
  width:100%; max-width:460px; border-radius:18px; overflow:hidden;
  border:1px solid rgba(127,127,127,.14);
  background:rgba(255,255,255,.82); backdrop-filter: blur(12px) saturate(1.1);
  box-shadow: 0 30px 80px rgba(15,23,42,.18), inset 0 0 0 1px rgba(255,255,255,.18);
  transform: translateZ(0);
  animation: cardIn .45s ease both;
}
body.body--dark .login-card{
  background: rgba(22,22,24,.78); border-color: rgba(255,255,255,.08);
  box-shadow: 0 30px 80px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.06);
}
@keyframes cardIn{ from{opacity:0; transform: translateY(12px) scale(.99)} to{opacity:1; transform: translateY(0) scale(1)} }
.rk-logo-wrap{ display:flex; justify-content:center; }
.rk-logo{
  width:52px; height:52px; display:grid; place-items:center; color:#fff; border-radius:14px;
  background: radial-gradient(120% 120% at 20% 15%, #4f8cff, #2e6bff 60%), linear-gradient(90deg, #2e6bff, #14b8a6);
  box-shadow: 0 10px 24px rgba(46,107,255,.35), inset 0 0 14px rgba(255,255,255,.25);
}
.rk-muted{ color: var(--rk-muted, #6b7280); }
.rk-pwd-meter{ height:8px; border-radius:999px; background: rgba(127,127,127,.18); }
.login-btn{
  border-radius: 12px; font-weight:700; letter-spacing:.2px;
  box-shadow: 0 10px 22px rgba(37,99,235,.28);
  transition: transform .12s ease, box-shadow .2s ease;
}
.login-btn:hover{ transform: translateY(-1px); box-shadow: 0 16px 30px rgba(37,99,235,.34); }
.login-btn :deep(.q-btn__content){ width:100%; justify-content:center; }
.fade-enter-active,.fade-leave-active{ transition: opacity .25s }
.fade-enter-from,.fade-leave-to{ opacity:0 }
</style>
