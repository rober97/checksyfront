<!-- src/views/Admin/RequestsPage.vue -->
<template>
  <q-page class="q-pa-lg" :class="pageBgClass">
    <!-- ===== Header Mejorado ===== -->
    <div class="row items-center q-mb-xl">
      <div class="col">
        <div class="text-h4 text-weight-bold text-primary rk-main-title">
          Solicitudes
          <q-badge v-if="pendingCount > 0" color="orange" floating class="rk-badge-floating">
            {{ pendingCount }} pendiente{{ pendingCount !== 1 ? 's' : '' }}
          </q-badge>
        </div>
        <div class="text-subtitle1 rk-subtitle">
          Gestiona y aprueba solicitudes del equipo
        </div>
      </div>
      <div class="col-auto">
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

    <!-- ===== Panel de Control Principal ===== -->
    <div class="rk-control-panel q-mb-lg">
      <div class="row items-center q-col-gutter-lg">
        <!-- Buscador Principal -->
        <div class="col-12 col-md-4">
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

        <!-- Filtros Compactos -->
        <div class="col-12 col-md-5">
          <div class="row items-center q-gutter-sm">
            <!-- Filtro Rápido de Estado -->
            <q-btn-dropdown
              dense
              outline
              :label="estadoLabel"
              icon="filter_alt"
              class="rk-filter-dropdown"
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

            <!-- Filtro de Tipo -->
            <q-select
              v-model="tipoFilter"
              :options="tipoOpts"
              dense
              outlined
              clearable
              emit-value
              map-options
              placeholder="Tipo"
              class="rk-type-select"
              style="min-width: 160px"
              @update:model-value="reload"
            >
              <template #prepend>
                <q-icon name="category" color="primary" />
              </template>
            </q-select>

            <!-- Fechas Compactas -->
            <q-btn-dropdown
              dense
              outline
              :label="dateRangeLabel"
              icon="event"
              class="rk-date-dropdown"
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
        </div>

        <!-- Acciones Principales -->
        <div class="col-12 col-md-3">
          <div class="row justify-end q-gutter-sm">
            <q-btn
              color="primary"
              icon="file_download"
              round
              dense
              class="rk-action-icon"
              @click="exportar"
            >
              <q-tooltip>Exportar CSV</q-tooltip>
            </q-btn>
            
            <q-btn
              :disable="!selection.length"
              color="positive"
              icon="task_alt"
              round
              dense
              class="rk-action-icon"
              @click="bulkApprove"
            >
              <q-tooltip>Aprobar selección ({{ selection.length }})</q-tooltip>
            </q-btn>
            
            <q-btn
              :disable="!selection.length"
              color="negative"
              icon="block"
              round
              dense
              class="rk-action-icon"
              @click="bulkReject"
            >
              <q-tooltip>Rechazar selección ({{ selection.length }})</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Métricas Visuales ===== -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-sm-3" v-for="metric in metrics" :key="metric.label">
        <q-card 
          class="rk-metric-card text-white text-center cursor-pointer"
          :class="metric.cardClass"
          @click="filterByMetric(metric)"
        >
          <q-card-section class="q-pa-md">
            <div class="row items-center no-wrap">
              <q-icon :name="metric.icon" size="32px" class="q-mr-sm" />
              <div class="col">
                <div class="text-h5 text-weight-bold">{{ metric.value }}</div>
                <div class="text-caption">{{ metric.label }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
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
              <div class="text-h6 text-grey-7 q-mb-xs">No hay solicitudes</div>
              <div class="text-caption text-grey-5 text-center">
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
              <div class="row items-center no-wrap">
                <q-avatar size="32px" class="q-mr-sm" color="primary" text-color="white">
                  {{ getInitials(p.row.empleado) }}
                </q-avatar>
                <div>
                  <div class="text-weight-medium">{{ p.row.empleado || "—" }}</div>
                  <div class="text-caption text-grey-6">{{ p.row.departamento || "Sin departamento" }}</div>
                </div>
              </div>
            </q-td>
          </template>

          <!-- Columna: Tipo -->
          <template #body-cell-tipo="p">
            <q-td :props="p">
              <q-badge :color="tipoColor(p.row.tipo)" class="rk-type-badge">
                <q-icon :name="tipoIcon(p.row.tipo)" class="q-mr-xs" size="14px" />
                {{ p.row.tipo }}
              </q-badge>
            </q-td>
          </template>

          <!-- Columna: Fechas -->
          <template #body-cell-fechaInicio="p">
            <q-td :props="p">
              <div class="column">
                <div class="text-weight-medium">{{ formatDate(p.row.fechaInicio) }}</div>
                <div class="text-caption text-grey-6">{{ formatDateDistance(p.row.fechaInicio) }}</div>
              </div>
            </q-td>
          </template>

          <template #body-cell-fechaFin="p">
            <q-td :props="p">
              <div class="column">
                <div class="text-weight-medium">{{ formatDate(p.row.fechaFin) }}</div>
                <div class="text-caption text-grey-6">{{ formatDuration(p.row.fechaInicio, p.row.fechaFin) }}</div>
              </div>
            </q-td>
          </template>

          <!-- Columna: Estado -->
          <template #body-cell-estado="p">
            <q-td :props="p">
              <q-badge 
                :color="estadoColor(p.row.estado)" 
                class="rk-status-badge"
                :class="`rk-status-${p.row.estado.toLowerCase()}`"
              >
                <q-icon :name="estadoIcon(p.row.estado)" class="q-mr-xs" size="12px" />
                {{ p.row.estado }}
              </q-badge>
            </q-td>
          </template>

          <!-- Columna: Notas -->
          <template #body-cell-notas="p">
            <q-td :props="p">
              <div v-if="p.row.notas" class="rk-notes-cell">
                <div class="rk-notes-text">{{ p.row.notas }}</div>
              </div>
              <span v-else class="text-grey-6">—</span>
            </q-td>
          </template>

          <!-- Columna: Acciones -->
          <template #body-cell-actions="p">
            <q-td :props="p" class="text-right">
              <div class="row justify-end q-gutter-xs">
                <q-btn
                  v-if="p.row.estado === 'Pendiente'"
                  round
                  dense
                  flat
                  icon="check"
                  color="positive"
                  size="sm"
                  class="rk-action-btn"
                  @click="approveRow(p.row)"
                >
                  <q-tooltip>Aprobar</q-tooltip>
                </q-btn>
                
                <q-btn
                  v-if="p.row.estado === 'Pendiente'"
                  round
                  dense
                  flat
                  icon="close"
                  color="negative"
                  size="sm"
                  class="rk-action-btn"
                  @click="rejectRow(p.row)"
                >
                  <q-tooltip>Rechazar</q-tooltip>
                </q-btn>
                
                <q-btn
                  round
                  dense
                  flat
                  icon="visibility"
                  color="grey-6"
                  size="sm"
                  class="rk-action-btn"
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
      <q-toolbar class="bg-primary text-white">
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

const $q = useQuasar();
const store = useRequestsStore();

/* Tema Premium */
const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() =>
  isDark.value ? "bg-dark-gradient text-white" : "bg-light-gradient text-dark"
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
  sortBy: "fechaInicio",
  descending: false,
});

