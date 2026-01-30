<template>
  <section id="faq" class="rk-faq-section">
    <!-- Background decorativo -->
    <div class="rk-faq-bg">
      <div class="rk-grid-pattern"></div>
      <div class="rk-glow-orb rk-orb-1"></div>
      <div class="rk-glow-orb rk-orb-2"></div>
      <div class="rk-floating-shapes">
        <div class="rk-shape rk-shape-1"></div>
        <div class="rk-shape rk-shape-2"></div>
        <div class="rk-shape rk-shape-3"></div>
      </div>
    </div>

    <div class="rk-faq-container">
      <!-- Header -->
      <div class="rk-faq-header">
        <div class="rk-kicker" data-aos="fade-up">
          <div class="rk-pulse-dot"></div>
          <q-icon name="help_outline" />
          <span>¿Tienes dudas?</span>
        </div>
        <h2 class="rk-faq-title" data-aos="fade-up" data-aos-delay="100">
          <span class="rk-title-line">Respuestas a tus</span>
          <span class="rk-highlight">
            <span class="rk-highlight-text">preguntas</span>
            <svg class="rk-highlight-underline" viewBox="0 0 200 8" preserveAspectRatio="none">
              <path d="M0,4 Q50,0 100,4 T200,4" fill="none" stroke="url(#grad-faq)" stroke-width="2"/>
              <defs>
                <linearGradient id="grad-faq" x1="0%" x2="100%">
                  <stop offset="0%" style="stop-color: #06b6d4; stop-opacity: 0.6" />
                  <stop offset="100%" style="stop-color: #14b8a6; stop-opacity: 0.8" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h2>
        <p class="rk-faq-subtitle" data-aos="fade-up" data-aos-delay="200">
          Encuentra respuestas rápidas a las preguntas más comunes sobre nuestra plataforma
        </p>
      </div>

      <!-- FAQ Grid Layout -->
      <div class="rk-faq-layout">
        <!-- Left: Categories (Optional enhancement) -->
        <div class="rk-faq-sidebar" data-aos="fade-right" data-aos-delay="300">
          <div class="rk-category-card">
            <div class="rk-category-icon-wrap">
              <q-icon name="rocket_launch" />
            </div>
            <h3 class="rk-category-title">Inicio rápido</h3>
            <p class="rk-category-desc">Migración, onboarding y primeros pasos</p>
            <div class="rk-category-count">{{ faqs.length }} preguntas</div>
          </div>

          <!-- Contact CTA -->
          <div class="rk-contact-card">
            <div class="rk-contact-icon">
              <q-icon name="support_agent" />
            </div>
            <h4 class="rk-contact-title">¿No encuentras tu respuesta?</h4>
            <p class="rk-contact-text">Nuestro equipo está listo para ayudarte</p>
            <q-btn
              flat
              no-caps
              class="rk-contact-btn"
              label="Contactar soporte"
              icon-right="arrow_forward"
            />
          </div>
        </div>

        <!-- Right: FAQ Accordion -->
        <div class="rk-faq-content" data-aos="fade-left" data-aos-delay="400">
          <div class="rk-faq-list">
            <div
              v-for="(faq, index) in faqs"
              :key="index"
              class="rk-faq-item"
              :class="{ 'active': activeIndex === index, 'expanded': expandedIndex === index }"
              @mouseenter="activeIndex = index"
              @mouseleave="activeIndex = null"
            >
              <!-- FAQ Header -->
              <button
                class="rk-faq-question"
                @click="toggleFaq(index)"
              >
                <div class="rk-question-content">
                  <div class="rk-question-number">{{ String(index + 1).padStart(2, '0') }}</div>
                  <span class="rk-question-text">{{ faq.q }}</span>
                </div>
                <div class="rk-toggle-icon" :class="{ 'rotated': expandedIndex === index }">
                  <q-icon :name="expandedIndex === index ? 'remove' : 'add'" />
                </div>
              </button>

              <!-- FAQ Answer (Collapsible) -->
              <transition
                name="expand"
                @enter="enter"
                @after-enter="afterEnter"
                @leave="leave"
              >
                <div v-show="expandedIndex === index" class="rk-faq-answer-wrap">
                  <div class="rk-faq-answer">
                    <div class="rk-answer-content">
                      <p class="rk-answer-text">{{ faq.a }}</p>
                      <div v-if="faq.links" class="rk-answer-links">
                        <a
                          v-for="(link, li) in faq.links"
                          :key="li"
                          :href="link.url"
                          class="rk-answer-link"
                        >
                          <q-icon :name="link.icon" />
                          <span>{{ link.label }}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>

              <!-- Active Indicator Line -->
              <div class="rk-active-line"></div>
            </div>
          </div>

          <!-- Bottom Stats -->
          <div class="rk-faq-stats">
            <div class="rk-stat-item">
              <div class="rk-stat-icon-wrap">
                <q-icon name="chat" />
              </div>
              <div class="rk-stat-content">
                <div class="rk-stat-value">98%</div>
                <div class="rk-stat-label">Preguntas resueltas</div>
              </div>
            </div>
            <div class="rk-stat-divider"></div>
            <div class="rk-stat-item">
              <div class="rk-stat-icon-wrap">
                <q-icon name="schedule" />
              </div>
              <div class="rk-stat-content">
                <div class="rk-stat-value">< 2h</div>
                <div class="rk-stat-label">Tiempo de respuesta</div>
              </div>
            </div>
            <div class="rk-stat-divider"></div>
            <div class="rk-stat-item">
              <div class="rk-stat-icon-wrap">
                <q-icon name="verified" />
              </div>
              <div class="rk-stat-content">
                <div class="rk-stat-value">24/7</div>
                <div class="rk-stat-label">Disponibilidad</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom CTA Banner -->
      <div class="rk-faq-banner" data-aos="fade-up" data-aos-delay="500">
        <div class="rk-banner-bg"></div>
        <div class="rk-banner-content">
          <div class="rk-banner-icon">
            <q-icon name="auto_awesome" />
          </div>
          <div class="rk-banner-text">
            <h3 class="rk-banner-title">¿Listo para comenzar?</h3>
            <p class="rk-banner-desc">Prueba gratis por 14 días. Sin tarjeta de crédito requerida.</p>
          </div>
          <q-btn
            unelevated
            no-caps
            class="rk-banner-btn"
            label="Comenzar ahora"
            icon-right="arrow_forward"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const activeIndex = ref(null)
