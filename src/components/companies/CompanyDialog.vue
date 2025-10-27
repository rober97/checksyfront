<template>
  <q-dialog
    v-model="visible"
    persistent
    transition-show="jump-down"
    transition-hide="jump-up"
  >
    <q-card
      class="rk-company-dialog q-pa-none"
      :class="isDark ? 'rk--dark' : 'rk--light'"
    >
      <!-- Header -->
      <div class="rk-header row items-center">
        <div class="row items-center q-gutter-xs">
          <q-icon name="apartment" size="22px" />
          <div class="text-subtitle1 text-weight-medium">
            {{ isEdit ? "Editar empresa" : "Crear nueva empresa" }}
          </div>
        </div>
        <q-space />
        <q-btn dense round flat icon="close" @click="cancelar" />
      </div>

      <q-separator />

      <!-- Body -->
      <div class="rk-body">
        <q-splitter v-model="split" :limits="[60, 85]" class="rk-splitter">
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
                <q-tab name="basicos" label="Básicos" icon="domain" />
                <q-tab name="payroll" label="Nómina" icon="request_quote" />
                <q-tab
                  name="politica"
                  label="Política Vacaciones"
                  icon="policy"
                />
                <q-tab name="feriados" label="Feriados" icon="event_busy" />
                <q-tab name="logo" label="Logo" icon="image" />
              </q-tabs>

              <q-separator />

              <q-form
                ref="formRef"
                greedy
                class="q-pt-sm"
                @submit.prevent="submit"
              >
                <q-tab-panels
                  v-model="tab"
                  animated
                  transition-prev="fade"
                  transition-next="fade"
                >
                  <q-tab-panel name="basicos" class="q-pt-sm">
                    <CompanyBasicsTab
                      v-model="form"
                      :is-edit="isEdit"
                      @validity="(v) => (valid.basicos = v)"
                    />
                  </q-tab-panel>

                  <q-tab-panel name="payroll" class="q-pt-sm">
                    <CompanyPayrollTab
                      v-model="form.payrollConfig"
                      :holidays="form.holidays"
                      @validity="(v) => (valid.payroll = v)"
                    />
                  </q-tab-panel>

                  <q-tab-panel name="politica" class="q-pt-sm">
                    <CompanyTimeOffTab
                      v-model="form.timeOffPolicy"
                      @apply-preset="applyTimeOffPreset"
                      @validity="(v) => (valid.politica = v)"
                    />
                  </q-tab-panel>

                  <q-tab-panel name="feriados" class="q-pt-sm">
                    <CompanyHolidaysTab
                      v-model="form.holidays"
                      @validity="(v) => (valid.feriados = v)"
                    />
                  </q-tab-panel>

                  <q-tab-panel name="logo" class="q-pt-sm">
                    <CompanyLogoTab
                      v-model:logo="form.logo"
                      v-model:file="logoFile"
                      v-model:preview="logoPreview"
                      @validity="(v) => (valid.logo = v)"
                    />
                  </q-tab-panel>
                </q-tab-panels>
              </q-form>
            </div>
          </template>

          <!-- Summary -->
          <template #after>
            <div
              class="rk-summary q-pa-md"
              :class="isDark ? 'rk-summary--dark' : 'rk-summary--light'"
            >
              <div class="row items-center">
                <q-avatar size="36px" square class="q-mr-sm">
                  <img
                    v-if="logoPreview || form.logo"
                    :src="logoPreview || form.logo"
                  />
                  <q-icon v-else name="apartment" color="grey-7" />
                </q-avatar>
                <div>
                  <div class="text-subtitle2">
                    {{ form.name || "Nueva empresa" }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ form.rut || "RUT pendiente" }}
                  </div>
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="text-caption text-grey-7 q-mb-xs">Nómina</div>
              <q-list dense class="soft-card q-pa-xs">
                <q-item
                  ><q-item-section>Frecuencia</q-item-section
                  ><q-item-section side>{{
                    form.payrollConfig.frequency
                  }}</q-item-section></q-item
                >
                <q-item
                  ><q-item-section>Corte (día)</q-item-section
                  ><q-item-section side>{{
                    form.payrollConfig.cutoffDay
                  }}</q-item-section></q-item
                >
                <q-item
                  ><q-item-section>Regla pago</q-item-section
                  ><q-item-section side>{{
                    form.payrollConfig.paydayRule
                  }}</q-item-section></q-item
                >
                <q-item v-if="form.payrollConfig.paydayRule === 'fixed_day'">
                  <q-item-section>Día fijo</q-item-section
                  ><q-item-section side>{{
                    form.payrollConfig.paydayDayOfMonth
                  }}</q-item-section>
                </q-item>
                <q-item
                  ><q-item-section>Hora generación</q-item-section
                  ><q-item-section side>{{
                    form.payrollConfig.generateTime
                  }}</q-item-section></q-item
                >
                <q-item
                  ><q-item-section>Zona</q-item-section
                  ><q-item-section side>{{
                    form.payrollConfig.timezone
                  }}</q-item-section></q-item
                >
                <q-item
                  ><q-item-section>Auto-publicar</q-item-section
                  ><q-item-section side>{{
                    form.payrollConfig.autoPublish ? "Sí" : "No"
                  }}</q-item-section></q-item
                >
                <q-item
                  ><q-item-section>Notificar</q-item-section
                  ><q-item-section side>{{
                    form.payrollConfig.notifyOnPublish ? "Sí" : "No"
                  }}</q-item-section></q-item
                >
              </q-list>

              <q-separator class="q-my-md" />

              <div class="text-caption text-grey-7 q-mb-xs">Vacaciones</div>
              <q-list dense class="soft-card q-pa-xs">
                <q-item
                  ><q-item-section>Acumulación</q-item-section
                  ><q-item-section side>{{
                    form.timeOffPolicy.vacation.accrual.mode
                  }}</q-item-section></q-item
                >
                <q-item
                  ><q-item-section>Días/año</q-item-section
                  ><q-item-section side>{{
                    form.timeOffPolicy.vacation.accrual.perYearDays
                  }}</q-item-section></q-item
                >
              </q-list>

              <q-separator class="q-my-md" />

              <div class="text-caption text-grey-7 q-mb-xs">
                Feriados cargados
              </div>
              <div class="row q-col-gutter-xs">
                <q-chip
                  v-for="d in form.holidays.slice(0, 12)"
                  :key="d"
                  outline
                  >{{ d }}</q-chip
                >
                <div
                  v-if="form.holidays.length > 12"
                  class="text-caption text-grey-6 q-ml-sm"
                >
                  +{{ form.holidays.length - 12 }} más
                </div>
              </div>
            </div>
          </template>
        </q-splitter>
      </div>

      <!-- Footer -->
      <div class="rk-footer row items-center">
        <q-space />
        <q-btn flat label="Cancelar" @click="cancelar" />
        <q-btn
          color="primary"
          :label="saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'"
          :loading="saving"
          class="q-ml-sm"
          @click="submit"
          unelevated
          :disable="!validAll"
        />
        <q-btn
          v-if="!isEdit"
          color="primary"
          outline
          :disable="saving"
          class="q-ml-sm"
          label="Guardar y crear otra"
          @click="submitAndReset"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useQuasar } from "quasar";
