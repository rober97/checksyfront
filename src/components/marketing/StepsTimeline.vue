<template>
  <section id="como-funciona" class="rk-howworks-section">
    <!-- Background decorativo -->
    <div class="rk-howworks-bg">
      <div class="rk-grid-pattern"></div>
      <div class="rk-diagonal-lines"></div>
      <div class="rk-glow-orb rk-orb-1"></div>
      <div class="rk-glow-orb rk-orb-2"></div>
      <div class="rk-glow-orb rk-orb-3"></div>
      <div class="rk-particles">
        <div v-for="i in 20" :key="i" class="rk-particle" :style="particleStyle(i)"></div>
      </div>
    </div>

    <div class="rk-howworks-container">
      
      <!-- Header -->
      <div class="rk-howworks-header">
        <div class="rk-kicker" data-aos="fade-up">
          <div class="rk-pulse-dot"></div>
          <q-icon name="auto_fix_high" class="rk-kicker-icon" />
          <span>Proceso simple</span>
        </div>
        <h2 class="rk-howworks-title" data-aos="fade-up" data-aos-delay="100">
          <span class="rk-title-line">Despega en</span>
          <span class="rk-highlight">
            <span class="rk-highlight-text">3 pasos</span>
            <svg class="rk-highlight-underline" viewBox="0 0 200 8" preserveAspectRatio="none">
              <path d="M0,4 Q50,0 100,4 T200,4" fill="none" stroke="url(#grad-underline)" stroke-width="2"/>
              <defs>
                <linearGradient id="grad-underline" x1="0%" x2="100%">
                  <stop offset="0%" style="stop-color: #06b6d4; stop-opacity: 0.6" />
                  <stop offset="100%" style="stop-color: #14b8a6; stop-opacity: 0.8" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h2>
        <p class="rk-howworks-subtitle" data-aos="fade-up" data-aos-delay="200">
          Configuración inteligente que se adapta a tu equipo. <strong>De cero a productivo en minutos</strong>.
        </p>
      </div>

      <!-- Diagonal Timeline Layout -->
      <div class="rk-diagonal-timeline">
        <!-- Connection Lines -->
        <svg class="rk-timeline-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: #06b6d4; stop-opacity: 0.4" />
              <stop offset="50%" style="stop-color: #14b8a6; stop-opacity: 0.6" />
              <stop offset="100%" style="stop-color: #22d3ee; stop-opacity: 0.4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <!-- Animated path -->
          <path 
            class="rk-connection-path"
            d="M 200,150 Q 400,200 600,350 T 1000,600"
            fill="none"
            stroke="url(#line-grad)"
            stroke-width="3"
            stroke-dasharray="10,5"
            filter="url(#glow)"
          />
          
          <!-- Node circles -->
          <circle cx="200" cy="150" r="8" fill="#06b6d4" class="rk-node-circle" />
          <circle cx="600" cy="350" r="8" fill="#14b8a6" class="rk-node-circle" />
          <circle cx="1000" cy="600" r="8" fill="#22d3ee" class="rk-node-circle" />
        </svg>

        <!-- Steps Cards en diagonal -->
        <div class="rk-steps-diagonal">
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="rk-step-diagonal-card"
            :class="`rk-step-${index + 1}`"
            :data-aos="'fade-up'"
            :data-aos-delay="150 * index"
            @mouseenter="activeStep = index"
            @mouseleave="activeStep = null"
          >
            <!-- Card Background Effects -->
            <div class="rk-card-bg-effect"></div>
            <div class="rk-card-glow-border"></div>
            
            <!-- Step Number Display -->
            <div class="rk-step-number-display">
              <div class="rk-number-bg"></div>
              <span class="rk-number-text">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="rk-number-glow"></div>
            </div>

            <!-- Icon Section -->
            <div class="rk-step-icon-section">
              <div class="rk-icon-container">
                <div class="rk-icon-bg-layer"></div>
                <div class="rk-icon-ring"></div>
                <q-icon :name="step.icon" class="rk-step-icon" />
                <div class="rk-icon-particles">
                  <span v-for="n in 4" :key="n" class="rk-icon-particle"></span>
                </div>
              </div>
            </div>

            <!-- Content Section -->
            <div class="rk-step-content-section">
              <div class="rk-step-header">
                <h3 class="rk-step-title">{{ step.title }}</h3>
                <div class="rk-step-duration">
                  <q-icon name="schedule" />
                  <span>{{ step.duration }}</span>
                </div>
              </div>
              
              <p class="rk-step-desc">{{ step.desc }}</p>

              <!-- Key Features con iconos -->
              <div class="rk-key-features">
                <div 
                  v-for="(feature, fi) in step.features" 
                  :key="fi"
                  class="rk-feature-item"
                >
                  <div class="rk-feature-icon-wrap">
                    <q-icon name="verified" />
                  </div>
                  <span>{{ feature }}</span>
                </div>
              </div>

              <!-- Action Button -->
              <div class="rk-step-action">
                <q-btn
                  flat
                  no-caps
                  class="rk-action-btn"
                  :label="step.action"
                  icon-right="arrow_forward"
                />
              </div>
            </div>

            <!-- Decorative Corner Element -->
            <div class="rk-corner-decoration">
              <div class="rk-corner-line rk-corner-line-1"></div>
              <div class="rk-corner-line rk-corner-line-2"></div>
            </div>

            <!-- Hover Shine Effect -->
            <div class="rk-card-shine-effect"></div>

            <!-- Step Status Indicator -->
            <div class="rk-status-indicator" :class="{ 'is-active': activeStep === index }">
              <span class="rk-status-dot"></span>
              <span class="rk-status-text">{{ activeStep === index ? 'Explorando' : 'Listo' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Interactive Stats Bar -->
      <div class="rk-stats-bar" data-aos="fade-up" data-aos-delay="500">
        <div class="rk-stat-item" v-for="(stat, idx) in stats" :key="idx">
          <div class="rk-stat-icon-wrap">
            <q-icon :name="stat.icon" />
          </div>
          <div class="rk-stat-content">
            <div class="rk-stat-value">{{ stat.value }}</div>
            <div class="rk-stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- Enhanced CTA -->
      <div class="rk-howworks-cta" data-aos="fade-up" data-aos-delay="600">
        <div class="rk-cta-bg-pattern"></div>
        <div class="rk-cta-content">
          <div class="rk-cta-badge">
            <q-icon name="rocket_launch" />
            <span>Comienza gratis</span>
          </div>
          <h3 class="rk-cta-title">¿Listo para transformar tu gestión?</h3>
          <p class="rk-cta-text">
            Únete a <strong>250+ equipos</strong> que ya optimizan su tiempo con nuestra plataforma
          </p>
          <div class="rk-cta-actions">
            <q-btn 
              unelevated 
              no-caps
              class="rk-cta-btn-primary"
              label="Comenzar ahora"
              icon-right="arrow_forward"
            />
            <q-btn 
              flat
              no-caps
              class="rk-cta-btn-secondary"
              label="Agendar demo"
              icon="play_circle"
            />
          </div>
          <div class="rk-trust-badges">
            <div class="rk-trust-item">
              <q-icon name="verified_user" />
              <span>ISO 27001</span>
            </div>
            <div class="rk-trust-item">
              <q-icon name="shield" />
              <span>Encriptación</span>
            </div>
            <div class="rk-trust-item">
              <q-icon name="support_agent" />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
        <div class="rk-cta-visual">
          <div class="rk-visual-circle rk-circle-1"></div>
          <div class="rk-visual-circle rk-circle-2"></div>
          <div class="rk-visual-circle rk-circle-3"></div>
          <q-icon name="trending_up" class="rk-visual-icon" />
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

const activeStep = ref(null);

const steps = [
  { 
    icon: 'group_add', 
    title: 'Importa tu equipo', 
    duration: '2 min',
    desc: 'Carga colaboradores desde Excel, CSV o crea perfiles manualmente con nuestro asistente IA.',
    features: [
      'Importación masiva automática',
      'Validación inteligente de datos',
      'Onboarding personalizado'
    ],
    action: 'Ver tutorial'
  },
  { 
    icon: 'settings_suggest', 
    title: 'Automatiza políticas', 
    duration: '3 min',
    desc: 'Define horarios, reglas de asistencia y flujos de aprobación con templates inteligentes.',
    features: [
      'Templates pre-configurados',
      'Reglas condicionales flexibles',
      'Aprobaciones multi-nivel'
    ],
    action: 'Explorar templates'
  },
  { 
    icon: 'analytics', 
    title: 'Visualiza resultados', 
    duration: '1 min',
    desc: 'Accede a dashboards en tiempo real con métricas, alertas y recomendaciones predictivas.',
    features: [
      'Dashboards interactivos',
      'Alertas automatizadas',
      'Análisis predictivo IA'
    ],
    action: 'Ver demo dashboard'
  }
];

const stats = [
  { icon: 'speed', value: '< 5 min', label: 'Setup completo' },
  { icon: 'auto_awesome', value: '85%', label: 'Automatización' },
  { icon: 'show_chart', value: '3x', label: 'Más eficiencia' },
  { icon: 'emoji_events', value: '99.9%', label: 'Uptime SLA' }
];

const particleStyle = (i) => {
  const delay = Math.random() * 15;
  const duration = 20 + Math.random() * 20;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  return {
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');

:root {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-accent: #14b8a6;
  --color-bg-dark: #0a0e14;
  --color-surface: rgba(6, 182, 212, 0.05);
}

/* Section */
.rk-howworks-section {
  position: relative;
  padding: clamp(6rem, 12vh, 10rem) clamp(1.5rem, 5vw, 3rem);
  overflow: hidden;
  background: linear-gradient(180deg, #0a1628 0%, var(--color-bg-dark) 50%, #0d1b2a 100%);
  font-family: 'Sora', -apple-system, sans-serif;
}

/* Background - Simplified */
.rk-howworks-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  will-change: transform;
}

.rk-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
  background-size: 80px 80px;
  opacity: 0.5;
}

.rk-diagonal-lines {
  display: none;
}

.rk-glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
  will-change: transform;
}

.rk-orb-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -150px;
  background: radial-gradient(circle, var(--color-primary), transparent 60%);
}

.rk-orb-2 {
  width: 450px;
  height: 450px;
  top: 40%;
  right: -200px;
  background: radial-gradient(circle, var(--color-accent), transparent 60%);
}

.rk-orb-3 {
  width: 350px;
  height: 350px;
  bottom: -150px;
  left: 30%;
  background: radial-gradient(circle, var(--color-primary-light), transparent 60%);
}

.rk-particles {
  display: none;
}

.rk-particle {
  display: none;
}

/* Container */
.rk-howworks-container {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  z-index: 1;
}

/* Header */
.rk-howworks-header {
  text-align: center;
  margin-bottom: clamp(4rem, 8vw, 6rem);
}

.rk-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--color-primary-light);
  background: rgba(6, 182, 212, 0.1);
  border: 1.5px solid rgba(6, 182, 212, 0.25);
  border-radius: 50px;
  backdrop-filter: blur(10px);
}

