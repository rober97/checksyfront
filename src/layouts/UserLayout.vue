<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header superior -->
    <Header @toggle-drawer="toggleDrawer" />

    <!-- Drawer lateral -->
    <Drawer :modelValue="drawerOpen" :mini-state="!drawerOpen" />

    <!-- Contenido principal con clases dinámicas -->
    <q-page-container :class="pageContainerClass">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import Drawer from '@/components/Drawer.vue';
import Header from '@/components/Header.vue';
import { useThemeClasses } from '@/utils/themeClasses';

const drawerOpen = ref(true);
function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

// Traemos clase global para el fondo del layout
const { pageContainerClass } = useThemeClasses();
</script>
