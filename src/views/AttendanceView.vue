<template>
  <div class="p-4">
    <h3 class="text-xl font-semibold mb-4">Historial de asistencias</h3>
    <Table :data="attendances" />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import Table from "../components/TableComponent.vue";

export default {
  components: { Table },
  setup() {
    const attendances = ref([]);

    const getAttendances = async () => {
      //const data = await fetchAttendances();
      //attendances.value = data;
    };

    onMounted(getAttendances);

    return { attendances };
  },
};
</script>

<style scoped>
/* Estilos personalizados aquí */
</style>
