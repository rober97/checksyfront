<template>
  <q-page
    class="rk-login q-pa-md"
    :class="isDark ? 'rk-bg--dark' : 'rk-bg--light'"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- FONDO INTERACTIVO -->
    <div class="rk-bg-layer">
      <canvas ref="particlesRef" class="rk-canvas" />
      <div class="rk-spotlight" :style="spotStyle" aria-hidden="true"></div>
    </div>

    <!-- CONTENEDOR CENTRADO -->
    <div class="rk-center">
      <q-card class="login-card" flat bordered>
        <!-- Header -->
        <q-card-section class="text-center q-pt-lg q-pb-md">
          <div class="rk-logo-wrap">
            <div class="rk-logo">
              <q-icon name="bolt" />
            </div>
          </div>
          <div class="text-h5 text-weight-bold q-mt-sm">Iniciar sesión</div>
          <div class="text-subtitle2 rk-muted">Bienvenido a <b>Recksy</b></div>
        </q-card-section>

        <!-- Form -->
        <q-form
          @submit.prevent="handleLogin"
          class="q-gutter-md q-px-lg q-pb-md"
        >
          <q-input
            ref="emailRef"
            v-model="email"
            label="Correo electrónico"
            type="email"
            autocomplete="email"
            outlined
            dense
            clearable
            :disable="loading"
            :rules="[rules.required, rules.email]"
            :color="isDark ? 'blue-4' : 'primary'"
            @keydown.enter.prevent="focusPassword"
          >
            <template #prepend>
              <q-icon name="mail" color="primary" />
            </template>
          </q-input>

          <q-input
            ref="passwordRef"
            v-model="password"
            :type="showPwd ? 'text' : 'password'"
            label="Contraseña"
            autocomplete="current-password"
            outlined
            dense
            :disable="loading"
            :rules="[rules.required, rules.minPwd]"
            :color="isDark ? 'blue-4' : 'primary'"
            @keyup="onPasswordKeyUp"
          >
            <template #prepend>
              <q-icon name="lock" color="primary" />
            </template>
            <template #append>
              <q-icon
                :name="showPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="grey"
                @click="showPwd = !showPwd"
              />
            </template>
            <template #hint>
              <span v-if="capsOn" class="text-negative text-bold"
                >⚠ Caps Lock activado</span
              >
            </template>
          </q-input>

          <!-- Fuerza de contraseña -->
          <div class="row items-center justify-between q-gutter-xs">
            <q-linear-progress
              :value="pwdStrength.pct"
              rounded
              :color="pwdStrength.color"
              class="col-grow rk-pwd-meter"
            />
            <div
              class="text-caption rk-muted q-ml-sm"
              style="min-width: 64px; text-align: right"
            >
              {{ pwdStrength.label }}
            </div>
          </div>

          <!-- Opciones -->
          <div class="row items-center justify-between q-mt-xs">
            <q-toggle
              v-model="remember"
              :disable="loading"
              label="Recordarme"
            />
            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              :disable="loading"
              label="¿Olvidaste tu contraseña?"
              @click="forgotPassword"
            />
          </div>

          <!-- Error -->
          <transition name="fade">
            <q-banner
              v-if="formError"
              class="bg-red-2 text-negative q-pa-sm rounded-borders"
              dense
            >
              <q-icon name="error" color="negative" class="q-mr-sm" />
              {{ formError }}
            </q-banner>
          </transition>

          <!-- Botón principal -->
          <q-btn
            type="submit"
            color="primary"
            class="full-width q-mt-sm login-btn"
            unelevated
            :loading="loading"
            :disable="loading"
          >
            <q-icon left name="login" />
            INGRESAR
          </q-btn>
        </q-form>

        <!-- Footer -->
        <q-card-section
          class="text-center text-caption q-pb-lg"
          :class="isDark ? 'text-grey-4' : 'text-grey-7'"
        >
          ¿No tienes cuenta?
          <q-btn
            flat
            dense
            size="sm"
            color="secondary"
            label="CONTACTA A SOPORTE"
            @click="register"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "@/stores/authStore";

