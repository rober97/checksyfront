<!-- src/views/Admin/RequestsPage.vue -->
<template>
  <q-page class="q-pa-lg rk-request-page" :class="pageBgClass">
    <!-- ===== Header ===== -->
    <div class="rk-header q-mb-lg">
      <div class="rk-header__left">
        <div class="text-h4 text-weight-bold rk-main-title">
          Solicitudes
          <q-badge v-if="pendingCount > 0" color="orange" floating class="rk-badge-floating">
            {{ pendingCount }} pendiente{{ pendingCount !== 1 ? 's' : '' }}
          </q-badge>
        </div>
        <div class="text-subtitle1 rk-subtitle">
          Gestiona y aprueba solicitudes del equipo
        </div>
      </div>
      <div class="rk-header__right">
        <q-btn 
          round 
          flat 
          icon="help" 
          color="grey-6"
          class="rk-help-btn"
        >
          <q-tooltip>Ayuda</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- ===== Panel de Control — Reestructurado ===== -->
    <div class="rk-control-panel q-mb-lg">
      <!-- Fila 1: Buscador + Acciones -->
      <div class="rk-control-row rk-control-row--top">
        <div class="rk-search-wrapper">
          <q-input
            v-model="search"
            dense
            outlined
            clearable
            debounce="300"
            placeholder="Buscar empleados, tipos, notas..."
            class="rk-main-search"
          >
            <template #prepend>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>
        </div>

        <div class="rk-actions-group">
          <q-btn
            outline
            dense
            icon="file_download"
            label="Exportar"
            color="primary"
            no-caps
            class="rk-action-btn-labeled"
            @click="exportar"
          >
            <q-tooltip>Exportar CSV</q-tooltip>
          </q-btn>

          <q-separator vertical inset class="rk-action-separator" />

          <q-btn
            :disable="!selection.length"
            outline
            dense
            icon="task_alt"
            :label="`Aprobar${selection.length ? ` (${selection.length})` : ''}`"
            color="positive"
            no-caps
            class="rk-action-btn-labeled"
            @click="bulkApprove"
          >
            <q-tooltip>Aprobar selección</q-tooltip>
          </q-btn>

          <q-btn
            :disable="!selection.length"
            outline
            dense
            icon="block"
            :label="`Rechazar${selection.length ? ` (${selection.length})` : ''}`"
            color="negative"
            no-caps
            class="rk-action-btn-labeled"
            @click="bulkReject"
          >
            <q-tooltip>Rechazar selección</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Fila 2: Filtros en ancho completo -->
      <div class="rk-control-row rk-control-row--filters">
        <div class="rk-filters-bar">
          <div class="rk-filters-bar__label">
            <q-icon name="filter_list" size="16px" />
            <span>Filtros</span>
          </div>

          <div class="rk-filters-bar__controls">
            <!-- Estado -->
            <q-btn-dropdown
              dense
              outline
              :label="estadoLabel"
              icon="filter_alt"
              class="rk-filter-chip"
              no-caps
            >
              <q-list class="rk-filter-list">
                <q-item 
                  v-for="opt in estadoOpts" 
                  :key="opt.value"
                  clickable
                  v-close-popup
                  @click="estadoFilter = opt.value; reload()"
                  :class="{ 'rk-filter-active': estadoFilter === opt.value }"
                >
                  <q-item-section avatar>
                    <q-icon :name="opt.icon" :color="estadoFilter === opt.value ? 'primary' : 'grey-6'" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <!-- Tipo -->
            <q-select
              v-model="tipoFilter"
              :options="tipoOpts"
              dense
              outlined
              clearable
              emit-value
              map-options
              placeholder="Todos los tipos"
              class="rk-filter-select"
              @update:model-value="reload"
            >
              <template #prepend>
                <q-icon name="category" color="primary" size="18px" />
              </template>
            </q-select>

            <!-- Fechas -->
            <q-btn-dropdown
              dense
              outline
              :label="dateRangeLabel"
              icon="event"
              class="rk-filter-chip"
              no-caps
            >
              <div class="q-pa-md" style="min-width: 300px">
                <div class="text-caption text-weight-medium q-mb-sm">Rango de fechas</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="desde"
                      dense
                      outlined
                      label="Desde"
                      mask="####-##-##"
                      @update:model-value="onDatesChange"
                    >
                      <template #prepend>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="desde" mask="YYYY-MM-DD">
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Cerrar" color="primary" flat />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="hasta"
                      dense
                      outlined
                      label="Hasta"
                      mask="####-##-##"
                      @update:model-value="onDatesChange"
                    >
                      <template #prepend>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="hasta" mask="YYYY-MM-DD">
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Cerrar" color="primary" flat />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
                <q-btn 
                  v-if="desde || hasta"
                  flat 
                  color="primary" 
                  label="Limpiar fechas" 
                  class="full-width q-mt-sm"
                  @click="clearDates"
                />
              </div>
            </q-btn-dropdown>
          </div>

          <!-- Limpiar filtros inline -->
          <q-btn
            v-if="estadoFilter !== 'all' || tipoFilter || desde || hasta"
            flat
            dense
            icon="close"
            label="Limpiar"
            color="grey-7"
            no-caps
            size="sm"
            class="rk-clear-filters-inline"
            @click="clearFilters"
          />
        </div>
      </div>
    </div>

    <!-- ===== Métricas Visuales ===== -->
    <div class="rk-metrics-row q-mb-lg">
      <q-card
        v-for="metric in metrics"
        :key="metric.label"
        class="rk-metric-card cursor-pointer"
        :class="metric.cardClass"
        @click="filterByMetric(metric)"
      >
        <q-card-section class="rk-metric-card__inner">
          <div class="rk-metric-card__icon">
            <q-icon :name="metric.icon" size="22px" />
          </div>
          <div class="rk-metric-card__data">
            <div class="rk-metric-card__value">{{ metric.value }}</div>
            <div class="rk-metric-card__label">{{ metric.label }}</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- ===== Tabla de Solicitudes ===== -->
    <q-card flat class="rk-main-card">
      <q-card-section class="q-pa-none">
        <DynamicDataTable
          :rows="rowsView"
          :columns="columns"
          row-key="_id"
          :pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
          :loading="store.loading"
          loading-label="Cargando solicitudes..."
          no-data-label="No hay solicitudes que coincidan con los filtros"
          :filter="search"
          :table-class="tableClass"
          :binary-state-sort="true"
          :flat="true"
          :bordered="false"
          selection="multiple"
          v-model:selected="selection"
          @request="onRequest"
        >
          <!-- Estado de vacío mejorado -->
          <template #no-data>
            <div class="full-width column items-center q-pa-xl rk-empty-state">
              <q-icon name="assignment_turned_in" size="64px" color="grey-4" class="q-mb-md" />
              <div class="text-h6 q-mb-xs rk-empty-title">No hay solicitudes</div>
              <div class="text-caption text-center rk-empty-copy">
                {{ search || estadoFilter !== 'all' || tipoFilter || desde || hasta 
                  ? 'Intenta ajustar los filtros o la búsqueda' 
                  : 'No hay solicitudes pendientes de revisión' }}
              </div>
              <q-btn 
                v-if="search || estadoFilter !== 'all' || tipoFilter || desde || hasta"
                flat 
                color="primary" 
                label="Limpiar filtros" 
                class="q-mt-md"
                @click="clearFilters"
              />
            </div>
          </template>

          <!-- Columna: Empleado -->
          <template #body-cell-empleado="p">
            <q-td :props="p">
              <div class="rk-employee-cell">
                <q-avatar size="34px" class="rk-employee-avatar" color="primary" text-color="white">
                  {{ getInitials(p.row.empleado) }}
                </q-avatar>
                <div class="rk-employee-copy">
                  <div class="rk-employee-name">{{ p.row.empleado || "—" }}</div>
                  <div class="rk-employee-dept">{{ p.row.departamento || "Sin departamento" }}</div>
                </div>
              </div>
            </q-td>
          </template>

          <!-- Columna: Tipo -->
          <template #body-cell-tipo="p">
            <q-td :props="p">
              <q-badge class="rk-type-badge" :class="typeClass(p.row.type)">
                <q-icon :name="tipoIcon(p.row.type)" class="q-mr-xs" size="14px" />
                {{ typeLabel(p.row.type) }}
              </q-badge>
            </q-td>
          </template>

          <!-- Columna: Período (rango + cuándo) -->
          <template #body-cell-periodo="p">
            <q-td :props="p">
              <div class="rk-period-cell">
                <div class="rk-period-main">
                  <q-icon name="event" size="14px" class="rk-period-icon" />
                  {{ formatRange(p.row.startDate, p.row.endDate) }}
                </div>
                <div class="rk-period-sub" :class="periodHintClass(p.row.startDate)">
                  {{ periodHint(p.row.startDate) }}
                </div>
              </div>
            </q-td>
          </template>

          <!-- Columna: Duración (días, claramente etiquetado) -->
          <template #body-cell-duracion="p">
            <q-td :props="p">
              <span class="rk-duration-chip">
                <q-icon name="hourglass_bottom" size="13px" class="q-mr-xs" />
                {{ formatDuration(p.row.startDate, p.row.endDate) }}
              </span>
            </q-td>
          </template>

          <!-- Columna: Estado -->
          <template #body-cell-estado="p">
            <q-td :props="p">
              <div class="column items-start q-gutter-xs">
                <q-badge class="rk-status-badge" :class="statusClass(p.row.status)">
                  <q-icon :name="estadoIcon(p.row.status)" class="q-mr-xs" size="12px" />
                  {{ statusLabel(p.row.status) }}
                </q-badge>
                <q-badge v-if="p.row.selfApproved" class="rk-status-badge rk-status-badge--self">
                  <q-icon name="gavel" class="q-mr-xs" size="12px" />
                  Autorizada como representante
                  <q-tooltip>Auto-autorizada por el representante del empleador (Art. 4 Cód. del Trabajo). Queda registrada en bitácora.</q-tooltip>
                </q-badge>
              </div>
            </q-td>
          </template>

          <!-- Columna: Notas -->
          <template #body-cell-notas="p">
            <q-td :props="p">
              <div v-if="p.row.notas" class="rk-notes-cell">
                <div class="rk-notes-text">{{ p.row.notas }}</div>
              </div>
              <span v-else class="rk-empty-inline">—</span>
            </q-td>
          </template>

          <!-- Columna: Acciones -->
          <template #body-cell-actions="p">
            <q-td :props="p" class="text-right">
              <div class="rk-row-actions">
                <q-btn
                  v-if="p.row.status === 'PENDING' && canDecide(p.row)"
                  round
                  dense
                  flat
                  icon="check"
                  color="positive"
                  size="sm"
                  class="rk-row-action-btn"
                  @click="approveRow(p.row)"
                >
                  <q-tooltip>{{ ownerIdOf(p.row) === currentUserId ? 'Autorizar como representante del empleador' : 'Aprobar' }}</q-tooltip>
                </q-btn>

                <q-btn
                  v-if="p.row.status === 'PENDING' && canDecide(p.row)"
                  round
                  dense
                  flat
                  icon="close"
                  color="negative"
                  size="sm"
                  class="rk-row-action-btn"
                  @click="rejectRow(p.row)"
                >
                  <q-tooltip>Rechazar</q-tooltip>
                </q-btn>

                <q-icon
                  v-if="p.row.status === 'PENDING' && !canDecide(p.row)"
                  name="lock_clock"
                  color="grey-5"
                  size="sm"
                  class="rk-row-action-btn"
                >
                  <q-tooltip>Tu solicitud está pendiente de tu jefatura o del representante del empleador</q-tooltip>
                </q-icon>
                
                <q-btn
                  round
                  dense
                  flat
                  icon="visibility"
                  color="grey-6"
                  size="sm"
                  class="rk-row-action-btn"
                  @click="verDetalle(p.row)"
                >
                  <q-tooltip>Ver detalles</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </DynamicDataTable>
      </q-card-section>
    </q-card>

    <!-- ===== Barra de Acciones Inferior (Sticky) ===== -->
    <q-footer v-if="selection.length > 0" class="rk-selection-footer">
      <q-toolbar class="rk-selection-toolbar">
        <q-icon name="check_circle" class="q-mr-sm" />
        <q-toolbar-title class="text-caption">
          {{ selection.length }} solicitud{{ selection.length !== 1 ? 'es' : '' }} seleccionada{{ selection.length !== 1 ? 's' : '' }}
        </q-toolbar-title>
        
        <q-btn 
          flat 
          dense 
          icon="task_alt" 
          label="Aprobar" 
          class="q-mr-sm"
          @click="bulkApprove"
        />
        <q-btn 
          flat 
          dense 
          icon="block" 
          label="Rechazar"
          @click="bulkReject"
        />
        
        <q-btn 
          flat 
          dense 
          round 
          icon="close" 
          @click="selection = []"
        >
          <q-tooltip>Limpiar selección</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useQuasar, date } from "quasar";
