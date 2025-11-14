<template>
  <q-dialog
    v-model="dialogVisible"
    persistent
    transition-show="jump-down"
    transition-hide="jump-up"
  >
    <q-card class="rk-user-dialog q-pa-none">
      <!-- Header -->
      <div class="rk-header row items-center">
        <div class="row items-center q-gutter-xs">
          <q-icon name="person_add" size="22px" />
          <div class="text-subtitle1 text-weight-medium">
            Crear nuevo usuario
          </div>
        </div>
        <q-space />
        <q-btn dense round flat icon="close" @click="cancelar" />
      </div>

      <q-separator />

      <!-- Body -->
      <div class="rk-body">
        <q-splitter v-model="split" :limits="[65, 85]" class="rk-splitter">
          <template #before>
            <div class="q-pa-md">
              <q-tabs
                v-model="tab"
                dense
                class="rk-tabs text-primary"
                active-color="primary"
                indicator-color="primary"
                align="left"
                narrow-indicator
              >
                <q-tab name="basicos" label="Básicos" icon="badge" />
                <q-tab name="contrato" label="Contrato & Sueldo" icon="work" />
                <q-tab
                  name="contacto"
                  label="Dirección & Contacto"
                  icon="home"
                />
                <q-tab
                  name="permisos"
                  label="Permisos"
                  icon="admin_panel_settings"
                />
              </q-tabs>

              <q-separator />

              <q-form
                ref="formRef"
                @submit.prevent="submitForm"
                greedy
                class="rk-form q-pt-sm"
              >
                <q-tab-panels
                  v-model="tab"
                  animated
                  transition-prev="fade"
                  transition-next="fade"
                >
                  <q-tab-panel name="basicos" class="q-pt-sm">
                    <UserBasicsForm
                      :model-value="form"
                      @update:model-value="onBasicsPatch"
                      :horarios="horarios"
                      :loading-horarios="loadingHorarios"
                      @tipo-change="onTipoChange"
                    />

                    <!-- Password helper compacto -->
                    <div class="rk-passcard q-mt-md">
                      <div class="row items-center justify-between q-gutter-sm">
                        <div class="row items-center q-gutter-sm no-wrap">
                          <span class="text-caption text-grey-7">Fuerza</span>
                          <q-linear-progress
                            :value="passwordScore"
                            :color="passwordColor"
                            size="6px"
                            rounded
                            class="rk-passbar"
                          />
                          <span
                            class="text-caption"
                            :class="passwordTextColor"
                            >{{ passwordLabel }}</span
                          >
                        </div>
                        <q-btn
                          dense
                          outline
                          color="primary"
                          icon="key"
                          label="Generar contraseña"
                          @click="generarPassword"
                          class="rk-generate-btn"
                        />
                      </div>
                      <q-toggle
                        v-model="invitar"
                        label="Enviar invitación por correo con link de acceso"
                        dense
                        class="q-mt-sm"
                      />
                    </div>
                  </q-tab-panel>

                  <q-tab-panel name="contrato" class="q-pt-sm">
                    <UserContractForm v-model="form.payroll" />
                  </q-tab-panel>

                  <q-tab-panel name="contacto" class="q-pt-sm">
                    <UserContactForm v-model="form" />
                  </q-tab-panel>

                  <q-tab-panel name="permisos" class="q-pt-sm">
                    <UserPermissionsForm v-model="form.permissions" />
                  </q-tab-panel>
                </q-tab-panels>
              </q-form>
            </div>
          </template>

          <template #after>
            <UserSummary
              class="rk-summary q-pa-md"
              :class="[
                $q.dark.isActive ? 'rk-summary--dark' : 'rk-summary--light',
              ]"
              :form="form"
              :empresas-raw="empresasRaw"
            />
          </template>
        </q-splitter>
      </div>

      <!-- Footer -->
      <div class="rk-footer row items-center">
        <q-space />
        <q-btn flat label="Cancelar" @click="cancelar" class="rk-btn" />
        <q-btn
          color="primary"
          :label="saving ? 'Guardando…' : 'Guardar'"
          :loading="saving"
          class="q-ml-sm rk-btn rk-btn--primary"
          @click="submitForm"
          unelevated
        />
        <q-btn
          color="primary"
          outline
          :disable="saving"
          class="q-ml-sm rk-btn"
          label="Guardar y crear otro"
          @click="submitAndReset"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {
  ref,
  watch,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useQuasar } from "quasar";
