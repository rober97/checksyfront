<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
    class="rk-detail-dialog"
  >
    <div class="rk-detail-card">
      <!-- Header - Fixed -->
      <div class="rk-detail-header">
        <div class="rk-detail-header-content">
          <q-avatar 
            size="56px" 
            class="rk-detail-avatar" 
            :style="{ background: getAvatarColor(current?.employeeName) }"
          >
            {{ getInitials(current?.employeeName) }}
          </q-avatar>
          <div class="rk-detail-header-text">
            <h3 class="rk-detail-name">{{ current?.employeeName || 'Sin nombre' }}</h3>
            <p class="rk-detail-rut">{{ current?.employeeRut || 'Sin RUT' }}</p>
          </div>
        </div>
        <button class="rk-close-btn" @click="$emit('update:modelValue', false)">
          <q-icon name="close" />
        </button>
      </div>

      <!-- Content - Scrollable -->
      <div class="rk-detail-content-wrapper">
        <div v-if="current" class="rk-detail-content">
          <!-- Period and Status -->
          <div class="rk-detail-info-row">
            <div class="rk-detail-info-card">
              <div class="rk-detail-info-icon">
                <q-icon name="calendar_month" />
              </div>
              <div class="rk-detail-info-content">
                <span class="rk-detail-info-label">Período</span>
                <strong class="rk-detail-info-value">{{ formatPeriod(periodSelected) }}</strong>
              </div>
            </div>

            <div class="rk-detail-info-card">
              <div class="rk-detail-info-icon">
                <q-icon :name="getStatusIcon(current.status)" />
              </div>
              <div class="rk-detail-info-content">
                <span class="rk-detail-info-label">Estado</span>
                <strong class="rk-detail-info-value">{{ current.status }}</strong>
              </div>
            </div>
          </div>

          <!-- Days Section -->
          <div class="rk-detail-section">
            <h4 class="rk-detail-section-title">Asistencia y días</h4>
            <div class="rk-detail-days-row">
              <div class="rk-detail-day-card rk-day-expected">
                <div class="rk-detail-day-icon">
                  <q-icon name="event_available" />
                </div>
                <strong class="rk-detail-day-value">{{ current.daysExpected ?? 0 }}</strong>
                <span class="rk-detail-day-label">Días esperados</span>
              </div>

              <div class="rk-detail-day-card rk-day-paid">
                <div class="rk-detail-day-icon">
                  <q-icon name="check_circle" />
                </div>
                <strong class="rk-detail-day-value">{{ current.daysPaid ?? 0 }}</strong>
                <span class="rk-detail-day-label">Días pagados</span>
              </div>

              <div class="rk-detail-day-card rk-day-absent">
                <div class="rk-detail-day-icon">
                  <q-icon name="event_busy" />
                </div>
                <strong class="rk-detail-day-value">{{ current.daysAbsent ?? 0 }}</strong>
                <span class="rk-detail-day-label">Ausencias</span>
              </div>
            </div>
          </div>

          <!-- Financial Summary -->
          <div class="rk-detail-section">
            <h4 class="rk-detail-section-title">Resumen financiero</h4>
            <div class="rk-detail-financial">
              <div class="rk-financial-row">
                <div class="rk-financial-icon rk-icon-success">
                  <q-icon name="add_circle" />
                </div>
                <div class="rk-financial-content">
                  <strong class="rk-financial-label">Total haberes</strong>
                  <span class="rk-financial-desc">Remuneraciones y bonos</span>
                </div>
                <strong class="rk-financial-value rk-value-success">{{ formatMoney(current.totalEarn) }}</strong>
              </div>

              <div class="rk-financial-row">
                <div class="rk-financial-icon rk-icon-danger">
                  <q-icon name="remove_circle" />
                </div>
                <div class="rk-financial-content">
                  <strong class="rk-financial-label">Total descuentos</strong>
                  <span class="rk-financial-desc">Impuestos y otros</span>
                </div>
                <strong class="rk-financial-value rk-value-danger">{{ formatMoney(current.totalDeduct) }}</strong>
              </div>

              <div class="rk-financial-divider"></div>

              <div class="rk-financial-row rk-financial-total">
                <div class="rk-financial-icon rk-icon-primary">
                  <q-icon name="paid" />
                </div>
                <div class="rk-financial-content">
                  <strong class="rk-financial-label">Líquido a pagar</strong>
                  <span class="rk-financial-desc">Monto final</span>
                </div>
                <strong class="rk-financial-value rk-value-primary">{{ formatMoney(current.totalNet) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions - Fixed -->
      <div class="rk-detail-footer">
        <button 
          v-if="current?.status === 'DRAFT'" 
          class="rk-detail-btn rk-btn-primary" 
          @click="$emit('issue', current)"
        >
          <q-icon name="receipt_long" />
          <span>Emitir liquidación</span>
        </button>
        <button 
          v-if="current?.status === 'ISSUED'" 
          class="rk-detail-btn rk-btn-danger" 
          @click="$emit('open-pdf', current)"
        >
          <q-icon name="picture_as_pdf" />
          <span>Descargar PDF</span>
        </button>
        <button 
          v-if="current?.status === 'ISSUED'" 
          class="rk-detail-btn rk-btn-warning" 
          @click="$emit('void', current)"
        >
          <q-icon name="block" />
          <span>Anular</span>
        </button>
        <button class="rk-detail-btn" @click="$emit('update:modelValue', false)">
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  current: { type: Object, default: null },
  periodSelected: { type: String, default: '' },
});

