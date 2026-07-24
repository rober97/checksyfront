<template>
  <q-layout view="lHh Lpr lFf">
    <!-- La barra del ambiente de prueba se monta dentro del Header compartido
         (components/Header.vue), no acá: ahí forma parte del QHeader y Quasar
         descuenta su alto del contenido. Colgada de este layout quedaría por
         fuera del cálculo y sumaría scroll a todas las pantallas. -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { watch } from 'vue'
import { useCompanyTheme } from '@/composables/useCompanyTheme'
import { useAuthStore } from '@/stores/authStore'
import { useDemoStore } from '@/stores/demoStore'

// Tinte global del accent según la empresa activa.
useCompanyTheme()

const auth = useAuthStore()
const demo = useDemoStore()

// Se consulta el estado de la demo cuando ya hay sesión, y se vuelve a consultar
// al cambiar de identidad ("ver como trabajador" cambia el user.id).
watch(
  () => auth.user?.id,
  (id) => {
    if (id) demo.fetch({ force: true })
    else demo.$reset()
  },
  { immediate: true }
)
</script>
