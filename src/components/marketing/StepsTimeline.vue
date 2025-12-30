<template>
  <section id="como-funciona" class="rk-howworks-section">
    <!-- Background decorativo -->
    <div class="rk-howworks-bg">
      <div class="rk-grid-pattern"></div>
      <div class="rk-glow-orb rk-orb-1"></div>
      <div class="rk-glow-orb rk-orb-2"></div>
    </div>

    <div class="rk-howworks-container">
      
      <!-- Header -->
      <div class="rk-howworks-header">
        <div class="rk-kicker" data-aos="fade-up">
          <q-icon name="auto_fix_high" class="rk-kicker-icon" />
          Proceso simple
        </div>
        <h2 class="rk-howworks-title" data-aos="fade-up" data-aos-delay="100">
          Cómo <span class="rk-highlight">funciona</span>
        </h2>
        <p class="rk-howworks-subtitle" data-aos="fade-up" data-aos-delay="200">
          En tres pasos simples queda todo operativo. Sin complicaciones, sin demoras.
        </p>
      </div>

      <!-- Steps timeline -->
      <div class="rk-timeline-connector"></div>

      <!-- Steps grid -->
      <div class="rk-steps-grid">
        <div 
          v-for="(step, index) in steps" 
          :key="index"
          class="rk-step-card"
          :data-aos="'fade-up'"
          :data-aos-delay="100 * index"
        >
          <!-- Step number badge -->
          <div class="rk-step-badge">
            <span class="rk-step-number">{{ index + 1 }}</span>
            <div class="rk-badge-glow"></div>
          </div>

          <!-- Card content -->
          <div class="rk-step-content">
            <!-- Icon wrapper -->
            <div class="rk-step-icon-wrapper">
              <div class="rk-icon-bg"></div>
              <q-icon :name="step.icon" class="rk-step-icon" />
            </div>

            <!-- Text content -->
            <div class="rk-step-text">
              <h3 class="rk-step-title">{{ step.title }}</h3>
              <p class="rk-step-desc">{{ step.desc }}</p>
            </div>

            <!-- Features list -->
            <ul class="rk-step-features" v-if="step.features">
              <li v-for="(feature, fi) in step.features" :key="fi">
                <q-icon name="check_circle" />
                <span>{{ feature }}</span>
              </li>
            </ul>

            <!-- Action link -->
            <div class="rk-step-action">
              <a href="#" class="rk-step-link">
                Saber más
                <q-icon name="arrow_forward" />
              </a>
            </div>
          </div>

          <!-- Decorative corner -->
          <div class="rk-card-corner"></div>

          <!-- Hover effect overlay -->
          <div class="rk-card-shine"></div>
        </div>
      </div>

      <!-- CTA Bottom -->
      <div class="rk-howworks-cta" data-aos="fade-up" data-aos-delay="400">
        <div class="rk-cta-content">
          <h3 class="rk-cta-title">¿Listo para empezar?</h3>
          <p class="rk-cta-text">Configura tu cuenta en menos de 5 minutos</p>
        </div>
        <q-btn 
          unelevated 
          no-caps
          class="rk-cta-btn"
          label="Comenzar ahora"
          icon-right="rocket_launch"
        />
      </div>

    </div>
  </section>
</template>

<script setup>
const steps = [
  { 
    icon: 'person_add', 
    title: 'Registra tu equipo', 
    desc: 'Carga o crea colaboradores con nuestro asistente inteligente.',
    features: [
      'Importación masiva desde Excel',
      'Onboarding automatizado',
      'Perfiles personalizables'
    ]
  },
  { 
    icon: 'tune', 
    title: 'Configura reglas', 
    desc: 'Define horarios, políticas de asistencia y criterios de evaluación.',
    features: [
      'Templates predefinidos',
      'Reglas flexibles',
      'Aprobaciones automáticas'
    ]
  },
  { 
    icon: 'insights', 
    title: 'Monitorea y mejora', 
    desc: 'Accede a dashboards en tiempo real con alertas y recomendaciones.',
    features: [
      'Métricas en vivo',
      'Reportes automáticos',
      'Análisis predictivo'
    ]
  }
]
</script>

<style scoped>
/* Section */
.rk-howworks-section {
  position: relative;
  padding: clamp(4rem, 10vw, 8rem) clamp(1rem, 5vw, 3rem);
  overflow: hidden;
  background: linear-gradient(180deg, 
    rgba(18, 18, 18, 1) 0%,
    rgba(24, 24, 24, 1) 50%,
    rgba(18, 18, 18, 1) 100%
  );
}

/* Background */
.rk-howworks-bg {
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
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 70%);
}

.rk-glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: float-orb 20s ease-in-out infinite;
}

.rk-orb-1 {
  width: 400px;
  height: 400px;
  top: 10%;
  left: -100px;
  background: radial-gradient(circle, #d89b27, transparent 70%);
}

.rk-orb-2 {
  width: 500px;
  height: 500px;
  bottom: 10%;
  right: -150px;
  background: radial-gradient(circle, #6366f1, transparent 70%);
  animation-delay: -10s;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-30px, 30px) scale(0.9); }
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
  font-size: 16px;
  animation: rotate-icon 3s ease-in-out infinite;
}

@keyframes rotate-icon {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(15deg); }
}

.rk-howworks-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.95);
}

