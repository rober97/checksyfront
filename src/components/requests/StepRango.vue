<template>
  <div class="rk-range">
    <!-- Toolbar -->
    <div class="row items-center justify-between q-mb-sm">
      <div class="row items-center q-gutter-sm">
        <q-icon name="date_range" size="20px" class="text-primary" />
        <div class="text-subtitle2">Selecciona el rango</div>
        <q-badge outline :color="badgeColor" class="q-ml-sm">
          {{ diasHabilesPreview }} {{ diasHabilesPreview === 1 ? 'día hábil' : 'días hábiles' }}
        </q-badge>
      </div>

      <div class="row items-center q-gutter-xs">
        <q-btn-toggle
          v-model="mode"
          :options="modeOpts"
          dense
          unelevated
          toggle-color="primary"
          size="sm"
        />
        <q-btn-dropdown dense flat icon="lightbulb" class="q-ml-xs" no-caps label="Presets">
          <q-list dense>
            <q-item clickable v-close-popup @click="presetToday" :disable="!isBizDay(todayISO)">
              <q-item-section avatar><q-icon name="calendar_today" /></q-item-section>
              <q-item-section>Hoy (si hábil)</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="presetTomorrow('am')">
              <q-item-section avatar><q-icon name="wb_sunny" /></q-item-section>
              <q-item-section>Mañana AM</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="presetTomorrow('pm')">
              <q-item-section avatar><q-icon name="nights_stay" /></q-item-section>
              <q-item-section>Mañana PM</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="presetNextWeek">
              <q-item-section avatar><q-icon name="date_range" /></q-item-section>
              <q-item-section>Próxima semana (Lu-Vi)</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="presetThisMonth">
              <q-item-section avatar><q-icon name="event" /></q-item-section>
              <q-item-section>Semana hábil más cercana</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <!-- Selector -->
    <q-card flat bordered class="rk-card">
      <q-card-section class="q-pt-sm">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-input
              v-model="label"
              :label="mode === 'single' ? 'Día seleccionado' : 'Rango de fechas'"
              dense outlined readonly
              :rules="[()=> (!!localForm.fechaInicio && !!localForm.fechaFin) || 'Selecciona un rango']"
              clearable
              @clear="clearRange"
            >
              <template #prepend><q-icon name="date_range" /></template>
              <q-popup-proxy transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="dateRange"
                  :range="mode === 'range'"
                  mask="YYYY-MM-DD"
                  :events="eventsFeriados"
                  event-color="red-5"
                  :options="dateSelectable"
                  :landscape="$q.screen.gt.sm"
                  today-btn
                  :first-day-of-week="1"
                  :title="calendarTitle"
                  @update:model-value="onCalendarPick"
                >
                  <div class="row items-center justify-between q-pa-sm">
                    <div class="text-caption text-grey-7">
                      <q-icon name="event_busy" size="16px" class="q-mr-xs" />
                      Feriados: {{ feriadosShort }}
                    </div>
                    <div class="row q-gutter-xs">
                      <q-btn flat dense label="Limpiar" @click="clearRange" />
                      <q-btn v-if="mode==='range'" flat dense label="Usar 1 día" @click="forceSingleFromCalendar" />
                      <q-btn color="primary" dense label="Aplicar" @click="applyRange" />
                    </div>
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-input>
          </div>

          <div class="col-12 col-md-4">
            <q-toggle
              v-model="localForm.medioDia"
              label="Medio día"
              dense
              :disable="!isSingleBusinessDay"
            >
              <q-tooltip v-if="!isSingleBusinessDay">
                Habilítalo sólo cuando seleccionas 1 día hábil.
              </q-tooltip>
            </q-toggle>

            <q-select
              v-show="localForm.medioDia"
              v-model="localForm.medioDiaPeriodo"
              :options="medioDiaOpts"
              label="Periodo"
              dense outlined emit-value map-options class="q-mt-sm"
              :rules="[(v)=>!!v || 'Obligatorio']"
            />
          </div>
        </div>

        <!-- Avisos -->
        <div class="q-mt-sm">
          <q-banner v-if="!rangoValido" class="bg-red-1 text-red-9" dense rounded>
            <q-icon name="error" class="q-mr-xs" /> Inicio debe ser ≤ fin.
          </q-banner>

          <q-banner
            v-if="diasHabilesPreview === 0 && localForm.fechaInicio && localForm.fechaFin"
            class="bg-orange-1 text-orange-10" dense rounded
          >
            <q-icon name="warning" class="q-mr-xs" /> El rango no suma días hábiles.
          </q-banner>

          <q-banner v-if="overlapAlert" class="bg-orange-1 text-orange-10" dense rounded>
            <q-icon name="warning" class="q-mr-xs" /> Tienes solicitudes que se traslapan con este rango.
            <q-btn flat dense class="q-ml-sm" label="Ver" to="/solicitudes" />
          </q-banner>
        </div>
      </q-card-section>
    </q-card>

    <!-- Botonera -->
    <div class="row justify-between q-mt-md">
      <q-btn flat label="Atrás" @click="$emit('back', 1)" />
      <q-btn color="primary" label="Siguiente" :disable="!canGoStep3" @click="$emit('next', 3)" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import {
  toISO, addBusinessDays, nextBusinessISO, sameOrNextBusinessISO, businessDaysCount
} from "@/composables/useBusinessDates";

