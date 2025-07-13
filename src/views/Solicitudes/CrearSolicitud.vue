<template>
  <q-page class="q-pa-md bg-grey-1">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-primary">Crear Nueva Solicitud</div>
        <div class="text-subtitle2 text-grey">Solicita vacaciones, días compensatorios u otros permisos</div>
      </q-card-section>

      <q-separator />

      <q-form @submit.prevent="enviarSolicitud" class="q-pa-md">
        <div class="row q-col-gutter-md">

          <!-- Tipo de solicitud -->
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.tipo"
              :options="tipos"
              label="Tipo de solicitud"
              dense
              outlined
              emit-value
              map-options
              :rules="[val => !!val || 'Este campo es obligatorio']"
            />
          </div>

          <!-- Fecha inicio -->
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.fechaInicio"
              label="Fecha de inicio"
              type="date"
              dense
              outlined
              :rules="[val => !!val || 'Este campo es obligatorio']"
            />
          </div>

          <!-- Fecha fin -->
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.fechaFin"
              label="Fecha de fin"
              type="date"
              dense
              outlined
              :rules="[val => !!val || 'Este campo es obligatorio']"
            />
          </div>

          <!-- Comentario -->
          <div class="col-12">
            <q-input
              v-model="form.comentario"
              label="Comentario"
              type="textarea"
              autogrow
              outlined
              dense
              placeholder="Motivo o detalles adicionales"
            />
          </div>
        </div>

        <!-- Botón -->
        <div class="q-mt-lg">
          <q-btn
            label="Enviar Solicitud"
            type="submit"
            color="primary"
            icon="send"
            no-caps
            unelevated
          />
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();

const tipos = [
  { label: 'Vacaciones', value: 'Vacaciones' },
  { label: 'Día Compensatorio', value: 'Día Compensatorio' },
  { label: 'Permiso Personal', value: 'Permiso' },
];

const form = ref({
  tipo: '',
  fechaInicio: '',
  fechaFin: '',
  comentario: '',
});

function enviarSolicitud() {
  // Aquí deberías enviar los datos al backend
  console.log('Solicitud enviada:', form.value);

  $q.notify({
    type: 'positive',
    message: 'Solicitud enviada correctamente',
  });

  router.push('/solicitudes');
}
</script>
