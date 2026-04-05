<template>
  <q-dialog
    v-model="dialogVisible"
    persistent
    transition-show="scale"
    transition-hide="scale"
    maximized
    class="rk-user-dialog-wrapper"
  >
    <q-card class="rk-user-dialog">
      <!-- Decorative Background -->
      <div class="rk-dialog-bg">
        <div class="rk-grid-pattern"></div>
        <div class="rk-glow-orb rk-orb-1"></div>
        <div class="rk-glow-orb rk-orb-2"></div>
      </div>

      <!-- Header Premium -->
      <div class="rk-header">
        <div class="rk-header-content">
          <div class="rk-header-icon">
            <q-icon :name="isEditMode ? 'manage_accounts' : 'person_add'" />
            <div class="rk-icon-pulse"></div>
          </div>
          <div class="rk-header-text">
            <h3 class="rk-header-title">{{ dialogTitle }}</h3>
            <p class="rk-header-subtitle">
              {{ dialogSubtitle }}
            </p>
          </div>
        </div>
        <div class="rk-header-actions">
          <q-badge v-if="isEditMode" :color="statusColor(form.status)" outline class="rk-status-chip">
            {{ statusNice(form.status) }}
          </q-badge>
          <q-btn
            v-if="isEditMode"
            flat
            dense
            no-caps
            icon="key"
            label="Cambiar contraseña"
            class="rk-header-btn"
            @click="openPasswordDialog"
          />
          <button class="rk-close-btn" @click="cancelar">
            <q-icon name="close" />
          </button>
        </div>
      </div>

      <div v-if="isEditMode" class="rk-audit-strip">
        <div class="rk-audit-item">
          <q-icon name="event" />
          <span>Creado: {{ friendly(audit.createdAt) }}</span>
        </div>
        <div class="rk-audit-item">
          <q-icon name="event_available" />
          <span>Actualizado: {{ friendly(audit.updatedAt) }}</span>
        </div>
        <div class="rk-audit-item">
          <q-icon name="schedule" />
          <span>Último acceso: {{ friendly(audit.lastLogin) }}</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="rk-progress-container">
        <div class="rk-progress-bar">
          <div
            class="rk-progress-fill"
            :style="{ width: formProgress + '%' }"
          ></div>
        </div>
        <div class="rk-progress-label">
          <span>Progreso del formulario</span>
          <strong>{{ formProgress }}%</strong>
        </div>
      </div>

      <!-- Body with Splitter -->
      <div class="rk-body">
        <q-splitter
          v-model="split"
          :limits="[60, 75]"
          class="rk-splitter"
          separator-class="rk-separator"
        >
          <template #before>
            <div class="rk-form-container">
              <!-- Tabs Premium -->
              <div class="rk-tabs-wrapper">
                <div class="rk-tabs">
                  <button
                    v-for="tabItem in tabs"
                    :key="tabItem.value"
                    class="rk-tab"
                    :class="{
                      active: tab === tabItem.value,
                      completed: isTabCompleted(tabItem.value),
                    }"
                    @click="tab = tabItem.value"
                  >
                    <div class="rk-tab-icon">
                      <q-icon :name="tabItem.icon" />
                      <div
                        v-if="isTabCompleted(tabItem.value)"
                        class="rk-tab-check"
                      >
                        <q-icon name="check" />
                      </div>
                    </div>
                    <div class="rk-tab-content">
                      <span class="rk-tab-label">{{ tabItem.label }}</span>
                      <span class="rk-tab-desc">{{ tabItem.desc }}</span>
                    </div>
                    <div class="rk-tab-indicator"></div>
                  </button>
                </div>
              </div>

              <!-- Form Content -->
              <q-form
                ref="formRef"
                @submit.prevent="submitForm"
                greedy
                class="rk-form"
              >
                <q-tab-panels
                  v-model="tab"
                  animated
                  transition-prev="slide-right"
                  transition-next="slide-left"
                  class="rk-panels"
                >
                  <!-- Panel: Básicos -->
                  <q-tab-panel name="basicos" class="rk-panel">
                    <div class="rk-panel-header">
                      <q-icon name="badge" class="rk-panel-icon" />
                      <div>
                        <h4 class="rk-panel-title">Información básica</h4>
                        <p class="rk-panel-subtitle">
                          Datos personales y credenciales de acceso
                        </p>
                      </div>
                    </div>

                    <UserBasicsForm
                      :model-value="form"
                      @update:model-value="onBasicsPatch"
                      :require-password="!isEditMode"
                      :horarios="horarios"
                      :loading-horarios="loadingHorarios"
                      @tipo-change="onTipoChange"
                    />

                    <!-- Password Card Premium -->
                    <div v-if="!isEditMode" class="rk-password-card">
                      <div class="rk-password-header">
                        <div class="rk-password-icon">
                          <q-icon name="key" />
                        </div>

                        <div class="rk-password-info">
                          <h5 class="rk-password-title">
                            Seguridad de contraseña
                          </h5>
                          <div class="rk-password-strength">
                            <div class="rk-strength-bar-container">
                              <div
                                class="rk-strength-bar"
                                :class="`rk-strength-${passwordStrength}`"
                                :style="{ width: passwordScore * 100 + '%' }"
                              ></div>
                            </div>
                            <span
                              class="rk-strength-label"
                              :class="`rk-strength-${passwordStrength}`"
                            >
                              {{ passwordLabel }}
                            </span>
                          </div>
                        </div>

                        <q-btn
                          unelevated
                          no-caps
                          color="primary"
                          icon="auto_fix_high"
                          label="Generar"
                          @click="generarPassword"
                          class="rk-generate-btn"
                        />
                      </div>

                      <div class="rk-invite-toggle">
                        <q-checkbox v-model="invitar" class="rk-checkbox">
                          <template #default>
                            <div class="rk-checkbox-content">
                              <div class="rk-checkbox-icon">
                                <q-icon name="email" />
                              </div>
                              <div>
                                <strong>Enviar invitación por correo</strong>
                                <p>
                                  El usuario recibirá un email con sus
                                  credenciales de acceso
                                </p>
                              </div>
                            </div>
                          </template>
                        </q-checkbox>
                      </div>
                    </div>
                  </q-tab-panel>

                  <!-- Panel: Contrato -->
                  <q-tab-panel name="contrato" class="rk-panel">
                    <div class="rk-panel-header">
                      <q-icon name="work" class="rk-panel-icon" />
                      <div>
                        <h4 class="rk-panel-title">Contrato y remuneración</h4>
                        <p class="rk-panel-subtitle">
                          Detalles laborales y datos de nómina
                        </p>
                      </div>
                    </div>

                    <!-- 👇 Aquí viene lo dinámico -->
                    <UserContractForm
                      v-model="form.payroll"
                      :loading-catalog="loadingCatalog"
                      :afp-options="afpOptions"
                      :health-options="healthOptions"
                      :health-selected-meta="
                        payrollCatalogStore.getHealthMetaById(
                          form.payroll.healthEntityId,
                        )
                      "
                    />

                    <div v-if="catalogError" class="rk-catalog-error">
                      <q-icon name="error" />
                      <div>
                        <strong>No se pudo cargar el catálogo de nómina</strong>
                        <p>{{ catalogError }}</p>
                      </div>
                      <q-btn
                        flat
                        icon="refresh"
                        label="Reintentar"
                        @click="loadPayrollCatalog()"
                      />
                    </div>
                  </q-tab-panel>

                  <!-- Panel: Contacto -->
                  <q-tab-panel name="contacto" class="rk-panel">
                    <div class="rk-panel-header">
                      <q-icon name="home" class="rk-panel-icon" />
                      <div>
                        <h4 class="rk-panel-title">Dirección y contacto</h4>
                        <p class="rk-panel-subtitle">
                          Información de ubicación y contacto de emergencia
                        </p>
                      </div>
                    </div>
                    <UserContactForm v-model="form" />
                  </q-tab-panel>

                </q-tab-panels>
              </q-form>
            </div>
          </template>

          <template #after>
            <div class="rk-summary-container">
              <div class="rk-summary-header">
                <div class="rk-summary-icon">
                  <q-icon name="preview" />
                </div>
                <div>
                  <h4 class="rk-summary-title">Vista previa</h4>
                  <p class="rk-summary-subtitle">Resumen de la información</p>
                </div>
              </div>
              <UserSummary
                class="rk-summary-content"
                :form="form"
                :empresas-raw="empresasRaw"
              />
            </div>
          </template>
        </q-splitter>
      </div>

      <!-- Footer Actions -->
      <div class="rk-footer">
        <div class="rk-footer-info">
          <q-icon name="info" />
          <span
            >Usa <kbd>Esc</kbd> para cancelar, <kbd>Ctrl+Enter</kbd> para
            guardar</span
          >
        </div>
        <div class="rk-footer-actions">
          <q-btn
            flat
            no-caps
            :label="isEditMode ? 'Cerrar' : 'Cancelar'"
            @click="cancelar"
            class="rk-footer-btn rk-btn-cancel"
          />
          <q-btn
            v-if="isEditMode"
            flat
            no-caps
            color="negative"
            label="Eliminar"
            icon="delete"
            @click="confirmDelete"
            class="rk-footer-btn"
          />
          <q-btn
            v-if="!isEditMode"
            outline
            no-caps
            :disable="saving"
            label="Guardar y crear otro"
            icon-right="add"
            @click="submitAndReset"
            class="rk-footer-btn rk-btn-secondary"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="primaryActionLabel"
            :loading="saving"
            :icon-right="isEditMode ? 'save' : 'check'"
            @click="handlePrimaryAction"
            class="rk-footer-btn rk-btn-primary"
          >
            <div class="rk-btn-shine"></div>
          </q-btn>
          <q-btn
            v-if="isEditMode"
            color="primary"
            outline
            :disable="saving"
            class="rk-footer-btn rk-btn-secondary"
            label="Guardar y cerrar"
            @click="saveEdit(true)"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>

  <q-dialog v-model="pwdDialog">
    <q-card style="min-width: 380px">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="key" />
        <div class="text-subtitle2">Cambiar contraseña</div>
      </q-card-section>
      <q-card-section class="q-gutter-sm">
        <q-input v-model="pwd" :type="showPwd ? 'text' : 'password'" label="Nueva contraseña" dense outlined>
          <template #append>
            <q-btn flat dense round :icon="showPwd ? 'visibility' : 'visibility_off'" @click="showPwd = !showPwd" />
          </template>
        </q-input>
        <q-btn flat dense icon="autorenew" label="Generar segura" @click="genPwd" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn color="primary" label="Actualizar" :disable="!pwd" @click="doChangePassword" />
      </q-card-actions>
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
import { useToast } from "vue-toastification";
import { useQuasar } from "quasar";

