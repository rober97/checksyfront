<template>
  <div class="row q-col-gutter-md rk-contract-grid">
    <div class="col-12">
      <section class="rk-form-section">
        <div class="rk-form-section__header">
          <div class="rk-form-section__icon">
            <q-icon name="work_history" />
          </div>
          <div>
            <div class="rk-form-section__title">Condiciones laborales</div>
            <div class="rk-form-section__subtitle">Base contractual del empleado y fecha efectiva de ingreso.</div>
          </div>
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-lg-3">
            <q-input
              v-model="local.baseSalary"
              label="Sueldo base (CLP)"
              dense
              outlined
              class="rk-field"
              :rules="[reqNumber]"
              @update:model-value="(v) => (local.baseSalary = normalizeMoney(v))"
              :hint="formatMoney(local.baseSalary)"
            >
              <template #prepend><q-icon name="attach_money" /></template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <q-select
              v-model="local.contractType"
              label="Tipo contrato"
              :options="contractTypes"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
              :rules="[req]"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <q-select
              v-model="local.jornada"
              label="Jornada"
              :options="jornadas"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
              :rules="[req]"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <q-input
              v-model="local.startDate"
              label="Fecha ingreso"
              dense
              outlined
              class="rk-field"
              readonly
              :rules="[req, fechaPasada]"
              placeholder="YYYY-MM-DD"
            >
              <template #prepend><q-icon name="event" /></template>
              <template #append>
                <q-icon name="calendar_month" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="local.startDate"
                      mask="YYYY-MM-DD"
                      minimal
                      color="primary"
                    >
                      <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                        <q-btn v-close-popup flat label="Cerrar" color="primary" />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </section>
    </div>

    <!-- ✅ AFP dinámico (entityId) -->
    <div class="col-12">
      <section class="rk-form-section">
        <div class="rk-form-section__header">
          <div class="rk-form-section__icon rk-form-section__icon--mint">
            <q-icon name="health_and_safety" />
          </div>
          <div>
            <div class="rk-form-section__title">Previsión y salud</div>
            <div class="rk-form-section__subtitle">Configuración previsional para cálculos y descuentos del trabajador.</div>
          </div>
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-lg-4">
            <q-select
              v-model="local.afpEntityId"
              label="AFP"
              :options="afpSelectOptions"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
              option-value="value"
              option-label="label"
              :rules="[req]"
              :loading="loadingCatalog"
              :disable="loadingCatalog"
            >
              <template #no-option>
                <div class="q-pa-md text-center">
                  <q-icon name="account_tree" size="32px" class="q-mb-sm" />
                  <div class="text-weight-bold">No hay AFP disponibles</div>
                  <div class="text-caption">Configura el catálogo global de nómina</div>
                </div>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <q-select
              v-model="local.healthEntityId"
              label="Salud"
              :options="healthSelectOptions"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
              option-value="value"
              option-label="label"
              :rules="[req]"
              :loading="loadingCatalog"
              :disable="loadingCatalog"
            >
              <template #no-option>
                <div class="q-pa-md text-center">
                  <q-icon name="medical_services" size="32px" class="q-mb-sm" />
                  <div class="text-weight-bold">No hay opciones de salud</div>
                  <div class="text-caption">Configura el catálogo global de nómina</div>
                </div>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <q-input
              v-model="local.apv"
              label="APV (CLP)"
              dense
              outlined
              class="rk-field"
              @update:model-value="(v) => (local.apv = normalizeMoney(v))"
              :hint="formatMoney(local.apv)"
            />
          </div>

          <!-- ✅ Campos extra SOLO si el meta lo requiere -->
          <div class="col-12 col-sm-6 col-lg-4" v-if="requiresUf">
            <q-input
              v-model="local.isaprePlan"
              label="Plan (Isapre / Salud)"
              dense
              outlined
              class="rk-field"
              :rules="[req]"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-4" v-if="requiresUf">
            <q-input
              v-model="local.isapreUf"
              label="Plan (UF)"
              dense
              outlined
              class="rk-field"
              :rules="[reqNumber]"
              @update:model-value="(v) => (local.isapreUf = normalizeDecimal(v))"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <q-input
              v-model.number="local.cargasFamiliares"
              type="number"
              min="0"
              step="1"
              label="Cargas familiares"
              dense
              outlined
              class="rk-field"
              :rules="[nroEntero0]"
            />
          </div>
        </div>
      </section>
    </div>

    <div class="col-12 col-sm-8">
      <div class="rk-tax-box">
        <div class="rk-tax-box__head">
          <q-icon name="request_quote" size="18px" />
          <div>
            <div class="rk-tax-box__title">Impuesto a la renta</div>
            <div class="rk-tax-box__subtitle">
              Marca si este trabajador debe participar en el cálculo del impuesto único cuando corresponda.
            </div>
          </div>
        </div>

        <div class="rk-tax-box__controls">
          <q-toggle
            v-model="local.incomeTaxApplies"
            color="primary"
            label="Empleado afecto a impuesto"
          />

          <q-input
            v-model="local.incomeTaxNote"
            dense
            outlined
            label="Observación tributaria"
            placeholder="Ej: exento por régimen especial"
            :disable="local.incomeTaxApplies"
          />
        </div>
      </div>
    </div>

    <div class="col-12">
      <section class="rk-form-section">
        <div class="rk-form-section__header">
          <div class="rk-form-section__icon rk-form-section__icon--gold">
            <q-icon name="account_balance_wallet" />
          </div>
          <div>
            <div class="rk-form-section__title">Pago y abono</div>
            <div class="rk-form-section__subtitle">Datos bancarios para depositar remuneraciones al trabajador.</div>
          </div>
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-lg-4">
            <q-select
              v-model="local.banco"
              label="Banco"
              :options="bancos"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <q-select
              v-model="local.tipoCuenta"
              label="Tipo de cuenta"
              :options="tiposCuenta"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-lg-4">
            <q-input v-model="local.numeroCuenta" label="N° de cuenta" dense outlined class="rk-field" />
          </div>
        </div>
      </section>
    </div>

    <div class="col-12">
      <q-expansion-item
        class="rk-extra-box"
        dense
        expand-separator
        icon="paid"
        label="Haberes/Descuentos frecuentes (opcional)"
      >
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.gratificacion"
              label="Gratificación"
              dense
              outlined
              @update:model-value="(v) => (local.gratificacion = normalizeMoney(v))"
              :hint="formatMoney(local.gratificacion)"
            />
          </div>
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.bonoColacion"
              label="Colación"
              dense
              outlined
              @update:model-value="(v) => (local.bonoColacion = normalizeMoney(v))"
              :hint="formatMoney(local.bonoColacion)"
            />
          </div>
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.bonoMovilizacion"
              label="Movilización"
              dense
              outlined
              @update:model-value="(v) => (local.bonoMovilizacion = normalizeMoney(v))"
              :hint="formatMoney(local.bonoMovilizacion)"
            />
          </div>
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.descuentoPrestamo"
              label="Desc. préstamo"
              dense
              outlined
              @update:model-value="(v) => (local.descuentoPrestamo = normalizeMoney(v))"
              :hint="formatMoney(local.descuentoPrestamo)"
            />
          </div>
        </div>
      </q-expansion-item>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed } from "vue";
