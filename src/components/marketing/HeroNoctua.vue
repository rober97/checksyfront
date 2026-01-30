<template>
  <section class="rk-hero">
    <div class="rk-hero-bg">
      <div class="rk-grid-lines"></div>
      <div class="rk-gradient-sphere rk-sphere-1"></div>
      <div class="rk-gradient-sphere rk-sphere-2"></div>
      <div class="rk-gradient-sphere rk-sphere-3"></div>
      <div class="rk-particles">
        <div v-for="i in 30" :key="i" class="rk-particle" :style="particleStyle(i)"></div>
      </div>
    </div>

    <div class="rk-hero-container">
      <div class="rk-hero-grid">
        <div class="rk-hero-content">
          <div class="rk-hero-badges">
            <div class="rk-badge-main">
              <span class="rk-pulse"></span>
              <q-icon name="auto_awesome" />
              <span>Plataforma integral</span>
            </div>
            <div class="rk-badge-secondary">
              <span>Asistencia • Desempeño • Bienestar</span>
            </div>
          </div>

          <h1 class="rk-hero-title">
            <span class="rk-title-line">Gestiona con</span>
            <span class="rk-highlight">
              <span class="rk-highlight-text">precisión</span>
              <svg
                class="rk-underline"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,7 Q50,0 100,7 T200,7"
                  fill="none"
                  stroke="url(#grad)"
                  stroke-width="3"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" x2="100%">
                    <stop offset="0%" style="stop-color: #06b6d4; stop-opacity: 0.6" />
                    <stop offset="100%" style="stop-color: #22d3ee; stop-opacity: 0.8" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <br />
            <span class="rk-title-line">y estilo.</span>
          </h1>

          <p class="rk-description">
            Suite moderna para equipos exigentes: UX impecable, datos en tiempo
            real y automatizaciones que
            <strong>ahorran horas cada semana</strong>.
          </p>

          <div class="rk-actions">
            <q-btn
              unelevated
              no-caps
              class="rk-btn-primary"
              @click="navigateTo('register')"
            >
              Probar gratis 14 días
              <q-icon name="arrow_forward" />
            </q-btn>
            <q-btn
              unelevated
              no-caps
              class="rk-btn-secondary"
              @click="navigateTo('demo')"
            >
              <q-icon name="play_circle" />
              Ver demo
            </q-btn>
          </div>

          <div class="rk-trust">
            <div class="rk-trust-item">
              <q-icon name="verified_user" />
              <span>Certificado ISO 27001</span>
            </div>
            <div class="rk-trust-item">
              <q-icon name="lock" />
              <span>Encriptación bancaria</span>
            </div>
            <div class="rk-trust-item">
              <q-icon name="support" />
              <span>Soporte 24/7</span>
            </div>
          </div>

          <div class="rk-stats">
            <div class="rk-stat">
              <div class="rk-stat-value">250+</div>
              <div class="rk-stat-label">Empresas activas</div>
            </div>
            <div class="rk-divider"></div>
            <div class="rk-stat">
              <div class="rk-stat-value">1200+</div>
              <div class="rk-stat-label">Horas ahorradas/mes</div>
            </div>
            <div class="rk-divider"></div>
            <div class="rk-stat">
              <div class="rk-stat-value">99.9%</div>
              <div class="rk-stat-label">Uptime garantizado</div>
            </div>
          </div>
        </div>

        <div class="rk-hero-visual">
          <div class="rk-visual-badges">
            <div class="rk-badge-float rk-badge-1">
              <q-icon name="bolt" />
              <span>Rápido</span>
            </div>
            <div class="rk-badge-float rk-badge-2">
              <q-icon name="shield" />
              <span>Seguro</span>
            </div>
          </div>

          <div
            class="rk-visual-card"
            @mouseenter="hover = true"
            @mousemove="handleMove"
            @mouseleave="handleLeave"
            ref="card"
          >
            <div class="rk-glow"></div>
            <div class="rk-glow-2"></div>
            <div class="rk-image-wrap" :style="transform">
              <q-img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"
                ratio="16/10"
                class="rk-img"
              >
                <template v-slot:loading>
                  <div class="rk-loading">
                    <q-spinner-dots color="primary" size="50px" />
                  </div>
                </template>
              </q-img>
              <div class="rk-overlay"></div>
            </div>

            <div class="rk-kpis">
              <div v-for="(k, i) in kpis" :key="i" class="rk-kpi" :style="kpiDelay(i)">
                <div class="rk-kpi-top">
                  <span>{{ k.title }}</span>
                  <q-icon :name="k.icon" :class="k.class" size="16px" />
                </div>
                <div class="rk-kpi-val">{{ k.value }}</div>
                <div class="rk-kpi-chg" :class="k.class">{{ k.change }}</div>
              </div>
            </div>
          </div>

          <div class="rk-badge-bottom">
            <q-icon name="emoji_events" />
            <span>Premium</span>
          </div>
        </div>
      </div>
    </div>

    <div class="rk-scroll">
      <div class="rk-mouse"><div class="rk-wheel"></div></div>
      <span>Descubre más</span>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const kpis = [
  {
    title: "Asistencia",
    value: "98.5%",
    change: "+2.3%",
    icon: "trending_up",
    class: "text-positive",
  },
  {
    title: "Productividad",
    value: "127%",
    change: "+15%",
    icon: "trending_up",
    class: "text-positive",
  },
  {
    title: "Satisfacción",
    value: "4.8/5",
    change: "+0.4",
    icon: "trending_up",
    class: "text-positive",
  },
];