import { useUserStore } from "@/stores/userStore";
import { useCompaniesStore } from "@/stores/companies";
import { usePayrollCatalogStore } from "@/stores/payrollCatalogStore";

import { validarRUT } from "@/utils/validators";
import { normalizeMoney, normalizeDecimal } from "@/utils/format";
import { mapFromApi, buildApiPatch } from "@/utils/userMapping";
import { diff, deepClone } from "@/utils/diff";
import { friendly, statusColor, statusNice } from "@/composables/useUserForm";

import UserBasicsForm from "./users/parts/UserBasicsForm.vue";
import UserContractForm from "./users/parts/UserContractForm.vue";
import UserContactForm from "./users/parts/UserContactForm.vue";
import UserSummary from "./users/parts/UserSummary.vue";

const $q = useQuasar();
const toast = useToast();

const userStore = useUserStore();
const companiesStore = useCompaniesStore();
const payrollCatalogStore = usePayrollCatalogStore();

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  mode: { type: String, default: "create" },
  userId: { type: String, default: null },
});
const emit = defineEmits(["update:modelValue", "created", "saved", "updated", "deleted"]);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const formRef = ref(null);
const tab = ref("basicos");
const split = ref(65);
const saving = ref(false);
const invitar = ref(true);
const pwdDialog = ref(false);
const pwd = ref("");
const showPwd = ref(false);
const audit = ref({ createdAt: null, updatedAt: null, lastLogin: null });
let original = null;

