<template>
  <q-page class="q-pa-md rk-requests-page" :class="pageBgClass">
    <div class="rk-page-bg" aria-hidden="true">
      <div class="rk-page-orb rk-page-orb--primary"></div>
      <div class="rk-page-orb rk-page-orb--accent"></div>
      <div class="rk-page-grid"></div>
    </div>

    <div class="rk-page-shell">
      <!-- ===== Header unificado ===== -->
      <PageHeader
        icon="assignment_turned_in"
        title="Mis Solicitudes"
        help-text="AYUDA"
        :help-to="{ name: 'help.requests' }"
      >
        <template #subtitle>
          Revisa y gestiona tus solicitudes creadas.
        </template>
        <template #right>
          <q-btn
            color="primary"
            unelevated
            icon="add"
            label="Nueva solicitud"
            :to="{ name: 'requests.new' }"
            class="rk-cta"
          />
        </template>
      </PageHeader>

    <!-- ===== Toolbar (sticky) ===== -->
    <div ref="toolbarSentinel" class="rk-sentinel" />
    <div
      ref="toolbarRef"
      class="rk-toolbar q-mb-md"
      :class="{ 'is-sticky': stickyToolbar }"
    >
      <div class="row items-center q-col-gutter-sm full-width">
        <!-- Filtro Estado -->
        <q-btn-toggle
          v-model="estadoFilter"
          :options="estadoOpts"
          unelevated
          toggle-color="primary"
          size="sm"
          class="rk-modes"
          @update:model-value="reload"
        />

        <!-- Métricas compactas -->
        <div class="row items-center q-gutter-xs rk-metrics q-ml-sm">
          <q-chip dense outline icon="apps" color="primary"
            >{{ totalCount }} Total</q-chip
          >
          <q-chip dense outline icon="schedule" color="warning"
            >{{ pendingCount }} Pend.</q-chip
          >
          <q-chip dense outline icon="check_circle" color="positive"
            >{{ approvedCount }} Aprob.</q-chip
          >
          <q-chip dense outline icon="cancel" color="negative"
            >{{ rejectedCount }} Rech.</q-chip
          >
        </div>

        <q-space />

        <!-- Rango de fechas -->
        <q-btn-dropdown
          dense
          rounded
          outline
          :label="dateRangeLabel"
          icon="event"
          class="rk-toolbar-dropdown"
          content-class="rk-toolbar-popup"
        >
          <div class="q-pa-md rk-date-panel" style="min-width: 320px">
            <div class="text-caption text-weight-medium q-mb-sm">
              Rango de fechas
            </div>
            <q-date v-model="dateRange" range mask="YYYY-MM-DD" class="rk-date-picker">
              <div class="row items-center justify-between q-pa-sm">
                <q-btn
                  flat
                  dense
                  label="Limpiar"
                  color="primary"
                  @click="clearDates"
                />
                <q-btn
                  flat
                  dense
                  label="Aplicar"
                  color="primary"
                  v-close-popup
                  @click="onDatesChange"
                />
              </div>
            </q-date>
          </div>
        </q-btn-dropdown>

        <!-- Buscador -->
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          debounce="300"
          placeholder="Buscar por tipo, notas…"
          class="rk-pill rk-mini-search"
          @update:model-value="reload"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
    </div>

    <!-- ===== Métricas grandes ===== -->
    <div class="row q-col-gutter-md q-mb-md rk-metrics-row">
      <div class="col-6 col-md-3">
        <q-card class="rk-metric-card bg-primary-gradient text-white">
          <q-card-section class="q-pa-md">
            <div class="row items-center no-wrap">
              <div class="rk-metric-icon-wrap">
                <q-icon name="assignment" size="28px" />
              </div>
              <div class="col">
                <div class="text-h5 text-weight-bold">{{ totalCount }}</div>
                <div class="text-caption">Total solicitadas</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card class="rk-metric-card bg-orange-gradient text-white">
          <q-card-section class="q-pa-md">
            <div class="row items-center no-wrap">
              <div class="rk-metric-icon-wrap">
                <q-icon name="schedule" size="28px" />
              </div>
              <div class="col">
                <div class="text-h5 text-weight-bold">{{ pendingCount }}</div>
                <div class="text-caption">Pendientes</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card class="rk-metric-card bg-positive-gradient text-white">
          <q-card-section class="q-pa-md">
            <div class="row items-center no-wrap">
              <div class="rk-metric-icon-wrap">
                <q-icon name="check_circle" size="28px" />
              </div>
              <div class="col">
                <div class="text-h5 text-weight-bold">{{ approvedCount }}</div>
                <div class="text-caption">Aprobadas</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card class="rk-metric-card bg-negative-gradient text-white">
          <q-card-section class="q-pa-md">
            <div class="row items-center no-wrap">
              <div class="rk-metric-icon-wrap">
                <q-icon name="cancel" size="28px" />
              </div>
              <div class="col">
                <div class="text-h5 text-weight-bold">{{ rejectedCount }}</div>
                <div class="text-caption">Rechazadas</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ===== Contenido principal ===== -->
    <q-card flat bordered class="rk-card soft-card" :class="cardTone">
      <q-card-section class="q-pa-none">
        <!-- Vista Tarjetas -->
        <div v-if="viewMode === 'cards'" class="row q-col-gutter-md q-pa-md">
          <div
            v-for="r in rowsView"
            :key="r._id"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card class="rk-item-card" :class="statusStripClass(r.estado)">
              <q-card-section class="q-pb-sm">
                <div class="row items-start justify-between">
                  <div class="col">
                    <div class="text-subtitle1 text-weight-medium">
                      <q-icon :name="tipoIcon(r.tipo)" class="q-mr-xs" />
                      {{ r.tipo || "—" }}
                    </div>
                    <div class="text-caption text-grey-6">
                      {{ formatDate(r.fechaInicio) }} —
                      {{ formatDate(r.fechaFin) }} •
                      {{ formatDuration(r.fechaInicio, r.fechaFin) }}
                    </div>
                  </div>
                  <q-badge
                    :color="estadoColor(r.estado)"
                    class="rk-status-badge"
                  >
                    <q-icon
                      :name="estadoIcon(r.estado)"
                      class="q-mr-xs"
                      size="12px"
                    />
                    {{ r.estado }}
                  </q-badge>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pt-sm">
                <div class="text-caption text-grey-7" v-if="r.notas">
                  <q-icon name="notes" class="q-mr-xs" /> {{ r.notas }}
                </div>
                <div class="text-caption text-grey-6" v-else>—</div>
              </q-card-section>
              <q-card-actions align="right" class="q-pt-none">
                <q-btn
                  flat
                  dense
                  icon="visibility"
                  label="Ver detalle"
                  class="rk-inline-action"
                  @click="verDetalle(r)"
                />
              </q-card-actions>
            </q-card>
          </div>

          <div
            v-if="!rowsView.length"
            class="full-width column items-center q-pa-xl rk-muted rk-empty-state"
          >
            <q-icon name="assignment_turned_in" size="56px" class="q-mb-sm" />
            <div class="text-subtitle1 q-mb-xs">No hay solicitudes</div>
            <div class="text-caption">Crea una con “Nueva solicitud”.</div>
          </div>
        </div>

        <!-- Vista Tabla -->
        <DynamicDataTable
          v-else
          :rows="rowsView"
          :columns="columns"
          row-key="_id"
          :pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
          :loading="store.loading"
          loading-label="Cargando solicitudes…"
          no-data-label="No hay solicitudes que coincidan"
          :filter="search"
          :table-class="tableClass"
          :flat="true"
          :bordered="true"
          selection="none"
          @request="onRequest"
        >
          <template #no-data>
            <div class="full-width column items-center q-pa-xl rk-muted rk-empty-state">
              <q-icon name="assignment_turned_in" size="64px" class="q-mb-md" />
              <div class="text-subtitle1 q-mb-xs">No hay solicitudes</div>
              <div class="text-caption">Crea una con “Nueva solicitud”.</div>
            </div>
          </template>

          <template #body-cell-tipo="p">
            <q-td :props="p">
              <q-badge class="rk-type-badge">
                {{ tipoLabel(p.row.type) || "—" }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-periodo="p">
            <q-td :props="p">
              <div class="column">
                <div class="text-weight-medium">
                  {{ formatDate(p.row.startDate) }} —
                  {{ formatDate(p.row.endDate) }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ formatDuration(p.row.startDate, p.row.endDate) }}
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-estado="p">
            <q-td :props="p">
              <q-badge
                :color="estadoColor(p.row.status)"
                class="rk-status-badge"
              >
                <q-icon
                  :name="estadoIcon(p.row.status)"
                  class="q-mr-xs"
                  size="12px"
                />
                {{ estadoLabel(p.row.status) || "—" }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-notas="p">
            <q-td :props="p">
              <div v-if="p.row.notas" class="rk-notes-text">
                {{ p.row.reason }}
              </div>
              <span v-else class="text-grey-6">—</span>
            </q-td>
          </template>
        </DynamicDataTable>
      </q-card-section>
    </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useQuasar, date as qdate } from "quasar";