/* Opciones */
const estadoOpts = [
  { label: "Todas las solicitudes", value: "all", icon: "apps" },
  { label: "Pendientes", value: "Pendiente", icon: "hourglass_empty" },
  { label: "Aprobadas", value: "Aprobado", icon: "check_circle" },
  { label: "Rechazadas", value: "Rechazado", icon: "cancel" },
];

const tipoOpts = [
  { label: "Vacaciones", value: "Vacaciones" },
  { label: "Día compensatorio", value: "Día compensatorio" },
  { label: "Permiso personal", value: "Permiso personal" },
  { label: "Licencia médica", value: "Licencia médica" },
  { label: "Permiso familiar", value: "Permiso familiar" },
];

/* Computed Labels */
const estadoLabel = computed(() => {
  const opt = estadoOpts.find(o => o.value === estadoFilter.value);
  return opt ? opt.label : "Estado";
});

const dateRangeLabel = computed(() => {
  if (!desde.value && !hasta.value) return "Rango de fechas";
  if (desde.value && hasta.value) return `${desde.value} - ${hasta.value}`;
  return desde.value ? `Desde ${desde.value}` : `Hasta ${hasta.value}`;
});

/* Métricas Visuales */
const totalCount = computed(() => store.items?.length || 0);
const pendingCount = computed(() => 
  store.items?.filter(r => r.estado === "Pendiente").length || 0
);
const approvedCount = computed(() => 
  store.items?.filter(r => r.estado === "Aprobado").length || 0
);
const rejectedCount = computed(() => 
  store.items?.filter(r => r.estado === "Rechazado").length || 0
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
    filter: () => { estadoFilter.value = "Pendiente"; reload(); }
  },
  {
    label: "Aprobadas",
    value: approvedCount.value,
    icon: "check_circle",
    color: "positive",
    cardClass: "bg-positive-gradient",
    filter: () => { estadoFilter.value = "Aprobado"; reload(); }
  },
  {
    label: "Rechazadas",
    value: rejectedCount.value,
    icon: "cancel",
    color: "negative",
    cardClass: "bg-negative-gradient",
    filter: () => { estadoFilter.value = "Rechazado"; reload(); }
  }
]);

