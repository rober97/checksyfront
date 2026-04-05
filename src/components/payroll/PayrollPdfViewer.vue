<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="rk-pdf-viewer column no-wrap">
      <!-- Toolbar -->
      <q-toolbar class="rk-pdf-toolbar">
        <q-icon name="picture_as_pdf" color="red" size="24px" class="q-mr-sm" />
        <div>
          <div class="text-subtitle1 text-weight-bold">{{ pdfTitle }}</div>
          <div class="text-caption" style="opacity:.6">Documento emitido</div>
        </div>
        <q-space />
        <q-btn
          flat
          icon="download"
          label="Descargar"
          :disable="!pdfUrl || loading"
          @click="$emit('download')"
          class="rk-toolbar-btn"
        />
        <q-btn
          flat
          icon="close"
          label="Cerrar"
          @click="$emit('update:modelValue', false)"
          class="rk-toolbar-btn"
        />
      </q-toolbar>

      <q-separator />

      <!-- PDF Content -->
      <div class="col relative-position">
        <q-inner-loading :showing="loading">
          <div class="column items-center">
            <q-spinner-cube size="60px" color="primary" />
            <div class="text-subtitle1 text-weight-bold q-mt-lg">Cargando PDF...</div>
            <div class="text-caption text-grey q-mt-xs">Preparando el documento</div>
          </div>
        </q-inner-loading>

        <iframe
          v-if="pdfUrl && !loading"
          :src="pdfUrl"
          class="rk-pdf-iframe"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  pdfUrl: { type: String, default: '' },
  pdfTitle: { type: String, default: 'Liquidación' },
  loading: { type: Boolean, default: false },
});

defineEmits(['update:modelValue', 'download']);
</script>

<style scoped>
.rk-pdf-viewer {
  height: 100vh;
  border-radius: 0;
}

.rk-pdf-toolbar {
  padding: 12px 20px;
}

.rk-toolbar-btn {
  text-transform: none;
  font-weight: 600;
  border-radius: 8px;
}

.rk-pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}
</style>