import PageHeader from "@/components/shared/PageHeader.vue";
import DynamicDataTable from "@/components/shared/DynamicDataTable.vue";
import { useRequestsStore } from "@/stores/requests";

const $q = useQuasar();
const store = useRequestsStore();

/* Tema */
const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"
);
const cardTone = computed(() =>
  isDark.value ? "bg-grey-9 text-white" : "bg-white"
);
const tableClass = computed(() => [
  "rk-compact",
  isDark.value ? "bg-grey-9 text-white" : "bg-white text-dark",
]);

/* Sticky toolbar */
const toolbarRef = ref(null);
const toolbarSentinel = ref(null);
const stickyToolbar = ref(false);
let observer;
const initSticky = () => {
  observer = new IntersectionObserver(
    (entries) => {
      stickyToolbar.value = !entries[0].isIntersecting;
    },
    { root: null, threshold: 0 }
  );
  if (toolbarSentinel.value) observer.observe(toolbarSentinel.value);
};
onBeforeUnmount(() => {
  if (observer && toolbarSentinel.value)
    observer.unobserve(toolbarSentinel.value);
});

/* Filtros/UI */
const search = ref("");
const estadoFilter = ref("all");
const estadoOpts = [
  { label: "Todas", value: "all", icon: "apps" },
  { label: "Pendientes", value: "Pendiente", icon: "schedule" },
  { label: "Aprobadas", value: "Aprobado", icon: "check_circle" },
  { label: "Rechazadas", value: "Rechazado", icon: "cancel" },
];

