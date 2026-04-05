<template>
  <q-card flat bordered :class="cardTone" class="rk-tools q-pa-sm q-px-md q-py-sm">
    <div class="rk-toolbar">
      <!-- === BUSCADOR ================================================== -->
      <div class="rk-left">
        <q-input
          v-model="searchQLocal"
          dense outlined clearable
          placeholder="Buscar permiso (clave, nombre o descripción)"
          class="rk-field"
          @keydown.enter="emitSearch"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <!-- === ACCIONES + CONTADORES ===================================== -->
      <div class="rk-right">
        <div class="rk-filters" aria-label="Filtros rápidos de permisos">
          <q-btn
            dense
            flat
            no-caps
            icon="star"
            label="Solo favoritos"
            class="rk-filter rk-btn--pill"
            :class="{ 'rk-filter--active': onlyFavs }"
            @click="emit('update:onlyFavs', !onlyFavs)"
          />

          <q-btn
            dense
            flat
            no-caps
            icon="edit_note"
            label="Solo modificados"
            class="rk-filter rk-btn--pill"
            :class="{ 'rk-filter--active': onlyChanged }"
            @click="emit('update:onlyChanged', !onlyChanged)"
          />

          <q-btn
            v-if="hasActiveFilters"
            dense
            flat
            no-caps
            icon="filter_alt_off"
            label="Limpiar"
            class="rk-filter rk-btn--pill"
            @click="clearFilters"
          />

          <q-badge outline class="rk-visible-count">
            {{ totalVisible }} visibles
          </q-badge>
        </div>

        <div class="rk-actions" aria-label="Acciones masivas sobre permisos">
          <!-- Permitir -->
          <q-btn
            dense
            outline
            icon="done_all"
            label="Permitir todo"
            class="rk-btn rk-btn--pill"
            :class="{'rk-active rk-active--allow': selectedAction==='allow'}"
            :aria-pressed="selectedAction==='allow'"
            @click="onBulk('allow')"
            :disable="!editable"
          />

          <!-- Denegar -->
          <q-btn
            dense
            outline
            icon="block"
            label="Denegar todo"
            class="rk-btn rk-btn--pill"
            :class="{'rk-active rk-active--deny': selectedAction==='deny'}"
            :aria-pressed="selectedAction==='deny'"
            @click="onBulk('deny')"
            :disable="!editable"
          />

          <!-- Heredar -->
          <q-btn
            dense
            outline
            icon="backspace"
            label="Heredar todo"
            class="rk-btn rk-btn--pill"
            :class="{'rk-active rk-active--inherit': selectedAction==='inherit'}"
            :aria-pressed="selectedAction==='inherit'"
            @click="onBulk('inherit')"
            :disable="!editable"
          />
        </div>

        <q-separator vertical class="rk-vsep" />

        <div class="rk-stats" aria-label="Resumen de permisos aplicados">
          <q-chip
            square
            class="rk-stat rk-ok"
            :class="{'rk-stat--glow': selectedAction==='allow'}"
            clickable
          >
            <q-icon name="check_circle" class="q-mr-xs" /> {{ allowCount }}
          </q-chip>

          <q-chip
            square
            class="rk-stat rk-bad"
            :class="{'rk-stat--glow': selectedAction==='deny'}"
            clickable
          >
            <q-icon name="do_not_disturb_on" class="q-mr-xs" /> {{ denyCount }}
          </q-chip>

          <q-chip
            square
            class="rk-stat rk-mid"
            :class="{'rk-stat--glow': selectedAction==='inherit'}"
            clickable
          >
            <q-icon name="change_history" class="q-mr-xs" /> {{ inheritCount }}
          </q-chip>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { computed, ref, watch, defineProps, defineEmits } from "vue";

const props = defineProps({
  cardTone: { type: String, default: "" },
  editable: { type: Boolean, default: false },
  searchQ: { type: String, default: "" },
  onlyFavs: { type: Boolean, default: false },
  onlyChanged: { type: Boolean, default: false },
  totalVisible: { type: Number, default: 0 },
  allowCount: { type: Number, default: 0 },
  denyCount: { type: Number, default: 0 },
  inheritCount: { type: Number, default: 0 },
});