.rk-pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--color-primary-light);
  border-radius: 50%;
}

.rk-kicker-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-howworks-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.95);
}

.rk-title-line {
  display: block;
}

.rk-highlight {
  position: relative;
  display: inline-block;
  white-space: nowrap;
}

.rk-highlight-text {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.rk-highlight-underline {
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 10px;
}

.rk-howworks-subtitle {
  font-size: clamp(1.05rem, 2vw, 1.3rem);
  color: rgba(255, 255, 255, 0.65);
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.7;
}

.rk-howworks-subtitle strong {
  color: rgba(255, 255, 255, 0.95);
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

/* Diagonal Timeline */
.rk-diagonal-timeline {
  position: relative;
  margin-bottom: clamp(4rem, 8vw, 6rem);
}

.rk-timeline-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}

.rk-connection-path {
  stroke-dasharray: 10 5;
}

.rk-node-circle {
  filter: drop-shadow(0 0 6px currentColor);
}

/* Steps Diagonal Layout */
.rk-steps-diagonal {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(2rem, 4vw, 3rem);
  z-index: 1;
}

/* Step Cards - Optimized */
.rk-step-diagonal-card {
  position: relative;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.04), rgba(20, 184, 166, 0.04));
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 28px;
  padding: clamp(28px, 4vw, 36px);
  overflow: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  will-change: transform;
}

