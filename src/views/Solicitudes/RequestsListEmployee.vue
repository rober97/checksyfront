<template>
  <q-page class="rk-page">
    <!-- Header -->
    <PageHeader
      icon="assignment_turned_in"
      title="Mis Solicitudes"
      subtitle="Revisa y gestiona tus solicitudes"
    >
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nueva solicitud"
          :to="{ name: 'requests.new' }"
          class="rk-action-btn"
        />
      </template>
    </PageHeader>

    <!-- Toolbar -->
    <div class="rk-toolbar">
      <q-btn-toggle
        v-model="statusFilter"
        no-caps
        unelevated
        dense
        toggle-color="primary"
        :options="statusOpts"
        class="rk-toggle"
        @update:model-value="reload"
      />

      <q-space />

      <q-btn outline dense no-caps icon="event" :label="dateRangeLabel" class="rk-toolbar-btn">
        <q-popup-proxy transition-show="scale" transition-hide="scale">
          <q-date v-model="dateRange" range mask="YYYY-MM-DD" minimal>
            <div class="row items-center justify-between q-pa-sm">
              <q-btn flat dense label="Limpiar" color="grey" @click="clearDates" v-close-popup />
              <q-btn flat dense label="Aplicar" color="primary" @click="onDatesChange" v-close-popup />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-btn>

      <q-input
        v-model="search"
        dense
        outlined
        clearable
        debounce="300"
        placeholder="Buscar..."
        class="rk-search"
        @update:model-value="reload"
      >
        <template #prepend><q-icon name="search" size="18px" /></template>
      </q-input>
    </div>

    <!-- Stats row -->
    <div class="rk-stats-row">
      <div v-for="m in metrics" :key="m.label" class="rk-stat" :class="m.cls">
        <q-icon :name="m.icon" size="20px" />
        <strong>{{ m.value }}</strong>
        <span>{{ m.label }}</span>
      </div>
    </div>

    <!-- Table -->
    <div class="rk-table-wrap">
      <q-table
        :rows="rowsView"
        :columns="columns"
        row-key="_id"
        flat
        :pagination="pagination"
        :rows-per-page-options="[10, 25, 50]"
        :loading="store.loading"
        loading-label="Cargando..."
        no-data-label="No hay solicitudes"
        :filter="search"
        class="rk-table"
      >
        <template #no-data>
          <div class="rk-empty">
            <q-icon name="inbox" size="48px" color="grey-5" />
            <div class="text-subtitle1 text-weight-bold q-mt-md">Sin solicitudes</div>
            <div class="text-caption text-grey">Crea una nueva con el boton "Nueva solicitud"</div>
          </div>
        </template>

        <template #body-cell-tipo="p">
          <q-td :props="p">
            <div class="rk-tipo-cell">
              <q-icon :name="tipoIcon(p.row.type)" size="18px" color="primary" />
              <strong>{{ tipoLabel(p.row.type) }}</strong>
            </div>
          </q-td>
        </template>

        <template #body-cell-periodo="p">
          <q-td :props="p">
            <span class="text-weight-medium">
              {{ formatDate(p.row.startDate) }} — {{ formatDate(p.row.endDate) }}
            </span>
            <div class="text-caption" style="opacity:.5">
              {{ formatDuration(p.row.startDate, p.row.endDate) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-estado="p">
          <q-td :props="p">
            <q-badge
              :color="statusColor(p.row.status)"
              :label="statusLabel(p.row.status)"
              outline
              class="rk-badge"
            />
          </q-td>
        </template>

        <template #body-cell-notas="p">
          <q-td :props="p">
            <span v-if="p.row.reason" class="rk-notes">{{ p.row.reason }}</span>
            <span v-else style="opacity:.35">—</span>
          </q-td>
        </template>

        <template #body-cell-actions="p">
          <q-td :props="p" class="text-right">
            <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="openDetail(p.row)">
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>
            <q-btn
              v-if="p.row.status === 'PENDING'"
              flat dense round
              icon="close"
              color="negative"
              size="sm"
              @click="cancelRequest(p.row)"
            >
              <q-tooltip>Cancelar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Detail dialog -->
    <q-dialog v-model="detailOpen">
      <q-card class="rk-detail-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            <q-icon :name="tipoIcon(detailRow?.type)" class="q-mr-sm" color="primary" />
            {{ tipoLabel(detailRow?.type) }}
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator class="q-my-sm" />

        <q-card-section v-if="detailRow">
          <div class="rk-detail-grid">
            <div class="rk-detail-item">
              <span class="rk-detail-label">Estado</span>
              <q-badge :color="statusColor(detailRow.status)" :label="statusLabel(detailRow.status)" outline />
            </div>
            <div class="rk-detail-item">
              <span class="rk-detail-label">Periodo</span>
              <strong>{{ formatDate(detailRow.startDate) }} — {{ formatDate(detailRow.endDate) }}</strong>
            </div>
            <div class="rk-detail-item">
              <span class="rk-detail-label">Duracion</span>
              <strong>{{ formatDuration(detailRow.startDate, detailRow.endDate) }}</strong>
            </div>
            <div class="rk-detail-item">
              <span class="rk-detail-label">Creada</span>
              <strong>{{ formatDate(detailRow.createdAt) }}</strong>
            </div>
          </div>
          <div v-if="detailRow.reason" class="q-mt-md">
            <span class="rk-detail-label">Motivo / Notas</span>
            <p class="q-mt-xs">{{ detailRow.reason }}</p>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            v-if="detailRow?.status === 'PENDING'"
            flat
            color="negative"
            label="Cancelar solicitud"
            icon="close"
            @click="cancelRequest(detailRow); detailOpen = false"
          />
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useQuasar, date as qdate } from "quasar";
import PageHeader from "@/components/shared/PageHeader.vue";
import { useRequestsStore } from "@/stores/requests";

const $q = useQuasar();
const store = useRequestsStore();

/* Filters */
const search = ref("");
const statusFilter = ref("all");
const statusOpts = [
  { label: "Todas", value: "all" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Aprobadas", value: "APPROVED" },
  { label: "Rechazadas", value: "REJECTED" },
];

const dateRange = ref({ from: "", to: "" });
const desde = computed(() => dateRange.value?.from || "");
const hasta = computed(() => dateRange.value?.to || "");
const dateRangeLabel = computed(() => {
  if (!desde.value && !hasta.value) return "Fechas";
  if (desde.value && hasta.value) return `${desde.value} — ${hasta.value}`;
  return desde.value || hasta.value;
});
const clearDates = () => { dateRange.value = { from: "", to: "" }; reload(); };
const onDatesChange = () => reload();

/* Data */
const rawRows = computed(() => store.myRequests || store.list || store.items || []);

const rowsView = computed(() => {
  const st = statusFilter.value;
  const d1 = desde.value;
  const d2 = hasta.value;
  const q = (search.value || "").toLowerCase();

  return rawRows.value.filter((r) => {
    if (st !== "all" && r.status !== st) return false;
    if (d1 && (r.startDate || "") < d1) return false;
    if (d2 && (r.endDate || "") > d2) return false;
    if (q) {
      const haystack = [r.type, r.reason, r.status, tipoLabel(r.type), statusLabel(r.status)]
        .map((v) => (v || "").toLowerCase())
        .join(" ");
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
});

/* Metrics */
const totalCount = computed(() => rawRows.value.length);
const pendingCount = computed(() => rawRows.value.filter((r) => r.status === "PENDING").length);
const approvedCount = computed(() => rawRows.value.filter((r) => r.status === "APPROVED").length);
const rejectedCount = computed(() => rawRows.value.filter((r) => r.status === "REJECTED").length);

const metrics = computed(() => [
  { icon: "assignment", value: totalCount.value, label: "Total", cls: "rk-stat--total" },
  { icon: "schedule", value: pendingCount.value, label: "Pendientes", cls: "rk-stat--pending" },
  { icon: "check_circle", value: approvedCount.value, label: "Aprobadas", cls: "rk-stat--approved" },
  { icon: "cancel", value: rejectedCount.value, label: "Rechazadas", cls: "rk-stat--rejected" },
]);

/* Table */
const pagination = ref({ page: 1, rowsPerPage: 10, sortBy: "createdAt", descending: true });

const columns = [
  { name: "tipo", label: "Tipo", field: "type", align: "left", sortable: true },
  { name: "periodo", label: "Periodo", field: (row) => `${row.startDate} ${row.endDate}`, align: "left" },
  { name: "estado", label: "Estado", field: "status", align: "center", sortable: true },
  { name: "notas", label: "Notas", field: "reason", align: "left" },
  { name: "actions", label: "", field: "__actions", align: "right" },
];

/* Helpers */
function tipoLabel(type) {
  const map = {
    VACATION: "Vacaciones", vacaciones: "Vacaciones",
    ADMIN_DAY: "Dia administrativo", compensatorio: "Compensatorio",
    COMP_DAY: "Compensatorio",
    PERSONAL: "Permiso personal", permiso: "Permiso",
    MEDICAL: "Licencia medica", licencia: "Licencia",
    OTHER: "Otro",
  };
  return map[type] || type || "—";
}

function tipoIcon(type) {
  const map = {
    VACATION: "beach_access", vacaciones: "beach_access",
    ADMIN_DAY: "today", compensatorio: "today",
    COMP_DAY: "autorenew",
    PERSONAL: "person", permiso: "event_available",
    MEDICAL: "local_hospital", licencia: "medical_services",
  };
  return map[type] || "help_outline";
}

function statusColor(s) {
  const map = { PENDING: "orange", APPROVED: "green", REJECTED: "red", CANCELLED: "grey" };
  return map[s] || "grey";
}

function statusLabel(s) {
  const map = { PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada", CANCELLED: "Cancelada" };
  return map[s] || s || "—";
}

function formatDate(d) {
  return d ? qdate.formatDate(d, "DD/MM/YYYY") : "—";
}

function formatDuration(start, end) {
  if (!start || !end) return "—";
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.max(1, Math.round((e - s) / (1000 * 3600 * 24)) + 1);
  return `${days} dia${days !== 1 ? "s" : ""}`;
}

/* Detail dialog */
const detailOpen = ref(false);
const detailRow = ref(null);

function openDetail(row) {
  detailRow.value = row;
  detailOpen.value = true;
}

async function cancelRequest(row) {
  $q.dialog({
    title: "Cancelar solicitud",
    message: "Estas seguro de cancelar esta solicitud?",
    cancel: { label: "No", flat: true },
    ok: { label: "Si, cancelar", color: "negative", unelevated: true },
    persistent: true,
  }).onOk(async () => {
    try {
      await store.cancelRequest(row._id || row.id);
      $q.notify({ type: "positive", message: "Solicitud cancelada", icon: "check_circle" });
      await fetchData();
    } catch (e) {
      $q.notify({ type: "negative", message: store.error || "Error al cancelar" });
    }
  });
}

/* Fetch */
async function fetchData() {
  try {
    await store.fetchMyRequests({
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      q: search.value || undefined,
      status: statusFilter.value === "all" ? undefined : statusFilter.value,
      desde: desde.value || undefined,
      hasta: hasta.value || undefined,
    });
  } catch {
    // store handles errors
  }
}

const reload = () => {
  pagination.value.page = 1;
  fetchData();
};

onMounted(fetchData);
</script>

<style scoped>
.rk-page {
  min-height: 100vh;
  padding: 0 16px 24px;
}

/* Toolbar */
.rk-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, .7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, .06);
  border-radius: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.body--dark .rk-toolbar {
  background: rgba(16, 19, 24, .7);
  border-color: rgba(255, 255, 255, .06);
}

.rk-toggle :deep(.q-btn) {
  text-transform: none;
  font-weight: 600;
  font-size: .8rem;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 8px;
}

.rk-toolbar-btn {
  text-transform: none;
  font-weight: 600;
  font-size: .8rem;
  border-radius: 8px;
  min-height: 32px;
}

.rk-search {
  flex: 0 1 200px;
  min-width: 140px;
}

.rk-search :deep(.q-field__control) {
  border-radius: 8px;
  min-height: 32px;
}

/* Stats row */
.rk-stats-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.rk-stat {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: .82rem;
}

.rk-stat strong {
  font-size: 1.15rem;
  font-weight: 800;
}

.rk-stat span {
  font-size: .72rem;
  font-weight: 600;
  opacity: .6;
}

.rk-stat--total {
  background: rgba(33, 150, 243, .07);
  color: #1976d2;
}
.rk-stat--pending {
  background: rgba(245, 158, 11, .07);
  color: #d97706;
}
.rk-stat--approved {
  background: rgba(34, 197, 94, .07);
  color: #16a34a;
}
.rk-stat--rejected {
  background: rgba(239, 68, 68, .07);
  color: #dc2626;
}

.body--dark .rk-stat--total { background: rgba(33, 150, 243, .12); color: #42a5f5; }
.body--dark .rk-stat--pending { background: rgba(245, 158, 11, .12); color: #fbbf24; }
.body--dark .rk-stat--approved { background: rgba(34, 197, 94, .12); color: #4ade80; }
.body--dark .rk-stat--rejected { background: rgba(239, 68, 68, .12); color: #f87171; }

/* Table wrap */
.rk-table-wrap {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, .06);
  border-radius: 12px;
  overflow: hidden;
}

.body--dark .rk-table-wrap {
  background: #101318;
  border-color: rgba(255, 255, 255, .06);
}

/* Override q-table styles */
.rk-table {
  background: transparent !important;
}

.rk-table :deep(thead tr:first-child th) {
  background: rgba(0, 0, 0, .03);
  font-weight: 700;
  font-size: .75rem;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: rgba(0, 0, 0, .55);
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, .06);
}

.body--dark .rk-table :deep(thead tr:first-child th) {
  background: rgba(255, 255, 255, .03);
  color: rgba(255, 255, 255, .5);
  border-bottom-color: rgba(255, 255, 255, .06);
}

.rk-table :deep(tbody tr) {
  transition: background .12s;
}

.rk-table :deep(tbody tr:hover) {
  background: rgba(0, 0, 0, .02);
}

.body--dark .rk-table :deep(tbody tr:hover) {
  background: rgba(255, 255, 255, .03);
}

.rk-table :deep(tbody td) {
  padding: 10px 14px;
  font-size: .85rem;
  border-bottom: 1px solid rgba(0, 0, 0, .04);
}

.body--dark .rk-table :deep(tbody td) {
  border-bottom-color: rgba(255, 255, 255, .04);
}

.rk-table :deep(.q-table__bottom) {
  border-top: 1px solid rgba(0, 0, 0, .06);
  font-size: .8rem;
}

.body--dark .rk-table :deep(.q-table__bottom) {
  border-top-color: rgba(255, 255, 255, .06);
}

/* Cells */
.rk-tipo-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rk-badge {
  font-size: .7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .3px;
}

.rk-notes {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: .82rem;
  line-height: 1.4;
}

/* Empty state */
.rk-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px;
  text-align: center;
}

/* Action btn */
.rk-action-btn {
  text-transform: none;
  font-weight: 700;
  border-radius: 10px;
}

/* Detail dialog */
.rk-detail-card {
  min-width: min(460px, 95vw);
  border-radius: 14px;
}

.rk-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.rk-detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rk-detail-label {
  font-size: .72rem;
  font-weight: 600;
  opacity: .5;
}

/* Responsive */
@media (max-width: 767px) {
  .rk-page {
    padding: 0 6px 16px;
  }

  .rk-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .rk-search {
    flex: 1 1 100%;
    min-width: 0;
  }

  .rk-stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .rk-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
