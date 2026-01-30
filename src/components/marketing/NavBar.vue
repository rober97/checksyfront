<template>
  <q-header class="rk-header" :class="{ 'scrolled': isScrolled }">
    <div class="rk-header-glow"></div>
    
    <q-toolbar class="rk-toolbar">
      <!-- Logo y Marca -->
      <router-link to="/" class="rk-brand">
        <div class="rk-logo">
          <div class="rk-logo-bg"></div>
          <q-icon name="bolt" class="rk-logo-icon" />
          <div class="rk-logo-pulse"></div>
        </div>
        <div class="rk-brand-content">
          <span class="rk-brand-text">Recksy</span>
          <span class="rk-brand-tag">v2.0</span>
        </div>
      </router-link>

      <q-space />

      <!-- Navegación Desktop -->
      <nav class="rk-nav gt-sm">
        <a
          v-for="(link, index) in navLinks"
          :key="index"
          :href="link.href"
          class="rk-nav-link"
          @click.prevent="scrollToSection(link.href)"
        >
          <q-icon :name="link.icon" class="rk-nav-icon" />
          <span>{{ link.label }}</span>
          <div class="rk-nav-indicator"></div>
        </a>
      </nav>

      <!-- Acciones Desktop -->
      <div class="rk-actions gt-sm">
        <q-btn 
          flat
          no-caps
          class="rk-btn-ghost" 
          label="Ingresar" 
          icon="login"
          @click="navigateTo('Login')"
        />
        <q-btn 
          unelevated 
          no-caps 
          class="rk-btn-cta" 
          label="Comenzar gratis"
          icon-right="arrow_forward"
          @click="navigateTo('Register')"
        >
          <div class="rk-btn-shine"></div>
        </q-btn>
      </div>

      <!-- Menú Mobile -->
      <q-btn 
        class="rk-menu-btn lt-md" 
        flat 
        round 
        dense 
        @click="drawer = true"
        aria-label="Abrir menú"
      >
        <div class="rk-hamburger" :class="{ 'active': drawer }">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </q-btn>
    </q-toolbar>

    <!-- Progress Bar on Scroll -->
    <div class="rk-scroll-progress" :style="{ width: scrollProgress + '%' }"></div>

    <!-- Drawer Mobile -->
    <q-drawer 
      side="right" 
      v-model="drawer" 
      overlay 
      class="rk-drawer"
      :width="Math.min(windowWidth, 380)"
    >
      <div class="rk-drawer-bg"></div>
      
      <div class="rk-drawer-content">
        <!-- Header del Drawer -->
        <div class="rk-drawer-header">
          <div class="rk-brand">
            <div class="rk-logo rk-logo-sm">
              <div class="rk-logo-bg"></div>
              <q-icon name="bolt" class="rk-logo-icon" />
            </div>
            <div class="rk-brand-content">
              <span class="rk-brand-text">Recksy</span>
              <span class="rk-brand-tag">v2.0</span>
            </div>
          </div>
          <button 
            class="rk-close-btn"
            @click="drawer = false"
            aria-label="Cerrar menú"
          >
            <q-icon name="close" />
          </button>
        </div>

        <div class="rk-drawer-divider"></div>

        <!-- Navegación Mobile -->
        <div class="rk-drawer-nav">
          <a
            v-for="(link, index) in navLinks"
            :key="index"
            :href="link.href"
            class="rk-drawer-link"
            @click.prevent="scrollToSection(link.href); drawer = false"
          >
            <div class="rk-drawer-link-icon">
              <q-icon :name="link.icon" />
              <div class="rk-icon-glow"></div>
            </div>
            <div class="rk-drawer-link-content">
              <span class="rk-drawer-link-label">{{ link.label }}</span>
              <span class="rk-drawer-link-desc">{{ link.desc }}</span>
            </div>
            <q-icon name="chevron_right" class="rk-drawer-link-arrow" />
          </a>
        </div>

        <div class="rk-drawer-divider"></div>

        <!-- Acciones Mobile -->
        <div class="rk-drawer-actions">
          <q-btn 
            unelevated 
            no-caps 
            class="rk-btn-cta rk-btn-full" 
            label="Comenzar gratis" 
            icon-right="arrow_forward"
            @click="navigateTo('register'); drawer = false"
          >
            <div class="rk-btn-shine"></div>
          </q-btn>
          <q-btn 
            flat
            no-caps 
            class="rk-btn-ghost rk-btn-full" 
            label="Ingresar" 
            icon="login"
            @click="navigateTo('login'); drawer = false"
          />
        </div>

        <!-- Footer del Drawer -->
        <div class="rk-drawer-footer">
          <div class="rk-drawer-social">
            <a href="#" class="rk-social-link" aria-label="Twitter">
              <q-icon name="fab fa-twitter" />
            </a>
            <a href="#" class="rk-social-link" aria-label="LinkedIn">
              <q-icon name="fab fa-linkedin" />
            </a>
            <a href="#" class="rk-social-link" aria-label="GitHub">
              <q-icon name="fab fa-github" />
            </a>
          </div>
          <p class="rk-drawer-copyright">© 2024 Recksy. Todos los derechos reservados.</p>
        </div>
      </div>
    </q-drawer>
  </q-header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const drawer = ref(false)
