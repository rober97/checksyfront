<template>
  <q-card class="kpi-card q-pa-md q-hoverable" flat bordered>
    <div class="row items-center no-wrap">
      <div class="col-auto q-mr-md">
        <q-avatar size="42px" :color="color" text-color="white">
          <q-icon :name="icon" />
        </q-avatar>
      </div>
      <div class="col">
        <div class="text-caption text-grey-7">{{ title }}</div>
        <div class="text-h6 text-weight-bold">{{ value }}</div>
      </div>
    </div>
  </q-card>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: {
    type: String,
    default: 'insights', // Ícono por defecto
  },
  color: {
    type: String,
    default: 'primary', // Color del avatar
  }
});
</script>

<style scoped>
.kpi-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.kpi-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);
}
</style>
