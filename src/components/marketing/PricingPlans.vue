<template>
  <section id="planes" class="rk-pricing-section">
    <!-- Background decorativo -->
    <div class="rk-pricing-bg">
      <div class="rk-grid-pattern"></div>
      <div class="rk-glow-orb rk-orb-1"></div>
      <div class="rk-glow-orb rk-orb-2"></div>
    </div>

    <div class="rk-pricing-container">
      <!-- Header -->
      <div class="rk-pricing-header">
        <div class="rk-kicker" data-aos="fade-up">
          <div class="rk-pulse-ring"></div>
          <q-icon name="workspace_premium" />
          <span>Elige el mejor para ti</span>
        </div>
        <h2 class="rk-pricing-title" data-aos="fade-up" data-aos-delay="100">
          Planes que se adaptan a
          <span class="rk-highlight">
            <span class="rk-highlight-text">tu crecimiento</span>
            <svg class="rk-highlight-underline" viewBox="0 0 200 8" preserveAspectRatio="none">
              <path d="M0,4 Q50,0 100,4 T200,4" fill="none" stroke="url(#grad-pricing)" stroke-width="2"/>
              <defs>
                <linearGradient id="grad-pricing" x1="0%" x2="100%">
                  <stop offset="0%" style="stop-color: #06b6d4; stop-opacity: 0.6" />
                  <stop offset="100%" style="stop-color: #14b8a6; stop-opacity: 0.8" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h2>
        
        <!-- Toggle Billing -->
        <div class="rk-billing-toggle" data-aos="fade-up" data-aos-delay="200">
          <button 
            class="rk-toggle-option" 
            :class="{ 'active': !yearly }"
            @click="yearly = false"
          >
            Mensual
          </button>
          <div class="rk-toggle-slider" :class="{ 'yearly': yearly }">
            <div class="rk-slider-track"></div>
            <div class="rk-slider-thumb"></div>
          </div>
          <button 
            class="rk-toggle-option" 
            :class="{ 'active': yearly }"
            @click="yearly = true"
          >
            Anual
            <span class="rk-savings-badge">Ahorra 20%</span>
          </button>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="rk-pricing-grid">
        <div 
          v-for="(plan, index) in viewPlans" 
          :key="index"
          class="rk-pricing-card"
          :class="{ 'popular': plan.popular }"
          :data-aos="'fade-up'"
          :data-aos-delay="100 * index"
          @mouseenter="activePlan = index"
          @mouseleave="activePlan = null"
        >
          <!-- Popular Badge -->
          <div v-if="plan.popular" class="rk-popular-badge">
            <q-icon name="star" />
            <span>MÁS POPULAR</span>
          </div>

          <!-- Card Background Effects -->
          <div class="rk-card-bg-glow"></div>
          <div class="rk-card-shine"></div>

          <!-- Card Content -->
          <div class="rk-card-content">
            <!-- Header -->
            <div class="rk-plan-header">
              <div class="rk-plan-icon-wrap">
                <div class="rk-icon-bg"></div>
                <q-icon :name="plan.icon" class="rk-plan-icon" />
              </div>
              <h3 class="rk-plan-name">{{ plan.name }}</h3>
              <p class="rk-plan-desc">{{ plan.desc }}</p>
            </div>

            <!-- Price Display -->
            <div class="rk-price-display">
              <div class="rk-price-wrapper">
                <span class="rk-currency">$</span>
                <span class="rk-amount">{{ plan.priceNumber }}</span>
                <div class="rk-price-meta">
                  <span class="rk-period">/usuario</span>
                  <span class="rk-period">/mes</span>
                </div>
              </div>
              <div v-if="yearly && plan.originalPrice" class="rk-original-price">
                <span>antes ${{ plan.originalPrice }}</span>
              </div>
            </div>

            <!-- Features List -->
            <div class="rk-features-list">
              <div 
                v-for="(feature, idx) in plan.features" 
                :key="idx"
                class="rk-feature-item"
                :style="{ animationDelay: `${0.05 * idx}s` }"
              >
                <div class="rk-feature-icon-wrap">
                  <q-icon name="check_circle" />
                  <div class="rk-icon-ping"></div>
                </div>
                <span class="rk-feature-text">{{ feature }}</span>
              </div>
            </div>

            <!-- CTA Button -->
            <div class="rk-card-action">
              <q-btn
                unelevated
                no-caps
                class="rk-plan-btn"
                :class="plan.popular ? 'rk-btn-primary' : 'rk-btn-secondary'"
                :label="plan.popular ? 'Comenzar ahora' : 'Seleccionar plan'"
                :icon-right="plan.popular ? 'arrow_forward' : ''"
              />
              <div v-if="plan.popular" class="rk-trial-note">
                <q-icon name="schedule" />
                <span>Prueba gratis 14 días</span>
              </div>
            </div>
          </div>

          <!-- Decorative Corner -->
          <div class="rk-corner-decor">
            <div class="rk-corner-dot"></div>
            <div class="rk-corner-line"></div>
          </div>

          <!-- Active Indicator -->
          <div class="rk-active-ring" :class="{ 'visible': activePlan === index }"></div>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="rk-pricing-footer" data-aos="fade-up" data-aos-delay="400">
        <div class="rk-footer-content">
          <div class="rk-footer-left">
            <q-icon name="business_center" class="rk-footer-icon" />
            <div>
              <h4 class="rk-footer-title">¿Necesitas una solución empresarial?</h4>
              <p class="rk-footer-text">Planes personalizados con funciones avanzadas, soporte dedicado y SLA garantizado</p>
            </div>
          </div>
          <div class="rk-footer-right">
            <q-btn
              flat
              no-caps
              class="rk-contact-btn"
              label="Hablar con ventas"
              icon-right="arrow_forward"
            />
          </div>
        </div>

        <!-- Trust Indicators -->
        <div class="rk-trust-indicators">
          <div class="rk-trust-item">
            <q-icon name="verified_user" />
            <span>Garantía 30 días</span>
          </div>
          <div class="rk-trust-divider"></div>
          <div class="rk-trust-item">
            <q-icon name="credit_card" />
            <span>Sin tarjeta requerida</span>
          </div>
          <div class="rk-trust-divider"></div>
          <div class="rk-trust-item">
            <q-icon name="support_agent" />
            <span>Soporte incluido</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const yearly = ref(false)
