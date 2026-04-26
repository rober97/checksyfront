<template>
  <q-dialog
    v-model="dialogVisible"
    persistent
    transition-show="fade"
    transition-hide="fade"
    class="rk-user-dialog-wrapper"
  >
    <q-card class="rk-user-dialog" :class="{ 'is-dark': $q.dark.isActive }">
      <!-- Header -->
      <div class="rk-header">
        <div class="rk-header-content">
          <div class="rk-header-icon">
            <q-icon :name="isEditMode ? 'manage_accounts' : 'person_add'" />
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

                  <!-- Panel: Turnos (solo turnos por demanda, en edición) -->
                  <q-tab-panel v-if="showShiftsTab" name="turnos" class="rk-panel">
                    <div class="rk-panel-header">
                      <q-icon name="event_available" class="rk-panel-icon" />
                      <div>
                        <h4 class="rk-panel-title">Turnos programados</h4>
                        <p class="rk-panel-subtitle">
                          Empleado con turnos por demanda · agenda fechas y horas específicas.
                          Se enviarán recordatorios automáticos en su app móvil.
                        </p>
                      </div>
                    </div>
                    <ShiftCalendar
                      :user-id="props.userId"
                      :company-id="form.empresa"
                      :schedule-id="form.workScheduleChoice?.scheduleId"
                    />
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
import ShiftCalendar from "./users/ShiftCalendar.vue";

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

// Tipo de horario actual (sólo poblado en modo edición)
const currentScheduleType = ref(null);

// Empleado oncall en modo edición → habilitamos el tab "Turnos"
const showShiftsTab = computed(
  () =>
    isEditMode.value &&
    form.value?.tipo === "empleado" &&
    !!props.userId &&
    currentScheduleType.value === "oncall"
);

