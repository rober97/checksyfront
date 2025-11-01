<!-- src/views/Attendance/AttendanceHistoryPage.vue -->
<template>
  <q-page class="q-pa-md" :class="pageBg">
    <!-- ===== Header unificado ===== -->
    <PageHeader
      icon="group"
      title="Historial de asistencias"
      help-text="AYUDA"
      :help-to="{ name: 'help.users' }"
    >
      <template #subtitle> Registros por colaborador </template>
    </PageHeader>

    <!-- ===== Card + Tabla principal ===== -->
    <q-card
      flat
      bordered
      class="rk-card soft-card fit column"
      :class="cardTone"
    >
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
        :table-class="tableClass"
        :binary-state-sort="true"
        :flat="true"
        :bordered="true"
        :wrap-cells="false"
        selection="none"
      >
        <!-- Buscador en top-right -->
        <template #top-right>
          <div class="row items-center q-gutter-sm">
            <q-input
              v-model="search"
              dense
              outlined
              clearable
              debounce="250"
              placeholder="Buscar por nombre o RUT…"
              class="rk-pill rk-search"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
        </template>

        <!-- Columna: total -->
        <template #body-cell-total="props">
          <q-td :props="props">
            <q-badge color="positive">{{ props.row.total }} días</q-badge>
          </q-td>
        </template>

        <!-- Acciones -->
        <template #body-cell-actions="props">
          <q-td :props="props" align="center">
            <q-btn
              size="sm"
              color="primary"
              label="Ver Historial"
              icon="timeline"
              @click="verHistorial(props.row)"
            />
          </q-td>
        </template>

        <!-- No data -->
        <template #no-data>
          <div class="full-width column items-center q-pa-lg text-grey-7">
            <q-icon name="event_busy" size="48px" class="q-mb-sm" />
            <div class="text-subtitle1 q-mb-xs">Sin registros</div>
            <div class="text-caption">Aún no hay asistencias cargadas.</div>
          </div>
        </template>
      </DynamicDataTable>
    </q-card>

    <!-- ===== Dialogo PRO ===== -->
    <q-dialog
      v-model="modalHistorial"
      persistent
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card
        class="q-pa-md glassy-card"
        style="
          width: 1180px;
          max-width: 98vw;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
        "
      >
        <!-- Header -->
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="col-auto">
              <div class="text-h6">
                📅 Historial de: {{ historialEmpleado?.nombre || "—" }}
              </div>
              <div class="text-subtitle2 text-grey-7">
                RUT: {{ historialEmpleado?.rut || "—" }}
              </div>
            </div>

            <div class="col-auto row items-center q-gutter-sm">
              <q-chip
                outline
                color="primary"
                clickable
                @click="setQuickRange('hoy')"
                >Hoy</q-chip
              >
              <q-chip
                outline
                color="primary"
                clickable
                @click="setQuickRange('semana')"
                >Esta semana</q-chip
              >
              <q-chip
                outline
                color="primary"
                clickable
                @click="setQuickRange('mes')"
                >Este mes</q-chip
              >
              <q-btn flat round icon="close" v-close-popup />
            </div>
          </div>
        </q-card-section>

        <q-separator inset />

        <!-- Filtros -->
        <q-card-section class="q-pt-md q-pb-sm">
          <div class="row q-col-gutter-md items-end">
            <div class="col-12 col-sm-4">
              <q-input
                filled
                v-model="rangoDesde"
                label="Desde"
                type="date"
                dense
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                filled
                v-model="rangoHasta"
                label="Hasta"
                type="date"
                dense
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
                label="Tipo de marca"
                emit-value
                map-options
              />
            </div>
          </div>

          <div class="row q-mt-sm items-center q-gutter-sm">
            <q-btn
              outline
              color="warning"
              label="Limpiar rango"
              icon="clear"
              @click="limpiarRango"
            />
            <q-space />
            <q-badge color="primary" align="middle" class="q-pa-sm">
              Total: {{ conteos.total }}
            </q-badge>
            <q-badge color="positive" class="q-pa-sm">
              Entradas: {{ conteos.entradas }}
            </q-badge>
            <q-badge color="negative" class="q-pa-sm">
              Salidas: {{ conteos.salidas }}
            </q-badge>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Tabs -->
        <q-card-section class="q-pt-none">
          <q-tabs
            v-model="tab"
            dense
            class="text-primary"
            align="left"
            narrow-indicator
          >
            <q-tab name="timeline" icon="timeline" label="Línea de tiempo" />
            <q-tab name="tabla" icon="table_chart" label="Tabla" />
          </q-tabs>
        </q-card-section>

        <q-separator />

        <!-- Contenido -->
        <q-card-section
          style="
            overflow: hidden;
            flex: 1;
            display: flex;
            flex-direction: column;
          "
        >
          <q-tab-panels v-model="tab" animated style="flex: 1">
            <!-- TIMELINE -->
            <q-tab-panel name="timeline" style="height: 100%; padding: 0">
              <div
                v-if="isFetching"
                class="column flex flex-center"
                style="height: 100%"
              >
                <q-spinner size="lg" color="primary" />
                <div class="text-grey q-mt-sm">Cargando historial…</div>
              </div>

              <template v-else>
                <template v-if="gruposPorDia.length">
                  <q-virtual-scroll
                    :items="gruposPorDia"
                    separator
                    style="height: 100%"
                    :virtual-scroll-item-size="64"
                  >
                    <template #default="{ item }">
                      <q-expansion-item
                        dense
                        expand-separator
                        icon="event"
                        :label="item.fechaLarga"
                        :caption="`${item.items.length} marca(s)`"
                        default-opened
                        header-class="bg-grey-1"
                      >
                        <q-list bordered class="rounded-borders">
                          <q-item v-for="m in item.items" :key="m._id">
                            <q-item-section avatar>
                              <q-avatar
                                :color="estadoColor(m.tipo)"
                                text-color="white"
                                icon="access_time"
                              />
                            </q-item-section>
                            <q-item-section>
                              <q-item-label class="text-weight-medium">
                                {{ capitalizar(m.tipo || "—") }}
                                <q-badge
                                  outline
                                  class="q-ml-sm"
                                  :color="estadoColor(m.tipo)"
                                >
                                  {{ horaBonita(m.timestamp) }}
                                </q-badge>
                              </q-item-label>
                              <q-item-label caption>
                                Comentario: {{ m.note || "—" }}
                                <span
                                  v-if="m.ubicacion?.lat && m.ubicacion?.lng"
                                >
                                  • Ubicación:
                                  <a
                                    href=""
                                    @click.prevent="openInMaps(m)"
                                    class="text-primary"
                                  >
                                    {{ m.ubicacion.lat }}, {{ m.ubicacion.lng }}
                                  </a>
                                </span>
                              </q-item-label>
                            </q-item-section>
                            <q-item-section side>
                              <q-icon
                                :name="estadoIcono(m.tipo)"
                                :color="estadoColor(m.tipo)"
                                size="md"
                              />
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-expansion-item>
                    </template>
                  </q-virtual-scroll>
                </template>
                <div v-else class="text-grey text-center q-mt-md">
                  No hay asistencias registradas para este rango.
                </div>
              </template>
            </q-tab-panel>

            <!-- TABLA -->
            <q-tab-panel name="tabla" style="height: 100%; padding: 0">
              <DynamicDataTable
                :rows="historialFiltradoYTipado"
                :columns="columnsHistorial"
                row-key="_id"
                :pagination="{
                  page: 1,
                  rowsPerPage: 15,
                  sortBy: 'fecha',
                  descending: true,
                }"
                :rows-per-page-options="[10, 15, 30]"
                :loading="isFetching"
                loading-label="Cargando historial…"
                no-data-label="Sin marcas"
                :filter="''"
                :table-class="tableClass"
                :binary-state-sort="true"
                :flat="true"
                :bordered="true"
                :wrap-cells="false"
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
                      v-if="
                        props.row.ubicacion?.lat && props.row.ubicacion?.lng
                      "
                      dense
                      size="sm"
                      outline
                      color="primary"
                      icon="map"
                      label="Ver mapa"
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

        <!-- Acciones -->
        <q-card-actions align="between">
          <div class="text-caption text-grey">
            Mostrando {{ conteos.total }} marcas ({{
              conteos.entradas
            }}
            entradas, {{ conteos.salidas }} salidas)
          </div>
          <div class="row q-gutter-sm">
            <q-btn
              flat
              color="secondary"
              icon="print"
              label="Imprimir"
              @click="imprimirHistorial"
            />
            <q-btn
              flat
              color="green"
              icon="file_download"
              label="Exportar Excel"
              @click="exportarExcel"
            />
            <q-btn flat label="Cerrar" color="primary" v-close-popup />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useQuasar, date } from "quasar";