const activePlan = ref(null)

const plans = [
  { 
    name: 'Básico', 
    desc: 'Para equipos pequeños que inician', 
    priceM: 29,
    icon: 'rocket_launch',
    popular: false,
    features: [
      'Hasta 20 usuarios',
      'Asistencia básica',
      'Reportes mensuales',
      'Soporte por correo',
      'Dashboard básico'
    ] 
  },
  { 
    name: 'Pro', 
    desc: 'Empresas en crecimiento acelerado', 
    priceM: 59,
    icon: 'trending_up',
    popular: true,
    features: [
      'Hasta 100 usuarios',
      'Asistencia avanzada',
      'Evaluación de desempeño',
      'Integraciones API',
      'Análisis en tiempo real',
      'Soporte prioritario'
    ] 
  },
  { 
    name: 'Enterprise', 
    desc: 'Organizaciones de gran escala', 
    priceM: 99,
    icon: 'apartment',
    popular: false,
    features: [
      'Usuarios ilimitados',
      'Todas las funciones Pro',
      'Analítica predictiva IA',
      'Integraciones premium',
      'SSO y SAML',
      'Soporte 24/7 dedicado',
      'SLA personalizado'
    ] 
  },
]

const viewPlans = computed(() => plans.map(p => {
  const finalPrice = yearly.value ? Math.round(p.priceM * 0.8) : p.priceM
  return {
    ...p, 
    price: `$${finalPrice}`,
    priceNumber: finalPrice,
    originalPrice: yearly.value ? p.priceM : null
  }
}))
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
.rk-pricing-section {
  position: relative;
  padding: clamp(6rem, 12vh, 10rem) clamp(1.5rem, 5vw, 3rem);
  overflow: hidden;
  background: linear-gradient(180deg, #0a1628 0%, var(--color-bg-dark) 50%, #0d1b2a 100%);
  font-family: 'Sora', -apple-system, sans-serif;
}

/* Background */
.rk-pricing-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.rk-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.5;
}

.rk-glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
}

.rk-orb-1 {
  width: 450px;
  height: 450px;
  top: -100px;
  right: -150px;
  background: radial-gradient(circle, var(--color-primary), transparent 60%);
}

.rk-orb-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: -150px;
  background: radial-gradient(circle, var(--color-accent), transparent 60%);
}

/* Container */
.rk-pricing-container {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  z-index: 1;
}

/* Header */
.rk-pricing-header {
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
  position: relative;
}

.rk-pulse-ring {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--color-primary-light);
  border-radius: 50%;
  left: 16px;
  animation: pulseRing 2s ease-out infinite;
}

@keyframes pulseRing {
  0% {
    box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(6, 182, 212, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(6, 182, 212, 0);
  }
}

.rk-kicker .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-pricing-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 40px;
  color: rgba(255, 255, 255, 0.95);
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
}

.rk-highlight-underline {
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 10px;
}

/* Billing Toggle */
.rk-billing-toggle {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
  background: rgba(6, 182, 212, 0.05);
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 50px;
  backdrop-filter: blur(10px);
}

.rk-toggle-option {
  position: relative;
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  background: transparent;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2;
}

