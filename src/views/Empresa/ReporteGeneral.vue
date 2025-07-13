<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="text-h5 text-primary q-mb-lg">Reporte General de Asistencias</div>

    <q-card flat bordered class="q-pa-md">

      <!-- Filtros -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-xs-12 col-sm-4">
          <q-input v-model="filtro.nombre" label="Buscar por nombre" dense clearable />
        </div>
        <div class="col-xs-12 col-sm-4">
          <q-input v-model="filtro.fechaDesde" label="Desde" type="date" dense />
        </div>
        <div class="col-xs-12 col-sm-4">
          <q-input v-model="filtro.fechaHasta" label="Hasta" type="date" dense />
        </div>
      </div>

      <!-- Tabla -->
      <q-table
        :rows="filtrarAsistencias()"
        :columns="columnas"
        row-key="id"
        dense
        flat
        bordered
        separator="horizontal"
        no-data-label="Sin registros"
        class="shadow-1"
      >
        <template v-slot:top-right>
          <q-btn
            label="Exportar"
            icon="download"
            color="primary"
            @click="exportarCSV"
            flat
            dense
          />
        </template>
      </q-table>

    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { exportFile, useQuasar } from 'quasar';

const $q = useQuasar();

const filtro = ref({
  nombre: '',
  fechaDesde: '',
  fechaHasta: ''
});

const columnas = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'fecha', label: 'Fecha', field: 'fecha', align: 'left' },
  { name: 'hora', label: 'Hora', field: 'hora', align: 'left' },
  { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left' },
  { name: 'comentario', label: 'Comentario', field: 'comentario', align: 'left' }
];

const asistencias = ref([
  {
    id: 1,
    nombre: 'Juan Pérez',
    fecha: '2025-07-24',
    hora: '08:10',
    tipo: 'Entrada',
    comentario: 'Llegué temprano'
  },
  {
    id: 2,
    nombre: 'Laura Soto',
    fecha: '2025-07-24',
    hora: '08:20',
    tipo: 'Entrada',
    comentario: ''
  }
]);

const filtrarAsistencias = () => {
  return asistencias.value.filter((a) => {
    const nombreMatch = filtro.value.nombre === '' || a.nombre.toLowerCase().includes(filtro.value.nombre.toLowerCase());
    const fechaDesdeMatch = !filtro.value.fechaDesde || a.fecha >= filtro.value.fechaDesde;
    const fechaHastaMatch = !filtro.value.fechaHasta || a.fecha <= filtro.value.fechaHasta;
    return nombreMatch && fechaDesdeMatch && fechaHastaMatch;
  });
};

const exportarCSV = () => {
  const rows = filtrarAsistencias();
  const csv = [
    columnas.map(col => col.label).join(','),
    ...rows.map(row => columnas.map(col => `"${row[col.field] || ''}"`).join(','))
  ].join('\n');

  const status = exportFile('reporte_asistencia.csv', csv, 'text/csv');
  if (!status) {
    $q.notify({ type: 'negative', message: 'No se pudo exportar el archivo.' });
  }
};
</script>