import { useToast } from "vue-toastification";
import { useUserStore } from "@/stores/userStore";
import { useCompaniesStore } from "@/stores/companies";

import UserBasicsForm from "./users/parts/UserBasicsForm.vue";
import UserContractForm from "./users/parts/UserContractForm.vue";
import UserContactForm from "./users/parts/UserContactForm.vue";
import UserPermissionsForm from "./users/parts/UserPermissionsForm.vue";
import UserSummary from "./users/parts/UserSummary.vue";

import { validarRUT } from "@/utils/validators";
import { normalizeMoney, normalizeDecimal } from "@/utils/format";

const $q = useQuasar();
const toast = useToast();
const userStore = useUserStore();
const companiesStore = useCompaniesStore();

const props = defineProps({ modelValue: { type: Boolean, required: true } });
const emit = defineEmits(["update:modelValue", "created"]);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const formRef = ref(null);
const tab = ref("basicos");
const split = ref(70);
const saving = ref(false);
const invitar = ref(true);

const horarios = ref([]);
const loadingHorarios = ref(false);
const empresasRaw = ref([]);

const form = ref(getEmptyForm());

// Abrir dialog -> reset una sola vez
watch(
  () => props.modelValue,
  async (val) => {
    if (!val) return;
    tab.value = "basicos";
    split.value = 70;
    form.value = getEmptyForm();
    await loadEmpresasRaw();
  },
  { immediate: true }
);

// PATCH (merge) desde el hijo, evita reemplazar objeto => no recursión
function onBasicsPatch(patch) {
  if (!patch || typeof patch !== "object") return;
  Object.assign(form.value, patch);
}

async function loadEmpresasRaw() {
  try {
    await companiesStore.fetchCompanies();
    empresasRaw.value = (companiesStore.companies || []).map((c) => ({
      id: c._id,
      name: c.name,
    }));
  } catch {
    /* noop */
  }
}

async function loadHorarios(empresaId) {
  try {
    loadingHorarios.value = true;
    await companiesStore.fetchWorkSchedulesByCompany(empresaId);
    horarios.value = (companiesStore.workSchedules || []).map((h) => ({
      id: h._id,
      name: h.name,
    }));
  } catch {
    horarios.value = [];
  } finally {
    loadingHorarios.value = false;
  }
}

function onTipoChange(val) {
  if (val !== "empleado") {
    form.value.horarioLaboralId = null;
    form.value.rut = "";
  } else if (val === "empleado" && form.value.empresa) {
    loadHorarios(form.value.empresa);
  }
}

/* ===== Password meter ===== */
const passwordScore = computed(() => {
  const p = form.value.password || "";
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6) s += 0.25;
  if (p.length >= 10) s += 0.25;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s += 0.25;
  if (/\d/.test(p)) s += 0.15;
  if (/[^A-Za-z0-9]/.test(p)) s += 0.1;
  return Math.min(s, 1);
});
const passwordColor = computed(() =>
  passwordScore.value < 0.4
    ? "negative"
    : passwordScore.value < 0.7
    ? "warning"
    : "positive"
);
const passwordTextColor = computed(() =>
  passwordScore.value < 0.4
    ? "text-negative"
    : passwordScore.value < 0.7
    ? "text-warning"
    : "text-positive"
);
const passwordLabel = computed(() =>
  passwordScore.value < 0.4
    ? "Débil"
    : passwordScore.value < 0.7
    ? "Media"
    : "Fuerte"
);

function generarPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%*";
  let out = "";
  for (let i = 0; i < 12; i++)
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  form.value.password = out;
}

/* ===== Validación & submit ===== */
async function validateForm() {
  try {
    const r = await formRef.value?.validate();
    return r === true || r === undefined;
  } catch {
    return false;
  }
}