import { normalizeMoney, normalizeDecimal, formatMoney } from "@/utils/format";
import { req, reqNumber, nroEntero0, fechaPasada } from "@/utils/validators";

const props = defineProps({
  modelValue: { type: Object, required: true },

  // ✅ dinámicos (vienen del diálogo)
  loadingCatalog: { type: Boolean, default: false },
  afpOptions: { type: Array, default: () => [] },     // [{_id, displayName, slug, meta}]
  healthOptions: { type: Array, default: () => [] },  // [{_id, displayName, slug, meta}]
  healthSelectedMeta: { type: Object, default: null },// meta del seleccionado (requiresUf, etc.)
});

const emit = defineEmits(["update:modelValue"]);

/* ✅ Listas “estables” (si mañana quieres, las haces dinámicas igual) */
const contractTypes = [
  { label: "Indefinido", value: "indefinido" },
  { label: "Plazo fijo", value: "plazo_fijo" },
  { label: "Part-time", value: "part_time" },
  { label: "Honorarios", value: "honorarios" },
];

const jornadas = [
  { label: "Completa", value: "completa" },
  { label: "Parcial", value: "parcial" },
  { label: "Turnos", value: "turnos" },
];

const bancos = [
  "BancoEstado",
  "Banco de Chile",
  "Banco BCI",
  "Banco Itaú",
  "Scotiabank",
  "Santander",
  "Falabella",
  "Security",
  "Ripley",
  "Consorcio",
].map((b) => ({ label: b, value: b }));

