<template>
  <q-page class="rk-payroll-page">
    <!-- Page Header -->
    <PayrollPageHeader
      v-model:mode="mode"
      :current-period="mode === 'detail' ? periodSelected : periodInput"
      :period-count="periodRows.length"
      :pending-count="pendingCount"
      :loading="store.loading"
      @reload="reload"
    />

    <!-- Main Content with Transition -->
    <div class="rk-main-content">
      <transition
        appear
        enter-active-class="rk-fade-in"
        leave-active-class="rk-fade-out"
        mode="out-in"
      >
        <!-- Periods View -->
        <PayrollPeriodView
          v-if="mode === 'periods'"
          key="periods"
          v-model:period-input="periodInput"
          :period-rows="periodRows"
          :loading="store.loading"
          @generate="generatePeriod"
          @open-period="openPeriod"
          @delete-period="deletePeriodRow"
        />

        <!-- Employee Detail View -->
        <PayrollEmployeeView
          v-else
          key="detail"
          v-model:period-selected="periodSelected"
          v-model:query="q"
          v-model:status="status"
          v-model:selected="selected"
          :payslips="payslips"
          :total-liquido="totalLiquido"
          :loading="store.loading"
          :issuing-many="issuingMany"
          @load="loadPayslips"
          @back-to-periods="goToPeriods"
          @issue-selected="issueSelected"
          @open-detail="openDetail"
          @issue-one="issueOne"
          @void-one="voidOne"
          @delete-one="deletePayslipRow"
          @open-pdf="openPdf"
        />
      </transition>
    </div>

    <!-- Detail Dialog -->
    <PayrollDetailDialog
      v-model="dialogDetail"
      :current="current"
      :period-selected="periodSelected"
      @issue="issueOne"
      @void="voidOne"
      @delete="deletePayslipRow"
      @open-pdf="openPdf"
    />

    <!-- PDF Viewer Dialog -->
    <PayrollPdfViewer
      v-model="dialogPdf"
      :pdf-url="pdfUrl"
      :pdf-title="pdfTitle"
      :loading="loadingPdf"
      @download="downloadPdf"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { usePayrollStore } from "@/stores/payrollStore.js";
import {
  lastMonthPeriod,
  isValidPeriod,
  normalizePeriodValue,
} from "@/utils/payrollPeriod.js";
import { useAuthStore } from "@/stores/authStore";

import PayrollPageHeader from "@/components/payroll/PayrollPageHeader.vue";
import PayrollPeriodView from "@/components/payroll/PayrollPeriodView.vue";
import PayrollEmployeeView from "@/components/payroll/PayrollEmployeeView.vue";
import PayrollDetailDialog from "@/components/payroll/PayrollDetailDialog.vue";
import PayrollPdfViewer from "@/components/payroll/PayrollPdfViewer.vue";

const $q = useQuasar();
const store = usePayrollStore();
const authStore = useAuthStore();

// State
const mode = ref("periods");
const periodInput = ref(lastMonthPeriod());
const periodSelected = ref(lastMonthPeriod());
const q = ref("");
const status = ref(null);
const selected = ref([]);
const issuingMany = ref(false);
const dialogDetail = ref(false);
const current = ref(null);
const dialogPdf = ref(false);
const loadingPdf = ref(false);
const pdfUrl = ref("");
const pdfTitle = ref("Liquidación");

// Computed
const periodRows = computed(() => store.periods || []);
const payslips = computed(() => store.payslips || []);
const pendingCount = computed(() => {
  return periodRows.value.reduce((sum, row) => sum + (Number(row.draft) || 0), 0);
});

const totalLiquido = computed(() => {
  return payslips.value
    .filter(p => p.status === 'ISSUED')
    .reduce((sum, p) => sum + (Number(p.totalNet) || 0), 0);
});

// Utility Functions
function companyId() {
  const u = authStore.user;
  if (!u) return null;
  return u.companyId || u.company?._id || u.company || null;
}

function normalizePeriod(period) {
  return normalizePeriodValue(period || periodInput.value || periodSelected.value);
}

function resetDetailState() {
  selected.value = [];
  current.value = null;
  dialogDetail.value = false;
}

function resetPdfState() {
  dialogPdf.value = false;
  loadingPdf.value = false;
  pdfUrl.value = "";
}