/* Filtrado */
const rawRows = computed(() => store.items || []);
const rowsView = computed(() => {
  const st = estadoFilter.value || "all";
  const tipo = tipoFilter.value;
  const d1 = desde.value;
  const d2 = hasta.value;

  return rawRows.value.filter((r) => {
    if (st !== "all" && (r.estado || "") !== st) return false;
    if (tipo && (r.tipo || "") !== tipo) return false;
    if (d1 && (r.fechaInicio || "") < d1) return false;
    if (d2 && (r.fechaFin || "") > d2) return false;
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
    name: "fechaInicio",
    label: "Inicio",
    field: "fechaInicio",
    align: "left",
    sortable: true,
    width: "140px"
  },
  {
    name: "fechaFin",
    label: "Fin",
    field: "fechaFin",
    align: "left",
    sortable: true,
    width: "140px"
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

/* Helpers Mejorados */
const estadoColor = (s) =>
  s === "Aprobado" ? "positive" : s === "Rechazado" ? "negative" : "orange";

const estadoIcon = (s) =>
  s === "Aprobado" ? "check_circle" : s === "Rechazado" ? "cancel" : "schedule";

const tipoColor = (t) => {
  const colors = {
    "Vacaciones": "blue",
    "Día compensatorio": "green",
    "Permiso personal": "purple",
    "Licencia médica": "orange",
    "Permiso familiar": "pink"
  };
  return colors[t] || "grey";
};

const tipoIcon = (t) => {
  const icons = {
    "Vacaciones": "beach_access",
    "Día compensatorio": "autorenew",
    "Permiso personal": "person",
    "Licencia médica": "local_hospital",
    "Permiso familiar": "family_restroom"
  };
  return icons[t] || "help";
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
  if (!start || !end) return "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24)) + 1;
  return `${days} día${days !== 1 ? 's' : ''}`;
};

/* Acciones */
const approveRow = async (row) => {
  $q.dialog({
    title: 'Confirmar aprobación',
    message: `¿Aprobar la solicitud de <strong>${row.empleado}</strong>?`,
    html: true,
    persistent: true,
    ok: {
      label: 'Aprobar',
      color: 'positive',
      flat: false
    },
    cancel: {
      label: 'Cancelar',
      color: 'grey',
      flat: true
    }
  }).onOk(async () => {
    try {
      await store.approveRequest(row._id);
      $q.notify({ 
        type: "positive", 
        message: "Solicitud aprobada",
        position: "top-right",
        timeout: 3000,
        icon: "check_circle"
      });
    } catch (e) {
      $q.notify({ 
        type: "negative", 
        message: "No se pudo aprobar",
        position: "top-right"
      });
    }
  });
};

const rejectRow = async (row) => {
  $q.dialog({
    title: 'Confirmar rechazo',
    message: `¿Rechazar la solicitud de <strong>${row.empleado}</strong>?`,
    html: true,
    persistent: true,
    ok: {
      label: 'Rechazar',
      color: 'negative',
      flat: false
    },
    cancel: {
      label: 'Cancelar',
      color: 'grey',
      flat: true
    }
  }).onOk(async () => {
    try {
      await store.rejectRequest(row._id);
      $q.notify({ 
        type: "positive", 
        message: "Solicitud rechazada",
        position: "top-right",
        timeout: 3000,
        icon: "cancel"
      });
    } catch (e) {
      $q.notify({ 
        type: "negative", 
        message: "No se pudo rechazar",
        position: "top-right"
      });
    }
  });
};

const verDetalle = (row) => {
  $q.dialog({
    title: `Solicitud de ${row.empleado}`,
    message: `
      <div class="q-gutter-y-md">
        <div class="row">
          <div class="col-4"><strong>Tipo:</strong></div>
          <div class="col-8">
            <q-badge color="${tipoColor(row.tipo)}">${row.tipo}</q-badge>
          </div>
        </div>
        <div class="row">
          <div class="col-4"><strong>Período:</strong></div>
          <div class="col-8">${formatDate(row.fechaInicio)} - ${formatDate(row.fechaFin)}</div>
        </div>
        <div class="row">
          <div class="col-4"><strong>Duración:</strong></div>
          <div class="col-8">${formatDuration(row.fechaInicio, row.fechaFin)}</div>
        </div>
        <div class="row">
          <div class="col-4"><strong>Estado:</strong></div>
          <div class="col-8">
            <q-badge color="${estadoColor(row.estado)}">${row.estado}</q-badge>
          </div>
        </div>
        ${row.notas ? `
        <div class="row">
          <div class="col-4"><strong>Notas:</strong></div>
          <div class="col-8">${row.notas}</div>
        </div>
        ` : ''}
      </div>
    `,
    html: true,
    ok: {
      label: "Cerrar",
      color: "primary",
      flat: true
    },
    class: isDark.value ? "bg-dark-card text-white" : ""
  });
};

const bulkApprove = async () => {
  $q.dialog({
    title: 'Aprobar selección',
    message: `¿Aprobar <strong>${selection.value.length}</strong> solicitud${selection.value.length !== 1 ? 'es' : ''} seleccionada${selection.value.length !== 1 ? 's' : ''}?`,
    html: true,
    persistent: true,
    ok: {
      label: `Aprobar (${selection.value.length})`,
      color: 'positive',
      flat: false
    },
    cancel: {
      label: 'Cancelar',
      color: 'grey',
      flat: true
    }
  }).onOk(async () => {
    try {
      const ids = selection.value.map((r) => r._id);
      await store.bulkUpdate(ids, "Aprobado");
      selection.value = [];
      $q.notify({ 
        type: "positive", 
        message: `${ids.length} solicitudes aprobadas`,
        position: "top-right",
        timeout: 4000,
        icon: "check_circle"
      });
    } catch {
      $q.notify({ 
        type: "negative", 
        message: "No se pudo aprobar la selección",
        position: "top-right"
      });
    }
  });
};

const bulkReject = async () => {
  $q.dialog({
    title: 'Rechazar selección',
    message: `¿Rechazar <strong>${selection.value.length}</strong> solicitud${selection.value.length !== 1 ? 'es' : ''} seleccionada${selection.value.length !== 1 ? 's' : ''}?`,
    html: true,
    persistent: true,
    ok: {
      label: `Rechazar (${selection.value.length})`,
      color: 'negative',
      flat: false
    },
    cancel: {
      label: 'Cancelar',
      color: 'grey',
      flat: true
    }
  }).onOk(async () => {
    try {
      const ids = selection.value.map((r) => r._id);
      await store.bulkUpdate(ids, "Rechazado");
      selection.value = [];
      $q.notify({ 
        type: "positive", 
        message: `${ids.length} solicitudes rechazadas`,
        position: "top-right",
        timeout: 4000,
        icon: "cancel"
      });
    } catch {
      $q.notify({ 
        type: "negative", 
        message: "No se pudo rechazar la selección",
        position: "top-right"
      });
    }
  });
};

const exportar = async () => {
  try {
    const blob = await store.exportCSV({
      q: search.value,
      estado: estadoFilter.value === "all" ? "" : estadoFilter.value,
      tipo: tipoFilter.value || "",
      desde: desde.value || "",
      hasta: hasta.value || "",
      sortBy: pagination.value.sortBy,
      descending: pagination.value.descending,
    });
    const url = window.URL.createObjectURL(new Blob([blob]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `solicitudes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    $q.notify({ 
      type: "info", 
      message: "Exportación completada",
      position: "top-right",
      timeout: 3000,
      icon: "file_download"
    });
  } catch {
    $q.notify({ 
      type: "negative", 
      message: "No se pudo exportar",
      position: "top-right"
    });
  }
};

/* Filtros */
const filterByMetric = (metric) => {
  metric.filter();
};

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
/* ===== Variables CSS Mejoradas ===== */
:root {
  --rk-primary: #1976d2;
  --rk-primary-light: #42a5f5;
  --rk-positive: #4caf50;
  --rk-negative: #f44336;
  --rk-orange: #ff9800;
  --rk-purple: #9c27b0;
  --rk-pink: #e91e63;
  
  --rk-shadow-sm: 0 2px 12px rgba(0, 0, 0, 0.08);
  --rk-shadow-md: 0 8px 32px rgba(0, 0, 0, 0.12);
  --rk-shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.16);
  
  --rk-border-radius: 16px;
  --rk-border-radius-sm: 12px;
}

.body--dark {
  --rk-primary: #2196f3;
  --rk-primary-light: #64b5f6;
}

/* ===== Fondos con Gradientes ===== */
.bg-light-gradient {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.bg-dark-gradient {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.bg-primary-gradient {
  background: linear-gradient(135deg, var(--rk-primary) 0%, var(--rk-primary-light) 100%);
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

.bg-dark-card {
  background: #1e293b;
}

/* ===== Títulos ===== */
.rk-main-title {
  position: relative;
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.rk-badge-floating {
  position: absolute;
  top: -8px;
  right: -12px;
  font-size: 0.7rem;
}

.rk-subtitle {
  color: #64748b;
  font-size: 1.1rem;
}

.body--dark .rk-subtitle {
  color: #94a3b8;
}

/* ===== Panel de Control ===== */
.rk-control-panel {
  background: white;
  border-radius: var(--rk-border-radius);
  padding: 24px;
  box-shadow: var(--rk-shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.body--dark .rk-control-panel {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.rk-main-search :deep(.q-field__control) {
  border-radius: 12px;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.body--dark .rk-main-search :deep(.q-field__control) {
  background: #334155;
}

.rk-main-search :deep(.q-field__control:hover) {
  background: #f1f5f9;
  transform: translateY(-1px);
}

.body--dark .rk-main-search :deep(.q-field__control:hover) {
  background: #475569;
}

/* ===== Dropdowns ===== */
.rk-filter-dropdown,
.rk-date-dropdown {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.body--dark .rk-filter-dropdown,
.body--dark .rk-date-dropdown {
  border: 1px solid #475569;
}

.rk-filter-list {
  border-radius: 12px;
  padding: 8px 0;
}

.rk-filter-active {
  background: rgba(25, 118, 210, 0.08);
}

.body--dark .rk-filter-active {
  background: rgba(33, 150, 243, 0.12);
}

/* ===== Métricas ===== */
.rk-metric-card {
  border-radius: var(--rk-border-radius-sm);
  box-shadow: var(--rk-shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.rk-metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
}

.rk-metric-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--rk-shadow-md);
}

/* ===== Tarjeta Principal ===== */
.rk-main-card {
  border-radius: var(--rk-border-radius);
  box-shadow: var(--rk-shadow-md);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.body--dark .rk-main-card {
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* ===== Estado Vacío ===== */
.rk-empty-state {
  padding: 80px 40px;
}

/* ===== Badges ===== */
.rk-type-badge,
.rk-status-badge {
  border-radius: 8px;
  font-weight: 600;
  padding: 6px 12px;
  font-size: 0.8rem;
}

.rk-status-pendiente {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* ===== Celdas de Notas ===== */
.rk-notes-cell {
  max-width: 200px;
}

.rk-notes-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

/* ===== Botones de Acción ===== */
.rk-action-icon {
  transition: all 0.3s ease;
}

.rk-action-icon:hover:not(.disabled) {
  transform: scale(1.1);
}

.rk-action-btn {
  transition: all 0.2s ease;
}

.rk-action-btn:hover {
  transform: scale(1.15);
  background: rgba(0, 0, 0, 0.05);
}

.body--dark .rk-action-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* ===== Footer de Selección ===== */
.rk-selection-footer {
  position: sticky;
  bottom: 0;
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* ===== Tabla Premium ===== */
.rk-premium-table :deep(thead tr) {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.body--dark .rk-premium-table :deep(thead tr) {
  background: #1e293b;
  border-bottom: 2px solid #475569;
}

.rk-premium-table :deep(tbody tr) {
  transition: background-color 0.2s ease;
}

.rk-premium-table :deep(tbody tr:hover) {
  background: #f1f5f9;
}

.body--dark .rk-premium-table :deep(tbody tr:hover) {
  background: #334155;
}

.rk-premium-table :deep(.q-table__bottom) {
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.body--dark .rk-premium-table :deep(.q-table__bottom) {
  border-top: 1px solid #475569;
  background: #1e293b;
}

/* ===== Responsive ===== */
@media (max-width: 1024px) {
  .rk-main-title {
    font-size: 2rem;
  }
  
  .rk-control-panel {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .rk-main-title {
    font-size: 1.75rem;
  }
  
  .rk-control-panel {
    padding: 16px;
  }
  
  .rk-metric-card .text-h5 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .q-pa-lg {
    padding: 16px;
  }
  
  .rk-main-title {
    font-size: 1.5rem;
  }
  
  .rk-control-panel {
    padding: 12px;
  }
}
</style>