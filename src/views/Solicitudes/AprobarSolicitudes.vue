<template>
  <q-page class="q-pa-md bg-grey-1">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-primary">Solicitudes Pendientes</div>
        <div class="text-subtitle2 text-grey">Revisa, aprueba o rechaza solicitudes enviadas por los empleados</div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        bordered
        :rows="solicitudes"
        :columns="columns"
        row-key="id"
        class="q-pa-md"
        no-data-label="No hay solicitudes pendientes"
      >
        <template v-slot:body-cell:acciones="props">
          <q-td align="center">
            <q-btn
              dense
              flat
              round
              icon="check"
              color="positive"
              @click="aprobar(props.row.id)"
              title="Aprobar"
            />
            <q-btn
              dense
              flat
              round
              icon="close"
              color="negative"
              @click="rechazar(props.row.id)"
              title="Rechazar"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const solicitudes = ref([]);

const columns = [
  { name: 'nombre', label: 'Empleado', align: 'left', field: 'nombre' },
  { name: 'tipo', label: 'Tipo', align: 'left', field: 'tipo' },
  { name: 'fechaInicio', label: 'Inicio', align: 'left', field: 'fechaInicio' },
  { name: 'fechaFin', label: 'Fin', align: 'left', field: 'fechaFin' },
  { name: 'comentario', label: 'Comentario', align: 'left', field: 'comentario' },
  { name: 'acciones', label: 'Acciones', align: 'center' },
];

onMounted(() => {
  // Simula solicitudes pendientes
  solicitudes.value = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      tipo: 'Vacaciones',
      fechaInicio: '2025-09-01',
      fechaFin: '2025-09-10',
      comentario: 'Viaje familiar',
    },
    {
      id: 2,
      nombre: 'Laura Soto',
      tipo: 'Día Compensatorio',
      fechaInicio: '2025-09-03',
      fechaFin: '2025-09-03',
      comentario: 'Asuntos personales',
    },
  ];
});

function aprobar(id) {
  solicitudes.value = solicitudes.value.filter(s => s.id !== id);
  $q.notify({ type: 'positive', message: 'Solicitud aprobada correctamente' });
}

function rechazar(id) {
  solicitudes.value = solicitudes.value.filter(s => s.id !== id);
  $q.notify({ type: 'negative', message: 'Solicitud rechazada' });
}
</script>
