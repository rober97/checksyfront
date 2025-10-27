<template>
  <div class="row q-col-gutter-sm rk-form">
    <!-- NOMBRE -->
    <div class="col-12 col-sm-6">
      <q-input
        v-model="local.firstName"
        label="Nombre"
        dense
        outlined
        clearable
        :rules="[req]"
        lazy-rules
        autocomplete="given-name"
        :counter="60"
      >
        <template #prepend><q-icon name="person" /></template>
      </q-input>
    </div>

    <!-- APELLIDO -->
    <div class="col-12 col-sm-6">
      <q-input
        v-model="local.lastName"
        label="Apellido"
        dense
        outlined
        clearable
        :rules="[req]"
        lazy-rules
        autocomplete="family-name"
        :counter="60"
      >
        <template #prepend><q-icon name="person_outline" /></template>
      </q-input>
    </div>

    <!-- EMAIL -->
    <div class="col-12">
      <q-input
        v-model="local.email"
        label="Correo electrónico"
        type="email"
        dense
        outlined
        clearable
        :rules="[req, emailRule]"
        lazy-rules
        autocomplete="email"
        inputmode="email"
        @blur="local.email = (local.email || '').trim().toLowerCase()"
      >
        <template #prepend><q-icon name="mail" /></template>
        <template #after>
          <q-chip square dense outline color="primary" text-color="primary" class="rk-chip">
            Usa tu correo corporativo si aplica
          </q-chip>
        </template>
      </q-input>
    </div>

    <!-- TIPO DE USUARIO (cards) -->
    <div class="col-12">
      <div class="rk-label q-mb-xs">Tipo de usuario</div>
      <div class="row q-col-gutter-sm">
        <div v-for="r in rolesCards" :key="r.value" class="col-12 col-sm-4">
          <q-card
            flat
            bordered
            class="rk-role-card cursor-pointer"
            :class="{ 'is-active': local.tipo === r.value }"
            @click="selectRole(r.value)"
            role="radio"
            :aria-checked="local.tipo === r.value"
            tabindex="0"
            @keyup.enter.space="selectRole(r.value)"
          >
            <q-card-section class="rk-role">
              <div class="rk-role-icon">
                <q-icon :name="r.icon" size="28px" />
              </div>
              <div class="rk-role-text">
                <div class="text-subtitle2">{{ r.label }}</div>
                <div class="text-caption text-grey-7">{{ r.desc }}</div>
              </div>
              <q-icon name="check_circle" size="22px" class="rk-check" />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- EMPRESA (no admin) -->
    <div class="col-12 col-sm-6" v-if="local.tipo !== 'admin'">
      <q-select
        v-model="local.empresa"
        label="Empresa"
        :options="empresas"
        option-value="id"
        option-label="name"
        dense
        outlined
        emit-value
        map-options
        use-input
        fill-input
        clearable
        :loading="loadingEmpresas"
        :rules="[req]"
        lazy-rules
        @filter="onFilterEmpresasDebounced"
      >
        <template #prepend><q-icon name="business" /></template>
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">Sin resultados</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <!-- RUT -->
    <div class="col-12 col-sm-6">
      <q-input
        v-model="local.rut"
        label="RUT (sin puntos, con guión)"
        dense
        outlined
        clearable
        :rules="[req, rutRule]"
        lazy-rules
        placeholder="11111111-1"
        autocomplete="off"
        @blur="formatRut"
      >
        <template #prepend><q-icon name="badge" /></template>
        <template #append>
          <q-icon name="help_outline" class="cursor-pointer">
            <q-tooltip anchor="top middle" self="bottom middle" class="rk-tooltip">
              Formato válido: <b>12.345.678-5</b> o <b>12345678-5</b> (acepta K/k).
            </q-tooltip>
          </q-icon>
        </template>
        <template #hint>Ejemplos: 13.181.657-K · 55.234.654-4</template>
      </q-input>
    </div>

    <!-- HORARIO (empleado) -->
    <div class="col-12 col-sm-6" v-if="local.tipo === 'empleado'">
      <q-select
        v-model="local.horarioLaboralId"
        label="Horario laboral"
        :options="horarios"
        option-value="id"
        option-label="name"
        dense
        outlined
        emit-value
        map-options
        clearable
        :loading="loadingHorarios"
        :rules="[req]"
        lazy-rules
      >
        <template #prepend><q-icon name="schedule" /></template>
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">Sin resultados</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <!-- CONTRASEÑA -->
    <div class="col-12">
      <q-input
        v-model="local.password"
        :type="showPass ? 'text' : 'password'"
        label="Contraseña"
        dense
        outlined
        clearable
        :rules="[req, passMin]"
        lazy-rules
        autocomplete="new-password"
      >
        <template #prepend><q-icon name="lock" /></template>
        <template #append>
          <q-btn
            flat dense round
            :icon="showPass ? 'visibility' : 'visibility_off'"
            @click="showPass = !showPass"
            :aria-label="showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          />
          <q-btn flat dense round icon="auto_fix_high" @click="generatePassword" aria-label="Generar contraseña segura">
            <q-tooltip class="rk-tooltip">Generar segura</q-tooltip>
          </q-btn>
        </template>
        <template #hint>Mínimo 6 caracteres. Recomendado: mayúsculas, minúsculas, números y símbolos.</template>
      </q-input>

      <div class="q-mt-xs">
        <q-linear-progress :value="passwordStrength.value" :color="passwordStrength.color" rounded track-color="grey-3" />
        <div class="text-caption q-mt-xs text-grey-7">
          Fortaleza: {{ passwordStrength.label }}
        </div>
      </div>
    </div>

    <!-- CONFIRMAR CONTRASEÑA -->
    <div class="col-12">
      <q-input
        v-model="local.passwordConfirm"
        :type="showPass ? 'text' : 'password'"
        label="Confirmar contraseña"
        dense
        outlined
        clearable
        :rules="[matchPasswordRule]"
        lazy-rules
        autocomplete="new-password"
      >
        <template #prepend><q-icon name="verified_user" /></template>
      </q-input>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref, computed } from "vue";
