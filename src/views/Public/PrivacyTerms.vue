<template>
  <q-page class="rk-legal" :class="{ 'is-dark': isDark }">
    <!-- Header -->
    <header class="rk-legal__header">
      <div class="rk-legal__container">
        <router-link to="/" class="rk-brand" aria-label="Recksy">
          <span class="rk-brand__mark"><q-icon name="bolt" /></span>
          <span class="rk-brand__name">Recksy</span>
        </router-link>

        <div class="rk-legal__header-actions">
          <button
            type="button"
            class="rk-theme-toggle"
            :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
            :title="isDark ? 'Modo claro' : 'Modo oscuro'"
            @click="toggleDark"
          >
            <q-icon :name="isDark ? 'light_mode' : 'dark_mode'" />
          </button>
          <router-link to="/" class="rk-back-link">
            <q-icon name="arrow_back" size="18px" />
            <span>Volver al inicio</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="rk-legal__hero">
      <div class="rk-legal__container">
        <span class="rk-eyebrow">
          <q-icon name="shield" size="14px" />
          Documento legal
        </span>
        <h1 class="rk-legal__title">Términos y Política de Privacidad</h1>
        <p class="rk-legal__subtitle">
          Cómo tratamos tus datos en Recksy. Última actualización:
          <strong>{{ lastUpdated }}</strong>.
        </p>
      </div>
    </section>

    <!-- Content -->
    <section class="rk-legal__body">
      <div class="rk-legal__container rk-legal__grid">
        <!-- TOC -->
        <aside class="rk-legal__toc">
          <div class="rk-legal__toc-card">
            <div class="rk-legal__toc-title">En esta página</div>
            <ul>
              <li v-for="s in sections" :key="s.id">
                <a :href="`#${s.id}`">{{ s.title }}</a>
              </li>
            </ul>
          </div>
        </aside>

        <!-- Sections -->
        <article class="rk-legal__article">
          <section
            v-for="s in sections"
            :id="s.id"
            :key="s.id"
            class="rk-legal__section"
          >
            <div class="rk-legal__section-head">
              <span class="rk-legal__section-icon">
                <q-icon :name="s.icon" size="20px" />
              </span>
              <h2>{{ s.title }}</h2>
            </div>
            <p v-for="(p, i) in s.body" :key="i">{{ p }}</p>
          </section>

          <p class="rk-legal__footer">
            Al continuar usando Recksy aceptas estos términos y la política de
            privacidad descrita. Si tienes preguntas, escríbenos a
            <a href="mailto:soporte@recksy.app">soporte@recksy.app</a>.
          </p>
        </article>
      </div>
    </section>

    <!-- Footer -->
    <footer class="rk-legal__bottom">
      <div class="rk-legal__container">
        <span>© {{ year }} Recksy</span>
        <router-link to="/">recksy.app</router-link>
      </div>
    </footer>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)
const year = new Date().getFullYear()
const lastUpdated = '28 de abril de 2026'

onMounted(() => {
  const saved = typeof localStorage !== 'undefined' && localStorage.getItem('rk-theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else if (typeof window !== 'undefined' && window.matchMedia) {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
})

function toggleDark() {
  isDark.value = !isDark.value
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('rk-theme', isDark.value ? 'dark' : 'light')
  }
}

