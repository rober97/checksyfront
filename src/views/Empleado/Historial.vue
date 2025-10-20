<template>
  <q-page
    class="q-pa-md"
    :class="isDark ? 'bg-grey-10 text-white' : 'bg-grey-1'"
  >
    <!-- HEADER -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-icon name="history" class="q-mr-sm" size="28px" color="primary" />
        <div class="column">
          <div class="text-h5" :class="isDark ? 'text-white' : 'text-primary'">
            Historial de Asistencias
          </div>
          <div class="text-caption text-grey-6">{{ subHeader }}</div>
          <div class="text-caption text-primary q-mt-xs">
            Periodo: <span class="text-weight-medium">{{ periodLabel }}</span>
          </div>
        </div>
      </div>

      <!-- CONTROLES -->
      <div class="row items-center header-actions q-gutter-sm">
        <!-- Presets bonitos (tu SegmentControl) -->
        <SegmentControl
          v-model="rangePreset"
          :options="presetOptions"
          @update:model-value="onPresetChange"
        />

        <!-- Custom range (solo activo cuando 'custom') -->
        <q-input
          dense
          standout="bg"
          v-model="dateRangeLabel"
          :disable="rangePreset !== 'custom'"
          placeholder="Rango personalizado"
          readonly
          class="rk-date"
        >
          <template #prepend><q-icon name="event" /></template>
          <q-popup-proxy
            transition-show="scale"
            transition-hide="scale"
            :breakpoint="520"
          >
            <q-date v-model="range" mask="YYYY-MM-DD" range minimal>
              <div class="row justify-end q-pa-sm q-gutter-sm">
                <q-btn flat label="Limpiar" @click="clearCustom" />
                <q-btn flat label="Cancelar" v-close-popup />
                <q-btn
                  color="primary"
                  label="Aplicar"
                  @click="applyCustom"
                  v-close-popup
                />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-input>

        <q-btn
          dense
          round
          icon="download"
          :disable="rows.length === 0 || exporting"
          @click="exportExcel"
        >
          <q-tooltip>Exportar Excel</q-tooltip>
        </q-btn>
        <q-btn
          dense
          round
          icon="ios_share"
          :disable="rows.length === 0"
          @click="exportCSV"
        >
          <q-tooltip>Descargar CSV</q-tooltip>
        </q-btn>
        <q-btn
          dense
          round
          icon="print"
          :disable="rows.length === 0"
          @click="printTable"
        >
          <q-tooltip>Imprimir</q-tooltip>
        </q-btn>
        <q-btn
          dense
          round
          icon="content_copy"
          :disable="rows.length === 0"
          @click="copySummary"
        >
          <q-tooltip>Copiar resumen</q-tooltip>
        </q-btn>
        <q-btn dense round icon="refresh" :loading="loading" @click="reload">
          <q-tooltip>Actualizar</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- RESUMEN -->
    <div class="row q-gutter-sm q-mb-md">
      <q-chip outline color="primary" icon="event_note"
        >Marcas: {{ rows.length }}</q-chip
      >
      <q-chip outline color="teal" icon="calendar_month"
        >Días: {{ dayCount }}</q-chip
      >
      <q-chip outline color="indigo" icon="schedule"
        >Horas totales: {{ totalWorkedHuman }}</q-chip
      >
      <q-chip v-if="offline" outline color="orange" icon="wifi_off"
        >Offline: usando caché</q-chip
      >
    </div>

    <!-- FILTROS SECUNDARIOS -->
    <div class="row items-center q-gutter-sm q-mb-sm">
      <q-input
        dense
        filled
        debounce="250"
        v-model="filter"
        placeholder="Buscar por fecha, tipo, ánimo, nota…"
        class="col-grow"
        clearable
      >
        <template #append><q-icon name="search" /></template>
      </q-input>

      <q-select
        dense
        filled
        v-model="filterTipo"
        :options="tipoOptions"
        emit-value
        map-options
        clearable
        standout="bg"
        style="min-width: 160px"
        placeholder="Tipo"
      />
      <q-select
        dense
        filled
        v-model="filterMood"
        :options="moodOptions"
        emit-value
        map-options
        clearable
        standout="bg"
        style="min-width: 170px"
        placeholder="Ánimo"
      />

      <q-btn flat dense icon="view_column">
        <q-menu>
          <q-list dense>
            <q-item
              v-for="col in toggleableColumns"
              :key="col.name"
              clickable
              @click="toggleColumn(col.name)"
            >
              <q-item-section>{{ col.label }}</q-item-section>
              <q-item-section side>
                <q-toggle
                  v-model="visible[col.name]"
                  @update:model-value="savePrefs"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <!-- ERRORES -->
    <q-banner
      v-if="error"
      rounded
      class="q-mb-md"
      :class="isDark ? 'bg-red-10 text-white' : 'bg-red-2'"
    >
      <q-icon name="error" class="q-mr-sm" color="negative" /> {{ error }}
      <q-btn flat dense label="Reintentar" class="q-ml-sm" @click="reload" />
    </q-banner>

    <!-- TABLA AGRUPADA POR DÍA -->
    <q-card flat bordered>
      <q-card-section>
        <div
          v-if="!loading && rows.length === 0"
          class="q-pa-xl text-center text-grey-6"
        >
          <q-icon name="hourglass_empty" size="48px" class="q-mb-sm" />
          <div>No hay asistencias en el período seleccionado.</div>
        </div>

        <q-virtual-scroll
          v-else
          :items="groupedDays"
          :virtual-scroll-item-size="56"
        >
          <template #default="{ item }">
            <!-- Header del día -->
            <div
              class="day-header row items-center justify-between"
              :class="
                isDark ? 'bg-grey-9 text-grey-3' : 'bg-grey-2 text-grey-8'
              "
            >
              <div class="row items-center">
                <q-btn
                  flat
                  round
                  dense
                  :icon="item.open ? 'expand_more' : 'chevron_right'"
                  @click="item.open = !item.open"
                  class="q-mr-xs"
                />
                <q-icon name="today" size="16px" class="q-mr-sm" />
                <div class="text-weight-bold">
                  {{ formatDateHuman(item.dateISO) }}
                </div>
                <q-chip
                  dense
                  outline
                  color="indigo"
                  class="q-ml-sm"
                  icon="schedule"
                >
                  {{ item.totalHuman }}
                </q-chip>
                <q-chip
                  dense
                  outline
                  color="primary"
                  class="q-ml-xs"
                  icon="list_alt"
                >
                  {{ item.rows.length }} marca{{
                    item.rows.length === 1 ? "" : "s"
                  }}
                </q-chip>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-btn flat dense icon="content_copy" @click="copyDay(item)"
                  >Copiar</q-btn
                >
                <q-btn flat dense icon="download" @click="exportDayCSV(item)"
                  >CSV</q-btn
                >
              </div>
            </div>

            <!-- Tabla del día -->
            <q-table
              v-show="item.open"
              :rows="item.rows"
              :columns="visibleColumns"
              row-key="__id"
              dense
              flat
              separator="horizontal"
              :loading="loading"
              hide-bottom
              :filter="tableFilterProxy"
              :pagination="dayPagination"
              :rows-per-page-options="[0]"
              :class="isDark ? 'bg-grey-10' : ''"
            >
              <template #body-cell-fecha="props">
                <q-td :props="props">
                  <div class="text-weight-medium">
                    {{ formatTime(props.row.timestamp) }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ formatDate(props.row.timestamp) }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-tipo="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    square
                    :color="
                      props.row.tipo === 'entrada' ? 'positive' : 'negative'
                    "
                    text-color="white"
                  >
                    <q-icon
                      :name="props.row.tipo === 'entrada' ? 'login' : 'logout'"
                      class="q-mr-xs"
                    />
                    {{ cap(props.row.tipo) }}
                  </q-chip>
                </q-td>
              </template>

              <template #body-cell-mood="props">
                <q-td :props="props">
                  <q-chip dense outline :color="moodColor(props.row.mood)">
                    <q-icon
                      :name="moodIcon(props.row.mood)"
                      size="16px"
                      class="q-mr-xs"
                    />
                    {{ moodLabel(props.row.mood) }}
                  </q-chip>
                </q-td>
              </template>

              <template #body-cell-note="props">
                <q-td :props="props">
                  <div class="ellipsis">
                    <q-icon name="notes" size="16px" class="q-mr-xs" />
                    <span :title="props.row.note || '—'">{{
                      props.row.note || "—"
                    }}</span>
                  </div>
                </q-td>
              </template>

              <template #body-cell-ubicacion="props">
                <q-td :props="props">
                  <div
                    v-if="props.row.ubicacion?.lat && props.row.ubicacion?.lng"
                    class="row items-center no-wrap"
                  >
                    <q-icon name="place" size="16px" class="q-mr-xs" />
                    <a
                      :href="mapsLink(props.row.ubicacion)"
                      target="_blank"
                      rel="noopener"
                      class="text-primary"
                    >
                      {{ locToText(props.row.ubicacion) }}
                    </a>
                  </div>
                  <span v-else class="text-grey-6">—</span>
                </q-td>
              </template>
            </q-table>
          </template>
        </q-virtual-scroll>

        <q-inner-loading :showing="loading">
          <q-spinner-ios size="32px" />
        </q-inner-loading>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useQuasar } from "quasar";
