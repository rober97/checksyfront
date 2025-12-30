<!-- src/pages/homepublic/HomePublic.vue (o tu ruta equivalente) -->
<template>
  <q-page class="mk-home">
    <!-- NAV -->
    <NavBar
      :brand="brand"
      :links="navLinks"
      :ctas="ctas"
      :active-section="activeSection"
      @navigate="handleNavigate"
    />

    <!-- HERO -->
    <HeroNoctua
      id="top"
      :pill="hero.pill"
      :title="hero.title"
      :highlight="hero.highlight"
      :subtitle="hero.subtitle"
      :primary-cta="hero.primaryCta"
      :secondary-cta="hero.secondaryCta"
      :preview-src="hero.previewSrc"
      :stats="heroStats"
    />

    <!-- PASOS -->
    <StepsTimeline
      id="como-funciona"
      eyebrow="Proceso simple"
      title="Comienza en 3 pasos"
      :steps="steps"
    />

    <!-- FEATURES -->
    <FeaturesGrid
      id="funciones"
      eyebrow="Potencia tu gestión"
      title="Características destacadas"
      :features="features"
    />
    <!-- PRICING -->
    <PricingPlans
      id="planes"
      eyebrow="Elige el mejor para ti"
      title="Planes flexibles"
      v-model:yearly="yearly"
      :plans="pricingPlans"
      :discount-label="pricing.discountLabel"
      :discount-factor="pricing.discountFactor"
      @select="onSelectPlan"
    />

    <!-- FAQ -->
    <FAQAccordion
      id="faq"
      eyebrow="¿Tienes dudas?"
      title="Preguntas frecuentes"
      :items="faqs"
    />

    <!-- CTA FINAL (opcional: puedes moverlo a Hero/Footer si quieres) -->
    <section class="mk-cta-final">
      <div class="mk-container text-center">
        <h3 class="mk-h2">¿Listo para operar con nivel enterprise?</h3>
        <p class="mk-subtitle">Prueba gratis durante 14 días. Sin tarjeta requerida.</p>

        <div class="row justify-center q-gutter-sm q-mt-sm">
          <q-btn
            color="white"
            text-color="primary"
            unelevated
            size="lg"
            label="Iniciar prueba"
            @click="handleNavigate('/register')"
          />
          <q-btn
            outline
            color="white"
            size="lg"
            label="Hablar con ventas"
            @click="handleNavigate('#contacto')"
          />
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <FooterNoctua
      id="contacto"
      :brand="brand"
      :links="footerLinks"
      v-model:language="language"
      :language-options="languageOptions"
      :social="social"
      @navigate="handleNavigate"
    />
  </q-page>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Subcomponentes marketing (auto-contenidos)
 * Ajusta paths si tu estructura difiere.
 */
import NavBar from '@/components/marketing/NavBar.vue'
import HeroNoctua from '@/components/marketing/HeroNoctua.vue'
import StepsTimeline from '@/components/marketing/StepsTimeline.vue'
import FeaturesGrid from '@/components/marketing/FeaturesGrid.vue'
import PricingPlans from '@/components/marketing/PricingPlans.vue'
import FAQAccordion from '@/components/marketing/FAQAccordion.vue'
import FooterNoctua from '@/components/marketing/FooterNoctua.vue'

const router = useRouter()

/* -----------------------------
 * Contenido central (fuente única de verdad)
 * ----------------------------- */
const brand = {
  name: 'Recksy',
  icon: 'bolt',
  to: '/'
}

const navLinks = [
  { label: 'Inicio', to: '#top' },
  { label: 'Cómo Funciona', to: '#como-funciona' },
  { label: 'Características', to: '#funciones' },
  { label: 'Planes', to: '#planes' },
  { label: 'FAQ', to: '#faq' },
  { label: 'Contacto', to: '#contacto' }
]

const ctas = [
  { label: 'Ingresar', to: '/login', variant: 'ghost' },
  { label: 'Comenzar', to: '/register', variant: 'primary' }
]

const hero = {
  pill: 'Plataforma integral · Asistencia · Desempeño · Bienestar',
  title: 'Gestiona',
  highlight: 'personas',
  subtitle:
    'La suite moderna para equipos exigentes. Datos en tiempo real, UX impecable y automatizaciones que ahorran horas cada semana.',
  primaryCta: { label: 'Probar gratis 14 días', to: '/register' },
  secondaryCta: { label: 'Ver demo', to: '/demo' },
  previewSrc: 'https://cdn.quasar.dev/img/parallax2.jpg'
}

const demoTeaserSrc = 'https://cdn.quasar.dev/img/mountains.jpg'

