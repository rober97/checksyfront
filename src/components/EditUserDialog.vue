<!-- src/components/EditUserDialog.vue -->
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
          <q-icon name="manage_accounts" size="22px" />
          <div class="text-subtitle1 text-weight-medium">Editar usuario</div>
          <q-badge :color="statusColor(form.status)" outline class="q-ml-sm">
            {{ statusNice(form.status) }}
          </q-badge>
        </div>

        <q-space />

        <div class="row items-center q-gutter-xs">
          <q-btn
            dense
            outline
            icon="key"
            label="Cambiar contraseña"
            @click="openPasswordDialog"
          />
          <q-btn dense round flat icon="close" @click="cancelar" />
        </div>
      </div>

      <q-separator />

      <!-- Body -->
      <div class="rk-body">
        <q-splitter v-model="split" :limits="[65, 85]" class="rk-splitter">
          <template #before>
            <div class="q-pa-md">
              <!-- Top audit -->
              <div
                class="row items-center q-gutter-md q-mb-sm text-caption text-grey-7"
              >
                <div class="row items-center q-gutter-xs">
                  <q-icon name="event" size="16px" />
                  <span>Creado: {{ friendly(audit.createdAt) }}</span>
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-icon name="event_available" size="16px" />
                  <span>Actualizado: {{ friendly(audit.updatedAt) }}</span>
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-icon name="schedule" size="16px" />
                  <span>Último acceso: {{ friendly(audit.lastLogin) }}</span>
                </div>
              </div>

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

              <q-form ref="formRef" greedy class="rk-form q-pt-sm">
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
                    <div class="row items-center q-gutter-sm q-mt-sm">
                      <q-select
                        v-model="form.status"
                        :options="statusOptions"
                        dense
                        outlined
                        emit-value
                        map-options
                        label="Estado de la cuenta"
                        class="col-12 col-sm-4"
                      >
                        <template #prepend><q-icon name="security" /></template>
                      </q-select>
                      <q-btn
                        outline
                        :color="
                          form.status === 'active' ? 'warning' : 'positive'
                        "
                        :icon="
                          form.status === 'active'
                            ? 'pause_circle'
                            : 'play_circle'
                        "
                        :label="
                          form.status === 'active' ? 'Suspender' : 'Activar'
                        "
                        @click="toggleActive"
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
                    <!-- pásale el rol para presets si quieres -->
                    <UserPermissionsForm
                      v-model="form.permissions"
                      :role="form.tipo"
                    />
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
        <q-btn
          flat
          color="negative"
          icon="delete"
          label="Eliminar"
          @click="confirmDelete"
        />
        <q-space />
        <q-btn flat label="Cerrar" @click="cancelar" />
        <q-btn
          color="primary"
          :label="saving ? 'Guardando…' : 'Guardar'"
          :loading="saving"
          class="q-ml-sm"
          @click="save(false)"
          unelevated
        />
        <q-btn
          color="primary"
          outline
          :disable="saving"
          class="q-ml-sm"
          label="Guardar y cerrar"
          @click="save(true)"
        />
      </div>
    </q-card>

    <!-- Cambiar contraseña -->
    <q-dialog v-model="pwdDialog">
      <q-card style="min-width: 380px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="key" />
          <div class="text-subtitle2">Cambiar contraseña</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input
            v-model="pwd"
            :type="showPwd ? 'text' : 'password'"
            label="Nueva contraseña"
            dense
            outlined
          >
            <template #append>
              <q-btn
                flat
                dense
                round
                :icon="showPwd ? 'visibility' : 'visibility_off'"
                @click="showPwd = !showPwd"
              />
            </template>
          </q-input>
          <q-btn
            flat
            dense
            icon="autorenew"
            label="Generar segura"
            @click="genPwd"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Actualizar"
            :disable="!pwd"
            @click="doChangePassword"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useToast } from "vue-toastification";
import { useUserStore } from "@/stores/userStore";
import { useCompaniesStore } from "@/stores/companies";

import UserBasicsForm from "./users/parts/UserBasicsForm.vue";
import UserContractForm from "./users/parts/UserContractForm.vue";
import UserContactForm from "./users/parts/UserContactForm.vue";
import UserPermissionsForm from "./users/parts/UserPermissionsForm.vue";
import UserSummary from "./users/parts/UserSummary.vue";
import { normalizeMoney, normalizeDecimal } from "@/utils/format";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  userId: { type: String, required: true },
});
const emit = defineEmits(["update:modelValue", "updated", "deleted"]);

const $q = useQuasar();
const toast = useToast();
const userStore = useUserStore();
const companiesStore = useCompaniesStore();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