const dateRange = ref({ from: "", to: "" });
const desde = computed(() => dateRange.value.from || "");
const hasta = computed(() => dateRange.value.to || "");
const dateRangeLabel = computed(() => {
  if (!desde.value && !hasta.value) return "Rango de fechas";
  if (desde.value && hasta.value) return `${desde.value} - ${hasta.value}`;
  return desde.value ? `Desde ${desde.value}` : `Hasta ${hasta.value}`;
});
const clearDates = () => {
  dateRange.value = { from: "", to: "" };
  reload();
};
const onDatesChange = () => reload();

const viewMode = ref("table");
const viewOpts = [
  { label: "Tabla", value: "table", icon: "table_view" },
  { label: "Tarjetas", value: "cards", icon: "view_module" },
];

/* Datos */
const rawRows = computed(() => store.list || store.items || []);
const rowsView = computed(() => {
  const st = estadoFilter.value || "all";
  const d1 = desde.value;
  const d2 = hasta.value;
  const q = (search.value || "").toLowerCase();

  return (rawRows.value || []).filter((r) => {
    if (st !== "all" && (r.estado || "") !== st) return false;
    if (d1 && (r.fechaInicio || "") < d1) return false;
    if (d2 && (r.fechaFin || "") > d2) return false;
    if (q) {
      const hay = [r.tipo, r.notas, r.estado]
        .map((v) => (v || "").toLowerCase())
        .some((v) => v.includes(q));
      if (!hay) return false;
    }
    return true;
  });
});