import DynamicDataTable from "@/components/shared/DynamicDataTable.vue";
import { useRequestsStore } from "@/stores/requests";
import { useAuthStore } from "@/stores/authStore";

const $q = useQuasar();
const store = useRequestsStore();
const auth = useAuthStore();

/* Identidad del usuario actual para aplicar la regla de cuatro ojos:
   nadie aprueba su propia solicitud, salvo el representante del empleador. */
const currentUserId = computed(() =>
  String(auth.user?._id || auth.user?.id || "")
);
const amEmployerRep = computed(() => auth.user?.isEmployerRepresentative === true);

const ownerIdOf = (row) => {
  const u = row?.userId;
  if (!u) return "";
  return String(typeof u === "object" ? (u._id || u.id || "") : u);
};

/* ¿Puede el usuario actual decidir (aprobar/rechazar) esta solicitud? */
const canDecide = (row) => {
  const isSelf = ownerIdOf(row) === currentUserId.value;
  if (isSelf) return amEmployerRep.value; // sólo el representante aprueba lo suyo
  return true; // el backend valida jefatura/representante; aquí no escondemos al resto
};

/* Tema Premium */
const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() =>
  isDark.value ? "is-dark text-white" : "is-light text-dark"
);

const tableClass = computed(() => [
  "rk-premium-table",
  isDark.value ? "bg-dark-card text-white" : "bg-white text-dark",
]);