async function submitForm() {
  const ok = await validateForm();
  if (!ok) {
    toast.error("Revisa los campos requeridos.");
    return;
  }

  if (form.value.tipo !== "admin" && !form.value.empresa) {
    toast.error("Debes seleccionar una empresa.");
    tab.value = "basicos";
    return;
  }

  if (form.value.tipo === "empleado") {
    if (!form.value.workScheduleChoice.scheduleId) {
      toast.error("Selecciona un horario laboral.");
      tab.value = "basicos";
      return;
    }
    if (!form.value.rut || !validarRUT(form.value.rut)) {
      toast.error("RUT inválido.");
      tab.value = "basicos";
      return;
    }
  }

  const payload = mapPayload(form.value, { invitar: invitar.value });
  try {
    saving.value = true;
    const data = await userStore.createUser(payload);
    toast.success("Usuario creado correctamente.");
    emit("created");
    emit('saved', data) // o emit('guardar', data) si mantienes el nombre
    dialogVisible.value = false;
  } catch {
    toast.error(userStore.error || "No se pudo crear el usuario.");
  } finally {
    saving.value = false;
  }
}

async function submitAndReset() {
  const ok = await validateForm();
  if (!ok) {
    toast.error("Revisa los campos requeridos.");
    return;
  }

  const payload = mapPayload(form.value, { invitar: invitar.value });
  try {
    saving.value = true;
    await userStore.createUser(payload);
    toast.success("Usuario creado. Puedes crear otro ahora.");
    emit("created");
    form.value = getEmptyForm();
    await nextTick();
  } catch {
    toast.error(userStore.error || "No se pudo crear el usuario.");
  } finally {
    saving.value = false;
  }
}

function cancelar() {
  dialogVisible.value = false;
}

/* ===== Helpers ===== */
function mapPayload(f, extra) {
  return {
    firstName: f.firstName?.trim() || "",
    lastName: f.lastName?.trim() || "",
    email: f.email?.trim().toLowerCase() || "",
    password: f.password || "",
    rut: f.tipo === "empleado" ? f.rut : null,
    role: f.tipo,
    company: f.tipo !== "admin" ? f.empresa : null,
    workSchedule: f.tipo === "empleado" ? f.horarioLaboralId : null,
    phone: f.phone?.trim() || null,
    emergencyContact: f.emergencyContact?.trim() || null,
    address: {
      line1: f.address?.line1?.trim() || "",
      commune: f.address?.commune?.trim() || "",
      city: f.address?.city?.trim() || "",
      region: f.address?.region?.trim() || "",
    },
    permissions: f.permissions || [],
    payroll: {
      baseSalary: normalizeMoney(f.payroll?.baseSalary || 0),
      contractType: f.payroll?.contractType || "",
      jornada: f.payroll?.jornada || "",
      startDate: f.payroll?.startDate || null,
      afp: f.payroll?.afp || "",
      saludSistema: f.payroll?.saludSistema || "",
      isaprePlan: f.payroll?.isaprePlan || null,
      isapreUf: Number(normalizeDecimal(f.payroll?.isapreUf || 0)),
      apv: normalizeMoney(f.payroll?.apv || 0),
      cargasFamiliares: Number(f.payroll?.cargasFamiliares || 0),
      banco: f.payroll?.banco || "",
      tipoCuenta: f.payroll?.tipoCuenta || "",
      numeroCuenta: f.payroll?.numeroCuenta || "",
      gratificacion: normalizeMoney(f.payroll?.gratificacion || 0),
      bonoColacion: normalizeMoney(f.payroll?.bonoColacion || 0),
      bonoMovilizacion: normalizeMoney(f.payroll?.bonoMovilizacion || 0),
      descuentoPrestamo: normalizeMoney(f.payroll?.descuentoPrestamo || 0),
    },
    invite: !!extra?.invitar,
  };
}

