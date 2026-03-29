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
                      <span class="rk-title-main">{{ labelFor(it) }}</span>
                      <q-badge outline class="rk-key-badge">{{ it.key }}</q-badge>
                      <q-badge
                        outline
                        class="rk-state-badge"
                        :class="`rk-state-badge--${stateOf(it.key)}`"
                      >
                        {{ stateLabel(stateOf(it.key)) }}
                      </q-badge>
                      <q-btn class="rk-ghost" flat round dense icon="content_copy" @click="copy(it.key)" />
                    </div>
                    <div class="rk-item-desc">{{ descriptionFor(it) }}</div>
                    <div class="rk-item-state-hint">{{ stateHint(stateOf(it.key)) }}</div>

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
const stateOf = (key) => valOf(props.workingPerms, key);
const labelFor = (item) => item.label || humanizeKey(item.key);
const descriptionFor = (item) =>
  item.description ||
  "Controla si este módulo o acción queda disponible, bloqueado o heredado desde la base.";
const humanizeKey = (key = "") =>
  String(key)
    .split(":")
    .map((part) => part.replace(/[-_]/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
const stateLabel = (state) =>
  ({ allow: "Permitido", deny: "Denegado", inherit: "Heredado" }[state] || "Heredado");
const stateHint = (state) =>
  ({
    allow: "El usuario tendrá acceso directo a esta función.",
    deny: "El usuario no podrá usar esta función aunque exista un perfil base.",
    inherit: "La decisión se tomará desde el perfil o configuración base.",
  }[state] || "La decisión se tomará desde la configuración base.");

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
/* ── Variables light ────────────────────────────────────────────── */
.rk-matrix {
  --allow:       #16a34a;  --allow-700:  #15803d;
  --deny:        #dc2626;  --deny-700:   #b91c1c;
  --inherit:     #64748b;  --inherit-700:#475569;
  --accent:      #06b6d4;

  --border:        rgba(6,182,212,.12);
  --border-strong: rgba(6,182,212,.22);
  --border-dash:   rgba(6,182,212,.18);
  --muted:         #64708a;
  --title:         rgba(15,23,42,.88);
  --bg:            #ffffff;
  --bg-soft:       rgba(6,182,212,.03);
  --bg-cat:        rgba(6,182,212,.04);
  --chip:          rgba(6,182,212,.08);
  --chipText:      rgba(15,23,42,.78);
  --shadow:        0 6px 20px rgba(6,182,212,.07), 0 2px 6px rgba(0,0,0,.04);

  --app-header:  56px;
  --banner:      64px;
  --tools:       170px;
  --page-padding:24px;
}

/* ── Variables dark ─────────────────────────────────────────────── */
.rk-matrix.rk-dark {
  --allow:       #22c55e;  --allow-700:  #16a34a;
  --deny:        #ef4444;  --deny-700:   #dc2626;
  --inherit:     #94a3b8;  --inherit-700:#64748b;
  --accent:      #22d3ee;

  --border:        rgba(6,182,212,.15);
  --border-strong: rgba(6,182,212,.28);
  --border-dash:   rgba(6,182,212,.22);
  --muted:         #8fa3bc;
  --title:         rgba(255,255,255,.90);
  --bg:            rgba(8,14,26,.97);
  --bg-soft:       rgba(6,182,212,.05);
  --bg-cat:        rgba(6,182,212,.06);
  --chip:          rgba(6,182,212,.1);
  --chipText:      rgba(255,255,255,.82);
  --shadow:        0 6px 24px rgba(0,0,0,.4);
}

/* ── Card base ───────────────────────────────────────────────────── */
.rk-matrix {
  background: var(--bg);
  border-radius: 18px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  margin-top: 10px;
  height: calc(100vh - (var(--app-header) + var(--banner) + var(--tools) + var(--page-padding) + 10px));
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
}

/* ── Overlay / Empty ────────────────────────────────────────────── */
.rk-overlay, .rk-empty { color: var(--muted); }
.rk-overlay .q-icon, .rk-empty .q-icon { color: var(--accent); opacity: .4; }

/* ── Scroll ─────────────────────────────────────────────────────── */
.rk-grid { padding: 10px; height: 100%; overflow: auto; scrollbar-gutter: stable; }
.rk-grid::-webkit-scrollbar { width: 6px; height: 6px; }
.rk-grid::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 6px; }

/* ── Categorías ─────────────────────────────────────────────────── */
.rk-cat {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg);
  margin: 0 4px 14px;
  overflow: hidden;
  transition: border-color .2s;
}
.rk-cat:hover { border-color: var(--border-strong); }

.rk-cat-head {
  padding: 10px 14px;
  border-bottom: 1px dashed var(--border-dash);
  background: var(--bg-cat);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rk-cat-title {
  color: var(--title);
  font-weight: 700;
  font-size: .88rem;
}
.rk-cat-title :deep(.q-icon[name="folder"]) { color: var(--accent); opacity: .7; }
.rk-badge {
  border-color: var(--border-strong);
  color: var(--muted);
  font-size: .75rem;
  border-radius: 999px;
  padding: 2px 8px;
}

/* ── Botones de operación masiva ─────────────────────────────────── */
.rk-op {
  height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  color: #fff !important;
  font-weight: 700;
  font-size: .78rem;
  letter-spacing: .1px;
  text-transform: none;
  border: none;
  transition: opacity .15s, transform .1s, box-shadow .15s;
}
.rk-op:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,.18); }
.rk-op :deep(.q-icon) { font-size: 15px; margin-right: 3px; }
.rk-op:disabled { opacity: .4; }

