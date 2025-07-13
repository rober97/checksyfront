<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-primary">Empresas registradas</div>
      <q-btn label="Nueva empresa" color="primary" icon="add" @click="goToCreate" />
    </div>

    <q-card flat bordered>
      <q-table
        title="Listado de Empresas"
        :rows="empresas"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :pagination="pagination"
      >
        <template v-slot:body-cell-acciones="props">
          <q-td>
            <q-btn flat dense icon="visibility" @click="verEmpresa(props.row)" />
            <q-btn flat dense icon="edit" color="primary" @click="editarEmpresa(props.row)" />
            <q-btn flat dense icon="delete" color="negative" @click="eliminarEmpresa(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const empresas = ref([]);
const pagination = ref({ rowsPerPage: 10 });

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'rut', label: 'RUT', field: 'rut', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
];

function goToCreate() {
  router.push('/admin/empresas/nueva');
}

function verEmpresa(empresa) {
  router.push(`/admin/empresas/${empresa.id}`);
}

function editarEmpresa(empresa) {
  router.push(`/admin/empresas/${empresa.id}/editar`);
}

function eliminarEmpresa(empresa) {
  $q.dialog({
    title: 'Confirmar',
    message: `¿Deseas eliminar la empresa "${empresa.nombre}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    empresas.value = empresas.value.filter(e => e.id !== empresa.id);
    $q.notify({ type: 'positive', message: 'Empresa eliminada correctamente' });
  });
}

onMounted(() => {
  empresas.value = [
    {
      id: 1,
      nombre: 'Empresa Ejemplo S.A.',
      rut: '76.543.210-9',
      email: 'contacto@ejemplo.cl',
      telefono: '+56 9 1234 5678',
    },
    {
      id: 2,
      nombre: 'Checksy Demo Ltda.',
      rut: '77.123.456-0',
      email: 'admin@checksy.cl',
      telefono: '+56 2 3456 7890',
    },
  ];
});
</script>