const $q = useQuasar();

const props = defineProps({
  modelValue: { type: Object, required: true },  // form
  feriados: { type: Array, default: () => [] },  // ['YYYY-MM-DD', ...]
  overlapAlert: { type: Boolean, default: false },
  rangoValido: { type: Boolean, required: true },
  diasHabiles: { type: Number, required: true }, // del padre (para coherencia)
  allowWeekends: { type: Boolean, default: false }, // por si en el futuro lo permites
});
const emit = defineEmits(['update:modelValue','next','back']);

const localForm = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
});

/* ========== Modo de selección ========== */
const mode = ref('single'); // 'single' | 'range'
const modeOpts = [
  { label: 'Día único', value: 'single', icon: 'looks_one' },
  { label: 'Rango', value: 'range', icon: 'all_inclusive' },
];

/* ========== Calendario / estado interno ========== */
const dateRange = ref({ from: "", to: "" });

const todayISO = toISO(new Date());
const eventsFeriados = computed(() => props.feriados || []);

const feriadosShort = computed(() => {
  if (!props.feriados?.length) return "sin datos";
  const arr = props.feriados.slice(0, 5).join(", ");
  return arr + (props.feriados.length > 5 ? "…" : "");
});

const label = computed(() => {
  const { fechaInicio, fechaFin } = localForm.value;
  if (!fechaInicio || !fechaFin) return "";
  return mode.value === 'single'
    ? `${fechaInicio} (1 día)`
    : `${fechaInicio} → ${fechaFin}`;
});

const diasHabilesPreview = computed(() => {
  const { fechaInicio, fechaFin, medioDia } = localForm.value;
  const count = businessDaysCount(fechaInicio, fechaFin, props.feriados);
  if (medioDia && count === 1) return 0.5;
  return count;
});

const isSingleBusinessDay = computed(() => diasHabilesPreview.value === 0.5 || diasHabilesPreview.value === 1);
const badgeColor = computed(() =>
  diasHabilesPreview.value === 0 ? 'orange' :
  diasHabilesPreview.value <= 2 ? 'negative' :
  diasHabilesPreview.value <= 5 ? 'warning' : 'positive'
);

const calendarTitle = computed(() =>
  mode.value === 'single'
    ? `Selecciona un día hábil`
    : `Selecciona el rango (${diasHabilesPreview.value} hábiles)`
);

/* ========== Sync con el padre ========== */
function syncFromModel() {
  const { fechaInicio, fechaFin } = localForm.value;
  if (!fechaInicio) {
    dateRange.value = { from: "", to: "" };
    return;
  }
  const end = fechaFin || fechaInicio;
  dateRange.value = { from: fechaInicio, to: end };
  mode.value = (fechaInicio === end) ? 'single' : 'range';
}

