<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header superior -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleDrawer" aria-label="Menu" />
        <q-toolbar-title>Mi Cuenta</q-toolbar-title>
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
        <q-item-label header>Menú</q-item-label>

        <q-item clickable v-ripple to="/empleado/dashboard" exact>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Inicio</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empleado/asistencia">
          <q-item-section avatar>
            <q-icon name="how_to_reg" />
          </q-item-section>
          <q-item-section>Marcar asistencia</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empleado/historial">
          <q-item-section avatar>
            <q-icon name="history" />
          </q-item-section>
          <q-item-section>Mi historial</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empleado/solicitudes">
          <q-item-section avatar>
            <q-icon name="request_quote" />
          </q-item-section>
          <q-item-section>Solicitudes</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empleado/documentos">
          <q-item-section avatar>
            <q-icon name="description" />
          </q-item-section>
          <q-item-section>Mis documentos</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/empleado/perfil">
          <q-item-section avatar>
            <q-icon name="person" />
          </q-item-section>
          <q-item-section>Perfil</q-item-section>
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

const drawerOpen = ref(false);

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}
</script>
