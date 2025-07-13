<template>
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>

      <!-- Botón de menú lateral -->
      <q-btn flat dense round icon="menu" aria-label="Menu" @click="$emit('toggle-drawer')" />

      <!-- Título -->
      <q-toolbar-title>Checksy</q-toolbar-title>

      <!-- Avatar con menú desplegable -->
      <q-btn round flat dense>
        <q-avatar>
          <q-icon name="person" />
        </q-avatar>

        <!-- Menú al hacer clic -->
        <UserAvatarMenu />
      </q-btn>
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import UserAvatarMenu from '@/components/UserAvatarMenu.vue';
const router = useRouter();

function logout() {
  localStorage.removeItem('token');
  router.push('/login');
}
</script>
