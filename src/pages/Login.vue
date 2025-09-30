<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-lg shadow-4" style="width: 100%; max-width: 420px">
      <q-card-section class="text-center">
        <div class="text-h5 text-primary">Iniciar sesiónn</div>
        <div class="text-subtitle2 text-grey-7">Bienvenido a Recksy</div>
      </q-card-section>

      <q-form @submit.prevent="handleLogin" class="q-gutter-md" greedy>
        <q-card-section class="q-gutter-md">
          <q-input
            ref="emailRef"
            v-model="email"
            label="Correo electrónico"
            type="email"
            autocomplete="email"
            filled
            clearable
            :disable="loading"
            :rules="[rules.required, rules.email]"
            @keydown.enter.prevent="focusPassword"
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            ref="passwordRef"
            v-model="password"
            :type="showPwd ? 'text' : 'password'"
            label="Contraseña"
            autocomplete="current-password"
            filled
            :disable="loading"
            :rules="[rules.required, rules.minPwd]"
            @keyup="onPasswordKeyUp"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
            <template #append>
              <q-icon
                :name="showPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPwd = !showPwd"
              />
            </template>
            <template #hint>
              <span v-if="capsOn" class="text-negative"
                >Caps Lock activado</span
              >
            </template>
          </q-input>

          <div class="row items-center justify-between q-mt-sm">
            <q-toggle
              v-model="remember"
              :disable="loading"
              label="Recordarme"
            />
            <q-btn
              flat
              dense
              :disable="loading"
              label="¿Olvidaste tu contraseña?"
              @click="forgotPassword"
            />
          </div>

          <q-banner
            v-if="formError"
            class="bg-red-2 text-negative q-my-sm"
            rounded
            dense
          >
            {{ formError }}
          </q-banner>
        </q-card-section>

        <q-card-actions>
          <q-btn
            type="submit"
            color="primary"
            class="full-width"
            unelevated
            :loading="loading"
            :disable="loading"
            label="Ingresar"
          />
        </q-card-actions>
      </q-form>

      <q-card-section class="text-center text-caption q-mt-sm">
        ¿No tienes cuenta?
        <q-btn
          flat
          dense
          size="sm"
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

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

// ------- UI State -------
const email = ref(localStorage.getItem("last_email") || "");
const password = ref("");
const remember = ref(!!localStorage.getItem("last_email"));
const loading = ref(false);
const formError = ref("");
const showPwd = ref(false);
const capsOn = ref(false);

// ------- Refs para enfoque -------
const emailRef = ref(null);
const passwordRef = ref(null);

// ------- Validaciones -------
const rules = {
  required: (v) => !!String(v || "").trim() || "Campo requerido",
  email: (v) => {
    const s = String(v || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || "Email inválido";
  },
  minPwd: (v) => String(v || "").length >= 6 || "Mínimo 6 caracteres",
};

// ------- Utilidades -------
const isInternalPath = (p) =>
  typeof p === "string" && p.startsWith("/") && !p.startsWith("//");
const safeRedirectOf = (to) => {
  const raw = to?.query?.redirect;
  if (!raw) return null;
  let val = String(raw);
  try {
    val = decodeURIComponent(val);
  } catch {}
  return isInternalPath(val) ? val : null;
};
const roleHome = (role) => {
  switch (String(role || "").toLowerCase()) {
    case "admin":
      return "/admin/dashboard";
    case "empresa":
      return "/company/dashboard";
    case "empleado":
      return "/employee/dashboard";
    default:
      return "/";
  }
};
const normalizeErr = (err) => {
  const msg =
    err?.response?.data?.message || err?.message || "Error de servidor";
  return String(msg).replace(/^Error:\s*/i, "");
};

// ------- UX helpers -------
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

// ------- Submit principal -------
async function handleLogin() {
  formError.value = "";

  const emailOk =
    rules.required(email.value) === true && rules.email(email.value) === true;
  const pwdOk =
    rules.required(password.value) === true &&
    rules.minPwd(password.value) === true;
  if (!emailOk || !pwdOk) {
    formError.value = "Revisa los campos del formulario.";
    return;
  }

  if (!navigator.onLine) {
    formError.value = "Sin conexión a internet.";
    console.log('Estas sin coenxion')
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

    const dest = safeRedirectOf(route) || roleHome(auth.role);
    await router.replace(dest);

    console.log('Iniciado')
  } catch (err) {
    const msg = normalizeErr(err);
    formError.value = msg;
    console.log('Iniciado')
  } finally {
    loading.value = false;
  }
}

// ------- Enfoque inicial -------
onMounted(async () => {
  await nextTick();
  if (!email.value) {
    emailRef.value?.focus?.();
  } else {
    passwordRef.value?.focus?.();
  }
});
</script>

<style scoped>
/* Ajustes pequeños de espaciado/legibilidad */
.q-banner {
  line-height: 1.2;
}
</style>
