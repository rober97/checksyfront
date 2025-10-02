<template>
  <q-page padding class="asistencias-empleado-page">
    <q-card flat bordered class="q-pa-md">
      <q-card-section>
        <div class="text-h5 text-primary q-mb-md">
          📋 Asistencias por Empleado
        </div>

        <q-input
          filled
          v-model="search"
          label="🔎 Buscar por nombre o RUT"
          dense
          debounce="300"
          class="q-mb-md"
          clearable
        />

        <q-table
          :rows="filtrados"
          :columns="columns"
          row-key="_id"
          flat
          bordered
          separator="horizontal"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #body-cell-total="props">
            <q-td>
              <q-badge color="positive">
                {{ getAsistCount(props.row) }} días
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td align="center">
              <q-btn
                size="sm"
                color="primary"
                label="Ver Historial"
                icon="history"
                @click="verHistorial(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Dialogo PRO -->
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
                📅 Historial de: {{ historialEmpleado?.nombre || '—' }}
              </div>
              <div class="text-subtitle2 text-grey-7">
                RUT: {{ historialEmpleado?.rut || '—' }}
              </div>
            </div>

            <div class="col-auto row items-center q-gutter-sm">
              <q-chip outline color="primary" clickable @click="setQuickRange('hoy')">Hoy</q-chip>
              <q-chip outline color="primary" clickable @click="setQuickRange('semana')">Esta semana</q-chip>
              <q-chip outline color="primary" clickable @click="setQuickRange('mes')">Este mes</q-chip>
              <q-btn flat round icon="close" v-close-popup />
            </div>
          </div>
        </q-card-section>

        <q-separator inset />

        <!-- Filtros -->
        <q-card-section class="q-pt-md q-pb-sm">
          <div class="row q-col-gutter-md items-end">
            <div class="col-12 col-sm-4">
              <q-input filled v-model="rangoDesde" label="Desde" type="date" dense />
            </div>
            <div class="col-12 col-sm-4">
              <q-input filled v-model="rangoHasta" label="Hasta" type="date" dense />
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
            <q-btn outline color="warning" label="Limpiar rango" icon="clear" @click="limpiarRango" />
            <q-space />
            <q-badge color="primary" align="middle" class="q-pa-sm">
              Total: {{ (historialFiltradoYTipado && historialFiltradoYTipado.length) || 0 }}
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
          <q-tabs v-model="tab" dense class="text-primary" align="left" narrow-indicator>
            <q-tab name="timeline" icon="timeline" label="Línea de tiempo" />
            <q-tab name="tabla" icon="table_chart" label="Tabla" />
          </q-tabs>
        </q-card-section>

        <q-separator />

        <!-- Contenido -->
        <q-card-section style="overflow: hidden; flex: 1; display: flex; flex-direction: column;">
          <q-tab-panels v-model="tab" animated style="flex:1;">
            <!-- TIMELINE -->
            <q-tab-panel name="timeline" style="height:100%; padding:0;">
              <div v-if="isFetching" class="column flex flex-center" style="height:100%;">
                <q-spinner size="lg" color="primary" />
                <div class="text-grey q-mt-sm">Cargando historial…</div>
              </div>

              <template v-else>
                <template v-if="gruposPorDia.length">
                  <q-virtual-scroll
                    :items="gruposPorDia"
                    separator
                    style="height: 100%;"
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
                              <q-avatar :color="estadoColor(m.tipo)" text-color="white" icon="access_time" />
                            </q-item-section>

                            <q-item-section>
                              <q-item-label class="text-weight-medium">
                                {{ capitalizar(m.tipo || '—') }}
                                <q-badge outline class="q-ml-sm" :color="estadoColor(m.tipo)">
                                  {{ horaBonita(m.timestamp) }}
                                </q-badge>
                              </q-item-label>
                              <q-item-label caption>
                                Comentario: {{ m.note }}
                                <span v-if="m.ubicacion?.lat && m.ubicacion?.lng">
                                  • Ubicación:
                                  <a href="" @click.prevent="openInMaps(m)" class="text-primary">
                                    {{ m.ubicacion.lat }}, {{ m.ubicacion.lng }}
                                  </a>
                                </span>
                              </q-item-label>
                            </q-item-section>

                            <q-item-section side>
                              <q-icon :name="estadoIcono(m.tipo)" :color="estadoColor(m.tipo)" size="md" />
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
            <q-tab-panel name="tabla" style="height:100%; padding:0;">
              <q-table
                flat
                bordered
                :rows="historialFiltradoYTipado"
                :columns="columnsHistorial"
                row-key="_id"
                :pagination="{ rowsPerPage: 15 }"
                class="fit"
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
                      v-if="props.row.ubicacion?.lat && props.row.ubicacion?.lng"
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
              </q-table>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>

        <q-separator />

        <!-- Acciones -->
        <q-card-actions align="between">
          <div class="text-caption text-grey">
            Mostrando {{ conteos.total }} marcas ({{ conteos.entradas }} entradas, {{ conteos.salidas }} salidas)
          </div>
          <div class="row q-gutter-sm">
            <q-btn flat color="secondary" icon="print" label="Imprimir" @click="imprimirHistorial" />
            <q-btn flat color="green" icon="file_download" label="Exportar Excel" @click="exportarExcel" />
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
import { useAsistenciaStore } from "@/stores/asistenciaStore";