const isEditMode = computed(() => props.mode === "edit");
const dialogTitle = computed(() => isEditMode.value ? "Editar usuario" : "Crear nuevo usuario");
const dialogSubtitle = computed(() =>
  isEditMode.value
    ? "Modifica los datos del perfil y guarda solo los cambios necesarios"
    : "Complete todos los datos requeridos del perfil"
);
const primaryActionLabel = computed(() =>
  saving.value
    ? "Guardando..."
    : isEditMode.value
      ? "Guardar cambios"
      : "Guardar usuario"
);

const horarios = ref([]);
const loadingHorarios = ref(false);
const empresasRaw = ref([]);

const form = ref(getEmptyForm());

const tabs = [
  {
    value: "basicos",
    label: "Básicos",
    icon: "badge",
    desc: "Datos personales",
  },
  {
    value: "contrato",
    label: "Contrato",
    icon: "work",
    desc: "Información laboral",
  },
  {
    value: "contacto",
    label: "Contacto",
    icon: "home",
    desc: "Dirección y teléfono",
  },
];

// ✅ catálogo dinámico desde store
const loadingCatalog = computed(() => payrollCatalogStore.loading);
const catalogError = computed(() => payrollCatalogStore.error);
const afpOptions = computed(() => payrollCatalogStore.afpOptions);
const healthOptions = computed(() => payrollCatalogStore.healthOptions);

const healthSelectedMeta = computed(() => {
  const id = form.value?.payroll?.healthEntityId;
  return payrollCatalogStore.getHealthMetaById(id);
});

// Progreso igual que lo tenías
const formProgress = computed(() => {
  let progress = 0;
  const f = form.value;

  if (f.firstName && f.lastName) progress += 10;
  if (f.email) progress += 10;
  if (f.password) progress += 10;
  if (f.tipo) progress += 5;
  if (f.empresa) progress += 5;

  if (f.payroll?.baseSalary) progress += 10;
  if (f.payroll?.contractType) progress += 5;
  if (f.payroll?.startDate) progress += 5;

  if (f.phone) progress += 10;
  if (f.address?.line1) progress += 5;
  if (f.address?.commune) progress += 5;

  return Math.min(Math.round(progress), 100);
});