const emit = defineEmits([
  "update:searchQ",
  "update:onlyFavs",
  "update:onlyChanged",
  "bulk-set",
]);

const searchQLocal = ref(props.searchQ);
watch(() => props.searchQ, v => { searchQLocal.value = v; });
watch(searchQLocal, v => emit("update:searchQ", v));

const selectedAction = ref(null); // 'allow' | 'deny' | 'inherit' | null
const hasActiveFilters = computed(() => !!props.onlyFavs || !!props.onlyChanged || !!searchQLocal.value);

const onBulk = (action) => {
  // Toggle: si vuelven a apretar el mismo, se des-selecciona visualmente
  selectedAction.value = selectedAction.value === action ? null : action;
  emit("bulk-set", action);
};

const emitSearch = () => emit("update:searchQ", searchQLocal.value);
const clearFilters = () => {
  searchQLocal.value = "";
  emit("update:onlyFavs", false);
  emit("update:onlyChanged", false);
};
</script>

<style scoped>
/* ── Variables de tema ───────────────────────────────────────────── */
.rk-tools {
  --t-bg:           #ffffff;
  --t-bg-soft:      rgba(6,182,212,.04);
  --t-border:       rgba(6,182,212,.14);
  --t-title:        rgba(15,23,42,.85);
  --t-muted:        rgba(15,23,42,.50);
  --t-icon:         #06b6d4;
  --t-btn-border:   rgba(6,182,212,.22);
  --t-btn-hover:    rgba(6,182,212,.08);
  --t-filter-active-bg: rgba(6,182,212,.12);
  --t-filter-active-border: rgba(6,182,212,.4);
  --t-filter-active-color: #0891b2;
  --t-shadow:       0 6px 20px rgba(6,182,212,.07), 0 2px 6px rgba(0,0,0,.04);
}
.body--dark .rk-tools {
  --t-bg:           rgba(10,16,28,.96);
  --t-bg-soft:      rgba(6,182,212,.06);
  --t-border:       rgba(6,182,212,.18);
  --t-title:        rgba(255,255,255,.90);
  --t-muted:        rgba(255,255,255,.48);
  --t-icon:         #22d3ee;
  --t-btn-border:   rgba(6,182,212,.28);
  --t-btn-hover:    rgba(6,182,212,.1);
  --t-filter-active-bg:     rgba(6,182,212,.18);
  --t-filter-active-border: rgba(6,182,212,.5);
  --t-filter-active-color:  #22d3ee;
  --t-shadow:       0 6px 24px rgba(0,0,0,.3);
}

/* ── Card ────────────────────────────────────────────────────────── */
.rk-tools {
  border-radius: 18px;
  border: 1px solid var(--t-border);
  background: var(--t-bg);
  box-shadow: var(--t-shadow);
  overflow: visible;
}

/* ── Layout: columna (search arriba, acciones abajo) ────────────── */
.rk-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Fila 1: buscador ocupa todo el ancho */
.rk-left {
  width: 100%;
}

/* Fila 2: filtros + acciones + stats en fila horizontal */
.rk-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ── Buscador ────────────────────────────────────────────────────── */
.rk-field,
.rk-field :deep(.q-input),
.rk-field :deep(.q-field) {
  width: 100%;
  display: block;
}
.rk-field :deep(.q-field__control) {
  height: 42px;
  min-height: 42px;
  border-radius: 14px !important;
  background: var(--t-bg-soft);
  border-color: var(--t-border) !important;
  transition: border-color .2s, box-shadow .2s;
}
.rk-field :deep(.q-field__control:hover) { border-color: var(--t-icon) !important; }
.rk-field :deep(.q-field--focused .q-field__control) {
  border-color: var(--t-icon) !important;
  box-shadow: 0 0 0 3px rgba(6,182,212,.12);
}
.rk-field :deep(.q-field__native) { padding-top: 0; padding-bottom: 0; }
.rk-field :deep(.q-field__prepend) { color: var(--t-icon); }

