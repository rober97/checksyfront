<template>
  <q-page class="rk-contact" :class="{ 'is-dark': isDark }">
    <!-- ======================== HEADER ======================== -->
    <header class="rc-header">
      <div class="rc-header__inner">
        <router-link to="/" class="rc-brand" aria-label="Recksy">
          <span class="rc-brand__mark">
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <path d="M 122.23 38.92 A 13.00 13.00 0 0 1 84.61 57.71 A 46 46 0 1 0 117.44 52.08 A 7.00 7.00 0 0 1 122.23 38.92 Z" fill="currentColor"/>
              <circle cx="100" cy="100" r="20" fill="currentColor"/>
            </svg>
          </span>
          <span class="rc-brand__name">Recksy</span>
        </router-link>

        <div class="rc-header__cta">
          <button
            type="button"
            class="rc-theme-toggle"
            :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
            :title="isDark ? 'Modo claro' : 'Modo oscuro'"
            @click="toggleDark"
          >
            <q-icon :name="isDark ? 'light_mode' : 'dark_mode'" />
          </button>
          <q-btn flat no-caps class="rc-btn rc-btn--ghost" icon="arrow_back" label="Volver al inicio" @click="goHome" />
        </div>
      </div>
    </header>

    <section class="rc-wrap">
      <div class="rc-grid">
        <!-- ======================== ASIDE (info + canales) ======================== -->
        <aside class="rc-aside">
          <span class="rc-eyebrow"><span class="rc-eyebrow__dot"></span> {{ meta.eyebrow }}</span>
          <h1 class="rc-title">{{ meta.title }}</h1>
          <p class="rc-lead">{{ meta.lead }}</p>

          <ul class="rc-perks">
            <li v-for="p in meta.perks" :key="p"><q-icon name="check_circle"/> {{ p }}</li>
          </ul>

          <div class="rc-channels">
            <a class="rc-channel" :href="`mailto:${meta.inbox}`">
              <span class="rc-channel__icon"><q-icon name="mail"/></span>
              <span class="rc-channel__body">
                <span class="rc-channel__label">Escríbenos directo</span>
                <span class="rc-channel__value">{{ meta.inbox }}</span>
              </span>
            </a>
            <div class="rc-channel">
              <span class="rc-channel__icon"><q-icon name="schedule"/></span>
              <span class="rc-channel__body">
                <span class="rc-channel__label">Tiempo de respuesta</span>
                <span class="rc-channel__value">Menos de 4 horas hábiles</span>
              </span>
            </div>
          </div>
        </aside>

        <!-- ======================== FORM CARD ======================== -->
        <div class="rc-card">
          <!-- Toggle Soporte / Ventas -->
          <div class="rc-segment" role="tablist" aria-label="Tipo de consulta">
            <button
              type="button" role="tab"
              class="rc-segment__opt" :class="{ active: intent === 'support' }"
              :aria-selected="intent === 'support'"
              @click="setIntent('support')"
            >
              <q-icon name="support_agent"/> Soporte
            </button>
            <button
              type="button" role="tab"
              class="rc-segment__opt" :class="{ active: intent === 'sales' }"
              :aria-selected="intent === 'sales'"
              @click="setIntent('sales')"
            >
              <q-icon name="storefront"/> Ventas
            </button>
          </div>

          <!-- Estado enviado -->
          <div v-if="sent" class="rc-success">
            <div class="rc-success__icon"><q-icon name="mark_email_read"/></div>
            <h2 class="rc-success__title">¡Mensaje enviado!</h2>
            <p class="rc-success__text">
              Gracias {{ form.name || '' }}. Recibimos tu mensaje y te responderemos
              a <b>{{ form.email }}</b> muy pronto.
            </p>
            <div class="rc-success__actions">
              <q-btn unelevated no-caps class="rc-btn rc-btn--primary" label="Enviar otro mensaje" @click="resetForm" />
              <q-btn flat no-caps class="rc-btn rc-btn--ghost" label="Volver al inicio" @click="goHome" />
            </div>
          </div>

          <!-- Formulario -->
          <form v-else class="rc-form" novalidate @submit.prevent="submit">
            <p class="rc-form__intro">{{ meta.formHint }}</p>

            <div class="rc-field">
              <label class="rc-label" for="rc-name">Nombre <span class="rc-req">*</span></label>
              <input
                id="rc-name" v-model.trim="form.name" type="text"
                class="rc-input" :class="{ 'is-error': errors.name }"
                placeholder="Tu nombre" autocomplete="name" maxlength="120"
              />
              <span v-if="errors.name" class="rc-error">{{ errors.name }}</span>
            </div>

            <div class="rc-row">
              <div class="rc-field">
                <label class="rc-label" for="rc-email">Correo <span class="rc-req">*</span></label>
                <input
                  id="rc-email" v-model.trim="form.email" type="email"
                  class="rc-input" :class="{ 'is-error': errors.email }"
                  placeholder="tucorreo@empresa.com" autocomplete="email" maxlength="160"
                />
                <span v-if="errors.email" class="rc-error">{{ errors.email }}</span>
              </div>

              <div class="rc-field">
                <label class="rc-label" for="rc-phone">Teléfono <span class="rc-opt">(opcional)</span></label>
                <input
                  id="rc-phone" v-model.trim="form.phone" type="tel"
                  class="rc-input" placeholder="+56 9 ..." autocomplete="tel" maxlength="40"
                />
              </div>
            </div>

            <div class="rc-field">
              <label class="rc-label" for="rc-company">
                Empresa <span class="rc-opt">{{ intent === 'sales' ? '(recomendado)' : '(opcional)' }}</span>
              </label>
              <input
                id="rc-company" v-model.trim="form.company" type="text"
                class="rc-input" placeholder="Nombre de tu empresa" autocomplete="organization" maxlength="160"
              />
            </div>

            <div class="rc-field">
              <label class="rc-label" for="rc-message">Mensaje <span class="rc-req">*</span></label>
              <textarea
                id="rc-message" v-model.trim="form.message" rows="5"
                class="rc-input rc-textarea" :class="{ 'is-error': errors.message }"
                :placeholder="meta.placeholder" maxlength="4000"
              ></textarea>
              <div class="rc-field__foot">
                <span v-if="errors.message" class="rc-error">{{ errors.message }}</span>
                <span class="rc-count">{{ (form.message || '').length }}/4000</span>
              </div>
            </div>

            <!-- Honeypot anti-bots (oculto) -->
            <input v-model="form.website" class="rc-hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" />

            <p v-if="serverError" class="rc-alert">{{ serverError }}</p>

            <q-btn
              type="submit" unelevated no-caps size="lg"
              class="rc-btn rc-btn--primary rc-btn--block"
              :loading="loading" :disable="loading"
              :label="intent === 'sales' ? 'Enviar y agendar demo' : 'Enviar mensaje'"
              icon-right="send"
            />
            <p class="rc-form__legal">
              Al enviar aceptas nuestros
              <router-link to="/legal/terms">Términos y Privacidad</router-link>.
            </p>
          </form>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { API_URL } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const isDark = computed(() => $q.dark.isActive)

