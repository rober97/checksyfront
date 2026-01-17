<template>
  <div class="toolbar-section">
    <div class="range-selector">
      <button
        v-for="preset in presets"
        :key="preset.value"
        :class="['range-btn', { 'range-btn--active': modelValue === preset.value }]"
        @click="$emit('update:modelValue', preset.value)"
      >
        <q-icon :name="preset.icon" size="18px" />
        <span>{{ preset.label }}</span>
      </button>

      <div class="range-divider"></div>

      <button
        :class="['range-btn range-btn--custom', { 'range-btn--active': modelValue === 'custom' }]"
        @click="showDatePicker"
      >
        <q-icon name="tune" size="18px" />
        <span>Personalizar</span>
        <q-popup-proxy ref="dateProxy">
          <q-date
            v-model="localRange"
            mask="YYYY-MM-DD"
            range
            minimal
            class="custom-date-picker"
          >
            <div class="date-actions">
              <q-btn flat label="Cancelar" v-close-popup />
              <q-btn
                unelevated
                color="primary"
                label="Aplicar"
                @click="applyCustomRange"
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </button>
    </div>

    <div class="toolbar-actions">
      <q-btn
        unelevated
        rounded
        color="primary"
        icon="download"
        label="Exportar"
        class="export-btn"
      >
        <q-menu auto-close class="export-menu">
          <q-list dense padding>
            <q-item clickable @click="$emit('export', 'excel')">
              <q-item-section avatar>
                <div class="menu-icon menu-icon--excel">
                  <q-icon name="table_chart" size="20px" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="menu-title">Excel</q-item-label>
                <q-item-label caption>Exportar como XLSX</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable @click="$emit('export', 'csv')">
              <q-item-section avatar>
                <div class="menu-icon menu-icon--csv">
                  <q-icon name="description" size="20px" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="menu-title">CSV</q-item-label>
                <q-item-label caption>Archivo de texto</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator spaced />

            <q-item clickable @click="$emit('export', 'print')">
              <q-item-section avatar>
                <div class="menu-icon menu-icon--print">
                  <q-icon name="print" size="20px" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="menu-title">Imprimir</q-item-label>
                <q-item-label caption>Vista de impresión</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

      <q-btn
        flat
        round
        icon="refresh"
        :loading="loading"
        @click="$emit('refresh')"
        class="refresh-btn"
      >
        <q-tooltip>Actualizar</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: { type: String, required: true },
  range: { type: Object, default: () => ({ from: null, to: null }) },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'update:range', 'export', 'refresh']);

const presets = [
  { label: '7 días', value: '7d', icon: 'today' },
  { label: '30 días', value: '30d', icon: 'date_range' },
  { label: 'Este año', value: 'ytd', icon: 'calendar_view_year' },
  { label: 'Todo', value: 'all', icon: 'all_inclusive' }
];

const dateProxy = ref(null);
const localRange = ref(props.range);

function showDatePicker() {
  emit('update:modelValue', 'custom');
}

function applyCustomRange() {
  emit('update:range', localRange.value);
  dateProxy.value?.hide();
}
</script>

<style scoped>
.toolbar-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.range-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 
              0 1px 2px rgba(0, 0, 0, 0.06);
}

body.body--dark .range-selector {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.range-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  background: transparent;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.range-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

body.body--dark .range-btn {
  color: #94a3b8;
}

body.body--dark .range-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.range-btn--active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.range-btn--active:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.range-divider {
  width: 1px;
  height: 28px;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    #e2e8f0 50%, 
    transparent 100%);
  margin: 0 4px;
}

body.body--dark .range-divider {
  background: linear-gradient(to bottom, 
    transparent 0%, 
    rgba(255, 255, 255, 0.1) 50%, 
    transparent 100%);
}

.range-btn--custom {
  position: relative;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-btn {
  font-weight: 700;
  padding: 12px 28px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  text-transform: none;
  letter-spacing: 0.02em;
}

.export-btn:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.refresh-btn {
  width: 44px;
  height: 44px;
  background: white;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: rotate(180deg);
}

body.body--dark .refresh-btn {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(255, 255, 255, 0.08);
}

body.body--dark .refresh-btn:hover {
  background: rgba(51, 65, 85, 0.6);
}

.export-menu {
  margin-top: 8px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon--excel {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
}

.menu-icon--csv {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
}

.menu-icon--print {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.menu-title {
  font-weight: 600;
}

.custom-date-picker {
  border-radius: 16px;
  overflow: hidden;
}

.date-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

body.body--dark .date-actions {
  border-top-color: rgba(255, 255, 255, 0.08);
}

@media (max-width: 768px) {
  .toolbar-section {
    flex-direction: column;
    align-items: stretch;
  }

  .range-selector {
    flex-wrap: wrap;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>