<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-lg shadow-4" style="width: 100%; max-width: 500px">
      <q-card-section class="text-center">
        <div class="text-h5 text-primary">Crear cuenta</div>
        <div class="text-subtitle2 text-grey">Registra tu empresa y comienza con Checksy</div>
      </q-card-section>

      <q-form @submit.prevent="handleRegister" class="q-gutter-md">
        <q-card-section>

          <q-input
            v-model="empresa"
            label="Nombre de la empresa"
            filled
            :rules="[val => !!val || 'Campo requerido']"
          />

          <q-input
            v-model="nombre"
            label="Nombre completo"
            filled
            :rules="[val => !!val || 'Campo requerido']"
          />

          <q-input
            v-model="email"
            label="Correo electrónico"
            type="email"
            filled
            :rules="[val => !!val || 'Campo requerido']"
          />

          <q-input
            v-model="password"
            label="Contraseña"
            type="password"
            filled
            :rules="[val => !!val || 'Campo requerido']"
          />

          <q-input
            v-model="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            filled
            :rules="[
              val => !!val || 'Campo requerido',
              val => val === password || 'Las contraseñas no coinciden',
            ]"
          />
        </q-card-section>

        <q-card-actions>
          <q-btn
            type="submit"
            label="Registrarse"
            color="primary"
            class="full-width"
            :loading="loading"
            unelevated
          />
        </q-card-actions>
      </q-form>

      <q-card-section class="text-center text-caption q-mt-sm">
        ¿Ya tienes cuenta?
        <q-btn flat dense size="sm" label="Iniciar sesión" @click="goToLogin" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const empresa = ref('');
const nombre = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);

async function handleRegister() {
  if (!empresa.value || !nombre.value || !email.value || !password.value || password.value !== confirmPassword.value) {
    return;
  }

  try {
    loading.value = true;

    // Simula registro
    const res = await axios.post('/api/register', {
      empresa: empresa.value,
      nombre: nombre.value,
      email: email.value,
      password: password.value,
    });

    $q.notify({ type: 'positive', message: 'Registro exitoso. Ahora puedes iniciar sesión.' });
    router.push('/login');
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error al registrar. Intenta nuevamente.' });
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  router.push('/login');
}
</script>
