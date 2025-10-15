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
          <q-btn dense outline icon="key" label="Cambiar contraseña" @click="openPasswordDialog" />
          <q-btn dense round flat icon="close" @click="cancelar" />
        </div>
      </div>

      <q-separator />

      <!-- Body -->
      <div class="rk-body">
        <q-splitter v-model="split" :limits="[65, 85]" class="rk-splitter">
          <template #before>
            <div class="q-pa-md">
              <div class="row items-center q-gutter-md q-mb-sm text-caption text-grey-7">
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

              <q-tabs v-model="tab" dense class="rk-tabs text-primary" active-color="primary"
                      indicator-color="primary" align="left" narrow-indicator>
                <q-tab name="basicos" label="Básicos" icon="badge" />
                <q-tab name="contrato" label="Contrato & Sueldo" icon="work" />
                <q-tab name="contacto" label="Dirección & Contacto" icon="home" />
                <q-tab name="permisos" label="Permisos" icon="admin_panel_settings" />
              </q-tabs>

              <q-separator />

              <q-form ref="formRef" greedy class="rk-form q-pt-sm">
                <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade">
                  <q-tab-panel name="basicos" class="q-pt-sm">
                    <UserBasicsForm
                      v-model="formModel"
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
                        dense outlined emit-value map-options
                        label="Estado de la cuenta"
                        class="col-12 col-sm-4"
                      >
                        <template #prepend><q-icon name="security" /></template>
                      </q-select>
                      <q-btn
                        outline
                        :color="form.status === 'active' ? 'warning' : 'positive'"
                        :icon="form.status === 'active' ? 'pause_circle' : 'play_circle'"
                        :label="form.status === 'active' ? 'Suspender' : 'Activar'"
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
                    <UserPermissionsForm v-model="form.permissions" :role="form.tipo" />
                  </q-tab-panel>
                </q-tab-panels>
              </q-form>
            </div>
          </template>

          <template #after>
            <UserSummary
              class="rk-summary q-pa-md"
              :class="[$q.dark.isActive ? 'rk-summary--dark' : 'rk-summary--light']"
              :form="form"
              :empresas-raw="empresasRaw"
            />
          </template>
        </q-splitter>
      </div>

      <!-- Footer -->
      <div class="rk-footer row items-center">
        <q-btn flat color="negative" icon="delete" label="Eliminar" @click="confirmDelete" />
        <q-space />
        <q-btn flat label="Cerrar" @click="cancelar" />
        <q-btn color="primary" :label="saving ? 'Guardando…' : 'Guardar'" :loading="saving"
               class="q-ml-sm" @click="save(false)" unelevated />
        <q-btn color="primary" outline :disable="saving" class="q-ml-sm"
               label="Guardar y cerrar" @click="save(true)" />
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
          <q-input v-model="pwd" :type="showPwd ? 'text' : 'password'" label="Nueva contraseña" dense outlined>
            <template #append>
              <q-btn flat dense round :icon="showPwd ? 'visibility' : 'visibility_off'"
                     @click="showPwd = !showPwd" />
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
  </q-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, nextTick } from "vue";
import { useQuasar } from "quasar";
import { useToast } from "vue-toastification";
import { useUserStore } from "@/stores/userStore";

import UserBasicsForm from "./users/parts/UserBasicsForm.vue";
import UserContractForm from "./users/parts/UserContractForm.vue";
import UserContactForm from "./users/parts/UserContactForm.vue";
import UserPermissionsForm from "./users/parts/UserPermissionsForm.vue";
import UserSummary from "./users/parts/UserSummary.vue";

import { useCompanies } from "@/composables/useCompanies";
import { getEmptyUserForm, normalizeUserPatch, statusNice, statusColor, friendly } from "@/composables/useUserForm";
import { mapFromApi, buildApiPatch } from "@/utils/userMapping";
import { diff, deepClone } from "@/utils/diff";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  userId: { type: String, required: true },
});
const emit = defineEmits(["update:modelValue", "updated", "deleted"]);

const $q = useQuasar();
const toast = useToast();
const userStore = useUserStore();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

/* UI state */
const formRef = ref(null);
const tab = ref("basicos");
const split = ref(70);
const saving = ref(false);

/* Catálogos */
const {
  empresas, empresasRaw, horarios,
  loadingEmpresas, loadingHorarios,
  loadEmpresas, loadHorarios, filterEmpresas
} = useCompanies();

