<template>
  <UserCreation
    :model-value="modelValue"
    mode="edit"
    :user-id="userId"
    @update:model-value="$emit('update:modelValue', $event)"
    @updated="$emit('updated')"
    @deleted="$emit('deleted')"
    @saved="$emit('updated')"
  />
</template>

<script setup>
import UserCreation from "./UserCreation.vue";

defineProps({
  modelValue: { type: Boolean, required: true },
  userId: { type: String, required: true },
});

defineEmits(["update:modelValue", "updated", "deleted"]);
</script>
