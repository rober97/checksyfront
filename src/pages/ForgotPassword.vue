<template>
  <q-page class="rk-fp q-pa-md" :class="isDark ? 'rk-bg--dark' : 'rk-bg--light'">
    <div class="rk-center">
      <q-card class="fp-card" flat bordered>
        <!-- Header -->
        <q-card-section class="text-center q-pt-lg q-pb-md">
          <div class="rk-logo-wrap">
            <div class="rk-logo">
              <q-icon :name="step === 1 ? 'lock_reset' : 'vpn_key'" />
            </div>
          </div>
          <div class="text-h5 text-weight-bold q-mt-sm">
            {{ step === 1 ? "Recuperar contraseña" : "Restablecer contraseña" }}
          </div>
          <div class="text-subtitle2 rk-muted">
            {{
              step === 1
                ? "Te enviaremos un código de 6 dígitos a tu correo."
                : "Revisa tu correo e ingresa el código que te enviamos."
            }}
          </div>
        </q-card-section>

        <!-- ===== Paso 1: pedir el código ===== -->
        <q-form
          v-if="step === 1"
          @submit.prevent="onRequest"
          class="q-gutter-md q-px-lg q-pb-md"
        >
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
            :color="isDark ? 'blue-4' : 'primary'"
          >
            <template #prepend>
              <q-icon name="mail" color="primary" />
            </template>
          </q-input>

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

          <q-btn
            type="submit"
            color="primary"
            class="full-width q-mt-sm fp-btn"
            unelevated
            :loading="loading"
            :disable="loading"
          >
            <q-icon left name="send" />
            ENVIAR CÓDIGO
          </q-btn>

          <div class="text-center q-mt-xs">
            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              label="Ya tengo un código"
              :disable="loading"
              @click="step = 2"
            />
          </div>
        </q-form>

        <!-- ===== Paso 2: código + nueva contraseña ===== -->
        <q-form
          v-else
          @submit.prevent="onReset"
          class="q-gutter-md q-px-lg q-pb-md"
        >
          <q-input
            v-model="email"
            label="Correo electrónico"
            type="email"
            autocomplete="email"
            outlined
            dense
            :disable="loading"
            :rules="[rules.required, rules.email]"
            :color="isDark ? 'blue-4' : 'primary'"
          >
            <template #prepend>
              <q-icon name="mail" color="primary" />
            </template>
          </q-input>

          <q-input
            v-model="code"
            label="Código de verificación"
            mask="######"
            unmasked-value
            inputmode="numeric"
            outlined
            dense
            :disable="loading"
            :rules="[rules.code]"
            :color="isDark ? 'blue-4' : 'primary'"
            hint="6 dígitos"
          >
            <template #prepend>
              <q-icon name="pin" color="primary" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :type="showPwd ? 'text' : 'password'"
            label="Nueva contraseña"
            autocomplete="new-password"
            outlined
            dense
            :disable="loading"
            :rules="[rules.required, rules.minPwd]"
            :color="isDark ? 'blue-4' : 'primary'"
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
          </q-input>

          <!-- Fuerza de contraseña -->
          <div class="row items-center justify-between q-gutter-xs">
            <q-linear-progress
              :value="pwdStrength.pct"
              rounded
              :color="pwdStrength.color"
              class="col-grow rk-pwd-meter"
            />
            <div
              class="text-caption rk-muted q-ml-sm"
              style="min-width: 64px; text-align: right"
            >
              {{ pwdStrength.label }}
            </div>
          </div>

          <q-input
            v-model="confirm"
            :type="showPwd ? 'text' : 'password'"
            label="Confirmar contraseña"
            autocomplete="new-password"
            outlined
            dense
            :disable="loading"
            :rules="[rules.required, rules.match]"
            :color="isDark ? 'blue-4' : 'primary'"
          >
            <template #prepend>
              <q-icon name="lock" color="primary" />
            </template>
          </q-input>

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

          <q-btn
            type="submit"
            color="primary"
            class="full-width q-mt-sm fp-btn"
            unelevated
            :loading="loading"
            :disable="loading"
          >
            <q-icon left name="check" />
            RESTABLECER CONTRASEÑA
          </q-btn>

          <div class="row items-center justify-between q-mt-xs">
            <q-btn
              flat
              dense
              size="sm"
              color="grey-7"
              icon="arrow_back"
              label="Volver"
              :disable="loading"
              @click="step = 1"
            />
            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              label="Reenviar código"
              :disable="loading"
              @click="onResend"
            />
          </div>
        </q-form>

        <!-- Footer -->
        <q-card-section
          class="text-center text-caption q-pb-lg"
          :class="isDark ? 'text-grey-4' : 'text-grey-7'"
        >
          <q-btn
            flat
            dense
            size="sm"
            color="secondary"
            icon="login"
            label="VOLVER A INICIAR SESIÓN"
            @click="goLogin"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "@/stores/authStore";

const { dark } = useQuasar();
const isDark = computed(() => dark.isActive);
const $q = useQuasar();

const router = useRouter();
const auth = useAuthStore();

const step = ref(1); // 1 = pedir código, 2 = código + nueva contraseña

const email = ref(localStorage.getItem("last_email") || "");
const code = ref("");
const password = ref("");
const confirm = ref("");
const showPwd = ref(false);
const loading = ref(false);
const formError = ref("");