const expandedIndex = ref(null)

const faqs = [
  { 
    q: '¿Cómo puedo migrar mis datos existentes?', 
    a: 'Te acompañamos durante todo el proceso con herramientas de importación automática y soporte técnico dedicado. Nuestro equipo se encarga de validar y transferir tus datos de forma segura, garantizando cero pérdida de información.',
    links: [
      { label: 'Ver guía de migración', icon: 'description', url: '#' },
      { label: 'Agendar asistencia', icon: 'calendar_today', url: '#' }
    ]
  },
  { 
    q: '¿Qué métodos de pago aceptan?', 
    a: 'Aceptamos todas las tarjetas principales (Visa, Mastercard, Amex), transferencias bancarias y PayPal. Para empresas ofrecemos facturación mensual o anual con términos NET 30.',
    links: [
      { label: 'Ver opciones de pago', icon: 'payment', url: '#' }
    ]
  },
  { 
    q: '¿Es seguro almacenar mis datos en la nube?', 
    a: 'Absolutamente. Implementamos encriptación AES-256 en reposo y TLS 1.3 en tránsito. Contamos con autenticación multifactor (MFA), backups automáticos diarios, y cumplimos con ISO 27001, SOC 2 y GDPR. Tus datos están protegidos con los más altos estándares de seguridad.',
    links: [
      { label: 'Certificaciones de seguridad', icon: 'verified_user', url: '#' },
      { label: 'Política de privacidad', icon: 'policy', url: '#' }
    ]
  },
  { 
    q: '¿Puedo cancelar mi suscripción cuando quiera?', 
    a: 'Por supuesto. Todos nuestros planes son sin compromiso y sin penalizaciones. Puedes cancelar en cualquier momento desde tu panel de configuración. Tu acceso continuará hasta el final del período pagado.',
    links: [
      { label: 'Ver términos de cancelación', icon: 'info', url: '#' }
    ]
  },
  {
    q: '¿Ofrecen capacitación para nuevos usuarios?',
    a: 'Sí, incluimos onboarding personalizado con todos los planes Pro y Enterprise. Además, tenemos una biblioteca completa de tutoriales en video, documentación detallada y webinars mensuales gratuitos.',
    links: [
      { label: 'Acceder a recursos', icon: 'school', url: '#' },
      { label: 'Agendar capacitación', icon: 'event', url: '#' }
    ]
  },
  {
    q: '¿Qué nivel de soporte técnico incluye mi plan?',
    a: 'El plan Básico incluye soporte por correo (respuesta en 24h), el plan Pro tiene soporte prioritario por correo y chat (respuesta en 4h), y el plan Enterprise cuenta con soporte 24/7 por todos los canales incluyendo teléfono y gerente de cuenta dedicado.',
    links: [
      { label: 'Comparar planes', icon: 'compare', url: '#' }
    ]
  }
]

const toggleFaq = (index) => {
  expandedIndex.value = expandedIndex.value === index ? null : index
}

