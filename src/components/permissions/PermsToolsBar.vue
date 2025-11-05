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
import { ref, watch, defineProps, defineEmits } from "vue";

const props = defineProps({
  cardTone: { type: String, default: "" },
  editable: { type: Boolean, default: false },
  searchQ: { type: String, default: "" },
  allowCount: { type: Number, default: 0 },
  denyCount: { type: Number, default: 0 },
  inheritCount: { type: Number, default: 0 },
});

const emit = defineEmits(["update:searchQ", "bulk-set"]);

const searchQLocal = ref(props.searchQ);
watch(() => props.searchQ, v => { searchQLocal.value = v; });
watch(searchQLocal, v => emit("update:searchQ", v));

const selectedAction = ref(null); // 'allow' | 'deny' | 'inherit' | null

const onBulk = (action) => {
  // Toggle: si vuelven a apretar el mismo, se des-selecciona visualmente
  selectedAction.value = selectedAction.value === action ? null : action;
  emit("bulk-set", action);
};

const emitSearch = () => emit("update:searchQ", searchQLocal.value);
</script>

<style scoped>
/* ====== Card look ====== */
.rk-tools{
  border-radius:18px;
  border:1px solid rgba(127,127,127,.12);
  box-shadow:0 8px 20px rgba(0,0,0,.06);
  background:linear-gradient(180deg,#2c3036,#272b31);
  overflow: visible;                 /* <== evita recortes */
}

/* ====== Layout (grid) ====== */
.rk-toolbar{
  display:grid;
  grid-template-columns: 1fr auto;
  align-items:center;
  gap:12px;
  overflow: visible;                 /* <== evita recortes */
}
.rk-left{ min-width:0 }
.rk-right{
  display:flex; align-items:center; gap:12px;
  overflow: visible;                 /* <== evita recortes */
}

/* ====== Buscador ====== */
.rk-field :deep(.q-field),
.rk-field :deep(.q-field__control){
  --h: 42px; height:var(--h); min-height:var(--h);
  border-radius:14px !important;
}
.rk-field :deep(.q-field__native){
  padding-top:0 !important; padding-bottom:0 !important
}

/* ====== Acciones ====== */
.rk-actions{
  display:flex; align-items:center; gap:8px;
  max-width:100%;
  overflow: visible;                 /* <== muy importante */
  scrollbar-width:thin;
  padding-bottom:2px;
}

.rk-btn{
  --rk-h: 36px;
  height: var(--rk-h);
  line-height: var(--rk-h);
  padding: 0 14px;
  border-radius: 999px;
  position: relative;
  overflow: visible;                 /* <== evita que se corte el ::before */
  transition: background .18s ease, color .18s ease, border-color .18s ease, filter .18s ease;
}
.rk-btn--pill{ border-radius:999px }
.rk-btn :deep(.q-btn__content){ font-weight:700; letter-spacing:.2px }

/* Estado activo (toggle) – sin translateY */
.rk-active{
  color:#fff !important;
  border-color: transparent !important;
  background: #3a7bd5;              /* fallback por si faltan clases específicas */
  filter: drop-shadow(0 6px 14px rgba(0,0,0,.28));   /* no se recorta */
}

/* Aro/glow sin cortar usando pseudo-elemento */
.rk-active::before{
  content:"";
  position:absolute; inset:-2px;     /* aro por fuera del borde */
  border-radius:inherit;
  border:2px solid rgba(255,255,255,.10);
  pointer-events:none;
}

/* Paletas activas coherentes */
.rk-active--allow  { background: linear-gradient(180deg, #2bbf6a, #1e9f56) !important; }
.rk-active--deny   { background: linear-gradient(180deg, #f05454, #cf3d3d) !important; }
.rk-active--inherit{ background: linear-gradient(180deg, #8b93a1, #6e7683) !important; }

/* Hover/focus cuando NO está activo */
.rk-btn:not(.rk-active):hover{ background:rgba(255,255,255,.06) }
.rk-btn:focus-visible{
  outline:2px solid rgba(59,130,246,.75);
  outline-offset:2px;
  border-radius:999px;
}

/* desactivado más suave */
:deep(.q-btn[disabled]){ opacity:.5 !important }

/* separador */
.rk-vsep{ height:28px; opacity:.35 }

/* ====== Stats ====== */
.rk-stats{ display:flex; align-items:center; gap:8px }
.rk-stat{
  --rk-stat-h: 32px;
  height: var(--rk-stat-h);
  line-height: var(--rk-stat-h);
  padding:0 10px;
  border-radius:10px;
  font-weight:700; letter-spacing:.2px;
  display:inline-flex; align-items:center;
  transition: box-shadow .18s ease, border-color .18s ease;
}

/* colores accesibles dark */
.rk-ok  { background:rgba(46,125,50,.12);  color:#9be49e; border:1px solid rgba(76,175,80,.28) }
.rk-bad { background:rgba(198,40,40,.12); color:#ff9b9b; border:1px solid rgba(244,67,54,.28) }
.rk-mid { background:rgba(158,158,158,.12); color:#e0e0e0; border:1px solid rgba(158,158,158,.28) }

/* Glow sync con acción seleccionada */
.rk-stat--glow{
  box-shadow: 0 0 0 2px rgba(255,255,255,.06) inset, 0 6px 14px rgba(0,0,0,.28);
}

/* ====== Responsivo ====== */
@media (max-width: 1024px){
  .rk-toolbar{ grid-template-columns: 1fr }
  .rk-right{ justify-content:space-between; flex-wrap:wrap }
  .rk-vsep{ display:none }
}
@media (max-width: 600px){
  .rk-actions{ gap:6px }
  .rk-btn{ --rk-h:34px; padding:0 10px }
}
</style>