import SegmentControl from "@/components/SegmentControl.vue";
import { useAuthStore } from "@/stores/authStore";
import { useAsistenciaStore } from "@/stores/asistenciaStore";

/* ===== UI / THEME ===== */
const $q = useQuasar();
const isDark = computed(() => $q.dark.isActive);
const offline = computed(() => !navigator.onLine);

/* ===== STORES ===== */
const auth = useAuthStore();
const asistenciaStore = useAsistenciaStore();

/* ===== RANGE + PRESETS (usa tu SegmentControl) ===== */
const rangePreset = ref(localStorage.getItem("hist.preset") || "7d");
const range = ref({ from: null, to: null });

const presetOptions = [
  { label: "7D", value: "7d", icon: "bolt" },
  { label: "30D", value: "30d", icon: "calendar_view_month" },
  { label: "YTD", value: "ytd", icon: "timeline" },
  { label: "TODO", value: "all", icon: "all_inbox" },
  { label: "CUSTOM", value: "custom", icon: "tune" },
];

function setPresetDates(val) {
  const now = new Date();
  if (val === "7d") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    range.value = {
      from: s.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  } else if (val === "30d") {
    const s = new Date(now);
    s.setDate(s.getDate() - 29);
    range.value = {
      from: s.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  } else if (val === "ytd") {
    const s = new Date(now.getFullYear(), 0, 1);
    range.value = {
      from: s.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  } else if (val === "all") {
    range.value = { from: null, to: null };
  }
}
function onPresetChange(val) {
  localStorage.setItem("hist.preset", val);
  if (val !== "custom") {
    setPresetDates(val);
    reload();
  }
}
function clearCustom() {
  range.value = { from: null, to: null };
}
function applyCustom() {
  if (!range.value?.from && !range.value?.to) return;
  rangePreset.value = "custom";
  localStorage.setItem("hist.preset", "custom");
  reload();
}

const periodLabel = computed(() => {
  if (rangePreset.value === "7d") return "Últimos 7 días";
  if (rangePreset.value === "30d") return "Últimos 30 días";
  if (rangePreset.value === "ytd") return "Año en curso";
  if (rangePreset.value === "all") return "Todo";
  if (rangePreset.value === "custom") return dateRangeLabel.value;
  return "—";
});
const dateRangeLabel = computed(() => {
  if (rangePreset.value !== "custom") return "Rango personalizado";
  const f = range.value?.from,
    t = range.value?.to;
  if (!f && !t) return "Seleccionar rango";
  const fmt = (d) => d?.split("-").reverse().join("/") || "—";
  return `${fmt(f)} → ${fmt(t)}`;
});

/* ===== FILTERS ===== */
const filter = ref(localStorage.getItem("hist.filter") || "");
watch(filter, (v) => localStorage.setItem("hist.filter", v || ""));

const tipoOptions = [
  { label: "Entrada", value: "entrada" },
  { label: "Salida", value: "salida" },
];
const moodOptions = [
  { label: "Excelente", value: "great" },
  { label: "Bien", value: "good" },
  { label: "Normal", value: "ok" },
  { label: "Cansado", value: "tired" },
  { label: "Mal", value: "bad" },
];
const filterTipo = ref(localStorage.getItem("hist.tipo") || null);
const filterMood = ref(localStorage.getItem("hist.mood") || null);
watch(filterTipo, (v) => localStorage.setItem("hist.tipo", v || ""));
watch(filterMood, (v) => localStorage.setItem("hist.mood", v || ""));

/* ===== DATA ===== */
const userId = computed(() => auth?.user?.id || auth?.user?._id || null);
const raw = ref([]);
const loading = ref(false);
const error = ref(null);
const exporting = ref(false);

/* ===== COLUMNS & VISIBILITY ===== */
const allColumns = [
  {
    name: "fecha",
    label: "Fecha/Hora",
    align: "left",
    field: "timestamp",
    sortable: true,
  },
  { name: "tipo", label: "Tipo", align: "left", field: "tipo", sortable: true },
  { name: "mood", label: "Ánimo", align: "left", field: "mood" },
  { name: "note", label: "Nota", align: "left", field: "note" },
  { name: "ubicacion", label: "Ubicación", align: "left", field: "ubicacion" },
];
const visible = ref(JSON.parse(localStorage.getItem("hist.cols") || "{}"));
if (!Object.keys(visible.value).length) {
  allColumns.forEach((c) => (visible.value[c.name] = true));
}
function savePrefs() {
  localStorage.setItem("hist.cols", JSON.stringify(visible.value));
}
function toggleColumn(name) {
  visible.value[name] = !visible.value[name];
  savePrefs();
}
const visibleColumns = computed(() =>
  allColumns.filter((c) => visible.value[c.name])
);
const toggleableColumns = computed(() => allColumns);

/* ===== BUILD ROWS ===== */
const rows = computed(() => {
  const list = (raw.value || []).map((a) => ({
    __id: String(a._id || a.timestamp),
    dateISO: (a.timestamp
      ? new Date(a.timestamp)
      : new Date(a.createdAt || Date.now())
    )
      .toISOString()
      .slice(0, 10),
    timestamp: a.timestamp || a.createdAt,
    tipo: a.tipo,
    mood: a.mood || a.estadoAnimo || "",
    note: a.note || a.comentario || "",
    ubicacion: a.ubicacion || null,
  }));
  // filtros
  let filtered = list;
  if (filterTipo.value)
    filtered = filtered.filter((r) => r.tipo === filterTipo.value);
  if (filterMood.value)
    filtered = filtered.filter((r) => r.mood === filterMood.value);
  if (filter.value) {
    const q = filter.value.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        (r.tipo || "").includes(q) ||
        (r.mood || "").includes(q) ||
        (r.note || "").toLowerCase().includes(q) ||
        formatDate(r.timestamp).includes(q) ||
        formatTime(r.timestamp).includes(q)
    );
  }
  return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

/* ===== GROUP BY DAY + WORKED TIME ===== */
const groupedDays = computed(() => {
  // agrupa
  const map = new Map();
  rows.value.forEach((r) => {
    if (!map.has(r.dateISO)) map.set(r.dateISO, []);
    map.get(r.dateISO).push(r);
  });
  // calcula tiempo trabajado por día (pareo entrada→salida en orden cronológico)
  const out = [];
  for (const [dateISO, list] of map.entries()) {
    const dayRows = [...list].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    let minutes = 0;
    for (let i = 0; i < dayRows.length - 1; i++) {
      const a = dayRows[i],
        b = dayRows[i + 1];
      if (a.tipo === "entrada" && b.tipo === "salida") {
        minutes += Math.max(
          0,
          (new Date(b.timestamp) - new Date(a.timestamp)) / 60000
        );
        i++; // saltar el par
      }
    }
    out.push({
      dateISO,
      rows: dayRows,
      minutes,
      totalHuman: toHumanMinutes(minutes),
      open: true,
    });
  }
  // orden descendente por fecha
  return out.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
});

const dayCount = computed(() => groupedDays.value.length);
const totalWorkedHuman = computed(() =>
  toHumanMinutes(groupedDays.value.reduce((acc, d) => acc + d.minutes, 0))
);

/* ===== PAGINATION FOR DAY TABLES ===== */
const dayPagination = ref({ page: 1, rowsPerPage: 0 });
const tableFilterProxy = ref(""); // para evitar warnings

/* ===== LOAD ===== */
async function reload() {
  if (!userId.value) {
    error.value = "No se encontró el usuario.";
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const resp = await asistenciaStore.fetchHistorialEmpleado({
      employeeId: userId.value,
      from: range.value?.from || undefined,
      to: range.value?.to || undefined,
    });
    raw.value = resp?.asistencias || [];
  } catch (e) {
    error.value = e?.message || "No se pudo cargar el historial";
  } finally {
    loading.value = false;
  }
}

/* ===== EXPORTS / ACTIONS ===== */
async function exportExcel() {
  if (!userId.value) return;
  exporting.value = true;
  try {
    await asistenciaStore.exportEmployeeExcel({
      employeeId: userId.value,
      from: range.value?.from || undefined,
      to: range.value?.to || undefined,
    });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e?.message || "No se pudo exportar",
    });
  } finally {
    exporting.value = false;
  }
}
function exportDayCSV(day) {
  const header = ["Fecha", "Hora", "Tipo", "Ánimo", "Nota", "Lat", "Lng"];
  const lines = day.rows.map((r) => {
    const d = formatDate(r.timestamp),
      h = formatTime(r.timestamp);
    const lat = r.ubicacion?.lat ?? "",
      lng = r.ubicacion?.lng ?? "";
    return [d, h, r.tipo, r.mood, (r.note || "").replace(/\n/g, " "), lat, lng]
      .map((s) => `"${String(s).replace(/"/g, '""')}"`)
      .join(",");
  });
  downloadText(
    `asistencia_${day.dateISO}.csv`,
    [header.join(","), ...lines].join("\n")
  );
}
function exportCSV() {
  const header = ["Fecha", "Hora", "Tipo", "Ánimo", "Nota", "Lat", "Lng"];
  const lines = rows.value.map((r) => {
    const d = formatDate(r.timestamp),
      h = formatTime(r.timestamp);
    const lat = r.ubicacion?.lat ?? "",
      lng = r.ubicacion?.lng ?? "";
    return [d, h, r.tipo, r.mood, (r.note || "").replace(/\n/g, " "), lat, lng]
      .map((s) => `"${String(s).replace(/"/g, '""')}"`)
      .join(",");
  });
  downloadText("asistencia.csv", [header.join(","), ...lines].join("\n"));
}
function printTable() {
  window.print();
}
async function copySummary() {
  const text = `Historial (${periodLabel.value})\nDías: ${dayCount.value}\nMarcas: ${rows.value.length}\nHoras totales: ${totalWorkedHuman.value}`;
  try {
    await navigator.clipboard.writeText(text);
    $q.notify({ type: "positive", message: "Resumen copiado" });
  } catch {
    $q.notify({ type: "warning", message: "No se pudo copiar" });
  }
}
function copyDay(day) {
  const lines = day.rows.map(
    (r) =>
      `${formatTime(r.timestamp)} · ${cap(r.tipo)} · ${moodLabel(r.mood)} · ${
        r.note || "—"
      }`
  );
  const text =
    `${formatDateHuman(day.dateISO)} · Total: ${day.totalHuman}\n` +
    lines.join("\n");
  navigator.clipboard.writeText(text);
  $q.notify({ type: "positive", message: "Día copiado" });
}

/* ===== UTILS ===== */
function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
function formatDate(ts) {
  return new Date(ts).toLocaleDateString("es-CL");
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDateHuman(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function moodLabel(m) {
  return (
    {
      great: "Excelente",
      good: "Bien",
      ok: "Normal",
      tired: "Cansado",
      bad: "Mal",
    }[m] ||
    m ||
    "—"
  );
}
function moodIcon(m) {
  return (
    {
      great: "mood",
      good: "sentiment_very_satisfied",
      ok: "sentiment_satisfied",
      tired: "sentiment_dissatisfied",
      bad: "sentiment_very_dissatisfied",
    }[m] || "mood"
  );
}
function moodColor(m) {
  return (
    {
      great: "primary",
      good: "positive",
      ok: "info",
      tired: "warning",
      bad: "negative",
    }[m] || "grey"
  );
}
function toHumanMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}
function mapsLink(u) {
  return `https://maps.google.com/?q=${Number(u.lat)},${Number(u.lng)}`;
}
function locToText(u) {
  const lat = Number(u?.lat),
    lng = Number(u?.lng),
    acc = u?.acc;
  const base =
    isFinite(lat) && isFinite(lng)
      ? `lat ${lat.toFixed(5)}, lng ${lng.toFixed(5)}`
      : "—";
  return acc ? `${base} (±${Math.round(acc)}m)` : base;
}
function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ===== INIT ===== */
const subHeader = computed(
  () => `${rows.value.length} registros filtrados · ${dayCount.value} días`
);
onMounted(() => {
  if (rangePreset.value !== "custom") setPresetDates(rangePreset.value);
  reload();
});
</script>

<style scoped>
.header-actions {
  padding: 6px 10px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--q-primary) 6%, transparent);
}
.rk-date :deep(.q-field__control) {
  border-radius: 10px;
}
.day-header {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 12px;
  margin-bottom: 4px;
}
.ellipsis {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media print {
  .header-actions,
  .rk-date,
  .q-btn,
  .q-banner {
    display: none !important;
  }
  .q-page {
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
  }
}
</style>