const sections = [
  {
    id: 'resumen',
    icon: 'info',
    title: '1. Resumen',
    body: [
      'Recksy es una aplicación de control de asistencia y gestión laboral. Esta página explica qué datos recolectamos, para qué los usamos y cómo los protegemos.',
      'Tu privacidad es importante. Solo recolectamos lo estrictamente necesario para que la aplicación funcione y para cumplir las obligaciones legales del empleador en Chile (Resolución Exenta N°38/2024 de la Dirección del Trabajo).',
    ],
  },
  {
    id: 'terminos',
    icon: 'description',
    title: '2. Términos de uso',
    body: [
      'Cuenta: para usar Recksy debes tener una cuenta válida creada por tu empresa. Eres responsable de mantener la confidencialidad de tus credenciales.',
      'Uso permitido: la app debe usarse únicamente con fines laborales relacionados con tu jornada de trabajo (marcar entrada/salida, gestionar solicitudes, consultar documentos).',
      'Uso prohibido: está prohibido suplantar a otra persona, falsificar marcaciones, manipular la geolocalización, alterar fotos o intentar vulnerar la seguridad de la aplicación.',
      'Disponibilidad: nos esforzamos por mantener la app disponible 24/7, pero no garantizamos un servicio ininterrumpido. Las tareas de mantenimiento podrán requerir interrupciones puntuales.',
      'Cambios: podemos actualizar estos términos. Si los cambios son sustanciales te lo notificaremos dentro de la app antes de que entren en vigor.',
    ],
  },
  {
    id: 'datos',
    icon: 'database',
    title: '3. Datos que recolectamos',
    body: [
      'Datos de cuenta: nombre, correo electrónico, teléfono, RUT y empresa asociada. Estos datos los proporciona tu empleador o tú mismo al iniciar sesión.',
      'Datos de asistencia: fecha y hora de cada marcación, ubicación geográfica (latitud, longitud y precisión) y, opcionalmente, foto en el momento de la marcación. La ubicación se obtiene únicamente cuando registras una marcación.',
      'Datos del dispositivo: sistema operativo, versión de la app, tipo de dispositivo y dirección IP. Esto se usa con fines de auditoría, seguridad y soporte técnico.',
      'Foto de perfil: si decides subir una imagen, esta se almacena de forma privada y solo es visible para ti y para usuarios autorizados de tu empresa.',
    ],
  },
  {
    id: 'permisos',
    icon: 'key',
    title: '4. Permisos del sistema (app móvil)',
    body: [
      'Cámara: necesaria para capturar fotos en el momento de marcar asistencia y para actualizar tu foto de perfil. Solo se activa cuando tú inicias la acción.',
      'Ubicación: usada en primer plano para validar la geolocalización al marcar asistencia. Recksy NO accede a tu ubicación en segundo plano ni te rastrea cuando la app está cerrada.',
      'Galería: necesaria si eliges una foto desde tu teléfono para tu perfil. Solo se accede a la imagen que tú seleccionas.',
      'Notificaciones: usadas para enviarte recordatorios de entrada/salida y avisos relacionados con tus solicitudes. Puedes desactivarlas desde Ajustes del sistema en cualquier momento.',
    ],
  },
  {
    id: 'almacenamiento',
    icon: 'cloud',
    title: '5. Almacenamiento y seguridad',
    body: [
      'Tus datos se almacenan en servidores ubicados en regiones de Amazon Web Services (AWS) y MongoDB Atlas, con cifrado en tránsito (HTTPS/TLS) y en reposo.',
      'Las fotos de asistencia y de perfil se guardan en Amazon S3 con acceso privado. Las URLs son firmadas y temporales, lo que significa que solo usuarios autenticados pueden visualizarlas.',
      'Las contraseñas se almacenan con hash bcrypt; nunca se guardan en texto plano.',
      'Conservamos los datos de asistencia por el tiempo que exija la legislación laboral chilena vigente, y los eliminamos o anonimizamos pasado ese plazo.',
    ],
  },
  {
    id: 'derechos',
    icon: 'verified_user',
    title: '6. Tus derechos',
    body: [
      'Acceso: puedes solicitar una copia de tus datos personales contactando a tu empleador o a nuestro equipo de soporte.',
      'Rectificación: si algún dato es incorrecto, puedes editarlo desde la pantalla de perfil o solicitar la corrección al administrador.',
      'Eliminación: puedes solicitar la eliminación de tu cuenta. Algunos datos podrán conservarse si la legislación laboral lo exige.',
      'Portabilidad: puedes solicitar tus datos en formato exportable (CSV/JSON) para transferirlos a otro sistema.',
      'Oposición: puedes oponerte al tratamiento de datos no esenciales (por ejemplo, comunicaciones promocionales).',
    ],
  },
  {
    id: 'contacto',
    icon: 'mail',
    title: '7. Contacto',
    body: [
      'Si tienes preguntas sobre estos términos, sobre tus datos o quieres ejercer alguno de tus derechos, escríbenos a soporte@recksy.app.',
      'También puedes contactar al responsable de datos de tu empresa, quien gestiona tu cuenta y los registros laborales.',
    ],
  },
]
</script>