.rk-step-1 {
  transform: translateY(0);
}

.rk-step-2 {
  transform: translateY(40px);
}

.rk-step-3 {
  transform: translateY(80px);
}

.rk-step-diagonal-card:hover {
  transform: translateY(-8px) !important;
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow: 0 20px 40px rgba(6, 182, 212, 0.2);
}

.rk-card-bg-effect {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    transparent 0%,
    rgba(6, 182, 212, 0.08) 50%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.rk-step-diagonal-card:hover .rk-card-bg-effect {
  opacity: 1;
}

.rk-card-glow-border {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 28px;
  opacity: 0;
  filter: blur(15px);
  transition: opacity 0.3s;
  z-index: -1;
}

.rk-step-diagonal-card:hover .rk-card-glow-border {
  opacity: 0.3;
}

/* Step Number Display */
.rk-step-number-display {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.rk-number-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(20, 184, 166, 0.15));
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.rk-step-diagonal-card:hover .rk-number-bg {
  transform: rotate(90deg) scale(1.05);
  border-color: rgba(6, 182, 212, 0.5);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(20, 184, 166, 0.25));
}

.rk-number-text {
  font-size: 1.5rem;
  font-weight: 900;
  font-family: 'Space Mono', monospace;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  z-index: 1;
}

.rk-number-glow {
  position: absolute;
  inset: -4px;
  background: var(--color-primary);
  border-radius: 50%;
  filter: blur(12px);
  opacity: 0;
  transition: opacity 0.3s;
}