/* Estado del UI */
const search = ref("");
const estadoFilter = ref("all");
const tipoFilter = ref(null);
const desde = ref("");
const hasta = ref("");
const selection = ref([]);
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: "startDate",
  descending: false,
});

/* Opciones — los valores usan los códigos del backend para que el filtro
   compare contra row.status / row.type (antes comparaba español vs inglés). */
const estadoOpts = [
  { label: "Todas las solicitudes", value: "all", icon: "apps" },
  { label: "Pendientes", value: "PENDING", icon: "hourglass_empty" },
  { label: "Aprobadas", value: "APPROVED", icon: "check_circle" },
  { label: "Rechazadas", value: "REJECTED", icon: "cancel" },
  { label: "Canceladas", value: "CANCELLED", icon: "do_not_disturb" },
];

const tipoOpts = [
  { label: "Vacaciones", value: "VACATION" },
  { label: "Día administrativo", value: "ADMIN_DAY" },
  { label: "Día compensatorio", value: "COMP_DAY" },
  { label: "Permiso / otro", value: "OTHER" },
];

/* Computed Labels */
const estadoLabel = computed(() => {
  const opt = estadoOpts.find(o => o.value === estadoFilter.value);
  return opt ? opt.label : "Estado";
});

const dateRangeLabel = computed(() => {
  if (!desde.value && !hasta.value) return "Rango de fechas";
  if (desde.value && hasta.value) return `${desde.value} — ${hasta.value}`;
  return desde.value ? `Desde ${desde.value}` : `Hasta ${hasta.value}`;
});

/* Métricas Visuales */
const totalCount = computed(() => store.list?.length || 0);
const pendingCount = computed(() => 
  store.list?.filter(r => r.status === "PENDING").length || 0
);
const approvedCount = computed(() =>
  store.list?.filter(r => r.status === "APPROVED").length || 0
);
const rejectedCount = computed(() => 
  store.list?.filter(r => r.status === "REJECTED").length || 0
);

const metrics = computed(() => [
  {
    label: "Total",
    value: totalCount.value,
    icon: "assignment",
    color: "primary",
    cardClass: "bg-primary-gradient",
    filter: () => { estadoFilter.value = "all"; reload(); }
  },
  {
    label: "Pendientes",
    value: pendingCount.value,
    icon: "schedule",
    color: "orange",
    cardClass: "bg-orange-gradient",
    filter: () => { estadoFilter.value = "PENDING"; reload(); }
  },
  {
    label: "Aprobadas",
    value: approvedCount.value,
    icon: "check_circle",
    color: "positive",
    cardClass: "bg-positive-gradient",
    filter: () => { estadoFilter.value = "APPROVED"; reload(); }
  },
  {
    label: "Rechazadas",
    value: rejectedCount.value,
    icon: "cancel",
    color: "negative",
    cardClass: "bg-negative-gradient",
    filter: () => { estadoFilter.value = "REJECTED"; reload(); }
  }
]);

