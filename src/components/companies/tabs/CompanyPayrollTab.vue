<template>
  <div class="row q-col-gutter-sm">
    <div class="col-12 col-md-7">
      <q-select
        v-model="vm.frequency"
        :options="freqOpts"
        dense
        outlined
        label="Frecuencia"
        emit-value
        map-options
        @update:model-value="emitValid"
      />
      <div class="row q-col-gutter-sm q-mt-sm">
        <div class="col-6">
          <q-input
            v-model.number="vm.cutoffDay"
            type="number"
            min="1"
            max="31"
            dense
            outlined
            label="Día de corte (variables)"
            @update:model-value="emitValid"
          />
        </div>
        <div class="col-6">
          <q-select
            v-model="vm.paydayRule"
            :options="paydayRuleOpts"
            dense
            outlined
            label="Regla de pago"
            emit-value
            map-options
            @update:model-value="emitValid"
          />
        </div>
      </div>

      <q-input
        v-if="vm.paydayRule === 'fixed_day'"
        v-model.number="vm.paydayDayOfMonth"
        class="q-mt-sm"
        type="number"
        min="1"
        max="31"
        dense
        outlined
        label="Día fijo de pago"
        @update:model-value="emitValid"
      />

      <div class="row q-col-gutter-sm q-mt-sm">
        <div class="col-6">
          <q-select
            v-model="vm.businessDayAdjust"
            :options="adjustOpts"
            dense
            outlined
            label="Ajuste día no hábil"
            emit-value
            map-options
            @update:model-value="emitValid"
          />
        </div>
        <div class="col-6">
          <q-input
            v-model="vm.generateTime"
            dense
            outlined
            mask="##:##"
            label="Hora generación (HH:mm)"
            @update:model-value="emitValid"
          />
        </div>
      </div>

      <div class="row q-col-gutter-sm q-mt-sm">
        <div class="col-7">
          <q-select
            v-model="vm.timezone"
            :options="tzOpts"
            dense
            outlined
            label="Zona horaria"
            emit-value
            map-options
            @update:model-value="emitValid"
          />
        </div>
        <div class="col-5">
          <q-select
            v-model="vm.rounding"
            :options="roundingOpts"
            dense
            outlined
            label="Redondeo"
            emit-value
            map-options
            @update:model-value="emitValid"
          />
        </div>
      </div>

      <div class="row q-col-gutter-sm q-mt-sm">
        <div class="col-6">
          <q-toggle
            v-model="vm.autoPublish"
            label="Publicar automáticamente"
            @update:model-value="emitValid"
          />
        </div>
        <div class="col-6">
          <q-toggle
            v-model="vm.notifyOnPublish"
            label="Notificar al publicar"
            @update:model-value="emitValid"
          />
        </div>
      </div>

      <q-input
        v-model="vm.templateId"
        dense
        outlined
        label="Plantilla PDF (opcional)"
        class="q-mt-sm"
        @update:model-value="emitValid"
      />

      <q-banner class="bg-grey-2 text-grey-9 q-mt-md rounded">
        <div class="text-caption">
          Próxima ejecución estimada:
          <b>{{ nextLabel }}</b>
        </div>
      </q-banner>
    </div>

    <div class="col-12 col-md-5">
      <q-card flat bordered class="soft-card q-pa-sm">
        <div class="text-subtitle2 q-mb-xs">Reglas</div>
        <ul class="text-caption q-pl-md">
          <li>
            El <b>corte</b> define hasta qué día del mes se consideran
            variables.
          </li>
          <li>La <b>regla de pago</b> determina cuándo generar/publicar.</li>
          <li>Si cae en no hábil, se aplica el <b>ajuste</b>.</li>
          <li>
            Se ejecuta a la <b>hora</b> indicada en la <b>zona</b> seleccionada.
          </li>
        </ul>

        <div class="q-mt-sm">
          <q-chip dense outline color="primary">Mensual</q-chip>
          <q-chip dense outline :color="vm.autoPublish ? 'positive' : 'grey'">
            {{ vm.autoPublish ? "Auto-publica" : "Requiere aprobación" }}
          </q-chip>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from "vue";
const props = defineProps({
  modelValue: { type: Object, required: true },
  holidays: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue", "validity"]);

const vm = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const freqOpts = [{ label: "Mensual", value: "monthly" }];
const paydayRuleOpts = [
  { label: "Último día hábil", value: "last_business_day" },
  { label: "Día fijo", value: "fixed_day" },
];
const adjustOpts = [
  { label: "Mover al día hábil anterior", value: "previous" },
  { label: "Mover al día hábil siguiente", value: "next" },
  { label: "No ajustar", value: "none" },
];
const roundingOpts = [
  { label: "Sin redondeo", value: "none" },
  { label: "0", value: "0" },
  { label: "0.1", value: "0.1" },
  { label: "0.5", value: "0.5" },
  { label: "1", value: "1" },
];
const tzOpts = [
  { label: "America/Santiago", value: "America/Santiago" },
  { label: "America/Bogota", value: "America/Bogota" },
  { label: "UTC", value: "UTC" },
];

function isValid() {
  const t = vm.value;
  const okTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(t.generateTime || "");
  const okCut =
    Number.isFinite(Number(t.cutoffDay)) &&
    t.cutoffDay >= 1 &&
    t.cutoffDay <= 31;
  const okPay =
    t.paydayRule &&
    (t.paydayRule !== "fixed_day" ||
      (t.paydayDayOfMonth >= 1 && t.paydayDayOfMonth <= 31));
  return okTime && okCut && okPay;
}
function emitValid() {
  emit("validity", isValid());
}
onMounted(() => emitValid());
watch(() => vm.value, emitValid, { deep: true });

/* Estimación simple del próximo run (visual) */
const nextLabel = computed(() => {
  try {
    const now = new Date();
    const y = now.getFullYear(),
      m = now.getMonth();
    const t = vm.value;
    let base = new Date(Date.UTC(y, m + 1, 0, 12, 0, 0)); // último día del mes actual (mediodía UTC para evitar TZ issues)
    if (t.paydayRule === "fixed_day")
      base = new Date(Date.UTC(y, m, t.paydayDayOfMonth, 12, 0, 0));

    // Ajuste simple (ignora feriados, muestra texto)
    if (t.paydayRule !== "fixed_day") {
      // last_business_day: mueve si cae sábado/domingo
      const dow = base.getUTCDay();
      if (dow === 6 && t.businessDayAdjust === "previous")
        base.setUTCDate(base.getUTCDate() - 1);
      if (dow === 0 && t.businessDayAdjust === "previous")
        base.setUTCDate(base.getUTCDate() - 2);
      if (dow === 6 && t.businessDayAdjust === "next")
        base.setUTCDate(base.getUTCDate() + 2);
      if (dow === 0 && t.businessDayAdjust === "next")
        base.setUTCDate(base.getUTCDate() + 1);
    }
    return new Intl.DateTimeFormat("es-CL", { dateStyle: "full" }).format(base);
  } catch {
    return "—";
  }
});
</script>