.rk-step-diagonal-card:hover .rk-number-glow {
  opacity: 0.3;
}

/* Icon Section - Simplified */
.rk-step-icon-section {
  margin-bottom: 28px;
}

.rk-icon-container {
  position: relative;
  width: 80px;
  height: 80px;
}

.rk-icon-bg-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 20px;
  transition: transform 0.3s ease;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
}

.rk-step-diagonal-card:hover .rk-icon-bg-layer {
  transform: rotate(-5deg) scale(1.05);
}

.rk-icon-ring {
  position: absolute;
  inset: -6px;
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 24px;
  transition: all 0.3s ease;
}

.rk-step-diagonal-card:hover .rk-icon-ring {
  inset: -8px;
  border-color: rgba(6, 182, 212, 0.5);
}

.rk-step-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px !important;
  color: #fff;
  z-index: 1;
  transition: transform 0.3s ease;
}

.rk-step-diagonal-card:hover .rk-step-icon {
  transform: scale(1.1);
}

.rk-icon-particles {
  display: none;
}

.rk-icon-particle {
  display: none;
}

/* Content Section */
.rk-step-content-section {
  position: relative;
}

.rk-step-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.rk-step-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.2;
  transition: color 0.3s;
  flex: 1;
}

.rk-step-diagonal-card:hover .rk-step-title {
  color: #ffffff;
}

.rk-step-duration {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary-light);
  white-space: nowrap;
  font-family: 'Space Mono', monospace;
}

.rk-step-duration .q-icon {
  font-size: 14px;
}

.rk-step-desc {
  font-size: 0.98rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 24px;
  transition: color 0.3s;
}

.rk-step-diagonal-card:hover .rk-step-desc {
  color: rgba(255, 255, 255, 0.8);
}

/* Key Features */
.rk-key-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.rk-feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
  padding: 8px 0;
}

.rk-feature-item:hover {
  color: rgba(255, 255, 255, 0.95);
  transform: translateX(4px);
}

.rk-feature-icon-wrap {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.15);
  border-radius: 6px;
  flex-shrink: 0;
}

.rk-feature-icon-wrap .q-icon {
  font-size: 14px;
  color: var(--color-primary-light);
}

