<template>
    <div class="p-4">
      <div class="flex space-x-4 mb-6">
        <KPIBox title="Empleados" :value="kpis.employees" />
        <KPIBox title="Asistencias hoy" :value="kpis.todayAttendances" />
        <KPIBox title="Ausentes hoy" :value="kpis.absentToday" />
      </div>
  
      <div>
        <h3 class="text-xl font-semibold mb-2">Asistencias recientes</h3>
        <Table :data="recentAttendances" />
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import KPIBox from '../components/KPIBox.vue';
  import Table from '../components/TableComponent.vue';
  
  export default {
    components: { KPIBox, Table },
    setup() {
      const kpis = ref({ employees: 0, todayAttendances: 0, absentToday: 0 });
      const recentAttendances = ref([]);
  
      const getDashboardData = async () => {
        //const data = await fetchDashboardData();
        //kpis.value = data.kpis;
        //recentAttendances.value = data.recentAttendances;
      };
  
      onMounted(getDashboardData);
  
      return { kpis, recentAttendances };
    },
  };
  </script>
  
  <style scoped>
  /* Estilos personalizados aquí */
  </style>
  