/* Métricas */
const totalCount = computed(() => rawRows.value.length || 0);
const pendingCount = computed(
  () => rawRows.value.filter((r) => r.status === "PENDING").length
);
const approvedCount = computed(
  () => rawRows.value.filter((r) => r.status === "APPROVED").length
);
const rejectedCount = computed(
  () => rawRows.value.filter((r) => r.status === "REJECTED").length
);

/* Tabla */
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: "fechaInicio",
  descending: false,
});
const columns = [
  {
    name: "tipo",
    label: "Tipo",
    field: "tipo",
    align: "left",
    sortable: true,
    width: 160,
  },
  {
    name: "periodo",
    label: "Período",
    field: (row) => `${row.fechaInicio} ${row.fechaFin}`,
    align: "left",
    sortable: false,
    width: 220,
  },
  {
    name: "estado",
    label: "Estado",
    field: "estado",
    align: "left",
    sortable: true,
    width: 140,
  },
  {
    name: "notas",
    label: "Notas",
    field: "notas",
    align: "left",
    sortable: false,
  },
  {
    name: "actions",
    label: "",
    field: "__actions",
    align: "right",
    sortable: false,
    width: 100,
  },
];
const onRequest = (ctx) => {
  const { page, rowsPerPage, sortBy, descending } = ctx.pagination;
  pagination.value = { page, rowsPerPage, sortBy, descending };
  fetchServer();
};

/* Helpers visuales (todas FUNCIONES para evitar el error) */
const estadoColor = (s) =>
  s === "Aprobado" ? "positive" : s === "Rechazado" ? "negative" : "warning";
const estadoIcon = (s) =>
  s === "Aprobado" ? "check_circle" : s === "Rechazado" ? "cancel" : "schedule";
const estadoLabel = (s) =>
  s === "PENDING" ? "Pendiente" : s === "REJECTED" ? "Rechazado" : s === "APPROVED" ? "Aprobada" : 'DESCONOCIDO';
const tipoLabel = (s) =>
  s === "VACATION" ? "Vacaciones" : s === "REJECTED" ? "Rechazado" : s === "OTHER" ? "Otro" : "schedule";
const tipoIcon = (t) =>
  ({
    Vacaciones: "beach_access",
    "Día compensatorio": "autorenew",
    "Permiso personal": "person",
    "Licencia médica": "local_hospital",
    "Permiso familiar": "family_restroom",
  }[t] || "help");

/* <<< ESTA ES LA FUNCIÓN QUE TE FALTABA >>> */
const statusStripClass = (s) => {
  return [
    "rk-strip",
    s === "Aprobado"
      ? "rk-strip--ok"
      : s === "Rechazado"
      ? "rk-strip--bad"
      : /* Pendiente/otro */ "rk-strip--pending",
  ];
};

const formatDate = (dstr) =>
  dstr ? qdate.formatDate(dstr, "DD/MM/YYYY") : "—";
const formatDuration = (start, end) => {
  if (!start || !end) return "—";
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e - s) / (1000 * 3600 * 24)) + 1;
  return `${days} día${days !== 1 ? "s" : ""}`;
};

const verDetalle = (row) => {
  const tipo = row?.tipo || tipoLabel(row?.type) || "Solicitud";
  const estado = estadoLabel(row?.status) || row?.estado || "Pendiente";
  const notas = row?.notas || row?.reason || "Sin notas";

  $q.dialog({
    title: tipo,
    message: `Estado: ${estado}\nPeríodo: ${formatDate(
      row?.fechaInicio || row?.startDate
    )} - ${formatDate(row?.fechaFin || row?.endDate)}\nNotas: ${notas}`,
    ok: { label: "Cerrar", color: "primary", unelevated: true },
  });
};

