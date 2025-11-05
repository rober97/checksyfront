<template>
  <div>
    <q-card flat bordered class="q-pa-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-8">
          <div class="text-subtitle2 q-mb-sm">Resumen final</div>
          <q-list dense separator>
            <q-item>
              <q-item-section avatar><q-icon name="category" /></q-item-section>
              <q-item-section>Tipo</q-item-section>
              <q-item-section side>{{ tipoLabel }}</q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar><q-icon name="date_range" /></q-item-section>
              <q-item-section>Rango</q-item-section>
              <q-item-section side>{{ rangeLabel || "—" }}</q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar><q-icon name="work_history" /></q-item-section>
              <q-item-section>Días hábiles</q-item-section>
              <q-item-section side>{{ diasHabiles }}</q-item-section>
            </q-item>

            <q-item v-if="form.medioDia">
              <q-item-section avatar><q-icon name="wb_twilight" /></q-item-section>
              <q-item-section>Medio día</q-item-section>
              <q-item-section side>{{ form.medioDiaPeriodo?.toUpperCase?.() }}</q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar><q-icon name="redo" /></q-item-section>
              <q-item-section>Retorno</q-item-section>
              <q-item-section side>{{ retornoLabel }}</q-item-section>
            </q-item>

            <q-item v-if="vacacionesAplica">
              <q-item-section avatar><q-icon name="account_balance_wallet" /></q-item-section>
              <q-item-section>Saldo</q-item-section>
              <q-item-section side>{{ saldoVacacionesLabel }} → {{ saldoRestanteLabel }}</q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar><q-icon name="notes" /></q-item-section>
              <q-item-section>Comentario</q-item-section>
              <q-item-section side>{{ form.comentario || "—" }}</q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="col-12 col-md-4">
          <q-banner v-if="disableReasons.length" class="bg-red-1 text-red-10" rounded>
            <div class="text-subtitle2 q-mb-xs">No puedes enviar aún</div>
            <ul class="q-pl-md q-mt-none q-mb-none">
              <li v-for="(r, i) in disableReasons" :key="i">{{ r }}</li>
            </ul>
          </q-banner>

          <q-banner v-else class="bg-green-1 text-green-10" rounded>
            <q-icon name="check_circle" class="q-mr-xs" /> Todo listo para enviar.
          </q-banner>

          <div class="text-caption text-grey-7 q-mt-sm">
            Archivos adjuntos: {{ filesCount }}
          </div>
        </div>
      </div>
    </q-card>

    <div class="row justify-between q-mt-md">
      <q-btn flat label="Atrás" @click="$emit('back', 3)" />
      <q-btn
        color="primary"
        label="Enviar Solicitud"
        icon="send"
        no-caps
        unelevated
        :disable="disableReasons.length>0 || sending"
        :loading="sending"
        @click="$emit('enviar')"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  form: { type: Object, required: true },
  tipos: { type: Array, required: true },
  diasHabiles: { type: [Number, String], default: 0 },
  retornoLabel: { type: String, default: '—' },
  vacacionesAplica: { type: Boolean, default: false },
  saldoVacacionesLabel: { type: String, default: '—' },
  saldoRestanteLabel: { type: String, default: '—' },
  disableReasons: { type: Array, default: () => [] },
  filesCount: { type: Number, default: 0 },
  sending: { type: Boolean, default: false }
});

defineEmits(['back','enviar']);

const tipoLabel = computed(() =>
  props.tipos.find(t => t.value === props.form.tipo)?.label || '—'
);

const rangeLabel = computed(() => {
  if (!props.form.fechaInicio || !props.form.fechaFin) return '';
  return `${props.form.fechaInicio} → ${props.form.fechaFin}`;
});
</script>

<style scoped>
/* nada extra aquí por ahora */
</style>