function syncCurrentPayslip() {
  if (!current.value) return;
  const currentId = current.value.id || current.value._id;
  if (!currentId) return;

  const updated = payslips.value.find((row) => row.id === currentId || row._id === currentId);
  if (updated) current.value = updated;
  else dialogDetail.value = false;
}

function findPayslipById(payslipId) {
  return payslips.value.find((row) => row.id === payslipId || row._id === payslipId) || null;
}

// Initialization
async function initializeComponent() {
  if (!companyId()) {
    $q.notify({
      type: "warning",
      message: "No hay empresa activa",
      caption: "Selecciona una empresa desde el menú superior",
      icon: "warning",
      position: "top"
    });
    return;
  }
  await reload();
}

onMounted(initializeComponent);

// Main Actions
async function reload() {
  const cid = companyId();
  if (!cid) {
    $q.notify({ type: "warning", message: "Selecciona una empresa primero", icon: "business", position: "top" });
    return;
  }
  await store.fetchPeriods({ companyId: cid });
  if (mode.value === "detail" && isValidPeriod(periodSelected.value)) {
    await loadPayslips({ silentInvalid: true });
  }
}

async function generatePeriod() {
  const cid = companyId();
  if (!cid) {
    return $q.notify({ type: "negative", message: "No se encontró empresa activa", icon: "error", position: "top" });
  }
  periodInput.value = normalizePeriod(periodInput.value);
  if (!isValidPeriod(periodInput.value)) {
    return $q.notify({ type: "warning", message: "Período inválido (YYYY-MM)", icon: "warning", position: "top" });
  }

  try {
    const res = await store.generatePeriod({ companyId: cid, period: periodInput.value });
    periodSelected.value = periodInput.value;
    q.value = "";
    status.value = null;

    const failed = Array.isArray(res?.failed) ? res.failed : [];
    if (failed.length > 0) {
      $q.notify({
        type: "warning",
        message: `${res?.created ?? 0} borrador(es) generado(s), ${failed.length} con configuración incompleta`,
        icon: "warning",
        position: "top",
        timeout: 4000,
      });
      showFailedDialog(failed);
    } else {
      $q.notify({
        type: "positive",
        message: `Período generado`,
        caption: `Creados: ${res?.created ?? 0} · Actualizados: ${res?.updated ?? 0}`,
        icon: "check_circle",
        position: "top"
      });
    }

    await store.fetchPeriods({ companyId: cid });
    openPeriod(periodInput.value);
  } catch (e) {
    $q.notify({ type: "negative", message: store.error || "Error al generar período", icon: "error", position: "top" });
  }
}

function openPeriod(p) {
  const nextPeriod = normalizePeriod(p);
  periodInput.value = nextPeriod;
  periodSelected.value = nextPeriod;
  resetDetailState();
  resetPdfState();
  mode.value = "detail";
}

function goToPeriods() {
  const nextPeriod = normalizePeriod(periodSelected.value || periodInput.value);
  if (nextPeriod) periodInput.value = nextPeriod;
  resetDetailState();
  resetPdfState();
  mode.value = "periods";
}

async function loadPayslips({ silentInvalid = false } = {}) {
  const cid = companyId();
  if (!cid) return;
  const normalizedPeriod = normalizePeriod(periodSelected.value);
  if (normalizedPeriod !== periodSelected.value) {
    periodSelected.value = normalizedPeriod;
    return;
  }
  if (!isValidPeriod(normalizedPeriod)) {
    if (silentInvalid) return;
    return $q.notify({ type: "warning", message: "Período inválido (YYYY-MM)", icon: "warning", position: "top" });
  }

  try {
    await store.fetchPayslips({
      companyId: cid,
      period: normalizedPeriod,
      q: q.value || undefined,
      status: status.value || undefined
    });
    selected.value = [];
    syncCurrentPayslip();
  } catch (e) {
    $q.notify({ type: "negative", message: store.error || "Error al cargar liquidaciones", icon: "error", position: "top" });
  }
}

watch([q, status], () => {
  if (mode.value === "detail") loadPayslips();
});

watch(periodInput, (value) => {
  const normalized = normalizePeriod(value);
  if (normalized !== value) periodInput.value = normalized;
});

watch([mode, periodSelected], async ([nextMode, nextPeriod], [prevMode, prevPeriod]) => {
  const normalized = normalizePeriod(nextPeriod);
  if (normalized !== nextPeriod) {
    periodSelected.value = normalized;
    return;
  }

  if (nextMode !== "detail") {
    selected.value = [];
    return;
  }

  if (!isValidPeriod(normalized)) return;
  if (nextMode !== prevMode || normalized !== prevPeriod) {
    await loadPayslips({ silentInvalid: true });
  }
});