const tiposCuenta = [
  { label: "Cuenta corriente", value: "corriente" },
  { label: "Cuenta vista", value: "vista" },
  { label: "Cuenta Rut", value: "rut" },
  { label: "Ahorro", value: "ahorro" },
];

/* ✅ opciones para q-select (IDs) */
const afpSelectOptions = computed(() =>
  (props.afpOptions || [])
    .filter(x => x && x._id && x.displayName)
    .map(x => ({ label: x.displayName, value: x._id }))
);

const healthSelectOptions = computed(() =>
  (props.healthOptions || [])
    .filter(x => x && x._id && x.displayName)
    .map(x => ({ label: x.displayName, value: x._id }))
);

const requiresUf = computed(() => !!props.healthSelectedMeta?.requiresUf);

/* ✅ local model */
const local = reactive({ ...props.modelValue });

watch(
  () => props.modelValue,
  (v) => Object.assign(local, v)
);

watch(
  local,
  (v) => emit("update:modelValue", { ...v }),
  { deep: true }
);

/* ✅ limpieza automática: si salud no requiere UF, borra campos */
watch(
  () => requiresUf.value,
  (need) => {
    if (!need) {
      local.isaprePlan = "";
      local.isapreUf = 0;
    }
  },
  { immediate: true }
);

watch(
  () => local.incomeTaxApplies,
  (enabled) => {
    if (enabled) local.incomeTaxNote = "";
  },
  { immediate: true }
);
</script>

<style scoped>
.rk-contract-grid {
  align-items: start;
}

.rk-form-section {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  padding: 16px;
  background:
    radial-gradient(circle at top right, rgba(34, 211, 238, 0.08), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
}

.rk-form-section__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.rk-form-section__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #0f766e;
  background: linear-gradient(135deg, rgba(204, 251, 241, 0.92), rgba(153, 246, 228, 0.72));
  box-shadow: inset 0 0 0 1px rgba(13, 148, 136, 0.12);
}

.rk-form-section__icon--mint {
  color: #0f766e;
  background: linear-gradient(135deg, rgba(209, 250, 229, 0.92), rgba(167, 243, 208, 0.78));
}

.rk-form-section__icon--gold {
  color: #92400e;
  background: linear-gradient(135deg, rgba(254, 240, 138, 0.9), rgba(253, 224, 71, 0.7));
}

.rk-form-section__title {
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.3;
  color: #0f172a;
}

.rk-form-section__subtitle {
  margin-top: 2px;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #64748b;
}

.rk-field :deep(.q-field__control) {
  min-height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.rk-field :deep(.q-field__native),
.rk-field :deep(.q-field__input) {
  font-weight: 600;
  color: #0f172a;
}

.rk-field :deep(.q-field__label) {
  color: #64748b;
  font-weight: 600;
}

.rk-field :deep(.q-field__prepend),
.rk-field :deep(.q-field__append) {
  color: #0f766e;
}

.rk-field:hover :deep(.q-field__control) {
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.rk-field :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.14);
}

.rk-tax-box {
  border: 1px solid rgba(37, 99, 235, 0.16);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.9), rgba(248, 250, 252, 0.95));
  padding: 16px;
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.06);
}

.rk-tax-box__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  color: #1e3a8a;
}

.rk-tax-box__title {
  font-weight: 700;
  line-height: 1.25;
}

.rk-tax-box__subtitle {
  font-size: 0.82rem;
  line-height: 1.45;
  color: #475569;
}

.rk-tax-box__controls {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(220px, 1fr);
  gap: 12px;
  align-items: center;
}

.rk-extra-box {
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 8px 12px;
}

.rk-extra-box :deep(.q-item) {
  padding-left: 4px;
  padding-right: 4px;
}

@media (max-width: 768px) {
  .rk-tax-box__controls {
    grid-template-columns: 1fr;
  }

  .rk-form-section {
    padding: 14px;
  }
}
</style>