.rk-toggle-option.active {
  color: rgba(255, 255, 255, 0.95);
}

.rk-toggle-option:hover {
  color: rgba(255, 255, 255, 0.8);
}

.rk-savings-badge {
  display: inline-flex;
  padding: 4px 10px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-toggle-slider {
  position: relative;
  width: 64px;
  height: 32px;
  flex-shrink: 0;
}

.rk-slider-track {
  position: absolute;
  inset: 0;
  background: rgba(6, 182, 212, 0.2);
  border-radius: 16px;
  transition: background 0.3s ease;
}

.rk-toggle-slider.yearly .rk-slider-track {
  background: rgba(6, 182, 212, 0.3);
}

.rk-slider-thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-toggle-slider.yearly .rk-slider-thumb {
  transform: translateX(32px);
}

/* Pricing Grid */
.rk-pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: clamp(2rem, 4vw, 3rem);
  margin-bottom: clamp(4rem, 8vw, 6rem);
}

/* Pricing Card */
.rk-pricing-card {
  position: relative;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.04), rgba(20, 184, 166, 0.04));
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 28px;
  padding: clamp(32px, 5vw, 40px);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.rk-pricing-card:hover {
  transform: translateY(-8px);
  border-color: rgba(6, 182, 212, 0.35);
  box-shadow: 0 24px 48px rgba(6, 182, 212, 0.2);
}

.rk-pricing-card.popular {
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow: 0 16px 40px rgba(6, 182, 212, 0.15);
  transform: scale(1.05);
}

.rk-pricing-card.popular:hover {
  transform: scale(1.05) translateY(-8px);
  box-shadow: 0 28px 56px rgba(6, 182, 212, 0.25);
}

/* Popular Badge */
.rk-popular-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.8px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.4);
  z-index: 3;
}

.rk-popular-badge .q-icon {
  font-size: 16px;
}

/* Card Background Effects */
.rk-card-bg-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 28px;
  opacity: 0;
  filter: blur(15px);
  transition: opacity 0.4s;
  z-index: -1;
}

.rk-pricing-card:hover .rk-card-bg-glow {
  opacity: 0.3;
}

.rk-card-shine {
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

.rk-pricing-card:hover .rk-card-shine {
  transform: translateX(100%) rotate(45deg);
}

/* Card Content */
.rk-card-content {
  position: relative;
  z-index: 2;
}

/* Plan Header */
.rk-plan-header {
  margin-bottom: 32px;
}

.rk-plan-icon-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  margin-bottom: 20px;
}

.rk-icon-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
  transition: transform 0.3s ease;
}

.rk-pricing-card:hover .rk-icon-bg {
  transform: rotate(-5deg) scale(1.05);
}

.rk-plan-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px !important;
  color: #fff;
  z-index: 1;
}

.rk-plan-name {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.95);
}

.rk-plan-desc {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  margin: 0;
}

/* Price Display */
.rk-price-display {
  margin-bottom: 32px;
  padding: 24px 0;
  border-top: 1px solid rgba(6, 182, 212, 0.1);
  border-bottom: 1px solid rgba(6, 182, 212, 0.1);
}

.rk-price-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 8px;
}

.rk-currency {
  font-size: 1.5rem;
  font-weight: 800;
  font-family: 'Space Mono', monospace;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-top: 8px;
}

.rk-amount {
  font-size: 3.5rem;
  font-weight: 900;
  font-family: 'Space Mono', monospace;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  letter-spacing: -0.03em;
}

.rk-price-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 12px;
}

.rk-period {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  line-height: 1;
}

.rk-original-price {
  margin-top: 4px;
}

.rk-original-price span {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 600;
  text-decoration: line-through;
}

/* Features List */
.rk-features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.rk-feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
  transition: all 0.3s ease;
  opacity: 0;
  animation: fadeInFeature 0.5s ease forwards;
}

