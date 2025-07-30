<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-lg shadow-4" style="width: 100%; max-width: 400px">
      <q-card-section class="text-center">
        <div class="text-h5 text-primary">Iniciar sesión</div>
        <div class="text-subtitle2 text-grey">Bienvenido a Recksy</div>
      </q-card-section>

      <q-form @submit.prevent="handleLogin" class="q-gutter-md">
        <q-card-section>
          <q-input
            v-model="email"
            label="Correo electrónico"
            type="email"
            filled
            lazy-rules
            :rules="[val => !!val || 'Campo requerido']"
          />

          <q-input
            v-model="password"
            label="Contraseña"
            type="password"
            filled
            lazy-rules
            :rules="[val => !!val || 'Campo requerido']"
          />
        </q-card-section>

        <q-card-actions>
          <q-btn
            type="submit"
            label="Ingresar"
            color="primary"
            class="full-width"
            :loading="loading"
            unelevated
          />
        </q-card-actions>
      </q-form>

      <q-card-section class="text-center text-caption q-mt-sm">
        ¿No tienes cuenta? <q-btn flat dense size="sm" label="Contacta a soporte" @click="soporte" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore'; // Asegúrate de tener el store

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);

async function handleLogin() {
  if (!email.value || !password.value) return;

  try {
    loading.value = true;
    await authStore.login({ email: email.value, password: password.value });

    const role = localStorage.getItem('role'); // o authStore.user.role si lo tienes ahí

    if (role === 'Administrador') {
      router.push('/admin/dashboard');
    } else if (role === 'Empresa') {
      router.push('/empresa/dashboard');
    } else if (role === 'Empleado') {
      router.push('/empleado/dashboard');
    } else {
      router.push('/'); // por si acaso
    }

  } catch (err) {
    $q.notify({ type: 'negative', message: 'Credenciales incorrectas' });
  } finally {
    loading.value = false;
  }
}


function soporte() {
  window.open('mailto:soporte@Recksy.cl', '_blank');
}
</script>