const isTabCompleted = (tabName) => {
  const f = form.value;
  switch (tabName) {
    case "basicos":
      return !!(f.firstName && f.lastName && f.email && (isEditMode.value || f.password));
    case "contrato":
      return !!(f.payroll?.baseSalary && f.payroll?.contractType);
    case "contacto":
      return !!(f.phone && f.address?.line1);
    default:
      return false;
  }
};

// Watch open dialog: carga empresas + catálogo desde store
watch(
  () => props.modelValue,
  async (val) => {
    if (!val) return;

    tab.value = "basicos";
    split.value = 65;
    form.value = getEmptyForm();
    original = null;
    audit.value = { createdAt: null, updatedAt: null, lastLogin: null };

    await Promise.allSettled([
      loadEmpresasRaw(),
      payrollCatalogStore.fetchAll({ force: false }),
    ]);

    if (isEditMode.value && props.userId) {
      await hydrateEditUser();
    }
  },
  { immediate: true },
);

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

async function hydrateEditUser() {
  const res = await userStore.fetchUserById(props.userId);
  const currentUser = res?.data || userStore.currentUser;
  if (!currentUser) {
    toast.error("No se encontró el usuario");
    dialogVisible.value = false;
    return;
  }

  form.value = {
    ...getEmptyForm(),
    ...mapFromApi(currentUser),
    password: "",
    passwordConfirm: "",
    workScheduleChoice: {
      mode: "companyDefault",
      scheduleId: currentUser.workSchedule?._id || currentUser.workSchedule || null,
    },
  };

  audit.value = {
    createdAt: currentUser.createdAt,
    updatedAt: currentUser.updatedAt,
    lastLogin: currentUser.lastLogin,
  };

  original = deepClone(form.value);

  if (form.value.tipo === "empleado" && form.value.empresa) {
    await loadHorarios(form.value.empresa);
  }
}

function onTipoChange(val) {
  if (val !== "empleado") {
    form.value.horarioLaboralId = null;
    form.value.rut = "";
  } else if (form.value.empresa) {
    loadHorarios(form.value.empresa);
  }
}

// Password strength (igual que lo tenías)
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

const passwordStrength = computed(() => {
  const score = passwordScore.value;
  if (score < 0.3) return "weak";
  if (score < 0.6) return "medium";
  if (score < 0.9) return "good";
  return "excellent";
});

const passwordLabel = computed(() => {
  const score = passwordScore.value;
  if (score < 0.3) return "Muy débil";
  if (score < 0.6) return "Débil";
  if (score < 0.9) return "Buena";
  return "Excelente";
});

function generarPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%*";
  let out = "";
  for (let i = 0; i < 12; i++)
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  form.value.password = out;
}

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
  if (!ok) return toast.error("Revisa los campos requeridos.");

  if (!form.value.empresa) {
    toast.error("Debes seleccionar una empresa.");
    tab.value = "basicos";
    return;
  }

  if (form.value.tipo === "empleado") {
    if (!form.value.workScheduleChoice?.scheduleId) {
      toast.error("Selecciona un horario laboral.");
      tab.value = "basicos";
      return;
    }
    if (!form.value.rut || !validarRUT(form.value.rut)) {
      toast.error("RUT inválido.");
      tab.value = "basicos";
      return;
    }

    // ✅ validación dinámica: si catálogo no cargó, no sigas
    if (!payrollCatalogStore.isReady) {
      toast.error("Catálogo de nómina no disponible. Reintenta.");
      tab.value = "contrato";
      return;
    }

    if (!form.value.payroll?.afpEntityId) {
      toast.error("Selecciona AFP.");
      tab.value = "contrato";
      return;
    }
    if (!form.value.payroll?.healthEntityId) {
      toast.error("Selecciona sistema de salud.");
      tab.value = "contrato";
      return;
    }

    const requiresUf = !!healthSelectedMeta.value?.requiresUf;
    if (requiresUf) {
      const uf = Number(normalizeDecimal(form.value.payroll?.isapreUf || 0));
      if (!(uf > 0)) {
        toast.error("Este sistema de salud requiere plan en UF.");
        tab.value = "contrato";
        return;
      }
    }
  }

  const payload = mapPayload(form.value);

  try {
    saving.value = true;
    const data = await userStore.createUser(payload);
    toast.success("Usuario creado correctamente.");
    emit("created");
    emit("saved", data);
    dialogVisible.value = false;
  } catch {
    toast.error(userStore.error || "No se pudo crear el usuario.");
  } finally {
    saving.value = false;
  }
}