const tabs = computed(() => {
  const base = [
    { value: "basicos",  label: "Básicos",  icon: "badge", desc: "Datos personales" },
    { value: "contrato", label: "Contrato", icon: "work",  desc: "Información laboral" },
    { value: "contacto", label: "Contacto", icon: "home",  desc: "Dirección y teléfono" },
  ];
  if (showShiftsTab.value) {
    base.push({
      value: "turnos",
      label: "Turnos",
      icon: "event_available",
      desc: "Programar fechas",
    });
  }
  return base;
});

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

  // Detectar tipo de horario (oncall vs weekly/etc.) desde el populate del backend.
  // Si no viene populado, lo pedimos a /work-schedule.
  let wsType = currentUser.workSchedule?.type || null;
  let wsOncall = currentUser.workSchedule?.oncall || null;
  const wsId = currentUser.workSchedule?._id || currentUser.workSchedule || null;

  if (wsId && !wsType) {
    try {
      const { data } = await import("@/utils/secureRequest").then((m) =>
        m.default.get("/work-schedule", { params: { active: true } })
      );
      const found = (data?.items || []).find((x) => String(x._id) === String(wsId));
      if (found) {
        wsType = found.type;
        wsOncall = found.oncall || null;
      }
    } catch {}
  }

  currentScheduleType.value = wsType || null;

  form.value = {
    ...getEmptyForm(),
    ...mapFromApi(currentUser),
    password: "",
    passwordConfirm: "",
    workScheduleChoice: {
      mode: wsType === "oncall" ? "oncall" : "fixed",
      scheduleId: wsId,
      oncall: wsType === "oncall" ? (wsOncall || { defaultDays: [], allowAnyDay: true }) : null,
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

  const isAdminRole = ["admin_rrhh", "admin", "rrhh", "empresa"].includes(String(form.value.tipo))

  if (isAdminRole) {
    if (!Array.isArray(form.value.empresas) || form.value.empresas.length === 0) {
      toast.error("Debes seleccionar al menos una empresa.");
      tab.value = "basicos";
      return;
    }
  } else if (!form.value.empresa) {
    toast.error("Debes seleccionar una empresa.");
    tab.value = "basicos";
    return;
  }

  if (form.value.tipo === "empleado") {
    const wc = form.value.workScheduleChoice || {};
    const oncallOk = wc.mode === "oncall";
    if (!oncallOk && !wc.scheduleId) {
      toast.error("Selecciona un horario laboral o usa el modo de turnos por demanda.");
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
  const isAdminRole = ["admin_rrhh", "admin", "rrhh", "empresa"].includes(String(f.tipo))
  const companies = isAdminRole
    ? (Array.isArray(f.empresas) ? f.empresas : []).filter(Boolean)
    : (f.empresa ? [f.empresa] : [])
  return {
    firstName: f.firstName?.trim() || "",
    lastName: f.lastName?.trim() || "",
    email: f.email?.trim().toLowerCase() || "",
    password: f.password || "",
    rut: f.tipo === "empleado" ? f.rut : null,
    role: f.tipo,
    company: f.empresa || companies[0] || null,
    companies,
    workSchedule: f.workScheduleChoice?.scheduleId || null,
    workScheduleChoice: f.workScheduleChoice || null,
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
    empresas: [],
    rut: "",
    horarioLaboralId: null,
    workScheduleChoice: { mode: "fixed", scheduleId: null, oncall: null },
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
/* ══════════════════════════════════════════════════
   DESIGN TOKENS — single source of truth
   Paleta neutra + un único color de acento (indigo)
   alineado con la página padre (GestionUsuarios).
══════════════════════════════════════════════════ */
.rk-user-dialog {
  --rk-bg:           #ffffff;
  --rk-surface:      #f7f8fc;
  --rk-surface-2:    #eef0f6;
  --rk-border:       rgba(15, 17, 23, 0.08);
  --rk-border-2:     rgba(15, 17, 23, 0.14);
  --rk-text:         #0f1117;
  --rk-text-2:       #5a6482;
  --rk-text-3:       #9aa1b9;
  --rk-accent:       #6366f1;
  --rk-accent-hover: #4f46e5;
  --rk-accent-soft:  rgba(99, 102, 241, 0.10);
  --rk-success:      #16a34a;
  --rk-success-soft: rgba(22, 163, 74, 0.12);
  --rk-warn:         #d97706;
  --rk-warn-soft:    rgba(217, 119, 6, 0.12);
  --rk-err:          #dc2626;
  --rk-err-soft:     rgba(220, 38, 38, 0.10);
  --rk-shadow:
    0 28px 64px -16px rgba(15, 17, 23, 0.32),
    0 8px 20px -4px rgba(15, 17, 23, 0.16);
  --rk-radius:       16px;
  --rk-radius-sm:    10px;
  --rk-ff:           'DM Sans', 'Segoe UI', system-ui, sans-serif;
  --rk-ff-mono:      ui-monospace, 'JetBrains Mono', monospace;
}

.rk-user-dialog.is-dark {
  --rk-bg:           #141720;
  --rk-surface:      #1a1e2a;
  --rk-surface-2:    #232838;
  --rk-border:       rgba(255, 255, 255, 0.08);
  --rk-border-2:     rgba(255, 255, 255, 0.16);
  --rk-text:         #e8eaf2;
  --rk-text-2:       #8b92ad;
  --rk-text-3:       #555d78;
  --rk-accent-soft:  rgba(99, 102, 241, 0.18);
  --rk-success-soft: rgba(22, 163, 74, 0.18);
  --rk-warn-soft:    rgba(217, 119, 6, 0.20);
  --rk-err-soft:     rgba(220, 38, 38, 0.18);
  --rk-shadow:
    0 32px 80px -12px rgba(0, 0, 0, 0.65),
    0 12px 24px -8px rgba(0, 0, 0, 0.50);
}

/* ══════════════════════════════════════════════════
   BACKDROP — fuerte, para que se vea el modal
══════════════════════════════════════════════════ */
.rk-user-dialog-wrapper :deep(.q-dialog__backdrop) {
  backdrop-filter: blur(6px);
  background: rgba(8, 10, 16, 0.55);
}
.body--dark .rk-user-dialog-wrapper :deep(.q-dialog__backdrop) {
  background: rgba(0, 0, 0, 0.72);
}

/* Quasar pone max-width: 560px por defecto en el wrapper interno
   cuando el dialog no está maximizado. Lo neutralizamos para que
   nuestro q-card pueda usar todo el ancho que definimos. */
.rk-user-dialog-wrapper :deep(.q-dialog__inner) {
  padding: 16px;
}
.rk-user-dialog-wrapper :deep(.q-dialog__inner--minimized > div),
.rk-user-dialog-wrapper :deep(.q-dialog__inner > div) {
  max-width: none;
  max-height: none;
}

/* ══════════════════════════════════════════════════
   DIALOG CONTAINER — flotante, con borde y sombra
══════════════════════════════════════════════════ */
.rk-user-dialog {
  position: relative;
  width: min(1180px, 96vw);
  height: min(88vh, 860px);
  max-width: none;
  max-height: none;
  border-radius: var(--rk-radius);
  background: var(--rk-bg);
  color: var(--rk-text);
  box-shadow: var(--rk-shadow);
  border: 1px solid var(--rk-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--rk-ff);
}

/* ══════════════════════════════════════════════════
   HEADER — compacto, sin gradientes
══════════════════════════════════════════════════ */
.rk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--rk-border);
  background: var(--rk-bg);
}

.rk-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.rk-header-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
  border-radius: 10px;
  flex-shrink: 0;
}
.rk-header-icon .q-icon { font-size: 20px; }

.rk-header-title {
  font-size: 15.5px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.2px;
  color: var(--rk-text);
  line-height: 1.25;
}

.rk-header-subtitle {
  font-size: 12px;
  color: var(--rk-text-2);
  margin: 2px 0 0 0;
  font-weight: 500;
  line-height: 1.3;
}

.rk-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rk-header-btn {
  border-radius: 8px !important;
  border: 1px solid var(--rk-border) !important;
  background: var(--rk-surface) !important;
  color: var(--rk-text) !important;
  font-size: 12px !important;
  padding: 4px 10px !important;
}

.rk-status-chip { font-weight: 600; }

.rk-close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--rk-border);
  border-radius: 8px;
  color: var(--rk-text-2);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.rk-close-btn:hover {
  background: var(--rk-err-soft);
  border-color: rgba(220, 38, 38, 0.28);
  color: var(--rk-err);
}
.rk-close-btn .q-icon { font-size: 17px; }

/* ══════════════════════════════════════════════════
   AUDIT STRIP
══════════════════════════════════════════════════ */
.rk-audit-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 20px;
  background: var(--rk-surface);
  border-bottom: 1px solid var(--rk-border);
}
.rk-audit-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--rk-bg);
  border: 1px solid var(--rk-border);
  color: var(--rk-text-2);
  font-size: 11.5px;
  font-weight: 500;
}
.rk-audit-item .q-icon {
  font-size: 13px;
  color: var(--rk-text-3);
}