/* Data fetch */
const fetchServer = async () => {
  await store.fetchRequests({
    page: pagination.value.page,
    limit: pagination.value.rowsPerPage,
    q: search.value,
    estado: estadoFilter.value === "all" ? "" : estadoFilter.value,
    desde: desde.value || "",
    hasta: hasta.value || "",
    sortBy: pagination.value.sortBy,
    descending: pagination.value.descending,
  });
};
const reload = () => {
  pagination.value.page = 1;
  fetchServer();
};

/* Lifecycle */
onMounted(async () => {
  initSticky();
  await fetchServer();
});
</script>

<style scoped>
/* ===== Tokens mínimos ===== */
:root {
  --rk-border: rgba(15, 23, 42, 0.08);
  --rk-card: rgba(255, 255, 255, 0.88);
  --rk-card-solid: #ffffff;
  --rk-soft: #f3f8fb;
  --rk-soft-2: #eef5f9;
  --rk-soft-3: #e2edf5;
  --rk-muted: #64748b;
  --rk-title: #0f172a;
  --rk-subtle-text: #334155;
  --rk-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}
.body--dark {
  --rk-border: rgba(148, 163, 184, 0.14);
  --rk-card: rgba(15, 23, 42, 0.82);
  --rk-card-solid: #0f172a;
  --rk-soft: #111827;
  --rk-soft-2: #172033;
  --rk-soft-3: #1e293b;
  --rk-muted: #94a3b8;
  --rk-title: #e2e8f0;
  --rk-subtle-text: #cbd5e1;
  --rk-shadow: 0 24px 55px rgba(2, 6, 23, 0.36);
}
.rk-muted {
  color: var(--rk-muted);
}

.rk-requests-page {
  position: relative;
  overflow: hidden;
}

.rk-page-shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rk-page-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.rk-page-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.9;
}

.rk-page-orb--primary {
  top: -80px;
  right: -40px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.18), rgba(14, 165, 233, 0));
}

.rk-page-orb--accent {
  left: -100px;
  top: 180px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.14), rgba(16, 185, 129, 0));
}

.rk-page-grid {
  position: absolute;
  inset: 0;
  opacity: 0.25;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 78%);
}

