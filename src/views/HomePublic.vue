<template>
  <q-page class="rk-home" :class="{ 'is-dark': isDark }">
    <!-- ======================== HEADER ======================== -->
    <header class="rk-header" :class="{ 'is-scrolled': scrolled }">
      <div class="rk-header__inner">
        <router-link to="/" class="rk-brand" aria-label="Recksy">
          <span class="rk-brand__mark"><q-icon name="bolt"/></span>
          <span class="rk-brand__name">Recksy</span>
        </router-link>

        <nav class="rk-nav gt-sm" aria-label="Principal">
          <a
            v-for="link in navLinks"
            :key="link.to"
            :href="link.to"
            class="rk-nav__link"
            :class="{ active: activeSection === link.to }"
            @click.prevent="scrollTo(link.to)"
          >{{ link.label }}</a>
        </nav>

        <div class="rk-header__cta gt-sm">
          <button
            type="button"
            class="rk-theme-toggle"
            :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
            :title="isDark ? 'Modo claro' : 'Modo oscuro'"
            @click="toggleDark"
          >
            <q-icon :name="isDark ? 'light_mode' : 'dark_mode'" />
          </button>
          <q-btn flat no-caps class="rk-btn rk-btn--ghost" label="Ingresar" @click="goTo('/login')" />
          <q-btn unelevated no-caps class="rk-btn rk-btn--primary" label="Comenzar gratis" icon-right="arrow_forward" @click="goTo('/register')" />
        </div>

        <button
          type="button"
          class="rk-theme-toggle lt-md"
          :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
          @click="toggleDark"
        >
          <q-icon :name="isDark ? 'light_mode' : 'dark_mode'" />
        </button>
        <q-btn flat round dense class="lt-md rk-mobile-toggle" :icon="mobileOpen ? 'close' : 'menu'" @click="mobileOpen = !mobileOpen" />
      </div>

      <transition name="fade">
        <div v-if="mobileOpen" class="rk-mobile-menu lt-md">
          <a
            v-for="link in navLinks"
            :key="link.to"
            :href="link.to"
            class="rk-mobile-menu__link"
            @click.prevent="scrollTo(link.to); mobileOpen = false"
          >{{ link.label }}</a>
          <div class="rk-mobile-menu__cta">
            <q-btn flat no-caps class="rk-btn rk-btn--ghost full-width" label="Ingresar" @click="goTo('/login')" />
            <q-btn unelevated no-caps class="rk-btn rk-btn--primary full-width" label="Comenzar gratis" @click="goTo('/register')" />
          </div>
        </div>
      </transition>
    </header>

    <!-- ======================== HERO ======================== -->
    <section id="top" class="rk-hero">
      <div class="rk-hero__bg" aria-hidden="true">
        <div class="rk-hero__halo rk-hero__halo--1"></div>
        <div class="rk-hero__halo rk-hero__halo--2"></div>
        <div class="rk-hero__grid"></div>
      </div>

      <div class="rk-container rk-hero__inner">
        <div class="rk-hero__copy">
          <span class="rk-eyebrow">
            <span class="rk-eyebrow__dot"></span>
            Plataforma RR.HH. integral
          </span>

          <h1 class="rk-hero__title">
            La gestión de personas,<br/>
            <span class="rk-grad">simple y precisa.</span>
          </h1>

          <p class="rk-hero__lead">
            Asistencia, desempeño, liquidaciones y cumplimiento DT en una sola
            suite. Datos en tiempo real y automatizaciones que ahorran horas a tu
            equipo cada semana.
          </p>

          <div class="rk-hero__cta">
            <q-btn
              unelevated no-caps size="lg"
              class="rk-btn rk-btn--primary rk-btn--lg"
              icon-right="arrow_forward"
              label="Probar gratis 14 días"
              @click="goTo('/register')"
            />
            <q-btn
              flat no-caps size="lg"
              class="rk-btn rk-btn--ghost rk-btn--lg"
              icon="play_circle"
              label="Ver demo de 2 min"
              @click="goTo('/demo')"
            />
          </div>

          <ul class="rk-hero__trust">
            <li><q-icon name="verified_user"/> ISO 27001</li>
            <li><q-icon name="lock"/> Cifrado bancario</li>
            <li><q-icon name="schedule"/> Sin tarjeta · cancela cuando quieras</li>
          </ul>
        </div>

        <!-- Product preview -->
        <div class="rk-hero__visual">
          <div class="rk-preview">
            <div class="rk-preview__chrome">
              <span class="rk-dot rk-dot--red"></span>
              <span class="rk-dot rk-dot--amber"></span>
              <span class="rk-dot rk-dot--green"></span>
              <span class="rk-preview__url">app.recksy.com / dashboard</span>
            </div>

            <div class="rk-preview__body">
              <div class="rk-preview__topbar">
                <div class="rk-preview__greet">
                  <div class="rk-preview__avatar">RH</div>
                  <div>
                    <div class="rk-preview__hello">Panel RR.HH.</div>
                    <div class="rk-preview__sub">Últimos 7 días · vista resumen</div>
                  </div>
                </div>
                <div class="rk-preview__pill">
                  <q-icon name="trending_up"/> +12% vs semana anterior
                </div>
              </div>

              <div class="rk-preview__kpis">
                <div v-for="k in previewKpis" :key="k.label" class="rk-kpi">
                  <div class="rk-kpi__icon" :style="{ background: k.tint, color: k.color }">
                    <q-icon :name="k.icon"/>
                  </div>
                  <div class="rk-kpi__body">
                    <div class="rk-kpi__label">{{ k.label }}</div>
                    <div class="rk-kpi__value">
                      {{ k.value }}
                      <small class="pos">{{ k.delta }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rk-preview__chart">
                <div class="rk-preview__chart-head">
                  <div>
                    <div class="rk-preview__chart-title">Asistencia esta semana</div>
                    <div class="rk-preview__chart-sub">7 días · 24 colaboradores</div>
                  </div>
                  <div class="rk-preview__legend">
                    <span><i class="rk-legend rk-legend--primary"></i>Presente</span>
                    <span><i class="rk-legend rk-legend--accent"></i>Atrasado</span>
                  </div>
                </div>
                <svg viewBox="0 0 320 90" preserveAspectRatio="none" class="rk-spark">
                  <defs>
                    <linearGradient id="rk-area" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%"  stop-color="#06B6D4" stop-opacity=".22"/>
                      <stop offset="100%" stop-color="#06B6D4" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,68 C30,58 50,40 80,42 C115,44 140,22 175,28 C210,34 240,60 280,46 L320,52 L320,90 L0,90 Z" fill="url(#rk-area)"/>
                  <path d="M0,68 C30,58 50,40 80,42 C115,44 140,22 175,28 C210,34 240,60 280,46 L320,52" fill="none" stroke="#06B6D4" stroke-width="2.4" stroke-linecap="round"/>
                  <path d="M0,78 C30,76 50,72 80,70 C115,68 140,64 175,66 C210,68 240,72 280,68 L320,70" fill="none" stroke="#14B8A6" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 4"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="rk-float-chip rk-float-chip--top">
            <span class="rk-float-chip__icon" style="background:var(--c-primary-soft);color:var(--c-primary-dark)"><q-icon name="bolt"/></span>
            <div>
              <div class="rk-float-chip__value">+15h</div>
              <div class="rk-float-chip__label">ahorradas / mes</div>
            </div>
          </div>

          <div class="rk-float-chip rk-float-chip--bot">
            <span class="rk-float-chip__icon" style="background:var(--c-accent-soft);color:#0E7C70"><q-icon name="favorite"/></span>
            <div>
              <div class="rk-float-chip__value">4.8/5</div>
              <div class="rk-float-chip__label">satisfacción</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================== TRUST STRIP ======================== -->
    <section class="rk-trust-strip">
      <div class="rk-container">
        <p class="rk-trust-strip__text">+250 empresas latinoamericanas ya gestionan su talento con Recksy</p>
        <ul class="rk-logos">
          <li v-for="logo in logos" :key="logo">
            <span class="rk-logo">{{ logo }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- ======================== STATS BANNER ======================== -->
    <section class="rk-stats">
      <div class="rk-container">
        <div class="rk-stats__grid">
          <div v-for="s in heroStats" :key="s.label" class="rk-stats__item">
            <div class="rk-stats__value">{{ s.value }}</div>
            <div class="rk-stats__label">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================== FEATURE SHOWCASE 1 ======================== -->
    <section id="funciones" class="rk-section">
      <div class="rk-container">
        <div class="rk-section__head">
          <span class="rk-eyebrow"><span class="rk-eyebrow__dot"></span> Lo esencial</span>
          <h2 class="rk-section__title">Todo lo que tu equipo necesita,<br/>en un solo lugar.</h2>
          <p class="rk-section__lead">Olvídate de planillas. Recksy reúne asistencia, horarios, nómina y cumplimiento en una experiencia única, clara y rápida.</p>
        </div>

        <div class="rk-showcase">
          <div class="rk-showcase__copy">
            <span class="rk-tag"><q-icon name="fingerprint"/> Asistencia</span>
            <h3 class="rk-showcase__title">Marcaje preciso, sin fraude.</h3>
            <p class="rk-showcase__text">
              Biometría, geolocalización y reglas anti-trampas que detectan
              marcajes irregulares en segundos. Compatible con tablets, móvil y
              huelleros existentes.
            </p>
            <ul class="rk-checks">
              <li><q-icon name="check_circle"/> Reconocimiento facial y huella digital</li>
              <li><q-icon name="check_circle"/> Geocercas configurables por sucursal</li>
              <li><q-icon name="check_circle"/> Detección automática de duplicados</li>
            </ul>
          </div>

          <div class="rk-showcase__media">
            <div class="rk-showcase__panel">
              <div class="rk-showcase__panel-head">
                <div class="rk-showcase__panel-title">Marcajes en vivo</div>
                <span class="rk-pill rk-pill--success"><span class="rk-pulse"></span>En línea</span>
              </div>
              <ul class="rk-attendance">
                <li v-for="a in attendance" :key="a.name">
                  <div class="rk-attendance__avatar" :style="{ background: a.tint, color: a.color }">{{ a.initials }}</div>
                  <div class="rk-attendance__body">
                    <div class="rk-attendance__name">{{ a.name }}</div>
                    <div class="rk-attendance__sub">{{ a.role }}</div>
                  </div>
                  <span class="rk-attendance__time">{{ a.time }}</span>
                  <span class="rk-attendance__status" :class="`is-${a.status}`">{{ a.statusLabel }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="rk-showcase rk-showcase--reverse">
          <div class="rk-showcase__copy">
            <span class="rk-tag"><q-icon name="insights"/> Analítica</span>
            <h3 class="rk-showcase__title">Decisiones con datos, no con corazonadas.</h3>
            <p class="rk-showcase__text">
              Dashboards que se actualizan en tiempo real con las métricas que
              importan: ausentismo, productividad, rotación. Alertas proactivas
              antes de que un problema se convierta en uno grande.
            </p>
            <ul class="rk-checks">
              <li><q-icon name="check_circle"/> Dashboards configurables por rol</li>
              <li><q-icon name="check_circle"/> Reportes DT listos para fiscalización</li>
              <li><q-icon name="check_circle"/> Exportación a Excel, PDF y CSV</li>
            </ul>
          </div>

          <div class="rk-showcase__media">
            <div class="rk-showcase__panel">
              <div class="rk-showcase__panel-head">
                <div class="rk-showcase__panel-title">Resumen del mes</div>
                <span class="rk-pill rk-pill--muted">Abril 2026</span>
              </div>

              <div class="rk-bars">
                <div v-for="(b, i) in bars" :key="i" class="rk-bar">
                  <span class="rk-bar__label">{{ b.label }}</span>
                  <div class="rk-bar__track">
                    <div class="rk-bar__fill" :style="{ width: b.value + '%' }"></div>
                  </div>
                  <span class="rk-bar__value">{{ b.value }}%</span>
                </div>
              </div>

              <div class="rk-mini-stats">
                <div class="rk-mini-stat">
                  <div class="rk-mini-stat__label">Asistencia</div>
                  <div class="rk-mini-stat__value">98.5%</div>
                  <div class="rk-mini-stat__delta pos">+2.3%</div>
                </div>
                <div class="rk-mini-stat">
                  <div class="rk-mini-stat__label">Ausentismo</div>
                  <div class="rk-mini-stat__value">1.2%</div>
                  <div class="rk-mini-stat__delta pos">-0.4%</div>
                </div>
                <div class="rk-mini-stat">
                  <div class="rk-mini-stat__label">Horas extra</div>
                  <div class="rk-mini-stat__value">142h</div>
                  <div class="rk-mini-stat__delta neg">+12h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================== FEATURES GRID ======================== -->
    <section class="rk-section rk-section--soft">
      <div class="rk-container">
        <div class="rk-section__head">
          <span class="rk-eyebrow"><span class="rk-eyebrow__dot"></span> Funcionalidades</span>
          <h2 class="rk-section__title">Una suite completa para RR.HH.</h2>
          <p class="rk-section__lead">Cada herramienta diseñada para ahorrarte tiempo y ayudarte a tomar mejores decisiones.</p>
        </div>

        <div class="rk-features">
          <article v-for="f in features" :key="f.title" class="rk-feature">
            <div class="rk-feature__icon" :style="{ background: f.tint, color: f.color }">
              <q-icon :name="f.icon"/>
            </div>
            <h3 class="rk-feature__title">{{ f.title }}</h3>
            <p class="rk-feature__text">{{ f.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ======================== STEPS ======================== -->
    <section id="como-funciona" class="rk-section">
      <div class="rk-container">
        <div class="rk-section__head">
          <span class="rk-eyebrow"><span class="rk-eyebrow__dot"></span> Empieza en minutos</span>
          <h2 class="rk-section__title">De cero a productivo en 3 pasos.</h2>
          <p class="rk-section__lead">Sin instaladores, sin consultores, sin meses de implementación.</p>
        </div>

        <ol class="rk-steps">
          <li v-for="(s, i) in steps" :key="s.title" class="rk-step">
            <div class="rk-step__num">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="rk-step__icon"><q-icon :name="s.icon"/></div>
            <h3 class="rk-step__title">{{ s.title }}</h3>
            <p class="rk-step__text">{{ s.text }}</p>
            <div class="rk-step__connector" v-if="i < steps.length - 1" aria-hidden="true"></div>
          </li>
        </ol>
      </div>
    </section>

    <!-- ======================== TESTIMONIALS ======================== -->
    <section class="rk-section rk-section--soft">
      <div class="rk-container">
        <div class="rk-section__head">
          <span class="rk-eyebrow"><span class="rk-eyebrow__dot"></span> Testimonios</span>
          <h2 class="rk-section__title">Equipos que ya transformaron su gestión.</h2>
        </div>

        <div class="rk-quotes">
          <article v-for="q in testimonials" :key="q.author" class="rk-quote">
            <div class="rk-quote__stars">
              <q-icon v-for="n in 5" :key="n" name="star"/>
            </div>
            <p class="rk-quote__text">{{ q.text }}</p>
            <div class="rk-quote__person">
              <div class="rk-quote__avatar" :style="{ background: q.tint, color: q.color }">{{ q.initials }}</div>
              <div>
                <div class="rk-quote__author">{{ q.author }}</div>
                <div class="rk-quote__role">{{ q.role }}</div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ======================== PRICING ======================== -->
    <section id="planes" class="rk-section">
      <div class="rk-container">
        <div class="rk-section__head">
          <span class="rk-eyebrow"><span class="rk-eyebrow__dot"></span> Planes claros</span>
          <h2 class="rk-section__title">Elige el plan ideal para tu empresa.</h2>
          <p class="rk-section__lead">Sin sorpresas. Cambia o cancela cuando quieras.</p>

          <div class="rk-billing">
            <button type="button" class="rk-billing__opt" :class="{ active: !yearly }" @click="yearly = false">Mensual</button>
            <button type="button" class="rk-billing__opt" :class="{ active: yearly }" @click="yearly = true">
              Anual <span class="rk-billing__save">-20%</span>
            </button>
          </div>
        </div>

        <div class="rk-plans">
          <article
            v-for="p in pricingPlans"
            :key="p.id"
            class="rk-plan"
            :class="{ 'rk-plan--popular': p.popular }"
          >
            <div v-if="p.popular" class="rk-plan__tag">Más elegido</div>
            <h3 class="rk-plan__name">{{ p.name }}</h3>
            <p class="rk-plan__desc">{{ p.description }}</p>

            <div class="rk-plan__price">
              <span class="rk-plan__currency">$</span>
              <span class="rk-plan__amount">{{ priceFor(p) }}</span>
              <span class="rk-plan__period">/ mes</span>
            </div>
            <div class="rk-plan__hint">{{ yearly ? 'Facturado anualmente' : 'Facturado mes a mes' }}</div>

            <q-btn
              unelevated no-caps
              class="rk-btn full-width"
              :class="p.popular ? 'rk-btn--primary' : 'rk-btn--ghost'"
              :label="p.popular ? 'Empezar ahora' : 'Elegir plan'"
              @click="onSelectPlan(p.id)"
            />

            <ul class="rk-plan__features">
              <li v-for="f in p.features" :key="f">
                <q-icon name="check"/> {{ f }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- ======================== FAQ ======================== -->
    <section id="faq" class="rk-section rk-section--soft">
      <div class="rk-container rk-faq-wrap">
        <aside class="rk-faq__aside">
          <span class="rk-eyebrow"><span class="rk-eyebrow__dot"></span> ¿Tienes dudas?</span>
          <h2 class="rk-section__title rk-section__title--sm">Preguntas frecuentes</h2>
          <p class="rk-section__lead">¿No encuentras lo que buscas? Escríbenos a <a href="mailto:hola@recksy.com">hola@recksy.com</a> y te respondemos en menos de 4 horas.</p>
          <q-btn
            outline no-caps
            class="rk-btn rk-btn--ghost"
            icon="support_agent"
            label="Contactar soporte"
            @click="goTo('/contact')"
          />
        </aside>

        <div class="rk-faq">
          <details v-for="(q, i) in faqs" :key="i" class="rk-faq__item">
            <summary class="rk-faq__q">
              <span>{{ q.question }}</span>
              <q-icon name="add" class="rk-faq__chev"/>
            </summary>
            <div class="rk-faq__a">{{ q.answer }}</div>
          </details>
        </div>
      </div>
    </section>

    <!-- ======================== FINAL CTA ======================== -->
    <section class="rk-section rk-cta-final">
      <div class="rk-container">
        <div class="rk-cta-card">
          <div class="rk-cta-card__bg" aria-hidden="true"></div>
          <div class="rk-cta-card__content">
            <span class="rk-eyebrow rk-eyebrow--light"><span class="rk-eyebrow__dot rk-eyebrow__dot--light"></span> Empieza hoy</span>
            <h2 class="rk-cta-card__title">Lleva a tu equipo al siguiente nivel.</h2>
            <p class="rk-cta-card__text">14 días gratis. Sin tarjeta. Setup en menos de 5 minutos.</p>
            <div class="rk-cta-card__buttons">
              <q-btn
                unelevated no-caps size="lg"
                class="rk-btn rk-btn--white rk-btn--lg"
                icon-right="arrow_forward"
                label="Comenzar gratis"
                @click="goTo('/register')"
              />
              <q-btn
                flat no-caps size="lg"
                class="rk-btn rk-btn--white-ghost rk-btn--lg"
                label="Hablar con ventas"
                @click="goTo('/contact')"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================== FOOTER ======================== -->
    <footer id="contacto" class="rk-footer">
      <div class="rk-container rk-footer__inner">
        <div class="rk-footer__brand">
          <router-link to="/" class="rk-brand">
            <span class="rk-brand__mark"><q-icon name="bolt"/></span>
            <span class="rk-brand__name">Recksy</span>
          </router-link>
          <p class="rk-footer__tag">Software de RR.HH. moderno, hecho en Latinoamérica.</p>
          <div class="rk-footer__social">
            <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter"><q-icon name="mdi-twitter"/></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener" aria-label="LinkedIn"><q-icon name="mdi-linkedin"/></a>
            <a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub"><q-icon name="mdi-github"/></a>
          </div>
        </div>

        <div class="rk-footer__cols">
          <div v-for="col in footerLinks" :key="col.title" class="rk-footer__col">
            <div class="rk-footer__title">{{ col.title }}</div>
            <ul>
              <li v-for="l in col.links" :key="l.label">
                <a :href="l.to" @click.prevent="handleFooter(l.to)">{{ l.label }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="rk-footer__bottom">
        <div class="rk-container rk-footer__bottom-inner">
          <span>© {{ year }} Recksy · Todos los derechos reservados.</span>
          <span class="rk-footer__legal">
            <router-link to="/legal/terms">Privacidad</router-link> · <router-link to="/legal/terms">Términos</router-link>
          </span>
        </div>
      </div>
    </footer>
  </q-page>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const isDark = computed(() => $q.dark.isActive)

function toggleDark() {
  const v = !$q.dark.isActive
  $q.dark.set(v)
  try { localStorage.setItem('darkMode', String(v)) } catch (_) {}
}

/* ======================= Content ======================= */
const navLinks = [
  { label: 'Inicio',         to: '#top' },
  { label: 'Funciones',      to: '#funciones' },
  { label: 'Cómo funciona',  to: '#como-funciona' },
  { label: 'Planes',         to: '#planes' },
  { label: 'FAQ',            to: '#faq' },
  { label: 'Contacto',       to: '#contacto' },
]

const previewKpis = [
  { label: 'Asistencia',    value: '98.5%', delta: '+2.3%', icon: 'fingerprint',         color: '#0891B2', tint: '#CFFAFE' },
  { label: 'Productividad', value: '127%',  delta: '+15%',  icon: 'trending_up',         color: '#0E7C70', tint: '#CCFBF1' },
  { label: 'Satisfacción',  value: '4.8/5', delta: '+0.4',  icon: 'sentiment_satisfied', color: '#B45309', tint: '#FEF3C7' },
]

const heroStats = [
  { value: '+250',   label: 'Empresas activas' },
  { value: '12k+',   label: 'Colaboradores gestionados' },
  { value: '99.9%',  label: 'Uptime garantizado' },
  { value: '4.8/5',  label: 'Calificación clientes' },
]

const logos = ['ANDINA', 'TRANSCORP', 'NORTSUR', 'FINTECH', 'AGRO•VAL', 'COPEC+']

const attendance = [
  { initials: 'CV', name: 'Carla Vergara',  role: 'Gerente · Operaciones',  time: '08:42', status: 'on',    statusLabel: 'Presente', tint: '#CFFAFE', color: '#0891B2' },
  { initials: 'MR', name: 'Mario Reyes',    role: 'Analista · Finanzas',    time: '08:51', status: 'on',    statusLabel: 'Presente', tint: '#CCFBF1', color: '#0E7C70' },
  { initials: 'PT', name: 'Paula Toro',     role: 'Diseñadora · Producto',  time: '09:14', status: 'late',  statusLabel: 'Atrasada', tint: '#FEF3C7', color: '#B45309' },
  { initials: 'AS', name: 'Ana Soto',         role: 'Admin · RR.HH.',         time: '08:35', status: 'on',    statusLabel: 'Presente', tint: '#CFFAFE', color: '#0891B2' },
]

const bars = [
  { label: 'Lun', value: 96 },
  { label: 'Mar', value: 92 },
  { label: 'Mié', value: 99 },
  { label: 'Jue', value: 88 },
  { label: 'Vie', value: 95 },
]

const features = [
  { icon: 'fingerprint',       title: 'Asistencia precisa',         text: 'Marcaje biométrico, geolocalización y reglas anti-fraude.', color: '#0891B2', tint: '#CFFAFE' },
  { icon: 'schedule',          title: 'Horarios flexibles',          text: 'Turnos rotativos, partidos o por proyecto en minutos.',    color: '#0E7C70', tint: '#CCFBF1' },
  { icon: 'gavel',             title: 'Cumplimiento DT',             text: 'Libro electrónico y reportes listos para fiscalización.',  color: '#0E7490', tint: '#E0F2FE' },
  { icon: 'payments',          title: 'Liquidaciones automáticas',   text: 'De marcajes a sueldos sin intermediarios.',                color: '#B45309', tint: '#FEF3C7' },
  { icon: 'insights',          title: 'Dashboards en vivo',          text: 'Métricas claras de ausentismo y desempeño al segundo.',    color: '#0E7C70', tint: '#CCFBF1' },
  { icon: 'health_and_safety', title: 'Bienestar del equipo',        text: 'Pulse surveys y reconocimientos para tu gente.',           color: '#0891B2', tint: '#CFFAFE' },
]

const steps = [
  { icon: 'group_add',     title: 'Crea tu cuenta',   text: 'Registra tu empresa en 60 segundos. Sin tarjeta de crédito.' },
  { icon: 'upload_file',   title: 'Sube tu equipo',   text: 'Importa colaboradores desde Excel o CSV con asistente guiado.' },
  { icon: 'rocket_launch', title: 'Empieza a medir',  text: 'Activa marcaje, define horarios y observa los resultados.' },
]

const testimonials = [
  { initials: 'CV', author: 'Carla Vergara', role: 'Gerente de Personas · Andina S.A.',
    text: 'Pasamos de 20 horas semanales en planillas a literalmente cero. Mi equipo ahora dedica el tiempo a las personas, no a Excel.',
    color: '#0891B2', tint: '#CFFAFE' },
  { initials: 'MR', author: 'Mario Reyes',   role: 'CFO · Transcorp Logística',
    text: 'La integración con liquidaciones nos ahorró un proceso completo. La auditoría DT del último mes la cerramos en 2 horas.',
    color: '#0E7C70', tint: '#CCFBF1' },
  { initials: 'PT', author: 'Paula Toro',    role: 'Head of People · Fintech Latam',
    text: 'Por fin un software de RR.HH. que mi equipo realmente usa. La app móvil es buenísima y los reportes son claros.',
    color: '#B45309', tint: '#FEF3C7' },
]

const yearly = ref(false)
const pricingPlans = [
  { id: 'basic', name: 'Esencial',     description: 'Para equipos pequeños',          price: 29, popular: false, features: ['Hasta 20 colaboradores', 'Asistencia y horarios', 'Reportes mensuales', 'Soporte por correo'] },
  { id: 'pro',   name: 'Profesional',  description: 'Para empresas en crecimiento',   price: 59, popular: true,  features: ['Hasta 100 colaboradores', 'Asistencia avanzada + DT', 'Liquidaciones automáticas', 'Integraciones básicas', 'Soporte prioritario'] },
  { id: 'ent',   name: 'Empresarial',  description: 'Para organizaciones grandes',    price: 99, popular: false, features: ['Colaboradores ilimitados', 'API + integraciones premium', 'Analítica avanzada', 'SLA y soporte 24/7', 'Onboarding dedicado'] },
]

const faqs = [
  { question: '¿Puedo probar Recksy sin tarjeta?',                answer: 'Sí. Tienes 14 días gratis sin necesidad de ingresar tarjeta. Al final, decides si continuar.' },
  { question: '¿Cumple con la Dirección del Trabajo?',            answer: 'Sí. Generamos el Libro de Asistencia electrónico y los comprobantes según la normativa vigente, listos para fiscalización.' },
  { question: '¿Funciona en celular?',                            answer: 'Por supuesto. App móvil para colaboradores y panel web para administradores. Todo se sincroniza al instante.' },
  { question: '¿Puedo migrar desde otra plataforma?',             answer: 'Sí. Importamos tus datos desde Excel, CSV o tu sistema actual. Te acompañamos en todo el proceso.' },
  { question: '¿Qué tan seguro es Recksy?',                       answer: 'Cifrado en tránsito y en reposo, copias de respaldo diarias, MFA y prácticas alineadas con ISO 27001.' },
  { question: '¿Puedo cancelar cuando quiera?',                   answer: 'Sí. No hay permanencia. Cancelas con un clic y exportamos tus datos en formatos estándar.' },
]

const footerLinks = [
  { title: 'Producto',  links: [
    { label: 'Funciones', to: '#funciones' },
    { label: 'Planes',    to: '#planes' },
    { label: 'Demo',      to: '/demo' },
    { label: 'Novedades', to: '/updates' },
  ]},
  { title: 'Recursos',  links: [
    { label: 'Blog',            to: '/blog' },
    { label: 'Guías',           to: '/guides' },
    { label: 'Centro de ayuda', to: '/help' },
    { label: 'Estado',          to: '/status' },
  ]},
  { title: 'Empresa',   links: [
    { label: 'Nosotros',  to: '/about' },
    { label: 'Carreras',  to: '/careers' },
    { label: 'Contacto',  to: '#contacto' },
  ]},
  { title: 'Legal',     links: [
    { label: 'Términos y Privacidad', to: '/legal/terms' },
    { label: 'Verificar comprobante', to: '/verificar-comprobante' },
  ]},
]

const year = new Date().getFullYear()

/* ======================= Behavior ======================= */
const scrolled = ref(false)
const mobileOpen = ref(false)
const activeSection = ref('#top')

const priceFor = (p) => yearly.value ? Math.round(p.price * 0.8) : p.price

function goTo(to) {
  if (!to) return
  if (to.startsWith('#')) return scrollTo(to)
  router.push(to)
}

function handleFooter(to) {
  if (!to) return
  if (to.startsWith('#')) scrollTo(to)
  else router.push(to)
}

function onSelectPlan(planId) {
  router.push({ path: '/register', query: { plan: planId, billing: yearly.value ? 'yearly' : 'monthly' } })
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

async function scrollTo(hash) {
  if (!hash || !hash.startsWith('#')) return
  await nextTick()
  const el = document.querySelector(hash)
  if (!el) return
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

function onScroll() {
  scrolled.value = window.scrollY > 12
}

let observer = null
function setupActiveObserver() {
  const ids = ['#top', '#funciones', '#como-funciona', '#planes', '#faq', '#contacto']
  const els = ids.map(id => document.querySelector(id)).filter(Boolean)
  if (!els.length) return
  observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0]
    if (visible?.target?.id) activeSection.value = `#${visible.target.id}`
  }, { rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.3, 0.6] })
  els.forEach(e => observer.observe(e))
}

onMounted(async () => {
  // Hidrata el tema desde localStorage (alineado con Header.vue del módulo interno)
  try {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      $q.dark.set(saved === 'true')
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
      $q.dark.set(true)
    }
  } catch (_) {}

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  await nextTick()
  setupActiveObserver()
  if (window.location.hash) scrollTo(window.location.hash)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  observer?.disconnect?.()
})
</script>

<style scoped>
/* ============================================================
   TOKENS · paleta del sistema (cyan/teal) en versión clara
   ============================================================ */
.rk-home {
  /* Fondos */
  --c-bg:        #F8FAFC;
  --c-bg-soft:   #F0FDFA;
  --c-bg-tint:   #ECFEFF;
  --c-surface:   #FFFFFF;
  --c-surface-2: #F1F5F9;

  /* Texto */
  --c-text:        #1E293B;
  --c-text-strong: #0F172A;
  --c-text-muted:  #64748B;

  /* Marca — sistema */
  --c-primary:      #06B6D4;
  --c-primary-dark: #0891B2;
  --c-primary-deep: #155E75;
  --c-primary-soft: #CFFAFE;
  --c-primary-tint: #ECFEFF;

  --c-accent:      #14B8A6;
  --c-accent-soft: #CCFBF1;

  --c-amber:      #F59E0B;
  --c-amber-soft: #FEF3C7;

  --c-success: #22C55E;
  --c-danger:  #EF4444;

  --c-border:      #E2E8F0;
  --c-border-soft: #EEF2F7;

  --c-shadow-sm: 0 1px 2px rgba(15, 23, 42, .04);
  --c-shadow-md: 0 6px 16px rgba(15, 23, 42, .06), 0 2px 4px rgba(15, 23, 42, .04);
  --c-shadow-lg: 0 24px 60px rgba(15, 23, 42, .10), 0 8px 18px rgba(6, 182, 212, .08);

  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif;

  background: var(--c-bg);
  color: var(--c-text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

:deep(#top), :deep(#funciones), :deep(#como-funciona),
:deep(#planes), :deep(#faq), :deep(#contacto) {
  scroll-margin-top: 88px;
}

/* ============================================================
   PRIMITIVOS
   ============================================================ */
.rk-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 28px);
}

.rk-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12.5px; font-weight: 700;
  letter-spacing: .5px; text-transform: uppercase;
  color: var(--c-primary-deep);
  background: var(--c-primary-soft);
  padding: 6px 14px; border-radius: 999px;
}
.rk-eyebrow__dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, .18);
}
.rk-eyebrow--light { color: #fff; background: rgba(255,255,255,.18); backdrop-filter: blur(10px); }
.rk-eyebrow__dot--light { background: #fff; box-shadow: 0 0 0 3px rgba(255,255,255,.25); }

.rk-grad {
  background: linear-gradient(120deg, var(--c-primary) 0%, var(--c-accent) 100%);
  -webkit-background-clip: text; background-clip: text;
  color: transparent;
}

.rk-tag {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700;
  color: var(--c-primary-dark);
  background: var(--c-primary-soft);
  padding: 6px 12px; border-radius: 8px;
  margin-bottom: 14px;
}
.rk-tag .q-icon { font-size: 16px; }

.rk-pill {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700;
  padding: 4px 12px; border-radius: 999px;
}
.rk-pill--success { background: rgba(34, 197, 94, .12); color: #15803D; }
.rk-pill--muted   { background: var(--c-surface-2); color: var(--c-text-muted); }
.rk-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--c-success);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, .25);
  animation: rk-pulse 1.8s ease-in-out infinite;
}
@keyframes rk-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(34, 197, 94, .25); }
  50%      { box-shadow: 0 0 0 6px rgba(34, 197, 94, .12); }
}

.rk-checks {
  list-style: none; padding: 0; margin: 18px 0 0;
  display: grid; gap: 10px;
}
.rk-checks li {
  display: flex; align-items: center; gap: 10px;
  font-size: 14.5px; color: var(--c-text);
}
.rk-checks .q-icon { color: var(--c-success); font-size: 18px; }

/* Botones */
.rk-btn {
  border-radius: 12px !important;
  font-weight: 600 !important;
  letter-spacing: .1px;
  padding: 10px 18px;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease, color .18s ease, border-color .18s ease;
}
.rk-btn--lg { padding: 13px 22px; font-size: 15.5px; }
.rk-btn--primary {
  background: var(--c-primary) !important;
  color: #fff !important;
  box-shadow: 0 8px 18px rgba(6, 182, 212, .28);
}
.rk-btn--primary:hover {
  background: var(--c-primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(6, 182, 212, .35);
}
.rk-btn--ghost {
  background: transparent !important;
  color: var(--c-text) !important;
  border: 1.5px solid var(--c-border) !important;
}
.rk-btn--ghost:hover {
  background: var(--c-surface) !important;
  border-color: var(--c-primary) !important;
  color: var(--c-primary-dark) !important;
}
.rk-btn--white {
  background: #fff !important;
  color: var(--c-primary-deep) !important;
}
.rk-btn--white:hover { transform: translateY(-2px); box-shadow: 0 14px 26px rgba(0,0,0,.18); }
.rk-btn--white-ghost {
  background: transparent !important;
  color: #fff !important;
  border: 1.5px solid rgba(255, 255, 255, .55) !important;
}
.rk-btn--white-ghost:hover { background: rgba(255,255,255,.12) !important; }

/* ============================================================
   HEADER
   ============================================================ */
.rk-header {
  position: fixed; inset: 0 0 auto 0; z-index: 100;
  background: rgba(248, 250, 252, .8);
  backdrop-filter: saturate(140%) blur(14px);
  -webkit-backdrop-filter: saturate(140%) blur(14px);
  border-bottom: 1px solid transparent;
  transition: border-color .25s ease, background .25s ease, box-shadow .25s ease;
}
.rk-header.is-scrolled {
  border-bottom-color: var(--c-border);
  background: rgba(248, 250, 252, .95);
  box-shadow: 0 6px 24px rgba(15, 23, 42, .04);
}
.rk-header__inner {
  max-width: 1280px; margin: 0 auto;
  padding: 14px clamp(16px, 4vw, 28px);
  display: flex; align-items: center; gap: 24px;
}

.rk-brand {
  display: inline-flex; align-items: center; gap: 10px;
  text-decoration: none; color: var(--c-text-strong);
  font-weight: 800; letter-spacing: -.01em;
}
.rk-brand__mark {
  width: 38px; height: 38px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
  color: #fff;
  box-shadow: 0 6px 14px rgba(6, 182, 212, .35);
}
.rk-brand__mark .q-icon { font-size: 22px; }
.rk-brand__name { font-size: 19px; }

.rk-nav { display: flex; gap: 4px; margin-left: auto; }
.rk-nav__link {
  padding: 8px 14px; border-radius: 10px;
  text-decoration: none; color: var(--c-text-muted);
  font-weight: 600; font-size: 14.5px;
  transition: color .18s ease, background .18s ease;
}
.rk-nav__link:hover { color: var(--c-text-strong); background: var(--c-surface); }
.rk-nav__link.active { color: var(--c-primary-dark); background: var(--c-primary-soft); }

.rk-header__cta { display: flex; gap: 10px; align-items: center; }
.rk-mobile-toggle { color: var(--c-text-strong); }

/* Theme toggle */
.rk-theme-toggle {
  width: 38px; height: 38px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--c-surface);
  border: 1.5px solid var(--c-border);
  border-radius: 11px;
  color: var(--c-text);
  cursor: pointer;
  transition: transform .18s ease, color .18s ease, border-color .18s ease, background .18s ease;
}
.rk-theme-toggle:hover {
  color: var(--c-primary);
  border-color: var(--c-primary);
  transform: rotate(-15deg);
}
.rk-theme-toggle .q-icon { font-size: 19px; }
.rk-theme-toggle.lt-md { margin-left: auto; }

.rk-mobile-menu {
  border-top: 1px solid var(--c-border);
  padding: 14px clamp(16px, 4vw, 28px) 18px;
  background: var(--c-bg);
  display: flex; flex-direction: column; gap: 4px;
}
.rk-mobile-menu__link {
  padding: 12px 14px; border-radius: 10px;
  text-decoration: none; color: var(--c-text);
  font-weight: 600;
}
.rk-mobile-menu__link:hover { background: var(--c-surface); }
.rk-mobile-menu__cta { display: grid; gap: 8px; margin-top: 10px; }

/* ============================================================
   HERO
   ============================================================ */
.rk-hero {
  position: relative;
  padding: 140px 0 64px;
  overflow: hidden;
}
.rk-hero__bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.rk-hero__halo {
  position: absolute; border-radius: 50%; filter: blur(90px); opacity: .55;
}
.rk-hero__halo--1 {
  width: 540px; height: 540px;
  top: -180px; left: -120px;
  background: radial-gradient(circle, var(--c-primary-soft), transparent 70%);
}
.rk-hero__halo--2 {
  width: 480px; height: 480px;
  top: 60px; right: -160px;
  background: radial-gradient(circle, var(--c-accent-soft), transparent 70%);
}
.rk-hero__grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(6, 182, 212, .07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, .07) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(ellipse 65% 55% at 50% 35%, #000 30%, transparent 80%);
          mask-image: radial-gradient(ellipse 65% 55% at 50% 35%, #000 30%, transparent 80%);
  opacity: .5;
}

.rk-hero__inner {
  position: relative; z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 64px);
  align-items: center;
}
.rk-hero__copy { max-width: 600px; }
.rk-hero__title {
  font-size: clamp(36px, 5.4vw, 60px);
  font-weight: 800; line-height: 1.05;
  letter-spacing: -.025em;
  color: var(--c-text-strong);
  margin: 18px 0;
}
.rk-hero__lead {
  font-size: clamp(16px, 1.5vw, 18px);
  line-height: 1.65;
  color: var(--c-text-muted);
  max-width: 56ch;
  margin: 0 0 28px;
}
.rk-hero__cta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
.rk-hero__trust {
  list-style: none; padding: 0; margin: 0;
  display: flex; gap: 22px; flex-wrap: wrap;
  color: var(--c-text-muted);
  font-size: 14px;
}
.rk-hero__trust li { display: inline-flex; align-items: center; gap: 8px; }
.rk-hero__trust .q-icon { color: var(--c-primary); font-size: 18px; }

/* Preview */
.rk-hero__visual { position: relative; display: flex; justify-content: center; }
.rk-preview {
  width: 100%; max-width: 560px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 18px;
  box-shadow: var(--c-shadow-lg);
  overflow: hidden;
  transition: transform .35s ease;
}
.rk-preview:hover { transform: translateY(-4px); }
.rk-preview__chrome {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 14px;
  background: var(--c-surface-2);
  border-bottom: 1px solid var(--c-border-soft);
}
.rk-dot { width: 11px; height: 11px; border-radius: 50%; }
.rk-dot--red    { background: #FB7185; }
.rk-dot--amber  { background: #FBBF24; }
.rk-dot--green  { background: #4ADE80; }
.rk-preview__url {
  margin-left: 10px;
  font-size: 12px; font-weight: 600;
  color: var(--c-text-muted);
  font-family: 'JetBrains Mono', 'Menlo', monospace;
}
.rk-preview__body { padding: 20px; }

.rk-preview__topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; gap: 12px;
}
.rk-preview__greet { display: flex; align-items: center; gap: 10px; }
.rk-preview__avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
  color: #fff; font-weight: 800; font-size: 13px;
}
.rk-preview__hello { font-weight: 700; color: var(--c-text-strong); font-size: 14.5px; }
.rk-preview__sub { font-size: 12px; color: var(--c-text-muted); }
.rk-preview__pill {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700;
  background: rgba(34, 197, 94, .12);
  color: #15803D;
  padding: 5px 11px; border-radius: 999px;
  white-space: nowrap;
}
.rk-preview__pill .q-icon { font-size: 14px; }

.rk-preview__kpis {
  display: grid; gap: 10px;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 16px;
}
.rk-kpi {
  display: flex; align-items: center; gap: 10px;
  padding: 11px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border-soft);
  border-radius: 12px;
}
.rk-kpi__icon {
  width: 34px; height: 34px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}
.rk-kpi__icon .q-icon { font-size: 18px; }
.rk-kpi__label {
  font-size: 10.5px; color: var(--c-text-muted);
  font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
}
.rk-kpi__value {
  font-weight: 800; color: var(--c-text-strong);
  display: flex; align-items: baseline; gap: 6px; font-size: 14.5px;
}
.rk-kpi__value small { font-size: 11px; font-weight: 700; }
.pos { color: var(--c-success); }
.neg { color: var(--c-danger); }

.rk-preview__chart {
  background: var(--c-surface-2);
  border: 1px solid var(--c-border-soft);
  border-radius: 12px;
  padding: 14px;
}
.rk-preview__chart-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 10px; gap: 10px;
}
.rk-preview__chart-title { font-size: 13.5px; font-weight: 700; color: var(--c-text-strong); }
.rk-preview__chart-sub   { font-size: 11.5px; color: var(--c-text-muted); }
.rk-preview__legend {
  display: flex; gap: 12px; font-size: 11.5px; color: var(--c-text-muted);
}
.rk-legend {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  margin-right: 5px; vertical-align: middle;
}
.rk-legend--primary { background: var(--c-primary); }
.rk-legend--accent  { background: var(--c-accent); }
.rk-spark { width: 100%; height: 90px; display: block; }

