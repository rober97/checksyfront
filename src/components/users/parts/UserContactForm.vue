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
.rk-contact-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Sección ────────────────────────────────────────── */
.rk-form-section {
  background: var(--rk-section-bg, rgba(6, 182, 212, 0.03));
  border: 1px solid var(--rk-section-border, rgba(6, 182, 212, 0.12));
  border-radius: 12px;
  padding: 18px 20px 20px;
  transition: border-color 0.2s;
}

.rk-form-section:hover {
  border-color: var(--rk-section-border-hover, rgba(6, 182, 212, 0.22));
}

/* Header de sección */
.rk-form-section__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.rk-form-section__icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(20, 184, 166, 0.1));
  border: 1px solid rgba(6, 182, 212, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #06b6d4;
  font-size: 18px;
  flex-shrink: 0;
}

.rk-form-section__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--rk-text-primary, rgba(15, 23, 42, 0.9));
  letter-spacing: 0.01em;
  line-height: 1.3;
}

.rk-form-section__subtitle {
  font-size: 11.5px;
  color: var(--rk-text-muted, rgba(15, 23, 42, 0.5));
  margin-top: 2px;
  line-height: 1.4;
}

/* Campo */
.rk-field :deep(.q-field__control) {
  border-radius: 8px;
}

.rk-field :deep(.q-field__prepend) {
  color: rgba(6, 182, 212, 0.7);
}

/* Dark mode */
.body--dark .rk-form-section {
  --rk-section-bg: rgba(6, 182, 212, 0.04);
  --rk-section-border: rgba(6, 182, 212, 0.15);
  --rk-section-border-hover: rgba(6, 182, 212, 0.28);
  --rk-text-primary: rgba(255, 255, 255, 0.92);
  --rk-text-muted: rgba(255, 255, 255, 0.45);
}
</style>
