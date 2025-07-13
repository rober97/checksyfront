<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-primary q-mb-md">
      Bienvenido a tu panel de control, {{ nombreRol }}
    </div>

    <q-card flat bordered class="q-pa-md q-mb-md">
      <q-card-section class="text-subtitle2">
        Tus KPIs
      </q-card-section>
      <div class="row q-col-gutter-md">
        <KpiCard title="Días Vacaciones" :value="vacaciones" />
        <KpiCard title="Asistencias" :value="asistencias" />
        <KpiCard title="Solicitudes Pendientes" :value="solicitudes" />
      </div>
    </q-card>

    <q-banner v-if="role === 'Administrador'" class="bg-grey-3 q-pa-md" rounded>
      <q-icon name="info" color="primary" class="q-mr-sm" />
      Puedes gestionar usuarios, permisos y más desde el menú lateral.
    </q-banner>

    <q-banner v-if="role === 'Empresa'" class="bg-grey-3 q-pa-md" rounded>
      <q-icon name="business" color="primary" class="q-mr-sm" />
      Revisa reportes y gestiona empleados desde el menú lateral.
    </q-banner>

    <q-banner v-if="role === 'Empleado'" class="bg-grey-3 q-pa-md" rounded>
      <q-icon name="badge" color="primary" class="q-mr-sm" />
      Recuerda marcar tu asistencia y revisar tu historial.
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import KpiCard from '@/components/KpiCard.vue';

const role = ref(localStorage.getItem('role') || 'Empleado');
const nombreRol = {
  Administrador: 'Administrador',
  Empresa: 'Empresa',
  Empleado: 'Empleado'
}[role.value];

// KPIs (puedes conectarlo a tu store o backend)
const vacaciones = ref(15.5);
const asistencias = ref(120);
const solicitudes = ref(3);
</script>
