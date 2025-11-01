<template>
  <q-card flat bordered :class="cardTone" class="rk-matrix">
    <div
      v-if="!hasTarget"
      class="rk-overlay column items-center justify-center"
    >
      <q-icon name="touch_app" size="56px" class="q-mb-sm" />
      <div class="text-subtitle1 text-weight-medium q-mb-xs">
        Seleccione un objetivo
      </div>
      <div class="text-caption q-mb-md">
        <span v-if="mode === 'user'"
          >Busque y seleccione un usuario en la columna izquierda.</span
        >
        <span v-else
          >Seleccione un perfil o cree uno nuevo en la columna izquierda.</span
        >
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          v-if="mode === 'user'"
          color="primary"
          outline
          icon="person_search"
          label="Ir al buscador de usuarios"
          @click="$emit('request-focus-user-search')"
        />
        <q-btn
          v-else
          color="deep-purple"
          outline
          icon="add"
          label="Crear nuevo perfil"
          @click="$emit('request-create-profile')"
        />
      </div>
    </div>

    <div v-else-if="loading" class="q-pa-md">
      <q-skeleton type="rect" class="q-mb-sm" height="40px" />
      <q-skeleton type="rect" class="q-mb-sm" height="40px" />
      <q-skeleton type="rect" class="q-mb-sm" height="40px" />
    </div>

    <template v-else>
      <div
        v-if="!grouped.length"
        class="rk-empty column items-center justify-center"
      >
        <q-icon name="search_off" size="48px" class="q-mb-sm" />
        <div class="text-subtitle1 text-weight-medium q-mb-xs">
          Sin resultados
        </div>
        <div class="text-caption">Ajuste la búsqueda o los filtros.</div>
      </div>

      <div v-else class="rk-grid rk-scroll">
        <div v-for="cat in grouped" :key="cat.name" class="rk-cat">
          <div class="rk-cat-head row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-btn
                dense
                round
                flat
                :icon="isCollapsed(cat.name) ? 'chevron_right' : 'expand_more'"
                @click="emitToggleCat(cat.name)"
              />
              <q-icon name="folder" size="18px" />
              <div class="text-subtitle2 text-weight-medium">
                {{ cat.name }}
              </div>
              <q-badge outline>{{ cat.items.length }}</q-badge>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-btn
                dense
                flat
                size="sm"
                @click="emitSetCategory(cat.items, 'allow')"
                :disable="!editable"
                >Permitir</q-btn
              >
              <q-btn
                dense
                flat
                size="sm"
                @click="emitSetCategory(cat.items, 'deny')"
                :disable="!editable"
                >Denegar</q-btn
              >
              <q-btn
                dense
                flat
                size="sm"
                @click="emitSetCategory(cat.items, 'inherit')"
                :disable="!editable"
                >Heredar</q-btn
              >
            </div>
          </div>

          <q-slide-transition>
            <div v-show="!isCollapsed(cat.name)">
              <q-separator />
              <div class="rk-cat-items">
                <div
                  v-for="it in cat.items"
                  :key="it.key"
                  class="rk-item row items-center justify-between"
                  :class="{
                    'rk-diff': showDiffs && isDifferentFromHighlight(it.key),
                    'rk-conflict':
                      showConflicts && isConflictAgainstHighlight(it.key),
                    'rk-changed': showChanges && isChanged(it.key),
                  }"
                >
                  <div class="rk-item-info">
                    <div class="rk-item-title">
                      <span class="rk-key">{{ it.key }}</span>
                      <q-btn
                        flat
                        round
                        dense
                        icon="content_copy"
                        @click="copy(it.key)"
                      />
                    </div>
                    <div class="rk-item-desc">
                      {{ it.label || it.description || "Permiso" }}
                    </div>
                    <div class="rk-tags row q-gutter-xs">
                      <q-badge
                        v-if="showDiffs && isDifferentFromHighlight(it.key)"
                        color="info"
                        outline
                        >Diferencia</q-badge
                      >
                      <q-badge
                        v-if="
                          showConflicts && isConflictAgainstHighlight(it.key)
                        "
                        color="negative"
                        outline
                        >Conflicto</q-badge
                      >
                      <q-badge
                        v-if="showChanges && isChanged(it.key)"
                        color="orange"
                        outline
                        >Modificado</q-badge
                      >
                      <q-badge v-if="isFav(it.key)" color="amber" outline
                        >Favorito</q-badge
                      >
                    </div>
                  </div>

                  <div class="rk-item-actions row items-center">
                    <q-btn-toggle
                      v-model="localMap[it.key]"
                      :options="triOptions"
                      dense
                      unelevated
                      glossy
                      toggle-color="primary"
                      :disable="!editable"
                      @update:model-value="(val) => emitSetPerm(it.key, val)"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      :color="isFav(it.key) ? 'amber' : 'grey'"
                      :icon="isFav(it.key) ? 'star' : 'star_border'"
                      @click="emitToggleFav(it.key)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </q-slide-transition>
        </div>
      </div>
    </template>
  </q-card>
</template>

<script setup>
import { computed, ref, watch, defineProps, defineEmits } from "vue";

const props = defineProps({
  cardTone: { type: String, default: "" },
  mode: { type: String, default: "user" },
  hasTarget: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },

  catalog: { type: Object, default: () => ({ categories: [], items: [] }) },
  workingPerms: { type: Object, default: () => ({}) },
  baseSnapshot: { type: Object, default: () => ({}) },

  searchQ: { type: String, default: "" },
  onlyFavs: { type: Boolean, default: false },
  onlyChanged: { type: Boolean, default: false },
  favs: { type: Array, default: () => [] },
  collapsed: { type: Array, default: () => [] },

  triOptions: { type: Array, default: () => [] },

  // Resaltado
  highlightSource: { type: [String, null], default: null }, // null | 'base' | 'profile'
  highlightCompareMap: { type: Object, default: () => ({}) }, // cuando 'profile'
});