/* Filtrado */
const rawRows = computed(() => store.list || []);
const rowsView = computed(() => {
  const st = estadoFilter.value || "all";
  const tipo = tipoFilter.value;
  const d1 = desde.value;
  const d2 = hasta.value;

  return rawRows.value.filter((r) => {
    if (st !== "all" && (r.status || "") !== st) return false;
    if (tipo && (r.type || "") !== tipo) return false;
    if (d1 && (r.startDate || "") < d1) return false;
    if (d2 && (r.endDate || "") > d2) return false;
    return true;
  });
});

/* Columnas */
const columns = [
  {
    name: "empleado",
    label: "Empleado",
    field: "empleado",
    align: "left",
    sortable: true,
    width: "200px"
  },
  { 
    name: "tipo", 
    label: "Tipo", 
    field: "tipo", 
    align: "left", 
    sortable: true,
    width: "150px"
  },
  {
    name: "periodo",
    label: "Período",
    field: "startDate",
    align: "left",
    sortable: true,
    width: "200px"
  },
  {
    name: "duracion",
    label: "Duración",
    field: "endDate",
    align: "left",
    sortable: true,
    width: "110px"
  },
  {
    name: "estado",
    label: "Estado",
    field: "estado",
    align: "left",
    sortable: true,
    width: "120px"
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
    width: "120px"
  },
];

/* Helpers — todos normalizan a los códigos del backend (inglés). */
const estadoColor = (s) => {
  const n = String(s || '').toUpperCase()
  if (n === 'APPROVED' || n === 'APROBADO') return 'positive'
  if (n === 'REJECTED' || n === 'RECHAZADO') return 'negative'
  if (n === 'CANCELLED' || n === 'CANCELADO') return 'grey'
  return 'orange'
}

const estadoIcon = (s) => {
  const n = String(s || '').toUpperCase()
  if (n === 'APPROVED' || n === 'APROBADO') return 'check_circle'
  if (n === 'REJECTED' || n === 'RECHAZADO') return 'cancel'
  if (n === 'CANCELLED' || n === 'CANCELADO') return 'do_not_disturb'
  return 'schedule'
}

const statusLabel = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'APPROVED' || normalized === 'APROVED' || normalized === 'APROBADO') return 'Aprobada'
  if (normalized === 'REJECTED' || normalized === 'RECHAZADO') return 'Rechazada'
  if (normalized === 'PENDING' || normalized === 'PENDIENTE') return 'Pendiente'
  if (normalized === 'CANCELLED' || normalized === 'CANCELADO') return 'Cancelada'
  return status || 'Sin estado'
}

const statusClass = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'APPROVED' || normalized === 'APROVED' || normalized === 'APROBADO') return 'rk-status-badge--approved'
  if (normalized === 'REJECTED' || normalized === 'RECHAZADO') return 'rk-status-badge--rejected'
  if (normalized === 'CANCELLED' || normalized === 'CANCELADO') return 'rk-status-badge--cancelled'
  return 'rk-status-badge--pending'
}

/* Tipos: el backend manda códigos (VACATION, ADMIN_DAY, COMP_DAY, OTHER).
   Antes la tabla mostraba el código crudo y el estilo caía a "default". */
const typeLabel = (type) => {
  const map = {
    VACATION: "Vacaciones",
    ADMIN_DAY: "Día administrativo",
    COMP_DAY: "Día compensatorio",
    PERMISSION: "Permiso",
    OTHER: "Permiso / otro",
  };
  return map[type] || type || "—";
};

const tipoColor = (t) => {
  const colors = {
    VACATION: "primary",
    ADMIN_DAY: "info",
    COMP_DAY: "positive",
    OTHER: "grey",
  };
  return colors[t] || "grey";
};

const tipoIcon = (t) => {
  const icons = {
    VACATION: "beach_access",
    ADMIN_DAY: "event_available",
    COMP_DAY: "autorenew",
    PERMISSION: "person",
    OTHER: "more_horiz",
  };
  return icons[t] || "help";
};

const typeClass = (type) => {
  const map = {
    VACATION: "rk-type-badge--vacaciones",
    ADMIN_DAY: "rk-type-badge--familiar",
    COMP_DAY: "rk-type-badge--compensatorio",
    OTHER: "rk-type-badge--default",
  };
  return map[type] || "rk-type-badge--default";
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return date.formatDate(dateStr, 'DD/MM/YYYY');
};

const formatDateDistance = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days === -1) return "Ayer";
  if (days > 0) return `En ${days} días`;
  return `Hace ${Math.abs(days)} días`;
};

const formatDuration = (start, end) => {
  if (!start) return "—";
  const startDate = new Date(start);
  const endDate = new Date(end || start);
  const diff = endDate.getTime() - startDate.getTime();
  const days = Math.max(1, Math.floor(diff / (1000 * 3600 * 24)) + 1);
  return `${days} día${days !== 1 ? 's' : ''}`;
};

/* Rango compacto: "22/06 → 23/06 2026". Un solo día → una fecha. */
const formatRange = (start, end) => {
  if (!start) return "—";
  const s = new Date(start);
  const e = new Date(end || start);
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) return date.formatDate(s, "DD/MM/YYYY");
  const sameYear = s.getFullYear() === e.getFullYear();
  const left = date.formatDate(s, sameYear ? "DD/MM" : "DD/MM/YYYY");
  const right = date.formatDate(e, "DD/MM/YYYY");
  return `${left} → ${right}`;
};