// Transition hooks for smooth animation
const enter = (el) => {
  el.style.height = '0'
}

const afterEnter = (el) => {
  el.style.height = 'auto'
}

const leave = (el) => {
  el.style.height = el.scrollHeight + 'px'
  setTimeout(() => {
    el.style.height = '0'
  }, 0)
}
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
.rk-faq-section {
  position: relative;
  padding: clamp(6rem, 12vh, 10rem) clamp(1.5rem, 5vw, 3rem);
  overflow: hidden;
  background: linear-gradient(180deg, #0d1b2a 0%, var(--color-bg-dark) 50%, #0a1628 100%);
  font-family: 'Sora', -apple-system, sans-serif;
}

/* Background */
.rk-faq-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.rk-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.02) 1px, transparent 1px);
  background-size: 80px 80px;
  opacity: 0.5;
}

.rk-glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.12;
}

.rk-orb-1 {
  width: 400px;
  height: 400px;
  top: 10%;
  left: -150px;
  background: radial-gradient(circle, var(--color-primary), transparent 60%);
}

.rk-orb-2 {
  width: 450px;
  height: 450px;
  bottom: 10%;
  right: -180px;
  background: radial-gradient(circle, var(--color-accent), transparent 60%);
}

.rk-floating-shapes {
  position: absolute;
  inset: 0;
}

.rk-shape {
  position: absolute;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  opacity: 0.03;
  border-radius: 20% 80% 50% 70%;
}

.rk-shape-1 {
  width: 200px;
  height: 200px;
  top: 20%;
  right: 10%;
  animation: float 20s ease-in-out infinite;
}

.rk-shape-2 {
  width: 150px;
  height: 150px;
  bottom: 30%;
  left: 15%;
  animation: float 25s ease-in-out infinite reverse;
}

.rk-shape-3 {
  width: 180px;
  height: 180px;
  top: 50%;
  right: 20%;
  animation: float 30s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(30px, -30px) rotate(120deg);
  }
  66% {
    transform: translate(-30px, 30px) rotate(240deg);
  }
}

/* Container */
.rk-faq-container {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  z-index: 1;
}

/* Header */
.rk-faq-header {
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

.rk-pulse-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--color-primary-light);
  border-radius: 50%;
  left: 16px;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 12px var(--color-primary-light);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
}

.rk-kicker .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-faq-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 900;
  line-height: 1.15;
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
}

.rk-highlight-underline {
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 10px;
}

.rk-faq-subtitle {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: rgba(255, 255, 255, 0.65);
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.7;
}

/* FAQ Layout */
.rk-faq-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: clamp(2.5rem, 5vw, 4rem);
  align-items: start;
}

/* Sidebar */
.rk-faq-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 100px;
}

.rk-category-card {
  padding: 28px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(20, 184, 166, 0.05));
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.rk-category-icon-wrap {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 14px;
  margin-bottom: 20px;
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3);
}

.rk-category-icon-wrap .q-icon {
  font-size: 28px;
  color: #fff;
}

.rk-category-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.95);
}

.rk-category-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 16px;
}

.rk-category-count {
  display: inline-flex;
  padding: 6px 14px;
  background: rgba(6, 182, 212, 0.15);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary-light);
}

/* Contact Card */
.rk-contact-card {
  padding: 28px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(20, 184, 166, 0.08));
  border: 1.5px solid rgba(6, 182, 212, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  text-align: center;
}

.rk-contact-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 50%;
  margin: 0 auto 20px;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
}

.rk-contact-icon .q-icon {
  font-size: 32px;
  color: #fff;
}

.rk-contact-title {
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.95);
}

.rk-contact-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 20px;
}

.rk-contact-btn {
  width: 100%;
  padding: 12px 20px;
  font-weight: 700;
  color: var(--color-primary-light);
  border: 2px solid rgba(6, 182, 212, 0.3);
  background: rgba(6, 182, 212, 0.08);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.rk-contact-btn:hover {
  border-color: rgba(6, 182, 212, 0.5);
  background: rgba(6, 182, 212, 0.15);
  transform: translateY(-2px);
}

/* FAQ Content */
.rk-faq-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* FAQ List */
.rk-faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* FAQ Item */
.rk-faq-item {
  position: relative;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.03), rgba(20, 184, 166, 0.03));
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.rk-faq-item:hover,
.rk-faq-item.active {
  border-color: rgba(6, 182, 212, 0.25);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.1);
}

.rk-faq-item.expanded {
  border-color: rgba(6, 182, 212, 0.35);
  box-shadow: 0 12px 32px rgba(6, 182, 212, 0.15);
}

/* FAQ Question */
.rk-faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
}

.rk-faq-question:hover {
  background: rgba(6, 182, 212, 0.05);
}

