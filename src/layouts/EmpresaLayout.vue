<template>
  <q-layout view="hHh lpR fFf" class="rk-shell-layout">
    <!-- Header superior -->
    <Header @toggle-drawer="toggleDrawer" />

    <!-- Drawer lateral -->
    <Drawer v-model="drawerOpen" />


    <!-- Contenido principal -->
    <q-page-container :class="pageContainerClass">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import Drawer from '@/components/Drawer.vue';
import Header from '@/components/Header.vue';
import UserAvatarMenu from '@/components/UserAvatarMenu.vue';
import { useThemeClasses } from '@/utils/themeClasses';

// Simula nombre empresa activa
const empresaActiva = ref({ nombre: 'Empresa Ejemplo S.A.' });
const drawerOpen = ref(true);

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

const { pageContainerClass } = useThemeClasses();
</script>