/* Floating chips */
.rk-float-chip {
  position: absolute;
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  box-shadow: var(--c-shadow-md);
  animation: rk-bob 5s ease-in-out infinite;
}
.rk-float-chip__icon {
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
}
.rk-float-chip__icon .q-icon { font-size: 18px; }
.rk-float-chip__value { font-weight: 800; color: var(--c-text-strong); font-size: 15px; line-height: 1; }
.rk-float-chip__label { font-size: 11px; color: var(--c-text-muted); margin-top: 2px; }
.rk-float-chip--top { top: 10px; left: -16px; }
.rk-float-chip--bot { bottom: -8px; right: -16px; animation-delay: -2.4s; }
@keyframes rk-bob {
  0%, 100% { transform: translateY(0) }
  50%      { transform: translateY(-7px) }
}

/* ============================================================
   TRUST STRIP
   ============================================================ */
.rk-trust-strip {
  padding: 36px 0;
  border-top: 1px solid var(--c-border-soft);
  border-bottom: 1px solid var(--c-border-soft);
  background: var(--c-surface);
}
.rk-trust-strip__text {
  text-align: center;
  font-size: 13px;
  color: var(--c-text-muted);
  font-weight: 600;
  letter-spacing: .3px;
  margin: 0 0 18px;
}
.rk-logos {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-wrap: wrap; justify-content: center;
  gap: clamp(20px, 5vw, 56px);
}
.rk-logo {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  font-size: 17px;
  letter-spacing: .8px;
  color: var(--c-text-muted);
  opacity: .65;
  transition: opacity .2s ease, color .2s ease;
}
.rk-logos li:hover .rk-logo { opacity: 1; color: var(--c-text-strong); }

