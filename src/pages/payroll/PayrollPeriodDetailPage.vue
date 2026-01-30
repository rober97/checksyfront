<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <q-card flat bordered class="rk-docs-card q-mt-md">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="row items-center q-gutter-sm">
            <q-btn flat dense icon="arrow_back" :color="isDark ? 'grey-4' : 'grey-7'" @click="goBack" />
            <div class="text-h6" :class="isDark ? 'text-white' : 'text-primary'">
              Liquidaciones · {{ period }}
            </div>
          </div>
          <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
            Vacaciones aprobadas se consideran como días pagados.
          </div>
        </div>

        <div class="row q-gutter-sm items-center">
          <q-input dense filled v-model.trim="q" debounce="300" placeholder="Buscar empleado…" style="width: 220px">
            <template #prepend><q-icon name="search" /></template>
          </q-input>

          <q-select
            dense filled
            v-model="status"
            :options="statusOptions"
            emit-value map-options
            clearable
            label="Estado"
            style="width: 140px"
          />

          <q-btn
            outline
            :color="isDark ? 'grey-4' : 'primary'"
            icon="refresh"
            label="Actualizar"
            no-caps
            :loading="store.loading"
            @click="reload"
          />

          <q-btn
            :color="isDark ? 'primary-7' : 'primary'"
            unelevated
            icon="receipt_long"
            label="Emitir seleccionados"
            no-caps
            :disable="selected.length === 0"
            :loading="issuingMany"
            @click="issueSelected"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="q-pa-md" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
              <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">Total</div>
              <div class="text-h6 text-weight-bold">{{ payslips.length }}</div>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="q-pa-md" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
              <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">Borradores</div>
              <div class="text-h6 text-weight-bold">{{ countBy('DRAFT') }}</div>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="q-pa-md" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
              <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">Emitidas</div>
              <div class="text-h6 text-weight-bold">{{ countBy('ISSUED') }}</div>
            </q-card>
          </div>
        </div>

        <q-table
          flat bordered dense
          row-key="id"
          :rows="payslips"
          :columns="columns"
          :loading="store.loading"
          selection="multiple"
          v-model:selected="selected"
          :class="isDark ? 'bg-grey-9' : ''"
          no-data-label="Sin liquidaciones"
        >
          <template #body-cell-employee="p">
            <q-td :props="p">
              <div class="text-weight-medium">{{ p.row.employeeName || '—' }}</div>
              <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
                {{ p.row.employeeRut || '' }}
              </div>
            </q-td>
          </template>

          <template #body-cell-days="p">
            <q-td :props="p">
              <div class="row q-gutter-xs items-center">
                <q-chip dense color="grey-6" text-color="white" size="sm">
                  Esperados {{ p.row.daysExpected ?? 0 }}
                </q-chip>
                <q-chip dense color="primary" text-color="white" size="sm">
                  Pagados {{ p.row.daysPaid ?? 0 }}
                </q-chip>
                <q-chip v-if="(p.row.daysAbsent ?? 0) > 0" dense color="negative" text-color="white" size="sm">
                  Ausencias {{ p.row.daysAbsent }}
                </q-chip>
              </div>
            </q-td>
          </template>

          <template #body-cell-totals="p">
            <q-td :props="p">
              <div class="text-weight-medium">
                Líquido: {{ money(p.row.totalNet) }}
              </div>
              <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
                Haberes {{ money(p.row.totalEarn) }} · Desc. {{ money(p.row.totalDeduct) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-status="p">
            <q-td :props="p">
              <q-chip dense :color="statusColor(p.row.status)" text-color="white" size="sm">
                {{ p.row.status }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-actions="p">
            <q-td :props="p" class="text-right">
              <q-btn
                flat dense round icon="visibility"
                :color="isDark ? 'primary-4' : 'primary'"
                @click="openDetail(p.row)"
              >
                <q-tooltip>Ver detalle</q-tooltip>
              </q-btn>

              <q-btn
                v-if="p.row.status === 'DRAFT'"
                flat dense round icon="receipt_long"
                color="positive"
                @click="issueOne(p.row)"
              >
                <q-tooltip>Emitir</q-tooltip>
              </q-btn>

              <q-btn
                v-if="p.row.status === 'ISSUED'"
                flat dense round icon="picture_as_pdf"
                :color="isDark ? 'grey-4' : 'grey-7'"
                @click="openPdf(p.row)"
              >
                <q-tooltip>Ver PDF</q-tooltip>
              </q-btn>

              <q-btn
                v-if="p.row.status === 'ISSUED'"
                flat dense round icon="block"
                color="negative"
                @click="voidOne(p.row)"
              >
                <q-tooltip>Anular</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template #loading>
            <q-inner-loading showing>
              <q-spinner-gears size="40px" :color="isDark ? 'primary-4' : 'primary'" />
            </q-inner-loading>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Dialog detalle -->
    <q-dialog v-model="dialogDetail">
      <q-card style="min-width: 520px" :class="isDark ? 'bg-grey-9 text-white' : ''">
        <q-card-section class="row items-center">
          <div class="text-h6">Detalle liquidación</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="current">
          <div class="text-subtitle2 q-mb-xs">{{ current.employeeName }}</div>
          <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
            Período {{ period }} · Estado {{ current.status }}
          </div>

          <q-separator class="q-my-md" />

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-card flat bordered class="q-pa-sm" :class="isDark ? 'bg-grey-10' : 'bg-grey-1'">
                <div class="text-caption">Días esperados</div>
                <div class="text-h6 text-weight-bold">{{ current.daysExpected ?? 0 }}</div>
              </q-card>
            </div>
            <div class="col-6">
              <q-card flat bordered class="q-pa-sm" :class="isDark ? 'bg-grey-10' : 'bg-grey-1'">
                <div class="text-caption">Días pagados</div>
                <div class="text-h6 text-weight-bold">{{ current.daysPaid ?? 0 }}</div>
              </q-card>
            </div>
          </div>

          <div class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">Totales</div>
            <q-list bordered separator dense>
              <q-item>
                <q-item-section>Haberes</q-item-section>
                <q-item-section side>{{ money(current.totalEarn) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Descuentos</q-item-section>
                <q-item-section side>{{ money(current.totalDeduct) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section class="text-weight-bold">Líquido</q-item-section>
                <q-item-section side class="text-weight-bold">{{ money(current.totalNet) }}</q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-if="current?.status === 'DRAFT'"
            color="positive"
            unelevated
            icon="receipt_long"
            label="Emitir"
            no-caps
            @click="issueOne(current)"
          />
          <q-btn
            v-if="current?.status === 'ISSUED'"
            outline
            icon="picture_as_pdf"
            label="Ver PDF"
            no-caps
            @click="openPdf(current)"
          />
          <q-btn flat label="Cerrar" v-close-popup no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Visor PDF (reusa tu patrón) -->
    <q-dialog v-model="dialogPdf" maximized persistent transition-show="slide-up" transition-hide="slide-down">
      <q-card class="rk-docs-viewer">
        <q-bar :class="isDark ? 'bg-grey-10 text-white' : 'bg-grey-2'">
          <q-icon name="picture_as_pdf" class="q-mr-sm" />
          <div class="text-subtitle2 ellipsis col">
            {{ pdfTitle }}
          </div>
          <q-space />
          <q-btn dense flat icon="download" @click="downloadPdf" :disable="!pdfUrl || loadingPdf" />
          <q-separator vertical inset class="q-mx-sm" />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-card-section class="rk-viewer-body">
          <q-inner-loading :showing="loadingPdf">
            <q-spinner-gears size="48px" :color="isDark ? 'primary-4' : 'primary'" />
            <div class="q-mt-md text-caption">Cargando PDF...</div>
          </q-inner-loading>

          <iframe v-if="pdfUrl && !loadingPdf" :src="pdfUrl" class="rk-viewer-frame" @load="loadingPdf=false"></iframe>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { usePayrollStore } from "@/stores/payrollStore";
import { useUserStore } from "@/stores/userStore";

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const store = usePayrollStore();
const userStore = useUserStore();

const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() => (isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"));

const period = computed(() => route.params.period);

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

const statusOptions = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Emitida", value: "ISSUED" },
  { label: "Anulada", value: "VOID" },
];

const columns = [
  { name: "employee", label: "Empleado", field: "employeeName", sortable: true, align: "left" },
  { name: "days", label: "Días", field: "daysPaid", sortable: false, align: "left" },
  { name: "totals", label: "Totales", field: "totalNet", sortable: true, align: "left" },
  { name: "status", label: "Estado", field: "status", sortable: true, align: "left" },
  { name: "actions", label: "Acciones", field: "actions", align: "right" },
];

function companyId() {
  return userStore?.user?.companyId || userStore?.user?.company?._id || userStore?.user?.company || null;
}

const payslips = computed(() => store.payslips || []);

function statusColor(s) {
  if (s === "ISSUED") return "positive";
  if (s === "DRAFT") return "orange";
  if (s === "VOID") return "negative";
  return "grey";
}

function money(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function countBy(s) {
  return payslips.value.filter(x => x.status === s).length;
}

async function reload() {
  const cid = companyId();
  if (!cid) return;
  await store.fetchPayslips({
    companyId: cid,
    period: period.value,
    q: q.value || undefined,
    status: status.value || undefined
  });
}

watch([q, status], () => reload());

function goBack() {
  router.push({ name: "payroll-periods" });
}

function openDetail(row) {
  current.value = row;
  dialogDetail.value = true;
}

async function issueOne(row) {
  try {
    await store.issuePayslip({ payslipId: row.id || row._id });
    $q.notify({ type: "positive", message: "Liquidación emitida", position: "top" });
    dialogDetail.value = false;
    await reload();
  } catch {
    $q.notify({ type: "negative", message: store.error || "Error emitiendo", position: "top" });
  }
}

async function voidOne(row) {
  try {
    const reason = await promptReason();
    if (!reason) return;

    await store.voidPayslip({ payslipId: row.id || row._id, reason });
    $q.notify({ type: "warning", message: "Liquidación anulada", position: "top" });
    await reload();
  } catch {
    $q.notify({ type: "negative", message: store.error || "Error anulando", position: "top" });
  }
}

async function issueSelected() {
  issuingMany.value = true;
  try {
    for (const row of selected.value) {
      if (row.status !== "DRAFT") continue;
      await store.issuePayslip({ payslipId: row.id || row._id });
    }
    $q.notify({ type: "positive", message: "Emisión masiva finalizada", position: "top" });
    selected.value = [];
    await reload();
  } catch {
    $q.notify({ type: "negative", message: store.error || "Error en emisión masiva", position: "top" });
  } finally {
    issuingMany.value = false;
  }
}

async function openPdf(row) {
  loadingPdf.value = true;
  pdfUrl.value = "";
  pdfTitle.value = `Liquidación ${row.employeeName || ""} · ${period.value}`;
  dialogPdf.value = true;

  try {
    const url = await store.getPdfUrl({ payslipId: row.id || row._id });
    pdfUrl.value = url;
  } catch {
    $q.notify({ type: "negative", message: store.error || "No se pudo obtener el PDF", position: "top" });
    dialogPdf.value = false;
  } finally {
    loadingPdf.value = false;
  }
}

function downloadPdf() {
  if (!pdfUrl.value) return;
  const a = document.createElement("a");
  a.href = pdfUrl.value;
  a.target = "_blank";
  a.click();
}

function promptReason() {
  return new Promise((resolve) => {
    $q.dialog({
      title: "Anular liquidación",
      message: "Indica el motivo:",
      prompt: { model: "", type: "text" },
      cancel: true,
      persistent: true,
    }).onOk(resolve).onCancel(() => resolve(""));
  });
}

onMounted(reload);
</script>

<style scoped>
/* Reusa tus clases del viewer si ya existen globalmente.
   Si no, copia las rk-docs-viewer / rk-viewer-body / rk-viewer-frame de tu vista actual. */
</style>
