<template>
  <section id="funciones" class="rk-features-section">
    <!-- Background decorativo -->
    <div class="rk-features-bg">
      <div class="rk-grid-pattern"></div>
      <div class="rk-gradient-orb rk-orb-1"></div>
      <div class="rk-gradient-orb rk-orb-2"></div>
    </div>

    <div class="rk-features-container">
      <!-- Header de sección -->
      <div class="rk-features-header">
        <div class="rk-kicker" data-aos="fade-up">
          <span class="rk-kicker-icon">⚡</span>
          Potencia tu gestión
        </div>
        <h2 class="rk-features-title" data-aos="fade-up" data-aos-delay="100">
          Características que 
          <span class="rk-highlight">transforman</span>
        </h2>
        <p class="rk-features-subtitle" data-aos="fade-up" data-aos-delay="200">
          Herramientas diseñadas para impulsar la productividad y el bienestar de tu equipo
        </p>
      </div>

      <!-- Grid de características -->
      <div class="rk-features-grid">
        <div 
          v-for="(feature, index) in features" 
          :key="index"
          class="rk-feature-card"
          :data-aos="'fade-up'"
          :data-aos-delay="50 * index"
        >
          <!-- Brillo de hover -->
          <div class="rk-card-shine"></div>
          
          <!-- Contenido -->
          <div class="rk-feature-icon-wrapper">
            <div class="rk-feature-icon-bg"></div>
            <q-icon 
              :name="feature.icon" 
              class="rk-feature-icon"
            />
          </div>

          <div class="rk-feature-content">
            <h3 class="rk-feature-title">{{ feature.title }}</h3>
            <p class="rk-feature-desc">{{ feature.desc }}</p>
          </div>

          <!-- Badge opcional -->
          <div v-if="feature.badge" class="rk-feature-badge">
            {{ feature.badge }}
          </div>

          <!-- Hover indicator -->
          <div class="rk-feature-arrow">
            <q-icon name="arrow_forward" />
          </div>
        </div>
      </div>

      <!-- CTA opcional -->
      <div class="rk-features-cta" data-aos="fade-up" data-aos-delay="400">
        <p class="rk-cta-text">¿Listo para transformar tu gestión de RRHH?</p>
        <q-btn 
          unelevated 
          no-caps
          class="rk-cta-btn"
          label="Explorar todas las funciones"
          icon-right="arrow_forward"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
const features = [
  { 
    icon: 'fingerprint', 
    title: 'Control de asistencia', 
    desc: 'Geolocalización, biométricos y marcaje móvil en tiempo real.',
    badge: 'Popular'
  },
  { 
    icon: 'leaderboard', 
    title: 'Performance', 
    desc: 'Métricas objetivas, feedback 360° y evaluaciones inteligentes.'
  },
  { 
    icon: 'mood', 
    title: 'Bienestar', 
    desc: 'Encuestas de clima, reconocimientos y análisis de satisfacción.',
    badge: 'Nuevo'
  },
  { 
    icon: 'integration_instructions', 
    title: 'Integraciones', 
    desc: 'Conecta con Slack, Google Workspace, MS Teams y más.'
  },
  { 
    icon: 'gpp_maybe', 
    title: 'Seguridad', 
    desc: 'Encriptación end-to-end, MFA y cumplimiento normativo local.'
  },
  { 
    icon: 'support_agent', 
    title: 'Soporte premium', 
    desc: 'Onboarding dedicado, capacitaciones y asistencia prioritaria 24/7.'
  }
]
</script>

<style scoped>
/* Sección principal */
.rk-features-section {
  position: relative;
  padding: clamp(4rem, 10vw, 8rem) clamp(1rem, 5vw, 3rem);
  overflow: hidden;
  background: linear-gradient(180deg, 
    rgba(var(--rk-soft-rgb, 24, 24, 24), 1) 0%,
    rgba(var(--rk-surface-rgb, 18, 18, 18), 1) 100%
  );
}

/* Background decorativo */
.rk-features-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.rk-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
}

.rk-gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: float 20s ease-in-out infinite;
}

.rk-orb-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, var(--rk-primary, #d89b27), transparent 70%);
}

.rk-orb-2 {
  width: 500px;
  height: 500px;
  bottom: -150px;
  left: -150px;
  background: radial-gradient(circle, #6366f1, transparent 70%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-30px, 30px) scale(0.9); }
}

/* Container */
.rk-features-container {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  z-index: 1;
}

/* Header */
.rk-features-header {
  text-align: center;
  margin-bottom: clamp(3rem, 6vw, 5rem);
}

.rk-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  margin-bottom: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--rk-primary, #d89b27);
  background: rgba(216, 155, 39, 0.1);
  border: 1px solid rgba(216, 155, 39, 0.2);
  border-radius: 50px;
  backdrop-filter: blur(10px);
}

