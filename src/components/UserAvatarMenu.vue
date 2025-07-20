<template>
  <q-btn round flat dense>
    <q-avatar>
      <q-icon name="person" />
    </q-avatar>

    <q-menu anchor="bottom right" self="top right">
      <q-list style="min-width: 180px">
        <q-item-label header>Usuario</q-item-label>

        <q-item clickable v-ripple @click="goToPerfil">
          <q-item-section avatar>
            <q-icon name="account_circle" />
          </q-item-section>
          <q-item-section>Perfil</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="goToConfig">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>Configuración</q-item-section>
        </q-item>

        <q-item v-if="canSwitchEmpresa" clickable v-ripple @click="goToEmpresas">
          <q-item-section avatar>
            <q-icon name="business" />
          </q-item-section>
          <q-item-section>Mis Empresas</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable v-ripple @click="logout">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>Cerrar sesión</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();
const canSwitchEmpresa = ref(true); // simula si el usuario tiene varias empresas

function goToPerfil() {
  router.push('/perfil');
}

function goToConfig() {
  router.push('/user/configuration');
}

function goToEmpresas() {
  router.push('/admin/companies');
}

function logout() {
  localStorage.removeItem('token');
  router.push('/login');
}
</script>
