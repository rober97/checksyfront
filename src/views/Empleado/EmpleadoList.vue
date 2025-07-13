<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-primary">Empleados</div>
      <q-btn label="Nuevo empleado" color="primary" icon="person_add" @click="crearEmpleado" />
    </div>

    <q-card flat bordered>
      <q-table
        title="Listado de empleados"
        :rows="empleados"
        :columns="columns"
        row-key="id"
        :pagination="{ rowsPerPage: 10 }"
        flat
        bordered
      >
        <template v-slot:body-cell-actions="props">
          <q-td align="center">
            <q-btn flat dense icon="visibility" @click="verEmpleado(props.row)" />
            <q-btn flat dense icon="edit" color="primary" @click="editarEmpleado(props.row)" />
            <q-btn flat dense icon="delete" color="negative" @click="confirmarEliminar(props.row)" />
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
const empleados = ref([]);

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left' },
  { name: 'rut', label: 'RUT', field: 'rut', align: 'left' },
  { name: 'cargo', label: 'Cargo', field: 'cargo', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' },
];

function crearEmpleado() {
  router.push('/empresa/empleados/nuevo');
}

function verEmpleado(empleado) {
  router.push(`/empresa/empleados/${empleado.id}`);
}

function editarEmpleado(empleado) {
  router.push(`/empresa/empleados/${empleado.id}/editar`);
}

function confirmarEliminar(empleado) {
  $q.dialog({
    title: 'Eliminar empleado',
    message: `¿Seguro que deseas eliminar a ${empleado.nombre}?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    empleados.value = empleados.value.filter(e => e.id !== empleado.id);
    $q.notify({ type: 'positive', message: 'Empleado eliminado correctamente' });
  });
}

onMounted(() => {
  empleados.value = [
    { id: 1, nombre: 'Valentina Soto', correo: 'valentina@empresa.cl', rut: '12.345.678-9', cargo: 'Contadora' },
    { id: 2, nombre: 'Carlos Díaz', correo: 'carlos@empresa.cl', rut: '11.223.344-5', cargo: 'Ingeniero' },
  ];
});
</script>