async function saveEdit(closeAfter = false) {
  const ok = await validateForm();
  if (!ok) return toast.error("Revisa los campos requeridos.");

  try {
    saving.value = true;
    const uiPatch = diff(original || {}, form.value);
    delete uiPatch.password;
    delete uiPatch.passwordConfirm;

    if (Object.keys(uiPatch).length === 0) {
      toast.info("No hay cambios para guardar");
      if (closeAfter) dialogVisible.value = false;
      return;
    }

    const apiPatch = buildApiPatch(uiPatch);
    if (apiPatch.workScheduleChoice) {
      apiPatch.workSchedule = apiPatch.workScheduleChoice.scheduleId || null;
      delete apiPatch.workScheduleChoice;
    }
    normalizeEditPatch(apiPatch);

    await userStore.updateUser({ id: props.userId, patch: apiPatch });
    toast.success("Cambios guardados");
    emit("updated");
    emit("saved");
    original = deepClone(form.value);
    if (closeAfter) dialogVisible.value = false;
  } catch {
    toast.error("No se pudo guardar");
  } finally {
    saving.value = false;
  }
}

async function submitAndReset() {
  const ok = await validateForm();
  if (!ok) return toast.error("Revisa los campos requeridos.");

  const payload = mapPayload(form.value);

  try {
    saving.value = true;
    const data = await userStore.createUser(payload);
    toast.success("Usuario creado. Puedes crear otro ahora.");
    emit("created");
    emit("saved", data);
    form.value = getEmptyForm();
    await nextTick();
  } catch {
    toast.error(userStore.error || "No se pudo crear el usuario.");
  } finally {
    saving.value = false;
  }
}

function cancelar() {
  if (!isEditMode.value || !original) {
    dialogVisible.value = false;
    return;
  }

  const hasChanges = Object.keys(diff(original, form.value)).length > 0;
  if (!hasChanges) {
    dialogVisible.value = false;
    return;
  }

  $q.dialog({
    title: "Descartar cambios",
    message: "Tienes cambios sin guardar. ¿Cerrar de todos modos?",
    ok: { label: "Descartar" },
    cancel: { label: "Seguir editando" },
  }).onOk(() => { dialogVisible.value = false; });
}

function handlePrimaryAction() {
  if (isEditMode.value) return saveEdit(false);
  return submitForm();
}

function mapPayload(f) {
  // opcional: guardar saludSistema desde entity slug (dinámico, no hardcode)
  const saludSistema = payrollCatalogStore.getHealthSlugById(
    f.payroll?.healthEntityId,
  );
  return {
    firstName: f.firstName?.trim() || "",
    lastName: f.lastName?.trim() || "",
    email: f.email?.trim().toLowerCase() || "",
    password: f.password || "",
    rut: f.tipo === "empleado" ? f.rut : null,
    role: f.tipo,
    company: f.empresa,
    workSchedule: f.workScheduleChoice.scheduleId,
    phone: f.phone?.trim() || null,
    emergencyContact: f.emergencyContact?.trim() || null,
    address: {
      line1: f.address?.line1?.trim() || "",
      commune: f.address?.commune?.trim() || "",
      city: f.address?.city?.trim() || "",
      region: f.address?.region?.trim() || "",
    },
    payroll: {
      baseSalary: normalizeMoney(f.payroll?.baseSalary || 0),
      contractType: f.payroll?.contractType || "",
      jornada: f.payroll?.jornada || "",
      startDate: f.payroll?.startDate || null,

      // ✅ IDs globales
      afpEntityId: f.payroll?.afpEntityId || null,
      healthEntityId: f.payroll?.healthEntityId || null,
      saludSistema, // opcional, derivado del catálogo

      isaprePlan: f.payroll?.isaprePlan || null,
      isapreUf: Number(normalizeDecimal(f.payroll?.isapreUf || 0)),
      apv: normalizeMoney(f.payroll?.apv || 0),
      cargasFamiliares: Number(f.payroll?.cargasFamiliares || 0),
      incomeTaxApplies: f.payroll?.incomeTaxApplies !== false,
      incomeTaxNote: f.payroll?.incomeTaxNote?.trim() || "",
      banco: f.payroll?.banco || "",
      tipoCuenta: f.payroll?.tipoCuenta || "",
      numeroCuenta: f.payroll?.numeroCuenta || "",
      gratificacion: normalizeMoney(f.payroll?.gratificacion || 0),
      bonoColacion: normalizeMoney(f.payroll?.bonoColacion || 0),
      bonoMovilizacion: normalizeMoney(f.payroll?.bonoMovilizacion || 0),
      descuentoPrestamo: normalizeMoney(f.payroll?.descuentoPrestamo || 0),
    },
    invite: !!invitar.value,
  };
}