@keyframes fadeInFeature {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.rk-feature-item:hover {
  color: rgba(255, 255, 255, 0.95);
  transform: translateX(4px);
}

.rk-feature-icon-wrap {
  position: relative;
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
  font-size: 16px;
  color: var(--color-primary-light);
  z-index: 1;
}

.rk-icon-ping {
  position: absolute;
  inset: 0;
  background: var(--color-primary);
  border-radius: 6px;
  opacity: 0;
  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping {
  75%, 100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.rk-feature-text {
  flex: 1;
  font-weight: 600;
}

/* Card Action */
.rk-card-action {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rk-plan-btn {
  width: 100%;
  padding: 16px 32px;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  border-radius: 14px;
  transition: all 0.3s ease;
}

.rk-btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
}

.rk-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(6, 182, 212, 0.4);
}

.rk-btn-primary .q-icon {
  transition: transform 0.3s;
}

.rk-btn-primary:hover .q-icon {
  transform: translateX(4px);
}

.rk-btn-secondary {
  color: var(--color-primary-light);
  border: 2px solid rgba(6, 182, 212, 0.3);
  background: rgba(6, 182, 212, 0.05);
}

.rk-btn-secondary:hover {
  border-color: rgba(6, 182, 212, 0.5);
  background: rgba(6, 182, 212, 0.12);
  transform: translateY(-2px);
}

.rk-trial-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.rk-trial-note .q-icon {
  font-size: 16px;
  color: var(--color-primary-light);
}

/* Decorative Corner */
.rk-corner-decor {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  pointer-events: none;
}

.rk-corner-dot {
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--color-primary);
}

.rk-corner-line {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 30px;
  height: 30px;
  border-top: 2px solid rgba(6, 182, 212, 0.3);
  border-left: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 4px 0 0 0;
}

/* Active Ring */
.rk-active-ring {
  position: absolute;
  inset: -4px;
  border: 2px solid var(--color-primary);
  border-radius: 28px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  animation: ringPulse 2s ease-in-out infinite;
}

.rk-active-ring.visible {
  opacity: 0.5;
}

@keyframes ringPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

/* Pricing Footer */
.rk-pricing-footer {
  padding: clamp(40px, 6vw, 60px);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(20, 184, 166, 0.08));
  border: 2px solid rgba(6, 182, 212, 0.2);
  border-radius: 28px;
  backdrop-filter: blur(20px);
}

.rk-footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.15);
}

.rk-footer-left {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex: 1;
}

.rk-footer-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 14px;
  font-size: 28px !important;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3);
}

.rk-footer-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.95);
}

.rk-footer-text {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
  margin: 0;
}

.rk-footer-right {
  flex-shrink: 0;
}

.rk-contact-btn {
  padding: 16px 32px;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--color-primary-light);
  border: 2px solid rgba(6, 182, 212, 0.3);
  background: rgba(6, 182, 212, 0.08);
  border-radius: 14px;
  transition: all 0.3s ease;
}

.rk-contact-btn:hover {
  border-color: rgba(6, 182, 212, 0.5);
  background: rgba(6, 182, 212, 0.15);
  transform: translateY(-2px);
}

.rk-contact-btn .q-icon {
  transition: transform 0.3s;
}

.rk-contact-btn:hover .q-icon {
  transform: translateX(4px);
}

/* Trust Indicators */
.rk-trust-indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.rk-trust-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600;
}

.rk-trust-item .q-icon {
  font-size: 20px;
  color: var(--color-primary-light);
}

.rk-trust-divider {
  width: 1px;
  height: 24px;
  background: rgba(6, 182, 212, 0.2);
}

/* Responsive */
@media (max-width: 1200px) {
  .rk-pricing-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .rk-pricing-card.popular {
    transform: scale(1);
  }

  .rk-pricing-card.popular:hover {
    transform: translateY(-8px);
  }
}

@media (max-width: 1023px) {
  .rk-pricing-section {
    padding: clamp(5rem, 10vh, 7rem) clamp(1.25rem, 4vw, 2rem);
  }

  .rk-footer-content {
    flex-direction: column;
    text-align: center;
  }

  .rk-footer-left {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 767px) {
  .rk-pricing-section {
    padding: clamp(4rem, 8vh, 5rem) 1rem;
  }

  .rk-pricing-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .rk-pricing-card {
    padding: 28px;
  }

  .rk-plan-icon-wrap {
    width: 64px;
    height: 64px;
  }

  .rk-plan-icon {
    font-size: 28px !important;
  }

  .rk-amount {
    font-size: 3rem;
  }

  .rk-billing-toggle {
    flex-direction: column;
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
  }

  .rk-toggle-option {
    width: 100%;
    justify-content: center;
  }

  .rk-toggle-slider {
    display: none;
  }

  .rk-pricing-footer {
    padding: 32px;
  }

  .rk-trust-indicators {
    flex-direction: column;
    gap: 16px;
  }

  .rk-trust-divider {
    display: none;
  }
}

@media (max-width: 599px) {
  .rk-pricing-card {
    padding: 24px;
  }

  .rk-plan-icon-wrap {
    width: 56px;
    height: 56px;
  }

  .rk-plan-icon {
    font-size: 24px !important;
  }

  .rk-plan-name {
    font-size: 1.5rem;
  }

  .rk-amount {
    font-size: 2.5rem;
  }

  .rk-pricing-footer {
    padding: 24px;
  }

  .rk-footer-icon {
    width: 48px;
    height: 48px;
    font-size: 24px !important;
  }

  .rk-footer-title {
    font-size: 1.25rem;
  }
}
</style>