defineEmits(['update:modelValue', 'issue', 'void', 'open-pdf']);

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#06b6d4', '#14b8a6', '#22d3ee', '#0891b2', '#0e7490'];
  const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function formatPeriod(period) {
  if (!period || !period.match(/^\d{4}-\d{2}$/)) return period;
  const [year, month] = period.split("-");
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function formatMoney(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function getStatusIcon(s) {
  const icons = { ISSUED: "check_circle", DRAFT: "edit_note", VOID: "block" };
  return icons[s] || "help";
}
</script>

<style scoped>
.rk-detail-dialog :deep(.q-dialog__backdrop) {
  backdrop-filter: blur(8px);
  background: rgba(10, 14, 20, 0.7);
}

.rk-detail-card {
  width: min(700px, 95vw);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(6, 182, 212, 0.15);
}

.body--dark .rk-detail-card {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(6, 182, 212, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.rk-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 1.5px solid rgba(6, 182, 212, 0.12);
  background: rgba(6, 182, 212, 0.04);
  flex-shrink: 0;
}

.body--dark .rk-detail-header {
  border-bottom-color: rgba(6, 182, 212, 0.2);
  background: rgba(6, 182, 212, 0.06);
}

.rk-detail-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rk-detail-avatar {
  color: #fff;
  font-weight: 800;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.rk-detail-name {
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 6px 0;
  color: rgba(15, 23, 42, 0.95);
}

.body--dark .rk-detail-name {
  color: rgba(255, 255, 255, 0.95);
}

.rk-detail-rut {
  font-size: 0.9rem;
  color: rgba(15, 23, 42, 0.5);
  margin: 0;
}

.body--dark .rk-detail-rut {
  color: rgba(255, 255, 255, 0.5);
}

.rk-close-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.15);
  border-radius: 11px;
  color: rgba(15, 23, 42, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
}

.body--dark .rk-close-btn {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.rk-close-btn:hover {
  background: rgba(6, 182, 212, 0.15);
  color: rgba(15, 23, 42, 0.95);
  transform: rotate(90deg);
}

.body--dark .rk-close-btn:hover {
  color: rgba(255, 255, 255, 0.95);
}

.rk-close-btn .q-icon {
  font-size: 20px;
}

/* Scrollable Content Wrapper */
.rk-detail-content-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.rk-detail-content-wrapper::-webkit-scrollbar {
  width: 8px;
}

.rk-detail-content-wrapper::-webkit-scrollbar-track {
  background: rgba(6, 182, 212, 0.05);
}

.rk-detail-content-wrapper::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.3);
  border-radius: 4px;
}

.rk-detail-content-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(6, 182, 212, 0.5);
}

.rk-detail-content {
  padding: 28px;
}

.rk-detail-info-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.rk-detail-info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: rgba(6, 182, 212, 0.04);
  border: 1px solid rgba(6, 182, 212, 0.12);
  border-radius: 12px;
}

.body--dark .rk-detail-info-card {
  background: rgba(6, 182, 212, 0.06);
  border-color: rgba(6, 182, 212, 0.15);
}

.rk-detail-info-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.1);
  border-radius: 10px;
  flex-shrink: 0;
}

.rk-detail-info-icon .q-icon {
  font-size: 22px;
  color: #22d3ee;
}

.rk-detail-info-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.5);
  margin-bottom: 4px;
}

.body--dark .rk-detail-info-label {
  color: rgba(255, 255, 255, 0.5);
}

.rk-detail-info-value {
  display: block;
  font-size: 1rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.95);
}

.body--dark .rk-detail-info-value {
  color: rgba(255, 255, 255, 0.95);
}

.rk-detail-section {
  margin-bottom: 24px;
}

.rk-detail-section:last-child {
  margin-bottom: 0;
}

.rk-detail-section-title {
  font-size: 1rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.95);
  margin: 0 0 14px 0;
}

.body--dark .rk-detail-section-title {
  color: rgba(255, 255, 255, 0.95);
}

.rk-detail-days-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.rk-detail-day-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px;
  border-radius: 14px;
  border: 1.5px solid;
  transition: all 0.3s ease;
}

.rk-detail-day-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
}

.rk-day-expected {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.rk-day-paid {
  background: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.2);
}

.rk-day-absent {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.2);
}

.rk-detail-day-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-bottom: 12px;
}

.rk-day-expected .rk-detail-day-icon {
  background: rgba(59, 130, 246, 0.12);
}

.rk-day-expected .rk-detail-day-icon .q-icon {
  font-size: 24px;
  color: #3b82f6;
}