/* Action Button */
.rk-step-action {
  padding-top: 20px;
  border-top: 1px solid rgba(6, 182, 212, 0.1);
  margin-bottom: 60px;
}

.rk-action-btn {
  color: var(--color-primary-light);
  font-weight: 700;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
}

.rk-action-btn:hover {
  color: var(--color-accent);
  background: rgba(6, 182, 212, 0.1);
}

.rk-action-btn .q-icon {
  transition: transform 0.2s;
}

.rk-action-btn:hover .q-icon {
  transform: translateX(4px);
}

/* Corner Decoration - Simplified */
.rk-corner-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 60px;
  height: 60px;
  overflow: hidden;
  border-radius: 28px 0 0 0;
  opacity: 0.3;
}

.rk-corner-line {
  position: absolute;
  background: var(--color-primary);
}

.rk-corner-line-1 {
  width: 2px;
  height: 60px;
  left: 12px;
  top: 0;
}

.rk-corner-line-2 {
  width: 60px;
  height: 2px;
  left: 0;
  top: 12px;
}

/* Shine Effect - Optimized */
.rk-card-shine-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 255, 255, 0.03) 50%,
    transparent 100%
  );
  transform: translateX(-100%) rotate(45deg);
  transition: transform 0.6s ease;
  pointer-events: none;
}

.rk-step-diagonal-card:hover .rk-card-shine-effect {
  transform: translateX(100%) rotate(45deg);
}

/* Status Indicator - Completely Fixed */
.rk-status-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.25);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  opacity: 0;
  transition: opacity 0.3s;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}

.rk-step-diagonal-card:hover .rk-status-indicator {
  opacity: 1;
}

.rk-status-indicator.is-active {
  background: rgba(6, 182, 212, 0.18);
  border-color: rgba(6, 182, 212, 0.4);
  color: var(--color-primary-light);
}

.rk-status-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  flex-shrink: 0;
}

.rk-status-text {
  line-height: 1;
}

/* Stats Bar - Optimized */
.rk-stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 32px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(20, 184, 166, 0.05));
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 24px;
  backdrop-filter: blur(10px);
  margin-bottom: clamp(3rem, 6vw, 5rem);
  box-shadow: 0 8px 32px rgba(6, 182, 212, 0.1);
}

.rk-stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(6, 182, 212, 0.03);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.rk-stat-item:hover {
  background: rgba(6, 182, 212, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.15);
}

.rk-stat-icon-wrap {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25);
  transition: transform 0.3s;
}

.rk-stat-item:hover .rk-stat-icon-wrap {
  transform: scale(1.05);
}

.rk-stat-icon-wrap .q-icon {
  font-size: 24px;
  color: #fff;
}

.rk-stat-content {
  flex: 1;
}

.rk-stat-value {
  font-size: 1.5rem;
  font-weight: 900;
  font-family: 'Space Mono', monospace;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 6px;
}

.rk-stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600;
}

/* Enhanced CTA - Optimized */
.rk-howworks-cta {
  position: relative;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 48px;
  padding: clamp(40px, 6vw, 60px);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(20, 184, 166, 0.08));
  border: 2px solid rgba(6, 182, 212, 0.2);
  border-radius: 32px;
  backdrop-filter: blur(20px);
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(6, 182, 212, 0.15);
}

.rk-cta-bg-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.rk-cta-content {
  position: relative;
  z-index: 1;
}

.rk-cta-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  margin-bottom: 20px;
  background: rgba(6, 182, 212, 0.15);
  border: 1.5px solid rgba(6, 182, 212, 0.3);
  border-radius: 50px;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-primary-light);
  backdrop-filter: blur(10px);
}

.rk-cta-badge .q-icon {
  font-size: 18px;
}

.rk-cta-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.95);
}

.rk-cta-text {
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
}

.rk-cta-text strong {
  color: var(--color-primary-light);
  font-weight: 700;
}

.rk-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 32px;
}

.rk-cta-btn-primary,
.rk-cta-btn-secondary {
  padding: 16px 32px;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  border-radius: 14px;
  transition: all 0.3s ease;
}

.rk-cta-btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
}