function normalizeEditPatch(patch) {
  if (!patch?.payroll) return;
  const payroll = patch.payroll;
  [
    "baseSalary",
    "apv",
    "gratificacion",
    "bonoColacion",
    "bonoMovilizacion",
    "descuentoPrestamo",
  ].forEach((key) => {
    if (payroll[key] !== undefined) payroll[key] = normalizeMoney(payroll[key]);
  });
  if (payroll.isapreUf !== undefined) {
    payroll.isapreUf = Number(normalizeDecimal(payroll.isapreUf || 0));
  }
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
    workScheduleChoice: { mode: "companyDefault", scheduleId: null },
    status: "active",
    phone: "",
    emergencyContact: "",
    address: { line1: "", commune: "", city: "", region: "" },
    payroll: {
      baseSalary: 0,
      contractType: "",
      jornada: "",
      startDate: "",

      afpEntityId: null,
      healthEntityId: null,

      isaprePlan: "",
      isapreUf: 0,
      apv: 0,
      cargasFamiliares: 0,
      incomeTaxApplies: true,
      incomeTaxNote: "",
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

function confirmDelete() {
  $q.dialog({
    title: "Eliminar usuario",
    message: "Esta acción no se puede deshacer. ¿Eliminar?",
    ok: { label: "Eliminar", color: "negative" },
    cancel: { label: "Cancelar" },
  }).onOk(async () => {
    try {
      await userStore.deleteUser(props.userId);
      toast.success("Usuario eliminado");
      emit("deleted");
      dialogVisible.value = false;
    } catch {
      toast.error("No se pudo eliminar");
    }
  });
}

function openPasswordDialog() { pwdDialog.value = true; }
function genPwd() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%*";
  let pass = "";
  for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  pwd.value = pass;
}
async function doChangePassword() {
  if (!pwd.value || pwd.value.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
  try {
    await userStore.changePassword({ id: props.userId, newPassword: pwd.value });
    toast.success("Contraseña actualizada");
    pwdDialog.value = false;
    pwd.value = "";
  } catch {
    toast.error("No se pudo cambiar la contraseña");
  }
}

// Hotkeys
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
@import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap");

:root {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-accent: #14b8a6;
}

.rk-catalog-error {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
}
.rk-catalog-error .q-icon {
  color: #ef4444;
  font-size: 20px;
  margin-top: 2px;
}
.rk-catalog-error p {
  margin: 4px 0 0 0;
  opacity: 0.75;
}

/* Theme Variables */
.rk-user-dialog {
  --dialog-bg: rgba(255, 255, 255, 0.98);
  --surface-1: rgba(6, 182, 212, 0.03);
  --surface-2: rgba(6, 182, 212, 0.06);
  --surface-3: rgba(6, 182, 212, 0.1);
  --text-primary: rgba(15, 23, 42, 0.95);
  --text-secondary: rgba(15, 23, 42, 0.7);
  --text-muted: rgba(15, 23, 42, 0.5);
  --border-1: rgba(6, 182, 212, 0.12);
  --border-2: rgba(6, 182, 212, 0.2);
  --shadow-sm: 0 2px 8px rgba(6, 182, 212, 0.08);
  --shadow-md: 0 4px 16px rgba(6, 182, 212, 0.12);
  --shadow-lg: 0 8px 32px rgba(6, 182, 212, 0.15);
}

.body--dark .rk-user-dialog {
  --dialog-bg: rgba(10, 14, 20, 0.98);
  --surface-1: rgba(6, 182, 212, 0.05);
  --surface-2: rgba(6, 182, 212, 0.08);
  --surface-3: rgba(6, 182, 212, 0.12);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --border-1: rgba(6, 182, 212, 0.15);
  --border-2: rgba(6, 182, 212, 0.25);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* Dialog Wrapper */
.rk-user-dialog-wrapper :deep(.q-dialog__backdrop) {
  backdrop-filter: blur(8px);
  background: rgba(10, 14, 20, 0.7);
}

/* Dialog Container */
.rk-user-dialog {
  position: relative;
  width: 95vw;
  max-width: 1400px;
  height: 90vh;
  max-height: 900px;
  border-radius: 24px;
  background: var(--dialog-bg);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg);
  border: 1.5px solid var(--border-1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: "Sora", -apple-system, sans-serif;
}

/* Background Effects */
.rk-dialog-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.rk-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(var(--border-1) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-1) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
}

.rk-glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.08;
}

.rk-orb-1 {
  width: 350px;
  height: 350px;
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, var(--color-primary), transparent 60%);
}

.rk-orb-2 {
  width: 300px;
  height: 300px;
  bottom: -80px;
  left: -80px;
  background: radial-gradient(circle, var(--color-accent), transparent 60%);
}

