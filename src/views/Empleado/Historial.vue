<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="text-h5 text-primary q-mb-lg">Historial de Asistencias</div>

    <q-card flat bordered>
      <q-card-section>
        <q-table
          :rows="asistencias"
          :columns="columns"
          row-key="fecha"
          :filter="filtro"
          flat
          bordered
          dense
          separator="horizontal"
        >
          <template v-slot:top>
            <q-input
              dense
              debounce="300"
              v-model="filtro"
              placeholder="Buscar por fecha o estado"
              filled
              class="q-mb-sm"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const filtro = ref('');
const asistencias = ref([]);

const columns = [
  {
    name: 'fecha',
    label: 'Fecha',
    align: 'left',
    field: row => new Date(row.fecha).toLocaleDateString(),
    sortable: true
  },
  {
    name: 'hora',
    label: 'Hora',
    align: 'left',
    field: 'hora',
    sortable: true
  },
  {
    name: 'tipo',
    label: 'Tipo',
    align: 'left',
    field: 'tipo',
    sortable: true
  },
  {
    name: 'ubicacion',
    label: 'Ubicación',
    align: 'left',
    field: row => row.ubicacion || 'No disponible'
  }
];

// Simulación de datos
onMounted(() => {
  asistencias.value = [
    {
      fecha: '2025-09-01',
      hora: '08:05',
      tipo: 'Entrada',
      ubicacion: 'Oficina Central'
    },
    {
      fecha: '2025-09-01',
      hora: '17:02',
      tipo: 'Salida',
      ubicacion: 'Oficina Central'
    },
    {
      fecha: '2025-09-02',
      hora: '08:10',
      tipo: 'Entrada',
      ubicacion: 'Sucursal Norte'
    },
    {
      fecha: '2025-09-02',
      hora: '17:00',
      tipo: 'Salida',
      ubicacion: 'Sucursal Norte'
    }
  ];
});
</script>