.rk-question-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.rk-question-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.15);
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 800;
  font-family: 'Space Mono', monospace;
  color: var(--color-primary-light);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.rk-faq-item.expanded .rk-question-number {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  transform: scale(1.05);
}

.rk-question-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  transition: color 0.3s ease;
}

.rk-faq-item.expanded .rk-question-text {
  color: rgba(255, 255, 255, 1);
}

.rk-toggle-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.12);
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.rk-toggle-icon.rotated {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  transform: rotate(180deg);
}

.rk-toggle-icon .q-icon {
  font-size: 20px;
  color: var(--color-primary-light);
  transition: color 0.3s;
}

.rk-toggle-icon.rotated .q-icon {
  color: #fff;
}

/* FAQ Answer */
.rk-faq-answer-wrap {
  overflow: hidden;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-faq-answer {
  padding: 0 28px 28px 88px;
}

.rk-answer-content {
  padding: 20px;
  background: rgba(6, 182, 212, 0.04);
  border-radius: 12px;
  border-left: 3px solid var(--color-primary);
}

.rk-answer-text {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
  margin: 0 0 16px 0;
}

.rk-answer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.rk-answer-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary-light);
  text-decoration: none;
  transition: all 0.3s ease;
}

.rk-answer-link:hover {
  background: rgba(6, 182, 212, 0.18);
  border-color: rgba(6, 182, 212, 0.4);
  transform: translateY(-2px);
}

.rk-answer-link .q-icon {
  font-size: 16px;
}

/* Active Line */
.rk-active-line {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, var(--color-primary), var(--color-accent));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rk-faq-item.expanded .rk-active-line {
  opacity: 1;
}

/* FAQ Stats */
.rk-faq-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 24px;
  padding: 32px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(20, 184, 166, 0.05));
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.rk-stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
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
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
}

.rk-stat-icon-wrap .q-icon {
  font-size: 24px;
  color: #fff;
}

.rk-stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
}

.rk-stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600;
}

.rk-stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(6, 182, 212, 0.2);
}

/* Bottom CTA Banner */
.rk-faq-banner {
  position: relative;
  padding: 40px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(20, 184, 166, 0.08));
  border: 2px solid rgba(6, 182, 212, 0.25);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  overflow: hidden;
  margin-top: clamp(3rem, 6vw, 5rem);
}

.rk-banner-bg {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(20, 184, 166, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.rk-banner-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  z-index: 1;
}

.rk-banner-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
}

.rk-banner-icon .q-icon {
  font-size: 36px;
  color: #fff;
}

.rk-banner-text {
  flex: 1;
}

.rk-banner-title {
  font-size: 1.75rem;
  font-weight: 900;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.95);
}

.rk-banner-desc {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.rk-banner-btn {
  padding: 16px 32px;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.rk-banner-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(6, 182, 212, 0.4);
}

.rk-banner-btn .q-icon {
  transition: transform 0.3s;
}

.rk-banner-btn:hover .q-icon {
  transform: translateX(4px);
}

/* Responsive */
@media (max-width: 1200px) {
  .rk-faq-layout {
    grid-template-columns: 1fr;
  }

  .rk-faq-sidebar {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 1023px) {
  .rk-faq-section {
    padding: clamp(5rem, 10vh, 7rem) clamp(1.25rem, 4vw, 2rem);
  }

  .rk-faq-stats {
    flex-direction: column;
    gap: 20px;
  }

  .rk-stat-divider {
    display: none;
  }

  .rk-banner-content {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 767px) {
  .rk-faq-section {
    padding: clamp(4rem, 8vh, 5rem) 1rem;
  }

  .rk-faq-sidebar {
    grid-template-columns: 1fr;
  }

  .rk-faq-question {
    padding: 20px;
  }

  .rk-question-content {
    gap: 12px;
  }

  .rk-question-number {
    width: 36px;
    height: 36px;
    font-size: 0.8rem;
  }

  .rk-question-text {
    font-size: 1rem;
  }

  .rk-faq-answer {
    padding: 0 20px 20px 20px;
  }

  .rk-answer-content {
    padding: 16px;
  }

  .rk-faq-banner {
    padding: 28px;
  }

  .rk-banner-icon {
    width: 56px;
    height: 56px;
  }

  .rk-banner-icon .q-icon {
    font-size: 28px;
  }

  .rk-banner-title {
    font-size: 1.4rem;
  }

  .rk-banner-btn {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .rk-question-text {
    font-size: 0.95rem;
  }

  .rk-answer-text {
    font-size: 0.92rem;
  }

  .rk-stat-value {
    font-size: 1.3rem;
  }

  .rk-banner-title {
    font-size: 1.25rem;
  }
}
</style>