import DynamicDataTable from "@/components/shared/DynamicDataTable.vue";
import { useAsistenciaStore } from "@/stores/asistenciaStore";
import PageHeader from "@/components/shared/PageHeader.vue";

const $q = useQuasar();
const asistenciaStore = useAsistenciaStore();

/* ===== Tema ===== */
const isDark = computed(() => $q.dark.isActive);
const pageBg = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"
);
const cardTone = computed(() =>
  isDark.value ? "bg-grey-9  text-white" : "bg-white"
);
const titleClass = "text-primary";
const tableClass = computed(() => [
  "rk-scrollable",
  "rk-compact",
  isDark.value ? "bg-grey-9 text-white" : "bg-white text-dark",
]);

/* ===== Estado ===== */
const search = ref("");
const loading = ref(true);
const mainPagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: "nombre",
  descending: false,
});

/* ===== Datos listado principal ===== */
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
    name: "nombre",
    label: "Nombre",
    field: "nombre",
    align: "left",
    sortable: true,
  },
  { name: "rut", label: "RUT", field: "rut", align: "left", sortable: true },
  {
    name: "total",
    label: "Asistencias",
    field: "total",
    align: "center",
    sortable: true,
  },
  {
    name: "actions",
    label: "Acciones",
    field: "__actions",
    align: "center",
    sortable: false,
  },
];

