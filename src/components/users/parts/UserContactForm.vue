<template>
  <div class="rk-contact-wrap">

    <!-- ===== Sección: Dirección ===== -->
    <section class="rk-form-section">
      <div class="rk-form-section__header">
        <div class="rk-form-section__icon">
          <q-icon name="home_pin" />
        </div>
        <div>
          <div class="rk-form-section__title">Dirección</div>
          <div class="rk-form-section__subtitle">Domicilio habitual del empleado.</div>
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12">
          <q-input
            v-model="local.address.line1"
            label="Calle y número"
            dense
            outlined
            clearable
            class="rk-field"
          >
            <template #prepend><q-icon name="signpost" /></template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="local.address.commune"
            label="Comuna"
            dense
            outlined
            clearable
            class="rk-field"
          >
            <template #prepend><q-icon name="location_city" /></template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="local.address.city"
            label="Ciudad"
            dense
            outlined
            clearable
            class="rk-field"
          >
            <template #prepend><q-icon name="apartment" /></template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="local.address.region"
            label="Región"
            dense
            outlined
            clearable
            class="rk-field"
          >
            <template #prepend><q-icon name="map" /></template>
          </q-input>
        </div>
      </div>
    </section>

    <!-- ===== Sección: Contacto ===== -->
    <section class="rk-form-section">
      <div class="rk-form-section__header">
        <div class="rk-form-section__icon">
          <q-icon name="contact_phone" />
        </div>
        <div>
          <div class="rk-form-section__title">Datos de contacto</div>
          <div class="rk-form-section__subtitle">Teléfono personal y contacto de emergencia.</div>
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="local.phone"
            label="Teléfono"
            dense
            outlined
            clearable
            class="rk-field"
            mask="################"
          >
            <template #prepend><q-icon name="phone" /></template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="local.emergencyContact"
            label="Contacto de emergencia"
            dense
            outlined
            clearable
            class="rk-field"
          >
            <template #prepend><q-icon name="emergency" /></template>
          </q-input>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { reactive, watch } from "vue";

const props = defineProps({ modelValue: { type: Object, required: true } });
const emit = defineEmits(["update:modelValue"]);

const local = reactive({
  phone: "",
  emergencyContact: "",
  address: { line1: "", commune: "", city: "", region: "" },
  ...props.modelValue,
  address: { line1: "", commune: "", city: "", region: "", ...props.modelValue?.address },
});

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    local.phone = v.phone ?? local.phone;
    local.emergencyContact = v.emergencyContact ?? local.emergencyContact;
    Object.assign(local.address, v.address ?? {});
  },
  { deep: true }
);

watch(local, (v) => emit("update:modelValue", { ...v }), { deep: true });
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   TOKENS — heredan del modal padre
══════════════════════════════════════════════════ */
.rk-contact-wrap {
  --rk-bg:           #ffffff;
  --rk-surface:      #f7f8fc;
  --rk-border:       rgba(15, 17, 23, 0.08);
  --rk-border-2:     rgba(15, 17, 23, 0.14);
  --rk-text:         #0f1117;
  --rk-text-2:       #5a6482;
  --rk-text-3:       #9aa1b9;
  --rk-accent:       #6366f1;
  --rk-accent-soft:  rgba(99, 102, 241, 0.10);

  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--rk-text);
}

.body--dark .rk-contact-wrap {
  --rk-bg:           #141720;
  --rk-surface:      #1a1e2a;
  --rk-border:       rgba(255, 255, 255, 0.08);
  --rk-border-2:     rgba(255, 255, 255, 0.16);
  --rk-text:         #e8eaf2;
  --rk-text-2:       #8b92ad;
  --rk-text-3:       #555d78;
  --rk-accent-soft:  rgba(99, 102, 241, 0.18);
}

/* ══════════════════════════════════════════════════
   SECTIONS
══════════════════════════════════════════════════ */
.rk-form-section {
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  padding: 14px 16px;
  transition: border-color 0.15s;
}
.rk-form-section:hover {
  border-color: var(--rk-border-2);
}

.rk-form-section__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.rk-form-section__icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.rk-form-section__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--rk-text);
  letter-spacing: -0.1px;
  line-height: 1.25;
}
.rk-form-section__subtitle {
  font-size: 11.5px;
  color: var(--rk-text-2);
  margin-top: 1px;
  line-height: 1.4;
  font-weight: 500;
}

/* ══════════════════════════════════════════════════
   FIELDS
══════════════════════════════════════════════════ */
.rk-field :deep(.q-field__control) {
  min-height: 40px;
  border-radius: 9px;
  background: var(--rk-bg);
}
.rk-field :deep(.q-field__control::before) {
  border-color: var(--rk-border);
}
.rk-field:hover :deep(.q-field__control::before) {
  border-color: var(--rk-border-2);
}
.rk-field :deep(.q-field--focused .q-field__control::after) {
  border-color: var(--rk-accent);
  border-width: 1.5px;
}
.rk-field :deep(.q-field__label) {
  color: var(--rk-text-2);
  font-weight: 500;
  font-size: 12.5px;
}
.rk-field :deep(.q-field__native),
.rk-field :deep(.q-field__input) {
  color: var(--rk-text);
  font-size: 13px;
}
.rk-field :deep(.q-field__prepend),
.rk-field :deep(.q-field__append) {
  color: var(--rk-text-3);
}
.rk-field :deep(.q-field--focused .q-field__prepend),
.rk-field :deep(.q-field--focused .q-field__append) {
  color: var(--rk-accent);
}
.rk-field :deep(.q-field__messages) { font-size: 10.5px; }
</style>