function getEmptyForm() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    tipo: "empleado",
    empresa: null,
    rut: "",
    horarioLaboralId: null,
    phone: "",
    emergencyContact: "",
    address: { line1: "", commune: "", city: "", region: "" },
    permissions: [],
    payroll: {
      baseSalary: 0,
      contractType: "",
      jornada: "",
      startDate: "",
      afp: "",
      saludSistema: "",
      isaprePlan: "",
      isapreUf: 0,
      apv: 0,
      cargasFamiliares: 0,
      banco: "",
      tipoCuenta: "",
      numeroCuenta: "",
      gratificacion: 0,
      bonoColacion: 0,
      bonoMovilizacion: 0,
      descuentoPrestamo: 0,
    },
  };
}

/* Hotkeys */
function hotkeys(e) {
  if (!dialogVisible.value) return;
  if (e.key === "Escape") {
    e.preventDefault();
    cancelar();
  }
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault();
    submitForm();
  }
  if (e.key === "Enter" && e.altKey) {
    e.preventDefault();
    submitAndReset();
  }
}
onMounted(() => window.addEventListener("keydown", hotkeys));
onBeforeUnmount(() => window.removeEventListener("keydown", hotkeys));
</script>

<style scoped>
/* ===== Fondos sólidos y contraste consistente ===== */
.rk-user-dialog {
  min-width: 860px;
  max-width: 96vw;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  background: #ffffff;
}
.body--dark .rk-user-dialog {
  background: #0f1216;
}

.rk-header {
  padding: 14px 20px;
  background: #f5f7fb;
  border-bottom: 1px solid #e5e7eb;
}
.body--dark .rk-header {
  background: #15181f;
  border-bottom-color: #2a2f39;
}
.rk-header .text-subtitle1 {
  font-weight: 700;
  color: #1a1d23;
}
.body--dark .rk-header .text-subtitle1 {
  color: #ffffff;
}

.rk-body {
  max-height: calc(80vh - 60px - 64px);
  overflow: auto;
  background: #ffffff;
}
.body--dark .rk-body {
  background: #0f1216;
}
.rk-splitter {
  height: 100%;
}

.rk-tabs {
  background: #ffffff;
}
.body--dark .rk-tabs {
  background: #0f1216;
}
.rk-tabs :deep(.q-tab) {
  border-radius: 10px 10px 0 0;
  padding: 8px 16px;
  margin: 0 2px;
}
.rk-tabs :deep(.q-tab--active) {
  background: #e8f1fe; /* sólido claro */
}
.body--dark .rk-tabs :deep(.q-tab--active) {
  background: #172034; /* sólido dark */
}

.rk-form :deep(.q-field--dense) .q-field__control {
  min-height: 42px;
  border-radius: 10px;
}
.rk-form :deep(.q-field) {
  margin-bottom: 8px;
}
.rk-form :deep(.q-field--outlined .q-field__control) {
  border-radius: 10px;
}

.rk-passcard {
  background: #f0f2f6;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px;
}
.body--dark .rk-passcard {
  background: #1a1f2a;
  border-color: #2a2f39;
}
.rk-passbar {
  width: 140px;
  border-radius: 3px;
}
.rk-generate-btn {
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
}

.rk-summary {
  border-left: 1px solid #e5e7eb;
  height: 100%;
  overflow: auto;
  background: #fafbfe;
}
.body--dark .rk-summary {
  border-left-color: #2a2f39;
  background: #10141c;
}

.rk-footer {
  position: sticky;
  bottom: 0;
  background: #ffffff;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  z-index: 2;
}
.body--dark .rk-footer {
  background: #0f1216;
  border-top-color: #2a2f39;
}

.rk-btn {
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
  min-height: 42px;
  padding: 0 20px;
}
.rk-btn--primary {
  box-shadow: 0 4px 14px rgba(33, 150, 243, 0.25);
}

@media (max-width: 1023px) {
  .rk-user-dialog {
    min-width: 96vw;
    margin: 16px;
  }
  .rk-summary {
    display: none;
  }
}
@media (max-width: 600px) {
  .rk-user-dialog {
    min-width: calc(100vw - 32px);
    margin: 8px;
  }
  .rk-header {
    padding: 12px 16px;
  }
  .rk-body {
    max-height: calc(90vh - 56px - 60px);
  }
  .rk-footer {
    flex-direction: column;
    gap: 8px;
  }
  .rk-footer .q-btn {
    width: 100%;
    margin-left: 0 !important;
  }
}
</style>
