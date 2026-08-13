<template>
  <q-page class="rk-app-page">
    <div class="rk-app-card">

      <!-- Marca -->
      <div class="rk-app-brand">
        <div class="rk-app-logo">
          <q-icon name="bolt" size="26px" />
        </div>
        <div>
          <div class="rk-app-name">Recksy</div>
          <div class="rk-app-tag">Marca tu jornada desde el teléfono</div>
        </div>
      </div>

      <!-- ═══════════ Android ═══════════ -->
      <template v-if="platform === 'android'">
        <h1 class="rk-app-title">Instala la app</h1>
        <p class="rk-app-lead">
          Marca entrada y salida desde tu teléfono, revisa tus horas y recibe el
          comprobante de cada marca.
        </p>

        <q-btn
          unelevated
          no-caps
          size="lg"
          color="primary"
          class="rk-app-cta"
          :href="PLAY_STORE_URL"
          target="_blank"
          rel="noopener"
        >
          <!-- Material Icons es el único set cargado (ver quasar-user-options.js);
               los `mdi-*` salen en blanco. -->
          <q-icon name="android" size="22px" class="q-mr-sm" />
          Descargar en Google Play
        </q-btn>

        <p class="rk-app-note">
          Entra con el mismo correo y contraseña que usas en Recksy.
        </p>
      </template>

      <!-- ═══════════ iOS ═══════════ -->
      <template v-else-if="platform === 'ios'">
        <h1 class="rk-app-title">Todavía no está en App Store</h1>
        <!--
          Lo primero que se dice es lo que SÍ se puede hacer hoy. Un trabajador
          con iPhone que solo lee "próximamente" concluye que no puede marcar y
          se lo dice a su jefatura; el navegador funciona igual de bien y hay que
          decírselo antes que nada.
        -->
        <p class="rk-app-lead">
          Estamos trabajando en ella. Mientras tanto <b>puedes marcar igual desde
          Safari</b>: entra a Recksy, marca tu jornada y recibe tu comprobante
          exactamente igual que en la app.
        </p>

        <q-btn
          unelevated
          no-caps
          size="lg"
          color="primary"
          class="rk-app-cta"
          to="/login"
        >
          <q-icon name="login" size="20px" class="q-mr-sm" />
          Marcar desde el navegador
        </q-btn>

        <div class="rk-app-tip">
          <q-icon name="ios_share" size="18px" />
          <span>
            Toca <b>Compartir → Añadir a pantalla de inicio</b> y Recksy queda
            como un ícono más, igual que una app.
          </span>
        </div>

        <!-- Lista de espera -->
        <div class="rk-app-waitlist">
          <template v-if="!waitlistDone">
            <div class="rk-app-waitlist__title">¿Te avisamos cuando salga?</div>
            <q-form class="rk-app-waitlist__form" @submit.prevent="joinWaitlist">
              <q-input
                v-model="waitlistEmail"
                type="email"
                outlined
                dense
                placeholder="tu@correo.cl"
                :disable="waitlistLoading"
                :error="!!waitlistError"
                :error-message="waitlistError"
                hide-bottom-space
                class="col"
              />
              <!-- Honeypot: un humano nunca lo ve ni lo llena. -->
              <input v-model="website" class="rk-hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
              <q-btn
                unelevated
                no-caps
                color="primary"
                type="submit"
                :loading="waitlistLoading"
                label="Avísame"
              />
            </q-form>
          </template>
          <div v-else class="rk-app-waitlist__ok">
            <q-icon name="check_circle" size="20px" />
            Listo, te escribimos cuando esté disponible.
          </div>
        </div>
      </template>

      <!-- ═══════════ Escritorio ═══════════ -->
      <template v-else>
        <h1 class="rk-app-title">Escanea con tu teléfono</h1>
        <p class="rk-app-lead">
          La app es para el teléfono con el que marcas tu jornada. Apunta la
          cámara a este código y se abre la descarga.
        </p>

        <div class="rk-app-qr">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="Código QR para descargar la app de Recksy" />
          <q-spinner v-else color="primary" size="32px" />
        </div>

        <div class="rk-app-url">{{ shareUrl }}</div>

        <div class="rk-app-stores">
          <a :href="PLAY_STORE_URL" target="_blank" rel="noopener" class="rk-app-store">
            <q-icon name="android" size="20px" />
            <span>Disponible en Google Play</span>
          </a>
          <div class="rk-app-store rk-app-store--soon">
            <q-icon name="phone_iphone" size="20px" />
            <span>iOS: en camino</span>
          </div>
        </div>

        <p class="rk-app-note">
          ¿Eres de RR.HH.? Comparte esta misma dirección con tu equipo o imprímela
          junto al reloj de marcaje.
        </p>
      </template>

      <router-link to="/" class="rk-app-back">← Volver a Recksy</router-link>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import publicAxios from '@/utils/publicRequest'
import { PLAY_STORE_URL, APP_LANDING_PATH, detectPlatform } from '@/utils/appDownload'

/**
 * Página única de descarga.
 *
 * No redirige sola a Google Play, ni siquiera en Android. Quien llega acá lo
 * hace desde un correo o un QR pegado en la pared, y necesita saber dos cosas
 * —qué instalar y con qué credenciales entrar— que una redirección instantánea
 * se salta. Además, redirigir en el `onMounted` rompe el botón "atrás": vuelve
 * a esta página y la dispara de nuevo.
 */
const platform = ref('desktop')
const qrDataUrl = ref('')

// El QR apunta a esta misma página, NO a Google Play: un iPhone que escanea el
// código pegado junto al reloj tiene que llegar a algo que le sirva.
const shareUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}${APP_LANDING_PATH}`
    : `https://www.recksy.com${APP_LANDING_PATH}`

