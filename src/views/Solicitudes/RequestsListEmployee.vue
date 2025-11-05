<template>
  <q-page class="q-pa-md" :class="pageBgClass">
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
        >
          <div class="q-pa-md" style="min-width: 320px">
            <div class="text-caption text-weight-medium q-mb-sm">
              Rango de fechas
            </div>
            <q-date v-model="dateRange" range mask="YYYY-MM-DD">
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
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-6 col-md-3">
        <q-card class="rk-metric-card bg-primary-gradient text-white">
          <q-card-section class="q-pa-md">
            <div class="row items-center">
              <q-icon name="assignment" size="32px" class="q-mr-sm" />
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
            <div class="row items-center">
              <q-icon name="schedule" size="32px" class="q-mr-sm" />
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
            <div class="row items-center">
              <q-icon name="check_circle" size="32px" class="q-mr-sm" />
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
            <div class="row items-center">
              <q-icon name="cancel" size="32px" class="q-mr-sm" />
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
                  @click="verDetalle(r)"
                />
              </q-card-actions>
            </q-card>
          </div>

          <div
            v-if="!rowsView.length"
            class="full-width column items-center q-pa-xl rk-muted"
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
            <div class="full-width column items-center q-pa-xl rk-muted">
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
  () => rawRows.value.filter((r) => r.estado === "Pendiente").length
);
const approvedCount = computed(
  () => rawRows.value.filter((r) => r.estado === "Aprobado").length
);
const rejectedCount = computed(
  () => rawRows.value.filter((r) => r.estado === "Rechazado").length
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
  s === "VACATION" ? "Vacaciones" : s === "REJECTED" ? "Rechazado" : "schedule";
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
  --rk-border: rgba(0, 0, 0, 0.08);
  --rk-card: #fff;
  --rk-soft: #f5f7fb;
  --rk-muted: #667085;
}
.body--dark {
  --rk-border: rgba(255, 255, 255, 0.08);
  --rk-card: #101318;
  --rk-soft: #0f1216;
  --rk-muted: #9aa3b2;
}
.rk-muted {
  color: var(--rk-muted);
}

/* ===== Gradientes y tonos ===== */
.bg-primary-gradient {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
}
.bg-orange-gradient {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
}
.bg-positive-gradient {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
}
.bg-negative-gradient {
  background: linear-gradient(135deg, #f44336 0%, #ef5350 100%);
}

/* ===== Toolbar ===== */
.rk-sentinel {
  height: 1px;
}
.rk-toolbar {
  border: 1px solid var(--rk-border);
  border-radius: 14px;
  padding: 12px;
  background: radial-gradient(
      120% 120% at 0% 0%,
      color-mix(in oklab, var(--q-primary) 8%, transparent),
      transparent 60%
    ),
    var(--rk-card);
  backdrop-filter: saturate(1.1) blur(6px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}
.rk-toolbar.is-sticky {
  position: sticky;
  top: 56px;
  z-index: 5;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
}
.rk-modes :deep(.q-btn) {
  border-radius: 12px;
}
.rk-modes :deep(.q-btn--active) {
  box-shadow: 0 6px 14px rgba(33, 150, 243, 0.22);
}
.rk-mini-search {
  min-width: 240px;
}
.rk-pill :deep(.q-field__control) {
  border-radius: 12px !important;
  background: color-mix(in oklab, var(--rk-soft) 80%, transparent);
}

/* ===== Cards & tabla ===== */
.rk-card {
  border-radius: 16px;
  border: 1px solid var(--rk-border);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}
.rk-item-card {
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}
.rk-type-badge,
.rk-status-badge {
  border-radius: 8px;
  font-weight: 600;
  padding: 6px 10px;
  font-size: 0.8rem;
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
  background: #4caf50;
}
.rk-strip--bad::before {
  background: #f44336;
}
.rk-strip--pending::before {
  background: #ff9800;
}

/* Métricas */
.rk-metric-card {
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
}

/* Tabla */
.rk-compact :deep(thead tr) {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}
.body--dark .rk-compact :deep(thead tr) {
  background: #1e293b;
  border-bottom: 2px solid #475569;
}
.rk-compact :deep(tbody tr:hover) {
  background: #f1f5f9;
}
.body--dark .rk-compact :deep(tbody tr:hover) {
  background: #334155;
}

/* Utilidades */
.rk-cta {
  border-radius: 12px;
  padding: 8px 12px;
}
.rk-notes-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
</style>
