<template>
  <q-btn
    round
    flat
    dense
    aria-label="Menú de usuario"
    :loading="loggingOut"
  >
    <q-avatar>
      <q-icon name="person" />
    </q-avatar>

    <q-menu v-model="menu" anchor="bottom right" self="top right">
      <q-list style="min-width: 200px">
        <q-item-label header>Usuario</q-item-label>

        <q-item clickable v-close-popup v-ripple :disable="loggingOut" @click="goToPerfil">
          <q-item-section avatar><q-icon name="account_circle" /></q-item-section>
          <q-item-section>Perfil</q-item-section>
        </q-item>

        <q-item clickable v-close-popup v-ripple :disable="loggingOut" @click="goToConfig">
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>Configuración</q-item-section>
        </q-item>

        <q-item v-if="canSwitchEmpresa" clickable v-close-popup v-ripple :disable="loggingOut" @click="goToEmpresas">
          <q-item-section avatar><q-icon name="business" /></q-item-section>
          <q-item-section>Mis Empresas</q-item-section>
        </q-item>

        <q-separator />

        <q-item
          clickable
          v-close-popup
          v-ripple
          :disable="loggingOut"
          @click="confirmLogout"
        >
          <q-item-section avatar>
            <q-icon :name="loggingOut ? 'hourglass_empty' : 'logout'" />
          </q-item-section>
          <q-item-section>
            <div class="row items-center no-wrap">
              <span class="q-mr-sm">{{ loggingOut ? 'Cerrando…' : 'Cerrar sesión' }}</span>
              <q-spinner v-if="loggingOut" size="16px" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()
const auth = useAuthStore()

const menu = ref(false)
const loggingOut = ref(false)
const canSwitchEmpresa = ref(true) // ajusta según tu lógica real

function goToPerfil () {
  router.push({ path: '/configuration', query: { tab: 'profile' } })
}
function goToConfig () {
  router.push({ path: '/configuration', query: { tab: 'preferences' } })
}
function goToEmpresas () {
  router.push('/admin/companies')
}

function confirmLogout () {
  $q.dialog({
    title: 'Cerrar sesión',
    message: '¿Seguro que quieres salir?',
    cancel: true,
    persistent: true
  }).onOk(doLogout)
}

async function doLogout () {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await auth.logout(true) // revoca cookie refresh en backend si aplica
    console.log('Sesión cerrada')
    await router.replace('/login') // replace para evitar volver con Back
  } catch (e) {
    // el store ya limpia estado en finally; informamos y redirigimos
    console.log('Sesión cerrada localmente')
    await router.replace('/login')
  } finally {
    loggingOut.value = false
    menu.value = false
  }
}
</script>