.rk-cta-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(6, 182, 212, 0.4);
}

.rk-cta-btn-secondary {
  color: var(--color-primary-light);
  border: 2px solid rgba(6, 182, 212, 0.3);
  background: rgba(6, 182, 212, 0.05);
}

.rk-cta-btn-secondary:hover {
  border-color: rgba(6, 182, 212, 0.5);
  background: rgba(6, 182, 212, 0.12);
  transform: translateY(-2px);
}

.rk-trust-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.rk-trust-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600;
}

.rk-trust-item .q-icon {
  color: var(--color-primary-light);
  font-size: 18px;
}

/* CTA Visual - Simplified */
.rk-cta-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.rk-visual-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  opacity: 0.1;
}

.rk-circle-1 {
  width: 200px;
  height: 200px;
}

.rk-circle-2 {
  width: 150px;
  height: 150px;
}

.rk-circle-3 {
  width: 100px;
  height: 100px;
}

.rk-visual-icon {
  font-size: 100px !important;
  color: var(--color-primary-light);
  opacity: 0.25;
  z-index: 1;
}

/* Responsive */
@media (max-width: 1200px) {
  .rk-steps-diagonal {
    grid-template-columns: 1fr;
  }
  
  .rk-step-1,
  .rk-step-2,
  .rk-step-3 {
    transform: translateY(0) !important;
  }
  
  .rk-timeline-svg {
    display: none;
  }
}

@media (max-width: 1023px) {
  .rk-howworks-section {
    padding: clamp(5rem, 10vh, 7rem) clamp(1.25rem, 4vw, 2rem);
  }

  .rk-stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 24px;
  }

  .rk-howworks-cta {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 40px;
  }

  .rk-cta-visual {
    min-height: 200px;
  }
}

@media (max-width: 767px) {
  .rk-howworks-section {
    padding: clamp(4rem, 8vh, 5rem) 1rem;
  }

  .rk-step-diagonal-card {
    padding: 24px;
  }

  .rk-step-number-display {
    width: 52px;
    height: 52px;
    top: 20px;
    right: 20px;
  }

  .rk-number-text {
    font-size: 1.25rem;
  }

  .rk-icon-container {
    width: 64px;
    height: 64px;
  }

  .rk-step-icon {
    font-size: 28px !important;
  }

  .rk-step-title {
    font-size: 1.3rem;
  }

  .rk-step-action {
    margin-bottom: 50px;
  }

  .rk-stats-bar {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .rk-howworks-cta {
    padding: 28px;
  }

  .rk-cta-actions {
    flex-direction: column;
  }

  .rk-cta-btn-primary,
  .rk-cta-btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .rk-trust-badges {
    justify-content: center;
  }

  .rk-visual-icon {
    font-size: 80px !important;
  }

  /* Status indicator responsive */
  .rk-status-indicator {
    font-size: 0.75rem;
    padding: 8px 16px;
    bottom: 16px;
  }
}

@media (max-width: 599px) {
  .rk-step-diagonal-card {
    padding: 20px;
  }

  .rk-icon-container {
    width: 56px;
    height: 56px;
  }

  .rk-step-icon {
    font-size: 24px !important;
  }

  .rk-step-title {
    font-size: 1.2rem;
  }

  .rk-step-desc {
    font-size: 0.92rem;
  }

  .rk-feature-item {
    font-size: 0.86rem;
  }

  .rk-step-action {
    margin-bottom: 45px;
  }

  .rk-stat-value {
    font-size: 1.3rem;
  }

  .rk-howworks-cta {
    padding: 24px;
  }

  /* Status indicator for small screens */
  .rk-status-indicator {
    font-size: 0.72rem;
    padding: 8px 14px;
    bottom: 14px;
  }
}

@media (max-width: 400px) {
  .rk-step-action {
    margin-bottom: 40px;
  }

  /* Status indicator for extra small screens */
  .rk-status-indicator {
    font-size: 0.7rem;
    padding: 7px 12px;
    bottom: 12px;
    gap: 6px;
  }

  .rk-status-dot {
    width: 5px;
    height: 5px;
  }
}
</style>