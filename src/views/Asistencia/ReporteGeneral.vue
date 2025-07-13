<template>
  <q-page class="q-pa-md bg-grey-1">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-primary">Reporte General de Asistencias</div>
        <div class="text-subtitle2 text-grey-7">
          Consulta el resumen de asistencias por empresa y empleado
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input filled v-model="filtroNombre" label="Filtrar por empleado" class="q-mb-md" />

        <q-table
          :rows="filtrados"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          no-data-label="No hay datos disponibles"
        >
          <template v-slot:body-cell-totalAsistencias="props">
            <q-td :props="props">
              <q-badge color="primary" align="top">
                {{ props.row.totalAsistencias }}
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const filtroNombre = ref('');
const asistencias = ref([]);

onMounted(() => {
  // Simulación de datos
  asistencias.value = [
    {
      id: 1,
      empleado: 'Juan Pérez',
      empresa: 'TechNova',
      totalAsistencias: 20,
      ultAsistencia: '2025-08-18',
    },
    {
      id: 2,
      empleado: 'Laura Soto',
      empresa: 'Checksys SpA',
      totalAsistencias: 18,
      ultAsistencia: '2025-08-17',
    },
  ];
});

const columns = [
  { name: 'empleado', label: 'Empleado', field: 'empleado', sortable: true },
  { name: 'empresa', label: 'Empresa', field: 'empresa', sortable: true },
  { name: 'totalAsistencias', label: 'Total Asistencias', field: 'totalAsistencias', sortable: true },
  { name: 'ultAsistencia', label: 'Última Asistencia', field: 'ultAsistencia', sortable: true },
];

const filtrados = computed(() => {
  if (!filtroNombre.value) return asistencias.value;
  return asistencias.value.filter(row =>
    row.empleado.toLowerCase().includes(filtroNombre.value.toLowerCase())
  );
});
</script>