/* ══════════════════════════════════════════════════
   PROGRESS BAR — sutil, una sola línea
══════════════════════════════════════════════════ */
.rk-progress-container {
  padding: 10px 20px 12px;
  background: var(--rk-bg);
  border-bottom: 1px solid var(--rk-border);
}
.rk-progress-bar {
  height: 4px;
  background: var(--rk-surface-2);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 6px;
}
.rk-progress-fill {
  height: 100%;
  background: var(--rk-accent);
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.rk-progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10.5px;
}
.rk-progress-label span {
  color: var(--rk-text-3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.rk-progress-label strong {
  font-weight: 700;
  color: var(--rk-accent);
  font-family: var(--rk-ff-mono);
}

/* ══════════════════════════════════════════════════
   BODY + SPLITTER
══════════════════════════════════════════════════ */
.rk-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--rk-bg);
  min-height: 0;
}
.rk-splitter {
  height: 100%;
  background: transparent;
}
.rk-splitter :deep(.q-splitter__separator) {
  width: 1px;
  background: var(--rk-border);
}
.rk-splitter :deep(.q-splitter__before),
.rk-splitter :deep(.q-splitter__after) {
  overflow-y: auto;
  overflow-x: hidden;
}

/* Scrollbars unificados para TODOS los contenedores con scroll
   dentro del modal (splitter, paneles de tabs, summary). */
.rk-user-dialog :deep(*)::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.rk-user-dialog :deep(*)::-webkit-scrollbar-track {
  background: transparent;
}
.rk-user-dialog :deep(*)::-webkit-scrollbar-thumb {
  background: var(--rk-border-2);
  border-radius: 999px;
  border: 2px solid var(--rk-bg);
  background-clip: padding-box;
}
.rk-user-dialog :deep(*)::-webkit-scrollbar-thumb:hover {
  background: var(--rk-text-3);
  background-clip: padding-box;
  border: 2px solid var(--rk-bg);
}
.rk-user-dialog :deep(*) {
  scrollbar-width: thin;
  scrollbar-color: var(--rk-border-2) transparent;
}

/* ══════════════════════════════════════════════════
   FORM CONTAINER + TABS — limpio, sin gradientes
══════════════════════════════════════════════════ */
.rk-form-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--rk-bg);
}

.rk-tabs-wrapper {
  padding: 10px 20px 0;
  background: var(--rk-bg);
  border-bottom: 1px solid var(--rk-border);
}

.rk-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.rk-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}
.rk-tab:hover { background: var(--rk-surface); }
.rk-tab.active { background: var(--rk-surface); }

.rk-tab-icon {
  position: relative;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-surface-2);
  color: var(--rk-text-2);
  border-radius: 8px;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.rk-tab.active .rk-tab-icon {
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
}
.rk-tab-icon .q-icon { font-size: 16px; }