const steps = [
  { icon: 'person_add', title: 'Registra tu equipo', text: 'Importa o crea usuarios con un asistente guiado.' },
  { icon: 'tune', title: 'Define reglas', text: 'Horarios, políticas de asistencia y evaluaciones.' },
  { icon: 'insights', title: 'Monitorea y mejora', text: 'Dashboards y alertas en tiempo real.' }
]

const features = [
  { icon: 'fingerprint', title: 'Control de asistencia', description: 'Biometría, geolocalización y marcaje móvil.' },
  { icon: 'bar_chart', title: 'Desempeño 360°', description: 'KPIs claros, feedback y planes de mejora.' },
  { icon: 'mood', title: 'Bienestar', description: 'Clima, reconocimientos y pulse surveys.' },
  { icon: 'integration_instructions', title: 'Integraciones', description: 'Slack, Google Workspace, Teams y más.' },
  { icon: 'security', title: 'Seguridad avanzada', description: 'MFA, cifrado y cumplimiento normativo.' },
  { icon: 'support_agent', title: 'Soporte premium', description: 'Onboarding y acompañamiento experto.' }
]

/* Pricing */
const yearly = ref(false)
const pricing = {
  discountLabel: '-20%',
  discountFactor: 0.8
}

const pricingPlans = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Para equipos pequeños',
    price: 29,
    popular: false,
    features: ['Hasta 20 usuarios', 'Asistencia básica', 'Reportes mensuales', 'Soporte por correo']
  },
  {
    id: 'pro',
    name: 'Profesional',
    description: 'Para empresas en crecimiento',
    price: 59,
    popular: true,
    features: ['Hasta 100 usuarios', 'Asistencia avanzada', 'Evaluación de desempeño', 'Integraciones básicas', 'Soporte prioritario']
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    description: 'Para organizaciones grandes',
    price: 99,
    popular: false,
    features: ['Usuarios ilimitados', 'Funciones avanzadas', 'Analítica', 'Integraciones premium', 'Soporte 24/7']
  }
]

/* FAQ */
const faqs = [
  { question: '¿Puedo probar sin tarjeta?', answer: 'Sí. La prueba no requiere tarjeta y puedes cancelar cuando quieras.' },
  { question: '¿Funciona en móvil?', answer: 'Sí. El marcaje y la gestión están optimizados para móvil y escritorio.' },
  { question: '¿Incluye integraciones?', answer: 'Depende del plan. Puedes partir con integraciones básicas y escalar.' }
]

/* Footer */
const language = ref('es')
const languageOptions = [
  { label: 'Español', value: 'es' },
  { label: 'English', value: 'en' },
  { label: 'Português', value: 'pt' }
]

const social = [
  { icon: 'mdi-twitter', to: 'https://twitter.com' },
  { icon: 'mdi-linkedin', to: 'https://linkedin.com' },
  { icon: 'mdi-github', to: 'https://github.com' }
]

const footerLinks = [
  {
    title: 'Producto',
    links: [
      { label: 'Características', to: '#funciones' },
      { label: 'Planes', to: '#planes' },
      { label: 'Demo', to: '/demo' },
      { label: 'Novedades', to: '/updates' }
    ]
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Blog', to: '/blog' },
      { label: 'Guías', to: '/guides' },
      { label: 'Webinars', to: '/webinars' },
      { label: 'Centro de ayuda', to: '/help' }
    ]
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Nosotros', to: '/about' },
      { label: 'Carreras', to: '/careers' },
      { label: 'Socios', to: '/partners' },
      { label: 'Contacto', to: '#contacto' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacidad', to: '/privacy' },
      { label: 'Términos', to: '/terms' },
      { label: 'Seguridad', to: '/security' },
      { label: 'Cookies', to: '/cookies' }
    ]
  }
]

/* -----------------------------
 * Scroll & navegación (robusta)
 * ----------------------------- */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

const scrollTo = async (hash) => {
  if (!hash || typeof hash !== 'string') return
  if (!hash.startsWith('#')) return

  await nextTick()

  const el = document.querySelector(hash)
  if (!el) return

  // Usamos CSS scroll-margin-top para que no dependa del alto del header
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

const handleNavigate = async (to) => {
  if (!to) return

  // Anchor interno
  if (typeof to === 'string' && to.startsWith('#')) {
    await scrollTo(to)
    return
  }

  // Route
  if (typeof to === 'string') {
    await router.push(to)
  } else if (typeof to === 'object') {
    await router.push(to)
  }
}

/* -----------------------------
 * Active section (para NavBar)
 * ----------------------------- */
const activeSection = ref('#top')
let sectionObserver = null

const setupActiveSectionObserver = () => {
  const ids = ['#top', '#como-funciona', '#funciones', '#demo', '#planes', '#faq', '#contacto']
  const els = ids.map((h) => document.querySelector(h)).filter(Boolean)

  sectionObserver = new IntersectionObserver(
    (entries) => {
      // Elegimos el que esté más “visible”
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0]

      if (visible?.target?.id) activeSection.value = `#${visible.target.id}`
    },
    { root: null, threshold: [0.12, 0.22, 0.35, 0.5], rootMargin: '-20% 0px -55% 0px' }
  )

  els.forEach((el) => sectionObserver.observe(el))
}

