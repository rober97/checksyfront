<template>
  <q-header class="rk-header" elevated>
    <q-toolbar class="rk-toolbar">
      <!-- Logo y Marca -->
      <router-link  class="rk-brand">
        <div class="rk-logo">
          <q-icon name="bolt" class="rk-logo-icon" />
        </div>
        <span class="rk-brand-text">Recksy</span>
      </router-link>

      <q-space />

      <!-- Navegación Desktop -->
      <nav class="rk-nav gt-sm">
        <q-btn 
          flat 
          dense 
          class="rk-nav-link" 
          label="Inicio" 
        />
        <q-btn 
          flat 
          dense 
          class="rk-nav-link" 
          label="Cómo funciona" 
          href="#como-funciona" 
        />
        <q-btn 
          flat 
          dense 
          class="rk-nav-link" 
          label="Características" 
          href="#funciones" 
        />
        <q-btn 
          flat 
          dense 
          class="rk-nav-link" 
          label="Planes" 
          href="#planes" 
        />
        <q-btn 
          flat 
          dense 
          class="rk-nav-link" 
          label="Contacto" 
          href="#contacto" 
        />
      </nav>

      <!-- Acciones Desktop -->
      <div class="rk-actions gt-sm">
        <q-btn 
          class="rk-btn-ghost" 
          unelevated 
          no-caps 
          label="Ingresar" 
          :to="{ name: 'login' }" 
        />
        <q-btn 
          class="rk-btn-cta" 
          unelevated 
          no-caps 
          label="Comenzar" 
          :to="{ name: 'register' }" 
        />
      </div>

      <!-- Menú Mobile -->
      <q-btn 
        class="rk-menu-btn lt-md" 
        flat 
        round 
        dense 
        icon="menu" 
        @click="drawer = true"
        aria-label="Abrir menú"
      />
    </q-toolbar>

    <!-- Drawer Mobile -->
    <q-drawer 
      side="right" 
      v-model="drawer" 
      overlay 
      bordered 
      class="rk-drawer"
    >
      <div class="rk-drawer-content">
        <!-- Header del Drawer -->
        <div class="rk-drawer-header">
          <div class="rk-brand">
            <div class="rk-logo rk-logo-sm">
              <q-icon name="bolt" class="rk-logo-icon" />
            </div>
            <span class="rk-brand-text">Recksy</span>
          </div>
          <q-btn 
            flat 
            round 
            dense 
            icon="close" 
            @click="drawer = false"
            class="rk-close-btn"
          />
        </div>

        <q-separator class="rk-separator" />

        <!-- Navegación Mobile -->
        <q-list class="rk-drawer-list">
          <q-item 
            clickable 
            v-ripple 
            href="#como-funciona"
            class="rk-drawer-item"
            @click="drawer = false"
          >
            <q-item-section>
              <q-item-label class="rk-drawer-label">Cómo funciona</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" size="20px" />
            </q-item-section>
          </q-item>
          
          <q-item 
            clickable 
            v-ripple 
            href="#funciones"
            class="rk-drawer-item"
            @click="drawer = false"
          >
            <q-item-section>
              <q-item-label class="rk-drawer-label">Características</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" size="20px" />
            </q-item-section>
          </q-item>
          
          <q-item 
            clickable 
            v-ripple 
            href="#planes"
            class="rk-drawer-item"
            @click="drawer = false"
          >
            <q-item-section>
              <q-item-label class="rk-drawer-label">Planes</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" size="20px" />
            </q-item-section>
          </q-item>

          <q-item 
            clickable 
            v-ripple 
            href="#contacto"
            class="rk-drawer-item"
            @click="drawer = false"
          >
            <q-item-section>
              <q-item-label class="rk-drawer-label">Contacto</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" size="20px" />
            </q-item-section>
          </q-item>
        </q-list>

        <q-separator class="rk-separator q-my-lg" />

        <!-- Acciones Mobile -->
        <div class="rk-drawer-actions">
          <q-btn 
            class="rk-btn-cta rk-btn-full" 
            unelevated 
            no-caps 
            label="Comenzar" 
            :to="{ name: 'register' }"
            @click="drawer = false"
          />
          <q-btn 
            class="rk-btn-ghost rk-btn-full" 
            unelevated 
            no-caps 
            label="Ingresar" 
            :to="{ name: 'login' }"
            @click="drawer = false"
          />
        </div>
      </div>
    </q-drawer>
  </q-header>