/* ===== Carga inicial ===== */
onMounted(async () => {
  loading.value = true;
  try {
    await asistenciaStore.fetchRecordsByEmployee();
  } catch {
    $q.notify({ type: "negative", message: "Error al cargar asistencias" });
  } finally {
    loading.value = false;
  }
});

/* ===== Modal / Historial por empleado ===== */
const modalHistorial = ref(false);
const historialEmpleado = ref(null);
const isFetching = ref(false);
const rangoDesde = ref("");
const rangoHasta = ref("");
const filtroTipo = ref(""); // '', 'entrada', 'salida'
const tab = ref("timeline");

const verHistorial = async (empleado) => {
  try {
    rangoDesde.value = "";
    rangoHasta.value = "";
    filtroTipo.value = "";
    tab.value = "timeline";
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
    modalHistorial.value = true;
  } catch (e) {
    $q.notify({ type: "negative", message: "No se pudo cargar el historial" });
  } finally {
    isFetching.value = false;
  }
};

/* Refetch por rango */
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
    // preserva nombre/rut
    historialEmpleado.value = {
      ...(data || { asistencias: [] }),
      nombre: historialEmpleado.value?.nombre,
      rut: historialEmpleado.value?.rut,
      _id: historialEmpleado.value?._id,
    };
  } catch {
    $q.notify({ type: "negative", message: "Error al filtrar por rango" });
  } finally {
    isFetching.value = false;
  }
};

/* Rango rápido / limpiar */
const limpiarRango = () => {
  rangoDesde.value = "";
  rangoHasta.value = "";
};
const setQuickRange = (tipo) => {
  const hoy = new Date();
  const fmt = (d) => date.formatDate(d, "YYYY-MM-DD");
  if (tipo === "hoy") {
    const d = fmt(hoy);
    rangoDesde.value = d;
    rangoHasta.value = d;
  } else if (tipo === "semana") {
    rangoDesde.value = fmt(date.startOfDate(hoy, "week"));
    rangoHasta.value = fmt(date.endOfDate(hoy, "week"));
  } else if (tipo === "mes") {
    rangoDesde.value = fmt(date.startOfDate(hoy, "month"));
    rangoHasta.value = fmt(date.endOfDate(hoy, "month"));
  }
};

/* Historial filtrado (cliente) */
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

