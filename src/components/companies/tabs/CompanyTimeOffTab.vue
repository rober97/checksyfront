<template>
  <div class="row q-col-gutter-sm">
    <div class="col-12">
      <q-btn
        outline
        dense
        icon="dashboard_customize"
        color="secondary"
        class="q-mb-sm q-mr-sm"
        @click="$emit('apply-preset', 'cl_basica')"
        >Preset “CL Básica”</q-btn
      >
      <q-btn
        outline
        dense
        icon="science"
        color="secondary"
        class="q-mb-sm"
        @click="$emit('apply-preset', 'acumulacion_mensual')"
        >Preset “Mensual 1.25d”</q-btn
      >
    </div>

    <div class="col-12 col-sm-6">
      <q-select
        v-model="vm.vacation.accrual.mode"
        :options="accrualModes"
        emit-value
        map-options
        dense
        outlined
        label="Modo de acumulación"
        @update:model-value="emitValid"
      />
    </div>
    <div class="col-12 col-sm-6">
      <q-toggle
        v-model="vm.vacation.accrual.accrueOnBusinessDays"
        label="Solo días hábiles"
        dense
        @update:model-value="emitValid"
      />
    </div>

    <div class="col-12 col-sm-6">
      <q-input
        v-model.number="vm.vacation.accrual.perYearDays"
        type="number"
        min="0"
        step="0.5"
        label="Días por año"
        dense
        outlined
        @update:model-value="emitValid"
      />
    </div>
    <div class="col-12 col-sm-6">
      <q-input
        v-model.number="vm.vacation.accrual.perMonthDays"
        type="number"
        min="0"
        step="0.1"
        label="Días por mes (opcional)"
        dense
        outlined
        hint="Vacío → perYear/12"
        @update:model-value="emitValid"
      />
    </div>

    <div class="col-12 col-sm-6">
      <q-input
        v-model.number="vm.vacation.accrual.startAfterDays"
        type="number"
        min="0"
        step="1"
        label="Carencia inicial (días)"
        dense
        outlined
        @update:model-value="emitValid"
      />
    </div>
    <div class="col-12 col-sm-6">
      <q-toggle
        v-model="vm.vacation.accrual.prorateFromStartDate"
        label="Prorratear desde inicio de contrato"
        dense
        @update:model-value="emitValid"
      />
    </div>

    <div class="col-12"><q-separator class="q-my-md" /></div>

    <div class="col-12">
      <div class="text-subtitle2 q-mb-xs row items-center">
        Carry Over
        <q-icon name="help_outline" size="16px" class="q-ml-xs">
          <q-tooltip>Cuántos días se trasladan al año siguiente.</q-tooltip>
        </q-icon>
      </div>
    </div>
    <div class="col-12 col-sm-4">
      <q-toggle
        v-model="vm.vacation.carryOver.enabled"
        label="Habilitado"
        dense
        @update:model-value="emitValid"
      />
    </div>
    <div class="col-6 col-sm-4">
      <q-input
        v-model.number="vm.vacation.carryOver.maxCarry"
        type="number"
        min="0"
        label="Máx. trasladar"
        dense
        outlined
        @update:model-value="emitValid"
      />
    </div>
    <div class="col-3 col-sm-2">
      <q-input
        v-model.number="vm.vacation.carryOver.resetMonth"
        type="number"
        min="1"
        max="12"
        label="Mes"
        dense
        outlined
        @update:model-value="emitValid"
      />
    </div>
    <div class="col-3 col-sm-2">
      <q-input
        v-model.number="vm.vacation.carryOver.resetDay"
        type="number"
        min="1"
        max="31"
        label="Día"
        dense
        outlined
        @update:model-value="emitValid"
      />
    </div>

    <div class="col-12"><q-separator class="q-my-md" /></div>

    <div class="col-6 col-sm-4">
      <q-toggle
        v-model="vm.vacation.cap.enabled"
        label="Tope habilitado"
        dense
        @update:model-value="emitValid"
      />
    </div>
    <div class="col-6 col-sm-8">
      <q-input
        v-model.number="vm.vacation.cap.maxDays"
        type="number"
        min="0"
        step="0.5"
        label="Máx. días acumulables"
        dense
        outlined
        @update:model-value="emitValid"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
const props = defineProps({ modelValue: { type: Object, required: true } });
const emit = defineEmits(["update:modelValue", "apply-preset", "validity"]);
const vm = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
const accrualModes = [
  { label: "Diario", value: "DAILY" },
  { label: "Mensual", value: "MONTHLY" },
];
function isValid() {
  return true;
} // reglas básicas; puedes endurecer si quieres
function emitValid() {
  emit("validity", isValid());
}
onMounted(() => emitValid());
watch(() => vm.value, emitValid, { deep: true });
</script>
