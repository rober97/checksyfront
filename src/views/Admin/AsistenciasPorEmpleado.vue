<!-- src/views/Attendance/AttendanceHistoryPage.vue -->
<template>
  <q-page class="rk-attendance-page">
    <!-- Premium Header Component Style -->
    <div class="rk-page-header">
      <div class="rk-header-content">
        <div class="rk-header-left">
          <div class="rk-header-icon">
            <q-icon name="group" />
            <div class="rk-icon-pulse"></div>
          </div>
          <div class="rk-header-text">
            <h1 class="rk-page-title">Historial de Asistencias</h1>
            <p class="rk-page-subtitle">Registros por colaborador</p>
          </div>
        </div>
        <div class="rk-header-actions">
          <button class="rk-action-btn" @click="loadData" :disabled="loading">
            <q-icon name="refresh" :class="{ 'rotate-animation': loading }" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Table Card -->
    <div class="rk-table-container">
      <!-- Search Bar -->
      <div class="rk-search-section">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          placeholder="Buscar por nombre o RUT..."
          class="rk-search-input"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Table -->
      <DynamicDataTable
        :rows="rowsMain"
        :columns="columns"
        row-key="_id"
        :pagination="mainPagination"
        :rows-per-page-options="[10, 20, 50]"
        :loading="loading"
        loading-label="Cargando asistencias…"
        no-data-label="No hay registros"
        :filter="search"
        table-class="rk-scrollable"
        :binary-state-sort="true"
        :flat="true"
        :bordered="true"
        selection="none"
      >
        <!-- Total column -->
        <template #body-cell-total="props">
          <q-td :props="props">
            <q-badge color="positive" class="rk-count-badge">
              <q-icon name="event_available" size="14px" class="q-mr-xs" />
              {{ props.row.total }} días
            </q-badge>
          </q-td>
        </template>

        <!-- Actions column -->
        <template #body-cell-actions="props">
          <q-td :props="props" align="center">
            <q-btn
              unelevated
              dense
              no-caps
              color="primary"
              icon="timeline"
              label="Ver Historial"
              size="sm"
              @click="verHistorial(props.row)"
            />
          </q-td>
        </template>
      </DynamicDataTable>
    </div>

    <!-- Modal Compacto -->
    <q-dialog
      v-model="modalHistorial"
      persistent
      transition-show="slide-up"
      transition-hide="slide-down"
      class="rk-history-dialog"
    >
      <q-card class="rk-history-card">
        <!-- Header -->
        <q-card-section class="rk-modal-header">
          <div class="row items-center justify-between">
            <div class="col-auto">
              <div class="text-h6 text-weight-bold">
                📅 {{ historialEmpleado?.nombre || "—" }}
              </div>
              <div class="text-subtitle2 text-grey-7">
                RUT: {{ historialEmpleado?.rut || "—" }}
              </div>
            </div>
            <div class="col-auto">
              <q-btn flat round dense icon="close" v-close-popup />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Quick Filters -->
        <q-card-section class="q-pb-none">
          <div class="row q-col-gutter-sm">
            <div class="col-auto">
              <q-chip
                outline
                color="primary"
                clickable
                @click="setQuickRange('hoy')"
              >
                Hoy
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip
                outline
                color="primary"
                clickable
                @click="setQuickRange('semana')"
              >
                Esta semana
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip
                outline
                color="primary"
                clickable
                @click="setQuickRange('mes')"
              >
                Este mes
              </q-chip>
            </div>
          </div>
        </q-card-section>

        <!-- Filters -->
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-input
                filled
                dense
                v-model="rangoDesde"
                label="Desde"
                type="date"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                filled
                dense
                v-model="rangoHasta"
                label="Hasta"
                type="date"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                filled
                dense
                v-model="filtroTipo"
                :options="[
                  { label: 'Todos', value: '' },
                  { label: 'Entradas', value: 'entrada' },
                  { label: 'Salidas', value: 'salida' },
                ]"
                label="Tipo"
                emit-value
                map-options
              />
            </div>
          </div>

          <!-- Stats -->
          <div class="row q-mt-sm items-center q-gutter-sm">
            <q-btn
              outline
              dense
              color="warning"
              label="Limpiar"
              icon="clear"
              size="sm"
              @click="limpiarRango"
            />
            <q-space />
            <q-badge color="primary">Total: {{ conteos.total }}</q-badge>
            <q-badge color="positive">Entradas: {{ conteos.entradas }}</q-badge>
            <q-badge color="negative">Salidas: {{ conteos.salidas }}</q-badge>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Tabs -->
        <q-card-section class="q-py-none">
          <q-tabs
            v-model="tab"
            dense
            class="text-primary"
            active-color="primary"
            indicator-color="primary"
            align="left"
          >
            <q-tab name="timeline" icon="timeline" label="Timeline" />
            <q-tab name="tabla" icon="table_chart" label="Tabla" />
          </q-tabs>
        </q-card-section>

        <q-separator />

        <!-- Content -->
        <q-card-section class="rk-modal-content">
          <q-tab-panels v-model="tab" animated>
            <!-- Timeline -->
            <q-tab-panel name="timeline">
              <div v-if="isFetching" class="text-center q-pa-md">
                <q-spinner size="lg" color="primary" />
                <div class="text-grey q-mt-sm">Cargando...</div>
              </div>

              <div v-else-if="gruposPorDia.length">
                <q-list separator>
                  <q-expansion-item
                    v-for="grupo in gruposPorDia"
                    :key="grupo.fechaClave"
                    expand-separator
                    icon="event"
                    :label="grupo.fechaLarga"
                    :caption="`${grupo.items.length} marca(s)`"
                    default-opened
                  >
                    <q-card flat>
                      <q-list>
                        <q-item v-for="m in grupo.items" :key="m._id">
                          <q-item-section avatar>
                            <q-avatar
                              :color="estadoColor(m.tipo)"
                              text-color="white"
                              :icon="estadoIcono(m.tipo)"
                            />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>
                              <span class="text-weight-bold">
                                {{ capitalizar(m.tipo || "—") }}
                              </span>
                              <q-badge outline class="q-ml-sm" :color="estadoColor(m.tipo)">
                                {{ horaBonita(m.timestamp) }}
                              </q-badge>
                            </q-item-label>
                            <q-item-label caption>
                              {{ m.note || "Sin comentario" }}
                              <span v-if="m.ubicacion?.lat">
                                •
                                <a
                                  href="#"
                                  @click.prevent="openInMaps(m)"
                                  class="text-primary"
                                >
                                  Ver mapa
                                </a>
                              </span>
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-card>
                  </q-expansion-item>
                </q-list>
              </div>

              <div v-else class="text-center text-grey q-pa-xl">
                <q-icon name="event_busy" size="64px" />
                <div class="q-mt-md">No hay registros en este rango</div>
              </div>
            </q-tab-panel>

            <!-- Tabla -->
            <q-tab-panel name="tabla">
              <DynamicDataTable
                :rows="historialFiltradoYTipado"
                :columns="columnsHistorial"
                row-key="_id"
                :pagination="{
                  page: 1,
                  rowsPerPage: 10,
                  sortBy: 'fecha',
                  descending: true,
                }"
                :rows-per-page-options="[10, 20, 30]"
                :loading="isFetching"
                loading-label="Cargando…"
                no-data-label="Sin marcas"
                table-class="rk-scrollable"
                :binary-state-sort="true"
                :flat="true"
                :bordered="true"
                selection="none"
              >
                <template #body-cell-tipo="props">
                  <q-td :props="props">
                    <q-badge :color="estadoColor(props.row.tipo)" outline>
                      {{ capitalizar(props.row.tipo) }}
                    </q-badge>
                  </q-td>
                </template>

                <template #body-cell-hora="props">
                  <q-td :props="props">
                    {{ horaBonita(props.row.timestamp) }}
                  </q-td>
                </template>

                <template #body-cell-ubicacion="props">
                  <q-td :props="props">
                    <q-btn
                      v-if="props.row.ubicacion?.lat"
                      dense
                      flat
                      size="sm"
                      color="primary"
                      icon="map"
                      label="Mapa"
                      @click="openInMaps(props.row)"
                    />
                    <span v-else class="text-grey">—</span>
                  </q-td>
                </template>
              </DynamicDataTable>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>

        <q-separator />

        <!-- Footer -->
        <q-card-actions align="between" class="q-pa-md">
          <div class="text-caption text-grey">
            {{ conteos.total }} marcas ({{ conteos.entradas }} entradas, {{ conteos.salidas }} salidas)
          </div>
          <div class="row q-gutter-sm">
            <q-btn
              flat
              dense
              color="secondary"
              icon="print"
              label="Imprimir"
              @click="imprimirHistorial"
            />
            <q-btn
              flat
              dense
              color="green"
              icon="file_download"
              label="Excel"
              @click="exportarExcel"
            />
            <q-btn flat dense color="primary" label="Cerrar" v-close-popup />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar, date } from 'quasar';