/* ============================================================
   STATS BANNER
   ============================================================ */
.rk-stats {
  padding: clamp(48px, 8vw, 80px) 0;
  background: linear-gradient(180deg, var(--c-bg) 0%, var(--c-bg-soft) 100%);
}
.rk-stats__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--c-shadow-md);
}
.rk-stats__item {
  text-align: center;
  padding: 28px 16px;
  border-right: 1px solid var(--c-border-soft);
}
.rk-stats__item:last-child { border-right: 0; }
.rk-stats__value {
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 800;
  color: var(--c-primary-dark);
  letter-spacing: -.02em;
  line-height: 1;
  margin-bottom: 8px;
}
.rk-stats__label {
  font-size: 13px;
  color: var(--c-text-muted);
  font-weight: 600;
}

/* ============================================================
   SECCIONES (genérico)
   ============================================================ */
.rk-section { padding: clamp(64px, 10vw, 110px) 0; position: relative; }
.rk-section--soft { background: var(--c-bg-soft); }

.rk-section__head {
  text-align: center;
  max-width: 720px;
  margin: 0 auto clamp(40px, 6vw, 60px);
}
.rk-section__title {
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800; line-height: 1.1;
  letter-spacing: -.02em;
  color: var(--c-text-strong);
  margin: 14px 0 14px;
}
.rk-section__title--sm { font-size: clamp(24px, 3vw, 32px); }
.rk-section__lead {
  color: var(--c-text-muted);
  font-size: clamp(15px, 1.4vw, 17px);
  line-height: 1.65;
  margin: 0;
}
.rk-section__lead a { color: var(--c-primary-dark); font-weight: 600; }

