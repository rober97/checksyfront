<template>
  <div class="row q-col-gutter-sm">
    <div class="col-12 col-md-7">
      <q-input
        v-model="text"
        type="textarea"
        autogrow
        outlined
        dense
        label="Pega fechas (YYYY-MM-DD separadas por coma/espacio/salto)"
        :hint="`Ej: ${todayISO}, ${exampleNext}`"
      />
      <div class="row q-gutter-sm q-mt-sm">
        <q-btn outline color="primary" label="Aplicar" @click="applyText" />
        <q-btn
          outline
          color="negative"
          label="Limpiar"
          @click="m.splice(0, m.length)"
        />
      </div>

      <div class="row items-center q-mt-sm">
        <q-input
          v-model="one"
          dense
          outlined
          mask="####-##-##"
          label="Agregar manual (YYYY-MM-DD)"
          class="col-grow"
        >
          <template #append
            ><q-btn flat dense icon="add" @click="addOne"
          /></template>
        </q-input>
      </div>
    </div>

    <div class="col-12 col-md-5">
      <q-card flat bordered class="soft-card">
        <q-card-section class="q-pb-xs">
          <div class="row items-center justify-between">
            <div class="text-subtitle2">Feriados ({{ m.length }})</div>
            <q-btn
              v-if="m.length"
              size="sm"
              flat
              color="primary"
              icon="sort"
              @click="sortAll"
            />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-xs">
            <q-chip
              v-for="d in m"
              :key="d"
              outline
              removable
              @remove="remove(d)"
              class="q-mb-xs"
            >
              <q-icon name="event" class="q-mr-xs" /> {{ d }}
            </q-chip>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
const props = defineProps({ modelValue: { type: Array, required: true } });
const emit = defineEmits(["update:modelValue", "validity"]);
const $q = useQuasar();

const m = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const text = ref("");
const one = ref("");
const todayISO = new Date().toISOString().slice(0, 10);
const exampleNext = new Date(Date.now() + 86400000 * 7)
  .toISOString()
  .slice(0, 10);

function parse(txt) {
  return (txt || "")
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
}
function applyText() {
  const set = new Set([...(m.value || []), ...parse(text.value)]);
  m.value = Array.from(set).sort();
}
function addOne() {
  const v = (one.value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    m.value = Array.from(new Set([...(m.value || []), v])).sort();
    one.value = "";
  } else
    $q.notify({
      type: "warning",
      message: "Formato inválido. Usa YYYY-MM-DD.",
    });
}
function remove(d) {
  m.value = m.value.filter((x) => x !== d);
}
function sortAll() {
  m.value = [...m.value].sort();
}

function emitValid() {
  emit("validity", true);
}
onMounted(() => emitValid());
watch(() => m.value, emitValid, { deep: true });
</script>