import { useCompaniesStore } from "@/stores/companies";

// Child tabs
import CompanyBasicsTab from "./tabs/CompanyBasicsTab.vue";
import CompanyTimeOffTab from "./tabs/CompanyTimeOffTab.vue";
import CompanyHolidaysTab from "./tabs/CompanyHolidaysTab.vue";
import CompanyLogoTab from "./tabs/CompanyLogoTab.vue";
import CompanyPayrollTab from "./tabs/CompanyPayrollTab.vue";

// Props/Emits
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  editData: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const companies = useCompaniesStore();

/* Dialog v-model */
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

/* State */
const isDark = computed(() => $q.dark.isActive);
const isEdit = computed(() => !!props.editData?._id);
const split = ref(70);
const tab = ref("basicos");

const formRef = ref(null);
const saving = ref(false);
const logoFile = ref(null);
const logoPreview = ref("");

const valid = ref({
  basicos: false,
  payroll: true,
  politica: true,
  feriados: true,
  logo: true,
});
const validAll = computed(() => Object.values(valid.value).every(Boolean));

/* Defaults */
function defaultTimeOff() {
  return {
    vacation: {
      accrual: {
        mode: "DAILY",
        perYearDays: 15,
        perMonthDays: null,
        accrueOnBusinessDays: true,
        startAfterDays: 0,
        prorateFromStartDate: true,
      },
      carryOver: { enabled: true, maxCarry: 5, resetMonth: 1, resetDay: 1 },
      cap: { enabled: true, maxDays: 30 },
    },
    policyVersion: 1,
  };
}
function defaultPayrollConfig() {
  return {
    frequency: "monthly",
    cutoffDay: 25,
    paydayRule: "last_business_day",
    paydayDayOfMonth: 5,
    businessDayAdjust: "previous",
    generateTime: "20:00",
    timezone: "America/Santiago",
    autoPublish: true,
    notifyOnPublish: true,
    templateId: "",
    rounding: "0",
    lastRunAt: null,
    nextRunAt: null,
  };
}
function defaultForm() {
  return {
    name: "",
    rut: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    logo: "",
    timeOffPolicy: defaultTimeOff(),
    payrollConfig: defaultPayrollConfig(),
    holidays: [],
  };
}
const form = ref(defaultForm());