.rk-tab-check {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-success);
  border: 2px solid var(--rk-bg);
  border-radius: 50%;
}
.rk-tab-check .q-icon {
  font-size: 8px;
  color: #fff;
}

.rk-tab-content { flex: 1; min-width: 0; }
.rk-tab-label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--rk-text-2);
  line-height: 1.25;
}
.rk-tab.active .rk-tab-label { color: var(--rk-text); }
.rk-tab-desc {
  display: block;
  font-size: 11px;
  color: var(--rk-text-3);
  font-weight: 500;
  margin-top: 1px;
}

.rk-tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 12px;
  right: 12px;
  height: 2px;
  background: var(--rk-accent);
  border-radius: 2px 2px 0 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.rk-tab.active .rk-tab-indicator { opacity: 1; }

/* ══════════════════════════════════════════════════
   PANELS
══════════════════════════════════════════════════ */
.rk-form {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.rk-panels {
  background: transparent;
  height: 100%;
  flex: 1;
  min-height: 0;
}
.rk-panels :deep(.q-panel) { overflow-y: auto; }
.rk-panel { padding: 16px 20px; }

.rk-panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rk-border);
}
.rk-panel-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
  border-radius: 9px;
  font-size: 17px;
  flex-shrink: 0;
}
.rk-panel-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  color: var(--rk-text);
  letter-spacing: -0.1px;
  line-height: 1.25;
}
.rk-panel-subtitle {
  font-size: 11.5px;
  color: var(--rk-text-2);
  margin: 2px 0 0 0;
  font-weight: 500;
}

/* ══════════════════════════════════════════════════
   PASSWORD CARD — compacta
══════════════════════════════════════════════════ */
.rk-password-card {
  margin-top: 14px;
  padding: 14px;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 12px;
}
.rk-password-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.rk-password-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
  border-radius: 9px;
  flex-shrink: 0;
}
.rk-password-icon .q-icon { font-size: 17px; }
.rk-password-info { flex: 1; min-width: 0; }
.rk-password-title {
  font-size: 12.5px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: var(--rk-text);
}
.rk-password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rk-strength-bar-container {
  flex: 1;
  max-width: 160px;
  height: 4px;
  background: var(--rk-surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.rk-strength-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s, background 0.3s;
}
.rk-strength-bar.rk-strength-weak     { background: var(--rk-err); }
.rk-strength-bar.rk-strength-medium   { background: var(--rk-warn); }
.rk-strength-bar.rk-strength-good     { background: var(--rk-accent); }
.rk-strength-bar.rk-strength-excellent{ background: var(--rk-success); }

.rk-strength-label {
  font-size: 11.5px;
  font-weight: 600;
}
.rk-strength-label.rk-strength-weak     { color: var(--rk-err); }
.rk-strength-label.rk-strength-medium   { color: var(--rk-warn); }
.rk-strength-label.rk-strength-good     { color: var(--rk-accent); }
.rk-strength-label.rk-strength-excellent{ color: var(--rk-success); }

.rk-generate-btn {
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  padding: 6px 12px;
}

.rk-invite-toggle {
  padding: 10px 12px;
  background: var(--rk-bg);
  border-radius: 10px;
  border: 1px solid var(--rk-border);
}
.rk-checkbox :deep(.q-checkbox__inner) {
  width: 22px;
  height: 22px;
}
.rk-checkbox-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-left: 6px;
}
.rk-checkbox-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
  border-radius: 8px;
  flex-shrink: 0;
}
.rk-checkbox-icon .q-icon { font-size: 14px; }
.rk-checkbox-content strong {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--rk-text);
}
.rk-checkbox-content p {
  font-size: 11.5px;
  color: var(--rk-text-2);
  margin: 0;
  line-height: 1.4;
}

/* ══════════════════════════════════════════════════
   CATALOG ERROR
══════════════════════════════════════════════════ */
.rk-catalog-error {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(220, 38, 38, 0.25);
  background: var(--rk-err-soft);
  color: var(--rk-text);
}
.rk-catalog-error .q-icon {
  color: var(--rk-err);
  font-size: 17px;
  margin-top: 1px;
}
.rk-catalog-error strong {
  font-size: 12.5px;
  color: var(--rk-text);
}
.rk-catalog-error p {
  margin: 4px 0 0 0;
  font-size: 11.5px;
  color: var(--rk-text-2);
}