const { dark } = useQuasar();
const isDark = computed(() => dark.isActive);

const router = useRouter();
const auth = useAuthStore();

/* ===== Form ===== */
const email = ref(localStorage.getItem("last_email") || "");
const password = ref("");
const remember = ref(!!localStorage.getItem("last_email"));
const loading = ref(false);
const formError = ref("");
const showPwd = ref(false);
const capsOn = ref(false);

const emailRef = ref(null);
const passwordRef = ref(null);

const rules = {
  required: (v) => !!String(v || "").trim() || "Campo requerido",
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim()) ||
    "Email inválido",
  minPwd: (v) => String(v || "").length >= 6 || "Mínimo 6 caracteres",
};

function focusPassword() {
  passwordRef.value?.focus?.();
}
function forgotPassword() {
  console.info("Recuperación de contraseña");
}

//function soporte () { window.open('mailto:soporte@recksy.cl', '_blank') }
function register() {
  router.push("/register");
}

function onPasswordKeyUp(e) {
  capsOn.value = e.getModifierState && e.getModifierState("CapsLock");
}

/* Fuerza contraseña simple */
const pwdStrength = computed(() => {
  const v = String(password.value || "");
  if (!v) return { pct: 0, color: "grey-5", label: "—" };
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  const pct = Math.min(1, s / 5);
  const color = pct > 0.8 ? "positive" : pct > 0.5 ? "warning" : "orange-5";
  const label = pct > 0.8 ? "Fuerte" : pct > 0.5 ? "Aceptable" : "Débil";
  return { pct, color, label };
});

async function handleLogin() {
  formError.value = "";
  const emailOk =
    rules.required(email.value) === true && rules.email(email.value) === true;
  const pwdOk =
    rules.required(password.value) === true &&
    rules.minPwd(password.value) === true;
  if (!emailOk || !pwdOk) {
    formError.value = "Revisa los campos del formulario.";
    return;
  }
  if (!navigator.onLine) {
    formError.value = "Sin conexión a internet.";
    return;
  }
  if (loading.value) return;

  loading.value = true;
  try {
    await auth.login({ email: email.value.trim(), password: password.value });
    if (remember.value) localStorage.setItem("last_email", email.value.trim());
    else localStorage.removeItem("last_email");
    await router.replace("/");
  } catch (err) {
    formError.value =
      err?.response?.data?.message || err?.message || "Error de servidor";
  } finally {
    loading.value = false;
  }
}

/* ===== Fondo interactivo (partículas + spotlight) ===== */
const particlesRef = ref(null);
let ctx,
  W,
  H,
  rafId,
  lastT = 0,
  spawnAcc = 0;

// Mouse / fuerzas
const MOUSE = { x: -9999, y: -9999, r: 160 };
const REPULSE_STRENGTH = 0.18;
const FRICTION = 0.992;
const SPEED_LIMIT = 0.5;

// Partículas con vida y re-spawn
const particles = [];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
let TARGET_COUNT = 120;
const SPAWN_EVERY = 0.35; // s

function makeParticle(edge = false) {
  let x = rand(0, W),
    y = rand(0, H);
  if (edge) {
    const side = Math.floor(rand(0, 4));
    if (side === 0) {
      x = -8;
      y = rand(0, H);
    } // izquierda
    if (side === 1) {
      x = W + 8;
      y = rand(0, H);
    } // derecha
    if (side === 2) {
      x = rand(0, W);
      y = -8;
    } // arriba
    if (side === 3) {
      x = rand(0, W);
      y = H + 8;
    } // abajo
  }
  const angle = Math.atan2(H / 2 - y, W / 2 - x) + rand(-0.6, 0.6);
  return {
    x,
    y,
    vx: Math.cos(angle) * rand(0.2, 0.6),
    vy: Math.sin(angle) * rand(0.2, 0.6),
    r: rand(1.0, 2.2),
    life: rand(8, 20), // segundos
    seed: Math.random() * 1000, // para wander
  };
}
function respawn(p, edge = true) {
  Object.assign(p, makeParticle(edge));
}

