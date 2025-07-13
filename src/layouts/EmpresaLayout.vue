<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header superior -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleDrawer" aria-label="Menu" />
        <q-toolbar-title>{{ empresaActiva?.nombre || 'Empresa' }}</q-toolbar-title>
        <UserAvatarMenu />
      </q-toolbar>
    </q-header>

    <!-- Drawer lateral -->
    <q-drawer
      v-model="drawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-1"
    >
      <q-list padding>
        <q-item-label header>Gestión</q-item-label>

        <q-item clickable v-ripple to="/empresa/dashboard" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empresa/empleados">
          <q-item-section avatar>
            <q-icon name="badge" />
          </q-item-section>
          <q-item-section>Empleados</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empresa/asistencia">
          <q-item-section avatar>
            <q-icon name="event" />
          </q-item-section>
          <q-item-section>Asistencia</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empresa/solicitudes">
          <q-item-section avatar>
            <q-icon name="request_page" />
          </q-item-section>
          <q-item-section>Solicitudes</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empresa/documentos">
          <q-item-section avatar>
            <q-icon name="folder" />
          </q-item-section>
          <q-item-section>Documentos</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empresa/configuracion">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>Configuración</q-item-section>
        </q-item>

      </q-list>
    </q-drawer>

    <!-- Contenido principal -->
    <q-page-container class="bg-grey-2">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import UserAvatarMenu from '@/components/UserAvatarMenu.vue';

// Simula nombre empresa activa
const empresaActiva = ref({ nombre: 'Empresa Ejemplo S.A.' });
const drawerOpen = ref(true);

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}
</script>