function openDetail(row) {
  current.value = row;
  dialogDetail.value = true;
}

async function issueOne(row) {
  try {
    const payslipId = row.id || row._id;
    await store.issuePayslip({ payslipId });
    $q.notify({
      type: "positive",
      message: "Liquidación emitida",
      caption: "Abriendo PDF...",
      icon: "check_circle",
      position: "top",
      timeout: 2000,
    });
    dialogDetail.value = false;
    await reload();
    const issuedRow = findPayslipById(payslipId);
    if (issuedRow) await openPdf(issuedRow);
  } catch {
    $q.notify({ type: "negative", message: store.error || "Error al emitir", icon: "error", position: "top" });
  }
}

async function voidOne(row) {
  try {
    const reason = await promptReason();
    if (!reason) return;
    await store.voidPayslip({ payslipId: row.id || row._id, reason });
    $q.notify({ type: "warning", message: "Liquidación anulada", caption: `Motivo: ${reason}`, icon: "block", position: "top" });
    dialogDetail.value = false;
    await reload();
  } catch {
    $q.notify({ type: "negative", message: store.error || "Error al anular", icon: "error", position: "top" });
  }
}

async function deletePayslipRow(row) {
  if (!row) return;
  const employeeName = row.employeeName || "este empleado";
  const confirmed = await confirmDialog({
    title: "Eliminar liquidación",
    message: `Se eliminará la liquidación de ${employeeName}. Esta acción no se puede deshacer.`,
    okLabel: "Eliminar",
    okColor: "negative",
  });
  if (!confirmed) return;

  try {
    await store.deletePayslip({ payslipId: row.id || row._id });
    $q.notify({
      type: "positive",
      message: "Liquidación eliminada",
      icon: "delete",
      position: "top",
    });
    dialogDetail.value = false;
    await reload();
  } catch {
    $q.notify({ type: "negative", message: store.error || "Error al eliminar", icon: "error", position: "top" });
  }
}

async function deletePeriodRow(period) {
  const cid = companyId();
  if (!cid || !period) return;

  const confirmed = await confirmDialog({
    title: "Eliminar período",
    message: `Se eliminarán todos los borradores y anulaciones del período ${period}. Las liquidaciones emitidas no se tocan.`,
    okLabel: "Eliminar",
    okColor: "negative",
  });
  if (!confirmed) return;

  try {
    const res = await store.deletePeriod({ companyId: cid, period });
    $q.notify({
      type: "positive",
      message: `Período ${period} eliminado`,
      caption: `Liquidaciones eliminadas: ${res?.deleted ?? 0}`,
      icon: "delete",
      position: "top",
    });
    if (periodSelected.value === period) {
      goToPeriods();
    }
    await reload();
  } catch {
    $q.notify({ type: "negative", message: store.error || "Error al eliminar período", icon: "error", position: "top" });
  }
}

async function issueSelected() {
  if (selected.value.length === 0) return;
  const draftCount = selected.value.filter(r => r.status === "DRAFT").length;
  if (draftCount === 0) {
    return $q.notify({ type: "warning", message: "No hay borradores seleccionados", icon: "warning", position: "top" });
  }

  $q.dialog({
    title: "Confirmar emisión masiva",
    message: `Se emitirán ${draftCount} liquidación(es). ¿Continuar?`,
    cancel: { label: "Cancelar", flat: true },
    ok: { label: "Emitir", color: "positive", unelevated: true },
    persistent: true
  }).onOk(async () => {
    issuingMany.value = true;
    try {
      let emitted = 0;
      let lastIssuedId = "";
      for (const row of selected.value) {
        if (row.status !== "DRAFT") continue;
        lastIssuedId = row.id || row._id;
        await store.issuePayslip({ payslipId: lastIssuedId });
        emitted++;
      }
      $q.notify({
        type: "positive",
        message: `${emitted} liquidación(es) emitida(s)`,
        caption: emitted === 1 ? "Abriendo PDF..." : "Los PDFs están disponibles en cada fila",
        icon: "check_circle",
        position: "top"
      });
      selected.value = [];
      await reload();
      if (emitted === 1 && lastIssuedId) {
        const issuedRow = findPayslipById(lastIssuedId);
        if (issuedRow) await openPdf(issuedRow);
      }
    } catch {
      $q.notify({ type: "negative", message: store.error || "Error en emisión masiva", icon: "error", position: "top" });
    } finally {
      issuingMany.value = false;
    }
  });
}

