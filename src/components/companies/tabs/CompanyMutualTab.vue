<template>
  <div class="cmt-root">
    <!-- Info legal -->
    <div class="cmt-info">
      <q-icon name="health_and_safety" size="22px" class="cmt-info-icon" />
      <div>
        <div class="cmt-info-title">Mutualidad de Seguridad (Ley 16.744)</div>
        <p class="cmt-info-text">
          La afiliación a una mutualidad es <strong>obligatoria</strong> para todo
          empleador. Si no se afilia a una mutual privada (ACHS, Mutual CChC o IST),
          queda por defecto en el <strong>ISL</strong>.
        </p>
        <p class="cmt-info-text">
          La cotización se compone de una tasa base de <strong>0,95%</strong>
          (0,90% Ley 16.744 + 0,03% SANNA + 0,02% Ley 19.578) más una
          <strong>tasa adicional diferenciada</strong> (0% a 3,4%) que SUSESO
          asigna según siniestralidad.
        </p>
      </div>
    </div>

    <!-- Selector -->
    <div class="cmt-card">
      <div class="cmt-card-head">
        <div class="cmt-card-icon"><q-icon name="business" size="15px" /></div>
        <div>
          <div class="cmt-card-title">Afiliación de la empresa</div>
          <div class="cmt-card-sub">Selecciona la mutualidad y la tasa adicional asignada</div>
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-select
            v-model="local.entityId"
            :options="mutualOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Mutualidad afiliada *"
            dense
            outlined
            class="cmt-field"
            :loading="store.loading"
            :rules="[req]"
          >
            <template #prepend><q-icon name="shield" /></template>
            <template #no-option>
              <div class="q-pa-md text-center">
                <q-icon name="info" size="24px" class="q-mb-sm" />
                <div class="text-weight-bold">No hay mutuales en el catálogo</div>
                <div class="text-caption">Ejecuta el seed de payroll_entities.global.json</div>
              </div>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-md-6">
          <q-input
            v-model.number="local.additionalRate"
            type="number"
            step="0.01"
            min="0"
            max="3.4"
            label="Tasa adicional ATEP (%)"
            dense
            outlined
            class="cmt-field"
            :rules="[validRate]"
            hint="Asignada por SUSESO. Rango legal: 0% a 3,4%"
          >
            <template #prepend><q-icon name="percent" /></template>
            <template #append>
              <span class="text-caption text-grey-7">%</span>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-6">
          <q-input
            v-model="local.resolucionSuseso"
            label="N° resolución SUSESO (opcional)"
            dense
            outlined
            class="cmt-field"
            placeholder="Ej: Res. Ex. N°1234/2026"
          >
            <template #prepend><q-icon name="receipt_long" /></template>
          </q-input>
        </div>

        <div class="col-12 col-md-6">
          <div class="cmt-total">
            <div class="cmt-total-label">Cotización total a pagar</div>
            <div class="cmt-total-value">
              {{ totalRatePercent }}<span class="cmt-total-unit">%</span>
            </div>
            <div class="cmt-total-detail">
              0,95% base + {{ adicionalLabel }}% adicional
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status -->
    <div v-if="local.entityId" class="cmt-status">
      <q-icon name="check_circle" color="positive" size="18px" />
      <div>
        <strong>{{ selectedMutualName }}</strong>
        <span v-if="lastUpdateText"> · actualizada {{ lastUpdateText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, onMounted } from 'vue'
import { usePayrollCatalogStore } from '@/stores/payrollCatalogStore'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue', 'validity'])

const store = usePayrollCatalogStore()

const local = reactive({
  entityId: props.modelValue?.entityId || null,
  additionalRate: Number(props.modelValue?.additionalRate || 0),
  resolucionSuseso: props.modelValue?.resolucionSuseso || '',
  lastUpdate: props.modelValue?.lastUpdate || null,
})

onMounted(() => store.fetchAll({ force: false }))

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    local.entityId = v.entityId || null
    local.additionalRate = Number(v.additionalRate || 0)
    local.resolucionSuseso = v.resolucionSuseso || ''
    local.lastUpdate = v.lastUpdate || null
  },
  { deep: true },
)

watch(
  local,
  (v) => emit('update:modelValue', { ...v }),
  { deep: true },
)

// Reglas
const req = (v) => !!v || 'Selecciona la mutualidad'
const validRate = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return 'Debe ser un número'
  if (n < 0 || n > 3.4) return 'Rango legal: 0 a 3,4%'
  return true
}

// Opciones para el select
const mutualOptions = computed(() =>
  (store.mutualOptions || []).map((m) => ({
    label: m.displayName,
    value: m._id,
  })),
)

const selectedMutualName = computed(() => {
  const m = store.getMutualById?.(local.entityId)
  return m?.displayName || '—'
})

const adicionalLabel = computed(() => {
  const n = Number(local.additionalRate || 0)
  return n.toLocaleString('es-CL', { maximumFractionDigits: 2 })
})

const totalRatePercent = computed(() => {
  const total = 0.95 + Number(local.additionalRate || 0)
  return total.toLocaleString('es-CL', { maximumFractionDigits: 2 })
})

const lastUpdateText = computed(() => {
  if (!local.lastUpdate) return ''
  try {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(local.lastUpdate))
  } catch { return '' }
})

// Validity para el dialog padre
watch(
  () => [local.entityId, local.additionalRate],
  ([id, rate]) => {
    const ok = !!id && Number.isFinite(Number(rate)) && Number(rate) >= 0 && Number(rate) <= 3.4
    emit('validity', ok)
  },
  { immediate: true },
)
</script>

<style scoped>
.cmt-root {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.cmt-info {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-primary-soft);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 12px;
}
.cmt-info-icon {
  color: var(--color-primary);
  margin-top: 1px;
  flex-shrink: 0;
}
.cmt-info-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.1px;
}
.cmt-info-text {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
  line-height: 1.5;
}

.cmt-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
}

.cmt-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.cmt-card-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.12);
  color: rgb(6, 182, 212);
  border-radius: 8px;
}
.cmt-card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.1px;
}
.cmt-card-sub {
  font-size: 11.5px;
  color: var(--text-secondary);
  margin-top: 1px;
}

.cmt-field :deep(.q-field__control) {
  min-height: 40px;
  border-radius: 9px;
}

.cmt-total {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  height: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(22, 163, 74, 0.02));
  border: 1px solid rgba(22, 163, 74, 0.2);
  border-radius: 10px;
}
.cmt-total-label {
  font-size: 10.5px;
  color: rgb(90, 100, 130);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.cmt-total-value {
  font-size: 26px;
  font-weight: 800;
  color: rgb(22, 163, 74);
  line-height: 1.1;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}
.cmt-total-unit {
  font-size: 14px;
  font-weight: 700;
  margin-left: 2px;
}
.cmt-total-detail {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.cmt-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--color-success-soft);
  border: 1px solid rgba(22, 163, 74, 0.22);
  border-radius: 10px;
  font-size: 12.5px;
  color: var(--text-primary);
}
</style>
