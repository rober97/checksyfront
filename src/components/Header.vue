<template>
  <q-header elevated :class="headerClass">
    <q-toolbar>

      <!-- Botón de menú lateral -->
      <q-btn flat dense round icon="menu" aria-label="Menu" @click="$emit('toggle-drawer')" />

      <!-- Título -->
      <q-toolbar-title>Checksy</q-toolbar-title>

      <!-- 🌙 Toggle Modo Oscuro -->
      <q-toggle
        v-model="isDark"
        color="white"
        icon="dark_mode"
        size="sm"
        dense
        @update:model-value="toggleDark"
        class="q-mr-sm"
      />

      <!-- Avatar con menú desplegable -->
      <q-btn round flat dense>
        <UserAvatarMenu />
      </q-btn>

    </q-toolbar>
  </q-header>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Dark } from 'quasar'
import UserAvatarMenu from '@/components/UserAvatarMenu.vue'
import { useThemeClasses } from '@/utils/themeClasses'
import { useThemeStore } from '@/stores/themeStore'

const router = useRouter()
const isDark = ref(false)
const themeStore = useThemeStore()
// Clases globales para el header
const { headerClass } = useThemeClasses()

onMounted(() => {
  const savedPreference = localStorage.getItem('darkMode')
  if (savedPreference !== null) {
    isDark.value = savedPreference === 'true'
    themeStore.isDark = savedPreference === 'true'
    Dark.set(isDark.value)
  } else {
    isDark.value = Dark.isActive
    localStorage.setItem('darkMode', String(Dark.isActive))
  }
})

function toggleDark(val) {
  themeStore.isDark = val
  Dark.set(val)
  localStorage.setItem('darkMode', String(val))
}

function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