watch(() => localForm.value.fechaInicio, syncFromModel, { immediate: true });
watch(() => localForm.value.fechaFin, syncFromModel, { immediate: true });

/* ========== Funciones calendario ========== */
function normalizeISO(s) {
  return String(s).replace(/\//g, "-"); // por si Quasar pasa YYYY/MM/DD
}
function isBizDay(iso) {
  if (!props.allowWeekends) {
    const d = new Date(iso + "T00:00:00");
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return false;
  }
  return !props.feriados?.includes(iso);
}

function dateSelectable (dateStr) {
  const iso = normalizeISO(dateStr);
  return isBizDay(iso);
}

function onCalendarPick(val) {
  // Quasar entrega {from,to} en range; string en single o {from} parcial.
  if (mode.value === 'single') {
    const iso = typeof val === 'string' ? val : val?.from || val?.to;
    if (iso) {
      dateRange.value = { from: iso, to: iso };
      // aplicamos de inmediato para UX ágil
      applyRange();
    }
    return;
  }

  // Rango
  if (typeof val === 'object' && val?.from) {
    const to = val.to || val.from;
    dateRange.value = { from: val.from, to };
    // si ya hay to, aplicamos
    if (val.to) applyRange();
  }
}

function applyRange () {
  const from = dateRange.value.from || "";
  const to = dateRange.value.to || dateRange.value.from || "";
  localForm.value = { ...localForm.value, fechaInicio: from, fechaFin: to };
}

function forceSingleFromCalendar() {
  if (dateRange.value.from) {
    dateRange.value.to = dateRange.value.from;
    mode.value = 'single';
    applyRange();
  }
}

function clearRange() {
  dateRange.value = { from: "", to: "" };
  localForm.value = { ...localForm.value, fechaInicio: "", fechaFin: "" };
  localForm.value.medioDia = false;
}

/* ========== Presets ========== */
function presetToday() {
  if (!isBizDay(todayISO)) return;
  localForm.value = { ...localForm.value, fechaInicio: todayISO, fechaFin: todayISO, medioDia: false };
  dateRange.value = { from: todayISO, to: todayISO };
  mode.value = 'single';
}
function presetTomorrow (period = 'am') {
  const t = nextBusinessISO(todayISO, props.feriados);
  localForm.value = { ...localForm.value, fechaInicio: t, fechaFin: t, medioDia: true, medioDiaPeriodo: period };
  dateRange.value = { from: t, to: t };
  mode.value = 'single';
}
function presetNextWeek () {
  const d = new Date();
  const day = d.getDay();
  const diffToMon = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + diffToMon);
  const monday = toISO(d);
  const friday = addBusinessDays(monday, 4, props.feriados);
  localForm.value = { ...localForm.value, fechaInicio: monday, fechaFin: friday, medioDia: false };
  dateRange.value = { from: monday, to: friday };
  mode.value = 'range';
}
function presetThisMonth() {
  // toma la semana hábil (Lu-Vi) más cercana desde hoy
  let start = todayISO;
  if (!isBizDay(start)) start = nextBusinessISO(todayISO, props.feriados);
  const end = addBusinessDays(start, 4, props.feriados);
  localForm.value = { ...localForm.value, fechaInicio: start, fechaFin: end, medioDia: false };
  dateRange.value = { from: start, to: end };
  mode.value = 'range';
}

/* ========== Navegación habilitación ========== */
const canGoStep3 = computed(() =>
  props.rangoValido && diasHabilesPreview.value > 0 && !props.overlapAlert
);
</script>

<style scoped>
.rk-range .rk-card {
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(0,0,0,0.06);
}

:deep(.q-date__calendar) {
  /* un pelín más de aire visual */
  --q-space-sm: 10px;
}

.q-banner { border-radius: 10px; }

/* micro-realces para la toolbar */
.rk-range .q-badge {
  border-radius: 10px;
  font-weight: 600;
}
</style>
