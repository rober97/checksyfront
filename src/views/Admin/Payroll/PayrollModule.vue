<template>
  <q-page class="rk-payroll-page">
    <!-- Background Effects -->
    <div class="rk-page-bg">
      <div class="rk-grid-pattern"></div>
      <div class="rk-glow-orb rk-orb-1"></div>
      <div class="rk-glow-orb rk-orb-2"></div>
    </div>

    <!-- Page Header -->
    <PayrollPageHeader
      v-model:mode="mode"
      v-model:selectedCompany="selectedCompany"
      :company-options="companyOptions"
      :current-company-data="currentCompanyData"
      :period-count="periodRows.length"
      :pending-count="countBy('DRAFT')"
      :loading="store.loading"
      @reload="reload"
      @company-change="onCompanyChange"
    />

    <!-- Main Content with Transition -->
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
        @issue-selected="issueSelected"
        @open-detail="openDetail"
        @issue-one="issueOne"
        @void-one="voidOne"
        @open-pdf="openPdf"
      />
    </transition>

    <!-- Detail Dialog -->
    <PayrollDetailDialog
      v-model="dialogDetail"
      :current="current"
      :period-selected="periodSelected"
      @issue="issueOne"
      @void="voidOne"
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
import { lastMonthPeriod, isValidPeriod } from "@/utils/payrollPeriod.js";
import { useUserStore } from "@/stores/userStore";
import { useCompaniesStore } from "@/stores/companies";

import PayrollPageHeader from "@/components/payroll/PayrollPageHeader.vue";
import PayrollPeriodView from "@/components/payroll/PayrollPeriodView.vue";
import PayrollEmployeeView from "@/components/payroll/PayrollEmployeeView.vue";
import PayrollDetailDialog from "@/components/payroll/PayrollDetailDialog.vue";
import PayrollPdfViewer from "@/components/payroll/PayrollPdfViewer.vue";

const $q = useQuasar();
const store = usePayrollStore();
const userStore = useUserStore();
const companiesStore = useCompaniesStore();

// State
const mode = ref("periods");
const selectedCompany = ref(null);
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
const companyOptions = computed(() => {
  const companies = companiesStore.items || companiesStore.empresas || companiesStore.list || [];
  return companies.filter(c => c.status === 'active' || c.status === 'Active' || !c.status);
});

const currentCompanyData = computed(() => {
  if (!selectedCompany.value) return null;
  return companyOptions.value.find(c => c._id === selectedCompany.value) || null;
});

const periodRows = computed(() => store.periods || []);
const payslips = computed(() => store.payslips || []);

const totalLiquido = computed(() => {
  return payslips.value
    .filter(p => p.status === 'ISSUED')
    .reduce((sum, p) => sum + (Number(p.totalNet) || 0), 0);
});

// Utility Functions
function companyId() {
  if (selectedCompany.value) return selectedCompany.value;
  return userStore?.user?.companyId || userStore?.user?.company?._id || userStore?.user?.company || null;
}

function countBy(s) {
  return payslips.value.filter(x => x.status === s).length;
}

// Company Management
async function onCompanyChange() {
  if (!selectedCompany.value) return;
  localStorage.setItem('lastSelectedCompany', selectedCompany.value);
  selected.value = [];
  await reload();
  $q.notify({
    type: "info",
    message: `Empresa: ${currentCompanyData.value?.name || 'Sin nombre'}`,
    icon: "business",
    position: "top"
  });
}