/* Filtro por tipo + orden desc */
const historialFiltradoYTipado = computed(() => {
  const arr = historialFiltrado.value;
  if (!arr.length) return [];
  const base = filtroTipo.value
    ? arr.filter((a) => a.tipo === filtroTipo.value)
    : arr;
  return base.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

/* Agrupación por día */
const gruposPorDia = computed(() => {
  const map = new Map();
  for (const m of historialFiltradoYTipado.value) {
    const clave = date.formatDate(m.timestamp, "YYYY-MM-DD");
    if (!map.has(clave)) {
      const fecha = new Date(m.timestamp);
      const fechaLarga = new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "2-digit",
      }).format(fecha);
      map.set(clave, { fechaClave: clave, fechaLarga, items: [] });
    }
    map.get(clave).items.push(m);
  }
  return Array.from(map.values());
});

/* Conteos */
const conteos = computed(() => {
  let entradas = 0,
    salidas = 0;
  for (const m of historialFiltradoYTipado.value) {
    if (m.tipo === "entrada") entradas++;
    else if (m.tipo === "salida") salidas++;
  }
  return { entradas, salidas, total: historialFiltradoYTipado.value.length };
});

/* Tabla del historial (tab) */
const columnsHistorial = [
  {
    name: "fecha",
    label: "Fecha",
    field: (r) => date.formatDate(r.timestamp, "YYYY-MM-DD"),
    align: "left",
    sortable: true,
  },
  {
    name: "hora",
    label: "Hora",
    field: "hora",
    align: "left",
    sortable: false,
  },
  { name: "tipo", label: "Tipo", field: "tipo", align: "left", sortable: true },
  {
    name: "ubicacion",
    label: "Ubicación",
    field: "ubicacion",
    align: "left",
    sortable: false,
  },
];

/* UI helpers */
const estadoColor = (t) =>
  t === "entrada" ? "positive" : t === "salida" ? "negative" : "grey";
const estadoIcono = (t) =>
  t === "entrada" ? "login" : t === "salida" ? "logout" : "help";
const capitalizar = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const horaBonita = (ts) => date.formatDate(ts, "HH:mm");
const openInMaps = (m) => {
  const lat = m?.ubicacion?.lat,
    lng = m?.ubicacion?.lng;
  if (lat && lng)
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
};

/* Export / imprimir */
const exportarExcel = async () => {
  if (!historialEmpleado.value?._id) return;
  try {
    await asistenciaStore.exportEmployeeExcel({
      employeeId: historialEmpleado.value._id,
      from: rangoDesde.value || null,
      to: rangoHasta.value || null,
    });
    $q.notify({ type: "positive", message: "Exportación iniciada" });
  } catch {
    $q.notify({ type: "negative", message: "Error al exportar asistencia" });
  }
};
const imprimirHistorial = () => window.print();
</script>

<style scoped>
/* ===== Tokens ===== */
:root {
  --rk-border: rgba(0, 0, 0, 0.08);
  --rk-card: #ffffff;
  --rk-muted: #667085;
  --rk-soft: #f5f7fb;
}
.body--dark {
  --rk-border: rgba(255, 255, 255, 0.1);
  --rk-card: #101318;
  --rk-muted: #9aa3b2;
  --rk-soft: #0f1216;
}

/* ===== Head ===== */
.rk-head {
  padding: 12px 10px;
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    rgba(33, 150, 243, 0.1),
    rgba(33, 150, 243, 0.03)
  );
  border: 1px solid var(--rk-border);
  backdrop-filter: blur(8px) saturate(1.1);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.06);
}
.body--dark .rk-head {
  background: linear-gradient(
    180deg,
    rgba(33, 150, 243, 0.14),
    rgba(33, 150, 243, 0.06)
  );
}
.rk-head__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  color: var(--q-primary);
  background: radial-gradient(
    circle at 30% 20%,
    rgba(33, 150, 243, 0.35),
    rgba(33, 150, 243, 0) 70%
  );
  border: 1px solid rgba(33, 150, 243, 0.28);
  box-shadow: inset 0 0 16px rgba(33, 150, 243, 0.18);
}
.rk-title {
  font-weight: 800;
  letter-spacing: 0.2px;
}
.rk-sub {
  margin-top: -2px;
  color: var(--rk-muted);
}