/* ============================================================
   SHOWCASE (alternating)
   ============================================================ */
.rk-showcase {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(32px, 6vw, 80px);
  align-items: center;
  margin-bottom: clamp(48px, 8vw, 96px);
}
.rk-showcase:last-child { margin-bottom: 0; }
.rk-showcase--reverse .rk-showcase__copy  { order: 2; }
.rk-showcase--reverse .rk-showcase__media { order: 1; }

.rk-showcase__title {
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 800;
  letter-spacing: -.02em;
  line-height: 1.15;
  color: var(--c-text-strong);
  margin: 0 0 14px;
}
.rk-showcase__text {
  color: var(--c-text-muted);
  font-size: 16px;
  line-height: 1.7;
  margin: 0;
}

.rk-showcase__media { position: relative; }
.rk-showcase__panel {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 18px;
  box-shadow: var(--c-shadow-lg);
  padding: 22px;
}
.rk-showcase__panel-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; gap: 10px;
}
.rk-showcase__panel-title {
  font-weight: 700;
  color: var(--c-text-strong);
  font-size: 15px;
}

/* Attendance list */
.rk-attendance { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.rk-attendance li {
  display: grid;
  grid-template-columns: 36px 1fr auto auto;
  align-items: center; gap: 12px;
  padding: 10px 12px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border-soft);
  border-radius: 12px;
}
.rk-attendance__avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 12.5px;
}
.rk-attendance__name { font-size: 13.5px; font-weight: 700; color: var(--c-text-strong); }
.rk-attendance__sub  { font-size: 11.5px; color: var(--c-text-muted); }
.rk-attendance__time {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700; font-size: 13px;
  color: var(--c-text);
}
.rk-attendance__status {
  font-size: 11px; font-weight: 700;
  padding: 3px 9px; border-radius: 999px;
  text-transform: uppercase; letter-spacing: .4px;
}
.rk-attendance__status.is-on   { background: rgba(34,197,94,.12); color: #15803D; }
.rk-attendance__status.is-late { background: var(--c-amber-soft);  color: #B45309; }

/* Bars chart */
.rk-bars { display: grid; gap: 12px; margin-bottom: 18px; }
.rk-bar {
  display: grid;
  grid-template-columns: 36px 1fr 44px;
  align-items: center; gap: 10px;
}
.rk-bar__label {
  font-size: 12px; color: var(--c-text-muted);
  font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
}
.rk-bar__track {
  height: 10px;
  background: var(--c-surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.rk-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--c-primary), var(--c-accent));
  border-radius: 999px;
  transition: width .6s cubic-bezier(.22,.61,.36,1);
}
.rk-bar__value {
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text-strong);
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
}

