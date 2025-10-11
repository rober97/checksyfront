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
                      v-model="form"
                      :empresas="empresas"
                      :empresas-raw="empresasRaw"
                      :horarios="horarios"
                      :loading-empresas="loadingEmpresas"
                      :loading-horarios="loadingHorarios"
                      @filter-empresas="filterEmpresas"
                      @tipo-change="onTipoChange"
                    />
                    <!-- Fuerza + Generar -->
                    <div class="col-12">
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
                          <span class="text-caption text-grey-7">{{
                            passwordLabel
                          }}</span>
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

          <!-- Summary -->
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
        <q-btn flat label="Cancelar" @click="cancelar" />
        <q-btn
          color="primary"
          :label="saving ? 'Guardando…' : 'Guardar'"
          :loading="saving"
          class="q-ml-sm"
          @click="submitForm"
          unelevated
        />
        <q-btn
          color="primary"
          outline
          :disable="saving"
          class="q-ml-sm"
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

import { validarRUT, emailRule } from "@/utils/validators";
import { normalizeMoney, normalizeDecimal, formatMoney } from "@/utils/format";

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

const empresas = ref([]);
const empresasRaw = ref([]);
const horarios = ref([]);
const loadingEmpresas = ref(false);
const loadingHorarios = ref(false);

const form = ref(getEmptyForm());

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      tab.value = "basicos";
      split.value = 70;
      form.value = getEmptyForm();
      await loadEmpresas();
    }
  }
);

async function loadEmpresas() {
  try {
    loadingEmpresas.value = true;
    await companiesStore.fetchCompanies();
    empresasRaw.value = (companiesStore.companies || []).map((c) => ({
      id: c._id,
      name: c.name,
    }));
    empresas.value = empresasRaw.value.slice(0, 50);
  } catch (e) {
    toast.error("Error al cargar empresas");
  } finally {
    loadingEmpresas.value = false;
  }
}
function filterEmpresas(val, update) {
  const v = (val || "").toLowerCase();
  update(() => {
    empresas.value = v
      ? empresasRaw.value
          .filter((e) => e.name.toLowerCase().includes(v))
          .slice(0, 50)
      : empresasRaw.value.slice(0, 50);
  });
}

