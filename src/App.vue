<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useCompanyTheme } from '@/composables/useCompanyTheme'

// Tinte global del accent según la empresa activa.
useCompanyTheme()
</script>