const emailRef = ref(null);

const rules = {
  required: (v) => !!String(v || "").trim() || "Campo requerido",
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim()) ||
    "Email inválido",
  minPwd: (v) => String(v || "").length >= 8 || "Mínimo 8 caracteres",
  code: (v) => /^\d{6}$/.test(String(v || "").trim()) || "El código tiene 6 dígitos",
  match: (v) => String(v || "") === password.value || "Las contraseñas no coinciden",
};

/* Fuerza contraseña (idéntica al login) */
const pwdStrength = computed(() => {
  const v = String(password.value || "");
  if (!v) return { pct: 0, color: "grey-5", label: "—" };
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  const pct = Math.min(1, s / 5);
  const color = pct > 0.8 ? "positive" : pct > 0.5 ? "warning" : "orange-5";
  const label = pct > 0.8 ? "Fuerte" : pct > 0.5 ? "Aceptable" : "Débil";
  return { pct, color, label };
});

function goLogin() {
  router.push("/login");
}

async function onRequest() {
  formError.value = "";
  const mail = email.value.trim().toLowerCase();
  if (rules.email(mail) !== true) {
    formError.value = "Ingresa un correo válido.";
    return;
  }
  if (loading.value) return;

  loading.value = true;
  try {
    await auth.requestPasswordReset(mail);
    email.value = mail;
    $q.notify({
      type: "positive",
      message: "Si el correo está registrado, te enviamos un código.",
      position: "top",
      timeout: 4000,
    });
    step.value = 2; // avanzamos a ingresar el código
  } catch (err) {
    formError.value = err?.message || "No se pudo enviar el código.";
  } finally {
    loading.value = false;
  }
}

async function onResend() {
  formError.value = "";
  const mail = email.value.trim().toLowerCase();
  if (rules.email(mail) !== true) {
    formError.value = "Ingresa un correo válido.";
    return;
  }
  if (loading.value) return;

  loading.value = true;
  try {
    await auth.requestPasswordReset(mail);
    $q.notify({
      type: "info",
      message: "Si el correo está registrado, te enviamos un nuevo código.",
      position: "top",
      timeout: 4000,
    });
  } catch (err) {
    formError.value = err?.message || "No se pudo reenviar el código.";
  } finally {
    loading.value = false;
  }
}

async function onReset() {
  formError.value = "";
  const mail = email.value.trim().toLowerCase();
  if (rules.email(mail) !== true) return (formError.value = "Correo inválido.");
  if (rules.code(code.value) !== true) return (formError.value = "El código debe tener 6 dígitos.");
  if (rules.minPwd(password.value) !== true) return (formError.value = "La contraseña debe tener al menos 8 caracteres.");
  if (rules.match(confirm.value) !== true) return (formError.value = "Las contraseñas no coinciden.");
  if (loading.value) return;

  loading.value = true;
  try {
    await auth.resetPassword({
      email: mail,
      code: code.value.trim(),
      newPassword: password.value,
    });
    $q.notify({
      type: "positive",
      message: "Contraseña actualizada. Ya puedes iniciar sesión.",
      position: "top",
      timeout: 4000,
    });
    router.replace("/login");
  } catch (err) {
    formError.value = err?.message || "No se pudo restablecer la contraseña.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await nextTick();
  if (!email.value) emailRef.value?.focus?.();
});
</script>

<style scoped>
.rk-fp {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}
.rk-bg--light {
  background: radial-gradient(1000px 600px at 10% 90%, #b9f3df33, transparent 60%),
    radial-gradient(900px 520px at 85% 10%, #c8dbff33, transparent 60%),
    linear-gradient(135deg, #eef3f7, #dde4eb);
}
.rk-bg--dark {
  background: radial-gradient(1000px 600px at 10% 90%, #2fd6a733, transparent 60%),
    radial-gradient(900px 520px at 85% 10%, #8ab4ff2b, transparent 60%),
    linear-gradient(135deg, #181a1e, #23262b);
}
.rk-center {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  place-items: center;
}
.fp-card {
  width: 100%;
  max-width: 460px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(127, 127, 127, 0.14);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px) saturate(1.1);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  animation: cardIn 0.45s ease both;
}
body.body--dark .fp-card {
  background: rgba(22, 22, 24, 0.78);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.rk-logo-wrap {
  display: flex;
  justify-content: center;
}
.rk-logo {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  color: #fff;
  border-radius: 14px;
  background: radial-gradient(120% 120% at 20% 15%, #4f8cff, #2e6bff 60%),
    linear-gradient(90deg, #2e6bff, #0893aa);
  box-shadow: 0 10px 24px rgba(46, 107, 255, 0.35),
    inset 0 0 14px rgba(255, 255, 255, 0.25);
}
.rk-logo .q-icon {
  font-size: 26px;
}
.rk-muted {
  color: var(--rk-muted, #6b7280);
}
.rk-pwd-meter {
  height: 8px;
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.18);
}
.fp-btn {
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.28);
  transition: transform 0.12s ease, box-shadow 0.2s ease;
}
.fp-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.34);
}
.fp-btn :deep(.q-btn__content) {
  width: 100%;
  justify-content: center;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