/* UI state */
const formRef = ref(null);
const tab = ref("basicos");
const split = ref(70);
const saving = ref(false);

/* Catalogs */
const empresas = ref([]);
const empresasRaw = ref([]);
const horarios = ref([]);
const loadingEmpresas = ref(false);
const loadingHorarios = ref(false);

const statusOptions = [
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
  { label: "Suspendido", value: "suspended" },
];

/* Audit info */
const audit = reactive({ createdAt: null, updatedAt: null, lastLogin: null });

// --- ADD THIS IN EditUserDialog.vue ---
// Mismo shape que el de Crear, pero sin usar password (no se edita aquí)
function getEmptyForm() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    // password se maneja en el modal de "Cambiar contraseña"
    tipo: "empleado",
    company: null,
    rut: "",
    horarioLaboralId: null,
    status: "active",
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

/* Form & original snapshot (para diff) */
const form = reactive(getEmptyForm());
let original = null;

/* Open/close */
watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      tab.value = "basicos";
      split.value = 70;
      await loadEmpresas();
      await hydrate();
    }
  }
);

async function loadEmpresas() {
  loadingEmpresas.value = true;
  try {
    await companiesStore.fetchCompanies();
    empresasRaw.value = (companiesStore.companies || []).map((c) => ({
      id: c._id,
      name: c.name,
    }));
    empresas.value = empresasRaw.value.slice(0, 50);
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
  () => form.empresa,
  async (empresaId) => {
    if (form.tipo === "empleado" && empresaId) await loadHorarios(empresaId);
    else horarios.value = [];
  }
);
async function loadHorarios(empresaId) {
  loadingHorarios.value = true;
  try {
    await companiesStore.fetchWorkSchedulesByCompany(empresaId);
    horarios.value = (companiesStore.workSchedules || []).map((h) => ({
      id: h._id,
      name: h.name,
    }));
  } finally {
    loadingHorarios.value = false;
  }
}
function onTipoChange(val) {
  if (val !== "empleado") {
    form.horarioLaboralId = null;
    form.rut = "";
  } else if (val === "empleado" && form.empresa) {
    loadHorarios(form.empresa);
  }
}

/* Hydrate user */
async function hydrate() {
  await userStore.fetchUserById(props.userId);

  const currentUser = userStore.currentUser
  if (!currentUser) {
    toast.error("No se encontró el usuario");
    dialogVisible.value = false;
    return;
  }
  // map DB -> UI
  Object.assign(form, mapFromApi(currentUser));
  original = deepClone(form);
  Object.assign(audit, {
    createdAt: currentUser.createdAt,
    updatedAt: currentUser.updatedAt,
    lastLogin: currentUser.lastLogin,
  });
}

/* Save (diff) */
async function save(closeAfter) {
  try {
    saving.value = true;
    const patch = diff(original, form);
    debugger
    if (Object.keys(patch).length === 0) {
      toast.info("No hay cambios para guardar");
      if (closeAfter) dialogVisible.value = false;
      return;
    }
    // Normaliza payroll antes de enviar
    normalizePatch(patch);

    await userStore.updateUser({ id: props.userId, patch });
    toast.success("Cambios guardados");
    emit("updated");
    // refresca snapshot
    original = deepClone(form);
    if (closeAfter) dialogVisible.value = false;
  } catch (e) {
    toast.error("No se pudo guardar");
  } finally {
    saving.value = false;
  }
}

function normalizePatch(p) {
  if (p.payroll) {
    const pp = p.payroll;
    [
      "baseSalary",
      "apv",
      "gratificacion",
      "bonoColacion",
      "bonoMovilizacion",
      "descuentoPrestamo",
    ].forEach((k) => {
      if (pp[k] !== undefined) pp[k] = normalizeMoney(pp[k]);
    });
    if (pp.isapreUf !== undefined)
      pp.isapreUf = Number(normalizeDecimal(pp.isapreUf));
  }
}

function cancelar() {
  // aviso si hay cambios
  const hasChanges = Object.keys(diff(original, form)).length > 0;
  if (!hasChanges) {
    dialogVisible.value = false;
    return;
  }
  $q.dialog({
    title: "Descartar cambios",
    message: "Tienes cambios sin guardar. ¿Cerrar de todos modos?",
    ok: { label: "Descartar" },
    cancel: { label: "Seguir editando" },
  }).onOk(() => {
    dialogVisible.value = false;
  });
}

/* Toggle active/inactive */
async function toggleActive() {
  const next = form.status === "active" ? "suspended" : "active";
  try {
    await userStore.toggleStatus({ id: props.userId, status: next });
    form.status = next;
    original.status = next;
    toast.success(next === "active" ? "Cuenta activada" : "Cuenta suspendida");
  } catch (e) {
    toast.error("No se pudo cambiar el estado");
  }
}

/* Delete */
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
    } catch (e) {
      toast.error("No se pudo eliminar");
    }
  });
}