const card = ref(null);
const hover = ref(false);
const x = ref(0.5);
const y = ref(0.5);

const transform = computed(() => {
  if (!hover.value)
    return "transform:perspective(1200px)rotateX(0)rotateY(0)scale(1);transition:transform .6s cubic-bezier(0.4,0,0.2,1);";
  const rx = (y.value - 0.5) * 12;
  const ry = (x.value - 0.5) * -12;
  return `transform:perspective(1200px)rotateX(${rx}deg)rotateY(${ry}deg)scale(1.03);transition:transform .15s ease-out;`;
});

const handleMove = (e) => {
  if (!card.value) return;
  const r = card.value.getBoundingClientRect();
  x.value = (e.clientX - r.left) / r.width;
  y.value = (e.clientY - r.top) / r.height;
};

const handleLeave = () => {
  hover.value = false;
  x.value = 0.5;
  y.value = 0.5;
};

const particleStyle = (i) => {
  const delay = Math.random() * 20;
  const duration = 15 + Math.random() * 25;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  return {
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
};

const kpiDelay = (i) => ({
  animationDelay: `${0.8 + i * 0.15}s`,
});

const navigateTo = (routeName) => {
  if (routeName === 'register') {
    router.push({ name: 'Register' });
  } else if (routeName === 'demo') {
    // Si tienes una ruta de demo, agrégala aquí
    // Por ahora, navegamos a login como ejemplo
    router.push({ name: 'Login' });
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');

:root {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-primary-dark: #0891b2;
  --color-accent: #14b8a6;
  --color-bg-dark: #0a0e14;
  --color-bg-darker: #050810;
  --color-surface: rgba(6, 182, 212, 0.05);
  --color-surface-hover: rgba(6, 182, 212, 0.1);
  --color-border: rgba(6, 182, 212, 0.15);
  --color-text: rgba(255, 255, 255, 0.95);
  --color-text-muted: rgba(255, 255, 255, 0.65);
}

.rk-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: clamp(6rem, 12vh, 10rem) 0 clamp(4rem, 8vh, 6rem);
  overflow: hidden;
  background: radial-gradient(ellipse at top left, #0a1628, var(--color-bg-darker)),
              radial-gradient(ellipse at bottom right, #0d1b2a, var(--color-bg-dark));
  font-family: 'Sora', -apple-system, sans-serif;
}

.rk-hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.rk-grid-lines {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.04) 1.5px, transparent 1.5px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.04) 1.5px, transparent 1.5px);
  background-size: 80px 80px;
  mask-image: radial-gradient(ellipse at center, #000 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent 75%);
  animation: gridPulse 8s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

.rk-gradient-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;
  animation: float 30s ease-in-out infinite;
  mix-blend-mode: screen;
}

.rk-sphere-1 {
  width: 600px;
  height: 600px;
  top: -250px;
  left: -150px;
  background: radial-gradient(circle, var(--color-primary), transparent 65%);
}

.rk-sphere-2 {
  width: 500px;
  height: 500px;
  top: 35%;
  right: -200px;
  background: radial-gradient(circle, var(--color-accent), transparent 65%);
  animation-delay: -15s;
}

.rk-sphere-3 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: 30%;
  background: radial-gradient(circle, var(--color-primary-light), transparent 65%);
  animation-delay: -7s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  33% {
    transform: translate(60px, -60px) scale(1.15) rotate(120deg);
  }
  66% {
    transform: translate(-60px, 60px) scale(0.85) rotate(240deg);
  }
}

.rk-particles {
  position: absolute;
  inset: 0;
}

.rk-particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: var(--color-primary-light);
  border-radius: 50%;
  opacity: 0;
  animation: particleFloat 20s linear infinite;
  box-shadow: 0 0 8px var(--color-primary-light);
}