/* ===== Gradientes y tonos ===== */
.bg-primary-gradient {
  background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
}
.bg-orange-gradient {
  background: linear-gradient(135deg, #ea580c 0%, #f59e0b 100%);
}
.bg-positive-gradient {
  background: linear-gradient(135deg, #059669 0%, #34d399 100%);
}
.bg-negative-gradient {
  background: linear-gradient(135deg, #dc2626 0%, #f97316 100%);
}

/* ===== Toolbar ===== */
.rk-sentinel {
  height: 1px;
}
.rk-toolbar {
  border: 1px solid var(--rk-border);
  border-radius: 20px;
  padding: 14px 16px;
  background:
    radial-gradient(120% 160% at 0% 0%, rgba(14, 165, 233, 0.1), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(247, 250, 252, 0.82)),
    var(--rk-card);
  backdrop-filter: saturate(1.15) blur(14px);
  box-shadow: var(--rk-shadow);
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
}
.rk-toolbar.is-sticky {
  position: sticky;
  top: 56px;
  z-index: 8;
  border-color: rgba(6, 182, 212, 0.22);
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.12);
}
.rk-toolbar :deep(.q-btn),
.rk-toolbar :deep(.q-field__control) {
  box-shadow: none;
}
.rk-modes :deep(.q-btn) {
  min-height: 38px;
  border-radius: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.72);
  color: var(--rk-subtle-text);
  border: 1px solid rgba(148, 163, 184, 0.18);
}
.rk-modes :deep(.q-btn--active) {
  background: linear-gradient(135deg, #0284c7, #06b6d4);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 10px 24px rgba(8, 145, 178, 0.28);
}
.rk-mini-search {
  min-width: 260px;
}
.rk-pill :deep(.q-field__control) {
  border-radius: 14px !important;
  background: color-mix(in oklab, var(--rk-soft) 88%, transparent);
}

.rk-pill :deep(.q-field__control:before) {
  border-color: rgba(148, 163, 184, 0.22) !important;
}

.rk-pill :deep(.q-field--focused .q-field__control:before),
.rk-pill :deep(.q-field--focused .q-field__control:hover:before) {
  border-color: rgba(6, 182, 212, 0.42) !important;
}

.rk-pill :deep(.q-field__native),
.rk-pill :deep(.q-field__prepend) {
  color: var(--rk-title);
}

.rk-metrics {
  flex-wrap: wrap;
}

.rk-metrics :deep(.q-chip) {
  border-radius: 999px;
  padding-inline: 10px;
  background: rgba(255, 255, 255, 0.72);
  font-weight: 700;
  border-color: rgba(148, 163, 184, 0.24);
}

.rk-toolbar-dropdown :deep(.q-btn) {
  min-height: 42px;
  border-radius: 14px;
  padding-inline: 14px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--rk-title);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

:deep(.rk-toolbar-popup) {
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  overflow: hidden;
}

.rk-date-panel {
  color: var(--rk-title);
}

.rk-date-picker {
  border-radius: 18px;
  background: transparent;
}

.rk-date-picker :deep(.q-date__header) {
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(6, 182, 212, 0.92));
  border-radius: 18px 18px 0 0;
}

.rk-date-picker :deep(.q-date__view),
.rk-date-picker :deep(.q-date__calendar) {
  background: transparent;
}

.rk-date-picker :deep(.q-date__calendar-item .q-btn) {
  border-radius: 12px;
}

/* ===== Cards & tabla ===== */
.rk-card {
  border-radius: 24px;
  border: 1px solid var(--rk-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.92)),
    var(--rk-card-solid);
  box-shadow: var(--rk-shadow);
  overflow: hidden;
}
.rk-item-card {
  border-radius: 22px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
    var(--rk-card-solid);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.rk-item-card:hover {
  transform: translateY(-4px);
  border-color: rgba(6, 182, 212, 0.22);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}
.rk-type-badge,
.rk-status-badge {
  border-radius: 999px;
  font-weight: 600;
  padding: 7px 12px;
  font-size: 0.8rem;
}

.rk-type-badge {
  background: rgba(2, 132, 199, 0.1);
  color: #0369a1;
  border: 1px solid rgba(2, 132, 199, 0.12);
}

.rk-status-badge {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Strip lateral por estado */
.rk-strip::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  border-top-left-radius: 16px;
  border-bottom-left-radius: 16px;
}
.rk-strip--ok::before {
  background: linear-gradient(180deg, #10b981, #34d399);
}
.rk-strip--bad::before {
  background: linear-gradient(180deg, #ef4444, #f97316);
}
.rk-strip--pending::before {
  background: linear-gradient(180deg, #f59e0b, #fb923c);
}

/* Métricas */
.rk-metrics-row {
  position: relative;
  z-index: 1;
}

.rk-metric-card {
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
}

.rk-metric-card::after {
  content: "";
  position: absolute;
  inset: auto -30% -40% auto;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 72%);
}

.rk-metric-icon-wrap {
  width: 48px;
  height: 48px;
  margin-right: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
}

/* Tabla */
.rk-compact :deep(thead tr) {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.body--dark .rk-compact :deep(thead tr) {
  background: #172033;
  border-bottom: 1px solid #334155;
}
.rk-compact :deep(tbody tr:hover) {
  background: #f1f5f9;
}
.body--dark .rk-compact :deep(tbody tr:hover) {
  background: #1e293b;
}

.rk-compact :deep(th) {
  color: var(--rk-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.rk-compact :deep(td) {
  border-color: rgba(148, 163, 184, 0.12);
}

.rk-compact :deep(.q-table__middle) {
  background: transparent;
}

.rk-card :deep(.q-table__container) {
  background: transparent;
}

.rk-card :deep(.q-table__middle),
.rk-card :deep(.q-table__top),
.rk-card :deep(.q-table__bottom) {
  background: transparent;
}

.rk-card :deep(.q-table__bottom) {
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  color: var(--rk-muted);
}

/* Utilidades */
.rk-cta {
  min-height: 46px;
  border-radius: 14px;
  padding: 8px 16px;
  box-shadow: 0 14px 28px rgba(6, 182, 212, 0.18);
}

.rk-inline-action {
  border-radius: 12px;
  color: #0284c7;
  font-weight: 700;
}

.rk-inline-action:hover {
  background: rgba(2, 132, 199, 0.08);
}

.rk-notes-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  color: var(--rk-title);
}

.rk-empty-state {
  min-height: 260px;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.72), rgba(241, 245, 249, 0.68));
}

.rk-empty-state .q-icon {
  color: rgba(2, 132, 199, 0.7);
}

.soft-card {
  backdrop-filter: blur(12px);
}

.body--dark .rk-toolbar {
  background:
    radial-gradient(120% 160% at 0% 0%, rgba(6, 182, 212, 0.16), transparent 38%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(17, 24, 39, 0.88)),
    var(--rk-card);
}

.body--dark .rk-toolbar.is-sticky {
  border-color: rgba(34, 211, 238, 0.22);
  box-shadow: 0 22px 48px rgba(2, 6, 23, 0.4);
}

.body--dark .rk-card,
.body--dark .rk-item-card {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(17, 24, 39, 0.94)),
    var(--rk-card-solid);
}

.body--dark .rk-metrics :deep(.q-chip) {
  background: rgba(15, 23, 42, 0.76);
}

.body--dark .rk-modes :deep(.q-btn) {
  background: rgba(15, 23, 42, 0.8);
  color: var(--rk-subtle-text);
  border-color: rgba(148, 163, 184, 0.16);
}

.body--dark .rk-pill :deep(.q-field__control) {
  background: rgba(15, 23, 42, 0.78);
}

.body--dark .rk-pill :deep(.q-field__control:before) {
  border-color: rgba(148, 163, 184, 0.18) !important;
}

.body--dark .rk-toolbar-dropdown :deep(.q-btn) {
  background: rgba(15, 23, 42, 0.8);
  color: var(--rk-title);
  border-color: rgba(148, 163, 184, 0.18);
}

.body--dark :deep(.rk-toolbar-popup) {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(17, 24, 39, 0.96));
  border-color: rgba(148, 163, 184, 0.16);
  box-shadow: 0 30px 70px rgba(2, 6, 23, 0.55);
}

.body--dark .rk-pill :deep(.q-field__native),
.body--dark .rk-pill :deep(.q-field__prepend),
.body--dark .rk-notes-text {
  color: #e2e8f0;
}

.body--dark .rk-date-panel {
  color: var(--rk-title);
}

.body--dark .rk-type-badge {
  background: rgba(14, 165, 233, 0.16);
  color: #7dd3fc;
  border-color: rgba(56, 189, 248, 0.18);
}

.body--dark .rk-inline-action {
  color: #67e8f9;
}

.body--dark .rk-inline-action:hover {
  background: rgba(34, 211, 238, 0.12);
}

.body--dark .rk-empty-state {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(17, 24, 39, 0.68));
}

.body--dark .rk-empty-state .q-icon {
  color: rgba(103, 232, 249, 0.76);
}

.body--dark .rk-card :deep(.q-table__bottom) {
  border-top-color: rgba(148, 163, 184, 0.14);
}

@media (max-width: 1023px) {
  .rk-toolbar {
    padding: 14px;
  }
}

@media (max-width: 767px) {
  .rk-page-shell {
    gap: 16px;
  }

  .rk-toolbar {
    border-radius: 18px;
  }

  .rk-mini-search {
    min-width: 100%;
  }

  .rk-metric-card {
    border-radius: 18px;
  }

  .rk-card {
    border-radius: 20px;
  }

  .rk-item-card {
    border-radius: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rk-item-card,
  .rk-toolbar,
  .rk-cta {
    transition: none;
  }
}
</style>
