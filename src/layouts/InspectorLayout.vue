<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-icon name="gavel" size="28px" class="q-mr-sm" />
        <q-toolbar-title>
          Recksy — Panel Fiscalizador DT
          <div class="text-caption text-grey-3">Dirección del Trabajo · Chile</div>
        </q-toolbar-title>
        <q-space />
        <q-chip
          :color="accessBadgeColor"
          text-color="white"
          dense
          :icon="accessBadgeIcon"
        >
          {{ accessBadgeLabel }}
        </q-chip>
        <q-btn
          v-if="auth.isAuthenticated"
          flat dense icon="logout"
          label="Salir"
          @click="doLogout"
        />
      </q-toolbar>
      <q-tabs align="left" inline-label no-caps class="bg-primary">
        <q-route-tab to="/inspector/dashboard" icon="dashboard" label="Dashboard" />
        <q-route-tab to="/inspector/attendance" icon="fact_check" label="Asistencias" />
        <q-route-tab to="/inspector/audit" icon="history" label="Bitácora" />
        <q-route-tab to="/inspector/reports" icon="download" label="Reportes DT" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-grey-2 text-grey-8">
      <div class="text-center q-py-sm text-caption">
        Acceso conforme a Res. Ex. N°38/2024 del Ministerio del Trabajo — Art. 33 CT
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const accessBadgeLabel = computed(() => {
  const access = auth.user?.access
  if (access === 'ip') return 'Acceso red DT'
  if (access === 'token') return 'Token externo'
  return 'Fiscalizador DT'
})
const accessBadgeColor = computed(() =>
  auth.user?.access === 'ip' ? 'positive' : 'amber-8'
)
const accessBadgeIcon = computed(() =>
  auth.user?.access === 'ip' ? 'verified_user' : 'key'
)

async function doLogout() {
  try { await auth.logout() } catch {}
  router.push('/login')
}
</script>
