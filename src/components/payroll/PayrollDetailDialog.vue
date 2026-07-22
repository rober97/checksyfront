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
            <strong class="text-positive">{{ payrollDays }} / 30</strong>
          </div>
          <div class="rk-info-item">
            <span class="rk-info-label">Ausencias</span>
            <strong :class="confirmedDays.length ? 'text-negative' : ''">{{ confirmedDays.length }}</strong>
          </div>
        </div>

        <!-- Absence review: un día sin marca NO descuenta hasta que se confirma -->
        <div v-if="proposedDays.length" class="rk-absences">
          <div class="rk-absences-head">
            <q-icon name="event_busy" size="18px" :color="selectedDays.length ? 'negative' : 'warning'" />
            <span>
              {{ proposedDays.length }} día{{ proposedDays.length !== 1 ? 's' : '' }} hábil{{ proposedDays.length !== 1 ? 'es' : '' }}
              sin marca ni permiso<template v-if="dailyValue > 0"> · {{ formatMoney(dailyValue) }} por día</template>
            </span>
          </div>

          <div class="rk-absences-list">
            <label
              v-for="day in proposedDays"
              :key="day"
              class="rk-absence-row"
              :class="{ 'rk-absence-row--on': selectedDays.includes(day), 'rk-absence-row--locked': !editable }"
            >
              <q-checkbox
                :model-value="selectedDays.includes(day)"
                :disable="!editable"
                dense
                color="negative"
                @update:model-value="toggleDay(day)"
              />
              <span class="rk-absence-day">{{ formatDayKey(day) }}</span>
              <span class="rk-absence-tag">
                {{ selectedDays.includes(day) ? 'Se descuenta' : 'Se paga' }}
              </span>
            </label>
          </div>

          <div class="rk-absences-hint">
            <q-icon name="info" size="13px" />
            <span v-if="editable">
              Marca solo los días que realmente fueron inasistencia. Los que dejes sin marcar
              se pagan igual: un olvido de marcaje no debería descontar sueldo. Si el trabajador
              sí asistió, registra la marca o la solicitud y regenera el borrador.
            </span>
            <span v-else>
              La liquidación ya no es un borrador: las inasistencias quedaron congeladas.
            </span>
          </div>

          <div v-if="editable && hasChanges" class="rk-absences-actions">
            <q-btn flat dense no-caps label="Descartar" @click="resetSelection" />
            <q-btn
              unelevated
              dense
              no-caps
              color="primary"
              icon="save"
              :loading="saving"
              :label="selectedDays.length ? `Descontar ${selectedDays.length} día(s)` : 'Pagar mes completo'"
              @click="saveAbsences"
            />
          </div>
        </div>

        <!-- Financial summary -->
        <div class="rk-financial">
          <div class="rk-fin-row">
            <q-icon name="add_circle" color="positive" size="20px" />
            <span>Total haberes</span>
            <strong class="text-positive q-ml-auto">{{ formatMoney(current.totalEarn) }}</strong>
          </div>
          <div class="rk-fin-row">
            <q-icon name="remove_circle" color="negative" size="20px" />
            <span>Total descuentos</span>
            <strong class="text-negative q-ml-auto">{{ formatMoney(current.totalDeduct) }}</strong>
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
                  :color="line.type === 'DESCUENTO' ? 'negative' : 'positive'"
                  :label="line.type === 'DESCUENTO' ? 'Desc.' : 'Haber'"
                  outline
                  dense
                  class="q-mr-sm"
                />
              </q-item-section>
              <q-item-section side>
                <strong :class="line.type === 'DESCUENTO' ? 'text-negative' : 'text-positive'">
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
        <!-- Enviar al trabajador es irreversible: se decide antes de emitir. -->
        <q-checkbox
          v-if="current?.status === 'DRAFT'"
          :model-value="sendEmail"
          dense
          class="rk-issue-note"
          @update:model-value="$emit('update:sendEmail', $event)"
        >
          <span class="rk-issue-note__text">
            <q-icon :name="sendEmail ? 'mail' : 'mail_lock'" size="14px" />
            {{ sendEmail ? 'Enviar por correo al trabajador' : 'No enviar por correo (solo emitir)' }}
          </span>
          <q-tooltip>
            Si no lo envías ahora, la liquidación queda marcada como "No enviada"
            y puedes mandarla después desde la lista.
          </q-tooltip>
        </q-checkbox>
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
          color="primary"
          icon="picture_as_pdf"
          label="Ver PDF"
          @click="$emit('open-pdf', current)"
        />
        <q-btn
          v-if="current?.status === 'ISSUED'"
          flat
          color="warning"
          icon="block"
          label="Anular"
          @click="$emit('void', current)"
        />
        <q-btn
          v-if="current && current.status !== 'ISSUED'"
          flat
          color="negative"
          icon="delete"
          label="Eliminar"
          @click="$emit('delete', current)"
        />
        <q-btn flat label="Cerrar" @click="$emit('update:modelValue', false)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { formatPeriodLabel } from "@/utils/payrollPeriod.js";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  current: { type: Object, default: null },
  periodSelected: { type: String, default: "" },
  saving: { type: Boolean, default: false },
  sendEmail: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:modelValue",
  "update:sendEmail",
  "issue",
  "void",
  "delete",
  "open-pdf",
  "save-absences",
]);