/* Password modal */
const pwdDialog = ref(false);
const pwd = ref("");
const showPwd = ref(false);
function openPasswordDialog() {
  pwdDialog.value = true;
}
function genPwd() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%*";
  let pass = "";
  for (let i = 0; i < 12; i++)
    pass += chars[Math.floor(Math.random() * chars.length)];
  pwd.value = pass;
}
async function doChangePassword() {
  if (!pwd.value || pwd.value.length < 6) {
    toast.error("Mínimo 6 caracteres");
    return;
  }
  try {
    await userStore.changePassword({
      id: props.userId,
      newPassword: pwd.value,
    });
    toast.success("Contraseña actualizada");
    pwdDialog.value = false;
    pwd.value = "";
  } catch (e) {
    toast.error("No se pudo cambiar la contraseña");
  }
}

/* Helpers */
function mapFromApi(u) {
  return {
    firstName: u.firstName || "",
    lastName: u.lastName || "",
    email: u.email || "",
    password: "", // no se usa en edición
    tipo: mapRoleToUI(u.role),
    empresa: u.company?._id || u.company || null,
    rut: u.rut || "",
    horarioLaboralId: u.workSchedule?._id || u.workSchedule || null,
    status: u.status || "active",
    phone: u.phone || "",
    emergencyContact: u.emergencyContact || "",
    address: {
      line1: u.address?.line1 || "",
      commune: u.address?.commune || "",
      city: u.address?.city || "",
      region: u.address?.region || "",
    },
    permissions: Array.isArray(u.permissions) ? u.permissions.slice() : [],
    payroll: {
      baseSalary: u.payroll?.baseSalary ?? 0,
      contractType: u.payroll?.contractType || "",
      jornada: u.payroll?.jornada || "",
      startDate: u.payroll?.startDate ? u.payroll.startDate.slice(0, 10) : "",
      afp: u.payroll?.afp || "",
      saludSistema: u.payroll?.saludSistema || "",
      isaprePlan: u.payroll?.isaprePlan || "",
      isapreUf: u.payroll?.isapreUf ?? 0,
      apv: u.payroll?.apv ?? 0,
      cargasFamiliares: u.payroll?.cargasFamiliares ?? 0,
      banco: u.payroll?.banco || "",
      tipoCuenta: u.payroll?.tipoCuenta || "",
      numeroCuenta: u.payroll?.numeroCuenta || "",
      gratificacion: u.payroll?.gratificacion ?? 0,
      bonoColacion: u.payroll?.bonoColacion ?? 0,
      bonoMovilizacion: u.payroll?.bonoMovilizacion ?? 0,
      descuentoPrestamo: u.payroll?.descuentoPrestamo ?? 0,
    },
  };
}
function mapRoleToUI(role) {
  return role === "company"
    ? "empresa"
    : role === "employee"
    ? "empleado"
    : role;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* shallow diff por claves anidadas (obj plano/arrays/objetos anidados simples) */
function diff(a, b, path = "") {
  const out = {};
  const aKeys = new Set(Object.keys(a || {}));
  const bKeys = new Set(Object.keys(b || {}));
  const keys = new Set([...aKeys, ...bKeys]);
  for (const k of keys) {
    const pa = a?.[k],
      pb = b?.[k];
    const keyPath = path ? `${path}.${k}` : k;
    if (Array.isArray(pa) || Array.isArray(pb)) {
      const sa = JSON.stringify(pa ?? []);
      const sb = JSON.stringify(pb ?? []);
      if (sa !== sb) out[k] = pb;
    } else if (isPlainObject(pa) || isPlainObject(pb)) {
      const d = diff(pa || {}, pb || {}, keyPath);
      if (Object.keys(d).length) out[k] = d;
    } else {
      if (pa !== pb) out[k] = pb;
    }
  }
  return out;
}
function isPlainObject(o) {
  return o && typeof o === "object" && !Array.isArray(o);
}

function friendly(d) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(d));
  } catch {
    return "—";
  }
}

/* UI helpers for badges */
function statusNice(s) {
  return (
    { active: "Activo", inactive: "Inactivo", suspended: "Suspendido" }[s] ||
    s ||
    "—"
  );
}
function statusColor(s) {
  return s === "active" ? "positive" : s === "inactive" ? "grey" : "warning";
}
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
</style>