const isScrolled = ref(false)
const scrollProgress = ref(0)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 380)

const navLinks = [
  { 
    label: 'Inicio', 
    href: '#inicio', 
    icon: 'home',
    desc: 'Página principal'
  },
  { 
    label: 'Cómo funciona', 
    href: '#como-funciona', 
    icon: 'auto_awesome',
    desc: 'Proceso simple'
  },
  { 
    label: 'Características', 
    href: '#funciones', 
    icon: 'widgets',
    desc: 'Funciones clave'
  },
  { 
    label: 'Planes', 
    href: '#planes', 
    icon: 'workspace_premium',
    desc: 'Precios y planes'
  },
  { 
    label: 'FAQ', 
    href: '#faq', 
    icon: 'help_outline',
    desc: 'Preguntas frecuentes'
  }
]

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  isScrolled.value = scrollTop > 50
  
  // Calculate scroll progress
  const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  scrollProgress.value = (scrollTop / windowHeight) * 100
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

const scrollToSection = (href) => {
  if (href === '#inicio') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  
  const element = document.querySelector(href)
  if (element) {
    const offset = 80
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    const offsetPosition = elementPosition - offset
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

const navigateTo = (routeName) => {
  router.push({ name: routeName })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleResize)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

:root {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-accent: #14b8a6;
}

/* Header Principal */
.rk-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  background: rgba(10, 14, 20, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(6, 182, 212, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Sora', -apple-system, sans-serif;
}

.rk-header.scrolled {
  background: rgba(10, 14, 20, 0.95);
  border-bottom-color: rgba(6, 182, 212, 0.15);
  box-shadow: 0 8px 32px rgba(6, 182, 212, 0.1);
}

.rk-header-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%,
    var(--color-primary) 30%,
    var(--color-accent) 70%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rk-header.scrolled .rk-header-glow {
  opacity: 0.6;
}

.rk-toolbar {
  padding: 0 clamp(1rem, 5vw, 3rem);
  min-height: 76px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Brand */
.rk-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.rk-brand:hover {
  transform: translateY(-2px);
}

.rk-logo {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-logo-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.35);
  transition: all 0.3s ease;
}

.rk-brand:hover .rk-logo-bg {
  transform: rotate(-5deg) scale(1.05);
  box-shadow: 0 12px 32px rgba(6, 182, 212, 0.5);
}

.rk-logo-icon {
  font-size: 24px !important;
  color: #fff;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s ease;
}

.rk-brand:hover .rk-logo-icon {
  transform: scale(1.1) rotate(-10deg);
}

.rk-logo-pulse {
  position: absolute;
  inset: -4px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 16px;
  opacity: 0;
  filter: blur(8px);
  animation: logoPulse 3s ease-in-out infinite;
}

@keyframes logoPulse {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.2);
  }
}

.rk-logo-sm {
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.rk-brand-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rk-brand-text {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff, var(--color-primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.rk-brand-tag {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--color-primary-light);
  text-transform: uppercase;
  opacity: 0.8;
}

/* Navegación Desktop */
.rk-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 32px;
}

.rk-nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.rk-nav-link::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(6, 182, 212, 0.08);
  border-radius: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rk-nav-link:hover {
  color: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
}

.rk-nav-link:hover::before {
  opacity: 1;
}

.rk-nav-icon {
  font-size: 18px;
  color: var(--color-primary-light);
  z-index: 1;
  transition: transform 0.3s ease;
}

.rk-nav-link:hover .rk-nav-icon {
  transform: scale(1.1);
}

.rk-nav-indicator {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 30px;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: 2px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-nav-link:hover .rk-nav-indicator {
  transform: translateX(-50%) scaleX(1);
}

/* Acciones Desktop */
.rk-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rk-btn-ghost {
  padding: 11px 24px;
  border-radius: 11px;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
  color: rgba(255, 255, 255, 0.9);
  border: 1.5px solid rgba(6, 182, 212, 0.25);
  background: rgba(6, 182, 212, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-btn-ghost:hover {
  background: rgba(6, 182, 212, 0.12);
  border-color: rgba(6, 182, 212, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.2);
}

.rk-btn-cta {
  position: relative;
  padding: 11px 28px;
  border-radius: 11px;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.rk-btn-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(6, 182, 212, 0.5);
}

.rk-btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.rk-btn-cta:hover .rk-btn-shine {
  left: 100%;
}

.rk-btn-cta .q-icon {
  transition: transform 0.3s ease;
}

.rk-btn-cta:hover .q-icon {
  transform: translateX(4px);
}

.rk-btn-full {
  width: 100%;
  padding: 14px 24px;
  justify-content: center;
}

/* Hamburger Menu Button */
.rk-menu-btn {
  position: relative;
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 10px;
  background: rgba(6, 182, 212, 0.08);
  border: 1.5px solid rgba(6, 182, 212, 0.2);
  transition: all 0.3s ease;
}

.rk-menu-btn:hover {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.3);
}

.rk-hamburger {
  width: 20px;
  height: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.rk-hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--color-primary-light);
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-hamburger.active span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.rk-hamburger.active span:nth-child(2) {
  opacity: 0;
}

.rk-hamburger.active span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* Scroll Progress */
.rk-scroll-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 0.1s ease;
  box-shadow: 0 0 10px var(--color-primary);
}

/* Drawer Mobile */
.rk-drawer {
  background: transparent !important;
  border-left: none !important;
}

.rk-drawer-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(10, 14, 20, 0.98), rgba(13, 27, 42, 0.98));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-left: 1px solid rgba(6, 182, 212, 0.15);
}

.rk-drawer-content {
  position: relative;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  z-index: 1;
}

.rk-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rk-close-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.08);
  border: 1.5px solid rgba(6, 182, 212, 0.2);
  border-radius: 10px;
  color: var(--color-primary-light);
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-close-btn:hover {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.3);
  transform: rotate(90deg);
}