</template>

<script setup>
import { ref } from 'vue'
const drawer = ref(false)
</script>

<style scoped>
/* Header Principal */
.rk-header {
  background: rgba(var(--rk-surface-rgb, 18, 18, 18), 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.rk-toolbar {
  padding: 0 clamp(1rem, 5vw, 3rem);
  min-height: 72px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Brand */
.rk-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
}

.rk-brand:hover {
  opacity: 0.85;
}

.rk-logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #221608, var(--rk-primary, #d89b27));
  box-shadow: 
    0 8px 24px rgba(216, 155, 39, 0.3),
    inset 0 0 12px rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-logo::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.rk-logo:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 32px rgba(216, 155, 39, 0.4),
    inset 0 0 16px rgba(255, 255, 255, 0.2);
}

.rk-logo-sm {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.rk-logo-icon {
  font-size: 20px !important;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.rk-brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff, #d89b27);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Navegación */
.rk-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 24px;
}

.rk-nav-link {
  font-size: 0.9375rem;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  letter-spacing: 0.2px;
  transition: all 0.2s ease;
  position: relative;
}

.rk-nav-link::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 24px;
  height: 2px;
  background: var(--rk-primary, #d89b27);
  border-radius: 2px;
  transition: transform 0.2s ease;
}

.rk-nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
}

.rk-nav-link:hover::after {
  transform: translateX(-50%) scaleX(1);
}

.rk-nav-link.router-link-active {
  color: var(--rk-primary, #d89b27);
}

/* Botones de Acción */
.rk-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rk-btn-ghost {
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: 0.3px;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.rk-btn-cta {
  padding: 10px 28px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, var(--rk-primary, #d89b27), #b8821f);
  color: #000000;
  box-shadow: 
    0 4px 16px rgba(216, 155, 39, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.rk-btn-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rk-btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(216, 155, 39, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.rk-btn-cta:hover::before {
  opacity: 1;
}

.rk-btn-full {
  width: 100%;
  padding: 14px 24px;
}

/* Menú Mobile */
.rk-menu-btn {
  color: rgba(255, 255, 255, 0.9);
}

/* Drawer */
.rk-drawer {
  background: rgba(var(--rk-surface-rgb, 18, 18, 18), 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  width: min(100%, 380px) !important;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.rk-drawer-content {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rk-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.rk-close-btn {
  color: rgba(255, 255, 255, 0.7);
}

.rk-separator {
  background: rgba(255, 255, 255, 0.08);
}

.rk-drawer-list {
  padding: 16px 0;
}

.rk-drawer-item {
  border-radius: 12px;
  padding: 16px 12px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.rk-drawer-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.rk-drawer-label {
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.rk-drawer-item .q-icon {
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.2s ease;
}

.rk-drawer-item:hover .q-icon {
  color: var(--rk-primary, #d89b27);
  transform: translateX(4px);
}

.rk-drawer-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  padding-top: 24px;
}

/* Responsive */
@media (max-width: 1023px) {
  .rk-toolbar {
    min-height: 64px;
    padding: 0 1.5rem;
  }

  .rk-logo {
    width: 38px;
    height: 38px;
  }

  .rk-brand-text {
    font-size: 1.125rem;
  }
}

@media (max-width: 599px) {
  .rk-toolbar {
    min-height: 60px;
    padding: 0 1rem;
  }

  .rk-logo {
    width: 36px;
    height: 36px;
  }

  .rk-brand-text {
    font-size: 1.0625rem;
  }
}
</style>