/* Header */
.rk-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  background: var(--surface-1);
  border-bottom: 1.5px solid var(--border-1);
  z-index: 10;
}

.rk-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rk-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.rk-header-icon {
  position: relative;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent)
  );
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3);
}

.rk-header-icon .q-icon {
  font-size: 26px;
  color: #fff;
  z-index: 1;
}

.rk-icon-pulse {
  position: absolute;
  inset: -4px;
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent)
  );
  border-radius: 16px;
  opacity: 0;
  filter: blur(8px);
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%,
  100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }
}

.rk-header-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.rk-header-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

.rk-close-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: 1.5px solid var(--border-1);
  border-radius: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-header-btn {
  border-radius: 11px;
  border: 1px solid var(--border-1);
  background: var(--surface-2);
  color: var(--text-primary);
}

.rk-status-chip {
  font-weight: 700;
}

.rk-audit-strip {
  position: relative;
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 32px;
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-1);
}

.rk-audit-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.rk-close-btn:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
  color: var(--text-primary);
  transform: rotate(90deg);
}

.rk-close-btn .q-icon {
  font-size: 20px;
}

/* Progress Bar */
.rk-progress-container {
  position: relative;
  padding: 16px 32px;
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-1);
  z-index: 9;
}

.rk-progress-bar {
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.rk-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
}

.rk-progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.rk-progress-label span {
  color: var(--text-muted);
  font-weight: 600;
}

.rk-progress-label strong {
  font-weight: 800;
  color: var(--color-primary);
  font-family: "Space Mono", monospace;
}

.body--dark .rk-progress-label strong {
  color: var(--color-primary-light);
}

/* Body */
.rk-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.rk-splitter {
  height: 100%;
  background: transparent;
}

.rk-splitter :deep(.q-splitter__separator) {
  width: 1px;
  background: var(--border-1);
}

.rk-splitter :deep(.q-splitter__before),
.rk-splitter :deep(.q-splitter__after) {
  overflow-y: auto;
  overflow-x: hidden;
}

/* Form Container */
.rk-form-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Tabs Premium */
.rk-tabs-wrapper {
  padding: 20px 32px 0;
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-1);
}

.rk-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.rk-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.rk-tab::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--surface-2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rk-tab:hover::before {
  opacity: 1;
}

.rk-tab.active {
  background: var(--dialog-bg);
  border-color: var(--border-2);
  border-bottom-color: transparent;
}

.rk-tab.active::before {
  opacity: 0;
}

.rk-tab-icon {
  position: relative;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 10px;
  flex-shrink: 0;
  transition: all 0.3s ease;
  z-index: 1;
}

.rk-tab.active .rk-tab-icon {
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent)
  );
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-tab-icon .q-icon {
  font-size: 20px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.rk-tab.active .rk-tab-icon .q-icon {
  color: #fff;
}

.rk-tab-check {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
}

.body--dark .rk-tab-check {
  background: #4ade80;
}

.rk-tab-check .q-icon {
  font-size: 12px;
  color: #fff;
}

.rk-tab-content {
  flex: 1;
  text-align: left;
  z-index: 1;
}

.rk-tab-label {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 2px;
  transition: color 0.3s ease;
}

.rk-tab.active .rk-tab-label {
  color: var(--text-primary);
}

.rk-tab-desc {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.rk-tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rk-tab.active .rk-tab-indicator {
  opacity: 1;
}

/* Form */
.rk-form {
  flex: 1;
  overflow-y: auto;
}

.rk-panels {
  background: transparent;
  height: 100%;
}

.rk-panels :deep(.q-panel) {
  overflow-y: auto;
}

.rk-panel {
  padding: 28px 32px;
}

.rk-panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1.5px solid var(--border-1);
}

.rk-panel-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent)
  );
  border-radius: 12px;
  font-size: 24px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
}

.rk-panel-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.rk-panel-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Password Card Premium */
.rk-password-card {
  margin-top: 24px;
  padding: 20px;
  background: var(--surface-1);
  border: 1.5px solid var(--border-1);
  border-radius: 16px;
}

.rk-password-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.rk-password-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent)
  );
  border-radius: 11px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-password-icon .q-icon {
  font-size: 22px;
  color: #fff;
}

.rk-password-info {
  flex: 1;
}

.rk-password-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.rk-password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rk-strength-bar-container {
  flex: 1;
  max-width: 180px;
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
}