.rk-mini-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--c-border-soft);
}
.rk-mini-stat { text-align: left; }
.rk-mini-stat__label {
  font-size: 11px; color: var(--c-text-muted);
  font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
}
.rk-mini-stat__value {
  font-size: 19px; font-weight: 800;
  color: var(--c-text-strong); line-height: 1.2;
}
.rk-mini-stat__delta {
  font-size: 12px; font-weight: 700;
}

/* ============================================================
   FEATURES GRID
   ============================================================ */
.rk-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.rk-feature {
  background: var(--c-surface);
  border: 1px solid var(--c-border-soft);
  border-radius: 16px;
  padding: 26px;
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
}
.rk-feature:hover {
  transform: translateY(-4px);
  border-color: var(--c-border);
  box-shadow: var(--c-shadow-md);
}
.rk-feature__icon {
  width: 48px; height: 48px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 12px;
  margin-bottom: 14px;
}
.rk-feature__icon .q-icon { font-size: 24px; }
.rk-feature__title {
  font-size: 17px; font-weight: 700;
  color: var(--c-text-strong);
  margin: 0 0 6px;
}
.rk-feature__text {
  font-size: 14.5px; line-height: 1.6;
  color: var(--c-text-muted);
  margin: 0;
}

/* ============================================================
   STEPS
   ============================================================ */