@keyframes particleFloat {
  0% {
    opacity: 0;
    transform: translateY(0) translateX(0);
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: translateY(-100vh) translateX(50px);
  }
}

.rk-hero-container {
  position: relative;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 5vw, 3rem);
  width: 100%;
  z-index: 2;
}

.rk-hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(4rem, 8vw, 8rem);
  align-items: center;
}

.rk-hero-content {
  max-width: 660px;
  animation: fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rk-hero-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 32px;
  animation: fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
}

.rk-badge-main,
.rk-badge-secondary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 20px;
  backdrop-filter: blur(16px);
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 700;
  position: relative;
  letter-spacing: 0.3px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-badge-main {
  background: rgba(6, 182, 212, 0.12);
  border: 1.5px solid rgba(6, 182, 212, 0.3);
  color: var(--color-primary-light);
  padding-left: 16px;
  box-shadow: 0 4px 24px rgba(6, 182, 212, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.rk-badge-main:hover {
  background: rgba(6, 182, 212, 0.18);
  border-color: rgba(6, 182, 212, 0.5);
  box-shadow: 0 6px 32px rgba(6, 182, 212, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.rk-pulse {
  position: absolute;
  width: 9px;
  height: 9px;
  background: var(--color-primary-light);
  border-radius: 50%;
  left: 20px;
  animation: pulse 2.5s ease-in-out infinite;
  box-shadow: 0 0 12px var(--color-primary-light);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.8);
    opacity: 0.3;
  }
}

.rk-badge-main .q-icon {
  color: var(--color-primary-light);
  font-size: 20px;
}

.rk-badge-secondary {
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  color: var(--color-text-muted);
}

.rk-badge-secondary:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
}

.rk-hero-title {
  font-size: clamp(2.75rem, 6vw, 5rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
  margin-bottom: 28px;
  color: var(--color-text);
  animation: fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
}

.rk-title-line {
  display: inline-block;
}

.rk-highlight {
  position: relative;
  display: inline-block;
  white-space: nowrap;
}

.rk-highlight-text {
  position: relative;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  z-index: 1;
  font-weight: 900;
  text-shadow: 0 0 40px rgba(6, 182, 212, 0.3);
}

.rk-underline {
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 12px;
  z-index: 0;
  animation: draw 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
  filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4));
}

@keyframes draw {
  from {
    stroke-dasharray: 200;
    stroke-dashoffset: 200;
  }
  to {
    stroke-dasharray: 200;
    stroke-dashoffset: 0;
  }
}

.rk-description {
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  line-height: 1.75;
  color: var(--color-text-muted);
  margin-bottom: 36px;
  max-width: 580px;
  animation: fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both;
}

.rk-description strong {
  color: var(--color-text);
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.rk-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 44px;
  animation: fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both;
}

.rk-btn-primary,
.rk-btn-secondary {
  padding: 17px 34px;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  border-radius: 14px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.rk-btn-primary::before,
.rk-btn-secondary::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  box-shadow: 0 10px 32px rgba(6, 182, 212, 0.35),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
}

.rk-btn-primary::before {
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
}

