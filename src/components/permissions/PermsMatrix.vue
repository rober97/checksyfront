<template>
  <q-card
    flat
    bordered
    :class="[
      cardTone,
      'rk-matrix',
      { 'rk-dark': $q.dark.isActive }  // << tema oscuro
    ]"
  >
    <!-- ===== Overlay inicial ===== -->
    <div v-if="!hasTarget" class="rk-overlay column items-center justify-center">
      <q-icon name="touch_app" size="56px" class="q-mb-sm" />
      <div class="text-subtitle1 text-weight-medium q-mb-xs">Seleccione un objetivo</div>
      <div class="text-caption q-mb-md">
        <span v-if="mode === 'user'">Busque y seleccione un usuario en la columna izquierda.</span>
        <span v-else>Seleccione un perfil o cree uno nuevo en la columna izquierda.</span>
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

    <!-- ===== Cargando ===== -->
    <div v-else-if="loading" class="q-pa-md">
      <q-skeleton type="rect" class="q-mb-sm" height="40px" />
      <q-skeleton type="rect" class="q-mb-sm" height="40px" />
      <q-skeleton type="rect" class="q-mb-sm" height="40px" />
    </div>

    <!-- ===== Matriz ===== -->
    <template v-else>
      <div v-if="!grouped.length" class="rk-empty column items-center justify-center">
        <q-icon name="search_off" size="48px" class="q-mb-sm" />
        <div class="text-subtitle1 text-weight-medium q-mb-xs">Sin resultados</div>
        <div class="text-caption">Ajuste la búsqueda o los filtros.</div>
      </div>

      <div v-else class="rk-grid rk-scroll">
        <div v-for="cat in grouped" :key="cat.name" class="rk-cat">
          <!-- Header de categoría -->
          <div class="rk-cat-head row items-center justify-between">
            <div class="row items-center q-gutter-sm rk-cat-title">
              <q-btn
                dense round flat
                :icon="isCollapsed(cat.name) ? 'chevron_right' : 'expand_more'"
                @click="emitToggleCat(cat.name)"
              />
              <q-icon name="folder" size="18px" />
              <div class="text-subtitle2 text-weight-medium">{{ cat.name }}</div>
              <q-badge outline class="rk-badge">{{ cat.items.length }}</q-badge>
            </div>

            <!-- Acciones masivas -->
            <div class="row items-center q-gutter-xs">
              <q-btn
                dense class="rk-op rk-op--allow"
                icon="check_circle" label="Permitir"
                @click="emitSetCategory(cat.items, 'allow')" :disable="!editable"
              />
              <q-btn
                dense class="rk-op rk-op--deny"
                icon="block" label="Denegar"
                @click="emitSetCategory(cat.items, 'deny')" :disable="!editable"
              />
              <q-btn
                dense class="rk-op rk-op--inherit"
                icon="change_history" label="Heredar"
                @click="emitSetCategory(cat.items, 'inherit')" :disable="!editable"
              />
            </div>
          </div>

          <!-- Items -->
          <q-slide-transition>
            <div v-show="!isCollapsed(cat.name)">
              <div class="rk-cat-items">
                <div
                  v-for="it in cat.items" :key="it.key"
                  class="rk-item row items-center justify-between"
                  :class="{
                    'rk-diff': showDiffs && isDifferentFromHighlight(it.key),
                    'rk-conflict': showConflicts && isConflictAgainstHighlight(it.key),
                    'rk-changed': showChanges && isChanged(it.key),
                  }"
                >
                  <div class="rk-item-info">
                    <div class="rk-item-title">
                      <span class="rk-key">{{ it.key }}</span>
                      <q-btn class="rk-ghost" flat round dense icon="content_copy" @click="copy(it.key)" />
                    </div>
                    <div class="rk-item-desc">{{ it.label || it.description || "Permiso" }}</div>

                    <div class="rk-tags row q-gutter-xs">
                      <q-badge v-if="showDiffs && isDifferentFromHighlight(it.key)" color="info" outline>Diferencia</q-badge>
                      <q-badge v-if="showConflicts && isConflictAgainstHighlight(it.key)" color="negative" outline>Conflicto</q-badge>
                      <q-badge v-if="showChanges && isChanged(it.key)" color="orange" outline>Modificado</q-badge>
                      <q-badge v-if="isFav(it.key)" color="amber" outline>Favorito</q-badge>
                    </div>
                  </div>

                  <div class="rk-item-actions row items-center">
                    <q-btn-toggle
                      v-model="localMap[it.key]"
                      :options="triOptions"
                      dense unelevated no-caps
                      toggle-text-color="white"
                      class="rk-tri"
                      :disable="!editable"
                      @update:model-value="(val) => emitSetPerm(it.key, val)"
                    />
                    <q-btn
                      flat round dense
                      :class="['rk-star', isFav(it.key) && 'rk-star--on']"
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
import { useQuasar } from "quasar";

