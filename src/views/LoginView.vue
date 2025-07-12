<template>
    <div class="flex justify-center items-center h-screen">
      <div class="w-96 p-8 bg-white shadow-md rounded-lg">
        <h2 class="text-center text-xl font-semibold mb-4">Iniciar sesión</h2>
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="email" class="block">Correo electrónico</label>
            <input
              type="email"
              v-model="email"
              id="email"
              class="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div class="mb-4">
            <label for="password" class="block">Contraseña</label>
            <input
              type="password"
              v-model="password"
              id="password"
              class="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            class="w-full bg-blue-500 text-white p-2 rounded-md"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { loginUser } from '@/stores/authStore.js'; // Asegúrate de tener esta función en tu store
  
  export default {
    setup() {
      const router = useRouter();
      const email = ref('');
      const password = ref('');
  
      const handleLogin = async () => {
        try {
          const response = await loginUser({ email: email.value, password: password.value });
          localStorage.setItem('token', response.data.token);
          router.push('/dashboard');
        } catch (error) {
          alert('Credenciales incorrectas');
        }
      };
  
      return { email, password, handleLogin };
    },
  };
  </script>
  
  <style scoped>
  /* Estilos personalizados aquí */
  </style>
  