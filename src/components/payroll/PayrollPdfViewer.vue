<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
    class="rk-pdf-dialog"
  >
    <div class="rk-pdf-viewer">
      <!-- PDF Toolbar -->
      <div class="rk-pdf-toolbar">
        <div class="rk-pdf-toolbar-content">
          <div class="rk-pdf-icon">
            <q-icon name="picture_as_pdf" />
          </div>
          <div class="rk-pdf-title-section">
            <strong class="rk-pdf-title">{{ pdfTitle }}</strong>
            <span class="rk-pdf-subtitle">Vista previa de liquidación</span>
          </div>
        </div>

        <div class="rk-pdf-toolbar-actions">
          <button
            class="rk-pdf-action-btn"
            @click="$emit('download')"
            :disabled="!pdfUrl || loading"
          >
            <q-icon name="download" />
            <span>Descargar</span>
          </button>
          <button class="rk-pdf-action-btn" @click="$emit('update:modelValue', false)">
            <q-icon name="close" />
            <span>Cerrar</span>
          </button>
        </div>
      </div>

      <!-- PDF Content -->
      <div class="rk-pdf-content">
        <q-inner-loading :showing="loading">
          <div class="rk-pdf-loading">
            <q-spinner-cube size="80px" color="primary" />
            <h3 class="rk-pdf-loading-title">Cargando PDF...</h3>
            <p class="rk-pdf-loading-text">Por favor espera un momento</p>
          </div>
        </q-inner-loading>

        <iframe
          v-if="pdfUrl && !loading"
          :src="pdfUrl"
          class="rk-pdf-iframe"
        />
      </div>
    </div>
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
.rk-pdf-dialog :deep(.q-dialog__backdrop) {
  backdrop-filter: blur(8px);
  background: rgba(10, 14, 20, 0.8);
}

.rk-pdf-viewer {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
}

.rk-pdf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1.5px solid rgba(6, 182, 212, 0.12);
  z-index: 10;
}

.body--dark .rk-pdf-toolbar {
  background: rgba(17, 24, 39, 0.95);
  border-bottom-color: rgba(6, 182, 212, 0.2);
}

.rk-pdf-toolbar-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rk-pdf-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.12);
  border-radius: 11px;
}

.rk-pdf-icon .q-icon {
  font-size: 24px;
  color: #ef4444;
}

.rk-pdf-title {
  display: block;
  font-size: 1.1rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.95);
  margin-bottom: 4px;
}

.body--dark .rk-pdf-title {
  color: rgba(255, 255, 255, 0.95);
}

.rk-pdf-subtitle {
  display: block;
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.5);
}

.body--dark .rk-pdf-subtitle {
  color: rgba(255, 255, 255, 0.5);
}

.rk-pdf-toolbar-actions {
  display: flex;
  gap: 12px;
}

.rk-pdf-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(6, 182, 212, 0.05);
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 10px;
  color: rgba(15, 23, 42, 0.95);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.body--dark .rk-pdf-action-btn {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.rk-pdf-action-btn:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
}

.rk-pdf-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rk-pdf-action-btn .q-icon {
  font-size: 18px;
}

.rk-pdf-content {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
}

.rk-pdf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.rk-pdf-loading-title {
  margin-top: 24px;
  font-size: 1.5rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
}

.rk-pdf-loading-text {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
}

.rk-pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

/* Responsive */
@media (max-width: 767px) {
  .rk-pdf-toolbar {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .rk-pdf-toolbar-actions {
    width: 100%;
    flex-direction: column;
  }

  .rk-pdf-action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>