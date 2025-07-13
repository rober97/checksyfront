<template>
  <div class="document-viewer">
    <q-card flat bordered class="q-pa-md">

      <q-card-section>
        <div class="text-h6">{{ fileName || 'Documento' }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="viewer-content">
        <!-- Vista PDF -->
        <template v-if="isPdf">
          <embed :src="src" type="application/pdf" width="100%" height="600px" />
        </template>

        <!-- Imagen -->
        <template v-else-if="isImage">
          <img :src="src" alt="Vista previa" class="full-width q-mt-sm" style="max-height: 600px; object-fit: contain;" />
        </template>

        <!-- Otros archivos -->
        <template v-else>
          <q-icon name="insert_drive_file" size="64px" color="grey" />
          <p class="q-mt-sm">No se puede previsualizar este archivo.</p>
          <q-btn :href="src" label="Descargar archivo" color="primary" flat no-caps />
        </template>
      </q-card-section>

    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  src: { type: String, required: true },       // URL o base64
  fileName: { type: String, default: '' }
});

const isPdf = computed(() => props.src.endsWith('.pdf') || props.src.includes('application/pdf'));
const isImage = computed(() =>
  ['.jpg', '.jpeg', '.png'].some(ext => props.src.toLowerCase().endsWith(ext)) ||
  props.src.startsWith('data:image/')
);
</script>

<style scoped>
.viewer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
