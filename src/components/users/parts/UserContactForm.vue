<template>
  <div class="row q-col-gutter-sm">
    <div class="col-12 col-sm-6">
      <q-input v-model="local.address.line1" label="Dirección" dense outlined />
    </div>
    <div class="col-12 col-sm-6">
      <q-input v-model="local.address.commune" label="Comuna" dense outlined />
    </div>
    <div class="col-12 col-sm-6">
      <q-input v-model="local.address.city" label="Ciudad" dense outlined />
    </div>
    <div class="col-12 col-sm-6">
      <q-input v-model="local.address.region" label="Región" dense outlined />
    </div>
    <div class="col-12 col-sm-6">
      <q-input
        v-model="local.phone"
        label="Teléfono"
        dense
        outlined
        mask="################"
      />
    </div>
    <div class="col-12 col-sm-6">
      <q-input
        v-model="local.emergencyContact"
        label="Contacto de emergencia"
        dense
        outlined
      />
    </div>
  </div>
</template>
<script setup>
import { reactive, watch } from "vue";
const props = defineProps({ modelValue: { type: Object, required: true } });
const emit = defineEmits(["update:modelValue"]);
const local = reactive({ ...props.modelValue });
watch(
  () => props.modelValue,
  (v) => Object.assign(local, v)
);
watch(local, (v) => emit("update:modelValue", { ...v }), { deep: true });
</script>
