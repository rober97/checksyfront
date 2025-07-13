<template>
  <q-card style="min-width: 350px">
    <q-card-section>
      <div class="text-h6">Subir Documento</div>
    </q-card-section>

    <q-card-section class="q-gutter-md">
      <q-input
        filled
        v-model="form.nombre"
        label="Nombre del documento"
        dense
        clearable
      />
      <q-select
        filled
        v-model="form.tipo"
        :options="tipos"
        label="Tipo de documento"
        dense
        clearable
      />
      <q-file
        filled
        v-model="form.archivo"
        label="Selecciona archivo"
        accept=".pdf,.doc,.docx,.jpg,.png"
        dense
        clearable
      />
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Cancelar" color="primary" @click="cancelar" />
      <q-btn flat label="Subir" color="positive" @click="subir" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const emit = defineEmits(['close', 'subido']);
const $q = useQuasar();

const tipos = ['Contrato', 'Liquidación', 'Anexo', 'Otro'];
const form = ref({
  nombre: '',
  tipo: '',
  archivo: null,
});

function cancelar() {
  emit('close');
}

function subir() {
  if (!form.value.nombre || !form.value.tipo || !form.value.archivo) {
    $q.notify({ type: 'warning', message: 'Completa todos los campos' });
    return;
  }

  const nuevoDoc = {
    id: Date.now(),
    nombre: form.value.nombre,
    tipo: form.value.tipo,
    fecha: new Date().toISOString().slice(0, 10),
    archivo: form.value.archivo,
  };

  emit('subido', nuevoDoc);
  emit('close');
  resetForm();
  $q.notify({ type: 'positive', message: 'Documento subido correctamente' });
}

function resetForm() {
  form.value = { nombre: '', tipo: '', archivo: null };
}
</script>