const waitlistEmail = ref('')
const waitlistError = ref('')
const waitlistLoading = ref(false)
const waitlistDone = ref(false)
const website = ref('')

async function joinWaitlist() {
  waitlistError.value = ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail.value.trim())) {
    waitlistError.value = 'Escribe un correo válido'
    return
  }
  waitlistLoading.value = true
  try {
    await publicAxios.post('/contact/ios-waitlist', {
      email: waitlistEmail.value.trim(),
      source: 'app_landing',
      website: website.value,
    })
    waitlistDone.value = true
  } catch (e) {
    waitlistError.value =
      e?.response?.data?.errors?.email || 'No pudimos guardarlo. Inténtalo de nuevo.'
  } finally {
    waitlistLoading.value = false
  }
}

onMounted(async () => {
  platform.value = detectPlatform()

  // El QR solo se usa en escritorio, así que la librería se carga solo ahí:
  // en el teléfono —que es donde la conexión suele ser peor— no se descarga.
  if (platform.value !== 'desktop') return
  try {
    const QRCode = (await import(/* webpackChunkName:"qrcode" */ 'qrcode')).default
    qrDataUrl.value = await QRCode.toDataURL(shareUrl, {
      width: 440,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
  } catch (e) {
    console.warn('[DescargarApp] QR:', e?.message)
  }
})
</script>

<style scoped>
.rk-app-page {
  display: flex; align-items: center; justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(160deg, #f8fafc, #ecfeff);
}
body.body--dark .rk-app-page {
  background: linear-gradient(160deg, #0f172a, #111827);
}

.rk-app-card {
  width: 100%; max-width: 460px;
  background: #fff;
  border-radius: 20px;
  padding: 2rem 1.75rem 1.5rem;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
  text-align: center;
}
body.body--dark .rk-app-card {
  background: #1e293b;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
}

.rk-app-brand {
  display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  margin-bottom: 1.5rem; text-align: left;
}
.rk-app-logo {
  width: 46px; height: 46px; border-radius: 13px;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #0CA9C4, #0893AA);
  color: #fff;
}
.rk-app-name { font-weight: 800; font-size: 1.05rem; line-height: 1.2; }
.rk-app-tag { font-size: 0.78rem; color: #64748b; }
body.body--dark .rk-app-tag { color: #94a3b8; }

.rk-app-title { font-size: 1.35rem; font-weight: 800; margin: 0 0 0.5rem; line-height: 1.25; }
.rk-app-lead { font-size: 0.92rem; line-height: 1.55; color: #475569; margin: 0 0 1.5rem; }
body.body--dark .rk-app-lead { color: #cbd5e1; }

.rk-app-cta {
  width: 100%; border-radius: 12px; font-weight: 700;
  padding: 0.65rem 1rem; white-space: nowrap;
}
/* El contenido de q-btn es un flex que envuelve por defecto: en un teléfono
   angosto el ícono se iba solo a la primera línea y el texto abajo, con pinta
   de dos botones apilados. */
.rk-app-cta :deep(.q-btn__content) { flex-wrap: nowrap; }

.rk-app-note { font-size: 0.78rem; color: #64748b; margin: 1rem 0 0; line-height: 1.5; }
body.body--dark .rk-app-note { color: #94a3b8; }

.rk-app-tip {
  display: flex; align-items: flex-start; gap: 0.5rem;
  margin-top: 1rem; padding: 0.7rem 0.85rem;
  border-radius: 12px; background: rgba(12, 169, 196, 0.10);
  font-size: 0.8rem; line-height: 1.45; color: #075E6D; text-align: left;
}
body.body--dark .rk-app-tip { background: rgba(12, 169, 196, 0.16); color: #a5f3fc; }

/* ===== Lista de espera iOS ===== */
.rk-app-waitlist {
  margin-top: 1.5rem; padding-top: 1.25rem;
  border-top: 1px solid rgba(148, 163, 184, 0.25);
}
.rk-app-waitlist__title { font-size: 0.85rem; font-weight: 700; margin-bottom: 0.6rem; }
.rk-app-waitlist__form { display: flex; gap: 0.5rem; align-items: flex-start; }
.rk-app-waitlist__ok {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  font-size: 0.85rem; font-weight: 600; color: #059669;
}
/* Honeypot: fuera de la vista pero no `display:none` — algunos bots lo detectan
   y saltan justamente los campos ocultos de esa forma. */
.rk-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }

/* ===== QR ===== */
.rk-app-qr {
  display: grid; place-items: center;
  width: 220px; height: 220px; margin: 0 auto;
  padding: 12px; border-radius: 16px;
  background: #fff; border: 1px solid rgba(148, 163, 184, 0.3);
}
.rk-app-qr img { width: 100%; height: 100%; display: block; }

.rk-app-url {
  margin-top: 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem; color: #64748b; word-break: break-all;
}
body.body--dark .rk-app-url { color: #94a3b8; }

.rk-app-stores {
  display: flex; flex-direction: column; gap: 0.5rem;
  margin-top: 1.25rem;
}
.rk-app-store {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.6rem 0.9rem; border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  font-size: 0.85rem; font-weight: 600;
  color: inherit; text-decoration: none;
  transition: border-color 0.2s, transform 0.2s;
}
.rk-app-store:hover { border-color: #0CA9C4; transform: translateY(-1px); }
.rk-app-store--soon { opacity: 0.55; cursor: default; }
.rk-app-store--soon:hover { border-color: rgba(148, 163, 184, 0.35); transform: none; }

.rk-app-back {
  display: inline-block; margin-top: 1.5rem;
  font-size: 0.8rem; color: #64748b; text-decoration: none;
}
.rk-app-back:hover { color: #0CA9C4; }
</style>