/* Lifecycle: open/reset */
watch(
  () => visible.value,
  (v) => {
    if (!v) return;
    tab.value = "basicos";
    split.value = 70;
    if (props.editData) {
      form.value = {
        name: props.editData.name || "",
        rut: props.editData.rut || "",
        email: props.editData.email || "",
        phone: props.editData.phone || "",
        address: props.editData.address || "",
        status: props.editData.status || "active",
        logo: props.editData.logo || "",
        timeOffPolicy: props.editData.timeOffPolicy || defaultTimeOff(),
        payrollConfig: props.editData.payrollConfig || defaultPayrollConfig(),
        holidays: Array.isArray(props.editData.holidays)
          ? props.editData.holidays
          : [],
      };
      logoPreview.value = props.editData.logo || "";
    } else {
      form.value = defaultForm();
      logoFile.value = null;
      logoPreview.value = "";
    }
  }
);

/* Presets TimeOff desde child */
function applyTimeOffPreset(key) {
  if (key === "cl_basica") {
    form.value.timeOffPolicy = defaultTimeOff();
    $q.notify({ type: "info", message: "Preset aplicado: CL Básica" });
  }
  if (key === "acumulacion_mensual") {
    form.value.timeOffPolicy = {
      vacation: {
        accrual: {
          mode: "MONTHLY",
          perYearDays: 15,
          perMonthDays: 1.25,
          accrueOnBusinessDays: false,
          startAfterDays: 0,
          prorateFromStartDate: true,
        },
        carryOver: { enabled: true, maxCarry: 5, resetMonth: 1, resetDay: 1 },
        cap: { enabled: true, maxDays: 30 },
      },
      policyVersion: 1,
    };
    $q.notify({ type: "info", message: "Preset aplicado: Mensual 1.25d" });
  }
}

/* Submit */
async function submit() {
  const ok = await formRef.value?.validate?.().catch(() => false);
  if (!ok || !validAll.value) {
    $q.notify({ type: "negative", message: "Revisa los campos obligatorios." });
    return;
  }
  try {
    saving.value = true;
    const payload = { ...form.value };
    if (logoFile.value) payload._logoFile = logoFile.value; // tu store decide multipart
    if (isEdit.value) {
      await companies.updateCompany(props.editData._id, payload);
      $q.notify({ type: "positive", message: "Cambios guardados" });
    } else {
      await companies.createCompany(payload);
      $q.notify({ type: "positive", message: "Empresa creada" });
    }
    emit("saved");
    visible.value = false;
  } catch (e) {
    $q.notify({
      type: "negative",
      message: companies.error || e?.message || "Error al guardar",
    });
  } finally {
    saving.value = false;
  }
}

async function submitAndReset() {
  if (isEdit.value) return;
  const ok = await formRef.value?.validate?.().catch(() => false);
  if (!ok || !validAll.value) {
    $q.notify({ type: "negative", message: "Revisa los campos obligatorios." });
    return;
  }
  try {
    saving.value = true;
    const payload = { ...form.value };
    if (logoFile.value) payload._logoFile = logoFile.value;
    await companies.createCompany(payload);
    $q.notify({
      type: "positive",
      message: "Empresa creada. Puedes crear otra.",
    });
    emit("saved");
    form.value = defaultForm();
    logoFile.value = null;
    logoPreview.value = "";
    tab.value = "basicos";
  } catch (e) {
    $q.notify({
      type: "negative",
      message: companies.error || e?.message || "Error al guardar",
    });
  } finally {
    saving.value = false;
  }
}

/* Close & hotkeys */
function cancelar() {
  visible.value = false;
}
function hotkeys(e) {
  if (!visible.value) return;
  if (e.key === "Escape") cancelar();
  if (e.key === "Enter" && e.ctrlKey) submit();
  if (!isEdit.value && e.key === "Enter" && e.altKey) submitAndReset();
}
onMounted(() => window.addEventListener("keydown", hotkeys));
onBeforeUnmount(() => window.removeEventListener("keydown", hotkeys));
</script>

<style scoped>
.rk-company-dialog {
  min-width: 920px;
  max-width: 96vw;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
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
.rk-tabs :deep(.q-field--dense) .q-field__control {
  min-height: 34px;
}
.rk-footer {
  position: sticky;
  bottom: 0;
  background: var(--rk-card);
  padding: 8px 12px;
  border-top: 1px solid var(--rk-border);
  z-index: 2;
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
.soft-card {
  border-radius: 12px;
  border: 1px solid var(--rk-border);
}
:root {
  --rk-border: rgba(0, 0, 0, 0.08);
  --rk-card: #fff;
  --rk-summary-light: #f7f8fa;
  --rk-summary-dark: #1f2126;
}
.rk--dark {
  --rk-border: rgba(255, 255, 255, 0.08);
  --rk-card: #111317;
}
@media (max-width: 1023px) {
  .rk-company-dialog {
    min-width: 96vw;
  }
  .rk-summary {
    display: none;
  }
}
</style>
