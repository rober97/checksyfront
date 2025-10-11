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

    <div class="col-6 col-sm-4">
      <q-select
        v-model="local.afp"
        label="AFP"
        :options="afps"
        dense
        outlined
        emit-value
        map-options
        :rules="[req]"
      />
    </div>

    <div class="col-6 col-sm-4">
      <q-select
        v-model="local.saludSistema"
        label="Salud"
        :options="salud"
        dense
        outlined
        emit-value
        map-options
        :rules="[req]"
      />
    </div>

    <div class="col-6 col-sm-4" v-if="local.saludSistema === 'ISAPRE'">
      <q-input
        v-model="local.isaprePlan"
        label="Isapre / Plan"
        dense
        outlined
        :rules="[req]"
      />
    </div>

    <div class="col-6 col-sm-4" v-if="local.saludSistema === 'ISAPRE'">
      <q-input
        v-model="local.isapreUf"
        label="Plan Isapre (UF)"
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
      <q-input
        v-model="local.numeroCuenta"
        label="N° de cuenta"
        dense
        outlined
      />
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
              @update:model-value="
                (v) => (local.gratificacion = normalizeMoney(v))
              "
              :hint="formatMoney(local.gratificacion)"
            />
          </div>
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.bonoColacion"
              label="Colación"
              dense
              outlined
              @update:model-value="
                (v) => (local.bonoColacion = normalizeMoney(v))
              "
              :hint="formatMoney(local.bonoColacion)"
            />
          </div>
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.bonoMovilizacion"
              label="Movilización"
              dense
              outlined
              @update:model-value="
                (v) => (local.bonoMovilizacion = normalizeMoney(v))
              "
              :hint="formatMoney(local.bonoMovilizacion)"
            />
          </div>
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.descuentoPrestamo"
              label="Desc. préstamo"
              dense
              outlined
              @update:model-value="
                (v) => (local.descuentoPrestamo = normalizeMoney(v))
              "
              :hint="formatMoney(local.descuentoPrestamo)"
            />
          </div>
        </div>
      </q-expansion-item>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import { normalizeMoney, normalizeDecimal, formatMoney } from "@/utils/format";
import { req, reqNumber, nroEntero0, fechaPasada } from "@/utils/validators";

const props = defineProps({ modelValue: { type: Object, required: true } });
const emit = defineEmits(["update:modelValue"]);

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
const afps = [
  { label: "AFP Habitat", value: "HABITAT" },
  { label: "AFP Capital", value: "CAPITAL" },
  { label: "AFP Cuprum", value: "CUPRUM" },
  { label: "AFP Provida", value: "PROVIDA" },
  { label: "AFP Modelo", value: "MODELO" },
  { label: "IPS (ex INP)", value: "IPS" },
];
const salud = [
  { label: "Fonasa", value: "FONASA" },
  { label: "Isapre", value: "ISAPRE" },
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

const local = reactive({ ...props.modelValue });
watch(
  () => props.modelValue,
  (v) => Object.assign(local, v)
);
watch(local, (v) => emit("update:modelValue", { ...v }), { deep: true });
</script>