function toggleDark() {
  const v = !$q.dark.isActive
  $q.dark.set(v)
  try { localStorage.setItem('darkMode', String(v)) } catch (_) {}
}

/* ---------- Intención (soporte / ventas) ---------- */
const SALES_ALIASES = new Set(['ventas', 'sales', 'demo'])
function intentFromQuery(q) {
  return SALES_ALIASES.has(String(q || '').toLowerCase()) ? 'sales' : 'support'
}
const intent = ref(intentFromQuery(route.query.tipo))

const COPY = {
  support: {
    eyebrow: 'Estamos para ayudarte',
    title: 'Contactar soporte',
    lead: 'Cuéntanos qué necesitas y nuestro equipo te ayudará a resolverlo. Respondemos rápido y en español.',
    perks: ['Soporte por correo y chat', 'Ayuda con configuración y migración', 'Acompañamiento en cumplimiento DT'],
    inbox: 'hola@recksy.com',
    formHint: '¿Tienes una duda o un problema? Escríbenos y te respondemos a la brevedad.',
    placeholder: 'Describe tu consulta o el problema que estás viendo…',
  },
  sales: {
    eyebrow: 'Hablemos de tu equipo',
    title: 'Hablar con ventas',
    lead: 'Te mostramos Recksy en una demo de 20 minutos y armamos un plan a la medida de tu empresa.',
    perks: ['Demo personalizada', 'Cotización por volumen', 'Onboarding y migración incluidos'],
    inbox: 'ventas@recksy.com',
    formHint: 'Cuéntanos sobre tu empresa y coordinamos una demo sin compromiso.',
    placeholder: '¿Cuántos trabajadores tienes? ¿Qué te gustaría resolver con Recksy?',
  },
}
const meta = computed(() => COPY[intent.value])