.rk-steps {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 18px;
  grid-template-columns: repeat(3, 1fr);
}
.rk-step {
  position: relative;
  padding: 28px 24px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  box-shadow: var(--c-shadow-sm);
}
.rk-step__num {
  position: absolute; top: 18px; right: 22px;
  font-size: 36px; font-weight: 800;
  color: transparent;
  -webkit-text-stroke: 1.5px var(--c-primary-soft);
  letter-spacing: -.04em;
}
.rk-step__icon {
  width: 48px; height: 48px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 13px;
  background: var(--c-primary-soft);
  color: var(--c-primary-dark);
  margin-bottom: 14px;
}
.rk-step__icon .q-icon { font-size: 24px; }
.rk-step__title {
  font-size: 18px; font-weight: 700;
  color: var(--c-text-strong);
  margin: 0 0 6px;
}
.rk-step__text {
  font-size: 14.5px; line-height: 1.6;
  color: var(--c-text-muted);
  margin: 0;
}
.rk-step__connector {
  position: absolute;
  top: 50%;
  right: -19px;
  width: 30px; height: 2px;
  background: linear-gradient(90deg, var(--c-primary-soft), transparent);
  z-index: 1;
}
.rk-step__connector::after {
  content: '';
  position: absolute;
  right: 0; top: 50%;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--c-primary);
  transform: translateY(-50%);
  box-shadow: 0 0 0 4px var(--c-primary-soft);
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */
.rk-quotes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.rk-quote {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 28px;
  box-shadow: var(--c-shadow-sm);
  transition: transform .25s ease, box-shadow .25s ease;
}
.rk-quote:hover { transform: translateY(-4px); box-shadow: var(--c-shadow-md); }
.rk-quote__stars {
  display: flex; gap: 3px; margin-bottom: 14px;
  color: var(--c-amber);
}
.rk-quote__stars .q-icon { font-size: 18px; }
.rk-quote__text {
  font-size: 15px; line-height: 1.65;
  color: var(--c-text);
  margin: 0 0 22px;
}
.rk-quote__person { display: flex; align-items: center; gap: 12px; }
.rk-quote__avatar {
  width: 42px; height: 42px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 13.5px;
}
.rk-quote__author { font-size: 14px; font-weight: 700; color: var(--c-text-strong); }
.rk-quote__role   { font-size: 12.5px; color: var(--c-text-muted); }

/* ============================================================
   PRICING
   ============================================================ */
.rk-billing {
  display: inline-flex;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 999px;
  padding: 4px;
  margin-top: 22px;
  box-shadow: var(--c-shadow-sm);
}
.rk-billing__opt {
  border: 0; background: transparent; cursor: pointer;
  padding: 9px 18px; border-radius: 999px;
  font-weight: 700; font-size: 14px;
  color: var(--c-text-muted);
  display: inline-flex; align-items: center; gap: 8px;
  transition: background .18s ease, color .18s ease;
  font-family: inherit;
}
.rk-billing__opt.active {
  background: var(--c-primary);
  color: #fff;
}
.rk-billing__save {
  background: rgba(255,255,255,.25);
  padding: 2px 8px; border-radius: 999px;
  font-size: 11px; font-weight: 800;
}
.rk-billing__opt:not(.active) .rk-billing__save {
  background: var(--c-accent-soft);
  color: #0E7C70;
}

