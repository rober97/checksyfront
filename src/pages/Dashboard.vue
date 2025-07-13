<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Admin Dashboard -->
    <template v-if="role === 'admin'">
      <div class="text-h5 text-primary q-mb-md">Dashboard Administrador</div>
      <div class="row q-col-gutter-md q-mb-lg">
        <KPIBox title="Empresas registradas" :value="23" icon="business" color="primary" />
        <KPIBox title="Usuarios activos" :value="87" icon="group" color="secondary" />
        <KPIBox title="Solicitudes pendientes" :value="12" icon="pending_actions" color="warning" />
      </div>

      <q-card class="q-pa-md q-mb-lg">
        <div class="text-subtitle1 text-primary q-mb-sm">Resumen general</div>
        <p class="text-grey-8">Estadísticas generales del sistema y métricas clave.</p>
      </q-card>
    </template>

    <!-- Empresa Dashboard -->
    <template v-else-if="role === 'empresa'">
      <div class="text-h5 text-primary q-mb-md">Dashboard de Empresa</div>
      <div class="row q-col-gutter-md q-mb-lg">
        <KPIBox title="Empleados" :value="24" icon="badge" color="primary" />
        <KPIBox title="Asistencias hoy" :value="19" icon="how_to_reg" color="positive" />
        <KPIBox title="Ausencias hoy" :value="5" icon="person_off" color="negative" />
      </div>

      <q-banner v-if="3 > 0" class="bg-warning text-dark q-mb-lg" rounded dense>
        Tienes 3 solicitudes de días pendientes de aprobación.
      </q-banner>

      <q-card flat bordered class="q-pa-md q-mb-xl">
        <div class="text-subtitle1 text-primary q-mb-md">Próximos eventos</div>
        <ul class="q-pl-md">
          <li>2025-07-30 – Evaluación de desempeño</li>
          <li>2025-08-01 – Reunión mensual RRHH</li>
        </ul>
      </q-card>
    </template>

    <!-- Empleado Dashboard -->
    <template v-else-if="role === 'empleado'">
      <div class="text-h5 text-primary q-mb-md">Bienvenido</div>
      <div class="row q-col-gutter-md q-mb-lg">
        <KPIBox title="Asistencias este mes" :value="17" icon="calendar_month" color="primary" />
        <KPIBox title="Días solicitados" :value="2" icon="event_note" color="info" />
        <KPIBox title="Días aprobados" :value="2" icon="done" color="positive" />
      </div>

      <q-card flat bordered class="q-pa-md q-mb-xl">
        <div class="text-subtitle1 text-primary q-mb-sm">Próximos eventos</div>
        <p class="text-grey">No hay eventos próximos por ahora.</p>
      </q-card>

      <q-card flat bordered class="q-pa-md">
        <div class="text-subtitle1 text-primary q-mb-sm">Últimas asistencias</div>
        <ul class="q-pl-md">
          <li>2025-07-25 – Entrada: 08:04</li>
          <li>2025-07-24 – Entrada: 08:07</li>
        </ul>
      </q-card>
    </template>

    <!-- Fallback -->
    <template v-else>
      <div class="text-h6 text-negative">No tienes permisos para acceder a este panel.</div>
    </template>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import KPIBox from '@/components/KPIBox.vue';

// Simula el rol del usuario (en producción lo obtienes del store o token)
const role = ref('empresa'); // 'admin' | 'empresa' | 'empleado'
</script>