async function openPdf(row) {
  loadingPdf.value = true;
  pdfUrl.value = "";
  pdfTitle.value = `Liquidación - ${row.employeeName || "Sin nombre"}`;
  dialogPdf.value = true;

  try {
    const url = await store.getPdfUrl({ payslipId: row.id || row._id });
    pdfUrl.value = url;
  } catch {
    $q.notify({ type: "negative", message: store.error || "No se pudo cargar PDF", icon: "error", position: "top" });
    dialogPdf.value = false;
  } finally {
    loadingPdf.value = false;
  }
}

function downloadPdf() {
  if (!pdfUrl.value) return;
  const a = document.createElement("a");
  a.href = pdfUrl.value;
  a.download = pdfTitle.value.replace(/\s+/g, "_") + ".pdf";
  a.target = "_blank";
  a.click();
}

function promptReason() {
  return new Promise((resolve) => {
    $q.dialog({
      title: "Anular liquidación",
      message: "Indica el motivo de anulación:",
      prompt: { model: "", type: "text", placeholder: "Motivo..." },
      cancel: { label: "Cancelar", flat: true },
      ok: { label: "Anular", color: "negative", unelevated: true },
      persistent: true,
    }).onOk(resolve).onCancel(() => resolve(""));
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Traduce el mensaje técnico del cálculo a una acción concreta para RR.HH.
function humanizePayrollReason(message = "") {
  const m = String(message).toLowerCase();
  if (m.includes("afpentityid")) return "Falta asignar la AFP en la ficha del empleado.";
  if (m.includes("healthentityid")) return "Falta asignar la entidad de salud (Fonasa/Isapre) en la ficha.";
  if (m.includes("isapreuf")) return "El empleado es Isapre pero no tiene el plan en UF.";
  if (m.includes("contracttype")) return "Falta el tipo de contrato en la ficha del empleado.";
  if (m.includes("afp_rate")) return "Falta la tasa de AFP del período en Config Nómina.";
  if (m.includes("fonasa_rate")) return "Falta la tasa de salud del período en Config Nómina.";
  if (m.includes("cesantia_rate")) return "Falta la tasa de cesantía para su tipo de contrato en Config Nómina.";
  if (m.includes("uf")) return "Falta el indicador UF del período en Config Nómina.";
  if (m.includes("utm")) return "Falta el indicador UTM del período en Config Nómina.";
  return message || "Configuración incompleta.";
}

function showFailedDialog(failed) {
  const rows = failed
    .map((f) => {
      const name = escapeHtml(f.employeeName || "Empleado sin nombre");
      const rut = f.employeeRut ? ` <span style="opacity:.6">(${escapeHtml(f.employeeRut)})</span>` : "";
      const reason = escapeHtml(humanizePayrollReason(f.message));
      return `<li style="margin-bottom:8px">
        <strong>${name}</strong>${rut}<br/>
        <span style="font-size:.85em;opacity:.85">${reason}</span>
      </li>`;
    })
    .join("");

  $q.dialog({
    title: "Empleados con configuración incompleta",
    message: `<p style="margin:0 0 10px">No se generó su liquidación. Corrige su ficha o Config Nómina y vuelve a generar:</p>
      <ul style="margin:0;padding-left:18px">${rows}</ul>`,
    html: true,
    ok: { label: "Entendido", color: "primary", unelevated: true },
  });
}

function confirmDialog({ title, message, okLabel = "Confirmar", okColor = "primary" }) {
  return new Promise((resolve) => {
    $q.dialog({
      title,
      message,
      cancel: { label: "Cancelar", flat: true },
      ok: { label: okLabel, color: okColor, unelevated: true },
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false));
  });
}
</script>

<style scoped>
.rk-payroll-page {
  position: relative;
  min-height: 100vh;
  padding: 0 12px 24px;
}

.rk-main-content {
  padding: 0 12px;
}

/* Transitions */
.rk-fade-in {
  animation: fadeIn 0.35s ease;
}

.rk-fade-out {
  animation: fadeOut 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@media (max-width: 767px) {
  .rk-payroll-page {
    padding: 0 4px 16px;
  }

  .rk-main-content {
    padding: 0 4px;
  }
}
</style>
