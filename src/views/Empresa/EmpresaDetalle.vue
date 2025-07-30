<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-primary">Detalle de Empresa</div>
        <div class="q-gutter-sm">
          <q-btn icon="edit" color="primary" flat label="Editar" @click="editarEmpresa" />
          <q-btn icon="delete" color="negative" flat label="Eliminar" @click="confirmEliminar" />
        </div>
      </div>

      <q-separator class="q-my-md" />

      <q-list bordered>
        <q-item>
          <q-item-section avatar><q-icon name="badge" /></q-item-section>
          <q-item-section>
            <q-item-label>Nombre</q-item-label>
            <q-item-label caption>{{ empresa.nombre }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section avatar><q-icon name="assignment_ind" /></q-item-section>
          <q-item-section>
            <q-item-label>RUT</q-item-label>
            <q-item-label caption>{{ empresa.rut }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section avatar><q-icon name="email" /></q-item-section>
          <q-item-section>
            <q-item-label>Correo</q-item-label>
            <q-item-label caption>{{ empresa.email }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section avatar><q-icon name="phone" /></q-item-section>
          <q-item-section>
            <q-item-label>Teléfono</q-item-label>
            <q-item-label caption>{{ empresa.telefono }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section avatar><q-icon name="location_on" /></q-item-section>
          <q-item-section>
            <q-item-label>Dirección</q-item-label>
            <q-item-label caption>{{ empresa.direccion }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Relacionado: empleados -->
      <div class="q-mt-xl">
        <div class="text-subtitle1 text-primary q-mb-sm">Empleados de esta empresa</div>
        <q-table
          :rows="empleados"
          :columns="columns"
          flat
          bordered
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body-cell-actions="props">
            <q-td>
              <q-btn dense flat icon="visibility" @click="verEmpleado(props.row)" />
            </q-td>
          </template>
        </q-table>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const empresa = ref({});
const empleados = ref([]);

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre' },
  { name: 'correo', label: 'Correo', field: 'correo' },
  { name: 'cargo', label: 'Cargo', field: 'cargo' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' },
];

function editarEmpresa() {
  router.push(`/admin/empresas/${empresa.value.id}/editar`);
}

function confirmEliminar() {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de eliminar "${empresa.value.nombre}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    // Simula eliminación
    $q.notify({ type: 'positive', message: 'Empresa eliminada' });
    router.push('/admin/empresas');
  });
}

function verEmpleado(empleado) {
  router.push(`/admin/empleados/${empleado.id}`);
}

onMounted(() => {
  const id = route.params.id;
  // Simula datos
  empresa.value = {
    id,
    nombre: 'Recksy Demo S.A.',
    rut: '76.123.456-7',
    email: 'contacto@Recksy.cl',
    telefono: '+56 2 1234 5678',
    direccion: 'Av. del Trabajo 123',
  };

  empleados.value = [
    { id: 1, nombre: 'Juan Pérez', correo: 'juan@Recksy.cl', cargo: 'Analista' },
    { id: 2, nombre: 'María López', correo: 'maria@Recksy.cl', cargo: 'Contadora' },
  ];
});
</script>