const emit = defineEmits([
  "toggle-cat",
  "toggle-fav",
  "set-perm",
  "set-category",
  "request-focus-user-search",
  "request-create-profile",
]);

/* ===== Local mirrors ===== */
const localMap = ref({ ...props.workingPerms });
watch(
  () => props.workingPerms,
  (v) => {
    localMap.value = { ...v };
  },
  { deep: true }
);

/* ===== Helpers ===== */
const favSet = computed(() => new Set(props.favs || []));
const collapsedSet = computed(() => new Set(props.collapsed || []));
const valOf = (map, k) => map?.[k] ?? "inherit";
const opposite = (x, y) =>
  (x === "allow" && y === "deny") || (x === "deny" && y === "allow");

const changedKeysSet = computed(() => {
  const before = props.baseSnapshot || {};
  const after = props.workingPerms || {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const out = new Set();
  keys.forEach((k) => {
    if (valOf(before, k) !== valOf(after, k)) out.add(k);
  });
  return out;
});

/* ===== Filtrado & agrupación ===== */
const filteredItems = computed(() => {
  const q = (props.searchQ || "").toLowerCase();
  const changed = changedKeysSet.value;
  return (props.catalog.items || []).filter((i) => {
    const text = `${i.key} ${i.label || ""} ${
      i.description || ""
    }`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (props.onlyFavs && !favSet.value.has(i.key)) return false;
    if (props.onlyChanged && !changed.has(i.key)) return false;
    return true;
  });
});

const grouped = computed(() => {
  const map = new Map();
  for (const it of filteredItems.value) {
    if (!map.has(it.category)) map.set(it.category, []);
    map.get(it.category).push(it);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
});

/* ===== Comparaciones (resaltado) ===== */
const isChanged = (key) =>
  valOf(props.baseSnapshot, key) !== valOf(props.workingPerms, key);

const isDifferentFromHighlight = (key) => {
  if (!props.highlightSource) return false;
  const a = valOf(props.workingPerms, key);
  const b =
    props.highlightSource === "base"
      ? valOf(props.baseSnapshot, key)
      : valOf(props.highlightCompareMap, key);
  return a !== b;
};

const isConflictAgainstHighlight = (key) => {
  if (!props.highlightSource) return false;
  const a = valOf(props.workingPerms, key);
  const b =
    props.highlightSource === "base"
      ? valOf(props.baseSnapshot, key)
      : valOf(props.highlightCompareMap, key);
  return opposite(a, b);
};

/* ===== Fav / colapso / acciones ===== */
const isFav = (k) => favSet.value.has(k);
const emitToggleFav = (k) => emit("toggle-fav", k);
const isCollapsed = (name) => collapsedSet.value.has(name);
const emitToggleCat = (name) => emit("toggle-cat", name);

const emitSetPerm = (key, val) => emit("set-perm", { key, val });
const emitSetCategory = (items, val) => {
  const keys = items.map((i) => i.key);
  emit("set-category", { name: items?.[0]?.category || "", keys, val });
};

/* ===== Copy ===== */
const copy = async (txt) => {
  try {
    await navigator.clipboard?.writeText(txt);
  } catch (e) {}
};
</script>

<style scoped>
.rk-matrix {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(127, 127, 127, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02),
    0 8px 24px rgba(0, 0, 0, 0.05);
}
.rk-overlay {
  height: 100%;
  min-height: 46vh;
  padding: 36px 12px;
  text-align: center;
  color: rgba(127, 127, 127, 0.92);
}
.rk-empty {
  min-height: 40vh;
  text-align: center;
  color: rgba(127, 127, 127, 0.88);
}
.rk-grid {
  padding: 10px;
  height: 100%;
  overflow: auto;
  scrollbar-gutter: stable;
}
.rk-cat {
  border: 1px solid rgba(127, 127, 127, 0.12);
  border-radius: 14px;
  margin-bottom: 12px;
  background: linear-gradient(
    180deg,
    rgba(127, 127, 127, 0.04),
    rgba(127, 127, 127, 0.02)
  );
  transition: box-shadow 0.2s ease;
}
.rk-cat:hover {
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
}
.rk-cat-head {
  padding: 8px 10px;
}
.rk-cat-items {
  padding: 2px 8px 8px 8px;
}
.rk-item {
  padding: 10px 10px;
  border-radius: 12px;
  transition: background 0.15s ease, transform 0.06s ease, box-shadow 0.15s ease;
  border: 1px solid rgba(127, 127, 127, 0.1);
}
.rk-item:hover {
  background: rgba(127, 127, 127, 0.06);
}
.rk-item-info {
  max-width: 70%;
}
.rk-item-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}
.rk-key {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 0.86rem;
}
.rk-item-desc {
  font-size: 0.8rem;
  opacity: 0.92;
}
.rk-item-actions {
  gap: 6px;
}
.rk-tags :deep(.q-badge) {
  border-radius: 8px;
}
.rk-diff {
  outline: 1px dashed rgba(33, 150, 243, 0.38);
}
.rk-conflict {
  outline: 1px solid rgba(244, 67, 54, 0.5);
  background: rgba(244, 67, 54, 0.06);
}
.rk-changed {
  box-shadow: inset 0 0 0 1px rgba(255, 152, 0, 0.45);
}
</style>