function setIntent(v) {
  if (intent.value === v) return
  intent.value = v
  const tipo = v === 'sales' ? 'ventas' : 'soporte'
  router.replace({ query: { ...route.query, tipo } })
}

// Sincroniza si cambian la URL (ej. navegación entre CTAs).
watch(() => route.query.tipo, (t) => { intent.value = intentFromQuery(t) })

/* ---------- Formulario ---------- */
const form = reactive({ name: '', email: '', company: '', phone: '', message: '', website: '' })
const errors = reactive({ name: '', email: '', message: '' })
const loading = ref(false)
const sent = ref(false)
const serverError = ref('')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate() {
  errors.name = form.name ? '' : 'Ingresa tu nombre'
  errors.email = !form.email ? 'Ingresa tu correo' : (EMAIL_RE.test(form.email) ? '' : 'Correo inválido')
  errors.message = !form.message || form.message.length < 10 ? 'Cuéntanos un poco más (mínimo 10 caracteres)' : ''
  return !errors.name && !errors.email && !errors.message
}

async function submit() {
  serverError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    const res = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: intent.value,
        name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone,
        message: form.message,
        website: form.website, // honeypot
      }),
    })

    if (res.status === 422) {
      const data = await res.json().catch(() => ({}))
      Object.assign(errors, { name: '', email: '', message: '' }, data.errors || {})
      return
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'No se pudo enviar el mensaje')
    }
    sent.value = true
  } catch (e) {
    serverError.value =
      'No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos a ' + meta.value.inbox + '.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { name: '', email: '', company: '', phone: '', message: '', website: '' })
  Object.assign(errors, { name: '', email: '', message: '' })
  serverError.value = ''
  sent.value = false
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  try {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) $q.dark.set(saved === 'true')
    else if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) $q.dark.set(true)
  } catch (_) {}
})
</script>

<style scoped>
/* ===== Tokens (alineados con HomePublic) ===== */
.rk-contact {
  --c-bg:        #F8FAFC;
  --c-surface:   #FFFFFF;
  --c-surface-2: #F1F5F9;
  --c-text:        #1E293B;
  --c-text-strong: #0F172A;
  --c-text-muted:  #64748B;
  --c-primary:      #0CA9C4;
  --c-primary-dark: #0893AA;
  --c-primary-deep: #155E75;
  --c-primary-soft: #CFFAFE;
  --c-success: #22C55E;
  --c-danger:  #EF4444;
  --c-border:      #E2E8F0;
  --c-shadow-lg: 0 24px 60px rgba(15, 23, 42, .10), 0 8px 18px rgba(12, 169, 196, .08);

  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif;
  min-height: 100vh;
  background:
    radial-gradient(900px 500px at 100% -10%, rgba(12,169,196,.10), transparent 60%),
    radial-gradient(700px 400px at -10% 110%, rgba(8,147,170,.08), transparent 60%),
    var(--c-bg);
  color: var(--c-text);
  -webkit-font-smoothing: antialiased;
}
.rk-contact.is-dark {
  color-scheme: dark;
  --c-bg:        #0B1220;
  --c-surface:   #131C2E;
  --c-surface-2: #1A243A;
  --c-text:        #DBE3EE;
  --c-text-strong: #F4F7FB;
  --c-text-muted:  #94A3B8;
  --c-primary:      #33BECB;
  --c-primary-dark: #0CA9C4;
  --c-primary-deep: #66D2DD;
  --c-primary-soft: rgba(51, 190, 203, .14);
  --c-border:      #253149;
  --c-shadow-lg: 0 24px 60px rgba(0, 0, 0, .55), 0 8px 18px rgba(51, 190, 203, .12);
  background:
    radial-gradient(900px 500px at 100% -10%, rgba(51,190,203,.12), transparent 60%),
    radial-gradient(700px 400px at -10% 110%, rgba(51,190,203,.08), transparent 60%),
    var(--c-bg);
}

