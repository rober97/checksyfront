<template>
  <q-page>
    <div class="rk-module-shell">
      <section class="rk-module-header">
        <div class="rk-module-icon">
          <q-icon :name="isEditMode ? 'edit_note' : 'add_business'" size="28px" />
        </div>
        <div class="col">
          <h1 class="rk-module-title">{{ isEditMode ? 'Editar empresa' : 'Nueva empresa' }}</h1>
          <p class="rk-module-subtitle">
            Formulario estilizado con la misma paleta, superficies y redondeados del módulo de asistencias.
          </p>
        </div>
        <div class="rk-module-actions">
          <q-btn flat color="primary" icon="arrow_back" label="Cancelar" @click="goBack" />
        </div>
      </section>

      <section class="rk-module-panel">
        <div class="rk-module-panel__section">
          <div class="row items-center q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md">
              <h2 class="rk-module-panel__title">Datos de la empresa</h2>
              <p class="rk-module-panel__caption">
                Completa la información principal para activar la empresa dentro del sistema.
              </p>
            </div>
            <div class="col-12 col-md-auto">
              <div class="rk-module-stat">
                <div class="rk-module-stat__icon">
                  <q-icon name="domain" size="20px" />
                </div>
                <div>
                  <div class="rk-module-stat__label">Modo</div>
                  <div class="rk-module-stat__value mode-copy">
                    {{ isEditMode ? 'Edición' : 'Creación' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <q-form @submit.prevent="handleSubmit" class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.nombre" label="Nombre de la empresa" outlined :rules="[val => !!val || 'Requerido']" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.rut" label="RUT" outlined :rules="[val => !!val || 'Requerido']" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.email" label="Correo electrónico" type="email" outlined :rules="[val => !!val || 'Requerido']" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.telefono" label="Teléfono" outlined />
            </div>
            <div class="col-12">
              <q-input v-model="form.direccion" label="Dirección" outlined type="textarea" autogrow />
            </div>

            <div class="col-12">
              <div class="row justify-end q-gutter-sm">
                <q-btn flat label="Cancelar" @click="goBack" />
                <q-btn type="submit" unelevated color="primary" :loading="loading" label="Guardar empresa" />
              </div>
            </div>
          </q-form>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';

const $q = useQuasar();
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
      $q.notify({ type: 'positive', message: 'Empresa actualizada correctamente' });
    } else {
      $q.notify({ type: 'positive', message: 'Empresa creada correctamente' });
    }

    router.push('/admin/companies');
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Ocurrió un error al guardar' });
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/admin/companies');
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    isEditMode.value = true;
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

<style scoped>
.mode-copy {
  font-size: 18px;
}
</style>