const statusOptions = [
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
  { label: "Suspendido", value: "suspended" },
];

/* Audit info */
const audit = reactive({ createdAt: null, updatedAt: null, lastLogin: null });

/* Form + snapshot */
const form = reactive(getEmptyUserForm());

// ✅ Proxy v-model que MERGEA en la misma referencia
const formModel = computed({
  get: () => form,
  set: (v) => { if (v && typeof v === "object") Object.assign(form, v); }
});

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

watch(
  () => form.empresa,
  async (empresaId) => {
    if (form.tipo === "empleado" && empresaId) await loadHorarios(empresaId);
    else horarios.value = [];
  }
);
function onTipoChange(val) {
  if (val !== "empleado") form.horarioLaboralId = null;
  else if (form.empresa) loadHorarios(form.empresa);
}

/* Hydrate */
async function hydrate() {
  const res = await userStore.fetchUserById(props.userId);
  const currentUser = res?.data || userStore.currentUser;
  if (!currentUser) {
    toast.error("No se encontró el usuario");
    dialogVisible.value = false;
    return;
  }
  Object.assign(form, mapFromApi(currentUser));
  await nextTick();               // 👈 asegura pintado inmediato en primera apertura
  original = deepClone(form);
  Object.assign(audit, {
    createdAt: currentUser.createdAt,
    updatedAt: currentUser.updatedAt,
    lastLogin: currentUser.lastLogin,
  });
}

/* Save */
async function save(closeAfter) {
  try {
    saving.value = true;
    const uiPatch = diff(original, form);
    if (Object.keys(uiPatch).length === 0) {
      toast.info("No hay cambios para guardar");
      if (closeAfter) dialogVisible.value = false;
      return;
    }
    const apiPatch = buildApiPatch(uiPatch);
    normalizeUserPatch(apiPatch);

    await userStore.updateUser({ id: props.userId, patch: apiPatch });
    toast.success("Cambios guardados");
    emit("updated");
    original = deepClone(form);
    if (closeAfter) dialogVisible.value = false;
  } catch (e) {
    toast.error("No se pudo guardar");
  } finally {
    saving.value = false;
  }
}

function cancelar() {
  const hasChanges = Object.keys(diff(original, form)).length > 0;
  if (!hasChanges) { dialogVisible.value = false; return; }
  $q.dialog({
    title: "Descartar cambios",
    message: "Tienes cambios sin guardar. ¿Cerrar de todos modos?",
    ok: { label: "Descartar" },
    cancel: { label: "Seguir editando" },
  }).onOk(() => { dialogVisible.value = false; });
}

/* Toggle active/inactive */
async function toggleActive() {
  const next = form.status === "active" ? "suspended" : "active";
  try {
    await userStore.toggleStatus({ id: props.userId, status: next });
    form.status = next;
    if (original) original.status = next;
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
  } catch (e) {
    toast.error("No se pudo cambiar la contraseña");
  }
}
</script>

<style scoped>
/* estilos tal cual los tenías */
.rk-user-dialog { min-width: 820px; max-width: 96vw; border-radius: 14px; overflow: hidden; }
.rk-header { padding: 10px 14px; }
.rk-body { max-height: calc(80vh - 48px - 56px); overflow: auto; }
.rk-splitter { height: 100%; }
.rk-tabs :deep(.q-tabs__content) { min-height: 34px; }
.rk-tabs :deep(.q-tab__label) { font-size: 12.5px; }
.rk-form :deep(.q-field--dense) .q-field__control { min-height: 34px; }
.rk-form :deep(.q-field) { margin-bottom: 6px; }
.rk-footer { position: sticky; bottom: 0; background: var(--rk-card); padding: 8px 12px; border-top: 1px solid var(--rk-border); z-index: 2; }
:root { --rk-border: rgba(0,0,0,0.06); --rk-card: #fff; --rk-summary-light: #f7f8fa; --rk-summary-dark: #1f2126; --rk-text-dim: #5f6470; }
.body--dark { --rk-border: rgba(255,255,255,0.08); --rk-card: #111317; --rk-text-dim: #b6bbc6; }
.rk-summary { border-left: 1px solid var(--rk-border); height: 100%; overflow: auto; }
.rk-summary--light { background: var(--rk-summary-light); }
.rk-summary--dark { background: var(--rk-summary-dark); }
</style>