/* ===== Header ===== */
.rc-header { position: sticky; top: 0; z-index: 10; backdrop-filter: blur(10px); }
.rc-header__inner {
  max-width: 1100px; margin: 0 auto;
  padding: 16px clamp(16px, 4vw, 28px);
  display: flex; align-items: center; justify-content: space-between;
}
.rc-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
.rc-brand__mark {
  width: 34px; height: 34px; border-radius: 10px;
  display: grid; place-items: center; color: #fff;
  background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark));
  box-shadow: 0 6px 16px rgba(12,169,196,.30);
}
.rc-brand__mark svg { width: 20px; height: 20px; }
.rc-brand__name { font-size: 20px; font-weight: 800; color: var(--c-text-strong); letter-spacing: -.2px; }
.rc-header__cta { display: inline-flex; align-items: center; gap: 8px; }
.rc-theme-toggle {
  width: 40px; height: 40px; border-radius: 12px; cursor: pointer;
  border: 1px solid var(--c-border); background: var(--c-surface); color: var(--c-text);
  display: grid; place-items: center; font-size: 18px;
}
.rc-theme-toggle:hover { border-color: var(--c-primary); color: var(--c-primary); }

/* ===== Layout ===== */
.rc-wrap { max-width: 1100px; margin: 0 auto; padding: clamp(20px, 5vw, 56px) clamp(16px, 4vw, 28px) 72px; }
.rc-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: clamp(24px, 4vw, 56px); align-items: start; }
@media (max-width: 860px) { .rc-grid { grid-template-columns: 1fr; } }

/* ===== Aside ===== */
.rc-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
  color: var(--c-primary-deep); background: var(--c-primary-soft);
  padding: 6px 14px; border-radius: 999px;
}
.rc-eyebrow__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c-primary); box-shadow: 0 0 0 3px rgba(12,169,196,.18); }
.rc-title { font-size: clamp(28px, 4vw, 40px); font-weight: 800; line-height: 1.1; color: var(--c-text-strong); margin: 16px 0 12px; letter-spacing: -.5px; }
.rc-lead { font-size: 16px; line-height: 1.6; color: var(--c-text-muted); margin: 0 0 24px; max-width: 42ch; }

.rc-perks { list-style: none; padding: 0; margin: 0 0 28px; display: grid; gap: 10px; }
.rc-perks li { display: flex; align-items: center; gap: 10px; font-size: 15px; color: var(--c-text); }
.rc-perks .q-icon { color: var(--c-primary); font-size: 20px; }

.rc-channels { display: grid; gap: 12px; }
.rc-channel {
  display: flex; align-items: center; gap: 14px; text-decoration: none;
  padding: 14px 16px; border-radius: 14px;
  border: 1px solid var(--c-border); background: var(--c-surface);
}
a.rc-channel:hover { border-color: var(--c-primary); }
.rc-channel__icon {
  width: 40px; height: 40px; border-radius: 10px; flex: none;
  display: grid; place-items: center; font-size: 20px;
  color: var(--c-primary-dark); background: var(--c-primary-soft);
}
.rc-channel__body { display: flex; flex-direction: column; }
.rc-channel__label { font-size: 12.5px; color: var(--c-text-muted); }
.rc-channel__value { font-size: 15px; font-weight: 700; color: var(--c-text-strong); }

