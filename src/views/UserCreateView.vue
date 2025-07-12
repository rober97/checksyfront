<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-pa-lg q-mx-auto" style="max-width: 500px">
      <q-card-section>
        <div class="text-h6 text-primary">Crear Usuario</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="crearUsuario">
          <q-input v-model="form.nombre" label="Nombre" outlined dense class="q-mb-md" />
          <q-input v-model="form.apellido" label="Apellido" outlined dense class="q-mb-md" />
          <q-input v-model="form.rut" label="RUT" outlined dense class="q-mb-md" />
          <q-input v-model="form.email" label="Email" type="email" outlined dense class="q-mb-md" />
          <q-select
            v-model="form.tipo"
            label="Tipo de usuario"
            :options="tipos"
            outlined dense class="q-mb-md"
          />
          <q-input v-model="form.password" label="Contraseña" type="password" outlined dense class="q-mb-md" />

          <q-btn
            label="Guardar Usuario"
            type="submit"
            color="primary"
            :loading="loading"
            class="full-width"
            unelevated
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useQuasar } from 'quasar';

const store = useStore();
const $q = useQuasar();

const loading = ref(false);
const form = ref({
  nombre: '',
  apellido: '',
  rut: '',
  email: '',
  tipo: 'usuario',
  password: ''
});

const tipos = ['usuario', 'admin', 'supervisor'];

const crearUsuario = async () => {
  loading.value = true;
  try {
    await store.dispatch('auth/newUser', form.value);
    console.log("Usuario creado correctamente")
    // $q.notify({
    //   type: 'positive',
    //   message: '✅ Usuario creado correctamente',
    //   position: 'top-right',
    // });

    // Opcional: limpiar el formulario
    form.value = {
      nombre: '',
      apellido: '',
      rut: '',
      email: '',
      tipo: 'usuario',
      password: ''
    };

  } catch (err) {
    $q.notify({
      type: 'negative',
      message: '❌ Error al crear usuario',
      position: 'top-right',
    });
  } finally {
    loading.value = false;
  }
};
</script>