.rk-kicker-icon {
  font-size: 1rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

.rk-features-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.rk-highlight {
  position: relative;
  background: linear-gradient(135deg, var(--rk-primary, #d89b27), #f0b647);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.rk-highlight::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 12px;
  background: linear-gradient(135deg, var(--rk-primary, #d89b27), #f0b647);
  opacity: 0.2;
  border-radius: 4px;
  z-index: -1;
}

.rk-features-subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(255, 255, 255, 0.6);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Grid de características */
.rk-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: clamp(1.5rem, 3vw, 2rem);
  margin-bottom: clamp(3rem, 6vw, 5rem);
}

/* Card de característica */
.rk-feature-card {
  position: relative;
  padding: 32px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.rk-feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(var(--rk-primary-rgb, 216, 155, 39), 0.05) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
}

.rk-feature-card:hover {
  transform: translateY(-8px);
  border-color: rgba(216, 155, 39, 0.3);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(216, 155, 39, 0.1),
    inset 0 0 20px rgba(216, 155, 39, 0.05);
}

.rk-feature-card:hover::before {
  opacity: 1;
}

/* Brillo de hover */
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
  transform: rotate(45deg) translateX(-100%);
  transition: transform 0.6s ease;
}

.rk-feature-card:hover .rk-card-shine {
  transform: rotate(45deg) translateX(100%);
}

/* Ícono */
.rk-feature-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
}

.rk-feature-icon-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--rk-primary, #d89b27), #b8821f);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 24px rgba(216, 155, 39, 0.3);
}

.rk-feature-card:hover .rk-feature-icon-bg {
  transform: rotate(8deg) scale(1.05);
  box-shadow: 0 12px 32px rgba(216, 155, 39, 0.45);
}

.rk-feature-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px !important;
  color: #000000;
  z-index: 1;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-feature-card:hover .rk-feature-icon {
  transform: scale(1.1);
}

/* Contenido */
.rk-feature-content {
  position: relative;
  z-index: 1;
}

.rk-feature-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.95);
  transition: color 0.3s ease;
}

.rk-feature-card:hover .rk-feature-title {
  color: #ffffff;
}

.rk-feature-desc {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  transition: color 0.3s ease;
}

.rk-feature-card:hover .rk-feature-desc {
  color: rgba(255, 255, 255, 0.75);
}

/* Badge */
.rk-feature-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #000000;
  background: linear-gradient(135deg, var(--rk-primary, #d89b27), #f0b647);
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(216, 155, 39, 0.3);
  z-index: 2;
}

/* Arrow indicator */
.rk-feature-arrow {
  position: absolute;
  bottom: 24px;
  right: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  opacity: 0;
  transform: translate(-8px, 8px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-feature-arrow .q-icon {
  font-size: 18px;
  color: var(--rk-primary, #d89b27);
}

.rk-feature-card:hover .rk-feature-arrow {
  opacity: 1;
  transform: translate(0, 0);
}

/* CTA Section */
.rk-features-cta {
  text-align: center;
  padding: clamp(2rem, 4vw, 3rem);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  backdrop-filter: blur(10px);
}

.rk-cta-text {
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 600;
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.rk-cta-btn {
  padding: 14px 32px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, var(--rk-primary, #d89b27), #b8821f);
  color: #000000;
  border-radius: 12px;
  box-shadow: 
    0 8px 24px rgba(216, 155, 39, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 32px rgba(216, 155, 39, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* Responsive */
@media (max-width: 1023px) {
  .rk-features-section {
    padding: clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem);
  }

  .rk-features-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 1.5rem;
  }

  .rk-feature-card {
    padding: 24px;
  }

  .rk-feature-icon-wrapper {
    width: 56px;
    height: 56px;
    margin-bottom: 20px;
  }

  .rk-feature-icon {
    font-size: 24px !important;
  }
}

@media (max-width: 599px) {
  .rk-features-section {
    padding: clamp(2.5rem, 6vw, 4rem) 1rem;
  }

  .rk-features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .rk-feature-card {
    padding: 20px;
  }

  .rk-feature-icon-wrapper {
    width: 52px;
    height: 52px;
    margin-bottom: 16px;
  }

  .rk-feature-title {
    font-size: 1.125rem;
  }

  .rk-feature-desc {
    font-size: 0.875rem;
  }

  .rk-feature-badge {
    top: 16px;
    right: 16px;
    padding: 4px 10px;
    font-size: 0.6875rem;
  }

  .rk-features-cta {
    padding: 1.5rem;
  }

  .rk-cta-btn {
    width: 100%;
  }
}

/* Animaciones para data-aos (opcional) */
[data-aos] {
  pointer-events: auto;
}
</style>