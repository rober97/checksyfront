<template>
  <div class="rk-perm-search row items-center q-col-gutter-sm">
    <div class="col-12 col-md-5">
      <q-input
        v-model="qModel"
        dense
        outlined
        debounce="200"
        placeholder="Buscar permisos por nombre o clave…"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
        <template #append>
          <q-btn
            v-if="qModel"
            round
            dense
            flat
            icon="close"
            @click="$emit('clear')"
          />
        </template>
      </q-input>
    </div>
    <div class="col-12 col-md-7">
      <q-select
        v-model="catsModel"
        :options="categories"
        use-chips
        multiple
        dense
        outlined
        label="Filtrar por categoría"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({
  categories: { type: Array, default: () => [] },
  q: { type: String, default: "" },
  selectedCategories: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:q", "update:selectedCategories", "clear"]);

const qModel = computed({
  get: () => props.q,
  set: (v) => emit("update:q", v),
});
const catsModel = computed({
  get: () => props.selectedCategories,
  set: (v) => emit("update:selectedCategories", v),
});
</script>

<style scoped>
.rk-perm-search {
  padding: 4px 6px;
}
</style>
