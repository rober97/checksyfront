<template>
  <div class="row q-col-gutter-sm">
    <div class="col-12 col-md-8">
      <q-input
        v-model.trim="m.name"
        label="Nombre*"
        dense
        outlined
        :rules="[req]"
        @update:model-value="emitValid"
      />
      <q-input
        v-model.trim="m.rut"
        label="RUT*"
        dense
        outlined
        :rules="[req, rutRule]"
        mask="##.###.###-#"
        fill-mask
        class="q-mt-sm"
        @update:model-value="emitValid"
      />
      <q-input
        v-model.trim="m.email"
        type="email"
        label="Email*"
        dense
        outlined
        :rules="[req, emailRule]"
        class="q-mt-sm"
        @update:model-value="emitValid"
      />
      <div class="row q-col-gutter-sm q-mt-sm">
        <div class="col-12 col-sm-6">
          <q-input
            v-model.trim="m.phone"
            label="Teléfono*"
            dense
            outlined
            :rules="[req]"
            mask="+56 9 ########"
            fill-mask
            @update:model-value="emitValid"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-select
            v-model="m.status"
            :options="statusOpts"
            label="Estado"
            dense
            outlined
            emit-value
            map-options
            @update:model-value="emitValid"
          />
        </div>
      </div>
      <q-input
        v-model.trim="m.address"
        label="Dirección"
        dense
        outlined
        class="q-mt-sm"
        @update:model-value="emitValid"
      />
    </div>

    <div class="col-12 col-md-4">
      <q-banner class="bg-blue-1 text-blue-10 rounded q-pa-sm">
        <div class="text-subtitle2">Ayuda</div>
        <div class="text-caption">
          Estos datos se usan en documentos y notificaciones.
        </div>
      </q-banner>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from "vue";
const props = defineProps({
  modelValue: { type: Object, required: true },
  isEdit: Boolean,
});
const emit = defineEmits(["update:modelValue", "validity"]);
const m = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const statusOpts = [
  { label: "Activa", value: "active" },
  { label: "Inactiva", value: "inactive" },
  { label: "Eliminada", value: "deleted" },
];
const req = (v) => !!v || "Requerido";
const emailRule = (v) =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Email inválido";
const rutRule = (v) =>
  !v || /^\d{1,2}\.?\d{3}\.?\d{3}-[\dKk]$/.test(v) || "RUT inválido";
function valid() {
  return !!(m.value.name && m.value.rut && m.value.email && m.value.phone);
}
function emitValid() {
  emit("validity", valid());
}
onMounted(() => emitValid());
watch(() => m.value, emitValid, { deep: true });
</script>
