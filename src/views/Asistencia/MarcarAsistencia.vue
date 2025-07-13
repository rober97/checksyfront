<template>
  <q-page class="q-pa-md bg-grey-1">
    <q-card class="q-pa-lg">
      <div class="text-h6 text-primary q-mb-md">Marcar Asistencia</div>

      <!-- Tipo asistencia -->
      <div class="q-mb-md">
        <q-option-group
          v-model="tipo"
          type="radio"
          :options="[
            { label: 'Entrada', value: 'entrada' },
            { label: 'Salida', value: 'salida' }
          ]"
          color="primary"
        />
      </div>

      <!-- Estado de ánimo -->
      <div class="q-mb-md">
        <div class="text-subtitle2 text-grey-8 q-mb-sm">¿Cómo te sientes hoy?</div>
        <div class="row q-gutter-sm">
          <q-btn
            v-for="m in moods"
            :key="m.value"
            round
            push
            :color="estadoAnimo === m.value ? m.color : 'grey-4'"
            :icon="m.icon"
            @click="estadoAnimo = m.value"
          />
        </div>
      </div>

      <!-- Comentario -->
      <q-input
        filled
        v-model="comentario"
        label="Comentario opcional"
        type="textarea"
        autogrow
        class="q-mb-md"
      />

      <!-- Botón de acción -->
      <q-btn
        label="Registrar"
        color="primary"
        class="full-width"
        :loading="loading"
        @click="registrarAsistencia"
      />

      <!-- Confirmación -->
      <q-dialog v-model="confirmado">
        <q-card class="q-pa-md">
          <div class="text-h6 text-primary">¡Asistencia registrada!</div>
          <q-btn flat label="Aceptar" color="primary" class="q-mt-md" v-close-popup />
        </q-card>
      </q-dialog>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { happy, sad, sentiment_neutral } from '@quasar/extras/material-icons';

const tipo = ref(null);
const estadoAnimo = ref(null);
const comentario = ref('');
const confirmado = ref(false);
const loading = ref(false);

const moods = [
  { value: 'happy', icon: 'sentiment_very_satisfied', color: 'green' },
  { value: 'neutral', icon: 'sentiment_neutral', color: 'orange' },
  { value: 'sad', icon: 'sentiment_dissatisfied', color: 'red' },
];

function registrarAsistencia() {
  if (!tipo.value) {
    $q.notify({ type: 'warning', message: 'Debes seleccionar entrada o salida.' });
    return;
  }

  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    confirmado.value = true;
    // Aquí deberías guardar el registro con axios o similar
  }, 1000);
}
</script>