const $q = useQuasar();
const asistenciaStore = useAsistenciaStore();

const search = ref("");
const modalHistorial = ref(false);
const historialEmpleado = ref(null);

const rangoDesde = ref("");
const rangoHasta = ref("");
const filtroTipo = ref(""); // '', 'entrada', 'salida'

const loading = ref(true);          // carga de la tabla principal
const isFetching = ref(false);      // carga del historial dentro del diálogo
const tab = ref("timeline");

/* ===== Helpers generales ===== */
const getAsistCount = (row) => Array.isArray(row?.asistencias) ? row.asistencias.length : (row?.total || 0);

/* ===== Carga inicial ===== */
onMounted(async () => {
  loading.value = true;
  try {
    await asistenciaStore.fetchRecordsByEmployee();
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al cargar asistencias" });
  } finally {
    loading.value = false;
  }
});

/* ===== Refetch por rango (servidor) ===== */
watch([rangoDesde, rangoHasta], () => {
  if (historialEmpleado.value?._id) {
    recargarHistorialConRango();
  }
});

/* ===== Tabla principal ===== */
const columns = [
  { name: "nombre", label: "Nombre", field: "nombre", align: "left" },
  { name: "rut", label: "RUT", field: "rut", align: "left" },
  { name: "total", label: "Asistencias", field: "total", align: "center" },
  { name: "actions", label: "Acciones", field: "actions", align: "center" },
];

const filtrados = computed(() => {
  if (loading.value || !asistenciaStore.employeeRecords) return [];
  const term = (search.value || "").toLowerCase();
  const rows = asistenciaStore.employeeRecords || [];
  if (!term) return rows;

  return rows.filter(
    (e) =>
      e?.nombre?.toLowerCase?.().includes(term) ||
      e?.rut?.toLowerCase?.().includes(term)
  );
});

/* ===== Acciones ===== */
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
    historialEmpleado.value = data || { asistencias: [] };
    modalHistorial.value = true;
  } catch (error) {
    $q.notify({ type: "negative", message: "No se pudo cargar el historial" });
  } finally {
    isFetching.value = false;
  }
};

const recargarHistorialConRango = async () => {
  try {
    isFetching.value = true;
    const data = await asistenciaStore.fetchHistorialEmpleado({
      employeeId: historialEmpleado.value._id,
      from: rangoDesde.value || null,
      to: rangoHasta.value || null,
    });
    historialEmpleado.value = data || { asistencias: [] };
  } catch (err) {
    $q.notify({ type: "negative", message: "Error al filtrar por rango" });
  } finally {
    isFetching.value = false;
  }
};

