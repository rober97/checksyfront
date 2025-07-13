<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md shadow-2">
      <div class="text-h6 text-primary q-mb-md">
        {{ isEditMode ? 'Editar Empresa' : 'Nueva Empresa' }}
      </div>

      <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
        <q-input v-model="form.nombre" label="Nombre de la empresa" filled :rules="[val => !!val || 'Requerido']" />
        <q-input v-model="form.rut" label="RUT" filled :rules="[val => !!val || 'Requerido']" />
        <q-input v-model="form.email" label="Correo electrónico" type="email" filled :rules="[val => !!val || 'Requerido']" />
        <q-input v-model="form.telefono" label="Teléfono" filled />
        <q-input v-model="form.direccion" label="Dirección" filled />

        <div class="row justify-end q-gutter-sm">
          <q-btn label="Cancelar" color="grey" flat @click="goBack" />
          <q-btn type="submit" label="Guardar" color="primary" :loading="loading" />
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const isEditMode = ref(false);
const loading = ref(false);
const form = ref({
  nombre: '',
  rut: '',
  email: '',
  telefono: '',
  direccion: '',
});

const handleSubmit = async () => {
  loading.value = true;

  try {
    if (isEditMode.value) {
      // Simula edición
      $q.notify({ type: 'positive', message: 'Empresa actualizada correctamente' });
    } else {
      // Simula creación
      $q.notify({ type: 'positive', message: 'Empresa creada correctamente' });
    }

    router.push('/admin/empresas');
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Ocurrió un error al guardar' });
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/admin/empresas');
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    isEditMode.value = true;
    // Simula carga de datos
    form.value = {
      nombre: 'Empresa Ejemplo S.A.',
      rut: '76.543.210-9',
      email: 'contacto@ejemplo.cl',
      telefono: '+56 9 1234 5678',
      direccion: 'Av. Las Empresas 123',
    };
  }
});
</script>