.rk-plans {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  align-items: stretch;
}
.rk-plan {
  position: relative;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 18px;
  padding: 32px 28px;
  display: flex; flex-direction: column;
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
}
.rk-plan:hover {
  transform: translateY(-4px);
  box-shadow: var(--c-shadow-md);
}
.rk-plan--popular {
  border-color: var(--c-primary);
  box-shadow: 0 24px 48px rgba(6, 182, 212, .14), 0 6px 14px rgba(6, 182, 212, .08);
  background:
    linear-gradient(180deg, var(--c-primary-tint) 0%, var(--c-surface) 30%);
}
.rk-plan__tag {
  position: absolute; top: -12px; left: 50%;
  transform: translateX(-50%);
  background: var(--c-primary);
  color: #fff;
  font-size: 11.5px; font-weight: 800;
  padding: 5px 14px; border-radius: 999px;
  letter-spacing: .5px; text-transform: uppercase;
}
.rk-plan__name {
  font-size: 20px; font-weight: 800; color: var(--c-text-strong);
  margin: 0 0 4px;
}
.rk-plan__desc {
  font-size: 13.5px; color: var(--c-text-muted);
  margin: 0 0 18px;
}
.rk-plan__price {
  display: flex; align-items: baseline; gap: 4px; color: var(--c-text-strong);
}
.rk-plan__currency { font-size: 22px; font-weight: 700; color: var(--c-text-muted); }
.rk-plan__amount   { font-size: 48px; font-weight: 800; line-height: 1; letter-spacing: -.02em; }
.rk-plan__period   { font-size: 14px; color: var(--c-text-muted); margin-left: 4px; }
.rk-plan__hint     { font-size: 12.5px; color: var(--c-text-muted); margin-top: 6px; margin-bottom: 22px; }
.rk-plan__features {
  list-style: none; padding: 0; margin: 22px 0 0;
  display: grid; gap: 10px;
  border-top: 1px solid var(--c-border-soft);
  padding-top: 22px;
}
.rk-plan__features li {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 14px; color: var(--c-text);
}
.rk-plan__features .q-icon {
  width: 18px; height: 18px; padding: 2px;
  background: var(--c-primary-soft);
  color: var(--c-primary-dark);
  border-radius: 50%; font-size: 12px;
  flex-shrink: 0; margin-top: 1px;
}

/* ============================================================
   FAQ
   ============================================================ */
.rk-faq-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
  gap: clamp(28px, 5vw, 56px);
  align-items: start;
}
.rk-faq__aside { position: sticky; top: 110px; }
.rk-faq__aside .rk-section__title { text-align: left; margin: 14px 0 14px; }
.rk-faq__aside .rk-section__lead { text-align: left; margin: 0 0 22px; }