const $q = useQuasar();

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

  highlightSource: { type: [String, null], default: null },
  highlightCompareMap: { type: Object, default: () => ({}) },
});

const emit = defineEmits([
  "toggle-cat", "toggle-fav", "set-perm", "set-category",
  "request-focus-user-search", "request-create-profile",
]);

/* ===== Local mirrors ===== */
const localMap = ref({ ...props.workingPerms });
watch(() => props.workingPerms, v => { localMap.value = { ...v }; }, { deep: true });

/* ===== Helpers ===== */
const favSet = computed(() => new Set(props.favs || []));
const collapsedSet = computed(() => new Set(props.collapsed || []));
const valOf = (map, k) => map?.[k] ?? "inherit";
const opposite = (x, y) => (x === "allow" && y === "deny") || (x === "deny" && y === "allow");

const changedKeysSet = computed(() => {
  const before = props.baseSnapshot || {};
  const after  = props.workingPerms || {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const out = new Set();
  keys.forEach(k => { if (valOf(before, k) !== valOf(after, k)) out.add(k); });
  return out;
});

/* ===== Filtrado & agrupación ===== */
const filteredItems = computed(() => {
  const q = (props.searchQ || "").toLowerCase();
  const changed = changedKeysSet.value;
  return (props.catalog.items || []).filter(i => {
    const text = `${i.key} ${i.label || ""} ${i.description || ""}`.toLowerCase();
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

/* ===== Comparaciones ===== */
const isChanged = (key) => valOf(props.baseSnapshot, key) !== valOf(props.workingPerms, key);

const isDifferentFromHighlight = (key) => {
  if (!props.highlightSource) return false;
  const a = valOf(props.workingPerms, key);
  const b = props.highlightSource === "base" ? valOf(props.baseSnapshot, key) : valOf(props.highlightCompareMap, key);
  return a !== b;
};

const isConflictAgainstHighlight = (key) => {
  if (!props.highlightSource) return false;
  const a = valOf(props.workingPerms, key);
  const b = props.highlightSource === "base" ? valOf(props.baseSnapshot, key) : valOf(props.highlightCompareMap, key);
  return opposite(a, b);
};

/* ===== Fav / colapso / acciones ===== */
const isFav = (k) => favSet.value.has(k);
const emitToggleFav = (k) => emit("toggle-fav", k);
const isCollapsed = (name) => collapsedSet.value.has(name);
const emitToggleCat = (name) => emit("toggle-cat", name);
const emitSetPerm = (key, val) => emit("set-perm", { key, val });
const emitSetCategory = (items, val) => {
  const keys = items.map(i => i.key);
  emit("set-category", { name: items?.[0]?.category || "", keys, val });
};

/* ===== Copy ===== */
const copy = async (txt) => { try { await navigator.clipboard?.writeText(txt); } catch (e) {} };
</script>

<style scoped>
/* ======================== */
/*  Variables por tema      */
/* ======================== */
/* DARK override cuando $q.dark.isActive */
.rk-matrix.rk-dark{
  --allow:  #22c55e;  --allow-700:#16a34a;
  --deny:   #ef4444;  --deny-700:#dc2626;
  --inherit:#94a3b8;  --inherit-700:#64748b;

  --border: rgba(255,255,255,.09);
  --border-strong: rgba(255,255,255,.16);
  --muted: #a2b1c9;
  --title: #e8eefc;
  --bg: #0f1524;
  --bg-soft: #121a2d;
  --chip: #1b243a;
  --chipText: #e5edff;
  --app-header: 56px;   /* QHeader */
  --banner: 64px;       /* tu barra superior con chips, etc. */
  --tools: 170px;        /* barra de filtros / acciones */
  --page-padding: 24px; /* paddings y separadores */
}
.rk-matrix{
  /* LIGHT */
  --allow:  #16a34a;  --allow-700:#15803d;
  --deny:   #dc2626;  --deny-700:#b91c1c;
  --inherit:#64748b;  --inherit-700:#475569;

  --border: rgba(18,29,61,.14);
  --border-strong: rgba(18,29,61,.22);
  --muted: #64708a;
  --title: #1e2430;
  --bg: #fff;
  --bg-soft: #f7f8fb;
  --chip: #eef2f6;
  --chipText: #334155;
  --app-header: 56px;   /* QHeader */
  --banner: 64px;       /* tu barra superior con chips, etc. */
  --tools: 170px;        /* barra de filtros / acciones */
  --page-padding: 24px; /* paddings y separadores */
}

.rk-matrix{
  background: var(--bg);
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 6px 16px rgba(19,31,70,.05);
  margin-top: 10px;

  height: calc(100vh - (var(--app-header) + var(--banner) + var(--tools) + var(--page-padding) + 10px)); /* +10 por el margin-top */
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
}

.rk-matrix.rk-dark{
  box-shadow: 0 6px 18px rgba(0,0,0,.35);
}

/* Overlay / Empty */
.rk-overlay, .rk-empty{ color: var(--muted); }

/* -------- Scroll -------- */
.rk-grid{ padding: 8px; height:100%; overflow:auto; scrollbar-gutter:stable; }
.rk-grid::-webkit-scrollbar{ height:10px; width:10px }
.rk-grid::-webkit-scrollbar-thumb{ background: var(--border-strong); border-radius: 8px }

/* -------- Categorías -------- */
.rk-cat{
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg);
  margin: 10px 6px 14px;
}
.rk-cat-head{
  padding: 10px 12px;
  border-bottom: 1px dashed var(--border);
  background: linear-gradient(180deg,var(--bg-soft),var(--bg));
}
.rk-cat-title{ color: var(--title); }
.rk-badge{ border-color: var(--border); color: var(--muted) }

/* Acciones masivas */
.rk-op{
  border-radius: 999px;
  padding: 4px 12px;
  color:#fff !important;
  font-weight: 700;
  text-transform: none;
}
.rk-op .q-icon{ font-size:18px; margin-right:4px }
.rk-op:disabled{ opacity:.5 }
.rk-op--allow{ background: var(--allow); }
.rk-op--allow:hover{ background: var(--allow-700); }
.rk-op--deny{ background: var(--deny); }
.rk-op--deny:hover{ background: var(--deny-700); }
.rk-op--inherit{ background: var(--inherit); }
.rk-op--inherit:hover{ background: var(--inherit-700); }

/* -------- Items -------- */
.rk-cat-items{ padding: 6px 8px 10px; }
.rk-item{
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  transition: background .15s ease, box-shadow .15s ease, transform .06s ease;
}
.rk-item + .rk-item{ margin-top: 8px }
.rk-item:hover{ background: var(--bg-soft) }
.rk-item:focus-within{ outline: none; box-shadow: 0 0 0 2px rgba(182,214,255,.6); }
.rk-matrix.rk-dark .rk-item:focus-within{ box-shadow: 0 0 0 2px rgba(99,167,255,.35); }

.rk-item-info{ max-width: 70% }
.rk-item-title{ display:flex; align-items:center; gap:6px; font-weight:700; color: var(--title) }
.rk-key{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
  font-size: .9rem;
}
.rk-item-desc{ font-size:.85rem; color: var(--muted) }
.rk-item-actions{ gap: 8px }

/* Ghost actions */
.rk-ghost{ color: var(--muted) }
.rk-ghost:hover{ background: var(--chip) }

/* -------- Toggle tri-color -------- */
.rk-tri :deep(.q-btn-group){
  background: var(--chip);
  border: 1px solid var(--border);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: none;
}
.rk-tri :deep(.q-btn){
  min-width: 96px;
  padding: 0 10px;
  border-radius: 999px !important;
  font-weight: 800;
  letter-spacing: .2px;
  color: var(--chipText);
  background: transparent;
}
.rk-tri :deep(.q-btn.q-btn--actionable:hover){ background: rgba(0,0,0,.06) }
.rk-matrix.rk-dark .rk-tri :deep(.q-btn.q-btn--actionable:hover){ background: rgba(255,255,255,.06) }

/* Activo */
.rk-tri :deep(.q-btn:nth-child(1).q-btn--active){ background: var(--allow); }
.rk-tri :deep(.q-btn:nth-child(2).q-btn--active){ background: var(--deny); }
.rk-tri :deep(.q-btn:nth-child(3).q-btn--active){ background: var(--inherit); }
.rk-tri :deep(.q-btn.q-btn--active){ color:#fff !important; box-shadow: none; }

/* Estrella */
.rk-star{ color:#a2a9b5 }
.rk-dark .rk-star{ color:#c9d1e5 }
.rk-star--on{ color:#f59e0b }

/* Tags / estados */
.rk-tags :deep(.q-badge){ border-radius: 8px; border-color: var(--border); color: var(--muted) }
.rk-diff{ outline: 1px dashed rgba(25,118,210,.35); background: #eaf3ff }
.rk-conflict{ outline: 1px solid rgba(211,47,47,.45); background: #fff3f3 }
.rk-changed{ box-shadow: inset 0 0 0 2px rgba(255,152,0,.28); background:#fff8ea }
.rk-dark .rk-diff{ background: rgba(56,108,217,.15) }
.rk-dark .rk-conflict{ background: rgba(211,47,47,.12) }
.rk-dark .rk-changed{ background: rgba(255,184,77,.12) }

/* Responsive */
@media (max-width: 860px){ .rk-tri :deep(.q-btn){ min-width: 86px } }
@media (max-width: 640px){
  .rk-item-info{ max-width: 100% }
  .rk-item-actions{ width: 100%; justify-content: flex-end; margin-top: 6px }
}
</style>