.rk-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 40px rgba(6, 182, 212, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.rk-btn-primary:hover::before {
  opacity: 1;
}

.rk-btn-primary .q-icon {
  font-size: 22px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.rk-btn-primary:hover .q-icon {
  transform: translateX(5px);
}

.rk-btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(6, 182, 212, 0.2);
  color: var(--color-text);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.rk-btn-secondary::before {
  background: rgba(6, 182, 212, 0.12);
}

.rk-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(6, 182, 212, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.2);
}

.rk-btn-secondary:hover::before {
  opacity: 1;
}

.rk-btn-secondary .q-icon {
  font-size: 22px;
  color: var(--color-primary-light);
}

.rk-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 32px 0;
  border-top: 1.5px solid rgba(6, 182, 212, 0.12);
  border-bottom: 1.5px solid rgba(6, 182, 212, 0.12);
  margin-bottom: 40px;
  animation: fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s both;
}

.rk-trust-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.92rem;
  color: var(--color-text-muted);
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-trust-item:hover {
  color: var(--color-text);
  transform: translateY(-2px);
}

.rk-trust-item .q-icon {
  color: var(--color-primary-light);
  font-size: 20px;
  filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4));
}

.rk-stats {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(20, 184, 166, 0.05));
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(6, 182, 212, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1) 0.7s both;
  position: relative;
  overflow: hidden;
}

.rk-stats::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(6, 182, 212, 0.08), transparent);
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.rk-stat {
  flex: 1;
  text-align: center;
  position: relative;
}

.rk-stat-value {
  font-size: 2rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 8px;
  font-family: 'Space Mono', monospace;
  letter-spacing: -0.02em;
}

.rk-stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.rk-divider {
  width: 1.5px;
  height: 48px;
  background: linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.3), transparent);
}

.rk-hero-visual {
  position: relative;
  animation: fadeInRight 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(60px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.rk-visual-badges {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.rk-badge-float {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(6, 182, 212, 0.08);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(6, 182, 212, 0.2);
  border-radius: 14px;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-text);
  box-shadow: 0 10px 40px rgba(6, 182, 212, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: floatup 6s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.rk-badge-float::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(6, 182, 212, 0.15), transparent);
  opacity: 0;
  transition: opacity 0.4s;
}

.rk-badge-float:hover::before {
  opacity: 1;
}

.rk-badge-1 {
  animation-delay: 0s;
}

.rk-badge-2 {
  animation-delay: -3s;
}

.rk-badge-float .q-icon {
  color: var(--color-primary-light);
  font-size: 20px;
  filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.5));
}

@keyframes floatup {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-12px) scale(1.02);
  }
}

.rk-visual-card {
  position: relative;
  padding: 24px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.03), rgba(20, 184, 166, 0.03));
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 28px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(6, 182, 212, 0.15);
}

.rk-visual-card:hover {
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow: 0 30px 80px rgba(6, 182, 212, 0.25);
}

.rk-glow {
  position: absolute;
  inset: -3px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 28px;
  opacity: 0;
  filter: blur(30px);
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.rk-glow-2 {
  position: absolute;
  inset: -6px;
  background: radial-gradient(circle at 50% 0%, var(--color-primary-light), transparent 70%);
  border-radius: 28px;
  opacity: 0;
  filter: blur(40px);
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -2;
}

.rk-visual-card:hover .rk-glow {
  opacity: 0.4;
}

.rk-visual-card:hover .rk-glow-2 {
  opacity: 0.3;
}

.rk-image-wrap {
  transform-style: preserve-3d;
  position: relative;
}

.rk-img {
  border-radius: 20px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.rk-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), transparent 60%);
  border-radius: 20px;
  pointer-events: none;
}

.rk-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  background: rgba(6, 182, 212, 0.05);
}

.rk-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.rk-kpi {
  padding: 18px;
  background: rgba(6, 182, 212, 0.05);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 14px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInKpi 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
  position: relative;
  overflow: hidden;
}

@keyframes fadeInKpi {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rk-kpi::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.4s;
}

.rk-kpi:hover {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.25);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.2);
}

.rk-kpi:hover::before {
  opacity: 1;
}

.rk-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  position: relative;
}

.rk-kpi-top span {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.rk-kpi-val {
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1;
  margin-bottom: 8px;
  font-family: 'Space Mono', monospace;
  position: relative;
}

.rk-kpi-chg {
  font-size: 0.88rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.12);
}

.text-positive {
  color: var(--color-primary-light) !important;
}

