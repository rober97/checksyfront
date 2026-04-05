<template>
  <div class="rk-payroll-header">
    <!-- Shared page header -->
    <PageHeader
      icon="account_balance_wallet"
      title="Liquidaciones"
      subtitle="Genera períodos, revisa empleados y emite documentos"
    >
      <template #actions>
        <q-btn
          flat dense
          icon="refresh"
          label="Actualizar"
          :loading="loading"
          @click="$emit('reload')"
        />
      </template>
    </PageHeader>

    <!-- Compact toolbar: company + tabs -->
    <div class="rk-toolbar">
      <div class="rk-toolbar-left">
        <q-select
          :model-value="selectedCompany"
          @update:model-value="$emit('update:selectedCompany', $event); $emit('company-change')"
          :options="companyOptions"
          option-value="_id"
          option-label="name"
          emit-value
          map-options
          outlined
          dense
          :loading="loading"
          :disable="loading"
          class="rk-company-select"
          popup-content-class="rk-company-dropdown"
        >
          <template #prepend>
            <q-icon name="business" size="18px" color="primary" />
          </template>

          <template #option="scope">
            <q-item v-bind="scope.itemProps" dense>
              <q-item-section avatar>
                <q-avatar size="28px" square>
                  <img v-if="scope.opt.logo" :src="scope.opt.logo" alt="logo" />
                  <q-icon v-else name="apartment" size="16px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.name }}</q-item-label>
                <q-item-label caption>{{ scope.opt.rut || 'Sin RUT' }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">No hay empresas</q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <q-tabs
        :model-value="mode"
        @update:model-value="$emit('update:mode', $event)"
        dense
        active-color="primary"
        indicator-color="primary"
        narrow-indicator
        class="rk-mode-tabs"
      >
        <q-tab name="periods" icon="calendar_month" label="Períodos" />
        <q-tab name="detail" icon="badge" label="Empleados" />
      </q-tabs>

      <div class="rk-toolbar-right">
        <div v-if="mode === 'detail' && currentPeriod" class="rk-period-badge">
          <q-icon name="event" size="14px" />
          <span>{{ formatPeriod(currentPeriod) }}</span>
        </div>
        <div v-if="pendingCount > 0" class="rk-pending-badge">
          <q-icon name="pending_actions" size="14px" />
          <span>{{ pendingCount }} pendiente{{ pendingCount !== 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageHeader from "@/components/shared/PageHeader.vue";
import { formatPeriodLabel } from "@/utils/payrollPeriod.js";

defineProps({
  mode: { type: String, required: true },
  selectedCompany: { type: String, default: null },
  companyOptions: { type: Array, required: true },
  currentCompanyData: { type: Object, default: null },
  currentPeriod: { type: String, default: "" },
  periodCount: { type: Number, default: 0 },
  pendingCount: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
});

defineEmits(['update:mode', 'update:selectedCompany', 'reload', 'company-change']);

function formatPeriod(period) {
  return formatPeriodLabel(period);
}
</script>

<style scoped>
.rk-payroll-header {
  position: relative;
  z-index: 1;
  margin-bottom: 20px;
}

.rk-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  margin: 0 12px;
  background: var(--rk-card, #fff);
  border: 1px solid var(--rk-border, rgba(0,0,0,.08));
  border-radius: 12px;
  flex-wrap: wrap;
}

.body--dark .rk-toolbar {
  background: #101318;
  border-color: rgba(255,255,255,.08);
}

.rk-toolbar-left {
  flex: 0 0 auto;
  min-width: 200px;
  max-width: 300px;
}

.rk-company-select {
  width: 100%;
}

.rk-company-select :deep(.q-field__control) {
  min-height: 36px;
  border-radius: 8px;
}

.rk-mode-tabs {
  flex: 0 0 auto;
}

.rk-mode-tabs :deep(.q-tab) {
  min-height: 36px;
  padding: 0 16px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: none;
}

.rk-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.rk-period-badge,
.rk-pending-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.rk-period-badge {
  background: rgba(33, 150, 243, 0.08);
  color: var(--q-primary);
  border: 1px solid rgba(33, 150, 243, 0.15);
}

.rk-pending-badge {
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.body--dark .rk-pending-badge {
  color: #fbbf24;
}

@media (max-width: 767px) {
  .rk-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin: 0 0;
    padding: 10px 12px;
  }

  .rk-toolbar-left {
    min-width: 0;
    max-width: none;
  }

  .rk-toolbar-right {
    margin-left: 0;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
