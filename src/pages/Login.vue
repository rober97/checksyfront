<template>
  <q-page class="flex flex-center" :class="dark.isActive ? 'bg-gradient-dark' : 'bg-gradient-light'">
    <q-card class="login-card">
      <!-- Header -->
      <q-card-section class="text-center q-pb-md">
        <div class="text-h5 text-primary text-bold">Iniciar Sesión</div>
        <div class="text-subtitle2 text-grey">Bienvenido a <b>Recksy</b></div>
      </q-card-section>

      <!-- Form -->
      <q-form @submit.prevent="handleLogin" class="q-gutter-md q-pa-md">
        <q-input
          ref="emailRef"
          v-model="email"
          label="Correo electrónico"
          type="email"
          autocomplete="email"
          outlined
          dense
          clearable
          :disable="loading"
          :rules="[rules.required, rules.email]"
          :color="dark.isActive ? 'blue-4' : 'primary'"
          @keydown.enter.prevent="focusPassword"
        >
          <template #prepend>
            <q-icon name="email" color="primary" />
          </template>
        </q-input>

        <q-input
          ref="passwordRef"
          v-model="password"
          :type="showPwd ? 'text' : 'password'"
          label="Contraseña"
          autocomplete="current-password"
          outlined
          dense
          :disable="loading"
          :rules="[rules.required, rules.minPwd]"
          :color="dark.isActive ? 'blue-4' : 'primary'"
          @keyup="onPasswordKeyUp"
        >
          <template #prepend>
            <q-icon name="lock" color="primary" />
          </template>
          <template #append>
            <q-icon
              :name="showPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              color="grey"
              @click="showPwd = !showPwd"
            />
          </template>
          <template #hint>
            <span v-if="capsOn" class="text-negative text-bold">
              ⚠ Caps Lock activado
            </span>
          </template>
        </q-input>

        <!-- Opciones -->
        <div class="row items-center justify-between q-mt-sm">
          <q-toggle v-model="remember" :disable="loading" label="Recordarme" />
          <q-btn
            flat
            dense
            size="sm"
            color="primary"
            :disable="loading"
            label="¿Olvidaste tu contraseña?"
            @click="forgotPassword"
          />
        </div>

        <!-- Error -->
        <transition name="fade">
          <q-banner
            v-if="formError"
            class="bg-red-2 text-negative q-pa-sm rounded-borders"
            dense
          >
            <q-icon name="error" color="negative" class="q-mr-sm" />
            {{ formError }}
          </q-banner>
        </transition>

        <!-- Botón principal -->
        <q-btn
          type="submit"
          color="primary"
          class="full-width q-mt-md login-btn"
          unelevated
          :loading="loading"
          :disable="loading"
          label="Ingresar"
        />
      </q-form>

      <!-- Footer -->
      <q-card-section class="text-center text-caption q-mt-sm"
                      :class="dark.isActive ? 'text-grey-4' : 'text-grey-7'">
        ¿No tienes cuenta?
        <q-btn
          flat
          dense
          size="sm"
          color="secondary"
          label="Contacta a soporte"
          @click="soporte"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useQuasar } from "quasar";

const { dark } = useQuasar();

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const email = ref(localStorage.getItem("last_email") || "");
const password = ref("");
const remember = ref(!!localStorage.getItem("last_email"));
const loading = ref(false);
const formError = ref("");
const showPwd = ref(false);
const capsOn = ref(false);

const emailRef = ref(null);
const passwordRef = ref(null);

const rules = {
  required: (v) => !!String(v || "").trim() || "Campo requerido",
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim()) || "Email inválido",
  minPwd: (v) => String(v || "").length >= 6 || "Mínimo 6 caracteres",
};

function focusPassword() {
  passwordRef.value?.focus?.();
}
function forgotPassword() {
  console.log("Contacta a soporte para recuperar tu acceso.")
}
function soporte() {
  window.open("mailto:soporte@recksy.cl", "_blank");
}
function onPasswordKeyUp(e) {
  capsOn.value = e.getModifierState && e.getModifierState("CapsLock");
}

async function handleLogin() {
  formError.value = "";
  const emailOk = rules.required(email.value) === true && rules.email(email.value) === true;
  const pwdOk = rules.required(password.value) === true && rules.minPwd(password.value) === true;
  if (!emailOk || !pwdOk) {
    formError.value = "Revisa los campos del formulario.";
    return;
  }
  if (!navigator.onLine) {
    formError.value = "Sin conexión a internet.";
    return;
  }
  if (loading.value) return;

  loading.value = true;
  try {
    await auth.login({ email: email.value.trim(), password: password.value });
    if (remember.value) {
      localStorage.setItem("last_email", email.value.trim());
    } else {
      localStorage.removeItem("last_email");
    }
    const dest = "/";
    await router.replace(dest);
  } catch (err) {
    formError.value = err?.response?.data?.message || err?.message || "Error de servidor";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await nextTick();
  if (!email.value) emailRef.value?.focus?.();
  else passwordRef.value?.focus?.();
});
</script>

<style scoped>
/* Fondos elegantes */
.bg-gradient-light {
  background: linear-gradient(135deg, #f4f6f9, #dce3ea);
}
.bg-gradient-dark {
  background: linear-gradient(135deg, #1a1c1f, #2a2d31);
}

/* Card con glassmorphism */
.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  padding: 0.5rem;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.85);
  animation: fadeInUp 0.5s ease;
}
body.body--dark .login-card {
  background: rgba(30, 30, 30, 0.85);
}

/* Botón principal */
.login-btn {
  border-radius: 10px;
  font-weight: 600;
}
.login-btn:hover {
  transform: scale(1.02);
  transition: transform 0.2s;
}

/* Animaciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
