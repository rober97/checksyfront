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
                {{ props.row.asistencias.length }} días
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

    <!-- Modal de historial -->
    <q-dialog v-model="modalHistorial" persistent>
      <q-card style="min-width: 500px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">
            📅 Historial de: {{ historialEmpleado?.nombre }}
          </div>
          <div class="text-subtitle2 text-grey">
            RUT: {{ historialEmpleado?.rut }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md q-mb-md">
            <q-input
              filled
              v-model="rangoDesde"
              label="Desde"
              type="date"
              dense
            />
            <q-input
              filled
              v-model="rangoHasta"
              label="Hasta"
              type="date"
              dense
            />
          </div>

          <q-btn
            outline
            color="warning"
            label="Limpiar rango"
            icon="clear"
            class="q-mb-md"
            @click="
              () => {
                rangoDesde = '';
                rangoHasta = '';
              }
            "
          />

          <q-timeline
            color="primary"
            layout="dense"
            v-if="historialFiltrado.length"
          >
            <q-timeline-entry
              v-for="(a, i) in historialFiltrado"
              :key="i"
              :title="a.fecha"
              :subtitle="a.estado"
              :icon="estadoIcono(a.estado)"
              :color="estadoColor(a.estado)"
            />
          </q-timeline>

          <div v-else class="text-grey text-center q-mt-md">
            No hay asistencias registradas para este rango.
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="between">
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
          <q-btn
            flat
            color="green"
            icon="file_download"
            label="Exportar Excel"
            @click="exportarExcel"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useQuasar } from "quasar";
import { useAsistenciaStore } from "@/stores/asistenciaStore";

const $q = useQuasar();
const asistenciaStore = useAsistenciaStore();

const search = ref("");
const modalHistorial = ref(false);
const historialEmpleado = ref(null);
const rangoDesde = ref("");
const rangoHasta = ref("");
const loading = ref(true);

// Cargar asistencias al montar
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

watch([rangoDesde, rangoHasta], () => {
  if (historialEmpleado.value?._id) {
    recargarHistorialConRango();
  }
});

const columns = [
  { name: "nombre", label: "Nombre", field: "nombre", align: "left" },
  { name: "rut", label: "RUT", field: "rut", align: "left" },
  { name: "total", label: "Asistencias", field: "total", align: "center" },
  { name: "actions", label: "Acciones", field: "actions", align: "center" },
];

const filtrados = computed(() => {
  if (loading.value || !asistenciaStore.employeeRecords) return [];

  const term = search.value.toLowerCase();
  return asistenciaStore.employeeRecords.filter(
    (e) =>
      e.nombre?.toLowerCase().includes(term) ||
      e.rut?.toLowerCase().includes(term)
  );
});

const verHistorial = async (empleado) => {
  try {
    rangoDesde.value = "";
    rangoHasta.value = "";
    loading.value = true;

    const data = await asistenciaStore.fetchHistorialEmpleado({
      employeeId: empleado._id,
    });
    historialEmpleado.value = data;
    modalHistorial.value = true;
  } catch (error) {
    $q.notify({ type: "negative", message: "No se pudo cargar el historial" });
  } finally {
    loading.value = false;
  }
};

const recargarHistorialConRango = async () => {
  try {
    loading.value = true;
    const data = await asistenciaStore.fetchHistorialEmpleado({
      employeeId: historialEmpleado.value._id,
      from: rangoDesde.value || null,
      to: rangoHasta.value || null,
    });
    historialEmpleado.value = data;
  } catch (err) {
    $q.notify({ type: "negative", message: "Error al filtrar por rango" });
  } finally {
    loading.value = false;
  }
};

const historialFiltrado = computed(() => {
  if (!historialEmpleado.value?.asistencias) return [];

  return historialEmpleado.value.asistencias.filter((a) => {
    if (!rangoDesde.value && !rangoHasta.value) return true;
    const fecha = new Date(a.fecha);
    const desde = rangoDesde.value ? new Date(rangoDesde.value) : null;
    const hasta = rangoHasta.value ? new Date(rangoHasta.value) : null;
    return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
  });
});

const estadoColor = (estado) => {
  switch (estado?.toLowerCase()) {
    case "presente":
      return "green";
    case "ausente":
      return "red";
    case "justificado":
      return "orange";
    default:
      return "grey";
  }
};

const estadoIcono = (estado) => {
  switch (estado?.toLowerCase()) {
    case "presente":
      return "check_circle";
    case "ausente":
      return "cancel";
    case "justificado":
      return "gavel";
    default:
      return "help";
  }
};

const exportarExcel = async () => {
  if (!historialEmpleado.value?._id) return;

  try {
    await asistenciaStore.exportEmployeeExcel({
      employeeId: historialEmpleado.value._id,
      from: rangoDesde.value || null,
      to: rangoHasta.value || null,
    });
  } catch {
    $q.notify({ type: "negative", message: "Error al exportar asistencia" });
  }
};
</script>

<style scoped>
.asistencias-empleado-page {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