.rk-op--allow   { background: linear-gradient(135deg, var(--allow),   var(--allow-700));   box-shadow: 0 2px 8px rgba(22,163,74,.3); }
.rk-op--deny    { background: linear-gradient(135deg, var(--deny),    var(--deny-700));    box-shadow: 0 2px 8px rgba(220,38,38,.3); }
.rk-op--inherit { background: linear-gradient(135deg, var(--inherit), var(--inherit-700)); box-shadow: 0 2px 8px rgba(100,116,139,.25); }

/* ── Items ──────────────────────────────────────────────────────── */
.rk-cat-items { padding: 8px 10px 12px; display: flex; flex-direction: column; gap: 8px; }

.rk-item {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  transition: background .15s, border-color .15s, box-shadow .15s;
}
.rk-item:hover {
  background: var(--bg-soft);
  border-color: var(--border-strong);
}
.rk-item:focus-within {
  outline: none;
  box-shadow: 0 0 0 2px rgba(6,182,212,.25);
  border-color: var(--accent);
}

.rk-item-info { max-width: 70%; }
.rk-item-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
  font-size: .9rem;
  color: var(--title);
}
.rk-title-main { font-weight: 700; }
.rk-item-desc  { font-size: .85rem; color: var(--muted); margin-top: 3px; line-height: 1.4; }
.rk-item-state-hint { font-size: .78rem; color: var(--muted); margin-top: 2px; opacity: .8; }

.rk-key-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: .73rem;
  color: var(--accent);
  border-color: var(--border-strong);
  border-radius: 6px;
  padding: 2px 6px;
  opacity: .85;
}

.rk-state-badge--allow   { color: var(--allow);   border-color: color-mix(in srgb, var(--allow)   50%, transparent); }
.rk-state-badge--deny    { color: var(--deny);    border-color: color-mix(in srgb, var(--deny)    50%, transparent); }
.rk-state-badge--inherit { color: var(--inherit); border-color: color-mix(in srgb, var(--inherit) 50%, transparent); }

.rk-item-actions { gap: 8px; }

/* ── Acciones ghost ─────────────────────────────────────────────── */
.rk-ghost { color: var(--muted); border-radius: 8px; transition: background .12s, color .12s; }
.rk-ghost:hover { background: var(--chip); color: var(--accent); }

/* ── Toggle tri-estado ──────────────────────────────────────────── */
.rk-tri :deep(.q-btn-group) {
  background: var(--chip);
  border: 1px solid var(--border);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: none;
}
.rk-tri :deep(.q-btn) {
  min-width: 96px;
  padding: 0 12px;
  border-radius: 999px !important;
  font-weight: 700;
  font-size: .8rem;
  letter-spacing: .2px;
  color: var(--chipText);
  background: transparent;
  transition: background .12s;
}
.rk-tri :deep(.q-btn.q-btn--actionable:hover) { background: rgba(6,182,212,.08); }

.rk-tri :deep(.q-btn:nth-child(1).q-btn--active) { background: linear-gradient(135deg, var(--allow), var(--allow-700)); }
.rk-tri :deep(.q-btn:nth-child(2).q-btn--active) { background: linear-gradient(135deg, var(--deny),  var(--deny-700));  }
.rk-tri :deep(.q-btn:nth-child(3).q-btn--active) { background: linear-gradient(135deg, var(--inherit), var(--inherit-700)); }
.rk-tri :deep(.q-btn.q-btn--active) { color: #fff !important; box-shadow: 0 2px 8px rgba(0,0,0,.2); }

/* ── Estrella favorito ──────────────────────────────────────────── */
.rk-star        { color: var(--muted); transition: color .15s, transform .12s; }
.rk-star:hover  { transform: scale(1.15); }
.rk-star--on    { color: #f59e0b; }

/* ── Tags / estados ─────────────────────────────────────────────── */
.rk-tags :deep(.q-badge) { border-radius: 8px; font-size: .72rem; }

/* ── Resaltado diferencias ──────────────────────────────────────── */
.rk-diff     { outline: 1px dashed rgba(6,182,212,.4);    background: rgba(6,182,212,.04);  }
.rk-conflict { outline: 1px solid  rgba(220,38,38,.45);   background: rgba(220,38,38,.04);  }
.rk-changed  { outline: 1px solid  rgba(245,158,11,.35);  background: rgba(245,158,11,.04); }

.rk-dark .rk-diff     { background: rgba(6,182,212,.08);  }
.rk-dark .rk-conflict { background: rgba(220,38,38,.10);  }
.rk-dark .rk-changed  { background: rgba(245,158,11,.09); }

/* ── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 860px) { .rk-tri :deep(.q-btn) { min-width: 82px; } }
@media (max-width: 640px) {
  .rk-item-info    { max-width: 100%; }
  .rk-item-actions { width: 100%; justify-content: flex-end; margin-top: 8px; }
}
</style>