/* ── Filtros rápidos ─────────────────────────────────────────────── */
.rk-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.rk-filter {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--t-btn-border);
  color: var(--t-muted);
  background: transparent;
  font-size: .82rem;
  font-weight: 600;
  transition: background .15s, border-color .15s, color .15s;
}
.rk-filter:hover { background: var(--t-btn-hover); color: var(--t-title); }
.rk-filter--active {
  background: var(--t-filter-active-bg);
  border-color: var(--t-filter-active-border);
  color: var(--t-filter-active-color);
}

.rk-visible-count {
  border-radius: 999px;
  height: 28px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  font-size: .78rem;
  font-weight: 700;
  color: var(--t-muted);
  border-color: var(--t-btn-border);
}

/* ── Acciones masivas ────────────────────────────────────────────── */
.rk-actions { display: flex; align-items: center; gap: 8px; overflow: visible; }

.rk-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--t-btn-border);
  color: var(--t-title);
  background: transparent;
  font-size: .82rem;
  font-weight: 700;
  letter-spacing: .2px;
  position: relative;
  overflow: visible;
  transition: background .15s, border-color .15s, color .15s, box-shadow .15s;
}
.rk-btn--pill { border-radius: 999px; }
.rk-btn :deep(.q-btn__content) { font-weight: 700; letter-spacing: .2px; }
.rk-btn:not(.rk-active):hover { background: var(--t-btn-hover); border-color: var(--t-icon); color: var(--t-icon); }

/* Activo: glow externo sin overflow hidden */
.rk-active {
  color: #fff !important;
  border-color: transparent !important;
  box-shadow: 0 4px 14px rgba(0,0,0,.22);
}
.rk-active::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 2px solid rgba(255,255,255,.14);
  pointer-events: none;
}
.rk-active--allow   { background: linear-gradient(135deg,#22c55e,#16a34a) !important; }
.rk-active--deny    { background: linear-gradient(135deg,#f05454,#dc2626) !important; }
.rk-active--inherit { background: linear-gradient(135deg,#64748b,#475569) !important; }

:deep(.q-btn[disabled]) { opacity: .45 !important; }

/* ── Separador vertical ──────────────────────────────────────────── */
.rk-vsep { height: 28px; opacity: .3; background: var(--t-btn-border); }

/* ── Stats ───────────────────────────────────────────────────────── */
.rk-stats { display: flex; align-items: center; gap: 8px; }

.rk-stat {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: .82rem;
  letter-spacing: .2px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: box-shadow .18s, transform .1s;
}
.rk-stat:hover { transform: translateY(-1px); }

/* Light mode stats */
.rk-ok  { background: rgba(22,163,74,.09);  color:#16a34a; border:1px solid rgba(22,163,74,.25);  }
.rk-bad { background: rgba(220,38,38,.09);  color:#dc2626; border:1px solid rgba(220,38,38,.25);  }
.rk-mid { background: rgba(100,116,139,.09);color:#64748b; border:1px solid rgba(100,116,139,.25);}

/* Dark mode stats */
.body--dark .rk-ok  { background:rgba(34,197,94,.1);  color:#4ade80; border-color:rgba(34,197,94,.28);  }
.body--dark .rk-bad { background:rgba(239,68,68,.1);  color:#f87171; border-color:rgba(239,68,68,.28);  }
.body--dark .rk-mid { background:rgba(148,163,184,.1); color:#94a3b8; border-color:rgba(148,163,184,.28);}

.rk-stat--glow { box-shadow: 0 4px 14px rgba(0,0,0,.18); }

/* ── Responsivo ──────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .rk-btn { height: 34px; padding: 0 10px; font-size: .78rem; }
  .rk-actions, .rk-filters { gap: 6px; }
  .rk-vsep { display: none; }
}
</style>