.rk-day-paid .rk-detail-day-icon {
  background: rgba(34, 197, 94, 0.12);
}

.rk-day-paid .rk-detail-day-icon .q-icon {
  font-size: 24px;
  color: #22c55e;
}

.rk-day-absent .rk-detail-day-icon {
  background: rgba(239, 68, 68, 0.12);
}

.rk-day-absent .rk-detail-day-icon .q-icon {
  font-size: 24px;
  color: #ef4444;
}

.rk-detail-day-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.95);
  margin-bottom: 6px;
  line-height: 1;
}

.body--dark .rk-detail-day-value {
  color: rgba(255, 255, 255, 0.95);
}

.rk-detail-day-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.5);
  text-align: center;
}

.body--dark .rk-detail-day-label {
  color: rgba(255, 255, 255, 0.5);
}

.rk-detail-financial {
  background: rgba(6, 182, 212, 0.04);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 14px;
  overflow: hidden;
}

.body--dark .rk-detail-financial {
  background: rgba(6, 182, 212, 0.06);
  border-color: rgba(6, 182, 212, 0.15);
}

.rk-financial-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.08);
}

.body--dark .rk-financial-row {
  border-bottom-color: rgba(6, 182, 212, 0.12);
}

.rk-financial-row:last-child {
  border-bottom: none;
}

.rk-financial-total {
  background: rgba(6, 182, 212, 0.05);
}

.body--dark .rk-financial-total {
  background: rgba(6, 182, 212, 0.08);
}

.rk-financial-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  flex-shrink: 0;
}

.rk-icon-success {
  background: rgba(34, 197, 94, 0.12);
}

.rk-icon-success .q-icon {
  font-size: 22px;
  color: #22c55e;
}

.rk-icon-danger {
  background: rgba(239, 68, 68, 0.12);
}

.rk-icon-danger .q-icon {
  font-size: 22px;
  color: #ef4444;
}

.rk-icon-primary {
  background: rgba(6, 182, 212, 0.12);
}

.rk-icon-primary .q-icon {
  font-size: 22px;
  color: #22d3ee;
}

.rk-financial-content {
  flex: 1;
}

.rk-financial-label {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.95);
  margin-bottom: 4px;
}

.body--dark .rk-financial-label {
  color: rgba(255, 255, 255, 0.95);
}

.rk-financial-desc {
  display: block;
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.5);
}

.body--dark .rk-financial-desc {
  color: rgba(255, 255, 255, 0.5);
}

.rk-financial-value {
  font-size: 1.2rem;
  font-weight: 800;
  font-family: 'Space Mono', monospace;
}

.rk-value-success {
  color: #22c55e;
}

.rk-value-danger {
  color: #ef4444;
}

.rk-value-primary {
  font-size: 1.5rem;
  color: #22d3ee;
}

.rk-financial-divider {
  height: 1px;
  background: rgba(6, 182, 212, 0.2);
  margin: 0 20px;
}

.rk-detail-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px 28px;
  border-top: 1.5px solid rgba(6, 182, 212, 0.12);
  background: rgba(6, 182, 212, 0.04);
  flex-shrink: 0;
}

.body--dark .rk-detail-footer {
  border-top-color: rgba(6, 182, 212, 0.2);
  background: rgba(6, 182, 212, 0.06);
}

.rk-detail-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  background: rgba(6, 182, 212, 0.08);
  border: 1.5px solid rgba(6, 182, 212, 0.15);
  border-radius: 11px;
  color: rgba(15, 23, 42, 0.95);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.body--dark .rk-detail-btn {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.rk-detail-btn:hover {
  background: rgba(6, 182, 212, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
}

.rk-detail-btn .q-icon {
  font-size: 18px;
}

.rk-btn-primary {
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.rk-btn-primary:hover {
  box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4);
}

.rk-btn-danger {
  background: #ef4444;
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.rk-btn-danger:hover {
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.rk-btn-warning {
  background: #f59e0b;
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.rk-btn-warning:hover {
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

/* Responsive */
@media (max-width: 767px) {
  .rk-detail-card {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    border: none;
  }

  .rk-detail-header {
    padding: 18px 20px;
  }

  .rk-detail-header-content {
    gap: 12px;
  }

  .rk-detail-avatar {
    width: 48px;
    height: 48px;
    font-size: 1.1rem;
  }

  .rk-detail-name {
    font-size: 1.15rem;
  }

  .rk-detail-content {
    padding: 20px;
  }

  .rk-detail-info-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .rk-detail-days-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .rk-detail-footer {
    padding: 16px 20px;
    flex-direction: column;
  }

  .rk-detail-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 599px) {
  .rk-detail-info-card {
    padding: 14px 16px;
  }

  .rk-detail-day-card {
    padding: 16px;
  }

  .rk-detail-day-value {
    font-size: 1.6rem;
  }

  .rk-financial-row {
    padding: 16px 18px;
  }

  .rk-financial-value {
    font-size: 1.1rem;
  }

  .rk-value-primary {
    font-size: 1.3rem;
  }
}
</style>