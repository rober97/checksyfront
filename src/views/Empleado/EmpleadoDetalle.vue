<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-primary">Ficha del Empleado</div>
        <div class="q-gutter-sm">
          <q-btn label="Editar" icon="edit" color="primary" flat @click="editarEmpleado" />
          <q-btn label="Eliminar" icon="delete" color="negative" flat @click="confirmarEliminar" />
        </div>
      </div>

      <q-separator class="q-my-md" />

      <q-list bordered>
        <q-item>
          <q-item-section avatar><q-icon name="person" /></q-item-section>
          <q-item-section>
            <q-item-label>Nombre</q-item-label>
            <q-item-label caption>{{ empleado.nombre }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section avatar><q-icon name="assignment_ind" /></q-item-section>
          <q-item-section>
            <q-item-label>RUT</q-item-label>
            <q-item-label caption>{{ empleado.rut }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section avatar><q-icon name="email" /></q-item-section>
          <q-item-section>
            <q-item-label>Correo</q-item-label>
            <q-item-label caption>{{ empleado.correo }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section avatar><q-icon name="work" /></q-item-section>
          <q-item-section>
            <q-item-label>Cargo</q-item-label>
            <q-item-label caption>{{ empleado.cargo }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section avatar><q-icon name="calendar_today" /></q-item-section>
          <q-item-section>
            <q-item-label>Fecha de ingreso</q-item-label>
            <q-item-label caption>{{ empleado.fecha_ingreso }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Documentos -->
      <div class="q-mt-xl">
        <div class="text-subtitle1 text-primary q-mb-sm">Documentos adjuntos</div>
        <FileUploader @files-updated="handleDocs" />
        <ul class="q-pl-md q-mt-sm">
          <li v-for="(doc, index) in documentos" :key="index">
            {{ doc.name }}
            <q-btn flat dense icon="visibility" @click="verDoc(doc)" />
            <q-btn flat dense icon="delete" color="negative" @click="eliminarDoc(index)" />
          </li>
        </ul>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FileUploader from '@/components/FileUploader.vue';

const router = useRouter();
const route = useRoute();

const empleado = ref({});
const documentos = ref([]);

function editarEmpleado() {
  router.push(`/empresa/empleados/${empleado.value.id}/editar`);
}

function confirmarEliminar() {
  $q.dialog({
    title: 'Eliminar empleado',
    message: `¿Deseas eliminar a ${empleado.value.nombre}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    $q.notify({ type: 'positive', message: 'Empleado eliminado' });
    router.push('/empresa/empleados');
  });
}

function handleDocs(files) {
  documentos.value = [...documentos.value, ...files];
}

function verDoc(doc) {
  $q.dialog({
    title: doc.name,
    message: `Aquí se mostraría el visor para: ${doc.name}`,
  });
}

function eliminarDoc(index) {
  documentos.value.splice(index, 1);
}

onMounted(() => {
  const id = route.params.id;
  empleado.value = {
    id,
    nombre: 'Valentina Soto',
    rut: '12.345.678-9',
    correo: 'valentina@empresa.cl',
    cargo: 'Contadora',
    fecha_ingreso: '2023-01-10',
  };
});
</script>