.rk-close-btn .q-icon {
  font-size: 20px;
}

.rk-drawer-divider {
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(6, 182, 212, 0.2) 50%,
    transparent 100%
  );
}

/* Drawer Navigation */
.rk-drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
}

.rk-drawer-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 16px;
  background: rgba(6, 182, 212, 0.04);
  border: 1.5px solid rgba(6, 182, 212, 0.1);
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-drawer-link:hover {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.25);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.15);
}

.rk-drawer-link-icon {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-drawer-link-icon .q-icon {
  font-size: 24px;
  color: #fff;
  z-index: 1;
}

.rk-icon-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 14px;
  opacity: 0;
  filter: blur(8px);
  transition: opacity 0.3s;
}

.rk-drawer-link:hover .rk-icon-glow {
  opacity: 0.6;
}

.rk-drawer-link-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rk-drawer-link-label {
  font-size: 1.05rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.3px;
}

.rk-drawer-link-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 500;
}

.rk-drawer-link-arrow {
  font-size: 20px;
  color: rgba(6, 182, 212, 0.5);
  transition: all 0.3s ease;
}

.rk-drawer-link:hover .rk-drawer-link-arrow {
  color: var(--color-primary-light);
  transform: translateX(4px);
}

/* Drawer Actions */
.rk-drawer-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Drawer Footer */
.rk-drawer-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid rgba(6, 182, 212, 0.1);
}

.rk-drawer-social {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.rk-social-link {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.08);
  border: 1.5px solid rgba(6, 182, 212, 0.2);
  border-radius: 10px;
  color: var(--color-primary-light);
  text-decoration: none;
  transition: all 0.3s ease;
}

.rk-social-link:hover {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
}

.rk-social-link .q-icon {
  font-size: 18px;
}

.rk-drawer-copyright {
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1023px) {
  .rk-toolbar {
    min-height: 68px;
    padding: 0 1.5rem;
  }

  .rk-logo {
    width: 44px;
    height: 44px;
  }

  .rk-brand-text {
    font-size: 1.2rem;
  }
}

@media (max-width: 599px) {
  .rk-toolbar {
    min-height: 64px;
    padding: 0 1rem;
  }

  .rk-logo {
    width: 42px;
    height: 42px;
  }

  .rk-logo-icon {
    font-size: 22px !important;
  }

  .rk-brand-text {
    font-size: 1.15rem;
  }

  .rk-brand-tag {
    font-size: 0.6rem;
  }

  .rk-drawer-content {
    padding: 20px;
  }

  .rk-drawer-link {
    padding: 16px 14px;
  }

  .rk-drawer-link-icon {
    width: 44px;
    height: 44px;
  }

  .rk-drawer-link-icon .q-icon {
    font-size: 22px;
  }
}
</style>