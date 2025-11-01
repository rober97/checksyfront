<template>
  <div class="rk-perm-matrix">
    <!-- Encabezado -->
    <div class="rk-perm-grid rk-perm-grid--head">
      <div class="rk-perm-col rk-perm-col--perm text-weight-medium">
        Permiso
      </div>
      <div class="rk-perm-col rk-perm-col--state text-center">Permitir</div>
      <div class="rk-perm-col rk-perm-col--state text-center">Denegar</div>
      <div class="rk-perm-col rk-perm-col--state text-center">Heredar</div>
    </div>

    <!-- Cuerpo por categoría -->
    <div v-for="cat in catalog.categories" :key="cat" class="rk-perm-category">
      <div class="rk-perm-cat-header row items-center justify-between">
        <div class="row items-center q-gutter-sm">
          <q-icon name="folder" size="18px" />
          <span class="text-subtitle2">{{ cat }}</span>
        </div>
        <div class="row items-center q-gutter-xs">
          <q-btn
            size="sm"
            flat
            dense
            icon="task_alt"
            @click="setCategory(cat, 'allow')"
          />
          <q-btn
            size="sm"
            flat
            dense
            icon="block"
            @click="setCategory(cat, 'deny')"
          />
          <q-btn
            size="sm"
            flat
            dense
            icon="compare_arrows"
            @click="setCategory(cat, 'inherit')"
          />
        </div>
      </div>

      <div class="rk-perm-grid">
        <template v-for="item in itemsByCat(cat)" :key="item.key">
          <div class="rk-perm-row">
            <div class="rk-perm-col rk-perm-col--perm">
              <div class="row items-center q-gutter-sm">
                <q-icon :name="item.icon || 'tune'" size="16px" />
                <div>
                  <div class="text-body2 text-weight-medium">
                    {{ item.label || item.key }}
                  </div>
                  <div v-if="item.description" class="rk-perm-desc">
                    {{ item.description }}
                  </div>
                </div>
              </div>
            </div>
            <div class="rk-perm-col rk-perm-col--state">
              <q-radio
                :model-value="model[item.key]"
                val="allow"
                @update:model-value="(v) => update(item.key, v)"
                :disable="readonly"
              />
            </div>
            <div class="rk-perm-col rk-perm-col--state">
              <q-radio
                :model-value="model[item.key]"
                val="deny"
                @update:model-value="(v) => update(item.key, v)"
                :disable="readonly"
              />
            </div>
            <div class="rk-perm-col rk-perm-col--state">
              <q-radio
                :model-value="model[item.key]"
                val="inherit"
                @update:model-value="(v) => update(item.key, v)"
                :disable="readonly"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  catalog: { type: Object, required: true },
  modelValue: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "change"]);

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

function update(key, v) {
  const next = { ...model.value, [key]: v };
  model.value = next;
  emit("change");
}

function setCategory(cat, v) {
  const next = { ...model.value };
  for (const it of props.catalog.items)
    if (it.category === cat) next[it.key] = v;
  model.value = next;
  emit("change");
}

function itemsByCat(cat) {
  return props.catalog.items.filter((i) => i.category === cat);
}
</script>

<style scoped>
.rk-perm-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.26fr 0.26fr 0.26fr;
  gap: 8px;
}
.rk-perm-grid--head {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  backdrop-filter: blur(2px);
  z-index: 1;
}
.rk-perm-col--perm {
  padding: 6px 10px;
}
.rk-perm-col--state {
  display: flex;
  align-items: center;
  justify-content: center;
}
.rk-perm-category {
  padding: 8px 0;
}
.rk-perm-cat-header {
  padding: 6px 10px;
  margin: 6px 0;
  border-radius: 10px;
  background: rgba(127, 127, 127, 0.08);
}
.rk-perm-row {
  display: contents;
}
.rk-perm-desc {
  font-size: 12px;
  opacity: 0.78;
}
</style>
