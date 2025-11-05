<template>
  <div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-input
          v-model="localForm.comentario"
          label="Comentario (opcional)"
          type="textarea"
          autogrow outlined dense
          placeholder="Motivo o detalles adicionales para tu jefatura."
          :counter="300" :maxlength="300"
        >
          <template #prepend><q-icon name="notes" /></template>
        </q-input>

        <q-file
          v-model="localFiles"
          label="Adjuntar respaldo (opcional)"
          multiple dense outlined use-chips clear-icon="close" class="q-mt-sm"
          :max-files="5" accept=".pdf,.jpg,.jpeg,.png,.heic"
        >
          <template #prepend><q-icon name="attach_file" /></template>
        </q-file>

        <div class="text-caption text-grey-7 q-mt-xs">
          Hasta 5 archivos (PDF/Imagen). Máx. 10MB c/u (según política).
        </div>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="q-pa-sm">
          <div class="row items-center q-mb-xs">
            <q-icon name="rule" color="primary" class="q-mr-sm" />
            <div class="text-subtitle2">Checklist de políticas</div>
          </div>

          <div class="rk-check">
            <q-icon :name="avisoOk ? 'check_circle' : 'schedule'"
                    :color="avisoOk ? 'positive' : 'orange'"
                    class="q-mr-xs" />
            Aviso mínimo: {{ avisoMinLabel }} ({{ faltanHabiles }} hábiles de anticipación)
          </div>

          <div class="rk-check">
            <q-icon :name="maxOk ? 'check_circle' : 'error'"
                    :color="maxOk ? 'positive' : 'negative'"
                    class="q-mr-xs" />
            Máximo consecutivos: {{ maxConsecutivosLabel }} (solicitas {{ diasHabilesLocal }} hábiles)
          </div>

          <div class="rk-check" v-if="vacacionesAplica">
            <q-icon :name="saldoOk ? 'check_circle' : 'error'"
                    :color="saldoOk ? 'positive' : 'negative'"
                    class="q-mr-xs" />
            Saldo suficiente: {{ saldoVacacionesLabel }} → {{ saldoRestanteLabel }}
          </div>

          <q-separator class="q-my-sm" />
          <div class="text-caption text-grey-7">
            Retorno: <b>{{ retornoLabel }}</b>
          </div>
        </q-card>
      </div>
    </div>

    <div class="row justify-between q-mt-md">
      <q-btn flat label="Atrás" @click="$emit('back', 2)" />
      <q-btn color="primary" label="Revisar y Enviar" :disable="!readyToReview" @click="$emit('next', 4)" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  toISO, fmt, businessDaysCount, nextBusinessISO, sameOrNextBusinessISO
} from "@/composables/useBusinessDates";

const props = defineProps({
  modelValue: { type: Object, required: true }, // form
  files: { type: Array, default: () => [] },
  feriados: { type: Array, default: () => [] },
  saldoVacaciones: Number,
  avisoMinDias: { type: Number, default: 1 },
  maxDiasConsecutivos: { type: Number, default: 15 },
});
const emit = defineEmits(['update:modelValue','update:files','next','back']);

const localForm = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
});

const localFiles = computed({
  get: () => props.files,
  set: v => emit('update:files', v)
});

const vacacionesAplica = computed(() => localForm.value.tipo === 'vacaciones');

const diasHabilesLocal = computed(() =>
  businessDaysCount(localForm.value.fechaInicio, localForm.value.fechaFin, props.feriados)
);

const retorno = computed(() => {
  const { fechaInicio, fechaFin, medioDia, medioDiaPeriodo } = localForm.value;
  if (!fechaInicio || !fechaFin) return null;
  if (!medioDia) {
    const ret = nextBusinessISO(fechaFin, props.feriados);
    return { date: ret, time: "09:00", label: `${fmt(ret)} 09:00` };
  }
  if (medioDiaPeriodo === "am") {
    const ret = sameOrNextBusinessISO(fechaFin, props.feriados);
    return { date: ret, time: "14:00", label: `${fmt(ret)} 14:00` };
  } else {
    const ret = nextBusinessISO(fechaFin, props.feriados);
    return { date: ret, time: "09:00", label: `${fmt(ret)} 09:00` };
  }
});
const retornoLabel = computed(() => retorno.value?.label || "—");

const faltanHabiles = computed(() =>
  // hoy → inicio
  (() => {
    const today = toISO(new Date());
    const s = localForm.value.fechaInicio;
    if (!s) return 0;
    // "exclusivo-inclusivo" para anticipación razonable
    let count = 0;
    const ferSet = new Set(props.feriados);
    const start = new Date(today + "T00:00:00");
    const end = new Date(s + "T00:00:00");
    if (end <= start) return 0;
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      d.setDate(d.getDate() + 1);
      const iso = toISO(d);
      if ((d.getDay() === 0 || d.getDay() === 6) || ferSet.has(iso)) continue;
      count++;
    }
    return count;
  })()
);

const avisoOk = computed(() =>
  localForm.value.fechaInicio ? faltanHabiles.value >= props.avisoMinDias : true
);
const avisoMinLabel = computed(() => `${props.avisoMinDias} día hábil`);
const maxOk = computed(() => diasHabilesLocal.value <= props.maxDiasConsecutivos);
const maxConsecutivosLabel = computed(() => `${props.maxDiasConsecutivos} hábiles`);

const saldoVacacionesLabel = computed(() =>
  props.saldoVacaciones == null ? "—" : `${props.saldoVacaciones} día(s)`
);
const saldoRestante = computed(() => {
  if (!vacacionesAplica.value || props.saldoVacaciones == null) return null;
  const resto = Number(props.saldoVacaciones) - Number(diasHabilesLocal.value || 0);
  return isNaN(resto) ? null : resto;
});
const saldoRestanteLabel = computed(() => saldoRestante.value == null ? "—" : `${saldoRestante.value} día(s)`);
const saldoOk = computed(() =>
  !vacacionesAplica.value || props.saldoVacaciones == null || diasHabilesLocal.value <= props.saldoVacaciones
);

const readyToReview = computed(() =>
  !!localForm.value.tipo &&
  !!localForm.value.fechaInicio &&
  !!localForm.value.fechaFin &&
  diasHabilesLocal.value > 0
);
</script>

<style scoped>
.rk-check {
  display: flex;
  align-items: center;
  font-size: 13px;
  margin: 4px 0;
}
</style>