.rk-highlight {
  background: linear-gradient(135deg, var(--rk-primary), #ffd98a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.rk-highlight::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 10px;
  background: linear-gradient(135deg, var(--rk-primary), #ffd98a);
  opacity: 0.2;
  border-radius: 4px;
  z-index: -1;
}

.rk-howworks-subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(255, 255, 255, 0.6);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Timeline connector */
.rk-timeline-connector {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 1000px;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(216, 155, 39, 0.3) 20%,
    rgba(216, 155, 39, 0.5) 50%,
    rgba(216, 155, 39, 0.3) 80%,
    transparent 100%
  );
  z-index: 0;
}

/* Steps grid */
.rk-steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: clamp(1.5rem, 3vw, 2.5rem);
  margin-bottom: clamp(3rem, 6vw, 5rem);
  position: relative;
  z-index: 1;
}

/* Step card */
.rk-step-card {
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 32px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.rk-step-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(216, 155, 39, 0.05) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
}

.rk-step-card:hover {
  transform: translateY(-8px);
  border-color: rgba(216, 155, 39, 0.3);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(216, 155, 39, 0.1),
    inset 0 0 20px rgba(216, 155, 39, 0.05);
}

.rk-step-card:hover::before {
  opacity: 1;
}

/* Step badge */
.rk-step-badge {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(216, 155, 39, 0.15);
  border: 2px solid rgba(216, 155, 39, 0.3);
  border-radius: 50%;
  z-index: 2;
  transition: all 0.4s ease;
}

.rk-step-card:hover .rk-step-badge {
  transform: scale(1.1) rotate(10deg);
  background: rgba(216, 155, 39, 0.25);
  border-color: rgba(216, 155, 39, 0.5);
}

.rk-step-number {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--rk-primary);
  z-index: 1;
}

.rk-badge-glow {
  position: absolute;
  inset: -4px;
  background: var(--rk-primary);
  border-radius: 50%;
  filter: blur(12px);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 0;
}

.rk-step-card:hover .rk-badge-glow {
  opacity: 0.3;
}

/* Step content */
.rk-step-content {
  position: relative;
  z-index: 1;
}

/* Icon wrapper */
.rk-step-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
}

.rk-icon-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--rk-primary), #b8821f);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 24px rgba(216, 155, 39, 0.3);
}

.rk-step-card:hover .rk-icon-bg {
  transform: rotate(-5deg) scale(1.05);
  box-shadow: 0 12px 32px rgba(216, 155, 39, 0.45);
}

.rk-step-icon {
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

.rk-step-card:hover .rk-step-icon {
  transform: scale(1.1) rotate(5deg);
}

/* Text */
.rk-step-text {
  margin-bottom: 20px;
}

.rk-step-title {
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.95);
  transition: color 0.3s ease;
}

.rk-step-card:hover .rk-step-title {
  color: #ffffff;
}

.rk-step-desc {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  transition: color 0.3s ease;
}

.rk-step-card:hover .rk-step-desc {
  color: rgba(255, 255, 255, 0.75);
}

/* Features list */
.rk-step-features {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.rk-step-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
}

.rk-step-features li:hover {
  color: rgba(255, 255, 255, 0.9);
  transform: translateX(4px);
}

.rk-step-features .q-icon {
  color: #4ade80;
  font-size: 16px;
  flex-shrink: 0;
}

/* Action link */
.rk-step-action {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.rk-step-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rk-primary);
  text-decoration: none;
  transition: all 0.3s ease;
}

.rk-step-link:hover {
  gap: 10px;
  color: #ffd98a;
}

.rk-step-link .q-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.rk-step-link:hover .q-icon {
  transform: translateX(4px);
}

/* Card decorations */
.rk-card-corner {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, transparent 50%, rgba(216, 155, 39, 0.05) 50%);
  border-radius: 0 24px 0 0;
  pointer-events: none;
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
  transform: rotate(45deg) translateX(-100%);
  transition: transform 0.6s ease;
  pointer-events: none;
}

.rk-step-card:hover .rk-card-shine {
  transform: rotate(45deg) translateX(100%);
}

/* CTA */
.rk-howworks-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: clamp(2rem, 4vw, 3rem);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  backdrop-filter: blur(10px);
}

.rk-cta-content {
  flex: 1;
}

.rk-cta-title {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 700;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.95);
}

.rk-cta-text {
  font-size: clamp(0.9375rem, 2vw, 1.125rem);
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.rk-cta-btn {
  padding: 16px 32px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, var(--rk-primary), #b8821f);
  color: #000000;
  border-radius: 12px;
  box-shadow: 
    0 8px 24px rgba(216, 155, 39, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.rk-cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 32px rgba(216, 155, 39, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* Responsive */
@media (max-width: 1023px) {
  .rk-howworks-section {
    padding: clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem);
  }

  .rk-steps-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 1.5rem;
  }

  .rk-step-card {
    padding: 28px;
  }

  .rk-timeline-connector {
    display: none;
  }
}

@media (max-width: 767px) {
  .rk-howworks-section {
    padding: clamp(2.5rem, 6vw, 4rem) 1rem;
  }

  .rk-steps-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .rk-step-card {
    padding: 24px;
  }

  .rk-step-badge {
    width: 40px;
    height: 40px;
    top: 20px;
    right: 20px;
  }

  .rk-step-number {
    font-size: 1.125rem;
  }

  .rk-step-icon-wrapper {
    width: 56px;
    height: 56px;
    margin-bottom: 20px;
  }

  .rk-step-icon {
    font-size: 24px !important;
  }

  .rk-step-title {
    font-size: 1.25rem;
  }

  .rk-step-desc {
    font-size: 0.875rem;
  }

  .rk-howworks-cta {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .rk-cta-btn {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .rk-step-card {
    padding: 20px;
  }

  .rk-step-icon-wrapper {
    width: 52px;
    height: 52px;
  }

  .rk-step-features li {
    font-size: 0.8125rem;
  }
}
</style>