/* -----------------------------
 * Reveal on scroll (para marketing)
 * ----------------------------- */
let revealObserver = null

const setupReveal = () => {
  if (prefersReducedMotion()) {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'))
    return
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('is-revealed')
      })
    },
    { threshold: 0.12 }
  )

  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el))
}

/* -----------------------------
 * Stats animados (Hero)
 * ----------------------------- */
const heroStatsRaw = ref({
  clients: 0,
  saves: 0,
  uptime: 0
})

const heroStatsTarget = {
  clients: 250,
  saves: 1200,
  uptime: 99.9
}

const heroStats = computed(() => [
  { value: heroStatsRaw.value.clients, label: 'Empresas activas' },
  { value: heroStatsRaw.value.saves, label: 'Horas ahorradas / mes' },
  { value: `${heroStatsRaw.value.uptime}%`, label: 'Uptime garantizado' }
])

const easeOut = (x) => 1 - Math.pow(1 - x, 3)

const animateHeroStats = () => {
  if (prefersReducedMotion()) {
    heroStatsRaw.value = { ...heroStatsTarget }
    return
  }

  const start = performance.now()
  const dur = 1000

  const tick = (t) => {
    const k = Math.min(1, (t - start) / dur)
    heroStatsRaw.value.clients = Math.round(heroStatsTarget.clients * easeOut(k))
    heroStatsRaw.value.saves = Math.round(heroStatsTarget.saves * easeOut(k))
    heroStatsRaw.value.uptime = Math.round(heroStatsTarget.uptime * k * 10) / 10
    if (k < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

/* -----------------------------
 * Pricing callback
 * ----------------------------- */
const onSelectPlan = (planId) => {
  // Aquí puedes redirigir, abrir modal, tracking, etc.
  // Ej: router.push({ name: 'register', query: { plan: planId, yearly: yearly.value ? '1' : '0' } })
  console.log('Plan seleccionado:', planId, 'yearly:', yearly.value)
}

onMounted(async () => {
  // Soporta navegación directa con hash (#planes)
  await nextTick()
  if (window.location.hash) scrollTo(window.location.hash)

  animateHeroStats()
  setupReveal()
  setupActiveSectionObserver()
})

onBeforeUnmount(() => {
  try {
    revealObserver?.disconnect?.()
    sectionObserver?.disconnect?.()
  } catch (e) {}
})
</script>

<style scoped>
/* Home “orquestador”: define tokens + helpers comunes para marketing */
.mk-home {
  /* Tokens base: tus subcomponentes pueden consumir estas CSS vars */
  --mk-bg: #0c1016;
  --mk-surface: #0f141c;
  --mk-soft: #141b25;
  --mk-border: rgba(255, 255, 255, 0.08);
  --mk-txt: #cfd8e3;
  --mk-muted: #93a1b3;
  --mk-primary: #4f83ff;
  --mk-secondary: #22d3a3;

  background: var(--mk-bg);
  color: var(--mk-txt);
}

/* Scroll offset sin JS: cada sección respeta el header */
:global(#top),
:global(#como-funciona),
:global(#funciones),
:global(#demo),
:global(#planes),
:global(#faq),
:global(#contacto) {
  scroll-margin-top: 88px; /* ajusta si tu header es más alto */
}

/* Helpers para secciones “sueltas” que aún no están componentizadas */
.mk-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}
.mk-section {
  padding: 84px 0;
}
.mk-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 800;
  font-size: 12px;
  color: var(--mk-muted);
}
.mk-h2 {
  font-size: clamp(26px, 3vw, 40px);
  font-weight: 900;
  letter-spacing: -0.2px;
}
.mk-text {
  color: var(--mk-muted);
}
.mk-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  max-width: 60ch;
  margin: 10px auto 0;
}

/* Card simple */
.mk-card {
  background: var(--mk-surface);
  border: 1px solid var(--mk-border);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.mk-media {
  padding: 10px;
}

/* CTA final */
.mk-cta-final {
  padding: 84px 0;
  background: linear-gradient(135deg, var(--mk-primary), var(--mk-secondary));
  color: #fff;
}

/* Reveal común */
:global([data-reveal]) {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
  transition: opacity 0.45s ease, transform 0.45s ease;
}
:global(.is-revealed) {
  opacity: 1 !important;
  transform: none !important;
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  :global([data-reveal]) {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
</style>
