<template>
  <section class="rk-hero">
    <div class="rk-hero-bg">
      <div class="rk-grid-lines"></div>
      <div class="rk-gradient-sphere rk-sphere-1"></div>
      <div class="rk-gradient-sphere rk-sphere-2"></div>
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
            Gestiona con
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
                    <stop
                      offset="0%"
                      style="stop-color: #d89b27; stop-opacity: 0.6"
                    />
                    <stop
                      offset="100%"
                      style="stop-color: #ffd98a; stop-opacity: 0.8"
                    />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <br />y estilo.
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
              :to="{ name: 'register' }"
            >
              Probar gratis 14 días
              <q-icon name="arrow_forward" />
            </q-btn>
            <q-btn
              unelevated
              no-caps
              class="rk-btn-secondary"
              :to="{ path: '/demo' }"
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
            <div class="rk-badge-float">
              <q-icon name="bolt" />
              <span>Rápido</span>
            </div>
            <div class="rk-badge-float">
              <q-icon name="shield" />
              <span>Seguro</span>
            </div>
          </div>

          <div
            class="rk-visual-card"
            @mouseenter="hover = true"
            @mousemove="handleMove"
            @mouseleave="hover = false"
            ref="card"
          >
            <div class="rk-glow"></div>
            <div class="rk-image-wrap" :style="transform">
              <q-img
                src="https://cdn.quasar.dev/img/parallax2.jpg"
                ratio="16/10"
                class="rk-img"
              >
                <template v-slot:loading>
                  <div class="rk-loading">
                    <q-spinner-dots color="primary" size="50px" />
                  </div>
                </template>
              </q-img>
            </div>

            <div class="rk-kpis">
              <div v-for="(k, i) in kpis" :key="i" class="rk-kpi">
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
    return "transform:perspective(1000px)rotateX(0)rotateY(0)scale(1);transition:transform .5s ease;";
  const rx = (y.value - 0.5) * 8;
  const ry = (x.value - 0.5) * -8;
  return `transform:perspective(1000px)rotateX(${rx}deg)rotateY(${ry}deg)scale(1.02);transition:transform .1s ease;`;
});

const handleMove = (e) => {
  if (!card.value) return;
  const r = card.value.getBoundingClientRect();
  x.value = (e.clientX - r.left) / r.width;
  y.value = (e.clientY - r.top) / r.height;
};
</script>