watch(
  () => form.value.empresa,
  async (empresaId) => {
    if (form.value.tipo === "empleado" && empresaId) {
      await loadHorarios(empresaId);
    } else {
      horarios.value = [];
    }
  }
);
async function loadHorarios(empresaId) {
  try {
    loadingHorarios.value = true;
    await companiesStore.fetchWorkSchedulesByCompany(empresaId);
    horarios.value = (companiesStore.workSchedules || []).map((h) => ({
      id: h._id,
      name: h.name,
    }));
  } catch (e) {
    horarios.value = [];
    toast.error("No se pudieron cargar los horarios.");
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

// Password strength
const passwordScore = computed(() => {
  const p = form.value.password || "";
  let s = 0;
  if (p.length >= 6) s += 0.25;
  if (/[A-Z]/.test(p)) s += 0.25;
  if (/\d/.test(p)) s += 0.25;
  if (/[^A-Za-z0-9]/.test(p)) s += 0.25;
  return s;
});
const passwordColor = computed(() =>
  passwordScore.value < 0.5
    ? "negative"
    : passwordScore.value < 0.75
    ? "warning"
    : "positive"
);
const passwordLabel = computed(() =>
  passwordScore.value < 0.5
    ? "Débil"
    : passwordScore.value < 0.75
    ? "Media"
    : "Fuerte"
);
function generarPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%*";
  let pass = "";
  for (let i = 0; i < 10; i++)
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  form.value.password = pass;
}

async function submitForm() {
  const ok = await formRef.value?.validate();
  if (!ok) {
    toast.error("Revisa los campos requeridos.");
    return;
  }
  // reglas extra
  if (form.value.tipo !== "admin" && !form.value.empresa) {
    toast.error("Debes seleccionar una empresa.");
    tab.value = "basicos";
    return;
  }
  if (form.value.tipo === "empleado") {
    if (!form.value.horarioLaboralId) {
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
    await userStore.createUser(payload);
    toast.success("Usuario creado correctamente.");
    emit("created");
    dialogVisible.value = false;
  } catch (e) {
    toast.error(userStore.error || "No se pudo crear el usuario.");
  } finally {
    saving.value = false;
  }
}

async function submitAndReset() {
  const ok = await formRef.value?.validate();
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
  } catch (e) {
    toast.error(userStore.error || "No se pudo crear el usuario.");
  } finally {
    saving.value = false;
  }
}

function cancelar() {
  dialogVisible.value = false;
}

function mapPayload(f, extra) {
  return {
    firstName: f.firstName,
    lastName: f.lastName,
    email: f.email,
    password: f.password,
    rut: f.tipo === "empleado" ? f.rut : null,
    role: f.tipo,
    company: f.tipo !== "admin" ? f.empresa : null,
    workSchedule: f.tipo === "empleado" ? f.horarioLaboralId : null,
    phone: f.phone || null,
    emergencyContact: f.emergencyContact || null,
    address: {
      line1: f.address.line1 || "",
      commune: f.address.commune || "",
      city: f.address.city || "",
      region: f.address.region || "",
    },
    permissions: f.permissions || [],
    payroll: {
      baseSalary: normalizeMoney(f.payroll.baseSalary),
      contractType: f.payroll.contractType,
      jornada: f.payroll.jornada,
      startDate: f.payroll.startDate || null,
      afp: f.payroll.afp,
      saludSistema: f.payroll.saludSistema,
      isaprePlan: f.payroll.isaprePlan || null,
      isapreUf: Number(normalizeDecimal(f.payroll.isapreUf || 0)),
      apv: normalizeMoney(f.payroll.apv || 0),
      cargasFamiliares: Number(f.payroll.cargasFamiliares || 0),
      banco: f.payroll.banco || null,
      tipoCuenta: f.payroll.tipoCuenta || null,
      numeroCuenta: f.payroll.numeroCuenta || null,
      gratificacion: normalizeMoney(f.payroll.gratificacion || 0),
      bonoColacion: normalizeMoney(f.payroll.bonoColacion || 0),
      bonoMovilizacion: normalizeMoney(f.payroll.bonoMovilizacion || 0),
      descuentoPrestamo: normalizeMoney(f.payroll.descuentoPrestamo || 0),
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

// Hotkeys opcionales
function hotkeys(e) {
  if (!dialogVisible.value) return;
  if (e.key === "Escape") cancelar();
  if (e.key === "Enter" && e.ctrlKey) submitForm();
  if (e.key === "Enter" && e.altKey) submitAndReset();
}
onMounted(() => window.addEventListener("keydown", hotkeys));
onBeforeUnmount(() => window.removeEventListener("keydown", hotkeys));
</script>

<style scoped>
.rk-user-dialog {
  min-width: 820px;
  max-width: 96vw;
  border-radius: 14px;
  overflow: hidden;
}
.rk-header {
  padding: 10px 14px;
}
.rk-body {
  max-height: calc(80vh - 48px - 56px);
  overflow: auto;
}
.rk-splitter {
  height: 100%;
}
.rk-tabs :deep(.q-tabs__content) {
  min-height: 34px;
}
.rk-tabs :deep(.q-tab__label) {
  font-size: 12.5px;
}
.rk-form :deep(.q-field--dense) .q-field__control {
  min-height: 34px;
}
.rk-form :deep(.q-field) {
  margin-bottom: 6px;
}
.rk-footer {
  position: sticky;
  bottom: 0;
  background: var(--rk-card);
  padding: 8px 12px;
  border-top: 1px solid var(--rk-border);
  z-index: 2;
}
:root {
  --rk-border: rgba(0, 0, 0, 0.06);
  --rk-card: #fff;
  --rk-summary-light: #f7f8fa;
  --rk-summary-dark: #1f2126;
  --rk-text-dim: #5f6470;
}
.body--dark {
  --rk-border: rgba(255, 255, 255, 0.08);
  --rk-card: #111317;
  --rk-text-dim: #b6bbc6;
}
.rk-summary {
  border-left: 1px solid var(--rk-border);
  height: 100%;
  overflow: auto;
}
.rk-summary--light {
  background: var(--rk-summary-light);
}
.rk-summary--dark {
  background: var(--rk-summary-dark);
}
.rk-passbar {
  width: 160px;
}
.rk-generate-btn {
  min-height: 34px;
}
@media (max-width: 1023px) {
  .rk-user-dialog {
    min-width: 96vw;
  }
  .rk-summary {
    display: none;
  }
  .rk-passbar {
    width: 120px;
  }
}
</style>