import DynamicDataTable from '@/components/shared/DynamicDataTable.vue';
import { useAsistenciaStore } from '@/stores/asistenciaStore';

const $q = useQuasar();
const asistenciaStore = useAsistenciaStore();

/* State */
const search = ref('');
const loading = ref(true);
const mainPagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'nombre',
  descending: false,
});

/* Main data */
const rawEmployees = computed(() =>
  Array.isArray(asistenciaStore.employeeRecords)
    ? asistenciaStore.employeeRecords
    : []
);

const getAsistCount = (row) =>
  Array.isArray(row?.asistencias) ? row.asistencias.length : row?.total || 0;

const rowsMain = computed(() =>
  rawEmployees.value.map((e) => ({
    ...e,
    total: getAsistCount(e),
  }))
);

const columns = [
  {
    name: 'nombre',
    label: 'NOMBRE',
    field: 'nombre',
    align: 'left',
    sortable: true,
  },
  {
    name: 'rut',
    label: 'RUT',
    field: 'rut',
    align: 'left',
    sortable: true,
  },
  {
    name: 'total',
    label: 'ASISTENCIAS',
    field: 'total',
    align: 'center',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'ACCIONES',
    field: '__actions',
    align: 'center',
    sortable: false,
  },
];

/* Load data */
const loadData = async () => {
  loading.value = true;
  try {
    await asistenciaStore.fetchRecordsByEmployee();
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar asistencias' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => loadData());

/* Modal */
const modalHistorial = ref(false);
const historialEmpleado = ref(null);
const isFetching = ref(false);
const rangoDesde = ref('');
const rangoHasta = ref('');
const filtroTipo = ref('');
const tab = ref('timeline');

const verHistorial = async (empleado) => {
  try {
    rangoDesde.value = '';
    rangoHasta.value = '';
    filtroTipo.value = '';
    tab.value = 'timeline';
    
    modalHistorial.value = true;
    isFetching.value = true;
    
    const data = await asistenciaStore.fetchHistorialEmpleado({
      employeeId: empleado._id,
    });
    
    historialEmpleado.value = data || {
      asistencias: [],
      nombre: empleado?.nombre,
      rut: empleado?.rut,
      _id: empleado?._id,
    };
  } catch (e) {
    modalHistorial.value = false;
    $q.notify({ type: 'negative', message: 'No se pudo cargar el historial' });
  } finally {
    isFetching.value = false;
  }
};

/* Refetch on range */
watch([rangoDesde, rangoHasta], () => {
  if (historialEmpleado.value?._id) recargarHistorialConRango();
});

const recargarHistorialConRango = async () => {
  try {
    isFetching.value = true;
    const data = await asistenciaStore.fetchHistorialEmpleado({
      employeeId: historialEmpleado.value._id,
      from: rangoDesde.value || null,
      to: rangoHasta.value || null,
    });
    historialEmpleado.value = {
      ...(data || { asistencias: [] }),
      nombre: historialEmpleado.value?.nombre,
      rut: historialEmpleado.value?.rut,
      _id: historialEmpleado.value?._id,
    };
  } catch {
    $q.notify({ type: 'negative', message: 'Error al filtrar' });
  } finally {
    isFetching.value = false;
  }
};

/* Quick filters */
const limpiarRango = () => {
  rangoDesde.value = '';
  rangoHasta.value = '';
};

const setQuickRange = (tipo) => {
  const hoy = new Date();
  const fmt = (d) => date.formatDate(d, 'YYYY-MM-DD');
  if (tipo === 'hoy') {
    const d = fmt(hoy);
    rangoDesde.value = d;
    rangoHasta.value = d;
  } else if (tipo === 'semana') {
    rangoDesde.value = fmt(date.startOfDate(hoy, 'week'));
    rangoHasta.value = fmt(date.endOfDate(hoy, 'week'));
  } else if (tipo === 'mes') {
    rangoDesde.value = fmt(date.startOfDate(hoy, 'month'));
    rangoHasta.value = fmt(date.endOfDate(hoy, 'month'));
  }
};

/* Filtered data */
const historialFiltrado = computed(() => {
  const asistencias = historialEmpleado.value?.asistencias || [];
  if (!asistencias.length) return [];
  return asistencias.filter((a) => {
    if (rangoDesde.value || rangoHasta.value) {
      const f = new Date(a.timestamp);
      f.setHours(0, 0, 0, 0);
      const d = rangoDesde.value ? new Date(rangoDesde.value) : null;
      if (d) d.setHours(0, 0, 0, 0);
      const h = rangoHasta.value ? new Date(rangoHasta.value) : null;
      if (h) h.setHours(23, 59, 59, 999);
      if ((d && f < d) || (h && f > h)) return false;
    }
    return true;
  });
});

const historialFiltradoYTipado = computed(() => {
  const arr = historialFiltrado.value;
  if (!arr.length) return [];
  const base = filtroTipo.value
    ? arr.filter((a) => a.tipo === filtroTipo.value)
    : arr;
  return base.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

/* Group by day */
const gruposPorDia = computed(() => {
  const map = new Map();
  for (const m of historialFiltradoYTipado.value) {
    const clave = date.formatDate(m.timestamp, 'YYYY-MM-DD');
    if (!map.has(clave)) {
      const fecha = new Date(m.timestamp);
      const fechaLarga = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      }).format(fecha);
      map.set(clave, { fechaClave: clave, fechaLarga, items: [] });
    }
    map.get(clave).items.push(m);
  }
  return Array.from(map.values());
});

/* Counts */
const conteos = computed(() => {
  let entradas = 0,
    salidas = 0;
  for (const m of historialFiltradoYTipado.value) {
    if (m.tipo === 'entrada') entradas++;
    else if (m.tipo === 'salida') salidas++;
  }
  return { entradas, salidas, total: historialFiltradoYTipado.value.length };
});

/* History table columns */
const columnsHistorial = [
  {
    name: 'fecha',
    label: 'FECHA',
    field: (r) => date.formatDate(r.timestamp, 'YYYY-MM-DD'),
    align: 'left',
    sortable: true,
  },
  {
    name: 'hora',
    label: 'HORA',
    field: 'hora',
    align: 'left',
    sortable: false,
  },
  {
    name: 'tipo',
    label: 'TIPO',
    field: 'tipo',
    align: 'left',
    sortable: true,
  },
  {
    name: 'ubicacion',
    label: 'UBICACIÓN',
    field: 'ubicacion',
    align: 'left',
    sortable: false,
  },
];

/* Helpers */
const estadoColor = (t) =>
  t === 'entrada' ? 'positive' : t === 'salida' ? 'negative' : 'grey';
const estadoIcono = (t) =>
  t === 'entrada' ? 'login' : t === 'salida' ? 'logout' : 'help';
const capitalizar = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const horaBonita = (ts) => date.formatDate(ts, 'HH:mm');
const openInMaps = (m) => {
  const lat = m?.ubicacion?.lat,
    lng = m?.ubicacion?.lng;
  if (lat && lng)
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
};

/* Export/Print */
const exportarExcel = async () => {
  if (!historialEmpleado.value?._id) return;
  try {
    await asistenciaStore.exportEmployeeExcel({
      employeeId: historialEmpleado.value._id,
      from: rangoDesde.value || null,
      to: rangoHasta.value || null,
    });
    $q.notify({ type: 'positive', message: 'Exportación iniciada' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al exportar' });
  }
};

const imprimirHistorial = () => window.print();
</script>

<style scoped>
/* Page */
.rk-attendance-page {
  padding: 24px;
  min-height: 100vh;
}

/* ==========================================
   HEADER - Matching Liquidaciones
   ========================================== */
.rk-page-header {
  margin-bottom: 24px;
  animation: fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rk-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
}

.body--dark .rk-header-content {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(6, 182, 212, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.rk-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.rk-header-icon {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
}

.rk-header-icon .q-icon {
  font-size: 32px;
  color: #fff;
  z-index: 1;
}

.rk-icon-pulse {
  position: absolute;
  inset: -6px;
  background: linear-gradient(135deg, #06b6d4, #14b8a6);
  border-radius: 20px;
  opacity: 0;
  filter: blur(10px);
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%,
  100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }
}

.rk-page-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: rgba(15, 23, 42, 0.95);
  letter-spacing: -0.5px;
}

.body--dark .rk-page-title {
  color: rgba(255, 255, 255, 0.95);
}

.rk-page-subtitle {
  font-size: 1rem;
  color: rgba(15, 23, 42, 0.7);
  margin: 0;
  font-weight: 500;
}

.body--dark .rk-page-subtitle {
  color: rgba(255, 255, 255, 0.7);
}

.rk-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(6, 182, 212, 0.05);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 12px;
  color: rgba(15, 23, 42, 0.95);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.body--dark .rk-action-btn {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.rk-action-btn:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
}

.rk-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rotate-animation {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ==========================================
   TABLE CONTAINER
   ========================================== */
.rk-table-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(6, 182, 212, 0.12);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
  overflow: hidden;
}

.body--dark .rk-table-container {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(6, 182, 212, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.rk-search-section {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.1);
}

.body--dark .rk-search-section {
  border-bottom-color: rgba(6, 182, 212, 0.15);
}

.rk-search-input {
  max-width: 500px;
}

.rk-count-badge {
  font-weight: 700;
  padding: 6px 12px;
}

/* ==========================================
   MODAL COMPACTO
   ========================================== */
.rk-history-dialog :deep(.q-dialog__backdrop) {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.rk-history-card {
  width: 900px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.rk-modal-header {
  background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%);
  color: #fff;
}

.rk-modal-header .text-h6 {
  color: #fff;
}

.rk-modal-header .text-subtitle2 {
  color: rgba(255, 255, 255, 0.8);
}

.rk-modal-content {
  flex: 1;
  overflow: auto;
  max-height: 50vh;
}

/* ==========================================
   RESPONSIVE
   ========================================== */
@media (max-width: 767px) {
  .rk-attendance-page {
    padding: 16px;
  }

  .rk-header-content {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }

  .rk-header-icon {
    width: 52px;
    height: 52px;
  }

  .rk-page-title {
    font-size: 1.5rem;
  }

  .rk-action-btn {
    width: 100%;
    justify-content: center;
  }

  .rk-history-card {
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    border-radius: 0;
  }
}
</style>