/* Pista temporal del inicio: "Hoy", "Mañana", "En 3 días", "Hace 10 días". */
const periodHint = (start) => {
  const d = formatDateDistance(start);
  if (!d) return "";
  if (d === "Hoy") return "Empieza hoy";
  if (d === "Mañana") return "Empieza mañana";
  if (d === "Ayer") return "Empezó ayer";
  if (d.startsWith("En ")) return `Empieza ${d.toLowerCase()}`;
  return d; // "Hace N días"
};

const periodHintClass = (start) => {
  if (!start) return "";
  const days = Math.ceil((new Date(start).getTime() - Date.now()) / (1000 * 3600 * 24));
  if (days > 0) return "rk-period-sub--future";
  if (days === 0) return "rk-period-sub--today";
  return "rk-period-sub--past";
};

/* Acciones */
const approveRow = async (row) => {
  $q.dialog({
    title: 'Confirmar aprobación',
    message: `¿Aprobar la solicitud de <strong>${row.empleado}</strong>?`,
    html: true,
    persistent: true,
    ok: { label: 'Aprobar', color: 'positive', flat: false },
    cancel: { label: 'Cancelar', color: 'grey', flat: true }
  }).onOk(async () => {
    try {
      await store.setStatus(row._id, 'APPROVED');
      $q.notify({ type: "positive", message: "Solicitud aprobada", position: "top-right", timeout: 3000, icon: "check_circle" });
    } catch (e) {
      $q.notify({ type: "negative", message: "No se pudo aprobar", position: "top-right" });
    }
  });
};

const rejectRow = async (row) => {
  $q.dialog({
    title: 'Confirmar rechazo',
    message: `¿Rechazar la solicitud de <strong>${row.empleado}</strong>?`,
    html: true,
    persistent: true,
    ok: { label: 'Rechazar', color: 'negative', flat: false },
    cancel: { label: 'Cancelar', color: 'grey', flat: true }
  }).onOk(async () => {
    try {
      await store.setStatus(row._id, 'REJECTED');
      $q.notify({ type: "positive", message: "Solicitud rechazada", position: "top-right", timeout: 3000, icon: "cancel" });
    } catch (e) {
      $q.notify({ type: "negative", message: "No se pudo rechazar", position: "top-right" });
    }
  });
};

const verDetalle = (row) => {
  const rowGen = (label, value) =>
    `<div class="row q-mb-sm"><div class="col-4 text-grey-7">${label}</div><div class="col-8 text-weight-medium">${value}</div></div>`;
  $q.dialog({
    title: `Solicitud de ${row.empleado}`,
    message: `
      <div>
        ${rowGen('Tipo', typeLabel(row.type))}
        ${rowGen('Período', formatRange(row.startDate, row.endDate))}
        ${rowGen('Duración', formatDuration(row.startDate, row.endDate))}
        ${rowGen('Estado', statusLabel(row.status))}
        ${row.selfApproved ? rowGen('Autorización', 'Representante del empleador (Art. 4 CT)') : ''}
        ${row.notas ? rowGen('Notas', row.notas) : ''}
      </div>
    `,
    html: true,
    ok: { label: "Cerrar", color: "primary", flat: true },
    class: isDark.value ? "bg-dark-card text-white" : ""
  });
};

const bulkApprove = async () => {
  $q.dialog({
    title: 'Aprobar selección',
    message: `¿Aprobar <strong>${selection.value.length}</strong> solicitud${selection.value.length !== 1 ? 'es' : ''} seleccionada${selection.value.length !== 1 ? 's' : ''}?`,
    html: true,
    persistent: true,
    ok: { label: `Aprobar (${selection.value.length})`, color: 'positive', flat: false },
    cancel: { label: 'Cancelar', color: 'grey', flat: true }
  }).onOk(async () => {
    try {
      const ids = selection.value.map((r) => r._id);
      const { ok, fail } = await store.bulkSetStatus(ids, "APPROVED");
      selection.value = [];
      await fetchServer();
      $q.notify({
        type: fail ? "warning" : "positive",
        message: fail ? `${ok} aprobadas, ${fail} no se pudieron` : `${ok} solicitudes aprobadas`,
        position: "top-right", timeout: 4000, icon: "check_circle"
      });
    } catch {
      $q.notify({ type: "negative", message: "No se pudo aprobar la selección", position: "top-right" });
    }
  });
};

const bulkReject = async () => {
  $q.dialog({
    title: 'Rechazar selección',
    message: `¿Rechazar <strong>${selection.value.length}</strong> solicitud${selection.value.length !== 1 ? 'es' : ''} seleccionada${selection.value.length !== 1 ? 's' : ''}?`,
    html: true,
    persistent: true,
    ok: { label: `Rechazar (${selection.value.length})`, color: 'negative', flat: false },
    cancel: { label: 'Cancelar', color: 'grey', flat: true }
  }).onOk(async () => {
    try {
      const ids = selection.value.map((r) => r._id);
      const { ok, fail } = await store.bulkSetStatus(ids, "REJECTED");
      selection.value = [];
      await fetchServer();
      $q.notify({
        type: fail ? "warning" : "positive",
        message: fail ? `${ok} rechazadas, ${fail} no se pudieron` : `${ok} solicitudes rechazadas`,
        position: "top-right", timeout: 4000, icon: "cancel"
      });
    } catch {
      $q.notify({ type: "negative", message: "No se pudo rechazar la selección", position: "top-right" });
    }
  });
};