/* ══════════════════════════════════════════════════
   SUMMARY (right pane)
══════════════════════════════════════════════════ */
.rk-summary-container {
  height: 100%;
  padding: 16px 20px;
  background: var(--rk-surface);
  border-left: 1px solid var(--rk-border);
  overflow-y: auto;
}
.rk-summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rk-border);
}
.rk-summary-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
  border-radius: 9px;
  flex-shrink: 0;
}
.rk-summary-icon .q-icon { font-size: 17px; }
.rk-summary-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  color: var(--rk-text);
  letter-spacing: -0.1px;
  line-height: 1.25;
}
.rk-summary-subtitle {
  font-size: 11.5px;
  color: var(--rk-text-2);
  margin: 2px 0 0 0;
  font-weight: 500;
}

/* ══════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════ */
.rk-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 20px;
  background: var(--rk-bg);
  border-top: 1px solid var(--rk-border);
}
.rk-footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--rk-text-3);
  font-weight: 500;
}
.rk-footer-info .q-icon {
  font-size: 15px;
  color: var(--rk-text-3);
}
.rk-footer-info kbd {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-bottom-width: 2px;
  border-radius: 5px;
  font-size: 10.5px;
  font-family: var(--rk-ff-mono);
  font-weight: 600;
  color: var(--rk-text-2);
  margin: 0 2px;
}
.rk-footer-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.rk-footer-btn {
  border-radius: 8px;
  font-weight: 600;
  font-size: 12.5px;
  padding: 7px 14px;
  text-transform: none;
  letter-spacing: 0;
  transition: transform 0.12s, box-shadow 0.12s, background 0.15s;
}
.rk-btn-cancel { color: var(--rk-text-2) !important; }
.rk-btn-cancel:hover {
  background: var(--rk-surface) !important;
  color: var(--rk-text) !important;
}

.rk-btn-secondary {
  color: var(--rk-accent) !important;
  border: 1px solid var(--rk-border-2) !important;
  background: var(--rk-bg) !important;
}
.rk-btn-secondary:hover {
  background: var(--rk-accent-soft) !important;
  border-color: var(--rk-accent) !important;
}

.rk-btn-primary {
  background: var(--rk-accent) !important;
  color: #fff !important;
}
.rk-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(99, 102, 241, 0.30);
}
.rk-btn-shine { display: none; }

/* ══════════════════════════════════════════════════
   QUASAR FIELD HARMONIZATION (todos los inputs)
══════════════════════════════════════════════════ */
.rk-user-dialog :deep(.q-field--outlined .q-field__control) {
  border-radius: 9px;
  min-height: 40px;
  background: var(--rk-bg);
}
.rk-user-dialog :deep(.q-field--outlined .q-field__control::before) {
  border-color: var(--rk-border);
}
.rk-user-dialog :deep(.q-field--outlined:hover .q-field__control::before) {
  border-color: var(--rk-border-2);
}
.rk-user-dialog :deep(.q-field--outlined.q-field--focused .q-field__control::after) {
  border-color: var(--rk-accent);
  border-width: 1.5px;
}
.rk-user-dialog :deep(.q-field__label) {
  color: var(--rk-text-2);
  font-weight: 500;
  font-size: 12.5px;
}
.rk-user-dialog :deep(.q-field__native),
.rk-user-dialog :deep(.q-field__input) {
  color: var(--rk-text);
  font-size: 13px;
}
.rk-user-dialog :deep(.q-field__messages) { font-size: 10.5px; }
.rk-user-dialog :deep(.q-field__prepend),
.rk-user-dialog :deep(.q-field__append) {
  color: var(--rk-text-3);
}

/* ══════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════ */
@media (max-width: 1023px) {
  .rk-summary-container { display: none; }
}

@media (max-width: 767px) {
  .rk-user-dialog {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    border: none;
  }
  .rk-header { padding: 12px 14px; }
  .rk-audit-strip { padding: 8px 14px; }
  .rk-progress-container { padding: 8px 14px 10px; }
  .rk-tabs-wrapper { padding: 8px 14px 0; }
  .rk-tabs { grid-template-columns: 1fr; gap: 4px; }
  .rk-tab { border-radius: 8px; }
  .rk-tab-indicator { display: none; }
  .rk-panel { padding: 12px 14px; }
  .rk-summary-container { padding: 12px 14px; }
  .rk-footer {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 14px;
  }
  .rk-footer-info { justify-content: center; text-align: center; }
  .rk-footer-actions { justify-content: stretch; }
  .rk-footer-btn { flex: 1; justify-content: center; }
}

@media (max-width: 480px) {
  .rk-header-title { font-size: 14px; }
  .rk-header-subtitle { display: none; }
  .rk-password-header { flex-wrap: wrap; }
  .rk-generate-btn { width: 100%; }
}
</style>
