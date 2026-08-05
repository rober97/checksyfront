<template>
  <q-input
    :model-value="modelValue"
    :label="label"
    :hint="hint"
    dense
    outlined
    readonly
    class="rk-date-field"
    placeholder="YYYY-MM-DD"
    @update:model-value="(v) => emit('update:modelValue', v || null)"
  >
    <template #prepend><q-icon :name="icon" /></template>
    <template #append>
      <q-icon
        v-if="clearable && modelValue"
        name="clear"
        class="cursor-pointer"
        @click.stop="emit('update:modelValue', null)"
      >
        <q-tooltip>Quitar fecha</q-tooltip>
      </q-icon>
      <q-icon name="calendar_month" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            :model-value="modelValue"
            mask="YYYY-MM-DD"
            minimal
            color="primary"
            @update:model-value="(v) => emit('update:modelValue', v || null)"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
/**
 * Campo de fecha (input de sólo lectura + calendario en popup).
 * Emite siempre 'YYYY-MM-DD' o null.
 */
defineProps({
  modelValue: { type: String, default: null },
  label: { type: String, default: '' },
  icon: { type: String, default: 'event' },
  hint: { type: String, default: '' },
  clearable: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.rk-date-field :deep(.q-field__control) { min-height: 38px; border-radius: 8px; }
.rk-date-field :deep(.q-field__label) { font-weight: 500; font-size: 12px; }
.rk-date-field :deep(.q-field__native), .rk-date-field :deep(.q-field__input) { font-size: 12.5px; }
</style>
