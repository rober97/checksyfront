<template>
  <div class="p-4">
    <h3 class="text-xl font-semibold mb-4">Gestionar empleados</h3>
    <Table :data="employees" />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import Table from "../components/TableComponent.vue";

export default {
  components: { Table },
  setup() {
    const employees = ref([]);

    const getEmployees = async () => {
      //const data = await fetchEmployees();
     // employees.value = data;
    };

    onMounted(getEmployees);

    return { employees };
  },
};
</script>

<style scoped>
/* Estilos personalizados aquí */
</style>
