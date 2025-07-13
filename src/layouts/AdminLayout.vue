<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header superior -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleDrawer" aria-label="Menu" />
        <q-toolbar-title>Panel Administrativo</q-toolbar-title>
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
        <q-item-label header>Administración</q-item-label>

        <q-item clickable v-ripple to="/admin/dashboard" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/companies">
          <q-item-section avatar>
            <q-icon name="business" />
          </q-item-section>
          <q-item-section>Empresas</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/users">
          <q-item-section avatar>
            <q-icon name="supervisor_account" />
          </q-item-section>
          <q-item-section>Usuarios</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/permissions">
          <q-item-section avatar>
            <q-icon name="lock" />
          </q-item-section>
          <q-item-section>Permisos</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/reportes">
          <q-item-section avatar>
            <q-icon name="bar_chart" />
          </q-item-section>
          <q-item-section>Reportes</q-item-section>
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

const drawerOpen = ref(true);

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}
</script>
