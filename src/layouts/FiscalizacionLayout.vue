<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-icon name="gavel" size="28px" class="q-mr-sm" />
        <q-toolbar-title>
          Recksy — Portal de fiscalización
          <div class="text-caption text-grey-3">Prestador: Recksy · {{ appVersion }} · Dirección del Trabajo, Chile</div>
        </q-toolbar-title>
        <q-space />
        <q-chip v-if="portal.company" color="white" text-color="primary" dense icon="apartment">
          {{ portal.company.name }}
        </q-chip>
        <q-btn
          v-if="portal.isAuthenticated"
          flat dense icon="logout"
          label="Salir"
          @click="doLogout"
        />
      </q-toolbar>
      <q-tabs v-if="portal.hasCompany" align="left" inline-label no-caps class="bg-primary">
        <q-route-tab to="/fiscalizacion/reportes" icon="download" label="Reportes DT" />
        <q-btn flat dense no-caps icon="arrow_back" label="Elegir otro empleador" class="q-ml-md" @click="changeCompany" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-grey-2 text-grey-8">
      <div class="text-center q-py-sm text-caption">
        Acceso conforme a Res. Ex. N°38/2024 del Ministerio del Trabajo — Art. 33 CT · Recksy {{ appVersion }}
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useDtPortalStore } from '@/stores/dtPortalStore'

const portal = useDtPortalStore()
const router = useRouter()
// Art. 17 c): la versión del software debe figurar de forma destacada.
const appVersion = `v${import.meta.env?.VITE_APP_VERSION || '0.1.0'}`

function doLogout() {
  portal.clearSession()
  router.push('/fiscalizacion')
}

function changeCompany() {
  portal.clearCompany()
  router.push('/fiscalizacion/empresas')
}
</script>
