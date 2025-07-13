<template>
  <q-page class="q-pa-md bg-grey-1">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-primary">Listado de Solicitudes</div>
        <div class="text-subtitle2 text-grey">Revisa o administra las solicitudes realizadas</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          :rows="solicitudes"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          no-data-label="No hay solicitudes registradas"
        >
          <template v-slot:body-cell-estado="props">
            <q-td :props="props">
              <q-badge
                :color="estadoColor(props.row.estado)"
                class="q-px-sm"
                align="top"
              >
                {{ props.row.estado }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-acciones="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.estado === 'Pendiente'"
                dense flat icon="check" color="positive"
                @click="aprobar(props.row.id)"
              />
              <q-btn
                v-if="props.row.estado === 'Pendiente'"
                dense flat icon="close" color="negative"
                @click="rechazar(props.row.id)"
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
import { useQuasar } from 'quasar';

const $q = useQuasar();

const solicitudes = ref([]);

const columns = [
  { name: 'empleado', label: 'Empleado', field: 'empleado', sortable: true },
  { name: 'tipo', label: 'Tipo', field: 'tipo', sortable: true },
  { name: 'fechaInicio', label: 'Desde', field: 'fechaInicio', sortable: true },
  { name: 'fechaFin', label: 'Hasta', field: 'fechaFin', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', sortable: false },
];

function estadoColor(estado) {
  switch (estado) {
    case 'Aprobado':
      return 'positive';
    case 'Rechazado':
      return 'negative';
    default:
      return 'warning';
  }
}

function aprobar(id) {
  const solicitud = solicitudes.value.find(s => s.id === id);
  if (solicitud) {
    solicitud.estado = 'Aprobado';
    $q.notify({ type: 'positive', message: 'Solicitud aprobada' });
  }
}

function rechazar(id) {
  const solicitud = solicitudes.value.find(s => s.id === id);
  if (solicitud) {
    solicitud.estado = 'Rechazado';
    $q.notify({ type: 'negative', message: 'Solicitud rechazada' });
  }
}

onMounted(() => {
  solicitudes.value = [
    {
      id: 1,
      empleado: 'Juan Pérez',
      tipo: 'Vacaciones',
      fechaInicio: '2025-08-01',
      fechaFin: '2025-08-10',
      estado: 'Pendiente',
    },
    {
      id: 2,
      empleado: 'Laura Soto',
      tipo: 'Día compensatorio',
      fechaInicio: '2025-08-05',
      fechaFin: '2025-08-05',
      estado: 'Aprobado',
    },
  ];
});
</script>