const exportar = async () => {
  try {
    const blob = await store.exportXlsx({
      status: estadoFilter.value === "all" ? "" : estadoFilter.value,
      type: tipoFilter.value || "",
      from: desde.value || "",
      to: hasta.value || "",
    });
    const url = window.URL.createObjectURL(new Blob([blob]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `solicitudes_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    $q.notify({ type: "info", message: "Exportación completada", position: "top-right", timeout: 3000, icon: "file_download" });
  } catch {
    $q.notify({ type: "negative", message: "No se pudo exportar", position: "top-right" });
  }
};

/* Filtros */
const filterByMetric = (metric) => metric.filter();

const clearDates = () => {
  desde.value = "";
  hasta.value = "";
  reload();
};

const clearFilters = () => {
  search.value = "";
  estadoFilter.value = "all";
  tipoFilter.value = null;
  desde.value = "";
  hasta.value = "";
  reload();
};

/* Data */
const fetchServer = async () => {
  await store.fetchRequests({
    page: pagination.value.page,
    limit: pagination.value.rowsPerPage,
    q: search.value,
    estado: estadoFilter.value === "all" ? "" : estadoFilter.value,
    tipo: tipoFilter.value || "",
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

const onDatesChange = () => reload();

const onRequest = (ctx) => {
  const { page, rowsPerPage, sortBy, descending } = ctx.pagination;
  pagination.value = { page, rowsPerPage, sortBy, descending };
  fetchServer();
};

/* Lifecycle */
onMounted(async () => {
  await fetchServer();
});
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   DESIGN TOKENS
   ══════════════════════════════════════════════════ */
.rk-request-page {
  --rk-primary: #0893AA;
  --rk-primary-light: #33BECB;
  --rk-positive: #059669;
  --rk-negative: #dc2626;
  --rk-orange: #d97706;
  --rk-purple: var(--color-primary);
  --rk-pink: var(--color-accent);
  --rk-text: #0f172a;
  --rk-text-muted: #64748b;
  --rk-text-soft: #94a3b8;
  --rk-surface: rgba(255, 255, 255, 0.92);
  --rk-surface-2: rgba(247, 248, 252, 0.94);
  --rk-border: rgba(15, 23, 42, 0.08);
  --rk-shadow-xs: 0 1px 3px rgba(15, 23, 42, 0.04);
  --rk-shadow-sm: 0 2px 12px rgba(15, 23, 42, 0.06);
  --rk-shadow-md: 0 8px 24px rgba(15, 23, 42, 0.1);
  --rk-shadow-lg: 0 20px 48px rgba(15, 23, 42, 0.14);
  --rk-radius: 16px;
  --rk-radius-sm: 12px;
  --rk-radius-xs: 8px;
  --rk-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-request-page.is-dark {
  --rk-primary: #33BECB;
  --rk-primary-light: #66D2DD;
  --rk-text: #e8eef7;
  --rk-text-muted: #9fb0c8;
  --rk-text-soft: #70819b;
  --rk-surface: rgba(26, 30, 39, 0.92);
  --rk-surface-2: rgba(32, 36, 47, 0.94);
  --rk-border: rgba(255, 255, 255, 0.08);
  --rk-shadow-xs: 0 1px 3px rgba(0, 0, 0, 0.15);
  --rk-shadow-sm: 0 2px 12px rgba(0, 0, 0, 0.2);
  --rk-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.28);
  --rk-shadow-lg: 0 20px 48px rgba(0, 0, 0, 0.36);
}

/* ══════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════ */
.rk-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.rk-main-title {
  position: relative;
  margin-bottom: 6px;
  color: var(--rk-text);
  font-size: 2.25rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.rk-request-page.is-dark .rk-main-title {
  color: #f8fbff;
}

.rk-badge-floating {
  position: absolute;
  top: -6px;
  right: -10px;
  font-size: 0.65rem;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  color: white;
  box-shadow: 0 6px 14px rgba(245, 158, 11, 0.3);
}

.rk-subtitle {
  color: var(--rk-text-muted);
  font-size: 1rem;
}

.rk-help-btn {
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-radius-sm);
  background: var(--rk-surface);
  color: var(--rk-text-muted);
}

/* ══════════════════════════════════════════════════
   CONTROL PANEL — 2-Row Layout
   ══════════════════════════════════════════════════ */
.rk-control-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--rk-surface);
  border-radius: var(--rk-radius);
  border: 1px solid var(--rk-border);
  box-shadow: var(--rk-shadow-sm);
  backdrop-filter: blur(16px);
  overflow: hidden;
}

.rk-control-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

.rk-control-row--top {
  flex-wrap: wrap;
}

.rk-control-row--filters {
  padding-top: 0;
}

/* — Search — */
.rk-search-wrapper {
  flex: 1 1 320px;
  min-width: 0;
}

.rk-main-search :deep(.q-field__control) {
  border-radius: var(--rk-radius-sm);
  background: var(--rk-surface-2);
  color: var(--rk-text);
  transition: box-shadow var(--rk-transition), border-color var(--rk-transition);
}

.rk-main-search :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 3px rgba(8, 147, 170, 0.14);
}

/* — Action Buttons (top row, right side) — */
.rk-actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rk-action-btn-labeled {
  border-radius: var(--rk-radius-xs) !important;
  padding: 6px 14px !important;
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.01em;
  min-height: 38px;
  transition: transform var(--rk-transition), box-shadow var(--rk-transition);
}

.rk-action-btn-labeled:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: var(--rk-shadow-sm);
}

.rk-action-separator {
  height: 24px;
  opacity: 0.2;
  margin: 0 4px;
}

/* — Filters Bar (second row) — */
.rk-filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border-radius: var(--rk-radius-sm);
  background: var(--rk-surface-2);
  border: 1px solid var(--rk-border);
}

.rk-filters-bar__label {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: var(--rk-text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding-right: 12px;
  border-right: 1px solid var(--rk-border);
}

.rk-filters-bar__controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.rk-filter-chip {
  min-height: 36px;
  border-radius: var(--rk-radius-xs) !important;
  border: 1px solid var(--rk-border) !important;
  background: var(--rk-surface) !important;
  color: var(--rk-text) !important;
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: border-color var(--rk-transition), box-shadow var(--rk-transition);
}

.rk-filter-chip:hover {
  border-color: var(--rk-primary) !important;
  box-shadow: 0 0 0 2px rgba(8, 147, 170, 0.08);
}

.rk-filter-chip :deep(.q-btn__content) {
  gap: 6px;
}

.rk-filter-select {
  min-width: 170px;
  max-width: 220px;
}

.rk-filter-select :deep(.q-field__control) {
  min-height: 36px;
  border-radius: var(--rk-radius-xs);
  background: var(--rk-surface);
  color: var(--rk-text);
  transition: box-shadow var(--rk-transition);
}

.rk-filter-select :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 3px rgba(8, 147, 170, 0.12);
}

.rk-filter-list {
  border-radius: var(--rk-radius-sm);
  padding: 6px 0;
  background: var(--rk-surface);
  color: var(--rk-text);
}

.rk-filter-active {
  background: rgba(8, 147, 170, 0.08);
}

.rk-clear-filters-inline {
  margin-left: auto;
  flex-shrink: 0;
}

/* ══════════════════════════════════════════════════
   METRICS ROW
   ══════════════════════════════════════════════════ */
.rk-metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

/* Acento por métrica: define color principal y tono de fondo del icono.
   El fondo del card se mantiene neutro (rk-surface) para no saturar la UI. */
.bg-primary-gradient  { --metric-c: #0893AA; --metric-cl: rgba(8, 147, 170, 0.10); }
.bg-orange-gradient   { --metric-c: #d97706; --metric-cl: rgba(217, 119, 6, 0.10); }
.bg-positive-gradient { --metric-c: #059669; --metric-cl: rgba(5, 150, 105, 0.10); }
.bg-negative-gradient { --metric-c: #dc2626; --metric-cl: rgba(220, 38, 38, 0.10); }

.rk-metric-card {
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-radius-sm);
  box-shadow: var(--rk-shadow-xs);
  transition: transform var(--rk-transition), box-shadow var(--rk-transition), border-color var(--rk-transition);
  overflow: hidden;
  position: relative;
  color: var(--rk-text);
}

.rk-metric-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--metric-c);
  opacity: 0.85;
}

.rk-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--rk-shadow-md);
  border-color: color-mix(in srgb, var(--metric-c) 35%, var(--rk-border));
}

.rk-metric-card__inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px !important;
}

.rk-metric-card__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--metric-cl);
  color: var(--metric-c);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rk-metric-card__data {
  min-width: 0;
}

.rk-metric-card__value {
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--rk-text);
}

.rk-metric-card__label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-top: 4px;
  color: var(--rk-text-muted);
}

/* ══════════════════════════════════════════════════
   TABLE CARD
   ══════════════════════════════════════════════════ */
.rk-main-card {
  background: var(--rk-surface);
  border-radius: var(--rk-radius);
  border: 1px solid var(--rk-border);
  box-shadow: var(--rk-shadow-sm);
  backdrop-filter: blur(16px);
  overflow: hidden;
}

/* Empty State */
.rk-empty-state {
  padding: 72px 40px;
}

.rk-empty-title {
  color: var(--rk-text);
}

.rk-empty-copy {
  color: var(--rk-text-muted);
}

/* Employee Cell */
.rk-employee-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.rk-employee-avatar {
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(8, 147, 170, 0.2);
}

.rk-employee-name {
  color: var(--rk-text);
  font-weight: 700;
  line-height: 1.25;
}

.rk-employee-dept {
  color: var(--rk-text-muted);
  font-size: 12px;
  line-height: 1.35;
}

/* Date Cell */
.rk-date-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rk-date-main {
  color: var(--rk-text);
  font-weight: 700;
}

.rk-date-sub {
  color: var(--rk-text-muted);
  font-size: 12px;
}

/* Period & Duration cells (rediseño de columnas de fecha) */
.rk-period-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rk-period-main {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--rk-text);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.rk-period-icon {
  color: var(--rk-primary);
  opacity: 0.85;
}

.rk-period-sub {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.rk-period-sub--future { color: var(--rk-primary); }
.rk-period-sub--today  { color: #d97706; }
.rk-period-sub--past   { color: var(--rk-text-soft); }

.rk-duration-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--rk-surface-2);
  border: 1px solid var(--rk-border);
  color: var(--rk-text);
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ══════════════════════════════════════════════════
   BADGES — Type & Status
   ══════════════════════════════════════════════════ */
.rk-type-badge,
.rk-status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

/* Colores explícitos (antes algunos usaban vars globales que podían dejar el
   texto del mismo color que el fondo → badge teal sin texto visible). */
.rk-type-badge--vacaciones {
  background: rgba(8, 147, 170, 0.12);
  border-color: rgba(8, 147, 170, 0.22);
  color: #0a6c80;
}
.rk-type-badge--compensatorio {
  background: rgba(5, 150, 105, 0.12);
  border-color: rgba(5, 150, 105, 0.2);
  color: #047857;
}
.rk-type-badge--personal {
  background: rgba(37, 99, 235, 0.12);
  border-color: rgba(37, 99, 235, 0.2);
  color: #1d4ed8;
}
.rk-type-badge--medica {
  background: rgba(217, 119, 6, 0.12);
  border-color: rgba(217, 119, 6, 0.2);
  color: #b45309;
}
.rk-type-badge--familiar {
  background: rgba(124, 58, 237, 0.12);
  border-color: rgba(124, 58, 237, 0.2);
  color: #6d28d9;
}
.rk-type-badge--default {
  background: rgba(100, 116, 139, 0.12);
  border-color: rgba(100, 116, 139, 0.2);
  color: #475569;
}

/* Legibilidad en modo oscuro: subimos el texto a tonos claros */
.rk-request-page.is-dark .rk-type-badge--vacaciones { color: #5fd0e0; }
.rk-request-page.is-dark .rk-type-badge--compensatorio { color: #4ade80; }
.rk-request-page.is-dark .rk-type-badge--personal { color: #93b4ff; }
.rk-request-page.is-dark .rk-type-badge--medica { color: #fbbf77; }
.rk-request-page.is-dark .rk-type-badge--familiar { color: #c4b5fd; }
.rk-request-page.is-dark .rk-type-badge--default { color: #cbd5e1; }

.rk-status-badge--pending {
  background: rgba(217, 119, 6, 0.14);
  border-color: rgba(217, 119, 6, 0.28);
  color: #92400e;
}
.rk-status-badge--approved {
  background: rgba(5, 150, 105, 0.14);
  border-color: rgba(5, 150, 105, 0.28);
  color: #065f46;
}
.rk-status-badge--rejected {
  background: rgba(220, 38, 38, 0.14);
  border-color: rgba(220, 38, 38, 0.28);
  color: #991b1b;
}
.rk-status-badge--cancelled {
  background: rgba(100, 116, 139, 0.16);
  border-color: rgba(100, 116, 139, 0.3);
  color: #475569;
}
.rk-status-badge--self {
  background: rgba(124, 58, 237, 0.14);
  border-color: rgba(124, 58, 237, 0.3);
  color: #5b21b6;
  font-size: 0.68rem;
  min-height: 24px;
}

/* Estados legibles también en modo oscuro */
.rk-request-page.is-dark .rk-status-badge--pending  { color: #fcd34d; }
.rk-request-page.is-dark .rk-status-badge--approved { color: #6ee7b7; }
.rk-request-page.is-dark .rk-status-badge--rejected { color: #fca5a5; }
.rk-request-page.is-dark .rk-status-badge--cancelled{ color: #cbd5e1; }
.rk-request-page.is-dark .rk-status-badge--self     { color: #c4b5fd; }

/* Notes Cell */
.rk-notes-cell {
  max-width: 240px;
  padding: 6px 10px;
  border-radius: var(--rk-radius-xs);
  background: var(--rk-surface-2);
  border: 1px solid var(--rk-border);
}

.rk-notes-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--rk-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.rk-empty-inline {
  color: var(--rk-text-soft);
}

/* Row Actions */
.rk-row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.rk-row-action-btn {
  border-radius: var(--rk-radius-xs) !important;
  transition: transform var(--rk-transition), background-color var(--rk-transition);
}

.rk-row-action-btn:hover {
  transform: translateY(-1px);
}

/* ══════════════════════════════════════════════════
   SELECTION FOOTER
   ══════════════════════════════════════════════════ */
.rk-selection-footer {
  position: sticky;
  bottom: 0;
  z-index: 1000;
  padding: 0 16px 16px;
  background: transparent;
  animation: rk-slideUp 0.25s ease;
}

.rk-selection-toolbar {
  border: 1px solid rgba(8, 147, 170, 0.2);
  border-radius: var(--rk-radius);
  background: linear-gradient(135deg, #0893AA 0%, #067C90 100%);
  color: white;
  box-shadow: 0 12px 32px rgba(8, 147, 170, 0.25);
}

@keyframes rk-slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ══════════════════════════════════════════════════
   TABLE OVERRIDES
   ══════════════════════════════════════════════════ */
.rk-premium-table :deep(thead tr) {
  background: var(--rk-surface-2);
  border-bottom: 1px solid var(--rk-border);
}

.rk-premium-table :deep(th) {
  color: var(--rk-text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.rk-premium-table :deep(tbody tr) {
  transition: background-color var(--rk-transition);
}

.rk-premium-table :deep(tbody tr:hover) {
  background: rgba(8, 147, 170, 0.04);
}

.rk-request-page.is-dark .rk-premium-table :deep(tbody tr:hover) {
  background: rgba(34, 193, 220, 0.06);
}

.rk-premium-table :deep(.q-table__bottom) {
  border-top: 1px solid var(--rk-border);
  background: var(--rk-surface-2);
  color: var(--rk-text-muted);
}

.rk-premium-table :deep(td) {
  color: var(--rk-text);
  vertical-align: middle;
}

.rk-premium-table :deep(.q-checkbox__bg) {
  border-radius: 5px;
}

.rk-premium-table :deep(.q-table tbody td) {
  padding-top: 12px;
  padding-bottom: 12px;
}

/* ══════════════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .rk-main-title {
    font-size: 1.9rem;
  }

  .rk-metrics-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .rk-actions-group {
    flex-wrap: wrap;
  }

  .rk-action-separator {
    display: none;
  }
}

@media (max-width: 768px) {
  .rk-main-title {
    font-size: 1.6rem;
  }

  .rk-control-row {
    flex-direction: column;
    align-items: stretch;
  }

  .rk-search-wrapper {
    flex: 1 1 100%;
  }

  .rk-actions-group {
    justify-content: flex-start;
  }

  .rk-filters-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .rk-filters-bar__label {
    border-right: none;
    border-bottom: 1px solid var(--rk-border);
    padding-right: 0;
    padding-bottom: 8px;
  }

  .rk-filters-bar__controls {
    flex-direction: column;
  }

  .rk-filter-chip,
  .rk-filter-select {
    width: 100%;
    max-width: none;
  }

  .rk-filter-chip {
    justify-content: flex-start;
  }

  .rk-notes-cell {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .q-pa-lg {
    padding: 14px;
  }

  .rk-main-title {
    font-size: 1.4rem;
  }

  .rk-control-row {
    padding: 12px 14px;
  }

  .rk-metrics-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .rk-metric-card__value {
    font-size: 1.3rem;
  }

  .rk-action-btn-labeled {
    font-size: 0.75rem;
    padding: 5px 10px !important;
  }
}
</style>