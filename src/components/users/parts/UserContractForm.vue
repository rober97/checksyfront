<template>
  <div class="row q-col-gutter-sm">
    <div class="col-6 col-sm-4">
      <q-input
        v-model="local.baseSalary"
        label="Sueldo base (CLP)"
        dense
        outlined
        :rules="[reqNumber]"
        @update:model-value="(v) => (local.baseSalary = normalizeMoney(v))"
        :hint="formatMoney(local.baseSalary)"
      >
        <template #prepend><q-icon name="attach_money" /></template>
      </q-input>
    </div>

    <div class="col-6 col-sm-4">
      <q-select
        v-model="local.contractType"
        label="Tipo contrato"
        :options="contractTypes"
        dense
        outlined
        emit-value
        map-options
        :rules="[req]"
      />
    </div>

    <div class="col-6 col-sm-4">
      <q-select
        v-model="local.jornada"
        label="Jornada"
        :options="jornadas"
        dense
        outlined
        emit-value
        map-options
        :rules="[req]"
      />
    </div>

    <div class="col-6 col-sm-4">
      <q-input
        v-model="local.startDate"
        label="Fecha ingreso"
        dense
        outlined
        mask="####-##-##"
        :rules="[req, fechaPasada]"
        placeholder="YYYY-MM-DD"
      >
        <template #prepend><q-icon name="event" /></template>
      </q-input>
    </div>

    <!-- ✅ AFP dinámico (entityId) -->
    <div class="col-6 col-sm-4">
      <q-select
        v-model="local.afpEntityId"
        label="AFP"
        :options="afpSelectOptions"
        dense
        outlined
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

    <!-- ✅ Salud dinámico (entityId) -->
    <div class="col-6 col-sm-4">
      <q-select
        v-model="local.healthEntityId"
        label="Salud"
        :options="healthSelectOptions"
        dense
        outlined
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

    <!-- ✅ Campos extra SOLO si el meta lo requiere -->
    <div class="col-6 col-sm-4" v-if="requiresUf">
      <q-input
        v-model="local.isaprePlan"
        label="Plan (Isapre / Salud)"
        dense
        outlined
        :rules="[req]"
      />
    </div>

    <div class="col-6 col-sm-4" v-if="requiresUf">
      <q-input
        v-model="local.isapreUf"
        label="Plan (UF)"
        dense
        outlined
        :rules="[reqNumber]"
        @update:model-value="(v) => (local.isapreUf = normalizeDecimal(v))"
      />
    </div>

    <div class="col-6 col-sm-4">
      <q-input
        v-model="local.apv"
        label="APV (CLP)"
        dense
        outlined
        @update:model-value="(v) => (local.apv = normalizeMoney(v))"
        :hint="formatMoney(local.apv)"
      />
    </div>

    <div class="col-6 col-sm-4">
      <q-input
        v-model.number="local.cargasFamiliares"
        type="number"
        min="0"
        step="1"
        label="Cargas familiares"
        dense
        outlined
        :rules="[nroEntero0]"
      />
    </div>

    <div class="col-6 col-sm-4">
      <q-select
        v-model="local.banco"
        label="Banco"
        :options="bancos"
        dense
        outlined
        emit-value
        map-options
      />
    </div>

    <div class="col-6 col-sm-4">
      <q-select
        v-model="local.tipoCuenta"
        label="Tipo de cuenta"
        :options="tiposCuenta"
        dense
        outlined
        emit-value
        map-options
      />
    </div>

    <div class="col-12 col-sm-4">
      <q-input v-model="local.numeroCuenta" label="N° de cuenta" dense outlined />
    </div>

    <div class="col-12">
      <q-expansion-item
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
</script>