/* ===== Rango rápido y limpiar ===== */
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
    const start = date.startOfDate(hoy, "week");
    const end = date.endOfDate(hoy, "week");
    rangoDesde.value = fmt(start);
    rangoHasta.value = fmt(end);
  } else if (tipo === "mes") {
    const start = date.startOfDate(hoy, "month");
    const end = date.endOfDate(hoy, "month");
    rangoDesde.value = fmt(start);
    rangoHasta.value = fmt(end);
  }
};

/* ===== Filtrado de historial (cliente) ===== */
const historialFiltrado = computed(() => {
  const asistencias = (historialEmpleado.value?.asistencias) || [];
  if (!asistencias.length) return [];

  return asistencias.filter((a) => {
    // Rango por día completo
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

/* ===== Filtro por tipo y orden ===== */
const historialFiltradoYTipado = computed(() => {
  const arr = historialFiltrado.value;
  if (!arr.length) return [];
  if (!filtroTipo.value) {
    return [...arr].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  return arr
    .filter((a) => a.tipo === filtroTipo.value)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

/* ===== Agrupación por día ===== */
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

      map.set(clave, {
        fechaClave: clave,
        fechaLarga, // ej: "jueves, 02 de octubre de 2025"
        items: []
      });
    }

    map.get(clave).items.push(m);
  }

  return Array.from(map.values());
});

/* ===== Conteos ===== */
const conteos = computed(() => {
  let entradas = 0;
  let salidas = 0;
  for (const m of historialFiltradoYTipado.value) {
    if (m.tipo === "entrada") entradas++;
    else if (m.tipo === "salida") salidas++;
  }
  return { entradas, salidas, total: historialFiltradoYTipado.value.length };
});

/* ===== Tabla del historial (tab 2) ===== */
const columnsHistorial = [
  { name: "fecha", label: "Fecha", field: (r) => date.formatDate(r.timestamp, "YYYY-MM-DD"), align: "left" },
  { name: "hora", label: "Hora", field: "hora", align: "left" },
  { name: "tipo", label: "Tipo", field: "tipo", align: "left" },
  { name: "ubicacion", label: "Ubicación", field: "ubicacion", align: "left" },
];

/* ===== Helpers de UI ===== */
const estadoColor = (tipo) =>
  tipo === "entrada" ? "positive" : tipo === "salida" ? "negative" : "grey";
const estadoIcono = (tipo) =>
  tipo === "entrada" ? "login" : tipo === "salida" ? "logout" : "help";
const capitalizar = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const horaBonita = (ts) => date.formatDate(ts, "HH:mm");

const openInMaps = (m) => {
  const lat = m?.ubicacion?.lat;
  const lng = m?.ubicacion?.lng;
  if (lat && lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank");
  }
};

/* ===== Export / Imprimir ===== */
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

const imprimirHistorial = () => {
  window.print();
};
</script>

<style scoped>
/* ========= Layout general ========= */
.asistencias-empleado-page {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 24px;
}

/* ========= Card del diálogo “glassy” ========= */
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

/* Separadores y secciones más “aire” */
.glassy-card :deep(.q-separator) {
  opacity: 0.7;
}
.glassy-card :deep(.q-card__section) {
  padding-top: 14px;
  padding-bottom: 14px;
}

/* ========= Encabezado del diálogo ========= */
.glassy-card :deep(.text-h6) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  letter-spacing: 0.2px;
}
.glassy-card :deep(.text-subtitle2) {
  margin-top: 2px;
}

/* Chips de rango rápido */
.glassy-card :deep(.q-chip) {
  border-radius: 999px;
  font-weight: 600;
  padding: 0 10px;
  transition: transform .08s ease, box-shadow .15s ease;
}
.glassy-card :deep(.q-chip.q-chip--clickable:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0,0,0,.06);
}

/* ========= Inputs y selects ========= */
.glassy-card :deep(.q-field--filled .q-field__control) {
  border-radius: 12px;
}
.glassy-card :deep(.q-field__native) {
  font-weight: 500;
}

/* ========= Badges métricos (Total/Entradas/Salidas) ========= */
.glassy-card :deep(.q-badge) {
  border-radius: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}

/* ========= Tabs ========= */
.glassy-card :deep(.q-tabs) {
  padding-left: 2px;
  padding-right: 2px;
}
.glassy-card :deep(.q-tab) {
  text-transform: none;
  font-weight: 700;
  letter-spacing: .2px;
}
.glassy-card :deep(.q-tab__indicator) {
  height: 3px;
  border-radius: 3px 3px 0 0;
}

/* ========= Virtual scroll / panel de contenido ========= */
.glassy-card :deep(.q-virtual-scroll) {
  padding-bottom: 8px;
}
.glassy-card :deep(.q-expansion-item) {
  margin: 8px 0;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow .15s ease, transform .06s ease;
}
.glassy-card :deep(.q-expansion-item:hover) {
  box-shadow: 0 6px 18px rgba(0,0,0,.06);
  transform: translateY(-1px);
}
.glassy-card :deep(.q-expansion-item .q-item) {
  background: transparent !important;
}

/* Encabezado de cada día */
.glassy-card :deep(.q-expansion-item__container > .q-item) {
  backdrop-filter: saturate(1.1);
  font-weight: 700;
}

/* Lista de marcas */
.rounded-borders {
  border-radius: 12px;
}
.glassy-card :deep(.q-list .q-item) {
  border-bottom: 1px dashed rgba(127,127,127,.2);
}
.glassy-card :deep(.q-list .q-item:last-child) {
  border-bottom: none;
}
.glassy-card :deep(.q-item__label + .q-item__label) {
  margin-top: 2px;
}

/* Avatares de estado con glow */
.glassy-card :deep(.q-avatar.bg-positive) {
  box-shadow: 0 0 0 3px rgba(46,204,113,.15);
}
.glassy-card :deep(.q-avatar.bg-negative) {
  box-shadow: 0 0 0 3px rgba(231,76,60,.15);
}

/* Badge de hora */
.glassy-card :deep(.q-badge[outline]) {
  border-width: 2px;
  font-weight: 800;
}

/* Botones del footer */
.glassy-card :deep(.q-card__actions) {
  border-top: 1px solid var(--card-border);
}
.glassy-card :deep(.q-card__actions .q-btn) {
  border-radius: 10px;
  font-weight: 700;
}

/* ========= Tabla (tab 2) ========= */
.glassy-card :deep(.q-table) {
  border-radius: 12px;
  overflow: hidden;
}
.glassy-card :deep(.q-table__top, .q-table__bottom) {
  background: transparent;
}
.glassy-card :deep(.q-table thead th) {
  font-weight: 800;
  letter-spacing: .3px;
}
.glassy-card :deep(.q-table__body .q-tr:nth-child(even)) {
  background: rgba(125,125,125,.06);
}
.body--dark .glassy-card :deep(.q-table__body .q-tr:nth-child(even)) {
  background: rgba(255,255,255,.03);
}

/* ========= Scrollbar sutil ========= */
.glassy-card :deep(*::-webkit-scrollbar) {
  height: 10px;
  width: 10px;
}
.glassy-card :deep(*::-webkit-scrollbar-thumb) {
  background: rgba(127,127,127,.35);
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.glassy-card :deep(*::-webkit-scrollbar-thumb:hover) {
  background: rgba(127,127,127,.55);
}

/* ========= Links a mapas ========= */
.glassy-card :deep(a.text-primary) {
  text-decoration: none;
  border-bottom: 1px dotted currentColor;
  transition: opacity .15s ease;
}
.glassy-card :deep(a.text-primary:hover) {
  opacity: .85;
}

/* ========= Micro-animaciones ========= */
.glassy-card :deep(.q-icon) {
  transition: transform .12s ease;
}
.glassy-card :deep(.q-item:hover .q-icon) {
  transform: scale(1.05);
}

/* ========= Responsive tweaks ========= */
@media (max-width: 768px) {
  .glassy-card {
    border-radius: 12px;
  }
  .glassy-card :deep(.q-card__section) {
    padding-left: 12px;
    padding-right: 12px;
  }
  .glassy-card :deep(.q-expansion-item) {
    margin: 6px 0;
  }
}

.q-tab-panels{
  overflow-y: auto;
  background: transparent;
}

</style>
