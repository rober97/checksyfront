<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="text-h5 text-primary q-mb-lg">Marcar Asistencia</div>

    <q-card flat bordered class="q-pa-md">
      <q-form @submit.prevent="enviarAsistencia" class="q-gutter-md">

        <!-- Tipo de asistencia -->
        <div>
          <div class="text-subtitle2 q-mb-xs">Tipo de Asistencia</div>
          <q-option-group
            v-model="tipo"
            :options="[
              { label: 'Entrada', value: 'entrada' },
              { label: 'Salida', value: 'salida' }
            ]"
            type="radio"
            color="primary"
            inline
            dense
            required
          />
        </div>

        <!-- Estado de ánimo -->
        <div>
          <div class="text-subtitle2 q-mb-xs">¿Cómo te sientes hoy?</div>
          <q-option-group
            v-model="estadoAnimo"
            :options="moods"
            type="toggle"
            dense
            color="primary"
            toggle-color="primary"
            inline
          />
        </div>

        <!-- Comentario -->
        <q-input
          v-model="comentario"
          label="Comentario"
          type="textarea"
          filled
          autogrow
          counter
          maxlength="300"
        />

        <!-- Botón -->
        <div class="text-center">
          <q-btn
            label="Marcar Asistencia"
            type="submit"
            color="primary"
            :loading="loading"
            unelevated
          />
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const tipo = ref(null);
const estadoAnimo = ref(null);
const comentario = ref('');
const loading = ref(false);

const moods = [
  { label: '😊', value: 'feliz' },
  { label: '😐', value: 'neutral' },
  { label: '😢', value: 'triste' }
];

const enviarAsistencia = async () => {
  if (!tipo.value) {
    $q.notify({ type: 'warning', message: 'Selecciona el tipo de asistencia.' });
    return;
  }

  loading.value = true;
  try {
    // Aquí iría tu lógica para guardar la asistencia
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula retardo
    $q.notify({ type: 'positive', message: 'Asistencia registrada con éxito.' });

    // Reiniciar formulario
    tipo.value = null;
    estadoAnimo.value = null;
    comentario.value = '';
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error al registrar asistencia.' });
  } finally {
    loading.value = false;
  }
};
</script>
