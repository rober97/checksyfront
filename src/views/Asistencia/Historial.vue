<template>
  <q-page class="q-pa-md bg-grey-1">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-primary">Historial de Asistencias</div>
        <div class="text-subtitle2 text-grey-7">Revisa tus registros anteriores</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          :rows="asistencias"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          no-data-label="No hay asistencias registradas"
        >
          <template v-slot:body-cell-tipo="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.tipo === 'entrada' ? 'green' : 'blue'"
                text-color="white"
                size="sm"
              >
                {{ props.row.tipo }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-estadoAnimo="props">
            <q-td :props="props">
              <q-icon
                :name="iconoEstado(props.row.estadoAnimo)"
                :color="colorEstado(props.row.estadoAnimo)"
                size="md"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const asistencias = ref([]);

onMounted(() => {
  // Simulación de datos
  asistencias.value = [
    {
      id: 1,
      fecha: '2025-08-19',
      hora: '08:12',
      tipo: 'entrada',
      estadoAnimo: 'happy',
      comentario: 'Listo para empezar con todo 💪',
    },
    {
      id: 2,
      fecha: '2025-08-19',
      hora: '18:10',
      tipo: 'salida',
      estadoAnimo: 'sad',
      comentario: 'Día pesado 😓',
    },
  ];
});

const columns = [
  { name: 'fecha', label: 'Fecha', field: 'fecha', sortable: true },
  { name: 'hora', label: 'Hora', field: 'hora', sortable: true },
  { name: 'tipo', label: 'Tipo', field: 'tipo' },
  { name: 'estadoAnimo', label: 'Ánimo', field: 'estadoAnimo' },
  { name: 'comentario', label: 'Comentario', field: 'comentario' },
];

function iconoEstado(valor) {
  switch (valor) {
    case 'happy':
      return 'sentiment_very_satisfied';
    case 'neutral':
      return 'sentiment_neutral';
    case 'sad':
      return 'sentiment_dissatisfied';
    default:
      return 'help_outline';
  }
}

function colorEstado(valor) {
  switch (valor) {
    case 'happy':
      return 'green';
    case 'neutral':
      return 'orange';
    case 'sad':
      return 'red';
    default:
      return 'grey';
  }
}
</script>
