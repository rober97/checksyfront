<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="rk-detail-card">
      <!-- Header -->
      <q-card-section class="rk-detail-header">
        <div class="rk-header-row">
          <q-avatar
            size="48px"
            class="rk-avatar"
            :style="{ background: getAvatarColor(current?.employeeName) }"
          >
            {{ getInitials(current?.employeeName) }}
          </q-avatar>
          <div class="rk-header-info">
            <div class="rk-name">{{ current?.employeeName || "Sin nombre" }}</div>
            <div class="rk-meta">{{ current?.employeeRut || "Sin RUT" }}</div>
            <div v-if="current?.employeeEmail" class="rk-meta">{{ current.employeeEmail }}</div>
          </div>
          <q-badge
            v-if="current"
            :color="statusColor(current.status)"
            :label="statusLabel(current.status)"
            outline
            class="rk-status"
          />
          <q-space />
          <q-btn flat round dense icon="close" @click="$emit('update:modelValue', false)" />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Content -->
      <q-card-section v-if="current" class="rk-detail-body scroll">
        <!-- Period + info row -->
        <div class="rk-info-grid">
          <div class="rk-info-item">
            <span class="rk-info-label">Período</span>
            <strong>{{ formatPeriod(current.period || periodSelected) }}</strong>
          </div>
          <div class="rk-info-item">
            <span class="rk-info-label">Días esperados</span>
            <strong>{{ current.daysExpected ?? 0 }}</strong>
          </div>
          <div class="rk-info-item">
            <span class="rk-info-label">Días pagados</span>
            <strong class="text-green">{{ current.daysPaid ?? 0 }}</strong>
          </div>
          <div class="rk-info-item">
            <span class="rk-info-label">Ausencias</span>
            <strong class="text-red">{{ current.daysAbsent ?? 0 }}</strong>
          </div>
        </div>

        <!-- Financial summary -->
        <div class="rk-financial">
          <div class="rk-fin-row">
            <q-icon name="add_circle" color="green" size="20px" />
            <span>Total haberes</span>
            <strong class="text-green q-ml-auto">{{ formatMoney(current.totalEarn) }}</strong>
          </div>
          <div class="rk-fin-row">
            <q-icon name="remove_circle" color="red" size="20px" />
            <span>Total descuentos</span>
            <strong class="text-red q-ml-auto">{{ formatMoney(current.totalDeduct) }}</strong>
          </div>
          <q-separator />
          <div class="rk-fin-row rk-fin-total">
            <q-icon name="paid" color="primary" size="22px" />
            <strong>Líquido a pagar</strong>
            <strong class="rk-net q-ml-auto">{{ formatMoney(current.totalNet) }}</strong>
          </div>
        </div>

        <!-- Lines -->
        <div v-if="current.lines?.length" class="rk-lines">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Conceptos</div>
          <q-list dense separator>
            <q-item v-for="line in current.lines" :key="line.id || `${line.code}-${line.name}`">
              <q-item-section>
                <q-item-label>{{ line.name }}</q-item-label>
                <q-item-label v-if="line.detail || line.category" caption>
                  {{ line.detail || line.category }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  :color="line.type === 'DESCUENTO' ? 'red' : 'green'"
                  :label="line.type === 'DESCUENTO' ? 'Desc.' : 'Haber'"
                  outline
                  dense
                  class="q-mr-sm"
                />
              </q-item-section>
              <q-item-section side>
                <strong :class="line.type === 'DESCUENTO' ? 'text-red' : 'text-green'">
                  {{ formatMoney(line.amount) }}
                </strong>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <!-- Footer actions -->
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          v-if="current?.status === 'DRAFT'"
          unelevated
          color="primary"
          icon="receipt_long"
          label="Emitir y ver PDF"
          @click="$emit('issue', current)"
        />
        <q-btn
          v-if="current?.status === 'ISSUED'"
          unelevated
          color="red-6"
          icon="picture_as_pdf"
          label="Ver PDF"
          @click="$emit('open-pdf', current)"
        />
        <q-btn
          v-if="current?.status === 'ISSUED'"
          flat
          color="orange"
          icon="block"
          label="Anular"
          @click="$emit('void', current)"
        />
        <q-btn flat label="Cerrar" @click="$emit('update:modelValue', false)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { formatPeriodLabel } from "@/utils/payrollPeriod.js";

defineProps({
  modelValue: { type: Boolean, required: true },
  current: { type: Object, default: null },
  periodSelected: { type: String, default: "" },
});

defineEmits(["update:modelValue", "issue", "void", "open-pdf"]);

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ["#06b6d4", "#14b8a6", "#22d3ee", "#0891b2", "#0e7490"];
  const hash = (name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function formatPeriod(period) {
  return formatPeriodLabel(period);
}

function formatMoney(value) {
  const normalized = Number(value || 0);
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(normalized);
}

function statusColor(s) {
  const map = { ISSUED: "green", DRAFT: "orange", VOID: "grey" };
  return map[s] || "grey";
}

function statusLabel(s) {
  const map = { ISSUED: "Emitida", DRAFT: "Borrador", VOID: "Anulada" };
  return map[s] || s || "—";
}
</script>

<style scoped>
.rk-detail-card {
  width: min(720px, 95vw);
  max-height: 90vh;
  border-radius: 16px;
}

.rk-detail-header {
  padding: 20px 24px;
}

.rk-header-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rk-avatar {
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.rk-name {
  font-size: 1.15rem;
  font-weight: 800;
}

.rk-meta {
  font-size: 0.82rem;
  opacity: 0.6;
}

.rk-status {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.rk-detail-body {
  max-height: 55vh;
  padding: 20px 24px;
}

/* Info grid */
.rk-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.rk-info-item {
  padding: 10px 12px;
  background: rgba(0,0,0,.03);
  border-radius: 8px;
  text-align: center;
}

.body--dark .rk-info-item {
  background: rgba(255,255,255,.05);
}

.rk-info-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  opacity: 0.55;
  margin-bottom: 4px;
}

.rk-info-item strong {
  font-size: 1.1rem;
}

/* Financial */
.rk-financial {
  background: rgba(0,0,0,.02);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 10px;
  padding: 4px 0;
  margin-bottom: 20px;
}

.body--dark .rk-financial {
  background: rgba(255,255,255,.03);
  border-color: rgba(255,255,255,.06);
}

.rk-fin-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-size: 0.9rem;
}

.rk-fin-total {
  background: rgba(0,0,0,.02);
}

.body--dark .rk-fin-total {
  background: rgba(255,255,255,.04);
}

.rk-net {
  font-size: 1.3rem;
  color: var(--q-primary);
  font-family: 'Space Mono', monospace;
}

/* Lines */
.rk-lines {
  margin-top: 8px;
}

/* Actions */
.q-card-actions .q-btn {
  text-transform: none;
  font-weight: 700;
  border-radius: 8px;
}

@media (max-width: 599px) {
  .rk-detail-card {
    width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .rk-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .rk-header-row {
    flex-wrap: wrap;
  }
}
</style>