function initCanvas() {
  const c = particlesRef.value;
  if (!c) return;
  const dpr = window.devicePixelRatio || 1;
  W = c.clientWidth;
  H = c.clientHeight;
  c.width = W * dpr;
  c.height = H * dpr;
  ctx = c.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  particles.length = 0;
  TARGET_COUNT = clamp(Math.round((W * H) / 18000), 80, 200);
  for (let i = 0; i < TARGET_COUNT; i++) particles.push(makeParticle(false));
  lastT = performance.now();
  spawnAcc = 0;
}

function step(now) {
  if (!ctx) return;
  const dt = Math.min(0.033, (now - lastT) / 1000 || 0.016); // máx ~30fps dt
  lastT = now;
  spawnAcc += dt;

  ctx.clearRect(0, 0, W, H);

  // brisa global + wander por partícula
  const windX = Math.cos(now * 0.0003) * 0.06;
  const windY = Math.sin(now * 0.0004) * 0.06;

  for (const p of particles) {
    // Wander (ruido barato)
    const wanderX = Math.cos(now * 0.001 + p.seed) * 0.03;
    const wanderY = Math.sin(now * 0.0012 + p.seed) * 0.03;
    p.vx += windX + wanderX;
    p.vy += windY + wanderY;

    // Repulsión
    const mx = p.x - MOUSE.x;
    const my = p.y - MOUSE.y;
    const d2 = mx * mx + my * my;
    const rr = MOUSE.r * MOUSE.r;
    if (d2 < rr) {
      const d = Math.sqrt(d2) || 0.0001;
      const nx = mx / d,
        ny = my / d;
      const force = (1 - d / MOUSE.r) * REPULSE_STRENGTH;
      p.vx += nx * force;
      p.vy += ny * force;
    }

    // Integración
    p.vx *= FRICTION;
    p.vy *= FRICTION;
    p.vx = clamp(p.vx, -SPEED_LIMIT, SPEED_LIMIT);
    p.vy = clamp(p.vy, -SPEED_LIMIT, SPEED_LIMIT);
    p.x += p.vx;
    p.y += p.vy;

    // wrap suave
    if (p.x < -12) p.x = W + 12;
    else if (p.x > W + 12) p.x = -12;
    if (p.y < -12) p.y = H + 12;
    else if (p.y > H + 12) p.y = -12;

    // vida
    p.life -= dt;
    if (p.life <= 0) respawn(p, true);
  }

  // spawner para mantener densidad objetivo
  if (particles.length < TARGET_COUNT) {
    while (spawnAcc > SPAWN_EVERY && particles.length < TARGET_COUNT) {
      particles.push(makeParticle(true));
      spawnAcc -= SPAWN_EVERY;
    }
  } else if (particles.length > TARGET_COUNT) {
    particles.length = TARGET_COUNT;
  }

  // Líneas
  ctx.lineWidth = 1;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i],
        b = particles[j];
      const dx = a.x - b.x,
        dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120) {
        const midx = (a.x + b.x) / 2,
          midy = (a.y + b.y) / 2;
        const mdx = midx - MOUSE.x,
          mdy = midy - MOUSE.y;
        const inMouse = mdx * mdx + mdy * mdy < MOUSE.r * MOUSE.r;
        const alpha = (1 - d2 / (120 * 120)) * (inMouse ? 0.1 : 0.32);
        ctx.strokeStyle = `rgba(100,181,246,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  // Puntos
  for (const p of particles) {
    ctx.fillStyle = isDark.value
      ? "rgba(160,200,255,0.9)"
      : "rgba(70,120,200,0.9)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  rafId = requestAnimationFrame(step);
}

function onResize() {
  initCanvas();
}
function onMouseMove(e) {
  const rect = particlesRef.value?.getBoundingClientRect();
  if (!rect) return;
  MOUSE.x = e.clientX - rect.left;
  MOUSE.y = e.clientY - rect.top;
  mouseX.value = MOUSE.x;
  mouseY.value = MOUSE.y;
}
function onMouseLeave() {
  MOUSE.x = -9999;
  MOUSE.y = -9999;
  mouseX.value = -9999;
  mouseY.value = -9999;
}

onMounted(async () => {
  await nextTick();
  initCanvas();
  rafId = requestAnimationFrame(step);
  window.addEventListener("resize", onResize);
  // focus UX
  if (!email.value) emailRef.value?.focus?.();
  else passwordRef.value?.focus?.();
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  cancelAnimationFrame(rafId);
});

/* Spotlight (div que sigue al mouse) */
const mouseX = ref(-9999);
const mouseY = ref(-9999);
const spotStyle = computed(() => {
  const x = mouseX.value - 220;
  const y = mouseY.value - 220;
  return { transform: `translate(${x}px, ${y}px)` };
});
</script>

<style scoped>
/* ===== Fondo / Layout ===== */
.rk-login {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}
.rk-bg--light {
  background: radial-gradient(
      1000px 600px at 10% 90%,
      #b9f3df33,
      transparent 60%
    ),
    radial-gradient(900px 520px at 85% 10%, #c8dbff33, transparent 60%),
    linear-gradient(135deg, #eef3f7, #dde4eb);
}
.rk-bg--dark {
  background: radial-gradient(
      1000px 600px at 10% 90%,
      #2fd6a733,
      transparent 60%
    ),
    radial-gradient(900px 520px at 85% 10%, #8ab4ff2b, transparent 60%),
    linear-gradient(135deg, #181a1e, #23262b);
}
.rk-bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.rk-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.rk-spotlight {
  position: absolute;
  width: 440px;
  height: 440px;
  border-radius: 50%;
  pointer-events: none;
  mix-blend-mode: soft-light;
  filter: blur(18px);
  background: radial-gradient(
      closest-side,
      rgba(255, 255, 255, 0.4),
      rgba(255, 255, 255, 0) 65%
    ),
    conic-gradient(
      from 0deg,
      rgba(255, 255, 255, 0.28),
      rgba(255, 255, 255, 0) 65%
    );
  transition: transform 0.04s linear;
}

/* ===== Centro ===== */
.rk-center {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  place-items: center;
}

/* ===== Card ===== */
.login-card {
  width: 100%;
  max-width: 460px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(127, 127, 127, 0.14);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px) saturate(1.1);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  transform: translateZ(0);
  animation: cardIn 0.45s ease both;
}
body.body--dark .login-card {
  background: rgba(22, 22, 24, 0.78);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Logo pill */
.rk-logo-wrap {
  display: flex;
  justify-content: center;
}
.rk-logo {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  color: #fff;
  border-radius: 14px;
  background: radial-gradient(120% 120% at 20% 15%, #4f8cff, #2e6bff 60%),
    linear-gradient(90deg, #2e6bff, #14b8a6);
  box-shadow: 0 10px 24px rgba(46, 107, 255, 0.35),
    inset 0 0 14px rgba(255, 255, 255, 0.25);
}

/* Muted */
.rk-muted {
  color: var(--rk-muted, #6b7280);
}

/* Barra fuerza password */
.rk-pwd-meter {
  height: 8px;
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.18);
}

/* Botón principal centrado y con micro-anim */
.login-btn {
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.28);
  transition: transform 0.12s ease, box-shadow 0.2s ease;
}
.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.34);
}
.login-btn :deep(.q-btn__content) {
  width: 100%;
  justify-content: center;
}

/* Anim comunes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
