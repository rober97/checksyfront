<template>
  <div class="w-32 p-4 bg-white shadow-md rounded-md">
    <h4 class="text-sm text-gray-600">{{ title }}</h4>
    <p class="text-2xl font-semibold">{{ value }}</p>
  </div>
</template>

<script>
export default {
  props: ["title", "value"],
};
</script>

<style scoped>
/* Estilos personalizados aquí */
</style>