.rk-badge-bottom {
  position: absolute;
  bottom: -18px;
  right: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(6, 182, 212, 0.1);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(6, 182, 212, 0.25);
  border-radius: 14px;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-text);
  box-shadow: 0 10px 40px rgba(6, 182, 212, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 3;
  animation: floatup 6s ease-in-out infinite;
  animation-delay: -2s;
}

.rk-badge-bottom .q-icon {
  color: var(--color-primary-light);
  font-size: 20px;
  filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.5));
}

.rk-scroll {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  opacity: 0.4;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  animation: fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) 1.5s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.4;
  }
}

.rk-scroll:hover {
  opacity: 1;
}

.rk-mouse {
  width: 28px;
  height: 44px;
  border: 2.5px solid rgba(6, 182, 212, 0.4);
  border-radius: 14px;
  position: relative;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.2),
              inset 0 0 10px rgba(6, 182, 212, 0.1);
}

.rk-wheel {
  width: 4px;
  height: 10px;
  background: var(--color-primary-light);
  border-radius: 3px;
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  animation: wheel 2.5s ease-in-out infinite;
  box-shadow: 0 0 12px var(--color-primary-light);
}

@keyframes wheel {
  0%, 100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  50% {
    opacity: 0.2;
    transform: translateX(-50%) translateY(14px);
  }
}

.rk-scroll span {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(6, 182, 212, 0.6);
  text-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
}

/* Responsive */
@media (max-width: 1023px) {
  .rk-hero {
    padding: clamp(5rem, 10vh, 7rem) 0 clamp(3rem, 6vh, 5rem);
    min-height: auto;
  }
  .rk-hero-grid {
    grid-template-columns: 1fr;
    gap: 5rem;
  }
  .rk-hero-content {
    max-width: 100%;
  }
  .rk-hero-title {
    font-size: clamp(2.25rem, 7vw, 3.5rem);
  }
  .rk-stats {
    gap: 20px;
    padding: 24px;
  }
  .rk-stat-value {
    font-size: 1.7rem;
  }
  .rk-divider {
    height: 40px;
  }
  .rk-scroll {
    display: none;
  }
}

@media (max-width: 767px) {
  .rk-hero {
    padding: 5rem 0 2.5rem;
  }
  .rk-hero-badges {
    gap: 10px;
    margin-bottom: 28px;
  }
  .rk-badge-main,
  .rk-badge-secondary {
    padding: 10px 16px;
    font-size: 0.86rem;
  }
  .rk-badge-main {
    padding-left: 14px;
  }
  .rk-pulse {
    left: 18px;
  }
  .rk-hero-title {
    font-size: clamp(2rem, 7vw, 2.75rem);
    margin-bottom: 24px;
  }
  .rk-description {
    font-size: 1rem;
    margin-bottom: 28px;
  }
  .rk-actions {
    flex-direction: column;
    width: 100%;
  }
  .rk-btn-primary,
  .rk-btn-secondary {
    width: 100%;
    justify-content: center;
    padding: 16px 28px;
  }
  .rk-trust {
    flex-direction: column;
    gap: 14px;
    padding: 20px 0;
    margin-bottom: 36px;
  }
  .rk-stats {
    flex-direction: column;
    gap: 20px;
  }
  .rk-divider {
    width: 100%;
    height: 1.5px;
  }
  .rk-visual-card {
    padding: 20px;
  }
  .rk-kpis {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .rk-kpi {
    padding: 16px;
  }
  .rk-kpi-val {
    font-size: 1.4rem;
  }
}

@media (max-width: 599px) {
  .rk-hero-container {
    padding: 0 1.25rem;
  }
  .rk-hero-title {
    font-size: clamp(1.75rem, 8vw, 2.25rem);
  }
  .rk-underline {
    height: 10px;
    bottom: -6px;
  }
  .rk-description {
    font-size: 0.94rem;
  }
  .rk-btn-primary,
  .rk-btn-secondary {
    padding: 14px 24px;
    font-size: 1rem;
  }
  .rk-stat-value {
    font-size: 1.4rem;
  }
  .rk-stat-label {
    font-size: 0.72rem;
  }
  .rk-badge-float {
    padding: 10px 16px;
    font-size: 0.84rem;
  }
}
</style>