/* ===== Card contenedora ===== */
.rk-card {
  border-radius: 16px;
  border: 1px solid var(--rk-border);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

/* ===== Pills / inputs ===== */
.rk-pill :deep(.q-field__control) {
  border-radius: 12px !important;
  background: color-mix(in oklab, var(--rk-soft) 82%, transparent);
}
.rk-search {
  min-width: 260px;
}

/* ===== Dialog “glassy” ===== */
.glassy-card {
  --card-bg: rgba(255, 255, 255, 0.88);
  --card-border: rgba(60, 60, 67, 0.25);
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  --radius: 16px;
  backdrop-filter: saturate(1.25) blur(10px);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.body--dark .glassy-card {
  --card-bg: rgba(18, 19, 22, 0.82);
  --card-border: rgba(255, 255, 255, 0.07);
  --shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
}
.glassy-card :deep(.q-separator) {
  opacity: 0.7;
}
.glassy-card :deep(.q-card__section) {
  padding-top: 14px;
  padding-bottom: 14px;
}
.glassy-card :deep(.text-h6) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  letter-spacing: 0.2px;
}
.glassy-card :deep(.q-chip) {
  border-radius: 999px;
  font-weight: 600;
  padding: 0 10px;
  transition: transform 0.08s, box-shadow 0.15s;
}
.glassy-card :deep(.q-chip.q-chip--clickable:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
}

/* Virtual / expansion */
.glassy-card :deep(.q-virtual-scroll) {
  padding-bottom: 8px;
}
.glassy-card :deep(.q-expansion-item) {
  margin: 8px 0;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.15s, transform 0.06s;
}
.glassy-card :deep(.q-expansion-item:hover) {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}
.glassy-card :deep(.q-expansion-item .q-item) {
  background: transparent !important;
}
.glassy-card :deep(.q-expansion-item__container > .q-item) {
  backdrop-filter: saturate(1.1);
  font-weight: 700;
}
.rounded-borders {
  border-radius: 12px;
}
.glassy-card :deep(.q-list .q-item) {
  border-bottom: 1px dashed rgba(127, 127, 127, 0.2);
}
.glassy-card :deep(.q-list .q-item:last-child) {
  border-bottom: none;
}
.glassy-card :deep(.q-item__label + .q-item__label) {
  margin-top: 2px;
}

/* Avatares glow */
.glassy-card :deep(.q-avatar.bg-positive) {
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.15);
}
.glassy-card :deep(.q-avatar.bg-negative) {
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.15);
}

/* Badges */
.glassy-card :deep(.q-badge) {
  border-radius: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.glassy-card :deep(.q-badge[outline]) {
  border-width: 2px;
  font-weight: 800;
}

/* Tabla del panel */
.glassy-card :deep(.q-table) {
  border-radius: 12px;
  overflow: hidden;
}
.glassy-card :deep(.q-table__top, .q-table__bottom) {
  background: transparent;
}
.glassy-card :deep(.q-table thead th) {
  font-weight: 800;
  letter-spacing: 0.3px;
}
.glassy-card :deep(.q-table__body .q-tr:nth-child(even)) {
  background: rgba(125, 125, 125, 0.06);
}
.body--dark .glassy-card :deep(.q-table__body .q-tr:nth-child(even)) {
  background: rgba(255, 255, 255, 0.03);
}

/* Scrollbar sutil */
.glassy-card :deep(*::-webkit-scrollbar) {
  height: 10px;
  width: 10px;
}
.glassy-card :deep(*::-webkit-scrollbar-thumb) {
  background: rgba(127, 127, 127, 0.35);
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.glassy-card :deep(*::-webkit-scrollbar-thumb:hover) {
  background: rgba(127, 127, 127, 0.55);
}
.glassy-card :deep(a.text-primary) {
  text-decoration: none;
  border-bottom: 1px dotted currentColor;
  transition: opacity 0.15s;
}
.glassy-card :deep(a.text-primary:hover) {
  opacity: 0.85;
}
.glassy-card :deep(.q-card__actions) {
  border-top: 1px solid var(--card-border);
}
.glassy-card :deep(.q-card__actions .q-btn) {
  border-radius: 10px;
  font-weight: 700;
}
.q-tab-panels {
  overflow-y: auto;
  background: transparent;
}
</style>
