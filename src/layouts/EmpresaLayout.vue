<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header superior -->
    <Header @toggle-drawer="toggleDrawer" />

    <!-- Drawer lateral -->
    <Drawer v-model="drawerOpen" />


    <!-- Contenido principal -->
    <q-page-container class="bg-grey-2">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import Drawer from '@/components/Drawer.vue';
import Header from '@/components/Header.vue';
import UserAvatarMenu from '@/components/UserAvatarMenu.vue';

// Simula nombre empresa activa
const empresaActiva = ref({ nombre: 'Empresa Ejemplo S.A.' });
const drawerOpen = ref(true);

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}
</script>
