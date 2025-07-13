<template>
  <q-page class="flex flex-center bg-grey-2 text-center">
    <div class="q-pa-md">
      <q-icon name="sentiment_dissatisfied" size="80px" color="negative" />
      <h1 class="text-h4 text-negative q-mt-sm">404 – Página no encontrada</h1>
      <p class="text-grey-7 q-mb-md">
        Lo sentimos, la página que estás buscando no existe o fue movida.
      </p>

      <q-btn
        label="Ir al inicio"
        color="primary"
        icon="home"
        @click="goHome"
        unelevated
        no-caps
      />
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

function goHome() {
  router.push('/dashboard');
}
</script>