<style scoped>
/* ===== Tokens ===== */
.rk-legal {
  --rk-bg: #ffffff;
  --rk-bg-alt: #f6f7fa;
  --rk-text: #0b0b0f;
  --rk-muted: #5e6470;
  --rk-border: #e2e6ec;
  --rk-primary: #22c8d1;
  --rk-primary-soft: #d9f3f5;
  --rk-card: #ffffff;
  --rk-shadow: 0 6px 24px rgba(0, 0, 0, 0.05);
  background: var(--rk-bg);
  color: var(--rk-text);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.rk-legal.is-dark {
  --rk-bg: #0b0b0f;
  --rk-bg-alt: #121218;
  --rk-text: #f2f2f5;
  --rk-muted: #a3abb6;
  --rk-border: #2b2d34;
  --rk-card: #17171f;
  --rk-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
}

.rk-legal__container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ===== Header ===== */
.rk-legal__header {
  border-bottom: 1px solid var(--rk-border);
  padding: 16px 0;
  background: var(--rk-bg);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
}
.rk-legal__header .rk-legal__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.rk-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--rk-text);
}
.rk-brand__mark {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--rk-primary), #16bac3);
  color: #fff;
}
.rk-brand__name {
  font-weight: 800;
  letter-spacing: -0.4px;
  font-size: 18px;
}
.rk-legal__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.rk-theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--rk-border);
  background: transparent;
  color: var(--rk-text);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.15s ease;
}
.rk-theme-toggle:hover {
  background: var(--rk-bg-alt);
}
.rk-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--rk-border);
  color: var(--rk-text);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.15s ease;
}
.rk-back-link:hover {
  background: var(--rk-bg-alt);
}

/* ===== Hero ===== */
.rk-legal__hero {
  padding: 56px 0 32px;
  background: linear-gradient(
    180deg,
    var(--rk-bg) 0%,
    var(--rk-bg-alt) 100%
  );
  border-bottom: 1px solid var(--rk-border);
}
.rk-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--rk-primary-soft);
  color: var(--rk-primary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.rk-legal.is-dark .rk-eyebrow {
  background: rgba(34, 200, 209, 0.12);
}
.rk-legal__title {
  margin: 16px 0 8px;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1.1;
}
.rk-legal__subtitle {
  margin: 0;
  color: var(--rk-muted);
  font-size: 16px;
  max-width: 720px;
}

/* ===== Body grid ===== */
.rk-legal__body {
  padding: 40px 0 80px;
}
.rk-legal__grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 40px;
  align-items: start;
}
@media (max-width: 900px) {
  .rk-legal__grid {
    grid-template-columns: 1fr;
  }
}

/* ===== TOC ===== */
.rk-legal__toc {
  position: sticky;
  top: 96px;
}
@media (max-width: 900px) {
  .rk-legal__toc {
    position: static;
  }
}
.rk-legal__toc-card {
  background: var(--rk-card);
  border: 1px solid var(--rk-border);
  border-radius: 14px;
  padding: 16px;
  box-shadow: var(--rk-shadow);
}
.rk-legal__toc-title {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--rk-muted);
  margin-bottom: 10px;
}
.rk-legal__toc ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rk-legal__toc li {
  padding: 4px 0;
}
.rk-legal__toc a {
  color: var(--rk-text);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.15s ease;
}
.rk-legal__toc a:hover {
  color: var(--rk-primary);
}

/* ===== Article ===== */
.rk-legal__article {
  max-width: 760px;
}
.rk-legal__section {
  background: var(--rk-card);
  border: 1px solid var(--rk-border);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 16px;
  scroll-margin-top: 96px;
  box-shadow: var(--rk-shadow);
}
.rk-legal__section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.rk-legal__section-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--rk-primary-soft);
  color: var(--rk-primary);
}
.rk-legal.is-dark .rk-legal__section-icon {
  background: rgba(34, 200, 209, 0.12);
}
.rk-legal__section h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.3px;
}
.rk-legal__section p {
  margin: 0 0 10px;
  font-size: 15px;
  line-height: 1.65;
  color: var(--rk-text);
}
.rk-legal__section p:last-child {
  margin-bottom: 0;
}
.rk-legal__footer {
  margin-top: 24px;
  padding: 20px;
  border-radius: 12px;
  background: var(--rk-bg-alt);
  font-size: 14px;
  color: var(--rk-muted);
  line-height: 1.6;
}
.rk-legal__footer a {
  color: var(--rk-primary);
  font-weight: 700;
  text-decoration: none;
}

/* ===== Bottom ===== */
.rk-legal__bottom {
  border-top: 1px solid var(--rk-border);
  padding: 20px 0;
  font-size: 13px;
  color: var(--rk-muted);
}
.rk-legal__bottom .rk-legal__container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rk-legal__bottom a {
  color: var(--rk-muted);
  text-decoration: none;
}
.rk-legal__bottom a:hover {
  color: var(--rk-primary);
}
</style>