// Initialization
async function initializeComponent() {
  try {
    await companiesStore.fetchCompanies();
  } catch (error) {
    console.error("Error loading companies:", error);
  }

  const lastCompanyId = localStorage.getItem('lastSelectedCompany');
  const userCompanyId = userStore?.user?.companyId || userStore?.user?.company?._id || userStore?.user?.company;

  if (lastCompanyId && companyOptions.value.some(c => c._id === lastCompanyId)) {
    selectedCompany.value = lastCompanyId;
  } else if (userCompanyId && companyOptions.value.some(c => c._id === userCompanyId)) {
    selectedCompany.value = userCompanyId;
  } else if (companyOptions.value.length > 0) {
    selectedCompany.value = companyOptions.value[0]._id;
  }

  if (!selectedCompany.value) {
    $q.notify({
      type: "warning",
      message: "No hay empresas activas disponibles",
      caption: "Por favor, crea o activa una empresa primero",
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
  if (mode.value === "detail") {
    await loadPayslips();
  }
}

async function generatePeriod() {
  const cid = companyId();
  if (!cid) {
    return $q.notify({ type: "negative", message: "No se encontró empresa activa", icon: "error", position: "top" });
  }
  if (!isValidPeriod(periodInput.value)) {
    return $q.notify({ type: "warning", message: "Período inválido (YYYY-MM)", icon: "warning", position: "top" });
  }

  try {
    const res = await store.generatePeriod({ companyId: cid, period: periodInput.value });
    $q.notify({
      type: "positive",
      message: `Período generado exitosamente`,
      caption: `Creados: ${res?.created ?? 0} • Actualizados: ${res?.updated ?? 0}`,
      icon: "check_circle",
      position: "top"
    });
    await store.fetchPeriods({ companyId: cid });
    openPeriod(periodInput.value);
  } catch (e) {
    $q.notify({ type: "negative", message: store.error || "Error al generar período", icon: "error", position: "top" });
  }
}

function openPeriod(p) {
  periodSelected.value = p;
  mode.value = "detail";
  loadPayslips();
}

async function loadPayslips() {
  const cid = companyId();
  if (!cid) return;
  if (!isValidPeriod(periodSelected.value)) {
    return $q.notify({ type: "warning", message: "Período inválido (YYYY-MM)", icon: "warning", position: "top" });
  }

  try {
    await store.fetchPayslips({
      companyId: cid,
      period: periodSelected.value,
      q: q.value || undefined,
      status: status.value || undefined
    });
  } catch (e) {
    $q.notify({ type: "negative", message: store.error || "Error al cargar liquidaciones", icon: "error", position: "top" });
  }
}

watch([q, status], () => {
  if (mode.value === "detail") loadPayslips();
});

function openDetail(row) {
  current.value = row;
  dialogDetail.value = true;
}

async function issueOne(row) {
  try {
    await store.issuePayslip({ payslipId: row.id || row._id });
    $q.notify({ type: "positive", message: "Liquidación emitida", icon: "check_circle", position: "top" });
    dialogDetail.value = false;
    await loadPayslips();
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
    await loadPayslips();
  } catch {
    $q.notify({ type: "negative", message: store.error || "Error al anular", icon: "error", position: "top" });
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
      for (const row of selected.value) {
        if (row.status !== "DRAFT") continue;
        await store.issuePayslip({ payslipId: row.id || row._id });
        emitted++;
      }
      $q.notify({
        type: "positive",
        message: "Emisión masiva finalizada",
        caption: `${emitted} liquidación(es) emitida(s)`,
        icon: "check_circle",
        position: "top"
      });
      selected.value = [];
      await loadPayslips();
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
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

:root {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-accent: #14b8a6;
}

/* Theme Variables */
.rk-payroll-page {
  --page-bg: linear-gradient(135deg, rgba(243, 244, 246, 0.8), rgba(249, 250, 251, 0.8));
  position: relative;
  min-height: 100vh;
  padding: 24px;
  background: var(--page-bg);
  font-family: 'Sora', -apple-system, sans-serif;
  color: rgba(15, 23, 42, 0.96);
}

.body--dark .rk-payroll-page {
  --page-bg: linear-gradient(135deg, rgba(10, 14, 20, 0.95), rgba(15, 20, 25, 0.95));
}

/* Background Effects */
.rk-page-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.rk-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.08) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.3;
}

.body--dark .rk-grid-pattern {
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.12) 1px, transparent 1px);
}

.rk-glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.06;
}

.rk-orb-1 {
  width: 500px;
  height: 500px;
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, var(--color-primary), transparent 60%);
}

.rk-orb-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: -100px;
  background: radial-gradient(circle, var(--color-accent), transparent 60%);
}

/* Transitions */
.rk-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-fade-out {
  animation: fadeOut 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Responsive */
@media (max-width: 767px) {
  .rk-payroll-page {
    padding: 16px;
  }
}
</style>