.rk-faq { display: grid; gap: 10px; }
.rk-faq__item {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.rk-faq__item[open] {
  border-color: var(--c-primary);
  box-shadow: var(--c-shadow-md);
}
.rk-faq__q {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  cursor: pointer;
  font-weight: 700; font-size: 15.5px;
  color: var(--c-text-strong);
  list-style: none;
  user-select: none;
}
.rk-faq__q::-webkit-details-marker { display: none; }
.rk-faq__chev {
  font-size: 22px;
  color: var(--c-primary);
  transition: transform .25s ease;
  flex-shrink: 0;
}
.rk-faq__item[open] .rk-faq__chev { transform: rotate(45deg); }
.rk-faq__a {
  padding: 0 20px 18px;
  color: var(--c-text-muted);
  font-size: 14.5px;
  line-height: 1.65;
}

/* ============================================================
   CTA FINAL
   ============================================================ */
.rk-cta-final { padding: clamp(40px, 8vw, 80px) 0; }
.rk-cta-card {
  position: relative;
  border-radius: 24px;
  padding: clamp(40px, 6vw, 72px);
  overflow: hidden;
  color: #fff;
  background: linear-gradient(135deg, #06B6D4 0%, #0891B2 50%, #0E7C70 100%);
  box-shadow: 0 30px 70px rgba(6, 182, 212, .35);
}
.rk-cta-card__bg {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(circle at 15% 20%, rgba(255,255,255,.18), transparent 40%),
    radial-gradient(circle at 90% 90%, rgba(20, 184, 166, .35), transparent 40%);
}
.rk-cta-card__content { position: relative; z-index: 1; max-width: 720px; }
.rk-cta-card__title {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  letter-spacing: -.02em;
  margin: 14px 0 12px;
  line-height: 1.1;
}
.rk-cta-card__text {
  font-size: clamp(15px, 1.5vw, 17px);
  margin: 0 0 26px;
  color: rgba(255, 255, 255, .92);
}
.rk-cta-card__buttons { display: flex; gap: 12px; flex-wrap: wrap; }

/* ============================================================
   FOOTER
   ============================================================ */
.rk-footer {
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
}
.rk-footer__inner {
  padding: clamp(40px, 6vw, 60px) clamp(16px, 4vw, 28px) 32px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 2fr);
  gap: clamp(28px, 5vw, 56px);
}
.rk-footer__brand .rk-brand { margin-bottom: 14px; }
.rk-footer__tag {
  color: var(--c-text-muted);
  font-size: 14px;
  max-width: 38ch;
  line-height: 1.6;
  margin: 0 0 18px;
}
.rk-footer__social { display: flex; gap: 10px; }
.rk-footer__social a {
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  color: var(--c-text);
  text-decoration: none;
  transition: transform .18s ease, color .18s ease, border-color .18s ease;
}
.rk-footer__social a:hover {
  color: var(--c-primary);
  border-color: var(--c-primary);
  transform: translateY(-2px);
}

.rk-footer__cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.rk-footer__title {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: .5px;
  font-weight: 800;
  color: var(--c-text-strong);
  margin-bottom: 14px;
}
.rk-footer__col ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.rk-footer__col a {
  color: var(--c-text-muted);
  text-decoration: none;
  font-size: 14.5px;
  transition: color .18s ease;
}
.rk-footer__col a:hover { color: var(--c-primary-dark); }

.rk-footer__bottom {
  border-top: 1px solid var(--c-border-soft);
  padding: 18px 0;
  font-size: 13px;
  color: var(--c-text-muted);
}
.rk-footer__bottom-inner {
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.rk-footer__legal a { color: var(--c-text-muted); text-decoration: none; }
.rk-footer__legal a:hover { color: var(--c-primary-dark); }

/* ============================================================
   TRANSITIONS
   ============================================================ */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ============================================================
   DARK MODE — paleta completa cuando .rk-home tiene .is-dark
   ============================================================ */
.rk-home.is-dark {
  color-scheme: dark;

  /* Fondos */
  --c-bg:        #0B1220;
  --c-bg-soft:   #0E1729;
  --c-bg-tint:   #0A1528;
  --c-surface:   #131C2E;
  --c-surface-2: #1A243A;

  /* Texto */
  --c-text:        #DBE3EE;
  --c-text-strong: #F4F7FB;
  --c-text-muted:  #94A3B8;

  /* Marca — más luminosa sobre fondo oscuro para mantener contraste AA */
  --c-primary:      #22D3EE;
  --c-primary-dark: #06B6D4;
  --c-primary-deep: #67E8F9;
  --c-primary-soft: rgba(34, 211, 238, .14);
  --c-primary-tint: rgba(34, 211, 238, .07);

  --c-accent:       #2DD4BF;
  --c-accent-soft:  rgba(45, 212, 191, .14);

  --c-amber:      #FBBF24;
  --c-amber-soft: rgba(251, 191, 36, .14);

  --c-success: #4ADE80;
  --c-danger:  #F87171;

  --c-border:      #253149;
  --c-border-soft: #1B2742;

  --c-shadow-sm: 0 1px 2px rgba(0, 0, 0, .35);
  --c-shadow-md: 0 6px 16px rgba(0, 0, 0, .35), 0 2px 4px rgba(0, 0, 0, .25);
  --c-shadow-lg: 0 24px 60px rgba(0, 0, 0, .55), 0 8px 18px rgba(34, 211, 238, .12);

  background: var(--c-bg);
  color: var(--c-text);
}

/* Header translúcido oscuro */
.rk-home.is-dark .rk-header {
  background: rgba(11, 18, 32, .78);
}
.rk-home.is-dark .rk-header.is-scrolled {
  background: rgba(11, 18, 32, .95);
  border-bottom-color: var(--c-border);
  box-shadow: 0 6px 24px rgba(0, 0, 0, .35);
}
.rk-home.is-dark .rk-mobile-toggle { color: var(--c-text-strong); }
.rk-home.is-dark .rk-mobile-menu { background: var(--c-bg); }

/* Hero · halos atenuados + grid más oscuro */
.rk-home.is-dark .rk-hero__halo--1 {
  background: radial-gradient(circle, rgba(34, 211, 238, .25), transparent 70%);
  opacity: .8;
}
.rk-home.is-dark .rk-hero__halo--2 {
  background: radial-gradient(circle, rgba(45, 212, 191, .22), transparent 70%);
  opacity: .8;
}
.rk-home.is-dark .rk-hero__grid {
  background-image:
    linear-gradient(rgba(34, 211, 238, .07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 211, 238, .07) 1px, transparent 1px);
  opacity: .5;
}

/* Preview chrome */
.rk-home.is-dark .rk-preview__chrome {
  background: var(--c-surface-2);
  border-bottom-color: var(--c-border-soft);
}
.rk-home.is-dark .rk-preview__url { color: var(--c-text-muted); }
.rk-home.is-dark .rk-dot--red    { background: #F87171; }
.rk-home.is-dark .rk-dot--amber  { background: #FBBF24; }
.rk-home.is-dark .rk-dot--green  { background: #4ADE80; }

/* Trust strip */
.rk-home.is-dark .rk-trust-strip {
  background: var(--c-surface);
  border-color: var(--c-border-soft);
}

/* Stats banner */
.rk-home.is-dark .rk-stats {
  background: linear-gradient(180deg, var(--c-bg) 0%, var(--c-bg-soft) 100%);
}
.rk-home.is-dark .rk-stats__value { color: var(--c-primary); }
.rk-home.is-dark .rk-stats__item { border-right-color: var(--c-border-soft); }

/* Sección soft */
.rk-home.is-dark .rk-section--soft { background: var(--c-bg-soft); }

/* Showcase panels */
.rk-home.is-dark .rk-showcase__panel {
  background: var(--c-surface);
  border-color: var(--c-border);
}
.rk-home.is-dark .rk-attendance li {
  background: var(--c-surface-2);
  border-color: var(--c-border-soft);
}
.rk-home.is-dark .rk-bar__track { background: var(--c-bg-soft); }
.rk-home.is-dark .rk-mini-stats { border-top-color: var(--c-border-soft); }

/* Eyebrows / tags / pills con tonos brillantes */
.rk-home.is-dark .rk-eyebrow {
  color: #67E8F9;
  background: rgba(34, 211, 238, .12);
}
.rk-home.is-dark .rk-tag {
  color: #67E8F9;
  background: rgba(34, 211, 238, .12);
}
.rk-home.is-dark .rk-pill--success {
  background: rgba(74, 222, 128, .14);
  color: #86EFAC;
}
.rk-home.is-dark .rk-pill--muted {
  background: var(--c-surface-2);
  color: var(--c-text-muted);
}
.rk-home.is-dark .rk-attendance__status.is-on {
  background: rgba(74, 222, 128, .14);
  color: #86EFAC;
}
.rk-home.is-dark .rk-attendance__status.is-late {
  background: rgba(251, 191, 36, .14);
  color: #FCD34D;
}

/* Features y cards genéricas */
.rk-home.is-dark .rk-feature,
.rk-home.is-dark .rk-step,
.rk-home.is-dark .rk-quote,
.rk-home.is-dark .rk-plan {
  background: var(--c-surface);
  border-color: var(--c-border);
}
.rk-home.is-dark .rk-feature:hover,
.rk-home.is-dark .rk-quote:hover {
  border-color: var(--c-primary);
}

/* Step number stroke */
.rk-home.is-dark .rk-step__num {
  -webkit-text-stroke-color: rgba(34, 211, 238, .35);
}
.rk-home.is-dark .rk-step__icon {
  background: rgba(34, 211, 238, .14);
  color: #67E8F9;
}
.rk-home.is-dark .rk-step__connector {
  background: linear-gradient(90deg, rgba(34, 211, 238, .35), transparent);
}
.rk-home.is-dark .rk-step__connector::after {
  background: var(--c-primary);
  box-shadow: 0 0 0 4px rgba(34, 211, 238, .18);
}

/* KPI tarjetas dentro del preview */
.rk-home.is-dark .rk-kpi {
  background: var(--c-surface-2);
  border-color: var(--c-border-soft);
}
.rk-home.is-dark .rk-preview__chart {
  background: var(--c-surface-2);
  border-color: var(--c-border-soft);
}

/* Pricing — plan popular se rediseña para oscuro */
.rk-home.is-dark .rk-plan--popular {
  border-color: var(--c-primary);
  background: linear-gradient(180deg, rgba(34, 211, 238, .08) 0%, var(--c-surface) 35%);
  box-shadow: 0 24px 48px rgba(0, 0, 0, .45), 0 0 0 1px rgba(34, 211, 238, .12);
}
.rk-home.is-dark .rk-plan__features { border-top-color: var(--c-border-soft); }
.rk-home.is-dark .rk-plan__features .q-icon {
  background: rgba(34, 211, 238, .18);
  color: #67E8F9;
}

/* Billing toggle */
.rk-home.is-dark .rk-billing {
  background: var(--c-surface);
  border-color: var(--c-border);
}
.rk-home.is-dark .rk-billing__opt:not(.active) .rk-billing__save {
  background: rgba(45, 212, 191, .15);
  color: #5EEAD4;
}

/* FAQ */
.rk-home.is-dark .rk-faq__item {
  background: var(--c-surface);
  border-color: var(--c-border);
}
.rk-home.is-dark .rk-faq__item[open] {
  box-shadow: 0 8px 24px rgba(0, 0, 0, .35);
}

/* CTA final */
.rk-home.is-dark .rk-cta-card {
  background: linear-gradient(135deg, #0E7C8F 0%, #0891B2 50%, #0E7C70 100%);
  box-shadow: 0 30px 70px rgba(0, 0, 0, .55), 0 0 0 1px rgba(34, 211, 238, .18);
}

/* Footer */
.rk-home.is-dark .rk-footer {
  background: var(--c-bg-soft);
  border-top-color: var(--c-border);
}
.rk-home.is-dark .rk-footer__bottom { border-top-color: var(--c-border-soft); }
.rk-home.is-dark .rk-footer__social a {
  background: var(--c-surface);
  border-color: var(--c-border);
}

/* Theme toggle — oscuro */
.rk-home.is-dark .rk-theme-toggle {
  background: var(--c-surface);
  border-color: var(--c-border);
  color: var(--c-text-strong);
}
.rk-home.is-dark .rk-theme-toggle:hover {
  color: var(--c-primary);
  border-color: var(--c-primary);
}

/* Brand mark glow */
.rk-home.is-dark .rk-brand__mark {
  box-shadow: 0 6px 14px rgba(34, 211, 238, .28);
}

/* Floating chips elevadas sobre la card oscura */
.rk-home.is-dark .rk-float-chip {
  background: var(--c-surface);
  border-color: var(--c-border);
  box-shadow: 0 10px 24px rgba(0, 0, 0, .45);
}

/* Hero title gradient — refresca tonos para oscuro */
.rk-home.is-dark .rk-grad {
  background: linear-gradient(120deg, #67E8F9 0%, #5EEAD4 100%);
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
}

/* Logos del trust strip un poco más visibles */
.rk-home.is-dark .rk-logo { color: var(--c-text-muted); opacity: .85; }
.rk-home.is-dark .rk-logos li:hover .rk-logo { color: var(--c-text-strong); opacity: 1; }

/* Botón ghost se ajusta para oscuro */
.rk-home.is-dark .rk-btn--ghost {
  border-color: var(--c-border) !important;
  color: var(--c-text) !important;
}
.rk-home.is-dark .rk-btn--ghost:hover {
  background: var(--c-surface) !important;
  border-color: var(--c-primary) !important;
  color: var(--c-primary) !important;
}

/* Preview avatar y greet */
.rk-home.is-dark .rk-preview__hello { color: var(--c-text-strong); }

/* Transición global suave entre temas */
.rk-home,
.rk-home .rk-header,
.rk-home .rk-feature,
.rk-home .rk-step,
.rk-home .rk-quote,
.rk-home .rk-plan,
.rk-home .rk-faq__item,
.rk-home .rk-preview,
.rk-home .rk-showcase__panel,
.rk-home .rk-stats__grid,
.rk-home .rk-trust-strip,
.rk-home .rk-footer {
  transition:
    background-color .35s ease,
    border-color .35s ease,
    color .35s ease,
    box-shadow .35s ease;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 1023px) {
  .rk-hero { padding: 120px 0 56px; }
  .rk-hero__inner { grid-template-columns: 1fr; }
  .rk-hero__copy  { max-width: 100%; }
  .rk-hero__visual { order: -1; max-width: 560px; margin: 0 auto; }

  .rk-showcase { grid-template-columns: 1fr; gap: 32px; }
  .rk-showcase--reverse .rk-showcase__copy,
  .rk-showcase--reverse .rk-showcase__media { order: initial; }

  .rk-stats__grid { grid-template-columns: repeat(2, 1fr); }
  .rk-stats__item:nth-child(2) { border-right: 0; }
  .rk-stats__item:nth-child(1), .rk-stats__item:nth-child(2) {
    border-bottom: 1px solid var(--c-border-soft);
  }

  .rk-features,
  .rk-quotes,
  .rk-steps,
  .rk-plans { grid-template-columns: repeat(2, 1fr); }

  .rk-step__connector { display: none; }

  .rk-faq-wrap { grid-template-columns: 1fr; }
  .rk-faq__aside { position: static; }
}

@media (max-width: 640px) {
  .rk-features,
  .rk-quotes,
  .rk-steps,
  .rk-plans,
  .rk-footer__cols { grid-template-columns: 1fr; }

  .rk-stats__grid { grid-template-columns: 1fr; }
  .rk-stats__item { border-right: 0; border-bottom: 1px solid var(--c-border-soft); }
  .rk-stats__item:last-child { border-bottom: 0; }

  .rk-cta-card__buttons .rk-btn { width: 100%; }
  .rk-float-chip--top { left: 0; }
  .rk-float-chip--bot { right: 0; }

  .rk-footer__inner { grid-template-columns: 1fr; }
}
</style>
