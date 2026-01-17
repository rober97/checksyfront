<template>
  <div class="filters-section">
    <div class="search-wrapper">
      <q-icon name="search" class="search-icon" />
      <input
        type="text"
        :value="search"
        @input="$emit('update:search', $event.target.value)"
        placeholder="Buscar por fecha, tipo, nota..."
        class="search-input"
      />
      <button v-if="search" @click="$emit('update:search', '')" class="search-clear">
        <q-icon name="close" size="18px" />
      </button>
    </div>

    <div class="filter-group">
      <q-select
        outlined
        dense
        v-model="localTipo"
        :options="tipoOptions"
        emit-value
        map-options
        clearable
        placeholder="Tipo de registro"
        class="filter-select"
        @update:model-value="$emit('update:tipo', $event)"
      >
        <template #prepend>
          <q-icon name="compare_arrows" />
        </template>
      </q-select>

      <q-select
        outlined
        dense
        v-model="localMood"
        :options="moodOptions"
        emit-value
        map-options
        clearable
        placeholder="Estado de ánimo"
        class="filter-select"
        @update:model-value="$emit('update:mood', $event)"
      >
        <template #prepend>
          <q-icon name="mood" />
        </template>
      </q-select>

      <q-btn
        outline
        rounded
        icon="view_column"
        label="Columnas"
        @click="$emit('show-columns')"
        class="columns-btn"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  search: { type: String, default: '' },
  tipo: { type: String, default: null },
  mood: { type: String, default: null }
});

defineEmits(['update:search', 'update:tipo', 'update:mood', 'show-columns']);

const tipoOptions = [
  { label: 'Entrada', value: 'entrada' },
  { label: 'Salida', value: 'salida' }
];

const moodOptions = [
  { label: 'Excelente', value: 'great' },
  { label: 'Bien', value: 'good' },
  { label: 'Normal', value: 'ok' },
  { label: 'Cansado', value: 'tired' },
  { label: 'Mal', value: 'bad' }
];

const localTipo = ref(props.tipo);
const localMood = ref(props.mood);

watch(() => props.tipo, (val) => localTipo.value = val);
watch(() => props.mood, (val) => localMood.value = val);
</script>

<style scoped>
.filters-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 20px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 48px;
  padding: 0 48px 0 52px;
  border: 2px solid transparent;
  background: white;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1),
              0 4px 12px rgba(0, 0, 0, 0.08);
}

body.body--dark .search-input {
  background: rgba(30, 41, 59, 0.6);
  color: #f1f5f9;
  backdrop-filter: blur(20px);
}

body.body--dark .search-input:focus {
  background: rgba(30, 41, 59, 0.8);
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.search-clear:hover {
  background: #e2e8f0;
  color: #334155;
}

body.body--dark .search-clear {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

body.body--dark .search-clear:hover {
  background: rgba(255, 255, 255, 0.12);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  min-width: 200px;
}

.filter-select :deep(.q-field__control) {
  height: 48px;
  border-radius: 14px;
  background: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

body.body--dark .filter-select :deep(.q-field__control) {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
}

.filter-select :deep(.q-field__control):hover {
  border-color: #cbd5e1;
}

.filter-select :deep(.q-field--focused .q-field__control) {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.columns-btn {
  height: 48px;
  padding: 0 24px;
  font-weight: 600;
  border-width: 2px;
  border-color: #e2e8f0;
  color: #64748b;
  transition: all 0.3s;
}

.columns-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

body.body--dark .columns-btn {
  border-color: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

body.body--dark .columns-btn:hover {
  border-color: #6366f1;
  color: #a5b4fc;
}

@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }
}
</style>