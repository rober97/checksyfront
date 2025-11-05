<template>
  <div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="localTipo"
          :options="tipos"
          label="Tipo de solicitud"
          dense outlined emit-value map-options
          :rules="[(v)=>!!v || 'Campo obligatorio']"
        >
          <template #prepend><q-icon name="category" /></template>
        </q-select>
      </div>

      <div class="col-12 col-md-6">
        <q-banner rounded class="q-pa-sm" :class="bannerTipoClass">
          <q-icon :name="afectaSaldoTipo ? 'warning' : 'info'" class="q-mr-xs" />
          {{ tipoHint }}
        </q-banner>
      </div>
    </div>

    <div class="row justify-end q-mt-md">
      <q-btn color="primary" label="Siguiente" @click="$emit('next', 2)" :disable="!localTipo" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  tipos: { type: Array, required: true }
});
const emit = defineEmits(['update:modelValue','next']);

const localForm = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
});
const localTipo = computed({
  get: () => localForm.value.tipo,
  set: (v) => (localForm.value = { ...localForm.value, tipo: v })
});

const afectaSaldoTipo = computed(() => localForm.value.tipo === 'vacaciones');
const bannerTipoClass = computed(() =>
  afectaSaldoTipo.value ? 'bg-orange-1 text-orange-9' : 'bg-blue-1 text-blue-10'
);
const tipoHint = computed(() => {
  const t = localForm.value.tipo;
  if (!t) return "Elige un tipo de solicitud.";
  if (t === "vacaciones") return "Las vacaciones descuentan de tu saldo disponible.";
  if (t === "compensatorio") return "Día compensatorio según horas extra aprobadas.";
  if (t === "permiso") return "Permiso personal (no necesariamente afecta saldo).";
  if (t === "licencia") return "Licencia médica (adjunta respaldo si es requerido).";
  return "";
});
</script>

<style scoped>
.q-banner { border-radius: 10px; }
</style>