<style scoped>
.rk-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: clamp(5rem, 10vh, 8rem) 0 clamp(3rem, 6vh, 5rem);
  overflow: hidden;
  background: radial-gradient(ellipse at top, #181818, #121212);
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
  background-image: linear-gradient(
      rgba(216, 155, 39, 0.03) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(216, 155, 39, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(
    ellipse at center,
    #000 30%,
    transparent 80%
  );
}
.rk-gradient-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.2;
  animation: float 25s ease-in-out infinite;
}
.rk-sphere-1 {
  width: 500px;
  height: 500px;
  top: -200px;
  left: -100px;
  background: radial-gradient(circle, #d89b27, transparent 70%);
}
.rk-sphere-2 {
  width: 400px;
  height: 400px;
  top: 40%;
  right: -150px;
  background: radial-gradient(circle, #6366f1, transparent 70%);
  animation-delay: -12s;
}
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-50px, 50px) scale(0.9);
  }
}
.rk-hero-container {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 5vw, 3rem);
  width: 100%;
  z-index: 2;
}
.rk-hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(3rem, 6vw, 6rem);
  align-items: center;
}
.rk-hero-content {
  max-width: 640px;
}
.rk-hero-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}
.rk-badge-main,
.rk-badge-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  backdrop-filter: blur(10px);
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  position: relative;
}
.rk-badge-main {
  background: rgba(216, 155, 39, 0.08);
  border: 1px solid rgba(216, 155, 39, 0.2);
  color: #d89b27;
  padding-left: 14px;
}
.rk-pulse {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #d89b27;
  border-radius: 50%;
  left: 18px;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
}
.rk-badge-main .q-icon {
  color: #d89b27;
  font-size: 18px;
}
.rk-badge-secondary {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}
.rk-hero-title {
  font-size: clamp(2.5rem, 5.5vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.95);
}
.rk-highlight {
  position: relative;
  display: inline-block;
  white-space: nowrap;
}
.rk-highlight-text {
  position: relative;
  background: linear-gradient(135deg, #d89b27, #ffd98a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  z-index: 1;
}
.rk-underline {
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 100%;
  height: 10px;
  z-index: 0;
  animation: draw 1.5s ease-out forwards;
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
  font-size: clamp(1rem, 1.8vw, 1.25rem);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
  max-width: 560px;
}
.rk-description strong {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
}
.rk-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 40px;
}
.rk-btn-primary,
.rk-btn-secondary {
  padding: 15px 30px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.rk-btn-primary {
  background: linear-gradient(135deg, #d89b27, #b8821f);
  color: #000;
  box-shadow: 0 8px 24px rgba(216, 155, 39, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.rk-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(216, 155, 39, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
.rk-btn-primary .q-icon {
  font-size: 20px;
  transition: transform 0.3s;
}
.rk-btn-primary:hover .q-icon {
  transform: translateX(4px);
}
.rk-btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
}
.rk-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}
.rk-btn-secondary .q-icon {
  font-size: 20px;
}
.rk-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 28px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 36px;
}
.rk-trust-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
}
.rk-trust-item .q-icon {
  color: #d89b27;
  font-size: 18px;
}
.rk-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}
.rk-stat {
  flex: 1;
  text-align: center;
}
.rk-stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #ffe0a3;
  line-height: 1;
  margin-bottom: 6px;
}
.rk-stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.3;
}
.rk-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}
.rk-hero-visual {
  position: relative;
}
.rk-visual-badges {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.rk-badge-float {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: floatup 5s ease-in-out infinite;
}
.rk-badge-float:first-child {
  animation-delay: 0s;
}
.rk-badge-float:last-child {
  animation-delay: -2.5s;
}
.rk-badge-float .q-icon {
  color: #d89b27;
  font-size: 18px;
}
@keyframes floatup {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.rk-visual-card {
  position: relative;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  transition: all 0.5s ease;
}
.rk-visual-card:hover {
  border-color: rgba(216, 155, 39, 0.3);
}
.rk-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #d89b27, #6366f1);
  border-radius: 24px;
  opacity: 0;
  filter: blur(20px);
  transition: opacity 0.5s ease;
  z-index: -1;
}
.rk-visual-card:hover .rk-glow {
  opacity: 0.3;
}
.rk-image-wrap {
  transform-style: preserve-3d;
}
.rk-img {
  border-radius: 16px;
  margin-bottom: 16px;
}
.rk-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}
.rk-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.rk-kpi {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.3s;
}
.rk-kpi:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}
.rk-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.rk-kpi-top span {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.rk-kpi-val {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
  margin-bottom: 6px;
}
.rk-kpi-chg {
  font-size: 0.8125rem;
  font-weight: 600;
}
.rk-badge-bottom {
  position: absolute;
  bottom: -16px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 3;
  animation: floatup 5s ease-in-out infinite;
  animation-delay: -1.5s;
}
.rk-badge-bottom .q-icon {
  color: #d89b27;
  font-size: 18px;
}
.rk-scroll {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  opacity: 0.5;
  transition: opacity 0.3s;
  z-index: 10;
}
.rk-scroll:hover {
  opacity: 0.9;
}
.rk-mouse {
  width: 26px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 13px;
  position: relative;
}
.rk-wheel {
  width: 3px;
  height: 8px;
  background: #d89b27;
  border-radius: 2px;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  animation: wheel 2s ease-in-out infinite;
}
@keyframes wheel {
  0%,
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  50% {
    opacity: 0.3;
    transform: translateX(-50%) translateY(10px);
  }
}
.rk-scroll span {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}
@media (max-width: 1023px) {
  .rk-hero {
    padding: clamp(4rem, 8vh, 6rem) 0 clamp(2.5rem, 5vh, 4rem);
    min-height: auto;
  }
  .rk-hero-grid {
    grid-template-columns: 1fr;
    gap: 4rem;
  }
  .rk-hero-content {
    max-width: 100%;
  }
  .rk-hero-title {
    font-size: clamp(2rem, 6vw, 3rem);
  }
  .rk-stats {
    gap: 16px;
    padding: 20px;
  }
  .rk-stat-value {
    font-size: 1.5rem;
  }
  .rk-divider {
    height: 32px;
  }
  .rk-scroll {
    display: none;
  }
}
@media (max-width: 767px) {
  .rk-hero {
    padding: 4rem 0 2rem;
  }
  .rk-hero-badges {
    gap: 8px;
    margin-bottom: 24px;
  }
  .rk-badge-main,
  .rk-badge-secondary {
    padding: 8px 14px;
    font-size: 0.8125rem;
  }
  .rk-badge-main {
    padding-left: 12px;
  }
  .rk-pulse {
    left: 16px;
  }
  .rk-hero-title {
    font-size: clamp(1.75rem, 6vw, 2.5rem);
    margin-bottom: 20px;
  }
  .rk-description {
    font-size: 0.9375rem;
    margin-bottom: 24px;
  }
  .rk-actions {
    flex-direction: column;
    width: 100%;
  }
  .rk-btn-primary,
  .rk-btn-secondary {
    width: 100%;
    justify-content: center;
    padding: 14px 24px;
  }
  .rk-trust {
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
    margin-bottom: 32px;
  }
  .rk-stats {
    flex-direction: column;
    gap: 16px;
  }
  .rk-divider {
    width: 100%;
    height: 1px;
  }
  .rk-visual-card {
    padding: 16px;
  }
  .rk-kpis {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .rk-kpi {
    padding: 14px;
  }
  .rk-kpi-val {
    font-size: 1.25rem;
  }
}
@media (max-width: 599px) {
  .rk-hero-container {
    padding: 0 1rem;
  }
  .rk-hero-title {
    font-size: clamp(1.5rem, 7vw, 2rem);
  }
  .rk-underline {
    height: 8px;
    bottom: -4px;
  }
  .rk-description {
    font-size: 0.875rem;
  }
  .rk-btn-primary,
  .rk-btn-secondary {
    padding: 12px 20px;
    font-size: 0.9375rem;
  }
  .rk-stat-value {
    font-size: 1.25rem;
  }
  .rk-stat-label {
    font-size: 0.6875rem;
  }
}
</style>