.rk-strength-bar {
  height: 100%;
  border-radius: 3px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-strength-weak {
  background: linear-gradient(90deg, #ef4444, #f87171);
}
.rk-strength-medium {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}
.rk-strength-good {
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
}
.rk-strength-excellent {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.rk-strength-label {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.rk-strength-weak {
  color: #ef4444;
}
.rk-strength-medium {
  color: #f59e0b;
}
.rk-strength-good {
  color: var(--color-primary);
}
.body--dark .rk-strength-good {
  color: var(--color-primary-light);
}
.rk-strength-excellent {
  color: #22c55e;
}
.body--dark .rk-strength-excellent {
  color: #4ade80;
}

.rk-generate-btn {
  border-radius: 10px;
  font-weight: 700;
  padding: 10px 20px;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
  transition: all 0.3s ease;
}

.rk-generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4);
}

.rk-invite-toggle {
  padding: 16px;
  background: var(--surface-2);
  border-radius: 12px;
  border: 1px solid var(--border-1);
}

.rk-checkbox :deep(.q-checkbox__inner) {
  width: 24px;
  height: 24px;
}

.rk-checkbox-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-left: 8px;
}

.rk-checkbox-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-3);
  border-radius: 8px;
  flex-shrink: 0;
}

.rk-checkbox-icon .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-checkbox-content strong {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.rk-checkbox-content p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* Summary Container */
.rk-summary-container {
  height: 100%;
  padding: 28px;
  background: var(--surface-1);
  border-left: 1.5px solid var(--border-1);
  overflow-y: auto;
}

.rk-summary-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1.5px solid var(--border-1);
}

.rk-summary-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent)
  );
  border-radius: 11px;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-summary-icon .q-icon {
  font-size: 22px;
  color: #fff;
}

.rk-summary-title {
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.rk-summary-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Footer */
.rk-footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  background: var(--surface-1);
  border-top: 1.5px solid var(--border-1);
  z-index: 10;
}

.rk-footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.rk-footer-info .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-footer-info kbd {
  padding: 4px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: "Space Mono", monospace;
  font-weight: 700;
  color: var(--text-primary);
}

.rk-footer-actions {
  display: flex;
  gap: 12px;
}

.rk-footer-btn {
  border-radius: 11px;
  font-weight: 700;
  padding: 12px 24px;
  text-transform: none;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-btn-cancel {
  color: var(--text-secondary);
  border: 1.5px solid var(--border-1);
  background: var(--surface-2);
}

.rk-btn-cancel:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
  color: var(--text-primary);
}

.rk-btn-secondary {
  color: var(--color-primary);
  border: 1.5px solid var(--border-2);
  background: var(--surface-2);
}

.body--dark .rk-btn-secondary {
  color: var(--color-primary-light);
}

.rk-btn-secondary:hover {
  background: var(--surface-3);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
}

.rk-btn-primary {
  position: relative;
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent)
  );
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3);
  overflow: hidden;
}

.rk-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
}

.rk-btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.6s ease;
}

.rk-btn-primary:hover .rk-btn-shine {
  left: 100%;
}

/* Responsive */
@media (max-width: 1200px) {
  .rk-user-dialog {
    width: 98vw;
    height: 95vh;
  }

  .rk-tabs {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1023px) {
  .rk-summary-container {
    display: none;
  }

  .rk-header {
    padding: 20px 24px;
  }

  .rk-progress-container {
    padding: 14px 24px;
  }

  .rk-tabs-wrapper {
    padding: 16px 24px 0;
  }

  .rk-panel {
    padding: 24px;
  }

  .rk-footer {
    padding: 16px 24px;
  }
}

@media (max-width: 767px) {
  .rk-user-dialog {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .rk-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 20px;
  }

  .rk-header-content {
    width: 100%;
  }

  .rk-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  .rk-progress-container {
    padding: 12px 20px;
  }

  .rk-tabs-wrapper {
    padding: 12px 20px 0;
  }

  .rk-tabs {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .rk-tab {
    border-radius: 12px;
    border-bottom-color: var(--border-1);
  }

  .rk-tab.active {
    border-bottom-color: var(--border-2);
  }

  .rk-tab-indicator {
    display: none;
  }

  .rk-panel {
    padding: 20px;
  }

  .rk-password-header {
    flex-wrap: wrap;
  }

  .rk-generate-btn {
    width: 100%;
  }

  .rk-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .rk-footer-info {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .rk-footer-actions {
    width: 100%;
    flex-direction: column;
  }

  .rk-footer-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 599px) {
  .rk-header-icon {
    width: 44px;
    height: 44px;
  }

  .rk-header-icon .q-icon {
    font-size: 22px;
  }

  .rk-header-title {
    font-size: 1.3rem;
  }

  .rk-tab-icon {
    width: 38px;
    height: 38px;
  }

  .rk-tab-icon .q-icon {
    font-size: 18px;
  }

  .rk-panel-icon {
    width: 42px;
    height: 42px;
    font-size: 22px;
  }
}
</style>
