<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md shadow-2">
      <div class="text-h6 text-primary q-mb-md">
        {{ isEditMode ? 'Editar Empleado' : 'Nuevo Empleado' }}
      </div>

      <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
        <q-input
          v-model="form.nombre"
          label="Nombre completo"
          filled
          :rules="[val => !!val || 'Campo requerido']"
        />
        <q-input
          v-model="form.rut"
          label="RUT"
          filled
          :rules="[val => !!val || 'Campo requerido']"
        />
        <q-input
          v-model="form.correo"
          label="Correo electrónico"
          type="email"
          filled
          :rules="[val => !!val || 'Campo requerido']"
        />
        <q-input
          v-model="form.cargo"
          label="Cargo"
          filled
          :rules="[val => !!val || 'Campo requerido']"
        />
        <q-input
          v-model="form.fecha_ingreso"
          label="Fecha de ingreso"
          type="date"
          filled
        />

        <div class="row justify-end q-gutter-sm">
          <q-btn label="Cancelar" flat color="grey" @click="cancelar" />
          <q-btn label="Guardar" type="submit" color="primary" :loading="loading" />
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const isEditMode = ref(false);
const loading = ref(false);

const form = ref({
  nombre: '',
  rut: '',
  correo: '',
  cargo: '',
  fecha_ingreso: '',
});

const handleSubmit = async () => {
  loading.value = true;
  try {
    if (isEditMode.value) {
      $q.notify({ type: 'positive', message: 'Empleado actualizado' });
    } else {
      $q.notify({ type: 'positive', message: 'Empleado registrado' });
    }
    router.push('/empresa/empleados');
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error al guardar' });
  } finally {
    loading.value = false;
  }
};

const cancelar = () => {
  router.push('/empresa/empleados');
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    isEditMode.value = true;
    // Simula carga del empleado
    form.value = {
      nombre: 'Carlos Díaz',
      rut: '11.223.344-5',
      correo: 'carlos@empresa.cl',
      cargo: 'Analista',
      fecha_ingreso: '2023-05-10',
    };
  }
});
</script>