import { validarRUT, formatearRUT, emailRule, req, passMin } from "@/utils/validators";

const props = defineProps({
  modelValue: { type: Object, required: true },
  empresas: { type: Array, default: () => [] },
  empresasRaw: { type: Array, default: () => [] },
  horarios: { type: Array, default: () => [] },
  loadingEmpresas: { type: Boolean, default: false },
  loadingHorarios: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "filter-empresas", "tipo-change"]);

const rolesCards = [
  { label: "Admin",    value: "admin",    icon: "security",  desc: "Control total del sistema" },
  { label: "Empleado", value: "empleado", icon: "badge",     desc: "Marca asistencia y solicita" },
];

// Estado local alineado con el padre (usa 'empresa', NO 'company')
const local = reactive({
  firstName: "",
  lastName: "",
  email: "",
  tipo: "empleado",
  empresa: null,
  rut: "",
  horarioLaboralId: null,
  password: "",
  passwordConfirm: "",
  ...props.modelValue,
});

// --- Sync robusto padre -> hijo (primera carga incluida) ---
const syncing = ref(false);
watch(
  () => props.modelValue,
  (v) => {
    syncing.value = true;
    Object.assign(local, v || {});
    // Evita eco durante el mismo tick
    queueMicrotask(() => { syncing.value = false; });
  },
  { deep: true, immediate: true }
);

// --- Emit hijo -> padre, pero no mientras sincroniza ---
watch(
  local,
  (v) => { if (!syncing.value) emit("update:modelValue", { ...v }); },
  { deep: true }
);

const showPass = ref(false);

// RUT rule
const rutRule = (v) => {
  if (!v) return true;
  try { return validarRUT ? validarRUT(v) || "RUT inválido" : true; }
  catch { return true; }
};

// Confirm password rule
const matchPasswordRule = (v) => (v === local.password) || "Las contraseñas no coinciden";

// Debounce para empresas
let empresasTimer = null;
function onFilterEmpresasDebounced (val, update) {
  clearTimeout(empresasTimer);
  empresasTimer = setTimeout(() => {
    emit("filter-empresas", val, update);
  }, 250);
}

// Autoformateo de RUT
function formatRut () {
  if (!local.rut) return;
  try { local.rut = formatearRUT ? formatearRUT(local.rut) : local.rut; } catch {}
}

// Generador de contraseña
function generatePassword () {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*_-";
  const len = 12;
  let out = "";
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  local.password = out;
  local.passwordConfirm = "";
}

// Medidor de fortaleza simple
const passwordStrength = computed(() => {
  const p = String(local.password || "");
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  const map = [
    { label: "Muy débil", color: "negative", value: 0.2 },
    { label: "Débil",     color: "orange-5", value: 0.4 },
    { label: "Media",     color: "warning",  value: 0.6 },
    { label: "Fuerte",    color: "positive", value: 0.8 },
    { label: "Excelente", color: "teal",     value: 1.0 },
  ];
  const idx = Math.max(0, Math.min(map.length - 1, score - 1));
  return map[idx];
});

// Selección de rol (emite evento por compatibilidad)
function selectRole(val) {
  if (local.tipo === val) return;
  local.tipo = val;
  emit("tipo-change", val);
}
</script>

<style scoped>
/* ===== Estilos modernos con prefijo rk- ===== */
.rk-form :deep(.q-field__messages) { font-size: 12px; }
.rk-tooltip { font-size: 12px; line-height: 1.2; }
.rk-chip { margin-left: 8px; }

/* Etiqueta de sección */
.rk-label {
  font-size: 12px;
  color: var(--q-grey-7);
  font-weight: 700;
  letter-spacing: .3px;
  text-transform: uppercase;
}

/* Role cards */
.rk-role-card {
  border-radius: 16px;
  border: 1px solid var(--q-grey-4);
  background: var(--q-grey-1);
  transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease;
  will-change: transform;
}
.rk-role-card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,.08); }
.rk-role-card.is-active {
  border-color: var(--q-primary);
  background: color-mix(in srgb, var(--q-primary) 6%, transparent);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--q-primary) 18%, transparent);
}

.rk-role {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.rk-role-icon {
  display: grid; place-items: center;
  width: 44px; height: 44px;
  border-radius: 14px;
  background: var(--q-grey-3);
  color: var(--q-dark);
}
.rk-role-card.is-active .rk-role-icon {
  background: var(--q-primary);
  color: white;
}

.rk-role-text .text-subtitle2 {
  font-weight: 700;
  letter-spacing: .2px;
}

.rk-role-card .rk-check {
  opacity: 0; color: var(--q-primary);
  transition: opacity .12s ease;
}
.rk-role-card.is-active .rk-check { opacity: 1; }

/* Dark mode afinado */
:root {
  --rk-surface: #fff;
  --rk-surface-2: #f7f8fa;
}
.body--dark {
  --rk-surface: #14161a;
  --rk-surface-2: #1b1e24;
}
.rk-form :deep(.q-field--outlined .q-field__control) {
  border-radius: 12px;
}
</style>