// Días hábiles sin marca válida ni permiso: son CANDIDATOS a inasistencia, no
// descuentos. Fuente de verdad: snapshot.proposedAbsentDayKeys. Fallback para
// liquidaciones anteriores al cambio: absentDayKeys, o expectedDayKeys \ paidDayKeys.
const proposedDays = computed(() => {
  const snap = props.current?.snapshot || {};
  if (Array.isArray(snap.proposedAbsentDayKeys)) return [...snap.proposedAbsentDayKeys].sort();
  if (Array.isArray(snap.absentDayKeys)) return [...snap.absentDayKeys].sort();
  const expected = Array.isArray(snap.expectedDayKeys) ? snap.expectedDayKeys : [];
  const paid = new Set(Array.isArray(snap.paidDayKeys) ? snap.paidDayKeys : []);
  return expected.filter((day) => !paid.has(day)).sort();
});

// Las que efectivamente descuentan (ya confirmadas y guardadas).
const confirmedDays = computed(() => {
  const snap = props.current?.snapshot || {};
  return Array.isArray(snap.absentDayKeys) ? [...snap.absentDayKeys].sort() : [];
});

const payrollDays = computed(() => Number(props.current?.daysPayroll ?? 30));
const editable = computed(() => props.current?.status === "DRAFT");

// Selección local editable; se re-sincroniza cada vez que cambia la liquidación
// mostrada o cuando el backend devuelve el borrador recalculado.
const selectedDays = ref([]);

function resetSelection() {
  selectedDays.value = [...confirmedDays.value];
}

watch(
  () => [props.current?.id || props.current?._id, confirmedDays.value.join(",")],
  resetSelection,
  { immediate: true }
);

const hasChanges = computed(
  () => [...selectedDays.value].sort().join(",") !== confirmedDays.value.join(",")
);

function toggleDay(day) {
  if (!editable.value) return;
  const index = selectedDays.value.indexOf(day);
  if (index === -1) selectedDays.value.push(day);
  else selectedDays.value.splice(index, 1);
}

function saveAbsences() {
  emit("save-absences", {
    payslip: props.current,
    days: [...selectedDays.value].sort(),
  });
}

// Valor diario del descuento = sueldo base / 30 (mensualización).
// Se deriva de la línea de sueldo base ya prorrateada: amount = base * payrollDays/30,
// por lo tanto base/30 = amount / payrollDays.
const dailyValue = computed(() => {
  const snap = props.current?.snapshot || {};
  const payrollDays = Number(snap.payrollDays);
  const baseLine = (props.current?.lines || []).find(
    (l) => l.code === "sueldo_base" || l?.meta?.valuePath === "baseSalary"
  );
  const baseAmount = Number(baseLine?.amount || 0);
  if (!baseAmount || !payrollDays) return 0;
  return Math.round(baseAmount / payrollDays);
});

function formatDayKey(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  if (!y || !m || !d) return key;
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ["#0CA9C4", "#0893AA", "#33BECB", "#0893AA", "#067C90"];
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
  const map = { ISSUED: "positive", DRAFT: "warning", VOID: "grey" };
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

/* Absent days */
.rk-absences {
  border: 1px solid var(--color-warning-soft, rgba(245,158,11,.3));
  background: var(--color-warning-soft, rgba(245,158,11,.08));
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 20px;
}

.rk-absences-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-warning, #b45309);
  margin-bottom: 10px;
}

.rk-absences-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rk-absence-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,.08);
  background: rgba(0,0,0,.03);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}

.rk-absence-row--locked {
  cursor: default;
  opacity: .8;
}

.rk-absence-row--on {
  border-color: rgba(220,38,38,.35);
  background: rgba(220,38,38,.07);
}

.body--dark .rk-absence-row {
  background: rgba(255,255,255,.05);
  border-color: rgba(255,255,255,.10);
}

.body--dark .rk-absence-row--on {
  background: rgba(248,113,113,.12);
  border-color: rgba(248,113,113,.35);
}

.rk-absence-day {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.rk-absence-tag {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .02em;
  opacity: .65;
}

.rk-absence-row--on .rk-absence-tag {
  color: var(--q-negative, #c62828);
  opacity: 1;
}

.rk-absences-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.rk-absences-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  font-size: 0.75rem;
  line-height: 1.35;
  opacity: 0.75;
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
.rk-issue-note {
  margin-right: auto;
}

.rk-issue-note__text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  opacity: .75;
}

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
