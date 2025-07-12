<template>
    <nav class="bg-white shadow-md px-6 py-3 flex justify-between items-center">
      <div class="text-xl font-semibold">Asistencia Admin</div>
      <div class="space-x-4">
        <router-link to="/dashboard" class="text-blue-600 hover:underline">Dashboard</router-link>
        <router-link to="/employees" class="text-blue-600 hover:underline">Empleados</router-link>
        <router-link to="/attendance" class="text-blue-600 hover:underline">Asistencias</router-link>
        <button @click="logout" class="ml-4 text-red-600 hover:underline">Cerrar sesión</button>
      </div>
    </nav>
  </template>
  
  <script>
  import { useRouter } from 'vue-router'
  
  export default {
    setup() {
      const router = useRouter()
  
      const logout = () => {
        localStorage.removeItem('token')
        router.push('/')
      }
  
      return { logout }
    }
  }
  </script>
  
  <style scoped>
  nav {
    position: sticky;
    top: 0;
    z-index: 10;
  }
  </style>
  