/* ===== Card / Form ===== */
.rc-card {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 22px; padding: clamp(20px, 3vw, 32px);
  box-shadow: var(--c-shadow-lg);
}
.rc-segment {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  padding: 6px; border-radius: 14px; margin-bottom: 22px;
  background: var(--c-surface-2); border: 1px solid var(--c-border);
}
.rc-segment__opt {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 14px; border: none; border-radius: 10px; cursor: pointer;
  font-size: 14.5px; font-weight: 700; color: var(--c-text-muted);
  background: transparent; transition: all .18s ease;
}
.rc-segment__opt .q-icon { font-size: 18px; }
.rc-segment__opt.active {
  color: #fff; background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark));
  box-shadow: 0 6px 16px rgba(12,169,196,.28);
}

.rc-form__intro { margin: 0 0 20px; font-size: 14.5px; color: var(--c-text-muted); }
.rc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 520px) { .rc-row { grid-template-columns: 1fr; } }
.rc-field { margin-bottom: 16px; }
.rc-label { display: block; font-size: 13.5px; font-weight: 700; color: var(--c-text); margin-bottom: 7px; }
.rc-req { color: var(--c-primary-dark); }
.rc-opt { color: var(--c-text-muted); font-weight: 500; }
.rc-input {
  width: 100%; box-sizing: border-box;
  padding: 12px 14px; font-size: 15px; font-family: inherit;
  color: var(--c-text); background: var(--c-bg);
  border: 1px solid var(--c-border); border-radius: 12px;
  outline: none; transition: border-color .15s ease, box-shadow .15s ease;
}
.rc-input::placeholder { color: var(--c-text-muted); opacity: .7; }
.rc-input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 4px rgba(12,169,196,.14); }
.rc-input.is-error { border-color: var(--c-danger); }
.rc-textarea { resize: vertical; min-height: 120px; line-height: 1.5; }
.rc-field__foot { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; gap: 10px; }
.rc-count { font-size: 12px; color: var(--c-text-muted); margin-left: auto; }
.rc-error { font-size: 13px; color: var(--c-danger); font-weight: 600; }

.rc-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }

.rc-alert {
  margin: 4px 0 14px; padding: 12px 14px; border-radius: 12px; font-size: 14px;
  color: var(--c-danger); background: rgba(239,68,68,.10); border: 1px solid rgba(239,68,68,.30);
}

.rc-form__legal { margin: 14px 0 0; font-size: 12.5px; color: var(--c-text-muted); text-align: center; }
.rc-form__legal a { color: var(--c-primary-dark); text-decoration: none; }
.rc-form__legal a:hover { text-decoration: underline; }

/* ===== Botones ===== */
.rc-btn { font-weight: 700; border-radius: 12px; }
.rc-btn--ghost { color: var(--c-text); }
.rc-btn--primary {
  color: #fff;
  background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark)) !important;
  box-shadow: 0 8px 20px rgba(12,169,196,.28);
}
.rc-btn--block { width: 100%; margin-top: 4px; padding: 6px 0; }

/* ===== Éxito ===== */
.rc-success { text-align: center; padding: 18px 6px 8px; }
.rc-success__icon {
  width: 68px; height: 68px; margin: 0 auto 18px; border-radius: 20px;
  display: grid; place-items: center; font-size: 34px; color: #fff;
  background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark));
  box-shadow: 0 12px 28px rgba(12,169,196,.35);
}
.rc-success__title { font-size: 24px; font-weight: 800; color: var(--c-text-strong); margin: 0 0 8px; }
.rc-success__text { font-size: 15px; color: var(--c-text-muted); line-height: 1.6; margin: 0 auto 22px; max-width: 40ch; }
.rc-success__actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
</style>
